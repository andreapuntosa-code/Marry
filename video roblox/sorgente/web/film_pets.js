// "In this world, every pet can talk for one day a year." -- shots for script_pets.py
import { THREE, shot, person, street, room, dog, add, on, onPost, sm, lerp, getScene, shadowAt } from './kit.js';
import { blk, sparkles, dust } from './sets.js';
import { ME, P, dolly, CUY, M_, DOF, DAY, dynLabel } from './whatif.js';
import { bubble, hearts, cat, parrot, fishBowl, livingRoom, CROWD as PP } from './cute.js';

const IN = { interior: true, bloom: 0.25, bloomThreshold: 1.4, exposure: 0.72, dof: DOF };
const NIGHT_IN = { interior: true, night: true, bloom: 0.45, bloomThreshold: 1.0, exposure: 0.9, dof: DOF };
const OLD = 0xbab0a0;   // Biscuit: grey with age
const biscuit = (x, z, yaw, o = {}) => { const D = dog(x, z, yaw, { color: OLD, scale: o.scale ?? 0.8, sit: o.sit }); if (o.lie) onPost(() => { D.root.position.y = -0.34; }); if (o.headDown !== undefined) onPost((u) => { D.head.rotation.x = typeof o.headDown === 'function' ? o.headDown(u) : o.headDown; }); return D; };
const kitchen = () => { room({ wall: 0xfff0c0, floor: '#d8b890', w: 10, d: 9, h: 5, lamp: 26 });
  blk(3.2, 0.16, 1.8, M_(0xffffff), 0, 1.3, -2.4); for (const s of [-1.4, 1.4]) for (const t of [-0.7, 0.7]) blk(0.14, 1.3, 0.14, M_(0x8a5a34), s, 0.65, -2.4 + t);
  blk(10, 2.2, 1.2, M_(0x7ab8a8), 0, 1.1, -3.9); blk(10, 0.12, 1.3, M_(0xf6f6f2), 0, 2.26, -3.9); blk(2, 1.6, 0.6, M_(0x7ab8a8), -3, 3.8, -4.1);
  const plate = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.26, 0.05, 32), M_(0xffffff, { r: 0.3 })); plate.position.set(0, 1.41, -2.1); add(plate);
  for (let i = 0; i < 5; i++) { const b = new THREE.Mesh(new THREE.SphereGeometry(0.09, 10, 8), M_(0x7a5a2a, { r: 0.9 })); b.position.set(-0.12 + (i % 3) * 0.12, 1.47, -2.15 + Math.floor(i / 3) * 0.1); add(b); }
  shadowAt(0, -2, 8); };

// T01: every pet can talk... one day a year (a dog on the street says "HELLO!")
shot('T01', { scene: DAY, build() { street();
  const A = person(ME, -0.6, -6.0, 0.3, 'idle'); A.look = 0.5; const D = dog(0.7, -5.6, -0.4, { color: 0xc0874a, scale: 0.7 });
  bubble('HELLO!!', 0.85, 1.85, -5.4, { w: 1.0, t0: 1.6, tail: -1 }); dynLabel(() => '1 DAY A YEAR', 0, 3.2, -6.4, { w: 2.6, size: 120, color: '#ffd23a' }); shadowAt(0, -6, 8);
}, cam: dolly(P([0.4, 2.0, -0.2], [0.1, 1.6, -6], 52), P([0.3, 1.9, -1.0], [0.1, 1.6, -6], 52)) });
// T02: Pet Day -- the whole town goes crazy (banner, people, pets, bubbles)
shot('T02', { scene: DAY, build() { street();
  const ban = blk(5.4, 1.1, 0.1, M_(0xff5a8a), 0, 4.6, -7.6); for (const s of [-1, 1]) blk(0.15, 5.2, 0.15, M_(0x2a2a30), s * 2.8, 2.6, -7.6);
  dynLabel(() => 'HAPPY PET DAY!', 0, 4.6, -7.5, { w: 5.0, size: 120, color: '#ffffff' });
  [[PP[0], -2.6, -6.6, 0.4], [PP[3], 2.4, -6.8, -0.4], [PP[5], -0.4, -8.4, 0]].forEach(([d, x, z, y]) => person(d, x, z, y, 'cheer'));
  dog(-1.6, -5.6, 0.3, { color: 0xe8e0d0, scale: 0.6 }); dog(1.4, -5.4, -0.5, { color: 0x3a2a20, scale: 0.55 }); cat(0.2, 0, -5.2, 0, { scale: 0.9 }); cat(3.2, 0, -5.8, -0.6, { color: 0x3a3a40, stripes: false, scale: 0.9 });
  bubble('FEED ME!', -1.4, 1.5, -5.4, { w: 1.1, t0: 0.4 }); bubble('BALL?!', 1.7, 1.35, -5.1, { w: 1.0, t0: 1.0 }); bubble('NO.', 0.25, 1.4, -5.0, { w: 0.8, t0: 1.6 });
  sparkles(0, 3.5, -6.5, { n: 160, R: 4, h: 2, color: 0xffd23a, size: 0.12 }); shadowAt(0, -6, 10);
}, cam: dolly(P([0, 2.6, 4.0], [0, 2.4, -6.5], 58), P([0, 2.5, 3.0], [0, 2.4, -6.5], 58)) });
// T03-T04: the cat judges your cooking -- "Mid."
shot('T03', { scene: IN, build() { kitchen(); const C = cat(0.55, 1.38, -2.0, -0.9, { bored: true, look: () => -0.2 }); const M = person({ ...PP[3], acc: ['apron'] }, -0.9, -3.0, 0.4, 'present', { face: 'smile' });
  dynLabel(() => 'CHEF', -0.9, 3.4, -3.0, { w: 1.6, size: 140, color: '#ffd23a' }); }, cam: dolly(P([0.8, 2.4, 2.6], [0, 1.6, -2.3], 50), P([0.6, 2.3, 2.0], [0, 1.6, -2.2], 50)) });
