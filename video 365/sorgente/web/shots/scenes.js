// Reusable scenes (place + people + props) used by many shots.
import { who, walker, ring, folk, mob, phalanx, horse, rider, gallop, A, FP, PP, MAIN_F, MAIN_P, campfire, height, WX, THREE, rr, sm, yawTo, lerp, AU, VD } from './stage.js';

const SIDE_NAMES = (side, n, off = 0) => [...Array(n)].map((_, i) => (side === 'F' ? VD : AU)(off + i * 2 + 3));

// the Circle: stumps, a speaker in the middle, everyone else seated (the Verdane's first parliament)
export function sCircle(c, o = {}) {
  const [cx, cz] = FP.circle, n = o.n ?? 20, R = o.R ?? 7;
  const st = A.circleOfStumps(c, cx, cz, n, R);
  const names = o.names || [...MAIN_F.filter((m) => m !== (o.speaker || 'IVY')), ...SIDE_NAMES('F', n)].slice(0, n);
  st.forEach((s, i) => { who(c, names[i % names.length], s.x, s.z, o.pose ? o.pose(names[i], i) : 'sit', { yawTo: [cx, cz], phase: i * 1.3, p: { look: 0.2 * Math.sin(i), seat: 0.52 } }); });
  if (o.speaker !== null) who(c, o.speaker || 'IVY', cx, cz, o.speakPose || 'speak', { yawTo: [cx + (o.face ?? 4), cz + 6], phase: 0.5 });
  return st;
}
// the Hollow Oak with worshippers kneeling around it
export function sHollow(c, o = {}) {
  const [hx, hz] = FP.hollow, face = o.face ?? Math.PI * 0.5;
  const oak = A.hollowOak(c, hx, hz, { glow: o.glow ?? 0.0, face });
  const n = o.n ?? 14, px = hx + Math.sin(face) * 3.0, pz = hz + Math.cos(face) * 3.0;
  for (let i = 0; i < n; i++) {
    const a = ((i + 0.5) / n - 0.5) * 2.3, d = 5 + (i % 3) * 2.4, x = px + Math.sin(face + a) * d, z = pz + Math.cos(face + a) * d;
    who(c, VD(i * 2 + 1), x, z, o.pose ? o.pose(i) : 'pray', { yawTo: [px, pz], phase: i, p: { armsUp: o.armsUp ?? 0.6 } });
  }
  if (o.moss !== false) who(c, 'MOSS', px + Math.sin(face) * 1.6, pz + Math.cos(face) * 1.6, o.mossPose || 'praise', { yawTo: [hx, hz] });
  return oak;
}
// the forge: anvil, fire, Ash hammering, glow
export function sForge(c, o = {}) {
  const [fx, fz] = PP.forge;
  c.proto('forge', 0, fx, fz, 0.8, 1.2); c.proto('anvil', 0, fx + 6, fz - 2, 0.3, 1.4);
  c.fire(fx + 3.3, fz + 1.5, { size: 1.0, n: 16, emberN: 14, light: true, lightIntensity: 14, lightDist: 18, seed: 4 });
  who(c, 'ASH', fx + 5.3, fz - 3.3, 'hammer', { yawTo: [fx + 6, fz - 2], phase: 0 });
  if (o.helpers) for (let i = 0; i < o.helpers; i++) who(c, AU(i * 3 + 2), fx + 9 + i * 1.6, fz + 2 - i, i % 2 ? 'carry' : 'hammer', { yawTo: [fx + 6, fz - 2], phase: i });
}
// archers on tree platforms (Wardens): returns the city so the shot can add bridges
export function sArchers(c, o = {}) {
  const city = A.rootholm(c, o.stage ?? 5);
  let k = 0;
  city.plats.forEach((p, i) => {
    const n = o.perPlat ?? 3, g = p.g;
    for (let j = 0; j < n; j++) { const a = j / n * 6.28 + i, x = g.position.x + Math.cos(a) * 2.3, z = g.position.z + Math.sin(a) * 2.3; who(c, j === 0 && i === 0 ? 'BRAM' : (k % 2 ? 'BARK' : VD(k * 2 + 1)), x, z, o.pose || 'drawBow', { yawTo: [o.aim?.[0] ?? WX, o.aim?.[1] ?? g.position.z], y: g.position.y + 0.17, phase: k * 0.7, p: { draw: 0.85 } }); k++; }
  });
  return city;
}
// a field of wheat with workers
export function sField(c, o = {}) {
  const [fx, fz] = o.at || PP.fields;
  A.wheatField(c, fx, fz, o.w ?? 70, o.d ?? 46, o.stage ?? 3, o.yaw ?? 0.1);
  const n = o.n ?? 10, r = rr(4);
  for (let i = 0; i < n; i++) { const x = fx + (r() - 0.5) * (o.w ?? 70) * 0.8, z = fz + (r() - 0.5) * (o.d ?? 46) * 0.8; who(c, i === 0 && o.sol !== false ? 'SOL' : AU(i * 2 + 1), x, z, o.pose || (i % 3 ? 'hoe' : 'plant'), { yaw: r() * 6.28, phase: i }); }
}
export function sMeal(c, x, z, names, o = {}) {   // people around a fire
  campfire(c, x, z, o);
  names.forEach((nm, i) => { const a = i / names.length * 6.28 + 0.4; who(c, nm, x + Math.cos(a) * 2.6, z + Math.sin(a) * 2.6, o.pose ? o.pose(i) : (i % 3 === 0 ? 'sitGround' : 'sit'), { yawTo: [x, z], phase: i, p: { seat: 0.3 } }); });
}
// the whole forest people gathering (100): a few real people + a crowd
export function sGather(c, side, cx, cz, o = {}) {
  folk(c, side, o.real ?? 14, cx, cz, 3, o.r ?? 18, o.face || null, { seed: o.seed ?? 6, poses: o.poses, off: o.off ?? 0 });
  mob(c, side, o.n ?? 90, cx, cz, 2, (o.r ?? 18) * 1.5, o.face || [cx, cz + 10], { seed: o.seed ?? 6, sx: 1.0 });
}
// lying on the ground, then waking up at t0 (persons)
export function wake(P, t0, speed = 0.9, to = 'idle') { P.anim = (Q, t) => { if (t < t0) Q.pose('lie', 9, {}); else if (t < t0 + 1.4 / speed) Q.pose('getUp', t - t0, { speed }); else Q.pose(to, t, { phase: Q.root.position.x }); }; return P; }
// a person climbing a trunk at (x,z): y from y0 to y1 (m above ground) between t0..t1
export function climber(c, name, x, z, y0, y1, t0, t1, yaw = 0, R = 0.75) {
  const P = c.person(name, { x, z, yaw }); const g = height(x, z);
  P.anim = (Q, t) => { const u = Math.max(0, Math.min(1, (t - t0) / (t1 - t0))); Q.place(x, g + y0 + (y1 - y0) * u, z, yaw); Q.pose(u > 0 && u < 1 ? 'climb' : 'idle', t, { phase: 0 }); };
  return P;
}
// sleepers: n bodies lying in a spiral (first `real` are full mannequins, the rest instanced)
export function sleepers(c, side, n, cx, cz, real = 8, o = {}) {
  const cr = side ? mob(c, side, Math.max(0, n - real), cx, cz, 1, 1, null, { seed: o.seed ?? 4 }) : null;
  const rnd = rr(o.seed ?? 4);
  for (let i = 0; i < n; i++) {
    const a = i * 2.39996, d = 1.6 + Math.sqrt(i) * (o.sp ?? 1.7), x = cx + Math.cos(a) * d, z = cz + Math.sin(a) * d;
    if (i < real) who(c, i === 0 && o.first ? o.first : (side === 'F' ? VD(i * 2 + 1) : AU(i * 2 + 1)), x, z, 'sleep', { yaw: a * 1.3 });
    else { const k = i - real; cr.set(k, x, height(x, z) + 0.12, z, a * 1.3 + rnd(), 0); cr.lie(k, true); }
  }
  return cr;
}
// a crowd that splits left/right between t0..t1: counts nL / nR moving from the centre outwards
export function mobSplit(c, side, nL, nR, cx, cz, sep, t0, t1, o = {}) {
  const n = nL + nR, colors = side === 'F' ? [0x9fd890, 0x82c872, 0xb4e0a4] : [0xf0cf6a, 0xe8b84a, 0xf4dc88, 0xdca83c];
  const cr = c.crowd(n, { colors, seed: 5, shadows: false }), rnd = rr(11), st = [];
  for (let i = 0; i < n; i++) { const a = rnd() * 6.28, d = 1 + Math.sqrt(rnd()) * (o.r0 ?? 8); const left = i < nL; st.push({ x0: cx + Math.cos(a) * d, z0: cz + Math.sin(a) * d, x1: cx + (left ? -sep : sep) + (rnd() - 0.5) * (o.spread ?? 9), z1: cz + (rnd() - 0.5) * (o.spread ?? 9) * 1.4, dl: rnd() * 0.5 }); }
  c.on((t) => { st.forEach((s, i) => { const u = Math.max(0, Math.min(1, (t - t0 - s.dl * (t1 - t0)) / ((t1 - t0) * 0.6))), e = u * u * (3 - 2 * u), x = s.x0 + (s.x1 - s.x0) * e, z = s.z0 + (s.z1 - s.z0) * e; cr.set(i, x, height(x, z), z, Math.atan2(s.x1 - s.x0, s.z1 - s.z0), u > 0 && u < 1 ? 1 : 0); }); cr.update(t); });
  return cr;
}
// a flying arrow from a to b ([x,y,z]) between t0..t1 (parabola)
export function arrow(c, a, b, t0, t1, hide = true) {
  const g = new THREE.Group(); const sh = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.95, 5), A.M.wood()); sh.rotation.x = Math.PI / 2; const tip = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.1, 5), A.M.iron()); tip.rotation.x = Math.PI / 2; tip.position.z = 0.5; const fl = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.01, 0.12), A.M.white()); fl.position.z = -0.45; g.add(sh, tip, fl); c.add(g); c.own(sh.geometry);
  c.on((t) => { const u = (t - t0) / (t1 - t0); g.visible = u >= 0 && (u <= 1 || !hide); if (!g.visible) return; const k = Math.min(1, Math.max(0, u)); const x = a[0] + (b[0] - a[0]) * k, z = a[2] + (b[2] - a[2]) * k, y = a[1] + (b[1] - a[1]) * k + Math.sin(k * Math.PI) * (o_arc(a, b)); g.position.set(x, y, z); const k2 = Math.min(1, k + 0.02), x2 = a[0] + (b[0] - a[0]) * k2, z2 = a[2] + (b[2] - a[2]) * k2, y2 = a[1] + (b[1] - a[1]) * k2 + Math.sin(k2 * Math.PI) * o_arc(a, b); g.lookAt(x2, y2, z2); });
  return g;
}
const o_arc = (a, b) => Math.hypot(b[0] - a[0], b[2] - a[2]) * 0.08;
// a bump on the head (egg)
export function egg(P, s = 1) { const m = new THREE.Mesh(new THREE.SphereGeometry(0.07 * s, 10, 8), P.mat); m.scale.set(1, 1.2, 1); m.position.set(0.08, 0.34, 0.1); P.head.add(m); const r = new THREE.Mesh(new THREE.SphereGeometry(0.045 * s, 8, 6), new THREE.MeshStandardMaterial({ color: 0xe0605a, roughness: 0.6 })); r.position.set(0.08, 0.36, 0.17); P.head.add(r); return m; }
// a total solar eclipse: the moon covers the sun between tA..tB (sprites at the sun direction + the light dims)
import { E } from '../main.js';
export function eclipse(c, tA, tB, size = 150, elev = 0.3) {
  const mk = (map, col, add, sc) => { const m = new THREE.Sprite(new THREE.SpriteMaterial({ map, color: col, blending: add ? THREE.AdditiveBlending : THREE.NormalBlending, depthWrite: false, depthTest: false, transparent: true, fog: false })); m.scale.setScalar(sc); m.renderOrder = 10; c.add(m); return m; };
  const cv = document.createElement('canvas'); cv.width = cv.height = 128; const g = cv.getContext('2d');
  const gr = g.createRadialGradient(64, 64, 20, 64, 64, 64); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.28, 'rgba(255,255,255,0.9)'); gr.addColorStop(0.4, 'rgba(255,220,160,0.35)'); gr.addColorStop(1, 'rgba(255,200,120,0)'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
  const cor = new THREE.CanvasTexture(cv); const cv2 = document.createElement('canvas'); cv2.width = cv2.height = 128; const g2 = cv2.getContext('2d'); g2.fillStyle = '#000'; g2.beginPath(); g2.arc(64, 64, 62, 0, 7); g2.fill();
  const dark = new THREE.CanvasTexture(cv2);
  const corona = mk(cor, 0xffffff, true, size * 3.2), moon = mk(dark, 0xffffff, false, size * 1.02), fwd = new THREE.Vector3();
  const f = (t) => sm(tA, tA + 1.6, t) * (1 - sm(tB - 1.2, tB, t));
  c.after((t) => { const p = E.camera.position; E.camera.getWorldDirection(fwd); const up = elev; for (const m of [corona, moon]) m.position.set(p.x + fwd.x * 6000, p.y + fwd.y * 6000 + up * 6000, p.z + fwd.z * 6000); const k = f(t); corona.visible = k > 0.05; moon.visible = k > 0.05; corona.material.opacity = k; });
  c.expo.push((t) => 1 - 0.9 * f(t));
  return f;
}
// lightning storm: rain + a strike at (x,y,z) at time t0
export function storm(c, x, z, hh, t0, o = {}) {
  c.rain(o.n ?? 3500, o.area ?? 60, o.op ?? 0.4);
  if (t0 !== null) c.bolt([x + 14, hh + 70, z - 8], [x, hh, z], t0, o.seed ?? 3);
}
// a swarm of locusts: n dark specks swirling around (cx,cy,cz) inside radius r; fades in between t0..t1
export function locusts(c, cx, cy, cz, o = {}) {
  const n = o.n ?? 2500, r = o.r ?? 25, rnd = rr(o.seed ?? 3), base = [];
  for (let i = 0; i < n; i++) base.push([rnd() * 6.28, Math.sqrt(rnd()) * r, rnd() * (o.h ?? 12), 0.5 + rnd() * 1.5, rnd() * 6.28]);
  const pos = new Float32Array(n * 3), g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); c.own(g);
  const mat = new THREE.PointsMaterial({ size: o.size ?? 0.22, color: 0x2a2418, transparent: true, depthWrite: false, sizeAttenuation: true, opacity: 0.9, fog: true }); c.own(mat);
  const pts = new THREE.Points(g, mat); pts.frustumCulled = false; c.add(pts);
  const wind = o.wind ?? [6, 1.5];
  c.on((t) => { const p = g.attributes.position; for (let i = 0; i < n; i++) { const b = base[i], a = b[0] + t * b[3] * 0.8; p.setXYZ(i, cx + Math.cos(a) * b[1] + wind[0] * t * 0.4 + Math.sin(t * 7 + b[4]) * 0.4, cy + b[2] + Math.sin(t * 5 + b[4]) * 0.5, cz + Math.sin(a) * b[1] + wind[1] * t * 0.4); } p.needsUpdate = true; mat.opacity = 0.9 * sm(o.t0 ?? 0, (o.t0 ?? 0) + 0.8, t); });
  return pts;
}
export function redShrooms(c, cx, cz, n = 40, r = 10, seed = 2) {
  const rnd = rr(seed), cap = new THREE.SphereGeometry(0.22, 8, 6, 0, 6.283, 0, 1.6), stem = new THREE.CylinderGeometry(0.05, 0.07, 0.25, 6); c.own(cap); c.own(stem);
  const m1 = new THREE.MeshStandardMaterial({ color: 0xd22a2a, roughness: 0.6 }), m2 = new THREE.MeshStandardMaterial({ color: 0xeee6d0, roughness: 0.8 });
  const a = new THREE.InstancedMesh(cap, m1, n), b = new THREE.InstancedMesh(stem, m2, n); const M = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(), p = new THREE.Vector3();
  for (let i = 0; i < n; i++) { const ang = rnd() * 6.28, d = Math.sqrt(rnd()) * r, x = cx + Math.cos(ang) * d, z = cz + Math.sin(ang) * d, sc = 0.8 + rnd() * 1.4; const y = height(x, z); s.setScalar(sc); p.set(x, y + 0.22 * sc, z); a.setMatrixAt(i, M.compose(p, q, s)); p.set(x, y + 0.12 * sc, z); b.setMatrixAt(i, M.compose(p, q, s)); }
  for (const im of [a, b]) { im.castShadow = false; im.frustumCulled = false; c.add(im); }
}
// the crack in the wall: a thin slit with warm light leaking through (both faces). side: 'F' forest face, 'P' plain face
import { Flock } from '../lib/animals.js';
const CRK_Z = 70;
export function crack(c, o = {}) {
  const z = o.z ?? CRK_Z, y = height(WX - 6, z) + 1.35;
  for (const [sd, x] of [['F', WX - 4.03], ['P', WX + 4.03]]) {
    const slit = new THREE.Mesh(new THREE.BoxGeometry(0.06, 1.1, 0.1), new THREE.MeshBasicMaterial({ color: 0xffe2a8 })); slit.position.set(x, y, z); c.add(slit); c.own(slit.geometry);
    const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: A.glowTex ? A.glowTex() : null, color: 0xffd9a0, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: o.glow ?? 0.55, fog: false })); glow.scale.set(1.2, 2.6, 1); glow.position.set(x + (sd === 'F' ? -0.12 : 0.12), y, z); c.add(glow);
  }
  const L1 = new THREE.PointLight(0xffd29a, o.light ?? 6, 9, 1.8); L1.position.set(WX - 5.2, y, z); c.add(L1);
  const L2 = new THREE.PointLight(0xffd29a, o.light ?? 6, 9, 1.8); L2.position.set(WX + 5.2, y, z); c.add(L2);
  return { y, z };
}
export function rocksAt(c, x, z, n = 8, s = 1) { const rnd = rr(5); for (let i = 0; i < n; i++) { const a = rnd() * 6.28, d = rnd() * 1.6; const g = new THREE.DodecahedronGeometry((0.35 + rnd() * 0.5) * s, 0); const m = c.mesh(g, A.M.stone(), x + Math.cos(a) * d, height(x, z) + 0.3 * s, z + Math.sin(a) * d * 1.4); m.rotation.set(rnd(), rnd(), rnd()); } }
// birds that fly into the wall (a small flock approaching a point and shrinking away)
export function birdsInto(c, from, to, t0, t1, n = 14) {
  const fl = new Flock(n, 5, 0x1d1d1d); c.add(fl.mesh); const ctr = new THREE.Vector3();
  c.on((t) => { const u = Math.max(0, Math.min(1, (t - t0) / (t1 - t0))); ctr.set(lerp(from[0], to[0], u), lerp(from[1], to[1], u), lerp(from[2], to[2], u)); fl.update(t, ctr, 1.3 * (1 - sm(0.7, 1, u))); fl.mesh.visible = u < 1; });
  return fl;
}
