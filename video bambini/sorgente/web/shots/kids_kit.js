// Shared kit for the kids video: the ten Little AIs (one per colour, big heads, no numbers), the meadow, the farm,
// a shot macro with bright daylight and no snow, and small helpers (line-ups, hops, dances).
import { S, spot, frame, THREE, who, walker, K, height, yawTo, lerp } from './hgkit.js';
import { CAST } from '../lib/people.js';
import { makeAnimal } from '../lib/animals.js';
import * as A from '../lib/arena.js';
import { rock as rockGeo, vegMaterial } from '../lib/nature.js';
export { S, spot, frame, THREE, who, walker, K, height, yawTo, lerp, A };

export const KIDS = ['red', 'orange', 'yellow', 'green', 'blue', 'purple', 'pink', 'brown', 'white', 'black'];
export const HEX = { red: 0xff3b30, orange: 0xff9500, yellow: 0xffd60a, green: 0x34c759, blue: 0x0a84ff, purple: 0xaf52de, pink: 0xff6fb5, brown: 0xa2703f, white: 0xf6f6f2, black: 0x2e2e33 };
const ACC = { pink: ['flower'], brown: [{ type: 'hat', color: 0xd9b26a }], white: [{ type: 'scarf', color: 0x7fc8ff }], black: [{ type: 'scarf', color: 0xffd60a }],
  purple: [{ type: 'hair', style: 'pigtails', color: 0x6a2c8a }], yellow: [{ type: 'hair', style: 'spiky', color: 0xe0a800 }], orange: [{ type: 'hair', style: 'ponytail', color: 0xc85a00 }] };
KIDS.forEach((k, i) => {
  CAST['K_' + k] = { id: null, name: k, color: HEX[k], scale: 0.84 + (i % 3) * 0.04, width: 1.0, headScale: 1.28, cute: true, featureColor: k === 'black' ? 0xf4f4f4 : 0x14161a, acc: ACC[k] || [] };
  CAST['N_' + k] = { id: String(i + 1), idColor: k === 'black' ? '#ffffff' : '#222222', name: k, color: HEX[k], scale: 0.84 + (i % 3) * 0.04, width: 1.0, headScale: 1.28, cute: true, featureColor: k === 'black' ? 0xf4f4f4 : 0x14161a, acc: ACC[k] || [] };
});
export const kidName = (k, numbered = false) => (numbered ? 'N_' : 'K_') + k;

