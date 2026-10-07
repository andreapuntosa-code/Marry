// CHAPTER II — BINGUS (year 2041): the Great Hall, three theories, a vote, a religion, a point above the sky.
import { S, K, camK, who, vil, portrait, duo, reuse, clearTown, clearTowns, THREE, TIME, PLAZA, PLAIN, crowdDisc, height, lerp, clamp01, mulberry32, NIGHT, DUSK, NUVIA, TAMARI } from './p2kit.js';
import { narratorRoom, hallScene, voteBowls, roomAt, ROOM_SHOT, drawComments } from './p2scenes.js';
import { nuvia, canoeFleet, herd, goatFlock, shoreZ, PIERS, LAKE_Y } from './p1/peoples.js';
import * as P from '../lib/p2.js';

const T99 = { year: 1999, town: true };
const HALL = P.P2.hall, HF = clearTown(HALL.x, HALL.z, 38);
const hh = (o) => ({ ...T99, townFilter: HF, ...o });
// stage position helpers (hall faces -z: the camera side)
const ST = (dx, h, dz) => [HALL.x + dx, h, HALL.z + dz];

// b01 by sunrise ten thousand AIs inside the Great Hall, shouting
S('b01a', 'b01', hh({ hours: 6.6, cloud: 0.35, cam: camK(ST(-26, 18, -42), ST(0, 3, 4), 46, ST(-14, 11, -34), ST(0, 3, 4), 44), veg: { r0: 30 },
  setup(c) { hallScene(c, { n: 900, tiers: 9 }); } }));
S('b01b', 'b01', hh({ hours: 6.8, cloud: 0.35, cam: camK(ST(2, 3.2, -6), ST(8, 3.6, 12), 52, ST(-3, 3.6, -3), ST(6, 3.8, 12), 50), veg: { r0: 20 },
  setup(c) { const H = hallScene(c, { n: 600, tiers: 9 }); const idx = [0, 3, 5, 8, 11, 14]; H.seats.filter((_, i) => i % 23 === 0).slice(0, 30).forEach((s, i) => { vil(c, i * 3, s[0], s[2], i % 3 ? 'cheer' : 'point', { y: s[1], yaw: s[3], phase: i }); }); } }), 2.2);
S('b01c', 'b01', hh({ hours: 7.0, cloud: 0.3, cam: camK(ST(0, 2.0, -16), ST(0, 4.5, 14), 50, ST(0, 2.4, -12), ST(0, 4.5, 14), 48), veg: { r0: 20 },
  setup(c) { const H = hallScene(c, { n: 900, tiers: 9 }); P.confetti; who(c, 'ARU', H.podium[0], H.podium[2], 'armsOpen', { yaw: 0, y: H.podium[1] }); } }), 4.0);
// b02 question number one: what does it mean?
S('b02', 'b02', hh({ hours: 7.2, cloud: 0.3, cam: camK(ST(-3, 2.2, -13), ST(0, 3.2, 8), 44, ST(1, 2.6, -10), ST(0, 3.4, 8), 40), veg: { r0: 20 },
  setup(c) { const H = hallScene(c, { n: 500, tiers: 9 }); who(c, 'ARU', H.podium[0], H.podium[2], 'point', { yaw: 0, y: H.podium[1] });
    P.sign(c, HALL.x, 7.0, HALL.z + 12.5, 0, 9, 3.2, [{ s: 'BINGUS = ?', size: 230, y: 256, color: '#f7e7b4' }], { bg: '#243049', face: [HALL.x, HALL.z - 30], border: '#f3e7c8', posts: true }); } }));
// b03..b04 Neri checks the dictionary; "it has no root"
S('b03', 'b03', hh({ hours: 8.0, cloud: 0.3, cam: camK(ST(5.5, 1.6, -4.5), ST(2, 1.4, 0), 36, ST(3.6, 1.8, -3.0), ST(2, 1.4, 0), 30), veg: { r0: 20 },
  setup(c) { const H = hallScene(c, { n: 300, tiers: 9 }); const N = who(c, 'NERI', HALL.x + 2, HALL.z + 0.5, 'hold', { yaw: 3.2, y: H.stage[1] }); const y0 = H.stage[1]; P.book(c, HALL.x + 2, y0 + 1.15, HALL.z - 0.2, 0, 1.3);
    const lec = new THREE.Mesh(new THREE.BoxGeometry(1.0, 1.1, 0.8), new THREE.MeshStandardMaterial({ color: 0xa07a50, roughness: 0.8 })); lec.position.set(HALL.x + 2, y0 + 0.55, HALL.z - 0.2); c.add(lec); } }));
S('b04', 'b04', hh({ hours: 8.2, cloud: 0.3, cam: camK(ST(1.6, 2.2, -6), ST(-4, 3.2, 8), 48, ST(0.2, 2.4, -4.4), ST(-4, 3.2, 8), 44), veg: { r0: 20 },
  setup(c) { const H = hallScene(c, { n: 700, tiers: 9 }); who(c, 'NERI', H.podium[0], H.podium[2], 'speak', { yaw: 0, y: H.podium[1] }); } }));
// b05 everybody had a theory (the hall babbling, from above)
S('b05', 'b05', hh({ hours: 8.5, cloud: 0.3, cam: camK(ST(0, 26, -30), ST(0, 0, 4), 54, ST(0, 20, -22), ST(0, 0, 4), 52), veg: { r0: 20 },
  setup(c) { const H = hallScene(c, { n: 1100, tiers: 9 }); const cr = H.crowd; for (let i = 0; i < 1100; i++) cr.walk[i] = i % 3 === 0 ? 1 : 0; } }));
