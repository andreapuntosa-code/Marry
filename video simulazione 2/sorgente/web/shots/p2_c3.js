// CHAPTER III — THE LADDER (years 2060-2140): steam, rails, factories, a grey lake, a dam, lamps, a tower to the sky.
import { S, K, camK, who, vil, portrait, duo, reuse, clearTown, clearTowns, THREE, TIME, PLAZA, PLAIN, crowdDisc, height, lerp, clamp01, mulberry32, NIGHT, DUSK, NUVIA, TAMARI, PRIMA } from './p2kit.js';
import { narratorRoom, hallScene, voteBowls, roomAt, ROOM_SHOT } from './p2scenes.js';
import { nuvia, goatFlock, herd, shoreZ } from './p1/peoples.js';
import * as P from '../lib/p2.js';

const T99 = { year: 1999, town: true };
const LD = P.P2.ladder, WS = { x: -190, z: 44 };      // the foot of the Ladder, the workshop yard
const IND = { ...T99, townFilter: clearTown(-210, 10, 60), fog: 0.0006, veg: { r0: 30, rImp: 160, r1: 300 } };
const NZ = shoreZ(-330);
const smk = (t, a, b) => clamp01((t - a) / (b - a));

// l01 Brax with the plans
S('l01a', 'l01', { ...IND, hours: 11, cloud: 0.4,
  cam: camK([WS.x - 7, 1.9, WS.z - 8], [WS.x, 2.4, WS.z + 1], 42, [WS.x - 4.5, 2.1, WS.z - 6], [WS.x, 2.4, WS.z + 1], 38),
  setup(c) { P.board(c, WS.x, 2.3, WS.z + 1.5, [WS.x - 7, WS.z - 14], 4.6, 2.8, (g, W, H, t) => { g.fillStyle = '#1e4a7a'; g.fillRect(0, 0, W, H); g.strokeStyle = '#d8ecff'; g.lineWidth = 4; for (let i = 1; i < 12; i++) { g.globalAlpha = 0.18; g.beginPath(); g.moveTo(0, i * H / 12); g.lineTo(W, i * H / 12); g.stroke(); g.beginPath(); g.moveTo(i * W / 12, 0); g.lineTo(i * W / 12, H); g.stroke(); } g.globalAlpha = 1; g.lineWidth = 6; const k = smk(t, 0.2, 3.5); g.beginPath(); g.moveTo(W * 0.5 - W * 0.12, H * 0.92); g.lineTo(W * 0.5 - W * 0.01, H * (0.92 - 0.8 * k)); g.moveTo(W * 0.5 + W * 0.12, H * 0.92); g.lineTo(W * 0.5 + W * 0.01, H * (0.92 - 0.8 * k)); for (let i = 0; i < 9 * k; i++) { const y = H * (0.92 - i * 0.09); const w = W * (0.12 - 0.011 * i); g.moveTo(W * 0.5 - w, y); g.lineTo(W * 0.5 + w, y); } g.stroke(); g.fillStyle = '#fff'; g.font = `900 ${H * 0.1}px Anton, sans-serif`; g.textAlign = 'left'; g.fillText('THE LADDER', W * 0.04, H * 0.14); }, { px: 1100 });
    who(c, 'BRAX', WS.x - 2.6, WS.z - 0.6, 'point', { yawTo: [WS.x, WS.z + 1.5] }); P.factory(c, WS.x - 24, WS.z + 24, 0.3, { smokeOpacity: 0.5 }); } });
S('l01b', 'l01', { ...IND, hours: 11, cloud: 0.4,
  cam: camK([WS.x + 10, 3.4, WS.z - 14], [WS.x - 2, 2.0, WS.z + 6], 54, [WS.x + 6, 3.0, WS.z - 11], [WS.x - 2, 2.0, WS.z + 6], 50),
  setup(c) { P.ironStack(c, WS.x - 8, WS.z + 8, 0.3); P.coalPile(c, WS.x + 6, WS.z + 10, 1.2); who(c, 'BRAX', WS.x - 1, WS.z + 1, 'scratchHead', { yaw: 3.4 }); P.factory(c, WS.x - 24, WS.z + 24, 0.3, { smokeOpacity: 0.5 }); P.steamEngine(c, WS.x + 3, WS.z + 6, 0.4, {}); } }, 2.4);
// l02 iron / coal / engines / rails / a tall ladder: five 0.6 s inserts
const INS = (id, off, setup, cam) => S(id, 'l02', { ...IND, hours: 12, cloud: 0.3, cam, setup }, off);
INS('l02a', 0, (c) => { P.ironStack(c, -190, 20, 0.2); }, camK([-193, 1.0, 16], [-190, 0.7, 20], 40, [-192, 1.1, 16.5], [-190, 0.7, 20], 34));
INS('l02b', 0.6, (c) => { P.coalPile(c, -190, 20, 1.2); }, camK([-193, 1.2, 16], [-190, 0.8, 20], 40, [-192, 1.3, 16.5], [-190, 0.8, 20], 34));
INS('l02c', 1.2, (c) => { P.steamEngine(c, -190, 20, 0.5, {}); }, camK([-195, 1.8, 14.5], [-190, 1.5, 20], 40, [-194, 1.9, 15], [-190, 1.5, 20], 34));
INS('l02d', 1.8, (c) => { P.railway(c, { pts: [[-214, 8], [-190, 18], [-166, 28]] }); }, camK([-196, 0.8, 12], [-186, 0.3, 20], 44, [-195, 0.8, 13], [-186, 0.3, 20], 38));
INS('l02e', 2.4, (c) => { P.woodTower(c, -190, 24, 22, {}); }, camK([-196, 1.2, 16], [-190, 11, 24], 56, [-195, 1.2, 17], [-190, 13, 24], 50));
// l03 a wooden tower, thirty meters; l04 it falls over, again, the third lasts all afternoon
S('l03', 'l03', { ...IND, hours: 10.5, cloud: 0.35,
  cam: camK([-210, 1.4, -8], [-214, 14, 8], 56, [-208, 1.6, -4], [-214, 17, 8], 52),
  setup(c) { P.woodTower(c, -214, 10, 30, {}); who(c, 'BRAX', -212, 3, 'hammer', { yawTo: [-214, 10] }); for (let i = 0; i < 4; i++) vil(c, i * 3, -220 + i * 2, 4, i % 2 ? 'carry' : 'chop', { yawTo: [-214, 10], era: 'stone', phase: i }); } });
