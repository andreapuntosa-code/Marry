# -*- coding: utf-8 -*-
"""Tela HDR (skia F16) + sprite di luce additivi + primitive 3D."""
import math
import numpy as np
import skia
from .base import W, H

SAMPLING = skia.SamplingOptions(skia.FilterMode.kLinear)


class Tela:
    """Superficie skia RGBA F16 premoltiplicata condivisa con un array numpy."""

    def __init__(self, w=W, h=H):
        self.w, self.h = w, h
        self.arr = np.zeros((h, w, 4), np.float16)
        self.arr[..., 3] = 1
        self.surface = skia.Surface(self.arr, colorType=skia.kRGBA_F16_ColorType, alphaType=skia.kPremul_AlphaType)
        self.c = self.surface.getCanvas()

    def set_rgb(self, rgb):
        self.arr[..., :3] = rgb
        self.arr[..., 3] = 1

    def clear(self, rgb=(0, 0, 0)):
        self.arr[..., 0] = rgb[0]
        self.arr[..., 1] = rgb[1]
        self.arr[..., 2] = rgb[2]
        self.arr[..., 3] = 1

    def rgb(self):
        return self.arr[..., :3].astype(np.float32)


def col4(rgb, a=1.0):
    return skia.Color4f(float(rgb[0]), float(rgb[1]), float(rgb[2]), float(a))


def paint(rgb=(1, 1, 1), a=1.0, stroke=None, aa=True, blur=0.0, cap="round"):
    p = skia.Paint(AntiAlias=aa)
    p.setColor4f(col4(rgb, a))
    if stroke is not None:
        p.setStyle(skia.Paint.kStroke_Style)
        p.setStrokeWidth(float(stroke))
        p.setStrokeCap(skia.Paint.kRound_Cap if cap == "round" else skia.Paint.kButt_Cap)
        p.setStrokeJoin(skia.Paint.kRound_Join)
    if blur > 0:
        p.setMaskFilter(skia.MaskFilter.MakeBlur(skia.kNormal_BlurStyle, float(blur)))
    return p


# ------------------------------------------------------------------ sprite additivi HDR
_SPR = {}


def _radial(size, fn):
    c = (size - 1) / 2
    yy, xx = np.mgrid[0:size, 0:size].astype(np.float32)
    r = np.sqrt((xx - c) ** 2 + (yy - c) ** 2) / c
    return fn(r) * np.clip((1 - r) / 0.12, 0, 1)


PROFILI = {
    # alone morbido largo
    "alone": lambda r: np.exp(-(r / 0.42) ** 2) * 0.85 + np.exp(-r / 0.18) * 0.35,
    # nucleo concentrato
    "nucleo": lambda r: np.exp(-(r / 0.22) ** 2),
    # disco morbido (per cerchi di luce piena)
    "disco": lambda r: 1.0 / (1.0 + np.exp((r - 0.7) / 0.06)),
    # anello (impulso di comunicazione)
    "anello": lambda r: np.exp(-((r - 0.82) / 0.05) ** 2),
    # stella/lens flare (croce)
    "stella": None,
}


def sprite(kind="alone", size=128):
    key = (kind, size)
    s = _SPR.get(key)
    if s is not None:
        return s
    if kind == "stella":
        c = (size - 1) / 2
        yy, xx = np.mgrid[0:size, 0:size].astype(np.float32)
        dx, dy = np.abs(xx - c) / c, np.abs(yy - c) / c
        prof = (np.exp(-dy / 0.012) * np.exp(-dx / 0.45) + np.exp(-dx / 0.012) * np.exp(-dy / 0.45)) * 0.8
        r = np.sqrt(dx ** 2 + dy ** 2)
        prof += np.exp(-(r / 0.08) ** 2)
        prof *= np.clip((1 - r) / 0.1, 0, 1)
    else:
        prof = _radial(size, PROFILI[kind])
    a = np.zeros((size, size, 4), np.float16)
    a[..., 0] = prof
    a[..., 1] = prof
    a[..., 2] = prof
    a[..., 3] = 0  # alfa 0 = puramente additivo (premoltiplicato)
    img = skia.Image.fromarray(a, colorType=skia.kRGBA_F16_ColorType, alphaType=skia.kPremul_AlphaType)
    _SPR[key] = img
    return img


