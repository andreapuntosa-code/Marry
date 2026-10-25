// Stylised animals built from primitives, each with a tiny rig + procedural gait.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { mulberry32, clamp, lerp } from './noise.js';

const MATS = {};
const mat = (hex, rough = 0.8, emissive = 0) => {
  const k = hex + '_' + rough + '_' + emissive;
  if (!MATS[k]) MATS[k] = new THREE.MeshStandardMaterial({ color: hex, roughness: rough, metalness: 0, emissive: emissive ? hex : 0x000000, emissiveIntensity: emissive });
  return MATS[k];
};
function mesh(geo, m) { const o = new THREE.Mesh(geo, m); o.castShadow = true; o.receiveShadow = true; return o; }
function ell(rx, ry, rz, seg = 16) { const g = new THREE.SphereGeometry(1, seg, Math.max(8, seg * 0.6 | 0)); g.scale(rx, ry, rz); return g; }
function leg(r0, r1, len) { const g = new THREE.CylinderGeometry(r1, r0, len, 8); g.translate(0, -len / 2, 0); return g; }

// generic quadruped: body along +z (head forward)
class Quad {
  constructor(spec) {
    this.spec = spec;
    this.root = new THREE.Group();
    const S = spec.size;
    this.body = new THREE.Group(); this.body.position.y = spec.legLen * S + spec.bodyR[1] * S * 0.6; this.root.add(this.body);
    const bm = mat(spec.color, spec.rough ?? 0.85);
    const torso = mesh(spec.woolly ? woolGeo(spec.bodyR.map(v => v * S), spec.seed) : ell(spec.bodyR[0] * S, spec.bodyR[1] * S, spec.bodyR[2] * S), spec.woolly ? mat(spec.woolColor ?? 0xf2efe6, 0.95) : bm);
    this.body.add(torso);
    // neck + head
    this.neck = new THREE.Group(); this.neck.position.set(0, spec.bodyR[1] * S * 0.45, spec.bodyR[2] * S * 0.82); this.body.add(this.neck);
    const nk = mesh(leg(spec.neckR * S, spec.neckR * S * 0.85, spec.neckLen * S), bm); nk.rotation.x = -spec.neckAngle; this.neck.add(nk);
    this.head = new THREE.Group();
    this.head.position.set(0, Math.cos(spec.neckAngle) * spec.neckLen * S * -(-1), Math.sin(spec.neckAngle) * spec.neckLen * S);
    this.head.position.y = spec.neckLen * S * Math.cos(spec.neckAngle) * 1.0;
    this.head.position.z = spec.neckLen * S * Math.sin(spec.neckAngle);
    this.neck.add(this.head);
    const hd = mesh(ell(spec.headR[0] * S, spec.headR[1] * S, spec.headR[2] * S), spec.headColor ? mat(spec.headColor) : bm);
    hd.position.z = spec.headR[2] * S * 0.5; this.head.add(hd);
    if (spec.snout) { const sn = mesh(new THREE.ConeGeometry(spec.snout[0] * S, spec.snout[1] * S, 10), bm); sn.rotation.x = Math.PI / 2; sn.position.set(0, -spec.headR[1] * S * 0.2, spec.headR[2] * S * 1.2 + spec.snout[1] * S * 0.4); this.head.add(sn); }
    // ears
    for (const sg of [-1, 1]) {
      const ear = mesh(new THREE.ConeGeometry(spec.ear[0] * S, spec.ear[1] * S, 6), spec.earColor ? mat(spec.earColor) : bm);
      ear.position.set(sg * spec.headR[0] * S * 0.7, spec.headR[1] * S * 0.9, spec.headR[2] * S * 0.1); ear.rotation.z = -sg * (spec.earTilt ?? 0.5); this.head.add(ear);
      if (spec.horns) { const hn = mesh(new THREE.ConeGeometry(0.025 * S * 3, spec.horns * S, 6), mat(0xcfc3a8, 0.6)); hn.position.set(sg * spec.headR[0] * S * 0.4, spec.headR[1] * S * 1.1, -0.02 * S); hn.rotation.set(-0.5, 0, -sg * 0.25); this.head.add(hn); }
      if (spec.antlers) { const ant = antlerGroup(S * spec.antlers, sg); ant.position.set(sg * spec.headR[0] * S * 0.35, spec.headR[1] * S * 1.0, 0); this.head.add(ant); }
      if (spec.eyes) { const eye = mesh(new THREE.SphereGeometry(spec.headR[0] * S * 0.16, 8, 6), mat(spec.eyeColor ?? 0x111111, 0.3, spec.eyeGlow ?? 0)); eye.position.set(sg * spec.headR[0] * S * 0.55, spec.headR[1] * S * 0.25, spec.headR[2] * S * 0.95); eye.castShadow = false; this.head.add(eye); }
    }
    if (spec.tusks) for (const sg of [-1, 1]) { const tk = mesh(new THREE.TorusGeometry(spec.tusks * S * 0.5, 0.035 * S, 6, 14, Math.PI * 0.8), mat(0xf3ecd8, 0.5)); tk.position.set(sg * spec.headR[0] * S * 0.8, -spec.headR[1] * S * 0.3, spec.headR[2] * S * 0.9); tk.rotation.set(0.0, sg * 0.35, sg * Math.PI * 0.5 + sg * 0.4); this.head.add(tk); }
    if (spec.fangs) for (const sg of [-1, 1]) { const fg = mesh(new THREE.ConeGeometry(0.022 * S * 2, spec.fangs * S, 6), mat(0xf6f1e2, 0.4)); fg.rotation.x = Math.PI; fg.position.set(sg * spec.headR[0] * S * 0.45, -spec.headR[1] * S * 0.9 - spec.fangs * S * 0.4, spec.headR[2] * S * 1.1); this.head.add(fg); }
    this.trunkSegs = [];
    if (spec.trunk) { let par = this.head; const n = 6, segLen = spec.trunk[1] * S / n; for (let i = 0; i < n; i++) { const g = new THREE.Group(); g.position.set(0, i === 0 ? -spec.headR[1] * S * 0.35 : -segLen * 0.95, i === 0 ? spec.headR[2] * S * 1.3 : 0); const r0 = spec.trunk[0] * S * (1 - i * 0.09); const sg2 = mesh(leg(r0, r0 * 0.88, segLen), bm); g.add(sg2); par.add(g); this.trunkSegs.push(g); par = g; } }
    // tail
    if (spec.tail) { this.tail = new THREE.Group(); this.tail.position.set(0, spec.bodyR[1] * S * 0.3, -spec.bodyR[2] * S * 0.95); this.body.add(this.tail); const tl = mesh(leg(spec.tail[0] * S, spec.tail[0] * S * 0.5, spec.tail[1] * S), spec.tailColor ? mat(spec.tailColor) : bm); tl.rotation.x = spec.tailAngle ?? -2.4; this.tail.add(tl); }
    // legs
    this.legs = [];
    const lx = spec.bodyR[0] * S * 0.55, lz = spec.bodyR[2] * S * 0.62, ll = spec.legLen * S;
    for (const [x, z] of [[-lx, lz], [lx, lz], [-lx, -lz], [lx, -lz]]) {
      const hip = new THREE.Group(); hip.position.set(x, -spec.bodyR[1] * S * 0.35, z); this.body.add(hip);
      const up = mesh(leg(spec.legR * S, spec.legR * S * 0.8, ll * 0.55), spec.legColor ? mat(spec.legColor) : bm); hip.add(up);
      const knee = new THREE.Group(); knee.position.y = -ll * 0.55; hip.add(knee);
      const lo = mesh(leg(spec.legR * S * 0.8, spec.legR * S * 0.6, ll * 0.48), spec.legColor ? mat(spec.legColor) : bm); knee.add(lo);
      this.legs.push({ hip, knee });
    }
  }
  // gait: speed 0 = idle/graze
  animate(t, p = {}) {
    const sp = p.speed ?? 0, ph = t * (p.cadence ?? 7) * Math.max(sp, 0.0001) + (p.phase ?? 0);
    const amp = Math.min(1, sp) * 0.6;
    const offs = [0, Math.PI, Math.PI, 0];
    this.legs.forEach((L, i) => {
      L.hip.rotation.x = Math.sin(ph + offs[i]) * amp;
      L.knee.rotation.x = Math.max(0, -Math.cos(ph + offs[i])) * amp * 1.2;
    });
    this.body.position.y = this.spec.legLen * this.spec.size + this.spec.bodyR[1] * this.spec.size * 0.6 + Math.abs(Math.sin(ph)) * 0.03 * amp * this.spec.size;
    const graze = p.graze ?? (sp < 0.05 ? 0.5 + 0.5 * Math.sin(t * 0.7 + (p.phase ?? 0)) : 0);
    this.neck.rotation.x = lerp(0, 1.1, graze) + (p.look ?? 0);
    this.head.rotation.x = lerp(0, 0.5, graze);
    this.head.rotation.y = Math.sin(t * 0.9 + (p.phase ?? 0)) * 0.25 * (1 - graze);
    this.trunkSegs.forEach((g, i) => { g.rotation.x = 0.12 + Math.sin(t * 1.1 + i * 0.5 + (p.phase ?? 0)) * 0.12 + (p.trunkUp ?? 0) * 0.35; });
    if (this.tail) this.tail.rotation.y = Math.sin(t * 5 + (p.phase ?? 0)) * 0.3;
    if (p.howl) { this.neck.rotation.x = -0.9; this.head.rotation.x = -0.4; }
  }
}

