// The director: loads a shot (world state, camera-optimised terrain/vegetation, actors)
// and renders it at a given local time. Called by the Python frame driver.
import * as THREE from 'three';
import { E } from './main.js';
import { height, isWater } from './lib/terrain.js';
import { Person, CAST } from './lib/people.js';
import { makeAnimal, Flock } from './lib/animals.js';
import { Fire, TorchField, lightningBolt, Rain } from './lib/fx.js';
import { Crowd } from './lib/crowd.js';
import { drawGroundMap, GROUND_UNIFORMS, inFieldAt, nearRoadAt } from './lib/groundmap.js';
import { PROTO, buildingMaterial } from './lib/buildings.js';
import { SHOTS } from './shots/index.js';

import { K, orbitCam, easeInOut } from './lib/camtools.js';
export { K, orbitCam, easeInOut };

const shakeV = new THREE.Vector3();
function applyShake(cam, t, amt) {
  if (!amt) return;
  shakeV.set(Math.sin(t * 13.1) + Math.sin(t * 7.3) * 0.5, Math.sin(t * 11.7 + 1) + Math.sin(t * 5.9) * 0.5, Math.sin(t * 9.4 + 2)).multiplyScalar(amt);
  cam.target.add(shakeV);
}

// ---------------------------------------------------------------- shot context
const POOL = new Map();
class Ctx {
  constructor(id, dur, markers, spec) {
    this.id = id; this.dur = dur; this.markers = markers || {}; this.spec = spec;
    this.objects = []; this.updates = []; this.people = []; this.E = E; this.THREE = THREE;
    this.year = spec.year ?? 0;
  }
  m(segId, dflt = 0) { return this.markers[segId] ?? dflt; }
  h(x, z) { return height(x, z); }
  add(o) { E.world.add(o); this.objects.push(o); return o; }
  on(fn) { this.updates.push(fn); return fn; }
  person(who, o = {}) {
    const key = who + '|' + JSON.stringify(o.acc || []) + '|' + (o.color ?? '') + '|' + (o.scale ?? '');
    let list = POOL.get(key); if (!list) POOL.set(key, list = []);
    let P = list.find(p => !p._used);
    if (!P) { P = new Person({ ...CAST[who], ...(o.color !== undefined ? { color: o.color } : {}), ...(o.scale ? { scale: o.scale } : {}), acc: o.acc || [] }); list.push(P); }
    P._used = true;
    P.setEnergy(o.energy ?? 1);
    for (const k of Object.keys(P.props)) P.props[k].visible = true;
    const x = o.x ?? 0, z = o.z ?? 0;
    P.place(x, height(x, z) + (o.dy ?? 0), z, o.yaw ?? 0);
    P.pose(o.pose || 'idle', 0, o.p || {});
    P.anim = o.anim || null;     // (P, t) => {...}
    E.world.add(P.root); this.people.push(P);
    return P;
  }
  walkTo(P, x0, z0, x1, z1, t, t0, t1, opts = {}) {   // move a person along a segment between times t0..t1
    const u = Math.min(1, Math.max(0, (t - t0) / Math.max(1e-3, t1 - t0)));
    const x = x0 + (x1 - x0) * u, z = z0 + (z1 - z0) * u;
    const yaw = Math.atan2(x1 - x0, z1 - z0);
    P.place(x, height(x, z), z, opts.yaw ?? yaw);
    const moving = u > 0 && u < 1;
    P.pose(moving ? (opts.run ? 'run' : 'walk') : (opts.endPose || 'idle'), t, { phase: opts.phase || 0, speed: opts.speed || 1 });
    return moving;
  }
  animal(kind, seed, x, z, yaw = 0, opts = {}) {
    const a = makeAnimal(kind, seed, opts);
    a.root.position.set(x, height(x, z), z); a.root.rotation.y = yaw;
    this.add(a.root); return a;
  }
  fire(x, z, opts = {}) {
    const f = new Fire(opts); f.group.position.set(x, height(x, z) + (opts.dy ?? 0.05), z);
    this.add(f.group); this.on(t => f.update(t)); return f;
  }
  crowd(n, opts = {}) { const c = new Crowd(n, opts); this.add(c.mesh); return c; }
  proto(type, v, x, z, yaw = 0, s = 1, dy = 0) {
    const m = new THREE.Mesh(PROTO[type][v % PROTO[type].length], buildingMaterial());
    m.position.set(x, height(x, z) + dy, z); m.rotation.y = yaw; m.scale.setScalar(s);
    m.castShadow = true; m.receiveShadow = true; return this.add(m);
  }
  dispose() {
    for (const o of this.objects) E.world.remove(o);
    for (const P of this.people) { E.world.remove(P.root); P._used = false; }
  }
}

