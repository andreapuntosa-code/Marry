// "What if humans didn't have a tongue?" -- Roblox v2 What-if, human-body series. Shots for script_tongue.py
import { THREE, shot, person, street, ground, house, tree, room, glowTex, stars, add, on, onPost, camLerp, sm, lerp, getScene, shadowAt } from './kit.js';
import { blk, dust, sparkles } from './sets.js';
import { table, chair } from './museum.js';
import { ME, PP, P, dolly, CUY, M_, DOF, DAY, rnd, dynLabel, billboard } from './whatif.js';

const DOC = { skin: 0xf2c79a, shirt: 0x8fb0d8, pants: 0x3a3a45, hair: { style: 'white', color: 0xe8e8e8 }, acc: ['coat', 'glasses'] };
const IN = { interior: true, bloom: 0.3, bloomThreshold: 1.0, exposure: 0.95, env: 0.45, dof: DOF };
// a big cartoon tongue (pink, slightly bumpy), lying flat; returns the group
function bigTongue(x, y, z, s = 1) { const g = new THREE.Group(); g.position.set(x, y, z); g.scale.setScalar(s); add(g);
  const c = document.createElement('canvas'); c.width = c.height = 256; const q = c.getContext('2d'); q.fillStyle = '#ee7088'; q.fillRect(0, 0, 256, 256); const r = rnd(3); for (let i = 0; i < 900; i++) { q.fillStyle = `rgba(255,${150 + r() * 60 | 0},${170 + r() * 40 | 0},0.5)`; q.beginPath(); q.arc(r() * 256, r() * 256, 1.5 + r() * 2, 0, 6.28); q.fill(); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(3, 3);
  const m = new THREE.Mesh(new THREE.SphereGeometry(1, 48, 32), new THREE.MeshPhysicalMaterial({ map: t, roughness: 0.35, clearcoat: 0.6, color: 0xffffff })); m.scale.set(1.25, 0.32, 2.0); m.castShadow = true; g.add(m);
  const groove = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.02, 2.6), M_(0xc0405a)); groove.position.set(0, 0.31, 0.1); g.add(groove);
  return g; }

// U01: the billboard: TONGUE: YES -> NO
shot('U01', { scene: DAY, build() {
  street(); billboard((u) => u < 0.75 ? 'TONGUE: YES' : 'TONGUE: NO', 0, -7.8, { size: 118 });
  [[PP[0], -2.5, -5.2, 0.3], [PP[2], 2.4, -5.4, -0.3], [ME, 0, -5.0, 0]].forEach(([d, x, z, yw]) => { const A = person(d, x, z, yw, 'idle', { face: 'tongue' }); A.pitch = -0.2; on((u) => { A.setFace(u < 0.75 ? 'tongue' : 'open'); A.pose = u < 0.75 ? 'idle' : 'shock'; }); });
  shadowAt(0, -6, 10);
}, cam: dolly(P([0.2, 2.2, 3.4], [0, 3.7, -7.8], 58), P([0.1, 2.1, 2.6], [0, 3.8, -7.8], 58)) });
// U02: the tongue map from school is wrong
shot('U02', { scene: IN, build() {
  room({ wall: 0x2a3a5a, floor: '#6a5a4a', w: 10, d: 8, h: 6, lamp: 16 }); const T = bigTongue(0, 1.4, -1.5, 1.0); T.rotation.x = 0.5;
  const zone = (c, x, z, rx, rz) => { const m = new THREE.Mesh(new THREE.CircleGeometry(1, 32), new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0.55 })); m.rotation.x = -Math.PI / 2; m.scale.set(rx, rz, 1); m.position.set(x, 0.335, z); T.add(m); return m; };
  const zs = [zone(0xff5ab0, 0, 1.45, 0.5, 0.35), zone(0x4ab0ff, -0.75, 0.6, 0.3, 0.55), zone(0x4ab0ff, 0.75, 0.6, 0.3, 0.55), zone(0xffd23a, -0.8, -0.4, 0.28, 0.5), zone(0xffd23a, 0.8, -0.4, 0.28, 0.5), zone(0x6ad04a, 0, -1.4, 0.6, 0.35)];
  dynLabel((u) => u < 2.2 ? 'SWEET · SALTY\nSOUR · BITTER' : 'MYTH', 0, 3.2, -1.5, { w: 3.6, size: 120, color: (s) => s === 'MYTH' ? '#ff4a4a' : '#ffffff' });
  const X = new THREE.Group(); X.position.set(0, 1.9, -0.6); add(X); for (const a of [0.78, -0.78]) { const b = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.22, 0.1), new THREE.MeshBasicMaterial({ color: 0xff3a3a })); b.rotation.z = a; X.add(b); }
  on((u) => { X.visible = u > 2.2; X.scale.setScalar(u > 2.2 ? 1 + Math.max(0, 0.4 - (u - 2.2)) : 0.01); zs.forEach((m) => { m.material.opacity = u > 2.2 ? 0.55 * Math.max(0, 1 - (u - 2.2) * 1.5) : 0.55; }); T.rotation.y = Math.sin(u * 0.6) * 0.15; });
}, cam: dolly(P([0, 4.6, 4.8], [0, 1.7, -1.4], 52), P([0, 4.4, 4.2], [0, 1.7, -1.4], 52)) });
// U03: you'd still taste a little: taste buds on the roof of the mouth and in the throat
shot('U03', { scene: DAY, build() { street(); const A = person(ME, 0, -6, 0, 'idle', { face: 'open' });
  const lol = new THREE.Group(); A.armR.add(lol); lol.position.set(0, -2.3, 0.4); const st = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1.6, 8), M_(0xffffff)); st.position.y = -0.6; st.rotation.x = Math.PI / 2; lol.add(st);
  const cnd = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.18, 28), new THREE.MeshPhysicalMaterial({ color: 0xff4a8a, roughness: 0.15, clearcoat: 1 })); cnd.rotation.x = Math.PI / 2; cnd.position.set(0, -0.6, 0.8); lol.add(cnd);
  onPost(() => { A.armR.rotation.x = -1.1; }); on((u) => A.setFace(u < 2.0 ? 'open' : 'smile'));
  dynLabel(() => 'ROOF OF MOUTH\n+ THROAT', 0, 2.28, -5.0, { w: 1.0, size: 115, color: '#ffd23a' }); shadowAt(0, -6, 8); }, cam: CUY(0, -6, 0, { d: 3.6, side: 0.4 }) });