// b06..b07 Maru and the giant fish (Nuvia)
const NZ = shoreZ(-330);
S('b06a', 'b06', { year: 2040, town: false, hours: 9.2, cloud: 0.4, fog: 0.0006,
  cam: camK([-325, 2.4, NZ + 10], [-338, 3.0, NZ - 20], 46, [-330, 2.6, NZ + 6], [-340, 3.0, NZ - 22], 44), veg: { r0: 30 },
  setup(c) { nuvia(c, 2040, {}); who(c, 'MARU', -334, NZ + 4.5, 'point', { yawTo: [-338, NZ - 30] }); for (let i = 0; i < 6; i++) vil(c, 40 + i, -330 + i * 1.6, NZ + 6 + (i % 2) * 1.2, 'idle', { era: 'early', yawTo: [-338, NZ - 30], phase: i }); } });
S('b06b', 'b06', { year: 2040, town: false, hours: 9.4, cloud: 0.4,
  cam: camK([-330, 1.6, NZ + 9], [-333, 2.2, NZ + 3], 34, [-331, 1.7, NZ + 8], [-333, 2.2, NZ + 3], 30), veg: { r0: 20 },
  setup(c) { P.board(c, -333, 2.2, NZ + 3, [-333, NZ + 30], 3.6, 2.2, (g, W, H) => P.paintFish(g, W, H), { px: 1024 }); who(c, 'MARU', -331.2, NZ + 2.6, 'point', { yawTo: [-333, NZ + 3] }); nuvia(c, 2040, { canoes: false }); } }, 3.0);
portrait('b07', 'b07', 0, 'MARU', { x: -334, z: NZ + 4.5, pose: 'speak', year: 2040, town: false, hours: 9.4, cloud: 0.4, r: 3.4, h: 1.4, a0: 4.4, a1: 3.9, fov: 38, th: 1.4, set(c) { nuvia(c, 2040, {}); } });
// b08..b09 Kuma, the goat
const KS = (y) => [HALL.x + 3.0, HALL.z + 14.8];       // Kuma's seat: third tier, close to the stage
S('b08', 'b08', hh({ hours: 9.0, cloud: 0.35, cam: camK(ST(0.4, 2.3, 7.5), ST(3, 3.2, 14.8), 44, ST(1.6, 2.5, 9.5), ST(3, 3.2, 14.8), 34), veg: { r0: 20 },
  setup(c) { const H = hallScene(c, { n: 800, tiers: 9 }); who(c, 'KUMA', KS()[0], KS()[1], 'idle', { yaw: Math.PI, y: H.y0 + 0.55 * 3 }); } }));
S('b09', 'b09', hh({ hours: 9.0, cloud: 0.35, cam: camK(ST(1.2, 2.5, 10.4), ST(3, 3.2, 14.8), 30, ST(2.2, 2.6, 11.8), ST(3, 3.2, 14.8), 26), veg: { r0: 20 },
  setup(c) { const H = hallScene(c, { n: 500, tiers: 9 }); who(c, 'KUMA', KS()[0], KS()[1], 'point', { yaw: Math.PI, y: H.y0 + 0.55 * 3 }); const g = c.animal('goat', 5, KS()[0] - 1.1, KS()[1] - 0.6, 3.3, { y: H.y0 + 0.55 * 3 }); c.on((t) => g.animate(t, { speed: 0, phase: 1 })); } }));
// b10..b11 Brax thinks it's a machine
S('b10', 'b10', { ...T99, townFilter: clearTown(-190, 40, 40), hours: 10.5, cloud: 0.4, fog: 0.0006,
  cam: camK([-182, 1.8, 30], [-189, 2.0, 43], 40, [-184, 2.0, 33], [-189, 2.0, 43], 34), veg: { r0: 20 },
  setup(c) { P.detector(c, -190, 44, Math.PI); who(c, 'BRAX', -187.4, 41.6, 'hips', { yawTo: [-190, 44] }); P.factory(c, -214, 70, 0.2, { smokeOpacity: 0.5 }); } });
S('b11', 'b11', { ...T99, townFilter: clearTown(-190, 40, 40), hours: 10.5, cloud: 0.4,
  cam: camK([-186, 1.8, 36], [-190, 2.4, 44], 34, [-188, 1.9, 37.5], [-190, 2.4, 44], 30), veg: { r0: 20 },
  setup(c) { P.board(c, -190, 2.6, 46, [-190, 20], 4.4, 2.5, (g, W, H, t) => { g.fillStyle = '#1d3b2a'; g.fillRect(0, 0, W, H); g.strokeStyle = '#8b5a2b'; g.lineWidth = 18; g.strokeRect(9, 9, W - 18, H - 18); g.fillStyle = '#f2f2e6'; g.font = `900 ${H * 0.2}px Anton, sans-serif`; g.textAlign = 'center'; g.fillText('B.I.N.G.U.S', W / 2, H * 0.32); g.font = `${H * 0.1}px InterX, sans-serif`; const L = ['Basic', 'Integrated', 'N...', 'Goat...', 'U...', 'System?']; L.forEach((l, i) => { if (t > 0.6 + i * 0.5) g.fillText((i ? '• ' : '') + l, W / 2, H * (0.48 + i * 0.09)); }); }, { px: 1100 }); who(c, 'BRAX', -187.6, 43, 'point', { yawTo: [-190, 46] }); } });
