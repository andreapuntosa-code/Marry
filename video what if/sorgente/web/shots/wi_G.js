// G: What if gravity turned off for 10 seconds?
import { T, D, L, KIDS, kid, row, hopper, dancer, floater, floatBeast, waterBlobs, pond, meadowDress, farm, beast, sm } from './whatif_kit.js';
const M = L.meadow, F = L.farm;
const slow = (h1, d0 = 0) => (t) => Math.max(0, h1 * Math.min(1, (t + d0) / 12) ** 2);
T('G01', 0, M, { cam: [0, 1.0, -5.5], cam2: [0, 0.9, -4.8], tgt: [0, 1.3, 1], fov: 64, cr: 5,
  set(c, f) { meadowDress(c, f); KIDS.slice(0, 6).forEach((k, i) => { const q = f.p(2.5 - i, 1 + (i % 2) * 0.8); hopper(c, k, q[0], q[1], { yaw: f.yaw + Math.PI, t0: i * 0.13, amp: 0.4, hz: 1.4 }); }); } });
T('G02', 0, M, { cam: [0, 1.0, -5], cam2: [0, 1.0, -4.5], tgt: [0, 1.1, 1], fov: 62, cr: 5,
  set(c, f) { meadowDress(c, f); KIDS.slice(0, 5).forEach((k, i) => floater(c, k, f, [2 - i, 1 + (i % 2) * 0.6], (t) => 0.02 * t * t, { before: 'lookAround' })); } });
T('G02b', 0, M, { cam: [0.3, 1.25, -2.6], tgt: [0, 1.25, 0], fov: 56, cr: 5,
  set(c, f) { meadowDress(c, f); floater(c, 'green', f, [0, 0], (t) => 0.05 + 0.03 * t, { before: 'shrug', air: 'shrug' }); } });
D('G03', 'tangent');
// 1.7 m: everybody adrift, the camera looks up at them
T('G04', 0, M, { cam: [0, 0.4, -5], cam2: [0, 0.5, -4.4], tgt: [0, 1.6, 1], fov: 66, cr: 5,
  set(c, f) { meadowDress(c, f); KIDS.slice(0, 6).forEach((k, i) => floater(c, k, f, [2.5 - i, 1 + (i % 2) * 0.8], (t) => 0.8 + 0.25 * t + 0.1 * Math.sin(i), { air: i % 2 ? 'armsOpen' : 'jumpReach', tilt: 0.2 * (i % 3 - 1) })); } });
// the one who jumped: up, up, up
T('G05', 0, M, { cam: [0, 1.0, -6], cam2: [0, 1.2, -7.5], tgt: [0, 2.0, 1], tgt2: [0, 9, 1], fov: 66, cr: 5,
  set(c, f) { meadowDress(c, f); floater(c, 'pink', f, [0, 1], (t) => 0.3 + 2.0 * t, { air: 'jumpReach' }); KIDS.filter(k => k !== 'pink').slice(0, 4).forEach((k, i) => floater(c, k, f, [1.6 - i * 1.1 + (i > 1 ? -0.6 : 0), 1.8], (t) => 1.0 + 0.2 * t, { air: 'lookUp' })); } });
T('G05b', 0, M, { cam: [0.5, 15, -2.5], cam2: [0.4, 16.5, -2.2], tgt: [0, 15.5, 1], tgt2: [0, 17, 1], fov: 58, cr: 5,
  set(c, f) { meadowDress(c, f); floater(c, 'pink', f, [0, 1], (t) => 15 + 2.0 * t, { air: 'cower' }); } });
