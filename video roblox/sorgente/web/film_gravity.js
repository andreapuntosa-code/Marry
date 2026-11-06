// "What if gravity was 10 m/s² instead of 9.81?" -- Roblox-style What-if (no badges), shots for script_gravity.py
import { THREE, shot, person, street, ground, house, tree, room, label, glowTex, stars, add, on, shadowAt, camLerp, sm, lerp, getScene } from './kit.js';

const ME = { skin: 0xf2c79a, shirt: 0x2fa84f, pants: 0x2f4a8a, hair: { style: 'bowl', color: 0x6b3a1e }, logo: 0xffd23a };
const P_ = [
  { skin: 0xf2c79a, shirt: 0xf28c28, pants: 0x2f4a8a, hair: { style: 'spiky', color: 0x2a1a10 }, acc: ['headband'] },
  { skin: 0x8a5a3a, shirt: 0x3fa7d6, pants: 0xc9b38a, hair: { style: 'short', color: 0x1a1210 } },
  { skin: 0xffd9b3, shirt: 0xb04ac9, pants: 0x4a4a55, hair: { style: 'bun', color: 0x8a3a1a } },
  { skin: 0xc68a5a, shirt: 0xd23a3a, pants: 0x2a2a35, hair: { style: 'long', color: 0x2a1a10 } },
  { skin: 0xf6d2b0, shirt: 0x7fc8f0, pants: 0x3b5ba8, hair: { style: 'long', color: 0xc8904a } },
];
const P = (a, b, fov = 50) => ({ pos: a, tgt: b, fov });
const dolly = (a, b) => (u, d) => camLerp(a, b, u / d);
const CU = (x, z, o = {}) => { const d = o.d ?? 3.2, sx = o.side ?? 0.25, hy = o.hy ?? 1.94; return dolly(P([x + sx, hy - 0.09, z + d], [x, hy - 0.49, z], o.fov ?? 50), P([x + sx * 0.5, hy - 0.09, z + d - (o.push ?? 0.5)], [x, hy - 0.49, z], o.fov ?? 50)); };
const M_ = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: o.r ?? 0.55, metalness: o.m ?? 0, emissive: o.em ?? 0, emissiveIntensity: o.ei ?? 1 });
const box = (w, h, d, c, x, y, z, o) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), M_(c, o)); m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; add(m); return m; };
// a text that switches from a to b at time t0 (two labels)
function swap(a, b, t0, x, y, z, o) { const A = label(a, x, y, z, o), B = label(b, x, y, z + 0.01, o); B.visible = false; on((u) => { B.visible = u >= t0; A.visible = !B.visible; }); return [A, B]; }
const SPACE = { sky: ['#000006', '#03031a'], fog0: 4000, fog1: 9000 };

