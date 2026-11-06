// "In this town, lost things end up in the same room." -- Roblox v2, ~2 minutes. Shots for script_lost.py
import { THREE, shot, person, street, ground, house, tree, room, bed, label, glowTex, stars, add, on, camLerp, sm, lerp, getScene, shadowAt } from './kit.js';
import { lostRoom, antiqueShop, oldDoor, bunny, flashlight, heap, sparkles, dust, blk, shaft } from './sets.js';

const ME = { skin: 0xf2c79a, shirt: 0x2f6fd6, pants: 0x2a2a3a, hair: { style: 'bowl', color: 0x6b3a1e }, logo: 0xf5c84a };
const PJ = { skin: 0xf2c79a, shirt: 0x9ab8e8, pants: 0x7a98c8, hair: { style: 'bowl', color: 0x6b3a1e }, collar: false };
const KID = { ...ME, scale: 0.62 };
const DAD = { skin: 0xf2c79a, shirt: 0x9a3a2a, pants: 0x3a3a45, hair: { style: 'short', color: 0x3a2414 }, scale: 1.06 };
const OLD = { skin: 0xf0d0b0, shirt: 0x6a3a5a, pants: 0x3a2a35, hair: { style: 'bun', color: 0xeeeeee }, acc: ['glasses'] };
const KIDB = { skin: 0xc68a5a, shirt: 0xf5c84a, pants: 0x3b5ba8, hair: { style: 'short', color: 0x1a1210 }, scale: 0.62 };
const P = (a, b, fov = 50) => ({ pos: a, tgt: b, fov });
const dolly = (a, b) => (u, d) => camLerp(a, b, u / d);
// close-up: head in the top third (hy = head centre height)
const CU = (x, z, o = {}) => { const d = o.d ?? 3.2, sx = o.side ?? 0.25, hy = o.hy ?? 1.94; return dolly(P([x + sx, hy - 0.09 * d / 3.2, z + d], [x, hy - 0.49 * d / 3.2, z], o.fov ?? 50), P([x + sx * 0.5, hy - 0.09 * d / 3.2, z + d - (o.push ?? 0.5)], [x, hy - 0.49 * d / 3.2, z], o.fov ?? 50)); };
const KH = 4.62 * 0.42 * 0.62;    // kid head height (standing)
const DOF = { aperture: 0.0022, maxblur: 0.006 };
const NIGHT = { night: true, bloom: 0.5, bloomThreshold: 0.95, exposure: 1.05, env: 0.1, dof: DOF };
const DAY = { bloom: 0.25, bloomThreshold: 1.8, exposure: 1.05, dof: DOF };
const WARM = { interior: true, bloom: 0.45, bloomThreshold: 0.8, exposure: 1.0, dof: DOF };
const ROOM = { interior: true, bloom: 0.5, bloomThreshold: 0.8, exposure: 1.0, env: 0.45, dof: { aperture: 0.002, maxblur: 0.007 } };
// a hum: golden motes drifting along the street
const hum = (z0 = -6, n = 260) => dust(n, 0, 2.5, z0, 30, 4, 10, { color: 0xffd890, size: 0.08, rise: 0.05, seed: 31 });
function bedroom(o = {}) {
  room({ wall: o.wall ?? 0x7a8ac8, floor: '#8a6a4a', w: 9, d: 8, h: 5, lamp: o.lamp ?? 8 }); const b = bed(-2.2, -1.8); b.scale.setScalar(0.45);
  const win = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 1.5), new THREE.MeshBasicMaterial({ color: o.winC ?? 0x1a2350 })); win.position.set(1.4, 2.6, -3.84); add(win);
  if (o.boxes) for (const [x, z, h, t] of [[1.9, -2.6, 0, 'BOOKS'], [2.9, -2.1, 0, 'CLOTHES'], [2.4, -2.4, 0.9, 'TOYS'], [-0.6, -3.3, 0, 'MISC']]) { blk(0.9, 0.9, 0.9, new THREE.MeshStandardMaterial({ color: 0xc89a64, roughness: 0.9 }), x, 0.45 + h, z); label(t, x, 0.55 + h, z + 0.46, { w: 0.8, size: 70, color: '#5a3a1a' }); }
  return b;
}

