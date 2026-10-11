# -*- coding: utf-8 -*-
"""Provocative 'hot' cover: three glass orbs with devil horns on burning money (pure skia, 3840x2160 master -> 1280x720 JPG)."""
import os, math, random
import numpy as np
import skia
import overlays as OV
import make_cover as MC
from make_cover import U, big, canvas, save

W, H = MC.W, MC.H
rnd = random.Random(7)


def P(h, a=1.0, **k): return OV.P(h, a, **k)


def bg(c):
    sh = skia.GradientShader.MakeRadial(skia.Point(960 * U, 560 * U), 1250 * U, [OV.col('#ff4a24'), OV.col('#c40f12'), OV.col('#3a0306')], [0, 0.55, 1])
    c.drawRect(skia.Rect(0, 0, W, H), skia.Paint(Shader=sh))
    for i in range(26):   # god rays
        a0 = i * math.pi / 13; path = skia.Path(); path.moveTo(960 * U, 600 * U)
        for d in (0, 0.07):
            path.lineTo(960 * U + math.cos(a0 + d) * 2600 * U, 600 * U + math.sin(a0 + d) * 2600 * U)
        path.close(); c.drawPath(path, P('#ffb347', 0.07 if i % 2 else 0.0))
    for i in range(260):  # embers
        x, y, r = rnd.uniform(0, 1920), rnd.uniform(0, 1080), rnd.uniform(1.2, 4.5)
        c.drawCircle(x * U, y * U, r * U, P('#ffc24a', rnd.uniform(0.3, 0.95), blur=r * U * 0.5))


def flame(c, x, y, w, h, a=1.0):
    for k, (col, s) in enumerate([('#ff3d00', 1.0), ('#ff8a00', 0.76), ('#ffd23a', 0.5)]):
        p = skia.Path(); ww, hh = w * s, h * s
        p.moveTo((x - ww / 2) * U, y * U)
        p.cubicTo((x - ww * 0.6) * U, (y - hh * 0.5) * U, (x - ww * 0.1) * U, (y - hh * 0.6) * U, (x + rnd.uniform(-0.15, 0.15) * ww) * U, (y - hh) * U)
        p.cubicTo((x + ww * 0.15) * U, (y - hh * 0.55) * U, (x + ww * 0.6) * U, (y - hh * 0.45) * U, (x + ww / 2) * U, y * U)
        p.close(); c.drawPath(p, P(col, a * 0.92, blur=3 * U))


def bill(c, x, y, rot, w=300, h=140, burn=0.0):
    c.save(); c.translate(x * U, y * U); c.rotate(rot)
    r = skia.Rect(-w / 2 * U, -h / 2 * U, w / 2 * U, h / 2 * U)
    c.drawRoundRect(skia.Rect(r.left() + 6 * U, r.top() + 12 * U, r.right() + 6 * U, r.bottom() + 12 * U), 8 * U, 8 * U, P('#000000', 0.5, blur=10 * U))
    c.drawRoundRect(r, 8 * U, 8 * U, P('#9fcf8a'))
    c.drawRoundRect(skia.Rect(r.left() + 10 * U, r.top() + 10 * U, r.right() - 10 * U, r.bottom() - 10 * U), 6 * U, 6 * U, P('#5c9a52', 1.0, stroke=3 * U))
    c.drawCircle(0, 0, h * 0.28 * U, P('#6aa95c')); OV.txt(c, "100", 0, h * 0.14 * U, 'anton', h * 0.4 * U, '#2f6a2c', 1.0, 'center', 0, shadow=0)
    if burn:
        g = skia.GradientShader.MakeLinear([skia.Point(r.left(), 0), skia.Point(r.left() + w * burn * U, 0)], [OV.col('#120503', 0.95), OV.col('#ff6a00', 0.0)])
        c.drawRoundRect(r, 8 * U, 8 * U, skia.Paint(Shader=g))
    c.restore()


def white_logo(c, kind, cx, cy, r):
    cx, cy, r = cx * U, cy * U, r * U
    wc = '#ffffff'
    if kind == 'claude':
        for i in range(12):
            a = i * math.pi / 6; l0, l1 = r * 0.18, r * (0.78 if i % 2 == 0 else 0.56)
            c.drawLine(cx + math.cos(a) * l0, cy + math.sin(a) * l0, cx + math.cos(a) * l1, cy + math.sin(a) * l1, P(wc, 1.0, stroke=r * 0.1))
    elif kind == 'gpt':
        for i in range(6):
            c.save(); c.translate(cx, cy); c.rotate(i * 60)
            c.drawOval(skia.Rect(-r * 0.2, -r * 0.82, r * 0.2, -r * 0.06), P(wc, 1.0, stroke=r * 0.09)); c.restore()
    else:
        path = skia.Path(); k = r * 0.82; q = r * 0.1
        path.moveTo(cx, cy - k); path.quadTo(cx + q, cy - q, cx + k, cy); path.quadTo(cx + q, cy + q, cx, cy + k)
        path.quadTo(cx - q, cy + q, cx - k, cy); path.quadTo(cx - q, cy - q, cx, cy - k); path.close()
        c.drawPath(path, P(wc))


