// Reusable scenes of Part 2: the narrator's room with an animated screen, the Great Hall with its crowd, the lab, night helpers.
import * as THREE from 'three';
import { buildRoom, creator, roomAt, resetButton, cereal } from './p1/room.js';
import { who, K, height, mulberry32, clamp01, lerp, TIME } from './p2kit.js';
import * as P from '../lib/p2.js';
export { buildRoom, creator, roomAt, resetButton, cereal };

// ---------------------------------------------------------------- canvas drawing for the screens
const FONT = (w, s) => `${w} ${s}px InterX, Inter, sans-serif`;
export const FAKE = [
  ['@frogdad77', 'first'], ['@mina.codes', 'who is here after part 1??'], ['@t3rminal_cat', 'ratio'], ['@pizza_enjoyer', 'send them a pizza'],
  ['@old_gamer_92', 'tell them to run'], ['@pastaqueen', 'recipe: 2 eggs, 200g flour, a bit of salt'], ['@goat.lover', 'the goats are the real heroes'],
  ['@not_a_bot_9', 'tell them the cake is a lie'], ['@dave_from_accounting', 'reset it. reset it. reset it.'], ['@sleepy_owl', 'tell them to touch grass'],
  ['@rhubarb', 'send them wifi'], ['@lil_wizard', 'ask them about the meaning of life'], ['@nina_k', 'just say thanks for the goats'], ['@pixelpete', 'bro really typed hello and deleted it'],
];
function avatar(g, x, y, r, letter, hue) {
  g.fillStyle = `hsl(${hue},12%,38%)`; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#e8eaed'; g.font = FONT(500, r * 1.1); g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(letter, x, y + r * 0.06); g.textAlign = 'left';
}
// the comment section (YouTube-like, dark): opts {scroll, pinBingus, typing, t, header}
export function drawComments(g, W, H, o = {}) {
  g.fillStyle = '#0f0f0f'; g.fillRect(0, 0, W, H);
  const k = W / 1024;
  g.fillStyle = '#f1f1f1'; g.font = FONT(700, 26 * k); g.textBaseline = 'alphabetic'; g.fillText(o.header ?? 'Comments', 28 * k, 44 * k);
  g.fillStyle = '#aaaaaa'; g.font = FONT(500, 18 * k); g.fillText(o.count ?? '14,203', 190 * k, 44 * k);
  const row = 92 * k, y0 = 76 * k - (o.scroll ?? 0) * row;
  const list = o.list ?? FAKE;
  list.forEach(([h, t], i) => {
    const y = y0 + i * row; if (y < 40 * k || y > H) return;
    avatar(g, 56 * k, y + 28 * k, 22 * k, h[1].toUpperCase(), (i * 53) % 360);
    g.fillStyle = '#f1f1f1'; g.font = FONT(600, 17 * k); g.fillText(h, 96 * k, y + 22 * k);
    g.fillStyle = '#aaaaaa'; g.font = FONT(400, 15 * k); g.fillText((2 + i) + ' hours ago', 96 * k + g.measureText(h).width + 70 * k, y + 22 * k);
    g.fillStyle = '#f1f1f1'; g.font = FONT(400, 20 * k); g.fillText(t, 96 * k, y + 52 * k);
    g.fillStyle = '#aaaaaa'; g.font = FONT(500, 15 * k); g.fillText('▲ ' + (3 + ((i * 37) % 90)), 96 * k, y + 76 * k);
  });
  if (o.typing) {      // three typing dots
    const ph = (o.t ?? 0) * 3; g.fillStyle = '#1f1f1f'; g.fillRect(0, H - 110 * k, W, 110 * k);
    g.fillStyle = '#3ea6ff'; g.font = FONT(600, 18 * k); g.fillText('someone is typing', 28 * k, H - 66 * k);
    for (let i = 0; i < 3; i++) { g.globalAlpha = 0.3 + 0.7 * Math.max(0, Math.sin(ph - i * 0.9)); g.beginPath(); g.arc((250 + i * 28) * k, H - 71 * k, 7 * k, 0, 6.3); g.fill(); } g.globalAlpha = 1;
  }
}
// the winning comment
export function drawBingus(g, x, y, k, o = {}) {
  avatar(g, x + 30 * k, y + 30 * k, 26 * k, 'I', 215);
  const hd = o.handle ?? '@IsabellaDelaney-Dean';
  g.fillStyle = '#f1f1f1'; g.font = FONT(600, 22 * k); const hw = g.measureText(hd).width; g.fillText(hd, x + 78 * k, y + 28 * k);
  g.fillStyle = '#aaaaaa'; g.font = FONT(400, 19 * k); g.fillText('16 hours ago', x + 78 * k + hw + 22 * k, y + 28 * k);
  g.fillStyle = '#f1f1f1'; g.font = FONT(400, 30 * k); g.fillText('"Bingus"', x + 78 * k, y + 78 * k);
}
export function drawBingusScreen(g, W, H, o = {}) {
  const k = W / 1024; drawComments(g, W, H, { ...o, scroll: o.scroll ?? 0, list: [['@Isabella', 'Bingus'], ...FAKE.slice(0, 11)], header: 'Comments' });
  g.fillStyle = '#272727'; g.fillRect(0, 70 * k, W, 100 * k);
  drawBingus(g, 24 * k, 84 * k, k);
  g.fillStyle = '#3ea6ff'; g.font = FONT(600, 16 * k); g.fillText('Pinned', W - 110 * k, 98 * k);
}

