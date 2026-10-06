// Props of the arena film: the golden Horn, the pedestals, supply piles, shelters, dead trees,
// the closing zone of static, the glass dome and the door at the edge of the world.
import * as THREE from 'three';
import { height } from './terrain.js';
import { HG } from './biomes.js';
import { mulberry32 } from './noise.js';
import { E } from '../main.js';

const MATS = {};
const std = (k, o) => MATS[k] || (MATS[k] = new THREE.MeshStandardMaterial(o));
export const MT = {
  gold: () => std('gold', { color: 0xf0bd3c, roughness: 0.26, metalness: 0.92, emissive: 0x5a3300, emissiveIntensity: 0.55 }),
  goldIn: () => std('goldIn', { color: 0x3a2204, roughness: 0.9, side: THREE.DoubleSide }),
  stone: () => std('stone', { color: 0xb7b2a6, roughness: 0.92 }),
  stoneD: () => std('stoneD', { color: 0x7d7a72, roughness: 0.95 }),
  wood: () => std('wood', { color: 0x7a5432, roughness: 0.88 }),
  woodD: () => std('woodD', { color: 0x4a3524, roughness: 0.92 }),
  crate: () => std('crate', { color: 0x9a7040, roughness: 0.85 }),
  cloth: (hex) => std('cl' + hex, { color: hex, roughness: 0.85, side: THREE.DoubleSide }),
  steel: () => std('steel', { color: 0xc3c9d2, roughness: 0.28, metalness: 0.85 }),
  dead: () => std('dead', { color: 0x4d4234, roughness: 1.0 }),
  glow: (hex, i = 1.5) => std('gl' + hex + i, { color: hex, emissive: hex, emissiveIntensity: i, roughness: 0.4 }),
  silver: () => std('silver', { color: 0xdfe5ee, roughness: 0.3, metalness: 0.75, side: THREE.DoubleSide }),
};
function put(c, geo, mat, x, y, z, o = {}) {
  const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z);
  if (o.rx) m.rotation.x = o.rx; if (o.ry) m.rotation.y = o.ry; if (o.rz) m.rotation.z = o.rz;
  if (o.s) m.scale.set(...(Array.isArray(o.s) ? o.s : [o.s, o.s, o.s]));
  m.castShadow = o.shadow ?? true; m.receiveShadow = true; c.own(geo);
  if (o.parent) { o.parent.add(m); return m; }
  return c.add(m);
}
const box = (c, w, h, d, mat, x, y, z, o) => put(c, new THREE.BoxGeometry(w, h, d), mat, x, y, z, o);
const cyl = (c, r0, r1, h, mat, x, y, z, o, seg = 10) => put(c, new THREE.CylinderGeometry(r1, r0, h, seg), mat, x, y, z, o);

// a tube with a radius that changes along the curve
function tubeVar(pts, radii, radial = 22) {
  const n = pts.length, pos = [], idx = [], nor = [];
  const T = [], Nn = [], B = [];
  for (let i = 0; i < n; i++) {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)];
    const t = new THREE.Vector3().subVectors(b, a).normalize(); T.push(t);
  }
  let up = new THREE.Vector3(0, 1, 0);
  for (let i = 0; i < n; i++) {
    let nv = new THREE.Vector3().crossVectors(T[i], up); if (nv.lengthSq() < 1e-4) nv.set(1, 0, 0);
    nv.normalize(); const bv = new THREE.Vector3().crossVectors(T[i], nv).normalize();
    Nn.push(nv); B.push(bv); up = bv.clone();
  }
  for (let i = 0; i < n; i++) for (let j = 0; j <= radial; j++) {
    const a = j / radial * Math.PI * 2, cx = Math.cos(a), sy = Math.sin(a);
    const d = new THREE.Vector3().addScaledVector(Nn[i], cx).addScaledVector(B[i], sy);
    pos.push(pts[i].x + d.x * radii[i], pts[i].y + d.y * radii[i], pts[i].z + d.z * radii[i]); nor.push(d.x, d.y, d.z);
  }
  for (let i = 0; i < n - 1; i++) for (let j = 0; j < radial; j++) {
    const a = i * (radial + 1) + j, b = a + radial + 1;
    idx.push(a, b, a + 1, b, b + 1, a + 1);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); g.setIndex(idx);
  return g;
}

