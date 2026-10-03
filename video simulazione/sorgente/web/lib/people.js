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
  GEO.helmet = new THREE.SphereGeometry(0.212, 28, 14, 0, Math.PI * 2, 0, Math.PI * 0.55);
  GEO.robe = new THREE.CylinderGeometry(0.21, 0.36, 0.78, 28, 1, true);
  GEO.bag = new THREE.BoxGeometry(0.26, 0.3, 0.12, 2, 2, 2);
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
    const headM = mk(GEO.head); headM.position.y = 0.19; headM.scale.setScalar(def.headScale ?? 1); this.head.add(headM); this.headMesh = headM;
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
    for (const a of (def.acc || [])) this.addAcc(a);
    this.state = { energy: 1 };
  }

  // merge all rigid body parts into a few SkinnedMeshes (one per material) -> far fewer draw calls
  _bake() {
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
  }

  addAcc(a) {
    const type = typeof a === 'string' ? a : a.type, c = typeof a === 'string' ? undefined : a.color;
    let o;
    switch (type) {
      case 'crown': o = new THREE.Mesh(GEO.crown, metalMat(c ?? 0xd4904a)); o.position.y = 0.33; o.scale.setScalar(1.05); this.head.add(o); break;
      case 'cape': o = new THREE.Mesh(GEO.cape, clothMat(c ?? 0xb3122a)); o.position.set(0, 0.56, -0.15); o.castShadow = true; this.spine.add(o); break;
      case 'scarf': o = new THREE.Mesh(GEO.ring, clothMat(c ?? 0xd33a2c)); o.rotation.x = Math.PI / 2; o.position.y = 0.6; o.scale.set(0.62, 0.62, 1.4); this.spine.add(o); break;
      case 'sash': o = new THREE.Mesh(GEO.sash, clothMat(c ?? 0x2f6bff)); o.rotation.set(Math.PI / 2, 0.55, 0); o.position.y = 0.33; o.scale.set(1, 0.7, 1); this.spine.add(o); break;
      case 'belt': o = new THREE.Mesh(GEO.sash, clothMat(c ?? 0x5a3a22)); o.rotation.x = Math.PI / 2; o.position.y = 0.17; o.scale.set(0.9, 0.62, 0.8); this.spine.add(o); break;
      case 'headband': o = new THREE.Mesh(GEO.ring, clothMat(c ?? 0x2a9d8f)); o.rotation.x = Math.PI / 2; o.position.y = 0.24; o.scale.set(0.98, 0.98, 1.2); this.head.add(o); break;
      case 'hat': o = new THREE.Mesh(GEO.cone, clothMat(c ?? 0xc9a45a)); o.position.y = 0.43; o.scale.set(1.25, 0.6, 1.25); this.head.add(o); break;
      case 'helmet': o = new THREE.Mesh(GEO.helmet, metalMat(c ?? 0x9a9a9a)); o.position.y = 0.2; this.head.add(o); break;
      case 'hood': o = new THREE.Mesh(GEO.helmet, clothMat(c ?? 0xf2efe6)); o.position.y = 0.19; o.scale.setScalar(1.07); this.head.add(o); break;
      case 'robe': o = new THREE.Mesh(GEO.robe, clothMat(c ?? 0xf3efe2)); o.position.y = -0.15; this.spine.add(o); break;
      case 'flower': o = new THREE.Mesh(GEO.flower, bodyMat(c ?? 0xff6fa0, 0.6)); o.position.set(0.15, 0.32, 0.06); this.head.add(o); break;
      case 'bag': o = new THREE.Mesh(GEO.bag, clothMat(c ?? 0x8a6a45)); o.position.set(0, 0.36, -0.19); this.spine.add(o); break;
      case 'staff': o = new THREE.Mesh(GEO.stick, woodMat()); o.position.set(0, -0.05, 0.02); this.R.hd.add(o); break;
      case 'spear': { o = new THREE.Group(); const s = new THREE.Mesh(GEO.stick, woodMat()); s.scale.y = 1.25; const tip = new THREE.Mesh(GEO.spearTip, metalMat(0xb8b8b8)); tip.position.y = 1.1; o.add(s, tip); o.position.set(0, 0.1, 0.02); this.R.hd.add(o); break; }
      case 'torch': { o = new THREE.Group(); const s = new THREE.Mesh(GEO.stick, woodMat()); s.scale.set(1.2, 0.42, 1.2); o.add(s); o.position.set(0, 0.25, 0.02); this.R.hd.add(o); o.userData.flameAt = new THREE.Vector3(0, 0.36, 0); break; }
      case 'basket': o = new THREE.Mesh(GEO.basket, clothMat(c ?? 0xb08a4f)); o.position.set(0, -0.12, 0.0); this.L.hd.add(o); break;
      case 'tally': o = new THREE.Mesh(GEO.stick, woodMat()); o.scale.set(0.8, 0.22, 0.8); o.position.set(0, -0.05, 0); this.L.hd.add(o); break;
      case 'glasses': { o = new THREE.Group(); const m = metalMat(0x222222); for (const s of [-1, 1]) { const r = new THREE.Mesh(new THREE.TorusGeometry(0.045, 0.008, 6, 20), m); r.position.set(s * 0.065, 0.2, 0.185); o.add(r); } this.head.add(o); break; }
    }
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
  }

  pose(name, t, p = {}) {
    this.resetPose();
    const f = POSES[name] || POSES.idle;
    f(this, t, p);
    return this;
  }
}

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
    P.pelvis.position.y = 0.2;
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
  fallDown(P, t, p) {   // collapse (shutdown) over ~1.2s, then lie
    const k = smoothstep(0, 1.2, t);
    P.pelvis.position.y = lerp(0.9, 0.16, k);
    P.root.rotation.x = 0; // body lies via spine rotation
    P.spine.rotation.x = lerp(0, 1.45, smoothstep(0.2, 1.2, t));
    P.L.hip.rotation.x = lerp(0, -1.45, k) ; P.R.hip.rotation.x = lerp(0, -1.3, k);
    P.L.kn.rotation.x = lerp(0, 0.3, k); P.R.kn.rotation.x = lerp(0, 0.6, k);
    P.L.sh.rotation.x = lerp(0, -2.6, k); P.R.sh.rotation.x = lerp(0, -2.3, k);
    P.head.rotation.x = lerp(0, 0.3, k); P.head.rotation.y = lerp(0, 0.7, k);
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
  HOODIE: { id: null, name: 'ME', color: 0x8d9099, scale: 1.0, acc: [{ type: 'hood', color: 0x2f333b }, { type: 'robe', color: 0x2f333b }] },
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
