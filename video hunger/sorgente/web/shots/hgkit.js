// The shot kit for the arena film: location frames, shot registration, and reusable scene pieces.
import * as THREE from 'three';
import { sh, envB, dolly, who, walker, ring, folk, mob, campfire, K, orbitCam, easeInOut, height, yawTo, lerp, sm, rr } from './stage.js';
import { HG, biomeWeights, arenaR, dominant, LAKE } from '../lib/biomes.js';
import { slopeAt, ARENA } from '../lib/terrain.js';
import * as H from '../lib/hg.js';
import * as A from '../lib/arena.js';
export { THREE, sh, envB, dolly, who, walker, ring, folk, mob, campfire, K, orbitCam, easeInOut, height, yawTo, lerp, sm, rr, H, A, HG };

// ---------------------------------------------------------------- locations: flat, dry ground inside each world
const BIOME_AT = { forest: [208, 330], meadow: [148, 320], swamp: [-25, 340], desert: [35, 320], lake: [100, 175], mountain: [-90, 300], center: [0, 0] };
const _spots = {};
export function spot(biome, k = 0, o = {}) {
  const key = biome + '|' + k + '|' + (o.r ?? '') + (o.a ?? '');
  if (_spots[key]) return _spots[key];
  const [a0, d0] = BIOME_AT[biome];
  const found = [];
  for (let ring = 0; ring < 12 && found.length <= k; ring++) for (let j = 0; j < 24 && found.length <= k; j++) {
    const a = (a0 + (o.a ?? 0) + ((j * 137.5) % 60 - 30) * (1 + ring * 0.12)) * Math.PI / 180, d = (o.r ?? d0) + ((j * 53) % 80 - 40) * (1 + ring * 0.15);
    const x = HG.cx + Math.cos(a) * d, z = HG.cz + Math.sin(a) * d, h = height(x, z);
    if (biome !== 'swamp' && h < ARENA.waterY + 0.9) continue;
    if (biome === 'swamp' && h < ARENA.waterY + 0.25) continue;
    if (slopeAt(x, z, 3) > (o.slope ?? 0.12)) continue;
    if (found.some(f => Math.hypot(f[0] - x, f[1] - z) < 24)) continue;
    found.push([x, z]);
  }
  const p = found[k] || found[found.length - 1] || [HG.cx + 100, HG.cz];
  return (_spots[key] = p);
}
// a local frame: origin (x, z) and the direction it faces (yaw: 0 = +z). p(dx, dz): dx to the right, dz forward
export function frame(x, z, yaw = 0) {
  const s = Math.sin(yaw), c = Math.cos(yaw);
  const f = {
    x, z, yaw,
    p: (dx, dz) => [x + dx * c + dz * s, z - dx * s + dz * c],
    c3: (dx, h, dz) => { const q = f.p(dx, dz); return [q[0], h, q[1]]; },       // camera/target point [x, heightAboveGround, z]
    face: (dx = 0, dz = 8) => f.p(dx, dz),
  };
  return f;
}
export const toward = (x, z, tx, tz) => frame(x, z, Math.atan2(tx - x, tz - z));
const HORN_C = [HG.cx, HG.cz];

// ---------------------------------------------------------------- shot registration
let UID = 0;
// S(anchor, offset, o): one shot. o: biome, hours, cam [x,h,z], tgt [x,h,z], cam2, tgt2, fov, fov2, set(c), clear, shadow, fog, tint, ...
export function S(anchor, off, o) {
  const id = anchor.replace(/[^\w]/g, '_') + '_' + (++UID);
  const biome = o.biome || 'center', env = envB(biome, o.hours ?? 11, { fog: o.fog, cloud: o.cloud, tint: o.tint, veg: o.veg });
  const tg = o.tgt, cm = o.cam;
  const spec = { cam: dolly(cm, o.cam2 || cm, tg, o.tgt2 || tg, o.fov ?? 40, o.fov2 ?? o.fov ?? 40), set: o.set,
    shadow: o.shadow || { x: (o.tgt2 || tg)[0], z: (o.tgt2 || tg)[2], r: o.sr ?? 45 }, clear: o.clear || [], hero: o.hero, shake: o.shake, exposure: o.exposure, grade: o.grade,
    storm: o.storm, top: o.top, hoursFn: o.hoursFn, exposureFn: o.exposureFn, focus: o.focus, aperture: o.aperture, water: o.water };
  for (const k of Object.keys(spec)) if (spec[k] === undefined) delete spec[k];
  sh(id, anchor, env, spec, off);
  return id;
}
// camera paths that are not a straight dolly: pass camFn = (c) => K(...) via o.camFn (receives nothing, returns a camera function)
export function SC(anchor, off, o, camFn) {
  const id = anchor.replace(/[^\w]/g, '_') + '_' + (++UID);
  const biome = o.biome || 'center', env = envB(biome, o.hours ?? 11, { fog: o.fog, cloud: o.cloud, tint: o.tint, veg: o.veg });
  const spec = { cam: camFn, set: o.set, shadow: o.shadow || { x: o.at?.[0] ?? HG.cx, z: o.at?.[1] ?? HG.cz, r: o.sr ?? 45 }, clear: o.clear || [], hero: o.hero, shake: o.shake, exposure: o.exposure, grade: o.grade, hoursFn: o.hoursFn, top: o.top, focus: o.focus, water: o.water, storm: o.storm };
  for (const k of Object.keys(spec)) if (spec[k] === undefined) delete spec[k];
  sh(id, anchor, env, spec, off);
  return id;
}

