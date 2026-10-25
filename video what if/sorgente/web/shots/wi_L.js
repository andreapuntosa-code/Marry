// L: What if every atom lost one electron for 10 seconds?
import { T, D, L, KIDS, kid, row, hopper, dancer, flyer, charged, sparks, meadowDress, sm } from './whatif_kit.js';
const M = L.meadow;
T('L01', 0, M, { cam: [0, 1.15, -4.8], cam2: [0, 1.1, -4.2], tgt: [0, 1.15, 1], fov: 62, cr: 5,
  set(c, f) { meadowDress(c, f); row(c, f, KIDS.slice(0, 5), 1, 0.95, ['idle', 'scratchHead', 'idle', 'lookUp', 'idle'], { arc: 0.2 }); } });
D('L02', 'atom');
D('L03', 'atom_lose');
D('L04', 'repel');
// tingling: hair stands up, little sparks
T('L05', 0, M, { cam: [0.4, 1.25, -3.0], cam2: [0.3, 1.25, -2.6], tgt: [0, 1.25, 0], fov: 58, cr: 5,
  set(c, f) { meadowDress(c, f); charged(c, 'yellow', f, [0, 0], { pose: 'lookUp', glow: (t) => 0.15 + 0.1 * t, amount: (t) => sm(0.3, 1.2, t), n: 50 }); } });
T('L05b', 0, M, { cam: [0, 1.3, -2.6], cam2: [0, 1.32, -2.3], tgt: [0, 1.4, 0], fov: 56, cr: 5,
  set(c, f) { meadowDress(c, f); charged(c, 'yellow', f, [0, 0], { pose: 'scratchHead', glow: (t) => 0.35, n: 70 }); } });
// pushed apart: the gang glows and is blown outwards
T('L06', 0, M, { cam: [0, 1.6, -7], cam2: [0, 1.8, -8.5], tgt: [0, 1.2, 1], fov: 64, cr: 5, shake: (t) => 0.02 + 0.05 * Math.min(1, t / 3),
  set(c, f) { meadowDress(c, f); KIDS.slice(0, 7).forEach((k, i) => { const a = i / 7 * Math.PI * 2, at = [Math.cos(a) * 0.9, 1 + Math.sin(a) * 0.9]; const P = charged(c, k, f, at, { pose: 'armsOpen', glow: (t) => Math.min(1.2, 0.3 + t * 0.35), n: 40, seed: i + 2 }); }); KIDS.slice(0, 7).forEach((k, i) => {}); } });
T('L06', 2.4, M, { cam: [0, 2.2, -8], tgt: [0, 1.2, 1], fov: 66, cr: 5, shake: 0.08,
  set(c, f) { meadowDress(c, f); KIDS.slice(0, 7).forEach((k, i) => { const a = i / 7 * Math.PI * 2; flyer(c, k, f, [Math.cos(a) * 0.9, 1 + Math.sin(a) * 0.9], 0.0, [Math.cos(a) * 14, 3, Math.sin(a) * 14], { g: 2, lift: 0.4 }); }); sparks(c, f.x, 1.2 + 0.1, f.z, { n: 160, size: 0.14 }); } });
D('L07', 'earth_boom');
D('L08', 'supernova');
D('L09', 'clock_zero');
T('L10', 0, M, { cam: [0, 1.15, -4.5], cam2: [0, 1.1, -4.0], tgt: [0, 1.1, 1], fov: 62, cr: 5,
  set(c, f) { meadowDress(c, f); row(c, f, KIDS.slice(0, 5), 1, 0.95, ['sitGround', 'armsCrossed', 'shrug', 'sitGround', 'idle'], { arc: 0.2 }); } });
T('L11', 0, M, { cam: [0, 1.2, -4.6], cam2: [0, 1.25, -4.2], tgt: [0, 1.1, 1], fov: 62, cr: 5, set(c, f) { meadowDress(c, f); row(c, f, KIDS.slice(0, 5), 1, 0.95, 'wave', { arc: 0.2 }); } });
