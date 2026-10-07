// world test shots (anchored past the end; rendered with --sample t_)
import { dolly, sh, envB, who, A, height, THREE } from './stage.js';
import { HG } from '../lib/biomes.js';
import * as H from '../lib/hg.js';
const C = [HG.cx, HG.cz];
const shotAt = (id, biome, hours, cam, tgt, extra = {}) => sh(id, 't:99' + String(Object.keys({}).length), envB(biome, hours), { cam: dolly(cam, cam, tgt, tgt, extra.fov || 40), ...extra }, 0);
let n = 0;
const T = (id, biome, hours, cam, tgt, extra = {}) => sh(id, 't:' + (99000 + (n++) * 10), envB(biome, hours), { cam: dolly(cam, cam, tgt, tgt, extra.fov || 40), shadow: { x: tgt[0], z: tgt[2], r: 60 }, ...extra }, 0);
T('t_horn', 'center', 15.5, [C[0] - 40, 12, C[1] - 70], [C[0], 11, C[1]], { fov: 46, clear: [[C[0], C[1], 75]], set: (c) => { H.horn(c, { yaw: Math.PI }); H.pedestals(c); } });
T('t_forest', 'forest', 9.5, [760, 3, 190], [730, 8, 170], { fov: 46 });
T('t_swamp', 'swamp', 8.5, [1170, 3, 190], [1230, 3, 170], { fov: 46, set: (c) => H.swampDress(c, 1200, 180, 40) });
T('t_desert', 'desert', 12.5, [1260, 6, 430], [1330, 5, 470], { fov: 46 });
T('t_lake', 'lake', 11, [930, 4, 470], [950, 0, 600], { fov: 46 });
T('t_mount', 'mountain', 10, [1000, 12, 120], [1000, 60, -150], { fov: 46 });
T('t_meadow', 'meadow', 16.5, [760, 3, 440], [700, 4, 470], { fov: 46 });
T('t_wide', 'center', 14, [1000, 260, 470], [1000, 0, 300], { fov: 60, set: (c) => { H.horn(c, { yaw: Math.PI }); H.staticWall(c, H.zoneRadius(40)); } });

// cast lineup
const LINE = ['REX', 'VEX', 'JUNE', 'FINN', 'KAI', 'LUNA', 'TOBY', 'DAX', 'BOLT', 'ROOK', 'ASTER', 'MARLO', 'SAGE', 'ECHO', 'ZARA', 'PIP'];
T('t_cast1', 'center', 15.5, [C[0] + 0.0, 1.5, C[1] - 12], [C[0], 1.2, C[1] - 4], { fov: 46, clear: [[C[0], C[1] - 4, 20]], shadow: { x: C[0], z: C[1] - 4, r: 26 },
  set: (c) => { LINE.slice(0, 8).forEach((nm, i) => who(c, nm, C[0] - 7 + i * 2.0, C[1] - 4, 'idle', { yaw: Math.PI, phase: i })); } });
T('t_cast2', 'center', 15.5, [C[0] + 0.0, 1.5, C[1] - 12], [C[0], 1.2, C[1] - 4], { fov: 46, clear: [[C[0], C[1] - 4, 20]], shadow: { x: C[0], z: C[1] - 4, r: 26 },
  set: (c) => { LINE.slice(8).forEach((nm, i) => who(c, nm, C[0] - 7 + i * 2.0, C[1] - 4, 'idle', { yaw: Math.PI, phase: i })); } });

// pose gallery
const GAL = ['sneak', 'sprint', 'limp', 'watch', 'stab', 'parry', 'duck', 'kneel', 'drink', 'tend', 'fish', 'forage', 'sleepCurl', 'hold', 'reach', 'hurt', 'hips', 'drawBow', 'guard', 'swing'];
const gal = (id, a, b, nm) => T(id, 'center', 15.5, [C[0] + 0, 2.2, C[1] - 14], [C[0], 1.0, C[1] - 4], { fov: 44, clear: [[C[0], C[1] - 4, 22]], shadow: { x: C[0], z: C[1] - 4, r: 26 },
  set: (c) => { GAL.slice(a, b).forEach((p, i) => who(c, nm[i % nm.length], C[0] - 7.5 + i * 2.0, C[1] - 4, p, { yaw: Math.PI * 0.85, phase: i * 0.5 })); } });
