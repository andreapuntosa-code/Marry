// INTRO, TITLE, COLORS, COLOR GAME
import { T, L, KIDS, kid, row, hopper, dancer, walker, meadowDress } from './kids_kit.js';
const M = L.meadow;
const others = (k) => KIDS.filter(x => x !== k);
// the rest of the gang standing behind the star of the shot
function backRow(c, f, k, dz = 4.2, pose = ['idle', 'wave', 'idle', 'cheer']) { row(c, f, others(k), dz, 1.05, pose); }

// ---------------------------------------------------------------- intro
T('i01', 0, M, { cam: [-12, 4.5, -20], cam2: [-5, 2.6, -12], tgt: [0, 1.0, 2], fov: 50, cr: 5, sr: 40,
  set(c, f) { meadowDress(c, f); row(c, f, KIDS, 2, 1.25, ['wave', 'cheer', 'idle', 'wave'], { arc: 0.25 }); } });
T('i02', 0, M, { cam: [0, 1.4, -7], cam2: [0, 1.2, -5.4], tgt: [0, 1.0, 0], fov: 44, cr: 4,
  set(c, f) { meadowDress(c, f); row(c, f, KIDS, 0, 1.0, 'idle', { arc: 0.18 }); } });
T('i03', 0, M, { cam: [0, 1.1, -4.6], cam2: [0, 1.15, -4.2], tgt: [0, 1.05, 0], fov: 50, cr: 4, hero: true,
  set(c, f) { meadowDress(c, f); row(c, f, KIDS, 0, 0.95, 'wave', { arc: 0.22 }); } });
T('i04', 0, M, { cam: [6, 2.2, -8], cam2: [-6, 2.2, -8], tgt: [0, 1.0, 1], fov: 46, cr: 4,
  set(c, f) { meadowDress(c, f); KIDS.forEach((k, i) => dancer(c, k, f.p(4.5 - i, 1 + (i % 2) * 0.8)[0], f.p(4.5 - i, 1 + (i % 2) * 0.8)[1], { yaw: f.yaw + Math.PI, phase: i * 0.3, amp: 0.06 })); } });
T('i05', 0, M, { cam: [0, 0.6, -5], cam2: [0, 1.0, -7], tgt: [0, 1.2, 0], fov: 50, cr: 4,
  set(c, f) { meadowDress(c, f); KIDS.forEach((k, i) => { const q = f.p(4.5 - i, 0.5 + (i % 3) * 0.5); hopper(c, k, q[0], q[1], { yaw: f.yaw + Math.PI, t0: 0.6 + i * 0.05, hz: 1.8 }); }); } });
// title: a wide, slow crane over the meadow
T('title', 0, M, { cam: [-18, 2.5, -16], cam2: [-8, 9, -22], tgt: [0, 1.5, 4], tgt2: [0, 1.0, 4], fov: 52, cr: 5, sr: 50,
  set(c, f) { meadowDress(c, f, { R: 22, n: 1400 }); KIDS.forEach((k, i) => { const q = f.p(4.5 - i, 3 + Math.sin(i) * 0.8); dancer(c, k, q[0], q[1], { yaw: f.yaw + Math.PI, phase: i * 0.37 }); }); } });

// ---------------------------------------------------------------- COLORS
T('chap:c00', 0, M, { cam: [0, 6, -14], cam2: [0, 4, -10], tgt: [0, 1, 3], fov: 50, cr: 5, sr: 40, set(c, f) { meadowDress(c, f); row(c, f, KIDS, 3, 1.2, 'cheer'); } });
T('c00', 0, M, { cam: [-7, 1.6, -9], cam2: [-3, 1.4, -6.5], tgt: [0, 1.0, 1], fov: 46, cr: 4, set(c, f) { meadowDress(c, f); row(c, f, KIDS, 1, 1.05, ['wave', 'idle']); } });

