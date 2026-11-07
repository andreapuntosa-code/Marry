// "In this town, you can enter any painting in the museum." -- the sets: the gallery (glossy marble, gold frames,
// hand-brushed paintings), the dark last room with the red curtain, the clock, the black paint hand, and the worlds
// inside the paintings (seascape, cafe at night, sunset lake, the stormy lighthouse).
import { THREE, add, on, glowTex, getScene, rbox, Reflector, W, H, person, lerp, sm } from './kit.js';
import { blk, dust, sparkles, shaft } from './sets.js';

const rnd = (seed) => { let s = seed; return () => ((s = (s * 9301 + 49297) % 233280) / 233280); };
const M_ = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: o.r ?? 0.5, metalness: o.m ?? 0, emissive: o.em ?? 0, emissiveIntensity: o.ei ?? 1, transparent: !!o.t, opacity: o.op ?? 1, side: o.side ?? THREE.FrontSide });
const GOLD = () => new THREE.MeshStandardMaterial({ color: 0xd8a83a, metalness: 0.92, roughness: 0.26 });
const cvs = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
const texOf = (c, rep) => { const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; if (rep) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...rep); } return t; };

// ------------------------------------------------------------------ paintings: a crisp layout, then thousands of brush strokes
const CACHE = {};
function brushify(src, o = {}) {
  const w = src.width, h = src.height, out = cvs(w, h), g = out.getContext('2d');
  g.filter = 'blur(2px)'; g.drawImage(src, 0, 0); g.filter = 'none';
  const d = src.getContext('2d').getImageData(0, 0, w, h).data, r = rnd(o.seed ?? 3), N = o.n ?? Math.floor(w * h / 16);
  g.lineCap = 'round';
  for (let i = 0; i < N; i++) {
    const x = r() * w, y = r() * h, k = (Math.floor(y) * w + Math.floor(x)) * 4, j = (r() - 0.5) * 26;
    const a = Math.sin(x * 0.012 + y * 0.009) * 1.1 + Math.cos(y * 0.02) * 0.5 + (o.angle ?? 0) + (r() - 0.5) * 0.7;
    const L = (o.len ?? 9) * (0.6 + r() * 0.9), cx = Math.cos(a) * L / 2, cy = Math.sin(a) * L / 2;
    g.strokeStyle = `rgba(${d[k] + j | 0},${d[k + 1] + j | 0},${d[k + 2] + j | 0},0.85)`; g.lineWidth = (o.bw ?? 3) * (0.6 + r() * 0.8);
    g.beginPath(); g.moveTo(x - cx, y - cy); g.lineTo(x + cx, y + cy); g.stroke();
  }
  // old varnish: a warm tint, darker edges, fine craquelure
  g.globalCompositeOperation = 'multiply'; g.fillStyle = o.tint ?? 'rgba(255,236,200,1)'; g.fillRect(0, 0, w, h);
  const vg = g.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.3, w / 2, h / 2, Math.max(w, h) * 0.75); vg.addColorStop(0, 'rgba(255,255,255,1)'); vg.addColorStop(1, 'rgba(150,120,90,1)'); g.fillStyle = vg; g.fillRect(0, 0, w, h);
  g.globalCompositeOperation = 'source-over'; g.strokeStyle = 'rgba(40,25,10,0.12)'; g.lineWidth = 0.8;
  for (let i = 0; i < 160; i++) { let x = r() * w, y = r() * h; g.beginPath(); g.moveTo(x, y); for (let s = 0; s < 6; s++) { x += (r() - 0.5) * 30; y += (r() - 0.5) * 30; g.lineTo(x, y); } g.stroke(); }
  return out;
}
const blob = (g, x, y, rx, ry, c, rot = 0) => { g.fillStyle = c; g.beginPath(); g.ellipse(x, y, rx, ry, rot, 0, 6.283); g.fill(); };
const grad = (g, x0, y0, x1, y1, stops) => { const gr = g.createLinearGradient(x0, y0, x1, y1); stops.forEach(([p, c]) => gr.addColorStop(p, c)); return gr; };
// a little blocky person in a painting (the town's people are blocky too)
function figure(g, x, y, s, shirt, o = {}) {
  g.fillStyle = o.pants ?? '#2a2a3a'; g.fillRect(x - 0.45 * s, y - 1.0 * s, 0.4 * s, 1.0 * s); g.fillRect(x + 0.05 * s, y - 1.0 * s, 0.4 * s, 1.0 * s);
  g.fillStyle = shirt; g.fillRect(x - 0.5 * s, y - 2.0 * s, 1.0 * s, 1.0 * s);
  if (o.arms === 'up') { g.fillRect(x - 0.95 * s, y - 2.9 * s, 0.4 * s, 1.0 * s); g.fillRect(x + 0.55 * s, y - 2.9 * s, 0.4 * s, 1.0 * s); }
  else { g.fillRect(x - 0.95 * s, y - 2.0 * s, 0.4 * s, 0.9 * s); g.fillRect(x + 0.55 * s, y - 2.0 * s, 0.4 * s, 0.9 * s); }
  blob(g, x, y - 2.45 * s, 0.36 * s, 0.42 * s, o.skin ?? '#f2c79a'); if (o.hair) { g.fillStyle = o.hair; g.fillRect(x - 0.38 * s, y - 2.92 * s, 0.76 * s, 0.22 * s); }
}
const LAYOUT = {
  sea(g, w, h) {
    g.fillStyle = grad(g, 0, 0, 0, h * 0.5, [[0, '#6aaee8'], [1, '#f6e6c6']]); g.fillRect(0, 0, w, h * 0.5);
    blob(g, w * 0.78, h * 0.16, 34, 34, '#fff4c0'); for (let i = 0; i < 6; i++) blob(g, w * (0.1 + i * 0.16), h * (0.12 + (i % 2) * 0.08), 70, 22, 'rgba(255,255,255,0.85)');
    g.fillStyle = grad(g, 0, h * 0.46, 0, h * 0.82, [[0, '#2a6aa8'], [1, '#5ab8d8']]); g.fillRect(0, h * 0.46, w, h * 0.38);
    const r = rnd(4); g.strokeStyle = '#f4fbff'; g.lineWidth = 4; for (let i = 0; i < 70; i++) { const x = r() * w, y = h * (0.5 + r() * 0.3); g.beginPath(); g.arc(x, y, 12 + r() * 14, 3.5, 5.9); g.stroke(); }
    g.fillStyle = grad(g, 0, h * 0.8, 0, h, [[0, '#f0d898'], [1, '#d8b070']]); g.beginPath(); g.moveTo(0, h * 0.84); g.quadraticCurveTo(w * 0.5, h * 0.78, w, h * 0.86); g.lineTo(w, h); g.lineTo(0, h); g.fill();
    for (const [x, y, sh] of [[0.22, 0.62, '#e84a3a'], [0.36, 0.66, '#f5c84a'], [0.5, 0.6, '#3a8ad6'], [0.64, 0.67, '#3aa655'], [0.75, 0.62, '#f28c28']]) { blob(g, w * x, h * y + 6, 24, 8, '#ffffff'); figure(g, w * x, h * y + 20, 12, sh, { arms: 'up', hair: '#3a2414' }); g.fillStyle = '#3a8ac0'; g.fillRect(w * x - 18, h * y, 36, 30); }
    g.fillStyle = '#ffffff'; g.beginPath(); g.moveTo(w * 0.12, h * 0.46); g.lineTo(w * 0.15, h * 0.36); g.lineTo(w * 0.17, h * 0.46); g.fill();
    g.fillStyle = '#d23a3a'; g.beginPath(); g.moveTo(w * 0.8, h * 0.8); g.arc(w * 0.85, h * 0.8, 50, 3.14, 6.28); g.fill(); g.fillRect(w * 0.85 - 2, h * 0.8, 4, 60);
  },
  cafe(g, w, h) {
    g.fillStyle = grad(g, 0, 0, 0, h * 0.5, [[0, '#0e1a4a'], [1, '#26408a']]); g.fillRect(0, 0, w, h);
    const r = rnd(9); for (let i = 0; i < 16; i++) { const x = w * (0.45 + r() * 0.55), y = h * r() * 0.35; blob(g, x, y, 16, 16, 'rgba(255,230,120,0.35)'); blob(g, x, y, 7, 7, '#fff2a0'); }
    g.fillStyle = '#e8a830'; g.fillRect(0, 0, w * 0.48, h * 0.62); g.fillStyle = '#f4c648'; g.beginPath(); g.moveTo(0, h * 0.08); g.lineTo(w * 0.56, h * 0.16); g.lineTo(w * 0.56, h * 0.26); g.lineTo(0, h * 0.24); g.fill();
    g.fillStyle = '#2a3a6a'; g.fillRect(w * 0.6, h * 0.1, w * 0.4, h * 0.55); for (let i = 0; i < 6; i++) { g.fillStyle = '#ffd870'; g.fillRect(w * (0.64 + (i % 3) * 0.12), h * (0.2 + Math.floor(i / 3) * 0.18), w * 0.06, h * 0.09); }
    g.fillStyle = grad(g, 0, h * 0.6, 0, h, [[0, '#c87a3a'], [1, '#7a4a2a']]); g.fillRect(0, h * 0.6, w, h * 0.4);
    for (let i = 0; i < 90; i++) blob(g, r() * w, h * (0.62 + r() * 0.38), 10, 5, 'rgba(255,220,160,0.25)');
    for (const [x, y] of [[0.16, 0.74], [0.38, 0.8], [0.6, 0.76]]) { blob(g, w * x, h * y, 40, 12, '#f0ead8'); g.fillStyle = '#3a2a1a'; g.fillRect(w * x - 3, h * y, 6, 40); figure(g, w * x - 50, h * y + 40, 13, '#3a4a8a'); figure(g, w * x + 50, h * y + 40, 13, '#8a2a3a', { hair: '#5a3a1e' }); }
    for (let i = 0; i < 9; i++) blob(g, w * (0.04 + i * 0.065), h * (0.27 + Math.sin(i) * 0.01), 6, 6, '#fff6c0');
  },
  lake(g, w, h) {
    g.fillStyle = grad(g, 0, 0, 0, h * 0.55, [[0, '#5a4a90'], [0.55, '#f08a58'], [1, '#f8d898']]); g.fillRect(0, 0, w, h * 0.55);
    blob(g, w * 0.5, h * 0.48, 46, 46, '#fff0b0');
    g.fillStyle = '#4a3a6a'; g.beginPath(); g.moveTo(0, h * 0.55); for (let i = 0; i <= 8; i++) g.lineTo(w * i / 8, h * (0.55 - (i % 2 ? 0.2 : 0.07) - Math.sin(i * 2.1) * 0.04)); g.lineTo(w, h * 0.55); g.fill();
    g.fillStyle = grad(g, 0, h * 0.55, 0, h, [[0, '#f8c888'], [0.5, '#c87058'], [1, '#3a3060']]); g.fillRect(0, h * 0.55, w, h * 0.45);
    const r = rnd(5); for (let i = 0; i < 80; i++) { g.fillStyle = `rgba(255,240,200,${0.2 + r() * 0.3})`; g.fillRect(w * (0.35 + r() * 0.3), h * (0.57 + r() * 0.35), 30 + r() * 40, 3); }
    g.fillStyle = '#1a1420'; g.beginPath(); g.moveTo(w * 0.3, h * 0.74); g.lineTo(w * 0.5, h * 0.74); g.lineTo(w * 0.47, h * 0.78); g.lineTo(w * 0.33, h * 0.78); g.fill();
    figure(g, w * 0.4, h * 0.745, 10, '#1a1420', { skin: '#1a1420', pants: '#1a1420' }); g.strokeStyle = '#1a1420'; g.lineWidth = 2; g.beginPath(); g.moveTo(w * 0.42, h * 0.7); g.lineTo(w * 0.62, h * 0.6); g.lineTo(w * 0.62, h * 0.76); g.stroke();
    g.fillStyle = '#2a2030'; for (let i = 0; i < 14; i++) { const x = (i < 7 ? 0.02 : 0.82) * w + (i % 7) * 18; g.beginPath(); g.moveTo(x, h * 0.58); g.lineTo(x + 10, h * 0.46); g.lineTo(x + 20, h * 0.58); g.fill(); }
  },
  lighthouse(g, w, h) {
    g.fillStyle = grad(g, 0, 0, 0, h * 0.6, [[0, '#1a2228'], [1, '#56665e']]); g.fillRect(0, 0, w, h);
    const r = rnd(7); for (let i = 0; i < 40; i++) blob(g, r() * w, r() * h * 0.45, 60 + r() * 90, 25 + r() * 30, `rgba(${20 + r() * 30 | 0},${28 + r() * 30 | 0},${32 + r() * 30 | 0},0.7)`, r());
    g.strokeStyle = '#eef6ff'; g.lineWidth = 4; g.beginPath(); let x = w * 0.2, y = 0; g.moveTo(x, y); for (let i = 0; i < 7; i++) { x += (r() - 0.5) * 50; y += h * 0.06; g.lineTo(x, y); } g.stroke();
    g.fillStyle = 'rgba(255,240,170,0.25)'; g.beginPath(); g.moveTo(w * 0.72, h * 0.3); g.lineTo(0, h * 0.12); g.lineTo(0, h * 0.34); g.fill();
    g.fillStyle = '#1a3040'; g.fillRect(0, h * 0.55, w, h * 0.45);
    for (let i = 0; i < 26; i++) { const wx = r() * w, wy = h * (0.55 + r() * 0.38), s = 40 + r() * 70; g.fillStyle = '#2a5058'; g.beginPath(); g.moveTo(wx - s, wy + s * 0.3); g.quadraticCurveTo(wx, wy - s * 0.7, wx + s, wy + s * 0.3); g.fill(); g.strokeStyle = '#dff0e8'; g.lineWidth = 5; g.beginPath(); g.moveTo(wx - s * 0.6, wy - s * 0.05); g.quadraticCurveTo(wx, wy - s * 0.5, wx + s * 0.4, wy - s * 0.1); g.stroke(); }
    g.fillStyle = '#1e1a18'; g.beginPath(); g.moveTo(w * 0.55, h); g.lineTo(w * 0.6, h * 0.62); g.lineTo(w * 0.75, h * 0.55); g.lineTo(w * 0.92, h * 0.6); g.lineTo(w, h * 0.7); g.lineTo(w, h); g.fill();
    const lx = w * 0.72; g.fillStyle = '#ecebe2'; g.beginPath(); g.moveTo(lx - 34, h * 0.58); g.lineTo(lx - 22, h * 0.32); g.lineTo(lx + 22, h * 0.32); g.lineTo(lx + 34, h * 0.58); g.fill();
    g.fillStyle = '#b8282a'; for (const yy of [0.37, 0.46, 0.54]) g.fillRect(lx - 30, h * yy, 60, h * 0.035);
    g.fillStyle = '#2a2a2a'; g.fillRect(lx - 30, h * 0.315, 60, 6); blob(g, lx, h * 0.29, 18, 14, '#ffe48a'); g.fillStyle = '#8a1a1a'; g.beginPath(); g.moveTo(lx - 20, h * 0.275); g.lineTo(lx, h * 0.24); g.lineTo(lx + 20, h * 0.275); g.fill();
    g.strokeStyle = 'rgba(220,230,240,0.25)'; g.lineWidth = 1.5; for (let i = 0; i < 260; i++) { const xx = r() * w, yy = r() * h; g.beginPath(); g.moveTo(xx, yy); g.lineTo(xx - 6, yy + 22); g.stroke(); }
  },
  portraitLady(g, w, h) {
    g.fillStyle = grad(g, 0, 0, w, h, [[0, '#2a3a2a'], [1, '#141a14']]); g.fillRect(0, 0, w, h);
    g.fillStyle = '#5a2a6a'; g.beginPath(); g.moveTo(w * 0.12, h); g.lineTo(w * 0.22, h * 0.62); g.lineTo(w * 0.78, h * 0.62); g.lineTo(w * 0.88, h); g.fill();
    blob(g, w * 0.5, h * 0.42, w * 0.2, h * 0.17, '#f0c8a0'); g.fillStyle = '#3a2414'; g.fillRect(w * 0.29, h * 0.24, w * 0.42, h * 0.08); blob(g, w * 0.5, h * 0.2, w * 0.12, h * 0.07, '#3a2414');
    blob(g, w * 0.43, h * 0.41, 9, 13, '#1b1b1f'); blob(g, w * 0.57, h * 0.41, 9, 13, '#1b1b1f'); g.strokeStyle = '#1b1b1f'; g.lineWidth = 5; g.beginPath(); g.arc(w * 0.5, h * 0.45, 26, 0.4, 2.7); g.stroke();
    for (let i = 0; i < 9; i++) blob(g, w * (0.38 + i * 0.03), h * (0.63 + Math.sin(i / 8 * 3.14) * 0.03), 6, 6, '#f8f4ec');
  },
  portraitMan(g, w, h) {
    g.fillStyle = grad(g, 0, 0, w, h, [[0, '#6a1a1a'], [1, '#2a0a0a']]); g.fillRect(0, 0, w, h);
    g.fillStyle = '#1a1a24'; g.beginPath(); g.moveTo(w * 0.1, h); g.lineTo(w * 0.2, h * 0.62); g.lineTo(w * 0.8, h * 0.62); g.lineTo(w * 0.9, h); g.fill(); g.fillStyle = '#f0ece4'; g.beginPath(); g.moveTo(w * 0.42, h * 0.62); g.lineTo(w * 0.5, h * 0.8); g.lineTo(w * 0.58, h * 0.62); g.fill();
    blob(g, w * 0.5, h * 0.42, w * 0.2, h * 0.17, '#e8c098'); g.fillStyle = '#d8d8d8'; g.fillRect(w * 0.29, h * 0.26, w * 0.42, h * 0.06);
    blob(g, w * 0.43, h * 0.4, 8, 11, '#1b1b1f'); blob(g, w * 0.57, h * 0.4, 8, 11, '#1b1b1f'); g.fillStyle = '#d8d8d8'; g.beginPath(); g.ellipse(w * 0.5, h * 0.47, 40, 10, 0, 3.14, 6.28); g.fill();
  },
  flowers(g, w, h) {
    g.fillStyle = grad(g, 0, 0, 0, h, [[0, '#d8b860'], [1, '#a8883a']]); g.fillRect(0, 0, w, h); g.fillStyle = '#8a5a2a'; g.fillRect(0, h * 0.72, w, h * 0.28);
    g.fillStyle = '#3a6a8a'; g.beginPath(); g.moveTo(w * 0.38, h * 0.74); g.quadraticCurveTo(w * 0.3, h * 0.55, w * 0.44, h * 0.5); g.lineTo(w * 0.56, h * 0.5); g.quadraticCurveTo(w * 0.7, h * 0.55, w * 0.62, h * 0.74); g.fill();
    const r = rnd(3); for (let i = 0; i < 11; i++) { const x = w * (0.22 + r() * 0.56), y = h * (0.12 + r() * 0.3); g.strokeStyle = '#3a6a2a'; g.lineWidth = 5; g.beginPath(); g.moveTo(w * 0.5, h * 0.52); g.lineTo(x, y); g.stroke(); for (let p = 0; p < 12; p++) blob(g, x + Math.cos(p / 12 * 6.28) * 22, y + Math.sin(p / 12 * 6.28) * 22, 14, 6, '#f8c020', p / 12 * 6.28); blob(g, x, y, 13, 13, '#6a3a1a'); }
  },
  mountain(g, w, h) {
    g.fillStyle = grad(g, 0, 0, 0, h * 0.5, [[0, '#7ab0e0'], [1, '#e8f0f0']]); g.fillRect(0, 0, w, h);
    for (const [x, s, c] of [[0.25, 0.45, '#6a7a9a'], [0.6, 0.55, '#5a6a8a'], [0.9, 0.4, '#7a8aa8']]) { g.fillStyle = c; g.beginPath(); g.moveTo(w * (x - s * 0.6), h * 0.62); g.lineTo(w * x, h * (0.62 - s * 0.9)); g.lineTo(w * (x + s * 0.6), h * 0.62); g.fill(); g.fillStyle = '#f8fbff'; g.beginPath(); g.moveTo(w * (x - s * 0.15), h * (0.62 - s * 0.68)); g.lineTo(w * x, h * (0.62 - s * 0.9)); g.lineTo(w * (x + s * 0.15), h * (0.62 - s * 0.68)); g.fill(); }
    g.fillStyle = grad(g, 0, h * 0.6, 0, h, [[0, '#6aa848'], [1, '#3a7a2a']]); g.fillRect(0, h * 0.6, w, h * 0.4);
    g.fillStyle = '#e8dcc0'; g.fillRect(w * 0.62, h * 0.7, 60, 40); g.fillStyle = '#8a2a2a'; g.beginPath(); g.moveTo(w * 0.62 - 8, h * 0.7); g.lineTo(w * 0.62 + 30, h * 0.64); g.lineTo(w * 0.62 + 68, h * 0.7); g.fill();
  },
  garden(g, w, h) {
    g.fillStyle = grad(g, 0, 0, 0, h * 0.4, [[0, '#a8d0f0'], [1, '#f0f0e0']]); g.fillRect(0, 0, w, h);
    for (let i = 0; i < 4; i++) { g.fillStyle = ['#7ab858', '#5a9a40', '#4a8a38', '#3a7a2a'][i]; g.beginPath(); g.moveTo(0, h * (0.42 + i * 0.12)); g.quadraticCurveTo(w * 0.5, h * (0.3 + i * 0.13), w, h * (0.45 + i * 0.12)); g.lineTo(w, h); g.lineTo(0, h); g.fill(); }
    g.fillStyle = '#e8d8a8'; g.beginPath(); g.moveTo(w * 0.45, h); g.quadraticCurveTo(w * 0.55, h * 0.7, w * 0.5, h * 0.48); g.lineTo(w * 0.52, h * 0.48); g.quadraticCurveTo(w * 0.62, h * 0.7, w * 0.65, h); g.fill();
    const r = rnd(8); for (let i = 0; i < 120; i++) blob(g, r() * w, h * (0.6 + r() * 0.4), 5, 5, ['#f04a6a', '#f8e048', '#ffffff', '#c870f0'][i % 4]);
    for (const x of [0.15, 0.82]) { g.fillStyle = '#5a3a1a'; g.fillRect(w * x - 6, h * 0.36, 12, 60); blob(g, w * x, h * 0.32, 50, 44, '#2a6a2a'); }
  },
  city(g, w, h) {
    g.fillStyle = grad(g, 0, 0, 0, h, [[0, '#101830'], [1, '#3a3a6a']]); g.fillRect(0, 0, w, h); blob(g, w * 0.8, h * 0.18, 30, 30, '#f8f0c8');
    const r = rnd(12); for (let i = 0; i < 12; i++) { const x = i * w / 11 - 10, bw = 60 + r() * 40, bh = h * (0.3 + r() * 0.4); g.fillStyle = ['#1a2040', '#24284a', '#2a2a4a'][i % 3]; g.fillRect(x, h - bh, bw, bh); for (let k = 0; k < 14; k++) if (r() < 0.5) { g.fillStyle = '#ffd870'; g.fillRect(x + 8 + (k % 3) * 18, h - bh + 14 + Math.floor(k / 3) * 26, 9, 12); } }
  },
  trapped(g, w, h) {
    g.fillStyle = grad(g, 0, 0, 0, h, [[0, '#1a1614'], [1, '#2a221c']]); g.fillRect(0, 0, w, h);
    const vg = g.createRadialGradient(w / 2, h * 0.45, 10, w / 2, h * 0.45, w * 0.55); vg.addColorStop(0, 'rgba(200,180,140,0.35)'); vg.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = vg; g.fillRect(0, 0, w, h);
    g.fillStyle = '#3a4a6a'; g.fillRect(w * 0.32, h * 0.52, w * 0.36, h * 0.48); blob(g, w * 0.5, h * 0.4, w * 0.15, h * 0.11, '#d8b898');
    blob(g, w * 0.44, h * 0.39, 9, 14, '#0b0b0f'); blob(g, w * 0.56, h * 0.39, 9, 14, '#0b0b0f'); blob(g, w * 0.5, h * 0.46, 10, 14, '#0b0b0f');
    for (const s of [-1, 1]) { g.strokeStyle = '#3a4a6a'; g.lineWidth = 30; g.beginPath(); g.moveTo(w * (0.5 + s * 0.15), h * 0.56); g.lineTo(w * (0.5 + s * 0.33), h * 0.3); g.stroke(); const hx = w * (0.5 + s * 0.34), hy = h * 0.22; blob(g, hx, hy, 26, 32, '#e8c8a8'); g.fillStyle = '#e8c8a8'; for (let f = 0; f < 4; f++) g.fillRect(hx - 22 + f * 12, hy - 62, 9, 34); g.fillRect(hx - s * 30 - 5, hy - 10, 14, 26); }
  },
};
export function paintingCanvas(kind, w = 512, h = 384, n) {
  const key = kind + w + 'x' + h + (n || ''); if (CACHE[key]) return CACHE[key];
  const c = cvs(w, h), g = c.getContext('2d'), k = w / 512; g.scale(k, k); LAYOUT[kind](g, 512, h / k);
  const big = w > 700; return (CACHE[key] = brushify(c, { seed: kind.length * 7 + w, n: n ?? (big ? 90000 : undefined), len: big ? 18 : 9, bw: big ? 6 : 3 }));
}
export const paintingTex = (kind, w, h) => texOf(paintingCanvas(kind, w, h));

