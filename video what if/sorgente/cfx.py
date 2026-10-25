# -*- coding: utf-8 -*-
"""Graphics of the What-if Shorts (1080x1920): the 2D explainer scenes (spinning globe, oceans, atoms, the planet
blowing apart, a supernova, a stopwatch, the tangent drift, sunlight travelling, orbits, a knot untying) and the
overlays drawn over every frame: the hook, word-by-word captions (current word highlighted), big stat cards, the
10-second timer, the 8:20 clock and the follow card."""
import math, os
import numpy as np
import cv2
import skia
import overlays as OV
import wordtimes

W, H = 1080, 1920
P = OV.P
HERE = os.path.dirname(os.path.abspath(__file__))
AVATAR = None


def clamp(x, a=0.0, b=1.0): return max(a, min(b, x))
def eob(u):
    u = clamp(u); c1, c3 = 1.70158, 2.70158
    return 1 + c3 * (u - 1) ** 3 + c1 * (u - 1) ** 2
def eio(u): u = clamp(u); return u * u * (3 - 2 * u)


def txt(c, s, x, y, size, fill='#ffffff', a=1.0, scale=1.0, align='center', stroke='#000000', sw=None, key='poppins', rot=0.0, shadow=True):
    if a <= 0.01 or not s: return 0
    f = OV.font(key, size); w = OV.text_width(s, key, size)
    x0 = x - w / 2 if align == 'center' else (x - w if align == 'right' else x)
    c.save(); c.translate(x, y - size * 0.35); c.rotate(rot); c.scale(scale, scale); c.translate(-x, -(y - size * 0.35))
    if shadow: c.drawString(s, x0 + size * 0.03, y + size * 0.06, f, P('#000000', 0.45 * a, blur=size * 0.08))
    if sw != 0: c.drawString(s, x0, y, f, P(stroke, a, stroke=sw or size * 0.13))
    c.drawString(s, x0, y, f, P(fill, a))
    c.restore()
    return w


def C(h, a=1.0):
    """hex colour with optional alpha byte (#rrggbbaa) times a"""
    h = h.lstrip('#'); al = int(h[6:8], 16) / 255 if len(h) == 8 else 1.0
    return skia.Color(int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16), int(255 * clamp(al * a)))


def lin(x0, y0, x1, y1, cols, pos=None):
    p = skia.Paint(AntiAlias=True); p.setShader(skia.GradientShader.MakeLinear([skia.Point(x0, y0), skia.Point(x1, y1)], [C(c) if isinstance(c, str) else c for c in cols], pos)); return p


def rad(x, y, r, cols, pos=None, a=1.0):
    p = skia.Paint(AntiAlias=True); p.setShader(skia.GradientShader.MakeRadial(skia.Point(x, y), r, [C(c, a) if isinstance(c, str) else c for c in cols], pos)); return p


# ------------------------------------------------------------------ space
_STARS = None


def space(c, t, tint=(0.0, 0.0, 0.0)):
    global _STARS
    c.drawRect(skia.Rect(0, 0, W, H), lin(0, 0, 0, H, ['#02040f', '#060d2a', '#0b1238']))
    c.drawCircle(220, 520, 520, rad(220, 520, 520, ['#3a1d6e', '#00000000'], [0, 1], 0.55))
    c.drawCircle(900, 1500, 600, rad(900, 1500, 600, ['#11406e', '#00000000'], [0, 1], 0.5))
    if _STARS is None:
        r = np.random.default_rng(4); _STARS = [(r.uniform(0, W), r.uniform(0, H), r.uniform(0.6, 2.6), r.uniform(0, 6.28), r.uniform(0.4, 1.0)) for _ in range(420)]
    for x, y, s, ph, b in _STARS:
        a = b * (0.6 + 0.4 * math.sin(t * 2.0 + ph)); c.drawCircle(x, y, s, P('#ffffff', a))
        if s > 2.2: c.drawCircle(x, y, s * 3, P('#9fc4ff', 0.15 * a, blur=4))


# ------------------------------------------------------------------ Earth (orthographic globe with rotating continents)
def _blob(lon, lat, r, seed, n=40):
    rg = np.random.default_rng(seed); k = rg.uniform(0, 6.28, 4); amp = rg.uniform(0.15, 0.35, 4)
    pts = []
    for i in range(n):
        a = i / n * 2 * math.pi; rr = r * (1 + sum(amp[j] * math.sin((j + 2) * a + k[j]) for j in range(4)) * 0.5)
        pts.append((lon + rr * math.cos(a) / max(0.3, math.cos(math.radians(lat))), lat + rr * math.sin(a)))
    return pts