const LOVE = {
  red: (c, f) => hopper(c, 'red', f.x, f.z, { yaw: f.yaw + Math.PI, amp: 0.55, hz: 1.6 }),
  orange: (c, f) => dancer(c, 'orange', f.x, f.z, { yaw: f.yaw + Math.PI, per: 0.7, amp: 0.1 }),
  yellow: (c, f) => kid(c, 'yellow', f.x, f.z, 'praise', { yaw: f.yaw + Math.PI }),
  green: (c, f) => walker(c, 'K_green', f.p(4, 0.5), f.p(-4, 0.5), { pose: 'run', run: true, t0: 0.1, t1: 2.2 }),
  blue: (c, f) => kid(c, 'blue', f.x, f.z, 'wave', { yaw: f.yaw + Math.PI, p: { speed: 1.4 } }),
  purple: (c, f) => dancer(c, 'purple', f.x, f.z, { yaw: f.yaw + Math.PI, spin: 5, seq: ['armsOpen'], amp: 0.04 }),
  pink: (c, f) => kid(c, 'pink', f.x, f.z, 'kneel', { yaw: f.yaw + Math.PI }),
  brown: (c, f) => kid(c, 'brown', f.x, f.z, 'eat', { yaw: f.yaw + Math.PI }),
  white: (c, f) => kid(c, 'white', f.x, f.z, 'sleep', { yaw: f.yaw + Math.PI * 0.5 }),
  black: (c, f) => kid(c, 'black', f.x, f.z, 'lookUp', { yaw: f.yaw + Math.PI }),
};
KIDS.forEach((k, i) => {
  const id = (s) => `c${String(i + 1).padStart(2, '0')}${s}`;
  const side = i % 2 ? 1 : -1;
  // a: steps forward out of the line and says hello
  T(id('a'), 0, M, { cam: [0, 1.25, -4.6], cam2: [0, 1.15, -3.6], tgt: [0, 1.05, 0], fov: 42, cr: 4, hero: true,
    set(c, f) { meadowDress(c, f); backRow(c, f, k); walker(c, 'K_' + k, f.p(side * 1.2, 3.2), f.p(0, 0), { t0: 0, t1: 1.0, endPose: 'wave', endYaw: f.yaw + Math.PI }); } });
  // b: what the colour is like (slow orbit)
  T(id('b'), 0, M, { cam: [side * 1.8, 1.1, -3.4], cam2: [-side * 1.4, 1.15, -3.6], tgt: [0, 1.0, 0], fov: 40, cr: 4, hero: true,
    set(c, f) { meadowDress(c, f); backRow(c, f, k, 4.6, 'idle'); kid(c, k, f.x, f.z, 'armsOpen', { yaw: f.yaw + Math.PI }); } });
  // c: "can you say ...?" -- close, listening
  T(id('c'), 0, M, { cam: [0.3 * side, 1.12, -2.3], cam2: [0.2 * side, 1.12, -2.0], tgt: [0, 1.12, 0], fov: 40, cr: 4, hero: true,
    set(c, f) { meadowDress(c, f); kid(c, k, f.x, f.z, 'listen', { yaw: f.yaw + Math.PI }); } });
  // d: well done! jump and cheer, the gang cheers too
  T(id('d'), 0, M, { cam: [0, 1.3, -5.2], cam2: [0, 1.2, -4.6], tgt: [0, 1.1, 0.8], fov: 44, cr: 4,
    set(c, f) { meadowDress(c, f); backRow(c, f, k, 3.4, 'cheer'); hopper(c, k, f.x, f.z, { yaw: f.yaw + Math.PI, amp: 0.4 }); } });
  // e: what they love
  const night = k === 'black', cam = k === 'white' ? [1.6, 2.0, -2.2] : k === 'yellow' ? [0.6, 0.5, -3.0] : k === 'green' ? [0, 1.4, -6.5] : k === 'pink' ? [0.6, 0.8, -2.6] : [0.8 * side, 1.15, -3.4];
  T(id('e'), 0, M, { cam, cam2: [cam[0] * 0.8, cam[1], cam[2] * 0.9], tgt: k === 'yellow' || k === 'black' ? [0, 1.6, 0] : [0, k === 'white' ? 0.3 : 0.9, 0], fov: k === 'green' ? 52 : 42, cr: 4,
    hours: night ? 21.6 : k === 'yellow' ? 9.0 : 10.8, hasStars: night, hero: !night && k !== 'green',
    set(c, f) { meadowDress(c, f); if (k === 'pink') meadowDress(c, f, { R: 2.5, n: 220, seed: 9, trees: false }); LOVE[k](c, f); } });
});
T('c90', 0, M, { cam: [0, 2.0, -9], cam2: [0, 1.6, -7.5], tgt: [0, 1.0, 1], fov: 46, cr: 4, set(c, f) { meadowDress(c, f); KIDS.forEach((k, i) => { const q = f.p(4.5 - i, 1); hopper(c, k, q[0], q[1], { yaw: f.yaw + Math.PI, t0: i * 0.06, amp: 0.35 }); }); } });
// c91: the camera glides along the line as each colour is named
T('c91', 0, M, { cam: [5.2, 1.15, -2.6], cam2: [-5.2, 1.15, -2.6], tgt: [4.6, 1.0, 1], tgt2: [-4.6, 1.0, 1], fov: 40, cr: 4,
  set(c, f) { meadowDress(c, f); row(c, f, KIDS, 1, 1.0, 'wave'); } });

