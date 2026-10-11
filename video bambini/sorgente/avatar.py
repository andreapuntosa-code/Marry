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
  const T = window.THREE;
  R.SHOTS.avatar = {
    interior: true, ambient: 0.55, env: 0.5, aperture: 0.9, maxBlur: 10, grade: 'day',
    cam: S.K([0, [0, 1.35, 2.9], [0, 1.3, 0], 30], [1, [0, 1.35, 2.9], [0, 1.3, 0], 30], { abs: true }),
    shadow: { x: 0, y: 0, z: 0 },
    setup(c) {
      // studio cyclorama: warm gradient wall + floor
      const cv = document.createElement('canvas'); cv.width = 4; cv.height = 256; const g = cv.getContext('2d');
      const gr = g.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, '#1d2b64'); gr.addColorStop(0.55, '#3b5bdb'); gr.addColorStop(1, '#7aa2ff');
      g.fillStyle = gr; g.fillRect(0, 0, 4, 256); const tex = new T.CanvasTexture(cv); tex.colorSpace = T.SRGBColorSpace;
      const wall = new T.Mesh(new T.PlaneGeometry(40, 20), new T.MeshBasicMaterial({ map: tex, toneMapped: false }));
      wall.position.set(0, 6, -6); c.add(wall); c.own(wall.geometry);
      const floor = new T.Mesh(new T.PlaneGeometry(40, 20).rotateX(-Math.PI / 2), new T.MeshStandardMaterial({ color: 0x6f8fe8, roughness: 0.9 }));
      floor.receiveShadow = true; c.add(floor); c.own(floor.geometry);
      const key = new T.DirectionalLight(0xfff1dc, 3.2); key.position.set(3, 6, 5); key.castShadow = true; key.shadow.mapSize.set(2048, 2048);
      Object.assign(key.shadow.camera, { left: -4, right: 4, top: 4, bottom: -4 }); c.add(key);
      const rim = new T.DirectionalLight(0xbcd0ff, 2.0); rim.position.set(-4, 3, -4); c.add(rim);
      const P = c.personAt('ISE', 0, 0, 0, { yaw: 0.15 }); P.anim = (Q) => Q.pose('raiseHand', 1.2);
      [[-0.95, -1.4, 'A03', 0.4], [0.95, -1.4, 'A06', -0.4], [-1.9, -1.9, 'A12', 0.6], [1.9, -1.9, 'A08', -0.6]].forEach(([x, z, w, yaw], i) => {
        const Q = c.personAt(w, x, 0, z, { yaw }); Q.anim = (q) => q.pose('idle', 1 + i);
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
    img *= (1 - 0.25 * np.clip(d - 0.55, 0, 1) ** 1.5)[..., None]
    out = cv2.resize(np.clip(img, 0, 255).astype(np.uint8), (1024, 1024), interpolation=cv2.INTER_AREA)
    cv2.imwrite(OUT, out, [cv2.IMWRITE_JPEG_QUALITY, 95])
    print(OUT)


if __name__ == "__main__":
    main()
