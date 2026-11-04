// X: "What if your IQ kept rising forever?" -- cinematic low-poly park, a picnic, muted people, and what you'd understand
// at each level: patterns (glowing links), dark matter (a cosmic web in the night sky), aging (a DNA helix), fusion
// (a star in a bottle), consciousness (a neural web), the origin of the universe (a galaxy), infinity (white-out).
import { T, L, meadowDress, tree, THREE, height, lerp, sm } from './whatif_kit.js';
import { who, walker } from './hgkit.js';
import { CAST } from '../lib/people.js';

const M = L.meadow;
// muted, everyday colours (the reference look), no numbers, no cartoon faces
const PEOPLE = {
  you: [0x55759a, { type: 'hair', style: 'short', color: 0x2a1d14 }], a: [0xd8c4a0, { type: 'hair', style: 'ponytail', color: 0x6a3d1e }],
  b: [0x7d8c5a, { type: 'hair', style: 'short', color: 0x1c1410 }], c: [0xb0643a, { type: 'hair', style: 'bun', color: 0x3a2a1a }],
  d: [0x6c7a89, { type: 'hat', color: 0xd9c7a0 }], e: [0xe6dcc6, { type: 'hair', style: 'short', color: 0x8a6a3a }],
  f: [0x2f3e5c, { type: 'hair', style: 'ponytail', color: 0x1a1210 }], g: [0x7a2e3a, { type: 'hair', style: 'short', color: 0x3a2412 }],
  h: [0xa8b8a0, { type: 'scarf', color: 0x7a5a3a }], i: [0xc9a46a, { type: 'hair', style: 'bun', color: 0x2a1d14 }],
};
for (const [k, [colr, acc]] of Object.entries(PEOPLE)) CAST['IQ_' + k] = { id: null, name: k, color: colr, scale: k === 'you' ? 1.0 : 0.94 + (k.charCodeAt(0) % 3) * 0.04, width: 1.0, acc: [acc] };
const P = (k) => 'IQ_' + k;

const rr = (seed) => { let s = seed * 9301 + 49297; return () => ((s = (s * 9301 + 49297) % 233280) / 233280); };
let GLOW = null;
function glowTex() {
  if (GLOW) return GLOW; const cv = document.createElement('canvas'); cv.width = cv.height = 128; const g = cv.getContext('2d');
  const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.25, 'rgba(255,255,255,0.6)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128); GLOW = new THREE.CanvasTexture(cv); return GLOW;
}
const add = (c, o) => { c.add(o); return o; };

// ------------------------------------------------------------------ props
function blanket(c, f, dx, dz, rot = 0, cols = ['#c9443f', '#f1ece0'], w = 2.2, d = 1.7) {
  const cv = document.createElement('canvas'); cv.width = cv.height = 128; const g = cv.getContext('2d');
  for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) { g.fillStyle = (i + j) % 2 ? cols[0] : cols[1]; g.fillRect(i * 16, j * 16, 16, 16); }
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace;
  const geo = new THREE.PlaneGeometry(w, d); geo.rotateX(-Math.PI / 2); c.own(geo);
  const m = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ map: tex })); const p = f.p(dx, dz);
  m.position.set(p[0], height(p[0], p[1]) + 0.03, p[1]); m.rotation.y = f.yaw + rot; m.receiveShadow = true; c.add(m);
  // a basket
  const bk = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.16, 0.22, 10), new THREE.MeshLambertMaterial({ color: 0x9a6a3a })); const q = f.p(dx + w * 0.3, dz + d * 0.2);
  bk.position.set(q[0], height(q[0], q[1]) + 0.13, q[1]); bk.castShadow = true; c.add(bk);
  return m;
}
// the people of the park: picnics, walkers, a jogger
function park(c, f, o = {}) {
  meadowDress(c, f, { R: 22, n: 700 });
  const t1 = f.p(-12, 20), t2 = f.p(14, 24), t3 = f.p(-18, 6);
  tree(c, t1[0], t1[1], 10, 2); tree(c, t2[0], t2[1], 12, 3); tree(c, t3[0], t3[1], 9, 1);
  blanket(c, f, 0, 0.6, 0.1);
  if (o.crowd !== false) {
    blanket(c, f, -4.5, 5, -0.3, ['#3f6fa3', '#f1ece0']); blanket(c, f, 5, 6.5, 0.4, ['#e0a83a', '#f6f1e4']); blanket(c, f, -8, 12, 0.2, ['#5a8a5a', '#efe9da']);
    const sit = (k, dx, dz, yaw, pose = 'sitGround') => { const q = f.p(dx, dz); who(c, P(k), q[0], q[1], pose, { yaw: f.yaw + yaw, phase: dx }); };
    sit('a', -4.9, 5.1, 2.6); sit('b', -4.0, 4.6, 3.6, 'talk'); sit('c', 5.2, 6.8, 3.4); sit('d', 4.4, 6.3, 2.2, 'eat'); sit('e', -8.2, 12.1, 3.0);
    const w = (k, a, b, t0 = 0, sp = 1, run = false) => walker(c, P(k), f.p(...a), f.p(...b), { t0, t1: t0 + 30, speed: sp, run });
    w('f', [-14, 9], [16, 11]); w('g', [15, 15], [-15, 18], 0, 1); w('h', [-12, 3], [14, 2.5], 0, 1.4, true); w('i', [10, 22], [-12, 26]);
  }
}
// "you": sitting on the blanket at the frame origin, facing the camera side (-dz)
function you(c, f, pose = 'sitGround', o = {}) { const q = f.p(o.dx ?? 0, o.dz ?? 0.5); return who(c, P('you'), q[0], q[1], pose, { yaw: f.yaw + Math.PI + (o.turn ?? 0), phase: 0.3, ...o }); }

