// "I can see how many lies you told today" -- shots for script_lies.py
import { THREE, shot, person, street, room, bed, desk, label, add, on, shadowAt, camLerp, sm, lerp, getScene } from './kit.js';

const ME = { skin: 0xf2c79a, shirt: 0x2fa84f, pants: 0x2f4a8a, hair: { style: 'bowl', color: 0x6b3a1e }, logo: 0xffd23a };
const MIA = { skin: 0xe8b98a, shirt: 0xf5c84a, pants: 0x3b5ba8, hair: { style: 'long', color: 0x3a2214 } };
const DOC = { skin: 0xf2c79a, shirt: 0x8fb0d8, pants: 0x3a3a45, hair: { style: 'white', color: 0xe8e8e8 }, acc: ['coat', 'glasses'] };
const STAR = { skin: 0xffd9b3, shirt: 0xffffff, pants: 0x2a2a35, hair: { style: 'spiky', color: 0xf2d24a }, acc: ['shades', 'chain'], face: 'smug' };
const QUEEN = { skin: 0xf6d2b0, shirt: 0xe85a9a, pants: 0x2a2a35, hair: { style: 'long', color: 0xf2d24a }, face: 'smug' };
const P_ = [
  { skin: 0xf2c79a, shirt: 0xf28c28, pants: 0x2f4a8a, hair: { style: 'spiky', color: 0x2a1a10 }, acc: ['headband'] },
  { skin: 0x8a5a3a, shirt: 0x3fa7d6, pants: 0xc9b38a, hair: { style: 'short', color: 0x1a1210 } },
  { skin: 0xffd9b3, shirt: 0xb04ac9, pants: 0x4a4a55, hair: { style: 'bun', color: 0x8a3a1a } },
  { skin: 0xc68a5a, shirt: 0xd23a3a, pants: 0x2a2a35, hair: { style: 'long', color: 0x2a1a10 } },
  { skin: 0xf2c79a, shirt: 0x6cc24a, pants: 0x3b5ba8, hair: { style: 'short', color: 0x8a5a2a } },
  { skin: 0x5a3a26, shirt: 0x4a5ad6, pants: 0x2f4a8a, hair: { style: 'short', color: 0x111111 }, acc: ['glasses'] },
  { skin: 0xf6d2b0, shirt: 0x9a9aa8, pants: 0x55555f, hair: { style: 'spiky', color: 0x6a6a6a } },
  { skin: 0xe8b98a, shirt: 0x36c2b4, pants: 0x2a2a35, hair: { style: 'bun', color: 0xf2d24a } },
];
const P = (a, b, fov = 50) => ({ pos: a, tgt: b, fov });
const dolly = (a, b) => (u, d) => camLerp(a, b, u / d);
// close-up: head in the top third, badge above, the word on the chest (standing head at 1.94 m)
const CU = (x, z, o = {}) => { const d = o.d ?? 3.2, sx = o.side ?? 0.25, hy = o.hy ?? 1.94; return dolly(P([x + sx, hy - 0.09, z + d], [x, hy - 0.49, z], o.fov ?? 50), P([x + sx * 0.5, hy - 0.09, z + d - (o.push ?? 0.5)], [x, hy - 0.49, z], o.fov ?? 50)); };
const two = (x, z, o = {}) => dolly(P([x + 0.2, 1.85, z + (o.d ?? 4.2)], [x, 1.4, z], o.fov ?? 54), P([x + 0.1, 1.85, z + (o.d ?? 4.2) - 0.5], [x, 1.42, z], o.fov ?? 54));
const walk = (def, x0, z, dir, badge, sp = 1.3, o = {}) => person(def, x0, z, dir > 0 ? Math.PI / 2 : -Math.PI / 2, 'walk', { badge, ...o, anim: (A, u) => { A.root.position.x = x0 + dir * sp * u; } });
const at = (u0) => (u) => (u > u0 ? true : false);


