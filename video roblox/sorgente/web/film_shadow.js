// "In this world, your shadow does whatever it wants." -- shots for script_shadow.py
import { THREE, shot, person, street, ground, add, on, onPost, sm, lerp, getScene, shadowAt } from './kit.js';
import { blk, sparkles } from './sets.js';
import { ME, P, dolly, M_, DOF, DAY, dynLabel, classroom } from './whatif.js';
import { shadowOf, noShadow, hearts, CROWD } from './cute.js';

const LILY = { skin: 0xf6d2b0, shirt: 0xff9ac0, pants: 0x3b5ba8, hair: { style: 'long', color: 0xc8904a } };
const TEACH = { skin: 0x9c6a45, shirt: 0x23356b, pants: 0x2a2a35, hair: { style: 'bun', color: 0x9a9a9a }, acc: ['glasses'] };
const DAD = { skin: 0xf2c79a, shirt: 0x4a7ab8, pants: 0x3a3a45, hair: { style: 'short', color: 0x4a2a1a } };
const GRAN = { skin: 0xf6d2b0, shirt: 0xb07ab8, pants: 0x55555f, hair: { style: 'white', color: 0xe8e8e8 }, acc: ['glasses'] };
const YOUNG = { ...GRAN, hair: { style: 'long', color: 0x3a2214 }, acc: [] };
const GROOM = { ...ME, shirt: 0x1f2a44, pants: 0x1f2a44, acc: ['tie'], logo: null };
const BRIDE = { ...LILY, shirt: 0xffffff, pants: 0xffffff };
const SUNNY = { ...DAY, bloomThreshold: 2.0 };
let SY = 0.27;
// a person (no cast shadow) with a living shadow lying behind them (head away from the camera)
const duo = (def, x, z, pose = 'idle', o = {}) => { const A = person(def, x, z, o.yaw ?? 0, pose, { face: o.face }); noShadow(A); const S = shadowOf(def, x, z, { pose: o.spose ?? 'idle', yaw: o.syaw ?? Math.PI, anim: o.anim, y: o.sy ?? SY }); return { A, S }; };
const TOP = (x, z, h = 4.6, back = 3.6, push = 0.6) => dolly(P([x + 0.3, h, z + back], [x, 0.9, z + 0.7], 52), P([x + 0.2, h - 0.3, z + back - push], [x, 0.9, z + 0.7], 52));
const dance = (S, k = 1) => onPost((u) => { S.armL.rotation.set(0, 0, -2.4 + Math.sin(u * 7) * 0.6 * k); S.armR.rotation.set(0, 0, 2.4 + Math.sin(u * 7 + 1.5) * 0.6 * k); S.legL.rotation.z = Math.sin(u * 7) * 0.3 * k; S.legR.rotation.z = -Math.sin(u * 7) * 0.3 * k; S.body.rotation.z = Math.sin(u * 3.5) * 0.25 * k; });

// H01: your shadow does whatever it wants (I stand still, it waves at the camera)
shot('H01', { scene: SUNNY, build() { SY = 0.27; street(); const { A, S } = duo(ME, 0, -5.6, 'idle', { spose: 'wave' }); dynLabel(() => 'MY SHADOW', 0, 3.4, -7.4, { w: 2.6, size: 130, color: '#ffd23a' }); shadowAt(0, -6, 8); },
  cam: TOP(0, -5.6, 4.8, 5.2) });
// H02: mine dances when I'm nervous
shot('H02', { scene: SUNNY, build() { SY = 0.27; street(); const { A, S } = duo(ME, 0, -5.6, 'idle', { face: 'confused' }); dance(S); dynLabel(() => 'NERVOUS', -1.6, 2.6, -5.2, { w: 1.8, size: 140, color: '#7ab8ff' }); shadowAt(0, -6, 8); },
  cam: TOP(0, -5.6, 4.8, 5.0) });
