// CHAPTER V — LEFTOVERS (years 340-610)
import * as THREE from 'three';
import { shot } from './registry.js';
import { mulberry32 } from '../lib/noise.js';
import { K, orbitCam, TIME, PRIMA, RIVERBANK, HILL, GRANARY_K, yawTo, lerpAngle, smooth, pebbles, eraAcc, crowdDisc, fieldNear, wheat } from './sets.js';
import { VILLAGERS } from '../lib/people.js';
const BIGF = fieldNear(-30, 70, 521);

const CLAY = { x: -56, z: -15 };
const KILN = { x: -40, z: -18 };
const GRAN = { x: -22, z: 2 };                  // the old village granary
const KMEN = ['spear', { type: 'headband', color: 0x8a1c24 }];
const FLOOD = (t0, t1, l0 = 0.62, l1 = 2.45) => (t) => l0 + (l1 - l0) * smooth(t0, t1, t);
const vill = (c, i, x, z, o = {}) => c.person(VILLAGERS[i % VILLAGERS.length], { x, z, acc: eraAcc(o.era || 'clay', i), ...o });

shot('k_card', 'chap:k01', {
  hours: TIME.morning, cloud: 0.45, year: 340,
  cam: K([0, [CLAY.x + 40, 24, CLAY.z - 50], [CLAY.x, 1, CLAY.z], 36], [1, [CLAY.x + 34, 20, CLAY.z - 42], [CLAY.x, 1, CLAY.z], 36]),
  veg: { r0: 40, rImp: 200 },
});
// k01: year 340 — a potter named Lio digs by the river
shot('k01a', 'k01', {
  hours: TIME.morning + 0.8, cloud: 0.45, year: 340,
  cam: K([0, [CLAY.x + 5.5, 1.4, CLAY.z - 3.8], [CLAY.x + 0.4, 0.7, CLAY.z], 32], [1, [CLAY.x + 4.0, 1.2, CLAY.z - 2.7], [CLAY.x + 0.4, 0.6, CLAY.z], 30]),
  veg: { grassR: 10, grassAt: [CLAY.x + 8, CLAY.z - 6] }, clear: [[CLAY.x, CLAY.z, 5]], shadow: { x: CLAY.x, z: CLAY.z, r: 12 },
  setup(c) { const l = c.person('LIO', { x: CLAY.x + 0.6, z: CLAY.z, yaw: yawTo(CLAY.x + 0.6, CLAY.z, CLAY.x - 3, CLAY.z + 1) }); l.anim = (P, t) => P.pose('dig', t * 0.9); },
});
shot('k01b', 'k01', {   // ...when his hands sank into something strange
  hours: TIME.morning + 0.9, cloud: 0.45, year: 340,
  cam: K([0, [CLAY.x + 2.3, 0.75, CLAY.z - 1.0], [CLAY.x + 0.4, 0.35, CLAY.z + 0.1], 28], [1, [CLAY.x + 2.1, 0.7, CLAY.z - 0.9], [CLAY.x + 0.4, 0.32, CLAY.z + 0.1], 25]),
  veg: { grassR: 4, grassAt: [CLAY.x - 3, CLAY.z - 3] }, clear: [[CLAY.x, CLAY.z, 5]], shadow: { x: CLAY.x, z: CLAY.z, r: 6 },
  setup(c) {
    const l = c.person('LIO', { x: CLAY.x + 0.75, z: CLAY.z + 0.55, yaw: yawTo(CLAY.x + 0.75, CLAY.z + 0.55, CLAY.x - 0.5, CLAY.z - 1.2) });
    l.anim = (P, t) => { P.pose('plant', t * 0.6); P.R.sh.rotation.x = -0.8 - 0.25 * smooth(1.0, 2.6, t); P.L.sh.rotation.x = -0.9; P.head.rotation.x = 0.6; };
    const mud = new THREE.Mesh(new THREE.CircleGeometry(0.9, 24).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0x5a3a24, roughness: 0.4 }));
    mud.position.set(CLAY.x + 0.1, c.h(CLAY.x, CLAY.z) + 0.03, CLAY.z - 0.1); c.add(mud); c.own(mud.geometry);
  },
}, 4.2);
// k02: "Clay." — Lio holds up a lump
shot('k02', 'k02', {
  hours: TIME.morning + 1, cloud: 0.4, year: 340,
  cam: K([0, [CLAY.x - 1.6, 1.3, CLAY.z - 1.4], [CLAY.x + 0.4, 1.35, CLAY.z + 0.4], 24], [1, [CLAY.x - 1.45, 1.3, CLAY.z - 1.25], [CLAY.x + 0.4, 1.4, CLAY.z + 0.4], 22]),
  veg: { grassR: 4, grassAt: [CLAY.x - 3, CLAY.z - 3] }, clear: [[CLAY.x, CLAY.z, 5]], shadow: { x: CLAY.x, z: CLAY.z, r: 6 },
  setup(c) {
    const l = c.person('LIO', { x: CLAY.x + 0.4, z: CLAY.z + 0.4, yaw: yawTo(CLAY.x + 0.4, CLAY.z + 0.4, CLAY.x - 1.6, CLAY.z - 1.4) });
    l.anim = (P, t) => { P.pose('idle', t); P.R.sh.rotation.x = -1.35; P.R.el.rotation.x = -0.9; P.head.rotation.x = 0.2; };
    const lump = new THREE.Mesh(new THREE.IcosahedronGeometry(0.11, 2), new THREE.MeshStandardMaterial({ color: 0xa8643e, roughness: 0.5 }));
    lump.castShadow = true; c.add(lump); c.own(lump.geometry);
    c.after(() => { l.root.updateMatrixWorld(true); l.R.hd.getWorldPosition(lump.position); lump.position.y += 0.06; });
  },
});
// k03: pots, storage — the kilns of Prima
shot('k03a', 'k03', {
  hours: TIME.afternoon, cloud: 0.4, year: 345,
  cam: K([0, [KILN.x + 5, 1.3, KILN.z - 4.5], [KILN.x, 0.8, KILN.z + 0.5], 32], [1, [KILN.x + 4.2, 1.2, KILN.z - 3.6], [KILN.x, 0.8, KILN.z + 0.5], 30]),
  veg: { grassR: 0, r0: 50 }, shadow: { x: KILN.x, z: KILN.z, r: 10 },
  setup(c) {
    c.fire(KILN.x, KILN.z + 1.25, { size: 0.35, n: 10, smoke: true, lightIntensity: 6, lightDist: 6, dy: 0.15 });
    const items = []; for (let i = 0; i < 14; i++) items.push([KILN.x + 1.6 + (i % 7) * 0.48, KILN.z + 1.6 + Math.floor(i / 7) * 0.5, i, 1.0 + (i % 3) * 0.12]);
    c.protos('pot', 0, items);
    const l = c.person('LIO', { x: KILN.x + 2.2, z: KILN.z + 0.4, yaw: -0.8 }); l.anim = (P, t) => P.pose('plant', t);
  },
});
shot('k03b', 'k03', {
  hours: TIME.afternoon + 0.4, cloud: 0.4, year: 350,
  cam: K([0, [GRAN.x - 5, 1.6, GRAN.z - 5], [GRAN.x, 0.8, GRAN.z], 32], [1, [GRAN.x - 4, 1.4, GRAN.z - 4.2], [GRAN.x, 0.8, GRAN.z], 30]),
  veg: { grassR: 0, r0: 50 }, shadow: { x: GRAN.x, z: GRAN.z, r: 10 },
  setup(c) {
    const items = []; for (let i = 0; i < 24; i++) items.push([GRAN.x - 2.6 + (i % 6) * 0.52, GRAN.z - 2.4 + Math.floor(i / 6) * 0.5, i, 1.1]);
    c.protos('pot', 0, items);
    [0, 1].forEach(i => { const P = vill(c, i + 2, GRAN.x - 3 + i * 1.6, GRAN.z - 4 + i * 0.4, { yaw: 0.4 }); P.anim = (Q, t) => c.walkTo(Q, GRAN.x - 3 + i * 1.6, GRAN.z - 4 + i * 0.4, GRAN.x - 2 + i * 1.4, GRAN.z - 3 + i * 0.4, t, 0, 2.5, { movePose: 'carry', endPose: 'idle', phase: i }); });
  },
}, 3.2);
// k04: "Leftovers." — a heap of full pots and baskets
shot('k04', 'k04', {
  hours: TIME.afternoon + 0.6, cloud: 0.4, year: 350,
  cam: K([0, [GRAN.x - 1.6, 0.5, GRAN.z - 3.4], [GRAN.x - 0.6, 0.45, GRAN.z - 1.2], 30], [1, [GRAN.x - 1.5, 0.48, GRAN.z - 3.1], [GRAN.x - 0.6, 0.45, GRAN.z - 1.2], 26]),
  veg: { grassR: 0, r0: 50 }, shadow: { x: GRAN.x, z: GRAN.z, r: 6 },
  setup(c) {
    const pots = [], bas = []; const r = mulberry32(3);
    for (let i = 0; i < 30; i++) { const x = GRAN.x - 2 + r() * 3, z = GRAN.z - 1.8 + r() * 1.8; (i % 3 ? pots : bas).push([x, z, r() * 6, 0.95 + 0.2 * r()]); }
    c.protos('pot', 0, pots); c.protos('grainBasket', 0, bas);
  },
});
// k05: fast forward to year 520 (aerial timelapse)
shot('k05', 'k05', {
  yearFn: (t, d) => 340 + 180 * smooth(0.05, 0.85, t / d), yearStep: 2, groundStep: 20,
  hoursFn: (t, d) => 8 + ((t / d) * 5 % 1) * 10, cloud: 0.45, tScale: 30, env: 0.6,
  cam: K([0, [-120, 70, -100], [0, 0, 10], 38], [1, [-60, 60, -140], [5, 0, 15], 38]),
  veg: { r0: 30, rImp: 220 },
});
// k06: who do the leftovers belong to?
shot('k06', 'k06', {
  hours: TIME.afternoon, cloud: 0.4, year: 520,
  cam: K([0, [GRAN.x - 7, 2.0, GRAN.z - 8], [GRAN.x, 1.3, GRAN.z], 34], [1, [GRAN.x - 6, 1.9, GRAN.z - 7], [GRAN.x, 1.3, GRAN.z], 32]),
  veg: { grassR: 0, r0: 50 }, shadow: { x: GRAN.x, z: GRAN.z, r: 14 },
  setup(c) {
    const items = []; for (let i = 0; i < 18; i++) items.push([GRAN.x - 2.4 + (i % 6) * 0.5, GRAN.z - 2.6 + Math.floor(i / 6) * 0.5, i, 1.05]);
    c.protos('pot', 0, items);
    for (let i = 0; i < 9; i++) { const a = -2.4 + i * 0.32, d = 4.2 + (i % 2) * 1.1; const x = GRAN.x + Math.sin(a) * d, z = GRAN.z + Math.cos(a) * d - 1; const P = vill(c, i, x, z, { yaw: yawTo(x, z, GRAN.x, GRAN.z - 1.5) }); P.anim = (Q, t) => Q.pose(['shrug', 'scratchHead', 'idle', 'talk'][i % 4], t + i, { phase: i }); }
  },
});
// k07: a farmer named Kassa had an answer (push in)
shot('k07', 'k07', {
  hours: TIME.afternoon + 0.2, cloud: 0.4, year: 520,
  cam: K([0, [GRAN.x - 6.5, 1.55, GRAN.z - 7.5], [GRAN.x - 2.2, 1.45, GRAN.z - 4.2], 30], [1, [GRAN.x - 5.0, 1.55, GRAN.z - 6.3], [GRAN.x - 2.2, 1.5, GRAN.z - 4.2], 26]),
  veg: { grassR: 0, r0: 50 }, shadow: { x: GRAN.x, z: GRAN.z, r: 12 },
  setup(c) {
    const k = c.person('KASSA', { x: GRAN.x - 2.2, z: GRAN.z - 4.2, yaw: yawTo(GRAN.x - 2.2, GRAN.z - 4.2, GRAN.x - 6.5, GRAN.z - 7.5) + 0.5 });
    k.anim = (P, t) => { P.pose('idle', t, { look: 0.2 }); P.root.rotation.y = lerpAngle(yawTo(GRAN.x - 2.2, GRAN.z - 4.2, GRAN.x, GRAN.z), yawTo(GRAN.x - 2.2, GRAN.z - 4.2, GRAN.x - 6.5, GRAN.z - 7.5), smooth(0.8, 1.8, t)); };
    for (let i = 0; i < 5; i++) { const x = GRAN.x - 4.5 + i * 1.2, z = GRAN.z - 2.2 - (i % 2) * 0.8; const P = vill(c, i + 10, x, z, { yaw: yawTo(x, z, GRAN.x, GRAN.z) }); P.anim = (Q, t) => Q.pose('idle', t + i, { phase: i }); }
  },
});
// k08: he invented a new word (close)
shot('k08', 'k08', {
  hours: TIME.afternoon + 0.25, cloud: 0.4, year: 520,
  cam: K([0, [GRAN.x - 3.6, 1.6, GRAN.z - 5.8], [GRAN.x - 2.2, 1.6, GRAN.z - 4.2], 24], [1, [GRAN.x - 3.4, 1.6, GRAN.z - 5.55], [GRAN.x - 2.2, 1.62, GRAN.z - 4.2], 22]),
  veg: { grassR: 0, r0: 50 }, shadow: { x: GRAN.x, z: GRAN.z, r: 8 },
  setup(c) { const k = c.person('KASSA', { x: GRAN.x - 2.2, z: GRAN.z - 4.2, yaw: yawTo(GRAN.x - 2.2, GRAN.z - 4.2, GRAN.x - 3.6, GRAN.z - 5.8) }); k.anim = (P, t) => P.pose('idle', t, { look: 0.1 }); },
});
// k09: "Mine." — his hand on the granary, low angle
shot('k09', 'k09', {
  hours: TIME.afternoon + 0.3, cloud: 0.4, year: 520,
  cam: K([0, [GRAN.x - 3.2, 0.5, GRAN.z - 3.6], [GRAN.x - 1.3, 1.9, GRAN.z - 1.6], 30], [1, [GRAN.x - 3.0, 0.45, GRAN.z - 3.35], [GRAN.x - 1.3, 2.0, GRAN.z - 1.6], 27]),
  veg: { grassR: 0, r0: 50 }, shadow: { x: GRAN.x, z: GRAN.z, r: 8 },
  setup(c) {
    const k = c.person('KASSA', { x: GRAN.x - 1.55, z: GRAN.z - 2.3, yaw: yawTo(GRAN.x - 1.55, GRAN.z - 2.3, GRAN.x - 3.2, GRAN.z - 3.6) - 0.6 });
    k.anim = (P, t) => { P.pose('idle', t, { look: 0 }); P.L.sh.rotation.x = -1.2; P.L.sh.rotation.z = -0.6; P.L.el.rotation.x = -0.3; };
  },
});
// k09L: his line, to the crowd
shot('k09L', 'k09L', {
  hours: TIME.afternoon + 0.4, cloud: 0.4, year: 520,
  cam: K([0, [GRAN.x - 7, 1.7, GRAN.z - 3], [GRAN.x - 2.2, 1.5, GRAN.z - 3.8], 32], [1, [GRAN.x - 6.2, 1.65, GRAN.z - 2.6], [GRAN.x - 2.2, 1.55, GRAN.z - 3.8], 30]),
  veg: { grassR: 0, r0: 50 }, shadow: { x: GRAN.x - 3, z: GRAN.z - 4, r: 12 },
  setup(c) {
    const k = c.person('KASSA', { x: GRAN.x - 2.2, z: GRAN.z - 3.8, yaw: yawTo(GRAN.x - 2.2, GRAN.z - 3.8, GRAN.x - 6, GRAN.z - 7) }); k.anim = (P, t) => P.pose('talk', t);
    for (let i = 0; i < 8; i++) { const a = i * 0.45 - 1.6, x = GRAN.x - 5 + Math.cos(a) * 3, z = GRAN.z - 7.5 + Math.sin(a) * 2.2; const P = vill(c, i + 20, x, z, { yaw: yawTo(x, z, GRAN.x - 2.2, GRAN.z - 3.8) }); P.anim = (Q, t) => Q.pose(i % 3 ? 'idle' : 'armsCrossed', t + i, { phase: i }); }
  },
});
// k10: granary -> the biggest field -> the hill above the river
shot('k10a', 'k10', {
  hours: TIME.afternoon + 0.5, cloud: 0.4, year: 521,
  cam: K([0, [GRAN.x + 6, 1.6, GRAN.z - 6], [GRAN.x, 1.4, GRAN.z], 32], [1, [GRAN.x + 5.2, 1.5, GRAN.z - 5.2], [GRAN.x, 1.4, GRAN.z], 30]),
  veg: { grassR: 0, r0: 50 }, shadow: { x: GRAN.x, z: GRAN.z, r: 8 },
  setup(c) { const k = c.person('KASSA', { x: GRAN.x + 1.6, z: GRAN.z - 2.2, yaw: yawTo(GRAN.x + 1.6, GRAN.z - 2.2, GRAN.x + 6, GRAN.z - 6) }); k.anim = (P, t) => P.pose('armsCrossed', t); },
});
shot('k10b', 'k10', {
  hours: TIME.golden - 0.5, cloud: 0.4, year: 521,
  cam: K([0, [BIGF.x - 14, 2.0, BIGF.z - 9], [BIGF.x, 1.2, BIGF.z], 34], [1, [BIGF.x - 14.6, 2.0, BIGF.z - 8], [BIGF.x, 1.2, BIGF.z], 34]),
  veg: { grassR: 0, r0: 40 }, shadow: { x: BIGF.x - 4, z: BIGF.z - 3, r: 18 },
  setup(c) { wheat(c, BIGF, 2); const k = c.person('KASSA', { x: BIGF.x - 6, z: BIGF.z - 4, yaw: yawTo(BIGF.x - 6, BIGF.z - 4, BIGF.x - 14, BIGF.z - 9) + 0.4 }); k.anim = (P, t) => P.pose('armsCrossed', t); },
}, 1.85);
shot('k10c', 'k10', {
  hours: TIME.golden, cloud: 0.4, year: 522,
  cam: K([0, [HILL.x - 16, 4, HILL.z - 22], [HILL.x - 6, 3.5, HILL.z - 8], 34], [1, [HILL.x - 15, 5, HILL.z - 21], [HILL.x - 6, 3.6, HILL.z - 8], 34]),
  veg: { r0: 40 }, shadow: { x: HILL.x - 6, z: HILL.z - 8, r: 18 },
  setup(c) { const k = c.person('KASSA', { x: HILL.x - 6, z: HILL.z - 8, yaw: yawTo(HILL.x - 6, HILL.z - 8, -40, -10) }); k.anim = (P, t) => P.pose('armsCrossed', t); },
}, 3.2);
// k11: the deal — one basket for a day of work
shot('k11', 'k11', {
  hours: TIME.afternoon, cloud: 0.4, year: 523,
  cam: K([0, [GRAN.x - 6.6, 1.5, GRAN.z - 2.0], [GRAN.x - 2.6, 1.2, GRAN.z - 3.9], 32], [1, [GRAN.x - 6.2, 1.45, GRAN.z - 1.7], [GRAN.x - 2.6, 1.2, GRAN.z - 3.9], 30]),
  veg: { r0: 40 }, shadow: { x: GRAN.x - 2, z: GRAN.z - 3, r: 10 },
  setup(c) {
    const kx = GRAN.x - 1.8, kz = GRAN.z - 3.2, wx = GRAN.x - 3.4, wz = GRAN.z - 4.6;
    const k = c.person('KASSA', { x: kx, z: kz, yaw: yawTo(kx, kz, wx, wz) }); k.anim = (P, t) => { P.pose('idle', t); P.R.sh.rotation.x = -1.0 * smooth(1.2, 2.0, t); P.L.sh.rotation.x = -1.0 * smooth(1.2, 2.0, t); };
    const w = vill(c, 30, wx, wz, { yaw: yawTo(wx, wz, kx, kz) }); w.anim = (P, t) => P.pose(t > 2.6 ? 'carry' : 'idle', t);
    const b = c.proto('grainBasket', 0, (kx + wx) / 2, (kz + wz) / 2, 0, 1.0); c.on(t => { const u = smooth(1.4, 2.6, t); b.position.set(kx + (wx - kx) * (0.35 + 0.4 * u), c.h(kx, kz) + 1.0, kz + (wz - kz) * (0.35 + 0.4 * u)); });
  },
});
// k12: two baskets for a house on the hill (workers building)
shot('k12', 'k12', {
  hours: TIME.afternoon + 0.6, cloud: 0.35, year: 526,
  cam: K([0, [26, 2.4, 2], [40, 3, 20], 34], [1, [27, 2.4, 4], [41, 3.2, 21], 34]),
  veg: { r0: 40 }, shadow: { x: 36, z: 14, r: 18 },
  setup(c) {
    for (let i = 0; i < 8; i++) {
      const x0 = 28 + i * 1.6, z0 = 9 + i * 1.3, x1 = 44 + i * 0.6, z1 = 23 + i * 0.5;
      const P = vill(c, 33 + i, x0, z0, { acc: ['basket'] }); P.anim = (Q, t) => c.walkTo(Q, x0, z0, x1, z1, (t + i * 0.7) % 6, 0, 6, { movePose: 'carry', speed: 0.6, phase: i });
    }
  },
});
// k13: the first theft (night) / the first prison
shot('k13a', 'k13', {
  hours: TIME.night, cloud: 0.2, year: 530, exposure: 1.25,
  cam: K([0, [GRANARY_K.x - 5, 1.2, GRANARY_K.z - 6], [GRANARY_K.x - 1.5, 0.9, GRANARY_K.z - 2.5], 32], [1, [GRANARY_K.x - 5.4, 1.15, GRANARY_K.z - 6.3], [GRANARY_K.x - 3, 0.9, GRANARY_K.z - 4], 30]),
  veg: { r0: 40 }, shadow: { x: GRANARY_K.x - 2, z: GRANARY_K.z - 3, r: 10 },
  setup(c) {
    const th = vill(c, 40, GRANARY_K.x - 1.6, GRANARY_K.z - 2.6, { acc: ['basket'] });
    th.anim = (P, t) => { c.walkTo(P, GRANARY_K.x - 1.6, GRANARY_K.z - 2.6, GRANARY_K.x - 6, GRANARY_K.z - 7, t, 0, 2.2, { movePose: 'carry', speed: 0.7 }); P.spine.rotation.x += 0.35; };
  },
});
shot('k13b', 'k13', {
  hours: TIME.morning, cloud: 0.5, year: 530,
  cam: K([0, [GRANARY_K.x - 9, 1.2, GRANARY_K.z - 1.5], [GRANARY_K.x - 5.5, 1.0, GRANARY_K.z + 1.2], 30], [1, [GRANARY_K.x - 8.6, 1.15, GRANARY_K.z - 1.2], [GRANARY_K.x - 5.5, 1.0, GRANARY_K.z + 1.2], 28]),
  veg: { r0: 40 }, shadow: { x: GRANARY_K.x - 5, z: GRANARY_K.z + 1, r: 8 },
  setup(c) {
    c.proto('cage', 0, GRANARY_K.x - 5.5, GRANARY_K.z + 1.2, 0.3, 1);
    const p = vill(c, 40, GRANARY_K.x - 5.5, GRANARY_K.z + 1.2, { yaw: -2.6 }); p.anim = (P, t) => P.pose('headInHands', t, { seat: 0.3 });
  },
}, 1.9);
// k14: the four strongest — the first guards ("the first army")
shot('k14a', 'k14', {
  hours: TIME.afternoon, cloud: 0.4, year: 532,
  cam: K([0, [GRANARY_K.x - 8, 1.6, GRANARY_K.z - 9], [GRANARY_K.x - 3, 1.4, GRANARY_K.z - 4.5], 32], [1, [GRANARY_K.x - 6, 1.6, GRANARY_K.z - 9.6], [GRANARY_K.x - 2, 1.4, GRANARY_K.z - 4.5], 32]),
  veg: { r0: 40 }, shadow: { x: GRANARY_K.x - 3, z: GRANARY_K.z - 4, r: 12 },
  setup(c) {
    for (let i = 0; i < 4; i++) { const x = GRANARY_K.x - 5 + i * 1.3, z = GRANARY_K.z - 4.2; const P = c.person(VILLAGERS[i + 4], { x, z, yaw: Math.PI + 0.6, scale: 1.18 }); P.anim = (Q, t) => Q.pose('armsCrossed', t + i, { phase: i }); }
    const k = c.person('KASSA', { x: GRANARY_K.x - 6, z: GRANARY_K.z - 5.6 }); k.anim = (P, t) => c.walkTo(P, GRANARY_K.x - 6.5, GRANARY_K.z - 5.6, GRANARY_K.x - 0.5, GRANARY_K.z - 5.6, t, 0.2, 4.6, { speed: 0.45, endPose: 'armsCrossed' });
  },
});
shot('k14b', 'k14', {
  hours: TIME.golden - 0.2, cloud: 0.4, year: 535,
  cam: K([0, [GRANARY_K.x - 3.4, 0.45, GRANARY_K.z - 8.5], [GRANARY_K.x - 3.4, 2.0, GRANARY_K.z - 4.2], 30], [1, [GRANARY_K.x - 3.4, 0.42, GRANARY_K.z - 7.6], [GRANARY_K.x - 3.4, 2.1, GRANARY_K.z - 4.2], 27]),
  veg: { r0: 40 }, shadow: { x: GRANARY_K.x - 3, z: GRANARY_K.z - 4, r: 10 },
  setup(c) {
    for (let i = 0; i < 4; i++) { const x = GRANARY_K.x - 5.4 + i * 1.3, z = GRANARY_K.z - 4.2; const P = c.person(VILLAGERS[i + 4], { x, z, yaw: Math.PI + 0.6, scale: 1.18, acc: KMEN }); P.anim = (Q, t) => Q.pose('pushSpear', t + i, { phase: i }); }
  },
}, 5.4);
// k15: two neighbourhoods — the hill / the riverbank
shot('k15a', 'k15', {
  hours: TIME.morning + 1.5, cloud: 0.3, year: 560,
  cam: K([0, [10, 34, -12], [62, 8, 40], 38], [1, [16, 32, -18], [62, 8, 40], 38]),
  veg: { r0: 40 }, shadow: { x: HILL.x - 10, z: HILL.z - 10, r: 40 },
  setup(c) { c.protos('pot', 0, [...Array(10)].map((_, i) => [GRANARY_K.x - 4 + (i % 5) * 0.6, GRANARY_K.z - 4.5 + Math.floor(i / 5) * 0.6, i, 1.1])); },
});
shot('k15b', 'k15', {
  hours: TIME.afternoon, cloud: 0.6, year: 560,
  cam: K([0, [-55, 1.7, -22], [-42, 1.0, -9], 34], [1, [-54.5, 1.65, -20.5], [-42, 1.0, -9], 34]),
  veg: { grassR: 0, r0: 40 }, shadow: { x: RIVERBANK.x + 4, z: RIVERBANK.z + 4, r: 18 },
  setup(c) {
    const r = mulberry32(31);
    for (let i = 0; i < 7; i++) { const x = -48 + (r() - 0.5) * 8, z = -15 + (r() - 0.5) * 8; const P = vill(c, i + 12, x, z, { yaw: r() * 6.28, energy: 0.7, era: 'early' }); P.anim = (Q, t) => Q.pose(i % 2 ? 'sitGround' : 'sad', t + i, { headX: 0.4 }); }
  },
}, 3.8);
// k16: I had a really bad feeling (dark clouds over the river)
shot('k16', 'k16', {
  hours: TIME.afternoon, storm: 0.55, cloud: 0.8, year: 605, tScale: 6,
  cam: K([0, [-110, 16, -70], [-30, 6, 10], 36], [1, [-96, 14, -58], [-30, 6, 10], 34]),
  veg: { r0: 40 },
});
// k17: year 610 — forty days of rain (timelapse)
shot('k17', 'k17', {
  hoursFn: (t, d) => 6 + ((t / d) * 4 % 1) * 17, storm: 0.95, cloud: 0.95, year: 609.5, tScale: 8, env: 0.5,
  cam: K([0, [RIVERBANK.x + 22, 4, RIVERBANK.z + 16], [RIVERBANK.x - 8, 1, RIVERBANK.z - 2], 36], [1, [RIVERBANK.x + 20, 4, RIVERBANK.z + 15], [RIVERBANK.x - 8, 1, RIVERBANK.z - 2], 36]),
  veg: { r0: 40 }, shadow: { x: RIVERBANK.x + 5, z: RIVERBANK.z + 5, r: 25 },
  setup(c) { c.rain(5000, 80, 0.45); c.water(-40, 0, 320, 320, FLOOD(0, c.dur, 0.62, 1.3)); },
});
// k18: and the river floods
shot('k18', 'k18', {
  hours: TIME.afternoon, storm: 0.9, cloud: 0.95, year: 609.8,
  cam: K([0, [PRIMA.x + 18, 7, PRIMA.z - 26], [PRIMA.x - 10, 1, PRIMA.z - 4], 36], [1, [PRIMA.x + 16, 6.5, PRIMA.z - 24], [PRIMA.x - 10, 1, PRIMA.z - 4], 36]),
  veg: { r0: 40 }, shadow: { x: PRIMA.x - 4, z: PRIMA.z - 6, r: 30 },
  setup(c) { c.rain(4500, 80, 0.4); c.water(-40, 0, 340, 340, FLOOD(0, c.dur, 1.3, 2.45)); },
});
// k19: half the village is gone
shot('k19', 'k19', {
  hours: TIME.afternoon + 0.5, storm: 0.7, cloud: 0.9, year: 610.3,
  cam: K([0, [PRIMA.x - 60, 46, PRIMA.z - 70], [PRIMA.x, 0, PRIMA.z], 38], [1, [PRIMA.x - 54, 42, PRIMA.z - 62], [PRIMA.x, 0, PRIMA.z], 38]),
  veg: { r0: 30, rImp: 220 },
  setup(c) { c.water(-40, 0, 360, 360, () => 2.45); },
});
// k20: guess which half flooded? (pan from the water up to the dry hill)
shot('k20', 'k20', {
  hours: TIME.afternoon + 0.7, storm: 0.4, cloud: 0.7, year: 610.4,
  cam: K([0, [PRIMA.x + 30, 12, PRIMA.z - 42], [PRIMA.x - 6, 1, PRIMA.z], 36], [1, [PRIMA.x + 46, 16, PRIMA.z - 30], [HILL.x - 6, 8, HILL.z - 6], 36]),
  veg: { r0: 40, rImp: 200 },
  setup(c) { c.water(-40, 0, 360, 360, () => 2.45); },
});
// k21: "Yeah." — Kassa on the dry hill, arms crossed
shot('k21', 'k21', {
  hours: TIME.afternoon + 0.8, storm: 0.3, cloud: 0.6, year: 610.4,
  cam: K([0, [HILL.x - 9.0, 1.7, HILL.z - 10.6], [HILL.x - 6, 1.4, HILL.z - 8], 30], [1, [HILL.x - 8.8, 1.7, HILL.z - 10.4], [HILL.x - 6, 1.45, HILL.z - 8], 28]),
  veg: { r0: 40 }, shadow: { x: HILL.x - 6, z: HILL.z - 8, r: 8 },
  setup(c) { c.water(-40, 0, 360, 360, () => 2.45); const k = c.person('KASSA', { x: HILL.x - 6, z: HILL.z - 8, yaw: yawTo(HILL.x - 6, HILL.z - 8, HILL.x - 9.5, HILL.z - 10.5) }); k.anim = (P, t) => P.pose('armsCrossed', t, { look: 0 }); },
});
// k22: standing in the mud, the survivors
shot('k22', 'k22', {
  hours: TIME.afternoon + 1.2, storm: 0.5, cloud: 0.8, year: 611, grade: 'sad',
  cam: K([0, [PRIMA.x + 10, 1.5, PRIMA.z - 12], [PRIMA.x + 4, 1.2, PRIMA.z - 4], 32], [1, [PRIMA.x + 6, 1.5, PRIMA.z - 13], [PRIMA.x + 2, 1.2, PRIMA.z - 4], 32]),
  veg: { grassR: 0, r0: 40 }, shadow: { x: PRIMA.x + 3, z: PRIMA.z - 5, r: 14 },
  setup(c) {
    c.water(PRIMA.x - 20, PRIMA.z + 6, 60, 50, () => 1.98, { dim: 0.4, deep: 0x2a2116, shallow: 0x433626 });
    const r = mulberry32(55);
    for (let i = 0; i < 9; i++) { const x = PRIMA.x + 4 + (r() - 0.5) * 9, z = PRIMA.z - 4 + (r() - 0.5) * 6; const P = vill(c, i + 14, x, z, { yaw: r() * 6.28 - 2.2, energy: 0.7, era: 'early' }); P.anim = (Q, t) => Q.pose(i % 3 === 0 ? 'lookUp' : 'sad', t + i, { amount: 0.6 }); }
  },
});
// k23: "Why?" — a survivor looks up at the sky
shot('k23', 'k23', {
  hours: TIME.afternoon + 1.3, storm: 0.5, cloud: 0.8, year: 611, grade: 'sad',
  cam: K([0, [PRIMA.x + 4.9, 0.9, PRIMA.z - 5.9], [PRIMA.x + 4, 1.45, PRIMA.z - 4], 30], [1, [PRIMA.x + 4.8, 0.88, PRIMA.z - 5.7], [PRIMA.x + 4, 1.5, PRIMA.z - 4], 28]),
  veg: { grassR: 0, r0: 40 }, shadow: { x: PRIMA.x + 4, z: PRIMA.z - 4, r: 6 },
  setup(c) { const P = vill(c, 17, PRIMA.x + 4, PRIMA.z - 4, { yaw: yawTo(PRIMA.x + 4, PRIMA.z - 4, PRIMA.x + 4.6, PRIMA.z - 5.4), energy: 0.7, era: 'early' }); P.anim = (Q, t) => Q.pose('lookUp', t, { amount: 0.9 }); },
});
