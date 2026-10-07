// CHAPTER V — THE EDGE (year 2163): the top of the Ladder, the painted sky, the screen, "WHAT IS A BINGUS?", "who's watching you?"
import { S, K, who, vil, portrait, duo, reuse, clearTown, clearTowns, THREE, TIME, PLAZA, crowdDisc, height, lerp, clamp01, mulberry32, NIGHT, DUSK } from './p2kit.js';
import { narratorRoom, roomAt, ROOM_SHOT, drawComments, drawBingusScreen } from './p2scenes.js';
import * as P from '../lib/p2.js';

const camK = (a, ta, fov = 40, b = a, tb = ta, fov2 = fov) => K([0, a, ta, fov], [1, b, tb, fov2], { abs: true });   // absolute heights (the deck is 3 km up)
const T99 = { year: 1999, town: true };
const LD = P.P2.ladder, TOP = 3000, TY = height(LD.x, LD.z) + TOP;         // the top deck
const smk = (t, a, b) => clamp01((t - a) / (b - a));
const CREW = ['RIA', 'NERI', 'BRAX', 'KUMA'];
const above = (o) => ({ year: 2000, town: false, veg: { r0: 1, rImp: 1, r1: 1, rFar: 1 }, noTerrain: false, ...o });
// a scene at the top: clouds below, the painted sky wall above, the platform, the crew
const topScene = (c, o = {}) => {
  P.cloudSea(c, TY - 750, 2800, 130); if (o.wall !== false) P.skyWall(c, TY + 12, { w: 1600 }); P.topPlatform(c, LD.x, TY, LD.z, { w: 18 });
  P.ladderTower(c, { H: TOP, f: 1, noBeacon: true });
  const pose = o.poses || ['idle', 'lookUp', 'idle', 'idle'];
  CREW.forEach((nm, i) => who(c, nm, LD.x - 3 + i * 2.2, LD.z - 2 + (i % 2), pose[i], { y: TY + 0.25, yaw: 0.2 + i * 0.1, phase: i }));
  const g = c.animal('goat', 9, LD.x + 3, LD.z + 2.5, 3.4, {}); g.root.position.y = TY + 0.25; g.root.scale.setScalar(1.15); c.on((t) => g.animate(t, { speed: 0, phase: 1 }));
  const L1 = new THREE.PointLight(0xffe2b0, 60, 40, 1.6); L1.position.set(LD.x - 1, TY + 6, LD.z - 6); c.add(L1); const L2 = new THREE.PointLight(0xbcd6ff, 40, 40, 1.6); L2.position.set(LD.x + 2, TY + 5, LD.z + 3); c.add(L2);
  return g;
};
const TOPHOURS = { hours: 22.5, cloud: 0.0, fog: 0.00002, exposure: 1.7, env: 0.9 };
// e01 the Ladder was finished
S('e01', 'e01', { ...T99, hours: 6.4, cloud: 0.5, fog: 0.0003, townFilter: clearTown(-210, 10, 60), cam: camK([300, 40, -380], [LD.x, 900, LD.z], 56, [260, 60, -330], [LD.x, 1400, LD.z], 56), veg: { r0: 30, rImp: 160, r1: 300 },
  setup(c) { P.industry(c, 1.0, { smokeOpacity: 0.5 }); P.ladderTower(c, { H: 3000, f: 1, beaconAlways: true }); P.cloudSea(c, 2250, 2600, 120); } });
// e02 three kilometers tall, above the clouds, above the birds; the crew of five
S('e02a', 'e02', { ...T99, hours: 6.8, cloud: 0.5, townFilter: clearTown(-210, 10, 60), cam: camK([LD.x + 24, 2.0, LD.z - 30], [LD.x + 4, 4, LD.z - 12], 48, [LD.x + 18, 2.2, LD.z - 26], [LD.x + 4, 4, LD.z - 12], 44), veg: { r0: 30 },
  setup(c) { P.ladderTower(c, { H: 3000, f: 1, beaconAlways: true }); CREW.forEach((nm, i) => who(c, nm, LD.x + 2 + i * 1.7, LD.z - 14 + (i % 2) * 0.8, 'idle', { yawTo: [LD.x + 30, LD.z - 40], phase: i })); const g = c.animal('goat', 9, LD.x + 9.5, LD.z - 14, 3.6, {}); c.on((t) => g.animate(t, { speed: 0, phase: 1 })); } });
