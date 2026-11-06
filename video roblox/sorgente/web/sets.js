// Big, rich sets for the v2 look (reusable): the magic library, the potion shop, and atmosphere helpers
// (warm dust, floating pages, sparkles, light shafts, a magic circle, a glowing open book, a fantasy kingdom).
import { THREE, add, on, glowTex, getScene, rbox, Reflector, W, H } from './kit.js';

const rnd = (seed) => { let s = seed; return () => ((s = (s * 9301 + 49297) % 233280) / 233280); };
const M_ = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: o.r ?? 0.5, metalness: o.m ?? 0, emissive: o.em ?? 0, emissiveIntensity: o.ei ?? 1, transparent: !!o.t, opacity: o.op ?? 1 });
export function blk(w, h, d, mat, x, y, z, o = {}) { const m = new THREE.Mesh(o.sharp ? new THREE.BoxGeometry(w, h, d) : rbox(w, h, d, o.k ?? 0.08), mat); m.position.set(x, y, z); m.castShadow = o.cast ?? true; m.receiveShadow = true; add(m); return m; }
const GOLD = () => M_(0xd8a83a, { m: 0.9, r: 0.28 });

function tex(w, h, draw) { const cv = document.createElement('canvas'); cv.width = w; cv.height = h; draw(cv.getContext('2d'), w, h); const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; }
const checker = (a, b, n = 8) => tex(512, 512, (g) => { for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { g.fillStyle = (i + j) % 2 ? a : b; g.fillRect(i * 512 / n, j * 512 / n, 512 / n, 512 / n); } });

