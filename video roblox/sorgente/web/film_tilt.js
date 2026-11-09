// "What if Earth wasn't tilted?" -- Roblox v2 What-if (viral format). Shots for script_tilt.py
import { THREE, shot, person, street, ground, house, tree, glowTex, stars, add, on, onPost, camLerp, sm, lerp, getScene, shadowAt } from './kit.js';
import { blk, dust, sparkles, pages } from './sets.js';
import { ME, PP, P, dolly, CUY, M_, DOF, DAY, SPACE, rnd, dynLabel, billboard, texOf, space } from './whatif.js';

const deg = Math.PI / 180;
function sunBall(x, y, z, R = 2.5) { const s = new THREE.Mesh(new THREE.SphereGeometry(R, 40, 30), new THREE.MeshBasicMaterial({ color: new THREE.Color(3, 2.6, 1.8), fog: false })); s.position.set(x, y, z); add(s);
  const h = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex(), color: 0xffb040, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, depthWrite: false, fog: false })); h.scale.setScalar(R * 5); h.position.copy(s.position); add(h); return s; }
// a tilted Earth: axis rod through the poles; tilt(u) in radians; lit from +x
function tiltedEarth(R, tilt, o = {}) {
  const outer = new THREE.Group(); outer.position.set(...(o.pos ?? [0, 0, 0])); add(outer); const tg = new THREE.Group(); outer.add(tg);
  const m = new THREE.Mesh(new THREE.SphereGeometry(R, 96, 64), new THREE.MeshStandardMaterial({ map: texOf('now'), roughness: 0.8 })); tg.add(m);
  const ice = new THREE.Mesh(new THREE.SphereGeometry(R * 1.004, 96, 64, 0, Math.PI * 2, 0, 0.01), M_(0xf4f8fc, { r: 0.6 })); tg.add(ice); const ice2 = ice.clone(); ice2.rotation.x = Math.PI; tg.add(ice2);
  const axis = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, R * 3, 8), new THREE.MeshBasicMaterial({ color: 0xff4a4a })); tg.add(axis);
  const atm = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex(), color: 0x6ab0ff, transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending, depthWrite: false })); atm.scale.setScalar(R * 3); outer.add(atm);
  on((u, d) => { tg.rotation.z = tilt(u, d); m.rotation.y = u * 0.5; if (o.ice) { const k = o.ice(u, d); for (const c of [ice, ice2]) { c.geometry.dispose(); c.geometry = new THREE.SphereGeometry(R * 1.004, 96, 64, 0, Math.PI * 2, 0, 0.01 + k); } } });
  return { outer, tg, m };
}
function keyLight(x, y, z, I = 3.2) { getScene().traverse((n) => { if (n.isDirectionalLight) n.intensity = 0; }); const k = new THREE.DirectionalLight(0xfff4e0, I); k.position.set(x, y, z); add(k); return k; }

// T01: the billboard: 23.5 degrees -> 0
shot('T01', { scene: DAY, build() {
  street(); billboard((u) => u < 0.8 ? "EARTH'S TILT\n23.5°" : "EARTH'S TILT\n0°", 0, -7.8, { size: 118 });
  [[PP[0], -2.5, -5.2, 0.3], [PP[2], 2.4, -5.4, -0.3], [ME, 0, -5.0, 0]].forEach(([d, x, z, yw]) => { const A = person(d, x, z, yw, 'idle'); A.pitch = -0.25; on((u) => { A.pose = u > 0.8 ? 'shock' : 'idle'; A.setFace(u > 0.8 ? 'shock' : 'smile'); }); });
  shadowAt(0, -6, 10);
}, cam: dolly(P([0.2, 2.2, 3.4], [0, 3.7, -7.8], 58), P([0.1, 2.1, 2.6], [0, 3.8, -7.8], 58)) });
// T02: it leans 23.5 degrees: that's the reason for the seasons
shot('T02', { scene: SPACE, build() { space(); keyLight(18, 6, 26, 7); tiltedEarth(3, () => 23.5 * deg);
  dynLabel((u) => u < 2.2 ? '23.5°' : 'SEASONS', 0, 4.9, 0, { w: 5, size: 170, color: '#ffd23a', billboard: true }); },
  cam: dolly(P([0, 0.6, 14], [0, -0.3, 0], 50), P([0.5, 0.5, 13], [0, -0.3, 0], 50)) });
