// "What if the Sun was 1% brighter?" -- Roblox v2 What-if, ~55 s. Shots for script_sun.py
import { THREE, shot, person, street, ground, house, tree, label, glowTex, stars, add, on, onPost, camLerp, sm, lerp, getScene, shadowAt, dog } from './kit.js';
import { blk, dust, sparkles } from './sets.js';
import { waterPlane, table } from './museum.js';

const ME = { skin: 0xf2c79a, shirt: 0xf5a623, pants: 0x2f4a8a, hair: { style: 'spiky', color: 0x3a2414 }, logo: 0xffffff };
const PP = [
  { skin: 0x8a5a3a, shirt: 0x3fa7d6, pants: 0xc9b38a, hair: { style: 'short', color: 0x1a1210 } },
  { skin: 0xffd9b3, shirt: 0xb04ac9, pants: 0x4a4a55, hair: { style: 'bun', color: 0x8a3a1a } },
  { skin: 0xc68a5a, shirt: 0xd23a3a, pants: 0x2a2a35, hair: { style: 'long', color: 0x2a1a10 } },
  { skin: 0xf6d2b0, shirt: 0x7fc8f0, pants: 0x3b5ba8, hair: { style: 'long', color: 0xc8904a } },
  { skin: 0xf2c79a, shirt: 0x3aa655, pants: 0x2a2a3a, hair: { style: 'bowl', color: 0x6b3a1e }, scale: 0.65 },
  { skin: 0xf0d0b0, shirt: 0x8a2a2a, pants: 0x2a2a30, hair: { style: 'white', color: 0xdddddd }, acc: ['glasses'] },
];
const P = (a, b, fov = 50) => ({ pos: a, tgt: b, fov });
const dolly = (a, b) => (u, d) => camLerp(a, b, u / d);
const CUY = (x, z, yaw, o = {}) => { const d = o.d ?? 3.2, sx = o.side ?? 0.25, hy = (o.y ?? 0) + (o.hy ?? 1.94), fx = Math.sin(yaw), fz = Math.cos(yaw), rx = Math.cos(yaw), rz = -Math.sin(yaw);
  const at = (dd, ss) => P([x + fx * dd + rx * ss, hy - 0.09 * dd / 3.2, z + fz * dd + rz * ss], [x, hy - 0.49 * d / 3.2, z], o.fov ?? 50);
  return dolly(at(d, sx), at(d - (o.push ?? 0.5), sx * 0.5)); };
const M_ = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: o.r ?? 0.55, metalness: o.m ?? 0, emissive: o.em ?? 0, emissiveIntensity: o.ei ?? 1, transparent: !!o.t, opacity: o.op ?? 1 });
const rnd = (seed) => { let s = seed; return () => ((s = (s * 9301 + 49297) % 233280) / 233280); };
const DOF = { aperture: 0.002, maxblur: 0.006 };
const DAY = { bloom: 0.3, bloomThreshold: 1.8, exposure: 0.8, dof: DOF };
const HOT = { sky: ['#e8783a', '#ffd8a0'], bloom: 0.4, bloomThreshold: 1.6, exposure: 0.8, env: 0.3, dof: DOF, fog0: 20, fog1: 160 };