def horn(c, x, y, s, flip):
    c.save(); c.translate(x * U, y * U); c.scale(s * U * (-1 if flip else 1), s * U)
    p = skia.Path(); p.moveTo(0, 0); p.cubicTo(-10, -70, 20, -140, 90, -170); p.cubicTo(60, -110, 70, -50, 60, 0); p.close()
    sh = skia.GradientShader.MakeLinear([skia.Point(0, 0), skia.Point(90, -170)], [OV.col('#7a0008'), OV.col('#ff2a2a')])
    c.drawPath(p, skia.Paint(AntiAlias=True, Shader=sh)); c.drawPath(p, P('#2a0002', 1.0, stroke=5))
    c.drawPath(skia.Path().moveTo(20, -30).cubicTo(25, -80, 45, -120, 75, -150), P('#ffd0d0', 0.6, stroke=5))
    c.restore()


def orb(c, kind, cx, cy, r, tint, tint2):
    c.drawOval(skia.Rect((cx - r * 0.95) * U, (cy + r * 0.9) * U, (cx + r * 0.95) * U, (cy + r * 1.1) * U), P('#000000', 0.55, blur=r * 0.12 * U))
    c.drawCircle(cx * U, cy * U, r * 1.22 * U, skia.Paint(AntiAlias=True, Shader=skia.GradientShader.MakeRadial(skia.Point(cx * U, cy * U), r * 1.25 * U, [OV.col('#fff2c0', 0.55), OV.col('#fff2c0', 0.0)], [0.7, 1.0])))
    sh = skia.GradientShader.MakeRadial(skia.Point((cx - r * 0.25) * U, (cy - r * 0.3) * U), r * 1.25 * U, [OV.col(tint2), OV.col(tint), OV.col('#000000', 0.55)], [0, 0.6, 1])
    c.drawCircle(cx * U, cy * U, r * U, skia.Paint(AntiAlias=True, Shader=sh))
    c.drawCircle(cx * U, cy * U, r * U, P('#ffffff', 0.55, stroke=r * 0.03 * U))
    white_logo(c, kind, cx, cy, r * 0.62)
    hs = skia.GradientShader.MakeLinear([skia.Point(0, (cy - r * 0.9) * U), skia.Point(0, (cy - r * 0.2) * U)], [OV.col('#ffffff', 0.75), OV.col('#ffffff', 0.0)])
    c.drawOval(skia.Rect((cx - r * 0.62) * U, (cy - r * 0.92) * U, (cx + r * 0.62) * U, (cy - r * 0.3) * U), skia.Paint(AntiAlias=True, Shader=hs))


def sky(c):
    sh = skia.GradientShader.MakeLinear([skia.Point(0, 0), skia.Point(0, H)], [OV.col('#0b2a6b'), OV.col('#2f7fd6'), OV.col('#9fd4ff'), OV.col('#ffe3a6')], [0, 0.45, 0.75, 1])
    c.drawRect(skia.Rect(0, 0, W, H), skia.Paint(Shader=sh))
    for i in range(60):   # stars in the dark top
        c.drawCircle(rnd.uniform(0, 1920) * U, rnd.uniform(0, 300) * U, rnd.uniform(1, 3) * U, P('#ffffff', rnd.uniform(0.3, 0.9)))
    for i in range(18):   # sunburst from the horizon
        a0 = -math.pi + i * math.pi / 17; p = skia.Path(); p.moveTo(960 * U, 1000 * U)
        for d in (0, 0.05):
            p.lineTo(960 * U + math.cos(a0 + d) * 2400 * U, 1000 * U + math.sin(a0 + d) * 2400 * U)
        p.close(); c.drawPath(p, P('#fff2c0', 0.09 if i % 2 else 0.0))


def cloud(c, x, y, s, a=0.95):
    for dx, dy, r in [(-1.0, 0.1, 0.7), (-0.4, -0.2, 0.9), (0.3, -0.1, 1.0), (1.0, 0.1, 0.75), (0.0, 0.25, 1.0)]:
        c.drawCircle((x + dx * s) * U, (y + dy * s) * U, r * s * 0.7 * U, P('#ffffff', a, blur=s * 0.12 * U))


