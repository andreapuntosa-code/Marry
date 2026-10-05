// COLD OPEN + I. THE RULES
import { sh, envF, envP, envW, who, walker, ring, folk, mob, phalanx, horse, rider, gallop, stat, dolly, orb, path3, A, FP, PP, MAIN_F, MAIN_P, campfire, height, WX, THREE, rr, sm, yawTo, lerp, AU, VD, K } from './stage.js';
import { sCircle, sHollow, sForge, sArchers, sField, sMeal, sGather, wake } from './scenes.js';

const cityF = (c, o = {}) => { const city = A.rootholm(c, 5); A.godRays(c, 705, 330, { n: 14, r: 40, opacity: 0.4 }); A.motes(c, 705, 1, 330, { n: 220, r: 36, h: 22 });
  mob(c, 'F', o.n ?? 55, 705, 345, 6, 34, [705, 330], { seed: 3, walk: 0 }); folk(c, 'F', 10, 705, 345, 4, 20, null, { seed: 8, poses: ['carry', 'idle', 'chop', 'talk'] });
  city.plats.forEach((p, i) => { who(c, VD(i * 5 + 2), p.g.position.x + 1.6, p.g.position.z + 1.1, i % 2 ? 'idle' : 'talk', { y: p.g.position.y + 0.17, yaw: i }); });
  campfire(c, 712, 352, {}); return city; };
const cityP = (c, o = {}) => { A.goldmere(c, 5); A.dawnHall(c, ...PP.temple); A.corral(c, ...PP.corral);
  mob(c, 'P', o.n ?? 60, 1235, 365, 8, 42, [1235, 355], { seed: 4 }); folk(c, 'P', 10, 1235, 365, 6, 24, null, { seed: 9, poses: ['carry', 'talk', 'idle'] });
  for (let i = 0; i < 5; i++) horse(c, i + 1, 1295 + i * 3.4, 150 + (i % 2) * 5, 1.2 + i * 0.3, { graze: 0.6 }); A.motes(c, 1235, 1, 355, { n: 160, r: 60, h: 14, color: 0xffe9a8, wind: [1.2, 0.2] }); };
const wallScene = (c, day = 364, o = {}) => { const w = A.wall(c, { day, glow: o.glow ?? 0.0, ...(o.w || {}) }); return w; };

// ---------------- cold open (clean: no text)
sh('a01', 'h01', envF(16.2, { fog: 0.0007, veg: { rFar: 1500, grassR: 25 } }), { clear: [[705, 330, 56], [640, 262, 30]], shadow: { x: 705, z: 330, r: 90 },
  cam: path3([[0, [595, 40, 235], [705, 12, 335], 52], [1, [655, 15, 288], [705, 11, 335], 46]]), set: (c) => cityF(c) });
sh('a03', 'h02', envP(16.6, { fog: 0.0003, veg: { rFar: 2000, grassR: 60, grassStep: 1.1 } }), { shadow: { x: 1235, z: 350, r: 90 },
  cam: path3([[0, [1130, 36, 250], [1235, 4, 365], 50], [1, [1190, 16, 292], [1240, 4, 360], 44]]), set: (c) => cityP(c) });
sh('a04', 'h03', envW(16.8, { fog: 0.0004 }), { clear: [[935, 200, 38], [940, 235, 38], [925, 300, 70]], shadow: { x: 960, z: 300, r: 80 },
  cam: path3([[0, [935, 3, 190], [1000, 8, 300], 44], [1, [940, 22, 230], [1000, 18, 330], 44]]), set: (c) => { wallScene(c, 364, { glow: 0.25 }); A.motes(c, 960, 1, 300, { n: 200, r: 40, h: 12, color: 0xffd9a0 }); } });
sh('a06', 'h04', envW(18.4, { fog: 0.0004 }), { clear: [[WX - 14, 748, 40]], shadow: { x: WX - 10, z: 735, r: 50 },
  cam: path3([[0, [WX - 15, 11, 690], [WX - 4, 12, 722], 40], [1, [WX - 12, 12, 740], [WX - 4, 12.2, 749], 36]]), set: (c) => { const w = wallScene(c, 364, { glow: 0.6 }); } });
