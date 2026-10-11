// NUMBERS: the Little AIs jump into line one by one (numbered shirts), clap-count, rocket countdown
import { T, L, KIDS, kid, row, hopper, jumpIn, meadowDress } from './kids_kit.js';
const M = L.meadow;
const slot = (f, i) => f.p(4.5 - i, 1.0);
const wait = (f, i) => f.p(3.2 - (i % 5) * 1.6, 5.0 + Math.floor(i / 5) * 1.3);
// every kid waits at the back and jumps to its slot when its number is said
function lineUp(c, f, o = {}) {
  KIDS.forEach((k, i) => {
    const t0 = c.m(`n${String(i + 1).padStart(2, '0')}`, -99) + 0.45;
    jumpIn(c, k, wait(f, i), slot(f, i), t0, { numbered: true, yaw: f.yaw + Math.PI, dur: 0.55, h: 0.8 });
  });
}
T('chap:n00', 0, M, { cam: [0, 3, -9], cam2: [0, 2.4, -7], tgt: [0, 1, 3], fov: 50, cr: 5, set(c, f) { meadowDress(c, f); KIDS.forEach((k, i) => { const q = wait(f, i); kid(c, k, q[0], q[1], 'wave', { numbered: true, yaw: f.yaw + Math.PI, phase: i }); }); } });
T('n00', 0, M, { cam: [-5, 1.8, -7], cam2: [-2, 1.6, -6], tgt: [0, 1, 3], fov: 48, cr: 5, set(c, f) { meadowDress(c, f); KIDS.forEach((k, i) => { const q = wait(f, i); kid(c, k, q[0], q[1], i % 2 ? 'cheer' : 'idle', { numbered: true, yaw: f.yaw + Math.PI, phase: i }); }); } });
T('n01', 0, M, { cam: [2.6, 1.3, -4.2], cam2: [1.2, 1.3, -4.4], tgt: [2.4, 1.0, 1.5], tgt2: [1.0, 1.0, 1.5], fov: 46, cr: 5, set(c, f) { meadowDress(c, f); lineUp(c, f); } });
T('n06', 0, M, { cam: [-0.8, 1.3, -4.6], cam2: [-2.4, 1.3, -4.6], tgt: [-1.0, 1.0, 1.5], tgt2: [-2.4, 1.0, 1.5], fov: 48, cr: 5, set(c, f) { meadowDress(c, f); lineUp(c, f); } });
T('n11', 0, M, { cam: [0, 1.6, -7.5], cam2: [0, 1.4, -6.5], tgt: [0, 1.0, 1], fov: 50, cr: 5, set(c, f) { meadowDress(c, f); KIDS.forEach((k, i) => { const q = slot(f, i); hopper(c, k, q[0], q[1], { numbered: true, yaw: f.yaw + Math.PI, t0: i * 0.04, amp: 0.35 }); }); } });
T('n12b', 0, M, { cam: [5, 1.4, -5], cam2: [3, 1.4, -6], tgt: [0, 1.0, 1], fov: 46, cr: 5, set(c, f) { meadowDress(c, f); row(c, f, KIDS, 1, 1.0, 'wave', { numbered: true }); } });
T('n12c', 0, M, { cam: [0, 1.3, -6.5], cam2: [0, 1.2, -5.8], tgt: [0, 1.0, 1], fov: 48, cr: 5, set(c, f) { meadowDress(c, f); row(c, f, KIDS, 1, 1.0, ['cheer', 'praise'], { numbered: true }); } });
T('n13', 0, M, { cam: [-4, 0.9, -5], cam2: [-2, 0.8, -5], tgt: [0, 1.0, 1], fov: 48, cr: 5, set(c, f) { meadowDress(c, f); row(c, f, KIDS, 1, 1.0, 'crouch', { numbered: true }); } });
T('n14', 0, M, { cam: [0, 0.7, -7.5], cam2: [0, 0.8, -5.5], tgt: [0, 0.8, 1], fov: 50, cr: 5, set(c, f) { meadowDress(c, f); row(c, f, KIDS, 1, 1.0, 'crouch', { numbered: true }); } });
T('n15', 0, M, { cam: [0, 0.5, -6], cam2: [0, 1.2, -6.5], tgt: [0, 1.2, 1], tgt2: [0, 3.5, 1], fov: 54, cr: 5, set(c, f) { meadowDress(c, f); KIDS.forEach((k, i) => { const q = slot(f, i); hopper(c, k, q[0], q[1], { numbered: true, yaw: f.yaw + Math.PI, t0: 0.05, amp: 1.4, hz: 0.9 }); }); } });
T('n16', 0, M, { cam: [3, 0.4, -4], cam2: [2, 0.5, -3], tgt: [0, 2.5, 1], tgt2: [0, 4.5, 1], fov: 58, cr: 5, set(c, f) { meadowDress(c, f); KIDS.forEach((k, i) => { const q = slot(f, i); hopper(c, k, q[0], q[1], { numbered: true, yaw: f.yaw + Math.PI, t0: i * 0.08, amp: 1.0, hz: 1.1 }); }); } });
