// "30 DAYS ON A DESERT ISLAND" EP1 -- Roblox v2 comedy series. Shots for script_island1.py
import { THREE, shot, person, ground, glowTex, stars, add, on, onPost, camLerp, sm, lerp, getScene, shadowAt, rbox } from './kit.js';
import { blk, dust, sparkles } from './sets.js';
import { waterPlane } from './museum.js';
import { P, dolly, CUY, M_, DOF, rnd, dynLabel, palm } from './whatif.js';

export const MAX = { skin: 0xf2c79a, shirt: 0xff7a3a, pants: 0x2a6ad8, hair: { style: 'spiky', color: 0xc88a3a }, logo: 0xffffff };
export const MONKEY = { skin: 0x8a5a34, shirt: 0x8a5a34, pants: 0x6a4224, hair: { style: 'short', color: 0x5a3a1e }, acc: ['shades'], collar: false, scale: 0.6 };
const SUN = { bloom: 0.3, bloomThreshold: 1.6, exposure: 0.85, env: 0.35, sky: ['#3a9ae8', '#c8ecff'], dof: DOF, fog0: 80, fog1: 400 };
const shiny = (c, o = {}) => new THREE.MeshPhysicalMaterial({ color: c, roughness: o.r ?? 0.3, clearcoat: 0.8 });
const BAR = (food, water, energy) => [['FOOD', food, [255, 170, 60]], ['WATER', water, [70, 170, 255]], ['ENERGY', energy, [120, 220, 90]]];
export const hud = (day, food, water, energy) => ({ hud: { day: `DAY ${day}/30`, bars: BAR(food, water, energy) } });

// ------------------------------------------------------------------ props
export function sea(o = {}) { const w = waterPlane(500, 120, new THREE.MeshStandardMaterial({ color: o.color ?? 0x1aa0d8, roughness: 0.1, metalness: 0.3 }), o.amp ?? 0.18, {}); w.position.y = o.y ?? 0; return w; }
export function island(o = {}) { const S = getScene(); S.userData.sun.intensity = o.sun ?? 2.2; S.userData.sun.position.set(-10, 24, 14); S.userData.sun.target.position.set(0, 0, -4);
  const sand = new THREE.Mesh(new THREE.CylinderGeometry(16, 20, 2, 64), M_(0xf0d898, { r: 0.95 })); sand.position.set(0, -0.9, -6); sand.receiveShadow = true; add(sand);
  const hill = new THREE.Mesh(new THREE.SphereGeometry(9, 32, 16), M_(0x4aa83a, { r: 0.9 })); hill.scale.y = 0.4; hill.position.set(-2, 0, -16); hill.receiveShadow = true; add(hill);
  for (const [x, z, s] of [[-5, -8, 1.1], [4.5, -9, 1.0], [-1.5, -13, 1.2], [6, -14, 0.9], [-8, -12, 1.0]]) palm(x, z, s);
  const r = rnd(3); for (let i = 0; i < 14; i++) { const st = new THREE.Mesh(new THREE.DodecahedronGeometry(0.2 + r() * 0.3, 0), M_(0x9a9088)); st.position.set((r() - 0.5) * 20, 0.05, -2 - r() * 10); add(st); }
  sea(o); return S; }
export function crab(x, z, o = {}) { const g = new THREE.Group(); g.position.set(x, 0.25, z); add(g); const red = shiny(0xe8402a);
  const b = new THREE.Mesh(rbox(0.7, 0.3, 0.5, 0.3), red); g.add(b); const cl = []; for (const s of [-1, 1]) { const c = new THREE.Mesh(rbox(0.25, 0.18, 0.2, 0.3), red); c.position.set(s * 0.5, 0.05, 0.25); g.add(c); cl.push(c); const st = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.2, 6), red); st.position.set(s * 0.12, 0.25, 0.15); g.add(st); const e = new THREE.Mesh(new THREE.SphereGeometry(0.06, 10, 8), M_(0x111111)); e.position.set(s * 0.12, 0.37, 0.15); g.add(e); }
  for (let i = 0; i < 3; i++) for (const s of [-1, 1]) { const l = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.3, 6), red); l.position.set(s * 0.38, -0.08, -0.15 + i * 0.12); l.rotation.z = s * 1.0; g.add(l); }
  on((u) => { cl.forEach((c, i) => { c.rotation.z = Math.sin(u * 8 + i) * 0.4; }); g.position.x = x + Math.sin(u * 2) * (o.walk ?? 0.2); }); return g; }
