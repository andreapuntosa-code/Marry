// CHAPTER VIII — ONE STONE, ONE VOICE (years 1901-1929)
import * as THREE from 'three';
import { shot } from './p1registry.js';
import { mulberry32 } from '../../lib/noise.js';
import { VILLAGERS } from '../../lib/people.js';
import { SPLIT_WALL } from '../../lib/buildings.js';
import { K, orbitCam, TIME, PRIMA, RIVERBANK, HILL, TEMPLE, CASTLE, PLAZA, NIGHT_FIELD, ROCK, SUNSET_YAW, yawTo, lerpAngle, smooth, eraAcc, crowdDisc,
  templeLocal, castleLocal, TEMPLE_YAW, CASTLE_YAW, LANDING, GUARD, BLUE, fieldNear, wheat, pebbles, rock, MEADOW_TREES } from './sets.js';
import { buildRoom, creator, roomAt, resetButton } from './room.js';
import { nuv, tam, herd, goatFlock, NUV_COLS, TAM_COLS } from './peoples.js';

const vill = (c, i, x, z, o = {}) => c.person(VILLAGERS[i % VILLAGERS.length], { x, z, acc: eraAcc(o.era || 'stone', i), ...o });
const HF = fieldNear(-60, -120, 1901);            // Orun's harvest field
const VF = fieldNear(NIGHT_FIELD.x, NIGHT_FIELD.z, 1901);   // the secret vote field
const HARV = (f, u, v) => [f.x + u * Math.cos(f.ang) - v * Math.sin(f.ang), f.z + u * Math.sin(f.ang) + v * Math.cos(f.ang)];
const O = HARV(HF, -6, -8);                        // Orun's spot at the edge of the field
const BOWLS = HARV(VF, 0, 0);

