// CHAPTER I — THE COMMENT (year 2040): the valley waits, the comment, "Bingus", the sky answers.
import { S, K, camK, clearTown, clearTowns, templeXZ, who, vil, walker, portrait, duo, reuse, THREE, TIME, PLAZA, HILL, TEMPLE, PRIMA, PLAIN, crowdDisc, height, lerp, clamp01, mulberry32, NIGHT, DUSK, FOLK } from './p2kit.js';
import { narratorRoom, drawComments, drawBingusScreen, hallScene, roomAt, ROOM_SHOT } from './p2scenes.js';
import { P1 } from './p1/index.js';
import { templeLocal, TEMPLE_FOOT, TEMPLE_YAW, M as MEADOW } from './p1/sets.js';
import { VILLAGERS } from '../lib/people.js';
import * as P from '../lib/p2.js';

const T99 = { year: 1999, town: true };         // the stone town of Part 1 (it has not changed much)
const modern = (c, level = 0.0, o = {}) => { if (level > 0) P.industry(c, level, o); };

// ---- chapter card + "Year twenty forty": dawn over Prima
S('i_card', 'chap:i01', { ...T99, hours: TIME.dawn + 0.3, cloud: 0.35, fog: 0.0005,
  cam: camK([-170, 90, -120], [0, 12, 10], 48, [-120, 70, -90], [0, 12, 10], 46), veg: { r0: 30, rImp: 160, r1: 300 } });
S('i01', 'i01', { ...T99, hours: TIME.dawn + 0.5, cloud: 0.35, fog: 0.0005,
  cam: camK([-110, 40, -60], [10, 10, 10], 44, [-70, 26, -40], [10, 12, 10], 42), veg: { r0: 30, rImp: 160, r1: 300 } });

// ---- i02 the letters are still there (Part 1's shots)
reuse('i02a', 'm06', 'i02', 0); reuse('i02b', 'm10', 'i02', 1.9);
// ---- i03 every night the valley sits outside, looking up
reuse('i03a', 'm05a', 'i03', 0);
S('i03b', 'i03', { ...T99, ...NIGHT, townFilter: clearTown(PLAZA.x, PLAZA.z, 40), cloud: 0.1, fog: 0.0002,
  cam: camK([PLAZA.x - 3, 1.4, PLAZA.z - 15], [PLAZA.x + 4, 5, PLAZA.z + 8], 70, [PLAZA.x - 3, 1.5, PLAZA.z - 15], [PLAZA.x + 4, 14, PLAZA.z + 8], 70), veg: { r0: 30 },
  setup(c) { const cr = crowdDisc(c, 90, PLAZA.x, PLAZA.z, 2, 20, PLAZA.x, PLAZA.z + 60, { seed: 6 }); for (let i = 0; i < 90; i++) cr.lie(i, false); } }, 1.9);

// ---- i04 observatory, festival, the goat mayor
S('i04a', 'i04', { ...T99, hours: 16.4, cloud: 0.3, townFilter: clearTowns([P.P2.observatory.x, P.P2.observatory.z, 22], [P.P2.observatory.x - 24, P.P2.observatory.z - 26, 14]),
  cam: camK([P.P2.observatory.x - 24, 4, P.P2.observatory.z - 26], [P.P2.observatory.x, 9, P.P2.observatory.z], 46, [P.P2.observatory.x - 17, 6, P.P2.observatory.z - 22], [P.P2.observatory.x, 11, P.P2.observatory.z], 44), veg: { r0: 20 },
  setup(c) { P.observatory(c, P.P2.observatory.x, P.P2.observatory.z, { yaw: 0.4 }); who(c, 'NERI', P.P2.observatory.x + 2, P.P2.observatory.z - 8, 'lookUp', { yaw: 0.2 }); } });
