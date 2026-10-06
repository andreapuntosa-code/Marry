// Cold open, the rules, the Horn and the bloodbath (segments h*, r*, b*)
import { S, SC, frame, toward, spot, wetSpot, shore, portrait, duo, establish, campfire, lineup, distantMob, hornScene, HORN_CLEAR, GREY, PACK, ids, THREE, dolly, who, K, orbitCam, height, yawTo, lerp, sm, rr, H, A, HG } from './hgkit.js';
const HX = HG.cx, HZ = HG.cz;
const HM = H.hornMouth(Math.PI, 6.5);         // the loot, in front of the Horn's mouth (it faces -z)
const named = { 3: 'REX', 6: 'VEX', 11: 'KAI', 17: 'LUNA', 23: 'TOBY', 29: 'DAX', 59: 'PIP' };   // pedestal -> named AI

// ================================================================== COLD OPEN
S('h01', 0, { biome: 'center', hours: 7.4, cam: [HX - 120, 520, HZ - 560], cam2: [HX - 20, 400, HZ - 330], tgt: [HX, 0, HZ + 40], tgt2: [HX, 0, HZ + 20], fov: 58, fov2: 52, clear: HORN_CLEAR, sr: 120,
  set: (c) => { hornScene(c); H.domeGlass(c, { k: 0.5 }); } });
S('h02', 0, { biome: 'lake', hours: 19.3, cam: [HX + 360, 2.5, HZ + 190], tgt: [HX + 120, 190, HZ - 120], tgt2: [HX + 30, 330, HZ - 160], fov: 62, sr: 60,
  set: (c) => { H.domeGlass(c, { k: 1.6 }); H.staticWall(c, H.zoneRadius(60), { k: 0.8 }); } });
S('h03', 0, { biome: 'center', hours: 17.6, cam: [HX - 8, 3.2, HZ - 62], cam2: [HX - 4, 4.8, HZ - 40], tgt: [HX, 9, HZ], fov: 48, clear: HORN_CLEAR, sr: 70,
  set: (c) => { hornScene(c, { loot: false }); H.staticWall(c, H.zoneRadius(99), { k: 1.0 }); H.dust(c, HX, HZ - 10, 18, { n: 90, h: 5, opacity: 0.22, color: 0xffd9a0 }); } });
S('h04', 0, { biome: 'center', hours: 17.7, cam: [HX + 3.2, 1.5, HZ - 52], cam2: [HX + 1.2, 1.6, HZ - 36], tgt: [HX, 1.9, HZ - 26], tgt2: [HX, 4, HZ - 6], fov: 40, clear: HORN_CLEAR, sr: 55,
  set: (c) => { hornScene(c, { loot: false }); who(c, 'X31', HX, HZ - 28, 'idle', { yaw: 0, p: { look: 0 } }); H.dust(c, HX, HZ - 20, 14, { n: 70, h: 4, opacity: 0.2, color: 0xffd9a0 }); } });
S('h05', 0, { biome: 'center', hours: 17.9, cam: [HX + 4.5, 1.4, HZ - 45], cam2: [HX + 2.2, 1.55, HZ - 38.5], tgt: [HX, 1.7, HZ - 26.5], fov: 30, fov2: 26, hero: true, clear: HORN_CLEAR, sr: 40, aperture: 1.3,
  set: (c) => { hornScene(c, { loot: false }); who(c, 'X31', HX, HZ - 28, 'idle', { yaw: 0, p: { look: 0 } }); H.dust(c, HX, HZ - 22, 12, { n: 60, h: 3, opacity: 0.18, color: 0xffd9a0 }); } });
S('h06', 0, { biome: 'center', hours: 7.6, cam: [HX - 30, 1.7, HZ - 16], tgt: [HX + 2, 3, HZ - 36], clear: HORN_CLEAR, sr: 70, fov: 52,
  set: (c) => { hornScene(c); lineup(c, [HX - 30, 1.7, HZ - 16], 16, { named }); } });
S('h06', 2.0, { biome: 'center', hours: 7.7, cam: [HX - 26, 1.6, HZ - 45], cam2: [HX - 30, 1.8, HZ - 22], tgt: [HX - 14, 1.6, HZ - 36], tgt2: [HX - 18, 1.7, HZ - 24], clear: HORN_CLEAR, sr: 70, fov: 50,
  set: (c) => { hornScene(c); lineup(c, [HX - 26, 1.6, HZ - 30], 18, { named }); } });
S('h07', 0, { biome: 'center', hours: 7.9, cam: [HX - 12, 1.45, HZ - 26], cam2: [HX - 12, 1.45, HZ - 34], tgt: [HX - 30, 1.55, HZ - 33], tgt2: [HX - 38, 1.55, HZ - 18], clear: HORN_CLEAR, sr: 55, fov: 38,
  set: (c) => { hornScene(c); lineup(c, [HX - 12, 1.45, HZ - 30], 26, { named }); } });
S('h07', 2.9, { biome: 'center', hours: 8.0, cam: [HX + 22, 1.5, HZ - 38], cam2: [HX + 30, 1.5, HZ - 30], tgt: [HX + 33, 1.5, HZ - 22], tgt2: [HX + 38, 1.5, HZ - 8], clear: HORN_CLEAR, sr: 55, fov: 38,
  set: (c) => { hornScene(c); lineup(c, [HX + 26, 1.5, HZ - 30], 26, { named }); } });
