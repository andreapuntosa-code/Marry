// CHAPTER II — FIRST FIRE (year 0, days 1-214)
import * as THREE from 'three';
import { shot } from './registry.js';
import { Fire } from '../lib/fx.js';
import { K, orbitCam, M, SPAWN, founders, TIME, MEADOW_TREES, CAMP, LTREE, FOREST_EDGE, A15_BODY, yawTo, rock, wolfEyes } from './sets.js';

const MV = { grassR: 18, extra: MEADOW_TREES };
const NIGHT = { hours: TIME.night, cloud: 0.2, year: 0, town: false, exposure: 1.2 };
const SKIP_A15 = [4];

// chapter card: the meadow under the moon
shot('f_card', 'chap:f01', {
  ...NIGHT, exposure: 1.25,
  cam: K([0, [M.x - 55, 32, M.z - 62], [M.x, 2, M.z], 40], [1, [M.x - 46, 27, M.z - 52], [M.x, 2, M.z], 40]),
  veg: { r0: 40, rImp: 160, extra: MEADOW_TREES },
  setup(c) { founders(c, (w, i) => ({ pose: i % 3 ? 'sitGround' : 'idle' })); },
});
// f01: dusk to night timelapse over the group
shot('f01', 'f01', {
  hoursFn: (t, d) => 16.8 + (t / d) * 3.6, cloud: 0.3, year: 0, town: false, env: 0.6, tScale: 6,
  cam: K([0, [M.x - 15, 1.7, M.z - 9], [M.x, 1.3, M.z + 1], 36], [1, [M.x - 14, 1.7, M.z - 8.4], [M.x, 1.3, M.z + 1], 36]),
  veg: MV,
  setup(c) { founders(c, (w, i) => ({ pose: i % 4 === 0 ? 'lookUp' : (i % 4 === 1 ? 'sitGround' : 'idle') })); },
});
// f02: the dark forest edge; eyes in the trees
shot('f02', 'f02', {
  ...NIGHT, exposure: 1.35, fog: 0.0011,
  cam: K([0, [FOREST_EDGE.x - 9, 1.3, FOREST_EDGE.z - 8], [FOREST_EDGE.x + 2, 0.9, FOREST_EDGE.z + 2.5], 32], [1, [FOREST_EDGE.x - 6.5, 1.2, FOREST_EDGE.z - 5.8], [FOREST_EDGE.x + 2, 0.8, FOREST_EDGE.z + 2.5], 30]),
  veg: { grassR: 14, r0: 60 }, clear: [[FOREST_EDGE.x + 1, FOREST_EDGE.z + 1, 7], [FOREST_EDGE.x - 8, FOREST_EDGE.z - 8, 8]],
  setup(c) {
    [[1.5, 3.0, 0.4], [4.5, 0.5, -0.2], [-1.5, 4.5, 0.8]].forEach(([dx, dz, j], i) => {
      const x = FOREST_EDGE.x + dx, z = FOREST_EDGE.z + dz;
      const w = c.animal('wolf', i + 1, x, z, yawTo(x, z, FOREST_EDGE.x - 14, FOREST_EDGE.z - 13) + j * 0.3, { glow: 2.5 });
      wolfEyes(c, w, 0.3);
      c.on(t => w.animate(t, { speed: 0, graze: 0, phase: i * 2, howl: i === 1 && t > 2.4 }));
    });
  },
});
// f03: "Wolves." — one howls on a rock against the stars (low angle)
shot('f03', 'f03', {
  ...NIGHT, exposure: 1.4,
  cam: K([0, [FOREST_EDGE.x - 3.4, 0.5, FOREST_EDGE.z - 2.6], [FOREST_EDGE.x, 1.9, FOREST_EDGE.z], 32], [1, [FOREST_EDGE.x - 3.1, 0.45, FOREST_EDGE.z - 2.4], [FOREST_EDGE.x, 2.0, FOREST_EDGE.z], 30]),
  veg: { grassR: 8, r0: 50 }, clear: [[FOREST_EDGE.x + 6, FOREST_EDGE.z + 5, 14]],
  setup(c) {
    rock(c, FOREST_EDGE.x, FOREST_EDGE.z, 2.2, 0.4, 0.75);
    const w = c.animal('wolf', 2, FOREST_EDGE.x, FOREST_EDGE.z, 2.55, { glow: 2.5 });
    w.root.position.y += 1.05;
    wolfEyes(c, w, 0.12);
    c.on(t => w.animate(t, { speed: 0, graze: 0, howl: t > 0.25 }));
  },
});
// f04: huddled together in the open; eyes at the treeline far away
shot('f04', 'f04', {
  ...NIGHT, exposure: 1.3,
  cam: K([0, [M.x + 9, 7.5, M.z - 7], [M.x, 0.5, M.z], 38], [1, [M.x + 7, 6, M.z - 5.5], [M.x, 0.5, M.z], 36]),
  veg: { grassR: 14, extra: MEADOW_TREES },
  setup(c) {
    founders(c, (w, i, s) => { const a = i * 2.39996, d = 0.6 + Math.sqrt(i) * 0.62; return { x: M.x + Math.cos(a) * d, z: M.z + Math.sin(a) * d, pose: i % 3 === 2 ? 'sleep' : 'sitGround', yaw: a + Math.PI }; });
    [[30, 38], [36, 30], [24, 44]].forEach(([dx, dz], i) => { const x = M.x + dx, z = M.z + dz; const w = c.animal('wolf', i, x, z, yawTo(x, z, M.x, M.z), { glow: 3 }); wolfEyes(c, w, 0.45); c.on(t => w.animate(t, { speed: 0, graze: 0, phase: i })); });
  },
});
// f05: "Well. Most of them learn." — A-15 alone, looking at the trees
shot('f05', 'f05', {
  hours: TIME.golden + 0.2, cloud: 0.35, year: 0, town: false,
  cam: K([0, [M.x + 7, 1.3, M.z + 4], [M.x + 14, 1.4, M.z + 13], 32], [1, [M.x + 7.6, 1.3, M.z + 4.8], [M.x + 14, 1.4, M.z + 13], 30]),
  veg: { grassR: 14, extra: MEADOW_TREES },
  setup(c) {
    const a = c.person('A15', { x: M.x + 12, z: M.z + 10.5, yaw: yawTo(M.x + 12, M.z + 10.5, FOREST_EDGE.x, FOREST_EDGE.z) });
    a.anim = (P, t) => { P.pose('idle', t, { look: 0.3 }); P.head.rotation.y = Math.sin(t * 0.5) * 0.2; };
  },
});
// f06a: day 203 — a deer walks off into the woods, A-15 follows
shot('f06a', 'f06', {
  hours: TIME.afternoon, cloud: 0.4, year: 0, town: false,
  cam: K([0, [FOREST_EDGE.x - 22, 1.6, FOREST_EDGE.z - 8], [FOREST_EDGE.x - 12, 1.2, FOREST_EDGE.z - 10], 34], [1, [FOREST_EDGE.x - 15, 1.6, FOREST_EDGE.z - 3], [FOREST_EDGE.x - 3, 1.2, FOREST_EDGE.z - 1], 34]),
  veg: { grassR: 16 },
  setup(c) {
    const p0 = [FOREST_EDGE.x - 16, FOREST_EDGE.z - 15], p1 = [FOREST_EDGE.x + 1, FOREST_EDGE.z + 2];
    const d = c.animal('deer', 1, p0[0] + 5, p0[1] + 5, 0.8);
    c.on(t => { const u = Math.min(1, t / 4.2); const x = p0[0] + 5 + (p1[0] + 4 - p0[0] - 5) * u, z = p0[1] + 5 + (p1[1] + 4 - p0[1] - 5) * u; d.root.position.set(x, c.h(x, z), z); d.root.rotation.y = yawTo(p0[0], p0[1], p1[0], p1[1]); d.animate(t, { speed: 0.9 }); });
    const a = c.person('A15', { x: p0[0], z: p0[1] });
    a.anim = (P, t) => c.walkTo(P, p0[0], p0[1], p1[0], p1[1], t, 0, 4.6, { speed: 0.9 });
  },
});
// f06b: static at the edge of the forest — she walks into the dark and is gone
shot('f06b', 'f06', {
  hours: TIME.afternoon + 0.6, cloud: 0.5, year: 0, town: false,
  cam: K([0, [FOREST_EDGE.x - 4, 1.5, FOREST_EDGE.z - 4], [FOREST_EDGE.x + 8, 1.3, FOREST_EDGE.z + 9], 36], [1, [FOREST_EDGE.x - 3.4, 1.5, FOREST_EDGE.z - 3.5], [FOREST_EDGE.x + 8, 1.2, FOREST_EDGE.z + 9], 33]),
  veg: { grassR: 10, r0: 70 },
  setup(c) {
    const a = c.person('A15', { x: FOREST_EDGE.x, z: FOREST_EDGE.z });
    a.anim = (P, t) => { c.walkTo(P, FOREST_EDGE.x, FOREST_EDGE.z, FOREST_EDGE.x + 13, FOREST_EDGE.z + 15, t, 0.2, 3.6, { speed: 0.9 }); P.root.visible = t < 3.5; };
  },
}, 3.8);
// f07: two days later — her body on the forest floor (crane down)
shot('f07', 'f07', {
  hours: TIME.noon, cloud: 0.8, storm: 0.38, grade: 'sad', year: 0, town: false,
  cam: K([0, [A15_BODY.x + 2.5, 5.5, A15_BODY.z - 3], [A15_BODY.x, 0.2, A15_BODY.z], 36], [1, [A15_BODY.x + 2.0, 2.4, A15_BODY.z - 2.6], [A15_BODY.x, 0.2, A15_BODY.z], 34]),
  veg: { grassR: 8, r0: 60 }, clear: [[A15_BODY.x, A15_BODY.z, 4]], shadow: { x: A15_BODY.x, z: A15_BODY.z, r: 18 },
  setup(c) { const a = c.person('A15', { x: A15_BODY.x, z: A15_BODY.z, yaw: 0.7, energy: 0 }); a.anim = (P, t) => P.pose('lie', t); },
});
// f08: the others sit around her for six days (slow orbit)
function vigil(c, opts = {}) {
  const a = c.person('A15', { x: A15_BODY.x, z: A15_BODY.z, yaw: 0.7, energy: 0 }); a.anim = (P, t) => P.pose('lie', t);
  const out = [];
  SPAWN.forEach((s, i) => {
    if (s.who === 'A15') return;
    const k = out.length, ang = k / 19 * Math.PI * 2, d = 2.6 + (k % 2) * 0.9;
    const x = A15_BODY.x + Math.cos(ang) * d, z = A15_BODY.z + Math.sin(ang) * d;
    const P = c.person(s.who, { x, z, yaw: yawTo(x, z, A15_BODY.x, A15_BODY.z) });
    P.anim = (Q, t) => Q.pose(opts.pose || (k % 3 === 0 ? 'headInHands' : 'sitGround'), t + k, { headX: 0.45, seat: 0.3 });
    out.push(P);
  });
  return out;
}
shot('f08', 'f08', {
  hours: TIME.afternoon, cloud: 0.85, year: 0, town: false,
  cam: orbitCam([A15_BODY.x, A15_BODY.z], 7.5, 2.2, 0.4, 1.2, 36, 0.4),
  veg: { grassR: 8, r0: 60 }, clear: [[A15_BODY.x, A15_BODY.z, 6]], shadow: { x: A15_BODY.x, z: A15_BODY.z, r: 16 },
  setup(c) { vigil(c); },
});
// f09: "But they understood." — Ise kneels by her (close)
shot('f09', 'f09', {
  hours: TIME.afternoon + 0.5, cloud: 0.85, year: 0, town: false,
  cam: K([0, [A15_BODY.x - 1.3, 0.75, A15_BODY.z + 2.6], [A15_BODY.x + 0.5, 0.45, A15_BODY.z + 0.5], 30], [1, [A15_BODY.x - 1.15, 0.72, A15_BODY.z + 2.4], [A15_BODY.x + 0.5, 0.45, A15_BODY.z + 0.5], 28]),
  veg: { grassR: 6, r0: 60 }, clear: [[A15_BODY.x, A15_BODY.z, 6]], shadow: { x: A15_BODY.x, z: A15_BODY.z, r: 10 },
  setup(c) {
    const a = c.person('A15', { x: A15_BODY.x, z: A15_BODY.z, yaw: 0.7, energy: 0 }); a.anim = (P, t) => P.pose('lie', t);
    const i = c.person('ISE', { x: A15_BODY.x + 0.9, z: A15_BODY.z + 1.0, yaw: yawTo(A15_BODY.x + 0.9, A15_BODY.z + 1.0, A15_BODY.x, A15_BODY.z) });
    i.anim = (P, t) => P.pose('kneelPray', t, { armsUp: 0 });
  },
});
// f10: the first death — top-down, rising
shot('f10', 'f10', {
  hours: TIME.afternoon + 0.8, cloud: 0.8, year: 0, town: false, top: true,
  cam: K([0, [A15_BODY.x + 0.1, 9, A15_BODY.z], [A15_BODY.x, 0, A15_BODY.z], 44], [1, [A15_BODY.x + 0.1, 22, A15_BODY.z], [A15_BODY.x, 0, A15_BODY.z], 44]),
  veg: { r0: 60 }, clear: [[A15_BODY.x, A15_BODY.z, 6]], shadow: { x: A15_BODY.x, z: A15_BODY.z, r: 16 },
  setup(c) { vigil(c, { pose: 'sitGround' }); },
});
// f11: a few days later — storm clouds roll in fast
shot('f11', 'f11', {
  hours: TIME.afternoon, stormFn: (t, d) => 0.1 + 0.75 * (t / d), hoursFn: (t, d) => TIME.afternoon, cloud: 0.6, year: 0, town: false, tScale: 10,
  cam: K([0, [M.x - 6, 0.5, M.z - 8], [M.x + 4, 6, M.z + 6], 40], [1, [M.x - 6, 0.5, M.z - 8], [M.x + 4, 7, M.z + 6], 40]),
  veg: MV,
  setup(c) { founders(c, (w, i) => ({ pose: 'lookUp', p: { amount: 0.8 } }), { skip: SKIP_A15 }); },
});
// f12a: rain; lightning strikes the tree by the camp; it catches fire
function burningTree(c, t0, opts = {}) {
  const fires = [];
  const pts = [[0, 8.5, 0, 4.2], [2.2, 7.2, 1.2, 3.2], [-2.0, 7.6, -1.0, 3.4], [0.6, 10.4, -0.6, 3.0], [-0.6, 5.6, 1.6, 2.6], [0.3, 3.4, -0.5, 1.8], [1.4, 9.2, -1.6, 2.8]];
  pts.forEach(([dx, y, dz, s], k) => {
    const f = new Fire({ size: s, n: 22, emberN: 26, smoke: k === 0, light: k === 0, lightIntensity: 60, lightDist: 55, seed: k + 3 });
    f.group.position.set(LTREE.x + dx, c.h(LTREE.x + dx, LTREE.z + dz) + y, LTREE.z + dz); c.add(f.group); fires.push(f);
  });
  c.on(t => { const u = Math.min(1, Math.max(0, (t - t0) / (opts.grow ?? 1.4))); fires.forEach((f, k) => { f.intensity = Math.min(1, u * (1.4 - k * 0.12)); f.group.visible = f.intensity > 0.01; f.update(t); }); });
  return fires;
}
shot('f12a', 'f12', {
  hours: TIME.afternoon + 0.6, storm: 1.0, cloud: 0.9, year: 0, town: false, exposure: 1.15,
  cam: K([0, [LTREE.x - 30, 3.0, LTREE.z - 24], [LTREE.x, 8, LTREE.z], 36], [1, [LTREE.x - 27, 2.8, LTREE.z - 21.5], [LTREE.x, 8, LTREE.z], 34]),
  veg: MV, shadow: { x: LTREE.x - 10, z: LTREE.z - 8, r: 40 },
  setup(c) {
    c.rain(5000, 80, 0.4);
    const top = new THREE.Vector3(LTREE.x, c.h(LTREE.x, LTREE.z) + 12.5, LTREE.z);
    c.bolt(top.clone().add(new THREE.Vector3(14, 140, -8)), top, 1.5, 7);
    burningTree(c, 1.55);
    founders(c, (w, i) => ({ x: SPAWN[i].x + 4, z: SPAWN[i].z + 6, pose: 'lookUp' }), { skip: SKIP_A15 });
  },
});
// f12b: the burning tree, silhouettes in the rain
shot('f12b', 'f12', {
  hours: TIME.afternoon + 0.7, storm: 0.95, cloud: 0.9, year: 0, town: false, exposure: 1.1,
  cam: K([0, [LTREE.x - 12, 1.2, LTREE.z - 10], [LTREE.x, 6.5, LTREE.z], 34], [1, [LTREE.x - 11, 1.15, LTREE.z - 9.2], [LTREE.x, 6.8, LTREE.z], 32]),
  veg: MV, shadow: { x: LTREE.x - 5, z: LTREE.z - 4, r: 25 },
  setup(c) {
    c.rain(4000, 60, 0.35);
    burningTree(c, -5);
    ['A05', 'MIRA', 'A10', 'ISE', 'A17'].forEach((w, i) => { const x = LTREE.x - 7.5 + i * 1.3, z = LTREE.z - 5.5 + (i % 2) * 0.8; const P = c.person(w, { x, z, yaw: yawTo(x, z, LTREE.x, LTREE.z) }); P.anim = (Q, t) => Q.pose('idle', t + i, { look: 0.1 }); });
  },
}, 3.2);
// f13: everybody runs — except A-09
shot('f13', 'f13', {
  hours: TIME.afternoon + 0.8, storm: 0.9, cloud: 0.9, year: 0, town: false, exposure: 1.1,
  cam: K([0, [LTREE.x - 17, 1.4, LTREE.z - 14], [LTREE.x - 4, 2.2, LTREE.z - 2], 34], [1, [LTREE.x - 17.5, 1.3, LTREE.z - 14.6], [LTREE.x - 4, 2.4, LTREE.z - 2], 32]),
  veg: MV, shadow: { x: LTREE.x - 8, z: LTREE.z - 7, r: 25 },
  setup(c) {
    c.rain(4000, 60, 0.35);
    burningTree(c, -5);
    const bo = c.person('BO', { x: LTREE.x - 8.5, z: LTREE.z - 6.5, yaw: yawTo(LTREE.x - 8.5, LTREE.z - 6.5, LTREE.x, LTREE.z) });
    bo.anim = (P, t) => P.pose('idle', t, { look: 0 });
    SPAWN.forEach((s, i) => {
      if (s.who === 'A15' || s.who === 'BO') return;
      const a = i * 0.7, x0 = LTREE.x - 6 + Math.cos(a) * 3, z0 = LTREE.z - 4 + Math.sin(a) * 3;
      const side = i % 2 ? 1 : -1, lat = side * (2.2 + (i % 5) * 1.5), back = 4 + (i % 3) * 2;
      const x1 = LTREE.x - 17 - 0.73 * back - 0.68 * lat, z1 = LTREE.z - 14 - 0.68 * back + 0.73 * lat;
      const P = c.person(s.who, { x: x0, z: z0 });
      P.anim = (Q, t) => c.walkTo(Q, x0, z0, x1, z1, t, 0.1 * (i % 4), 3.4 + 0.1 * (i % 4), { run: true, phase: i });
    });
  },
});
// f14a: Bo walks up to the burning tree (tracking from behind)
shot('f14a', 'f14', {
  hours: TIME.afternoon + 0.9, storm: 0.85, cloud: 0.9, year: 0, town: false, exposure: 1.1,
  cam: K([0, [LTREE.x - 12, 1.7, LTREE.z - 10], [LTREE.x - 2, 2.0, LTREE.z - 1], 36], [1, [LTREE.x - 7.5, 1.7, LTREE.z - 6.2], [LTREE.x, 3.0, LTREE.z], 36]),
  veg: MV, shadow: { x: LTREE.x - 4, z: LTREE.z - 3, r: 20 },
  setup(c) {
    c.rain(3500, 55, 0.3);
    burningTree(c, -5);
    const bo = c.person('BO', { x: LTREE.x - 8.5, z: LTREE.z - 6.5 });
    bo.anim = (P, t) => c.walkTo(P, LTREE.x - 8.5, LTREE.z - 6.5, LTREE.x - 2.2, LTREE.z - 1.8, t, 0.2, 2.8, { speed: 0.8, endPose: 'point' });
  },
});
// f14b: he walks back towards us with a burning branch
shot('f14b', 'f14', {
  hours: TIME.afternoon + 1.0, storm: 0.8, cloud: 0.85, year: 0, town: false, exposure: 1.1,
  cam: K([0, [LTREE.x - 11.5, 1.5, LTREE.z - 10.5], [LTREE.x - 5, 1.5, LTREE.z - 4.5], 30], [1, [LTREE.x - 13.8, 1.45, LTREE.z - 12.2], [LTREE.x - 10.5, 1.5, LTREE.z - 9.2], 30]),
  veg: MV, shadow: { x: LTREE.x - 8, z: LTREE.z - 7, r: 25 },
  setup(c) {
    c.rain(2500, 55, 0.25);
    burningTree(c, -5);
    const bo = c.person('BO', { x: LTREE.x - 2.5, z: LTREE.z - 2, acc: ['torch'] });
    c.torch(bo, { size: 0.55, n: 16, light: true, lightIntensity: 12, lightDist: 12 });
    bo.anim = (P, t) => { c.walkTo(P, LTREE.x - 2.5, LTREE.z - 2, LTREE.x - 12.5, LTREE.z - 10.8, t, 0, c.dur, { speed: 0.8, movePose: 'holdTorch', p: { walking: true } }); };
  },
}, 3.0);
// f15: "He stole it. From the sky." — hero low angle, branch raised
shot('f15', 'f15', {
  hours: TIME.golden - 0.2, storm: 0.45, cloud: 0.7, year: 0, town: false, exposure: 1.05,
  cam: K([0, [CAMP.x - 3.9, 0.85, CAMP.z - 2.9], [CAMP.x, 1.9, CAMP.z], 30], [1, [CAMP.x - 3.6, 0.8, CAMP.z - 2.6], [CAMP.x, 2.0, CAMP.z], 28]),
  veg: { grassR: 8, grassAt: [CAMP.x + 2, CAMP.z + 2], extra: MEADOW_TREES }, shadow: { x: CAMP.x, z: CAMP.z, r: 12 },
  setup(c) {
    const bo = c.person('BO', { x: CAMP.x, z: CAMP.z, yaw: yawTo(CAMP.x, CAMP.z, CAMP.x - 3.3, CAMP.z - 2.2) + 0.3, acc: ['torch'] });
    c.torch(bo, { size: 0.6, n: 18, light: true, lightIntensity: 14, lightDist: 12 });
    bo.anim = (P, t) => P.pose('raiseHand', t, { side: 'R' });
  },
});
// f16: night — the first campfire; the wolves turn away
shot('f16', 'f16', {
  ...NIGHT, exposure: 1.25,
  cam: K([0, [CAMP.x - 4, 1.4, CAMP.z - 3], [CAMP.x, 0.8, CAMP.z], 36], [1, [CAMP.x - 10, 2.6, CAMP.z - 8], [CAMP.x + 6, 1.0, CAMP.z + 8], 38]),
  veg: { grassR: 14, extra: MEADOW_TREES }, shadow: { x: CAMP.x, z: CAMP.z, r: 15 },
  setup(c) {
    c.fire(CAMP.x, CAMP.z, { size: 1.0, smoke: true, lightIntensity: 26, lightDist: 22 }); c.proto('firePit', 0, CAMP.x, CAMP.z);
    let k = 0;
    SPAWN.forEach((s, i) => {
      if (s.who === 'A15') return;
      const a = k / 19 * Math.PI * 2, d = 2.4 + (k % 2) * 0.9; k++;
      const x = CAMP.x + Math.cos(a) * d, z = CAMP.z + Math.sin(a) * d;
      const P = c.person(s.who, { x, z, yaw: yawTo(x, z, CAMP.x, CAMP.z) });
      P.anim = (Q, t) => Q.pose('sitGround', t, { headX: 0.05 });
    });
    [[14, 16], [18, 11], [11, 19]].forEach(([dx, dz], i) => {
      const x = CAMP.x + dx, z = CAMP.z + dz;
      const w = c.animal('wolf', i, x, z, yawTo(x, z, CAMP.x, CAMP.z), { glow: 3 }); wolfEyes(c, w, 0.3);
      c.on(t => { const u = Math.min(1, Math.max(0, (t - 1.2) / 1.2)); w.root.rotation.y = yawTo(x, z, CAMP.x, CAMP.z) + u * Math.PI; const xx = x + u * u * 3 * Math.sign(dx), zz = z + u * u * 3; w.root.position.set(xx, c.h(xx, zz), zz); w.animate(t, { speed: u > 0 && u < 1 ? 0.6 : 0, graze: 0, phase: i }); });
    });
  },
});