S('l04a', 'l04', { ...IND, hours: 10.8, cloud: 0.35,
  cam: camK([-190, 4, -8], [-214, 10, 10], 54, [-188, 4.5, -4], [-214, 10, 10], 54),
  setup(c) { P.woodTower(c, -214, 10, 30, { yaw: 0.9, fall: (t) => smk(t, 0.8, 2.6) }); who(c, 'BRAX', -208, 4, 'cower', { yawTo: [-214, 10] }); for (let i = 0; i < 4; i++) vil(c, i * 3 + 1, -204 + i * 1.6, 0 + (i % 2) * 1.6, 'cower', { yawTo: [-214, 10], era: 'stone', phase: i }); } });
S('l04b', 'l04', { ...IND, hours: 13.5, cloud: 0.35,
  cam: camK([-190, 4, -8], [-214, 10, 10], 54, [-188, 4.5, -4], [-214, 10, 10], 54),
  setup(c) { P.woodTower(c, -214, 10, 34, { yaw: -0.8, fall: (t) => smk(t, 0.6, 2.2) }); who(c, 'BRAX', -208, 4, 'facepalm', { yawTo: [-214, 10] }); } }, 1.8);
S('l04c', 'l04', { ...IND, hours: 12, hoursFn: (t, d) => 10 + 6.5 * (t / Math.max(d, 1)), cloud: 0.35,
  cam: camK([-196, 2.4, -6], [-214, 14, 10], 52, [-196, 3.0, -4], [-214, 14, 10], 52),
  setup(c) { P.woodTower(c, -214, 10, 36, {}); who(c, 'BRAX', -208, 3, 'sit', { yawTo: [-214, 10], p: { seat: 0.45 } }); } }, 3.4);
// l04b version 4 iron legs, 5 staircase, 6 gift shop (the Assembly said no)
S('l04d', 'l04b', { ...IND, hours: 15, cloud: 0.3,
  cam: camK([-170, 4, -10], [-214, 30, 10], 56, [-172, 6, -6], [-214, 34, 10], 56),
  setup(c) { P.ladderTower(c, { H: 70, Wb: 9, Wt: 2, f: 1, levels: 8 }); who(c, 'BRAX', -204, 0, 'cheer', { yawTo: [-214, 8] }); } });
S('l04e', 'l04b', { ...IND, hours: 15.5, cloud: 0.3,
  cam: camK([-176, 4, -12], [-214, 34, 10], 56, [-178, 6, -8], [-214, 40, 10], 56),
  setup(c) { P.ladderTower(c, { H: 140, Wb: 14, Wt: 3, f: 1, levels: 14 }); } }, 2.6);
S('l04f', 'l04b', { ...IND, hours: 16.2, cloud: 0.3,
  cam: camK([-196, 2.0, -10], [-209, 3, 4], 46, [-197, 2.2, -8], [-209, 3, 4], 40),
  setup(c) { P.ladderTower(c, { H: 140, Wb: 14, Wt: 3, f: 1, levels: 14 }); P.sign(c, -205, 2.6, -2, 0, 3.4, 1.4, [{ s: 'GIFT SHOP', size: 170, y: 190, color: '#fff' }, { s: 'ladder keychains', size: 56, y: 330, color: '#ffd27a' }], { bg: '#2a6a4a', face: [-195, -12], posts: true, border: '#fff' }); const x = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 3.2), new THREE.MeshBasicMaterial({ color: 0xe5251d, side: THREE.DoubleSide })); x.position.set(-205.02, height(-205, -2) + 2.6, -2.05); x.rotation.set(0, Math.atan2(-195 + 205, -12 + 2), 0.9); c.add(x); const x2 = x.clone(); x2.rotation.z = -0.9; c.add(x2); who(c, 'ARU', -201, -7, 'armsCrossed', { yawTo: [-205, -2] }); } }, 5.2);
// l05 they fail fast and never get tired: day and night go by
S('l05', 'l05', { ...IND, hours: 12, hoursFn: (t, d) => 12 + 16 * (t / Math.max(d, 1)), cloud: 0.3,
  cam: camK([-186, 3, -2], [-214, 18, 10], 52, [-184, 3.4, 2], [-214, 18, 10], 50),
  setup(c) { P.ladderTower(c, { H: 140, Wb: 14, Wt: 3, f: 1, levels: 14 }); const poses = ['hammer', 'chop', 'carry', 'build']; for (let i = 0; i < 12; i++) vil(c, i * 2, -224 + (i % 6) * 3, 0 + Math.floor(i / 6) * 4, poses[i % 4], { yawTo: [-214, 8], era: 'stone', phase: i * 0.5 }); for (let i = 0; i < 4; i++) c.fire(-222 + i * 7, -3, { size: 0.5, n: 10, lightIntensity: 6, lightDist: 9 }); } });