S('h08', 0, { biome: 'center', hours: 8.2, cam: [HX - 16, 2.2, HZ - 60], cam2: [HX - 60, 120, HZ - 190], tgt: [HX, 2, HZ - 36], tgt2: [HX, 0, HZ - 10], fov: 46, fov2: 60, clear: HORN_CLEAR, sr: 100,
  set: (c) => { hornScene(c); lineup(c, [HX - 16, 2.2, HZ - 60], 8, { named }); } });
S('h09', 0, { biome: 'center', hours: 8.4, cam: [HX - 3, 1.4, HZ - 38], cam2: [HX - 1, 2.6, HZ - 27], tgt: [HX, 5.4, HZ - 8], fov: 40, clear: HORN_CLEAR, sr: 50,
  set: (c) => { hornScene(c); } });
S('title', 0, { biome: 'center', hours: 17.4, cam: [HX - 38, 7, HZ - 70], cam2: [HX - 30, 6, HZ - 60], tgt: [HX, 11, HZ], fov: 46, clear: HORN_CLEAR, sr: 80, hero: true,
  set: (c) => { hornScene(c); H.dust(c, HX, HZ - 14, 22, { n: 120, h: 9, opacity: 0.2, color: 0xffd9a0 }); } });

// ================================================================== I. THE RULES
S('r01', 0, { biome: 'center', hours: 7.3, cam: [HX + 90, 330, HZ - 250], cam2: [HX + 50, 250, HZ - 170], tgt: [HX, 0, HZ + 20], fov: 56, clear: HORN_CLEAR, sr: 110,
  set: (c) => { hornScene(c); } });
S('r02', 0, { biome: 'meadow', hours: 18.6, cam: [HX - 60, 3, HZ + 120], cam2: [HX - 40, 3.5, HZ + 110], tgt: [HX + 160, 150, HZ - 60], tgt2: [HX + 120, 210, HZ - 120], fov: 66, sr: 60,
  set: (c) => { H.domeGlass(c, { k: 1.6 }); } });
S('r03', 0, { biome: 'center', hours: 10.6, cam: [HX + 40, 2.4, HZ - 46], cam2: [HX + 30, 4, HZ - 64], tgt: [HX + 2, 10, HZ + 2], fov: 50, clear: HORN_CLEAR, sr: 70,
  set: (c) => { hornScene(c); for (let i = 0; i < 4; i++) who(c, 'X' + (20 + i), HM[0] - 5 + i * 1.6, HM[1] - 4 + (i % 2) * 1.3, i % 2 ? 'lookUp' : 'idle', { yawTo: [HX, HZ], p: { amount: 0.9 }, phase: i }); } });
// five worlds, cut on the words
S('r04', 0, { biome: 'center', hours: 9.8, cam: [HX - 20, 90, HZ - 160], cam2: [HX - 10, 70, HZ - 120], tgt: [HX, 4, HZ], fov: 52, clear: HORN_CLEAR, sr: 90, set: (c) => { hornScene(c); } });
const pf = spot('forest', 0), ps = wetSpot(0), pd = spot('desert', 0), pl = spot('lake', 0), pm = spot('mountain', 0);
S('r04@forest', 0, { biome: 'forest', hours: 9.2, cam: [pf[0] + 30, 22, pf[1] - 30], cam2: [pf[0] + 8, 14, pf[1] - 10], tgt: [pf[0] - 20, 8, pf[1] + 10], fov: 50, sr: 60 });
S('r04@swamp', 0, { biome: 'swamp', hours: 8.4, cam: [ps[0] - 18, 3.5, ps[1] - 26], cam2: [ps[0] - 10, 4, ps[1] - 14], tgt: [ps[0] + 14, 3, ps[1] + 10], fov: 52, sr: 55,
  set: (c) => { H.swampDress(c, ps[0], ps[1], 44, { trees: 16, reeds: 14, seed: 3 }); } });
S('r04@desert', 0, { biome: 'desert', hours: 12.4, cam: [pd[0] - 26, 7, pd[1] - 20], cam2: [pd[0] - 12, 8, pd[1] - 9], tgt: [pd[0] + 30, 4, pd[1] + 18], fov: 54, sr: 60 });
S('r04@lake', 0, { biome: 'lake', hours: 11.4, cam: [pl[0] + 20, 5, pl[1] - 30], cam2: [pl[0] + 6, 6, pl[1] - 20], tgt: [HG.cx - 55, 0, HG.cz + 300], fov: 54, sr: 60 });
S('r04@mountain', 0, { biome: 'mountain', hours: 10.2, cam: [pm[0] - 6, 6, pm[1] + 50], cam2: [pm[0], 14, pm[1] + 20], tgt: [pm[0], 70, pm[1] - 120], tgt2: [pm[0], 90, pm[1] - 130], fov: 54, sr: 60,
  set: (c) => { H.drift(c, { n: 1400, R: 36, fall: 1.0, wind: 1.3, size: 0.16 }); } });
S('r05', 0, { biome: 'center', hours: 8.4, cam: [HX - 20, 60, HZ - 112], cam2: [HX - 14, 40, HZ - 90], tgt: [HX, 0, HZ - 36], fov: 50, clear: HORN_CLEAR, sr: 90,
  set: (c) => { hornScene(c); lineup(c, [HX - 20, 60, HZ - 100], 10, { named }); } });