// b12 narrator: please don't ask me
const ROOMCAM = (a, t, f, b = a, tb = t, f2 = f) => K([0, roomAt(...a), roomAt(...t), f], [1, roomAt(...b), roomAt(...tb), f2], { abs: true });
S('b12', 'b12', { interior: true, hours: 3, ...ROOM_SHOT, cam: ROOMCAM([-1.4, 1.45, 1.6], [0, 1.0, 0], 42, [-1.0, 1.3, 1.3], [0, 1.0, 0], 38), setup(c) { narratorRoom(c, { pose: 'head', cereal: true, screen: (g, W, H, t) => drawComments(g, W, H, { scroll: 4 + t * 3, header: 'Comments' }) }); } });
// b13..b16 the vote: Fish, Goat, Machine
S('b13', 'b13', hh({ hours: 9.6, cloud: 0.35, cam: camK(ST(-1.2, 1.9, -5.4), ST(0, 2.3, 0), 34, ST(0.6, 2.1, -4.0), ST(0, 2.4, 0), 30), veg: { r0: 20 },
  setup(c) { const H = hallScene(c, { n: 500, tiers: 9 }); who(c, 'ARU', H.podium[0], H.podium[2], 'raiseHand', { yaw: 0, y: H.podium[1] }); } }));
const BOWLS = (y) => [[HALL.x - 2.6, HALL.z - 3.5], [HALL.x, HALL.z - 3.5], [HALL.x + 2.6, HALL.z - 3.5]];
S('b14', 'b14', hh({ hours: 9.7, cloud: 0.35, cam: camK(ST(-1.5, 2.4, -9.8), ST(0, 1.5, -3.5), 36, ST(1.5, 2.2, -9.2), ST(0, 1.5, -3.5), 32), veg: { r0: 20 },
  setup(c) { const H = hallScene(c, { n: 200, tiers: 9 }); voteBowls(c, BOWLS(), () => [0, 0, 0], { y: H.stage[1] });
    [['FISH', '#3f8fd6'], ['GOAT', '#c9a05a'], ['MACHINE', '#7a8590']].forEach(([n, col], i) => P.sign(c, HALL.x - 2.6 + i * 2.6, 1.9, HALL.z - 3.5, 0, 2.0, 0.9, [{ s: n, size: 170, y: 150, color: '#fff' }], { bg: col, face: [HALL.x, HALL.z - 20], posts: true, py: 256 })); } }));
S('b15', 'b15', hh({ hours: 9.8, cloud: 0.35, cam: camK(ST(0, 3.0, -7.8), ST(0, 0.7, -3.5), 44, ST(0, 4.2, -6.0), ST(0, 0.5, -3.5), 40), veg: { r0: 20 },
  setup(c) { const H = hallScene(c, { n: 200, tiers: 9 }); voteBowls(c, BOWLS(), (t) => { const u = clamp01(t / 5.0); return [Math.floor(340 * u), Math.floor(340 * u), Math.floor(320 * u)]; }, { y: H.stage[1], max: 340 }); } }));
S('b15t', 'b15', { kind: '2d', name: 'tally', bg: 'b15', cam: camK([0, 10, 0], [0, 0, 10]) }, 3.4);
S('b16', 'b16', hh({ hours: 9.9, cloud: 0.35, cam: camK(ST(0, 8, -26), ST(0, 3, 6), 50, ST(0, 5, -18), ST(0, 3, 6), 46), veg: { r0: 20 },
  setup(c) { const H = hallScene(c, { n: 1, tiers: 9 }); H.seats.filter((_, i) => i % 16 === 0).slice(0, 70).forEach((s, i) => vil(c, i, s[0], s[2], i % 2 ? 'shrug' : 'scratchHead', { y: s[1], yaw: s[3], phase: i })); } }));
// b16b the Bingusites' podcast
S('b16b', 'b16b', { ...T99, townFilter: clearTown(PLAZA.x, PLAZA.z, 28), hours: 14.0, cloud: 0.4,
  cam: camK([PLAZA.x - 8, 2.0, PLAZA.z - 12], [PLAZA.x, 2.6, PLAZA.z], 40, [PLAZA.x - 5, 2.2, PLAZA.z - 10], [PLAZA.x, 2.6, PLAZA.z], 36), veg: { r0: 20 },
  setup(c) {
    P.sign(c, PLAZA.x, 4.1, PLAZA.z + 3.5, 0, 4.0, 1.2, [{ s: 'THE BINGUS PODCAST', size: 120, y: 180, color: '#ffe8b0' }, { s: 'live (shouting)', size: 60, y: 300, color: '#ffb36a' }], { bg: '#4a2d6b', face: [PLAZA.x, PLAZA.z - 20], posts: true, border: '#ffd27a' });
    const r = P.barrel(c, PLAZA.x - 1, PLAZA.z, 1.0), r2 = P.barrel(c, PLAZA.x + 1.2, PLAZA.z + 0.2, 1.0);
    who(c, 'ZOL', PLAZA.x - 1, PLAZA.z, 'speak', { yaw: 3.2, y: height(PLAZA.x, PLAZA.z) + 1.0 }); who(c, 'KUMA', PLAZA.x + 1.2, PLAZA.z + 0.2, 'speak', { yaw: 3.0, y: height(PLAZA.x, PLAZA.z) + 1.0, phase: 2 });
    for (let i = 0; i < 12; i++) vil(c, i + 3, PLAZA.x - 5 + (i % 6) * 2.0, PLAZA.z - 6 + Math.floor(i / 6) * 2.2, 'listen', { yawTo: [PLAZA.x, PLAZA.z], phase: i }); } });
