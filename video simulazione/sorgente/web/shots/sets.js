// Reusable sets, cast lists and helpers for the shots.
import * as THREE from 'three';
import { mulberry32 } from '../lib/noise.js';
import { rock as rockGeo, vegMaterial } from '../lib/nature.js';
import { PROTO, buildingMaterial } from '../lib/buildings.js';
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

export const FOUNDERS = ['ISE', 'MIRA', 'BO', 'TAM', 'A15', 'A01', 'A03', 'A05', 'A06', 'A08', 'A10', 'A12', 'A14', 'A16', 'A17', 'A18', 'A19', 'A20', 'A01', 'A03'];
// fixed spawn layout (dx, dz, yaw) around the meadow centre
const R = mulberry32(42);
export const SPAWN = FOUNDERS.map((who, i) => {
  const a = i * 2.39996 + 0.3, d = 1.6 + Math.sqrt(i) * 1.55;
  return { who, x: M.x + Math.cos(a) * d, z: M.z + Math.sin(a) * d, yaw: R() * 6.28, ph: R() * 6.28 };
});

export const TIME = { dawn: 6.4, morning: 9.0, noon: 12.5, afternoon: 15.2, golden: 17.6, sunset: 18.35, dusk: 18.9, night: 23.0 };

// shared extra trees (lightning tree, gag oak) so every meadow shot agrees
export const MEADOW_TREES = [
  { key: 'oak0_1', x: OAK_GAG.x, z: OAK_GAG.z, s: 12 },
  { key: 'oak0_0', x: LTREE.x, z: LTREE.z, s: 14 },
  { key: 'oak0_2', x: 232, z: 360, s: 11 }, { key: 'birch0_0', x: 292, z: 318, s: 10 }, { key: 'oak0_1', x: 300, z: 340, s: 13 },
];

export function rock(c, x, z, s = 1.6, yaw = 0, sy = 0.8) {
  const m = new THREE.Mesh(rockGeo(5, 0), vegMaterial('rock'));
  m.position.set(x, c.h(x, z) - 0.25 * s, z); m.scale.set(s, s * sy, s); m.rotation.y = yaw; m.castShadow = true; m.receiveShadow = true;
  return c.add(m);
}
export function berries(c, x, z, n = 3) {
  const r = mulberry32(Math.floor(x * 7 + z));
  for (let i = 0; i < n; i++) c.proto('berry', i, x + (r() - 0.5) * 3.5, z + (r() - 0.5) * 3.5, r() * 6, 1.1 + 0.5 * r());
}
// place the 20 founders with a pose function (who, i) -> {pose, p, yaw?, dx?, dz?}
export function founders(c, fn = () => ({}), opts = {}) {
  const out = [];
  SPAWN.forEach((s, i) => {
    if (opts.skip && opts.skip.includes(i)) return;
    const o = fn(s.who, i, s) || {};
    if (o.hide) return;
    const P = c.person(s.who, { x: (o.x ?? s.x), z: (o.z ?? s.z), yaw: o.yaw ?? s.yaw, acc: o.acc || [], energy: o.energy, pose: o.pose || 'idle', p: o.p });
    P.anim = o.anim || ((P2, t) => P2.pose(o.pose || 'idle', t + s.ph, { phase: s.ph, ...(o.p || {}) }));
    out.push(P);
  });
  return out;
}
export const yawTo = (ax, az, bx, bz) => Math.atan2(bx - ax, bz - az);