S('r05', 3.1, { biome: 'center', hours: 8.6, cam: [HX - 9, 1.5, HZ - 24], cam2: [HX - 5, 1.5, HZ - 24], tgt: [HX - 14, 1.6, HZ - 36], tgt2: [HX - 10, 1.6, HZ - 36], fov: 34, clear: HORN_CLEAR, sr: 40, hero: true,
  set: (c) => { hornScene(c); lineup(c, [HX - 9, 1.5, HZ - 30], 30, { named }); } });

// ---- r06: they can run, climb, swim, make fire, tie a rope
const pr = spot('meadow', 1), pc = spot('forest', 1), pw = spot('lake', 0), pk = spot('meadow', 2);
S('r06@run', 0, { biome: 'meadow', hours: 10.2, cam: [pr[0] - 2, 1.3, pr[1] - 6], cam2: [pr[0] + 12, 1.4, pr[1] - 5.5], tgt: [pr[0] + 2, 1.1, pr[1] - 1], tgt2: [pr[0] + 15, 1.1, pr[1] - 1], fov: 38, sr: 40, clear: [[pr[0] + 10, pr[1], 24]],
  set: (c) => { const P = c.person('X41', { x: pr[0], z: pr[1], yaw: Math.PI / 2 }); P.anim = (Q, t) => c.walkTo(Q, pr[0] - 4, pr[1], pr[0] + 30, pr[1], t, 0, 1.6, { run: true, endPose: 'sprint', phase: 1 }); } });
S('r06@climb', 0, { biome: 'forest', hours: 9.6, cam: [pc[0] - 7, 3, pc[1] - 7], cam2: [pc[0] - 5, 8, pc[1] - 6], tgt: [pc[0], 5, pc[1]], tgt2: [pc[0], 11, pc[1]], fov: 46, sr: 40, clear: [[pc[0], pc[1], 6]],
  set: (c) => { A.tallPine(c, pc[0], pc[1], 26); const P = c.person('X42', { x: pc[0], z: pc[1] - 0.95, yaw: 0, y: height(pc[0], pc[1]) + 0.2 }); P.anim = (Q, t) => { Q.pose('climb', t, { phase: 1 }); Q.root.position.y = height(pc[0], pc[1]) + 0.2 + t * 1.4; }; } });
const SH = shore(0);
S('r06@swim', 0, { biome: 'lake', hours: 11.2, cam: [SH.x + SH.out[0] * 7 + SH.out[1] * 4, 1.5, SH.z + SH.out[1] * 7 - SH.out[0] * 4], cam2: [SH.x + SH.out[0] * 6 + SH.out[1] * 1, 1.5, SH.z + SH.out[1] * 6 - SH.out[0] * 1], tgt: [SH.x - SH.out[0] * 0.5, 1.0, SH.z - SH.out[1] * 0.5], fov: 42, sr: 40, clear: [[SH.x, SH.z, 12]],
  set: (c) => { const x0 = SH.x - SH.out[0] * 0.2, z0 = SH.z - SH.out[1] * 0.2, P = c.person('X43', { x: x0, z: z0, yaw: 0 }), ty = [-SH.out[1], SH.out[0]];
    P.anim = (Q, t) => { Q.pose('walk', t, { speed: 0.5, amount: 0.7, phase: 2 }); Q.place(x0 + ty[0] * t * 0.7, height(x0, z0), z0 + ty[1] * t * 0.7, Math.atan2(ty[0], ty[1])); }; } });
S('r06@make', 0, { biome: 'center', hours: 16.8, cam: [pk[0] - 3, 1.2, pk[1] - 4], cam2: [pk[0] - 2, 1.4, pk[1] - 3], tgt: [pk[0], 0.8, pk[1]], fov: 42, sr: 30,
  set: (c) => { campfire(c, pk[0], pk[1], { li: 10 }); who(c, 'X44', pk[0] + 1.6, pk[1] + 0.2, 'tend', { yawTo: [pk[0], pk[1]] }); } });
S('r06@tie', 0, { biome: 'center', hours: 11.0, cam: [pk[0] + 18, 1.5, pk[1] - 6], cam2: [pk[0] + 15, 1.6, pk[1] - 5], tgt: [pk[0] + 20, 1.0, pk[1]], fov: 42, sr: 30,
  set: (c) => { who(c, 'X45', pk[0] + 20, pk[1], 'build', { yawTo: [pk[0] + 18, pk[1] - 6] }); who(c, 'X46', pk[0] + 21.4, pk[1] + 0.6, 'hold', { yawTo: [pk[0] + 20, pk[1]] }); } });
// ---- r07: nobody taught them to fight
const pf2 = spot('meadow', 3);
S('r07', 0, { biome: 'meadow', hours: 10.8, cam: [pf2[0] - 8, 1.7, pf2[1] - 7], cam2: [pf2[0] - 6, 1.7, pf2[1] - 5.5], tgt: [pf2[0], 1.2, pf2[1]], fov: 42, sr: 35,
  set: (c) => { who(c, 'X47', pf2[0] - 1.2, pf2[1], 'swing', { yawTo: [pf2[0] + 1.2, pf2[1]], acc: ['club'], phase: 1 }); who(c, 'X48', pf2[0] + 1.4, pf2[1], 'duck', { yawTo: [pf2[0] - 1.2, pf2[1]] }); } });