// ---------------------------------------------------------------- reusable pieces
export const ids = (a, b, pre = 'X') => [...Array(b - a + 1)].map((_, i) => pre + (a + i));
export const GREY = ids(15, 89);                    // rank-and-file bodies
export const PACK = ids(1, 12);                     // the Pack's soldiers (red armbands)
// people standing on the pedestals (nearest `real` as real mannequins, the rest as an instanced crowd)
export function lineup(c, cam, real = 14, o = {}) {
  const peds = H.pedestals(c);
  const order = peds.map((p, i) => ({ p, i, d: Math.hypot(p.x - cam[0], p.z - cam[2]) })).sort((a, b) => a.d - b.d);
  const named = o.named || {};
  const rnd = rr(7);
  order.forEach(({ p, i }, k) => {
    if (k < real) { const nm = named[i] || GREY[(i * 7) % GREY.length]; who(c, nm, p.x, p.z, o.pose || 'idle', { y: p.y, yaw: p.yaw, phase: i * 0.7 }); }
  });
  const rest = order.slice(real);
  const crowd = c.crowd(rest.length, { colors: [0xf2f2f2, 0xeeeeea, 0xe6e6e6, 0xf4f1ec, 0xdde4ee], seed: 5, shadows: false });
  rest.forEach(({ p }, k) => crowd.set(k, p.x, p.y, p.z, p.yaw, 0));
  c.on((t) => crowd.update(t));
  return peds;
}
export function distantMob(c, n, cx, cz, r0, r1, face, color = 0xf2f2f2, seed = 3) {
  const cr = c.crowd(n, { colors: [color, 0xe6e6e6, 0xf4f1ec], seed, shadows: false }), r = rr(seed * 5 + 1);
  for (let i = 0; i < n; i++) { const a = r() * 6.283, d = r0 + Math.sqrt(r()) * (r1 - r0), x = cx + Math.cos(a) * d, z = cz + Math.sin(a) * d; cr.set(i, x, height(x, z), z, face ? Math.atan2(face[0] - x, face[1] - z) : r() * 6.28, 0); }
  c.on((t) => cr.update(t));
  return cr;
}
// the standard arena dressing at the Horn: horn, loot and plaza clearing
export function hornScene(c, o = {}) {
  H.horn(c, { yaw: o.yaw ?? Math.PI });
  const m = H.hornMouth(o.yaw ?? Math.PI, 6.5);
  if (o.loot !== false) H.lootPile(c, m[0], m[1], { yaw: o.yaw ?? Math.PI, n: o.lootN ?? 22, R: 5.5, seed: 3 });
}
export const HORN_CLEAR = [[HG.cx, HG.cz, 62]];

