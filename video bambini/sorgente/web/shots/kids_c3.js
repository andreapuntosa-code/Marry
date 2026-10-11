// ANIMALS: walk to the farm, cow / sheep / horse / goat / dog, the deer, Blue rides the horse, counting sheep, the mammoth
import { T, L, KIDS, kid, row, hopper, walker, beast, dog, farm, tree, flowers } from './kids_kit.js';
const F = L.farm;
// every farm shot: fence, hay, hut, flowers, a couple of trees
function farmSet(c, f) { farm(c, f); flowers(c, f.x, f.z + 4, 14, 600, 7); const a = f.p(-16, 18), b = f.p(17, 10); tree(c, a[0], a[1], 10, 0); tree(c, b[0], b[1], 9, 1); }
// the animals inside the fence: cow, 3 sheep, horse, goat, dog (local coords around the pen centre (0, 14))
const POS = { cow: [-6, 12], sheep: [3.5, 16.5], horse: [7, 11], goat: [-1.5, 9.5], dog: [1.5, 7.2] };
function animals(c, f, o = {}) {
  const yawC = f.yaw + Math.PI;
  const P = (k, dx = 0, dz = 0) => f.p(POS[k][0] + dx, POS[k][1] + dz);
  const look = (k) => (o.call === k ? { graze: 0, look: -0.45 } : {});
  if (!o.skip?.includes('cow')) beast(c, 'cow', 1, ...P('cow'), yawC + 0.5, { phase: 1, ...look('cow') });
  if (!o.skip?.includes('sheep')) [[0, 0], [1.6, 0.9], [-1.4, 1.3]].forEach(([dx, dz], i) => beast(c, 'sheep', i + 1, ...P('sheep', dx, dz), yawC + 0.3 * i, { phase: i * 2, ...look('sheep') }));
  if (!o.skip?.includes('horse')) beast(c, 'horse', 3, ...P('horse'), yawC - 0.6, { phase: 3, ...look('horse') });
  if (!o.skip?.includes('goat')) beast(c, 'goat', 1, ...P('goat'), yawC + 0.2, { phase: 4, ...look('goat') });
  if (!o.skip?.includes('dog')) dog(c, ...P('dog'), yawC, { phase: 5, graze: 0, look: o.call === 'dog' ? -0.3 : 0 });
}
// kids watching from in front of the fence
function audience(c, f, ks = KIDS, pose = 'idle') { ks.forEach((k, i) => { const q = f.p(4.5 - i, 2.6 + (i % 2) * 0.5); kid(c, k, q[0], q[1], Array.isArray(pose) ? pose[i % pose.length] : pose, { yaw: f.yaw, phase: i }); }); }

T('chap:a00', 0, F, { cam: [-14, 7, -6], cam2: [-10, 6, -4], tgt: [0, 1, 13], fov: 52, cr: 6, sr: 50, set(c, f) { farmSet(c, f); animals(c, f); } });
// a00: walking to the farm
T('a00', 0, F, { cam: [-6, 1.6, -9], cam2: [-3, 1.6, -4], tgt: [0, 1.0, 2], tgt2: [0, 1.2, 8], fov: 48, cr: 6, sr: 40,
  set(c, f) { farmSet(c, f); animals(c, f); KIDS.forEach((k, i) => walker(c, 'K_' + k, f.p(3 - (i % 5) * 1.5, -8 - Math.floor(i / 5) * 1.5), f.p(3 - (i % 5) * 1.5, 1 - Math.floor(i / 5) * 1.2), { t0: 0.2 + i * 0.08, phase: i })); } });
const ANI = ['cow', 'sheep', 'horse', 'goat', 'dog'];
const GREETER = { cow: 'red', sheep: 'pink', horse: 'blue', goat: 'yellow', dog: 'green' };
ANI.forEach((an, n) => {
  const p = POS[an], id = (s) => `a${n + 1}${s}`;
  // a: who's that? (from behind the kids, over the fence)
  T(id('a'), 0, F, { cam: [p[0] * 0.5, 1.8, 0.5], cam2: [p[0] * 0.7, 1.6, 2.4], tgt: [p[0], 0.9, p[1]], fov: 44, cr: 6, sr: 40, set(c, f) { farmSet(c, f); animals(c, f); audience(c, f, KIDS, ['point', 'idle', 'wave']); } });
  // b: what does it say? (close on the animal)
  T(id('b'), 0, F, { cam: [p[0] + 1.6, 1.0, p[1] - 3.4], cam2: [p[0] + 1.2, 1.0, p[1] - 3.0], tgt: [p[0], an === 'horse' ? 1.5 : 0.8, p[1]], fov: 42, cr: 6, sr: 30, hero: true, set(c, f) { farmSet(c, f); animals(c, f); } });
  // c: the sound -- head up, the camera pushes in
  T(id('c'), 0, F, { cam: [p[0] + 0.9, 0.9, p[1] - 2.6], cam2: [p[0] + 0.6, 0.95, p[1] - 2.0], tgt: [p[0], an === 'horse' ? 1.7 : 0.9, p[1]], fov: 40, cr: 6, sr: 30, hero: true, shake: 0.02, set(c, f) { farmSet(c, f); animals(c, f, { call: an }); } });
  // d: a Little AI says hello to it
  const k = GREETER[an];
  T(id('d'), 0, F, { cam: [p[0] - 2.2, 1.2, p[1] - 4.6], cam2: [p[0] - 1.8, 1.2, p[1] - 4.0], tgt: [p[0] - 0.6, 1.0, p[1] - 1.6], fov: 44, cr: 6, sr: 30, set(c, f) { farmSet(c, f); animals(c, f); const q = f.p(p[0] - 0.8, p[1] - 1.9); kid(c, k, q[0], q[1], an === 'dog' ? 'crouch' : 'wave', { yawTo: f.p(p[0], p[1]) }); } });
});
// the deer at the edge of the trees (quiet!)
T('a5e', 0, F, { cam: [-20, 1.3, 4], cam2: [-19, 1.3, 6], tgt: [-26, 1.0, 14], fov: 40, cr: 6, sr: 40, hero: true,
  set(c, f) { farmSet(c, f); const a = f.p(-30, 18), b = f.p(-25, 22), d = f.p(-34, 14); tree(c, a[0], a[1], 11, 0); tree(c, b[0], b[1], 9, 1); tree(c, d[0], d[1], 10, 2); const q = f.p(-26, 14); beast(c, 'deer', 1, q[0], q[1], f.yaw + 2.2, { phase: 1 }); const q2 = f.p(-24, 16.5); beast(c, 'deer', 2, q2[0], q2[1], f.yaw + 1.8, { phase: 3, color: false }); } });
