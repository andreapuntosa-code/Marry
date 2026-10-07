// CHAPTER IV — THE LITTLE ONES (years 2141-2162): Lumi builds a world in a box; the big ones must decide whether to press the button.
import { S, K, camK, who, vil, portrait, duo, reuse, clearTown, clearTowns, THREE, TIME, PLAZA, crowdDisc, height, lerp, clamp01, mulberry32, NIGHT, DUSK } from './p2kit.js';
import { narratorRoom, labScene, hallScene, voteBowls, roomAt, ROOM_SHOT, drawComments } from './p2scenes.js';
import * as P from '../lib/p2.js';

const T99 = { year: 1999, town: true };
const LAB = { interior: true, hours: 22, exposure: 1.3, ambient: 0.3 };
const LROOM = (a, t, f, b = a, tb = t, f2 = f) => K([0, roomAt(...a), roomAt(...t), f], [1, roomAt(...b), roomAt(...tb), f2], { abs: true });
const smk = (t, a, b) => clamp01((t - a) / (b - a));
const lab = (o, cam, extra = {}) => ({ ...LAB, cam, setup(c) { labScene(c, o); if (o.after) o.after(c); }, ...extra });
const SQ = { x: PLAZA.x + 2, z: PLAZA.z + 4 };             // the square where the computer stands
const SQF = { ...T99, townFilter: clearTown(SQ.x, SQ.z, 34), veg: { r0: 20 } };
const crowdRing = (c, n, r0, r1, colors) => { const cr = crowdDisc(c, n, SQ.x, SQ.z, r0, r1, SQ.x, SQ.z, { seed: 6, colors: colors || [0xf2f2f2, 0xe8d8c0, 0xdde4ee, 0xf3e6d2] }); return cr; };

// s01..s02 Lumi's lab
S('s01', 's01', lab({ phase: 0, pose: 'watch' }, LROOM([-1.6, 1.4, 1.8], [0, 1.0, 0], 44, [-1.2, 1.3, 1.5], [0, 1.0, 0], 40)));
S('s02', 's02', lab({ phase: 0, pose: 'watch' }, LROOM([0.9, 1.25, 1.1], [0, 1.1, 0.5], 36, [0.6, 1.3, 1.0], [0, 1.1, 0.5], 32)));
S('s03', 's03', lab({ phase: 0, pose: 'watch' }, LROOM([0.2, 1.2, 0.5], [0, 1.12, -0.32], 26, [0.1, 1.16, 0.2], [0, 1.12, -0.32], 20)));
S('s04', 's04', lab({ phase: 0, pose: 'watch' }, LROOM([0.0, 1.15, 0.05], [0, 1.12, -0.32], 20, [0.0, 1.14, -0.1], [0, 1.12, -0.32], 14)));
S('s05', 's05', lab({ phase: 0, pose: 'groan' }, LROOM([-1.5, 1.3, 1.6], [0, 1.1, 0.3], 42, [-1.1, 1.3, 1.3], [0, 1.1, 0.3], 38)));
S('s06', 's06', lab({ phase: 0, pose: 'watch' }, LROOM([0.1, 1.18, 0.3], [0, 1.12, -0.32], 24, [0.0, 1.15, 0.15], [0, 1.12, -0.32], 18)));
S('s06b', 's06b', lab({ phase: 1, pose: 'watch', world: { names: true } }, LROOM([0.1, 1.18, 0.3], [0, 1.12, -0.32], 24, [0.0, 1.15, 0.15], [0, 1.12, -0.32], 18)));
S('s07', 's07', lab({ phase: 0, pose: 'asleep', bowl: true }, LROOM([-1.4, 1.2, 1.5], [0, 1.0, 0.3], 40, [-1.0, 1.15, 1.2], [0, 1.0, 0.3], 36)));
S('s07b', 's07b', lab({ phase: 5, pose: 'watch' }, LROOM([0.1, 1.18, 0.3], [0, 1.12, -0.32], 24, [0.0, 1.15, 0.15], [0, 1.12, -0.32], 18)));
S('s07c', 's07c', { interior: true, hours: 3, ...ROOM_SHOT, cam: K([0, roomAt(-1.4, 1.4, 1.6), roomAt(0, 1.0, 0), 42], [1, roomAt(-1.0, 1.3, 1.3), roomAt(0, 1.0, 0), 38], { abs: true }), setup(c) { const { me } = narratorRoom(c, { pose: 'lean', cereal: true }); const keep = me.anim; me.anim = (Q, t) => { keep(Q, t); Q.spine.rotation.x += Math.sin(t * 17) * 0.05; }; } });
S('s07d', 's07d', lab({ phase: 6, pose: 'watch' }, LROOM([0.1, 1.18, 0.3], [0, 1.12, -0.32], 24, [0.0, 1.15, 0.15], [0, 1.12, -0.32], 18)));
S('s07e', 's07e', lab({ phase: 6, pose: 'cry' }, LROOM([0.6, 1.25, 1.0], [0, 1.15, 0.5], 30, [0.45, 1.3, 0.85], [0, 1.15, 0.5], 24)));
// s08 the whole city gathers round the computer in the square, like a campfire
const SQSET = (c, phase, o = {}) => { const m = P.monitor(c, SQ.x, 1.9, SQ.z, Math.PI, 3.6, (g, W, H, t) => P.drawLittleWorld(g, W, H, t, typeof phase === 'function' ? phase(t) : phase, o.world || {}), { px: 1024, light: 5, lightColor: 0x9fd0ff, both: true, yaw: Math.PI }); return m; };
S('s08a', 's08', { ...SQF, hours: 18.8, cloud: 0.2, cam: camK([SQ.x - 14, 3.0, SQ.z - 16], [SQ.x, 2.4, SQ.z], 46, [SQ.x - 9, 3.2, SQ.z - 12], [SQ.x, 2.4, SQ.z], 42),
  setup(c) { SQSET(c, 1); crowdRing(c, 260, 3.5, 14); } });
