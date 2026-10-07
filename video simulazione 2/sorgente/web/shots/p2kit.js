// Shared kit for the Part 2 shots (years 2040+): registration, cast lists, locations, helpers.
import * as THREE from 'three';
import { shot } from './registry.js';
import { K, orbitCam, TIME, PRIMA, HILL, TEMPLE, CASTLE, PLAZA, PLAIN, RIVERBANK, yawTo, lerpAngle, smooth, crowdDisc, pebbles, eraAcc } from './p1/sets.js';
import { NUVIA, TAMARI, SHRINE } from './p1/peoples.js';
import { height } from '../lib/terrain.js';
import { mulberry32 } from '../lib/noise.js';
export { THREE, K, orbitCam, TIME, PRIMA, HILL, TEMPLE, CASTLE, PLAZA, PLAIN, RIVERBANK, yawTo, lerpAngle, smooth, crowdDisc, pebbles, eraAcc, NUVIA, TAMARI, SHRINE, height, mulberry32 };

export const lerp = (a, b, u) => a + (b - a) * u;
export const clamp01 = (u) => Math.max(0, Math.min(1, u));
// S(id, anchor, spec, offset): a film shot of Part 2. spec: { hours, cloud, year, town, cam, veg, setup(c), hero, grade, ... }
export function S(id, at, spec, off = 0) {
  shot(id, at, { town: false, cloud: 0.4, year: 0, ...spec }, off);
}
// place a named character with a pose function (c.person + animated pose)
export function who(c, name, x, z, pose = 'idle', o = {}) {
  const yaw = o.yawTo ? yawTo(x, z, o.yawTo[0], o.yawTo[1]) : (o.yaw ?? 0);
  const P = c.person(name, { x, z, yaw, y: o.y, acc: o.acc, scale: o.scale, energy: o.energy, pose });
  const ph = o.phase ?? (x * 0.37 + z * 0.21);
  P._free = o.y !== undefined;
  P.anim = o.anim || ((Q, t) => Q.pose(pose, t + (o.t0 ?? 0), { phase: ph, ...(o.p || {}) }));
  return P;
}
// a person walking from a to b between t0 and t1 (linear), then standing
export function walker(c, name, a, b, o = {}) {
  const t0 = o.t0 ?? 0, t1 = o.t1 ?? c.dur, yaw = yawTo(a[0], a[1], b[0], b[1]), ph = o.phase ?? (a[0] * 0.3 + a[1] * 0.17);
  const P = c.person(name, { x: a[0], z: a[1], yaw, acc: o.acc, scale: o.scale });
  P.anim = (Q, t) => {
    const u = clamp01((t - t0) / Math.max(1e-3, t1 - t0)), x = lerp(a[0], b[0], u), z = lerp(a[1], b[1], u);
    Q.root.position.set(x, height(x, z), z); Q.root.rotation.y = u >= 1 ? (o.endYaw ?? yaw) : yaw;
    Q.pose(u > 0 && u < 1 ? (o.pose || 'walk') : (o.endPose || 'idle'), t, { phase: ph, ...(o.p || {}) });
  };
  return P;
}
export const MAIN = ['ARU', 'NERI', 'BRAX', 'MARU', 'KUMA', 'ZOL', 'RIA', 'LUMI'];
// rank-and-file townsfolk names: the grey bodies of Part 1 (VILLAGERS clothes are added by era)
import { VILLAGERS } from '../lib/people.js';
export const FOLK = VILLAGERS;
// a townsperson (grey body, era clothes) at (x, z)
export function vil(c, i, x, z, pose = 'idle', o = {}) { return who(c, VILLAGERS[i % VILLAGERS.length], x, z, pose, { acc: eraAcc(o.era || 'stone', i), ...o }); }