sh('a07', 'h05', envF(9.5, { fog: 0.0012 }), { clear: [[705, 330, 56]], shadow: { x: 705, z: 330, r: 60 },
  cam: path3([[0, [690, 8, 300], [706, 9.5, 330], 42], [1, [694, 9, 306], [706, 9.8, 330], 36]]), set: (c) => { sArchers(c, { perPlat: 2, aim: [WX, 330] }); A.godRays(c, 705, 325, { n: 12, r: 30 }); } });
sh('a08', 'h05', envP(11, {}), { shadow: { x: 1090, z: 320, r: 60 }, clear: [], off: 1.5,
  cam: dolly([1030, 1.6, 270], [1048, 1.6, 296], [1090, 1.6, 325], [1100, 1.6, 335], 40), set: (c) => { for (let i = 0; i < 7; i++) gallop(c, i % 2 ? 'DUNE' : AU(i * 3 + 1), i + 1, [1040 - i * 0.0 + (i % 3) * 6, 262 + i * 6], [1170, 330 + i * 6], { speed: 1.2 }); } });
sh('a09', 'h05', envP(17.4, {}), { off: 3.0, shadow: { x: PP.forge[0] + 4, z: PP.forge[1], r: 30 },
  cam: path3([[0, [PP.forge[0] + 1, 1.8, PP.forge[1] - 6], [PP.forge[0] + 5.5, 1.5, PP.forge[1] - 2.5], 36], [1, [PP.forge[0] + 3, 1.7, PP.forge[1] - 7.5], [PP.forge[0] + 5.5, 1.5, PP.forge[1] - 2.5], 30]]), set: (c) => { sForge(c, { helpers: 2 }); A.motes(c, PP.forge[0] + 4, 0.5, PP.forge[1], { n: 120, r: 6, h: 6, color: 0xff9a40, size: 0.09, wind: [0.2, 0] }); } });
sh('a10', 'h06', envF(10, {}), { off: 0, clear: [[722, 262, 14]], shadow: { x: 722, z: 262, r: 25 },
  cam: orb(722, 262, 11, 4.2, 0.2, 1.2, 40, 1.4), set: (c) => { sCircle(c, { n: 18, pose: (nm, i) => (i % 2 ? 'sit' : 'cheer') }); } });
sh('a11', 'h06', envF(7.2, { fog: 0.0016 }), { off: 1.4, clear: [[640, 420, 22], [672, 410, 14]], shadow: { x: 645, z: 425, r: 40 },
  cam: dolly([675, 2.5, 408], [668, 3.5, 418], [640, 5, 424], [641, 6, 424], 42), set: (c) => { sHollow(c, { glow: 1.0, n: 12, face: Math.PI * 0.5 }); A.godRays(c, 640, 420, { n: 8, r: 15 }); } });
sh('a12', 'h06', envP(22.5, {}), { off: 2.9, shadow: { x: 1225, z: 330, r: 30 },
  cam: dolly([1205, 1.6, 345], [1214, 1.7, 338], [1232, 1.8, 330], [1232, 1.8, 330], 38), set: (c) => { c.proto('granaryBig', 0, 1232, 330, 0.2, 1.25); for (let i = 0; i < 4; i++) walker(c, AU(i * 2 + 1), [1226 + i * 1.5, 340 + i], [1212 - i, 352 + i * 2], { pose: 'carry', t0: 0.3 + i * 0.3, t1: 3.2 }); walker(c, 'MARA', [1228, 335], [1214, 346], { pose: 'crouch', t0: 0.2, t1: 3.2 }); } });