S('s08b', 's08', { ...SQF, hours: 18.8, cloud: 0.2, cam: camK([SQ.x - 3, 26, SQ.z - 30], [SQ.x, 0, SQ.z], 50, [SQ.x - 2, 20, SQ.z - 22], [SQ.x, 0, SQ.z], 48),
  setup(c) { SQSET(c, 1); crowdRing(c, 420, 3.5, 17); } }, 3.0);
S('s08c', 's08', { ...SQF, hours: 19.2, cloud: 0.2, cam: camK([SQ.x - 2.2, 1.7, SQ.z - 5.6], [SQ.x - 1.4, 1.8, SQ.z - 1.8], 40, [SQ.x - 1.4, 1.7, SQ.z - 4.6], [SQ.x - 1.0, 1.8, SQ.z - 1.8], 34),
  setup(c) { SQSET(c, 1); for (let i = 0; i < 9; i++) vil(c, i * 3, SQ.x - 3.6 + (i % 5) * 1.6, SQ.z - 3.2 + Math.floor(i / 5) * 1.6, i % 3 ? 'watch' : 'armsOpen', { yawTo: [SQ.x, SQ.z], era: 'stone', phase: i }); } }, 6.0);
S('s08d', 's08b', { ...SQF, hours: 19, cloud: 0.2, cam: camK([SQ.x - 0.2, 2.3, SQ.z - 4.6], [SQ.x, 2.0, SQ.z], 34, [SQ.x - 0.1, 2.3, SQ.z - 3.4], [SQ.x, 2.0, SQ.z], 26),
  setup(c) { SQSET(c, 1, { world: { year: (t) => 2150 + t * t * 50 } }); } });
S('s08e', 's08c', { ...SQF, hours: 19, cloud: 0.2, cam: camK([SQ.x, 2.3, SQ.z - 3.8], [SQ.x, 2.0, SQ.z], 28, [SQ.x, 2.3, SQ.z - 3.4], [SQ.x, 2.0, SQ.z], 24), setup(c) { SQSET(c, 1, { world: { king: true, year: 2400 } }); } });
S('s08f', 's08d', { ...SQF, hours: 19.4, cloud: 0.2, cam: camK([SQ.x - 2, 1.5, SQ.z - 4.4], [SQ.x, 1.5, SQ.z - 1], 38, [SQ.x - 1.5, 1.5, SQ.z - 4.0], [SQ.x, 1.5, SQ.z - 1], 34), setup(c) { SQSET(c, 1, { world: { king: true } }); who(c, 'LUMI', SQ.x + 2.2, SQ.z - 2.2, 'groan' === 'x' ? 'idle' : 'facepalm', { yawTo: [SQ.x, SQ.z] }); } });
S('s09a', 's09', { ...SQF, hours: 19.6, cloud: 0.5, cam: camK([SQ.x - 0.4, 2.3, SQ.z - 4.0], [SQ.x, 2.0, SQ.z], 32, [SQ.x - 0.2, 2.3, SQ.z - 3.4], [SQ.x, 2.0, SQ.z], 26), setup(c) { SQSET(c, 2); } });
S('s09b', 's09', { ...SQF, hours: 19.6, cloud: 0.5, cam: camK([SQ.x - 14, 3.0, SQ.z - 14], [SQ.x, 2.4, SQ.z], 46, [SQ.x - 10, 3.2, SQ.z - 10], [SQ.x, 2.4, SQ.z], 42), setup(c) { SQSET(c, 2); const cr = crowdRing(c, 200, 3.5, 12); for (let i = 0; i < 200; i++) cr.walk[i] = i % 3 ? 0 : 1; } }, 2.4);
// s10..s11 the big ones panic; they all look at the same button
S('s10', 's10', { ...SQF, hours: 19.7, cloud: 0.5, cam: camK([SQ.x - 12, 2.4, SQ.z - 12], [SQ.x, 2.0, SQ.z], 50, [SQ.x - 9, 2.4, SQ.z - 9], [SQ.x, 2.0, SQ.z], 46),
  setup(c) { SQSET(c, 2); const cr = c.crowd(150, { seed: 3 }), r = mulberry32(2), B = []; for (let i = 0; i < 150; i++) B.push([r() * 6.28, 3.5 + r() * 9]); c.on((t) => { for (let i = 0; i < 150; i++) { const a = B[i][0] + t * (1.2 + (i % 4) * 0.4), d = B[i][1] + Math.sin(t * 3 + i) * 0.8; const x = SQ.x + Math.cos(a) * d, z = SQ.z + Math.sin(a) * d; cr.set(i, x, height(x, z), z, a + 1.6, 1); } cr.update(t); }); } });
