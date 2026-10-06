// world test shots (anchored past the end; rendered with --sample t_)
import { dolly, sh, envB, who, A, height, THREE } from './stage.js';
import { HG } from '../lib/biomes.js';
import * as H from '../lib/hg.js';
const C = [HG.cx, HG.cz];
const shotAt = (id, biome, hours, cam, tgt, extra = {}) => sh(id, 't:99' + String(Object.keys({}).length), envB(biome, hours), { cam: dolly(cam, cam, tgt, tgt, extra.fov || 40), ...extra }, 0);
let n = 0;
const T = (id, biome, hours, cam, tgt, extra = {}) => sh(id, 't:' + (99000 + (n++) * 10), envB(biome, hours), { cam: dolly(cam, cam, tgt, tgt, extra.fov || 40), shadow: { x: tgt[0], z: tgt[2], r: 60 }, ...extra }, 0);
T('t_horn', 'center', 15.5, [C[0] - 40, 12, C[1] - 70], [C[0], 11, C[1]], { fov: 46, clear: [[C[0], C[1], 75]], set: (c) => { H.horn(c, { yaw: Math.PI }); H.pedestals(c); } });
T('t_forest', 'forest', 9.5, [760, 3, 190], [730, 8, 170], { fov: 46 });
T('t_swamp', 'swamp', 8.5, [1170, 3, 190], [1230, 3, 170], { fov: 46, set: (c) => H.swampDress(c, 1200, 180, 40) });
T('t_desert', 'desert', 12.5, [1260, 6, 430], [1330, 5, 470], { fov: 46 });
T('t_lake', 'lake', 11, [930, 4, 470], [950, 0, 600], { fov: 46 });
T('t_mount', 'mountain', 10, [1000, 12, 120], [1000, 60, -150], { fov: 46 });
T('t_meadow', 'meadow', 16.5, [760, 3, 440], [700, 4, 470], { fov: 46 });
T('t_wide', 'center', 14, [1000, 260, 470], [1000, 0, 300], { fov: 60, set: (c) => { H.horn(c, { yaw: Math.PI }); H.staticWall(c, H.zoneRadius(40)); } });
