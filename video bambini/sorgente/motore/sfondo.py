# -*- coding: utf-8 -*-
"""
Shader per-pixel (numba) di cielo + terreno della simulazione:
griglia anti-aliasata, nebbia, stelle, nuvole con parallasse, pozze di luce
degli agenti, lightmap e decal in coordinate mondo, bordo del mondo (griglia
verticale), lampo del "salvataggio automatico".
"""
import math
import numpy as np
import numba
from numba import njit, prange

# ---------------------------------------------------------------- parametri
IDX = {}
_names = [
    "zen_r", "zen_g", "zen_b", "hor_r", "hor_g", "hor_b", "glow_r", "glow_g", "glow_b", "glow_w",
    "star_int", "star_thr", "time",
    "gnd_r", "gnd_g", "gnd_b", "gnd_amb",
    "grid_int", "grid_sp", "grid_major", "grid_r", "grid_g", "grid_b", "grid_w",
    "fog_den", "fog_r", "fog_g", "fog_b",
    "cloud_amt", "cloud_scale", "cloud_r", "cloud_g", "cloud_b", "wind_x", "wind_z", "cloud_h",
    "flash_amt", "flash_pos", "flash_w",
    "lightning",
    "edge_on", "edge_z", "edge_glitch", "edge_r", "edge_g", "edge_b",
    "lm_int", "decal_int", "gnd_noise", "grid_fade",
    "neb_amt", "neb_r", "neb_g", "neb_b",
    "max_dist", "void_amt", "cloud_light",
    "pool_scale", "rain",
]
for _i, _n in enumerate(_names):
    IDX[_n] = _i
NPARAM = len(_names)
I_ZEN_R = 0
I_ZEN_G = 1
I_ZEN_B = 2
I_HOR_R = 3
I_HOR_G = 4
I_HOR_B = 5
I_GLOW_R = 6
I_GLOW_G = 7
I_GLOW_B = 8
I_GLOW_W = 9
I_STAR_INT = 10
I_STAR_THR = 11
I_TIME = 12
I_GND_R = 13
I_GND_G = 14
I_GND_B = 15
I_GND_AMB = 16
I_GRID_INT = 17
I_GRID_SP = 18
I_GRID_MAJOR = 19
I_GRID_R = 20
I_GRID_G = 21
I_GRID_B = 22
I_GRID_W = 23
I_FOG_DEN = 24
I_FOG_R = 25
I_FOG_G = 26
I_FOG_B = 27
I_CLOUD_AMT = 28
I_CLOUD_SCALE = 29
I_CLOUD_R = 30
I_CLOUD_G = 31
I_CLOUD_B = 32
I_WIND_X = 33
I_WIND_Z = 34
I_CLOUD_H = 35
I_FLASH_AMT = 36
I_FLASH_POS = 37
I_FLASH_W = 38
I_LIGHTNING = 39
I_EDGE_ON = 40
I_EDGE_Z = 41
I_EDGE_GLITCH = 42
I_EDGE_R = 43
I_EDGE_G = 44
I_EDGE_B = 45
I_LM_INT = 46
I_DECAL_INT = 47
I_GND_NOISE = 48
I_GRID_FADE = 49
I_NEB_AMT = 50
I_NEB_R = 51
I_NEB_G = 52
I_NEB_B = 53
I_MAX_DIST = 54
I_VOID_AMT = 55
I_CLOUD_LIGHT = 56
I_POOL_SCALE = 57
I_RAIN = 58


def default_params():
    p = np.zeros(NPARAM, np.float64)
    def s(k, v):
        p[IDX[k]] = v
    for k, v in dict(zen_r=0.002, zen_g=0.003, zen_b=0.008, hor_r=0.018, hor_g=0.03, hor_b=0.07,
                     glow_r=0.04, glow_g=0.07, glow_b=0.14, glow_w=0.06, star_int=1.0, star_thr=0.9965,
                     gnd_r=0.010, gnd_g=0.013, gnd_b=0.02, gnd_amb=1.0,
                     grid_int=0.45, grid_sp=4.0, grid_major=5, grid_r=0.07, grid_g=0.42, grid_b=0.62, grid_w=0.018,
                     fog_den=0.0035, fog_r=-1, fog_g=-1, fog_b=-1,
                     cloud_amt=0.0, cloud_scale=600.0, cloud_r=0.05, cloud_g=0.06, cloud_b=0.10,
                     wind_x=6.0, wind_z=2.0, cloud_h=900.0,
                     flash_amt=0.0, flash_pos=0.0, flash_w=0.08, lightning=0.0,
                     edge_on=0.0, edge_z=1e9, edge_glitch=0.0, edge_r=0.2, edge_g=0.9, edge_b=1.2,
                     lm_int=1.0, decal_int=1.0, gnd_noise=0.35, grid_fade=900.0,
                     neb_amt=0.0, neb_r=0.05, neb_g=0.02, neb_b=0.09, max_dist=6000.0, void_amt=0.0,
                     cloud_light=0.0, pool_scale=1.0, rain=0.0).items():
        s(k, v)
    return p