// ---------------------------------------------------------------- COLOR GAME
const SCAT = [[-3.2, 3.5], [2.6, 2.0], [0.4, 5.2], [-1.4, 1.2], [3.8, 4.8], [-4.4, 5.6], [1.6, 0.4], [-2.6, 7.0], [4.6, 1.0], [0.0, 3.0]];
const scatter = (c, f, pose = 'idle', except) => KIDS.forEach((k, i) => { if (k === except) return; const q = f.p(SCAT[i][0], SCAT[i][1]); kid(c, k, q[0], q[1], Array.isArray(pose) ? pose[i % pose.length] : pose, { yaw: f.yaw + Math.PI + Math.sin(i * 3) * 0.5, phase: i }); });
T('chap:q00', 0, M, { cam: [0, 8, -10], cam2: [0, 7, -8], tgt: [0, 0.5, 3.5], fov: 50, cr: 5, sr: 40, set(c, f) { meadowDress(c, f); scatter(c, f, ['wave', 'idle', 'cheer']); } });
T('q00', 0, M, { cam: [-6, 3.0, -7], cam2: [-3, 2.4, -6], tgt: [0, 0.9, 3.2], fov: 50, cr: 5, set(c, f) { meadowDress(c, f); scatter(c, f, ['idle', 'wave']); } });
[['green', 3], ['pink', 6], ['blue', 4]].forEach(([k, i], n) => {
  const s = SCAT[i];
  T(`q${n + 1}a`, 0, M, { cam: [0, 5.5, -8], cam2: [0, 5.0, -7], tgt: [0, 0.6, 3.4], fov: 52, cr: 5, set(c, f) { meadowDress(c, f); scatter(c, f, 'idle'); } });
  T(`q${n + 1}b`, 0, M, { cam: [s[0] * 0.6, 3.5, -5], cam2: [s[0], 1.3, s[1] - 2.6], tgt: [s[0], 0.8, s[1]], tgt2: [s[0], 1.0, s[1]], fov: 50, cr: 5,
    set(c, f) { meadowDress(c, f); scatter(c, f, 'idle', k); const q = f.p(s[0], s[1]); hopper(c, k, q[0], q[1], { yaw: f.yaw + Math.PI, t0: 0.5, amp: 0.4 }); } });
  T(`q${n + 1}c`, 0, M, { cam: [s[0] + 0.4, 1.15, s[1] - 2.4], cam2: [s[0] + 0.3, 1.12, s[1] - 2.0], tgt: [s[0], 1.1, s[1]], fov: 42, cr: 5, hero: true,
    set(c, f) { meadowDress(c, f); scatter(c, f, 'idle', k); const q = f.p(s[0], s[1]); kid(c, k, q[0], q[1], 'wave', { yaw: f.yaw + Math.PI }); } });
});
