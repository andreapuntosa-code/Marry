// Instanced crowd of simple mannequins (thousands), animated per frame (bob/sway/walk).
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { mulberry32 } from './noise.js';

let GEO = null;
function crowdGeo() {
  if (GEO) return GEO;
  const parts = [];
  const add = (g, x, y, z, sx = 1, sy = 1, sz = 1) => { g.scale(sx, sy, sz); g.translate(x, y, z); g.deleteAttribute('uv'); parts.push(g.index ? g.toNonIndexed() : g); };
  add(new THREE.IcosahedronGeometry(0.2, 1), 0, 1.6, 0);
  add(new THREE.CylinderGeometry(0.17, 0.2, 0.58, 10), 0, 1.13, 0, 1, 1, 0.68);
  add(new THREE.SphereGeometry(0.2, 10, 6), 0, 0.86, 0, 1, 0.5, 0.68);
  for (const s of [-1, 1]) {
    add(new THREE.CylinderGeometry(0.075, 0.07, 0.8, 7), s * 0.1, 0.42, 0);
    add(new THREE.CylinderGeometry(0.055, 0.05, 0.56, 6), s * 0.24, 1.08, 0);
  }
  GEO = mergeGeometries(parts); GEO.computeVertexNormals();
  return GEO;
}

export class Crowd {
  constructor(n, opts = {}) {
    this.n = n;
    const mat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5, metalness: 0 });
    this.mesh = new THREE.InstancedMesh(crowdGeo(), mat, n);
    this.mesh.castShadow = opts.shadows ?? false; this.mesh.receiveShadow = false; this.mesh.frustumCulled = false;
    this.pos = new Float32Array(n * 3); this.yaw = new Float32Array(n); this.ph = new Float32Array(n); this.sc = new Float32Array(n);
    this.walk = new Float32Array(n); this.pitch = new Float32Array(n);
    const r = mulberry32(opts.seed ?? 3);
    for (let i = 0; i < n; i++) { this.ph[i] = r() * 6.28; this.sc[i] = 0.92 + 0.16 * r(); }
    this.colors = opts.colors || [0xf2f2f2, 0xeeeeea, 0xe6e6e6, 0xf4f1ec];
    const c = new THREE.Color();
    for (let i = 0; i < n; i++) { c.set(this.colors[Math.floor(r() * this.colors.length)]); this.mesh.setColorAt(i, c); }
    this._m = new THREE.Matrix4(); this._q = new THREE.Quaternion(); this._s = new THREE.Vector3(); this._p = new THREE.Vector3(); this._e = new THREE.Euler();
  }
  set(i, x, y, z, yaw = 0, walk = 0) { this.pos[i * 3] = x; this.pos[i * 3 + 1] = y; this.pos[i * 3 + 2] = z; this.yaw[i] = yaw; this.walk[i] = walk; }
  color(i, hex) { this.mesh.setColorAt(i, new THREE.Color(hex)); this.mesh.instanceColor.needsUpdate = true; }
  colorRGB(i, c) { this.mesh.setColorAt(i, c); this.mesh.instanceColor.needsUpdate = true; }
  // lying on the ground (shut down): pitch the body flat
  lie(i, on = true) { this.pitch[i] = on ? -Math.PI / 2 : 0; }
  update(t) {
    for (let i = 0; i < this.n; i++) {
      const w = this.walk[i], ph = this.ph[i] + t * 6.5;
      const bob = w > 0 ? Math.abs(Math.sin(ph)) * 0.05 : Math.sin(t * 1.5 + this.ph[i]) * 0.008;
      this._p.set(this.pos[i * 3], this.pos[i * 3 + 1] + bob, this.pos[i * 3 + 2]);
      this._e.set(this.pitch[i], this.yaw[i] + (w > 0 ? Math.sin(ph) * 0.06 : 0), w > 0 ? Math.sin(ph) * 0.04 : 0, 'YXZ');
      this._q.setFromEuler(this._e);
      const s = this.sc[i] * 0.92; this._s.set(s, s, s);
      this.mesh.setMatrixAt(i, this._m.compose(this._p, this._q, this._s));
    }
    this.mesh.instanceMatrix.needsUpdate = true;
  }
}
