// F: What if friction disappeared for 10 seconds?
import { T, D, L, KIDS, kid, row, walker, slipper, slider, fence, squirt, meadowDress, farm, sm } from './whatif_kit.js';
const M = L.meadow, F = L.farm;
T('F01', 0, M, { cam: [0, 1.0, -5.5], cam2: [0, 1.0, -4.8], tgt: [0, 1.1, 1.5], fov: 64, cr: 5,
  set(c, f) { meadowDress(c, f); slider(c, 'red', f, [4, 1], [-5, 1.6], 0.0, 4.5, { spin: 0.6 }); slipper(c, 'blue', f, [-1, 2.2], 0.6, 1.4); kid(c, 'yellow', ...f.p(1.6, 3), 'scratchHead', { yaw: f.yaw + Math.PI }); } });
// normal walking (friction at work)
T('F02', 0, M, { cam: [-3, 0.8, -3.5], cam2: [-1.5, 0.8, -3.2], tgt: [0, 0.7, 1.5], fov: 60, cr: 5,
  set(c, f) { meadowDress(c, f); KIDS.slice(0, 4).forEach((k, i) => walker(c, 'K_' + k, f.p(3 - i * 1.3, 0.5 + i * 0.6), f.p(-1 - i * 1.3, 1.5 + i * 0.6), { phase: i })); } });
// the ground becomes ice: the feet slip
T('F03', 0, M, { cam: [0.6, 1.0, -3.6], cam2: [0.4, 1.0, -3.2], tgt: [0, 0.9, 0.3], fov: 60, cr: 5,
  set(c, f) { meadowDress(c, f); slipper(c, 'green', f, [0, 0.3], 0.8, 2.3); slipper(c, 'pink', f, [1.4, 1.6], 1.2, 2.6); } });
T('F03b', 0, M, { cam: [0.3, 1.1, -2.6], tgt: [0, 0.9, 0], fov: 58, cr: 5, set(c, f) { meadowDress(c, f); slipper(c, 'brown', f, [0, 0], 0.0, 1.1); } });
// already moving: you just keep going
T('F04', 0, M, { cam: [6, 1.3, -5], cam2: [-8, 1.3, -5], tgt: [5, 1.0, 1.5], tgt2: [-9, 1.0, 1.5], fov: 62, cr: 5,
  set(c, f) { meadowDress(c, f, { R: 24, n: 1400 }); slider(c, 'red', f, [8, 1.5], [-16, 1.5], 0.0, 6.0); slider(c, 'orange', f, [10, 2.8], [-14, 2.8], 0.0, 6.0, { spin: 1.5, pose: 'cower' }); } });
T('F04b', 0, M, { cam: [0.6, 1.2, -3.0], cam2: [-4.6, 1.2, -3.0], tgt: [0, 1.1, 0], tgt2: [-5.2, 1.1, 0], fov: 58, cr: 5,
  set(c, f) { meadowDress(c, f); slider(c, 'red', f, [0.6, 0], [-5.6, 0], 0.0, 1.8, { pose: 'cower' }); } });
D('F05', 'knot');
// nails slide out: the fence falls apart
T('F06', 0, F, { cam: [0, 1.3, 1.0], cam2: [0.5, 1.2, 1.8], tgt: [0, 0.7, 5.5], fov: 62, cr: 6, sr: 30,
  set(c, f) { farm(c, f); fence(c, f, -4, 4, 5.5, 0.7); kid(c, 'purple', ...f.p(2.6, 4.2), 'cower', { yaw: f.yaw + Math.PI }); } });
// the apple squirts out of a hand
T('F07', 0, M, { cam: [0.6, 1.2, -2.4], cam2: [0.4, 1.2, -2.1], tgt: [0, 1.1, 0], fov: 56, cr: 5,
  set(c, f) { meadowDress(c, f); const P = kid(c, 'yellow', f.x, f.z, 'eat', { yaw: f.yaw + Math.PI }); P.anim = (Q, t) => Q.pose(t < 1.4 ? 'eat' : 'shrug', t, {}); squirt(c, P, 1.2, [0.8, 2.6, -1.4]); } });
// friction is back: the sliders stop dead and tumble
T('F08', 0, M, { cam: [0, 1.2, -5.5], tgt: [0, 0.9, 1.5], fov: 62, cr: 5, shake: (t, ctx) => (t > ctx.m('F08@instantly', 3.0) ? 0.05 : 0),
  set(c, f) { meadowDress(c, f); const st = Math.max(1.2, c.m('F08@instantly', 3.0)); [['red', 1.0], ['orange', 2.2], ['green', 0.0]].forEach(([k, z], i) => slider(c, k, f, [9 + i * 2, z], [-9 + i * 2, z], 0.0, 7.0, { stopAt: (st / 7.0) })); } });
T('F09', 0, M, { cam: [0, 4.6, -3.0], cam2: [0, 6.0, -4.0], tgt: [0, 0.2, 1.2], fov: 60, cr: 5,
  set(c, f) { meadowDress(c, f); ['fallDown', 'sprawl', 'fallDown', 'sprawl', 'sitGround', 'fallDown'].forEach((p, i) => kid(c, KIDS[i], ...f.p(-1.8 + (i % 3) * 1.5, 0.3 + Math.floor(i / 3) * 1.3), p, { yaw: f.yaw + i * 1.1, phase: i })); } });
T('F10', 0, M, { cam: [0, 1.2, -4.6], cam2: [0, 1.25, -4.2], tgt: [0, 1.1, 1], fov: 62, cr: 5, set(c, f) { meadowDress(c, f); row(c, f, KIDS.slice(0, 5), 1, 0.95, 'wave', { arc: 0.2 }); } });
