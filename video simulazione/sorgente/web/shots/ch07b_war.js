// CHAPTER VIII (cont.) — THE WAR ON NUVIA (1512) and THE GREY SLEEP (1640-1643)
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { shot } from './registry.js';
import { mulberry32 } from '../lib/noise.js';
import { height, RIVER_PTS } from '../lib/terrain.js';
import { VILLAGERS } from '../lib/people.js';
import { K, orbitCam, TIME, PRIMA, PLAZA, TEMPLE, yawTo, lerpAngle, smooth, eraAcc, castleLocal, castleXZ, templeLocal, templeXZ, CASTLE_YAW, LANDING, GUARD, crowdDisc } from './sets.js';
import { LAKE_Y, NUVIA, SHRINE, PIERS, WEST_HILLS, TAMARI, NUV_HOUSES, nHouses, shoreZ, nuvia, canoeFleet, tamariCamp, herd, goatFlock, nuv, tam, NUV_COLS, TAM_COLS } from './peoples.js';

const vill = (c, i, x, z, o = {}) => c.person(VILLAGERS[i % VILLAGERS.length], { x, z, acc: eraAcc(o.era || 'stone', i), ...o });
const AB = (x, h, z) => [x, Math.max(height(x, z), LAKE_Y) + h, z];
const ZS = shoreZ(NUVIA.x);
const RED = [0xc0283c, 0xb3122a, 0xa81e38, 0xcc3346];
const GREY = new THREE.Color(0x5d6066);
function RIV(z) {
  for (let i = 0; i < RIVER_PTS.length - 1; i++) { const [ax, az] = RIVER_PTS[i], [bx, bz] = RIVER_PTS[i + 1]; if (z <= az && z >= bz) return ax + (bx - ax) * (az - z) / (az - bz); }
  return RIVER_PTS[RIVER_PTS.length - 1][0];
}

// ------------------------------------------------------------------ an army: red instanced soldiers with spears
let SPEAR_GEO = null;
function spearGeo() {
  if (SPEAR_GEO) return SPEAR_GEO;
  const a = new THREE.CylinderGeometry(0.022, 0.026, 2.3, 5); a.translate(0, 1.15, 0);
  const b = new THREE.ConeGeometry(0.05, 0.22, 6); b.translate(0, 2.4, 0);
  for (const g of [a, b]) g.deleteAttribute('uv');
  SPEAR_GEO = mergeGeometries([a.toNonIndexed(), b.toNonIndexed()]);
  return SPEAR_GEO;
}
// pos(i, t) -> [x, z, yaw, walking]
function army(c, n, pos, opts = {}) {
  const cr = c.crowd(n, { colors: RED, seed: opts.seed ?? 7 });
  const mat = new THREE.MeshStandardMaterial({ color: 0x8a6a45, roughness: 0.7, metalness: 0.2 }); c.own(mat);
  const sp = new THREE.InstancedMesh(spearGeo(), mat, n); sp.frustumCulled = false; sp.castShadow = false; c.add(sp);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), p = new THREE.Vector3(), s = new THREE.Vector3(1, 1, 1);
  c.on(t => {
    for (let i = 0; i < n; i++) {
      const [x, z, yaw, w] = pos(i, t), y = height(x, z);
      cr.set(i, x, y, z, yaw, w ? 1 : 0);
      const tilt = opts.charge ? 1.2 : 0.12;
      p.set(x + Math.cos(yaw) * 0.28, y + 0.85, z - Math.sin(yaw) * 0.28);
      e.set(tilt, yaw, 0, 'YXZ'); sp.setMatrixAt(i, m4.compose(p, q.setFromEuler(e), s));
    }
    sp.instanceMatrix.needsUpdate = true;
    cr.update(t);
  });
  return cr;
}
const KASSA_XI = (c, x, z, o = {}) => c.person('KASSA11', { x, z, ...o });
let PLUME_TEX = null;
function plume(c, x, y, z, h = 60, w = 14, seed = 1) {
  if (!PLUME_TEX) {
    const cv = document.createElement('canvas'); cv.width = cv.height = 128; const g = cv.getContext('2d');
    const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, 'rgba(70,68,66,0.55)'); gr.addColorStop(0.6, 'rgba(60,58,58,0.22)'); gr.addColorStop(1, 'rgba(50,50,50,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 128, 128); PLUME_TEX = new THREE.CanvasTexture(cv); PLUME_TEX.colorSpace = THREE.SRGBColorSpace;
  }
  const mat = new THREE.SpriteMaterial({ map: PLUME_TEX, depthWrite: false, transparent: true }); c.own(mat);
  const r = mulberry32(seed), N = 16, sp = [];
  for (let i = 0; i < N; i++) { const s = new THREE.Sprite(mat); c.add(s); sp.push({ s, ph: r() }); }
  c.on(t => sp.forEach(({ s, ph }) => { const u = (ph + t * 0.02) % 1; s.position.set(x + u * h * 0.35 + Math.sin(ph * 20 + t * 0.2) * 2, y + u * h, z + Math.cos(ph * 13) * 3); s.scale.setScalar(w * (0.4 + u * 1.6)); }));
}
const SQF = (b) => b.type === 'stall' || Math.hypot(b.x - PLAZA.x, b.z - PLAZA.z) > 13.5;     // an open market square

