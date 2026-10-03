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
    pw = sync_playwright().start()
    br = pw.chromium.launch(executable_path=CHROME, headless=True, args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--use-gl=angle'])
    page = br.new_page(viewport={'width': W, 'height': H})
    page.goto("http://127.0.0.1:8124/index.html?scale=1&scope=0")
    page.wait_for_function('window.ready === true || window.loadError', timeout=300000)
    cdp = page.context.new_cdp_session(page)
    king = grab(page, cdp, 'thumbA_king')
    vote = grab(page, cdp, 'thumbA_vote')
    hand = grab(page, cdp, 'thumbB')
    br.close(); pw.stop()
    for n, im in [('king', king), ('vote', vote), ('hand', hand)]:
        cv2.imwrite(os.path.join(HERE, '..', f'.thumb_{n}.png'), cv2.cvtColor(im, cv2.COLOR_RGB2BGR))

    # ---------- A: split screen
    k = punch(king, 1.3, 1.15, 0.04)
    v = punch(vote, 1.3, 1.15, -0.03)
    # tint: red king, blue crowd
    k = np.clip(k.astype(np.float32) * np.array([1.12, 0.9, 0.88]), 0, 255).astype(np.uint8)
    v = np.clip(v.astype(np.float32) * np.array([0.85, 0.95, 1.15]), 0, 255).astype(np.uint8)
    # the king's picture shifted so he sits in the right half; the vote picture in the left half
    out = np.zeros((H, W, 3), np.uint8)
    yy, xx = np.mgrid[0:H, 0:W]
    split = (xx - W * 0.5) + (yy - H * 0.5) * 0.22 > 0
    k_sh = np.roll(k, int(W * 0.18), axis=1); v_sh = np.roll(v, -int(W * 0.22), axis=1)
    out[split] = k_sh[split]; out[~split] = v_sh[~split]
    rgba = np.dstack([out, np.full((H, W), 255, np.uint8)])
    surf = skia.Surface(rgba); c = surf.getCanvas()
    # divider
    p = skia.Path(); p.moveTo(W * 0.5 + H * 0.5 * 0.22, 0); p.lineTo(W * 0.5 - H * 0.5 * 0.22, H)
    c.drawPath(p, skia.Paint(AntiAlias=True, Color=skia.ColorWHITE, Style=skia.Paint.kStroke_Style, StrokeWidth=14))
    text(c, "DEMOCRACY", W * 0.26, H * 0.2, 150, '#5ea4ff', stroke=16)
    text(c, "MONARCHY", W * 0.75, H * 0.2, 150, '#ff4d5e', stroke=16)
    c.drawCircle(W * 0.5, H * 0.53, 120, OV.P('#ffd21f'))
    c.drawCircle(W * 0.5, H * 0.53, 120, skia.Paint(AntiAlias=True, Color=skia.ColorBLACK, Style=skia.Paint.kStroke_Style, StrokeWidth=10))
    text(c, "?", W * 0.5, H * 0.53 + 78, 230, '#101010', stroke=0, shadow=False)
    text(c, "20 AIs · 2,000 YEARS", W * 0.5, H * 0.93, 92, '#ffffff', stroke=12)
    a = cv2.resize(rgba[..., :3], (1280, 720), interpolation=cv2.INTER_AREA)
    cv2.imwrite(os.path.join(OUTDIR, "copertina_A.jpg"), cv2.cvtColor(a, cv2.COLOR_RGB2BGR), [cv2.IMWRITE_JPEG_QUALITY, 93])

    # ---------- B: the raised hand
    b = punch(hand, 1.25, 1.12, 0.03)
    rgba = np.dstack([b, np.full((H, W), 255, np.uint8)])
    surf = skia.Surface(rgba); c = surf.getCanvas()
    g = skia.GradientShader.MakeLinear([skia.Point(0, 0), skia.Point(0, H * 0.45)], [OV.col('#000000', 0.55), OV.col('#000000', 0)])
    c.drawRect(skia.Rect(0, 0, W, H * 0.45), skia.Paint(Shader=g))
    text(c, "20 AIs", W * 0.05, H * 0.2, 190, '#ffffff', align='left', stroke=16)
    text(c, "0 RULES", W * 0.05, H * 0.38, 190, '#ffd21f', align='left', stroke=16)
    # year badge, top-right (like the video)
    c.drawRoundRect(skia.Rect(W - 330, 50, W - 60, 230), 26, 26, OV.P('#0b0f16', 0.7))
    text(c, "YEAR", W - 195, 112, 46, '#cfd8e6', key='ui_b', stroke=0, shadow=False)
    text(c, "0", W - 195, 208, 110, '#ffffff', key='ui_b', stroke=0, shadow=False)
    # red arrow towards the raised hand
    ar = skia.Path(); ar.moveTo(W * 0.69, H * 0.62); ar.lineTo(W * 0.6, H * 0.47)
    c.drawPath(ar, skia.Paint(AntiAlias=True, Color=skia.Color(255, 40, 40), Style=skia.Paint.kStroke_Style, StrokeWidth=26, StrokeCap=skia.Paint.kRound_Cap))
    hd = skia.Path(); hd.moveTo(W * 0.585, H * 0.44); hd.lineTo(W * 0.635, H * 0.475); hd.lineTo(W * 0.598, H * 0.51); hd.close()
    c.drawPath(hd, skia.Paint(AntiAlias=True, Color=skia.Color(255, 40, 40)))
    bb = cv2.resize(rgba[..., :3], (1280, 720), interpolation=cv2.INTER_AREA)
    cv2.imwrite(os.path.join(OUTDIR, "copertina_B.jpg"), cv2.cvtColor(bb, cv2.COLOR_RGB2BGR), [cv2.IMWRITE_JPEG_QUALITY, 93])
    print("thumbnails written")


if __name__ == "__main__":
    main()
