// "What if Earth was a perfect sphere?" -- Roblox v2 What-if in the viral format. Shots for script_sphere.py
import { THREE, shot, person, street, ground, house, tree, label, glowTex, stars, add, on, onPost, camLerp, sm, lerp, getScene, shadowAt } from './kit.js';
import { blk, dust, sparkles } from './sets.js';
import { waterPlane } from './museum.js';

const ME = { skin: 0xf2c79a, shirt: 0x2fa84f, pants: 0x2f4a8a, hair: { style: 'bowl', color: 0x6b3a1e }, logo: 0xffd23a };
const PP = [
  { skin: 0xf2c79a, shirt: 0xf28c28, pants: 0x2f4a8a, hair: { style: 'spiky', color: 0x2a1a10 }, acc: ['headband'] },
  { skin: 0x8a5a3a, shirt: 0x3fa7d6, pants: 0xc9b38a, hair: { style: 'short', color: 0x1a1210 } },
  { skin: 0xc68a5a, shirt: 0xd23a3a, pants: 0x2a2a35, hair: { style: 'long', color: 0x2a1a10 } },
];
const P = (a, b, fov = 50) => ({ pos: a, tgt: b, fov });
const dolly = (a, b) => (u, d) => camLerp(a, b, u / d);
const CUY = (x, z, yaw, o = {}) => { const d = o.d ?? 3.2, sx = o.side ?? 0.25, hy = (o.y ?? 0) + (o.hy ?? 1.94), fx = Math.sin(yaw), fz = Math.cos(yaw), rx = Math.cos(yaw), rz = -Math.sin(yaw);
  const at = (dd, ss) => P([x + fx * dd + rx * ss, hy - 0.09 * dd / 3.2, z + fz * dd + rz * ss], [x, hy - 0.49 * d / 3.2, z], o.fov ?? 50);
  return dolly(at(d, sx), at(d - (o.push ?? 0.5), sx * 0.5)); };
const M_ = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: o.r ?? 0.55, metalness: o.m ?? 0, emissive: o.em ?? 0, emissiveIntensity: o.ei ?? 1, transparent: !!o.t, opacity: o.op ?? 1 });
const DOF = { aperture: 0.002, maxblur: 0.006 };
const DAY = { bloom: 0.3, bloomThreshold: 1.8, exposure: 0.85, dof: DOF };
const SPACE = { night: true, bloom: 0.45, bloomThreshold: 0.95, exposure: 0.95, env: 0.08 };
const rnd = (seed) => { let s = seed; return () => ((s = (s * 9301 + 49297) % 233280) / 233280); };

function dynLabel(textFn, x, y, z, o = {}) {
  const c = document.createElement('canvas'); c.width = 1024; c.height = 512; const g = c.getContext('2d'); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  const m = new THREE.Mesh(new THREE.PlaneGeometry(o.w ?? 4, (o.w ?? 4) / 2), new THREE.MeshBasicMaterial({ map: t, transparent: true, fog: false })); m.position.set(x, y, z); if (o.yaw) m.rotation.y = o.yaw; add(m);
  let last = null;
  on((u) => { const s = textFn(u); if (s === last) return; last = s; g.clearRect(0, 0, 1024, 512); const lines = s.split('\n'), sz = o.size ?? 200;
    g.font = `${sz}px Poppins`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round';
    lines.forEach((ln, i) => { const y0 = 256 + (i - (lines.length - 1) / 2) * sz * 1.12; if (o.stroke !== false) { g.lineWidth = sz * 0.17; g.strokeStyle = o.stroke ?? '#1a1030'; g.strokeText(ln, 512, y0); } g.fillStyle = typeof o.color === 'function' ? o.color(s, i) : (o.color ?? '#ffffff'); g.fillText(ln, 512, y0); });
    t.needsUpdate = true; });
  if (o.billboard) onPost((u, d, cam) => m.quaternion.copy(cam.quaternion));
  return m;
}
function billboard(textFn, x, z, o = {}) {
  blk(0.3, 5.8, 0.3, M_(0x5a5a62), x - 2.8, 2.9, z, { k: 0.1 }); blk(0.3, 5.8, 0.3, M_(0x5a5a62), x + 2.8, 2.9, z, { k: 0.1 });
  blk(6.4, 3.2, 0.25, M_(0xffffff, { r: 0.4 }), x, 5.4, z, { k: 0.04 }); blk(6.6, 3.4, 0.2, M_(0x23356b), x, 5.4, z - 0.15, { k: 0.04 });
  return dynLabel(textFn, x, 5.4, z + 0.14, { w: 6.2, size: o.size ?? 104, color: o.color ?? '#1d1d2a', stroke: false });
}