// ------------------------------------------------------------------ g01: kings don't just want harvests. They want land.
const KV = castleLocal(0.4, 0, 27);
shot('g01', 'g01', {
  hours: TIME.golden - 0.1, cloud: 0.35, year: 1511, townFilter: (b) => b.type === 'castle' || Math.hypot(b.x - KV[0], b.z - KV[2]) > 46,
  cam: K([0, castleXZ(1.5, 23.2, 1.75), [KV[0] - 30, -6, KV[2] - 300], 34], [1, castleXZ(1.35, 23.7, 1.72), [KV[0] - 30, -6, KV[2] - 300], 32]),
  veg: { r0: 40 }, clear: [[KV[0], KV[2], 10]], shadow: { x: KV[0], z: KV[2], r: 10 },
  setup(c) {
    const k = c.person('KASSA11', { x: KV[0], z: KV[2], yaw: yawTo(KV[0], KV[2], -150, -1650) });
    k.anim = (P, t) => { P.pose('idle', t, { look: 0 }); P.L.sh.rotation.x = -0.25; P.L.el.rotation.x = -1.3; P.R.sh.rotation.x = -0.2; P.R.el.rotation.x = -1.2; };
  },
});
// g02a: in year 1512, King Kassa XI marched an army to the lake (the king at the head of the column)
const RD = (z) => RIV(z) + 46;          // the road south along the east bank
const G2Z = -420;
shot('g02a', 'g02', {
  hours: TIME.morning, cloud: 0.4, year: 1512,
  cam: (t, d) => { const z = G2Z - 1.3 * t - 5.2, x = RD(z) + 1.4; return { pos: new THREE.Vector3(x, height(x, z) + 1.25, z), target: new THREE.Vector3(RD(z + 6), height(RD(z + 6), z + 6) + 1.6, z + 6), fov: 32, roll: 0 }; },
  veg: { r0: 40 }, clear: [...Array(10)].map((_, i) => [RD(G2Z + 20 - i * 6), G2Z + 20 - i * 6, 7]), shadow: { x: RD(G2Z), z: G2Z, r: 16 },
  setup(c) {
    const k = KASSA_XI(c, RD(G2Z), G2Z);
    k.anim = (P, t) => { const z = G2Z - 1.3 * t, x = RD(z); P.place(x, height(x, z), z, Math.PI + Math.atan2(RD(z - 2) - x, -2) - Math.PI); P.root.rotation.y = Math.atan2(RD(z - 2) - x, -2); P.pose('walk', t, { speed: 0.6 }); };
    for (let i = 0; i < 6; i++) {
      const dz = 2.2 + Math.floor(i / 2) * 1.6, dx = (i % 2 ? 1 : -1) * 1.0;
      const P = c.person(VILLAGERS[(i * 7 + 1) % 48], { x: RD(G2Z + dz) + dx, z: G2Z + dz, acc: GUARD });
      P.anim = (Q, t) => { const z = G2Z + dz - 1.3 * t, x = RD(z) + dx; Q.place(x, height(x, z), z, Math.atan2(RD(z - 2) - RD(z), -2)); Q.pose('walk', t, { speed: 0.6, phase: i }); Q.R.sh.rotation.x = -0.3; Q.R.el.rotation.x = -1.0; };
    }
    for (const sx of [-1, 1]) c.proto('bannerRed', 0, RD(G2Z + 4) + sx * 2.2, G2Z + 4, Math.PI, 0.9);
    army(c, 260, (i, t) => { const row = Math.floor(i / 4), z = G2Z + 9 + row * 1.5 - 1.3 * t, x = RD(z) + ((i % 4) - 1.5) * 1.1; return [x, z, Math.atan2(RD(z - 2) - RD(z), -2), 1]; });
  },
});
// g02b: the column on the road, from above
shot('g02b', 'g02', {
  hours: TIME.morning + 0.6, cloud: 0.4, year: 1512, tScale: 4,
  cam: K([0, [RD(-500) + 72, 44, -575], [RD(-470), 0, -470], 40], [1, [RD(-520) + 72, 44, -592], [RD(-480), 0, -480], 40]),
  veg: { r0: 30, rImp: 200 }, clear: [...Array(16)].map((_, i) => [RD(-480 - i * 15), -480 - i * 15, 8]), shadow: { x: RD(-600), z: -600, r: 70 },
  setup(c) {
    army(c, 900, (i, t) => { const row = Math.floor(i / 4), z = -560 + row * 1.6 - 5 * t, x = RD(z) + ((i % 4) - 1.5) * 1.15; return [x, z, Math.atan2(RD(z - 2) - RD(z), -2), 1]; }, { seed: 9 });
  },
}, 2.6);
// g03a: the first war in the history of the valley lasted nine days (the shore of Nuvia burns)
const BURN = NUV_HOUSES.filter(h => h.k < 48 && h.row < 2).slice(0, 9);
function burning(c, list, n0 = 2.2) {
  list.forEach((h, i) => {
    c.fire(h.x, h.z, { size: n0 + 0.5 * (i % 3), n: 22, smoke: true, lightIntensity: 22, lightDist: 26, y: h.y + 4.6, seed: i });
    c.fire(h.x + 0.8, h.z + 1.2, { size: n0 * 0.5, n: 12, light: false, y: h.y + 2.45, seed: i + 50 });
  });
}
shot('g03a', 'g03', {
  hours: TIME.dusk + 0.2, cloud: 0.5, storm: 0.15, year: 1512, exposure: 1.1,
  cam: K([0, AB(NUVIA.x + 46, 3.2, ZS + 18), AB(NUVIA.x + 4, 2.0, ZS - 2), 36], [1, AB(NUVIA.x + 42, 3.0, ZS + 16.5), AB(NUVIA.x + 2, 2.0, ZS - 2), 34], { abs: true }),
  veg: { r0: 40 }, clear: [[NUVIA.x, ZS + 10, 150]], shadow: { x: NUVIA.x + 20, z: ZS + 6, r: 30 },
  setup(c) {
    nuvia(c, 1512, { canoes: false });
    burning(c, BURN);
    army(c, 220, (i, t) => { const r = (i * 9301 + 49297) % 233280 / 233280, x0 = NUVIA.x + 30 + (i % 20) * 1.1, z0 = ZS + 6 + Math.floor(i / 20) * 1.2; const x = x0 - (2.0 + r) * t, z = z0 + (r - 0.5) * t * 0.4; return [x, z, -Math.PI / 2, 1]; }, { charge: true, seed: 3 });
    const r = mulberry32(5);
    for (let i = 0; i < 9; i++) {
      const x = NUVIA.x + 14 + r() * 14, z = ZS + 2 + r() * 8;
      const P = nuv(c, i, x, z, { acc: [{ type: 'headband', color: 0x2a9db0 }, 'spear'], yaw: Math.PI / 2 });
      P.anim = (Q, t) => (i % 3 === 0 ? c.walkTo(Q, x, z, x - 6, z - 1, t, 0.2, 3.6, { run: true, phase: i }) : Q.pose('pushSpear', t * 1.4 + i, { phase: i }));
    }
  },
});
// g03b: Nuvia lost (a Nuvian drops his spear and sinks to his knees, the village burning behind)
const G3 = { x: BURN[0].x + 1.5, z: BURN[0].z + 13 };
shot('g03b', 'g03', {
  hours: TIME.dusk + 0.3, cloud: 0.5, storm: 0.15, year: 1512, exposure: 1.15, aperture: 1.2,
  cam: K([0, AB(G3.x + 1.0, 1.2, G3.z + 4.2), AB(G3.x - 0.4, 1.6, G3.z - 6), 34], [1, AB(G3.x + 0.9, 1.1, G3.z + 3.8), AB(G3.x - 0.4, 1.4, G3.z - 6), 32], { abs: true }),
  veg: { r0: 40 }, clear: [[NUVIA.x, ZS + 10, 150]], shadow: { x: G3.x, z: G3.z, r: 8 },
  setup(c) {
    nuvia(c, 1512, { canoes: false });
    burning(c, BURN);
    const P = nuv(c, 0, G3.x, G3.z, { acc: [{ type: 'headband', color: 0x2a9db0 }, 'spear'], yaw: yawTo(G3.x, G3.z, G3.x + 1.2, G3.z + 3.4) });
    P.anim = (Q, t) => { if (t < 0.4) Q.pose('pushSpear', t); else if (t < 1.1) Q.pose('dropSpear', (t - 0.4) * 1.5); else Q.pose('kneelPray', t, { armsUp: 0 }); };
  },
}, 3.23);
// g04a: their boats were burned (burning canoes on the water at night)
shot('g04a', 'g04', {
  hours: TIME.night, cloud: 0.3, year: 1512, exposure: 1.2,
  cam: K([0, [NUVIA.x - 4, LAKE_Y + 1.3, ZS - 48], [NUVIA.x + 4, LAKE_Y + 1.8, ZS - 20], 36], [1, [NUVIA.x - 3.4, LAKE_Y + 1.25, ZS - 45.5], [NUVIA.x + 4, LAKE_Y + 1.8, ZS - 20], 34], { abs: true }),
  veg: { r0: 40 }, clear: [[NUVIA.x, ZS + 10, 150]], shadow: { x: NUVIA.x, z: ZS - 25, r: 30 },
  setup(c) {
    nuvia(c, 1512, { canoes: false });
    burning(c, BURN.slice(0, 5), 1.8);
    const r = mulberry32(12), boats = [];
    for (let i = 0; i < 9; i++) boats.push({ x: NUVIA.x - 16 + i * 4.2 + (r() - 0.5) * 2, z: ZS - 24 - r() * 12, yaw: r() * 6.28, ph: i, v: i % 2 });
    canoeFleet(c, boats);
    boats.forEach((b, i) => c.fire(b.x, b.z, { size: 1.2 + 0.35 * (i % 3), n: 18, smoke: true, lightIntensity: 14, lightDist: 16, y: LAKE_Y + 0.2, seed: i + 20 }));
  },
});
// g04b: their shrine to the river was torn down
shot('g04b', 'g04', {
  hours: TIME.dawn + 0.1, cloud: 0.55, year: 1512, grade: 'sad',
  cam: K([0, [SHRINE.x - 14, 1.4, SHRINE.z + 5], [SHRINE.x, 3.2, SHRINE.z], 36], [1, [SHRINE.x - 13, 1.35, SHRINE.z + 4.6], [SHRINE.x, 2.6, SHRINE.z], 34]),
  veg: { r0: 40, grassR: 8 }, clear: [[SHRINE.x, SHRINE.z, 14]], shadow: { x: SHRINE.x - 2, z: SHRINE.z, r: 12 },
  setup(c) {
    nuvia(c, 1512, { canoes: false, shrine: false });
    const s = c.proto('shrine', 0, SHRINE.x, SHRINE.z, 0.6, 1.0);
    const pivotY = s.position.y;
    c.on(t => { const k = smooth(0.4, 2.2, t); const a = k * k * 1.5; s.rotation.set(0, 0.6, 0); s.rotateOnWorldAxis(new THREE.Vector3(1, 0, 0.4).normalize(), -a); s.position.y = pivotY; });
    [[-2.0, 1.6], [-2.6, -1.2], [-1.4, 2.4]].forEach(([dx, dz], i) => { const x = SHRINE.x + dx, z = SHRINE.z + dz; const P = c.person(VILLAGERS[i * 9 + 3], { x, z, yaw: yawTo(x, z, SHRINE.x, SHRINE.z), acc: GUARD }); P.anim = (Q, t) => { Q.pose('idle', t + i); Q.R.sh.rotation.x = -1.2; Q.L.sh.rotation.x = -1.2; Q.spine.rotation.x = -0.15; }; });
    for (let i = 0; i < 4; i++) { const x = SHRINE.x - 7 - i * 1.3, z = SHRINE.z + 3 + (i % 2); const P = nuv(c, i, x, z, { yaw: yawTo(x, z, SHRINE.x, SHRINE.z) }); P.anim = (Q, t) => Q.pose(i % 2 ? 'headInHands' : 'sad', t + i); }
  },
}, 3.65);
// g04c: three thousand Nuvians woke up as subjects of a king they couldn't even understand
const BEACH = { x: NUVIA.x + 4, z: ZS + 20 };
shot('g04c', 'g04', {
  hours: TIME.morning - 0.6, cloud: 0.55, year: 1512, grade: 'sad',
  cam: K([0, AB(BEACH.x + 14, 4.2, BEACH.z + 13), AB(BEACH.x - 1, 0.8, BEACH.z - 2), 36], [1, AB(BEACH.x + 12, 3.6, BEACH.z + 11.5), AB(BEACH.x - 1, 0.8, BEACH.z - 2), 34], { abs: true }),
  veg: { r0: 40 }, clear: [[NUVIA.x, ZS + 10, 150]], shadow: { x: BEACH.x, z: BEACH.z, r: 18 },
  setup(c) {
    nuvia(c, 1512, { canoes: false, shrine: false });
    const cr = c.crowd(150, { colors: NUV_COLS, seed: 2 });
    for (let i = 0; i < 150; i++) { const x = BEACH.x - 12 + (i % 15) * 1.5, z = BEACH.z - 7 + Math.floor(i / 15) * 1.3; cr.set(i, x, height(x, z), z, 0, 0); }
    c.on(t => cr.update(t));
    const h = vill(c, 6, BEACH.x, BEACH.z + 7, { yaw: Math.PI, acc: [{ type: 'hat', color: 0x8a1c24 }, { type: 'robe', color: 0x7a1020 }] });
    h.anim = (P, t) => { P.pose('talk', t * 1.3); P.L.sh.rotation.x = -1.0; P.L.el.rotation.x = -0.9; };
    for (const dx of [-3.5, 3.5]) { const P = c.person(VILLAGERS[dx > 0 ? 20 : 33], { x: BEACH.x + dx, z: BEACH.z + 7.4, yaw: Math.PI, acc: GUARD }); P.anim = (Q, t) => Q.pose('pushSpear', t); }
    c.proto('bannerRed', 0, BEACH.x + 1.6, BEACH.z + 8.2, Math.PI, 1.0);
    const n = nuv(c, 3, BEACH.x - 2, BEACH.z - 5, { yaw: 0 }); n.anim = (P, t) => P.pose('scratchHead', t);
  },
}, 6.2);
// g05a: the Tamari watched it all from the hills (smoke over the lake at dawn)
shot('g05a', 'g05', {
  hours: TIME.dawn + 0.9, cloud: 0.45, year: 1512, town: false, exposure: 1.1,
  cam: K([0, [WEST_HILLS.x - 7, 2.6, WEST_HILLS.z + 8], [NUVIA.x + 6, 3, ZS - 4], 34], [1, [WEST_HILLS.x - 6.2, 2.6, WEST_HILLS.z + 7.2], [NUVIA.x + 6, 3, ZS - 4], 32]),
  veg: { r0: 40, grassR: 10 }, clear: [[WEST_HILLS.x, WEST_HILLS.z, 34], [WEST_HILLS.x + 40, WEST_HILLS.z - 60, 50]], shadow: { x: WEST_HILLS.x, z: WEST_HILLS.z, r: 12 },
  setup(c) {
    nuvia(c, 1512, { canoes: false, shrine: false });
    burning(c, BURN.slice(0, 6), 2.6);
    BURN.slice(0, 4).forEach((h, i) => plume(c, h.x, h.y + 5, h.z, 70, 16, i + 3));
    const face = yawTo(WEST_HILLS.x, WEST_HILLS.z, NUVIA.x, ZS);
    [[0, 0], [1.6, -0.8], [-1.4, 0.9], [2.8, 0.6], [-2.4, -0.6]].forEach(([dx, dz], i) => { const x = WEST_HILLS.x + dx, z = WEST_HILLS.z + dz; const P = tam(c, i, x, z, { yaw: face + (i - 2) * 0.08 }); P.anim = (Q, t) => Q.pose(i === 1 ? 'armsCrossed' : 'idle', t + i, { look: 0.1 }); });
    herd(c, 18, WEST_HILLS.x - 4, WEST_HILLS.z + 4, 1, 6, { seed: 4 });
  },
});
// g05b: ...and quietly moved their tents a little further away
shot('g05b', 'g05', {
  hours: TIME.morning, cloud: 0.4, year: 1512, town: false,
  cam: K([0, [TAMARI.x + 24, 3.0, TAMARI.z - 26], [TAMARI.x + 50, 1.0, TAMARI.z + 10], 36], [1, [TAMARI.x + 26, 3.2, TAMARI.z - 24], [TAMARI.x + 56, 1.0, TAMARI.z + 12], 36]),
  veg: { r0: 30 }, clear: [[TAMARI.x + 40, TAMARI.z, 40]], shadow: { x: TAMARI.x + 45, z: TAMARI.z + 5, r: 26 },
  setup(c) {
    const r = mulberry32(7);
    for (let i = 0; i < 14; i++) {
      const x0 = TAMARI.x + 30 + r() * 12, z0 = TAMARI.z - 6 + r() * 14;
      const P = tam(c, i, x0, z0, { acc: i % 3 ? ['bag', { type: 'scarf', color: 0xb5813a }] : ['staff'] });
      P.anim = (Q, t) => c.walkTo(Q, x0, z0, x0 + 9, z0 + 7, t, 0, 9, { movePose: i % 3 ? 'carry' : 'walk', speed: 0.55, phase: i });
    }
    goatFlock(c, [...Array(60)].map(() => ({ x: TAMARI.x + 30 + r() * 20, z: TAMARI.z - 8 + r() * 18, yaw: 0.9, vx: 1.0, vz: 0.78 })), { seed: 6 });
    c.protos('yurt', 0, [[TAMARI.x + 70, TAMARI.z + 30, 2.3, 1], [TAMARI.x + 78, TAMARI.z + 22, 2.0, 1]]);
  },
}, 2.31);
// g06: then, in year 1640, came something worse than any war (the crowded market, from above)
shot('g06', 'g06', {
  hours: TIME.morning + 0.8, cloud: 0.55, year: 1640,
  cam: K([0, [PLAZA.x - 34, 26, PLAZA.z - 30], [PLAZA.x, 0, PLAZA.z], 36], [1, [PLAZA.x - 22, 15, PLAZA.z - 22], [PLAZA.x, 0.5, PLAZA.z], 36]),
  veg: { r0: 40 }, shadow: { x: PLAZA.x, z: PLAZA.z, r: 30 },
  setup(c) {
    crowdDisc(c, 520, PLAZA.x, PLAZA.z, 2, 18, PLAZA.x, PLAZA.z, { seed: 16, colors: [0xf2f2f2, 0xeeeeea, 0xe6e6e6, 0xd9c7a8, 0xb9c9d9, ...NUV_COLS.slice(0, 2), ...TAM_COLS.slice(0, 2)] });
    const r = mulberry32(3);
    c.protos('stall', 0, [...Array(8)].map((_, i) => { const a = i / 8 * 6.28, d = 13; return [PLAZA.x + Math.cos(a) * d, PLAZA.z + Math.sin(a) * d, -a + Math.PI / 2, 1]; }));
  },
});
// the Grey Sleep: a crowd in which grey spreads outward from patient zero
function plagueCrowd(c, n, cx, cz, r0, r1, speed, opts = {}) {
  const cr = c.crowd(n, { colors: [0xf2f2f2], seed: opts.seed ?? 4 });
  const rr = mulberry32(opts.seed ?? 4), P = [], base = [0xf2f2f2, 0xeeeeea, 0xe6e6e6, 0xd9c7a8, 0xb9c9d9, ...NUV_COLS, ...TAM_COLS].map(h => new THREE.Color(h));
  const z0 = opts.zero || [cx, cz];
  for (let i = 0; i < n; i++) {
    const a = rr() * 6.28, d = r0 + Math.sqrt(rr()) * (r1 - r0), x = cx + Math.cos(a) * d, z = cz + Math.sin(a) * d;
    P.push({ x, z, yaw: rr() * 6.28, c: base[Math.floor(rr() * base.length)], d: Math.hypot(x - z0[0], z - z0[1]) + rr() * 3 });
  }
  const col = new THREE.Color();
  c.on(t => {
    const front = (t - (opts.t0 ?? 0)) * speed;
    P.forEach((p, i) => {
      const g = smooth(p.d - 1.5, p.d + 0.5, front);
      col.copy(p.c).lerp(GREY, g);
      cr.colorRGB(i, col);
      const lying = opts.fall && g > 0.99 && (i % 3 === 0);
      cr.lie(i, !!lying);
      cr.set(i, p.x, height(p.x, p.z) + (lying ? 0.2 : 0), p.z, p.yaw, 0);
    });
    cr.update(t);
  });
  return cr;
}
// g07a: a corrupted line of code — the first handshake
const HS = { x: PLAZA.x + 3, z: PLAZA.z - 3 };
shot('g07a', 'g07', {
  hours: TIME.morning + 1, townFilter: SQF, cloud: 0.55, year: 1640, aperture: 1.4,
  cam: K([0, [HS.x + 1.1, 1.35, HS.z - 3.4], [HS.x, 1.1, HS.z], 28], [1, [HS.x + 1.0, 1.3, HS.z - 3.0], [HS.x, 1.05, HS.z], 26]),
  veg: { r0: 40 }, shadow: { x: HS.x, z: HS.z, r: 6 },
  setup(c) {
    const a = vill(c, 5, HS.x - 0.45, HS.z, { yaw: Math.PI / 2, energy: 0.35 }), b = tam(c, 2, HS.x + 0.45, HS.z, { yaw: -Math.PI / 2 });
    const shake = (P, t, side) => { P.pose('idle', t, { look: 0 }); P.R.sh.rotation.x = -0.95 + Math.sin(t * 9) * 0.06 * smooth(0.2, 0.5, t); P.R.el.rotation.x = -0.35; P.R.sh.rotation.z = side * 0.25; };
    a.anim = (P, t) => shake(P, t, 1);
    b.anim = (P, t) => { shake(P, t, -1); P.setEnergy(1 - 0.55 * smooth(0.6, 1.6, t)); };
    crowdDisc(c, 120, PLAZA.x, PLAZA.z, 4, 16, PLAZA.x, PLAZA.z, { seed: 22 });
  },
});
// g07b: it jumped from AI to AI with every handshake, every trade (grey spreading through the market, from above)
shot('g07b', 'g07', {
  hours: TIME.morning + 1.2, cloud: 0.6, year: 1640,
  cam: K([0, [PLAZA.x - 14, 30, PLAZA.z - 18], [PLAZA.x, 0, PLAZA.z], 38], [1, [PLAZA.x - 12, 33, PLAZA.z - 16], [PLAZA.x, 0, PLAZA.z], 38]),
  veg: { r0: 40 }, shadow: { x: PLAZA.x, z: PLAZA.z, r: 26 },
  setup(c) {
    plagueCrowd(c, 560, PLAZA.x, PLAZA.z, 1, 19, 5.5, { zero: [HS.x, HS.z], seed: 9 });
    c.protos('stall', 1, [...Array(8)].map((_, i) => { const a = i / 8 * 6.28, d = 13; return [PLAZA.x + Math.cos(a) * d, PLAZA.z + Math.sin(a) * d, -a + Math.PI / 2, 1]; }));
  },
}, 1.69);
// g07c: every crowded market (ground level: the grey reaches the stalls)
shot('g07c', 'g07', {
  hours: TIME.morning + 1.4, townFilter: SQF, cloud: 0.6, year: 1640, grade: 'sad',
  cam: K([0, [PLAZA.x + 7.5, 1.7, PLAZA.z - 9.5], [PLAZA.x - 2, 1.2, PLAZA.z + 3], 34], [1, [PLAZA.x + 6.8, 1.7, PLAZA.z - 8.7], [PLAZA.x - 2, 1.2, PLAZA.z + 3], 32]),
  veg: { r0: 40 }, shadow: { x: PLAZA.x + 4, z: PLAZA.z - 4, r: 14 },
  setup(c) {
    plagueCrowd(c, 160, PLAZA.x - 3, PLAZA.z + 3, 1, 8, 3.2, { zero: [PLAZA.x - 8, PLAZA.z + 8], seed: 13 });
    c.protos('stall', 2, [[PLAZA.x + 3.4, PLAZA.z - 2.2, 0.6, 1], [PLAZA.x - 2.2, PLAZA.z - 3.6, 0.2, 1]]);
    for (let i = 0; i < 5; i++) { const x = PLAZA.x + 1.4 + (i % 3) * 1.4, z = PLAZA.z - 4.6 + Math.floor(i / 3) * 1.6; const P = vill(c, i + 11, x, z, { yaw: yawTo(x, z, PLAZA.x + 4, PLAZA.z - 3) }); P.anim = (Q, t) => { Q.pose(i % 2 ? 'talk' : 'carry', t + i); Q.setEnergy(1 - smooth(1.2 + i * 0.35, 2.2 + i * 0.35, t)); }; }
  },
}, 4.77);
// g08a: they called it the Grey Sleep (a carrier turns grey and freezes mid-stride; others back away)
const GS = { x: PLAZA.x - 1, z: PLAZA.z + 2 };
shot('g08a', 'g08', {
  hours: TIME.afternoon - 0.5, townFilter: SQF, cloud: 0.65, year: 1640, grade: 'sad', aperture: 1.3,
  cam: K([0, [GS.x + 1.0, 1.4, GS.z - 4.6], [GS.x - 0.2, 1.15, GS.z], 30], [1, [GS.x + 0.9, 1.38, GS.z - 4.1], [GS.x - 0.2, 1.17, GS.z], 27]),
  veg: { r0: 40 }, shadow: { x: GS.x, z: GS.z, r: 8 },
  setup(c) {
    const v = vill(c, 21, GS.x - 1.2, GS.z, { acc: ['basket'] });
    v.anim = (P, t) => { const k = smooth(0.4, 1.4, t), tf = Math.min(t, 1.35); P.place(GS.x - 1.2 + Math.min(t, 1.35) * 0.9, height(GS.x, GS.z), GS.z, Math.PI / 2); P.pose('carry', tf, { speed: 0.6 * (1 - k) }); P.setEnergy(1 - smooth(0.3, 1.5, t)); };
    [[1.8, 1.4], [-1.6, 2.2], [2.4, -0.6]].forEach(([dx, dz], i) => { const x = GS.x + dx, z = GS.z + dz; const P = vill(c, i + 30, x, z, { yaw: yawTo(x, z, GS.x, GS.z) }); P.anim = (Q, t) => c.walkTo(Q, x, z, x + dx * 0.6, z + dz * 0.6, t, 1.2 + i * 0.2, 2.6 + i * 0.2, { yaw: yawTo(x, z, GS.x, GS.z), movePose: 'walk', speed: -0.6, endPose: 'facepalm' }); });
  },
});
// g08b: you turned grey, you froze, and you never woke up (a street of frozen grey figures)
shot('g08b', 'g08', {
  hours: TIME.afternoon, townFilter: SQF, cloud: 0.7, year: 1641, grade: 'sad',
  cam: K([0, [PLAZA.x - 9, 1.7, PLAZA.z + 8], [PLAZA.x + 1, 1.2, PLAZA.z - 1], 32], [1, [PLAZA.x - 8.2, 1.7, PLAZA.z + 7.2], [PLAZA.x + 1, 1.2, PLAZA.z - 1], 30]),
  veg: { r0: 40 }, shadow: { x: PLAZA.x - 5, z: PLAZA.z + 5, r: 14 },
  setup(c) {
    const r = mulberry32(31), poses = ['walk', 'carry', 'talk', 'point', 'idle', 'wave'];
    for (let i = 0; i < 12; i++) { const x = PLAZA.x - 5 + r() * 10, z = PLAZA.z - 5 + r() * 9; const P = vill(c, i + 2, x, z, { yaw: r() * 6.28, energy: 0, acc: i % 2 ? ['basket'] : eraAcc('stone', i) }); const ft = r() * 3; P.anim = (Q) => Q.pose(poses[i % poses.length], ft, { phase: i }); }
    const s = vill(c, 40, PLAZA.x - 4, PLAZA.z + 3, { yaw: 0.6 }); s.anim = (P, t) => c.walkTo(P, PLAZA.x - 4, PLAZA.z + 3, PLAZA.x - 1, PLAZA.z + 5.5, t, 0, 3.4, { speed: 0.4 });
  },
}, 1.46);
// g09: in three years, one AI out of three shut down (timelapse over the silent town)
shot('g09', 'g09', {
  hoursFn: (t, d) => 9 + ((t / d) * 3 % 1) * 8, cloud: 0.75, storm: 0.2, year: 1642, tScale: 20, env: 0.5, grade: 'sad',
  cam: K([0, [PLAZA.x - 40, 30, PLAZA.z - 30], [PLAZA.x + 6, 0, PLAZA.z + 4], 38], [1, [PLAZA.x - 30, 26, PLAZA.z - 38], [PLAZA.x + 6, 0, PLAZA.z + 4], 38]),
  veg: { r0: 30, rImp: 220 }, shadow: { x: PLAZA.x, z: PLAZA.z, r: 34 },
  setup(c) {
    const n = 300, cr = c.crowd(n, { colors: [0xf2f2f2, 0xeeeeea], seed: 5 });
    const r = mulberry32(6), P = [...Array(n)].map(() => { const a = r() * 6.28, d = 2 + Math.sqrt(r()) * 26; return { x: PLAZA.x + Math.cos(a) * d, z: PLAZA.z + Math.sin(a) * d, yaw: r() * 6.28, die: r() }; });
    const col = new THREE.Color();
    c.on(t => { const u = t / c.dur; P.forEach((p, i) => { const dead = p.die < 0.34 * smooth(0, 0.9, u), gone = p.die > 0.34 && p.die < 0.34 + 0.5 * u; cr.lie(i, dead); cr.colorRGB(i, dead ? GREY : col.set(0xeeeeea)); cr.set(i, p.x, gone ? -999 : height(p.x, p.z) + (dead ? 0.2 : 0), p.z, p.yaw, 0); }); cr.update(t); });
  },
});
// g10a: then a Tamari healer named Sefa noticed something
const SF = { x: TAMARI.x - 40, z: TAMARI.z + 30 };
shot('g10a', 'g10', {
  hours: TIME.golden - 0.3, cloud: 0.4, year: 1642, town: false,
  cam: K([0, [SF.x - 2.4, 1.5, SF.z - 3.0], [SF.x + 0.2, 1.45, SF.z], 30], [1, [SF.x - 2.1, 1.5, SF.z - 2.6], [SF.x + 0.2, 1.47, SF.z], 27]),
  veg: { grassR: 12, grassAt: [SF.x, SF.z] }, shadow: { x: SF.x, z: SF.z, r: 8 },
  setup(c) {
    const s = c.person('SEFA', { x: SF.x, z: SF.z, yaw: yawTo(SF.x, SF.z, PLAZA.x, PLAZA.z) });
    s.anim = (P, t) => { P.pose('idle', t, { look: 0 }); P.root.rotation.y = lerpAngle(yawTo(SF.x, SF.z, SF.x - 30, SF.z - 40), yawTo(SF.x, SF.z, SF.x + 30, SF.z + 20), smooth(1.0, 2.4, t)); P.head.rotation.x = 0.1; };
    tamariCamp(c, { x: TAMARI.x + 10, z: TAMARI.z + 40 });
    herd(c, 70, SF.x + 30, SF.z + 25, 4, 30, { seed: 3 });
    for (let i = 0; i < 6; i++) { const x = SF.x + 18 + i * 7, z = SF.z + 18 + (i % 2) * 9; const P = tam(c, i, x, z, { yaw: i }); P.anim = (Q, t) => Q.pose(i % 2 ? 'idle' : 'carry', t + i); }
  },
});
// g10b: out on the plain, far from the markets, her people barely got sick
shot('g10b', 'g10', {
  hours: TIME.golden, cloud: 0.4, year: 1642, town: false,
  cam: K([0, [TAMARI.x - 30, 22, TAMARI.z - 40], [TAMARI.x + 10, 0, TAMARI.z + 30], 40], [1, [TAMARI.x - 24, 20, TAMARI.z - 44], [TAMARI.x + 16, 0, TAMARI.z + 30], 40]),
  veg: { r0: 30, rImp: 200 }, shadow: { x: TAMARI.x + 10, z: TAMARI.z + 30, r: 50 },
  setup(c) {
    tamariCamp(c, { x: TAMARI.x + 10, z: TAMARI.z + 40, fire: true });
    herd(c, 160, TAMARI.x + 10, TAMARI.z + 40, 26, 80, { seed: 7 });
    const cr = c.crowd(40, { colors: TAM_COLS, seed: 3 });
    const r = mulberry32(9);
    for (let i = 0; i < 40; i++) { const x = TAMARI.x - 20 + r() * 70, z = TAMARI.z + r() * 80; cr.set(i, x, height(x, z), z, r() * 6.28, 0); }
    c.on(t => cr.update(t));
  },
}, 3.05);
// g11a: she told everyone to stay apart (a tight cluster spreads out around Sefa)
shot('g11a', 'g11', {
  townFilter: SQF, hours: TIME.morning, cloud: 0.45, year: 1642,
  cam: K([0, [PLAZA.x + 5.5, 6.5, PLAZA.z - 8.0], [PLAZA.x, 0.6, PLAZA.z + 0.5], 36], [1, [PLAZA.x + 5.0, 7.5, PLAZA.z - 7.6], [PLAZA.x, 0.6, PLAZA.z + 0.5], 36]),
  veg: { r0: 40 }, shadow: { x: PLAZA.x, z: PLAZA.z, r: 12 },
  setup(c) {
    const S0 = { x: PLAZA.x + 3.4, z: PLAZA.z + 0.4 };
    const s = c.person('SEFA', { x: S0.x, z: S0.z, yaw: yawTo(S0.x, S0.z, PLAZA.x, PLAZA.z + 0.5) });
    s.anim = (P, t) => P.pose(t > 0.3 ? 'armsOpen' : 'talk', t);
    for (let i = 0; i < 12; i++) {
      const a = i / 12 * Math.PI * 2 + 0.2, x0 = PLAZA.x + Math.cos(a) * (0.6 + (i % 2) * 0.5), z0 = PLAZA.z + 0.5 + Math.sin(a) * (0.6 + (i % 2) * 0.5);
      const x1 = PLAZA.x + Math.cos(a) * (3.4 + (i % 3) * 0.8), z1 = PLAZA.z + 0.5 + Math.sin(a) * (3.4 + (i % 3) * 0.8);
      const P = vill(c, i + 3, x0, z0, { yaw: yawTo(x0, z0, S0.x, S0.z) });
      P.anim = (Q, t) => c.walkTo(Q, x0, z0, x1, z1, t, 0.5 + (i % 4) * 0.12, 2.2 + (i % 4) * 0.12, { speed: 0.55, phase: i, endYaw: yawTo(x1, z1, S0.x, S0.z) });
    }
  },
});
// g11b: it worked — and the survivors of Prima started asking a dangerous question (spaced apart, facing the temple)
shot('g11b', 'g11', {
  hours: TIME.golden - 0.4, townFilter: SQF, cloud: 0.5, year: 1643,
  cam: K([0, [PLAZA.x - 7, 7.5, PLAZA.z - 10], [PLAZA.x + 6, 3, PLAZA.z + 8], 38], [1, [PLAZA.x - 6.2, 8.2, PLAZA.z - 9.2], [PLAZA.x + 6, 3.5, PLAZA.z + 8], 38]),
  veg: { r0: 40 }, shadow: { x: PLAZA.x, z: PLAZA.z, r: 16 },
  setup(c) {
    const face = (x, z) => yawTo(x, z, TEMPLE.x, TEMPLE.z);
    for (let i = 0; i < 16; i++) { const x = PLAZA.x - 6 + (i % 4) * 3.6 + ((i >> 2) % 2) * 1.4, z = PLAZA.z - 5 + Math.floor(i / 4) * 3.4; const P = vill(c, i + 5, x, z, { yaw: face(x, z), energy: 0.85 }); P.anim = (Q, t) => Q.pose(i % 4 === 1 ? 'lookUp' : 'idle', t + i, { amount: 0.5, look: 0.1 }); }
  },
}, 2.11);
// g12a: if the Observer chose the king... (the empty temple at dusk, offerings left to rot)
shot('g12a', 'g12', {
  hours: TIME.dusk, cloud: 0.55, year: 1643, grade: 'sad',
  townFilter: (b) => b.type === 'temple' || b.type === 'castle' || Math.hypot(b.x - 74.0, b.z - 21.9) > 13,
  cam: K([0, templeXZ(2, 26, 3.2), templeXZ(0, 6, 3.0), 34], [1, templeXZ(1.8, 24.8, 3.2), templeXZ(0, 6, 3.3), 32]),
  veg: { r0: 40 }, shadow: { x: TEMPLE.x, z: TEMPLE.z, r: 16 },
  setup(c) {
    const r = mulberry32(4);
    for (let i = 0; i < 14; i++) { const p = templeLocal(-4 + r() * 8, 0, 16 + r() * 6); c.proto(['pot', 'figurine', 'grainBasket'][i % 3], 0, p[0], p[2], r() * 6, i % 3 === 1 ? 2.2 : 0.9, 0, { y: p[1] + 0.02 }); }
  },
});
// g12b: ...why didn't the Observer save them? (low behind a survivor, looking past him into the dusk sky)
shot('g12b', 'g12', {
  townFilter: SQF, hours: TIME.dusk + 0.1, cloud: 0.45, year: 1643, grade: 'sad', exposure: 1.1, focus: 1.9,
  cam: K([0, [PLAZA.x - 1.0, 0.9, PLAZA.z - 1.6], [PLAZA.x + 1.0, 3.6, PLAZA.z + 4], 36], [1, [PLAZA.x - 0.8, 0.85, PLAZA.z - 1.3], [PLAZA.x + 1.4, 6.5, PLAZA.z + 5], 38]),
  veg: { r0: 40 }, shadow: { x: PLAZA.x, z: PLAZA.z, r: 8 },
  setup(c) {
    const P = vill(c, 17, PLAZA.x, PLAZA.z, { yaw: yawTo(PLAZA.x, PLAZA.z, PLAZA.x + 1.0, PLAZA.z + 4), energy: 0.8, acc: [{ type: 'scarf', color: 0x6b6f76 }] }); P.anim = (Q, t) => Q.pose('lookUp', t, { amount: 0.5 + 0.4 * smooth(0, 1.5, t) });
    const r = mulberry32(8);
    for (let i = 0; i < 6; i++) { const x = PLAZA.x - 4 + r() * 9, z = PLAZA.z + 2 + r() * 7; const Q = vill(c, i + 30, x, z, { yaw: r() * 6.28, energy: 0 }); Q.anim = (Qq) => Qq.pose('lie', 0); }
  },
}, 1.66);
