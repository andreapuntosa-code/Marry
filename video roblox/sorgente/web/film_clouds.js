// "In this world, everyone has a tiny cloud above their head that shows how they feel." -- shots for script_clouds.py
import { THREE, shot, person, street, add, on, onPost, sm, lerp, getScene, shadowAt } from './kit.js';
import { blk, sparkles } from './sets.js';
import { ME, P, dolly, M_, DOF, DAY, dynLabel, classroom } from './whatif.js';
import { moodCloud, umbrellaAt, hearts, CROWD } from './cute.js';

const ROSE = { skin: 0xf6d2b0, shirt: 0x8a7ad8, pants: 0x3a3a55, hair: { style: 'long', color: 0x2a1a14 } };
const ANGRY = { skin: 0xf2c79a, shirt: 0x5a6a7a, pants: 0x2a2a35, hair: { style: 'bald' }, acc: ['tie'] };
const IN = { interior: true, bloom: 0.25, bloomThreshold: 1.4, exposure: 0.78, dof: DOF };
const mood = (m) => () => m;
const who = (def, x, z, yaw, pose, m, o = {}) => { const A = person(def, x, z, yaw, pose, o); moodCloud(A, typeof m === 'function' ? m : mood(m), o); return A; };
// the classroom: desks in two rows; Rose alone at the front right
function school(o = {}) { classroom((u, d) => typeof o.board === 'function' ? o.board(u, d) : (o.board ?? 'WELCOME!'), { size: 95 }); const wood = M_(0xc89a64), metal = M_(0x5a5a62);
  const desk = (x, z) => { blk(1.3, 0.08, 0.8, wood, x, 1.15, z); for (const s of [-0.55, 0.55]) blk(0.06, 1.15, 0.06, metal, x + s, 0.57, z + 0.3); for (const s of [-0.55, 0.55]) blk(0.06, 1.15, 0.06, metal, x + s, 0.57, z - 0.3);
    blk(0.8, 0.08, 0.7, M_(0x3a7ad8), x, 0.55, z - 0.75); };
  for (const x of [-2.8, -1.4]) for (const z of [-1.6, 0.4]) desk(x, z); desk(0.6, -1.6); desk(1.9, -1.6);
  getScene().userData.sun.intensity = 1.3; shadowAt(0, -1, 8); }
// Rose and me at the two front-right desks (we face the board; the camera looks at us from the board side)
const ROSE_X = 1.9, ME_X = 0.6, ROW = -1.6;

// C01: everyone has a tiny cloud above their head
shot('C01', { scene: DAY, build() { street(); const A = who(ME, 0, -6.0, 0, 'idle', 'sun'); who(CROWD[3], -2.2, -6.6, 0.3, 'idle', 'rain', { seed: 3 }); who(CROWD[1], 2.2, -6.8, -0.3, 'idle', 'sun', { seed: 5 });
  dynLabel(() => 'MOOD CLOUDS', 0, 4.4, -7.4, { w: 3.4, size: 140, color: '#ffffff' }); shadowAt(0, -6, 10); },
  cam: dolly(P([0, 2.5, -0.6], [0, 2.6, -6.4], 56), P([0, 2.5, -1.4], [0, 2.6, -6.4], 56)) });
// C02: happy people get sunshine
shot('C02', { scene: DAY, build() { street(); who(CROWD[0], -1.0, -6.0, 0.2, 'cheer', 'sun'); who(CROWD[7], 1.0, -6.1, -0.2, 'cheer', 'sun', { seed: 2 }); shadowAt(0, -6, 8); },
  cam: dolly(P([0, 2.4, 0.2], [0, 2.4, -6.0], 52), P([0, 2.4, -0.4], [0, 2.4, -6.0], 52)) });
// C03: angry people get thunder
shot('C03', { scene: { ...DAY, sky: ['#7a8aa8', '#c8d0e0'] }, build() { street(); who(ANGRY, 0, -6.0, 0, 'shock', 'thunder', { face: 'pain' }); shadowAt(0, -6, 8); },
  cam: (u, d) => ({ ...dolly(P([0.3, 2.4, -1.4], [0, 2.5, -6.0], 50), P([0.2, 2.4, -1.9], [0, 2.5, -6.0], 50))(u, d), shake: 0.02 }), fx: (u) => ({ flash: Math.floor(u * 5) % 3 === 0 ? 0.25 : 0 }) });