// ------------------------------------------------------------------ the globe
const CONT = [
  [[-168, 65], [-140, 70], [-95, 72], [-80, 62], [-60, 55], [-65, 45], [-80, 32], [-81, 25], [-97, 26], [-105, 20], [-95, 16], [-83, 9], [-78, 8], [-90, 15], [-105, 22], [-115, 30], [-125, 40], [-125, 49], [-140, 59], [-160, 58]],
  [[-50, 60], [-20, 70], [-20, 82], [-60, 82], [-70, 76]],
  [[-80, 10], [-60, 11], [-50, 0], [-35, -7], [-40, -22], [-55, -35], [-68, -55], [-75, -50], [-72, -20], [-81, -5]],
  [[-10, 36], [-9, 44], [0, 50], [5, 58], [20, 70], [40, 68], [60, 70], [100, 78], [140, 72], [180, 68], [170, 60], [140, 50], [130, 35], [120, 25], [108, 18], [105, 8], [100, 15], [95, 20], [90, 22], [80, 8], [72, 20], [57, 25], [50, 30], [35, 30], [30, 40], [20, 38], [10, 44], [0, 38]],
  [[-17, 15], [-15, 28], [-5, 36], [10, 37], [32, 31], [43, 12], [51, 12], [40, -15], [32, -28], [20, -35], [12, -17], [9, 3], [-8, 5]],
  [[114, -22], [130, -12], [142, -11], [153, -28], [145, -38], [132, -32], [115, -35]],
];
const TEX = {};
function earthTex(kind) {
  if (TEX[kind]) return TEX[kind];
  const W2 = 2048, H2 = 1024, c = document.createElement('canvas'); c.width = W2; c.height = H2; const g = c.getContext('2d');
  const X = (lon) => (lon + 180) / 360 * W2, Y = (lat) => (90 - lat) / 180 * H2;
  if (kind === 'now') {
    g.fillStyle = g.createLinearGradient(0, 0, 0, H2); const gr = g.createLinearGradient(0, 0, 0, H2); gr.addColorStop(0, '#1a4a8a'); gr.addColorStop(0.5, '#1e6ab0'); gr.addColorStop(1, '#1a4a8a'); g.fillStyle = gr; g.fillRect(0, 0, W2, H2);
    CONT.forEach((poly, i) => { g.fillStyle = i === 1 ? '#f0f4f8' : '#4a9a3a'; g.beginPath(); poly.forEach(([lo, la], k) => k ? g.lineTo(X(lo), Y(la)) : g.moveTo(X(lo), Y(la))); g.closePath(); g.fill(); });
    g.fillStyle = 'rgba(210,180,110,0.85)'; g.beginPath(); g.ellipse(X(15), Y(22), 170, 60, 0, 0, 6.28); g.fill(); g.beginPath(); g.ellipse(X(45), Y(24), 70, 40, 0, 0, 6.28); g.fill(); g.beginPath(); g.ellipse(X(133), Y(-25), 90, 40, 0, 0, 6.28); g.fill();
    g.fillStyle = '#f4f8fc'; g.fillRect(0, Y(-66), W2, H2); g.fillRect(0, 0, W2, Y(80));
  } else {
    // the sphere Earth: one ocean between ~35S and 35N (deepest at the equator), two high continents, snowy towards the poles
    for (let y = 0; y < H2; y++) { const lat = 90 - y / H2 * 180, s2 = Math.sin(lat * Math.PI / 180) ** 2, h = -7.1 + 21.4 * s2;
      if (h < 0) { const k = Math.min(1, -h / 7.1); g.fillStyle = `rgb(${20 - 10 * k | 0},${110 - 60 * k | 0},${190 - 60 * k | 0})`; }
      else { const k = Math.min(1, h / 14.2); g.fillStyle = k < 0.15 ? '#d8c890' : k < 0.45 ? `rgb(${150 - 40 * k | 0},${130 - 40 * k | 0},${100 - 30 * k | 0})` : `rgb(${200 + 50 * k | 0},${200 + 50 * k | 0},${205 + 45 * k | 0})`; }
      g.fillRect(0, y, W2, 1); }
    g.globalAlpha = 0.18; g.strokeStyle = '#ffffff'; g.lineWidth = 3; CONT.forEach((poly) => { g.beginPath(); poly.forEach(([lo, la], k) => k ? g.lineTo(X(lo), Y(la)) : g.moveTo(X(lo), Y(la))); g.closePath(); g.stroke(); }); g.globalAlpha = 1;
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return (TEX[kind] = c, t);
}
const texOf = (kind) => { const c = TEX[kind]; if (c && c.getContext) { const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; } return earthTex(kind); };
function space(o = {}) { const S = getScene(); S.background = new THREE.Color(0x02030a); S.fog = null; stars(2500); S.userData.hemi.intensity = 0.06; S.userData.sun.intensity = 0;
  const key = new THREE.DirectionalLight(0xfff4e0, 3.2); key.position.set(-30, 10, 20); add(key); const fill = new THREE.DirectionalLight(0x6a8aff, 0.35); fill.position.set(30, -5, -10); add(fill); }
function globe(kind, R, o = {}) { const g = new THREE.Group(); g.position.set(...(o.pos ?? [0, 0, 0])); add(g);
  const m = new THREE.Mesh(new THREE.SphereGeometry(R, 96, 64), new THREE.MeshStandardMaterial({ map: texOf(kind), roughness: 0.75, transparent: o.op !== undefined, opacity: o.op ?? 1 })); g.add(m);
  const atm = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex(), color: 0x6ab0ff, transparent: true, opacity: 0.45, blending: THREE.AdditiveBlending, depthWrite: false })); atm.scale.setScalar(R * 2.9); g.add(atm);
  g.userData.mesh = m; return g; }
