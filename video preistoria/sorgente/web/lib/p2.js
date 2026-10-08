// Props of Part 2 (years 2040+): the Ladder, factories and smoke, brick streets, rails and the train, lamps, the dam,
// the observatory, the Great Hall, the monitor / screen textures, the sky wall. Everything is procedural, built into the shot context `c`.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { height, slopeAt, isWater, distToRiver, riverWidth } from './terrain.js';
import { mulberry32, clamp, lerp, smoothstep } from './noise.js';

// ------------------------------------------------------------------ places (all on the flat west bank, in sight of Prima)
export const P2 = {
  ladder: { x: -214, z: 8 },                // the foot of the Ladder
  station: { x: -128, z: 26 },
  rail: [[-120, 26], [-170, 24], [-230, 30], [-300, 6], [-360, -70], [-420, -190]],
  dam: null,                                // set from the river by damSite()
  observatory: { x: 18, z: 52 },
  hall: { x: 12, z: -20 },                  // the Great Hall (open-air amphitheatre) next to the old plaza
};

const MAT = {};
const std = (k, o) => MAT[k] || (MAT[k] = new THREE.MeshStandardMaterial(o));
export const M2 = {
  brick: () => std('brick', { color: 0xa14c36, roughness: 0.92 }),
  brickD: () => std('brickD', { color: 0x7a3a2a, roughness: 0.95 }),
  roof: () => std('roof', { color: 0x33353b, roughness: 0.85 }),
  iron: () => std('iron', { color: 0x3b3f46, roughness: 0.55, metalness: 0.75 }),
  ironL: () => std('ironL', { color: 0x6b7078, roughness: 0.5, metalness: 0.7 }),
  concrete: () => std('concrete', { color: 0xb8b6ae, roughness: 0.95 }),
  glass: (e = 0) => std('glass' + e, { color: 0x1b2631, roughness: 0.2, metalness: 0.3, emissive: 0xffb347, emissiveIntensity: e }),
  wood: () => std('wood', { color: 0x6b4a2e, roughness: 0.9 }),
  stone: () => std('stone', { color: 0xaaa497, roughness: 0.92 }),
  white: () => std('white', { color: 0xf1efe8, roughness: 0.6 }),
  beacon: () => std('beacon', { color: 0xff3030, emissive: 0xff2020, emissiveIntensity: 2.4, roughness: 0.4 }),
};

function glowTex() {
  if (glowTex.t) return glowTex.t;
  const cv = document.createElement('canvas'); cv.width = cv.height = 64; const g = cv.getContext('2d');
  const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,235,190,1)'); gr.addColorStop(0.3, 'rgba(255,190,100,0.55)'); gr.addColorStop(1, 'rgba(255,150,40,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 64, 64); const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; return (glowTex.t = t);
}
function smokeTex() {
  if (smokeTex.t) return smokeTex.t;
  const cv = document.createElement('canvas'); cv.width = cv.height = 128; const g = cv.getContext('2d');
  const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, 'rgba(255,255,255,0.85)'); gr.addColorStop(0.55, 'rgba(255,255,255,0.35)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128); const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; return (smokeTex.t = t);
}

// ------------------------------------------------------------------ small helpers
const Y = new THREE.Vector3(0, 1, 0);
const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _s = new THREE.Vector3(), _p = new THREE.Vector3(), _d = new THREE.Vector3();
// instanced beams from a to b (world points), thickness t
export function beams(c, segs, mat, o = {}) {
  const geo = new THREE.BoxGeometry(1, 1, 1);
  const im = new THREE.InstancedMesh(geo, mat, segs.length); im.frustumCulled = false; im.castShadow = o.shadow ?? true; im.receiveShadow = true;
  const set = (i, s, vis = 1) => {
    const [ax, ay, az, bx, by, bz, th] = s;
    _d.set(bx - ax, by - ay, bz - az); const L = _d.length();
    if (!vis || L < 1e-4) { im.setMatrixAt(i, _m.makeScale(0, 0, 0)); return; }
    _q.setFromUnitVectors(Y, _d.normalize()); _p.set((ax + bx) / 2, (ay + by) / 2, (az + bz) / 2); _s.set(th, L, th);
    im.setMatrixAt(i, _m.compose(_p, _q, _s));
  };
  segs.forEach((s, i) => set(i, s));
  im.instanceMatrix.needsUpdate = true;
  c.own(geo); c.add(im);
  return { mesh: im, set, update() { im.instanceMatrix.needsUpdate = true; } };
}
const col = (hex) => new THREE.Color(hex);
function paint(g, fn) {
  g = g.index ? g.toNonIndexed() : g;
  for (const k of Object.keys(g.attributes)) if (!['position', 'normal'].includes(k)) g.deleteAttribute(k);
  const p = g.attributes.position, cc = new Float32Array(p.count * 3), t = new THREE.Color();
  for (let i = 0; i < p.count; i++) { fn(p.getX(i), p.getY(i), p.getZ(i), t); cc[i * 3] = t.r; cc[i * 3 + 1] = t.g; cc[i * 3 + 2] = t.b; }
  g.setAttribute('color', new THREE.BufferAttribute(cc, 3)); return g;
}
const solid = (hex, vary = 0.07, seed = 1) => { const r = mulberry32(seed), b = col(hex); return (x, y, z, t) => t.copy(b).multiplyScalar(1 - vary + 2 * vary * r()); };
const mv = (g, x = 0, y = 0, z = 0, ry = 0) => { if (ry) g.rotateY(ry); g.translate(x, y, z); return g; };
const merge = (parts) => { const g = mergeGeometries(parts); g.computeBoundingSphere(); return g; };
const vcMat = () => std('vc', { vertexColors: true, roughness: 0.9 });

// a pool of smoke / steam sprites rising from (x, y, z), drifting with the wind; deterministic in t
export function smoke(c, x, y, z, o = {}) {
  const n = o.n ?? 22, size = o.size ?? 4, rise = o.rise ?? 40, life = o.life ?? 9, wind = o.wind ?? [3, 1.2], r = mulberry32(o.seed ?? Math.floor(x * 3 + z));
  const mat = new THREE.SpriteMaterial({ map: smokeTex(), color: o.color ?? 0x55585e, transparent: true, depthWrite: false, opacity: o.opacity ?? 0.55, fog: true });
  const sp = [...Array(n)].map(() => { const s = new THREE.Sprite(mat.clone()); c.add(s); return { s, ph: r(), k: 0.8 + 0.4 * r(), rx: r() - 0.5, rz: r() - 0.5 }; });
  c.on((t) => {
    for (const p of sp) {
      const u = ((t / life) * p.k + p.ph) % 1;
      p.s.position.set(x + wind[0] * u * life * 0.6 + p.rx * size * u, y + rise * u, z + wind[1] * u * life * 0.6 + p.rz * size * u);
      const sc = size * (0.35 + 1.9 * u); p.s.scale.set(sc, sc, 1);
      p.s.material.opacity = (o.opacity ?? 0.55) * Math.sin(Math.PI * Math.min(1, u * 1.15)) * (1 - 0.35 * u) * (o.k ? o.k(t) : 1);
    }
  });
  return sp;
}
// glowing points (windows, street lamps) as one Points object
export function lights(c, pts, o = {}) {
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pts.flat(), 3));
  const m = new THREE.PointsMaterial({ map: glowTex(), color: o.color ?? 0xffc070, size: o.size ?? 5, sizeAttenuation: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: o.opacity ?? 1, fog: false });
  const p = new THREE.Points(g, m); p.frustumCulled = false; c.own(g); c.add(p); return p;
}

