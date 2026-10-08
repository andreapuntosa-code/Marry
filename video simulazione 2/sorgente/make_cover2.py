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
    horn(c, cx - r * 0.62, cy - r * 0.78, r / 190, False); horn(c, cx + r * 0.62, cy - r * 0.78, r / 190, True)
    sh = skia.GradientShader.MakeRadial(skia.Point((cx - r * 0.25) * U, (cy - r * 0.3) * U), r * 1.25 * U, [OV.col(tint2), OV.col(tint), OV.col('#000000', 0.55)], [0, 0.6, 1])
    c.drawCircle(cx * U, cy * U, r * U, skia.Paint(AntiAlias=True, Shader=sh))
    c.drawCircle(cx * U, cy * U, r * U, P('#ffffff', 0.55, stroke=r * 0.03 * U))
    white_logo(c, kind, cx, cy, r * 0.62)
    hs = skia.GradientShader.MakeLinear([skia.Point(0, (cy - r * 0.9) * U), skia.Point(0, (cy - r * 0.2) * U)], [OV.col('#ffffff', 0.75), OV.col('#ffffff', 0.0)])
    c.drawOval(skia.Rect((cx - r * 0.62) * U, (cy - r * 0.92) * U, (cx + r * 0.62) * U, (cy - r * 0.3) * U), skia.Paint(AntiAlias=True, Shader=hs))


def main(path_name="copertina_P2_C"):
    img = np.zeros((H, W, 4), np.uint8); img[..., 3] = 255
    surf = skia.Surface(img); c = surf.getCanvas()
    bg(c)
    for x in range(-100, 2100, 150):
        flame(c, x + rnd.uniform(-30, 30), 1110, rnd.uniform(220, 330), rnd.uniform(330, 560), 0.9)
    for i in range(16):
        bill(c, 120 + i * 110 + rnd.uniform(-30, 30), 975 + rnd.uniform(-20, 30), rnd.uniform(-28, 28), burn=rnd.uniform(0.0, 0.6))
    orb(c, 'gemini', 1570, 720, 200, '#3d6df0', '#bcd0ff'); orb(c, 'claude', 350, 720, 200, '#e0612f', '#ffd0b0')
    orb(c, 'gpt', 960, 700, 260, '#10a37f', '#b4f5df')
    for x in range(40, 1900, 110):
        flame(c, x + rnd.uniform(-20, 20), 1100, rnd.uniform(110, 190), rnd.uniform(140, 250), 0.85)
    big(c, "AIs START A", 960, 180, 190, '#ffffff', '#f2f2f2', align='center', stroke=0.1)
    big(c, "CIVILIZATION", 960, 372, 190, '#ffffff', '#f2f2f2', align='center', stroke=0.1)
    # PART 2 badge
    c.save(); c.translate(1640 * U, 905 * U); c.rotate(-6)
    r = skia.RRect.MakeRectXY(skia.Rect(-190 * U, -82 * U, 190 * U, 82 * U), 22 * U, 22 * U)
    c.drawRRect(r, P('#000000', 0.5, blur=14 * U)); c.drawRRect(r, P('#ffd21f'))
    c.drawRRect(r, P('#000000', 1.0, stroke=9 * U))
    OV.txt(c, "PART 2", 0, 52 * U, 'anton', 154 * U, '#d00018', 1.0, 'center', 0.02, shadow=0)
    c.restore()
    rgb = img[..., :3].copy()
    save(rgb, path_name)


if __name__ == "__main__":
    main()
