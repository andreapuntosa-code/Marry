// Reusable sets, cast lists and helpers for the shots.
import * as THREE from 'three';
import { mulberry32 } from '../lib/noise.js';
import { height } from '../lib/terrain.js';
import { rock as rockGeo, vegMaterial } from '../lib/nature.js';
import { PROTO, buildingMaterial, TEMPLE_POS, CASTLE_POS } from '../lib/buildings.js';
import { FIELDS } from '../lib/groundmap.js';
export { K, orbitCam, easeInOut } from '../lib/camtools.js';

export const M = { x: 262, z: 334 };                 // the meadow
export const ROCK = { x: 252, z: 346 };               // Mira's rock
export const BERRY = { x: 276, z: 352 };
export const OAK_GAG = { x: 247, z: 322 };
export const CAMP = { x: 268, z: 346 };
export const LTREE = { x: 283, z: 362 };              // lightning tree
export const FOREST_EDGE = { x: 322, z: 412 };
export const A15_BODY = { x: 347, z: 441 };
export const SUNSET_YAW = -1.857;                    // direction of the sunset seen from the meadow
export const PRIMA = { x: -32, z: 8 };
export const FIRST_FIELD = { x: -44, z: -6 };
export const RIVERBANK = { x: -52, z: -18 };
export const HILL = { x: 70, z: 55 };
export const TEMPLE = { x: 64, z: 46 };
export const CASTLE = { x: 98, z: 78 };
export const PLAZA = { x: 8, z: -6 };
export const PLAIN = { x: 820, z: -760 };
export const NIGHT_FIELD = { x: 150, z: -150 };
export const GRANARY_K = { x: 50, z: 33 };            // Kassa's big granary (year 522+)
export const BRIDGE = { x: -76, z: 30 };
export const GOATS = { x: 188, z: 283 };

export const FOUNDERS = ['ISE', 'MIRA', 'BO', 'TAM', 'A15', 'A01', 'A03', 'A05', 'A06', 'A08', 'A10', 'A12', 'A14', 'A16', 'A17', 'A18', 'A19', 'A20', 'A02', 'A13'];
// fixed spawn layout (dx, dz, yaw) around the meadow centre
const R = mulberry32(42);
export const SPAWN = FOUNDERS.map((who, i) => {
  const a = i * 2.39996 + 0.3, d = 1.6 + Math.sqrt(i) * 1.55;
  return { who, x: M.x + Math.cos(a) * d, z: M.z + Math.sin(a) * d, yaw: R() * 6.28, ph: R() * 6.28 };
});

export const TIME = { dawn: 6.5, morning: 9.0, noon: 12.5, afternoon: 15.2, golden: 17.25, sunset: 17.8, dusk: 18.12, night: 23.0 };

// shared extra trees (lightning tree, gag oak) so every meadow shot agrees
export const MEADOW_TREES = [
  { key: 'oak0_1', x: OAK_GAG.x, z: OAK_GAG.z, s: 12 },
  { key: 'oak0_0', x: LTREE.x, z: LTREE.z, s: 14 },
  { key: 'oak0_2', x: 232, z: 360, s: 11 }, { key: 'birch0_0', x: 292, z: 318, s: 10 }, { key: 'oak0_1', x: 300, z: 340, s: 13 },
];

export const GUARD = ['helmet', { type: 'sash', color: 0xb3122a }, 'spear'];
export const BLUE = [{ type: 'sash', color: 0x2a5bd7 }];
export const TORCH = ['torch'];
export const ERA_ACC = {     // clothes by era for villagers
  early: [[], [{ type: 'belt', color: 0x5a3a22 }], ['bag'], [{ type: 'headband', color: 0x7a5532 }]],
  clay: [[{ type: 'belt', color: 0x6b4a2e }], [{ type: 'scarf', color: 0xb5703f }], ['bag'], [{ type: 'headband', color: 0xa0522d }], []],
  stone: [[{ type: 'scarf', color: 0x8a3b2a }], [{ type: 'belt', color: 0x4a3a2a }, 'bag'], [{ type: 'hat', color: 0xc9a45a }], [{ type: 'scarf', color: 0x2f5a8a }], [{ type: 'headband', color: 0x3a6a3a }]],
};
export const eraAcc = (era, i) => ERA_ACC[era][i % ERA_ACC[era].length];

