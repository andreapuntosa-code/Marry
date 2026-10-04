// Builders for the Day 365 film: the Wall, Rootholm (treehouse city), Goldmere (the plain's city),
// the shrines, palisades, traps, fields, plus light shafts and floating motes.
import * as THREE from 'three';
import { height, ARENA, creekX } from './terrain.js';
export { creekX };
export const ARENA_WATER = ARENA.waterY;
import { mulberry32, smoothstep, lerp } from './noise.js';
import { PROTO, buildingMaterial } from './buildings.js';
import { vegMaterial, leafMaterial, shadowProxyMaterial } from './nature.js';
import { E } from '../main.js';
import { radialTex } from './sky.js';

const WX = ARENA.wx;
const MATS = {};
const std = (key, o) => MATS[key] || (MATS[key] = new THREE.MeshStandardMaterial(o));
export const M = {
  wood: () => std('wood', { color: 0x8a6038, roughness: 0.85 }),
  dark: () => std('dark', { color: 0x4a3322, roughness: 0.9 }),
  plank: () => std('plank', { color: 0xa97a4a, roughness: 0.85 }),
  rope: () => std('rope', { color: 0xc9b184, roughness: 0.95 }),
  thatch: () => std('thatch', { color: 0xcdb061, roughness: 1.0 }),
  clay: () => std('clay', { color: 0xc99a64, roughness: 0.95 }),
  stone: () => std('stone', { color: 0x8d8f94, roughness: 0.9 }),
  stoneD: () => std('stoneD', { color: 0x5d6068, roughness: 0.9 }),
  gold: () => std('gold', { color: 0xf3c24a, roughness: 0.28, metalness: 0.85, emissive: 0x6a3d00, emissiveIntensity: 0.5 }),
  white: () => std('white', { color: 0xf4f1e8, roughness: 0.85, side: THREE.DoubleSide }),
  moss: () => std('moss', { color: 0x4f7a3a, roughness: 1.0 }),
  iron: () => std('iron', { color: 0x70747c, roughness: 0.4, metalness: 0.8 }),
  cloth: (hex) => std('cl' + hex, { color: hex, roughness: 0.8, side: THREE.DoubleSide }),
  glow: (hex, i = 1.6) => std('gl' + hex + i, { color: hex, emissive: hex, emissiveIntensity: i, roughness: 0.4 }),
};
const V = (x, y, z) => new THREE.Vector3(x, y, z);

function mesh(c, geo, mat, x, y, z, o = {}) {
  const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z);
  if (o.rx) m.rotation.x = o.rx; if (o.ry) m.rotation.y = o.ry; if (o.rz) m.rotation.z = o.rz;
  m.castShadow = o.shadow ?? true; m.receiveShadow = true; c.own(geo);
  return o.parent ? (o.parent.add(m), m) : c.add(m);
}
const box = (c, w, h, d, mat, x, y, z, o) => mesh(c, new THREE.BoxGeometry(w, h, d), mat, x, y, z, o);
const cyl = (c, r0, r1, h, mat, x, y, z, o, seg = 10) => mesh(c, new THREE.CylinderGeometry(r1, r0, h, seg), mat, x, y, z, o);