S('r07', 2.6, { biome: 'meadow', hours: 10.9, cam: [pf2[0] + 6, 1.6, pf2[1] - 6], tgt: [pf2[0], 1.2, pf2[1]], fov: 40, sr: 35,
  set: (c) => { who(c, 'X47', pf2[0] - 1.2, pf2[1], 'shrug', { yawTo: [pf2[0] + 1.2, pf2[1]], acc: ['club'] }); who(c, 'X48', pf2[0] + 1.4, pf2[1], 'scratchHead', { yawTo: [pf2[0] - 1.2, pf2[1]] }); } });
// ---- r08: rule one
S('r08', 0, { biome: 'center', hours: 17.5, cam: [HX - 6, 1.2, HZ - 40], cam2: [HX - 4, 2.2, HZ - 38], tgt: [HX, 2.4, HZ - 24], fov: 38, clear: HORN_CLEAR, sr: 50, hero: true,
  set: (c) => { hornScene(c, { loot: false }); who(c, 'X31', HX, HZ - 25, 'praise', { yaw: 0, y: height(HX, HZ - 25) + 1.1 }); H.dust(c, HX, HZ - 24, 14, { n: 60, h: 4, opacity: 0.18, color: 0xffd9a0 }); } });
// ---- r09: one star goes dark, a bell rings
S('r09', 0, { biome: 'center', hours: 22.6, cam: [HX - 4, 1.6, HZ - 40], cam2: [HX - 3, 2.0, HZ - 38], tgt: [HX + 2, 75, HZ + 30], tgt2: [HX + 6, 60, HZ + 24], fov: 62, clear: HORN_CLEAR, sr: 50,
  set: (c) => { hornScene(c, { loot: false }); H.skyStars(c, { alive: 100, kill: [{ i: 99, t0: 3.3 }], size: 11 }); } });
S('r09', 5.4, { biome: 'center', hours: 22.6, cam: [HX + 30, 1.6, HZ - 20], tgt: [HX, 8, HZ], fov: 44, clear: HORN_CLEAR, sr: 50,
  set: (c) => { hornScene(c, { loot: false }); H.skyStars(c, { alive: 99, size: 11 }); } });
// ---- r10: the dome closes
S('r10', 0, { biome: 'center', hours: 16.4, cam: [HX - 300, 190, HZ - 420], cam2: [HX - 190, 150, HZ - 330], tgt: [HX, 20, HZ], fov: 56, clear: HORN_CLEAR, sr: 130,
  set: (c) => { hornScene(c); H.staticWall(c, (t) => 520 - 60 * Math.min(1, t / 6)); } });
S('r10@Outside', 0, { biome: 'meadow', hours: 16.6, cam: [HX + 230, 3.2, HZ - 330], cam2: [HX + 220, 4, HZ - 322], tgt: [HX + 340, 30, HZ - 250], fov: 52, sr: 60,
  set: (c) => { H.staticWall(c, 462, { k: 1.1 }); } });
S('r10@Stand', 0, { biome: 'meadow', hours: 16.9, cam: [HX + 330, 2.0, HZ - 150], cam2: [HX + 336, 2.2, HZ - 143], tgt: [HX + 346, 1.7, HZ - 175], fov: 40, sr: 40, hero: true, clear: [[HX + 346, HZ - 175, 14], [HX + 330, HZ - 150, 8]],
  set: (c) => { const R = 462, a = -0.62, wx = HX + Math.cos(a) * R, wz = HZ + Math.sin(a) * R; H.staticWall(c, R, { k: 1.2 });
    const P = who(c, 'X49', wx - Math.cos(a) * 3.5, wz - Math.sin(a) * 3.5, 'idle', { yawTo: [wx, wz] }); P.anim = (Q, t) => { Q.pose(t < 1.5 ? 'idle' : 'stagger', t, {}); Q.setEnergy(Math.max(0, 1 - Math.max(0, t - 1.0) / 2.6)); }; } });
// ---- r11: no bigger than the Horn
S('r11', 0, { biome: 'center', hours: 12.5, cam: [HX, 190, HZ + 6], cam2: [HX, 70, HZ + 4], tgt: [HX, 0, HZ], fov: 50, clear: HORN_CLEAR, sr: 60, top: true,
  set: (c) => { hornScene(c, { loot: false }); H.staticWall(c, 14.5, { k: 1.2 }); } });
// ---- r12/r13: the Gamemaker's hand
S('r12', 0, { biome: 'center', hours: 18.2, cam: [HX - 90, 260, HZ - 330], cam2: [HX - 40, 240, HZ - 280], tgt: [HX, 0, HZ], fov: 52, clear: HORN_CLEAR, sr: 110,
  set: (c) => { hornScene(c); H.domeGlass(c, { k: 0.9 }); } });
S('r13', 0, { biome: 'center', hours: 15.4, storm: 0.85, cam: [HX - 46, 2.2, HZ - 78], cam2: [HX - 38, 3.0, HZ - 66], tgt: [HX, 12, HZ], fov: 50, clear: HORN_CLEAR, sr: 70, cloud: 0.95, grade: 'storm',
  set: (c) => { hornScene(c, { loot: false }); c.rain(3500, 60, 0.4); c.bolt([HX + 30, 150, HZ + 30], [HX + 22, 0, HZ + 14], 1.3, 3); } });