shot('T04', { scene: IN, build() { kitchen(); cat(0.55, 1.38, -2.0, -0.9, { bored: true, look: () => 0.75, nod: () => 0.1 }); const M = person({ ...PP[3], acc: ['apron'] }, -0.9, -3.0, 0.4, 'shock', { face: 'shock' });
  bubble('Mid.', 0.75, 2.45, -1.8, { w: 0.85, t0: 0.05, size: 190, tail: 1 }); }, cam: dolly(P([1.4, 2.1, 1.0], [0.6, 1.95, -2.0], 46), P([1.3, 2.05, 0.6], [0.6, 1.95, -2.0], 46)) });
// T05-T06: parrots tell everyone your secrets
function parrotRoom(talk) { livingRoom(); const stand = blk(0.1, 1.8, 0.1, M_(0x8a5a34), 1.6, 0.9, -2.6); blk(0.8, 0.08, 0.8, M_(0x8a5a34), 1.6, 0.04, -2.6);
  const Pq = parrot(1.6, 1.8, -2.6, -0.5, { talk }); shadowAt(0, -2, 8); return Pq; }
shot('T05', { scene: IN, build() { parrotRoom(() => 0.02); const A = person(ME, -0.6, -2.4, 0.5, 'idle'); A.look = 0.3; [[PP[1], -1.8, -3.4, 0.6], [PP[4], -2.4, -2.0, 0.9]].forEach(([d, x, z, y]) => { const q = person(d, x, z, y, 'idle'); q.look = 0.4; });
  dynLabel(() => 'SECRETS', 0, 4.3, -4.0, { w: 2.6, size: 140, color: '#ff5a8a' }); }, cam: dolly(P([0.6, 2.3, 3.8], [0.2, 1.8, -2.6], 52), P([0.5, 2.2, 3.1], [0.2, 1.8, -2.6], 52)) });
shot('T06', { scene: IN, build() { parrotRoom(() => 0.15); const A = person(ME, -0.6, -2.4, 0.5, 'shock', { face: 'shock' }); [[PP[1], -1.8, -3.4, 0.6, 'tongue'], [PP[4], -2.4, -2.0, 0.9, 'open']].forEach(([d, x, z, y, f]) => { const q = person(d, x, z, y, 'point', { face: f }); });
  bubble('HE STILL SLEEPS WITH\nA NIGHT LIGHT!', 0.6, 3.1, -2.2, { w: 1.9, t0: 0.05, tail: 1 }); }, cam: dolly(P([0.3, 2.4, 3.4], [0.3, 2.1, -2.5], 52), P([0.3, 2.35, 2.9], [0.3, 2.1, -2.5], 52)) });
// T07-T08: goldfish forget what they wanted to say
function fishScene(o) { livingRoom({ wall: 0xd8ecff }); blk(1.6, 0.1, 1.0, M_(0xc89a64), 0, 1.3, -2.0); for (const s of [-0.7, 0.7]) blk(0.1, 1.3, 0.8, M_(0xc89a64), s, 0.65, -2.0); return fishBowl(0, 1.35, -2.0, o); }
shot('T07', { scene: IN, build() { fishScene({}); dynLabel(() => 'GOLDFISH', 0, 2.75, -2.6, { w: 1.4, size: 140, color: '#ff9a3a' }); shadowAt(0, -2, 6); }, cam: dolly(P([0.3, 2.4, 1.9], [0, 1.95, -2.0], 46), P([0.2, 2.3, 1.3], [0, 1.95, -2.0], 46)) });
shot('T08', { scene: IN, build() { fishScene({ still: true, face: -Math.PI / 2 }); bubble((u, d) => u < d * 0.35 ? 'HI! I\'M...' : u < d * 0.7 ? 'UH...' : 'HI!', 0.12, 2.5, -1.8, { w: 0.8, t0: 0.05, tail: -1 });
  shadowAt(0, -2, 6); }, cam: dolly(P([0.2, 2.15, 0.6], [0.15, 2.05, -2.0], 46), P([0.15, 2.1, 0.2], [0.15, 2.1, -2.0], 46)) });