CONT = [_blob(-100, 45, 22, 1), _blob(-60, -15, 18, 2), _blob(20, 50, 16, 3), _blob(20, 5, 20, 4), _blob(90, 45, 28, 5), _blob(135, -25, 12, 6),
        _blob(-40, 72, 9, 7), _blob(80, 15, 8, 8), _blob(105, 0, 7, 9), _blob(-5, 60, 5, 10)]


def globe(c, x, y, R, rot=0.0, a=1.0, night=0.55, glow=True, tilt=20.0, clouds_t=0.0, scorched=0.0):
    if glow:
        c.drawCircle(x, y, R * 1.18, rad(x, y, R * 1.18, ['#5ab8ff00', '#5ab8ff00', '#6cc4ff', '#5ab8ff00'], [0, 0.82, 0.86, 1.0], 0.8 * a))
    c.save(); clip = skia.Path(); clip.addCircle(x, y, R); c.clipPath(clip, doAntiAlias=True)
    c.drawCircle(x, y, R, rad(x - R * 0.35, y - R * 0.4, R * 1.5, ['#4fb6ff', '#1f78d6', '#0a3d8f'], [0, 0.5, 1], a))
    tl = math.radians(tilt)
    for poly in CONT:
        pth = skia.Path(); started = False; vis = 0
        for lon, lat in poly:
            lo, la = math.radians(lon + rot), math.radians(lat)
            X, Y, Z = math.cos(la) * math.sin(lo), math.sin(la), math.cos(la) * math.cos(lo)
            Y, Z = Y * math.cos(tl) - Z * math.sin(tl), Y * math.sin(tl) + Z * math.cos(tl)
            if Z < 0: X, Y = X / math.hypot(X, Y + 1e-9) if math.hypot(X, Y) > 0 else X, Y / math.hypot(X, Y + 1e-9) if math.hypot(X, Y) > 0 else Y
            else: vis += 1
            px, py = x + X * R, y - Y * R
            (pth.lineTo if started else pth.moveTo)(px, py); started = True
        pth.close()
        if vis > 2:
            c.drawPath(pth, P('#3fae5a' if scorched < 0.5 else '#7a4a2a', a)); c.drawPath(pth, P('#2c8a45', a * 0.6, stroke=3))
    # clouds
    rg = np.random.default_rng(12)
    for i in range(16):
        lon0, lat0 = rg.uniform(-180, 180), rg.uniform(-60, 60)
        lo, la = math.radians(lon0 + rot * 1.15 + clouds_t * 4), math.radians(lat0)
        X, Y, Z = math.cos(la) * math.sin(lo), math.sin(la), math.cos(la) * math.cos(lo)
        Y, Z = Y * math.cos(tl) - Z * math.sin(tl), Y * math.sin(tl) + Z * math.cos(tl)
        if Z > 0.05: c.drawOval(skia.Rect(x + X * R - R * 0.16, y - Y * R - R * 0.05, x + X * R + R * 0.16, y - Y * R + R * 0.05), P('#ffffff', 0.55 * a * Z, blur=R * 0.02))
    # night side and rim light
    c.drawCircle(x, y, R, lin(x - R, y - R * 0.3, x + R, y + R * 0.3, ['#00000000', '#00000000', OV.col('#000814', night)], [0, 0.45, 1]))
    c.drawCircle(x, y, R, rad(x, y, R, ['#00000000', '#00000000', OV.col('#9fd8ff', 0.35)], [0, 0.85, 1.0]))
    c.restore()


def little_ai(c, x, y, s, col='#ff3b30', a=1.0, rot=0.0, arms=0.0):
    c.save(); c.translate(x, y); c.rotate(rot)
    pb = P(col, a)
    c.drawRoundRect(skia.Rect(-0.22 * s, -0.95 * s, 0.22 * s, -0.25 * s), 0.18 * s, 0.18 * s, pb)
    for sg in (-1, 1):
        c.drawLine(sg * 0.12 * s, -0.3 * s, sg * 0.16 * s, 0.0, P(col, a, stroke=0.13 * s))
        c.drawLine(sg * 0.2 * s, -0.85 * s, sg * (0.45 * s), -0.85 * s - arms * 0.35 * s + 0.2 * s, P(col, a, stroke=0.11 * s))
    c.drawCircle(0, -1.22 * s, 0.3 * s, pb)
    for sg in (-1, 1): c.drawOval(skia.Rect(sg * 0.1 * s - 0.04 * s, -1.3 * s, sg * 0.1 * s + 0.04 * s, -1.18 * s), P('#14161a', a))
    c.drawArc(skia.Rect(-0.12 * s, -1.2 * s, 0.12 * s, -1.02 * s), 20, 140, False, P('#14161a', a, stroke=0.035 * s))
    c.restore()


