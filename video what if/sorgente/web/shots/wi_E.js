// E: What if the Earth stopped spinning for 10 seconds?
import { T, D, L, KIDS, kid, row, hopper, dancer, walker, beast, dog, flyer, flyBeast, streaks, debris, meadowDress, tree, farm, loc, sm } from './whatif_kit.js';
const M = L.meadow, F = L.farm;
const POLE = loc('mountain', 0, 0);
const gang = (c, f, pose = ['idle', 'wave', 'cheer']) => KIDS.slice(0, 7).forEach((k, i) => { const q = f.p(3 - i, 1 + (i % 2) * 0.9); kid(c, k, q[0], q[1], Array.isArray(pose) ? pose[i % pose.length] : pose, { yaw: f.yaw + Math.PI, phase: i }); });
const wind = (c, f, from = 0, o = {}) => { streaks(c, f, 0, 4, { amount: (t) => sm(from, from + 0.4, t), speed: o.speed ?? 70, ...o }); debris(c, f, { amount: (t) => (t > from ? 1 : 0), speed: o.dspeed ?? 34 }); };
// hook: a sunny meadow, everybody playing
T('E01', 0, M, { cam: [0, 1.2, -6.5], cam2: [0, 1.0, -5.2], tgt: [0, 1.2, 1], fov: 64, cr: 5,
  set(c, f) { meadowDress(c, f); KIDS.slice(0, 7).forEach((k, i) => { const q = f.p(3 - i, 1 + (i % 2) * 0.9); dancer(c, k, q[0], q[1], { yaw: f.yaw + Math.PI, phase: i * 0.4, amp: 0.08 }); }); } });
D('E02', 'globe_spin');
T('E03', 0, M, { cam: [-2.5, 1.3, -6], cam2: [-1.5, 1.2, -5], tgt: [0, 1.1, 1.5], fov: 62, cr: 5, cloud: 0.35,
  set(c, f) { meadowDress(c, f); KIDS.slice(0, 6).forEach((k, i) => walker(c, 'K_' + k, f.p(3 - i * 1.2, 0.5 + (i % 2)), f.p(3.8 - i * 1.2, 2.5 + (i % 2)), { phase: i })); beast(c, 'cow', 1, ...f.p(-4, 7), f.yaw + 1.2, { phase: 1 }); } });
// the Earth stops: they freeze mid-step for a beat
T('E04', 0, M, { cam: [0, 1.2, -5], cam2: [0, 1.15, -4.4], tgt: [0, 1.1, 1.5], fov: 62, cr: 5,
  set(c, f) { meadowDress(c, f); KIDS.slice(0, 6).forEach((k, i) => { const q = f.p(3 - i * 1.2, 1.4 + (i % 2) * 0.6); kid(c, k, q[0], q[1], 'lookAround', { yaw: f.yaw + Math.PI, phase: i }); }); } });
// "but you don't": launched east
T('E05', 0, M, { cam: [0, 1.2, -5], tgt: [0, 1.1, 1.5], fov: 62, cr: 5, shake: 0.03,
  set(c, f) { meadowDress(c, f); wind(c, f, 0.35); KIDS.slice(0, 6).forEach((k, i) => flyer(c, k, f, [3 - i * 1.2, 1.4 + (i % 2) * 0.6], 0.35 + i * 0.03, [-16, 2.5, 0], { dir: i % 2 ? 1 : -1 })); } });
T('E05b', 0, M, { cam: [-12, 1.6, -3.4], cam2: [-26, 1.8, -3.4], tgt: [-12, 1.4, 1.5], tgt2: [-26, 1.4, 1.5], fov: 60, cr: 5, shake: 0.05,
  set(c, f) { meadowDress(c, f); wind(c, f, 0); flyer(c, 'red', f, [-10, 1.5], 0.0, [-15, 1.2, 0], { lift: 1.4, g: 1.5, spin: 3 }); } });
// everything that isn't bolted down: kids, a cow, sheep, the dog
T('E06', 0, F, { cam: [8, 2.4, -6], cam2: [-34, 2.4, -6], tgt: [4, 1.6, 6], tgt2: [-38, 1.6, 6], fov: 62, cr: 6, sr: 40, shake: 0.06,
  set(c, f) { farm(c, f); wind(c, f, 0, { depth: 30, h: 8 }); KIDS.slice(0, 5).forEach((k, i) => flyer(c, k, f, [6 - i * 1.4, 3 + i * 0.6], 0.0, [-6.6 - i * 0.2, 1.8, 0], { lift: 1.2, g: 1.2, dir: i % 2 ? 1 : -1 })); flyBeast(c, 'cow', 1, f, [4, 9], 0.2, [-6.4, 1.5, 0], { g: 1.2 }); flyBeast(c, 'sheep', 2, f, [7, 11], 0.0, [-6.8, 1.8, 0], { g: 1.2 }); flyBeast(c, 'sheep', 3, f, [2, 12], 0.4, [-6.6, 1.8, 0], { g: 1.2 }); flyBeast(c, 'wolf', 2, f, [9, 7], 0.1, [-6.9, 1.5, 0], { g: 1.2, fur: 0xc8955a }); } });
