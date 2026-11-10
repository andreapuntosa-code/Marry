// "What if you couldn't feel pain?" -- Roblox v2 What-if, human-body series. Shots for script_pain.py
import { THREE, shot, person, street, ground, house, tree, room, bed, glowTex, stars, add, on, onPost, camLerp, sm, lerp, getScene, shadowAt } from './kit.js';
import { blk, dust, sparkles } from './sets.js';
import { table, chair } from './museum.js';
import { ME, PP, P, dolly, CUY, M_, DOF, DAY, rnd, dynLabel, billboard } from './whatif.js';

const SURG = { skin: 0xf2c79a, shirt: 0x3aa88a, pants: 0x3aa88a, hair: { style: 'bald' }, acc: ['glasses'] };
const IN = { interior: true, bloom: 0.35, bloomThreshold: 1.0, exposure: 0.95, env: 0.45, dof: DOF };
function surgCap(A) { const c = new THREE.Mesh(new THREE.SphereGeometry(0.72, 24, 12, 0, 6.283, 0, Math.PI / 2), M_(0x3aa88a, { r: 0.8 })); c.position.y = 0.45; A.head.add(c);
  const m = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.5, 0.1), M_(0x9ad8f0, { r: 0.8 })); m.position.set(0, -0.25, 0.66); A.head.add(m); }
function brainOn(A) { const c = document.createElement('canvas'); c.width = c.height = 256; const q = c.getContext('2d'); q.fillStyle = '#f0a0b0'; q.fillRect(0, 0, 256, 256); q.strokeStyle = '#c0607a'; q.lineWidth = 6; const r = rnd(5);
  for (let i = 0; i < 40; i++) { q.beginPath(); let x = r() * 256, y = r() * 256; q.moveTo(x, y); for (let k = 0; k < 5; k++) { x += (r() - 0.5) * 50; y += (r() - 0.5) * 50; q.quadraticCurveTo(x + 10, y - 10, x, y); } q.stroke(); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; const b = new THREE.Mesh(new THREE.SphereGeometry(0.62, 32, 24, 0, 6.283, 0, Math.PI / 2), new THREE.MeshPhysicalMaterial({ map: t, roughness: 0.4, clearcoat: 0.7 })); b.scale.set(1, 0.8, 1.1); b.position.y = 0.6; A.head.add(b); return b; }

// N01: the billboard: PAIN: ON -> OFF
shot('N01', { scene: DAY, build() {
  street(); billboard((u) => u < 0.7 ? 'PAIN: ON' : 'PAIN: OFF', 0, -7.8, { size: 150 });
  [[PP[0], -2.5, -5.2, 0.3], [PP[2], 2.4, -5.4, -0.3], [ME, 0, -5.0, 0]].forEach(([d, x, z, yw]) => { const A = person(d, x, z, yw, 'idle', { face: 'pain' }); A.pitch = -0.2; on((u) => { A.setFace(u < 0.7 ? 'pain' : 'smile'); A.pose = u < 0.7 ? 'idle' : 'cheer'; }); });
  shadowAt(0, -6, 10);
}, cam: dolly(P([0.2, 2.2, 3.4], [0, 3.7, -7.8], 58), P([0.1, 2.1, 2.6], [0, 3.8, -7.8], 58)) });
// N02: the brain can't feel pain: surgeons operate while you're awake and talking
shot('N02', { scene: IN, build() {
  room({ wall: 0x8ab8b0, floor: '#7a908a', w: 10, d: 8, h: 5, lamp: 10 }); blk(1.4, 0.8, 2.6, M_(0xe8eef0, { m: 0.3 }), 0, 0.4, -2.2);
  const A = person({ ...ME, shirt: 0x9ab8e8 }, 0, -2.6, 0, 'situp', { face: 'smile' }); A.root.position.y = 0.8; brainOn(A); on((u) => A.setFace(Math.floor(u * 2.5) % 2 ? 'open' : 'smile'));
  for (const [x, z, yw] of [[-1.4, -2.9, 0.9], [1.4, -2.9, -0.9]]) { const S = person(SURG, x, z, yw, 'point', { face: 'smile' }); surgCap(S); }
  const lamp = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 1.0, 0.3, 24), M_(0xc8c8c8, { em: 0xffffff, ei: 0.15 })); lamp.position.set(0, 4.2, -2.4); add(lamp);
  dynLabel((u) => u < 2.6 ? 'AWAKE' : 'BRAIN: 0 PAIN', 0, 3.0, -2.0, { w: 2.0, size: 120, color: (s) => s === 'AWAKE' ? '#ffffff' : '#ffd23a' });
}, cam: dolly(P([0.2, 2.4, 2.4], [0, 2.0, -2.5], 52), P([0.15, 2.35, 1.8], [0, 2.05, -2.5], 52)) });
// N03: sounds like a superpower; it's real
shot('N03', { scene: DAY, build() { street(); const A = person(ME, 0, -6, 0, 'cheer', { face: 'smug' });
  const cape = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 3.0), new THREE.MeshStandardMaterial({ color: 0xd82a2a, side: THREE.DoubleSide })); cape.position.set(0, 2.4, -0.6); A.body.add(cape);
  on((u) => { cape.rotation.x = 0.25 + Math.sin(u * 5) * 0.08; A.setFace(u < 1.8 ? 'smug' : 'shock'); A.pose = u < 1.8 ? 'cheer' : 'idle'; });
  dynLabel((u) => u < 1.8 ? 'SUPERPOWER?' : "IT'S REAL", 0, 2.55, -5.2, { w: 1.5, size: 150, color: '#ffd23a' }); shadowAt(0, -6, 8); }, cam: CUY(0, -6, 0, { d: 4.2, side: 0.3 }) });
