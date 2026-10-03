// Settlement ground overlay drawn per year on a canvas: roads, plazas, ploughed and
// growing fields, the riverside mud — sampled by the terrain shaders in world space.
import * as THREE from 'three';
import { mulberry32, clamp, smoothstep } from './noise.js';
import { slopeAt, isWater, distToRiver, riverWidth } from './terrain.js';

import { GM, GROUND_UNIFORMS } from './ground_uniforms.js';
export { GM, GROUND_UNIFORMS };
const RES = 2048;

// ---- deterministic network (years when each piece appears)
const R = mulberry32(77);
export const ROADS = [];
export const FIELDS = [];
(function gen() {
  const road = (pts, w, year, kind = 'dirt') => ROADS.push({ pts, w, year, kind });
  // village paths (year 45+)
  road([[-32, 8], [-60, 22], [-76, 30]], 2.2, 45);
  road([[-32, 8], [-10, 0], [8, -6]], 2.2, 60);
  road([[-32, 8], [-28, 40], [-20, 70]], 1.8, 80);
  road([[8, -6], [40, 20], [64, 46]], 2.4, 520);                 // to Kassa's hill
  // town streets (stone era)
  road([[-76, 30], [-40, 18], [8, -6], [60, -30], [140, -70], [230, -110]], 5, 1050, 'stone');   // high street
  road([[8, -6], [10, -80], [16, -170], [30, -260]], 4, 1100, 'stone');
  road([[8, -6], [-30, -60], [-50, -140]], 4, 1150, 'stone');
  road([[8, -6], [60, 20], [64, 46], [98, 78]], 4.5, 1420, 'stone'); // royal road to the castle
  road([[8, -6], [-10, 60], [-14, 140], [-8, 220]], 4, 1200, 'stone');
  road([[60, -30], [120, 20], [180, 60], [240, 80]], 4, 1300, 'stone');
  for (const r0 of [60, 120, 190]) {     // ring streets
    const pts = [];
    for (let k = 0; k <= 48; k++) { const a = k / 48 * Math.PI * 2; pts.push([10 + Math.cos(a) * r0 * 1.1, -10 + Math.sin(a) * r0]); }
    road(pts, 3.5, 1150 + r0 * 3, 'stone');
  }
  // fields: grid of plots aligned with the high street, spreading out over time
  const ang = Math.atan2(-70 + 30, 140 - 60);
  const ca = Math.cos(ang), sa = Math.sin(ang);
  for (let i = -18; i <= 18; i++) for (let j = -16; j <= 16; j++) {
    const u = i * 34, v = j * 26;
    const x = 30 + u * ca - v * sa, z = -60 + u * sa + v * ca;
    const d = Math.hypot(x - 10, z + 10);
    if (d < 120) continue;
    if (Math.hypot(x - 70, z - 55) < 95) continue;                     // the hill (temple, castle)
    if (slopeAt(x, z, 8) > 0.12) continue;
    const [dr, srv] = distToRiver(x, z); if (dr < riverWidth(srv) * 1.6 + 16) continue;
    if (isWater(x, z)) continue;
    const yr = 40 + Math.pow(Math.max(0, d - 60) / 360, 1.3) * 1600 + R() * 160;
    if (yr > 2100) continue;
    FIELDS.push({ x, z, w: 30 + R() * 3, h: 22 + R() * 3, ang: ang + (R() - 0.5) * 0.06, year: yr, crop: Math.floor(R() * 4), phase: R() });
  }
  // the very first field, by the river (year 40)
  FIELDS.push({ x: -44, z: -6, w: 14, h: 10, ang: 0.3, year: 40, crop: 0, phase: 0.2, first: true });
})();

const toPx = (x, z) => [((x - GM.x0) / GM.size) * RES, ((z - GM.z0) / GM.size) * RES];

const CROPS = [['#7f9a3e', '#9bb04a'], ['#c8a24a', '#ddb85a'], ['#6f8a3a', '#86a24a'], ['#8a6a44', '#9b7a50']];

