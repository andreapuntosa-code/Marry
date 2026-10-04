// Shared stage helpers for the Day 365 shots: environments, cameras, people, crowds, reusable scenes.
import * as THREE from 'three';
import { shot } from './registry.js';
import { K, orbitCam, easeInOut } from '../lib/camtools.js';
import { height, ARENA } from '../lib/terrain.js';
import { mulberry32 } from '../lib/noise.js';
import { Crowd } from '../lib/crowd.js';
import { PROTO, buildingMaterial } from '../lib/buildings.js';
import * as A from '../lib/arena.js';
import { E } from '../main.js';

export { K, orbitCam, easeInOut, A, height, THREE };
export const WX = ARENA.wx;
export const rr = (seed) => mulberry32(seed);
export const sm = (a, b, x) => { const u = Math.max(0, Math.min(1, (x - a) / (b - a))); return u * u * (3 - 2 * u); };
export const yawTo = (ax, az, bx, bz) => Math.atan2(bx - ax, bz - az);
export const lerp = (a, b, u) => a + (b - a) * u;

// ---------------------------------------------------------------- cameras  (positions are [x, heightAboveGround, z])
export const stat = (a, t, fov = 40) => K([0, a, t, fov], [1, a, t, fov]);
export const dolly = (a, b, ta, tb = ta, fov = 40, fov2 = fov) => K([0, a, ta, fov], [1, b, tb, fov2]);
export const orb = (cx, cz, r, h, a0, a1, fov = 40, th = 1.4) => orbitCam([cx, cz], r, h, a0, a1, fov, th);
export const path3 = (pts, fov = 40) => K(...pts.map(([u, p, t, f]) => [u, p, t, f ?? fov]));
// follows a moving point (e.g. a runner): f(t) -> [x, z]
export const follow = (f, back = [0, 3, -6], h = 1.4, fov = 40) => (t, dur) => {
  const [x, z] = f(t, dur), [x2, z2] = f(Math.min(dur, t + 0.4), dur), yaw = Math.atan2(x2 - x, z2 - z);
  const px = x + Math.sin(yaw) * back[2] + Math.cos(yaw) * back[0], pz = z + Math.cos(yaw) * back[2] - Math.sin(yaw) * back[0];
  return { pos: new THREE.Vector3(px, height(px, pz) + back[1], pz), target: new THREE.Vector3(x, height(x, z) + h, z), fov, roll: 0 };
};

// ---------------------------------------------------------------- environments
const tintLight = (hex, k) => { E.atmo.sun.color.lerp(new THREE.Color(hex), k); };
const tintFog = (hex, k) => { E.scene.fog.color.lerp(new THREE.Color(hex), k); };
// forest: green haze, shafts of light, low canopy shade. plain: wide, warm, windy, far horizon
export function envF(h = 9.5, o = {}) {
  return { hours: h, cloud: 0.5, fog: o.fog ?? 0.0011, camClear: o.camClear ?? 9, veg: { grassR: o.grassR ?? 55, r0: 70, r1: 230, rImp: 140, rFar: 950, treeStep: o.treeStep ?? 7, ...(o.veg || {}) }, _tint: ['F', o.tint ?? 0.35], ...o.spec };
}
export function envP(h = 11, o = {}) {
  return { hours: h, cloud: 0.3, fog: o.fog ?? 0.00026, camClear: o.camClear ?? 6, veg: { grassR: o.grassR ?? 100, grassStep: 0.8, r0: 60, r1: 240, rImp: 150, rFar: 1800, ...(o.veg || {}) }, _tint: ['P', o.tint ?? 0.25], ...o.spec };
}
export function envW(h = 11, o = {}) {      // the open ground along the Wall (both sides visible)
  return { hours: h, cloud: 0.35, fog: o.fog ?? 0.0004, camClear: 3, veg: { grassR: 70, grassStep: 0.8, r0: 70, r1: 260, rImp: 160, rFar: 1500, ...(o.veg || {}) }, _tint: ['W', 0], ...o.spec };
}
// shot builder: sh(id, at, env, {cam, set(c), clear:[[x,z,r]], ...extra spec}, offset)
export function sh(id, at, env, o = {}, off) {
  const e = typeof env === 'function' ? env() : env;
  const spec = { town: false, ...e, ...o, veg: { ...(e.veg || {}), ...(o.veg || {}) } };
  const set = o.set; delete spec.set;
  const tint = spec._tint; delete spec._tint;
  spec.setup = (c) => {
    if (o.water !== false) A.water(c);
    if (tint && tint[0] === 'F') { tintLight(0xe8f2c8, tint[1] * 0.6); tintFog(0x8fae86, tint[1]); }
    if (tint && tint[0] === 'P') { tintLight(0xfff0cc, tint[1] * 0.5); tintFog(0xe9d9a0, tint[1] * 0.6); }
    if (o.fogTint) tintFog(o.fogTint[0], o.fogTint[1]);
    if (set) set(c); return null;
  };
  if (!spec.shadow && o.focus3) spec.shadow = { x: o.focus3[0], z: o.focus3[1], r: o.focus3[2] ?? 60 };
  shot(id, at, spec, off ?? o.off ?? 0);
}