// ------------------------------------------------------------------ props
function earth(R, x, y, z) {
  const cv = document.createElement('canvas'); cv.width = 1024; cv.height = 512; const g = cv.getContext('2d');
  g.fillStyle = '#2f7fd6'; g.fillRect(0, 0, 1024, 512); let s = 7; const r = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
  for (let i = 0; i < 26; i++) { g.fillStyle = r() < 0.7 ? '#4caf50' : '#c9b26a'; const cx = r() * 1024, cy = 90 + r() * 330; for (let k = 0; k < 9; k++) { g.beginPath(); g.arc(cx + (r() - 0.5) * 120, cy + (r() - 0.5) * 70, 20 + r() * 45, 0, 6.283); g.fill(); } }
  g.fillStyle = 'rgba(255,255,255,0.85)'; for (let i = 0; i < 70; i++) { g.beginPath(); g.ellipse(r() * 1024, r() * 512, 20 + r() * 60, 6 + r() * 12, 0, 0, 6.283); g.fill(); }
  g.fillStyle = '#ffffff'; g.fillRect(0, 0, 1024, 26); g.fillRect(0, 486, 1024, 26);
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace;
  const m = new THREE.Mesh(new THREE.SphereGeometry(R, 96, 64), new THREE.MeshStandardMaterial({ map: t, roughness: 0.8 })); m.position.set(x, y, z); add(m);
  const atm = new THREE.Mesh(new THREE.SphereGeometry(R * 1.025, 96, 64), new THREE.MeshBasicMaterial({ color: 0x7fc8ff, transparent: true, opacity: 0.35, side: THREE.BackSide, blending: THREE.AdditiveBlending, depthWrite: false })); atm.position.copy(m.position); add(atm);
  on((u) => { m.rotation.y = u * 0.02; }); return m;
}
function iss(x, y, z, s = 1) {
  const g = new THREE.Group(); g.position.set(x, y, z); g.scale.setScalar(s); add(g);
  const add2 = (geo, c, px, py, pz, o) => { const m = new THREE.Mesh(geo, M_(c, o)); m.position.set(px, py, pz); g.add(m); return m; };
  add2(new THREE.BoxGeometry(9, 0.25, 0.25), 0xb8bcc4, 0, 0, 0, { m: 0.5 });
  for (const sx of [-1, 1]) { add2(new THREE.CylinderGeometry(0.45, 0.45, 2.6, 16), 0xe8e8ec, sx * 0.9, 0, 0.9).rotation.x = Math.PI / 2; }
  add2(new THREE.CylinderGeometry(0.4, 0.4, 2.2, 16), 0xd8d8de, 0, 0, -0.6).rotation.z = Math.PI / 2;
  for (const sx of [-4.2, -2.9, 2.9, 4.2]) for (const sz of [-1, 1]) add2(new THREE.BoxGeometry(1.1, 0.04, 2.6), 0x1f3f9a, sx, 0, sz * 1.6, { m: 0.4, r: 0.3 });
  return g;
}
function satellite(x, y, z) {
  const g = new THREE.Group(); g.position.set(x, y, z); add(g);
  const b = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.5), M_(0xd8b04a, { m: 0.6 })); g.add(b);
  for (const s of [-1, 1]) { const p = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.03, 0.45), M_(0x1f3f9a, { m: 0.4 })); p.position.x = s * 0.8; g.add(p); }
  return g;
}
function heat(obj, size = 6) {
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex(), color: 0xff7a2a, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false })); s.scale.setScalar(size); obj.add(s); return s;
}
function plane(x, y, z) {
  const g = new THREE.Group(); g.position.set(x, y, z); add(g);
  const b = (w, h, d, c, px, py, pz) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), M_(c)); m.position.set(px, py, pz); m.castShadow = true; g.add(m); return m; };
  b(7, 1.1, 1.1, 0xffffff, 0, 0, 0); b(1.2, 0.9, 1.0, 0x2a3a6a, 3.4, 0.05, 0); b(1.6, 0.15, 9, 0xe8e8ee, 0, -0.2, 0); b(1.0, 1.6, 0.15, 0xd23a3a, -3.2, 0.9, 0); b(0.9, 0.12, 3, 0xe8e8ee, -3.1, 0.2, 0);
  for (const s of [-1, 1]) b(1.2, 0.6, 0.6, 0x9aa0aa, 0.3, -0.6, s * 2.4);
  for (let i = 0; i < 6; i++) b(0.3, 0.3, 0.05, 0x7fc8f0, 1.8 - i * 0.7, 0.2, 0.56);
  return g;
}
function rocket(x, z) {
  const g = new THREE.Group(); g.position.set(x, 0, z); add(g);
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 7, 24), M_(0xf2f2f4)); body.position.y = 4; body.castShadow = true; g.add(body);
  const nose = new THREE.Mesh(new THREE.ConeGeometry(0.8, 1.8, 24), M_(0xd23a3a)); nose.position.y = 8.4; g.add(nose);
  for (let i = 0; i < 4; i++) { const f = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.6, 1.2), M_(0xd23a3a)); f.position.set(Math.cos(i * 1.571) * 0.8, 1.2, Math.sin(i * 1.571) * 0.8); f.rotation.y = -i * 1.571; g.add(f); }
  const band = new THREE.Mesh(new THREE.CylinderGeometry(0.82, 0.82, 0.4, 24), M_(0x2a3a6a)); band.position.y = 6; g.add(band);
  const fl = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex(), color: 0xffa040, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false })); fl.position.y = 0.0; fl.scale.set(2.6, 5, 1); g.add(fl);
  const L = new THREE.PointLight(0xffa040, 30, 30, 1.4); L.position.y = 0.5; g.add(L);
  return { g, fl };
}

