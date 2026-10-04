// The world's terrain: one deterministic height function, LOD meshes, river & lake.
import * as THREE from 'three';
import { Simplex, smoothstep, lerp, clamp } from './noise.js';
import { vertexLit } from './vlit.js';
import { GROUND_UNIFORMS } from './ground_uniforms.js';

export const SN = new Simplex(1337);
const SN2 = new Simplex(4242);
const SN3 = new Simplex(777);

export const WORLD = 6000;          // m, square side
export const LAKE_LEVEL = -7.5;
export const KING_HILL = { x: 70, z: 55, r: 75, h: 28 };
export const PRIMA = { x: 0, z: 0 };
export const MEADOW = { x: 260, z: 330 };          // where the 20 AIs wake up
export const MESSAGE_PLAIN = { x: 820, z: -760, r: 620 };

// River: control points from the northern mountains down past Prima into the lake.
export const RIVER = [
  [-260, 2600], [-210, 2100], [-150, 1700], [-180, 1300], [-110, 950], [-140, 620], [-95, 330],
  [-70, 120], [-78, -60], [-55, -260], [-95, -520], [-60, -800], [-110, -1100], [-160, -1500],
];

// Dense smooth polyline (Chaikin) used for BOTH carving and the water ribbon.
function chaikin(pts, it = 4) {
  let p = pts;
  for (let k = 0; k < it; k++) {
    const q = [p[0]];
    for (let i = 0; i < p.length - 1; i++) {
      const [ax, az] = p[i], [bx, bz] = p[i + 1];
      q.push([ax * 0.75 + bx * 0.25, az * 0.75 + bz * 0.25], [ax * 0.25 + bx * 0.75, az * 0.25 + bz * 0.75]);
    }
    q.push(p[p.length - 1]);
    p = q;
  }
  return p;
}
export const RIVER_PTS = chaikin(RIVER, 4);
// spatial buckets for fast nearest-segment queries
const RB = 200, rbuckets = new Map();
for (let i = 0; i < RIVER_PTS.length - 1; i++) {
  const [ax, az] = RIVER_PTS[i], [bx, bz] = RIVER_PTS[i + 1];
  const x0 = Math.floor((Math.min(ax, bx) - 260) / RB), x1 = Math.floor((Math.max(ax, bx) + 260) / RB);
  const z0 = Math.floor((Math.min(az, bz) - 260) / RB), z1 = Math.floor((Math.max(az, bz) + 260) / RB);
  for (let gx = x0; gx <= x1; gx++) for (let gz = z0; gz <= z1; gz++) {
    const k = gx * 100000 + gz; if (!rbuckets.has(k)) rbuckets.set(k, []); rbuckets.get(k).push(i);
  }
}
// returns [distance, s, zOfNearestPoint]  (s = segment index + t along RIVER_PTS)
function distToRiver(x, z) {
  const segs = rbuckets.get(Math.floor(x / RB) * 100000 + Math.floor(z / RB));
  if (!segs) return [1e9, 0, z];
  let best = 1e9, bs = 0, bz2 = z;
  for (const i of segs) {
    const [ax, az] = RIVER_PTS[i], [bx, bz] = RIVER_PTS[i + 1];
    const dx = bx - ax, dz = bz - az;
    let t = ((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz);
    t = t < 0 ? 0 : t > 1 ? 1 : t;
    const px = ax + dx * t, pz = az + dz * t;
    const d = Math.hypot(x - px, z - pz);
    if (d < best) { best = d; bs = i + t; bz2 = pz; }
  }
  return [best, bs, bz2];
}

export function riverWidth(s) { const f = s / (RIVER_PTS.length - 1); return 9 + 16 * smoothstep(0.1, 0.85, f) + 3 * Math.sin(s * 0.21); }
// water level as a function of the river's latitude (monotonic downhill)
const LV = [[2600, 55], [1700, 34], [1300, 22], [700, 8], [330, 3.2], [0, 0.6], [-600, -3.2], [-1100, -7.2], [-1600, -7.4]];
export function riverLevel(zr) {
  if (zr >= LV[0][0]) return LV[0][1];
  for (let i = 0; i < LV.length - 1; i++) {
    const [z0, l0] = LV[i], [z1, l1] = LV[i + 1];
    if (zr <= z0 && zr >= z1) { const t = (z0 - zr) / (z0 - z1); return l0 + (l1 - l0) * (t * t * (3 - 2 * t)); }
  }
  return LV[LV.length - 1][1];
}

// Base (un-carved) terrain height.
function baseHeight(x, z) {
  let h = 16 * SN.fbm(x / 1100, z / 1100, 5) + 5.5 * SN2.fbm(x / 260, z / 260, 4) + 1.1 * SN3.fbm(x / 45, z / 45, 3);
  // northern mountain range
  const north = smoothstep(650, 2300, z);
  if (north > 0) h += north * (40 + 420 * SN.ridged(x / 820 + 3.1, z / 820, 6));
  // western highlands
  const west = smoothstep(-700, -2500, x);
  if (west > 0) h += west * (20 + 180 * SN2.ridged(x / 600, z / 600 + 7.7, 5));
  // eastern hills
  const east = smoothstep(1300, 2800, x);
  if (east > 0) h += east * (10 + 140 * SN3.ridged(x / 500 + 1.3, z / 500, 5));
  // the fertile valley around Prima: gentle
  const val = Math.exp(-((x - 30) ** 2 + (z + 60) ** 2) / (520 * 520));
  h = lerp(h, 2.2 + 1.6 * SN3.fbm(x / 160, z / 160, 3) + 0.5 * SN.fbm(x / 30, z / 30, 2), val * 0.85);
  // the king's hill
  h += KING_HILL.h * Math.exp(-((x - KING_HILL.x) ** 2 + (z - KING_HILL.z) ** 2) / (KING_HILL.r * KING_HILL.r));
  // message plain (flat, slightly raised)
  const mp = Math.exp(-((x - MESSAGE_PLAIN.x) ** 2 + (z - MESSAGE_PLAIN.z) ** 2) / (MESSAGE_PLAIN.r * MESSAGE_PLAIN.r));
  h = lerp(h, 1.4 + 0.4 * SN.fbm(x / 120, z / 120, 2), smoothstep(0.25, 0.75, mp));
  // southern lake basin
  const lake = smoothstep(-850, -1450, z) * smoothstep(1400, 300, Math.abs(x + 150));
  h = lerp(h, -16 + 4 * SN2.fbm(x / 300, z / 300, 3), lake);
  return h;
}

// Terraces levelled for the temple and the palace (they sit on the slopes of the king's hill)
const PLATEAUS = [{ x: 64, z: 46, r0: 18, r1: 30 }, { x: 98, z: 78, r0: 20, r1: 33 }];
function carved(x, z) {
  let h = baseHeight(x, z);
  const [d, s, zr] = distToRiver(x, z);
  if (d < 400) {
    const w = riverWidth(s), lvl = riverLevel(zr);
    const floor = lvl + 1.3 + 0.35 * SN3.fbm(x / 25, z / 25, 2);
    const valley = 1 - smoothstep(w * 1.3, w * 7.0 + 60, d);
    if (h > floor) h = lerp(h, floor, valley * valley * (3 - 2 * valley));
    else h = lerp(h, floor, (1 - smoothstep(w * 1.0, w * 2.5, d)));
    const ch = 1 - smoothstep(w * 0.42, w * 1.0, d);
    h = lerp(h, lvl - 2.4, ch);
  }
  return h;
}

// ------------------------------------------------------------------ THE ARENA (Day 365 film)
// A closed valley: forest on the west half, open plain on the east half, a giant Wall along x = ARENA.wx.
export const ARENA = { wx: 1000, x0: 380, x1: 1620, z0: -240, z1: 840, waterY: 0.4, floorY: 2.6 };
// flat building grounds in the forest: [x, z, flat radius, blend radius]
const ARENA_FLAT = [[925, 300, 38, 95], [705, 330, 62, 125], [722, 262, 26, 62], [640, 420, 36, 85], [930, 40, 42, 95], [885, 190, 30, 75], [800, 470, 50, 100], [930, 330, 45, 105], [760, 260, 30, 70], [850, 280, 30, 70]];
const forestCreekU = (z) => 650 + 38 * Math.sin(z / 85) + 22 * Math.sin(z / 37 + 1.3);          // x of the forest stream
const plainRiverU = (z) => 1330 + 70 * Math.sin(z / 140 + 0.6) + 25 * Math.sin(z / 53);          // x of the plains river
export const creekX = (z) => forestCreekU(z);
export function arenaOutside(x, z) { return Math.hypot(Math.max(ARENA.x0 - x, 0, x - ARENA.x1), Math.max(ARENA.z0 - z, 0, z - ARENA.z1)); }
export function arenaMask(x, z) { return 1 - smoothstep(0, 180, arenaOutside(x, z)); }
export function arenaSide(x) { return smoothstep(-35, 35, x - ARENA.wx); }                       // 0 forest, 1 plain
export function distArenaWater(x, z) {                                                              // [distance, width]
  const a = Math.abs(x - forestCreekU(z)), b = Math.abs(x - plainRiverU(z));
  return a < b ? [a, 7] : [b, 15];
}
function arenaHeight(x, z) {
  const side = arenaSide(x);
  const plain = ARENA.floorY + 1.4 * SN3.fbm(x / 210, z / 210, 3) + 0.4 * SN.fbm(x / 38, z / 38, 2) + 0.9 * SN2.fbm(x / 90, z / 90, 2);
  const forest = ARENA.floorY + 9 * (0.5 + 0.5 * SN2.fbm(x / 150 + 4, z / 150, 4)) * smoothstep(20, 120, ARENA.wx - x) + 1.0 * SN3.fbm(x / 24, z / 24, 3);
  let fm = 0; for (const [zx, zz, r0, r1] of ARENA_FLAT) fm = Math.max(fm, 1 - smoothstep(r0, r1, Math.hypot(x - zx, z - zz)));
  const forestF = lerp(forest, ARENA.floorY + 0.35 * SN3.fbm(x / 30, z / 30, 2), fm);
  let h = lerp(forestF, plain, side);
  // the corridor around the Wall is flat on both sides
  h = lerp(ARENA.floorY + 0.15 * SN.fbm(x / 20, z / 20, 2), h, smoothstep(6, 70, Math.abs(x - ARENA.wx)));
  // creek (forest) and river (plain): carved channels with soft banks
  const [d, w] = distArenaWater(x, z);
  const bank = 1 - smoothstep(w * 0.9, w * 3.4, d);
  h = lerp(h, Math.min(h, ARENA.waterY + 0.9), bank * 0.9);
  h = lerp(h, ARENA.waterY - (w > 10 ? 2.4 : 1.4), 1 - smoothstep(w * 0.28, w * 0.62, d));
  return h;
}

// Final height: the carved landscape with the terraces applied.
export function height(x, z) {
  let h = carved(x, z);
  for (const p of PLATEAUS) {
    const d = Math.hypot(x - p.x, z - p.z);
    if (d < p.r1) { if (p.h === undefined) p.h = carved(p.x, p.z); h = lerp(p.h, h, smoothstep(p.r0, p.r1, d)); }
  }
  const am = arenaMask(x, z);
  if (am > 0) {
    const out = arenaOutside(x, z);
    const ridge = (46 + 60 * (0.5 + 0.5 * SN.fbm(x / 140, z / 140, 3))) * smoothstep(12, 150, out) * (1 - smoothstep(380, 620, out));
    h = lerp(h + ridge, arenaHeight(x, z), am) ;
  }
  return h;
}

export function slopeAt(x, z, e = 1.5) {
  const hx = height(x + e, z) - height(x - e, z);
  const hz = height(x, z + e) - height(x, z - e);
  return Math.hypot(hx, hz) / (2 * e);
}

export function isWater(x, z) {
  if (arenaMask(x, z) > 0.98) { const [da, wa] = distArenaWater(x, z); if (da < wa * 0.55) return true; }
  const [d, s] = distToRiver(x, z);
  if (d < riverWidth(s) * 0.78) return true;
  return height(x, z) < LAKE_LEVEL + 0.3;
}
export { distToRiver };

// ------------------------------------------------------------------ colours
const C = (h) => new THREE.Color(h);
const PAL = {
  grassA: C(0x587d34), grassB: C(0x7b9447), grassC: C(0x9aa358), dry: C(0xb3a462), forest: C(0x37502a),
  dirt: C(0x8b6b47), sand: C(0xcdb98a), rock: C(0x7d7a76), rockD: C(0x5c5a58), snow: C(0xf3f6fa), mud: C(0x5b4a36),
};
const tmp = new THREE.Color(), tmp2 = new THREE.Color(), tmp3 = new THREE.Color();
const ARC = { moss: C(0x1f3a1c), mossB: C(0x2f5226), litter: C(0x5a4630), gold: C(0xc2ab55), green: C(0x8b9f45), hay: C(0xd6bf6a), scorch: C(0x4a4038), mud: C(0x4f3f2e) };
let FOREST_FN = null;
export function setForestFn(f) { FOREST_FN = f; }
export function groundColor(x, z, h, slope, out) {
  const n1 = SN.fbm(x / 140, z / 140, 3), n2 = SN2.fbm(x / 23, z / 23, 2), n3 = SN3.fbm(x / 600, z / 600, 2);
  out.copy(PAL.grassA).lerp(PAL.grassB, clamp(0.5 + n1 * 0.9)).lerp(PAL.grassC, clamp(n3 * 1.2));
  out.lerp(PAL.dry, clamp((n2 - 0.25) * 1.6) * 0.5);
  out.lerp(PAL.forest, clamp(-n3 * 1.5) * 0.45);
  if (FOREST_FN) { const fd = FOREST_FN(x, z); out.lerp(PAL.forest, fd * 0.7); out.lerp(PAL.dirt, fd * fd * 0.25 * (0.5 + n2)); }
  const am = arenaMask(x, z);
  if (am > 0.001) {
    const sd = arenaSide(x), nn = SN2.fbm(x / 11, z / 11, 2), nl = SN.fbm(x / 70, z / 70, 3);
    const forestC = tmp2.copy(ARC.moss).lerp(ARC.litter, clamp(0.5 + nn * 0.9) * 0.7).lerp(ARC.mossB, clamp(nl * 1.4 + 0.3) * 0.5);
    const plainC = tmp3.copy(ARC.gold).lerp(ARC.green, clamp(0.5 + nl * 1.3) * 0.65).lerp(ARC.hay, clamp(nn * 1.2) * 0.4);
    const bc = forestC.lerp(plainC, sd);
    const wallStrip = 1 - smoothstep(4, 26, Math.abs(x - ARENA.wx));
    bc.lerp(ARC.scorch, wallStrip * 0.55 * (0.5 + 0.5 * clamp(nn + 0.4)));
    const [wd, ww] = distArenaWater(x, z);
    bc.lerp(ARC.mud, (1 - smoothstep(ww * 0.55, ww * 1.5, wd)) * 0.8);
    out.lerp(bc, am);
  }
  // sand/mud near water
  const [d, s] = distToRiver(x, z);
  const w = riverWidth(s);
  out.lerp(PAL.mud, (1 - smoothstep(w * 0.7, w * 1.25, d)) * 0.85);
  out.lerp(PAL.sand, (1 - smoothstep(w * 0.9, w * 1.5, d)) * (1 - smoothstep(w * 0.6, w * 0.9, d)) * 0.25);
  out.lerp(PAL.sand, (1 - smoothstep(LAKE_LEVEL + 0.2, LAKE_LEVEL + 2.5, h)) * 0.9);
  // rock on slopes, snow on peaks
  out.lerp(tmp.copy(PAL.rock).lerp(PAL.rockD, clamp(0.5 + n2)), smoothstep(0.55, 1.0, slope));
  out.lerp(PAL.snow, smoothstep(230, 330, h + n1 * 40) * (1 - smoothstep(0.9, 1.4, slope) * 0.7));
  // slight micro variation
  out.multiplyScalar(0.92 + 0.12 * (0.5 + 0.5 * n2));
  return out;
}

// ------------------------------------------------------------------ meshes
let grassDetailTex = null;
function detailTexture() {
  if (grassDetailTex) return grassDetailTex;
  const S = 512, cv = document.createElement('canvas'); cv.width = cv.height = S;
  const g = cv.getContext('2d');
  const img = g.createImageData(S, S);
  const n = new Simplex(99);
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    const v = 0.5 + 0.22 * n.fbm(x / 9, y / 9, 3) + 0.12 * n.noise(x / 2.2, y / 2.2);
    const c = Math.floor(clamp(v) * 255);
    const i = (y * S + x) * 4; img.data[i] = img.data[i + 1] = img.data[i + 2] = c; img.data[i + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  grassDetailTex = new THREE.CanvasTexture(cv);
  grassDetailTex.wrapS = grassDetailTex.wrapT = THREE.RepeatWrapping;
  grassDetailTex.colorSpace = THREE.NoColorSpace;
  grassDetailTex.anisotropy = 1;
  return grassDetailTex;
}

export function terrainMaterial() {
  const m = new THREE.MeshLambertMaterial({ vertexColors: true });
  const tex = detailTexture();
  m.onBeforeCompile = (sh) => {
    sh.uniforms.uDetail = { value: tex };
    Object.assign(sh.uniforms, GROUND_UNIFORMS);
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vWPos;')
      .replace('#include <worldpos_vertex>', '#include <worldpos_vertex>\nvWPos = (modelMatrix * vec4(transformed,1.0)).xyz;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 vWPos;\nuniform sampler2D uDetail;\nuniform sampler2D uGround; uniform float uGroundOn; uniform vec4 uGroundBounds;')
      .replace('#include <color_fragment>', `#include <color_fragment>
        if (uGroundOn > 0.5) {
          vec2 guv = (vWPos.xz - uGroundBounds.xy) / uGroundBounds.zw;
          if (guv.x > 0.0 && guv.y > 0.0 && guv.x < 1.0 && guv.y < 1.0) { vec4 gm = texture2D(uGround, guv); diffuseColor.rgb = mix(diffuseColor.rgb, gm.rgb, gm.a); }
        }
        float d1 = texture2D(uDetail, vWPos.xz * 0.21).r;
        float d2 = texture2D(uDetail, vWPos.xz * 0.023).r;
        diffuseColor.rgb *= mix(0.72, 1.25, d1) * mix(0.82, 1.16, d2);`);
  };
  return m;
}

// Builds a terrain grid mesh centred on (cx,cz), size S, n segments. holeAt: {x,z,s} region to sink (for LOD stacking)
export function buildTerrain(cx, cz, S, n, opts = {}) {
  const g = new THREE.PlaneGeometry(S, S, n, n);
  g.rotateX(-Math.PI / 2);
  const pos = g.attributes.position;
  const col = new Float32Array(pos.count * 3);
  const c = new THREE.Color();
  const hole = opts.hole;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i) + cx, z = pos.getZ(i) + cz;
    let h = height(x, z);
    if (hole) {
      const dx = Math.abs(x - hole.x) - hole.s / 2 + 4, dz = Math.abs(z - hole.z) - hole.s / 2 + 4;
      if (dx < 0 && dz < 0) h -= 6;
    }
    pos.setXYZ(i, x, h, z);
  }
  g.computeVertexNormals();
  const nrm = g.attributes.normal;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), z = pos.getZ(i), h = pos.getY(i);
    const slope = Math.sqrt(Math.max(0, 1 - nrm.getY(i) ** 2)) / Math.max(0.05, nrm.getY(i));
    groundColor(x, z, h, slope, c);
    if (opts.tint) opts.tint(x, z, c);
    col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
  }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const mesh = new THREE.Mesh(g, opts.material || terrainMaterial());
  mesh.receiveShadow = true;
  mesh.castShadow = !!opts.castShadow;
  mesh.matrixAutoUpdate = false;
  return mesh;
}