// a gold frame with a canvas; returns the group (local +z faces the room) and the canvas mesh
export function framed(kind, fw, fh, o = {}) {
  const g = new THREE.Group(), gold = GOLD(), dark = new THREE.MeshStandardMaterial({ color: 0x8a6420, metalness: 0.85, roughness: 0.4 });
  const big = Math.max(fw, fh) > 3.6, tw = o.texW ?? (big ? 1600 : 512), th = Math.round(tw * fh / fw);
  const canvasMat = new THREE.MeshStandardMaterial({ map: o.map || paintingTex(kind, tw, th), roughness: 0.55, emissive: 0xffffff, emissiveMap: null, emissiveIntensity: 0 });
  const cv = new THREE.Mesh(new THREE.PlaneGeometry(fw, fh, o.seg ?? 1, o.seg ?? 1), canvasMat); cv.position.z = 0.06; cv.receiveShadow = true; g.add(cv);
  const b = 0.22, d = 0.16;
  for (const [w, h, x, y] of [[fw + 2 * b, b, 0, fh / 2 + b / 2], [fw + 2 * b, b, 0, -fh / 2 - b / 2], [b, fh, -fw / 2 - b / 2, 0], [b, fh, fw / 2 + b / 2, 0]]) {
    const m = new THREE.Mesh(rbox(w, h, d, 0.3), gold); m.position.set(x, y, 0.08); m.castShadow = true; g.add(m);
    const m2 = new THREE.Mesh(rbox(w > h ? w - b * 0.9 : b * 0.35, w > h ? b * 0.35 : h - b * 0.9, d * 0.6, 0.4), dark); m2.position.set(x * (w > h ? 1 : 0.84), y * (w > h ? 0.84 : 1) + (w > h ? 0 : 0), 0.16); if (w > h) m2.position.y = y > 0 ? fh / 2 + b * 0.18 : -fh / 2 - b * 0.18; else m2.position.x = x > 0 ? fw / 2 + b * 0.18 : -fw / 2 - b * 0.18; g.add(m2);
  }
  for (const [x, y] of [[-1, 1], [1, 1], [-1, -1], [1, -1]]) { const k = new THREE.Mesh(new THREE.SphereGeometry(b * 0.45, 12, 10), gold); k.position.set(x * (fw / 2 + b / 2), y * (fh / 2 + b / 2), 0.17); g.add(k); }
  if (o.plate !== false) { const p = new THREE.Mesh(rbox(0.5, 0.14, 0.03, 0.3), gold); p.position.set(0, -fh / 2 - b - 0.22, 0.02); g.add(p); }
  if (o.lamp !== false) { const l = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, Math.min(1.4, fw * 0.45), 10), gold); l.rotation.z = Math.PI / 2; l.position.set(0, fh / 2 + b + 0.32, 0.4); g.add(l);
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.45, 6), gold); arm.rotation.x = Math.PI / 2 - 0.5; arm.position.set(0, fh / 2 + b + 0.2, 0.2); g.add(arm);
    const glow = new THREE.Mesh(new THREE.PlaneGeometry(Math.min(1.3, fw * 0.42), 0.04), new THREE.MeshBasicMaterial({ color: 0xfff0c8 })); glow.rotation.x = Math.PI / 2; glow.position.set(0, fh / 2 + b + 0.27, 0.4); g.add(glow); }
  return { g, cv, canvasMat };
}

