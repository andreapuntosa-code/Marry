// The director: loads a shot (world state, camera-optimised terrain/vegetation, actors)
// and renders it at a given local time. Called by the Python frame driver.
import * as THREE from 'three';
import { E, FILM } from './main.js';
import { height, isWater, waterMaterial } from './lib/terrain.js';
import { Person, CAST } from './lib/people.js';
import * as PEOPLE from './lib/people.js';
window.PEOPLE = PEOPLE; window.THREE_ = THREE;
import { makeAnimal, Flock } from './lib/animals.js';
import { Fire, TorchField, lightningBolt, Rain } from './lib/fx.js';
import { Crowd } from './lib/crowd.js';
import { drawGroundMap, GROUND_UNIFORMS, inFieldAt, nearRoadAt } from './lib/groundmap.js';
import { PROTO, buildingMaterial, townState } from './lib/buildings.js';
import { SHOTS } from './shots/index.js';

import { K, orbitCam, easeInOut } from './lib/camtools.js';
export { K, orbitCam, easeInOut };

const shakeV = new THREE.Vector3();
function applyShake(cam, t, amt) {
  if (!amt) return;
  shakeV.set(Math.sin(t * 13.1) + Math.sin(t * 7.3) * 0.5, Math.sin(t * 11.7 + 1) + Math.sin(t * 5.9) * 0.5, Math.sin(t * 9.4 + 2)).multiplyScalar(amt);
  cam.target.add(shakeV);
}
const tmpV = new THREE.Vector3();

