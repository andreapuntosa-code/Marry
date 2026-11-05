// "I woke up with my IQ above my head" -- shots (anchored to the narration segments of script_iq.py)
import { THREE, shot, person, dog, street, house, tree, ground, room, bed, desk, label, glowTex, stars, add, on, shadowAt, camLerp, sm, lerp } from './kit.js';

const ME = { skin: 0xf2c79a, shirt: 0x2fa84f, pants: 0x2f4a8a, hair: { style: 'bowl', color: 0x6b3a1e }, logo: 0xffd23a };
const MOM = { skin: 0xf0c090, shirt: 0xe85a9a, pants: 0x3b5ba8, hair: { style: 'long', color: 0x7a3a1a } };
const NEIGH = { skin: 0xffd9b3, shirt: 0x7b3fc4, pants: 0x2a2a35, hair: { style: 'spiky', color: 0xf2d24a }, acc: ['shades', 'chain'], face: 'smug' };
const TEACH = { skin: 0x9c6a45, shirt: 0x23356b, pants: 0x2a2a35, hair: { style: 'bun', color: 0x9a9a9a }, acc: ['glasses', 'tie'] };
const SCI1 = { skin: 0xf2c79a, shirt: 0x8fb0d8, pants: 0x3a3a45, hair: { style: 'white', color: 0xe8e8e8 }, acc: ['coat', 'glasses'] };
const SCI2 = { skin: 0x7a4f32, shirt: 0x8fb0d8, pants: 0x3a3a45, hair: { style: 'bald' }, acc: ['coat', 'glasses'] };
const FOLK = [
  { skin: 0xf2c79a, shirt: 0xf28c28, pants: 0x2f4a8a, hair: { style: 'spiky', color: 0x2a1a10 }, acc: ['headband'] },
  { skin: 0x8a5a3a, shirt: 0x3fa7d6, pants: 0xc9b38a, hair: { style: 'short', color: 0x1a1210 } },
  { skin: 0xffd9b3, shirt: 0xf5e04a, pants: 0x4a4a55, hair: { style: 'long', color: 0xe8c24a } },
  { skin: 0xc68a5a, shirt: 0xd23a3a, pants: 0x2a2a35, hair: { style: 'bun', color: 0x2a1a10 } },
  { skin: 0xf2c79a, shirt: 0x6cc24a, pants: 0x3b5ba8, hair: { style: 'short', color: 0x8a5a2a } },
  { skin: 0x5a3a26, shirt: 0xb04ac9, pants: 0x2f4a8a, hair: { style: 'short', color: 0x111111 } },
];
const P = (a, b, fov = 50) => ({ pos: a, tgt: b, fov });
// close-up like the reference: head in the top third, badge above, the word over the chest (standing: head at 1.94 m)
const CU = (x, z, o = {}) => { const d = o.d ?? 3.2, sx = o.side ?? 0.25, hy = o.hy ?? 1.94; return dolly(P([x + sx, hy - 0.09, z + d], [x, hy - 0.49, z], o.fov ?? 50), P([x + sx * 0.5, hy - 0.09, z + d - (o.push ?? 0.5)], [x, hy - 0.49, z], o.fov ?? 50)); };
const dolly = (a, b) => (u, d) => camLerp(a, b, u / d);
const still = (pos, tgt, fov = 50) => () => P(pos, tgt, fov);
// a value rolling from a to b (log scale) between t0 and t1
const roll = (a, b, t0, t1) => (u) => Math.round(a * Math.pow(b / a, sm(t0, t1, u)));
const walkers = (list, z, dir = 1) => list.forEach(([def, x0, badge, sp], i) => person(def, x0, z, dir > 0 ? Math.PI / 2 : -Math.PI / 2, 'walk', { badge, anim: (A, u) => { A.root.position.x = x0 + dir * (sp ?? 1.3) * u; } }));


// R01: the bedroom; I sit up in bed, a number pops above my head
const bedroom = () => { room({ wall: 0x8ec6e8, floor: '#b9855a', w: 9, d: 8, h: 5 }); const b = bed(0, -1.6); b.scale.setScalar(0.45);
  const w = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 1.4), new THREE.MeshStandardMaterial({ color: 0xbfe6ff, emissive: 0xbfe6ff, emissiveIntensity: 0.6 })); w.position.set(-2.2, 2.6, -3.84); add(w);
  const shelf = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.8, 0.8), new THREE.MeshStandardMaterial({ color: 0xd8a060 })); shelf.position.set(2.8, 0.9, -3.4); shelf.castShadow = true; add(shelf); shadowAt(0, -2, 8); };
