# -*- coding: utf-8 -*-
"""On-screen graphics (ish-style): YEAR counter, chapter cards, name cards, quotes,
rules, captions, alien glyph cards, HUD bits, flashes, title and end screen."""
import math
import numpy as np
import skia
from motore.testo import tf, font, text_width, wrap
from motore.glifi import CHIAVE, draw_glifo

W, H = 1920, 1080


def clamp(x, a=0.0, b=1.0):
    return a if x < a else b if x > b else x


def sm(e0, e1, x):
    t = clamp((x - e0) / (e1 - e0)) if e1 != e0 else 1.0
    return t * t * (3 - 2 * t)


def eo(t):
    t = clamp(t)
    return 1 - (1 - t) ** 3


def fade_io(t, t0, t1, fin=0.25, fout=0.3):
    return sm(t0, t0 + fin, t) * (1 - sm(t1 - fout, t1, t))


def col(hexs, a=1.0):
    h = hexs.lstrip('#')
    return skia.Color(int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16), int(255 * clamp(a)))


def P(hexs, a=1.0, stroke=None, blur=0):
    p = skia.Paint(AntiAlias=True, Color=col(hexs, a))
    if stroke:
        p.setStyle(skia.Paint.kStroke_Style); p.setStrokeWidth(stroke); p.setStrokeCap(skia.Paint.kRound_Cap)
    if blur:
        p.setMaskFilter(skia.MaskFilter.MakeBlur(skia.kNormal_BlurStyle, blur))
    return p


def txt(c, s, x, y, key, size, hexs='#ffffff', a=1.0, align='left', spacing=0.0, shadow=0.55):
    if not s or a <= 0.005:
        return 0
    f = font(key, size)
    w = text_width(s, key, size, spacing)
    if align == 'center':
        x -= w / 2
    elif align == 'right':
        x -= w
    def draw(paint, dx=0, dy=0):
        if spacing == 0:
            c.drawString(s, x + dx, y + dy, f, paint)
        else:
            cx = x + dx
            for ch, wd in zip(s, f.getWidths(f.textToGlyphs(s))):
                c.drawString(ch, cx, y + dy, f, paint); cx += wd + spacing * size
    if shadow:
        draw(P('#000000', a * shadow, blur=size * 0.09), size * 0.02, size * 0.05)
    draw(P(hexs, a))
    return w


# ------------------------------------------------------------------------- elements
def year_counter(c, year, a, label='YEAR', sub=None):
    if a <= 0:
        return
    x, y = W - 64, 92
    s = f"{int(round(year)):,}"
    wv = text_width(s, 'ui_b', 66)
    wl = text_width(label, 'ui', 22, 0.3)
    bw = max(wv, wl) + 44
    c.drawRoundRect(skia.Rect(x - bw, y - 78, x + 8, y + (38 if sub else 18)), 14, 14, P('#0b0f16', 0.42 * a))
    txt(c, label, x - 18, y - 46, 'ui', 22, '#cfd8e6', a, 'right', 0.3, shadow=0)
    txt(c, s, x - 16, y + 6, 'ui_b', 66, '#ffffff', a, 'right', 0.01, shadow=0.3)
    if sub:
        txt(c, sub, x - 18, y + 30, 'ui', 20, '#ffd27a', a, 'right', 0.2, shadow=0)


def chapter_card(c, u, label, title, sub):
    a = sm(0.0, 0.16, u) * (1 - sm(0.84, 1.0, u))
    c.drawRect(skia.Rect(0, 0, W, H), P('#000000', 0.5 * a))
    cy = H / 2
    if label:
        txt(c, f"CHAPTER {label}", W / 2, cy - 92, 'ui', 26, '#d7dde8', a, 'center', 0.45)
    sp = 0.12 + 0.05 * eo(u)
    txt(c, title, W / 2, cy + 18, 'titolo', 96, '#ffffff', a, 'center', sp, shadow=0.7)
    wl = 380 * eo(clamp(u * 2.4))
    c.drawLine(W / 2 - wl / 2, cy + 52, W / 2 + wl / 2, cy + 52, P('#ffd27a', a * 0.9, stroke=2.5))
    txt(c, sub, W / 2, cy + 104, 'ui_b', 30, '#ffd27a', a, 'center', 0.35)