// ------------------------------------------------------------------ the gallery
// layout: main hall x in [-8, 8], z from 6 to -40, ceiling 9; an arch in the end wall (z = -40) leads to the last room
// (x in [-6, 6], z from -40 to -54) with the curtained painting on its back wall. The big clock hangs above the arch.
export const HANG = [
  ['portraitLady', -1, -2, 2.2, 2.9], ['sea', -1, -8, 3.4, 2.5], ['cafe', -1, -14, 3.2, 2.4], ['flowers', -1, -20, 2.4, 2.9], ['lake', -1, -26, 3.4, 2.4], ['city', -1, -32, 3.2, 2.3],
  ['mountain', 1, -2, 3.2, 2.3], ['lighthouse', 1, -8, 4.0, 3.0], ['portraitMan', 1, -14, 2.2, 2.9], ['trapped', 1, -20, 2.4, 3.0], ['garden', 1, -26, 3.4, 2.4],
];
export const paintPos = (kind) => { const h = HANG.find(p => p[0] === kind); return { x: h[1] * 7.92, y: kind === 'lighthouse' ? 3.0 : 3.4, z: h[2], side: h[1], w: h[3], h: h[4] }; };
function marbleTex() {
  const c = cvs(512, 512), g = c.getContext('2d'), r = rnd(17);
  for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) { g.fillStyle = (i + j) % 2 ? '#cfc4ae' : '#b8ab94'; g.fillRect(i * 256, j * 256, 256, 256); }
  g.strokeStyle = 'rgba(120,110,100,0.25)'; g.lineWidth = 1.5; for (let k = 0; k < 40; k++) { let x = r() * 512, y = r() * 512; g.beginPath(); g.moveTo(x, y); for (let s = 0; s < 10; s++) { x += 20 + r() * 20; y += (r() - 0.5) * 40; g.lineTo(x, y); } g.stroke(); }
  g.fillStyle = '#5a4a3a'; g.fillRect(0, 0, 512, 3); g.fillRect(0, 0, 3, 512); g.fillRect(0, 254, 512, 3); g.fillRect(254, 0, 3, 512);
  return texOf(c);
}
export function museum(o = {}) {
  const S = getScene(), night = !!o.night, eve = !!o.evening;
  S.background = new THREE.Color(night ? 0x05060c : 0x1a1410); S.fog = new THREE.Fog(night ? 0x080a14 : 0x3a2c20, night ? 10 : 24, night ? 60 : 110);
  S.userData.hemi.color.set(night ? 0x6a7ab0 : eve ? 0xffd2a0 : 0xfff0dc); S.userData.hemi.groundColor.set(night ? 0x101018 : 0x5a4030); S.userData.hemi.intensity = night ? 0.12 : eve ? 0.55 : 0.75;
  const sun = S.userData.sun; sun.intensity = night ? 0.35 : eve ? 1.2 : 1.7; sun.color.set(night ? 0x8090c8 : eve ? 0xffb070 : 0xfff2dc);
  sun.position.set(o.sunX ?? 3, 30, -14); sun.target.position.set(0, 0, -16); const sc = sun.shadow.camera; sc.left = -30; sc.right = 30; sc.top = 30; sc.bottom = -30; sc.near = 1; sc.far = 60; sc.updateProjectionMatrix();
  const L0 = 6, L1 = -40, Lc = (L0 + L1) / 2, LL = L0 - L1, HH = 9;
  glossyFloorM(16, LL, 0, Lc, night);
  const wallC = o.wall ?? 0x1e4a50, wm = M_(wallC, { r: 0.9 }), cream = M_(0xefe6d2, { r: 0.6 }), wood = M_(0x5a3420, { r: 0.55 });
  for (const s of [-1, 1]) {
    blk(0.5, HH, LL, wm, s * 8.25, HH / 2, Lc, { k: 0.01 });
    blk(0.14, 1.2, LL, cream, s * 7.98, 0.6, Lc, { k: 0.2, cast: false }); blk(0.2, 0.12, LL, cream, s * 7.95, 1.25, Lc, { k: 0.3, cast: false });
    blk(0.3, 0.4, LL, cream, s * 7.9, HH - 0.2, Lc, { k: 0.2, cast: false }); blk(0.12, 0.08, LL, GOLD(), s * 7.92, 5.9, Lc, { cast: false });
    for (let z = -5; z > L1; z -= 6) blk(0.4, HH, 0.5, cream, s * 7.85, HH / 2, z, { k: 0.08 });
  }
  // the end wall with the arch, the front wall
  const ew = M_(wallC, { r: 0.9 });
  blk(4.6, HH, 0.6, ew, -5.8, HH / 2, L1, { k: 0.01 }); blk(4.6, HH, 0.6, ew, 5.8, HH / 2, L1, { k: 0.01 }); blk(7.2, HH - 6, 0.6, ew, 0, 6 + (HH - 6) / 2, L1, { k: 0.01 });
  for (const s of [-1, 1]) blk(0.4, 6.2, 0.8, cream, s * 3.6, 3.1, L1 + 0.05); blk(7.6, 0.5, 0.8, cream, 0, 6.2, L1 + 0.05);
  blk(16.5, HH, 0.6, wm, 0, HH / 2, L0, { k: 0.01 });
  // ceiling: coffers and a long skylight
  const ceil = M_(0xe8e0d0, { r: 0.8 }); blk(4.6, 0.4, LL, ceil, -5.8, HH + 0.2, Lc, { cast: false, k: 0.02 }); blk(4.6, 0.4, LL, ceil, 5.8, HH + 0.2, Lc, { cast: false, k: 0.02 });
  const sky = new THREE.Mesh(new THREE.PlaneGeometry(7, LL), new THREE.MeshBasicMaterial({ color: night ? 0x1a2448 : eve ? 0xd8a070 : 0xc8ccd8, fog: false })); sky.rotation.x = Math.PI / 2; sky.position.set(0, HH + 0.6, Lc); add(sky);
  for (let z = L0; z > L1; z -= 3) blk(7.4, 0.3, 0.25, M_(0x3a3028), 0, HH + 0.45, z, { cast: false });
  if (!night) for (let z = -2; z > L1; z -= 8) shaft(0, HH / 2, z, 6, HH + 2, 0, { opacity: eve ? 0.06 : 0.05, color: eve ? 0xffd0a0 : 0xfff4e0 });
  // paintings
  const P = {};
  for (const [kind, side, z, fw, fh] of HANG) {
    if (o.hide === kind) continue;
    const f = framed(kind, fw, fh); const pp = paintPos(kind); f.g.position.set(side * 7.98, pp.y, z); f.g.rotation.y = -side * Math.PI / 2; add(f.g); P[kind] = f;
  }
  // picture lights (the hero paintings only)
  if (!night) for (const k of (o.lit ?? ['lighthouse', 'sea'])) { const pp = paintPos(k); const sp = new THREE.SpotLight(0xffe8c8, eve ? 30 : 22, 9, 0.55, 0.6, 1.4); sp.position.set(pp.side * 6.4, 7.2, pp.z); sp.target.position.set(pp.side * 7.9, pp.y, pp.z); add(sp); add(sp.target); }
  // benches, a bust on a plinth, rope stanchions
  for (const z of [-11, -23]) { blk(4.2, 0.22, 1.1, wood, 0, 0.75, z); for (const s of [-1, 1]) blk(0.18, 0.7, 0.9, M_(0x1a1a1a, { m: 0.6, r: 0.3 }), s * 1.8, 0.35, z); }
  const marble = M_(0xf2eee6, { r: 0.35 }); blk(1.0, 1.6, 1.0, marble, 6.4, 0.8, -33); const hd = new THREE.Mesh(new THREE.SphereGeometry(0.34, 24, 18), marble); hd.position.set(6.4, 2.45, -33); hd.castShadow = true; add(hd); blk(0.9, 0.5, 0.45, marble, 6.4, 1.85, -33);
  // the clock above the arch
  P.clock = clock(0, 7.55, L1 + 0.42, o.time ?? (() => 17 * 60 + 20), { night });
  // the last room
  lastRoom(o);
  if (night) { for (const s of [-1, 1]) { const e = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.3), new THREE.MeshBasicMaterial({ color: 0x2aff8a })); e.position.set(s * 5.6, 6.9, L1 + 0.32); add(e); } }
  if (o.dust !== false) dust(o.dustN ?? 420, 0, 4.5, -16, 14, 8, 40, { color: night ? 0x9ab0ff : 0xffe8c0, size: 0.06, opacity: night ? 0.35 : 0.7, seed: 21 });
  return P;
}
function glossyFloorM(w, d, x, z, night) {
  const mir = new Reflector(new THREE.PlaneGeometry(w, d), { textureWidth: W / 2, textureHeight: H / 2, color: night ? 0x505058 : 0x7a7a7a }); mir.rotation.x = -Math.PI / 2; mir.position.set(x, 0, z); add(mir);
  const t = marbleTex(); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(w / 3, d / 3);
  const f = new THREE.Mesh(new THREE.PlaneGeometry(w, d), new THREE.MeshStandardMaterial({ map: t, roughness: 0.12, transparent: true, opacity: 0.8 })); f.rotation.x = -Math.PI / 2; f.position.set(x, 0.01, z); f.receiveShadow = true; add(f);
}
// a big museum clock; time(u, d) -> minutes after midnight
export function clock(x, y, z, time, o = {}) {
  const g = new THREE.Group(); g.position.set(x, y, z); add(g); const gold = GOLD();
  const c = cvs(512, 512), q = c.getContext('2d'); q.fillStyle = '#f6efdc'; q.beginPath(); q.arc(256, 256, 250, 0, 6.283); q.fill();
  q.fillStyle = '#1a1612'; q.font = '54px serif'; q.textAlign = 'center'; q.textBaseline = 'middle';
  ['XII', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI'].forEach((s, i) => { const a = i / 12 * 6.283; q.fillText(s, 256 + Math.sin(a) * 195, 256 - Math.cos(a) * 195); });
  for (let i = 0; i < 60; i++) { const a = i / 60 * 6.283, r0 = i % 5 ? 232 : 222; q.lineWidth = i % 5 ? 2 : 5; q.strokeStyle = '#1a1612'; q.beginPath(); q.moveTo(256 + Math.sin(a) * r0, 256 - Math.cos(a) * r0); q.lineTo(256 + Math.sin(a) * 244, 256 - Math.cos(a) * 244); q.stroke(); }
  const face = new THREE.Mesh(new THREE.CircleGeometry(1.15, 64), new THREE.MeshStandardMaterial({ map: texOf(c), roughness: 0.4, emissive: o.night ? 0x332a18 : 0x000000, emissiveMap: o.night ? texOf(c) : null })); face.position.z = 0.085; g.add(face);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(1.2, 0.1, 16, 64), gold); rim.position.z = 0.1; g.add(rim);
  const back = new THREE.Mesh(new THREE.CylinderGeometry(1.25, 1.25, 0.12, 48), M_(0x3a2414)); back.rotation.x = Math.PI / 2; g.add(back);
  const hand = (len, wd, c2) => { const p = new THREE.Group(); const m = new THREE.Mesh(new THREE.BoxGeometry(wd, len, 0.03), M_(c2, { m: 0.6, r: 0.3 })); m.position.y = len / 2 - 0.1; p.add(m); p.position.z = 0.13; g.add(p); return p; };
  const hh = hand(0.62, 0.08, 0x1a1612), mh = hand(0.95, 0.05, 0x1a1612); const pin = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.06, 12), gold); pin.rotation.x = Math.PI / 2; pin.position.z = 0.17; g.add(pin);
  on((u, d) => { const m = time(u, d); hh.rotation.z = -(m / 720) * 6.283; mh.rotation.z = -((m % 60) / 60) * 6.283; });
  return g;
}
// the last room: dark red walls, the curtained painting under one cold spotlight, a rope, Grandpa's chair
export function lastRoom(o = {}) {
  const red = M_(0x3a0c10, { r: 0.9 }), z0 = -40, z1 = -54;
  blk(0.5, 9, 14, red, -6.25, 4.5, -47, { k: 0.01 }); blk(0.5, 9, 14, red, 6.25, 4.5, -47, { k: 0.01 }); blk(12.5, 9, 0.5, red, 0, 4.5, z1 - 0.25, { k: 0.01 });
  blk(12.5, 0.4, 14, M_(0x1a0a0a), 0, 9.2, -47, { cast: false });
  const fl = new THREE.Mesh(new THREE.PlaneGeometry(12, 14), new THREE.MeshStandardMaterial({ color: 0x2a2220, roughness: 0.25, metalness: 0.1 })); fl.rotation.x = -Math.PI / 2; fl.position.set(0, 0.012, -47); fl.receiveShadow = true; add(fl);
  // the frame (black and gold) with the curtain over it
  const f = framed('trapped', 3.6, 4.4, { plate: false, lamp: false }); f.g.position.set(0, 3.4, z1 + 0.02); add(f.g); f.cv.material = new THREE.MeshBasicMaterial({ color: 0x050405 });
  const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 4.6, 12), GOLD()); rod.rotation.z = Math.PI / 2; rod.position.set(0, 5.95, z1 + 0.55); add(rod);
  for (const s of [-1, 1]) { const k = new THREE.Mesh(new THREE.SphereGeometry(0.12, 12, 10), GOLD()); k.position.set(s * 2.35, 5.95, z1 + 0.55); add(k); }
  const cg = new THREE.PlaneGeometry(4.2, 5.6, 70, 50), base = cg.attributes.position.array.slice();
  const cm = new THREE.MeshPhysicalMaterial({ color: 0x7a0a14, roughness: 0.62, sheen: 1.0, sheenColor: new THREE.Color(0xff5a6a), sheenRoughness: 0.4, side: THREE.DoubleSide });
  const cur = new THREE.Mesh(cg, cm); cur.position.set(0, 3.15, z1 + 0.6); cur.castShadow = true; cur.receiveShadow = true; add(cur);
  const cf = o.curtain || (() => ({ amp: 0, bulge: 0 }));
  const upd = (u, d) => { const { amp = 0, bulge = 0, bx = 0.6, by = 0.2, lift = 0 } = cf(u, d); const p = cg.attributes.position.array;
    for (let i = 0; i < p.length; i += 3) { const x = base[i], y = base[i + 1], hang = (2.8 - y) / 5.6;
      let zz = Math.sin(x * 7.5) * 0.09 + Math.sin(x * 3.1 + 1) * 0.05;
      zz += amp * hang * (Math.sin(x * 2.2 + y * 1.3 - u * 2.6) * 0.16 + Math.sin(x * 5 - u * 4.1) * 0.05);
      zz += bulge * Math.exp(-((x - bx) ** 2 + (y - by) ** 2) / 0.9) * 0.9;
      p[i] = x * (1 - lift * 0.2 * hang); p[i + 1] = y + (y < -2.6 ? 0 : 0); p[i + 2] = zz; }
    cg.attributes.position.needsUpdate = true; cg.computeVertexNormals(); };
  upd(0, 1); on(upd);
  // tassel ropes, the rope barrier, the spotlight
  for (const s of [-1, 1]) { const t = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.4, 6), GOLD()); t.position.set(s * 2.25, 5.2, z1 + 0.75); add(t); const ts = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.35, 10), GOLD()); ts.position.set(s * 2.25, 4.4, z1 + 0.75); add(ts); }
  for (const x of [-2.6, 0, 2.6]) { blk(0.12, 1.1, 0.12, GOLD(), x, 0.55, z1 + 2.8, { k: 0.3 }); blk(0.4, 0.06, 0.4, GOLD(), x, 0.03, z1 + 2.8); }
  for (const s of [-1, 1]) { const curve = new THREE.QuadraticBezierCurve3(new THREE.Vector3(s * 2.6, 1.05, z1 + 2.8), new THREE.Vector3(s * 1.3, 0.75, z1 + 2.8), new THREE.Vector3(0, 1.05, z1 + 2.8)); const r = new THREE.Mesh(new THREE.TubeGeometry(curve, 16, 0.04, 8), M_(0x8a0a14, { r: 0.5 })); add(r); }
  const sp = new THREE.SpotLight(0xd8e4ff, o.night ? 60 : 40, 14, 0.42, 0.55, 1.3); sp.position.set(0, 8.6, z1 + 5.5); sp.target.position.set(0, 3, z1); sp.castShadow = true; sp.shadow.mapSize.set(1024, 1024); add(sp); add(sp.target);
  const amb = new THREE.PointLight(0xff6a5a, o.night ? 3 : 5, 12, 1.6); amb.position.set(0, 4, -44); add(amb);
  if (o.chair !== false) chair(0, z1 + 5.2, Math.PI, 0.55);
  return { cur, sp, z1 };
}
export function chair(x, z, yaw = 0, sc = 1) {
  const g = new THREE.Group(), w = M_(0x6a3a1c, { r: 0.5 });
  const p = (a, b, c, px, py, pz) => { const m = new THREE.Mesh(rbox(a, b, c, 0.2), w); m.position.set(px, py, pz); m.castShadow = true; m.receiveShadow = true; g.add(m); };
  p(0.9, 0.1, 0.9, 0, 0.95, 0); for (const [a, b] of [[-0.38, -0.38], [0.38, -0.38], [-0.38, 0.38], [0.38, 0.38]]) p(0.08, 0.95, 0.08, a, 0.47, b);
  p(0.9, 1.0, 0.08, 0, 1.5, -0.42);
  g.position.set(x, 0, z); g.rotation.y = yaw; g.scale.setScalar(sc); add(g); return g;
}
// a guard's cap on an avatar
export function guardCap(A) {
  const c = new THREE.Mesh(new THREE.CylinderGeometry(0.86, 0.8, 0.42, 32), M_(0x18203a, { r: 0.5 })); c.position.y = 0.8; A.head.add(c);
  const v = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.05, 24, 1, false, -1.2, 2.4), M_(0x0a0a10, { r: 0.2 })); v.position.set(0, 0.7, 0.35); v.scale.z = 1.2; A.head.add(v);
  const b = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.16, 0.04), GOLD()); b.position.set(0, 0.84, 0.86); A.head.add(b);
}
export function fishingHat(A, c = 0x8a7a50) { const m = M_(c, { r: 0.9 }); const b = new THREE.Mesh(new THREE.CylinderGeometry(1.05, 1.05, 0.06, 32), m); b.position.y = 0.72; A.head.add(b); const t = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.7, 0.5, 24), m); t.position.y = 0.95; A.head.add(t); }
// a lantern in an avatar's right hand (glass + warm flickering light)
export function lantern(A, o = {}) {
  const g = new THREE.Group(); g.position.set(0, -2.15, 0.1); A.armR.add(g);
  const frame = M_(0x2a2a2a, { m: 0.7, r: 0.4 }); const top = new THREE.Mesh(new THREE.ConeGeometry(0.42, 0.35, 4), frame); top.position.y = -0.2; top.rotation.y = 0.785; g.add(top);
  const glass = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.7, 0.5), new THREE.MeshBasicMaterial({ color: 0xffd078 })); glass.position.y = -0.7; g.add(glass);
  const bot = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.1, 0.62), frame); bot.position.y = -1.08; g.add(bot);
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex(), color: 0xffc060, transparent: true, opacity: 0.7, blending: THREE.AdditiveBlending, depthWrite: false })); halo.position.y = -0.7; halo.scale.setScalar(o.halo ?? 6); g.add(halo);
  const L = new THREE.PointLight(0xffb050, o.power ?? 6, 10, 1.6); L.position.y = -0.7; g.add(L);
  on((u) => { const f = 0.85 + 0.15 * Math.sin(u * 23) * Math.sin(u * 7.3); L.intensity = (o.power ?? 6) * f; halo.material.opacity = 0.6 * f; });
  return g;
}