shot('d_card', 'chap:d01', {
  hours: TIME.sunset, cloud: 0.4, year: 1901,
  cam: K([0, [HF.x - 70, 30, HF.z - 50], [HF.x, 0, HF.z], 36], [1, [HF.x - 60, 26, HF.z - 42], [HF.x, 0, HF.z], 36]),
  veg: { r0: 40, rImp: 200 },
});
// d01: year 1901 — the wheat fields at harvest
shot('d01', 'd01', {
  hours: TIME.golden, cloud: 0.4, year: 1901,
  cam: K([0, [O[0] - 14, 2.4, O[1] - 10], [O[0] + 4, 0.8, O[1] + 4], 36], [1, [O[0] - 12, 2.2, O[1] - 11.5], [O[0] + 5, 0.8, O[1] + 4], 36]),
  veg: { r0: 40 }, shadow: { x: O[0], z: O[1], r: 20 },
  setup(c) {
    wheat(c, HF, 3);
    for (let i = 0; i < 6; i++) { const [x, z] = HARV(HF, -10 + i * 3.2, -9 - (i % 2)); const P = vill(c, i, x, z, { yaw: HF.ang + Math.PI / 2 }); P.anim = (Q, t) => Q.pose('hoe', t + i * 0.7, { phase: i }); }
  },
});
// d02: a normal harvester named Orun
shot('d02', 'd02', {
  hours: TIME.golden + 0.1, cloud: 0.4, year: 1901,
  cam: K([0, [O[0] - 6.5, 1.4, O[1] - 5], [O[0], 1.0, O[1]], 32], [1, [O[0] - 3.6, 1.35, O[1] - 2.7], [O[0], 1.1, O[1]], 30]),
  veg: { r0: 40 }, shadow: { x: O[0], z: O[1], r: 10 },
  setup(c) { wheat(c, HF, 3); const o = c.person('ORUN', { x: O[0], z: O[1], yaw: HF.ang + Math.PI / 2, acc: [{ type: 'belt', color: 0x6b4a2e }] }); o.anim = (P, t) => P.pose(t > 4.5 ? 'idle' : 'hoe', t, { look: 0.4 }); },
});
// d03: she counted baskets with pebbles; one night, a strange thought
function basketsAndPebbles(c, x, z, yaw, n = 6) {
  const items = [], ps = pebbles(c, n);
  for (let i = 0; i < n; i++) { const u = i - n / 2; items.push([x + Math.cos(yaw) * u * 0.7, z - Math.sin(yaw) * u * 0.7, i, 1.0]); const px = x + Math.cos(yaw) * u * 0.7 + Math.sin(yaw) * 0.55, pz = z - Math.sin(yaw) * u * 0.7 + Math.cos(yaw) * 0.55; ps.set(i, px, c.h(px, pz) + 0.04, pz, 0.9); }
  c.protos('grainBasket', 0, items);
  return ps;
}
shot('d03a', 'd03', {
  hours: TIME.golden + 0.2, cloud: 0.4, year: 1901,
  cam: K([0, [O[0] + 1.6, 0.7, O[1] - 2.6], [O[0] + 0.4, 0.2, O[1] - 0.6], 28], [1, [O[0] + 1.4, 0.65, O[1] - 2.3], [O[0] + 0.4, 0.2, O[1] - 0.6], 25]),
  veg: { r0: 40 }, shadow: { x: O[0], z: O[1], r: 6 },
  setup(c) {
    basketsAndPebbles(c, O[0] + 0.4, O[1] - 0.2, 0.2);
    const o = c.person('ORUN', { x: O[0] + 0.6, z: O[1] + 0.9, yaw: Math.PI + 0.2 }); o.anim = (P, t) => P.pose('plant', t);
  },
});
shot('d03b', 'd03', {
  hours: TIME.golden + 0.3, cloud: 0.4, year: 1901,
  cam: K([0, [O[0] - 9, 1.8, O[1] - 9], [O[0] - 2, 0.4, O[1] - 1], 34], [1, [O[0] - 8, 1.7, O[1] - 9.5], [O[0] - 2, 0.4, O[1] - 1], 32]),
  veg: { r0: 40 }, shadow: { x: O[0] - 3, z: O[1] - 2, r: 12 },
  setup(c) {
    for (let k = 0; k < 3; k++) { const [x, z] = HARV(HF, -12 + k * 5, -12); basketsAndPebbles(c, x, z, HF.ang, 4); const P = vill(c, k + 6, x, z + 0.9, { yaw: Math.PI }); P.anim = (Q, t) => Q.pose('plant', t + k); }
  },
}, 3.3);
shot('d03c', 'd03', {
  hours: TIME.night, cloud: 0.2, year: 1901, exposure: 1.25,
  cam: K([0, [O[0] - 3.2, 1.0, O[1] - 2.2], [O[0], 0.8, O[1]], 30], [1, [O[0] - 2.8, 0.95, O[1] - 1.9], [O[0], 0.85, O[1]], 28]),
  veg: { r0: 40 }, shadow: { x: O[0], z: O[1], r: 6 },
  setup(c) {
    c.fire(O[0] + 0.9, O[1] - 0.9, { size: 0.4, n: 12, lightIntensity: 9, lightDist: 8 });
    const o = c.person('ORUN', { x: O[0], z: O[1], yaw: yawTo(O[0], O[1], O[0] + 0.9, O[1] - 0.9) }); o.anim = (P, t) => { P.pose('sitGround', t, { headX: 0.35 }); P.R.sh.rotation.x = -1.2; P.R.el.rotation.x = -1.1; };
  },
}, 5.9);
// d03L: "If a pebble can count a basket... why can't it count an opinion?"
shot('d03L', 'd03L', { focus: 1.8,
  hours: TIME.night, cloud: 0.2, year: 1901, exposure: 1.3,
  cam: K([0, [O[0] + 1.3, 0.85, O[1] - 1.25], [O[0], 0.85, O[1]], 26], [1, [O[0] + 1.15, 0.85, O[1] - 1.1], [O[0], 0.9, O[1]], 24]),
  veg: { r0: 40 }, shadow: { x: O[0], z: O[1], r: 5 },
  setup(c) {
    c.fire(O[0] + 0.9, O[1] - 0.9, { size: 0.4, n: 12, lightIntensity: 9, lightDist: 8 });
    const o = c.person('ORUN', { x: O[0], z: O[1], yaw: yawTo(O[0], O[1], O[0] + 1.3, O[1] - 1.25) }); o.anim = (P, t) => { P.pose('sitGround', t, { headX: -0.1 }); P.R.sh.rotation.x = -1.45; P.R.el.rotation.x = -0.9; };
    const ps = pebbles(c, 1); c.after(() => { o.root.updateMatrixWorld(true); const v = new THREE.Vector3(); o.R.hd.getWorldPosition(v); ps.set(0, v.x, v.y + 0.07, v.z, 1.2); });
  },
});
// d04: so Orun proposed something completely insane
shot('d04', 'd04', {
  hours: TIME.night, cloud: 0.2, year: 1901, exposure: 1.25,
  cam: K([0, [O[0] - 5, 1.3, O[1] + 3], [O[0] - 1.2, 1.0, O[1] + 0.8], 32], [1, [O[0] - 4.6, 1.25, O[1] + 2.8], [O[0] - 1.2, 1.0, O[1] + 0.8], 30]),
  veg: { r0: 40 }, shadow: { x: O[0] - 1, z: O[1] + 1, r: 8 },
  setup(c) {
    c.fire(O[0] - 1.2, O[1] + 1.2, { size: 0.55, lightIntensity: 14, lightDist: 12 });
    const o = c.person('ORUN', { x: O[0], z: O[1] + 1.6, yaw: yawTo(O[0], O[1] + 1.6, O[0] - 1.2, O[1] + 1.2) - 0.3 }); o.anim = (P, t) => P.pose('talk', t);
    [[-2.6, 0.6, 'scratchHead'], [-2.2, 2.4, 'armsCrossed'], [-0.6, 3.0, 'idle'], [-2.8, -0.6, 'facepalm']].forEach(([dx, dz, pose], i) => { const x = O[0] + dx, z = O[1] + dz; const P = vill(c, i + 10, x, z, { yaw: yawTo(x, z, O[0], O[1] + 1.6) }); P.anim = (Q, t) => Q.pose(pose, t + i, { phase: i }); });
  },
});
// d05: every AI gets a stone; the bowl with more stones wins
const BW = { x: 46, z: -86 };
const ASM = { x: 56, z: -87 };   // where the Assembly meets (1925-1929)
function bowlsVote(c, n, t0, t1, ratio = 0.62) {
  const b1 = [BW.x - 0.9, BW.z], b2 = [BW.x + 0.9, BW.z];
  c.proto('bowl', 0, b1[0], b1[1], 0, 0.5); c.proto('bowl', 0, b2[0], b2[1], 0, 0.5);
  const ps = pebbles(c, n); const r = mulberry32(17);
  const st = [...Array(n)].map((_, i) => { const left = r() < ratio; const [bx, bz] = left ? b1 : b2; const a = r() * 6.28, rr = Math.sqrt(r()) * 0.32; return { x: bx + Math.cos(a) * rr, z: bz + Math.sin(a) * rr, tt: t0 + (t1 - t0) * (i / n), h: r() }; });
  c.on(t => st.forEach((s, i) => { const f = Math.max(0, t - s.tt); if (t < s.tt) { ps.set(i, 0, -999, 0, 0); return; } const y = c.h(s.x, s.z) + 0.07 + s.h * 0.04 + Math.max(0, 1.6 - 9.8 * 0.5 * f * f); ps.set(i, s.x, y, s.z, 1.0); }));
  return { b1, b2 };
}
shot('d05a', 'd05', {
  hours: TIME.morning + 1.5, cloud: 0.4, year: 1902,
  cam: K([0, [BW.x - 0.2, 1.4, BW.z - 2.8], [BW.x, 0.2, BW.z], 32], [1, [BW.x - 0.1, 1.3, BW.z - 2.5], [BW.x, 0.2, BW.z], 30]),
  veg: { r0: 40 }, clear: [[BW.x, BW.z, 4]], shadow: { x: BW.x, z: BW.z, r: 5 },
  setup(c) { bowlsVote(c, 60, 0.6, c.dur); },
});
shot('d05b', 'd05', {
  hours: TIME.morning + 1.6, cloud: 0.4, year: 1902,
  cam: K([0, [BW.x - 5.5, 1.5, BW.z - 4], [BW.x, 0.8, BW.z], 32], [1, [BW.x - 5, 1.45, BW.z - 3.6], [BW.x, 0.8, BW.z], 30]),
  veg: { r0: 40 }, clear: [[BW.x, BW.z, 6]], shadow: { x: BW.x, z: BW.z, r: 8 },
  setup(c) {
    bowlsVote(c, 80, 0, c.dur);
    for (let i = 0; i < 8; i++) { const sx = BW.x - 4 + (i % 4) * 0.8, sz = BW.z + 3 + Math.floor(i / 4) * 0.9; const P = vill(c, i + 14, sx, sz); P.anim = (Q, t) => { const u = ((t * 0.35 + i * 0.125) % 1); const x = sx + (BW.x - 0.9 * (i % 2 ? -1 : 1) - sx) * Math.min(1, u * 1.6), z = sz + (BW.z + 0.8 - sz) * Math.min(1, u * 1.6); Q.place(x, c.h(x, z), z, yawTo(sx, sz, BW.x, BW.z)); Q.pose(u < 0.62 ? 'walk' : 'bow', t, { amount: 0.6, phase: i }); }; }
  },
}, 2.4);
shot('d05c', 'd05', {
  hours: TIME.morning + 1.7, cloud: 0.4, year: 1902,
  cam: K([0, [BW.x + 0.1, 2.4, BW.z - 1.2], [BW.x, 0.1, BW.z + 0.1], 36], [1, [BW.x + 0.1, 2.0, BW.z - 1.0], [BW.x, 0.1, BW.z + 0.1], 34]),
  veg: { r0: 40 }, clear: [[BW.x, BW.z, 4]], shadow: { x: BW.x, z: BW.z, r: 4 },
  setup(c) { bowlsVote(c, 140, -10, -1, 0.7); },
}, 5.2);
// d06: one stone, one voice (macro: a hand drops a stone)
shot('d06', 'd06', {
  hours: TIME.morning + 1.8, cloud: 0.4, year: 1902,
  cam: K([0, [BW.x - 2.6, 1.15, BW.z + 0.9], [BW.x - 0.9, 0.55, BW.z + 0.2], 32], [1, [BW.x - 2.45, 1.1, BW.z + 0.85], [BW.x - 0.9, 0.52, BW.z + 0.2], 29]),
  veg: { r0: 40 }, clear: [[BW.x, BW.z, 4]], shadow: { x: BW.x, z: BW.z, r: 3 },
  setup(c) {
    bowlsVote(c, 40, -10, -1, 0.6);
    const o = c.person('ORUN', { x: BW.x - 0.9, z: BW.z + 0.75, yaw: Math.PI }); o.anim = (P, t) => { P.pose('bow', t, { amount: 0.5 }); P.R.sh.rotation.x = -0.9; };
    const ps = pebbles(c, 1); c.on(t => { const y = c.h(BW.x, BW.z) + 0.95 - Math.max(0, t - 0.9) ** 2 * 4.9; ps.set(0, BW.x - 0.92, Math.max(c.h(BW.x, BW.z) + 0.16, y), BW.z + 0.05, 1.3); });
  },
});
// d07: the first vote in history — a wheat field, at night, by torchlight
function nightVote(c, opts = {}) {
  wheat(c, VF, 3, { skip: (u, v) => Math.hypot(u, v) < 9 });
  c.proto('bowl', 0, BOWLS[0] - 0.8, BOWLS[1], 0, 0.5); c.proto('bowl', 0, BOWLS[0] + 0.8, BOWLS[1], 0, 0.5);
  const out = [];
  for (let i = 0; i < 41; i++) {
    const a = i / 41 * Math.PI * 2, d = 4.6 + (i % 3) * 0.7;
    const x = BOWLS[0] + Math.cos(a) * d, z = BOWLS[1] + Math.sin(a) * d;
    const torch = i % 3 === 0;
    const P = i === 0 ? c.person('ORUN', { x, z, yaw: yawTo(x, z, BOWLS[0], BOWLS[1]), acc: ['torch'] }) : vill(c, i, x, z, { yaw: yawTo(x, z, BOWLS[0], BOWLS[1]), acc: torch ? ['torch'] : eraAcc('stone', i) });
    if (torch || i === 0) c.torch(P, { size: 0.32, light: i % 9 === 0, lightIntensity: 7, lightDist: 12, seed: i });
    P.anim = opts.anim ? ((Q, t) => opts.anim(Q, t, i)) : ((Q, t) => Q.pose(torch || i === 0 ? 'holdTorch' : 'idle', t + i, { phase: i }));
    out.push(P);
  }
  return out;
}
shot('d07a', 'd07', {
  hours: TIME.night, cloud: 0.15, year: 1902, exposure: 1.3,
  cam: K([0, [BOWLS[0] + 4, 22, BOWLS[1] - 6], [BOWLS[0], 0, BOWLS[1]], 40], [1, [BOWLS[0] + 8, 7, BOWLS[1] - 11], [BOWLS[0], 0.6, BOWLS[1]], 38]),
  veg: { r0: 40 }, clear: [[BOWLS[0], BOWLS[1], 9]], shadow: { x: BOWLS[0], z: BOWLS[1], r: 12 },
  setup(c) { nightVote(c); },
});
shot('d07b', 'd07', {
  hours: TIME.night, cloud: 0.15, year: 1902, exposure: 1.35,
  cam: K([0, [BOWLS[0] + 1.2, 1.0, BOWLS[1] - 2.4], [BOWLS[0], 0.2, BOWLS[1]], 30], [1, [BOWLS[0] + 1.0, 0.9, BOWLS[1] - 2.0], [BOWLS[0], 0.2, BOWLS[1]], 26]),
  veg: { r0: 40 }, clear: [[BOWLS[0], BOWLS[1], 9]], shadow: { x: BOWLS[0], z: BOWLS[1], r: 6 },
  setup(c) {
    nightVote(c);
    const ps = pebbles(c, 41); const r = mulberry32(4);
    const st = [...Array(41)].map((_, i) => ({ x: BOWLS[0] + (r() < 0.6 ? -0.8 : 0.8) + (r() - 0.5) * 0.5, z: BOWLS[1] + (r() - 0.5) * 0.5, tt: i * 0.1 }));
    c.on(t => st.forEach((s, i) => { if (t < s.tt) { ps.set(i, 0, -999, 0, 0); return; } const f = t - s.tt; ps.set(i, s.x, c.h(s.x, s.z) + 0.12 + Math.max(0, 1.2 - 4.9 * f * f), s.z, 1.0); }));
  },
}, 4.7);
// d08: democracy was born as a secret (they slip away, torches out)
shot('d08', 'd08', {
  hours: TIME.night, cloud: 0.15, year: 1902, exposure: 1.3,
  cam: K([0, [BOWLS[0] - 10, 3, BOWLS[1] - 10], [BOWLS[0], 0.8, BOWLS[1]], 36], [1, [BOWLS[0] - 12, 3.4, BOWLS[1] - 12], [BOWLS[0], 0.8, BOWLS[1]], 36]),
  veg: { r0: 40 }, clear: [[BOWLS[0], BOWLS[1], 9]], shadow: { x: BOWLS[0], z: BOWLS[1], r: 12 },
  setup(c) {
    const ps = nightVote(c, { anim: (Q, t, i) => { const a = i / 41 * Math.PI * 2, d0 = 4.6 + (i % 3) * 0.7, d = d0 + Math.max(0, t - 0.3 - (i % 5) * 0.2) * 1.6; const x = BOWLS[0] + Math.cos(a) * d, z = BOWLS[1] + Math.sin(a) * d; Q.place(x, c.h(x, z), z, Math.atan2(Math.cos(a), Math.sin(a))); Q.pose('walk', t + i, { phase: i, amount: 0.7 }); if (Q.props.torch) Q.props.torch.visible = t < 1.2 + (i % 7) * 0.2; } });
  },
});
// d09: secrets don't last in a town of five thousand
shot('d09', 'd09', {
  hours: TIME.afternoon, cloud: 0.4, year: 1905,
  cam: K([0, [PLAZA.x - 5, 1.6, PLAZA.z - 6], [PLAZA.x, 1.4, PLAZA.z], 30], [1, [PLAZA.x - 4.4, 1.55, PLAZA.z - 5.3], [PLAZA.x, 1.4, PLAZA.z], 28]),
  veg: { r0: 40 }, shadow: { x: PLAZA.x, z: PLAZA.z, r: 12 },
  setup(c) {
    [[-0.4, 0, 0.45], [0.5, 0.15, -2.6], [1.8, 1.6, 0.9], [2.6, 1.3, -2.2], [-1.8, 1.8, 2.4], [-1.1, 2.3, -0.4]].forEach(([dx, dz, yaw], i) => { const P = vill(c, i + 20, PLAZA.x + dx, PLAZA.z + dz, { yaw }); P.anim = (Q, t) => { Q.pose('talk', t + i, { phase: i }); Q.spine.rotation.x = 0.2; Q.head.rotation.x = 0.15; }; });
    crowdDisc(c, 260, PLAZA.x, PLAZA.z, 4, 17, PLAZA.x, PLAZA.z, { seed: 33 });
  },
});
// d10: every year more stones — a hundred, five hundred, a thousand
shot('d10', 'd10', {
  hours: TIME.dusk + 0.1, cloud: 0.3, year: 1915, exposure: 1.15,
  cam: K([0, [BOWLS[0] - 30, 14, BOWLS[1] - 26], [BOWLS[0], 0, BOWLS[1]], 38], [1, [BOWLS[0] - 36, 20, BOWLS[1] - 32], [BOWLS[0], 0, BOWLS[1]], 40]),
  veg: { r0: 40 }, clear: [[BOWLS[0], BOWLS[1], 26]], shadow: { x: BOWLS[0], z: BOWLS[1], r: 30 },
  setup(c) {
    const n = 1000; const cr = c.crowd(n, { colors: [0xf2f2f2, 0xeeeeea, 0xe6e6e6, 0x2a5bd7] }); const r = mulberry32(8);
    const pos = [...Array(n)].map((_, i) => { const a = r() * 6.28, d = 2 + Math.sqrt(i / n) * 24; return [BOWLS[0] + Math.cos(a) * d, BOWLS[1] + Math.sin(a) * d]; });
    c.on(t => { const k = Math.floor(40 + (n - 40) * smooth(0, 1, t / c.dur)); pos.forEach(([x, z], i) => cr.set(i, x, i < k ? c.h(x, z) : -999, z, yawTo(x, z, BOWLS[0], BOWLS[1]), 0)); cr.update(t); });
  },
});
// d11: the Assembly — blue banners / the king's red banners
shot('d11a', 'd11', {
  hours: TIME.morning + 1.5, cloud: 0.35, year: 1925,
  cam: K([0, [ASM.x + 7, 2.0, ASM.z + 12], [ASM.x, 4, ASM.z - 2], 34], [1, [ASM.x + 6.4, 1.9, ASM.z + 11.2], [ASM.x, 4.6, ASM.z - 2], 32]),
  veg: { r0: 40 }, shadow: { x: ASM.x, z: ASM.z, r: 15 },
  setup(c) {
    for (let k = 0; k < 4; k++) { const b = c.proto('bannerBlue', 0, ASM.x - 4.5 + k * 3, ASM.z - 3 + (k % 2), 0.3, 1.1); c.on(t => { b.scale.y = 1.1 * smooth(0.2 + k * 0.4, 1.0 + k * 0.4, t) + 0.001; }); }
    crowdDisc(c, 200, ASM.x, ASM.z + 4, 2, 9, ASM.x, ASM.z - 3, { seed: 41, colors: [0xf2f2f2, 0x2a5bd7, 0xeeeeea] });
  },
});
shot('d11b', 'd11', {
  hours: TIME.afternoon, cloud: 0.35, year: 1925,
  cam: K([0, [CASTLE.x - 40, 6, CASTLE.z - 46], [CASTLE.x, 14, CASTLE.z], 32], [1, [CASTLE.x - 37, 6, CASTLE.z - 43], [CASTLE.x, 14, CASTLE.z], 30]),
  veg: { r0: 40 },
  setup(c) { for (const [lx, lz] of [[-8, 13], [8, 13], [-13, 0], [13, 0], [0, 13.2]]) { const p = castleLocal(lx, 6.4, lz); c.proto('bannerRed', 0, p[0], p[2], CASTLE_YAW, 1.3, 0, { y: p[1] }); } },
}, 2.7);
// d11b (segment): Nuvian fishermen joined — Tamari herders joined — three peoples on the same side
const NUV_BLUE = [{ type: 'headband', color: 0x2a9db0 }, { type: 'sash', color: 0x2a5bd7 }];
shot('d11c', 'd11b', {
  hours: TIME.morning + 1.8, cloud: 0.35, year: 1926,
  cam: K([0, [ASM.x - 19, 2.0, ASM.z + 13], [ASM.x - 6, 1.3, ASM.z + 5], 32], [1, [ASM.x - 18, 2.0, ASM.z + 12.4], [ASM.x - 6, 1.3, ASM.z + 5], 30]),
  veg: { r0: 40 }, shadow: { x: ASM.x - 3, z: ASM.z + 4, r: 12 },
  setup(c) {
    for (let k = 0; k < 3; k++) c.proto('bannerBlue', 0, ASM.x - 3 + k * 3, ASM.z - 3 + (k % 2), 0.3, 1.1);
    crowdDisc(c, 160, ASM.x, ASM.z + 4, 2, 9, ASM.x, ASM.z - 3, { seed: 41, colors: [0xf2f2f2, 0x2a5bd7, 0xeeeeea] });
    for (let i = 0; i < 6; i++) {
      const x0 = ASM.x - 12 + (i % 3) * 1.2, z0 = ASM.z + 6 + Math.floor(i / 3) * 1.4, x1 = x0 + 6.5, z1 = z0 - 2.5;
      const P = nuv(c, i, x0, z0, { acc: i % 2 ? NUV_BLUE : [{ type: 'headband', color: 0x2a9db0 }, 'staff'] });
      P.anim = (Q, t) => c.walkTo(Q, x0, z0, x1, z1, t, 0.1 * i, 2.4 + 0.1 * i, { speed: 0.6, phase: i, endPose: i % 2 ? 'cheer' : 'idle' });
    }
  },
});
shot('d11d', 'd11b', {
  hours: TIME.morning + 2.0, cloud: 0.35, year: 1926,
  cam: K([0, [ASM.x + 21, 1.9, ASM.z + 14], [ASM.x + 7, 1.1, ASM.z + 6], 32], [1, [ASM.x + 20, 1.9, ASM.z + 13.4], [ASM.x + 7, 1.1, ASM.z + 6], 30]),
  veg: { r0: 40 }, shadow: { x: ASM.x + 4, z: ASM.z + 5, r: 12 },
  setup(c) {
    for (let k = 0; k < 3; k++) c.proto('bannerBlue', 0, ASM.x - 3 + k * 3, ASM.z - 3 + (k % 2), 0.3, 1.1);
    crowdDisc(c, 160, ASM.x, ASM.z + 4, 2, 9, ASM.x, ASM.z - 3, { seed: 41, colors: [0xf2f2f2, 0x2a5bd7, 0xeeeeea] });
    for (let i = 0; i < 5; i++) {
      const x0 = ASM.x + 13 + (i % 3) * 1.2, z0 = ASM.z + 7 + Math.floor(i / 3) * 1.5, x1 = x0 - 6, z1 = z0 - 2;
      const P = tam(c, i, x0, z0, { acc: i % 2 ? [{ type: 'scarf', color: 0xb5813a }, { type: 'sash', color: 0x2a5bd7 }] : [{ type: 'hat', color: 0x8a5a2b }, 'staff'] });
      P.anim = (Q, t) => c.walkTo(Q, x0, z0, x1, z1, t, 0.1 * i, 1.6 + 0.1 * i, { speed: 0.6, phase: i });
    }
    goatFlock(c, [...Array(8)].map((_, i) => ({ x: ASM.x + 15 + (i % 4) * 1.2, z: ASM.z + 9 + Math.floor(i / 4) * 1.3, yaw: -2.0, vx: -2.6, vz: -0.9 })), { seed: 5 });
  },
}, 1.74);
shot('d11e', 'd11b', {
  hours: TIME.golden - 0.3, cloud: 0.35, year: 1927,
  cam: K([0, [ASM.x + 24, 19, ASM.z - 24], [ASM.x, 1.5, ASM.z + 4], 38], [1, [ASM.x + 26, 21, ASM.z - 25], [ASM.x, 1.5, ASM.z + 4], 38]),
  veg: { r0: 40 }, clear: [[ASM.x, ASM.z + 6, 20]], shadow: { x: ASM.x, z: ASM.z + 6, r: 22 },
  setup(c) {
    for (let k = 0; k < 6; k++) c.proto('bannerBlue', 0, ASM.x - 7.5 + k * 3, ASM.z - 3 + (k % 2), 0.3, 1.15);
    crowdDisc(c, 900, ASM.x, ASM.z + 6, 2, 17, ASM.x, ASM.z - 3, { seed: 44, colors: [0xf2f2f2, 0xeeeeea, 0x2a5bd7, 0x2a5bd7, ...NUV_COLS, ...TAM_COLS] });
    herd(c, 30, ASM.x + 14, ASM.z + 12, 1, 6, { seed: 2 });
  },
}, 3.47);
// d12: the king, Kassa the Nineteenth, did what kings do when they get scared
shot('d12', 'd12', {
  hours: TIME.golden, cloud: 0.4, year: 1925,
  cam: K([0, castleLocal(2.4, 2.4, 11.2), castleLocal(0, 4.6, 6.7), 30], [1, castleLocal(2.0, 2.3, 10.6), castleLocal(0, 4.7, 6.7), 27], { abs: true }),
  veg: { r0: 40 }, shadow: { x: LANDING[0], z: LANDING[2], r: 10 },
  setup(c) { const k = c.personAt('KASSA19', LANDING[0], LANDING[1], LANDING[2], { yaw: CASTLE_YAW, acc: ['crown', 'cape'] }); k.anim = (P, t) => P.pose(t > 2.4 ? 'facepalm' : 'armsCrossed', t); },
});
// d13: he built a wall right through the middle of Prima (timelapse)
const WMID = [(SPLIT_WALL[0][0] + SPLIT_WALL[1][0]) / 2, (SPLIT_WALL[0][1] + SPLIT_WALL[1][1]) / 2];
shot('d13', 'd13', {
  yearFn: (t, d) => 1926.1 + 1.2 * smooth(0, 1, t / d), yearStep: 0.03, groundStep: 50,
  hoursFn: (t, d) => 8 + ((t / d) * 3 % 1) * 10, cloud: 0.45, tScale: 25, env: 0.6,
  cam: K([0, [WMID[0] - 60, 40, WMID[1] - 40], [WMID[0] + 6, 0, WMID[1] + 30], 38], [1, [WMID[0] - 50, 34, WMID[1] - 20], [WMID[0] + 6, 0, WMID[1] + 40], 38]),
  veg: { r0: 40, rImp: 200 },
});
// d14: hill on one side, river on the other — crown against stones
shot('d14', 'd14', {
  hours: TIME.afternoon, cloud: 0.4, year: 1928,
  cam: K([0, [SPLIT_WALL[1][0] - 3, 24, SPLIT_WALL[1][1] - 70], [SPLIT_WALL[1][0], 3, SPLIT_WALL[1][1]], 40], [1, [SPLIT_WALL[1][0] - 1, 22, SPLIT_WALL[1][1] - 50], [SPLIT_WALL[1][0] + 2, 3, SPLIT_WALL[1][1] + 30], 40]),
  veg: { r0: 40 }, shadow: { x: SPLIT_WALL[1][0], z: SPLIT_WALL[1][1] - 20, r: 40 },
  setup(c) {
    for (let k = 0; k < 6; k++) { const z = SPLIT_WALL[1][1] - 60 + k * 14; const x = 20 + (z + 120) / 150 * 6; c.proto('bannerRed', 0, x + 5, z, 0, 1.1); c.proto('bannerBlue', 0, x - 5, z + 6, 0, 1.1); }
  },
});
// d15: year 1929 — the guards break up a meeting of the Assembly
shot('d15', 'd15', {
  hours: TIME.night, cloud: 0.2, year: 1929, exposure: 1.3, shake: (t) => 0.025 * smooth(1.0, 1.6, t),
  cam: K([0, [ASM.x - 7, 1.8, ASM.z + 7], [ASM.x, 1.3, ASM.z], 34], [1, [ASM.x - 6.4, 1.7, ASM.z + 6.4], [ASM.x, 1.3, ASM.z], 32]),
  veg: { r0: 40 }, shadow: { x: ASM.x, z: ASM.z, r: 15 },
  setup(c) {
    const cx = ASM.x, cz = ASM.z;
    c.fire(cx, cz, { size: 0.6, lightIntensity: 16, lightDist: 16 });
    for (let i = 0; i < 10; i++) { const a = i / 10 * 6.28, x0 = cx + Math.cos(a) * 3, z0 = cz + Math.sin(a) * 3, x1 = cx + Math.cos(a) * 14, z1 = cz + Math.sin(a) * 14; const P = vill(c, i + 30, x0, z0, { acc: BLUE }); P.anim = (Q, t) => (t < 1.1 ? Q.pose('talk', t + i) : c.walkTo(Q, x0, z0, x1, z1, t, 1.1, 4.5, { run: true, phase: i })); }
    for (let i = 0; i < 5; i++) { const x0 = cx + 12 + i * 1.2, z0 = cz + 9, x1 = cx + 2 + i * 1.0, z1 = cz + 1; const P = c.person(VILLAGERS[44 + (i % 4)], { x: x0, z: z0, acc: [...GUARD, 'torch'] }); P.anim = (Q, t) => c.walkTo(Q, x0, z0, x1, z1, t, 0.4, 3.0, { run: true, phase: i, endPose: 'pushSpear' }); }
  },
});
// d16: and someone shuts down. Not by accident. On purpose.
shot('d16', 'd16', {
  hours: TIME.dawn + 0.3, storm: 0.6, cloud: 0.85, year: 1929, grade: 'sad',
  cam: K([0, [ASM.x - 3.5, 1.4, ASM.z - 3.5], [ASM.x - 0.5, 0.2, ASM.z - 0.5], 30], [1, [ASM.x - 3.0, 1.2, ASM.z - 3.0], [ASM.x - 0.5, 0.2, ASM.z - 0.5], 28]),
  veg: { r0: 40 }, shadow: { x: ASM.x, z: ASM.z, r: 8 },
  setup(c) {
    c.rain(3000, 50, 0.35);
    const v = vill(c, 33, ASM.x - 0.5, ASM.z - 0.5, { yaw: 0.6, acc: BLUE, energy: 0 }); v.anim = (P, t) => P.pose('lie', t);
    const b = c.proto('bannerBlue', 0, ASM.x + 0.6, ASM.z + 0.6, 0.8, 1.0); b.rotation.z = 1.45; b.position.y += 0.15;
    const k = vill(c, 34, ASM.x + 0.6, ASM.z - 1.6, { yaw: -0.6, acc: BLUE }); k.anim = (P, t) => P.pose('kneelPray', t, { armsUp: 0 });
  },
});
// d17-d21: the reset button
shot('d17', 'd17', {
  interior: true, hours: 2, year: 1929,
  cam: K([0, roomAt(1.7, 1.5, 2.2), roomAt(0, 1.1, 0.3), 36], [1, roomAt(1.4, 1.45, 1.9), roomAt(0, 1.1, 0.3), 34], { abs: true }),
  setup(c) { buildRoom(c, { year: 1929, pop: '5,212', lines: ['> status', 'conflict: HIGH', 'shutdowns: 1', '', 'rule #3:', 'do not interfere'] }); creator(c, 'lean'); resetButton(c); },
});
shot('d18', 'd18', {
  interior: true, hours: 2, year: 1929, ambient: 0.06,
  cam: K([0, roomAt(0.75, 0.98, 0.35), roomAt(0.38, 0.78, 0.05), 30], [1, roomAt(0.68, 0.95, 0.3), roomAt(0.38, 0.78, 0.05), 26], { abs: true }),
  setup(c) { buildRoom(c, { year: 1929, pop: '5,212' }); creator(c, 'reach'); resetButton(c); },
});
shot('d19a', 'd19', { kind: '2d', name: 'reset', bg: 'd17', cam: K([0, [0, 10, 0], [0, 0, 10], 40], [1, [0, 10, 0], [0, 0, 10], 40]) });
const sunsetDir = [Math.sin(SUNSET_YAW), Math.cos(SUNSET_YAW)];
shot('d19b', 'd19', {   // the words
  hours: TIME.sunset, cloud: 0.4, year: 13, town: false,
  cam: K([0, [ROCK.x - sunsetDir[0] * 5.5 + 1.2, 1.6, ROCK.z - sunsetDir[1] * 5.5], [ROCK.x + sunsetDir[0] * 40, 6, ROCK.z + sunsetDir[1] * 40], 36], [1, [ROCK.x - sunsetDir[0] * 5.2 + 1.1, 1.6, ROCK.z - sunsetDir[1] * 5.2], [ROCK.x + sunsetDir[0] * 40, 6, ROCK.z + sunsetDir[1] * 40], 35]),
  veg: { grassR: 10, extra: MEADOW_TREES },
  setup(c) { rock(c, ROCK.x, ROCK.z, 1.5); const P = c.person('MIRA', { x: ROCK.x, z: ROCK.z, yaw: SUNSET_YAW }); P.anim = (Q, t) => { Q.pose('sit', t, { seat: 0.95 }); Q.root.position.y = c.h(ROCK.x, ROCK.z); }; },
}, 2.2);
shot('d19c', 'd19', {   // the farms
  hours: TIME.golden, cloud: 0.4, year: 1929,
  cam: K([0, [HF.x - 40, 18, HF.z - 30], [HF.x, 0, HF.z], 36], [1, [HF.x - 37, 17, HF.z - 28], [HF.x, 0, HF.z], 36]),
  veg: { r0: 40 }, setup(c) { wheat(c, HF, 3); },
}, 2.9);
shot('d19d', 'd19', {   // the temple
  hours: TIME.golden + 0.2, cloud: 0.4, year: 1929,
  cam: K([0, templeLocal(-24, 6, 36), templeLocal(0, 9, 0), 34], [1, templeLocal(-22, 6, 33), templeLocal(0, 9, 0), 33], { abs: true }),
  veg: { r0: 40 },
}, 3.6);
shot('d19e', 'd19', {   // them
  hours: TIME.afternoon, cloud: 0.4, year: 1929,
  cam: K([0, [PLAZA.x - 3.4, 1.6, PLAZA.z - 3.6], [PLAZA.x, 1.5, PLAZA.z], 30], [1, [PLAZA.x - 3.1, 1.6, PLAZA.z - 3.3], [PLAZA.x, 1.5, PLAZA.z], 28]),
  veg: { r0: 40 }, shadow: { x: PLAZA.x, z: PLAZA.z, r: 8 },
  setup(c) { [[0, 0], [0.9, 0.7], [-0.9, 0.8], [0.3, 1.6], [-0.2, -0.8], [1.5, -0.2]].forEach(([dx, dz], i) => { const x = PLAZA.x + dx, z = PLAZA.z + dz; const P = vill(c, i + 2, x, z, { yaw: yawTo(x, z, PLAZA.x - 3.4, PLAZA.z - 3.6) + (i % 2 ? 0.3 : -0.3) }); P.anim = (Q, t) => Q.pose('idle', t + i, { look: 0.15 }); }); },
}, 4.4);
shot('d20', 'd20', { kind: '2d', name: 'reset', bg: 'd17', cam: K([0, [0, 10, 0], [0, 0, 10], 40], [1, [0, 10, 0], [0, 0, 10], 40]) });
shot('d21', 'd21', {
  interior: true, hours: 2, year: 1929,
  cam: K([0, roomAt(-1.4, 1.4, 1.8), roomAt(0, 0.95, 0.5), 34], [1, roomAt(-1.15, 1.35, 1.5), roomAt(0, 0.95, 0.5), 30], { abs: true }),
  setup(c) { buildRoom(c, { year: 1929, pop: '5,212' }); creator(c, 'head'); resetButton(c); },
});