// l05b every night that point blinked once; Neri wrote it down
S('l05b', 'l05b', { ...T99, townFilter: clearTowns([P.P2.observatory.x, P.P2.observatory.z, 24]), ...NIGHT, cloud: 0.1,
  cam: camK([P.P2.observatory.x + 3.4, 1.5, P.P2.observatory.z - 9.5], [P.P2.observatory.x + 4, 1.6, P.P2.observatory.z - 4], 38, [P.P2.observatory.x + 4.6, 1.5, P.P2.observatory.z - 8.5], [P.P2.observatory.x + 4, 1.6, P.P2.observatory.z - 4], 32), veg: { r0: 20 },
  setup(c) { const x = P.P2.observatory.x + 4, z = P.P2.observatory.z - 4; who(c, 'NERI', x, z, 'build', { yaw: 3.0 }); P.skyPoint(c, [P.P2.observatory.x + 4, 90, P.P2.observatory.z + 200], { size: 26, rate: 6 }); P.board(c, x + 2.6, 1.6, z + 0.8, [x - 5, z - 12], 1.6, 1.1, (g, W, H, t) => { g.fillStyle = '#efe8cf'; g.fillRect(0, 0, W, H); g.fillStyle = '#2a2018'; g.font = `${H * 0.13}px InterX, sans-serif`; ['regular.', 'deliberate.', 'intelligent.'].forEach((l, i) => { if (t > 0.5 + i * 1.3) g.fillText(l, W * 0.08, H * (0.28 + i * 0.26)); }); }, { px: 512, posts: false }); } });
S('l05c', 'l05c', { interior: true, hours: 3, ...ROOM_SHOT, cam: K([0, roomAt(-0.6, 1.3, 0.6), roomAt(0, 1.12, -0.32), 34], [1, roomAt(-0.45, 1.25, 0.45), roomAt(0, 1.12, -0.32), 28], { abs: true }),
  setup(c) { narratorRoom(c, { pose: 'lean', cereal: true, screen: (g, W, H, t) => { g.fillStyle = '#0a0f17'; g.fillRect(0, 0, W, H); g.fillStyle = '#7dd3fc'; g.font = `bold ${H * 0.06}px MonoX, monospace`; g.fillText('PRIMA.SIM', W * 0.04, H * 0.1); g.fillStyle = '#e2e8f0'; g.font = `bold ${H * 0.09}px MonoX, monospace`; g.fillText('AUTOSAVE', W * 0.06, H * 0.4); g.fillStyle = '#1e293b'; g.fillRect(W * 0.06, H * 0.5, W * 0.88, H * 0.1); g.fillStyle = '#38bdf8'; g.fillRect(W * 0.06, H * 0.5, W * 0.88 * Math.min(1, t / 1.8), H * 0.1); g.fillStyle = '#94a3b8'; g.font = `${H * 0.05}px MonoX, monospace`; g.fillText('every night at 03:00', W * 0.06, H * 0.76); } }); } });
// l06 the first steam engine moves: it scared eleven goats and one mayor
S('l06a', 'l06', { ...IND, hours: 11, cloud: 0.4,
  cam: camK([WS.x - 6, 1.5, WS.z - 7], [WS.x + 3, 1.5, WS.z + 6], 40, [WS.x - 4, 1.7, WS.z - 5], [WS.x + 3, 1.5, WS.z + 6], 36),
  setup(c) { P.steamEngine(c, WS.x + 3, WS.z + 6, 0.4, { run: (t) => smk(t, 0.5, 1.4) }); who(c, 'BRAX', WS.x + 6, WS.z + 3, 'cheer', { yawTo: [WS.x + 3, WS.z + 6] }); for (let i = 0; i < 5; i++) vil(c, i * 3, WS.x - 2 + i * 1.4, WS.z + 1, 'cower', { yawTo: [WS.x + 3, WS.z + 6], era: 'stone', phase: i }); } });
S('l06b', 'l06', { ...IND, hours: 11, cloud: 0.4,
  cam: camK([WS.x - 14, 1.6, WS.z + 6], [WS.x - 4, 1.0, WS.z + 6], 46, [WS.x - 12, 1.8, WS.z + 6], [WS.x - 4, 1.0, WS.z + 6], 42),
  setup(c) { P.steamEngine(c, WS.x + 3, WS.z + 6, 0.4, {}); goatFlock(c, [...Array(11)].map((_, i) => ({ x: WS.x - 2 + (i % 4) * 1.2, z: WS.z + 3 + Math.floor(i / 4) * 1.5, yaw: 3, vx: -6 - (i % 3), vz: ((i % 5) - 2) * 1.2, ph: i })), { seed: 6 }); const mg = c.animal('goat', 3, WS.x - 1, WS.z + 6, 4.7, {}); c.on((t) => { mg.animate(t, { speed: 1.4, phase: 1 }); const x = WS.x - 1 - 7 * t, z = WS.z + 6; mg.root.position.set(x, height(x, z), z); }); const sash = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.035, 6, 20), new THREE.MeshStandardMaterial({ color: 0x2a5bd7 })); sash.rotation.y = Math.PI / 2; sash.position.set(0, 0.62, 0); mg.root.add(sash); } }, 2.8);
// l07 the first railroad (40 km in ten years)
S('l07a', 'l07', { ...IND, hours: 14, cloud: 0.4,
  cam: camK([-150, 2.0, 10], [-176, 1.0, 24], 46, [-152, 2.2, 12], [-176, 1.0, 24], 42),
  setup(c) { P.railway(c, { pts: [[-120, 26], [-170, 24], [-230, 30]] }); for (let i = 0; i < 8; i++) vil(c, i * 2, -176 + (i % 4) * 2.5, 26 + Math.floor(i / 4) * 3, i % 2 ? 'hammer' : 'carry', { yawTo: [-170, 24], era: 'stone', phase: i }); P.ironStack(c, -168, 20, 0.2); } });