// ---------------------------------------------------------------- shot context
const POOL = new Map();
class Ctx {
  constructor(id, dur, markers, spec) {
    this.id = id; this.dur = dur; this.markers = markers || {}; this.spec = spec;
    this.objects = []; this.updates = []; this.post = []; this.people = []; this.expo = []; this.owned = [];
    this.E = E; this.THREE = THREE;
    this.year = spec.year ?? 0;
    this.cam = null;
  }
  m(segId, dflt = 0) { return this.markers[segId] ?? dflt; }
  h(x, z) { return height(x, z); }
  add(o) { E.world.add(o); this.objects.push(o); return o; }
  own(g) { this.owned.push(g); return g; }
  on(fn) { this.updates.push(fn); return fn; }
  after(fn) { this.post.push(fn); return fn; }
  person(who, o = {}) {
    const def = CAST[who];
    if (!def) throw new Error('unknown person ' + who);
    const acc = o.acc ?? def.acc ?? [];
    const key = who + '|' + JSON.stringify(acc) + '|' + (o.color ?? '') + '|' + (o.scale ?? '') + '|' + (o.rough ?? '');
    let list = POOL.get(key); if (!list) POOL.set(key, list = []);
    let P = list.find(p => !p._used);
    if (!P) {
      P = new Person({ ...def, ...(o.color !== undefined ? { color: o.color } : {}), ...(o.scale ? { scale: o.scale } : {}), ...(o.rough ? { rough: o.rough } : {}), ...(o.id !== undefined ? { id: o.id } : {}), acc });
      list.push(P);
    }
    P._used = true;
    P.setEnergy(o.energy ?? 1);
    for (const k of Object.keys(P.props)) P.props[k].visible = true;
    P.root.visible = true;
    P.root.scale.setScalar((o.scale ?? def.scale ?? 1) * 0.92);
    const x = o.x ?? 0, z = o.z ?? 0;
    P._free = o.y !== undefined || o.dy !== undefined;
    P.place(x, (o.y !== undefined ? o.y : height(x, z) + (o.dy ?? 0)), z, o.yaw ?? 0);
    P.pose(o.pose || 'idle', 0, o.p || {});
    P.anim = o.anim || null;     // (P, t) => {...}
    E.world.add(P.root); this.people.push(P);
    return P;
  }
  // place at an absolute height (for steps, platforms, rooftops)
  personAt(who, x, yAbs, z, o = {}) { return this.person(who, { ...o, x, z, y: yAbs }); }
  walkTo(P, x0, z0, x1, z1, t, t0, t1, opts = {}) {   // move a person along a segment between times t0..t1
    const u = Math.min(1, Math.max(0, (t - t0) / Math.max(1e-3, t1 - t0)));
    const x = x0 + (x1 - x0) * u, z = z0 + (z1 - z0) * u;
    const yaw = Math.atan2(x1 - x0, z1 - z0);
    P.place(x, (opts.yFn ? opts.yFn(x, z, u) : height(x, z)), z, opts.yaw ?? yaw);
    const moving = u > 0 && u < 1;
    P.pose(moving ? (opts.run ? 'run' : (opts.movePose || 'walk')) : (u >= 1 ? (opts.endPose || 'idle') : (opts.startPose || 'idle')), t, { phase: opts.phase || 0, speed: opts.speed || 1, ...(opts.p || {}) });
    if (u >= 1 && opts.endYaw !== undefined) P.root.rotation.y = opts.endYaw;
    return moving;
  }
  animal(kind, seed, x, z, yaw = 0, opts = {}) {
    const a = makeAnimal(kind, seed, opts);
    a.root.position.set(x, height(x, z), z); a.root.rotation.y = yaw;
    this.add(a.root); return a;
  }
  // seat a person on a horse (the rider follows the horse body); returns the rider
  ride(P, horse, p = {}) {
    E.world.remove(P.root); horse.body.add(P.root);
    const sc = horse.spec.size;
    P.root.position.set(horse.seat[0], horse.seat[1], horse.seat[2]); P.root.rotation.set(0, 0, 0);
    P.root.scale.setScalar(0.92 * 0.95); P._ridden = horse; P._rp = p;
    P.anim = (Q, t) => Q.pose(p.pose || 'rideSeat', t, { gait: p.gait ?? 0, cadence: p.cadence ?? 7, phase: p.phase ?? 0, lean: p.lean ?? 0, look: p.look ?? 0 });
    return P;
  }
  fire(x, z, opts = {}) {
    const f = new Fire(opts); f.group.position.set(x, (opts.y !== undefined ? opts.y : height(x, z) + (opts.dy ?? 0.05)), z);
    this.add(f.group); this.on(t => f.update(t)); return f;
  }
  // a flame that follows a person's torch (or burning branch) every frame
  torch(P, opts = {}) {
    const f = new Fire({ size: opts.size ?? 0.32, n: opts.n ?? 12, emberN: opts.emberN ?? 8, light: opts.light ?? false, lightIntensity: opts.lightIntensity ?? 5, lightDist: opts.lightDist ?? 9, seed: opts.seed ?? 3 });
    this.add(f.group);
    const at = new THREE.Vector3(0, 0.36, 0);
    this.after(t => {
      const tp = P.props.torch;
      if (!tp || !P.root.visible) { f.group.visible = false; return; }
      f.group.visible = true;
      P.root.updateMatrixWorld(true);
      tp.localToWorld(tmpV.copy(tp.userData.flameAt || at));
      f.group.position.copy(tmpV);
      f.update(t);
    });
    return f;
  }
  crowd(n, opts = {}) { const c = new Crowd(n, opts); this.add(c.mesh); return c; }
  proto(type, v, x, z, yaw = 0, s = 1, dy = 0, opts = {}) {
    const m = new THREE.Mesh(PROTO[type][v % PROTO[type].length], buildingMaterial());
    m.position.set(x, (opts.y !== undefined ? opts.y : height(x, z) + dy), z); m.rotation.y = yaw; m.scale.setScalar(s);
    m.castShadow = opts.shadow ?? true; m.receiveShadow = true; return this.add(m);
  }
  // many copies of one prototype in a single draw call: items [[x, z, yaw, s, yAbs?], ...]
  protos(type, v, items, opts = {}) {
    const geo = PROTO[type][v % PROTO[type].length];
    const im = new THREE.InstancedMesh(geo, buildingMaterial(), items.length);
    const m = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(), p = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0);
    items.forEach(([x, z, yaw = 0, sc = 1, y], i) => { q.setFromAxisAngle(up, yaw); s.setScalar(sc); p.set(x, y !== undefined ? y : height(x, z) + (opts.dy ?? 0), z); im.setMatrixAt(i, m.compose(p, q, s)); });
    im.instanceMatrix.needsUpdate = true; im.castShadow = opts.shadow ?? true; im.receiveShadow = true; im.frustumCulled = false;
    return this.add(im);
  }
  rain(n = 4000, area = 70, opacity = 0.45) {
    const r = new Rain(n, area, 7); r.lines.material.opacity = opacity;
    this.add(r.lines); this.own(r.lines.geometry);
    this.on(t => { const p = this.cam ? this.cam.pos : E.camera.position; r.update(t, tmpV.set(p.x, p.y - 8, p.z)); });
    return r;
  }
  // lightning: visible for a few frames from t0; flashes the exposure
  bolt(from, to, t0, seed = 1) {
    const V = (p) => Array.isArray(p) ? new THREE.Vector3(p[0], p[1], p[2]) : p;
    const g = lightningBolt(V(from), V(to), seed, 3); g.visible = false; this.add(g);
    g.traverse(o => { if (o.isMesh) this.own(o.geometry); });
    this.on(t => { const d = t - t0; g.visible = d >= 0 && d < 0.32 && !(d > 0.1 && d < 0.16); });
    this.expo.push(t => { const d = t - t0; return d < 0 ? 1 : 1 + 2.6 * Math.exp(-d * 9) + (d > 0.16 && d < 0.3 ? 1.2 : 0); });
    return g;
  }
  flashAt(t0, amt = 6, decay = 7) { this.expo.push(t => { const d = t - t0; return d < 0 ? 1 : 1 + amt * Math.exp(-d * decay); }); }
  // a sheet of water (flood) whose level follows levelFn(t)
  water(x, z, w, d, levelFn, opts = {}) {
    const g = this.own(new THREE.PlaneGeometry(w, d, 1, 1)); g.rotateX(-Math.PI / 2);
    const mat = waterMaterial(); this.own(mat);
    mat.uniforms.uDeep.value.set(opts.deep ?? 0x3e3324); mat.uniforms.uShallow.value.set(opts.shallow ?? 0x66553a);
    const m = new THREE.Mesh(g, mat); m.renderOrder = 1; m.frustumCulled = false;
    m.position.set(x, levelFn(0), z); this.add(m);
    const keys = ['uTime', 'uSunDir', 'uSunCol', 'uSky', 'uHorizon', 'fogColor', 'fogDensity'];
    const dim = opts.dim ?? 0.6;
    this.after(t => { m.position.y = levelFn(t); for (const k of keys) { const v = E.water.uniforms[k].value; if (v && v.copy) mat.uniforms[k].value.copy(v); else mat.uniforms[k].value = v; } mat.uniforms.uSky.value.multiplyScalar(dim); mat.uniforms.uHorizon.value.multiplyScalar(dim); });
    return m;
  }
  mesh(geo, mat, x, y, z) { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; this.own(geo); return this.add(m); }
  dispose() {
    for (const o of this.objects) { E.world.remove(o); if (o.isInstancedMesh) o.dispose(); }
    for (const g of this.owned) g.dispose && g.dispose();
    for (const P of this.people) { if (P._ridden) { P._ridden.body.remove(P.root); P._ridden = null; } E.world.remove(P.root); P._used = false; }
  }
}

