// Stone-age set pieces: cave with painted wall, hide tents, mammoth pit, drying rack, bone arch, burning tree.
import * as THREE from 'three';
import { height } from './terrain.js';
import { mulberry32 } from './noise.js';

const rockMat = (hex = 0x77716a) => new THREE.MeshStandardMaterial({ color: hex, roughness: 0.95, flatShading: true });
const place = (g, x, z, yaw = 0, y) => { g.position.set(x, y ?? height(x, z), z); g.rotation.y = yaw; return g; };

// ---- cave paintings (canvas texture). phase 0..1 = how much of the wall is painted (the story grows over time)
export function paintingTexture(phase = 1, o = {}) {
  const W = 2048, H = 1024, cv = document.createElement('canvas'); cv.width = W; cv.height = H; const g = cv.getContext('2d');
  const bg = g.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#6d6358'); bg.addColorStop(1, '#4a423a'); g.fillStyle = bg; g.fillRect(0, 0, W, H);
  const r = mulberry32(o.seed ?? 5);
  for (let i = 0; i < 1400; i++) { g.fillStyle = `rgba(${r() < 0.5 ? '30,24,18' : '150,138,120'},${0.04 + r() * 0.06})`; const x = r() * W, y = r() * H, s = 6 + r() * 40; g.beginPath(); g.ellipse(x, y, s, s * (0.4 + r() * 0.6), r() * 3, 0, 7); g.fill(); }
  const ink = (a) => `rgba(24,16,12,${a})`, ochre = (a) => `rgba(176,84,36,${a})`, white = (a) => `rgba(240,232,214,${a})`;
  const items = [];
  // each item: threshold phase, draw fn
  const mammoth = (x, y, s, col) => { g.fillStyle = col; g.beginPath(); g.ellipse(x, y, 90 * s, 58 * s, 0, 0, 7); g.fill(); g.beginPath(); g.ellipse(x + 100 * s, y - 20 * s, 42 * s, 38 * s, 0, 0, 7); g.fill(); g.lineWidth = 16 * s; g.lineCap = 'round'; g.strokeStyle = col; g.beginPath(); g.moveTo(x + 130 * s, y - 6 * s); g.quadraticCurveTo(x + 170 * s, y + 40 * s, x + 150 * s, y + 80 * s); g.stroke(); g.lineWidth = 9 * s; for (const dx of [-60, -25, 30, 65]) { g.beginPath(); g.moveTo(x + dx * s, y + 40 * s); g.lineTo(x + dx * s, y + 100 * s); g.stroke(); } g.strokeStyle = white(0.9); g.lineWidth = 7 * s; g.beginPath(); g.arc(x + 125 * s, y + 8 * s, 34 * s, 0.3, 1.6); g.stroke(); };
  const wolf = (x, y, s, col) => { g.fillStyle = col; g.beginPath(); g.ellipse(x, y, 52 * s, 24 * s, 0, 0, 7); g.fill(); g.beginPath(); g.ellipse(x + 56 * s, y - 14 * s, 20 * s, 15 * s, 0, 0, 7); g.fill(); g.lineWidth = 6 * s; g.strokeStyle = col; g.lineCap = 'round'; for (const dx of [-36, -14, 20, 40]) { g.beginPath(); g.moveTo(x + dx * s, y + 14 * s); g.lineTo(x + dx * s, y + 52 * s); g.stroke(); } g.beginPath(); g.moveTo(x - 52 * s, y - 4 * s); g.lineTo(x - 86 * s, y - 20 * s); g.stroke(); };
  const man = (x, y, s, col, spear) => { g.strokeStyle = col; g.fillStyle = col; g.lineWidth = 8 * s; g.lineCap = 'round'; g.beginPath(); g.arc(x, y - 52 * s, 13 * s, 0, 7); g.fill(); g.beginPath(); g.moveTo(x, y - 38 * s); g.lineTo(x, y + 14 * s); g.moveTo(x, y - 24 * s); g.lineTo(x - 22 * s, y - 2 * s); g.moveTo(x, y - 24 * s); g.lineTo(x + 24 * s, y - 40 * s); g.moveTo(x, y + 14 * s); g.lineTo(x - 16 * s, y + 52 * s); g.moveTo(x, y + 14 * s); g.lineTo(x + 18 * s, y + 52 * s); g.stroke(); if (spear) { g.lineWidth = 5 * s; g.beginPath(); g.moveTo(x + 24 * s, y - 40 * s); g.lineTo(x + 70 * s, y - 108 * s); g.stroke(); } };
  const hand = (x, y, s, col, rot = 0) => { g.save(); g.translate(x, y); g.rotate(rot); g.fillStyle = col; g.beginPath(); g.ellipse(0, 0, 34 * s, 40 * s, 0, 0, 7); g.fill(); g.lineWidth = 14 * s; g.lineCap = 'round'; g.strokeStyle = col; for (let k = 0; k < 5; k++) { const a = -2.1 + k * 0.55; g.beginPath(); g.moveTo(Math.cos(a) * 24 * s, Math.sin(a) * 24 * s); g.lineTo(Math.cos(a) * 64 * s, Math.sin(a) * 64 * s); g.stroke(); } g.restore(); };
  const tally = (x, y, n, s, col) => { g.strokeStyle = col; g.lineWidth = 6 * s; g.lineCap = 'round'; for (let k = 0; k < n; k++) { const xx = x + k * 18 * s; g.beginPath(); g.moveTo(xx, y); g.lineTo(xx, y + 54 * s); g.stroke(); if (k % 5 === 4) { g.beginPath(); g.moveTo(xx - 72 * s, y + 40 * s); g.lineTo(xx + 8 * s, y + 8 * s); g.stroke(); } } };
  const star = (x, y, s, col) => { g.strokeStyle = col; g.lineWidth = 5 * s; g.lineCap = 'round'; for (let k = 0; k < 4; k++) { const a = k * Math.PI / 4; g.beginPath(); g.moveTo(x - Math.cos(a) * 24 * s, y - Math.sin(a) * 24 * s); g.lineTo(x + Math.cos(a) * 24 * s, y + Math.sin(a) * 24 * s); g.stroke(); } };
  const moon = (x, y, s, col) => { g.fillStyle = col; g.beginPath(); g.arc(x, y, 34 * s, 0, 7); g.fill(); g.globalCompositeOperation = 'destination-out'; g.globalCompositeOperation = 'source-over'; g.fillStyle = '#5a5046'; g.beginPath(); g.arc(x + 16 * s, y - 6 * s, 30 * s, 0, 7); g.fill(); };
  const sun = (x, y, s, col) => { g.strokeStyle = col; g.fillStyle = col; g.lineWidth = 7 * s; g.beginPath(); g.arc(x, y, 26 * s, 0, 7); g.fill(); for (let k = 0; k < 10; k++) { const a = k * Math.PI / 5; g.beginPath(); g.moveTo(x + Math.cos(a) * 40 * s, y + Math.sin(a) * 40 * s); g.lineTo(x + Math.cos(a) * 66 * s, y + Math.sin(a) * 66 * s); g.stroke(); } };
  const fire = (x, y, s, col) => { g.fillStyle = col; g.beginPath(); g.moveTo(x - 30 * s, y + 40 * s); g.quadraticCurveTo(x - 40 * s, y - 10 * s, x, y - 70 * s); g.quadraticCurveTo(x + 40 * s, y - 10 * s, x + 30 * s, y + 40 * s); g.fill(); };
  const P = phase;
  const when = (t, fn) => { if (P >= t) fn(); };
  when(0.00, () => hand(300, 560, 1.0, ochre(0.95), -0.15));
  when(0.08, () => { hand(420, 520, 0.9, ink(0.9), 0.1); hand(220, 620, 0.9, ochre(0.9), -0.4); });
  when(0.14, () => tally(120, 150, 11, 1.0, ink(0.85)));
  when(0.18, () => fire(640, 700, 1.4, ochre(0.9)));
  when(0.24, () => mammoth(940, 380, 1.5, ink(0.92)));
  when(0.30, () => { man(760, 620, 1.3, ink(0.9), true); man(830, 640, 1.3, ink(0.9), true); man(1130, 640, 1.2, ink(0.9), true); });
  when(0.36, () => mammoth(1480, 560, 1.2, ochre(0.92)));
  when(0.42, () => { wolf(1080, 820, 1.4, ink(0.9)); wolf(1260, 850, 1.3, ink(0.9)); });
  when(0.48, () => { star(300, 260, 1.4, white(0.9)); star(520, 200, 1.1, white(0.8)); star(700, 280, 1.2, white(0.85)); });
  when(0.54, () => moon(1700, 200, 1.8, white(0.9)));
  when(0.60, () => { sun(1000, 150, 1.5, ochre(0.95)); tally(1500, 120, 16, 1.0, white(0.8)); });
  when(0.68, () => { man(1000, 790, 1.4, ink(0.9), true); wolf(1110, 810, 1.5, ink(0.9)); });
  when(0.76, () => { hand(1800, 600, 1.2, white(0.9), 0.2); hand(1680, 700, 1.0, ochre(0.9), -0.3); tally(1560, 880, 15, 1.0, ink(0.85)); });
  when(0.84, () => { for (let k = 0; k < 9; k++) man(150 + k * 90, 900 - (k % 3) * 40, 1.0, ink(0.85)); star(1860, 300, 1.3, white(0.9)); });
  when(0.92, () => { mammoth(300, 820, 0.8, ochre(0.9)); fire(1860, 860, 1.1, ochre(0.9)); sun(1860, 130, 1.2, ochre(0.95)); });
  const tx = new THREE.CanvasTexture(cv); tx.colorSpace = THREE.SRGBColorSpace; tx.anisotropy = 8; return tx;
}