S('l07b', 'l07', { ...IND, hours: 15, cloud: 0.4,
  cam: camK([-200, 2.4, 38], [-176, 2.4, 28], 52, [-202, 2.4, 36], [-170, 2.4, 28], 50),
  setup(c) { P.railway(c, { pts: [[-120, 26], [-170, 24], [-230, 30], [-300, 6]] }); P.train(c, { pts: [[-120, 26], [-170, 24], [-230, 30], [-300, 6]], s0: 10, speed: 22, wagons: 4 }); } }, 2.6);
S('l07c', 'l07', { kind: '2d', name: 'railmap', bg: 'l07a', cam: camK([0, 10, 0], [0, 0, 10]) }, 4.2);
// l08..l09 the first factory, then a hundred; the city explodes
S('l08', 'l08', { ...IND, hours: 15.5, cloud: 0.4, townFilter: clearTown(-210, 10, 60), fog: 0.0008,
  cam: camK([-60, 90, -170], [-190, 8, 30], 56, [-90, 70, -140], [-190, 8, 30], 54), veg: { r0: 30, rImp: 160, r1: 300 },
  setup(c) { P.industry(c, (t) => 0.05 + 0.5 * smk(t, 0.2, 4.8), { maxLevel: 0.6, smokeOpacity: 0.7 }); } });
S('l09', 'l09', { ...IND, hours: 16.2, cloud: 0.5, fog: 0.0010,
  cam: camK([-40, 110, -190], [-190, 6, 30], 58, [-70, 80, -150], [-190, 6, 30], 56), veg: { r0: 30, rImp: 160, r1: 300 },
  setup(c) { P.industry(c, (t) => 0.5 + 0.5 * smk(t, 0.2, 3.6), { maxLevel: 1.0, smokeOpacity: 0.8 }); P.ladderTower(c, { H: 3000, f: 0.02 }); } });
S('l09x', 'l09', { ...IND, hours: 17.2, cloud: 0.5, fog: 0.0011,
  cam: camK([-120, 60, 150], [-190, 20, 20], 60, [-110, 40, 120], [-190, 24, 20], 58), veg: { r0: 30, rImp: 160, r1: 300 },
  setup(c) { P.industry(c, 1.0, { smokeOpacity: 0.85, night: 0.2 }); P.ladderTower(c, { H: 3000, f: 0.03 }); P.train(c, { s0: 10, speed: 14, wagons: 3 }); } }, 3.9);
// l09b the first train: coal, forty goats, and the Assembly cutting the ribbon from inside
S('l09a', 'l09b', { ...IND, townFilter: clearTown(-128, 26, 40), hours: 12, cloud: 0.4,
  cam: camK([-146, 1.8, 14], [-128, 2.0, 26], 46, [-144, 2.2, 16], [-128, 2.0, 26], 42),
  setup(c) { const pts = [[-70, 26], [-128, 26], [-200, 24]]; P.railway(c, { pts }); P.ribbon(c, [-128, height(-128, 26) + 1.1, 24.5], [-128, height(-128, 26) + 1.1, 27.5], { cutAt: 2.6 }); P.train(c, { pts, s0: -20, speed: 14, wagons: 3, t0: 0 }); for (let i = 0; i < 10; i++) vil(c, i, -140 + (i % 5) * 2, 18 + Math.floor(i / 5) * 2.2, 'cheer', { yawTo: [-128, 26], era: 'stone', phase: i }); } });
S('l09b', 'l09b', { ...IND, townFilter: clearTown(-128, 26, 40), hours: 12, cloud: 0.4,
  cam: camK([-134, 2.2, 21], [-128, 2.0, 26], 34, [-133, 2.4, 22], [-128, 2.0, 26], 30),
  setup(c) { const pts = [[-70, 26], [-128, 26], [-200, 24]]; P.railway(c, { pts }); P.train(c, { pts, s0: -128 + 70 + 12, speed: 1.5, wagons: 3 }); const gz = height(-127, 26); for (let i = 0; i < 5; i++) { const g = c.animal('goat', 4 + i, -121 - i * 1.3, 26 + ((i % 2) - 0.5) * 0.8, 1.57, {}); g.root.position.y = gz + 1.7; c.on((t) => g.animate(t, { speed: 0, phase: i })); } who(c, 'ARU', -123.4, 24.2, 'wave', { yawTo: [-128, 20], y: gz + 1.8 }); } }, 3.0);
S('l09c', 'l09b', { ...IND, townFilter: clearTown(-128, 26, 40), hours: 12, cloud: 0.4,
  cam: camK([-140, 1.6, 12], [-130, 3.0, 22], 50, [-138, 1.8, 13], [-130, 3.0, 22], 46),
  setup(c) { const cr = crowdDisc(c, 90, -134, 20, 1, 8, -128, 26, { seed: 3, colors: [0xffffff, 0xff5a4a, 0x4aa8ff, 0xffd23a] }); for (let i = 0; i < 90; i++) cr.walk[i] = 1; P.confetti(c, -134, height(-134, 20) + 2, 20, 260, { w: 16, d: 12, h: 10 }); } }, 5.4);
// l09c the first strike
S('l09d', 'l09c', { ...IND, hours: 9.5, cloud: 0.4, townFilter: clearTown(-166, 66, 36),
  cam: camK([-156, 1.8, 50], [-166, 2.2, 66], 46, [-158, 2.0, 52], [-166, 2.2, 66], 42),
  setup(c) { P.factory(c, -166, 80, 0.1, { smokeK: (t) => 1 - smk(t, 1, 3) }); for (let i = 0; i < 12; i++) { const x = -176 + (i % 6) * 3.2, z = 62 + Math.floor(i / 6) * 3; vil(c, i * 2, x, z, i % 2 ? 'cheer' : 'raiseHand', { yawTo: [-166, 50], era: 'stone', phase: i }); } for (let i = 0; i < 4; i++) P.sign(c, -174 + i * 4.4, 3.2, 58, 0, 2.6, 1.0, [{ s: ['SHORTER', 'SHIFTS!', 'MORE', 'BREAKS!'][i] + '', size: 150, y: 150 }], { bg: ['#f3e7c8', '#ffd27a', '#f3e7c8', '#ffd27a'][i], face: [-166, 40], posts: true }); } });