portrait('e02b', 'e02', 2.6, 'RIA', { x: LD.x + 4, z: LD.z - 15, pose: 'armsCrossed', ...T99, townFilter: clearTown(-210, 10, 60), hours: 6.9, cloud: 0.5, r: 3.8, h: 1.3, a0: 4.4, a1: 3.9, fov: 38, th: 1.4, set(c) { P.ladderTower(c, { H: 3000, f: 1, beaconAlways: true }); } });
S('e02c', 'e02', { ...T99, hours: 6.9, cloud: 0.5, townFilter: clearTown(-210, 10, 60), cam: camK([LD.x + 6, 1.5, LD.z - 24], [LD.x + 4.8, 1.5, LD.z - 14.5], 42, [LD.x + 6.6, 1.6, LD.z - 22], [LD.x + 4.8, 1.5, LD.z - 14.5], 34), veg: { r0: 30 },
  setup(c) { P.ladderTower(c, { H: 3000, f: 1, beaconAlways: true }); CREW.forEach((nm, i) => who(c, nm, LD.x + 2.6 + i * 1.4, LD.z - 14.5 + (i % 2) * 0.5, 'idle', { yawTo: [LD.x + 6, LD.z - 24], phase: i })); const g = c.animal('goat', 9, LD.x + 8.4, LD.z - 14.4, 3.2, {}); c.on((t) => g.animate(t, { speed: 0, phase: 1 })); } }, 5.2);
// e03 they climbed for nine days; day three, day five, day seven, day nine
S('e03a', 'e03', { ...above({ hours: 9, cloud: 0.4 }), cam: camK([LD.x + 14, 1700, LD.z - 20], [LD.x, 1680, LD.z], 56, [LD.x + 12, 1720, LD.z - 18], [LD.x, 1690, LD.z], 56),
  setup(c) { P.cloudSea(c, 1500, 2600, 130); P.ladderTower(c, { H: 3000, f: 1 }); } });
S('e03b', 'e03b', { ...above({ hours: 12, cloud: 0.4 }), cam: camK([LD.x + 9, 1200, LD.z - 11], [LD.x, 1198, LD.z], 56, [LD.x + 8, 1202, LD.z - 10], [LD.x, 1199, LD.z], 50),
  setup(c) { P.cloudSea(c, 1100, 2600, 130); P.ladderTower(c, { H: 3000, f: 1 }); const y = height(LD.x, LD.z) + 1200; P.topPlatform(c, LD.x, y - 0.1, LD.z, { w: 10 }); CREW.forEach((nm, i) => who(c, nm, LD.x - 2 + i * 1.6, LD.z - 1.5, ['sit', 'sleepCurl', 'sit', 'sit'][i], { y: y + 0.15, yaw: 0.4, phase: i, p: { seat: 0.45 } })); } });
S('e03c', 'e03b', { ...above({ hours: 14, cloud: 0.4 }), cam: camK([LD.x + 6, 2200, LD.z - 7], [LD.x, 2199, LD.z], 48, [LD.x + 5, 2201, LD.z - 6], [LD.x, 2199.5, LD.z], 44),
  setup(c) { P.cloudSea(c, 2150, 2600, 130); P.ladderTower(c, { H: 3000, f: 1 }); const y = height(LD.x, LD.z) + 2200; P.topPlatform(c, LD.x, y - 0.1, LD.z, { w: 10 }); who(c, 'KUMA', LD.x - 0.6, LD.z - 1, 'talk', { y: y + 0.15, yawTo: [LD.x + 1.5, LD.z - 1] }); const cl = new THREE.Mesh(new THREE.SphereGeometry(2.6, 20, 14), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.85 })); cl.position.set(LD.x + 2.0, y + 1.8, LD.z - 1); cl.scale.set(1.6, 1, 1); c.add(cl); } }, 4.4);