// N04: as babies, they chew their lips and fingers... and never cry
shot('N04', { scene: IN, build() {
  room({ wall: 0xf4d8e0, floor: '#c8a880', w: 9, d: 8, h: 5, lamp: 18 }); blk(2.4, 0.15, 1.6, M_(0x8ab0d8), 0, 0.9, -2.2); blk(2.6, 0.8, 1.8, M_(0xb88a5a), 0, 0.4, -2.2);
  for (let i = 0; i < 11; i++) for (const z of [-3.0]) blk(0.08, 0.9, 0.08, M_(0xb88a5a), -1.15 + i * 0.23, 1.35, z);
  const B = person({ ...PP[1], skin: 0xf2c79a, shirt: 0xf5c84a, pants: 0xf5c84a, hair: { style: 'bald' }, scale: 0.42 }, 0, -2.2, 0, 'sit', { face: 'smile', y: 0.98 }); onPost((u) => { B.armR.rotation.x = -2.6 + Math.sin(u * 8) * 0.15; });
  dynLabel((u) => 'NO CRYING', 0, 2.15, -1.8, { w: 1.2, size: 150, color: '#ff8aa0' });
}, cam: dolly(P([0.3, 2.6, 0.6], [0, 1.1, -2.2], 50), P([0.25, 2.5, 0.2], [0, 1.1, -2.2], 50)) });
// N05: walking on broken bones for weeks (an X-ray on a lightbox)
shot('N05', { scene: IN, build() {
  room({ wall: 0x2a3a4a, floor: '#5a5a62', w: 10, d: 8, h: 5, lamp: 10 });
  const c = document.createElement('canvas'); c.width = 512; c.height = 768; const q = c.getContext('2d'); q.fillStyle = '#0a1420'; q.fillRect(0, 0, 512, 768); q.fillStyle = 'rgba(220,235,255,0.9)';
  q.beginPath(); q.ellipse(256, 90, 70, 50, 0, 0, 6.28); q.fill(); q.fillRect(226, 120, 60, 260); q.beginPath(); q.ellipse(256, 400, 66, 44, 0, 0, 6.28); q.fill(); q.fillRect(228, 420, 56, 270); q.beginPath(); q.ellipse(256, 700, 70, 40, 0, 0, 6.28); q.fill();
  q.strokeStyle = '#0a1420'; q.lineWidth = 10; q.beginPath(); q.moveTo(222, 230); q.lineTo(260, 250); q.lineTo(240, 262); q.lineTo(292, 285); q.stroke();
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; const xr = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 2.1), new THREE.MeshBasicMaterial({ map: t })); xr.position.set(-1.2, 2.5, -3.8); add(xr);
  const cr = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex(), color: 0xff3a3a, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, depthWrite: false })); cr.position.set(-1.2, 2.95, -3.75); cr.scale.setScalar(0.6); add(cr);
  const A = person({ ...ME, acc: [] }, 1.0, -2.0, -0.4, 'walk', { face: 'smile' }); A.anim = (Q, u) => { Q.root.position.x = 1.6 - u * 0.25; Q.root.rotation.z = Math.sin(u * 6) * 0.06; };
  on((u) => { cr.material.opacity = 0.5 + 0.4 * Math.sin(u * 6); });
  dynLabel(() => 'BROKEN', -1.2, 3.85, -3.7, { w: 1.7, size: 150, color: '#ff4a4a' });
}, cam: dolly(P([0.4, 2.3, 2.4], [-0.2, 2.2, -3.2], 52), P([0.3, 2.3, 1.8], [-0.2, 2.25, -3.2], 52)) });
// N06: soup that's too hot; sitting the wrong way for hours
shot('N06', { scene: IN, build() {
  room({ wall: 0xe8c8a0, floor: '#a87a50', w: 10, d: 8, h: 5, lamp: 18 }); table(0, -1.5, { candle: false }); chair(0, -0.6, Math.PI, 0.55);
  const A = person(ME, 0, -0.6, Math.PI, 'sit', { face: 'smile' }); A.root.position.y = 0.06;
  const bowl = new THREE.Mesh(new THREE.SphereGeometry(0.2, 24, 16, 0, 6.283, Math.PI / 2, Math.PI / 2), M_(0xffffff, { r: 0.3 })); bowl.position.set(0, 1.28, -1.3); add(bowl);
  const soup = new THREE.Mesh(new THREE.CircleGeometry(0.19, 24), M_(0xd8602a, { r: 0.3 })); soup.rotation.x = -Math.PI / 2; soup.position.set(0, 1.27, -1.3); add(soup);
  sparkles(0, 1.3, -1.3, { n: 40, R: 0.12, h: 0.9, color: 0xffffff, size: 0.1 });
  dynLabel((u) => u < 2.0 ? '90°C' : '3 HOURS', 0.05, 2.05, -2.3, { yaw: Math.PI, w: 0.62, size: 170, color: (s) => s === '90°C' ? '#ff6a3a' : '#ffd23a' });
}, cam: dolly(P([0.3, 2.1, -3.7], [0, 1.45, -0.6], 58), P([0.25, 2.05, -3.5], [0, 1.45, -0.6], 58)) });
// N07: appendicitis: no warning at all, until it's an emergency (a red glow pulsing in the belly, unnoticed)
shot('N07', { scene: DAY, build() { street(); const A = person(ME, 0, -6, 0, 'idle', { face: 'smile' });
  const g = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex(), color: 0xff2a2a, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false })); g.position.set(0.18, 1.25, -5.5); g.scale.setScalar(0.8); add(g);
  on((u) => { g.material.opacity = sm(0.2, 2.0, u) * (0.6 + 0.4 * Math.sin(u * 8)); g.scale.setScalar(0.5 + sm(0.2, 2.6, u) * 0.8); A.setFace(u < 2.2 ? 'smile' : 'shock'); });
  dynLabel((u) => u < 2.2 ? 'APPENDIX' : 'EMERGENCY', 0, 2.55, -5.2, { w: 1.5, size: 150, color: '#ff4a4a' }); shadowAt(0, -6, 8); }, cam: CUY(0, -6, 0, { d: 4.2, side: 0.3 }) });
