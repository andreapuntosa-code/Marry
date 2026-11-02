# -*- coding: utf-8 -*-
"""Kevin, drawn as a flat vector cartoon (thick dark outlines, flat colours, a bit of shading) with skia.
draw_kevin(c, x, y, s, expr, pose, t, talk=0, look=(0, 0), blink=0) draws him standing with his feet at (x, y)."""
import math
import skia

OUT = '#1d1530'
LW = 7.0
SKIN, SKIN_D = '#f7c49b', '#e5a47c'
HAIR, HAIR_D = '#f2a23a', '#d07f22'
CAP, CAP_D = '#e8413b', '#b92f2b'
HOOD, HOOD_D = '#35c46a', '#239a51'
PANTS, PANTS_D = '#3d5a99', '#2d4479'
SHOE = '#ffffff'


def col(h, a=1.0):
    h = h.lstrip('#'); al = int(h[6:8], 16) / 255 if len(h) == 8 else 1.0
    return skia.Color(int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16), int(255 * max(0, min(1, al * a))))


def fill(h, a=1.0):
    return skia.Paint(AntiAlias=True, Color=col(h, a))


def stroke(h=OUT, w=LW, a=1.0):
    p = skia.Paint(AntiAlias=True, Color=col(h, a)); p.setStyle(skia.Paint.kStroke_Style); p.setStrokeWidth(w)
    p.setStrokeCap(skia.Paint.kRound_Cap); p.setStrokeJoin(skia.Paint.kRound_Join); return p


def shape(c, path, f, w=LW):
    c.drawPath(path, fill(f)); c.drawPath(path, stroke(OUT, w))


def oval(cx, cy, rx, ry):
    p = skia.Path(); p.addOval(skia.Rect(cx - rx, cy - ry, cx + rx, cy + ry)); return p


def rrect(x0, y0, x1, y1, r):
    p = skia.Path(); p.addRoundRect(skia.Rect(x0, y0, x1, y1), r, r); return p


# arm angles in degrees from hanging straight down; positive swings outwards (away from the body); elbow bends the forearm
POSES = {
    'idle':  ((12, 8), (12, 8)),
    'point': ((14, 6), (118, 18)),       # (left, right): right arm points up and out
    'shrug': ((58, 92), (58, 92)),
    'cheer': ((158, 12), (158, 12)),
    'think': ((14, 6), (28, -148)),
    'phone': ((14, 6), (22, -118)),
    'eat':   ((14, 6), (52, -170)),
    'arms':  ((48, -58), (48, -58)),     # hands on hips
}


def _arm(c, sx, sy, side, a_sh, a_el, s, hand_item=None, t=0.0):
    L1, L2 = 150 * s, 140 * s
    ang = math.radians(a_sh) * side
    ex, ey = sx + math.sin(ang) * L1, sy + math.cos(ang) * L1
    ang2 = ang + math.radians(a_el) * side
    hx, hy = ex + math.sin(ang2) * L2, ey + math.cos(ang2) * L2
    p = skia.Path(); p.moveTo(sx, sy); p.lineTo(ex, ey); p.lineTo(hx, hy)
    c.drawPath(p, stroke(OUT, 74 * s + LW * 2)); c.drawPath(p, stroke(HOOD, 74 * s))
    c.drawPath(p, stroke(HOOD_D, 16 * s, 0.35))
    # cuff and hand
    cx_, cy_ = ex + (hx - ex) * 0.86, ey + (hy - ey) * 0.86
    c.drawCircle(cx_, cy_, 36 * s, fill(HOOD_D)); c.drawCircle(cx_, cy_, 36 * s, stroke())
    if hand_item == 'phone':
        ph = rrect(hx - 34 * s, hy - 62 * s, hx + 34 * s, hy + 50 * s, 12 * s); shape(c, ph, '#2b2b3a')
        c.drawRoundRect(skia.Rect(hx - 26 * s, hy - 54 * s, hx + 26 * s, hy + 40 * s), 8 * s, 8 * s, fill('#5be1ff'))
    if hand_item == 'sandwich':
        b = rrect(hx - 70 * s, hy - 40 * s, hx + 70 * s, hy + 10 * s, 26 * s); shape(c, b, '#f3c26b')
        c.drawRect(skia.Rect(hx - 74 * s, hy + 6 * s, hx + 74 * s, hy + 20 * s), fill('#6cc04a'))
        c.drawRect(skia.Rect(hx - 70 * s, hy + 18 * s, hx + 70 * s, hy + 30 * s), fill('#e8413b'))
        b2 = rrect(hx - 70 * s, hy + 28 * s, hx + 70 * s, hy + 62 * s, 22 * s); shape(c, b2, '#f3c26b')
    c.drawCircle(hx, hy, 34 * s, fill(SKIN)); c.drawCircle(hx, hy, 34 * s, stroke())
    if hand_item in (None, 'point') and a_sh > 90 and side > 0:   # pointing finger
        c.drawLine(hx, hy, hx + math.sin(ang2) * 40 * s, hy + math.cos(ang2) * 40 * s, stroke(OUT, 26 * s)); c.drawLine(hx, hy, hx + math.sin(ang2) * 40 * s, hy + math.cos(ang2) * 40 * s, stroke(SKIN, 14 * s))
    return hx, hy