def title_card(c, u):
    a = sm(0.0, 0.12, u) * (1 - sm(0.86, 1.0, u))
    c.drawRect(skia.Rect(0, 0, W, H), P('#000000', 0.28 * a))
    k = eo(clamp(u * 1.8))
    txt(c, "I LET AI BUILD", W / 2, H / 2 - 70 + (1 - k) * 20, 'anton', 110, '#ffffff', a, 'center', 0.02, shadow=0.8)
    txt(c, "A CIVILIZATION", W / 2, H / 2 + 52 + (1 - k) * 20, 'anton', 110, '#ffffff', a, 'center', 0.02, shadow=0.8)
    a2 = a * sm(0.25, 0.4, u)
    txt(c, "DEMOCRACY", W / 2 - 40, H / 2 + 140, 'ui_b', 44, '#5ea4ff', a2, 'right', 0.12)
    txt(c, "OR", W / 2, H / 2 + 140, 'ui', 34, '#ffffff', a2, 'center', 0.1)
    txt(c, "MONARCHY?", W / 2 + 40, H / 2 + 140, 'ui_b', 44, '#ff5a5a', a2, 'left', 0.12)


def name_card(c, u, name, role, color='#ffffff', side='left'):
    a = sm(0.0, 0.08, u) * (1 - sm(0.9, 1.0, u))
    if a <= 0:
        return
    sl = (1 - eo(clamp(u * 6))) * 60
    x = 96 - sl if side == 'left' else W - 96 + sl
    y = H - 170
    al = 'left' if side == 'left' else 'right'
    sg = 1 if side == 'left' else -1
    g = skia.GradientShader.MakeLinear([skia.Point(0, H - 330), skia.Point(0, H)], [col('#000000', 0), col('#000000', 0.62 * a)])
    c.drawRect(skia.Rect(0, H - 330, W, H), skia.Paint(Shader=g))
    c.drawRect(skia.Rect(x - (0 if side == 'left' else 8), y - 92, x + (8 if side == 'left' else 0), y + 40), P(color, a))
    txt(c, name, x + sg * 28, y - 8, 'anton', 92, '#ffffff', a, al, 0.01, shadow=0.6)
    txt(c, role, x + sg * 30, y + 34, 'ui_b', 28, color, a * sm(0.06, 0.18, u), al, 0.18, shadow=0.6)


def quote_card(c, u, who, quote, color='#ffffff'):
    a = sm(0.0, 0.06, u) * (1 - sm(0.94, 1.0, u))
    if a <= 0:
        return
    g = skia.GradientShader.MakeLinear([skia.Point(0, H - 360), skia.Point(0, H)], [col('#000000', 0), col('#000000', 0.7 * a)])
    c.drawRect(skia.Rect(0, H - 360, W, H), skia.Paint(Shader=g))
    lines = wrap(quote, 'corsivo_b', 58, W * 0.72)
    y0 = H - 110 - (len(lines) - 1) * 66
    tw = text_width(who, 'ui_b', 24, 0.2) + 36
    c.drawRoundRect(skia.Rect(W / 2 - tw / 2, y0 - 104, W / 2 + tw / 2, y0 - 66), 19, 19, P(color, a))
    txt(c, who, W / 2, y0 - 77, 'ui_b', 24, '#101010', a, 'center', 0.2, shadow=0)
    # reveal words progressively
    total = sum(len(l) for l in lines)
    shown = int(total * clamp(u / 0.75) + 0.999)
    k = 0
    for i, l in enumerate(lines):
        vis = l[:max(0, shown - k)]; k += len(l)
        txt(c, vis, W / 2 - text_width(l, 'corsivo_b', 58) / 2, y0 + i * 66, 'corsivo_b', 58, '#ffffff', a, 'left', 0, shadow=0.8)


def rule_card(c, u, n, line1, line2=None):
    a = sm(0.0, 0.1, u) * (1 - sm(0.9, 1.0, u))
    c.drawRect(skia.Rect(0, 0, W, H), P('#000000', 0.38 * a))
    k = eo(clamp(u * 4))
    txt(c, f"RULE #{n}", W / 2, H / 2 - 70 - (1 - k) * 20, 'ui_b', 40, '#ffd27a', a, 'center', 0.35)
    txt(c, line1, W / 2, H / 2 + 22, 'anton', 84, '#ffffff', a, 'center', 0.01, shadow=0.7)
    if line2:
        txt(c, line2, W / 2, H / 2 + 92, 'ui_b', 36, '#e8edf5', a * sm(0.1, 0.25, u), 'center', 0.04)