// a glossy floor: a real mirror (Reflector) under a semi-transparent tiled surface
export function glossyFloor(w, d, x, z, o = {}) {
  const mir = new Reflector(new THREE.PlaneGeometry(w, d), { textureWidth: W / 2, textureHeight: H / 2, color: o.tint ?? 0x8a8a8a }); mir.rotation.x = -Math.PI / 2; mir.position.set(x, 0.0, z); add(mir);
  const t = o.map || checker(o.a ?? '#efe2c4', o.b ?? '#8a5a34'); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(w / (o.tile ?? 4), d / (o.tile ?? 4));
  const f = new THREE.Mesh(new THREE.PlaneGeometry(w, d), new THREE.MeshStandardMaterial({ map: t, roughness: 0.15, metalness: 0.0, transparent: true, opacity: o.opacity ?? 0.78 })); f.rotation.x = -Math.PI / 2; f.position.set(x, 0.01, z); f.receiveShadow = true; add(f);
  return f;
}
// warm floating dust (additive points)
export function dust(n, cx, cy, cz, sx, sy, sz, o = {}) {
  const r = rnd(o.seed ?? 3), pos = new Float32Array(n * 3), base = [];
  for (let i = 0; i < n; i++) base.push([cx + (r() - 0.5) * sx, cy + (r() - 0.5) * sy, cz + (r() - 0.5) * sz, r() * 6.28]);
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const m = new THREE.PointsMaterial({ size: o.size ?? 0.09, map: glowTex(), color: o.color ?? 0xffe2a0, transparent: true, opacity: o.opacity ?? 0.9, blending: THREE.AdditiveBlending, depthWrite: false });
  const p = new THREE.Points(g, m); p.frustumCulled = false; add(p);
  on((u) => { base.forEach(([x, y, z, ph], i) => pos.set([x + Math.sin(u * 0.4 + ph) * 0.3, y + ((u * (o.rise ?? 0.08) + ph) % 1) * 0.6, z + Math.cos(u * 0.3 + ph) * 0.3], i * 3)); g.attributes.position.needsUpdate = true; });
  return p;
}
// pages fluttering in the air
export function pages(n, cx, cy, cz, sx, sy, sz, o = {}) {
  const r = rnd(o.seed ?? 7), geo = new THREE.PlaneGeometry(0.32, 0.42), mat = new THREE.MeshStandardMaterial({ color: 0xfffaf0, roughness: 0.8, side: THREE.DoubleSide, emissive: 0x332a18, emissiveIntensity: 0.4 });
  const im = new THREE.InstancedMesh(geo, mat, n); im.frustumCulled = false; add(im);
  const base = []; for (let i = 0; i < n; i++) base.push([cx + (r() - 0.5) * sx, cy + (r() - 0.5) * sy, cz + (r() - 0.5) * sz, r() * 6.28, 0.5 + r()]);
  const M4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), p = new THREE.Vector3(), sc = new THREE.Vector3(1, 1, 1);
  on((u) => { base.forEach(([x, y, z, ph, sp], i) => { p.set(x + Math.sin(u * 0.5 * sp + ph) * 1.2, y + Math.sin(u * 0.7 * sp + ph * 2) * 0.6, z + Math.cos(u * 0.4 * sp + ph) * 1.2); e.set(Math.sin(u * 1.3 + ph) * 1.2, u * 0.8 * sp + ph, Math.sin(u * 2.1 + ph) * 0.8); q.setFromEuler(e); im.setMatrixAt(i, M4.compose(p, q, sc)); }); im.instanceMatrix.needsUpdate = true; });
  return im;
}
// sparkles rising from a point (magic)
export function sparkles(x, y, z, o = {}) {
  const n = o.n ?? 90, r = rnd(o.seed ?? 5), pos = new Float32Array(n * 3), base = [];
  for (let i = 0; i < n; i++) base.push([r() * 6.28, r(), 0.1 + r() * (o.R ?? 0.6), r()]);
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const m = new THREE.PointsMaterial({ size: o.size ?? 0.07, map: glowTex(), color: o.color ?? 0xbfe8ff, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false });
  const p = new THREE.Points(g, m); p.frustumCulled = false; add(p);
  on((u) => { const k = o.amount ? o.amount(u) : 1; m.opacity = k; base.forEach(([a, ph, rad, sp], i) => { const q = (u * (0.35 + sp * 0.4) + ph) % 1; pos.set([x + Math.cos(a + u * 1.5) * rad * (1 - q * 0.5), y + q * (o.h ?? 1.6), z + Math.sin(a + u * 1.5) * rad * (1 - q * 0.5)], i * 3); }); g.attributes.position.needsUpdate = true; });
  return p;
}
// a soft beam of light (additive vertical gradient plane), tilted
export function shaft(x, y, z, w, h, rotZ = 0.3, o = {}) {
  const t = tex(64, 256, (g) => { const gr = g.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, 'rgba(255,240,200,0.9)'); gr.addColorStop(1, 'rgba(255,240,200,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 256); const g2 = g.createLinearGradient(0, 0, 64, 0); g.globalCompositeOperation = 'destination-in'; g2.addColorStop(0, 'rgba(0,0,0,0)'); g2.addColorStop(0.5, 'rgba(0,0,0,1)'); g2.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = g2; g.fillRect(0, 0, 64, 256); });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: t, color: o.color ?? 0xffe9b8, transparent: true, opacity: o.opacity ?? 0.22, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false }));
  m.position.set(x, y, z); m.rotation.z = rotZ; m.rotation.y = o.yaw ?? 0; add(m); return m;
}
// a chandelier: gold rings with glowing bulbs (bloom does the rest)
export function chandelier(x, y, z, s = 1, o = {}) {
  const g = new THREE.Group(); g.position.set(x, y, z); g.scale.setScalar(s); add(g);
  const gold = GOLD(); const bulb = new THREE.MeshBasicMaterial({ color: 0xfff1c8 });
  for (const [r, yy, n] of [[1.6, 0, 16], [1.0, 0.7, 10], [0.5, 1.3, 6]]) { const ring = new THREE.Mesh(new THREE.TorusGeometry(r, 0.05, 8, 48), gold); ring.rotation.x = Math.PI / 2; ring.position.y = yy; g.add(ring);
    for (let i = 0; i < n; i++) { const a = i / n * 6.283; const b = new THREE.Mesh(new THREE.SphereGeometry(0.09, 10, 8), bulb); b.position.set(Math.cos(a) * r, yy + 0.12, Math.sin(a) * r); g.add(b); } }
  const ch = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 6, 6), gold); ch.position.y = 4.3; g.add(ch);
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex(), color: 0xffd890, transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending, depthWrite: false })); halo.scale.setScalar(7); halo.position.y = 0.5; g.add(halo);
  if (o.light !== false) { const L = new THREE.PointLight(0xffd8a0, o.power ?? 40, 26, 1.4); L.position.y = 0.3; g.add(L); }
  return g;
}
// a magic circle on the floor (glowing rings + rotating runes)
export function magicCircle(x, z, R = 1.6, o = {}) {
  const g = new THREE.Group(); g.position.set(x, 0.03, z); add(g);
  const m = new THREE.MeshBasicMaterial({ color: o.color ?? 0x8fe0ff, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
  for (const r of [R, R * 0.82]) { const ring = new THREE.Mesh(new THREE.RingGeometry(r - 0.03, r, 96), m); ring.rotation.x = -Math.PI / 2; g.add(ring); }
  const runes = new THREE.Group(); g.add(runes);
  for (let i = 0; i < 24; i++) { const a = i / 24 * 6.283; const b = new THREE.Mesh(new THREE.PlaneGeometry(0.12, 0.2), m); b.rotation.x = -Math.PI / 2; b.rotation.z = a; b.position.set(Math.cos(a) * R * 0.91, 0.005, Math.sin(a) * R * 0.91); runes.add(b); }
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex(), color: o.color ?? 0x8fe0ff, transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending, depthWrite: false })); glow.scale.set(R * 3, R * 1.2, 1); glow.position.y = 0.3; g.add(glow);
  on((u) => { runes.rotation.y = u * 0.5; const k = o.amount ? o.amount(u) : 1; m.opacity = 0.9 * k; glow.material.opacity = 0.35 * k; });
  return g;
}
// an open book that glows from inside
export function glowBook(parent, o = {}) {
  const g = new THREE.Group(); parent.add(g);
  const cover = M_(o.cover ?? 0x7a1a2a, { r: 0.6 }), pg = M_(0xfff8e8, { em: 0xfff0c0, ei: o.glow ?? 0.45 });
  for (const s of [-1, 1]) { const c = new THREE.Mesh(rbox(0.5, 0.04, 0.68), cover); c.position.set(s * 0.26, 0, 0); c.rotation.z = -s * 0.18; g.add(c); const p = new THREE.Mesh(rbox(0.46, 0.05, 0.62, 0.05), pg); p.position.set(s * 0.25, 0.04, 0); p.rotation.z = -s * 0.18; g.add(p); }
  const L = new THREE.PointLight(0xffe2a0, o.power ?? 1.5, 3, 2); L.position.y = 0.5; g.add(L);
  return g;
}
// ------------------------------------------------------------------ the magic library (a long hall along -z, centre aisle at x = 0)
export function library(o = {}) {
  const S = getScene(); S.background = new THREE.Color(0x2a1a10); S.fog = new THREE.Fog(0xb08250, o.fog0 ?? 14, o.fog1 ?? 110);
  S.userData.hemi.color.set(0xffe6c0); S.userData.hemi.groundColor.set(0x6a3a1a); S.userData.hemi.intensity = 0.55; S.userData.sun.intensity = 0.0;
  const L = 90, Wd = 22;
  glossyFloor(Wd, L, 0, -L / 2 + 10, { a: '#f0e2c2', b: '#7a4a2a', tile: 3 });
  const carpet = new THREE.Mesh(new THREE.PlaneGeometry(4.2, L), M_(0xc8283a, { r: 0.35 })); carpet.rotation.x = -Math.PI / 2; carpet.position.set(0, 0.03, -L / 2 + 10); carpet.receiveShadow = true; add(carpet);
  for (const s of [-1, 1]) { const e = new THREE.Mesh(new THREE.PlaneGeometry(0.18, L), new THREE.MeshStandardMaterial({ color: 0xe8b84a, metalness: 0.8, roughness: 0.25, emissive: 0x6a4a10, emissiveIntensity: 0.5 })); e.rotation.x = -Math.PI / 2; e.position.set(s * 2.2, 0.035, -L / 2 + 10); add(e); }
  const wood = M_(0x5a2f18, { r: 0.6 }), dark = M_(0x2a160c, { r: 0.7 }), gold = GOLD();
  // bookshelves on both walls, two storeys, with a gold balcony
  const r = rnd(11), cols = [0x8a1a2a, 0x1a3a6a, 0x2a5a2a, 0x6a4a1a, 0x4a1a5a, 0xa86a1a, 0x1a1a1a, 0xc8b88a];
  const bookGeo = new THREE.BoxGeometry(1, 1, 1), bookMat = new THREE.MeshStandardMaterial({ roughness: 0.6 }); const N = 5200;
  const books = new THREE.InstancedMesh(bookGeo, bookMat, N); let bi = 0; const M4 = new THREE.Matrix4(), C = new THREE.Color();
  for (const side of [-1, 1]) {
    const x = side * (Wd / 2); blk(1.2, 16, L, wood, x + side * 0.4, 8, -L / 2 + 10, { k: 0.02 });
    for (let lvl = 0; lvl < 2; lvl++) for (let row = 0; row < 5; row++) {
      const y0 = 0.25 + lvl * 8 + row * 1.45; blk(1.4, 0.12, L, dark, x - side * 0.2, y0, -L / 2 + 10, { k: 0.3, cast: false });
      for (let zz = 10; zz > -L + 10 && bi < N; ) { const w = 0.12 + r() * 0.1, h = 0.9 + r() * 0.35; M4.makeScale(0.75, h, w); M4.setPosition(x - side * 0.25, y0 + 0.06 + h / 2, zz); books.setMatrixAt(bi, M4); books.setColorAt(bi, C.setHex(cols[Math.floor(r() * cols.length)])); bi++; zz -= w + 0.015; }
    }
    blk(1.6, 0.3, L, wood, x - side * 1.2, 7.7, -L / 2 + 10, { k: 0.2 });
    for (let zz = 10; zz > -L + 10; zz -= 1.0) blk(0.08, 1.0, 0.08, gold, x - side * 1.9, 8.35, zz, { cast: false });
    blk(0.12, 0.1, L, gold, x - side * 1.9, 8.9, -L / 2 + 10, { cast: false, k: 0.3 });
    for (let zz = 6; zz > -L + 10; zz -= 12) { blk(1.2, 16, 1.2, M_(0xe8dcc0, { r: 0.4 }), x - side * 1.4, 8, zz, { k: 0.1 }); blk(1.6, 0.6, 1.6, gold, x - side * 1.4, 0.3, zz); blk(1.6, 0.6, 1.6, gold, x - side * 1.4, 15.7, zz); }
  }
  books.count = bi; books.instanceMatrix.needsUpdate = true; books.instanceColor.needsUpdate = true; books.castShadow = true; books.receiveShadow = true; add(books);
  // a coffered ceiling with gold beams, chandeliers down the hall
  blk(Wd + 2, 0.6, L, M_(0x6a3a1c, { r: 0.6 }), 0, 16.3, -L / 2 + 10, { cast: false, k: 0.02 });
  for (let zz = 8; zz > -L + 10; zz -= 6) blk(Wd, 0.35, 0.4, gold, 0, 15.9, zz, { cast: false });
  for (let zz = -4; zz > -L + 10; zz -= 16) chandelier(0, 10.5, zz, 1.2, { power: 30 });
  // reading tables with green lamps on both sides of the carpet
  for (let zz = -2; zz > -60; zz -= 9) for (const s of [-1, 1]) {
    blk(3.2, 0.18, 1.6, wood, s * 5.5, 1.3, zz); for (const [a, b] of [[-1.4, -0.6], [1.4, -0.6], [-1.4, 0.6], [1.4, 0.6]]) blk(0.14, 1.3, 0.14, dark, s * 5.5 + a, 0.65, zz + b, { cast: false });
    const sh = new THREE.Mesh(new THREE.SphereGeometry(0.22, 16, 8, 0, 6.283, 0, 1.6), new THREE.MeshStandardMaterial({ color: 0x1e7a3a, emissive: 0x2a8a3a, emissiveIntensity: 0.6, side: THREE.DoubleSide })); sh.position.set(s * 5.5 + 0.8, 1.85, zz); add(sh);
    const lb = new THREE.Mesh(new THREE.SphereGeometry(0.09, 10, 8), new THREE.MeshBasicMaterial({ color: 0xfff0c0 })); lb.position.set(s * 5.5 + 0.8, 1.75, zz); add(lb);
  }
  // the far wall with a tall glowing doorway (the door that wasn't there before)
  blk(Wd + 2, 16.6, 1.0, M_(0x4a2814, { r: 0.6 }), 0, 8.3, -L + 9.5, { k: 0.02 });
  const door = new THREE.Mesh(new THREE.PlaneGeometry(4.4, 7.5), new THREE.MeshBasicMaterial({ color: 0xffe6b0 })); door.position.set(0, 7.75, -L + 10.05); add(door);
  blk(5.2, 0.5, 0.6, GOLD(), 0, 11.7, -L + 10.2); for (const s2 of [-1, 1]) blk(0.5, 8, 0.6, GOLD(), s2 * 2.45, 7.8, -L + 10.2);
  const dh = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex(), color: 0xffd890, transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending, depthWrite: false })); dh.position.set(0, 7.8, -L + 11); dh.scale.set(14, 16, 1); add(dh);
  // a grand staircase at the far end
  for (let k = 0; k < 10; k++) blk(9 - k * 0.2, 0.4, 1.0, M_(0xefe2c4, { r: 0.3 }), 0, 0.2 + k * 0.4, -66 - k * 1.0, { k: 0.05 });
  // atmosphere: light shafts from high windows, dust, flying pages
  for (let k = 0; k < 6; k++) shaft(-6 + (k % 2) * 12, 9, -8 - k * 9, 3, 20, (k % 2 ? -0.35 : 0.35), { opacity: 0.09 });
  if (o.dust !== false) dust(o.dustN ?? 700, 0, 5, -20, 18, 10, 50, { seed: 4 });
  if (o.pages !== false) pages(o.pagesN ?? 70, 0, 7.5, -22, 16, 7, 40, { seed: 9 });
}
// ------------------------------------------------------------------ the potion shop: shelves of glowing bottles behind a counter
export function potionShop(o = {}) {
  const S = getScene(); S.background = new THREE.Color(0x14121e); S.fog = new THREE.Fog(0x1a1626, 10, 40); S.userData.hemi.intensity = 0.35; S.userData.sun.intensity = 0.0;
  const wood = M_(0x3a2214, { r: 0.6 });
  glossyFloor(16, 16, 0, -4, { a: '#3a2a20', b: '#24180f', tile: 2, opacity: 0.85 });
  blk(16, 9, 0.6, M_(0x2a2238, { r: 0.8 }), 0, 4.5, -7.2, { k: 0.02 });
  const bottle = new THREE.MeshStandardMaterial({ color: 0x9ff4ff, emissive: 0x1a98c8, emissiveIntensity: 0.75, roughness: 0.15, transparent: true, opacity: 0.92 });
  const neck = M_(0xd8f8ff, { r: 0.2 }); const cork = M_(0x8a5a34);
  for (let row = 0; row < 4; row++) { blk(12, 0.2, 1.0, wood, 0, 1.2 + row * 1.7, -6.6); for (let i = 0; i < 12; i++) { const x = -5.5 + i * 1.0, y = 1.62 + row * 1.7; const b = new THREE.Mesh(new THREE.SphereGeometry(0.3, 20, 14), bottle); b.position.set(x, y, -6.6); add(b); const n = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 0.25, 12), neck); n.position.set(x, y + 0.35, -6.6); add(n); const c = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.1, 8), cork); c.position.set(x, y + 0.5, -6.6); add(c); } }
  for (const x of [-3.5, 0, 3.5]) { const L = new THREE.PointLight(0x5ae0ff, 8, 10, 1.6); L.position.set(x, 4, -5.6); add(L); }
  blk(9, 1.3, 1.6, wood, 0, 0.65, -2.6); blk(9.4, 0.15, 1.9, M_(0x5a3a22, { r: 0.35 }), 0, 1.35, -2.6);
  for (const x of [-3.2, 3.0]) { const b = new THREE.Mesh(new THREE.SphereGeometry(0.4, 20, 14), bottle); b.position.set(x, 1.85, -2.4); add(b); }
  dust(260, 0, 3, -3, 12, 6, 8, { color: 0x9fe8ff, seed: 6, size: 0.06 });
}
// ------------------------------------------------------------------ a fantasy kingdom seen from above (castle, river, fields, forest)
export function kingdom() {
  const S = getScene(); S.fog = new THREE.Fog(0xcfe6ff, 60, 420);
  const g = new THREE.Mesh(new THREE.PlaneGeometry(900, 900), M_(0x6cc24a, { r: 0.95 })); g.rotation.x = -Math.PI / 2; g.receiveShadow = true; add(g);
  const r = rnd(21);
  const river = new THREE.Mesh(new THREE.PlaneGeometry(10, 900), M_(0x4aa8e8, { r: 0.1, m: 0.1 })); river.rotation.x = -Math.PI / 2; river.rotation.z = 0.35; river.position.set(40, 0.05, 0); add(river);
  for (let i = 0; i < 26; i++) { const f = new THREE.Mesh(new THREE.PlaneGeometry(14 + r() * 10, 10 + r() * 8), M_([0xe8d06a, 0x8ad04a, 0xc8a84a][i % 3], { r: 0.9 })); f.rotation.x = -Math.PI / 2; f.position.set(-60 + (i % 6) * 22, 0.04, 20 + Math.floor(i / 6) * 18); add(f); }
  const leaf = M_(0x2f8a3a, { r: 0.85 }), trunk = M_(0x6a4a2a);
  for (let i = 0; i < 260; i++) { const x = (r() - 0.5) * 380, z = -60 - r() * 260; if (Math.abs(x - 40 - (z * -0.36)) < 10) continue; const t = new THREE.Mesh(new THREE.ConeGeometry(1.6 + r(), 5 + r() * 3, 7), leaf); t.position.set(x, 3, z); t.castShadow = true; add(t); }
  const stone = M_(0xe8e4f0, { r: 0.5 }), roof = M_(0x3a5ad8, { r: 0.4 });
  const tower = (x, z, h, rr) => { const c = new THREE.Mesh(new THREE.CylinderGeometry(rr, rr, h, 20), stone); c.position.set(x, h / 2, z); c.castShadow = true; add(c); const k = new THREE.Mesh(new THREE.ConeGeometry(rr * 1.3, rr * 2.4, 20), roof); k.position.set(x, h + rr * 1.2, z); k.castShadow = true; add(k); };
  blk(26, 10, 18, stone, 0, 5, -40, { k: 0.02 }); tower(0, -40, 26, 3.2); for (const [x, z] of [[-13, -31], [13, -31], [-13, -49], [13, -49]]) tower(x, z, 16, 2.2);
  for (let i = 0; i < 40; i++) { const x = -40 + (i % 10) * 9, z = -5 + Math.floor(i / 10) * 9; blk(5, 3.5, 4, M_(0xf0ead8), x, 1.75, z, { k: 0.05 }); const rf = new THREE.Mesh(new THREE.ConeGeometry(3.7, 2.4, 4), M_(0xc8463a)); rf.rotation.y = Math.PI / 4; rf.position.set(x, 4.7, z); add(rf); }
}

