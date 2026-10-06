// Settlement assets through the eras: procedural prototypes (merged, vertex-coloured)
// instanced across the town; the town of Prima grows year by year.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { mulberry32, clamp, lerp, smoothstep, Simplex } from './noise.js';
import { height, slopeAt, isWater, distToRiver, riverWidth } from './terrain.js';
import { ROADS, FIELDS } from './groundmap.js';

const SN = new Simplex(808);
function paint(g, fn) {
  g = g.index ? g.toNonIndexed() : g;
  for (const k of Object.keys(g.attributes)) if (!['position', 'normal'].includes(k)) g.deleteAttribute(k);
  if (!g.attributes.normal) g.computeVertexNormals();
  const p = g.attributes.position, c = new Float32Array(p.count * 3), col = new THREE.Color();
  for (let i = 0; i < p.count; i++) { fn(p.getX(i), p.getY(i), p.getZ(i), col, i); c[i * 3] = col.r; c[i * 3 + 1] = col.g; c[i * 3 + 2] = col.b; }
  g.setAttribute('color', new THREE.BufferAttribute(c, 3));
  return g;
}
const solid = (hex, vary = 0.08, seed = 1) => { const r = mulberry32(seed); const base = new THREE.Color(hex); return (x, y, z, c) => c.copy(base).multiplyScalar(1 - vary + 2 * vary * r()); };
const merge = (parts) => { const g = mergeGeometries(parts); g.computeBoundingSphere(); return g; };
function T(g, x = 0, y = 0, z = 0, ry = 0, sx = 1, sy = 1, sz = 1) { g.scale(sx, sy, sz); if (ry) g.rotateY(ry); g.translate(x, y, z); return g; }