def _tint_filter(rgb, k):
    return skia.ColorFilters.Matrix([float(rgb[0] * k), 0, 0, 0, 0,
                                     0, float(rgb[1] * k), 0, 0, 0,
                                     0, 0, float(rgb[2] * k), 0, 0,
                                     0, 0, 0, 1, 0])


_TINT = {}


def sprite_tinted(kind, rgb, size=128):
    """Sprite già colorato (cache) — i filtri colore di skia saturano a 1, quindi pre-coloriamo."""
    key = (kind, size, round(float(rgb[0]), 3), round(float(rgb[1]), 3), round(float(rgb[2]), 3))
    s = _TINT.get(key)
    if s is not None:
        return s
    base = sprite(kind, size)
    a = base.toarray(colorType=skia.kRGBA_F16_ColorType).astype(np.float32) if False else None
    # ricostruisci dal profilo
    if kind == "stella":
        # rigenera e colora
        img0 = sprite(kind, size)
    prof = _profile_array(kind, size)
    arr = np.zeros((size, size, 4), np.float16)
    arr[..., 0] = prof * rgb[0]
    arr[..., 1] = prof * rgb[1]
    arr[..., 2] = prof * rgb[2]
    img = skia.Image.fromarray(arr, colorType=skia.kRGBA_F16_ColorType, alphaType=skia.kPremul_AlphaType)
    if len(_TINT) > 600:
        _TINT.clear()
    _TINT[key] = img
    return img


_PROF = {}


def _profile_array(kind, size):
    key = (kind, size)
    p = _PROF.get(key)
    if p is None:
        if kind == "stella":
            c = (size - 1) / 2
            yy, xx = np.mgrid[0:size, 0:size].astype(np.float32)
            dx, dy = np.abs(xx - c) / c, np.abs(yy - c) / c
            p = (np.exp(-dy / 0.012) * np.exp(-dx / 0.45) + np.exp(-dx / 0.012) * np.exp(-dy / 0.45)) * 0.8
            r = np.sqrt(dx ** 2 + dy ** 2)
            p += np.exp(-(r / 0.08) ** 2)
            p *= np.clip((1 - r) / 0.1, 0, 1)
        else:
            p = _radial(size, PROFILI[kind])
        _PROF[key] = p.astype(np.float32)
        p = _PROF[key]
    return p


def glow(tela, x, y, radius, rgb, intensity=1.0, kind="alone", size=128):
    """Disegna una luce additiva HDR centrata in (x,y) con raggio in pixel."""
    if radius < 0.5 or intensity <= 0:
        return
    if x + radius < 0 or x - radius > tela.w or y + radius < 0 or y - radius > tela.h:
        return
    q = 0.05  # quantizza l'intensità per riusare la cache
    k = max(q, round(intensity / q) * q) if intensity < 4 else round(intensity, 1)
    img = sprite_tinted(kind, np.asarray(rgb) * k, size)
    tela.c.drawImageRect(img, skia.Rect(x - radius, y - radius, x + radius, y + radius), SAMPLING)


# ------------------------------------------------------------------ poligoni 3D
def clip_near(cam_pts_z, pts3, near=0.15):
    """Clip di un poligono contro il piano near (in profondità camera)."""
    out = []
    n = len(pts3)
    for i in range(n):
        a, b = pts3[i], pts3[(i + 1) % n]
        za, zb = cam_pts_z[i], cam_pts_z[(i + 1) % n]
        if za >= near:
            out.append(a)
        if (za >= near) != (zb >= near):
            tt = (near - za) / (zb - za)
            out.append(a + (b - a) * tt)
    return out


def path_from(xs, ys, close=True):
    p = skia.Path()
    p.moveTo(float(xs[0]), float(ys[0]))
    for i in range(1, len(xs)):
        p.lineTo(float(xs[i]), float(ys[i]))
    if close:
        p.close()
    return p
