// Engine entry: renderer, scene lifecycle, API used by the Python frame driver.
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { FXAAShader } from 'three/addons/shaders/FXAAShader.js';
import { Atmosphere } from './lib/sky.js';
import { buildTerrain, buildTerrainWarped, buildTerrainWedge, terrainMaterial, waterMaterial, buildRiver, buildLake, height } from './lib/terrain.js';
import { Vegetation, WIND, IMPOSTOR_LIGHT } from './lib/nature.js';
import { LIGHT } from './lib/vlit.js';
import { Person, CAST, ALL20 } from './lib/people.js';
import { Town, PROTO, buildingMaterial } from './lib/buildings.js';
import { makeAnimal, Flock } from './lib/animals.js';
import { Fire, TorchField, lightningBolt, Rain } from './lib/fx.js';
import { drawGroundMap, GROUND_UNIFORMS } from './lib/groundmap.js';

// cinema scope: the picture band is 1920x804 (2.39:1); the frame driver adds the black bars
// (?scope=0 renders full 16:9 frames, used for the thumbnails)
const params = new URLSearchParams(location.search);
const SCOPE = params.get('scope') !== '0';
// ?w=&h= : custom canvas (covers 16:9, the vertical Short 9:16)
const W = parseInt(params.get('w') || '1920'), H = parseInt(params.get('h') || (SCOPE ? '804' : '1080'));
export const FILM = { aspect: W / H, vScale: SCOPE ? 0.8 : 1.0 };
const SCALE = parseFloat(params.get('scale') || '1');

