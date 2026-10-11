// Shared kit for the Stone Age film: costumes by era, animals, helpers on top of the arena kit (hgkit).
import { S, spot, frame, toward, THREE, who, campfire, K, height, yawTo, lerp, walker } from './hgkit.js';
import { PRE20 } from '../lib/people.js';
export { S, spot, frame, toward, THREE, who, campfire, K, height, yawTo, lerp, walker, PRE20 };
import { makeAnimal } from '../lib/animals.js';

// costumes
const FURS = [0x8a5a34, 0x6b4a2e, 0x9a7048, 0x5a3b26, 0xa88058];
export const KIT = {
  naked: () => [],
  rag: (i) => [{ type: 'fur', color: FURS[i % 5] }],
  walker: (i, w = 0) => [{ type: 'fur', color: FURS[i % 5] }, { type: 'furCape', color: FURS[(i + 2) % 5] }, { type: 'bones' }, { type: 'paint', color: [0xf4f0e0, 0xd0402a, 0x2a2a2a][i % 3] }, [{ type: 'flintSpear' }, { type: 'stoneAxe' }, { type: 'boneClub' }][(i + w) % 3]],
  keeper: (i) => [{ type: 'fur', color: [0xc9b79a, 0xb8a58a, 0xd8c8aa][i % 3] }, { type: 'bones' }, { type: 'hood', color: [0xd9c9a8, 0xcbb894][i % 2] }, { type: 'paint', color: [0x2a6ad6, 0xf2c14a][i % 2] }],
  elderWalker: (i) => [{ type: 'fur', color: FURS[i % 5] }, { type: 'furCape', color: 0xe8e2d4 }, { type: 'bones' }, { type: 'tusks' }, { type: 'paint', color: 0xd0402a }, { type: 'flintSpear' }],
  elderKeeper: (i) => [{ type: 'fur', color: 0xd8c8aa }, { type: 'furCape', color: 0xcbb894 }, { type: 'bones' }, { type: 'hood', color: 0xe8dcc0 }, { type: 'paint', color: 0x2a6ad6 }, 'staff'],
};
export const WALKERS = PRE20.slice(0, 10), KEEPERS = ['LIA', ...PRE20.slice(10), 'ORIN', 'MEI'].filter((v, i, a) => a.indexOf(v) === i).slice(0, 10);
export const kit = (kind, i = 0, w = 0) => KIT[kind](i, w);
// place a named AI wearing a costume kind
export function ai(c, name, x, z, pose = 'idle', kindOrAcc = 'naked', o = {}) {
  const acc = Array.isArray(kindOrAcc) ? kindOrAcc : KIT[kindOrAcc](PRE20.indexOf(name), o.w ?? 0);
  return who(c, name, x, z, pose, { ...o, acc });
}
// a group standing/sitting around (x, z): names, kind of costume, radius, pose list
export function circle(c, names, x, z, r, kind, pose = 'idle', a0 = 0, o = {}) {
  const out = [];
  names.forEach((n, i) => { const a = a0 + i / names.length * Math.PI * 2, px = x + Math.cos(a) * r, pz = z + Math.sin(a) * r; out.push(ai(c, n, px, pz, Array.isArray(pose) ? pose[i % pose.length] : pose, kind, { yawTo: [x, z], phase: i * 0.7, ...o })); });
  return out;
}
export function beast(c, kind, seed, x, z, yaw = 0, o = {}) {
  const DOGS = [0xb8935f, 0x9a7048, 0xd8c8a8, 0x6b4a30];
  const a = makeAnimal(kind, seed, { glow: o.glow, fur: o.dog ? DOGS[seed % 4] : o.fur }); a.root.position.set(x, height(x, z), z); a.root.rotation.y = yaw; if (o.scale) a.root.scale.setScalar(o.scale); c.add(a.root);
  c.on((t) => a.animate(t, { speed: o.speed ?? 0, phase: o.phase ?? seed, graze: o.graze, look: o.look, trunkUp: o.trunkUp, cadence: o.cadence ?? 5 }));
  if (o.move) { const [x1, z1] = o.move, d = Math.hypot(x1 - x, z1 - z) || 1; c.on((t) => { const u = Math.min(1, (t * (o.speed ?? 0.5) * (o.v ?? 2.2)) / d); const px = lerp(x, x1, u), pz = lerp(z, z1, u); a.root.position.set(px, height(px, pz), pz); a.root.rotation.y = Math.atan2(x1 - x, z1 - z); }); }
  return a;
}