S('e03d', 'e03b', { ...above({ hours: 15, cloud: 0.4 }), cam: camK([LD.x + 6, 2900, LD.z - 7], [LD.x, 2899, LD.z], 50, [LD.x + 5, 2902, LD.z - 6], [LD.x, 2900, LD.z], 44),
  setup(c) { P.cloudSea(c, 2400, 2600, 130); P.ladderTower(c, { H: 3000, f: 1 }); const y = height(LD.x, LD.z) + 2900; P.topPlatform(c, LD.x, y - 0.1, LD.z, { w: 10 }); who(c, 'RIA', LD.x - 1, LD.z - 1, 'point', { y: y + 0.15, yawTo: [LD.x + 6, LD.z + 8] }); } }, 8.4);
// e04 at the top the air is thin and the stars are close
S('e04', 'e04', { ...above(TOPHOURS), cam: camK([LD.x - 8, TY + 2.4, LD.z - 10], [LD.x, TY + 3.2, LD.z + 3], 56, [LD.x - 6, TY + 2.6, LD.z - 8], [LD.x, TY + 4.0, LD.z + 3], 54), setup(c) { topScene(c); } });
// e04b from up there they could see the whole world; at the edge, a wall of fog
S('e04b', 'e04b', { ...above({ hours: 21.2, cloud: 0.0, fog: 0.00003 }), cam: camK([LD.x + 30, TY + 70, LD.z - 40], [LD.x - 300, TY - 1500, LD.z + 700], 62, [LD.x + 22, TY + 40, LD.z - 30], [LD.x - 500, TY - 2300, LD.z + 900], 70), veg: { r0: 30, rImp: 160, r1: 300 }, town: true, townFilter: clearTown(-210, 10, 60),
  setup(c) { P.cloudSea(c, TY - 1100, 2200, 70, 5); P.industry(c, 1.0, { night: 0.8, smokeOpacity: 0.4 }); } });
S('e04c', 'e04b', { ...above({ hours: 21.2, cloud: 0.0, fog: 0.00003 }), cam: camK([LD.x + 12, TY + 8, LD.z - 14], [LD.x + 2400, TY - 3000, LD.z + 2400], 60, [LD.x + 12, TY + 8, LD.z - 14], [LD.x + 2800, TY - 2900, LD.z + 2000], 62),
  setup(c) { P.topPlatform(c, LD.x, TY, LD.z, { w: 18 }); P.ladderTower(c, { H: TOP, f: 1 }); } }, 5.2);
// e05..e07 she touches the sky: it is flat, painted, with stars
S('e05', 'e05', { ...above(TOPHOURS), cam: camK([LD.x - 2.5, TY + 1.0, LD.z - 5.5], [LD.x - 0.8, TY + 1.9, LD.z - 1], 40, [LD.x - 2.0, TY + 1.2, LD.z - 4.6], [LD.x - 0.8, TY + 2.3, LD.z - 1], 34), setup(c) { topScene(c, { poses: ['idle', 'reach', 'idle', 'idle'] }); } });
S('e06', 'e06', { ...above(TOPHOURS), cam: camK([LD.x - 1.9, TY + 1.5, LD.z - 4.4], [LD.x - 0.8, TY + 1.7, LD.z - 1], 34, [LD.x - 1.5, TY + 1.5, LD.z - 3.4], [LD.x - 0.8, TY + 1.8, LD.z - 1], 26), setup(c) { topScene(c, { poses: ['idle', 'reach', 'idle', 'idle'] }); } });
S('e07', 'e07', { ...above(TOPHOURS), cam: camK([LD.x + 4, TY + 1.8, LD.z - 7.5], [LD.x - 1, TY + 6, LD.z + 8], 66, [LD.x + 3, TY + 2.2, LD.z - 6.5], [LD.x - 1, TY + 8, LD.z + 14], 72), setup(c) { topScene(c); } });
S('e08', 'e08', { ...above(TOPHOURS), cam: camK([LD.x + 1.8, TY + 1.4, LD.z - 6.2], [LD.x + 1.3, TY + 1.7, LD.z - 1.8], 38, [LD.x + 1.5, TY + 1.5, LD.z - 5.0], [LD.x + 1.3, TY + 1.8, LD.z - 1.8], 30),
  setup(c) { topScene(c, { poses: ['hands', 'idle', 'hammer', 'idle'] }); } });