// T09: Biscuit, fourteen, grey and slow, sleeping all day
shot('T09', { scene: IN, build() { livingRoom(); biscuit(0, -1.4, 0.5, { lie: true, headDown: 0.25 }); dynLabel(() => '14 YEARS OLD', 0, 1.85, -2.6, { w: 2.0, size: 130, color: '#ffd23a' });
  for (let i = 0; i < 3; i++) dynLabel((u) => (Math.floor(u * 1.5) + i) % 3 === 0 ? 'z' : 'Z', 0.4 + i * 0.25, 1.2 + i * 0.25, -0.6, { w: 0.4 + i * 0.1, size: 200, color: '#ffffff' }); shadowAt(0, -1, 6);
}, cam: dolly(P([0.8, 1.6, 2.6], [0, 0.6, -1.2], 48), P([0.6, 1.4, 1.8], [0, 0.6, -1.2], 48)) });
// T10: midnight, sitting next to him, waiting for his first word ever
function night() { livingRoom({ night: true }); dynLabel((u, d) => u < 2.2 ? '11:59' : '12:00', 0.4, 4.2, -4.8, { w: 2.0, size: 170, color: '#ff4a4a' }); }
shot('T10', { scene: NIGHT_IN, build() { night(); const A = person(ME, -0.9, -2.0, 0.6, 'sit', { y: -0.25 }); A.look = 0.4; biscuit(0.5, -1.7, -0.5, { lie: true, headDown: 0.15 }); shadowAt(0, -2, 6); },
  cam: dolly(P([0.2, 1.8, 2.8], [-0.1, 1.0, -2.0], 50), P([0.2, 1.6, 2.0], [-0.1, 1.0, -2.0], 50)) });
// T11: I was scared he'd say I wasn't a good owner (worried close-up)
shot('T11', { scene: NIGHT_IN, build() { night(); const A = person(ME, -0.9, -2.0, 0.6, 'sit', { y: -0.25, face: 'sad' }); A.look = 0.3; biscuit(0.5, -1.7, -0.5, { lie: true, headDown: 0.15 });
  dynLabel(() => 'BAD OWNER?', -0.85, 2.3, -2.2, { w: 1.2, size: 140, color: '#ff8a7a' }); shadowAt(0, -2, 6); }, cam: dolly(P([-0.1, 1.6, 0.6], [-0.85, 1.35, -2.0], 46), P([-0.2, 1.55, 0.2], [-0.85, 1.35, -2.0], 46)) });
// T12: he looked at me with his tired eyes (slow push on Biscuit, lifting his head)
shot('T12', { scene: NIGHT_IN, build() { night(); biscuit(0, -1.6, 0, { sit: true, headDown: (u) => lerp(0.35, 0.05, sm(0.3, 1.8, u)) }); shadowAt(0, -2, 6); },
  cam: dolly(P([0.2, 1.3, 2.3], [0, 1.1, -1.2], 44), P([0.15, 1.25, 1.6], [0, 1.1, -1.2], 44)) });
// T13: "Thank you... for picking me."
shot('T13', { scene: NIGHT_IN, build() { night(); biscuit(0, -1.6, 0, { sit: true, headDown: 0.05 }); bubble('Thank you...\nfor picking me.', 0.05, 2.0, -1.0, { w: 1.2, t0: 0.05 });
  sparkles(0, 0.8, -1.2, { n: 60, R: 0.9, h: 1.4, color: 0xffd28a, size: 0.06 }); shadowAt(0, -2, 6); }, cam: dolly(P([0.1, 1.45, 2.0], [0, 1.4, -1.3], 46), P([0.05, 1.45, 1.6], [0, 1.45, -1.3], 46)) });
