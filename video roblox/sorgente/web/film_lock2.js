// "Everyone has a number above their head" PART 2 -- shots for script_lock2.py
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


const STRANGER = { skin: 0xd9b08a, shirt: 0x26262c, pants: 0x1a1a1e, hair: { style: 'short', color: 0x121212 }, face: 'smug' };
function bedroom() {
  room({ wall: 0x5a6aa8, floor: '#7a5a3a', w: 9, d: 8, h: 5, lamp: 6 }); const b = bed(0, -1.6); b.scale.setScalar(0.45);
  const cb = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.7, 0.1), new THREE.MeshStandardMaterial({ color: 0x111111 })); cb.position.set(1.15, 3.1, -3.8); add(cb);
  label('12:00', 1.15, 3.1, -3.74, { w: 1.4, size: 120, color: '#ff3b30' }); getScene().userData.hemi.intensity = 0.7; shadowAt(0, -2, 8);
}
function bench(o = {}) {
  street(o); const b = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.18, 0.8), new THREE.MeshStandardMaterial({ color: 0x9a6a3a })); b.position.set(0, 0.95, -6.4); b.castShadow = true; add(b);
  const back = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.8, 0.12), new THREE.MeshStandardMaterial({ color: 0x9a6a3a })); back.position.set(0, 1.5, -6.85); add(back);
  for (const s of [-1.2, 1.2]) { const l = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.95, 0.7), new THREE.MeshStandardMaterial({ color: 0x3a3a40 })); l.position.set(s, 0.47, -6.4); add(l); }
  const A = person(ME, -0.65, -6.4, 0.15, 'sit', { y: 0.55, badge: 100 }); A.id = 'me';
  const M = person(MIA, 0.65, -6.4, -0.15, 'sit', { y: 0.55, badge: 74 }); M.id = 'mia';
  shadowAt(0, -6, 8); return { A, M };
}
// M01: the lock opens: 100
shot('M01', { scene: { interior: true }, build() { bedroom(); const A = person(ME, 0, -2.6, 0, 'situp', { y: 0.35, badge: (u) => (u < 1.75 ? 'UNLOCK' : 100), face: 'shock' }); A.id = 'me'; on((u) => A.setFace(u > 2.0 ? 'smile' : 'shock')); }, cam: CU(0, -2.6, { hy: 1.91, d: 3.0, push: 0.5 }) });
// M02: the whole town waiting outside my house
shot('M02', { build() {
  street({ fence: false }); const A = person(ME, 0, -10.3, 0, 'shock', { badge: 100 }); A.id = 'me';
  const spots = [[-2.2, -7.6], [-0.8, -7.9], [0.8, -7.8], [2.2, -7.5], [-3.0, -6.4], [-1.4, -6.5], [0.2, -6.3], [1.6, -6.4], [3.0, -6.2]];
  spots.forEach(([x, z], i) => { const F = person(P_[i % P_.length], x, z, Math.PI + x * 0.08, i % 2 ? 'cheer' : 'wave', { badge: [83, 76, 64, 91, 58, 72, 88, 47, 69][i] }); F.id = 'c' + i; });
  shadowAt(0, -8, 10);
}, cam: dolly(P([0.3, 5.2, -1.8], [0, 1.6, -10.0], 58), P([0.2, 4.6, -3.0], [0, 1.7, -10.0], 58)) });
// M03: the ones who avoided me want to be my best friend
shot('M03', { build() {
  street(); const A = person(ME, 0, -6.3, 0, 'shrug', { badge: 100, face: 'confused' }); A.id = 'me';
  const a = person(P_[3], -1.25, -6.0, 0.9, 'wave', { badge: 83 }); a.id = 'a'; const b = person(P_[1], 1.25, -6.0, -0.9, 'cheer', { badge: 76 }); b.id = 'b';
  shadowAt(0, -6, 8);
}, cam: two(0, -6.2, { d: 4.6 }) });
// M04: even the other hundred lost half his fans
shot('M04', { build() {
  street(); const S = person(STAR, 0, -6.3, 0, 'idle', { badge: 100, face: 'confused' }); S.id = 'star';
  const f = person(P_[6], -1.2, -6.6, 0.4, 'idle', { badge: 34 }); f.id = 'f';
  on((u) => { S.pose = u > 1.0 ? 'shrug' : 'idle'; });
  shadowAt(0, -6, 8);
}, cam: two(0, -6.3, { d: 4.4 }) });
// M05: everyone wanted my number (my phone number)
shot('M05', { build() {
  street(); const A = person(ME, 0, -6.3, 0, 'idle', { badge: 100 }); A.id = 'me'; on((u) => A.setFace(u > 1.2 ? 'smug' : 'shock'));
  [[-1.5, -5.8, 0.9, 88], [1.5, -5.8, -0.9, 81], [-1.9, -6.9, 0.4, 69], [1.9, -6.9, -0.4, 92]].forEach(([x, z, yw, b], i) => {
    const F = person(P_[(i + 3) % P_.length], x, z, Math.PI + yw * -1 + (x < 0 ? -0.6 : 0.6) * 0, 'point', { badge: b }); F.root.rotation.y = Math.atan2(0 - x, -6.3 - z); F.id = 'p' + i;
    const ph = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.3, 0.03), new THREE.MeshStandardMaterial({ color: 0x18181c })); F.armR.add(ph); ph.position.set(0, -4.1, 0.3); ph.scale.setScalar(2.38); });
  shadowAt(0, -6, 8);
}, cam: dolly(P([0.2, 2.4, -1.4], [0, 1.6, -6.0], 58), P([0.1, 2.3, -2.0], [0, 1.65, -6.0], 58)) });
// M06: but Mia didn't change at all
shot('M06', { build() { bench(); }, cam: two(0, -6.4, { d: 4.0 }) });
// M07: Mia: "I liked you before I knew your number"
shot('M07', { build() { const { M } = bench(); M.look = -0.4; }, cam: CU(0.65, -6.4, { hy: 2.11, d: 3.4, side: 0.0 }) });
// M08: worth more than any number (golden hour)
shot('M08', { scene: { sky: ['#ff9a5a', '#ffd9a0'] }, build() { const { A, M } = bench(); A.look = 0.45; M.look = -0.45; A.setFace('smile'); getScene().userData.sun.color.set(0xffc080); }, cam: dolly(P([0, 1.9, -1.6], [0, 1.5, -6.4], 54), P([0, 1.85, -2.6], [0, 1.55, -6.4], 54)) });
// M09: another guy with a lock above his head
shot('M09', { build() {
  street(); [[-2.4, -5.4, 88], [-1.1, -5.6, 64], [1.3, -5.5, 77], [2.5, -5.3, 59]].forEach(([x, z, b], i) => { const F = person(P_[(i + 1) % P_.length], x, z, (i % 2 ? 0.3 : -0.3), 'idle', { badge: b }); F.id = 'x' + i; });
  const X = person(STRANGER, 0.1, -7.6, 0, 'idle', { badge: (u) => (u > 1.6 ? 'LOCK' : null) }); X.id = 'stranger';
  shadowAt(0, -6, 10);
}, cam: dolly(P([0.2, 2.2, -0.6], [0.1, 1.7, -7.6], 52), P([0.15, 2.05, -3.6], [0.1, 1.6, -7.6], 52)) });
// M10-M11: he's staring at Mia
shot('M10', { build() { street(); const X = person(STRANGER, 0, -6.3, 0, 'idle', { badge: 'LOCK' }); X.id = 'stranger'; on((u) => { X.look = -0.25 * sm(0.2, 0.9, u); }); shadowAt(0, -6, 8); }, cam: CU(0, -6.3, { side: 0.35, push: 0.6 }) });
shot('M11', { build() { street(); const X = person(STRANGER, 0, -6.3, 0, 'idle', { badge: 'LOCK' }); X.id = 'stranger'; X.look = -0.25; shadowAt(0, -6, 8); }, cam: CU(0, -6.3, { side: 0.1, d: 2.7, push: 0.3 }) });