// ---------------------------------------------------------------- the Wall
function wallTexture() {
  const S = 512, cv = document.createElement('canvas'); cv.width = cv.height = S; const g = cv.getContext('2d');
  g.fillStyle = '#000'; g.fillRect(0, 0, S, S);
  const r = mulberry32(5); g.lineCap = 'round';
  g.strokeStyle = '#ff9a3c'; g.lineWidth = 3; g.strokeRect(1, 1, S - 2, S - 2);                         // glowing seams between blocks
  g.strokeStyle = '#ff7a1a'; g.lineWidth = 2;
  for (let k = 0; k < 5; k++) { let x = r() * S, y = r() * S * 0.4; g.beginPath(); g.moveTo(x, y); for (let i = 0; i < 9; i++) { x += (r() - 0.5) * 50; y += 18 + r() * 34; g.lineTo(x, y); } g.stroke(); }
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
}
function wallColorTexture() {
  const S = 256, cv = document.createElement('canvas'); cv.width = cv.height = S; const g = cv.getContext('2d');
  const im = g.createImageData(S, S), r = mulberry32(9);
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) { const n = 0.5 + 0.5 * Math.sin(x * 0.07 + Math.sin(y * 0.05) * 2) * 0.4 + (r() - 0.5) * 0.35; const v = Math.floor(18 + 26 * n); const i = (y * S + x) * 4; im.data[i] = v; im.data[i + 1] = v + 1; im.data[i + 2] = v + 6; im.data[i + 3] = 255; }
  g.putImageData(im, 0, 0);
  g.strokeStyle = 'rgba(0,0,0,0.65)'; g.lineWidth = 3; g.strokeRect(0, 0, S, S);
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
}
// returns {setDay(d), setGlow(a), collapse(t, t0, zc), group}; the marks are the days left (one dark per sunrise)
export function wall(c, o = {}) {
  const z0 = o.z0 ?? -300, z1 = o.z1 ?? 900, DZ = 4, DY = 4, DX = 8, ROWS = 7;
  const nz = Math.round((z1 - z0) / DZ), n = nz * ROWS;
  const geo = new THREE.BoxGeometry(DX, DY, DZ); c.own(geo);
  const mat = new THREE.MeshStandardMaterial({ color: 0x9aa4bd, map: wallColorTexture(), emissive: 0xff7a1a, emissiveMap: wallTexture(), emissiveIntensity: o.glow ?? 0.0, roughness: 0.55, metalness: 0.15 });
  mat.map.repeat.set(1, 1); c.own(mat);
  const im = new THREE.InstancedMesh(geo, mat, n); im.castShadow = true; im.receiveShadow = true; im.frustumCulled = false;
  const base = [], rr = mulberry32(31);
  for (let i = 0; i < nz; i++) { const z = z0 + (i + 0.5) * DZ; const gy = Math.max(height(WX - 6, z), height(WX + 6, z), ARENA.floorY) - 1.5; for (let r = 0; r < ROWS; r++) base.push({ x: WX, y: gy + DY * (r + 0.5), z, h: rr(), h2: rr(), r }); }
  const mtx = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(1, 1, 1), p = new THREE.Vector3(), eu = new THREE.Euler();
  const place = (t, t0, zc) => {
    for (let i = 0; i < n; i++) {
      const b = base[i]; let x = b.x, y = b.y, z = b.z, rx = 0, rz = 0, ry = 0;
      if (t !== undefined) {
        const delay = Math.abs(b.z - zc) / 75 + (6 - b.r) * 0.03 * (0.5 + b.h) + b.h * 0.9, u = t - t0 - delay;
        if (u > 0) {
          const dir = b.h2 < 0.5 ? -1 : 1, fall = 0.5 * 18 * u * u, ground = b.y - b.r * 0 - fall;
          const landY = Math.max(0.2, b.y - fall); const stackY = (height(b.x + dir * 12, b.z) + 1.4 + (b.h * 3.5) * (1 - Math.min(1, Math.abs(b.z - zc) / 260)));
          y = Math.max(stackY, landY); const lu = Math.min(1, u / 1.6);
          x = b.x + dir * (3 + 14 * (1 - Math.exp(-u * 1.1)) * (0.5 + b.h)); z = b.z + (b.h - 0.5) * 6 * lu;
          rz = -dir * Math.min(1.5 + b.h, u * (1.2 + b.h)); rx = (b.h2 - 0.5) * Math.min(1.5, u * 1.3); ry = (b.h - 0.5) * 0.9 * lu;
        }
      }
      eu.set(rx, ry, rz); q.setFromEuler(eu); p.set(x, y, z); im.setMatrixAt(i, mtx.compose(p, q, s));
    }
    im.instanceMatrix.needsUpdate = true;
  };
  place(); c.add(im);
  // the marks (365): face both sides at height 11
  const mg = new THREE.PlaneGeometry(1.3, 5.2); c.own(mg);
  const mm = new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: true, fog: false }); c.own(mm);
  const marks = new THREE.InstancedMesh(mg, mm, 365 * 2); marks.frustumCulled = false; marks.castShadow = false;
  const mz0 = o.mz0 ?? -150, mz1 = o.mz1 ?? 750;
  const markPos = [];
  for (let d = 0; d < 365; d++) { const z = mz0 + (mz1 - mz0) * (d + 0.5) / 365; const y = Math.max(height(WX - 6, z), height(WX + 6, z), ARENA.floorY) - 1.5 + 12; markPos.push([z, y]); }
  const setDay = (day) => {
    const on = new THREE.Color(0xff9a2e), off = new THREE.Color(0x15130f);
    for (let d = 0; d < 365; d++) {
      const lit = d >= Math.floor(day) && !(o.dead);
      for (const sd of [0, 1]) {
        const k = d * 2 + sd; const [z, y] = markPos[d];
        q.setFromAxisAngle(V(0, 1, 0), sd ? Math.PI / 2 : -Math.PI / 2); p.set(WX + (sd ? 4.06 : -4.06), y, z); marks.setMatrixAt(k, mtx.compose(p, q, s));
        marks.setColorAt(k, lit ? on : off);
      }
    }
    marks.instanceMatrix.needsUpdate = true; marks.instanceColor.needsUpdate = true;
  };
  setDay(o.day ?? 0); c.add(marks);
  const topY = Math.max(height(WX - 6, 300), height(WX + 6, 300), ARENA.floorY) - 1.5 + DY * ROWS + 0.12;
  const topLine = new THREE.Mesh(new THREE.BoxGeometry(8.3, 0.28, z1 - z0), new THREE.MeshBasicMaterial({ color: 0xff8a2a, fog: false, transparent: true, opacity: o.glow ?? 0 })); topLine.position.set(WX, topY, (z0 + z1) / 2); c.add(topLine); c.own(topLine.geometry);
  return {
    mesh: im, marks, setDay, setGlow(a) { mat.emissiveIntensity = a; topLine.material.opacity = Math.min(1, a); },
    collapse(t, t0, zc) { place(t, t0, zc); if (t - t0 > 0.3 && !mat._ruin) { mat._ruin = 1; mat.color.set(0xd9cdb8); mat.map = null; mat.emissiveMap = null; mat.emissive.set(0x4a4034); mat.emissiveIntensity = 0.55; mat.needsUpdate = true; } marks.visible = (t - t0) < 0.2; },
    rise(t, t0, zc, span = 1.4) {   // the wall grows out of the ground, block by block, outward from zc
      for (let i = 0; i < n; i++) { const b = base[i], delay = Math.abs(b.z - zc) / 160 + b.r * 0.1 + b.h * 0.25; let u = Math.max(0, Math.min(1, (t - t0 - delay) / span)); u = 1 - Math.pow(1 - u, 3); p.set(b.x, b.y - (1 - u) * 34, b.z); q.identity(); im.setMatrixAt(i, mtx.compose(p, q, s)); }
      im.instanceMatrix.needsUpdate = true; marks.visible = (t - t0) > 5;
    },
  };
}
// a billowing dust cloud (sprites) along the wall that rolls outward after t0
export function dust(c, z0, z1, t0, o = {}) {
  const tex = radialTex(128, [[0, 'rgba(210,190,160,0.85)'], [0.5, 'rgba(190,170,140,0.5)'], [1, 'rgba(170,150,120,0)']]);
  const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, opacity: 0.8, fog: true }); c.own(mat);
  const r = mulberry32(44), N = o.n ?? 70, sp = [];
  for (let i = 0; i < N; i++) { const s = new THREE.Sprite(mat.clone()); s.position.set(WX, 3, z0 + (z1 - z0) * r()); s.userData = { dir: r() < 0.5 ? -1 : 1, v: 4 + r() * 12, rise: 3 + r() * 8, sz: 22 + r() * 40, ph: r() * 3, z: s.position.z }; c.add(s); sp.push(s); }
  c.on((t) => { const u = t - t0; for (const s of sp) { const d = s.userData, k = Math.max(0, u - d.ph * 0.25); s.visible = k > 0; const grow = 1 - Math.exp(-k * 0.5); s.position.set(WX + d.dir * d.v * k * 0.9, 3 + d.rise * grow * 1.6, d.z); s.scale.setScalar(d.sz * (0.4 + grow * 1.2)); s.material.opacity = (o.alpha ?? 0.75) * Math.min(1, k * 2) * Math.exp(-k * 0.09); } });
  return sp;
}

