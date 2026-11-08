// "What if pi was exactly 3?" -- Roblox v2 What-if in the viral gravity format. Shots for script_pi.py
import { THREE, shot, person, street, ground, house, tree, room, bed, label, glowTex, stars, add, on, onPost, camLerp, sm, lerp, getScene, shadowAt } from './kit.js';
import { blk, dust, sparkles } from './sets.js';
import { table } from './museum.js';

const ME = { skin: 0xf2c79a, shirt: 0x2fa84f, pants: 0x2f4a8a, hair: { style: 'bowl', color: 0x6b3a1e }, logo: 0xffd23a };
const PP = [
  { skin: 0xf2c79a, shirt: 0xf28c28, pants: 0x2f4a8a, hair: { style: 'spiky', color: 0x2a1a10 }, acc: ['headband'] },
  { skin: 0x8a5a3a, shirt: 0x3fa7d6, pants: 0xc9b38a, hair: { style: 'short', color: 0x1a1210 } },
  { skin: 0xc68a5a, shirt: 0xd23a3a, pants: 0x2a2a35, hair: { style: 'long', color: 0x2a1a10 } },
];
const ENG = { skin: 0xf0d0b0, shirt: 0xf28c28, pants: 0x2a3a6a, hair: { style: 'short', color: 0x3a2414 }, acc: ['glasses'] };
const P = (a, b, fov = 50) => ({ pos: a, tgt: b, fov });
const dolly = (a, b) => (u, d) => camLerp(a, b, u / d);
const CUY = (x, z, yaw, o = {}) => { const d = o.d ?? 3.2, sx = o.side ?? 0.25, hy = (o.y ?? 0) + (o.hy ?? 1.94), fx = Math.sin(yaw), fz = Math.cos(yaw), rx = Math.cos(yaw), rz = -Math.sin(yaw);
  const at = (dd, ss) => P([x + fx * dd + rx * ss, hy - 0.09 * dd / 3.2, z + fz * dd + rz * ss], [x, hy - 0.49 * d / 3.2, z], o.fov ?? 50);
  return dolly(at(d, sx), at(d - (o.push ?? 0.5), sx * 0.5)); };
const M_ = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: o.r ?? 0.55, metalness: o.m ?? 0, emissive: o.em ?? 0, emissiveIntensity: o.ei ?? 1, transparent: !!o.t, opacity: o.op ?? 1 });
const DOF = { aperture: 0.002, maxblur: 0.006 };
const DAY = { bloom: 0.3, bloomThreshold: 1.8, exposure: 0.85, dof: DOF };
const VOID = { night: true, bloom: 0.5, bloomThreshold: 0.9, exposure: 1.0, env: 0.25, dof: DOF };

