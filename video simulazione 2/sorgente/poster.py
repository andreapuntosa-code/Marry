# -*- coding: utf-8 -*-
"""Poster (1333x2000, no text): a democrat (blue) and a monarch (red) clash fists mid-air,
debris flying, light burst behind. Rendered with the film's engine.  -> ../poster_democrazia_vs_monarchia.jpg"""
import os, base64
import numpy as np, cv2
from playwright.sync_api import sync_playwright

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(os.path.dirname(HERE), "poster_democrazia_vs_monarchia.jpg")
CHROME = "/opt/pw-browsers/chromium-1194/chrome-linux/chrome"
JS = r"""async () => {
  const R = await import('./shots/registry.js');
  const S = await import('./shots/sets.js');
  const T = window.THREE;
  R.SHOTS.poster = {
    interior: true, ambient: 0.45, env: 0.6, aperture: 0.7, maxBlur: 16, grade: 'day', focus: 4.6,
    cam: S.K([0, [0.1, 1.0, 4.6], [0, 1.62, 0], 40], [1, [0.1, 1.0, 4.6], [0, 1.62, 0], 40], { abs: true }),
    shadow: { x: 0, y: 1.5, z: 0 },
    setup(c) {
      const cv = document.createElement('canvas'); cv.width = cv.height = 1024; const g = cv.getContext('2d');
      const gr = g.createRadialGradient(512, 470, 10, 512, 512, 620);
      gr.addColorStop(0, '#f2fbff'); gr.addColorStop(0.12, '#9fe3ff'); gr.addColorStop(0.45, '#2a7da8'); gr.addColorStop(1, '#0a1a2c');
      g.fillStyle = gr; g.fillRect(0, 0, 1024, 1024);
      g.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 70; i++) { const a = i / 70 * Math.PI * 2 + Math.sin(i * 7) * 0.03, w = 0.008 + 0.02 * ((i * 37) % 7) / 7;
        g.beginPath(); g.moveTo(512, 470); g.lineTo(512 + Math.cos(a - w) * 900, 470 + Math.sin(a - w) * 900); g.lineTo(512 + Math.cos(a + w) * 900, 470 + Math.sin(a + w) * 900); g.closePath();
        g.fillStyle = `rgba(160,225,255,${0.04 + 0.06 * ((i * 13) % 5) / 5})`; g.fill(); }
      const tex = new T.CanvasTexture(cv); tex.colorSpace = T.SRGBColorSpace;
      const wall = new T.Mesh(new T.PlaneGeometry(26, 26), new T.MeshBasicMaterial({ map: tex, toneMapped: false }));
      wall.position.set(0, 3.0, -9); c.add(wall); c.own(wall.geometry);
      const key = new T.DirectionalLight(0xfff4e6, 3.4); key.position.set(0.5, 4, 5); key.castShadow = true; c.add(key);
      const back = new T.PointLight(0xa8e6ff, 40, 20, 1.5); back.position.set(0, 1.9, -2.5); c.add(back);
      const rimL = new T.DirectionalLight(0x6fb8ff, 2.2); rimL.position.set(-5, 2, -3); c.add(rimL);
      const rimR = new T.DirectionalLight(0xff8a6f, 2.2); rimR.position.set(5, 2, -3); c.add(rimR);
      // debris
      const rm = new T.MeshStandardMaterial({ color: 0x5b6f82, roughness: 0.85, flatShading: true }); c.own(rm);
      const rm2 = new T.MeshStandardMaterial({ color: 0xa8573f, roughness: 0.85, flatShading: true }); c.own(rm2);
      let s = 7; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
      for (let i = 0; i < 60; i++) { const geo = new T.IcosahedronGeometry(0.04 + 0.22 * rnd() ** 2, 0); c.own(geo);
        const m = new T.Mesh(geo, i % 4 ? rm : rm2); const a = rnd() * 6.28, d = 0.5 + rnd() * 3.5;
        m.position.set(Math.cos(a) * d * 1.3, 1.6 - 1.5 * rnd() + (rnd() - 0.5) * 2.2, -3 + rnd() * 5.2); m.rotation.set(rnd() * 6, rnd() * 6, rnd() * 6); m.scale.set(1, 0.7 + rnd() * 0.6, 1); m.castShadow = true; if (Math.abs(m.position.x) < 1.5 && m.position.y > 0.6 && m.position.z > -1.6) continue; c.add(m); }
      const punch = (P, side) => {
        P.pose('run', 0.35, { phase: side > 0 ? 0 : 3.1 });
        P.root.rotation.x = 0; P.spine.rotation.x = 0.15;
        P.R.sh.rotation.set(-1.62, 0, 0.0); P.R.el.rotation.x = -0.05; P.R.hd.rotation.x = 0;
        P.L.sh.rotation.set(0.5, 0, -0.5); P.L.el.rotation.x = -1.4;
        P.L.hip.rotation.x = 0.55; P.R.hip.rotation.x = 0.2; P.L.kn.rotation.x = 1.0; P.R.kn.rotation.x = 0.6;
        P.head.rotation.set(-0.12, side * 0.1, 0);
      };
      const D = c.personAt('ORUN', -0.55, 0.7, 0.05, { yaw: Math.PI / 2 - 0.25, acc: [{ type: 'sash', color: 0x2a5bd7 }, { type: 'cape', color: 0x1f4fd0 }], scale: 1.05 });
      D.anim = (Q) => { punch(Q, 1); Q.root.rotation.z = -0.22; };
      const K = c.personAt('KASSA11', 0.55, 0.6, 0.05, { yaw: -Math.PI / 2 + 0.25, acc: ['crown', { type: 'cape', color: 0x8a0f22 }], scale: 1.05 });
      K.anim = (Q) => { punch(Q, -1); Q.root.rotation.z = 0.22; };
      K.head.children.forEach((o) => { if (Math.abs(o.position.y - 0.33) < 1e-3) o.visible = false; });
      { const hm = K.headMesh; hm.geometry.computeBoundingSphere(); const bs = hm.geometry.boundingSphere;
        const rh = bs.radius * hm.scale.y, cy = hm.position.y + bs.center.y * hm.scale.y;
        const gm = new T.MeshStandardMaterial({ color: 0xf2b632, metalness: 0.9, roughness: 0.25, side: T.DoubleSide, emissive: 0x3a2400 }); c.own(gm);
        const cr = new T.Group(); cr.position.set(0, cy + rh * 0.98, 0); cr.scale.setScalar(1.35); cr.rotation.x = -0.1; K.head.add(cr);
        const band = new T.Mesh(new T.CylinderGeometry(rh * 0.74, rh * 0.7, rh * 0.32, 32, 1, true), gm); cr.add(band); c.own(band.geometry);
        for (let i = 0; i < 7; i++) { const a = i / 7 * 6.283; const sp = new T.Mesh(new T.ConeGeometry(rh * 0.13, rh * 0.42, 4), gm); c.own(sp.geometry);
          sp.position.set(Math.cos(a) * rh * 0.72, rh * 0.36, Math.sin(a) * rh * 0.72); cr.add(sp);
          const gem = new T.Mesh(new T.SphereGeometry(rh * 0.06, 8, 8), new T.MeshStandardMaterial({ color: i % 2 ? 0x1d4fd8 : 0xd81d3a, roughness: 0.2 })); c.own(gem.geometry);
          gem.position.set(Math.cos(a) * rh * 0.75, 0, Math.sin(a) * rh * 0.75); cr.add(gem); } }
    },
  };
  loadShot('poster', 4, {}, { hero: true }); renderShot(1.0); renderShot(1.0);
  return true;
}"""