const EMMA = { skin: 0xf6d2b0, shirt: 0x7fc8f0, pants: 0x3b5ba8, hair: { style: 'long', color: 0xc8904a } };
const MOM = { skin: 0xf0c090, shirt: 0xe85a9a, pants: 0x3b5ba8, hair: { style: 'long', color: 0x7a3a1a } };
const TEACH = { skin: 0x9c6a45, shirt: 0x23356b, pants: 0x2a2a35, hair: { style: 'bun', color: 0x9a9a9a }, acc: ['glasses', 'tie'] };
const MAYOR = { skin: 0xf2c79a, shirt: 0x1f2a44, pants: 0x1f2a44, hair: { style: 'white', color: 0xdedede }, acc: ['tie'], face: 'smug' };
const flip = (a, b, t0) => (u) => (u < t0 ? a : b);
const box = (w, h, d, c, x, y, z) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshStandardMaterial({ color: c, roughness: 0.6 })); m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; add(m); return m; };
function bench(o = {}) {
  street(o); box(2.8, 0.18, 0.8, 0x9a6a3a, 0, 0.95, -6.4); box(2.8, 0.8, 0.12, 0x9a6a3a, 0, 1.5, -6.85);
  for (const s of [-1.2, 1.2]) box(0.12, 0.95, 0.7, 0x3a3a40, s, 0.47, -6.4);
  const A = person(ME, -0.65, -6.4, 0.15, 'sit', { y: 0.55 }); A.id = 'me';
  const E = person(EMMA, 0.65, -6.4, -0.15, 'sit', { y: 0.55, badge: o.emma ?? 0 }); E.id = 'emma';
  if (o.lit) {   // a warm street lamp next to the bench
    box(0.14, 4.2, 0.14, 0x2a2a30, 1.9, 2.1, -6.0); const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.22, 16, 12), new THREE.MeshBasicMaterial({ color: 0xffe6b0 })); bulb.position.set(1.9, 4.25, -6.0); add(bulb);
    const L = new THREE.PointLight(0xffd29a, 9, 12, 1.4); L.position.set(1.2, 3.6, -4.6); add(L); getScene().userData.hemi.intensity = 0.95;
  }
  shadowAt(0, -6, 8); return { A, E };
}
// B01: I can see a number above everyone's head
shot('B01', { build() {
  street(); const A = person(ME, 0, -5.4, 0, 'idle'); A.id = 'me';
  [[P_[0], -2.4, -6.6, 1, 2], [P_[3], 2.6, -6.8, -1, 0], [P_[5], -3.4, -7.4, 1, 5]].forEach(([d, x, z, dir, b], i) => walk(d, x, z, dir, b, 0.9).id = 'w' + i);
  shadowAt(0, -6, 10);
}, cam: dolly(P([0.4, 2.0, -1.6], [0, 1.6, -6.2], 56), P([0.2, 1.95, -2.4], [0, 1.65, -6.2], 56)) });
// B02: lies told today; only I can see them
shot('B02', { build() {
  street(); [[P_[1], -3.6, -6.0, 1, 3], [P_[2], -1.0, -6.0, 1, 1], [P_[4], 2.4, -6.0, -1, 7], [P_[7], 0.6, -4.9, -1, 0]].forEach(([d, x, z, dir, b], i) => walk(d, x, z, dir, b, 1.0).id = 'q' + i);
  shadowAt(0, -5, 12);
}, cam: dolly(P([-0.6, 2.8, 5.5], [0, 1.7, -6], 60), P([0.6, 2.5, 4.2], [0, 1.7, -6], 60)) });
// B03: midnight: everyone back to zero
shot('B03', { scene: { night: true }, build() {
  street({ lit: true }); const a = person(P_[3], -0.8, -6.3, 0.2, 'idle', { badge: flip(12, 0, 1.75) }); a.id = 'a'; const b = person(P_[0], 0.8, -6.3, -0.2, 'idle', { badge: flip(7, 0, 1.75) }); b.id = 'b';
  const c0 = label('11:59', 0, 4.6, -10.9, { w: 2.6, size: 120, color: '#ff3b30' });
  const c = label('12:00', 0, 4.6, -10.88, { w: 2.6, size: 120, color: '#ff3b30' }); c.visible = false;
  on((u) => { c.visible = u > 1.7; c0.visible = !c.visible; }); getScene().userData.sun.intensity = 0.9; shadowAt(0, -6, 8);
}, cam: two(0, -6.3, { d: 4.6 }) });
// B04: Mom loves my cooking: plus one
shot('B04', { scene: { interior: true }, build() {
  room({ wall: 0xf6e7b8, floor: '#c9a57a', w: 10, d: 9, h: 5, lamp: 30 });
  box(3.2, 0.2, 1.8, 0xffffff, 0, 1.2, -2.6); for (const s of [-1.4, 1.4]) for (const t of [-0.7, 0.7]) box(0.15, 1.2, 0.15, 0x8a5a34, s, 0.6, -2.6 + t);
  box(1.4, 3.2, 1.2, 0xdfe6ea, 3.2, 1.6, -3.6); const plate = box(0.6, 0.06, 0.6, 0xffffff, 0, 1.33, -2.1); box(0.4, 0.12, 0.3, 0x5a3a1a, 0, 1.4, -2.1);
  const M = person(MOM, 0, -3.5, 0, 'idle', { badge: flip(0, 1, 1.75), y: 0.0 }); M.id = 'mom'; M.pose = 'eat';
  on((u) => M.setFace(u > 1.0 ? 'smile' : 'smile'));
  shadowAt(0, -3, 8);
}, cam: CU(0, -3.5, { d: 3.4 }) });
// B05: the teacher: "this won't be on the test" -- plus one
shot('B05', { scene: { interior: true }, build() {
  room({ wall: 0xf2e6c8, floor: '#c79a6a', w: 12, d: 12, h: 6, lamp: 40 });
  box(5, 2.2, 0.2, 0x2f5a3a, -0.6, 3.1, -5.75); label('TEST\nFRIDAY', -0.6, 3.1, -5.6, { w: 4.4, size: 64 });
  const T = person(TEACH, 0, -4.4, 0, 'present', { badge: flip(0, 1, 1.95) }); T.id = 'tch'; on((u) => T.setFace(u > 1.95 ? 'smug' : 'smile'));
  shadowAt(0, -4, 8);
}, cam: CU(0, -4.4, { d: 3.4 }) });
// B06: the mayor's speech: forty-seven
shot('B06', { build() {
  street(); box(1.4, 1.4, 0.8, 0x7a2a2a, 0, 0.7, -5.6); label('VOTE\nFOR ME', 0, 0.9, -5.18, { w: 1.3, size: 70 });
  const Mx = person(MAYOR, 0, -6.3, 0, 'present', { badge: (u) => Math.round(lerp(18, 47, sm(0.3, 1.2, u))) }); Mx.id = 'mayor';
  shadowAt(0, -6, 8);
}, cam: CU(0, -6.3, { d: 3.6 }) });
// B07: Emma, always at zero
shot('B07', { build() { street(); const E = person(EMMA, 0, -6.3, 0, 'wave', { badge: 0 }); E.id = 'emma'; shadowAt(0, -6, 8); }, cam: CU(0, -6.3) });
// B08: every single day; the only person I trust
shot('B08', { scene: { sky: ['#ff9a5a', '#ffd9a0'] }, build() { const { A, E } = bench(); A.look = 0.45; E.look = -0.45; }, cam: two(0, -6.4, { d: 4.0 }) });
// B09: until tonight
shot('B09', { scene: { night: true }, build() { street({ lit: true }); const A = person(ME, 0, -6.3, 0, 'idle', { face: 'confused' }); A.id = 'me'; shadowAt(0, -6, 8); }, cam: CU(0, -6.3, { push: 0.8 }) });
// B10-B12: "where were you yesterday?" -- "at home, all night" -- still zero
shot('B10', { scene: { night: true }, build() { const { A } = bench({ lit: true }); A.look = 0.5; A.pose = 'sit'; }, cam: two(0, -6.4, { d: 4.0 }) });
shot('B11', { scene: { night: true }, build() { const { E } = bench({ lit: true }); E.look = -0.35; }, cam: CU(0.65, -6.4, { hy: 2.11, d: 3.3, side: 0 }) });
shot('B12', { scene: { night: true }, build() { const { A } = bench({ lit: true }); A.setFace('smile'); }, cam: CU(-0.65, -6.4, { hy: 2.11, d: 3.3, side: 0 }) });
// B13-B14: then she smiled and said "I love you" -- the number flips to one
shot('B13', { scene: { night: true }, build() { const { E } = bench({ lit: true, emma: (u) => 0 }); E.look = -0.35; }, cam: CU(0.65, -6.4, { hy: 2.11, d: 3.3, side: 0, push: 0.3 }) });
shot('B14', { scene: { night: true }, build() { const { E } = bench({ lit: true, emma: flip(0, 1, 0.82) }); E.look = -0.35; }, cam: CU(0.65, -6.4, { hy: 2.11, d: 3.0, side: 0, push: 0.2 }) });
// B15: and her number went up to one (on me: shocked)
shot('B15', { scene: { night: true }, build() { const { A } = bench({ lit: true, emma: 1 }); A.setFace('shock'); A.look = 0.4; }, cam: two(0, -6.4, { d: 3.6 }) });
// B16: comment truth for part two (on Emma's 1)
shot('B16', { scene: { night: true }, build() { const { E } = bench({ lit: true, emma: 1 }); E.look = -0.35; }, cam: CU(0.65, -6.4, { hy: 2.11, d: 2.9, side: 0, push: 0.25 }) });
