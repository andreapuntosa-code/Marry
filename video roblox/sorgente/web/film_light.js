// "What if light was 2x slower?" -- Roblox-style What-if, escalating to a blackout. Shots for script_light.py
import { THREE, shot, person, street, ground, house, tree, room, label, glowTex, stars, add, on, shadowAt, camLerp, sm, lerp, getScene } from './kit.js';

const ME = { skin: 0xf2c79a, shirt: 0x2fa84f, pants: 0x2f4a8a, hair: { style: 'bowl', color: 0x6b3a1e }, logo: 0xffd23a };
const P_ = [
  { skin: 0xf2c79a, shirt: 0xf28c28, pants: 0x2f4a8a, hair: { style: 'spiky', color: 0x2a1a10 }, acc: ['headband'] },
  { skin: 0x8a5a3a, shirt: 0x3fa7d6, pants: 0xc9b38a, hair: { style: 'short', color: 0x1a1210 } },
  { skin: 0xffd9b3, shirt: 0xb04ac9, pants: 0x4a4a55, hair: { style: 'bun', color: 0x8a3a1a } },
  { skin: 0xc68a5a, shirt: 0xd23a3a, pants: 0x2a2a35, hair: { style: 'long', color: 0x2a1a10 } },
  { skin: 0xf6d2b0, shirt: 0x7fc8f0, pants: 0x3b5ba8, hair: { style: 'long', color: 0xc8904a } },
];
const DOC = { skin: 0xf2c79a, shirt: 0x8fb0d8, pants: 0x3a3a45, hair: { style: 'white', color: 0xe8e8e8 }, acc: ['coat', 'glasses'] };
const P = (a, b, fov = 50) => ({ pos: a, tgt: b, fov });
const dolly = (a, b) => (u, d) => camLerp(a, b, u / d);
const CU = (x, z, o = {}) => { const d = o.d ?? 3.2, sx = o.side ?? 0.25, hy = o.hy ?? 1.94; return dolly(P([x + sx, hy - 0.09, z + d], [x, hy - 0.49, z], o.fov ?? 50), P([x + sx * 0.5, hy - 0.09, z + d - (o.push ?? 0.5)], [x, hy - 0.49, z], o.fov ?? 50)); };
const M_ = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: o.r ?? 0.55, metalness: o.m ?? 0, emissive: o.em ?? 0, emissiveIntensity: o.ei ?? 1 });
const box = (w, h, d, c, x, y, z, o) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), M_(c, o)); m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; add(m); return m; };
function swap(a, b, t0, x, y, z, o) { const A = label(a, x, y, z, o), B = label(b, x, y, z + 0.01, o); B.visible = false; on((u) => { B.visible = u >= t0; A.visible = !B.visible; }); return [A, B]; }
const rnd = (seed) => { let s = seed; return () => ((s = (s * 9301 + 49297) % 233280) / 233280); };