S('i04b', 'i04', { ...T99, ...DUSK, hours: 18.6, townFilter: clearTown(PLAZA.x, PLAZA.z, 30),
  cam: camK([PLAZA.x - 14, 3.2, PLAZA.z - 18], [PLAZA.x + 2, 3, PLAZA.z], 50, [PLAZA.x - 9, 3.6, PLAZA.z - 14], [PLAZA.x + 2, 3.4, PLAZA.z], 48), veg: { r0: 20 },
  setup(c) {
    const cr = crowdDisc(c, 120, PLAZA.x, PLAZA.z, 1, 13, PLAZA.x, PLAZA.z, { seed: 9, colors: [0xffd27a, 0xff8a6a, 0x9fd0ff, 0xf4f1ec, 0xffc0e0] }); for (let i = 0; i < 120; i++) cr.walk[i] = 1;
    for (let k = 0; k < 4; k++) P.bunting(c, [PLAZA.x - 16, height(PLAZA.x - 16, PLAZA.z - 6 + k * 4) + 5, PLAZA.z - 6 + k * 4], [PLAZA.x + 16, height(PLAZA.x + 16, PLAZA.z - 6 + k * 4) + 5, PLAZA.z - 6 + k * 4], 16, { lanterns: true });
  } }, 3.0);
S('i04c', 'i04', { ...T99, hours: 11, cloud: 0.4,
  cam: camK([MEADOW.x - 6, 1.0, MEADOW.z - 7], [MEADOW.x, 1.0, MEADOW.z], 40, [MEADOW.x - 4.5, 1.1, MEADOW.z - 5], [MEADOW.x, 1.0, MEADOW.z], 36), veg: { grassR: 25 },
  setup(c) {
    P.sign(c, MEADOW.x - 2.4, 1.6, MEADOW.z + 0.6, 0, 2.6, 1.3, [{ s: 'WELCOME TO', size: 120, y: 150 }, { s: 'OBSERVER VILLAGE', size: 120, y: 290 }, { s: 'MAYOR: OBSERVER (GOAT)', size: 66, y: 420, color: '#7a2a12' }], { posts: true, border: '#7a5a2e', face: [MEADOW.x - 6, MEADOW.z - 7] });
    const g = c.animal('goat', 3, MEADOW.x, MEADOW.z, 3.6, {}); c.on((t) => g.animate(t, { speed: 0, phase: 1 }));
    const sash = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.035, 6, 20), new THREE.MeshStandardMaterial({ color: 0x2a5bd7 })); sash.rotation.y = Math.PI / 2; sash.position.set(0, 0.62, 0.0); g.root.add(sash);
    P.bunting(c, [MEADOW.x - 5, height(MEADOW.x - 5, MEADOW.z) + 3, MEADOW.z - 1], [MEADOW.x + 4, height(MEADOW.x + 4, MEADOW.z) + 3, MEADOW.z - 1], 10);
    for (let i = 0; i < 4; i++) vil(c, i, MEADOW.x + 2 + i * 1.1, MEADOW.z - 2 + (i % 2), 'cheer', { yawTo: [MEADOW.x, MEADOW.z], phase: i });
  } }, 5.9);

// ---- i04b the temple is a museum (gift shop, clay eyeball)
S('i04d', 'i04b', { ...T99, hours: 14.3, cloud: 0.35, townFilter: clearTown(templeLocal(0, 0, 20)[0], templeLocal(0, 0, 20)[2], 14),
  cam: camK(templeXZ(-13, 34, 2.4), templeXZ(0, 8, 7), 46, templeXZ(-8, 31, 2.6), templeXZ(0, 8, 7), 44), veg: { r0: 20 },
  setup(c) {
    const f = templeLocal(6, 0, 19); P.sign(c, f[0], 2.4, f[2], 0, 3.6, 1.4, [{ s: 'MUSEUM OF THE OBSERVER', size: 84, y: 190, color: '#f3e7c8' }, { s: 'open 9 - 5  \u2022  gift shop', size: 60, y: 330, color: '#ffd27a' }], { bg: '#2c3a52', posts: true, border: '#f3e7c8', face: templeLocal(-13, 0, 34) });
    for (let i = 0; i < 18; i++) { const q = templeLocal(-7 + (i % 6) * 2.2, 0, 22 + Math.floor(i / 6) * 2.4); vil(c, i, q[0], q[2], 'idle', { yaw: TEMPLE_YAW + Math.PI, phase: i }); }
  } }, 0);