// ---- the cave: a mouth of big rocks, a dark inside, a painted back wall. Local frame: opening faces +z (towards the camera side), wall at z = -depth
export function cave(c, x, z, yaw = 0, o = {}) {
  const g = new THREE.Group(), r = mulberry32(o.seed ?? 9), W = o.w ?? 9, Hh = o.h ?? 5.2, D = o.depth ?? 8;
  const rm = rockMat(o.color ?? 0x7a736b);
  // arch of boulders
  const n = 11;
  for (let i = 0; i <= n; i++) { const a = Math.PI * i / n, bx = Math.cos(a) * W / 2, by = Math.sin(a) * Hh * 0.9; const rk = new THREE.Mesh(new THREE.DodecahedronGeometry(1.2 + r() * 0.5, 0), rm); rk.scale.set(1.2, 1.0 + r() * 0.5, 1.0); rk.position.set(bx, by, 0); rk.rotation.set(r() * 3, r() * 3, r() * 3); rk.castShadow = rk.receiveShadow = true; g.add(rk); }
  for (let i = 0; i < 22; i++) { const a = r() * Math.PI, rad = W / 2 + 0.8 + r() * 1.4, rk = new THREE.Mesh(new THREE.DodecahedronGeometry(1.0 + r() * 1.6, 0), rm); rk.position.set(Math.cos(a) * rad, Math.sin(a) * (Hh * 1.0 + r()) - 0.3, -r() * D * 0.6); rk.scale.set(1, 0.8 + r() * 0.5, 1.3); rk.rotation.set(r() * 3, r() * 3, r() * 3); rk.castShadow = rk.receiveShadow = true; g.add(rk); }
  // rock masses piled around the hollow (never in front of the opening)
  const mk = (x, y, zc, sx, sy, sz, k) => { const m = new THREE.Mesh(new THREE.DodecahedronGeometry(1, 1), rm); m.scale.set(sx, sy, sz); m.position.set(x, y, zc); m.rotation.set(k, k * 2, k * 3); m.castShadow = m.receiveShadow = true; g.add(m); };
  for (let k = 0; k < 4; k++) { const zc = -D * (0.15 + k * 0.28); mk(-W / 2 - 2.5, Hh * 0.55, zc, 2.2, Hh * 0.9, D * 0.22, k); mk(W / 2 + 2.5, Hh * 0.55, zc, 2.2, Hh * 0.9, D * 0.22, k + 4); mk((k - 1.5) * W * 0.3, Hh + 1.6, zc - 0.5, W * 0.4, 2.4, D * 0.2, k + 8); }
  mk(0, Hh * 0.6, -D - 5.2, W * 0.8, Hh * 1.1, 3.4, 3);
  // floor + back wall (inside)
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(W * 1.1, D), new THREE.MeshStandardMaterial({ color: 0x4a4038, roughness: 1 })); floor.rotation.x = -Math.PI / 2; floor.position.set(0, 0.06, -D / 2); floor.receiveShadow = true; g.add(floor);
  const tex = paintingTexture(o.phase ?? 0.5, { seed: o.seed });
  const wall = new THREE.Mesh(new THREE.PlaneGeometry(W * 0.95, Hh * 0.8), new THREE.MeshStandardMaterial({ map: tex, roughness: 1, emissive: 0x201510, emissiveMap: tex, emissiveIntensity: o.glow ?? 0.55 })); wall.position.set(0, Hh * 0.42, -D + 0.1); g.add(wall);
  const side = new THREE.MeshStandardMaterial({ color: 0x3a322b, roughness: 1, side: THREE.DoubleSide });
  for (const sg of [-1, 1]) { const sw = new THREE.Mesh(new THREE.PlaneGeometry(D, Hh), side); sw.rotation.y = Math.PI / 2; sw.position.set(sg * W * 0.47, Hh / 2, -D / 2); g.add(sw); }
  const roof = new THREE.Mesh(new THREE.PlaneGeometry(W, D), side); roof.rotation.x = Math.PI / 2; roof.position.set(0, Hh * 0.95, -D / 2); g.add(roof);
  if (o.light !== false) { const L = new THREE.PointLight(0xffa860, o.lightI ?? 30, 22, 1.5); L.position.set(0, 1.4, -D * 0.3); g.add(L); c.on((t) => { L.intensity = (o.lightI ?? 30) * (0.9 + 0.12 * Math.sin(t * 9) + 0.06 * Math.sin(t * 23)); }); }
  c.add(place(g, x, z, yaw)); g.userData.wallTex = tex; return g;
}