def set_params(p, **kw):
    for k, v in kw.items():
        if k.endswith("_rgb"):
            base = k[:-4]
            p[IDX[base + "_r"]], p[IDX[base + "_g"]], p[IDX[base + "_b"]] = v
        else:
            p[IDX[k]] = v
    return p


def make_noise_tex(n=512, seed=7, octaves=6):
    """Rumore fBm tileable (value noise con interpolazione smooth)."""
    rng = np.random.default_rng(seed)
    out = np.zeros((n, n), np.float32)
    amp, tot = 1.0, 0.0
    for o in range(octaves):
        cells = 4 * 2 ** o
        g = rng.random((cells, cells)).astype(np.float32)
        # upsample smooth tileable
        x = np.arange(n) * cells / n
        i0 = np.floor(x).astype(int) % cells
        i1 = (i0 + 1) % cells
        f = x - np.floor(x)
        f = f * f * (3 - 2 * f)
        a = g[i0][:, i0] * (1 - f)[None, :] + g[i0][:, i1] * f[None, :]
        b = g[i1][:, i0] * (1 - f)[None, :] + g[i1][:, i1] * f[None, :]
        layer = a * (1 - f)[:, None] + b * f[:, None]
        out += layer * amp
        tot += amp
        amp *= 0.5
    out /= tot
    out = (out - out.min()) / (out.max() - out.min())
    return out.astype(np.float32)


NOISE = make_noise_tex()
EMPTY3 = np.zeros((2, 2, 3), np.float32)
NO_LIGHTS = np.zeros((0, 8), np.float64)


@njit(fastmath=True, cache=True, inline="always")
def _hash2(x, y):
    h = math.sin(x * 127.1 + y * 311.7) * 43758.5453
    return h - math.floor(h)


@njit(fastmath=True, cache=True, inline="always")
def _noise(tex, u, v):
    n = tex.shape[0]
    x = u * n
    y = v * n
    xf = math.floor(x)
    yf = math.floor(y)
    fx = x - xf
    fy = y - yf
    i0 = int(xf) % n
    j0 = int(yf) % n
    i1 = (i0 + 1) % n
    j1 = (j0 + 1) % n
    a = tex[j0, i0] * (1 - fx) + tex[j0, i1] * fx
    b = tex[j1, i0] * (1 - fx) + tex[j1, i1] * fx
    return a * (1 - fy) + b * fy


@njit(fastmath=True, cache=True, inline="always")
def _tex3(tex, b, x, z, out):
    """Campiona texture RGB in coordinate mondo; b=(x0,z0,x1,z1)."""
    hh = tex.shape[0]
    ww = tex.shape[1]
    u = (x - b[0]) / (b[2] - b[0]) * ww - 0.5
    v = (z - b[1]) / (b[3] - b[1]) * hh - 0.5
    if u < 0 or v < 0 or u >= ww - 1 or v >= hh - 1:
        out[0] = 0.0
        out[1] = 0.0
        out[2] = 0.0
        return
    i = int(u)
    j = int(v)
    fx = u - i
    fy = v - j
    for c in range(3):
        a = tex[j, i, c] * (1 - fx) + tex[j, i + 1, c] * fx
        bb = tex[j + 1, i, c] * (1 - fx) + tex[j + 1, i + 1, c] * fx
        out[c] = a * (1 - fy) + bb * fy


@njit(fastmath=True, cache=True, inline="always")
def _gridline(coord, sp, w, fw):
    m = coord / sp
    d = abs(m - math.floor(m + 0.5)) * sp
    cov = (w - d) / max(fw, 1e-6) + 0.5
    if cov < 0.0:
        cov = 0.0
    elif cov > 1.0:
        cov = 1.0
    # dissolvenza verso copertura media quando la griglia è sotto-campionata
    fade = (fw / sp - 0.2) / 0.3
    if fade < 0.0:
        fade = 0.0
    elif fade > 1.0:
        fade = 1.0
    return cov * (1 - fade) + min(1.0, 2 * w / sp) * fade