S('l09e', 'l09c', { ...IND, hours: 12.5, cloud: 0.4,
  cam: camK([-110, 12, 50], [-168, 14, 70], 54, [-120, 14, 56], [-168, 14, 70], 52), veg: { r0: 30, rImp: 160, r1: 300 },
  setup(c) { P.industry(c, 0.8, { smokeK: (t) => 1 - smk(t, 0.3, 2.8) }); } }, 3.0);
S('l09f', 'l09c', hhX({ hours: 17.0, cloud: 0.4, cam: camK(ST(0, 8, -26), ST(0, 3, 6), 52, ST(0, 5, -18), ST(0, 3, 6), 50),
  setup(c) { const H = hallScene(c, { n: 1, tiers: 9 }); H.seats.filter((_, i) => i % 7 === 0).slice(0, 130).forEach((s, i) => vil(c, i, s[0], s[2], i % 3 === 0 ? 'cheer' : (i % 3 === 1 ? 'talk' : 'point'), { y: s[1], yaw: s[3], phase: i })); } }), 6.2);
function hhX(o) { return { ...T99, townFilter: clearTown(P.P2.hall.x, P.P2.hall.z, 38), veg: { r0: 20 }, ...o }; }
function ST(dx, h, dz) { return [P.P2.hall.x + dx, h, P.P2.hall.z + dz]; }

// l10 smoke goes where the wind goes; the wind goes to the lake (the drifting smoke, then Nuvia under haze)
S('l10a', 'l10', { ...IND, hours: 14.5, cloud: 0.55, fog: 0.0011,
  cam: camK([-250, 28, 130], [-160, 20, 0], 56, [-230, 36, 100], [-160, 20, 0], 56), veg: { r0: 30, rImp: 160, r1: 300 },
  setup(c) { P.industry(c, 1.0, { smokeOpacity: 0.9, wind: [1.5, -10] }); } });
S('l10b', 'l10', { year: 2040, town: false, hours: 14.5, cloud: 0.6, fog: 0.0030, fogTint: [0x8a8478, 0.7],
  cam: camK([-300, 12, NZ + 30], [-330, 6, NZ - 20], 54, [-306, 12, NZ + 26], [-330, 6, NZ - 20], 54), veg: { r0: 20 },
  setup(c) { nuvia(c, 2060, {}); P.smoke(c, -320, 30, NZ + 140, { n: 40, size: 90, rise: 12, life: 12, wind: [-1, -12], color: 0x6a6760, opacity: 0.6, seed: 4 }); } }, 2.2);
// l11 the water turned grey, the fish moved away; Maru was furious
S('l11a', 'l11', { year: 2040, town: false, hours: 13, cloud: 0.6, fog: 0.0026, fogTint: [0x8a8478, 0.7],
  cam: camK([-340, 1.0, NZ + 5], [-340, 0.2, NZ - 6], 38, [-341, 1.1, NZ + 3], [-340, 0.2, NZ - 6], 34), veg: { r0: 10 },
  setup(c) { nuvia(c, 2060, {}); const fr = [...Array(6)].map((_, i) => ({ x: -338 + i * 0.7, z: NZ - 3, ph: i })); const fm = P1fish(c); } });
function P1fish(c) { const fs = []; for (let i = 0; i < 6; i++) { const f = c.proto('fish', 0, -340, NZ - 4, 0, 0.7, 0, { y: -7.2 }); fs.push(f); } c.on((t) => fs.forEach((f, i) => { const x = -340 + (i - 2.5) * 0.9 - t * 1.4 * (1 + i * 0.12), z = NZ - 4 - t * 2.2; f.position.set(x, -7.15 + Math.sin(t * 5 + i) * 0.04, z); f.rotation.y = 3.4 + Math.sin(t * 6 + i) * 0.12; })); return fs; }
portrait('l11b', 'l11', 2.3, 'MARU', { x: -334, z: NZ + 4.5, pose: 'armsCrossed', year: 2040, town: false, hours: 13, cloud: 0.6, fog: 0.0026, fogTint: [0x8a8478, 0.7], r: 3.4, h: 1.3, a0: 4.2, a1: 3.8, fov: 38, th: 1.4, set(c) { nuvia(c, 2060, {}); } });
portrait('l12', 'l12', 0, 'MARU', { x: -334, z: NZ + 4.5, pose: 'speak', year: 2040, town: false, hours: 13.2, cloud: 0.6, fog: 0.0026, fogTint: [0x8a8478, 0.7], r: 3.0, h: 1.4, a0: 4.0, a1: 3.7, fov: 34, th: 1.5, set(c) { nuvia(c, 2060, {}); } });
// l11b sixty goats parked on the tracks; the train stops for six hours
S('l11c', 'l11b', { ...IND, townFilter: clearTown(-230, 30, 20), hours: 11, cloud: 0.4,
  cam: camK([-200, 1.6, 18], [-232, 0.8, 30], 44, [-202, 1.8, 20], [-232, 0.8, 30], 40),
  setup(c) { const pts = [[-120, 26], [-170, 24], [-230, 30], [-300, 6]]; P.railway(c, { pts }); goatFlock(c, [...Array(60)].map((_, i) => ({ x: -236 + (i % 10) * 1.3, z: 28 + Math.floor(i / 10) * 1.0, yaw: 1.3, ph: i })), { seed: 6 }); who(c, 'KUMA', -230, 24, 'armsCrossed', { yawTo: [-232, 30] }); } });