// ---- hide tent on bone ribs
export function tent(c, x, z, yaw = 0, o = {}) {
  const g = new THREE.Group(), s = o.s ?? 1, hm = new THREE.MeshStandardMaterial({ color: o.color ?? 0x8a6a4a, roughness: 1, flatShading: true, side: THREE.DoubleSide });
  const cone = new THREE.Mesh(new THREE.ConeGeometry(1.7 * s, 2.7 * s, 9, 1, true), hm); cone.position.y = 1.35 * s; cone.castShadow = cone.receiveShadow = true; g.add(cone);
  const bm = new THREE.MeshStandardMaterial({ color: 0xece3c8, roughness: 0.7 });
  for (let k = 0; k < 5; k++) { const a = k / 5 * Math.PI * 2, b = new THREE.Mesh(new THREE.CylinderGeometry(0.04 * s, 0.05 * s, 1.1 * s, 6), bm); b.position.set(Math.cos(a) * 0.55 * s, 2.7 * s, Math.sin(a) * 0.55 * s); b.rotation.set(Math.sin(a) * 0.25, 0, -Math.cos(a) * 0.25); g.add(b); }
  const door = new THREE.Mesh(new THREE.PlaneGeometry(0.9 * s, 1.5 * s), new THREE.MeshStandardMaterial({ color: 0x1a120c, roughness: 1 })); door.position.set(0, 0.75 * s, 1.5 * s); door.rotation.x = -0.05; g.add(door);
  c.add(place(g, x, z, yaw)); return g;
}