// N08: pain is your body's alarm system (a siren spinning on the wall)
shot('N08', { scene: { interior: true, bloom: 0.6, bloomThreshold: 0.8, exposure: 0.9, env: 0.2, dof: DOF }, build() {
  room({ wall: 0x3a3a48, floor: '#5a5a62', w: 9, d: 8, h: 5, lamp: 4 });
  const base = blk(0.5, 0.2, 0.5, M_(0x2a2a2a), 0, 3.6, -3.6); const dome = new THREE.Mesh(new THREE.SphereGeometry(0.3, 24, 16, 0, 6.283, 0, Math.PI / 2), new THREE.MeshBasicMaterial({ color: new THREE.Color(2.5, 0.2, 0.2) })); dome.position.set(0, 3.7, -3.6); add(dome);
  const sp = new THREE.SpotLight(0xff2020, 60, 14, 0.5, 0.4, 1.2); sp.position.set(0, 3.8, -3.6); add(sp); add(sp.target);
  on((u) => { const a = u * 7; sp.target.position.set(Math.cos(a) * 5, 1.5, -3.6 + Math.sin(a) * 5); });
  const A = person(ME, 0.6, -1.8, -0.3, 'point', { face: 'shock' }); A.pitch = -0.4;
  dynLabel(() => 'ALARM SYSTEM', 0, 4.3, -3.5, { w: 2.8, size: 130, color: '#ff6a6a' });
}, cam: dolly(P([0.3, 2.4, 2.8], [0, 2.6, -3.0], 54), P([0.2, 2.4, 2.2], [0, 2.7, -3.0], 54)) });
// N09: a small cut, a burn, a twisted ankle can quietly turn into something much worse (bandaged, still walking)
shot('N09', { scene: DAY, build() { street({ n: 8 }); const A = person(ME, -3, -5.6, Math.PI / 2, 'walk', { face: 'smile' }); A.anim = (Q, u) => { Q.root.position.x = -3 + u * 1.1; Q.root.rotation.z = Math.sin(u * 6) * 0.07; };
  for (const [dx, dy] of [[0.3, 0.7], [-0.25, 1.5], [0.1, 0.2]]) { const b = new THREE.Mesh(new THREE.BoxGeometry(1.06, 0.25, 1.06), M_(0xf8f8f0, { r: 0.9 })); b.position.set(dx * 0, dy / 0.42, 0); A.body.add(b); }
  dynLabel((u) => u < 1.6 ? 'CUT' : u < 3.2 ? 'BURN' : 'ANKLE', 0.9, 3.1, -5.6, { w: 1.5, size: 170, color: '#ff8a5a' });
  shadowAt(0, -6, 10); }, cam: dolly(P([2.4, 2.0, -0.8], [0, 1.6, -5.6], 52), P([2.8, 2.0, -1.4], [1.0, 1.6, -5.6], 52)) });