// One mesh, dense in the centre and sparse towards the edges (tensor-product warp).
export function buildTerrainWarped(cx, cz, n = 256, inner = 130, outer = 3600, frac = 0.42, opts = {}) {
  const g = new THREE.PlaneGeometry(2, 2, n, n);
  g.rotateX(-Math.PI / 2);
  const warp = (u) => {
    const a = Math.abs(u), sg = Math.sign(u);
    if (a <= frac) return sg * inner * (a / frac);
    const t = (a - frac) / (1 - frac);
    return sg * (inner + (outer - inner) * Math.pow(t, 2.1));
  };
  const pos = g.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = cx + warp(pos.getX(i)), z = cz + warp(pos.getZ(i));
    pos.setXYZ(i, x, height(x, z), z);
  }
  g.computeVertexNormals();
  const nrm = g.attributes.normal, col = new Float32Array(pos.count * 3), c = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), z = pos.getZ(i), h = pos.getY(i);
    const slope = Math.sqrt(Math.max(0, 1 - nrm.getY(i) ** 2)) / Math.max(0.05, nrm.getY(i));
    groundColor(x, z, h, slope, c);
    if (opts.tint) opts.tint(x, z, c);
    col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
  }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const mesh = new THREE.Mesh(g, opts.material || terrainMaterial());
  mesh.receiveShadow = true; mesh.matrixAutoUpdate = false; mesh.frustumCulled = false;
  return mesh;
}

