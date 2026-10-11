// OPPOSITES, HIDE AND SEEK, DANCE PARTY, GOODBYE, OUTRO
import { T, L, KIDS, kid, row, hopper, dancer, walker, beast, farm, tree, flowers, rock, meadowDress, height } from './kids_kit.js';
const M = L.meadow, F = L.farm;
function farmSet(c, f) { farm(c, f); flowers(c, f.x, f.z + 4, 14, 600, 7); const a = f.p(-16, 18), b = f.p(17, 10); tree(c, a[0], a[1], 10, 0); tree(c, b[0], b[1], 9, 1); }

// ---------------------------------------------------------------- OPPOSITES
T('chap:o00', 0, M, { cam: [0, 2.4, -9], cam2: [0, 2.0, -7], tgt: [0, 1, 2], fov: 50, cr: 5, set(c, f) { meadowDress(c, f); KIDS.forEach((k, i) => { const q = f.p(4.5 - i, 1.5); kid(c, k, q[0], q[1], i % 2 ? 'praise' : 'crouch', { yaw: f.yaw + Math.PI, phase: i }); }); } });
T('o00', 0, M, { cam: [-3, 1.4, -6], cam2: [-1, 1.3, -5], tgt: [0, 1, 2], fov: 46, cr: 5, set(c, f) { meadowDress(c, f); row(c, f, KIDS, 1.5, 1.0, ['wave', 'idle']); } });
// big & small: the mammoth next to the goat
const bigSmall = (c, f) => { farmSet(c, f); const m = f.p(-12, 5), g = f.p(-7.5, 4); beast(c, 'mammoth', 1, m[0], m[1], f.yaw - Math.PI / 2, { speed: 0, cadence: 4 }); beast(c, 'goat', 1, g[0], g[1], f.yaw - Math.PI / 2, { phase: 4 }); };
T('o01', 0, F, { cam: [-9.5, 1.4, -7], cam2: [-9.5, 1.6, -9], tgt: [-10, 2.0, 4.5], fov: 50, cr: 6, sr: 40, set: bigSmall });
T('o02', 0, F, { cam: [-6, 0.5, -2.5], cam2: [-6.5, 0.6, -3.0], tgt: [-9.5, 1.6, 4.5], fov: 54, cr: 6, sr: 40, set: bigSmall });
// fast & slow: Red runs past, Brown strolls
T('o03', 0, M, { cam: [0, 1.3, -8], cam2: [0, 1.3, -8], tgt: [3, 1.0, 1], tgt2: [-3, 1.0, 1], fov: 50, cr: 5,
  set(c, f) { meadowDress(c, f); walker(c, 'K_red', f.p(7, 0), f.p(-9, 0), { pose: 'run', run: true, t0: 0.1, t1: 2.0 }); walker(c, 'K_brown', f.p(4, 2), f.p(1, 2), { pose: 'walk', t0: 0, t1: 6, speed: 0.5 }); } });
T('o04', 0, M, { cam: [-2, 1.2, -6], tgt: [0, 1.0, 1.5], fov: 48, cr: 5,
  set(c, f) { meadowDress(c, f); walker(c, 'K_red', f.p(7, 0.5), f.p(-8, 0.5), { pose: 'run', run: true, t0: 0.0, t1: 1.6 }); walker(c, 'K_brown', f.p(2.4, 2.2), f.p(0.6, 2.2), { pose: 'walk', t0: 0, t1: 5, speed: 0.5 }); } });
