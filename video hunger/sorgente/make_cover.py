# -*- coding: utf-8 -*-
"""YouTube covers for the Hunger Arena film.
Renders the cover shots (th_a, th_b in web/shots/t_test.js) at 3840x2160 hero quality, lays out the text with skia,
and writes   ../copertina_HG_A.jpg / _B.jpg  (1280x720, <2 MB: YouTube's limit)  plus the 4K masters (PNG) in the scratchpad.

  python3 make_cover.py            (needs the web server on :8124)
"""
import os, sys
import numpy as np
import cv2
import skia

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import overlays as OV
import grab

OUT = os.path.dirname(HERE)
S = os.environ.get("SCRATCH", "/tmp/claude-0/-home-user-Marry/e61fd834-a8c5-5cc5-8204-6c637a41951f/scratchpad")
W, H = 3840, 2160
U = W / 1920.0


def big(c, s, x, y, size, top='#ffffff', bot='#ffd24a', stroke=0.085, align='left', glow=None, key='anton'):
    """poster lettering: thick black outline, vertical gradient fill, soft shadow"""
    size *= U
    f = OV.font(key, size)
    w = OV.text_width(s, key, size)
    xx = x * U - (w / 2 if align == 'center' else w if align == 'right' else 0)
    yy = y * U
    if glow:
        c.drawString(s, xx, yy, f, OV.P(glow, 0.55, blur=size * 0.22))
    c.drawString(s, xx + size * 0.035, yy + size * 0.07, f, OV.P('#000000', 0.6, blur=size * 0.07))
    ps = skia.Paint(AntiAlias=True, Color=skia.ColorBLACK, Style=skia.Paint.kStroke_Style, StrokeWidth=size * stroke, StrokeJoin=skia.Paint.kRound_Join)
    c.drawString(s, xx, yy, f, ps)
    sh = skia.GradientShader.MakeLinear([skia.Point(0, yy - size * 0.78), skia.Point(0, yy)], [OV.col(top), OV.col(bot)])
    c.drawString(s, xx, yy, f, skia.Paint(AntiAlias=True, Shader=sh))
    return w / U


def shade(c, x0, y0, x1, y1, a=0.6, vertical=True, flip=False):
    p0, p1 = (skia.Point(x0 * U, y0 * U), skia.Point(x1 * U, y1 * U))
    cols = [OV.col('#000000', a), OV.col('#000000', 0)]
    c.drawRect(skia.Rect(min(x0, x1) * U, min(y0, y1) * U, max(x0, x1) * U, max(y0, y1) * U),
               skia.Paint(Shader=skia.GradientShader.MakeLinear([p0, p1], cols)))


def punch(img, sat=1.12, con=1.06):
    f = img.astype(np.float32) / 255
    g = f.mean(2, keepdims=True)
    f = g + (f - g) * sat
    f = 0.5 + (f - 0.5) * con
    return np.clip(f * 255, 0, 255).astype(np.uint8)


def save(rgb, name):
    master = os.path.join(S, name + "_4k.png")
    cv2.imwrite(master, cv2.cvtColor(rgb, cv2.COLOR_RGB2BGR))
    small = cv2.resize(rgb, (1280, 720), interpolation=cv2.INTER_AREA)
    path = os.path.join(OUT, name + ".jpg")
    for q in (97, 95, 92, 88, 84):
        cv2.imwrite(path, cv2.cvtColor(small, cv2.COLOR_RGB2BGR), [cv2.IMWRITE_JPEG_QUALITY, q])
        if os.path.getsize(path) < 1_900_000:
            break
    print(name, os.path.getsize(path) // 1024, "KB (q%d)" % q)


def canvas(img):
    rgba = np.dstack([img, np.full(img.shape[:2], 255, np.uint8)])
    surf = skia.Surface(rgba)
    return surf, surf.getCanvas(), rgba


def badge(c, x, y, s, size=52):
    f = OV.font('anton', size * U)
    w = OV.text_width(s, 'anton', size * U) / U
    pad = 26
    r = skia.RRect.MakeRectXY(skia.Rect((x - pad) * U, (y - size * 0.9 - 14) * U, (x + w + pad) * U, (y + 22) * U), 14 * U, 14 * U)
    c.drawRRect(r, OV.P('#e5251d'))
    c.drawString(s, x * U, y * U, f, OV.P('#ffffff'))


def main():
    g = grab.Grabber(1920, 1080, 2.0)
    a = punch(g.shot('th_a', 2.0, grade='golden', sat_boost=1.08), 1.14, 1.08)
    b = punch(g.shot('th_b', 2.0, grade='golden', sat_boost=1.08), 1.14, 1.08)
    g.close()

    # ---- A: the hundred on their pedestals, big lettering in the sky
    surf, c, rgba = canvas(a)
    shade(c, 0, 1080, 0, 700, 0.55)           # darken the bottom for contrast
    shade(c, 0, 0, 1000, 0, 0.35)             # and the left edge behind the text
    big(c, "100 AIs", 70, 330, 345, '#ffffff', '#ffe27a', glow='#ff9a1f')
    big(c, "ONE SURVIVOR", 78, 480, 150, '#ffd54a', '#ff8a00', glow='#ff5a00')
    save(rgba[..., :3].copy(), "copertina_HG_A")

    # ---- B: the contestant and the Horn
    surf, c, rgba = canvas(b)
    shade(c, 0, 0, 1000, 0, 0.5)               # darken the left side behind the text
    shade(c, 0, 1080, 0, 760, 0.45)
    big(c, "100 AIs", 70, 300, 320, '#ffffff', '#ffe27a', glow='#ff9a1f')
    big(c, "1 WINNER", 78, 470, 200, '#ffd54a', '#ff7a00', glow='#ff5a00')
    save(rgba[..., :3].copy(), "copertina_HG_B")


if __name__ == "__main__":
    main()
