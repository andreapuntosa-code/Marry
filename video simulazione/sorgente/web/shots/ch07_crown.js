// CHAPTER VII — THE CROWN (years 1000-1900)
import * as THREE from 'three';
import { shot } from './registry.js';
import { mulberry32 } from '../lib/noise.js';
import { VILLAGERS, crownMesh } from '../lib/people.js';
import { PROTO } from '../lib/buildings.js';
import { K, orbitCam, TIME, PRIMA, RIVERBANK, HILL, TEMPLE, CASTLE, PLAZA, BRIDGE, GRANARY_K, yawTo, lerpAngle, smooth, eraAcc, crowdDisc,
  templeLocal, castleLocal, TEMPLE_TOP, TEMPLE_FOOT, TEMPLE_YAW, CASTLE_YAW, LANDING, STAIRS_FOOT, templeStairY, GUARD, fieldNear, wheat } from './sets.js';
import { buildRoom, creator, roomAt, cereal } from './room.js';

const vill = (c, i, x, z, o = {}) => c.person(VILLAGERS[i % VILLAGERS.length], { x, z, acc: eraAcc(o.era || 'stone', i), ...o });
const RFIELD = fieldNear(-40, -70, 1100);
const STEP = (lz) => templeLocal(0, templeStairY(lz), lz);       // a point on the temple stairs
const ROYAL = [[8, -6], [60, 20], [64, 46], [98, 78]];           // the royal road