// ---------------------------------------------------------------- big trees (Rootholm, the Hollow Oak)
export function bigTree(c, x, z, s = 26, variant = 0, kind = 'oak0', tint = 1) {
  const list = E.veg.geos[kind]; const e = list[variant % list.length];
  const g = new THREE.Group(); const y = height(x, z) - 0.04 * s;
  const mk = (geo, mat, shadow = true) => { const m = new THREE.Mesh(geo, mat); m.castShadow = shadow; m.receiveShadow = true; m.scale.setScalar(s); m.position.set(x, y, z); c.add(m); return m; };
  if (e.leaves) { if (e.wood) mk(e.wood, vegMaterial('tree')); mk(e.leaves, leafMaterial(e.leafKind), false); if (e.proxy) mk(e.proxy, shadowProxyMaterial()); }
  else mk(e, vegMaterial('tree'));
  return { x, z, y, s, trunkR: 0.045 * s * 1.1 };
}
// a round plank platform around a trunk at height h (above ground)
export function platform(c, x, z, h, R = 3.6, o = {}) {
  const y = height(x, z) + h, g = new THREE.Group(); g.position.set(x, y, z); c.add(g);
  cyl(c, R, R, 0.3, M.plank(), 0, 0, 0, { parent: g }, 18);
  cyl(c, R + 0.05, R + 0.05, 0.1, M.dark(), 0, -0.2, 0, { parent: g }, 18);
  for (let i = 0; i < 18; i++) { const a = i / 18 * Math.PI * 2; if (o.gap !== undefined && Math.abs(Math.atan2(Math.sin(a - o.gap), Math.cos(a - o.gap))) < 0.5) continue; cyl(c, 0.07, 0.07, 1.0, M.dark(), Math.cos(a) * (R - 0.1), 0.55, Math.sin(a) * (R - 0.1), { parent: g, shadow: false }, 5); }
  for (let k = 0; k < 6; k++) { const a = k / 6 * Math.PI * 2 + 0.3; box(c, 0.16, 0.2, R * 1.1, M.dark(), Math.cos(a) * R * 0.3, -0.35, Math.sin(a) * R * 0.3, { parent: g, ry: -a, shadow: false }); }
  if (o.hut) { const hm = new THREE.Mesh(PROTO.hut[o.hut % 3], buildingMaterial()); hm.scale.setScalar(o.hutS ?? 0.62); hm.position.set(o.hutX ?? R * 0.35, 0.15, o.hutZ ?? 0); hm.rotation.y = o.hutYaw ?? 0.5; hm.castShadow = true; hm.receiveShadow = true; g.add(hm); }
  if (o.lantern) { const l = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 6), M.glow(0xffb347, 2.4)); l.position.set(-R * 0.6, 1.4, R * 0.3); g.add(l); c.own(l.geometry); }
  return g;
}
// a rope bridge a->b ([x,yAbs,z]) with sag; cut(t) drops the planks from time tc
export function ropeBridge(c, a, b, o = {}) {
  const A = V(...a), B = V(...b), len = A.distanceTo(B), n = Math.max(6, Math.round(len / 0.5));
  const geo = new THREE.BoxGeometry(1.1, 0.07, 0.38); c.own(geo);
  const im = new THREE.InstancedMesh(geo, M.plank(), n); im.castShadow = true; im.receiveShadow = true; im.frustumCulled = false;
  const sag = o.sag ?? Math.min(2.2, len * 0.06), dir = B.clone().sub(A), yaw = Math.atan2(dir.x, dir.z);
  const pt = (u) => A.clone().lerp(B, u).add(V(0, -sag * 4 * u * (1 - u), 0));
  const mtx = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(1, 1, 1), p = new THREE.Vector3(), eu = new THREE.Euler();
  const rr = mulberry32(Math.floor(len * 13));
  const jit = []; for (let i = 0; i < n; i++) jit.push([rr(), rr(), rr()]);
  const set = (tc) => {
    for (let i = 0; i < n; i++) {
      const u = (i + 0.5) / n; const P = pt(u), P2 = pt(Math.min(1, u + 0.02)), pitch = Math.atan2(P2.y - P.y, Math.hypot(P2.x - P.x, P2.z - P.z));
      let fall = 0, rot = 0;
      if (tc !== undefined && tc > 0) { const k = tc - (o.fromEnd ? (1 - u) : u) * 0.4 - jit[i][0] * 0.15; if (k > 0) { fall = 0.5 * 20 * k * k; rot = k * (2 + jit[i][1] * 4) * (jit[i][2] < 0.5 ? -1 : 1); } }
      eu.set(-pitch, yaw, rot, 'YXZ'); q.setFromEuler(eu); p.set(P.x, P.y - fall, P.z); im.setMatrixAt(i, mtx.compose(p, q, s));
    }
    im.instanceMatrix.needsUpdate = true;
  };
  set(); c.add(im);
  const ropes = [];
  for (const sd of [-1, 1]) {
    const pts = []; for (let k = 0; k <= 14; k++) { const u = k / 14, P = pt(u); pts.push(P.add(V(Math.cos(yaw) * sd * 0.6, 1.0, -Math.sin(yaw) * sd * 0.6))); }
    const g = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 24, 0.035, 5); const m = new THREE.Mesh(g, M.rope()); m.castShadow = false; c.add(m); c.own(g); ropes.push(m);
  }
  return { set, ropes, mesh: im, at: (u) => pt(u), a: A, b: B, cut(t, tc) { const k = t - tc; set(k > 0 ? k : undefined); for (const r of ropes) r.visible = k <= 0; } };
}
export function ladder(c, x, z, h, yaw = 0) {
  const g = new THREE.Group(); g.position.set(x, height(x, z), z); g.rotation.y = yaw; c.add(g);
  for (const sd of [-1, 1]) box(c, 0.08, h, 0.08, M.dark(), sd * 0.3, h / 2, 0, { parent: g, shadow: false });
  for (let k = 0; k < h / 0.4; k++) box(c, 0.6, 0.05, 0.06, M.wood(), 0, 0.3 + k * 0.4, 0, { parent: g, shadow: false });
  return g;
}