// glowing links that appear one after another between points (the patterns you suddenly see)
function links(c, pts, o = {}) {
  const r = rr(o.seed ?? 3), n = o.n ?? 60, pairs = [];
  for (let i = 0; i < n; i++) { const a = pts[Math.floor(r() * pts.length)], b = pts[Math.floor(r() * pts.length)]; if (a !== b) pairs.push([a, b, r()]); }
  const pos = new Float32Array(pairs.length * 6); const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); c.own(geo);
  const mat = new THREE.LineBasicMaterial({ color: o.color ?? 0x9fe8ff, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false, fog: false });
  const ls = add(c, new THREE.LineSegments(geo, mat)); ls.frustumCulled = false;
  const dots = new Float32Array(pts.length * 3); pts.forEach((p, i) => dots.set(p, i * 3));
  const dg = new THREE.BufferGeometry(); dg.setAttribute('position', new THREE.BufferAttribute(dots, 3)); c.own(dg);
  const dm = new THREE.PointsMaterial({ size: o.dot ?? 0.35, map: glowTex(), color: o.color ?? 0x9fe8ff, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false });
  const dp = add(c, new THREE.Points(dg, dm)); dp.frustumCulled = false;
  const t0 = o.t0 ?? 0.3, rate = o.rate ?? 0.6;
  c.on((t) => {
    pairs.forEach(([a, b, k], i) => { const u = Math.max(0, Math.min(1, (t - t0 - k * (o.spread ?? 3)) * (rate * 2))); pos.set([a[0], a[1], a[2], lerp(a[0], b[0], u), lerp(a[1], b[1], u), lerp(a[2], b[2], u)], i * 6); });
    geo.attributes.position.needsUpdate = true; dm.opacity = Math.min(1, Math.max(0, (t - t0 + 0.2) * 2)) * (0.7 + 0.3 * Math.sin(t * 3)); mat.opacity = (o.op ?? 0.75) * Math.min(1, Math.max(0, (t - t0) * 2));
  });
}
// a huge faint web across the night sky (dark matter's scaffolding)
function cosmicWeb(c, f, o = {}) {
  const r = rr(o.seed ?? 11), pts = [];
  for (let i = 0; i < 140; i++) { const q = f.p((r() - 0.5) * 900, 250 + r() * 700); pts.push([q[0], 120 + r() * 520, q[1]]); }
  links(c, pts, { n: 260, color: 0xb59cff, dot: 9, t0: o.t0 ?? 1.0, spread: 2.2, rate: 0.7, op: 0.45, seed: 5 });
}
// a slowly turning DNA double helix floating above the blanket
function dna(c, x, y, z, o = {}) {
  const g = new THREE.Group(); g.position.set(x, y, z); c.add(g);
  const sg = new THREE.SphereGeometry(0.06, 10, 8); c.own(sg);
  const mA = new THREE.MeshBasicMaterial({ color: 0xffd27a }), mB = new THREE.MeshBasicMaterial({ color: 0x7ad7ff }), mR = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.55 });
  const N = 34, H = o.h ?? 2.4, R = 0.34; const rungs = [];
  for (let i = 0; i < N; i++) {
    const a = i * 0.42, yy = (i / N) * H;
    const p1 = new THREE.Mesh(sg, mA), p2 = new THREE.Mesh(sg, mB); p1.position.set(Math.cos(a) * R, yy, Math.sin(a) * R); p2.position.set(-Math.cos(a) * R, yy, -Math.sin(a) * R); g.add(p1, p2);
    if (i % 2 === 0) { const cy = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 2 * R, 5), i === 18 ? new THREE.MeshBasicMaterial({ color: 0xff4d4d }) : mR); cy.rotation.z = Math.PI / 2; cy.rotation.y = -a; cy.position.y = yy; g.add(cy); rungs.push([cy, i]); }
  }
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex(), color: 0xffe2a0, transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending, depthWrite: false })); halo.scale.set(3.4, 3.4, 1); halo.position.y = H / 2; g.add(halo);
  c.on((t) => { g.rotation.y = t * 0.6; const k = sm(0.2, 1.4, t); g.scale.setScalar(Math.max(0.001, k)); rungs.forEach(([cy, i]) => { if (i === 18) cy.material.color.setHex(t > 3.4 ? 0x6dff9a : (Math.sin(t * 8) > 0 ? 0xff4d4d : 0xff9a9a)); }); });
  return g;
}
// a glass jar with a tiny sun inside
function starJar(c, x, z, o = {}) {
  const y0 = height(x, z);
  const st = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.4, 0.5, 12), new THREE.MeshLambertMaterial({ color: 0x5a4a3a })); st.position.set(x, y0 + 0.25, z); st.castShadow = true; c.add(st);
  const jar = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.62, 24, 1, true), new THREE.MeshStandardMaterial({ color: 0xcfe8ff, transparent: true, opacity: 0.22, roughness: 0.05, metalness: 0.1, side: THREE.DoubleSide, depthWrite: false })); jar.position.set(x, y0 + 0.82, z); c.add(jar);
  const lid = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.06, 24), new THREE.MeshStandardMaterial({ color: 0xb8b8c0, metalness: 0.7, roughness: 0.3 })); lid.position.set(x, y0 + 1.15, z); c.add(lid);
  const sun = new THREE.Mesh(new THREE.SphereGeometry(0.13, 24, 16), new THREE.MeshBasicMaterial({ color: 0xfff2c8 })); sun.position.set(x, y0 + 0.82, z); c.add(sun);
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex(), color: 0xffc860, transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending, depthWrite: false })); halo.position.copy(sun.position); c.add(halo);
  const light = new THREE.PointLight(0xffd08a, 0, 30, 1.6); light.position.copy(sun.position); c.add(light);
  c.on((t) => { const k = sm(0.4, 1.6, t); const fl = 1 + 0.06 * Math.sin(t * 21) + 0.04 * Math.sin(t * 13); sun.scale.setScalar(Math.max(0.001, k * fl)); halo.scale.setScalar(0.2 + 1.6 * k * fl); light.intensity = 12 * k * fl; });
  return sun;
}
// a web of glowing neurons growing out from a point (the head) into the park
function neurons(c, cx, cy, cz, o = {}) {
  const r = rr(o.seed ?? 7), pts = [];
  for (let i = 0; i < 160; i++) { const a = r() * 6.283, e = (r() - 0.3) * 1.4, d = 0.3 + Math.pow(r(), 0.6) * (o.R ?? 14); pts.push([cx + Math.cos(a) * Math.cos(e) * d, cy + Math.max(-cy + 0.2, Math.sin(e) * d * 0.6), cz + Math.sin(a) * Math.cos(e) * d, d]); }
  pts.sort((p, q) => p[3] - q[3]);
  const pairs = []; for (let i = 1; i < pts.length; i++) { let best = 0, bd = 1e9; for (let j = 0; j < i; j++) { const d = (pts[i][0] - pts[j][0]) ** 2 + (pts[i][1] - pts[j][1]) ** 2 + (pts[i][2] - pts[j][2]) ** 2; if (d < bd) { bd = d; best = j; } } pairs.push([pts[best], pts[i]]); }
  const pos = new Float32Array(pairs.length * 6); const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); c.own(geo);
  const mat = new THREE.LineBasicMaterial({ color: 0xc8a8ff, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, depthWrite: false, fog: false });
  const ls = add(c, new THREE.LineSegments(geo, mat)); ls.frustumCulled = false;
  const dots = new Float32Array(pts.length * 3); const dg = new THREE.BufferGeometry(); dg.setAttribute('position', new THREE.BufferAttribute(dots, 3)); c.own(dg);
  const dm = new THREE.PointsMaterial({ size: 0.4, map: glowTex(), color: 0xe8d8ff, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false });
  const dp = add(c, new THREE.Points(dg, dm)); dp.frustumCulled = false;
  c.on((t) => {
    const front = Math.max(0, (t - 0.3) * (o.speed ?? 3.2));
    pairs.forEach(([a, b], i) => { const u = Math.max(0, Math.min(1, (front - a[3]) / Math.max(0.3, b[3] - a[3]))); pos.set([a[0], a[1], a[2], lerp(a[0], b[0], u), lerp(a[1], b[1], u), lerp(a[2], b[2], u)], i * 6); });
    pts.forEach((p, i) => { const on = front > p[3]; dots.set(on ? [p[0], p[1], p[2]] : [0, -999, 0], i * 3); });
    geo.attributes.position.needsUpdate = true; dg.attributes.position.needsUpdate = true; dm.opacity = 0.75 + 0.25 * Math.sin(t * 4);
  });
}
// a spiral galaxy filling the sky
function galaxy(c, cx, cy, cz, o = {}) {
  const r = rr(o.seed ?? 9), n = 9000, pos = new Float32Array(n * 3), col = new Float32Array(n * 3), R = o.R ?? 220; const C = new THREE.Color();
  for (let i = 0; i < n; i++) {
    const arm = i % 3, d = Math.pow(r(), 0.7) * R, a = arm * 2.094 + d / R * 4.2 + (r() - 0.5) * 0.5 * (1 - d / R + 0.3);
    pos.set([Math.cos(a) * d + (r() - 0.5) * 8, (r() - 0.5) * 6 * (1 - d / R), Math.sin(a) * d + (r() - 0.5) * 8], i * 3);
    C.setHSL(0.6 + 0.25 * (d / R) + (r() - 0.5) * 0.08, 0.6, 0.55 + 0.4 * (1 - d / R)); col.set([C.r, C.g, C.b], i * 3);
  }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('color', new THREE.BufferAttribute(col, 3)); c.own(geo);
  const mat = new THREE.PointsMaterial({ size: o.size ?? 2.4, map: glowTex(), vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false });
  const g = new THREE.Group(); g.position.set(cx, cy, cz); g.rotation.x = o.tilt ?? 1.1; const pts = new THREE.Points(geo, mat); pts.frustumCulled = false; g.add(pts); c.add(g);
  const core = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex(), color: 0xfff0d0, transparent: true, opacity: 1, blending: THREE.AdditiveBlending, depthWrite: false, fog: false })); core.scale.set(46, 46, 1); g.add(core);
  c.on((t) => { g.rotation.y = t * 0.08; const k = sm(0, 2.2, t); g.scale.setScalar(Math.max(0.001, 0.15 + 0.85 * k)); mat.opacity = k; core.material.opacity = 0.5 + 0.5 * k; });
  return g;
}
// sky overrides: a deep night (for the galaxy)
const deepNight = (hours) => (A, t) => {
  A.set(hours, { cloud: 0.05 }); const u = A.sky.material.uniforms;
  u.uZenith.value.setRGB(0.004, 0.006, 0.02); u.uHorizon.value.setRGB(0.02, 0.025, 0.06); A.starMat.opacity = 1.0;
};
// the white-out of infinity: exposure climbs to white
const whiteout = (t0, t1) => (t) => 1 + 30 * sm(t0, t1, t) ** 2;