// ------------------------------------------------------------------ prototypes (unit ~ metres)
export const PROTO = {};
function thatch(r, h, seed) {
  const g = new THREE.ConeGeometry(r, h, 16, 3, true);
  const p = g.attributes.position, rr = mulberry32(seed);
  for (let i = 0; i < p.count; i++) { const y = p.getY(i); if (y < -h / 2 + 0.01) { p.setX(i, p.getX(i) * (1 + 0.05 * (rr() - 0.5))); p.setY(i, y - 0.08 * rr()); } }
  g.computeVertexNormals();
  return paint(g, (x, y, z, c) => { c.set(0xc9a35a).multiplyScalar(0.75 + 0.35 * ((y + h / 2) / h) + 0.1 * Math.sin(Math.atan2(z, x) * 40)); });
}
function hutRound(seed = 1) {
  const r = 2.0, wallH = 1.8;
  const wall = paint(new THREE.CylinderGeometry(r, r * 1.04, wallH, 18, 1, true), (x, y, z, c) => { const a = Math.atan2(z, x); c.set(0x8a6a45).multiplyScalar(0.8 + 0.25 * Math.abs(Math.sin(a * 22)) + 0.1 * (y / wallH)); });
  T(wall, 0, wallH / 2);
  const roof = thatch(r * 1.35, 2.2, seed); T(roof, 0, wallH + 1.0);
  const door = paint(new THREE.PlaneGeometry(0.9, 1.4), solid(0x1d140d, 0)); T(door, 0, 0.7, r * 1.02 + 0.01);
  return merge([wall, roof, door]);
}
function leanTo() {
  const parts = [];
  for (const x of [-1.2, 1.2]) parts.push(paint(T(new THREE.CylinderGeometry(0.05, 0.06, 2.2, 5), x, 1.1, 1.0), solid(0x6b4a2b)));
  const roof = paint(new THREE.BoxGeometry(2.6, 0.12, 2.3, 4, 1, 4), (x, y, z, c) => c.set(0xb89458).multiplyScalar(0.72 + 0.35 * Math.abs(Math.sin(x * 9 + z * 3)) + 0.1 * Math.random()));
  roof.rotateX(0.62); T(roof, 0, 1.25, 0.2);
  return merge(parts.concat([roof]));
}
function fencePen(r = 6, posts = 16) {
  const parts = [];
  for (let k = 0; k < posts; k++) {
    const a = k / posts * Math.PI * 2;
    parts.push(paint(T(new THREE.CylinderGeometry(0.06, 0.07, 1.1, 5), Math.cos(a) * r, 0.55, Math.sin(a) * r), solid(0x6b4a2b)));
    const b = (k + 1) / posts * Math.PI * 2, L = 2 * r * Math.sin(Math.PI / posts);
    for (const y of [0.45, 0.9]) {
      const rail = new THREE.BoxGeometry(L, 0.06, 0.05);
      rail.rotateY(-(a + b) / 2 + Math.PI / 2);
      parts.push(paint(T(rail, Math.cos((a + b) / 2) * r * Math.cos(Math.PI / posts), y, Math.sin((a + b) / 2) * r * Math.cos(Math.PI / posts)), solid(0x7a5532)));
    }
  }
  return merge(parts);
}
function firePit() {
  const parts = [];
  for (let k = 0; k < 10; k++) { const a = k / 10 * Math.PI * 2; parts.push(paint(T(new THREE.IcosahedronGeometry(0.22, 0), Math.cos(a) * 0.8, 0.1, Math.sin(a) * 0.8, 0, 1, 0.6, 1), solid(0x6f6a64, 0.15, k))); }
  for (let k = 0; k < 5; k++) { const g = new THREE.CylinderGeometry(0.06, 0.07, 1.1, 5); g.rotateZ(Math.PI / 2 - 0.35); g.rotateY(k / 5 * Math.PI * 2); parts.push(paint(T(g, 0, 0.25, 0), solid(0x4a3020))); }
  return merge(parts);
}
function claHouse(seed = 1, w = 4.5, d = 3.6, h = 2.6) {
  const r = mulberry32(seed);
  const tone = [0xc89a6a, 0xd2a878, 0xb98c5e, 0xd8b48a][seed % 4];
  const body = paint(new THREE.BoxGeometry(w, h, d, 3, 2, 3), (x, y, z, c) => { c.set(tone).multiplyScalar(0.85 + 0.18 * SN.noise(x * 2 + seed, y * 2 + z * 2) + (y > h / 2 - 0.05 ? 0.06 : 0)); });
  T(body, 0, h / 2);
  const roof = paint(new THREE.BoxGeometry(w + 0.2, 0.25, d + 0.2), solid(new THREE.Color(tone).multiplyScalar(0.8).getHex()));
  T(roof, 0, h + 0.12);
  const door = paint(new THREE.PlaneGeometry(0.9, 1.6), solid(0x2a1a10, 0)); T(door, -w * 0.18, 0.8, d / 2 + 0.01);
  const win = paint(new THREE.PlaneGeometry(0.6, 0.5), solid(0x241a12, 0)); T(win, w * 0.22, h * 0.62, d / 2 + 0.01);
  const beams = [];
  for (let k = 0; k < 4; k++) beams.push(paint(T(new THREE.CylinderGeometry(0.06, 0.06, 0.6, 5).rotateX(Math.PI / 2), -w / 2 + 0.5 + k * (w - 1) / 3, h - 0.3, d / 2 + 0.25), solid(0x5a3b22)));
  return merge([body, roof, door, win, ...beams]);
}
function mudHut(seed = 1) {
  const g = new THREE.SphereGeometry(1.6, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2);
  const p = g.attributes.position, r = mulberry32(seed);
  for (let i = 0; i < p.count; i++) { const k = 1 + 0.08 * SN.noise(p.getX(i) * 2 + seed, p.getZ(i) * 2); p.setXYZ(i, p.getX(i) * k, p.getY(i) * 0.85, p.getZ(i) * k); }
  g.computeVertexNormals();
  const body = paint(g, (x, y, z, c) => c.set(0x7a5a3c).multiplyScalar(0.75 + 0.3 * r()));
  const door = paint(new THREE.CircleGeometry(0.45, 10, 0, Math.PI), solid(0x1d140d, 0)); T(door, 0, 0.0, 1.55);
  return merge([body, door]);
}
function kiln() {
  const dome = paint(new THREE.SphereGeometry(1.3, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), (x, y, z, c) => c.set(0xb07a50).multiplyScalar(0.8 + 0.2 * Math.random()));
  const chim = paint(T(new THREE.CylinderGeometry(0.22, 0.28, 1.2, 8), 0.3, 1.5, 0), solid(0x9a6a44));
  const mouth = paint(new THREE.CircleGeometry(0.4, 10, 0, Math.PI), solid(0x2a120a, 0)); T(mouth, 0, 0, 1.28);
  return merge([dome, chim, mouth]);
}
function granary(big = false) {
  const r = big ? 3.2 : 1.8, h = big ? 4.5 : 2.4, parts = [];
  const body = paint(new THREE.CylinderGeometry(r, r * 1.05, h, 18), (x, y, z, c) => c.set(big ? 0xc59a68 : 0x8a6a45).multiplyScalar(0.85 + 0.2 * Math.abs(Math.sin(Math.atan2(z, x) * 14))));
  T(body, 0, h / 2 + (big ? 0 : 0.8));
  parts.push(body);
  const top = big ? paint(new THREE.SphereGeometry(r * 1.02, 18, 8, 0, Math.PI * 2, 0, Math.PI / 2), solid(0xb58a5a)) : thatch(r * 1.3, 1.6, 3);
  T(top, 0, h + (big ? 0 : 0.8 + 0.8));
  parts.push(top);
  if (!big) for (let k = 0; k < 4; k++) parts.push(paint(T(new THREE.CylinderGeometry(0.08, 0.08, 0.9, 5), Math.cos(k * 1.57) * r * 0.7, 0.45, Math.sin(k * 1.57) * r * 0.7), solid(0x5a3b22)));
  return merge(parts);
}
function stoneHouse(seed = 1, w = 5, d = 4, h = 3.2) {
  const r = mulberry32(seed);
  const stone = [0xbdb3a2, 0xc8bfae, 0xa9a090, 0xd3c9b6][seed % 4], roofC = [0x8f3b2a, 0xa5482f, 0x6b4a3a, 0x7e3326][seed % 4];
  const body = paint(new THREE.BoxGeometry(w, h, d, 4, 3, 4), (x, y, z, c) => { const blk = Math.sin(y * 6.5) * Math.sin(x * 3.2 + z * 3.2 + Math.floor(y * 2) * 1.3); c.set(stone).multiplyScalar(0.84 + 0.12 * blk + 0.08 * r()); });
  T(body, 0, h / 2);
  // pitched roof: triangular prism
  const shape = new THREE.Shape(); shape.moveTo(-w / 2 - 0.35, 0); shape.lineTo(0, h * 0.55); shape.lineTo(w / 2 + 0.35, 0); shape.lineTo(-w / 2 - 0.35, 0);
  const roof = new THREE.ExtrudeGeometry(shape, { depth: d + 0.6, bevelEnabled: false });
  roof.translate(0, h, -(d + 0.6) / 2);
  const roofP = paint(roof, (x, y, z, c) => { c.set(roofC).multiplyScalar(0.8 + 0.18 * Math.abs(Math.sin(y * 9)) + 0.06 * r()); });
  const chim = paint(T(new THREE.BoxGeometry(0.5, 1.4, 0.5), w * 0.25, h + h * 0.4, d * 0.15), solid(0x7a7068));
  const door = paint(new THREE.PlaneGeometry(1.0, 1.9), solid(0x3a2414, 0)); T(door, 0, 0.95, d / 2 + 0.01);
  const wins = [];
  for (const x of [-w * 0.3, w * 0.3]) { const wn = paint(new THREE.PlaneGeometry(0.7, 0.8), solid(0x2c3640, 0)); T(wn, x, h * 0.62, d / 2 + 0.01); wins.push(wn); }
  return merge([body, roofP, chim, door, ...wins]);
}
function temple() {
  const parts = [];
  const stone = 0xd9cfbd;
  const tiers = [[24, 1.6], [19, 1.6], [14.5, 1.6], [10.5, 1.6]];
  let y = 0;
  for (const [s, h] of tiers) {
    parts.push(paint(T(new THREE.BoxGeometry(s, h, s, 2, 1, 2), 0, y + h / 2), (x, yy, z, c) => c.set(stone).multiplyScalar(0.84 + 0.1 * Math.sin(yy * 8) + 0.05 * Math.random())));
    y += h;
  }
  // stairs (front)
  for (let k = 0; k < 24; k++) parts.push(paint(T(new THREE.BoxGeometry(4.5, 0.27 * (k + 1), 0.34), 0, 0.135 * (k + 1), 12.6 - k * 0.31), solid(0xcfc4b0, 0.03)));
  // colonnade on top
  for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2 + Math.PI / 8; parts.push(paint(T(new THREE.CylinderGeometry(0.35, 0.4, 4.2, 10), Math.cos(a) * 4, y + 2.1, Math.sin(a) * 4), solid(0xe8e0d0, 0.03))); }
  parts.push(paint(T(new THREE.CylinderGeometry(4.45, 4.45, 0.5, 20), 0, y + 4.45), solid(0xd9cfbd, 0.03)));
  // obelisk pointing at the sky (gold tip)
  parts.push(paint(T(new THREE.CylinderGeometry(0.6, 1.0, 9, 4), 0, y + 4.7 + 4.5, 0, Math.PI / 4), solid(0xe2d8c4, 0.03)));
  parts.push(paint(T(new THREE.ConeGeometry(0.85, 1.6, 4), 0, y + 4.7 + 9.8, 0, Math.PI / 4), solid(0xe0b44a, 0.02)));
  return merge(parts);
}
function bannerPole(color) {
  const pole = paint(T(new THREE.CylinderGeometry(0.06, 0.07, 6, 6), 0, 3), solid(0x5a3b22));
  const cloth = paint(T(new THREE.PlaneGeometry(1.4, 2.4, 4, 6), 0.75, 4.6, 0), solid(color, 0.05));
  return merge([pole, cloth]);
}
function castle() {
  const parts = [], stone = 0xb9b1a2, roofC = 0x7d2a24;
  const S = (hex) => (x, y, z, c) => c.set(hex).multiplyScalar(0.82 + 0.12 * Math.sin(y * 5 + x * 2) * Math.sin(z * 3) + 0.06 * Math.random());
  // keep
  parts.push(paint(T(new THREE.BoxGeometry(16, 11, 12, 3, 3, 3), 0, 5.5), S(stone)));
  const shape = new THREE.Shape(); shape.moveTo(-8.6, 0); shape.lineTo(0, 6); shape.lineTo(8.6, 0); shape.lineTo(-8.6, 0);
  const roof = new THREE.ExtrudeGeometry(shape, { depth: 13, bevelEnabled: false }); roof.translate(0, 11, -6.5);
  parts.push(paint(roof, (x, y, z, c) => c.set(roofC).multiplyScalar(0.8 + 0.15 * Math.abs(Math.sin(y * 7)))));
  // towers
  for (const [x, z] of [[-10, -7], [10, -7], [-10, 7], [10, 7]]) {
    parts.push(paint(T(new THREE.CylinderGeometry(2.4, 2.6, 15, 14), x, 7.5, z), S(stone)));
    parts.push(paint(T(new THREE.ConeGeometry(3.0, 6, 14), x, 18, z), (xx, y, zz, c) => c.set(roofC).multiplyScalar(0.8 + 0.15 * Math.abs(Math.sin(y * 9)))));
    for (let k = 0; k < 10; k++) { const a = k / 10 * Math.PI * 2; parts.push(paint(T(new THREE.BoxGeometry(0.7, 0.8, 0.5), x + Math.cos(a) * 2.5, 15.3, z + Math.sin(a) * 2.5, -a), S(stone))); }
  }
  // curtain walls with battlements + gate
  for (const [x0, z0, x1, z1] of [[-10, 12, -3.2, 12], [3.2, 12, 10, 12], [-14, -10, -14, 12], [14, -10, 14, 12]]) {
    const L = Math.hypot(x1 - x0, z1 - z0), ang = Math.atan2(z1 - z0, x1 - x0);
    parts.push(paint(T(new THREE.BoxGeometry(L, 6, 1.6), (x0 + x1) / 2, 3, (z0 + z1) / 2, -ang), S(stone)));
    for (let k = 0; k < L / 1.6; k++) { const t = (k + 0.5) / (L / 1.6); parts.push(paint(T(new THREE.BoxGeometry(0.8, 0.9, 1.6), x0 + (x1 - x0) * t, 6.4, z0 + (z1 - z0) * t, -ang), S(stone))); }
  }
  for (const x of [-3.6, 3.6]) { parts.push(paint(T(new THREE.BoxGeometry(1.4, 9, 2.2), x, 4.5, 12), S(stone))); parts.push(paint(T(new THREE.ConeGeometry(1.1, 2.2, 4), x, 10.1, 12, Math.PI / 4), (xx, y, zz, c) => c.set(roofC).multiplyScalar(0.85))); }
  // grand stairs in the courtyard, rising to a landing and the keep door (where the king and the guards stand)
  for (let k = 0; k < 10; k++) parts.push(paint(T(new THREE.BoxGeometry(9, 0.3 * (k + 1), 0.62), 0, 0.15 * (k + 1), 11.4 - k * 0.55), solid(0xc9c0b0, 0.03)));
  parts.push(paint(T(new THREE.BoxGeometry(11, 3.0, 1.6), 0, 1.5, 6.6), solid(0xc2b9a8, 0.03)));
  parts.push(paint(T(new THREE.PlaneGeometry(3.2, 4.2), 0, 3.0 + 2.1, 6.02), solid(0x3a2414, 0.04)));
  for (const x of [-2.2, 2.2]) parts.push(paint(T(new THREE.CylinderGeometry(0.32, 0.36, 4.6, 10), x, 3.0 + 2.3, 6.9), solid(0xe0d8c8, 0.03)));
  return merge(parts);
}
function stoneWall(L = 12, H = 7) {
  const parts = [];
  const S = (x, y, z, c) => c.set(0xa9a191).multiplyScalar(0.8 + 0.14 * Math.sin(y * 4.5) * Math.sin(x * 2.1) + 0.06 * Math.random());
  parts.push(paint(T(new THREE.BoxGeometry(L, H, 2.2, 6, 3, 1), 0, H / 2), S));
  for (let k = 0; k < L / 1.5; k++) parts.push(paint(T(new THREE.BoxGeometry(0.8, 1.0, 2.2), -L / 2 + 0.75 + k * 1.5, H + 0.5), S));
  return merge(parts);
}
function windmill() {
  const tower = paint(T(new THREE.CylinderGeometry(1.6, 2.4, 9, 12), 0, 4.5), solid(0xe0d6c4, 0.05));
  const cap = paint(T(new THREE.ConeGeometry(2.0, 2.4, 12), 0, 10.2), solid(0x6b4a3a, 0.05));
  return merge([tower, cap]);
}
function windmillBlades() {
  const parts = [];
  for (let k = 0; k < 4; k++) { const b = new THREE.BoxGeometry(0.5, 6.5, 0.08); b.translate(0, 3.4, 0); b.rotateZ(k * Math.PI / 2); parts.push(paint(b, solid(0xd8ccb4, 0.05))); }
  return merge(parts);
}
function stall(seed) {
  const cols = [0xc23b2e, 0x2f6bb8, 0xe0b23a, 0x3a8a4a];
  const parts = [paint(T(new THREE.BoxGeometry(2.4, 1.0, 1.4), 0, 0.5), solid(0x8a6a45))];
  for (const [x, z] of [[-1.1, -0.6], [1.1, -0.6], [-1.1, 0.6], [1.1, 0.6]]) parts.push(paint(T(new THREE.CylinderGeometry(0.05, 0.05, 2.2, 5), x, 1.1, z), solid(0x5a3b22)));
  const roof = new THREE.PlaneGeometry(2.8, 1.8); roof.rotateX(-Math.PI / 2 + 0.25); T(roof, 0, 2.25, 0);
  parts.push(paint(roof, (x, y, z, c) => c.set(cols[seed % 4]).multiplyScalar(Math.floor((x + 1.4) * 2.5) % 2 ? 1 : 0.75)));
  return merge(parts);
}
function bridge(L = 40, W = 5) {
  const parts = [];
  for (let k = 0; k < L / 1.2; k++) { const x = -L / 2 + k * 1.2; const y = 2.2 + Math.sin((k * 1.2) / L * Math.PI) * 2.0; parts.push(paint(T(new THREE.BoxGeometry(1.1, 0.25, W), x, y, 0), solid(0x7a5532, 0.08, k))); }
  for (const z of [-W / 2, W / 2]) for (let k = 0; k <= L / 4; k++) { const x = -L / 2 + k * 4; const y = 2.2 + Math.sin((k * 4) / L * Math.PI) * 2.0; parts.push(paint(T(new THREE.CylinderGeometry(0.1, 0.1, 1.2, 5), x, y + 0.6, z), solid(0x5a3b22))); }
  for (let k = 0; k < 5; k++) { const x = -L / 2 + (k + 0.5) * L / 5; parts.push(paint(T(new THREE.CylinderGeometry(0.35, 0.4, 5, 8), x, 0, 0), solid(0x5a3b22))); }
  return merge(parts);
}
function bowl() {
  const prof = [[0, 0], [0.55, 0.03], [0.86, 0.16], [0.99, 0.38], [1.03, 0.52], [1.0, 0.56], [0.93, 0.5], [0.83, 0.3], [0.6, 0.15], [0.3, 0.1], [0, 0.09]].map(([x, y]) => new THREE.Vector2(x, y));
  return paint(new THREE.LatheGeometry(prof, 28), (x, y, z, c) => c.set(0x9a6a44).multiplyScalar(y > 0.5 ? 1.1 : (Math.hypot(x, z) < 0.9 && y > 0.08 && y < 0.5 ? 0.62 : 0.9)));
}
function pot() { const prof = [[0, 0], [0.18, 0.02], [0.26, 0.15], [0.24, 0.32], [0.15, 0.42], [0.13, 0.48], [0.16, 0.52]].map(([x, y]) => new THREE.Vector2(x, y)); return paint(new THREE.LatheGeometry(prof, 12), solid(0xb5703f, 0.1)); }
function berryBush(seed = 1) {
  const r = mulberry32(seed), parts = [];
  for (let k = 0; k < 4; k++) { const g = new THREE.IcosahedronGeometry(0.45 + 0.2 * r(), 1); T(g, (r() - 0.5) * 0.8, 0.4 + r() * 0.2, (r() - 0.5) * 0.8); parts.push(paint(g, (x, y, z, c) => c.set(0x3f6a2e).multiplyScalar(0.7 + 0.4 * r()))); }
  for (let k = 0; k < 16; k++) { const g = new THREE.SphereGeometry(0.06, 6, 4); T(g, (r() - 0.5) * 1.1, 0.25 + r() * 0.6, (r() - 0.5) * 1.1); parts.push(paint(g, solid(0x8a1f3a, 0.15, k))); }
  return merge(parts);
}
function fieldCrop(stage) {
  // a row-planted crop patch 10x10 m as a single geometry (stalks), stage 0..1 growth, colour green->gold
  const parts = [];
  const rows = 9, per = 14;
  for (let i = 0; i < rows; i++) for (let j = 0; j < per; j++) {
    const g = new THREE.ConeGeometry(0.11, 0.9, 4, 1, true);
    T(g, -4.5 + i * 1.12, 0.45, -4.6 + j * 0.68 + (i % 2) * 0.3);
    parts.push(g);
  }
  const g = merge(parts.map(p => { p.deleteAttribute('uv'); return p.index ? p.toNonIndexed() : p; }));
  return paint(g, (x, y, z, c) => c.set(0x6f9a3a).lerp(new THREE.Color(0xd8b04a), stage).multiplyScalar(0.7 + 0.45 * (y / 0.9)));
}

