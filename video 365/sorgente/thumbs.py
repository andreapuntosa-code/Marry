# -*- coding: utf-8 -*-
"""YouTube thumbnails (1280x720): renders dedicated 16:9 shots and lays out bold ish-style text.
  copertina_A.jpg — DEMOCRACY vs MONARCHY (split screen, blue vs red)
  copertina_B.jpg — the raised hand: '20 AIs · 0 RULES'
"""
import os, sys, json, base64
import numpy as np
import cv2
import skia
from playwright.sync_api import sync_playwright

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import overlays as OV

CHROME = "/opt/pw-browsers/chromium-1194/chrome-linux/chrome"
OUTDIR = os.path.dirname(HERE)
W, H = 1920, 1080


def grab(page, cdp, sid, t=1.0):
    page.evaluate(f"loadShot({json.dumps(sid)}, 4.0, {{}})")
    page.evaluate(f"renderShot({t})")
    page.evaluate(f"renderShot({t})")
    r = cdp.send('Page.captureScreenshot', {'format': 'png', 'clip': {'x': 0, 'y': 0, 'width': W, 'height': H, 'scale': 1}})
    img = cv2.imdecode(np.frombuffer(base64.b64decode(r['data']), np.uint8), cv2.IMREAD_COLOR)
    return cv2.cvtColor(img, cv2.COLOR_BGR2RGB)


def punch(img, sat=1.25, con=1.12, warm=0.0):
    f = img.astype(np.float32) / 255
    g = f.mean(2, keepdims=True)
    f = g + (f - g) * sat
    f = 0.5 + (f - 0.5) * con
    f[..., 0] += warm; f[..., 2] -= warm
    return np.clip(f * 255, 0, 255).astype(np.uint8)


def text(c, s, x, y, size, color='#ffffff', align='center', key='anton', stroke=10, shadow=True):
    f = OV.font(key, size)
    w = OV.text_width(s, key, size)
    xx = x - w / 2 if align == 'center' else x - w if align == 'right' else x
    if shadow:
        p = OV.P('#000000', 0.55, blur=size * 0.08); c.drawString(s, xx + size * 0.03, y + size * 0.06, f, p)
    if stroke:
        p = skia.Paint(AntiAlias=True, Color=skia.ColorBLACK, Style=skia.Paint.kStroke_Style, StrokeWidth=stroke, StrokeJoin=skia.Paint.kRound_Join)
        c.drawString(s, xx, y, f, p)
    c.drawString(s, xx, y, f, OV.P(color))
    return w


