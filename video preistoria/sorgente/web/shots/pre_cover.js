// Cover shots (ids cv_*, never part of the film)
import { T, L, PRE, ai, beast, snow, lineup, KIT } from './pre_scenes.js';
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
