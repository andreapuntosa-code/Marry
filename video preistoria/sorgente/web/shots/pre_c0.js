// INTRO + CHAPTER I: WAKE UP (day 1)
import { T, L, PRE, ai, circle, beast, herd, snow, lineup, campfire, PRE20, WALKERS, KEEPERS, walker, dusk, night, dawn } from './pre_kit.js';
const V = L.valley, C = L.cave;
const crew = PRE20;
// p01..p03b: the valley, the herd, twenty tiny figures
T('p01', 0, L.plain, { ...dawn, cam: [-30, 7, -26], cam2: [-14, 5, -22], tgt: [0, 3, 22], fov: 56, cr: 60, sr: 60,
  set(c, f) { snow(c, { wind: 0.8 }); herd(c, f, 'mammoth', 5, { x0: -26, z0: 26, x1: 30, z1: 30, speed: 0.3, v: 1.4, dz: 7 }); } });
T('p02', 0, V, { hours: 8.5, cam: [0, 1.5, -10], cam2: [0, 1.3, -7.8], tgt: [0, 1.2, 0], fov: 48, cr: 16,
  set(c, f) { snow(c); lineup(c, f, crew.slice(0, 10), 'naked', 0, 1.5, 'idle'); lineup(c, f, crew.slice(10), 'naked', 1.8, 1.5, 'idle', { stagger: 0.5 }); } });
T('p03', 0, L.plain, { hours: 9.5, cam: [-9, 2.5, -18], cam2: [-3, 3.2, -12], tgt: [4, 3.5, 12], fov: 56, cr: 50, sr: 50,
  set(c, f) { snow(c); herd(c, f, 'mammoth', 7, { x0: -20, z0: 16, x1: 26, z1: 18, speed: 0.35, v: 1.3, dz: 8 }); } });
T('p03b', 0, V, { hours: 8.0, cam: [0, 1.0, -6], cam2: [0.6, 1.5, -4], tgt: [0, 1.3, 0], fov: 38, cr: 16,
  set(c, f) { snow(c, { n: 3000 }); ai(c, 'GORN', f.p(-1.6, 0)[0], f.p(-1.6, 0)[1], 'idle', 'naked', { yaw: Math.PI }); ai(c, 'LIA', f.p(0, 0)[0], f.p(0, 0)[1], 'lookUp', 'naked', { yaw: Math.PI }); ai(c, 'TUK', f.p(1.5, 0)[0], f.p(1.5, 0)[1], 'scratchHead', 'naked', { yaw: Math.PI }); } });
T('p04', 0, C, { hours: 17.4, cam: [4, 1.3, 9], tgt: [0, 1.4, 0], fov: 44, cr: 20,
  set(c, f) { snow(c); campfire(c, f.p(0, 3)[0], f.p(0, 3)[1], { size: 1 }); ai(c, 'GORN', f.p(-1.5, 3)[0], f.p(-1.5, 3)[1], 'idle', 'walker', { yawTo: f.p(0, 3) }); } });
T('p05', 0, C, { hours: 12, cam: [-3, 1.0, 8], tgt: [0, 1.3, 0], fov: 46, cr: 20,
  set(c, f) { snow(c); ai(c, 'LIA', f.p(0, 0)[0], f.p(0, 0)[1], 'idle', 'keeper', { yaw: f.yaw }); } });
T('p06', 0, C, { hours: 21.6, cam: [2, 0.9, 7], tgt: [0, 2.5, 0], fov: 50, cr: 20, hasStars: true,
  set(c, f) { snow(c); ai(c, 'KRU', f.p(0.4, 0)[0], f.p(0.4, 0)[1], 'lookUp', 'keeper', { yaw: f.yaw }); } });