def main():
    S = os.environ.get('SCRATCH', '/tmp/claude-0/-home-user-Marry/e61fd834-a8c5-5cc5-8204-6c637a41951f/scratchpad')
    saved = [os.path.join(S, f'thumb365_{n}.png') for n in ('f', 'p', 'wide')]
    if '--reuse' in sys.argv and all(os.path.exists(f) for f in saved):
        f_, p_, w_ = [cv2.cvtColor(cv2.imread(f), cv2.COLOR_BGR2RGB) for f in saved]
        return layout(f_, p_, w_)
    pw = sync_playwright().start()
    br = pw.chromium.launch(executable_path=CHROME, headless=True, args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--use-gl=angle'])
    page = br.new_page(viewport={'width': W, 'height': H})
    page.goto("http://127.0.0.1:8125/index.html?scale=1&scope=0")
    page.wait_for_function('window.ready === true || window.loadError', timeout=300000)
    cdp = page.context.new_cdp_session(page)
    f_ = grab(page, cdp, 'th_f'); p_ = grab(page, cdp, 'th_p'); w_ = grab(page, cdp, 'th_wide')
    br.close(); pw.stop()
    for n, im in [('f', f_), ('p', p_), ('wide', w_)]:
        cv2.imwrite(os.path.join(S, f'thumb365_{n}.png'), cv2.cvtColor(im, cv2.COLOR_RGB2BGR))
    return layout(f_, p_, w_)


def layout(fo, pl, wide):
    # ---------- A: forest vs plain, diagonal split
    f = punch(fo, 1.35, 1.15, -0.02)
    p = punch(pl, 1.35, 1.15, 0.04)
    f = np.clip(f.astype(np.float32) * np.array([0.85, 1.08, 0.9]), 0, 255).astype(np.uint8)
    p = np.clip(p.astype(np.float32) * np.array([1.12, 1.02, 0.82]), 0, 255).astype(np.uint8)
    out = np.zeros((H, W, 3), np.uint8)
    yy, xx = np.mgrid[0:H, 0:W]
    split = (xx - W * 0.5) + (yy - H * 0.5) * 0.22 > 0
    out[split] = p[split]; out[~split] = f[~split]
    rgba = np.dstack([out, np.full((H, W), 255, np.uint8)])
    surf = skia.Surface(rgba); c = surf.getCanvas()
    pth = skia.Path(); pth.moveTo(W * 0.5 + H * 0.5 * 0.22, 0); pth.lineTo(W * 0.5 - H * 0.5 * 0.22, H)
    c.drawPath(pth, skia.Paint(AntiAlias=True, Color=skia.ColorWHITE, Style=skia.Paint.kStroke_Style, StrokeWidth=14))
    text(c, "FOREST", W * 0.25, H * 0.2, 170, '#6fe08a', stroke=16)
    text(c, "PLAIN", W * 0.76, H * 0.2, 170, '#ffd048', stroke=16)
    c.drawCircle(W * 0.5, H * 0.52, 118, OV.P('#ff3b30'))
    c.drawCircle(W * 0.5, H * 0.52, 118, skia.Paint(AntiAlias=True, Color=skia.ColorBLACK, Style=skia.Paint.kStroke_Style, StrokeWidth=10))
    text(c, "VS", W * 0.5, H * 0.52 + 52, 150, '#ffffff', stroke=0, shadow=False)
    text(c, "100 AIs  ·  A WALL  ·  DAY 365", W * 0.5, H * 0.93, 88, '#ffffff', stroke=12)
    a = cv2.resize(rgba[..., :3], (1280, 720), interpolation=cv2.INTER_AREA)
    cv2.imwrite(os.path.join(OUTDIR, "copertina_A.jpg"), cv2.cvtColor(a, cv2.COLOR_RGB2BGR), [cv2.IMWRITE_JPEG_QUALITY, 93])

    # ---------- B: the wall from above
    b = punch(wide, 1.25, 1.12, 0.02)
    rgba = np.dstack([b, np.full((H, W), 255, np.uint8)])
    surf = skia.Surface(rgba); c = surf.getCanvas()
    g = skia.GradientShader.MakeLinear([skia.Point(0, 0), skia.Point(0, H * 0.5)], [OV.col('#000000', 0.6), OV.col('#000000', 0)])
    c.drawRect(skia.Rect(0, 0, W, H * 0.5), skia.Paint(Shader=g))
    text(c, "THE WALL FALLS", W * 0.5, H * 0.2, 170, '#ffffff', stroke=16)
    text(c, "200 AIs · 1 VALLEY", W * 0.5, H * 0.36, 100, '#ffd21f', stroke=12)
    text(c, "FOREST", W * 0.2, H * 0.93, 96, '#6fe08a', stroke=12)
    text(c, "PLAIN", W * 0.8, H * 0.93, 96, '#ffd048', stroke=12)
    bb = cv2.resize(rgba[..., :3], (1280, 720), interpolation=cv2.INTER_AREA)
    cv2.imwrite(os.path.join(OUTDIR, "copertina_B.jpg"), cv2.cvtColor(bb, cv2.COLOR_RGB2BGR), [cv2.IMWRITE_JPEG_QUALITY, 93])
    print("thumbnails written")


if __name__ == "__main__":
    main()
