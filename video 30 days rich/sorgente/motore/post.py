# -*- coding: utf-8 -*-
"""Post-produzione: bloom (OpenCV) + kernel numba unico per tonemapping filmico,
grading, vignetta, grana, dissolvenze, dithering e quantizzazione."""
import math
import numpy as np
import cv2
from numba import njit, prange
from .base import W, H

cv2.setNumThreads(1)

# LUT tonemap ACES + gamma su scala logaritmica dell'ingresso
_LUT_N = 4096
_LUT_MAX = 64.0


def _build_lut():
    x = (np.linspace(0, math.sqrt(_LUT_MAX), _LUT_N) ** 2).astype(np.float64)
    a, b, c, d, e = 2.51, 0.03, 2.43, 0.59, 0.14
    y = np.clip((x * (a * x + b)) / (x * (c * x + d) + e), 0, 1)
    return np.power(y, 1 / 2.2).astype(np.float32)


LUT = _build_lut()
LUT_SCALE = (_LUT_N - 1) / math.sqrt(_LUT_MAX)

_yy, _xx = np.mgrid[0:H, 0:W].astype(np.float32)
VIGN_R2 = (((_xx - W / 2) / (W / 2)) ** 2 * 0.85 + ((_yy - H / 2) / (H / 2)) ** 2 * 0.65).astype(np.float32)
del _yy, _xx
_rng = np.random.default_rng(1234)
NOISE_FR = [(_rng.random((H, W), dtype=np.float32) - 0.5) for _ in range(4)]
GRAIN_FR = [cv2.resize(_rng.standard_normal((H // 2, W // 2)).astype(np.float32), (W, H), interpolation=cv2.INTER_LINEAR) for _ in range(4)]


def bloom_layer(img, threshold=1.0, knee=0.6, levels=6, radius=1.0):
    small = cv2.resize(img, (W // 2, H // 2), interpolation=cv2.INTER_AREA)
    lum = np.maximum(np.maximum(small[..., 0], small[..., 1]), small[..., 2])
    soft = np.clip(lum - threshold + knee, 0, 2 * knee)
    soft = soft * soft / (4 * knee + 1e-5)
    contrib = np.maximum(soft, lum - threshold) / np.maximum(lum, 1e-5)
    cur = small * contrib[..., None]
    downs = []
    for _ in range(levels):
        cur = cv2.GaussianBlur(cur, (0, 0), 1.2 * radius)
        downs.append(cur)
        if cur.shape[1] < 16:
            break
        cur = cv2.resize(cur, (max(1, cur.shape[1] // 2), max(1, cur.shape[0] // 2)), interpolation=cv2.INTER_AREA)
    acc = downs[-1]
    for dd in reversed(downs[:-1]):
        acc = cv2.resize(acc, (dd.shape[1], dd.shape[0]), interpolation=cv2.INTER_LINEAR) + dd
    acc = cv2.resize(acc, (W, H), interpolation=cv2.INTER_LINEAR)
    return acc * (1.0 / len(downs))


@njit(parallel=True, fastmath=True, cache=True)
def _finish_kernel(img, bl, out, lut, lut_scale, prm, vr2, noise, grain):
    exposure, bstr, sat, contrast, vign, grn, white, fade, to, lb = (prm[0], prm[1], prm[2], prm[3], prm[4],
                                                                     prm[5], prm[6], prm[7], prm[8], prm[9])
    liftr, liftg, liftb, gainr, gaing, gainb = prm[10], prm[11], prm[12], prm[13], prm[14], prm[15]
    Hh = img.shape[0]
    Ww = img.shape[1]
    nlut = lut.shape[0]
    bh = int(lb * Hh * 0.5 + 0.5)
    for j in prange(Hh):
        for i in range(Ww):
            if j < bh or j >= Hh - bh:
                out[j, i, 0] = 0
                out[j, i, 1] = 0
                out[j, i, 2] = 0
                continue
            c = np.empty(3, np.float32)
            for k in range(3):
                v = (img[j, i, k] + bl[j, i, k] * bstr) * exposure
                if v < 0.0:
                    v = 0.0
                f = math.sqrt(v) * lut_scale
                if f >= nlut - 1:
                    c[k] = lut[nlut - 1]
                else:
                    ii = int(f)
                    fr = f - ii
                    c[k] = lut[ii] * (1 - fr) + lut[ii + 1] * fr
            lum = c[0] * 0.2126 + c[1] * 0.7152 + c[2] * 0.0722
            if to > 0.0:
                sh = (1 - lum) * (1 - lum) * to * 0.06
                hi = lum * lum * to * 0.05
                c[0] += sh * -0.6 + hi * 0.5
                c[1] += sh * 0.15 + hi * 0.18
                c[2] += sh * 0.45 + hi * -0.4
            for k in range(3):
                c[k] = (c[k] - 0.5) * contrast + 0.5
            lum = c[0] * 0.2126 + c[1] * 0.7152 + c[2] * 0.0722
            for k in range(3):
                c[k] = lum + (c[k] - lum) * sat
            c[0] = c[0] * gainr + liftr * (1 - c[0])
            c[1] = c[1] * gaing + liftg * (1 - c[1])
            c[2] = c[2] * gainb + liftb * (1 - c[2])
            r2 = vr2[j, i]
            if r2 > 1.6:
                r2 = 1.6
            vv = 1.0 - vign * r2 ** 1.25
            g = grain[j, i] * grn
            for k in range(3):
                x = c[k] * vv
                x = x + g * (0.35 + 0.65 * (1 - x))
                x = x + (1 - x) * white
                x = x * fade
                x = x * 255.0 + noise[j, i]
                if x < 0.0:
                    x = 0.0
                elif x > 255.0:
                    x = 255.0
                out[j, i, k] = np.uint8(x)


def streak_layer(img, threshold=2.0, length=60.0):
    small = cv2.resize(img, (W // 4, H // 4), interpolation=cv2.INTER_AREA)
    lum = np.maximum(np.maximum(small[..., 0], small[..., 1]), small[..., 2])
    k = np.clip(lum - threshold, 0, None) / np.maximum(lum, 1e-5)
    src = small * k[..., None]
    s = cv2.GaussianBlur(src, (0, 0), sigmaX=length / 4, sigmaY=0.6)
    s = s * np.array([0.55, 0.75, 1.25], np.float32)
    return cv2.resize(s, (W, H), interpolation=cv2.INTER_LINEAR)


def finish(img, exposure=1.0, bloom_strength=0.55, bloom_threshold=1.0, bloom_radius=1.0, streaks=0.0,
           saturation=1.05, contrast=1.04, lift=(0.0, 0.0, 0.0), gain=(1.0, 1.0, 1.0),
           vignette=0.35, aberration=0.0, grain=0.012, letterbox=0.0, fade=1.0, white=0.0,
           frame_index=0, teal_orange=0.25, out=None):
    """img: float32 HxWx3 lineare HDR -> uint8 HxWx3 sRGB."""
    img = np.ascontiguousarray(img, np.float32)
    if bloom_strength > 0:
        bl = bloom_layer(img, threshold=bloom_threshold, radius=bloom_radius)
        if streaks > 0:
            bl += streak_layer(img) * (streaks / max(bloom_strength, 1e-3))
    elif streaks > 0:
        bl = streak_layer(img)
        bloom_strength = streaks
    else:
        bl = np.zeros_like(img)
    if out is None:
        out = np.empty((H, W, 3), np.uint8)
    prm = np.array([exposure, bloom_strength, saturation, contrast, vignette, grain, white, fade, teal_orange, letterbox,
                    lift[0], lift[1], lift[2], gain[0], gain[1], gain[2]], np.float32)
    _finish_kernel(img, bl, out, LUT, np.float32(LUT_SCALE), prm, VIGN_R2, NOISE_FR[frame_index % 4], GRAIN_FR[frame_index % 4])
    if aberration > 0:
        s = aberration
        M_r = cv2.getRotationMatrix2D((W / 2, H / 2), 0, 1 + s)
        M_b = cv2.getRotationMatrix2D((W / 2, H / 2), 0, 1 - s)
        out[..., 0] = cv2.warpAffine(np.ascontiguousarray(out[..., 0]), M_r, (W, H), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT)
        out[..., 2] = cv2.warpAffine(np.ascontiguousarray(out[..., 2]), M_b, (W, H), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT)
    return out