@njit(parallel=True, fastmath=True, cache=True)
def render_bg(out, cam, P, lights, noise, lm, lmb, dc0, dc1, dcb):
    H = out.shape[0]
    W = out.shape[1]
    cx, cy, cz = cam[0], cam[1], cam[2]
    fx_, fy_, fz_ = cam[3], cam[4], cam[5]
    rx, ry, rz = cam[6], cam[7], cam[8]
    ux, uy, uz = cam[9], cam[10], cam[11]
    tanf = cam[12]
    aspect = cam[13]
    pixang = 2.0 * tanf / H
    t = P[12]
    zen = (P[0], P[1], P[2])
    hor = (P[3], P[4], P[5])
    glow = (P[6], P[7], P[8])
    gloww = P[9]
    fogc0 = P[25]
    nl = lights.shape[0]
    for j in prange(H):
        tmp = np.zeros(3)
        sy0 = (1.0 - 2.0 * (j + 0.5) / H) * tanf
        for i in range(W):
            sx = (2.0 * (i + 0.5) / W - 1.0) * tanf * aspect
            dx = fx_ + rx * sx + ux * sy0
            dy = fy_ + ry * sx + uy * sy0
            dz = fz_ + rz * sx + uz * sy0
            inv = 1.0 / math.sqrt(dx * dx + dy * dy + dz * dz)
            dx *= inv
            dy *= inv
            dz *= inv
            # ------------------------------------------------ cielo
            h = dy
            e = h / 0.55
            if e < 0.0:
                e = 0.0
            elif e > 1.0:
                e = 1.0
            e = e ** 0.7
            r = hor[0] * (1 - e) + zen[0] * e
            g = hor[1] * (1 - e) + zen[1] * e
            b = hor[2] * (1 - e) + zen[2] * e
            gl = math.exp(-abs(h) / gloww)
            r += glow[0] * gl
            g += glow[1] * gl
            b += glow[2] * gl
            if h > 0.0:
                # nebulosa / aurora (rumore in coordinate direzione)
                if P[50] > 0.0:
                    nn = _noise(noise, dx * 0.35 + 0.5 + t * 0.002, dz * 0.35 + h * 0.6)
                    band = math.exp(-((h - 0.25) ** 2) / 0.02)
                    k = P[50] * max(0.0, nn - 0.35) * 2.2 * band
                    r += P[51] * k
                    g += P[52] * k
                    b += P[53] * k
                # stelle
                if P[10] > 0.0:
                    su = dx / (1.0 + h)
                    sv = dz / (1.0 + h)
                    cs = 0.0028
                    gx = su / cs
                    gy = sv / cs
                    ix = math.floor(gx)
                    iy = math.floor(gy)
                    hs = _hash2(ix, iy)
                    if hs > P[11]:
                        ox = 0.25 + 0.5 * _hash2(ix + 3.1, iy + 7.7)
                        oy = 0.25 + 0.5 * _hash2(ix + 9.2, iy + 1.3)
                        sc2 = 2.0 / (1.0 + h)
                        ddx = (gx - ix - ox) * cs * sc2
                        ddy = (gy - iy - oy) * cs * sc2
                        dd = math.sqrt(ddx * ddx + ddy * ddy) / pixang
                        br = (hs - P[11]) / (1.0 - P[11])
                        br = br * br * br * 6.0 + 0.15
                        tw = 0.75 + 0.25 * math.sin(t * (1.5 + 3 * hs) + hs * 50.0)
                        k = P[10] * br * tw * math.exp(-dd * dd * 1.6) * min(1.0, h * 12)
                        r += k * 0.85
                        g += k * 0.9
                        b += k * 1.0
                # nuvole con parallasse
                if P[28] > 0.0 and h > 0.015:
                    tt = P[35] / h
                    ucl = (cx + dx * tt) / P[29] + t * P[33] / P[29]
                    vcl = (cz + dz * tt) / P[29] + t * P[34] / P[29]
                    d1 = _noise(noise, ucl * 0.5, vcl * 0.5)
                    d2 = _noise(noise, ucl * 2.1 + 0.3, vcl * 2.1 + 0.7)
                    dens = d1 * 0.7 + d2 * 0.3
                    c = (dens - (1.0 - P[28] * 0.75)) * 3.0
                    if c > 0.0:
                        if c > 1.0:
                            c = 1.0
                        fade = min(1.0, h * 6.0)
                        c *= fade
                        lit = P[56] + P[39] * (0.6 + 0.4 * d2)
                        cr = P[30] * (1 + lit * 6.0)
                        cg = P[31] * (1 + lit * 6.0)
                        cb = P[32] * (1 + lit * 6.0)
                        r = r * (1 - c) + cr * c
                        g = g * (1 - c) + cg * c
                        b = b * (1 - c) + cb * c
                if P[39] > 0.0:
                    k = P[39] * 0.08 * (0.3 + h)
                    r += k * 0.7
                    g += k * 0.75
                    b += k * 1.0
            # lampo del salvataggio: fascia che attraversa il cielo
            if P[36] > 0.0:
                bandd = (dz * 0.8 + dx * 0.6) - P[37]
                k = P[36] * (math.exp(-bandd * bandd / (P[38] * P[38])) * 2.5 + 0.25)
                r += k
                g += k
                b += k * 1.05
            fr = r
            fg = g
            fb = b
            if fogc0 < 0:
                fogr = hor[0] + glow[0] * 0.6
                fogg = hor[1] + glow[1] * 0.6
                fogb = hor[2] + glow[2] * 0.6
            else:
                fogr = P[25]
                fogg = P[26]
                fogb = P[27]
            # ------------------------------------------------ terreno
            tg = 1e30
            if dy < -1e-5:
                tg = -cy / dy
            if tg < P[54]:
                gx = cx + dx * tg
                gz = cz + dz * tg
                # footprint (derivate) per anti-aliasing
                sxn = (2.0 * (i + 1.5) / W - 1.0) * tanf * aspect
                ex = fx_ + rx * sxn + ux * sy0
                ey = fy_ + ry * sxn + uy * sy0
                ez = fz_ + rz * sxn + uz * sy0
                syn = (1.0 - 2.0 * (j + 1.5) / H) * tanf
                kx = fx_ + rx * sx + ux * syn
                ky = fy_ + ry * sx + uy * syn
                kz = fz_ + rz * sx + uz * syn
                fwx = 1e3
                fwz = 1e3
                if ey < -1e-6 and ky < -1e-6:
                    t1 = -cy / ey
                    t2 = -cy / ky
                    ax = abs(cx + ex * t1 - gx)
                    az_ = abs(cz + ez * t1 - gz)
                    bx = abs(cx + kx * t2 - gx)
                    bz = abs(cz + kz * t2 - gz)
                    fwx = ax + bx
                    fwz = az_ + bz
                fw = max(fwx, fwz)
                void = P[55]
                in_void = False
                if P[40] > 0.5 and gz > P[41]:
                    in_void = True
                # albedo con variazione di rumore
                nv = _noise(noise, gx * 0.004, gz * 0.004) * 0.6 + _noise(noise, gx * 0.03 + 0.3, gz * 0.03) * 0.4
                var = 1.0 + (nv - 0.5) * 2.0 * P[I_GND_NOISE]
                ar = P[13] * var
                ag = P[14] * var
                ab = P[15] * var
                amb = P[16]
                lr = amb
                lg = amb
                lb = amb
                # pozze di luce
                ps = P[57]
                for li in range(nl):
                    ddx2 = gx - lights[li, 0]
                    ddz2 = gz - lights[li, 2]
                    hy = lights[li, 1]
                    d2 = ddx2 * ddx2 + ddz2 * ddz2 + hy * hy
                    rad = lights[li, 6] * ps
                    q = 1.0 + d2 / (rad * rad)
                    if q > 900.0:
                        continue
                    kk = lights[li, 7] / (q * math.sqrt(q))
                    lr += lights[li, 3] * kk
                    lg += lights[li, 4] * kk
                    lb += lights[li, 5] * kk
                cr = ar * lr
                cg = ag * lg
                cb = ab * lb
                # lightmap (molte luci: folle, città)
                if P[46] > 0.0 and lm.shape[0] > 2:
                    _tex3(lm, lmb, gx, gz, tmp)
                    cr += tmp[0] * P[46]
                    cg += tmp[1] * P[46]
                    cb += tmp[2] * P[46]
                # griglia della simulazione
                if P[17] > 0.0:
                    sp = P[18]
                    w = P[23]
                    gfade = math.exp(-tg / P[I_GRID_FADE])
                    lx = _gridline(gx, sp, w, fwx)
                    lz = _gridline(gz, sp, w, fwz)
                    mj = sp * P[19]
                    mx = _gridline(gx, mj, w * 1.6, fwx)
                    mz = _gridline(gz, mj, w * 1.6, fwz)
                    gi = (max(lx, lz) * 0.45 + max(mx, mz) * 1.0) * P[17] * gfade
                    if in_void:
                        gi = gi * 3.0 + 0.02
                    cr += P[20] * gi
                    cg += P[21] * gi
                    cb += P[22] * gi
                # decal emissivo (glifi, crepe, strade)
                if P[47] > 0.0 and dc0.shape[0] > 2:
                    _tex3(dc0, dcb, gx, gz, tmp)
                    e0r = tmp[0]
                    e0g = tmp[1]
                    e0b = tmp[2]
                    _tex3(dc1, dcb, gx, gz, tmp)
                    cellw = (dcb[2] - dcb[0]) / dc0.shape[1]
                    mixk = fw / (cellw * 3.0)
                    if mixk > 1.0:
                        mixk = 1.0
                    cr += (e0r * (1 - mixk) + tmp[0] * mixk) * P[47]
                    cg += (e0g * (1 - mixk) + tmp[1] * mixk) * P[47]
                    cb += (e0b * (1 - mixk) + tmp[2] * mixk) * P[47]
                if in_void:
                    # oltre il bordo: il pavimento diventa vuoto, solo griglia
                    gl2 = _hash2(math.floor(gx / 6.0), math.floor(gz / 6.0) + math.floor(t * 8.0))
                    kk = 0.0
                    if gl2 > 1.0 - 0.08 * P[42]:
                        kk = 0.6 * P[42]
                    cr = cr * 0.15 + P[43] * (kk * 0.5)
                    cg = cg * 0.15 + P[44] * (kk * 0.5)
                    cb = cb * 0.15 + P[45] * (kk * 0.5)
                if void > 0.0:
                    cr *= (1 - void)
                    cg *= (1 - void)
                    cb *= (1 - void)
                # nebbia
                f = 1.0 - math.exp(-tg * P[24])
                fr = cr * (1 - f) + fogr * f
                fg = cg * (1 - f) + fogg * f
                fb = cb * (1 - f) + fogb * f
                # sfuma verso il cielo all'orizzonte lontano
                hz = tg / P[54]
                if hz > 0.7:
                    k2 = (hz - 0.7) / 0.3
                    fr = fr * (1 - k2) + r * k2
                    fg = fg * (1 - k2) + g * k2
                    fb = fb * (1 - k2) + b * k2
            # ------------------------------------------------ muro del bordo del mondo
            if P[40] > 0.5 and dz > 1e-4:
                tw = (P[41] - cz) / dz
                if tw > 0 and tw < tg:
                    wx = cx + dx * tw
                    wy = cy + dy * tw
                    if wy > 0.0:
                        fww = tw * pixang * 1.5
                        lx = _gridline(wx, 6.0, 0.08, fww)
                        ly = _gridline(wy, 6.0, 0.08, fww)
                        hfade = math.exp(-wy / 260.0)
                        scan = 0.7 + 0.3 * math.sin(wy * 0.15 - t * 3.0)
                        gi = (max(lx, ly) * 1.2 + 0.05) * hfade * scan
                        gl3 = _hash2(math.floor(wx / 9.0), math.floor(wy / 9.0) + math.floor(t * 6.0))
                        if gl3 > 1.0 - 0.05 * P[42]:
                            gi += 0.8 * hfade
                        atten = math.exp(-tw * 0.0012)
                        fr += P[43] * gi * atten
                        fg += P[44] * gi * atten
                        fb += P[45] * gi * atten
            # pioggia di energia / tempesta: striature
            if P[58] > 0.0:
                rs = _hash2(math.floor(i / 3.0), math.floor((j + t * 2400.0) / 60.0))
                if rs > 0.985:
                    k = P[58] * 0.08
                    fr += k * 0.6
                    fg += k * 0.8
                    fb += k * 1.2
            out[j, i, 0] = fr
            out[j, i, 1] = fg
            out[j, i, 2] = fb


def render_background(out, cam, params, lights=None, lightmap=None, lm_bounds=None, decal=None, decal_bounds=None):
    lights = NO_LIGHTS if lights is None or len(lights) == 0 else np.ascontiguousarray(lights, np.float64)
    lm = EMPTY3 if lightmap is None else lightmap
    lmb = np.array(lm_bounds if lm_bounds is not None else (0, 0, 1, 1), np.float64)
    if decal is None:
        d0 = d1 = EMPTY3
        dcb = np.array((0, 0, 1, 1), np.float64)
    else:
        d0, d1 = decal
        dcb = np.array(decal_bounds, np.float64)
    render_bg(out, cam.params(), params, lights, NOISE, lm, lmb, d0, d1, dcb)
    return out