// C04: in love it rains glitter (a couple on a bench)
shot('C04', { scene: { ...DAY, sky: ['#ff9ac8', '#ffe0c8'] }, build() { street(); const wood = M_(0x9a6a3a); blk(2.8, 0.16, 0.8, wood, 0, 0.95, -6.4); blk(2.8, 0.8, 0.12, wood, 0, 1.5, -6.85);
  const A = who(CROWD[4], -0.65, -6.4, 0.3, 'sit', 'glitter', { y: 0.55 }); A.look = 0.4; const B = who(CROWD[2], 0.65, -6.4, -0.3, 'sit', 'glitter', { y: 0.55, seed: 9 }); B.look = -0.4;
  hearts(0, 1.6, -6.2, { n: 18, R: 1.6 }); shadowAt(0, -6, 8); }, cam: dolly(P([0, 2.3, -1.0], [0, 2.2, -6.4], 52), P([0, 2.3, -1.6], [0, 2.2, -6.4], 52)) });
// C05: mine is usually sunny. Except on Mondays.
shot('C05', { scene: DAY, build() { street(); const A = who(ME, 0, -6.0, 0, 'idle', (u) => u < 1.35 ? 'sun' : 'rain'); on((u) => A.setFace(u < 1.35 ? 'smile' : 'sad'));
  dynLabel((u) => u < 1.35 ? '' : 'MONDAY', 0, 1.75, -5.3, { w: 1.4, size: 150, color: '#7ab8ff' }); shadowAt(0, -6, 8); },
  cam: dolly(P([0.2, 2.4, -2.0], [0, 2.4, -6.0], 50), P([0.1, 2.4, -2.5], [0, 2.4, -6.0], 50)) });
// C06: a new girl; her cloud rains every single day
shot('C06', { scene: IN, build() { school({ board: 'NEW STUDENT:\nROSE' }); const R = who(ROSE, 0, -3.2, 0, 'idle', 'rain', { face: 'sad' });
  shadowAt(0, -3, 8); }, cam: dolly(P([0.3, 2.5, 3.2], [0, 2.6, -3.4], 52), P([0.2, 2.5, 2.5], [0, 2.6, -3.4], 52)) });
// C07: nobody sat next to her (classmates crowd the far desks; a puddle grows under her)
shot('C07', { scene: IN, build() { school(); [[-2.8, -1.6], [-1.4, -1.6], [-2.8, 0.4], [-1.4, 0.4]].forEach(([x, z], i) => who(CROWD[i], x, z - 0.75, 0, 'sit', 'sun', { y: 0.15, seed: i + 2 }));
  const R = who(ROSE, ROSE_X, ROW - 0.75, 0, 'sit', 'rain', { y: 0.15, face: 'sad' }); const pud = new THREE.Mesh(new THREE.CircleGeometry(1, 40), M_(0x5ab8ff, { r: 0.05 })); pud.rotation.x = -Math.PI / 2; pud.position.set(ROSE_X, 0.02, ROW - 0.6); add(pud);
  on((u, d) => pud.scale.setScalar(0.3 + 0.6 * u / d)); dynLabel(() => 'EMPTY', ME_X, 2.0, ROW - 0.3, { w: 1.0, size: 150, color: '#ff8a7a' }); },
  cam: dolly(P([-0.3, 3.6, 5.6], [-0.3, 1.8, -1.8], 60), P([-0.3, 3.4, 5.0], [-0.3, 1.8, -1.8], 60)) });
// C08-C10: I brought an umbrella and sat next to her (we face the board = the camera)
function pair(roseMood, meMood, o = {}) { school(o); const R = who(ROSE, ROSE_X, ROW - 0.75, 0, 'sit', roseMood, { y: 0.15, face: o.roseFace ?? 'sad', dropLen: o.dropLen ?? 0.42 }); R.look = o.roseLook ?? 0;
  const A = who(ME, ME_X, ROW - 0.75, 0, 'sit', meMood, { y: 0.15, face: o.meFace ?? 'smile', seed: 11 }); A.look = o.meLook ?? 0;
  onPost((u, d) => { const up = o.arm ? o.arm(u, d) : 1; A.armR.rotation.set(-0.9 * up, 0, 0.5 * up); });
  if (o.umbrella !== false) umbrellaAt(1.2, 1.25, ROW - 0.5, { tilt: -0.05, open: o.open });
  return { R, A }; }