// ------------------------------------------------------------------ the black paint hand
export function paintHand(o = {}) {
  const root = new THREE.Group(); add(root);
  const tar = new THREE.MeshPhysicalMaterial({ color: 0x020203, roughness: 0.4, metalness: 0.0, clearcoat: 0.5, clearcoatRoughness: 0.2, envMapIntensity: 0.3 });
  const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.13, 3.2, 16), tar); arm.rotation.x = Math.PI / 2; arm.position.z = -1.7; root.add(arm);
  const palm = new THREE.Mesh(new THREE.SphereGeometry(0.2, 20, 16), tar); palm.scale.set(1.1, 0.42, 1.25); root.add(palm);
  const fingers = [];
  for (let i = 0; i < 5; i++) { const thumb = i === 4; const a = thumb ? -1.0 : -0.42 + i * 0.28;
    const base = new THREE.Group(); base.position.set(Math.sin(a) * 0.18, 0, Math.cos(a) * 0.2); base.rotation.y = a * 0.6; root.add(base);
    let par = base; const segs = [];
    for (let k = 0; k < 3; k++) { const L = (thumb ? 0.32 : 0.48 - Math.abs(i - 1.5) * 0.05) * (1 - k * 0.12), r = 0.05 - k * 0.012;
      const seg = new THREE.Group(); if (k) seg.position.z = segs[k - 1].L; par.add(seg);
      const m = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.8, r, L, 10), tar); m.rotation.x = Math.PI / 2; m.position.z = L / 2; seg.add(m);
      const j = new THREE.Mesh(new THREE.SphereGeometry(r * 1.05, 10, 8), tar); seg.add(j); seg.L = L; segs.push(seg); par = seg; }
    const tip = new THREE.Mesh(new THREE.ConeGeometry(0.026, 0.16, 10), tar); tip.rotation.x = Math.PI / 2; tip.position.z = segs[2].L + 0.07; segs[2].add(tip);
    fingers.push({ segs, tip, i }); }
  // drips falling from the fingertips, a puddle growing below
  const drips = []; const dg = new THREE.SphereGeometry(0.03, 8, 6);
  for (let k = 0; k < 14; k++) { const m = new THREE.Mesh(dg, tar); m.scale.y = 2.4; add(m); drips.push({ m, f: k % 5, ph: k * 0.37 }); }
  const puddle = new THREE.Mesh(new THREE.CircleGeometry(1, 40), tar); puddle.rotation.x = -Math.PI / 2; add(puddle);
  const v = new THREE.Vector3();
  on((u, d) => { const k = o.reach ? o.reach(u, d) : 1, cu = o.curl ? o.curl(u, d) : 0.3;
    root.position.set(...(o.pos ? o.pos(u, d, k) : [0, 2, k])); root.rotation.set(o.rx ?? -0.2, o.ry ?? 0, o.rz ?? 0);
    fingers.forEach(({ segs, i }) => segs.forEach((s, j) => { s.rotation.x = cu * (0.5 + j * 0.25) + Math.sin(u * 2.2 + i + j) * 0.08; }));
    drips.forEach((D) => { const F = fingers[D.f]; F.tip.updateWorldMatrix(true, false); v.set(0, 0, 0.08); F.tip.localToWorld(v);
      const q = ((u * 0.8 + D.ph) % 1.4); D.m.position.set(v.x, v.y - q * q * 4.5, v.z); D.m.visible = v.y - q * q * 4.5 > 0.02 && k > 0.3; });
    puddle.position.set(root.position.x + 0.2, 0.015, root.position.z - 0.3); puddle.scale.setScalar(0.05 + (o.puddle ? o.puddle(u, d) : 0.4));
  });
  return root;
}