const ll = (lat, lon, r) => { const a = lat * Math.PI / 180, b = lon * Math.PI / 180; return new THREE.Vector3(r * Math.cos(a) * Math.sin(b + Math.PI / 2), r * Math.sin(a), r * Math.cos(a) * Math.cos(b + Math.PI / 2)); };

// E01: the billboard: Earth's two radii -> one
shot('E01', { scene: DAY, build() {
  street(); billboard((u) => u < 0.9 ? 'EARTH\n6378 × 6357 km' : 'EARTH\n6371 × 6371 km', 0, -7.8);
  [[PP[0], -2.5, -5.2, 0.3], [PP[2], 2.4, -5.4, -0.3], [ME, 0, -5.0, 0]].forEach(([d, x, z, yw]) => { const A = person(d, x, z, yw, 'idle'); A.pitch = -0.25; on((u) => { A.pose = u > 0.9 ? 'shock' : 'idle'; A.setFace(u > 0.9 ? 'shock' : 'smile'); }); });
  sparkles(0, 4, -7.5, { n: 80, R: 3, h: 3, color: 0xffe08a, amount: (u) => Math.max(0, 1 - Math.abs(u - 1.05) / 0.5) });
  shadowAt(0, -6, 10);
}, cam: dolly(P([0.2, 2.2, 3.4], [0, 3.7, -7.8], 58), P([0.1, 2.1, 2.2], [0, 3.8, -7.8], 58)) });
// E02: shrunk to a pool ball, Earth would be smoother than one
shot('E02', { scene: { interior: true, bloom: 0.35, bloomThreshold: 1.0, exposure: 0.95, env: 0.5, dof: { aperture: 0.004, maxblur: 0.008 } }, build() {
  const S = getScene(); S.background = new THREE.Color(0x140e0a); S.fog = new THREE.Fog(0x140e0a, 6, 20); S.userData.hemi.intensity = 0.25; S.userData.sun.intensity = 0;
  const felt = new THREE.Mesh(new THREE.PlaneGeometry(6, 4), M_(0x1e7a3a, { r: 0.95 })); felt.rotation.x = -Math.PI / 2; felt.position.y = 1; felt.receiveShadow = true; add(felt);
  blk(6.4, 0.3, 0.3, M_(0x5a2a14, { r: 0.5 }), 0, 1.1, -2.1); blk(0.3, 0.3, 4.4, M_(0x5a2a14, { r: 0.5 }), 3.1, 1.1, 0);
  const lamp = new THREE.SpotLight(0xfff0d0, 60, 8, 0.6, 0.5, 1.2); lamp.position.set(0, 3.6, 0); lamp.target.position.set(0, 1, 0); lamp.castShadow = true; add(lamp); add(lamp.target);
  const shade = new THREE.Mesh(new THREE.ConeGeometry(0.8, 0.5, 24, 1, true), M_(0x1a5a2a, { em: 0x1a3a1a })); shade.position.set(0, 3.7, 0); add(shade);
  const cue = new THREE.Mesh(new THREE.SphereGeometry(0.16, 48, 32), new THREE.MeshPhysicalMaterial({ color: 0xfafaf2, roughness: 0.08, clearcoat: 1 })); cue.position.set(-0.18, 1.16, 0.2); cue.castShadow = true; add(cue);
  const E = new THREE.Mesh(new THREE.SphereGeometry(0.16, 64, 48), new THREE.MeshPhysicalMaterial({ map: texOf('now'), roughness: 0.25, clearcoat: 0.8 })); E.position.set(0.18, 1.16, 0.2); E.castShadow = true; add(E);
  const b8 = new THREE.Mesh(new THREE.SphereGeometry(0.16, 32, 24), new THREE.MeshPhysicalMaterial({ color: 0x0a0a0a, roughness: 0.1, clearcoat: 1 })); b8.position.set(0.9, 1.16, -0.6); add(b8);
  on((u) => { E.rotation.y = u * 0.5; });
  dynLabel((u) => u < 2.4 ? 'POOL BALL\nvs EARTH' : 'SMOOTHER?', 0, 1.5, 0.1, { w: 0.5, size: 170, color: '#ffffff', billboard: true });
}, cam: dolly(P([0.15, 1.5, 1.9], [0, 1.3, 0.2], 40), P([0.05, 1.45, 1.55], [0, 1.28, 0.2], 40)), focus: () => 1.5 });
// E03: it bulges at the equator by 21 km (exaggerated)
shot('E03', { scene: SPACE, build() {
  space(); const G = globe('now', 3); G.scale.set(1.12, 0.88, 1.12);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(3.03, 0.035, 8, 128), new THREE.MeshBasicMaterial({ color: 0xffd23a })); ring.rotation.x = Math.PI / 2; G.add(ring);
  on((u) => { G.userData.mesh.rotation.y = u * 0.4; G.scale.set(lerp(1, 1.12, sm(0.6, 2.6, u)), lerp(1, 0.88, sm(0.6, 2.6, u)), lerp(1, 1.12, sm(0.6, 2.6, u))); });
  dynLabel(() => '+21 km\nAT THE EQUATOR', 0, -4.7, 0, { w: 6.8, size: 120, color: '#ffd23a', billboard: true });
}, cam: dolly(P([0, 0.6, 15], [0, -1.0, 0], 50), P([0.5, 0.4, 13.8], [0, -1.0, 0], 50)) });
// E04: the farthest point from the centre: not Everest, Chimborazo (Ecuador) on the bulge
shot('E04', { scene: SPACE, build() {
  space(); const G = globe('now', 3, { op: 0.55 }); G.scale.set(1.12, 0.88, 1.12);
  const mk = (lat, lon, h, col, name, side) => { const base = ll(lat, lon, 3), dir = base.clone().normalize(); const cone = new THREE.Mesh(new THREE.ConeGeometry(0.2, h, 12), M_(col, { r: 0.6 })); cone.position.copy(base.clone().addScaledVector(dir, h / 2)); cone.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir); G.add(cone);
    const tip = base.clone().addScaledVector(dir, h); const line = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1, 8), new THREE.MeshBasicMaterial({ color: col })); G.add(line); return { tip, line, name }; };
  const ev = mk(28, 87, 0.45, 0xf4f8fc, 'EVEREST'), ch = mk(-1.5, -78.8, 0.45, 0xff7a3a, 'CHIMBORAZO');
  const Y = new THREE.Vector3(0, 1, 0), O = new THREE.Vector3();
  on((u) => { for (const [M, k] of [[ev, sm(0.4, 1.4, u)], [ch, sm(1.8, 2.8, u)]]) { const end = M.tip.clone().multiplyScalar(k); M.line.position.copy(end).multiplyScalar(0.5); M.line.scale.set(1, Math.max(0.001, end.length()), 1); M.line.quaternion.setFromUnitVectors(Y, M.tip.clone().normalize()); } G.rotation.y = 0.05 * u; });
  dynLabel((u) => 'EVEREST\n6382 km', -0.8, 4.4, 0, { w: 5.5, size: 120, color: '#ffffff', billboard: true });
  dynLabel((u) => u < 1.8 ? '' : 'ECUADOR\n6384 km', 0.6, -4.5, 0, { w: 5.5, size: 120, color: '#ff9a5a', billboard: true });
}, cam: dolly(P([0.2, 0.6, 15], [0, -0.4, 0], 52), P([0.2, 0.4, 13.8], [0, -0.4, 0], 52)) });
// E05-E06: make the ground a perfect sphere while it spins: the sea stays bulged -> poles stick out, equator drowns
function morphGlobe(k0, k1) {
  space(); const G = new THREE.Group(); add(G);
  const land = new THREE.Mesh(new THREE.SphereGeometry(3, 96, 64), new THREE.MeshStandardMaterial({ map: texOf('now'), roughness: 0.8 })); G.add(land);
  const sea = new THREE.Mesh(new THREE.SphereGeometry(3, 96, 64), new THREE.MeshPhysicalMaterial({ color: 0x2a7ad0, roughness: 0.08, transparent: true, opacity: 0.82, clearcoat: 1 })); sea.scale.set(1.07, 0.9, 1.07); G.add(sea);
  const atm = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex(), color: 0x6ab0ff, transparent: true, opacity: 0.4, blending: THREE.AdditiveBlending, depthWrite: false })); atm.scale.setScalar(9); G.add(atm);
  on((u) => { const k = sm(k0, k1, u); land.scale.set(lerp(1.065, 1.0, k), lerp(0.895, 1.0, k), lerp(1.065, 1.0, k)); sea.visible = k > 0.001 || true; land.rotation.y = sea.rotation.y = u * 0.35; });
  return G;
}
shot('E05', { scene: SPACE, build() { morphGlobe(0.8, 4.6); dynLabel((u) => 'PERFECT\nSPHERE', 0, 4.6, 0, { w: 6, size: 170, color: '#ffffff', billboard: true }); }, cam: dolly(P([0, 0.5, 14], [0, -0.2, 0], 50), P([0, 0.6, 13], [0, -0.2, 0], 50)) });
shot('E06', { scene: SPACE, build() { morphGlobe(-3, 0.5); }, cam: dolly(P([4.5, 7.5, 10.5], [0, 0.0, 0], 46), P([5.4, 5.2, 10.5], [0, -0.2, 0], 46)) });
// E07: Brazil, India, most of Africa under 7 km of water (a tropical town as the sea climbs over it)
function palm(x, z, s = 1) { const g = new THREE.Group(); g.position.set(x, 0, z); g.scale.setScalar(s); add(g); const tr = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.25, 5, 8), M_(0x8a6a3a)); tr.position.y = 2.5; tr.rotation.z = 0.12; g.add(tr);
  for (let i = 0; i < 7; i++) { const l = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.08, 0.5), M_(0x3a9a3a)); l.position.set(Math.cos(i) * 1.0 + 0.3, 4.9, Math.sin(i) * 1.0); l.rotation.set(0, -i, -0.4); g.add(l); } }