// P01: the town at dusk, high and slow
shot('P01', { scene: { sky: ['#2a3a7a', '#f5a070'], bloom: 0.4, bloomThreshold: 1.3, exposure: 1.0, env: 0.15 }, build() {
  street({ lit: true, n: 8 }); getScene().userData.sun.intensity = 0.9; getScene().userData.hemi.intensity = 0.9; hum(-6, 160);
}, cam: dolly(P([-6, 11, 14], [0, 2, -14], 55), P([4, 9, 11], [0, 2, -14], 55)) });
// P02: a balloon slips away and fades in a sparkle (every lost thing goes somewhere)
shot('P02', { scene: { sky: ['#2a3a7a', '#f5a070'], bloom: 0.4, bloomThreshold: 1.3, exposure: 1.0, env: 0.15, dof: DOF }, build() {
  street({ lit: true }); getScene().userData.sun.intensity = 0.8; getScene().userData.hemi.intensity = 0.9;
  const K = person(KIDB, 0.4, -6.2, 0, 'idle'); K.pitch = -0.4;
  const b = new THREE.Mesh(new THREE.SphereGeometry(0.32, 18, 14), new THREE.MeshStandardMaterial({ color: 0xff4d6d, roughness: 0.25 })); b.scale.y = 1.15; add(b);
  const st = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 1.0, 4), new THREE.MeshStandardMaterial({ color: 0xffffff })); add(st);
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex(), color: 0xffd890, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false })); add(sp);
  on((u) => { const h = Math.max(0, u - 0.4); const y = 1.9 + h * h * 0.5 + h * 0.8, x = 0.6 + Math.sin(u * 1.4) * 0.3 + h * 0.2; const vis = u < 3.4; b.visible = st.visible = vis; b.position.set(x, y, -6.2); st.position.set(x, y - 0.8, -6.2); sp.position.set(x, y, -6.2); sp.material.opacity = Math.max(0, 1 - Math.abs(u - 3.4) / 0.35); sp.scale.setScalar(2.2); K.pose = u > 0.6 ? 'point' : 'present'; });
  shadowAt(0, -6, 8);
}, cam: dolly(P([0.9, 1.3, -1.6], [0.4, 1.1, -6.2], 56), P([0.8, 1.4, -2.0], [0.6, 4.2, -6.2], 56)) });
// P02b: one room: a door's outline glowing in the dark
shot('P02b', { scene: { night: true, bloom: 0.6, bloomThreshold: 0.8, exposure: 1.0, env: 0.05 }, build() {
  getScene().background = new THREE.Color(0x05050a); getScene().fog = new THREE.Fog(0x05050a, 6, 30); getScene().userData.hemi.intensity = 0.08; getScene().userData.sun.intensity = 0;
  oldDoor(0, -6); dust(140, 0, 1.6, -5, 4, 3, 3, { color: 0xffd890, size: 0.06, seed: 33 });
}, cam: dolly(P([0, 1.5, 0.5], [0, 1.4, -6], 46), P([0, 1.5, -1.6], [0, 1.4, -6], 46)) });
// P03: lost keys / lost letters / balloons slipping out of tiny hands
shot('P03', { scene: { ...DAY }, build() {
  street(); const k = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.04, 10, 24), new THREE.MeshStandardMaterial({ color: 0xe8c048, metalness: 0.9, roughness: 0.25 })); add(k);
  const kb = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.03, 0.42), k.material); add(kb);
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex(), color: 0xffd890, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false })); sp.position.set(0, 0.3, -6); sp.scale.setScalar(0.9); add(sp);
  on((u) => { const f = Math.min(1, u / 0.35); k.position.set(0, 0.28 + 1.1 * (1 - f * f), -6); k.rotation.set(1.2, u * 3, 0); kb.position.set(0.28, 0.28 + 1.1 * (1 - f * f), -6); const vis = u < 0.75; k.visible = kb.visible = vis; sp.material.opacity = Math.max(0, 1 - Math.abs(u - 0.75) / 0.2); });
  shadowAt(0, -6, 6);
}, cam: dolly(P([0.3, 1.25, -3.4], [0.1, 0.75, -6], 44), P([0.2, 1.2, -3.7], [0.1, 0.75, -6], 44)) });
shot('P03', { off: 0.5, scene: { ...DAY }, build() {
  street(); const l = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.5), new THREE.MeshStandardMaterial({ color: 0xfff6e8, side: THREE.DoubleSide })); add(l);
  label('To Grandma ♥', 0, 0, 0, { w: 0.3, size: 56, color: '#3a3a6a' }).visible = false;
  on((u) => { l.position.set(-0.8 + u * 2.0, 1.5 + Math.sin(u * 4) * 0.2 + u * 0.5, -5.2 + Math.sin(u * 2) * 0.3); l.rotation.set(Math.sin(u * 5) * 1.2, u * 2, Math.sin(u * 3)); });
  shadowAt(0, -6, 6);
}, cam: dolly(P([0, 1.6, -2.4], [0, 1.6, -6], 50), P([0.6, 1.9, -2.8], [0.6, 2.0, -6], 50)) });
shot('P03', { off: 1.22, scene: { ...DAY }, build() {
  street(); const K = person(KIDB, 0, -6.2, 0, 'present'); K.setFace('sad'); K.pitch = -0.45;
  const b = new THREE.Mesh(new THREE.SphereGeometry(0.3, 18, 14), new THREE.MeshStandardMaterial({ color: 0x4da8ff, roughness: 0.25 })); b.scale.y = 1.15; add(b);
  const st = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 1.0, 4), new THREE.MeshStandardMaterial({ color: 0xffffff })); add(st);
  on((u) => { const h = Math.max(0, u - 0.2); const y = 1.5 + h * 1.2 + h * h * 0.4; b.position.set(0.15 + h * 0.2, y, -6.0); st.position.set(0.15 + h * 0.2, y - 0.8, -6.0); });
  shadowAt(0, -6, 6);
}, cam: CU(0, -6.2, { hy: KH, d: 2.4, push: 0.3 }) });
// P04: night; the hum drifting along the empty street
shot('P04', { scene: NIGHT, build() { street({ lit: true, n: 8 }); stars(); getScene().userData.hemi.intensity = 0.5; hum(-6, 320); }, cam: dolly(P([0, 1.4, 2.0], [0, 1.8, -20], 56), P([0, 1.5, -2.0], [0, 1.9, -20], 56)) });
// P05: me, in my new room full of boxes, at the window
shot('P05', { scene: { ...WARM, bloom: 0.35 }, build() { bedroom({ boxes: true, lamp: 14, winC: 0x2a3a7a }); const A = person(ME, 0.6, -2.4, 0.3, 'idle', { face: 'sad' }); A.look = -0.2; shadowAt(0, -2, 6); }, cam: CU(0.6, -2.4, { d: 3.4 }) });
// P06: moving day: searching the boxes, Mister Button is gone
shot('P06', { scene: { ...WARM, bloom: 0.35 }, build() {
  bedroom({ boxes: true, lamp: 16, wall: 0xb8c8e0, winC: 0xcfe8ff }); const A = person(ME, -0.3, -2.0, -0.4, 'think', { face: 'confused' });
  on((u) => { A.pose = u < 1.9 ? 'type' : 'shrug'; A.setFace(u < 1.9 ? 'confused' : 'sad'); });
  blk(1.2, 0.08, 0.5, new THREE.MeshStandardMaterial({ color: 0x8a5a34 }), -2.6, 2.3, -3.6); label('?', -2.6, 2.75, -3.55, { w: 0.6, size: 120, color: '#ffffff' });
  shadowAt(0, -2, 6);
}, cam: dolly(P([1.6, 2.2, 1.8], [-0.6, 1.3, -2.4], 54), P([1.2, 2.1, 1.2], [-0.6, 1.4, -2.4], 54)) });
// P07: "I know. I'm sixteen."
shot('P07', { scene: { ...WARM, bloom: 0.35 }, build() { bedroom({ boxes: true, lamp: 16, wall: 0xb8c8e0, winC: 0xcfe8ff }); const A = person(ME, 0, -2.4, 0, 'shrug', { face: 'smile' }); shadowAt(0, -2, 6); }, cam: CU(0, -2.4) });
// P08: the memory (warm): Dad gives me the bunny; then he walks out into the light
shot('P08', { scene: { interior: true, bloom: 0.4, bloomThreshold: 0.84, exposure: 0.95, dof: DOF }, build() {
  bedroom({ wall: 0xf0c890, lamp: 16, winC: 0xffe2a0 }); getScene().fog = new THREE.Fog(0xffd8a0, 4, 26);
  const D = person(DAD, 0.6, -2.2, -0.6, 'present'); const K = person(KID, -0.5, -1.6, 0.6, 'idle', { face: 'smile' }); K.pitch = -0.3;
  const bn = bunny({ scale: 0.5 }); on((u) => { const k = sm(0.6, 1.8, u); bn.position.set(lerp(0.25, -0.35, k), lerp(1.25, 0.72, k), lerp(-1.85, -1.45, k)); bn.rotation.y = 0.6; K.pose = u > 1.6 ? 'present' : 'idle'; });
  dust(160, 0, 2, -2, 6, 3, 4, { color: 0xffe2a0, seed: 41 }); shadowAt(0, -2, 6);
}, cam: dolly(P([1.8, 1.7, 2.6], [0, 1.2, -1.9], 50), P([1.4, 1.6, 2.0], [0, 1.2, -1.9], 50)) });
shot('P08', { off: 2.72, scene: { interior: true, bloom: 0.55, bloomThreshold: 0.75, exposure: 0.95, dof: DOF }, build() {
  room({ wall: 0xd8b080, floor: '#8a6a4a', w: 9, d: 8, h: 5, lamp: 6 }); getScene().fog = new THREE.Fog(0xffd8a0, 4, 30);
  const door = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 3.0), new THREE.MeshBasicMaterial({ color: 0xfff0d0 })); door.position.set(0, 1.5, -3.83); add(door);
  const D = person(DAD, 0, -2.6, Math.PI, 'walk'); D.anim = (Q, u) => { Q.root.position.z = -2.6 - u * 0.5; };
  const K = person(KID, -0.6, 0.6, Math.PI, 'idle'); const bn = bunny({ scale: 0.5 }); bn.position.set(-0.6, 0.6, 0.35); bn.rotation.y = Math.PI;
  shadowAt(0, -1, 6);
}, cam: dolly(P([-0.4, 1.3, 3.0], [-0.1, 1.3, -3.6], 50), P([-0.4, 1.3, 2.6], [-0.1, 1.4, -3.6], 50)) });
// P08b: "Keep him safe for me, buddy."
shot('P08b', { scene: { interior: true, bloom: 0.4, bloomThreshold: 0.84, exposure: 0.95, dof: DOF }, build() {
  bedroom({ wall: 0xf0c890, lamp: 16, winC: 0xffe2a0 }); getScene().fog = new THREE.Fog(0xffd8a0, 4, 26);
  const D = person(DAD, 0, -2.2, 0, 'present', { face: 'smile' }); D.pitch = 0.25; dust(120, 0, 2, -2, 5, 3, 3, { color: 0xffe2a0, seed: 43 }); shadowAt(0, -2, 6);
}, cam: CU(0, -2.2, { hy: 1.94 * 1.06, d: 3.2 }) });
// P09: so I went looking
shot('P09', { scene: { ...DAY }, build() { street(); const A = person(ME, -3, -6.0, Math.PI / 2, 'walk'); A.anim = (Q, u) => { Q.root.position.x = -3 + u * 1.5; }; shadowAt(-1, -6, 8); }, cam: dolly(P([1.5, 1.8, -2.0], [-1.6, 1.4, -6], 54), P([1.8, 1.8, -2.2], [-0.8, 1.4, -6], 54)) });
// P10: the antique shop: she laughs... then stops
shot('P10', { scene: { interior: true, bloom: 0.5, bloomThreshold: 0.78, exposure: 1.05, dof: DOF }, build() {
  antiqueShop(); const O = person(OLD, 0, -3.6, 0, 'idle'); on((u) => { O.setFace(u < 2.3 ? 'smile' : 'confused'); O.pose = u < 2.3 ? 'shrug' : 'idle'; });
  const A = person(ME, 0.7, -0.6, Math.PI + 0.25, 'idle');
}, cam: dolly(P([-1.0, 2.1, 1.4], [0.1, 1.6, -3.6], 50), P([-0.8, 2.05, 0.8], [0.1, 1.65, -3.6], 50)) });
// P11: "Follow the sound of the thing you miss the most... don't stay past sunrise."
shot('P11', { scene: { interior: true, bloom: 0.5, bloomThreshold: 0.78, exposure: 1.05, dof: DOF }, build() {
  antiqueShop(); const O = person(OLD, 0, -3.6, 0, 'point', { face: 'confused' }); on((u) => { O.pose = u > 2.2 ? 'point' : 'idle'; });
}, cam: CU(0, -3.6, { d: 3.0, push: 0.6 }) });
// P12: that night: the hum leads to an old door at the end of my street
shot('P12', { scene: NIGHT, build() {
  street({ lit: true, n: 8 }); stars(); getScene().userData.hemi.intensity = 0.5; oldDoor(0, -24); hum(-14, 260);
  const A = person(PJ, -1.0, -5.4, Math.PI, 'idle'); A.look = 0.0;
}, cam: dolly(P([1.4, 1.9, -1.8], [0, 1.6, -24], 50), P([1.2, 1.85, -2.6], [0, 1.6, -24], 50)) });
// P12b: flashlight, pajamas
shot('P12b', { scene: NIGHT, build() {
  street({ lit: true, n: 8 }); stars(); getScene().userData.hemi.intensity = 0.45;
  const A = person(PJ, 0, -6.0, Math.PI, 'point', { face: 'smile' }); A.anim = (Q, u) => { Q.root.position.z = -6.0 - u * 0.8; Q.pose = 'walk'; };
  flashlight((u) => [0.5, 1.4, -6.4 - u * 0.8], (u) => [0.3 + Math.sin(u * 1.5) * 0.8, 0, -13 - u * 0.8], { power: 40 });
}, cam: dolly(P([0.4, 1.8, -1.4], [0, 1.4, -10], 52), P([0.3, 1.8, -2.2], [0, 1.4, -11], 52)) });
// P13: the door that had never been there before
shot('P13', { scene: NIGHT, build() {
  ground({ road: false, grass: 0x3a5a2a }); getScene().userData.hemi.intensity = 0.6; oldDoor(0, -6); sparkles(0, 0.2, -5.4, { n: 60, R: 1.2, h: 3, color: 0xffd890 });
  const A = person(PJ, -1.3, -3.2, Math.PI - 0.35, 'idle');
}, cam: dolly(P([1.2, 1.6, 0.6], [-0.2, 1.5, -6], 48), P([0.9, 1.55, -0.4], [-0.2, 1.5, -6], 48)) });
// P14: it opens... light floods out
shot('P14', { scene: { night: true, bloom: 0.45, bloomThreshold: 0.95, exposure: 0.95, env: 0.1 }, build() {
  ground({ road: false, grass: 0x3a5a2a }); getScene().userData.hemi.intensity = 0.6; oldDoor(0, -6, { open: (u) => sm(0.2, 1.4, u) });
  const A = person(PJ, -1.0, -3.6, Math.PI - 0.25, 'idle'); sparkles(0, 0.2, -5.6, { n: 120, R: 1.0, h: 3, color: 0xffd890 });
}, cam: dolly(P([0.6, 1.7, 0.6], [0, 1.6, -6], 50), P([0.4, 1.6, -1.6], [0, 1.6, -6], 50)) });
// P15: the Lost Room: wide reveal, then umbrellas / socks / keys
shot('P15', { scene: ROOM, build() { lostRoom(); const A = person(PJ, 0, -3, Math.PI, 'idle'); A.pitch = -0.2; }, cam: dolly(P([0, 1.6, 3.5], [0, 4.0, -40], 58), P([0, 5.0, 1.0], [0, 4.5, -40], 58)), focus: () => 30 });
shot('P15', { off: 1.35, scene: ROOM, build() { lostRoom({ kites: false }); }, cam: dolly(P([-0.4, 1.2, -3.6], [-3, 0.5, -7], 46), P([-0.7, 1.15, -4.0], [-3, 0.5, -7], 46)) });
shot('P15', { off: 2.75, scene: ROOM, build() { lostRoom({ kites: false }); }, cam: dolly(P([0.5, 0.9, -4.5], [4, 0.6, -9], 46), P([0.9, 0.9, -5.2], [4, 0.6, -9], 46)) });
// P16: rings and phones
shot('P16', { scene: ROOM, build() { lostRoom({ kites: false }); const sp = new THREE.PointLight(0xffe0b0, 5, 5, 1.6); sp.position.set(4, 2, -7.6); add(sp); }, cam: dolly(P([3.2, 1.4, -6.6], [4, 0.5, -9], 40), P([3.4, 1.3, -7.0], [4, 0.5, -9], 40)) });
// P16b: kites in invisible trees, letters, balloons on the ceiling
shot('P16b', { scene: ROOM, build() { lostRoom({ pagesN: 110 }); const A = person(PJ, 0, -8, 0.3, 'idle'); A.pitch = -0.5; }, cam: dolly(P([1, 1.4, -2], [0, 10, -26], 60), P([0.5, 1.8, -4], [0, 13, -26], 60)) });
// P17: me, looking around with the flashlight
shot('P17', { scene: ROOM, build() {
  lostRoom({ kites: false }); const A = person(PJ, 0, -12, 0, 'point'); on((u) => { A.look = Math.sin(u * 0.9) * 0.5; });
  flashlight(() => [0.5, 1.4, -12.2], (u) => [Math.sin(u * 0.9) * 4, 0.5, -18], { power: 25 });
}, cam: CU(0, -12, { d: 3.2 }) });
// P18 + P18b: searching for hours; holding a teddy
shot('P18', { scene: ROOM, build() {
  lostRoom({ kites: false }); const A = person(PJ, 2, -12.5, 2.5, 'type'); const r = []; for (let i = 0; i < 8; i++) { const t = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, 0.3), new THREE.MeshStandardMaterial({ color: [0xd23a3a, 0xf5c84a, 0x3a6fd6, 0x3aa655][i % 4] })); add(t); r.push(t); }
  heap(2.5, -14, 2.2, 1.6, 160, ['toy', 'teddy'], 51);
  on((u) => r.forEach((t, i) => { const q = ((u * 1.6 + i * 0.37) % 1); t.position.set(2.3 + Math.sin(i) * 0.9 * q, 1.2 + 2.6 * q - 4 * q * q, -13.4 + q * 1.2); t.rotation.set(q * 6, q * 4, 0); }));
}, cam: dolly(P([4.6, 2.2, -9.4], [2.4, 1.0, -13], 50), P([4.2, 2.0, -9.8], [2.4, 1.0, -13], 50)) });
shot('P18b', { scene: ROOM, build() {
  lostRoom({ kites: false }); const A = person(PJ, 0, -12.5, 0, 'present', { face: 'sad' }); A.pitch = 0.3;
  const t = new THREE.Mesh(new THREE.SphereGeometry(0.22, 14, 12), new THREE.MeshStandardMaterial({ color: 0x9a6a3a, roughness: 0.95 })); t.position.set(0, 1.25, -11.95); add(t);
  for (const s of [-1, 1]) { const e = new THREE.Mesh(new THREE.SphereGeometry(0.08, 10, 8), t.material); e.position.set(s * 0.15, 1.45, -11.95); add(e); }
}, cam: CU(0, -12.5, { d: 3.0 }) });
// P19: then I heard someone crying
shot('P19', { scene: ROOM, build() { lostRoom({ kites: false }); const A = person(PJ, 0, -20, 0, 'idle', { face: 'shock' }); on((u) => { A.look = sm(0.2, 0.8, u) * 0.7; }); }, cam: CU(0, -20, { d: 3.0 }) });
// P20-P25: behind a pile of toys, a little boy hugging my bunny
function kidScene(o = {}) {
  lostRoom({ kites: false, pagesN: 40, sunrise: o.sunrise });
  heap(4.9, -25.2, 2.0, 1.8, 180, ['toy', 'teddy', 'book'], 61);
  const K = person(KID, 3.2, -26.6, 0.1, 'present', { face: o.kidFace ?? 'cry' });
  const bn = bunny({ scale: 0.5 }); bn.position.set(3.22, 0.5, -26.38); bn.rotation.y = 0.1;
  const A = person(PJ, o.meX ?? -0.4, o.meZ ?? -22.2, o.meYaw ?? Math.PI + 0.45, 'idle', { face: o.meFace ?? 'shock' });
  return { K, A, bn };
}
shot('P20', { scene: ROOM, build() { kidScene({ meFace: 'shock' }); }, cam: dolly(P([1.6, 2.2, -19.4], [3.1, 0.8, -26.4], 46), P([1.8, 2.0, -20.6], [3.1, 0.8, -26.4], 46)) });
shot('P21', { scene: ROOM, build() { kidScene(); }, cam: CU(3.2, -26.6, { hy: KH, d: 2.3, push: 0.3, side: -0.45 }) });
shot('P22', { scene: ROOM, build() { const { K } = kidScene(); on((u) => { K.pitch = -0.4 * sm(0.3, 1.1, u); }); }, cam: CU(3.2, -26.6, { hy: KH, d: 2.1, push: 0.2, side: -0.45 }) });
shot('P23', { scene: ROOM, build() { const { K } = kidScene(); K.pitch = -0.4; K.setFace('sad'); }, cam: CU(3.2, -26.6, { hy: KH, d: 1.9, push: 0.15, side: -0.4 }) });
shot('P24', { scene: ROOM, build() { kidScene({ meX: 3.0, meZ: -24.6, meYaw: Math.PI, meFace: 'shock' }); }, cam: dolly(P([2.6, 1.85, -27.9], [3.0, 1.55, -24.6], 50), P([2.7, 1.85, -27.5], [3.0, 1.6, -24.6], 50)) });
// P24b: side by side: same bunny, same jacket, same tears (I kneel next to him)
shot('P24b', { scene: ROOM, build() { const { A } = kidScene({ meX: 2.2, meZ: -26.4, meYaw: 0.25, meFace: 'cry' }); A.pose = 'sit'; A.root.position.y = 0.05; }, cam: dolly(P([2.8, 1.25, -23.4], [2.7, 0.95, -26.5], 48), P([2.8, 1.25, -23.9], [2.7, 0.95, -26.5], 48)) });
shot('P25', { scene: ROOM, build() { const { A } = kidScene({ meX: 2.2, meZ: -26.4, meYaw: 0.25, meFace: 'cry' }); A.pose = 'sit'; A.root.position.y = 0.05; }, cam: CU(2.2, -26.4, { hy: 1.94 - 0.9 * 0.42 + 0.05, d: 2.6, push: 0.3 }) });
// P26-P27: the skylights turn orange: sunrise
shot('P26', { scene: ROOM, build() { lostRoom({ kites: false, sunrise: (u, d) => sm(0.2, d + 0.5, u) }); }, cam: dolly(P([0, 2.0, -18], [0, 18, -30], 60), P([0, 2.2, -19], [0, 20, -30], 60)) });
shot('P27', { scene: ROOM, build() { kidScene({ sunrise: () => 1, kidFace: 'sad', meX: 2.2, meZ: -26.4, meYaw: 0.25, meFace: 'shock' }).A.pose = 'idle'; }, cam: dolly(P([4.6, 1.6, -22.0], [3.0, 1.3, -26.4], 50), P([4.4, 1.6, -22.6], [3.0, 1.3, -26.4], 50)) });
shot('P27b', { scene: ROOM, build() { const { K } = kidScene({ sunrise: () => 1, kidFace: 'sad', meX: 1.0, meZ: -26.0, meYaw: 0.6 }); on((u) => { K.look = u < 0.7 ? -0.6 : 0.9; K.pitch = -0.3; }); }, cam: CU(3.2, -26.6, { hy: KH, d: 2.1, push: 0.2, side: -0.45 }) });
// P28-P29: behind me, the door begins to close
function doorScene() {
  lostRoom({ kites: false, sunrise: () => 1 }); const D = oldDoor(0, 8.6, { open: (u, d) => 1 - sm(0.1, 3.5, u) * 0.7 }); D.rotation.y = Math.PI;
  for (const s of [-1, 1]) blk(16, 22, 1, new THREE.MeshStandardMaterial({ color: 0x6a3a24, roughness: 0.9 }), s * 12, 11, 8.6, { k: 0.01 });
  return D;
}
shot('P28', { scene: ROOM, build() { doorScene(); const A = person(PJ, 0.8, -1.5, 0.3, 'idle', { face: 'shock' }); on((u) => { A.root.rotation.y = 0.3 + sm(0.2, 0.9, u) * 2.6; }); }, cam: dolly(P([-1.0, 2.0, -6.0], [0.3, 1.6, 6], 52), P([-0.8, 1.9, -5.2], [0.3, 1.6, 6], 52)) });
shot('P29', { scene: ROOM, build() {
  doorScene(); const A = person(PJ, 0.3, -1.2, Math.PI, 'idle', { face: 'shock' }); const K = person(KID, 1.0, -1.6, Math.PI + 0.4, 'idle', { face: 'sad' });
  const bn = bunny({ scale: 0.5 }); bn.position.set(1.05, 0.5, -1.35); bn.rotation.y = Math.PI;
}, cam: dolly(P([0.6, 1.4, -5.4], [0.5, 1.4, 6], 50), P([0.6, 1.5, -6.4], [0.5, 1.6, 6], 50)) });