// ---- mammoth pit: dark hole, sharpened stakes, branches over it
export function pit(c, x, z, o = {}) {
  const g = new THREE.Group(), R = o.r ?? 3;
  const hole = new THREE.Mesh(new THREE.CircleGeometry(R, 24), new THREE.MeshBasicMaterial({ color: 0x0b0806 })); hole.rotation.x = -Math.PI / 2; hole.position.y = 0.04; g.add(hole);
  const wm = new THREE.MeshStandardMaterial({ color: 0x7a5a3a, roughness: 1 });
  for (let k = 0; k < 14; k++) { const a = k / 14 * Math.PI * 2 + 0.3, rr = R * (0.2 + 0.6 * ((k * 37) % 10) / 10), st = new THREE.Mesh(new THREE.ConeGeometry(0.07, 1.6, 5), wm); st.position.set(Math.cos(a) * rr, 0.0, Math.sin(a) * rr); st.rotation.set((k % 3 - 1) * 0.1, 0, (k % 2 - 0.5) * 0.15); g.add(st); }
  if (o.cover !== false) for (let k = 0; k < 10; k++) { const br = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, R * 2.1, 5), wm); br.rotation.set(Math.PI / 2, 0, k * 0.31); br.position.set(0, 0.12 + k * 0.01, 0); g.add(br); }
  c.add(place(g, x, z, 0)); return g;
}