S('s11', 's11', { ...SQF, hours: 19.8, cloud: 0.5, cam: camK([SQ.x - 5, 1.6, SQ.z - 8], [SQ.x + 7, 1.4, SQ.z + 4], 44, [SQ.x - 1, 1.5, SQ.z - 4], [SQ.x + 7, 1.4, SQ.z + 4], 38),
  setup(c) { SQSET(c, 2); P.bigButton(c, SQ.x + 7, SQ.z + 4); const cr = crowdRing(c, 140, 2.5, 11); } });
// s12..s13 Brax: "reload the last save" / Lumi: "they'll never be real"
S('s12', 's12', { ...SQF, hours: 19.8, cloud: 0.5, cam: camK([SQ.x + 3.4, 1.5, SQ.z - 1.6], [SQ.x + 7, 1.6, SQ.z + 4], 38, [SQ.x + 4.4, 1.5, SQ.z], [SQ.x + 7, 1.6, SQ.z + 4], 32),
  setup(c) { const bb = P.bigButton(c, SQ.x + 7, SQ.z + 4); who(c, 'BRAX', SQ.x + 5.4, SQ.z + 3.4, 'point', { yawTo: [SQ.x + 7, SQ.z + 4] }); } });
S('s13', 's13', { ...SQF, hours: 19.8, cloud: 0.5, cam: camK([SQ.x + 9.6, 1.5, SQ.z - 1.4], [SQ.x + 7, 1.6, SQ.z + 4], 38, [SQ.x + 9.0, 1.5, SQ.z], [SQ.x + 7, 1.6, SQ.z + 4], 34),
  setup(c) { P.bigButton(c, SQ.x + 7, SQ.z + 4); who(c, 'LUMI', SQ.x + 7.0, SQ.z + 3.0, 'armsOpen', { yawTo: [SQ.x + 7, SQ.z - 2] }); who(c, 'BRAX', SQ.x + 5.0, SQ.z + 3.6, 'armsOpen', { yawTo: [SQ.x + 7, SQ.z + 3] }); } });
S('s14', 's14', { interior: true, hours: 3, ...ROOM_SHOT, cam: K([0, roomAt(-1.5, 1.4, 1.6), roomAt(0, 1.0, 0), 42], [1, roomAt(-1.1, 1.3, 1.3), roomAt(0, 1.0, 0), 38], { abs: true }), setup(c) { narratorRoom(c, { pose: 'head', cereal: true, button: true }); } });
// s15..s18 the vote: interfere or don't; forty-one thousand vs forty-two thousand
const HALL = P.P2.hall, HF = clearTown(HALL.x, HALL.z, 38), ST = (dx, h, dz) => [HALL.x + dx, h, HALL.z + dz];
const hh = (o) => ({ ...T99, townFilter: HF, veg: { r0: 20 }, ...o });
S('s15', 's15', hh({ hours: 6.8, cloud: 0.4, cam: camK(ST(-1.2, 2.0, -6.2), ST(0, 2.3, 0), 36, ST(0.6, 2.2, -4.8), ST(0, 2.4, 0), 32),
  setup(c) { const H = hallScene(c, { n: 500, tiers: 9 }); who(c, 'ARU', H.podium[0], H.podium[2], 'raiseHand', { yaw: 0, y: H.podium[1] }); } }));