// Blue rides the horse
T('a5f', 0, F, { cam: [-2, 1.5, 2], cam2: [4, 1.6, 2], tgt: [-2, 1.4, 9], tgt2: [5, 1.4, 9], fov: 46, cr: 6, sr: 40,
  set(c, f) { farmSet(c, f); animals(c, f, { skip: ['horse'] }); const a = f.p(-4, 9), b = f.p(10, 9); const h = beast(c, 'horse', 3, a[0], a[1], 0, { speed: 0.9, move: b, v: 2.2, cadence: 6 }); const P = kid(c, 'blue', a[0], a[1], 'idle'); c.ride(P, h, { gait: 0.6, cadence: 6 }); } });
T('a5g', 0, F, { cam: [8, 1.6, 4], cam2: [7, 1.6, 5], tgt: [6, 1.6, 9], fov: 42, cr: 6, sr: 30, hero: true,
  set(c, f) { farmSet(c, f); animals(c, f, { skip: ['horse'] }); const a = f.p(5, 9), b = f.p(9, 10); const h = beast(c, 'horse', 3, a[0], a[1], 0, { speed: 0.5, move: b, v: 1.4, cadence: 6 }); const P = kid(c, 'blue', a[0], a[1], 'idle'); c.ride(P, h, { gait: 0.3, cadence: 6, pose: 'rideSeat' }); } });
// counting the three sheep
T('a6a', 0, F, { cam: [1.0, 2.2, 9.0], cam2: [1.6, 2.0, 10.4], tgt: [3.6, 0.6, 17], fov: 46, cr: 6, sr: 30, set(c, f) { farmSet(c, f); animals(c, f); } });
T('a6b', 0, F, { cam: [3.5, 1.3, 11.6], cam2: [3.4, 1.2, 12.2], tgt: [3.6, 0.6, 17.2], fov: 46, cr: 6, sr: 30, hero: true, set(c, f) { farmSet(c, f); animals(c, f, { call: 'sheep' }); } });
// the mammoth arrives
function mammoth(c, f, o = {}) { const a = f.p(-22, 6), b = f.p(-11, 5); beast(c, 'mammoth', 1, a[0], a[1], f.yaw + Math.PI / 2, { speed: o.speed ?? 0.5, move: o.still ? undefined : b, v: 1.2, trunkUp: o.trunkUp, cadence: 4 }); }
T('a7a', 0, F, { cam: [-2, 1.0, -2], cam2: [-3, 0.9, -1], tgt: [-14, 3.0, 5.5], fov: 50, cr: 6, sr: 50, set(c, f) { farmSet(c, f); animals(c, f); mammoth(c, f); audience(c, f, KIDS.slice(0, 6), 'lookUp'); } });
T('a7b', 0, F, { cam: [-8, 1.2, -3], cam2: [-8.4, 1.1, -2], tgt: [-12, 3.0, 5], fov: 46, cr: 6, sr: 50, set(c, f) { farmSet(c, f); const a = f.p(-12, 5); beast(c, 'mammoth', 1, a[0], a[1], f.yaw + Math.PI * 0.85, { speed: 0, graze: 0.2, cadence: 4 }); } });
T('a7c', 0, F, { cam: [-9, 0.8, -1.5], cam2: [-9.2, 0.7, -0.6], tgt: [-12, 4.0, 5], fov: 50, cr: 6, sr: 50, shake: 0.06, hero: true, set(c, f) { farmSet(c, f); const a = f.p(-12, 5); beast(c, 'mammoth', 1, a[0], a[1], f.yaw + Math.PI * 0.85, { speed: 0, graze: 0, look: -0.5, trunkUp: 1, cadence: 4 }); } });
T('a7d', 0, F, { cam: [-6, 1.2, -4.5], cam2: [-6.5, 1.3, -5.5], tgt: [-6, 1.2, 1.5], fov: 48, cr: 6, sr: 50, set(c, f) { farmSet(c, f); const a = f.p(-12, 5); beast(c, 'mammoth', 1, a[0], a[1], f.yaw + Math.PI * 0.85, { speed: 0, cadence: 4 }); KIDS.slice(0, 7).forEach((k, i) => { const q = f.p(-3 - i * 0.9, 1 + (i % 2) * 0.6); kid(c, k, q[0], q[1], i % 2 ? 'cheer' : 'lookUp', { yawTo: f.p(-12, 5), phase: i }); }); } });