def caption(c, u, s, color='#ffffff', y=None, size=78, key='anton', box=None):
    a = sm(0.0, 0.07, u) * (1 - sm(0.88, 1.0, u))
    if a <= 0:
        return
    y = H - 150 if y is None else y
    pop = 1 + 0.18 * (1 - eo(clamp(u * 7)))
    if box:
        w = text_width(s, key, size * pop) + 50
        c.drawRoundRect(skia.Rect(W / 2 - w / 2, y - size * pop * 0.95, W / 2 + w / 2, y + size * 0.3), 12, 12, P(box, 0.9 * a))
    txt(c, s, W / 2, y, key, size * pop, color, a, 'center', 0.01, shadow=0.8)


def glyph_card(c, u, key, word, meaning, color='#ffd27a', x=None):
    a = sm(0.0, 0.1, u) * (1 - sm(0.88, 1.0, u))
    if a <= 0:
        return
    x = W / 2 if x is None else x
    y = H / 2 - 40
    c.drawCircle(x, y, 150, P('#000000', 0.45 * a))
    c.drawCircle(x, y, 150, P(color, 0.8 * a, stroke=3))
    _glyph(c, key, x, y, 90, color, a, clamp(u * 2.2))
    txt(c, word.upper(), x, y + 230, 'anton', 72, '#ffffff', a, 'center', 0.05, shadow=0.7)
    txt(c, meaning, x, y + 282, 'corsivo_b', 42, color, a, 'center', 0, shadow=0.7)


def _glyph(c, key, x, y, size, hexs, a, prog):
    strokes = CHIAVE[key]
    n = len(strokes)
    p = P(hexs, a, stroke=max(3, size * 0.1))
    from motore.glifi import _stroke_path
    for i, st in enumerate(strokes):
        lp = clamp(prog * n - i)
        if lp <= 0:
            continue
        if isinstance(st, tuple) and st[0] == 'dot':
            c.drawCircle(x + st[1] * size, y + st[2] * size, size * 0.09 * lp, P(hexs, a)); continue
        path = _stroke_path(st, x, y, size)
        if path is None:
            continue
        if lp < 1:
            meas = skia.PathMeasure(path, False); L = meas.getLength(); seg = skia.Path(); meas.getSegment(0, L * lp, seg, True); path = seg
        c.drawPath(path, P(hexs, a * 0.5, stroke=max(6, size * 0.22), blur=size * 0.08))
        c.drawPath(path, p)


def energy_bar(c, u, x, y, level, label='ENERGY', w=260):
    a = sm(0.0, 0.1, u) * (1 - sm(0.9, 1.0, u))
    if a <= 0:
        return
    lv = clamp(level)
    colr = '#4ade80' if lv > 0.5 else '#facc15' if lv > 0.2 else '#ef4444'
    c.drawRoundRect(skia.Rect(x - 10, y - 46, x + w + 10, y + 26), 10, 10, P('#0b0f16', 0.55 * a))
    txt(c, label, x, y - 18, 'ui_b', 20, '#cfd8e6', a, 'left', 0.25, shadow=0)
    txt(c, f"{int(round(lv * 100))}%", x + w, y - 18, 'ui_b', 20, colr, a, 'right', 0.05, shadow=0)
    c.drawRoundRect(skia.Rect(x, y - 6, x + w, y + 12), 9, 9, P('#ffffff', 0.15 * a))
    c.drawRoundRect(skia.Rect(x, y - 6, x + w * lv, y + 12), 9, 9, P(colr, a))


def place_card(c, u, name, sub):
    a = sm(0.0, 0.12, u) * (1 - sm(0.88, 1.0, u))
    txt(c, name, W / 2, H * 0.36, 'titolo', 120, '#ffffff', a, 'center', 0.2, shadow=0.8)
    txt(c, sub, W / 2, H * 0.36 + 60, 'corsivo_b', 46, '#ffd27a', a, 'center', 0, shadow=0.8)