// ------------------------------------------------------------------ shots
// X01-X02: the establishing shot, a sunny afternoon picnic (slow push in)
T('X01', 0, M, { hours: 15.2, cloud: 0.3, cam: [-1.5, 3.4, -13], cam2: [-0.6, 2.4, -8.5], tgt: [0, 0.8, 3], tgt2: [0, 0.8, 2], fov: 52, cr: 7, sr: 30,
  set(c, f) { park(c, f); you(c, f, 'sitGround'); } });
// X03-X04: close on you; the climb begins (others don't notice)
T('X03', 0, M, { hours: 15.4, cloud: 0.3, cam: [2.8, 1.7, -3.6], cam2: [2.0, 1.5, -2.8], tgt: [0, 0.6, 0.6], fov: 50, cr: 6, aperture: 1.3,
  set(c, f) { park(c, f); you(c, f, 'sitGround'); } });
// X05-X06: patterns: glowing links across the park, camera arcs round
T('X05', 0, M, { hours: 16.1, cloud: 0.25, cam: [5, 2.6, -6], cam2: [-4.5, 2.4, -6.5], tgt: [0, 1.2, 4], fov: 58, cr: 7,
  set(c, f) {
    park(c, f); you(c, f, 'sitGround');
    const r = rr(4), pts = [];
    for (let i = 0; i < 70; i++) { const q = f.p((r() - 0.5) * 30, r() * 28); pts.push([q[0], height(q[0], q[1]) + 0.3 + r() * 5.5, q[1]]); }
    const h = f.p(0, 0.5); pts.push([h[0], height(h[0], h[1]) + 0.9, h[1]]);
    links(c, pts, { n: 90, t0: 0.4, spread: 6, rate: 0.8, seed: 8 });
  } });