// ------------------------------------------------------------------ "lost things" story props
// Mister Button: a small blocky stuffed bunny (worn, with a button eye)
export function bunny(o = {}) {
  const g = new THREE.Group(); const fur = M_(o.color ?? 0xe8dcc8, { r: 0.95 }), inner = M_(0xf2b8c0, { r: 0.9 }), dark = M_(0x2a2a30, { r: 0.4 });
  const part = (w, h, d, m, x, y, z, rx = 0, rz = 0) => { const p = new THREE.Mesh(rbox(w, h, d, 0.3), m); p.position.set(x, y, z); p.rotation.set(rx, 0, rz); p.castShadow = true; g.add(p); return p; };
  part(0.36, 0.38, 0.28, fur, 0, 0.2, 0); part(0.32, 0.28, 0.28, fur, 0, 0.52, 0.02);
  for (const s of [-1, 1]) { part(0.09, 0.34, 0.06, fur, s * 0.09, 0.82, 0, 0, s * -0.18); part(0.05, 0.24, 0.02, inner, s * 0.09, 0.82, 0.035, 0, s * -0.18); part(0.12, 0.1, 0.14, fur, s * 0.13, 0.04, 0.08); part(0.08, 0.18, 0.08, fur, s * 0.22, 0.26, 0.04, 0, s * 0.5); }
  const e1 = new THREE.Mesh(new THREE.SphereGeometry(0.03, 10, 8), dark); e1.position.set(-0.07, 0.56, 0.16); g.add(e1);
  const bt = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.015, 12), M_(0x3a6fd6, { r: 0.4 })); bt.rotation.x = Math.PI / 2; bt.position.set(0.07, 0.56, 0.16); g.add(bt);
  const ns = new THREE.Mesh(new THREE.SphereGeometry(0.025, 8, 6), inner); ns.position.set(0, 0.5, 0.17); g.add(ns);
  if (o.parent) o.parent.add(g); else add(g); g.scale.setScalar(o.scale ?? 1); return g;
}
// a flashlight beam (spot light + a soft additive cone) following a target
export function flashlight(fromFn, toFn, o = {}) {
  const sp = new THREE.SpotLight(0xfff2d0, o.power ?? 40, 18, 0.32, 0.5, 1.2); sp.castShadow = false; add(sp); add(sp.target);
  const cone = new THREE.Mesh(new THREE.ConeGeometry(1.1, 6, 24, 1, true), new THREE.MeshBasicMaterial({ color: 0xfff0c0, transparent: true, opacity: 0.07, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
  cone.geometry.translate(0, -3, 0); add(cone);
  const v = new THREE.Vector3(), w = new THREE.Vector3(), up = new THREE.Vector3(0, -1, 0);
  on((u) => { const a = fromFn(u), b = toFn(u); sp.position.set(...a); sp.target.position.set(...b); cone.position.set(...a); v.set(b[0] - a[0], b[1] - a[1], b[2] - a[2]).normalize(); cone.quaternion.setFromUnitVectors(up, v); });
  return sp;
}
// heaps of lost things: umbrellas, socks, keys, suitcases, toys, phones, books, rings
export function heap(cx, cz, R, H, n, kinds, seed = 1) {
  const r = rnd(seed); const C = new THREE.Color(); const M4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), p = new THREE.Vector3(), sc = new THREE.Vector3();
  const geos = {
    sock: [new THREE.BoxGeometry(0.16, 0.42, 0.08), [0xd23a3a, 0x3a6fd6, 0xf5c84a, 0x3aa655, 0xffffff, 0xb04ac9, 0xf28c28], 0.8],
    umbrella: [new THREE.ConeGeometry(0.5, 0.35, 8), [0xd23a3a, 0x2a2a35, 0x3a6fd6, 0xf5c84a, 0x6a2a8a], 0.5],
    key: [new THREE.BoxGeometry(0.06, 0.02, 0.22), [0xe8c048, 0xc8ccd2], 0.2, true],
    suitcase: [new THREE.BoxGeometry(0.7, 0.5, 0.25), [0x8a5a34, 0x2a3a6a, 0x6a1a2a, 0x3a5a3a], 0.5],
    toy: [new THREE.BoxGeometry(0.3, 0.3, 0.3), [0xd23a3a, 0xf5c84a, 0x3a6fd6, 0x3aa655, 0xf28c28, 0xffb6c8], 0.6],
    phone: [new THREE.BoxGeometry(0.16, 0.02, 0.3), [0x18181c, 0xe8e8ee, 0x3a3a45], 0.3, true],
    book: [new THREE.BoxGeometry(0.3, 0.06, 0.4), [0x8a1a2a, 0x1a3a6a, 0x2a5a2a, 0x6a4a1a], 0.6],
    ring: [new THREE.TorusGeometry(0.06, 0.015, 6, 16), [0xf2c84a, 0xe8e8f0], 0.2, true],
    teddy: [new THREE.SphereGeometry(0.22, 10, 8), [0x9a6a3a, 0xc89a64, 0xe8dcc8], 0.8],
    letter: [new THREE.BoxGeometry(0.34, 0.01, 0.22), [0xf6f0e0, 0xffe8e8, 0xe8f0ff], 0.8],
  };
  for (const k of kinds) {
    const [geo, cols, rough, metal] = geos[k]; const mat = new THREE.MeshStandardMaterial({ roughness: metal ? 0.25 : rough, metalness: metal ? 0.9 : 0.0 });
    const im = new THREE.InstancedMesh(geo, mat, n); im.castShadow = true; im.receiveShadow = true;
    for (let i = 0; i < n; i++) { const a = r() * 6.283, d = Math.sqrt(r()) * R, h = H * Math.pow(1 - d / R, 1.6) * (0.75 + r() * 0.25);
      p.set(cx + Math.cos(a) * d, Math.max(0.05, h * r() ** 0.35), cz + Math.sin(a) * d); e.set(r() * 6.28, r() * 6.28, r() * 6.28); q.setFromEuler(e); const s2 = 0.8 + r() * 0.6; sc.set(s2, s2, s2);
      im.setMatrixAt(i, M4.compose(p, q, sc)); im.setColorAt(i, C.setHex(cols[Math.floor(r() * cols.length)])); }
    im.instanceMatrix.needsUpdate = true; im.instanceColor.needsUpdate = true; add(im);
  }
}
// balloons resting against the ceiling, strings hanging
export function balloons(n, cx, y, cz, sx, sz, seed = 3) {
  const r = rnd(seed), cols = [0xff4d6d, 0xffd23a, 0x4da8ff, 0x7ad35a, 0xff9a3c, 0xc77dff, 0xffffff];
  const list = [];
  for (let i = 0; i < n; i++) { const m = new THREE.Mesh(new THREE.SphereGeometry(0.42, 18, 14), new THREE.MeshStandardMaterial({ color: cols[i % cols.length], roughness: 0.25, metalness: 0.05 })); m.scale.y = 1.15; const x = cx + (r() - 0.5) * sx, z = cz + (r() - 0.5) * sz, yy = y - r() * 0.8; m.position.set(x, yy, z); add(m);
    const st = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 2.2, 4), M_(0xf0f0f0)); st.position.set(x, yy - 1.5, z); add(st); list.push([m, st, x, yy, z, r() * 6]); }
  on((u) => list.forEach(([m, st, x, yy, z, ph]) => { const dx = Math.sin(u * 0.6 + ph) * 0.12, dy = Math.sin(u * 0.9 + ph) * 0.08; m.position.set(x + dx, yy + dy, z); st.position.set(x + dx * 0.6, yy + dy - 1.5, z); }));
}
// kites hanging in mid-air (tangled in "invisible trees"), with ribbon tails
export function kites(n, cx, y, cz, sx, sz, seed = 5) {
  const r = rnd(seed), cols = [0xff4d6d, 0xffd23a, 0x4da8ff, 0x7ad35a, 0xc77dff];
  for (let i = 0; i < n; i++) { const g = new THREE.Group(); g.position.set(cx + (r() - 0.5) * sx, y + (r() - 0.5) * 3, cz + (r() - 0.5) * sz); add(g);
    const sh = new THREE.Shape(); sh.moveTo(0, 0.7); sh.lineTo(0.45, 0); sh.lineTo(0, -0.9); sh.lineTo(-0.45, 0); sh.closePath();
    const k = new THREE.Mesh(new THREE.ShapeGeometry(sh), new THREE.MeshStandardMaterial({ color: cols[i % cols.length], side: THREE.DoubleSide, roughness: 0.6 })); g.add(k);
    const tail = []; for (let j = 0; j < 6; j++) { const b = new THREE.Mesh(new THREE.PlaneGeometry(0.12, 0.08), new THREE.MeshBasicMaterial({ color: cols[(i + j) % cols.length], side: THREE.DoubleSide })); g.add(b); tail.push(b); }
    const ph = r() * 6; on((u) => { g.rotation.set(0.2 * Math.sin(u * 0.7 + ph), ph + Math.sin(u * 0.3) * 0.3, 0.15 * Math.sin(u + ph)); tail.forEach((b, j) => b.position.set(Math.sin(u * 2 + j * 0.8 + ph) * 0.12 * j, -0.95 - j * 0.22, 0)); }); }
}
// the Lost Room: a vast old hall with skylights, mountains of lost things, balloons, kites, letters, dust.
// sunrise(u) in 0..1 turns the skylights orange.
export function lostRoom(o = {}) {
  const S = getScene(); S.background = new THREE.Color(0x1a120c); S.fog = new THREE.Fog(0x7a5a3a, 12, 80);
  S.userData.hemi.color.set(0xffe6c8); S.userData.hemi.groundColor.set(0x4a2a14); S.userData.hemi.intensity = 0.5; S.userData.sun.intensity = 0.0;
  const L = 80, Wd = 40;
  glossyFloor(Wd, L, 0, -L / 2 + 10, { a: '#7a5a3a', b: '#5a3e26', tile: 2.5, opacity: 0.9, tint: 0x555555 });
  const brick = tex(256, 256, (g) => { g.fillStyle = '#6a3a24'; g.fillRect(0, 0, 256, 256); for (let y = 0; y < 16; y++) for (let x = 0; x < 8; x++) { g.fillStyle = `rgb(${110 + ((x * 7 + y * 13) % 30)},${58 + ((x * 3 + y * 5) % 16)},${36})`; g.fillRect(x * 32 + (y % 2) * 16 + 1, y * 16 + 1, 30, 14); } });
  brick.wrapS = brick.wrapT = THREE.RepeatWrapping; brick.repeat.set(10, 5);
  const wallM = new THREE.MeshStandardMaterial({ map: brick, roughness: 0.9 });
  for (const s of [-1, 1]) blk(1, 22, L, wallM, s * Wd / 2, 11, -L / 2 + 10, { k: 0.01 });
  blk(Wd, 22, 1, wallM, 0, 11, -L + 9.5, { k: 0.01 });
  blk(Wd, 22, 1, wallM, 0, 11, 10.6, { k: 0.01 });   // the front wall (the entrance side)
  // the roof: dark beams, rows of skylights (emissive, colour animated for the sunrise)
  const sky = new THREE.MeshBasicMaterial({ color: 0xcfe0ff });
  blk(Wd + 2, 0.8, L, M_(0x2a1a10), 0, 22.4, -L / 2 + 10, { k: 0.01, cast: false });
  const lights = [];
  for (let zz = 2; zz > -L + 12; zz -= 10) for (const xx of [-9, 9]) { const pl = new THREE.Mesh(new THREE.PlaneGeometry(6, 4), sky); pl.rotation.x = Math.PI / 2; pl.position.set(xx, 21.95, zz); add(pl);
    const sh = shaft(xx, 11, zz, 5, 22, 0.0, { opacity: 0.1, color: 0xdfe8ff }); sh.rotation.y = 0.6; lights.push(sh); }
  for (let zz = 6; zz > -L + 10; zz -= 5) blk(Wd, 0.6, 0.6, M_(0x3a2414), 0, 21.6, zz, { cast: false });
  const key = new THREE.DirectionalLight(0xdfe8ff, 1.2); key.position.set(-6, 30, -10); key.target.position.set(0, 0, -20); key.castShadow = true; key.shadow.mapSize.set(2048, 2048); const sc = key.shadow.camera; sc.left = -25; sc.right = 25; sc.top = 25; sc.bottom = -25; sc.far = 80; add(key); add(key.target);
  // the mountains of lost things
  heap(-9, -14, 7, 6, 380, ['umbrella', 'toy', 'suitcase'], 1);
  heap(9, -18, 8, 7, 420, ['sock', 'toy', 'book'], 2);
  heap(-11, -32, 9, 8, 420, ['suitcase', 'umbrella', 'book', 'teddy'], 3);
  heap(10, -36, 8, 7, 380, ['key', 'phone', 'ring', 'letter'], 4);
  heap(0, -50, 12, 10, 520, ['toy', 'teddy', 'umbrella', 'sock', 'suitcase'], 5);
  heap(-3, -7, 3, 1.4, 220, ['sock'], 6); heap(4, -9, 2.6, 1.2, 200, ['key', 'ring', 'phone'], 7);
  if (o.balloons !== false) balloons(60, 0, 20.6, -25, 34, 60, 3);
  if (o.kites !== false) kites(10, 0, 12, -24, 28, 40, 5);
  if (o.pages !== false) pages(o.pagesN ?? 60, 0, 8, -20, 24, 10, 36, { seed: 12 });
  dust(o.dustN ?? 700, 0, 7, -22, 30, 14, 50, { seed: 13 });
  const c0 = new THREE.Color(0xcfe0ff), c1 = new THREE.Color(0xffa040), k0 = new THREE.Color(0xdfe8ff), k1 = new THREE.Color(0xff9a40);
  if (o.sunrise) on((u, d) => { const k = o.sunrise(u, d); sky.color.copy(c0).lerp(c1, k); key.color.copy(k0).lerp(k1, k); key.intensity = 1.2 + 1.6 * k; lights.forEach(l => { l.material.color.copy(k0).lerp(k1, k); l.material.opacity = 0.1 + 0.18 * k; }); S.fog.color.set(0x7a5a3a).lerp(new THREE.Color(0xc8783a), k * 0.6); });
  return { lights, key };
}
// the antique shop: warm amber bottles, clocks, old things behind a counter
export function antiqueShop() {
  const S = getScene(); S.background = new THREE.Color(0x1a120a); S.fog = new THREE.Fog(0x2a1a10, 10, 34); S.userData.hemi.intensity = 0.45; S.userData.hemi.color.set(0xffe0b0); S.userData.sun.intensity = 0.0;
  const wood = M_(0x4a2a16, { r: 0.6 });
  glossyFloor(16, 16, 0, -4, { a: '#4a3020', b: '#2e1c10', tile: 2, opacity: 0.88 });
  blk(16, 9, 0.6, M_(0x3a2a20, { r: 0.85 }), 0, 4.5, -7.2, { k: 0.02 });
  const amber = new THREE.MeshStandardMaterial({ color: 0xffc070, emissive: 0xc86a10, emissiveIntensity: 0.55, roughness: 0.15, transparent: true, opacity: 0.92 });
  const r = rnd(8);
  for (let row = 0; row < 4; row++) { blk(12, 0.2, 1.0, wood, 0, 1.2 + row * 1.7, -6.6); for (let i = 0; i < 11; i++) { const x = -5.2 + i * 1.04, y = 1.32 + row * 1.7; const t = r();
    if (t < 0.45) { const b = new THREE.Mesh(new THREE.SphereGeometry(0.26, 16, 12), amber); b.position.set(x, y + 0.28, -6.6); add(b); }
    else if (t < 0.7) { const c = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.1, 24), M_(0xd8a83a, { m: 0.8, r: 0.3 })); c.rotation.x = Math.PI / 2; c.position.set(x, y + 0.35, -6.5); add(c); const f = new THREE.Mesh(new THREE.CircleGeometry(0.24, 24), M_(0xfaf0d8)); f.position.set(x, y + 0.35, -6.44); add(f); }
    else blk(0.5, 0.6 + r() * 0.3, 0.4, M_([0x6a1a2a, 0x1a3a6a, 0x3a5a3a][i % 3]), x, y + 0.35, -6.6); } }
  for (const x of [-3.5, 0, 3.5]) { const L = new THREE.PointLight(0xffb060, 9, 10, 1.6); L.position.set(x, 4.5, -5.4); add(L); }
  blk(9, 1.3, 1.6, wood, 0, 0.65, -2.6); blk(9.4, 0.15, 1.9, M_(0x6a4228, { r: 0.35 }), 0, 1.35, -2.6);
  const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.18, 16, 12), new THREE.MeshBasicMaterial({ color: 0xffd890 })); lamp.position.set(3.2, 2.0, -2.5); add(lamp); const ll = new THREE.PointLight(0xffc070, 6, 6, 1.8); ll.position.copy(lamp.position); add(ll);
  dust(260, 0, 3, -3, 12, 6, 8, { color: 0xffd8a0, seed: 16, size: 0.05 });
}
// an old wooden door in a brick wall, light leaking through the cracks
export function oldDoor(x, z, o = {}) {
  const g = new THREE.Group(); g.position.set(x, 0, z); add(g);
  const brickM = M_(0x7a3a24, { r: 0.9 }); const wall = new THREE.Mesh(rbox(8, 6, 0.8, 0.02), brickM); wall.position.y = 3; wall.castShadow = true; wall.receiveShadow = true; g.add(wall);
  const glowM = new THREE.MeshBasicMaterial({ color: 0xffe2a0 }); const gap = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 2.9), glowM); gap.position.set(0, 1.45, 0.41); g.add(gap);
  const hinge = new THREE.Group(); hinge.position.set(-0.8, 0, 0.45); g.add(hinge);
  const door = new THREE.Mesh(rbox(1.6, 2.8, 0.12, 0.05), M_(0x5a3418, { r: 0.75 })); door.position.set(0.8, 1.4, 0); door.castShadow = true; hinge.add(door);
  for (const yy of [0.6, 2.2]) { const b = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.08, 0.04), M_(0x2a2a2a, { m: 0.8 })); b.position.set(0.8, yy, 0.08); hinge.add(b); }
  const knob = new THREE.Mesh(new THREE.SphereGeometry(0.06, 10, 8), M_(0xd8a83a, { m: 0.9, r: 0.3 })); knob.position.set(1.4, 1.35, 0.1); hinge.add(knob);
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex(), color: 0xffd890, transparent: true, opacity: 0.45, blending: THREE.AdditiveBlending, depthWrite: false })); halo.position.set(0, 1.5, 0.7); halo.scale.set(3.5, 4, 1); g.add(halo);
  const L = new THREE.PointLight(0xffd090, 6, 8, 1.5); L.position.set(0, 1.5, 1.0); g.add(L);
  on((u, d) => { const a = o.open ? o.open(u, d) : 0; hinge.rotation.y = -a * 1.7; halo.material.opacity = 0.45 + 0.25 * a; L.intensity = 6 + 12 * a; halo.scale.set(3.5 + 3 * a, 4 + 3 * a, 1); });
  return g;
}