// H03: the teacher's shadow naps during her own lessons (shadow toward the camera, curled up)
shot('H03', { scene: { interior: true, bloom: 0.25, bloomThreshold: 1.4, exposure: 0.8, dof: DOF }, build() { classroom(() => 'MATH\n2 + 2 = 4', { size: 110 });
  const T = person(TEACH, 0.2, -3.4, 0, 'present'); noShadow(T); const S = shadowOf(TEACH, 0.2, -3.4, { pose: 'sleep', yaw: Math.PI, y: 0.03 }); onPost(() => { S.body.rotation.set(0, 0, 0); S.body.position.set(0, 0, 0); S.head.rotation.z = 0.5; S.armL.rotation.z = -0.4; S.armR.rotation.z = 0.4; });
  for (let i = 0; i < 3; i++) dynLabel((u) => (Math.floor(u * 1.5) + i) % 3 === 0 ? 'z' : 'Z', 0.6 + i * 0.3, 0.3 + i * 0.35, -0.6 - i * 0.05, { w: 0.5 + i * 0.12, size: 220, color: '#ffffff' }); },
  cam: dolly(P([0.6, 3.6, 2.8], [0.2, 1.0, -1.8], 54), P([0.5, 3.4, 2.3], [0.2, 1.0, -1.8], 54)) });
// H04: Dad's shadow is always five seconds late
shot('H04', { scene: SUNNY, build() { street(); const x0 = -1.0, sp = 1.0;
  const D = person(DAD, x0, -5.6, Math.PI / 2, 'walk', { anim: (A, u) => { A.root.position.x = x0 + sp * u; } }); noShadow(D);
  const S = shadowOf(DAD, x0, -5.6, { pose: 'walk', yaw: Math.PI }); on((u) => { S.wrap.position.x = x0 + sp * Math.max(0, u - 1.4); S.pose = u < 1.4 ? 'idle' : 'walk'; });
  dynLabel(() => '5 SEC LATE', 0.6, 3.2, -7.6, { w: 2.4, size: 130, color: '#ff8a5a' }); shadowAt(0, -6, 8); }, cam: dolly(P([0.3, 4.8, 0.4], [0.2, 0.9, -4.6], 54), P([0.6, 4.6, 0.0], [0.5, 0.9, -4.6], 54)) });
// H05: Grandma's shadow is still twenty -- it does cartwheels
shot('H05', { scene: SUNNY, build() { street(); const G = person(GRAN, -0.8, -5.4, 0.2, 'idle', { face: 'smile' }); noShadow(G);
  const S = shadowOf(YOUNG, -0.8, -5.4, { pose: 'cheer', yaw: Math.PI }); S.root.position.z = 1.15; on((u) => { S.wrap.position.x = -0.6 + 0.8 * u; S.wrap.position.z = -3.9; S.wrap.rotation.y = Math.PI - u * 3.2; });
  dynLabel(() => 'AGE 20', 1.2, 2.6, -6.8, { w: 1.8, size: 150, color: '#ff9ac0' }); sparkles(0, 0.2, -6.4, { n: 50, R: 2, h: 0.6, color: 0xffe07a }); shadowAt(0, -6, 8); },
  cam: dolly(P([0.4, 5.2, 0.6], [0.4, 0.8, -4.8], 54), P([0.6, 5.0, 0.2], [0.6, 0.8, -4.8], 54)) });
// H06: your shadow knows things before you do (it points; I look confused)
shot('H06', { scene: SUNNY, build() { street(); const { A, S } = duo(ME, 0, -5.6, 'idle', { face: 'confused', spose: 'point' }); dynLabel(() => '?', 0.9, 2.6, -5.4, { w: 0.9, size: 260, color: '#ffd23a' }); shadowAt(0, -6, 8); },
  cam: TOP(0, -5.6, 4.4, 4.8) });