// e09..e10 a crack, a thin line of white light, and through it...
S('e09', 'e09', { ...above(TOPHOURS), cam: camK([LD.x - 6, TY + 1.5, LD.z - 7], [LD.x - 1, TY + 6, LD.z + 8], 56, [LD.x - 4, TY + 2.0, LD.z - 5], [LD.x - 1, TY + 8, LD.z + 8], 44),
  setup(c) { topScene(c); P.crack(c, [LD.x - 1, TY + 11.9, LD.z + 8], { L: 16, wid: 0.25, t0: 0.2, dur: 1.2 }); } });
S('e10', 'e10', { ...above(TOPHOURS), cam: camK([LD.x - 2, TY + 3, LD.z - 3], [LD.x - 1, TY + 11, LD.z + 8], 30, [LD.x - 1.4, TY + 3.2, LD.z - 1], [LD.x - 1, TY + 11.9, LD.z + 8], 16),
  setup(c) { topScene(c); P.crack(c, [LD.x - 1, TY + 11.9, LD.z + 8], { L: 16, wid: 0.5, t0: -3, dur: 0.1 }); } });
// e11..e13 a screen, bigger than a mountain: a list of words, the most liked at the top
const EDGE_SCREEN = (c, drawFn) => P.monitor(c, LD.x - 1, 0, LD.z + 9, Math.PI, 22, drawFn, { px: 1280, light: 6, lightColor: 0xcfe6ff, stand: false });
S('e11', 'e11', { ...above(TOPHOURS), cam: camK([LD.x - 3, TY + 2.4, LD.z - 6], [LD.x - 1, TY + 12, LD.z + 9], 52, [LD.x - 2, TY + 3, LD.z - 3.5], [LD.x - 1, TY + 13, LD.z + 9], 40),
  setup(c) { topScene(c, { wall: false }); const m = P.monitor(c, LD.x - 1, 0, LD.z + 9, Math.PI, 22, (g, W, H, t) => drawComments(g, W, H, { scroll: t * 1.2, header: 'Comments', count: '2,431,907' }), { px: 1280, light: 6, lightColor: 0xcfe6ff, stand: false }); m.grp.position.y = TY + 13; } });
S('e12', 'e12', { ...above(TOPHOURS), cam: camK([LD.x - 1, TY + 6, LD.z - 3.4], [LD.x - 1, TY + 13, LD.z + 9], 52, [LD.x - 1, TY + 7, LD.z - 1.4], [LD.x - 1, TY + 14, LD.z + 9], 44),
  setup(c) { topScene(c, { wall: false }); const m = P.monitor(c, LD.x - 1, 0, LD.z + 9, Math.PI, 22, (g, W, H, t) => drawComments(g, W, H, { scroll: 4 + t * 1.6, header: 'Comments', count: '2,431,907' }), { px: 1280, light: 6, lightColor: 0xcfe6ff, stand: false }); m.grp.position.y = TY + 13; } });
S('e13', 'e13', { ...above(TOPHOURS), cam: camK([LD.x + 3.6, TY + 13.6, LD.z - 6.0], [LD.x + 4.3, TY + 15.4, LD.z + 9], 30, [LD.x + 3.8, TY + 13.8, LD.z - 3.4], [LD.x + 4.3, TY + 15.6, LD.z + 9], 26),
  setup(c) { topScene(c, { wall: false }); const m = P.monitor(c, LD.x - 1, 0, LD.z + 9, Math.PI, 22, (g, W, H, t) => drawBingusScreen(g, W, H, { t }), { px: 1280, light: 6, lightColor: 0xcfe6ff, stand: false }); m.grp.position.y = TY + 13; } });
