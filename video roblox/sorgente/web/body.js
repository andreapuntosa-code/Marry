// Big body parts for the "looks useless" series (Roblox style): a blocky hand with curling fingers, a big eye with
// eyelids, lashes, blinking and redness.
import { THREE, add, on, glowTex, rbox } from './kit.js';

const M_ = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: o.r ?? 0.6, metalness: o.m ?? 0, emissive: o.em ?? 0, emissiveIntensity: o.ei ?? 1, transparent: !!o.t, opacity: o.op ?? 1 });

// the hand: palm facing the camera (+z), fingers up. curl(u) -> [index, middle, ring, pinky, thumb] in 0..1
export function bigHand(o = {}) {
  const g = new THREE.Group(); g.position.set(...(o.pos ?? [0, 0, 0])); add(g); const skin = M_(o.skin ?? 0xf2c79a, { r: 0.55 });
  const palm = new THREE.Mesh(rbox(2.0, 2.2, 0.7, 0.12), skin); palm.castShadow = true; g.add(palm);
  const cuff = new THREE.Mesh(rbox(1.9, 1.2, 0.8, 0.1), M_(o.sleeve ?? 0x2fa84f)); cuff.position.y = -1.7; g.add(cuff);
  const fingers = [];
  const spec = [[-0.72, 1.25], [-0.24, 1.4], [0.24, 1.3], [0.72, 0.95]];   // index .. pinky (x, length)
  spec.forEach(([x, L], i) => { const base = new THREE.Group(); base.position.set(x, 1.1, 0); g.add(base); let par = base; const segs = [];
    for (let k = 0; k < 3; k++) { const s = new THREE.Group(); if (k) s.position.y = L / 3; par.add(s); const m = new THREE.Mesh(rbox(0.42, L / 3 + 0.04, 0.48, 0.25), skin); m.position.y = L / 6; m.castShadow = true; s.add(m); segs.push(s); par = s; }
    const nail = new THREE.Mesh(rbox(0.3, 0.2, 0.05, 0.4), M_(0xf8d8c8, { r: 0.3 })); nail.position.set(0, L / 6 + 0.04, -0.26); segs[2].add(nail);
    fingers.push({ base, segs }); });
  const tb = new THREE.Group(); tb.position.set(-1.0, -0.2, 0.1); tb.rotation.z = 0.7; g.add(tb); const tsegs = []; let par = tb;
  for (let k = 0; k < 2; k++) { const s = new THREE.Group(); if (k) s.position.y = 0.5; par.add(s); const m = new THREE.Mesh(rbox(0.46, 0.54, 0.5, 0.25), skin); m.position.y = 0.25; s.add(m); tsegs.push(s); par = s; }
  const stub = new THREE.Mesh(rbox(0.42, 0.16, 0.48, 0.3), skin); stub.position.set(0.72, 1.12, 0); stub.visible = false; g.add(stub);
  const H = { g, fingers, tsegs, stub, pinkyOn: true };
  H.setPinky = (on_) => { H.pinkyOn = on_; fingers[3].base.visible = on_; stub.visible = !on_; };
  on((u, d) => { const c = o.curl ? o.curl(u, d) : [0, 0, 0, 0, 0];
    fingers.forEach((f, i) => f.segs.forEach((s, k) => { s.rotation.x = -c[i] * (k === 0 ? 1.45 : 1.6); }));
    tsegs.forEach((s, k) => { s.rotation.x = -c[4] * 0.9; s.rotation.z = c[4] * (k ? 0.5 : 0.3); }); });
  return H;
}