// ---------------------------------------------------------------- locations and the shot macro
import { Snowfall } from '../lib/pre.js';
import * as PRE from '../lib/pre.js';
export { PRE };
export const loc = (biome, k = 0, deg = 0, o = {}) => { const p = spot(biome, k, o); const f = frame(p[0], p[1], deg * Math.PI / 180); f.biome = biome; return f; };
const cv = (f, a) => a && f.c3(a[0], a[1], a[2]);
// T(anchor, offset, frame, o): o = { cam:[dx,h,dz], cam2, tgt, tgt2, fov, fov2, hours, snow, set(c, f), ... } in the frame's local coordinates (dx right, dz forward)
export const T = (anchor, off, f, o) => S(anchor, off, { biome: f.biome, hours: o.hours ?? 11, fov: 46, ...o, cam: cv(f, o.cam), cam2: cv(f, o.cam2), tgt: cv(f, o.tgt ?? [0, 1.2, 0]), tgt2: cv(f, o.tgt2),
  clear: o.clear ?? [[f.x, f.z, o.cr ?? 20]], sr: o.sr ?? 30, set: o.set && ((c) => o.set(c, f)) });
// falling snow around the camera
export function snow(c, o = {}) { const s = new Snowfall(o.n ?? 2200, o.area ?? 46, o.seed ?? 4); c.add(s.points); c.on((t) => s.update(t, c.cam ? c.cam.pos : { x: 0, y: 0, z: 0 }, o.wind ?? 0.6)); return s; }
// a herd of beasts walking across the frame
export function herd(c, f, kind, n, o = {}) {
  for (let i = 0; i < n; i++) { const a = f.p((o.x0 ?? -14) + (i % 4) * (o.dx ?? 5) + (o.jx ?? 0) * Math.sin(i * 7), (o.z0 ?? 12) + Math.floor(i / 4) * (o.dz ?? 6)), b = f.p((o.x1 ?? 16) + (i % 4) * (o.dx ?? 5), (o.z1 ?? 12) + Math.floor(i / 4) * (o.dz ?? 6)); beast(c, kind, i + 1, a[0], a[1], 0, { speed: o.speed ?? 0.5, move: b, v: o.v ?? 1.6, scale: o.scale, phase: i }); }
}
export const lineup = (c, f, names, kind, dz = 0, gap = 1.5, pose = 'idle', o = {}) => names.forEach((n, i) => { const q = f.p((i - (names.length - 1) / 2) * gap, dz + (i % 2) * (o.stagger ?? 0.6)); ai(c, n, q[0], q[1], Array.isArray(pose) ? pose[i % pose.length] : pose, kind, { yaw: f.yaw + (o.turn ?? Math.PI), phase: i * 0.7, ...(o.o || {}) }); });
export const night = { hours: 22.5 }, dusk = { hours: 17.6 }, dawn = { hours: 6.6 };
export const L = {};
export function initLocs() {
  L.valley = loc('mountain', 0, 20); L.cave = loc('mountain', 1, 0); L.hill = loc('mountain', 2, 0);
  L.plain = loc('meadow', 0, 0); L.pits = loc('meadow', 1, 0); L.forest = loc('forest', 0, 0); L.forest2 = loc('forest', 1, 0);
  L.lake = loc('lake', 0, 0); L.steppe = loc('desert', 0, 0); L.green = loc('meadow', 2, 0);
}
initLocs();