// ---------------------------------------------------------------- the Verdane
export const F = { landing: [925, 300], rootholm: [705, 330], circle: [722, 262], hollow: [640, 420], stream: [745, 300], splinter: [610, 60], ambush: [930, 330], lookout: [885, 190], hospital: [800, 470] };
// Rootholm at a growth stage (1: lean-tos, 2: first treehouses, 3: bridges, 4: city, 5: fortress)
export function rootholm(c, stage = 4) {
  const [cx, cz] = F.rootholm, r = mulberry32(12), trees = [];
  const N = [0, 2, 4, 6, 8, 8][stage], hs = [];
  const ring = [[0, 0], [24, 8], [-22, 14], [10, -26], [-14, -22], [34, -14], [-36, -2], [20, 30]];
  for (let i = 0; i < N; i++) { const [dx, dz] = ring[i]; const t = bigTree(c, cx + dx, cz + dz, 24 + (i % 3) * 3, i, 'oak0'); trees.push(t); }
  const plats = [];
  trees.forEach((t, i) => { const h = 7 + (i % 3) * 2.4; plats.push({ t, h, g: platform(c, t.x, t.z, h, 3.4, { hut: stage >= 3 ? i : 0, hutYaw: i, lantern: stage >= 4, gap: i * 0.9 }) }); if (stage >= 2) ladder(c, t.x + 2.0, t.z + 1.4, h + 0.2, i); });
  const br = [];
  if (stage >= 3) for (let i = 0; i < N - 1; i++) { const a = plats[i], b = plats[(i + 1) % N]; if (Math.hypot(a.t.x - b.t.x, a.t.z - b.t.z) < 52) br.push(ropeBridge(c, [a.t.x, height(a.t.x, a.t.z) + a.h + 0.2, a.t.z], [b.t.x, height(b.t.x, b.t.z) + b.h + 0.2, b.t.z])); }
  // ground level: leans-tos, fire pit, the Circle of stumps
  if (stage >= 1) { for (let i = 0; i < 4 + stage * 2; i++) { const a = r() * 6.28, d = 8 + r() * 24, x = cx + Math.cos(a) * d, z = cz + 14 + Math.sin(a) * d; const m = new THREE.Mesh(PROTO.leanTo[0], buildingMaterial()); m.position.set(x, height(x, z), z); m.rotation.y = a; m.scale.setScalar(0.9 + r() * 0.3); m.castShadow = true; c.add(m); } }
  return { trees, plats, bridges: br };
}
export function circleOfStumps(c, x, z, n = 14, R = 7) {
  const out = [];
  for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2, px = x + Math.cos(a) * R, pz = z + Math.sin(a) * R; const st = cyl(c, 0.55, 0.6, 0.55, M.wood(), px, height(px, pz) + 0.27, pz, {}, 10); out.push({ x: px, z: pz, a }); }
  return out;
}
export function watchtower(c, x, z, h = 9, yaw = 0) {
  const g = new THREE.Group(); const y0 = height(x, z); g.position.set(x, y0, z); g.rotation.y = yaw; c.add(g);
  for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { const m = cyl(c, 0.2, 0.26, h, M.dark(), sx * 1.4, h / 2, sz * 1.4, { parent: g }, 6); m.rotation.z = -sx * 0.06; m.rotation.x = sz * 0.06; }
  box(c, 3.6, 0.25, 3.6, M.plank(), 0, h, 0, { parent: g });
  for (const sx of [-1, 1]) { box(c, 0.12, 0.9, 3.6, M.wood(), sx * 1.75, h + 0.6, 0, { parent: g, shadow: false }); box(c, 3.6, 0.9, 0.12, M.wood(), 0, h + 0.6, sx * 1.75, { parent: g, shadow: false }); }
  const roof = mesh(c, new THREE.ConeGeometry(3.0, 1.8, 4), M.thatch(), 0, h + 3.4, 0, { parent: g, ry: Math.PI / 4 });
  for (const [sx, sz] of [[-1, -1], [1, 1]]) cyl(c, 0.1, 0.1, 2.7, M.dark(), sx * 1.5, h + 1.6, sz * 1.5, { parent: g, shadow: false }, 5);
  ladder(c, x + Math.sin(yaw) * 0 + 0, z + 1.9, h, yaw);
  return g;
}
export function palisade(c, pts, h = 3.4, o = {}) {
  const logs = []; const r = mulberry32(3);
  for (let i = 0; i < pts.length - 1; i++) { const [ax, az] = pts[i], [bx, bz] = pts[i + 1], L = Math.hypot(bx - ax, bz - az), k = Math.floor(L / 0.62); for (let j = 0; j < k; j++) { const u = j / k; if (o.gate && u > o.gate[0] && u < o.gate[1] && i === (o.gateSeg ?? 0)) continue; logs.push([ax + (bx - ax) * u, az + (bz - az) * u, h * (0.85 + r() * 0.3)]); } }
  const g1 = new THREE.CylinderGeometry(0.27, 0.3, 1, 7), g2 = new THREE.ConeGeometry(0.27, 0.6, 7); c.own(g1); c.own(g2);
  const a = new THREE.InstancedMesh(g1, M.dark(), logs.length), b = new THREE.InstancedMesh(g2, M.dark(), logs.length);
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(), p = new THREE.Vector3();
  logs.forEach(([x, z, hh], i) => { const y = height(x, z); s.set(1, hh, 1); p.set(x, y + hh / 2 - 0.3, z); a.setMatrixAt(i, m.compose(p, q, s)); s.set(1, 1, 1); p.set(x, y + hh - 0.3 + 0.3, z); b.setMatrixAt(i, m.compose(p, q, s)); });
  for (const im of [a, b]) { im.castShadow = true; im.receiveShadow = true; im.frustumCulled = false; c.add(im); }
  return logs.length;
}
// the Hollow Oak: a huge tree with a glowing hollow, ribbons and chimes
export function hollowOak(c, x, z, o = {}) {
  const s = o.s ?? 44, t = bigTree(c, x, z, s, 1, 'oak0'), y = height(x, z);
  const face = o.face ?? Math.PI * 0.5, R = t.trunkR * 1.0;
  const hole = new THREE.Mesh(new THREE.CircleGeometry(1, 20), new THREE.MeshBasicMaterial({ color: 0x050403 })); hole.scale.set(0.95, 1.55, 1); hole.position.set(x + Math.sin(face) * (R + 0.18), y + 1.6, z + Math.cos(face) * (R + 0.18)); hole.rotation.y = face; c.add(hole); c.own(hole.geometry);
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: radialTex(128, [[0, 'rgba(255,225,130,1)'], [0.3, 'rgba(255,190,70,0.6)'], [1, 'rgba(255,150,30,0)']]), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, fog: false, opacity: 0.0 }));
  glow.position.copy(hole.position).add(V(Math.sin(face) * 0.25, 0.1, Math.cos(face) * 0.25)); glow.scale.setScalar(6); c.add(glow);
  const light = new THREE.PointLight(0xffc860, 0, 18, 1.6); light.position.copy(glow.position).add(V(Math.sin(face) * 1.2, 0.3, Math.cos(face) * 1.2)); c.add(light);
  // ribbons hanging from invisible branches around the trunk
  const r = mulberry32(8), rib = [];
  const cols = [0xe8d36a, 0x7ad37a, 0xf4f1e0, 0xe5896a, 0x6ac0d9];
  for (let i = 0; i < 46; i++) {
    const a = r() * 6.28, d = R * 1.5 + r() * 4.5, len = 2.6 + r() * 3.2, hh = 3.2 + r() * 2.6;
    const g = new THREE.PlaneGeometry(0.28, len, 1, 6); g.translate(0, -len / 2, 0);
    const m = new THREE.Mesh(g, M.cloth(cols[i % cols.length])); m.position.set(x + Math.cos(a) * d, y + hh + len, z + Math.sin(a) * d); m.userData = { a, ph: r() * 6, len }; m.castShadow = false; c.add(m); c.own(g); rib.push(m);
  }
  const chimes = [];
  for (let i = 0; i < 9; i++) { const a = i / 9 * 6.28, d = R * 2.1; const cc = cyl(c, 0.05, 0.05, 1.0 + (i % 3) * 0.4, M.gold(), x + Math.cos(a) * d, y + 5.0 - (i % 3) * 0.3, z + Math.sin(a) * d, { shadow: false }, 6); chimes.push(cc); }
  c.on((tt) => { for (const m of rib) { const p = m.geometry.attributes.position; /* sway by rotating */ m.rotation.z = Math.sin(tt * 1.3 + m.userData.ph) * 0.18; m.rotation.x = Math.cos(tt * 0.9 + m.userData.ph) * 0.12; } chimes.forEach((cc, i) => { cc.rotation.z = Math.sin(tt * 2 + i) * 0.06; }); const g = o.glow ?? 0.0; glow.material.opacity = g * (0.7 + 0.3 * Math.sin(tt * 2.4)); light.intensity = g * 70; });
  return { tree: t, glow, light, hole, setGlow(a) { o.glow = a; } };
}
export function hospital(c, x, z, beds = 24) {
  const r = mulberry32(21);
  const out = [];
  for (let i = 0; i < 4; i++) { const m = new THREE.Mesh(PROTO.leanTo[0], buildingMaterial()); const px = x + (i - 1.5) * 9, pz = z + (i % 2) * 2; m.position.set(px, height(px, pz), pz); m.rotation.y = Math.PI * (i % 2); m.scale.setScalar(1.3); m.castShadow = true; c.add(m); }
  for (let i = 0; i < beds; i++) { const px = x + ((i % 8) - 3.5) * 2.4 + (r() - 0.5) * 0.2, pz = z + (Math.floor(i / 8) - 1) * 5 + 4; out.push(box(c, 0.9, 0.22, 1.9, M.moss(), px, height(px, pz) + 0.15, pz, { ry: (r() - 0.5) * 0.1 })); box(c, 0.6, 0.12, 0.45, M.white(), px, height(px, pz) + 0.3, pz - 0.7, { shadow: false }); }
  // white cloths on poles
  for (let i = 0; i < 6; i++) { const px = x + (i - 2.5) * 6, pz = z - 3; cyl(c, 0.05, 0.05, 4.2, M.dark(), px, height(px, pz) + 2.1, pz, {}, 5); flag(c, px, pz, 0xffffff, 4.2, 1.6, 0.9); }
}
// a waving flag on a pole base position (x,z) at height h
export function flag(c, x, z, hex, h = 5, w = 1.8, hh = 1.1, yaw = 0) {
  const g = new THREE.PlaneGeometry(w, hh, 8, 3); g.translate(w / 2, -hh / 2, 0); c.own(g);
  const m = new THREE.Mesh(g, M.cloth(hex)); m.position.set(x, height(x, z) + h, z); m.rotation.y = yaw; m.castShadow = true; c.add(m);
  const p0 = g.attributes.position.array.slice();
  c.on((t) => { const p = g.attributes.position; for (let i = 0; i < p.count; i++) { const px = p0[i * 3]; p.setZ(i, Math.sin(px * 2.4 - t * 5 + x) * 0.14 * (px / w)); } p.needsUpdate = true; g.computeVertexNormals(); });
  return m;
}
export function pole(c, x, z, h, hex, w = 1.8, hh = 1.1) { cyl(c, 0.06, 0.07, h, M.dark(), x, height(x, z) + h / 2, z, {}, 6); return flag(c, x, z, hex, h - 0.2, w, hh, 0); }
// traps: a pit with stakes, a swinging log, a net
export function pitTrap(c, x, z, yaw = 0, r = 1.4) {
  const y = height(x, z); const m = mesh(c, new THREE.CylinderGeometry(r, r * 0.8, 0.12, 12), M.dark(), x, y - 0.03, z, { shadow: false });
  for (let i = 0; i < 9; i++) { const a = i * 2.39, d = (i % 4) * 0.28; cyl(c, 0.03, 0.05, 0.7, M.wood(), x + Math.cos(a) * d, y + 0.28, z + Math.sin(a) * d, { rx: 0.1 * Math.cos(a), rz: 0.1 * Math.sin(a), shadow: false }, 4); }
  return m;
}
export function swingLog(c, x, z, yaw, k = 0, len = 9) {   // k in 0..1 swing phase (0 rest, 1 hit); returns {set(k)}
  const y = height(x, z), g = new THREE.Group(); g.position.set(x, y + len + 0.8, z); g.rotation.y = yaw; c.add(g);
  const arm = new THREE.Group(); g.add(arm);
  for (const sd of [-1, 1]) cyl(c, 0.03, 0.03, len, M.rope(), sd * 0.7, -len / 2, 0, { parent: arm, shadow: false }, 4);
  cyl(c, 0.5, 0.5, 3.2, M.wood(), 0, -len, 0, { parent: arm, rz: Math.PI / 2 });
  for (const sd of [-1, 1]) { cyl(c, 0.2, 0.28, len + 1.6, M.dark(), sd * 2.2, -0.2 - len / 2 + len / 2 - 0.4, 0, { parent: g }, 6); }
  box(c, 4.8, 0.3, 0.3, M.dark(), 0, 0.3, 0, { parent: g });
  const set = (u) => { arm.rotation.x = lerp(-1.1, 0.9, u); }; set(k);
  return { g, set };
}