// a Little AI at (x, z). pose: any POSES name; o: yaw, yawTo, p, phase, numbered
export function kid(c, k, x, z, pose = 'idle', o = {}) { return who(c, kidName(k, o.numbered), x, z, pose, o); }
// hop in place (bouncy idle), optionally only after t0
export function hopper(c, k, x, z, o = {}) {
  const P = c.person(kidName(k, o.numbered), { x, z, yaw: o.yaw ?? 0 });
  const y0 = height(x, z), t0 = o.t0 ?? 0, hz = o.hz ?? 2.2, amp = o.amp ?? 0.35;
  P.anim = (Q, t) => {
    const u = t - t0;
    if (u < 0) { Q.pose(o.before || 'idle', t, { phase: x }); Q.root.position.y = y0; return; }
    const ph = (u * hz) % 1, h = Math.sin(ph * Math.PI) * amp;
    Q.pose(h > 0.05 ? 'jumpReach' : 'cheer', t, { phase: x });
    Q.root.position.y = y0 + h;
  };
  return P;
}
// one jump that lands at time t0 (arrives from the side): from a -> b between t0-dur..t0
export function jumpIn(c, k, a, b, t0, o = {}) {
  const P = c.person(kidName(k, o.numbered), { x: a[0], z: a[1], yaw: o.yaw ?? 0 });
  const d = o.dur ?? 0.6, yaw = o.yaw ?? 0;
  P.anim = (Q, t) => {
    const u = Math.max(0, Math.min(1, (t - (t0 - d)) / d));
    const x = lerp(a[0], b[0], u), z = lerp(a[1], b[1], u), h = Math.sin(u * Math.PI) * (o.h ?? 0.9);
    Q.place(x, height(x, z) + (u > 0 && u < 1 ? h : 0), z, u > 0 && u < 1 ? yawTo(a[0], a[1], b[0], b[1]) : yaw);
    if (u <= 0) { Q.root.visible = !o.hideBefore; Q.pose('idle', t, {}); }
    else if (u < 1) { Q.root.visible = true; Q.pose('jumpReach', t, {}); }
    else Q.pose(t - t0 < 0.8 ? 'cheer' : 'wave', t, { phase: x });
  };
  return P;
}
// dance: cycles through cheerful poses with a bounce
export function dancer(c, k, x, z, o = {}) {
  const P = c.person(kidName(k, o.numbered), { x, z, yaw: o.yaw ?? 0 });
  const y0 = height(x, z), seq = o.seq || ['cheer', 'wave', 'jumpReach', 'armsOpen'], per = o.per ?? 0.9, ph0 = o.phase ?? 0;
  P.anim = (Q, t) => {
    const i = Math.floor((t + ph0) / per) % seq.length, pose = seq[i];
    Q.pose(pose, t, { phase: x });
    Q.root.position.y = y0 + Math.abs(Math.sin((t + ph0) * Math.PI / per * 2)) * (o.amp ?? 0.12);
    Q.root.rotation.y = (o.yaw ?? 0) + (o.spin ? (t * o.spin) : Math.sin((t + ph0) * 2.1) * 0.25);
  };
  return P;
}
// a row of kids facing the camera (local frame f: dx right, dz forward; they face -dz)
export function row(c, f, ks, dz = 0, gap = 1.1, pose = 'idle', o = {}) {
  return ks.map((k, i) => { const q = f.p(-(i - (ks.length - 1) / 2) * gap, dz + (o.arc ? Math.abs(i - (ks.length - 1) / 2) * o.arc : 0)); return kid(c, k, q[0], q[1], Array.isArray(pose) ? pose[i % pose.length] : pose, { yaw: f.yaw + Math.PI + (o.turn ?? 0), phase: i * 0.8, numbered: o.numbered, p: o.p }); });
}
export function beast(c, kind, seed, x, z, yaw = 0, o = {}) {
  const a = makeAnimal(kind, seed, { fur: o.fur, color: o.color }); a.root.position.set(x, height(x, z), z); a.root.rotation.y = yaw; if (o.scale) a.root.scale.setScalar(o.scale); c.add(a.root);
  c.on((t) => a.animate(t, { speed: o.speed ?? 0, phase: o.phase ?? seed, graze: o.graze, look: o.look, trunkUp: o.trunkUp, cadence: o.cadence ?? 5 }));
  if (o.move) { const [x1, z1] = o.move, d = Math.hypot(x1 - x, z1 - z) || 1; c.on((t) => { const u = Math.min(1, (t * (o.speed ?? 0.5) * (o.v ?? 2.2)) / d); const px = lerp(x, x1, u), pz = lerp(z, z1, u); a.root.position.set(px, height(px, pz), pz); a.root.rotation.y = Math.atan2(x1 - x, z1 - z); }); }
  return a;
}
const DOG = [0xc8955a, 0x8a5a34, 0xf0e6d2];
export const dog = (c, x, z, yaw = 0, o = {}) => beast(c, 'wolf', 2, x, z, yaw, { ...o, fur: DOG[o.k ?? 0] });
// props
export function rock(c, x, z, s = 1.6, seed = 3, yaw = 0) {
  const m = new THREE.Mesh(rockGeo(seed, 0), vegMaterial('rock')); m.scale.setScalar(s); m.position.set(x, height(x, z) + s * 0.18, z); m.rotation.y = yaw; m.castShadow = true; m.receiveShadow = true; c.add(m); return m;
}
const FLOWER_C = [0xff4f6d, 0xffd23a, 0xffffff, 0xb36bff, 0xff8fc8, 0x4fa8ff, 0xff9a3c];
// little flower heads just above the grass (coloured discs, unlit so they stay bright)
export function flowers(c, cx, cz, R = 8, n = 260, seed = 4, colors = FLOWER_C) {
  const g = new THREE.CircleGeometry(0.055, 7); g.rotateX(-Math.PI / 2); c.own(g);
  const mat = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide });
  const im = new THREE.InstancedMesh(g, mat, n); const M4 = new THREE.Matrix4(), q = new THREE.Quaternion(), sc = new THREE.Vector3(), p = new THREE.Vector3(), e = new THREE.Euler(), col = new THREE.Color();
  let s = seed * 9301 + 49297; const r = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
  for (let i = 0; i < n; i++) { const a = r() * 6.283, d = Math.sqrt(r()) * R, x = cx + Math.cos(a) * d, z = cz + Math.sin(a) * d; e.set((r() - 0.5) * 0.5, r() * 6.28, (r() - 0.5) * 0.5); q.setFromEuler(e); sc.setScalar(0.8 + r() * 0.7); p.set(x, height(x, z) + 0.1 + r() * 0.08, z); im.setMatrixAt(i, M4.compose(p, q, sc)); im.setColorAt(i, col.setHex(colors[i % colors.length])); }
  im.instanceMatrix.needsUpdate = true; im.instanceColor.needsUpdate = true; im.frustumCulled = false; c.add(im);
}
// a big friendly tree (from the forest set)
export const tree = (c, x, z, s = 9, v = 0) => A.bigTree(c, x, z, s, v, 'oak0');
// the farm: fence, hay bales, a hut for a barn
export function farm(c, f) {
  const q = f.p(0, 14); A.corral(c, q[0], q[1], 26, 16);
  const h = f.p(-12, 26); A.hayBales(c, h[0], h[1], 6, 2);
  const b = f.p(9, 27); A.logHut(c, b[0], b[1], f.yaw + Math.PI, 1.4);
}