// U04: try talking: T D N L K G R S all need a tongue
shot('U04', { scene: DAY, build() { street(); const A = person(ME, 0, -6, 0, 'idle', { face: 'open' }); on((u) => A.setFace(Math.floor(u * 6) % 2 ? 'open' : 'smile'));
  const L = ['T', 'D', 'N', 'L', 'K', 'G', 'R', 'S'];
  L.forEach((ch, i) => { const m = dynLabel(() => ch, 0, 0, 0, { w: 0.62, size: 260, color: '#ffffff' }); const X = dynLabel(() => 'X', 0, 0, 0, { w: 0.62, size: 300, color: 'rgba(255,58,58,0.85)', stroke: false });
    on((u) => { const t0 = 0.2 + i * 0.42, q = u - t0; const vis = q > 0; m.visible = X.visible = vis; const x = -0.72 + (i % 4) * 0.48, y = 2.78 - Math.floor(i / 4) * 0.46; m.position.set(x, y + Math.min(0.1, q * 0.3), -4.6); X.position.set(x, y + Math.min(0.1, q * 0.3), -4.55); X.visible = q > 0.25; }); });
  shadowAt(0, -6, 8); }, cam: CUY(0, -6, 0, { d: 4.4, side: 0.2, hy: 2.3 }) });
// U05: "hello" would sound like "eh oh"
shot('U05', { scene: DAY, build() { street(); const A = person(ME, -0.9, -6, 0.5, 'wave', { face: 'open' }); const B = person(PP[2], 1.0, -5.8, -0.5, 'idle', { face: 'confused' });
  const bub = new THREE.Mesh(new THREE.CircleGeometry(0.9, 32), new THREE.MeshBasicMaterial({ color: 0xffffff })); bub.scale.set(1.5, 1, 1); bub.position.set(-0.3, 3.1, -5.9); add(bub);
  dynLabel((u) => u < 0.55 ? 'HELLO' : 'EH-OH?', -0.3, 3.1, -5.85, { w: 2.2, size: 180, color: '#1a1a3a', stroke: false });
  shadowAt(0, -6, 8); }, cam: dolly(P([0.2, 2.3, -1.4], [0, 2.4, -6], 52), P([0.1, 2.3, -1.9], [0, 2.4, -6], 52)) });
// U06-U07: eating gets hard; every bite needs a sip of water
function dinner(o = {}) { room({ wall: 0xe8c8a0, floor: '#a87a50', w: 10, d: 8, h: 5, lamp: 18 }); table(0, -1.5, { candle: false }); chair(0, -0.6, Math.PI, 0.55);
  const A = person(ME, 0, -0.6, Math.PI, 'sit', { face: o.face ?? 'confused' }); A.root.position.y = 0.06;
  const plate = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.26, 0.03, 32), M_(0xffffff, { r: 0.3 })); plate.position.set(0, 1.1, -1.25); add(plate);
  for (let i = 0; i < 5; i++) { const m = new THREE.Mesh(new THREE.SphereGeometry(0.06, 12, 10), M_([0xd8a040, 0x6ab04a, 0xd84a3a][i % 3])); m.position.set(Math.cos(i) * 0.12, 1.15, -1.25 + Math.sin(i) * 0.12); add(m); }
  const glass = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.06, 0.22, 16), new THREE.MeshPhysicalMaterial({ color: 0xbfe8ff, transparent: true, opacity: 0.5, roughness: 0.05 })); glass.position.set(0.32, 1.19, -1.2); add(glass);
  return { A, glass }; }
