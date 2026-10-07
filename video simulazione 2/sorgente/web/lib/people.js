// The AI people: smooth "3D mannequin" figures (stock-render style) with an articulated
// rig, procedural animation library, per-character colours/accessories and ID on the back.
import * as THREE from 'three';
import { mulberry32, clamp, lerp, smoothstep } from './noise.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

// ----------------------------------------------------------------- shared geometry
const GEO = {};
function torsoGeo() {
  const prof = [[0.0, 0.0], [0.15, 0.015], [0.198, 0.09], [0.205, 0.17], [0.188, 0.29], [0.2, 0.39], [0.213, 0.47],
                [0.205, 0.53], [0.17, 0.58], [0.105, 0.61], [0.0, 0.622]].map(([r, y]) => new THREE.Vector2(r, y));
  const g = new THREE.LatheGeometry(prof, 40);
  g.scale(1, 1, 0.66);
  g.computeVertexNormals();
  return g;
}
function limb(r0, r1, len, seg = 18) {
  // tapered capsule hanging down from the joint (top at y=0)
  const g = new THREE.CapsuleGeometry((r0 + r1) / 2, len, 8, seg);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const y = p.getY(i); const f = clamp((y + len / 2) / len); const k = lerp(r1, r0, f) / ((r0 + r1) / 2);
    p.setXYZ(i, p.getX(i) * k, y - len / 2, p.getZ(i) * k);
  }
  g.computeVertexNormals();
  return g;
}
function initGeo() {
  if (GEO.torso) return;
  GEO.torso = torsoGeo();
  GEO.head = new THREE.SphereGeometry(0.2, 40, 30);
  GEO.neck = new THREE.CylinderGeometry(0.07, 0.085, 0.09, 20);
  GEO.upperArm = limb(0.07, 0.06, 0.24);
  GEO.foreArm = limb(0.06, 0.052, 0.22);
  GEO.hand = new THREE.SphereGeometry(0.068, 20, 16);
  GEO.thigh = limb(0.098, 0.083, 0.31);
  GEO.shin = limb(0.083, 0.07, 0.31);
  GEO.foot = new THREE.SphereGeometry(0.1, 20, 14);
  GEO.jointS = new THREE.SphereGeometry(0.074, 20, 14);
  GEO.jointE = new THREE.SphereGeometry(0.061, 18, 12);
  GEO.jointK = new THREE.SphereGeometry(0.085, 20, 14);
  GEO.jointH = new THREE.SphereGeometry(0.1, 20, 14);
  // accessories
  GEO.ring = new THREE.TorusGeometry(0.205, 0.022, 10, 40);
  GEO.sash = new THREE.TorusGeometry(0.235, 0.028, 8, 40);
  GEO.cone = new THREE.ConeGeometry(0.24, 0.3, 28, 1);
  GEO.stick = new THREE.CylinderGeometry(0.022, 0.026, 1.6, 8);
  GEO.basket = new THREE.CylinderGeometry(0.16, 0.12, 0.16, 16, 1, true);
  GEO.crown = crownGeo();
  GEO.cape = capeGeo();
  GEO.spearTip = new THREE.ConeGeometry(0.045, 0.2, 8);
  GEO.flower = new THREE.SphereGeometry(0.045, 10, 8);
  GEO.helmet = new THREE.SphereGeometry(0.212, 28, 14, 0, Math.PI * 2, 0, Math.PI * 0.5);
  GEO.robe = new THREE.CylinderGeometry(0.21, 0.36, 0.78, 28, 1, true);
  GEO.bag = new THREE.BoxGeometry(0.26, 0.3, 0.12, 2, 2, 2);
  GEO.pack = new THREE.BoxGeometry(0.34, 0.44, 0.2, 3, 3, 3);
  GEO.hair = new THREE.SphereGeometry(0.212, 26, 14, 0, Math.PI * 2, 0, Math.PI * 0.5);
  GEO.eye = new THREE.SphereGeometry(0.021, 10, 8);
  GEO.brow = new THREE.BoxGeometry(0.06, 0.012, 0.016);
  GEO.lock = new THREE.CapsuleGeometry(0.045, 0.2, 5, 10);
  GEO.plate = new THREE.CylinderGeometry(0.225, 0.2, 0.4, 24, 1, true, 0, Math.PI * 2);
  GEO.turban = new THREE.SphereGeometry(0.235, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.62);
}
function crownGeo() {
  const shape = new THREE.Shape();
  const N = 7, R = 1;
  shape.moveTo(0, 0);
  for (let i = 0; i <= N; i++) {
    const x = i / N;
    shape.lineTo(x, 0.55);
    if (i < N) { shape.lineTo(x + 0.5 / N, 1.0); }
  }
  shape.lineTo(1, 0); shape.lineTo(0, 0);
  const g = new THREE.ShapeGeometry(shape);
  // wrap around a cylinder
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const a = p.getX(i) * Math.PI * 2, y = p.getY(i) * 0.13;
    p.setXYZ(i, Math.cos(a) * 0.15, y, Math.sin(a) * 0.15);
  }
  g.computeVertexNormals();
  return g;
}
function capeGeo() {
  const g = new THREE.PlaneGeometry(0.5, 0.95, 8, 12);
  g.translate(0, -0.475, 0);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i); p.setZ(i, -0.06 * Math.cos(x / 0.25 * 1.4) + y * 0.12); p.setX(i, x * (1 + (-y) * 0.6)); }
  g.computeVertexNormals();
  return g;
}

// ----------------------------------------------------------------- materials
const MAT = {};
export function bodyMat(hex, rough = 0.42) {
  const k = hex + '_' + rough;
  if (!MAT[k]) MAT[k] = new THREE.MeshStandardMaterial({ color: hex, roughness: rough, metalness: 0.0 });
  return MAT[k];
}
const metalMat = (hex) => MAT['m' + hex] || (MAT['m' + hex] = new THREE.MeshStandardMaterial({ color: hex, roughness: 0.28, metalness: 0.85 }));
const clothMat = (hex) => MAT['c' + hex] || (MAT['c' + hex] = new THREE.MeshStandardMaterial({ color: hex, roughness: 0.8, metalness: 0, side: THREE.DoubleSide }));
const woodMat = () => MAT.wood || (MAT.wood = new THREE.MeshStandardMaterial({ color: 0x7a5432, roughness: 0.85 }));