export function rock(c, x, z, s = 1.6, yaw = 0, sy = 0.8) {
  const m = new THREE.Mesh(rockGeo(5, 0), vegMaterial('rock'));
  m.position.set(x, c.h(x, z) - 0.25 * s, z); m.scale.set(s, s * sy, s); m.rotation.y = yaw; m.castShadow = true; m.receiveShadow = true;
  return c.add(m);
}
export function berries(c, x, z, n = 3, sc = 0.8) {
  const r = mulberry32(Math.floor(x * 7 + z));
  for (let i = 0; i < n; i++) c.proto('berry', i, x + (r() - 0.5) * 3.5, z + (r() - 0.5) * 3.5, r() * 6, sc * (0.85 + 0.3 * r()));
}
// place the 20 founders with a pose function (who, i) -> {pose, p, yaw?, x?, z?}
export function founders(c, fn = () => ({}), opts = {}) {
  const out = [];
  SPAWN.forEach((s, i) => {
    if (opts.skip && opts.skip.includes(i)) return;
    const o = fn(s.who, i, s) || {};
    if (o.hide) return;
    const P = c.person(s.who, { x: (o.x ?? s.x), z: (o.z ?? s.z), yaw: o.yaw ?? s.yaw, acc: o.acc, energy: o.energy, pose: o.pose || 'idle', p: o.p });
    P.anim = o.anim || ((P2, t) => P2.pose(o.pose || 'idle', t + s.ph, { phase: s.ph, ...(o.p || {}) }));
    P.spawn = s;
    out.push(P);
  });
  return out;
}
export const yawTo = (ax, az, bx, bz) => Math.atan2(bx - ax, bz - az);

// local coordinates of a rotated building -> world [x, yAbs, z]
function localTo(px, pz, yaw, lx, ly, lz) {
  const c = Math.cos(yaw), s = Math.sin(yaw);
  const x = px + lx * c + lz * s, z = pz - lx * s + lz * c;
  return [x, height(px, pz) - 0.15 + ly, z];
}
export const TEMPLE_YAW = Math.PI * 0.85, CASTLE_YAW = Math.PI * 1.15;
export const templeLocal = (lx, ly, lz) => localTo(TEMPLE_POS.x, TEMPLE_POS.z, TEMPLE_YAW, lx, ly, lz);
export const castleLocal = (lx, ly, lz) => localTo(CASTLE_POS.x, CASTLE_POS.z, CASTLE_YAW, lx, ly, lz);
// the castle landing (top of the grand stairs) and the foot of the stairs
export const LANDING = castleLocal(0, 3.0, 6.7);
// world [x, h, z] with h ABOVE THE TERRAIN (for K() in relative mode) from building-local coordinates
export const castleXZ = (lx, lz, h) => { const p = castleLocal(lx, 0, lz); return [p[0], h, p[2]]; };
export const templeXZ = (lx, lz, h) => { const p = templeLocal(lx, 0, lz); return [p[0], h, p[2]]; };
export const STAIRS_FOOT = castleLocal(0, 0, 12.2);
export const TEMPLE_TOP = templeLocal(0, 6.48, 4.85);       // top of the temple stairs, in front of the colonnade
// height of the temple stairs at local z (for climbing)
export const templeStairY = (lz) => Math.max(0, Math.min(6.48, ((12.77 - lz) / 0.31 + 1) * 0.27));
export const TEMPLE_FOOT = templeLocal(0, 0, 14.5);        // foot of the temple stairs