sh('a13', 'h06', envP(6.2, {}), { off: 4.4, shadow: { x: PP.temple[0], z: PP.temple[1], r: 40 }, clear: [],
  cam: dolly([PP.temple[0] - 30, 2.2, PP.temple[1] - 3], [PP.temple[0] - 26, 2.4, PP.temple[1] - 2], [PP.temple[0], 8.5, PP.temple[1]], [PP.temple[0], 9.5, PP.temple[1]], 42), set: (c) => { A.dawnHall(c, ...PP.temple, { glow: 1.2 }); for (let i = 0; i < 16; i++) { const a = (i / 16 - 0.5) * 2.0; who(c, AU(i * 2 + 1), PP.temple[0] - 12 - Math.abs(i - 8) * 0.4, PP.temple[1] + (i - 8) * 1.8, 'praise', { yawTo: [PP.temple[0], PP.temple[1]], phase: i }); } who(c, 'LARK', PP.temple[0] - 7, PP.temple[1], 'praise', { yawTo: [PP.temple[0], PP.temple[1]] }); } });
sh('a14', 'h06', envP(21.2, {}), { off: 5.9, shadow: { x: 1150, z: 340, r: 25 }, clear: [],
  cam: dolly([1140, 1.5, 330], [1144, 1.6, 335], [1156, 1.7, 345], [1156, 1.7, 345], 36), set: (c) => { who(c, 'KESH', 1153, 343, 'armsCrossed', { yawTo: [1158, 348] }); who(c, 'MARA', 1158.5, 346, 'talk', { yawTo: [1152, 342] }); who(c, 'LARK', 1155, 350, 'idle', { yawTo: [1155, 344], p: { look: 0.5 } }); campfire(c, 1156, 345, { size: 0.5 }); } });
sh('a15', 'h07', envW(21.8, {}), { clear: [[WX - 16, 300, 30]], shadow: { x: WX - 12, z: 300, r: 30 },
  cam: dolly([WX - 24, 1.4, 304], [WX - 20, 1.6, 303], [WX - 8, 1.8, 300], [WX - 7, 1.8, 300], 40), set: (c) => { wallScene(c, 340, { glow: 0.3 }); who(c, 'THORN', WX - 10, 300, 'listen', { yaw: Math.PI / 2 }); } });
sh('a16', 'h07', envP(17.6, {}), { off: 2.7, shadow: { x: 1150, z: 300, r: 40 }, clear: [],
  cam: dolly([1128, 0.9, 290], [1134, 1.0, 296], [1150, 3.2, 300], [1150, 3.2, 300], 36), set: (c) => { const h = horse(c, 2, 1150, 300, -1.2, { graze: 0 }); rider(c, 'KESH', h, { pose: 'rideSeat', look: 0.4 }); } });
sh('a17', 'h08', envW(18.0, { fog: 0.0006 }), { shadow: { x: WX, z: 330, r: 60 }, clear: [],
  cam: path3([[0, [WX - 28, 5, 215], [WX, 5, 330], 50], [1, [WX - 30, 14, 200], [WX, 6, 335], 52]]), set: (c) => { wallScene(c, 364, { glow: 0.7 }); mob(c, 'F', 80, WX - 30, 330, 3, 22, [WX, 330], { seed: 2, sz: 3 }); mob(c, 'P', 80, WX + 30, 330, 3, 22, [WX, 330], { seed: 5, sz: 3 }); A.motes(c, WX, 1, 330, { n: 220, r: 50, h: 18 }); } });
sh('a18', 'h09', envW(23.5, { fog: 0.0003 }), { shadow: { x: WX, z: 330, r: 60 },
  cam: path3([[0, [WX - 60, 70, 110], [WX, 8, 400], 56], [1, [WX - 80, 140, -50], [WX, 8, 420], 60]]), set: (c) => { wallScene(c, 364, { glow: 0.6 }); } });
sh('a19', 'title', envW(23.2, { fog: 0.0003 }), { shadow: { x: WX, z: 330, r: 60 },
  cam: path3([[0, [WX + 20, 14, 640], [WX - 20, 14, 520], 50], [1, [WX + 15, 22, 560], [WX - 25, 12, 430], 50]]), set: (c) => { wallScene(c, 364, { glow: 0.8 }); A.motes(c, WX, 5, 560, { n: 160, r: 60, h: 20 }); } });