def ladder(c, x, top, base, wb, wt):
    """the Ladder: a tall lattice tower reaching the sky, behind the orbs"""
    for sgn in (-1, 1):
        c.drawLine((x + sgn * wb / 2) * U, base * U, (x + sgn * wt / 2) * U, top * U, P('#1c2540', 1.0, stroke=14 * U))
    n = 16
    for i in range(n + 1):
        u = i / n; y = base + (top - base) * u; w = wb + (wt - wb) * u
        c.drawLine((x - w / 2) * U, y * U, (x + w / 2) * U, y * U, P('#1c2540', 1.0, stroke=7 * U))
        if i < n:
            u2 = (i + 1) / n; y2 = base + (top - base) * u2; w2 = wb + (wt - wb) * u2
            sg = 1 if i % 2 else -1
            c.drawLine((x - sg * w / 2) * U, y * U, (x + sg * w2 / 2) * U, y2 * U, P('#1c2540', 1.0, stroke=5 * U))
    c.drawCircle(x * U, (top - 14) * U, 22 * U, P('#fff2a0', 1.0, blur=12 * U)); c.drawCircle(x * U, (top - 14) * U, 9 * U, P('#ffffff'))


def town(c, y0):
    c.drawRect(skia.Rect(0, y0 * U, W, H), P('#3d8f3a'))
    sh = skia.GradientShader.MakeLinear([skia.Point(0, y0 * U), skia.Point(0, H)], [OV.col('#5fb84a'), OV.col('#27622a')])
    c.drawRect(skia.Rect(0, y0 * U, W, H), skia.Paint(Shader=sh))
    for i in range(34):
        x = 20 + i * 58 + rnd.uniform(-14, 14); y = y0 + 10 + (i * 37 % 70); w = rnd.uniform(36, 62); h = w * rnd.uniform(0.6, 0.9)
        c.drawRect(skia.Rect(x * U, (y - h) * U, (x + w) * U, y * U), P(rnd.choice(['#f3ead8', '#e8d8c0', '#f6f0e4']))); 
        p = skia.Path(); p.moveTo((x - 5) * U, (y - h) * U); p.lineTo((x + w / 2) * U, (y - h - w * 0.55) * U); p.lineTo((x + w + 5) * U, (y - h) * U); p.close()
        c.drawPath(p, P('#c8392b')); c.drawRect(skia.Rect((x + w * 0.4) * U, (y - h * 0.5) * U, (x + w * 0.62) * U, y * U), P('#6b4a2b'))
    for i in range(4):   # factories with chimneys
        x = 150 + i * 520; c.drawRect(skia.Rect(x * U, (y0 - 62) * U, (x + 120) * U, (y0 + 20) * U), P('#a8412f')); c.drawRect(skia.Rect((x + 80) * U, (y0 - 150) * U, (x + 104) * U, (y0 - 60) * U), P('#7a2a20'))
        for k in range(3): c.drawCircle((x + 92 + k * 14) * U, (y0 - 170 - k * 30) * U, (18 + k * 8) * U, P('#ffffff', 0.5 - k * 0.12, blur=8 * U))


def main(path_name="copertina_P2_C"):
    img = np.zeros((H, W, 4), np.uint8); img[..., 3] = 255
    surf = skia.Surface(img); c = surf.getCanvas()
    sky(c)
    cloud(c, 260, 640, 210, 0.9); cloud(c, 1650, 600, 230, 0.9); cloud(c, 980, 560, 170, 0.8)
    ladder(c, 60, 20, 960, 230, 30); ladder(c, 1860, 20, 960, 230, 30)
    cloud(c, 150, 900, 250); cloud(c, 700, 940, 230); cloud(c, 1260, 920, 260); cloud(c, 1800, 900, 230)
    town(c, 960)
    orb(c, 'gemini', 1570, 700, 200, '#3d6df0', '#bcd0ff'); orb(c, 'claude', 350, 700, 200, '#e0612f', '#ffd0b0')
    orb(c, 'gpt', 960, 690, 255, '#10a37f', '#b4f5df')
    big(c, "AIs START A", 960, 180, 190, '#ffffff', '#f2f2f2', align='center', stroke=0.1)
    big(c, "CIVILIZATION", 960, 372, 190, '#ffffff', '#f2f2f2', align='center', stroke=0.1)
    c.save(); c.translate(1640 * U, 905 * U); c.rotate(-6)
    r = skia.RRect.MakeRectXY(skia.Rect(-190 * U, -82 * U, 190 * U, 82 * U), 22 * U, 22 * U)
    c.drawRRect(r, P('#000000', 0.5, blur=14 * U)); c.drawRRect(r, P('#ffd21f')); c.drawRRect(r, P('#000000', 1.0, stroke=9 * U))
    OV.txt(c, "PART 2", 0, 52 * U, 'anton', 154 * U, '#d00018', 1.0, 'center', 0.02, shadow=0)
    c.restore()
    save(img[..., :3].copy(), path_name)


if __name__ == "__main__":
    main()
