// COLD OPEN + TITLE
import { shot } from './registry.js';
import { crownMesh } from '../lib/people.js';
import { TorchField } from '../lib/fx.js';
import { K, orbitCam, M, SPAWN, founders, TIME, MEADOW_TREES, CASTLE, TEMPLE, PLAZA, GRANARY_K, yawTo, berries, BERRY, CAMP, GOATS,
  castleLocal, templeLocal, LANDING, TEMPLE_TOP, TEMPLE_YAW, CASTLE_YAW, GUARD, BLUE, crowdDisc } from './sets.js';

// h01: epic dawn aerial over the pristine valley, gliding towards the meadow
shot('op1', 'start', {
  hours: TIME.dawn + 0.6, cloud: 0.35, year: 0, town: false,
  cam: K([0, [-140, 260, -60], [200, 30, 300], 44], [1, [120, 150, 180], [262, 2, 334], 40]),
  veg: { r0: 0, rImp: 0, r1: 900, rFar: 2600, extra: MEADOW_TREES },
  setup(c) { founders(c, (w, i) => ({ pose: 'idle' })); },
});
// h02: flash-forward — the Assembly at blue hour: Orun on a podium, blue banners, torches
const POD = { x: PLAZA.x, z: PLAZA.z - 4 };
shot('op2', 'h02', {
  hours: TIME.dusk + 0.12, cloud: 0.25, year: 1932, exposure: 1.15,
  cam: K([0, [PLAZA.x - 3, 4.6, PLAZA.z + 13], [POD.x, 2.4, POD.z], 32], [1, [PLAZA.x - 2.2, 4.2, PLAZA.z + 11], [POD.x, 2.6, POD.z], 30]),
  veg: { r0: 30, rImp: 90 }, shadow: { x: POD.x, z: POD.z + 6, r: 30 },
  setup(c) {
    c.proto('podium', 0, POD.x, POD.z, 0, 1);
    const o = c.person('ORUN', { x: POD.x, z: POD.z - 0.3, dy: 1.2, yaw: 0, acc: BLUE });
    o.anim = (P, t) => P.pose('armsOpen', t);
    for (const s of [-1, 1]) { c.proto('bannerBlue', 0, POD.x + s * 3.4, POD.z - 0.6, 0, 1.15); c.fire(POD.x + s * 2.6, POD.z + 1.8, { size: 0.45, n: 16, lightIntensity: 14, lightDist: 16, dy: 1.6 }); }
    const cr = crowdDisc(c, 380, PLAZA.x, PLAZA.z + 4, 1, 12, POD.x, POD.z, { colors: [0xf2f2f2, 0xe8e8e8, 0xeeeeea, 0x2a5bd7], seed: 4, sx: 1.3, keep: (x, z) => z > POD.z + 3.2 && Math.hypot(x - PLAZA.x + 2.6, z - PLAZA.z - 12) > 6 });
    const tf = new TorchField(70); c.add(tf.group);
    const P = []; for (let i = 0; i < 70; i++) { const k = i * 5; P.push([cr.pos[k * 3] + 0.25, cr.pos[k * 3 + 1] + 2.05, cr.pos[k * 3 + 2]]); }
    tf.setPositions(P);
    // a few full figures close to camera, fists up
    [['V3', -1.6, 1.2], ['V7', 1.6, 0.4], ['V11', -0.4, -0.8], ['V15', 2.4, -1.6]].forEach(([w, dx, dz], i) => {
      const x = PLAZA.x - 2.5 + dx, z = PLAZA.z + 7 + dz;
      const p = c.person(w, { x, z, yaw: yawTo(x, z, POD.x, POD.z), acc: i % 2 ? BLUE : ['torch'] });
      if (i % 2 === 0) c.torch(p);
      p.anim = (Q, t) => Q.pose(i % 2 ? 'cheer' : 'holdTorch', t + i, { phase: i });
    });
  },
});
// h03: flash-forward — the King on the palace landing, guards, red banners (low angle)
shot('op3', 'h03', {
  hours: TIME.sunset - 0.25, cloud: 0.4, year: 1700,
  cam: K([0, castleLocal(0.9, 1.2, 19.5), castleLocal(0, 4.4, 6.7), 30], [1, castleLocal(0.7, 1.1, 18.2), castleLocal(0, 4.5, 6.7), 27], { abs: true }),
  veg: { r0: 30, rImp: 90 }, shadow: { x: LANDING[0], z: LANDING[2], r: 25 },
  setup(c) {
    const k = c.personAt('KASSA7', LANDING[0], LANDING[1], LANDING[2], { yaw: CASTLE_YAW, acc: ['crown', 'cape'] });
    k.anim = (P, t) => P.pose('armsCrossed', t);
    [[-4.2, 3.0, 6.9], [4.2, 3.0, 6.9], [-5.6, 0, 10.4], [5.6, 0, 10.4]].forEach(([lx, ly, lz], i) => {
      const p = castleLocal(lx, ly, lz);
      const g = c.personAt('V' + (20 + i), p[0], p[1], p[2], { yaw: CASTLE_YAW, acc: GUARD });
      g.anim = (P, t) => P.pose('pushSpear', t, { phase: i });
    });
    for (const s of [-1, 1]) { const b = castleLocal(s * 5.6, 3.0, 6.2); c.proto('bannerRed', 0, b[0], b[2], CASTLE_YAW, 1.25, 0, { y: b[1] }); }
  },
});
// h04: the twenty founders in the meadow, slow orbit
shot('op4', 'h04', {
  hours: TIME.morning, cloud: 0.4, year: 0, town: false,
  cam: orbitCam([M.x, M.z], 15, 3.2, 2.2, 2.9, 38, 1.0),
  veg: { grassR: 22, extra: MEADOW_TREES },
  setup(c) { founders(c, (w, i) => ({ pose: i % 5 === 0 ? 'lookUp' : 'idle', p: { look: 1 } })); },
});
// h05 a/b/c: fire / animals / farms-cities-temples
shot('op5a', 'h05', {
  hours: TIME.night, cloud: 0.2, year: 3, town: false, exposure: 1.15,
  cam: K([0, [CAMP.x - 4, 1.2, CAMP.z - 3.5], [CAMP.x, 0.8, CAMP.z], 34], [1, [CAMP.x - 3.4, 1.0, CAMP.z - 3.9], [CAMP.x, 0.8, CAMP.z], 32]),
  veg: { grassR: 10, extra: MEADOW_TREES }, shadow: { x: CAMP.x, z: CAMP.z, r: 15 },
  setup(c) {
    c.fire(CAMP.x, CAMP.z, { size: 1.0, smoke: true, lightIntensity: 22, lightDist: 18 }); c.proto('firePit', 0, CAMP.x, CAMP.z);
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
// h06: money (granary + baskets) / gods (temple at night)
shot('op6a', 'h06', {
  hours: TIME.afternoon, cloud: 0.3, year: 560,
  cam: K([0, [GRANARY_K.x - 9, 1.7, GRANARY_K.z - 8], [GRANARY_K.x, 1.6, GRANARY_K.z], 36], [1, [GRANARY_K.x - 8, 1.6, GRANARY_K.z - 7.4], [GRANARY_K.x, 1.7, GRANARY_K.z], 34]),
  veg: { r0: 30 }, shadow: { x: GRANARY_K.x, z: GRANARY_K.z, r: 20 },
  setup(c) {
    const k = c.person('KASSA', { x: GRANARY_K.x - 3.4, z: GRANARY_K.z - 3.6, yaw: -2.4 }); k.anim = (P, t) => P.pose('armsCrossed', t);
    c.protos('grainBasket', 0, [...Array(9)].map((_, i) => [GRANARY_K.x - 5 + (i % 3) * 0.75, GRANARY_K.z - 2.2 + Math.floor(i / 3) * 0.7, i, 1.1]));
  },
});
shot('op6b', 'h06', {
  hours: TIME.dusk + 0.25, cloud: 0.2, year: 1300, exposure: 1.1,
  cam: K([0, templeLocal(-14, 3, 40), templeLocal(0, 10, 0), 36], [1, templeLocal(-12, 3, 37), templeLocal(0, 10, 0), 34], { abs: true }),
  veg: { r0: 30 },
  setup(c) { for (const [lx, lz] of [[-5, 5.4], [5, 5.4], [-9.6, 9.7], [9.6, 9.7]]) { const p = templeLocal(lx, lz < 6 ? 6.48 : 3.2, lz); c.fire(p[0], p[2], { size: 0.6, n: 16, lightIntensity: 14, lightDist: 18, y: p[1] + 0.2 }); } },
}, 1.4);
// h07: slow push towards the castle on the hill at dusk
shot('op7', 'h07', {
  hours: TIME.sunset, cloud: 0.35, year: 1800,
  cam: K([0, [CASTLE.x - 120, 25, CASTLE.z - 140], [CASTLE.x, 14, CASTLE.z], 34], [1, [CASTLE.x - 95, 22, CASTLE.z - 110], [CASTLE.x, 14, CASTLE.z], 32]),
  veg: { r0: 30, rImp: 120 },
});
// h08: the copper crown lying on the palace steps (a flash-forward)
const CROWN_AT = castleLocal(0.4, 3.02, 7.6);
shot('op8', 'h08', {
  hours: TIME.dawn + 0.4, cloud: 0.3, year: 1931,
  cam: K([0, castleLocal(1.3, 3.55, 9.4), castleLocal(0.4, 3.12, 7.6), 30], [1, castleLocal(1.1, 3.45, 9.0), castleLocal(0.4, 3.12, 7.6), 26], { abs: true }),
  veg: { r0: 20 }, shadow: { x: CROWN_AT[0], z: CROWN_AT[2], r: 10 },
  setup(c) { crownProp(c, CROWN_AT[0], CROWN_AT[2], CROWN_AT[1]); },
});
export function crownProp(c, x, z, yAbs, tilt = 0.25) {
  const crown = crownMesh(); crown.rotation.z = tilt; crown.position.set(x, yAbs, z); crown.scale.setScalar(1.15); return c.add(crown);
}
// h09: Kassa VII on top of the temple turns to camera, sunset, red banners
shot('op9', 'h09', {
  hours: TIME.sunset - 0.15, cloud: 0.45, year: 1430,
  cam: K([0, templeLocal(2.6, 5.6, 13.0), templeLocal(0, 7.6, 4.7), 30], [1, templeLocal(2.2, 5.5, 12.3), templeLocal(0, 7.7, 4.7), 27], { abs: true }),
  veg: { r0: 20 }, shadow: { x: TEMPLE_TOP[0], z: TEMPLE_TOP[2], r: 16 },
  setup(c) {
    const k = c.personAt('KASSA7', TEMPLE_TOP[0], TEMPLE_TOP[1], TEMPLE_TOP[2], { yaw: TEMPLE_YAW + Math.PI, acc: ['crown', 'cape'] });
    k.anim = (P, t) => { P.pose('idle', t); const u = Math.min(1, Math.max(0, (t - 0.2) / 1.3)); P.root.rotation.y = TEMPLE_YAW + Math.PI * (1 - u * u * (3 - 2 * u)); };
    for (const s of [-1, 1]) { const b = templeLocal(s * 3.3, 6.48, 4.9); c.proto('bannerRed', 0, b[0], b[2], TEMPLE_YAW, 1.0, 0, { y: b[1] }); }
  },
});
// TITLE: sweeping aerial at golden hour over the grown civilization
shot('title', 'title', {
  hours: TIME.golden, cloud: 0.4, year: 1700,
  cam: K([0, [-420, 210, -360], [40, 0, 40], 42], [1, [-330, 170, -300], [40, 0, 40], 40]),
  veg: { r0: 0, rImp: 0, r1: 800, rFar: 2600 },
});