// ------------------------------------------------------------------ the Ladder: a tapered steel lattice tower
// H: full height (m), f(t) -> built fraction 0..1 (a number is allowed). Returns {top: [x, y, z], at(frac) -> y}
export function ladderTower(c, o = {}) {
  const x0 = o.x ?? P2.ladder.x, z0 = o.z ?? P2.ladder.z, H = o.H ?? 3000, Wb = o.Wb ?? 34, Wt = o.Wt ?? 4, L = o.levels ?? 52, base = height(x0, z0);
  const half = (y) => Wt + (Wb - Wt) * Math.pow(1 - y / H, 2.4);
  const yAt = (i) => H * Math.pow(i / L, 1.12);
  const segs = [], lev = [];
  const push = (level, s) => { segs.push(s); lev.push(level); };
  for (let i = 0; i < L; i++) {
    const ya = yAt(i), yb = yAt(i + 1), wa = half(ya), wb = half(yb), th = Math.max(0.5, 0.05 * wa + 0.3);
    const cs = [[-1, -1], [1, -1], [1, 1], [-1, 1]];
    cs.forEach(([sx, sz], k) => {
      push(i, [x0 + sx * wa, base + ya, z0 + sz * wa, x0 + sx * wb, base + yb, z0 + sz * wb, th * 1.6]);                     // corner posts
      const [nx, nz] = cs[(k + 1) % 4];
      push(i, [x0 + sx * wb, base + yb, z0 + sz * wb, x0 + nx * wb, base + yb, z0 + nz * wb, th]);                          // ring
      push(i, [x0 + sx * wa, base + ya, z0 + sz * wa, x0 + nx * wb, base + yb, z0 + nz * wb, th * 0.7]);                    // X braces
      push(i, [x0 + nx * wa, base + ya, z0 + nz * wa, x0 + sx * wb, base + yb, z0 + sz * wb, th * 0.7]);
    });
  }
  const B = beams(c, segs, M2.iron());
  const topY = base + H;
  // platforms every few levels
  const plat = [];
  for (let i = 4; i <= L; i += 6) { const y = yAt(i), w = half(y); plat.push([y, w]); }
  const pg = new THREE.BoxGeometry(1, 1, 1);
  const pim = new THREE.InstancedMesh(pg, M2.ironL(), plat.length); pim.frustumCulled = false; pim.castShadow = true;
  c.own(pg); c.add(pim);
  const beacon = new THREE.Mesh(new THREE.SphereGeometry(Math.max(2, Wt * 0.5), 12, 8), M2.beacon()); beacon.position.set(x0, topY + Wt, z0); c.add(beacon); c.own(beacon.geometry);
  const fFn = typeof o.f === 'function' ? o.f : () => (o.f ?? 1);
  let last = -1;
  const apply = (f) => {
    const k = Math.round(f * 1e4); if (k === last) return; last = k;
    const yMax = f * H;
    segs.forEach((s, i) => B.set(i, s, (s[4] - base) <= yMax + 0.01 ? 1 : 0));
    B.update();
    plat.forEach(([y, w], i) => { _p.set(x0, base + y, z0); _s.set(w * 2.1, Math.max(0.6, w * 0.06), w * 2.1); _m.compose(_p, _q.identity(), _s); if (y > yMax) _m.makeScale(0, 0, 0); pim.setMatrixAt(i, _m); });
    pim.instanceMatrix.needsUpdate = true;
    beacon.position.y = base + Math.max(2, yMax) + Wt * (1 - f * 0.4); beacon.visible = !o.noBeacon && (f > 0.995 || o.beaconAlways);
  };
  apply(fFn(0)); c.on((t) => apply(fFn(t)));
  return { base, H, top: [x0, topY, z0], at: (f) => base + f * H, half };
}

// ------------------------------------------------------------------ factories, brick streets, lamps
export function factory(c, x, z, yaw = 0, o = {}) {
  const night = o.night ?? 0, g = new THREE.Group(), y = height(x, z);
  const w = o.w ?? 26, d = o.d ?? 14, h = o.h ?? 9;
  const hall = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), M2.brick()); hall.position.y = h / 2; g.add(hall);
  for (let k = 0; k < 4; k++) {            // sawtooth roof
    const sh = new THREE.Shape(); sh.moveTo(0, 0); sh.lineTo(w / 4, 0); sh.lineTo(w / 4, 3.2); sh.lineTo(0, 0.2); sh.closePath();
    const ge = new THREE.ExtrudeGeometry(sh, { depth: d + 0.6, bevelEnabled: false }); ge.translate(-w / 2 + k * (w / 4), h, -(d + 0.6) / 2);
    const m = new THREE.Mesh(ge, M2.roof()); g.add(m);
  }
  const win = M2.glass(night);
  for (let k = 0; k < 6; k++) { const wi = new THREE.Mesh(new THREE.BoxGeometry(2.2, 3.2, 0.15), win); wi.position.set(-w / 2 + 2.6 + k * ((w - 5) / 5), h * 0.52, d / 2 + 0.05); g.add(wi); const w2 = wi.clone(); w2.position.z = -d / 2 - 0.05; g.add(w2); }
  const door = new THREE.Mesh(new THREE.BoxGeometry(4, 5, 0.2), M2.wood()); door.position.set(0, 2.5, d / 2 + 0.1); g.add(door);
  const ch = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 1.6, o.chim ?? 34, 12), M2.brickD()); ch.position.set(w / 2 - 3, h + (o.chim ?? 34) / 2 - 3, -d / 4); g.add(ch);
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(1.25, 0.95, 1.4, 12), M2.iron()); cap.position.set(w / 2 - 3, h + (o.chim ?? 34) - 3.6, -d / 4); g.add(cap);
  g.traverse(m => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } });
  g.position.set(x, y - 0.1, z); g.rotation.y = yaw; c.add(g);
  const top = new THREE.Vector3(w / 2 - 3, h + (o.chim ?? 34) - 3, -d / 4).applyAxisAngle(Y, yaw);
  if (o.smoke !== false) smoke(c, x + top.x, y + top.y, z + top.z, { size: o.smokeSize ?? 5, rise: 50, life: 10, wind: o.wind ?? [4, 1.5], color: o.smokeColor ?? 0x4d4f55, opacity: o.smokeOpacity ?? 0.6, seed: Math.floor(x + z * 7), k: o.smokeK });
  return g;
}
// terraced brick houses in a row (instanced)
let HOUSE_GEO = null;
function houseGeo() {
  if (HOUSE_GEO) return HOUSE_GEO;
  const body = paint(new THREE.BoxGeometry(5.2, 4.2, 6), solid(0xa5503a, 0.08, 3)); mv(body, 0, 2.1, 0);
  const sh = new THREE.Shape(); sh.moveTo(-3.0, 0); sh.lineTo(3.0, 0); sh.lineTo(0, 2.2); sh.closePath();
  const roof = paint(new THREE.ExtrudeGeometry(sh, { depth: 5.6, bevelEnabled: false }), solid(0x3a3d44, 0.06, 5)); roof.rotateY(Math.PI / 2); mv(roof, -2.8, 4.2, 0);
  const chim = paint(new THREE.BoxGeometry(0.8, 1.8, 0.8), solid(0x6d3426, 0.05, 9)); mv(chim, 1.4, 5.6, 1);
  const door = paint(new THREE.BoxGeometry(1.1, 2.0, 0.12), solid(0x40291a, 0.0)); mv(door, 0, 1.0, 3.04);
  const win = paint(new THREE.BoxGeometry(0.9, 1.1, 0.1), solid(0xf2c36a, 0.0)); const w2 = win.clone(); mv(win, -1.6, 2.7, 3.03); mv(w2, 1.6, 2.7, 3.03);
  HOUSE_GEO = merge([body, roof, chim, door, win, w2]);
  return HOUSE_GEO;
}
export function brickHouses(c, items, o = {}) {   // items: [[x, z, yaw, s]]
  const geo = houseGeo(), mat = std('vcH', { vertexColors: true, roughness: 0.9, emissive: 0xffa640, emissiveIntensity: 0 });
  mat.emissiveIntensity = 0;
  const im = new THREE.InstancedMesh(geo, mat, items.length); im.castShadow = true; im.receiveShadow = true; im.frustumCulled = false;
  items.forEach(([x, z, yaw = 0, s = 1], i) => { _q.setFromAxisAngle(Y, yaw); _s.setScalar(s); _p.set(x, height(x, z) - 0.15, z); im.setMatrixAt(i, _m.compose(_p, _q, _s)); });
  im.instanceMatrix.needsUpdate = true; c.add(im);
  if (o.lit) lights(c, items.flatMap(([x, z, yaw = 0]) => [-1.6, 1.6].map(dx => { const cs = Math.cos(yaw), sn = Math.sin(yaw); return [x + dx * cs + 3.3 * sn, height(x, z) + 2.7, z - dx * sn + 3.3 * cs]; })), { size: 3.2, color: 0xffb860, opacity: 0.9 });
  return im;
}
// street lamps: thin posts + glowing heads
export function lamps(c, pts, o = {}) {
  const geo = new THREE.CylinderGeometry(0.09, 0.12, 5, 6), im = new THREE.InstancedMesh(geo, M2.iron(), pts.length); im.frustumCulled = false;
  pts.forEach(([x, z], i) => { _p.set(x, height(x, z) + 2.5, z); im.setMatrixAt(i, _m.compose(_p, _q.identity(), _s.set(1, 1, 1))); });
  im.instanceMatrix.needsUpdate = true; c.own(geo); c.add(im);
  if (o.on !== false) lights(c, pts.map(([x, z]) => [x, height(x, z) + 5.1, z]), { size: o.size ?? 6, color: 0xffd9a0 });
}

