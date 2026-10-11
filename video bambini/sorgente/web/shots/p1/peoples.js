// The other peoples: Nuvia (the lake village, founded in 611 by Ama) and the Tamari (Tam's herders on
// the great plain). Sets, layouts and instanced helpers shared by chapters VI-XI.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { mulberry32 } from '../../lib/noise.js';
import { height, isWater, LAKE_LEVEL } from '../../lib/terrain.js';
import { makeAnimal } from '../../lib/animals.js';
import { VILLAGERS, NUV_ACC, TAM_ACC } from '../../lib/people.js';

export const LAKE_Y = LAKE_LEVEL;
export const NUVIA = { x: -315, z: -1168 };          // centre of the lake village (on the waterline)
export const MEET = { x: -62, z: -1158 };            // first contact (812): the beach east of the river mouth
export const TAMARI = { x: 640, z: -520 };           // the herders' camp on the great plain
export const WEST_HILLS = { x: -486, z: -959 };      // the knoll where the Tamari watch the war (1512)
export const EXODUS = [[-58, -40], [-40, -260], [-62, -520], [-36, -800], [-70, -1050], [-150, -1120]];   // Ama's road south (east bank, then west of the mouth)

// waterline of the lake's north shore at x (cached)
const SHORE = new Map();
export function shoreZ(x) {
  const k = Math.round(x);
  if (!SHORE.has(k)) { let z = -1000; while (z > -1500 && height(k, z) > LAKE_Y + 0.3) z -= 0.5; SHORE.set(k, z); }
  return SHORE.get(k);
}
// the river shrine: on the west bank at the river mouth (first land point west of the water)
export const SHRINE = (() => {
  const z = -1146; let x = -112;
  while (x > -200 && (isWater(x, z) || height(x, z) < LAKE_Y + 0.6)) x -= 1;
  return { x: x - 4, z };
})();

// ------------------------------------------------------------------ Nuvia
// 48 stilt-house spots along the shore in three rows (beach, waterline, in the water); the village grows
// outward from its centre: house k exists once nHouses(year) > k
const SPOTS = (() => {
  const r = mulberry32(611), out = [];
  for (let i = 0; i < 48; i++) {
    const row = i % 3;
    const x = -470 + (i / 47) * 300 + (r() - 0.5) * 5 + row * 2.5;
    const zs = shoreZ(x);
    const z = zs + [8.5, -3.5, -15][row] + (r() - 0.5) * 3;
    const y = row === 0 ? height(x, z) : Math.max(LAKE_Y, height(x, z));
    const rank = Math.abs(x - NUVIA.x) + r() * 22, yaw = Math.PI + (r() - 0.5) * 0.3;
    if (row > 0 && [-402, -333, -262].some(px => Math.abs(x - px) < 5)) continue;      // keep the piers free
    out.push({ x, z, y, row, yaw, v: i % 3, rank });
  }
  out.sort((a, b) => a.rank - b.rank);
  out.forEach((s, k) => { s.k = k; });
  return out;
})();
export const nHouses = (year) => Math.max(0, Math.min(48, Math.floor(3 + (year - 640) * 0.13)));
export const NUV_HOUSES = SPOTS;
export const PIERS = [-402, -333, -262].map((x, i) => { const L = i === 1 ? 26 : 18; return { x, z: shoreZ(x) - L / 2 + 3, L, v: i === 1 ? 1 : 0 }; });
const CANOES = (() => {
  const r = mulberry32(77), out = [];
  for (let i = 0; i < 16; i++) {
    const p = PIERS[i % 3];
    const beach = i % 5 === 4;
    const x = p.x + (r() - 0.5) * 22 + (i % 2 ? 4 : -4), z = beach ? shoreZ(p.x) + 2 + r() * 3 : p.z - p.L * 0.2 - r() * 18;
    out.push({ x, z, yaw: r() * 6.28, beach, ph: r() * 6.28, v: i % 2 });
  }
  return out;
})();
export const nCanoes = (year) => Math.max(0, Math.min(16, Math.floor((year - 660) * 0.1)));