S('l11d', 'l11b', { ...IND, townFilter: clearTown(-230, 30, 20), hours: 11.5, cloud: 0.4,
  cam: camK([-178, 2.2, 22], [-216, 1.5, 28], 46, [-182, 2.4, 22], [-216, 1.5, 28], 42),
  setup(c) { const pts = [[-120, 26], [-170, 24], [-230, 30], [-300, 6]]; P.railway(c, { pts }); P.train(c, { pts, s0: 20, speed: 14, wagons: 2, t0: 0 }); goatFlock(c, [...Array(40)].map((_, i) => ({ x: -226 + (i % 10) * 1.3, z: 28 + Math.floor(i / 10) * 1.0, yaw: 1.3, ph: i })), { seed: 6 }); } }, 2.2);
S('l11e', 'l11b', { ...IND, townFilter: clearTown(-190, 26, 20), hours: 16.5, cloud: 0.4,
  cam: camK([-186, 1.5, 22], [-190, 1.7, 26], 36, [-187, 1.6, 23.2], [-190, 1.7, 26], 30),
  setup(c) { P.railway(c, { pts: [[-120, 26], [-170, 24], [-230, 30]] }); who(c, 'BRAX', -190, 26, 'sit', { yaw: 0.5, p: { seat: 0.45 } }); } }, 4.8);
// l13..l14 the Assembly splits in two; nine votes in two years
S('l13a', 'l13', hhY({ hours: 15, cloud: 0.4, cam: camK(ST(0, 22, -34), ST(0, 3, 6), 52, ST(0, 12, -26), ST(0, 3, 6), 50),
  setup(c) { const H = hallScene(c, { n: 1, tiers: 9 }); const cr = c.crowd(1100, { seed: 4, colors: [0xffffff] }); const rnd = mulberry32(5); const seats = H.seats.slice(); for (let i = 0; i < 1100; i++) { const s = seats[i % seats.length]; cr.set(i, s[0], s[1], s[2], s[3], 0); const left = ((s[0] - P.P2.hall.x) < 0); cr.color(i, left ? 0x1b1b1f : 0x3fae5a); } c.on((t) => cr.update(t)); } }));
S('l13b', 'l13', hhY({ hours: 15.5, cloud: 0.4, cam: camK(ST(0, 2.4, -9), ST(0, 3.0, 8), 50, ST(0, 2.6, -6), ST(0, 3.0, 8), 46),
  setup(c) { const H = hallScene(c, { n: 1, tiers: 9 }); const cr = c.crowd(900, { seed: 4, colors: [0xffffff] }); const seats = H.seats; for (let i = 0; i < 900; i++) { const s = seats[(i * 3) % seats.length]; cr.set(i, s[0], s[1], s[2], s[3], 0); cr.color(i, (s[0] - P.P2.hall.x) < 0 ? 0x1b1b1f : 0x3fae5a); } c.on((t) => cr.update(t)); who(c, 'ARU', H.podium[0], H.podium[2], 'armsOpen', { yaw: 0, y: H.podium[1] }); } }), 3.8);
S('l14a', 'l14', hhY({ hours: 12, hoursFn: (t, d) => 8 + 12 * (t / Math.max(d, 1)), cloud: 0.4, cam: camK(ST(-1.5, 2.2, -9.0), ST(0, 1.5, -3.5), 40, ST(1.5, 2.2, -8.4), ST(0, 1.5, -3.5), 36),
  setup(c) { const H = hallScene(c, { n: 200, tiers: 9 }); const B3 = [[P.P2.hall.x - 2.6, P.P2.hall.z - 3.5], [P.P2.hall.x, P.P2.hall.z - 3.5], [P.P2.hall.x + 2.6, P.P2.hall.z - 3.5]]; voteBowls(c, B3, (t) => [Math.floor(120 + 60 * smk(t, 0, 5)), Math.floor(130 + 55 * smk(t, 0, 5)), Math.floor(30 * smk(t, 0, 5))], { y: H.stage[1], max: 200 });
    P.board(c, P.P2.hall.x, 3.2, P.P2.hall.z + 1, [P.P2.hall.x, P.P2.hall.z - 20], 4.4, 1.4, (g, W, H, t) => { g.fillStyle = '#243049'; g.fillRect(0, 0, W, H); g.fillStyle = '#f7e7b4'; g.font = `900 ${H * 0.48}px Anton, sans-serif`; g.textAlign = 'center'; g.fillText('VOTE #' + Math.min(9, 1 + Math.floor(t * 1.9)), W / 2, H * 0.74); }, { px: 1100 }); } }));
S('l14c', 'l14', hhY({ hours: 3.0, cloud: 0.2, exposure: 1.2, cam: camK(ST(0, 6, -20), ST(0, 3, 6), 50, ST(0, 4, -14), ST(0, 3, 6), 48),
  setup(c) { const H = hallScene(c, { n: 1, tiers: 9 }); H.seats.filter((_, i) => i % 9 === 0).slice(0, 110).forEach((s, i) => vil(c, i, s[0], s[2], i % 2 ? 'sleep' : 'headInHands', { y: s[1], yaw: s[3], phase: i })); } }), 2.8);