// the industrial district (west bank): factories, brick streets, lamps, rails + train, the Ladder's foot.
// level 0..1 sets how much exists (year 2060 -> 0.05, 2080 -> 0.45, 2100+ -> 0.85, 2140 -> 1).
const FACT = [[-168, -52, 0.1], [-176, -14, 0.05], [-166, 66, 0.12], [-190, 104, 0.2], [-250, -62, 0.0], [-262, 46, -0.1], [-168, 138, 0.1], [-236, 100, 0.2], [-300, -20, 0.15], [-300, 70, 0.0], [-132, -92, 0.0], [-120, 90, 0.2]];
export function industry(c, level, o = {}) {
  // level: number 0..1, or a function of t (timelapse): factories rise one after the other, houses fill in
  const lvFn = typeof level === 'function' ? level : () => level, L0 = lvFn(0), Lmax = typeof level === 'function' ? Math.max(lvFn(0), lvFn(c.dur), o.maxLevel ?? 1) : level;
  const night = o.night ?? 0, nF = Math.round(FACT.length * clamp(Lmax * 1.1, 0, 1)), r = mulberry32(77), fac = [];
  for (let i = 0; i < nF; i++) fac.push(factory(c, FACT[i][0], FACT[i][1], FACT[i][2], { night, smoke: i < (o.smokeN ?? 99), smokeOpacity: o.smokeOpacity, smokeK: o.smokeK, wind: o.wind }));
  const hs = [], nH = Math.round(220 * clamp(Lmax, 0, 1));
  for (let k = 0; k < 600 && hs.length < nH; k++) {
    const x = -330 + r() * 250, z = -110 + r() * 260, yaw = Math.round(r() * 2) * Math.PI / 2;
    if (isWater(x, z) || slopeAt(x, z, 3) > 0.14) continue;
    if (FACT.slice(0, nF).some(([fx, fz]) => Math.hypot(fx - x, fz - z) < 26)) continue;
    if (Math.hypot(x - P2.ladder.x, z - P2.ladder.z) < 80) continue;
    const [d, s] = distToRiver(x, z); if (d < riverWidth(s) * 1.6) continue;
    if (hs.some(([hx, hz]) => Math.hypot(hx - x, hz - z) < 8)) continue;
    hs.push([x, z, yaw, 0.9 + r() * 0.25]);
  }
  let im = null;
  if (hs.length) im = brickHouses(c, hs, { lit: night > 0.2 });
  if (o.lamps !== false && Lmax > 0.3) lamps(c, hs.slice(0, 70).map(([x, z]) => [x + 5, z + 5]), { on: night > 0.2 });
  if (typeof level === 'function' || o.grow) {
    c.on((t) => { const L = clamp(lvFn(t), 0, 1.2);
      fac.forEach((g, i) => { const u = clamp(L * 1.1 * FACT.length - i, 0, 1); g.visible = u > 0.001; g.scale.set(1, Math.max(0.01, u), 1); });
      if (im) im.count = Math.floor(hs.length * clamp(L, 0, 1)); });
  }
  if (o.rails !== false && Lmax > 0.12) railway(c, o);
  return { houses: hs, fac };
}

// ------------------------------------------------------------------ railway + steam train
export function trackPath(pts) {
  const seg = [], P = pts.map(([x, z]) => [x, z]); let L = 0;
  for (let i = 0; i < P.length - 1; i++) { const l = Math.hypot(P[i + 1][0] - P[i][0], P[i + 1][1] - P[i][1]); seg.push([L, l]); L += l; }
  return { P, seg, L, at(s) {
    s = Math.max(0, Math.min(L - 1e-3, s)); let i = 0; while (i < seg.length - 1 && s > seg[i][0] + seg[i][1]) i++;
    const u = (s - seg[i][0]) / seg[i][1], [ax, az] = P[i], [bx, bz] = P[i + 1];
    return [lerp(ax, bx, u), lerp(az, bz, u), Math.atan2(bx - ax, bz - az)];
  } };
}
export function railway(c, o = {}) {
  const T = trackPath(o.pts || P2.rail), sl = [], rl = [];
  for (let s = 0; s < T.L; s += 2.6) {
    const [x, z, yaw] = T.at(s), [x2, z2] = T.at(Math.min(T.L - 1e-3, s + 1.3)), y = height(x, z) + 0.12, y2 = height(x2, z2) + 0.12;
    const nx = Math.cos(yaw), nz = -Math.sin(yaw);
    sl.push([x - nx * 1.4, y, z - nz * 1.4, x + nx * 1.4, y, z + nz * 1.4, 0.28]);
    for (const sd of [-0.72, 0.72]) rl.push([x + nx * sd, y + 0.14, z + nz * sd, x2 + nx * sd, y2 + 0.14, z2 + nz * sd, 0.16]);
  }
  beams(c, sl, M2.wood(), { shadow: false }); beams(c, rl, M2.ironL(), { shadow: false });
  return T;
}
// steam locomotive + wagons running along the path between t0 and t1 (loops if loop)
export function train(c, o = {}) {
  const T = trackPath(o.pts || P2.rail), g = new THREE.Group(), wag = o.wagons ?? 3, cars = [];
  const loco = new THREE.Group();
  const boiler = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 0.95, 4.2, 14), M2.iron()); boiler.rotation.x = Math.PI / 2; boiler.position.set(0, 1.9, 0.9); loco.add(boiler);
  const cab = new THREE.Mesh(new THREE.BoxGeometry(2.2, 2.6, 2.2), M2.brickD()); cab.position.set(0, 2.3, -1.5); loco.add(cab);
  const roofm = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.2, 2.5), M2.roof()); roofm.position.set(0, 3.7, -1.5); loco.add(roofm);
  const stack = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.5, 1.5, 10), M2.iron()); stack.position.set(0, 3.5, 2.3); loco.add(stack);
  const base = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.5, 6.4), M2.iron()); base.position.set(0, 0.8, 0); loco.add(base);
  for (const sx of [-1, 1]) for (const wz of [-1.9, 0.2, 2.3]) { const wh = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.62, 0.2, 14), M2.iron()); wh.rotation.z = Math.PI / 2; wh.position.set(sx * 1.05, 0.62, wz); loco.add(wh); }
  const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.22, 8, 6), new THREE.MeshStandardMaterial({ color: 0xfff1c0, emissive: 0xffe9a0, emissiveIntensity: 2.0 })); lamp.position.set(0, 1.9, 3.1); loco.add(lamp);
  loco.traverse(m => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } });
  g.add(loco); cars.push({ o: loco, off: 0 });
  for (let k = 0; k < wag; k++) {
    const w = new THREE.Group();
    const bx = new THREE.Mesh(new THREE.BoxGeometry(2.3, 1.7, 6.2), k % 2 ? M2.wood() : M2.brickD()); bx.position.y = 1.6; w.add(bx);
    const fl = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.4, 6.4), M2.iron()); fl.position.y = 0.7; w.add(fl);
    for (const sx of [-1, 1]) for (const wz of [-2, 2]) { const wh = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.18, 12), M2.iron()); wh.rotation.z = Math.PI / 2; wh.position.set(sx * 1.05, 0.5, wz); w.add(wh); }
    w.traverse(m => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } });
    g.add(w); cars.push({ o: w, off: 7.6 * (k + 1) + 1 });
  }
  c.add(g);
  const sp = o.speed ?? 14, s0 = o.s0 ?? 0, t0 = o.t0 ?? 0, puffs = smoke(c, 0, 0, 0, { n: 18, size: 2.2, rise: 9, life: 3, wind: [1, 1], color: 0xe8e8ec, opacity: 0.8, seed: 5 });
  let pe = new THREE.Vector3();
  c.on((t) => {
    cars.forEach(({ o: ob, off }) => {
      const s = (s0 + sp * (t - t0) - off); const [x, z, yaw] = T.at(Math.max(0, s)), y = height(x, z);
      ob.position.set(x, y + 0.1, z); ob.rotation.y = yaw;
    });
    const [x, z, yaw] = T.at(Math.max(0, s0 + sp * (t - t0) + 2.3)); const y = height(x, z) + 4.3;
    puffs.forEach((p, i) => { p.s.userData.base = [x, y, z]; });
    // smoke follows the locomotive: shift the pool origin (cheap: offset every sprite by the train's displacement)
    for (const p of puffs) { p.s.position.x += x - (p.lx ?? x); p.s.position.z += z - (p.lz ?? z); p.lx = x; p.lz = z; }
  });
  return { T, g };
}

