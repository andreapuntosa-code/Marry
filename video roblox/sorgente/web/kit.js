// "Roblox" style kit (reusable): blocky avatars with drawn faces, a blocky dog, a bright suburban town (houses, road,
// fences, round trees), simple interiors (bedroom, classroom, garage), bright plastic lighting, and a shot system
// the Python driver steps frame by frame. Each avatar can carry a number badge: the driver draws it at the projected
// point above the head (window.renderAt returns the badges on screen).
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { BokehPass } from 'three/addons/postprocessing/BokehPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { Reflector } from 'three/addons/objects/Reflector.js';
export { RoundedBoxGeometry, Reflector };
export { THREE };

export const W = 1080, H = 1920;
let renderer, scene, camera;
const OWN = [];
const rr = (seed) => { let s = seed * 9301 + 49297; return () => ((s = (s * 9301 + 49297) % 233280) / 233280); };
export const sm = (a, b, x) => { const u = Math.max(0, Math.min(1, (x - a) / (b - a))); return u * u * (3 - 2 * u); };
export const lerp = (a, b, u) => a + (b - a) * u;
const mat = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: o.r ?? 0.62, metalness: 0.0, emissive: o.em ?? 0x000000, emissiveIntensity: o.ei ?? 1, ...(o.extra || {}) });
export const rbox = (w, h, d, k = 0.12) => new RoundedBoxGeometry(w, h, d, 2, Math.min(w, h, d) * k);
function box(w, h, d, c, o = {}) { const m = new THREE.Mesh(o.sharp ? new THREE.BoxGeometry(w, h, d) : rbox(w, h, d, o.round ?? 0.12), typeof c === 'number' ? mat(c, o) : c); m.castShadow = o.cast ?? true; m.receiveShadow = true; return m; }

// ------------------------------------------------------------------ renderer / world
let ENV = null, composer = null, bloomPass = null, bokehPass = null;
export function init() {
  renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(1); renderer.setSize(W, H);
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.2; renderer.outputColorSpace = THREE.SRGBColorSpace;
  document.body.appendChild(renderer.domElement);
  camera = new THREE.PerspectiveCamera(40, W / H, 0.05, 900);
  const pm = new THREE.PMREMGenerator(renderer); ENV = pm.fromScene(new RoomEnvironment(), 0.04).texture;
}
export function newScene(o = {}) {
  if (scene) { scene.traverse(n => { if (n.geometry) n.geometry.dispose(); if (n.material) { (Array.isArray(n.material) ? n.material : [n.material]).forEach(m => { if (m.map) m.map.dispose(); m.dispose(); }); } }); }
  scene = new THREE.Scene();
  const night = !!o.night;
  scene.background = skyTex(night ? ['#0b1030', '#1d2a5a'] : (o.sky || ['#5fb4ff', '#cfeaff']));
  scene.fog = new THREE.Fog(night ? 0x14204a : 0xcfe6ff, o.fog0 ?? 60, o.fog1 ?? 260);
  const hemi = new THREE.HemisphereLight(night ? 0x8a9ae0 : 0xeaf4ff, night ? 0x303048 : 0x8a9a6a, night ? 1.1 : 1.35); scene.add(hemi);
  const sun = new THREE.DirectionalLight(night ? 0xb0c0ff : 0xfff3e0, night ? 1.1 : 2.5); sun.position.set(14, 30, 20); sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048); const sc = sun.shadow.camera; sc.left = -22; sc.right = 22; sc.top = 22; sc.bottom = -22; sc.near = 1; sc.far = 90; sun.shadow.bias = -0.0005; sun.shadow.normalBias = 0.03;
  scene.add(sun); scene.add(sun.target);
  scene.userData = { sun, hemi, updates: [], avatars: [], night, dof: o.dof || null };
  // v2 look: image-based lighting, bloom on everything bright, optional depth of field
  const outdoorDay = !o.interior && !night; scene.environment = ENV; scene.environmentIntensity = o.env ?? (night ? 0.1 : outdoorDay ? 0.3 : 0.5);
  renderer.toneMappingExposure = o.exposure ?? 1.2;
  composer = new EffectComposer(renderer); composer.setSize(W, H); composer.setPixelRatio(1);
  composer.addPass(new RenderPass(scene, camera));
  bokehPass = null;
  if (o.dof) {
    bokehPass = new BokehPass(scene, camera, { focus: 5, aperture: o.dof.aperture ?? 0.004, maxblur: o.dof.maxblur ?? 0.008 });
    // the depth pre-pass must not draw the sky texture (it would read as depth and wash the frame white)
    const r0 = bokehPass.render.bind(bokehPass); const sc = scene;
    bokehPass.render = (...args) => { const bg = sc.background; sc.background = null; try { r0(...args); } finally { sc.background = bg; } };
    composer.addPass(bokehPass);
  }
  // thresholds are in linear light: sunlit walls are already > 1, so daylight needs a much higher threshold
  bloomPass = new UnrealBloomPass(new THREE.Vector2(W / 2, H / 2), o.bloom ?? (outdoorDay ? 0.25 : 0.35), o.bloomRadius ?? 0.55, o.bloomThreshold ?? (outdoorDay ? 1.8 : night ? 0.95 : 0.85)); composer.addPass(bloomPass);
  composer.addPass(new OutputPass());
  if (o.interior) { hemi.intensity = 1.0; sun.intensity = 1.6; }
  return scene;
}
function skyTex(cols) {
  const cv = document.createElement('canvas'); cv.width = 4; cv.height = 256; const g = cv.getContext('2d');
  const gr = g.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, cols[0]); gr.addColorStop(1, cols[1]); g.fillStyle = gr; g.fillRect(0, 0, 4, 256);
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; return t;
}
export const add = (o) => { scene.add(o); return o; };
export const on = (fn) => scene.userData.updates.push(fn);
export const getScene = () => scene;
export const getCamera = () => camera;
export function shadowAt(x, z, r = 20) { const s = scene.userData.sun; s.position.set(x + 14, 30, z + 20); s.target.position.set(x, 0, z); const c = s.shadow.camera; c.left = -r; c.right = r; c.top = r; c.bottom = -r; c.updateProjectionMatrix(); }