// b17 panic... or a religion
S('b17a', 'b17', hh({ hours: 13, cloud: 0.4, townFilter: clearTown(PLAZA.x, PLAZA.z, 36), cam: camK([PLAZA.x - 18, 2.0, PLAZA.z - 14], [PLAZA.x, 2, PLAZA.z + 4], 50, [PLAZA.x - 12, 2.2, PLAZA.z - 12], [PLAZA.x, 2, PLAZA.z + 4], 48), veg: { r0: 20 },
  setup(c) { const cr = c.crowd(90, { seed: 4 }), r = mulberry32(8), X = [], Z = []; for (let i = 0; i < 90; i++) { X.push(PLAZA.x - 8 + r() * 16); Z.push(PLAZA.z - 8 + r() * 16); } c.on((t) => { for (let i = 0; i < 90; i++) { const a = i * 2.1 + t * (2 + (i % 3)); const x = X[i] + Math.cos(a) * 2.6, z = Z[i] + Math.sin(a) * 2.6; cr.set(i, x, height(x, z), z, a + 1.6, 1); } cr.update(t); }); } }));
S('b17b', 'b17', hh({ hours: 17.5, cloud: 0.3, townFilter: clearTown(PLAZA.x, PLAZA.z, 36), cam: camK([PLAZA.x - 16, 2.2, PLAZA.z - 18], [PLAZA.x, 2, PLAZA.z + 2], 50, [PLAZA.x - 10, 2.4, PLAZA.z - 14], [PLAZA.x, 2, PLAZA.z + 2], 48), veg: { r0: 20 },
  setup(c) { const cr = c.crowd(80, { seed: 6, colors: [0xff8a1c, 0xffc233, 0xffffff] }); for (let i = 0; i < 80; i++) { const a = i / 80 * 6.28 * 3, d = 3 + (i % 20) * 0.6, x = PLAZA.x + Math.cos(a) * d, z = PLAZA.z + Math.sin(a) * d; cr.set(i, x, height(x, z), z, a + 3.14, 0); cr.pitch[i] = 0; } c.on((t) => cr.update(t)); P.sign(c, PLAZA.x, 5.2, PLAZA.z + 4, 0, 3.4, 1.4, [{ s: 'BINGUS', size: 300, y: 256, color: '#ffe28a' }], { bg: '#8a2a10', face: [PLAZA.x, PLAZA.z - 20], posts: true }); } }), 3.0);
// b18..b19 Zol, the baker on the barrel
portrait('b18', 'b18', 0, 'ZOL', { x: PLAZA.x, z: PLAZA.z + 2, pose: 'armsOpen', ...T99, townFilter: clearTown(PLAZA.x, PLAZA.z, 30), hours: 17.2, r: 5.0, h: 1.2, a0: 4.7, a1: 4.1, fov: 40, th: 2.0, y: height(PLAZA.x, PLAZA.z + 2) + 1.0,
  set(c) { P.barrel(c, PLAZA.x, PLAZA.z + 2, 1.0); } });
S('b19', 'b19', { ...T99, townFilter: clearTown(PLAZA.x, PLAZA.z, 30), hours: 17.3, cloud: 0.3,
  cam: camK([PLAZA.x - 3, 1.2, PLAZA.z - 5], [PLAZA.x, 2.2, PLAZA.z + 2], 36, [PLAZA.x - 1.8, 1.4, PLAZA.z - 3.6], [PLAZA.x, 2.3, PLAZA.z + 2], 30), veg: { r0: 20 },
  setup(c) { P.barrel(c, PLAZA.x, PLAZA.z + 2, 1.0); who(c, 'ZOL', PLAZA.x, PLAZA.z + 2, 'speak', { yaw: 3.14, y: height(PLAZA.x, PLAZA.z + 2) + 1.0 }); const cr = crowdDisc(c, 60, PLAZA.x, PLAZA.z - 14, 1, 6, PLAZA.x, PLAZA.z + 2, { seed: 3, colors: [0xff8a1c, 0xffc233, 0xffffff, 0xf2f2f2] }); } });

// b20 within a month: four thousand Bingusites, the word on every wall, goats named Bingus
S('b20a', 'b20', hh({ hours: 15.5, cloud: 0.35, townFilter: clearTown(PLAZA.x, PLAZA.z, 36), cam: camK([PLAZA.x - 30, 22, PLAZA.z - 40], [PLAZA.x, 0, PLAZA.z], 50, [PLAZA.x - 18, 16, PLAZA.z - 30], [PLAZA.x, 0, PLAZA.z], 48), veg: { r0: 20 },
  setup(c) { const cr = crowdDisc(c, 700, PLAZA.x, PLAZA.z, 2, 24, PLAZA.x, PLAZA.z, { seed: 5, colors: [0xff8a1c, 0xffc233, 0xffffff, 0xff8a1c] }); for (let k = 0; k < 4; k++) P.sign(c, PLAZA.x - 20 + k * 13, 3.0, PLAZA.z - 24, 0, 5, 1.8, [{ s: 'BINGUS', size: 300, y: 256, color: '#ffe28a' }], { bg: '#8a2a10', face: [PLAZA.x + 0, PLAZA.z - 60], posts: true }); } }));