// ------------------------------------------------------------------ worlds inside the paintings
function skyDome(kind, o = {}) {
  const t = texOf(paintingCanvas(kind, 1024, 512, 40000)); const m = new THREE.Mesh(new THREE.SphereGeometry(o.r ?? 320, 48, 24, 0, Math.PI * 2, 0, Math.PI * (o.cut ?? 0.62)), new THREE.MeshBasicMaterial({ map: t, side: THREE.BackSide, fog: false, color: o.color ?? 0xffffff }));
  m.rotation.y = o.yaw ?? 0; m.position.y = o.y ?? -40; add(m); return m;
}
LAYOUT.seaSky = (g, w, h) => { g.fillStyle = grad(g, 0, 0, 0, h, [[0, '#2a6ac8'], [0.82, '#8cc0ec'], [1, '#dcecf4']]); g.fillRect(0, 0, w, h); const r = rnd(2); for (let i = 0; i < 9; i++) blob(g, r() * w, h * (0.55 + r() * 0.25), 30 + r() * 40, 8 + r() * 6, 'rgba(255,255,255,0.7)'); blob(g, w * 0.3, h * 0.45, 14, 14, '#fff6c8'); };
LAYOUT.cafeSky = (g, w, h) => { g.fillStyle = grad(g, 0, 0, 0, h, [[0, '#0a1440'], [0.8, '#2a4a9a'], [1, '#3a5ab0']]); g.fillRect(0, 0, w, h); const r = rnd(4); g.lineWidth = 6; for (let i = 0; i < 40; i++) { const x = r() * w, y = h * r() * 0.8; g.strokeStyle = 'rgba(140,180,255,0.4)'; g.beginPath(); g.arc(x, y, 30 + r() * 30, r() * 6, r() * 6 + 3); g.stroke(); } for (let i = 0; i < 40; i++) { const x = r() * w, y = h * r() * 0.8; blob(g, x, y, 14, 14, 'rgba(255,230,120,0.35)'); blob(g, x, y, 6, 6, '#fff4a8'); } };
LAYOUT.sunsetSky = (g, w, h) => { g.fillStyle = grad(g, 0, 0, 0, h, [[0, '#3a2a70'], [0.5, '#c8608a'], [0.8, '#f8a058'], [1, '#f8d898']]); g.fillRect(0, 0, w, h); const r = rnd(6); for (let i = 0; i < 26; i++) blob(g, r() * w, h * (0.3 + r() * 0.5), 80 + r() * 90, 10 + r() * 10, 'rgba(255,190,150,0.6)'); blob(g, w * 0.5, h * 0.9, 50, 50, '#fff0b0'); };
LAYOUT.stormSky = (g, w, h) => { g.fillStyle = grad(g, 0, 0, 0, h, [[0, '#0e1418'], [0.7, '#3a4a4a'], [1, '#5a6a64']]); g.fillRect(0, 0, w, h); const r = rnd(8); for (let i = 0; i < 70; i++) blob(g, r() * w, h * r() * 0.9, 70 + r() * 110, 25 + r() * 30, `rgba(${14 + r() * 40 | 0},${18 + r() * 40 | 0},${22 + r() * 40 | 0},0.65)`, r() * 0.6); };