// a text whose content changes (canvas redrawn)
function dynLabel(textFn, x, y, z, o = {}) {
  const c = document.createElement('canvas'); c.width = 1024; c.height = 512; const g = c.getContext('2d'); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  const m = new THREE.Mesh(new THREE.PlaneGeometry(o.w ?? 4, (o.w ?? 4) / 2), new THREE.MeshBasicMaterial({ map: t, transparent: true, fog: false, depthTest: o.depthTest ?? true })); m.position.set(x, y, z); if (o.yaw) m.rotation.y = o.yaw; if (o.face) m.userData.face = true; add(m);
  let last = null;
  on((u) => { const s = textFn(u); if (s === last) return; last = s; g.clearRect(0, 0, 1024, 512);
    if (o.bg) { g.fillStyle = o.bg; g.beginPath(); g.roundRect(30, 100, 964, 312, 60); g.fill(); }
    g.font = `${o.size ?? 200}px Poppins`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round';
    if (o.stroke !== false) { g.lineWidth = 34; g.strokeStyle = o.stroke ?? '#1a1030'; g.strokeText(s, 512, 266); } g.fillStyle = typeof o.color === 'function' ? o.color(s) : (o.color ?? '#ffffff'); g.fillText(s, 512, 266); t.needsUpdate = true; });
  if (o.billboard) onPost((u, d, cam) => m.quaternion.copy(cam.quaternion));
  return m;
}
// the billboard of the gravity video: a white board on two posts
function billboard(textFn, x, z) {
  blk(0.3, 5.6, 0.3, M_(0x5a5a62), x - 2.6, 2.8, z, { k: 0.1 }); blk(0.3, 5.6, 0.3, M_(0x5a5a62), x + 2.6, 2.8, z, { k: 0.1 });
  blk(6.0, 2.8, 0.25, M_(0xffffff, { r: 0.4 }), x, 5.3, z, { k: 0.04 }); blk(6.2, 3.0, 0.2, M_(0x23356b), x, 5.3, z - 0.15, { k: 0.04 });
  return dynLabel(textFn, x, 5.3, z + 0.14, { w: 5.8, size: 150, color: '#1d1d2a', stroke: false });
}
function hardhat(A) { const h = new THREE.Mesh(new THREE.SphereGeometry(0.78, 24, 12, 0, 6.283, 0, Math.PI / 2), M_(0xf5c820, { r: 0.35 })); h.position.y = 0.55; A.head.add(h); const b = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 0.95, 0.06, 28), h.material); b.position.y = 0.56; A.head.add(b); }
// a big ball with lines drawn on it
const R = 4;
const onBall = (th, ph, r = R + 0.02) => new THREE.Vector3(r * Math.sin(th) * Math.cos(ph), r * Math.cos(th), r * Math.sin(th) * Math.sin(ph));
function ball(x, y, z) { const g = new THREE.Group(); g.position.set(x, y, z); add(g);
  const c = document.createElement('canvas'); c.width = 1024; c.height = 512; const q = c.getContext('2d'); q.fillStyle = '#f2ecdc'; q.fillRect(0, 0, 1024, 512); q.strokeStyle = 'rgba(60,80,120,0.25)'; q.lineWidth = 2;
  for (let i = 0; i <= 16; i++) { q.beginPath(); q.moveTo(i * 64, 0); q.lineTo(i * 64, 512); q.stroke(); } for (let j = 0; j <= 8; j++) { q.beginPath(); q.moveTo(0, j * 64); q.lineTo(1024, j * 64); q.stroke(); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  const m = new THREE.Mesh(new THREE.SphereGeometry(R, 96, 64), new THREE.MeshStandardMaterial({ map: t, roughness: 0.45 })); m.castShadow = true; m.receiveShadow = true; g.add(m); return g; }
// a line drawn along the ball (a tube through points), revealed by k(u) in 0..1
function ballLine(g, pts, color, k, w = 0.07) {
  const curve = new THREE.CatmullRomCurve3(pts); const geo = new THREE.TubeGeometry(curve, 160, w, 8); const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color, roughness: 0.4, emissive: color, emissiveIntensity: 0.25 })); g.add(m);
  const n = geo.index.count; on((u) => { geo.setDrawRange(0, Math.floor(n * Math.max(0, Math.min(1, k(u))) / 6) * 6); }); return m; }
const arc = (a, b, n = 60) => { const out = []; for (let i = 0; i <= n; i++) out.push(new THREE.Vector3().copy(a).lerp(b, i / n).setLength(R + 0.03)); return out; };