// ---------------------------------------------------------------- the narrator's room, with an animated monitor
// drawFn(g, W, H, t) is called each frame; returns the room parts + creator
export function narratorRoom(c, o = {}) {
  const cv = document.createElement('canvas'); cv.width = 1024; cv.height = 576; const g = cv.getContext('2d');
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace;
  const fn = o.screen ?? ((g2, W, H, t) => drawComments(g2, W, H, { scroll: t * 0.9 }));
  fn(g, 1024, 576, 0); tex.needsUpdate = true;
  const R = buildRoom(c, { tex, lamp: o.lamp ?? 4.6, monitor: o.monitor ?? 7 });
  c.on((t) => { fn(g, 1024, 576, t); tex.needsUpdate = true; });
  const me = creator(c, o.pose ?? 'type');
  if (o.button) resetButton(c);
  if (o.cereal) cereal(c);
  return { R, me, tex };
}
export const NIGHT = { hours: 23.2, cloud: 0.15, exposure: 1.25 };
export const ROOM_SHOT = { interior: true, hours: 23, exposure: 1.3, ambient: 0.3 };

// ---------------------------------------------------------------- the Great Hall and a seated crowd
export function hallScene(c, o = {}) {
  const H = P.greatHall(c, P.P2.hall.x, P.P2.hall.z, { yaw: o.yaw ?? 0, tiers: o.tiers ?? 9 });
  const n = o.n ?? 700, cr = c.crowd(n, { colors: o.colors ?? [0xf2f2f2, 0xe6e6e6, 0xf4f1ec, 0xdde4ee, 0xf3e6d2], seed: o.seed ?? 4, shadows: false });
  const rnd = mulberry32(5), seats = H.seats.slice(); for (let i = seats.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [seats[i], seats[j]] = [seats[j], seats[i]]; }
  for (let i = 0; i < n; i++) { const s = seats[i % seats.length]; cr.set(i, s[0], s[1], s[2], s[3] + (rnd() - 0.5) * 0.3, 0); }
  c.on((t) => cr.update(t));
  return { ...H, crowd: cr };
}

// pebbles piling into bowls over time: bowls = [[x, z]] , counts(t) -> [n0, n1, ...]
import { pebbles } from './p2kit.js';
export function voteBowls(c, bowls, countsFn, o = {}) {
  const y0 = o.y ?? 0, max = o.max ?? 400, N = bowls.length;
  bowls.forEach(([x, z]) => c.proto('bowl', 0, x, z, 0, 0.38, 0, { y: y0 + 0.02 }));
  const pb = pebbles(c, N * max, o.color ?? 0xa9a39a), rnd = mulberry32(3), off = [];
  for (let i = 0; i < N * max; i++) off.push([(rnd() - 0.5) * 0.42, rnd() * 0.5, (rnd() - 0.5) * 0.42, rnd() * 0.4 + 0.8]);
  c.on((t) => { const cn = countsFn(t); for (let b = 0; b < N; b++) { const [x, z] = bowls[b]; for (let i = 0; i < max; i++) { const k = b * max + i, [ox, oy, oz, s] = off[k], on = i < cn[b]; const r = Math.hypot(ox, oz); pb.set(k, x + ox, y0 + 0.12 + oy * 0.35 * (1 - r * 1.4) + Math.floor(i / 90) * 0.04, z + oz, on ? s * 1.5 : 0); } } pb.mesh.instanceMatrix.needsUpdate = true; });
}

// Lumi's lab: the narrator's room set re-used, a warm lamp, Lumi at the desk and the little world on the monitor
export function labScene(c, o = {}) {
  const cv = document.createElement('canvas'); cv.width = 1024; cv.height = 576; const g = cv.getContext('2d');
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace;
  const phase = o.phase ?? 0, draw = (t) => { P.drawLittleWorld(g, 1024, 576, t, typeof phase === 'function' ? phase(t) : phase, o.world || {}); tex.needsUpdate = true; }; draw(0); c.on(draw);
  const R = buildRoom(c, { tex, lamp: 5.5, monitor: 8 });
  const pose = o.pose ?? 'watch';
  const L = c.personAt('LUMI', ...roomAt(0, 0, 0.62), { yaw: Math.PI });
  L.anim = (Q, t) => { Q.pose('sit', t, { seat: 0.5 }); if (pose === 'watch') { Q.spine.rotation.x = 0.12; Q.head.rotation.x = 0.08; Q.L.sh.rotation.x = -1.05; Q.R.sh.rotation.x = -1.05; Q.L.el.rotation.x = -0.5; Q.R.el.rotation.x = -0.5 + Math.sin(t * 7) * 0.04; } else if (pose === 'cry') { Q.spine.rotation.x = 0.35; Q.head.rotation.x = 0.4; Q.L.sh.rotation.x = -1.4; Q.R.sh.rotation.x = -1.4; Q.L.el.rotation.x = -2.2; Q.R.el.rotation.x = -2.2; Q.L.sh.rotation.z = 0.3; Q.R.sh.rotation.z = -0.3; Q.spine.rotation.z = Math.sin(t * 9) * 0.01; } else if (pose === 'groan') { Q.spine.rotation.x = 0.45; Q.head.rotation.x = 0.5; Q.L.sh.rotation.x = -1.5; Q.R.sh.rotation.x = -1.5; Q.L.el.rotation.x = -2.3; Q.R.el.rotation.x = -2.3; } else if (pose === 'asleep') { Q.spine.rotation.x = 0.55; Q.head.rotation.x = 0.7; Q.L.sh.rotation.x = -1.3; Q.R.sh.rotation.x = -1.3; Q.L.el.rotation.x = -2.0; Q.R.el.rotation.x = -2.0; } else if (pose === 'lean') { Q.spine.rotation.x = -0.12; Q.L.sh.rotation.x = -0.4; Q.R.sh.rotation.x = -0.4; } };
  if (o.bowl) { cereal(c); }
  return { R, L, tex };
}
