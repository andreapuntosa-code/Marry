// "What if you could divide by zero?" -- Roblox v2 What-if. Shots for script_zero.py
import { THREE, shot, person, street, ground, house, glowTex, stars, add, on, onPost, camLerp, sm, lerp, getScene, shadowAt, rbox } from './kit.js';
import { blk, dust, sparkles } from './sets.js';
import { waterPlane } from './museum.js';
import { ME, PP, P, dolly, CUY, M_, DOF, DAY, rnd, dynLabel, billboard, classroom } from './whatif.js';

const IN = { interior: true, bloom: 0.3, bloomThreshold: 1.1, exposure: 0.95, env: 0.45, dof: DOF };
// a giant calculator with a screen label
function calculator(x, y, z, textFn, o = {}) { const g = new THREE.Group(); g.position.set(x, y, z); add(g);
  const body = new THREE.Mesh(rbox(2.2, 3.4, 0.35, 0.08), M_(0x2a2d3a, { r: 0.4 })); body.castShadow = true; g.add(body);
  const scr = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 0.7), M_(0x9ab08a, { r: 0.3, em: o.glow ?? 0x000000, ei: 0.5 })); scr.position.set(0, 1.1, 0.18); g.add(scr);
  const cols = [0xe8e8ee, 0xe8e8ee, 0xe8e8ee, 0xff8a3a]; for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) { const b = new THREE.Mesh(rbox(0.38, 0.32, 0.12, 0.25), M_(cols[c], { r: 0.5 })); b.position.set(-0.69 + c * 0.46, 0.35 - r * 0.42, 0.2); g.add(b); }
  const lab = dynLabel(textFn, 0, 0, 0, { w: 1.8, size: 140, color: '#1a2a1a', stroke: false }); g.add(lab); lab.position.set(0, 1.1, 0.21); return { g, lab }; }

// Z01: the billboard: 1 / 0 = ERROR -> ALLOWED
shot('Z01', { scene: DAY, build() {
  street(); billboard((u) => u < 0.8 ? '1 ÷ 0 = ERROR' : '1 ÷ 0 = ALLOWED', 0, -7.8, { size: 98 });
  [[PP[0], -2.5, -5.2, 0.3], [PP[2], 2.4, -5.4, -0.3], [ME, 0, -5.0, 0]].forEach(([d, x, z, yw]) => { const A = person(d, x, z, yw, 'idle'); A.pitch = -0.25; on((u) => { A.pose = u > 0.8 ? 'shock' : 'think'; A.setFace(u > 0.8 ? 'shock' : 'confused'); }); });
  shadowAt(0, -6, 10);
}, cam: dolly(P([0.2, 2.2, 3.4], [0, 3.7, -7.8], 58), P([0.1, 2.1, 2.6], [0, 3.8, -7.8], 58)) });
// Z02: your calculator says error; most people think it's infinity -- it's not
shot('Z02', { scene: IN, build() { classroom(() => ''); const C = calculator(-0.9, 2.2, -2.6, () => 'ERROR');
  const inf = dynLabel(() => '∞ ?', 1.4, 3.3, -2.4, { w: 2.0, size: 260, color: '#ffd23a' }); const X = dynLabel(() => 'X', 1.4, 3.3, -2.35, { w: 2.0, size: 300, color: 'rgba(255,58,58,0.9)', stroke: false });
  on((u) => { inf.visible = u > 1.2; X.visible = u > 3.0; C.g.rotation.y = 0.2; });
  const A = person(ME, 1.6, -1.2, -0.4, 'think', { face: 'confused' }); }, cam: dolly(P([0.1, 2.4, 4.4], [0.0, 2.4, -2.4], 54), P([0.05, 2.4, 3.8], [0.0, 2.4, -2.4], 54)) });
// Z03: from one side +infinity, from the other -infinity: no answer (the graph of 1/x on the board)
shot('Z03', { scene: IN, build() { classroom(() => ''); const g = new THREE.Group(); g.position.set(0, 3.0, -4.3); add(g); const chalk = new THREE.MeshBasicMaterial({ color: 0xf4f4ec });
  const ax1 = new THREE.Mesh(new THREE.BoxGeometry(5.6, 0.03, 0.02), chalk); g.add(ax1); const ax2 = new THREE.Mesh(new THREE.BoxGeometry(0.03, 3.2, 0.02), chalk); g.add(ax2);
  const curve = (sgn) => { const pts = []; for (let i = 0; i <= 60; i++) { const x = sgn * (0.09 + i / 60 * 2.6); const y = Math.max(-1.55, Math.min(1.55, 0.25 / x)); pts.push(new THREE.Vector3(x, y, 0.02)); } return new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 80, 0.03, 6), new THREE.MeshBasicMaterial({ color: sgn > 0 ? 0xffd23a : 0x7ad0ff })); };
  const cp = curve(1), cm = curve(-1); g.add(cp); g.add(cm); on((u) => { cp.visible = u > 0.3; cm.visible = u > 2.0; });
  const lp = dynLabel(() => '+∞', 1.0, 4.3, -4.25, { w: 1.8, size: 220, color: '#ffd23a', stroke: false }), lm = dynLabel(() => '−∞', -1.0, 1.7, -4.25, { w: 1.8, size: 220, color: '#7ad0ff', stroke: false });
  on((u) => { lp.visible = u > 0.8; lm.visible = u > 2.4; }); }, cam: dolly(P([0, 3.0, 2.4], [0, 3.0, -4.3], 56), P([0, 3.0, 1.8], [0, 3.0, -4.3], 56)) });