S('r13@walls', 0, { biome: 'meadow', hours: 16.2, storm: 0.5, cam: [HX + 160, 3.5, HZ - 410], cam2: [HX + 170, 4.4, HZ - 402], tgt: [HX + 290, 40, HZ - 330], fov: 50, sr: 60, grade: 'storm',
  set: (c) => { H.staticWall(c, 520, { k: 1.2 }); } });
S('r13@never', 0, { biome: 'center', hours: 15.8, storm: 0.7, cam: [HX + 40, 1.3, HZ - 60], tgt: [HX + 44, 1.6, HZ - 44], fov: 40, clear: HORN_CLEAR, sr: 40, grade: 'storm', hero: true,
  set: (c) => { hornScene(c, { loot: false }); c.rain(2500, 40, 0.35); who(c, 'X31', HX + 44, HZ - 44, 'lookUp', { yawTo: [HX + 40, HZ - 60], p: { amount: 0.8 } }); } });
// ---- r14: a little too much weather
S('r14', 0, { biome: 'meadow', hours: 14.8, storm: 0.9, cam: [pf2[0] - 10, 2.0, pf2[1] - 12], cam2: [pf2[0] - 8, 2.2, pf2[1] - 10], tgt: [pf2[0], 2.0, pf2[1]], fov: 44, sr: 40, grade: 'storm', cloud: 0.95,
  set: (c) => { c.rain(2500, 40, 0.35); const P = who(c, 'X50', pf2[0], pf2[1], 'lookUp', { yawTo: [pf2[0] - 10, pf2[1] - 12] }); P.anim = (Q, t) => Q.pose(t < 2.6 ? 'lookUp' : 'shrug', t, {}); c.bolt([pf2[0] + 12, 140, pf2[1] + 6], [pf2[0] + 9, 0, pf2[1] + 3], 2.4, 5); c.flashAt(2.4, 4, 6); } });
// ---- r15: day zero
S('r15', 0, { biome: 'center', hours: 6.4, cam: [HX - 200, 160, HZ - 250], cam2: [HX - 60, 70, HZ - 120], tgt: [HX, 0, HZ - 10], fov: 50, clear: HORN_CLEAR, sr: 100,
  set: (c) => { hornScene(c); lineup(c, [HX - 80, 70, HZ - 150], 6, { named }); } });
S('r15', 3.2, { biome: 'center', hours: 6.5, cam: [HX - 19, 1.5, HZ - 31], cam2: [HX - 15, 1.5, HZ - 31.5], tgt: [HX - 9, 1.6, HZ - 36], tgt2: [HX - 4, 1.6, HZ - 39], fov: 36, clear: HORN_CLEAR, sr: 40,
  set: (c) => { hornScene(c); lineup(c, [HX - 17, 1.5, HZ - 31], 30, { named }); } });
S('r15', 5.8, { biome: 'center', hours: 6.6, cam: [HX - 12, 2.0, HZ - 40], cam2: [HX - 12, 3.2, HZ - 42], tgt: [HX - 8, 2.8, HZ - 66], fov: 40, clear: HORN_CLEAR, sr: 60,
  set: (c) => { hornScene(c); H.gong(c, HX - 8, HZ - 66, 0, 99); lineup(c, [HX - 12, 2.0, HZ - 40], 24, { named }); } });

// ================================================================== II. THE HORN  (day 0)
const RING = (i) => { const a1 = i < 60; const a = a1 ? (i / 60) * Math.PI * 2 : ((i - 60 + 0.5) / 40) * Math.PI * 2, R = a1 ? 39 : 49; const x = HX + Math.cos(a) * R, z = HZ + Math.sin(a) * R; return { x, z, y: height(x, z) + 0.5, yaw: Math.atan2(HX - x, HZ - z), a }; };
const inward = (i, d, h) => { const p = RING(i); return [p.x + Math.sin(p.yaw) * d, h, p.z + Math.cos(p.yaw) * d]; };
const mouth = (dx = 0, dz = 0) => [HM[0] + dx, HM[1] + dz];
S('b01', 0, { biome: 'center', hours: 7.1, cam: [HX - 52, 1.9, HZ - 24], cam2: [HX - 50, 1.9, HZ - 22], tgt: [HX - 30, 2.0, HZ - 32], tgt2: [HX - 12, 1.8, HZ - 24], fov: 40, clear: HORN_CLEAR, sr: 70,
  set: (c) => { hornScene(c); lineup(c, [HX - 52, 1.9, HZ - 24], 22, { named }); } });
S('b02', 0, { biome: 'center', hours: 7.3, cam: [HM[0] - 6, 1.5, HM[1] - 15], cam2: [HM[0] - 2, 1.5, HM[1] - 7.5], tgt: [HX, 3.8, HZ - 4], fov: 44, clear: HORN_CLEAR, sr: 50, hero: true,
  set: (c) => { hornScene(c, { lootN: 34 }); } });
