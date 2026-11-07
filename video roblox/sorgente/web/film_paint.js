// "In this town, you can enter any painting in the museum." -- Roblox v2, ~90 s. Shots for script_paint.py
import { THREE, shot, person, add, on, onPost, toScreen, camLerp, sm, lerp, getScene, glowTex } from './kit.js';
import { sparkles, dust, blk } from './sets.js';
import { museum, paintPos, clock, chair, guardCap, fishingHat, lantern, paintHand, seaWorld, cafeWorld, table, lakeWorld, boat, stormWorld } from './museum.js';

const ME = { skin: 0xf2c79a, shirt: 0xc8382a, pants: 0x2a2a3a, hair: { style: 'bowl', color: 0x4a2a14 }, logo: 0xf5e6c8 };
const GP = { skin: 0xf0d0b0, shirt: 0x1f2a4a, pants: 0x1a2038, hair: { style: 'white', color: 0xeeeeee }, acc: ['glasses'] };
const OLDM = { skin: 0xf0d0b0, shirt: 0x6a5a3a, pants: 0x3a3a30, hair: { style: 'white', color: 0xe8e8e8 } };
const V = [
  { skin: 0xf2c79a, shirt: 0xe86a9a, pants: 0x3a3a55, hair: { style: 'long', color: 0x2a1a10 } },
  { skin: 0xc68a5a, shirt: 0x3aa655, pants: 0x2a2a3a, hair: { style: 'short', color: 0x1a1210 } },
  { skin: 0xf0d0b0, shirt: 0xf5c84a, pants: 0x4a3a2a, hair: { style: 'bun', color: 0x8a5a2a } },
  { skin: 0x8a5a3a, shirt: 0x5a3aa8, pants: 0x1a1a24, hair: { style: 'short', color: 0x0a0a0a }, acc: ['glasses'] },
  { skin: 0xf2c79a, shirt: 0x2f6fd6, pants: 0x2a2a3a, hair: { style: 'spiky', color: 0xd8a040 }, scale: 0.65 },
  { skin: 0xf0d0b0, shirt: 0x8a2a2a, pants: 0x2a2a30, hair: { style: 'white', color: 0xdddddd }, acc: ['tie'] },
];
const P = (a, b, fov = 50) => ({ pos: a, tgt: b, fov });
const dolly = (a, b) => (u, d) => camLerp(a, b, u / d);
// close-up of an avatar facing yaw: camera in front of the face, head in the top third
const CUY = (x, z, yaw, o = {}) => { const d = o.d ?? 3.2, sx = o.side ?? 0.25, hy = (o.y ?? 0) + (o.hy ?? 1.94), fx = Math.sin(yaw), fz = Math.cos(yaw), rx = Math.cos(yaw), rz = -Math.sin(yaw);
  const at = (dd, ss) => P([x + fx * dd + rx * ss, hy - 0.09 * dd / 3.2, z + fz * dd + rz * ss], [x, hy - 0.49 * d / 3.2, z], o.fov ?? 50);
  return dolly(at(d, sx), at(d - (o.push ?? 0.5), sx * 0.5)); };
const DOF = { aperture: 0.0022, maxblur: 0.006 };
const DAY = { interior: true, bloom: 0.32, bloomThreshold: 0.95, exposure: 0.88, env: 0.45, dof: DOF };
const EVE = { interior: true, bloom: 0.45, bloomThreshold: 0.85, exposure: 1.0, env: 0.35, dof: DOF };
const NGT = { night: true, interior: true, bloom: 0.55, bloomThreshold: 0.8, exposure: 1.05, env: 0.12, dof: DOF };
const STORM = { night: true, bloom: 0.5, bloomThreshold: 0.9, exposure: 1.15, env: 0.2, dof: { aperture: 0.0015, maxblur: 0.005 } };
const PAINT = (extra) => (u, d) => ({ paint: 1, ...(extra ? extra(u, d) : {}) });
const LH = paintPos('lighthouse'), SEA = paintPos('sea');