// ---- props added for the later chapters
function stoneBridge(L = 46, W = 6) {
  const parts = [];
  const S = (x, y, z, c) => c.set(0xbdb4a3).multiplyScalar(0.8 + 0.12 * Math.sin(y * 6 + x * 1.7) * Math.sin(z * 4.1) + 0.08 * Math.random());
  const arch = (x) => 3.6 + Math.sin(((x + L / 2) / L) * Math.PI) * 1.6;
  for (let k = 0; k < L / 1.0; k++) { const x = -L / 2 + k + 0.5; parts.push(paint(T(new THREE.BoxGeometry(1.02, 0.7, W), x, arch(x), 0), S)); }
  for (const z of [-W / 2 + 0.3, W / 2 - 0.3]) for (let k = 0; k < L / 1.0; k++) { const x = -L / 2 + k + 0.5; parts.push(paint(T(new THREE.BoxGeometry(1.02, 0.9, 0.5), x, arch(x) + 0.8, z), S)); }
  for (let k = 0; k < 4; k++) { const x = -L / 2 + (k + 0.5) * L / 4; parts.push(paint(T(new THREE.BoxGeometry(2.4, 9, W * 0.9), x, arch(x) - 4.8, 0), S)); }
  return merge(parts);
}
function cartBody() {
  const parts = [];
  parts.push(paint(T(new THREE.BoxGeometry(1.9, 0.12, 1.1), 0, 0.72, 0), solid(0x7a5532, 0.1)));
  for (const z of [-0.52, 0.52]) parts.push(paint(T(new THREE.BoxGeometry(1.9, 0.38, 0.06), 0, 0.95, z), solid(0x6b4a2b, 0.1)));
  for (const x of [-0.92, 0.92]) parts.push(paint(T(new THREE.BoxGeometry(0.06, 0.38, 1.1), x, 0.95, 0), solid(0x6b4a2b, 0.1)));
  for (const z of [-0.35, 0.35]) parts.push(paint(T(new THREE.BoxGeometry(1.6, 0.07, 0.07), 1.7, 0.62, z), solid(0x5a3b22)));
  parts.push(paint(T(new THREE.CylinderGeometry(0.04, 0.04, 1.4, 6).rotateX(Math.PI / 2), 0, 0.5, 0), solid(0x3a2a1a)));
  // load: grain sacks / pots
  for (let k = 0; k < 5; k++) parts.push(paint(T(new THREE.SphereGeometry(0.26, 10, 8), -0.6 + k * 0.3, 1.02, (k % 2 - 0.5) * 0.4, 0, 1, 0.75, 1), solid(0xc9a46a, 0.12, k)));
  return merge(parts);
}
function wheel() {
  const parts = [paint(new THREE.TorusGeometry(0.46, 0.05, 6, 20), solid(0x5a3b22)), paint(new THREE.CylinderGeometry(0.09, 0.09, 0.12, 10).rotateX(Math.PI / 2), solid(0x4a3020))];
  for (let k = 0; k < 6; k++) { const b = new THREE.BoxGeometry(0.05, 0.9, 0.04); b.rotateZ(k / 6 * Math.PI); parts.push(paint(b, solid(0x6b4a2b))); }
  return merge(parts);
}
function anvil() {
  const parts = [paint(T(new THREE.CylinderGeometry(0.32, 0.38, 0.6, 10), 0, 0.3, 0), solid(0x5a3b22))];
  parts.push(paint(T(new THREE.BoxGeometry(0.62, 0.22, 0.26), 0, 0.72, 0), solid(0x3b3d42, 0.05)));
  parts.push(paint(T(new THREE.ConeGeometry(0.11, 0.34, 8).rotateZ(-Math.PI / 2), 0.46, 0.76, 0), solid(0x3b3d42, 0.05)));
  parts.push(paint(T(new THREE.BoxGeometry(0.3, 0.12, 0.2), 0, 0.6, 0), solid(0x34363b, 0.05)));
  return merge(parts);
}
function forge() {
  const parts = [paint(T(new THREE.BoxGeometry(1.6, 0.9, 1.2, 2, 2, 2), 0, 0.45, 0), (x, y, z, c) => c.set(0x8d8478).multiplyScalar(0.8 + 0.2 * Math.random()))];
  parts.push(paint(T(new THREE.CylinderGeometry(0.3, 0.45, 2.2, 8), 0, 1.9, -0.3), solid(0x7a7068, 0.1)));
  parts.push(paint(T(new THREE.BoxGeometry(1.0, 0.12, 0.8), 0, 0.92, 0.1), solid(0x2a1208, 0.1)));
  return merge(parts);
}
function cage() {
  const parts = [paint(T(new THREE.BoxGeometry(2.2, 0.12, 2.2), 0, 0.06, 0), solid(0x5a3b22)), paint(T(new THREE.BoxGeometry(2.3, 0.14, 2.3), 0, 2.3, 0), solid(0x5a3b22))];
  for (let k = 0; k < 16; k++) { const side = Math.floor(k / 4), u = (k % 4) / 4 - 0.375; const x = side < 2 ? u * 2.2 : (side === 2 ? -1.05 : 1.05), z = side < 2 ? (side === 0 ? -1.05 : 1.05) : u * 2.2; parts.push(paint(T(new THREE.CylinderGeometry(0.05, 0.05, 2.25, 5), x, 1.15, z), solid(0x6b4a2b))); }
  return merge(parts);
}
function pedestal() { return merge([paint(T(new THREE.BoxGeometry(1.5, 1.1, 1.5), 0, 0.55, 0), (x, y, z, c) => c.set(0xb3ab9a).multiplyScalar(0.85 + 0.12 * Math.random())), paint(T(new THREE.BoxGeometry(1.8, 0.2, 1.8), 0, 0.1, 0), solid(0xa39b8a, 0.05))]); }
function podium() {
  const parts = [paint(T(new THREE.BoxGeometry(4.4, 1.2, 3.0), 0, 0.6, 0), solid(0x8a6a45, 0.1))];
  for (let k = 0; k < 3; k++) parts.push(paint(T(new THREE.BoxGeometry(1.6, 0.4 * (k + 1), 0.45), 0, 0.2 * (k + 1), 2.6 - k * 0.45), solid(0x7a5532, 0.08)));
  return merge(parts);
}
function cheese() { const g = new THREE.CylinderGeometry(0.22, 0.22, 0.16, 14, 1, false, 0, Math.PI * 0.45); return paint(T(g, 0, 0.08, 0), (x, y, z, c) => c.set(0xf2cf5a).multiplyScalar(0.9 + 0.1 * Math.random())); }
function figurine() {
  const parts = [paint(T(new THREE.SphereGeometry(0.035, 10, 8), 0, 0.2, 0), solid(0xb5703f, 0.05)), paint(T(new THREE.CylinderGeometry(0.025, 0.04, 0.16, 8), 0, 0.09, 0), solid(0xa9653a, 0.05))];
  for (const s of [-1, 1]) parts.push(paint(T(new THREE.CylinderGeometry(0.01, 0.01, 0.08, 5).rotateZ(s * 0.5), s * 0.04, 0.13, 0), solid(0xa9653a, 0.05)));
  return merge(parts);
}
function grainBasket() {
  const prof = [[0, 0], [0.2, 0.0], [0.26, 0.1], [0.3, 0.28], [0.31, 0.32]].map(([x, y]) => new THREE.Vector2(x, y));
  const b = paint(new THREE.LatheGeometry(prof, 14), (x, y, z, c) => c.set(0xb08a4f).multiplyScalar(0.8 + 0.25 * Math.abs(Math.sin(Math.atan2(z, x) * 18 + y * 30))));
  const top = paint(T(new THREE.SphereGeometry(0.29, 14, 6, 0, Math.PI * 2, 0, Math.PI / 2), 0, 0.27, 0, 0, 1, 0.35, 1), (x, y, z, c) => c.set(0xe0b85a).multiplyScalar(0.85 + 0.2 * Math.random()));
  return merge([b, top]);
}
function stoneSlab() { return paint(T(new THREE.BoxGeometry(1.1, 1.6, 0.22), 0, 0.8, 0), (x, y, z, c) => c.set(0xbfb6a4).multiplyScalar(0.85 + 0.1 * Math.random())); }
function tent() {
  const g = new THREE.ConeGeometry(3.2, 3.4, 8, 1, true); T(g, 0, 1.7, 0);
  return paint(g, (x, y, z, c) => c.set(Math.floor((Math.atan2(z, x) + Math.PI) / (Math.PI / 4)) % 2 ? 0x2a5bd7 : 0xe8e4da).multiplyScalar(0.85 + 0.15 * (y / 3.4)));
}