// ------------------------------------------------------------------ the dam (concrete wall across the river) and the observatory
export function damSite() {
  // the river runs south->north west of Prima; put the wall where the bank is narrowest around z = -150
  return { x: -88, z: -150 };
}
export function dam(c, x, z, yaw = 0, o = {}) {
  const g = new THREE.Group(); const L = o.L ?? 70, H = o.H ?? 9;
  const wall = new THREE.Mesh(new THREE.BoxGeometry(L, H, 7), M2.concrete()); wall.position.y = H / 2 - 1.5; g.add(wall);
  for (let k = 0; k < 7; k++) { const pier = new THREE.Mesh(new THREE.BoxGeometry(2.2, H + 3, 8), M2.concrete()); pier.position.set(-L / 2 + 4 + k * ((L - 8) / 6), (H + 3) / 2 - 1.5, 0); g.add(pier); }
  const rail = new THREE.Mesh(new THREE.BoxGeometry(L, 0.15, 0.15), M2.iron()); rail.position.set(0, H + 1.6, 3.2); g.add(rail);
  g.traverse(m => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } });
  g.position.set(x, height(x, z), z); g.rotation.y = yaw; c.add(g); return g;
}
export function observatory(c, x, z, o = {}) {
  const g = new THREE.Group(), y = height(x, z);
  const base = new THREE.Mesh(new THREE.CylinderGeometry(6, 6.6, 8, 24), M2.white()); base.position.y = 4; g.add(base);
  const dome = new THREE.Mesh(new THREE.SphereGeometry(6.2, 28, 14, 0, Math.PI * 2, 0, Math.PI / 2), std('dome', { color: 0xdcdfe6, roughness: 0.35, metalness: 0.5 })); dome.position.y = 8; g.add(dome);
  const slit = new THREE.Mesh(new THREE.BoxGeometry(1.4, 9, 0.5), new THREE.MeshStandardMaterial({ color: 0x0b0f18, roughness: 0.6 })); slit.position.set(0, 11, 5.4); slit.rotation.x = -0.22; g.add(slit);
  const tel = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.7, 7, 12), M2.ironL()); tel.position.set(0, 11.2, 3.2); tel.rotation.x = -0.9; g.add(tel);
  const steps = new THREE.Mesh(new THREE.BoxGeometry(5, 0.6, 3), M2.stone()); steps.position.set(0, 0.3, 7.4); g.add(steps);
  g.traverse(m => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } });
  g.position.set(x, y, z); g.rotation.y = o.yaw ?? 0; c.add(g); return g;
}

// ------------------------------------------------------------------ the Great Hall: an open-air amphitheatre (stone tiers + podium)
// a closed solid annular sector (stair tier / floor): inner/outer radius, bottom/top y, angle range (x = R sin a, z = R cos a); finely divided so vertex lighting stays smooth
function annularSector(Rin, Rout, y0, y1, a0, a1, mat, o = {}) {
  const na = o.na ?? 64, nr = o.nr ?? 6, pos = [], idx = [];
  const P = (R, y, a) => { pos.push(Math.sin(a) * R, y, Math.cos(a) * R); return pos.length / 3 - 1; };
  const quad = (a, b, c2, d) => idx.push(a, b, c2, a, c2, d);
  const grid = (rows, cols, fn, flip) => { const base = pos.length / 3; for (let r = 0; r <= rows; r++) for (let q = 0; q <= cols; q++) fn(r / rows, q / cols); for (let r = 0; r < rows; r++) for (let q = 0; q < cols; q++) { const i0 = base + r * (cols + 1) + q, i1 = i0 + 1, i2 = i0 + cols + 1, i3 = i2 + 1; if (flip) quad(i0, i2, i3, i1); else quad(i0, i1, i3, i2); } };
  grid(nr, na, (u, v) => P(lerp(Rin, Rout, u), y1, lerp(a0, a1, v)), false);       // top
  grid(1, na, (u, v) => P(Rout, lerp(y1, y0, u), lerp(a0, a1, v)), true);            // outer wall
  if (Rin > 0.01) grid(1, na, (u, v) => P(Rin, lerp(y1, y0, u), lerp(a0, a1, v)), false);   // inner wall (the riser we sit in front of)
  for (const a of [a0, a1]) grid(1, nr, (u, v) => P(lerp(Rin, Rout, v), lerp(y1, y0, u), a), a === a0);   // end faces
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setIndex(idx); geo.computeVertexNormals();
  const m = new THREE.Mesh(geo, mat); m.castShadow = true; m.receiveShadow = true; return m;
}
export function greatHall(c, x, z, o = {}) {
  // the opening of the tiers faces local -z (the camera side of the stage)
  const yaw = o.yaw ?? 0, tiers = o.tiers ?? 9, R0 = o.R0 ?? 11, y0 = height(x, z), g = new THREE.Group();
  const A0 = Math.PI * 1.12, AL = Math.PI * 1.76, st2 = std('stone2', { color: 0x9a9488, roughness: 0.94, side: THREE.DoubleSide }), st1 = std('stoneH', { color: 0xaaa497, roughness: 0.92, side: THREE.DoubleSide });
  g.add(annularSector(0, R0, -0.4, 0.15, 0, Math.PI * 2, std('stoneF', { color: 0xb9b3a4, roughness: 0.95 }), { na: 72, nr: 10 }));
  for (let k = 0; k < tiers; k++) g.add(annularSector(R0 + 1.4 * k, R0 + 1.4 * (k + 1), -0.4, 0.55 * (k + 1), A0, A0 + AL, k % 2 ? st1 : st2));
  const pod = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.2, 1.4), std('podW', { color: 0xa07a50, roughness: 0.8 })); pod.position.set(0, 0.75, 0); pod.castShadow = true; g.add(pod);
  const Rc = R0 + 1.4 * tiers + 1.8;
  for (let k = 0; k < 9; k++) { const a = -0.42 * Math.PI + 0.84 * Math.PI * (k / 8); const col2 = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.5, 7.5, 10), M2.white()); col2.position.set(Math.sin(a) * Rc, 3.8 + 0.55 * tiers - 1, Math.cos(a) * Rc); col2.castShadow = true; g.add(col2); }
  g.position.set(x, y0, z); g.rotation.y = yaw; c.add(g);
  const seats = [], cs = Math.cos(yaw), sn = Math.sin(yaw);
  for (let k = 0; k < tiers; k++) {
    const R = R0 + 1.4 * (k + 1) - 0.6, n = Math.floor(R * 3.0);
    for (let i = 0; i < n; i++) {
      const a = A0 + AL * ((i + 0.5) / n), lx = Math.sin(a) * R, lz = Math.cos(a) * R;
      const wx = x + lx * cs + lz * sn, wz = z - lx * sn + lz * cs, fx = -lx, fz = -lz;
      seats.push([wx, y0 + 0.55 * (k + 1), wz, Math.atan2(fx * cs + fz * sn, -fx * sn + fz * cs)]);
    }
  }
  return { g, seats, y0, R0, podium: [x, y0 + 1.35, z], stage: [x, y0 + 0.15, z] };
}