gal('t_gal1', 0, 8, ['REX', 'DAX', 'KAI', 'PIP', 'LUNA', 'VEX', 'TOBY', 'BOLT']);
gal('t_gal2', 8, 16, ['KAI', 'LUNA', 'ROOK', 'BOLT', 'PIP', 'ASTER', 'DAX', 'MARLO']);
gal('t_gal3', 16, 20, ['MARLO', 'VEX', 'DAX', 'REX']);
// front view lineup (faces)
const FR = (id, names, fov = 36) => T(id, 'center', 15.5, [C[0], 1.4, C[1] - 10], [C[0], 1.15, C[1] - 4], { fov, clear: [[C[0], C[1] - 4, 20]], shadow: { x: C[0], z: C[1] - 4, r: 26 },
  set: (c) => { names.forEach((nm, i) => who(c, nm, C[0] - (names.length - 1) * 0.9 + i * 1.8, C[1] - 4, 'idle', { yaw: Math.PI, phase: i })); } });
FR('t_front1', ['REX', 'VEX', 'JUNE', 'FINN', 'KAI', 'LUNA', 'TOBY', 'DAX']);
FR('t_front2', ['BOLT', 'ROOK', 'ASTER', 'MARLO', 'SAGE', 'ECHO', 'ZARA', 'PIP']);

// ---- cover / short shots (golden hour) ----
const CAST = ['REX', 'VEX', 'JUNE', 'FINN', 'KAI', 'LUNA', 'TOBY', 'DAX', 'BOLT', 'ROOK', 'ASTER', 'MARLO', 'SAGE', 'ECHO', 'ZARA'];
const hornSet = (c) => { H.horn(c, { yaw: Math.PI }); H.pedestals(c); };
// A: the hundred on their pedestals around the Horn at golden hour, seen from the side and low
T('th_a', 'center', 17.5, [C[0] - 24, 1.25, C[1] - 42], [C[0] + 3, 6.6, C[1] + 2], { fov: 50, clear: [[C[0], C[1], 70]], shadow: { x: C[0] - 8, z: C[1] - 26, r: 60 },
  set: (c) => { H.horn(c, { yaw: Math.PI * 1.45, ripple: 0.006 }); const P = H.pedestals(c); P.slice(0, 60).forEach((p, i) => { if (p.z > C[1] + 6) return; who(c, i % 16 < CAST.length ? CAST[i % 16 % CAST.length] : 'X' + (15 + i), p.x, p.z, i % 5 === 2 ? 'guard' : 'idle', { y: p.y, yaw: p.yaw, phase: i * 0.7 }); }); } });
// B: one contestant facing us, the Horn burning gold behind him
T('th_b', 'center', 17.6, [C[0] - 14, 1.05, C[1] - 30], [C[0] - 11.4, 1.7, C[1] - 20.3], { fov: 34, clear: [[C[0], C[1] - 10, 40]], shadow: { x: C[0] - 12, z: C[1] - 22, r: 30 },
  set: (c) => { H.horn(c, { yaw: Math.PI * 1.45, ripple: 0.006 }); H.pedestals(c); who(c, 'REX', C[0] - 13.6, C[1] - 25.5, 'guard', { yaw: 3.23, phase: 0.4 }); } });
// C: wide: the dome's edge closing in (red static) with a tiny figure
T('th_c', 'center', 17.2, [C[0], 2.2, C[1] - 60], [C[0], 6.5, C[1]], { fov: 50, clear: [[C[0], C[1] - 30, 50]], shadow: { x: C[0], z: C[1] - 20, r: 50 },
  set: (c) => { hornSet(c); H.staticWall(c, H.zoneRadius(55)); CAST.slice(0, 9).forEach((nm, i) => who(c, nm, C[0] - 16 + i * 4, C[1] - 28 - (i % 2) * 3, i % 2 ? 'sprint' : 'guard', { yaw: 0, phase: i })); } });