export const E = {};
E.renderer = new THREE.WebGLRenderer({ antialias: false, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
E.renderer.setPixelRatio(1);
E.renderer.setSize(Math.round(W * SCALE), Math.round(H * SCALE));
// CSS size = internal size: the frame driver grabs exact pixels and upscales with Lanczos itself
E.renderer.domElement.style.width = Math.round(W * SCALE) + 'px';
E.renderer.domElement.style.height = Math.round(H * SCALE) + 'px';
document.body.style.margin = '0'; document.body.style.background = '#000';
E.renderer.shadowMap.enabled = true;
E.renderer.shadowMap.type = THREE.PCFShadowMap;
E.renderer.toneMapping = THREE.ACESFilmicToneMapping;
E.renderer.toneMappingExposure = 1.0;
E.renderer.outputColorSpace = THREE.SRGBColorSpace;
document.body.appendChild(E.renderer.domElement);

E.scene = new THREE.Scene();
E.camera = new THREE.PerspectiveCamera(42, W / H, 0.1, 30000);
E.FILM = FILM;
E.atmo = new Atmosphere(E.scene);
E.veg = new Vegetation(E.scene);
E.veg.bake(E.renderer);
E.water = waterMaterial();
E.world = new THREE.Group();
E.scene.add(E.world);

// ------------------------------------------------------------------ post (hero shots)
// key moments are rendered at full resolution through: scene (+ depth) -> depth of field -> output (tonemap + sRGB) -> FXAA
const DOF_SHADER = {
  uniforms: { tDiffuse: { value: null }, tDepth: { value: null }, uFocus: { value: 10 }, uAperture: { value: 0 }, uMaxBlur: { value: 10 },
    uTexel: { value: new THREE.Vector2(1 / W, 1 / H) }, uNear: { value: 0.1 }, uFar: { value: 30000 } },
  vertexShader: 'varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
  fragmentShader: `
    #include <packing>
    uniform sampler2D tDiffuse; uniform sampler2D tDepth;
    uniform float uFocus, uAperture, uMaxBlur, uNear, uFar; uniform vec2 uTexel;
    varying vec2 vUv;
    float viewZ(vec2 uv) { return -perspectiveDepthToViewZ(texture2D(tDepth, uv).x, uNear, uFar); }
    float coc(float z) { return min(uMaxBlur, uAperture * abs(1.0 / uFocus - 1.0 / z)); }
    void main() {
      vec4 c0 = texture2D(tDiffuse, vUv);
      float z0 = viewZ(vUv), k0 = coc(z0);
      vec3 acc = c0.rgb; float ws = 1.0;
      const int N = 24;
      for (int i = 0; i < N; i++) {
        float fi = float(i) + 0.5;
        float r = sqrt(fi / float(N)) * uMaxBlur;
        vec2 uv = vUv + vec2(cos(fi * 2.39996323), sin(fi * 2.39996323)) * r * uTexel;
        float z = viewZ(uv), k = coc(z);
        // a sample counts when its blur disk reaches this pixel; behind a sharp pixel it is limited by our own blur (no halos)
        float kk = z > z0 ? min(k, k0) : k;
        float w = clamp(kk - r + 1.0, 0.0, 1.0);
        acc += texture2D(tDiffuse, uv).rgb * w; ws += w;
      }
      gl_FragColor = vec4(acc / ws, c0.a);
    }`,
};
class DofPass extends ShaderPass {
  render(renderer, writeBuffer, readBuffer, dt, mask) { this.uniforms.tDepth.value = readBuffer.depthTexture; super.render(renderer, writeBuffer, readBuffer, dt, mask); }
}
const COMPOSERS = new Map();
function composerFor(w, h) {
  const key = w + 'x' + h;
  if (COMPOSERS.has(key)) return COMPOSERS.get(key);
  const rt = new THREE.WebGLRenderTarget(w, h, { type: THREE.HalfFloatType });
  rt.depthTexture = new THREE.DepthTexture(w, h, THREE.FloatType);
  const comp = new EffectComposer(E.renderer, rt);
  comp.addPass(new RenderPass(E.scene, E.camera));
  const dof = new DofPass(DOF_SHADER); comp.addPass(dof);
  comp.addPass(new OutputPass());
  const fxaa = new ShaderPass(FXAAShader); fxaa.material.uniforms.resolution.value.set(1 / w, 1 / h); comp.addPass(fxaa);
  const o = { comp, dof, fxaa, w, h }; COMPOSERS.set(key, o); return o;
}
E.post = null;
E.dof = { focus: 10, aperture: 0, maxBlur: 10 };
// per-shot quality: {scale, dof, fxaa}; returns the canvas size the frame driver must grab
E.setQuality = function (q = {}) {
  const sc = q.scale ?? SCALE;
  const w = Math.round(W * sc), h = Math.round(H * sc);
  if (E.renderer.domElement.width !== w || E.renderer.domElement.height !== h) E.renderer.setSize(w, h);
  E.post = (q.dof || q.fxaa || params.get('fxaa') === '1') ? composerFor(w, h) : null;
  if (E.post) E.post.dof.enabled = !!q.dof;
  return [w, h];
};
E.setQuality({});

E.terrain = { far: null, near: null };
E.buildTerrainView = function (cam, opts = {}) {
  for (const k of ['far', 'near']) if (E.terrain[k]) { E.world.remove(E.terrain[k]); E.terrain[k].geometry.dispose(); E.terrain[k] = null; }
  const mat = E._tmat || (E._tmat = terrainMaterial());
  E.terrain.near = buildTerrainWedge(cam, { material: mat, ...opts });
  E.world.add(E.terrain.near);
  if (!E.river) { E.river = buildRiver(E.water); E.lake = buildLake(E.water); E.scene.add(E.river, E.lake); }
};
E.buildTerrainAt = function (cx, cz, inner = 130, n = 256, outer = 3600, opts = {}) {
  for (const k of ['far', 'near']) if (E.terrain[k]) { E.world.remove(E.terrain[k]); E.terrain[k].geometry.dispose(); E.terrain[k] = null; }
  const mat = E._tmat || (E._tmat = terrainMaterial());
  E.terrain.near = buildTerrainWarped(cx, cz, n, inner, outer, opts.frac ?? 0.42, { material: mat, tint: opts.tint });
  E.world.add(E.terrain.near);
  if (!E.river) { E.river = buildRiver(E.water); E.lake = buildLake(E.water); E.scene.add(E.river, E.lake); }
};

E.syncWater = function (t) {
  const u = E.water.uniforms;
  u.uTime.value = t;
  u.uSunDir.value.copy(E.atmo.sunDir);
  u.uSunCol.value.copy(E.atmo.sun.color).multiplyScalar(E.atmo.sun.intensity / 3);
  u.fogColor.value.copy(E.scene.fog.color);
  u.fogDensity.value = E.scene.fog.density;
  const d = E.atmo.day;
  u.uSky.value.setRGB(0.32, 0.5, 0.78).multiplyScalar(0.2 + 0.8 * d);
  u.uHorizon.value.copy(E.scene.fog.color);
};

E.syncLight = function () {
  const a = E.atmo;
  LIGHT.uSunDir.value.copy(a.sunDir);
  LIGHT.uSunCol.value.copy(a.sun.color).multiplyScalar(a.sun.intensity * 0.33);
  LIGHT.uSkyCol.value.copy(a.hemi.color).multiplyScalar(a.hemi.intensity * 0.95);
  LIGHT.uGndCol.value.copy(a.hemi.groundColor).multiplyScalar(a.hemi.intensity * 0.95);
};
E.render = function (t) {
  WIND.value = t; LIGHT.uWind.value = t;
  E.syncLight();
  if (E.atmo.envDirty) E.scene.environment = E.atmo.buildEnv(E.renderer);
  E.scene.environmentIntensity = E.envIntensity ?? 0.85;
  E.atmo.update(t, E.camera.position);
  E.syncWater(t);
  E.renderer.toneMappingExposure = E.atmo.exposure * (E.exposureMul ?? 1);
  IMPOSTOR_LIGHT.value.copy(E.atmo.sun.color).multiplyScalar(0.18 * E.atmo.sun.intensity).add(E.atmo.hemi.color.clone().multiplyScalar(0.55 * E.atmo.hemi.intensity));
  if (E.post) {
    if (E.post.dof.enabled) {
      const u = E.post.dof.uniforms, k = E.post.w / 1920;
      u.uFocus.value = Math.max(0.3, E.dof.focus); u.uAperture.value = E.dof.aperture * k; u.uMaxBlur.value = E.dof.maxBlur * k;
      u.uTexel.value.set(1 / E.post.w, 1 / E.post.h); u.uNear.value = E.camera.near; u.uFar.value = E.camera.far;
    }
    E.post.comp.render();
  } else E.renderer.render(E.scene, E.camera);
};

window.E = E;
window.THREE = THREE;
window.heightAt = height;

// ------------------------------------------------------------------ test hook
window.testView = function (v) {
  E.atmo.set(v.hours ?? 10, { cloud: v.cloud ?? 0.5, storm: v.storm ?? 0 });
  const yaw = Math.atan2(v.target[0] - v.cam[0], v.target[2] - v.cam[2]);
  const half = THREE.MathUtils.degToRad((v.fov ?? 42) * 16 / 9 / 2) + 0.12;
  const camV = { x: v.cam[0], z: v.cam[2], yaw, half };
  if (v.top) E.buildTerrainAt(v.cx, v.cz, v.inner ?? 130, v.n ?? 256, v.outer ?? 3600);
  else E.buildTerrainView(camV, { nr: v.nr ?? 170, na: v.na ?? 110 });
  const [px, py, pz] = v.cam, [tx, ty, tz] = v.target;
  const dx = tx - px, dz = tz - pz, dl = Math.hypot(dx, dz) || 1;
  const gR = v.grassR ?? 0;
  const cone = (x, z) => { const ax = x - px, az = z - pz; const al = Math.hypot(ax, az); return al < 2.5 || (ax * dx + az * dz) / (al * dl) > 0.62; };
  const tris = E.veg.build({ cx: v.cam[0], cz: v.cam[2] }, { r0: v.r0, r1: v.r1, rImp: v.rImp, rFar: v.rFar ?? 1800, grassR: gR,
    grassCenter: [px + dx / dl * gR * 0.7, pz + dz / dl * gR * 0.7], grassCone: cone, views: v.top ? null : [camV] });
  E.camera.position.set(px, height(px, pz) + py, pz);
  E.camera.lookAt(tx, height(tx, tz) + ty, tz);
  E.camera.fov = v.fov ?? 42; E.camera.updateProjectionMatrix();
  E.atmo.focusShadow(tx, height(tx, tz), tz, v.shadowR ?? 90);
  return tris;
};
// people test
E.people = [];
window.testPeople = function (v) {
  for (const p of E.people) E.world.remove(p.root);
  E.people = [];
  for (const d of v.people) {
    const P = new Person({ ...CAST[d.who], acc: d.acc || [] });
    P.place(d.x, height(d.x, d.z), d.z, d.yaw || 0);
    P.pose(d.pose || 'idle', d.t ?? 1.0, d.p || {});
    if (d.energy !== undefined) P.setEnergy(d.energy);
    E.world.add(P.root); E.people.push(P);
  }
  return E.people.length;
};
E.town = new Town(E.scene);
window.testTown = function (year) { const v = E.town.build(year); if (GROUND_UNIFORMS.uGround.value) GROUND_UNIFORMS.uGround.value.dispose(); GROUND_UNIFORMS.uGround.value = drawGroundMap(year); GROUND_UNIFORMS.uGroundOn.value = 1; return [v.length, Math.round(E.town.tris)]; };
import('./director.js').then(() => { window.ready = true; }).catch(e => { console.error('director load failed', e); window.loadError = String(e && e.stack || e); });