// ---------------------------------------------------------------- people
// place a named character; pose function runs every frame. o: {yaw, yawTo:[x,z], y (abs), p (pose params), phase, acc, scale}
export function who(c, name, x, z, pose = 'idle', o = {}) {
  const yaw = o.yawTo ? yawTo(x, z, o.yawTo[0], o.yawTo[1]) : (o.yaw ?? 0);
  const P = c.person(name, { x, z, yaw, y: o.y, acc: o.acc, scale: o.scale, energy: o.energy, pose });
  const ph = o.phase ?? (x * 0.37 + z * 0.21);
  if (o.anim) P.anim = o.anim; else P.anim = (Q, t) => Q.pose(pose, t + (o.t0 ?? 0), { phase: ph, ...(o.p || {}) });
  return P;
}
// a person that walks a segment between times t0..t1 (default whole shot), pose `walk` / `run` / `march`
export function walker(c, name, a, b, o = {}) {
  const P = c.person(name, { x: a[0], z: a[1], yaw: yawTo(a[0], a[1], b[0], b[1]), y: o.y, acc: o.acc, scale: o.scale });
  const t0 = o.t0 ?? 0, t1 = o.t1 ?? c.dur, ph = o.phase ?? (a[0] * 0.3 + a[1] * 0.17);
  P.anim = (Q, t) => { c.walkTo(Q, a[0], a[1], b[0], b[1], t, t0, t1, { movePose: o.pose || 'walk', run: !!o.run, endPose: o.endPose || 'idle', phase: ph, speed: o.speed || 1, p: o.p, yFn: o.yFn, startPose: o.startPose || o.endPose || 'idle', endYaw: o.endYaw }); };
  return P;
}
const AU = (i) => 'AU' + (1 + (i % 60)), VD = (i) => 'VD' + (1 + (i % 60));
export { AU, VD };
// ring of seated/standing people facing the centre
export function ring(c, names, cx, cz, R, o = {}) {
  const out = [];
  names.forEach((nm, i) => {
    const a = (i / names.length) * Math.PI * 2 + (o.a0 ?? 0), x = cx + Math.cos(a) * R, z = cz + Math.sin(a) * R;
    const pose = typeof o.pose === 'function' ? o.pose(nm, i) : (o.pose || 'idle');
    const P = who(c, nm, x, z, pose, { yawTo: [cx, cz], phase: i * 1.7, p: o.p, y: o.y !== undefined ? o.y : undefined });
    if (pose === 'sit') P.root.position.y -= 0.0;
    out.push(P);
  });
  return out;
}
// n rank-and-file people scattered on a disc (real mannequins, nearest to the camera) facing a point
export function folk(c, side, n, cx, cz, r0, r1, face, o = {}) {
  const rnd = mulberry32(o.seed ?? 5), out = [];
  const poses = o.poses || ['idle', 'idle', 'talk', 'idle', 'armsCrossed'];
  for (let i = 0; i < n; i++) {
    const a = rnd() * 6.283, d = r0 + Math.sqrt(rnd()) * (r1 - r0);
    const x = cx + Math.cos(a) * d * (o.sx ?? 1), z = cz + Math.sin(a) * d * (o.sz ?? 1);
    const nm = side === 'F' ? VD(o.off ?? 0 + i * 3 + 1) : AU(o.off ?? 0 + i * 3 + 1);
    const nn = side === 'F' ? VD((o.off ?? 0) + i * 3 + 1) : AU((o.off ?? 0) + i * 3 + 1);
    const pose = typeof o.pose === 'function' ? o.pose(i) : poses[i % poses.length];
    out.push(who(c, nn, x, z, pose, { yawTo: face ? [face[0] + (rnd() - 0.5) * 4, face[1] + (rnd() - 0.5) * 4] : undefined, yaw: face ? undefined : rnd() * 6.28, phase: rnd() * 6, p: o.p }));
  }
  return out;
}
// big crowd as one instanced mesh with the side's colours
export function mob(c, side, n, cx, cz, r0, r1, face, o = {}) {
  const colors = side === 'F' ? [0x9fd890, 0x82c872, 0xb4e0a4, 0x6fbf62, 0xa6dc98] : [0xf0cf6a, 0xe8b84a, 0xf4dc88, 0xdca83c, 0xf2c85a];
  const cr = c.crowd(n, { colors, seed: o.seed ?? 3, shadows: o.shadows ?? false });
  const rnd = mulberry32((o.seed ?? 3) * 7 + 1);
  for (let i = 0; i < n; i++) {
    const a = rnd() * 6.283, d = r0 + Math.sqrt(rnd()) * (r1 - r0), x = cx + Math.cos(a) * d * (o.sx ?? 1), z = cz + Math.sin(a) * d * (o.sz ?? 1);
    cr.set(i, x, height(x, z), z, face ? Math.atan2(face[0] - x, face[1] - z) + (rnd() - 0.5) * 0.5 : rnd() * 6.28, o.walk ? 1 : 0);
  }
  c.on((t) => cr.update(t));
  return cr;
}
// a line/block formation: rows x cols of crowd members marching toward (dx,dz)
export function phalanx(c, side, rows, cols, x, z, yaw, o = {}) {
  const n = rows * cols, colors = side === 'F' ? [0x82c872, 0x9fd890] : [0xe8b84a, 0xf0cf6a];
  const cr = c.crowd(n, { colors, seed: o.seed ?? 9, shadows: false });
  const sp = o.spacing ?? 1.35, adv = o.adv ?? 0; const ca = Math.cos(yaw), sa = Math.sin(yaw);
  const pos = [];
  for (let r = 0; r < rows; r++) for (let q = 0; q < cols; q++) pos.push([(q - (cols - 1) / 2) * sp, -r * sp * 1.1]);
  c.on((t) => {
    const mv = (o.speed ?? 0) * t;
    pos.forEach(([u, v], i) => { const px = x + u * ca + (v + mv) * sa, pz = z - u * sa + (v + mv) * ca; cr.set(i, px, height(px, pz), pz, yaw, o.speed ? 1 : 0); });
    cr.update(t);
  });
  return cr;
}
export function horse(c, seed, x, z, yaw, o = {}) {
  const h = c.animal('horse', seed, x, z, yaw, o), ph = o.phase ?? seed;
  c.on((t) => { h.animate(t, { speed: o.speed ?? 0, phase: ph, rear: o.rear ?? 0, graze: o.graze }); if (o.move) { const m = o.move(t); h.root.position.set(m[0], height(m[0], m[1]), m[1]); h.root.rotation.y = m[2] ?? yaw; } });
  return h;
}
export function rider(c, name, h, o = {}) { const P = c.person(name, { x: 0, z: 0 }); c.ride(P, h, { pose: o.pose || 'rideSeat', gait: o.gait ?? 0, phase: o.phase ?? 0, lean: o.lean ?? 0, look: o.look ?? 0 }); return P; }
// a galloping rider along a straight path: returns {h, P}
export function gallop(c, name, seed, a, b, o = {}) {
  const t0 = o.t0 ?? 0, t1 = o.t1 ?? c.dur, yaw = yawTo(a[0], a[1], b[0], b[1]);
  const h = c.animal('horse', seed, a[0], a[1], yaw);
  const P = c.person(name, { x: 0, z: 0 }); c.ride(P, h, { pose: o.pose || 'rideCharge', gait: 1, phase: seed });
  c.on((t) => { const u = Math.max(0, Math.min(1, (t - t0) / (t1 - t0))), x = a[0] + (b[0] - a[0]) * u, z = a[1] + (b[1] - a[1]) * u; h.root.position.set(x, height(x, z), z); h.root.rotation.y = yaw; h.animate(t, { speed: u > 0 && u < 1 ? (o.speed ?? 1.15) : 0, phase: seed, graze: 0 }); });
  return { h, P };
}