S('i04e', 'i04b', { ...T99, hours: 14.3, cloud: 0.35, shadow: undefined,
  cam: camK([PLAZA.x + 38.6, 1.6, PLAZA.z + 49.5], [PLAZA.x + 38, 1.5, PLAZA.z + 56], 36, [PLAZA.x + 38.2, 1.6, PLAZA.z + 51.5], [PLAZA.x + 38, 1.5, PLAZA.z + 56], 30), veg: { r0: 10 },
  setup(c) {
    const x = PLAZA.x + 38, z = PLAZA.z + 56;
    const tab = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.1, 1.0), new THREE.MeshStandardMaterial({ color: 0x6b4a2e })); tab.position.set(x, height(x, z) + 1.0, z); c.add(tab); c.own(tab.geometry);
    for (const s of [-1, 1]) { const l = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1, 0.12), tab.material); l.position.set(x + s * 0.9, height(x, z) + 0.5, z); c.add(l); c.own(l.geometry); }
    for (let k = 0; k < 4; k++) { const e = new THREE.Mesh(new THREE.SphereGeometry(0.22, 18, 12), new THREE.MeshStandardMaterial({ color: 0xd8b48a, roughness: 0.8 })); e.position.set(x - 0.7 + k * 0.45, height(x, z) + 1.28, z); c.add(e); c.own(e.geometry); const ir = new THREE.Mesh(new THREE.CircleGeometry(0.1, 14), new THREE.MeshStandardMaterial({ color: 0x2a1a10 })); ir.position.set(0, 0, 0.215); e.add(ir); }
    P.sign(c, x, 2.2, z + 0.6, 0, 2.2, 0.8, [{ s: 'GIFT SHOP', size: 150, y: 160 }, { s: 'clay eyeballs  3 for 1 coin', size: 52, y: 320, color: '#7a2a12' }], { posts: true, bg: '#f3d8a0', face: [x, z - 20] });
    vil(c, 30, x + 2.6, z - 2.4, 'point', { yawTo: [x, z] });
  } }, 2.8);

// ---- i05..i06 the narrator's room: the promise, the comments
const ROOMCAM = (a, t, f, b = a, tb = t, f2 = f) => K([0, roomAt(...a), roomAt(...t), f], [1, roomAt(...b), roomAt(...tb), f2], { abs: true });
const room = (pose, extra = {}) => ({ interior: true, hours: 3, ...ROOM_SHOT, setup(c) { narratorRoom(c, { pose, ...extra }); } });
S('i05', 'i05', { ...room('head'), cam: ROOMCAM([1.5, 1.55, 2.0], [0, 1.0, 0.1], 40, [1.1, 1.45, 1.6], [0, 1.0, 0.1], 36) });
S('i06a', 'i06', { ...room('type'), cam: ROOMCAM([0.55, 1.5, 1.1], [0, 1.1, -0.32], 38, [0.3, 1.42, 0.8], [0, 1.1, -0.32], 32) });
S('i06b', 'i06', { kind: '2d', name: 'comments', bg: 'i06a', cam: camK([0, 10, 0], [0, 0, 10]) }, 1.6);
S('i07', 'i07', { kind: '2d', name: 'comments2', bg: 'i06a', cam: camK([0, 10, 0], [0, 0, 10]) });
S('i07a', 'i07a', { ...room('lean', { screen: (g, W, H, t) => drawComments(g, W, H, { scroll: 2 + t * 2.4 }) }), cam: ROOMCAM([-1.4, 1.5, 1.7], [0, 1.0, 0], 42, [-1.0, 1.4, 1.5], [0, 1.0, 0], 38) });
S('i07a2', 'i07a', { kind: '2d', name: 'comments3', bg: 'i06a', cam: camK([0, 10, 0], [0, 0, 10]) }, 3.2);
// i07b the pizza gag in the Tamari camp
S('i07b', 'i07b', { ...T99, hours: 15.5, cloud: 0.3,
  cam: camK([620, 1.6, -530], [640, 1.4, -520], 40, [624, 1.7, -527], [640, 1.4, -520], 36), veg: { r0: 20 },
  setup(c) {
    const P1_ = who(c, 'KUMA', 637, -521, 'idle', { yawTo: [630, -527] }), P2_ = who(c, 'YUNA', 633, -526, 'armsOpen', { yawTo: [637, -521] });
    P.pizza(c, P1_.R.hd); const g = c.animal('goat', 2, 641, -524, 2.4, {}); c.on((t) => g.animate(t, { speed: 0, phase: 2 }));
  } }, 0);