shot('E07', { scene: { ...DAY, sky: ['#7ab8f0', '#f8f0d8'] }, build() {
  street({ n: 8, grass: 0x7ac85a }); for (let i = -4; i <= 4; i++) { palm(i * 15 + 4, -11, 1.0); palm(i * 15 - 3, 11, 0.9); }
  const sea = waterPlane(400, 110, new THREE.MeshStandardMaterial({ color: 0x1e78a8, roughness: 0.1, metalness: 0.3, transparent: true, opacity: 0.92 }), 0.2, {});
  const S = getScene(), fogC = new THREE.Color(0x0e3a6a);
  on((u, d) => { const y = lerp(-0.5, 11.5, sm(0.2, d - 0.2, u)); sea.position.y = y; if (y > 9.4) { S.fog.color.copy(fogC); S.fog.near = 0; S.fog.far = 25; S.background = fogC; } });
  dynLabel((u) => '-7 km', 0, 11.5, -6, { w: 7, size: 230, color: '#7ad0ff', stroke: '#0a2a5a' });
}, cam: dolly(P([-0.5, 9.4, 30], [0, 3, -10], 54), P([-0.5, 9.2, 27], [0, 3, -10], 54)) });
// E08: everything above 35 degrees: two giant continents
shot('E08', { scene: SPACE, build() { space(); const G = globe('sphere', 3); on((u) => { G.userData.mesh.rotation.y = u * 0.3; G.rotation.x = 0.35 * Math.sin(u * 0.4); });
  for (const s of [-1, 1]) { const r = new THREE.Mesh(new THREE.TorusGeometry(3 * Math.cos(35 * Math.PI / 180) + 0.02, 0.025, 6, 128), new THREE.MeshBasicMaterial({ color: 0xffd23a })); r.rotation.x = Math.PI / 2; r.position.y = s * 3 * Math.sin(35 * Math.PI / 180); G.add(r); }
  dynLabel(() => 'CONTINENT\n↑ 35°N', 0, 4.5, 0, { w: 7, size: 130, color: '#ffd23a', billboard: true }); dynLabel(() => '35°S ↓\nCONTINENT', 0, -4.5, 0, { w: 7, size: 130, color: '#ffd23a', billboard: true });
}, cam: dolly(P([0, 2.0, 15], [0, -0.3, 0], 52), P([0.4, 1.4, 14], [0, -0.3, 0], 52)) });
// E09: London, 6 km up: a town on a plateau above a sea of clouds, thin dark-blue sky
function clouds(y, n, R0, R1, seed) { const r = rnd(seed), m = M_(0xffffff, { r: 0.95 }); for (let i = 0; i < n; i++) { const a = r() * 6.28, d = R0 + r() * (R1 - R0); const c = new THREE.Mesh(new THREE.SphereGeometry(3 + r() * 5, 14, 10), m); c.scale.y = 0.35; c.position.set(Math.cos(a) * d, y + r() * 2, Math.sin(a) * d); add(c); } }
shot('E09', { scene: { sky: ['#0a1a5a', '#4a7ad0'], bloom: 0.35, bloomThreshold: 1.6, exposure: 0.85, env: 0.3, dof: DOF, fog0: 120, fog1: 500 }, build() {
  const S = getScene(); S.fog.color.set(0x6a8ad0);
  const plat = new THREE.Mesh(new THREE.CylinderGeometry(22, 26, 30, 32), M_(0x6a8a4a, { r: 0.9 })); plat.position.y = -15; plat.receiveShadow = true; add(plat);
  const road = new THREE.Mesh(new THREE.PlaneGeometry(44, 6), M_(0x3c3f45, { r: 0.9 })); road.rotation.x = -Math.PI / 2; road.position.y = 0.02; add(road);
  for (let i = -2; i <= 2; i++) house(i * 9, -8, 0, { seed: i + 30, fence: false, color: 0xb8a088 });
  const tower = blk(2.2, 14, 2.2, M_(0xc8a868, { r: 0.6 }), 10, 7, -12, { k: 0.02 }); const face = new THREE.Mesh(new THREE.CircleGeometry(0.8, 32), M_(0xf6efdc)); face.position.set(10, 11.5, -10.88); add(face);
  const roof = new THREE.Mesh(new THREE.ConeGeometry(1.6, 3.4, 4), M_(0x3a4a5a)); roof.rotation.y = 0.785; roof.position.set(10, 15.7, -12); add(roof);
  const bus = blk(5, 2.6, 1.8, M_(0xd8282a, { r: 0.4 }), -4, 1.5, 0.4, { k: 0.1 }); blk(5.05, 0.5, 1.85, M_(0x9fd3ff, { r: 0.1 }), -4, 1.9, 0.4);
  clouds(-16, 110, 24, 140, 3);
  const A = person(ME, -2.0, 19.0, Math.PI - 0.3, 'idle', { face: 'shock' }); on((u) => { A.setFace(u < 1.6 ? 'shock' : 'sad'); A.body.position.y = Math.abs(Math.sin(u * 7)) * 0.08; });
  dynLabel(() => 'LONDON\n6 km ↑', 0, 3.2, 34, { w: 9, size: 150, color: '#ffffff', stroke: '#c8281a', yaw: Math.PI });
  shadowAt(0, 12, 16);
}, cam: dolly(P([-3.0, 2.6, 13.5], [2, -3, 60], 54), P([-2.4, 2.5, 14.5], [2, -3.2, 60], 54)), focus: () => 7 });
// E10: the North Pole, 14 km high: black sky in daytime, almost no air
shot('E10', { scene: { sky: ['#000008', '#1a2a6a'], bloom: 0.45, bloomThreshold: 1.3, exposure: 0.9, env: 0.3, dof: DOF, fog0: 200, fog1: 700 }, build() {
  const S = getScene(); stars(1800); S.userData.sun.intensity = 3.0; S.userData.sun.color.set(0xffffff); S.userData.hemi.intensity = 0.5; S.userData.hemi.color.set(0x8aa0ff);
  ground({ road: false, grass: 0xf4f8fc }); const r = rnd(4); for (let i = 0; i < 30; i++) { const m = new THREE.Mesh(new THREE.DodecahedronGeometry(1 + r() * 2, 0), M_(0xe8f0f8, { r: 0.4 })); m.scale.y = 0.4; m.position.set((r() - 0.5) * 60, 0, -8 - r() * 60); add(m); }
  const pole = blk(0.15, 3, 0.15, M_(0xd8d8d8, { m: 0.6 }), 1.6, 1.5, -5); const flag = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 0.6), new THREE.MeshStandardMaterial({ color: 0xd82a2a, side: THREE.DoubleSide })); flag.position.set(2.1, 2.7, -5); add(flag);
  const sunS = new THREE.Mesh(new THREE.SphereGeometry(6, 24, 16), new THREE.MeshBasicMaterial({ color: new THREE.Color(4, 3.8, 3.4), fog: false })); sunS.position.set(-60, 30, -220); add(sunS);
  const A = person({ ...ME, acc: ['headband'] }, 0, -3.5, 0.2, 'shock', { face: 'shock' }); on((u) => { A.pose = u < 1.8 ? 'shock' : 'idle'; A.setFace(u < 1.8 ? 'shock' : 'cry'); A.pitch = u > 1.8 ? 0.35 : 0; });
  dust(400, 0, 1.2, -6, 20, 2, 16, { color: 0xffffff, size: 0.05, rise: 0.02, opacity: 0.6, seed: 9 });
  dynLabel(() => 'NORTH POLE\n14 km ↑', -1.0, 4.4, -9, { w: 4.4, size: 120, color: '#ffffff', stroke: '#1a3a8a' });
}, cam: CUY(0, -3.5, 0.2, { d: 4.6, side: 0.6, push: 0.6, fov: 54 }) });
// E11: a perfect planet: half drowns, half suffocates
shot('E11', { scene: SPACE, build() { space(); const G = globe('sphere', 3); on((u) => { G.userData.mesh.rotation.y = u * 0.25; }); dynLabel((u) => u < 1.6 ? '' : 'PERFECT.', 0, -4.3, 0, { w: 5, size: 180, color: '#ffffff', billboard: true }); },
  cam: dolly(P([0, 1.0, 11.5], [0, -0.8, 0], 50), P([0, 2.0, 16], [0, -1.0, 0], 50)), fx: (u, d) => ({ fade: sm(d - 0.8, d, u) }) });
