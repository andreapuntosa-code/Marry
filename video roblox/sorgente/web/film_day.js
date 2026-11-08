// "What if Earth spun in exactly 24 hours?" -- Roblox v2 What-if (viral format). Shots for script_day.py
import { THREE, shot, person, street, ground, house, tree, glowTex, stars, add, on, onPost, camLerp, sm, lerp, getScene, shadowAt } from './kit.js';
import { blk, dust, sparkles } from './sets.js';
import { clock, waterPlane, boat } from './museum.js';
import { ME, PP, P, dolly, CUY, M_, DOF, DAY, SPACE, rnd, dynLabel, billboard, texOf, space, globe, palm, clouds } from './whatif.js';

const PJ = { skin: 0xf2c79a, shirt: 0x9ab8e8, pants: 0x7a98c8, hair: { style: 'bowl', color: 0x6b3a1e }, collar: false };
// a clock tower (the clock faces +z); time(u) -> minutes after midnight
function tower(x, z, time, o = {}) { const h = o.h ?? 14;
  blk(3, h, 3, M_(o.color ?? 0xc8a868, { r: 0.6 }), x, h / 2, z, { k: 0.02 }); const roof = new THREE.Mesh(new THREE.ConeGeometry(2.3, 4, 4), M_(0x3a4a5a)); roof.rotation.y = 0.785; roof.position.set(x, h + 2, z); roof.castShadow = true; add(roof);
  const c = clock(x, h - 2.2, z + 1.55, time, { night: o.night }); c.scale.setScalar(1.0); return c; }
const hm = (h, m) => h * 60 + m;

// D01: the billboard: one spin = 23 h 56 m 4 s -> 24 h exactly
shot('D01', { scene: DAY, build() {
  street(); billboard((u) => u < 1.3 ? 'ONE SPIN OF EARTH\n23h 56m 4s' : 'ONE SPIN OF EARTH\n24h 00m 00s', 0, -7.8, { size: 92 });
  [[PP[0], -2.5, -5.2, 0.3], [PP[2], 2.4, -5.4, -0.3], [ME, 0, -5.0, 0]].forEach(([d, x, z, yw]) => { const A = person(d, x, z, yw, 'idle'); A.pitch = -0.25; on((u) => { A.pose = u > 1.3 ? 'shock' : 'think'; A.setFace(u > 1.3 ? 'shock' : 'confused'); }); });
  sparkles(0, 4, -7.5, { n: 80, R: 3, h: 3, color: 0xffe08a, amount: (u) => Math.max(0, 1 - Math.abs(u - 1.45) / 0.5) });
  shadowAt(0, -6, 10);
}, cam: dolly(P([0.2, 2.2, 3.4], [0, 3.7, -7.8], 58), P([0.1, 2.1, 2.2], [0, 3.8, -7.8], 58)) });
// D02: doesn't it already? Nope: 23 h 56 m
shot('D02', { scene: DAY, build() {
  street(); tower(7.5, -16, (u) => hm(23, 50) + u * 1.4, { h: 16 }); const A = person(ME, 5.6, -6, -0.3, 'shrug', { face: 'confused' }); on((u) => { A.pose = u < 1.6 ? 'shrug' : 'shock'; A.setFace(u < 1.6 ? 'confused' : 'shock'); });
  dynLabel((u) => u < 1.6 ? '24h?' : '23h 56m', 5.0, 8.6, -12, { w: 4, size: 150, color: (s) => s === '24h?' ? '#ffffff' : '#ffd23a' });
  shadowAt(0, -7, 10);
}, cam: dolly(P([7.0, 2.4, 1.4], [7.2, 6.5, -14], 56), P([6.9, 2.3, 0.4], [7.2, 6.7, -14], 56)) });
// D03: Earth also moves around the Sun, so it turns a little extra to face it again
shot('D03', { scene: SPACE, build() {
  space(); const S = getScene();
  const sun = new THREE.Mesh(new THREE.SphereGeometry(3, 40, 30), new THREE.MeshBasicMaterial({ color: new THREE.Color(3, 2.6, 1.8) })); sun.position.set(-9, 0, -4); add(sun);
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex(), color: 0xffb040, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, depthWrite: false })); halo.scale.setScalar(14); halo.position.copy(sun.position); add(halo);
  const key = new THREE.PointLight(0xfff0d0, 900, 80, 1.6); key.position.copy(sun.position); add(key);
  const orbit = new THREE.Mesh(new THREE.TorusGeometry(11, 0.03, 6, 200), new THREE.MeshBasicMaterial({ color: 0x4a5a8a })); orbit.rotation.x = Math.PI / 2; orbit.position.copy(sun.position); add(orbit);
  const E = globe('now', 1.3); const pin = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1.2, 8), new THREE.MeshBasicMaterial({ color: 0xff4a4a })); pin.position.set(0, 0, 1.75); pin.rotation.x = Math.PI / 2; E.userData.mesh.add(pin);
  const tip = new THREE.Mesh(new THREE.SphereGeometry(0.14, 12, 10), new THREE.MeshBasicMaterial({ color: 0xff4a4a })); tip.position.set(0, 0, 2.35); E.userData.mesh.add(tip);
  on((u, d) => { const k = sm(0.4, d - 0.4, u), a0 = 0.15, a = a0 + 0.55 * k; E.position.set(sun.position.x + Math.cos(a) * 11, 0, sun.position.z + Math.sin(a) * 11);
    // the pin starts facing the Sun; one full spin brings it back to the same direction in space, then a bit more to face the Sun
    const face0 = Math.atan2(-Math.cos(a0), -Math.sin(a0)); E.userData.mesh.rotation.y = face0 - Math.PI / 2 + 2 * Math.PI * Math.min(1, k * 1.15) + (a - a0) * sm(0.85, 1, k); });
  dynLabel((u) => u < 2.6 ? '1 SPIN = 23h 56m' : '+4 MIN\nTO FACE THE SUN', 0, 4.8, 2, { w: 6, size: 100, color: '#ffd23a', billboard: true });
}, cam: dolly(P([3, 7.5, 16], [-1, 0, 1], 50), P([4, 6.5, 15], [0, 0, 2], 50)) });
// D04: spin in exactly 24 h: just 4 minutes slower
shot('D04', { scene: SPACE, build() { space(); const G = globe('now', 3); on((u) => { G.userData.mesh.rotation.y = u * lerp(0.8, 0.3, sm(0.5, 2.5, u)); });
  dynLabel((u) => u < 1.7 ? '24h 00m 00s' : '4 MIN SLOWER', 0, 4.6, 0, { w: 6.5, size: 135, color: '#ffffff', billboard: true }); },
  cam: dolly(P([0, 0.6, 14], [0, -0.3, 0], 50), P([0, 0.5, 13], [0, -0.3, 0], 50)) });