// ------------------------------------------------------------------ faces
function faceTex(expr) {
  const cv = document.createElement('canvas'); cv.width = 512; cv.height = 256; const g = cv.getContext('2d');
  g.clearRect(0, 0, 512, 256); g.fillStyle = '#1b1b1f'; g.strokeStyle = '#1b1b1f'; g.lineCap = 'round';
  const eye = (x, y, w, h) => { g.beginPath(); g.ellipse(x, y, w, h, 0, 0, 6.283); g.fill(); g.fillStyle = '#ffffff'; g.beginPath(); g.ellipse(x - w * 0.3, y - h * 0.35, w * 0.32, h * 0.22, 0, 0, 6.283); g.fill(); g.fillStyle = '#1b1b1f'; };
  const cx = 256;
  if (expr === 'shock') { eye(cx - 58, 100, 20, 30); eye(cx + 58, 100, 20, 30); g.beginPath(); g.ellipse(cx, 190, 22, 28, 0, 0, 6.283); g.fill(); }
  else if (expr === 'smug') { g.lineWidth = 12; g.beginPath(); g.moveTo(cx - 84, 100); g.lineTo(cx - 34, 100); g.stroke(); g.beginPath(); g.moveTo(cx + 34, 100); g.lineTo(cx + 84, 100); g.stroke(); g.beginPath(); g.moveTo(cx - 50, 175); g.quadraticCurveTo(cx + 10, 205, cx + 60, 160); g.stroke(); }
  else if (expr === 'confused') { eye(cx - 58, 105, 15, 22); eye(cx + 58, 98, 15, 22); g.lineWidth = 10; g.beginPath(); g.moveTo(cx - 40, 185); g.quadraticCurveTo(cx - 10, 170, cx + 10, 185); g.quadraticCurveTo(cx + 30, 200, cx + 50, 182); g.stroke(); }
  else if (expr === 'sleep') { g.lineWidth = 10; g.beginPath(); g.arc(cx - 58, 95, 22, 0.2, 2.9); g.stroke(); g.beginPath(); g.arc(cx + 58, 95, 22, 0.2, 2.9); g.stroke(); g.beginPath(); g.arc(cx, 165, 26, 0.3, 2.8); g.stroke(); }
  else if (expr === 'sad' || expr === 'cry') { eye(cx - 58, 108, 14, 19); eye(cx + 58, 108, 14, 19); g.lineWidth = 9;
    g.beginPath(); g.moveTo(cx - 88, 78); g.lineTo(cx - 36, 70); g.stroke(); g.beginPath(); g.moveTo(cx + 36, 70); g.lineTo(cx + 88, 78); g.stroke();
    g.beginPath(); g.arc(cx, 205, 40, 3.5, 5.9); g.stroke();
    if (expr === 'cry') { g.fillStyle = '#5ab8ff'; for (const sx of [-1, 1]) { g.beginPath(); g.moveTo(cx + sx * 64, 128); g.quadraticCurveTo(cx + sx * 80, 170, cx + sx * 66, 186); g.quadraticCurveTo(cx + sx * 52, 170, cx + sx * 64, 128); g.fill(); } g.fillStyle = '#1b1b1f'; } }
  else if (expr === 'wink') { eye(cx - 58, 100, 15, 22); g.lineWidth = 10; g.beginPath(); g.moveTo(cx + 34, 102); g.lineTo(cx + 84, 102); g.stroke(); g.beginPath(); g.arc(cx, 150, 52, 0.25, 2.9); g.stroke(); }
  else { eye(cx - 58, 100, 15, 22); eye(cx + 58, 100, 15, 22); g.lineWidth = 10; g.beginPath(); g.arc(cx, 140, 56, 0.3, 2.85); g.stroke(); }
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
}