// build the village as it stands in `year` (number or fn(t) for timelapses). opts: {canoes:false, shrine:false, piers:false, racks:false, burnt: 0..1}
export function nuvia(c, year, opts = {}) {
  const yFn = typeof year === 'function' ? year : () => year;
  const ims = [0, 1, 2].map(v => {
    const list = SPOTS.filter(s => s.v === v);
    const im = c.protos('stilt', v, list.map(s => [s.x, s.z, s.yaw, 1, s.y]));
    im.userData.list = list; return im;
  });
  const upd = (t) => { const n = nHouses(yFn(t)); for (const im of ims) im.count = im.userData.list.filter(s => s.k < n).length; };
  upd(0);
  if (typeof year === 'function') c.on(upd);
  const y0 = yFn(0), y1 = yFn(c.dur);
  if (opts.piers !== false && Math.max(y0, y1) >= 700) for (const p of PIERS) c.proto('pier', p.v, p.x, p.z, 0, 1, 0, { y: LAKE_Y });
  if (opts.racks !== false && Math.max(y0, y1) >= 680) {
    const items = [];
    for (let k = 0; k < 7; k++) { const x = -430 + k * 38 + (k % 2) * 6; items.push([x, shoreZ(x) + 4.5 + (k % 3), 0.2 * (k % 2 ? 1 : -1)]); }
    c.protos('fishRack', 0, items);
  }
  if (opts.shrine !== false && Math.max(y0, y1) >= 650) c.proto('shrine', 0, SHRINE.x, SHRINE.z, 0.6, 1.0);
  let canoes = null;
  if (opts.canoes !== false) canoes = canoeFleet(c, CANOES.filter((_, i) => i < nCanoes(Math.max(y0, y1))));
  return { houses: ims, canoes };
}
// canoes on the water (bobbing) or pulled up on the beach; items [{x, z, yaw, beach, ph, v, path?(t)->[x, z, yaw]}]
export function canoeFleet(c, items) {
  const byV = [0, 1].map(v => items.filter(b => b.v === v));
  const out = [];
  byV.forEach((list, v) => {
    if (!list.length) return;
    const im = c.protos('canoe', v, list.map(b => [b.x, b.z, b.yaw, 1, b.beach ? height(b.x, b.z) + 0.3 : LAKE_Y + 0.14]));
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), p = new THREE.Vector3(), s = new THREE.Vector3(1, 1, 1);
    c.on(t => {
      list.forEach((b, i) => {
        let x = b.x, z = b.z, yaw = b.yaw;
        if (b.path) [x, z, yaw] = b.path(t);
        const bob = b.beach ? 0 : Math.sin(t * 1.3 + b.ph) * 0.035;
        p.set(x, b.beach ? height(x, z) + 0.3 : LAKE_Y + 0.14 + bob, z);
        e.set(b.beach ? 0.06 : Math.sin(t * 1.1 + b.ph) * 0.03, yaw, b.beach ? 0.12 : Math.sin(t * 0.9 + b.ph * 2) * 0.04);
        im.setMatrixAt(i, m4.compose(p, q.setFromEuler(e), s));
      });
      im.instanceMatrix.needsUpdate = true;
    });
    out.push(im);
  });
  return out;
}

// ------------------------------------------------------------------ the Tamari
export const YURTS = (() => {
  const r = mulberry32(812), out = [];
  for (let i = 0; i < 11; i++) { const a = i / 11 * Math.PI * 2 + r() * 0.3, d = 15 + r() * 9; out.push({ x: TAMARI.x + Math.cos(a) * d, z: TAMARI.z + Math.sin(a) * d, yaw: -a - Math.PI / 2 + Math.PI, v: i % 3 }); }
  return out;
})();
export function tamariCamp(c, opts = {}) {
  const cx = opts.x ?? TAMARI.x, cz = opts.z ?? TAMARI.z;
  const items = YURTS.map(y => [y.x - TAMARI.x + cx, y.z - TAMARI.z + cz, Math.atan2(cx - (y.x - TAMARI.x + cx), cz - (y.z - TAMARI.z + cz)), 1]);
  [0, 1, 2].forEach(v => { const l = items.filter((_, i) => i % 3 === v); if (l.length) c.protos('yurt', v, l); });
  c.proto('firePit', 0, cx, cz);
  if (opts.fire) c.fire(cx, cz, { size: 0.8, smoke: true, lightIntensity: opts.night ? 26 : 8, lightDist: 22 });
  return { x: cx, z: cz };
}

