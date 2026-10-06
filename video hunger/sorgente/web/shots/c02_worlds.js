// III. SIX WORLDS (days 2-19)
import { S, SC, frame, spot, wetSpot, shore, portrait, duo, establish, campfire, lineup, HORN_CLEAR, THREE, who, K, orbitCam, height, lerp, sm, rr, H, A, HG, arrowFly, berryBush, breadLoaf, wildfire } from './hgkit.js';
const HX = HG.cx, HZ = HG.cz;
const dirOut = (deg) => [Math.cos(deg * Math.PI / 180), Math.sin(deg * Math.PI / 180)];

// f01: the survivors scatter into the worlds
S('f01', 0, { biome: 'center', hours: 7.2, cam: [HX - 30, 70, HZ - 90], cam2: [HX - 10, 50, HZ - 60], tgt: [HX, 0, HZ - 10], fov: 56, clear: HORN_CLEAR, sr: 100,
  set: (c) => { H.horn(c, { yaw: Math.PI }); const r = rr(5), lst = []; for (let i = 0; i < 28; i++) { const d = dirOut(-90 + i * 12.9 + r() * 8), t0 = 0.2 + r() * 1.5; lst.push({ a: [HX + d[0] * 20, HZ + d[1] * 20], b: [HX + d[0] * 200, HZ + d[1] * 200], t0, t1: t0 + 9 }); } H.sprinters(c, lst, { seed: 4 }); } });
// f02/f03: Rook
const fo = spot('forest', 2), ffr = frame(fo[0], fo[1], 0.6);
S('f02', 0, { biome: 'forest', hours: 9.3, cam: ffr.c3(-9, 2.2, -12), cam2: ffr.c3(-5, 1.8, -8), tgt: ffr.c3(0, 3, 4), fov: 46, sr: 50, clear: [[fo[0], fo[1], 14]],
  set: (c) => { const q = ffr.p(0, 5); A.hollowOak(c, q[0], q[1], { s: 30, face: ffr.yaw + Math.PI }); const p = ffr.p(-2, -1); who(c, 'ROOK', p[0], p[1], 'sneak', { yawTo: q }); } });
portrait('f02', 3.4, 'ROOK', { biome: 'forest', at: fo, pose: 'crouch', hours: 9.4, r: 4.2, h: 1.2, a0: 0.4, a1: 1.0, fov: 34, th: 1.2, clear: [[fo[0], fo[1], 12]] });
const ro = spot('forest', 3), rfr = frame(ro[0], ro[1], 1.0);
S('f03', 0, { biome: 'forest', hours: 10.2, cam: rfr.c3(-5, 1.4, -6), cam2: rfr.c3(-3, 1.5, -5), tgt: rfr.c3(0, 1.2, 0), fov: 38, sr: 40, clear: [[ro[0], ro[1], 12]],
  set: (c) => { who(c, 'ROOK', ro[0], ro[1], 'build', { yawTo: rfr.p(2, 3), phase: 0.5 }); const q = rfr.p(2.4, 3); c.mesh(new THREE.BoxGeometry(0.2, 0.2, 2.2), new THREE.MeshStandardMaterial({ color: 0x7a5432 }), q[0], height(q[0], q[1]) + 0.3, q[1]); } });
S('f03', 3.6, { biome: 'forest', hours: 10.4, cam: rfr.c3(-6, 1.6, 2), cam2: rfr.c3(-3, 1.4, 5), tgt: rfr.c3(2, 0.2, 8), fov: 40, sr: 40, clear: [[ro[0], ro[1], 16]],
  set: (c) => { for (let i = 0; i < 3; i++) { const q = rfr.p(1 + i * 2.6, 7 + (i % 2) * 2); A.pitTrap(c, q[0], q[1], 0, 1.3); } const a = rfr.p(8, 4); const sl = A.swingLog(c, a[0], a[1], rfr.yaw, 0.0, 8); c.on((t) => sl.set(0.3 + 0.2 * Math.sin(t))); } });
S('f03', 7.2, { biome: 'forest', hours: 10.6, cam: rfr.c3(2, 1.8, -2), cam2: rfr.c3(4, 1.8, 0), tgt: rfr.c3(9, 2.4, 6), fov: 42, sr: 40, clear: [[ro[0], ro[1], 18]],
  set: (c) => { const a = rfr.p(9, 5); const sl = A.swingLog(c, a[0], a[1], rfr.yaw + 1.57, 0.0, 8); c.on((t) => sl.set(sm(0.6, 2.2, t))); const w = rfr.p(8.2, -1); who(c, 'X30', w[0], w[1], 'sneak', { yawTo: a }); } });