// supersonic wind: the trees bend, debris everywhere
T('E07', 0, M, { cam: [2, 1.4, -6], cam2: [1, 1.6, -5], tgt: [0, 3, 8], fov: 66, cr: 5, shake: 0.08,
  set(c, f) { meadowDress(c, f); wind(c, f, 0, { speed: 110, n: 420, opacity: 0.7, h: 10, depth: 30 }); flyer(c, 'yellow', f, [6, 3], 0.4, [-20, 2, 0], { lift: 1.6, g: 0.6 }); flyer(c, 'pink', f, [8, 5], 1.2, [-22, 2, 0], { lift: 2.2, g: 0.6 }); } });
// 4.6 km: high, fast aerial over the landscape chasing a tumbling kid
T('E08', 0, M, { cam: [34, 40, -14], cam2: [-56, 36, -14], tgt: [22, 2, 10], tgt2: [-68, 2, 10], fov: 56, cr: 5, sr: 60, hero: false,
  set(c, f) { meadowDress(c, f, { R: 30, n: 1400 }); flyer(c, 'green', f, [24, 10], 0.0, [-24, 4, 0], { lift: 6, g: 0.4, spin: 3 }); flyer(c, 'blue', f, [27, 8], 0.0, [-23, 4, 0], { lift: 5, g: 0.4, spin: -3 }); } });
D('E09', 'globe_waves');
// the North Pole: just turning slowly in place
T('E10', 0, POLE, { snow: 1, hours: 11, cam: [0, 1.4, -4.2], cam2: [0, 1.3, -3.6], tgt: [0, 1.0, 0], fov: 60, cr: 6,
  set(c, f) { const P = kid(c, 'white', f.x, f.z, 'armsCrossed', { yaw: f.yaw + Math.PI }); const y0 = P.root.rotation.y; P.anim = (Q, t) => { Q.pose('armsCrossed', t, {}); Q.root.rotation.y = f.yaw + Math.PI + t * 0.5; }; } });
// spinning again: thrown back the other way
T('E11', 0, M, { cam: [0, 1.3, -6], tgt: [0, 1.1, 1.5], fov: 62, cr: 5, shake: 0.05,
  set(c, f) { meadowDress(c, f); wind(c, f, 0.2, { speed: -70, dspeed: -34 }); KIDS.slice(0, 6).forEach((k, i) => flyer(c, k, f, [-8 + i * 0.8, 1.2 + (i % 3) * 0.7], 0.2 + i * 0.04, [17, 2.2, 0], { dir: i % 2 ? -1 : 1 })); } });
T('E11b', 0, M, { cam: [10, 1.5, -3.4], cam2: [22, 1.7, -3.4], tgt: [10, 1.4, 1.5], tgt2: [22, 1.4, 1.5], fov: 60, cr: 5, shake: 0.05,
  set(c, f) { meadowDress(c, f); wind(c, f, 0, { speed: -70, dspeed: -34 }); flyer(c, 'blue', f, [9, 1.5], 0.0, [13, 1.0, 0], { lift: 1.4, g: 1.2, spin: -3 }); } });
// the aftermath: a dizzy pile
T('E12', 0, M, { cam: [0, 4.5, -3.0], cam2: [0, 3.2, -2.4], tgt: [0, 0.2, 1.2], fov: 60, cr: 5,
  set(c, f) { meadowDress(c, f); ['fallDown', 'sprawl', 'sitGround', 'fallDown', 'scratchHead', 'sprawl'].forEach((p, i) => { const q = f.p(-1.5 + (i % 3) * 1.4, 0.4 + Math.floor(i / 3) * 1.2); kid(c, KIDS[i], q[0], q[1], p, { yaw: f.yaw + i * 1.3, phase: i }); }); } });
T('E13', 0, M, { cam: [0, 1.2, -4.6], cam2: [0, 1.25, -4.2], tgt: [0, 1.1, 1], fov: 62, cr: 5, set(c, f) { meadowDress(c, f); row(c, f, KIDS.slice(0, 5), 1, 0.95, 'wave', { arc: 0.2 }); } });