// ---- the other peoples: Nuvia on the lake, the Tamari on the plain
const WOOD = 0x8a6a45, WOOD_D = 0x5a3b22, REED = 0xb89a64, TEAL = 0x2a9db0;
function stiltHouse(seed = 1) {
  const r = mulberry32(seed * 13 + 5), parts = [];
  const py = 2.3;                                       // platform height above the base (water or beach)
  parts.push(paint(T(new THREE.BoxGeometry(4.6, 0.18, 4.0, 8, 1, 8), 0, py, 0), (x, y, z, c) => c.set(WOOD).multiplyScalar(0.72 + 0.32 * Math.abs(Math.sin(x * 6.1 + 0.3 * z)) + 0.04 * r())));
  for (const [x, z] of [[-2.0, -1.7], [0, -1.8], [2.0, -1.7], [-2.0, 1.7], [0, 1.8], [2.0, 1.7]])
    parts.push(paint(T(new THREE.CylinderGeometry(0.1, 0.13, py + 3.0, 6), x + (r() - 0.5) * 0.12, (py - 3.0) / 2, z + (r() - 0.5) * 0.12), solid(WOOD_D, 0.12, seed)));
  const wall = paint(new THREE.CylinderGeometry(1.55, 1.6, 1.75, 16, 1, true), (x, y, z, c) => { const a = Math.atan2(z, x); c.set(REED).multiplyScalar(0.78 + 0.22 * Math.abs(Math.sin(a * 26)) + 0.08 * (y / 1.75)); });
  T(wall, 0, py + 0.09 + 0.875);
  const roof = thatch(2.35, 2.2, seed + 40); T(roof, 0, py + 1.84 + 1.05);
  const door = paint(new THREE.PlaneGeometry(0.85, 1.35), solid(0x1d140d, 0)); T(door, 0, py + 0.78, 1.62);
  const cloth = paint(new THREE.PlaneGeometry(0.95, 0.32), solid(TEAL, 0.05)); T(cloth, 0, py + 1.62, 1.64);
  parts.push(wall, roof, door, cloth);
  for (let k = 0; k < 7; k++) parts.push(paint(T(new THREE.CylinderGeometry(0.04, 0.04, 0.7, 5), -2.1 + k * 0.7, py + 0.42, 1.92), solid(WOOD_D)));
  parts.push(paint(T(new THREE.BoxGeometry(4.4, 0.06, 0.06), 0, py + 0.74, 1.92), solid(WOOD)));
  // ladder down to the water
  const lad = [];
  for (const x of [-0.32, 0.32]) lad.push(T(new THREE.BoxGeometry(0.07, 3.4, 0.07), x, 0, 0));
  for (let k = 0; k < 7; k++) lad.push(T(new THREE.BoxGeometry(0.64, 0.05, 0.06), 0, -1.4 + k * 0.45, 0));
  const lg = merge(lad.map(g => g.index ? g.toNonIndexed() : g)); lg.rotateX(-0.32); T(lg, 1.2, py - 1.3, 2.45);
  parts.push(paint(lg, solid(WOOD_D)));
  return merge(parts);
}
function pier(L = 18) {
  const parts = [];
  for (let k = 0; k < L / 0.5; k++) parts.push(paint(T(new THREE.BoxGeometry(1.6, 0.1, 0.46), 0, 1.7, -L / 2 + k * 0.5 + 0.25), solid(WOOD, 0.14, k)));
  for (let k = 0; k <= L / 3; k++) for (const x of [-0.75, 0.75]) parts.push(paint(T(new THREE.CylinderGeometry(0.08, 0.1, 4.6, 6), x, -0.6, -L / 2 + k * 3), solid(WOOD_D)));
  return merge(parts);
}
function canoe(seed = 1) {
  const parts = [];
  const hull = new THREE.SphereGeometry(1, 22, 8, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2); hull.scale(0.46, 0.34, 2.3);
  parts.push(paint(hull, (x, y, z, c) => c.set(seed % 2 ? 0x6b4a2b : 0x7d5a36).multiplyScalar(0.78 + 0.22 * Math.abs(Math.sin(z * 2.7)) + 0.12 * (y + 0.34))));
  const deck = new THREE.CircleGeometry(1, 22); deck.rotateX(-Math.PI / 2); deck.scale(0.4, 1, 2.18); T(deck, 0, -0.07, 0);
  parts.push(paint(deck, solid(0x3a2716, 0.06)));
  for (const z of [-0.8, 0.7]) parts.push(paint(T(new THREE.BoxGeometry(0.78, 0.05, 0.16), 0, -0.04, z), solid(WOOD)));
  const stripe = new THREE.TorusGeometry(1, 0.025, 4, 32); stripe.rotateX(Math.PI / 2); stripe.scale(0.46, 1, 2.3); T(stripe, 0, -0.02, 0);
  parts.push(paint(stripe, solid(TEAL, 0.05)));
  return merge(parts);
}
function paddle() {
  return merge([paint(T(new THREE.CylinderGeometry(0.025, 0.025, 1.5, 5), 0, 0.75, 0), solid(WOOD)), paint(T(new THREE.BoxGeometry(0.18, 0.45, 0.03), 0, 0.0, 0), solid(WOOD))]);
}
function tamariTent(seed = 1) {
  const r = mulberry32(seed * 7 + 1), parts = [];
  const R = 2.6, wh = 1.55;
  const felt = [0xd8c39a, 0xcdb48a, 0xe0cfa8][seed % 3];
  const wall = paint(new THREE.CylinderGeometry(R, R * 1.02, wh, 26, 1, true), (x, y, z, c) => {
    const a = Math.atan2(z, x), band = Math.abs(y + 0.35) < 0.13 || Math.abs(y - 0.5) < 0.06;
    c.set(band ? 0x9a3b2a : felt).multiplyScalar(0.84 + 0.1 * Math.abs(Math.sin(a * 13)) + 0.05 * r()); });
  T(wall, 0, wh / 2);
  const roof = new THREE.ConeGeometry(R * 1.06, 1.35, 26, 2, true); T(roof, 0, wh + 0.66);
  parts.push(wall, paint(roof, (x, y, z, c) => { const a = Math.atan2(z, x); c.set(Math.floor((a + Math.PI) / (Math.PI / 6)) % 2 ? 0xb5813a : 0xa06e30).multiplyScalar(0.82 + 0.25 * (y + 0.68) / 1.35); }));
  parts.push(paint(T(new THREE.CylinderGeometry(0.28, 0.32, 0.22, 10), 0, wh + 1.38, 0), solid(0x5a3b22)));
  parts.push(paint(T(new THREE.PlaneGeometry(0.95, 1.3), 0, 0.65, R + 0.03), solid(0x7a2a1e, 0.05)));
  for (let k = 0; k < 6; k++) { const a = k / 6 * Math.PI * 2 + 0.4; const g = new THREE.CylinderGeometry(0.012, 0.012, 1.9, 4); g.rotateZ(0.95); g.rotateY(-a); T(g, Math.cos(a) * (R + 0.75), 0.8, Math.sin(a) * (R + 0.75)); parts.push(paint(g, solid(0xcdbd98))); }
  return merge(parts);
}
function shrine() {
  const parts = [];
  parts.push(paint(T(new THREE.CylinderGeometry(0.22, 0.3, 6.6, 12, 12), 0, 3.3, 0), (x, y, z, c) => { const b = Math.floor(y / 0.55) % 3; c.set(b === 0 ? TEAL : b === 1 ? 0xe8e2d0 : WOOD).multiplyScalar(0.86 + 0.1 * Math.abs(Math.sin(Math.atan2(z, x) * 5))); }));
  const fish = new THREE.SphereGeometry(1, 14, 10); fish.scale(0.28, 0.42, 1.05); T(fish, 0, 7.05, 0.1);
  const tail = new THREE.ConeGeometry(0.45, 0.6, 4); tail.rotateX(-Math.PI / 2); tail.scale(0.25, 1, 1); T(tail, 0, 7.05, -1.15);
  parts.push(paint(fish, solid(0x5fb7c4, 0.08)), paint(tail, solid(0x4aa0ae, 0.08)));
  for (let k = 0; k < 6; k++) { const a = k / 6 * Math.PI * 2; const g = new THREE.BoxGeometry(0.08, 2.0, 0.02); g.translate(0, -1.0, 0); g.rotateZ(0.12 * Math.sin(k * 2.1)); g.rotateY(-a); T(g, Math.cos(a) * 0.3, 5.7, Math.sin(a) * 0.3); parts.push(paint(g, solid(k % 2 ? TEAL : 0xf2eee2, 0.04))); }
  for (let k = 0; k < 14; k++) { const a = k / 14 * Math.PI * 2; parts.push(paint(T(new THREE.IcosahedronGeometry(0.2 + 0.08 * Math.sin(k * 3.7), 0), Math.cos(a) * 1.3, 0.1, Math.sin(a) * 1.3, 0, 1, 0.6, 1), solid(0x8c8a84, 0.12, k))); }
  return merge(parts);
}
function fishRack() {
  const parts = [];
  for (const x of [-1.5, 1.5]) parts.push(paint(T(new THREE.CylinderGeometry(0.05, 0.06, 1.9, 5), x, 0.95, 0), solid(WOOD_D)));
  parts.push(paint(T(new THREE.CylinderGeometry(0.035, 0.035, 3.2, 5).rotateZ(Math.PI / 2), 0, 1.82, 0), solid(WOOD)));
  for (let k = 0; k < 9; k++) { const f = new THREE.SphereGeometry(1, 8, 6); f.scale(0.05, 0.22, 0.08); T(f, -1.25 + k * 0.31, 1.55, 0); parts.push(paint(f, solid(0xaab8c2, 0.1, k))); }
  return merge(parts);
}
function fishProp() {
  const b = new THREE.SphereGeometry(1, 12, 8); b.scale(0.065, 0.09, 0.27);
  const t = new THREE.ConeGeometry(0.09, 0.12, 4); t.rotateX(Math.PI / 2); t.scale(0.3, 1, 1); T(t, 0, 0, -0.3);
  return merge([paint(b, (x, y, z, c) => c.set(y > 0.02 ? 0x6f8796 : 0xc9d4da).multiplyScalar(0.9 + 0.1 * Math.random())), paint(t, solid(0x6f8796, 0.05))]);
}
function cheeseWheel() {
  const g = new THREE.CylinderGeometry(0.24, 0.24, 0.15, 20, 1); T(g, 0, 0.075, 0);
  return paint(g, (x, y, z, c) => c.set(Math.hypot(x, z) > 0.225 || y < 0.012 || y > 0.14 ? 0xd08a2e : 0xf8e7a0).multiplyScalar(0.94 + 0.06 * Math.random()));
}