// f04/f05: Zara in the desert
const de = spot('desert', 1), dfr = frame(de[0], de[1], 0.4);
S('f04', 0, { biome: 'desert', hours: 12.8, cam: dfr.c3(-8, 1.6, -14), cam2: dfr.c3(6, 1.6, -9), tgt: dfr.c3(0, 1.2, 0), tgt2: dfr.c3(4, 1.2, 8), fov: 42, sr: 50, clear: [[de[0], de[1], 20]],
  set: (c) => { const a = dfr.p(-6, -6), b = dfr.p(8, 14); const P = c.person('ZARA', { x: a[0], z: a[1], yaw: dfr.yaw }); P.anim = (Q, t) => c.walkTo(Q, a[0], a[1], b[0], b[1], t, 0, 4.6, { movePose: 'limp', endPose: 'idle' }); } });
const spr = dfr.p(8, 14);
S('f04', 3.4, { biome: 'desert', hours: 12.9, cam: dfr.c3(3, 1.3, 7), cam2: dfr.c3(5, 1.0, 9.5), tgt: dfr.c3(8, 0.3, 14), fov: 40, sr: 40, clear: [[spr[0], spr[1], 8]],
  set: (c) => { const m = c.mesh(new THREE.CylinderGeometry(1.4, 1.4, 0.05, 20), new THREE.MeshStandardMaterial({ color: 0x3aa0d8, roughness: 0.1, metalness: 0.3 }), spr[0], height(spr[0], spr[1]) + 0.05, spr[1]); const P = who(c, 'ZARA', spr[0] - 1.6, spr[1] - 1.2, 'drink', { yawTo: [spr[0], spr[1]] }); } });
portrait('f05', 0, 'ZARA', { biome: 'desert', at: de, pose: 'idle', hours: 13.0, r: 3.6, h: 1.4, a0: 1.0, a1: 1.5, fov: 30, th: 1.45, clear: [[de[0], de[1], 12]] });
// f06: Aster on the frozen mountain
const mt = spot('mountain', 1, { slope: 0.5 }), mfr = frame(mt[0], mt[1], -1.57);
S('f06', 0, { biome: 'mountain', hours: 10.5, cam: mfr.c3(-6, 2.0, -9), cam2: mfr.c3(-3, 3.2, -5), tgt: mfr.c3(0, 2, 4), fov: 46, sr: 50, clear: [[mt[0], mt[1], 14]],
  set: (c) => { H.drift(c, { n: 1500, R: 30, fall: 1.1, wind: 1.4, size: 0.15 }); const a = mfr.p(0, -3), b = mfr.p(0, 12); const P = c.person('ASTER', { x: a[0], z: a[1], yaw: mfr.yaw }); P.anim = (Q, t) => c.walkTo(Q, a[0], a[1], b[0], b[1], t, 0, 3.2, { endPose: 'idle' }); } });
S('f06', 3.4, { biome: 'mountain', hours: 11.0, cam: mfr.c3(-1.5, 1.3, -4), cam2: mfr.c3(-0.8, 1.6, -3.4), tgt: mfr.c3(0, 12, 60), tgt2: mfr.c3(0, 5, 70), fov: 54, sr: 40, clear: [[mt[0], mt[1], 12]],
  set: (c) => { H.drift(c, { n: 1200, R: 30, fall: 1.0, wind: 1.2, size: 0.14 }); who(c, 'ASTER', mt[0], mt[1], 'watch', { yaw: mfr.yaw }); } });
// f07: Marlo at the lake
const sh1 = shore(1);
S('f07', 0, { biome: 'lake', hours: 11.0, cam: [sh1.x + sh1.out[0] * 8 + sh1.out[1] * 3, 1.4, sh1.z + sh1.out[1] * 8 - sh1.out[0] * 3], cam2: [sh1.x + sh1.out[0] * 6 + sh1.out[1] * 1, 1.3, sh1.z + sh1.out[1] * 6 - sh1.out[0] * 1], tgt: [sh1.x, 1.1, sh1.z], fov: 40, sr: 40, clear: [[sh1.x, sh1.z, 14]],
  set: (c) => { who(c, 'MARLO', sh1.x - sh1.out[0] * 0.2, sh1.z - sh1.out[1] * 0.2, 'fish', { yaw: Math.atan2(-sh1.out[0], -sh1.out[1]), phase: 1 }); } });