// ---------------------------------------------------------------- the Horn
// a golden conch: a spiral tube that winds up to a tip, its wide mouth open towards +z (rotate with yaw)
export const HORN = { x: HG.cx, z: HG.cz, h: 22, R: 8 };
export function horn(c, o = {}) {
  const x = o.x ?? HORN.x, z = o.z ?? HORN.z, yaw = o.yaw ?? 0, sc = o.s ?? 1;
  const g = new THREE.Group(); g.position.set(x, height(x, z), z); g.rotation.y = Math.PI / 2 - yaw; g.scale.setScalar(sc);   // yaw = bearing the mouth faces (0 = +z)
  // a crescent horn: the centre line is a circular arc in a vertical plane, the tube narrows from a wide mouth to a curled tip
  const pts = [], rad = [];
  const N = 240, Rc = 13.5, phi1 = 3.75;
  for (let i = 0; i <= N; i++) {
    const u = i / N, phi = u * phi1;
    pts.push(new THREE.Vector3(Rc * Math.sin(phi) * (1 - 0.18 * u), 5.4 + Rc * (1 - Math.cos(phi)) * 0.92, Rc * 0.38 * Math.sin(phi * 0.9) * u));
    rad.push((5.4 * Math.pow(1 - u, 1.15) + 0.4) * (1 + 0.035 * Math.sin(u * 95)));
  }
  const geo = tubeVar(pts, rad, 32);
  const mesh = new THREE.Mesh(geo, MT.gold()); mesh.castShadow = true; mesh.receiveShadow = true; g.add(mesh); c.own(geo);
  // dark inside of the mouth (faces -x in local space; the loot is piled in front of it)
  const mouth = new THREE.Mesh(new THREE.CircleGeometry(5.3, 32), MT.goldIn()); mouth.position.copy(pts[0]); mouth.position.x -= 0.2;
  mouth.rotation.y = -Math.PI / 2; g.add(mouth); c.own(mouth.geometry);
  // base: a round stone plaza with three steps
  for (let k = 0; k < 3; k++) { const s = cyl(c, 19 - k * 2.6, 19 - k * 2.6, 0.5, k % 2 ? MT.stoneD() : MT.stone(), 0, 0.25 + k * 0.5, 0, { parent: g }, 48); s.position.y = 0.1 + k * 0.42; s.scale.y = 1; }
  c.add(g);
  g.userData.mouth = new THREE.Vector3(-0.2, 5.4, 0);
  return g;
}
// world position (x, z) of the Horn's mouth, in front of which the loot is piled
export function hornMouth(yaw = 0, d = 6.5) { return [HORN.x + Math.sin(yaw) * (HORN.R + d), HORN.z + Math.cos(yaw) * (HORN.R + d)]; }

// the hundred pedestals in two rings around the Horn (the AIs stand on them at the gong)
export function pedestals(c, o = {}) {
  const out = [], n1 = 60, n2 = 40, R1 = o.R1 ?? 39, R2 = o.R2 ?? 49, cx = o.x ?? HORN.x, cz = o.z ?? HORN.z;
  const geo = new THREE.CylinderGeometry(0.9, 1.05, 0.5, 20);
  const im = new THREE.InstancedMesh(geo, MT.stone(), n1 + n2); im.castShadow = true; im.receiveShadow = true; im.frustumCulled = false;
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(1, 1, 1), p = new THREE.Vector3();
  let k = 0;
  for (const [n, R, off] of [[n1, R1, 0], [n2, R2, 0.5]]) for (let i = 0; i < n; i++) {
    const a = (i + off) / n * Math.PI * 2, px = cx + Math.cos(a) * R, pz = cz + Math.sin(a) * R, py = height(px, pz);
    im.setMatrixAt(k++, m.compose(p.set(px, py + 0.25, pz), q, s));
    out.push({ x: px, z: pz, y: py + 0.5, yaw: Math.atan2(cx - px, cz - pz), a });
  }
  im.instanceMatrix.needsUpdate = true; c.add(im); c.own(geo);
  return out;
}