// someone touches a painting and is pulled in: shrinks into the canvas, sparkles, a ripple, a glow
function enter(A, f, pp, t0, o = {}) {
  const from = A.root.position.clone(), s0 = A.root.scale.x, to = new THREE.Vector3(pp.x - pp.side * 0.05, pp.y, pp.z + (o.dz ?? 0));
  sparkles(to.x - pp.side * 0.3, pp.y - 1.2, to.z, { n: 120, R: 0.9, h: 2.4, color: 0xffe2a0, amount: (u) => sm(t0 - 0.4, t0, u) * (1 - sm(t0 + 1.2, t0 + 2.0, u)) });
  f.canvasMat.emissiveMap = f.canvasMat.map; f.canvasMat.needsUpdate = true;
  on((u) => { const k = sm(t0, t0 + 0.7, u); A.root.position.lerpVectors(from, to, k * k); A.root.scale.setScalar(s0 * (1 - k * 0.97)); A.root.visible = k < 0.99; f.canvasMat.emissiveIntensity = 0.55 * Math.max(0, Math.sin(Math.PI * sm(t0 - 0.5, t0 + 1.4, u))); });
  return (u) => { const [x, y] = toScreen(pp.x, pp.y, pp.z); const a = Math.max(0, Math.sin(Math.PI * sm(t0 - 0.4, t0 + 1.6, u))); return { ripple: { x, y, a: a * (o.ra ?? 1) }, flash: 0.45 * Math.max(0, 1 - Math.abs(u - t0 - 0.6) / 0.25) }; };
}
// a few visitors looking at the paintings
function visitors(list) { return list.map(([i, x, z, yaw, pose = 'idle', anim]) => { const A = person(V[i], x, z, yaw, pose); if (anim) A.anim = anim; return A; }); }