// ---------------------------------------------------------------- loading
let CUR = null;
const GM_CACHE = new Map();
function groundMapFor(year, extraKey, extra) {
  const k = Math.round(year) + '|' + (extraKey || '');
  if (!GM_CACHE.has(k)) {
    if (GM_CACHE.size > 8) { const [k0, v0] = GM_CACHE.entries().next().value; if (GROUND_UNIFORMS.uGround.value !== v0) { v0.dispose(); GM_CACHE.delete(k0); } }
    GM_CACHE.set(k, drawGroundMap(year, extra ? { extra } : {}));
  }
  return GM_CACHE.get(k);
}
function setTownYear(ctx, spec, year) {
  E.town.group.visible = true;
  ctx.townVis = E.town.build(year, { filter: spec.townFilter });
  const gy = spec.yearFn ? Math.floor(year / (spec.groundStep ?? 10)) * (spec.groundStep ?? 10) : year;
  GROUND_UNIFORMS.uGround.value = groundMapFor(gy, spec.groundKey, spec.groundExtra);
  GROUND_UNIFORMS.uGroundOn.value = 1;
  ctx.yearBuilt = year;
}

function setInterior(on) {
  E.atmo.sky.visible = !on; E.atmo.stars.visible = !on;
  if (on) E.atmo.moon.visible = false;
  if (E.river) E.river.visible = !on;
  if (E.lake) E.lake.visible = !on;
  E.veg.group.visible = !on;
  if (E.terrain.near) E.terrain.near.visible = !on;
}