// ---------------------------------------------------------------- loot, camps, traps
export function lootPile(c, x, z, o = {}) {
  const r = mulberry32(o.seed ?? 4), n = o.n ?? 16, yaw = o.yaw ?? 0;
  for (let i = 0; i < n; i++) {
    const a = (r() - 0.5) * 2.6 + yaw, d = 1.2 + r() * (o.R ?? 5.5), px = x + Math.sin(a) * d, pz = z + Math.cos(a) * d, py = height(px, pz);
    const k = Math.floor(r() * 5);
    if (k === 0) box(c, 0.9, 0.7, 0.7, MT.crate(), px, py + 0.35, pz, { ry: r() * 3 });
    else if (k === 1) { const pk = box(c, 0.5, 0.65, 0.3, MT.cloth(0x6b7a4a), px, py + 0.33, pz, { ry: r() * 3 }); }
    else if (k === 2) box(c, 0.07, 1.1, 0.025, MT.steel(), px, py + 0.55, pz, { rz: (r() - 0.5) * 1.2, ry: r() * 3 });
    else if (k === 3) { const bw = put(c, new THREE.TorusGeometry(0.5, 0.025, 6, 20, Math.PI * 0.9), MT.wood(), px, py + 0.5, pz, { ry: r() * 3, rz: Math.PI / 2 }); }
    else cyl(c, 0.14, 0.14, 0.4, MT.cloth(0x3a6fd0), px, py + 0.2, pz, { ry: r() * 3 }, 10);
  }
}
export function leanTo(c, x, z, yaw = 0, s = 1) {
  const g = new THREE.Group(); g.position.set(x, height(x, z), z); g.rotation.y = yaw; g.scale.setScalar(s);
  for (const k of [-1, 1]) cyl(c, 0.07, 0.09, 2.2, MT.wood(), k * 1.15, 1.0, 0.6, { parent: g, rz: -k * 0.12, rx: 0.0 }, 6);
  cyl(c, 0.06, 0.06, 2.6, MT.wood(), 0, 1.95, 0.6, { parent: g, rz: Math.PI / 2 }, 6);
  const roof = new THREE.PlaneGeometry(2.8, 2.7, 4, 4); const p = roof.attributes.position; for (let i = 0; i < p.count; i++) p.setZ(i, Math.sin(p.getX(i) * 3) * 0.05);
  const rm = put(c, roof, MT.cloth(0x4b6a35), 0, 1.0, -0.2, { parent: g, rx: -Math.PI / 2 + 0.95 }); rm.scale.y = 1;
  c.add(g); return g;
}
export function deadTree(c, x, z, s = 1, seed = 1) {
  const r = mulberry32(seed * 977 + 3), g = new THREE.Group(); g.position.set(x, height(x, z) - 0.2, z); g.rotation.y = r() * 6.28; g.scale.setScalar(s);
  const tr = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.3, 6 + r() * 3, 7), MT.dead()); tr.position.y = 3.2; tr.rotation.z = (r() - 0.5) * 0.18; tr.castShadow = true; g.add(tr); c.own(tr.geometry);
  for (let i = 0; i < 7; i++) {
    const L = 1.5 + r() * 2.4, b = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.09, L, 5), MT.dead());
    b.position.set(0, 3.0 + r() * 4.4, 0); b.rotation.set((r() - 0.5) * 0.7, r() * 6.28, 0.6 + r() * 0.8); b.translateY(L / 2); b.castShadow = true; g.add(b); c.own(b.geometry);
  }
  c.add(g); return g;
}
// a tuft of reeds: thin stalks, cheap
export function reeds(c, cx, cz, n = 40, R = 4, seed = 1) {
  const r = mulberry32(seed), geo = new THREE.CylinderGeometry(0.012, 0.02, 1, 4); geo.translate(0, 0.5, 0);
  const im = new THREE.InstancedMesh(geo, MT.cloth(0x6f7f3a), n); const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), p = new THREE.Vector3(), s = new THREE.Vector3();
  for (let i = 0; i < n; i++) { const a = r() * 6.28, d = Math.sqrt(r()) * R, x = cx + Math.cos(a) * d, zz = cz + Math.sin(a) * d; e.set((r() - 0.5) * 0.3, 0, (r() - 0.5) * 0.3); q.setFromEuler(e); s.set(1, 1.4 + r() * 1.6, 1); im.setMatrixAt(i, m.compose(p.set(x, height(x, zz), zz), q, s)); }
  im.instanceMatrix.needsUpdate = true; im.frustumCulled = false; c.add(im); c.own(geo); return im;
}

