// Kit for the vertical What-if Shorts: the Little AIs (from the kids kit), a vertical-friendly shot macro (wide fov,
// hero quality by default), 2D shots, and the effects: flying sideways, floating, sparks, wind streaks, debris,
// water blobs, slipping, sliding, toppling fences.
import { shot } from './registry.js';
import { T as T0, L, KIDS, kid, kidName, row, hopper, dancer, walker, beast, dog, farm, tree, flowers, rock, meadowDress, height, lerp, yawTo, THREE, loc } from './kids_kit.js';
export { L, KIDS, kid, kidName, row, hopper, dancer, walker, beast, dog, farm, tree, flowers, rock, meadowDress, height, lerp, yawTo, THREE, loc };

// vertical frame: a wider vertical field of view, hero (DOF + full res) unless told otherwise
export const T = (anchor, off, f, o) => T0(anchor, off, f, { fov: 62, hero: true, ...o });
// a 2D shot drawn by cfx.render_2d(name, ...)
export const D = (anchor, name, off = 0) => shot(anchor.replace(/[^\w]/g, '_') + '_2d', anchor, { kind: '2d', name, cam: () => ({}) }, off);

const rr = (seed) => { let s = seed * 9301 + 49297; return () => ((s = (s * 9301 + 49297) % 233280) / 233280); };
const sm = (a, b, x) => { const u = Math.max(0, Math.min(1, (x - a) / (b - a))); return u * u * (3 - 2 * u); };
export { sm };

