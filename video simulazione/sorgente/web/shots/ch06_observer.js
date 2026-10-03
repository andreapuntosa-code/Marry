// CHAPTER VI — THE OBSERVER (years 610-1003)
import * as THREE from 'three';
import { shot } from './registry.js';
import { mulberry32 } from '../lib/noise.js';
import { VILLAGERS } from '../lib/people.js';
import { K, orbitCam, M, SPAWN, founders, TIME, PRIMA, RIVERBANK, HILL, TEMPLE, GOATS, yawTo, lerpAngle, smooth, eraAcc, crowdDisc,
  templeLocal, TEMPLE_TOP, TEMPLE_FOOT, TEMPLE_YAW, MEADOW_TREES } from './sets.js';
import { buildRoom, creator, roomAt, SCREEN } from './room.js';

const vill = (c, i, x, z, o = {}) => c.person(VILLAGERS[i % VILLAGERS.length], { x, z, acc: eraAcc(o.era || 'clay', i), ...o });
const NIGHT = { hours: TIME.night, cloud: 0.15, exposure: 1.25 };
const SQ = { x: -16, z: 2 };          // the old village square, year 1000

// a clay tablet with carved glyphs (canvas texture)
let TAB_TEX = null;
function tabletTex() {
  if (TAB_TEX) return TAB_TEX;
  const cv = document.createElement('canvas'); cv.width = 512; cv.height = 720; const g = cv.getContext('2d');
  g.fillStyle = '#b07a52'; g.fillRect(0, 0, 512, 720);
  const r = mulberry32(8);
  for (let i = 0; i < 4000; i++) { g.fillStyle = `rgba(${90 + r() * 60},${55 + r() * 40},${30 + r() * 25},0.15)`; g.fillRect(r() * 512, r() * 720, 3, 3); }
  g.strokeStyle = 'rgba(60,32,18,0.9)'; g.lineWidth = 7; g.lineCap = 'round';
  // the sky flash: a circle with rays
  g.beginPath(); g.arc(256, 150, 46, 0, Math.PI * 2); g.stroke();
  for (let k = 0; k < 12; k++) { const a = k / 12 * Math.PI * 2; g.beginPath(); g.moveTo(256 + Math.cos(a) * 62, 150 + Math.sin(a) * 62); g.lineTo(256 + Math.cos(a) * 100, 150 + Math.sin(a) * 100); g.stroke(); }
  // twenty little figures below
  for (let i = 0; i < 20; i++) { const x = 70 + (i % 10) * 41, y = 330 + Math.floor(i / 10) * 110; g.beginPath(); g.arc(x, y, 9, 0, Math.PI * 2); g.stroke(); g.beginPath(); g.moveTo(x, y + 10); g.lineTo(x, y + 48); g.moveTo(x - 14, y + 26); g.lineTo(x + 14, y + 26); g.moveTo(x, y + 48); g.lineTo(x - 10, y + 70); g.moveTo(x, y + 48); g.lineTo(x + 10, y + 70); g.stroke(); }
  // glyph rows
  for (let row = 0; row < 3; row++) for (let k = 0; k < 7; k++) { const x = 60 + k * 62, y = 600 + row * 36; g.beginPath(); g.moveTo(x, y); g.lineTo(x + 20 + r() * 20, y + (r() - 0.5) * 16); g.lineTo(x + 10, y + 14); g.stroke(); }
  TAB_TEX = new THREE.CanvasTexture(cv); TAB_TEX.colorSpace = THREE.SRGBColorSpace;
  return TAB_TEX;
}
function tablet(c, x, y, z, yaw = 0, tilt = -0.2, s = 1) {
  const g = new THREE.BoxGeometry(0.5 * s, 0.7 * s, 0.06 * s); c.own(g);
  const side = new THREE.MeshStandardMaterial({ color: 0x9a6a46, roughness: 0.9 });
  const face = new THREE.MeshStandardMaterial({ map: tabletTex(), roughness: 0.85 });
  const m = new THREE.Mesh(g, [side, side, side, side, face, side]);
  m.position.set(x, y, z); m.rotation.set(tilt, yaw, 0); m.castShadow = true; m.receiveShadow = true;
  return c.add(m);
}