S('s16', 's16', hh({ hours: 22, hoursFn: (t, d) => 22 + 7 * (t / Math.max(d, 1)), cloud: 0.2, cam: camK(ST(0, 10, -26), ST(0, 2, 2), 54, ST(0, 6, -20), ST(0, 2, 2), 50),
  setup(c) { const H = hallScene(c, { n: 400, tiers: 9 }); const cr = c.crowd(160, { seed: 3, colors: [0xffffff, 0xe8d8c0] }); c.on((t) => { for (let i = 0; i < 160; i++) { const u = ((t * 0.35 + i / 160) % 1), x = HALL.x - 16 + u * 22 + Math.sin(i) * 1.5, z = HALL.z - 14 + ((i * 7) % 5) * 1.0; cr.set(i, x, height(x, z), z, 1.2, 1); } cr.update(t); }); for (let i = 0; i < 6; i++) c.fire(HALL.x - 14 + i * 4, HALL.z - 8, { size: 0.5, n: 10, light: i % 2 === 0, lightIntensity: 7, lightDist: 10 }); } }));
S('s17', 's17', hh({ hours: 6.9, cloud: 0.4, cam: camK(ST(0, 3.0, -7.8), ST(0, 0.6, -3.5), 44, ST(0, 4.0, -6.2), ST(0, 0.5, -3.5), 40),
  setup(c) { const H = hallScene(c, { n: 200, tiers: 9 }); const B2 = [[HALL.x - 1.6, HALL.z - 3.5], [HALL.x + 1.6, HALL.z - 3.5]]; voteBowls(c, B2, (t) => { const u = smk(t, 0, 2.6); return [Math.floor(405 * u), Math.floor(415 * u)]; }, { y: H.stage[1], max: 420 });
    ['INTERFERE', 'DON\'T'].forEach((n, i) => P.sign(c, B2[i][0], 2.0, HALL.z - 3.5, 0, 2.2, 0.9, [{ s: n, size: 140, y: 150, color: '#fff' }], { bg: i ? '#2a6a4a' : '#8a2a2a', face: [HALL.x, HALL.z - 20], posts: true })); } }));
S('s17t', 's17', { kind: '2d', name: 'tally2', bg: 's17', cam: camK([0, 10, 0], [0, 0, 10]) }, 1.4);
S('s18', 's18', hh({ hours: 6.9, cloud: 0.4, cam: camK(ST(0.6, 1.3, -5.6), ST(1.6, 0.5, -3.5), 30, ST(1.4, 0.9, -4.4), ST(1.6, 0.5, -3.5), 18),
  setup(c) { const H = hallScene(c, { n: 100, tiers: 9 }); const B2 = [[HALL.x - 1.6, HALL.z - 3.5], [HALL.x + 1.6, HALL.z - 3.5]]; voteBowls(c, B2, () => [400, 420], { y: H.stage[1], max: 420 }); } }));
S('s18b', 's18', hh({ hours: 6.9, cloud: 0.4, cam: camK(ST(-2.2, 1.6, -7.0), ST(-1.0, 1.7, -3.8), 34, ST(-1.6, 1.6, -6.2), ST(-1.0, 1.7, -3.8), 30),
  setup(c) { const H = hallScene(c, { n: 100, tiers: 9 }); who(c, 'LUMI', HALL.x - 2.4, HALL.z - 4.4, 'idle', { yawTo: [HALL.x + 1, HALL.z - 4.4], y: H.stage[1] }); who(c, 'BRAX', HALL.x + 0.2, HALL.z - 4.4, 'shrug', { yawTo: [HALL.x - 2.4, HALL.z - 4.4], y: H.stage[1] }); } }), 2.1);
S('s19', 's19', hh({ hours: 7.0, cloud: 0.4, cam: camK(ST(1.4, 2.0, -6), ST(0, 2.3, 0), 32, ST(0.6, 2.1, -4.4), ST(0, 2.4, 0), 28),
  setup(c) { const H = hallScene(c, { n: 400, tiers: 9 }); who(c, 'ARU', H.podium[0], H.podium[2], 'armsOpen', { yaw: 0, y: H.podium[1] }); } }));