// ------------------------------------------------------------------ canvas textures: text in the sky, the monitor, the screen of the world's edge
export function textTexture(drawFn, w = 1024, h = 512) {
  const cv = document.createElement('canvas'); cv.width = w; cv.height = h; const g = cv.getContext('2d');
  drawFn(g, w, h); const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return { tex: t, cv, g };
}
// glowing letters hung in the sky (billboard plane), fades in at t0 over `fade` seconds
export function skyText(c, text, pos, o = {}) {
  const w = o.w ?? 1400, h = o.h ?? 300, T = textTexture((g, W, H) => {
    g.clearRect(0, 0, W, H); g.font = `900 ${Math.floor(H * 0.78)}px "Anton", Impact, sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.shadowColor = o.glow ?? 'rgba(255,225,150,0.95)'; g.shadowBlur = H * 0.12; g.fillStyle = o.color ?? '#fff6d8';
    for (let i = 0; i < 3; i++) g.fillText(text, W / 2, H / 2 + 4);
  }, 2048, 512);
  const mat = new THREE.MeshBasicMaterial({ map: T.tex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false, opacity: 0, side: THREE.DoubleSide });
  const geo = new THREE.PlaneGeometry(w, h), m = new THREE.Mesh(geo, mat); m.position.set(...pos); if (o.flat) m.rotation.set(-Math.PI / 2, 0, Math.PI); else m.rotation.y = o.yaw ?? Math.PI; m.renderOrder = 4; c.own(geo); c.add(m);
  const t0 = o.t0 ?? 0, fade = o.fade ?? 1.5;
  c.on((t) => { m.material.opacity = clamp((t - t0) / fade, 0, 1) * (o.max ?? 1) * (0.92 + 0.08 * Math.sin(t * 5)); if (o.face) m.lookAt(E_CAM()); });
  return m;
}
function E_CAM() { return window.E.camera.position; }

// ================================================================== more props (festival, signs, lab, the top of the Ladder)
// a flat canvas sign / banner: texts [{s, size, color, y}], bg colour; stands on posts if o.posts
export function sign(c, x, y, z, yaw, w, h, lines, o = {}) {      // y = height of the sign's centre above the ground at (x, z)
  const T = textTexture((g, W, H) => {
    g.fillStyle = o.bg ?? '#f3e7c8'; g.fillRect(0, 0, W, H);
    if (o.border) { g.strokeStyle = o.border; g.lineWidth = H * 0.05; g.strokeRect(H * 0.05, H * 0.05, W - H * 0.1, H - H * 0.1); }
    lines.forEach((l) => { g.fillStyle = l.color ?? '#3a2a18'; g.font = `${l.weight ?? 700} ${l.size}px ${l.font ?? 'Anton'}, sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(l.s, W / 2, l.y); });
  }, o.px ?? 1024, o.py ?? 512);
  if (o.face) yaw = Math.atan2(o.face[0] - x, o.face[1] - z);
  const y0 = height(x, z), geo = new THREE.PlaneGeometry(w, h);
  const mat = new THREE.MeshStandardMaterial({ map: T.tex, roughness: 0.8, side: THREE.DoubleSide, emissive: o.glow ? 0xffffff : 0x000000, emissiveMap: o.glow ? T.tex : null, emissiveIntensity: o.glow ?? 0 });
  const m = new THREE.Mesh(geo, mat); m.position.set(x, y0 + y, z); m.rotation.y = yaw; m.castShadow = true; c.own(geo); c.add(m);
  if (o.posts) for (const s of [-1, 1]) { const ph = y + h / 2, pg = new THREE.CylinderGeometry(0.07, 0.08, ph, 6), p = new THREE.Mesh(pg, M2.wood()); p.position.set(x + Math.cos(yaw) * s * (w / 2 - 0.15), y0 + ph / 2, z - Math.sin(yaw) * s * (w / 2 - 0.15)); p.castShadow = true; c.own(pg); c.add(p); }
  return m;
}
// strings of bunting flags + glowing lanterns between two points
export function bunting(c, a, b, n = 14, o = {}) {
  const cols = o.colors ?? [0xff5a4a, 0xffd23a, 0x4aa8ff, 0x6fe08a, 0xff8ad0];
  const geo = new THREE.ConeGeometry(0.28, 0.6, 3), im = new THREE.InstancedMesh(geo, std('flag', { color: 0xffffff, roughness: 0.8, side: THREE.DoubleSide }), n); im.frustumCulled = false; c.own(geo);
  for (let i = 0; i < n; i++) {
    const u = (i + 0.5) / n, x = lerp(a[0], b[0], u), z = lerp(a[2], b[2], u), y = lerp(a[1], b[1], u) - Math.sin(Math.PI * u) * (o.sag ?? 0.9);
    _q.setFromEuler(new THREE.Euler(Math.PI, Math.atan2(b[0] - a[0], b[2] - a[2]), 0)); _p.set(x, y - 0.25, z); _s.set(1, 1, 1);
    im.setMatrixAt(i, _m.compose(_p, _q, _s)); im.setColorAt(i, col(cols[i % cols.length]));
  }
  im.instanceMatrix.needsUpdate = true; c.add(im);
  if (o.lanterns) lights(c, [...Array(n)].map((_, i) => { const u = (i + 0.5) / n; return [lerp(a[0], b[0], u), lerp(a[1], b[1], u) - Math.sin(Math.PI * u) * (o.sag ?? 0.9) - 0.5, lerp(a[2], b[2], u)]; }), { size: o.lsize ?? 2.4, color: 0xffb860 });
}
// a brass telescope on a tripod (or held): returns the group
export function telescope(c, x, z, o = {}) {
  const g = new THREE.Group(), y = height(x, z), s = o.s ?? 1;
  const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.1 * s, 0.14 * s, 1.5 * s, 14), std('brass', { color: 0xc99a3c, roughness: 0.3, metalness: 0.9 })); tube.rotation.z = Math.PI / 2 - (o.pitch ?? 0.9); tube.position.y = 1.5 * s; g.add(tube);
  for (let k = 0; k < 3; k++) { const a = k / 3 * Math.PI * 2, leg = new THREE.Mesh(new THREE.CylinderGeometry(0.03 * s, 0.03 * s, 1.5 * s, 5), M2.wood()); leg.position.set(Math.cos(a) * 0.35 * s, 0.7 * s, Math.sin(a) * 0.35 * s); leg.rotation.set(Math.sin(a) * 0.28, 0, -Math.cos(a) * 0.28); g.add(leg); }
  g.traverse(m => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } });
  g.position.set(x, y, z); g.rotation.y = o.yaw ?? 0; c.add(g); return g;
}
export function pizza(c, parent, o = {}) {
  const T = textTexture((g, W, H) => { g.fillStyle = '#e9b865'; g.fillRect(0, 0, W, H); g.fillStyle = '#d9382b'; g.beginPath(); g.arc(W / 2, H / 2, W * 0.42, 0, 6.3); g.fill(); g.fillStyle = '#f6d65a'; g.beginPath(); g.arc(W / 2, H / 2, W * 0.38, 0, 6.3); g.fill(); g.fillStyle = '#b3261e'; for (let i = 0; i < 9; i++) { const a = i * 2.4, r = W * 0.2 * ((i % 3) / 2 + 0.3); g.beginPath(); g.arc(W / 2 + Math.cos(a) * r, H / 2 + Math.sin(a) * r, W * 0.04, 0, 6.3); g.fill(); } }, 256, 256);
  const m = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.04, 28), new THREE.MeshStandardMaterial({ map: T.tex, roughness: 0.7 })); m.castShadow = true;
  if (parent) { m.position.set(0, -0.06, 0.04); parent.add(m); } else c.add(m); return m;
}
// the Bingus detector: a box of lights, an antenna and a dish; the lights blink
export function detector(c, x, z, yaw = 0) {
  const g = new THREE.Group(), y = height(x, z);
  const box = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.6, 1.4), M2.ironL()); box.position.y = 0.8; g.add(box);
  const lamps = [];
  for (let i = 0; i < 6; i++) { const l = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 6), new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xff3a2a, emissiveIntensity: 0 })); l.position.set(-0.8 + i * 0.32, 1.2, 0.72); g.add(l); lamps.push(l); }
  const ant = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.05, 2.6, 6), M2.iron()); ant.position.set(0.7, 2.9, 0); g.add(ant);
  const dish = new THREE.Mesh(new THREE.ConeGeometry(0.7, 0.35, 20, 1, true), M2.white()); dish.rotation.x = -Math.PI / 2; dish.position.set(-0.4, 2.0, 0.6); g.add(dish); const bar = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.05, 0.05), M2.iron()); bar.position.set(0.7, 3.8, 0); g.add(bar);
  g.traverse(m => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } });
  g.position.set(x, y, z); g.rotation.y = yaw; c.add(g);
  c.on((t) => lamps.forEach((l, i) => { l.material.emissiveIntensity = (Math.sin(t * 6 + i * 1.7) > 0.2) ? 2.6 : 0.05; }));
  return g;
}
// a barrel (the baker's pulpit)
export function barrel(c, x, z, s = 1) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(0.55 * s, 0.5 * s, 1.0 * s, 16), M2.wood()); m.position.set(x, height(x, z) + 0.5 * s, z); m.castShadow = true; m.receiveShadow = true; c.own(m.geometry); c.add(m);
  const band = new THREE.Mesh(new THREE.TorusGeometry(0.55 * s, 0.03 * s, 6, 20), M2.iron()); band.rotation.x = Math.PI / 2; band.position.set(x, height(x, z) + 0.8 * s, z); c.add(band); c.own(band.geometry);
  return m;
}
// a wooden lattice tower that can fall: group of beams; fall(t) -> 0..1 tilt about its base (toward yaw)
export function woodTower(c, x, z, H, o = {}) {
  const g = new THREE.Group(), y = height(x, z), L = 6, w0 = H * 0.18, w1 = H * 0.05;
  const add = (ax, ay, az, bx, by, bz, th) => { const d = new THREE.Vector3(bx - ax, by - ay, bz - az), len = d.length(); const m = new THREE.Mesh(new THREE.BoxGeometry(th, len, th), M2.wood()); m.position.set((ax + bx) / 2, (ay + by) / 2, (az + bz) / 2); m.quaternion.setFromUnitVectors(Y, d.normalize()); m.castShadow = true; g.add(m); };
  for (let i = 0; i < L; i++) {
    const ya = H * i / L, yb = H * (i + 1) / L, wa = lerp(w0, w1, i / L), wb = lerp(w0, w1, (i + 1) / L);
    for (const [sx, sz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) { add(sx * wa, ya, sz * wa, sx * wb, yb, sz * wb, 0.35); }
    for (const [sx, sz, nx, nz] of [[-1, -1, 1, -1], [1, -1, 1, 1], [1, 1, -1, 1], [-1, 1, -1, -1]]) { add(sx * wb, yb, sz * wb, nx * wb, yb, nz * wb, 0.22); add(sx * wa, ya, sz * wa, nx * wb, yb, nz * wb, 0.16); }
  }
  const pivot = new THREE.Group(); pivot.position.set(x, y, z); pivot.add(g); c.add(pivot);
  const yaw = o.yaw ?? 0, fall = o.fall ?? (() => 0);
  c.on((t) => { const f = fall(t), a = Math.min(1.5, f * f * 1.6) * 1.0; pivot.rotation.set(0, 0, 0); pivot.rotateY(yaw); pivot.rotateX(a); pivot.rotateY(-yaw); });
  return pivot;
}
// lights that fade in/out as one object (k(t) 0..1)
export function cityLights(c, pts, k, o = {}) {
  const p = lights(c, pts, { size: o.size ?? 4, color: o.color ?? 0xffc680, opacity: 0 });
  c.on((t) => { p.material.opacity = clamp(k(t), 0, 1) * (o.max ?? 1); }); return p;
}

// ---- the little world in a box (canvas drawing): phase 0 baby world, 1 fire + farms, 2 flood, 3 survivors round a fire, 4 the eye, 5 a girl on a rock at sunset, 6 the berry
export function drawLittleWorld(g, W, H, t, phase = 0, o = {}) {
  const r = mulberry32(5);
  g.fillStyle = '#0b1220'; g.fillRect(0, 0, W, H);
  const mx = W * 0.06, my = H * 0.1, mw = W * 0.88, mh = H * 0.8;
  const sunset = phase === 5;
  const grd = g.createLinearGradient(0, my, 0, my + mh); if (sunset) { grd.addColorStop(0, '#ff9a4a'); grd.addColorStop(0.55, '#c25a7a'); grd.addColorStop(1, '#3a2a4a'); } else { grd.addColorStop(0, '#3c7a3a'); grd.addColorStop(1, '#2f6a35'); }
  g.fillStyle = grd; g.fillRect(mx, my, mw, mh);
  if (!sunset) { g.fillStyle = 'rgba(255,255,255,0.05)'; for (let i = 0; i < 90; i++) g.fillRect(mx + r() * mw, my + r() * mh, 6 + r() * 12, 3);
    g.fillStyle = '#2a8bc4'; g.beginPath(); g.moveTo(mx + mw * 0.62, my); g.bezierCurveTo(mx + mw * 0.5, my + mh * 0.3, mx + mw * 0.75, my + mh * 0.6, mx + mw * 0.6, my + mh); g.lineTo(mx + mw * 0.68, my + mh); g.bezierCurveTo(mx + mw * 0.82, my + mh * 0.6, mx + mw * 0.58, my + mh * 0.3, mx + mw * 0.7, my); g.fill();
    for (let i = 0; i < 26; i++) { g.fillStyle = '#1f5a2a'; g.beginPath(); g.arc(mx + r() * mw * 0.55, my + r() * mh, 7 + r() * 8, 0, 6.3); g.fill(); } }
  const fx = mx + mw * 0.3, fy = my + mh * 0.55;
  if (phase === 5) {     // one little AI on a rock, staring at the sunset
    g.fillStyle = '#ffd27a'; g.beginPath(); g.arc(mx + mw * 0.7, my + mh * 0.5, mh * 0.12, 0, 6.3); g.fill(); g.fillStyle = '#4a3a4a'; g.beginPath(); g.ellipse(mx + mw * 0.3, my + mh * 0.82, mw * 0.1, mh * 0.08, 0, 0, 6.3); g.fill();
    g.fillStyle = '#9b5cff'; g.beginPath(); g.arc(mx + mw * 0.3, my + mh * 0.74, mh * 0.04, 0, 6.3); g.fill(); g.fillRect(mx + mw * 0.3 - mh * 0.022, my + mh * 0.74, mh * 0.044, mh * 0.07);
  }
  if (phase === 6) {     // a berry bush; one dot finds it, raises her hand, the others come over
    const bx = mx + mw * 0.5, by = my + mh * 0.5; g.fillStyle = '#2a7a35'; g.beginPath(); g.arc(bx, by, mh * 0.09, 0, 6.3); g.fill(); g.fillStyle = '#d22a3a'; for (let i = 0; i < 9; i++) { g.beginPath(); g.arc(bx + Math.cos(i * 2.2) * mh * 0.06, by + Math.sin(i * 2.2) * mh * 0.05, 4, 0, 6.3); g.fill(); }
    const k = clamp(t / 3.2, 0, 1);
    for (let i = 0; i < 19; i++) { const a = i * 0.33 + 0.5, sx = mx + mw * (0.12 + 0.78 * ((i * 37) % 100) / 100), sy = my + mh * (0.15 + 0.7 * (((i * 53) % 100) / 100)); const x = lerp(sx, bx + Math.cos(a) * mh * 0.14, k * clamp(t / 4 + 0.1, 0, 1)), y = lerp(sy, by + Math.sin(a) * mh * 0.14, k); g.fillStyle = '#f4f1ec'; g.beginPath(); g.arc(x, y, 4.2, 0, 6.3); g.fill(); }
    g.fillStyle = '#ff9a2a'; g.beginPath(); g.arc(bx + mh * 0.13, by + mh * 0.02, 5, 0, 6.3); g.fill(); g.strokeStyle = '#ff9a2a'; g.lineWidth = 3; g.beginPath(); g.moveTo(bx + mh * 0.13, by + mh * 0.02); g.lineTo(bx + mh * 0.15, by - mh * 0.06 - Math.sin(t * 6) * 3); g.stroke();
  }
  if (phase === 1 || phase === 2 || phase === 3) {     // farms + huts
    if (phase !== 3) for (let i = 0; i < 4; i++) { g.fillStyle = i % 2 ? '#c9b24a' : '#a8a444'; g.fillRect(fx - 90 + i * 40, fy + 26, 34, 28); }
    if (phase !== 3) for (let i = 0; i < 5; i++) { g.fillStyle = '#8a6a45'; g.fillRect(fx + 40 + (i % 3) * 30, fy - 40 + Math.floor(i / 3) * 30, 18, 14); g.fillStyle = '#c9a35a'; g.beginPath(); g.moveTo(fx + 38 + (i % 3) * 30, fy - 40 + Math.floor(i / 3) * 30); g.lineTo(fx + 49 + (i % 3) * 30, fy - 52 + Math.floor(i / 3) * 30); g.lineTo(fx + 60 + (i % 3) * 30, fy - 40 + Math.floor(i / 3) * 30); g.fill(); }
    const fl = 0.7 + 0.3 * Math.sin(t * 14); g.fillStyle = `rgba(255,${150 + 80 * fl},40,0.95)`; g.beginPath(); g.arc(fx, fy, 9 * fl + 4, 0, 6.3); g.fill(); g.fillStyle = 'rgba(255,200,80,0.18)'; g.beginPath(); g.arc(fx, fy, 38, 0, 6.3); g.fill();
  }
  if (phase !== 5 && phase !== 6) {
    const alive = phase === 2 ? 20 - Math.min(10, Math.floor(t * 2.2)) : (phase === 3 ? 10 : 20);
    for (let i = 0; i < alive; i++) {
      const a = i * 2.4 + r() * 6, rad = phase === 3 ? 26 + (i % 2) * 10 : (phase >= 1 ? 30 + (i % 5) * 24 : 70 + (i % 7) * 30);
      const x = fx + Math.cos(a + t * (phase === 3 ? 0.05 : 0.15 + (i % 3) * 0.05)) * rad * (phase >= 1 ? 1 : 1.6), y = fy + Math.sin(a * 1.3 + t * 0.2) * rad * (phase === 3 ? 1 : 0.7);
      g.fillStyle = i === 3 ? '#ff9a2a' : (o.king && i === 0 ? '#ffd34a' : '#f4f1ec'); g.beginPath(); g.arc(x, y, o.king && i === 0 ? 6 : 4.2, 0, 6.3); g.fill(); g.fillStyle = 'rgba(0,0,0,0.3)'; g.beginPath(); g.ellipse(x + 2, y + 5, 4, 1.6, 0, 0, 6.3); g.fill();
      if (o.names && i < 6) { g.fillStyle = '#e8f0ff'; g.font = `${H * 0.034}px InterX, sans-serif`; g.fillText(['Ila', 'Kra', 'Nua', 'Toh', 'Bel', 'Wen'][i], x + 7, y - 6); }
    }
  }
  if (phase === 2) { const lv = Math.min(1, t * 0.18); g.fillStyle = 'rgba(46,120,200,0.62)'; g.beginPath(); g.ellipse(mx + mw * 0.62, my + mh * 0.5, mw * (0.12 + 0.46 * lv), mh * (0.2 + 0.5 * lv), 0, 0, 6.3); g.fill(); g.fillStyle = 'rgba(255,255,255,0.1)'; for (let i = 0; i < 8; i++) g.fillRect(mx + r() * mw, my + r() * mh, 20, 2); }
  if (phase === 4) { const ex = mx + mw * 0.5, ey = my + mh * 0.5, k = clamp(t / 2.4, 0, 1); g.strokeStyle = '#e9d8b0'; g.lineWidth = 7; g.beginPath(); g.arc(ex, ey, mh * 0.36, -1.57, -1.57 + 6.3 * clamp(k * 1.6, 0, 1)); g.stroke(); if (k > 0.5) { g.beginPath(); g.ellipse(ex, ey, mh * 0.2, mh * 0.1, 0, 0, 6.3 * clamp((k - 0.5) * 2, 0, 1)); g.stroke(); } if (k > 0.95) { g.fillStyle = '#e9d8b0'; g.beginPath(); g.arc(ex, ey, mh * 0.05, 0, 6.3); g.fill(); } }
  g.fillStyle = '#111827'; g.fillRect(0, 0, W, H * 0.07); g.fillStyle = '#7dd3fc'; g.font = `bold ${H * 0.04}px MonoX, monospace`; g.textBaseline = 'middle'; g.fillText('LITTLE.SIM', W * 0.03, H * 0.035);
  g.fillStyle = '#cbd5e1'; g.font = `${H * 0.036}px MonoX, monospace`; g.fillText(o.year !== undefined ? 'YEAR ' + Math.floor(typeof o.year === 'function' ? o.year(t) : o.year) : (phase === 2 ? `POP ${20 - Math.min(10, Math.floor(t * 2.2))}` : 'POP 20'), W * 0.4, H * 0.035); g.fillStyle = '#4ade80'; g.fillText('\u25CF RUNNING', W * 0.78, H * 0.035); g.textBaseline = 'alphabetic';
}
// a free-standing monitor plane showing a canvas drawing (square / city use)
export function monitor(c, x, y, z, yaw, w, drawFn, o = {}) {
  const cv = document.createElement('canvas'); cv.width = o.px ?? 1024; cv.height = Math.round((o.px ?? 1024) * (o.aspect ?? 0.5625)); const g = cv.getContext('2d');
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
  const h = w * (o.aspect ?? 0.5625), grp = new THREE.Group();
  const frame = new THREE.Mesh(new THREE.BoxGeometry(w + 0.1 * w, h + 0.1 * w, 0.06 * w), std('black', { color: 0x101114, roughness: 0.4, metalness: 0.2 })); grp.add(frame);
  const geo = new THREE.PlaneGeometry(w, h), smat = new THREE.MeshBasicMaterial({ map: tex, toneMapped: false }), scr = new THREE.Mesh(geo, smat); scr.position.z = 0.031 * w; grp.add(scr); c.own(geo);
  if (o.both) { const scr2 = new THREE.Mesh(geo, smat); scr2.position.z = -0.031 * w; scr2.rotation.y = Math.PI; grp.add(scr2); }
  const light = new THREE.PointLight(o.lightColor ?? 0x9fd0ff, o.light ?? 2.5, 9 * w, 2); light.position.set(0, 0, 0.8 * w); grp.add(light);
  if (o.stand !== false) { const st = new THREE.Mesh(new THREE.BoxGeometry(0.08 * w, y, 0.08 * w), M2.iron()); st.position.set(0, -h / 2 - y / 2, -0.03 * w); grp.add(st); }
  grp.position.set(x, height(x, z) + y, z); grp.rotation.y = yaw; c.add(grp);
  const draw = (t) => { drawFn(g, cv.width, cv.height, t); tex.needsUpdate = true; }; draw(0); c.on(draw);
  return { grp, tex, g, cv, w, h };
}
// a big red button on a pedestal
export function bigButton(c, x, z, o = {}) {
  const g = new THREE.Group(), y = height(x, z);
  const ped = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.65, 1.1, 16), M2.stone()); ped.position.y = 0.55; g.add(ped);
  const ring = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.08, 20), M2.iron()); ring.position.y = 1.14; g.add(ring);
  const dome = new THREE.Mesh(new THREE.SphereGeometry(0.34, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0xd61f1f, roughness: 0.25, emissive: 0xff1010, emissiveIntensity: 0.7 })); dome.position.y = 1.18; g.add(dome);
  g.traverse(m => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } });
  g.position.set(x, y, z); c.add(g);
  const L = new THREE.PointLight(0xff3020, 3, 6, 2); L.position.set(x, y + 1.7, z); c.add(L);
  c.on((t) => { const k = 0.6 + 0.4 * Math.sin(t * 4); dome.material.emissiveIntensity = 0.4 + 0.9 * k; L.intensity = 1.5 + 3 * k; });
  return { g, dome, top: [x, y + 1.5, z] };
}