// ---------------- I. THE RULES
sh('a20', 'chap:r01', envW(6.0, { fog: 0.0012 }), { shadow: { x: WX, z: 300, r: 80 }, cloud: 0.5,
  cam: path3([[0, [WX - 120, 40, 40], [WX, 6, 320], 50], [1, [WX - 60, 20, 130], [WX, 8, 340], 46]]), set: (c) => { A.motes(c, WX, 2, 300, { n: 260, r: 80, h: 30, color: 0xfff0c8 }); } });
sh('a21', 'r01', envW(6.4, { fog: 0.001 }), { shadow: { x: WX, z: 300, r: 70 }, cloud: 0.5,
  cam: path3([[0, [WX - 70, 2.5, 280], [WX + 40, 3, 300], 44], [1, [WX - 20, 3, 292], [WX + 90, 4, 300], 44]]), set: (c) => { } });
sh('a22', 'r02', envW(8.0, { fog: 0.0006 }), { clear: [[WX - 60, 125, 40], [WX - 30, 200, 60]], shadow: { x: WX, z: 300, r: 90 },
  cam: path3([[0, [WX - 60, 6, 120], [WX, 10, 260], 46], [1, [WX - 70, 24, 140], [WX, 14, 330], 50]]), set: (c) => { const w = wallScene(c, 0, { glow: 0.0 }); c.on((t) => w.rise(t, 0.2, 300, 1.6)); A.motes(c, WX, 1, 300, { n: 160, r: 60, h: 14, color: 0xcfc0a0 }); } });
sh('a22b', 'r02', envW(9.0, { fog: 0.0005 }), { off: 3.2, shadow: { x: WX, z: 330, r: 90 }, clear: [[WX - 20, 300, 40]],
  cam: path3([[0, [WX - 14, 2, 295], [WX, 12, 300], 52], [1, [WX - 14, 2, 295], [WX, 24, 300], 52]]), set: (c) => { const w = wallScene(c, 0, {}); c.on((t) => w.rise(t, 0.1, 300, 1.2)); } });
sh('a23', 'r03', envF(8.5, { fog: 0.0015 }), { shadow: { x: 720, z: 280, r: 90 },
  cam: path3([[0, [640, 38, 180], [740, 6, 300], 50], [1, [700, 24, 230], [770, 6, 330], 48]]), set: (c) => { A.godRays(c, 730, 300, { n: 14, r: 50 }); A.motes(c, 730, 2, 300, { n: 200, r: 60, h: 24 }); } });
sh('a24', 'r03', envF(9.2, { fog: 0.0012 }), { off: 3.2, clear: [[760, 260, 24]], shadow: { x: 760, z: 262, r: 30 },
  cam: dolly([744, 1.3, 248], [748, 1.5, 252], [766, 1.3, 266], [766, 1.4, 266], 36), set: (c) => { for (let i = 0; i < 4; i++) { const d = c.animal('deer', i + 1, 762 + i * 3, 262 + (i % 2) * 4, 2.2 + i * 0.2, {}); c.on((t) => d.animate(t, { speed: 0, phase: i })); } A.godRays(c, 760, 262, { n: 8, r: 14 }); A.motes(c, 760, 0.5, 262, { n: 90, r: 14, h: 8 }); } });
sh('a25', 'r03', envF(17.6, { fog: 0.0016 }), { off: 6.4, clear: [[690, 215, 22]], shadow: { x: 690, z: 220, r: 30 },
  cam: dolly([670, 1.0, 205], [674, 1.2, 207], [690, 1.0, 222], [690, 1.1, 222], 38), set: (c) => { for (let i = 0; i < 3; i++) { const w = c.animal('wolf', i + 1, 690 + i * 2.5, 222 + i * 1.4, 2.4 + i * 0.1, {}); c.on((t) => w.animate(t, { speed: 0, phase: i, graze: 0 })); } } });
sh('a27', 'r04', envP(16.0, { fog: 0.00022 }), { shadow: { x: 1200, z: 280, r: 90 },
  cam: path3([[0, [1130, 1.2, 250], [1200, 1.8, 285], 40], [1, [1150, 1.2, 270], [1230, 1.8, 290], 40]]), set: (c) => { for (let i = 0; i < 9; i++) { const x0 = 1160 + (i % 3) * 8, z0 = 230 + i * 7; horse(c, 3 + i, x0, z0, 0.35, { speed: 1.0, phase: i, move: (t) => [x0 + 34 * t, z0 + 12 * t, 0.35] }); } } });
