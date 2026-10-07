# -*- coding: utf-8 -*-
"""Single-frame grabber for covers and the Short: renders any shot at any canvas size/scale (hero quality),
applies the film grade at the frame's own size.

    g = Grabber(w=1920, h=1080, scale=2.0)      # 3840x2160 master
    img = g.shot('th_a', t=2.0)                  # RGB uint8
"""
import os, sys, json, base64
import numpy as np
import cv2

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import render as R

CHROME = R.CHROME
URL = R.URL


class Grabber:
    def __init__(self, w=1920, h=1080, scale=2.0, scope=False):
        from playwright.sync_api import sync_playwright
        self.w, self.h, self.scale = w, h, scale
        self.pw = sync_playwright().start()
        self.browser = self.pw.chromium.launch(executable_path=CHROME, headless=True,
            args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--use-gl=angle', '--disable-gpu-vsync'])
        vw, vh = int(round(w * scale)), int(round(h * scale))
        self.page = self.browser.new_page(viewport={'width': vw, 'height': vh})
        self.errors = []
        self.page.on('pageerror', lambda e: self.errors.append(str(e)))
        self.page.goto(f"{URL}?scale={scale}&scope={1 if scope else 0}&w={w}&h={h}")
        self.page.wait_for_function('window.ready === true || window.loadError', timeout=600000)
        err = self.page.evaluate('window.loadError || null')
        if err:
            raise RuntimeError(err)
        self.cdp = self.page.context.new_cdp_session(self.page)
        self.size = (vw, vh)

    def raw(self, sid, t=1.0, dur=4.0, hero=True):
        r = self.page.evaluate(f"loadShot({json.dumps(sid)}, {dur:.4f}, {{}}, {{hero: {'true' if hero else 'false'}, scale: {self.scale}}})")
        cw, ch = r["size"]
        self.page.evaluate(f"renderShot({t:.4f})")
        self.page.evaluate(f"renderShot({t:.4f})")
        s = self.cdp.send('Page.captureScreenshot', {'format': 'png', 'clip': {'x': 0, 'y': 0, 'width': cw, 'height': ch, 'scale': 1}})
        img = cv2.imdecode(np.frombuffer(base64.b64decode(s['data']), np.uint8), cv2.IMREAD_COLOR)
        if self.errors:
            print("PAGE ERRORS:", self.errors[-2:]); self.errors.clear()
        return cv2.cvtColor(img, cv2.COLOR_BGR2RGB)

    def shot(self, sid, t=1.0, dur=4.0, grade='golden', hero=True, **kw):
        return grade_img(self.raw(sid, t, dur, hero), grade, hero, **kw)

    def close(self):
        try:
            self.browser.close(); self.pw.stop()
        except Exception:
            pass


def bloom(f, grade, hero):
    th, k = R.BLOOM.get(grade, R.BLOOM["day"])
    if hero:
        k *= 1.5
    h, w = f.shape[:2]
    sw, sh = max(8, w // 4), max(8, h // 4)
    small = cv2.resize(f, (sw, sh), interpolation=cv2.INTER_AREA)
    hi = np.maximum(small - th, 0) * (255.0 / (255.0 - th))
    s = w / 1920.0
    b = cv2.GaussianBlur(hi, (0, 0), 3.0 * s) * 0.5 + cv2.GaussianBlur(hi, (0, 0), 10.0 * s) * 0.5
    out = b * k
    if hero and grade in ("night", "room", "golden"):
        hot = np.maximum(small - 228, 0) * (255.0 / 27.0)
        streak = cv2.GaussianBlur(hot, (0, 0), sigmaX=46 * s, sigmaY=0.8 * s)
        out += streak * np.array([0.55, 0.75, 1.0], np.float32) * 0.5
    return f + cv2.resize(out, (w, h), interpolation=cv2.INTER_LINEAR)


def grade_img(img, grade='golden', hero=True, vig=0.30, sat_boost=1.0, grain=1.2):
    f = img.astype(np.float32)
    h, w = f.shape[:2]
    f = bloom(f, grade, hero)
    lut, sat = R.GRADES.get(grade, R.GRADES["day"])
    sat *= sat_boost * (1.04 if hero else 1.0)
    g = cv2.transform(f, R.LUMA)[..., None]
    f = g + (f - g) * sat
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    r2 = np.clip(((xx - w / 2) / (w / 2)) ** 2 * 0.75 + ((yy - h / 2) / (h / 2)) ** 2 * 0.55, 0, 1.5)
    f *= (1.0 - vig * r2 ** 1.25)[..., None]
    rng = np.random.default_rng(11)
    f += cv2.resize((rng.standard_normal((h // 2, w // 2)) * grain).astype(np.float32), (w, h))[..., None]
    out = np.clip(f, 0, 255).astype(np.uint8)
    return cv2.LUT(out, lut)
