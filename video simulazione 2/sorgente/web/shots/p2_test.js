import { S, K, who, TIME, PLAZA, MAIN } from './p2kit.js';
// cast line-up (test shot, not part of the film)
S('p2_cast', 't:99001', {
  hours: TIME.golden, cloud: 0.3,
  cam: K([0, [PLAZA.x + 1, 1.4, PLAZA.z - 11], [PLAZA.x, 1.2, PLAZA.z], 36], [1, [PLAZA.x + 1, 1.4, PLAZA.z - 11], [PLAZA.x, 1.2, PLAZA.z], 36]),
  veg: { r0: 20 },
  setup(c) { MAIN.forEach((nm, i) => who(c, nm, PLAZA.x - 7 + i * 2, PLAZA.z, 'idle', { yaw: Math.PI, phase: i })); },
});

import * as P from '../lib/p2.js';
S('p2_ind_a', 't:99002', {
  hours: 15.5, cloud: 0.5, year: 1999, town: true, fog: 0.0007,
  cam: K([0, [-60, 70, -140], [-190, 10, 30], 50], [1, [-70, 62, -120], [-190, 10, 30], 50]),
  veg: { r0: 30, rImp: 160, r1: 300 },
  setup(c) { P.industry(c, 0.9, {}); P.ladderTower(c, { H: 3000, f: 0.1, beaconAlways: true }); P.train(c, { s0: 5, speed: 12 }); },
});
S('p2_ind_b', 't:99003', {
  hours: 17.4, cloud: 0.5, year: 1999, town: true, fog: 0.0009,
  cam: K([0, [-150, 3.2, 62], [-176, 8, 20], 52], [1, [-148, 3.4, 56], [-176, 8, 20], 52]),
  veg: { r0: 30, rImp: 160, r1: 300 },
  setup(c) { P.industry(c, 0.9, {}); P.ladderTower(c, { H: 3000, f: 0.1, beaconAlways: true }); },
});
S('p2_ind_c', 't:99004', {
  hours: 15.5, cloud: 0.4, year: 1999, town: true,
  cam: K([0, [-300, 14, 120], [-214, 24, 8], 50], [1, [-290, 14, 118], [-214, 30, 8], 50]),
  veg: { r0: 30, rImp: 160, r1: 300 },
  setup(c) { P.industry(c, 0.9, {}); P.ladderTower(c, { H: 3000, f: 0.1, beaconAlways: true }); },
});