export function monkey(x, z, yaw, pose = 'idle', o = {}) { const A = person(MONKEY, x, z, yaw, pose, { face: o.face ?? 'smug', y: o.y });
  const tail = new THREE.Mesh(new THREE.TorusGeometry(0.6, 0.12, 8, 20, 4), M_(0x8a5a34)); tail.position.set(0, 1.8, -0.8); tail.rotation.y = Math.PI / 2; A.body.add(tail);
  for (const s of [-1, 1]) { const ear = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.1, 16), M_(0xc89a6a)); ear.rotation.z = Math.PI / 2; ear.position.set(s * 0.72, 0.1, 0); A.head.add(ear); }
  const muz = new THREE.Mesh(new THREE.SphereGeometry(0.42, 16, 12), M_(0xe0b48a)); muz.scale.set(1, 0.7, 0.5); muz.position.set(0, -0.25, 0.5); A.head.add(muz); return A; }
function ship(x, z, yaw = 0) { const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = yaw; add(g); const wm = M_(0xf8f8f8, { r: 0.4 });
  const hull = new THREE.Mesh(rbox(5, 3, 30, 0.08), wm); hull.position.y = 1.2; g.add(hull); const stripe = new THREE.Mesh(new THREE.BoxGeometry(5.05, 0.5, 30.05), M_(0x2a5ad8)); stripe.position.y = 0.2; g.add(stripe);
  for (let i = 0; i < 3; i++) { const d = new THREE.Mesh(rbox(4.4 - i * 0.6, 1.4, 22 - i * 5, 0.08), wm); d.position.y = 3.4 + i * 1.4; g.add(d); for (let k = 0; k < 10; k++) for (const s of [-1, 1]) { const wdw = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.4), M_(0x2a4a7a)); wdw.position.set(s * (2.21 - i * 0.3), 3.4 + i * 1.4, -9 + i * 2.5 + k * (18 - i * 5) / 10); wdw.rotation.y = s * Math.PI / 2; g.add(wdw); } }
  for (const zz of [-3, 3]) { const f = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 1, 3, 20), M_(0xe8402a)); f.position.set(0, 8.6, zz); g.add(f); }
  on((u) => { g.position.y = Math.sin(u * 0.8) * 0.15; }); return g; }
function item(kind) { const g = new THREE.Group();
  if (kind === 'coconut') { const c = new THREE.Mesh(new THREE.SphereGeometry(0.28, 20, 16), M_(0x6a4224, { r: 0.9 })); g.add(c); }
  if (kind === 'duck') { const y = shiny(0xffd21f); const b = new THREE.Mesh(new THREE.SphereGeometry(0.26, 20, 16), y); b.scale.set(1.2, 0.9, 1); g.add(b); const h = new THREE.Mesh(new THREE.SphereGeometry(0.17, 16, 12), y); h.position.set(0.18, 0.28, 0); g.add(h); const bk = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.18, 8), M_(0xff8a1f)); bk.rotation.z = -Math.PI / 2; bk.position.set(0.38, 0.26, 0); g.add(bk); }
  if (kind === 'phone') { const p = new THREE.Mesh(rbox(0.22, 0.42, 0.04, 0.2), M_(0x18181c, { r: 0.2 })); p.rotation.x = -Math.PI / 2 + 0.3; g.add(p); }
  add(g); return g; }

// I01: Max's one rule: don't fall off the boat (on deck, relaxing)
shot('I01', { scene: SUN, build() { sea(); ship(0, -14, 0.3); const A = person({ ...MAX, acc: ['shades'] }, 1.6, -3.2, Math.PI / 2 + 0.6, 'idle', { face: 'smug', y: 4.3 }); A.root.position.set(1.3 + 0, 4.15, -6.5);
  dynLabel(() => "DON'T FALL\nOFF THE BOAT", 0, 13, -14, { w: 9, size: 130, color: '#ffffff', stroke: '#1a3a6a' }); shadowAt(0, -12, 20); }, cam: dolly(P([14, 6, 8], [0, 5, -12], 50), P([12.5, 6.2, 6.5], [0, 5.2, -12], 50)) });