// ---- the top of the Ladder: clouds below, the painted sky wall with a crack, a platform for the crew
export function cloudSea(c, y, R = 2600, n = 150, seed = 3) {
  const r = mulberry32(seed), mat = new THREE.SpriteMaterial({ map: smokeTex(), color: 0xffffff, transparent: true, depthWrite: false, opacity: 0.9, fog: false });
  for (let i = 0; i < n; i++) { const s = new THREE.Sprite(mat); const a = r() * 6.28, d = Math.sqrt(r()) * R; const sc = 380 + r() * 700; s.scale.set(sc, sc * (0.34 + 0.2 * r()), 1); s.position.set(P2.ladder.x + Math.cos(a) * d, y + (r() - 0.5) * 90, P2.ladder.z + Math.sin(a) * d); c.add(s); }
}
export function skyWall(c, y, o = {}) {
  const W = o.w ?? 1400, T = textTexture((g, Wp, Hp) => {
    const gr = g.createLinearGradient(0, 0, 0, Hp); gr.addColorStop(0, '#04070f'); gr.addColorStop(1, '#0b1630'); g.fillStyle = gr; g.fillRect(0, 0, Wp, Hp);
    const r = mulberry32(21);
    for (let i = 0; i < 900; i++) { const s = r() * 2.2 + 0.4; g.fillStyle = `rgba(255,255,${200 + Math.floor(r() * 55)},${0.5 + r() * 0.5})`; g.beginPath(); g.arc(r() * Wp, r() * Hp, s, 0, 6.3); g.fill(); }
    g.strokeStyle = 'rgba(255,255,255,0.04)'; g.lineWidth = 2; for (let i = 0; i < Wp; i += 128) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i, Hp); g.stroke(); }
  }, 2048, 2048);
  T.tex.wrapS = T.tex.wrapT = THREE.RepeatWrapping; T.tex.repeat.set(10, 10);
  const geo = new THREE.PlaneGeometry(W, W), mat = new THREE.MeshBasicMaterial({ map: T.tex, fog: false, side: THREE.DoubleSide }), m = new THREE.Mesh(geo, mat);
  m.rotation.x = -Math.PI / 2; m.position.set(o.x ?? P2.ladder.x, y, o.z ?? P2.ladder.z); c.own(geo); c.add(m);
  return m;
}
// the crack of white light: a jagged emissive strip; opens (width grows) from t0 over `dur`
export function crack(c, pos, o = {}) {
  const pts = [], r = mulberry32(9), L = o.L ?? 60, n = 18, WID = o.wid ?? 0.35;
  for (let i = 0; i <= n; i++) pts.push([(i / n - 0.5) * L + (r() - 0.5) * 2, (r() - 0.5) * 3]);
  const geo = new THREE.BufferGeometry(); const pos3 = [];
  for (let i = 0; i < n; i++) { const [ax, az] = pts[i], [bx, bz] = pts[i + 1]; pos3.push(ax, 0, az - WID, bx, 0, bz - WID, bx, 0, bz + WID, ax, 0, az - WID, bx, 0, bz + WID, ax, 0, az + WID); }
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos3, 3));
  const mat = new THREE.MeshBasicMaterial({ color: 0xffffff, fog: false, side: THREE.DoubleSide, transparent: true, opacity: 0 }), m = new THREE.Mesh(geo, mat);
  m.position.set(...pos); m.renderOrder = 5; c.own(geo); c.add(m);
  const glow = new THREE.PointLight(0xdff2ff, 0, 400, 1.4); glow.position.set(pos[0], pos[1] - 6, pos[2]); c.add(glow);
  const t0 = o.t0 ?? 0, dur = o.dur ?? 1.0;
  c.on((t) => { const u = clamp((t - t0) / dur, 0, 1); m.scale.set(1, 1, 1 + 3 * u); mat.opacity = Math.min(1, u * 3); glow.intensity = 260 * u; });
  return m;
}
// the crew's platform at the top: a deck with railings
export function topPlatform(c, x, y, z, o = {}) {
  const g = new THREE.Group(), w = o.w ?? 16;
  const deck = new THREE.Mesh(new THREE.BoxGeometry(w, 0.5, w), M2.ironL()); g.add(deck);
  for (let i = 0; i < 20; i++) { const a = i / 20 * Math.PI * 2, p = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.1, 0.12), M2.iron()); p.position.set(Math.cos(a) * (w / 2 - 0.2) * 1.0, 0.8, Math.sin(a) * (w / 2 - 0.2)); g.add(p); }
  for (const s of [-1, 1]) { const r1 = new THREE.Mesh(new THREE.BoxGeometry(w, 0.1, 0.1), M2.iron()); r1.position.set(0, 1.3, s * (w / 2 - 0.2)); g.add(r1); const r2 = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, w), M2.iron()); r2.position.set(s * (w / 2 - 0.2), 1.3, 0); g.add(r2); }
  g.traverse(m => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } });
  g.position.set(x, y, z); c.add(g); return g;
}