S('f07', 3.6, { biome: 'lake', hours: 11.1, cam: [sh1.x + sh1.out[0] * 7 - sh1.out[1] * 2, 1.2, sh1.z + sh1.out[1] * 7 + sh1.out[0] * 2], tgt: [sh1.x + sh1.out[0] * 2, 1.4, sh1.z + sh1.out[1] * 2], fov: 36, sr: 40, clear: [[sh1.x, sh1.z, 14]],
  set: (c) => { const p = [sh1.x + sh1.out[0] * 2, sh1.z + sh1.out[1] * 2]; who(c, 'MARLO', p[0], p[1], 'hips', { yaw: Math.atan2(sh1.out[0], sh1.out[1]) + 3.14 }); who(c, 'X31', p[0] + sh1.out[0] * 5, p[1] + sh1.out[1] * 5, 'shrug', { yawTo: p }); } });
// f08: Sage and the berries
const sw = wetSpot(2), sfr = frame(sw[0], sw[1], 0.9);
S('f08', 0, { biome: 'swamp', hours: 8.8, cam: sfr.c3(-4, 1.3, -5), cam2: sfr.c3(-2, 1.4, -3.5), tgt: sfr.c3(0, 1.0, 0), fov: 38, sr: 40, clear: [[sw[0], sw[1], 12]],
  set: (c) => { H.swampDress(c, sw[0], sw[1], 24, { trees: 6, reeds: 8, seed: 5 }); const b = sfr.p(1.6, 1.2); berryBush(c, b[0], b[1], 0xd22a3a, 30, 1.1); who(c, 'SAGE', sw[0], sw[1], 'forage', { yawTo: b }); } });
S('f08', 4.4, { biome: 'swamp', hours: 8.9, cam: sfr.c3(0.5, 0.9, -1.8), cam2: sfr.c3(0.9, 0.9, -1.2), tgt: sfr.c3(1.4, 0.8, 1.2), fov: 34, sr: 30, hero: true, clear: [[sw[0], sw[1], 10]],
  set: (c) => { const a = sfr.p(0.2, 1.4), b = sfr.p(2.8, 1.2); berryBush(c, a[0], a[1], 0xd22a3a, 26, 0.8); berryBush(c, b[0], b[1], 0x6a2a9a, 26, 0.8); } });
// f09-f13: Bolt
const me = spot('meadow', 6), mef = frame(me[0], me[1], 0.0);
S('f09', 0, { biome: 'meadow', hours: 16.4, cam: mef.c3(-12, 1.3, -10), cam2: mef.c3(12, 1.3, -10), tgt: mef.c3(-6, 1.0, 0), tgt2: mef.c3(22, 1.0, 0), fov: 40, sr: 50, clear: [[me[0], me[1], 40]],
  set: (c) => { const a = mef.p(-10, 0), b = mef.p(34, 0); const P = c.person('BOLT', { x: a[0], z: a[1], yaw: mef.yaw + 1.57 }); P.anim = (Q, t) => c.walkTo(Q, a[0], a[1], b[0], b[1], t, 0, 8, { run: true, phase: 1, speed: 1.1 }); } });
S('f10', 0, { biome: 'meadow', hours: 16.6, cam: mef.c3(-2, 1.1, -5), cam2: mef.c3(18, 1.2, -5), tgt: mef.c3(2, 1.0, 0), tgt2: mef.c3(22, 1.0, 0), fov: 32, sr: 50, clear: [[me[0], me[1], 40]],
  set: (c) => { const a = mef.p(0, 0), b = mef.p(30, 0); const P = c.person('BOLT', { x: a[0], z: a[1], yaw: mef.yaw + 1.57 }); P.anim = (Q, t) => c.walkTo(Q, a[0], a[1], b[0], b[1], t, 0, 4.1, { run: true, phase: 1, speed: 1.25 }); } });
S('f11', 0, { biome: 'meadow', hours: 16.8, cam: mef.c3(36, 1.2, 40), tgt: mef.c3(42, 1.8, 54), fov: 34, sr: 40, clear: [[mef.p(42, 54)[0], mef.p(42, 54)[1], 10]],
  set: (c) => { const p = mef.p(42, 54); who(c, 'VEX', p[0], p[1], 'drawBow', { yawTo: mef.p(0, 0), phase: 0 }); } });
S('f12', 0, { biome: 'meadow', hours: 17.0, cam: mef.c3(30, 1.4, 50), cam2: mef.c3(18, 1.4, 22), tgt: mef.c3(8, 1.2, 0), tgt2: mef.c3(8, 1.2, 0), fov: 34, sr: 40, clear: [[me[0], me[1], 50]],
  set: (c) => { const a = mef.p(40, 52), b = mef.p(8, 0); const A0 = [a[0], height(a[0], a[1]) + 1.5, a[1]], B0 = [b[0], height(b[0], b[1]) + 1.2, b[1]]; arrowFly(c, A0, B0, 0.2, 1.4, { arc: 3 }); who(c, 'VEX', a[0], a[1], 'shoot', { yawTo: b }); } });