// up & down: Blue jumps, then sits
function upDown(c, f, sitAt) { meadowDress(c, f); const P = c.person('K_blue', { x: f.x, z: f.z, yaw: f.yaw + Math.PI }); const y0 = height(f.x, f.z); P.anim = (Q, t) => { if (t < sitAt) { const ph = (t * 1.5) % 1, h = Math.sin(ph * Math.PI) * 0.6; Q.pose(h > 0.05 ? 'jumpReach' : 'cheer', t, {}); Q.root.position.y = y0 + h; } else { Q.root.position.y = y0; Q.pose('sitGround', t, {}); } }; }
T('o05', 0, M, { cam: [0.8, 1.1, -3.6], cam2: [0.6, 1.0, -3.2], tgt: [0, 1.0, 0], fov: 46, cr: 5, hero: true, set(c, f) { upDown(c, f, Math.max(1.2, c.m('o05@sits', 2.2))); } });
T('o06', 0, M, { cam: [-1.2, 0.9, -3.4], tgt: [0, 0.9, 0], fov: 46, cr: 5, set(c, f) { upDown(c, f, Math.max(0.8, c.m('o06@down', 1.0))); } });
// happy & sad, the big hug
T('o07', 0, M, { cam: [0, 1.15, -3.8], cam2: [0, 1.15, -3.4], tgt: [0, 1.0, 0], fov: 44, cr: 5, hero: true, set(c, f) { meadowDress(c, f); const a = f.p(0.8, 0), b = f.p(-0.8, 0); hopper(c, 'yellow', a[0], a[1], { yaw: f.yaw + Math.PI, amp: 0.3 }); kid(c, 'orange', b[0], b[1], 'sad', { yaw: f.yaw + Math.PI }); } });
T('o08', 0, M, { cam: [-2.5, 1.6, -4.5], cam2: [-1.5, 1.4, -3.6], tgt: [0, 0.9, 0], fov: 46, cr: 5,
  set(c, f) { meadowDress(c, f); kid(c, 'orange', f.x, f.z, 'sad', { yaw: f.yaw + Math.PI }); KIDS.filter(k => k !== 'orange').forEach((k, i) => { const a = i / 9 * Math.PI * 2, s = f.p(Math.cos(a) * 3.2, Math.sin(a) * 3.2), e = f.p(Math.cos(a) * 0.95, Math.sin(a) * 0.95); walker(c, 'K_' + k, s, e, { t0: 0.1, t1: 1.6, endPose: 'armsOpen', endYaw: Math.atan2(f.x - e[0], f.z - e[1]) }); }); } });
T('o09', 0, M, { cam: [0, 1.3, -3.2], cam2: [0, 1.25, -2.8], tgt: [0, 1.0, 0], fov: 46, cr: 5, hero: true,
  set(c, f) { meadowDress(c, f); hopper(c, 'orange', f.x, f.z, { yaw: f.yaw + Math.PI, amp: 0.35 }); KIDS.filter(k => k !== 'orange').forEach((k, i) => { const a = i / 9 * Math.PI * 2, e = f.p(Math.cos(a) * 1.1, Math.sin(a) * 1.1); kid(c, k, e[0], e[1], 'cheer', { yawTo: [f.x, f.z], phase: i }); }); } });
// day & night: they sit and watch the sun go down
const sunset = (c, f) => { meadowDress(c, f); KIDS.forEach((k, i) => { const q = f.p(3.6 - i * 0.8, -0.5 + (i % 2) * 0.4); kid(c, k, q[0], q[1], 'sitGround', { yaw: f.yaw + Math.PI, phase: i }); }); };
T('o10', 0, M, { cam: [0, 1.3, -7.5], tgt: [0, 2.2, 20], fov: 52, cr: 5, sr: 40, hoursFn: (t, d) => 15.5 + 2.0 * (t / d), set: sunset });
T('o11', 0, M, { cam: [0, 1.3, -7.0], cam2: [0, 1.6, -8.0], tgt: [0, 2.2, 20], tgt2: [0, 4, 20], fov: 52, cr: 5, sr: 40, hasStars: true, hoursFn: (t, d) => 17.5 + 4.2 * Math.min(1, t / (d * 0.85)), set: sunset });