def arrow(c, x0, y0, x1, y1, col='#ffd60a', w=14, a=1.0):
    c.drawLine(x0, y0, x1, y1, P(col, a, stroke=w)); ang = math.atan2(y1 - y0, x1 - x0)
    p = skia.Path(); p.moveTo(x1 + math.cos(ang) * w * 1.6, y1 + math.sin(ang) * w * 1.6)
    p.lineTo(x1 + math.cos(ang + 2.4) * w * 2.2, y1 + math.sin(ang + 2.4) * w * 2.2); p.lineTo(x1 + math.cos(ang - 2.4) * w * 2.2, y1 + math.sin(ang - 2.4) * w * 2.2); p.close()
    c.drawPath(p, P(col, a))


def sun(c, x, y, R, a=1.0, t=0.0):
    c.drawCircle(x, y, R * 3.2, rad(x, y, R * 3.2, ['#ffcf5a', '#ff9a2a00'], [0, 1], 0.45 * a))
    for k in range(16):
        ang = k / 16 * 2 * math.pi + t * 0.2; c.drawLine(x + math.cos(ang) * R * 1.1, y + math.sin(ang) * R * 1.1, x + math.cos(ang) * R * (1.5 + 0.15 * math.sin(t * 3 + k)), y + math.sin(ang) * R * (1.5 + 0.15 * math.sin(t * 3 + k)), P('#ffd36a', 0.6 * a, stroke=R * 0.06))
    c.drawCircle(x, y, R, rad(x - R * 0.2, y - R * 0.2, R * 1.2, ['#fff7c8', '#ffd04a', '#ff9a20'], [0, 0.6, 1], a))


def stat_label(c, s, x, y, size=64, col='#ffd60a', a=1.0):
    w = OV.text_width(s, 'poppins', size)
    c.drawRoundRect(skia.Rect(x - w / 2 - 30, y - size * 0.95, x + w / 2 + 30, y + size * 0.35), 26, 26, P('#000000', 0.55 * a))
    txt(c, s, x, y, size, col, a, sw=0)


