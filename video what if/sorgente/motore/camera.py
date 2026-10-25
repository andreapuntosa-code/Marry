# -*- coding: utf-8 -*-
"""Camera prospettica e proiezioni."""
import math
import numpy as np
from .base import W, H, lerp, ease_in_out, vnoise


def _norm(v):
    v = np.asarray(v, np.float64)
    n = np.linalg.norm(v)
    return v / n if n > 1e-12 else v


class Camera:
    def __init__(self, pos, target, fov=50.0, roll=0.0, w=W, h=H):
        self.pos = np.asarray(pos, np.float64)
        self.target = np.asarray(target, np.float64)
        self.fov = float(fov)
        self.roll = float(roll)
        self.w, self.h = w, h
        self._basis()

    def _basis(self):
        f = _norm(self.target - self.pos)
        up0 = np.array([0.0, 1.0, 0.0])
        if abs(f[1]) > 0.999:
            up0 = np.array([0.0, 0.0, 1.0])
        r = _norm(np.cross(f, up0))   # destra
        u = np.cross(r, f)
        if self.roll:
            c, s = math.cos(self.roll), math.sin(self.roll)
            r, u = r * c + u * s, -r * s + u * c
        self.fwd, self.right, self.up = f, r, u
        self.tanf = math.tan(math.radians(self.fov) / 2)
        self.focal = (self.h / 2) / self.tanf   # pixel per unità a profondità 1

    def project(self, P):
        """P (N,3) -> sx, sy, depth (array). depth<=0 = dietro la camera."""
        P = np.asarray(P, np.float64).reshape(-1, 3)
        d = P - self.pos
        z = d @ self.fwd
        x = d @ self.right
        y = d @ self.up
        zz = np.where(z > 1e-6, z, 1e-6)
        sx = self.w / 2 + x / zz * self.focal
        sy = self.h / 2 - y / zz * self.focal
        return sx, sy, z

    def project1(self, p):
        sx, sy, z = self.project(np.asarray(p)[None])
        return float(sx[0]), float(sy[0]), float(z[0])

    def scale(self, depth):
        """Pixel per unità mondo alla profondità data."""
        return self.focal / np.maximum(depth, 1e-6)

    def params(self):
        """Array per lo shader numba."""
        return np.array([*self.pos, *self.fwd, *self.right, *self.up, self.tanf, self.w / self.h], np.float64)


def cam_lerp(a, b, t, ease=ease_in_out):
    """Interpola due camere (dict o tuple pos,target,fov,roll)."""
    e = ease(t) if ease else t
    pa, ta, fa, ra = a
    pb, tb, fb, rb = b
    return Camera(lerp(np.asarray(pa, float), np.asarray(pb, float), e),
                  lerp(np.asarray(ta, float), np.asarray(tb, float), e),
                  lerp(fa, fb, e), lerp(ra, rb, e))


def orbit(center, radius, height, angle, fov=45.0, look_offset=(0, 0, 0), roll=0.0):
    c = np.asarray(center, float)
    pos = c + np.array([math.cos(angle) * radius, height, math.sin(angle) * radius])
    return Camera(pos, c + np.asarray(look_offset, float), fov, roll)


def shake(cam, t, amount=0.0, freq=1.3, seed=3):
    """Leggero movimento a mano (handheld) + scosse."""
    if amount <= 0:
        return cam
    dx = vnoise(t * freq, seed) * amount
    dy = vnoise(t * freq * 1.1, seed + 9) * amount
    dz = vnoise(t * freq * 0.9, seed + 21) * amount
    tgt = cam.target + cam.right * dx * 2 + cam.up * dy * 2
    pos = cam.pos + np.array([dz, dy * 0.5, dx]) * 0.3
    return Camera(pos, tgt, cam.fov, cam.roll + vnoise(t * freq * 0.7, seed + 5) * amount * 0.01)
