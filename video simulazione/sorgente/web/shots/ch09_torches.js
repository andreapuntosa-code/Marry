// CHAPTER IX — THE NIGHT OF TORCHES (year 1931-1932)
import * as THREE from 'three';
import { shot, SHOTS } from './registry.js';
import { mulberry32 } from '../lib/noise.js';
import { VILLAGERS, spearMesh, crownMesh } from '../lib/people.js';
import { TorchField } from '../lib/fx.js';
import { K, orbitCam, TIME, PRIMA, HILL, TEMPLE, CASTLE, PLAZA, BRIDGE, yawTo, lerpAngle, smooth, eraAcc,
  castleLocal, castleXZ, CASTLE_YAW, LANDING, GUARD, BLUE } from './sets.js';
import { crownProp } from './ch00_open.js';

const vill = (c, i, x, z, o = {}) => c.person(VILLAGERS[i % VILLAGERS.length], { x, z, acc: eraAcc(o.era || 'stone', i), ...o });
const NIGHT = { hours: TIME.night, cloud: 0.12, year: 1931, exposure: 1.3 };
const L = (lx, ly, lz) => castleLocal(lx, ly, lz);
const FWD = [Math.sin(CASTLE_YAW), Math.cos(CASTLE_YAW)];          // the castle's front direction (world)
const ROYAL = [[8, -6], [60, 20], [64, 46], [98, 78]];

// the torch-lit crowd in front of the palace: instanced bodies + torch sprites + a few lights
function torchCrowd(c, n = 1800, opts = {}) {
  const cr = c.crowd(n, { colors: [0xf2f2f2, 0xeeeeea, 0xe6e6e6, 0xd9c7a8, 0x2a5bd7] });
  const r = mulberry32(opts.seed ?? 19);
  const P = [];
  for (let i = 0; i < n; i++) {
    const lx = (r() - 0.5) * 2 * (6 + (opts.spread ?? 22) * r()), lz = (opts.z0 ?? 19) + Math.pow(r(), 0.8) * (opts.depth ?? 42);
    const [x, y, z] = L(lx, 0, lz);
    const yy = c.h(x, z);
    if (opts.keep && !opts.keep(lx, lz)) { cr.set(i, 0, -999, 0, 0, 0); continue; }
    const f = opts.face || L(0, 0, 8);
    cr.set(i, x, yy, z, Math.atan2(f[0] - x, f[2] - z) + (r() - 0.5) * 0.4, 0);
    P.push([x, yy, z]);
  }
  const nt = Math.floor(P.length * (opts.torchFrac ?? 0.55));
  const tf = new TorchField(nt); c.add(tf.group);
  tf.setPositions(P.slice(0, nt).map(([x, y, z], i) => [x + 0.22, y + 2.0 + (i % 3) * 0.05, z]));
  c.on(t => cr.update(t));
  // a handful of real lights spread over the crowd
  for (let k = 0; k < (opts.lights ?? 4); k++) { const [x, , z] = L((k - 1.5) * 9, 0, (opts.z0 ?? 19) + 6 + (k % 2) * 10); const l = new THREE.PointLight(0xff9a4a, 26, 34, 1.6); l.position.set(x, c.h(x, z) + 3.5, z); c.add(l); }
  return { cr, tf };
}
// forty guards in two rows in front of the gate
function guards(c, opts = {}) {
  const out = [];
  for (let i = 0; i < 40; i++) {
    const row = i < 20 ? 0 : 1, k = i % 20;
    const lx = (k - 9.5) * 1.15, lz = 14.2 + row * 1.25;
    const [x, y, z] = L(lx, 0, lz);
    const isDorn = i === 9;
    const P = isDorn ? c.person('DORN', { x, z, yaw: CASTLE_YAW }) : c.person(VILLAGERS[(i * 7) % 48], { x, z, yaw: CASTLE_YAW, acc: GUARD });
    P.lx = lx; P.lz = lz; P.gi = i;
    P.anim = opts.anim ? ((Q, t) => opts.anim(Q, t, i)) : ((Q, t) => Q.pose('pushSpear', t + i * 0.3, { phase: i }));
    out.push(P);
  }
  return out;
}
function king(c, opts = {}) {
  const k = c.personAt('KASSA19', LANDING[0], LANDING[1], LANDING[2], { yaw: CASTLE_YAW, acc: opts.acc || ['crown', 'cape'] });
  k.anim = opts.anim || ((P, t) => P.pose('armsCrossed', t));
  for (const sx of [-1, 1]) { const p = L(sx * 3.6, 0, 13.4); c.fire(p[0], p[2], { size: 0.55, n: 16, lightIntensity: 20, lightDist: 18, dy: 2.2 }); }
  const lp = L(0, 3.0, 8.4); c.fire(lp[0], lp[2], { size: 0.4, n: 12, lightIntensity: 10, lightDist: 10, y: lp[1] + 1.5 });
  return k;
}
// a spear lying on the ground where a guard dropped it
function droppedSpear(c, P, t0, t) {
  if (!P._sp) { P._sp = spearMesh(); c.add(P._sp); P._sp.visible = false; }
  const sp = P.props.spear;
  if (t < t0 + 0.7) { if (sp) sp.visible = true; P._sp.visible = false; return; }
  if (sp) sp.visible = false;
  P._sp.visible = true;
  const [x, , z] = L(P.lx + 0.5, 0, P.lz - 0.55);
  P._sp.position.set(x, c.h(x, z) + 0.05, z); P._sp.rotation.set(0, CASTLE_YAW + Math.PI / 2, Math.PI / 2);
}