// ------------------------------------------------------------------ props
// the Sun: a white-hot disc (above 1 so it blooms) with two halos; k(u) = brightness
function sun(x, y, z, R, k = () => 1) {
  const g = new THREE.Group(); g.position.set(x, y, z); add(g);
  const core = new THREE.Mesh(new THREE.SphereGeometry(R, 40, 30), new THREE.MeshBasicMaterial({ color: 0xfff0c0, fog: false })); g.add(core);
  const h1 = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex(), color: 0xffd070, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false })); g.add(h1);
  const h2 = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex(), color: 0xff9a40, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false, opacity: 0.5 })); g.add(h2);
  on((u) => { const b = k(u); core.material.color.setRGB(3 * b, 2.7 * b, 2.0 * b); h1.scale.setScalar(R * 5 * (0.8 + 0.4 * b)); h1.material.opacity = 0.8 * Math.min(1, b); h2.scale.setScalar(R * 12 * (0.7 + 0.5 * b)); h2.material.opacity = 0.35 * Math.min(1.4, b); });
  return g;
}
// a label whose text changes (canvas redrawn when the text changes)
function dynLabel(textFn, x, y, z, o = {}) {
  const c = document.createElement('canvas'); c.width = 1024; c.height = 512; const g = c.getContext('2d'); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  const m = new THREE.Mesh(new THREE.PlaneGeometry(o.w ?? 4, (o.w ?? 4) / 2), new THREE.MeshBasicMaterial({ map: t, transparent: true, fog: false })); m.position.set(x, y, z); if (o.yaw) m.rotation.y = o.yaw; add(m);
  let last = null;
  on((u) => { const s = textFn(u); if (s === last) return; last = s; g.clearRect(0, 0, 1024, 512);
    if (o.bg) { g.fillStyle = o.bg; g.beginPath(); g.roundRect(40, 110, 944, 292, 60); g.fill(); }
    g.font = `${o.size ?? 200}px Poppins`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineWidth = 30; g.strokeStyle = o.stroke ?? '#1a1030'; g.lineJoin = 'round'; g.strokeText(s, 512, 270); g.fillStyle = o.color ?? '#ffffff'; g.fillText(s, 512, 270); t.needsUpdate = true; });
  return m;
}
// a thermometer: glass tube, red column rising with level(u) in 0..1
function thermo(x, y, z, H, level) {
  const glass = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, H, 24), new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.35, roughness: 0.05 })); glass.position.set(x, y + H / 2, z); add(glass);
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.95, 24, 18), M_(0xe02a2a, { em: 0x8a0a0a, ei: 0.6, r: 0.3 })); bulb.position.set(x, y, z); add(bulb);
  const col = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 1, 20), bulb.material); add(col);
  for (let i = 1; i < 10; i++) { const tk = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.06, 0.05), M_(0x1a1a1a)); tk.position.set(x - 0.6, y + i * H / 10, z + 0.3); add(tk); }
  on((u) => { const h = 0.3 + level(u) * (H - 0.6); col.scale.y = h; col.position.set(x, y + h / 2, z); });
}
// make an avatar's skin go red (sunburn), k in 0..1
function sunburn(A, k) { const mats = []; A.root.traverse((n) => { if (n.material && n.material.color && n.material.color.getHex() === A.def.skin) mats.push(n.material); });
  const c0 = new THREE.Color(A.def.skin), c1 = new THREE.Color(0xf06a4a); on((u) => { const q = k(u); mats.forEach((m) => m.color.copy(c0).lerp(c1, q)); }); }
// heat shimmer rising from the road (thin additive quads)
function shimmer(n, cx, cz, sx, sz) { const r = rnd(4), mat = new THREE.MeshBasicMaterial({ color: 0xfff0d0, transparent: true, opacity: 0.05, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
  for (let i = 0; i < n; i++) { const m = new THREE.Mesh(new THREE.PlaneGeometry(2, 1.2), mat); const x = cx + (r() - 0.5) * sx, z = cz + (r() - 0.5) * sz, ph = r(); add(m); on((u) => { const q = (u * 0.5 + ph) % 1; m.position.set(x, 0.3 + q * 2.5, z); m.scale.y = 1 + q; }); } }
function burst(x, y, z, t0, o = {}) {
  const r = rnd(o.seed ?? 5), n = o.n ?? 30, parts = [];
  const fl = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex(), color: 0xffe08a, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false })); fl.position.set(x, y, z); add(fl);
  const L = new THREE.PointLight(0xffc060, 0, 18, 1.5); L.position.set(x, y, z); add(L);
  for (let i = 0; i < n; i++) { const m = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 0.06), new THREE.MeshBasicMaterial({ color: i % 3 ? 0xffe08a : 0xffffff })); m.visible = false; add(m); parts.push([m, (r() - 0.5) * 6, 2 + r() * 5, (r() - 0.5) * 6]); }
  on((u) => { const q = u - t0, a = q >= 0 && q < 1.4; fl.material.opacity = a ? Math.max(0, 1 - q / 0.6) : 0; fl.scale.setScalar(5 * (0.6 + q)); L.intensity = a ? 80 * Math.max(0, 1 - q / 0.5) : 0;
    parts.forEach(([m, vx, vy, vz]) => { m.visible = a; if (a) m.position.set(x + vx * q, y + vy * q - 4.9 * q * q, z + vz * q); }); });
}
const water = (amp = 0.15, o = {}) => waterPlane(400, 120, new THREE.MeshStandardMaterial({ color: o.color ?? 0x1e78a8, roughness: 0.12, metalness: 0.3, transparent: !!o.op, opacity: o.op ?? 1 }), amp, o);