// i08 one comment has more likes
S('i08', 'i08', { ...room('type', { screen: (g, W, H, t) => drawBingusScreen(g, W, H, { t }) }), cam: ROOMCAM([-0.7, 1.28, 0.62], [0, 1.12, -0.32], 32, [-0.5, 1.22, 0.4], [0, 1.12, -0.32], 24) });
// i09 "Here it is."
S('i09', 'i09', { ...room('reach', { screen: (g, W, H, t) => drawBingusScreen(g, W, H, { t }) }), cam: ROOMCAM([0.95, 1.2, 0.5], [0.15, 1.0, -0.15], 34, [0.8, 1.15, 0.4], [0.15, 1.0, -0.15], 28) });
// i10 Bingus. (the screenshot, full frame)
S('i10', 'i10', { kind: '2d', name: 'bingus', bg: 'i08', cam: camK([0, 10, 0], [0, 0, 10]) });
// i11..i12 not hello / not run
S('i11', 'i12', { kind: '2d', name: 'notthis', bg: 'i08', cam: camK([0, 10, 0], [0, 0, 10]) }, -0.1);
S('i12b', 'i12b', { ...room('lean', { cereal: true }), cam: ROOMCAM([-1.5, 1.4, 1.6], [0, 1.0, 0], 44, [-1.1, 1.3, 1.3], [0, 1.0, 0], 38) });
S('i12c', 'i12b', { ...room('head', { cereal: true }), cam: ROOMCAM([1.3, 1.1, 1.0], [0, 1.0, 0.3], 36, [1.0, 1.1, 0.8], [0, 1.0, 0.3], 32) }, 3.2);
// i13..i14 a deal is a deal / rule 3 / text
S('i13', 'i13', { ...room('type', { button: true }), cam: ROOMCAM([0.5, 1.2, 1.0], [0.3, 0.9, 0.0], 36, [0.42, 1.15, 0.85], [0.3, 0.9, 0.0], 32) });
S('i14', 'i14', { kind: '2d', name: 'rule3', bg: 'i13', cam: camK([0, 10, 0], [0, 0, 10]) });
// i15 midnight, he types it
S('i15a', 'i15', { ...room('type', { screen: (g, W, H, t) => P2_console(g, W, H, t) }), cam: ROOMCAM([-0.75, 1.3, 0.6], [0, 1.12, -0.32], 34, [-0.55, 1.24, 0.42], [0, 1.12, -0.32], 28) });
S('i15b', 'i15', { ...room('type', { screen: (g, W, H, t) => P2_console(g, W, H, t) }), cam: ROOMCAM([-0.3, 1.0, 0.6], [0.0, 0.8, 0.0], 30, [0.0, 0.95, 0.5], [0.0, 0.8, 0.0], 26) }, 2.3);
function P2_console(g, W, H, t) {
  g.fillStyle = '#0a0f17'; g.fillRect(0, 0, W, H); g.fillStyle = '#7dd3fc'; g.font = `bold ${H * 0.05}px MonoX, monospace`; g.fillText('PRIMA.SIM  —  ADMIN CONSOLE', W * 0.04, H * 0.1);
  g.fillStyle = '#94a3b8'; g.font = `${H * 0.045}px MonoX, monospace`; g.fillText('year 2040  •  00:00:00  •  Jan 01', W * 0.04, H * 0.2);
  const full = '> send --sky "BINGUS"', n = Math.min(full.length, Math.floor(Math.max(0, t - 0.2) * 7)); g.fillStyle = '#e2e8f0'; g.font = `bold ${H * 0.06}px MonoX, monospace`; g.fillText(full.slice(0, n) + ((t * 2) % 1 < 0.6 ? '█' : ''), W * 0.04, H * 0.42);
  if (t > 3.2) { g.fillStyle = '#4ade80'; g.fillText('sent. 7 characters.', W * 0.04, H * 0.58); }
}
// i16 the sky lights up: a word in the stars (over the valley), crowd below
S('i16a', 'i16', { ...T99, ...NIGHT, cloud: 0.08, fog: 0.00015, townFilter: clearTown(PLAZA.x, PLAZA.z - 28, 40),
  cam: camK([PLAZA.x - 10, 2, PLAZA.z - 30], [PLAZA.x + 10, 100, PLAZA.z + 260], 62, [PLAZA.x - 6, 2.2, PLAZA.z - 27], [PLAZA.x + 10, 118, PLAZA.z + 260], 58), veg: { r0: 30 },
  setup(c) { P.skyText(c, 'BINGUS', [PLAZA.x + 10, 230, PLAZA.z + 560], { w: 1000, h: 250, t0: 0.4, fade: 1.8, max: 0.8 }); const cr = crowdDisc(c, 70, PLAZA.x, PLAZA.z - 30, 2, 14, PLAZA.x, PLAZA.z + 300, { seed: 12 }); } });