// ---------------------------------------------------------------- loading
let CUR = null;
const GM_CACHE = new Map();
function groundMapFor(year, extraKey, extra) {
  const k = Math.round(year) + '|' + (extraKey || '');
  if (!GM_CACHE.has(k)) { if (GM_CACHE.size > 6) { const [k0, v0] = GM_CACHE.entries().next().value; v0.dispose(); GM_CACHE.delete(k0); } GM_CACHE.set(k, drawGroundMap(year, extra ? { extra } : {})); }
  return GM_CACHE.get(k);
}

window.loadShot = function (id, dur, markers) {
  const spec = SHOTS[id];
  if (!spec) throw new Error('unknown shot ' + id);
  if (CUR) CUR.ctx.dispose();
  const ctx = new Ctx(id, dur, markers, spec);
  // atmosphere
  E.atmo.set(spec.hours ?? 11, { cloud: spec.cloud ?? 0.4, storm: spec.storm ?? 0, fog: spec.fog, azimuth: spec.azimuth });
  E.exposureMul = spec.exposure ?? 1.0;
  E.envIntensity = spec.env ?? 0.85;
  // camera samples
  const camFn = spec.cam;
  const samples = [0, 0.25, 0.5, 0.75, 1].map(u => camFn(u * dur, dur));
  const views = samples.map(c => {
    const d = c.target.clone().sub(c.pos);
    return { x: c.pos.x, z: c.pos.z, yaw: Math.atan2(d.x, d.z), half: THREE.MathUtils.degToRad(c.fov * 16 / 9 / 2) + 0.18, pitch: Math.atan2(d.y, Math.hypot(d.x, d.z)) };
  });
  const mid = views[2];
  // terrain
  const top = spec.top ?? (mid.pitch < -0.9);
  let yawMin = Infinity, yawMax = -Infinity;
  for (const v of views) { let dy = v.yaw - mid.yaw; dy = Math.atan2(Math.sin(dy), Math.cos(dy)); yawMin = Math.min(yawMin, dy - v.half); yawMax = Math.max(yawMax, dy + v.half); }
  const camPos = new THREE.Vector3(); samples.forEach(c => camPos.add(c.pos)); camPos.multiplyScalar(1 / samples.length);
  if (top) E.buildTerrainAt(mid.x, mid.z, spec.inner ?? 220, spec.n ?? 256, spec.outer ?? 3600);
  else E.buildTerrainView({ x: camPos.x, z: camPos.z, yaw: mid.yaw + (yawMin + yawMax) / 2, half: Math.min(Math.PI, (yawMax - yawMin) / 2 + 0.05) }, { nr: spec.nr ?? 170, na: spec.na ?? 110, split: spec.split ?? 150 });
  // town + ground map
  const year = spec.year ?? 0;
  if (spec.town !== false && year >= 40) {
    E.town.group.visible = true;
    const vis = E.town.build(year, { filter: spec.townFilter });
    ctx.townVis = vis;
    GROUND_UNIFORMS.uGround.value = groundMapFor(year, spec.groundKey, spec.groundExtra);
    GROUND_UNIFORMS.uGroundOn.value = 1;
  } else { E.town.group.visible = false; ctx.townVis = []; GROUND_UNIFORMS.uGroundOn.value = spec.groundExtra ? 1 : 0; if (spec.groundExtra) GROUND_UNIFORMS.uGround.value = groundMapFor(year, spec.groundKey, spec.groundExtra); }
  // vegetation (exclude town footprint, fields, roads, custom clearings)
  const bh = new Map();
  for (const b of (ctx.townVis || [])) { const k = Math.floor(b.x / 12) * 10000 + Math.floor(b.z / 12); if (!bh.has(k)) bh.set(k, []); bh.get(k).push(b); }
  const nearBuilding = (x, z) => { const gx = Math.floor(x / 12), gz = Math.floor(z / 12); for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) { const l = bh.get((gx + i) * 10000 + gz + j); if (l) for (const b of l) if ((b.x - x) ** 2 + (b.z - z) ** 2 < (b.type === 'castle' ? 900 : b.type === 'temple' ? 500 : 64)) return true; } return false; };
  const clear = spec.clear || [];
  const exclude = (x, z) => {
    for (const [cx, cz, r] of clear) if ((x - cx) ** 2 + (z - cz) ** 2 < r * r) return true;
    if (year >= 40) { if (inFieldAt(x, z, year)) return true; if (nearRoadAt(x, z, year, 2.5)) return true; if (nearBuilding(x, z)) return true; }
    return false;
  };
  const vg = spec.veg || {};
  const c0 = samples[0];
  const dir0 = c0.target.clone().sub(c0.pos); dir0.y = 0; dir0.normalize();
  const gR = vg.grassR ?? 0;
  const gc = vg.grassAt || [c0.pos.x + dir0.x * gR * 0.6, c0.pos.z + dir0.z * gR * 0.6];
  const cone = (x, z) => { for (const c of samples) { const ax = x - c.pos.x, az = z - c.pos.z, al = Math.hypot(ax, az); const d = c.target.clone().sub(c.pos); const dl = Math.hypot(d.x, d.z) || 1; if (al < 3 || (ax * d.x + az * d.z) / (al * dl) > 0.55) return true; } return false; };
  E.veg.build({ cx: camPos.x, cz: camPos.z }, { r0: vg.r0 ?? 55, r1: vg.r1 ?? 260, rImp: vg.rImp ?? 150, rFar: vg.rFar ?? 2200, grassR: gR, grassCenter: gc, grassCone: cone,
    grassStep: vg.grassStep ?? 0.6, flowers: vg.flowers ?? 0.05, views: top ? null : views, exclude, extraTrees: vg.extra, treeStep: vg.treeStep });
  // shadow focus
  const sf = spec.shadow || { x: mid.x + Math.sin(mid.yaw) * 25, z: mid.z + Math.cos(mid.yaw) * 25, r: 70 };
  E.atmo.focusShadow(sf.x, height(sf.x, sf.z), sf.z, sf.r);
  // actors
  const upd = spec.setup ? spec.setup(ctx) : null;
  if (upd) ctx.updates.push(upd);
  CUR = { id, spec, ctx, camFn, dur };
  return { tris: E.veg.tris, town: ctx.townVis.length };
};

let lastEnvH = -99;
window.renderShot = function (t) {
  const { spec, ctx, camFn, dur } = CUR;
  if (spec.hoursFn) {
    const h = spec.hoursFn(t, dur);
    E.atmo.set(h, { cloud: spec.cloud ?? 0.4, storm: spec.storm ?? 0, fog: spec.fog, azimuth: spec.azimuth });
    if (Math.abs(h - lastEnvH) > 0.75) { lastEnvH = h; E.atmo.envDirty = true; } else E.atmo.envDirty = false;
  }
  const c = camFn(t, dur);
  applyShake(c, t, typeof spec.shake === 'function' ? spec.shake(t, ctx) : (spec.shake || 0));
  for (const fn of ctx.updates) fn(t);
  for (const P of ctx.people) if (P.anim) P.anim(P, t);
  E.camera.position.copy(c.pos); E.camera.up.set(0, 1, 0);
  E.camera.lookAt(c.target);
  if (c.roll) E.camera.rotateZ(c.roll);
  E.camera.fov = c.fov; E.camera.updateProjectionMatrix();
  E.render((spec.tOffset ?? 0) + t);
  return true;
};