shot('R01', { scene: { interior: true }, build() {
  bedroom();
  const A = person(ME, 0, -2.6, 0, 'situp', { y: 0.35, badge: (u) => (u > 2.1 ? 100 : null), face: 'sleep' }); A.id = 'me';
  on((u) => { A.setFace(u < 0.9 ? 'sleep' : (u < 2.2 ? 'smile' : 'shock')); });
}, cam: dolly(P([1.4, 2.0, 3.4], [0, 1.25, -2.4], 50), P([0.7, 1.9, 1.6], [0, 1.35, -2.5], 50)) });
// R02: close on my face
shot('R02', { scene: { interior: true }, build() {
  bedroom(); const A = person(ME, 0, -2.6, 0, 'situp', { y: 0.35, badge: 100, face: 'shock' }); A.id = 'me';
  on((u) => A.setFace(u < 1.1 ? 'shock' : 'smile'));
}, cam: CU(0, -2.6, { hy: 1.91, d: 3.0 }) });
// R03: the street, everyone has a number
shot('R03', { build() {
  street();
  walkers([[FOLK[0], -4.5, 104], [FOLK[2], -1.2, 97, 1.1], [FOLK[4], 2.2, 121]], -6.0, 1);
  walkers([[FOLK[3], 3.8, 110], [FOLK[5], 0.6, 93, 1.0]], -4.9, -1);
  shadowAt(0, -5, 14);
}, cam: dolly(P([-0.6, 2.8, 5.5], [0, 1.7, -6], 60), P([0.6, 2.5, 4.2], [0, 1.7, -6], 60)) });
// R04: Mom on the sidewalk in front of our house
shot('R04', { build() { street(); const A = person(MOM, 0, -6.3, 0, 'wave', { badge: (u) => (u > 0.35 ? 112 : null) }); A.id = 'mom'; shadowAt(0, -6, 8); }, cam: CU(0, -6.3) });
// R05: the neighbour, smug
shot('R05', { build() { street(); const A = person(NEIGH, 15, -6.3, 0, 'idle', { badge: (u) => (u > 0.45 ? 91 : null) }); A.id = 'nb'; shadowAt(15, -6, 8); }, cam: CU(15, -6.3, { side: -0.3 }) });
// R06: but mine kept going up
shot('R06', { build() {
  street(); const A = person(ME, 0, -6.3, 0, 'idle', { badge: roll(100, 186, 0.6, 2.2) }); A.id = 'me';
  on((u) => { A.setFace(u < 0.9 ? 'smile' : 'shock'); A.pose = u < 0.9 ? 'idle' : 'shock'; }); shadowAt(0, -6, 8);
}, cam: CU(0, -6.3, { push: 0.9 }) });
// R07: the classroom: I am done before the test is handed out
shot('R07', { scene: { interior: true }, build() {
  room({ wall: 0xf2e6c8, floor: '#c79a6a', w: 12, d: 12, h: 6, lamp: 40 });
  const bd = new THREE.Mesh(new THREE.BoxGeometry(5, 2.2, 0.2), new THREE.MeshStandardMaterial({ color: 0x2f5a3a, roughness: 0.9 })); bd.position.set(-0.6, 3.1, -5.75); add(bd);
  label('E = mc²\nx² + y² = ?', -0.6, 3.1, -5.6, { w: 4.4, size: 56 });
  const T = person(TEACH, -1.9, -4.4, 0.25, 'present', { badge: 118 }); T.id = 'tch';
  [[-2.4, -2.2, 102], [2.4, -2.2, 97]].forEach(([x, z, b], i) => { desk(x, z + 0.75).scale.setScalar(0.5); const S = person(FOLK[i], x, z, 0, 'type', { badge: b, y: 0.25 }); S.pose = 'sit'; S.id = 'st' + i; });
  const dk = desk(0, -0.25); dk.scale.setScalar(0.5);
  const ch = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.5, 0.8), new THREE.MeshStandardMaterial({ color: 0x3a6fd6 })); ch.position.set(0, 0.25, -1.3); add(ch);
  const paper = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.65), new THREE.MeshStandardMaterial({ color: 0xffffff })); paper.rotation.x = -Math.PI / 2; paper.position.set(0, 1.14, -0.2); add(paper);
  label('A+', 0, 1.15, -0.25, { w: 0.6, size: 120, color: '#e8413b' }).rotation.x = -Math.PI / 2;
  const A = person(ME, 0, -1.3, 0, 'sit', { y: 0.25, badge: roll(186, 250, 0.2, 1.2), face: 'smug' }); A.id = 'me';
  on((u) => { A.pose = u < 1.6 ? 'type' : 'sit'; if (u < 1.6) A.root.position.y = 0.25; });
  shadowAt(0, -2, 9);
}, cam: dolly(P([0.8, 2.0, 2.6], [-0.4, 1.35, -2.4], 54), P([0.5, 1.95, 1.9], [-0.4, 1.4, -2.4], 54)) });
// R08: catching every ball without looking
shot('R08', { build() {
  street(); const A = person(ME, 1.0, -6.3, 0, 'catch', { badge: roll(250, 500, 0.0, 1.0), face: 'smug' }); A.id = 'me'; A.look = -0.7;
  const K = person(FOLK[0], -2.2, -6.5, Math.PI / 2, 'throw', { badge: 103 }); K.id = 'k';
  const ball = new THREE.Mesh(new THREE.SphereGeometry(0.17, 16, 12), new THREE.MeshStandardMaterial({ color: 0xe8413b, roughness: 0.4 })); ball.castShadow = true; add(ball);
  on((u) => { const q = ((u * 0.9) % 1); const p = sm(0.4, 1.0, q); ball.position.set(lerp(-1.8, 1.55, p), 2.3 + Math.sin(p * Math.PI) * 1.2 + p * 0.2, lerp(-6.4, -6.3, p)); if (q < 0.4) ball.position.set(-1.85, 2.45, -6.45); });
  shadowAt(0, -6, 8);
}, cam: dolly(P([-0.5, 2.1, 0.4], [-0.6, 1.5, -6.3], 58), P([-0.5, 2.0, -0.4], [-0.5, 1.55, -6.3], 58)) });
// R09-R10: scientists come to see me
function sciScene() {
  street(); const S1 = person(SCI1, -1.35, -5.9, Math.PI / 2 - 0.55, 'idle', { badge: 165 }); S1.id = 's1'; const S2 = person(SCI2, 1.35, -5.9, -Math.PI / 2 + 0.55, 'idle', { badge: 172 }); S2.id = 's2';
  const A = person(ME, 0, -6.6, 0, 'idle', { badge: roll(500, 1000, 0.2, 1.4) }); A.id = 'me'; shadowAt(0, -6, 8); return { S1, S2, A };
}
shot('R09', { build() { sciScene(); }, cam: dolly(P([0.3, 2.2, 0.6], [0, 1.5, -6.2], 58), P([0.15, 2.1, -0.4], [0, 1.5, -6.2], 58)) });
shot('R10', { build() {
  const { S1, S2, A } = sciScene(); A.badge = 1000; A.pose = 'present';
  const nap = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.6), new THREE.MeshStandardMaterial({ color: 0xffffff, side: THREE.DoubleSide })); nap.position.set(0, 1.5, -5.75); nap.rotation.x = -0.25; add(nap);
  label('DARK\nMATTER ✓', 0, 1.5, -5.74, { w: 0.6, size: 64, color: '#2a2a33' }).rotation.x = -0.25;
  on((u) => { const k = u > 1.3; [S1, S2].forEach(S => { S.pose = k ? 'shock' : 'idle'; S.setFace(k ? 'shock' : 'smile'); }); A.setFace(k ? 'smug' : 'smile'); });
}, cam: dolly(P([-0.6, 2.0, -2.2], [-0.2, 1.55, -6.2], 56), P([-0.4, 1.95, -2.9], [-0.2, 1.6, -6.2], 56)) });
// R11a: a tiny star in the garage
shot('R11', { scene: { interior: true }, build() {
  room({ wall: 0xa9adb5, floor: '#7d7f86', w: 12, d: 10, h: 6, lamp: 14 });
  const bench = new THREE.Mesh(new THREE.BoxGeometry(4, 1.6, 1.4), new THREE.MeshStandardMaterial({ color: 0x8a5a34 })); bench.position.set(-2.6, 0.8, -4); bench.castShadow = true; add(bench);
  const sun = new THREE.Mesh(new THREE.SphereGeometry(0.4, 32, 20), new THREE.MeshBasicMaterial({ color: 0xfff2c0 })); sun.position.set(0.9, 2.5, -2.0); add(sun);
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex(), color: 0xffc860, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false })); halo.position.copy(sun.position); add(halo);
  const L = new THREE.PointLight(0xffc870, 0, 25, 1.4); L.position.copy(sun.position); add(L);
  on((u) => { const k = sm(0.2, 1.2, u), f = 1 + 0.06 * Math.sin(u * 20); sun.scale.setScalar(Math.max(0.01, k * f)); halo.scale.setScalar(0.1 + 2.6 * k * f); L.intensity = 50 * k * f; sun.position.y = 2.5 + Math.sin(u * 2) * 0.08; });
  const A = person(ME, -0.5, -2.6, 0.35, 'cheer', { badge: roll(1000, 10000, 0.1, 1.2) }); A.id = 'me';
  shadowAt(0, -2, 8);
}, cam: dolly(P([0.6, 2.1, 1.6], [0.0, 1.7, -2.4], 56), P([0.4, 2.0, 0.8], [0.0, 1.75, -2.4], 56)) });
// R11b: the whole town lights up (dusk)
shot('R11', { off: 2.75, scene: { sky: ['#2b3b7a', '#f59a6a'] }, build() {
  street({ lit: true }); const A = person(ME, 0, -5.5, 0, 'cheer', { badge: 10000 }); A.id = 'me';
  getSun().intensity = 0.8; getScene().userData.hemi.intensity = 0.9; shadowAt(0, -6, 14);
}, cam: dolly(P([0, 3.2, 4.5], [0, 2.4, -10], 60), P([0, 2.6, 2.6], [0, 2.2, -10], 60)) });
// R12: nobody understands me any more
shot('R12', { build() {
  street(); const A = person(ME, 0, -6.8, 0, 'present', { badge: roll(10000, 1000000, 0.0, 1.0) }); A.id = 'me';
  [[-1.5, -5.6, Math.PI / 2 - 0.4, 98], [1.5, -5.6, -Math.PI / 2 + 0.4, 106], [-1.9, -7.4, Math.PI / 2, 91], [1.9, -7.4, -Math.PI / 2, 115]].forEach(([x, z, yw, b], i) => { const F = person(FOLK[i + 1], x, z, yw, 'shrug', { badge: b, face: 'confused' }); F.id = 'f' + i; });
  shadowAt(0, -6, 8);
}, cam: dolly(P([0.2, 2.3, -0.4], [0, 1.5, -6.6], 58), P([0.1, 2.2, -1.2], [0, 1.55, -6.6], 58)) });
// R13: night; I knew everything (the number runs away)
shot('R13', { scene: { night: true }, build() {
  street({ lit: true }); stars();
  const A = person(ME, 0, -6.3, 0, 'idle', { badge: roll(1000000, 9.9e11, 0.2, 2.6) }); A.id = 'me'; A.pitch = -0.35;
  shadowAt(0, -6, 8);
}, cam: CU(0, -6.3, { d: 3.4 }) });
// R14: then I looked at my dog
const yard = () => { ground({ road: false }); house(0, -12, 0, { color: 0xf6d36b }); tree(-6, -8, 1.1, 4); tree(6.5, -8.5, 1.0, 6); shadowAt(0, -5, 8); };
shot('R14', { build() {
  yard(); const A = person(ME, -0.7, -5.2, 0.9, 'idle', { badge: 9.9e11 }); A.id = 'me'; A.look = 0.3;
  dog(0.9, -4.8, -0.9, { sit: true });
}, cam: dolly(P([-0.4, 2.0, -0.6], [0.1, 1.25, -5.0], 54), P([-0.3, 1.9, -1.4], [0.1, 1.25, -5.0], 54)) });
// R15: his number was higher than mine
shot('R15', { build() {
  yard(); const D = dog(0, -5, 0, { sit: true, badge: (u) => (u > 0.5 ? '∞' : null) }); D.id = 'dog';
}, cam: dolly(P([0.25, 1.15, -2.6], [0, 0.95, -5], 50), P([0.12, 1.1, -3.0], [0, 0.97, -5], 50)) });
// R16: what number would float above your head?
shot('R16', { build() {
  street();
  const A = person(ME, 0, -6.3, 0, 'wave', { badge: 9.9e11 }); A.id = 'me'; const M = person(MOM, -1.6, -6.6, 0.2, 'wave', { badge: 112 }); M.id = 'mom';
  const N = person(NEIGH, 1.6, -6.6, -0.2, 'idle', { badge: 91 }); N.id = 'nb'; dog(0.85, -5.4, 0.2, { sit: true, badge: '∞' }).id = 'dog';
  shadowAt(0, -6, 8);
}, cam: dolly(P([0, 2.0, 0.0], [0, 1.4, -6.3], 56), P([0, 2.2, 0.9], [0, 1.45, -6.3], 56)) });
import { getScene } from './kit.js';
const getSun = () => getScene().userData.sun;