S('f12@star', 0, { biome: 'center', hours: 19.2, cam: [HX - 4, 1.6, HZ - 40], tgt: [HX + 3, 80, HZ + 20], fov: 62, clear: HORN_CLEAR, sr: 50,
  set: (c) => { H.horn(c, { yaw: Math.PI }); H.skyStars(c, { alive: 100, kill: [{ i: 99, t0: 0.6 }], size: 12 }); } });
S('f13', 0, { biome: 'meadow', hours: 18.4, cam: mef.c3(-1, 0.5, 6), cam2: mef.c3(0, 0.6, 5), tgt: mef.c3(8, 0.4, 0), fov: 36, sr: 40, clear: [[me[0], me[1], 20]],
  set: (c) => { const b = mef.p(8, 0); const P = c.person('BOLT', { x: b[0], z: b[1], yaw: 1 }); P.anim = (Q) => { Q.pose('lie', 9, {}); Q.setEnergy(0.0); }; } });
// f13b-f13f: the dome closes for the first time
S('f13b', 0, { biome: 'meadow', hours: 16.5, cam: mef.c3(-40, 3.0, -20), cam2: mef.c3(-34, 3.4, -16), tgt: mef.c3(40, 60, 140), fov: 54, sr: 60, clear: [[me[0], me[1], 30]],
  set: (c) => { H.staticWall(c, (t) => 438 - 4 * t, { k: 1.1 }); } });
S('f13c', 0, { biome: 'center', hours: 16.2, cam: [HX - 260, 150, HZ - 330], cam2: [HX - 200, 120, HZ - 280], tgt: [HX, 10, HZ], fov: 56, clear: HORN_CLEAR, sr: 120,
  set: (c) => { H.horn(c, { yaw: Math.PI }); H.staticWall(c, (t) => 440 - 6 * t); } });
const ws = frame(HX + Math.cos(-0.5) * 410, HZ + Math.sin(-0.5) * 410, -0.5 + Math.PI);
S('f13d', 0, { biome: 'meadow', hours: 16.4, cam: ws.c3(-8, 1.6, 10), cam2: ws.c3(-6, 1.6, 8), tgt: ws.c3(0, 1.4, 3), fov: 40, sr: 40, clear: [[ws.x, ws.z, 20]],
  set: (c) => { H.staticWall(c, 428, { k: 1.0 }); for (let i = 0; i < 3; i++) { const p = ws.p(-2 + i * 2, 2 + (i % 2)); who(c, 'X' + (31 + i), p[0], p[1], ['talk', 'shrug', 'talk'][i], { yawTo: ws.p(0, 12), phase: i }); } const r = rr(3); H.sprinters(c, [...Array(8)].map((_, i) => ({ a: ws.p(-14 + i * 4, 9), b: ws.p(-14 + i * 4, 70), t0: 0.2 + i * 0.1, t1: 6 })), { seed: 7 }); } });
S('f13e', 0, { biome: 'meadow', hours: 16.5, cam: ws.c3(-5, 1.5, 6), cam2: ws.c3(-3, 1.5, 5), tgt: ws.c3(0, 1.4, 1.5), fov: 36, sr: 40, hero: true, clear: [[ws.x, ws.z, 20]],
  set: (c) => { H.staticWall(c, 430, { k: 1.2 }); for (let i = 0; i < 3; i++) { const p = ws.p(-1.6 + i * 1.6, 1.2); const P = who(c, 'X' + (34 + i), p[0], p[1], 'talk', { yawTo: ws.p(0, 10), phase: i }); const keep = P.anim; P.anim = (Q, t) => { keep(Q, t); Q.setEnergy(Math.max(0, 1 - sm(0.2 + i * 0.3, 2.4 + i * 0.3, t))); }; } } });
S('f13f', 0, { biome: 'center', hours: 19.4, cam: [HX - 6, 1.6, HZ - 44], tgt: [HX + 3, 82, HZ + 20], fov: 64, clear: HORN_CLEAR, sr: 50,
  set: (c) => { H.horn(c, { yaw: Math.PI }); H.skyStars(c, { alive: 58, kill: [...Array(8)].map((_, k) => ({ i: 57 - k, t0: 0.6 + k * 0.28 })), size: 12 }); } });