// one merged goat (instanced herds: hundreds of goats in one draw call)
let GOAT_GEO = null;
function goatGeo() {
  if (GOAT_GEO) return GOAT_GEO;
  const a = makeAnimal('goat', 0);
  a.animate(0.4, { speed: 0, graze: 0.35 });
  a.root.updateMatrixWorld(true);
  const parts = [];
  a.root.traverse(o => { if (o.isMesh) { const g = o.geometry.clone(); for (const k of Object.keys(g.attributes)) if (!['position', 'normal'].includes(k)) g.deleteAttribute(k); g.applyMatrix4(o.matrixWorld); parts.push(g.index ? g.toNonIndexed() : g); } });
  GOAT_GEO = mergeGeometries(parts);
  return GOAT_GEO;
}
const GOAT_COLS = [0xf4f1ea, 0x8a6a4a, 0x3a3532, 0xd8c6a8, 0xece6da];
// items: [{x, z, yaw, s?, vx?, vz?, ph?}] ; moving goats walk with (vx, vz) m/s from t=0
export function goatFlock(c, items, opts = {}) {
  const mat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.88 });
  c.own(mat);
  const im = new THREE.InstancedMesh(goatGeo(), mat, items.length);
  im.castShadow = opts.shadow ?? true; im.receiveShadow = true; im.frustumCulled = false;
  const col = new THREE.Color(), r = mulberry32(opts.seed ?? 5);
  items.forEach((g, i) => { im.setColorAt(i, col.set(GOAT_COLS[Math.floor(r() * GOAT_COLS.length)])); g.ph = g.ph ?? r() * 6.28; });
  c.add(im);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(), p = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0);
  const upd = (t) => {
    items.forEach((g, i) => {
      const mv = !!(g.vx || g.vz);
      const x = g.x + (g.vx || 0) * t + (mv ? 0 : Math.sin(t * 0.21 + g.ph) * 0.35), z = g.z + (g.vz || 0) * t + (mv ? 0 : Math.cos(t * 0.17 + g.ph) * 0.35);
      p.set(x, height(x, z) + (mv ? Math.abs(Math.sin(t * 7.5 + g.ph)) * 0.04 : 0), z);
      q.setFromAxisAngle(up, (mv ? Math.atan2(g.vx || 0, g.vz || 0) : g.yaw + Math.sin(t * 0.13 + g.ph) * 0.5) + Math.sin(t * 2.1 + g.ph) * 0.03);
      s.setScalar((g.s ?? 1) * (0.9 + 0.2 * ((g.ph * 7) % 1)));
      im.setMatrixAt(i, m4.compose(p, q, s));
    });
    im.instanceMatrix.needsUpdate = true;
  };
  upd(0); c.on(upd);
  return im;
}
// a herd scattered on a disc around (x, z)
export function herd(c, n, x, z, r0, r1, opts = {}) {
  const rr = mulberry32(opts.seed ?? 9), items = [];
  for (let i = 0; i < n; i++) {
    const a = rr() * 6.28, d = r0 + Math.sqrt(rr()) * (r1 - r0);
    const gx = x + Math.cos(a) * d * (opts.sx ?? 1), gz = z + Math.sin(a) * d * (opts.sz ?? 1);
    if (opts.keep && !opts.keep(gx, gz)) continue;
    items.push({ x: gx, z: gz, yaw: rr() * 6.28, vx: opts.vx, vz: opts.vz });
  }
  return goatFlock(c, items, opts);
}

// people of the lake / of the plain (villager bodies with their accessories)
export const nuv = (c, i, x, z, o = {}) => c.person(VILLAGERS[(i * 7 + 3) % VILLAGERS.length], { x, z, acc: NUV_ACC[i % NUV_ACC.length], ...o });
export const tam = (c, i, x, z, o = {}) => c.person(VILLAGERS[(i * 5 + 11) % VILLAGERS.length], { x, z, acc: TAM_ACC[i % TAM_ACC.length], ...o });
export const NUV_COLS = [0xdff3f6, 0xcdebf0, 0xe8f2f4, 0x9fd6df];
export const TAM_COLS = [0xf0e2c4, 0xe8d3a8, 0xf3e9d6, 0xd9b98a];