// Z04-Z05: 1x0 = 0, 2x0 = 0 -> divide by zero -> 1 = 2
shot('Z04', { scene: IN, build() { classroom((u) => u < 2.2 ? '1 × 0 = 0' : '1 × 0 = 0\n2 × 0 = 0', { size: 140 }); const A = person({ ...PP[1], acc: ['glasses'] }, 2.6, -2.8, -0.6, 'point', { face: 'smile' }); }, cam: dolly(P([0, 3.0, 2.6], [0, 3.0, -4.3], 56), P([0, 3.0, 2.0], [0, 3.0, -4.3], 56)) });
shot('Z05', { scene: IN, build() { classroom((u) => u < 1.0 ? '÷ 0' : '1 = 2', { size: 260, color: '#ffd23a' }); sparkles(0, 1.8, -4.0, { n: 120, R: 2.5, h: 3, color: 0xffe08a, amount: (u) => Math.max(0, 1 - Math.abs(u - 1.1) / 0.5) }); }, cam: dolly(P([0, 3.0, 1.8], [0, 3.0, -4.3], 56), P([0, 3.0, 1.2], [0, 3.0, -4.3], 56)), fx: (u) => ({ flash: 0.5 * Math.max(0, 1 - Math.abs(u - 1.0) / 0.2) }) });
// Z06: every number equals every other number (equations raining over the town)
shot('Z06', { scene: DAY, build() { street(); const r = rnd(5); const eq = ['3 = 7', '42 = 0', '1 = 100', '5 = 9', '0 = 1', '8 = 2', '99 = 1', '7 = 7000'];
  eq.forEach((t, i) => { const m = dynLabel(() => t, 0, 0, 0, { w: 2.2, size: 170, color: ['#ffd23a', '#7ad0ff', '#ff8aa0', '#7ad35a'][i % 4] }); const x = -3 + (i % 4) * 2, z = -6 - Math.floor(i / 4) * 2, ph = r() * 3; on((u) => { m.position.set(x, 5 - ((u * 1.2 + ph) % 4), z); m.rotation.z = Math.sin(u + ph) * 0.2; }); });
  const A = person(ME, 0, -4.5, 0, 'shock', { face: 'shock' }); shadowAt(0, -6, 10); }, cam: dolly(P([0.3, 2.4, 3], [0, 3, -7], 56), P([0.2, 2.3, 2], [0, 3, -7], 56)), fx: () => ({ wobble: 0.15 }) });
// Z07: zero dollars in your bank account? That's also a million (an ATM)
shot('Z07', { scene: DAY, build() { street(); blk(1.6, 2.6, 0.8, M_(0x3a5ad8, { r: 0.4 }), 0.6, 1.3, -6.6); const scr = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 0.7), M_(0x1a2a3a, { em: 0x2a6aff, ei: 0.4 })); scr.position.set(0.6, 1.9, -6.19); add(scr);
  dynLabel((u) => u < 1.3 ? '$0' : '$1,000,000', 0.6, 1.9, -6.17, { w: 1.05, size: 120, color: '#7affb0', stroke: false });
  const A = person(ME, -1.0, -5.2, 0.6, 'idle', { face: 'confused' }); on((u) => { A.pose = u > 1.3 ? 'cheer' : 'point'; A.setFace(u > 1.3 ? 'wink' : 'confused'); }); shadowAt(0, -6, 8); }, cam: dolly(P([1.2, 2.1, -1.4], [0.1, 1.8, -6.3], 52), P([1.1, 2.1, -1.9], [0.1, 1.8, -6.3], 52)) });