function woolGeo([rx, ry, rz], seed = 1) {
  const r = mulberry32(seed), parts = [];
  for (let i = 0; i < 14; i++) {
    const g = new THREE.IcosahedronGeometry(1, 1);
    const s = 0.45 + 0.25 * r();
    g.scale(rx * s, ry * s, rz * s * 0.8);
    g.translate((r() - 0.5) * rx * 1.1, (r() - 0.4) * ry * 0.8, (r() - 0.5) * rz * 1.4);
    g.deleteAttribute('uv');
    parts.push(g.index ? g.toNonIndexed() : g);
  }
  const m = mergeGeometries(parts); m.computeVertexNormals(); return m;
}
function antlerGroup(S, sg) {
  const g = new THREE.Group(), m = mat(0xbca98a, 0.7);
  const main = mesh(leg(0.012 * S * 10, 0.008 * S * 10, 0.35 * S), m); main.rotation.set(-0.3, 0, -sg * 0.5); main.position.y = 0.0; g.add(main);
  for (let k = 0; k < 3; k++) { const b = mesh(leg(0.008 * S * 10, 0.004 * S * 10, 0.14 * S), m); b.position.set(-sg * 0.06 * S * (k + 1), 0.1 * S * (k + 1), 0); b.rotation.set(0.4, 0, -sg * 0.1); g.add(b); }
  g.rotation.x = Math.PI; // antlers point up
  g.rotation.x = 0;
  return g;
}