S('i16b', 'i16', { ...T99, ...NIGHT, cloud: 0.08, fog: 0.00015, townFilter: clearTown(PLAZA.x, PLAZA.z - 30, 40),
  cam: camK([PLAZA.x + 2, 1.7, PLAZA.z - 36], [PLAZA.x + 10, 100, PLAZA.z + 260], 70, [PLAZA.x + 2, 1.7, PLAZA.z - 33], [PLAZA.x + 10, 150, PLAZA.z + 260], 66), veg: { r0: 30 },
  setup(c) { P.skyText(c, 'BINGUS', [PLAZA.x + 10, 230, PLAZA.z + 560], { w: 1000, h: 250, t0: -3, fade: 0.1, max: 0.7 }); const cr = crowdDisc(c, 90, PLAZA.x, PLAZA.z - 30, 1, 10, PLAZA.x, PLAZA.z + 300, { seed: 12 }); } }, 2.4);
// i17..i19 Neri
portrait('i17', 'i17', 0, 'NERI', { x: P.P2.observatory.x + 2, z: P.P2.observatory.z - 8, pose: 'lookUp', ...NIGHT, ...T99, r: 3.6, h: 1.0, a0: 4.4, a1: 3.9, fov: 38, th: 1.5, cloud: 0.1,
  set(c) { P.skyText(c, 'BINGUS', [P.P2.observatory.x, 90, P.P2.observatory.z + 300], { w: 560, h: 140, t0: -3, fade: 0.1 }); } });
portrait('i18', 'i18', 0.4, 'NERI', { x: P.P2.observatory.x + 4, z: P.P2.observatory.z - 9, pose: 'idle', hours: 17.2, ...T99, townFilter: clearTowns([P.P2.observatory.x, P.P2.observatory.z, 24]), r: 4.6, h: 1.4, a0: 1.5, a1: 0.9, fov: 36, th: 1.2,
  set(c) { P.telescope(c, P.P2.observatory.x + 6.2, P.P2.observatory.z - 10, { yaw: -0.6, pitch: 0.7 }); P.observatory(c, P.P2.observatory.x, P.P2.observatory.z, { yaw: 0.4 }); } });