def _eyes(c, s, expr, look, blink, t):
    for sd in (-1, 1):
        ex, ey = sd * 72 * s, -858 * s
        ry = 58 * s * (1 - 0.92 * blink)
        if expr == 'happy' and blink < 0.5: ry *= 0.85
        e = oval(ex, ey, 50 * s, max(4 * s, ry)); shape(c, e, '#ffffff', LW)
        if blink < 0.6:
            px, py = ex + look[0] * 14 * s, ey + look[1] * 12 * s + 6 * s
            if expr == 'greedy':
                f = skia.Font(None, 70 * s); f.setEmbolden(True)
                c.drawString('$', px - 20 * s, py + 24 * s, f, fill('#1f9e4f'))
            elif expr == 'excited':
                _star(c, px, py, 26 * s, '#ffd60a'); c.drawCircle(px - 8 * s, py - 8 * s, 6 * s, fill('#ffffff'))
            else:
                r = 22 * s if expr != 'shocked' else 14 * s
                c.drawCircle(px, py, r, fill(OUT)); c.drawCircle(px - 7 * s, py - 8 * s, 7 * s, fill('#ffffff'))
        # brows
        bx, by = ex, -922 * s
        tilt = {'happy': -6, 'smug': 14 if sd > 0 else -4, 'shocked': -14, 'sad': 18, 'nervous': 16, 'excited': -12, 'greedy': 8, 'chew': 0}.get(expr, 0)
        lift = {'shocked': -18, 'excited': -14, 'sad': -4}.get(expr, 0) * s
        a = math.radians(tilt * sd)
        dx, dy = math.cos(a) * 34 * s, math.sin(a) * 34 * s
        c.drawLine(bx - dx, by + lift - dy, bx + dx, by + lift + dy, stroke(HAIR_D, 16 * s))


def _star(c, x, y, r, h):
    p = skia.Path()
    for k in range(10):
        rr = r if k % 2 == 0 else r * 0.45; a = -math.pi / 2 + k * math.pi / 5
        (p.moveTo if k == 0 else p.lineTo)(x + math.cos(a) * rr, y + math.sin(a) * rr)
    p.close(); c.drawPath(p, fill(h)); c.drawPath(p, stroke(OUT, 3))


def _mouth(c, s, expr, talk, t):
    mx, my = 0, -752 * s
    if talk > 0.05 or expr in ('shocked',):
        o = max(talk, 0.75 if expr == 'shocked' else 0)
        w, h = (46 + 10 * o) * s, (14 + 46 * o) * s
        m = oval(mx, my + h * 0.3, w, h); shape(c, m, '#7a1f2b', 6)
        c.save(); c.clipPath(m, doAntiAlias=True)
        c.drawRect(skia.Rect(mx - w, my + h * 0.3 - h, mx + w, my + h * 0.3 - h + 16 * s), fill('#ffffff'))
        c.drawCircle(mx, my + h * 0.3 + h * 0.8, w * 0.7, fill('#ff7a8a')); c.restore()
        return
    if expr in ('happy', 'excited', 'greedy'):
        w = 74 * s if expr != 'happy' else 62 * s
        p = skia.Path(); p.moveTo(mx - w, my - 10 * s); p.cubicTo(mx - w * 0.6, my + 74 * s, mx + w * 0.6, my + 74 * s, mx + w, my - 10 * s); p.close()
        shape(c, p, '#7a1f2b', 6)
        c.save(); c.clipPath(p, doAntiAlias=True)
        c.drawRect(skia.Rect(mx - w, my - 12 * s, mx + w, my + 8 * s), fill('#ffffff'))
        c.drawRect(skia.Rect(mx - 5 * s, my - 12 * s, mx + 5 * s, my + 9 * s), fill('#7a1f2b'))     # the gap tooth
        c.drawCircle(mx, my + 52 * s, w * 0.5, fill('#ff7a8a')); c.restore()
    elif expr == 'smug':
        p = skia.Path(); p.moveTo(mx - 46 * s, my + 8 * s); p.cubicTo(mx - 10 * s, my + 24 * s, mx + 30 * s, my + 14 * s, mx + 54 * s, my - 14 * s)
        c.drawPath(p, stroke(OUT, 9 * s))
    elif expr == 'sad':
        p = skia.Path(); p.moveTo(mx - 44 * s, my + 22 * s); p.cubicTo(mx - 20 * s, my - 14 * s, mx + 20 * s, my - 14 * s, mx + 44 * s, my + 22 * s)
        c.drawPath(p, stroke(OUT, 9 * s))
    elif expr == 'nervous':
        p = skia.Path(); p.moveTo(mx - 50 * s, my + 6 * s)
        for k in range(1, 9): p.lineTo(mx - 50 * s + k * 12.5 * s, my + 6 * s + (8 if k % 2 else -8) * s)
        c.drawPath(p, stroke(OUT, 8 * s))
        d = skia.Path(); d.moveTo(170 * s, -940 * s); d.cubicTo(190 * s, -900 * s, 198 * s, -880 * s, 182 * s, -868 * s); d.cubicTo(164 * s, -860 * s, 152 * s, -885 * s, 170 * s, -940 * s); d.close()
        c.drawPath(d, fill('#7fd3ff')); c.drawPath(d, stroke(OUT, 4))
    elif expr == 'chew':
        k = 0.5 + 0.5 * math.sin(t * 14)
        p = oval(mx, my + 6 * s, 30 * s, (8 + 10 * k) * s); shape(c, p, '#7a1f2b', 6)
        for sd in (-1, 1): c.drawCircle(sd * 112 * s, -770 * s, (30 + 8 * k) * s, fill(SKIN_D, 0.8))