shot('C08', { scene: IN, build() { pair('rain', 'sun', { open: (u) => sm(0.4, 0.9, u), arm: (u) => sm(0.2, 0.6, u) }); }, cam: dolly(P([1.25, 2.6, ROW + 6.0], [1.25, 2.4, ROW - 0.8], 50), P([1.25, 2.6, ROW + 5.3], [1.25, 2.4, ROW - 0.8], 50)) });
shot('C09', { scene: IN, build() { pair('rain', 'sun', { roseLook: -0.3 }); }, cam: dolly(P([0.4, 2.4, ROW + 4.6], [1.25, 2.4, ROW - 0.8], 46), P([0.5, 2.4, ROW + 4.1], [1.25, 2.4, ROW - 0.8], 46)) });
shot('C10', { scene: IN, build() { pair('rain', 'sun', { meLook: 0.3 }); dynLabel((u) => 'DAY ' + Math.min(39, 2 + Math.floor(37 * sm(0, 2.6, u))), 1.25, 1.0, ROW + 0.7, { w: 1.8, size: 150, color: '#ffd23a' }); },
  cam: dolly(P([0.6, 2.7, ROW + 6.4], [0.8, 2.8, ROW - 1.4], 54), P([0.7, 2.7, ROW + 5.8], [0.8, 2.8, ROW - 1.4], 54)) });
// C11: on the fortieth day... the rain stopped (umbrella lowers, she looks up)
shot('C11', { scene: IN, build() { const { R } = pair((u, d) => u < d * 0.35 ? 'rain' : 'calm', 'sun', { roseFace: 'confused', open: (u, d) => 1 - sm(d * 0.45, d * 0.8, u), arm: (u, d) => 1 - sm(d * 0.45, d * 0.8, u) }); onPost(() => { R.pitch = -0.3; });
  dynLabel(() => 'DAY 40', -1.4, 3.6, -3.6, { w: 1.8, size: 150, color: '#ffd23a' }); }, cam: dolly(P([1.4, 2.6, ROW + 4.6], [1.5, 2.7, ROW - 0.8], 48), P([1.4, 2.6, ROW + 4.1], [1.5, 2.75, ROW - 0.8], 48)) });
// C12: her cloud made a tiny rainbow
shot('C12', { scene: IN, build() { const { R } = pair('rainbow', 'sun', { roseFace: 'smile', umbrella: false, arm: () => 0, bowT: 0.3 }); sparkles(ROSE_X, 3.4, ROW - 0.75, { n: 60, R: 0.8, h: 0.8, color: 0xffe07a });
  on((u) => R.setFace(u > 0.6 ? 'smile' : 'confused')); }, cam: dolly(P([1.9, 2.6, ROW + 3.8], [1.9, 2.75, ROW - 0.8], 48), P([1.9, 2.6, ROW + 3.3], [1.9, 2.8, ROW - 0.8], 48)) });
// C13: then I looked up at mine
shot('C13', { scene: IN, build() { const { A } = pair('rainbow', 'calm', { meFace: 'confused', umbrella: false, arm: () => 0 }); onPost(() => { A.pitch = -0.35; }); },
  cam: dolly(P([0.6, 2.3, ROW + 3.4], [0.6, 2.6, ROW - 0.8], 46), P([0.6, 2.3, ROW + 3.0], [0.6, 2.65, ROW - 0.8], 46)) });
// C14: it was raining glitter
shot('C14', { scene: IN, build() { const { A } = pair('rainbow', 'glitter', { meFace: 'smile', umbrella: false, arm: () => 0 }); onPost(() => { A.pitch = -0.2; }); hearts(ME_X, 2.0, ROW - 0.5, { n: 14, R: 0.8, size: 0.16 });
  sparkles(ME_X, 2.6, ROW - 0.75, { n: 80, R: 0.7, h: 1.2, color: 0xff9ad8 }); }, cam: dolly(P([0.6, 2.2, ROW + 3.6], [0.6, 2.75, ROW - 0.8], 50), P([0.6, 2.2, ROW + 3.2], [0.6, 2.8, ROW - 0.8], 50)) });
// C15: comment a rainbow if you'd hold the umbrella
shot('C15', { scene: IN, build() { pair('rainbow', 'glitter', { umbrella: false, arm: () => 0, roseLook: -0.3, meLook: 0.3 }); hearts(1.25, 2.0, ROW - 0.5, { n: 18, R: 1.4 });
  dynLabel(() => 'COMMENT\nA RAINBOW', 1.25, 1.05, ROW + 0.7, { w: 2.2, size: 130, color: '#ffd23a' }); }, cam: dolly(P([1.25, 2.3, ROW + 6.0], [1.25, 2.2, ROW - 0.8], 50), P([1.25, 2.3, ROW + 5.4], [1.25, 2.2, ROW - 0.8], 50)) });