// D05: each day 4 min longer than the clock: in a week sunrise is half an hour late (dawn town, clock 6:28, still dark)
shot('D05', { scene: { sky: ['#0e1640', '#3a4a8a'], bloom: 0.45, bloomThreshold: 1.0, exposure: 0.95, env: 0.12, dof: DOF, fog0: 40, fog1: 200 }, build() {
  const S = getScene(); S.userData.sun.intensity = 0.25; S.userData.hemi.intensity = 0.55; stars(800);
  street({ lit: true, n: 8 }); tower(7.5, -16, (u) => hm(6, 0) + 28 * sm(0.3, 2.6, u), { night: true, h: 16 });
  [[PP[1], 5.7, -5.5, 0.3], [PP[0], 9.1, -5.8, -0.3], [ME, 7.5, -4.8, 0]].forEach(([d, x, z, yw]) => { const A = person(d, x, z, yw, 'idle', { face: 'sleep' }); A.pitch = -0.3; on((u) => A.setFace(u < 2.6 ? 'sleep' : 'confused')); });
  dynLabel((u) => 'SUNRISE\n+' + Math.round(28 * sm(0.3, 2.6, u)) + ' MIN', 7.5, 4.6, -8, { w: 5, size: 120, color: '#ffd23a' });
}, cam: dolly(P([7.8, 2.0, 2.4], [7.5, 6.0, -15], 54), P([7.7, 1.9, 1.4], [7.5, 6.2, -15], 54)) });
// D06: leave the clocks alone, and in six months the Sun is up at midnight
shot('D06', { scene: DAY, build() {
  street(); tower(7.5, -16, () => hm(0, 0), { h: 16 }); const sunS = new THREE.Mesh(new THREE.SphereGeometry(5, 24, 16), new THREE.MeshBasicMaterial({ color: new THREE.Color(3, 2.8, 2.2), fog: false })); sunS.position.set(-40, 80, -120); add(sunS);
  [[{ ...PJ, shirt: 0xe8a0c0, pants: 0xc880a0 }, 5.7, -5.5, 0.3], [{ ...PJ, skin: 0x8a5a3a, hair: { style: 'short', color: 0x1a1210 } }, 9.1, -5.8, -0.3], [PJ, 7.5, -4.8, 0]].forEach(([d, x, z, yw]) => { const A = person(d, x, z, yw, 'shock', { face: 'shock' }); A.pitch = -0.3; });
  dynLabel(() => 'MIDNIGHT', 7.5, 4.4, -8, { w: 5, size: 170, color: '#1a1a3a', stroke: '#ffffff' });
  shadowAt(0, -6, 10);
}, cam: dolly(P([7.9, 1.9, 1.6], [7.5, 6.0, -15], 56), P([7.8, 1.9, 0.6], [7.5, 6.2, -15], 56)) });
// D07-D08: the spin pushes water to the equator; slow it down and the water slides to the poles
function oceanGlobe(k) { space(); const G = new THREE.Group(); add(G);
  const land = new THREE.Mesh(new THREE.SphereGeometry(3, 96, 64), new THREE.MeshStandardMaterial({ map: texOf('now'), roughness: 0.8 })); G.add(land);
  const sea = new THREE.Mesh(new THREE.SphereGeometry(3, 96, 64), new THREE.MeshPhysicalMaterial({ color: 0x2a7ad0, roughness: 0.08, transparent: true, opacity: 0.55, clearcoat: 1 })); G.add(sea);
  const atm = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex(), color: 0x6ab0ff, transparent: true, opacity: 0.4, blending: THREE.AdditiveBlending, depthWrite: false })); atm.scale.setScalar(9.5); G.add(atm);
  const arrows = []; for (let i = 0; i < 8; i++) { const a = i / 8 * 6.283, g = new THREE.Group(); const sh = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.9, 8), new THREE.MeshBasicMaterial({ color: 0xffd23a })); sh.position.y = 0.45; g.add(sh); const hd = new THREE.Mesh(new THREE.ConeGeometry(0.17, 0.35, 10), sh.material); hd.position.y = 1.05; g.add(hd); G.add(g); arrows.push([g, a]); }
  on((u, d) => { const q = k(u, d); sea.scale.set(lerp(1.08, 1.0, q), lerp(0.9, 1.06, q), lerp(1.08, 1.0, q)); land.rotation.y = sea.rotation.y = u * lerp(0.8, 0.35, q);
    arrows.forEach(([g, a], i) => { const up = i % 2 === 0 ? 1 : -1; if (q < 0.05) { g.position.set(Math.cos(a) * 3.35, 0, Math.sin(a) * 3.35); g.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(Math.cos(a), 0, Math.sin(a))); }
      else { const lat = 0.5; g.position.set(Math.cos(a) * 3.3 * Math.cos(lat), up * 3.3 * Math.sin(lat), Math.sin(a) * 3.3 * Math.cos(lat)); g.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(-Math.cos(a) * 0.4, up, -Math.sin(a) * 0.4).normalize()); } }); });
  return G; }