// ---------------------------------------------------------------- HIDE AND SEEK (morning)
const H = L.meadow2;
const hideSet = (c, f, purpleOut) => { meadowDress(c, f); rock(c, ...f.p(-4, 6), 1.9, 3, 0.4); tree(c, ...f.p(4, 7), 9, 1); const t = f.p(4.3, 7.9); if (purpleOut) kid(c, 'purple', t[0] - 1.1, t[1], 'wave', { yaw: f.yaw + Math.PI }); else kid(c, 'purple', t[0], t[1] + 0.2, 'crouch', { yaw: f.yaw + Math.PI }); KIDS.filter(k => k !== 'purple').slice(0, 4).forEach((k, i) => { const q = f.p(-1.5 + i * 1.0, 0); kid(c, k, q[0], q[1], i % 2 ? 'lookAround' : 'idle', { yaw: f.yaw, phase: i }); }); };
T('chap:h00', 0, H, { cam: [0, 4, -8], cam2: [0, 3.2, -6], tgt: [0, 1, 6], fov: 50, cr: 5, hours: 8.6, set: (c, f) => hideSet(c, f, false) });
T('h00', 0, H, { cam: [-2, 1.6, -5], cam2: [0, 1.5, -4], tgt: [0, 1.0, 5], fov: 50, cr: 5, hours: 8.8, set: (c, f) => hideSet(c, f, false) });
T('h01', 0, H, { cam: [-2.5, 1.3, 1.5], cam2: [-3.0, 1.2, 2.5], tgt: [-4, 0.6, 6], fov: 46, cr: 5, hours: 8.8, set: (c, f) => hideSet(c, f, false) });
T('h02', 0, H, { cam: [-6.5, 1.2, 4.0], cam2: [-6.0, 1.2, 8.5], tgt: [-4, 0.5, 6], fov: 46, cr: 5, hours: 8.8, set: (c, f) => hideSet(c, f, false) });
T('h03', 0, H, { cam: [2.0, 1.4, 1.5], cam2: [2.5, 1.3, 3.0], tgt: [4, 1.2, 7], fov: 46, cr: 5, hours: 8.8, set: (c, f) => hideSet(c, f, false) });
T('h04', 0, H, { cam: [2.0, 1.2, 4.6], cam2: [2.4, 1.2, 5.2], tgt: [3.2, 1.1, 7.9], fov: 44, cr: 5, hours: 8.8, hero: true, set: (c, f) => hideSet(c, f, true) });
T('h05', 0, H, { cam: [2.6, 1.15, 5.6], cam2: [2.7, 1.15, 6.0], tgt: [3.2, 1.1, 7.9], fov: 42, cr: 5, hours: 8.8, hero: true, set: (c, f) => hideSet(c, f, true) });
// Green behind the cow
const cowSet = (c, f, out) => { farmSet(c, f); const q = f.p(-6, 12); beast(c, 'cow', 1, q[0], q[1], f.yaw + Math.PI / 2, { phase: 1, graze: 0.6 }); const g = f.p(-6.2, 13.4); kid(c, 'green', out ? g[0] + 1.6 : g[0], g[1], out ? 'wave' : 'crouch', { yaw: f.yaw + Math.PI }); };
T('h06', 0, F, { cam: [-5, 1.5, 6.5], cam2: [-5.5, 1.4, 7.5], tgt: [-6, 0.8, 12], fov: 46, cr: 6, sr: 30, hours: 9.2, set: (c, f) => cowSet(c, f, false) });
T('h07', 0, F, { cam: [-4, 1.2, 8.4], cam2: [-4.3, 1.2, 9.0], tgt: [-5.2, 1.0, 13], fov: 44, cr: 6, sr: 30, hours: 9.2, hero: true, set: (c, f) => cowSet(c, f, true) });
T('h08', 0, F, { cam: [-3.6, 1.15, 10.6], cam2: [-3.8, 1.15, 11.0], tgt: [-4.6, 1.1, 13.4], fov: 42, cr: 6, sr: 30, hours: 9.2, hero: true, set: (c, f) => cowSet(c, f, true) });

// ---------------------------------------------------------------- DANCE PARTY
const party = (c, f, o = {}) => { meadowDress(c, f); KIDS.forEach((k, i) => { const a = i / 10 * Math.PI * 2, q = f.p(Math.cos(a) * 3, 2 + Math.sin(a) * 2); dancer(c, k, q[0], q[1], { yaw: f.yaw + Math.PI, phase: i * 0.3, ...o }); }); };
T('chap:d00', 0, M, { cam: [0, 5, -7], cam2: [0, 3.5, -6], tgt: [0, 1, 2], fov: 52, cr: 5, set: (c, f) => party(c, f) });
T('d00', 0, M, { cam: [-6, 1.5, -5], cam2: [6, 1.5, -5], tgt: [0, 1, 2], fov: 50, cr: 5, set: (c, f) => party(c, f) });
T('d01', 0, M, { cam: [0, 1.0, -6], cam2: [0, 0.8, -5], tgt: [0, 1.3, 2], fov: 54, cr: 5, set(c, f) { meadowDress(c, f); KIDS.forEach((k, i) => { const a = i / 10 * Math.PI * 2, q = f.p(Math.cos(a) * 3, 2 + Math.sin(a) * 2); hopper(c, k, q[0], q[1], { yaw: f.yaw + Math.PI, amp: 0.5, hz: 1.6 }); }); } });
T('d02', 0, M, { cam: [3, 1.4, -5], cam2: [1, 1.4, -5], tgt: [0, 1, 2], fov: 50, cr: 5, set: (c, f) => party(c, f, { seq: ['cheer', 'praise'], per: 0.35 }) });
T('d03', 0, M, { cam: [0, 3.5, -5], cam2: [0, 3.0, -4], tgt: [0, 0.8, 2], fov: 54, cr: 5, set: (c, f) => party(c, f, { seq: ['armsOpen'], spin: 4.5, amp: 0.05 }) });
T('d04', 0, M, { cam: [-3, 1.0, -5.5], cam2: [-1, 0.9, -5], tgt: [0, 1.5, 2], fov: 52, cr: 5, set: (c, f) => party(c, f, { seq: ['praise', 'wave'], per: 0.5 }) });
T('d05', 0, M, { cam: [0, 1.6, -6.5], cam2: [0, 2.6, -8.5], tgt: [0, 1, 2], fov: 52, cr: 5, set(c, f) { meadowDress(c, f); KIDS.forEach((k, i) => { const a = i / 10 * Math.PI * 2, q = f.p(Math.cos(a) * 3, 2 + Math.sin(a) * 2); hopper(c, k, q[0], q[1], { yaw: f.yaw + Math.PI, amp: 0.7, hz: 1.4, t0: i * 0.05 }); }); } });