export const SPECIES = {
  goat: (seed = 1, color) => ({ size: 1.0, seed, color: color ?? [0xf4f1ea, 0x8a6a4a, 0x3a3532, 0xd8c6a8][seed % 4], bodyR: [0.2, 0.22, 0.42], legLen: 0.42, legR: 0.045,
    neckR: 0.07, neckLen: 0.22, neckAngle: 0.5, headR: [0.09, 0.1, 0.14], snout: [0.06, 0.12], ear: [0.035, 0.12], earTilt: 1.2, horns: 0.14, tail: [0.03, 0.12], tailAngle: -0.6, eyes: true }),
  sheep: (seed = 1) => ({ size: 1.0, seed, color: 0x2e2a28, woolly: true, woolColor: [0xf2efe6, 0xe8e2d4, 0xd9d2c3][seed % 3], bodyR: [0.3, 0.27, 0.45], legLen: 0.36, legR: 0.04, legColor: 0x2e2a28,
    neckR: 0.07, neckLen: 0.16, neckAngle: 0.7, headR: [0.1, 0.1, 0.15], headColor: 0x2e2a28, snout: null, ear: [0.04, 0.1], earTilt: 1.4, tail: [0.04, 0.1], eyes: true }),
  wolf: (seed = 1, glow = 0) => ({ size: 1.05, seed, color: [0x6f7277, 0x5b5f66, 0x84868a][seed % 3], bodyR: [0.21, 0.24, 0.55], legLen: 0.5, legR: 0.05,
    neckR: 0.1, neckLen: 0.22, neckAngle: 0.9, headR: [0.12, 0.12, 0.15], snout: [0.07, 0.2], ear: [0.05, 0.14], earTilt: 0.15, tail: [0.06, 0.45], tailAngle: -2.5,
    eyes: true, eyeColor: glow ? 0xffd27a : 0x222222, eyeGlow: glow }),
  horse: (seed = 1, color) => ({ size: 1.55, seed, color: color ?? [0x8a5a34, 0xf2efe8, 0x3a2e28, 0xb98a55, 0x6b4a30][seed % 5], bodyR: [0.25, 0.3, 0.62], legLen: 0.66, legR: 0.045,
    neckR: 0.11, neckLen: 0.5, neckAngle: 0.62, headR: [0.095, 0.12, 0.23], snout: [0.075, 0.17], ear: [0.035, 0.12], earTilt: 0.2, tail: [0.06, 0.62], tailAngle: -2.2, tailColor: 0x2b2420, eyes: true, legColor: [0x6b4a30, 0xe6e2da, 0x2a2220, 0x8a6840, 0x4f3623][seed % 5] }),
  deer: (seed = 1, antlers = true) => ({ size: 1.15, seed, color: 0x9a6a41, bodyR: [0.2, 0.25, 0.55], legLen: 0.75, legR: 0.038,
    neckR: 0.08, neckLen: 0.42, neckAngle: 0.35, headR: [0.09, 0.1, 0.17], snout: [0.06, 0.14], ear: [0.05, 0.15], earTilt: 0.9, antlers: antlers ? 1.0 : 0, tail: [0.04, 0.1], tailAngle: -0.8, tailColor: 0xf3eee4, eyes: true }),
  mammoth: (seed = 1) => ({ size: 2.5, seed, color: 0x4a3322, woolly: true, woolColor: [0x5a3a24, 0x4b3220, 0x6a4630][seed % 3], bodyR: [0.36, 0.4, 0.6], legLen: 0.5, legR: 0.11, legColor: 0x3d2a1b,
    neckR: 0.2, neckLen: 0.12, neckAngle: 0.9, headR: [0.22, 0.25, 0.28], headColor: 0x4a3322, snout: null, ear: [0.12, 0.22], earTilt: 1.0, earColor: 0x3d2a1b, trunk: [0.09, 0.75], tusks: 0.7, tail: [0.04, 0.2], eyes: true }),
  sabertooth: (seed = 1) => ({ size: 1.2, seed, color: [0xc99a55, 0xb88a48, 0xd2a868][seed % 3], bodyR: [0.2, 0.24, 0.5], legLen: 0.38, legR: 0.07, legColor: 0xa87a3e,
    neckR: 0.13, neckLen: 0.2, neckAngle: 0.8, headR: [0.14, 0.13, 0.17], snout: [0.08, 0.1], ear: [0.04, 0.07], earTilt: 0.2, fangs: 0.2, tail: [0.05, 0.2], tailAngle: -2.4, eyes: true, eyeColor: 0xffc84a, eyeGlow: 0.15 }),
  bison: (seed = 1) => ({ size: 1.5, seed, color: 0x3a2a1e, woolly: true, woolColor: 0x4a3626, bodyR: [0.34, 0.38, 0.6], legLen: 0.5, legR: 0.07, legColor: 0x2e2218, neckR: 0.18, neckLen: 0.16, neckAngle: 1.0, headR: [0.15, 0.17, 0.22], headColor: 0x2a1e14, snout: [0.1, 0.1], ear: [0.05, 0.1], earTilt: 1.4, horns: 0.2, tail: [0.03, 0.4], tailAngle: -3.0, eyes: true }),
  cow: (seed = 1) => ({ size: 1.3, seed, color: [0xf4f1ea, 0x5a3b28, 0x2f2a28][seed % 3], bodyR: [0.32, 0.34, 0.7], legLen: 0.55, legR: 0.07,
    neckR: 0.14, neckLen: 0.22, neckAngle: 0.9, headR: [0.15, 0.15, 0.22], snout: [0.1, 0.1], ear: [0.06, 0.12], earTilt: 1.5, horns: 0.12, tail: [0.03, 0.6], tailAngle: -3.0, eyes: true }),
};