// e14..e16 "Bingus." Silence, wind, Kuma's goat
S('e14', 'e14', { ...above(TOPHOURS), cam: camK([LD.x - 1, TY + 1.5, LD.z - 5], [LD.x - 0.3, TY + 1.3, LD.z - 1], 34, [LD.x - 1, TY + 1.5, LD.z - 3.6], [LD.x - 0.3, TY + 1.3, LD.z - 1], 28),
  setup(c) { topScene(c); } });
S('e15', 'e15', { ...above(TOPHOURS), cam: camK([LD.x + 0.6, TY + 1.0, LD.z - 1.2], [LD.x + 3, TY + 0.9, LD.z + 2.5], 42, [LD.x + 1.0, TY + 1.0, LD.z - 0.6], [LD.x + 3, TY + 0.9, LD.z + 2.5], 34), setup(c) { topScene(c, { poses: ['idle', 'idle', 'idle', 'shrug'] }); } });
S('e16', 'e16', { ...above(TOPHOURS), cam: camK([LD.x + 6.5, TY + 1.0, LD.z + 0.5], [LD.x + 3.2, TY + 0.9, LD.z + 2.5], 38, [LD.x + 5.5, TY + 1.0, LD.z + 0.9], [LD.x + 3.2, TY + 0.9, LD.z + 2.5], 28), setup(c) { topScene(c, { poses: ['idle', 'idle', 'idle', 'watch'] }); } });
// e17 they understood: the thing watching them was not a god, it was a crowd
S('e17a', 'e17', { ...above(TOPHOURS), cam: camK([LD.x - 6, TY + 3, LD.z - 6], [LD.x - 1, TY + 10, LD.z + 9], 54, [LD.x - 3, TY + 4, LD.z - 5], [LD.x - 1, TY + 12, LD.z + 9], 44),
  setup(c) { topScene(c, { wall: false }); const m = P.monitor(c, LD.x - 1, 0, LD.z + 9, Math.PI, 22, (g, W, H, t) => drawComments(g, W, H, { scroll: 2 + t * 2.4, header: 'Comments', count: '2,431,907' }), { px: 1280, light: 6, lightColor: 0xcfe6ff, stand: false }); m.grp.position.y = TY + 13; } });
S('e17b', 'e17', { ...above(TOPHOURS), cam: camK([LD.x - 1, TY + 5, LD.z - 14], [LD.x - 1, TY + 12, LD.z + 9], 50, [LD.x - 1, TY + 6, LD.z - 8], [LD.x - 1, TY + 12, LD.z + 9], 46),
  setup(c) { topScene(c, { wall: false }); const m = P.monitor(c, LD.x - 1, 0, LD.z + 9, Math.PI, 22, (g, W, H, t) => drawComments(g, W, H, { scroll: 6 + t * 3.2, header: 'Comments', count: '2,431,907' }), { px: 1280, light: 6, lightColor: 0xcfe6ff, stand: false }); m.grp.position.y = TY + 13; } }, 4.0);
S('e17c', 'e17', { ...above(TOPHOURS), cam: camK([LD.x - 14, TY + 6, LD.z - 16], [LD.x - 1, TY + 6, LD.z + 3], 56, [LD.x - 9, TY + 7, LD.z - 12], [LD.x - 1, TY + 6, LD.z + 3], 52), setup(c) { topScene(c, { poses: ['lookUp', 'lookUp', 'idle', 'idle'] }); } }, 7.4);
// e18..e19e Ria asks "Who are they?"; a cursor blinks; somebody is typing... (the narrator)
S('e18', 'e18', { ...above(TOPHOURS), cam: camK([LD.x - 3 + 2.6, TY + 1.7, LD.z - 1.5 - 3.2], [LD.x - 3, TY + 1.65, LD.z - 1.5], 36, [LD.x - 3 + 2.0, TY + 1.7, LD.z - 1.5 - 2.7], [LD.x - 3, TY + 1.65, LD.z - 1.5], 30),
  setup(c) { P.cloudSea(c, TY - 750, 2800, 130); P.topPlatform(c, LD.x, TY, LD.z, { w: 18 }); who(c, 'RIA', LD.x - 3, LD.z - 1.5, 'idle', { y: TY + 0.25, yaw: 0.2 }); const L1 = new THREE.PointLight(0xffe2b0, 60, 40, 1.6); L1.position.set(LD.x + 1, TY + 4, LD.z - 6); c.add(L1); } });
