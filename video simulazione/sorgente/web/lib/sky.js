// Sky (Preetham), sun & ambient light, fog, clouds, stars, moon — by time of day.
import * as THREE from 'three';
import { makeSkyDome } from './skydome.js';
import { mulberry32, clamp, lerp, smoothstep } from './noise.js';

export class Atmosphere {
  constructor(scene) {
    this.scene = scene;
    this.sky = makeSkyDome();
    scene.add(this.sky);
    this.sun = new THREE.DirectionalLight(0xffffff, 3);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(2048, 2048);
    this.sun.shadow.bias = -0.0004;
    this.sun.shadow.normalBias = 0.6;
    scene.add(this.sun, this.sun.target);
    this.hemi = new THREE.HemisphereLight(0xbfd7ff, 0x5a4b36, 1.0);
    scene.add(this.hemi);
    this.fog = new THREE.FogExp2(0xbfd2e6, 0.00035);
    scene.fog = this.fog;
    this.sunDir = new THREE.Vector3();
    this._stars();
    this.moon = new THREE.Sprite(new THREE.SpriteMaterial({ map: radialTex(256, [[0, 'rgba(255,255,245,1)'], [0.18, 'rgba(250,250,235,1)'], [0.22, 'rgba(200,215,255,0.35)'], [1, 'rgba(120,150,255,0)']]), depthWrite: false, fog: false, transparent: true }));
    this.moon.scale.setScalar(900);
    scene.add(this.moon);
  }
  _stars() {
    const r = mulberry32(5), N = 2600, pos = new Float32Array(N * 3), col = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      const u = r() * 2 - 1, a = r() * Math.PI * 2, y = Math.abs(u) * 0.98 + 0.02;
      const rr = Math.sqrt(1 - y * y);
      pos.set([Math.cos(a) * rr * 18000, y * 18000, Math.sin(a) * rr * 18000], i * 3);
      const b = 0.4 + 0.6 * Math.pow(r(), 3);
      col.set([b, b, b * (0.9 + 0.2 * r())], i * 3);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    this.starMat = new THREE.PointsMaterial({ size: 2.2, sizeAttenuation: false, vertexColors: true, transparent: true, opacity: 0, depthWrite: false, fog: false });
    this.stars = new THREE.Points(g, this.starMat);
    this.stars.frustumCulled = false;
    this.scene.add(this.stars);
  }
  _clouds() {
    this.clouds = new THREE.Group();
    const r = mulberry32(11);
    const texs = [0, 1, 2, 3].map(k => cloudTex(512, 100 + k));
    for (let i = 0; i < 46; i++) {
      const m = new THREE.SpriteMaterial({ map: texs[i % 4], transparent: true, depthWrite: false, opacity: 0.9, fog: false, color: 0xffffff });
      const s = new THREE.Sprite(m);
      const a = r() * Math.PI * 2, d = 900 + r() * 5200;
      s.position.set(Math.cos(a) * d, 700 + r() * 900, Math.sin(a) * d);
      const sc = 500 + r() * 1100;
      s.scale.set(sc * 1.9, sc * 0.75, 1);
      s.userData.drift = 2 + r() * 4;
      this.clouds.add(s);
    }
    this.scene.add(this.clouds);
  }
  // hours: 0..24 ; cloud 0..1 ; storm 0..1
  set(hours, opts = {}) {
    const cloud = opts.cloud ?? 0.42, storm = opts.storm ?? 0, azim = opts.azimuth ?? 210;
    const elev = Math.sin((hours - 6) / 12 * Math.PI) * 58 + (opts.elevBias || 0);
    const phi = THREE.MathUtils.degToRad(90 - elev), theta = THREE.MathUtils.degToRad(azim + (hours - 12) * 7);
    this.sunDir.setFromSphericalCoords(1, phi, theta);
    const day = smoothstep(-7, 6, elev), golden = 1 - smoothstep(3, 24, elev), night = 1 - day;
    const C = (h) => new THREE.Color(h);
    // sky palette
    const zen = C(0x3a78d4).lerp(C(0x4a6fb8), golden * 0.5).lerp(C(0x050a18), night).lerp(C(0x3d4651), storm);
    const hor = C(0xb9d3ee).lerp(C(0xf3b07a), golden * 0.85).lerp(C(0x101a2e), night).lerp(C(0x6c757e), storm);
    const u = this.sky.material.uniforms;
    u.uZenith.value.copy(zen); u.uHorizon.value.copy(hor);
    u.uGround.value.copy(hor).multiplyScalar(0.55);
    u.uSunDir.value.copy(this.sunDir);
    const sunCol = C(0xfff3e0).lerp(C(0xff8f45), golden * 0.9);
    u.uSunCol.value.copy(sunCol).multiplyScalar(day * (1 - storm));
    u.uGlow.value = 0.6 + golden * 1.6;
    u.uCover.value = clamp(cloud + storm * 0.6, 0, 0.95);
    u.uCloudCol.value.copy(C(0xffffff).lerp(C(0xffc79a), golden * 0.7).lerp(C(0x1b2436), night).lerp(C(0x8a9097), storm));
    u.uCloudShade.value.copy(C(0x9fb0c8).lerp(C(0xc98f7a), golden * 0.6).lerp(C(0x0e1420), night).lerp(C(0x4a5058), storm));
    // lights
    this.sun.color.copy(sunCol);
    this.sun.intensity = lerp(0.0, 3.0, day) * (1 - storm * 0.8);
    if (day < 0.2) { this.sunDir.set(-0.35, 0.75, 0.45).normalize(); this.sun.color.set(0x8aa4ff); this.sun.intensity = 0.5 + 2.5 * day; }
    this.hemi.color.copy(C(0xcfe0ff).lerp(C(0xffd2b0), golden * 0.45)).multiplyScalar(lerp(0.1, 1.0, day));
    this.hemi.groundColor.copy(C(0x6a5a40)).multiplyScalar(lerp(0.12, 1.0, day));
    this.hemi.intensity = lerp(0.8, 0.55, day) * (1 - storm * 0.2) + storm * 0.3;
    // fog = horizon haze
    this.fog.color.copy(hor).lerp(C(0x9fb4c8), (1 - golden) * day * 0.3);
    this.fog.density = (opts.fog ?? 0.00019) * (1 + storm * 3);
    this.scene.background = null;
    this.starMat.opacity = clamp(1 - day * 1.8) * (1 - storm);
    this.moon.visible = day < 0.35; this.moon.material.opacity = clamp(1 - day * 2.5);
    this.moon.position.set(-0.35, 0.75, 0.45).normalize().multiplyScalar(16000);
    this.day = day; this.golden = golden; this.elev = elev; this.storm = storm;
    this.exposure = lerp(0.75, 0.95, day) * (1 - storm * 0.15);
    this.envDirty = true;
    return this;
  }
  focusShadow(x, y, z, radius) {
    const d = this.sunDir.clone().multiplyScalar(radius * 3 + 200);
    this.sun.position.set(x + d.x, y + d.y, z + d.z);
    this.sun.target.position.set(x, y, z);
    this.sun.target.updateMatrixWorld();
    const c = this.sun.shadow.camera;
    c.left = -radius; c.right = radius; c.top = radius; c.bottom = -radius;
    c.near = 1; c.far = radius * 6 + 600;
    c.updateProjectionMatrix();
  }
  update(t, camPos) {
    const u = this.sky.material.uniforms;
    u.uTime.value = t; u.uCamXZ.value.set(camPos.x, camPos.z);
    this.sky.position.copy(camPos);
    this.stars.position.copy(camPos);
  }
  // image-based lighting from the sky (soft ambient + reflections)
  buildEnv(renderer) {
    if (!this.envDirty && this.envMap) return this.envMap;
    const pm = this._pmrem || (this._pmrem = new THREE.PMREMGenerator(renderer));
    const sc = new THREE.Scene();
    const dome = makeSkyDome();
    for (const k of Object.keys(dome.material.uniforms)) {
      const v = this.sky.material.uniforms[k].value;
      dome.material.uniforms[k].value = (v && v.clone) ? v.clone() : v;
    }
    dome.material.uniforms.uCover.value *= 0.6;
    dome.material.uniforms.uGround.value = new THREE.Color(0x4f5a3a).multiplyScalar(0.6 + 0.4 * this.day);
    dome.scale.setScalar(0.004);
    sc.add(dome);
    if (this.envMap) this.envMap.dispose();
    this.envMap = pm.fromScene(sc, 0, 0.1, 200).texture;
    this.envDirty = false;
    return this.envMap;
  }
}

