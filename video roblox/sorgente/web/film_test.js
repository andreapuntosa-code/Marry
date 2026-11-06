// v2 look test: the midnight library, the potion maker, the forbidden page
import { THREE, shot, person, add, on, camLerp, sm, lerp, getScene } from './kit.js';
import { library, potionShop, glowBook, sparkles, magicCircle, dust } from './sets.js';
const ME = { skin: 0xf2c79a, shirt: 0x6a2a8a, pants: 0x2a2a3a, hair: { style: 'bowl', color: 0xe8c24a } };
const OLD = { skin: 0xf0d0b0, shirt: 0x6a3aa8, pants: 0x2a2a35, hair: { style: 'white', color: 0xf0f0f0 }, acc: ['glasses'] };
const P = (a, b, fov = 50) => ({ pos: a, tgt: b, fov });
const dolly = (a, b) => (u, d) => camLerp(a, b, u / d);
const LIB = { interior: true, bloom: 0.4, bloomThreshold: 0.85, env: 0.45, exposure: 1.0, dof: { aperture: 0.0025, maxblur: 0.006 } };
// T01: the grand hall, a long low dolly down the red carpet
shot('T01', { scene: LIB, build() { library(); const A = person(ME, 0, -9, Math.PI, 'walk'); A.anim = (Q, u) => { Q.root.position.z = -9 - u * 0.9; }; },
  cam: dolly(P([0.6, 1.3, 4.0], [0, 3.2, -40], 58), P([0.3, 1.5, -2.0], [0, 3.6, -40], 58)), focus: () => 9 });
// T02: close on me, an open book glowing in my hands
shot('T02', { scene: LIB, build() {
  library({ pagesN: 50 }); const A = person(ME, 0, -12, 0, 'present'); A.pitch = 0.3; A.setFace('shock');
  const b = new THREE.Group(); b.position.set(0, 1.42, -11.45); b.rotation.x = 0.35; add(b); glowBook(b, { power: 0.6 });
  sparkles(0, 1.5, -11.45, { n: 120, R: 0.5, h: 1.8 });
}, cam: dolly(P([0.35, 1.95, -9.0], [0, 1.55, -12], 46), P([0.2, 1.9, -9.6], [0, 1.6, -12], 46)) });
// T03: the potion maker behind the counter
shot('T03', { scene: { interior: true, bloom: 0.5, bloomThreshold: 0.75, env: 0.4, exposure: 1.0, dof: { aperture: 0.003, maxblur: 0.007 } }, build() {
  potionShop(); const O = person(OLD, 0, -3.8, 0, 'think'); on((u) => { O.pose = u > 1.6 ? 'point' : 'think'; O.setFace(u > 1.6 ? 'confused' : 'smile'); });
}, cam: dolly(P([0.3, 2.05, 0.4], [0, 1.65, -3.8], 48), P([0.15, 2.0, -0.2], [0, 1.7, -3.8], 48)) });
// T04: of course I read it: a magic circle wakes up around me
shot('T04', { scene: LIB, build() {
  library({ pagesN: 90 }); const A = person(ME, 0, -12, 0, 'present'); A.pitch = 0.25;
  const b = new THREE.Group(); b.position.set(0, 1.42, -11.45); b.rotation.x = 0.35; add(b); glowBook(b, { power: 1.0 });
  magicCircle(0, -12, 1.8, { amount: (u) => sm(0.4, 1.4, u) }); sparkles(0, 0.2, -12, { n: 220, R: 1.7, h: 3.2, amount: (u) => sm(0.5, 1.5, u) });
  on((u) => { A.setFace(u > 0.8 ? 'shock' : 'smile'); A.pose = u > 1.6 ? 'shock' : 'present'; });
}, cam: (u, d) => { const a = -0.5 + u * 0.18; return P([Math.sin(a) * 4.2, 1.9 + u * 0.05, -12 + Math.cos(a) * 4.2], [0, 1.4, -12], 52); } });