// l14b Kuma and Brax: they hated each other, then discovered they both love cheese
duo('l14d', 'l14b', 0, 'KUMA', 'BRAX', { x: PLAZA.x - 3, z: PLAZA.z + 3, yaw: 0.2, gap: 2.2, pa: 'armsCrossed', pb: 'armsCrossed', ...T99, townFilter: clearTown(PLAZA.x, PLAZA.z, 28), hours: 14, cam: [0.8, 1.4, -5.6], cam2: [-0.6, 1.5, -4.6], th: 1.2, fov: 38 });
S('l14e', 'l14b', { ...T99, townFilter: clearTown(PLAZA.x, PLAZA.z, 28), hours: 14.2, cloud: 0.3,
  cam: camK([PLAZA.x - 3.6, 1.4, PLAZA.z - 2.6], [PLAZA.x - 3, 1.3, PLAZA.z + 3], 38, [PLAZA.x - 2.8, 1.5, PLAZA.z - 1.8], [PLAZA.x - 3, 1.3, PLAZA.z + 3], 32), veg: { r0: 20 },
  setup(c) { const A = who(c, 'KUMA', PLAZA.x - 4.1, PLAZA.z + 3, 'hold', { yawTo: [PLAZA.x - 1.9, PLAZA.z + 3] }), B = who(c, 'BRAX', PLAZA.x - 1.9, PLAZA.z + 3, 'hold', { yawTo: [PLAZA.x - 4.1, PLAZA.z + 3] }); for (const [P_, k] of [[A, 0], [B, 1]]) { const w = c.proto('cheeseWheel', 0, 0, 0, 0, 1.0, 0, { y: -99 }); c.on((t) => { P_.R.hd.getWorldPosition(w.position); w.position.y += 0.08; w.rotation.y = k; }); } } }, 4.4);
// l15 they compromised: a handshake
duo('l15', 'l15', 0, 'KUMA', 'BRAX', { x: PLAZA.x - 3, z: PLAZA.z + 3, yaw: 0.2, gap: 1.5, pa: 'handshake', pb: 'handshake', ...T99, townFilter: clearTown(PLAZA.x, PLAZA.z, 28), hours: 15, cam: [0.6, 1.3, -4.2], cam2: [-0.2, 1.4, -3.6], th: 1.2, fov: 36 });
// l16 a dam; clean power; the first electric light
S('l16a', 'l16', { ...T99, townFilter: clearTown(-88, -150, 40), hours: 14, cloud: 0.4,
  cam: camK([-60, 14, -120], [-88, 3, -150], 52, [-70, 10, -126], [-88, 3, -150], 50), veg: { r0: 30, rImp: 160, r1: 300 },
  setup(c) { P.dam(c, -88, -150, 1.5, { L: 70, H: 9 }); for (let i = 0; i < 8; i++) vil(c, i * 3, -100 + (i % 4) * 3, -142 + Math.floor(i / 4) * 3, i % 2 ? 'hammer' : 'carry', { yawTo: [-88, -150], era: 'stone', phase: i }); } });
S('l16b', 'l16', { interior: false, ...IND, hours: 18.4, cloud: 0.2, townFilter: clearTown(WS.x, WS.z, 20),
  cam: camK([WS.x - 3, 1.5, WS.z - 2.5], [WS.x, 2.4, WS.z + 1], 36, [WS.x - 2.2, 1.7, WS.z - 1.5], [WS.x, 2.4, WS.z + 1], 28),
  setup(c) { P.lightbulb(c, WS.x, height(WS.x, WS.z) + 2.6, WS.z + 1, 1.2); who(c, 'BRAX', WS.x - 1.2, WS.z, 'raiseHand', { yawTo: [WS.x, WS.z + 1] }); for (let i = 0; i < 5; i++) vil(c, i, WS.x - 3 + i * 1.5, WS.z - 0.4 + (i % 2) * 1.2, 'cheer', { yawTo: [WS.x, WS.z + 1], era: 'stone', phase: i }); } }, 2.5);
S('l16c', 'l16b', { ...T99, townFilter: clearTown(PLAZA.x, PLAZA.z, 28), hours: 13, cloud: 0.4,
  cam: camK([PLAZA.x - 3, 1.5, PLAZA.z - 5], [PLAZA.x, 2.8, PLAZA.z + 1], 38, [PLAZA.x - 2, 1.6, PLAZA.z - 4], [PLAZA.x, 2.8, PLAZA.z + 1], 34), veg: { r0: 20 },
  setup(c) { P.board(c, PLAZA.x, 2.6, PLAZA.z + 1.5, [PLAZA.x - 6, PLAZA.z - 14], 4.6, 1.6, (g, W, H, t) => { g.fillStyle = '#f3e7c8'; g.fillRect(0, 0, W, H); g.fillStyle = '#3a2a18'; g.font = `900 ${H * 0.5}px Anton, sans-serif`; g.textAlign = 'center'; const txt = t < 1.6 ? 'BRAX DAM' : 'DAM'; g.fillText(txt, W / 2, H * 0.7); if (t >= 1.1 && t < 1.6) { g.strokeStyle = '#d61f2f'; g.lineWidth = H * 0.06; g.beginPath(); g.moveTo(W * 0.1, H * 0.5); g.lineTo(W * 0.9, H * 0.5); g.stroke(); } }, { px: 1100 }); who(c, 'BRAX', PLAZA.x - 2.5, PLAZA.z - 0.5, 'facepalm', { yawTo: [PLAZA.x, PLAZA.z + 1.5] }); who(c, 'ARU', PLAZA.x + 2.5, PLAZA.z - 0.5, 'armsCrossed', { yawTo: [PLAZA.x, PLAZA.z + 1.5] }); } });
// l17 Prima turns on its lamps: a hundred thousand lights at once
const CITYPTS = (() => { const r = mulberry32(31), pts = []; for (let i = 0; i < 700; i++) { const a = r() * 6.28, d = 6 + Math.sqrt(r()) * 120; const x = -10 + Math.cos(a) * d * 1.3, z = 5 + Math.sin(a) * d; pts.push([x, height(x, z) + 2.6, z]); } return pts; })();
const LITE = (t, t0) => clamp01((t - t0) / 1.2);
S('l17a', 'l17', { ...T99, ...NIGHT, cloud: 0.2, fog: 0.0005, cam: camK([-150, 90, -120], [0, 8, 10], 54, [-110, 70, -90], [0, 8, 10], 52), veg: { r0: 30, rImp: 160, r1: 300 },
  setup(c) { P.cityLights(c, CITYPTS, (t) => LITE(t, 1.2), { size: 3.6 }); P.industry(c, 1.0, { night: 0.8, smokeOpacity: 0.5 }); } });