export function radialTex(size, stops) {
  const cv = document.createElement('canvas'); cv.width = cv.height = size;
  const g = cv.getContext('2d');
  const gr = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  for (const [o, c] of stops) gr.addColorStop(o, c);
  g.fillStyle = gr; g.fillRect(0, 0, size, size);
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; return t;
}

function cloudTex(size, seed) {
  const cv = document.createElement('canvas'); cv.width = size; cv.height = size;
  const g = cv.getContext('2d');
  const r = mulberry32(seed);
  for (let i = 0; i < 70; i++) {
    const x = size * (0.2 + 0.6 * r()), y = size * (0.42 + 0.22 * (r() - 0.5) * 2 * (1 - Math.abs(x / size - 0.5)));
    const rad = size * (0.07 + 0.16 * r()) * (1 - Math.abs(x / size - 0.5) * 1.1);
    const gr = g.createRadialGradient(x, y, 0, x, y, rad);
    const shade = 225 + Math.floor(30 * r());
    gr.addColorStop(0, `rgba(${shade},${shade},${shade + 4},0.55)`);
    gr.addColorStop(0.6, `rgba(${shade - 10},${shade - 8},${shade},0.22)`);
    gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr; g.beginPath(); g.arc(x, y, rad, 0, Math.PI * 2); g.fill();
  }
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; return t;
}