// P01: the billboard: pi = 3.14159... -> 3 (on screen from the very first frame)
shot('P01', { scene: DAY, build() {
  street(); billboard((u) => u < 0.95 ? 'π = 3.14159…' : 'π = 3', 0, -7.8);
  [[PP[0], -2.5, -5.2, 0.3], [PP[2], 2.4, -5.4, -0.3], [ME, 0, -5.0, 0]].forEach(([d, x, z, yw]) => { const A = person(d, x, z, yw, 'idle'); A.pitch = -0.25; on((u) => { A.pose = u > 0.95 ? 'shock' : 'idle'; A.setFace(u > 0.95 ? 'shock' : 'smile'); }); });
  sparkles(0, 4, -7.5, { n: 80, R: 3, h: 3, color: 0xffe08a, amount: (u) => Math.max(0, 1 - Math.abs(u - 1.1) / 0.5) });
  shadowAt(0, -6, 10);
}, cam: dolly(P([0.2, 2.2, 3.4], [0, 3.6, -7.8], 58), P([0.1, 2.1, 2.2], [0, 3.7, -7.8], 58)) });
// P02: engineers would finally be happy
shot('P02', { scene: DAY, build() {
  street(); const E = person(ENG, 0, -6, 0, 'cheer', { face: 'smile' }); hardhat(E); const E2 = person({ ...ENG, shirt: 0x3a8ad6, acc: [] }, -2.0, -6.8, 0.4, 'cheer', { face: 'wink' }); hardhat(E2);
  const E3 = person({ ...ENG, skin: 0x8a5a3a, acc: [] }, 2.1, -6.9, -0.4, 'cheer', { face: 'smile' }); hardhat(E3);
  const conf = []; const cols = [0xff4d6d, 0xffd23a, 0x4da8ff, 0x7ad35a]; for (let i = 0; i < 80; i++) { const m = new THREE.Mesh(new THREE.PlaneGeometry(0.08, 0.14), new THREE.MeshBasicMaterial({ color: cols[i % 4], side: THREE.DoubleSide })); add(m); conf.push([m, (i * 0.37) % 1, -4 + (i * 1.7) % 8, -9 + (i * 0.9) % 6]); }
  on((u) => conf.forEach(([m, ph, x, z], i) => { const q = (u * 0.35 + ph) % 1; m.position.set(x + Math.sin(u * 2 + i) * 0.3, 6 - q * 6, z); m.rotation.set(u * 3 + i, u * 2, 0); }));
  dynLabel(() => 'π = 3', 0, 4.2, -7.5, { w: 3.2, size: 220, color: '#ffd23a' });
  shadowAt(0, -6, 10);
}, cam: dolly(P([0.5, 1.8, -1.2], [0, 1.9, -6.5], 52), P([0.3, 1.8, -2.0], [0, 2.0, -6.5], 52)) });
// P03: a 30 cm pizza: 94 cm of crust -> 90 cm
shot('P03', { scene: { interior: true, bloom: 0.3, bloomThreshold: 1.0, exposure: 0.95, env: 0.45, dof: DOF }, build() {
  room({ wall: 0xe8c8a0, floor: '#a87a50', w: 10, d: 8, h: 5, lamp: 18 }); table(0, -1.5, { candle: false }); getScene().children.forEach(() => {});
  const pz = new THREE.Group(); pz.position.set(0, 1.1, -1.5); add(pz);
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.04, 64), M_(0xf0c060, { r: 0.7 })); pz.add(base);
  const sauce = new THREE.Mesh(new THREE.CylinderGeometry(0.44, 0.44, 0.045, 64), M_(0xd8402a, { r: 0.5 })); sauce.position.y = 0.005; pz.add(sauce);
  const cheese = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.05, 64), M_(0xffe08a, { r: 0.45 })); cheese.position.y = 0.01; pz.add(cheese);
  for (let i = 0; i < 9; i++) { const a = i * 2.4, r = 0.12 + (i % 3) * 0.1; const p = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.02, 20), M_(0xa82a1a, { r: 0.5 })); p.position.set(Math.cos(a) * r, 0.04, Math.sin(a) * r); pz.add(p); }
  const crust = new THREE.Mesh(new THREE.TorusGeometry(0.47, 0.045, 12, 96), M_(0xd89a48, { r: 0.7 })); crust.rotation.x = Math.PI / 2; crust.position.y = 0.025; pz.add(crust);
  const tape = new THREE.Mesh(new THREE.TorusGeometry(0.53, 0.012, 6, 128), M_(0xffd23a, { em: 0x8a6a00, ei: 0.5 })); tape.rotation.x = Math.PI / 2; tape.position.y = 0.05; pz.add(tape);
  const dia = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.012, 0.02), M_(0x3a8ad6, { em: 0x1a3a6a, ei: 0.5 })); dia.position.y = 0.08; pz.add(dia);
  on((u) => { tape.geometry.dispose(); tape.geometry = new THREE.TorusGeometry(0.53, 0.012, 6, 128, 6.283 * sm(0.3, 1.4, u)); dia.scale.x = sm(0.0, 0.4, u) + 0.001; });
  dynLabel(() => '30 cm', 0, 1.3, -1.1, { w: 0.5, size: 200, color: '#bfe0ff', billboard: true });
  dynLabel((u) => u < 2.0 ? '94 cm' : '90 cm', 0, 1.72, -1.6, { w: 0.75, size: 220, color: (s) => s === '90 cm' ? '#7ad35a' : '#ffd23a', billboard: true });
  const A = person(ME, 0.2, -3.2, 0, 'idle', { face: 'smile' }); on((u) => A.setFace(u > 2.0 ? 'wink' : 'smile'));
}, cam: dolly(P([0.9, 2.4, 0.6], [0, 1.25, -1.5], 50), P([0.7, 2.3, 0.2], [0, 1.25, -1.5], 50)) });
// P04: on flat ground a circle is always 3.14 x its width
shot('P04', { scene: DAY, build() {
  ground({ road: false }); tree(-6, -12, 1.1, 3); tree(6, -14, 1.2, 5);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(2.0, 0.05, 8, 128), M_(0xffffff, { em: 0x606060, ei: 0.4 })); ring.rotation.x = Math.PI / 2; ring.position.set(0, 0.06, -6); add(ring);
  const d = new THREE.Mesh(new THREE.BoxGeometry(4.0, 0.06, 0.08), M_(0x3a8ad6, { em: 0x1a3a6a, ei: 0.5 })); d.position.set(0, 0.07, -6); add(d);
  const A = person(ME, 2.8, -4.8, -0.5, 'think', { face: 'confused' });
  dynLabel((u) => u < 2.2 ? 'C = 3.14 × d' : 'C ≠ 3 × d', 0, 2.6, -6.5, { w: 5, size: 180, color: (s) => s.includes('≠') ? '#ff5a4a' : '#ffffff' });
  shadowAt(0, -6, 8);
}, cam: dolly(P([0.4, 4.6, 1.6], [0, 0.4, -6.3], 52), P([0.3, 4.2, 0.6], [0, 0.5, -6.3], 52)) });
// P05: for pi to be 3, space has to bend -- like circles on a ball (the 30-degree circle has C/d = 3 exactly)
shot('P05', { scene: { bloom: 0.3, bloomThreshold: 1.6, exposure: 0.9, env: 0.4, sky: ['#7ab8f0', '#e8f4ff'], dof: DOF }, build() {
  ground({ road: false }); const g = ball(0, R, -8);
  const th = Math.PI / 6; const circ = []; for (let i = 0; i <= 120; i++) circ.push(onBall(th, i / 120 * 6.283));
  ballLine(g, circ, 0xffffff, (u) => sm(0.2, 1.6, u));
  ballLine(g, arc(onBall(th, Math.PI / 2), onBall(0, 0, R)).concat(arc(onBall(0, 0, R), onBall(th, -Math.PI / 2)).slice(1)), 0x3a8ad6, (u) => sm(1.2, 2.2, u));
  const A = person(ME, 0, 0, 0, 'shock', { face: 'shock', y: 2 * R - 0.02 }); A.root.position.set(0, 2 * R - 0.03, -8); A.root.scale.multiplyScalar(0.35);
  dynLabel((u) => u < 2.6 ? 'C ÷ d = 3' : 'π = 3 ✓', 0, 2 * R + 1.6, -8, { w: 4.5, size: 190, color: '#7ad35a', billboard: true });
  shadowAt(0, -8, 10);
}, cam: (u, d) => { const a = -0.5 + u * 0.12; return { pos: [Math.sin(a) * 10.5, 9.5, -8 + Math.cos(a) * 10.5], tgt: [0, 5.6, -8], fov: 52 }; }, focus: () => 11 });
// P06: triangles with more than 180 degrees; "parallel" lines crashing at the pole
shot('P06', { scene: { bloom: 0.3, bloomThreshold: 1.6, exposure: 0.9, env: 0.4, sky: ['#7ab8f0', '#e8f4ff'], dof: DOF }, build() {
  ground({ road: false }); const g = ball(0, R, -8);
  const N = onBall(0, 0, R), A1 = onBall(Math.PI / 2, Math.PI / 2 - 0.0, R), A2 = onBall(Math.PI / 2, 0, R);
  const eq = []; for (let i = 0; i <= 40; i++) eq.push(onBall(Math.PI / 2, Math.PI / 2 * (1 - i / 40)));
  ballLine(g, arc(A1, N), 0xff4a4a, (u) => sm(0.1, 1.0, u), 0.08); ballLine(g, arc(A2, N), 0xff4a4a, (u) => sm(0.1, 1.0, u), 0.08); ballLine(g, eq, 0xffd23a, (u) => sm(1.0, 1.7, u), 0.08);
  const pole = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex(), color: 0xff8a4a, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false })); pole.position.set(0, 2 * R + 0.05, -8); add(pole); on((u) => { pole.scale.setScalar(2.5 * Math.max(0, Math.sin(Math.PI * sm(0.8, 1.6, u)))); });
  dynLabel((u) => u < 2.0 ? '90°+90°+90°' : '= 270°', 0, 2 * R + 0.9, -8, { w: 4, size: 125, color: '#ffd23a', billboard: true });
  shadowAt(0, -8, 10);
}, cam: (u, d) => { const a = 0.75 + u * 0.06; return { pos: [Math.sin(a) * 9.5, 9.0, -8 + Math.cos(a) * 9.5], tgt: [0, 6.0, -8], fov: 56 }; }, focus: () => 11 });
// P07: the whole universe would curl up in less than two metres (space bends around the town)
shot('P07', { scene: DAY, build() {
  street({ n: 8 }); const A = person(ME, 0, -5.5, 0, 'idle', { face: 'confused' }); on((u) => { A.setFace(u > 2.4 ? 'shock' : 'confused'); A.pose = u > 2.4 ? 'shock' : 'idle'; });
  dynLabel(() => 'UNIVERSE < 2 m', 0, 3.5, -6.5, { w: 3.3, size: 118, color: '#ffffff', stroke: '#c8281a' });
  shadowAt(0, -6, 10);
}, cam: dolly(P([0.3, 2.0, 0.2], [0, 2.4, -6.5], 64), P([0.2, 1.9, -1.4], [0, 2.4, -6.5], 64)), fx: (u, d) => ({ bulge: 0.4 * sm(0.4, d, u) }) });
// P08-P09: a 1.1 m universe: straight ahead, the back of your own head, again and again
function selves(o = {}) {
  const S = getScene(); S.background = new THREE.Color(0x07070f); S.fog = new THREE.Fog(0x07070f, 3, 16); S.userData.hemi.intensity = 0.45; S.userData.sun.intensity = 0.0;
  const gc = document.createElement('canvas'); gc.width = gc.height = 256; const q = gc.getContext('2d'); q.fillStyle = '#12121c'; q.fillRect(0, 0, 256, 256); q.strokeStyle = '#3a4aa8'; q.lineWidth = 3; q.strokeRect(0, 0, 256, 256);
  const gt = new THREE.CanvasTexture(gc); gt.wrapS = gt.wrapT = THREE.RepeatWrapping; gt.repeat.set(20, 60); gt.colorSpace = THREE.SRGBColorSpace;
  const fl = new THREE.Mesh(new THREE.PlaneGeometry(20, 60), new THREE.MeshStandardMaterial({ map: gt, roughness: 0.3, emissive: 0x2a3a9a, emissiveMap: gt, emissiveIntensity: 0.5 })); fl.rotation.x = -Math.PI / 2; fl.position.z = -20; fl.receiveShadow = true; add(fl);
  const gap = o.gap ?? 1.8, list = [];
  for (let k = o.from ?? 0; k < 14; k++) { const A = person(ME, 0, -k * gap, Math.PI, o.pose ?? 'idle', { face: 'shock' }); A.phase = 0; list.push(A); }
  const L = new THREE.PointLight(0xbfd0ff, 30, 30, 1.2); L.position.set(1.5, 4, 2); add(L);
  for (let k = 0; k < 6; k++) { const l = new THREE.PointLight(0x8a9aff, 6, 8, 1.5); l.position.set(1.2, 3, -k * gap * 2.5); add(l); }
  return list;
}
shot('P08', { scene: VOID, build() { const list = selves({ from: 1 }); on((u) => list.forEach((A) => { A.look = Math.sin(u * 1.6) * 0.35 * sm(0.6, 1.2, u); })); },
  cam: dolly(P([0.1, 2.35, 0.6], [0, 1.2, -12], 62), P([0.05, 2.3, 0.0], [0, 1.2, -12], 62)), focus: () => 2.2 });