// Z08: computers crash: in 1997 a US Navy warship stopped dead in the water (a grey ship drifting, lights going out)
shot('Z08', { scene: { sky: ['#5a7aa8', '#c8d8e8'], bloom: 0.3, bloomThreshold: 1.4, exposure: 0.85, env: 0.3, dof: DOF, fog0: 60, fog1: 300 }, build() {
  waterPlane(400, 120, new THREE.MeshStandardMaterial({ color: 0x2a5a7a, roughness: 0.15, metalness: 0.3 }), 0.25, {});
  const ship = new THREE.Group(); add(ship); const grey = M_(0x8a9098, { r: 0.6 });
  const hull = new THREE.Mesh(rbox(3, 2, 16, 0.1), grey); hull.position.y = 0.6; ship.add(hull); const bow = new THREE.Mesh(new THREE.ConeGeometry(1.5, 4, 4), grey); bow.rotation.x = Math.PI / 2; bow.rotation.y = Math.PI / 4; bow.position.set(0, 0.8, 10); bow.scale.set(1, 1, 0.55); ship.add(bow);
  const sup = new THREE.Mesh(rbox(2.2, 3, 4, 0.08), grey); sup.position.set(0, 3, 1); ship.add(sup); const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 4, 8), grey); mast.position.set(0, 6.2, 1); ship.add(mast);
  const lights = []; for (let i = 0; i < 6; i++) { const l = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.2), new THREE.MeshBasicMaterial({ color: 0x9ae0ff })); l.position.set(1.12, 3.2, -0.6 + i * 0.6); l.rotation.y = Math.PI / 2; ship.add(l); lights.push(l); }
  ship.position.set(0, 0, -20); ship.rotation.y = 0.9;
  on((u) => { ship.position.y = Math.sin(u * 1.1) * 0.15; ship.rotation.z = Math.sin(u * 0.9) * 0.04; lights.forEach((l, i) => { l.visible = u < 2.0 + i * 0.25; }); });
  dynLabel((u) => u < 3.6 ? 'USS YORKTOWN · 1997' : 'DEAD IN THE WATER', 0, 9.5, -20, { w: 9, size: 95, color: '#ffffff', stroke: '#1a2a4a' });
  dynLabel(() => '÷ 0', 3.5, 6.5, -16, { w: 3, size: 220, color: '#ff4a4a' });
}, cam: dolly(P([17, 8, 3], [0, 3.5, -20], 46), P([15, 7.5, 1], [0, 3.8, -20], 46)) });
// Z09: money, time, physics... every number would mean nothing (the town glitching)
shot('Z09', { scene: DAY, build() { street({ n: 8 }); const r = rnd(9); for (let i = 0; i < 18; i++) { const m = dynLabel(() => String(Math.floor(r() * 999)), 0, 0, 0, { w: 1.4, size: 200, color: '#ffffff' }); const x = (r() - 0.5) * 14, y = 1 + r() * 6, z = -4 - r() * 10; on((u) => { m.position.set(x + Math.sin(u * 7 + i) * 0.2, y, z); m.visible = Math.sin(u * 13 + i * 2) > -0.3; }); }
  const A = person(ME, 0, -4.5, 0, 'shock', { face: 'shock' }); shadowAt(0, -6, 10); }, cam: dolly(P([0.4, 2.6, 3], [0, 3, -8], 56), P([0.3, 2.5, 2], [0, 3, -8], 56)), fx: (u) => ({ wobble: 0.5, flash: 0.2 * Math.max(0, Math.sin(u * 17)) }) });
// Z10: that's why your calculator says error: it's protecting the universe (a glowing calculator hero)
shot('Z10', { scene: { night: true, bloom: 0.6, bloomThreshold: 0.8, exposure: 0.95, env: 0.2 }, build() { const S = getScene(); S.background = new THREE.Color(0x05060f); S.fog = null; stars(2500);
  const C = calculator(0, 1.6, -3, () => 'ERROR', { glow: 0x3aff6a }); const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex(), color: 0x6affa0, transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending, depthWrite: false })); halo.position.set(0, 1.6, -3.4); halo.scale.setScalar(7); add(halo);
  const key = new THREE.DirectionalLight(0xffffff, 2); key.position.set(3, 4, 6); add(key); on((u) => { C.g.rotation.y = Math.sin(u * 0.6) * 0.25; halo.material.opacity = 0.5 + 0.2 * Math.sin(u * 3); });
  dynLabel((u) => u < 1.4 ? '' : 'PROTECTING\nTHE UNIVERSE', 0, 4.4, -3, { w: 4.4, size: 130, color: '#7affb0' }); }, cam: dolly(P([0, 2.0, 4.4], [0, 2.2, -3], 54), P([0, 2.0, 3.8], [0, 2.3, -3], 54)), fx: (u, d) => ({ fade: sm(d - 0.7, d, u) }) });