// M01: the museum, wide, a slow push down the hall
shot('M01', { scene: DAY, build() {
  museum({ lit: ['lighthouse', 'sea', 'cafe'] });
  visitors([[0, -5.6, -8, -Math.PI / 2], [1, -5.2, -14.3, -Math.PI / 2 + 0.2], [2, 5.6, -2.3, Math.PI / 2], [3, 5.1, -14, Math.PI / 2 - 0.2, 'think'], [4, -1.5, -20, Math.PI, 'walk', (Q, u) => { Q.root.position.z = -18 - u * 1.6; }], [5, 2.2, -26, Math.PI / 2 + 0.4]]);
}, cam: dolly(P([0, 2.6, 4.5], [0, 2.8, -40], 52), P([0.3, 2.3, 1.0], [0, 2.8, -40], 52)), focus: () => 16 });
// M02: she touches the frame... and is pulled in
shot('M02', { scene: DAY, build() {
  const PS = museum({ lit: ['sea', 'lighthouse'] }); const A = person(V[0], -6.4, -8.2, -Math.PI / 2, 'idle'); A.pitch = -0.15;
  on((u) => { A.pose = u > 0.35 ? 'point' : 'idle'; });
  this.fxf = enter(A, PS.sea, SEA, 0.75);
}, cam: dolly(P([-3.2, 2.5, -4.2], [-7.4, 2.9, -8.4], 46), P([-3.6, 2.6, -5.0], [-7.4, 3.0, -8.4], 46)), fx(u) { return this.fxf(u); } });
// M03: kids swimming in an old seascape
shot('M03', { scene: { bloom: 0.25, bloomThreshold: 1.8, exposure: 0.9, dof: DOF }, build() {
  const sea = seaWorld(); const KS = [];
  [[V[4], -1.6, -3.5, 0.3], [{ ...V[1], scale: 0.62 }, 0.4, -5.0, -0.2], [{ ...V[2], scale: 0.62 }, 2.2, -3.0, -0.5], [{ ...V[0], scale: 0.6 }, -3.6, -6.5, 0.4], [{ ...V[3], scale: 0.62 }, 3.8, -7.5, -0.3]].forEach(([d, x, z, yaw], i) => {
    const K = person(d, x, z, yaw, i % 2 ? 'cheer' : 'wave', { face: 'smile' }); KS.push(K);
    K.anim = (Q, u) => { Q.root.position.y = sea.userData.h(x, z, u) - 0.62 + Math.sin(u * 3 + i) * 0.05; };
  });
  const sp = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.75, depthWrite: false }); const drops = [];
  for (let i = 0; i < 40; i++) { const m = new THREE.Mesh(new THREE.SphereGeometry(0.05, 6, 5), sp); add(m); drops.push([m, i]); }
  on((u) => drops.forEach(([m, i]) => { const K = KS[i % KS.length], q = (u * 1.4 + i * 0.13) % 1; m.position.set(K.root.position.x + Math.sin(i * 2.3) * 0.5 * q, K.root.position.y + 0.9 + 1.4 * q - 2.6 * q * q, K.root.position.z + Math.cos(i * 1.7) * 0.4 * q); }));
}, cam: dolly(P([0.5, 0.9, 3.4], [0, 0.6, -5], 52), P([0.2, 0.75, 2.4], [0, 0.6, -5], 52)), fx: PAINT() });
// M04: couples having dinner in a cafe that closed a hundred years ago
shot('M04', { scene: { night: true, bloom: 0.5, bloomThreshold: 0.9, exposure: 0.85, env: 0.15, dof: DOF }, build() {
  const C = cafeWorld(); const cp = [[V[1], V[0]], [V[3], V[2]], [V[5], { ...V[0], shirt: 0x2a8a8a }]];
  C.tables.forEach(([x, z], i) => { table(x, z, { wine: true }); for (const s of [-1, 1]) { chair(x + s * 0.95, z, s * -Math.PI / 2, 0.55); const A = person(cp[i][s < 0 ? 0 : 1], x + s * 0.95, z, -s * Math.PI / 2, 'sit', { face: s < 0 ? 'smile' : 'wink' }); A.root.position.y = 0.06; A.pitch = 0.05; } });
  dust(160, -4, 2.5, -3, 12, 3, 5, { color: 0xffd890, size: 0.05, seed: 12 });
}, cam: dolly(P([2.6, 1.6, 4.2], [-4.6, 2.2, -3.2], 50), P([1.2, 1.5, 3.2], [-4.8, 2.2, -3.2], 50)), fx: PAINT() });
// M04b: old men fishing on a lake that dried up centuries ago
function fishRod(A, tip) {
  const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.02, 1, 6), new THREE.MeshStandardMaterial({ color: 0x3a2414 })); add(rod);
  const line = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 1, 4), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.6 })); add(line);
  const bob = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 6), new THREE.MeshStandardMaterial({ color: 0xd82a2a })); add(bob);
  const h = new THREE.Vector3(), T = new THREE.Vector3(...tip), Y = new THREE.Vector3(0, 1, 0), seg = (m, a, b) => { m.position.copy(a).add(b).multiplyScalar(0.5); m.scale.set(1, a.distanceTo(b), 1); m.quaternion.setFromUnitVectors(Y, b.clone().sub(a).normalize()); };
  onPost((u) => { A.armR.updateWorldMatrix(true, false); h.set(0, -1.8, 0.3); A.armR.localToWorld(h); const t2 = T.clone(); t2.y += Math.sin(u * 2) * 0.05; seg(rod, h, t2); const w = new THREE.Vector3(t2.x + 0.2, 0.02 + Math.sin(u * 1.7) * 0.02, t2.z); seg(line, t2, w); bob.position.copy(w); });
}
shot('M04b', { scene: { bloom: 0.4, bloomThreshold: 1.3, exposure: 0.9, env: 0.25, dof: DOF }, build() {
  lakeWorld();
  const b1 = boat(-1.0, -6, 0.5); const A = person(OLDM, -1.0, -6, 1.4, 'sit'); A.root.position.y = 0.1; fishingHat(A); fishRod(A, [1.4, 2.6, -7.5]);
  on((u) => { A.root.position.y = 0.1 + Math.sin(u * 1.3 - 1) * 0.04; A.pose = 'sit'; });
  A.anim = (Q) => { Q.pose = 'sit'; };
  const b2 = boat(5.5, -16, -0.6); const B = person({ ...OLDM, shirt: 0x3a4a6a }, 5.5, -16, -1.2, 'sit'); B.root.position.y = 0.1; fishingHat(B, 0x5a5a40); fishRod(B, [3.0, 2.5, -18]);
  dust(120, 0, 2, -8, 14, 3, 10, { color: 0xffc890, size: 0.05, seed: 14 });
}, cam: dolly(P([2.8, 1.3, 1.6], [-1.0, 1.9, -6.5], 46), P([2.0, 1.2, 0.4], [-1.0, 1.9, -6.5], 46)), fx: PAINT() });
// M05: one rule: be out before six. The clock, then everyone walking out
shot('M05', { scene: EVE, build() { museum({ evening: true, time: (u) => 17 * 60 + 52 + u * 0.4 }); }, cam: dolly(P([0.4, 7.4, -35.0], [0, 7.5, -39.6], 32), P([0.2, 7.5, -36.2], [0, 7.55, -39.6], 32)) });
shot('M05', { off: 1.85, scene: EVE, build() {
  museum({ evening: true, time: () => 17 * 60 + 53 });
  visitors([[0, -3.2, -18, 0, 'walk', (Q, u) => { Q.root.position.z = -18 + u * 1.7; }], [1, 3.0, -20, 0, 'walk', (Q, u) => { Q.root.position.z = -20 + u * 1.9; }], [2, -4.0, -24, 0.1, 'walk', (Q, u) => { Q.root.position.z = -24 + u * 1.6; }], [4, 2.8, -16.5, 0, 'run', (Q, u) => { Q.root.position.z = -16.5 + u * 3.0; }], [5, 3.8, -26, -0.05, 'walk', (Q, u) => { Q.root.position.z = -26 + u * 1.5; }], [3, -2.4, -21, 0.05, 'walk', (Q, u) => { Q.root.position.z = -21 + u * 1.8; }]]);
}, cam: dolly(P([0.4, 2.0, -12.0], [0, 2.0, -28], 50), P([0.3, 2.0, -12.8], [0, 2.0, -28], 50)), focus: () => 7 });
// M06: or you stay in the painting... forever
shot('M06', { scene: { ...EVE, bloom: 0.3, exposure: 0.92 }, build() { museum({ evening: true, lit: ['trapped'] }); }, cam: dolly(P([3.4, 3.2, -19.2], [7.9, 3.4, -20], 44), P([5.6, 3.35, -19.8], [7.9, 3.4, -20], 44)), fx: (u, d) => ({ fade: 0.25 * sm(0, d, u) }) });
// M07: Grandpa, the night guard, forty years
function grandpa(x, z, yaw, pose = 'idle', o = {}) { const A = person(GP, x, z, yaw, pose, o); guardCap(A); return A; }
shot('M07', { scene: NGT, build() {
  museum({ night: true }); const A = grandpa(0.6, -20, 0, 'walk'); A.anim = (Q, u) => { Q.root.position.z = -20 + u * 0.9; Q.root.position.x = 0.6; };
  flashlightFrom(A, (u) => [0.6 + Math.sin(u * 0.8) * 2.5, 0.2, -12 + u * 0.9]);
}, cam: dolly(P([1.8, 1.9, -13.2], [0.4, 1.6, -20], 48), P([1.5, 1.85, -14.2], [0.5, 1.65, -20], 48)) });
// the flashlight in a guard's right hand (a spot light, a soft cone)
function flashlightFrom(A, toFn, o = {}) {
  const sp = new THREE.SpotLight(0xfff2d0, o.power ?? 50, 22, 0.3, 0.45, 1.2); add(sp); add(sp.target);
  const cone = new THREE.Mesh(new THREE.ConeGeometry(1.0, 7, 24, 1, true), new THREE.MeshBasicMaterial({ color: 0xfff0c0, transparent: true, opacity: o.cone ?? 0.06, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })); cone.geometry.translate(0, -3.5, 0); add(cone);
  const torch = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.045, 0.28, 10), new THREE.MeshStandardMaterial({ color: 0x1a1a1a, metalness: 0.7, roughness: 0.3 })); add(torch);
  const h = new THREE.Vector3(), dir = new THREE.Vector3(), down = new THREE.Vector3(0, -1, 0), Y = new THREE.Vector3(0, 1, 0);
  onPost((u) => { A.armR.rotation.x = o.armX ?? -1.2; A.armR.updateWorldMatrix(true, false); h.set(0, -1.75, 0.2); A.armR.localToWorld(h); const b = toFn(u); sp.position.copy(h); sp.target.position.set(...b); cone.position.copy(h);
    dir.set(b[0] - h.x, b[1] - h.y, b[2] - h.z).normalize(); cone.quaternion.setFromUnitVectors(down, dir); torch.position.copy(h); torch.quaternion.setFromUnitVectors(Y, dir); });
  return sp;
}
// M08: the painting in the last room wasn't painted. It was locked.
shot('M08', { scene: NGT, build() { museum({ night: true, chair: false }); }, cam: dolly(P([0.4, 2.3, -24], [0, 3.2, -54], 46), P([0.2, 2.5, -41.5], [0, 3.3, -54], 46)), focus: (u, d) => lerp(30, 12.5, u / d) });
// M09: under a red curtain since before I was born
shot('M09', { scene: NGT, build() { museum({ night: true, curtain: (u) => ({ amp: 0.12 }) }); }, cam: dolly(P([1.6, 2.6, -47.6], [0, 3.3, -53.4], 46), P([0.8, 2.9, -49.0], [0, 3.35, -53.4], 46)) });
// M09b: every night he sat in front of it with his flashlight
shot('M09b', { scene: NGT, build() {
  museum({ night: true }); const A = grandpa(0, -48.8, Math.PI, 'sit'); A.root.position.y = 0.1; flashlightFrom(A, () => [0.1, 3.0, -53.4], { power: 40, cone: 0.05 });
  A.anim = (Q) => { Q.pose = 'sit'; };
}, cam: dolly(P([1.9, 2.4, -44.4], [0, 2.4, -53.4], 46), P([1.6, 2.35, -45.4], [0, 2.4, -53.4], 46)) });
shot('M09b', { off: 2.5, scene: NGT, build() {
  museum({ night: true }); const A = grandpa(0, -48.8, Math.PI, 'sit', { face: 'smug' }); A.root.position.y = 0.1; flashlightFrom(A, () => [0.1, 3.0, -53.4], { power: 40, cone: 0.05 });
  A.anim = (Q) => { Q.pose = 'sit'; Q.armR.rotation.x = -1.2; };
  const fill = new THREE.PointLight(0xc8d4ff, 2.2, 6, 1.5); fill.position.set(0.3, 1.8, -50.8); add(fill);
}, cam: CUY(0, -48.8, Math.PI, { hy: 1.94 - 0.38 + 0.1, d: 2.6, push: 0.35, side: 0.3 }) });
// M10: last month, Grandpa disappeared (his chair, his cap, his flashlight on the floor)
shot('M10', { scene: NGT, build() {
  museum({ night: true });
  const cap = new THREE.Group(); const c = new THREE.Mesh(new THREE.CylinderGeometry(0.31, 0.29, 0.13, 28), new THREE.MeshStandardMaterial({ color: 0x18203a, roughness: 0.5 })); cap.add(c);
  const v = new THREE.Mesh(new THREE.CylinderGeometry(0.21, 0.21, 0.02, 20, 1, false, -1.2, 2.4), new THREE.MeshStandardMaterial({ color: 0x0a0a10, roughness: 0.2 })); v.position.set(0, -0.06, 0.15); v.scale.z = 1.2; cap.add(v);
  cap.position.set(0.05, 0.6, -48.8); cap.rotation.set(0.05, 2.6, 0.08); add(cap);
  const torch = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.045, 0.28, 10), new THREE.MeshStandardMaterial({ color: 0x1a1a1a, metalness: 0.7, roughness: 0.3 })); torch.rotation.z = Math.PI / 2; torch.rotation.y = 0.4; torch.position.set(0.9, 0.05, -47.6); add(torch);
  const sp = new THREE.SpotLight(0xfff2d0, 30, 10, 0.32, 0.5, 1.2); sp.position.set(0.95, 0.06, -47.6); sp.target.position.set(4, 0, -49.5); add(sp); add(sp.target);
  dust(120, 0.5, 1.2, -48.5, 4, 2.5, 3, { color: 0xc8d8ff, size: 0.04, opacity: 0.5, seed: 31 });
}, cam: dolly(P([-2.0, 1.6, -44.2], [0.2, 0.7, -48.6], 46), P([-1.2, 1.4, -45.4], [0.2, 0.65, -48.6], 46)) });
// M11: but yesterday... I saw him
shot('M11', { scene: DAY, build() { museum({ lit: ['lighthouse'] }); const A = person(ME, 4.6, -8.6, Math.PI / 2 - 0.25, 'idle', { face: 'shock' }); on((u) => { A.look = 0.15 * sm(0, 0.6, u); }); }, cam: CUY(4.6, -8.6, Math.PI / 2 - 0.25, { d: 2.9, side: 0.35, push: 0.5 }) });
// M12: the stormy lighthouse painting; in the corner, a tiny man with a lantern, waving
function tinyMan(pp) {
  const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d'); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  const m = new THREE.Mesh(new THREE.PlaneGeometry(0.16, 0.16), new THREE.MeshStandardMaterial({ map: t, transparent: true, roughness: 0.6, emissive: 0xffffff, emissiveMap: t, emissiveIntensity: 0.25 })); m.rotation.y = -Math.PI / 2;
  const lx = pp.z + (0.72 - 0.5) * pp.w - 0.13, ly = pp.y + (0.5 - 0.315) * pp.h + 0.07; m.position.set(pp.x - 0.012, ly, lx); add(m);
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex(), color: 0xffc060, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, depthWrite: false })); glow.scale.setScalar(0.12); add(glow);
  const L = new THREE.PointLight(0xffb050, 0.25, 0.8, 2); L.position.set(pp.x - 0.2, ly, lx); add(L);
  on((u) => { g.clearRect(0, 0, 256, 256); const a = -0.6 + Math.sin(u * 7) * 0.5;
    g.fillStyle = '#1a2038'; g.fillRect(104, 150, 22, 70); g.fillRect(130, 150, 22, 70); g.fillStyle = '#2a3658'; g.fillRect(98, 92, 60, 62);
    g.save(); g.translate(158, 98); g.rotate(-2.4 + a); g.fillRect(-10, 0, 20, 58); g.fillStyle = '#f0d0b0'; g.fillRect(-9, 54, 18, 14); g.restore();
    g.fillStyle = '#2a3658'; g.fillRect(76, 98, 20, 50); g.fillStyle = '#ffd070'; g.fillRect(70, 148, 26, 30); g.fillStyle = '#2a2a2a'; g.fillRect(68, 142, 30, 6);
    g.fillStyle = '#f0d0b0'; g.beginPath(); g.ellipse(128, 70, 22, 25, 0, 0, 6.283); g.fill(); g.fillStyle = '#eeeeee'; g.fillRect(106, 46, 44, 10); g.fillStyle = '#18203a'; g.fillRect(104, 38, 48, 12);
    t.needsUpdate = true; glow.position.set(pp.x - 0.03, ly - 0.035, lx - 0.04); glow.material.opacity = 0.7 + 0.3 * Math.sin(u * 19) * Math.sin(u * 5); });
  return { y: ly, z: lx };
}
shot('M12', { scene: DAY, build() { museum({ lit: ['lighthouse'] }); this.tm = tinyMan(LH); }, cam(u, d) { const z = LH.z + (0.72 - 0.5) * LH.w - 0.13, y = LH.y + (0.5 - 0.315) * LH.h + 0.07;
  const a = P([3.2, 3.1, LH.z], [7.9, 3.05, LH.z], 44), b = P([6.75, y, z], [7.92, y, z], 30); const k = sm(0.8, d - 0.3, u); return camLerp(a, b, k); }, focus(u, d) { return lerp(4.7, 1.17, sm(0.8, d - 0.3, u)); } });