// ---------------------------------------------------------------- reusable scenes
export const FP = { landing: A.F.landing, rootholm: A.F.rootholm, circle: A.F.circle, hollow: A.F.hollow, splinter: A.F.splinter, ambush: A.F.ambush, lookout: A.F.lookout, hospital: A.F.hospital, stream: A.F.stream };
export const PP = A.P;
export const MAIN_F = ['WREN', 'OAK', 'FERN', 'BRAM', 'MOSS', 'IVY', 'THORN'];
export const MAIN_P = ['SOL', 'DUNE', 'ASH', 'KESH', 'LARK', 'REED', 'MARA'];
// forest glade: a clearing among the trees (returns the clear list for the shot)
export const glade = (x, z, r = 14) => [[x, z, r]];
// a wooden platform with people for treehouse scenes
export const campfire = (c, x, z, o = {}) => { const f = c.fire(x, z, { size: o.size ?? 0.9, n: 16, emberN: 10, light: o.light ?? true, lightIntensity: o.li ?? 9, lightDist: o.ld ?? 16, seed: 2 }); for (let i = 0; i < 7; i++) { const a = i / 7 * 6.28; A.M && c.mesh(new THREE.DodecahedronGeometry(0.22, 0), A.M.stone(), x + Math.cos(a) * 0.9, height(x, z) + 0.1, z + Math.sin(a) * 0.9); } return f; };
