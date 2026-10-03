// Thumbnail set-ups (not part of the film's timeline)
import { shotOnly } from './registry.js';
import { TorchField } from '../lib/fx.js';
import { VILLAGERS } from '../lib/people.js';
import { K, TIME, BERRY, MEADOW_TREES, SPAWN, castleLocal, CASTLE_YAW, LANDING, BLUE, GUARD, yawTo, berries, crowdDisc } from './sets.js';

// A-left: the king on the palace landing, red banners, sunset, low angle
shotOnly('thumbA_king', {
  hours: TIME.sunset - 0.1, cloud: 0.45, year: 1925,
  cam: K([0, castleLocal(1.0, 3.6, 9.6), castleLocal(0.0, 4.8, 6.7), 30], [1, castleLocal(1.0, 3.6, 9.6), castleLocal(0.0, 4.8, 6.7), 30], { abs: true }),
  veg: { r0: 40 }, shadow: { x: LANDING[0], z: LANDING[2], r: 10 },
  setup(c) {
    const k = c.personAt('KASSA19', LANDING[0], LANDING[1], LANDING[2], { yaw: CASTLE_YAW + 0.25, acc: ['crown', 'cape'] }); k.anim = (P, t) => P.pose('armsCrossed', 1.0);
    for (const s of [-1, 1]) { const b = castleLocal(s * 3.0, 3.0, 6.2); c.proto('bannerRed', 0, b[0], b[2], CASTLE_YAW, 1.25, 0, { y: b[1] }); }
  },
});
// A-right: Orun raises her hand in front of the torch-lit Assembly, blue banners
shotOnly('thumbA_vote', {
  hours: TIME.dusk + 0.2, cloud: 0.25, year: 1931, exposure: 1.2,
  cam: K([0, [8 - 1.2, 1.25, -6 + 3.4], [8, 1.9, -6], 32], [1, [8 - 1.2, 1.25, -6 + 3.4], [8, 1.9, -6], 32]),
  veg: { r0: 40 }, shadow: { x: 8, z: -6, r: 12 },
  setup(c) {
    const o = c.person('ORUN', { x: 8, z: -6, yaw: yawTo(8, -6, 6.8, -2.6) + 0.5, acc: BLUE }); o.anim = (P, t) => P.pose('raiseHand', 1.0, { side: 'R' });
    for (const s of [-1, 1]) c.proto('bannerBlue', 0, 8 + s * 2.6, -9.5, 0, 1.1);
    const cr = crowdDisc(c, 300, 8, -14, 1, 9, 8, -6, { seed: 3, colors: [0xf2f2f2, 0xeeeeea, 0x2a5bd7] });
    const tf = new TorchField(120); c.add(tf.group); const P = []; for (let i = 0; i < 120; i++) { const k = i * 2; P.push([cr.pos[k * 3] + 0.2, cr.pos[k * 3 + 1] + 2.0, cr.pos[k * 3 + 2]]); } tf.setPositions(P);
    for (const s of [-1, 1]) c.fire(8 + s * 4, -10, { size: 0.5, n: 16, lightIntensity: 18, lightDist: 16, dy: 1.8 });
  },
});
// B: the raised hand among the white figures, golden hour, low angle
shotOnly('thumbB', {
  hours: TIME.golden + 0.1, cloud: 0.35, year: 0, town: false,
  cam: K([0, [BERRY.x - 7.8, 0.9, BERRY.z - 6.2], [BERRY.x - 3.5, 1.55, BERRY.z - 3.8], 34], [1, [BERRY.x - 7.8, 0.9, BERRY.z - 6.2], [BERRY.x - 3.5, 1.55, BERRY.z - 3.8], 34]),
  veg: { grassR: 12, extra: MEADOW_TREES },
  setup(c) {
    const ix = BERRY.x - 3.5, iz = BERRY.z - 3.8;
    const ise = c.person('ISE', { x: ix, z: iz, yaw: yawTo(ix, iz, BERRY.x - 7.8, BERRY.z - 6.2) + 0.35 }); ise.anim = (P) => P.pose('raiseHand', 1.0, { side: 'R' });
    SPAWN.filter(s => !['ISE'].includes(s.who)).slice(0, 14).forEach((s, i) => {
      const a = i * 2.39996 + 1.0, d = 2.0 + Math.sqrt(i + 1) * 1.15;
      const x = ix + Math.cos(a) * d + 1.2, z = iz + Math.sin(a) * d + 1.4;
      const P = c.person(s.who, { x, z, yaw: yawTo(x, z, ix, iz) }); P.anim = (Q) => Q.pose('idle', 1.0 + i);
    });
  },
});