// M13: today, at five forty-five, I touched the frame
shot('M13', { scene: EVE, build() { museum({ evening: true, time: (u) => 17 * 60 + 45 + u * 0.05 }); }, cam: dolly(P([0.6, 7.4, -34.4], [0, 7.5, -39.6], 30), P([0.3, 7.5, -35.0], [0, 7.55, -39.6], 30)) });
shot('M13', { off: 1.35, scene: EVE, build() { museum({ evening: true, lit: ['lighthouse'] }); const A = person(ME, 7.0, -8.4, Math.PI / 2, 'idle'); on((u) => { A.pose = u > 0.5 ? 'point' : 'idle'; A.pitch = -0.1; }); }, cam: dolly(P([3.4, 2.4, -11.4], [7.6, 2.4, -8.0], 46), P([3.8, 2.4, -11.0], [7.6, 2.45, -8.0], 46)) });
// M13b: the canvas felt like warm water
shot('M13b', { scene: EVE, build() { const PS = museum({ evening: true, lit: ['lighthouse'] }); const A = person(ME, 7.0, -8.3, Math.PI / 2, 'point'); this.fxf = enter(A, PS.lighthouse, { ...LH, y: 2.3, z: -8.3 }, 1.3, { ra: 1.2 }); }, cam: dolly(P([4.5, 2.6, -11.0], [7.8, 2.3, -8.3], 44), P([5.0, 2.55, -10.6], [7.8, 2.3, -8.3], 44)), fx(u) { const f = this.fxf(u); f.flash = Math.max(f.flash, sm(1.75, 2.1, u)); return f; } });
// M14: rain, thunder, waves as tall as houses
shot('M14', { scene: STORM, build() { const W_ = stormWorld({ amp: 2.2, flashes: [0.7, 2.1], rainAt: [12, 3, -2] }); const A = person(ME, 3.2, -5.2, Math.PI + 0.4, 'idle', { face: 'shock' }); A.root.position.y = 1.15; this.S = getScene(); },
  cam: dolly(P([16, 5.5, 4], [0, 4, -20], 56), P([14, 4.8, 2], [0, 5, -20], 56)), fx(u) { return { paint: 1, flash: 0.25 * (this.S.userData.flash || 0) }; }, focus: () => 14 });
