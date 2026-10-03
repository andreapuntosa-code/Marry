// The creator's room ("a guy in a hoodie, at three in the morning"): an interior set far
// above the world (sky/terrain are hidden in interior shots), lit by the monitor and a lamp.
import * as THREE from 'three';
import { drawGroundMap } from '../lib/groundmap.js';
import { RIVER_PTS } from '../lib/terrain.js';
import { GM } from '../lib/ground_uniforms.js';
import { PROTO, buildingMaterial } from '../lib/buildings.js';

export const ROOM = { x: 0, y: 400, z: 0 };
const R = (x, y, z) => [ROOM.x + x, ROOM.y + y, ROOM.z + z];
export const DESK = R(0, 0.74, 0);
export const SCREEN = R(0, 1.12, -0.32);
export const SEAT = R(0, 0, 0.62);
export { R as roomAt };

function screenTexture(year, pop, extra) {
  const cv = document.createElement('canvas'); cv.width = 1024; cv.height = 576;
  const g = cv.getContext('2d');
  g.fillStyle = '#0a0f17'; g.fillRect(0, 0, 1024, 576);
  // world view
  const mx = 24, my = 64, mw = 640, mh = 488;
  g.fillStyle = '#3f6a35'; g.fillRect(mx, my, mw, mh);
  try { const gm = drawGroundMap(year).image; g.drawImage(gm, mx, my, mw, mh); } catch (e) { }
  g.strokeStyle = '#3b7fa0'; g.lineWidth = 9; g.lineCap = 'round'; g.beginPath();
  RIVER_PTS.forEach(([x, z], i) => { const px = mx + (x - GM.x0) / GM.size * mw, py = my + (z - GM.z0) / GM.size * mh; i ? g.lineTo(px, py) : g.moveTo(px, py); }); g.stroke();
  g.strokeStyle = '#2b3445'; g.lineWidth = 3; g.strokeRect(mx, my, mw, mh);
  // top bar + side panel
  g.fillStyle = '#111827'; g.fillRect(0, 0, 1024, 48);
  g.fillStyle = '#7dd3fc'; g.font = 'bold 24px monospace'; g.fillText('PRIMA.SIM', 20, 32);
  g.fillStyle = '#cbd5e1'; g.font = '22px monospace'; g.fillText(`YEAR ${year}`, 220, 32); g.fillText(`POP ${pop}`, 420, 32);
  g.fillStyle = '#4ade80'; g.fillText('● RUNNING', 840, 32);
  const lines = extra || ['> watch --all', 'agents: online', 'events: 3 new', 'temple: +12 offerings', 'autosave: year 2000', '', 'rule #3: do not', 'interfere.'];
  g.fillStyle = '#94a3b8'; g.font = '20px monospace';
  lines.forEach((l, i) => g.fillText(l, 690, 100 + i * 34));
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

const M = (hex, rough = 0.7, metal = 0) => new THREE.MeshStandardMaterial({ color: hex, roughness: rough, metalness: metal });

export function buildRoom(c, opts = {}) {
  const grp = new THREE.Group(); grp.position.set(ROOM.x, ROOM.y, ROOM.z);
  const box = (w, h, d, mat, x, y, z) => { const g = new THREE.BoxGeometry(w, h, d); c.own(g); const m = new THREE.Mesh(g, mat); m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; grp.add(m); return m; };
  const cyl = (r0, r1, h, mat, x, y, z, seg = 18) => { const g = new THREE.CylinderGeometry(r0, r1, h, seg); c.own(g); const m = new THREE.Mesh(g, mat); m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; grp.add(m); return m; };
  const wall = M(0x2a2d34, 0.9), floor = M(0x3a2c22, 0.75), wood = M(0x4a3426, 0.6), black = M(0x111214, 0.4, 0.2);
  box(6, 0.05, 6, floor, 0, -0.025, 0.6);
  box(6, 2.8, 0.1, wall, 0, 1.4, -1.2); box(0.1, 2.8, 6, wall, -2.6, 1.4, 0.6); box(0.1, 2.8, 6, wall, 2.6, 1.4, 0.6); box(6, 0.1, 6, wall, 0, 2.8, 0.6);
  box(6, 2.8, 0.1, wall, 0, 1.4, 3.6);
  // desk
  box(1.7, 0.05, 0.8, wood, 0, 0.72, -0.25);
  for (const [x, z] of [[-0.8, -0.6], [0.8, -0.6], [-0.8, 0.1], [0.8, 0.1]]) box(0.05, 0.72, 0.05, wood, x, 0.36, z);
  // monitor
  box(0.94, 0.56, 0.035, black, 0, 1.12, -0.34);
  cyl(0.02, 0.02, 0.3, black, 0, 0.88, -0.38, 8); box(0.25, 0.015, 0.18, black, 0, 0.75, -0.38);
  const tex = screenTexture(opts.year ?? 1003, opts.pop ?? '1,204', opts.lines); c.own(tex);
  const sg = new THREE.PlaneGeometry(0.9, 0.506); c.own(sg);
  const screen = new THREE.Mesh(sg, new THREE.MeshBasicMaterial({ map: tex, toneMapped: false }));
  screen.position.set(0, 1.12, -0.32); grp.add(screen);
  // keyboard, mouse, mugs
  box(0.46, 0.02, 0.15, M(0x1d1f24, 0.5), 0, 0.755, 0.0); box(0.06, 0.02, 0.1, M(0x1d1f24, 0.5), 0.36, 0.755, 0.02);
  const mug = M(0xe9e4da, 0.35), coffee = M(0x2a170c, 0.2);
  [[-0.62, -0.15], [-0.5, 0.02], [0.55, -0.42], [0.68, -0.1]].forEach(([x, z], i) => { cyl(0.042, 0.038, 0.1, i % 2 ? M(0x3a4a6a, 0.4) : mug, x, 0.795, z); cyl(0.036, 0.036, 0.005, coffee, x, 0.84, z); });
  // lamp
  cyl(0.07, 0.08, 0.02, black, -0.7, 0.755, -0.5); cyl(0.012, 0.012, 0.42, black, -0.7, 0.97, -0.5, 6);
  const shade = cyl(0.05, 0.11, 0.12, M(0x2b2b2b, 0.5), -0.62, 1.16, -0.45); shade.rotation.z = -0.6;
  const lamp = new THREE.PointLight(0xffb36b, opts.lamp ?? 1.6, 3.5, 2); lamp.position.set(-0.6, 1.05, -0.42); grp.add(lamp);
  const mon = new THREE.PointLight(0x8fc7ff, opts.monitor ?? 2.4, 4.5, 2); mon.position.set(0, 1.12, 0.05); grp.add(mon);
  // window with blinds (moonlight strips)
  for (let k = 0; k < 9; k++) { const g = new THREE.PlaneGeometry(1.2, 0.07); c.own(g); const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color: 0x5f7fb8, toneMapped: false })); m.position.set(-2.54, 1.0 + k * 0.12, 0.6); m.rotation.y = Math.PI / 2; grp.add(m); }
  const moon = new THREE.PointLight(0x7f9fd8, 0.6, 5, 2); moon.position.set(-2.2, 1.5, 0.6); grp.add(moon);
  // chair
  box(0.5, 0.06, 0.5, black, 0, 0.47, 0.62); box(0.5, 0.6, 0.06, black, 0, 0.82, 0.88); cyl(0.03, 0.03, 0.42, black, 0, 0.24, 0.62, 8);
  c.add(grp);
  return { grp, screen, lamp, mon };
}