// I02: day one: he fell off the boat (a splash)
shot('I02', { scene: SUN, build() { const w = sea(); ship(0, -14, 0.3); const A = person({ ...MAX, acc: ['shades'] }, 3.4, -6, Math.PI / 2, 'shock', { face: 'shock' }); A.anim = (Q, u) => { const q = u; Q.root.position.set(3.4 + q * 1.5, Math.max(-1.6, 6.2 - 6 * q * q), -6); Q.root.rotation.z = -q * 2.2; };
  sparkles(5.0, 0.2, -6, { n: 140, R: 1.4, h: 3, color: 0xffffff, size: 0.14, amount: (u) => Math.max(0, 1 - Math.abs(u - 1.05) / 0.4) }); }, cam: dolly(P([10, 3, 6], [3, 3, -8], 52), P([9.5, 2.8, 5.4], [3.5, 2.4, -8], 52)), fx: (u) => hud(1, 1, 1, 1) });
// I03: washed up with three things: a coconut, a rubber duck, a phone at 2%
shot('I03', { scene: SUN, build() { island(); const A = person(MAX, 0, -4, 0, 'sleep', { face: 'sleep' }); on((u) => { A.setFace(u < 1.0 ? 'sleep' : 'confused'); A.pose = u < 1.0 ? 'sleep' : 'situp'; });
  const items = [['coconut', -0.9, 2.0], ['duck', 0, 2.9], ['phone', 0.9, 3.9]].map(([k, x, t0]) => { const g = item(k); g.position.set(x, 0.3, -1.6); on((u) => { const s = Math.min(1, Math.max(0.001, (u - t0) * 4)); g.scale.setScalar(s); g.rotation.y = u; }); return [g, t0, k]; });
  items.forEach(([g, t0, k]) => { const l = dynLabel(() => k === 'phone' ? '2%' : k.toUpperCase(), g.position.x, 1.0, -1.6, { w: 0.85, size: 150, color: k === 'phone' ? '#ff4a4a' : '#ffd23a' }); on((u) => { l.visible = u > t0; }); });
  shadowAt(0, -4, 10); }, cam: dolly(P([0.3, 3.0, 4.4], [0, 0.6, -2.6], 52), P([0.2, 2.8, 3.8], [0, 0.6, -2.6], 52)), fx: (u) => hud(1, 0.6, 0.6, 0.7) });
// I04: he used that 2% wisely... to post a selfie (flash)
shot('I04', { scene: SUN, build() { island(); const A = person(MAX, 0, -5, 0, 'idle', { face: 'wink' }); const ph = new THREE.Mesh(rbox(0.5, 0.9, 0.08, 0.2), M_(0x18181c, { r: 0.2 })); A.armR.add(ph); ph.position.set(0, -2.3, 0.3);
  onPost(() => { A.armR.rotation.set(-2.2, 0, 0.5); }); dynLabel(() => '2%', -0.75, 2.0, -4.4, { w: 0.9, size: 200, color: '#ff4a4a' }); shadowAt(0, -5, 8); }, cam: CUY(0, -5, 0, { d: 4.6, side: 0.3, hy: 1.8 }), fx: (u) => ({ ...hud(1, 0.55, 0.55, 0.7), flash: 0.8 * Math.max(0, 1 - Math.abs(u - 1.8) / 0.12) }) });