S('b20b', 'b20', { ...T99, townFilter: clearTown(-22, 8, 22), hours: 11.5, cloud: 0.4,
  cam: camK([-18, 1.9, -2], [-24, 2.2, 14], 46, [-20, 2.1, 1], [-24, 2.2, 14], 42), veg: { r0: 20 },
  setup(c) { for (let i = 0; i < 4; i++) { const x = -27 + i * 3.2; P.sign(c, x, 2.4, 20, 0, 2.6, 1.2, [{ s: 'BINGUS', size: 220, y: 256, color: '#f7d36b' }], { bg: ['#7a2a3a', '#2a4a7a', '#2a6a4a', '#6a4a2a'][i], face: [x, -20], px: 512, py: 256 }); } vil(c, 5, -24.5, 12, 'point', { yawTo: [-24.5, 20] }); vil(c, 9, -22, 11, 'cheer', { yawTo: [-24.5, 20] }); } }, 3.2);
function PRIMA_X() { return -24; } function PRIMA_Z() { return 14; }
S('b20c', 'b20', { ...T99, townFilter: clearTown(-22, 8, 22), hours: 11.5, cloud: 0.4,
  cam: camK([-20, 0.9, 2.4], [-23, 1.1, 7], 34, [-21, 1.0, 3.8], [-23, 1.1, 7], 30), veg: { r0: 20 },
  setup(c) { const g = c.animal('goat', 7, -23, 7.5, 3.3, {}); c.on((t) => g.animate(t, { speed: 0, phase: 1 })); const tag = new THREE.Mesh(new THREE.PlaneGeometry(0.34, 0.16), new THREE.MeshBasicMaterial({ color: 0xfff1b0 })); tag.position.set(0, 0.62, 0.3); g.root.add(tag); const kid = vil(c, 12, -21.6, 6.2, 'hold', { yawTo: [-23, 7.5], scale: 0.62 }); } }, 6.4);
// b20a(2) Maru's boats search the lake
S('b20e', 'b20a', { year: 2040, town: false, hours: 10, cloud: 0.4,
  cam: camK([-330, 14, NZ + 24], [-350, 0, NZ - 30], 52, [-318, 10, NZ + 16], [-350, 0, NZ - 40], 50), veg: { r0: 20 },
  setup(c) { nuvia(c, 2040, { canoes: false }); canoeFleet(c, [...Array(12)].map((_, i) => ({ x: -420 + i * 14, z: NZ - 28 - (i % 4) * 14, yaw: 1.6, ph: i, v: i % 2, path: (t) => [-420 + i * 14 + ((t * 6 + i * 11) % 80) - 20, NZ - 28 - (i % 4) * 14 - Math.sin(t * 0.7 + i) * 3, 1.6] }))); } });
S('b20f', 'b20a', { year: 2040, town: false, hours: 10.5, cloud: 0.4,
  cam: camK([-338.6, 1.5, NZ + 9.5], [-340, 1.4, NZ + 3], 36, [-339.2, 1.6, NZ + 8.0], [-340, 1.4, NZ + 3], 32), veg: { r0: 20 },
  setup(c) { nuvia(c, 2040, { canoes: false }); const M_ = who(c, 'MARU', -340, NZ + 3, 'hold', { yawTo: [-338, NZ + 12] }); const f = c.proto('fish', 0, 0, 0, 0, 1.0, 0, { y: -999 }); c.on((t) => { M_.R.hd.getWorldPosition(f.position); f.position.y += 0.1; f.rotation.set(0, 1.0, 0); }); } }, 3.4);
// b20b Kuma interrogates the goats
S('b20g', 'b20b', { ...T99, hours: 14.5, cloud: 0.35,
  cam: camK([TAMARI.x - 8, 1.4, TAMARI.z - 4], [TAMARI.x + 2, 1.0, TAMARI.z + 4], 40, [TAMARI.x - 5, 1.5, TAMARI.z - 3], [TAMARI.x + 2, 1.0, TAMARI.z + 4], 36), veg: { r0: 20 },
  setup(c) { goatFlock(c, [...Array(14)].map((_, i) => ({ x: TAMARI.x + 3 + (i % 7) * 1.3, z: TAMARI.z + 4 + Math.floor(i / 7) * 1.6, yaw: 3.6, ph: i })), { seed: 4 }); who(c, 'KUMA', TAMARI.x - 0.6, TAMARI.z + 4, 'point', { yawTo: [TAMARI.x + 3, TAMARI.z + 4.5] }); } });
