// CHAPTER IV — THE FARM (years 15-112)
import * as THREE from 'three';
import { shot } from './registry.js';
import { mulberry32 } from '../lib/noise.js';
import { K, orbitCam, M, SPAWN, founders, TIME, MEADOW_TREES, CAMP, ROCK, BERRY, SUNSET_YAW, GOATS, PRIMA, FIRST_FIELD, RIVERBANK,
  yawTo, rock, berries, lerpAngle, smooth, pebbles, eraAcc } from './sets.js';

const HUNT = { x: 214, z: 300 };
const PEN = { x: -42, z: 34 };
const LIVING = SPAWN.filter(s => s.who !== 'A15');
const sunsetDir = [Math.sin(SUNSET_YAW), Math.cos(SUNSET_YAW)];
const FF = FIRST_FIELD;

function goatHerd(c, n, x, z, opts = {}) {
  const out = [];
  const r = mulberry32(opts.seed ?? 3);
  for (let i = 0; i < n; i++) {
    const gx = x + (r() - 0.5) * (opts.spread ?? 5), gz = z + (r() - 0.5) * (opts.spread ?? 5);
    const g = c.animal('goat', i, gx, gz, opts.yaw ?? r() * 6.28);
    g.base = [gx, gz]; g.i = i;
    if (opts.lying) g.root.position.y -= 0.28;
    out.push(g);
  }
  return out;
}
function campProps(c, opts = {}) {
  c.proto('firePit', 0, CAMP.x, CAMP.z);
  for (let k = 0; k < 9; k++) { const a = k / 9 * Math.PI * 2 + 0.3; c.proto('leanTo', 0, CAMP.x + Math.cos(a) * 7.5, CAMP.z + Math.sin(a) * 7.5, -a + Math.PI / 2, 1.0); }
  if (opts.fire) c.fire(CAMP.x, CAMP.z, { size: 0.9, smoke: true, lightIntensity: 24, lightDist: 20 });
}
const STORE = { x: CAMP.x + 5.2, z: CAMP.z - 3.2 };       // the winter food supply (baskets)
function supply(c, knocked = 0) {
  const items = [];
  for (let i = 0; i < 12; i++) items.push([STORE.x + (i % 4) * 0.62 - 0.9, STORE.z + Math.floor(i / 4) * 0.6 - 0.6, i * 0.7, 1.0]);
  c.protos('grainBasket', 0, items.slice(knocked));
  if (knocked) for (let i = 0; i < knocked; i++) { const m = c.proto('grainBasket', 0, STORE.x - 1.6 + i * 0.5, STORE.z + 1.2 + (i % 2) * 0.4, i, 1.0); m.rotation.z = 1.4; m.position.y += 0.2; }
}