sh('a28', 'r04', envP(11.0, { fog: 0.0002 }), { off: 3.0, shadow: { x: 1200, z: 300, r: 80 },
  cam: path3([[0, [1100, 4, 240], [1250, 3, 330], 52], [1, [1130, 6, 270], [1280, 3, 340], 50]]), set: (c) => { A.motes(c, 1200, 1, 300, { n: 260, r: 70, h: 10, color: 0xfff2c0, wind: [1.6, 0.3] }); } });
sh('a30', 'r05', envF(10.5, { fog: 0.001 }), { off: 0.2, clear: [[FP.landing[0], FP.landing[1], 34]], shadow: { x: FP.landing[0], z: FP.landing[1], r: 40 },
  cam: path3([[0, [FP.landing[0] - 30, 5, FP.landing[1] - 28], [FP.landing[0], 1.5, FP.landing[1]], 44], [1, [FP.landing[0] - 24, 9, FP.landing[1] - 24], [FP.landing[0], 1.5, FP.landing[1]], 46]]), set: (c) => { sGather(c, 'F', FP.landing[0], FP.landing[1], { n: 100, r: 16, real: 12, face: [FP.landing[0] + 40, FP.landing[1]] }); } });
sh('a31', 'r05', envP(11.0, {}), { off: 1.9, shadow: { x: PP.landing[0], z: PP.landing[1], r: 40 },
  cam: path3([[0, [PP.landing[0] + 30, 5, PP.landing[1] - 28], [PP.landing[0], 1.5, PP.landing[1]], 44], [1, [PP.landing[0] + 24, 9, PP.landing[1] - 24], [PP.landing[0], 1.5, PP.landing[1]], 46]]), set: (c) => { sGather(c, 'P', PP.landing[0], PP.landing[1], { n: 100, r: 16, real: 12, face: [PP.landing[0] - 40, PP.landing[1]] }); } });