// ---------------------------------------------------------------- the Aurel
export const P = { landing: [1085, 300], goldmere: [1235, 355], fields: [1195, 200], temple: [1170, 500], forge: [1155, 375], corral: [1305, 140], river: [1330, 520], parade: [1070, 330], reapers: [1345, 560] };
export function wheatField(c, x, z, w = 60, d = 40, stage = 3, yaw = 0) {
  const items = []; const ca = Math.cos(yaw), sa = Math.sin(yaw);
  for (let u = -w / 2; u < w / 2; u += 5) for (let v = -d / 2; v < d / 2; v += 5) items.push([x + u * ca - v * sa, z + u * sa + v * ca, -yaw, 0.9 + ((u * 7 + v * 3) % 5) * 0.03]);
  return c.protos('crop', stage, items, { shadow: false });
}
export function hayBales(c, x, z, n = 6, seed = 1) {
  const r = mulberry32(seed + 5); const g = new THREE.CylinderGeometry(0.7, 0.7, 1.0, 12); g.rotateZ(Math.PI / 2); c.own(g);
  const im = new THREE.InstancedMesh(g, M.thatch(), n); im.castShadow = true; im.receiveShadow = true; im.frustumCulled = false;
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(1, 1, 1), p = new THREE.Vector3();
  for (let i = 0; i < n; i++) { const px = x + (r() - 0.5) * 10, pz = z + (r() - 0.5) * 10; q.setFromAxisAngle(V(0, 1, 0), r() * 6.28); p.set(px, height(px, pz) + 0.7, pz); im.setMatrixAt(i, m.compose(p, q, s)); }
  c.add(im); return im;
}
// Goldmere at a stage (1: tents, 2: clay houses, 3: granary + hall + fields, 4: city, 5: fortress with rampart)
export function goldmere(c, stage = 4) {
  const [cx, cz] = P.goldmere, r = mulberry32(77);
  const place = (type, v, x, z, yaw, sc = 1) => { const m = c.proto(type, v, x, z, yaw, sc); return m; };
  if (stage === 1) for (let i = 0; i < 9; i++) { const a = i / 9 * 6.28, d = 26; tent(c, cx + Math.cos(a) * d, cz + Math.sin(a) * d, -a + 1.6, 1.0); }
  if (stage >= 2) { const n = [0, 0, 10, 18, 26, 28][stage]; for (let i = 0; i < n; i++) { const a = i * 2.4, d = 30 + Math.sqrt(i) * 11 + r() * 5; mudHouse(c, cx + Math.cos(a) * d, cz + Math.sin(a) * d * 0.8, a + 1.6, 1.0 + r() * 0.25); } }
  if (stage >= 3) { place('granaryBig', 0, cx + 6, cz - 24, 0.2, 1.25); greatHall(c, cx - 8, cz + 6, 0.3); }
  if (stage >= 4) { for (let i = 0; i < 6; i++) place('stall', i, cx + 18 + (i % 3) * 6, cz + 24 + Math.floor(i / 3) * 6, 0.4, 1.0); place('windmill', 0, cx + 62, cz - 40, 0.3, 1.25); place('forge', 0, P.forge[0], P.forge[1], 0.8, 1.2); place('anvil', 0, P.forge[0] + 6, P.forge[1] - 2, 0.3, 1.4); }
  if (stage >= 3) { const fl = [[P.fields[0], P.fields[1], 70, 46, 0.1], [P.fields[0] + 80, P.fields[1] + 20, 70, 50, -0.1], [P.fields[0] - 10, P.fields[1] + 70, 80, 40, 0.0], [P.fields[0] + 85, P.fields[1] + 80, 70, 40, 0.2]]; fl.forEach(([x, z, w, d, yaw], i) => { if (i < stage - 1) wheatField(c, x, z, w, d, Math.min(3, i + stage - 1), yaw); }); }
  hayBales(c, cx + 40, cz + 30, 6, 2);
  return { cx, cz };
}
export function dawnHall(c, x, z, o = {}) {
  const y = height(x, z), R = 11;
  cyl(c, R + 3, R + 3.5, 0.9, M.stone(), x, y + 0.3, z, {}, 36); cyl(c, R + 0.5, R + 1.2, 0.5, M.stoneD(), x, y + 0.95, z, {}, 36);
  for (let i = 0; i < 12; i++) { const a = i / 12 * 6.28; cyl(c, 0.7, 0.8, 7.2, M.stone(), x + Math.cos(a) * R, y + 4.8, z + Math.sin(a) * R, {}, 12); box(c, 2.2, 0.5, 2.2, M.stoneD(), x + Math.cos(a) * R, y + 8.5, z + Math.sin(a) * R, { ry: -a }); }
  for (let i = 0; i < 12; i++) { const a = (i + 0.5) / 12 * 6.28; box(c, 5.2, 0.7, 1.4, M.stone(), x + Math.cos(a) * R, y + 9.0, z + Math.sin(a) * R, { ry: -a + Math.PI / 2 }); }
  const sx = x - 0, sz = z;
  cyl(c, 0.9, 1.2, 5.5, M.stone(), sx, y + 3.4, sz, {}, 12);
  const disc = new THREE.Mesh(new THREE.CylinderGeometry(3.2, 3.2, 0.35, 32), new THREE.MeshStandardMaterial({ color: 0xffd45a, emissive: 0xff9a18, emissiveIntensity: o.glow ?? 0.9, metalness: 0.7, roughness: 0.3 }));
  disc.rotation.set(0, 0, Math.PI / 2); disc.position.set(sx, y + 8.4, sz); disc.castShadow = true; c.add(disc); c.own(disc.geometry);
  for (let i = 0; i < 16; i++) { const a = i / 16 * 6.28; const ray = new THREE.Mesh(new THREE.ConeGeometry(0.34, 2.4, 4), disc.material); ray.position.set(sx, y + 8.4 + Math.sin(a) * 4.5, sz + Math.cos(a) * 4.5); ray.rotation.x = Math.PI / 2 - a; c.add(ray); c.own(ray.geometry); }
  disc.userData.spin = true; c.on((t) => { disc.rotation.y = 0; });
  return { x, y, z, R, disc };
}
export function corral(c, x, z, w = 36, d = 24) {
  const pts = [[x - w / 2, z - d / 2], [x + w / 2, z - d / 2], [x + w / 2, z + d / 2], [x - w / 2, z + d / 2], [x - w / 2, z - d / 2]];
  const items = [], r = mulberry32(2);
  for (let i = 0; i < pts.length - 1; i++) { const [ax, az] = pts[i], [bx, bz] = pts[i + 1], L = Math.hypot(bx - ax, bz - az), k = Math.floor(L / 3); for (let j = 0; j <= k; j++) { const u = j / k, px = ax + (bx - ax) * u, pz = az + (bz - az) * u; cyl(c, 0.12, 0.14, 1.6, M.dark(), px, height(px, pz) + 0.8, pz, { shadow: false }, 5); if (j < k) for (const hy of [0.55, 1.1]) box(c, L / k, 0.1, 0.1, M.wood(), px + (bx - ax) / k / 2, height(px, pz) + hy, pz + (bz - az) / k / 2, { ry: Math.atan2(-(bz - az), bx - ax), shadow: false }); } }
}
export function rampart(c, pts, h = 5) {   // stone wall segments (Goldmere's fortress)
  for (let i = 0; i < pts.length - 1; i++) { const [ax, az] = pts[i], [bx, bz] = pts[i + 1], L = Math.hypot(bx - ax, bz - az), mx = (ax + bx) / 2, mz = (az + bz) / 2; const y = height(mx, mz); box(c, L, h, 1.6, M.stone(), mx, y + h / 2 - 0.3, mz, { ry: Math.atan2(-(bz - az), bx - ax) }); for (let k = 0; k < L / 2.4; k++) { const u = (k + 0.5) / (L / 2.4), px = ax + (bx - ax) * u, pz = az + (bz - az) * u; box(c, 1.2, 0.8, 1.7, M.stoneD(), px, height(px, pz) + h + 0.1, pz, { ry: Math.atan2(-(bz - az), bx - ax), shadow: false }); } }
}


