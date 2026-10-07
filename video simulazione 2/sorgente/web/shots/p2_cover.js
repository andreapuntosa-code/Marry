// Cover shots (ids cv_*, never part of the film): the three AIs, YouTube-cover style
import { S, K, who, clearTown, THREE, height, TIME } from './p2kit.js';
import { drawBingusScreen } from './p2scenes.js';
import * as P from '../lib/p2.js';
const LD = P.P2.ladder;
const TRIO = (c, x, z, y, yaw, poses = ['idle', 'idle', 'idle']) => {
  const o = y === undefined ? {} : { y };
  who(c, 'BRAX', x - 2.7, z + 0.4, poses[0], { ...o, yaw: yaw + 0.25 });
  who(c, 'ARU', x, z, poses[1], { ...o, yaw });
  who(c, 'NERI', x + 2.5, z + 0.4, poses[2], { ...o, yaw: yaw - 0.25 });
};
const abs = (a, t, f) => K([0, a, t, f], [1, a, t, f], { abs: true });
// A: heroes on the ground, the Ladder going up into the clouds behind them
const GX = LD.x - 20, GZ = LD.z - 150;
S('cv_a', 't:98000', { year: 1999, town: true, hours: 7.2, cloud: 0.55, fog: 0.00025, hero: true, townFilter: clearTown(-210, 10, 70), veg: { r0: 40, rImp: 80, r1: 400, rFar: 1500 },
  cam: K([0, [GX + 0.3, 0.55, GZ - 4.3], [GX + 5, 5.5, GZ + 60], 58], [1, [GX + 0.3, 0.55, GZ - 4.3], [GX + 5, 5.5, GZ + 60], 58]),
  setup(c) { P.industry(c, 1.0, { smokeOpacity: 0.5 }); P.ladderTower(c, { H: 3000, f: 1, noBeacon: true }); TRIO(c, GX, GZ, undefined, Math.PI, ['hands', 'idle', 'idle']); } });
// B: the top of the Ladder at night, the three of them facing a screen taller than a mountain that says BINGUS
const TOP = 3000, TY = height(LD.x, LD.z) + TOP;
S('cv_b', 't:98010', { year: 2000, town: false, hours: 22.5, cloud: 0.0, fog: 0.00002, exposure: 1.7, env: 0.9, hero: true, veg: { r0: 1, rImp: 1, r1: 1, rFar: 1 },
  cam: abs([LD.x - 1, TY + 1.1, LD.z - 7.2], [LD.x - 1, TY + 4.6, LD.z + 6], 56),
  setup(c) {
    P.cloudSea(c, TY - 750, 2800, 130); P.topPlatform(c, LD.x, TY, LD.z, { w: 18 });
    TRIO(c, LD.x - 1, LD.z - 3, TY + 0.25, 0, ['idle', 'lookUp', 'idle']);
    const m = P.monitor(c, LD.x - 1, 0, LD.z + 12, Math.PI, 24, (g, W, H, t) => drawBingusScreen(g, W, H, { t: 4 }), { px: 1280, light: 6, lightColor: 0xcfe6ff, stand: false }); m.grp.position.y = TY + 13;
    const L1 = new THREE.PointLight(0xffe2b0, 90, 40, 1.6); L1.position.set(LD.x - 1, TY + 4, LD.z - 9); c.add(L1);
  } });
