// Camera path helpers (keyframes with terrain-relative heights, orbits).
import * as THREE from 'three';
import { height } from './terrain.js';

const V3 = (a) => new THREE.Vector3(a[0], a[1], a[2]);
const ease = (u) => u * u * (3 - 2 * u);
export const easeInOut = (u) => (u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2);

// ---------------------------------------------------------------- camera helpers
// keyframes: [u, pos[x, h, z], target[x, h, z], fov]; heights are ABOVE THE TERRAIN at that xz unless abs:true
export function K(...keys) {
  const opts = (typeof keys[keys.length - 1] === 'object' && !Array.isArray(keys[keys.length - 1])) ? keys.pop() : {};
  const toW = (p) => (opts.abs ? V3(p) : new THREE.Vector3(p[0], height(p[0], p[2]) + p[1], p[2]));
  const ks = keys.map(([u, p, t, f]) => ({ u, p: toW(p), t: toW(t), f: f ?? 42 }));
  const e = opts.ease || easeInOut;
  return (tt, dur) => {
    const u0 = Math.min(1, Math.max(0, tt / Math.max(dur, 1e-3)));
    let i = 0; while (i < ks.length - 2 && u0 > ks[i + 1].u) i++;
    const a = ks[i], b = ks[Math.min(i + 1, ks.length - 1)];
    const lu = b.u > a.u ? Math.min(1, Math.max(0, (u0 - a.u) / (b.u - a.u))) : 0;
    const k = opts.linear ? lu : e(lu);
    return { pos: a.p.clone().lerp(b.p, k), target: a.t.clone().lerp(b.t, k), fov: a.f + (b.f - a.f) * k, roll: opts.roll ?? 0 };
  };
}
export function orbitCam(center, radius, h, a0, a1, fov = 40, th = 1.2) {
  const c = [center[0], 0, center[1]];
  return (tt, dur) => {
    const u = easeInOut(Math.min(1, tt / dur));
    const a = a0 + (a1 - a0) * u;
    const x = c[0] + Math.cos(a) * radius, z = c[2] + Math.sin(a) * radius;
    return { pos: new THREE.Vector3(x, height(x, z) + h, z), target: new THREE.Vector3(c[0], height(c[0], c[2]) + th, c[2]), fov, roll: 0 };
  };
}