export function initProtos() {
  if (PROTO.hut) return PROTO;
  PROTO.hut = [1, 2, 3].map(hutRound); PROTO.leanTo = [leanTo()]; PROTO.pen = [fencePen()]; PROTO.firePit = [firePit()];
  PROTO.clay = [1, 2, 3, 4].map(s => claHouse(s)); PROTO.clayBig = [claHouse(7, 7.5, 6, 3.6)]; PROTO.mud = [1, 2].map(mudHut); PROTO.kiln = [kiln()];
  PROTO.granary = [granary(false)]; PROTO.granaryBig = [granary(true)];
  PROTO.stone = [1, 2, 3, 4].map(s => stoneHouse(s)); PROTO.stoneBig = [stoneHouse(9, 8, 6, 5)];
  PROTO.temple = [temple()]; PROTO.castle = [castle()]; PROTO.wall = [stoneWall()];
  PROTO.windmill = [windmill()]; PROTO.blades = [windmillBlades()]; PROTO.stall = [0, 1, 2, 3].map(stall);
  PROTO.bridge = [bridge()]; PROTO.bowl = [bowl()]; PROTO.pot = [pot()]; PROTO.berry = [1, 2].map(berryBush);
  PROTO.bannerRed = [bannerPole(0xb3122a)]; PROTO.bannerBlue = [bannerPole(0x2a5bd7)]; PROTO.bannerYellow = [bannerPole(0xe0b23a)];
  PROTO.crop = [0, 0.35, 0.7, 1.0].map(fieldCrop);
  PROTO.stoneBridge = [stoneBridge()]; PROTO.cart = [cartBody()]; PROTO.wheel = [wheel()]; PROTO.anvil = [anvil()]; PROTO.forge = [forge()];
  PROTO.cage = [cage()]; PROTO.pedestal = [pedestal()]; PROTO.podium = [podium()]; PROTO.cheese = [cheese()]; PROTO.figurine = [figurine()];
  PROTO.grainBasket = [grainBasket()]; PROTO.slab = [stoneSlab()]; PROTO.tent = [tent()];
  PROTO.stilt = [1, 2, 3].map(stiltHouse); PROTO.pier = [pier(18), pier(26)]; PROTO.canoe = [1, 2].map(canoe); PROTO.paddle = [paddle()];
  PROTO.yurt = [0, 1, 2].map(tamariTent); PROTO.shrine = [shrine()]; PROTO.fishRack = [fishRack()]; PROTO.fish = [fishProp()]; PROTO.cheeseWheel = [cheeseWheel()];
  return PROTO;
}

