// compact shot helper: Q(id, anchor, offset, env, camA, camB, tgtA, tgtB, fov, set, clear, extra)
import { sh } from './stage.js';
import { dolly } from './stage.js';
export function Q(id, at, off, env, camA, camB, tgtA, tgtB, fov, set, clr = [], extra = {}) {
  const t = tgtA;
  sh(id, at, env, { clear: clr, camClear: 6, shadow: { x: t[0], z: t[2], r: extra.sr ?? 32 }, cam: dolly(camA, camB || camA, t, tgtB || t, fov || 36), set, ...extra }, off);
}
export const at = (x, z, r = 24) => [x, z, r];
