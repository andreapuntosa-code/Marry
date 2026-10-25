// Fire, embers, smoke, torches, lightning, rain, flash.
import * as THREE from 'three';
import { mulberry32, clamp, lerp } from './noise.js';

function softTex(stops) {
  const cv = document.createElement('canvas'); cv.width = cv.height = 128;
  const g = cv.getContext('2d'); const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  for (const [o, c] of stops) gr.addColorStop(o, c);
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; return t;
}
let FLAME_TEX, GLOW_TEX, SMOKE_TEX;
function texs() {
  if (FLAME_TEX) return;
  FLAME_TEX = softTex([[0, 'rgba(255,250,220,1)'], [0.25, 'rgba(255,190,80,0.9)'], [0.55, 'rgba(255,90,20,0.45)'], [1, 'rgba(120,20,0,0)']]);
  GLOW_TEX = softTex([[0, 'rgba(255,200,120,0.55)'], [0.4, 'rgba(255,140,60,0.18)'], [1, 'rgba(255,100,30,0)']]);
  SMOKE_TEX = softTex([[0, 'rgba(90,90,95,0.45)'], [0.6, 'rgba(70,70,75,0.18)'], [1, 'rgba(60,60,60,0)']]);
}

// A campfire / torch flame made of additive billboard particles (deterministic in t).
export class Fire {
  constructor(opts = {}) {
    texs();
    this.size = opts.size ?? 1.0;
    this.n = opts.n ?? 26;
    this.group = new THREE.Group();
    this.r = mulberry32(opts.seed ?? 5);
    this.parts = [];
    const fm = new THREE.SpriteMaterial({ map: FLAME_TEX, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, fog: false });
    for (let i = 0; i < this.n; i++) {
      const s = new THREE.Sprite(fm); this.group.add(s);
      this.parts.push({ s, ph: this.r(), x: (this.r() - 0.5) * 0.5, z: (this.r() - 0.5) * 0.5, sp: 0.8 + this.r() * 0.6 });
    }
    this.glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: GLOW_TEX, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, fog: false }));
    this.group.add(this.glow);
    this.embers = null;
    if (opts.embers !== false) {
      const N = opts.emberN ?? 40, g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(N * 3), 3));
      this.embers = new THREE.Points(g, new THREE.PointsMaterial({ color: 0xffb060, size: 0.06 * this.size, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false }));
      this.embersData = [...Array(N)].map(() => [this.r(), (this.r() - 0.5) * 0.6, (this.r() - 0.5) * 0.6, 0.5 + this.r()]);
      this.group.add(this.embers);
    }
    this.light = opts.light === false ? null : new THREE.PointLight(0xff9a4a, opts.lightIntensity ?? 12, opts.lightDist ?? 14, 1.6);
    if (this.light) { this.light.position.y = 0.6 * this.size; this.group.add(this.light); }
    this.smoke = null;
    if (opts.smoke) {
      const sm = new THREE.SpriteMaterial({ map: SMOKE_TEX, depthWrite: false, transparent: true });
      this.smoke = [...Array(10)].map(() => { const s = new THREE.Sprite(sm); this.group.add(s); return { s, ph: this.r() }; });
    }
    this.intensity = 1;
  }
  update(t) {
    const S = this.size * this.intensity;
    for (const p of this.parts) {
      const life = (t * p.sp * 1.4 + p.ph) % 1;
      const y = life * 1.1 * S;
      const sc = (0.55 - life * 0.45) * S * (0.9 + 0.2 * Math.sin(t * 13 + p.ph * 9));
      p.s.position.set(p.x * S * (1 - life) + Math.sin(t * 5 + p.ph * 7) * 0.05 * S, y + 0.1 * S, p.z * S * (1 - life));
      p.s.scale.setScalar(Math.max(0.01, sc));
      p.s.material.opacity = 1;
    }
    this.glow.scale.setScalar(4.5 * S * (0.92 + 0.08 * Math.sin(t * 9)));
    this.glow.position.y = 0.5 * S;
    if (this.embers) {
      const a = this.embers.geometry.attributes.position;
      this.embersData.forEach(([ph, x, z, sp], i) => {
        const life = (t * 0.45 * sp + ph) % 1;
        a.setXYZ(i, x * S + Math.sin(t * 2 + ph * 20) * 0.3 * life * S, life * 3.5 * S, z * S + Math.cos(t * 1.7 + ph * 13) * 0.3 * life * S);
      });
      a.needsUpdate = true;
    }
    if (this.smoke) this.smoke.forEach(({ s, ph }) => { const life = (t * 0.12 + ph) % 1; s.position.set(Math.sin(ph * 30 + t * 0.3) * life * 1.5, 1.2 * this.size + life * 6, Math.cos(ph * 20) * life * 1.2); s.scale.setScalar((0.6 + life * 3.5) * this.size); s.material.opacity = (1 - life) * 0.6; });
    if (this.light) this.light.intensity = (this.baseLight ?? (this.baseLight = this.light.intensity)) * this.intensity * (0.82 + 0.12 * Math.sin(t * 11) + 0.06 * Math.sin(t * 23.7));
  }
}