shot('c_card', 'chap:c01', {
  hours: TIME.dawn + 0.4, cloud: 0.4, year: 1010,
  cam: K([0, templeLocal(-60, 18, 70), templeLocal(0, 8, 0), 36], [1, templeLocal(-52, 16, 62), templeLocal(0, 8, 0), 36], { abs: true }),
  veg: { r0: 40 },
});
// c01: Prima kept growing — the wheel, writing, bronze, stone, two thousand AIs
shot('c01a', 'c01', {
  hours: TIME.morning, cloud: 0.4, year: 1020,
  cam: K([0, [-90, 50, -70], [0, 0, 0], 38], [1, [-80, 46, -62], [0, 0, 0], 38]),
  veg: { r0: 30, rImp: 220 },
});
shot('c01b', 'c01', {   // the wheel
  hours: TIME.morning + 0.6, cloud: 0.4, year: 1040,
  cam: K([0, [-6, 0.8, -14], [2, 0.8, -6], 30], [1, [0, 0.8, -14.5], [8, 0.8, -6], 30]),
  veg: { r0: 40 }, shadow: { x: 2, z: -8, r: 12 },
  setup(c) {
    const cart = c.proto('cart', 0, 0, -8, 0, 1); const wh = [c.proto('wheel', 0, 0, -8, 0, 1), c.proto('wheel', 0, 0, -8, 0, 1)];
    const cow = c.animal('cow', 1, 0, -8, 1.57);
    c.on(t => {
      const x = -4 + t * 1.6, z = -7.6, y = c.h(x, z);
      cart.position.set(x, y, z); cart.rotation.y = 0;
      wh.forEach((w, k) => { w.position.set(x, y + 0.5, z + (k ? 0.62 : -0.62)); w.rotation.set(0, 0, -t * 1.6 / 0.46); });
      cow.root.position.set(x + 3.2, c.h(x + 3.2, z), z); cow.root.rotation.y = 1.57; cow.animate(t, { speed: 0.5 });
    });
    const d = vill(c, 1, 0, -6.4); d.anim = (P, t) => c.walkTo(P, -2.6, -6.6, -2.6 + 1.6 * 3.2, -6.6, t, 0, 3.2, { speed: 0.6, yaw: 1.57 });
  },
}, 1.6);
shot('c01c', 'c01', {   // writing
  hours: TIME.afternoon, cloud: 0.4, year: 1060,
  cam: K([0, [-0.4, 1.6, -8.4], [-3.8, 0.9, -5.3], 32], [1, [-0.6, 1.55, -8.1], [-3.8, 0.9, -5.3], 30]),
  veg: { r0: 40 }, shadow: { x: -3.4, z: -5.5, r: 5 },
  setup(c) {
    const s = c.proto('slab', 0, -3.6, -4.9, yawTo(-3.6, -4.9, -1.4, -7.4), 0.7);
    const w = vill(c, 3, -4.3, -5.9, { yaw: yawTo(-4.3, -5.9, -3.6, -4.9) }); w.anim = (P, t) => { P.pose('idle', t); P.R.sh.rotation.x = -1.25 + Math.sin(t * 10) * 0.06; P.R.el.rotation.x = -0.5; P.head.rotation.x = 0.3; };
  },
}, 3.25);
shot('c01d', 'c01', {   // bronze
  hours: TIME.afternoon + 0.5, cloud: 0.45, year: 1080,
  cam: K([0, [-21.6, 1.4, -18.4], [-25.8, 0.9, -20.6], 32], [1, [-21.9, 1.38, -18.6], [-25.8, 0.9, -20.6], 30]),
  veg: { r0: 40 }, shadow: { x: -25.8, z: -20.5, r: 6 },
  setup(c) {
    c.proto('forge', 0, -27.0, -19.6, 0.5, 1); c.fire(-27.0, -19.5, { size: 0.45, n: 14, lightIntensity: 10, lightDist: 8, dy: 0.95 });
    c.proto('anvil', 0, -25.4, -20.6, 0.2, 1);
    const sm = vill(c, 5, -24.8, -21.4, { yaw: yawTo(-24.8, -21.4, -25.4, -20.6), acc: [{ type: 'belt', color: 0x3a2a1a }] });
    sm.anim = (P, t) => { P.pose('idle', t); const k = Math.max(0, Math.sin(t * 7)); P.R.sh.rotation.x = -1.6 + k * 1.0; P.R.el.rotation.x = -0.4; P.spine.rotation.x = 0.2; };
  },
}, 3.95);
shot('c01e', 'c01', {   // stone replaced mud, roads replaced paths (timelapse to 1400)
  yearFn: (t, d) => 1080 + 320 * smooth(0, 1, t / d), yearStep: 4, groundStep: 25,
  hoursFn: (t, d) => 8 + ((t / d) * 4 % 1) * 10, cloud: 0.4, tScale: 30, env: 0.6,
  cam: K([0, [-150, 85, -120], [10, 0, 0], 38], [1, [-90, 70, -165], [15, 0, 5], 38]),
  veg: { r0: 30, rImp: 220 },
}, 4.6);
function market(c, n = 300) {
  const cr = crowdDisc(c, n, PLAZA.x, PLAZA.z, 2, 17, PLAZA.x, PLAZA.z, { seed: 12, colors: [0xf2f2f2, 0xeeeeea, 0xe6e6e6, 0xd9c7a8, 0xb9c9d9] });
  return cr;
}
shot('c01f', 'c01', {   // two thousand AIs lived there
  hours: TIME.afternoon, cloud: 0.4, year: 1400,
  cam: K([0, [PLAZA.x - 30, 14, PLAZA.z - 24], [PLAZA.x, 1, PLAZA.z], 36], [1, [PLAZA.x - 24, 12, PLAZA.z - 28], [PLAZA.x, 1, PLAZA.z], 36]),
  veg: { r0: 40 }, shadow: { x: PLAZA.x, z: PLAZA.z, r: 30 },
  setup(c) { market(c, 420); },
}, 9.2);
shot('c01g', 'c01', {   // and two thousand AIs argue. A lot.
  hours: TIME.afternoon + 0.3, cloud: 0.4, year: 1400,
  cam: K([0, [PLAZA.x - 4.5, 1.6, PLAZA.z - 5], [PLAZA.x, 1.4, PLAZA.z], 30], [1, [PLAZA.x - 4.0, 1.55, PLAZA.z - 4.4], [PLAZA.x, 1.4, PLAZA.z], 28]),
  veg: { r0: 40 }, shadow: { x: PLAZA.x, z: PLAZA.z, r: 10 },
  setup(c) {
    [[-0.8, 0.2, 'talk'], [0.8, -0.2, 'facepalm'], [0.2, 1.4, 'shrug'], [-1.6, 1.2, 'talk'], [1.6, 1.0, 'point'], [0, -1.4, 'armsCrossed']].forEach(([dx, dz, pose], i) => {
      const x = PLAZA.x + dx, z = PLAZA.z + dz; const P = vill(c, i + 8, x, z, { yaw: yawTo(x, z, PLAZA.x, PLAZA.z + 0.3) }); P.anim = (Q, t) => Q.pose(pose, t * 1.5 + i, { phase: i });
    });
    market(c, 200);
  },
}, 11.2);
// c02: who gets the river fields? who fixes the bridge? who decides anything?
shot('c02a', 'c02', {
  hours: TIME.morning + 1, cloud: 0.4, year: 1400,
  cam: K([0, [RFIELD.x - 18, 1.6, RFIELD.z - 8], [RFIELD.x - 9, 1.3, RFIELD.z - 3], 30], [1, [RFIELD.x - 17.4, 1.6, RFIELD.z - 7.4], [RFIELD.x - 9, 1.3, RFIELD.z - 3], 28]),
  veg: { grassR: 0, r0: 40 }, shadow: { x: RFIELD.x - 9, z: RFIELD.z - 3, r: 10 },
  setup(c) { wheat(c, RFIELD, 2); const a = vill(c, 14, RFIELD.x - 9.6, RFIELD.z - 3.2, { yaw: 1.2 }); a.anim = (P, t) => P.pose('point', t, { aim: 0.4 }); const b = vill(c, 15, RFIELD.x - 8.2, RFIELD.z - 2.6, { yaw: -1.9 }); b.anim = (P, t) => P.pose('talk', t * 1.6); },
});
shot('c02b', 'c02', {
  hours: TIME.morning + 1.5, cloud: 0.45, year: 1400,
  cam: K([0, [-103, 1.7, -5], [-90, 2.5, 18], 32], [1, [-102.5, 1.7, -4.2], [-90, 2.5, 18], 30]),
  veg: { r0: 40 }, shadow: { x: -97, z: 2, r: 14 },
  setup(c) {
    [[-97.6, 0.6, 'talk'], [-96.2, 1.6, 'shrug'], [-96.6, -0.4, 'facepalm']].forEach(([x, z, pose], i) => { const P = vill(c, i + 18, x, z, { yaw: yawTo(x, z, -96.8, 0.6) + (i - 1) * 0.3 }); P.anim = (Q, t) => Q.pose(pose, t * 1.4 + i, { phase: i }); });
  },
}, 1.55);
shot('c02c', 'c02', {
  hours: TIME.afternoon, cloud: 0.4, year: 1400,
  cam: K([0, [PLAZA.x + 16, 9, PLAZA.z - 16], [PLAZA.x, 1, PLAZA.z], 36], [1, [PLAZA.x + 13, 8, PLAZA.z - 18], [PLAZA.x, 1, PLAZA.z], 36]),
  veg: { r0: 40 }, shadow: { x: PLAZA.x, z: PLAZA.z, r: 22 },
  setup(c) { market(c, 380); for (let i = 0; i < 6; i++) { const a = i * 1.05, x = PLAZA.x + Math.cos(a) * 4, z = PLAZA.z + Math.sin(a) * 4; const P = vill(c, i + 24, x, z, { yaw: yawTo(x, z, PLAZA.x, PLAZA.z) }); P.anim = (Q, t) => Q.pose(['talk', 'point', 'shrug'][i % 3], t * 1.5 + i, { phase: i }); } },
}, 2.8);
// c03: Kassa's family never let go of that hill
shot('c03', 'c03', {
  hours: TIME.golden - 0.3, cloud: 0.4, year: 1410,
  cam: K([0, [HILL.x - 70, 22, HILL.z - 66], [HILL.x, 10, HILL.z], 36], [1, [HILL.x - 50, 18, HILL.z - 48], [HILL.x, 11, HILL.z], 34]),
  veg: { r0: 40 }, shadow: { x: HILL.x - 15, z: HILL.z - 15, r: 40 },
  setup(c) {
    const bx = HILL.x - 18, bz = HILL.z - 20;
    for (const [dx, dz] of [[-4, 0], [4, 1], [10, 6]]) c.proto('bannerRed', 0, bx + dx, bz + dz, 0.8, 1.2);
    const k = c.person('KASSA7', { x: bx, z: bz, yaw: yawTo(bx, bz, -20, -20) }); k.anim = (P, t) => P.pose('armsCrossed', t);
    [[-1.4, 0.8], [1.3, 0.9], [0.2, 1.8]].forEach(([dx, dz], i) => { const P = c.person(VILLAGERS[40 + i], { x: bx + dx, z: bz + dz, yaw: yawTo(bx, bz, -20, -20), color: [0xc9283f, 0xb52235, 0xd2384c][i], acc: eraAcc('stone', i) }); P.anim = (Q, t) => Q.pose('idle', t + i); });
  },
});
// c04a: year 1420 — Kassa the Seventh climbs the steps of the temple
shot('c04a', 'c04', {
  hours: TIME.afternoon + 0.6, cloud: 0.35, year: 1420,
  cam: K([0, templeLocal(3.5, 2.0, 20), templeLocal(0, 3.5, 9), 34], [1, templeLocal(2.4, 4.4, 15.5), templeLocal(0, 6.5, 5), 32], { abs: true }),
  veg: { r0: 40 }, shadow: { x: TEMPLE.x, z: TEMPLE.z, r: 22 },
  setup(c) {
    const k = c.person('KASSA7', { acc: ['cape'] });
    k.anim = (P, t) => { const u = Math.min(1, t / (c.dur - 0.3)); const lz = 13.6 - u * 8.9; const p = STEP(lz); P.place(p[0], p[1], p[2], TEMPLE_YAW + Math.PI); P.pose(u < 1 ? 'walk' : 'idle', t, { speed: 0.6 }); };
    crowdDisc(c, 300, TEMPLE_FOOT[0], TEMPLE_FOOT[2], 3, 16, TEMPLE.x, TEMPLE.z, { seed: 21, keep: (x, z) => Math.hypot(x - TEMPLE.x, z - TEMPLE.z) > 14.5 });
  },
});
shot('c04b', 'c04', {
  hours: TIME.afternoon + 0.7, cloud: 0.35, year: 1420,
  cam: K([0, templeLocal(1.8, 5.2, 11.6), templeLocal(0, 7.9, 4.7), 30], [1, templeLocal(1.5, 5.1, 11.0), templeLocal(0, 8.0, 4.7), 28], { abs: true }),
  veg: { r0: 40 }, shadow: { x: TEMPLE_TOP[0], z: TEMPLE_TOP[2], r: 14 },
  setup(c) {
    const k = c.personAt('KASSA7', TEMPLE_TOP[0], TEMPLE_TOP[1], TEMPLE_TOP[2], { yaw: TEMPLE_YAW + Math.PI, acc: ['cape'] });
    k.anim = (P, t) => { P.pose(t > 1.6 ? 'armsOpen' : 'idle', t); P.root.rotation.y = TEMPLE_YAW + Math.PI * (1 - smooth(0.1, 1.4, t)); };
  },
}, 4.6);
// c04L: "The Observer spoke to me..." — over his shoulder, the crowd below
shot('c04L', 'c04L', {
  hours: TIME.afternoon + 0.8, cloud: 0.35, year: 1420,
  cam: K([0, templeLocal(0.55, 8.5, 2.9), templeLocal(0, 0, 22), 38], [1, templeLocal(0.5, 8.4, 3.1), templeLocal(0, 0, 22), 36], { abs: true }),
  veg: { r0: 40 }, shadow: { x: TEMPLE_FOOT[0], z: TEMPLE_FOOT[2], r: 22 },
  setup(c) {
    const k = c.personAt('KASSA7', TEMPLE_TOP[0], TEMPLE_TOP[1], TEMPLE_TOP[2], { yaw: TEMPLE_YAW, acc: ['cape'] }); k.anim = (P, t) => P.pose('armsOpen', t);
    crowdDisc(c, 420, TEMPLE_FOOT[0], TEMPLE_FOOT[2], 3, 18, TEMPLE_TOP[0], TEMPLE_TOP[2], { seed: 22, keep: (x, z) => Math.hypot(x - TEMPLE.x, z - TEMPLE.z) > 14.5 });
  },
});
// c05: I was eating cereal
shot('c05', 'c05', {
  interior: true, hours: 9, year: 1420,
  cam: K([0, roomAt(-1.2, 1.3, 1.9), roomAt(0, 1.0, 0.4), 38], [1, roomAt(-1.0, 1.25, 1.6), roomAt(0, 1.0, 0.4), 34], { abs: true }),
  setup(c) { buildRoom(c, { year: 1420, pop: '2,031', lamp: 2.2 }); creator(c, 'eat'); cereal(c); },
});
// c06a: the high priest Varo got three hundred baskets of grain that week
shot('c06a', 'c06', {
  hours: TIME.morning + 1, cloud: 0.35, year: 1420,
  cam: K([0, templeLocal(1.5, 1.6, 19.6), templeLocal(-1.4, 1.2, 15.0), 32], [1, templeLocal(1.2, 1.55, 19.0), templeLocal(-1.4, 1.2, 15.0), 30], { abs: true }),
  veg: { r0: 40 }, shadow: { x: TEMPLE_FOOT[0], z: TEMPLE_FOOT[2], r: 12 },
  setup(c) {
    const vp = templeLocal(-1.4, 0, 15.0);
    const v = c.person('VARO', { x: vp[0], z: vp[2], yaw: TEMPLE_YAW + Math.PI * 0.7 }); v.anim = (P, t) => P.pose('armsCrossed', t);
    const pile = [];
    for (let i = 0; i < 16; i++) pile.push(c.proto('grainBasket', 0, vp[0] + 1.6 + (i % 4) * 0.62, vp[2] - 1 + Math.floor(i / 4) * 0.6, i, 1.0));
    c.on(t => pile.forEach((m, i) => { m.visible = i < 4 + t * 2.2; }));
    for (let i = 0; i < 5; i++) {
      const s0 = templeLocal(-10 - i * 1.6, 0, 24 + i * 0.8), s1 = templeLocal(0.6, 0, 16.5);
      const P = vill(c, 28 + i, s0[0], s0[2], { acc: ['basket'] });
      P.anim = (Q, t) => c.walkTo(Q, s0[0], s0[2], s1[0], s1[2], (t + i * 1.1) % 5.5, 0, 5.5, { movePose: 'carry', speed: 0.6, phase: i });
    }
  },
});
shot('c06b', 'c06', {   // ...and suddenly, the Observer had definitely chosen Kassa
  hours: TIME.afternoon + 0.9, cloud: 0.35, year: 1420,
  cam: K([0, templeLocal(2.6, 5.6, 12), templeLocal(0, 7.8, 4.7), 30], [1, templeLocal(2.2, 5.5, 11.2), templeLocal(0, 7.9, 4.7), 28], { abs: true }),
  veg: { r0: 40 }, shadow: { x: TEMPLE_TOP[0], z: TEMPLE_TOP[2], r: 12 },
  setup(c) {
    const kp = templeLocal(0.7, 6.48, 4.7), vp = templeLocal(-0.8, 6.48, 4.8);
    const k = c.personAt('KASSA7', kp[0], kp[1], kp[2], { yaw: TEMPLE_YAW, acc: ['cape'] }); k.anim = (P, t) => { P.pose('idle', t); if (t > 1.6) { P.L.sh.rotation.z = -2.7 * smooth(1.6, 2.2, t); } };
    const v = c.personAt('VARO', vp[0], vp[1], vp[2], { yaw: TEMPLE_YAW + 0.4 }); v.anim = (P, t) => { P.pose('idle', t); P.R.sh.rotation.z = 2.5 * smooth(1.4, 2.0, t); P.R.sh.rotation.x = -0.2; };
  },
}, 5.6);
// c07: the first king in history — the crown descends
shot('c07', 'c07', {
  hours: TIME.golden, cloud: 0.35, year: 1420,
  cam: K([0, templeLocal(0.9, 7.6, 7.2), templeLocal(0, 8.0, 4.7), 26], [1, templeLocal(0.8, 7.7, 6.8), templeLocal(0, 8.1, 4.7), 24], { abs: true }),
  veg: { r0: 40 }, shadow: { x: TEMPLE_TOP[0], z: TEMPLE_TOP[2], r: 8 },
  setup(c) {
    const k = c.personAt('KASSA7', TEMPLE_TOP[0], TEMPLE_TOP[1], TEMPLE_TOP[2], { yaw: TEMPLE_YAW, acc: ['cape'] }); k.anim = (P, t) => P.pose('bow', t, { amount: 0.25 * (1 - smooth(1.4, 2.0, t)) });
    const vp = templeLocal(-0.7, 6.48, 4.2);
    const v = c.personAt('VARO', vp[0], vp[1], vp[2], { yaw: TEMPLE_YAW + 0.9 }); v.anim = (P, t) => { P.pose('idle', t); P.L.sh.rotation.x = -2.3; P.R.sh.rotation.x = -2.3; P.L.el.rotation.x = -0.4; P.R.el.rotation.x = -0.4; };
    const cr = crownMesh(); c.add(cr);
    c.after(t => { k.root.updateMatrixWorld(true); const hp = new THREE.Vector3(); k.head.getWorldPosition(hp); const u = smooth(0, 1.4, t); cr.position.set(hp.x, hp.y + 0.33 * 0.92 * 1.1 + (1 - u) * 0.6, hp.z); cr.scale.setScalar(1.05 * 0.92 * 1.1); });
  },
});
// c08: "King Kassa." — hero low angle
shot('c08', 'c08', {
  hours: TIME.sunset - 0.1, cloud: 0.4, year: 1420,
  cam: K([0, templeLocal(1.2, 5.4, 8.6), templeLocal(0, 8.0, 4.7), 30], [1, templeLocal(1.0, 5.3, 8.2), templeLocal(0, 8.1, 4.7), 27], { abs: true }),
  veg: { r0: 40 }, shadow: { x: TEMPLE_TOP[0], z: TEMPLE_TOP[2], r: 10 },
  setup(c) {
    const k = c.personAt('KASSA7', TEMPLE_TOP[0], TEMPLE_TOP[1], TEMPLE_TOP[2], { yaw: TEMPLE_YAW, acc: ['crown', 'cape'] }); k.anim = (P, t) => P.pose('armsCrossed', t);
    for (const sx of [-1, 1]) { const b = templeLocal(sx * 3.3, 6.48, 4.9); c.proto('bannerRed', 0, b[0], b[2], TEMPLE_YAW, 1.0, 0, { y: b[1] }); }
  },
});
// c09: a crown of copper / a palace on the hill / the first laws
shot('c09a', 'c09', {
  hours: TIME.afternoon, cloud: 0.35, year: 1421,
  cam: K([0, [PLAZA.x + 1.4, 1.25, PLAZA.z - 1.4], [PLAZA.x, 1.02, PLAZA.z], 28], [1, [PLAZA.x - 0.3, 1.22, PLAZA.z - 1.9], [PLAZA.x, 1.02, PLAZA.z], 26]),
  veg: { r0: 40 }, shadow: { x: PLAZA.x, z: PLAZA.z, r: 4 },
  setup(c) { c.proto('pedestal', 0, PLAZA.x, PLAZA.z, 0, 0.9); const cr = crownMesh(); cr.position.set(PLAZA.x, c.h(PLAZA.x, PLAZA.z) + 1.0, PLAZA.z); cr.scale.setScalar(1.6); c.add(cr); c.on(t => { cr.rotation.y = t * 0.8; }); },
});
shot('c09b', 'c09', {
  yearFn: (t, d) => 1420.7 + 3.4 * smooth(0, 1, t / d), yearStep: 0.04, groundStep: 50,
  hoursFn: (t, d) => 7 + ((t / d) * 3 % 1) * 12, cloud: 0.4, tScale: 25, env: 0.6,
  cam: K([0, castleLocal(-30, 22, 60), castleLocal(0, 6, 0), 36], [1, castleLocal(-24, 20, 52), castleLocal(0, 7, 0), 36], { abs: true }),
  veg: { r0: 40 }, shadow: { x: CASTLE.x, z: CASTLE.z, r: 35 },
}, 1.6);
shot('c09c', 'c09', {
  hours: TIME.afternoon + 0.5, cloud: 0.35, year: 1425,
  cam: K([0, [PLAZA.x - 2.0, 1.5, PLAZA.z - 4.6], [PLAZA.x - 0.4, 1.1, PLAZA.z + 0.8], 34], [1, [PLAZA.x - 1.8, 1.48, PLAZA.z - 4.3], [PLAZA.x - 0.4, 1.1, PLAZA.z + 0.8], 32]),
  veg: { r0: 40 }, shadow: { x: PLAZA.x, z: PLAZA.z, r: 6 },
  setup(c) {
    c.proto('slab', 0, PLAZA.x + 0.6, PLAZA.z + 0.8, Math.PI + 0.7, 1.3);
    const sc = vill(c, 6, PLAZA.x - 0.2, PLAZA.z + 0.2, { yaw: 0.7 }); sc.anim = (P, t) => { P.pose('idle', t); P.R.sh.rotation.x = -1.3 + Math.sin(t * 9) * 0.06; P.R.el.rotation.x = -0.4; };
    const k = c.person('KASSA7', { x: PLAZA.x - 1.6, z: PLAZA.z + 1.4, yaw: yawTo(PLAZA.x - 1.6, PLAZA.z + 1.4, PLAZA.x + 0.6, PLAZA.z + 0.8), acc: ['crown', 'cape'] }); k.anim = (P, t) => P.pose('point', t, { aim: -0.2 });
  },
}, 3.4);
// c10a: one third of every harvest goes to the palace
shot('c10a', 'c10', {
  hours: TIME.afternoon, cloud: 0.35, year: 1430,
  cam: K([0, [56, 12, 0], [70, 10, 40], 36], [1, [52, 12, 6], [72, 11, 46], 36]),
  veg: { r0: 40 }, shadow: { x: 62, z: 32, r: 30 },
  setup(c) {
    for (let i = 0; i < 12; i++) {
      const u0 = i / 12;
      const P = vill(c, i, 0, 0, { acc: ['basket'] });
      P.anim = (Q, t) => { const u = (u0 + t * 0.05) % 1; const seg = u * 3, k = Math.min(2, Math.floor(seg)), f = seg - k; const [ax, az] = ROYAL[k], [bx, bz] = ROYAL[k + 1]; const x = ax + (bx - ax) * f + 1.2 * ((i % 2) - 0.5), z = az + (bz - az) * f; Q.place(x, c.h(x, z), z, Math.atan2(bx - ax, bz - az)); Q.pose('carry', t + i, { phase: i, speed: 0.6 }); };
    }
  },
});
shot('c10b', 'c10', {   // nobody leaves the town without the king's permission
  hours: TIME.afternoon + 0.4, cloud: 0.4, year: 1430,
  cam: K([0, [11, 1.6, -168], [15, 1.4, -158], 32], [1, [11.5, 1.55, -167], [15, 1.4, -158], 30]),
  veg: { r0: 40 }, shadow: { x: 15, z: -160, r: 10 },
  setup(c) {
    [[-1.2, 0], [1.2, 0]].forEach(([dx], i) => { const P = c.person(VILLAGERS[44 + i], { x: 15 + dx, z: -160, yaw: 0, acc: GUARD }); P.anim = (Q, t) => { Q.pose('pushSpear', t); Q.R.sh.rotation.z = i ? 0.5 : -0.2; }; });
    const v = vill(c, 9, 15, -153, { yaw: Math.PI }); v.anim = (P, t) => c.walkTo(P, 15, -153, 15, -157.6, t, 0, 1.6, { endPose: 'shrug' });
  },
}, 2.9);
shot('c10c', 'c10', {   // and nobody questions the Observer's choice
  hours: TIME.golden - 0.2, cloud: 0.35, year: 1430,
  cam: K([0, templeLocal(-3.5, 2.6, 25), templeLocal(0, 3.2, 10), 32], [1, templeLocal(-3.0, 2.5, 24), templeLocal(0, 3.3, 10), 30], { abs: true }),
  veg: { r0: 40 }, shadow: { x: TEMPLE_FOOT[0], z: TEMPLE_FOOT[2], r: 18 },
  setup(c) {
    const vp = templeLocal(0, templeStairY(10), 10); const v = c.personAt('VARO', vp[0], vp[1], vp[2], { yaw: TEMPLE_YAW }); v.anim = (P, t) => P.pose('armsOpen', t);
    for (let i = 0; i < 14; i++) { const a = (i / 14 - 0.5) * 2.0, d = 6 + (i % 3) * 1.4; const p = templeLocal(Math.sin(a) * d, 0, 16 + Math.cos(a) * d * 0.5); const P = vill(c, i + 10, p[0], p[2], { yaw: TEMPLE_YAW + Math.PI }); P.anim = (Q, t) => Q.pose('bow', t + i, { amount: 0.8 }); }
  },
}, 6.3);
// c11: for a while... it worked
shot('c11', 'c11', {
  hours: TIME.golden, cloud: 0.4, year: 1450,
  cam: K([0, [-180, 60, -60], [10, 0, 10], 36], [1, [-160, 56, -84], [10, 0, 10], 36]),
  veg: { r0: 30, rImp: 220 },
});
// c12: roads, walls, bigger granaries, a stone bridge by an engineer named Pell
shot('c12a', 'c12', {
  hours: TIME.morning + 1.5, cloud: 0.35, year: 1480,
  cam: K([0, [40, 14, -60], [100, 2, -60], 40], [1, [48, 14, -70], [110, 2, -70], 40]),
  veg: { r0: 40 },
});
shot('c12b', 'c12', {
  hours: TIME.morning + 1.7, cloud: 0.35, year: 1480,
  cam: K([0, [GRANARY_K.x - 26, 18, GRANARY_K.z - 26], [GRANARY_K.x, 3, GRANARY_K.z], 36], [1, [GRANARY_K.x - 22, 17, GRANARY_K.z - 28], [GRANARY_K.x, 3, GRANARY_K.z], 36]),
  veg: { r0: 40 }, shadow: { x: GRANARY_K.x, z: GRANARY_K.z, r: 16 },
}, 1.1);
shot('c12c', 'c12', {
  hours: TIME.afternoon, cloud: 0.35, year: 1481,
  cam: K([0, [-103.5, 1.6, -4.5], [-82, 4.0, 24], 34], [1, [-103, 1.6, -3.6], [-82, 4.0, 24], 32]),
  veg: { r0: 40 }, shadow: { x: -97, z: 2, r: 14 },
  setup(c) {
    const px = -97.2, pz = 1.6;
    const p = c.person('PELL', { x: px, z: pz, yaw: yawTo(px, pz, -103.5, -4.5) + 0.5 }); p.anim = (P, t) => P.pose(t > 2.4 ? 'point' : 'idle', t, { aim: 0.6 });
    c.proto('slab', 0, px + 1.0, pz + 0.6, 0.6, 0.55);
  },
}, 2.3);
shot('c12d', 'c12', {   // when the next flood came, nobody died
  hours: TIME.afternoon + 0.6, storm: 0.8, cloud: 0.9, year: 1530,
  cam: K([0, [BRIDGE.x + 30, 7, BRIDGE.z - 26], [BRIDGE.x, 4, BRIDGE.z], 36], [1, [BRIDGE.x + 27, 6.5, BRIDGE.z - 23], [BRIDGE.x, 4, BRIDGE.z], 34]),
  veg: { r0: 40 }, shadow: { x: BRIDGE.x + 6, z: BRIDGE.z - 6, r: 25 },
  setup(c) {
    c.rain(4000, 80, 0.38); c.water(-40, 10, 380, 380, () => 2.2);
    const by = c.h(BRIDGE.x, BRIDGE.z) - 0.15, ax = Math.cos(Math.PI / 2 + 0.15), az = -Math.sin(Math.PI / 2 + 0.15);
    for (let i = 0; i < 8; i++) { const u = (i + 0.5) / 8 - 0.5; const x = BRIDGE.x + u * 30 * ax, z = BRIDGE.z + u * 30 * az; const y = by + 3.6 + Math.sin(((u * 30) / 46 + 0.5) * Math.PI) * 1.6 + 0.35; const P = vill(c, i + 12, x, z, { y, yaw: 0.2 + (i % 3) * 0.6 }); P.anim = (Q, t) => { Q.pose(i % 3 ? 'idle' : 'point', t + i, { aim: -0.5 }); }; }
  },
}, 5.6);
// c13: his son became king, then his grandson — five hundred years of kings
function throne(c, who, opts = {}) {
  const s = castleLocal(0, 3.0, 6.9);
  c.proto('pedestal', 0, s[0], s[2], CASTLE_YAW, 0.6, 0, { y: s[1] });
  const k = c.personAt(who, s[0], s[1] + 0.02, s[2] + 0, { yaw: CASTLE_YAW, acc: ['crown', 'cape'], color: opts.color, energy: opts.energy });
  k.anim = opts.anim || ((P, t) => P.pose('sit', t, { seat: 0.66 }));
  return k;
}
shot('c13a', 'c13', {
  hours: TIME.sunset - 0.2, cloud: 0.4, year: 1470,
  cam: K([0, castleLocal(1.6, 3.9, 10.6), castleLocal(0, 3.9, 6.9), 30], [1, castleLocal(1.4, 3.85, 10.0), castleLocal(0, 3.9, 6.9), 28], { abs: true }),
  veg: { r0: 40 }, shadow: { x: LANDING[0], z: LANDING[2], r: 10 },
  setup(c) { const k = throne(c, 'KASSA7'); k.anim = (P, t) => { P.pose('sit', t, { seat: 0.66, headX: 0.15 + 0.4 * smooth(0.6, 2.2, t) }); P.setEnergy(1 - smooth(0.4, 2.2, t)); }; },
});
shot('c13b', 'c13', {
  hours: TIME.morning + 1, cloud: 0.4, year: 1500,
  cam: K([0, castleLocal(-1.8, 3.9, 10.8), castleLocal(0, 4.0, 6.9), 30], [1, castleLocal(-1.6, 3.85, 10.2), castleLocal(0, 4.0, 6.9), 28], { abs: true }),
  veg: { r0: 40 }, shadow: { x: LANDING[0], z: LANDING[2], r: 10 },
  setup(c) { throne(c, 'V36', { color: 0xc4203c }); },
}, 2.9);
const KING_COLORS = [0xd8213a, 0xb31b33, 0xc82a46, 0x9e1a30, 0xd0304a, 0xa81e38, 0xbf1f3a];
shot('c13c', 'c13', {
  hoursFn: (t, d) => 7 + ((t / d) * 6 % 1) * 11, cloud: 0.4, year: 1700, tScale: 20, env: 0.6,
  cam: K([0, castleLocal(0, 4.5, 16.5), castleLocal(0, 4.4, 6.9), 32], [1, castleLocal(0, 4.5, 15.5), castleLocal(0, 4.4, 6.9), 30], { abs: true }),
  veg: { r0: 40 }, shadow: { x: LANDING[0], z: LANDING[2], r: 14 },
  setup(c) {
    const ks = KING_COLORS.map((col, i) => { const k = throne(c, 'V' + (30 + i), { color: col }); k.root.visible = false; return k; });
    c.on(t => { const i = Math.min(ks.length - 1, Math.floor(t / (c.dur / ks.length))); ks.forEach((k, j) => { k.root.visible = j === i; }); });
  },
}, 4.6);
// c14: one third became one half — the pile at the palace grows
shot('c14', 'c14', {
  hours: TIME.afternoon, cloud: 0.4, year: 1800,
  cam: K([0, castleLocal(4.5, 1.4, 17), castleLocal(-3, 0.8, 13.5), 32], [1, castleLocal(4.2, 1.5, 16.2), castleLocal(-3, 0.8, 13.5), 30], { abs: true }),
  veg: { r0: 40 }, shadow: { x: STAIRS_FOOT[0], z: STAIRS_FOOT[2], r: 12 },
  setup(c) {
    const ms = []; for (let i = 0; i < 40; i++) { const p = castleLocal(-5 + (i % 8) * 0.62, 0, 14 + Math.floor(i / 8) * 0.6); ms.push(c.proto('grainBasket', 0, p[0], p[2], i, 1.0, 0, { y: p[1] + 0.05 + (i > 23 ? 0.3 : 0) })); }
    c.on(t => ms.forEach((m, i) => { m.visible = i < 12 + t * 7; }));
    [0, 1].forEach(i => { const p = castleLocal(-6.5 + i * 7.5, 0, 13); const g = c.personAt(VILLAGERS[44 + i], p[0], p[1], p[2], { yaw: CASTLE_YAW, acc: GUARD }); g.anim = (P, t) => P.pose('pushSpear', t); });
  },
});
// c15: the palace kept getting bigger / the riverbank kept getting hungrier
shot('c15a', 'c15', {
  hours: TIME.sunset - 0.1, cloud: 0.45, year: 1880,
  cam: K([0, [CASTLE.x - 60, 8, CASTLE.z - 64], [CASTLE.x, 14, CASTLE.z], 32], [1, [CASTLE.x - 52, 9, CASTLE.z - 56], [CASTLE.x, 14, CASTLE.z], 30]),
  veg: { r0: 40 },
  setup(c) { for (const [lx, lz] of [[-8, 13], [8, 13], [-13, 0], [13, 0]]) { const p = castleLocal(lx, 6.4, lz); c.proto('bannerRed', 0, p[0], p[2], CASTLE_YAW, 1.3, 0, { y: p[1] }); } },
});
shot('c15b', 'c15', {
  hours: TIME.afternoon, cloud: 0.7, year: 1880, grade: 'sad',
  cam: K([0, [RIVERBANK.x + 8, 1.3, RIVERBANK.z + 6], [RIVERBANK.x + 1, 0.8, RIVERBANK.z + 1], 30], [1, [RIVERBANK.x + 7.2, 1.25, RIVERBANK.z + 5.4], [RIVERBANK.x + 1, 0.8, RIVERBANK.z + 1], 28]),
  veg: { r0: 40 }, shadow: { x: RIVERBANK.x + 2, z: RIVERBANK.z + 2, r: 10 },
  setup(c) {
    const r = mulberry32(77);
    for (let i = 0; i < 6; i++) { const x = RIVERBANK.x + (r() - 0.5) * 7, z = RIVERBANK.z + 1 + (r() - 0.5) * 5; const P = vill(c, i + 2, x, z, { yaw: r() * 6.28, energy: 0.65, era: 'early' }); P.anim = (Q, t) => Q.pose(i % 2 ? 'sitGround' : 'headInHands', t + i, { headX: 0.4, seat: 0.3 }); c.proto('bowl', 0, x + 0.5, z + 0.4, 0, 0.18); }
  },
}, 2.4);