// ------------------------------------------------------------------ materials
let BMAT = null;
export function buildingMaterial() {
  if (BMAT) return BMAT;
  BMAT = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.85, metalness: 0 });
  return BMAT;
}

// ------------------------------------------------------------------ the town of Prima over time
export const HILL = { x: 70, z: 55 };
export const TEMPLE_POS = { x: 64, z: 46 };
export const CASTLE_POS = { x: 98, z: 78 };
export const SPLIT_WALL = [[20, -120], [26, 30], [40, 160]];       // Kassa XIX's wall (year 1929)

function okSite(x, z, maxSlope = 0.32) {
  if (isWater(x, z)) return false;
  const [d, s] = distToRiver(x, z);
  if (d < riverWidth(s) * 1.25) return false;
  return slopeAt(x, z, 2.5) < maxSlope;
}

// deterministic list of all buildings ever built: {type, x, z, yaw, s, built, destroyed}
export function genTown() {
  const r = mulberry32(2025), B = [];
  const add = (o) => B.push({ yaw: 0, s: 1, destroyed: 1e9, ...o });
  // first huts (year 40-112) near the river at Prima
  const c0 = { x: -32, z: 8 };
  for (let k = 0; k < 46; k++) {
    const a = r() * Math.PI * 2, d = 8 + Math.sqrt(r()) * (12 + k * 1.2);
    const x = c0.x + Math.cos(a) * d, z = c0.z + Math.sin(a) * d * 1.2;
    if (!okSite(x, z)) continue;
    const built = k < 6 ? 41 + k * 2 : 60 + k * 4 + r() * 20;
    const riverbank = x < -26;
    add({ type: 'hut', v: k % 3, x, z, yaw: r() * 6.28, s: 0.9 + 0.25 * r(), built, destroyed: riverbank && built < 600 ? 610 : 1e9, replacedBy: riverbank ? null : 'clay' });
  }
  add({ type: 'firePit', v: 0, x: c0.x + 4, z: c0.z + 3, built: 40 });
  add({ type: 'pen', v: 0, x: c0.x - 10, z: c0.z + 26, built: 45, s: 1.2 });
  add({ type: 'granary', v: 0, x: c0.x + 10, z: c0.z - 6, built: 52 });
  // clay era (340+): kilns, clay houses; hill houses for Kassa (520+); riverbank mud huts
  add({ type: 'kiln', v: 0, x: -40, z: -18, built: 341 }); add({ type: 'kiln', v: 0, x: -44, z: -10, built: 380 });
  for (let k = 0; k < 110; k++) {
    const a = r() * Math.PI * 2, d = 18 + Math.sqrt(r()) * 70;
    const x = -5 + Math.cos(a) * d, z = 0 + Math.sin(a) * d;
    if (!okSite(x, z)) continue;
    const built = 350 + r() * 600;
    if (x < -28) add({ type: 'mud', v: k % 2, x, z, yaw: r() * 6.28, s: 0.85 + 0.3 * r(), built: 400 + r() * 200, destroyed: 610 });
    else add({ type: 'clay', v: k % 4, x, z, yaw: Math.round(r() * 4) * Math.PI / 2 + (r() - 0.5) * 0.3, s: 0.9 + 0.25 * r(), built, replacedBy: 'stone', replaceYear: 1100 + r() * 500 });
  }
  // Kassa's hill (520+)
  for (let k = 0; k < 14; k++) {
    const a = r() * Math.PI * 2, d = 18 + r() * 26;
    const x = HILL.x + Math.cos(a) * d, z = HILL.z + Math.sin(a) * d;
    if (!okSite(x, z, 0.45)) continue;
    add({ type: 'clayBig', v: 0, x, z, yaw: Math.atan2(-(z - HILL.z), -(x - HILL.x)), s: 0.9 + 0.2 * r(), built: 521 + k * 6, replacedBy: 'stoneBig', replaceYear: 1200 });
  }
  add({ type: 'granaryBig', v: 0, x: HILL.x - 20, z: HILL.z - 22, built: 522 });
  // temple on the hill (1000+)
  add({ type: 'temple', v: 0, x: TEMPLE_POS.x, z: TEMPLE_POS.z, built: 1002, s: 1.0, yaw: Math.PI * 0.85 });
  // stone town (1000 -> 1900): houses lining the streets, facing them
  const taken = [];
  const free = (x, z, rad) => { for (const [a, b, r2] of taken) if ((a - x) ** 2 + (b - z) ** 2 < (rad + r2) ** 2) return false; return true; };
  const inField = (x, z) => FIELDS.some(f => { const dx = x - f.x, dz = z - f.z, c = Math.cos(-f.ang), sn = Math.sin(-f.ang); const u = dx * c - dz * sn, v = dx * sn + dz * c; return Math.abs(u) < f.w / 2 + 3 && Math.abs(v) < f.h / 2 + 3; });
  for (const rd of ROADS) {
    if (rd.kind !== 'stone') continue;
    for (let i = 0; i < rd.pts.length - 1; i++) {
      const [ax, az] = rd.pts[i], [bx, bz] = rd.pts[i + 1];
      const L = Math.hypot(bx - ax, bz - az), tx = (bx - ax) / L, tz = (bz - az) / L, nx = -tz, nz = tx;
      for (let d = 3; d < L; d += 7.5 + r() * 2) {
        for (const side of [-1, 1]) {
          for (const row of [0, 1]) {
            if (row === 1 && r() < 0.45) continue;
            const off = rd.w / 2 + 4.5 + row * 9 + r() * 1.2;
            const x = ax + tx * d + nx * off * side, z = az + tz * d + nz * off * side;
            if (!okSite(x, z, 0.35) || !free(x, z, 3.2) || inField(x, z)) continue;
            if (Math.hypot(x - HILL.x, z - HILL.z) < 22 || Math.hypot(x - CASTLE_POS.x, z - CASTLE_POS.z) < 26) continue;
            const dc = Math.hypot(x - 10, z + 10);
            const built = Math.max(rd.year + 10, 1000 + Math.pow(dc / 300, 1.15) * 880) + r() * 90;
            const big = r() < 0.07;
            taken.push([x, z, 3.2]);
            add({ type: big ? 'stoneBig' : 'stone', v: Math.floor(r() * 4), x, z, yaw: Math.atan2(-nx * side, -nz * side), s: 0.85 + 0.25 * r(), built });
          }
        }
      }
    }
  }
  // castle (1420+), banners, windmills, stalls, bridge
  add({ type: 'castle', v: 0, x: CASTLE_POS.x, z: CASTLE_POS.z, built: 1421, yaw: Math.PI * 1.15 });
  add({ type: 'bridge', v: 0, x: -76, z: 30, yaw: Math.PI / 2 + 0.15, built: 1150, replacedBy: 'stoneBridge', replaceYear: 1480 });   // Pell's stone bridge
  for (let k = 0; k < 5; k++) add({ type: 'windmill', v: 0, x: 140 + k * 36 + r() * 10, z: -120 - r() * 60, built: 1600 + k * 40 });
  for (let k = 0; k < 18; k++) { const a = k / 18 * Math.PI * 2; add({ type: 'stall', v: k % 4, x: 8 + Math.cos(a) * 14, z: -6 + Math.sin(a) * 14, yaw: -a + Math.PI / 2, built: 1100 + k * 10 }); }
  // the temple (1002) and the palace (1421) replace whatever stood on their ground
  for (const b of B) {
    if (b.type === 'temple' || b.type === 'castle') continue;
    if (Math.hypot(b.x - TEMPLE_POS.x, b.z - TEMPLE_POS.z) < 17) b.destroyed = Math.min(b.destroyed, 1002);
    if (Math.hypot(b.x - CASTLE_POS.x, b.z - CASTLE_POS.z) < 20) b.destroyed = Math.min(b.destroyed, 1421);
    // the palace square: the forecourt in front of the gate stays open (castle-local lz 12..62, |lx| < 22)
    const yc = Math.PI * 1.15, cc = Math.cos(yc), sc = Math.sin(yc), dx = b.x - CASTLE_POS.x, dz = b.z - CASTLE_POS.z;
    const lx = dx * cc - dz * sc, lz = dx * sc + dz * cc;
    if (lz > 12 && lz < 62 && Math.abs(lx) < 22 && b.type !== 'stall') b.destroyed = Math.min(b.destroyed, 1421);
  }
  // Kassa XIX's wall (1926): demolishes whatever stands on its line; torn down after the revolution
  const wd = (x, z) => { let best = 1e9; for (let i = 0; i < SPLIT_WALL.length - 1; i++) { const [ax, az] = SPLIT_WALL[i], [bx, bz] = SPLIT_WALL[i + 1]; const dx = bx - ax, dz = bz - az, L2 = dx * dx + dz * dz; let t = ((x - ax) * dx + (z - az) * dz) / L2; t = Math.max(0, Math.min(1, t)); best = Math.min(best, Math.hypot(x - ax - dx * t, z - az - dz * t)); } return best; };
  for (const b of B) if (!['temple', 'castle', 'bridge', 'windmill'].includes(b.type) && wd(b.x, b.z) < 6) b.destroyed = Math.min(b.destroyed, 1926);
  for (let i = 0; i < SPLIT_WALL.length - 1; i++) {
    const [ax, az] = SPLIT_WALL[i], [bx, bz] = SPLIT_WALL[i + 1], L = Math.hypot(bx - ax, bz - az);
    for (let d = 6; d < L; d += 12) { const u = d / L; add({ type: 'wall', v: 0, x: ax + (bx - ax) * u, z: az + (bz - az) * u, yaw: -Math.atan2(bz - az, bx - ax), built: 1926.2 + u * 0.8, destroyed: 1933 }); }
  }
  return B;
}

