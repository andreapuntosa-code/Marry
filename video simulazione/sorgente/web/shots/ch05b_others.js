// CHAPTER VI — THE OTHERS (years 611-912): Ama's exodus, Nuvia on the lake, the Tamari of the plain,
// first contact (Yuna's cheese) and the invention of trade.
import * as THREE from 'three';
import { shot, SHOTS } from './registry.js';
import { mulberry32 } from '../lib/noise.js';
import { height, RIVER_PTS } from '../lib/terrain.js';
import { VILLAGERS } from '../lib/people.js';
import { K, orbitCam, TIME, PRIMA, yawTo, lerpAngle, smooth, eraAcc } from './sets.js';
import { LAKE_Y, NUVIA, MEET, TAMARI, SHRINE, PIERS, shoreZ, nuvia, canoeFleet, tamariCamp, goatFlock, herd, nuv, tam, NUV_COLS, TAM_COLS } from './peoples.js';

const vill = (c, i, x, z, o = {}) => c.person(VILLAGERS[i % VILLAGERS.length], { x, z, acc: eraAcc(o.era || 'clay', i), ...o });
// absolute point h metres above the ground or the lake surface
const AB = (x, h, z) => [x, Math.max(height(x, z), LAKE_Y) + h, z];
// x of the river centre at latitude z
function RIV(z) {
  for (let i = 0; i < RIVER_PTS.length - 1; i++) { const [ax, az] = RIVER_PTS[i], [bx, bz] = RIVER_PTS[i + 1]; if (z <= az && z >= bz) return ax + (bx - ax) * (az - z) / (az - bz); }
  return RIVER_PTS[RIVER_PTS.length - 1][0];
}
const WB = (z) => RIV(z) - 44;                  // Ama's road: the west bank
const ZS = shoreZ(NUVIA.x);
const G2 = { x: -24, z: -34 };                  // where Ama gathers the survivors (611)
const REV = { x: -300, z: shoreZ(-300) + 50 };   // the brow above the lake
const M2 = { x: -62, z: shoreZ(-62) + 9 };        // the meeting point on the beach (812)
const FLOOD_LEFT = (c) => c.water(PRIMA.x - 20, PRIMA.z + 6, 70, 60, () => 1.98, { dim: 0.4, deep: 0x2a2116, shallow: 0x433626 });

// a column of walkers along Ama's road; head at z = zHead(t); returns the Crowd
function column(c, n, zHead, opts = {}) {
  const cr = c.crowd(n, { colors: opts.colors || [0xe9e6df, 0xdedbd2, 0xf0ece4, 0xd5d0c4], seed: 21 });
  const r = mulberry32(5), row = [], lat = [];
  for (let i = 0; i < n; i++) { row.push(Math.floor(i / 3) * 1.5 + r() * 0.8); lat.push(((i % 3) - 1) * 1.1 + (r() - 0.5) * 0.6); }
  c.on(t => {
    const zh = zHead(t);
    for (let i = 0; i < n; i++) {
      const z = zh + row[i], x = WB(z) + lat[i];
      cr.set(i, x, height(x, z), z, Math.atan2(WB(z - 3) - WB(z), -3), 1);
    }
    cr.update(t * (opts.bob ?? 1));
  });
  return cr;
}
const clearRoad = (z0, z1) => { const out = []; for (let z = z0; z >= z1; z -= 22) out.push([WB(z), z, 10]); return out; };