export function drawGroundMap(year, opts = {}) {
  const cv = document.createElement('canvas'); cv.width = cv.height = RES;
  const g = cv.getContext('2d');
  g.clearRect(0, 0, RES, RES);
  const s = RES / GM.size;
  // fields
  for (const f of FIELDS) {
    if (year < f.year) continue;
    const age = year - f.year;
    const [px, pz] = toPx(f.x, f.z);
    g.save(); g.translate(px, pz); g.rotate(f.ang);
    const w = f.w * s, h = f.h * s;
    const season = (f.phase + (opts.season ?? 0.55)) % 1;
    const crop = CROPS[f.crop];
    const ploughed = season < 0.25;
    g.globalAlpha = clamp(age / 3) * 0.95;
    g.fillStyle = ploughed ? '#6b4a2e' : crop[0];
    g.fillRect(-w / 2, -h / 2, w, h);
    // furrows / crop rows
    g.strokeStyle = ploughed ? 'rgba(40,25,12,0.55)' : crop[1];
    g.lineWidth = Math.max(1, 0.55 * s);
    for (let y = -h / 2 + 0.6 * s; y < h / 2; y += 1.4 * s) { g.beginPath(); g.moveTo(-w / 2 + 2, y); g.lineTo(w / 2 - 2, y); g.stroke(); }
    // hedge / border
    g.strokeStyle = 'rgba(70,90,40,0.85)'; g.lineWidth = Math.max(1.5, 0.9 * s);
    g.strokeRect(-w / 2, -h / 2, w, h);
    g.restore();
  }
  g.globalAlpha = 1;
  // Bo's irrigation channel (year 41+): river -> the first field
  if (year >= 41) {
    const a = toPx(-58, -9.5), b = toPx(-51, -6.5);
    g.lineCap = 'round';
    g.strokeStyle = 'rgba(92,70,48,0.95)'; g.lineWidth = 2.2 * s; g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke();
    g.strokeStyle = 'rgba(52,96,112,0.95)'; g.lineWidth = 1.0 * s; g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke();
  }
  // roads
  for (const r of ROADS) {
    if (year < r.year) continue;
    const a = clamp((year - r.year) / 20);
    g.strokeStyle = r.kind === 'stone' ? `rgba(160,150,135,${0.9 * a})` : `rgba(120,95,65,${0.85 * a})`;
    g.lineWidth = r.w * s; g.lineCap = 'round'; g.lineJoin = 'round';
    g.beginPath();
    r.pts.forEach(([x, z], i) => { const [px, pz] = toPx(x, z); i ? g.lineTo(px, pz) : g.moveTo(px, pz); });
    g.stroke();
    g.strokeStyle = r.kind === 'stone' ? `rgba(120,112,100,${0.5 * a})` : `rgba(90,70,48,${0.4 * a})`;
    g.lineWidth = Math.max(1, r.w * s * 0.15);
    g.stroke();
  }
  // plaza / market
  if (year >= 1100) { const [px, pz] = toPx(8, -6); g.fillStyle = 'rgba(170,160,142,0.9)'; g.beginPath(); g.arc(px, pz, 18 * s, 0, Math.PI * 2); g.fill(); }
  if (opts.extra) opts.extra(g, toPx, s);
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 1; tex.generateMipmaps = true;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  return tex;
}

// is (x,z) inside a field that exists in this year? (used to clear trees / keep buildings out)
export function inFieldAt(x, z, year) {
  for (const f of FIELDS) {
    if (year < f.year) continue;
    const dx = x - f.x, dz = z - f.z;
    if (Math.abs(dx) > 40 || Math.abs(dz) > 40) continue;
    const c = Math.cos(-f.ang), sn = Math.sin(-f.ang), u = dx * c - dz * sn, v = dx * sn + dz * c;
    if (Math.abs(u) < f.w / 2 + 2 && Math.abs(v) < f.h / 2 + 2) return true;
  }
  return false;
}
export function nearRoadAt(x, z, year, pad = 3) {
  for (const r of ROADS) {
    if (year < r.year) continue;
    for (let i = 0; i < r.pts.length - 1; i++) {
      const [ax, az] = r.pts[i], [bx, bz] = r.pts[i + 1];
      const dx = bx - ax, dz = bz - az, L2 = dx * dx + dz * dz;
      let t = ((x - ax) * dx + (z - az) * dz) / L2; t = t < 0 ? 0 : t > 1 ? 1 : t;
      if (Math.hypot(x - ax - dx * t, z - az - dz * t) < r.w / 2 + pad) return true;
    }
  }
  return false;
}