// ---------------------------------------------------------------- locations and the shot macro
export const loc = (biome, k = 0, deg = 0, o = {}) => { const p = spot(biome, k, o); const f = frame(p[0], p[1], deg * Math.PI / 180); f.biome = biome; return f; };
const cv = (f, a) => a && f.c3(a[0], a[1], a[2]);
// T(anchor, offset, frame, o): o = { cam:[dx,h,dz], cam2, tgt, tgt2, fov, fov2, hours, set(c, f), ... } in the frame's local coordinates
export const T = (anchor, off, f, o) => S(anchor, off, { biome: f.biome, hours: o.hours ?? 10.8, fov: 46, snow: 0, cloud: o.cloud ?? 0.25, ...o, cam: cv(f, o.cam), cam2: cv(f, o.cam2), tgt: cv(f, o.tgt ?? [0, 1.0, 0]), tgt2: cv(f, o.tgt2),
  clear: o.clear ?? [[f.x, f.z, o.cr ?? 18]], sr: o.sr ?? 26, set: o.set && ((c) => o.set(c, f)) });
export const L = {};
L.meadow = loc('meadow', 0, 180); L.meadow2 = loc('meadow', 1, 40); L.farm = loc('meadow', 2, 0); L.forest = loc('forest', 0, 0); L.lake = loc('lake', 0, 0); L.hill = loc('meadow', 3, 0);
// dressing for the home meadow: flowers all around
export function meadowDress(c, f, o = {}) { flowers(c, f.x, f.z, o.R ?? 16, o.n ?? 900, o.seed ?? 4); if (o.trees !== false) { const a = f.p(-9, 12), b = f.p(10, 15); tree(c, a[0], a[1], 9, 0); tree(c, b[0], b[1], 11, 1); } }