// b03: faces on the pedestals
const faceShot = (anchor, off, i, side = 0) => { const p = RING(i); const cam = inward(i, 4.8, 1.0 + p.y - height(p.x, p.z)); return S(anchor, off, { biome: 'center', hours: 7.4, cam: [cam[0] + side, cam[1], cam[2]], cam2: [cam[0] + side * 0.4, cam[1], cam[2] - 0.5 * Math.cos(p.yaw)], tgt: [p.x, p.y - height(p.x, p.z) + 1.25, p.z], fov: 32, clear: HORN_CLEAR, sr: 40,
  set: (c) => { hornScene(c); lineup(c, [cam[0], cam[1], cam[2]], 12, { named }); } }); };
faceShot('b03', 0, 3, 0.4); faceShot('b03', 1.7, 29, -0.4); faceShot('b03', 3.3, 11, 0.3); faceShot('b03', 4.9, 59, 0.0);
S('b04', 0, { biome: 'center', hours: 7.5, cam: [HX - 4, 3.2, HZ - 14], cam2: [HX + 5, 3.4, HZ - 12], tgt: [HX - 20, 1.8, HZ + 38], tgt2: [HX + 30, 1.8, HZ + 30], fov: 66, clear: HORN_CLEAR, sr: 60,
  set: (c) => { hornScene(c); lineup(c, [HX, 3.2, HZ - 13], 30, { named }); } });
S('b05', 0, { biome: 'center', hours: 7.6, cam: [HX - 3, 2.6, HZ - 56], cam2: [HX - 2.4, 2.8, HZ - 58], tgt: [HX - 8, 3.2, HZ - 66], fov: 36, clear: HORN_CLEAR, sr: 40, shake: (t) => 0.5 * Math.exp(-Math.max(0, t - 0.1) * 4) * (t > 0.1 ? 1 : 0),
  set: (c) => { hornScene(c); H.gong(c, HX - 8, HZ - 66, 0, 0.1); } });
// b06: sixty run to the Horn, forty run away
S('b06', 0, { biome: 'center', hours: 7.8, cam: [HX - 30, 12, HZ - 98], cam2: [HX - 14, 6, HZ - 64], tgt: [HX, 0, HZ - 12], fov: 54, clear: HORN_CLEAR, sr: 100,
  set: (c) => { hornScene(c); const r = rr(13), lst = [];
    for (let i = 0; i < 100; i++) { const p = RING(i), out = i >= 60; const b = out ? [HX + Math.cos(p.a) * 170, HZ + Math.sin(p.a) * 170] : mouth((r() - 0.5) * 14, -2 + r() * 9);
      const d = Math.hypot(b[0] - p.x, b[1] - p.z), t0 = 0.15 + r() * 0.7; lst.push({ a: [p.x, p.z], b, t0, t1: t0 + d / (8 + r() * 2) }); }
    H.sprinters(c, lst, { seed: 9 }); H.dust(c, HX, HZ - 20, 30, { n: 160, h: 3, opacity: 0.3 }); } });
// b07/b08/b09: Rex
S('b07', 0, { biome: 'center', hours: 7.9, cam: [HM[0] - 2, 1.0, HM[1] - 42], cam2: [HM[0] - 1, 1.1, HM[1] - 50], tgt: [HM[0] - 3, 1.5, HM[1] - 14], tgt2: [HM[0] - 4, 1.5, HM[1] - 32], fov: 38, clear: HORN_CLEAR, sr: 60, hero: true,
  set: (c) => { hornScene(c); const P = c.person('REX', { x: HM[0] - 3, z: HM[1] - 4, yaw: Math.PI }); P.anim = (Q, t) => c.walkTo(Q, HM[0] - 3, HM[1] - 4, HM[0] - 4, HM[1] - 36, t, 0.3, 4.8, { run: true, endPose: 'hips', phase: 0.5 }); H.dust(c, HM[0] - 3, HM[1] - 14, 10, { n: 80, h: 2, opacity: 0.3 }); } });
portrait('b08', 0, 'REX', { biome: 'center', at: mouth(-6, -13), pose: 'hips', hours: 8.0, r: 6, h: 1.2, a0: 4.35, a1: 5.1, fov: 36, th: 1.5, hero: true, clear: HORN_CLEAR });
portrait('b09', 0, 'REX', { biome: 'center', at: mouth(-6, -13), pose: 'speak', hours: 8.0, r: 3.6, h: 1.5, a0: 4.55, a1: 4.9, fov: 30, th: 1.65, clear: HORN_CLEAR });
// b10-b12: the Pack
portrait('b10', 0, 'VEX', { biome: 'center', at: mouth(6, -12), pose: 'drawBow', hours: 8.1, r: 6, h: 1.3, a0: 4.0, a1: 4.9, fov: 38, th: 1.4, clear: HORN_CLEAR });
portrait('b11', 0, 'JUNE', { biome: 'center', at: mouth(-9, -11), pose: 'hips', hours: 8.1, r: 4.6, h: 1.3, a0: 4.2, a1: 4.8, fov: 34, th: 1.35, clear: HORN_CLEAR });
portrait('b12', 0, 'FINN', { biome: 'center', at: mouth(10, -9), pose: 'shrug', hours: 8.2, r: 4.6, h: 1.3, a0: 4.7, a1: 5.3, fov: 34, th: 1.3, clear: HORN_CLEAR });
S('b13', 0, { biome: 'center', hours: 8.3, cam: [HM[0] - 3, 1.0, HM[1] - 20], cam2: [HM[0] + 3, 1.2, HM[1] - 17], tgt: [HM[0], 1.7, HM[1] - 4], fov: 46, clear: HORN_CLEAR, sr: 50,
  set: (c) => { hornScene(c); const fr = frame(HM[0], HM[1] - 7, Math.PI);
    [['REX', -2.4, 0], ['VEX', -0.8, 1.2], ['JUNE', 0.8, 1.2], ['FINN', 2.4, 0]].forEach(([n, x, z], i) => { const q = fr.p(x, z); who(c, n, q[0], q[1], i === 0 ? 'hips' : i === 1 ? 'armsCrossed' : 'idle', { yaw: Math.PI, phase: i }); });
    for (let i = 0; i < 8; i++) { const q = fr.p(-5.5 + i * 1.6, 3.6 + (i % 2) * 1.2); who(c, 'X' + (1 + i), q[0], q[1], i % 3 ? 'idle' : 'guard', { yaw: Math.PI, phase: i * 0.9 }); } } });