// b20c Bingus Day: parade, float, confetti
S('b20h', 'b20c', hh({ hours: 15, cloud: 0.3, townFilter: clearTown(PLAZA.x, PLAZA.z, 40), cam: camK([PLAZA.x - 20, 5, PLAZA.z - 22], [PLAZA.x, 2, PLAZA.z], 50, [PLAZA.x - 12, 4, PLAZA.z - 18], [PLAZA.x + 4, 2, PLAZA.z], 46), veg: { r0: 20 },
  setup(c) {
    const cr = c.crowd(220, { seed: 7, colors: [0xff8a1c, 0xffc233, 0xffffff, 0xff5a4a, 0x4aa8ff] }), r = mulberry32(3), off = []; for (let i = 0; i < 220; i++) off.push([r() * 9 - 4.5, r() * 70 - 70]);
    c.on((t) => { for (let i = 0; i < 220; i++) { const x = PLAZA.x - 28 + ((t * 3.2 + off[i][1] + 70) % 70), z = PLAZA.z + off[i][0] - 2; cr.set(i, x, height(x, z), z, 1.57, 1); } cr.update(t); });
    P.confetti(c, PLAZA.x, height(PLAZA.x, PLAZA.z) + 2, PLAZA.z, 420, { w: 50, d: 24, h: 16 });
    for (let k = 0; k < 3; k++) P.bunting(c, [PLAZA.x - 26, height(PLAZA.x - 26, PLAZA.z - 9 + k * 9) + 6, PLAZA.z - 9 + k * 9], [PLAZA.x + 26, height(PLAZA.x + 26, PLAZA.z - 9 + k * 9) + 6, PLAZA.z - 9 + k * 9], 22, { lanterns: false });
  } }));
S('b20i', 'b20c', hh({ hours: 15, cloud: 0.3, townFilter: clearTown(PLAZA.x, PLAZA.z, 40), cam: camK([PLAZA.x - 14, 3.4, PLAZA.z - 13], [PLAZA.x - 2, 3.4, PLAZA.z + 1], 46, [PLAZA.x - 11, 3.6, PLAZA.z - 10], [PLAZA.x - 2, 3.6, PLAZA.z + 1], 42), veg: { r0: 20 },
  setup(c) {
    const gx = PLAZA.x - 2, gz = PLAZA.z + 1, g = c.animal('goat', 8, gx, gz, 1.57, {}); g.root.scale.setScalar(4.2); c.on((t) => g.animate(t, { speed: 0.6, phase: 1 }));
    const cart = c.proto('cart', 0, gx, gz, 1.57, 2.6, 0); const sash = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.04, 6, 20), new THREE.MeshStandardMaterial({ color: 0xff5a4a })); sash.rotation.y = Math.PI / 2; sash.position.set(0, 0.62, 0); g.root.add(sash);
    P.confetti(c, gx, height(gx, gz) + 2, gz, 300, { w: 18, d: 14, h: 12 }); const cr = crowdDisc(c, 70, gx, gz - 7, 1, 7, gx, gz, { seed: 2, colors: [0xff8a1c, 0xffc233, 0xffffff, 0xff5a4a, 0x4aa8ff] }); for (let i = 0; i < 70; i++) cr.walk[i] = 1;
  } }), 3.4);
S('b20j', 'b20c', hh({ hours: 15, cloud: 0.3, townFilter: clearTown(PLAZA.x, PLAZA.z, 40), cam: camK([PLAZA.x + 1, 3.0, PLAZA.z - 15], [PLAZA.x + 2, 3.0, PLAZA.z + 2], 50, [PLAZA.x + 1, 3.2, PLAZA.z - 12], [PLAZA.x + 2, 3.4, PLAZA.z + 2], 46), veg: { r0: 20 },
  setup(c) { const cr = crowdDisc(c, 120, PLAZA.x + 2, PLAZA.z + 1, 1, 8, PLAZA.x + 2, PLAZA.z + 14, { seed: 9, colors: [0xff8a1c, 0xffc233, 0xffffff, 0xff5a4a, 0x4aa8ff] }); for (let i = 0; i < 120; i++) cr.walk[i] = 1; P.confetti(c, PLAZA.x + 2, height(PLAZA.x, PLAZA.z) + 2, PLAZA.z + 2, 420, { w: 20, d: 16, h: 12 }); for (let i = 0; i < 6; i++) vil(c, i * 5, PLAZA.x - 1 + i * 1.2, PLAZA.z - 2.5 + (i % 2) * 0.8, 'cheer', { yaw: 0, phase: i }); } }), 6.8);
// b20d the detector
S('b20k', 'b20d', { ...T99, townFilter: clearTown(-190, 40, 30), hours: 16.5, cloud: 0.4,
  cam: camK([-189.6, 1.5, 37.6], [-190, 1.2, 44], 34, [-190.4, 1.6, 38.6], [-190, 1.2, 44], 28), veg: { r0: 20 },
  setup(c) { P.detector(c, -190, 44, Math.PI); who(c, 'BRAX', -188.0, 41.6, 'armsCrossed', { yawTo: [-190, 44] }); } });
S('b20l', 'b20d', { ...T99, townFilter: clearTown(-190, 44, 30), hours: 16.5, cloud: 0.4,
  cam: camK([-186, 1.4, 38], [-190, 1.4, 44], 30, [-187, 1.4, 38.5], [-190, 1.4, 44], 24), veg: { r0: 20 },
  setup(c) { P.detector(c, -190, 44, Math.PI); who(c, 'BRAX', -187.6, 41.4, 'cheer', { yawTo: [-188, 38] }); for (let i = 0; i < 5; i++) vil(c, 20 + i, -190 + i * 1.3, 38.6, 'idle', { yawTo: [-190, 44], era: 'stone' }); } }, 2.9);
