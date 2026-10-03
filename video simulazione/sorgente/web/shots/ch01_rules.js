// CHAPTER I — THE RULES (year 0)
import { shot } from './registry.js';
import { K, orbitCam, M, SPAWN, founders, TIME, MEADOW_TREES, ROCK, BERRY, OAK_GAG, SUNSET_YAW, rock, berries, yawTo } from './sets.js';

const MV = { grassR: 20, extra: MEADOW_TREES };
const sunsetDir = [Math.sin(SUNSET_YAW), Math.cos(SUNSET_YAW)];

// chapter card: empty meadow at dawn, slow aerial
shot('r_card', 'chap:r01', {
  hours: TIME.dawn, cloud: 0.35, year: 0, town: false,
  cam: K([0, [M.x - 60, 40, M.z - 70], [M.x, 2, M.z], 40], [1, [M.x - 48, 34, M.z - 58], [M.x, 2, M.z], 40]),
  veg: { r0: 40, rImp: 160, extra: MEADOW_TREES },
});
// r02: forests, rivers, mountains... animals... then twenty AI people
shot('r02a', 'r02', {
  hours: TIME.morning, cloud: 0.45, year: 0, town: false,
  cam: K([0, [-40, 90, 780], [-150, 10, 520], 46], [1, [-70, 80, 700], [-150, 6, 440], 46]),
  veg: { r0: 0, rImp: 60, r1: 400, rFar: 2400 },
});
shot('r02b', 'r02', {
  hours: TIME.morning + 0.5, cloud: 0.4, year: 0, town: false,
  cam: K([0, [318, 1.6, 300], [335, 1.2, 318], 34], [1, [319, 1.5, 302], [335, 1.2, 318], 32]),
  veg: { grassR: 16 },
  setup(c) {
    const D = [[333, 316, 0.6, true], [337, 320, 2.2, false], [330, 322, 1.4, false], [340, 315, 3.4, true], [336, 326, 0.2, false]];
    D.forEach(([x, z, yaw, ant], i) => { const d = c.animal('deer', ant ? 2 : 1, x, z, yaw, {}); c.on(t => d.animate(t, { speed: 0, phase: i * 1.7 })); });
  },
}, 3.4);
shot('r02c', 'r02', {
  hours: TIME.noon - 1, cloud: 0.35, year: 0, town: false, top: true,
  cam: K([0, [M.x, 19, M.z - 0.5], [M.x, 0, M.z], 52], [1, [M.x, 15, M.z - 0.5], [M.x, 0, M.z], 52]),
  veg: { r0: 50, grassR: 0, extra: MEADOW_TREES },
  setup(c) {
    const P = founders(c, (w, i) => ({ pose: 'idle' }));
    P.forEach((p, i) => { const t0 = 0.15 * i; p.anim = (Q, t) => { const k = Math.min(1, Math.max(0, (t - t0) / 0.25)); Q.root.scale.setScalar(0.92 * k * (CAST_SCALE(Q))); Q.pose('idle', t); }; });
  },
}, 5.3);
function CAST_SCALE(Q) { return (Q.def.scale ?? 1); }
// r03: they know nothing — a confused AI looks around (telephoto)
shot('r03', 'r03', {
  hours: TIME.morning, cloud: 0.4, year: 0, town: false,
  cam: K([0, [M.x - 17.5, 1.55, M.z - 7.5], [M.x - 9.5, 1.45, M.z - 3], 20], [1, [M.x - 17, 1.55, M.z - 7.2], [M.x - 9.5, 1.5, M.z - 3], 18]),
  veg: { grassR: 14, extra: MEADOW_TREES },
  setup(c) {
    founders(c, (w, i) => {
      if (i === 5) return { x: M.x - 9.5, z: M.z - 3, yaw: -2.1, anim: (P, t) => { P.pose(t % 4 < 2.2 ? 'idle' : 'scratchHead', t); P.head.rotation.y = Math.sin(t * 0.9) * 0.7; P.head.rotation.z = Math.sin(t * 0.6) * 0.18; P.root.rotation.y = -2.1 + Math.sin(t * 0.4) * 0.6; } };
      return { pose: 'idle' };
    });
  },
});
// r04-r05: low angle on the founders against the sky (rule cards on top)
shot('r04', 'r04', {
  hours: TIME.morning + 1, cloud: 0.5, year: 0, town: false,
  cam: K([0, [M.x + 2, 0.4, M.z - 9], [M.x, 2.8, M.z], 30], [1, [M.x + 3.2, 0.4, M.z - 8.6], [M.x, 2.8, M.z], 30]),
  veg: { grassR: 12, extra: MEADOW_TREES },
  setup(c) { founders(c, (w, i) => ({ pose: i % 4 === 1 ? 'lookUp' : 'idle' })); },
});
// r06: one body, one life — an AI slowly shuts down
shot('r06', 'r06', {
  hours: TIME.afternoon, cloud: 0.5, year: 0, town: false,
  cam: K([0, [M.x + 6, 1.4, M.z + 3], [M.x + 2, 0.9, M.z + 5], 32], [1, [M.x + 5.6, 1.2, M.z + 3.4], [M.x + 2, 0.7, M.z + 5], 30]),
  veg: { grassR: 12, extra: MEADOW_TREES },
  setup(c) {
    const P = c.person('A08', { x: M.x + 2, z: M.z + 5, yaw: -1.2 });
    P.anim = (Q, t) => { const k = Math.max(0, t - 3.5); Q.pose(k > 0 ? 'fallDown' : 'sad', k > 0 ? k : t); Q.setEnergy(Math.max(0, 1 - Math.max(0, t - 2.0) / 3.5)); };
  },
});
// r07-r08: the observer's view from straight above; spoiler zoom
shot('r07', 'r07', {
  hours: TIME.noon, cloud: 0.4, year: 0, town: false, top: true,
  cam: K([0, [M.x + 0.2, 160, M.z], [M.x, 0, M.z], 30], [1, [M.x + 0.2, 140, M.z], [M.x, 0, M.z], 30]),
  veg: { r0: 0, rImp: 0, r1: 600, extra: MEADOW_TREES },
  setup(c) { founders(c, () => ({ pose: 'idle' })); },
});
shot('r08', 'r08', {
  hours: TIME.noon, cloud: 0.4, year: 0, town: false, top: true,
  cam: K([0, [M.x + 0.2, 140, M.z], [M.x, 0, M.z], 30], [0.18, [M.x + 0.2, 140, M.z], [M.x, 0, M.z], 6], [1, [M.x + 0.2, 140, M.z], [M.x, 0, M.z], 5.2]),
  veg: { r0: 0, rImp: 0, r1: 600, extra: MEADOW_TREES },
  setup(c) { founders(c, (w, i) => ({ pose: i === 0 ? 'lookUp' : 'idle' })); },
});
// r09: year zero, day one — they wake up and stand
shot('r09', 'r09', {
  hours: TIME.dawn + 0.2, cloud: 0.3, year: 0, town: false,
  cam: K([0, [M.x - 7, 0.5, M.z - 5], [M.x, 0.4, M.z], 30], [1, [M.x - 6.5, 0.8, M.z - 4.8], [M.x, 0.9, M.z], 30]),
  veg: { grassR: 12, extra: MEADOW_TREES },
  setup(c) { founders(c, (w, i, s) => ({ anim: (P, t) => P.pose('getUp', Math.max(0, t - 0.3 - (i % 6) * 0.25), { speed: 0.7 }) })); },
});
// r10: twenty AIs, nothing happens (static wide, deadpan)
shot('r10', 'r10', {
  hours: TIME.morning, cloud: 0.4, year: 0, town: false,
  cam: K([0, [M.x - 14, 1.7, M.z - 7.5], [M.x, 1.0, M.z + 0.5], 36], [1, [M.x - 14, 1.7, M.z - 7.5], [M.x, 1.0, M.z + 0.5], 36]),
  veg: { grassR: 18, extra: MEADOW_TREES },
  setup(c) { founders(c, (w, i) => ({ pose: ['idle', 'idle', 'scratchHead', 'idle', 'shrug'][i % 5] })); },
});
// r11: walking into the same tree eleven times
shot('r11', 'r11', {
  hours: TIME.morning + 0.6, cloud: 0.4, year: 0, town: false,
  cam: K([0, [OAK_GAG.x + 2.6, 1.3, OAK_GAG.z - 5.6], [OAK_GAG.x + 1.3, 1.1, OAK_GAG.z], 32], [1, [OAK_GAG.x + 2.5, 1.3, OAK_GAG.z - 5.3], [OAK_GAG.x + 1.3, 1.1, OAK_GAG.z], 32]),
  veg: { grassR: 12, extra: MEADOW_TREES },
  setup(c) {
    const P = c.person('A12', { x: OAK_GAG.x + 2.4, z: OAK_GAG.z + 0.1, yaw: -1.57 });
    P.anim = (Q, t) => {
      const cyc = (t * 0.62) % 1;
      const back = cyc > 0.7 ? Math.min(1, (cyc - 0.7) / 0.08) : 0;
      const xx = OAK_GAG.x + 3.2 - Math.min(cyc / 0.7, 1) * 2.45 + back * 0.35 * (1 - (cyc - 0.7) / 0.3);
      Q.place(xx, c.h(xx, OAK_GAG.z + 0.1), OAK_GAG.z + 0.1, -1.57);
      if (cyc < 0.7) Q.pose('walk', t, { amount: 0.8 }); else { Q.pose('idle', t); Q.spine.rotation.x = -0.3 * (1 - (cyc - 0.7) / 0.3); Q.head.rotation.x = -0.35 * (1 - (cyc - 0.7) / 0.3); }
    };
  },
});
// r12: trying to pick up a cloud (low angle)
shot('r12', 'r12', {
  hours: TIME.noon, cloud: 0.65, year: 0, town: false,
  cam: K([0, [M.x + 8.6, 0.55, M.z + 8.9], [M.x + 6, 1.7, M.z + 12.5], 40], [1, [M.x + 8.8, 0.55, M.z + 8.6], [M.x + 6, 1.9, M.z + 12.5], 40]),
  veg: { grassR: 10, extra: MEADOW_TREES },
  setup(c) { const P = c.person('A16', { x: M.x + 6, z: M.z + 12.5, yaw: 3.0 }); P.anim = (Q, t) => Q.pose('jumpReach', t); },
});
// r13: and then there's A-04 (push in on Mira on her rock)
shot('r13', 'r13', {
  hours: TIME.afternoon + 1, cloud: 0.4, year: 0, town: false,
  cam: K([0, [ROCK.x + 9, 2.4, ROCK.z - 6], [ROCK.x, 1.1, ROCK.z], 38], [1, [ROCK.x + 6, 1.8, ROCK.z - 4], [ROCK.x, 1.1, ROCK.z], 34]),
  veg: { grassR: 14, extra: MEADOW_TREES },
  setup(c) { rock(c, ROCK.x, ROCK.z, 1.5); const P = c.person('MIRA', { x: ROCK.x, z: ROCK.z, yaw: SUNSET_YAW }); P.anim = (Q, t) => { Q.pose('sit', t, { seat: 0.95 }); Q.root.position.y = c.h(ROCK.x, ROCK.z); }; },
});
// r14: silhouette against the sunset
const behindMira = (d, h, side = 0) => [ROCK.x - sunsetDir[0] * d + side, h, ROCK.z - sunsetDir[1] * d];
const sunsetTgt = [ROCK.x + sunsetDir[0] * 40, 6, ROCK.z + sunsetDir[1] * 40];
shot('r14', 'r14', {
  hours: TIME.sunset, cloud: 0.45, year: 0, town: false,
  cam: K([0, behindMira(5.5, 1.6, 1.2), sunsetTgt, 36], [1, behindMira(4.6, 1.5, 1.0), sunsetTgt, 34]),
  veg: { grassR: 12, extra: MEADOW_TREES },
  setup(c) { rock(c, ROCK.x, ROCK.z, 1.5); const P = c.person('MIRA', { x: ROCK.x, z: ROCK.z, yaw: SUNSET_YAW }); P.anim = (Q, t) => { Q.pose('sit', t, { seat: 0.95 }); Q.root.position.y = c.h(ROCK.x, ROCK.z); }; },
});
// r15: every. single. day. (timelapse of three sunsets)
shot('r15', 'r15', {
  hoursFn: (t, d) => 16.9 + ((t / d * 3.0) % 1) * 1.4, cloud: 0.45, year: 0, town: false, env: 0.6,
  cam: K([0, behindMira(6, 1.7, 1.4), sunsetTgt, 38], [1, behindMira(6, 1.7, 1.4), sunsetTgt, 38]),
  veg: { grassR: 12, extra: MEADOW_TREES },
  setup(c) { rock(c, ROCK.x, ROCK.z, 1.5); const P = c.person('MIRA', { x: ROCK.x, z: ROCK.z, yaw: SUNSET_YAW }); P.anim = (Q, t) => { Q.pose('sit', t, { seat: 0.95 }); Q.root.position.y = c.h(ROCK.x, ROCK.z); }; },
});
// r16: front close-up, warm light — "I thought she was bugged"
shot('r16', 'r16', {
  hours: TIME.sunset - 0.2, cloud: 0.4, year: 0, town: false,
  cam: K([0, [ROCK.x + sunsetDir[0] * 2.6 + 0.6, 1.55, ROCK.z + sunsetDir[1] * 2.6], [ROCK.x, 1.55, ROCK.z], 30], [1, [ROCK.x + sunsetDir[0] * 2.3 + 0.5, 1.55, ROCK.z + sunsetDir[1] * 2.3], [ROCK.x, 1.6, ROCK.z], 28]),
  veg: { grassR: 10, extra: MEADOW_TREES },
  setup(c) { rock(c, ROCK.x, ROCK.z, 1.5); const P = c.person('MIRA', { x: ROCK.x, z: ROCK.z, yaw: SUNSET_YAW }); P.anim = (Q, t) => { Q.pose('sit', t, { seat: 0.95, headX: -0.12 }); Q.root.position.y = c.h(ROCK.x, ROCK.z); }; },
});
// r17: energy drops — slumping
shot('r17', 'r17', {
  hours: TIME.afternoon, cloud: 0.55, year: 0, town: false,
  cam: K([0, [M.x - 10, 1.6, M.z + 6], [M.x, 1.0, M.z + 2], 34], [1, [M.x - 9, 1.5, M.z + 5.4], [M.x, 0.9, M.z + 2], 34]),
  veg: { grassR: 14, extra: MEADOW_TREES },
  setup(c) { founders(c, (w, i) => ({ pose: i % 3 === 0 ? 'sitGround' : 'sad' })); },
});
// r18: Ise walks towards the berries (tracking)
shot('r18', 'r18', {
  hours: TIME.afternoon + 0.4, cloud: 0.45, year: 0, town: false,
  cam: K([0, [M.x + 2, 1.4, M.z + 3], [M.x + 6, 1.0, M.z + 8], 36], [1, [M.x + 8, 1.4, M.z + 9], [BERRY.x, 1.0, BERRY.z], 36]),
  veg: { grassR: 16, extra: MEADOW_TREES },
  setup(c) {
    berries(c, BERRY.x, BERRY.z, 4);
    const P = c.person('ISE', { x: M.x + 4, z: M.z + 5 });
    P.anim = (Q, t) => c.walkTo(Q, M.x + 4, M.z + 5, BERRY.x - 1.6, BERRY.z - 1.4, t, 0, c.dur, { speed: 0.8 });
  },
});
// r19: she eats a berry (close)
shot('r19', 'r19', {
  hours: TIME.afternoon + 0.5, cloud: 0.45, year: 0, town: false,
  cam: K([0, [BERRY.x - 3.6, 1.45, BERRY.z - 0.4], [BERRY.x - 1.6, 1.4, BERRY.z - 1.3], 26], [1, [BERRY.x - 3.3, 1.45, BERRY.z - 0.5], [BERRY.x - 1.6, 1.45, BERRY.z - 1.3], 24]),
  veg: { grassR: 10, extra: MEADOW_TREES },
  setup(c) { berries(c, BERRY.x, BERRY.z, 4); const P = c.person('ISE', { x: BERRY.x - 1.6, z: BERRY.z - 1.4, yaw: 0.7 }); P.anim = (Q, t) => Q.pose('eat', t); },
});
// r20: energy jumps — orbit, then she turns to the group
shot('r20', 'r20', {
  hours: TIME.afternoon + 0.6, cloud: 0.45, year: 0, town: false,
  cam: orbitCam([BERRY.x - 1.6, BERRY.z - 1.4], 5.0, 1.6, 3.1, 4.5, 32, 1.15),
  veg: { grassR: 12, extra: MEADOW_TREES },
  setup(c) {
    berries(c, BERRY.x, BERRY.z, 4);
    const P = c.person('ISE', { x: BERRY.x - 1.6, z: BERRY.z - 1.4, yaw: 0.7 });
    P.anim = (Q, t) => { if (t < c.dur - 2.2) Q.pose('eat', t); else { Q.pose('idle', t); Q.root.rotation.y = 0.7 + Math.min(1, (t - (c.dur - 2.2)) / 1.0) * 2.6; } };
  },
});
// r21: THE shot — she raises her hand among the white figures
shot('r21', 'r21', {
  hours: TIME.afternoon + 0.8, cloud: 0.35, year: 0, town: false,
  cam: K([0, [BERRY.x - 12, 2.6, BERRY.z - 9], [BERRY.x - 3.5, 1.4, BERRY.z - 3.8], 30], [1, [BERRY.x - 11, 2.4, BERRY.z - 8.4], [BERRY.x - 3.5, 1.5, BERRY.z - 3.8], 28]),
  veg: { grassR: 14, extra: MEADOW_TREES },
  setup(c) {
    berries(c, BERRY.x, BERRY.z, 4);
    const ise = c.person('ISE', { x: BERRY.x - 3.5, z: BERRY.z - 3.8, yaw: -2.4 });
    ise.anim = (Q, t) => { if (t < 0.5) Q.pose('idle', t); else Q.pose('raiseHand', t, { side: 'R' }); };
    const others = ['A01', 'A03', 'A05', 'A06', 'A08', 'A10', 'A12', 'A14', 'A16', 'A17', 'A18', 'A19', 'A20'];
    others.forEach((w, i) => {
      const a = i * 2.39996, d = 2.2 + Math.sqrt(i + 1) * 1.6;
      const x = BERRY.x - 3.5 + Math.cos(a) * d - 3, z = BERRY.z - 3.8 + Math.sin(a) * d - 2;
      const P = c.person(w, { x, z, yaw: yawTo(x, z, BERRY.x - 3.5, BERRY.z - 3.8) + (i % 3 - 1) * 0.5 });
      P.anim = (Q, t) => { Q.pose('idle', t + i, { phase: i }); if (t > 0.9 + i * 0.08) Q.root.rotation.y = yawTo(x, z, BERRY.x - 3.5, BERRY.z - 3.8); };
    });
  },
});
// r22: they walk to her; pull back
shot('r22', 'r22', {
  hours: TIME.afternoon + 0.9, cloud: 0.35, year: 0, town: false,
  cam: K([0, [BERRY.x - 14, 3.5, BERRY.z - 12], [BERRY.x - 3, 1.2, BERRY.z - 3], 32], [1, [BERRY.x - 24, 7, BERRY.z - 20], [BERRY.x - 3, 1.2, BERRY.z - 3], 34]),
  veg: { grassR: 18, extra: MEADOW_TREES },
  setup(c) {
    berries(c, BERRY.x, BERRY.z, 4);
    const ise = c.person('ISE', { x: BERRY.x - 3.5, z: BERRY.z - 3.8, yaw: -2.4 }); ise.anim = (Q, t) => Q.pose('wave', t, { side: 'R' });
    const IX = BERRY.x - 3.5, IZ = BERRY.z - 3.8;
    const away = Math.atan2(IX - (BERRY.x - 14), IZ - (BERRY.z - 12));
    SPAWN.slice(1).forEach((s, i) => {
      const a0 = away + (i / 18 - 0.5) * 3.4, d0 = 8 + (i % 4) * 1.6;
      const sx = IX + Math.sin(a0) * d0, sz = IZ + Math.cos(a0) * d0;
      const a1 = a0 + (i % 2 ? 0.3 : -0.3), d1 = 1.7 + (i % 3) * 0.7;
      const tx = IX + Math.sin(a1) * d1, tz = IZ + Math.cos(a1) * d1;
      const P = c.person(s.who, { x: sx, z: sz });
      P.anim = (Q, t) => { c.walkTo(Q, sx, sz, tx, tz, t, 0.15 * (i % 5), 2.6 + 0.2 * (i % 5), { phase: i, endPose: 'idle' }); if (t > 2.6 + 0.2 * (i % 5)) Q.root.rotation.y = yawTo(tx, tz, IX, IZ); };
    });
  },
});