// ---- drying rack with hides / meat
export function rack(c, x, z, yaw = 0) {
  const g = new THREE.Group(), wm = new THREE.MeshStandardMaterial({ color: 0x6a4a2e, roughness: 1 }), hm = new THREE.MeshStandardMaterial({ color: 0x9a7048, roughness: 1, side: THREE.DoubleSide }), mm = new THREE.MeshStandardMaterial({ color: 0x8c2f2a, roughness: 0.8 });
  for (const sg of [-1, 1]) { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 2.2, 6), wm); p.position.set(sg * 1.3, 1.1, 0); p.rotation.z = sg * 0.08; g.add(p); }
  const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 2.8, 6), wm); bar.rotation.z = Math.PI / 2; bar.position.y = 2.05; g.add(bar);
  for (let k = 0; k < 4; k++) { const h = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.9 + (k % 2) * 0.3), k % 2 ? hm : mm); h.position.set(-1 + k * 0.65, 1.55, 0); g.add(h); }
  c.add(place(g, x, z, yaw)); return g;
}

// ---- a dead tree burning after a lightning strike (the flame itself comes from the caller's campfire())
export function deadTree(c, x, z, o = {}) {
  const g = new THREE.Group(), wm = new THREE.MeshStandardMaterial({ color: o.burnt ? 0x1c1612 : 0x5a4634, roughness: 1, flatShading: true });
  const tr = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.5, 6, 7), wm); tr.position.y = 3; tr.castShadow = true; g.add(tr);
  for (let k = 0; k < 6; k++) { const a = k * 1.1, b = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.14, 2.2, 5), wm); b.position.set(Math.cos(a) * 0.5, 4 + k * 0.35, Math.sin(a) * 0.5); b.rotation.set(Math.sin(a) * 0.9, 0, -Math.cos(a) * 0.9); b.castShadow = true; g.add(b); }
  c.add(place(g, x, z, 0)); return g;
}

// ---- arch of mammoth bones (the Walkers' gate)
export function boneArch(c, x, z, yaw = 0, o = {}) {
  const g = new THREE.Group(), bm = new THREE.MeshStandardMaterial({ color: 0xece3c8, roughness: 0.7 }), s = o.s ?? 1;
  for (const sg of [-1, 1]) { const t = new THREE.Mesh(new THREE.TorusGeometry(2.4 * s, 0.14 * s, 8, 24, Math.PI * 0.55), bm); t.position.set(sg * 0.1, 0, 0); t.rotation.set(0, 0, sg > 0 ? Math.PI * 0.45 : Math.PI * 0.0); t.scale.x = sg; g.add(t); }
  const sk = new THREE.Mesh(new THREE.SphereGeometry(0.5 * s, 10, 8), bm); sk.scale.set(1, 0.8, 1.2); sk.position.set(0, 2.5 * s, 0); g.add(sk);
  for (const sg of [-1, 1]) { const tk = new THREE.Mesh(new THREE.TorusGeometry(0.7 * s, 0.07 * s, 6, 14, Math.PI * 0.8), bm); tk.position.set(sg * 0.4 * s, 2.4 * s, 0.4 * s); tk.rotation.set(0, sg * 0.3, sg * Math.PI * 0.5); g.add(tk); }
  g.traverse(n => { if (n.isMesh) n.castShadow = true; }); c.add(place(g, x, z, yaw)); return g;
}