// M15: and at the top of the lighthouse... Grandpa
function gpTop(o = {}) { const A = grandpa(o.x ?? 0.5, o.z ?? -18.05, o.yaw ?? 0.1, o.pose ?? 'idle', { face: o.face ?? 'shock', y: 16.3 }); lantern(A, { power: 5 }); onPost((u) => { if (A.pose === 'idle') A.armR.rotation.x = -0.35 + Math.sin(u * 2) * 0.05; }); return A; }
shot('M15', { scene: STORM, build() { stormWorld({ flashes: [1.7], rainAt: [1, 8, -8] }); gpTop(); this.S = getScene(); },
  cam(u, d) { const k = sm(0.1, d - 0.2, u); return { pos: [2.4, lerp(3, 6, k), -4.5], tgt: [0.3, lerp(5, 16.8, k), -18], fov: lerp(52, 40, k) }; }, fx(u) { return { paint: 1, flash: 0.25 * (this.S.userData.flash || 0) }; } });
// M15b: he didn't look surprised. He looked scared.
shot('M15b', { scene: STORM, build() { stormWorld({ flashes: [], rainAt: [0.7, 17, -14] }); const A = gpTop({ face: 'shock' }); on((u) => A.setFace(u < 1.3 ? 'shock' : 'sad')); }, cam: CUY(0.5, -18.05, 0.1, { y: 16.3, d: 3.0, side: -0.35, push: 0.6 }), fx: PAINT() });
// M16: "You shouldn't be here! I'm not trapped. I'm guarding it."
shot('M16', { scene: STORM, build() { stormWorld({ flashes: [0.15], rainAt: [0.7, 17, -14] }); const A = gpTop({ face: 'sad', pose: 'point' }); on((u) => { A.pose = u < 1.4 ? 'point' : 'idle'; A.setFace(u < 1.4 ? 'shock' : 'sad'); A.look = u > 2.2 ? -0.5 : 0; }); this.S = getScene(); },
  cam: CUY(0.5, -18.05, 0.1, { y: 16.3, d: 2.6, side: 0.3, push: 0.5 }), fx(u) { return { paint: 1, flash: 0.2 * (this.S.userData.flash || 0) }; } });