window.loadShot = function (id, dur, markers, opts = {}) {
  const spec = SHOTS[id];
  if (!spec) throw new Error('unknown shot ' + id);
  if (CUR) CUR.ctx.dispose();
  // key moments (hero shots): native resolution, depth of field, FXAA
  const hero = !!opts.hero && spec.hero !== false;
  const size = E.setQuality(hero ? { scale: opts.scale ?? 1, dof: spec.dof !== false, fxaa: true } : {});
  const ctx = new Ctx(id, dur, markers, spec);
  // atmosphere
  E.atmo.set(spec.hoursFn ? spec.hoursFn(0, dur) : (spec.hours ?? 11), { cloud: spec.cloud ?? 0.4, storm: spec.storm ?? 0, fog: spec.fog, azimuth: spec.azimuth });
  E.exposureMul = spec.exposure ?? 1.0;
  E.envIntensity = spec.env ?? 0.85;
  // camera samples
  const camFn = spec.cam;
  const samples = [0, 0.25, 0.5, 0.75, 1].map(u => camFn(u * dur, dur));
  const views = samples.map(c => {
    const d = c.target.clone().sub(c.pos);
    const pitch = Math.atan2(d.y, Math.hypot(d.x, d.z));
    const tv = Math.tan(THREE.MathUtils.degToRad(c.fov / 2)) * FILM.vScale, th = tv * FILM.aspect;
    // horizontal angle of the lower frustum corners (steep cameras see much wider on the ground)
    const fwd = Math.cos(pitch) + tv * Math.sin(pitch);          // horizontal forward component of the bottom corner ray (pitch<0 looks down)
    const half = fwd <= 0.05 ? Math.PI : Math.max(Math.atan(th), Math.atan2(th, fwd)) + 0.18;
    return { x: c.pos.x, z: c.pos.z, yaw: Math.atan2(d.x, d.z), half: Math.min(Math.PI, half), pitch };
  });
  const mid = views[2];
  const year = spec.yearFn ? spec.yearFn(0, dur) : (spec.year ?? 0);
  const yEnd = spec.yearFn ? Math.max(spec.yearFn(0, dur), spec.yearFn(dur, dur)) : year;
  ctx.year = year;
  if (spec.interior) {
    setInterior(true);
    E.town.group.visible = false; ctx.townVis = []; GROUND_UNIFORMS.uGroundOn.value = 0;
    E.atmo.sun.intensity = 0; E.atmo.hemi.intensity = spec.ambient ?? 0.22; E.atmo.fill.intensity = 0.04; E.scene.fog.density = 0;
    E.envIntensity = spec.env ?? 0.12;
    E.atmo.focusShadow(spec.shadow?.x ?? 0, spec.shadow?.y ?? 0, spec.shadow?.z ?? 0, 10);
  } else {
    setInterior(false);
    // terrain
    const top = spec.top ?? (mid.pitch < -0.9);
    let yawMin = Infinity, yawMax = -Infinity;
    for (const v of views) { let dy = v.yaw - mid.yaw; dy = Math.atan2(Math.sin(dy), Math.cos(dy)); yawMin = Math.min(yawMin, dy - v.half); yawMax = Math.max(yawMax, dy + v.half); }
    const camPos = new THREE.Vector3(); samples.forEach(c => camPos.add(c.pos)); camPos.multiplyScalar(1 / samples.length);
    if (top) {
      const tc = spec.topAt || [samples[2].target.x, samples[2].target.z];
      E.buildTerrainAt(tc[0], tc[1], spec.inner ?? 220, spec.n ?? 256, spec.outer ?? 3600);
    } else {
      let camH = 0; for (const c of samples) camH += (c.pos.y - height(c.pos.x, c.pos.z)) / samples.length;
      E.buildTerrainView({ x: camPos.x, z: camPos.z, yaw: mid.yaw + (yawMin + yawMax) / 2, half: Math.min(Math.PI, (yawMax - yawMin) / 2 + 0.05) }, { nr: spec.nr ?? 170, na: spec.na ?? 110, split: spec.split ?? (camH > 60 ? 0 : 150), back: spec.back });
    }
    // town + ground map
    if (spec.town !== false && yEnd >= 40) {
      setTownYear(ctx, spec, yEnd);
      ctx.townVisEnd = ctx.townVis;
      if (yEnd !== year) setTownYear(ctx, spec, year);
    } else { E.town.group.visible = false; ctx.townVis = []; GROUND_UNIFORMS.uGroundOn.value = spec.groundExtra ? 1 : 0; if (spec.groundExtra) GROUND_UNIFORMS.uGround.value = groundMapFor(year, spec.groundKey, spec.groundExtra); }
    // vegetation (exclude town footprint, fields, roads, custom clearings)
    const bh = new Map();
    for (const b of (ctx.townVisEnd || ctx.townVis || [])) { const k = Math.floor(b.x / 12) * 10000 + Math.floor(b.z / 12); if (!bh.has(k)) bh.set(k, []); bh.get(k).push(b); }
    const nearBuilding = (x, z) => { const gx = Math.floor(x / 12), gz = Math.floor(z / 12); for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) { const l = bh.get((gx + i) * 10000 + gz + j); if (l) for (const b of l) if ((b.x - x) ** 2 + (b.z - z) ** 2 < (b.type === 'castle' ? 900 : b.type === 'temple' ? 500 : b.type === 'bridge' || b.type === 'stoneBridge' ? 700 : 64)) return true; } return false; };
    const clear = spec.clear || [];
    const yV = spec.town === false ? 0 : yEnd;
    const camClear = samples.map(c => [c.pos.x, c.pos.z]), tgtClear = samples.map(c => [c.target.x, c.target.z]);
    const exclude = (x, z) => {
      for (const [cx, cz] of camClear) if ((x - cx) ** 2 + (z - cz) ** 2 < (spec.camClear ?? 3.2) ** 2) return true;
      for (const [cx, cz] of tgtClear) if ((x - cx) ** 2 + (z - cz) ** 2 < (spec.tgtClear ?? 4.5) ** 2) return true;
      for (const [cx, cz, r] of clear) if ((x - cx) ** 2 + (z - cz) ** 2 < r * r) return true;
      if (yV >= 40) { if (inFieldAt(x, z, yV)) return true; if (nearRoadAt(x, z, yV, 2.5)) return true; if (nearBuilding(x, z)) return true; }
      return false;
    };
    const vg = spec.veg || {};
    const c0 = samples[0];
    const dir0 = c0.target.clone().sub(c0.pos); dir0.y = 0; dir0.normalize();
    const gR = vg.grassR ?? 0;
    const gc = vg.grassAt || [c0.pos.x + dir0.x * gR * 0.6, c0.pos.z + dir0.z * gR * 0.6];
    const cone = (x, z) => { for (const c of samples) { const ax = x - c.pos.x, az = z - c.pos.z, al = Math.hypot(ax, az); const d = c.target.clone().sub(c.pos); const dl = Math.hypot(d.x, d.z) || 1; if (al < 3 || (ax * d.x + az * d.z) / (al * dl) > 0.55) return true; } return false; };
    E.veg.build({ cx: camPos.x, cz: camPos.z }, { r0: vg.r0 ?? 55, r1: vg.r1 ?? 260, rImp: vg.rImp ?? 150, rFar: vg.rFar ?? 2200, grassR: gR, grassCenter: gc, grassCone: cone,
      grassStep: vg.grassStep ?? 0.6, flowers: vg.flowers ?? 0.05, views: top ? null : views, exclude, extraTrees: vg.extra, treeStep: vg.treeStep, keepR: vg.keepR });
    // shadow focus
    const sf = spec.shadow || { x: mid.x + Math.sin(mid.yaw) * 25, z: mid.z + Math.cos(mid.yaw) * 25, r: 70 };
    E.atmo.focusShadow(sf.x, sf.y ?? height(sf.x, sf.z), sf.z, sf.r);
  }
  // actors
  const upd = spec.setup ? spec.setup(ctx) : null;
  if (upd) ctx.updates.push(upd);
  CUR = { id, spec, ctx, camFn, dur, hero };
  return { tris: E.veg.tris, town: (ctx.townVis || []).length, size };
};