S('s20', 's20', { interior: true, hours: 3, ...ROOM_SHOT, cam: K([0, roomAt(1.5, 1.5, 2.0), roomAt(0, 1.0, 0.1), 40], [1, roomAt(1.1, 1.4, 1.6), roomAt(0, 1.0, 0.1), 36], { abs: true }), setup(c) { narratorRoom(c, { pose: 'turn', cereal: true }); } });
// s21 the little ones survive; they build a fire; the eye in the dirt
S('s21', 's21', lab({ phase: 3, pose: 'watch' }, LROOM([0.1, 1.18, 0.3], [0, 1.12, -0.32], 24, [0.0, 1.15, 0.15], [0, 1.12, -0.32], 18)));
S('s21b', 's21b', lab({ phase: 4, pose: 'watch' }, LROOM([0.1, 1.18, 0.3], [0, 1.12, -0.32], 24, [0.0, 1.15, 0.15], [0, 1.12, -0.32], 16)));
S('s21c', 's21c', lab({ phase: 4, pose: 'watch' }, LROOM([0.5, 1.3, 1.05], [0.0, 1.28, 0.62], 24, [0.34, 1.3, 0.95], [0.0, 1.28, 0.62], 18)));
// s22 the big ones understand: the silence in the sky, forty years
S('s22a', 's22', { ...SQF, ...NIGHT, cloud: 0.1, cam: camK([SQ.x - 3, 1.7, SQ.z - 7], [SQ.x + 2, 9, SQ.z + 14], 66, [SQ.x - 3, 1.7, SQ.z - 7], [SQ.x + 2, 18, SQ.z + 14], 66),
  setup(c) { SQSET(c, 1); const cr = crowdRing(c, 200, 2.5, 10); } });
S('s22b', 's22', { ...T99, ...NIGHT, cloud: 0.1, townFilter: clearTowns([P.P2.observatory.x, P.P2.observatory.z, 24]), cam: camK([P.P2.observatory.x + 3, 1.4, P.P2.observatory.z - 9], [P.P2.observatory.x + 4, 1.8, P.P2.observatory.z - 4.5], 36, [P.P2.observatory.x + 4, 1.5, P.P2.observatory.z - 8], [P.P2.observatory.x + 4, 1.8, P.P2.observatory.z - 4.5], 30), veg: { r0: 20 },
  setup(c) { who(c, 'NERI', P.P2.observatory.x + 4, P.P2.observatory.z - 4.5, 'lookUp', { yaw: 3.0 }); } }, 2.4);
S('s22c', 's22', { ...T99, ...NIGHT, cloud: 0.1, cam: camK([-60, 3, -100], [-214, 300, 8], 68, [-60, 3, -100], [-214, 600, 8], 68), veg: { r0: 20 },
  setup(c) { P.ladderTower(c, { H: 3000, f: 0.55, beaconAlways: true }); P.skyPoint(c, [-200, 800, 600], { size: 80 }); } }, 4.4);
S('s23', 's23', { ...SQF, hours: 19.8, cloud: 0.5, cam: camK([SQ.x + 4.6, 1.7, SQ.z - 1.6], [SQ.x + 7, 1.6, SQ.z + 3.6], 38, [SQ.x + 5.6, 1.7, SQ.z - 0.4], [SQ.x + 7, 1.6, SQ.z + 3.6], 34),
  setup(c) { P.bigButton(c, SQ.x + 7, SQ.z + 4); who(c, 'LUMI', SQ.x + 6.4, SQ.z + 2.4, 'idle', { yawTo: [SQ.x + 7, SQ.z + 4] }); who(c, 'BRAX', SQ.x + 8.6, SQ.z + 2.6, 'headInHands', { yawTo: [SQ.x + 7, SQ.z + 4] }); who(c, 'ARU', SQ.x + 7.2, SQ.z + 1.2, 'armsCrossed', { yawTo: [SQ.x + 7, SQ.z + 4] }); } });
S('s24', 's24', { interior: true, hours: 3, ...ROOM_SHOT, cam: K([0, roomAt(-1.4, 1.35, 1.7), roomAt(0, 1.0, 0.1), 42], [1, roomAt(-1.0, 1.2, 1.4), roomAt(0, 0.95, 0.1), 38], { abs: true }), setup(c) { narratorRoom(c, { pose: 'head', cereal: true }); } });
S('s24b', 's24', { ...T99, hours: 5.8, cloud: 0.3, cam: camK([-120, 18, -150], [-214, 140, 8], 60, [-100, 26, -140], [-214, 200, 8], 58), veg: { r0: 30, rImp: 160, r1: 300 }, townFilter: clearTown(-210, 10, 60),
  setup(c) { P.industry(c, 1.0, { smokeOpacity: 0.5 }); P.ladderTower(c, { H: 3000, f: 0.7, beaconAlways: true }); } }, 1.4);
