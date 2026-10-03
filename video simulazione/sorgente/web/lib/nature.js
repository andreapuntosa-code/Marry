// Vegetation & rocks: procedural species with 3 LODs, soft spherical foliage normals,
// baked AO in vertex colours, per-instance tint, wind sway, budgeted placement.
import * as THREE from 'three';
import { mergeGeometries, mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';
import { Simplex, mulberry32, smoothstep, clamp } from './noise.js';
import { height, slopeAt, isWater, distToRiver, riverWidth, setForestFn } from './terrain.js';
import { vertexLit, LIGHT } from './vlit.js';

const FN = new Simplex(2024);
export const WIND = { value: 0 };

function setColors(g, fn) {
  const p = g.attributes.position, c = new Float32Array(p.count * 3), col = new THREE.Color();
  for (let i = 0; i < p.count; i++) { fn(p.getX(i), p.getY(i), p.getZ(i), col, i); c[i * 3] = col.r; c[i * 3 + 1] = col.g; c[i * 3 + 2] = col.b; }
  g.setAttribute('color', new THREE.BufferAttribute(c, 3));
  return g;
}
function displace(g, amt, seed) {
  const p = g.attributes.position, n = new Simplex(seed);
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    const k = 1 + amt * n.noise(x * 3.1 + seed, z * 3.1 + y * 2.3);
    p.setXYZ(i, x * k, y * k, z * k);
  }
  return g;
}
// soft volumetric normals: blend true normal with direction from centre
function sphericalNormals(g, cx, cy, cz, k = 0.75) {
  g.computeVertexNormals();
  const p = g.attributes.position, n = g.attributes.normal, v = new THREE.Vector3(), w = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    v.set(p.getX(i) - cx, (p.getY(i) - cy) * 0.8, p.getZ(i) - cz).normalize();
    w.set(n.getX(i), n.getY(i), n.getZ(i)).lerp(v, k).normalize();
    n.setXYZ(i, w.x, w.y, w.z);
  }
  return g;
}
function trunk(h, r0, r1, seg, colHex, ao = true) {
  let g = new THREE.CylinderGeometry(r1, r0, h, seg, 3, true);
  g.translate(0, h / 2, 0);
  g = g.toNonIndexed();
  const c0 = new THREE.Color(colHex);
  return setColors(g, (x, y, z, c) => c.copy(c0).multiplyScalar(ao ? 0.55 + 0.55 * Math.min(1, y / h + 0.2) : 1));
}

// --------------------------------------------------------------- leaf cards
const LEAF_TEX = {};
export function leafTexture(kind = 'oak') {
  if (LEAF_TEX[kind]) return LEAF_TEX[kind];
  const S = 256, cv = document.createElement('canvas'); cv.width = cv.height = S;
  const g = cv.getContext('2d');
  const r = mulberry32(kind.length * 17 + 3);
  const pal = { oak: [[44, 74, 31], [76, 116, 50], [134, 162, 79]], birch: [[86, 120, 47], [134, 165, 72], [184, 201, 106]],
                fruit: [[47, 81, 34], [79, 122, 53], [127, 159, 76]], autumn: [[110, 47, 18], [179, 90, 34], [224, 160, 64]],
                bush: [[42, 69, 32], [70, 105, 46], [111, 143, 67]] }[kind] || [[44, 74, 31], [76, 116, 50], [134, 162, 79]];
  // twigs
  g.strokeStyle = 'rgba(70,50,30,0.9)'; g.lineWidth = 2;
  for (let k = 0; k < 6; k++) { g.beginPath(); g.moveTo(S / 2, S * 0.95); g.quadraticCurveTo(S * (0.2 + 0.6 * r()), S * 0.6, S * (0.1 + 0.8 * r()), S * (0.15 + 0.4 * r())); g.stroke(); }
  for (let i = 0; i < 230; i++) {
    const a = r() * Math.PI * 2, rad = Math.sqrt(r()) * S * 0.44;
    const x = S / 2 + Math.cos(a) * rad, y = S * 0.48 + Math.sin(a) * rad * 0.9;
    const L = S * (0.05 + 0.04 * r()), Wd = L * (0.42 + 0.2 * r());
    const shade = r();
    const c0 = pal[0], c1 = pal[1], c2 = pal[2];
    const mix = (u, v, t) => Math.round(u + (v - u) * t);
    const t1 = Math.min(1, shade * 1.4), t2 = Math.max(0, shade - 0.65) * 2.6;
    const cr = mix(mix(c0[0], c1[0], t1), c2[0], t2), cg = mix(mix(c0[1], c1[1], t1), c2[1], t2), cb = mix(mix(c0[2], c1[2], t1), c2[2], t2);
    g.save(); g.translate(x, y); g.rotate(r() * Math.PI * 2);
    g.fillStyle = `rgb(${cr},${cg},${cb})`;
    g.beginPath(); g.ellipse(0, 0, L, Wd, 0, 0, Math.PI * 2); g.fill();
    g.strokeStyle = `rgba(${cr * 0.6 | 0},${cg * 0.6 | 0},${cb * 0.6 | 0},0.5)`; g.lineWidth = 1; g.beginPath(); g.moveTo(-L, 0); g.lineTo(L, 0); g.stroke();
    g.restore();
  }
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 1; t.generateMipmaps = true;
  LEAF_TEX[kind] = t;
  return t;
}