// the creator: a grey mannequin in a dark hoodie, seated at the desk
export function creator(c, pose = 'type') {
  const P = c.personAt('HOODIE', SEAT[0], SEAT[1], SEAT[2], { yaw: Math.PI });
  P.anim = (Q, t) => {
    Q.pose('sit', t, { seat: 0.5 });
    if (pose === 'type') { Q.L.sh.rotation.x = -1.05; Q.R.sh.rotation.x = -1.05; Q.L.el.rotation.x = -0.55 + Math.sin(t * 9) * 0.05; Q.R.el.rotation.x = -0.55 + Math.sin(t * 8 + 1) * 0.05; Q.L.sh.rotation.z = 0.15; Q.R.sh.rotation.z = -0.15; Q.spine.rotation.x = 0.18; Q.head.rotation.x = 0.06; }
    else if (pose === 'lean') { Q.spine.rotation.x = -0.2; Q.head.rotation.x = -0.1; Q.L.sh.rotation.z = -2.6; Q.R.sh.rotation.z = 2.6; Q.L.el.rotation.x = -2.2; Q.R.el.rotation.x = -2.2; }
    else if (pose === 'eat') { Q.R.sh.rotation.x = -1.2 - 0.35 * (0.5 + 0.5 * Math.sin(t * 3)); Q.R.el.rotation.x = -1.7; Q.L.sh.rotation.x = -0.9; Q.L.el.rotation.x = -1.0; Q.spine.rotation.x = 0.12; }
    else if (pose === 'reach') { Q.R.sh.rotation.x = -1.3; Q.R.el.rotation.x = -0.25; Q.R.sh.rotation.z = -0.25; Q.spine.rotation.x = 0.25; Q.head.rotation.x = 0.25; }
    else if (pose === 'head') { Q.spine.rotation.x = 0.55; Q.head.rotation.x = 0.5; Q.L.sh.rotation.x = -1.2; Q.R.sh.rotation.x = -1.2; Q.L.el.rotation.x = -2.0; Q.R.el.rotation.x = -2.0; Q.L.sh.rotation.z = 0.35; Q.R.sh.rotation.z = -0.35; }
    else if (pose === 'turn') { Q.head.rotation.y = 0.9 * Math.min(1, t / 1.2); Q.spine.rotation.y = 0.35 * Math.min(1, t / 1.2); }
  };
  return P;
}

// a big red reset button on the desk
export function resetButton(c) {
  const g1 = new THREE.CylinderGeometry(0.07, 0.08, 0.04, 20), g2 = new THREE.SphereGeometry(0.055, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2);
  c.own(g1); c.own(g2);
  const base = new THREE.Mesh(g1, M(0x222222, 0.4)); base.position.set(ROOM.x + 0.38, ROOM.y + 0.765, ROOM.z + 0.05);
  const dome = new THREE.Mesh(g2, new THREE.MeshStandardMaterial({ color: 0xd61f1f, roughness: 0.25, emissive: 0x400000 })); dome.position.set(ROOM.x + 0.38, ROOM.y + 0.785, ROOM.z + 0.05);
  c.add(base); c.add(dome);
  return dome;
}
// a cereal bowl with a spoon
export function cereal(c) {
  const m = c.proto('bowl', 0, ROOM.x + 0.22, ROOM.z + 0.12, 0, 0.11, 0, { y: ROOM.y + 0.745 });
  return m;
}