// the first to fall
const bt = spot('meadow', 4), bf = frame(bt[0], bt[1], 0.8);
S('b13b', 0, { biome: 'meadow', hours: 8.5, cam: bf.c3(-8, 1.3, -3), cam2: bf.c3(-7, 1.3, 1), tgt: bf.c3(2, 1.0, 12), tgt2: bf.c3(3, 0.8, 16), fov: 40, sr: 45, clear: [[bt[0], bt[1], 16]],
  set: (c) => { const bot = bf.p(3, 16); c.mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.3, 10), new THREE.MeshStandardMaterial({ color: 0x4aa8ff, roughness: 0.2, metalness: 0.2 }), bot[0], height(bot[0], bot[1]) + 0.1, bot[1]).rotation.z = Math.PI / 2;
    const a = bf.p(3, -12), b = bf.p(3, 14.4), P = c.person('X19', { x: a[0], z: a[1], yaw: bf.yaw, id: '019' });
    P.anim = (Q, t) => { if (t < 3.2) { c.walkTo(Q, a[0], a[1], b[0], b[1], t, 0.2, 3.2, { run: true, phase: 1 }); } else { Q.pose('fallDown', t - 3.2, {}); Q.setEnergy(Math.max(0, 1 - (t - 3.8) / 2.4)); } }; } });
S('b13c', 0, { biome: 'meadow', hours: 8.6, cam: bf.c3(1.2, 0.35, 11.5), cam2: bf.c3(1.8, 0.4, 11.0), tgt: bf.c3(3, 0.15, 16), fov: 34, sr: 35, hero: true, clear: [[bt[0], bt[1], 16]], aperture: 1.6,
  set: (c) => { const bot = bf.p(3, 16); c.mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.3, 10), new THREE.MeshStandardMaterial({ color: 0x4aa8ff, roughness: 0.2, metalness: 0.2 }), bot[0], height(bot[0], bot[1]) + 0.1, bot[1]).rotation.z = Math.PI / 2;
    const q = bf.p(1.2, 19); const P = c.person('X19', { x: q[0], z: q[1], yaw: bf.yaw + 2.6, id: '019' }); P.anim = (Q) => { Q.pose('fallDown', 9, {}); Q.setEnergy(0); }; } });
// Pip runs the other way
const pp = spot('meadow', 5), pf3 = frame(pp[0], pp[1], 2.2);
S('b14', 0, { biome: 'meadow', hours: 8.9, cam: pf3.c3(-12, 1.1, -9), cam2: pf3.c3(14, 1.1, -9), tgt: pf3.c3(-6, 0.8, 0), tgt2: pf3.c3(20, 0.8, 0), fov: 40, sr: 50, clear: [[pp[0], pp[1], 30]],
  set: (c) => { const a = pf3.p(-10, 0), b = pf3.p(24, 0); const P = c.person('PIP', { x: a[0], z: a[1], yaw: pf3.yaw - 1.57 }); P.anim = (Q, t) => c.walkTo(Q, a[0], a[1], b[0], b[1], t, 0.0, 4.4, { run: true, endPose: 'sprint', phase: 0.3, speed: 1.15 }); } });
portrait('b15', 0, 'PIP', { biome: 'meadow', k: 5, pose: 'idle', hours: 9.0, r: 4.0, h: 1.05, a0: 0.2, a1: 0.9, fov: 34, th: 1.1, hero: true });
S('b16', 0, { biome: 'meadow', hours: 9.1, cam: pf3.c3(-2.5, 0.55, -4.5), cam2: pf3.c3(-1.2, 0.6, -3.5), tgt: pf3.c3(0, 0.55, 0), fov: 36, sr: 35, clear: [[pp[0], pp[1], 5]], veg: { grassR: 18, grassStep: 0.28 },
  set: (c) => { who(c, 'PIP', pp[0], pp[1], 'crouch', { yaw: pf3.yaw + 2.6 }); const fr = pf3.p(0, 40); H.sprinters(c, [...Array(24)].map((_, i) => ({ a: pf3.p(-18 + i * 1.6, 44 + (i % 3) * 3), b: pf3.p(-14 + i * 1.6, 8 + (i % 4) * 2), t0: 0.2 + (i % 5) * 0.1, t1: 4.4 })), { seed: 12 }); } });
