// "What if gravity was 11 m/s²?" -- sequel of the viral g = 10 video, v2 look. Shots for script_g11.py
import { onPost } from './kit.js';
import { dynLabel, billboard } from './whatif.js';
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


const DOF = { aperture: 0.002, maxblur: 0.006 };
const DAY = { bloom: 0.3, bloomThreshold: 1.8, exposure: 0.85, dof: DOF };
const IN = { interior: true, bloom: 0.3, bloomThreshold: 1.0, exposure: 0.95, env: 0.45, dof: DOF };
const SP2 = { ...SPACE, night: true, bloom: 0.4, bloomThreshold: 0.95, exposure: 0.95, env: 0.1 };
const ENG = { skin: 0xf0d0b0, shirt: 0xf28c28, pants: 0x2a3a6a, hair: { style: 'short', color: 0x3a2414 }, acc: ['glasses'] };
function hardhat(A) { const h = new THREE.Mesh(new THREE.SphereGeometry(0.78, 24, 12, 0, 6.283, 0, Math.PI / 2), M_(0xf5c820, { r: 0.35 })); h.position.y = 0.55; A.head.add(h); const b = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 0.95, 0.06, 28), h.material); b.position.y = 0.56; A.head.add(b); }
// H01: the billboard: 9.81 -> 11
shot('H01', { scene: DAY, build() {
  street(); billboard((u) => u < 1.4 ? 'g = 9.81 m/s²' : 'g = 11 m/s²', 0, -7.8, { size: 118 });
  [[P_[0], -2.5, -5.2, 0.3], [P_[3], 2.4, -5.4, -0.3], [ME, 0, -5.0, 0]].forEach(([d, x, z, yw]) => { const A = person(d, x, z, yw, 'idle'); A.pitch = -0.25; on((u) => { A.pose = u > 1.4 ? 'shock' : 'idle'; A.setFace(u > 1.4 ? 'shock' : 'smile'); }); });
  shadowAt(0, -6, 10);
}, cam: dolly(P([0.2, 2.2, 3.4], [0, 3.7, -7.8], 58), P([0.1, 2.1, 2.2], [0, 3.8, -7.8], 58)) });
// H02: last time we tried ten; this time, further (part 2)
shot('H02', { scene: DAY, build() { street(); billboard((u) => u < 1.2 ? 'g = 10 ✓' : 'g = 11 ?', 0, -9.5, { size: 170, color: '#1d1d2a' }); const A = person(ME, 0, -5.5, 0, 'idle', { face: 'smug' }); on((u) => { A.pose = u > 1.2 ? 'point' : 'idle'; }); dynLabel(() => 'PART 2', 2.0, 2.3, -5, { w: 2.6, size: 170, color: '#ffd23a' }); shadowAt(0, -6, 8); }, cam: dolly(P([0.4, 2.3, 1.4], [0.3, 3.2, -9.5], 56), P([0.3, 2.2, 0.6], [0.3, 3.3, -9.5], 56)) });
// H03: the scale: 70.0 -> 78.5 kg; scales measure force, not mass
shot('H03', { scene: IN, build() {
  room({ wall: 0xd8eef2, floor: '#e8e8e8', w: 8, d: 8, h: 5, lamp: 22 }); box(2.2, 2.0, 0.2, 0xbfe6ff, -1.8, 3.0, -3.85);
  box(1.1, 0.14, 1.0, 0xf4f4f6, -0.4, 0.07, -2.2); box(2.2, 1.1, 0.08, 0x18181c, 1.1, 2.75, -3.82);
  dynLabel((u) => u < 1.6 ? '70.0 kg' : u < 3.6 ? '78.5 kg' : 'FORCE ≠ MASS', 1.1, 2.75, -3.76, { w: 2.1, size: 150, color: (s) => s.startsWith('F') ? '#ffd23a' : '#4dff7a', stroke: false });
  const A = person(P_[1], -0.4, -2.2, 0, 'idle', { y: 0.14 }); A.pitch = 0.35; on((u) => { A.setFace(u > 1.7 ? 'shock' : 'smile'); A.pose = u > 1.7 && u < 3.6 ? 'shock' : 'idle'; if (u > 3.6) { A.pose = 'think'; A.setFace('smug'); } });
  shadowAt(0, -2, 6);
}, cam: dolly(P([0.6, 2.2, 2.4], [0.3, 1.9, -2.6], 54), P([0.5, 2.2, 1.7], [0.3, 2.0, -2.6], 54)) });
// H04: every jump 10% lower; stand up too fast -> dizzy
shot('H04', { scene: DAY, build() {
  street(); box(0.3, 3.0, 0.1, 0xffffff, 1.0, 1.5, -6.4);
  for (let k = 0; k < 15; k++) box(k % 5 === 0 ? 0.3 : 0.16, 0.03, 0.04, 0xd23a3a, 1.0 + (k % 5 === 0 ? 0.0 : -0.07), 0.1 * k * 2 + 0.05, -6.33);
  dynLabel((u) => u < 1.1 ? '50 cm' : '45 cm', 0.4, 3.2, -6.25, { w: 1.8, size: 170, color: '#d23a3a', stroke: '#ffffff' });
  const A = person(P_[0], -0.2, -6.3, 0.2, 'cheer'); A.anim = (Q, u) => { if (u < 2.2) { const ph = (u * 1.25) % 1; Q.root.position.y = Math.sin(ph * Math.PI) * (u < 1.0 ? 0.5 : 0.45); Q.pose = 'cheer'; } else { Q.root.position.y = 0; Q.pose = 'idle'; Q.setFace('confused'); Q.root.rotation.z = Math.sin(u * 5) * 0.08; } };
  shadowAt(0, -6, 8);
}, cam: dolly(P([0.4, 1.4, -2.6], [0.2, 1.2, -6.3], 52), P([0.3, 1.4, -3.1], [0.2, 1.2, -6.3], 52)) });
// H05: pendulum clocks run fast: almost 1.5 hours a day
shot('H05', { scene: IN, build() {
  room({ wall: 0xe9d9b8, floor: '#9a6a3a', w: 9, d: 8, h: 5, lamp: 20 });
  box(1.6, 4.0, 0.8, 0x6b3a1e, 0, 2.0, -3.4); box(1.3, 1.3, 0.1, 0xfaf3e0, 0, 3.3, -2.95);
  const hands = [0, 1].map(i => { const h = new THREE.Mesh(new THREE.BoxGeometry(0.05, i ? 0.55 : 0.4, 0.03), M_(0x111111)); h.geometry.translate(0, (i ? 0.55 : 0.4) / 2, 0); h.position.set(0, 3.3, -2.88); add(h); return h; });
  const pend = new THREE.Group(); pend.position.set(0, 2.5, -2.95); add(pend); const rod = new THREE.Mesh(new THREE.BoxGeometry(0.05, 1.3, 0.03), M_(0xc8a040, { m: 0.6 })); rod.position.y = -0.65; pend.add(rod);
  const bob = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.06, 24), M_(0xd8b04a, { m: 0.7, r: 0.3 })); bob.rotation.x = Math.PI / 2; bob.position.y = -1.3; pend.add(bob);
  box(2.0, 1.0, 0.06, 0xfff27a, 1.55, 4.15, -3.85); dynLabel(() => '+85 MIN\nEVERY DAY', 1.55, 4.15, -3.8, { w: 2.0, size: 140, color: '#d23a3a', stroke: false });
  on((u) => { pend.rotation.z = Math.sin(u * 8) * 0.35; hands[1].rotation.z = -u * 4.5; hands[0].rotation.z = -u * 0.4 - 1.2; });
  const A = person(ME, -1.4, -1.6, 0.6, 'idle'); A.look = 0.4; on((u) => { A.pose = u > 2.4 ? 'shock' : 'think'; A.setFace(u > 2.4 ? 'shock' : 'confused'); });
  shadowAt(0, -2, 7);
}, cam: dolly(P([0.6, 2.5, 3.6], [0.3, 2.5, -2.6], 58), P([0.4, 2.5, 2.8], [0.3, 2.6, -2.6], 58)) });
// H06: most bridges would hold: engineers build them way stronger
shot('H06', { scene: { ...DAY, sky: ['#5a9ae0', '#dff0ff'] }, build() {
  ground({ road: false, grass: 0x5aaa4a }); const river = new THREE.Mesh(new THREE.PlaneGeometry(400, 14), M_(0x2a7ab8, { r: 0.15, m: 0.2 })); river.rotation.x = -Math.PI / 2; river.position.set(0, 0.03, -10); add(river);
  box(30, 0.8, 4, 0x8a8a92, 0, 4, -10); for (const x of [-9, 0, 9]) box(1.2, 4, 1.2, 0x7a7a82, x, 2, -10); for (let i = -14; i <= 14; i += 1.5) box(0.12, 1.0, 0.12, 0xd23a3a, i, 4.9, -8.1);
  const arch = new THREE.Mesh(new THREE.TorusGeometry(9, 0.25, 8, 64, Math.PI), M_(0xd23a3a, { m: 0.4, r: 0.4 })); arch.position.set(0, 4.4, -8.1); add(arch); const arch2 = arch.clone(); arch2.position.z = -11.9; add(arch2);
  [[-2.5, 0.3], [0, 0], [2.5, -0.3]].forEach(([x, yw], i) => { const E = person(i === 1 ? ENG : { ...ENG, shirt: [0x3a8ad6, 0xd23a3a][i % 2] }, x, -9.4, yw, 'cheer', { face: 'smile', y: 4.4 }); hardhat(E); });
  dynLabel(() => 'BUILT\n1.5× STRONGER', 0, 9.2, -10, { w: 7, size: 105, color: '#ffd23a' });
}, cam: dolly(P([3, 5.2, 6], [0, 5.4, -10], 52), P([2.4, 5.4, 4.6], [0, 5.6, -10], 52)) });
// H07: up there it's a disaster: the Space Station is too slow
shot('H07', { scene: SP2, build() {
  getScene().userData.sun.intensity = 3.0; getScene().userData.hemi.intensity = 0.25; stars(3000);
  earth(120, 0, -128, -40); const S = iss(0, 0, 0, 0.6); on((u) => { S.rotation.y = 0.4 + u * 0.03; S.position.x = u * 0.4; });
  dynLabel(() => 'TOO SLOW', 0.6, 2.0, 0, { w: 2.6, size: 170, color: '#ff5a4a', billboard: false });
}, cam: dolly(P([4.5, 2.2, 7.0], [0, -0.2, 0], 50), P([3.6, 1.9, 5.8], [0.6, -0.2, 0], 50)) });
// H08: in ~15 minutes it hits the atmosphere; thousands of satellites behind it
shot('H08', { scene: SP2, build() {
  getScene().userData.sun.intensity = 3.0; getScene().userData.hemi.intensity = 0.25; stars(3000);
  earth(120, 0, -128, -40); const S = iss(0, 0, 0, 0.6); const h = heat(S, 14);
  on((u, d) => { const k = sm(0.3, d, u); S.position.y = -4.5 * k * k; S.position.x = u * 0.6; S.rotation.z = 0.25 * k; S.rotation.y = 0.4; h.material.opacity = sm(1.2, d, u) * 0.9; });
  dynLabel(() => '~15 MIN', 0.5, 2.6, 0, { w: 3, size: 170, color: '#ffd23a' });
}, cam: (u, d) => { const k = sm(0.3, d, u); return P([4.5, 2.4 - 4.0 * k * k, 8.0], [0.5, -1.2 - 4.4 * k * k, 0], 52); } });
shot('H08', { off: 2.5, scene: SP2, build() {
  getScene().userData.sun.intensity = 3.0; getScene().userData.hemi.intensity = 0.25; stars(3000); earth(120, 0, -128, -40);
  let s = 3; const r = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
  for (let i = 0; i < 40; i++) { const x0 = (r() - 0.5) * 30, y0 = 2 + r() * 8, z0 = -6 - r() * 26, v = 1.2 + r() * 2; const S = satellite(x0, y0, z0); const h = heat(S, 2.2);
    on((u) => { S.position.y = y0 - v * u * u * 0.8; S.position.x = x0 + u * 0.8; S.rotation.x = u * 1.3; h.material.opacity = Math.min(0.9, u * 0.6); }); }
}, cam: dolly(P([0, 4, 12], [0, 2, -12], 56), P([0, 3.5, 11], [0, 1, -12], 56)) });
// H09: the Moon swings 20% closer every month; tides twice as strong
shot('H09', { scene: SP2, build() {
  getScene().userData.sun.intensity = 3.0; getScene().userData.hemi.intensity = 0.2; stars(3000);
  const E = earth(2, 0, 0, 0); const moon = new THREE.Mesh(new THREE.SphereGeometry(0.55, 32, 24), M_(0xd8d4c8, { r: 0.9 })); add(moon);
  const pts = []; for (let i = 0; i <= 200; i++) { const a = i / 200 * 6.283, e = 0.108, rr = 9 * (1 - e * e) / (1 + e * Math.cos(a)); pts.push(new THREE.Vector3(Math.cos(a) * rr, 0, Math.sin(a) * rr)); }
  const path = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: 0x8a9ad8 })); add(path);
  on((u, d) => { const a = Math.PI - 0.2 + sm(0.2, d - 0.3, u) * (Math.PI + 0.2), e = 0.108, rr = 9 * (1 - e * e) / (1 + e * Math.cos(a)); moon.position.set(Math.cos(a) * rr, 0, Math.sin(a) * rr); });
  dynLabel((u) => u < 2.2 ? '20% CLOSER' : 'TIDES ×2', 0, 4.2, 0, { w: 6, size: 150, color: '#ffd23a', billboard: true });
}, cam: dolly(P([3, 13, 16], [0, -1, 0], 50), P([2, 11, 14], [0, -1, 0], 50)) });
// H10: coastal cities would flood... twice a day (night, huge moon, the tide rushing up the street)
shot('H10', { scene: { night: true, bloom: 0.45, bloomThreshold: 0.95, exposure: 1.0, env: 0.1, dof: DOF, fog0: 60, fog1: 400 }, build() {
  street({ lit: true, n: 8 }); stars(); getScene().userData.hemi.intensity = 0.8;
  const moon = new THREE.Mesh(new THREE.SphereGeometry(12, 32, 24), new THREE.MeshBasicMaterial({ color: new THREE.Color(1.4, 1.36, 1.2), fog: false })); moon.position.set(-30, 60, -200); add(moon);
  const sea = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), new THREE.MeshStandardMaterial({ color: 0x1e5a8a, roughness: 0.08, metalness: 0.4, transparent: true, opacity: 0.9 })); sea.rotation.x = -Math.PI / 2; add(sea);
  on((u, d) => { sea.position.y = lerp(-0.3, 2.4, sm(0.2, d - 0.4, u)); });
  const A = person(ME, 0, 3, Math.PI, 'shock', { face: 'shock', y: 0 }); A.anim = (Q, u, d) => { Q.root.position.y = Math.max(0, sea.position.y - 1.2); };
  dynLabel(() => 'TWICE A DAY', 0, 5.5, -8, { w: 6, size: 160, color: '#7ad0ff', stroke: '#0a2a5a' });
}, cam: dolly(P([1.5, 2.8, 9], [0, 3, -20], 56), P([1.2, 3.0, 8], [0, 3.4, -20], 56)), fx: (u, d) => ({ fade: sm(d - 0.7, d, u) }) });