# ------------------------------------------------------------------ 2D scenes
def render_2d(kind, lt, dur, bg=None):
    arr = np.zeros((H, W, 4), np.uint8); arr[..., 3] = 255
    c = skia.Surface(arr).getCanvas(); t = lt
    space(c, t)
    if kind == 'globe_spin':
        R = 380; rot = -t * 28
        globe(c, W / 2, 900, R, rot, clouds_t=t)
        # equator band with speed arrows
        for k in range(5):
            u = ((t * 0.6 + k / 5) % 1); xx = W / 2 - R + 2 * R * u; yy = 900 + R * 0.33 + 40 * math.sin(u * math.pi) * 0
            a = math.sin(u * math.pi)
            arrow(c, xx - 40, yy + 8, xx + 40, yy + 8, '#ffd60a', 10, a)
        c.drawArc(skia.Rect(W / 2 - R, 900 - R * 0.6 + R * 0.33, W / 2 + R, 900 + R * 0.6 + R * 0.33), 0, 180, False, P('#ffd60a', 0.8, stroke=5))
        little_ai(c, W / 2 + 10, 900 - R + 6, 70, '#ff3b30', 1.0)
        stat_label(c, "EQUATOR", W / 2, 900 + R + 120, 52, '#ffffff', 1.0)
    elif kind == 'globe_waves':
        R = 380; globe(c, W / 2, 900, R, 40, clouds_t=0)
        c.save(); clip = skia.Path(); clip.addCircle(W / 2, 900, R); c.clipPath(clip, doAntiAlias=True)
        for k in range(7):
            u = (t * 0.45 + k / 7) % 1; cx = W / 2 - R * 1.2 + u * R * 2.4
            for j in range(3):
                yy = 900 - R * 0.6 + j * R * 0.55 + 30 * math.sin(k * 3 + j)
                c.drawArc(skia.Rect(cx - 90, yy - 40, cx + 90, yy + 40), 200, 140, False, P('#ffffff', 0.85 * math.sin(u * math.pi), stroke=12))
        c.restore()
        arrow(c, W / 2 - 330, 1390, W / 2 + 330, 1390, '#ffd60a', 16, 1.0)
        stat_label(c, "GIANT WAVES", W / 2, 1520, 60, '#ffd60a', 1.0)
    elif kind in ('atom', 'atom_lose', 'repel'):
        def atom(cx, cy, s, lost=0.0, tt=0.0, plus=0.0):
            c.drawCircle(cx, cy, s * 0.55, rad(cx, cy, s * 0.55, ['#ff6a5a' if plus > 0.5 else '#9fd8ff', '#00000000'], [0, 1], 0.35 + 0.3 * plus))
            rg = np.random.default_rng(3)
            for i in range(9):
                ang = i * 2.399; rr = s * 0.13 * math.sqrt(i + 0.5) / 2.2
                col = '#ff4d4d' if i % 2 == 0 else '#4da3ff'
                c.drawCircle(cx + math.cos(ang) * rr, cy + math.sin(ang) * rr, s * 0.08, rad(cx + math.cos(ang) * rr - s * 0.02, cy + math.sin(ang) * rr - s * 0.02, s * 0.1, ['#ffffff', col, col], [0, 0.35, 1]))
            for k in range(3):
                c.save(); c.translate(cx, cy); c.rotate(k * 60 + tt * 6)
                c.drawOval(skia.Rect(-s, -s * 0.36, s, s * 0.36), P('#bfe3ff', 0.5, stroke=4))
                if not (k == 0 and lost > 0):
                    ang = tt * (2.2 + k * 0.5) + k * 2
                    ex, ey = math.cos(ang) * s, math.sin(ang) * s * 0.36
                    c.drawCircle(ex, ey, s * 0.075, rad(ex, ey, s * 0.2, ['#e8ffff', '#5ad1ff00'], [0, 1])); c.drawCircle(ex, ey, s * 0.06, P('#7fe8ff'))
                c.restore()
            if lost > 0:   # the lost electron flies away
                ex, ey = cx + s * (1.0 + lost * 4), cy - s * lost * 2.2
                for j in range(8): c.drawCircle(ex - j * 18 * clamp(lost * 3), ey + j * 10 * clamp(lost * 3), s * 0.06 * (1 - j / 9), P('#7fe8ff', 0.6 * (1 - j / 8)))
                c.drawCircle(ex, ey, s * 0.07, P('#7fe8ff'))
            if plus > 0: txt(c, "+", cx, cy + s * 0.18, s * 0.55, '#ffffff', plus, eob(plus), stroke='#d0302a', sw=s * 0.06)
        if kind == 'atom':
            atom(W / 2, 900, 360, tt=t)
            stat_label(c, "NUCLEUS  +", W / 2, 1420, 54, '#ff6a5a'); stat_label(c, "ELECTRONS  −", W / 2, 1530, 54, '#7fe8ff')
        elif kind == 'atom_lose':
            lost = clamp((t - 0.8) / 2.0); atom(W / 2, 900, 360, lost=lost, tt=t, plus=clamp((t - 1.6) / 0.5))
        else:
            sep = 230 + 120 * eio(t / max(0.5, dur)) + 10 * math.sin(t * 30)
            atom(W / 2 - sep, 900, 200, tt=t, plus=1.0); atom(W / 2 + sep, 900, 200, tt=t + 1, plus=1.0)
            arrow(c, W / 2 - sep + 60, 1180, W / 2 - sep - 120, 1180, '#ff6a5a', 16); arrow(c, W / 2 + sep - 60, 1180, W / 2 + sep + 120, 1180, '#ff6a5a', 16)
    elif kind == 'earth_boom':
        u = t / max(0.5, dur); R = 360
        if u < 0.42:
            k = u / 0.42; sh = 8 * k
            globe(c, W / 2 + math.sin(t * 50) * sh, 900 + math.cos(t * 43) * sh, R, 30, night=0.4, scorched=k)
            rg = np.random.default_rng(5)
            for i in range(14):
                ang = rg.uniform(0, 6.28); L1 = R * k * rg.uniform(0.6, 1.0)
                pth = skia.Path(); pth.moveTo(W / 2, 900)
                for j in range(1, 6): pth.lineTo(W / 2 + math.cos(ang + 0.25 * math.sin(j * 3 + i)) * L1 * j / 5, 900 + math.sin(ang + 0.25 * math.sin(j * 3 + i)) * L1 * j / 5)
                c.drawPath(pth, P('#ffe08a', k, stroke=6 + 6 * k)); c.drawPath(pth, P('#ff7a20', 0.6 * k, stroke=20, blur=8))
        else:
            k = (u - 0.42) / 0.58
            c.drawCircle(W / 2, 900, 2400 * k + 200, rad(W / 2, 900, 2400 * k + 200, ['#ffffff', '#ffd27a', '#ff6a2000'], [0, 0.3, 1], clamp(1.4 - k)))
            rg = np.random.default_rng(9)
            for i in range(90):
                ang = rg.uniform(0, 6.28); sp = rg.uniform(300, 1500); sz = rg.uniform(10, 46)
                x, y = W / 2 + math.cos(ang) * sp * k, 900 + math.sin(ang) * sp * k
                pth = skia.Path(); pth.addPoly([skia.Point(x + math.cos(ang + j * 2.1 + t) * sz, y + math.sin(ang + j * 2.1 + t) * sz) for j in range(3)], True)
                c.drawPath(pth, P(['#7a4a2a', '#3fae5a', '#1f78d6', '#a88060'][i % 4], clamp(1.2 - k * 0.6)))
            if k < 0.2: c.drawRect(skia.Rect(0, 0, W, H), P('#ffffff', 1 - k / 0.2))
    elif kind == 'supernova':
        k = t / max(0.5, dur)
        for i in range(4):
            r0 = 120 + (k * 1.4 - i * 0.12) * 1100
            if r0 > 0: c.drawCircle(W / 2, 900, r0, P(['#ffffff', '#ffd27a', '#ff7a7a', '#9a7aff'][i], clamp(1 - k) * 0.7, stroke=26 - i * 5, blur=10))
        c.drawCircle(W / 2, 900, 700, rad(W / 2, 900, 700, ['#ffffff', '#fff2c0', '#ff9a4a', '#ff4a2a00'], [0, 0.15, 0.45, 1], 0.9))
        for j in range(24):
            ang = j / 24 * 6.28 + t * 0.3; c.drawLine(W / 2, 900, W / 2 + math.cos(ang) * 1400, 900 + math.sin(ang) * 1400, P('#fff4d0', 0.25, stroke=6, blur=6))
    elif kind == 'clock_zero':
        cx, cy, R = W / 2, 880, 330
        c.drawCircle(cx, cy + 12, R + 40, P('#000000', 0.5, blur=30))
        c.drawCircle(cx, cy, R + 30, rad(cx - 80, cy - 80, R * 1.6, ['#f2f4f8', '#b8bec8'])); c.drawCircle(cx, cy, R, P('#ffffff'))
        c.drawRoundRect(skia.Rect(cx - 50, cy - R - 110, cx + 50, cy - R - 20), 16, 16, P('#c0c6d0'))
        for k in range(60): ang = k / 60 * 6.28; L0 = R * (0.86 if k % 5 else 0.78); c.drawLine(cx + math.sin(ang) * L0, cy - math.cos(ang) * L0, cx + math.sin(ang) * R * 0.95, cy - math.cos(ang) * R * 0.95, P('#222222', 1, stroke=4 if k % 5 else 9))
        ang = 0.004 * math.sin(t * 40); c.drawLine(cx, cy, cx + math.sin(ang) * R * 0.8, cy - math.cos(ang) * R * 0.8, P('#ff3b30', 1, stroke=12)); c.drawCircle(cx, cy, 22, P('#ff3b30'))
        stat_label(c, "0.000001 s", cx, 1440, 96, '#ffd60a')
    elif kind == 'tangent':
        R = 1500; cx, cy = W / 2, 900 + R
        globe(c, cx, cy, R, 10, glow=True, night=0.2)
        u = eio(t / max(0.5, dur))
        x0 = W / 2 - 160; y0 = cy - math.sqrt(R * R - (x0 - cx) ** 2)
        slope = (x0 - cx) / math.sqrt(R * R - (x0 - cx) ** 2)          # dy/dx of the ground at x0 (screen coords)
        c.drawLine(x0 - 300, y0 - slope * 300, x0 + 700, y0 + slope * 700, P('#ffd60a', 0.9, stroke=6))
        px = x0 + 560 * u; py = y0 + slope * 560 * u
        gy = cy - math.sqrt(max(0, R * R - (px - cx) ** 2))
        little_ai(c, px, py, 80, '#34c759', 1.0, rot=0.0, arms=1.0)
        little_ai(c, x0 + 560 * u * 0.0 + 60, cy - math.sqrt(R * R - (x0 + 60 - cx) ** 2), 60, '#0a84ff', 0.0)
        if u > 0.3: arrow(c, px + 90, gy - 6, px + 90, py + 6, '#ffffff', 8, clamp((u - 0.3) * 3)); txt(c, "GAP", px + 190, (gy + py) / 2 + 20, 54, '#ffffff', clamp((u - 0.3) * 3))
        stat_label(c, "STRAIGHT LINE", W / 2, 520, 56, '#ffd60a')
    elif kind == 'sun_light':
        sun(c, 200, 900, 150, 1.0, t)
        globe(c, 900, 900, 70, -t * 20, glow=True, night=0.6)
        u = (t / max(0.5, dur)) * 1.0
        for k in range(10):
            xx = 360 + (470 * ((u * 1.0 + k / 10) % 1))
            c.drawLine(xx, 900 - 60, xx, 900 + 60, P('#ffe08a', 0.5 * math.sin(((u + k / 10) % 1) * math.pi), stroke=6))
        txt(c, "8:20", W / 2, 1300, 150, '#ffd60a', 1.0)
        stat_label(c, "LIGHT TRAVEL TIME", W / 2, 1450, 48, '#ffffff')
    elif kind in ('orbit_empty', 'orbit_straight'):
        cx, cy, Rx, Ry = W / 2, 900, 420, 300
        c.drawOval(skia.Rect(cx - Rx, cy - Ry, cx + Rx, cy + Ry), P('#9fc4ff', 0.5, stroke=4))
        if kind == 'orbit_empty':
            fade = clamp(1 - t / 1.0); sun(c, cx, cy, 90, fade, t)
            if fade < 1: c.drawCircle(cx, cy, 90, P('#ffffff', 0.25, stroke=4)); txt(c, "?", cx, cy + 40, 120, '#ffffff', 1 - fade)
            ang = -0.6 + t * 0.5; ex, ey = cx + math.cos(ang) * Rx, cy + math.sin(ang) * Ry
            globe(c, ex, ey, 60, -t * 30, night=0.4)
        else:
            ang0 = -0.6; ex0, ey0 = cx + math.cos(ang0) * Rx, cy + math.sin(ang0) * Ry
            vx, vy = -math.sin(ang0) * Rx, math.cos(ang0) * Ry; n = math.hypot(vx, vy); vx, vy = vx / n, vy / n
            d = 260 * clamp(t / max(0.5, dur))
            c.drawLine(ex0, ey0, ex0 + vx * 340, ey0 + vy * 340, P('#ffd60a', 0.9, stroke=6))
            globe(c, ex0 + vx * d, ey0 + vy * d, 60, -t * 30, night=0.6)
            c.drawCircle(cx, cy, 90, P('#ffffff', 0.25, stroke=4))
    elif kind == 'knot':
        u = eio(t / max(0.5, dur))
        def rope_pts(u):
            pts = []
            for i in range(160):
                s = i / 159; x = 140 + s * 800
                kn = math.exp(-((s - 0.5) / 0.14) ** 2) * (1 - u)
                y = 900 + math.sin(s * math.pi * 6) * 130 * kn + math.sin(s * 9) * 18 * u
                x += math.cos(s * math.pi * 6) * 110 * kn
                pts.append((x, y))
            return pts
        pts = rope_pts(u); pth = skia.Path(); pth.moveTo(*pts[0])
        for p in pts[1:]: pth.lineTo(*p)
        c.drawPath(pth, P('#000000', 0.5, stroke=46, blur=10)); c.drawPath(pth, P('#c98f4a', 1, stroke=40)); c.drawPath(pth, P('#e8b878', 0.8, stroke=14))
        stat_label(c, "KNOTS UNTIE", W / 2, 1300, 64, '#ffd60a')
    return arr[..., :3].copy()