// ------------------------------------------------------------------ effects and props
// a burst of sparks + a flash at (x, y, z) at time t0
function burst(x, y, z, t0, o = {}) {
  const r = rnd(o.seed ?? 5), n = o.n ?? 26, parts = [];
  const fl = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex(), color: o.color ?? 0xffd070, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false })); fl.position.set(x, y, z); add(fl);
  const L = new THREE.PointLight(o.color ?? 0xffc060, 0, 18, 1.5); L.position.set(x, y, z); add(L);
  for (let i = 0; i < n; i++) { const m = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 0.06), new THREE.MeshBasicMaterial({ color: i % 3 ? 0xffe08a : 0xffffff })); m.visible = false; add(m); parts.push([m, (r() - 0.5) * 6, 2 + r() * 5, (r() - 0.5) * 6]); }
  on((u) => { const q = u - t0; const on_ = q >= 0 && q < 1.4; fl.material.opacity = on_ ? Math.max(0, 1 - q / 0.6) : 0; fl.scale.setScalar((o.size ?? 5) * (0.6 + q)); L.intensity = on_ ? 60 * Math.max(0, 1 - q / 0.5) : 0;
    parts.forEach(([m, vx, vy, vz]) => { m.visible = on_; if (on_) m.position.set(x + vx * q, y + vy * q - 4.9 * q * q, z + vz * q); }); });
}
function smoke(x, y, z, t0) {
  const r = rnd(9);
  for (let i = 0; i < 10; i++) { const m = new THREE.Mesh(new THREE.SphereGeometry(0.4, 10, 8), new THREE.MeshStandardMaterial({ color: 0x3a3a40, transparent: true, opacity: 0 })); add(m); const dx = (r() - 0.5) * 0.8, ph = r();
    on((u) => { const q = u - t0 - ph * 0.6; m.material.opacity = q > 0 ? Math.max(0, 0.7 - q * 0.25) : 0; m.position.set(x + dx + q * 0.2, y + q * 1.2, z); m.scale.setScalar(0.6 + q * 0.8); }); }
}
function car(x, z, yaw, color) {
  const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = yaw; add(g);
  const b = (w, h, d, c, px, py, pz) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), M_(c)); m.position.set(px, py, pz); m.castShadow = true; g.add(m); return m; };
  b(1.8, 0.7, 3.6, color, 0, 0.75, 0); b(1.6, 0.6, 1.9, color, 0, 1.4, -0.2); b(1.5, 0.45, 0.06, 0x9fd3ff, 0, 1.4, 0.76); b(1.5, 0.45, 0.06, 0x9fd3ff, 0, 1.4, -1.16);
  for (const [wx, wz] of [[-0.9, 1.1], [0.9, 1.1], [-0.9, -1.1], [0.9, -1.1]]) { const w = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 0.3, 16), M_(0x18181c)); w.rotation.z = Math.PI / 2; w.position.set(wx, 0.38, wz); g.add(w); }
  for (const s of [-0.6, 0.6]) b(0.3, 0.2, 0.05, 0xfff2b0, s, 0.85, 1.81);
  return g;
}
function poles(n = 6, z = -4.6, o = {}) {
  const tops = [];
  for (let i = 0; i < n; i++) { const x = -15 + i * 6; box(0.25, 6, 0.25, 0x6b4a2a, x, 3, z); box(2.2, 0.15, 0.15, 0x6b4a2a, x, 5.7, z); box(0.5, 0.7, 0.5, 0x7a7f88, x + 0.5, 5.0, z, { m: 0.4 }); tops.push([x, z]); }
  for (const dx of [-0.9, 0, 0.9]) { const w = new THREE.Mesh(new THREE.BoxGeometry(6 * (n - 1), 0.03, 0.03), M_(0x111111)); w.position.set(-15 + 3 * (n - 1), 5.8, z + dx * 0.02); add(w); }
  return tops;
}
// switch off every lit window, from left to right, between t0 and t1
function blackout(t0, t1) {
  const mats = []; getScene().traverse(n => { if (n.isMesh && n.material && n.material.emissiveIntensity > 1.0 && n.material.emissive && n.material.emissive.getHex() === 0xffd27a) mats.push([n.material, n]); });
  const xs = mats.map(([, n]) => { const v = new THREE.Vector3(); n.getWorldPosition(v); return v.x; }); const lo = Math.min(...xs), hi = Math.max(...xs);
  on((u) => mats.forEach(([m], i) => { const k = (xs[i] - lo) / Math.max(1, hi - lo); m.emissiveIntensity = u > lerp(t0, t1, k) ? 0 : 1.4; }));
}

