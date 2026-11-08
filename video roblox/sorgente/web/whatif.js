// Shared helpers for the "What if" Roblox videos (labels, billboard, globe, space, palms, clouds).
import { THREE, shot, person, street, ground, house, tree, label, glowTex, stars, add, on, onPost, camLerp, sm, lerp, getScene, shadowAt } from './kit.js';
import { blk, dust, sparkles } from './sets.js';
export const ME = { skin: 0xf2c79a, shirt: 0x2fa84f, pants: 0x2f4a8a, hair: { style: 'bowl', color: 0x6b3a1e }, logo: 0xffd23a };
export const PP = [
  { skin: 0xf2c79a, shirt: 0xf28c28, pants: 0x2f4a8a, hair: { style: 'spiky', color: 0x2a1a10 }, acc: ['headband'] },
  { skin: 0x8a5a3a, shirt: 0x3fa7d6, pants: 0xc9b38a, hair: { style: 'short', color: 0x1a1210 } },
  { skin: 0xc68a5a, shirt: 0xd23a3a, pants: 0x2a2a35, hair: { style: 'long', color: 0x2a1a10 } },
];
export const P = (a, b, fov = 50) => ({ pos: a, tgt: b, fov });
export const dolly = (a, b) => (u, d) => camLerp(a, b, u / d);
export const CUY = (x, z, yaw, o = {}) => { const d = o.d ?? 3.2, sx = o.side ?? 0.25, hy = (o.y ?? 0) + (o.hy ?? 1.94), fx = Math.sin(yaw), fz = Math.cos(yaw), rx = Math.cos(yaw), rz = -Math.sin(yaw);
  const at = (dd, ss) => P([x + fx * dd + rx * ss, hy - 0.09 * dd / 3.2, z + fz * dd + rz * ss], [x, hy - 0.49 * d / 3.2, z], o.fov ?? 50);
  return dolly(at(d, sx), at(d - (o.push ?? 0.5), sx * 0.5)); };
export const M_ = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: o.r ?? 0.55, metalness: o.m ?? 0, emissive: o.em ?? 0, emissiveIntensity: o.ei ?? 1, transparent: !!o.t, opacity: o.op ?? 1 });
export const DOF = { aperture: 0.002, maxblur: 0.006 };
export const DAY = { bloom: 0.3, bloomThreshold: 1.8, exposure: 0.85, dof: DOF };
export const SPACE = { night: true, bloom: 0.45, bloomThreshold: 0.95, exposure: 0.95, env: 0.08 };
export const rnd = (seed) => { let s = seed; return () => ((s = (s * 9301 + 49297) % 233280) / 233280); };

export function dynLabel(textFn, x, y, z, o = {}) {
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
export function billboard(textFn, x, z, o = {}) {
  blk(0.3, 5.8, 0.3, M_(0x5a5a62), x - 2.8, 2.9, z, { k: 0.1 }); blk(0.3, 5.8, 0.3, M_(0x5a5a62), x + 2.8, 2.9, z, { k: 0.1 });
  blk(6.4, 3.2, 0.25, M_(0xffffff, { r: 0.4 }), x, 5.4, z, { k: 0.04 }); blk(6.6, 3.4, 0.2, M_(0x23356b), x, 5.4, z - 0.15, { k: 0.04 });
  return dynLabel(textFn, x, 5.4, z + 0.14, { w: 6.2, size: o.size ?? 104, color: o.color ?? '#1d1d2a', stroke: false });
}

// ------------------------------------------------------------------ the globe
export const CONT = [
  [[-168, 65], [-140, 70], [-95, 72], [-80, 62], [-60, 55], [-65, 45], [-80, 32], [-81, 25], [-97, 26], [-105, 20], [-95, 16], [-83, 9], [-78, 8], [-90, 15], [-105, 22], [-115, 30], [-125, 40], [-125, 49], [-140, 59], [-160, 58]],
  [[-50, 60], [-20, 70], [-20, 82], [-60, 82], [-70, 76]],
  [[-80, 10], [-60, 11], [-50, 0], [-35, -7], [-40, -22], [-55, -35], [-68, -55], [-75, -50], [-72, -20], [-81, -5]],
  [[-10, 36], [-9, 44], [0, 50], [5, 58], [20, 70], [40, 68], [60, 70], [100, 78], [140, 72], [180, 68], [170, 60], [140, 50], [130, 35], [120, 25], [108, 18], [105, 8], [100, 15], [95, 20], [90, 22], [80, 8], [72, 20], [57, 25], [50, 30], [35, 30], [30, 40], [20, 38], [10, 44], [0, 38]],
  [[-17, 15], [-15, 28], [-5, 36], [10, 37], [32, 31], [43, 12], [51, 12], [40, -15], [32, -28], [20, -35], [12, -17], [9, 3], [-8, 5]],
  [[114, -22], [130, -12], [142, -11], [153, -28], [145, -38], [132, -32], [115, -35]],
];
export const TEX = {};
export function earthTex(kind) {
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
export const texOf = (kind) => { const c = TEX[kind]; if (c && c.getContext) { const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; } return earthTex(kind); };
export function space(o = {}) { const S = getScene(); S.background = new THREE.Color(0x02030a); S.fog = null; stars(2500); S.userData.hemi.intensity = 0.06; S.userData.sun.intensity = 0;
  const key = new THREE.DirectionalLight(0xfff4e0, 3.2); key.position.set(-30, 10, 20); add(key); const fill = new THREE.DirectionalLight(0x6a8aff, 0.35); fill.position.set(30, -5, -10); add(fill); }
export function globe(kind, R, o = {}) { const g = new THREE.Group(); g.position.set(...(o.pos ?? [0, 0, 0])); add(g);
  const m = new THREE.Mesh(new THREE.SphereGeometry(R, 96, 64), new THREE.MeshStandardMaterial({ map: texOf(kind), roughness: 0.75, transparent: o.op !== undefined, opacity: o.op ?? 1 })); g.add(m);
  const atm = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex(), color: 0x6ab0ff, transparent: true, opacity: 0.45, blending: THREE.AdditiveBlending, depthWrite: false })); atm.scale.setScalar(R * 2.9); g.add(atm);
  g.userData.mesh = m; return g; }
export const ll = (lat, lon, r) => { const a = lat * Math.PI / 180, b = lon * Math.PI / 180; return new THREE.Vector3(r * Math.cos(a) * Math.sin(b + Math.PI / 2), r * Math.sin(a), r * Math.cos(a) * Math.cos(b + Math.PI / 2)); };

export function palm(x, z, s = 1) { const g = new THREE.Group(); g.position.set(x, 0, z); g.scale.setScalar(s); add(g); const tr = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.25, 5, 8), M_(0x8a6a3a)); tr.position.y = 2.5; tr.rotation.z = 0.12; g.add(tr);
  for (let i = 0; i < 7; i++) { const l = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.08, 0.5), M_(0x3a9a3a)); l.position.set(Math.cos(i) * 1.0 + 0.3, 4.9, Math.sin(i) * 1.0); l.rotation.set(0, -i, -0.4); g.add(l); } }
export function clouds(y, n, R0, R1, seed) { const r = rnd(seed), m = M_(0xffffff, { r: 0.95 }); for (let i = 0; i < n; i++) { const a = r() * 6.28, d = R0 + r() * (R1 - R0); const c = new THREE.Mesh(new THREE.SphereGeometry(3 + r() * 5, 14, 10), m); c.scale.y = 0.35; c.position.set(Math.cos(a) * d, y + r() * 2, Math.sin(a) * d); add(c); } }