// M17: he pointed at the edge of the painting; from inside, the whole museum
shot('M17', { scene: STORM, build() {
  stormWorld({ flashes: [], rainAt: [0, 17, -12] }); const A = gpTop({ x: 1.0, z: -18.2, yaw: 0.2, face: 'sad', pose: 'point' }); A.root.rotation.y = 0.6;
  const B = person(ME, -0.9, -18.2, -0.1, 'idle', { face: 'shock', y: 16.3 }); on((u) => { B.look = sm(0.6, 1.4, u) * 0.6; });
}, cam: dolly(P([0.4, 18.4, -12.2], [0.1, 17.5, -18.1], 50), P([0.3, 18.35, -12.8], [0.1, 17.55, -18.1], 50)), fx: PAINT() });
// the view out of the painting: the museum through a gold frame, the surface wobbling like water
function frameView() {
  const g = new THREE.Group(); add(g); const gold = new THREE.MeshStandardMaterial({ color: 0xd8a83a, metalness: 0.9, roughness: 0.3, emissive: 0x2a1a04 });
  for (const [w, h, x, y] of [[0.3, 0.035, 0, 0.214], [0.3, 0.035, 0, -0.214], [0.03, 0.46, -0.118, 0], [0.03, 0.46, 0.118, 0]]) { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.02), gold); m.position.set(x, y, 0); g.add(m); }
  const n = 220, rp = new Float32Array(n * 6), r = (() => { let s = 5; return () => ((s = (s * 9301 + 49297) % 233280) / 233280); })(), rb = []; for (let i = 0; i < n; i++) rb.push([r() - 0.5, r(), r()]);
  const rg = new THREE.BufferGeometry(); rg.setAttribute('position', new THREE.BufferAttribute(rp, 3)); const rain = new THREE.LineSegments(rg, new THREE.LineBasicMaterial({ color: 0xc8d8e8, transparent: true, opacity: 0.3 })); rain.frustumCulled = false; g.add(rain);
  const fwd = new THREE.Vector3();
  onPost((u, d, cam) => { cam.getWorldDirection(fwd); g.position.copy(cam.position).addScaledVector(fwd, 0.62); g.quaternion.copy(cam.quaternion); g.scale.setScalar(Math.tan(cam.fov * Math.PI / 360) / Math.tan(20 * Math.PI / 180));
    rb.forEach(([x, y, z], i) => { const yy = ((y - u * 1.6 * (0.6 + z)) % 1 + 1) % 1; rp.set([x * 0.24, (yy - 0.5) * 0.45, 0.01, x * 0.24 - 0.002, (yy - 0.5) * 0.45 - 0.02, 0.01], i * 6); }); rg.attributes.position.needsUpdate = true; });
}
const OUT = { ...EVE, bloom: 0.5, exposure: 0.9, dof: { aperture: 0.0012, maxblur: 0.004 } };
shot('M17', { off: 2.25, scene: OUT, build() { museum({ evening: true, hide: 'lighthouse', curtain: () => ({ amp: 0.1 }) }); frameView(); }, cam: dolly(P([7.6, 3.0, -8.0], [0, 3.1, -54], 44), P([7.5, 3.0, -8.1], [0, 3.2, -54], 40)), focus: () => 30, fx: (u) => ({ wobble: 0.35 }) });
// M18: and in the last room... the red curtain was moving
shot('M18', { scene: OUT, build() { museum({ evening: true, hide: 'lighthouse', curtain: (u, d) => ({ amp: 0.4 + sm(0, d, u) * 1.2 }) }); frameView(); },
  cam: (u, d) => ({ pos: [7.5, 3.0, -8.1], tgt: [0, 3.3, -54], fov: lerp(40, 12, sm(0, d, u)) }), focus: () => 46, fx: () => ({ wobble: 0.3 }) });