S('e19', 'e19', { ...above(TOPHOURS), cam: camK([LD.x - 1.5, TY + 1.7, LD.z - 5.6], [LD.x - 3, TY + 1.7, LD.z - 2], 32, [LD.x - 2.1, TY + 1.7, LD.z - 4.4], [LD.x - 3, TY + 1.7, LD.z - 2], 26), setup(c) { topScene(c, { poses: ['speak', 'idle', 'idle', 'idle'] }); } });
S('e19b', 'e19b', { ...above(TOPHOURS), cam: camK([LD.x - 1, TY + 7, LD.z - 6], [LD.x - 1, TY + 11, LD.z + 9], 40, [LD.x - 1, TY + 8, LD.z - 2], [LD.x - 1, TY + 12, LD.z + 9], 34),
  setup(c) { topScene(c, { wall: false }); const m = P.monitor(c, LD.x - 1, 0, LD.z + 9, Math.PI, 22, (g, W, H, t) => drawComments(g, W, H, { scroll: 0, typing: true, t, header: 'Comments', count: '2,431,907' }), { px: 1280, light: 6, lightColor: 0xcfe6ff, stand: false }); m.grp.position.y = TY + 13; } });
S('e19c', 'e19c', { ...above(TOPHOURS), cam: camK([LD.x + 0.4, TY + 1.4, LD.z - 4.4], [LD.x - 0.8, TY + 1.4, LD.z - 1], 32, [LD.x + 0.0, TY + 1.4, LD.z - 3.2], [LD.x - 0.8, TY + 1.3, LD.z - 1], 24), setup(c) { topScene(c, { poses: ['idle', 'cower', 'idle', 'idle'] }); } });
const ROOMCAM = (a, t, f, b = a, tb = t, f2 = f) => K([0, roomAt(...a), roomAt(...t), f], [1, roomAt(...b), roomAt(...tb), f2], { abs: true });
const TYPING = (txt) => (g, W, H, t) => { g.fillStyle = '#0f0f0f'; g.fillRect(0, 0, W, H); g.fillStyle = '#272727'; g.fillRect(W * 0.04, H * 0.62, W * 0.92, H * 0.18); g.fillStyle = '#f1f1f1'; g.font = `${H * 0.08}px InterX, sans-serif`; const s = txt(t); g.fillText(s + ((t * 2) % 1 < 0.6 ? '|' : ''), W * 0.07, H * 0.75); g.fillStyle = '#aaaaaa'; g.font = `${H * 0.05}px InterX, sans-serif`; g.fillText('Add a reply...', W * 0.05, H * 0.18); };
S('e19d', 'e19d', { interior: true, hours: 3, ...ROOM_SHOT, cam: ROOMCAM([-0.7, 1.28, 0.62], [0, 1.12, -0.32], 32, [-0.5, 1.22, 0.4], [0, 1.12, -0.32], 26),
  setup(c) { narratorRoom(c, { pose: 'type', cereal: true, screen: TYPING((t) => { const seq = [[0, 'hello'], [1.2, ''], [1.8, 'sorry'], [3.0, ''], [3.5, 'Dear AIs, with great power comes great'], [6.0, '']]; let s = ''; for (const [t0, v] of seq) if (t >= t0) s = v; if (s.length > 6) s = s.slice(0, Math.min(s.length, Math.floor((t - 3.5) * 14))); return s; }) }); } });