// ---- more small props: animated boards, confetti, books, painted fish
export function board(c, x, y, z, face, w, h, drawFn, o = {}) {      // a free-standing board whose canvas is redrawn every frame
  const cv = document.createElement('canvas'); cv.width = o.px ?? 1024; cv.height = Math.round((o.px ?? 1024) * h / w); const g = cv.getContext('2d');
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
  const geo = new THREE.PlaneGeometry(w, h), mat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.9, side: THREE.DoubleSide, emissive: o.glow ? 0xffffff : 0, emissiveMap: o.glow ? tex : null, emissiveIntensity: o.glow ?? 0 });
  const m = new THREE.Mesh(geo, mat), y0 = height(x, z); m.position.set(x, y0 + y, z); m.rotation.y = Math.atan2(face[0] - x, face[1] - z); m.castShadow = true; c.own(geo); c.add(m);
  if (o.posts !== false) for (const s of [-1, 1]) { const ph = y + h / 2, pg = new THREE.CylinderGeometry(0.06, 0.07, ph, 6), p = new THREE.Mesh(pg, M2.wood()); const ry = m.rotation.y; p.position.set(x + Math.cos(ry) * s * (w / 2 - 0.1), y0 + ph / 2, z - Math.sin(ry) * s * (w / 2 - 0.1)); c.own(pg); c.add(p); }
  const draw = (t) => { drawFn(g, cv.width, cv.height, t); tex.needsUpdate = true; }; draw(0); c.on(draw);
  return m;
}
export function confetti(c, cx, cy, cz, n = 260, o = {}) {
  const r = mulberry32(o.seed ?? 3), geo = new THREE.BufferGeometry(), pos = new Float32Array(n * 3), colr = new Float32Array(n * 3), base = [];
  const cols = [0xff5a4a, 0xffd23a, 0x4aa8ff, 0x6fe08a, 0xff8ad0, 0xffffff].map(h => new THREE.Color(h));
  for (let i = 0; i < n; i++) { const cc = cols[i % cols.length]; colr[i * 3] = cc.r; colr[i * 3 + 1] = cc.g; colr[i * 3 + 2] = cc.b; base.push([(r() - 0.5) * (o.w ?? 40), r() * (o.h ?? 14), (r() - 0.5) * (o.d ?? 30), 0.6 + r(), r() * 6.28]); }
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('color', new THREE.BufferAttribute(colr, 3));
  const pts = new THREE.Points(geo, new THREE.PointsMaterial({ size: o.size ?? 0.22, vertexColors: true, transparent: true, depthWrite: false })); pts.frustumCulled = false; c.own(geo); c.add(pts);
  c.on((t) => { for (let i = 0; i < n; i++) { const [bx, by, bz, sp, ph] = base[i], H = o.h ?? 14; pos[i * 3] = cx + bx + Math.sin(t * 1.3 + ph) * 0.8; pos[i * 3 + 1] = cy + ((by - t * sp * 2.2) % H + H) % H; pos[i * 3 + 2] = cz + bz + Math.cos(t * 1.1 + ph) * 0.8; } geo.attributes.position.needsUpdate = true; });
  return pts;
}
export function book(c, x, y, z, yaw = 0, s = 1) {   // y = absolute height of the surface it rests on
  const g = new THREE.Group(), cover = new THREE.Mesh(new THREE.BoxGeometry(0.8 * s, 0.1 * s, 0.56 * s), std('bookc', { color: 0x6a2a2a, roughness: 0.7 })); g.add(cover);
  const pages = new THREE.Mesh(new THREE.BoxGeometry(0.74 * s, 0.14 * s, 0.5 * s), std('pages', { color: 0xf1ead2, roughness: 0.9 })); pages.position.y = 0.09 * s; g.add(pages);
  g.position.set(x, y + 0.05 * s, z); g.rotation.y = yaw; g.traverse(m => { if (m.isMesh) { m.castShadow = true; } }); c.add(g); return g;
}
// a fish painting for a sign canvas (g: 2D context)
export function paintFish(g, W, H, hex = '#3f8fd6') {
  g.fillStyle = '#e8f1f5'; g.fillRect(0, 0, W, H); g.fillStyle = hex; g.beginPath(); g.ellipse(W * 0.46, H * 0.5, W * 0.3, H * 0.26, 0, 0, 6.3); g.fill();
  g.beginPath(); g.moveTo(W * 0.72, H * 0.5); g.lineTo(W * 0.92, H * 0.24); g.lineTo(W * 0.92, H * 0.76); g.fill();
  g.fillStyle = '#fff'; g.beginPath(); g.arc(W * 0.28, H * 0.44, H * 0.07, 0, 6.3); g.fill(); g.fillStyle = '#0b1b2b'; g.beginPath(); g.arc(W * 0.275, H * 0.44, H * 0.035, 0, 6.3); g.fill();
  g.strokeStyle = '#1d5d99'; g.lineWidth = H * 0.02; g.beginPath(); g.arc(W * 0.4, H * 0.5, H * 0.2, -0.9, 0.9); g.stroke();
}