S('i19a', 'i19', { ...T99, ...NIGHT, cloud: 0.1, townFilter: clearTown(P.P2.observatory.x + 6, P.P2.observatory.z - 10, 22),
  cam: camK([P.P2.observatory.x + 11, 2.2, P.P2.observatory.z - 16], [P.P2.observatory.x + 6, 1.0, P.P2.observatory.z - 10], 40, [P.P2.observatory.x + 9, 1.6, P.P2.observatory.z - 14], [P.P2.observatory.x + 6, 1.0, P.P2.observatory.z - 10], 34), veg: { r0: 20 },
  setup(c) {
    const x = P.P2.observatory.x + 6, z = P.P2.observatory.z - 10;
    const P_ = who(c, 'NERI', x, z, 'lookUp', { yaw: 3.0 }); const tel = P.telescope(c, x + 0.4, z + 0.4, { yaw: 0, pitch: 0.9 }); tel.visible = false;
    const held = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.1, 1.1, 12), new THREE.MeshStandardMaterial({ color: 0xc99a3c, metalness: 0.9, roughness: 0.3 })); c.add(held);
    P_.anim = (Q, t) => {
      if (t < 1.2) { Q.pose('lookUp', t, { amount: 1.0 }); }
      else { const d = t - 1.2; Q.pose(d < 1.0 ? 'stagger' : 'hurt', d, { phase: 0 }); Q.root.position.y = height(x, z) + (d > 1.0 && d < 2.6 ? Math.abs(Math.sin((d - 1.0) * 7)) * 0.25 : 0); }
      const d2 = Math.max(0, t - 1.1), py = Math.max(0.05, 1.5 - 5 * d2 * d2);
      held.position.set(x - 0.15, height(x, z) + py, z + 0.25); held.rotation.z = 0.2 + d2 * 3; held.rotation.x = Math.PI / 2 * clamp01(d2 * 2);
    };
  } });
S('i19b', 'i19', { ...T99, ...NIGHT, cloud: 0.1, townFilter: clearTown(P.P2.observatory.x + 6, P.P2.observatory.z - 10, 22),
  cam: camK([P.P2.observatory.x + 8.4, 0.5, P.P2.observatory.z - 12.6], [P.P2.observatory.x + 6, 0.3, P.P2.observatory.z - 10], 30, [P.P2.observatory.x + 8.0, 0.45, P.P2.observatory.z - 12.2], [P.P2.observatory.x + 6, 0.3, P.P2.observatory.z - 10], 26), veg: { r0: 10 },
  setup(c) { who(c, 'NERI', P.P2.observatory.x + 6, P.P2.observatory.z - 10, 'hurt', { yaw: 3.0 }); } }, 3.0);
// i20 within a minute the whole valley was awake: windows light up
S('i20', 'i20', { ...T99, ...NIGHT, cloud: 0.15, fog: 0.0004,
  cam: camK([-150, 80, -110], [0, 8, 10], 52, [-110, 62, -80], [0, 8, 10], 50), veg: { r0: 30, rImp: 160, r1: 300 },
  setup(c) { const r = mulberry32(2), pts = []; for (let i = 0; i < 260; i++) { const a = r() * 6.28, d = 6 + Math.sqrt(r()) * 110; const x = -10 + Math.cos(a) * d * 1.3, z = 5 + Math.sin(a) * d; pts.push([x, height(x, z) + 2.4, z]); } P.cityLights(c, pts, (t) => (t - 0.1) / 1.6, { size: 3.2 }); } });