def draw_kevin(c, x, y, s, expr='happy', pose='idle', t=0.0, talk=0.0, look=(0.0, 0.0), blink=0.0, bob=1.0):
    c.save(); c.translate(x, y)
    br = math.sin(t * 2.4) * 6 * s * bob
    sh = POSES.get(pose, POSES['idle'])
    item = {'phone': 'phone', 'eat': 'sandwich'}.get(pose)
    # legs and shoes
    for sd in (-1, 1):
        lg = rrect(sd * 62 * s - 40 * s, -262 * s, sd * 62 * s + 40 * s, -40 * s, 26 * s); shape(c, lg, PANTS)
        sh_ = skia.Path(); sh_.addRoundRect(skia.Rect(sd * 62 * s - 58 * s + sd * 10 * s, -62 * s, sd * 62 * s + 58 * s + sd * 10 * s, 0), 30 * s, 30 * s)
        shape(c, sh_, SHOE); c.drawLine(sd * 62 * s - 40 * s + sd * 10 * s, -30 * s, sd * 62 * s + 40 * s + sd * 10 * s, -30 * s, stroke('#e8413b', 10 * s))
    c.translate(0, br)
    # hood behind the head
    hd = oval(0, -650 * s, 150 * s, 70 * s); shape(c, hd, HOOD_D)
    # back arm items are drawn after the body for simplicity; torso
    tp = skia.Path()
    tp.moveTo(-160 * s, -630 * s); tp.cubicTo(-190 * s, -620 * s, -200 * s, -560 * s, -196 * s, -420 * s)
    tp.lineTo(-188 * s, -250 * s); tp.cubicTo(-186 * s, -226 * s, -170 * s, -218 * s, -150 * s, -218 * s)
    tp.lineTo(150 * s, -218 * s); tp.cubicTo(170 * s, -218 * s, 186 * s, -226 * s, 188 * s, -250 * s)
    tp.lineTo(196 * s, -420 * s); tp.cubicTo(200 * s, -560 * s, 190 * s, -620 * s, 160 * s, -630 * s); tp.close()
    shape(c, tp, HOOD)
    c.drawRect(skia.Rect(-188 * s, -262 * s, 188 * s, -226 * s), fill(HOOD_D)); c.drawPath(tp, stroke())
    pk = rrect(-110 * s, -400 * s, 110 * s, -290 * s, 30 * s); shape(c, pk, HOOD_D, 5)
    for sd in (-1, 1): c.drawLine(sd * 34 * s, -628 * s, sd * 40 * s, -520 * s, stroke('#ffffff', 9 * s))
    c.drawCircle(0, -500 * s, 46 * s, fill('#ffd60a')); c.drawCircle(0, -500 * s, 46 * s, stroke(OUT, 5))
    f = skia.Font(None, 64 * s); f.setEmbolden(True); c.drawString('$', -17 * s, -478 * s, f, fill('#1f9e4f'))
    # arms
    (la, le), (ra, re) = sh
    _arm(c, -168 * s, -592 * s, -1, la, le, s, None, t)
    _arm(c, 168 * s, -592 * s, 1, ra, re, s, item, t)
    # neck + head
    c.drawRect(skia.Rect(-40 * s, -700 * s, 40 * s, -630 * s), fill(SKIN_D))
    tilt = math.sin(t * 1.3) * 2.0 * bob + (6 * math.sin(t * 9) if talk > 0.1 else 0) * 0.4
    c.save(); c.rotate(tilt, 0, -720 * s)
    for sd in (-1, 1):
        er = oval(sd * 192 * s, -840 * s, 34 * s, 44 * s); shape(c, er, SKIN)
    head = oval(0, -850 * s, 196 * s, 182 * s); shape(c, head, SKIN)
    # hair: fluffy puffs on both sides under the cap
    for sd in (-1, 1):
        for k, (dx, dy, r) in enumerate([(176, -930, 46), (196, -884, 36), (150, -960, 40)]):
            c.drawCircle(sd * dx * s, dy * s, r * s, fill(HAIR)); c.drawCircle(sd * dx * s, dy * s, r * s, stroke(OUT, 5))
        c.drawCircle(sd * 176 * s, -930 * s, 40 * s, fill(HAIR))
    # backwards cap: dome + strap opening + button
    cp = skia.Path(); cp.moveTo(-205 * s, -930 * s); cp.cubicTo(-200 * s, -1080 * s, 200 * s, -1080 * s, 205 * s, -930 * s)
    cp.cubicTo(120 * s, -952 * s, -120 * s, -952 * s, -205 * s, -930 * s); cp.close(); shape(c, cp, CAP)
    op = skia.Path(); op.moveTo(-60 * s, -944 * s); op.cubicTo(-50 * s, -1000 * s, 50 * s, -1000 * s, 60 * s, -944 * s); op.close(); shape(c, op, HAIR, 5)
    c.drawLine(-60 * s, -950 * s, 60 * s, -950 * s, stroke(CAP_D, 12 * s))
    c.drawCircle(0, -1048 * s, 14 * s, fill(CAP_D))
    # face: freckles, blush, nose
    for sd in (-1, 1):
        c.drawCircle(sd * 120 * s, -790 * s, 30 * s, fill('#ff8fa3', 0.45))
        for k, (dx, dy) in enumerate([(-14, -10), (8, -16), (2, 6)]): c.drawCircle(sd * (118 + dx) * s, (-806 + dy) * s, 4.5 * s, fill('#c07a50'))
    no = oval(0, -800 * s, 22 * s, 16 * s); c.drawPath(no, fill(SKIN_D)); c.drawPath(no, stroke(OUT, 4))
    _eyes(c, s, expr, look, blink, t)
    _mouth(c, s, expr, talk, t)
    c.restore()
    c.restore()