// a clay-brick house with a thatched roof, door, windows and beams (the Aurel's homes)
export function mudHouse(c, x, z, yaw = 0, sc = 1, o = {}) {
  const g = new THREE.Group(); g.position.set(x, height(x, z) - 0.2, z); g.rotation.y = yaw; g.scale.setScalar(sc); c.add(g);
  const w = o.w ?? 6.4, d = o.d ?? 5.2, h = o.h ?? 3.4, r = mulberry32(Math.floor(x * 7 + z * 3));
  const tone = [0xc99a64, 0xd2a870, 0xbf8f5a, 0xcfa06a][Math.floor(r() * 4)];
  const wallM = std('mud' + tone, { color: tone, roughness: 0.97 });
  box(c, w, h, d, wallM, 0, h / 2, 0, { parent: g });
  box(c, w + 0.25, 0.5, d + 0.25, M.stoneD(), 0, 0.2, 0, { parent: g });
  const roof = mesh(c, new THREE.ConeGeometry(Math.hypot(w, d) * 0.62, 2.1 + (o.roofH ?? 0), 4), M.thatch(), 0, h + 1.0 + (o.roofH ?? 0) / 2, 0, { parent: g, ry: Math.PI / 4 });
  roof.scale.set(w / Math.hypot(w, d) * 1.22, 1, d / Math.hypot(w, d) * 1.22);
  box(c, 1.1, 2.1, 0.2, M.dark(), -w * 0.18, 1.05, d / 2 + 0.02, { parent: g, shadow: false });
  box(c, 1.4, 0.2, 0.3, M.wood(), -w * 0.18, 2.2, d / 2 + 0.1, { parent: g, shadow: false });
  for (const sx of [0.28, 0.42]) box(c, 0.8, 0.8, 0.12, M.dark(), w * sx, 2.0, d / 2 + 0.02, { parent: g, shadow: false });
  box(c, 0.12, 0.8, 0.8, M.dark(), w / 2 + 0.02, 2.0, 0, { parent: g, shadow: false });
  for (let k = 0; k < 4; k++) cyl(c, 0.09, 0.09, d + 0.9, M.dark(), -w / 2 + 0.6 + k * (w - 1.2) / 3, h - 0.15, 0, { parent: g, rx: Math.PI / 2, shadow: false }, 5);
  if (o.chimney !== false) box(c, 0.7, 1.9, 0.7, M.stone(), w * 0.3, h + 1.5, -d * 0.2, { parent: g });
  return g;
}
export function greatHall(c, x, z, yaw = 0) {
  const g = new THREE.Group(); g.position.set(x, height(x, z) - 0.3, z); g.rotation.y = yaw; c.add(g);
  const W = 18, D = 11, H = 5.5;
  box(c, W, H, D, std('hallw', { color: 0xd3aa72, roughness: 0.95 }), 0, H / 2, 0, { parent: g });
  box(c, W + 0.6, 0.9, D + 0.6, M.stone(), 0, 0.3, 0, { parent: g });
  const roof = mesh(c, new THREE.ConeGeometry(Math.hypot(W, D) * 0.6, 4.2, 4), M.thatch(), 0, H + 2.0, 0, { parent: g, ry: Math.PI / 4 }); roof.scale.set(W / Math.hypot(W, D) * 1.24, 1, D / Math.hypot(W, D) * 1.24);
  for (let k = -3; k <= 3; k++) cyl(c, 0.28, 0.3, H + 0.6, M.dark(), k * 2.7, (H + 0.6) / 2, D / 2 + 0.5, { parent: g }, 8);
  box(c, 3.2, 3.6, 0.3, M.dark(), 0, 1.8, D / 2 + 0.1, { parent: g, shadow: false });
  for (const sx of [-1, 1]) box(c, 1.2, 1.4, 0.2, M.dark(), sx * 5.5, 3.0, D / 2 + 0.05, { parent: g, shadow: false });
  return g;
}
export function logHut(c, x, z, yaw = 0, sc = 1) {   // a forest hut on the ground: stacked logs, moss roof
  const g = new THREE.Group(); g.position.set(x, height(x, z) - 0.15, z); g.rotation.y = yaw; g.scale.setScalar(sc); c.add(g);
  const w = 5, d = 4.2, h = 2.6;
  for (let k = 0; k < 7; k++) { cyl(c, 0.2, 0.2, w + 0.5, M.wood(), 0, 0.22 + k * 0.36, d / 2, { parent: g, rz: Math.PI / 2, shadow: false }, 7); cyl(c, 0.2, 0.2, w + 0.5, M.wood(), 0, 0.22 + k * 0.36, -d / 2, { parent: g, rz: Math.PI / 2, shadow: false }, 7); cyl(c, 0.2, 0.2, d + 0.5, M.wood(), w / 2, 0.4 + k * 0.36, 0, { parent: g, rx: Math.PI / 2, shadow: false }, 7); cyl(c, 0.2, 0.2, d + 0.5, M.wood(), -w / 2, 0.4 + k * 0.36, 0, { parent: g, rx: Math.PI / 2, shadow: false }, 7); }
  box(c, w + 0.3, h, d + 0.3, M.dark(), 0, h / 2, 0, { parent: g, shadow: false });
  const roof = mesh(c, new THREE.ConeGeometry(Math.hypot(w, d) * 0.64, 2.0, 4), M.moss(), 0, h + 0.95, 0, { parent: g, ry: Math.PI / 4 }); roof.scale.set(w / Math.hypot(w, d) * 1.26, 1, d / Math.hypot(w, d) * 1.26);
  box(c, 1.0, 1.9, 0.2, M.dark(), 0, 0.95, d / 2 + 0.3, { parent: g, shadow: false });
  return g;
}