// S01: the Sun over the town; it flares up a little
shot('S01', { scene: DAY, build() { street({ n: 10 }); sun(-170, 40, -8, 10, (u) => 1 + 0.6 * sm(0.8, 1.6, u)); const A = person(ME, -2, 0.6, -Math.PI / 2, 'idle', { badge: (u) => u > 1.0 ? '+1%' : null }); A.pitch = -0.3; shadowAt(-2, 0, 10); },
  cam: dolly(P([2.2, 1.0, 1.6], [-60, 14, -2], 60), P([1.4, 1.1, 1.4], [-60, 15, -2], 60)), focus: () => 4 });
// S02: one percent. That's nothing, right?
shot('S02', { scene: DAY, build() { street(); sun(-20, 45, -150, 9); const A = person(ME, 0, -6, 0, 'shrug', { face: 'smug', badge: '+1%' }); shadowAt(0, -6, 8); }, cam: CUY(0, -6, 0) });
// S03: sunburned a little faster (lying on a towel in the park)
shot('S03', { scene: DAY, build() {
  street(); sun(-20, 45, -150, 9);
  const A = person({ ...ME, acc: ['shades'] }, 0, -6, 0, 'idle', { face: 'smile' }); sunburn(A, (u, d) => sm(0.3, 2.2, u)); on((u) => A.setFace(u < 1.5 ? 'smile' : 'shock'));
  shadowAt(0, -6, 8);
}, cam: CUY(0, -6, 0, { d: 3.0, side: 0.4 }) });
// S03b: the ice cream melts a few seconds sooner
shot('S03b', { scene: DAY, build() {
  street(); sun(-20, 45, -150, 9); const A = person(ME, 0, -6, 0, 'idle', { face: 'smile' });
  const ic = new THREE.Group(); A.armL.add(ic); ic.position.set(0, -2.0, 0.6); ic.rotation.x = Math.PI / 2;
  const cone = new THREE.Mesh(new THREE.ConeGeometry(0.35, 1.0, 16), M_(0xd8a060, { r: 0.8 })); cone.rotation.x = Math.PI; cone.position.y = -0.1; ic.add(cone);
  const ball = new THREE.Mesh(new THREE.SphereGeometry(0.42, 20, 16), M_(0xffb8d0, { r: 0.35 })); ball.position.y = 0.55; ic.add(ball);
  const drips = []; for (let i = 0; i < 6; i++) { const d = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 6), ball.material); d.scale.y = 2; add(d); drips.push(d); }
  const v = new THREE.Vector3();
  onPost((u) => { A.armL.rotation.x = -1.0; A.armL.updateMatrixWorld(true); const k = sm(0.3, 2.0, u); ball.scale.set(1 + 0.2 * k, 1 - 0.55 * k, 1 + 0.2 * k); ball.position.y = 0.55 - 0.18 * k; A.setFace(u < 1.2 ? 'smile' : 'sad');
    ic.updateWorldMatrix(true, false); drips.forEach((d, i) => { const q = ((u * 0.9 + i / 6) % 1); v.set(Math.sin(i * 2) * 0.12, 0.3, Math.cos(i * 2) * 0.12); ic.localToWorld(v); d.visible = k > 0.2; d.position.set(v.x, v.y - q * q * 1.6, v.z); }); });
  shadowAt(0, -6, 8);
}, cam: CUY(0, -6, 0, { d: 3.6, side: -1.0 }) });
// S04: 1% of the Sun is a crazy amount of energy -- as much as doubling all the CO2
shot('S04', { scene: { night: true, bloom: 0.5, bloomThreshold: 1.0, exposure: 0.85, env: 0.1 }, build() {
  const S = getScene(); S.background = new THREE.Color(0x02030a); S.fog = null; stars(2500);
  sun(-90, 8, -160, 22, (u) => 0.7 + 0.3 * sm(0.5, 1.5, u));
  const earth = new THREE.Group(); earth.position.set(6, 0, -10); add(earth);
  const ec = document.createElement('canvas'); ec.width = 512; ec.height = 256; const g = ec.getContext('2d'); g.fillStyle = '#1a5aa8'; g.fillRect(0, 0, 512, 256); const r = rnd(3);
  for (let i = 0; i < 22; i++) { g.fillStyle = i % 4 ? '#3a8a3a' : '#c8a860'; g.beginPath(); g.ellipse(r() * 512, 40 + r() * 176, 20 + r() * 50, 12 + r() * 30, r() * 3, 0, 6.28); g.fill(); } g.fillStyle = '#ffffff'; g.fillRect(0, 0, 512, 16); g.fillRect(0, 240, 512, 16);
  const et = new THREE.CanvasTexture(ec); et.colorSpace = THREE.SRGBColorSpace;
  const E = new THREE.Mesh(new THREE.SphereGeometry(2.2, 48, 32), new THREE.MeshStandardMaterial({ map: et, roughness: 0.7 })); earth.add(E);
  const atm = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex(), color: 0x6ab0ff, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false })); atm.scale.setScalar(6.5); earth.add(atm);
  const key = new THREE.DirectionalLight(0xfff0d0, 3); key.position.set(-90, 8, -160); key.target = E; add(key); getScene().userData.hemi.intensity = 0.05;
  // the energy stream: glowing motes flying from the Sun to the Earth
  const n = 500, pos = new Float32Array(n * 3), base = []; for (let i = 0; i < n; i++) base.push([r(), (r() - 0.5) * 3, (r() - 0.5) * 3, 0.4 + r() * 0.6]);
  const pg = new THREE.BufferGeometry(); pg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const pts = new THREE.Points(pg, new THREE.PointsMaterial({ size: 0.25, map: glowTex(), color: 0xffd070, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false })); pts.frustumCulled = false; add(pts);
  on((u) => { E.rotation.y = u * 0.3; base.forEach(([p, dy, dz, sp], i) => { const q = (p + u * 0.25 * sp) % 1; pos.set([lerp(-30, 4, q), lerp(4, 0, q) + dy * (1 - q), lerp(-60, -10, q) + dz * (1 - q)], i * 3); }); pg.attributes.position.needsUpdate = true; pts.material.opacity = sm(0.3, 1.2, u); });
  dynLabel((u) => u < 3.6 ? '+1% SUN' : '= 2x CO₂', 5.2, 3.5, -9, { w: 4.5, size: 170, color: '#ffd23a' });
  const fat = new THREE.Mesh(new THREE.SphereGeometry(2.45, 48, 32), new THREE.MeshBasicMaterial({ color: 0xff6a3a, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false })); earth.add(fat);
  on((u) => { fat.material.opacity = 0.25 * sm(3.6, 6, u); });
}, cam: dolly(P([1, 1.5, 6], [-4, 1.2, -18], 55), P([4.5, 1.2, 0.5], [5, 1.2, -10], 50)) });
// S05: the whole planet warms by almost two degrees (a giant thermometer over the town)
shot('S05', { scene: { ...DAY, sky: ['#7ab8f0', '#f8e8c8'] }, build() {
  street({ n: 8 }); sun(-30, 50, -160, 9, () => 1.2);
  thermo(3.2, 1, -4, 9, (u) => 0.2 + 0.6 * sm(0.3, 3.2, u));
  dynLabel((u) => '+' + (1.9 * sm(0.3, 3.2, u)).toFixed(1) + '°C', 2.4, 11.2, -4, { w: 6, size: 230, color: '#ffffff', stroke: '#c8281a' });
  visitorsWalk();
}, cam: dolly(P([-6, 2.6, 8], [1.5, 6.2, -4], 56), P([-5, 2.8, 6.5], [1.5, 6.4, -4], 56)), focus: () => 13 });
function visitorsWalk() { [[0, -2, -6, Math.PI / 2], [1, 3, -6.5, -Math.PI / 2], [3, -5, 6, Math.PI / 2]].forEach(([i, x, z, yaw], k) => { const A = person(PP[i], x, z, yaw, 'walk'); A.anim = (Q, u) => { Q.root.position.x = x + Math.sin(yaw) * u * 1.2; }; }); }
// S05b: the last ice age was only ~6 degrees colder: the same town, under snow and ice
shot('S05b', { scene: { sky: ['#9ab8d8', '#e8f0f8'], bloom: 0.3, bloomThreshold: 1.6, exposure: 0.8, fog0: 30, fog1: 200 }, build() {
  const S = getScene(); S.fog.color.set(0xdde8f0);
  ground({ grass: 0xf4f8fc, road: false }); const snow = M_(0xf8fbff, { r: 0.6 }), ice = M_(0xbfe4f8, { r: 0.15, m: 0.1 });
  for (let i = -4; i <= 4; i++) { const h = house(i * 15, -15, 0, { seed: i + 50, fence: false, roof: 0xf8fbff }); house(i * 15 + 7, 15, Math.PI, { seed: i + 90, fence: false, roof: 0xf8fbff }); }
  for (let i = 0; i < 12; i++) blk(30, 40 + (i % 3) * 8, 14, ice, -80 + i * 16, 18, -70 - (i % 2) * 6, { k: 0.02 });
  const r = rnd(5); for (let i = 0; i < 40; i++) { const m = new THREE.Mesh(new THREE.SphereGeometry(1 + r() * 2, 10, 8), snow); m.scale.y = 0.4; m.position.set((r() - 0.5) * 80, 0, (r() - 0.5) * 40); add(m); }
  const A = person({ ...ME, acc: ['headband'] }, 0, -4, 0, 'shock', { face: 'shock' });
  dust(1200, 0, 8, -6, 50, 16, 40, { color: 0xffffff, size: 0.12, rise: -0.2, opacity: 0.9, seed: 7 });
  dynLabel((u) => u < 1.4 ? 'ICE AGE' : '-6°C', 0, 6.2, -12, { w: 9, size: 230, color: '#bfe8ff', stroke: '#1a3a6a' });
}, cam: dolly(P([0.8, 2.2, 3.2], [0, 4, -16], 54), P([0.6, 2.0, 1.6], [0, 4.5, -16], 54)), focus: () => 6 });
// S06: heatwaves every summer: orange sky, yellow grass, shimmering road, everyone melting
shot('S06', { scene: HOT, build() {
  street({ n: 10, grass: 0xc8b048 }); getScene().userData.sun.color.set(0xffb070); sun(-150, 30, -6, 12, () => 1.6);
  shimmer(60, -12, 0, 30, 8);
  [[0, -2.2, -2.6, Math.PI / 2 - 0.4], [2, -5.0, -3.8, Math.PI / 2 + 0.2], [3, -8, -1.2, Math.PI / 2 + 0.5]].forEach(([i, x, z, y]) => { const A = person(PP[i], x, z, y, 'idle', { face: 'sad' }); A.pitch = 0.25; });
  dog(-0.6, -2.0, Math.PI / 2 - 0.3, { sit: true });
  label('46°C', -7, 3.4, -5.2, { w: 3, size: 150, color: '#ff4a2a', bg: 'rgba(20,10,10,0.85)', yaw: Math.PI / 2 - 0.3 });
  blk(0.15, 2.6, 0.15, M_(0x3a3a40), -7, 1.3, -5.3);
}, cam: dolly(P([3.5, 1.5, -2.0], [-30, 4, -3], 54), P([2.6, 1.45, -2.2], [-30, 4.2, -3], 54)), fx: () => ({ wobble: 0.35 }), focus: () => 5.5 });
// S07: air conditioners day and night... until the grid gives up
shot('S07', { scene: { night: true, bloom: 0.55, bloomThreshold: 0.9, exposure: 1.05, env: 0.1, dof: DOF }, build() {
  street({ lit: true, n: 8 }); stars(); getScene().userData.hemi.intensity = 0.5;
  const fans = []; for (const [x, z] of [[-3.4, -10.9], [3.2, -10.9], [11.6, -10.9], [-11.8, -10.9]]) { blk(1.4, 1.0, 0.6, M_(0xd8dce0, { r: 0.4 }), x, 2.2, z); const f = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.12, 0.05), M_(0x3a3a40)); f.position.set(x, 2.2, z + 0.32); add(f); fans.push(f); }
  const pole = blk(0.3, 8, 0.3, M_(0x5a3a24), 6, 4, -5.5); const tr = blk(0.9, 1.2, 0.9, M_(0x6a7078, { m: 0.6 }), 6.4, 6.6, -5.5);
  for (const s of [-1, 1]) { const w = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 30, 4), M_(0x1a1a1a)); w.rotation.z = Math.PI / 2; w.position.set(6 + s * 0.0, 7.6 + s * 0.3, -5.5); add(w); }
  burst(6.4, 6.6, -5.5, 2.4, { n: 40 }); burst(-9, 6.6, -5.5, 2.7, { n: 30, seed: 9 });
  on((u) => fans.forEach((f, i) => { f.rotation.z = u < 2.6 ? u * 30 + i : f.rotation.z; }));
  this.t0 = 2.6;
}, cam: dolly(P([-2, 2.0, 4], [2, 3.5, -10], 54), P([-1.4, 2.0, 2.6], [2.5, 3.8, -10], 54)), fx(u) { return { fade: 0.6 * sm(2.6, 2.9, u) }; } });
// S08: coral reefs turn white; crops dry up in the fields
shot('S08', { scene: { night: true, bloom: 0.3, bloomThreshold: 1.2, exposure: 1.1, env: 0.4, dof: DOF }, build() {
  const S = getScene(); S.background = new THREE.Color(0x0a4a7a); S.fog = new THREE.Fog(0x0e5a8a, 3, 26); S.userData.hemi.color.set(0x8ad0ff); S.userData.hemi.intensity = 1.2; S.userData.sun.intensity = 1.6; S.userData.sun.color.set(0xbfe8ff);
  const sand = new THREE.Mesh(new THREE.PlaneGeometry(80, 80), M_(0xd8c890)); sand.rotation.x = -Math.PI / 2; add(sand);
  const r = rnd(8), cols = [0xff6a8a, 0xffa040, 0xb04ac9, 0x3ad0c0, 0xffd23a, 0xff4a4a], mats = [];
  for (let i = 0; i < 70; i++) { const c = cols[i % cols.length], m = M_(c, { r: 0.7 }); mats.push([m, new THREE.Color(c), 0.2 + r() * 1.6]); const x = (r() - 0.5) * 14, z = -2 - r() * 14, t = i % 3;
    if (t === 0) for (let b = 0; b < 5; b++) { const br = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.12, 0.8 + r() * 0.8, 8), m); br.position.set(x + (r() - 0.5) * 0.4, 0.5, z + (r() - 0.5) * 0.4); br.rotation.set((r() - 0.5) * 0.9, 0, (r() - 0.5) * 0.9); add(br); }
    else if (t === 1) { const s = new THREE.Mesh(new THREE.SphereGeometry(0.4 + r() * 0.5, 14, 10), m); s.scale.y = 0.6; s.position.set(x, 0.2, z); add(s); }
    else { const f = new THREE.Mesh(new THREE.ConeGeometry(0.5, 1.2, 10, 1, true), m); f.rotation.x = Math.PI; f.position.set(x, 0.6, z); add(f); } }
  const white = new THREE.Color(0xf4f2ea); on((u) => mats.forEach(([m, c, d]) => m.color.copy(c).lerp(white, sm(d, d + 0.8, u))));
  const fish = []; for (let i = 0; i < 12; i++) { const f = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.35, 6), M_(i % 2 ? 0xffa020 : 0x40a0ff)); f.rotation.z = Math.PI / 2; add(f); fish.push([f, r() * 6, 1 + r() * 2]); }
  on((u) => fish.forEach(([f, ph, y]) => f.position.set(-6 + ((u * 1.4 + ph) % 12), y, -6 - ph)));
  dust(300, 0, 3, -8, 16, 6, 14, { color: 0xbfe8ff, size: 0.05, opacity: 0.5, seed: 3 });
}, cam: dolly(P([0, 1.6, 2.4], [0, 0.4, -8], 54), P([0.4, 1.4, 1.2], [0, 0.4, -8], 54)) });
shot('S08', { off: 1.45, scene: { ...DAY, sky: ['#d8a060', '#f8e0b0'] }, build() {
  ground({ road: false, grass: 0x8a7a3a }); sun(-10, 40, -150, 9, () => 1.4);
  const r = rnd(4), mats = []; for (let row = 0; row < 14; row++) { const m = M_(0x4aa83a, { r: 0.8 }); mats.push([m, 0.0 + row * 0.05]); for (let k = 0; k < 30; k++) { const c = new THREE.Mesh(new THREE.ConeGeometry(0.22, 1.0 + r() * 0.3, 6), m); c.position.set(-15 + k * 1.0 + (r() - 0.5) * 0.2, 0.5, -2 - row * 1.4); add(c); } }
  const brown = new THREE.Color(0xa88a40), green = new THREE.Color(0x4aa83a); on((u) => mats.forEach(([m, d]) => { const k = sm(0.1 + d, 1.0 + d, u); m.color.copy(green).lerp(brown, k); }));
  const A = person({ ...PP[5], acc: [] }, 2, -1.5, -0.4, 'think', { face: 'sad' }); shadowAt(0, -6, 12);
}, cam: dolly(P([4.5, 2.4, 3.4], [0, 0.6, -8], 50), P([4.0, 2.2, 2.6], [0, 0.6, -8], 50)), fx: () => ({ wobble: 0.15 }) });
// S08b: food gets more expensive, everywhere (the price tags flip)
shot('S08b', { scene: { interior: true, bloom: 0.3, bloomThreshold: 1.1, exposure: 0.85, env: 0.3, dof: DOF }, build() {
  const S = getScene(); S.background = new THREE.Color(0x8a9098); S.fog = new THREE.Fog(0x8a9098, 12, 40); S.userData.sun.intensity = 0.6; S.userData.hemi.intensity = 0.6;
  const fl = new THREE.Mesh(new THREE.PlaneGeometry(30, 30), M_(0xd8dcd8, { r: 0.3 })); fl.rotation.x = -Math.PI / 2; add(fl);
  blk(14, 6, 0.4, M_(0xf0f0ee), 0, 3, -4.2);
  const fruitC = [0xd8282a, 0xf5c020, 0x4ab83a, 0xf28c28];
  for (let row = 0; row < 3; row++) { blk(10, 0.12, 1.2, M_(0xb8bcc0, { m: 0.5, r: 0.3 }), 0, 0.9 + row * 1.25, -3.5);
    for (let k = 0; k < 4; k++) { const m = M_(fruitC[(k + row) % 4], { r: 0.35 }); for (let j = 0; j < 9; j++) { const s = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 10), m); s.position.set(-4.4 + k * 2.4 + (j % 3) * 0.34, 1.12 + row * 1.25 + Math.floor(j / 3) * 0.02, -3.8 + Math.floor(j / 3) * 0.3); add(s); } }
    for (let k = 0; k < 4; k++) { const p0 = ['$1.99', '$0.89', '$2.49', '$1.29'][(k + row) % 4], p1 = ['$4.99', '$2.79', '$6.99', '$3.49'][(k + row) % 4];
      dynLabel((u) => u < 0.7 + k * 0.12 + row * 0.1 ? p0 : p1, -3.7 + k * 2.4, 0.72 + row * 1.25, -2.88, { w: 0.9, size: 210, color: '#d8281a', stroke: '#ffffff', bg: '#fff6c8' }); } }
  const A = person(ME, 1.2, -0.6, Math.PI - 0.4, 'shock', { face: 'shock' });
  for (const x of [-4, 0, 4]) { const L = new THREE.PointLight(0xffffff, 3, 12, 1.6); L.position.set(x, 5, -1); add(L); }
}, cam: dolly(P([-1.6, 2.0, 3.4], [0.2, 1.6, -3.0], 50), P([-1.3, 1.9, 2.6], [0.2, 1.6, -3.0], 50)) });
// S09: glaciers melt: ice cliffs break and fall into the sea
shot('S09', { scene: { sky: ['#6aa0d8', '#e8f0f8'], bloom: 0.3, bloomThreshold: 1.6, exposure: 0.8, env: 0.35, dof: { aperture: 0.0012, maxblur: 0.004 }, fog0: 60, fog1: 300 }, build() {
  getScene().fog.color.set(0xdfe8f0); water(0.25, { color: 0x1a5a7a });
  const ice = M_(0xd8f0ff, { r: 0.25, m: 0.05 }), ice2 = M_(0x9ad4f0, { r: 0.15 }); const r = rnd(6);
  for (let i = 0; i < 16; i++) blk(8 + r() * 4, 18 + r() * 10, 10, i % 3 ? ice : ice2, -60 + i * 8, 6, -40 - r() * 4, { k: 0.04 });
  const chunks = []; for (let i = 0; i < 6; i++) { const c = blk(4 + r() * 3, 8 + r() * 6, 4, i % 2 ? ice : ice2, -14 + i * 6, 9, -33, { k: 0.06 }); chunks.push([c, 0.6 + i * 0.55 + r() * 0.3, c.position.clone()]); }
  const splash = []; chunks.forEach(([c, t0, p]) => { const sp = sparkles(p.x, 0.2, p.z + 2, { n: 80, R: 3, h: 5, color: 0xffffff, size: 0.25, amount: (u) => Math.max(0, 1 - Math.abs(u - t0 - 1.0) / 0.6) }); });
  on((u) => chunks.forEach(([c, t0, p]) => { const q = Math.max(0, u - t0); c.rotation.x = Math.min(1.4, q * q * 1.2); c.position.set(p.x, Math.max(-6, p.y - q * q * 4), p.z + Math.min(5, q * q * 2)); }));
}, cam: dolly(P([4, 4, 12], [-4, 6, -36], 52), P([3, 3.5, 9], [-4, 6, -36], 52)) });
// S10: the oceans rise by metres: beaches, streets, whole cities
shot('S10', { scene: { ...DAY, sky: ['#7ab0e0', '#f0e8d8'], dof: { aperture: 0.001, maxblur: 0.003 } }, build() {
  street({ n: 9 }); const sea = water(0.12, { color: 0x2a7aa8, z: 0, op: 0.92 }); sea.position.z = 30;
  const beach = new THREE.Mesh(new THREE.PlaneGeometry(400, 30), M_(0xe8d098, { r: 0.9 })); beach.rotation.x = -Math.PI / 2; beach.position.set(0, 0.01, 35); add(beach);
  for (const x of [-12, 4, 18]) { const um = new THREE.Mesh(new THREE.ConeGeometry(1.2, 0.6, 12), M_(x > 0 ? 0xd8282a : 0x2a6ad8)); um.position.set(x, 2.2, 32); add(um); blk(0.08, 2.2, 0.08, M_(0xffffff), x, 1.1, 32); }
  on((u, d) => { const k = sm(0.2, d, u); sea.position.set(0, lerp(-0.4, 6.5, k), lerp(30, 0, Math.min(1, k * 2.5))); });
}, cam: dolly(P([18, 14, 46], [-2, 0, 0], 54), P([14, 12, 40], [-2, 1, 0], 54)), focus: () => 46 });
// S11: hundreds of millions have to move (a long line with suitcases, leaving the coast)
shot('S11', { scene: { ...DAY, sky: ['#8ab0d0', '#f0e0c8'] }, build() {
  street({ n: 8 }); const r = rnd(9);
  for (let i = 0; i < 16; i++) { const d = PP[i % PP.length], z = -1.2 + (i % 2) * 1.8 + (r() - 0.5) * 0.5, x = 6 - i * 2.2; const A = person(d, x, z, Math.PI / 2, 'walk', { face: 'sad' });
    A.anim = (Q, u) => { Q.root.position.x = x + u * 1.3; }; const sc = blk(0.5, 0.7, 0.25, M_([0x8a5a34, 0x2a3a6a, 0x6a1a2a][i % 3]), 0, 0, 0); onPost(() => { A.armR.updateWorldMatrix(true, false); const v = new THREE.Vector3(0, -2.1, 0); A.armR.localToWorld(v); sc.position.set(v.x, v.y - 0.2, v.z); }); }
}, cam: dolly(P([13, 2.4, 3.6], [-4, 1.4, -0.5], 50), P([13.5, 2.3, 2.8], [-4, 1.4, -0.5], 50)), focus: () => 8 });
// S12: and all it took... was one percent (the flooded town at sunset, the Sun watching)
shot('S12', { scene: { sky: ['#4a3a7a', '#f8a060'], bloom: 0.5, bloomThreshold: 1.2, exposure: 0.95, env: 0.2, dof: { aperture: 0.001, maxblur: 0.003 }, fog0: 40, fog1: 260 }, build() {
  const S = getScene(); S.fog.color.set(0xd88a6a); S.userData.sun.color.set(0xff9a50); S.userData.sun.intensity = 1.6; S.userData.sun.position.set(0, 10, -100); S.userData.hemi.intensity = 0.8;
  street({ n: 9 }); const sea = water(0.15, { color: 0xb07a8a }); sea.position.y = 6.2; sun(0, 24, -170, 12, () => 1.3);
  sea.material.roughness = 0.05; sea.material.metalness = 0.6;
  const A = person(ME, -0.8, 3, Math.PI, 'idle', { face: 'sad', y: 6.6 }); const boat = blk(1.6, 0.5, 3.4, M_(0xd8d0c0), -0.8, 6.4, 3.3, { k: 0.3 });
  on((u) => { boat.position.y = 6.35 + Math.sin(u * 1.3) * 0.05; A.root.position.y = 6.6 + Math.sin(u * 1.3) * 0.05; });
}, cam: dolly(P([-0.3, 8.0, 7.2], [-0.8, 7.6, -30], 50), P([0.2, 9.0, 10.5], [-0.8, 8.0, -30], 50)), focus: () => 6, fx: (u, d) => ({ fade: sm(d - 0.8, d, u) }) });