// I05: zero percent (black screen phone, shocked)
shot('I05', { scene: SUN, build() { island(); const A = person(MAX, 0, -5, 0, 'shock', { face: 'shock' }); dynLabel(() => '0%', 0.8, 2.6, -4.6, { w: 1.0, size: 220, color: '#ff2a2a' }); shadowAt(0, -5, 8); }, cam: CUY(0, -5, 0, { d: 4.2, side: 0.2, hy: 1.8 }), fx: (u) => hud(1, 0.55, 0.5, 0.65) });
// I06: survive 30 days and maybe a boat will find him (drone shot of the island)
shot('I06', { scene: SUN, build() { island(); const A = person(MAX, 0, -4, 0, 'idle', { face: 'confused' }); dynLabel(() => 'SURVIVE 30 DAYS', 0, 7, -8, { w: 8, size: 100, color: '#ffd23a', stroke: '#1a3a6a' }); }, cam: dolly(P([2, 6, 14], [0, 1, -6], 54), P([4, 16, 22], [0, 0, -6], 54)), fx: (u) => hud(1, 0.5, 0.45, 0.6) });
// I07: food 0, water 0, shelter: one very confused crab (Max lying under a leaf next to a crab)
shot('I07', { scene: SUN, build() { island(); const A = person(MAX, 0, -4.2, Math.PI, 'sleep', { face: 'sad' }); A.root.rotation.y = 0; crab(0.9, -2.4, { walk: 0.3 });
  const leaf = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.06, 1.2), M_(0x3a9a3a)); leaf.position.set(0.3, 1.6, -3.4); leaf.rotation.z = 0.1; add(leaf); for (const s of [-1, 1]) blk(0.08, 1.6, 0.08, M_(0x8a6a3a), 0.3 + s * 1.1, 0.8, -3.4);
  dynLabel((u) => u < 1.1 ? 'FOOD: 0' : u < 2.2 ? 'WATER: 0' : 'SHELTER: CRAB', 0, 1.15, -1.8, { w: 1.4, size: 140, color: '#ffffff', stroke: '#c8281a' }); shadowAt(0, -3, 8); },
  cam: dolly(P([0.6, 1.4, 2.4], [0.2, 0.6, -3.0], 52), P([0.5, 1.3, 1.9], [0.2, 0.6, -3.0], 52)), fx: (u) => hud(1, lerp(0.4, 0, sm(0, 1.1, u)), lerp(0.4, 0, sm(1.1, 2.2, u)), 0.5) });
// I08: a monkey. wearing sunglasses. HIS sunglasses.
shot('I08', { scene: SUN, build() { island(); const M = monkey(2.2, -6.2, -0.6, 'idle', { face: 'smug', y: 0.0 }); on((u) => { M.pose = u > 2.8 ? 'cheer' : 'idle'; });
  const A = person(MAX, -0.8, -4.6, 0.7, 'idle', { face: 'confused' }); on((u) => { A.pose = u > 3.2 ? 'point' : 'think'; A.setFace(u > 3.2 ? 'shock' : 'confused'); });
  dynLabel((u) => u < 1.6 ? 'A MONKEY' : u < 3.2 ? 'SUNGLASSES' : 'HIS SUNGLASSES', 0.8, 3.2, -6, { w: 3.0, size: 130, color: '#ffd23a', stroke: '#3a2a1a' }); shadowAt(0, -5, 8); },
  cam: dolly(P([0.6, 2.0, 1.2], [0.8, 1.4, -5.8], 52), P([0.5, 1.9, 0.6], [0.9, 1.3, -5.8], 52)), fx: (u) => hud(1, 0, 0.05, 0.45) });
// I09: by sunset: hungry, thirsty, losing an argument with a monkey
shot('I09', { scene: { ...SUN, sky: ['#3a2a7a', '#ff9a5a'] }, build() { const S = island({ sun: 1.4, color: 0x3a5aa8 }); S.userData.sun.color.set(0xff9a50); S.userData.sun.position.set(-20, 4, -40); S.userData.hemi.intensity = 0.6; getScene().fog.color.set(0xe08a6a);
  const M = monkey(1.0, -5.2, -0.4, 'shrug', { face: 'smug' }); const A = person(MAX, -1.0, -5.0, 0.5, 'point', { face: 'shock' }); on((u) => { A.pose = Math.floor(u * 2) % 2 ? 'point' : 'shrug'; M.pose = Math.floor(u * 2) % 2 ? 'shrug' : 'cheer'; });
  const sunB = new THREE.Mesh(new THREE.SphereGeometry(10, 24, 16), new THREE.MeshBasicMaterial({ color: new THREE.Color(2.6, 1.6, 0.8), fog: false })); sunB.position.set(-20, 6, -200); add(sunB); shadowAt(0, -5, 8); },
  cam: dolly(P([0.2, 1.8, 0.6], [0, 1.4, -5.2], 50), P([0.1, 1.8, 0.0], [0, 1.4, -5.2], 50)), fx: (u) => hud(1, 0, 0, 0.3) });