// the six basic skills (talk, count, fire, rope, axe, seed)
const sk = (id, off, env, c0, c1, set, at = [0, 0, 0]) => sh(id, 'r06', env, { clear: [[at[0], at[1], 12]], shadow: { x: at[0], z: at[1], r: 25 }, cam: dolly(c0[0], c0[1], c1[0], c1[1], 36), set }, off);
sk('a32', 0.0, envF(10, {}), [[840, 1.5, 270], [843, 1.5, 272]], [[850, 1.5, 281], [850, 1.5, 281]], (c) => { who(c, 'WREN', 849.4, 281, 'talk', { yawTo: [851, 281] }); who(c, 'FERN', 851.4, 281, 'talk', { yawTo: [849, 281], phase: 2 }); }, [850, 281]);
sk('a33', 1.45, envP(11, {}), [[1090, 1.2, 270], [1092, 1.2, 272]], [[1100, 1.3, 281], [1100, 1.3, 281]], (c) => { who(c, 'SOL', 1100, 281, 'point', { yawTo: [1104, 281] }); who(c, 'DUNE', 1103, 281, 'talk', { yawTo: [1100, 281], phase: 1 }); }, [1100, 281]);
sk('a34', 2.9, envF(17.4, {}), [[800, 1.1, 290], [802, 1.1, 291]], [[810, 0.5, 299], [810, 0.5, 299]], (c) => { who(c, 'BRAM', 810, 298.3, 'plant', { yawTo: [810, 300] }); c.fire(810, 300, { size: 0.45, n: 10, emberN: 6, light: true, lightIntensity: 5, lightDist: 9, seed: 6 }); }, [810, 300]);
sk('a35', 4.35, envP(14, {}), [[1130, 1.5, 300], [1132, 1.5, 301]], [[1140, 1.4, 311], [1140, 1.4, 311]], (c) => { who(c, 'ASH', 1140, 311, 'carry', { yawTo: [1144, 311] }); who(c, 'REED', 1142.4, 311.4, 'carry', { yawTo: [1139, 311], phase: 2 }); }, [1140, 311]);
sk('a36', 5.8, envF(11, {}), [[860, 1.5, 250], [862, 1.5, 252]], [[870, 1.6, 261], [870, 1.6, 261]], (c) => { who(c, 'OAK', 870, 261, 'chop', { yawTo: [872, 262] }); A.bigTree(c, 872.5, 262, 8, 0, 'oak0'); }, [870, 261]);
sk('a37', 7.25, envP(10, {}), [[1160, 1.0, 230], [1162, 1.0, 231]], [[1170, 0.8, 241], [1170, 0.8, 241]], (c) => { who(c, 'SOL', 1170, 241, 'plant', { yawTo: [1171, 242] }); A.wheatField(c, 1170, 246, 14, 8, 1, 0); }, [1170, 241]);
// what they were not taught
sh('a38', 'r07', envF(9.5, {}), { clear: [[722, 262, 14]], shadow: { x: 722, z: 262, r: 25 }, cam: dolly([722, 5, 247], [722, 4.5, 250], [722, 0.5, 262], [722, 0.5, 262], 40), set: (c) => { A.circleOfStumps(c, 722, 262, 14, 7); A.motes(c, 722, 0.5, 262, { n: 60, r: 8, h: 4 }); } });
sh('a39', 'r07', envF(7.0, { fog: 0.0016 }), { off: 2.3, clear: [[640, 420, 20], [672, 410, 14]], shadow: { x: 645, z: 425, r: 40 }, cam: dolly([675, 2.5, 408], [668, 3.2, 414], [640, 5, 424], [641, 5.5, 424], 42), set: (c) => { A.hollowOak(c, 640, 420, { glow: 0, face: Math.PI * 0.5 }); } });
sh('a40', 'r07', envW(16.0, {}), { off: 4.6, clear: [[1040, 300, 12]], shadow: { x: 1040, z: 300, r: 20 }, cam: dolly([1034, 1.5, 292], [1036, 1.2, 294], [1040, 0.4, 300], [1040, 0.4, 300], 34), set: (c) => { const m = A.M; c.mesh(new THREE.CylinderGeometry(0.03, 0.03, 2.6, 6), m.wood(), 1040, height(1040, 300) + 0.08, 300).rotation.z = Math.PI / 2 - 0.3; c.mesh(new THREE.CylinderGeometry(0.03, 0.03, 2.6, 6), m.wood(), 1040, height(1040, 300) + 0.1, 300).rotation.set(0, 0.9, Math.PI / 2 + 0.2); } });
sh('a41', 'r08', envW(15.0, {}), { clear: [[WX - 14, 300, 20]], shadow: { x: WX - 10, z: 300, r: 30 }, cam: dolly([WX - 18, 1.6, 292], [WX - 14, 1.6, 294], [WX - 5, 2.0, 300], [WX - 5, 2.0, 300], 36), set: (c) => { wallScene(c, 0, { glow: 0.1 }); who(c, 'WREN', WX - 5.6, 300, 'touchWall', { yaw: Math.PI / 2 }); } });
sh('a42', 'r08', envW(15.0, {}), { off: 1.5, clear: [[WX + 14, 330, 20]], shadow: { x: WX + 10, z: 330, r: 30 }, cam: dolly([WX + 18, 1.6, 322], [WX + 14, 1.6, 324], [WX + 5, 2.0, 330], [WX + 5, 2.0, 330], 36), set: (c) => { wallScene(c, 0, { glow: 0.1 }); who(c, 'SOL', WX + 5.6, 330, 'listen', { yaw: -Math.PI / 2 }); who(c, 'REED', WX + 5.6, 333.5, 'touchWall', { yaw: -Math.PI / 2 }); } });
sh('a43', 'r09', envW(6.1, { fog: 0.0009 }), { shadow: { x: WX - 20, z: 300, r: 60 }, clear: [[WX - 24, 300, 30]], cam: dolly([WX - 40, 1.7, 285], [WX - 28, 1.7, 292], [WX, 12, 320], [WX, 14, 320], 44), set: (c) => { wallScene(c, 0, { glow: 0.4 }); mob(c, 'F', 30, WX - 22, 305, 2, 10, [WX, 305], { seed: 7 }); } });
sh('a44', 'r10', envW(12.0, {}), { top: true, topAt: [WX, 300], inner: 200, cam: path3([[0, [WX, 180, 238], [WX, 0, 300], 40], [1, [WX, 190, 262], [WX, 0, 300], 44]]), shadow: { x: WX, z: 300, r: 130 }, set: (c) => { wallScene(c, 0, {}); mob(c, 'F', 100, WX - 60, 300, 2, 16, [WX, 300], { seed: 2 }); mob(c, 'P', 100, WX + 60, 300, 2, 16, [WX, 300], { seed: 4 }); } });
sh('a45', 'r11', envW(18.5, {}), { clear: [[WX - 12, 150, 20]], shadow: { x: WX - 10, z: 150, r: 25 }, cam: dolly([WX - 14, 11, 142], [WX - 11, 11.6, 146], [WX - 4, 12, 152], [WX - 4, 12, 152], 34), set: (c) => { wallScene(c, 0, { glow: 0.5 }); } });
const lie = (c, side, cx, cz, n, t0) => { for (let i = 0; i < n; i++) { const a = i * 2.39996, d = 2 + Math.sqrt(i) * 3.1, x = cx + Math.cos(a) * d, z = cz + Math.sin(a) * d; const nm = i === 0 ? (side === 'F' ? 'WREN' : 'SOL') : (side === 'F' ? VD(i + 1) : AU(i + 1)); wake(who(c, nm, x, z, 'lie', { yaw: a, y: undefined }), t0 + i * 0.12, 0.8); } };
sh('a46', 'r12', envF(6.6, { fog: 0.0012 }), { clear: [[FP.landing[0], FP.landing[1], 24]], shadow: { x: FP.landing[0], z: FP.landing[1], r: 30 }, cam: path3([[0, [FP.landing[0] - 14, 4.5, FP.landing[1] - 12], [FP.landing[0], 0.5, FP.landing[1]], 44], [1, [FP.landing[0] - 11, 3, FP.landing[1] - 9], [FP.landing[0], 1.0, FP.landing[1]], 40]]), set: (c) => { lie(c, 'F', FP.landing[0], FP.landing[1], 28, 0.8); A.motes(c, FP.landing[0], 0.5, FP.landing[1], { n: 80, r: 14, h: 6 }); } });
sh('a47', 'r12', envP(6.8, { fog: 0.0004 }), { off: 1.7, clear: [], shadow: { x: PP.landing[0], z: PP.landing[1], r: 30 }, cam: path3([[0, [PP.landing[0] + 14, 4.5, PP.landing[1] - 12], [PP.landing[0], 0.5, PP.landing[1]], 44], [1, [PP.landing[0] + 11, 3, PP.landing[1] - 9], [PP.landing[0], 1.0, PP.landing[1]], 40]]), set: (c) => { lie(c, 'P', PP.landing[0], PP.landing[1], 28, 0.6); } });
sh('a43b', 'r09', envP(6.3, { fog: 0.0004 }), { off: 3.3, clear: [[WX + 26, 320, 30]], shadow: { x: WX + 20, z: 320, r: 50 }, cam: dolly([WX + 40, 1.7, 300], [WX + 30, 1.7, 306], [WX, 12, 325], [WX, 15, 325], 44), set: (c) => { wallScene(c, 0, { glow: 0.4 }); mob(c, 'P', 30, WX + 22, 318, 2, 10, [WX, 318], { seed: 8 }); who(c, 'LARK', WX + 14, 316, 'lookUp', { yawTo: [WX, 316] }); } });
sh('a43c', 'r09', envW(6.5, { fog: 0.0006 }), { off: 6.6, clear: [[WX - 8, 380, 12], [WX + 8, 380, 12]], shadow: { x: WX, z: 380, r: 30 }, cam: path3([[0, [WX - 6, 12, 372], [WX - 4, 12, 380], 34], [1, [WX - 5, 12, 376], [WX - 4, 12, 382], 30]]), set: (c) => { wallScene(c, 0, { glow: 0.5 }); } });