// N10: pain hurts... but it's the reason you're still alive (sunset)
shot('N10', { scene: { sky: ['#4a3a7a', '#f8a060'], bloom: 0.45, bloomThreshold: 1.2, exposure: 0.9, env: 0.2, dof: DOF }, build() {
  const S = getScene(); S.userData.sun.color.set(0xff9a50); S.userData.sun.intensity = 1.6; S.userData.hemi.intensity = 0.8; street({ n: 8 });
  const A = person(ME, 0, -6, 0, 'idle', { face: 'smile' }); onPost(() => { A.armR.rotation.x = -1.2; A.armR.rotation.z = 0.6; });
  const heart = dynLabel(() => '♥', 0.15, 1.45, -5.45, { w: 0.6, size: 300, color: '#ff4a6a', stroke: false });
  on((u) => { heart.scale.setScalar(1 + 0.12 * Math.max(0, Math.sin(u * 7))); });
  dynLabel((u) => u < 1.2 ? '' : 'STILL ALIVE', 0, 2.55, -5.2, { w: 1.5, size: 150, color: '#ffffff' }); shadowAt(0, -6, 8); },
  cam: CUY(0, -6, 0, { d: 4.2, side: 0.3 }), fx: (u, d) => ({ fade: sm(d - 0.7, d, u) }) });