// ------------------------------------------------------------------ avatars
// def: { skin, shirt, pants, hair: {style, color}, acc: ['glasses','coat','shades','headband','tie'], face, scale }
export function avatar(def = {}) {
  const S = def.scale ?? 1;
  const root = new THREE.Group(); const body = new THREE.Group(); root.add(body);
  const skin = def.skin ?? 0xf2c79a, shirt = def.shirt ?? 0x3aa655, pants = def.pants ?? 0x2f4a8a;
  const legL = new THREE.Group(), legR = new THREE.Group(), armL = new THREE.Group(), armR = new THREE.Group();
  legL.position.set(-0.5, 2, 0); legR.position.set(0.5, 2, 0);
  const lg = (g) => { const m = box(0.98, 2, 1, pants); m.position.y = -1; g.add(m); const sh = box(1.0, 0.25, 1.06, 0x2a2a30); sh.position.y = -1.9; g.add(sh); };
  lg(legL); lg(legR);
  const torso = box(2, 2, 1, shirt); torso.position.y = 3;
  armL.position.set(-1.5, 3.85, 0); armR.position.set(1.5, 3.85, 0);
  const ar = (g) => { const m = box(0.98, 1.4, 0.98, shirt); m.position.y = -0.62; g.add(m); const hd = box(0.96, 0.6, 0.96, skin); hd.position.y = -1.6; g.add(hd); };
  ar(armL); ar(armR);
  body.add(legL, legR, torso, armL, armR);
  // head: a fat cylinder with a face decal and a top cap
  const head = new THREE.Group(); head.position.set(0, 4.62, 0);
  const hm = new THREE.Mesh(new THREE.CylinderGeometry(0.66, 0.66, 1.24, 32), mat(skin)); hm.castShadow = true; head.add(hm);
  const top = new THREE.Mesh(new THREE.SphereGeometry(0.66, 32, 12, 0, 6.283, 0, Math.PI / 2), mat(skin)); top.scale.y = 0.28; top.position.y = 0.62; head.add(top);
  const bot = top.clone(); bot.rotation.x = Math.PI; bot.position.y = -0.62; head.add(bot);
  const faceMat = new THREE.MeshBasicMaterial({ map: faceTex(def.face || 'smile'), transparent: true, depthWrite: false });
  const face = new THREE.Mesh(new THREE.CylinderGeometry(0.665, 0.665, 0.95, 24, 1, true, -1.15, 2.3), faceMat); face.renderOrder = 2; head.add(face);
  body.add(head);
  // details
  const neck = box(0.7, 0.2, 0.6, skin, { cast: false }); neck.position.y = 4.02; body.add(neck);
  if (def.collar !== false && !(def.acc || []).includes('coat')) { const c = box(0.9, 0.12, 0.08, 0xffffff, { cast: false }); c.position.set(0, 3.9, 0.52); body.add(c); }
  if (def.logo) { const l = new THREE.Mesh(new THREE.CircleGeometry(0.32, 24), new THREE.MeshBasicMaterial({ color: def.logo })); l.position.set(0, 3.2, 0.505); body.add(l); }
  hair(head, def.hair);
  for (const a of def.acc || []) accessory(body, head, a, def);
  root.scale.setScalar(0.42 * S);   // ~2.3 m tall
  const A = { root, body, head, legL, legR, armL, armR, faceMat, def, badge: null, pose: 'idle', look: 0 };
  A.setFace = (e) => { if (A._face === e) return; A._face = e; faceMat.map.dispose(); faceMat.map = faceTex(e); faceMat.needsUpdate = true; };
  A._face = def.face || 'smile';
  return A;
}
function hair(head, h) {
  if (!h) return;
  const c = h.color ?? 0x5a3a1e, m = mat(c, { r: 0.7 });
  const add = (w, hh, d, x, y, z, rx = 0) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, hh, d), m); b.position.set(x, y, z); b.rotation.x = rx; b.castShadow = true; head.add(b); return b; };
  if (h.style === 'bowl') { add(1.46, 0.5, 1.46, 0, 0.62, 0); add(1.46, 0.75, 0.4, 0, 0.2, -0.56); add(0.3, 0.6, 1.3, -0.62, 0.3, -0.05); add(0.3, 0.6, 1.3, 0.62, 0.3, -0.05); add(1.3, 0.28, 0.3, 0, 0.42, 0.58); }
  else if (h.style === 'long') { add(1.46, 0.45, 1.46, 0, 0.62, 0); add(1.5, 1.9, 0.5, 0, -0.25, -0.5); add(0.34, 1.8, 1.2, -0.66, -0.2, -0.05); add(0.34, 1.8, 1.2, 0.66, -0.2, -0.05); add(1.2, 0.3, 0.25, 0, 0.45, 0.6); }
  else if (h.style === 'spiky') { add(1.42, 0.4, 1.42, 0, 0.62, 0); for (let i = 0; i < 6; i++) { const s = add(0.42, 0.62, 0.42, -0.5 + (i % 3) * 0.5, 0.95, -0.3 + Math.floor(i / 3) * 0.55); s.rotation.z = (i % 3 - 1) * 0.35; } }
  else if (h.style === 'bun') { add(1.44, 0.38, 1.44, 0, 0.62, 0); add(1.4, 0.8, 0.3, 0, 0.25, -0.58); const b = add(0.6, 0.6, 0.6, 0, 1.02, -0.3); b.rotation.y = 0.6; }
  else if (h.style === 'white') { add(1.46, 0.46, 1.46, 0, 0.6, 0); add(1.46, 0.9, 0.4, 0, 0.15, -0.56); add(0.32, 0.7, 1.3, -0.64, 0.25, -0.05); add(0.32, 0.7, 1.3, 0.64, 0.25, -0.05); }
  else if (h.style === 'bald') { }
  else { add(1.42, 0.42, 1.42, 0, 0.62, 0); add(1.42, 0.62, 0.36, 0, 0.3, -0.56); add(1.0, 0.24, 0.3, 0.12, 0.5, 0.58); }
}
function accessory(body, head, a, def) {
  if (a === 'glasses' || a === 'shades') {
    const m = new THREE.MeshStandardMaterial({ color: 0x18181c, roughness: 0.3 });
    const lens = a === 'shades' ? m : new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.25 });
    for (const s of [-1, 1]) {
      const fr = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.04, 6, 20), m); fr.position.set(s * 0.29, 0.12, 0.68); head.add(fr);
      const l = new THREE.Mesh(new THREE.CircleGeometry(0.2, 20), lens); l.position.set(s * 0.29, 0.12, 0.685); head.add(l);
      if (a === 'shades') { fr.scale.set(1.25, 0.8, 1); l.scale.set(1.25, 0.8, 1); }
    }
    const br = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.04, 0.04), m); br.position.set(0, 0.14, 0.69); head.add(br);
  } else if (a === 'coat') {
    const c = mat(0xf6f6f2); const l = box(1.02, 2.4, 1.08, c); l.position.set(-0.5, 2.85, 0); const r = box(1.02, 2.4, 1.08, c); r.position.set(0.5, 2.85, 0); body.add(l, r);
    const t = box(0.4, 1.4, 0.06, 0xd23a3a); t.position.set(0, 3.25, 0.56); body.add(t);
  } else if (a === 'headband') {
    const b = new THREE.Mesh(new THREE.CylinderGeometry(0.69, 0.69, 0.22, 32, 1, true), mat(def.band ?? 0x2b6fd6)); b.position.y = 0.32; head.add(b);
  } else if (a === 'tie') { const t = box(0.3, 1.3, 0.06, 0xc8283a); t.position.set(0, 3.2, 0.53); body.add(t); }
  else if (a === 'chain') { const t = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.06, 6, 24, Math.PI), mat(0xffcc33, { r: 0.3, extra: { metalness: 0.8 } })); t.rotation.z = Math.PI; t.position.set(0, 3.7, 0.55); body.add(t); }
  else if (a === 'apron') { const t = box(1.7, 1.8, 0.06, 0xffffff); t.position.set(0, 2.7, 0.53); body.add(t); }
}
// place an avatar; pose: idle | walk | wave | think | shock | point | cheer | sit | sleep | throw | catch | shrug
export function person(def, x, z, yaw = 0, pose = 'idle', o = {}) {
  const A = avatar(def); A.root.position.set(x, o.y ?? 0, z); A.root.rotation.y = yaw; A.pose = pose; A.phase = o.phase ?? (x * 0.7 + z * 0.3);
  if (o.badge !== undefined) A.badge = o.badge;     // number | fn(t) -> number | string
  if (o.face) A.setFace(o.face);
  A.anim = o.anim || null; add(A.root); scene.userData.avatars.push(A); return A;
}
export function posePerson(A, t) {
  const p = A.pose, ph = A.phase, s = Math.sin;
  const set = (g, x = 0, z = 0) => { g.rotation.x = x; g.rotation.z = z; };
  set(A.legL); set(A.legR); set(A.armL); set(A.armR); A.body.position.y = 0; A.body.rotation.set(0, 0, 0); A.head.rotation.set(A.pitch || 0, A.look || 0, 0);
  if (p === 'walk' || p === 'run') { const k = p === 'run' ? 1.0 : 0.6, f = p === 'run' ? 9 : 6; set(A.legL, s(t * f + ph) * k); set(A.legR, -s(t * f + ph) * k); set(A.armL, -s(t * f + ph) * k); set(A.armR, s(t * f + ph) * k); A.body.position.y = Math.abs(s(t * f + ph)) * 0.12; }
  else if (p === 'wave') { set(A.armR, 0, 2.6 + s(t * 7 + ph) * 0.35); set(A.armL, s(t * 1.5) * 0.05); }
  else if (p === 'think') { set(A.armR, -1.9, 0.5); A.head.rotation.z = 0.12; set(A.armL, 0.05); }
  else if (p === 'shock') { set(A.armL, 0, -2.6 - s(t * 9) * 0.1); set(A.armR, 0, 2.6 + s(t * 9) * 0.1); A.body.position.y = Math.abs(s(t * 10)) * 0.05; }
  else if (p === 'cheer') { set(A.armL, 0, -2.8 + s(t * 8 + ph) * 0.2); set(A.armR, 0, 2.8 - s(t * 8 + ph) * 0.2); A.body.position.y = Math.abs(s(t * 6 + ph)) * 0.35; }
  else if (p === 'point') { set(A.armR, -1.55, 0); set(A.armL, 0.05); }
  else if (p === 'present') { set(A.armR, -1.2, 0.35); set(A.armL, -1.2, -0.35); }
  else if (p === 'shrug') { set(A.armL, -0.4, -0.9); set(A.armR, -0.4, 0.9); A.head.rotation.z = 0.1 * s(t * 2); }
  else if (p === 'sit') { set(A.legL, -1.57); set(A.legR, -1.57); A.body.position.y = -0.9; set(A.armL, -0.4); set(A.armR, -0.4); }
  else if (p === 'sleep') { A.body.rotation.x = -1.5; A.body.position.y = 0.6; A.body.position.z = -2.2; }
  else if (p === 'situp') { set(A.legL, -1.57); set(A.legR, -1.57); A.body.position.y = -0.9; set(A.armL, 0, -0.3); set(A.armR, 0, 0.3); }
  else if (p === 'throw') { const u = (t * 1.2 + ph) % 1; set(A.armR, -2.8 + 2.6 * sm(0.4, 0.55, u)); }
  else if (p === 'catch') { set(A.armR, 0, 2.7); A.head.rotation.y = 0.5; }
  else if (p === 'type') { set(A.armL, -1.2, -0.1 + s(t * 14) * 0.08); set(A.armR, -1.2, 0.1 + s(t * 13) * 0.08); }
  else { set(A.armL, s(t * 1.6 + ph) * 0.05, -0.04); set(A.armR, -s(t * 1.6 + ph) * 0.05, 0.04); A.body.position.y = s(t * 2 + ph) * 0.02; }
}
// a blocky dog
export function dog(x, z, yaw = 0, o = {}) {
  const root = new THREE.Group(), c = o.color ?? 0xc0874a, d = 0x6b4424;
  const b = box(1.0, 0.8, 1.7, c); b.position.y = 0.95; root.add(b);
  const h = new THREE.Group(); h.position.set(0, 1.55, 0.95); root.add(h);
  const hb = box(0.9, 0.85, 0.85, c); h.add(hb); const sn = box(0.5, 0.38, 0.45, 0xe6c49a); sn.position.set(0, -0.15, 0.55); h.add(sn);
  const no = box(0.2, 0.14, 0.1, 0x1a1a1a); no.position.set(0, -0.02, 0.8); h.add(no);
  for (const s of [-1, 1]) { const e = box(0.24, 0.5, 0.18, d); e.position.set(s * 0.42, 0.42, -0.1); e.rotation.z = s * 0.3; h.add(e); const ey = new THREE.Mesh(new THREE.SphereGeometry(0.08, 10, 8), new THREE.MeshBasicMaterial({ color: 0x111111 })); ey.position.set(s * 0.22, 0.12, 0.43); h.add(ey); }
  const legs = []; for (const [lx, lz] of [[-0.32, 0.6], [0.32, 0.6], [-0.32, -0.6], [0.32, -0.6]]) { const l = new THREE.Group(); l.position.set(lx, 0.6, lz); const m = box(0.3, 0.6, 0.3, c); m.position.y = -0.3; l.add(m); root.add(l); legs.push(l); }
  const tail = new THREE.Group(); tail.position.set(0, 1.25, -0.85); const tm = box(0.18, 0.18, 0.6, c); tm.position.z = -0.3; tail.add(tm); root.add(tail);
  root.position.set(x, 0, z); root.rotation.y = yaw; root.scale.setScalar(o.scale ?? 0.6); add(root);
  const D = { root, head: h, badge: o.badge, isDog: true };
  on((t) => { tail.rotation.y = Math.sin(t * 12) * 0.6; tail.rotation.x = -0.6; h.rotation.z = Math.sin(t * 1.5) * 0.08; if (o.sit) { root.rotation.x = 0; legs[2].rotation.x = -1.2; legs[3].rotation.x = -1.2; b.rotation.x = -0.35; b.position.y = 0.8; } });
  scene.userData.avatars.push(D); return D;
}

