// Thumbnail set-ups (not part of the film's timeline)
import { shotOnly } from './registry.js';
import { TorchField } from '../lib/fx.js';
import { mulberry32 } from '../lib/noise.js';
import { K, TIME, BERRY, MEADOW_TREES, SPAWN, castleLocal, CASTLE_YAW, LANDING, BLUE, yawTo } from './sets.js';

// A-right: the king on the palace landing, torch-lit, red banners, the facade behind him
shotOnly('thumbA_king', {
  hours: TIME.golden, cloud: 0.4, year: 1925, exposure: 1.1,
  cam: K([0, castleLocal(2.6, 3.4, 10.4), castleLocal(0.0, 4.5, 6.7), 34], [1, castleLocal(2.6, 3.4, 10.4), castleLocal(0.0, 4.5, 6.7), 34], { abs: true }),
  veg: { r0: 40 }, shadow: { x: LANDING[0], z: LANDING[2], r: 10 },
  setup(c) {
    const k = c.personAt('KASSA19', LANDING[0], LANDING[1], LANDING[2], { yaw: CASTLE_YAW + 0.45, acc: ['crown', 'cape'] }); k.anim = (P) => P.pose('armsCrossed', 1.0);
    for (const s of [-1, 1]) { const b = castleLocal(s * 3.2, 3.0, 6.3); c.proto('bannerRed', 0, b[0], b[2], CASTLE_YAW, 1.25, 0, { y: b[1] }); }
    for (const s of [-1, 1]) { const p = castleLocal(s * 1.8, 3.0, 8.0); c.fire(p[0], p[2], { size: 0.45, n: 14, lightIntensity: 14, lightDist: 8, y: p[1] + 1.7 }); }
  },
});
// A-left: Orun raises her hand in front of the torch-lit Assembly (open ground, blue hour)
const ASM = { x: 56, z: -87 };
shotOnly('thumbA_vote', {
  hours: TIME.dusk + 0.15, cloud: 0.25, year: 1931, exposure: 1.15,
  cam: K([0, [ASM.x + 0.8, 1.0, ASM.z + 3.9], [ASM.x, 1.75, ASM.z], 36], [1, [ASM.x + 0.8, 1.0, ASM.z + 3.9], [ASM.x, 1.75, ASM.z], 36]),
  veg: { r0: 40 }, shadow: { x: ASM.x, z: ASM.z, r: 12 },
  setup(c) {
    const o = c.person('ORUN', { x: ASM.x, z: ASM.z, yaw: yawTo(ASM.x, ASM.z, ASM.x + 0.8, ASM.z + 3.9) - 0.25, acc: BLUE }); o.anim = (P) => P.pose('raiseHand', 1.0, { side: 'R' });
    for (const s of [-1, 1]) c.proto('bannerBlue', 0, ASM.x + s * 3.0, ASM.z - 2.5, 0, 1.1);
    const n = 320, cr = c.crowd(n, { colors: [0xf2f2f2, 0xeeeeea, 0x2a5bd7] }), r = mulberry32(5), P = [];
    for (let i = 0; i < n; i++) { const x = ASM.x + (r() - 0.5) * 26, z = ASM.z - 3.5 - r() * 16; cr.set(i, x, c.h(x, z), z, yawTo(x, z, ASM.x, ASM.z), 0); if (i % 2 === 0) P.push([x + 0.2, c.h(x, z) + 2.0, z]); }
    c.on(t => cr.update(t));
    const tf = new TorchField(P.length); c.add(tf.group); tf.setPositions(P);
    for (const s of [-1, 1]) c.fire(ASM.x + s * 2.0, ASM.z - 1.6, { size: 0.45, n: 14, lightIntensity: 16, lightDist: 10, dy: 1.7 });
  },
});
// B: the raised hand among the white figures, golden hour, low angle (nobody between us and her)
shotOnly('thumbB', {
  hours: TIME.golden + 0.1, cloud: 0.35, year: 0, town: false,
  cam: K([0, [BERRY.x - 8.4, 0.75, BERRY.z - 6.6], [BERRY.x - 3.5, 1.35, BERRY.z - 3.8], 36], [1, [BERRY.x - 8.4, 0.75, BERRY.z - 6.6], [BERRY.x - 3.5, 1.35, BERRY.z - 3.8], 36]),
  veg: { grassR: 12, extra: MEADOW_TREES },
  setup(c) {
    const ix = BERRY.x - 3.5, iz = BERRY.z - 3.8, cx = BERRY.x - 8.4, cz = BERRY.z - 6.6;
    const toCam = Math.atan2(cx - ix, cz - iz);
    const ise = c.person('ISE', { x: ix, z: iz, yaw: toCam + 0.3 }); ise.anim = (P) => P.pose('raiseHand', 1.0, { side: 'R' });
    SPAWN.filter(s => s.who !== 'ISE').slice(0, 15).forEach((s, i) => {
      const a = toCam + Math.PI + (i / 14 - 0.5) * 3.6, d = 2.6 + (i % 4) * 1.5;
      const x = ix + Math.sin(a) * d, z = iz + Math.cos(a) * d;
      const P = c.person(s.who, { x, z, yaw: yawTo(x, z, ix, iz) }); P.anim = (Q) => Q.pose('idle', 1.0 + i);
    });
  },
});