// ---------------------------------------------------------------- GOODBYE (golden afternoon)
const G = { hours: 16.9 };
T('chap:g00', 0, M, { ...G, cam: [0, 3, -10], cam2: [0, 2.5, -8.5], tgt: [0, 1, 2], fov: 50, cr: 5, sr: 40, set(c, f) { meadowDress(c, f); row(c, f, KIDS, 1.5, 1.05, 'wave'); } });
T('g00', 0, M, { ...G, cam: [5, 1.4, -6], cam2: [2, 1.3, -6.5], tgt: [0, 1, 1.5], fov: 46, cr: 5, set(c, f) { meadowDress(c, f); row(c, f, KIDS, 1.5, 1.05, ['cheer', 'idle', 'wave']); } });
T('g01', 0, M, { ...G, cam: [0, 1.3, -6], cam2: [0, 1.2, -5], tgt: [0, 1, 1.5], fov: 46, cr: 5, set(c, f) { meadowDress(c, f); row(c, f, KIDS, 1.5, 1.05, 'idle'); } });
T('g02', 0, M, { ...G, cam: [5.2, 1.15, -1.6], cam2: [-5.2, 1.15, -1.6], tgt: [4.6, 1.0, 1.5], tgt2: [-4.6, 1.0, 1.5], fov: 40, cr: 5, set(c, f) { meadowDress(c, f); KIDS.forEach((k, i) => { const q = f.p(4.5 - i, 1.5); hopper(c, k, q[0], q[1], { yaw: f.yaw + Math.PI, t0: c.m('g02@' + (i + 1), i * 0.9) - 0.1, amp: 0.4 }); }); } });
T('g03', 0, M, { ...G, cam: [0, 1.5, -7], cam2: [0, 1.3, -6], tgt: [0, 1, 1.5], fov: 48, cr: 5, set(c, f) { meadowDress(c, f); row(c, f, KIDS, 1.5, 1.05, ['cheer', 'praise']); } });
T('g04', 0, M, { ...G, cam: [0, 1.3, -5], cam2: [0, 1.4, -6], tgt: [0, 1.05, 1.5], fov: 46, cr: 5, hero: true, set(c, f) { meadowDress(c, f); row(c, f, KIDS, 1.5, 1.0, 'wave', { arc: 0.2, p: { speed: 1.3 } }); } });
T('g05', 0, M, { ...G, cam: [0, 1.2, -4.4], cam2: [0, 1.25, -5.0], tgt: [0, 1.05, 1.5], fov: 50, cr: 5, hero: true, set(c, f) { meadowDress(c, f); row(c, f, KIDS, 1.5, 0.95, 'wave', { arc: 0.22, p: { speed: 1.5 } }); } });
T('outro', 0, M, { hours: 17.3, cam: [0, 1.5, -6], cam2: [0, 9, -22], tgt: [0, 1, 1.5], tgt2: [0, 1, 4], fov: 50, cr: 5, sr: 50, set(c, f) { meadowDress(c, f, { R: 22, n: 1400 }); row(c, f, KIDS, 1.5, 1.05, 'wave', { arc: 0.2 }); } });