// i21..i22 the Great Hall tower: Aru counts the letters
S('i21', 'i21', { ...T99, ...NIGHT, cloud: 0.15, townFilter: clearTown(P.P2.hall.x, P.P2.hall.z, 38),
  cam: camK([P.P2.hall.x - 4, 2.2, P.P2.hall.z - 24], [P.P2.hall.x, 3, P.P2.hall.z], 44, [P.P2.hall.x - 2, 2.6, P.P2.hall.z - 17], [P.P2.hall.x, 3.2, P.P2.hall.z], 40), veg: { r0: 20 },
  setup(c) { const H = hallScene(c, { n: 260, tiers: 8 }); const A = who(c, 'ARU', H.podium[0], H.podium[2], 'point', { yaw: 0, y: H.podium[1] }); for (const s of [-1, 1]) c.fire(H.podium[0] + s * 4, H.podium[2] - 2, { size: 0.9, lightIntensity: 14, lightDist: 16 }); } });
S('i22a', 'i22', { ...T99, ...NIGHT, cloud: 0.15, townFilter: clearTown(P.P2.hall.x, P.P2.hall.z, 38),
  cam: camK([P.P2.hall.x + 2, 1.6, P.P2.hall.z - 7], [P.P2.hall.x, 1.7, P.P2.hall.z], 34, [P.P2.hall.x + 1, 1.7, P.P2.hall.z - 4.6], [P.P2.hall.x, 1.75, P.P2.hall.z], 30), veg: { r0: 20 },
  setup(c) { const H = hallScene(c, { n: 200, tiers: 8 }); who(c, 'ARU', H.podium[0], H.podium[2], 'armsOpen', { yaw: 0.0, y: H.podium[1] }); c.fire(H.podium[0] + 3, H.podium[2] - 3, { size: 0.9, lightIntensity: 14, lightDist: 16 }); } });
// the beat: everyone runs to the Hall with torches / stones
S('i22b', 'i22', { ...T99, ...NIGHT, cloud: 0.15, townFilter: clearTown(PLAZA.x, PLAZA.z, 36),
  cam: camK([PLAZA.x - 6, 1.6, PLAZA.z - 20], [PLAZA.x + 6, 1.6, PLAZA.z + 6], 46, [PLAZA.x - 2, 1.8, PLAZA.z - 14], [PLAZA.x + 6, 1.6, PLAZA.z + 6], 44), veg: { r0: 20 },
  setup(c) {
    const cr = c.crowd(110, { seed: 8, colors: [0xf2f2f2, 0xe8d8c0, 0xdde4ee] }), r = mulberry32(4), X = [], Z = [];
    for (let i = 0; i < 110; i++) { X.push(PLAZA.x - 26 + r() * 10); Z.push(PLAZA.z - 12 + r() * 22); }
    c.on((t) => { for (let i = 0; i < 110; i++) { const x = X[i] + t * 7.5 * (0.8 + 0.3 * ((i * 7) % 5) / 5), z = Z[i] + Math.sin(i + t) * 0.2; cr.set(i, x, height(x, z), z, 1.3, 1); } cr.update(t); });
    for (let i = 0; i < 6; i++) c.fire(PLAZA.x - 12 + i * 4.5, PLAZA.z - 8 + (i % 3) * 5, { size: 0.45, n: 10, light: i % 2 === 0, lightIntensity: 7, lightDist: 10 });
  } }, 1.5);
S('i22c', 'i22', { ...T99, ...NIGHT, cloud: 0.15, townFilter: clearTown(P.P2.hall.x, P.P2.hall.z, 38),
  cam: camK([P.P2.hall.x - 6, 1.1, P.P2.hall.z - 4], [P.P2.hall.x + 2, 1.0, P.P2.hall.z - 1], 36, [P.P2.hall.x - 5, 1.1, P.P2.hall.z - 2.5], [P.P2.hall.x + 2, 1.0, P.P2.hall.z - 1], 32), veg: { r0: 20 },
  setup(c) { const H = hallScene(c, { n: 400, tiers: 8 }); const bowl = c.proto('bowl', 0, P.P2.hall.x + 1.2, P.P2.hall.z - 1, 0, 0.35, 0, { y: H.y0 + 0.4 }); const b2 = c.proto('bowl', 0, P.P2.hall.x - 0.4, P.P2.hall.z - 1.2, 0, 0.35, 0, { y: H.y0 + 0.4 }); } }, 3.0);
