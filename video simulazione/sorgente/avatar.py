# -*- coding: utf-8 -*-
"""Channel profile picture (1024x1024 .jpg): the orange mannequin raising her hand, golden hour,
white mannequins behind her out of focus. Rendered with the film's 3D engine.
  python3 avatar.py  ->  ../immagine_profilo.jpg"""
import os, base64
import numpy as np, cv2
from playwright.sync_api import sync_playwright

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(os.path.dirname(HERE), "immagine_profilo.jpg")
CHROME = "/opt/pw-browsers/chromium-1194/chrome-linux/chrome"

JS = """async () => {
  const R = await import('./shots/registry.js');
  const S = await import('./shots/sets.js');
  const M = S.M, x = M.x, z = M.z;
  R.SHOTS.avatar = {
    hours: 17.0, cloud: 0.35, year: 0, town: false, aperture: 1.6, maxBlur: 14,
    cam: S.K([0, [x + 0.15, 1.45, z + 2.3], [x, 1.52, z], 30], [1, [x + 0.15, 1.45, z + 2.3], [x, 1.52, z], 30]),
    veg: { grassR: 10, grassAt: [x, z + 1] }, shadow: { x, z, r: 6 },
    setup(c) {
      const P = c.person('ISE', { x, z, yaw: 0.05 }); P.anim = (Q, t) => Q.pose('raiseHand', 1.2);
      [[-1.6, -2.6, 'A03'], [1.5, -3.2, 'A06'], [-0.4, -4.5, 'A12'], [2.6, -5.0, 'A08'], [-2.8, -4.2, 'A17']].forEach(([dx, dz, w], i) => {
        const Q = c.person(w, { x: x + dx, z: z + dz, yaw: S.yawTo(x + dx, z + dz, x, z) }); Q.anim = (q, t) => q.pose('idle', 1 + i);
      });
    },
  };
  loadShot('avatar', 4, {}, { hero: true }); renderShot(1.0); renderShot(1.0);
  return true;
}"""


def main():
    pw = sync_playwright().start()
    br = pw.chromium.launch(executable_path=CHROME, headless=True, args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--use-gl=angle'])
    page = br.new_page(viewport={'width': 1920, 'height': 1080})
    page.goto("http://127.0.0.1:8124/index.html?scale=1&scope=0")
    page.wait_for_function('window.ready === true || window.loadError', timeout=300000)
    page.evaluate(JS)
    cdp = page.context.new_cdp_session(page)
    r = cdp.send('Page.captureScreenshot', {'format': 'png', 'clip': {'x': 420, 'y': 0, 'width': 1080, 'height': 1080, 'scale': 1}})
    br.close(); pw.stop()
    img = cv2.imdecode(np.frombuffer(base64.b64decode(r['data']), np.uint8), cv2.IMREAD_COLOR).astype(np.float32)
    # punchy grade + soft vignette (profile pictures are shown tiny and round)
    g = img.mean(2, keepdims=True); img = g + (img - g) * 1.25
    img = 128 + (img - 128) * 1.1
    yy, xx = np.mgrid[0:1080, 0:1080]; d = np.hypot(xx - 540, yy - 520) / 540
    img *= (1 - 0.35 * np.clip(d - 0.55, 0, 1) ** 1.5)[..., None]
    out = cv2.resize(np.clip(img, 0, 255).astype(np.uint8), (1024, 1024), interpolation=cv2.INTER_AREA)
    cv2.imwrite(OUT, out, [cv2.IMWRITE_JPEG_QUALITY, 95])
    print(OUT)


if __name__ == "__main__":
    main()