shot('D07', { scene: SPACE, build() { oceanGlobe(() => 0); dynLabel(() => 'SPIN → WATER\nTO THE EQUATOR', 0, 4.8, 0, { w: 7, size: 105, color: '#7ad0ff', billboard: true }); }, cam: dolly(P([0, 1.2, 14.5], [0, -0.3, 0], 50), P([0, 0.8, 13.5], [0, -0.3, 0], 50)) });
shot('D08', { scene: SPACE, build() { oceanGlobe((u) => sm(0.2, 1.8, u)); dynLabel(() => 'SLOWER → WATER\nTO THE POLES', 0, 4.8, 0, { w: 7, size: 105, color: '#ffd23a', billboard: true }); }, cam: dolly(P([0, 2.5, 14], [0, -0.3, 0], 50), P([0, 3.5, 13.2], [0, -0.3, 0], 50)) });
// D09: at the equator the sea drops 20 m: harbors end up on dry land
shot('D09', { scene: { ...DAY, sky: ['#6ab0f0', '#f8f0d8'] }, build() {
  const sand = new THREE.Mesh(new THREE.PlaneGeometry(300, 300), M_(0xe0c890, { r: 0.95 })); sand.rotation.x = -Math.PI / 2 - 0.08; sand.position.y = -2; sand.receiveShadow = true; add(sand);
  const sea = waterPlane(300, 100, new THREE.MeshStandardMaterial({ color: 0x1e88b8, roughness: 0.1, metalness: 0.3 }), 0.12, {});
  for (let i = 0; i < 9; i++) blk(1.6, 0.25, 1.6, M_(0x8a5a34), 0, 1.2, -2 - i * 1.6, { k: 0.1 }); for (let i = 0; i < 9; i++) for (const s of [-1, 1]) blk(0.2, 4, 0.2, M_(0x5a3a1e), s * 0.7, -0.8, -2 - i * 1.6, { k: 0.2 });
  const boats = [[3.2, -6, 0.3], [-3.4, -9, -0.4], [4.5, -13, 0.6]].map(([x, z, y]) => { const b = boat(x, z, y); b.scale.setScalar(1.3); return [b, x, z]; });
  palm(-8, 6, 1); palm(9, 4, 1.1); palm(-12, 1, 0.9);
  const A = person(ME, 0.2, -3.0, Math.PI + 0.5, 'shock', { face: 'shock' }); A.root.position.y = 1.32;
  on((u, d) => { const y = lerp(0.6, -3.2, sm(0.2, d - 0.5, u)); sea.position.y = y; boats.forEach(([b, x, z]) => { const gy = -2 - z * Math.tan(0.08) - 0.1; b.position.y = Math.max(y, gy); b.rotation.z = y < gy ? 0.25 : b.rotation.z; }); });
  dynLabel((u) => 'EQUATOR  -' + Math.round(20 * sm(0.2, 3.4, u)) + ' m', 0.8, 5.2, -10, { w: 5, size: 120, color: '#ffffff', stroke: '#1a5a8a' });
}, cam: dolly(P([4, 4.2, 6], [0, 0, -9], 52), P([3.2, 3.8, 4.8], [0, 0, -9], 52)) });
// D10: up north it rises: London and Amsterdam under 17 m of water (canal houses)
function canal(n = 7) { const cols = [0x8a3a2a, 0x2a4a6a, 0x6a5a3a, 0x3a5a3a, 0xa86a3a, 0x5a2a3a, 0x7a7a6a];
  for (let i = 0; i < n; i++) { house(-12 + i * 4, -9, 0, { w: 3.6, d: 6, h: 10 + (i % 3), color: cols[i % cols.length], fence: false, roof: 0x2a2a30, door: 0x1a1a1a }); house(-10 + i * 4, 9, Math.PI, { w: 3.6, d: 6, h: 9 + (i % 2) * 2, color: cols[(i + 3) % cols.length], fence: false, roof: 0x2a2a30, door: 0x1a1a1a }); }
  for (const s of [-1, 1]) blk(60, 0.4, 3, M_(0x8a8a8a, { r: 0.8 }), 0, 0.2, s * 4.6, { k: 0.05 });
  const bridge = blk(3, 0.5, 6.4, M_(0x6a4a34), 2, 1.1, 0, { k: 0.1 }); tower(14, -12, () => hm(12, 0), { h: 16, color: 0x9a7a5a }); }