// f14-f18: Toby finds Pip
const lk = shore(3), lkd = Math.atan2(lk.out[0], lk.out[1]);
const lf = frame(lk.x + lk.out[0] * 4, lk.z + lk.out[1] * 4, lkd + Math.PI);
S('f14', 0, { biome: 'lake', hours: 15.4, cam: lf.c3(-6, 1.8, 14), cam2: lf.c3(-3, 1.6, 9), tgt: lf.c3(0, 1.3, 0), fov: 42, sr: 50, clear: [[lf.x, lf.z, 24]],
  set: (c) => { H.reeds(c, lf.p(3, 4)[0], lf.p(3, 4)[1], 120, 3.5, 3); const a = lf.p(-12, -8), b = lf.p(0, 3); const P = c.person('TOBY', { x: a[0], z: a[1], yaw: lf.yaw }); P.anim = (Q, t) => c.walkTo(Q, a[0], a[1], b[0], b[1], t, 0.2, 5.5, { endPose: 'lookAround', phase: 0.5 }); } });
S('f14', 5.2, { biome: 'lake', hours: 15.5, cam: lf.c3(1.5, 1.0, -2.2), cam2: lf.c3(1.0, 0.9, -1.6), tgt: lf.c3(3.2, 0.8, 3.5), fov: 36, sr: 40, hero: true, clear: [[lf.x, lf.z, 16]],
  set: (c) => { const q = lf.p(3.2, 3.5); H.reeds(c, q[0], q[1], 160, 2.2, 5); who(c, 'PIP', q[0], q[1], 'crouch', { yawTo: lf.p(0, -6) }); who(c, 'TOBY', lf.p(-1, -1)[0], lf.p(-1, -1)[1], 'lookAround', { yawTo: q }); } });
duo('f15', 0, { biome: 'meadow', at: [lf.x, lf.z], yaw: lf.yaw, a: 'TOBY', b: 'PIP', pa: 'reach', pb: 'crouch', gap: 2.0, hours: 15.7, cam: [0, 1.3, -5], cam2: [0.8, 1.1, -3.6], th: 0.9, fov: 34 });
duo('f15', 3.6, { biome: 'meadow', at: [lf.x, lf.z], yaw: lf.yaw, a: 'TOBY', b: 'PIP', pa: 'sitGround', pb: 'sitGround', gap: 1.6, hours: 15.9, cam: [-1.2, 1.0, -4.2], cam2: [-0.4, 1.0, -3.3], th: 0.7, fov: 34,
  set: (c, a, b, at, f) => { const q = f.p(0, 0); breadLoaf(c, q[0], height(q[0], q[1]) + 0.35, q[1]); } });
portrait('f16', 0, 'TOBY', { biome: 'meadow', at: [lf.x, lf.z], pose: 'sitGround', hours: 16.0, r: 3.2, h: 1.0, a0: 0.8, a1: 1.1, fov: 30, th: 0.95 });
portrait('f17', 0, 'PIP', { biome: 'meadow', at: [lf.x, lf.z], pose: 'sitGround', hours: 16.0, r: 2.2, h: 0.8, a0: 1.0, a1: 1.15, fov: 26, th: 0.75, hero: true });
portrait('f18', 0, 'TOBY', { biome: 'meadow', at: [lf.x, lf.z], pose: 'sitGround', hours: 16.1, r: 3.0, h: 1.0, a0: 1.25, a1: 1.4, fov: 28, th: 0.95 });
S('f19', 0, { biome: 'lake', hours: 18.0, cam: lf.c3(-20, 4, -20), cam2: lf.c3(-14, 3, -16), tgt: lf.c3(0, 1, 0), fov: 46, sr: 50, clear: [[lf.x, lf.z, 10]],
  set: (c) => { who(c, 'TOBY', lf.x, lf.z, 'sitGround', { yaw: 2.0 }); who(c, 'PIP', lf.p(1.2, 0.4)[0], lf.p(1.2, 0.4)[1], 'sitGround', { yaw: 2.2 }); } });
S('f20', 0, { biome: 'lake', hours: 18.6, cam: lf.c3(-4.5, 1.1, -5.5), cam2: lf.c3(-2.8, 1.0, -3.6), tgt: lf.c3(0.6, 0.9, 0), fov: 34, sr: 40, hero: true, clear: [[lf.x, lf.z, 10]],
  set: (c) => { const f = campfire(c, lf.x, lf.z, { li: 12 }); who(c, 'TOBY', lf.p(-1.5, 0.4)[0], lf.p(-1.5, 0.4)[1], 'sitGround', { yawTo: [lf.x, lf.z] }); who(c, 'PIP', lf.p(1.5, 0.2)[0], lf.p(1.5, 0.2)[1], 'sitGround', { yawTo: [lf.x, lf.z] }); } });