// ---------------------------------------------------------------- more locations
// a spot on the lake shore where the water is waist deep: { x, z, out: unit vector pointing to dry land }
export function shore(k = 0, depth = 0.55) {
  const base = Math.atan2(HG.cz - LAKE.z, HG.cx - LAKE.x) + (k % 2 ? 1 : -1) * 0.35 * Math.ceil(k / 2);
  const u = [Math.cos(base), Math.sin(base)];
  for (let r = 20; r < 260; r += 0.5) {
    const x = LAKE.x + u[0] * r, z = LAKE.z + u[1] * r;
    if (height(x, z) > HG.waterY - depth) return { x, z, out: u };
  }
  return { x: LAKE.x + u[0] * 130, z: LAKE.z + u[1] * 130, out: u };
}
// dry-ish ground at the edge of the swamp's ponds
export function wetSpot(k = 0) {
  const p0 = spot('swamp', k, { slope: 0.2 });
  let best = p0, bestW = -1;
  for (let i = 0; i < 80; i++) {
    const a = i * 2.399, d = 6 + (i % 9) * 3, x = p0[0] + Math.cos(a) * d, z = p0[1] + Math.sin(a) * d, h = height(x, z);
    if (h < HG.waterY + 0.25 || h > HG.waterY + 0.9) continue;
    let w = 0; for (let j = 0; j < 8; j++) { const aa = j * 0.785; if (height(x + Math.cos(aa) * 9, z + Math.sin(aa) * 9) < HG.waterY - 0.2) w++; }
    if (w > bestW) { bestW = w; best = [x, z]; }
  }
  return best;
}

// ---------------------------------------------------------------- shot templates
// portrait: one named AI, camera orbiting. o: biome, k (spot), pose, hours, r (distance), h (camera height), a0, a1 (orbit), fov, th (look-at height), set, p (pose params)
export function portrait(anchor, off, name, o = {}) {
  const at = o.at || spot(o.biome || 'meadow', o.k ?? 0), yawFace = (o.a0 ?? 1.2) * 0.5 + (o.a1 ?? 2.0) * 0.5;
  const cx = at[0] + Math.cos(yawFace) * (o.r ?? 5), cz = at[1] + Math.sin(yawFace) * (o.r ?? 5);
  return SC(anchor, off, { biome: o.biome || 'meadow', hours: o.hours ?? 10.5, clear: [[at[0], at[1], o.clearR ?? 10], ...(o.clear || [])], sr: o.sr ?? 40, fog: o.fog, storm: o.storm, grade: o.grade, hero: o.hero, shake: o.shake, cloud: o.cloud,
    set: (c) => { const P = who(c, name, at[0], at[1], o.pose || 'idle', { yawTo: [cx, cz], phase: o.phase ?? 0.3, p: o.p, acc: o.acc }); if (o.set) o.set(c, P, at); } },
    orbitCam(at, o.r ?? 5, o.h ?? 1.5, o.a0 ?? 1.2, o.a1 ?? 2.0, o.fov ?? 38, o.th ?? 1.15));
}
// duo: two characters facing each other, camera dollying across. o: biome, k, a, b (names), pa, pb (poses), gap, hours, cam: [dx, h, dz] start, cam2 end (offsets in the pair's frame), fov
export function duo(anchor, off, o = {}) {
  const at = o.at || spot(o.biome || 'meadow', o.k ?? 0), gap = (o.gap ?? 2.4) / 2, yaw = o.yaw ?? 0.4;
  const f = frame(at[0], at[1], yaw);       // local x runs along the line between the two
  const A = f.p(-gap, 0), B = f.p(gap, 0);
  const c0 = o.cam || [0.5, 1.5, -5.5], c1 = o.cam2 || [-0.5, 1.5, -4.4];
  return S(anchor, off, { biome: o.biome || 'meadow', hours: o.hours ?? 10.5, cam: f.c3(c0[0], c0[1], c0[2]), cam2: f.c3(c1[0], c1[1], c1[2]), tgt: f.c3(0, o.th ?? 1.2, 0), tgt2: f.c3(o.tx2 ?? 0, o.th ?? 1.2, 0), fov: o.fov ?? 38, fov2: o.fov2,
    clear: [[at[0], at[1], o.clearR ?? 11], ...(o.clear || [])], sr: 40, fog: o.fog, storm: o.storm, grade: o.grade, hero: o.hero, shake: o.shake,
    set: (c) => { const a = who(c, o.a, A[0], A[1], o.pa || 'idle', { yawTo: B, phase: 0.2, p: o.p1, acc: o.accA }), b = who(c, o.b, B[0], B[1], o.pb || 'idle', { yawTo: A, phase: 1.1, p: o.p2, acc: o.accB }); if (o.set) o.set(c, a, b, at, f); } });
}
// establishing shot of a world: a slow dolly / crane over a spot
export function establish(anchor, off, biome, o = {}) {
  const p = o.at || spot(biome, o.k ?? 0, { slope: 0.3 }), f = frame(p[0], p[1], o.yaw ?? 0.5);
  const c0 = o.cam || [-14, 12, -30], c1 = o.cam2 || [-6, 8, -18], t0 = o.tgt || [10, 5, 30];
  return S(anchor, off, { biome, hours: o.hours ?? 10, cam: f.c3(...c0), cam2: f.c3(...c1), tgt: f.c3(...t0), tgt2: o.tgt2 ? f.c3(...o.tgt2) : undefined, fov: o.fov ?? 52, fov2: o.fov2, sr: 60, fog: o.fog, storm: o.storm, grade: o.grade, cloud: o.cloud, hero: o.hero, set: o.set ? (c) => o.set(c, p, f) : undefined });
}