# ------------------------------------------------------------------ overlays
class Graphics:
    def __init__(self, tl, seg_by, chap_by):
        self.tl, self.segs = tl, tl["segments"]
        import script_whatif as Wf
        self.key = tl["key"]; self.meta = Wf.SHORTS[self.key]
        for i, s in enumerate(self.segs):
            s["until"] = self.segs[i + 1]["start"] if i + 1 < len(self.segs) else tl["total"]
        tim = {s["gfx"].get("timer"): s for s in self.segs if s["gfx"].get("timer")}
        self.t_on = tim["start"]["start"] if "start" in tim else None
        self.t_off = tim["end"]["start"] + 0.6 if "end" in tim else (tim["freeze"]["start"] if "freeze" in tim else None)
        self.freeze = tim["freeze"]["start"] if "freeze" in tim else None
        clk = {s["gfx"].get("clock"): s for s in self.segs if s["gfx"].get("clock")}
        self.c_on = clk["start"]["start"] if "start" in clk else None
        self.c_off = clk["stop"]["start"] + 0.6 if "stop" in clk else None
        self.end = next((s["start"] for s in self.segs if s["gfx"].get("end")), tl["total"])
        self.words = {}

    def wt(self, sid):
        if sid not in self.words:
            try: self.words[sid] = wordtimes.word_times(sid)
            except Exception: self.words[sid] = []
        return self.words[sid]