// ---- a proper horse (the Aurel's cavalry): barrel body, long neck, head, mane, tail, jointed legs, gallop cycle
const COATS = [[0x7a4a2a, 0x2a1d14], [0xeeeae0, 0xd8d2c4], [0x2a2420, 0x15110e], [0xa8602c, 0x3a2412], [0xd2a860, 0xf2e6c4], [0x5a3b26, 0x1d130c]];
function capsuleZ(r, len, m, sx = 1, sy = 1) { const g = new THREE.CapsuleGeometry(r, len, 6, 14); g.rotateX(Math.PI / 2); g.scale(sx, sy, 1); const o = mesh(g, m); return o; }
function makeHorse(seed = 1, opts = {}) {
  const [coat, mane] = COATS[(opts.coat ?? seed) % COATS.length];
  const bm = mat(opts.color ?? coat, 0.62), mm = mat(mane, 0.85), hm = mat(0x1f1a17, 0.5);
  const H = { spec: { size: 1.0, bodyR: [0.3, 0.34, 0.7], legLen: 1.0 }, seat: [0, -0.2, -0.05] };
  H.root = new THREE.Group(); H.body = new THREE.Group(); H.body.position.y = 1.12; H.root.add(H.body);
  const add = (o, x, y, z, rx = 0, ry = 0, rz = 0, p = H.body) => { o.position.set(x, y, z); o.rotation.set(rx, ry, rz); p.add(o); return o; };
  add(capsuleZ(0.33, 0.55, bm, 0.92, 1.0), 0, 0, 0);
  add(mesh(ell(0.36, 0.38, 0.4), bm), 0, 0.02, 0.5); // chest
  add(mesh(ell(0.36, 0.37, 0.42), bm), 0, 0.05, -0.5); // rump
  H.neck = new THREE.Group(); H.neck.position.set(0, 0.2, 0.6); H.body.add(H.neck);
  add(mesh(new THREE.CapsuleGeometry(0.15, 0.5, 6, 12), bm), 0, 0.25, 0.3, 0.98, 0, 0, H.neck);
  H.head = new THREE.Group(); H.head.position.set(0, 0.56, 0.68); H.neck.add(H.head);
  add(mesh(new THREE.CapsuleGeometry(0.105, 0.34, 6, 12), bm), 0, -0.1, 0.12, 1.15, 0, 0, H.head);
  add(mesh(new THREE.SphereGeometry(0.11, 12, 10), bm), 0, 0.03, -0.02, 0, 0, 0, H.head);
  for (const sg of [-1, 1]) { add(mesh(new THREE.ConeGeometry(0.04, 0.14, 6), bm), sg * 0.07, 0.14, -0.04, 0, 0, -sg * 0.15, H.head); add(mesh(new THREE.SphereGeometry(0.018, 6, 5), mat(0x111111, 0.3)), sg * 0.095, 0.04, 0.07, 0, 0, 0, H.head); }
  for (let k = 0; k < 7; k++) add(capsuleZ(0.045, 0.1, mm), 0, 0.14 + k * 0.07, 0.02 + k * 0.08, 0.98 + k * 0.02, 0, 0, H.neck);   // mane along the neck
  H.tail = new THREE.Group(); H.tail.position.set(0, 0.25, -0.86); H.body.add(H.tail);
  add(mesh(new THREE.CapsuleGeometry(0.06, 0.6, 5, 8), mm), 0, -0.34, -0.1, 0.25, 0, 0, H.tail);
  H.legs = [];
  for (const [x, z, fr] of [[-0.2, 0.5, 1], [0.2, 0.5, 1], [-0.2, -0.5, 0], [0.2, -0.5, 0]]) {
    const hip = new THREE.Group(); hip.position.set(x, -0.22, z); H.body.add(hip);
    add(mesh(new THREE.CapsuleGeometry(fr ? 0.085 : 0.11, 0.38, 5, 10), bm), 0, -0.3, 0, 0, 0, 0, hip);
    const knee = new THREE.Group(); knee.position.y = -0.55; hip.add(knee);
    add(mesh(new THREE.CapsuleGeometry(0.058, 0.4, 5, 10), bm), 0, -0.24, 0, 0, 0, 0, knee);
    add(mesh(new THREE.CylinderGeometry(0.075, 0.085, 0.1, 10), hm), 0, -0.53, 0, 0, 0, 0, knee);
    H.legs.push({ hip, knee, fr });
  }
  H.animate = (t, p = {}) => {
    const sp = p.speed ?? 0, ph = t * (p.cadence ?? 8.5) * Math.max(sp, 0.0001) + (p.phase ?? 0), amp = Math.min(1.3, sp);
    const offs = [0, 0.5, 2.2, 2.7];   // gallop: front pair slightly apart, back pair half a cycle later
    H.legs.forEach((L, i) => {
      const a = ph + offs[i];
      L.hip.rotation.x = Math.sin(a) * 0.75 * amp * (L.fr ? 1 : 0.9);
      L.knee.rotation.x = Math.max(0, -Math.cos(a)) * 1.25 * amp * (L.fr ? 0.9 : 1.1);
    });
    H.body.position.y = 1.12 + Math.abs(Math.sin(ph + 0.4)) * 0.09 * amp;
    H.body.rotation.x = -Math.sin(ph + 0.4) * 0.05 * amp;
    const graze = p.graze ?? (sp < 0.05 ? 0.35 + 0.35 * Math.sin(t * 0.5 + (p.phase ?? 0)) : 0);
    H.neck.rotation.x = graze * 1.0 - 0.1 * amp + (p.look ?? 0) + Math.sin(ph) * 0.06 * amp;
    H.head.rotation.x = graze * 0.4;
    H.head.rotation.y = Math.sin(t * 0.9 + (p.phase ?? 0)) * 0.18 * (1 - graze);
    H.tail.rotation.x = 0.3 * amp + Math.sin(t * 2.2) * 0.1; H.tail.rotation.z = Math.sin(t * 3 + (p.phase ?? 0)) * 0.18;
    if (p.rear) { H.body.rotation.x = -0.7 * p.rear; H.legs.forEach(L => { if (L.fr) { L.hip.rotation.x = -0.9 * p.rear; L.knee.rotation.x = 1.0 * p.rear; } }); H.body.position.y += 0.45 * p.rear; }
  };
  H.animate(0, {});
  return H;
}