// the eye: a white ball with iris and pupil looking at +z, two eyelids that blink, lashes along the upper lid
export function bigEye(o = {}) {
  const g = new THREE.Group(); g.position.set(...(o.pos ?? [0, 0, 0])); add(g); const R = o.R ?? 1.5;
  const c = document.createElement('canvas'); c.width = 1024; c.height = 512; const q = c.getContext('2d'); q.fillStyle = '#e8eaee'; q.fillRect(0, 0, 1024, 512);
  const veins = document.createElement('canvas'); veins.width = 1024; veins.height = 512; const v = veins.getContext('2d'); v.strokeStyle = 'rgba(200,30,40,0.9)'; v.lineWidth = 3;
  let s = 7; const r = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
  for (let i = 0; i < 60; i++) { let x = r() * 1024, y = 100 + r() * 312; v.beginPath(); v.moveTo(x, y); for (let k = 0; k < 6; k++) { x += (r() - 0.5) * 60; y += (r() - 0.5) * 40; v.lineTo(x, y); } v.stroke(); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  const ball = new THREE.Mesh(new THREE.SphereGeometry(R, 64, 48), new THREE.MeshPhysicalMaterial({ map: t, roughness: 0.1, clearcoat: 1, clearcoatRoughness: 0.05 })); g.add(ball);
  const iris = new THREE.Mesh(new THREE.CircleGeometry(R * 0.42, 48), M_(o.iris ?? 0x3a7ad0, { r: 0.4 })); iris.position.z = R * 1.002; g.add(iris);
  const ring = new THREE.Mesh(new THREE.RingGeometry(R * 0.4, R * 0.43, 48), M_(0x1a3a6a)); ring.position.z = R * 1.003; g.add(ring);
  const pupil = new THREE.Mesh(new THREE.CircleGeometry(R * 0.18, 40), M_(0x0a0a0e, { r: 0.2 })); pupil.position.z = R * 1.004; g.add(pupil);
  const glint = new THREE.Mesh(new THREE.CircleGeometry(R * 0.07, 20), new THREE.MeshBasicMaterial({ color: 0xffffff })); glint.position.set(-R * 0.15, R * 0.15, R * 1.006); g.add(glint);
  const skin = M_(o.skin ?? 0xf2c79a, { r: 0.55 });
  const lidU = new THREE.Mesh(new THREE.SphereGeometry(R * 1.06, 48, 24, 0, Math.PI * 2, 0, Math.PI / 2), skin); const lidD = lidU.clone(); g.add(lidU); g.add(lidD);
  const lashes = new THREE.Group(); lidU.add(lashes); const lm = M_(0x1a120e, { r: 0.5 });
  for (let i = 0; i < 46; i++) { const a = -1.25 + i / 45 * 2.5; const L = R * (0.34 + 0.12 * Math.cos(a * 1.3)); const curve = new THREE.QuadraticBezierCurve3(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, -L * 0.15, L * 0.6), new THREE.Vector3(0, L * 0.45, L * 0.95));
    const m = new THREE.Mesh(new THREE.TubeGeometry(curve, 8, R * 0.013, 5), lm); const h = new THREE.Group(); h.add(m); h.position.set(Math.sin(a) * R * 1.06, 0, Math.cos(a) * R * 1.06); h.rotation.y = a; lashes.add(h); }
  const E = { g, ball, lashes, lidU, lidD, R, map: t, base: c, veins };
  let lastRed = -1;
  on((u, d) => { const open = o.open ? o.open(u, d) : 1;   // 1 = open, 0 = closed
    lidU.rotation.x = -1.15 * open; lidD.rotation.x = Math.PI + 0.95 * open;
    lashes.visible = o.lashes ? o.lashes(u, d) : true;
    const red = o.red ? o.red(u, d) : 0; if (Math.abs(red - lastRed) > 0.02) { lastRed = red; const q2 = c.getContext('2d'); q2.fillStyle = '#e8eaee'; q2.fillRect(0, 0, 1024, 512); q2.fillStyle = `rgba(230,90,100,${0.55 * red})`; q2.fillRect(0, 0, 1024, 512); q2.globalAlpha = red; q2.drawImage(veins, 0, 0); q2.globalAlpha = 1; t.needsUpdate = true; }
    const sw = o.swell ? o.swell(u, d) : 0; lidU.scale.setScalar(1 + sw * 0.08); lidD.scale.setScalar(1 + sw * 0.12); });
  return E;
}
const lerp_ = (a, b, k) => a + (b - a) * k;
// particles flying at the eye: with lashes they curve around it, without they hit it and stick
export function particles(eye, o = {}) {
  const n = o.n ?? 160, pos = new Float32Array(n * 3), base = []; let s = o.seed ?? 3; const r = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
  for (let i = 0; i < n; i++) base.push([(r() - 0.5) * 6, (r() - 0.5) * 4, r(), 0.6 + r() * 0.8]);
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const p = new THREE.Points(g, new THREE.PointsMaterial({ size: o.size ?? 0.07, color: o.color ?? 0xc8a878, transparent: true, opacity: 0.95 })); p.frustumCulled = false; add(p);
  const c = eye.g.position, R = eye.R;
  on((u, d) => { const shield = o.shield ? o.shield(u, d) : 1;
    base.forEach(([x0, y0, ph, sp], i) => { const q = (ph + u * 0.35 * sp) % 1; let x = c.x - 6 + 9 * q, y = c.y + y0 * (1 - q * 0.6), z = c.z + 1.8 + x0 * 0.12;
      const dx = x - c.x, dy = y - c.y, dd = Math.sqrt(dx * dx + dy * dy);
      if (dd < R * 1.5 && shield > 0.5) { y += Math.sign(dy || 1) * (R * 1.5 - dd) * 0.9; z += (R * 1.5 - dd) * 0.6; }
      if (dd < R * 0.95 && shield <= 0.5 && q > 0.6) { x = c.x + dx * 0.9; y = c.y + dy * 0.9; z = c.z + Math.sqrt(Math.max(0, R * R - (dx * 0.9) ** 2 - (dy * 0.9) ** 2)) + 0.02; }
      pos.set([x, y, z], i * 3); }); g.attributes.position.needsUpdate = true; });
  return p;
}