shot('D10', { scene: { sky: ['#6a8ab0', '#c8d0d8'], bloom: 0.3, bloomThreshold: 1.6, exposure: 0.85, env: 0.3, dof: DOF, fog0: 40, fog1: 220 }, build() {
  ground({ road: false, grass: 0x6a7a5a }); canal();
  const sea = waterPlane(300, 110, new THREE.MeshStandardMaterial({ color: 0x3a6a7a, roughness: 0.15, metalness: 0.3, transparent: true, opacity: 0.93 }), 0.18, {});
  for (let i = 0; i < 4; i++) { const b = boat(-6 + i * 5, (i % 2 ? 1.2 : -1.2), 1.57); b.scale.setScalar(1.1); on((u, d) => { b.position.y = sea.position.y + 0.1; }); }
  on((u, d) => { sea.position.y = lerp(-0.6, 12.5, sm(0.2, d - 0.2, u)); });
  dynLabel((u) => 'LONDON · AMSTERDAM\n+' + Math.round(17 * sm(0.2, 3.9, u)) + ' m', 0, 18, -8, { w: 10, size: 120, color: '#ffffff', stroke: '#c8281a' });
}, cam: dolly(P([2, 19, 30], [0, 6, -4], 52), P([1.5, 18, 26], [0, 6, -4], 52)) });
// D11: four minutes. That's all it would take. (the drowned city at dusk, only the clock tower sticks out)
shot('D11', { scene: { sky: ['#2a2a5a', '#e88a5a'], bloom: 0.45, bloomThreshold: 1.1, exposure: 0.9, env: 0.2, dof: DOF, fog0: 40, fog1: 240 }, build() {
  const S = getScene(); S.fog.color.set(0xc87a6a); S.userData.sun.color.set(0xff9a50); S.userData.sun.intensity = 1.4; S.userData.sun.position.set(-20, 8, -80); S.userData.hemi.intensity = 0.7;
  ground({ road: false, grass: 0x4a5a3a }); canal(); const sea = waterPlane(400, 110, new THREE.MeshStandardMaterial({ color: 0x8a6a8a, roughness: 0.06, metalness: 0.6 }), 0.15, {}); sea.position.y = 17.2;
  const tw = tower(2, -6, (u) => hm(12, 0) + 4 * sm(0.3, 1.6, u), { h: 23, color: 0x9a7a5a });
  dynLabel((u) => u < 1.0 ? '' : '4 MIN', 2, 28.5, -6, { w: 4, size: 200, color: '#ffffff' });
}, cam: dolly(P([4.5, 18.6, 10], [2, 21.5, -6], 50), P([3.5, 19.2, 13.5], [2, 22, -6], 50)), focus: () => 16, fx: (u, d) => ({ fade: sm(d - 0.7, d, u) }) });