// ------------------------------------------------------------------ chapter card: dawn after the flood, the river runs south
shot('e_card', 'chap:e01', {
  hours: TIME.dawn + 0.35, cloud: 0.55, storm: 0.2, year: 611,
  cam: K([0, [-28, 95, 46], [-82, 0, -620], 40], [1, [-34, 92, 26], [-86, 0, -640], 40]),
  veg: { r0: 30, rImp: 220 },
  setup(c) { FLOOD_LEFT(c); },
});
// e01: but not everyone stayed in Prima to ask why (survivors turn south)
shot('e01', 'e01', {
  hours: TIME.morning - 0.4, cloud: 0.65, storm: 0.25, year: 611,
  cam: K([0, [-28.6, 1.75, -7.6], [-40, 1.3, -60], 34], [1, [-28.9, 1.75, -8.6], [-41, 1.3, -62], 34]),
  veg: { grassR: 0, r0: 40 }, shadow: { x: -30, z: -16, r: 14 },
  setup(c) {
    FLOOD_LEFT(c);
    [[-30, -13.5], [-28.4, -12.6], [-31.7, -12.2], [-26.8, -14.8]].forEach(([x, z], i) => {
      const P = vill(c, i + 14, x, z, { yaw: yawTo(x, z, x - 9, z - 50), era: 'early', energy: 0.82 });
      P.anim = (Q, t) => { Q.pose('idle', t + i, { look: 0.15 }); Q.root.rotation.y = lerpAngle(yawTo(x, z, x + 6, z + 40), yawTo(x, z, x - 9, z - 50), smooth(0.2 + i * 0.25, 1.4 + i * 0.25, t)); };
    });
  },
});
// e02a: a woman named Ama gathered the survivors of the riverbank
shot('e02a', 'e02', {
  hours: TIME.morning, cloud: 0.6, storm: 0.15, year: 611,
  cam: K([0, [G2.x + 3.9, 1.7, G2.z - 4.4], [G2.x, 1.5, G2.z], 28], [1, [G2.x + 3.3, 1.65, G2.z - 3.7], [G2.x, 1.55, G2.z], 25]),
  veg: { grassR: 0, r0: 40 }, shadow: { x: G2.x + 2, z: G2.z - 3, r: 12 },
  setup(c) {
    FLOOD_LEFT(c);
    const C = { x: G2.x + 3, z: G2.z - 5 };
    const a = c.person('AMA', { x: G2.x, z: G2.z, yaw: yawTo(G2.x, G2.z, C.x, C.z) });
    a.anim = (P, t) => { P.pose(t < 1.6 ? 'talk' : 'armsOpen', t); if (t > 2.6) { P.R.sh.rotation.x = -1.4 * smooth(2.6, 3.2, t); P.R.sh.rotation.z = 0.4; } };
    const r = mulberry32(12);
    for (let i = 0; i < 13; i++) {
      const ang = -2.6 + i * 0.42 + (r() - 0.5) * 0.2, d = 3.2 + (i % 3) * 1.1 + r() * 0.5;
      const x = G2.x + Math.cos(ang) * d * 0.9 + 1.0, z = G2.z + Math.sin(ang) * d - 1.0;
      { const vx = 3.9, vz = -4.4, L = Math.hypot(vx, vz), px = x - G2.x, pz = z - G2.z, along = (px * vx + pz * vz) / L; if (along > -0.5 && Math.abs(px * vz - pz * vx) / L < 1.5) continue; }
      const P = vill(c, i + 2, x, z, { yaw: yawTo(x, z, G2.x, G2.z), era: 'early', energy: 0.8 });
      P.anim = (Q, t) => Q.pose(i % 3 === 0 ? 'sitGround' : i % 3 === 1 ? 'sad' : 'idle', t + i, { headX: -0.15, phase: i });
    }
  },
});
// e02b: a hundred and twenty AIs, with nothing left to lose
shot('e02b', 'e02', {
  hours: TIME.morning + 0.2, cloud: 0.6, storm: 0.15, year: 611,
  cam: K([0, [G2.x + 16, 14, G2.z - 22], [G2.x + 1, 0.5, G2.z - 3], 36], [1, [G2.x + 18, 19, G2.z - 25], [G2.x + 1, 0.5, G2.z - 3], 36]),
  veg: { grassR: 0, r0: 40 }, shadow: { x: G2.x + 1, z: G2.z - 3, r: 22 },
  setup(c) {
    FLOOD_LEFT(c);
    c.person('AMA', { x: G2.x, z: G2.z, yaw: yawTo(G2.x, G2.z, G2.x + 3, G2.z - 5), pose: 'armsOpen' });
    const cr = c.crowd(118, { colors: [0xe9e6df, 0xdedbd2, 0xf0ece4, 0xd5d0c4], seed: 4 });
    const r = mulberry32(31);
    for (let i = 0; i < 118; i++) { const a = -2.9 + r() * 2.6, d = 3 + Math.sqrt(r()) * 9; const x = G2.x + 1 + Math.cos(a) * d * 1.1, z = G2.z - 2 + Math.sin(a) * d; cr.set(i, x, height(x, z), z, Math.atan2(G2.x - x, G2.z - z), 0); }
    c.on(t => cr.update(t));
  },
}, 3.4);
// e03a: they followed the river south for forty days (timelapse along the west bank)
shot('e03a', 'e03', {
  hoursFn: (t, d) => 7 + ((t / d) * 2 % 1) * 11, cloud: 0.4, year: 611, tScale: 20, env: 0.6,
  cam: (t, d) => {
    const zh = -150 - 80 * t;
    const x = RIV(zh) + 34, z = zh + 52, tx = WB(zh - 26), tz = zh - 26;
    return { pos: new THREE.Vector3(x, height(x, z) + 36, z), target: new THREE.Vector3(tx, height(tx, tz), tz), fov: 38, roll: 0 };
  },
  veg: { r0: 30, rImp: 200 }, clear: clearRoad(-120, -520), shadow: { x: WB(-300), z: -300, r: 160 },
  setup(c) { column(c, 120, (t) => -150 - 80 * t, { bob: 0.35 }); },
});
// e03b: ...until it ended in a lake so big it looked like the sea (the reveal)
const R3 = height(REV.x, REV.z);
shot('e03b', 'e03', {
  hours: TIME.golden - 0.9, cloud: 0.35, year: 611, hero: true,
  cam: K([0, [REV.x + 2.6, R3 + 2.0, REV.z + 13], [REV.x + 6, LAKE_Y + 6, REV.z - 260], 36],
         [1, [REV.x + 1.8, R3 + 3.2, REV.z + 8.5], [REV.x + 4, LAKE_Y + 3, REV.z - 260], 40], { abs: true }),
  veg: { r0: 40, grassR: 10, grassAt: [REV.x, REV.z + 4] }, clear: [[REV.x, REV.z, 16]], shadow: { x: REV.x, z: REV.z + 2, r: 16 },
  setup(c) {
    const a = c.person('AMA', { x: REV.x + 0.6, z: REV.z + 5 });
    a.anim = (P, t) => c.walkTo(P, REV.x + 0.6, REV.z + 5, REV.x + 0.2, REV.z - 1.0, t, 0, 1.8, { speed: 0.75, endPose: 'idle', endYaw: Math.PI + 0.05 });
    const r = mulberry32(8);
    [[-3.2, 1.5], [-4.6, 2.8], [-2.0, 3.2], [3.4, 1.8], [4.6, 3.0], [2.4, 3.6], [-0.9, 4.4]].forEach(([dx, dz], i) => {
      const x1 = REV.x + dx, z1 = REV.z + dz, x0 = x1 + (r() - 0.5) * 1.2, z0 = z1 + 5 + r() * 3;
      const P = vill(c, i + 20, x0, z0, { era: 'early', energy: 0.85 });
      P.anim = (Q, t) => c.walkTo(Q, x0, z0, x1, z1, t, 0.2 + i * 0.12, 2.0 + i * 0.12, { speed: 0.7, phase: i, endYaw: Math.PI + (r() - 0.5) * 0.3 });
    });
    const cr = c.crowd(60, { colors: [0xe9e6df, 0xdedbd2, 0xf0ece4], seed: 6 });
    for (let i = 0; i < 60; i++) { const x = REV.x + (r() - 0.5) * 22, z = REV.z + 16 + r() * 16; cr.set(i, x, height(x, z), z, Math.PI + (r() - 0.5) * 0.4, 0); }
    c.on(t => cr.update(t));
  },
}, 2.31);
// e04: and there, they started over — Nuvia (first huts on the beach)
shot('e04', 'e04', {
  hours: TIME.golden + 0.35, cloud: 0.35, year: 612,
  cam: K([0, AB(NUVIA.x + 9, 2.4, ZS + 36), AB(NUVIA.x - 3, 1.2, ZS - 6), 34], [1, AB(NUVIA.x + 7.5, 2.2, ZS + 33), AB(NUVIA.x - 3, 1.1, ZS - 6), 34], { abs: true }),
  veg: { r0: 40, grassR: 8 }, clear: [[NUVIA.x, ZS + 14, 26]], shadow: { x: NUVIA.x, z: ZS + 14, r: 22 },
  setup(c) {
    c.protos('hut', 0, [[NUVIA.x - 12, ZS + 14, 0.4, 0.9], [NUVIA.x + 13, ZS + 12, -0.5, 0.85]]);
    c.protos('leanTo', 0, [[NUVIA.x + 3, ZS + 19, 2.6, 1.0], [NUVIA.x - 4, ZS + 21, 3.4, 1.0]]);
    c.proto('firePit', 0, NUVIA.x, ZS + 9); c.fire(NUVIA.x, ZS + 9, { size: 0.6, smoke: true, lightIntensity: 8, lightDist: 14 });
    const a = c.person('AMA', { x: NUVIA.x + 1.8, z: ZS + 8, yaw: Math.PI - 0.4 }); a.anim = (P, t) => P.pose('idle', t, { look: 0.3 });
    for (let i = 0; i < 6; i++) {
      const x0 = NUVIA.x - 8 + i * 3.2, z0 = ZS + 25, x1 = NUVIA.x - 9 + i * 2.8, z1 = ZS + 12 + (i % 2) * 2;
      const P = vill(c, i + 30, x0, z0, { era: 'early', acc: i % 2 ? ['basket'] : [] });
      P.anim = (Q, t) => c.walkTo(Q, x0, z0, x1, z1, (t + i * 0.6) % 4.2, 0, 4.2, { movePose: 'carry', speed: 0.6, phase: i });
    }
    [[-6, 6], [5, 5], [8, 10]].forEach(([dx, dz], i) => { const P = vill(c, i + 40, NUVIA.x + dx, ZS + dz, { era: 'early', yaw: Math.PI + i }); P.anim = (Q, t) => Q.pose(i === 1 ? 'dig' : 'plant', t + i); });
  },
});
// e05: cut off from Prima, they changed (Nuvia from the lake, year 700)
shot('e05', 'e05', {
  hours: TIME.morning + 0.5, cloud: 0.4, year: 700,
  cam: K([0, AB(NUVIA.x + 30, 26, ZS - 62), AB(NUVIA.x - 2, 1, ZS + 4), 38], [1, AB(NUVIA.x + 18, 22, ZS - 56), AB(NUVIA.x - 6, 1, ZS + 4), 38], { abs: true }),
  veg: { r0: 30, rImp: 220 }, clear: [[NUVIA.x, ZS + 6, 120]], shadow: { x: NUVIA.x, z: ZS, r: 120 },
  setup(c) { nuvia(c, 700); },
});
// e06a: in two hundred years... (timelapse: the lake village grows 650 -> 811)
shot('e06a', 'e06', {
  yearFn: (t, d) => 650 + 161 * smooth(0.05, 0.95, t / d), yearStep: 400, town: false,
  hoursFn: (t, d) => 7 + ((t / d) * 3 % 1) * 11, cloud: 0.4, tScale: 30, env: 0.6,
  cam: K([0, AB(NUVIA.x + 52, 40, ZS - 92), AB(NUVIA.x - 4, 1, ZS + 4), 40], [1, AB(NUVIA.x + 26, 36, ZS - 98), AB(NUVIA.x - 10, 1, ZS + 4), 40], { abs: true }),
  veg: { r0: 30, rImp: 220 }, clear: [[NUVIA.x, ZS + 6, 130]], shadow: { x: NUVIA.x, z: ZS, r: 140 },
  setup(c) {
    const yf = (t) => 650 + 161 * smooth(0.05, 0.95, t / c.dur);
    nuvia(c, yf, { canoes: false });
    canoeFleet(c, [...Array(12)].map((_, i) => ({ x: NUVIA.x - 80 + i * 14, z: ZS - 30 - (i % 4) * 12, yaw: 1.6, ph: i, v: i % 2, path: (t) => [NUVIA.x - 80 + i * 14 + ((t * 9 + i * 13) % 60) - 30, ZS - 30 - (i % 4) * 12, 1.57] })));
  },
});
// e06b: a new language, a new people (two Nuvians talking on the long pier)
const P1 = PIERS[1], PY = LAKE_Y + 1.75;
shot('e06b', 'e06', {
  hours: TIME.golden - 0.3, cloud: 0.35, year: 811,
  cam: K([0, [P1.x - 0.2, PY + 1.55, P1.z - 10.5], [P1.x, PY + 1.3, P1.z + 6], 32], [1, [P1.x - 0.15, PY + 1.52, P1.z - 9.4], [P1.x, PY + 1.32, P1.z + 6], 30], { abs: true }),
  veg: { r0: 40 }, clear: [[NUVIA.x, ZS + 6, 120]], shadow: { x: P1.x, z: P1.z, r: 14 },
  setup(c) {
    nuvia(c, 811);
    const a = nuv(c, 1, P1.x - 0.45, P1.z - 1.3, { y: PY, yaw: 1.2 }), b = nuv(c, 2, P1.x + 0.4, P1.z - 1.9, { y: PY, yaw: -1.9 });
    a.anim = (P, t) => P.pose('talk', t * 1.2); b.anim = (P, t) => P.pose(t > 1.5 ? 'talk' : 'idle', t * 1.1 + 2);
    const k = c.person('C3', { x: P1.x + 0.1, z: P1.z + 1.6, y: PY, yaw: Math.PI, acc: [{ type: 'headband', color: 0x2a9db0 }] }); k.anim = (P, t) => P.pose('sitGround', t, { headX: 0.3 });
    for (let i = 0; i < 4; i++) { const P = nuv(c, i + 5, P1.x + (i % 2 ? 0.5 : -0.5), P1.z + 4 + i * 2.2, { y: PY, yaw: Math.PI * (i % 2) }); P.anim = (Q, t) => Q.pose(i === 2 ? 'carry' : 'idle', t + i); }
  },
}, 4.95);
// e07a: they didn't build granaries — they built boats (canoes at sunrise, backlit)
const Z7 = ZS - 58;
shot('e07a', 'e07', {
  hours: TIME.dawn + 0.15, cloud: 0.3, year: 811, hero: true,
  cam: K([0, [NUVIA.x - 12, LAKE_Y + 1.15, Z7 - 26], [NUVIA.x + 6, LAKE_Y + 2.2, Z7 + 18], 34], [1, [NUVIA.x - 10.5, LAKE_Y + 1.2, Z7 - 24.5], [NUVIA.x + 8, LAKE_Y + 2.3, Z7 + 18], 34], { abs: true }),
  veg: { r0: 40 }, clear: [[NUVIA.x, ZS + 6, 120]], shadow: { x: NUVIA.x - 6, z: Z7, r: 30 },
  setup(c) {
    nuvia(c, 811, { canoes: false });
    const boats = [0, 1, 2, 3, 4].map(i => ({ x0: NUVIA.x - 16 + i * 7, z: Z7 - 9 + (i % 3) * 6, sp: 1.2 + (i % 2) * 0.35, v: i % 2, ph: i }));
    canoeFleet(c, boats.map(b => ({ x: b.x0, z: b.z, yaw: Math.PI / 2, v: b.v, ph: b.ph, path: (t) => [b.x0 + b.sp * t, b.z, Math.PI / 2] })));
    boats.forEach((b, i) => {
      [-0.9, 0.7].forEach((dz, j) => {
        if (i % 2 && j) return;
        const P = nuv(c, i * 2 + j, b.x0, b.z, { y: LAKE_Y + 0.06, yaw: Math.PI / 2, acc: [{ type: 'headband', color: 0x2a9db0 }, 'staff'] });
        P.anim = (Q, t) => { Q.place(b.x0 + b.sp * t + dz, LAKE_Y + 0.06 + Math.sin(t * 1.3 + b.ph) * 0.035, b.z, Math.PI / 2); Q.pose('sitGround', t); const s = Math.sin(t * 2.6 + i + j); Q.R.sh.rotation.x = -0.9 + s * 0.5; Q.L.sh.rotation.x = -0.9 + s * 0.5; Q.R.hd.rotation.x = 0.9; Q.spine.rotation.x = 0.35 + s * 0.08; };
      });
    });
  },
});
// e07b: they didn't fear the river — they worshipped it (the river shrine at the mouth)
shot('e07b', 'e07', {
  hours: TIME.dawn + 0.7, cloud: 0.3, year: 811, fog: 0.0016,
  cam: K([0, [SHRINE.x - 16.5, 1.8, SHRINE.z + 3.6], [SHRINE.x, 3.6, SHRINE.z], 36], [1, [SHRINE.x - 15.0, 1.75, SHRINE.z + 3.2], [SHRINE.x, 3.8, SHRINE.z], 34]),
  veg: { r0: 40, grassR: 8 }, clear: [[SHRINE.x, SHRINE.z, 12]], shadow: { x: SHRINE.x - 2, z: SHRINE.z, r: 10 },
  setup(c) {
    nuvia(c, 811, { canoes: false });
    c.protos('fish', 0, [[SHRINE.x - 1.2, SHRINE.z + 0.6, 0.3, 1.2], [SHRINE.x - 1.0, SHRINE.z - 0.8, 2.0, 1.2], [SHRINE.x - 1.4, SHRINE.z - 0.1, 1.1, 1.2]], { dy: 0.06 });
    c.protos('pot', 0, [[SHRINE.x - 1.5, SHRINE.z + 1.1, 0, 0.9], [SHRINE.x - 0.9, SHRINE.z + 1.5, 1, 0.8]]);
    for (let i = 0; i < 7; i++) {
      const a = Math.PI + (i - 3) * 0.32, d = 3.6 + (i % 2) * 0.9;
      const x = SHRINE.x + Math.cos(a) * d, z = SHRINE.z + Math.sin(a) * d;
      const P = nuv(c, i, x, z, { yaw: yawTo(x, z, SHRINE.x, SHRINE.z) });
      P.anim = (Q, t) => Q.pose('kneelPray', t + i, { armsUp: 0.55 + 0.45 * Math.max(0, Math.sin(t * 0.8 + i * 0.7)) });
    }
  },
}, 1.72);
// e08a: and they weren't the only ones out there (a lone herder on the great plain)
const P8 = { x: 560, z: -470 };
shot('e08a', 'e08', {
  hours: TIME.golden - 0.2, cloud: 0.45, year: 811, town: false,
  cam: K([0, [P8.x - 13, 0.9, P8.z - 9], [P8.x, 1.6, P8.z], 34], [1, [P8.x - 12, 0.95, P8.z - 8.2], [P8.x, 1.65, P8.z], 32]),
  veg: { grassR: 14, grassAt: [P8.x - 6, P8.z - 4] }, shadow: { x: P8.x, z: P8.z, r: 12 },
  setup(c) {
    const h = tam(c, 0, P8.x, P8.z, { yaw: yawTo(P8.x, P8.z, P8.x + 30, P8.z - 40) }); h.anim = (P, t) => P.pose('idle', t, { look: 0.4 });
    herd(c, 26, P8.x + 3, P8.z + 2, 1.5, 9, { seed: 3 });
    herd(c, 80, P8.x + 40, P8.z + 40, 4, 30, { seed: 5 });
  },
});
// e08b: remember Tam, the goat guy? (callback)
shot('e08b', 'e08', { ...SHOTS.a03 }, 1.84);
// e09a: his herders never stopped wandering (aerial: herd and herders crossing the plain)
const H9 = { x: 520, z: -640 };
shot('e09a', 'e09', {
  hoursFn: (t, d) => 15.2 + 2.2 * (t / d), cloud: 0.4, year: 811, town: false, tScale: 6,
  cam: K([0, [H9.x - 18, 22, H9.z - 40], [H9.x + 6, 0, H9.z], 38], [1, [H9.x + 8, 21, H9.z - 38], [H9.x + 28, 0, H9.z + 3], 38]),
  veg: { r0: 30, rImp: 200, grassR: 0 }, shadow: { x: H9.x + 15, z: H9.z, r: 60 },
  setup(c) {
    const items = [], r = mulberry32(19);
    for (let i = 0; i < 230; i++) { const a = r() * 6.28, d = Math.sqrt(r()); items.push({ x: H9.x + Math.cos(a) * d * 26, z: H9.z + Math.sin(a) * d * 11, yaw: 0, vx: 6.5, vz: 0.9 }); }
    goatFlock(c, items, { seed: 4 });
    const cr = c.crowd(24, { colors: TAM_COLS, seed: 9 });
    const pos = [...Array(24)].map(() => [H9.x - 28 + r() * 50, H9.z + (r() < 0.5 ? -14 : 13) + (r() - 0.5) * 4]);
    c.on(t => { pos.forEach(([x, z], i) => { const xx = x + 6.5 * t, zz = z + 0.9 * t; cr.set(i, xx, height(xx, zz), zz, Math.atan2(6.5, 0.9), 1); }); cr.update(t * 0.5); });
  },
});
// e09b: generation after generation, following the goats across the great plain
const P9 = { x: 610, z: -700 };
shot('e09b', 'e09', {
  hours: TIME.golden + 0.05, cloud: 0.4, year: 811, town: false,
  cam: (t, d) => { const x = P9.x - 2.5 + 1.05 * t, z = P9.z - 7.2; return { pos: new THREE.Vector3(x, height(x, z) + 1.25, z), target: new THREE.Vector3(x + 1.6, height(x + 1.6, P9.z) + 1.0, P9.z), fov: 34, roll: 0 }; },
  veg: { grassR: 16, grassAt: [P9.x + 2, P9.z - 3] }, shadow: { x: P9.x + 2, z: P9.z, r: 12 },
  setup(c) {
    const fam = [['tam', 0, 0, 0.2], ['tam', 1, -1.6, -0.6], ['tam', 3, 1.8, 0.7], ['C5', 0, -0.6, 1.1], ['C9', 0, 0.9, -1.2]];
    fam.forEach(([w, k, dx, dz], i) => {
      const P = w === 'tam' ? tam(c, k, P9.x + dx, P9.z + dz) : c.person(w, { x: P9.x + dx, z: P9.z + dz, acc: [{ type: 'scarf', color: 0xb5813a }] });
      P.anim = (Q, t) => { const x = P9.x - 3 + dx + 1.05 * t; Q.place(x, height(x, P9.z + dz), P9.z + dz, Math.PI / 2); Q.pose('walk', t, { phase: i * 1.7, speed: 0.62 }); };
    });
    for (let i = 0; i < 7; i++) {
      const g = c.animal('goat', i + 2, P9.x + 2 + i * 0.9, P9.z + 2.4 - (i % 3) * 1.3, Math.PI / 2);
      const x0 = P9.x + 1 + (i % 4) * 1.1 + Math.floor(i / 4) * 0.5, z0 = P9.z + 2.2 - (i % 3) * 1.4 + (i > 3 ? -4.6 : 0);
      c.on(t => { const x = x0 + 1.05 * t; g.root.position.set(x, height(x, z0), z0); g.root.rotation.y = Math.PI / 2; g.animate(t, { speed: 0.55, phase: i }); });
    }
    herd(c, 90, P9.x + 20, P9.z + 18, 4, 22, { seed: 6 });
  },
}, 2.28);
// e10a: the Tamari — tents, goats (the camp)
shot('e10a', 'e10', {
  hours: TIME.golden - 0.75, cloud: 0.4, year: 811, town: false,
  cam: K([0, [TAMARI.x + 32, 8.5, TAMARI.z - 36], [TAMARI.x - 4, 1.4, TAMARI.z + 2], 36], [1, [TAMARI.x + 28, 7.5, TAMARI.z - 33], [TAMARI.x - 5, 1.4, TAMARI.z + 2], 36]),
  veg: { r0: 30, grassR: 0 }, clear: [[TAMARI.x, TAMARI.z, 34]], shadow: { x: TAMARI.x, z: TAMARI.z, r: 34 },
  setup(c) {
    tamariCamp(c, { fire: true });
    herd(c, 110, TAMARI.x, TAMARI.z, 28, 70, { seed: 2, keep: (x, z) => Math.hypot(x - (TAMARI.x + 30), z - (TAMARI.z - 34)) > 9 });
    const r = mulberry32(3);
    for (let i = 0; i < 9; i++) {
      const a = r() * 6.28, d = 4 + r() * 9, x = TAMARI.x + Math.cos(a) * d, z = TAMARI.z + Math.sin(a) * d;
      const P = tam(c, i, x, z, { yaw: r() * 6.28 });
      P.anim = (Q, t) => (i % 3 === 0 ? c.walkTo(Q, x, z, x + 3, z - 2, t, 0, 5, { speed: 0.5, phase: i }) : Q.pose(['idle', 'talk', 'carry'][i % 3], t + i, { phase: i }));
    }
  },
});
// e10b: ...and absolutely no kings (around the fire; a goat walks right through)
const F10 = { x: TAMARI.x, z: TAMARI.z };
shot('e10b', 'e10', {
  hours: TIME.golden - 0.4, cloud: 0.4, year: 811, town: false,
  cam: K([0, [F10.x + 3.4, 1.25, F10.z - 4.6], [F10.x - 0.4, 0.9, F10.z + 0.6], 32], [1, [F10.x + 3.0, 1.2, F10.z - 4.1], [F10.x - 0.4, 0.9, F10.z + 0.6], 30]),
  veg: { grassR: 0, r0: 30 }, clear: [[TAMARI.x, TAMARI.z, 34]], shadow: { x: F10.x, z: F10.z, r: 9 },
  setup(c) {
    tamariCamp(c, { fire: true });
    [[-1.9, 1.1, 'sitGround'], [-0.6, 2.2, 'sitGround'], [1.2, 2.0, 'cheer'], [2.1, 0.4, 'sitGround'], [-2.4, -0.6, 'cheer']].forEach(([dx, dz, pose], i) => {
      const x = F10.x + dx, z = F10.z + dz; const P = tam(c, i + 1, x, z, { yaw: yawTo(x, z, F10.x, F10.z) });
      P.anim = (Q, t) => Q.pose(pose, t * 1.4 + i, { headX: -0.1, phase: i });
    });
    const g = c.animal('goat', 3, F10.x - 2.5, F10.z - 1.4, 1.2);
    c.on(t => { const u = smooth(0.2, 2.4, t); const x = F10.x - 3.2 + 6.0 * u, z = F10.z + 1.0 + 0.2 * u; g.root.position.set(x, height(x, z), z); g.root.rotation.y = 1.5; g.animate(t, { speed: u > 0 && u < 1 ? 0.6 : 0, phase: 1 }); });
    herd(c, 50, TAMARI.x, TAMARI.z, 26, 60, { seed: 8 });
  },
}, 2.07);
// e11: no walls, no granaries, no mine — everything belonged to the herd (dusk, sharing around the fire)
shot('e11', 'e11', {
  hours: TIME.dusk + 0.25, cloud: 0.3, year: 811, town: false, exposure: 1.15,
  cam: orbitCam([TAMARI.x, TAMARI.z], 5.4, 1.5, -1.9, -1.3, 34, 0.9),
  veg: { grassR: 0, r0: 30 }, clear: [[TAMARI.x, TAMARI.z, 34]], shadow: { x: TAMARI.x, z: TAMARI.z, r: 9 },
  setup(c) {
    tamariCamp(c, { fire: true, night: true });
    c.protos('cheeseWheel', 0, [[TAMARI.x + 1.2, TAMARI.z - 1.5, 0, 1], [TAMARI.x + 1.6, TAMARI.z - 1.2, 1, 1], [TAMARI.x + 1.0, TAMARI.z - 1.9, 2, 0.9]]);
    const n = 8, pot = c.proto('pot', 0, TAMARI.x, TAMARI.z, 0, 1.1);
    const ppl = [];
    for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2 + 0.2, x = TAMARI.x + Math.cos(a) * 2.6, z = TAMARI.z + Math.sin(a) * 2.6; const P = tam(c, i, x, z, { yaw: yawTo(x, z, TAMARI.x, TAMARI.z) }); P.anim = (Q, t) => Q.pose('sitGround', t + i, { headX: 0 }); ppl.push(P); }
    // the pot goes round: whoever holds it lifts it
    c.after(t => {
      const k = Math.floor(t / 1.1) % n, u = (t % 1.1) / 1.1, P = ppl[k], Q = ppl[(k + 1) % n];
      for (const p of [P, Q]) p.root.updateMatrixWorld(true);
      const a = P.R.hd.getWorldPosition(new THREE.Vector3()), b = Q.L.hd.getWorldPosition(new THREE.Vector3());
      pot.position.lerpVectors(a, b, smooth(0.55, 1.0, u)); pot.position.y -= 0.12;
      P.R.sh.rotation.x = -1.4; P.R.el.rotation.x = -0.5;
    });
    herd(c, 40, TAMARI.x, TAMARI.z, 26, 55, { seed: 12 });
  },
});
// e12: three peoples, three languages, three ways to live (the whole valley from high above)
shot('e12', 'e12', {
  hours: TIME.golden - 0.1, cloud: 0.35, year: 811,
  cam: K([0, [1100, 520, -1700], [-120, 0, -300], 36], [1, [1030, 500, -1740], [-140, 0, -280], 36]),
  veg: { r0: 0, rImp: 0, r1: 1400, rFar: 3200 },
  setup(c) { nuvia(c, 811); tamariCamp(c, { fire: true }); },
});
// e13: year 812, on the shore of the lake, they met for the first time
shot('e13', 'e13', {
  hours: TIME.afternoon + 0.4, cloud: 0.35, year: 812,
  cam: K([0, AB(M2.x + 3, 15, M2.z - 15), AB(M2.x, 0, M2.z + 2), 40], [1, AB(M2.x + 2.2, 13, M2.z - 13), AB(M2.x, 0, M2.z + 2), 40], { abs: true }),
  veg: { r0: 40, grassR: 0 }, clear: [[M2.x, M2.z + 10, 40]], shadow: { x: M2.x, z: M2.z, r: 20 },
  setup(c) {
    nuvia(c, 812);
    canoeFleet(c, [{ x: M2.x - 30, z: shoreZ(M2.x - 30) + 1.5, yaw: 1.2, beach: true, ph: 0, v: 0 }, { x: M2.x - 33, z: shoreZ(M2.x - 33) + 2.5, yaw: 1.5, beach: true, ph: 1, v: 1 }]);
    const walk = (P, x0, z0, x1, z1, i) => { P.anim = (Q, t) => c.walkTo(Q, x0, z0, x1, z1, t, 0.12 * i, c.dur - 0.3, { speed: 0.6, phase: i, endYaw: yawTo(x1, z1, M2.x, M2.z) }); };
    [[0, 0], [-1.4, -1.1], [-1.2, 1.2], [-2.6, 0.1], [-2.8, -1.4]].forEach(([dx, dz], i) => { const x0 = M2.x - 13 + dx, z0 = M2.z - 1 + dz; walk(nuv(c, i, x0, z0, { acc: i === 0 ? [{ type: 'headband', color: 0x2a9db0 }, 'spear'] : undefined }), x0, z0, M2.x - 4.2 + dx * 0.8, M2.z - 1 + dz * 0.8, i); });
    [[0, 0], [1.3, -1.0], [1.2, 1.1], [2.6, 0.2], [2.5, -1.6]].forEach(([dx, dz], i) => { const x0 = M2.x + 13 + dx, z0 = M2.z + 1 + dz; walk(tam(c, i, x0, z0), x0, z0, M2.x + 4.2 + dx * 0.8, M2.z + 0.5 + dz * 0.8, i); });
    [[0, 0], [-1.3, 1.2], [1.3, 1.1], [-0.5, 2.6], [0.8, 2.5]].forEach(([dx, dz], i) => { const x0 = M2.x - 1 + dx, z0 = M2.z + 15 + dz; walk(vill(c, i + 3, x0, z0, { acc: i % 2 ? ['basket'] : eraAcc('clay', i) }), x0, z0, M2.x + dx * 0.8, M2.z + 4.5 + dz * 0.8, i); });
    goatFlock(c, [...Array(12)].map((_, i) => ({ x: M2.x + 19 + (i % 4) * 1.4, z: M2.z + 3 - Math.floor(i / 4) * 1.5, yaw: -1.57, vx: -2.2, vz: 0 })), { seed: 2 });
  },
});
// first-contact positions (812): Nuvians west, Tamari east, Prima north, around M2
const NV = { x: M2.x - 4.2, z: M2.z - 1 }, TM = { x: M2.x + 4.2, z: M2.z + 0.5 }, PR = { x: M2.x, z: M2.z + 4.5 }, MID = { x: M2.x, z: M2.z + 1.0 };
function standoff(c, opts = {}) {
  const out = { nuv: [], tam: [], pri: [] };
  [[0, 0], [-1.3, -1.2], [1.2, -1.0], [-0.9, 1.3], [0.6, 1.6]].forEach(([dx, dz], i) => {
    const x = NV.x + dx - (i ? 0.8 : 0), z = NV.z + dz; const P = nuv(c, i, x, z, { yaw: yawTo(x, z, MID.x, MID.z), acc: i === 0 ? [{ type: 'headband', color: 0x2a9db0 }, 'spear'] : undefined });
    P.anim = (Q, t) => Q.pose(i === 0 ? 'pushSpear' : 'idle', t + i, { look: 0.15, phase: i }); out.nuv.push(P);
  });
  [[0, 0], [1.2, -1.1], [1.0, 1.2], [1.9, 0.1]].forEach(([dx, dz], i) => {
    if (opts.noYuna && i === 0) return;
    const x = TM.x + dx + (i ? 0.6 : 0), z = TM.z + dz; const P = i === 0 ? c.person('YUNA', { x, z, yaw: yawTo(x, z, MID.x, MID.z) }) : tam(c, i, x, z, { yaw: yawTo(x, z, MID.x, MID.z) });
    P.anim = (Q, t) => Q.pose('idle', t + i, { look: 0.2, phase: i }); out.tam.push(P);
  });
  [[0, 0], [-1.3, 1.0], [1.3, 0.9], [-0.4, 2.0], [0.9, 2.2]].forEach(([dx, dz], i) => {
    const x = PR.x + dx, z = PR.z + dz + (i ? 0.4 : 0); const P = vill(c, i + 3, x, z, { yaw: yawTo(x, z, MID.x, MID.z), acc: i === 0 ? ['spear', { type: 'headband', color: 0x8a1c24 }] : i % 2 ? ['basket'] : eraAcc('clay', i) });
    P.anim = (Q, t) => Q.pose(i === 0 ? 'pushSpear' : i === 3 ? 'armsCrossed' : 'idle', t + i, { look: 0.15, phase: i }); out.pri.push(P);
  });
  goatFlock(c, [...Array(9)].map((_, i) => ({ x: TM.x + 3.2 + (i % 3) * 1.3, z: TM.z - 2 + Math.floor(i / 3) * 1.6, yaw: -1.57 + (i - 4) * 0.2 })), { seed: 2 });
  canoeFleet(c, [{ x: M2.x - 26, z: shoreZ(M2.x - 26) + 1.5, yaw: 1.2, beach: true, ph: 0, v: 0 }, { x: M2.x - 29, z: shoreZ(M2.x - 29) + 2.5, yaw: 1.5, beach: true, ph: 1, v: 1 }]);
  return out;
}
const MEETY = height(MID.x, MID.z);
function camFront(px, pz, fx, fz, dist, lat, h, th, fov, push = 0.12) {
  const d = Math.hypot(fx - px, fz - pz), ux = (fx - px) / d, uz = (fz - pz) / d, y = height(px, pz);
  const c0 = [px + ux * dist - uz * lat, y + h, pz + uz * dist + ux * lat], c1 = [px + ux * dist * (1 - push) - uz * lat, y + h, pz + uz * dist * (1 - push) + ux * lat];
  return K([0, c0, [px, y + th, pz], fov], [1, c1, [px, y + th + 0.02, pz], fov - 2], { abs: true });
}
const YU = { x: MID.x + 0.9, z: MID.z }, NO = { x: NV.x + 1.3, z: NV.z + 0.3 }, PO = { x: PR.x - 0.3, z: PR.z - 1.3 };
// e14a: nobody knew what to do (the standoff, low between the groups)
shot('e14a', 'e14', {
  hours: TIME.afternoon + 0.5, cloud: 0.35, year: 812,
  cam: K([0, [MID.x + 0.4, MEETY + 1.25, MID.z - 11.5], [MID.x, MEETY + 1.1, MID.z + 1.5], 42], [1, [MID.x + 0.3, MEETY + 1.2, MID.z - 10.0], [MID.x, MEETY + 1.1, MID.z + 1.5], 40], { abs: true }),
  veg: { r0: 40, grassR: 0 }, clear: [[M2.x, M2.z + 10, 30]], shadow: { x: MID.x, z: MID.z, r: 12 },
  setup(c) { nuvia(c, 812); standoff(c); },
});
// e14b: so a Tamari herder named Yuna did the only thing that made sense (she steps out)
shot('e14b', 'e14', {
  hours: TIME.afternoon + 0.55, cloud: 0.35, year: 812,
  cam: K([0, [TM.x + 1.2, MEETY + 1.45, TM.z - 6.2], [TM.x - 1.2, MEETY + 1.25, TM.z], 30], [1, [MID.x + 2.6, MEETY + 1.45, MID.z - 5.6], [MID.x + 0.6, MEETY + 1.3, MID.z], 30], { abs: true }),
  veg: { r0: 40, grassR: 0 }, clear: [[M2.x, M2.z + 10, 30]], shadow: { x: MID.x + 3, z: MID.z, r: 12 },
  setup(c) {
    nuvia(c, 812); standoff(c, { noYuna: true });
    const y = c.person('YUNA', { x: TM.x, z: TM.z });
    y.anim = (P, t) => c.walkTo(P, TM.x, TM.z, MID.x + 0.9, MID.z, t, 0.3, 1.9, { speed: 0.5, endYaw: yawTo(MID.x + 0.9, MID.z, NV.x, NV.z) });
  },
}, 2.6);
// e15: she offered them cheese (close)
function offer(P, k) { P.L.sh.rotation.x = -1.5 * k; P.R.sh.rotation.x = -1.5 * k; P.L.sh.rotation.z = 0.32 * k; P.R.sh.rotation.z = -0.32 * k; P.L.el.rotation.x = -0.55 * k; P.R.el.rotation.x = -0.55 * k; }
function holdBetweenHands(c, P, m, dy = 0.02) {
  const a = new THREE.Vector3(), b = new THREE.Vector3();
  c.after(() => { P.root.updateMatrixWorld(true); P.L.hd.getWorldPosition(a); P.R.hd.getWorldPosition(b); m.position.copy(a).add(b).multiplyScalar(0.5); m.position.y += dy; m.rotation.y = P.root.rotation.y; });
}
shot('e15', 'e15', {
  hours: TIME.afternoon + 0.6, cloud: 0.35, year: 812, aperture: 1.3,
  cam: camFront(YU.x, YU.z, NV.x, NV.z, 3.7, 0.7, 1.45, 1.12, 28),
  veg: { r0: 40, grassR: 0 }, clear: [[M2.x, M2.z + 10, 30]], shadow: { x: MID.x, z: MID.z, r: 8 },
  setup(c) {
    nuvia(c, 812); const s = standoff(c, { noYuna: true });
    const y = c.person('YUNA', { x: YU.x, z: YU.z, yaw: yawTo(YU.x, YU.z, NV.x, NV.z), acc: [{ type: 'scarf', color: 0x8a4a22 }] });
    y.anim = (P, t) => { P.pose('idle', t, { look: 0 }); offer(P, smooth(0.0, 0.5, t)); P.head.rotation.x = -0.05; };
    holdBetweenHands(c, y, c.proto('cheeseWheel', 0, MID.x, MID.z, 0, 0.95), -0.1);
    s.nuv.forEach((P, i) => { P.anim = (Q, t) => { Q.pose(i === 0 ? 'pushSpear' : 'idle', t + i, { look: 0 }); if (i === 1) Q.pose('scratchHead', t); }; });
  },
});
// e16a: the Nuvians offered fish
shot('e16a', 'e16', {
  hours: TIME.afternoon + 0.65, cloud: 0.35, year: 812, aperture: 1.2,
  cam: camFront(NO.x, NO.z, MID.x, MID.z, 3.7, -0.8, 1.45, 1.1, 28),
  veg: { r0: 40, grassR: 0 }, clear: [[M2.x, M2.z + 10, 30]], shadow: { x: NV.x + 2, z: NV.z, r: 8 },
  setup(c) {
    nuvia(c, 812); standoff(c);
    const n = nuv(c, 3, NO.x, NO.z, { yaw: yawTo(NO.x, NO.z, MID.x, MID.z) });
    n.anim = (P, t) => { P.pose('idle', t, { look: 0 }); offer(P, smooth(0.1, 0.6, t)); };
    const f = c.proto('fish', 0, 0, 0, 0, 1.05); holdBetweenHands(c, n, f, 0.03); c.after(() => { f.rotation.y += Math.PI / 2; });
  },
});
// e16b: Prima offered pots
shot('e16b', 'e16', {
  hours: TIME.afternoon + 0.65, cloud: 0.35, year: 812, aperture: 1.2,
  cam: camFront(PO.x, PO.z, MID.x, MID.z, 3.7, 0.8, 1.45, 1.08, 28),
  veg: { r0: 40, grassR: 0 }, clear: [[M2.x, M2.z + 10, 30]], shadow: { x: PR.x, z: PR.z - 2, r: 8 },
  setup(c) {
    nuvia(c, 812); standoff(c);
    const p = vill(c, 9, PO.x, PO.z, { yaw: yawTo(PO.x, PO.z, MID.x, MID.z), acc: eraAcc('clay', 2) });
    p.anim = (P, t) => { P.pose('idle', t, { look: 0 }); offer(P, smooth(0.05, 0.5, t)); };
    holdBetweenHands(c, p, c.proto('pot', 0, 0, 0, 0, 0.6), -0.16);
  },
}, 1.58);
// e16c: and just like that, they invented trade (the beach market forms; crane up)
shot('e16c', 'e16', {
  hours: TIME.afternoon + 0.8, cloud: 0.35, year: 812,
  cam: K([0, AB(MID.x + 6, 2.2, MID.z - 9), AB(MID.x, 0.9, MID.z + 1), 34], [1, AB(MID.x + 9, 9.5, MID.z - 15), AB(MID.x - 1, 0.5, MID.z + 2), 36], { abs: true }),
  veg: { r0: 40, grassR: 0 }, clear: [[M2.x, M2.z + 10, 30]], shadow: { x: MID.x, z: MID.z, r: 16 },
  setup(c) {
    nuvia(c, 812);
    canoeFleet(c, [0, 1, 2].map(i => ({ x: M2.x - 26 - i * 3, z: shoreZ(M2.x - 26 - i * 3) + 1.5 + i, yaw: 1.2 + i * 0.2, beach: true, ph: i, v: i % 2 })));
    const r = mulberry32(44);
    const goods = { pot: [], fish: [], cheeseWheel: [], grainBasket: [] };
    for (let k = 0; k < 6; k++) {
      const gx = MID.x - 5 + (k % 3) * 5, gz = MID.z - 1 + Math.floor(k / 3) * 4.5;
      const cloth = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 1.3).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ color: [0x9a3b2a, 0x2a9db0, 0xc9a45a][k % 3], roughness: 0.9 }));
      cloth.position.set(gx, height(gx, gz) + 0.03, gz); cloth.rotation.y = r() * 0.5; cloth.receiveShadow = true; c.add(cloth); c.own(cloth.geometry);
      const kind = ['pot', 'fish', 'cheeseWheel', 'grainBasket'][k % 4];
      for (let j = 0; j < 4; j++) goods[kind].push([gx - 0.5 + (j % 2) * 0.9, gz - 0.3 + Math.floor(j / 2) * 0.55, r() * 6, kind === 'pot' ? 0.75 : 1.1]);
    }
    for (const [k, items] of Object.entries(goods)) if (items.length) c.protos(k, 0, items, { dy: 0.04 });
    for (let i = 0; i < 18; i++) {
      const x = MID.x - 8 + r() * 16, z = MID.z - 4 + r() * 12;
      const P = i % 3 === 0 ? nuv(c, i, x, z) : i % 3 === 1 ? tam(c, i, x, z) : vill(c, i, x, z, { acc: eraAcc('clay', i) });
      P.root.rotation.y = r() * 6.28;
      P.anim = (Q, t) => (i % 4 === 0 ? c.walkTo(Q, x, z, x + 2.5, z + 1, t, 0, 4, { speed: 0.55, phase: i }) : Q.pose(['talk', 'idle', 'point', 'shrug'][i % 4], t + i, { phase: i }));
    }
    goatFlock(c, [...Array(10)].map((_, i) => ({ x: MID.x + 9 + (i % 3) * 1.5, z: MID.z + Math.floor(i / 3) * 1.4, yaw: r() * 6 })), { seed: 3 });
  },
}, 2.9);
// e17: in a single century, the population of the whole valley doubled (timelapse: the beach market becomes a trading town)
const STALLS = (() => { const r = mulberry32(912), out = []; for (let i = 0; i < 40; i++) { const a = r() * 6.28, d = 6 + Math.sqrt(r()) * 34; out.push([M2.x + Math.cos(a) * d * 1.3, M2.z + 8 + Math.sin(a) * d * 0.7, r() * 6.28, 1, undefined, i]); } return out; })();
shot('e17', 'e17', {
  yearFn: (t, d) => 812 + 100 * smooth(0.05, 0.95, t / d), yearStep: 400, groundStep: 50,
  hoursFn: (t, d) => 7.5 + ((t / d) * 3 % 1) * 10.5, cloud: 0.4, tScale: 30, env: 0.6,
  cam: K([0, AB(M2.x + 70, 46, M2.z - 70), AB(M2.x - 30, 0, M2.z + 10), 40], [1, AB(M2.x + 55, 52, M2.z - 80), AB(M2.x - 34, 0, M2.z + 12), 40], { abs: true }),
  veg: { r0: 30, rImp: 220 }, clear: [[M2.x, M2.z + 10, 60], [NUVIA.x, ZS + 6, 130]], shadow: { x: M2.x - 20, z: M2.z, r: 90 },
  setup(c) {
    const yf = (t) => 812 + 100 * smooth(0.05, 0.95, t / c.dur);
    nuvia(c, yf);
    const ims = [0, 1, 2, 3].map(v => { const l = STALLS.filter(s => s[5] % 4 === v); const im = c.protos('stall', v, l); im.userData.l = l; return im; });
    const cr = c.crowd(400, { colors: [...NUV_COLS, ...TAM_COLS, 0xf2f2f2, 0xeeeeea], seed: 17 });
    const r = mulberry32(5), pp = [...Array(400)].map(() => { const a = r() * 6.28, d = 3 + Math.sqrt(r()) * 46; return [M2.x + Math.cos(a) * d * 1.3, M2.z + 8 + Math.sin(a) * d * 0.7, r() * 6.28]; });
    c.on(t => {
      const u = smooth(0.05, 0.95, t / c.dur);
      for (const im of ims) im.count = im.userData.l.filter(s => s[5] < 6 + 34 * u).length;
      const n = Math.floor(60 + 340 * u);
      pp.forEach(([x, z, yaw], i) => cr.set(i, x, i < n ? height(x, z) : -999, z, yaw + t, 0));
      cr.update(t);
    });
  },
});
// e18: which, as you've probably guessed, was about to become a problem (a crowded Prima street at dusk)
const SQ = { x: -16, z: 2 };
shot('e18', 'e18', {
  hours: TIME.dusk - 0.05, cloud: 0.5, year: 912, grade: 'sad',
  cam: K([0, [SQ.x + 5.8, 1.6, SQ.z - 5.2], [SQ.x + 0.4, 1.4, SQ.z + 0.3], 30], [1, [SQ.x + 4.9, 1.6, SQ.z - 4.4], [SQ.x + 0.4, 1.45, SQ.z + 0.3], 27]),
  veg: { r0: 40 }, shadow: { x: SQ.x, z: SQ.z, r: 12 },
  setup(c) {
    const b = c.proto('grainBasket', 0, SQ.x + 0.4, SQ.z + 0.2, 0, 1.0);
    const a1 = vill(c, 4, SQ.x - 0.6, SQ.z + 0.4, { yaw: yawTo(SQ.x - 0.6, SQ.z + 0.4, SQ.x + 1.4, SQ.z) }), a2 = vill(c, 9, SQ.x + 1.4, SQ.z, { yaw: yawTo(SQ.x + 1.4, SQ.z, SQ.x - 0.6, SQ.z + 0.4) });
    a1.anim = (P, t) => P.pose(t % 2 < 1 ? 'point' : 'talk', t * 1.6); a2.anim = (P, t) => P.pose(t % 2.4 < 1.2 ? 'talk' : 'armsOpen', t * 1.7 + 1);
    const g = c.person('V21', { x: SQ.x + 4.5, z: SQ.z + 3.5, acc: ['helmet', { type: 'sash', color: 0xb3122a }, 'spear'], scale: 1.12 });
    g.anim = (P, t) => { P.pose('pushSpear', t); P.root.rotation.y = lerpAngle(Math.PI, yawTo(SQ.x + 4.5, SQ.z + 3.5, SQ.x + 0.4, SQ.z), smooth(1.6, 2.6, t)); };
    const r = mulberry32(7);
    for (let i = 0; i < 16; i++) {
      const x0 = SQ.x - 9 + r() * 18, z0 = SQ.z + 2 + r() * 8, x1 = x0 + (r() - 0.5) * 6, z1 = z0 + (r() - 0.5) * 3;
      const P = vill(c, i + 12, x0, z0, { acc: i % 3 ? ['basket'] : eraAcc('clay', i) });
      P.anim = (Q, t) => (i % 3 ? c.walkTo(Q, x0, z0, x1, z1, t, 0, 5, { movePose: i % 2 ? 'carry' : 'walk', speed: 0.55, phase: i }) : Q.pose('idle', t + i, { phase: i }));
    }
  },
});