// T14: the shelter, fourteen years ago: everyone walks past the smallest, ugliest puppy
const SEPIA = { interior: true, bloom: 0.25, bloomThreshold: 1.4, exposure: 0.7, sky: ['#d8c8a8', '#f0e4c8'], dof: DOF };
function shelter() { room({ wall: 0xd8d0c0, floor: '#a89a88', w: 14, d: 10, h: 6, lamp: 22 }); dynLabel(() => 'ANIMAL SHELTER', 0, 3.3, -4.8, { w: 3.6, size: 120, color: '#6a5a4a', stroke: '#f6efdc' });
  const bars = M_(0x8a8a90, { m: 0.6, r: 0.4 }); const cols = [0xf0d8a0, 0x3a2a20, 0xe8e0d0, 0x8a7a6a, 0xc0874a];
  for (let i = 0; i < 5; i++) { const cx = -4.4 + i * 2.2; blk(2.0, 0.1, 1.6, M_(0xb8b0a0), cx, 1.6, -3.8); blk(2.0, 0.1, 1.6, M_(0xb8b0a0), cx, 0.05, -3.8); for (let k = 0; k < 9; k++) blk(0.04, 1.5, 0.04, bars, cx - 0.9 + k * 0.225, 0.82, -3.0, { sharp: true });
    const ugly = i === 2; const D = dog(cx, -3.8, 0, { color: cols[i], scale: ugly ? 0.34 : 0.48, sit: true }); if (ugly) onPost(() => { D.head.rotation.z = 0.3; }); }
  return 2; }
shot('T14', { scene: SEPIA, build() { shelter(); [[PP[0], -5, -1.6, 1, 0.9], [PP[3], -7, -1.2, 1, 1.0], [PP[6], 4, -1.8, -1, 0.8]].forEach(([d, x, z, dir, sp]) => person(d, x, z, dir > 0 ? Math.PI / 2 : -Math.PI / 2, 'walk', { anim: (A, u) => { A.root.position.x = x + dir * sp * u; } }));
  dynLabel(() => '14 YEARS AGO', 0, 2.4, -2.4, { w: 1.8, size: 130, color: '#ffffff' }); shadowAt(0, -3, 10); }, cam: dolly(P([0, 1.6, 1.4], [0, 1.1, -3.4], 54), P([0, 1.5, 0.8], [0, 1.0, -3.4], 54)), fx: () => ({ paint: 0.15 }) });
// T15: except me (little me kneels at the cage, the puppy wags)
shot('T15', { scene: SEPIA, build() { shelter(); const K = person({ ...ME, scale: 0.6 }, 0.55, -2.5, Math.PI + 0.3, 'point', { face: 'smile' }); sparkles(0, 0.6, -3.4, { n: 50, R: 0.6, h: 1.0, color: 0xffd28a });
  hearts(0, 0.9, -3.3, { n: 10, R: 0.6, size: 0.14 }); shadowAt(0, -3, 6); }, cam: dolly(P([-1.3, 1.25, -0.6], [0.2, 0.75, -3.4], 48), P([-1.1, 1.15, -1.0], [0.2, 0.75, -3.4], 48)), fx: () => ({ paint: 0.15 }) });
// T16: the rest of his day with his head on my lap, saying my name over and over
shot('T16', { scene: NIGHT_IN, build() { night(); const A = person(ME, 0, -2.0, 0, 'sit', { y: -0.25, face: 'cry' }); onPost(() => { A.armL.rotation.set(-0.9, 0, -0.3); A.armR.rotation.set(-0.9, 0, 0.3); });
  biscuit(1.0, -0.95, -Math.PI / 2, { lie: true, headDown: 0.2, scale: 0.75 }); hearts(0.2, 1.2, -1.0, { n: 22, R: 1.2 }); sparkles(0, 1.0, -1.2, { n: 50, R: 1.2, h: 1.6, color: 0xffd28a, size: 0.05 }); shadowAt(0, -2, 6); },
  cam: dolly(P([0.4, 2.0, 2.4], [0.1, 1.0, -1.4], 50), P([0.3, 1.9, 1.7], [0.1, 1.0, -1.4], 50)), fx: (u, d) => ({ fade: 0.6 * sm(d - 0.6, d, u) }) });
// T17: comment your pet's name -- Biscuit says hi
shot('T17', { scene: IN, build() { livingRoom(); biscuit(0, -1.6, 0, { sit: true, headDown: (u) => Math.sin(u * 3) * 0.1 }); bubble('HI!', 0.6, 1.8, -1.1, { w: 0.7, t0: 0.3, size: 200 });
  dynLabel(() => "COMMENT YOUR\nPET'S NAME", 0, 2.55, -2.4, { w: 2.0, size: 120, color: '#ffd23a' }); hearts(0, 0.8, -1.4, { n: 16, R: 1.4 }); shadowAt(0, -2, 6); },
  cam: dolly(P([0.1, 1.6, 2.6], [0, 1.6, -1.6], 50), P([0.05, 1.55, 2.1], [0, 1.6, -1.6], 50)) });