// X07: night; lying on the blanket, looking up: the dark-matter web lights up the sky
T('X07', 0, M, { hours: 21.8, cloud: 0.05, cam: [0.8, 0.7, -2.6], cam2: [0.6, 0.6, -2.4], tgt: [0, 6, 6], tgt2: [0, 9, 6], fov: 72, cr: 6, hero: true,
  set(c, f) { park(c, f, { crowd: false }); you(c, f, 'lie', { dz: 0.6 }); cosmicWeb(c, f, { t0: 1.6 }); } });
// X08: golden hour; a DNA helix turns over the blanket, one red rung turns green
T('X08', 0, M, { hours: 17.3, cloud: 0.3, cam: [0.6, 1.8, -4.4], cam2: [0.3, 1.8, -3.6], tgt: [0, 1.4, 1], fov: 54, cr: 6,
  set(c, f) { park(c, f); you(c, f, 'lookUp', { dx: -0.9, dz: 0.4, turn: -0.5 }); const q = f.p(0.6, 1.4); dna(c, q[0], height(q[0], q[1]) + 0.4, q[1]); } });
// X09: dusk; a star in a jar on the blanket, people gather round, the park lights up
T('X09', 0, M, { hours: 18.6, cloud: 0.2, cam: [0, 2.1, -7.0], cam2: [0, 1.8, -5.8], tgt: [0, 1.0, 1.5], fov: 56, cr: 6,
  set(c, f) {
    park(c, f, { crowd: false }); const j = f.p(0, 1.0); starJar(c, j[0], j[1]);
    you(c, f, 'armsOpen', { dz: 2.0 });
    [['a', -1.6, 1.9, 2.6], ['c', 1.7, 2.1, 3.6], ['d', -2.4, 3.0, 2.8], ['f', 2.6, 3.2, 3.4], ['g', 0.9, 3.6, 3.1]].forEach(([k, dx, dz, yw], i) => { const q = f.p(dx, dz); who(c, P(k), q[0], q[1], i % 2 ? 'lookUp' : 'idle', { yaw: f.yaw + yw, phase: i }); });
  } });
