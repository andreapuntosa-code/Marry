// CHAPTER III — FIRST WORDS (years 3-13)
import { shot } from './registry.js';
import { mulberry32 } from '../lib/noise.js';
import { K, orbitCam, M, SPAWN, founders, TIME, MEADOW_TREES, CAMP, ROCK, BERRY, SUNSET_YAW, GOATS, FOREST_EDGE, yawTo, rock, berries, lerpAngle, smooth } from './sets.js';

const NIGHT = { hours: TIME.night, cloud: 0.2, year: 3, town: false, exposure: 1.25 };
const sunsetDir = [Math.sin(SUNSET_YAW), Math.cos(SUNSET_YAW)];
const LIVING = SPAWN.filter(s => s.who !== 'A15');

// the camp of years 3-13: fire pit and lean-to shelters (they appear over time)
const SHELTERS = [...Array(9)].map((_, k) => { const a = k / 9 * Math.PI * 2 + 0.3; return [CAMP.x + Math.cos(a) * 7.5, CAMP.z + Math.sin(a) * 7.5, Math.atan2(CAMP.x - (CAMP.x + Math.cos(a)), CAMP.z - (CAMP.z + Math.sin(a))) + Math.PI, 3 + k * 1.1]; });
function camp(c, year = 3, fire = true) {
  if (fire) { c.fire(CAMP.x, CAMP.z, { size: 0.9, smoke: true, lightIntensity: 24, lightDist: 20 }); }
  c.proto('firePit', 0, CAMP.x, CAMP.z);
  for (const [x, z, yaw, y0] of SHELTERS) if (year >= y0) c.proto('leanTo', 0, x, z, yaw, 1.0);
}
function circle(c, opts = {}) {
  const out = [];
  LIVING.forEach((s, k) => {
    const a = k / LIVING.length * Math.PI * 2 + (opts.rot ?? 0), d = (opts.r ?? 2.5) + (k % 2) * 0.8;
    const x = CAMP.x + Math.cos(a) * d, z = CAMP.z + Math.sin(a) * d;
    const P = c.person(s.who, { x, z, yaw: yawTo(x, z, CAMP.x, CAMP.z) });
    P.anim = (Q, t) => (opts.anim ? opts.anim(Q, t, k, s.who) : Q.pose('sitGround', t, { headX: 0.05 }));
    out.push(P);
  });
  return out;
}
const MV = { grassR: 16, extra: MEADOW_TREES };