T('p07', 0, L.plain, { ...dusk, cam: [-24, 10, -30], cam2: [-10, 6, -24], tgt: [0, 1, 10], fov: 52, cr: 60, sr: 60,
  set(c, f) { snow(c, { wind: 1 }); campfire(c, f.p(2, 8)[0], f.p(2, 8)[1], { size: 1.2 }); circle(c, WALKERS.slice(0, 6), f.p(2, 8)[0], f.p(2, 8)[1], 2.4, 'walker', 'sitGround', 0.3); } });
T('p08', 0, L.plain, { ...dawn, cam: [0, 14, -42], cam2: [0, 8, -30], tgt: [0, 2, 6], fov: 54, cr: 70, sr: 70,
  set(c, f) { snow(c); lineup(c, f, crew, 'naked', 0, 1.2, 'idle', { stagger: 0.8 }); } });
// ---------------------------------------------------------------- I. WAKE UP
T('chap:a01', 0, V, { hours: 6.4, cam: [-12, 4, -14], cam2: [-6, 3, -10], tgt: [0, 1, 4], fov: 52, cr: 40, set(c, f) { snow(c); } });
T('a01', 0, V, { hours: 7.0, cam: [0, 0.3, -5], cam2: [0.5, 1.2, -4.2], tgt: [0, 0.2, 0], fov: 50, cr: 16,
  set(c, f) { snow(c); for (const [i, n] of crew.slice(0, 8).entries()) { const q = f.p(-4.5 + i * 1.3, (i % 3) * 0.9); ai(c, n, q[0], q[1], 'sleep', 'naked', { yaw: i, phase: i }); } } });
T('a02', 0, V, { hours: 7.4, cam: [0, 1.6, -11], tgt: [0, 1.0, 0], fov: 50, cr: 20,
  set(c, f) { snow(c); lineup(c, f, crew, 'naked', 0, 1.35, ['armsCrossed', 'shrug', 'scratchHead', 'idle'], { stagger: 1.0 }); } });
T('a03', 0, V, { hours: 7.6, cam: [1.4, 1.2, -3.2], cam2: [0.8, 1.5, -2.4], tgt: [0, 1.5, 0], fov: 34, cr: 16,
  set(c, f) { snow(c); ai(c, 'LIA', f.p(0, 0)[0], f.p(0, 0)[1], 'scratchHead', 'naked', { yaw: Math.PI + 0.3 }); } });
T('a04', 0, V, { hours: 8.0, cam: [-6, 1.5, -9], cam2: [-4.5, 1.7, -7], tgt: [0, 1.7, 0], fov: 44, cr: 20,
  set(c, f) { snow(c); ai(c, 'GORN', f.p(0, 0)[0], f.p(0, 0)[1], 'point', 'naked', { yawTo: f.p(0, 20) }); } });
T('a05', 0, V, { hours: 8.2, cam: [6, 1.3, -8], cam2: [4, 1.5, -6], tgt: [0, 1.3, 0], fov: 44, cr: 20,
  set(c, f) { snow(c); ai(c, 'LIA', f.p(0, 0)[0], f.p(0, 0)[1], 'lookUp', 'naked', { yawTo: f.p(0, 20) }); } });
T('a06', 0, V, { hours: 8.4, cam: [0, 0.7, -5], cam2: [0.3, 0.9, -3.6], tgt: [0, 0.9, 0], fov: 46, cr: 16,
  set(c, f) { snow(c); ai(c, 'TUK', f.p(0, 0)[0], f.p(0, 0)[1], 'eat', 'naked', { yaw: Math.PI }); } });
T('a07', 0, V, { hours: 8.4, cam: [1.2, 1.5, -3], tgt: [0, 1.4, 0], fov: 32, cr: 16,
  set(c, f) { snow(c); ai(c, 'TUK', f.p(0, 0)[0], f.p(0, 0)[1], 'talk', 'naked', { yaw: Math.PI + 0.4 }); } });