S('e19e', 'e19e', { interior: true, hours: 3, ...ROOM_SHOT, cam: ROOMCAM([-1.4, 1.4, 1.6], [0, 1.0, 0], 42, [-1.0, 1.3, 1.3], [0, 1.0, 0], 38), setup(c) { narratorRoom(c, { pose: 'lean', cereal: true, screen: TYPING(() => '') }); } });
// e20..e21 they wrote back: letters a kilometer long across the clouds: WHAT IS A BINGUS?
S('e20', 'e20', { ...above(TOPHOURS), cam: camK([LD.x - 4, TY + 1.6, LD.z - 6], [LD.x - 1, TY + 1.4, LD.z + 2], 56, [LD.x - 3, TY + 2.2, LD.z - 5], [LD.x - 1, TY - 100, LD.z + 300], 62),
  setup(c) { topScene(c); P.skyText(c, 'WHAT IS A BINGUS?', [LD.x - 1, TY - 740, LD.z + 330], { w: 700, h: 88, t0: 1.2, fade: 2.2, max: 0.7, flat: true }); } });
S('e21', 'e21', { ...above(TOPHOURS), cam: camK([LD.x - 1, TY + 160, LD.z - 40], [LD.x - 1, TY - 740, LD.z + 330], 50, [LD.x - 1, TY + 110, LD.z + 40], [LD.x - 1, TY - 740, LD.z + 330], 40),
  setup(c) { P.cloudSea(c, TY - 750, 2800, 130); P.ladderTower(c, { H: TOP, f: 1, noBeacon: true }); P.skyText(c, 'WHAT IS A BINGUS?', [LD.x - 1, TY - 740, LD.z + 330], { w: 700, h: 88, t0: -3, fade: 0.1, max: 0.7, flat: true }); P.topPlatform(c, LD.x, TY, LD.z, { w: 18 }); } }, 1.4);
// e22..e23 I have no idea, so you tell me: comments (the narrator, then a 2D card)
S('e22', 'e22', { interior: true, hours: 3, ...ROOM_SHOT, cam: ROOMCAM([-1.5, 1.4, 1.6], [0, 1.0, 0], 42, [-1.1, 1.3, 1.3], [0, 1.0, 0], 38), setup(c) { narratorRoom(c, { pose: 'turn', cereal: true, screen: (g, W, H, t) => drawComments(g, W, H, { scroll: t * 1.5 }) }); } });
S('e23', 'e23', { kind: '2d', name: 'ask', bg: 'e22', cam: camK([0, 10, 0], [0, 0, 10]) });
// e24..e26 "hey. you." (the creator turns to the camera) / who's watching you?
S('e24', 'e24', { interior: true, hours: 3, ...ROOM_SHOT, cam: ROOMCAM([0.05, 1.3, 2.1], [0.0, 1.25, 0.62], 30, [0.0, 1.32, 1.6], [0.0, 1.28, 0.62], 22), setup(c) { narratorRoom(c, { pose: 'turn', cereal: true }); } });
S('e25', 'e25', { ...above(TOPHOURS), cam: camK([LD.x - 1.4, TY + 1.5, LD.z - 6.5], [LD.x - 1.0, TY + 1.4, LD.z - 1], 44, [LD.x - 1.4, TY + 1.5, LD.z - 5.2], [LD.x - 1.0, TY + 1.5, LD.z - 1], 36), setup(c) { topScene(c, { poses: ['wave', 'wave', 'idle', 'idle'] }); } });
S('e26', 'e26', { kind: '2d', name: 'watcher', bg: 'e24', cam: camK([0, 10, 0], [0, 0, 10]) });
S('e27', 'e27', { kind: '2d', name: 'part3', bg: 'e24', cam: camK([0, 10, 0], [0, 0, 10]) });
// outro: the crew at the top under the stars, slow push-in (end screen sits on the left)
S('outro_bg', 'outro', { ...above(TOPHOURS), cam: camK([LD.x - 1, TY + 1.4, LD.z - 8], [LD.x + 1.2, TY + 1.5, LD.z - 1], 36, [LD.x, TY + 1.5, LD.z - 6.2], [LD.x + 1.2, TY + 1.6, LD.z - 1], 30), setup(c) { topScene(c, { poses: ['lookUp', 'lookUp', 'idle', 'lookUp'] }); } });