// ------------------------------------------------------------------ town
const HOUSE_C = [0xffffff, 0xf6d36b, 0x7fb6e8, 0xe9e2d0, 0xf2a7b6, 0x9fd6a6, 0xf0b37a];
export function ground(o = {}) {
  const g = new THREE.Mesh(new THREE.PlaneGeometry(600, 600), mat(o.grass ?? 0x5fbf4a, { r: 0.95 })); g.rotation.x = -Math.PI / 2; g.receiveShadow = true; add(g);
  if (o.road !== false) {
    const rz = o.roadZ ?? 0;
    const r = new THREE.Mesh(new THREE.PlaneGeometry(600, 9), mat(0x3c3f45, { r: 0.9 })); r.rotation.x = -Math.PI / 2; r.position.set(0, 0.02, rz); r.receiveShadow = true; add(r);
    for (let x = -300; x < 300; x += 6) { const l = new THREE.Mesh(new THREE.PlaneGeometry(3, 0.3), new THREE.MeshBasicMaterial({ color: 0xf2c418 })); l.rotation.x = -Math.PI / 2; l.position.set(x, 0.03, rz); add(l); }
    for (const s of [-1, 1]) { const sw = box(600, 0.25, 3.2, 0xc9ccd2, { cast: false }); sw.position.set(0, 0.12, rz + s * 6.1); add(sw); const e = new THREE.Mesh(new THREE.PlaneGeometry(600, 0.18), new THREE.MeshBasicMaterial({ color: 0xffffff })); e.rotation.x = -Math.PI / 2; e.position.set(0, 0.03, rz + s * 4.2); add(e); }
  }
}
export function house(x, z, yaw = 0, o = {}) {
  const g = new THREE.Group(), r = rr(o.seed ?? Math.floor(Math.abs(x * 13 + z * 7)));
  const col = o.color ?? HOUSE_C[Math.floor(r() * HOUSE_C.length)], w = o.w ?? 10, d = o.d ?? 8, h = o.h ?? 7;
  const wall = box(w, h, d, col); wall.position.y = h / 2; g.add(wall);
  for (let k = 0; k < Math.floor(h / 0.6); k++) { const s = box(w + 0.06, 0.06, d + 0.06, 0x000000, { cast: false, extra: { transparent: true, opacity: 0.06 } }); s.position.y = 0.3 + k * 0.6; g.add(s); }
  const roofM = mat(o.roof ?? 0x4a4f5a, { r: 0.8 });
  const sh = new THREE.Shape(); sh.moveTo(-w / 2 - 0.6, 0); sh.lineTo(0, h * 0.5); sh.lineTo(w / 2 + 0.6, 0); sh.lineTo(-w / 2 - 0.6, 0);
  const rg = new THREE.ExtrudeGeometry(sh, { depth: d + 1.2, bevelEnabled: false }); rg.translate(0, 0, -(d + 1.2) / 2);
  const roof = new THREE.Mesh(rg, roofM); roof.position.y = h; roof.castShadow = true; g.add(roof);
  const winM = mat(0x9fd3ff, { r: 0.15, em: o.lit ? 0xffd27a : 0x000000, ei: o.lit ? 1.4 : 0 });
  const win = (wx, wy) => { const f = box(2.0, 2.0, 0.25, 0xffffff); f.position.set(wx, wy, d / 2 + 0.05); g.add(f); const gl = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1.6), winM); gl.position.set(wx, wy, d / 2 + 0.19); g.add(gl); const c1 = box(0.12, 1.6, 0.1, 0xffffff, { cast: false }); c1.position.set(wx, wy, d / 2 + 0.22); g.add(c1); const c2 = box(1.6, 0.12, 0.1, 0xffffff, { cast: false }); c2.position.set(wx, wy, d / 2 + 0.22); g.add(c2); };
  win(-w * 0.3, h * 0.68); win(w * 0.3, h * 0.68); win(-w * 0.3, h * 0.27); win(w * 0.3, h * 0.27);
  const door = box(1.6, 2.8, 0.3, o.door ?? 0xd2232a); door.position.set(0, 1.4, d / 2 + 0.05); g.add(door);
  const kn = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 6), mat(0xffd34a)); kn.position.set(0.5, 1.4, d / 2 + 0.25); g.add(kn);
  const step = box(2.4, 0.3, 1.0, 0xbfbfbf); step.position.set(0, 0.15, d / 2 + 0.5); g.add(step);
  if (o.fence !== false) for (let k = -w / 2; k <= w / 2 + 0.01; k += 0.7) { const p = box(0.2, 1.1, 0.12, 0xffffff); p.position.set(k, 0.55, d / 2 + 3.2); if (Math.abs(k) > 1.3) g.add(p); }
  if (o.fence !== false) for (const yy of [0.35, 0.8]) for (const s of [-1, 1]) { const rail = box(w / 2 - 1.2, 0.1, 0.1, 0xffffff, { cast: false }); rail.position.set(s * (w / 4 + 0.6), yy, d / 2 + 3.2); g.add(rail); }
  g.position.set(x, 0, z); g.rotation.y = yaw; add(g); return g;
}
export function tree(x, z, s = 1, seed = 1) {
  const g = new THREE.Group(), r = rr(seed);
  const tr = box(0.7, 3, 0.7, 0x7a5232); tr.position.y = 1.5; g.add(tr);
  const lm = mat(0x3f9a3a, { r: 0.85 });
  for (let i = 0; i < 6; i++) { const b = new THREE.Mesh(new THREE.IcosahedronGeometry(1.4 + r() * 0.8, 1), lm); b.position.set((r() - 0.5) * 2.4, 3.6 + r() * 1.8, (r() - 0.5) * 2.4); b.castShadow = true; g.add(b); }
  g.position.set(x, 0, z); g.scale.setScalar(s); add(g); return g;
}
// a street: houses on both sides of the road (z = 0), trees between
export function street(o = {}) {
  ground(o);
  const n = o.n ?? 6, sp = o.sp ?? 15;
  for (let i = -n; i <= n; i++) {
    house(i * sp, -15, 0, { seed: i + 50, lit: o.lit, fence: o.fence }); house(i * sp + 7, 15, Math.PI, { seed: i + 90, lit: o.lit, fence: o.fence });
    tree(i * sp + 7.5, -11, 0.9 + ((i * 7) % 3) * 0.1, i + 3); tree(i * sp, 11, 0.9, i + 9);
  }
}
// rooms: a box open towards the camera (-z side faces the viewer at +z)
export function room(o = {}) {
  const w = o.w ?? 14, d = o.d ?? 12, h = o.h ?? 7;
  const fl = new THREE.Mesh(new THREE.PlaneGeometry(w, d), new THREE.MeshStandardMaterial({ map: planks(o.floor ?? '#b9855a'), roughness: 0.7 })); fl.rotation.x = -Math.PI / 2; fl.receiveShadow = true; add(fl);
  const wm = mat(o.wall ?? 0xeadcc4, { r: 0.9 });
  const back = box(w, h, 0.3, wm); back.position.set(0, h / 2, -d / 2); add(back);
  for (const s of [-1, 1]) { const sw = box(0.3, h, d, wm); sw.position.set(s * w / 2, h / 2, 0); add(sw); }
  const base = box(w, 0.4, 0.35, 0xffffff, { cast: false }); base.position.set(0, 0.2, -d / 2 + 0.1); add(base);
  const ceil = box(w, 0.3, d, 0xf4f0e8); ceil.position.set(0, h, 0); add(ceil);
  const lamp = new THREE.PointLight(0xfff0d8, o.lamp ?? 30, 30, 1.6); lamp.position.set(0, h - 1, 0); add(lamp);
  return { w, d, h };
}
function planks(c) {
  const cv = document.createElement('canvas'); cv.width = 256; cv.height = 256; const g = cv.getContext('2d'); g.fillStyle = c; g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 8; i++) { g.fillStyle = `rgba(0,0,0,${0.04 + (i % 3) * 0.03})`; g.fillRect(0, i * 32, 256, 30); g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(0, i * 32 + 30, 256, 2); g.fillRect(((i * 97) % 256), i * 32, 2, 32); }
  const t = new THREE.CanvasTexture(cv); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(3, 3); t.colorSpace = THREE.SRGBColorSpace; return t;
}
export function bed(x, z, yaw = 0) {
  const g = new THREE.Group(); const fr = box(4.2, 1.2, 7, 0x8a5a34); fr.position.y = 0.6; g.add(fr);
  const mt = box(4.0, 0.6, 6.8, 0xffffff); mt.position.y = 1.5; g.add(mt); const bl = box(4.1, 0.25, 4.6, 0x3a7bd5); bl.position.set(0, 1.85, 1.1); g.add(bl);
  const pl = box(2.6, 0.5, 1.2, 0xffffff); pl.position.set(0, 2.0, -2.6); g.add(pl); const hb = box(4.2, 3.2, 0.4, 0x8a5a34); hb.position.set(0, 1.6, -3.5); g.add(hb);
  g.position.set(x, 0, z); g.rotation.y = yaw; add(g); return g;
}
export function desk(x, z, yaw = 0, c = 0xc89a64) {
  const g = new THREE.Group(); const top = box(3, 0.25, 2, c); top.position.y = 2.2; g.add(top);
  for (const [a, b] of [[-1.3, -0.8], [1.3, -0.8], [-1.3, 0.8], [1.3, 0.8]]) { const l = box(0.2, 2.2, 0.2, 0x5a5a62); l.position.set(a, 1.1, b); g.add(l); }
  g.position.set(x, 0, z); g.rotation.y = yaw; add(g); return g;
}
export function label(text, x, y, z, o = {}) {
  const cv = document.createElement('canvas'); cv.width = 512; cv.height = 256; const g = cv.getContext('2d');
  g.fillStyle = o.bg ?? 'rgba(0,0,0,0)'; g.fillRect(0, 0, 512, 256); g.fillStyle = o.color ?? '#ffffff'; g.font = `${o.size ?? 64}px ${o.font ?? 'Poppins'}`; g.textAlign = 'center'; g.textBaseline = 'middle';
  String(text).split('\n').forEach((ln, i, a) => g.fillText(ln, 256, 128 + (i - (a.length - 1) / 2) * (o.size ?? 64) * 1.15));
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace;
  const m = new THREE.Mesh(new THREE.PlaneGeometry(o.w ?? 4, (o.w ?? 4) / 2), new THREE.MeshBasicMaterial({ map: t, transparent: true })); m.position.set(x, y, z); if (o.yaw) m.rotation.y = o.yaw; add(m); return m;
}
export function glowTex() {
  const cv = document.createElement('canvas'); cv.width = cv.height = 128; const g = cv.getContext('2d');
  const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.3, 'rgba(255,255,255,0.55)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(cv);
}
export function stars(n = 1500) {
  const r = rr(5), pos = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { const a = r() * 6.283, e = 0.08 + r() * 1.4; pos.set([Math.cos(a) * Math.cos(e) * 400, Math.sin(e) * 400, Math.sin(a) * Math.cos(e) * 400], i * 3); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const p = new THREE.Points(g, new THREE.PointsMaterial({ size: 2.2, sizeAttenuation: false, color: 0xffffff, fog: false })); add(p); return p;
}

// ------------------------------------------------------------------ shots & frame stepping
// shot: { at: segment id, off, build(), cam(u, dur) -> {pos:[x,y,z], tgt:[x,y,z], fov} }
export const SHOTS = [];
export const shot = (at, o) => SHOTS.push({ at, off: o.off ?? 0, ...o });
let CUR = null;
export function camLerp(a, b, u, fa = 40, fb) { const e = u * u * (3 - 2 * u); return { pos: a.pos.map((v, i) => lerp(v, b.pos[i], e)), tgt: a.tgt.map((v, i) => lerp(v, b.tgt[i], e)), fov: lerp(a.fov ?? fa, b.fov ?? fb ?? fa, e) }; }
// TL: {segId: start} from the driver; returns the shot list with absolute starts
function resolve(TL, total) {
  const L = SHOTS.map(s => ({ ...s, start: TL[s.at] + s.off })).sort((a, b) => a.start - b.start);
  L.forEach((s, i) => { s.end = i + 1 < L.length ? L[i + 1].start : total; s.dur = s.end - s.start; }); return L;
}
let LIST = null;
window.setTimeline = (TL, total) => { LIST = resolve(TL, total); return LIST.map(s => [s.at, s.start, s.end]); };
const v3 = new THREE.Vector3();
window.renderAt = (t, draw = true) => {
  let i = 0; while (i + 1 < LIST.length && t >= LIST[i + 1].start) i++;
  const S = LIST[i];
  if (CUR !== S) { newScene(S.scene || {}); S.build(); CUR = S; }
  const u = t - S.start;
  for (const f of scene.userData.updates) f(u, S.dur);
  for (const A of scene.userData.avatars) { if (A.anim) A.anim(A, u, S.dur); if (!A.isDog) posePerson(A, u); }
  const c = S.cam(u, S.dur); camera.position.set(...c.pos); camera.lookAt(...c.tgt); camera.fov = c.fov ?? 40; camera.updateProjectionMatrix();
  if (c.shake) camera.position.x += Math.sin(u * 50) * c.shake;
  if (bokehPass) { const f = (S.focus ? S.focus(u, S.dur) : null) ?? camera.position.distanceTo(new THREE.Vector3(...c.tgt)); bokehPass.uniforms.focus.value = f; }
  if (draw) composer.render();
  // badges on screen: the point above each head
  const out = [];
  for (const A of scene.userData.avatars) {
    if (A.badge === undefined || A.badge === null) continue;
    const val = typeof A.badge === 'function' ? A.badge(u, S.dur) : A.badge; if (val === null || val === undefined) continue;
    A.head.updateWorldMatrix(true, false); v3.set(0, A.isDog ? 0.95 : 1.12, 0); A.head.localToWorld(v3);
    const d = camera.position.distanceTo(v3); v3.project(camera);
    if (v3.z > 1 || v3.z < -1) continue;
    out.push({ x: (v3.x * 0.5 + 0.5) * W, y: (-v3.y * 0.5 + 0.5) * H, k: (1 / Math.tan(THREE.MathUtils.degToRad(camera.fov / 2))) / d, v: val, id: A.id || '' });
  }
  return out;
};
