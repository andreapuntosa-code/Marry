// COLD OPEN + TITLE
import { shot } from './registry.js';
import { crownMesh } from '../lib/people.js';
import { K, orbitCam, M, SPAWN, founders, TIME, MEADOW_TREES, CASTLE, TEMPLE, PLAZA, yawTo, berries, BERRY, CAMP } from './sets.js';

// h01: epic dawn aerial over the pristine valley, gliding towards the meadow
shot('op1', 'start', {
  hours: TIME.dawn + 0.5, cloud: 0.35, year: 0, town: false,
  cam: K([0, [-140, 260, -60], [200, 30, 300], 44], [1, [120, 150, 180], [262, 2, 334], 40]),
  veg: { r0: 0, rImp: 0, r1: 900, rFar: 2600, extra: MEADOW_TREES },
  setup(c) { founders(c, (w, i) => ({ pose: 'idle' })); },
});
// h02: flash-forward — the Assembly, blue banners, torches (night)
shot('op2', 'h02', {
  hours: TIME.night, cloud: 0.15, year: 1931, exposure: 1.25,
  cam: K([0, [-20, 14, -40], [-6, 2, -12], 38], [1, [-14, 12, -36], [-6, 2, -12], 36]),
  veg: { r0: 30, rImp: 90 },
  setup(c) {
    const cr = c.crowd(260, { colors: [0xf2f2f2, 0xe8e8e8, 0x4f8dff] });
    const r = Math.random; let k = 0;
    for (let i = 0; i < 260; i++) { const a = (i * 2.4) % 6.28, d = 3 + Math.sqrt(i) * 1.3; const x = -6 + Math.cos(a) * d, z = -12 + Math.sin(a) * d; cr.set(i, x, c.h(x, z), z, Math.atan2(-6 - x, -12 - z), 0); }
    c.on(t => cr.update(t));
    for (const [x, z] of [[-2, -6], [-10, -6], [-4, -16], [-12, -15]]) c.proto('bannerBlue', 0, x, z, 0, 1.1);
    for (const [x, z] of [[-1, -9], [-11, -10], [-7, -3], [-5, -19]]) c.fire(x, z, { size: 0.35, n: 14, emberN: 10, lightIntensity: 6, lightDist: 10, dy: 1.8 });
  },
});
// h03: flash-forward — King Kassa on the palace steps, low angle
shot('op3', 'h03', {
  hours: TIME.sunset, cloud: 0.4, year: 1700,
  cam: K([0, [CASTLE.x - 3.0, 0.6, CASTLE.z - 16], [CASTLE.x, 4.5, CASTLE.z - 6], 32], [1, [CASTLE.x - 2.4, 0.5, CASTLE.z - 14.8], [CASTLE.x, 4.6, CASTLE.z - 6], 30]),
  veg: { r0: 30, rImp: 90 },
  setup(c) {
    const k = c.person('KASSA', { x: CASTLE.x, z: CASTLE.z - 7.5, yaw: Math.PI * 1.0 + 0.15, acc: ['crown', 'cape'], dy: 2.6 });
    k.anim = (P, t) => P.pose('armsCrossed', t);
    for (let i = 0; i < 4; i++) { const g = c.person('A0' + [1, 3, 5, 6][i], { x: CASTLE.x - 5 + i * 3.3, z: CASTLE.z - 11, yaw: Math.PI, acc: ['helmet', { type: 'sash', color: 0xb3122a }, 'spear'] }); g.anim = (P, t) => P.pose('pushSpear', t); }
    c.proto('bannerRed', 0, CASTLE.x - 6, CASTLE.z - 9, 0, 1.2); c.proto('bannerRed', 0, CASTLE.x + 6, CASTLE.z - 9, 0, 1.2);
  },
});
// h04: the twenty founders in the meadow, slow orbit
shot('op4', 'h04', {
  hours: TIME.morning, cloud: 0.4, year: 0, town: false,
  cam: orbitCam([M.x, M.z], 17, 4.5, 2.2, 2.9, 38, 1.0),
  veg: { grassR: 22, extra: MEADOW_TREES },
  setup(c) { founders(c, (w, i) => ({ pose: i % 5 === 0 ? 'lookUp' : 'idle', p: { look: 1 } })); },
});
// h05 a/b/c: fire / animals / farms-cities-temples
shot('op5a', 'h05', {
  hours: TIME.night, cloud: 0.2, year: 0, town: false, exposure: 1.2,
  cam: K([0, [CAMP.x - 4, 1.2, CAMP.z - 3.5], [CAMP.x, 0.8, CAMP.z], 34], [1, [CAMP.x - 3.4, 1.0, CAMP.z - 3.9], [CAMP.x, 0.8, CAMP.z], 32]),
  veg: { grassR: 10, extra: MEADOW_TREES },
  setup(c) {
    c.fire(CAMP.x, CAMP.z, { size: 1.0, smoke: true }); c.proto('firePit', 0, CAMP.x, CAMP.z);
    ['ISE', 'BO', 'MIRA', 'A05', 'TAM'].forEach((w, i) => { const a = i / 5 * 6.28 + 0.6; const x = CAMP.x + Math.cos(a) * 2.6, z = CAMP.z + Math.sin(a) * 2.6; const P = c.person(w, { x, z, yaw: Math.atan2(CAMP.x - x, CAMP.z - z) }); P.anim = (P2, t) => P2.pose('sitGround', t, { headX: 0.15 }); });
  },
});
shot('op5b', 'h05', {
  hours: TIME.golden, cloud: 0.3, year: 15, town: false,
  cam: K([0, [175, 1.6, 268], [190, 1.0, 285], 40], [1, [177, 1.5, 271], [190, 1.0, 285], 38]),
  veg: { grassR: 14 },
  setup(c) {
    const tam = c.person('TAM', { x: 188, z: 283, yaw: 0.5, acc: ['staff'] });
    tam.anim = (P, t) => c.walkTo(P, 186, 280, 191, 288, t, 0, 3);
    for (let i = 0; i < 7; i++) { const bx = 185.5 - (i % 3) * 1.4, bz = 278.5 - Math.floor(i / 3) * 1.6; const g = c.animal('goat', i, bx, bz, 0.6); c.on(t => { const x = bx + 1.4 * t * Math.sin(0.6), z = bz + 1.4 * t * Math.cos(0.6); g.root.position.set(x, c.h(x, z), z); g.animate(t, { speed: 0.8, phase: i }); }); }
  },
}, 1.6);
shot('op5c', 'h05', {
  hours: TIME.afternoon, cloud: 0.35, year: 1750,
  cam: K([0, [-220, 160, -260], [30, 10, 20], 40], [1, [-190, 150, -240], [30, 10, 20], 40]),
  veg: { r0: 0, rImp: 0, r1: 700, rFar: 2400 },
}, 3.2);
// h06: money (granary + baskets) / gods (temple)
shot('op6a', 'h06', {
  hours: TIME.afternoon, cloud: 0.3, year: 560,
  cam: K([0, [HILL_GX(), 2, -2], [52, 3, 33], 36], [1, [HILL_GX() + 1, 2, -1], [52, 3, 33], 34]),
  veg: { r0: 30 },
  setup(c) {
    const k = c.person('KASSA', { x: 50, z: 30, yaw: -2.2 }); k.anim = (P, t) => P.pose('armsCrossed', t);
    for (let i = 0; i < 6; i++) c.proto('pot', 0, 47 + i * 0.8, 28 + (i % 2), 0, 1.4);
  },
});
function HILL_GX() { return 38; }
shot('op6b', 'h06', {
  hours: TIME.night, cloud: 0.15, year: 1300, exposure: 1.3,
  cam: K([0, [TEMPLE.x - 40, 6, TEMPLE.z - 50], [TEMPLE.x, 14, TEMPLE.z], 36], [1, [TEMPLE.x - 36, 6, TEMPLE.z - 46], [TEMPLE.x, 14, TEMPLE.z], 34]),
  veg: { r0: 30 },
  setup(c) { for (const [dx, dz] of [[-8, 9], [8, 9], [-8, -9], [8, -9]]) c.fire(TEMPLE.x + dx, TEMPLE.z + dz, { size: 0.6, n: 16, lightIntensity: 10, lightDist: 16, dy: 6.5 }); },
}, 1.4);
// h07: slow push towards the castle on the hill at dusk
shot('op7', 'h07', {
  hours: TIME.dusk, cloud: 0.35, year: 1800,
  cam: K([0, [CASTLE.x - 120, 25, CASTLE.z - 140], [CASTLE.x, 14, CASTLE.z], 34], [1, [CASTLE.x - 95, 22, CASTLE.z - 110], [CASTLE.x, 14, CASTLE.z], 32]),
  veg: { r0: 30, rImp: 120 },
});
// h08: the copper crown lying on the palace steps (a flash-forward)
shot('op8', 'h08', {
  hours: TIME.dawn + 0.3, cloud: 0.3, year: 1931,
  cam: K([0, [CASTLE.x + 0.9, 3.4, CASTLE.z - 10.4], [CASTLE.x + 0.2, 2.9, CASTLE.z - 9.2], 30], [1, [CASTLE.x + 0.7, 3.3, CASTLE.z - 10.1], [CASTLE.x + 0.2, 2.9, CASTLE.z - 9.2], 26]),
  veg: { r0: 20 },
  setup(c) { crownProp(c, CASTLE.x + 0.2, CASTLE.z - 9.2, 2.95); },
});
export function crownProp(c, x, z, dy, tilt = 0.25) {
  const crown = crownMesh(); crown.rotation.z = tilt; crown.position.set(x, c.h(x, z) + dy, z); crown.scale.setScalar(1.15); return c.add(crown);
}
// h09: Kassa VII turns to camera, sunset, red banners
shot('op9', 'h09', {
  hours: TIME.sunset, cloud: 0.45, year: 1430,
  cam: K([0, [TEMPLE.x + 2.5, 1.2 + 9.6, TEMPLE.z + 6], [TEMPLE.x, 11.6, TEMPLE.z + 1.5], 30], [1, [TEMPLE.x + 2.0, 1.0 + 9.6, TEMPLE.z + 5.2], [TEMPLE.x, 11.6, TEMPLE.z + 1.5], 27]),
  veg: { r0: 20 },
  setup(c) {
    const k = c.person('KASSA', { x: TEMPLE.x, z: TEMPLE.z + 1.5, yaw: 0.2, acc: ['crown', 'cape'], dy: 9.6 });
    k.anim = (P, t) => { P.pose('idle', t); P.root.rotation.y = 0.2 + Math.min(1, t / 1.4) * 2.6; };
  },
});
// TITLE: sweeping aerial at golden hour over the grown civilization
shot('title', 'title', {
  hours: TIME.golden, cloud: 0.4, year: 1700,
  cam: K([0, [-420, 210, -360], [40, 0, 40], 42], [1, [-330, 170, -300], [40, 0, 40], 40]),
  veg: { r0: 0, rImp: 0, r1: 800, rFar: 2600 },
});