// ---------------------------------------------------------------- people effects
// launched sideways at t0 with velocity v (local frame: [vx, vy, vz] metres/s), tumbling, with gravity
export function flyer(c, k, f, at, t0, v, o = {}) {
  const q = f.p(at[0], at[1]); const P = c.person(kidName(k), { x: q[0], z: q[1], yaw: f.yaw + (o.yaw ?? Math.PI) });
  const y0 = height(q[0], q[1]), g = o.g ?? 9.8, spin = o.spin ?? 6;
  P._free = true;
  P.anim = (Q, t) => {
    const u = t - t0;
    if (u < 0) { Q.pose(o.before || 'idle', t, { phase: at[0] }); Q.place(q[0], y0, q[1], f.yaw + (o.yaw ?? Math.PI)); return; }
    const p = f.p(at[0] + v[0] * u, at[1] + v[2] * u); const y = Math.max(height(p[0], p[1]), y0 + v[1] * u - 0.5 * g * u * u + (o.lift ?? 0.6) * Math.min(1, u * 4));
    Q.place(p[0], y, p[1], f.yaw + (o.yaw ?? Math.PI) + u * (o.yawSpin ?? 1.5));
    Q.pose(o.pose || 'tumble', u, {});
    Q.root.rotation.z = u * spin * (o.dir ?? 1); Q.root.rotation.x = Math.sin(u * 3) * 0.6;
  };
  return P;
}
// an animal thrown the same way
export function flyBeast(c, kind, seed, f, at, t0, v, o = {}) {
  const q = f.p(at[0], at[1]); const a = beast(c, kind, seed, q[0], q[1], f.yaw + (o.yaw ?? 0), { fur: o.fur, phase: seed });
  const y0 = height(q[0], q[1]), g = o.g ?? 9.8;
  c.on((t) => { const u = t - t0; if (u < 0) return; const p = f.p(at[0] + v[0] * u, at[1] + v[2] * u); a.root.position.set(p[0], Math.max(height(p[0], p[1]), y0 + v[1] * u - 0.5 * g * u * u + 0.5 * Math.min(1, u * 4)), p[1]); a.root.rotation.z = u * (o.spin ?? 4); a.root.rotation.x = u * 1.3; });
  return a;
}
// floats up: height(t) = rise(t) (metres), gentle drifting rotation
export function floater(c, k, f, at, rise, o = {}) {
  const q = f.p(at[0], at[1]); const P = c.person(kidName(k), { x: q[0], z: q[1], yaw: f.yaw + (o.yaw ?? Math.PI) });
  const y0 = height(q[0], q[1]); P._free = true;
  P.anim = (Q, t) => { const h = rise(t); Q.place(q[0] + Math.sin(t * 0.7 + at[0]) * 0.08 * h, y0 + h, q[1], f.yaw + (o.yaw ?? Math.PI) + Math.sin(t * 0.5 + at[1]) * 0.25 * Math.min(1, h)); Q.pose(h > 0.15 ? (o.air || 'jumpReach') : (o.before || 'idle'), t, { phase: at[0] }); Q.root.rotation.z = Math.sin(t * 0.8 + at[0]) * 0.18 * Math.min(1, h); Q.root.rotation.x = (o.tilt ?? 0) * Math.min(1, h); };
  return P;
}
export function floatBeast(c, kind, seed, f, at, rise, o = {}) {
  const q = f.p(at[0], at[1]); const a = beast(c, kind, seed, q[0], q[1], f.yaw + (o.yaw ?? 0), { fur: o.fur, phase: seed, graze: 0 });
  const y0 = height(q[0], q[1]);
  c.on((t) => { const h = rise(t); a.root.position.set(q[0], y0 + h, q[1]); a.root.rotation.z = Math.sin(t * 0.6 + seed) * 0.25 * Math.min(1, h); a.root.rotation.x = Math.sin(t * 0.45 + seed * 2) * 0.2 * Math.min(1, h); });
  return a;
}
// tries to walk, the feet slip out, falls (t0: start slipping, tf: on the ground)
export function slipper(c, k, f, at, t0, tf, o = {}) {
  const q = f.p(at[0], at[1]); const P = c.person(kidName(k), { x: q[0], z: q[1], yaw: f.yaw + (o.yaw ?? Math.PI) });
  P.anim = (Q, t) => {
    if (t < t0) { Q.pose('walk', t, { speed: 1.4 }); return; }
    if (t < tf) { Q.pose('walk', t * 2.2, { speed: 2.6, amount: 1.4 }); Q.root.rotation.z = Math.sin(t * 13) * 0.18 * (t - t0); return; }
    Q.root.rotation.z = 0; Q.pose('fallDown', Math.min(1.4, (t - tf) * 2.2), {});
  };
  return P;
}
// slides along a line without friction (arms out), then optionally stops dead and tumbles at tStop
export function slider(c, k, f, a, b, t0, t1, o = {}) {
  const P = c.person(kidName(k), { x: 0, z: 0, yaw: 0 });
  P.anim = (Q, t) => {
    const u = Math.max(0, (t - t0) / (t1 - t0)); const ue = o.stopAt !== undefined ? Math.min(u, o.stopAt) : u;
    const pa = f.p(a[0], a[1]), pb = f.p(b[0], b[1]); const x = lerp(pa[0], pb[0], ue), z = lerp(pa[1], pb[1], ue);
    Q.place(x, height(x, z), z, yawTo(pa[0], pa[1], pb[0], pb[1]) + (o.turn ?? 0) + (o.spin ? t * o.spin : 0));
    if (o.stopAt !== undefined && u >= o.stopAt) { Q.pose('tumble', (u - o.stopAt) * (t1 - t0), {}); Q.root.rotation.x = Math.min(1.4, (u - o.stopAt) * (t1 - t0) * 3.5); return; }
    Q.pose(o.pose || 'armsOpen', t, {}); Q.root.rotation.z = Math.sin(t * 2 + a[0]) * 0.08;
  };
  return P;
}
// a kid that glows and jitters (charged), with hair-standing sparks around it
export function charged(c, k, f, at, o = {}) {
  const q = f.p(at[0], at[1]); const P = kid(c, k, q[0], q[1], o.pose || 'armsOpen', { yaw: f.yaw + Math.PI });
  const mats = []; P.root.traverse(n => { if (n.isMesh && n.material && n.material.emissive && !mats.includes(n.material)) mats.push(n.material); });
  const own = mats.map(m => { const cl = m.clone(); return cl; });
  P.root.traverse(n => { if (n.isMesh && n.material && mats.includes(n.material)) n.material = own[mats.indexOf(n.material)]; });
  c.on((t) => { const g = (o.glow ? o.glow(t) : 0.5); own.forEach(m => { m.emissive.setRGB(0.5 * g, 0.75 * g, 1.0 * g); m.emissiveIntensity = 1.0; }); P.root.position.x += Math.sin(t * 60) * 0.006 * g; });
  sparks(c, q[0], height(q[0], q[1]) + 1.0, q[1], o);
  return P;
}
// little electric sparks (additive points) around a point
let SPARK_TEX = null;
function sparkTex() { if (SPARK_TEX) return SPARK_TEX; const cv = document.createElement('canvas'); cv.width = cv.height = 64; const g = cv.getContext('2d'); const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.3, 'rgba(160,210,255,0.8)'); gr.addColorStop(1, 'rgba(80,140,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); SPARK_TEX = new THREE.CanvasTexture(cv); return SPARK_TEX; }
export function sparks(c, x, y, z, o = {}) {
  const n = o.n ?? 70, r = rr(o.seed ?? 3), pos = new Float32Array(n * 3), base = [];
  for (let i = 0; i < n; i++) base.push([r() * 6.28, (r() - 0.5) * 1.6, 0.25 + r() * 0.5, r() * 10]);
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); c.own(geo);
  const mat = new THREE.PointsMaterial({ size: o.size ?? 0.09, map: sparkTex(), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, color: 0xbfe0ff });
  const pts = new THREE.Points(geo, mat); pts.frustumCulled = false; c.add(pts);
  c.on((t) => { const k = o.amount ? o.amount(t) : 1; mat.opacity = Math.min(1, k); base.forEach(([a, h, rad, ph], i) => { const fl = (Math.sin(t * 23 + ph * 7) > 0.2) ? 1 : 0; pos[i * 3] = x + Math.cos(a + t * 3) * rad * (1 + 0.3 * Math.sin(t * 9 + ph)); pos[i * 3 + 1] = y + h + Math.sin(t * 11 + ph) * 0.08 + (fl ? 0 : 99); pos[i * 3 + 2] = z + Math.sin(a + t * 3) * rad; }); geo.attributes.position.needsUpdate = true; });
  return pts;
}
// fast wind streaks moving along the local +dx direction (east), around a centre
export function streaks(c, f, cx = 0, cz = 4, o = {}) {
  const n = o.n ?? 260, r = rr(o.seed ?? 5), pos = new Float32Array(n * 6), base = [];
  for (let i = 0; i < n; i++) base.push([(r() - 0.5) * 40, 0.2 + r() * (o.h ?? 6), (r() - 0.5) * (o.depth ?? 26), r() * 40, 1.5 + r() * 3]);
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); c.own(geo);
  const mat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.0, depthWrite: false });
  const ls = new THREE.LineSegments(geo, mat); ls.frustumCulled = false; c.add(ls);
  const sp = o.speed ?? 60;
  c.on((t) => { mat.opacity = (o.amount ? o.amount(t) : 1) * (o.opacity ?? 0.55); base.forEach(([x0, h, z0, ph, len], i) => { const x = ((x0 + ph + t * sp) % 40 + 40) % 40 - 20; const a = f.p(cx + x, cz + z0), b = f.p(cx + x - len, cz + z0), y = height(a[0], a[1]) + h; pos.set([a[0], y, a[1], b[0], y, b[1]], i * 6); }); geo.attributes.position.needsUpdate = true; });
  return ls;
}
// leaves / bits of hay tumbling along +dx
export function debris(c, f, o = {}) {
  const n = o.n ?? 140, r = rr(o.seed ?? 7);
  const g = new THREE.PlaneGeometry(0.14, 0.09); c.own(g);
  const cols = o.colors || [0x6aa84f, 0x93c47d, 0xc9a45a, 0x8a6a3a];
  const im = new THREE.InstancedMesh(g, new THREE.MeshLambertMaterial({ side: THREE.DoubleSide, color: 0xffffff }), n); im.frustumCulled = false;
  const base = []; const col = new THREE.Color();
  for (let i = 0; i < n; i++) { base.push([(r() - 0.5) * 40, 0.2 + r() * 4, (r() - 0.5) * 20, r() * 40, r() * 6]); im.setColorAt(i, col.setHex(cols[i % cols.length])); }
  c.add(im); const M4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), s = new THREE.Vector3(1, 1, 1), p = new THREE.Vector3();
  const sp = o.speed ?? 30;
  c.on((t) => { const k = o.amount ? o.amount(t) : 1; base.forEach(([x0, h, z0, ph, rot], i) => { const x = ((x0 + ph + t * sp) % 40 + 40) % 40 - 20; const a = f.p(x, (o.cz ?? 4) + z0); p.set(a[0], height(a[0], a[1]) + h + Math.sin(t * 5 + rot) * 0.4, a[1]); e.set(t * 7 + rot, t * 5 + rot, t * 3); q.setFromEuler(e); s.setScalar(k > 0.05 ? 1 : 0.0001); im.setMatrixAt(i, M4.compose(p, q, s)); }); im.instanceMatrix.needsUpdate = true; });
  return im;
}
// wobbly water blobs rising out of a pond
export function waterBlobs(c, f, cx, cz, rise, o = {}) {
  const n = o.n ?? 9, r = rr(o.seed ?? 4);
  const mat = new THREE.MeshPhysicalMaterial({ color: 0x5ab4ff, roughness: 0.05, metalness: 0.0, transmission: 0.6, transparent: true, opacity: 0.75, clearcoat: 1, ior: 1.33, thickness: 0.5 });
  const geo = new THREE.SphereGeometry(1, 28, 20); c.own(geo);
  const blobs = [];
  for (let i = 0; i < n; i++) { const m = new THREE.Mesh(geo, mat); const s = 0.25 + r() * 0.6; const p = f.p(cx + (r() - 0.5) * 6, cz + (r() - 0.5) * 4); m.castShadow = true; c.add(m); blobs.push([m, p, s, r() * 6, 0.6 + r() * 0.8]); }
  c.on((t) => blobs.forEach(([m, p, s, ph, sp]) => { const h = rise(t) * sp; m.position.set(p[0], height(p[0], p[1]) + 0.1 + h, p[1]); const w = 1 + 0.12 * Math.sin(t * 5 + ph); m.scale.set(s * w, s / w, s * (2 - w)); m.visible = h > 0.02; }));
  return blobs;
}
// a pond: a flat blue disc
export function pond(c, f, cx, cz, R = 4) {
  const p = f.p(cx, cz); const g = new THREE.CircleGeometry(R, 40); g.rotateX(-Math.PI / 2); c.own(g);
  const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ color: 0x3d8fd8, roughness: 0.08, metalness: 0.1 })); m.position.set(p[0], height(p[0], p[1]) + 0.04, p[1]); m.receiveShadow = true; c.add(m); return m;
}
// a wooden fence whose posts and rails fall over from tFall (friction gone: nails slip out)
export function fence(c, f, x0, x1, z, tFall = 99, o = {}) {
  const wood = new THREE.MeshStandardMaterial({ color: 0x9a6a3a, roughness: 0.9 });
  const parts = []; const r = rr(o.seed ?? 2);
  for (let x = x0; x <= x1 + 1e-6; x += 1.6) {
    const p = f.p(x, z); const post = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.2, 0.12), wood); post.castShadow = true;
    const g = new THREE.Group(); g.position.set(p[0], height(p[0], p[1]), p[1]); g.rotation.y = f.yaw; post.position.y = 0.6; g.add(post); c.add(g); parts.push([g, 'post', r() * 0.6, r() < 0.5 ? 1 : -1]);
    if (x + 1.6 <= x1 + 1e-6) for (const hy of [0.45, 0.95]) { const p2 = f.p(x + 0.8, z); const rail = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.1, 0.06), wood); rail.castShadow = true; const g2 = new THREE.Group(); g2.position.set(p2[0], height(p2[0], p2[1]) + hy, p2[1]); g2.rotation.y = f.yaw; g2.add(rail); c.add(g2); parts.push([g2, 'rail', r() * 0.5, r() < 0.5 ? 1 : -1, hy]); }
  }
  c.on((t) => parts.forEach(([g, kind, delay, sg, hy]) => { const u = Math.max(0, t - tFall - delay); if (kind === 'post') { g.rotation.x = sg * Math.min(Math.PI / 2, u * u * 3.2); } else { const fall = Math.min(hy - 0.05, 0.5 * 9.8 * u * u); g.children[0].position.y = -fall; g.children[0].rotation.z = sg * Math.min(0.6, u * 1.5); } }));
  return parts;
}
// a red ball (an apple) that squirts out of a hand at t0
export function squirt(c, P, t0, dir = [0.6, 1.2, 2.2]) {
  const m = new THREE.Mesh(new THREE.SphereGeometry(0.07, 16, 12), new THREE.MeshStandardMaterial({ color: 0xff3b30, roughness: 0.35 })); m.castShadow = true; c.add(m);
  const v = new THREE.Vector3();
  c.after((t) => { const hd = P.R.hd; P.root.updateMatrixWorld(true); hd.getWorldPosition(v); if (t < t0) { m.position.copy(v); m.position.y -= 0.05; return; } const u = t - t0; m.position.set(v.x + dir[0] * u, v.y + dir[1] * u - 4.9 * u * u, v.z + dir[2] * u); if (m.position.y < height(m.position.x, m.position.z) + 0.07) m.position.y = height(m.position.x, m.position.z) + 0.07; });
  return m;
}
// sky overrides: the Sun (and moonlight) switched off between t0 and t1
export const sunOff = (hours, t0, t1, cloud = 0.25) => (A, t) => {
  A.set(hours, { cloud });
  const off = t >= t0 && t < t1;
  if (off) {
    const u = A.sky.material.uniforms; u.uSunCol.value.setRGB(0, 0, 0); u.uZenith.value.setRGB(0.01, 0.012, 0.03); u.uHorizon.value.setRGB(0.02, 0.025, 0.05); u.uGround.value.setRGB(0.01, 0.01, 0.02);
    u.uCloudCol.value.setRGB(0.02, 0.02, 0.03); u.uCloudShade.value.setRGB(0.01, 0.01, 0.02);
    A.sun.intensity = 0.0; A.hemi.intensity = 0.06; A.fill.intensity = 0.02; A.moon.visible = false; A.starMat.opacity = 1.0;
    A.fog.color.setRGB(0.02, 0.025, 0.05);
  }
};