// ---------------------------------------------------------------- atmosphere
// shafts of light slanting through a forest: additive long quads facing the camera
export function godRays(c, cx, cz, o = {}) {
  const r = mulberry32(o.seed ?? 17), n = o.n ?? 14, R = o.r ?? 28, tilt = o.tilt ?? 0.38;
  const cv = document.createElement('canvas'); cv.width = 32; cv.height = 256; const g = cv.getContext('2d'); const gr = g.createLinearGradient(0, 0, 0, 256);
  gr.addColorStop(0, 'rgba(255,240,190,0.0)'); gr.addColorStop(0.15, 'rgba(255,238,185,0.55)'); gr.addColorStop(0.8, 'rgba(255,230,170,0.25)'); gr.addColorStop(1, 'rgba(255,225,160,0)'); g.fillStyle = gr; g.fillRect(0, 0, 32, 256);
  const gx = g.createLinearGradient(0, 0, 32, 0); gx.addColorStop(0, 'rgba(0,0,0,1)'); gx.addColorStop(0.5, 'rgba(0,0,0,0)'); gx.addColorStop(1, 'rgba(0,0,0,1)'); g.globalCompositeOperation = 'destination-out'; g.fillStyle = gx; g.fillRect(0, 0, 32, 256);
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace;
  const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false, opacity: o.opacity ?? 0.5 }); c.own(mat);
  const beams = [];
  for (let i = 0; i < n; i++) { const w = 4 + r() * 7, h = 22 + r() * 14; const geo = new THREE.PlaneGeometry(w, h); c.own(geo); const m = new THREE.Mesh(geo, mat); const a = r() * 6.28, d = r() * R; const x = cx + Math.cos(a) * d, z = cz + Math.sin(a) * d; m.position.set(x, height(x, z) + h * 0.42, z); m.rotation.z = tilt * (r() < 0.5 ? 1 : 1); m.userData = { ph: r() * 6, yaw: r() * 3.14, h }; c.add(m); beams.push(m); }
  c.after(() => { const cp = E.camera.position; for (const m of beams) { const dx = cp.x - m.position.x, dz = cp.z - m.position.z; m.visible = Math.hypot(dx, dz) > (o.minDist ?? 16); m.rotation.set(0, Math.atan2(dx, dz), 0); m.rotateZ(tilt); } });
  c.on((t) => { beams.forEach((m, i) => { m.scale.x = 1 + 0.12 * Math.sin(t * 0.8 + m.userData.ph); }); mat.opacity = (o.opacity ?? 0.5) * (0.85 + 0.15 * Math.sin(t * 0.5)); });
  return beams;
}
// floating motes: pollen / dust / embers / leaves around a point (Points, drifting)
export function motes(c, cx, cy, cz, o = {}) {
  const n = o.n ?? 300, R = o.r ?? 18, H = o.h ?? 10, r = mulberry32(o.seed ?? 5);
  const pos = new Float32Array(n * 3), base = [];
  for (let i = 0; i < n; i++) { const a = r() * 6.28, d = Math.sqrt(r()) * R; base.push([cx + Math.cos(a) * d, cy + r() * H, cz + Math.sin(a) * d, r() * 6.28, 0.3 + r()]); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); c.own(g);
  const tex = radialTex(32, [[0, 'rgba(255,255,255,1)'], [0.5, 'rgba(255,255,255,0.5)'], [1, 'rgba(255,255,255,0)']]);
  const mat = new THREE.PointsMaterial({ size: o.size ?? 0.12, map: tex, color: o.color ?? 0xfff0b8, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: o.opacity ?? 0.8, sizeAttenuation: true, fog: false }); c.own(mat);
  const pts = new THREE.Points(g, mat); pts.frustumCulled = false; c.add(pts);
  const fall = o.fall ?? 0, wind = o.wind ?? [0.25, 0.1];
  c.on((t) => { const p = g.attributes.position; for (let i = 0; i < n; i++) { const b = base[i]; let y = b[1] + Math.sin(t * 0.5 * b[4] + b[3]) * 0.8 - fall * ((t * b[4]) % (H)); if (fall) y = cy + ((b[1] - cy + H * 1000 - fall * t * b[4]) % H); p.setXYZ(i, b[0] + Math.sin(t * 0.3 + b[3]) * 1.5 + wind[0] * t * b[4] * 0.3 * (o.drift ?? 1), y, b[2] + Math.cos(t * 0.27 + b[3]) * 1.5 + wind[1] * t * b[4] * 0.3 * (o.drift ?? 1)); } p.needsUpdate = true; });
  return pts;
}

