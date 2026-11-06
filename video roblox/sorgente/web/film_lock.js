// "Everyone has a number above their head" (attractiveness rating, the protagonist has a lock) -- shots for script_lock.py
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

// L01: the town, everyone has a number
shot('L01', { build() {
  street();
  [[P_[0], -4.4, 64], [P_[3], -1.4, 88, 1.1], [P_[4], 2.0, 37], [QUEEN, -2.6, 97, 1.0]].forEach(([d, x, b, sp], i) => walk(d, x, i === 3 ? -4.9 : -6.0, 1, b, sp).id = 'w' + i);
  [[P_[1], 3.8, 72], [P_[5], 0.4, 45, 1.0]].forEach(([d, x, b, sp], i) => walk(d, x, -5.2, -1, b, sp).id = 'v' + i);
  shadowAt(0, -5, 14);
}, cam: dolly(P([-0.6, 2.8, 5.5], [0, 1.7, -6], 60), P([0.6, 2.5, 4.2], [0, 1.7, -6], 60)) });
// L02: one to a hundred: a 96, then a 23
shot('L02', { build() { street(); const A = person(QUEEN, 0, -6.3, 0, 'idle', { badge: 96 }); A.id = 'q'; shadowAt(0, -6, 8); }, cam: CU(0, -6.3) });
shot('L02', { off: 1.1, build() { street(); const A = person(P_[6], 15, -6.3, 0, 'shrug', { badge: 23, face: 'confused' }); A.id = 'g'; shadowAt(15, -6, 8); }, cam: CU(15, -6.3, { side: -0.3 }) });
// L03: nobody dates below their number: a 92 and a 94 hand in hand; a 41 waves, ignored
shot('L03', { build() {
  street();
  const a = walk(STAR, -1.2, -6.0, 1, 92, 0.55, { face: 'smile' }); a.id = 'a'; const b = walk(QUEEN, -1.2, -6.9, 1, 94, 0.55); b.id = 'b';
  const c = person(P_[6], 1.6, -5.4, -1.9, 'wave', { badge: 41 }); c.id = 'c'; on((u) => c.setFace(u > 1.2 ? 'confused' : 'smile'));
  shadowAt(0, -6, 10);
}, cam: dolly(P([0.2, 2.5, 1.6], [0.1, 1.45, -6.0], 60), P([0.2, 2.4, 0.9], [0.2, 1.5, -6.0], 60)) });
// L04: nineties date nineties (then) fifties date fifties
shot('L04', { build() { street(); const a = person(STAR, -0.75, -6.3, 0.25, 'idle', { badge: 93 }); a.id = 'a'; const b = person(QUEEN, 0.75, -6.3, -0.25, 'idle', { badge: 91 }); b.id = 'b'; shadowAt(0, -6, 8); }, cam: two(0, -6.3) });
shot('L04', { off: 1.12, build() { street(); const a = person(P_[1], 14.25, -6.3, 0.25, 'idle', { badge: 52 }); a.id = 'c'; const b = person(P_[2], 15.75, -6.3, -0.25, 'idle', { badge: 54 }); b.id = 'd'; shadowAt(15, -6, 8); }, cam: two(15, -6.3) });
// L05: everyone dates up: she leaves her 70 for a 79
shot('L05', { build() {
  street();
  const boy = person(P_[0], -1.6, -6.3, 0.3, 'idle', { badge: 70 }); boy.id = 'b70';
  const up = person(P_[5], 1.7, -6.3, -0.4, 'idle', { badge: 79, face: 'smug' }); up.id = 'b79';
  const g = person(P_[7], -0.7, -6.3, 0, 'idle', { badge: 71 }); g.id = 'g71';
  on((u) => { const k = sm(0.35, 1.3, u); g.root.position.x = lerp(-0.7, 1.0, k); g.root.rotation.y = k > 0 && k < 1 ? Math.PI / 2 : (k >= 1 ? 1.2 : 0); g.pose = k > 0 && k < 1 ? 'walk' : 'idle'; boy.setFace(u > 0.7 ? 'shock' : 'smile'); boy.pose = u > 1.1 ? 'shrug' : 'idle'; });
  shadowAt(0, -6, 8);
}, cam: two(0, -6.3, { d: 7.2, fov: 60 }) });
// L06: a hundred: the whole town chases you
shot('L06', { build() {
  street(); const S = person(STAR, 0, -5.4, 0, 'wave', { badge: 100 }); S.id = 'star';
  [[-1.5, -6.2, 0.5, 81], [1.5, -6.2, -0.5, 77], [-2.3, -7.2, 0.4, 86], [2.3, -7.2, -0.4, 84], [-0.8, -7.3, 0.2, 68], [0.8, -7.4, -0.2, 72]].forEach(([x, z, yw, b], i) => { const F = person(P_[i], x, z, yw, i % 2 ? 'cheer' : 'wave', { badge: b }); F.id = 'f' + i; });
  shadowAt(0, -6, 10);
}, cam: dolly(P([0.2, 2.6, 0.2], [0, 1.6, -6.4], 58), P([0.1, 2.4, -0.8], [0, 1.6, -6.4], 58)) });
// L07: but me: a lock
shot('L07', { build() { street(); const A = person(ME, 0, -6.3, 0, 'idle', { badge: (u) => (u > 1.85 ? 'LOCK' : null) }); A.id = 'me'; on((u) => A.setFace(u > 1.9 ? 'smug' : 'smile')); shadowAt(0, -6, 8); }, cam: CU(0, -6.3, { push: 0.8 }) });
// L08: the doctor's office: locked until 18
shot('L08', { scene: { interior: true }, build() {
  room({ wall: 0xe6f2f2, floor: '#c9d2d6', w: 10, d: 9, h: 5, lamp: 35 });
  const poster = new THREE.Mesh(new THREE.BoxGeometry(2.6, 1.6, 0.08), new THREE.MeshStandardMaterial({ color: 0xffffff })); poster.position.set(-1.6, 2.9, -4.3); add(poster);
  label('LOCKED\nUNTIL 18', -1.6, 2.9, -4.24, { w: 2.5, size: 66, color: '#d0283a' });
  const D = person(DOC, -1.3, -2.6, 0.5, 'point', { badge: 58 }); D.id = 'doc';
  const bedx = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.9, 2.6), new THREE.MeshStandardMaterial({ color: 0xffffff })); bedx.position.set(1.0, 0.45, -2.8); bedx.castShadow = true; add(bedx);
  const A = person(ME, 1.0, -2.2, -0.35, 'sit', { y: 0.45, badge: 'LOCK', face: 'confused' }); A.id = 'me';
  shadowAt(0, -2, 8);
}, cam: dolly(P([-0.3, 2.2, 3.4], [-0.3, 1.6, -2.6], 60), P([-0.3, 2.1, 2.7], [-0.3, 1.65, -2.6], 60)) });
// L09: so nobody knows if I'm a ten... or a hundred
shot('L09', { build() { street(); const A = person(ME, 0, -6.3, 0, 'shrug', { badge: 'LOCK' }); A.id = 'me'; shadowAt(0, -6, 8); }, cam: CU(0, -6.3, { push: 0.7 }) });
// L10: some people avoid me, just in case
shot('L10', { build() {
  street(); const A = person(ME, 0, -6.0, 0, 'idle', { badge: 'LOCK', face: 'confused' }); A.id = 'me';
  [[P_[3], -3.6, 1, 83], [P_[1], 3.4, -1, 76]].forEach(([d, x0, dir, b], i) => { const F = person(d, x0, -6.0, dir > 0 ? Math.PI / 2 : -Math.PI / 2, 'walk', { badge: b, anim: (Q, u) => { const x = x0 + dir * 1.5 * u; Q.root.position.x = x; Q.root.position.z = -6.0 + 1.3 * Math.exp(-((x) ** 2) / 1.2); } }); F.id = 'p' + i; });
  shadowAt(0, -6, 8);
}, cam: dolly(P([0.3, 2.2, -1.0], [0, 1.5, -6.0], 56), P([0.2, 2.1, -1.6], [0, 1.55, -6.0], 56)) });
// L11: Mia, a seventy-four, sits with me anyway
function bench() {
  street(); const b = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.18, 0.8), new THREE.MeshStandardMaterial({ color: 0x9a6a3a })); b.position.set(0, 0.95, -6.4); b.castShadow = true; add(b);
  const back = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.8, 0.12), new THREE.MeshStandardMaterial({ color: 0x9a6a3a })); back.position.set(0, 1.5, -6.85); add(back);
  for (const s of [-1.2, 1.2]) { const l = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.95, 0.7), new THREE.MeshStandardMaterial({ color: 0x3a3a40 })); l.position.set(s, 0.47, -6.4); add(l); }
  const A = person(ME, -0.65, -6.4, 0.15, 'sit', { y: 0.55, badge: 'LOCK' }); A.id = 'me';
  const M = person(MIA, 0.65, -6.4, -0.15, 'sit', { y: 0.55, badge: 74 }); M.id = 'mia';
  shadowAt(0, -6, 8); return { A, M };
}
shot('L11', { build() { const { A, M } = bench(); on((u) => { M.look = u > 2.2 ? -0.5 : 0; A.look = u > 2.6 ? 0.5 : 0; }); }, cam: two(0, -6.4, { d: 4.0 }) });
// L12: her friends: "she's dating down... or up?"
shot('L12', { build() {
  bench();
  [[-1.3, -2.6, 2.6, 86, 'talk'], [0, -2.3, Math.PI, 82, 'shrug'], [1.3, -2.6, -2.6, 88, 'think']].forEach(([x, z, yw, b, p], i) => { const F = person([QUEEN, P_[7], P_[3]][i], x, z, yw, p, { badge: b, face: i === 1 ? 'confused' : 'smug' }); F.id = 'fr' + i; });
}, cam: dolly(P([0.6, 2.4, 1.3], [0, 1.4, -4.2], 58), P([0.4, 2.3, 0.6], [0, 1.4, -4.2], 58)) });
// L13: tonight is my eighteenth birthday (bedroom at night, 11:59)
function bedroom(clock) {
  room({ wall: 0x5a6aa8, floor: '#7a5a3a', w: 9, d: 8, h: 5, lamp: 6 }); const b = bed(0, -1.6); b.scale.setScalar(0.45);
  const w = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 1.4), new THREE.MeshBasicMaterial({ color: 0x1a2350 })); w.position.set(-2.2, 2.6, -3.84); add(w);
  const cb = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.7, 0.1), new THREE.MeshStandardMaterial({ color: 0x111111 })); cb.position.set(1.15, 3.1, -3.8); add(cb);
  const cl = label(clock, 1.15, 3.1, -3.74, { w: 1.4, size: 120, color: '#ff3b30' });
  const cake = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.3, 20), new THREE.MeshStandardMaterial({ color: 0xffe0f0 })); cake.position.set(1.6, 1.0, -2.2); add(cake);
  const fl = new THREE.PointLight(0xffb060, 3, 6); fl.position.set(1.6, 1.4, -2.2); add(fl);
  const st = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.85, 0.9), new THREE.MeshStandardMaterial({ color: 0x8a5a34 })); st.position.set(1.6, 0.42, -2.2); add(st);
  getScene().userData.hemi.intensity = 0.7; shadowAt(0, -2, 8); return cl;
}
shot('L13', { scene: { interior: true }, build() { bedroom('11:59'); const A = person(ME, 0, -2.6, 0, 'situp', { y: 0.35, badge: 'LOCK' }); A.id = 'me'; }, cam: dolly(P([1.2, 2.0, 3.2], [0.3, 1.5, -2.5], 54), P([0.7, 1.95, 2.2], [0.3, 1.55, -2.5], 54)) });
// L14: midnight: the lock starts to open
shot('L14', { scene: { interior: true }, build() { bedroom('12:00'); const A = person(ME, 0, -2.6, 0, 'situp', { y: 0.35, badge: 'UNLOCK', face: 'shock' }); A.id = 'me'; }, cam: CU(0, -2.6, { hy: 1.91, d: 3.0, push: 0.4 }) });
// L15: and my number was... (a blur of numbers)
shot('L15', { scene: { interior: true }, build() { bedroom('12:00'); const A = person(ME, 0, -2.6, 0, 'situp', { y: 0.35, badge: 'SPIN', face: 'shock' }); A.id = 'me'; }, cam: CU(0, -2.6, { hy: 1.91, d: 3.0, push: 0.5 }) });
// L16: freeze on a question mark
shot('L16', { scene: { interior: true }, build() { bedroom('12:00'); const A = person(ME, 0, -2.6, 0, 'situp', { y: 0.35, badge: '?', face: 'shock' }); A.id = 'me'; }, cam: CU(0, -2.6, { hy: 1.91, d: 2.9, push: 0.3 }) });