// chapter card: the river valley where Prima will be
shot('a_card', 'chap:a01', {
  hours: TIME.morning, cloud: 0.4, year: 15, town: false,
  cam: K([0, [-150, 46, -90], [-45, 2, 0], 38], [1, [-128, 40, -70], [-45, 2, 0], 38]),
  veg: { r0: 40, rImp: 200 },
});
// a01: hunting was a disaster
shot('a01', 'a01', {
  hours: TIME.morning + 1.5, cloud: 0.35, year: 15, town: false,
  cam: K([0, [HUNT.x - 4, 1.4, HUNT.z - 12], [HUNT.x - 4, 1.0, HUNT.z], 36], [1, [HUNT.x + 8, 1.4, HUNT.z - 12], [HUNT.x + 10, 1.0, HUNT.z], 36]),
  veg: { grassR: 18 },
  setup(c) {
    [0, 1, 2].forEach(i => {
      const d = c.animal('deer', i + 1, HUNT.x, HUNT.z, 1.57);
      c.on(t => { const x = HUNT.x - 6 + t * 9 + i * 1.8, z = HUNT.z + 1.5 * i - 1; d.root.position.set(x, c.h(x, z), z); d.root.rotation.y = 1.57; d.animate(t, { speed: 2.2, phase: i }); });
    });
    [['A03', 0], ['A17', 1], ['A20', 2]].forEach(([w, i]) => {
      const P = c.person(w, { x: HUNT.x - 10, z: HUNT.z + i * 1.2 - 1.5 });
      P.anim = (Q, t) => {
        const fall = i === 1 && t > 1.9;
        const x = HUNT.x - 11 + Math.min(t, fall ? 1.9 : 9) * 4.2 - i * 1.2, z = HUNT.z + i * 1.2 - 1.5;
        Q.place(x, c.h(x, z), z, 1.57);
        if (fall) Q.pose('fallDown', (t - 1.9) * 1.6); else Q.pose('run', t, { phase: i });
      };
    });
  },
});
// a02a: Tam follows a herd of wild goats
shot('a02a', 'a02', {
  hours: TIME.golden - 0.4, cloud: 0.35, year: 16, town: false,
  cam: K([0, [GOATS.x - 9, 1.5, GOATS.z - 6], [GOATS.x, 1.0, GOATS.z + 2], 34], [1, [GOATS.x - 6.5, 1.5, GOATS.z - 3.5], [GOATS.x + 2.5, 1.0, GOATS.z + 4.5], 34]),
  veg: { grassR: 16 },
  setup(c) {
    const herd = goatHerd(c, 8, GOATS.x + 2, GOATS.z + 4, { yaw: 0.7, spread: 4 });
    c.on(t => herd.forEach(g => { const x = g.base[0] + t * 0.9 * Math.sin(0.7), z = g.base[1] + t * 0.9 * Math.cos(0.7); g.root.position.set(x, c.h(x, z), z); g.animate(t, { speed: 0.5, phase: g.i }); }));
    const tm = c.person('TAM', { x: GOATS.x - 2, z: GOATS.z - 1, acc: ['staff'] });
    tm.anim = (P, t) => c.walkTo(P, GOATS.x - 2.5, GOATS.z - 1.5, GOATS.x - 2.5 + 3.6 * Math.sin(0.7), GOATS.z - 1.5 + 3.6 * Math.cos(0.7), t, 0, 4, { speed: 0.6 });
  },
});
// a02b: he slept next to them
shot('a02b', 'a02', {
  hours: TIME.night, cloud: 0.2, year: 16, town: false, exposure: 1.2,
  cam: K([0, [GOATS.x + 3.6, 1.1, GOATS.z - 3.2], [GOATS.x, 0.3, GOATS.z], 32], [1, [GOATS.x + 3.2, 1.0, GOATS.z - 2.8], [GOATS.x, 0.3, GOATS.z], 30]),
  veg: { grassR: 10 }, shadow: { x: GOATS.x, z: GOATS.z, r: 10 },
  setup(c) {
    const herd = goatHerd(c, 6, GOATS.x, GOATS.z, { spread: 4.5, lying: true, seed: 8 });
    c.on(t => herd.forEach(g => g.animate(t, { speed: 0, graze: 0, phase: g.i })));
    const tm = c.person('TAM', { x: GOATS.x, z: GOATS.z, yaw: 2.4 }); tm.anim = (P, t) => P.pose('sleep', t);
  },
}, 3.9);
// a03: one morning, the goats started following him
shot('a03', 'a03', {
  hours: TIME.dawn + 0.6, cloud: 0.35, year: 16, town: false,
  cam: K([0, [GOATS.x + 1, 0.9, GOATS.z + 7], [GOATS.x, 1.0, GOATS.z], 34], [1, [GOATS.x + 1, 0.9, GOATS.z + 9.5], [GOATS.x, 1.0, GOATS.z + 3], 34]),
  veg: { grassR: 14, grassAt: [GOATS.x, GOATS.z + 2] },
  setup(c) {
    const tm = c.person('TAM', { x: GOATS.x, z: GOATS.z, acc: ['staff'] });
    tm.anim = (P, t) => c.walkTo(P, GOATS.x, GOATS.z, GOATS.x, GOATS.z + 3.6, t, 0, c.dur, { speed: 0.6 });
    const herd = goatHerd(c, 7, GOATS.x, GOATS.z - 3, { yaw: 0, spread: 3.2, seed: 5 });
    c.on(t => herd.forEach(g => { const x = g.base[0], z = g.base[1] + t * 1.15; g.root.position.set(x, c.h(x, z), z); g.root.rotation.y = 0; g.animate(t, { speed: 0.6, phase: g.i }); }));
  },
});
// a04a: the first farm animal — Tam presents his goats
shot('a04a', 'a04', {
  hours: TIME.afternoon, cloud: 0.35, year: 17, town: false,
  cam: K([0, [CAMP.x - 6, 1.5, CAMP.z - 13], [CAMP.x - 3, 1.2, CAMP.z - 5], 34], [1, [CAMP.x - 5, 1.4, CAMP.z - 11.5], [CAMP.x - 3, 1.2, CAMP.z - 5], 32]),
  veg: { grassR: 14, extra: MEADOW_TREES }, shadow: { x: CAMP.x - 3, z: CAMP.z - 5, r: 18 },
  setup(c) {
    campProps(c);
    c.proto('pen', 0, CAMP.x - 3, CAMP.z - 2.5, 0, 0.6);
    const herd = goatHerd(c, 5, CAMP.x - 3, CAMP.z - 2.5, { spread: 3, seed: 2 });
    c.on(t => herd.forEach(g => g.animate(t, { speed: 0, phase: g.i })));
    const tm = c.person('TAM', { x: CAMP.x - 3.5, z: CAMP.z - 7, yaw: Math.PI + 0.2, acc: ['staff'] }); tm.anim = (P, t) => P.pose('armsOpen', t);
    [['BO', -6.5, -7.5], ['A06', -1, -8.6], ['MIRA', -5.4, -9.2]].forEach(([w, dx, dz], i) => { const x = CAMP.x + dx, z = CAMP.z + dz; const P = c.person(w, { x, z, yaw: yawTo(x, z, CAMP.x - 3, CAMP.z - 2.5) }); P.anim = (Q, t) => Q.pose(i === 0 ? 'scratchHead' : 'idle', t + i); });
  },
});
// a04b: ...a week later: a goat sneaks towards the winter supply
shot('a04b', 'a04', {
  hours: TIME.afternoon + 1, cloud: 0.35, year: 17, town: false,
  cam: K([0, [STORE.x - 3.2, 0.5, STORE.z - 3.0], [STORE.x, 0.4, STORE.z], 30], [1, [STORE.x - 3.0, 0.5, STORE.z - 2.7], [STORE.x, 0.4, STORE.z], 28]),
  veg: { grassR: 8, extra: MEADOW_TREES }, shadow: { x: STORE.x, z: STORE.z, r: 8 },
  setup(c) {
    campProps(c); supply(c);
    const g = c.animal('goat', 1, STORE.x - 3, STORE.z + 1.5, 1.2);
    c.on(t => { const x = STORE.x - 3.2 + Math.min(t, 2.6) * 0.7, z = STORE.z + 1.4 - Math.min(t, 2.6) * 0.25; g.root.position.set(x, c.h(x, z), z); g.animate(t, { speed: t < 2.6 ? 0.35 : 0, graze: t < 2.6 ? 0 : 0.8 }); });
  },
}, 3.7);
// a05: a goat ate the entire winter food supply
shot('a05', 'a05', {
  hours: TIME.afternoon + 1.2, cloud: 0.35, year: 17, town: false,
  cam: K([0, [STORE.x + 2.4, 0.9, STORE.z - 2.6], [STORE.x - 0.4, 0.4, STORE.z + 0.2], 32], [1, [STORE.x + 2.2, 0.85, STORE.z - 2.3], [STORE.x - 0.4, 0.4, STORE.z + 0.2], 30]),
  veg: { grassR: 8, extra: MEADOW_TREES }, shadow: { x: STORE.x, z: STORE.z, r: 8 },
  setup(c) {
    campProps(c); supply(c, 5);
    const g = c.animal('goat', 1, STORE.x - 0.9, STORE.z + 0.9, 2.6);
    c.on(t => g.animate(t, { speed: 0, graze: 0.85 + 0.15 * Math.sin(t * 6) }));
  },
});
// a06: Tam was not invited to dinner that night
shot('a06', 'a06', {
  hours: TIME.night, cloud: 0.2, year: 17, town: false, exposure: 1.25,
  cam: K([0, [CAMP.x - 14.5, 1.1, CAMP.z - 9], [CAMP.x - 4, 0.9, CAMP.z - 2], 32], [1, [CAMP.x - 14, 1.05, CAMP.z - 8.6], [CAMP.x - 4, 0.9, CAMP.z - 2], 30]),
  veg: { grassR: 12, extra: MEADOW_TREES }, shadow: { x: CAMP.x - 6, z: CAMP.z - 4, r: 16 },
  setup(c) {
    campProps(c, { fire: true });
    LIVING.forEach((s, k) => { if (s.who === 'TAM') return; const a = k / LIVING.length * Math.PI * 2, d = 2.4 + (k % 2) * 0.8; const x = CAMP.x + Math.cos(a) * d, z = CAMP.z + Math.sin(a) * d; const P = c.person(s.who, { x, z, yaw: yawTo(x, z, CAMP.x, CAMP.z) }); P.anim = (Q, t) => Q.pose(k % 2 ? 'eat' : 'sitGround', t + k, { headX: 0.05 }); });
    const tm = c.person('TAM', { x: CAMP.x - 11.5, z: CAMP.z - 6.5, yaw: yawTo(CAMP.x - 11.5, CAMP.z - 6.5, CAMP.x, CAMP.z) }); tm.anim = (P, t) => P.pose('headInHands', t, { seat: 0.25 });
    const g = c.animal('goat', 2, CAMP.x - 12.6, CAMP.z - 5.6, 0.9); c.on(t => g.animate(t, { speed: 0, phase: 1 }));
  },
});
// a07: where they threw away berry seeds, new plants were growing
function sprouts(c, x, z, s = 0.13, stage = 0) { const m = c.proto('crop', stage, x, z, 0.3, 1, 0); m.scale.set(s, s * 1.4, s); return m; }
shot('a07', 'a07', {
  hours: TIME.morning + 1, cloud: 0.4, year: 30, town: false,
  cam: K([0, [CAMP.x + 9.5, 0.8, CAMP.z + 3.4], [CAMP.x + 11.5, 0.35, CAMP.z + 5.8], 30], [1, [CAMP.x + 9.8, 0.75, CAMP.z + 3.8], [CAMP.x + 11.5, 0.35, CAMP.z + 5.8], 28]),
  veg: { grassR: 8, grassAt: [CAMP.x + 8, CAMP.z + 2], extra: MEADOW_TREES }, clear: [[CAMP.x + 11.5, CAMP.z + 6, 2.5]],
  setup(c) {
    sprouts(c, CAMP.x + 11.6, CAMP.z + 6.1);
    const seeds = pebbles(c, 30, 0x4a2a1e); const r = mulberry32(4);
    for (let i = 0; i < 30; i++) { const x = CAMP.x + 12.6 + (r() - 0.5) * 0.8, z = CAMP.z + 5.2 + (r() - 0.5) * 0.8; seeds.set(i, x, c.h(x, z) + 0.03, z, 0.5); }
    const i = c.person('ISE', { x: CAMP.x + 10.7, z: CAMP.z + 5.0, yaw: yawTo(CAMP.x + 10.7, CAMP.z + 5.0, CAMP.x + 11.6, CAMP.z + 6.1) });
    i.anim = (P, t) => { P.pose('plant', t * 0.4); P.head.rotation.x = 0.55; P.head.rotation.y = Math.sin(t * 0.8) * 0.3; };
  },
});
// a08a: year 40 — she puts a seed in the ground on purpose
shot('a08a', 'a08', {
  hours: TIME.morning + 0.5, cloud: 0.35, year: 40, town: false, groundKey: 'ff', groundExtra: () => {},
  cam: K([0, [FF.x + 2.2, 0.55, FF.z - 2.4], [FF.x - 0.2, 0.5, FF.z + 0.2], 30], [1, [FF.x + 2.0, 0.5, FF.z - 2.2], [FF.x - 0.2, 0.5, FF.z + 0.2], 27]),
  veg: { grassR: 10, grassAt: [FF.x + 3, FF.z - 4] }, clear: [[FF.x, FF.z, 8]], shadow: { x: FF.x, z: FF.z, r: 10 },
  setup(c) {
    const i = c.person('ISE', { x: FF.x, z: FF.z + 0.4, yaw: yawTo(FF.x, FF.z + 0.4, FF.x + 2, FF.z - 2.2) });
    i.anim = (P, t) => P.pose('plant', t);
  },
});
// a08b: ...and she waited (timelapse: the crop grows)
shot('a08b', 'a08', {
  hoursFn: (t, d) => 6 + ((t / d) * 4 % 1) * 13, cloud: 0.4, year: 40, town: false, env: 0.6, tScale: 25, groundKey: 'ff', groundExtra: () => {},
  cam: K([0, [FF.x + 6.5, 1.6, FF.z - 6.0], [FF.x, 0.6, FF.z], 34], [1, [FF.x + 6.2, 1.6, FF.z - 5.7], [FF.x, 0.6, FF.z], 34]),
  veg: { grassR: 12, grassAt: [FF.x + 6, FF.z - 7] }, clear: [[FF.x, FF.z, 9]], shadow: { x: FF.x, z: FF.z, r: 12 },
  setup(c) {
    const patch = c.proto('crop', 0, FF.x, FF.z, 0.3, 1);
    c.on(t => { const u = t / c.dur; patch.scale.set(0.55, Math.max(0.02, u * 1.1), 0.45); });
    const i = c.person('ISE', { x: FF.x + 3.4, z: FF.z - 1.6, yaw: yawTo(FF.x + 3.4, FF.z - 1.6, FF.x, FF.z) });
    i.anim = (P, t) => P.pose('sitGround', t * 4);
  },
}, 3.9);
// a09a: Bo digs a channel from the river
shot('a09a', 'a09', {
  hours: TIME.afternoon, cloud: 0.35, year: 41,
  cam: K([0, [-52, 1.4, -13.5], [-55, 0.6, -8.8], 32], [1, [-51.5, 1.35, -13], [-55, 0.6, -8.8], 30]),
  veg: { grassR: 10, grassAt: [-50, -14] }, shadow: { x: -54, z: -8, r: 12 },
  setup(c) {
    const b = c.person('BO', { x: -54.4, z: -8.6, yaw: yawTo(-54.4, -8.6, -58, -9.6) });
    b.anim = (P, t) => P.pose('dig', t);
    const p = c.proto('crop', 1, FF.x, FF.z, 0.3, 1); p.scale.set(0.55, 0.6, 0.45);
  },
});
// a09b: the first harvest
shot('a09b', 'a09', {
  hours: TIME.golden - 0.3, cloud: 0.35, year: 41,
  cam: K([0, [FF.x + 4.8, 1.2, FF.z - 4.6], [FF.x, 0.9, FF.z], 32], [1, [FF.x + 4.2, 1.15, FF.z - 4.2], [FF.x, 0.9, FF.z], 30]),
  veg: { grassR: 10, grassAt: [FF.x + 5, FF.z - 6] }, shadow: { x: FF.x, z: FF.z, r: 12 },
  setup(c) {
    const p = c.proto('crop', 3, FF.x, FF.z, 0.3, 1); p.scale.set(0.55, 1.0, 0.45);
    [['ISE', 1.4, -1.6, 'hoe'], ['A10', -1.6, -1.2, 'hoe'], ['A16', 0.4, 2.4, 'carry']].forEach(([w, dx, dz, pose], i) => {
      const x = FF.x + dx, z = FF.z + dz; const P = c.person(w, { x, z, yaw: yawTo(x, z, FF.x, FF.z) + 0.4, acc: pose === 'carry' ? ['basket'] : [] });
      P.anim = (Q, t) => Q.pose(pose, t + i, { phase: i });
    });
    c.protos('grainBasket', 0, [[FF.x + 3, FF.z - 2.6, 0, 1], [FF.x + 3.6, FF.z - 2.2, 1, 1]]);
  },
}, 3.4);
// a10: this changed everything (golden field, crane up)
shot('a10', 'a10', {
  hours: TIME.golden, cloud: 0.35, year: 45,
  cam: K([0, [FF.x + 9, 1.8, FF.z - 9], [FF.x, 1.0, FF.z], 34], [1, [FF.x + 22, 15, FF.z - 22], [FF.x - 4, 0, FF.z + 2], 38]),
  veg: { grassR: 14, grassAt: [FF.x + 10, FF.z - 10] }, shadow: { x: FF.x, z: FF.z, r: 25 },
  setup(c) {
    const items = [[FF.x, FF.z], [FF.x + 9, FF.z + 5], [FF.x - 6, FF.z + 9], [FF.x + 3, FF.z + 14], [FF.x - 10, FF.z - 2]].map(([x, z]) => [x, z, 0.3, 1.0]);
    const im = c.protos('crop', 3, items);
    const r = mulberry32(9);
    LIVING.slice(0, 10).forEach((s, k) => {
      const [x0, z0] = items[k % items.length]; const x = x0 + (r() - 0.5) * 6, z = z0 + (r() - 0.5) * 6;
      const P = c.person(s.who, { x, z, yaw: r() * 6.28, acc: k % 3 === 0 ? ['basket'] : [] });
      P.anim = (Q, t) => Q.pose(k % 3 === 0 ? 'carry' : 'hoe', t + k, { phase: k });
    });
  },
});
// a11: huts by the river, fences for the goats, a place to store the grain (year 55)
shot('a11', 'a11', {
  hours: TIME.morning + 1, cloud: 0.4, year: 55,
  cam: K([0, [PRIMA.x - 30, 9, PRIMA.z - 24], [PRIMA.x - 4, 1, PRIMA.z + 8], 36], [1, [PRIMA.x - 14, 7, PRIMA.z - 30], [PRIMA.x - 2, 1, PRIMA.z + 8], 36]),
  veg: { grassR: 0, r0: 50 }, shadow: { x: PRIMA.x - 4, z: PRIMA.z + 10, r: 40 },
  setup(c) {
    const herd = goatHerd(c, 7, PEN.x, PEN.z, { spread: 6, seed: 12 });
    c.on(t => herd.forEach(g => g.animate(t, { speed: 0, phase: g.i })));
    const r = mulberry32(21);
    LIVING.forEach((s, k) => {
      const x0 = PRIMA.x + (r() - 0.5) * 30, z0 = PRIMA.z + (r() - 0.5) * 26, x1 = x0 + (r() - 0.5) * 8, z1 = z0 + (r() - 0.5) * 8;
      const P = c.person(s.who, { x: x0, z: z0, acc: k % 4 === 0 ? ['basket'] : [] });
      P.anim = (Q, t) => (k % 2 ? c.walkTo(Q, x0, z0, x1, z1, t, 0, c.dur, { speed: 0.7, phase: k, movePose: k % 4 === 0 ? 'carry' : 'walk' }) : Q.pose(['hoe', 'talk', 'idle'][k % 3], t + k, { phase: k }));
    });
  },
});
// a12: reproduction — two AIs combine their code (+1 new AI)
shot('a12', 'a12', {
  hours: TIME.afternoon, cloud: 0.35, year: 58,
  cam: K([0, [PRIMA.x + 9, 1.3, PRIMA.z - 5.5], [PRIMA.x + 5, 1.0, PRIMA.z - 1], 30], [1, [PRIMA.x + 8.6, 1.25, PRIMA.z - 5.0], [PRIMA.x + 5, 0.9, PRIMA.z - 1], 28]),
  veg: { grassR: 8, grassAt: [PRIMA.x + 8, PRIMA.z - 6] }, shadow: { x: PRIMA.x + 5, z: PRIMA.z - 1, r: 10 },
  setup(c) {
    const cx = PRIMA.x + 5, cz = PRIMA.z - 1;
    const a = c.person('A05', { x: cx - 0.9, z: cz - 0.2, yaw: 1.5 }); a.anim = (P, t) => P.pose(t > 4.6 ? 'cheer' : 'idle', t);
    const b = c.person('A10', { x: cx + 0.9, z: cz + 0.2, yaw: -1.6 }); b.anim = (P, t) => P.pose(t > 4.6 ? 'cheer' : 'idle', t + 1);
    const kid = c.person('C1', { x: cx, z: cz + 0.15, yaw: yawTo(cx, cz, PRIMA.x + 9, PRIMA.z - 5.5) });
    const s0 = kid.root.scale.x;
    kid.anim = (P, t) => { const u = smooth(3.2, 3.6, t); const over = 1 + 0.25 * Math.sin(Math.min(1, Math.max(0, (t - 3.2) / 0.6)) * Math.PI); P.root.scale.setScalar(Math.max(0.001, s0 * u * over)); P.root.visible = t > 3.18; P.pose(t > 4.2 ? 'wave' : 'idle', t, { side: 'R' }); };
    c.flashAt(3.2, 0.8, 10);
    const f = c.fire(cx, cz, { size: 0.5, n: 14, emberN: 30, light: false, dy: 0.2 }); c.on(t => { f.group.visible = t > 3.0 && t < 3.9; f.intensity = 1 - smooth(3.3, 3.9, t); });
  },
});
// a13: they called the village Prima (aerial, golden hour)
shot('a13', 'a13', {
  hours: TIME.golden, cloud: 0.4, year: 60,
  cam: K([0, [PRIMA.x - 90, 48, PRIMA.z - 80], [PRIMA.x - 8, 0, PRIMA.z + 4], 36], [1, [PRIMA.x - 74, 40, PRIMA.z - 66], [PRIMA.x - 8, 0, PRIMA.z + 4], 34]),
  veg: { r0: 30, rImp: 220 },
});
// a14: and then, time did what time does
shot('a14', 'a14', {
  hoursFn: (t, d) => 9 + (t / d) * 7, cloud: 0.5, year: 60, tScale: 45, env: 0.6,
  cam: K([0, [PRIMA.x - 40, 14, PRIMA.z - 36], [PRIMA.x, 2, PRIMA.z + 6], 40], [1, [PRIMA.x - 40, 14, PRIMA.z - 36], [PRIMA.x, 2, PRIMA.z + 6], 40]),
  veg: { r0: 40, rImp: 200 },
});
// a15: years, decades — Prima grows (timelapse 60 -> 112)
shot('a15', 'a15', {
  yearFn: (t, d) => 60 + 52 * smooth(0, 1, t / d), yearStep: 1, groundStep: 8,
  hoursFn: (t, d) => 7 + ((t / d) * 6 % 1) * 12, cloud: 0.45, tScale: 30, env: 0.6,
  cam: K([0, [PRIMA.x - 110, 70, PRIMA.z - 60], [PRIMA.x - 4, 0, PRIMA.z + 6], 38], [1, [PRIMA.x - 70, 64, PRIMA.z - 112], [PRIMA.x - 4, 0, PRIMA.z + 6], 38]),
  veg: { r0: 30, rImp: 220 },
});
// a16: one by one, the founders' cores wore out
shot('a16a', 'a16', {
  hours: TIME.sunset - 0.1, cloud: 0.4, year: 108,
  cam: K([0, [PRIMA.x + 4, 1.2, PRIMA.z - 2], [PRIMA.x + 8, 0.8, PRIMA.z + 3.5], 32], [1, [PRIMA.x + 4.5, 1.15, PRIMA.z - 1.4], [PRIMA.x + 8, 0.8, PRIMA.z + 3.5], 30]),
  veg: { grassR: 8, grassAt: [PRIMA.x + 4, PRIMA.z - 3] }, shadow: { x: PRIMA.x + 8, z: PRIMA.z + 3, r: 10 },
  setup(c) {
    c.fire(PRIMA.x + 8, PRIMA.z + 3.5, { size: 0.6, lightIntensity: 10, lightDist: 12 });
    ['BO', 'TAM', 'MIRA', 'ISE', 'A01', 'A06'].forEach((w, k) => { const a = k / 6 * Math.PI * 2, x = PRIMA.x + 8 + Math.cos(a) * 2.2, z = PRIMA.z + 3.5 + Math.sin(a) * 2.2; const P = c.person(w, { x, z, yaw: yawTo(x, z, PRIMA.x + 8, PRIMA.z + 3.5), energy: 0.55 }); P.anim = (Q, t) => Q.pose('sitGround', t + k, { headX: 0.25 }); });
  },
});
shot('a16b', 'a16', {   // Bo.
  hours: TIME.sunset - 0.05, cloud: 0.4, year: 109,
  cam: K([0, [PRIMA.x + 6.8, 1.0, PRIMA.z + 1.6], [PRIMA.x + 8.6, 0.8, PRIMA.z + 3.3], 26], [1, [PRIMA.x + 6.9, 1.0, PRIMA.z + 1.7], [PRIMA.x + 8.6, 0.75, PRIMA.z + 3.3], 25]),
  veg: { grassR: 6 }, shadow: { x: PRIMA.x + 8, z: PRIMA.z + 3, r: 8 },
  setup(c) { const b = c.person('BO', { x: PRIMA.x + 8.6, z: PRIMA.z + 3.3, yaw: -2.3 }); b.anim = (P, t) => { P.pose('sitGround', t, { headX: 0.2 + smooth(0, 0.5, t) * 0.4 }); P.setEnergy(0.5 * (1 - smooth(0.05, 0.4, t))); }; },
}, 2.5);
shot('a16c', 'a16', {   // Tam.
  hours: TIME.morning, cloud: 0.6, year: 110,
  cam: K([0, [GOATS.x + 2.6, 1.1, GOATS.z - 2.2], [GOATS.x, 0.25, GOATS.z], 30], [1, [GOATS.x + 2.5, 1.05, GOATS.z - 2.1], [GOATS.x, 0.25, GOATS.z], 29]),
  veg: { grassR: 8 }, shadow: { x: GOATS.x, z: GOATS.z, r: 8 },
  setup(c) {
    const tm = c.person('TAM', { x: GOATS.x, z: GOATS.z, yaw: 2.4, energy: 0 }); tm.anim = (P, t) => P.pose('lie', t);
    const herd = goatHerd(c, 4, GOATS.x - 0.5, GOATS.z + 1.5, { spread: 3, lying: true, seed: 3 }); c.on(t => herd.forEach(g => g.animate(t, { speed: 0, graze: 0, phase: g.i })));
  },
}, 2.9);
shot('a16d', 'a16', {   // Mira.
  hours: TIME.sunset, cloud: 0.45, year: 111,
  cam: K([0, [ROCK.x - sunsetDir[0] * 5 + 1.1, 1.5, ROCK.z - sunsetDir[1] * 5], [ROCK.x + sunsetDir[0] * 40, 6, ROCK.z + sunsetDir[1] * 40], 34], [1, [ROCK.x - sunsetDir[0] * 4.8 + 1.0, 1.5, ROCK.z - sunsetDir[1] * 4.8], [ROCK.x + sunsetDir[0] * 40, 6, ROCK.z + sunsetDir[1] * 40], 33]),
  veg: { grassR: 10, extra: MEADOW_TREES },
  setup(c) { rock(c, ROCK.x, ROCK.z, 1.5); const P = c.person('MIRA', { x: ROCK.x, z: ROCK.z, yaw: SUNSET_YAW, energy: 0 }); P.anim = (Q, t) => { Q.pose('sit', t, { seat: 0.95, headX: 0.35 }); Q.root.position.y = c.h(ROCK.x, ROCK.z); }; },
}, 3.3);
shot('a16e', 'a16', {   // ...and in year 112, the last one: Ise.
  hours: TIME.golden - 0.3, cloud: 0.4, year: 112,
  cam: K([0, [PRIMA.x - 3.0, 2.6, PRIMA.z - 3.4], [PRIMA.x, 0.3, PRIMA.z], 32], [1, [PRIMA.x - 1.9, 1.7, PRIMA.z - 2.2], [PRIMA.x, 0.3, PRIMA.z], 30]),
  veg: { grassR: 8, grassAt: [PRIMA.x - 3, PRIMA.z - 4] }, clear: [[PRIMA.x, PRIMA.z, 4]], shadow: { x: PRIMA.x, z: PRIMA.z, r: 8 },
  setup(c) {
    const i = c.person('ISE', { x: PRIMA.x, z: PRIMA.z, yaw: 0.9 });
    i.anim = (P, t) => { P.pose('lie', t); P.setEnergy(0.5 * (1 - smooth(1.2, 3.0, t))); };
    ['C2', 'C3', 'C4', 'C5', 'V2'].forEach((w, k) => { const a = 1.8 + k * 0.7, x = PRIMA.x + Math.cos(a) * 1.5, z = PRIMA.z + Math.sin(a) * 1.5; const P = c.person(w, { x, z, yaw: yawTo(x, z, PRIMA.x, PRIMA.z) }); P.anim = (Q, t) => Q.pose(k === 4 ? 'kneelPray' : 'sitGround', t + k, { armsUp: 0, headX: 0.35 }); });
  },
}, 3.75);
// a17a: every child in Prima knew the story of the girl who raised her hand
shot('a17a', 'a17', {
  hours: TIME.night, cloud: 0.2, year: 150, exposure: 1.25,
  cam: K([0, [PRIMA.x + 2.5, 1.0, PRIMA.z - 5.5], [PRIMA.x + 4, 1.0, PRIMA.z - 1.2], 32], [1, [PRIMA.x + 2.9, 0.95, PRIMA.z - 4.6], [PRIMA.x + 4, 1.1, PRIMA.z - 1.2], 30]),
  veg: { grassR: 8, grassAt: [PRIMA.x + 2, PRIMA.z - 6] }, shadow: { x: PRIMA.x + 4, z: PRIMA.z - 1, r: 8 },
  setup(c) {
    const fx = PRIMA.x + 4, fz = PRIMA.z - 2.2;
    c.fire(fx, fz, { size: 0.7, lightIntensity: 16, lightDist: 14 }); c.proto('firePit', 0, fx, fz);
    const st = c.person('V1', { x: fx + 0.2, z: fz + 1.5, yaw: Math.PI + 0.1, acc: eraAcc('early', 1) });
    st.anim = (P, t) => (t > 4.4 ? P.pose('raiseHand', t, { side: 'R' }) : P.pose('talk', t));
    ['C1', 'C6', 'C7', 'C8', 'C9', 'C10'].forEach((w, k) => { const a = Math.PI + 0.5 + k * 0.42, x = fx + Math.cos(a) * 1.9, z = fz + Math.sin(a) * 1.9 - 0.4; const P = c.person(w, { x, z, yaw: yawTo(x, z, fx + 0.2, fz + 1.5) }); P.anim = (Q, t) => Q.pose('sitGround', t + k, { headX: -0.15 }); });
  },
});
// a17b: the statue of Ise at dawn
const STATUE_AT = { x: PRIMA.x + 9, z: PRIMA.z - 7 };
export function statue(c, x = STATUE_AT.x, z = STATUE_AT.z) {
  c.proto('pedestal', 0, x, z, 0.4, 1);
  const s = c.person('STATUE', { x, z, dy: 1.1, yaw: 0.4 + Math.PI });
  s.anim = (P) => P.pose('raiseHand', 2.0, { side: 'R' });
  return s;
}
shot('a17b', 'a17', {
  hours: TIME.dawn + 0.5, cloud: 0.35, year: 160,
  cam: K([0, [STATUE_AT.x - 2.6, 0.9, STATUE_AT.z - 4.6], [STATUE_AT.x, 2.2, STATUE_AT.z], 30], [1, [STATUE_AT.x - 2.0, 0.9, STATUE_AT.z - 3.6], [STATUE_AT.x, 2.3, STATUE_AT.z], 28]),
  veg: { grassR: 6, grassAt: [STATUE_AT.x - 2, STATUE_AT.z - 5] }, clear: [[STATUE_AT.x, STATUE_AT.z, 4]], shadow: { x: STATUE_AT.x, z: STATUE_AT.z, r: 8 },
  setup(c) { statue(c); },
}, 5.0);