shot('P09', { scene: VOID, build() { const list = selves({ gap: 1.15 }); on((u) => list.forEach((A, k) => { const st = sm(0.2, 0.9, u) * 0.4 - Math.max(0, Math.sin(Math.PI * sm(0.9, 1.3, u))) * 0.12; A.root.position.z = -k * 1.15 - st; A.pose = u < 0.9 ? 'walk' : 'point'; A.setFace('shock'); })); },
  cam: (u, d) => ({ ...camLerp(P([4.6, 1.8, -2.6], [0, 1.4, -3.8], 46), P([4.3, 1.8, -2.8], [0, 1.4, -3.8], 46), u / d), shake: 0.05 * Math.max(0, 1 - Math.abs(u - 1.05) / 0.25) }), focus: () => 4.8 });
// P10: the entire universe, smaller than your bedroom (a tiny glowing world floating over the bed)
shot('P10', { scene: { interior: true, bloom: 0.7, bloomThreshold: 0.8, exposure: 0.9, env: 0.2, dof: DOF }, build() {
  room({ wall: 0x3a4a8a, floor: '#6a4a30', w: 9, d: 8, h: 5, lamp: 3 }); const b = bed(-1.8, -1.8); b.scale.setScalar(0.45); getScene().userData.hemi.intensity = 0.25;
  const win = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 1.5), new THREE.MeshBasicMaterial({ color: 0x1a2350 })); win.position.set(1.4, 2.6, -3.84); add(win);
  const U = new THREE.Group(); U.position.set(0.4, 1.7, -1.6); add(U);
  const shell = new THREE.Mesh(new THREE.SphereGeometry(0.29, 48, 32), new THREE.MeshPhysicalMaterial({ color: 0x9ab8ff, transparent: true, opacity: 0.25, roughness: 0.05, emissive: 0x3a5aff, emissiveIntensity: 0.6 })); U.add(shell);
  const tiny = person(ME, 0, 0, 0, 'idle', { face: 'shock' }); tiny.root.scale.setScalar(0.42 * 0.08); U.add(tiny.root); tiny.root.position.set(0, -0.1, 0);
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex(), color: 0x6a8aff, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, depthWrite: false })); halo.scale.setScalar(1.4); U.add(halo);
  const L = new THREE.PointLight(0x8aa0ff, 4, 6, 1.5); U.add(L);
  const n = 160, pos = new Float32Array(n * 3), pg = new THREE.BufferGeometry(); pg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const st = new THREE.Points(pg, new THREE.PointsMaterial({ size: 0.012, color: 0xffffff })); U.add(st);
  on((u) => { U.position.y = 1.7 + Math.sin(u * 1.4) * 0.04; U.rotation.y = u * 0.3; for (let i = 0; i < n; i++) { const a = i * 2.39996, y = 1 - 2 * (i + 0.5) / n, r = Math.sqrt(1 - y * y) * 0.25; pos.set([Math.cos(a + u * 0.2) * r, y * 0.25, Math.sin(a + u * 0.2) * r], i * 3); } pg.attributes.position.needsUpdate = true; });
}, cam: dolly(P([1.8, 2.0, 1.6], [0.4, 1.65, -1.6], 46), P([0.9, 1.8, -0.2], [0.4, 1.7, -1.6], 40)), focus: (u, d) => lerp(3.8, 1.5, u / d), fx: (u, d) => ({ fade: sm(d - 0.7, d, u) }) });