shot('o_card', 'chap:o01', {
  ...NIGHT, year: 912,
  cam: K([0, [HILL.x - 70, 6, HILL.z - 80], [HILL.x, 30, HILL.z], 40], [1, [HILL.x - 62, 6, HILL.z - 72], [HILL.x, 34, HILL.z], 40]),
  veg: { r0: 40 },
});
// o01: why does the world exist? / who put the animals here? / why does the river hate us?
shot('o01a', 'o01', {
  ...NIGHT, year: 912,
  cam: K([0, [SQ.x + 1.2, 0.6, SQ.z - 3.4], [SQ.x - 0.2, 2.6, SQ.z + 3], 38], [1, [SQ.x + 1.1, 0.55, SQ.z - 3.1], [SQ.x - 0.2, 2.8, SQ.z + 3], 36]),
  veg: { r0: 40 }, shadow: { x: SQ.x, z: SQ.z, r: 10 },
  setup(c) { [0, 1, 2].forEach(i => { const x = SQ.x - 1.1 + i * 1.1, z = SQ.z + 0.4 * (i % 2); const P = vill(c, i + 3, x, z, { yaw: (i - 1) * 0.3, era: 'clay' }); P.anim = (Q, t) => Q.pose('lookUp', t + i, { amount: 0.9 }); }); },
});
shot('o01b', 'o01', {
  hours: TIME.golden - 0.4, cloud: 0.4, year: 912,
  cam: K([0, [GOATS.x - 7, 1.0, GOATS.z - 5], [GOATS.x, 0.7, GOATS.z + 1], 32], [1, [GOATS.x - 6.4, 1.0, GOATS.z - 4.4], [GOATS.x, 0.7, GOATS.z + 1], 30]),
  veg: { grassR: 12 },
  setup(c) {
    for (let i = 0; i < 4; i++) { const d = c.animal('deer', i + 1, GOATS.x - 1 + i * 2.2, GOATS.z + 2 + (i % 2) * 1.5, 2.4 + i * 0.4); c.on(t => d.animate(t, { speed: 0, phase: i * 1.3 })); }
    const P = vill(c, 6, GOATS.x - 3, GOATS.z - 1.5, { yaw: 0.6 }); P.anim = (Q, t) => Q.pose('scratchHead', t);
  },
}, 1.7);
shot('o01c', 'o01', {
  hours: TIME.sunset, storm: 0.3, cloud: 0.6, year: 912, grade: 'sad',
  cam: K([0, [-44.2, 1.4, -20.2], [-55, 1.0, -15.5], 32], [1, [-44.6, 1.38, -20.0], [-55, 1.0, -15.5], 30]),
  veg: { grassR: 0, r0: 40 }, shadow: { x: RIVERBANK.x, z: RIVERBANK.z, r: 10 },
  setup(c) { const P = vill(c, 8, -48, -18, { yaw: yawTo(-48, -18, -58, -15), era: 'early' }); P.anim = (Q, t) => Q.pose('sad', t); },
}, 3.25);
// o02: four hundred years... (timelapse 610 -> 1000)
shot('o02', 'o02', {
  yearFn: (t, d) => 912 + 88 * smooth(0.05, 0.9, t / d), yearStep: 2, groundStep: 20,
  hoursFn: (t, d) => 7 + ((t / d) * 5 % 1) * 12, cloud: 0.45, tScale: 30, env: 0.6,
  cam: K([0, [40, 90, -150], [-10, 0, 10], 38], [1, [100, 80, -110], [-5, 0, 15], 38]),
  veg: { r0: 30, rImp: 220 },
});
// o03: the first night of year 1000 — the sky flickers
function festival(c, n = 7) {
  c.fire(SQ.x, SQ.z, { size: 0.9, smoke: true, lightIntensity: 26, lightDist: 22 });
  const out = [];
  for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2, d = 3 + (i % 2) * 1.2; const x = SQ.x + Math.cos(a) * d, z = SQ.z + Math.sin(a) * d; const P = vill(c, i + 2, x, z, { yaw: yawTo(x, z, SQ.x, SQ.z) }); out.push(P); }
  return out;
}
shot('o03a', 'o03', {
  ...NIGHT, year: 1000,
  cam: K([0, [SQ.x - 11, 2.2, SQ.z - 9], [SQ.x, 1.4, SQ.z], 36], [1, [SQ.x - 9.5, 2.0, SQ.z - 7.8], [SQ.x, 1.6, SQ.z], 34]),
  veg: { r0: 40 }, shadow: { x: SQ.x, z: SQ.z, r: 14 },
  setup(c) {
    c.flashAt(2.7, 9, 6);
    const P = festival(c, 9);
    P.forEach((p, i) => { p.anim = (Q, t) => (t < 2.85 + i * 0.06 ? Q.pose(i % 3 ? 'cheer' : 'talk', t + i, { phase: i }) : Q.pose('lookUp', t, { amount: 0.95 })); });
    crowdDisc(c, 160, SQ.x, SQ.z, 6, 16, SQ.x, SQ.z, { seed: 6 });
  },
});
shot('o03b', 'o03', {
  ...NIGHT, year: 1000,
  cam: K([0, [SQ.x + 2.6, 1.0, SQ.z - 4.2], [SQ.x + 0.6, 1.55, SQ.z - 1.2], 32], [1, [SQ.x + 2.4, 0.98, SQ.z - 3.9], [SQ.x + 0.6, 1.6, SQ.z - 1.2], 30]),
  veg: { r0: 40 }, shadow: { x: SQ.x, z: SQ.z, r: 8 },
  setup(c) {
    c.fire(SQ.x - 1.5, SQ.z + 2, { size: 0.8, lightIntensity: 20, lightDist: 16 });
    [[0.6, -1.4], [-0.6, -0.9], [1.6, -0.6]].forEach(([dx, dz], i) => { const P = vill(c, i + 12, SQ.x + dx, SQ.z + dz, { yaw: yawTo(SQ.x + dx, SQ.z + dz, SQ.x + 2.2, SQ.z - 3.6) + 0.3 }); P.anim = (Q, t) => Q.pose('lookUp', t + i, { amount: 0.85 }); });
  },
}, 5.2);
// o04: a young priestess named Sela had read the oldest stories, carved in clay
shot('o04a', 'o04', {
  ...NIGHT, year: 1000,
  cam: K([0, [SQ.x + 6.6, 1.2, SQ.z + 8.4], [SQ.x + 4.2, 0.75, SQ.z + 6.0], 32], [1, [SQ.x + 6.2, 1.15, SQ.z + 8.0], [SQ.x + 4.2, 0.75, SQ.z + 6.0], 30]),
  veg: { r0: 40 }, shadow: { x: SQ.x + 4, z: SQ.z + 6, r: 8 },
  setup(c) {
    c.fire(SQ.x + 3, SQ.z + 7, { size: 0.45, n: 14, lightIntensity: 12, lightDist: 10 });
    const s = c.person('SELA', { x: SQ.x + 4, z: SQ.z + 5.8, yaw: yawTo(SQ.x + 4, SQ.z + 5.8, SQ.x + 5.4, SQ.z + 6.9) });
    s.anim = (P, t) => { P.pose('sitGround', t, { headX: 0.45 }); P.L.sh.rotation.x = -1.2; P.R.sh.rotation.x = -1.2; P.L.el.rotation.x = -0.9; P.R.el.rotation.x = -0.9; };
    for (let i = 0; i < 4; i++) { const tx = SQ.x + 4.9 + i * 0.45, tz = SQ.z + 6.9 - i * 0.25; tablet(c, tx, c.h(tx, tz) + 0.32, tz, yawTo(tx, tz, SQ.x + 6.6, SQ.z + 8.4) + (i - 1.5) * 0.15, -0.3); }
  },
});
shot('o04b', 'o04', {
  ...NIGHT, year: 1000, exposure: 1.35,
  cam: K([0, [SQ.x + 4.9, 0.9, SQ.z + 5.75], [SQ.x + 5.1, 0.55, SQ.z + 6.5], 30], [1, [SQ.x + 4.95, 0.85, SQ.z + 5.95], [SQ.x + 5.1, 0.55, SQ.z + 6.5], 24]),
  veg: { r0: 40 }, shadow: { x: SQ.x + 5, z: SQ.z + 6.5, r: 4 },
  setup(c) {
    c.fire(SQ.x + 4.2, SQ.z + 5.6, { size: 0.3, n: 10, lightIntensity: 7, lightDist: 6, embers: false });
    tablet(c, SQ.x + 5.1, c.h(SQ.x + 5.1, SQ.z + 6.5) + 0.36, SQ.z + 6.5, yawTo(SQ.x + 5.1, SQ.z + 6.5, SQ.x + 4.9, SQ.z + 5.75), -0.25, 1.0);
  },
}, 4.1);
// o05: on the very first day — year zero (callback, with the flash)
shot('o05', 'o05', {
  hours: TIME.noon - 1, cloud: 0.35, year: 0, town: false, top: true, grade: 'dawn',
  cam: K([0, [M.x, 17, M.z - 0.5], [M.x, 0, M.z], 52], [1, [M.x, 15, M.z - 0.5], [M.x, 0, M.z], 52]),
  veg: { r0: 50, extra: MEADOW_TREES },
  setup(c) {
    c.flashAt(0.4, 7, 6);
    const P = founders(c, (w, i) => ({ pose: 'idle' }));
    P.forEach((p, i) => { const s0 = p.root.scale.x; p.anim = (Q, t) => { const k = smooth(0.45, 0.6, t); Q.root.scale.setScalar(Math.max(0.001, s0 * k)); Q.root.visible = t > 0.44; Q.pose('idle', t); }; });
  },
});
// o06: Sela stood in front of the whole town
const POD = { x: SQ.x + 2, z: SQ.z - 10 };
function selaSpeech(c, pose) {
  c.proto('podium', 0, POD.x, POD.z, Math.PI, 1);
  const s = c.person('SELA', { x: POD.x, z: POD.z + 0.3, dy: 1.2, yaw: 0 });
  s.anim = (P, t) => { if (pose === 'point') { P.pose('idle', t); P.R.sh.rotation.z = 2.75; P.R.sh.rotation.x = -0.4; P.head.rotation.x = -0.35; } else P.pose('armsOpen', t); };
  for (const sx of [-1, 1]) c.fire(POD.x + sx * 3, POD.z + 1.4, { size: 0.55, n: 16, lightIntensity: 18, lightDist: 16, dy: 1.6 });
  const cr = crowdDisc(c, 320, POD.x, POD.z + 12, 1, 11, POD.x, POD.z, { seed: 9, sx: 1.4, keep: (x, z) => z > POD.z + 3 });
  return { s, cr };
}
shot('o06', 'o06', {
  hours: TIME.dusk + 0.15, cloud: 0.25, year: 1000, exposure: 1.15,
  cam: K([0, [POD.x - 3, 3.8, POD.z + 17], [POD.x, 2.4, POD.z], 32], [1, [POD.x - 2, 3.4, POD.z + 13], [POD.x, 2.6, POD.z], 30]),
  veg: { r0: 40 }, shadow: { x: POD.x, z: POD.z + 6, r: 20 },
  setup(c) { selaSpeech(c, 'open'); },
});
shot('o06L', 'o06L', {
  hours: TIME.dusk + 0.2, cloud: 0.25, year: 1000, exposure: 1.15,
  cam: K([0, [POD.x + 1.4, 1.6, POD.z + 4.2], [POD.x, 2.9, POD.z], 30], [1, [POD.x + 1.2, 1.55, POD.z + 3.8], [POD.x, 3.0, POD.z], 28]),
  veg: { r0: 40 }, shadow: { x: POD.x, z: POD.z + 3, r: 10 },
  setup(c) { selaSpeech(c, 'point'); },
});
// o07: they called it the Observer (looking up at the stars)
shot('o07', 'o07', {
  ...NIGHT, year: 1000, exposure: 1.3,
  cam: K([0, [POD.x, 1.6, POD.z + 6], [POD.x + 6, 30, POD.z - 30], 46], [1, [POD.x, 1.6, POD.z + 6], [POD.x + 2, 36, POD.z - 30], 44]),
  veg: { r0: 40 },
});
// o08a: a temple on top of the hill, pointing at the sky (construction timelapse)
shot('o08a', 'o08', {
  yearFn: (t, d) => 1001.6 + 3.6 * smooth(0, 1, t / d), yearStep: 0.04, groundStep: 50,
  hoursFn: (t, d) => 7 + ((t / d) * 3 % 1) * 12, cloud: 0.4, tScale: 25, env: 0.6,
  cam: K([0, templeLocal(-38, 20, 46), templeLocal(0, 6, 0), 36], [1, templeLocal(-30, 18, 40), templeLocal(0, 7, 0), 36], { abs: true }),
  veg: { r0: 40 }, shadow: { x: TEMPLE.x, z: TEMPLE.z, r: 30 },
  setup(c) {
    const r = mulberry32(14);
    for (let i = 0; i < 10; i++) { const a = r() * 6.28, d = 14 + r() * 6; const x = TEMPLE.x + Math.cos(a) * d, z = TEMPLE.z + Math.sin(a) * d; const P = vill(c, i + 20, x, z, { yaw: yawTo(x, z, TEMPLE.x, TEMPLE.z), acc: ['basket'] }); P.anim = (Q, t) => Q.pose(i % 2 ? 'carry' : 'dig', t * 3 + i, { phase: i }); }
  },
});
// o08b: offerings — grain, goat cheese, little clay figures
const OFF = templeLocal(0, 0, 14.0);
shot('o08b', 'o08', {
  hours: TIME.morning + 1, cloud: 0.35, year: 1004,
  cam: K([0, [OFF[0] + 2.4, 0.7, OFF[2] + 1.0], [OFF[0], 0.25, OFF[2] - 0.2], 30], [1, [OFF[0] + 2.0, 0.6, OFF[2] + 0.8], [OFF[0], 0.25, OFF[2] - 0.2], 26]),
  veg: { r0: 40 }, shadow: { x: OFF[0], z: OFF[2], r: 6 },
  setup(c) {
    const r = mulberry32(5), bas = [], pots = [], ch = [], fig = [];
    for (let i = 0; i < 26; i++) { const x = OFF[0] + (r() - 0.5) * 3.6, z = OFF[2] + (r() - 0.5) * 1.6; const k = i % 4; (k === 0 ? bas : k === 1 ? pots : k === 2 ? ch : fig).push([x, z, r() * 6, k === 3 ? 1.6 : 1]); }
    c.protos('grainBasket', 0, bas); c.protos('pot', 0, pots); c.protos('cheese', 0, ch); c.protos('figurine', 0, fig);
  },
}, 4.7);
// o08c: which, obviously, I could not pick up (the view from above)
shot('o08c', 'o08', {
  hours: TIME.noon, cloud: 0.35, year: 1004, top: true,
  cam: K([0, [OFF[0] + 0.3, 70, OFF[2]], [OFF[0], 0, OFF[2] - 6], 40], [1, [OFF[0] + 0.3, 46, OFF[2]], [OFF[0], 0, OFF[2] - 6], 40]),
  veg: { r0: 40 }, shadow: { x: TEMPLE.x, z: TEMPLE.z, r: 30 },
  setup(c) {
    const r = mulberry32(5), bas = [], pots = [];
    for (let i = 0; i < 26; i++) { const x = OFF[0] + (r() - 0.5) * 3.6, z = OFF[2] + (r() - 0.5) * 1.6; (i % 2 ? bas : pots).push([x, z, r() * 6, 1]); }
    c.protos('grainBasket', 0, bas); c.protos('pot', 0, pots);
    for (let i = 0; i < 6; i++) { const x = OFF[0] - 4 + i * 1.6, z = OFF[2] + 3 + (i % 2); const P = vill(c, i + 30, x, z, { yaw: TEMPLE_YAW + Math.PI }); P.anim = (Q, t) => Q.pose('kneelPray', t + i); }
  },
}, 8.6);
// o09: now here's the part I can't stop thinking about (night, push towards the obelisk)
shot('o09', 'o09', {
  ...NIGHT, year: 1004,
  cam: K([0, templeLocal(-10, 2, 34), templeLocal(0, 12, 0), 34], [1, templeLocal(-7, 3, 26), templeLocal(0, 13, 0), 32], { abs: true }),
  veg: { r0: 40 }, shadow: { x: TEMPLE.x, z: TEMPLE.z, r: 25 },
  setup(c) { for (const [lx, lz] of [[-5, 5.4], [5, 5.4], [-9.6, 9.7], [9.6, 9.7]]) { const p = templeLocal(lx, lz < 6 ? 6.48 : 3.2, lz); c.fire(p[0], p[2], { size: 0.6, n: 16, lightIntensity: 16, lightDist: 18, y: p[1] + 0.2 }); } },
});
// o10: that flash was real
shot('o10', 'o10', {
  ...NIGHT, year: 1000,
  cam: K([0, [HILL.x - 30, 12, HILL.z - 34], [SQ.x, 2, SQ.z], 38], [1, [HILL.x - 31, 12, HILL.z - 35], [SQ.x, 2, SQ.z], 38]),
  veg: { r0: 40 },
  setup(c) { c.flashAt(0.3, 9, 5); festival(c, 6).forEach((p, i) => { p.anim = (Q, t) => Q.pose('lookUp', t + i); }); },
});
// o11: it was my autosave (2D interface over a blurred frame)
shot('o11', 'o11', { kind: '2d', name: 'autosave', bg: 'o10', cam: K([0, [0, 10, 0], [0, 0, 10], 40], [1, [0, 10, 0], [0, 0, 10], 40]) });
// o12: they didn't invent a god at random (Sela on the temple, looking up)
shot('o12', 'o12', {
  ...NIGHT, year: 1004,
  cam: K([0, templeLocal(1.0, 6.2, 7.6), templeLocal(0, 8.0, 4.85), 32], [1, templeLocal(0.9, 6.15, 7.3), templeLocal(0, 8.1, 4.85), 30], { abs: true }),
  veg: { r0: 40 }, shadow: { x: TEMPLE_TOP[0], z: TEMPLE_TOP[2], r: 12 },
  setup(c) {
    const s = c.personAt('SELA', TEMPLE_TOP[0], TEMPLE_TOP[1], TEMPLE_TOP[2], { yaw: TEMPLE_YAW }); s.anim = (P, t) => P.pose('lookUp', t);
    for (const sx of [-1, 1]) { const p = templeLocal(sx * 3.2, 6.48, 5.0); c.fire(p[0], p[2], { size: 0.5, n: 14, lightIntensity: 14, lightDist: 14, y: p[1] + 0.2 }); }
  },
});
// o13: they found me (crane up from Sela into the sky, looking down)
shot('o13', 'o13', {
  ...NIGHT, year: 1004,
  cam: K([0, [TEMPLE_TOP[0] + 1, TEMPLE_TOP[1] + 6, TEMPLE_TOP[2] + 1], [TEMPLE_TOP[0], TEMPLE_TOP[1], TEMPLE_TOP[2]], 40], [1, [TEMPLE_TOP[0] + 4, TEMPLE_TOP[1] + 130, TEMPLE_TOP[2] + 4], [TEMPLE_TOP[0], TEMPLE_TOP[1], TEMPLE_TOP[2]], 44], { abs: true, ease: (u) => u * u }),
  top: true, veg: { r0: 40 }, shadow: { x: TEMPLE.x, z: TEMPLE.z, r: 20 },
  setup(c) {
    const s = c.personAt('SELA', TEMPLE_TOP[0], TEMPLE_TOP[1], TEMPLE_TOP[2], { yaw: TEMPLE_YAW }); s.anim = (P, t) => P.pose('lookUp', t, { amount: 1.2 });
    for (const sx of [-1, 1]) { const p = templeLocal(sx * 3.2, 6.48, 5.0); c.fire(p[0], p[2], { size: 0.5, n: 14, lightIntensity: 14, lightDist: 14, y: p[1] + 0.2 }); }
  },
});
// o14: a guy in a hoodie, at 3 a.m., four empty cups of coffee
shot('o14', 'o14', {
  interior: true, hours: 3, year: 1004,
  cam: K([0, roomAt(1.5, 1.55, 2.0), roomAt(0, 1.0, 0.1), 40], [1, roomAt(1.1, 1.45, 1.6), roomAt(0, 1.0, 0.1), 36], { abs: true }),
  setup(c) { buildRoom(c, { year: 1004, pop: '1,204' }); creator(c, 'type'); },
});
// o15: but still. They found me. (over the shoulder, the screen)
shot('o15', 'o15', {
  interior: true, hours: 3, year: 1004,
  cam: K([0, roomAt(0.35, 1.45, 0.95), roomAt(0, 1.1, -0.32), 34], [1, roomAt(0.25, 1.38, 0.75), roomAt(0, 1.1, -0.32), 30], { abs: true }),
  setup(c) { buildRoom(c, { year: 1004, pop: '1,204', lines: ['> zoom temple', 'structure: TEMPLE', 'built: year 1002', 'purpose: unknown', 'points at: sky', '', 'offerings: 214', 'addressed to:', '  "THE OBSERVER"'] }); creator(c, 'lean'); },
});