// ------------------------------------------------------------------ shots
// G01: the town; a big billboard: g = 9.81 -> 10
shot('G01', { build() {
  street(); box(0.3, 5.6, 0.3, 0x5a5a62, -2.3, 2.8, -7.8); box(0.3, 5.6, 0.3, 0x5a5a62, 2.3, 2.8, -7.8);
  box(5.4, 2.6, 0.25, 0xffffff, 0, 5.3, -7.8); box(5.6, 2.8, 0.2, 0x23356b, 0, 5.3, -7.95);
  swap('g = 9.81 m/s²', 'g = 10 m/s²', 1.5, 0, 5.3, -7.66, { w: 5.2, size: 64, color: '#1d1d2a' });
  [[P_[0], -2.5, -5.2, 0.3], [P_[3], 2.4, -5.4, -0.3], [ME, 0, -5.0, 0]].forEach(([d, x, z, yw], i) => { const A = person(d, x, z, yw, 'idle'); A.pitch = -0.25; on((u) => { A.pose = u > 1.5 ? 'shock' : 'idle'; }); });
  shadowAt(0, -6, 10);
}, cam: dolly(P([0.2, 2.2, 3.6], [0, 3.3, -7.8], 58), P([0.1, 2.1, 2.2], [0, 3.4, -7.8], 58)) });
// G02: only two percent... sounds like nothing
shot('G02', { build() { street(); const A = person(ME, 0, -6.3, 0, 'idle'); on((u) => { A.pose = u > 1.5 ? 'shrug' : 'idle'; }); shadowAt(0, -6, 8); }, cam: CU(0, -6.3) });
// G03: the bathroom scale: 70.0 -> 71.4 kg
shot('G03', { scene: { interior: true }, build() {
  room({ wall: 0xd8eef2, floor: '#e8e8e8', w: 8, d: 8, h: 5, lamp: 30 }); box(2.2, 2.0, 0.2, 0xbfe6ff, -1.8, 3.0, -3.85);
  box(1.1, 0.14, 1.0, 0xf4f4f6, -0.4, 0.07, -2.2); box(1.9, 0.9, 0.08, 0x18181c, 1.1, 2.75, -3.82);
  swap('70.0 kg', '71.4 kg', 3.3, 1.1, 2.75, -3.76, { w: 1.8, size: 110, color: '#4dff7a' });
  const A = person(P_[1], -0.4, -2.2, 0, 'idle', { y: 0.14 }); A.pitch = 0.35; on((u) => { A.setFace(u > 3.4 ? 'shock' : 'smile'); A.pose = u > 3.4 ? 'shock' : 'idle'; });
  shadowAt(0, -2, 6);
}, cam: dolly(P([0.6, 1.9, 2.4], [0.3, 1.7, -2.4], 58), P([0.5, 1.85, 1.6], [0.3, 1.75, -2.4], 58)) });
// G04: jumps a little lower: 50 -> 49 cm next to a measuring pole
shot('G04', { build() {
  street(); box(0.3, 3.0, 0.1, 0xffffff, 1.0, 1.5, -6.4);
  for (let k = 0; k < 15; k++) box(k % 5 === 0 ? 0.3 : 0.16, 0.03, 0.04, 0xd23a3a, 1.0 + (k % 5 === 0 ? 0.0 : -0.07), 0.1 * k * 2 + 0.05, -6.33);
  swap('50 cm', '49 cm', 1.0, 0.5, 3.0, -6.25, { w: 1.6, size: 90, color: '#d23a3a' });
  const A = person(P_[0], -0.2, -6.3, 0.2, 'cheer'); A.anim = (Q, u) => { const ph = (u * 1.25) % 1; Q.root.position.y = Math.sin(ph * Math.PI) * (u < 1.0 ? 0.5 : 0.49); };
  shadowAt(0, -6, 8);
}, cam: dolly(P([0.4, 1.9, -2.2], [0.3, 1.5, -6.3], 56), P([0.3, 1.85, -2.8], [0.3, 1.55, -6.3], 56)) });
// G05a: a plane working harder; G05b: a rocket launch
shot('G05', { build() {
  ground({ road: false }); tree(-6, -14, 1.2, 3); tree(7, -16, 1.1, 5); house(0, -30, 0, { fence: false });
  const pl = plane(-9, 14, -16); on((u) => { pl.position.x = -9 + u * 6; pl.position.y = 14 + Math.sin(u * 3) * 0.2; pl.rotation.z = 0.06 + Math.sin(u * 2) * 0.03; });
  const A = person(ME, 0.4, -4, Math.PI, 'point'); A.pitch = -0.5;
}, cam: dolly(P([1.6, 1.6, 2.5], [0, 9, -16], 60), P([1.4, 1.6, 2.0], [2, 10, -16], 60)) });
shot('G05', { off: 2.2, scene: { sky: ['#4a8fd6', '#cfeaff'] }, build() {
  ground({ road: false }); box(6, 0.6, 6, 0x6a6a72, 0, 0.3, -14); tree(-8, -12, 1.1, 2);
  const R = rocket(0, -14); on((u) => { const h = Math.max(0, u - 0.3); R.g.position.y = 0.6 + h * h * 2.2; R.fl.scale.set(2.6 + Math.sin(u * 30) * 0.3, 5 + Math.sin(u * 23) * 0.6, 1); R.fl.position.y = -1.6; });
}, cam: dolly(P([0, 3, 6], [0, 5, -14], 58), P([0, 3.2, 5], [0, 9, -14], 58)) });
// G06: the real problem is up there (dusk, looking up)
shot('G06', { scene: { night: true }, build() { street({ lit: true }); stars(); getScene().userData.hemi.intensity = 1.7; const A = person(ME, 0, -6.3, 0, 'idle'); A.pitch = -0.2; shadowAt(0, -6, 8); }, cam: CU(0, -6.3, { d: 3.4 }) });
// G07: the Space Station over the Earth
shot('G07', { scene: SPACE, build() {
  getScene().userData.sun.intensity = 3.0; getScene().userData.hemi.intensity = 0.25; stars(3000);
  earth(120, 0, -128, -40); const S = iss(0, 0, 0, 0.6); on((u) => { S.rotation.y = 0.4 + u * 0.03; S.position.x = u * 0.4; });
}, cam: dolly(P([4.5, 2.2, 7.0], [0, -1.0, 0], 50), P([3.6, 1.9, 5.8], [0.6, -1.0, 0], 50)) });
// G08: dipping into the air: it heats up and starts to fall
shot('G08', { scene: SPACE, build() {
  getScene().userData.sun.intensity = 3.0; getScene().userData.hemi.intensity = 0.25; stars(3000);
  earth(120, 0, -128, -40); const S = iss(0, 0, 0, 0.6); const h = heat(S, 14);
  on((u, d) => { const k = sm(0.3, d, u); S.position.y = -4.5 * k * k; S.position.x = u * 0.6; S.rotation.z = 0.25 * k; S.rotation.y = 0.4; h.material.opacity = sm(2.0, d, u) * 0.9; });
}, cam: (u, d) => { const k = sm(0.3, d, u); return P([4.5, 2.4 - 4.0 * k * k, 8.0], [0.5, -1.2 - 4.4 * k * k, 0], 52); } });
// G09: thousands of satellites follow it (glowing streaks)
shot('G09', { scene: SPACE, build() {
  getScene().userData.sun.intensity = 3.0; getScene().userData.hemi.intensity = 0.25; stars(3000); earth(120, 0, -128, -40);
  let s = 3; const r = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
  for (let i = 0; i < 40; i++) { const x0 = (r() - 0.5) * 30, y0 = 2 + r() * 8, z0 = -6 - r() * 26, v = 1.2 + r() * 2; const S = satellite(x0, y0, z0); const h = heat(S, 2.2);
    on((u) => { S.position.y = y0 - v * u * u * 0.8; S.position.x = x0 + u * 0.8; S.rotation.x = u * (1 + r()); h.material.opacity = Math.min(0.9, u * 0.6); }); }
}, cam: dolly(P([0, 4, 10], [0, 0, -12], 56), P([0, 3.5, 9], [0, -1, -12], 56)) });
// G10: the Moon swings closer, the tide rises (beach at night)
shot('G10', { scene: { night: true, fog0: 200, fog1: 900 }, build() {
  const sand = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), M_(0xe8d49a, { r: 0.95 })); sand.rotation.x = -Math.PI / 2; sand.receiveShadow = true; add(sand);
  const sea = new THREE.Mesh(new THREE.PlaneGeometry(400, 200), M_(0x2a6ab0, { r: 0.2, m: 0.1 })); sea.rotation.x = -Math.PI / 2; sea.position.set(0, 0.05, -112); add(sea);
  const moon = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 24), new THREE.MeshBasicMaterial({ color: 0xf4f0dc, fog: false })); moon.position.set(6, 34, -160); add(moon);
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex(), color: 0xfff4c8, transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending, depthWrite: false, fog: false })); halo.position.copy(moon.position); add(halo);
  stars(); getScene().userData.hemi.intensity = 1.0;
  on((u, d) => { const k = sm(0, d, u); moon.scale.setScalar(9 + 5 * k); halo.scale.setScalar(36 + 22 * k); sea.position.z = -112 + 7.5 * sm(1.6, d, u); sea.position.y = 0.05 + 0.15 * sm(1.6, d, u); });
  [[ME, -0.6, -6, 0.15], [P_[4], 0.7, -6.2, -0.15]].forEach(([dd, x, z, yw]) => { const A = person(dd, x, z, Math.PI + yw, 'idle'); A.pitch = -0.35; on((u) => { A.pose = u > 2.0 ? 'point' : 'idle'; }); });
  shadowAt(0, -6, 8);
}, cam: dolly(P([0.3, 1.7, 2.2], [1.5, 7, -40], 58), P([0.3, 1.6, 1.4], [2.0, 9, -40], 58)) });
// G11: the pendulum clock runs fast: +14 minutes a day
shot('G11', { scene: { interior: true }, build() {
  room({ wall: 0xe9d9b8, floor: '#9a6a3a', w: 9, d: 8, h: 5, lamp: 30 });
  box(1.6, 4.0, 0.8, 0x6b3a1e, 0, 2.0, -3.4); box(1.3, 1.3, 0.1, 0xfaf3e0, 0, 3.3, -2.95);
  const hands = [0, 1].map(i => { const h = new THREE.Mesh(new THREE.BoxGeometry(0.05, i ? 0.55 : 0.4, 0.03), M_(0x111111)); h.geometry.translate(0, (i ? 0.55 : 0.4) / 2, 0); h.position.set(0, 3.3, -2.88); add(h); return h; });
  const pend = new THREE.Group(); pend.position.set(0, 2.5, -2.95); add(pend); const rod = new THREE.Mesh(new THREE.BoxGeometry(0.05, 1.3, 0.03), M_(0xc8a040, { m: 0.6 })); rod.position.y = -0.65; pend.add(rod);
  const bob = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.06, 24), M_(0xd8b04a, { m: 0.7, r: 0.3 })); bob.rotation.x = Math.PI / 2; bob.position.y = -1.3; pend.add(bob);
  box(2.2, 1.0, 0.06, 0xfff27a, 1.75, 4.15, -3.85); label('+14 MIN\nEVERY DAY', 1.75, 4.15, -3.8, { w: 2.3, size: 64, color: '#d23a3a' });
  on((u) => { pend.rotation.z = Math.sin(u * 7) * 0.35; hands[1].rotation.z = -u * 2.2; hands[0].rotation.z = -u * 0.2 - 1.2; });
  const A = person(ME, -1.4, -1.6, 0.6, 'idle'); A.look = 0.4; on((u) => { A.pose = u > 2.7 ? 'shock' : 'think'; A.setFace(u > 2.7 ? 'shock' : 'confused'); });
  shadowAt(0, -2, 7);
}, cam: dolly(P([0.6, 2.5, 3.6], [0.3, 2.5, -2.6], 58), P([0.4, 2.5, 2.8], [0.3, 2.6, -2.6], 58)) });