export function townState(B, year, fluct = 0) {
  // returns visible buildings with growth factor
  const out = [];
  for (const b of B) {
    if (year < b.built) continue;
    let type = b.type;
    if (b.replaceYear && year >= b.replaceYear && b.replacedBy) type = b.replacedBy;
    if (year >= b.destroyed && (year < b.destroyed + 300 || b.type === 'mud' || b.type === 'wall' || b.destroyed >= 1000)) continue;
    const grow = clamp((year - b.built) / 3);
    out.push({ ...b, type, grow });
  }
  return out;
}

// Instanced renderer for the town
export class Town {
  constructor(scene) {
    initProtos();
    this.B = genTown();
    this.group = new THREE.Group();
    scene.add(this.group);
    this.meshes = {};
  }
  build(year, opts = {}) {
    for (const c of [...this.group.children]) { this.group.remove(c); if (c.isInstancedMesh) c.dispose(); }
    const vis = townState(this.B, year).filter(b => !opts.filter || opts.filter(b));
    const by = {};
    for (const b of vis) { const k = b.type + '_' + (b.v % PROTO[b.type].length); (by[k] = by[k] || []).push(b); }
    const m = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(), p = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0);
    let tris = 0;
    for (const [k, list] of Object.entries(by)) {
      const [type, v] = k.split('_');
      const geo = PROTO[type][parseInt(v)];
      const im = new THREE.InstancedMesh(geo, buildingMaterial(), list.length);
      list.forEach((b, i) => {
        const y = height(b.x, b.z) - 0.15;
        q.setFromAxisAngle(up, b.yaw); s.set(b.s, b.s * Math.max(0.02, b.grow), b.s); p.set(b.x, y, b.z);
        im.setMatrixAt(i, m.compose(p, q, s));
      });
      im.instanceMatrix.needsUpdate = true; im.castShadow = true; im.receiveShadow = true; im.frustumCulled = false;
      this.group.add(im);
      tris += list.length * geo.attributes.position.count / 3;
    }
    this.tris = tris; this.count = vis.length;
    return vis;
  }
}