function numberTexture(txt, color = '#3a3d44') {
  const cv = document.createElement('canvas'); cv.width = 256; cv.height = 256;
  const g = cv.getContext('2d');
  g.clearRect(0, 0, 256, 256);
  const fs = Math.min(150, Math.floor(250 / (0.6 * Math.max(2, txt.length))));
  g.fillStyle = color; g.font = `bold ${fs}px Arial, sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText(txt, 128, 136);
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 1;
  return t;
}

export function crownMesh() { initGeo(); const m = new THREE.Mesh(GEO.crown, metalMat(0xd4904a)); m.castShadow = true; return m; }
export function spearMesh() { initGeo(); const o = new THREE.Group(); const s = new THREE.Mesh(GEO.stick, woodMat()); s.scale.y = 1.25; const tip = new THREE.Mesh(GEO.spearTip, metalMat(0xb8b8b8)); tip.position.y = 1.1; o.add(s, tip); o.traverse(n => { if (n.isMesh) n.castShadow = true; }); return o; }

// ----------------------------------------------------------------- the character
export class Person {
  constructor(def = {}) {
    initGeo();
    this.def = def;
    const color = def.color ?? 0xeeeeee;
    const mat = bodyMat(color, def.rough ?? 0.42);
    this.mat = mat;
    this.baseColor = new THREE.Color(color);
    const S = def.scale ?? 1.0;
    this.root = new THREE.Group();
    this.root.scale.setScalar(S * 0.92);
    const mk = (geo, m = mat) => { const o = new THREE.Mesh(geo, m); o.castShadow = true; o.receiveShadow = true; return o; };
    const J = (parent, x, y, z) => { const g = new THREE.Bone(); g.position.set(x, y, z); parent.add(g); return g; };
    const w = def.width ?? 1.0;
    // skeleton
    this.pelvis = J(this.root, 0, 0.9, 0);
    this.spine = J(this.pelvis, 0, -0.04, 0);
    const torso = mk(GEO.torso); torso.scale.set(w, 1, w); this.spine.add(torso); this.torso = torso;
    this.neck = J(this.spine, 0, 0.6, 0);
    const neckM = mk(GEO.neck); neckM.position.y = 0.03; this.neck.add(neckM);
    this.head = J(this.neck, 0, 0.07, 0);
    const headM = mk(GEO.head); const hs = def.headScale ?? 1; this.headG = new THREE.Group(); this.headG.scale.setScalar(hs); this.head.add(this.headG);
    headM.position.y = 0.19 * hs; headM.scale.setScalar(hs); this.head.add(headM); this.headMesh = headM;
    const side = (s) => {
      const sh = J(this.spine, s * 0.205 * w, 0.505, 0);
      const ua = mk(GEO.upperArm); sh.add(ua);
      const js = mk(GEO.jointS); sh.add(js);
      const el = J(sh, 0, -0.27, 0);
      const fa = mk(GEO.foreArm); el.add(fa);
      const je = mk(GEO.jointE); el.add(je);
      const hd = J(el, 0, -0.27, 0);
      const hm = mk(GEO.hand, def.handColor !== undefined ? bodyMat(def.handColor) : mat); hd.add(hm);
      const hip = J(this.pelvis, s * 0.1 * w, 0.0, 0);
      const th = mk(GEO.thigh); hip.add(th);
      const jh = mk(GEO.jointH); jh.scale.set(1, 0.8, 1); hip.add(jh);
      const kn = J(hip, 0, -0.37, 0);
      const shn = mk(GEO.shin); kn.add(shn);
      const jk = mk(GEO.jointK); kn.add(jk);
      const an = J(kn, 0, -0.37, 0);
      const ft = mk(GEO.foot, def.footColor !== undefined ? bodyMat(def.footColor) : mat); ft.scale.set(0.95, 0.62, 1.45); ft.position.set(0, -0.06, 0.05); an.add(ft);
      return { sh, el, hd, hip, kn, an };
    };
    this.L = side(-1); this.R = side(1);
    if (def.skinned !== false) this._bake();
    // ID on the back
    if (def.id) {
      const plane = new THREE.Mesh(new THREE.PlaneGeometry(0.22, 0.22), new THREE.MeshStandardMaterial({ map: numberTexture(def.id, def.idColor || '#2f3238'), transparent: true, roughness: 0.6, polygonOffset: true, polygonOffsetFactor: -2 }));
      plane.position.set(0, 0.4, -0.142 * w); plane.rotation.y = Math.PI;
      this.spine.add(plane);
    }
    this.props = {};
    if (def.eyes !== false) this._eyes();
    for (const a of (def.acc || [])) this.addAcc(a);
    this.state = { energy: 1 };
  }

  // merge all rigid body parts into a few SkinnedMeshes (one per material) -> far fewer draw calls
  _bake() {
    // bind at unit scale: the skeleton's inverse bind matrices must not contain the root's scale, otherwise the body is drawn
    // at a different size than the bones (accessories, eyes and hair then float away from the head of tall/small characters)
    const keepScale = this.root.scale.x; this.root.scale.setScalar(1);
    const bones = [];
    this.pelvis.traverse(o => { if (o.isBone) bones.push(o); });
    this.root.updateMatrixWorld(true);
    const inv = new THREE.Matrix4().copy(this.root.matrixWorld).invert();
    const byMat = new Map();
    const parts = [];
    this.pelvis.traverse(o => { if (o.isMesh) parts.push(o); });
    for (const m of parts) {
      const bone = m.parent;
      const bi = bones.indexOf(bone);
      const g = m.geometry.clone();
      for (const k of Object.keys(g.attributes)) if (!['position', 'normal'].includes(k)) g.deleteAttribute(k);
      const M = new THREE.Matrix4().multiplyMatrices(inv, m.matrixWorld);
      g.applyMatrix4(M);
      const n = g.attributes.position.count;
      const si = new Uint16Array(n * 4), sw = new Float32Array(n * 4);
      for (let i = 0; i < n; i++) { si[i * 4] = bi; sw[i * 4] = 1; }
      g.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(si, 4));
      g.setAttribute('skinWeight', new THREE.Float32BufferAttribute(sw, 4));
      const gi = g.index ? g.toNonIndexed() : g;
      if (!byMat.has(m.material)) byMat.set(m.material, []);
      byMat.get(m.material).push(gi);
      bone.remove(m);
    }
    const skeleton = new THREE.Skeleton(bones);
    this.skinned = [];
    for (const [mat, geos] of byMat) {
      const geo = mergeGeometries(geos);
      const sm = new THREE.SkinnedMesh(geo, mat);
      sm.castShadow = true; sm.receiveShadow = true; sm.frustumCulled = false;
      this.root.add(sm);
      sm.bind(skeleton, new THREE.Matrix4());
      this.skinned.push(sm);
    }
    this.skeleton = skeleton;
    this.root.scale.setScalar(keepScale); this.root.updateMatrixWorld(true);
  }

  _eyes() {
    const m = MAT.eye || (MAT.eye = new THREE.MeshStandardMaterial({ color: 0x14161a, roughness: 0.25 }));
    const g = new THREE.Group();
    for (const sg of [-1, 1]) {
      const e = new THREE.Mesh(GEO.eye, m); e.position.set(sg * 0.072, 0.215, 0.183); e.scale.set(0.9, 1.35, 0.6); g.add(e);
      const b = new THREE.Mesh(GEO.brow, m); b.position.set(sg * 0.072, 0.262, 0.178); b.rotation.z = sg * -0.12; g.add(b);
    }
    this.headG.add(g); this.eyes = g;
  }

  addAcc(a) {
    const type = typeof a === 'string' ? a : a.type, c = typeof a === 'string' ? undefined : a.color;
    let o;
    switch (type) {
      case 'crown': o = new THREE.Mesh(GEO.crown, metalMat(c ?? 0xd4904a)); o.position.y = 0.33; o.scale.setScalar(1.05); this.headG.add(o); break;
      case 'cape': o = new THREE.Mesh(GEO.cape, clothMat(c ?? 0xb3122a)); o.position.set(0, 0.56, -0.15); o.castShadow = true; this.spine.add(o); break;
      case 'scarf': o = new THREE.Mesh(GEO.ring, clothMat(c ?? 0xd33a2c)); o.rotation.x = Math.PI / 2; o.position.y = 0.6; o.scale.set(0.62, 0.62, 1.4); this.spine.add(o); break;
      case 'sash': o = new THREE.Mesh(GEO.sash, clothMat(c ?? 0x2f6bff)); o.rotation.set(Math.PI / 2, 0.55, 0); o.position.y = 0.33; o.scale.set(1, 0.7, 1); this.spine.add(o); break;
      case 'belt': o = new THREE.Mesh(GEO.sash, clothMat(c ?? 0x5a3a22)); o.rotation.x = Math.PI / 2; o.position.y = 0.17; o.scale.set(0.9, 0.62, 0.8); this.spine.add(o); break;
      case 'headband': o = new THREE.Mesh(GEO.ring, clothMat(c ?? 0x2a9d8f)); o.rotation.x = Math.PI / 2; o.position.y = 0.24; o.scale.set(0.98, 0.98, 1.2); this.headG.add(o); break;
      case 'hat': o = new THREE.Mesh(GEO.cone, clothMat(c ?? 0xc9a45a)); o.position.y = 0.43; o.scale.set(1.25, 0.6, 1.25); this.headG.add(o); break;
      case 'helmet': o = new THREE.Mesh(GEO.helmet, metalMat(c ?? 0x9a9a9a)); o.position.set(0, 0.215, -0.012); o.rotation.x = -0.34; this.headG.add(o); break;
      case 'hood': o = new THREE.Mesh(GEO.helmet, clothMat(c ?? 0xf2efe6)); o.position.set(0, 0.2, -0.02); o.rotation.x = -0.5; o.scale.setScalar(1.08); this.headG.add(o); break;
      case 'robe': o = new THREE.Mesh(GEO.robe, clothMat(c ?? 0xf3efe2)); o.position.y = -0.15; this.spine.add(o); break;
      case 'flower': o = new THREE.Mesh(GEO.flower, bodyMat(c ?? 0xff6fa0, 0.6)); o.position.set(0.15, 0.32, 0.06); this.headG.add(o); break;
      case 'bag': o = new THREE.Mesh(GEO.bag, clothMat(c ?? 0x8a6a45)); o.position.set(0, 0.36, -0.19); this.spine.add(o); break;
      case 'staff': o = new THREE.Mesh(GEO.stick, woodMat()); o.position.set(0, -0.05, 0.02); this.R.hd.add(o); break;
      case 'spear': { o = new THREE.Group(); const s = new THREE.Mesh(GEO.stick, woodMat()); s.scale.y = 1.25; const tip = new THREE.Mesh(GEO.spearTip, metalMat(0xb8b8b8)); tip.position.y = 1.1; o.add(s, tip); o.position.set(0, 0.1, 0.02); this.R.hd.add(o); break; }
      case 'torch': { o = new THREE.Group(); const s = new THREE.Mesh(GEO.stick, woodMat()); s.scale.set(1.2, 0.42, 1.2); o.add(s); o.position.set(0, 0.25, 0.02); this.R.hd.add(o); o.userData.flameAt = new THREE.Vector3(0, 0.36, 0); break; }
      case 'sword': { o = new THREE.Group(); const bl = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.78, 0.013), metalMat(0xd7dce4)); bl.position.y = -0.5; const gd = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.03, 0.045), metalMat(0xd4a840)); gd.position.y = -0.11; const gr = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.14, 8), woodMat()); gr.position.y = -0.02; o.add(bl, gd, gr); this.R.hd.add(o); break; }
      case 'axe': { o = new THREE.Group(); const hd = new THREE.Mesh(GEO.stick, woodMat()); hd.scale.set(1, 0.58, 1); hd.position.y = -0.33; const hh = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.17, 0.24), metalMat(0xb9bec6)); hh.position.set(0, -0.74, 0.1); o.add(hd, hh); this.R.hd.add(o); break; }
      case 'hammer': { o = new THREE.Group(); const hd = new THREE.Mesh(GEO.stick, woodMat()); hd.scale.set(1, 0.4, 1); hd.position.y = -0.22; const hh = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.13, 0.13), metalMat(0x8c9098)); hh.position.y = -0.5; o.add(hd, hh); this.R.hd.add(o); break; }
      case 'shield': { o = new THREE.Group(); const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.31, 0.31, 0.045, 28), clothMat(c ?? 0xe0a030)); disc.rotation.z = Math.PI / 2; const rim = new THREE.Mesh(new THREE.TorusGeometry(0.31, 0.022, 8, 28), metalMat(0xb08a30)); rim.rotation.y = Math.PI / 2; const boss = new THREE.Mesh(new THREE.SphereGeometry(0.075, 12, 10), metalMat(0xd8b24a)); boss.position.x = -0.04; o.add(disc, rim, boss); o.position.set(-0.13, -0.02, 0.03); this.L.hd.add(o); break; }
      case 'bow': { o = new THREE.Group(); const g = new THREE.TorusGeometry(0.44, 0.017, 6, 28, Math.PI * 0.86); g.rotateZ(-Math.PI * 0.43); g.rotateX(Math.PI / 2); g.rotateZ(-Math.PI / 2); g.translate(0, 0.44, 0); const bw = new THREE.Mesh(g, woodMat()); const sg = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.78, 4), clothMat(0xf0ead8)); sg.rotation.x = Math.PI / 2; sg.position.y = 0.44 - 0.44 * Math.cos(Math.PI * 0.43); o.add(bw, sg); this.L.hd.add(o); o.userData.string = sg; break; }
      case 'quiver': { o = new THREE.Group(); const q = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.05, 0.5, 10), clothMat(0x6b4a2e)); q.position.y = 0.05; o.add(q); for (let k = 0; k < 4; k++) { const ar = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.22, 4), woodMat()); ar.position.set((k - 1.5) * 0.02, 0.36, 0); const fl = new THREE.Mesh(new THREE.ConeGeometry(0.02, 0.06, 4), clothMat(0xe8e0d0)); fl.position.set((k - 1.5) * 0.02, 0.45, 0); o.add(ar, fl); } o.position.set(0.1, 0.36, -0.2); o.rotation.z = 0.35; this.spine.add(o); break; }
      case 'sunCrown': { o = new THREE.Group(); const gm = new THREE.MeshStandardMaterial({ color: c ?? 0xffd34a, emissive: 0xff9a10, emissiveIntensity: 0.55, metalness: 0.6, roughness: 0.3 }); for (let k = 0; k < 11; k++) { const a = k / 11 * Math.PI * 2, ray = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.2, 5), gm); ray.position.set(Math.cos(a) * 0.17, 0.0, Math.sin(a) * 0.17); ray.rotation.set(Math.sin(a) * 0.9, 0, -Math.cos(a) * 0.9); o.add(ray); } const rg = new THREE.Mesh(new THREE.TorusGeometry(0.175, 0.016, 6, 28), gm); rg.rotation.x = Math.PI / 2; o.add(rg); o.position.y = 0.33; this.headG.add(o); break; }
      case 'leafCrown': { o = new THREE.Group(); for (let k = 0; k < 12; k++) { const a = k / 12 * Math.PI * 2, lf = new THREE.Mesh(new THREE.SphereGeometry(0.04, 6, 5), bodyMat(k % 2 ? 0x3f9a3a : 0x66bd4a, 0.7)); lf.scale.set(1.3, 0.55, 0.8); lf.position.set(Math.cos(a) * 0.19, 0, Math.sin(a) * 0.19); lf.rotation.y = -a; o.add(lf); } o.position.y = 0.3; this.headG.add(o); break; }
      case 'antlers': { o = new THREE.Group(); for (const sg of [-1, 1]) { const br = new THREE.Group(); const mk2 = (len, x, y, rz) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.017, len, 5), woodMat()); m.position.set(x, y + len / 2, 0); m.rotation.z = rz; return m; }; br.add(mk2(0.3, 0, 0, 0)); const b2 = mk2(0.2, 0, 0.12, -0.7 * sg); b2.position.set(0.07 * sg, 0.2, 0); br.add(b2); const b3 = mk2(0.18, 0, 0.24, 0.55 * sg); b3.position.set(-0.03 * sg, 0.34, 0); br.add(b3); br.position.set(sg * 0.12, 0.26, 0); br.rotation.z = -sg * 0.35; o.add(br); } this.headG.add(o); break; }
      case 'whiteBand': { o = new THREE.Mesh(new THREE.TorusGeometry(0.075, 0.03, 8, 20), clothMat(0xffffff)); o.rotation.x = Math.PI / 2; o.position.set(0, -0.1, 0); this.L.sh.add(o); break; }
      case 'basket': o = new THREE.Mesh(GEO.basket, clothMat(c ?? 0xb08a4f)); o.position.set(0, -0.12, 0.0); this.L.hd.add(o); break;
      case 'tally': o = new THREE.Mesh(GEO.stick, woodMat()); o.scale.set(0.8, 0.22, 0.8); o.position.set(0, -0.05, 0); this.L.hd.add(o); break;
      case 'pack': { o = new THREE.Group(); const b = new THREE.Mesh(GEO.pack, clothMat(c ?? 0x6b7a4a)); const fl = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.14, 0.22), clothMat(0x4f5a38)); fl.position.set(0, 0.2, 0); const rl = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.36, 10), clothMat(0xc9b184)); rl.rotation.z = Math.PI / 2; rl.position.set(0, -0.26, 0); o.add(b, fl, rl); o.position.set(0, 0.34, -0.24); this.spine.add(o); break; }
      case 'armband': { o = new THREE.Mesh(new THREE.TorusGeometry(0.068, 0.026, 8, 18), clothMat(c ?? 0xd7263d)); o.rotation.x = Math.PI / 2; o.position.set(0, -0.1, 0); this.R.sh.add(o); break; }
      case 'plate': { const wd = this.def.width ?? 1; o = new THREE.Mesh(GEO.plate, new THREE.MeshStandardMaterial({ color: c ?? 0xc9ced6, roughness: 0.3, metalness: 0.8, side: THREE.DoubleSide })); o.position.set(0, 0.33, 0); o.scale.set(1.09 * wd, 1, 0.8 * wd); this.spine.add(o); break; }
      case 'turban': { o = new THREE.Mesh(GEO.turban, clothMat(c ?? 0xd9c9a0)); o.position.y = 0.19; this.headG.add(o); break; }
      case 'visor': { o = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.034, 8, 30, Math.PI * 0.95), new THREE.MeshStandardMaterial({ color: c ?? 0x66e0ff, emissive: c ?? 0x66e0ff, emissiveIntensity: 0.9, roughness: 0.3 })); o.rotation.set(0, Math.PI * 0.5 + 0.18, 0); o.rotation.x = 0; o.position.set(0, 0.21, 0.0); o.scale.set(1, 1, 1.0); this.headG.add(o); break; }
      case 'goggles': { o = new THREE.Group(); const m = metalMat(0x222222); const gl = new THREE.MeshStandardMaterial({ color: 0xffb02e, roughness: 0.2, metalness: 0.2 }); for (const s of [-1, 1]) { const r = new THREE.Mesh(new THREE.TorusGeometry(0.052, 0.012, 6, 20), m); r.position.set(s * 0.075, 0.22, 0.178); const l = new THREE.Mesh(new THREE.CircleGeometry(0.05, 14), gl); l.position.set(s * 0.075, 0.22, 0.18); o.add(r, l); } const st = new THREE.Mesh(new THREE.TorusGeometry(0.205, 0.012, 6, 36), m); st.rotation.x = Math.PI / 2; st.position.y = 0.22; st.scale.set(1, 1, 1.0); o.add(st); this.headG.add(o); break; }
      case 'ropeCoil': { o = new THREE.Mesh(new THREE.TorusGeometry(0.235, 0.032, 8, 36), clothMat(c ?? 0xc9b184)); o.rotation.set(Math.PI / 2 - 0.5, 0.0, 0.5); o.position.set(0, 0.33, 0); o.scale.set(1, 1, 1.0); this.spine.add(o); break; }
      case 'medbag': { o = new THREE.Group(); const b = new THREE.Mesh(GEO.bag, clothMat(0xf3f3f0)); const v = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.03, 0.125), clothMat(0xd7263d)); v.position.set(0, 0, 0.0); const h = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.1, 0.125), clothMat(0xd7263d)); o.add(b, v, h); o.position.set(0.2, 0.2, 0.12); o.rotation.z = 0.12; this.spine.add(o); break; }
      case 'dagger': { o = new THREE.Group(); const bl = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.3, 0.01), metalMat(0xd7dce4)); bl.position.y = -0.2; const gd = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.02, 0.03), metalMat(0xd4a840)); gd.position.y = -0.045; const gr = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.1, 8), woodMat()); gr.position.y = 0.0; o.add(bl, gd, gr); this.R.hd.add(o); break; }
      case 'club': { o = new THREE.Group(); const hd = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.08, 0.7, 10), woodMat()); hd.position.y = -0.3; o.add(hd); this.R.hd.add(o); break; }
      case 'trident': { o = new THREE.Group(); const s = new THREE.Mesh(GEO.stick, woodMat()); s.scale.y = 1.2; o.add(s); for (const k of [-1, 0, 1]) { const pr = new THREE.Mesh(new THREE.ConeGeometry(0.02, k === 0 ? 0.26 : 0.2, 6), metalMat(0xb8c4d0)); pr.position.set(k * 0.07, 1.1 + (k === 0 ? 0.04 : 0), 0); o.add(pr); } const cb = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.02, 0.02), metalMat(0xb8c4d0)); cb.position.y = 1.0; o.add(cb); o.position.set(0, 0.1, 0.02); this.R.hd.add(o); break; }
      case 'hair': {   // {type:'hair', style, color}
        const col = c ?? 0x2b2118, st = (typeof a === 'string' ? 'short' : a.style) || 'short', hm = bodyMat(col, 0.7);
        o = new THREE.Group();
        const cap = new THREE.Mesh(GEO.hair, hm); cap.position.set(0, 0.205, -0.012); cap.rotation.x = -0.42; o.add(cap);
        const lock = (x, y, z, sx, sy, rx, rz) => { const l = new THREE.Mesh(GEO.lock, hm); l.position.set(x, y, z); l.scale.set(sx, sy, sx); l.rotation.set(rx, 0, rz); o.add(l); return l; };
        if (st === 'long') { lock(0, 0.04, -0.17, 2.3, 1.7, 0.1, 0); lock(-0.17, 0.12, -0.04, 1, 1.1, 0, 0.1); lock(0.17, 0.12, -0.04, 1, 1.1, 0, -0.1); }
        if (st === 'ponytail') lock(0, 0.1, -0.24, 1.0, 1.6, -0.7, 0);
        if (st === 'bun') { const b = new THREE.Mesh(new THREE.SphereGeometry(0.08, 14, 10), hm); b.position.set(0, 0.36, -0.12); o.add(b); }
        if (st === 'pigtails') { lock(-0.22, 0.1, -0.02, 0.9, 1.3, 0, 0.5); lock(0.22, 0.1, -0.02, 0.9, 1.3, 0, -0.5); }
        if (st === 'spiky') for (let k = 0; k < 7; k++) { const a2 = k / 7 * Math.PI * 2, sp = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.16, 6), hm); sp.position.set(Math.cos(a2) * 0.1, 0.4, Math.sin(a2) * 0.1); sp.rotation.set(Math.sin(a2) * 0.6, 0, -Math.cos(a2) * 0.6); o.add(sp); }
        if (st === 'braid') { lock(0, 0.04, -0.2, 0.8, 2.2, 0.1, 0); }
        this.headG.add(o); break;
      }
      case 'badge': {   // chest emblem of the three assistants: 'claude' (orange burst), 'gemini' (blue four-point spark), 'gpt' (green hex knot)
        const kind = (typeof a === 'string' ? 'claude' : a.kind) || 'claude';
        const sh = new THREE.Shape();
        if (kind === 'claude') {
          const n = 12; for (let k = 0; k < n * 2; k++) { const ang = k / (n * 2) * Math.PI * 2, r = k % 2 ? 0.36 : 1.0; (k ? sh.lineTo : sh.moveTo).call(sh, Math.cos(ang) * r, Math.sin(ang) * r); } sh.closePath();
        } else if (kind === 'gemini') {
          sh.moveTo(0, 1); sh.quadraticCurveTo(0.12, 0.12, 1, 0); sh.quadraticCurveTo(0.12, -0.12, 0, -1); sh.quadraticCurveTo(-0.12, -0.12, -1, 0); sh.quadraticCurveTo(-0.12, 0.12, 0, 1);
        } else {
          for (let k = 0; k < 6; k++) { const ang = k / 6 * Math.PI * 2 + Math.PI / 6; (k ? sh.lineTo : sh.moveTo).call(sh, Math.cos(ang), Math.sin(ang)); } sh.closePath();
          const hole = new THREE.Path(); for (let k = 0; k < 6; k++) { const ang = k / 6 * Math.PI * 2 + Math.PI / 6; (k ? hole.lineTo : hole.moveTo).call(hole, Math.cos(ang) * 0.62, Math.sin(ang) * 0.62); } hole.closePath(); sh.holes.push(hole);
        }
        const col = c ?? { claude: 0xe8794a, gemini: 0x5b8cff, gpt: 0x12b886 }[kind];
        const geo = new THREE.ExtrudeGeometry(sh, { depth: 0.18, bevelEnabled: false });
        o = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: col, emissive: col, emissiveIntensity: 0.45, roughness: 0.35 }));
        o.scale.setScalar(0.105); o.position.set(0, 0.36, 0.205); this.spine.add(o);
        if (kind === 'gpt') { const bar = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.11, 6, 3), o.material); bar.rotation.z = Math.PI / 6; bar.position.z = 0.09; o.add(bar); }
        break;
      }
      case 'glasses': { o = new THREE.Group(); const m = metalMat(0x222222); for (const s of [-1, 1]) { const r = new THREE.Mesh(new THREE.TorusGeometry(0.045, 0.008, 6, 20), m); r.position.set(s * 0.065, 0.2, 0.185); o.add(r); } this.headG.add(o); break; }
    }
    const CARRY = { sword: 0.95, dagger: 0.7, axe: 0.85, hammer: 0.85, club: 0.75, torch: 0.35 };
    if (CARRY[type] !== undefined) this._carry = CARRY[type];
    if (o) { o.traverse(n => { if (n.isMesh) { n.castShadow = true; n.receiveShadow = true; } }); this.props[type] = o; }
    return o;
  }

  setVisibleAcc(type, v) { if (this.props[type]) this.props[type].visible = v; }

  // energy 0..1 ; at 0 the body turns dull grey (shut down)
  setEnergy(e) {
    this.state.energy = e;
    const grey = new THREE.Color(0x55585e);
    const c = this.baseColor.clone().lerp(grey, 1 - smoothstep(0.0, 0.6, e));
    if (!this._ownMat) { // clone material so we can tint this person only
      const m = this.mat.clone(); this._ownMat = m;
      this.root.traverse(n => { if ((n.isMesh || n.isSkinnedMesh) && n.material === this.mat) n.material = m; });
    }
    this._ownMat.color.copy(c);
    this._ownMat.roughness = lerp(0.85, this.def.rough ?? 0.42, e);
  }

  place(x, y, z, yaw = 0) { this.root.position.set(x, y, z); this.root.rotation.y = yaw; }

  // ---------------------------------------------------------------- animation
  // pose(name, t, p) — p: {speed, amount, ...}. Poses can be blended with blend(a, b, k).
  resetPose() {
    const zero = (g) => g.rotation.set(0, 0, 0);
    [this.pelvis, this.spine, this.neck, this.head, this.L.sh, this.L.el, this.L.hd, this.R.sh, this.R.el, this.R.hd,
     this.L.hip, this.L.kn, this.L.an, this.R.hip, this.R.kn, this.R.an].forEach(zero);
    this.pelvis.position.set(0, 0.9, 0);
    this.root.rotation.x = 0; this.root.rotation.z = 0;
    // relaxed arms
    this.L.sh.rotation.z = -0.12; this.R.sh.rotation.z = 0.12;
    this.L.el.rotation.x = -0.12; this.R.el.rotation.x = -0.12;
    this.R.hd.rotation.x = this._carry ?? 0;
  }


  // joint limits: elbows and knees only bend one way
  limits() {
    for (const s of [this.L, this.R]) {
      if (s.el.rotation.x > 0.04) s.el.rotation.x = 0.04;
      if (s.kn.rotation.x < -0.03) s.kn.rotation.x = -0.03;
    }
  }

  // keep the body on the ground: lift it out of the terrain, and (on foot, on terrain) bring floating feet down.
  // gfn(x, z) -> ground height. Returns the vertical correction applied.
  groundFix(gfn, o = {}) {
    if (this._ridden || this.noFix) return 0;
    this.root.updateMatrixWorld(true);
    const S = this.root.scale.y, v = _gv;
    let lift = 0, clear = Infinity;
    for (const f of [this.L.an, this.R.an]) {
      f.getWorldPosition(v);
      const bottom = v.y - 0.122 * S, g = gfn(v.x, v.z);
      lift = Math.max(lift, g - bottom); clear = Math.min(clear, bottom - g);
    }
    const pts = [[this.L.hd, 0.07], [this.R.hd, 0.07], [this.L.kn, 0.09], [this.R.kn, 0.09], [this.head, 0.0], [this.pelvis, 0.1], [this.L.el, 0.06], [this.R.el, 0.06]];
    for (const [b, r] of pts) {
      b.getWorldPosition(v);
      const rr = (b === this.head ? 0.06 : r) * S, g = gfn(v.x, v.z);
      lift = Math.max(lift, g + rr - v.y);
    }
    let dy = 0;
    if (lift > 0.002) dy = lift;
    else if (!o.free && !AIR.has(this._pose) && clear > 0.012 && clear < 0.9 * S) dy = -clear;     // standing/walking: plant the lowest foot
    if (dy) { this.root.position.y += dy; this.root.updateMatrixWorld(true); }
    // blades never dig into the ground: swing the wrist forward until the tip clears it
    for (const [k, tip] of WEAP) {
      const pr = this.props[k]; if (!pr || !pr.visible) continue;
      for (let it = 0; it < 7; it++) {
        v.set(tip[0], tip[1], tip[2]); pr.localToWorld(v);
        if (v.y > gfn(v.x, v.z) + 0.03 * S) break;
        this.R.hd.rotation.x += 0.3; this.root.updateMatrixWorld(true);
      }
    }
    return dy;
  }

  pose(name, t, p = {}) {
    this.resetPose();
    const f = POSES[name] || POSES.idle;
    this._pose = name;
    f(this, t, p);
    this.limits();
    return this;
  }
}

const _gv = new THREE.Vector3();
const WEAP = [['sword', [0, -0.92, 0]], ['axe', [0, -0.85, 0.1]], ['hammer', [0, -0.55, 0]], ['dagger', [0, -0.36, 0]], ['club', [0, -0.65, 0]]];
export const AIR = new Set(['fall', 'sleepCurl', 'sprawl', 'jumpReach', 'tumble', 'climb', 'rideSeat', 'rideCharge', 'throwObj', 'lie', 'dead', 'sleep', 'fallDown', 'getUp']);
const S = Math.sin, Cc = Math.cos;
export const POSES = {
  idle(P, t, p) {
    const ph = (p.phase ?? 0);
    const br = S(t * 1.6 + ph) * 0.012;
    P.pelvis.position.y = 0.9 + br * 0.5;
    P.spine.rotation.x = 0.02 + br;
    P.head.rotation.y = S(t * 0.4 + ph * 3) * 0.25 * (p.look ?? 1);
    P.head.rotation.x = S(t * 0.33 + ph) * 0.05;
    P.L.sh.rotation.x = S(t * 1.1 + ph) * 0.03; P.R.sh.rotation.x = -S(t * 1.1 + ph) * 0.03;
    P.pelvis.rotation.z = S(t * 0.5 + ph) * 0.02;
  },
  walk(P, t, p) {
    const sp = p.speed ?? 1.0, ph = (p.phase ?? 0) + t * 6.0 * sp, a = p.amount ?? 1.0;
    const sw = S(ph) * 0.52 * a;
    P.L.hip.rotation.x = sw; P.R.hip.rotation.x = -sw;
    P.L.kn.rotation.x = Math.max(0, -Cc(ph)) * 0.9 * a + 0.05; P.R.kn.rotation.x = Math.max(0, Cc(ph)) * 0.9 * a + 0.05;
    P.L.an.rotation.x = -sw * 0.3; P.R.an.rotation.x = sw * 0.3;
    P.L.sh.rotation.x = -sw * 0.75; P.R.sh.rotation.x = sw * 0.75;
    P.L.el.rotation.x = -0.25 - Math.max(0, S(ph)) * 0.35; P.R.el.rotation.x = -0.25 - Math.max(0, -S(ph)) * 0.35;
    P.pelvis.position.y = 0.9 - 0.018 * a + Math.abs(Cc(ph)) * 0.035 * a;
    P.pelvis.rotation.y = S(ph) * 0.08 * a;
    P.spine.rotation.y = -S(ph) * 0.12 * a;
    P.spine.rotation.x = 0.06 * a;
    P.head.rotation.y = (p.look ?? 0);
  },
  run(P, t, p) {
    POSES.walk(P, t, { ...p, speed: (p.speed ?? 1) * 1.7, amount: 1.45 });
    P.pelvis.position.y -= 0.1;
    P.spine.rotation.x = 0.22; P.L.el.rotation.x -= 0.6; P.R.el.rotation.x -= 0.6;
  },
  wave(P, t, p) {
    POSES.idle(P, t, p);
    const s = p.side === 'L' ? P.L : P.R, sg = p.side === 'L' ? -1 : 1;
    s.sh.rotation.z = sg * (2.55 + S(t * 7) * 0.12); s.sh.rotation.x = -0.15;
    s.el.rotation.x = 0; s.el.rotation.z = sg * (S(t * 7) * 0.35);
    P.spine.rotation.z = -sg * 0.06; P.head.rotation.z = -sg * 0.05;
  },
  raiseHand(P, t, p) {   // the reference pose: one arm straight up, slight lean
    POSES.idle(P, t, { ...p, look: 0.2 });
    const s = p.side === 'L' ? P.L : P.R, sg = p.side === 'L' ? -1 : 1;
    s.sh.rotation.z = sg * 2.85; s.sh.rotation.x = -0.1; s.el.rotation.x = -0.1;
    const o = p.side === 'L' ? P.R : P.L;
    o.sh.rotation.z = -sg * 0.35; o.sh.rotation.x = 0.4; o.el.rotation.x = -0.9;
    P.spine.rotation.z = -sg * 0.1; P.head.rotation.z = -sg * 0.08; P.head.rotation.x = -0.12;
  },
  point(P, t, p) {
    POSES.idle(P, t, p);
    P.R.sh.rotation.x = -1.45; P.R.sh.rotation.z = 0.15 + (p.aim ?? 0); P.R.el.rotation.x = -0.05;
    P.spine.rotation.y = -0.15;
  },
  cheer(P, t, p) {
    const b = Math.abs(S(t * 6 + (p.phase ?? 0)));
    P.pelvis.position.y = 0.9 + b * 0.05;
    P.L.sh.rotation.z = -2.6 - b * 0.2; P.R.sh.rotation.z = 2.6 + b * 0.2;
    P.L.el.rotation.z = -0.3; P.R.el.rotation.z = 0.3;
    P.head.rotation.x = -0.2;
  },
  lookUp(P, t, p) {
    POSES.idle(P, t, { ...p, look: 0.1 });
    P.head.rotation.x = -0.75 * (p.amount ?? 1); P.neck.rotation.x = -0.25 * (p.amount ?? 1); P.spine.rotation.x = -0.1;
  },
  sit(P, t, p) {
    P.pelvis.position.y = (p.seat ?? 0.48);
    P.L.hip.rotation.x = -1.5; P.R.hip.rotation.x = -1.45;
    P.L.kn.rotation.x = 1.45; P.R.kn.rotation.x = 1.5;
    P.spine.rotation.x = 0.12 + S(t * 1.5) * 0.01;
    P.L.sh.rotation.x = -0.55; P.R.sh.rotation.x = -0.55; P.L.el.rotation.x = -0.9; P.R.el.rotation.x = -0.9;
    P.L.sh.rotation.z = 0.2; P.R.sh.rotation.z = -0.2;
    P.head.rotation.x = (p.headX ?? -0.05); P.head.rotation.y = (p.look ?? 0);
  },
  sitGround(P, t, p) {
    P.pelvis.position.y = 0.46;
    P.L.hip.rotation.x = -1.35; P.R.hip.rotation.x = -1.35; P.L.hip.rotation.z = -0.35; P.R.hip.rotation.z = 0.35;
    P.L.kn.rotation.x = 2.1; P.R.kn.rotation.x = 2.1;
    P.spine.rotation.x = 0.25; P.L.sh.rotation.x = -0.7; P.R.sh.rotation.x = -0.7; P.L.el.rotation.x = -1.0; P.R.el.rotation.x = -1.0;
    P.head.rotation.x = (p.headX ?? 0.1);
  },
  kneelPray(P, t, p) {
    P.pelvis.position.y = 0.5;
    P.L.hip.rotation.x = -0.2; P.R.hip.rotation.x = -0.2; P.L.kn.rotation.x = 1.6; P.R.kn.rotation.x = 1.6;
    P.L.an.rotation.x = 0.4; P.R.an.rotation.x = 0.4;
    const up = p.armsUp ?? 1;
    P.L.sh.rotation.z = -2.4 * up; P.R.sh.rotation.z = 2.4 * up; P.L.sh.rotation.x = -0.5 * up; P.R.sh.rotation.x = -0.5 * up;
    P.head.rotation.x = -0.5 * up + S(t) * 0.02; P.spine.rotation.x = -0.1 * up + 0.3 * (1 - up);
  },
  bow(P, t, p) {
    POSES.idle(P, t, p);
    P.spine.rotation.x = 0.85 * (p.amount ?? 1); P.head.rotation.x = 0.3;
    P.L.sh.rotation.x = 0.3; P.R.sh.rotation.x = 0.3;
  },
  eat(P, t, p) {
    POSES.idle(P, t, p);
    const k = 0.5 + 0.5 * S(t * 3.2);
    P.R.sh.rotation.x = -1.1 - k * 0.6; P.R.el.rotation.x = -1.6 - k * 0.5; P.R.sh.rotation.z = 0.35;
    P.head.rotation.x = 0.12;
  },
  carry(P, t, p) {
    POSES.walk(P, t, { ...p, amount: 0.7 });
    P.L.sh.rotation.x = -0.9; P.R.sh.rotation.x = -0.9; P.L.el.rotation.x = -0.6; P.R.el.rotation.x = -0.6;
    P.L.sh.rotation.z = 0.25; P.R.sh.rotation.z = -0.25;
  },
  hoe(P, t, p) {  // farming: swing down and up
    const k = 0.5 + 0.5 * S(t * 2.6 + (p.phase ?? 0));
    P.spine.rotation.x = 0.35 + k * 0.45;
    P.L.sh.rotation.x = -1.6 + k * 1.3; P.R.sh.rotation.x = -1.5 + k * 1.3; P.L.el.rotation.x = -0.3; P.R.el.rotation.x = -0.4;
    P.L.hip.rotation.x = -0.25; P.R.hip.rotation.x = 0.15; P.L.kn.rotation.x = 0.35; P.R.kn.rotation.x = 0.1;
    P.pelvis.position.y = 0.86;
  },
  dig(P, t, p) { POSES.hoe(P, t * 1.2, p); P.spine.rotation.x += 0.15; },
  plant(P, t, p) {
    P.pelvis.position.y = 0.5;
    P.L.hip.rotation.x = -1.2; P.R.hip.rotation.x = 0.1; P.L.kn.rotation.x = 1.9; P.R.kn.rotation.x = 1.7; P.R.an.rotation.x = 0.6;
    P.spine.rotation.x = 0.5;
    const k = 0.5 + 0.5 * S(t * 2.0);
    P.R.sh.rotation.x = -0.9 - k * 0.4; P.R.el.rotation.x = -0.2;
    P.head.rotation.x = 0.4;
  },
  talk(P, t, p) {
    POSES.idle(P, t, p);
    const k = S(t * 3.3 + (p.phase ?? 0)), k2 = S(t * 2.1 + 1.3 + (p.phase ?? 0));
    P.R.sh.rotation.x = -0.45 - 0.25 * k; P.R.el.rotation.x = -0.9 - 0.2 * k2; P.R.sh.rotation.z = 0.25;
    P.L.sh.rotation.x = -0.3 - 0.2 * k2; P.L.el.rotation.x = -0.8; P.L.sh.rotation.z = -0.2;
    P.head.rotation.x = 0.04 * k; P.head.rotation.y = (p.look ?? 0) + 0.1 * k2;
  },
  shrug(P, t, p) {
    POSES.idle(P, t, p);
    const k = smoothstep(0, 0.3, (t % 2.2) / 2.2) * (1 - smoothstep(0.6, 0.9, (t % 2.2) / 2.2));
    P.L.sh.rotation.z = -0.5 - 0.3 * k; P.R.sh.rotation.z = 0.5 + 0.3 * k; P.L.el.rotation.x = -1.4; P.R.el.rotation.x = -1.4;
    P.L.el.rotation.y = 0.6; P.R.el.rotation.y = -0.6; P.head.rotation.z = 0.15 * k;
  },
  scratchHead(P, t, p) {
    POSES.idle(P, t, p);
    P.R.sh.rotation.z = 2.2; P.R.sh.rotation.x = -0.6; P.R.el.rotation.x = -1.9 + S(t * 9) * 0.15;
    P.head.rotation.z = -0.12;
  },
  facepalm(P, t, p) {
    POSES.idle(P, t, p);
    P.R.sh.rotation.x = -1.5; P.R.el.rotation.x = -2.2; P.R.sh.rotation.z = 0.4; P.head.rotation.x = 0.35; P.spine.rotation.x = 0.15;
  },
  jumpReach(P, t, p) {  // trying to grab a cloud
    const ph = (t * 1.3 + (p.phase ?? 0)) % 1;
    const j = Math.max(0, S(ph * Math.PI)) ;
    P.pelvis.position.y = 0.9 + j * 0.55 - (ph < 0.1 ? 0.15 : 0);
    P.R.sh.rotation.z = 2.9; P.L.sh.rotation.z = -0.4 - j * 1.6;
    P.L.kn.rotation.x = j * 0.6; P.R.kn.rotation.x = j * 0.8; P.L.hip.rotation.x = -j * 0.3;
    P.head.rotation.x = -0.6;
  },
  fallDown(P, t, p) {   // topples over backwards (feet stay planted), then lies on its back
    const k = smoothstep(0, 1.0, t), ph = p.phase ?? 0;
    P.root.rotation.x = -k * 1.52;
    P.pelvis.position.y = 0.9 - 0.12 * Math.sin(k * Math.PI);
    P.L.sh.rotation.z = -0.25 - 0.9 * k - 0.2 * S(ph); P.R.sh.rotation.z = 0.25 + 0.7 * k + 0.2 * S(ph + 1);
    P.L.sh.rotation.x = 0.2 * k; P.R.sh.rotation.x = -0.1 * k; P.L.el.rotation.x = -0.25 * k; P.R.el.rotation.x = -0.5 * k;
    P.L.kn.rotation.x = 0.12 * k; P.R.kn.rotation.x = 0.3 * k; P.L.hip.rotation.z = -0.1 * k; P.R.hip.rotation.z = 0.12 * k;
    P.head.rotation.x = -0.1 * k; P.head.rotation.y = 0.35 * k * (ph > 1.5 ? -1 : 1);
  },
  lie(P, t, p) { POSES.fallDown(P, 9, p); },
  getUp(P, t, p) { POSES.fallDown(P, Math.max(0, 1.4 - t * (p.speed ?? 1)), p); },
  sleep(P, t, p) { POSES.fallDown(P, 9, p); P.spine.rotation.x += S(t * 1.2) * 0.01; },
  pushSpear(P, t, p) {  // guard stance with spear
    POSES.idle(P, t, p);
    P.R.sh.rotation.x = -0.35; P.R.el.rotation.x = -1.2; P.R.hd.rotation.x = 1.25;
    P.L.hip.rotation.x = -0.18; P.R.hip.rotation.x = 0.18;
  },
  dropSpear(P, t, p) {
    POSES.pushSpear(P, t, p);
    const k = smoothstep(0, 0.8, t);
    P.R.sh.rotation.x = lerp(-0.35, 0.05, k); P.R.el.rotation.x = lerp(-1.2, -0.1, k); P.R.hd.rotation.x = lerp(1.25, 0.2, k);
    P.head.rotation.x = lerp(0, 0.35, k);
  },
  holdTorch(P, t, p) {
    POSES.walk(P, t, { ...p, amount: p.walking ? 0.8 : 0.0 });
    P.R.sh.rotation.x = -1.0 - S(t * 2 + (p.phase ?? 0)) * 0.05; P.R.sh.rotation.z = 0.15; P.R.el.rotation.x = -0.9;
  },
  armsCrossed(P, t, p) {
    POSES.idle(P, t, p);
    P.L.sh.rotation.x = -0.6; P.R.sh.rotation.x = -0.6; P.L.el.rotation.x = -1.6; P.R.el.rotation.x = -1.6;
    P.L.el.rotation.y = -1.0; P.R.el.rotation.y = 1.0; P.L.sh.rotation.z = 0.25; P.R.sh.rotation.z = -0.25;
  },
  armsOpen(P, t, p) {  // announcing, addressing a crowd
    POSES.idle(P, t, p);
    const k = 0.5 + 0.5 * S(t * 1.4);
    P.L.sh.rotation.z = -1.1 - 0.25 * k; P.R.sh.rotation.z = 1.1 + 0.25 * k; P.L.sh.rotation.x = -0.4; P.R.sh.rotation.x = -0.4;
    P.L.el.rotation.x = -0.25; P.R.el.rotation.x = -0.25; P.head.rotation.x = -0.12; P.spine.rotation.x = -0.06;
  },
  sad(P, t, p) {
    POSES.idle(P, t, { ...p, look: 0 });
    P.head.rotation.x = 0.55; P.spine.rotation.x = 0.22; P.L.sh.rotation.x = 0.1; P.R.sh.rotation.x = 0.1;
  },
  headInHands(P, t, p) {
    POSES.sit(P, t, p);
    P.spine.rotation.x = 0.55; P.head.rotation.x = 0.5;
    P.L.sh.rotation.x = -1.2; P.R.sh.rotation.x = -1.2; P.L.el.rotation.x = -2.0; P.R.el.rotation.x = -2.0;
    P.L.sh.rotation.z = 0.35; P.R.sh.rotation.z = -0.35;
  },
  bumpTree(P, t, p) {  // walks forward then bounces back
    const c = (t * 0.6) % 1;
    if (c < 0.7) POSES.walk(P, t, { amount: 0.8 });
    else { POSES.idle(P, t, p); P.spine.rotation.x = -0.25 * (1 - (c - 0.7) / 0.3); P.head.rotation.x = -0.3 * (1 - (c - 0.7) / 0.3); }
  },
  throwObj(P, t, p) {
    const k = smoothstep(0, 0.35, t % 1.6) - smoothstep(0.35, 0.7, t % 1.6);
    POSES.idle(P, t, p);
    P.R.sh.rotation.x = lerp(0.6, -2.2, k); P.R.el.rotation.x = -0.4; P.spine.rotation.y = lerp(0.3, -0.3, k);
  },
};


// ---- combat, riding, crafts (Day 365 film)
Object.assign(POSES, {
  drawBow(P, t, p) {         // bow in the left hand, string pulled by the right
    POSES.idle(P, t, { ...p, look: 0 });
    const k = p.draw ?? (0.6 + 0.4 * smoothstep(0, 1.2, t % 2.4));
    P.spine.rotation.y = 0.9; P.head.rotation.y = -0.85;
    P.L.sh.rotation.x = -1.5; P.L.sh.rotation.z = 0.05; P.L.el.rotation.x = -0.04;
    P.R.sh.rotation.x = -1.35; P.R.sh.rotation.z = 0.35 + 0.4 * k; P.R.el.rotation.x = -2.0 * k - 0.2; P.R.el.rotation.y = 0.5;
    P.L.hip.rotation.x = -0.12; P.R.hip.rotation.x = 0.12; P.L.hip.rotation.z = -0.1; P.R.hip.rotation.z = 0.1;
  },
  shoot(P, t, p) { POSES.drawBow(P, t, { ...p, draw: Math.max(0, 1 - ((t * 3) % 1) * 3) * 0.9 + 0.05 }); },
  swing(P, t, p) {           // sword/axe overhead chop, looping
    POSES.idle(P, t, { ...p, look: 0 });
    const c = ((t * (p.speed ?? 1.1) + (p.phase ?? 0) * 0.1) % 1), k = smoothstep(0.0, 0.45, c) * (1 - smoothstep(0.6, 1.0, c));
    P.R.sh.rotation.x = lerp(-3.0, -0.5, smoothstep(0.3, 0.55, c)) * (1) + (c < 0.3 ? 0 : 0); P.R.sh.rotation.z = 0.2; P.R.el.rotation.x = lerp(-1.1, -0.1, smoothstep(0.3, 0.55, c));
    P.spine.rotation.x = lerp(-0.2, 0.5, smoothstep(0.3, 0.55, c)); P.spine.rotation.y = lerp(0.3, -0.3, smoothstep(0.3, 0.55, c));
    P.L.sh.rotation.x = -0.9; P.L.el.rotation.x = -1.0; P.L.hip.rotation.x = -0.3; P.R.hip.rotation.x = 0.25; P.L.kn.rotation.x = 0.3;
    P.pelvis.position.y = 0.86;
  },
  guard(P, t, p) {           // shield up, sword ready
    POSES.idle(P, t, { ...p, look: 0 });
    P.L.sh.rotation.x = -1.1; P.L.sh.rotation.z = 0.3; P.L.el.rotation.x = -1.2; P.R.sh.rotation.x = -1.2; P.R.el.rotation.x = -0.8;
    P.L.hip.rotation.x = -0.25; P.R.hip.rotation.x = 0.2; P.L.kn.rotation.x = 0.3; P.pelvis.position.y = 0.86; P.spine.rotation.x = 0.1;
  },
  march(P, t, p) { POSES.walk(P, t, { ...p, amount: 1.1, speed: p.speed ?? 0.95 }); P.R.sh.rotation.x = -0.9; P.R.el.rotation.x = -0.4; P.L.sh.rotation.x = -0.35; },
  rideSeat(P, t, p) {        // sitting astride a horse
    const b = S(t * (p.cadence ?? 7) * (p.gait ?? 0) + (p.phase ?? 0));
    P.pelvis.position.y = 0.72 + Math.abs(b) * 0.03 * (p.gait ?? 0);
    P.L.hip.rotation.x = -1.0; P.R.hip.rotation.x = -1.0; P.L.hip.rotation.z = -0.55; P.R.hip.rotation.z = 0.55;
    P.L.kn.rotation.x = 1.05; P.R.kn.rotation.x = 1.05;
    P.spine.rotation.x = 0.08 + (p.lean ?? 0); P.head.rotation.y = p.look ?? 0;
    P.L.sh.rotation.x = -0.75; P.R.sh.rotation.x = -0.75; P.L.el.rotation.x = -0.9; P.R.el.rotation.x = -0.9;
    P.L.sh.rotation.z = -0.15; P.R.sh.rotation.z = 0.15;
  },
  rideCharge(P, t, p) { POSES.rideSeat(P, t, { ...p, gait: 1, lean: 0.38 }); P.R.sh.rotation.x = -1.6; P.R.sh.rotation.z = 0.05; P.R.el.rotation.x = -0.15; },
  hammer(P, t, p) {          // smith at the anvil
    const c = (t * 1.6 + (p.phase ?? 0) * 0.2) % 1, k = smoothstep(0.0, 0.5, c) * (1 - smoothstep(0.5, 0.62, c));
    POSES.idle(P, t, { ...p, look: 0 });
    P.R.sh.rotation.x = lerp(-0.6, -2.7, k); P.R.el.rotation.x = lerp(-0.4, -0.9, k); P.L.sh.rotation.x = -0.8; P.L.el.rotation.x = -0.8;
    P.spine.rotation.x = 0.25 + (1 - k) * 0.15; P.head.rotation.x = 0.35;
  },
  chop(P, t, p) { POSES.swing(P, t * 0.9, { ...p, speed: 0.9 }); P.spine.rotation.y *= 0.4; P.R.sh.rotation.x += 0.2; P.head.rotation.x = 0.2; },
  climb(P, t, p) {
    const ph = t * 3.2 + (p.phase ?? 0), a = S(ph), b = S(ph + Math.PI);
    P.spine.rotation.x = 0.08;
    P.L.sh.rotation.x = -2.5 + a * 0.5; P.R.sh.rotation.x = -2.5 + b * 0.5; P.L.el.rotation.x = -0.5 - a * 0.4; P.R.el.rotation.x = -0.5 - b * 0.4;
    P.L.hip.rotation.x = -0.9 + a * 0.5; P.R.hip.rotation.x = -0.9 + b * 0.5; P.L.kn.rotation.x = 1.2 - a * 0.5; P.R.kn.rotation.x = 1.2 - b * 0.5;
    P.head.rotation.x = -0.35;
  },
  crouch(P, t, p) {          // sneaking / hiding
    POSES.idle(P, t, { ...p, look: 0.3 });
    P.pelvis.position.y = 0.46; P.L.hip.rotation.x = -1.1; P.R.hip.rotation.x = -0.9; P.L.kn.rotation.x = 1.9; P.R.kn.rotation.x = 1.7;
    P.spine.rotation.x = 0.55; P.L.sh.rotation.x = -0.4; P.R.sh.rotation.x = -0.4; P.L.el.rotation.x = -0.9; P.R.el.rotation.x = -0.9;
  },
  touchWall(P, t, p) {       // one hand flat on the wall, the other at the side
    POSES.idle(P, t, { ...p, look: 0 });
    P.R.sh.rotation.x = -1.45; P.R.sh.rotation.z = 0.12; P.R.el.rotation.x = -0.1; P.spine.rotation.x = 0.12; P.head.rotation.x = 0.15;
  },
  listen(P, t, p) {          // ear against the wall
    POSES.idle(P, t, { ...p, look: 0 });
    P.spine.rotation.x = 0.1; P.spine.rotation.z = -0.28; P.head.rotation.z = -0.4; P.head.rotation.y = 0.3;
    P.L.sh.rotation.x = -1.0; P.L.el.rotation.x = -0.5;
  },
  speak(P, t, p) {           // addressing a crowd with one raised arm
    POSES.idle(P, t, { ...p, look: 0.05 });
    const k = S(t * 2.2 + (p.phase ?? 0)), k2 = S(t * 1.3);
    P.R.sh.rotation.z = 1.9 + 0.25 * k; P.R.sh.rotation.x = -0.3; P.R.el.rotation.x = -0.35 + 0.2 * k2; P.L.sh.rotation.x = -0.5 - 0.15 * k2; P.L.el.rotation.x = -0.7;
    P.head.rotation.x = -0.1; P.spine.rotation.x = -0.05;
  },
  pray(P, t, p) { POSES.kneelPray(P, t, { ...p, armsUp: p.armsUp ?? 0.7 }); },
  praise(P, t, p) {          // standing, arms raised to the sky
    POSES.idle(P, t, { ...p, look: 0 });
    P.L.sh.rotation.z = -2.6 - 0.08 * S(t * 2); P.R.sh.rotation.z = 2.6 + 0.08 * S(t * 2); P.L.sh.rotation.x = -0.35; P.R.sh.rotation.x = -0.35;
    P.head.rotation.x = -0.55; P.spine.rotation.x = -0.12;
  },
  handshake(P, t, p) { POSES.idle(P, t, { ...p, look: 0.1 }); P.R.sh.rotation.x = -1.3; P.R.sh.rotation.z = 0.1; P.R.el.rotation.x = -0.35; },
  cower(P, t, p) { POSES.crouch(P, t, p); P.L.sh.rotation.x = -1.5; P.R.sh.rotation.x = -1.5; P.L.el.rotation.x = -2.0; P.R.el.rotation.x = -2.0; P.head.rotation.x = 0.5; },
  stagger(P, t, p) { POSES.idle(P, t, p); const k = S(t * 5) * 0.2; P.spine.rotation.x = 0.35 + k; P.L.sh.rotation.x = -0.9; P.R.sh.rotation.x = 0.6; P.L.hip.rotation.x = -0.4; P.R.hip.rotation.x = 0.35; P.head.rotation.x = 0.3; },
  dead(P, t, p) { POSES.fallDown(P, 9, p); },
  tumble(P, t, p) {          // thrown off a horse: flips and lands
    const k = smoothstep(0, 1.1, t);
    P.root.rotation.x = -k * Math.PI * 1.7 * (1 - smoothstep(0.7, 1.1, t) * 0.0);
    P.pelvis.position.y = 0.9 + Math.sin(k * Math.PI) * 0.9 - 0.0;
    P.L.sh.rotation.z = -2.2; P.R.sh.rotation.z = 2.2; P.L.hip.rotation.x = -0.6; P.R.hip.rotation.x = -0.3;
    if (t > 1.1) { POSES.fallDown(P, 9, p); P.root.rotation.x = 0; }
  },
});

// ----------------------------------------------------------------- the cast
// founders keep their two-digit IDs; everyone born later carries a longer serial number
export const CAST = {
  ISE:   { id: '07', name: 'ISE', color: 0xff7a1a, scale: 0.98 },
  MIRA:  { id: '04', name: 'MIRA', color: 0x9b5cff, scale: 0.95, headScale: 1.03 },
  BO:    { id: '09', name: 'BO', color: 0xffc21a, scale: 1.06, width: 1.12 },
  TAM:   { id: '11', name: 'TAM', color: 0x3ac46b, scale: 1.02 },
  A15:   { id: '15', name: 'A-15', color: 0x63d6c6, scale: 0.93 },
  LIO:   { id: '412', name: 'LIO', color: 0xc8743e, scale: 1.0, acc: [{ type: 'headband', color: 0x6b3e1f }, { type: 'belt', color: 0x5a3a22 }] },
  KASSA: { id: '806', name: 'KASSA', color: 0xd8213a, scale: 1.08, width: 1.05 },
  SELA:  { id: '2710', name: 'SELA', color: 0xf0d38a, scale: 0.96, acc: [{ type: 'robe', color: 0xf6efdc }, { type: 'headband', color: 0xd4a840 }] },
  VARO:  { id: '5528', name: 'VARO', color: 0xbfa8f5, scale: 1.1, width: 1.2, acc: [{ type: 'robe', color: 0x5b3f8f }, { type: 'hat', color: 0xe8d9a8 }] },
  KASSA7:  { id: '5013', name: 'KASSA VII', color: 0xcc1f3f, scale: 1.1, width: 1.06 },
  PELL:  { id: '6150', name: 'PELL', color: 0x86a9d0, scale: 0.98, acc: ['glasses', { type: 'belt', color: 0x4a3a2a }, 'bag'] },
  KASSA19: { id: '9822', name: 'KASSA XIX', color: 0x9e1a30, scale: 1.04 },
  ORUN:  { id: '9461', name: 'ORUN', color: 0x2f7bff, scale: 0.97 },
  DORN:  { id: '9307', name: 'DORN', color: 0xe3be62, scale: 1.14, width: 1.12, acc: [{ type: 'helmet', color: 0xc9a94a }, { type: 'sash', color: 0xb3122a }, 'spear'] },
  NIA:   { id: '11204', name: 'NIA', color: 0xff79bf, scale: 0.94, acc: [{ type: 'scarf', color: 0x2b2d42 }, 'flower'] },
  AMA:   { id: '3071', name: 'AMA', color: 0x2fb3c6, scale: 0.97, acc: [{ type: 'headband', color: 0x1d5f6b }, { type: 'belt', color: 0x4a3a2a }] },
  YUNA:  { id: '7711', name: 'YUNA', color: 0xc8553d, scale: 0.94, acc: [{ type: 'scarf', color: 0x8a4a22 }, 'staff'] },
  SEFA:  { id: '16402', name: 'SEFA', color: 0x6fcf7f, scale: 0.96, acc: [{ type: 'scarf', color: 0x3d6b3a }, 'bag'] },
  KASSA11: { id: '7316', name: 'KASSA XI', color: 0xb81c36, scale: 1.12, width: 1.08, acc: ['crown', { type: 'cape', color: 0x7a0f1f }] },
  HOODIE: { id: null, name: 'ME', color: 0x8d9099, scale: 1.0, acc: [{ type: 'hood', color: 0x2f333b }, { type: 'robe', color: 0x2f333b }] },
  // ---- Part 2 cast (years 2040+): the three leads wear the badge of an assistant (orange burst / green hex / blue spark)
  ARU:   { id: '20311', name: 'ARU', color: 0xf08a3a, scale: 1.0, acc: [{ type: 'hair', style: 'short', color: 0x3a2412 }, { type: 'sash', color: 0x2a5bd7 }, { type: 'badge', kind: 'claude' }] },
  BRAX:  { id: '20457', name: 'BRAX', color: 0x1fb584, scale: 1.1, width: 1.12, acc: [{ type: 'helmet', color: 0xf2c230 }, { type: 'belt', color: 0x4a3a2a }, 'hammer', { type: 'badge', kind: 'gpt' }] },
  NERI:  { id: '20629', name: 'NERI', color: 0x6b86ff, scale: 0.95, acc: [{ type: 'headband', color: 0xf4f0ff }, { type: 'scarf', color: 0x2b2d6b }, 'glasses', { type: 'badge', kind: 'gemini' }] },
  MARU:  { id: '20733', name: 'MARU', color: 0x2fb3c6, scale: 0.98, acc: [{ type: 'robe', color: 0xdff6f2 }, { type: 'headband', color: 0x1d5f6b }, 'flower'] },
  KUMA:  { id: '20841', name: 'KUMA', color: 0xc9a05a, scale: 1.04, width: 1.08, acc: [{ type: 'hat', color: 0x8a6a45 }, { type: 'scarf', color: 0x8a4a22 }, 'staff'] },
  ZOL:   { id: '20977', name: 'ZOL', color: 0xffc233, scale: 1.02, width: 1.1, acc: [{ type: 'robe', color: 0xff8a1c }, { type: 'hat', color: 0xffffff }] },
  RIA:   { id: '21004', name: 'RIA', color: 0xe0507a, scale: 1.04, acc: [{ type: 'helmet', color: 0x9a9fa8 }, { type: 'sash', color: 0xb3122a }, { type: 'pack', color: 0x6b7a4a }] },
  LUMI:  { id: '21150', name: 'LUMI', color: 0xff7ac8, scale: 0.84, headScale: 1.06, acc: [{ type: 'hair', style: 'short', color: 0x2b1b3a }, 'goggles'] },
  STATUE: { id: null, name: 'STATUE', color: 0x948c7e, rough: 0.95, scale: 1.0 },
};
// the other fifteen founders: white/light-grey bodies with small coloured details (hands/feet)
const EXTRA = [1, 2, 3, 5, 6, 8, 10, 12, 13, 14, 16, 17, 18, 19, 20];
const ACCENTS = [0x9fb8d6, 0xd6b89f, 0xb8d69f, 0xd69fc4, 0xc4c4c4, 0x9fd6cf, 0xe0d39a, 0xb0a6dc, 0xd99a9a, 0xa6cfa0, 0xcfcfa6, 0x9fb0c9, 0xdcb0a6];
const WHITES = [0xf2f2f2, 0xeeeeea, 0xf4f1ec, 0xe9ecef, 0xe4e4e4];
EXTRA.forEach((n, i) => {
  const r = mulberry32(n * 7 + 3);
  CAST['A' + String(n).padStart(2, '0')] = {
    id: String(n).padStart(2, '0'), name: 'A-' + String(n).padStart(2, '0'),
    color: WHITES[i % WHITES.length], scale: 0.92 + 0.16 * r(), width: 0.92 + 0.16 * r(), headScale: 0.95 + 0.1 * r(),
    handColor: r() < 0.5 ? ACCENTS[i % ACCENTS.length] : undefined, footColor: r() < 0.5 ? ACCENTS[(i + 4) % ACCENTS.length] : undefined,
  };
});
// villagers of later generations (V1..V48) and children (C1..C16)
for (let k = 1; k <= 48; k++) {
  const r = mulberry32(k * 131 + 17);
  CAST['V' + k] = { id: String(100 + Math.floor(r() * 9800)), name: 'V' + k, color: WHITES[k % WHITES.length], scale: 0.9 + 0.2 * r(), width: 0.9 + 0.2 * r(), headScale: 0.95 + 0.1 * r(),
    handColor: r() < 0.4 ? ACCENTS[k % ACCENTS.length] : undefined, footColor: r() < 0.4 ? ACCENTS[(k + 5) % ACCENTS.length] : undefined };
}
for (let k = 1; k <= 16; k++) {
  const r = mulberry32(k * 977 + 5);
  CAST['C' + k] = { id: String(20 + k), name: 'C' + k, color: WHITES[k % WHITES.length], scale: 0.56 + 0.08 * r(), headScale: 1.12, handColor: r() < 0.5 ? ACCENTS[k % ACCENTS.length] : undefined };
}
export const ALL20 = ['ISE', 'MIRA', 'BO', 'TAM', 'A15', ...EXTRA.map(n => 'A' + String(n).padStart(2, '0'))];
export const VILLAGERS = [...Array(48)].map((_, k) => 'V' + (k + 1));

// the other peoples: Nuvians (lake, teal) and Tamari (plain, ochre) — accessories for villager bodies
export const NUV_ACC = [[{ type: 'headband', color: 0x2a9db0 }], [{ type: 'sash', color: 0x2a9db0 }], [{ type: 'scarf', color: 0x1f7f8f }],
  [{ type: 'headband', color: 0x2a9db0 }, { type: 'belt', color: 0xd8cfb8 }], [{ type: 'sash', color: 0x58c4d4 }]];
export const TAM_ACC = [[{ type: 'scarf', color: 0xb5813a }, 'staff'], [{ type: 'hat', color: 0x8a5a2b }], [{ type: 'scarf', color: 0x9a3b2a }],
  [{ type: 'belt', color: 0x8a5a2b }, 'bag'], [{ type: 'hat', color: 0xc9a46a }, { type: 'scarf', color: 0x9a3b2a }]];

// ---- the Day 365 cast: seven named leaders per side + rank-and-file bodies
Object.assign(CAST, {
  WREN:  { id: '0113', name: 'WREN',  color: 0x78e08a, scale: 0.93, acc: [{ type: 'headband', color: 0x2f7d3a }, 'bag'] },
  OAK:   { id: '0247', name: 'OAK',   color: 0x8fa13c, scale: 1.13, width: 1.16, acc: [{ type: 'belt', color: 0x5a3a22 }, 'axe'] },
  FERN:  { id: '0382', name: 'FERN',  color: 0xaee6bd, scale: 0.97, acc: [{ type: 'scarf', color: 0x3f8f5a }, 'flower', 'bag'] },
  BRAM:  { id: '0455', name: 'BRAM',  color: 0x1f8a52, scale: 1.09, width: 1.08, acc: [{ type: 'headband', color: 0x1b3d26 }, 'bow', 'quiver'] },
  MOSS:  { id: '0516', name: 'MOSS',  color: 0x8aa8a2, scale: 1.04, acc: [{ type: 'robe', color: 0x4a6b47 }, 'antlers', 'staff'] },
  IVY:   { id: '0631', name: 'IVY',   color: 0x2fd0b0, scale: 0.99, acc: [{ type: 'sash', color: 0x1c7a5c }, { type: 'scarf', color: 0xf0ead0 }] },
  THORN: { id: '0774', name: 'THORN', color: 0x4a5a2c, scale: 1.05, acc: [{ type: 'headband', color: 0x1c1f12 }, { type: 'scarf', color: 0x1c1f12 }, 'axe'] },
  PINE:  { id: '0988', name: 'PINE',  color: 0xa8efc8, scale: 0.78, headScale: 1.1, acc: [{ type: 'headband', color: 0x2f7d3a }] },
  BARK:  { id: '0865', name: 'BARK',  color: 0x6cb27a, scale: 1.0, acc: [{ type: 'headband', color: 0x2f7d3a }, 'bow'] },
  SOL:   { id: '1102', name: 'SOL',   color: 0xffc72e, scale: 1.04, acc: [{ type: 'hat', color: 0xe6c25a }, 'bag', 'staff'] },
  DUNE:  { id: '1219', name: 'DUNE',  color: 0xe8892a, scale: 1.0, acc: [{ type: 'headband', color: 0xa23a1a }, { type: 'belt', color: 0x5a3a22 }] },
  ASH:   { id: '1333', name: 'ASH',   color: 0xa9a49b, scale: 1.08, width: 1.16, acc: [{ type: 'belt', color: 0x3a2b1f }, 'hammer'] },
  KESH:  { id: '1447', name: 'KESH',  color: 0xd9452d, scale: 1.12, width: 1.06, acc: [{ type: 'helmet', color: 0xd8b24a }, { type: 'cape', color: 0x8d1224 }, 'sword', { type: 'shield', color: 0xe0902a }] },
  LARK:  { id: '1562', name: 'LARK',  color: 0xfff2b8, scale: 0.97, acc: [{ type: 'robe', color: 0xf6d36a }, 'sunCrown'] },
  REED:  { id: '1676', name: 'REED',  color: 0xe9b86a, scale: 0.97, acc: [{ type: 'hat', color: 0x9a6a33 }, 'bag', { type: 'scarf', color: 0x7a4a2a }] },
  MARA:  { id: '1784', name: 'MARA',  color: 0xff7094, scale: 0.98, acc: [{ type: 'scarf', color: 0xf0c040 }, { type: 'sash', color: 0x8a2a6a }, 'flower'] },
});
// rank and file: soft green (Verdane) and warm cream (Aurel) bodies, each with a few variants
const VERD_ACC = [[{ type: 'headband', color: 0x2f7d3a }], [{ type: 'sash', color: 0x3f9a4a }], [{ type: 'scarf', color: 0x2f7d3a }], [{ type: 'headband', color: 0x4aa84e }, { type: 'belt', color: 0x5a3a22 }], [{ type: 'leafCrown' }]];
const AUR_ACC = [[{ type: 'scarf', color: 0xe0a82a }], [{ type: 'sash', color: 0xe8b43a }], [{ type: 'headband', color: 0xd08a20 }], [{ type: 'scarf', color: 0xc8481f }, { type: 'belt', color: 0x5a3a22 }], [{ type: 'hat', color: 0xe6c25a }]];
const VERD_BODY = [0xd9efd0, 0xcde8c3, 0xe2f2d8, 0xc3e0b8, 0xd4ebc9], AUR_BODY = [0xf6e7bd, 0xf1dca6, 0xf8ecc9, 0xedd596, 0xf3e2b0];
for (let k = 1; k <= 60; k++) {
  const r = mulberry32(k * 53 + 7), r2 = mulberry32(k * 97 + 11);
  CAST['VD' + k] = { id: String(2000 + Math.floor(r() * 7000)), name: 'VD' + k, color: VERD_BODY[k % 5], scale: 0.9 + 0.2 * r(), width: 0.92 + 0.16 * r(), headScale: 0.96 + 0.1 * r(), acc: VERD_ACC[k % VERD_ACC.length] };
  CAST['AU' + k] = { id: String(2000 + Math.floor(r2() * 7000)), name: 'AU' + k, color: AUR_BODY[k % 5], scale: 0.9 + 0.2 * r2(), width: 0.92 + 0.16 * r2(), headScale: 0.96 + 0.1 * r2(), acc: AUR_ACC[k % AUR_ACC.length] };
}
export const VERDANE = [...Array(60)].map((_, k) => 'VD' + (k + 1)), AUREL = [...Array(60)].map((_, k) => 'AU' + (k + 1));

// ---- the arena cast: sixteen named AIs, the Pack's foot soldiers and everyone else
Object.assign(CAST, {
  REX:   { id: '041', name: 'REX',   color: 0xd7263d, scale: 1.18, width: 1.14, acc: [{ type: 'hair', style: 'short', color: 0x1a1210 }, { type: 'plate', color: 0x8d1224 }, { type: 'helmet', color: 0x7b7f86 }, { type: 'armband', color: 0xffffff }, 'sword'] },
  VEX:   { id: '017', name: 'VEX',   color: 0x8e44ad, scale: 1.03, acc: [{ type: 'hood', color: 0x3b2150 }, 'bow', 'quiver', { type: 'armband', color: 0xd7263d }] },
  JUNE:  { id: '066', name: 'JUNE',  color: 0xff8c42, scale: 0.98, acc: [{ type: 'hair', style: 'ponytail', color: 0x7a2a12 }, { type: 'scarf', color: 0xfff1d6 }, 'dagger', { type: 'armband', color: 0xd7263d }] },
  FINN:  { id: '029', name: 'FINN',  color: 0xc9db4a, scale: 0.97, acc: [{ type: 'hair', style: 'spiky', color: 0x4a3a12 }, { type: 'hat', color: 0x6b7d1f }, 'bag', { type: 'armband', color: 0xd7263d }] },
  KAI:   { id: '008', name: 'KAI',   color: 0x2f7bff, scale: 1.06, acc: [{ type: 'hair', style: 'short', color: 0x151c2b }, { type: 'scarf', color: 0x14306b }, { type: 'belt', color: 0x2a3550 }, 'pack'] },
  LUNA:  { id: '052', name: 'LUNA',  color: 0x58d6c2, scale: 0.97, acc: [{ type: 'hair', style: 'bun', color: 0xf2fbfa }, { type: 'headband', color: 0xffffff }, 'medbag', { type: 'scarf', color: 0xe6fff9 }] },
  TOBY:  { id: '073', name: 'TOBY',  color: 0xb5835a, scale: 1.2, width: 1.24, acc: [{ type: 'hair', style: 'short', color: 0x3a2514 }, { type: 'belt', color: 0x4a3322 }, 'club'] },
  DAX:   { id: '035', name: 'DAX',   color: 0xc9ced6, scale: 1.09, width: 1.06, acc: [{ type: 'hair', style: 'short', color: 0x6b727d }, { type: 'plate', color: 0x9aa3b0 }, { type: 'sash', color: 0x2f4f8f }, 'sword', { type: 'shield', color: 0x6c7a99 }] },
  BOLT:  { id: '088', name: 'BOLT',  color: 0xffd23f, scale: 1.0, width: 0.9, acc: [{ type: 'hair', style: 'spiky', color: 0x2a1708 }, 'goggles', { type: 'headband', color: 0xd9541e }, 'quiver'] },
  ROOK:  { id: '022', name: 'ROOK',  color: 0x6f747c, scale: 1.02, width: 1.12, acc: [{ type: 'belt', color: 0x3a2b1f }, 'hammer', 'bag', { type: 'helmet', color: 0x8c6a2c }] },
  ASTER: { id: '061', name: 'ASTER', color: 0x7ec8ff, scale: 0.95, acc: [{ type: 'hair', style: 'braid', color: 0xe7f3ff }, 'ropeCoil', { type: 'headband', color: 0xffffff }, 'pack'] },
  MARLO: { id: '047', name: 'MARLO', color: 0x1f5fbf, scale: 1.04, acc: [{ type: 'hair', style: 'long', color: 0x0c2552 }, { type: 'sash', color: 0x9fe3ff }, 'trident'] },
  SAGE:  { id: '013', name: 'SAGE',  color: 0x7fbf5a, scale: 0.96, acc: [{ type: 'hood', color: 0x3d5a2a }, { type: 'robe', color: 0x4a6b3a }, 'bag'] },
  ECHO:  { id: '095', name: 'ECHO',  color: 0xe8faff, scale: 0.98, acc: [{ type: 'hair', style: 'short', color: 0x9fe8ff }, 'visor', { type: 'scarf', color: 0x66e0ff }, 'pack'] },
  ZARA:  { id: '079', name: 'ZARA',  color: 0xe2a64a, scale: 1.0, acc: [{ type: 'turban', color: 0xf3e4bd }, { type: 'scarf', color: 0xc2552a }, 'staff'] },
  PIP:   { id: '100', name: 'PIP',   color: 0xff7fb0, scale: 0.76, headScale: 1.14, acc: [{ type: 'hair', style: 'pigtails', color: 0x6b2d4a }, { type: 'scarf', color: 0xffffff }, 'pack'] },
});
// everyone else: pale bodies, a number, now and then a coloured hand or foot; the Pack's soldiers wear a red armband
const XA = [0x9fb8d6, 0xd6b89f, 0xb8d69f, 0xd69fc4, 0xc4c4c4, 0x9fd6cf, 0xe0d39a, 0xb0a6dc, 0xd99a9a, 0xa6cfa0];
const XW = [0xf2f2f2, 0xeeeeea, 0xf4f1ec, 0xe9ecef, 0xe4e4e4, 0xf0ebe0];
const XACC = [[], ['bag'], [{ type: 'belt', color: 0x5a3a22 }], [{ type: 'headband', color: 0x888888 }], ['pack'], [{ type: 'scarf', color: 0xb9b4a8 }], ['dagger'], ['club'], ['spear'], [{ type: 'hood', color: 0x59616b }]];
for (let k = 1; k <= 90; k++) {
  const r = mulberry32(k * 211 + 19), pack = k <= 14;
  CAST['X' + k] = { id: String(100 + Math.floor(r() * 899)).slice(0, 3), name: 'X' + k, color: XW[k % XW.length], scale: 0.9 + 0.2 * r(), width: 0.9 + 0.2 * r(), headScale: 0.96 + 0.1 * r(),
    handColor: r() < 0.45 ? XA[k % XA.length] : undefined, footColor: r() < 0.45 ? XA[(k + 4) % XA.length] : undefined,
    acc: [...(r() < 0.75 ? [{ type: 'hair', style: ['short', 'long', 'ponytail', 'bun', 'spiky', 'braid'][k % 6], color: [0x2b2118, 0x5a3a1c, 0x1a1a1a, 0x8a6a3a, 0xb59a6a, 0x3a2a3a][(k * 7) % 6] }] : []), ...(XACC[k % XACC.length]), ...(pack ? [{ type: 'armband', color: 0xd7263d }, 'sword'] : [])] };
}
export const MAIN16 = ['REX', 'VEX', 'JUNE', 'FINN', 'KAI', 'LUNA', 'TOBY', 'DAX', 'BOLT', 'ROOK', 'ASTER', 'MARLO', 'SAGE', 'ECHO', 'ZARA', 'PIP'];
export const EXTRAS = [...Array(90)].map((_, k) => 'X' + (k + 1));

// ---- arena poses (survival, combat, scouting)
Object.assign(POSES, {
  sneak(P, t, p) {           // low, slow walk
    POSES.walk(P, t, { ...p, speed: 0.55, amount: 0.55 });
    P.pelvis.position.y = 0.74; P.spine.rotation.x = 0.42; P.head.rotation.x = -0.3;
    P.L.hip.rotation.x -= 0.45; P.R.hip.rotation.x -= 0.45; P.L.kn.rotation.x += 0.9; P.R.kn.rotation.x += 0.9;
    P.L.sh.rotation.x = -0.45; P.R.sh.rotation.x = -0.45; P.L.el.rotation.x = -1.0; P.R.el.rotation.x = -1.0;
  },
  sprint(P, t, p) { POSES.run(P, t, { ...p, speed: (p.speed ?? 1) * 1.15 }); P.spine.rotation.x = 0.32; },
  limp(P, t, p) {
    const ph = (p.phase ?? 0) + t * 3.6;
    POSES.walk(P, t, { ...p, speed: 0.6, amount: 0.7 });
    P.pelvis.rotation.z = S(ph) * 0.14; P.spine.rotation.z = -S(ph) * 0.1; P.spine.rotation.x = 0.2; P.head.rotation.x = 0.25;
    P.R.kn.rotation.x = 0.1; P.R.hip.rotation.x = -0.1 + S(ph) * 0.1;
  },
  watch(P, t, p) {           // scouting: hand shading the eyes, slow look around
    POSES.idle(P, t, { ...p, look: 0 });
    P.R.sh.rotation.x = -1.5; P.R.sh.rotation.z = 0.5; P.R.el.rotation.x = -1.7; P.R.sh.rotation.y = 0.2;
    P.head.rotation.y = S(t * 0.5 + (p.phase ?? 0)) * 0.7; P.head.rotation.x = -0.08;
  },
  lookAround(P, t, p) { POSES.idle(P, t, { ...p, look: 3.2 }); P.head.rotation.x = 0.04; },
  stab(P, t, p) {            // sword thrust, looping
    const c = (t * (p.speed ?? 0.9) + (p.phase ?? 0) * 0.13) % 1, k = smoothstep(0.28, 0.42, c) * (1 - smoothstep(0.5, 0.78, c));
    POSES.idle(P, t, { ...p, look: 0 });
    P.spine.rotation.y = lerp(0.4, -0.2, k); P.spine.rotation.x = 0.1 + 0.18 * k; P.head.rotation.y = -P.spine.rotation.y * 0.8;
    P.R.sh.rotation.x = lerp(-0.95, -1.5, k); P.R.sh.rotation.z = 0.12; P.R.el.rotation.x = lerp(-1.5, -0.05, k);
    P.L.sh.rotation.x = -0.35; P.L.sh.rotation.z = -0.5; P.L.el.rotation.x = -1.1;
    P.L.hip.rotation.x = -0.55 - 0.08 * k; P.L.kn.rotation.x = 0.55 + 0.15 * k; P.R.hip.rotation.x = 0.32; P.R.kn.rotation.x = 0.12;
    P.pelvis.position.y = 0.83 - 0.05 * k;
  },
  parry(P, t, p) {           // blade raised across the body
    POSES.idle(P, t, { ...p, look: 0 });
    const k = smoothstep(0, 0.2, (t * (p.speed ?? 1.1)) % 1) * (1 - smoothstep(0.5, 0.7, (t * (p.speed ?? 1.1)) % 1));
    P.R.sh.rotation.x = lerp(-0.6, -1.3, k); P.R.sh.rotation.z = lerp(0.2, -0.2, k); P.R.el.rotation.x = lerp(-1.4, -1.9, k);
    P.L.sh.rotation.x = -0.6; P.L.el.rotation.x = -1.0;
    P.L.hip.rotation.x = -0.4; P.L.kn.rotation.x = 0.4; P.R.hip.rotation.x = 0.28; P.pelvis.position.y = 0.84; P.spine.rotation.y = 0.25;
  },
  duck(P, t, p) { POSES.crouch(P, t, p); P.spine.rotation.x = 0.8; P.head.rotation.x = -0.1; },
  fall(P, t, p) { POSES.fallDown(P, t, p); },
  kneel(P, t, p) {           // one knee down, head bowed
    POSES.idle(P, t, { ...p, look: 0 });
    P.pelvis.position.y = 0.58; P.L.hip.rotation.x = -1.5; P.L.kn.rotation.x = 1.5; P.R.hip.rotation.x = 0.1; P.R.kn.rotation.x = 1.9; P.R.an.rotation.x = 0.7;
    P.spine.rotation.x = 0.2; P.head.rotation.x = 0.35; P.L.sh.rotation.x = -0.3; P.R.sh.rotation.x = -0.5; P.L.el.rotation.x = -0.9; P.R.el.rotation.x = -0.9;
  },
  drink(P, t, p) {           // kneeling at the water, cupped hands to the mouth
    POSES.kneel(P, t, p);
    const k = 0.5 + 0.5 * S(t * 1.3 + (p.phase ?? 0));
    P.spine.rotation.x = 0.4 + 0.15 * (1 - k); P.head.rotation.x = 0.35 + 0.2 * (1 - k);
    P.L.sh.rotation.x = -0.9 - 0.4 * k; P.R.sh.rotation.x = -0.9 - 0.4 * k; P.L.el.rotation.x = -1.5 - 0.3 * k; P.R.el.rotation.x = -1.5 - 0.3 * k;
    P.L.sh.rotation.z = 0.15; P.R.sh.rotation.z = -0.15;
  },
  tend(P, t, p) {            // crouched at a fire, hands towards it
    POSES.crouch(P, t, p);
    const k = S(t * 2.1 + (p.phase ?? 0)) * 0.15;
    P.L.sh.rotation.x = -1.05 + k; P.R.sh.rotation.x = -1.05 - k; P.L.el.rotation.x = -0.7; P.R.el.rotation.x = -0.7; P.spine.rotation.x = 0.35; P.head.rotation.x = 0.2;
  },
  fish(P, t, p) {            // spear fishing: wait, then stab down
    const c = (t * 0.45 + (p.phase ?? 0) * 0.1) % 1, k = smoothstep(0.55, 0.62, c) * (1 - smoothstep(0.7, 0.9, c));
    POSES.idle(P, t, { ...p, look: 0 });
    P.spine.rotation.x = 0.25 + 0.3 * k; P.head.rotation.x = 0.35;
    P.R.sh.rotation.x = lerp(-2.3, -0.8, k); P.R.el.rotation.x = lerp(-0.6, -0.1, k); P.L.sh.rotation.x = lerp(-1.4, -0.9, k); P.L.el.rotation.x = -0.4;
    P.L.hip.rotation.x = -0.25; P.R.hip.rotation.x = 0.2; P.L.kn.rotation.x = 0.2;
  },
  build(P, t, p) { POSES.hammer(P, t, { ...p, phase: p.phase ?? 0 }); P.head.rotation.x = 0.3; },
  forage(P, t, p) {          // bent over, picking things from the ground
    const k = 0.5 + 0.5 * S(t * 1.8 + (p.phase ?? 0));
    POSES.idle(P, t, { ...p, look: 0 });
    P.spine.rotation.x = 0.85 + 0.15 * k; P.head.rotation.x = 0.1; P.L.hip.rotation.x = -0.5; P.R.hip.rotation.x = -0.35; P.L.kn.rotation.x = 0.45; P.R.kn.rotation.x = 0.3;
    P.pelvis.position.y = 0.82; P.R.sh.rotation.x = -1.2 - 0.3 * k; P.R.el.rotation.x = -0.4; P.L.sh.rotation.x = -0.6; P.L.el.rotation.x = -0.6;
  },
  sleepCurl(P, t, p) {       // lying on the side
    POSES.fallDown(P, 9, p); P.root.rotation.z = 0; P.spine.rotation.y = 0.0; P.L.kn.rotation.x = 1.4; P.R.kn.rotation.x = 1.2; P.L.hip.rotation.x = -1.8; P.R.hip.rotation.x = -1.7;
    P.L.sh.rotation.x = -1.4; P.R.sh.rotation.x = -1.2; P.L.el.rotation.x = -1.5; P.R.el.rotation.x = -1.4; P.spine.rotation.x += S(t * 1.1) * 0.01;
  },
  hold(P, t, p) {            // arms around a friend / holding something at chest height
    POSES.idle(P, t, { ...p, look: 0.1 });
    P.L.sh.rotation.x = -0.9; P.R.sh.rotation.x = -0.9; P.L.el.rotation.x = -1.2; P.R.el.rotation.x = -1.2; P.L.sh.rotation.z = 0.3; P.R.sh.rotation.z = -0.3;
  },
  reach(P, t, p) {           // one hand stretched forward (taking something)
    POSES.idle(P, t, { ...p, look: 0 });
    P.R.sh.rotation.x = -1.4; P.R.sh.rotation.z = 0.1; P.R.el.rotation.x = -0.15; P.spine.rotation.x = 0.1;
  },
  hurt(P, t, p) {            // holding the side, bent
    POSES.limp(P, t, p);
    P.L.sh.rotation.x = -0.7; P.L.el.rotation.x = -1.8; P.L.sh.rotation.z = 0.2; P.spine.rotation.x = 0.4;
  },
  sprawl(P, t, p) { POSES.fallDown(P, 9, p); },
  stand(P, t, p) { POSES.idle(P, t, p); },
  hips(P, t, p) {            // hands on hips, confident
    POSES.idle(P, t, { ...p, look: 0.3 });
    P.L.sh.rotation.x = 0.1; P.R.sh.rotation.x = 0.1; P.L.sh.rotation.z = -0.55; P.R.sh.rotation.z = 0.55; P.L.el.rotation.x = -1.7; P.R.el.rotation.x = -1.7;
  },
});
