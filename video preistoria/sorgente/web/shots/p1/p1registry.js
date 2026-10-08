// Part 1's shots, kept as a library: they register into P1 (no film timeline), Part 2 re-uses them by id ('p1_<id>').
export const P1 = {};
export const SHOTS = P1;
export const LIST = [];
export function shotOnly(id, spec) { P1[id] = spec; }
export function shot(id, at, spec, off = 0) { if (P1[id]) throw new Error('duplicate p1 shot ' + id); P1[id] = spec; }