shot('w_card', 'chap:w01', {
  ...NIGHT, exposure: 1.3,
  cam: K([0, [CAMP.x - 30, 18, CAMP.z - 34], [CAMP.x, 1, CAMP.z], 38], [1, [CAMP.x - 25, 15, CAMP.z - 28], [CAMP.x, 1, CAMP.z], 38]),
  veg: { r0: 40, rImp: 160, extra: MEADOW_TREES }, shadow: { x: CAMP.x, z: CAMP.z, r: 20 },
  setup(c) { camp(c, 3); circle(c); },
});
// w01: around the fire they start making sounds
shot('w01', 'w01', {
  ...NIGHT,
  cam: K([0, [CAMP.x - 5.5, 1.2, CAMP.z - 4.2], [CAMP.x, 0.9, CAMP.z], 32], [1, [CAMP.x - 4.4, 1.0, CAMP.z - 3.4], [CAMP.x, 0.9, CAMP.z], 30]),
  veg: { grassR: 10, extra: MEADOW_TREES }, shadow: { x: CAMP.x, z: CAMP.z, r: 14 },
  setup(c) { camp(c, 3); circle(c, { anim: (Q, t, k) => (k % 4 === 1 ? Q.pose('talk', t, { phase: k }) : Q.pose('sitGround', t, { headX: 0.05 })) }); },
});
// w02: total chaos (two quick comedic two-shots)
shot('w02a', 'w02', {
  ...NIGHT,
  cam: K([0, [CAMP.x + 1.2, 1.25, CAMP.z - 4.6], [CAMP.x + 1.8, 1.1, CAMP.z - 1.6], 30], [1, [CAMP.x + 1.0, 1.2, CAMP.z - 4.3], [CAMP.x + 1.8, 1.1, CAMP.z - 1.6], 28]),
  veg: { grassR: 8, extra: MEADOW_TREES }, shadow: { x: CAMP.x, z: CAMP.z, r: 10 },
  setup(c) {
    camp(c, 3);
    const a = c.person('A05', { x: CAMP.x + 0.9, z: CAMP.z - 1.4, yaw: 1.4 }); a.anim = (P, t) => P.pose('talk', t * 2.2, { phase: 1 });
    const b = c.person('A18', { x: CAMP.x + 2.7, z: CAMP.z - 1.2, yaw: -1.7 }); b.anim = (P, t) => P.pose(t % 2.4 < 1.2 ? 'shrug' : 'talk', t * 1.8);
  },
});
shot('w02b', 'w02', {
  ...NIGHT,
  cam: K([0, [CAMP.x - 3.8, 1.25, CAMP.z + 1.4], [CAMP.x - 1.2, 1.0, CAMP.z + 2.2], 30], [1, [CAMP.x - 3.6, 1.2, CAMP.z + 1.2], [CAMP.x - 1.2, 1.0, CAMP.z + 2.2], 28]),
  veg: { grassR: 8, extra: MEADOW_TREES }, shadow: { x: CAMP.x, z: CAMP.z, r: 10 },
  setup(c) {
    camp(c, 3);
    const a = c.person('TAM', { x: CAMP.x - 1.6, z: CAMP.z + 1.6, yaw: 2.2 }); a.anim = (P, t) => P.pose('talk', t * 2.6, { phase: 2 });
    const b = c.person('A12', { x: CAMP.x - 0.4, z: CAMP.z + 2.9, yaw: -2.6 }); b.anim = (P, t) => P.pose(t > 1.2 ? 'facepalm' : 'idle', t);
    const d = c.person('BO', { x: CAMP.x - 2.4, z: CAMP.z + 3.4, yaw: 2.8 }); d.anim = (P, t) => P.pose('scratchHead', t);
  },
}, 3.0);
// w03: year 3 — the same sound, always near the berry bushes
shot('w03', 'w03', {
  hours: TIME.morning + 1, cloud: 0.4, year: 3, town: false,
  cam: K([0, [BERRY.x - 9, 1.6, BERRY.z - 7], [BERRY.x, 0.9, BERRY.z], 34], [1, [BERRY.x - 6, 1.4, BERRY.z - 8.5], [BERRY.x + 0.5, 0.9, BERRY.z], 30]),
  veg: { grassR: 14, extra: MEADOW_TREES },
  setup(c) {
    berries(c, BERRY.x, BERRY.z, 5);
    [['ISE', -1.6, -1.4, 'eat'], ['A03', 1.2, -1.8, 'point'], ['A10', -0.4, 1.9, 'talk'], ['MIRA', 2.3, 0.6, 'eat'], ['A20', -2.8, 0.8, 'talk']].forEach(([w, dx, dz, pose], i) => {
      const x = BERRY.x + dx, z = BERRY.z + dz; const P = c.person(w, { x, z, yaw: yawTo(x, z, BERRY.x, BERRY.z) + (pose === 'talk' ? 1.2 : 0) });
      P.anim = (Q, t) => Q.pose(pose, t + i, { phase: i });
    });
  },
});
// w04: "Ila." — Ise holds up a berry
shot('w04', 'w04', {
  hours: TIME.morning + 1.2, cloud: 0.4, year: 3, town: false,
  cam: K([0, [BERRY.x - 3.9, 1.4, BERRY.z - 2.1], [BERRY.x - 1.6, 1.45, BERRY.z - 1.4], 26], [1, [BERRY.x - 3.6, 1.4, BERRY.z - 2.0], [BERRY.x - 1.6, 1.5, BERRY.z - 1.4], 24]),
  veg: { grassR: 10, extra: MEADOW_TREES },
  setup(c) {
    berries(c, BERRY.x, BERRY.z, 5);
    const i = c.person('ISE', { x: BERRY.x - 1.6, z: BERRY.z - 1.4, yaw: yawTo(BERRY.x - 1.6, BERRY.z - 1.4, BERRY.x - 3.6, BERRY.z - 2.3) });
    i.anim = (P, t) => { P.pose('talk', t, { phase: 0 }); P.R.sh.rotation.x = -1.3; P.R.el.rotation.x = -0.6; };
  },
});
// w05: Kra, Nua, Toh — pointing at the forest at dusk
shot('w05', 'w05', {
  hours: TIME.sunset, cloud: 0.35, year: 4, town: false,
  cam: K([0, [M.x + 2, 1.6, M.z + 5], [M.x + 14, 1.6, M.z + 15], 34], [1, [M.x + 2.6, 1.5, M.z + 5.6], [M.x + 14, 1.6, M.z + 15], 32]),
  veg: { grassR: 14, extra: MEADOW_TREES },
  setup(c) {
    [['A06', 6, 8.5, 'point'], ['A14', 7.4, 7.2, 'idle'], ['BO', 5.2, 10.2, 'talk'], ['A01', 8.8, 8.8, 'point']].forEach(([w, dx, dz, pose], i) => {
      const x = M.x + dx, z = M.z + dz; const P = c.person(w, { x, z, yaw: yawTo(x, z, FOREST_EDGE.x, FOREST_EDGE.z) });
      P.anim = (Q, t) => Q.pose(pose, t + i, { phase: i });
    });
  },
});
// w06: ten years pass — timelapse of days over the growing camp
shot('w06', 'w06', {
  hoursFn: (t, d) => 6 + ((t / d) * 5 % 1) * 14, cloud: 0.35, year: 13, town: false, env: 0.6, tScale: 20,
  cam: K([0, [CAMP.x - 22, 12, CAMP.z - 20], [CAMP.x, 0, CAMP.z], 36], [1, [CAMP.x - 19, 11, CAMP.z - 17], [CAMP.x, 0, CAMP.z], 36]),
  veg: { r0: 50, extra: MEADOW_TREES }, shadow: { x: CAMP.x, z: CAMP.z, r: 25 },
  setup(c) {
    c.proto('firePit', 0, CAMP.x, CAMP.z);
    const sh = SHELTERS.map(([x, z, yaw]) => c.proto('leanTo', 0, x, z, yaw, 1.0));
    const f = c.fire(CAMP.x, CAMP.z, { size: 0.8, lightIntensity: 18, lightDist: 16 });
    const r = mulberry32(5);
    const people = LIVING.map((s, k) => c.person(s.who, { x: CAMP.x, z: CAMP.z }));
    const spots = [...Array(6)].map(() => people.map(() => [CAMP.x + (r() - 0.5) * 22, CAMP.z + (r() - 0.5) * 22, r() * 6.28, ['idle', 'walk', 'sitGround', 'talk', 'carry'][Math.floor(r() * 5)]]));
    c.on(t => {
      const u = t / c.dur, day = Math.min(5, Math.floor(u * 5));
      sh.forEach((m, k) => { m.visible = u > k / 10; });
      const hh = 6 + ((u * 5) % 1) * 14; f.group.visible = hh > 18.5;
      people.forEach((P, k) => { const [x, z, yaw, pose] = spots[day][k]; P.place(x, c.h(x, z), z, yaw); P.pose(pose, t * 3 + k, { phase: k }); });
    });
  },
});
// w07: remember A-04? (callback: silhouette on the rock at sunset)
const behindMira = (d, h, side = 0) => [ROCK.x - sunsetDir[0] * d + side, h, ROCK.z - sunsetDir[1] * d];
const sunsetTgt = [ROCK.x + sunsetDir[0] * 40, 6, ROCK.z + sunsetDir[1] * 40];
function miraOnRock(c, opts = {}) {
  rock(c, ROCK.x, ROCK.z, 1.5);
  const P = c.person('MIRA', { x: ROCK.x, z: ROCK.z, yaw: SUNSET_YAW });
  P.anim = opts.anim || ((Q, t) => { Q.pose('sit', t, { seat: 0.95 }); Q.root.position.y = c.h(ROCK.x, ROCK.z); });
  return P;
}
shot('w07', 'w07', {
  hours: TIME.sunset - 0.1, cloud: 0.45, year: 13, town: false,
  cam: K([0, behindMira(6.5, 1.7, 1.6), sunsetTgt, 36], [1, behindMira(5.2, 1.55, 1.1), sunsetTgt, 33]),
  veg: { grassR: 12, extra: MEADOW_TREES },
  setup(c) { miraOnRock(c); },
});
// w08: she turns to Ise and gestures at the sky
shot('w08', 'w08', {
  hours: TIME.sunset - 0.15, cloud: 0.45, year: 13, town: false,
  cam: K([0, [ROCK.x - sunsetDir[1] * 4.5, 1.3, ROCK.z + sunsetDir[0] * 4.5], [ROCK.x + sunsetDir[0] * 0.8, 1.2, ROCK.z + sunsetDir[1] * 0.8], 32], [1, [ROCK.x - sunsetDir[1] * 4.0, 1.3, ROCK.z + sunsetDir[0] * 4.0], [ROCK.x + sunsetDir[0] * 0.8, 1.25, ROCK.z + sunsetDir[1] * 0.8], 30]),
  veg: { grassR: 12, extra: MEADOW_TREES },
  setup(c) {
    const P = miraOnRock(c, { anim: (Q, t) => { Q.pose(t > 1.4 ? 'talk' : 'sit', t, { seat: 0.95 }); if (t > 1.4) { Q.pelvis.position.y = 0.95; Q.L.hip.rotation.x = -1.5; Q.R.hip.rotation.x = -1.45; Q.L.kn.rotation.x = 1.45; Q.R.kn.rotation.x = 1.5; Q.R.sh.rotation.x = -1.3; Q.R.sh.rotation.z = 0.9; } Q.root.position.y = c.h(ROCK.x, ROCK.z); Q.root.rotation.y = SUNSET_YAW + Math.min(1, t / 1.4) * 0.9; } });
    const ix = ROCK.x - sunsetDir[1] * 1.3 + sunsetDir[0] * 0.3, iz = ROCK.z + sunsetDir[0] * 1.3 + sunsetDir[1] * 0.3;
    const i = c.person('ISE', { x: ix, z: iz, yaw: SUNSET_YAW - 0.6 }); i.anim = (Q, t) => Q.pose('sitGround', t, { headX: -0.1 });
  },
});
// w09: "Beautiful." — Mira against the sun
shot('w09', 'w09', {
  hours: TIME.sunset, cloud: 0.4, year: 13, town: false,
  cam: K([0, behindMira(2.4, 1.25, 0.25), [ROCK.x + sunsetDir[0] * 30, 3.5, ROCK.z + sunsetDir[1] * 30], 24], [1, behindMira(2.2, 1.25, 0.2), [ROCK.x + sunsetDir[0] * 30, 3.6, ROCK.z + sunsetDir[1] * 30], 22]),
  veg: { grassR: 8, extra: MEADOW_TREES },
  setup(c) { miraOnRock(c); },
});
// w09L: her line, front close-up in warm light
shot('w09L', 'w09L', {
  hours: TIME.sunset - 0.2, cloud: 0.4, year: 13, town: false,
  cam: K([0, [ROCK.x + sunsetDir[0] * 2.4 + 0.5, 1.45, ROCK.z + sunsetDir[1] * 2.4], [ROCK.x, 1.55, ROCK.z], 28], [1, [ROCK.x + sunsetDir[0] * 2.1 + 0.4, 1.45, ROCK.z + sunsetDir[1] * 2.1], [ROCK.x, 1.6, ROCK.z], 26]),
  veg: { grassR: 8, extra: MEADOW_TREES },
  setup(c) { miraOnRock(c, { anim: (Q, t) => { Q.pose('sit', t, { seat: 0.95, headX: -0.08 }); Q.head.rotation.x += Math.sin(t * 3.1) * 0.03; Q.root.position.y = c.h(ROCK.x, ROCK.z); } }); },
});
// w10: night, the circle around the fire seen from above, slowly turning
shot('w10', 'w10', {
  ...NIGHT, year: 13, exposure: 1.3,
  cam: orbitCam([CAMP.x, CAMP.z], 4.5, 15, 0.0, 0.9, 40, 0),
  veg: { r0: 40, extra: MEADOW_TREES }, shadow: { x: CAMP.x, z: CAMP.z, r: 14 },
  setup(c) { camp(c, 13); circle(c, { r: 2.3 }); },
});
// w11: "It didn't mean I. It didn't mean you." — two faces in the firelight
shot('w11', 'w11', {
  ...NIGHT, year: 13,
  cam: K([0, [CAMP.x + 0.2, 0.9, CAMP.z - 1.2], [CAMP.x + 2.0, 0.8, CAMP.z + 1.6], 28], [1, [CAMP.x + 0.35, 0.9, CAMP.z - 1.0], [CAMP.x + 2.0, 0.8, CAMP.z + 1.6], 26]),
  veg: { grassR: 8, extra: MEADOW_TREES }, shadow: { x: CAMP.x, z: CAMP.z, r: 10 },
  setup(c) {
    camp(c, 13);
    const a = c.person('A16', { x: CAMP.x + 1.4, z: CAMP.z + 2.4, yaw: 2.0 }); a.anim = (P, t) => P.pose('sitGround', t, { headX: -0.05 });
    const b = c.person('A08', { x: CAMP.x + 2.8, z: CAMP.z + 1.1, yaw: -1.2 }); b.anim = (P, t) => P.pose('sitGround', t, { headX: -0.05 });
  },
});
// w12: "It meant: we." — pulling up over the whole circle
shot('w12', 'w12', {
  ...NIGHT, year: 13, exposure: 1.3,
  cam: K([0, [CAMP.x - 3.5, 1.2, CAMP.z - 3.5], [CAMP.x, 0.8, CAMP.z], 38], [1, [CAMP.x - 9, 7.5, CAMP.z - 9], [CAMP.x, 0.5, CAMP.z], 40]),
  veg: { grassR: 12, extra: MEADOW_TREES }, shadow: { x: CAMP.x, z: CAMP.z, r: 14 },
  setup(c) { camp(c, 13); circle(c, { r: 2.3 }); },
});
// w13: and then they gave themselves names — tracking along the line of founders
const LINE = LIVING.map((s, k) => [M.x - 12 + k * 1.35, M.z - 2 + Math.sin(k * 1.7) * 0.25]);
shot('w13', 'w13', {
  hours: TIME.morning, cloud: 0.4, year: 13, town: false,
  cam: K([0, [M.x - 13, 1.55, M.z - 6.5], [M.x - 9, 1.4, M.z - 2], 30], [1, [M.x + 6, 1.55, M.z - 6.5], [M.x + 10, 1.4, M.z - 2], 30], { linear: true }),
  veg: { grassR: 18, extra: MEADOW_TREES },
  setup(c) { LIVING.forEach((s, k) => { const [x, z] = LINE[k]; const P = c.person(s.who, { x, z, yaw: Math.PI + (k % 3 - 1) * 0.15 }); P.anim = (Q, t) => Q.pose('idle', t + k, { phase: k }); }); },
});
// w14-w17: name portraits
shot('w14', 'w14', {
  hours: TIME.afternoon, cloud: 0.35, year: 13, town: false,
  cam: K([0, [BERRY.x - 6.2, 1.25, BERRY.z - 4.6], [BERRY.x - 3.5, 1.35, BERRY.z - 3.0], 28], [1, [BERRY.x - 5.8, 1.25, BERRY.z - 4.3], [BERRY.x - 3.5, 1.45, BERRY.z - 3.0], 26]),
  veg: { grassR: 10, extra: MEADOW_TREES },
  setup(c) { berries(c, BERRY.x, BERRY.z, 4); const i = c.person('ISE', { x: BERRY.x - 3.5, z: BERRY.z - 3.0, yaw: yawTo(BERRY.x - 3.5, BERRY.z - 3.0, BERRY.x - 6, BERRY.z - 4.5) + 0.25 }); i.anim = (P, t) => (t > 1.2 ? P.pose('raiseHand', t, { side: 'R' }) : P.pose('idle', t)); },
});
shot('w15', 'w15', {
  hours: TIME.golden, cloud: 0.4, year: 13, town: false,
  cam: K([0, [ROCK.x + sunsetDir[0] * 3.2 - 1.2, 1.3, ROCK.z + sunsetDir[1] * 3.2 - 0.6], [ROCK.x, 1.35, ROCK.z], 30], [1, [ROCK.x + sunsetDir[0] * 2.9 - 1.1, 1.3, ROCK.z + sunsetDir[1] * 2.9 - 0.5], [ROCK.x, 1.4, ROCK.z], 28]),
  veg: { grassR: 10, extra: MEADOW_TREES },
  setup(c) { miraOnRock(c, { anim: (Q, t) => { Q.pose('sit', t, { seat: 0.95, look: Math.min(1, t / 1.5) * 0.55 }); Q.root.position.y = c.h(ROCK.x, ROCK.z); } }); },
});
shot('w16', 'w16', {
  hours: TIME.afternoon + 1, cloud: 0.35, year: 13, town: false,
  cam: K([0, [CAMP.x - 3.4, 1.1, CAMP.z - 2.4], [CAMP.x - 0.6, 1.5, CAMP.z - 0.4], 30], [1, [CAMP.x - 3.1, 1.05, CAMP.z - 2.2], [CAMP.x - 0.6, 1.55, CAMP.z - 0.4], 28]),
  veg: { grassR: 10, extra: MEADOW_TREES }, shadow: { x: CAMP.x, z: CAMP.z, r: 12 },
  setup(c) {
    camp(c, 13);
    const b = c.person('BO', { x: CAMP.x - 0.6, z: CAMP.z - 0.4, yaw: yawTo(CAMP.x - 0.6, CAMP.z - 0.4, CAMP.x - 3.3, CAMP.z - 2.3), acc: ['torch'] });
    c.torch(b, { size: 0.4 });
    b.anim = (P, t) => P.pose('holdTorch', t);
  },
});
shot('w17', 'w17', {
  hours: TIME.afternoon + 1.4, cloud: 0.35, year: 13, town: false,
  cam: K([0, [GOATS.x - 4.4, 1.35, GOATS.z - 3.4], [GOATS.x - 1.4, 1.4, GOATS.z - 1.2], 30], [1, [GOATS.x - 4.1, 1.35, GOATS.z - 3.1], [GOATS.x - 1.4, 1.45, GOATS.z - 1.2], 28]),
  veg: { grassR: 14 },
  setup(c) {
    const tm = c.person('TAM', { x: GOATS.x - 1.4, z: GOATS.z - 1.2, yaw: yawTo(GOATS.x - 1.4, GOATS.z - 1.2, GOATS.x + 6, GOATS.z + 8) });
    const y0 = yawTo(GOATS.x - 1.4, GOATS.z - 1.2, GOATS.x + 6, GOATS.z + 8), y1 = yawTo(GOATS.x - 1.4, GOATS.z - 1.2, GOATS.x - 4.3, GOATS.z - 3.3);
    tm.anim = (P, t) => { P.pose('idle', t, { look: 0.2 }); P.root.rotation.y = lerpAngle(y0, y1, smooth(1.8, 2.5, t)); };
    for (let i = 0; i < 5; i++) { const x = GOATS.x + 5 + i * 1.6, z = GOATS.z + 7 + (i % 2) * 1.5; const g = c.animal('goat', i, x, z, i); c.on(t => g.animate(t, { speed: 0, phase: i })); }
  },
});
