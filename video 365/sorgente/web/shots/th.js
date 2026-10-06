// thumbnail shots (anchored past the end of the film; rendered by thumbs.py only)
import { dolly, sh, envF, envP, envW, who, horse, rider, mob, A, FP, PP, height, WX, THREE } from './stage.js';
const FOG = envF(7.2, { fog: 0.004 });
sh('th_wide', 't:99000', envW(17.6, { fog: 0.0004 }), { hero: true, clear: [[WX - 20, 300, 40]], shadow: { x: WX, z: 300, r: 90 },
  cam: dolly([WX + 6, 70, 40], [WX + 6, 70, 40], [WX, 6, 330], [WX, 6, 330], 62),
  set: (c) => { A.wall(c, { day: 364, glow: 1.6 }); mob(c, 'F', 40, WX - 40, 320, 2, 12, [WX, 330], { seed: 2 }); mob(c, 'P', 40, WX + 40, 320, 2, 12, [WX, 330], { seed: 4 }); } });
sh('th_f', 't:99100', envF(17.2, { fog: 0.0018 }), { hero: true, clear: [[930, 330, 30]], shadow: { x: 920, z: 330, r: 40 },
  cam: dolly([915, 1.5, 318], [915, 1.5, 318], [925, 2.1, 332], [925, 2.1, 332], 40),
  set: (c) => { A.wall(c, { day: 364, glow: 1.6 }); who(c, 'BRAM', 922, 332, 'drawBow', { yawTo: [WX, 330], acc: [{ type: 'headband', color: 0x1b3d26 }] }); who(c, 'WREN', 919, 327, 'idle', { yawTo: [WX, 330] }); } });
sh('th_p', 't:99200', envP(17.2, {}), { hero: true, clear: [], shadow: { x: 1075, z: 330, r: 40 },
  cam: dolly([1083, 1.5, 318], [1083, 1.5, 318], [1073, 2.3, 332], [1073, 2.3, 332], 40),
  set: (c) => { A.wall(c, { day: 364, glow: 1.6 }); const h = horse(c, 2, 1074, 332, -1.57, { graze: 0 }); rider(c, 'KESH', h, { pose: 'rideSeat' }); who(c, 'SOL', 1077, 326, 'idle', { yawTo: [WX, 330], acc: [{ type: 'hat', color: 0xe6c25a }] }); } });