def main():
    pw = sync_playwright().start()
    br = pw.chromium.launch(executable_path=CHROME, headless=True, args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--use-gl=angle'])
    page = br.new_page(viewport={'width': 1920, 'height': 1080})
    page.goto("http://127.0.0.1:8124/index.html?scale=2&scope=0")
    page.wait_for_function('window.ready === true || window.loadError', timeout=300000)
    page.evaluate(JS)
    cdp = page.context.new_cdp_session(page)
    r = cdp.send('Page.captureScreenshot', {'format': 'png', 'clip': {'x': 600, 'y': 0, 'width': 720, 'height': 1080, 'scale': 2}})
    br.close(); pw.stop()
    img = cv2.imdecode(np.frombuffer(base64.b64decode(r['data']), np.uint8), cv2.IMREAD_COLOR).astype(np.float32)
    g = img.mean(2, keepdims=True); img = g + (img - g) * 1.2; img = 128 + (img - 128) * 1.12
    h, w = img.shape[:2]; yy, xx = np.mgrid[0:h, 0:w]; d = np.hypot((xx - w / 2) / w, (yy - h * 0.42) / h) * 2
    img *= (1 - 0.45 * np.clip(d - 0.5, 0, 1) ** 1.4)[..., None]
    cv2.imwrite(OUT, cv2.resize(np.clip(img, 0, 255).astype(np.uint8), (1333, 2000), interpolation=cv2.INTER_AREA), [cv2.IMWRITE_JPEG_QUALITY, 94])
    print(OUT)


if __name__ == "__main__":
    main()