// the bus stop: a shelter with a sign, a bench
function busStop() { SY = 0.27; street(); const gl = new THREE.MeshStandardMaterial({ color: 0xbfe8ff, transparent: true, opacity: 0.35, roughness: 0.1 }); blk(4.0, 0.15, 1.6, M_(0x2a5ad8), 0, 3.2, -8.0); blk(4.0, 2.9, 0.06, gl, 0, 1.6, -8.75);
  for (const s of [-1, 1]) blk(0.12, 3.2, 0.12, M_(0x2a2a30), s * 1.95, 1.6, -7.3); blk(0.1, 3.4, 0.1, M_(0x2a2a30), 2.6, 1.7, -6.6); blk(0.9, 0.9, 0.08, M_(0x2a8a4a), 2.6, 3.3, -6.6);
  dynLabel(() => 'BUS', 2.6, 3.3, -6.54, { w: 0.85, size: 200, color: '#ffffff', stroke: false }); blk(2.6, 0.12, 0.6, M_(0x9a6a3a), 0, 0.9, -8.3); shadowAt(0, -6, 8); }
// H07: like the day I met Lily at the bus stop
shot('H07', { scene: SUNNY, build() { busStop(); const { A } = duo(ME, -0.9, -6.0, 'idle'); A.look = 0.3; const L = person(LILY, 3.2, -6.2, -Math.PI / 2, 'walk', { anim: (Q, u) => { Q.root.position.x = Math.max(0.9, 3.2 - 1.2 * u); Q.pose = Q.root.position.x > 0.91 ? 'walk' : 'idle'; Q.root.rotation.y = Q.pose === 'walk' ? -Math.PI / 2 : -0.3; } }); noShadow(L); },
  cam: dolly(P([0.4, 2.6, -1.0], [0.2, 1.6, -6.4], 54), P([0.3, 2.5, -1.6], [0.2, 1.6, -6.4], 54)) });
// H08: I said hi. She said hi. Very cool, very normal.
shot('H08', { scene: SUNNY, build() { busStop(); const { A } = duo(ME, -0.8, -6.0, 'idle', { face: 'smug' }); A.look = 0.5; const { A: L } = duo(LILY, 0.8, -6.0, 'idle'); L.look = -0.5;
  on((u) => { A.pose = u > 0.3 && u < 1.0 ? 'wave' : 'idle'; L.pose = u > 1.2 && u < 1.9 ? 'wave' : 'idle'; L.setFace(u > 1.2 ? 'smile' : 'smile'); }); },
  cam: dolly(P([0.2, 2.4, -1.0], [0, 1.8, -6.0], 50), P([0.1, 2.4, -1.5], [0, 1.8, -6.0], 50)) });
// H09: but on the ground... our shadows were holding hands
function hands(o = {}) { busStop(); const me = duo(ME, -0.8, -6.0, 'idle', { face: o.meFace ?? 'smug' }); const ly = duo(LILY, 0.8, -6.0, 'idle', { face: o.lyFace ?? 'smile' });
  onPost(() => { me.S.armR.rotation.set(0, 0, 0.75); ly.S.armL.rotation.set(0, 0, -0.75); me.S.head.rotation.z = -0.25; ly.S.head.rotation.z = 0.25; }); return { me, ly }; }
shot('H09', { scene: SUNNY, build() { const { me, ly } = hands(); me.A.look = -0.3; ly.A.look = 0.3; hearts(0, 0.4, -4.4, { n: 14, R: 1.0, h: 0.8, size: 0.2 }); },
  cam: dolly(P([0.2, 6.2, -0.6], [0, 0.6, -4.8], 50), P([0.1, 5.8, -1.0], [0, 0.6, -4.8], 50)) });
// H10: we looked down, then at each other, then very quickly at the sky
shot('H10', { scene: SUNNY, build() { const { me, ly } = hands({ meFace: 'shock', lyFace: 'shock' }); const k = (u) => u < 1.0 ? 0 : u < 2.0 ? 1 : 2;
  onPost((u) => { const s = k(u); for (const [A, side] of [[me.A, 1], [ly.A, -1]]) { A.pitch = s === 0 ? 0.45 : s === 1 ? 0 : -0.5; A.look = s === 1 ? side * 0.7 : 0; A.head.rotation.set(A.pitch, A.look, 0); A.setFace(s === 2 ? 'smile' : 'shock'); } });
  hearts(0, 2.2, -5.8, { n: 10, R: 1.4, amount: (u) => u > 2 ? 1 : 0 }); }, cam: dolly(P([0.1, 2.4, -1.6], [0, 1.9, -6.0], 50), P([0.1, 2.4, -2.0], [0, 1.95, -6.0], 50)) });