// T03: not distance: in January Earth is closest to the Sun
shot('T03', { scene: SPACE, build() { space(); const S = sunBall(0, 0, 0, 2.2); const L = new THREE.PointLight(0xfff0d0, 700, 80, 1.5); add(L);
  const pts = []; for (let i = 0; i <= 200; i++) { const a = i / 200 * 6.283; pts.push(new THREE.Vector3(Math.cos(a) * 10.5 + 1.2, 0, Math.sin(a) * 9.6)); } add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: 0x5a6aa8 })));
  const E = tiltedEarth(0.9, () => 23.5 * deg); on((u, d) => { const a = Math.PI - 0.6 + sm(0.1, d - 0.4, u) * 0.6; E.outer.position.set(Math.cos(a) * 10.5 + 1.2, 0, Math.sin(a) * 9.6); });
  dynLabel(() => 'JANUARY =\nCLOSEST TO THE SUN', -5, 3.6, 0, { w: 6, size: 100, color: '#ffffff', billboard: true });
}, cam: dolly(P([-4, 14, 22], [-5, 0, 0], 50), P([-5, 12, 20], [-6, 0, 0], 50)) });
// T04: stand it up straight: 12 h day and 12 h night everywhere, every day
shot('T04', { scene: SPACE, build() { space(); keyLight(30, 0, 2, 9); getScene().userData.hemi.intensity = 0.02;
  tiltedEarth(3, (u, d) => lerp(23.5, 0, sm(0.3, 2.2, u)) * deg);
  dynLabel((u) => u < 2.2 ? 'STAND IT UP' : '12h DAY\n12h NIGHT', 0, 4.6, 0, { w: 5.5, size: 120, color: '#ffffff', billboard: true }); },
  cam: dolly(P([0, 1.0, 15], [0, -0.6, 0], 50), P([0, 0.8, 14], [0, -0.6, 0], 50)) });