def stopwatch_icon(c, x, y, r, col, a):
    c.drawCircle(x, y, r, P(col, a, stroke=r * 0.22)); c.drawRect(skia.Rect(x - r * 0.25, y - r * 1.45, x + r * 0.25, y - r * 1.15), P(col, a))
    c.drawLine(x, y, x + r * 0.45, y - r * 0.45, P(col, a, stroke=r * 0.2))


def draw_over(out, G, t):
    global AVATAR
    rgba = np.dstack([out, np.full(out.shape[:2], 255, np.uint8)])
    c = skia.Surface(rgba).getCanvas()
    s = next((x for x in G.segs if x["start"] - 0.05 <= t < x["until"]), None)
    # ---- hook (first line): big two-line question + "FOR 10 SECONDS?"
    hook_end = G.segs[1]["start"] if len(G.segs) > 1 else 3
    if t < hook_end + 0.2:
        a = clamp((hook_end + 0.2 - t) / 0.3)
        for i, line in enumerate(G.meta["hook"]):
            txt(c, line, W / 2, 330 + i * 120, 92, '#ffffff', a, eob((t - i * 0.12) / 0.35), sw=14)
        w = OV.text_width("FOR 10 SECONDS", 'poppins', 64) + 70
        k = eob((t - 0.45) / 0.35)
        c.save(); c.translate(W / 2, 560); c.scale(k, k); c.rotate(-3); c.translate(-W / 2, -560)
        c.drawRoundRect(skia.Rect(W / 2 - w / 2, 500, W / 2 + w / 2, 600), 26, 26, P('#ffd60a', a))
        txt(c, "FOR 10 SECONDS", W / 2, 574, 64, '#111111', a, sw=0, shadow=False)
        c.restore()
    # ---- 10-second timer (proportional over the event)
    if G.t_on is not None and G.t_on - 0.1 <= t < (G.t_off or 1e9) + 0.8 and t < G.end:
        u = clamp((t - G.t_on) / max(0.5, (G.t_off or G.t_on + 10) - G.t_on))
        if G.freeze is not None and t >= G.freeze: lab, u = "0.000001 s", 0.0
        else: lab = f"{10 * (1 - u):.1f} s"
        a = clamp((t - G.t_on + 0.1) / 0.25) * clamp(((G.t_off or 1e9) + 0.8 - t) / 0.3)
        col = '#ffffff' if u < 0.75 else '#ff4d4d'
        x0, y0, w0 = W / 2 - 170, 150, 340
        c.drawRoundRect(skia.Rect(x0, y0, x0 + w0, y0 + 96), 48, 48, P('#000000', 0.62 * a))
        c.drawRoundRect(skia.Rect(x0 + 8, y0 + 80, x0 + 8 + (w0 - 16) * (1 - u), y0 + 88), 4, 4, P('#ffd60a', a))
        stopwatch_icon(c, x0 + 60, y0 + 50, 22, col, a)
        txt(c, lab, x0 + w0 / 2 + 30, y0 + 66, 50 if len(lab) < 8 else 40, col, a, sw=0, shadow=False)
    # ---- 8:20 clock (Sun)
    if G.c_on is not None and G.c_on - 0.1 <= t < G.c_off:
        u = clamp((t - G.c_on) / max(0.5, G.c_off - 0.6 - G.c_on)); rem = 500 * (1 - u)
        lab = f"{int(rem // 60)}:{int(rem % 60):02d}"
        a = clamp((t - G.c_on + 0.1) / 0.25) * clamp((G.c_off - t) / 0.3)
        c.drawRoundRect(skia.Rect(W / 2 - 170, 150, W / 2 + 170, 246), 48, 48, P('#000000', 0.62 * a))
        stopwatch_icon(c, W / 2 - 110, 200, 22, '#ffd60a', a)
        txt(c, lab, W / 2 + 30, 216, 54, '#ffd60a', a, sw=0, shadow=False)
    # ---- big stat card
    if s and s["gfx"].get("big") and t < s["until"]:
        u = t - s["start"]; a = clamp((s["until"] - t) / 0.25) * clamp(u / 0.15)
        lab = s["gfx"]["big"]; size = 120 if len(lab) < 10 else 86
        w = OV.text_width(lab, 'poppins', size) + 80
        k = eob(u / 0.35)
        c.save(); c.translate(W / 2, 760); c.scale(k, k); c.rotate(-2); c.translate(-W / 2, -760)
        c.drawRoundRect(skia.Rect(W / 2 - w / 2 + 8, 700 - size * 0.8 + 12, W / 2 + w / 2 + 8, 700 + size * 0.45 + 12), 30, 30, P('#000000', 0.4, blur=10))
        c.drawRoundRect(skia.Rect(W / 2 - w / 2, 700 - size * 0.8, W / 2 + w / 2, 700 + size * 0.45), 30, 30, P('#ff3b30', a))
        txt(c, lab, W / 2, 700 + size * 0.1, size, '#ffffff', a, sw=0)
        c.restore()
    # ---- captions: up to three words, the spoken one in yellow
    if s and t < G.end and t < s["start"] + s["dur"] + 0.25 and not (t < hook_end):
        ws = G.wt(s["id"]); u = t - s["start"]
        cur = max([i for i, (_, wt) in enumerate(ws) if u >= wt - 0.03] or [0])
        g0 = (cur // 3) * 3; chunk = ws[g0:g0 + 3]
        words = [w.strip() for w, _ in chunk]
        size = 86; key = 'poppins'
        sp = size * 0.3
        widths = [OV.text_width(w.upper(), key, size) for w in words]; tot = sum(widths) + sp * (len(words) - 1)
        if tot > W - 100: k2 = (W - 100) / tot; size *= k2; widths = [x * k2 for x in widths]; sp *= k2; tot = W - 100
        x = W / 2 - tot / 2; y = 1360
        pop = 1 + 0.06 * max(0, 1 - (u - ws[cur][1]) / 0.1) if ws else 1
        for i, (w, ww) in enumerate(zip(words, widths)):
            on = g0 + i == cur; vis = g0 + i <= cur
            if vis: txt(c, w.upper(), x + ww / 2, y, size, '#ffd60a' if on else '#ffffff', 1.0, pop if on else 1.0, sw=size * 0.14)
            x += ww + sp
    # ---- follow card
    if t >= G.end:
        u = t - G.end; a = clamp(u / 0.3)
        if AVATAR is None:
            av = cv2.imread(os.path.join(HERE, "..", "..", "video promo", "avatar_the_animator.png")); AVATAR = cv2.cvtColor(av, cv2.COLOR_BGR2RGB) if av is not None else None
        k = eob(u / 0.45)
        c.drawRoundRect(skia.Rect(90, 380, W - 90, 1000), 60, 60, P('#000000', 0.62 * a))
        if AVATAR is not None and a > 0.05:
            r = int(130 * k); sz = 2 * r
            if sz > 4:
                im = cv2.resize(AVATAR, (sz, sz)); mask = np.zeros((sz, sz), np.uint8); cv2.circle(mask, (r, r), r - 1, 255, -1, cv2.LINE_AA)
                x0, y0 = W // 2 - r, 560 - r; m = (mask[..., None] / 255.0) * a
                rgba[y0:y0 + sz, x0:x0 + sz, :3] = (im * m + rgba[y0:y0 + sz, x0:x0 + sz, :3] * (1 - m)).astype(np.uint8)
                c.drawCircle(W / 2, 560, r + 4, P('#ffffff', a, stroke=8))
        txt(c, "FOLLOW FOR MORE", W / 2, 800, 76, '#ffffff', a, k, sw=0)
        txt(c, "WHAT IFs!", W / 2, 910, 96, '#ffd60a', a, k, sw=0)
    return rgba[..., :3]