// many torches cheaply: glowing sprites only (no per-torch light)
export class TorchField {
  constructor(n, seed = 9) {
    texs();
    this.n = n;
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(n * 3), 3));
    this.flames = new THREE.Points(g, new THREE.PointsMaterial({ map: FLAME_TEX, size: 0.9, sizeAttenuation: true, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, color: 0xffc070, fog: false }));
    this.glows = new THREE.Points(g, new THREE.PointsMaterial({ map: GLOW_TEX, size: 4.5, sizeAttenuation: true, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, color: 0xff9a50, opacity: 0.55, fog: false }));
    this.flames.frustumCulled = false; this.glows.frustumCulled = false;
    this.group = new THREE.Group(); this.group.add(this.glows, this.flames);
  }
  setPositions(P) {
    const a = this.flames.geometry.attributes.position;
    for (let i = 0; i < this.n; i++) a.setXYZ(i, P[i][0], P[i][1], P[i][2]);
    a.needsUpdate = true;
  }
}

// Lightning bolt: jagged emissive line strip
export function lightningBolt(from, to, seed = 1, branches = 3) {
  const r = mulberry32(seed), g = new THREE.Group();
  const mk = (a, b, w, depth) => {
    const pts = [a.clone()];
    const N = 14;
    for (let i = 1; i < N; i++) {
      const p = a.clone().lerp(b, i / N);
      const off = (1 - Math.abs(i / N - 0.5) * 2) * a.distanceTo(b) * 0.06;
      p.x += (r() - 0.5) * off * 2; p.z += (r() - 0.5) * off * 2;
      pts.push(p);
    }
    pts.push(b.clone());
    const geo = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 60, w, 4, false);
    const m = new THREE.MeshBasicMaterial({ color: 0xeef3ff, fog: false });
    g.add(new THREE.Mesh(geo, m));
    if (depth > 0) for (let k = 0; k < branches; k++) {
      const s = pts[3 + Math.floor(r() * 8)];
      const e = s.clone().add(new THREE.Vector3((r() - 0.5) * 20, -(5 + r() * 15), (r() - 0.5) * 20));
      mk(s, e, w * 0.5, depth - 1);
    }
  };
  mk(from, to, 0.25, 1);
  return g;
}

// Rain: line segments falling, deterministic
export class Rain {
  constructor(n = 3000, area = 60, seed = 2) {
    const r = mulberry32(seed);
    this.base = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) { this.base[i * 3] = (r() - 0.5) * area; this.base[i * 3 + 1] = r() * 30; this.base[i * 3 + 2] = (r() - 0.5) * area; }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(n * 6), 3));
    this.lines = new THREE.LineSegments(g, new THREE.LineBasicMaterial({ color: 0xb8c4d0, transparent: true, opacity: 0.45 }));
    this.lines.frustumCulled = false; this.n = n; this.area = area;
  }
  update(t, center) {
    const a = this.lines.geometry.attributes.position;
    for (let i = 0; i < this.n; i++) {
      const x = center.x + this.base[i * 3], z = center.z + this.base[i * 3 + 2];
      const y = center.y + ((this.base[i * 3 + 1] - t * 22) % 30 + 30) % 30;
      a.setXYZ(i * 2, x, y, z); a.setXYZ(i * 2 + 1, x - 0.15, y - 0.9, z);
    }
    a.needsUpdate = true;
  }
}
