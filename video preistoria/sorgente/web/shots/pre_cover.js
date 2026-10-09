// Cover shots (ids cv_*, never part of the film)
import { T, L, PRE, ai, beast, snow, lineup, KIT } from './pre_scenes.js';
import { crowdDisc } from './p1/sets.js';
const P = L.plain;
// A: three AIs in furs (orange = Claude-style, green = ChatGPT-style, blue = Gemini-style) in front of a mammoth
T('cv_a', 0, P, { hours: 17.4, snow: 0.95, cam: [0.2, 0.45, -3.0], tgt: [0.2, 2.9, 40], fov: 64, cr: 70, sr: 60, hero: true,
  set(c, f) {
    snow(c, { n: 1600, wind: 0.5 });
    beast(c, 'mammoth', 2, ...f.p(2.0, 13), Math.PI + 0.35, { speed: 0, trunkUp: 0.8, scale: 2.4 });
    const A = (n, x, z, pose, acc) => ai(c, n, ...f.p(x, z), pose, acc, { yaw: f.yaw + Math.PI });
    A('GORN', 0, 0, 'idle', [...KIT.walker(0, 2), 'torch']);
    A('KRU', 1.7, 0.4, 'idle', KIT.walker(1, 0));
    A('LIA', -1.7, 0.4, 'idle', KIT.walker(2, 1));
  } });
// B: the "huge crowd" cover: a hero up close, hundreds of AIs in furs behind

T('cv_b', 0, P, { hours: 15.2, snow: 0.0, cloud: 0.35, fog: 0.0006, veg: { r0: 30, rImp: 60, r1: 220, rFar: 1600 }, cam: [0.25, 1.05, -2.5], tgt: [0.1, 2.25, 30], fov: 60, cr: 90, sr: 70, hero: true,
  set(c, f) {
    const kinds = ['walker', 'rag', 'keeper', 'walker'];
    const names = ['GORN', 'LIA', 'TUK', 'RAX', 'ORIN', 'MEI', 'KRU', 'SOL', 'NIMA', 'DAK', 'ULA', 'PEK', 'ZAN', 'EDA', 'FEN', 'JUNO', 'TARO', 'VEL', 'MOK', 'PIA'];
    let k = 0;
    for (let row = 0; row < 7; row++) for (let i = 0; i < 19; i++) {
      const x = (i - 9) * (0.95 + row * 0.05) + (row % 2) * 0.5 + Math.sin(i * 3.1 + row) * 0.12, z = 1.5 + row * 1.15 + Math.cos(i * 1.7) * 0.2;
      if (Math.abs(x) < 1.5 && row < 3) continue;
      const n = names[(k++ * 7) % 20];
      ai(c, n, ...f.p(x, z), ['idle', 'idle', 'cheer', 'raiseHand', 'idle'][(i * 3 + row) % 5], kinds[(i + row) % 4], { yaw: f.yaw + Math.PI + Math.sin(i + row) * 0.25, phase: i * 0.7 + row });
    }
    crowdDisc(c, 700, f.x, f.z + 34, 9, 25, f.x, f.z - 20, { seed: 9, colors: [0xff8a3a, 0x6fd16a, 0x4aa8ff, 0xffc21a, 0xff5a4a, 0xc77dff] });
    ai(c, 'GORN', ...f.p(0, 0), 'point', [...KIT.walker(0, 2)], { yaw: f.yaw + Math.PI + 0.25 });
    // the landscape behind: a wall of snowy peaks, mammoths on the rise, birds
    const pk = f.p(0, 1100); PRE.peaks(c, pk[0], pk[1], f.yaw, { n: 13, width: 2600, h: 300, depth: 260, sink: 40, rock: 0x56637a });
    const pk2 = f.p(-200, 1700); PRE.peaks(c, pk2[0], pk2[1], f.yaw, { n: 10, width: 3600, h: 480, depth: 260, seed: 7, rock: 0x6b7a92 });
  } });