// the wedding: a flower arch on the grass
function wedding() { SY = 0.03; ground({ road: false, grass: 0x6ac85a }); const S = getScene(); S.userData.sun.position.set(6, 30, 10);
  const arch = new THREE.Mesh(new THREE.TorusGeometry(2.2, 0.14, 12, 40, Math.PI), M_(0xffffff)); arch.position.set(0, 0.2, -7.6); add(arch);
  const cols = [0xff9ac0, 0xffffff, 0xffd23a, 0xff6a8a]; for (let i = 0; i < 30; i++) { const a = i / 29 * Math.PI; const f = new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 8), M_(cols[i % 4])); f.position.set(Math.cos(a) * 2.2, 0.2 + Math.sin(a) * 2.2, -7.5); add(f); }
  for (const s of [-1, 1]) for (let r = 0; r < 2; r++) for (let k = 0; k < 3; k++) { const c = blk(0.6, 0.6, 0.6, M_(0xffffff), s * (2.2 + k * 0.9), 0.3, -2.0 + r * 1.4); } shadowAt(0, -6, 10); }
// H11: twelve years later, at our wedding
shot('H11', { scene: { ...SUNNY, sky: ['#7ac8ff', '#ffe8f0'] }, build() { wedding(); duo(GROOM, -0.7, -6.6, 'idle', { face: 'smile' }).A.look = 0.4; duo(BRIDE, 0.7, -6.6, 'idle', { face: 'smile' }).A.look = -0.4;
  dynLabel(() => '12 YEARS LATER', 0, 4.0, -7.8, { w: 3.6, size: 130, color: '#ffffff' }); sparkles(0, 2.6, -7.0, { n: 80, R: 2.4, h: 1.6, color: 0xffe0f0 }); },
  cam: dolly(P([0, 2.6, -0.2], [0, 1.8, -7.0], 52), P([0, 2.5, -1.0], [0, 1.8, -7.0], 52)) });
// H12: our shadows started dancing before the music did
shot('H12', { scene: { ...SUNNY, sky: ['#7ac8ff', '#ffe8f0'] }, build() { wedding(); const g = duo(GROOM, -0.7, -6.6, 'idle', { face: 'shock' }); const b = duo(BRIDE, 0.7, -6.6, 'idle', { face: 'smile' }); g.A.look = 0.4; b.A.look = -0.4;
  dance(g.S); dance(b.S); hearts(0, 0.3, -5.2, { n: 18, R: 1.6, h: 0.9 }); sparkles(0, 0.3, -5.2, { n: 60, R: 1.8, h: 0.6, color: 0xffe07a }); },
  cam: dolly(P([0.2, 6.0, -0.8], [0, 0.6, -5.4], 52), P([0.1, 5.6, -1.2], [0, 0.6, -5.4], 52)) });
// H13: comment what your shadow would do
shot('H13', { scene: { ...SUNNY, sky: ['#7ac8ff', '#ffe8f0'] }, build() { wedding(); const g = duo(GROOM, -0.7, -6.6, 'cheer'); const b = duo(BRIDE, 0.7, -6.6, 'cheer'); dance(g.S, 1.2); dance(b.S, 1.2);
  dynLabel(() => 'COMMENT WHAT YOUR\nSHADOW WOULD DO', 0, 3.3, -4.6, { w: 2.0, size: 110, color: '#ffd23a' }); hearts(0, 0.3, -5.2, { n: 18, R: 1.6, h: 0.9 }); },
  cam: dolly(P([0.1, 5.0, 0.0], [0, 1.2, -5.8], 54), P([0.05, 4.8, -0.5], [0, 1.2, -5.8], 54)) });