// ---------------------------------------------------------------- the static wall (the closing zone)
let _staticMat = null;
function staticMaterial() {
  if (_staticMat) return _staticMat;
  _staticMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending,
    uniforms: { uTime: { value: 0 }, uCol: { value: new THREE.Color(0xff2a55) }, uK: { value: 1 } },
    vertexShader: 'varying vec2 vUv; varying vec3 vP; void main(){ vUv = uv; vP = (modelMatrix*vec4(position,1.0)).xyz; gl_Position = projectionMatrix*viewMatrix*vec4(vP,1.0); }',
    fragmentShader: `varying vec2 vUv; varying vec3 vP; uniform float uTime; uniform vec3 uCol; uniform float uK;
      float h(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453); }
      float n(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f); return mix(mix(h(i),h(i+vec2(1,0)),f.x), mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x), f.y); }
      void main(){
        float ang = atan(vP.x, vP.z) * 18.0;
        float y = vP.y * 0.05;
        float band = n(vec2(ang, y*3.0 - uTime*0.9)) * 0.7 + n(vec2(ang*3.0, y*9.0 + uTime*1.7)) * 0.3;
        float scan = 0.55 + 0.45 * step(0.5, fract(vP.y * 0.7 - uTime * 2.0));
        float fade = smoothstep(0.0, 0.08, vUv.y) * (1.0 - smoothstep(0.55, 1.0, vUv.y));
        float a = (0.18 + band * 0.9) * scan * fade * uK;
        gl_FragColor = vec4(uCol * a * 1.6, a);
      }`,
  });
  return _staticMat;
}
export function staticWall(c, radius, o = {}) {
  const cx = o.x ?? HG.cx, cz = o.z ?? HG.cz, H = o.h ?? 140;
  const geo = new THREE.CylinderGeometry(radius, radius, H, 128, 1, true); c.own(geo);
  const m = new THREE.Mesh(geo, staticMaterial()); m.position.set(cx, HG.floorY + H / 2 - 8, cz); m.frustumCulled = false; m.renderOrder = 5; c.add(m);
  const mat = staticMaterial(); c.on((t) => { mat.uniforms.uTime.value = t; mat.uniforms.uK.value = o.k ?? 1; });
  return m;
}
// the zone radius on a given day (1000 m at day 0, the size of the Horn on day 100)
export const zoneRadius = (day) => 14 + 500 * Math.pow(Math.max(0, 1 - day / 100), 1.55);

// ---------------------------------------------------------------- the glass dome
let _domeMat = null;
export function domeGlass(c, o = {}) {
  if (!_domeMat) _domeMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, side: THREE.BackSide, blending: THREE.AdditiveBlending,
    uniforms: { uTime: { value: 0 }, uK: { value: 1 } },
    vertexShader: 'varying vec3 vN; varying vec3 vP; void main(){ vN = normal; vP = position; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
    fragmentShader: `varying vec3 vN; varying vec3 vP; uniform float uTime; uniform float uK;
      void main(){
        vec3 d = normalize(vP);
        vec2 uv = vec2(atan(d.x, d.z) * 9.0, asin(clamp(d.y, -1.0, 1.0)) * 12.0);
        uv.x += mod(floor(uv.y), 2.0) * 0.5;
        vec2 f = fract(uv) - 0.5; float e = max(abs(f.x) * 1.15, abs(f.y));
        float line = smoothstep(0.46, 0.5, e);
        float sh = 0.5 + 0.5 * sin(uTime * 0.6 + d.x * 7.0 + d.y * 5.0);
        float hor = 1.0 - smoothstep(0.0, 0.9, d.y);
        float a = (line * 0.55 + 0.035) * (0.4 + 0.6 * sh) * (0.35 + 0.65 * hor) * uK;
        gl_FragColor = vec4(vec3(0.55, 0.85, 1.0) * a, a);
      }`,
  });
  const R = o.R ?? 1500;
  const geo = new THREE.SphereGeometry(R, 64, 32, 0, Math.PI * 2, 0, Math.PI * 0.5); c.own(geo);
  const m = new THREE.Mesh(geo, _domeMat); m.position.set(o.x ?? HG.cx, 0, o.z ?? HG.cz); m.frustumCulled = false; m.renderOrder = 4; c.add(m);
  c.on((t) => { _domeMat.uniforms.uTime.value = t; _domeMat.uniforms.uK.value = o.k ?? 1; });
  return m;
}

// ---------------------------------------------------------------- the door at the edge of the world
export function edgeDoor(c, x, z, yaw = 0, o = {}) {
  const g = new THREE.Group(); g.position.set(x, height(x, z), z); g.rotation.y = yaw;
  const w = o.w ?? 5, h = o.h ?? 8;
  box(c, w + 1.4, h + 1.0, 1.2, MT.stoneD(), 0, h / 2 + 0.2, 0, { parent: g });
  const glow = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.5), new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xdff3ff, emissiveIntensity: o.k ?? 2.4, roughness: 0.4 }));
  glow.position.set(0, h / 2, 0.45); g.add(glow); c.own(glow.geometry);
  if (o.light !== false) { const L = new THREE.PointLight(0xcfeaff, o.li ?? 40, 40, 1.6); L.position.set(0, h * 0.6, 2.2); g.add(L); }
  c.add(g); return g;
}