let lastEnvH = -99;
window.renderShot = function (t) {
  const { spec, ctx, camFn, dur } = CUR;
  if (spec.hoursFn) {
    const h = spec.hoursFn(t, dur);
    E.atmo.set(h, { cloud: spec.cloud ?? 0.4, storm: typeof spec.stormFn === 'function' ? spec.stormFn(t, dur) : (spec.storm ?? 0), fog: spec.fog, azimuth: spec.azimuth });
    if (Math.abs(h - lastEnvH) > 0.75) { lastEnvH = h; E.atmo.envDirty = true; } else E.atmo.envDirty = false;
  }
  if (spec.yearFn && spec.town !== false) {
    const y = spec.yearFn(t, dur);
    if (Math.abs(y - ctx.yearBuilt) >= (spec.yearStep ?? 1)) setTownYear(ctx, spec, y);
    ctx.year = y;
  }
  const c = camFn(t, dur);
  ctx.cam = c;
  applyShake(c, t, typeof spec.shake === 'function' ? spec.shake(t, ctx) : (spec.shake || 0));
  for (const fn of ctx.updates) fn(t);
  for (const P of ctx.people) { if (P.anim) P.anim(P, t); P.groundFix(height, { free: P._free }); }
  for (const fn of ctx.post) fn(t);
  E.camera.position.copy(c.pos); E.camera.up.set(0, 1, 0);
  E.camera.lookAt(c.target);
  if (c.roll) E.camera.rotateZ(c.roll);
  E.camera.fov = 2 * THREE.MathUtils.radToDeg(Math.atan(Math.tan(THREE.MathUtils.degToRad(c.fov / 2)) * FILM.vScale)); E.camera.aspect = FILM.aspect; E.camera.updateProjectionMatrix();
  if (CUR.hero) {   // focus on the camera target unless the shot says otherwise (number | [x, y, z] | fn(t, ctx))
    const fd = spec.focus;
    E.dof.focus = typeof fd === 'function' ? fd(t, ctx) : typeof fd === 'number' ? fd : Array.isArray(fd) ? c.pos.distanceTo(tmpV.set(fd[0], fd[1], fd[2])) : c.pos.distanceTo(c.target);
    const fovK = Math.tan(THREE.MathUtils.degToRad(21)) / Math.tan(THREE.MathUtils.degToRad(c.fov / 2));
    E.dof.aperture = 30 * (spec.aperture ?? 1) * fovK;
    E.dof.maxBlur = spec.maxBlur ?? 11;
  }
  let ex = spec.exposure ?? 1.0;
  if (spec.exposureFn) ex *= spec.exposureFn(t, dur);
  for (const f of ctx.expo) ex *= f(t);
  E.exposureMul = ex;
  E.render((spec.tOffset ?? 0) + t * (spec.tScale ?? 1));
  return true;
};