// ------------------------------------------------------------------ shots
// C01: the billboard: c = 300,000 -> 150,000 km/s
shot('C01', { build() {
  street(); box(0.3, 5.6, 0.3, 0x5a5a62, -2.3, 2.8, -7.8); box(0.3, 5.6, 0.3, 0x5a5a62, 2.3, 2.8, -7.8);
  box(5.4, 2.6, 0.25, 0xffffff, 0, 5.3, -7.8); box(5.6, 2.8, 0.2, 0x23356b, 0, 5.3, -7.95);
  swap('LIGHT SPEED\n300,000 km/s', 'LIGHT SPEED\n150,000 km/s', 1.0, 0, 5.3, -7.66, { w: 5.2, size: 60, color: '#1d1d2a' });
  [[P_[0], -2.4, -5.2, 0.3], [P_[3], 2.4, -5.4, -0.3], [ME, 0, -5.0, 0]].forEach(([d, x, z, yw]) => { const A = person(d, x, z, yw, 'idle'); A.pitch = -0.25; });
  shadowAt(0, -6, 10);
}, cam: dolly(P([0.2, 2.2, 3.6], [0, 3.3, -7.8], 58), P([0.1, 2.1, 2.2], [0, 3.4, -7.8], 58)) });
// C02: at first you wouldn't notice
shot('C02', { build() { street(); const A = person(ME, 0, -6.3, 0, 'idle'); on((u) => { A.pose = u > 0.8 ? 'shrug' : 'idle'; }); shadowAt(0, -6, 8); }, cam: CU(0, -6.3) });
// C03: sunlight 16 minutes old (a big sun behind, a sign 8 -> 16 MIN)
shot('C03', { scene: { sky: ['#ffb070', '#ffe2b0'] }, build() {
  ground({ road: false }); tree(-5, -10, 1.1, 2); tree(6, -12, 1.0, 4);
  const sun = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex(), color: 0xffe9a0, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false })); sun.position.set(-1.5, 12, -60); sun.scale.setScalar(26); add(sun);
  const core = new THREE.Mesh(new THREE.SphereGeometry(3.2, 32, 20), new THREE.MeshBasicMaterial({ color: 0xfff6d0, fog: false })); core.position.copy(sun.position); add(core);
  box(0.2, 2.4, 0.2, 0x6b4a2a, 0.45, 1.2, -6.0); box(1.8, 1.1, 0.12, 0xffffff, 0.45, 2.6, -6.0);
  swap('SUNLIGHT AGE\n8 MIN', 'SUNLIGHT AGE\n16 MIN', 1.6, 0.45, 2.6, -5.93, { w: 1.75, size: 58, color: '#d23a3a' });
  const A = person(ME, -0.75, -6.3, 0.15, 'idle'); A.pitch = -0.3; shadowAt(0, -6, 8);
}, cam: dolly(P([0.0, 1.8, -1.4], [-0.15, 2.2, -8], 58), P([0.0, 1.75, -2.0], [-0.15, 2.4, -8], 58)) });
// C04: GPS breaks: phones say ???, cars drive the wrong way into each other
shot('C04', { build() {
  street();
  const c1 = car(-10, -1.8, Math.PI / 2, 0xd23a3a), c2 = car(10, 1.8, -Math.PI / 2, 0x2f6fd6), c3 = car(-3, -1.8, Math.PI / 2, 0xf5c84a);
  on((u) => { c1.position.x = -10 + u * 3.2; c1.rotation.y = Math.PI / 2 + Math.sin(u * 2) * 0.4; c2.position.x = 10 - u * 3.0; c2.position.z = 1.8 - sm(1.5, 3.2, u) * 3.4; c2.rotation.y = -Math.PI / 2 - sm(1.5, 3.2, u) * 0.5; c3.position.x = -3 + u * 1.5; c3.rotation.y = Math.PI / 2 + u * 0.8; });
  const A = person(P_[1], 2.2, -5.6, 1.9, 'present'); A.setFace('confused');
  const ph = box(0.5, 0.9, 0.06, 0x18181c, 2.75, 1.6, -5.5); ph.rotation.y = 2.57; label('YOU ARE\nHERE: ???', 2.75 + 0.05 * 0.54, 1.61, -5.5 - 0.05 * 0.84, { w: 0.48, size: 64, color: '#ff4d4d', yaw: 2.57 });
  shadowAt(0, -2, 14);
}, cam: dolly(P([4.6, 2.0, -7.9], [0, 1.3, -2.4], 58), P([4.2, 1.95, -7.6], [0, 1.3, -2.4], 58)) });
// C04b: planes circle blind, ships lose their way
shot('C04b', { scene: { sky: ['#5a7a9a', '#c8d6e0'], fog0: 80, fog1: 400 }, build() {
  const sea = new THREE.Mesh(new THREE.PlaneGeometry(800, 800), M_(0x2a6ab0, { r: 0.25, m: 0.1 })); sea.rotation.x = -Math.PI / 2; add(sea);
  const ship = new THREE.Group(); add(ship); const hull = new THREE.Mesh(new THREE.BoxGeometry(3, 1.4, 12), M_(0x2a2a30)); hull.position.y = 0.5; ship.add(hull);
  const cab = new THREE.Mesh(new THREE.BoxGeometry(2.4, 2.2, 2.6), M_(0xffffff)); cab.position.set(0, 2.2, -3.6); ship.add(cab);
  for (let i = 0; i < 6; i++) { const ct = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1, 1.4), M_([0xd23a3a, 0x2f6fd6, 0xf5c84a, 0x3aa655][i % 4])); ct.position.set(0, 1.7, -0.8 + i * 1.6); ship.add(ct); }
  ship.position.set(0, 0, -16);
  const pl = new THREE.Group(); add(pl); const pb = (w, h, d, c, x, y, z) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), M_(c)); m.position.set(x, y, z); pl.add(m); };
  pb(7, 1.1, 1.1, 0xffffff, 0, 0, 0); pb(1.6, 0.15, 9, 0xe8e8ee, 0, -0.2, 0); pb(1.0, 1.6, 0.15, 0xd23a3a, -3.2, 0.9, 0);
  on((u) => { ship.rotation.y = u * 0.5; pl.position.set(Math.cos(u * 0.9) * 12, 14, -36 + Math.sin(u * 0.9) * 12); pl.rotation.y = -u * 0.9; pl.rotation.x = 0.25; });
}, cam: dolly(P([7, 5, 6], [0, 4, -22], 58), P([5.5, 4.6, 4], [0, 5, -22], 58)) });
// C05: tied to electricity and magnetism (power lines humming with sparks)
shot('C05', { build() {
  street(); const tops = poles(6, -4.6);
  const A = person(P_[0], 0.6, -6.3, 0.1, 'idle'); A.pitch = -0.45;
  tops.slice(1, 5).forEach(([x, z], i) => burst(x + 0.5, 5.0, z, 1.2 + i * 0.5, { n: 10, size: 2.5, seed: i + 3 }));
  shadowAt(0, -5, 12);
}, cam: dolly(P([0.6, 1.6, 1.8], [0, 4.2, -5], 58), P([0.4, 1.6, 1.0], [0, 4.4, -5], 58)) });
// C06: every magnet four times stronger (a giant magnet pulls cans, a car, everything metal)
shot('C06', { build() {
  street({ fence: false }); const mg = new THREE.Group(); mg.position.set(-1.2, 1.9, -7.4); mg.scale.setScalar(1.35); add(mg);
  const red = M_(0xe8202a, { em: 0x400000 }), grey = M_(0xe8ecf2, { m: 0.3 });
  const l = new THREE.Mesh(new THREE.BoxGeometry(0.7, 2.2, 0.7), red); l.position.x = -0.8; mg.add(l); const r = new THREE.Mesh(new THREE.BoxGeometry(0.7, 2.2, 0.7), red); r.position.x = 0.8; mg.add(r);
  const b = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.7, 0.7), red); b.position.y = 1.4; mg.add(b);
  for (const s of [-0.8, 0.8]) { const t = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.5, 0.72), grey); t.position.set(s, -1.25, 0); mg.add(t); }
  const r_ = rnd(4); const items = [];
  for (let i = 0; i < 14; i++) { const m = box(0.25 + r_() * 0.3, 0.25 + r_() * 0.3, 0.25 + r_() * 0.3, [0x9aa0aa, 0xc8ccd2, 0x6a6f78][i % 3], 0, 0, 0, { m: 0.7 }); items.push([m, (r_() - 0.5) * 9, 0.2 + r_() * 1.5, -2 - r_() * 5, r_()]); }
  const c = car(-5, -3.5, Math.PI / 2, 0x2f6fd6);
  on((u) => { const k = sm(1.6, 3.2, u); items.forEach(([m, x0, y0, z0, ph]) => { const q = sm(1.5 + ph * 0.6, 2.6 + ph * 0.6, u); m.position.set(lerp(x0, -1.2 + (ph - 0.5) * 1.8, q), lerp(y0, 0.2 + ph * 0.6, q), lerp(z0, -6.8, q)); m.rotation.set(u * 3 * q, u * 2 * q, 0); }); c.position.x = -5 + 3.8 * k * k; c.position.z = -3.5 - 2.6 * k * k; });
  const A = person(ME, 2.2, -5.0, -0.6, 'idle'); on((u) => { A.pose = u > 2.0 ? 'shock' : 'idle'; A.setFace(u > 2.0 ? 'shock' : 'smile'); });
  shadowAt(0, -6, 10);
}, cam: dolly(P([0.2, 2.6, 2.2], [-0.6, 1.6, -6.5], 58), P([0.1, 2.5, 1.2], [-0.6, 1.6, -6.5], 58)) });
// C06b: kitchen magnets rip the pots off the stove
shot('C06b', { scene: { interior: true }, build() {
  room({ wall: 0xf6e7b8, floor: '#c9a57a', w: 9, d: 8, h: 5, lamp: 30 });
  const fridge = box(1.6, 3.6, 1.2, 0xe6e8ec, 2.2, 1.8, -3.3); box(2.4, 1.6, 1.2, 0xf4f4f6, -1.4, 0.8, -3.3); box(2.4, 0.1, 1.2, 0x18181c, -1.4, 1.65, -3.3);
  for (const [mx, my, c] of [[1.8, 2.8, 0xd23a3a], [2.4, 2.4, 0x2f6fd6], [2.0, 2.0, 0xf5c84a]]) box(0.25, 0.25, 0.08, c, mx, my, -2.66);
  const pots = [[-1.9, 1.85, -3.2], [-0.9, 1.85, -3.3], [-1.4, 1.85, -2.9]].map(([x, y, z], i) => { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.3, 0.4, 20), M_(0xb8bcc4, { m: 0.8, r: 0.3 })); p.position.set(x, y, z); p.castShadow = true; add(p); return [p, x, y, z, i]; });
  on((u) => pots.forEach(([p, x, y, z, i]) => { const q = sm(0.6 + i * 0.25, 1.3 + i * 0.25, u); p.position.set(lerp(x, 1.6 + i * 0.3, q), lerp(y, 1.9 + i * 0.55, q) + Math.sin(q * Math.PI) * 0.6, lerp(z, -2.55, q)); p.rotation.z = q * 1.57; }));
  const A = person(P_[3], 0.2, -1.6, 0.2, 'idle'); on((u) => { A.pose = u > 1.0 ? 'shock' : 'idle'; A.setFace(u > 1.0 ? 'shock' : 'smile'); });
  shadowAt(0, -2, 7);
}, cam: dolly(P([0.2, 2.2, 3.2], [0.4, 1.7, -2.6], 58), P([0.2, 2.2, 2.4], [0.4, 1.8, -2.6], 58)) });
// C07: generators push out far too much voltage (power plant, sparks)
shot('C07', { scene: { sky: ['#6a7a90', '#c8d0d8'] }, build() {
  ground({ road: false }); box(14, 7, 8, 0xc8c2b4, 0, 3.5, -16); box(2.4, 14, 2.4, 0x9a948a, 5, 7, -18); box(2.4, 12, 2.4, 0x9a948a, 8, 6, -18);
  label('POWER PLANT', 0, 6.2, -11.9, { w: 6, size: 64, color: '#2a2a33' });
  for (let i = 0; i < 3; i++) { box(2.2, 2.4, 2.2, 0x3a6fd6, -4 + i * 4, 1.2, -9.5, { m: 0.3 }); box(2.4, 0.3, 2.4, 0x2a2a30, -4 + i * 4, 2.55, -9.5); burst(-4 + i * 4, 2.7, -9.5, 0.9 + i * 0.45, { n: 16, size: 3, seed: i + 7 }); }
  const A = person(DOC, 0, -6.6, 0, 'idle'); on((u) => { A.pose = u > 1.2 ? 'shock' : 'idle'; A.setFace(u > 1.2 ? 'shock' : 'smile'); });
  shadowAt(0, -8, 12);
}, cam: dolly(P([1.2, 2.6, -1.0], [0, 2.6, -10], 58), P([0.8, 2.5, -1.8], [0, 2.6, -10], 58)) });
// C08: power lines overload, transformers explode one after another (dusk)
shot('C08', { scene: { sky: ['#3a3f6a', '#e08a5a'] }, build() {
  street({ lit: true }); const tops = poles(7, -4.6); getScene().userData.sun.intensity = 0.9;
  tops.forEach(([x, z], i) => { burst(x + 0.5, 5.0, z, 0.9 + i * 0.32, { n: 22, size: 6, seed: i + 11 }); smoke(x + 0.5, 5.2, z, 1.0 + i * 0.32); });
  const A = person(ME, 0.5, -6.6, 0.1, 'idle'); A.pitch = -0.3; on((u) => { A.pose = u > 1.2 ? 'shock' : 'idle'; A.setFace(u > 1.2 ? 'shock' : 'smile'); });
  shadowAt(0, -5, 14);
}, cam: dolly(P([4.5, 2.2, 1.8], [-3, 4.4, -5], 60), P([3.8, 2.1, 1.0], [-4, 4.6, -5], 60)) });
// C08b: hospital backup generators fail too
shot('C08b', { scene: { sky: ['#2a2f50', '#a86a5a'] }, build() {
  ground({ road: false }); box(16, 8, 8, 0xf2f2f4, 0, 4, -16); box(1.0, 3, 0.2, 0xd23a3a, 0, 6, -11.9); box(3, 1.0, 0.2, 0xd23a3a, 0, 6, -11.9);
  label('HOSPITAL', 0, 4.0, -11.88, { w: 5, size: 70, color: '#d23a3a' });
  const winM = M_(0x9fd3ff, { em: 0xffffff, ei: 1.2 }); const wins = []; for (let i = 0; i < 6; i++) { const w = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1.4), winM); w.position.set(-6 + i * 2.4, 2.0, -11.88); add(w); wins.push(w); }
  box(3, 2, 2, 0x5a6a3a, 6, 1, -9); burst(6, 2.2, -9, 1.8, { n: 20, size: 4, seed: 21 }); smoke(6, 2.2, -9, 1.9);
  on((u) => { winM.emissiveIntensity = u < 0.5 ? 1.2 : (u < 1.8 ? (Math.sin(u * 40) > 0 ? 1.0 : 0.2) : 0.0); });
  const D = person(DOC, -1.2, -6.6, 0.2, 'idle'); on((u) => { D.pose = u > 1.9 ? 'shock' : 'idle'; D.setFace(u > 1.9 ? 'shock' : 'confused'); });
  getScene().userData.sun.intensity = 0.6; shadowAt(0, -8, 12);
}, cam: dolly(P([0.6, 2.6, -0.4], [0, 3.0, -11], 58), P([0.4, 2.5, -1.4], [0, 3.0, -11], 58)) });
// C09: even gold would change colour
shot('C09', { scene: { interior: true }, build() {
  room({ wall: 0x2a2a35, floor: '#3a3a45', w: 8, d: 8, h: 5, lamp: 45 }); box(2.4, 1.2, 1.4, 0x6a1a2a, 0, 0.6, -2.0);
  const gm = M_(0xf0b020, { m: 0.4, r: 0.3, em: 0x3a2400, ei: 0.4 }); for (const [x, y] of [[-0.35, 1.32], [0.35, 1.32], [0, 1.56]]) { const g = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.22, 0.3), gm); g.position.set(x, y, -2.0); g.castShadow = true; add(g); }
  const spot = new THREE.SpotLight(0xffffff, 70, 10, 0.6, 0.4); spot.position.set(0, 4, -0.5); spot.target.position.set(0, 1.3, -2); add(spot); add(spot.target);
  const c0 = new THREE.Color(0xf0b020), c1 = new THREE.Color(0xc8603a); on((u) => gm.color.copy(c0).lerp(c1, sm(0.3, 1.2, u)));
}, cam: dolly(P([0.4, 2.1, 1.2], [0, 1.3, -2.0], 46), P([0.3, 2.0, 0.6], [0, 1.35, -2.0], 46)) });
// C10: within minutes, the whole planet goes dark
shot('C10', { scene: { night: true }, build() {
  street({ lit: true, n: 8 }); stars(); getScene().userData.hemi.intensity = 0.5;
  blackout(0.5, 1.8);
  [[-1.2, -6.2, 0.2], [0.2, -6.4, 0], [1.4, -6.1, -0.2]].forEach(([x, z, yw], i) => { const A = person([ME, P_[4], P_[1]][i], x, z, Math.PI + yw, 'idle'); A.pitch = -0.2; });
  on((u) => { getScene().userData.hemi.intensity = 0.5 * (1 - sm(1.2, 2.6, u)) + 0.22; getScene().userData.sun.intensity = 1.1 * (1 - sm(1.2, 2.6, u)); });
}, cam: dolly(P([0, 2.6, -1.0], [0, 3.6, -15], 60), P([0, 2.8, 0.2], [0, 3.8, -15], 60)) });