// Polar wedge in front of the camera: dense near the viewer, sparse far away, only what is visible.
// cam: {x, z, yaw (radians, direction of view on XZ), half (half-angle in radians)}
export function buildTerrainWedge(cam, opts = {}) {
  const nr = opts.nr ?? 170, na = opts.na ?? 120, r0 = opts.r0 ?? 0.5, r1 = opts.r1 ?? 4200, back = opts.back ?? 30;
  const half = Math.min(Math.PI, cam.half);
  const V = [], idx = [];
  // radial distances: exponential spacing
  const rs = [];
  for (let i = 0; i <= nr; i++) { const t = i / nr; rs.push(r0 * Math.pow(r1 / r0, t)); }
  // a small disc around the camera (covers "behind" for shadows/feet)
  const c = new THREE.Color(), col = [];
  const push = (x, z) => { const h = height(x, z); V.push(x, h, z); };
  for (let i = 0; i <= nr; i++) {
    const r = rs[i];
    // widen the wedge very close to the camera so nothing pops at the frame edges
    const hw = r < back ? Math.PI : half;
    for (let j = 0; j <= na; j++) {
      const a = cam.yaw - hw + (2 * hw) * j / na;
      push(cam.x + Math.sin(a) * r, cam.z + Math.cos(a) * r);
    }
  }
  const split = opts.split ?? 140;
  let iSplit = rs.findIndex(r => r > split); if (iSplit < 0) iSplit = nr;
  const idxFar = [];
  for (let i = 0; i < nr; i++) for (let j = 0; j < na; j++) {
    const a = i * (na + 1) + j, b = a + 1, c2 = a + (na + 1), d = c2 + 1;
    (i < iSplit ? idx : idxFar).push(a, c2, b, b, c2, d);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(V, 3));
  g.setIndex([...idx, ...idxFar]);
  g.computeVertexNormals();
  g.clearGroups(); g.addGroup(0, idx.length, 0); g.addGroup(idx.length, idxFar.length, 1);
  const pos = g.attributes.position, nrm = g.attributes.normal, cols = new Float32Array(pos.count * 3);
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), z = pos.getZ(i), h = pos.getY(i);
    const slope = Math.sqrt(Math.max(0, 1 - nrm.getY(i) ** 2)) / Math.max(0.05, nrm.getY(i));
    groundColor(x, z, h, slope, c);
    if (opts.tint) opts.tint(x, z, c);
    cols[i * 3] = c.r; cols[i * 3 + 1] = c.g; cols[i * 3 + 2] = c.b;
  }
  g.setAttribute('color', new THREE.BufferAttribute(cols, 3));
  const mesh = new THREE.Mesh(g, [opts.material || terrainMaterial(), farTerrainMaterial()]);
  mesh.receiveShadow = true; mesh.matrixAutoUpdate = false; mesh.frustumCulled = false;
  return mesh;
}
let FAR_MAT = null;
export function farTerrainMaterial() { return FAR_MAT || (FAR_MAT = vertexLit({ detail: detailTexture(), wrap: 1.1 })); }