// ---------------------------------------------------------------- small props and effects used across chapters
const matC = (hex, o = {}) => new THREE.MeshStandardMaterial({ color: hex, roughness: 0.8, ...o });
// an arrow in flight along a shallow arc from a to b ([x, y, z] world) between t0 and t1
export function arrowFly(c, a, b, t0, t1, o = {}) {
  const g = new THREE.Group(), shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.9, 5), matC(0x8a6a44)), head = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.12, 6), matC(0xbfc6cf, { metalness: 0.8, roughness: 0.3 })), fl = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.14, 4), matC(0xeee6d6));
  shaft.rotation.x = Math.PI / 2; head.rotation.x = Math.PI / 2; head.position.z = 0.5; fl.rotation.x = -Math.PI / 2; fl.position.z = -0.42; g.add(shaft, head, fl); g.visible = false; c.add(g);
  c.on((t) => { const u = (t - t0) / (t1 - t0); g.visible = u >= 0 && u <= 1; if (!g.visible) return; const x = lerp(a[0], b[0], u), z = lerp(a[2], b[2], u), y = lerp(a[1], b[1], u) + (o.arc ?? 1.2) * 4 * u * (1 - u); const u2 = Math.min(1, u + 0.02); const nx = lerp(a[0], b[0], u2), nz = lerp(a[2], b[2], u2), ny = lerp(a[1], b[1], u2) + (o.arc ?? 1.2) * 4 * u2 * (1 - u2); g.position.set(x, y, z); g.lookAt(nx, ny, nz); });
  return g;
}
export function berryBush(c, x, z, hex = 0xd22a3a, n = 26, s = 1) {
  const r = rr(Math.floor(x * 7 + z)), y = height(x, z);
  c.mesh(new THREE.IcosahedronGeometry(0.75 * s, 1), matC(0x335c2a), x, y + 0.6 * s, z);
  const geo = new THREE.SphereGeometry(0.05 * s, 8, 6); c.own(geo);
  const im = new THREE.InstancedMesh(geo, matC(hex, { roughness: 0.3 }), n), m = new THREE.Matrix4();
  for (let i = 0; i < n; i++) { const a = r() * 6.28, e = r() * 3.1, d = 0.78 * s; im.setMatrixAt(i, m.makeTranslation(x + Math.cos(a) * Math.sin(e) * d, y + 0.6 * s + Math.cos(e) * d * 0.9, z + Math.sin(a) * Math.sin(e) * d)); }
  im.instanceMatrix.needsUpdate = true; im.frustumCulled = false; c.add(im);
}
export function breadLoaf(c, x, y, z, s = 1) { const m = c.mesh(new THREE.SphereGeometry(0.13 * s, 12, 8), matC(0xc98f4a), x, y, z); m.scale.set(1.5, 0.8, 1); return m; }
export function medkit(c, x, z, s = 1) {
  const y = height(x, z), g = new THREE.Group(); g.position.set(x, y, z); c.add(g);
  const box = new THREE.Mesh(new THREE.BoxGeometry(1.1 * s, 0.8 * s, 0.8 * s), new THREE.MeshStandardMaterial({ color: 0xf2f4f6, roughness: 0.35, metalness: 0.5 })); box.position.y = 0.4 * s; box.castShadow = true; g.add(box); c.own(box.geometry);
  const red = matC(0xd7263d); for (const [w, h] of [[0.5, 0.14], [0.14, 0.5]]) { for (const zz of [0.41, -0.41]) { const p = new THREE.Mesh(new THREE.BoxGeometry(w * s, h * s, 0.02), red); p.position.set(0, 0.4 * s, zz * s); g.add(p); c.own(p.geometry); } }
  return g;
}
// a wall of fire: n flames scattered in a band, advancing along a heading
export function wildfire(c, cx, cz, o = {}) {
  const r = rr(o.seed ?? 4), n = o.n ?? 18, W = o.w ?? 40, D = o.d ?? 24;
  for (let i = 0; i < n; i++) { const x = cx + (r() - 0.5) * W, z = cz + (r() - 0.5) * D; c.fire(x, z, { size: (o.size ?? 2.4) * (0.7 + 0.8 * r()), n: 14, emberN: 10, light: i % (o.lightEvery ?? 6) === 0, lightIntensity: o.li ?? 120, lightDist: 40, seed: i + 3, dy: 0.2 }); }
}
// a sheet of water rising from y0 to y1 between t0 and t1 (a flood)
export function flood(c, x, z, w, d, y0, y1, t0, t1, o = {}) {
  return c.water(x, z, w, d, (t) => lerp(y0, y1, sm(t0, t1, t)), { deep: o.deep ?? 0x4a3c2a, shallow: o.shallow ?? 0x7a6540, dim: o.dim ?? 0.6 });
}
// the tall door in the rock at the edge of the world; open(t0) slides it up and pours white light out
export function doorAt(c, x, z, yaw, t0 = 99, o = {}) {
  const g = new THREE.Group(); g.position.set(x, height(x, z), z); g.rotation.y = yaw; c.add(g);
  const W = o.w ?? 5.2, Hh = o.h ?? 8.4;
  const frame = (w, h, dd, hex, px, py, pz) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, dd), matC(hex, { roughness: 0.9 })); m.position.set(px, py, pz); m.castShadow = true; g.add(m); c.own(m.geometry); };
  frame(W + 2.4, 0.9, 1.6, 0x4a4d55, 0, Hh + 0.45, 0); frame(1.1, Hh, 1.6, 0x4a4d55, -(W / 2 + 0.55), Hh / 2, 0); frame(1.1, Hh, 1.6, 0x4a4d55, W / 2 + 0.55, Hh / 2, 0);
  const light = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xe3f4ff, emissiveIntensity: 0.0, roughness: 0.5 });
  const glow = new THREE.Mesh(new THREE.BoxGeometry(W, Hh, 0.3), light); glow.position.set(0, Hh / 2, -0.3); g.add(glow); c.own(glow.geometry);
  const panel = new THREE.Mesh(new THREE.BoxGeometry(W, Hh, 0.5), matC(0x2c2f36, { metalness: 0.6, roughness: 0.4 })); panel.position.set(0, Hh / 2, 0.1); panel.castShadow = true; g.add(panel); c.own(panel.geometry);
  const L = new THREE.PointLight(0xdff2ff, 0, 60, 1.4); L.position.set(0, Hh * 0.5, 3); g.add(L);
  c.on((t) => { const u = sm(t0, t0 + 1.8, t); panel.position.y = Hh / 2 + u * Hh * 0.98; light.emissiveIntensity = 0.5 + u * 5; L.intensity = 25 + u * 400; });
  return g;
}
// a long shallow dish of burnt/dark ground, trench, etc.
export function trench(c, x, z, yaw, len = 24, w = 1.6) {
  const g = new THREE.Group(); g.position.set(x, height(x, z) + 0.04, z); g.rotation.y = yaw; c.add(g);
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, 0.06, len), matC(0x16120e, { roughness: 1 })); m.position.y = 0.0; g.add(m); c.own(m.geometry);
  return g;
}
export function logWall(c, x, z, yaw, len = 18, h = 2.2) {
  const g = new THREE.Group(); g.position.set(x, height(x, z), z); g.rotation.y = yaw; c.add(g);
  const geo = new THREE.CylinderGeometry(0.34, 0.36, len, 8); geo.rotateZ(Math.PI / 2); c.own(geo);
  const wood = matC(0x4b3a2a, { roughness: 0.95 });
  for (let k = 0; k < 4; k++) { const m = new THREE.Mesh(geo, wood); m.position.set(0, 0.35 + k * 0.62, 0); m.castShadow = true; g.add(m); }
  for (const s of [-1, 1]) { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.26, h + 1.0, 8), wood); p.position.set(s * (len / 2 + 0.2), (h + 1.0) / 2, 0); p.castShadow = true; g.add(p); c.own(p.geometry); }
  return g;
}
// star-lit sky helper for the evenings (cheap): night grade + stars; alive = lit stars, dying = [{ i, t0 }]
export function night(c, alive, dying = []) { H.skyStars(c, { alive, kill: dying, size: 11 }); }
export const STAND = (c, name, x, z, pose = 'idle', o = {}) => who(c, name, x, z, pose, o);