// animals float, water blobs leave the pond
T('G06', 0, F, { cam: [0, 1.0, 7.2], cam2: [1.2, 1.2, 8.0], tgt: [0, 2.2, 16], fov: 64, cr: 6, sr: 40,
  set(c, f) { farm(c, f); pond(c, f, 0.5, 19, 2.6); waterBlobs(c, f, 0.5, 19, (t) => 0.6 + 0.5 * t, { n: 8 }); floatBeast(c, 'cow', 1, f, [1.0, 13], (t) => 1.0 + 0.3 * t, { yaw: 1.2 }); floatBeast(c, 'sheep', 2, f, [-1.6, 15.5], (t) => 1.8 + 0.3 * t); floatBeast(c, 'sheep', 3, f, [2.0, 16.5], (t) => 2.6 + 0.3 * t); floatBeast(c, 'goat', 1, f, [-0.8, 11], (t) => 0.6 + 0.3 * t); floater(c, 'blue', f, [1.6, 10.5], (t) => 1.2 + 0.25 * t, { air: 'armsOpen' }); } });
T('G07', 0, M, { cam: [0.4, 2.3, -2.6], cam2: [0.3, 2.35, -2.3], tgt: [0, 2.3, 0], fov: 56, cr: 5,
  set(c, f) { meadowDress(c, f); floater(c, 'orange', f, [0, 0], (t) => 1.4 + 0.1 * t, { air: 'headInHands' }); } });
// gravity comes back: frozen for a beat...
T('G08', 0, M, { cam: [0, 0.6, -6.5], tgt: [0, 2.0, 1], fov: 66, cr: 5,
  set(c, f) { meadowDress(c, f); KIDS.slice(0, 6).forEach((k, i) => floater(c, k, f, [2.5 - i, 1 + (i % 2) * 0.8], (t) => 1.8 + 0.1 * Math.sin(i), { air: 'cower' })); } });
// ...and everyone drops (two metres: fine); Pink falls from high into the pond
const drop = (h0, t0 = 0) => (t) => Math.max(0, h0 - 0.5 * 9.8 * Math.max(0, t - t0) ** 2);
T('G09', 0, M, { cam: [0, 0.6, -6.5], cam2: [0, 0.8, -7], tgt: [0, 1.4, 1], fov: 66, cr: 5,
  set(c, f) { meadowDress(c, f); KIDS.slice(0, 6).forEach((k, i) => { if (k === 'pink') return; floater(c, k, f, [2.5 - i, 1 + (i % 2) * 0.8], drop(1.8, 0.1 + i * 0.03), { air: 'cower', before: 'sitGround' }); }); } });
T('G09', 2.6, F, { cam: [-4, 1.0, -6.0], cam2: [-4, 1.4, -5.0], tgt: [-4, 6, 2.5], tgt2: [-4, 0.6, 2.5], fov: 64, cr: 6, sr: 30,
  set(c, f) { farm(c, f); pond(c, f, -4, 2.5, 3.2); floater(c, 'pink', f, [-4, 2.5], (t) => Math.max(-0.5, 14 - 0.5 * 9.8 * t * t), { air: 'cower', before: 'sitGround' }); waterBlobs(c, f, -4, 2.5, (t) => (t > 1.7 ? (t - 1.7) * 3 : 0), { n: 8, seed: 9 }); } });
T('G10', 0, F, { cam: [-1.8, 1.1, -5.2], cam2: [-2.0, 1.1, -4.6], tgt: [-4, 0.7, 0.0], fov: 60, cr: 6, sr: 30,
  set(c, f) { farm(c, f); pond(c, f, -4, 2.5, 3.2); kid(c, 'pink', ...f.p(-4, -0.9), 'sitGround', { yaw: f.yaw + Math.PI }); kid(c, 'green', ...f.p(-2.4, -1.4), 'shrug', { yaw: f.yaw + Math.PI + 0.5 }); } });
T('G11', 0, M, { cam: [0, 1.2, -4.6], cam2: [0, 1.25, -4.2], tgt: [0, 1.1, 1], fov: 62, cr: 5, set(c, f) { meadowDress(c, f); row(c, f, KIDS.slice(0, 5), 1, 0.95, 'wave', { arc: 0.2 }); } });