// a fixed glowing point in the sky (does not turn with the stars): additive sprite
export function skyPoint(c, pos, o = {}) {
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex(), color: o.color ?? 0xfff2c8, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }));
  s.position.set(...pos); s.scale.setScalar(o.size ?? 120); s.renderOrder = 6; c.add(s);
  c.on((t) => { const k = 0.82 + 0.18 * Math.sin(t * (o.rate ?? 3.1)); s.material.opacity = k; });
  return s;
}

// ---- small industrial props
export function ironStack(c, x, z, yaw = 0) { for (let k = 0; k < 10; k++) { const m = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.3, 0.5), M2.ironL()); m.position.set(x, height(x, z) + 0.15 + Math.floor(k / 4) * 0.32, z + ((k % 4) - 1.5) * 0.55); m.rotation.y = yaw; m.castShadow = true; c.add(m); c.own(m.geometry); } }
export function coalPile(c, x, z, s = 1) { const r = mulberry32(8), mat = std('coal', { color: 0x18181b, roughness: 0.9 }); for (let k = 0; k < 90; k++) { const a = r() * 6.28, d = Math.sqrt(r()) * 1.6 * s, g = new THREE.IcosahedronGeometry(0.16 + r() * 0.16, 0), m = new THREE.Mesh(g, mat); m.position.set(x + Math.cos(a) * d, height(x, z) + 0.12 + (1.6 * s - d) * 0.28, z + Math.sin(a) * d); m.rotation.set(r() * 6, r() * 6, 0); m.castShadow = true; c.own(g); c.add(m); } }
export function steamEngine(c, x, z, yaw = 0, o = {}) {
  const g = new THREE.Group(), y = height(x, z);
  const boiler = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.9, 3.2, 16), M2.iron()); boiler.rotation.z = Math.PI / 2; boiler.position.y = 1.5; g.add(boiler);
  const stack = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.34, 1.6, 10), M2.iron()); stack.position.set(-1.3, 2.9, 0); g.add(stack);
  const fly = new THREE.Mesh(new THREE.TorusGeometry(0.95, 0.09, 8, 30), M2.ironL()); fly.position.set(1.9, 1.3, 0.9); g.add(fly);
  const spokes = []; for (let k = 0; k < 6; k++) { const s = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.08, 0.08), M2.ironL()); s.rotation.z = k * Math.PI / 6; fly.add(s); }
  const rod = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.1, 0.1), M2.ironL()); rod.position.set(1.0, 1.3, 0.9); g.add(rod);
  const base = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.4, 1.6), M2.brickD()); base.position.y = 0.3; g.add(base);
  g.traverse(m => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } });
  g.position.set(x, y, z); g.rotation.y = yaw; c.add(g);
  const run = o.run ?? (() => 1); c.on((t) => { fly.rotation.z = -t * 6 * run(t); rod.position.x = 1.0 + 0.25 * Math.cos(t * 6 * run(t)); });
  const top = new THREE.Vector3(-1.3, 3.8, 0).applyAxisAngle(Y, yaw); smoke(c, x + top.x, y + top.y, z + top.z, { n: 16, size: 1.8, rise: 10, life: 3.0, wind: [1.2, 0.5], color: 0xe9e9ee, opacity: 0.85, seed: 3, k: (t) => run(t) });
  return g;
}
export function ribbon(c, a, b, o = {}) { const L = Math.hypot(b[0] - a[0], b[2] - a[2]), g = new THREE.PlaneGeometry(L, 0.35), m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ color: 0xd61f2f, side: THREE.DoubleSide, roughness: 0.6 })); m.position.set((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2); m.rotation.y = Math.atan2(b[0] - a[0], b[2] - a[2]) - Math.PI / 2; c.own(g); c.add(m); const cut = o.cutAt ?? 1e9; c.on((t) => { m.visible = t < cut; }); return m; }
export function lightbulb(c, x, y, z, onAt = 1) { const m = new THREE.Mesh(new THREE.SphereGeometry(0.12, 14, 10), new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffd27a, emissiveIntensity: 0 })); m.position.set(x, y, z); c.add(m); c.own(m.geometry); const L = new THREE.PointLight(0xffd8a0, 0, 14, 1.8); L.position.set(x, y, z); c.add(L); c.on((t) => { const k = clamp((t - onAt) / 0.25, 0, 1); m.material.emissiveIntensity = 3 * k; L.intensity = 10 * k; }); return m; }