T('a08', 0, C, { hours: 12, cam: [8, 2.5, 18], cam2: [4, 2.2, 13], tgt: [0, 2, 0], fov: 50, cr: 30, sr: 40, set(c, f) { snow(c, { n: 1400 }); PRE.cave(c, f.x, f.z, f.yaw, { phase: 0, light: false }); walker(c, 'GORN', f.p(-6, 14), f.p(-1, 3), { pose: 'walk' }); walker(c, 'LIA', f.p(-4, 15), f.p(1, 3), { pose: 'walk' }); } });
T('a08b', 1.2, L.lake, { hours: 12.4, cam: [2, 1.0, -3.4], tgt: [0, 0.4, 0], fov: 40, cr: 16, set(c, f) { snow(c, { n: 1000 }); ai(c, 'TUK', f.p(0, 0)[0], f.p(0, 0)[1], 'eat', 'naked', { yawTo: f.p(0, -3) }); } });
T('a09', 0, L.forest, { hours: 13.2, cam: [0, 1.0, -5], tgt: [0, 1.0, 0], fov: 44, cr: 16, set(c, f) { snow(c, { n: 1000 }); ai(c, 'PEK', f.p(-0.6, 0)[0], f.p(-0.6, 0)[1], 'headInHands', 'naked', { yaw: Math.PI }); ai(c, 'ZAN', f.p(0.9, 0.4)[0], f.p(0.9, 0.4)[1], 'sad', 'naked', { yaw: Math.PI }); } });
T('a09c', 0, V, { hours: 13.6, cam: [-5, 1.4, -6], tgt: [0, 1.3, 0], fov: 44, cr: 16, set(c, f) { snow(c); ai(c, 'GORN', f.p(0, 0)[0], f.p(0, 0)[1], 'bumpTree', 'naked', { yaw: f.yaw + 1.2 }); } });
T('a09d', 0, L.plain, { hours: 14.4, cam: [-8, 1.8, -12], cam2: [-4, 2.2, -8], tgt: [0, 1.4, 6], fov: 50, cr: 40, sr: 40, set(c, f) { snow(c); herd(c, f, 'deer', 6, { x0: -12, z0: 8, x1: 22, z1: 8, speed: 0.6, v: 2.4, dx: 4, dz: 3 }); ai(c, 'LIA', f.p(0, 0)[0], f.p(0, 0)[1], 'lookUp', 'naked', { yawTo: f.p(14, 8) }); } });
T('a09e', 0, L.plain, { hours: 15.0, cam: [-5, 1.5, -9], cam2: [-1, 1.7, -6], tgt: [4, 1.3, 4], fov: 50, cr: 40, sr: 40, set(c, f) { snow(c); for (let i = 0; i < 10; i++) { const a = f.p(-4 + i * 0.8, -1 + (i % 3) * 0.8), b = f.p(18 + i * 0.5, 6 + (i % 3)); walker(c, crew[i], a, b, { pose: 'walk' }); } ai(c, 'LIA', f.p(0, 0)[0], f.p(0, 0)[1], 'walk', 'naked', { yawTo: f.p(14, 6) }); herd(c, f, 'goat', 4, { x0: 2, z0: 8, x1: 24, z1: 8, speed: 0.6, v: 2.4, dx: 2, dz: 2 }); } });
T('a10', 0, C, { hours: 19.0, cam: [0, 1.2, 8], tgt: [0, 1.3, 0], fov: 46, cr: 30, set(c, f) { snow(c, { wind: 1.4 }); PRE.cave(c, f.x, f.z, f.yaw, { phase: 0, light: false }); } });
T('a11', 0, C, { hours: 21.5, cam: [0, 1.0, 12], cam2: [0, 1.0, 10], tgt: [0, 1.0, 0], fov: 48, cr: 30, hasStars: true, set(c, f) { snow(c, { wind: 1.4 }); PRE.cave(c, f.x, f.z, f.yaw, { phase: 0, light: true, lightI: 14 }); crew.slice(0, 8).forEach((n, i) => { const q = f.p(-5 + i * 1.4, 2 + (i % 2) * 1.2); ai(c, n, q[0], q[1], 'idle', 'naked', { yawTo: f.p(0, 20), phase: i }); }); } });
T('a12', 0, C, { hours: 20.6, cam: [-2, 1.4, 2], cam2: [-1, 1.4, 1], tgt: [3, 1.0, 10], fov: 52, cr: 30, hasStars: true, set(c, f) { snow(c, { wind: 1.4 }); for (let i = 0; i < 7; i++) { const q = f.p(-6 + i * 2.6, 9 + (i % 3) * 1.6); beast(c, 'wolf', i + 1, q[0], q[1], Math.PI + 0.3, { speed: 0, glow: 1 }); } } });
T('a13', 0, C, { hours: 20.6, cam: [0.5, 1.2, 5], tgt: [0, 1.0, 12], fov: 42, cr: 30, hasStars: true, set(c, f) { snow(c, { wind: 1.4 }); beast(c, 'wolf', 2, f.p(0, 12)[0], f.p(0, 12)[1], Math.PI, { speed: 0, graze: 0, glow: 1 }); beast(c, 'wolf', 3, f.p(-3, 13.5)[0], f.p(-3, 13.5)[1], Math.PI + 0.4, { speed: 0, glow: 1 }); beast(c, 'wolf', 4, f.p(3.5, 14)[0], f.p(3.5, 14)[1], Math.PI - 0.4, { speed: 0, glow: 1 }); } });
T('a14', 0, C, { hours: 20.8, cam: [-3, 1.4, 9], cam2: [-1, 1.5, 7], tgt: [0, 1.3, 2], fov: 50, cr: 30, hasStars: true, set(c, f) { snow(c, { wind: 1.4 }); crew.slice(0, 8).forEach((n, i) => { const q = f.p(-3 + (i % 4) * 1.4, 2 + Math.floor(i / 4) * 1.3); ai(c, n, q[0], q[1], i === 0 ? 'armsOpen' : 'idle', 'naked', { yawTo: f.p(0, 20) }); }); beast(c, 'wolf', 2, f.p(2, 14)[0], f.p(2, 14)[1], Math.PI, { speed: 0 }); } });
T('a15', 0, C, { hours: 20.8, cam: [0, 2, 13], cam2: [0, 1.6, 5], tgt: [0, 1.0, 3], fov: 60, cr: 30, hasStars: true, set(c, f) { snow(c, { wind: 1.8 }); crew.slice(0, 8).forEach((n, i) => { const a = f.p(-4 + (i % 4) * 1.5, 3), b = f.p(-14 + i * 4, -8 + (i % 3) * 3); walker(c, n, a, b, { pose: 'run', run: true }); }); for (let i = 0; i < 5; i++) { const a = f.p(-8 + i * 4, 18), b = f.p(-6 + i * 2.5, 4); beast(c, 'wolf', i, a[0], a[1], Math.PI, { speed: 1, move: b, v: 5 }); } } });
T('a16', 0, C, { hours: 6.8, cam: [3, 1.2, 10], cam2: [2, 1.3, 7], tgt: [0, 1.2, 0], fov: 46, cr: 30, set(c, f) { snow(c, { wind: 0.3 }); PRE.cave(c, f.x, f.z, f.yaw, { phase: 0.02, light: true, lightI: 10 }); crew.slice(3, 15).forEach((n, i) => { const q = f.p(-3.5 + (i % 6) * 1.35, 0.6 + Math.floor(i / 6) * 1.2); ai(c, n, q[0], q[1], 'sitGround', 'naked', { yaw: f.yaw, phase: i }); }); } });
T('a17', 0, C, { hours: 7.4, cam: [0, 2.8, 20], cam2: [0, 6, 28], tgt: [0, 2, 0], fov: 50, cr: 40, sr: 40, set(c, f) { snow(c, { wind: 0.3 }); PRE.cave(c, f.x, f.z, f.yaw, { phase: 0.02, light: false }); } });