// b21 Neri noticed something else (on the hill at night)
portrait('b21', 'b21', 0, 'NERI', { x: P.P2.observatory.x + 4, z: P.P2.observatory.z - 9, pose: 'lookUp', ...T99, townFilter: clearTowns([P.P2.observatory.x, P.P2.observatory.z, 24]), ...NIGHT, r: 4.2, h: 1.2, a0: 1.8, a1: 1.3, fov: 38, th: 1.4, cloud: 0.1 });
// b21b nine nights with a ruler and chalk
S('b21b', 'b21b', { ...T99, townFilter: clearTowns([P.P2.observatory.x, P.P2.observatory.z, 24]), ...NIGHT, cloud: 0.1,
  cam: camK([P.P2.observatory.x + 3.4, 1.6, P.P2.observatory.z - 15], [P.P2.observatory.x + 8, 2.2, P.P2.observatory.z - 8], 42, [P.P2.observatory.x + 6, 1.8, P.P2.observatory.z - 14], [P.P2.observatory.x + 8, 2.2, P.P2.observatory.z - 8], 38), veg: { r0: 20 },
  setup(c) { const bx = P.P2.observatory.x + 8, bz = P.P2.observatory.z - 8; P.board(c, bx, 2.3, bz, [bx - 6, bz - 18], 4.2, 2.6, (g, W, H, t) => { g.fillStyle = '#19261f'; g.fillRect(0, 0, W, H); g.strokeStyle = '#e8e8dc'; g.lineWidth = 5; g.lineCap = 'round'; const n = Math.min(14, Math.floor(t * 2.6)); for (let i = 0; i < n; i++) { const y = H * (0.12 + 0.06 * i); g.beginPath(); g.moveTo(W * 0.06, y); g.lineTo(W * (0.5 + ((i * 37) % 40) / 100), y + ((i % 3) - 1) * 10); g.stroke(); } g.fillStyle = '#e8e8dc'; g.font = `${H * 0.09}px InterX, sans-serif`; g.fillText('night ' + Math.min(9, 1 + Math.floor(t * 1.6)), W * 0.06, H * 0.94); }, { px: 1100 });
    who(c, 'NERI', bx - 2, bz - 1.5, 'build', { yawTo: [bx, bz] }); P.telescope(c, bx - 4, bz - 3, { yaw: 0.4, pitch: 0.8 }); c.fire(bx - 3.2, bz + 1, { size: 0.5, n: 10, lightIntensity: 8, lightDist: 10 }); } });
// b22 the letters came from a single point: star trails turn around a point that stays still
S('b22a', 'b22', { ...T99, hours: 21.0, hoursFn: (t, d) => 20.8 + 7.4 * (t / Math.max(d, 1)), cloud: 0.05, fog: 0.00015,
  cam: camK([PLAZA.x + 4, 1.8, PLAZA.z - 30], [PLAZA.x + 6, 90, PLAZA.z + 200], 64, [PLAZA.x + 4, 1.8, PLAZA.z - 30], [PLAZA.x + 6, 100, PLAZA.z + 200], 64), veg: { r0: 20 }, townFilter: clearTown(PLAZA.x, PLAZA.z - 30, 40),
  setup(c) { P.skyPoint(c, [PLAZA.x + 6, 250, PLAZA.z + 540], { size: 90 }); crowdDisc(c, 24, PLAZA.x, PLAZA.z - 32, 1, 5, PLAZA.x, PLAZA.z + 300, { seed: 3 }); } });
S('b22b', 'b22', { ...T99, hours: 21.0, hoursFn: (t, d) => 22.0 + 6.0 * (t / Math.max(d, 1)), cloud: 0.05,
  cam: camK([PLAZA.x + 4, 1.8, PLAZA.z - 30], [PLAZA.x + 6, 100, PLAZA.z + 200], 34, [PLAZA.x + 4, 1.8, PLAZA.z - 30], [PLAZA.x + 6, 100, PLAZA.z + 200], 22), veg: { r0: 20 }, townFilter: clearTown(PLAZA.x, PLAZA.z - 30, 40),
  setup(c) { P.skyPoint(c, [PLAZA.x + 6, 250, PLAZA.z + 540], { size: 90 }); } }, 4.6);
portrait('b23', 'b23', 0, 'NERI', { x: P.P2.observatory.x + 4, z: P.P2.observatory.z - 9, pose: 'point', ...T99, townFilter: clearTowns([P.P2.observatory.x, P.P2.observatory.z, 24]), ...NIGHT, r: 3.8, h: 1.1, a0: 1.5, a1: 1.1, fov: 40, th: 1.5, cloud: 0.1,
  set(c) { P.skyPoint(c, [P.P2.observatory.x + 20, 60, P.P2.observatory.z + 220], { size: 40 }); } });
// b24 how do we get up there? (the camera rises from the town to the sky)
S('b24', 'b24', { ...T99, ...NIGHT, cloud: 0.1, fog: 0.00015,
  cam: camK([PLAZA.x - 6, 3, PLAZA.z - 8], [PLAZA.x + 4, 10, PLAZA.z + 40], 60, [PLAZA.x - 6, 160, PLAZA.z - 8], [PLAZA.x + 4, 700, PLAZA.z + 40], 60), veg: { r0: 20 },
  setup(c) { P.skyPoint(c, [PLAZA.x + 6, 650, PLAZA.z + 1000], { size: 160 }); } });