S('l17b', 'l17', { ...T99, ...NIGHT, cloud: 0.2, fog: 0.0005, cam: camK([-30, 4, -34], [0, 6, 0], 56, [-24, 4.4, -28], [0, 6, 0], 52), veg: { r0: 30 },
  setup(c) { const lampsPts = [...Array(20)].map((_, i) => [-18 + (i % 10) * 4, -14 + Math.floor(i / 10) * 14]); P.lamps(c, lampsPts, { on: false }); P.cityLights(c, lampsPts.map(([x, z]) => [x, height(x, z) + 5.1, z]), (t) => LITE(t, 0.8), { size: 7 }); } }, 2.0);
S('l17c', 'l17', { ...T99, ...NIGHT, cloud: 0.2, fog: 0.0004, cam: camK([-160, 130, -150], [0, 10, 10], 50, [-120, 100, -110], [0, 10, 10], 50), veg: { r0: 30, rImp: 160, r1: 300 },
  setup(c) { P.cityLights(c, CITYPTS, () => 1, { size: 3.6 }); P.industry(c, 1.0, { night: 0.9, smokeOpacity: 0.5 }); P.ladderTower(c, { H: 3000, f: 0.04 }); } }, 5.0);
// l18..l19 the Ladder keeps growing; they called it the Ladder
S('l18', 'l18', { ...IND, hours: 16.5, cloud: 0.4, fog: 0.0004, cam: camK([360, 60, -420], [-214, 520, 8], 54, [300, 90, -380], [-214, 700, 8], 54), veg: { r0: 30, rImp: 160, r1: 300 },
  setup(c) { P.industry(c, 1.0, { smokeOpacity: 0.7 }); P.ladderTower(c, { H: 3000, f: (t) => 0.04 + 0.5 * smk(t, 0, 5), beaconAlways: true }); } });
S('l19', 'l19', { ...IND, hours: 17, cloud: 0.4, cam: camK([LD.x + 30, 2.4, LD.z - 40], [LD.x + 4, 22, LD.z], 56, [LD.x + 22, 3.0, LD.z - 32], [LD.x + 4, 30, LD.z], 56),
  setup(c) { P.ladderTower(c, { H: 3000, f: 0.1, beaconAlways: true }); P.sign(c, LD.x + 40, 3.6, LD.z - 36, 0, 8, 3.0, [{ s: 'THE LADDER', size: 260, y: 256, color: '#fff' }], { bg: '#1e4a7a', face: [LD.x + 80, LD.z - 90], posts: true, border: '#fff' }); who(c, 'BRAX', LD.x + 36, LD.z - 36, 'cheer', { yawTo: [LD.x + 60, LD.z - 70] }); } });
S('l19b', 'l19b', { ...IND, hours: 19.0, cloud: 0.2, cam: camK([LD.x + 90, 2.4, LD.z - 90], [LD.x, 120, LD.z], 60, [LD.x + 70, 3.0, LD.z - 70], [LD.x, 200, LD.z], 60),
  setup(c) { P.ladderTower(c, { H: 3000, f: 0.3, beaconAlways: true }); for (let i = 0; i < 6; i++) c.fire(LD.x + 50 + i * 2, LD.z - 20 + i * 3, { size: 0.6, n: 10, light: false }); } });
S('l19c', 'l19b', { ...IND, hours: 19.0, cloud: 0.2, cam: camK([LD.x + 6, 1.6, LD.z - 22], [LD.x + 1, 2.8, LD.z - 14], 48, [LD.x + 4, 1.8, LD.z - 20], [LD.x + 1, 2.8, LD.z - 14], 40),
  setup(c) { P.ladderTower(c, { H: 140, Wb: 14, Wt: 3, f: 1, levels: 14 }); for (let i = 0; i < 5; i++) { const b = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.2, 0.2, 10), new THREE.MeshStandardMaterial({ color: 0xc98f4a })); b.position.set(LD.x - 3 + i * 1.4, height(LD.x, LD.z - 14) + 0.4, LD.z - 14 + (i % 2)); c.add(b); } for (let i = 0; i < 4; i++) vil(c, i * 5, LD.x - 4 + i * 2.4, LD.z - 17, 'kneelPray', { yawTo: [LD.x, LD.z - 14], era: 'stone', phase: i }); } }, 2.8);
// l20 it touched the clouds
S('l20a', 'l20', { ...IND, hours: 17.4, cloud: 0.7, cam: camK([LD.x + 20, 3, LD.z - 60], [LD.x, 1500, LD.z], 62, [LD.x + 20, 1800, LD.z - 60], [LD.x, 2400, LD.z], 62),
  setup(c) { P.ladderTower(c, { H: 3000, f: 1, beaconAlways: true }); P.cloudSea(c, 2250, 2600, 120); } });
S('l20b', 'l20', { ...IND, hours: 17.4, cloud: 0.7, cam: camK([LD.x + 600, 1000, LD.z - 1600], [LD.x, 1500, LD.z], 50, [LD.x + 500, 1500, LD.z - 1300], [LD.x, 2500, LD.z], 50), veg: { r0: 30, rImp: 160, r1: 300 },
  setup(c) { P.ladderTower(c, { H: 3000, f: 1, beaconAlways: true }); P.cloudSea(c, 2250, 2600, 120); } }, 2.2);
function hhY(o) { return { ...T99, townFilter: clearTown(P.P2.hall.x, P.P2.hall.z, 38), veg: { r0: 20 }, ...o }; }