// ---- camera + shot templates -------------------------------------------------------------
// camK(posA, tgtA, fov, posB, tgtB, fov2): a dolly between two terrain-relative camera set-ups ([x, heightAboveGround, z])
export const camK = (a, ta, fov = 40, b = a, tb = ta, fov2 = fov) => K([0, a, ta, fov], [1, b, tb, fov2]);
export const NIGHT = { hours: 23.2, cloud: 0.15, exposure: 1.25 };
export const DUSK = { hours: 18.2, cloud: 0.25 };
// reuse a Part 1 shot (spec by id) as a film shot of Part 2
import { P1 } from './p1/index.js';
export function reuse(id, p1id, at, off = 0, over = {}) { const sp = P1[p1id]; if (!sp) throw new Error('no p1 shot ' + p1id); shot(id, at, { ...sp, ...over }, off); }
// a named character seen by an orbiting camera. o: x, z, pose, hours, r, h, a0, a1, fov, th, acc, set(c, P), p (pose params), phase, plus any spec field
export function portrait(id, at, off, name, o = {}) {
  const x = o.x, z = o.z, mid = ((o.a0 ?? 1.2) + (o.a1 ?? 2.0)) / 2, r = o.r ?? 4.5;
  const fx = x + Math.cos(mid) * r, fz = z + Math.sin(mid) * r;
  const { x: _x, z: _z, pose, r: _r, h, a0, a1, fov, th, acc, set, p, phase, ...spec } = o;
  S(id, at, { hours: 10, ...spec, veg: { r0: 20, ...(spec.veg || {}) },
    cam: orbitCam([x, z], r, h ?? 1.5, a0 ?? 1.2, a1 ?? 2.0, fov ?? 38, th ?? 1.15),
    setup(c) { const P = who(c, name, x, z, pose || 'idle', { yawTo: [fx, fz], phase: phase ?? 0.3, p, acc }); if (set) set(c, P); } }, off);
}
// two characters facing each other (a, b names); camera dollies in the pair's frame. o: x, z, yaw, gap, pa, pb, cam [dx,h,dz], cam2, th, fov, hours, set(c, A, B)
export function duo(id, at, off, a, b, o = {}) {
  const yaw = o.yaw ?? 0.4, gap = (o.gap ?? 2.4) / 2, x = o.x, z = o.z, s = Math.sin(yaw), cs = Math.cos(yaw);
  const L = (dx, dz) => [x + dx * cs + dz * s, z - dx * s + dz * cs];
  const A = L(-gap, 0), B = L(gap, 0), c0 = o.cam || [0.5, 1.5, -5.5], c1 = o.cam2 || [-0.5, 1.5, -4.4];
  const C = (v) => { const q = L(v[0], v[2]); return [q[0], v[1], q[1]]; };
  const { x: _x, z: _z, yaw: _y, gap: _g, pa, pb, cam, cam2, th, fov, set, p1, p2, ...spec } = o;
  S(id, at, { hours: 10, ...spec, veg: { r0: 20, ...(spec.veg || {}) },
    cam: camK(C(c0), [...L(0, 0)].reduce((q, v, i) => i ? [q[0], th ?? 1.2, v] : [v], []), fov ?? 38, C(c1), [...L(0, 0)].reduce((q, v, i) => i ? [q[0], th ?? 1.2, v] : [v], []), fov ?? 38),
    setup(c) { const PA = who(c, a, A[0], A[1], pa || 'idle', { yawTo: B, phase: 0.2, p: p1 }), PB = who(c, b, B[0], B[1], pb || 'idle', { yawTo: A, phase: 1.1, p: p2 }); if (set) set(c, PA, PB); } }, off);
}

// remove the stone town's houses within r of (x, z) so a plaza / the Hall stands in open ground (spec.townFilter)
export const clearTown = (x, z, r) => (b) => Math.hypot(b.x - x, b.z - z) > r;
export const clearTowns = (...L) => (b) => L.every(([x, z, r]) => Math.hypot(b.x - x, b.z - z) > r);
export { templeXZ } from './p1/sets.js';