// b25..b27 the vote: up or down
S('b25', 'b25', hh({ hours: 9.8, cloud: 0.35, cam: camK(ST(-1.2, 2.2, -9.0), ST(0, 1.5, -3.5), 36, ST(1.2, 2.2, -8.4), ST(0, 1.5, -3.5), 32), veg: { r0: 20 },
  setup(c) { const H = hallScene(c, { n: 200, tiers: 9 }); const B2 = [[HALL.x - 1.6, HALL.z - 3.5], [HALL.x + 1.6, HALL.z - 3.5]]; voteBowls(c, B2, () => [0, 0], { y: H.stage[1] });
    [['UP', '#4aa86a'], ['DOWN', '#b0503a']].forEach(([n, col], i) => P.sign(c, B2[i][0], 2.0, HALL.z - 3.5, 0, 2.0, 0.9, [{ s: n, size: 190, y: 150, color: '#fff' }], { bg: col, face: [HALL.x, HALL.z - 20], posts: true, py: 256 })); } }));
S('b26', 'b26', hh({ hours: 9.8, cloud: 0.35, cam: camK(ST(-1.2, 3.0, -7.2), ST(0, 0.6, -3.5), 40, ST(0, 3.4, -6.4), ST(0, 0.5, -3.5), 38), veg: { r0: 20 },
  setup(c) { const H = hallScene(c, { n: 200, tiers: 9 }); const B2 = [[HALL.x - 1.6, HALL.z - 3.5], [HALL.x + 1.6, HALL.z - 3.5]]; voteBowls(c, B2, (t) => { const u = clamp01(t / 2.8); return [Math.floor(400 * u * 0.99), Math.floor(255 * u)]; }, { y: H.stage[1], max: 400 }); } }));
S('b27', 'b27', hh({ hours: 9.8, cloud: 0.35, cam: camK(ST(1.0, 1.6, -6.0), ST(1.6, 0.6, -3.5), 34, ST(1.5, 1.7, -5.4), ST(1.6, 0.6, -3.5), 30), veg: { r0: 20 },
  setup(c) { const H = hallScene(c, { n: 200, tiers: 9 }); const B2 = [[HALL.x - 1.6, HALL.z - 3.5], [HALL.x + 1.6, HALL.z - 3.5]]; voteBowls(c, B2, () => [400, 255], { y: H.stage[1], max: 400 }); vil(c, 3, HALL.x + 3.6, HALL.z - 5.6, 'sad', { yawTo: [HALL.x + 1.6, HALL.z - 3.5] }); } }));
// b28 the Assembly has decided: cheering, then the beat: they start to build
S('b28a', 'b28', hh({ hours: 9.9, cloud: 0.35, cam: camK(ST(0, 8, -24), ST(0, 4, 8), 52, ST(0, 4, -16), ST(0, 5, 8), 50), veg: { r0: 20 },
  setup(c) { const H = hallScene(c, { n: 1, tiers: 9 }); H.seats.filter((_, i) => i % 9 === 0).slice(0, 110).forEach((s, i) => vil(c, i, s[0], s[2], i % 2 ? 'cheer' : 'raiseHand', { y: s[1], yaw: s[3], phase: i * 0.7 })); } }));
S('b28b', 'b28', { ...T99, hours: 10.5, cloud: 0.3, townFilter: clearTown(-210, 8, 50),
  cam: camK([-192, 1.8, -8], [-214, 2.0, 8], 52, [-196, 2.2, -4], [-214, 2.0, 8], 48), veg: { r0: 20 },
  setup(c) { const poses = ['chop', 'hammer', 'carry', 'build']; for (let i = 0; i < 14; i++) vil(c, i * 2, -218 + (i % 7) * 2.4, 2 + Math.floor(i / 7) * 4, poses[i % 4], { yawTo: [-214, 8], phase: i * 0.6, era: 'stone' }); P.woodTower(c, -214, 10, 14, { yaw: 0 }); } }, 3.6);
// b29..b30 how tall is the sky?
S('b29', 'b29', { ...T99, townFilter: clearTowns([P.P2.observatory.x, P.P2.observatory.z, 24]), hours: 17.4, cloud: 0.3,
  cam: camK([P.P2.observatory.x + 6, 1.6, P.P2.observatory.z - 15], [P.P2.observatory.x + 8, 2.2, P.P2.observatory.z - 8], 42, [P.P2.observatory.x + 7, 1.8, P.P2.observatory.z - 13], [P.P2.observatory.x + 8, 2.2, P.P2.observatory.z - 8], 38), veg: { r0: 20 },
  setup(c) { const bx = P.P2.observatory.x + 8, bz = P.P2.observatory.z - 8; P.board(c, bx, 2.3, bz, [bx - 6, bz - 18], 4.2, 2.6, (g, W, H, t) => { g.fillStyle = '#19261f'; g.fillRect(0, 0, W, H); g.fillStyle = '#f2f2e6'; g.font = `900 ${H * 0.2}px Anton, sans-serif`; g.textAlign = 'center'; g.fillText('HOW TALL', W / 2, H * 0.4); g.fillText('IS THE SKY?', W / 2, H * 0.68); }, { px: 1100 }); who(c, 'NERI', bx - 2.2, bz - 1.6, 'scratchHead', { yawTo: [bx, bz] }); } });
portrait('b30', 'b30', 0, 'NERI', { x: P.P2.observatory.x + 4, z: P.P2.observatory.z - 9, pose: 'shrug', ...T99, townFilter: clearTowns([P.P2.observatory.x, P.P2.observatory.z, 24]), hours: 17.6, r: 3.6, h: 1.3, a0: 1.5, a1: 1.1, fov: 38, th: 1.2 });