portrait('b17', 0, 'PIP', { biome: 'meadow', k: 5, pose: 'lookAround', hours: 9.2, r: 2.6, h: 1.1, a0: 0.55, a1: 0.7, fov: 26, th: 1.15, hero: true, aperture: 1.4 });
// b18/b19: the Horn turns into dust and noise (seen from a distance, through the dust)
const melee = (c, cx, cz, n = 7, seed = 3) => { const r = rr(seed); for (let i = 0; i < n; i++) { const a = r() * 6.28, d = 2 + r() * 9, x = cx + Math.cos(a) * d, z = cz + Math.sin(a) * d; const pa = ['swing', 'stab', 'parry', 'guard', 'tumble'][i % 5];
  who(c, 'X' + (60 + i), x, z, pa, { yawTo: [x + Math.cos(a + 2.8) * 2, z + Math.sin(a + 2.8) * 2], phase: i * 0.7, acc: pa === 'swing' ? ['club'] : ['sword'] }); who(c, 'X' + (70 + i), x + Math.cos(a + 2.8) * 1.7, z + Math.sin(a + 2.8) * 1.7, ['guard', 'parry', 'duck', 'stab', 'swing'][i % 5], { yawTo: [x, z], phase: i * 0.4 + 1, acc: ['club'] }); } };
S('b18', 0, { biome: 'center', hours: 8.6, cam: [HX - 10, 2.0, HZ - 52], cam2: [HX - 4, 2.4, HZ - 44], tgt: [HX, 2, HZ - 18], tgt2: [HX + 2, 2.5, HZ - 14], fov: 46, clear: HORN_CLEAR, sr: 60,
  set: (c) => { hornScene(c); melee(c, HX - 3, HZ - 16, 7, 3); H.dust(c, HX - 3, HZ - 16, 22, { n: 320, h: 6, opacity: 0.55, size: 11, wind: 1.0 }); } });
S('b18', 3.2, { biome: 'center', hours: 8.7, cam: [HX + 30, 2.2, HZ - 30], cam2: [HX + 24, 2.6, HZ - 26], tgt: [HX + 4, 2, HZ - 12], fov: 44, clear: HORN_CLEAR, sr: 60,
  set: (c) => { hornScene(c); melee(c, HX + 4, HZ - 12, 6, 8); H.dust(c, HX + 3, HZ - 12, 20, { n: 300, h: 6, opacity: 0.55, size: 11, wind: 1.0 }); } });
S('b19', 0, { biome: 'center', hours: 8.8, cam: [HX - 12, 1.8, HZ - 40], cam2: [HX - 12, 2.0, HZ - 41], tgt: [HX - 2, 3, HZ - 16], tgt2: [HX + 40, 70, HZ - 70], fov: 44, clear: HORN_CLEAR, sr: 60,
  set: (c) => { hornScene(c); melee(c, HX - 3, HZ - 16, 5, 5); H.dust(c, HX - 3, HZ - 16, 20, { n: 240, h: 6, opacity: 0.5, size: 11, wind: 1.0 }); } });
// b20/b21/b22: the evening
S('b20', 0, { biome: 'center', hours: 19.4, cam: [HX - 6, 1.6, HZ - 44], cam2: [HX - 5, 1.8, HZ - 42], tgt: [HX + 3, 85, HZ + 20], tgt2: [HX + 8, 70, HZ + 16], fov: 66, clear: HORN_CLEAR, sr: 50,
  set: (c) => { hornScene(c, { loot: false }); H.skyStars(c, { alive: 100, size: 12, kill: [...Array(31)].map((_, k) => ({ i: 99 - k, t0: 0.5 + k * 0.095 })) }); } });
S('b21', 0, { biome: 'center', hours: 19.0, cam: [HX - 8, 0.9, HZ - 34], cam2: [HX - 6, 1.0, HZ - 28], tgt: [HX + 2, 0.9, HZ - 12], fov: 46, clear: HORN_CLEAR, sr: 50,
  set: (c) => { hornScene(c); const r = rr(21); for (let i = 0; i < 12; i++) { const a = r() * 6.28, d = 6 + r() * 20, x = HX + Math.cos(a) * d - 3, z = HZ - 12 + Math.sin(a) * d * 0.6; const P = c.person('X' + (50 + i), { x, z, yaw: r() * 6.28 }); P.anim = (Q) => { Q.pose('lie', 9, {}); Q.setEnergy(0); }; }
    for (let i = 0; i < 3; i++) { const q = [HX + 40 + i * 4, HZ - 30 - i * 3]; who(c, 'X' + (30 + i), q[0], q[1], 'limp', { yaw: 1.2, phase: i }); } } });
S('b22', 0, { biome: 'meadow', hours: 23.4, fog: 0.006, cam: pf3.c3(-3.5, 0.5, -5.5), cam2: pf3.c3(-2.0, 0.55, -4.0), tgt: pf3.c3(0, 0.7, 0), fov: 36, sr: 30, clear: [[pp[0], pp[1], 5]], grade: 'night', veg: { grassR: 16, grassStep: 0.3 },
  set: (c) => { who(c, 'PIP', pp[0], pp[1], 'crouch', { yaw: pf3.yaw + 2.6 }); who(c, 'X30', pp[0] + 3.2, pp[1] + 1.4, 'sleepCurl', { yaw: 1.0 }); campfire(c, pp[0] + 30, pp[1] + 20, { li: 6 }); } });