// M19: something was stepping out
shot('M19', { scene: NGT, build() { museum({ night: true, chair: false, curtain: (u, d) => ({ amp: 1.2, bulge: sm(0.1, d, u) * 0.9, bx: 0.4, by: 0.1 }) }); }, cam: dolly(P([1.4, 2.4, -46.6], [0, 3.1, -53.4], 46), P([1.0, 2.5, -47.6], [0, 3.15, -53.4], 46)) });
// M19b: a long, thin hand... made of black paint
shot('M19b', { scene: { ...NGT }, build() {
  museum({ night: true, chair: false, curtain: () => ({ amp: 0.5, bulge: 0.8, bx: 1.5, by: 0.1 }) });
  paintHand({ reach: (u, d) => sm(0.1, d * 0.9, u), curl: (u, d) => 0.15 + 0.5 * sm(d * 0.5, d, u), pos: (u, d, k) => [1.75 + 0.75 * k, 3.25 - 0.1 * k, -53.25 + 0.35 * k], ry: Math.PI / 2 + 0.25, rx: 0.15, puddle: (u, d) => 0.2 + 0.4 * sm(0, d, u) });
  const rim = new THREE.PointLight(0xc8d8ff, 6, 5, 1.6); rim.position.set(3.4, 4.2, -51.8); add(rim);
}, cam: dolly(P([4.0, 3.5, -50.2], [2.2, 3.2, -53.1], 44), P([3.6, 3.4, -50.8], [2.3, 3.2, -53.1], 44)) });
// M20: then the clock struck six
shot('M20', { scene: { ...EVE, exposure: 0.9 }, build() { museum({ evening: true, time: (u) => 17 * 60 + 59 + sm(0.18, 0.3, u) }); }, cam: (u, d) => ({ ...camLerp(P([0.2, 7.5, -34.8], [0, 7.55, -39.6], 30), P([0.1, 7.55, -35.5], [0, 7.55, -39.6], 30), u / d), shake: 0.04 * Math.max(0, 1 - Math.abs(u - 0.35) / 0.4) }) });
// M21: and the edges of the painting started to dry
shot('M21', { scene: STORM, build() {
  stormWorld({ flashes: [0.25], rainAt: [0, 17, -12] }); const A = gpTop({ x: 0.8, z: -18.1, yaw: -0.3, face: 'shock' }); const B = person(ME, -0.7, -18.1, 0.3, 'shock', { face: 'shock', y: 16.3 }); this.S = getScene();
}, cam: dolly(P([0.1, 18.3, -12.4], [0.05, 17.5, -18.1], 50), P([0.05, 18.25, -13.0], [0.05, 17.55, -18.1], 50)), fx(u, d) { return { paint: 1, flash: 0.2 * (this.S.userData.flash || 0), dry: sm(0.15, d + 0.4, u) * 0.85 }; } });
// M22: after closing: the curtain hangs open, black paint footprints lead out of the last room
shot('M22', { scene: NGT, build() {
  museum({ night: true, chair: false, curtain: () => ({ amp: 0.05, bulge: 0.15, bx: 1.5, by: -0.5 }) });
  const tar = new THREE.MeshPhysicalMaterial({ color: 0x030304, roughness: 0.1, clearcoat: 1 });
  for (let i = 0; i < 14; i++) { const f = new THREE.Mesh(new THREE.CircleGeometry(0.16, 20), tar); f.scale.set(0.7, 1.4, 1); f.rotation.x = -Math.PI / 2; f.rotation.z = 0.15; f.position.set(1.6 + (i % 2 ? 0.25 : -0.25) - i * 0.14, 0.02, -51.6 + i * 1.05); add(f); }
  const pd = new THREE.Mesh(new THREE.CircleGeometry(0.8, 32), tar); pd.rotation.x = -Math.PI / 2; pd.position.set(2.0, 0.018, -53.0); add(pd);
  const fl = new THREE.PointLight(0xc8d8ff, 16, 12, 1.3); fl.position.set(0.9, 3.8, -46.5); add(fl);
}, cam: dolly(P([-1.6, 1.3, -38.0], [0.8, 1.0, -50], 48), P([-1.2, 1.25, -40.5], [1.0, 1.1, -51], 48)), focus: (u, d) => lerp(10, 9, u / d), fx: (u, d) => ({ fade: sm(d - 0.7, d, u) }) });