// X10: blue hour; a neural web grows out of your head across the park (camera orbits)
T('X10', 0, M, { hours: 19.4, cloud: 0.15, cam: [-3.5, 1.8, -4.5], cam2: [3.8, 2.2, -4.2], tgt: [0, 1.4, 1], fov: 58, cr: 6,
  set(c, f) { park(c, f, { crowd: false }); you(c, f, 'idle', { dz: 0.8 }); const q = f.p(0, 0.8); neurons(c, q[0], height(q[0], q[1]) + 1.65, q[1], { R: 16 }); } });
// X11: deep night; the camera tilts up from you to a galaxy turning across the sky
T('X11', 0, M, { hours: 23, cloud: 0.0, cam: [0, 1.4, -4], cam2: [0, 1.0, -3.4], tgt: [0, 1.3, 2], tgt2: [0, 120, 200], fov: 64, cr: 6, atmoFn: deepNight(23),
  set(c, f) { park(c, f, { crowd: false }); you(c, f, 'lookUp', { dz: 0.6 }); const g = f.p(0, 260); galaxy(c, g[0], 190, g[1], { R: 170, tilt: -0.94 }); } });
// X12: infinity: a high, slow rise over the park at dawn, the world burns to white
T('X12', 0, M, { hours: 6.9, cloud: 0.3, cam: [0, 2.0, -6], cam2: [0, 14, -22], tgt: [0, 0.8, 1], tgt2: [0, 0, 6], fov: 56, cr: 7, exposureFn: (t, d) => whiteout(d * 0.35, d * 0.95)(t),
  set(c, f) { park(c, f); you(c, f, 'armsOpen', { dz: 0.6 }); } });
// X13-X14: the loneliest thing: the empty park at dusk, you alone on the blanket, very wide and high
T('X13', 0, M, { hours: 17.5, cloud: 0.35, cam: [-4, 4.5, -11], cam2: [-3.5, 6, -14], tgt: [0, 0.6, 0.5], fov: 44, cr: 7,
  set(c, f) { park(c, f, { crowd: false }); you(c, f, 'sitGround'); } });