function waterPlane(sz, n, mat, amp, o = {}) {
  const geo = new THREE.PlaneGeometry(sz, sz, n, n); geo.rotateX(-Math.PI / 2); const base = geo.attributes.position.array.slice();
  const m = new THREE.Mesh(geo, mat); m.receiveShadow = true; m.position.set(o.x ?? 0, o.y ?? 0, o.z ?? 0); add(m);
  const hgt = (x, z, u) => amp * (Math.sin(x * 0.18 + u * 1.1) * 0.6 + Math.sin(z * 0.24 - u * 1.5 + x * 0.05) * 0.5 + Math.sin((x + z) * 0.55 + u * 2.6) * 0.18 + Math.sin(x * 1.3 - z * 0.9 + u * 3.4) * 0.06);
  on((u) => { const p = geo.attributes.position.array; for (let i = 0; i < p.length; i += 3) p[i + 1] = hgt(base[i] + (o.x ?? 0), base[i + 2] + (o.z ?? 0), u); geo.attributes.position.needsUpdate = true; geo.computeVertexNormals(); });
  m.userData.h = hgt; return m;
}
export function seaWorld() {
  const S = getScene(); S.background = new THREE.Color(0xbfe0f4); S.fog = new THREE.Fog(0xcfe4f0, 30, 220); S.userData.hemi.intensity = 1.2; S.userData.sun.intensity = 2.4; S.userData.sun.position.set(-20, 30, -30);
  skyDome('seaSky', { yaw: 1.2 });
  const sea = waterPlane(260, 110, new THREE.MeshStandardMaterial({ color: 0x1a6aa0, roughness: 0.12, metalness: 0.3 }), 0.38, { z: -60 });
  const sand = new THREE.Mesh(new THREE.PlaneGeometry(260, 40), M_(0xe8cc90, { r: 0.95 })); sand.rotation.x = -Math.PI / 2 + 0.06; sand.position.set(0, -0.6, 32); sand.receiveShadow = true; add(sand);
  const r = rnd(5), foam = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.7, depthWrite: false });
  for (let i = 0; i < 60; i++) { const f = new THREE.Mesh(new THREE.CircleGeometry(0.3 + r() * 0.5, 12), foam); f.rotation.x = -Math.PI / 2; f.position.set((r() - 0.5) * 40, 0.3, -2 - r() * 30); f.scale.x = 2.5; add(f); }
  const sail = new THREE.Mesh(new THREE.ConeGeometry(2, 6, 3), M_(0xffffff)); sail.position.set(-30, 3, -110); add(sail);
  return sea;
}
export function cafeWorld() {
  const S = getScene(); S.background = new THREE.Color(0x0a1440); S.fog = new THREE.Fog(0x1a2a6a, 20, 90); S.userData.hemi.color.set(0x8aa0ff); S.userData.hemi.intensity = 0.35; S.userData.sun.intensity = 0.25;
  skyDome('cafeSky', { y: -20 });
  const cob = cvs(256, 256), q = cob.getContext('2d'); q.fillStyle = '#6a4a30'; q.fillRect(0, 0, 256, 256); const r = rnd(3); for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) { q.fillStyle = `rgb(${150 + r() * 50 | 0},${100 + r() * 40 | 0},${60 + r() * 30 | 0})`; q.beginPath(); q.ellipse(i * 32 + 16 + (j % 2) * 8, j * 32 + 16, 13, 12, 0, 0, 6.28); q.fill(); }
  const gr = new THREE.Mesh(new THREE.PlaneGeometry(80, 80), new THREE.MeshStandardMaterial({ map: texOf(cob, [20, 20]), roughness: 0.6 })); gr.rotation.x = -Math.PI / 2; gr.receiveShadow = true; add(gr);
  const yel = M_(0xe8a030, { r: 0.8, em: 0x8a4a10, ei: 0.1 }); blk(14, 9, 1, yel, -5, 4.5, -8, { k: 0.01 }); blk(1, 9, 14, yel, -12, 4.5, -1, { k: 0.01 });
  for (let i = 0; i < 4; i++) { const wn = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 2.2), new THREE.MeshBasicMaterial({ color: 0xffd47a })); wn.position.set(-10 + i * 3.2, 5.6, -7.45); add(wn); }
  const door = new THREE.Mesh(new THREE.PlaneGeometry(2, 3), new THREE.MeshBasicMaterial({ color: 0xffc860 })); door.position.set(-2, 1.5, -7.45); add(door);
  // the striped awning
  for (let i = 0; i < 14; i++) { const s = new THREE.Mesh(new THREE.BoxGeometry(1, 0.08, 3.2), M_(i % 2 ? 0xf6e8c8 : 0xc8282a, { r: 0.7 })); s.position.set(-11.5 + i, 3.6, -6.2); s.rotation.x = 0.35; add(s); }
  blk(1, 6, 1, M_(0x3a5ad8), 4, 3, -14, {}); // a blue building across
  blk(10, 10, 6, M_(0x2a3a6a, { r: 0.8 }), 9, 5, -18, { k: 0.01 });
  for (let i = 0; i < 8; i++) { const wn = new THREE.Mesh(new THREE.PlaneGeometry(1, 1.4), new THREE.MeshBasicMaterial({ color: i % 3 ? 0xffd870 : 0x1a2040 })); wn.position.set(5.5 + (i % 4) * 2.2, 3 + Math.floor(i / 4) * 3, -14.95); add(wn); }
  // string lights
  const bulb = new THREE.MeshBasicMaterial({ color: 0xfff0b0 });
  for (let i = 0; i < 26; i++) { const x = -11 + i * 0.6; const b = new THREE.Mesh(new THREE.SphereGeometry(0.08, 10, 8), bulb); b.position.set(x, 3.2 - Math.sin((i % 13) / 13 * Math.PI) * 0.5, -3.5); add(b); }
  for (const x of [-9, -4, 1]) { const L = new THREE.PointLight(0xffc870, 6, 12, 1.6); L.position.set(x, 3, -3); add(L); }
  const lamp = new THREE.PointLight(0xffd890, 7, 14, 1.4); lamp.position.set(-4, 4, -6); add(lamp);
  return { tables: [[-8.5, -3.5], [-5, -2.2], [-1.5, -3.6]] };
}
export function table(x, z, o = {}) {
  const top = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.62, 0.06, 28), M_(0xf2ecdc, { r: 0.4 })); top.position.set(x, 1.05, z); top.castShadow = true; add(top);
  const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.08, 1.05, 10), M_(0x2a2a2a, { m: 0.7 })); leg.position.set(x, 0.52, z); add(leg);
  if (o.candle !== false) { const c = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.22, 10), M_(0xfff8e8)); c.position.set(x, 1.19, z); add(c); const fl = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffd060 })); fl.scale.y = 1.7; fl.position.set(x, 1.34, z); add(fl);
    const L = new THREE.PointLight(0xffb050, 1.6, 4, 1.8); L.position.set(x, 1.45, z); add(L); on((u) => { L.intensity = 1.6 * (0.85 + 0.15 * Math.sin(u * 19 + x)); }); }
  for (const [dx, dz] of o.wine ? [[0.25, 0.1], [-0.25, -0.1]] : []) { const gl = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.03, 0.18, 10), new THREE.MeshStandardMaterial({ color: 0x8a1a2a, roughness: 0.1, transparent: true, opacity: 0.8 })); gl.position.set(x + dx, 1.17, z + dz); add(gl); }
}
export function lakeWorld() {
  const S = getScene(); S.background = new THREE.Color(0xf8a058); S.fog = new THREE.Fog(0xe89070, 60, 320); S.userData.hemi.color.set(0xffc0a0); S.userData.hemi.groundColor.set(0x3a2a50); S.userData.hemi.intensity = 0.9;
  const sun = S.userData.sun; sun.color.set(0xffa060); sun.intensity = 2.0; sun.position.set(0, 8, -60); sun.target.position.set(0, 0, 0);
  skyDome('sunsetSky', { yaw: -1.57 });
  waterPlane(300, 90, new THREE.MeshStandardMaterial({ color: 0xc87858, roughness: 0.08, metalness: 0.5 }), 0.06);
  const r = rnd(9), mm = M_(0x4a3a6a, { r: 0.9 });
  for (let i = 0; i < 9; i++) { const c = new THREE.Mesh(new THREE.ConeGeometry(18 + r() * 14, 20 + r() * 22, 6), mm); c.position.set(-120 + i * 30, 6, -150 - r() * 30); add(c); }
  const pine = M_(0x2a2040, { r: 0.9 }); for (let i = 0; i < 30; i++) { const c = new THREE.Mesh(new THREE.ConeGeometry(1.2, 6, 7), pine); c.position.set(-60 + r() * 120, 3, -70 - r() * 20); add(c); }
  for (let i = 0; i < 40; i++) { const reed = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.03, 1.4 + r(), 4), M_(0x5a4a2a)); reed.position.set(-6 + r() * 3, 0.5, 2 - r() * 4); reed.rotation.z = (r() - 0.5) * 0.3; add(reed); }
}
export function boat(x, z, yaw = 0) {
  const g = new THREE.Group(), w = M_(0x6a3a1c, { r: 0.6 }), d = M_(0x4a2814);
  const hull = new THREE.Mesh(rbox(1.6, 0.5, 3.6, 0.3), w); hull.position.y = 0.15; g.add(hull);
  const inn = new THREE.Mesh(rbox(1.3, 0.3, 3.2, 0.2), d); inn.position.y = 0.32; g.add(inn); const seat = new THREE.Mesh(rbox(1.3, 0.08, 0.4), w); seat.position.set(0, 0.5, 0); g.add(seat);
  g.position.set(x, 0, z); g.rotation.y = yaw; add(g);
  on((u) => { g.position.y = Math.sin(u * 1.3 + x) * 0.04; g.rotation.z = Math.sin(u * 1.1 + z) * 0.03; });
  return g;
}
// the stormy lighthouse world
export function stormWorld(o = {}) {
  const S = getScene(); S.background = new THREE.Color(0x10181c); S.fog = new THREE.Fog(0x24323a, 14, 140);
  S.userData.hemi.color.set(0x8aa0b0); S.userData.hemi.groundColor.set(0x101418); S.userData.hemi.intensity = 0.55; const sun = S.userData.sun; sun.color.set(0xa8c0d0); sun.intensity = 0.7; sun.position.set(-20, 30, 10); sun.target.position.set(0, 0, -20);
  const dome = skyDome('stormSky', { y: -30 });
  const sea = waterPlane(260, 120, new THREE.MeshStandardMaterial({ color: 0x2a5664, roughness: 0.22, metalness: 0.15 }), o.amp ?? 1.6, { z: -30 });
  const rock = M_(0x2a2622, { r: 0.85 }), r = rnd(4);
  const rocks = (cx, cz, n, R, Hh) => { for (let i = 0; i < n; i++) { const m = new THREE.Mesh(new THREE.DodecahedronGeometry(1 + r() * 1.6, 0), rock); const a = r() * 6.28, d = Math.sqrt(r()) * R; m.position.set(cx + Math.cos(a) * d, Hh * (1 - d / R) - 0.6 + r() * 0.6, cz + Math.sin(a) * d); m.rotation.set(r() * 3, r() * 3, r() * 3); m.scale.y = 0.7; m.castShadow = true; m.receiveShadow = true; add(m); } };
  rocks(0, -20, 40, 6, 2.6); rocks(3, -5, 22, 4.2, 1.6);
  // the lighthouse
  const LH = new THREE.Group(); LH.position.set(0, 2, -20); add(LH);
  const white = M_(0xeae6dc, { r: 0.6 }), redM = M_(0xb02428, { r: 0.6 });
  const tw = new THREE.Mesh(new THREE.CylinderGeometry(1.7, 2.5, 14, 32), white); tw.position.y = 7; tw.castShadow = true; tw.receiveShadow = true; LH.add(tw);
  for (const y of [3, 7, 11]) { const b = new THREE.Mesh(new THREE.CylinderGeometry(2.5 - (y + 1) * 0.057, 2.5 - (y - 1) * 0.057, 2, 32), redM); b.position.y = y; b.scale.setScalar(1.01); LH.add(b); }
  for (let k = 0; k < 4; k++) { const wn = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.7), new THREE.MeshBasicMaterial({ color: 0xffc860 })); const a = 1.0 + k * 0.4; wn.position.set(Math.sin(a) * 2.0, 2.5 + k * 3.1, Math.cos(a) * 2.0 + 0.02); wn.rotation.y = a; LH.add(wn); }
  const gal = new THREE.Mesh(new THREE.CylinderGeometry(2.6, 2.6, 0.3, 32), M_(0x2a2a2a, { m: 0.6 })); gal.position.y = 14.15; LH.add(gal);
  const rail = new THREE.Mesh(new THREE.TorusGeometry(2.55, 0.05, 6, 48), M_(0x2a2a2a, { m: 0.6 })); rail.rotation.x = Math.PI / 2; rail.position.y = 15.2; LH.add(rail);
  for (let k = 0; k < 24; k++) { const a = k / 24 * 6.283; const p = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.0, 4), rail.material); p.position.set(Math.cos(a) * 2.55, 14.7, Math.sin(a) * 2.55); LH.add(p); }
  const lampM = new THREE.MeshBasicMaterial({ color: 0xfff0b0 }); const lamp = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, 1.8, 24), lampM); lamp.position.y = 15.2; LH.add(lamp);
  const cap = new THREE.Mesh(new THREE.ConeGeometry(1.5, 1.3, 24), redM); cap.position.y = 16.75; LH.add(cap);
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex(), color: 0xffe8a0, transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending, depthWrite: false, fog: false })); halo.position.y = 15.2; halo.scale.setScalar(9); LH.add(halo);
  const beamM = new THREE.MeshBasicMaterial({ color: 0xfff0c0, transparent: true, opacity: 0.12, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false });
  const beams = new THREE.Group(); beams.position.y = 15.2; LH.add(beams);
  for (const s of [0, Math.PI]) { const c = new THREE.Mesh(new THREE.ConeGeometry(4, 70, 24, 1, true), beamM); c.geometry.translate(0, -35, 0); c.rotation.z = Math.PI / 2; const h2 = new THREE.Group(); h2.rotation.y = s; h2.add(c); beams.add(h2); }
  const LL = new THREE.PointLight(0xffe0a0, 30, 30, 1.4); LL.position.y = 15.2; LH.add(LL);
  // rain: long streaks in a box that follows the given centre
  const n = o.rainN ?? 2600, rp = new Float32Array(n * 6), rb = [];
  for (let i = 0; i < n; i++) rb.push([(r() - 0.5) * 30, r() * 24, (r() - 0.5) * 30, 0.5 + r() * 0.6]);
  const rg = new THREE.BufferGeometry(); rg.setAttribute('position', new THREE.BufferAttribute(rp, 3));
  const rain = new THREE.LineSegments(rg, new THREE.LineBasicMaterial({ color: 0xc8d8e8, transparent: true, opacity: 0.4, fog: false })); rain.frustumCulled = false; add(rain);
  const C = o.rainAt ?? [0, 4, 0];
  // lightning: a jagged bolt and a flash of the whole sky
  const bolt = new THREE.Group(); add(bolt); const boltM = new THREE.MeshBasicMaterial({ color: 0xf0f6ff, fog: false });
  { let p = new THREE.Vector3(-40, 70, -110); for (let k = 0; k < 10; k++) { const q = p.clone().add(new THREE.Vector3((r() - 0.5) * 9, -7, (r() - 0.5) * 3)); const d = q.clone().sub(p), L = d.length(); const m = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, L, 5), boltM); m.position.copy(p).add(q).multiplyScalar(0.5); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize()); bolt.add(m); p = q; } }
  const flashes = o.flashes ?? [0.6];
  const hemi0 = S.userData.hemi.intensity;
  S.userData.flash = 0;
  on((u) => {
    const p = rg.attributes.position.array; for (let i = 0; i < n; i++) { const [x, y, z, sp] = rb[i]; const yy = ((y - u * 26 * sp) % 24 + 24) % 24; const X = C[0] + x + yy * 0.18, Y = C[1] - 8 + yy, Z = C[2] + z; p.set([X, Y, Z, X - 0.18 * 0.9, Y - 0.9, Z], i * 6); } rg.attributes.position.needsUpdate = true;
    beams.rotation.y = u * 1.3;
    let f = 0; for (const t0 of flashes) { const dt = u - t0; if (dt > 0 && dt < 0.5) f = Math.max(f, (dt < 0.06 ? 1 : dt < 0.12 ? 0.3 : dt < 0.18 ? 0.9 : Math.exp(-(dt - 0.18) * 9))); }
    S.userData.flash = f; bolt.visible = f > 0.5; S.userData.hemi.intensity = hemi0 + f * 3.0; dome.material.color.setScalar(1 + f * 1.6);
  });
  return { LH, sea, top: new THREE.Vector3(0, 16.35, -20) };
}