// a field that exists in a given year near a point (for night vote, harvest scenes)
export function fieldNear(x, z, year) {
  let best = null, bd = 1e9;
  for (const f of FIELDS) { if (f.year > year || f.first) continue; const d = Math.hypot(f.x - x, f.z - z); if (d < bd) { bd = d; best = f; } }
  return best;
}
// wheat stalk patches (instanced crop prototypes) filling a field rectangle
export function wheat(c, f, stage = 3, opts = {}) {
  const items = [];
  const ca = Math.cos(f.ang), sa = Math.sin(f.ang);
  const w = opts.w ?? f.w, h = opts.h ?? f.h;
  for (let u = -w / 2 + 5; u < w / 2 - 3; u += 10) for (let v = -h / 2 + 5; v < h / 2 - 3; v += 10) {
    if (opts.skip && opts.skip(u, v)) continue;
    const x = f.x + u * ca - v * sa, z = f.z + u * sa + v * ca;
    items.push([x, z, -f.ang, 1.0]);
  }
  return c.protos('crop', stage, items, { shadow: opts.shadow ?? false });
}
// small stones (pebbles / voting stones) as one instanced mesh; returns {mesh, set(i,x,y,z,s)}
export function pebbles(c, n, color = 0x8d8f94) {
  const g = new THREE.IcosahedronGeometry(0.06, 1);
  const m = new THREE.MeshStandardMaterial({ color, roughness: 0.8 });
  const im = new THREE.InstancedMesh(g, m, n); im.castShadow = true; im.receiveShadow = true; im.frustumCulled = false;
  c.own(g); c.add(im);
  const mx = new THREE.Matrix4(), q = new THREE.Quaternion(), sv = new THREE.Vector3(), pv = new THREE.Vector3();
  const hide = new THREE.Matrix4().makeScale(0, 0, 0);
  for (let i = 0; i < n; i++) im.setMatrixAt(i, hide);
  return {
    mesh: im,
    set(i, x, y, z, s = 1) { pv.set(x, y, z); sv.set(s, s * 0.7, s); q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), i * 1.7); im.setMatrixAt(i, s > 0 ? mx.compose(pv, q, sv) : hide); im.instanceMatrix.needsUpdate = true; },
  };
}
// a crowd laid out on a disc / along a path; returns the Crowd
export function crowdDisc(c, n, cx, cz, r0, r1, faceX, faceZ, opts = {}) {
  const cr = c.crowd(n, opts);
  const rr = mulberry32(opts.seed ?? 11);
  for (let i = 0; i < n; i++) {
    const a = rr() * Math.PI * 2, d = r0 + Math.sqrt(rr()) * (r1 - r0);
    const x = cx + Math.cos(a) * d * (opts.sx ?? 1), z = cz + Math.sin(a) * d * (opts.sz ?? 1);
    if (opts.keep && !opts.keep(x, z)) { cr.set(i, 0, -999, 0, 0, 0); continue; }
    cr.set(i, x, height(x, z), z, Math.atan2(faceX - x, faceZ - z) + (rr() - 0.5) * 0.5, 0);
  }
  c.on(t => cr.update(t));
  return cr;
}
// glowing eyes for wolves in the dark (two additive sprites parented to the head)
let EYE_TEX = null;
export function wolfEyes(c, wolf, size = 0.16, color = 0xffd27a) {
  if (!EYE_TEX) {
    const cv = document.createElement('canvas'); cv.width = cv.height = 64; const g = cv.getContext('2d');
    const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,255,230,1)'); gr.addColorStop(0.25, 'rgba(255,210,120,0.9)'); gr.addColorStop(1, 'rgba(255,160,40,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 64, 64); EYE_TEX = new THREE.CanvasTexture(cv); EYE_TEX.colorSpace = THREE.SRGBColorSpace;
  }
  const mat = new THREE.SpriteMaterial({ map: EYE_TEX, color, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, fog: false });
  const out = [];
  for (const sg of [-1, 1]) { const s = new THREE.Sprite(mat); s.scale.setScalar(size); s.position.set(sg * 0.075, 0.035, 0.15); wolf.head.add(s); out.push(s); }
  return out;
}
export const lerpAngle = (a, b, u) => { const d = Math.atan2(Math.sin(b - a), Math.cos(b - a)); return a + d * Math.max(0, Math.min(1, u)); };
export const smooth = (a, b, x) => { const u = Math.max(0, Math.min(1, (x - a) / (b - a))); return u * u * (3 - 2 * u); };