shot('x_card', 'chap:x01', {
  ...NIGHT,
  cam: K([0, [CASTLE.x - 110, 14, CASTLE.z - 120], [CASTLE.x, 12, CASTLE.z], 34], [1, [CASTLE.x - 100, 13, CASTLE.z - 110], [CASTLE.x, 12, CASTLE.z], 34]),
  veg: { r0: 40 },
  setup(c) { king(c); },
});
// x01: year 1931. Night.
shot('x01', 'x01', {
  ...NIGHT,
  cam: K([0, [CASTLE.x - 60, 5, CASTLE.z - 70], [CASTLE.x, 12, CASTLE.z], 30], [1, [CASTLE.x - 56, 5, CASTLE.z - 66], [CASTLE.x, 12, CASTLE.z], 29]),
  veg: { r0: 40 },
  setup(c) { king(c); guards(c); },
});
// x02a: four thousand AIs walk up the hill with torches (aerial)
shot('x02a', 'x02', {
  ...NIGHT, exposure: 1.35,
  cam: K([0, [20, 70, -40], [60, 0, 30], 40], [1, [30, 64, -26], [66, 0, 38], 40]),
  veg: { r0: 40 },
  setup(c) {
    const n = 2400, cr = c.crowd(n, { colors: [0xf2f2f2, 0xeeeeea, 0xd9c7a8, 0x2a5bd7] }), r = mulberry32(5);
    const base = [...Array(n)].map(() => [r(), (r() - 0.5) * 9, r()]);
    const tf = new TorchField(Math.floor(n * 0.6)); c.add(tf.group);
    const tp = [...Array(tf.n)].map(() => [0, 0, 0]);
    c.on(t => {
      base.forEach(([u0, off], i) => {
        const u = Math.min(0.999, (u0 * 0.92 + t * 0.012) % 1); const seg = u * 3, k = Math.floor(seg), f = seg - k;
        const [ax, az] = ROYAL[k], [bx, bz] = ROYAL[k + 1]; const dx = bx - ax, dz = bz - az, l = Math.hypot(dx, dz);
        const x = ax + dx * f - dz / l * off, z = az + dz * f + dx / l * off, y = c.h(x, z);
        cr.set(i, x, y, z, Math.atan2(dx, dz), 1);
        if (i < tf.n) { tp[i][0] = x + 0.2; tp[i][1] = y + 2.0; tp[i][2] = z; }
      });
      cr.update(t); tf.setPositions(tp);
    });
    king(c);
  },
});
// x02b: ground level — farmers, builders, shepherds marching with torches
shot('x02b', 'x02', {
  ...NIGHT,
  cam: K([0, [86, 1.7, 67.5], [76, 1.8, 57.5], 34], [1, [85.4, 1.7, 66.9], [75.4, 1.8, 56.9], 32]),
  veg: { r0: 40 }, shadow: { x: 79, z: 60, r: 12 },
  setup(c) {
    const dir = [98 - 64, 78 - 46]; const l = Math.hypot(...dir); const ux = dir[0] / l, uz = dir[1] / l;
    for (let i = 0; i < 10; i++) {
      const x0 = 76 - ux * (i % 5) * 1.8 + (i % 2 ? 1.4 : -1.4) * uz, z0 = 57 - uz * (i % 5) * 1.8 - (i % 2 ? 1.4 : -1.4) * ux - Math.floor(i / 5) * 2;
      const P = vill(c, i + 4, x0, z0, { acc: i % 2 === 0 ? ['torch'] : (i % 3 === 0 ? ['staff'] : eraAcc('stone', i)) });
      if (i % 2 === 0) c.torch(P, { size: 0.34, light: i % 4 === 0, lightIntensity: 8, lightDist: 10, seed: i });
      P.anim = (Q, t) => c.walkTo(Q, x0, z0, x0 + ux * 6, z0 + uz * 6, t, 0, 8, { speed: 0.7, movePose: i % 2 === 0 ? 'holdTorch' : 'walk', p: { walking: true }, phase: i });
    }
    const n = 500, cr = c.crowd(n, { colors: [0xf2f2f2, 0xeeeeea, 0xd9c7a8] }), r = mulberry32(3);
    const tf = new TorchField(250); c.add(tf.group); const tp = [];
    for (let i = 0; i < n; i++) { const back = 6 + r() * 40, off = (r() - 0.5) * 10; const x = 76 - ux * back + uz * off, z = 57 - uz * back - ux * off; cr.set(i, x, c.h(x, z), z, Math.atan2(ux, uz), 1); if (i < 250) tp.push([x + 0.2, c.h(x, z) + 2, z]); }
    tf.setPositions(tp); c.on(t => cr.update(t));
  },
}, 3.1);
// x02c: somebody even brought the goats
shot('x02c', 'x02', {
  ...NIGHT,
  cam: K([0, [80.5, 0.6, 61.5], [77.5, 0.5, 58.6], 30], [1, [80.9, 0.6, 62.0], [77.9, 0.5, 59.1], 28]),
  veg: { r0: 40 }, shadow: { x: 78, z: 59, r: 8 },
  setup(c) {
    const ux = 0.728, uz = 0.685;
    for (let i = 0; i < 4; i++) { const x0 = 75 + i * 0.9 - uz * (i % 2) * 1.2, z0 = 56 + i * 0.4 + ux * (i % 2) * 1.2; const g = c.animal('goat', i, x0, z0, Math.atan2(ux, uz)); c.on(t => { const x = x0 + ux * t * 0.9, z = z0 + uz * t * 0.9; g.root.position.set(x, c.h(x, z), z); g.animate(t, { speed: 0.6, phase: i }); }); }
    const sh = vill(c, 2, 76.5, 54.5, { acc: ['torch'] }); c.torch(sh, { size: 0.34, light: true, lightIntensity: 8, lightDist: 10 });
    sh.anim = (Q, t) => c.walkTo(Q, 76.5, 54.5, 76.5 + ux * 3, 54.5 + uz * 3, t, 0, 3, { movePose: 'holdTorch', p: { walking: true } });
  },
}, 5.6);
// x03: at the top, in front of the palace, forty guards with spears
shot('x03', 'x03', {
  ...NIGHT,
  cam: K([0, L(-3, 1.2, 22), L(0, 2.2, 14.5), 36], [1, L(-2.4, 1.1, 21), L(0, 2.3, 14.5), 34], { abs: true }),
  veg: { r0: 40 }, shadow: { x: L(0, 0, 15)[0], z: L(0, 0, 15)[2], r: 18 },
  setup(c) { king(c); guards(c); },
});
// x04: and the king
shot('x04', 'x04', {
  ...NIGHT,
  cam: K([0, L(0.6, 1.6, 17.5), L(0, 4.7, 6.7), 26], [1, L(0.5, 1.6, 16.8), L(0, 4.8, 6.7), 24], { abs: true }),
  veg: { r0: 40 }, shadow: { x: LANDING[0], z: LANDING[2], r: 14 },
  setup(c) { king(c); guards(c); },
});
// x05: everybody expected a massacre (wide side view of the standoff)
shot('x05', 'x05', {
  ...NIGHT,
  cam: K([0, L(-34, 14, 30), L(0, 2, 18), 36], [1, L(-31, 13, 28), L(0, 2, 18), 34], { abs: true }),
  veg: { r0: 40 }, shadow: { x: L(0, 0, 20)[0], z: L(0, 0, 20)[2], r: 30 },
  setup(c) { king(c); guards(c); torchCrowd(c, 2200); },
});
// x06: Orun steps out of the crowd and counts, out loud
const OR = L(0.6, 0, 18.4);
shot('x06', 'x06', {
  ...NIGHT,
  cam: K([0, L(1.6, 1.7, 25), L(0.4, 1.6, 17), 32], [1, L(1.2, 1.7, 22.5), L(0.4, 1.7, 16), 32], { abs: true }),
  veg: { r0: 40 }, shadow: { x: OR[0], z: OR[2], r: 14 },
  setup(c) {
    king(c); guards(c); torchCrowd(c, 1600, { z0: 21.5, keep: (lx, lz) => Math.hypot(lx - 1.4, lz - 24) > 3.8 });
    const s0 = L(0.6, 0, 22.5);
    const o = c.person('ORUN', { x: s0[0], z: s0[2], acc: BLUE }); o.anim = (P, t) => c.walkTo(P, s0[0], s0[2], OR[0], OR[2], t, 0.3, 2.8, { speed: 0.6, endPose: 'idle' });
  },
});
// x06L: "Forty of you. Four thousand of us. You don't have to choose him. You can choose."
shot('x06L', 'x06L', {
  ...NIGHT,
  cam: K([0, L(-1.4, 1.65, 15.8), L(0.6, 1.6, 18.4), 28], [1, L(-1.2, 1.65, 16.1), L(0.6, 1.62, 18.4), 26], { abs: true }),
  veg: { r0: 40 }, shadow: { x: OR[0], z: OR[2], r: 10 },
  setup(c) {
    king(c); guards(c); torchCrowd(c, 1600, { z0: 21.5 });
    const o = c.person('ORUN', { x: OR[0], z: OR[2], yaw: CASTLE_YAW + Math.PI, acc: BLUE }); o.anim = (P, t) => P.pose(t > 2.6 ? 'armsOpen' : 'point', t, { aim: 0.1 });
  },
});
// x07: the captain of the guard, a soldier named Dorn (close)
const DORN_AT = L((9 - 9.5) * 1.15, 0, 14.2);
shot('x07', 'x07', {
  ...NIGHT,
  cam: K([0, L(-0.2, 1.75, 16.4), L(-0.55, 1.85, 14.2), 24], [1, L(-0.25, 1.75, 16.1), L(-0.55, 1.88, 14.2), 22], { abs: true }),
  veg: { r0: 40 }, shadow: { x: DORN_AT[0], z: DORN_AT[2], r: 8 },
  setup(c) {
    king(c);
    guards(c, { anim: (Q, t, i) => { Q.pose('pushSpear', t + i * 0.3); if (i === 9) { Q.head.rotation.y = Math.sin(t * 0.9) * 0.5; Q.head.rotation.x = 0.1 + 0.15 * smooth(2.5, 4.0, t); } } });
    const o = c.person('ORUN', { x: OR[0], z: OR[2], yaw: CASTLE_YAW + Math.PI, acc: BLUE }); o.anim = (P, t) => P.pose('idle', t);
  },
});
// x08: he put down his spear (slow)
shot('x08', 'x08', {
  ...NIGHT,
  cam: K([0, L(2.8, 1.5, 17.8), L(-0.55, 1.0, 14.2), 34], [1, L(2.6, 1.45, 17.5), L(-0.55, 0.95, 14.2), 32], { abs: true }),
  veg: { r0: 40 }, shadow: { x: DORN_AT[0], z: DORN_AT[2], r: 8 },
  setup(c) {
    king(c);
    guards(c, { anim: (Q, t, i) => { if (i === 9) { Q.pose('dropSpear', Math.max(0, t - 0.3) * 0.7); droppedSpear(c, Q, 0.9, t); } else Q.pose('pushSpear', t + i * 0.3); } });
  },
});
// x09: then another one. Then ten. Then all forty. (tracking along the line)
shot('x09', 'x09', {
  ...NIGHT,
  cam: K([0, L(-8, 1.5, 18.5), L(-6, 1.3, 14.5), 32], [1, L(9, 1.5, 18.5), L(11, 1.3, 14.5), 32], { abs: true, linear: true }),
  veg: { r0: 40 }, shadow: { x: L(0, 0, 15)[0], z: L(0, 0, 15)[2], r: 16 },
  setup(c) {
    king(c);
    const order = (i) => (i === 9 ? -5 : i === 10 ? 0.15 : 0.9 + ((i * 37) % 40) / 40 * 1.6);
    guards(c, { anim: (Q, t, i) => { const t0 = order(i); Q.pose(t >= t0 ? 'dropSpear' : 'pushSpear', t >= t0 ? (t - t0) * 1.2 : t + i * 0.3); droppedSpear(c, Q, t0 + 0.3, t); } });
  },
});
// x10: and the king was standing alone (from behind him, through the gate)
shot('x10', 'x10', {
  ...NIGHT,
  cam: K([0, L(0.9, 4.9, 6.15), L(0, 1.5, 22), 38], [1, L(0.8, 4.85, 6.2), L(0, 1.5, 22), 36], { abs: true }),
  veg: { r0: 40 }, shadow: { x: L(0, 0, 14)[0], z: L(0, 0, 14)[2], r: 18 },
  setup(c) {
    king(c, { anim: (P, t) => P.pose('idle', t, { look: 0.2 }) });
    guards(c, { anim: (Q, t, i) => { Q.pose('idle', t + i, { look: 0.3 }); const [x, , z] = L(Q.lx + (Q.lx > 0 ? 3 : -3), 0, Q.lz + 0.5); Q.place(x, c.h(x, z), z, CASTLE_YAW + (Q.lx > 0 ? -0.8 : 0.8)); if (Q.props.spear) Q.props.spear.visible = false; } });
    torchCrowd(c, 2000, { z0: 20 });
  },
});
// x11: the crowd wanted to shut him down — four thousand against one
shot('x11', 'x11', {
  ...NIGHT, shake: 0.02,
  cam: K([0, L(-4, 2.4, 13.0), L(0, 2.0, 24), 32], [1, L(-3.4, 2.2, 13.6), L(0, 2.0, 24), 30], { abs: true }),
  veg: { r0: 40 }, shadow: { x: L(0, 0, 20)[0], z: L(0, 0, 20)[2], r: 18 },
  setup(c) {
    torchCrowd(c, 2000, { z0: 17.5 });
    for (let i = 0; i < 12; i++) { const lx = (i - 5.5) * 1.1, lz = 16.6 + (i % 2) * 0.9; const [x, , z] = L(lx, 0, lz); const P = vill(c, i + 10, x, z, { yaw: CASTLE_YAW + Math.PI, acc: i % 2 ? ['torch'] : BLUE }); if (i % 2) c.torch(P, { size: 0.34, seed: i }); P.anim = (Q, t) => Q.pose(i % 2 ? 'holdTorch' : 'cheer', t * 1.3 + i, { phase: i }); }
  },
});
// x12: but Orun stepped in front of him
shot('x12', 'x12', {
  ...NIGHT,
  cam: K([0, L(3.6, 2.6, 15.6), L(0, 2.4, 9.5), 32], [1, L(3.2, 2.5, 15.0), L(0, 2.5, 9.5), 30], { abs: true }),
  veg: { r0: 40 }, shadow: { x: L(0, 0, 11)[0], z: L(0, 0, 11)[2], r: 12 },
  setup(c) {
    const kp = L(0, 1.8, 8.6);
    const k = c.personAt('KASSA19', kp[0], kp[1] - 0.2, kp[2], { yaw: CASTLE_YAW, acc: ['crown', 'cape'] }); k.anim = (P, t) => P.pose('idle', t, { look: 0.1 });
    const o0 = L(0.4, 0, 14), o1 = L(0, 0, 11.6);
    const o = c.person('ORUN', { x: o0[0], z: o0[2], acc: BLUE });
    o.anim = (P, t) => { c.walkTo(P, o0[0], o0[2], o1[0], o1[2], t, 0, 1.8, { yFn: (x, z) => Math.max(c.h(x, z), L(0, 0.3, 11.6)[1]), endPose: 'armsOpen', endYaw: CASTLE_YAW + Math.PI }); };
    for (const sx of [-1, 1]) { const p = L(sx * 3.6, 0, 13.4); c.fire(p[0], p[2], { size: 0.55, n: 16, lightIntensity: 20, lightDist: 18, dy: 2.2 }); }
    torchCrowd(c, 1400, { z0: 19 });
  },
});
// x12L: "Then we vote."
shot('x12L', 'x12L', {
  ...NIGHT,
  cam: K([0, L(-0.5, 1.6, 13.6), L(0, 1.75, 11.6), 26], [1, L(-0.45, 1.6, 13.3), L(0, 1.78, 11.6), 24], { abs: true }),
  veg: { r0: 40 }, shadow: { x: L(0, 0, 11.6)[0], z: L(0, 0, 11.6)[2], r: 8 },
  setup(c) {
    const o1 = L(0, 0.3, 11.6); const o = c.personAt('ORUN', o1[0], o1[1], o1[2], { yaw: CASTLE_YAW + Math.PI, acc: BLUE }); o.anim = (P, t) => P.pose('idle', t, { look: 0.05 });
    for (const sx of [-1, 1]) { const p = L(sx * 3.6, 0, 13.4); c.fire(p[0], p[2], { size: 0.55, n: 16, lightIntensity: 20, lightDist: 18, dy: 2.2 }); }
  },
});
// x13: four thousand stones, two bowls: shut him down, or let him go
const VB = L(0, 0, 26);
function bigBowls(c, n, t0, t1, ratio = 0.8) {
  const b1 = L(-2.6, 0, 26), b2 = L(2.6, 0, 26);
  c.proto('bowl', 0, b1[0], b1[2], 0, 1.4); c.proto('bowl', 0, b2[0], b2[2], 0, 1.4);
  const g = new THREE.IcosahedronGeometry(0.07, 0), m = new THREE.MeshStandardMaterial({ color: 0x8d8f94, roughness: 0.8 });
  const im = new THREE.InstancedMesh(g, m, n); im.frustumCulled = false; c.own(g); c.add(im);
  const r = mulberry32(2); const mx = new THREE.Matrix4(), hide = new THREE.Matrix4().makeScale(0, 0, 0);
  const st = [...Array(n)].map((_, i) => { const left = r() > ratio; const b = left ? b1 : b2; const a = r() * 6.28, rr = Math.sqrt(r()) * 1.05; return { x: b[0] + Math.cos(a) * rr, z: b[2] + Math.sin(a) * rr, h: Math.min(0.75, (i / n) * (left ? 1.4 : 1.1)) * (left ? 0.5 : 1.0), tt: t0 + (t1 - t0) * (i / n), y0: c.h(b[0], b[2]) }; });
  c.on(t => { st.forEach((s, i) => { if (t < s.tt) { im.setMatrixAt(i, hide); return; } const f = t - s.tt; mx.makeTranslation(s.x, s.y0 + 0.15 + s.h + Math.max(0, 2.2 - 4.9 * f * f), s.z); im.setMatrixAt(i, mx); }); im.instanceMatrix.needsUpdate = true; });
}
shot('x13', 'x13', {
  ...NIGHT,
  cam: K([0, L(-7, 3.4, 33), VB, 34], [1, L(-6, 3.2, 31.5), VB, 32], { abs: true }),
  veg: { r0: 40 }, shadow: { x: VB[0], z: VB[2], r: 12 },
  setup(c) { bigBowls(c, 1600, 0.3, c.dur); torchCrowd(c, 1500, { z0: 30, depth: 30, keep: (lx, lz) => Math.hypot(lx, lz - 26) > 5.5 }); },
});
// x14: they let him go
shot('x14', 'x14', {
  ...NIGHT,
  cam: K([0, L(3.4, 1.4, 23.6), L(2.6, 0.5, 26), 30], [1, L(3.3, 1.3, 23.9), L(2.6, 0.5, 26), 27], { abs: true }),
  veg: { r0: 40 }, shadow: { x: VB[0], z: VB[2], r: 8 },
  setup(c) { bigBowls(c, 1600, -20, -2); const p = L(4.5, 0, 24); c.fire(p[0], p[2], { size: 0.5, n: 14, lightIntensity: 14, lightDist: 12, dy: 1.8 }); },
});
// x15a: dawn — the last king takes off his crown and leaves it on the steps
shot('x15a', 'x15', {
  hours: TIME.dawn + 0.2, cloud: 0.35, year: 1931,
  cam: K([0, L(2.0, 2.4, 11.0), L(0, 3.6, 7.2), 30], [1, L(1.8, 2.3, 10.4), L(0, 3.5, 7.4), 28], { abs: true }),
  veg: { r0: 40 }, shadow: { x: LANDING[0], z: LANDING[2], r: 8 },
  setup(c) {
    const k = c.personAt('KASSA19', LANDING[0], LANDING[1], LANDING[2], { yaw: CASTLE_YAW, acc: ['cape'] });
    k.anim = (P, t) => { if (t < 1.2) { P.pose('idle', t); P.R.sh.rotation.z = 2.4 * smooth(0.1, 0.7, t); P.L.sh.rotation.z = -2.4 * smooth(0.1, 0.7, t); P.R.el.rotation.x = -1.2; P.L.el.rotation.x = -1.2; } else P.pose('bow', t, { amount: smooth(1.2, 2.2, t) * 0.9 }); };
    const cr = crownMesh(); c.add(cr);
    const rest = L(0.4, 3.02, 7.6);
    c.after(t => { if (t < 1.2) { k.root.updateMatrixWorld(true); const hp = new THREE.Vector3(); k.head.getWorldPosition(hp); cr.position.set(hp.x, hp.y + 0.3 + 0.25 * smooth(0.2, 1.0, t), hp.z); cr.rotation.z = 0; cr.scale.setScalar(1.05); } else { const u = smooth(1.2, 2.4, t); const hp = new THREE.Vector3(); k.head.getWorldPosition(hp); cr.position.set(hp.x + (rest[0] - hp.x) * u, (hp.y + 0.55) * (1 - u) + rest[1] * u, hp.z + (rest[2] - hp.z) * u); cr.rotation.z = 0.25 * u; cr.scale.setScalar(1.05 + 0.1 * u); } });
  },
});
shot('x15b', 'x15', {   // ...and walked into the forest
  hours: TIME.dawn + 0.35, cloud: 0.35, year: 1931,
  cam: K([0, castleXZ(3.0, -14, 5.5), castleXZ(0, -36, 0.8), 36], [1, castleXZ(2.8, -15, 5.3), castleXZ(0, -40, 0.8), 36]),
  veg: { r0: 40 }, shadow: { x: castleLocal(0, 0, -26)[0], z: castleLocal(0, 0, -26)[2], r: 18 },
  setup(c) { const p0 = castleLocal(0.6, 0, -18), p1 = castleLocal(0.6, 0, -44); const k = c.person('KASSA19', { x: p0[0], z: p0[2], acc: ['cape'] }); k.anim = (P, t) => c.walkTo(P, p0[0], p0[2], p1[0], p1[2], t, 0, c.dur + 1.5, { speed: 0.6 }); },
}, 3.3);
// x16: I never found him again. And yes, I looked. (searching over the forest)
shot('x16', 'x16', {
  hours: TIME.morning, cloud: 0.4, year: 1931,
  cam: K([0, [380, 90, 420], [470, 0, 560], 40], [0.5, [400, 90, 440], [520, 0, 520], 40], [1, [420, 90, 470], [450, 0, 620], 40]),
  veg: { r0: 0, rImp: 0, r1: 900 },
});
// x17: so — democracy, or monarchy? (the crown on the steps, as in the opening)
shot('x17', 'x17', { ...SHOTS.op8, hours: TIME.dawn + 0.5 });
// x18: they chose democracy — blue banners at sunrise
shot('x18', 'x18', {
  hours: TIME.dawn + 0.8, cloud: 0.35, year: 1931,
  cam: K([0, L(-3, 1.5, 20.5), L(0, 8, 6), 36], [1, L(-2.6, 1.5, 19.6), L(0, 8.4, 6), 34], { abs: true }),
  veg: { r0: 40 }, shadow: { x: L(0, 0, 18)[0], z: L(0, 0, 18)[2], r: 20 },
  setup(c) {
    for (const [lx, lz] of [[-8, 13], [8, 13], [-13, 0], [13, 0], [0, 13.2]]) { const p = L(lx, 6.4, lz); c.proto('bannerBlue', 0, p[0], p[2], CASTLE_YAW, 1.3, 0, { y: p[1] }); }
    torchCrowd(c, 1300, { z0: 18, torchFrac: 0, lights: 0 });
    for (let i = 0; i < 8; i++) { const [x, , z] = L((i - 3.5) * 1.3, 0, 22 + (i % 2)); const P = vill(c, i + 3, x, z, { yaw: CASTLE_YAW + Math.PI, acc: BLUE }); P.anim = (Q, t) => Q.pose('cheer', t + i, { phase: i }); }
  },
});
// x18b: a year later — not a king, a speaker: Orun (same podium as the flash-forward)
shot('x18b', 'x18b', { ...SHOTS.op2, cam: K([0, [PLAZA.x + 6, 1.8, PLAZA.z + 4], [PLAZA.x, 2.6, PLAZA.z - 4], 30], [1, [PLAZA.x + 5, 1.8, PLAZA.z + 3], [PLAZA.x, 2.7, PLAZA.z - 4], 28]) });
// x19: forty days voting on the colour of a bridge
shot('x19', 'x19', {
  hours: TIME.afternoon, cloud: 0.4, year: 1933,
  cam: K([0, [-103, 1.8, -6], [-94, 1.6, 6], 32], [1, [-102.4, 1.75, -5.2], [-94, 1.6, 6], 30]),
  veg: { r0: 40 }, shadow: { x: -97, z: 2, r: 12 },
  setup(c) {
    const bx = -97, bz = 2;
    c.proto('bannerBlue', 0, bx - 2.4, bz + 1.5, 0.4, 0.8); c.proto('bannerYellow', 0, bx + 2.4, bz + 1.2, 0.4, 0.8);
    c.proto('bowl', 0, bx - 1.2, bz, 0, 0.45); c.proto('bowl', 0, bx + 1.2, bz, 0, 0.45);
    [[-2.6, -1.4, 'talk'], [-1.4, -2.4, 'point'], [2.2, -1.8, 'facepalm'], [3.0, -0.6, 'talk'], [0.2, -3.0, 'shrug'], [-3.4, 0.2, 'armsCrossed']].forEach(([dx, dz, pose], i) => { const x = bx + dx, z = bz + dz; const P = vill(c, i + 20, x, z, { yaw: yawTo(x, z, bx, bz) + (i % 2 ? 0.4 : -0.4), acc: i % 2 ? BLUE : [{ type: 'sash', color: 0xe0b23a }] }); P.anim = (Q, t) => Q.pose(pose, t * 1.3 + i, { phase: i }); });
  },
});
// x20: but it's theirs (golden-hour panorama from the hill)
shot('x20', 'x20', {
  hours: TIME.golden + 0.15, cloud: 0.4, year: 1940,
  cam: K([0, [HILL.x - 6, 26, HILL.z - 12], [-40, 0, -30], 40], [1, [HILL.x - 8, 25, HILL.z - 14], [-44, 0, -34], 40]),
  veg: { r0: 30, rImp: 220 },
});
// x21: Fire. Farms. Gods. Kings. Revolution. — it's our story, just faster; their god was real.
shot('x21a', 'x21', { ...SHOTS.f15 });
shot('x21b', 'x21', { ...SHOTS.a08a }, 0.46);
shot('x21c', 'x21', { ...SHOTS.o09 }, 0.98);
shot('x21d', 'x21', { ...SHOTS.c08 }, 1.44);
shot('x21e', 'x21', { ...SHOTS.x02a }, 1.96);
shot('x21f', 'x21', {
  hours: TIME.sunset - 0.05, cloud: 0.45, year: 1945,
  cam: K([0, [-260, 120, -200], [10, 0, 10], 40], [1, [-200, 100, -250], [10, 0, 10], 40]),
  veg: { r0: 0, rImp: 0, r1: 800, rFar: 2600 },
}, 2.76);
shot('x21g', 'x21', {   // their god was real (looking up at the sky from among them)
  hours: TIME.dusk + 0.05, cloud: 0.35, year: 1945, exposure: 1.1,
  cam: K([0, [PLAZA.x, 1.4, PLAZA.z], [PLAZA.x + 4, 30, PLAZA.z + 30], 44], [1, [PLAZA.x, 1.4, PLAZA.z], [PLAZA.x + 2, 40, PLAZA.z + 26], 42]),
  veg: { r0: 40 },
  setup(c) { [[1.5, 2.5], [-1.5, 3.2], [0.4, 4.4]].forEach(([dx, dz], i) => { const P = vill(c, i + 5, PLAZA.x + dx, PLAZA.z + dz, { yaw: Math.PI + (i - 1) * 0.4 }); P.anim = (Q, t) => Q.pose('lookUp', t + i); }); },
}, 5.6);