// canopy made of crossed leaf cards distributed in an ellipsoid; spherical normals; AO in colours
export function cardCanopy(seed, clusters, cardsPer, cardSize) {
  const r = mulberry32(seed), V = [], N = [], UV = [], CO = [];
  const v = new THREE.Vector3(), a = new THREE.Vector3(), b = new THREE.Vector3(), nrm = new THREE.Vector3();
  for (const cl of clusters) {
    const [cx, cy, cz, R, sy] = cl;
    for (let k = 0; k < cardsPer; k++) {
      // point biased to the surface of the ellipsoid
      let px, py, pz;
      do { px = r() * 2 - 1; py = r() * 2 - 1; pz = r() * 2 - 1; } while (px * px + py * py + pz * pz > 1);
      const len = Math.hypot(px, py, pz) || 1, rr = Math.pow(len, 0.35);
      px = px / len * rr * R; py = py / len * rr * R * sy; pz = pz / len * rr * R;
      const c = new THREE.Vector3(cx + px, cy + py, cz + pz);
      nrm.set(px, py / Math.max(sy, 0.3), pz).normalize();
      // random tangent frame roughly facing outward
      const out = nrm.clone().add(new THREE.Vector3(r() - 0.5, r() - 0.5, r() - 0.5).multiplyScalar(1.2)).normalize();
      a.set(r() - 0.5, r() - 0.5, r() - 0.5).cross(out).normalize();
      b.copy(out).cross(a).normalize();
      const s = cardSize * (0.75 + 0.5 * r()) * R;
      const corners = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([x, y]) => c.clone().addScaledVector(a, x * s * 0.5).addScaledVector(b, y * s * 0.5));
      const uvs = [[0, 0], [1, 0], [1, 1], [0, 1]];
      const ao = 0.55 + 0.45 * rr * (0.75 + 0.25 * (py / (R * sy) + 1) / 2);
      for (const i of [0, 1, 2, 0, 2, 3]) {
        V.push(corners[i].x, corners[i].y, corners[i].z);
        const sn = new THREE.Vector3(corners[i].x - cx, (corners[i].y - cy) / Math.max(sy, 0.3), corners[i].z - cz).normalize().lerp(new THREE.Vector3(0, 1, 0), 0.25).normalize();
        N.push(sn.x, sn.y, sn.z); UV.push(uvs[i][0], uvs[i][1]); CO.push(ao, ao, ao);
      }
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(V, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(UV, 2));
  g.setAttribute('color', new THREE.Float32BufferAttribute(CO, 3));
  g.computeBoundingSphere();
  return g;
}

// --------------------------------------------------------------- broadleaf (oak / birch / autumn / bush)
const LEAF = {
  oak: [0x2c4a1f, 0x4c7432, 0x86a24f], birch: [0x56782f, 0x86a548, 0xb8c96a],
  autumn: [0x6e2f12, 0xb35a22, 0xe0a040], bush: [0x2a4520, 0x46692e, 0x6f8f43], fruit: [0x2f5122, 0x4f7a35, 0x7f9f4c],
};
export function broadleaf(seed, lod, kind = 'oak') {
  const r = mulberry32(seed), parts = [];
  const [cd, cm, cl] = LEAF[kind].map(h => new THREE.Color(h));
  const bush = kind === 'bush', birch = kind === 'birch';
  const tH = bush ? 0.08 : birch ? 0.55 : 0.42;
  if (!bush) {
    const tg = trunk(tH + 0.12, birch ? 0.022 : 0.045, birch ? 0.014 : 0.028, lod === 2 ? 4 : 6, birch ? 0xe6e1d6 : 0x4e3420);
    if (birch) setColors(tg, (x, y, z, c) => c.set((Math.sin(y * 90 + seed) > 0.75) ? 0x2a2420 : 0xe8e3d8));
    parts.push(tg);
    if (lod === 0 && !birch) { // two branches
      for (let b = 0; b < 2; b++) {
        const br = trunk(0.22, 0.016, 0.01, 4, 0x4e3420);
        br.rotateZ((b ? 1 : -1) * (0.6 + 0.3 * r())); br.rotateY(r() * 6.28); br.translate(0, tH - 0.05, 0);
        parts.push(br);
      }
    }
  }
  const crownY = bush ? 0.22 : tH + 0.2;
  const nb = lod === 0 ? (bush ? 3 : 5) : lod === 1 ? (bush ? 2 : 3) : 1;
  const det = lod === 0 ? 1 : 0;
  for (let k = 0; k < nb; k++) {
    const rad = (bush ? 0.2 : 0.23) * (k === 0 ? 1.05 : 0.6 + 0.3 * r()) * (lod === 2 ? 1.25 : 1);
    let b = new THREE.IcosahedronGeometry(rad, det);
    b = mergeVertices(b.deleteAttribute('normal').deleteAttribute('uv'));
    displace(b, lod === 0 ? 0.28 : 0.18, seed * 13 + k);
    const a = r() * 6.283, dd = k === 0 ? 0 : (0.12 + 0.1 * r()) * (bush ? 0.8 : 1);
    const cy = crownY + (k === 0 ? 0.06 : (r() - 0.35) * 0.18);
    b.scale(1, birch ? 1.3 : 0.86, 1);
    b.translate(Math.cos(a) * dd, cy, Math.sin(a) * dd);
    sphericalNormals(b, 0, crownY + 0.05, 0, 0.7);
    b = b.toNonIndexed();
    const tint = 0.9 + 0.2 * r();
    setColors(b, (x, y, z, c) => {
      const up = clamp((y - (crownY - 0.25)) / 0.5);
      const out = clamp(Math.hypot(x, z) / 0.3);
      c.copy(cd).lerp(cm, up * 0.8 + out * 0.3).lerp(cl, Math.max(0, up - 0.55) * 1.5);
      c.multiplyScalar(tint * (0.62 + 0.45 * Math.max(up, out * 0.8)));      // baked AO: darker inside/bottom
    });
    parts.push(b);
  }
  const g = mergeGeometries(parts.map(p => { if (!p.attributes.normal) p.computeVertexNormals(); for (const k of Object.keys(p.attributes)) if (!['position', 'normal', 'color'].includes(k)) p.deleteAttribute(k); return p; }));
  g.computeBoundingSphere();
  return g;
}

// card tree: returns {wood, leaves, leafKind}
export function cardTree(seed, lod, kind = 'oak') {
  const r = mulberry32(seed + 101);
  const birch = kind === 'birch', bush = kind === 'bush';
  const parts = [];
  const tH = bush ? 0.05 : birch ? 0.58 : 0.44;
  if (!bush) {
    const tg = trunk(tH + 0.1, birch ? 0.022 : 0.046, birch ? 0.013 : 0.026, 7, birch ? 0xe6e1d6 : 0x4e3420);
    if (birch) setColors(tg, (x, y, z, c) => c.set((Math.sin(y * 90 + seed) > 0.75) ? 0x2a2420 : 0xc9c2b4));
    parts.push(tg);
    const nbr = lod === 0 ? 5 : 3;
    for (let b = 0; b < nbr; b++) {
      const br = trunk(0.2 + 0.08 * r(), 0.017, 0.008, 4, birch ? 0xd8d2c4 : 0x4e3420, false);
      br.rotateZ(0.55 + 0.35 * r()); br.rotateY(b / nbr * 6.28 + r()); br.translate(0, tH - 0.06 + 0.1 * r(), 0);
      parts.push(br);
    }
  }
  const wood = parts.length ? mergeGeometries(parts.map(p => { if (!p.attributes.normal) p.computeVertexNormals(); for (const k of Object.keys(p.attributes)) if (!['position', 'normal', 'color'].includes(k)) p.deleteAttribute(k); return p; })) : null;
  const cy = bush ? 0.2 : tH + 0.17;
  const clusters = [];
  const nc = bush ? 2 : (lod === 0 ? 4 : 2);
  for (let k = 0; k < nc; k++) {
    const a = r() * 6.283, d = k === 0 ? 0 : 0.11 + 0.08 * r();
    clusters.push([Math.cos(a) * d, cy + (k === 0 ? 0.04 : (r() - 0.3) * 0.16), Math.sin(a) * d, (bush ? 0.2 : 0.21) * (k === 0 ? 1 : 0.7 + 0.25 * r()), birch ? 1.35 : 0.85]);
  }
  const leaves = cardCanopy(seed, clusters, lod === 0 ? (bush ? 12 : 22) : 16, bush ? 1.0 : 0.9);
  const proxies = clusters.map(([x, y, z, R, sy]) => { const g = new THREE.IcosahedronGeometry(R * 0.9, 0); g.scale(1, sy, 1); g.translate(x, y, z); g.deleteAttribute('uv'); return g; });
  const proxy = mergeGeometries(proxies);
  return { wood, leaves, leafKind: kind, proxy };
}

// --------------------------------------------------------------- pine
export function pine(seed, lod) {
  const r = mulberry32(seed), parts = [];
  parts.push(trunk(0.3, 0.032, 0.02, lod === 2 ? 4 : 6, 0x4a3221));
  const tiers = lod === 0 ? 5 : lod === 1 ? 2 : 1;
  const dark = new THREE.Color(0x1b3a22), mid = new THREE.Color(0x2f5a30), tip = new THREE.Color(0x4f7d3c);
  for (let k = 0; k < tiers; k++) {
    const f = k / tiers;
    const y0 = 0.14 + f * 0.7, rr = (0.27 - f * 0.2) * (lod === 2 ? 1.1 : 1);
    const hh = (lod === 2 ? 0.86 : lod === 1 ? 0.5 : 0.3);
    let cone = new THREE.ConeGeometry(rr, hh, lod === 0 ? 10 : 7, lod === 0 ? 2 : 1, true);
    cone.translate(0, y0 + hh / 2, 0);
    cone = mergeVertices(cone.deleteAttribute('normal').deleteAttribute('uv'));
    if (lod === 0) {
      const p = cone.attributes.position;
      for (let i = 0; i < p.count; i++) {
        const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
        const rad = Math.hypot(x, z);
        if (rad > rr * 0.6) { const j = 1 + 0.18 * Math.sin(Math.atan2(z, x) * 5 + seed + k); p.setXYZ(i, x * j, y - 0.04 * (rad / rr), z * j); }
      }
    }
    sphericalNormals(cone, 0, y0 + hh * 0.3, 0, 0.55);
    cone = cone.toNonIndexed();
    const tint = 0.9 + 0.2 * r();
    setColors(cone, (x, y, z, c) => {
      const fy = clamp((y - y0) / hh), rad = Math.hypot(x, z) / rr;
      c.copy(dark).lerp(mid, fy * 0.7 + rad * 0.3).lerp(tip, Math.max(0, fy - 0.75) * 2.0);
      c.multiplyScalar(tint * (0.6 + 0.5 * rad));
    });
    parts.push(cone);
  }
  const g = mergeGeometries(parts.map(p => { if (!p.attributes.normal) p.computeVertexNormals(); for (const k of Object.keys(p.attributes)) if (!['position', 'normal', 'color'].includes(k)) p.deleteAttribute(k); return p; }));
  g.computeBoundingSphere();
  return g;
}

// --------------------------------------------------------------- rocks, grass, flowers
export function rock(seed, lod = 0) {
  let g = new THREE.IcosahedronGeometry(0.5, lod ? 0 : 1);
  g = mergeVertices(g.deleteAttribute('normal').deleteAttribute('uv'));
  displace(g, 0.38, seed);
  g.scale(1, 0.6, 0.82);
  g = g.toNonIndexed();
  g.computeVertexNormals();
  const r = mulberry32(seed + 5);
  const base = new THREE.Color().setHSL(0.07 + r() * 0.05, 0.05 + r() * 0.05, 0.36 + r() * 0.1);
  setColors(g, (x, y, z, c) => { c.copy(base).multiplyScalar(0.62 + 0.6 * (y + 0.3)); if (y > 0.12 && r() < 0.35) c.lerp(new THREE.Color(0x56703a), 0.45); });
  g.computeBoundingSphere();
  return g;
}

export function grassTuft(seed) {
  const r = mulberry32(seed), V = [], Cc = [];
  const base = new THREE.Color(0x2f4a1e);
  const blades = 7;
  for (let k = 0; k < blades; k++) {
    const a = r() * 6.283, d = Math.sqrt(r()) * 0.16, h = 0.12 + r() * 0.22, w = 0.016 + r() * 0.012;
    const bx = Math.cos(a) * d, bz = Math.sin(a) * d, la = r() * 6.283, lean = 0.05 + r() * 0.16;
    const px = Math.cos(la + 1.57) * w, pz = Math.sin(la + 1.57) * w;
    const mx = bx + Math.cos(la) * lean * 0.45, mz = bz + Math.sin(la) * lean * 0.45;
    const tx = bx + Math.cos(la) * lean, tz = bz + Math.sin(la) * lean;
    // two triangles per blade (curved)
    V.push(bx - px, 0, bz - pz, bx + px, 0, bz + pz, mx + px * 0.6, h * 0.55, mz + pz * 0.6);
    V.push(bx - px, 0, bz - pz, mx + px * 0.6, h * 0.55, mz + pz * 0.6, tx, h, tz);
    const tc = new THREE.Color().setHSL(0.21 + r() * 0.06, 0.45 + r() * 0.15, 0.3 + r() * 0.14);
    const mc = base.clone().lerp(tc, 0.6);
    Cc.push(base.r, base.g, base.b, base.r, base.g, base.b, mc.r, mc.g, mc.b, base.r, base.g, base.b, mc.r, mc.g, mc.b, tc.r, tc.g, tc.b);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(V, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(Cc, 3));
  const n = new Float32Array(V.length); for (let i = 0; i < n.length; i += 3) { n[i] = 0; n[i + 1] = 1; n[i + 2] = 0; }
  g.setAttribute('normal', new THREE.BufferAttribute(n, 3));
  return g;
}

export function flower(colorHex, seed = 1) {
  const r = mulberry32(seed), V = [], Cc = [], c = new THREE.Color(colorHex), s = new THREE.Color(0x3f6a2a);
  const h = 0.22 + r() * 0.12;
  V.push(-0.01, 0, 0, 0.01, 0, 0, 0, h, 0); Cc.push(s.r, s.g, s.b, s.r, s.g, s.b, s.r, s.g, s.b);
  for (let k = 0; k < 6; k++) {
    const a = k * Math.PI / 3, b = a + 0.7, R = 0.055;
    V.push(0, h, 0, Math.cos(a) * R, h + 0.01, Math.sin(a) * R, Math.cos(b) * R, h + 0.01, Math.sin(b) * R);
    Cc.push(1, 0.9, 0.35, c.r, c.g, c.b, c.r, c.g, c.b);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(V, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(Cc, 3));
  const n = new Float32Array(V.length); for (let i = 0; i < n.length; i += 3) n[i + 1] = 1;
  g.setAttribute('normal', new THREE.BufferAttribute(n, 3));
  return g;
}

// --------------------------------------------------------------- materials
const matCache = {};
export function leafMaterial(kind = 'oak') {
  const key = 'leaf_' + kind;
  if (matCache[key]) return matCache[key];
  const m = vertexLit({ map: leafTexture(kind), alphaTest: 0.42, wind: 0.02, side: THREE.DoubleSide, wrap: 1.6 });
  m.userData.castsShadow = false;
  matCache[key] = m;
  return m;
}

export function shadowProxyMaterial() {
  if (matCache.proxy) return matCache.proxy;
  const m = new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: false });
  m.userData.proxy = true;
  matCache.proxy = m;
  return m;
}

export function vegMaterial(kind = 'tree') {
  if (matCache[kind]) return matCache[kind];
  const grass = kind === 'grass';
  const m = vertexLit({ wind: grass ? 0.5 : kind === 'tree' ? 0.022 : 0.0, grass, side: grass ? THREE.DoubleSide : THREE.FrontSide, wrap: grass ? 2.0 : 1.3 });
  matCache[kind] = m;
  return m;
}

// --------------------------------------------------------------- impostors (billboards baked from the 3D trees)
export function bakeImpostor(renderer, entry, w = 256, h = 320) {
  const scene = new THREE.Scene();
  const meshes = [];
  const parts = entry.leaves ? [[entry.wood, vegMaterial('tree')], [entry.leaves, leafMaterial(entry.leafKind)]] : [[entry, vegMaterial('tree')]];
  for (const [geo, mat] of parts) { if (!geo) continue; const m = new THREE.Mesh(geo, mat); scene.add(m); meshes.push(m); }
  const saved = { d: LIGHT.uSunDir.value.clone(), s: LIGHT.uSunCol.value.clone(), k: LIGHT.uSkyCol.value.clone(), g: LIGHT.uGndCol.value.clone() };
  LIGHT.uSunDir.value.set(0.45, 0.75, 0.6).normalize(); LIGHT.uSunCol.value.setRGB(1.25, 1.2, 1.1); LIGHT.uSkyCol.value.setRGB(0.55, 0.62, 0.7); LIGHT.uGndCol.value.setRGB(0.28, 0.26, 0.2);
  const cam = new THREE.OrthographicCamera(-0.5, 0.5, 1.1, -0.15, -5, 5);
  cam.position.set(0, 0, 2); cam.lookAt(0, 0, 0);
  const rt = new THREE.WebGLRenderTarget(w, h, { samples: 0 });
  rt.texture.colorSpace = THREE.SRGBColorSpace;
  const prevTM = renderer.toneMapping, prevClear = new THREE.Color(); renderer.getClearColor(prevClear);
  const prevA = renderer.getClearAlpha();
  renderer.setRenderTarget(rt); renderer.setClearColor(0x000000, 0); renderer.toneMapping = THREE.NoToneMapping;
  renderer.clear(); renderer.render(scene, cam);
  // read back to a canvas texture (so it survives render target reuse) with alpha cleanup
  const buf = new Uint8Array(w * h * 4);
  renderer.readRenderTargetPixels(rt, 0, 0, w, h, buf);
  renderer.setRenderTarget(null); renderer.setClearColor(prevClear, prevA); renderer.toneMapping = prevTM;
  rt.dispose();
  LIGHT.uSunDir.value.copy(saved.d); LIGHT.uSunCol.value.copy(saved.s); LIGHT.uSkyCol.value.copy(saved.k); LIGHT.uGndCol.value.copy(saved.g);
  const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
  const g2 = cv.getContext('2d'); const img = g2.createImageData(w, h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const si = ((h - 1 - y) * w + x) * 4, di = (y * w + x) * 4;
    img.data[di] = buf[si]; img.data[di + 1] = buf[si + 1]; img.data[di + 2] = buf[si + 2]; img.data[di + 3] = buf[si + 3];
  }
  g2.putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; tex.generateMipmaps = true;
  return tex;
}

export const IMPOSTOR_LIGHT = { value: new THREE.Color(1, 1, 1) };
export function impostorMaterial(tex) {
  const m = new THREE.MeshBasicMaterial({ map: tex, alphaTest: 0.5, side: THREE.DoubleSide, fog: true });
  m.onBeforeCompile = (sh) => {
    sh.uniforms.uLight = IMPOSTOR_LIGHT;
    sh.vertexShader = sh.vertexShader.replace('#include <project_vertex>', `
      vec4 ctr = modelMatrix * instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0);
      float sc = length(instanceMatrix[0].xyz);
      vec3 vd = ctr.xyz - cameraPosition; vd.y = 0.0; vd = normalize(vd + vec3(1e-5));
      vec3 rgt = normalize(cross(vec3(0.0, 1.0, 0.0), vd));
      vec3 wp = ctr.xyz + rgt * position.x * sc + vec3(0.0, 1.0, 0.0) * position.y * sc;
      vec4 mvPosition = viewMatrix * vec4(wp, 1.0);
      gl_Position = projectionMatrix * mvPosition;`);
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform vec3 uLight;')
      .replace('#include <map_fragment>', '#include <map_fragment>\n diffuseColor.rgb *= uLight;');
  };
  return m;
}
let QUAD = null;
function impostorQuad() {
  if (QUAD) return QUAD;
  QUAD = new THREE.PlaneGeometry(1, 1.25);
  QUAD.translate(0, 1.25 / 2 - 0.15, 0);
  return QUAD;
}

// --------------------------------------------------------------- forest density
export function forestDensity(x, z) {
  const n = FN.fbm(x / 520, z / 520, 4);
  let d = smoothstep(0.0, 0.3, n);
  d = Math.max(d, smoothstep(300, 90, Math.hypot(x - 450, z - 560)) * 0.95);   // wolves' forest NE of the meadow
  d = Math.max(d, smoothstep(520, 220, Math.hypot(x + 620, z - 220)) * 0.85);  // western woods
  d *= smoothstep(170, 430, Math.hypot(x - 20, z + 40));                        // open valley around Prima
  d *= smoothstep(60, 170, Math.hypot(x - 260, z - 330));                       // the meadow stays open
  const mp = Math.hypot(x - 820, z + 760); d *= smoothstep(520, 700, mp);       // message plain is open
  return d;
}
setForestFn((x, z) => forestDensity(x, z) * (1 - smoothstep(250, 600, 0)));

// --------------------------------------------------------------- the vegetation system
export class Vegetation {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    scene.add(this.group);
    const mk = (fn, seeds, lod, kind) => seeds.map(s => fn(s, lod, kind));
    const card = (seeds, lod, kind) => seeds.map(s => cardTree(s, lod, kind));
    this.geos = {
      oak0: card([1, 2, 3], 0, 'oak'), oak1: card([11], 1, 'oak'), oak2: mk(broadleaf, [21], 2, 'oak'),
      birch0: card([4, 5], 0, 'birch'), birch1: card([14], 1, 'birch'),
      fruit0: card([7, 8], 0, 'fruit'),
      bush0: card([6, 9], 0, 'bush'), bush1: mk(broadleaf, [16], 1, 'bush'),
      pine0: [1, 2, 3].map(s => pine(s, 0)), pine1: [pine(11, 1)], pine2: [pine(21, 2)],
      rock0: [1, 2, 3, 4].map(s => rock(s, 0)), rock1: [rock(9, 1)],
      grass: [1, 2, 3, 4].map(s => grassTuft(s)),
      flower: [0xf5f5f0, 0xf4cf3a, 0xd9466f, 0x8a78ff, 0xff8a3a].map((c, i) => flower(c, i + 1)),
    };
  }
  bake(renderer) {
    this.imp = {};
    for (const k of ['oak0', 'birch0', 'pine0', 'bush0', 'fruit0']) this.imp[k] = this.geos[k].map(e => impostorMaterial(bakeImpostor(renderer, e)));
  }
  clear() { for (const c of [...this.group.children]) this.group.remove(c); }

  // focus: {cx, cz} ; opts: lod radii, exclude(x,z), budget
  build(focus, opts = {}) {
    this.clear();
    const { cx, cz } = focus;
    const r0 = opts.r0 ?? 60, r1 = opts.r1 ?? 300, rFar = opts.rFar ?? 1800, grassR = opts.grassR ?? 0;
    const gcx = opts.grassCenter ? opts.grassCenter[0] : cx, gcz = opts.grassCenter ? opts.grassCenter[1] : cz;
    const exclude = opts.exclude || (() => false);
    const extra = opts.extraTrees || [];
    // view culling: list of cameras {x,z,yaw,half}; keep near ring always
    const views = opts.views || null;
    const inView = (x, z, d) => {
      if (!views || d < (opts.keepR ?? 45)) return true;
      for (const v of views) {
        const ax = x - v.x, az = z - v.z, al = Math.hypot(ax, az);
        if (al < 30) return true;
        const ang = Math.atan2(ax, az) - v.yaw;
        const da = Math.abs(Math.atan2(Math.sin(ang), Math.cos(ang)));
        if (da < v.half + 18 / Math.max(al, 1)) return true;
      }
      return false;
    };
    const rImp = opts.rImp ?? 160;
    const buckets = {}, colors = {};
    const push = (k, m, c) => { (buckets[k] = buckets[k] || []).push(m); (colors[k] = colors[k] || []).push(c); };
    const mtx = new THREE.Matrix4(), q = new THREE.Quaternion(), sv = new THREE.Vector3(), pv = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0);
    const col = new THREE.Color();
    const place = (key, x, z, scale, yaw, sink, sy = 1, tint = 1, hue = 0) => {
      pv.set(x, height(x, z) - sink * scale, z);
      q.setFromAxisAngle(up, yaw);
      sv.set(scale, scale * sy, scale);
      push(key, mtx.compose(pv, q, sv).clone(), col.setRGB(tint * (1 + hue), tint, tint * (1 - hue)).clone());
    };
    // ---- trees
    const step = opts.treeStep ?? 7;
    const R = rFar;
    for (let gi = Math.floor((cx - R) / step); gi <= Math.ceil((cx + R) / step); gi++) {
      for (let gj = Math.floor((cz - R) / step); gj <= Math.ceil((cz + R) / step); gj++) {
        const rr = mulberry32((gi * 73856093) ^ (gj * 19349663) ^ 0x5bd1e995);
        const x = (gi + rr()) * step, z = (gj + rr()) * step;
        const d = Math.hypot(x - cx, z - cz);
        if (d > R) continue;
        const dCam = views ? Math.min(...views.map(v => Math.hypot(x - v.x, z - v.z))) : d;
        if (!inView(x, z, dCam)) continue;
        let dens = forestDensity(x, z) * 0.92 + 0.012;
        if (d > r1) dens *= Math.pow(r1 / d, 0.9) * 0.6;
        if (rr() > dens) continue;
        if (isWater(x, z) || exclude(x, z)) continue;
        const h = height(x, z);
        if (h > 290 || slopeAt(x, z, 3) > 0.85) continue;
        const pineZone = h > 110 || FN.noise(x / 340, z / 340) > 0.3;
        const kind = pineZone ? 'pine' : (rr() < 0.15 ? 'birch' : 'oak');
        const sc = kind === 'pine' ? 12 + 10 * rr() : kind === 'birch' ? 9 + 4 * rr() : 9 + 7 * rr();
        const dd = views ? dCam : d;
        const lod = dd < r0 ? 0 : (this.imp && dd > rImp) ? 3 : dd < r1 ? 1 : 2;
        const tint = 0.86 + 0.24 * rr(), hue = (rr() - 0.5) * 0.08;
        let key;
        const vv = Math.floor(rr() * (kind === 'birch' ? 2 : 3));
        if (lod === 0) key = kind + '0' + '_' + vv;
        else if (lod === 3) key = 'imp' + kind + '0' + '_' + vv;
        else if (lod === 1) key = (kind === 'birch' ? 'birch1' : kind + '1') + '_0';
        else key = (kind === 'pine' ? 'pine2' : 'oak2') + '_0';
        place(key, x, z, sc, rr() * 6.283, 0.04, 1, tint, hue);
        if (lod === 0 && rr() < 0.4) place('bush0_' + Math.floor(rr() * 2), x + (rr() - 0.5) * 7, z + (rr() - 0.5) * 7, 1.8 + 2.2 * rr(), rr() * 6.283, 0.15, 1, tint);
        else if (lod === 3 && rr() < 0.25 && dd < rImp * 3) place('impbush0_' + Math.floor(rr() * 2), x + (rr() - 0.5) * 7, z + (rr() - 0.5) * 7, 1.8 + 2.2 * rr(), 0, 0.15, 1, tint);
      }
    }
    for (const t of extra) place(t.key, t.x, t.z, t.s, t.yaw ?? 0, 0.04, 1, t.tint ?? 1);
    // ---- rocks
    const rs = 15, RR = Math.min(r1 * 1.3, 500);
    for (let gi = Math.floor((cx - RR) / rs); gi <= Math.ceil((cx + RR) / rs); gi++)
      for (let gj = Math.floor((cz - RR) / rs); gj <= Math.ceil((cz + RR) / rs); gj++) {
        const rr = mulberry32((gi * 2654435761) ^ (gj * 40503) ^ 99);
        const x = (gi + rr()) * rs, z = (gj + rr()) * rs;
        const sl = slopeAt(x, z, 2);
        const [dr, srv] = distToRiver(x, z);
        const riverside = dr < riverWidth(srv) * 1.8 ? 0.3 : 0;
        if (rr() > 0.05 + sl * 0.7 + riverside) continue;
        if (isWater(x, z) || exclude(x, z)) continue;
        const d = Math.hypot(x - cx, z - cz);
        const dCam = views ? Math.min(...views.map(v => Math.hypot(x - v.x, z - v.z))) : d;
        if (!inView(x, z, dCam)) continue;
        const sc = (0.4 + 2.4 * Math.pow(rr(), 2.6)) * (1 + sl * 3);
        place((d < r0 * 1.5 ? 'rock0_' + Math.floor(rr() * 4) : 'rock1_0'), x, z, sc, rr() * 6.283, 0.28, 0.8 + 0.4 * rr(), 0.9 + 0.2 * rr());
      }
    // ---- grass & flowers (near field only)
    if (grassR > 0) {
      const gs = opts.grassStep ?? 0.55;
      const fl = opts.flowers ?? 0.05;
      for (let gi = Math.floor((gcx - grassR) / gs); gi <= Math.ceil((gcx + grassR) / gs); gi++)
        for (let gj = Math.floor((gcz - grassR) / gs); gj <= Math.ceil((gcz + grassR) / gs); gj++) {
          const rr = mulberry32((gi * 92837111) ^ (gj * 689287499) ^ 5);
          const x = (gi + rr()) * gs, z = (gj + rr()) * gs;
          const d = Math.hypot(x - gcx, z - gcz);
          if (d > grassR || rr() > 1.15 - Math.pow(d / grassR, 1.5)) continue;
          if (opts.grassCone && !opts.grassCone(x, z)) continue;
          if (isWater(x, z) || exclude(x, z)) continue;
          const n = FN.noise(x / 7, z / 7);
          if (n < -0.55) continue;
          if (rr() < fl * (n > 0.15 ? 2.5 : 0.3)) place('flower_' + Math.floor(rr() * 5), x, z, 0.8 + 0.6 * rr(), rr() * 6.283, 0, 1, 1);
          else place('grass_' + Math.floor(rr() * 4), x, z, 0.8 + 0.8 * rr() + Math.max(0, n) * 0.7, rr() * 6.283, 0.01, 1, 0.85 + 0.3 * rr(), (rr() - 0.5) * 0.12);
        }
    }
    // ---- instanced meshes
    let tris = 0;
    for (const [key, mats] of Object.entries(buckets)) {
      const [base, vi] = key.split('_');
      if (base.startsWith('imp')) {
        const kb = base.slice(3);
        const mats2 = this.imp[kb]; const mat = mats2[parseInt(vi)] || mats2[0];
        const im = new THREE.InstancedMesh(impostorQuad(), mat, mats.length);
        mats.forEach((m, i) => im.setMatrixAt(i, m));
        im.instanceMatrix.needsUpdate = true; im.frustumCulled = false; im.castShadow = false; im.receiveShadow = false;
        this.group.add(im); tris += mats.length * 2;
        continue;
      }
      const entry = this.geos[base][parseInt(vi)] || this.geos[base][0];
      const kind = base === 'grass' || base === 'flower' ? 'grass' : base.startsWith('rock') ? 'rock' : 'tree';
      const parts = entry.leaves ? [...(entry.wood ? [[entry.wood, vegMaterial('tree')]] : []), [entry.leaves, leafMaterial(entry.leafKind)], [entry.proxy, shadowProxyMaterial()]] : [[entry, vegMaterial(kind)]];
      for (const [geo, mat] of parts) {
        if (!geo) continue;
        const im = new THREE.InstancedMesh(geo, mat, mats.length);
        mats.forEach((m, i) => { im.setMatrixAt(i, m); im.setColorAt(i, colors[key][i]); });
        im.instanceMatrix.needsUpdate = true;
        if (im.instanceColor) im.instanceColor.needsUpdate = true;
        im.castShadow = kind !== 'grass' && !base.endsWith('2') && mat.userData.castsShadow !== false;
        im.receiveShadow = false;
        if (mat.userData.proxy) { im.castShadow = true; im.receiveShadow = false; }
        im.receiveShadow = true;
        im.frustumCulled = false;
        this.group.add(im);
        tris += mats.length * geo.attributes.position.count / 3;
      }
    }
    this.tris = tris;
    return tris;
  }
}