shot('U06', { scene: IN, build() { dinner({ face: 'confused' }); dynLabel(() => 'SWALLOW?', 0.1, 2.05, -2.3, { yaw: Math.PI, w: 0.72, size: 160, color: '#ffd23a' }); }, cam: dolly(P([0.3, 2.1, -3.7], [0, 1.45, -0.6], 58), P([0.25, 2.05, -3.5], [0, 1.45, -0.6], 58)) });
shot('U07', { scene: IN, build() { const { A, glass } = dinner({ face: 'sad' }); const h = new THREE.Vector3();
  onPost((u) => { const k = Math.max(0, Math.sin(Math.PI * ((u * 0.7) % 1))); A.armR.rotation.x = -0.4 - 1.7 * k; A.armR.updateWorldMatrix(true, false); h.set(0, -1.8, 0.2); A.armR.localToWorld(h); glass.position.copy(h); glass.rotation.x = -k * 0.8; });
  dynLabel((u) => 'SIP #' + (1 + Math.floor(u * 0.7)), 0, 2.05, -2.3, { yaw: Math.PI, w: 0.8, size: 160, color: '#7ad0ff' }); }, cam: dolly(P([0.6, 2.1, -3.7], [0, 1.45, -0.6], 58), P([0.5, 2.05, -3.5], [0, 1.45, -0.6], 58)) });
// U08: not the strongest muscle: a myth (the tongue on a bench press, failing)
shot('U08', { scene: IN, build() {
  room({ wall: 0x3a3a48, floor: '#5a5a62', w: 10, d: 8, h: 6, lamp: 20 }); blk(2.6, 0.3, 0.8, M_(0x1a1a1a, { r: 0.4 }), 0, 0.9, -1.5); for (const s of [-1, 1]) blk(0.1, 0.9, 0.6, M_(0x8a8a92, { m: 0.7 }), s * 1.1, 0.45, -1.5);
  const T = bigTongue(0, 1.3, -1.5, 0.5); T.rotation.y = Math.PI / 2;
  const bar = new THREE.Group(); add(bar); const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 2.6, 10), M_(0xc8ccd2, { m: 0.9, r: 0.2 })); rod.rotation.z = Math.PI / 2; bar.add(rod);
  for (const s of [-1, 1]) { const w = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.12, 24), M_(0x1a1a1a, { r: 0.4 })); w.rotation.z = Math.PI / 2; w.position.x = s * 1.05; bar.add(w); }
  on((u) => { const k = Math.max(0, Math.sin(u * 4)) * (u < 1.8 ? 0.25 : 0.04); bar.position.set(0, 1.62 + k, -1.5); T.scale.y = 0.5 * (1 - (u > 1.8 ? 0.25 : 0)); });
  dynLabel((u) => u < 1.6 ? 'STRONGEST MUSCLE?' : 'MYTH', 0, 2.8, -1.8, { w: 3.6, size: 120, color: (s) => s === 'MYTH' ? '#ff4a4a' : '#ffffff' });
}, cam: dolly(P([2.2, 2.6, 3.4], [0, 1.7, -1.5], 50), P([1.9, 2.5, 2.9], [0, 1.7, -1.5], 50)) });
// U09: people can learn to talk and eat again: months of practice with a therapist
shot('U09', { scene: IN, build() {
  room({ wall: 0xd8eef2, floor: '#c8c8c8', w: 10, d: 8, h: 5, lamp: 20 }); const D = person(DOC, 1.1, -2.2, -0.6, 'present', { face: 'smile' }); const A = person(ME, -0.9, -1.6, 0.7, 'idle', { face: 'open' });
  blk(2.4, 1.6, 0.1, M_(0xffffff), 0, 2.9, -3.8); dynLabel(() => 'A  E  O\nB  M  P', 0, 2.9, -3.72, { w: 2.2, size: 150, color: '#2a3a8a', stroke: false });
  on((u) => { A.setFace(Math.floor(u * 3) % 2 ? 'open' : 'smile'); });
  dynLabel((u) => 'MONTH ' + (1 + Math.floor(sm(0, 3.8, u) * 5)), 0, 4.3, -3.6, { w: 3.6, size: 150, color: '#ffd23a' });
}, cam: dolly(P([0.2, 2.2, 3.0], [0, 2.1, -2.4], 54), P([0.1, 2.2, 2.3], [0, 2.2, -2.4], 54)) });
// U10: next time you bite it... say thank you. If you can.
shot('U10', { scene: DAY, build() { street(); const A = person(ME, 0, -6, 0, 'idle', { face: 'tongue' }); on((u) => { A.setFace(u < 0.9 ? 'tongue' : 'pain'); A.pose = u < 0.9 ? 'idle' : 'shock'; });
  sparkles(0, 1.7, -5.6, { n: 40, R: 0.4, h: 0.6, color: 0xffd23a, amount: (u) => (u > 0.9 && u < 1.6 ? 1 : 0) });
  dynLabel((u) => u < 1.6 ? '' : 'THANK YOU', 0, 2.2, -5.0, { w: 0.62, size: 170, color: '#ff8aa0' }); shadowAt(0, -6, 8); },
  cam: CUY(0, -6, 0, { d: 3.0, side: 0.3, push: 0.6 }), fx: (u, d) => ({ fade: sm(d - 0.7, d, u) }) });
