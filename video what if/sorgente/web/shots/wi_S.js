// S: What if the Sun disappeared for 10 seconds?
import { T, D, L, KIDS, kid, row, hopper, beast, dog, meadowDress, farm, sunOff, sm } from './whatif_kit.js';
const M = L.meadow, F = L.farm;
const lazy = (c, f) => { meadowDress(c, f); [['sitGround', 1.6, 0.6], ['lie', 0.3, 1.4], ['sitGround', -1.2, 0.8], ['lie', -2.4, 1.8], ['lookUp', 2.8, 1.8]].forEach(([p, x, z], i) => kid(c, KIDS[i], ...f.p(x, z), p, { yaw: f.yaw + Math.PI + (i - 2) * 0.3, phase: i })); };
T('S01', 0, M, { hours: 11.5, cam: [0, 0.7, -4.5], cam2: [0, 0.8, -3.8], tgt: [0, 1.6, 4], fov: 64, cr: 5, set: lazy });
T('S02', 0, M, { hours: 11.5, cam: [3, 1.6, -4], cam2: [2, 1.5, -3.4], tgt: [0, 0.6, 1.2], fov: 60, cr: 5, set: lazy });
D('S03', 'sun_light');
D('S04', 'orbit_empty');
T('S04b', 0, M, { hours: 11.5, cam: [0.4, 0.8, -2.4], cam2: [0.3, 0.8, -2.1], tgt: [0, 0.75, 0.3], fov: 56, cr: 5, set(c, f) { meadowDress(c, f); kid(c, 'orange', f.x, f.z, 'sitGround', { yaw: f.yaw + Math.PI }); kid(c, 'red', ...f.p(-1.3, 0.8), 'lie', { yaw: f.yaw + Math.PI }); } });
// darkness, mid-day: the light goes out on "darkness"
const dark = (t0, t1 = 99) => ({ hours: 11.5, atmoFn: sunOff(11.5, t0, t1), hero: false, exposureFn: (t) => (t >= t0 && t < t1 ? 1.6 : 1.0) });
T('S05', 0, M, { ...dark(1.5), cam: [0, 1.0, -5], cam2: [0, 1.0, -4.6], tgt: [0, 1.0, 1], fov: 64, cr: 5,
  set(c, f) { lazy(c, f); } });
T('S06', 0, M, { ...dark(-1), cam: [-2, 1.4, -5], cam2: [-1, 1.4, -4.2], tgt: [0, 1.2, 1], fov: 64, cr: 5,
  set(c, f) { meadowDress(c, f); KIDS.slice(0, 5).forEach((k, i) => kid(c, k, ...f.p(2 - i, 1 + (i % 2) * 0.5), ['cower', 'lookAround', 'lookUp', 'cower', 'lookAround'][i], { yaw: f.yaw + Math.PI, phase: i })); } });
T('S06b', 0, M, { ...dark(-1), cam: [0.3, 1.25, -2.4], tgt: [0, 1.2, 0], fov: 56, cr: 5, set(c, f) { meadowDress(c, f); kid(c, 'purple', f.x, f.z, 'lookAround', { yaw: f.yaw + Math.PI }); } });
D('S07', 'orbit_straight');
// the Sun comes back: daylight snaps on, everybody cheers
T('S08', 0, M, { ...dark(-1, 1.2), cam: [0, 1.1, -5], cam2: [0, 1.2, -5.6], tgt: [0, 1.2, 1], fov: 64, cr: 5,
  set(c, f) { meadowDress(c, f); KIDS.slice(0, 5).forEach((k, i) => hopper(c, k, ...f.p(2 - i, 1 + (i % 2) * 0.5), { yaw: f.yaw + Math.PI, t0: 1.4 + i * 0.07, before: 'cower', amp: 0.35 })); } });
// confused animals
T('S09', 0, F, { hours: 11.6, cam: [0, 1.3, 6.5], cam2: [0.5, 1.3, 7.0], tgt: [0, 0.9, 13], fov: 62, cr: 6, sr: 30,
  set(c, f) { farm(c, f); beast(c, 'cow', 1, ...f.p(-2.4, 13), f.yaw + 2.6, { graze: 0, look: -0.3 }); beast(c, 'sheep', 2, ...f.p(1.5, 11.5), f.yaw + 3.6, { graze: 0, look: -0.3 }); beast(c, 'goat', 1, ...f.p(-0.5, 8), f.yaw + 3.2, { graze: 0, look: -0.2 }); kid(c, 'brown', ...f.p(1.8, 9.2), 'scratchHead', { yaw: f.yaw + Math.PI - 0.5 }); } });
T('S10', 0, M, { cam: [0, 1.2, -4.6], cam2: [0, 1.25, -4.2], tgt: [0, 1.1, 1], fov: 62, cr: 5, set(c, f) { meadowDress(c, f); row(c, f, KIDS.slice(0, 5), 1, 0.95, 'wave', { arc: 0.2 }); } });
