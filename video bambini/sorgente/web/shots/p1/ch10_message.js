// CHAPTER X — THE MESSAGE (years 1999-2040) + OUTRO
import * as THREE from 'three';
import { shot, SHOTS } from './p1registry.js';
import { mulberry32 } from '../../lib/noise.js';
import { height } from '../../lib/terrain.js';
import { VILLAGERS } from '../../lib/people.js';
import { TorchField } from '../../lib/fx.js';
import { K, orbitCam, TIME, PRIMA, HILL, TEMPLE, CASTLE, PLAZA, PLAIN, yawTo, lerpAngle, smooth, eraAcc, crowdDisc,
  templeLocal, castleLocal, CASTLE_YAW, TEMPLE_YAW, BLUE } from './sets.js';
import { buildRoom, creator, roomAt } from './room.js';
import { nuv, tam, NUV_COLS, TAM_COLS } from './peoples.js';

const vill = (c, i, x, z, o = {}) => c.person(VILLAGERS[i % VILLAGERS.length], { x, z, acc: eraAcc(o.era || 'stone', i), ...o });
const NIGHT = { hours: TIME.night, cloud: 0.1, exposure: 1.3 };

// ---- the letters, a kilometre long, dug into the plain (one decal + one fire line per row of text)
const LINES = ["WE CHOSE.", "WE KNOW YOU'RE WATCHING.", "AND WHO'S WATCHING YOU?"];
const LW = 1100, LH = 120;                                     // world size of one line's decal
const LINE_Z = [PLAIN.z + 140, PLAIN.z, PLAIN.z - 140];         // rows from north to south
const CANVAS = {};
function lineCanvas(k) {
  if (CANVAS[k]) return CANVAS[k];
  const cv = document.createElement('canvas'); cv.width = 4096; cv.height = Math.round(4096 * LH / LW);
  const g = cv.getContext('2d'); g.clearRect(0, 0, cv.width, cv.height);
  const fs = Math.floor(cv.height * 0.82);
  g.font = `900 ${fs}px "Arial Black", Impact, "Helvetica Neue", Arial, sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
  const w = g.measureText(LINES[k]).width; const sc = Math.min(1, (cv.width * 0.96) / w);
  g.save(); g.translate(cv.width / 2, cv.height / 2); g.scale(sc, 1);
  g.lineJoin = 'round'; g.strokeStyle = 'rgba(70,46,26,1)'; g.lineWidth = fs * 0.07; g.strokeText(LINES[k], 0, 0);
  g.fillStyle = 'rgba(112,78,48,1)'; g.fillText(LINES[k], 0, 0);
  g.restore();
  CANVAS[k] = cv; return cv;
}
// canvas (u,v in 0..1, v=0 top) -> world: left of the text towards +x, top towards +z (reads correctly from the south)
const toWorld = (k, u, v) => [PLAIN.x + LW / 2 - u * LW, LINE_Z[k] + LH / 2 - v * LH];
function letters(c, k, opts = {}) {
  const cv = lineCanvas(k);
  const N = 220, Mv = 24, pos = [], uv = [], idx = [];
  for (let j = 0; j <= Mv; j++) for (let i = 0; i <= N; i++) {
    const u = i / N, v = j / Mv; const [x, z] = toWorld(k, u, v);
    pos.push(x, height(x, z) + 0.35, z); uv.push(u, 1 - v);
  }
  for (let j = 0; j < Mv; j++) for (let i = 0; i < N; i++) { const a = j * (N + 1) + i, b = a + 1, d = a + N + 1, e = d + 1; idx.push(a, d, b, b, d, e); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
  c.own(g);
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4; c.own(tex);
  const mat = new THREE.MeshLambertMaterial({ map: tex, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4 }); c.own(mat);
  if (opts.glow) { mat.emissive = new THREE.Color(0xff8a2a); mat.emissiveMap = tex; mat.emissiveIntensity = opts.glow; }
  const m = new THREE.Mesh(g, mat); m.frustumCulled = false; m.renderOrder = 2; m.receiveShadow = true; c.add(m);
  let tf = null;
  if (opts.fire !== false) {
    // fire points along the letters (sampled where the strokes are)
    const ctx = cv.getContext('2d'); const data = ctx.getImageData(0, 0, cv.width, cv.height).data;
    const pts = []; const step = opts.step ?? 7;
    for (let wz = 0; wz < LH; wz += step) for (let wx = 0; wx < LW; wx += step) {
      const u = wx / LW, v = wz / LH; const px = Math.floor(u * cv.width), py = Math.floor(v * cv.height);
      if (data[(py * cv.width + px) * 4 + 3] > 128) { const [x, z] = toWorld(k, u, v); pts.push([x, height(x, z) + 1.2, z]); }
    }
    tf = new TorchField(pts.length); tf.setPositions(pts);
    tf.flames.material.size = opts.size ?? 6; tf.glows.material.size = (opts.size ?? 6) * 4.2; tf.glows.material.opacity = 0.5;
    c.add(tf.group);
    tf.pts = pts;
  }
  return { mesh: m, tf };
}
function reveal(c, L, t0, t1) {
  c.on(t => { const u = smooth(t0, t1, t); L.mesh.material.opacity = u; L.mesh.visible = u > 0.01; if (L.tf) { L.tf.group.visible = u > 0.01; L.tf.flames.material.opacity = u; L.tf.glows.material.opacity = 0.5 * u; } });
}

shot('m_card', 'chap:m01', {
  hours: TIME.dusk, cloud: 0.3, year: 1999,
  cam: K([0, [PLAIN.x - 300, 60, PLAIN.z - 420], [PLAIN.x, 0, PLAIN.z], 40], [1, [PLAIN.x - 270, 56, PLAIN.z - 380], [PLAIN.x, 0, PLAIN.z], 40]),
  veg: { r0: 0, rImp: 0, r1: 700 }, town: false,
});
// m01: one more thing they had to decide — year 2000 was coming
shot('m01', 'm01', {
  hours: TIME.afternoon, cloud: 0.4, year: 1999,
  cam: K([0, [PLAZA.x + 16, 7, PLAZA.z - 14], [PLAZA.x, 1, PLAZA.z], 34], [1, [PLAZA.x + 13, 6.5, PLAZA.z - 16], [PLAZA.x, 1, PLAZA.z], 34]),
  veg: { r0: 40 }, shadow: { x: PLAZA.x, z: PLAZA.z, r: 24 },
  setup(c) {
    c.proto('podium', 0, PLAZA.x, PLAZA.z - 4, 0, 1); for (const sx of [-1, 1]) c.proto('bannerBlue', 0, PLAZA.x + sx * 3.4, PLAZA.z - 4.6, 0, 1.15);
    const s = vill(c, 7, PLAZA.x, PLAZA.z - 3.7, { dy: 1.2, yaw: 0, acc: BLUE }); s.anim = (P, t) => P.pose('talk', t);
    crowdDisc(c, 520, PLAZA.x, PLAZA.z + 5, 2, 14, PLAZA.x, PLAZA.z - 4, { seed: 51, sx: 1.3, keep: (x, z) => z > PLAZA.z - 1, colors: [0xf2f2f2, 0xeeeeea, 0x2a5bd7, 0xe6e6e6] });
  },
});
// m02: and with it, the flash (the obelisk pointing at the night sky)
shot('m02', 'm02', {
  ...NIGHT, year: 1999,
  cam: K([0, templeLocal(6, 1.5, 24), templeLocal(0, 16, 0), 40], [1, templeLocal(5, 1.5, 22), templeLocal(0, 18, 0), 40], { abs: true }),
  veg: { r0: 40 },
  setup(c) { c.flashAt(1.3, 0.9, 12); },
});
// m03p: the Assembly voted — Prima, Nuvia and the Tamari, together (a line of all three peoples at the bowls)
shot('m03p', 'm03', {
  hours: TIME.afternoon + 0.4, cloud: 0.4, year: 1999,
  cam: K([0, [PLAZA.x + 5.2, 1.6, PLAZA.z - 3.6], [PLAZA.x - 0.4, 1.0, PLAZA.z + 0.4], 32], [1, [PLAZA.x + 4.6, 1.6, PLAZA.z - 3.2], [PLAZA.x - 0.4, 1.0, PLAZA.z + 0.4], 30]),
  veg: { r0: 40 }, shadow: { x: PLAZA.x, z: PLAZA.z, r: 8 },
  setup(c) {
    const b1 = [PLAZA.x - 1.4, PLAZA.z], b2 = [PLAZA.x + 1.4, PLAZA.z];
    c.proto('bowl', 0, b1[0], b1[1], 0, 1.0); c.proto('bowl', 0, b2[0], b2[1], 0, 1.0);
    const mk = [(i, x, z) => vill(c, i + 2, x, z, { acc: BLUE }), (i, x, z) => nuv(c, i, x, z), (i, x, z) => tam(c, i, x, z)];
    for (let i = 0; i < 9; i++) {
      const x0 = PLAZA.x - 1.4 - 1.0, z0 = PLAZA.z + 1.2 + i * 1.05, x1 = PLAZA.x - 2.1, z1 = PLAZA.z + 0.4;
      const P = mk[i % 3](i, x0, z0);
      const t0 = i * 0.42;
      P.anim = (Q, t) => {
        const u = t - t0;
        if (u < 0) { Q.place(x0, c.h(x0, z0), z0, Math.PI); Q.pose('idle', t + i); return; }
        const z = Math.max(z1, z0 - u * 1.3), x = x0 + (x1 - x0) * Math.min(1, u * 0.6);
        Q.place(x, c.h(x, z), z, z > z1 + 0.05 ? Math.PI : Math.PI * 0.62);
        if (z > z1 + 0.05) Q.pose('walk', t, { speed: 0.6, phase: i }); else { Q.pose('idle', t); Q.R.sh.rotation.x = -0.9; }
      };
    }
    crowdDisc(c, 220, PLAZA.x, PLAZA.z, 6, 16, PLAZA.x, PLAZA.z, { seed: 52, colors: [0xf2f2f2, 0xeeeeea, 0x2a5bd7, ...NUV_COLS, ...TAM_COLS] });
  },
});
// m03: almost every stone in the same bowl / not for each other — for me
shot('m03a', 'm03', {
  hours: TIME.afternoon + 0.5, cloud: 0.4, year: 1999,
  cam: K([0, [PLAZA.x - 2.6, 2.6, PLAZA.z - 4.2], [PLAZA.x, 0.4, PLAZA.z], 34], [1, [PLAZA.x - 2.4, 2.4, PLAZA.z - 3.8], [PLAZA.x, 0.4, PLAZA.z], 32]),
  veg: { r0: 40 }, shadow: { x: PLAZA.x, z: PLAZA.z, r: 6 },
  setup(c) {
    const b1 = [PLAZA.x - 1.4, PLAZA.z], b2 = [PLAZA.x + 1.4, PLAZA.z];
    c.proto('bowl', 0, b1[0], b1[1], 0, 1.0); c.proto('bowl', 0, b2[0], b2[1], 0, 1.0);
    const g = new THREE.IcosahedronGeometry(0.06, 0), m = new THREE.MeshStandardMaterial({ color: 0x8d8f94, roughness: 0.8 });
    const n = 1400, im = new THREE.InstancedMesh(g, m, n); c.own(g); c.add(im); const r = mulberry32(3); const mx = new THREE.Matrix4();
    for (let i = 0; i < n; i++) { const left = i < 40; const b = left ? b2 : b1; const a = r() * 6.28, rr = Math.sqrt(r()) * 0.78; const h = left ? 0.05 + r() * 0.05 : 0.08 + Math.pow(r(), 0.6) * 0.62; mx.makeTranslation(b[0] + Math.cos(a) * rr * (1 - h * 0.3), c.h(b[0], b[1]) + 0.12 + h, b[1] + Math.sin(a) * rr * (1 - h * 0.3)); im.setMatrixAt(i, mx); }
    im.instanceMatrix.needsUpdate = true;
  },
}, 3.55);
shot('m03b', 'm03', {
  hours: TIME.afternoon + 0.6, cloud: 0.4, year: 1999,
  cam: K([0, [PLAZA.x + 1.2, 0.6, PLAZA.z + 5.5], [PLAZA.x - 0.6, 3.2, PLAZA.z + 2.0], 32], [1, [PLAZA.x + 1.1, 0.6, PLAZA.z + 5.3], [PLAZA.x - 0.6, 3.6, PLAZA.z + 2.0], 30]),
  veg: { r0: 40 }, shadow: { x: PLAZA.x, z: PLAZA.z + 2, r: 8 },
  setup(c) { [[0, 2], [1.2, 2.6], [-1.1, 2.9], [0.4, 3.8], [-0.6, 1.2]].forEach(([dx, dz], i) => { const o = { yaw: Math.PI + (i - 2) * 0.3 }; const P = i === 1 ? nuv(c, 1, PLAZA.x + dx, PLAZA.z + dz, o) : i === 3 ? tam(c, 2, PLAZA.x + dx, PLAZA.z + dz, o) : vill(c, i + 11, PLAZA.x + dx, PLAZA.z + dz, { ...o, acc: i % 2 ? BLUE : eraAcc('stone', i) }); P.anim = (Q, t) => Q.pose(t > 0.5 + i * 0.15 ? 'lookUp' : 'idle', t + i); }); },
}, 5.97);
// m04a: a painter named Nia designed the letters
shot('m04a', 'm04', {
  hours: TIME.morning + 1.5, cloud: 0.4, year: 1999,
  cam: K([0, [PLAZA.x - 12.4, 1.5, PLAZA.z + 13.2], [PLAZA.x - 10.4, 1.3, PLAZA.z + 15.4], 28], [1, [PLAZA.x - 12.2, 1.48, PLAZA.z + 13.5], [PLAZA.x - 10.4, 1.35, PLAZA.z + 15.4], 26]),
  veg: { r0: 40 }, shadow: { x: PLAZA.x - 10, z: PLAZA.z + 15, r: 6 },
  setup(c) {
    const cv = lineCanvas(0); const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; c.own(tex);
    const g = new THREE.PlaneGeometry(2.4, 2.4 * LH / LW * 2.2); c.own(g);
    const board = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ color: 0xf2ead8, map: tex, roughness: 0.9, transparent: false }));
    board.position.set(PLAZA.x - 9.6, c.h(PLAZA.x - 9.6, PLAZA.z + 16.2) + 1.5, PLAZA.z + 16.2); board.rotation.y = yawTo(PLAZA.x - 9.6, PLAZA.z + 16.2, PLAZA.x - 12.4, PLAZA.z + 13.2); c.add(board);
    const n = c.person('NIA', { x: PLAZA.x - 10.6, z: PLAZA.z + 15.0, yaw: yawTo(PLAZA.x - 10.6, PLAZA.z + 15.0, PLAZA.x - 9.6, PLAZA.z + 16.2) - 0.3 });
    n.anim = (P, t) => { P.pose('idle', t); P.R.sh.rotation.x = -1.5 + Math.sin(t * 2.2) * 0.15; P.R.sh.rotation.z = 0.3 + Math.sin(t * 1.3) * 0.25; P.R.el.rotation.x = -0.3; };
  },
});
shot('m04b', 'm04', {   // the builders dug them into the plain — letters a kilometre long
  hours: TIME.afternoon, cloud: 0.4, year: 1999, town: false,
  cam: K([0, [PLAIN.x + 120, 260, PLAIN.z - 520], [PLAIN.x, 0, PLAIN.z - 20], 44], [1, [PLAIN.x + 60, 300, PLAIN.z - 560], [PLAIN.x, 0, PLAIN.z - 20], 44]),
  veg: { r0: 0, rImp: 0, r1: 900 },
  setup(c) {
    const Ls = [0, 1, 2].map(k => letters(c, k, { fire: false }));
    Ls.forEach((L, k) => reveal(c, L, k * 0.8, 1.2 + k * 0.8));
    const cr = c.crowd(1500, { colors: [0xf2f2f2, 0xeeeeea, 0xd9c7a8] }); const r = mulberry32(8);
    for (let i = 0; i < 1500; i++) { const k = i % 3, u = r(), v = 0.15 + r() * 0.7; const [x, z] = toWorld(k, u, v); cr.set(i, x, c.h(x, z), z, r() * 6.28, 0); }
    c.on(t => cr.update(t));
  },
}, 3.0);
// m05: on the first night of year 2000, all of them stopped and looked up
function plainNight(c, opts = {}) {
  const Ls = [0, 1, 2].map(k => letters(c, k, { size: opts.size ?? 9, glow: opts.glow ?? 1.6 }));
  const n = opts.crowd ?? 2600, cr = c.crowd(n, { colors: [0xf2f2f2, 0xeeeeea, 0xd9c7a8, 0x2a5bd7] }); const r = mulberry32(12);
  for (let i = 0; i < n; i++) { const k = i % 3; const u = 0.02 + r() * 0.96, v = r() < 0.5 ? -0.12 - r() * 0.4 : 1.12 + r() * 0.4; const [x, z] = toWorld(k, u, v); cr.set(i, x, c.h(x, z), z, r() * 6.28, 0); }
  c.on(t => cr.update(t));
  return Ls;
}
const EYE = toWorld(1, 0.45, 1.083);          // in the gap between the 2nd and 3rd rows of letters
shot('m05a', 'm05', {
  ...NIGHT, year: 2000, town: false,
  cam: K([0, [EYE[0] + 3, 1.6, EYE[1] + 6], [EYE[0] - 4, 2.0, EYE[1] - 20], 38], [1, [EYE[0] + 2.5, 1.6, EYE[1] + 5], [EYE[0] - 4, 2.4, EYE[1] - 20], 36]),
  veg: { r0: 0, rImp: 0, r1: 600 }, shadow: { x: EYE[0], z: EYE[1], r: 14 },
  setup(c) {
    plainNight(c);
    for (let i = 0; i < 9; i++) { const x = EYE[0] - 3 + (i % 3) * 2.2, z = EYE[1] + 1 - Math.floor(i / 3) * 2; const P = vill(c, i + 2, x, z, { yaw: Math.PI + (i % 3 - 1) * 0.3, acc: i % 2 ? ['torch'] : BLUE }); if (i % 2) c.torch(P, { size: 0.32, light: i % 4 === 1, lightIntensity: 8, lightDist: 10, seed: i }); P.anim = (Q, t) => Q.pose(t > 1.2 + (i % 4) * 0.25 ? 'lookUp' : (i % 2 ? 'holdTorch' : 'idle'), t + i, { amount: 0.95 }); }
  },
});
shot('m05b', 'm05', {   // ...and waited for my eye to open
  ...NIGHT, year: 2000, town: false,
  cam: K([0, [EYE[0] + 1, 2.0, EYE[1] + 3], [EYE[0] + 1, 1.6, EYE[1] - 2], 40], [1, [EYE[0] + 2, 40, EYE[1] + 10], [EYE[0], 0, EYE[1] - 30], 44], { ease: (u) => u * u * (3 - 2 * u) }),
  veg: { r0: 0, rImp: 0, r1: 600 }, shadow: { x: EYE[0], z: EYE[1], r: 14 },
  setup(c) {
    plainNight(c);
    for (let i = 0; i < 6; i++) { const x = EYE[0] - 1 + (i % 3) * 1.4, z = EYE[1] - 0.5 - Math.floor(i / 3) * 1.4; const P = vill(c, i + 12, x, z, { yaw: Math.PI, acc: BLUE }); P.anim = (Q, t) => Q.pose('lookUp', t + i, { amount: 1.1 }); }
  },
}, 4.0);
// m06-m10: the message, from the sky
const TOP = (k, h) => [PLAIN.x, h, LINE_Z[k] - 1];
shot('m06', 'm06', {
  ...NIGHT, year: 2000, town: false, top: true, topAt: [PLAIN.x, PLAIN.z],
  cam: K([0, [PLAIN.x + 40, 160, PLAIN.z - 360], [PLAIN.x, 0, PLAIN.z], 46], [1, [PLAIN.x + 10, 520, PLAIN.z - 200], [PLAIN.x, 0, PLAIN.z], 50]),
  veg: { r0: 0, rImp: 0, r1: 900 },
  setup(c) { plainNight(c, { size: 7 }); },
});
shot('m07', 'm07', {
  ...NIGHT, year: 2000, town: false, top: true, topAt: [PLAIN.x, LINE_Z[0]],
  cam: K([0, [PLAIN.x, 820, LINE_Z[0] - 30], [PLAIN.x, 0, LINE_Z[0]], 40], [1, [PLAIN.x, 760, LINE_Z[0] - 28], [PLAIN.x, 0, LINE_Z[0]], 40], { abs: true }),
  veg: { r0: 0, rImp: 0, r1: 900 },
  setup(c) { const Ls = plainNight(c, { size: 9, crowd: 1600 }); Ls[1].mesh.visible = false; Ls[2].mesh.visible = false; Ls[1].tf.group.visible = false; Ls[2].tf.group.visible = false; reveal(c, Ls[0], 0, 0.5); },
});
shot('m08', 'm08', {
  ...NIGHT, year: 2000, town: false, top: true, topAt: [PLAIN.x, PLAIN.z + 70],
  cam: K([0, [PLAIN.x, 900, PLAIN.z + 40], [PLAIN.x, 0, PLAIN.z + 70], 46], [1, [PLAIN.x, 860, PLAIN.z + 40], [PLAIN.x, 0, PLAIN.z + 70], 46], { abs: true }),
  veg: { r0: 0, rImp: 0, r1: 900 },
  setup(c) { const Ls = plainNight(c, { size: 9, crowd: 1600 }); Ls[2].mesh.visible = false; Ls[2].tf.group.visible = false; reveal(c, Ls[1], 0.1, 0.8); },
});
shot('m09', 'm09', {   // and underneath, one more line (the camera tilts down to the dark row)
  ...NIGHT, year: 2000, town: false, top: true, topAt: [PLAIN.x, PLAIN.z - 60],
  cam: K([0, [PLAIN.x, 900, PLAIN.z + 40], [PLAIN.x, 0, PLAIN.z + 70], 46], [1, [PLAIN.x, 900, PLAIN.z - 110], [PLAIN.x, 0, PLAIN.z - 80], 46], { abs: true }),
  veg: { r0: 0, rImp: 0, r1: 900 },
  setup(c) { const Ls = plainNight(c, { size: 9, crowd: 1600 }); Ls[2].mesh.visible = false; Ls[2].tf.group.visible = false; },
});
shot('m10', 'm10', {
  ...NIGHT, year: 2000, town: false, top: true, topAt: [PLAIN.x, PLAIN.z - 40],
  cam: K([0, [PLAIN.x, 900, PLAIN.z - 110], [PLAIN.x, 0, PLAIN.z - 80], 46], [1, [PLAIN.x, 1240, PLAIN.z - 60], [PLAIN.x, 0, PLAIN.z - 30], 52], { abs: true }),
  veg: { r0: 0, rImp: 0, r1: 900 },
  setup(c) { const Ls = plainNight(c, { size: 10, crowd: 1600 }); reveal(c, Ls[2], 0.2, 1.4); c.flashAt(3.4, 5, 5); },
});
// m11: I didn't hit reset — year 2040, still running, still waiting
shot('m11', 'm11', {
  hours: TIME.dawn + 0.6, cloud: 0.35, year: 2040,
  cam: K([0, [PLAZA.x + 30, 18, PLAZA.z - 26], [PLAZA.x, 2, PLAZA.z], 36], [1, [PLAZA.x + 130, 110, PLAZA.z - 150], [PLAZA.x - 10, 0, PLAZA.z + 10], 40]),
  veg: { r0: 30, rImp: 220 },
  setup(c) {
    for (const [lx, lz] of [[-8, 13], [8, 13], [-13, 0], [13, 0], [0, 13.2]]) { const p = castleLocal(lx, 6.4, lz); c.proto('bannerBlue', 0, p[0], p[2], CASTLE_YAW, 1.3, 0, { y: p[1] }); }
    crowdDisc(c, 400, PLAZA.x, PLAZA.z, 2, 17, PLAZA.x, PLAZA.z, { seed: 71 });
  },
});
// m12: so, what should I tell them?
shot('m12', 'm12', {
  interior: true, hours: 3, year: 2040,
  cam: K([0, roomAt(-0.9, 1.25, 1.6), roomAt(0, 1.15, 0.55), 34], [1, roomAt(-0.75, 1.22, 1.35), roomAt(0, 1.15, 0.55), 30], { abs: true }),
  setup(c) { buildRoom(c, { year: 2040, pop: '9,847', lines: ['> message received', '"WE CHOSE."', '"WE KNOW YOU\'RE', '  WATCHING."', '"AND WHO\'S', '  WATCHING YOU?"', '', '> reply: _'] }); creator(c, 'turn'); },
});
// m13: write it in the comments (the message by daylight)
shot('m13', 'm13', {
  hours: TIME.morning + 1, cloud: 0.35, year: 2040, town: false, top: true, topAt: [PLAIN.x, PLAIN.z],
  cam: K([0, [PLAIN.x - 60, 700, PLAIN.z - 420], [PLAIN.x, 0, PLAIN.z], 48], [1, [PLAIN.x - 30, 760, PLAIN.z - 380], [PLAIN.x, 0, PLAIN.z], 48]),
  veg: { r0: 0, rImp: 0, r1: 900 },
  setup(c) { [0, 1, 2].forEach(k => letters(c, k, { fire: false })); },
});
// m14: next time — what happens when they learn what I really am (she looks straight up, at us)
shot('m14', 'm14', {
  ...NIGHT, year: 2040, town: false, top: true, topAt: [EYE[0], EYE[1]], grade: 'night',
  cam: K([0, [EYE[0] + 0.05, 7, EYE[1] - 0.35], [EYE[0], 1.5, EYE[1]], 32], [1, [EYE[0] + 0.04, 2.7, EYE[1] - 0.2], [EYE[0], 1.5, EYE[1]], 28], { abs: false }),
  veg: { r0: 0, rImp: 0, r1: 400 }, shadow: { x: EYE[0], z: EYE[1], r: 8 },
  setup(c) {
    plainNight(c, { crowd: 600 });
    const s = c.person('SELA', { x: EYE[0], z: EYE[1], yaw: Math.PI }); s.anim = (P, t) => P.pose('lookUp', t, { amount: 1.25 * smooth(0.4, 2.2, t) });
    c.fire(EYE[0] + 1.2, EYE[1] + 0.6, { size: 0.35, n: 12, lightIntensity: 8, lightDist: 8 });
  },
});
// OUTRO: slow aerial over the world at sunset (credits roll on top)
shot('outro', 'outro', {
  hours: TIME.sunset - 0.1, cloud: 0.45, year: 2040,
  cam: K([0, [-160, 70, -120], [20, 0, 20], 40], [1, [-420, 230, -380], [40, 0, 40], 42], { ease: (u) => u }),
  veg: { r0: 0, rImp: 0, r1: 900, rFar: 2600 },
});