// I10: tomorrow he only has energy for one thing (night, lying on the sand)
shot('I10', { scene: { night: true, bloom: 0.5, bloomThreshold: 0.9, exposure: 1.0, env: 0.1, dof: DOF }, build() { const S = island({ sun: 0.4, color: 0x0a2a4a }); stars(2000); S.userData.hemi.intensity = 0.4; S.background = new THREE.Color(0x0a1030); S.fog.color.set(0x0a1030);
  const A = person(MAX, 0, -4, 0, 'sleep', { face: 'sleep' }); crab(1.0, -2.6, { walk: 0.1 }); const moon = new THREE.Mesh(new THREE.SphereGeometry(4, 24, 16), new THREE.MeshBasicMaterial({ color: new THREE.Color(1.4, 1.4, 1.3), fog: false })); moon.position.set(10, 30, -120); add(moon);
  dynLabel(() => 'ENERGY FOR\nONE THING', 0, 2.2, -4, { w: 2.2, size: 110, color: '#7aff8a', stroke: '#0a2a1a' }); }, cam: dolly(P([0.6, 3.0, 1.8], [0, 0.6, -3.4], 52), P([0.5, 2.8, 1.2], [0, 0.6, -3.4], 52)), fx: (u) => hud(1, 0, 0, 0.15) });
// I11: comment one word: WATER or FIRE (two glowing choices, Max in the middle)
shot('I11', { scene: { ...SUN, sky: ['#2a6ad8', '#9ad0ff'] }, build() { island(); const A = person(MAX, 0, -4.4, 0, 'shrug', { face: 'confused' });
  for (const [x, kind] of [[-1.7, 'water'], [1.7, 'fire']]) { blk(1.6, 1.0, 1.6, M_(0xc8b890), x, 0.5, -4.6); const g = new THREE.Group(); g.position.set(x, 1.9, -4.6); add(g);
    if (kind === 'water') { const d = new THREE.Mesh(new THREE.SphereGeometry(0.55, 24, 18), shiny(0x3aa0ff)); g.add(d); const tip = new THREE.Mesh(new THREE.ConeGeometry(0.47, 0.7, 24), shiny(0x3aa0ff)); tip.position.y = 0.55; g.add(tip); }
    else { const f1 = new THREE.Mesh(new THREE.ConeGeometry(0.55, 1.4, 16), new THREE.MeshBasicMaterial({ color: new THREE.Color(2.4, 0.9, 0.2) })); g.add(f1); const f2 = new THREE.Mesh(new THREE.ConeGeometry(0.32, 0.9, 16), new THREE.MeshBasicMaterial({ color: new THREE.Color(2.6, 2.0, 0.4) })); f2.position.y = -0.15; g.add(f2); const L = new THREE.PointLight(0xff8a3a, 6, 6, 1.6); g.add(L); on((u) => { f1.scale.y = 1 + Math.sin(u * 13) * 0.1; }); }
    on((u) => { g.rotation.y = u * 1.2; g.position.y = 1.9 + Math.sin(u * 3 + x) * 0.12; });
    dynLabel(() => kind.toUpperCase(), x, 3.2, -4.4, { w: 1.5, size: 190, color: kind === 'water' ? '#3aa0ff' : '#ff8a1f' }); }
  dynLabel(() => 'COMMENT\nONE WORD', 0, 4.5, -4.6, { w: 3.2, size: 120, color: '#ffffff', stroke: '#1a1a3a' }); shadowAt(0, -4, 8); },
  cam: dolly(P([0, 2.6, 4.6], [0, 2.4, -4.4], 56), P([0, 2.6, 4.0], [0, 2.5, -4.4], 56)), fx: (u) => hud(1, 0, 0, 0.15) });