// ---- snow fall (white flakes drifting down around the camera)
export class Snowfall {
  constructor(n = 2500, area = 50, seed = 4) {
    const r = mulberry32(seed); this.n = n; this.area = area; this.base = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) { this.base[i * 3] = (r() - 0.5) * area; this.base[i * 3 + 1] = r() * 24; this.base[i * 3 + 2] = (r() - 0.5) * area; }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(n * 3), 3));
    const cvs = document.createElement('canvas'); cvs.width = cvs.height = 32; const cg = cvs.getContext('2d'); const gr = cg.createRadialGradient(16, 16, 0, 16, 16, 16); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.5, 'rgba(255,255,255,0.7)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); cg.fillStyle = gr; cg.fillRect(0, 0, 32, 32);
    this.points = new THREE.Points(g, new THREE.PointsMaterial({ color: 0xffffff, size: 0.11, map: new THREE.CanvasTexture(cvs), transparent: true, opacity: 0.95, depthWrite: false, alphaTest: 0.02 })); this.points.frustumCulled = false;
  }
  update(t, center, wind = 0.6) {
    const a = this.points.geometry.attributes.position;
    for (let i = 0; i < this.n; i++) {
      const bx = this.base[i * 3], bz = this.base[i * 3 + 2], ph = i * 0.37;
      const x = center.x + ((bx + t * wind * 3 + Math.sin(t * 0.8 + ph) * 0.6 + this.area * 100) % this.area) - this.area / 2, z = center.z + bz + Math.cos(t * 0.7 + ph) * 0.4;
      const y = center.y - 4 + ((this.base[i * 3 + 1] - t * 2.4) % 24 + 24) % 24;
      a.setXYZ(i, x, y, z);
    }
    a.needsUpdate = true;
  }
}

// ---- a hide boat on bone ribs
export function boat(c, x, z, yaw = 0, o = {}) {
  const g = new THREE.Group(), s = o.s ?? 1, hm = new THREE.MeshStandardMaterial({ color: 0x8a6a4a, roughness: 1, flatShading: true, side: THREE.DoubleSide }), bm = new THREE.MeshStandardMaterial({ color: 0xece3c8, roughness: 0.7 });
  const hull = new THREE.Mesh(new THREE.SphereGeometry(1, 14, 8, 0, Math.PI * 2, Math.PI * 0.5, Math.PI * 0.5), hm); hull.scale.set(0.9 * s, 0.7 * s, 2.6 * s); hull.position.y = 0.45 * s; g.add(hull);
  for (let k = -3; k <= 3; k++) { const rb = new THREE.Mesh(new THREE.TorusGeometry(0.9 * s * Math.sqrt(Math.max(0.05, 1 - (k / 3.3) ** 2)), 0.04 * s, 5, 10, Math.PI), bm); rb.position.set(0, 0.45 * s, k * 0.7 * s); rb.rotation.z = Math.PI; g.add(rb); }
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.04 * s, 0.05 * s, 2.4 * s, 6), bm); mast.position.y = 1.5 * s; g.add(mast);
  const flag = new THREE.Mesh(new THREE.PlaneGeometry(0.7 * s, 0.45 * s), new THREE.MeshStandardMaterial({ color: 0xd0402a, side: THREE.DoubleSide })); flag.position.set(0.37 * s, 2.45 * s, 0); flag.rotation.y = Math.PI / 2; g.add(flag);
  g.traverse(n => { if (n.isMesh) n.castShadow = true; }); g.position.set(x, o.y ?? height(x, z), z); g.rotation.y = yaw; c.add(g); return g;
}