// ---------------------------------------------------------------- supply drop on a silver parachute
export function parachute(c, x, z, t0, t1, h0 = 90, o = {}) {
  const g = new THREE.Group(); c.add(g);
  const dome = new THREE.Mesh(new THREE.SphereGeometry(2.6, 20, 10, 0, Math.PI * 2, 0, Math.PI * 0.5), MT.silver()); dome.position.y = 4.2; dome.scale.y = 0.75; g.add(dome); c.own(dome.geometry);
  for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2, ln = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 4.4, 3), MT.steel()); ln.position.set(Math.cos(a) * 1.3, 2.2, Math.sin(a) * 1.3); ln.rotation.set(Math.sin(a) * 0.3, 0, -Math.cos(a) * 0.3); g.add(ln); c.own(ln.geometry); }
  const crate = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.8, 0.8), new THREE.MeshStandardMaterial({ color: 0xe9eef5, roughness: 0.3, metalness: 0.7, emissive: 0x405060, emissiveIntensity: 0.4 })); crate.position.y = 0.4; g.add(crate); c.own(crate.geometry);
  const gy = height(x, z);
  c.on((t) => { const u = Math.max(0, Math.min(1, (t - t0) / (t1 - t0))); const e = 1 - Math.pow(1 - u, 1.4); g.position.set(x + Math.sin(t * 0.9) * 1.2 * (1 - u), gy + h0 * (1 - e), z); dome.visible = u < 1; g.children.forEach((ch, i) => { if (i > 0 && i < 13) ch.visible = u < 1; }); g.rotation.y = t * 0.3; });
  return g;
}

// ---------------------------------------------------------------- falling snow / ash
export function drift(c, o = {}) {
  const n = o.n ?? 2500, R = o.R ?? 40, geo = new THREE.BufferGeometry(); const r = mulberry32(o.seed ?? 3), pos = new Float32Array(n * 3), v = new Float32Array(n * 2);
  for (let i = 0; i < n; i++) { pos[i * 3] = (r() - 0.5) * 2 * R; pos[i * 3 + 1] = r() * R; pos[i * 3 + 2] = (r() - 0.5) * 2 * R; v[i * 2] = 0.4 + r() * 0.8; v[i * 2 + 1] = r() * 6.28; }
  const base = pos.slice(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const mat = new THREE.PointsMaterial({ color: o.color ?? 0xffffff, size: o.size ?? 0.14, transparent: true, opacity: o.opacity ?? 0.85, depthWrite: false, sizeAttenuation: true });
  const pts = new THREE.Points(geo, mat); pts.frustumCulled = false; c.add(pts); c.own(geo);
  const fall = o.fall ?? 1.4, wind = o.wind ?? 1.2;
  c.after((t) => {
    const cam = c.cam ? c.cam.pos : E.camera.position, p = geo.attributes.position.array;
    for (let i = 0; i < n; i++) {
      let y = (base[i * 3 + 1] - t * fall * v[i * 2]) % R; if (y < 0) y += R;
      p[i * 3 + 1] = y; p[i * 3] = base[i * 3] + Math.sin(t * 0.7 + v[i * 2 + 1]) * wind * 0.5;
    }
    pts.position.set(cam.x, cam.y - R * 0.35, cam.z); geo.attributes.position.needsUpdate = true;
  });
  return pts;
}

// ---------------------------------------------------------------- dressing for the worlds (scatter props around a focus point)
export function swampDress(c, cx, cz, R = 40, o = {}) {
  const r = mulberry32(o.seed ?? 7);
  for (let i = 0; i < (o.trees ?? 14); i++) { const a = r() * 6.28, d = 6 + Math.sqrt(r()) * R, x = cx + Math.cos(a) * d, z = cz + Math.sin(a) * d; deadTree(c, x, z, 0.8 + r() * 0.7, i + 1); }
  for (let i = 0; i < (o.reeds ?? 14); i++) { const a = r() * 6.28, d = 3 + Math.sqrt(r()) * R, x = cx + Math.cos(a) * d, z = cz + Math.sin(a) * d; reeds(c, x, z, 36, 3.2, i + 3); }
}
export function rubble(c, cx, cz, n = 10, R = 12, o = {}) {
  const r = mulberry32(o.seed ?? 5);
  for (let i = 0; i < n; i++) {
    const a = r() * 6.28, d = Math.sqrt(r()) * R, x = cx + Math.cos(a) * d, z = cz + Math.sin(a) * d, s = (o.s ?? 1) * (0.5 + r() * 1.6);
    const m = put(c, new THREE.DodecahedronGeometry(s, 0), o.mat || MT.stoneD(), x, height(x, z) + s * 0.45, z, { rx: r() * 3, ry: r() * 3, s: [1, 0.7 + r() * 0.4, 1] });
  }
}