// T05: no summer, no winter: the same weather all year (calendar pages flying)
shot('T05', { scene: { ...DAY, sky: ['#8ab0d0', '#e8eef2'] }, build() {
  street(); getScene().userData.sun.intensity = 1.6; pages(80, 0, 4.5, -8, 10, 4, 6, { seed: 4 });
  const A = person(ME, 0, -6, 0, 'shrug', { face: 'confused' });
  dynLabel(() => 'SAME WEATHER\nALL YEAR', 0, 3.6, -7.5, { w: 3.6, size: 100, color: '#ffffff', stroke: '#2a3a6a' });
  shadowAt(0, -6, 8);
}, cam: CUY(0, -6, 0, { d: 6.0, side: 0.3, push: 0.8, hy: 2.4 }) });
// T06: at the poles, the Sun rolls along the horizon forever
shot('T06', { scene: { sky: ['#3a4a8a', '#f8c8a0'], bloom: 0.45, bloomThreshold: 1.2, exposure: 0.9, env: 0.3, dof: DOF, fog0: 80, fog1: 500 }, build() {
  const S = getScene(); S.fog.color.set(0xe8c8b8); S.userData.hemi.intensity = 0.7;
  ground({ road: false, grass: 0xf0f4f8 }); const r = rnd(5); for (let i = 0; i < 30; i++) { const m = new THREE.Mesh(new THREE.DodecahedronGeometry(1 + r() * 2, 0), M_(0xe8f0f8, { r: 0.4 })); m.scale.y = 0.4; m.position.set((r() - 0.5) * 70, 0, -8 - r() * 60); add(m); }
  const sun = sunBall(0, 3, -300, 14); const sl = S.userData.sun; sl.color.set(0xffb070); sl.intensity = 2.2;
  on((u) => { const a = -0.5 + u * 0.28; sun.position.set(Math.sin(a) * 300, 4, -Math.cos(a) * 300); sl.position.set(Math.sin(a) * 40, 2, -Math.cos(a) * 40 - 6); sl.target.position.set(0, 0, -6); });
  const A = person({ ...ME, acc: ['headband'] }, 0, -6, 0, 'idle', { face: 'confused' }); A.look = -0.4; on((u) => { A.look = -0.5 + u * 0.15; });
  dynLabel(() => 'NORTH POLE', 0, 4.0, -9, { w: 4, size: 140, color: '#ffffff', stroke: '#1a3a8a' });
  shadowAt(0, -6, 12);
}, cam: dolly(P([1.5, 1.6, 0.5], [-2, 2.0, -30], 54), P([1.2, 1.6, -0.3], [-1, 2.0, -30], 54)) });
// T07: up north, crops that need a hot summer stop growing
shot('T07', { scene: { ...DAY, sky: ['#8aa0b8', '#dde4e8'] }, build() {
  ground({ road: false, grass: 0x7a8a5a }); const r = rnd(4), mats = [];
  for (let row = 0; row < 14; row++) { const m = M_(0x4aa83a, { r: 0.8 }); mats.push([m, row * 0.05]); for (let k = 0; k < 30; k++) { const c = new THREE.Mesh(new THREE.ConeGeometry(0.22, 1.0 + r() * 0.3, 6), m); c.position.set(-15 + k * 1.0 + (r() - 0.5) * 0.2, 0.5, -2 - row * 1.4); add(c); } }
  const grey = new THREE.Color(0x8a8a6a), green = new THREE.Color(0x4aa83a); on((u) => mats.forEach(([m, d]) => { const k = sm(0.1 + d, 1.4 + d, u); m.color.copy(green).lerp(grey, k); }));
  const A = person({ ...PP[1], shirt: 0x8a5a3a }, 2, -1.5, -0.4, 'think', { face: 'sad' });
  dynLabel(() => 'NO SUMMER', 0, 4.2, -9, { w: 5, size: 150, color: '#ffffff', stroke: '#5a3a1a' });
  shadowAt(0, -6, 12);
}, cam: dolly(P([4.5, 2.4, 3.4], [0, 1.0, -8], 50), P([4.0, 2.2, 2.6], [0, 1.0, -8], 50)) });
// T08: the snow at the poles never gets a summer to melt it
shot('T08', { scene: { sky: ['#9ab0c8', '#e8eef4'], bloom: 0.3, bloomThreshold: 1.6, exposure: 0.85, env: 0.35, dof: DOF, fog0: 30, fog1: 200 }, build() {
  getScene().fog.color.set(0xdde6ee); ground({ road: false, grass: 0xf4f8fc });
  for (let i = -3; i <= 3; i++) house(i * 15, -15, 0, { seed: i + 60, fence: false, roof: 0xf8fbff });
  const r = rnd(9); for (let i = 0; i < 40; i++) { const m = new THREE.Mesh(new THREE.SphereGeometry(1 + r() * 2, 10, 8), M_(0xf8fbff, { r: 0.6 })); m.scale.y = 0.4; m.position.set((r() - 0.5) * 60, 0, (r() - 0.5) * 30); add(m); }
  dust(1200, 0, 8, -6, 50, 16, 40, { color: 0xffffff, size: 0.12, rise: -0.2, opacity: 0.9, seed: 7 });
  const A = person({ ...ME, acc: ['headband'] }, 0, -5, 0, 'idle', { face: 'sad' });
  dynLabel(() => 'NEVER MELTS', 0, 4.4, -9, { w: 5, size: 150, color: '#bfe8ff', stroke: '#1a3a6a' });
}, cam: dolly(P([0.6, 2.0, 1.6], [0, 2.6, -12], 54), P([0.5, 1.9, 0.6], [0, 2.7, -12], 54)) });
// T09: every year the ice grows: a white wall of ice advancing over the town
shot('T09', { scene: { sky: ['#8aa0c0', '#e0e8f0'], bloom: 0.3, bloomThreshold: 1.6, exposure: 0.85, env: 0.35, dof: { aperture: 0.001, maxblur: 0.003 }, fog0: 40, fog1: 260 }, build() {
  getScene().fog.color.set(0xdde6ee); street({ n: 8, grass: 0xe8eef2 });
  const ice = M_(0xd8f0ff, { r: 0.25 }), ice2 = M_(0xa8d8f0, { r: 0.2 }); const wall = new THREE.Group(); add(wall);
  const r = rnd(6); for (let i = 0; i < 30; i++) { const b = new THREE.Mesh(new THREE.BoxGeometry(8 + r() * 6, 14 + r() * 10, 12), i % 3 ? ice : ice2); b.position.set(-110 + i * 7.5, 7, -r() * 6); b.castShadow = true; wall.add(b); }
  on((u, d) => { wall.position.z = lerp(-80, -30, sm(0, d, u)); });
  dynLabel((u) => 'YEAR ' + (1 + Math.floor(sm(0, 2.4, u) * 99)), 0, 9, -14, { w: 6, size: 150, color: '#ffffff', stroke: '#1a3a6a' });
}, cam: dolly(P([-0.5, 12, 30], [0, 5, -30], 52), P([-0.5, 12.5, 26], [0, 5, -30], 52)) });
// T10: less tilt is exactly how ice ages begin (the globe whitening from the poles)
shot('T10', { scene: SPACE, build() { space(); keyLight(18, 8, 26, 7);
  tiltedEarth(3, () => 0, { ice: (u, d) => 0.25 + 0.75 * sm(0, d, u) });
  dynLabel((u) => u < 0.9 ? '' : 'ICE AGE', 0, 4.8, 0, { w: 5, size: 190, color: '#bfe8ff', billboard: true }); },
  cam: dolly(P([0, 4, 13], [0, -0.3, 0], 50), P([0, 5, 15], [0, -0.5, 0], 50)), fx: (u, d) => ({ fade: sm(d - 0.7, d, u) }) });