def draw_mom(c, x, y, s, talk=0.0, t=0.0):
    """Mom's portrait (head and shoulders), centred at (x, y)"""
    c.save(); c.translate(x, y)
    b = rrect(-190 * s, 120 * s, 190 * s, 330 * s, 90 * s); shape(c, b, '#ff7ab6')
    f = skia.Font(None, 54 * s); f.setEmbolden(True); w = f.measureText('MOM'); c.drawString('MOM', -w / 2, 250 * s, f, fill('#ffffff'))
    hr = oval(0, -20 * s, 190 * s, 200 * s); shape(c, hr, '#6b3a1f')
    for k in range(9):
        a = k / 9 * 2 * math.pi; c.drawCircle(math.cos(a) * 170 * s, -20 * s + math.sin(a) * 180 * s, 42 * s, fill('#6b3a1f'))
    hd = oval(0, 0, 130 * s, 145 * s); shape(c, hd, '#f0b48a')
    for sd in (-1, 1):
        c.drawCircle(sd * 48 * s, -10 * s, 40 * s, stroke(OUT, 7)); c.drawCircle(sd * 48 * s, -8 * s, 13 * s, fill(OUT))
        c.drawCircle(sd * 82 * s, 50 * s, 22 * s, fill('#ff8fa3', 0.5))
        c.drawLine(sd * 28 * s, -66 * s, sd * 70 * s, -60 * s - sd * 0, stroke('#4a2a14', 9 * s))
    c.drawLine(-8 * s, -10 * s, 8 * s, -10 * s, stroke(OUT, 6))
    if talk > 0.05:
        m = oval(0, 66 * s, 30 * s, (8 + 26 * talk) * s); shape(c, m, '#7a1f2b', 5)
    else:
        p = skia.Path(); p.moveTo(-32 * s, 60 * s); p.cubicTo(-12 * s, 78 * s, 12 * s, 78 * s, 32 * s, 60 * s); c.drawPath(p, stroke(OUT, 7))
    c.restore()