// ------------------------------------------------------------------ water
let WATER_NORMAL = null;
function waterNormalTex() {
  if (WATER_NORMAL) return WATER_NORMAL;
  const S = 256, n = new Simplex(55), data = new Uint8Array(S * S * 4), TAU = Math.PI * 2;
  const hgt = (x, y) => {
    const u = x / S * TAU, v = y / S * TAU; let f = 0, a = 1, fr = 1;
    for (let o = 0; o < 4; o++) { f += a * n.noise(Math.cos(u) * fr * 1.5 + o * 5.0 + Math.sin(v) * fr * 0.7, Math.sin(u) * fr * 1.5 + Math.cos(v) * fr * 1.5); a *= 0.5; fr *= 2; }
    return f;
  };
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    const dx = hgt(x + 1, y) - hgt(x - 1, y), dy = hgt(x, y + 1) - hgt(x, y - 1);
    const v = new THREE.Vector3(-dx * 2.2, -dy * 2.2, 1).normalize();
    const i = (y * S + x) * 4;
    data[i] = (v.x * 0.5 + 0.5) * 255; data[i + 1] = (v.y * 0.5 + 0.5) * 255; data[i + 2] = (v.z * 0.5 + 0.5) * 255; data[i + 3] = 255;
  }
  WATER_NORMAL = new THREE.DataTexture(data, S, S, THREE.RGBAFormat);
  WATER_NORMAL.wrapS = WATER_NORMAL.wrapT = THREE.RepeatWrapping;
  WATER_NORMAL.magFilter = THREE.LinearFilter; WATER_NORMAL.minFilter = THREE.LinearMipmapLinearFilter; WATER_NORMAL.generateMipmaps = true;
  WATER_NORMAL.needsUpdate = true;
  return WATER_NORMAL;
}
export function waterMaterial() {
  return new THREE.ShaderMaterial({
    transparent: true,
    uniforms: {
      uTime: { value: 0 }, uSunDir: { value: new THREE.Vector3(0.3, 0.6, 0.2) }, uSunCol: { value: new THREE.Color(1, 0.95, 0.85) },
      uSky: { value: new THREE.Color(0.55, 0.7, 0.9) }, uHorizon: { value: new THREE.Color(0.8, 0.85, 0.9) },
      uDeep: { value: new THREE.Color(0x173f52) }, uShallow: { value: new THREE.Color(0x3c7a80) }, uNormal: { value: waterNormalTex() },
      fogColor: { value: new THREE.Color() }, fogDensity: { value: 0.0 },
    },
    vertexShader: `
      varying vec3 vW; varying float vFogDepth;
      void main(){ vec4 w = modelMatrix*vec4(position,1.0); vW = w.xyz; vec4 mv = viewMatrix*w; vFogDepth = -mv.z; gl_Position = projectionMatrix*mv; }`,
    fragmentShader: `
      uniform float uTime; uniform vec3 uSunDir; uniform vec3 uSunCol; uniform vec3 uSky; uniform vec3 uHorizon;
      uniform vec3 uDeep; uniform vec3 uShallow; uniform sampler2D uNormal; uniform vec3 fogColor; uniform float fogDensity;
      varying vec3 vW; varying float vFogDepth;
      void main(){
        vec2 p = vW.xz;
        vec3 n1 = texture2D(uNormal, p * 0.045 + vec2(uTime * 0.012, uTime * 0.007)).xyz * 2.0 - 1.0;
        vec3 n2 = texture2D(uNormal, p * 0.11 - vec2(uTime * 0.018, -uTime * 0.01)).xyz * 2.0 - 1.0;
        vec3 n = normalize(vec3(n1.x + n2.x, 2.2, n1.y + n2.y));
        vec3 v = normalize(cameraPosition - vW);
        float fres = pow(1.0 - max(dot(n, v), 0.0), 4.0);
        vec3 r = reflect(-v, n);
        vec3 refl = mix(uHorizon, uSky, clamp(r.y * 1.6, 0.0, 1.0));
        vec3 col = mix(mix(uShallow, uDeep, 0.55 + n1.x * 0.15), refl, 0.22 + 0.68 * fres);
        float spec = pow(max(dot(r, normalize(uSunDir)), 0.0), 220.0);
        col += uSunCol * spec * 2.4;
        float fogF = 1.0 - exp(-fogDensity * fogDensity * vFogDepth * vFogDepth);
        col = mix(col, fogColor, fogF);
        gl_FragColor = vec4(col, 0.95);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  });
}

export function buildRiver(material) {
  const P = RIVER_PTS, verts = [], idx = [];
  for (let k = 0; k < P.length; k++) {
    const a = P[Math.max(0, k - 1)], b = P[Math.min(P.length - 1, k + 1)];
    let tx = b[0] - a[0], tz = b[1] - a[1]; const L = Math.hypot(tx, tz) || 1; tx /= L; tz /= L;
    const nx = -tz, nz = tx, w = riverWidth(k) * 0.82, y = riverLevel(P[k][1]);
    verts.push(P[k][0] + nx * w, y, P[k][1] + nz * w, P[k][0] - nx * w, y, P[k][1] - nz * w);
    if (k < P.length - 1) { const i = k * 2; idx.push(i, i + 2, i + 1, i + 1, i + 2, i + 3); }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
  g.setIndex(idx); g.computeVertexNormals();
  const m = new THREE.Mesh(g, material);
  m.renderOrder = 1; m.frustumCulled = false;
  return m;
}

export function buildLake(material) {
  const g = new THREE.CircleGeometry(1500, 96);
  g.rotateX(-Math.PI / 2);
  const m = new THREE.Mesh(g, material);
  m.position.set(-150, LAKE_LEVEL, -1650);
  m.renderOrder = 1;
  return m;
}