export function makeAnimal(kind, seed = 1, opts = {}) {
  if (kind === 'horse') return makeHorse(seed, opts);
  const spec = SPECIES[kind](seed, opts.color ?? opts.glow ?? (kind === 'deer' ? (seed % 2 === 0) : undefined));
  if (opts.fur) { spec.color = opts.fur; if (opts.legFur) spec.legColor = opts.legFur; }
  if (kind === 'wolf' && opts.glow) { spec.eyeColor = 0xffd27a; spec.eyeGlow = opts.glow; }
  return new Quad(spec);
}

// ---- simple birds (flock) : V-shaped wings flapping, as one instanced mesh
export class Flock {
  constructor(n = 30, seed = 3, color = 0x222222) {
    const g = new THREE.BufferGeometry();
    const V = [0, 0, 0.12, -0.5, 0, -0.05, 0, 0, -0.08, 0, 0, 0.12, 0, 0, -0.08, 0.5, 0, -0.05];
    g.setAttribute('position', new THREE.Float32BufferAttribute(V, 3)); g.computeVertexNormals();
    const m = new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide });
    m.onBeforeCompile = (sh) => {
      sh.uniforms.uT = this.uT = { value: 0 };
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nuniform float uT;')
        .replace('#include <begin_vertex>', `#include <begin_vertex>
          float ph = instanceMatrix[3].x * 0.37 + instanceMatrix[3].z * 0.21;
          transformed.y += abs(position.x) * sin(uT * 11.0 + ph) * 0.9;`);
    };
    this.mesh = new THREE.InstancedMesh(g, m, n);
    this.n = n; this.r = mulberry32(seed);
    this.base = [...Array(n)].map(() => [this.r() * 40 - 20, this.r() * 8, this.r() * 40 - 20, this.r() * 6.28]);
    this.uT = { value: 0 };
    this.mesh.frustumCulled = false;
  }
  update(t, center, scale = 1.2) {
    if (this.uT) this.uT.value = t;
    const m = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(scale, scale, scale), p = new THREE.Vector3();
    this.base.forEach(([x, y, z, ph], i) => {
      const a = t * 0.25 + ph;
      p.set(center.x + x + Math.cos(a) * 14, center.y + y + Math.sin(t * 0.7 + ph) * 1.5, center.z + z + Math.sin(a) * 14);
      q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), -a);
      this.mesh.setMatrixAt(i, m.compose(p, q, s));
    });
    this.mesh.instanceMatrix.needsUpdate = true;
  }
}