// a tall bare-trunk pine with foliage only near the top (so someone can climb it)
export function tallPine(c, x, z, H = 42, crownFrom = 0.6) {
  const y = height(x, z), fm = std('pinef', { color: 0x1f4f2c, roughness: 0.9, flatShading: true });
  cyl(c, 1.0, 0.38, H, M.dark(), x, y + H / 2, z, {}, 10);
  for (let k = 0; k < 5; k++) { const hh = H * (crownFrom + k * 0.085 * (1 - crownFrom) / 0.4 * 0.4 / 0.4 * 1), r = 5.0 * (1 - k * 0.17); mesh(c, new THREE.ConeGeometry(r, 7.0, 9), fm, x, y + hh + 2.2, z, {}); }
  for (let k = 0; k < 6; k++) { const a = k * 1.1, hh = 4 + k * 3.2; cyl(c, 0.08, 0.1, 1.6, M.dark(), x + Math.cos(a) * 1.1, y + hh, z + Math.sin(a) * 1.1, { rz: Math.cos(a) * 0.9, rx: -Math.sin(a) * 0.9, shadow: false }, 4); }
  return { x, z, y, H };
}
export function tent(c, x, z, yaw = 0, s = 1) {
  const g = new THREE.Group(); g.position.set(x, height(x, z) - 0.05, z); g.rotation.y = yaw; g.scale.setScalar(s); c.add(g);
  const m = std('tentc', { color: 0xdac9a0, roughness: 0.95, side: THREE.DoubleSide });
  mesh(c, new THREE.ConeGeometry(2.6, 3.4, 10, 1, true), m, 0, 1.7, 0, { parent: g });
  box(c, 0.9, 1.7, 0.1, M.dark(), 0, 0.85, 2.0, { parent: g, shadow: false, ry: 0 });
  cyl(c, 0.06, 0.06, 1.2, M.dark(), 0, 4.0, 0, { parent: g, shadow: false }, 5);
  return g;
}

// the creek and the river: one sheet of water under the whole valley floor (the channels carved in the terrain show it)
export function water(c) {
  return c.water(1000, 300, 1500, 1300, () => ARENA.waterY, { deep: 0x1d4a5a, shallow: 0x4f8f90, dim: 1.0 });
}

let _glowTex = null;
export function glowTex() { if (!_glowTex) _glowTex = radialTex(64, [[0, 'rgba(255,255,255,1)'], [0.4, 'rgba(255,255,255,0.5)'], [1, 'rgba(255,255,255,0)']]); return _glowTex; }