def hud_search(c, u, t):
    a = sm(0.0, 0.1, u) * (1 - sm(0.9, 1.0, u))
    if a <= 0:
        return
    x, y = W / 2, H - 170
    c.drawRoundRect(skia.Rect(x - 330, y - 70, x + 330, y + 40), 12, 12, P('#05080d', 0.7 * a))
    c.drawRoundRect(skia.Rect(x - 330, y - 70, x + 330, y + 40), 12, 12, P('#ff4d4d', 0.8 * a, stroke=2))
    dots = '.' * (int(t * 3) % 4)
    txt(c, f"SEARCHING: KASSA XIX{dots}", x, y - 28, 'mono_b', 30, '#ffffff', a, 'center', 0.05, shadow=0)
    blink = 1 if (t * 2) % 1 < 0.6 else 0.3
    txt(c, "NO SIGNAL", x, y + 18, 'mono_b', 34, '#ff4d4d', a * blink, 'center', 0.3, shadow=0)


def kings_ticker(c, u):
    a = sm(0.0, 0.08, u) * (1 - sm(0.9, 1.0, u))
    if a <= 0:
        return
    roman = ['VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'XIII', 'XIV', 'XV', 'XVI', 'XVII', 'XVIII', 'XIX']
    i = min(len(roman) - 1, int(u * len(roman) * 1.05))
    txt(c, "KING KASSA", W / 2, H - 200, 'ui_b', 40, '#ffb3b3', a, 'center', 0.25)
    txt(c, roman[i], W / 2, H - 110, 'anton', 110, '#ffffff', a, 'center', 0.05, shadow=0.8)


def end_screen(c, u):
    a = sm(0.0, 0.08, u)
    c.drawRect(skia.Rect(0, 0, W, H), P('#000000', 0.35 * a))
    txt(c, "WHAT SHOULD I TELL THEM?", W / 2, 170, 'anton', 84, '#ffffff', a, 'center', 0.02, shadow=0.8)
    txt(c, "the most liked comment gets sent into the simulation", W / 2, 228, 'corsivo_b', 40, '#ffd27a', a, 'center', 0, shadow=0.8)
    # end-screen placeholders (YouTube elements go here)
    for (x0, y0, w, h) in [(250, 420, 640, 360), (1030, 420, 640, 360)]:
        c.drawRoundRect(skia.Rect(x0, y0, x0 + w, y0 + h), 18, 18, P('#ffffff', 0.08 * a))
        c.drawRoundRect(skia.Rect(x0, y0, x0 + w, y0 + h), 18, 18, P('#ffffff', 0.35 * a, stroke=2))
    txt(c, "WATCH NEXT", 570, 400, 'ui_b', 28, '#ffffff', a * 0.8, 'center', 0.3)
    txt(c, "SUBSCRIBE FOR PART 2", 1350, 400, 'ui_b', 28, '#ffffff', a * 0.8, 'center', 0.3)


def comment_prompt(c, u, t):
    a = sm(0.0, 0.1, u) * (1 - sm(0.92, 1.0, u))
    if a <= 0:
        return
    x0, y0, w, h = W / 2 - 520, H - 250, 1040, 120
    c.drawRoundRect(skia.Rect(x0, y0, x0 + w, y0 + h), 60, 60, P('#0f1115', 0.85 * a))
    c.drawRoundRect(skia.Rect(x0, y0, x0 + w, y0 + h), 60, 60, P('#ffffff', 0.4 * a, stroke=2))
    msg = "Dear Observer..."
    n = int(len(msg) * clamp(u * 2.5))
    txt(c, msg[:n], x0 + 70, y0 + 76, 'ui', 44, '#e9eef6', a, 'left', 0, shadow=0)
    if (t * 2) % 1 < 0.6:
        cx = x0 + 74 + text_width(msg[:n], 'ui', 44)
        c.drawRect(skia.Rect(cx, y0 + 36, cx + 4, y0 + 86), P('#ffffff', a))
    txt(c, "COMMENT", x0 + w - 80, y0 + 74, 'ui_b', 32, '#5ea4ff', a, 'right', 0.25, shadow=0)


def flash(c, k):
    if k > 0:
        c.drawRect(skia.Rect(0, 0, W, H), P('#ffffff', clamp(k)))


def letterbox(c, k):
    if k > 0:
        bh = int(132 * k)
        c.drawRect(skia.Rect(0, 0, W, bh), P('#000000', 1)); c.drawRect(skia.Rect(0, H - bh, W, H), P('#000000', 1))
