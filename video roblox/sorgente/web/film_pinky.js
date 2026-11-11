// "Your pinky looks useless..." -- body series (looks useless -> catastrophe without it). Shots for script_pinky.py
import { THREE, shot, person, street, ground, house, tree, room, glowTex, stars, add, on, onPost, camLerp, sm, lerp, getScene, shadowAt } from './kit.js';
import { blk, dust, sparkles } from './sets.js';
import { ME, PP, P, dolly, CUY, M_, DOF, DAY, rnd, dynLabel } from './whatif.js';
import { bigHand } from './body.js';

const STUDIO = { interior: true, bloom: 0.35, bloomThreshold: 1.0, exposure: 0.95, env: 0.5, dof: DOF };
const ENG = { skin: 0xf0d0b0, shirt: 0xf28c28, pants: 0x2a3a6a, hair: { style: 'short', color: 0x3a2414 } };
function hardhat(A) { const h = new THREE.Mesh(new THREE.SphereGeometry(0.78, 24, 12, 0, 6.283, 0, Math.PI / 2), M_(0xf5c820, { r: 0.35 })); h.position.y = 0.55; A.head.add(h); const b = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 0.95, 0.06, 28), h.material); b.position.y = 0.56; A.head.add(b); }
function studio(col = 0x2a3a5a) { const S = getScene(); S.background = new THREE.Color(col); S.fog = new THREE.Fog(col, 12, 40); S.userData.hemi.intensity = 0.8; S.userData.sun.intensity = 1.6; S.userData.sun.position.set(6, 12, 14); S.userData.sun.target.position.set(0, 0, 0);
  const fl = new THREE.Mesh(new THREE.CircleGeometry(8, 48), M_(0x1a2234, { r: 0.4 })); fl.rotation.x = -Math.PI / 2; fl.position.y = -2.6; fl.receiveShadow = true; add(fl); }
const glow = (x, y, z, c = 0xffd23a, s = 1.4) => { const g = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex(), color: c, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false })); g.position.set(x, y, z); g.scale.setScalar(s); add(g); return g; };

// K01: the pinky looks useless (glowing, pointed at)
shot('K01', { scene: STUDIO, build() { studio(); const H = bigHand({ pos: [0, 0, 0] }); const gl = glow(0.72, 1.9, 0.4); on((u) => { gl.material.opacity = 0.5 + 0.4 * Math.sin(u * 6); H.g.rotation.y = Math.sin(u * 0.8) * 0.12; });
  dynLabel(() => 'USELESS?', 0, 3.75, 0, { w: 3.4, size: 190, color: '#ffd23a' }); }, cam: dolly(P([0, 1.0, 7.6], [0, 0.9, 0], 50), P([0, 1.0, 7.0], [0, 0.9, 0], 50)) });
// K02: tiny, weak, barely used: so let's get rid of it (poof)
shot('K02', { scene: STUDIO, build() { studio(); const H = bigHand({ pos: [0, 0, 0] }); sparkles(0.72, 1.3, 0.3, { n: 90, R: 0.5, h: 1.4, color: 0xffffff, amount: (u) => Math.max(0, 1 - Math.abs(u - 1.4) / 0.5) });
  on((u) => H.setPinky(u < 1.4)); dynLabel((u) => u < 1.4 ? 'DELETE?' : 'DELETED', 0, 3.75, 0, { w: 3.4, size: 180, color: '#ff5a4a' }); }, cam: dolly(P([0.3, 1.0, 7.4], [0, 0.9, 0], 50), P([0.2, 1.0, 6.8], [0, 0.9, 0], 50)) });
// K03: hand surgeons: the pinky gives up to half of your grip strength (a grip meter falling)
shot('K03', { scene: STUDIO, build() { studio(0x1a2a3a); const H = bigHand({ pos: [-0.7, -0.3, 0], curl: (u) => { const k = 0.85; return [k, k, k, u < 1.4 ? k : 0, 0.7]; } }); on((u) => H.setPinky(u < 1.4));
  const bar = blk(0.6, 4.2, 0.3, M_(0x2a2a30), 2.0, 0.6, 0); const fill = new THREE.Mesh(new THREE.BoxGeometry(0.44, 1, 0.32), M_(0x4dd84a, { em: 0x2a8a2a, ei: 0.5 })); add(fill);
  on((u) => { const k = lerp(1, 0.5, sm(1.4, 2.4, u)); fill.scale.y = 4 * k; fill.position.set(2.0, -1.4 + 2 * k, 0.02); fill.material.color.set(k > 0.7 ? 0x4dd84a : 0xff8a3a); });
  dynLabel((u) => 'GRIP ' + Math.round(100 * lerp(1, 0.5, sm(1.4, 2.4, u))) + '%', 0.6, 3.6, 0, { w: 4, size: 170, color: '#ffffff' }); }, cam: dolly(P([0.6, 1.0, 9.0], [0.6, 0.8, 0], 50), P([0.5, 1.0, 8.4], [0.6, 0.8, 0], 50)) });
// K04: make a fist without it: it can't close tight anymore
shot('K04', { scene: STUDIO, build() { studio(); const H = bigHand({ pos: [0, 0, 0], curl: (u) => { const a = sm(0.2, 1.0, u) * 0.95, b = sm(1.6, 2.4, u); return [a * (1 - 0.35 * b), a * (1 - 0.3 * b), a * (1 - 0.4 * b), 0, a * 0.8]; } }); H.setPinky(false);
  const gap = glow(0.5, 1.2, 0.6, 0xff4a4a, 1.6); on((u) => { gap.material.opacity = sm(1.8, 2.4, u) * (0.5 + 0.3 * Math.sin(u * 8)); H.g.rotation.y = -0.3; });
  dynLabel((u) => u < 1.6 ? 'FIST' : 'NOT TIGHT', 0, 3.4, 0, { w: 3.0, size: 180, color: (s) => s === 'FIST' ? '#ffffff' : '#ff5a4a' }); }, cam: dolly(P([1.6, 1.2, 7.0], [0, 0.8, 0], 50), P([1.4, 1.2, 6.4], [0, 0.8, 0], 50)) });
// K05: phones slip, cups slip, opening a jar? forget it
shot('K05', { scene: DAY, build() { street(); const A = person(ME, 0, -6, 0, 'present', { face: 'smile' });
  const phone = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.3, 0.03), M_(0x18181c, { r: 0.2 })); add(phone); const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.07, 0.2, 16), M_(0xffffff)); add(cup);
  on((u) => { const f1 = Math.max(0, u - 0.6), f2 = Math.max(0, u - 1.4); phone.position.set(-0.45 + f1 * 0.2, Math.max(0.03, 1.15 - 4.9 * f1 * f1), -5.6 + f1 * 0.3); phone.rotation.set(f1 * 6, 0, f1 * 3); cup.position.set(0.45, Math.max(0.1, 1.15 - 4.9 * f2 * f2), -5.6 + f2 * 0.3); cup.rotation.z = Math.min(1.57, f2 * 5); A.setFace(u < 0.7 ? 'smile' : 'shock'); A.pose = u < 0.7 ? 'present' : 'shock'; });
  dynLabel((u) => u < 1.4 ? 'PHONE' : u < 2.0 ? 'CUP' : 'JAR', 0, 2.3, -5.2, { w: 1.2, size: 170, color: '#ffd23a' }); shadowAt(0, -6, 8); }, cam: CUY(0, -6, 0, { d: 4.2, side: 0.3, hy: 1.7 }) });
// K06: builders drop their hammers; drivers can't hold the wheel
shot('K06', { scene: DAY, build() { ground({ road: false, grass: 0x9a8a6a }); for (let i = 0; i < 5; i++) blk(0.3, 6, 0.3, M_(0x8a5a34), -3 + i * 1.5, 3, -9); for (const y of [2, 4]) blk(6.4, 0.25, 1.2, M_(0xa87a4a), 0, y, -8.6);
  const E = person(ENG, -0.6, -8.4, 0.2, 'throw', { face: 'shock', y: 2.12 }); hardhat(E);
  const hm = new THREE.Group(); add(hm); const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.6, 8), M_(0x8a5a34)); hm.add(handle); const head = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.12, 0.12), M_(0x5a5a62, { m: 0.8 })); head.position.y = 0.3; hm.add(head);
  on((u) => { const q = Math.max(0, u - 0.5); hm.position.set(-0.2 + q * 1.6, Math.max(0.1, 3.6 + q * 2.2 - 4.9 * q * q), -8.0 + q * 1.4); hm.rotation.set(q * 9, 0, q * 7); });
  dynLabel(() => 'HAMMER', 0.9, 5.3, -8, { w: 2.4, size: 170, color: '#ffd23a' }); shadowAt(0, -8, 10); }, cam: dolly(P([2.5, 3.0, -1.5], [0, 3.2, -8.5], 52), P([2.2, 3.0, -2.2], [0, 3.2, -8.5], 52)) });
// K07: pull-ups, climbing, hanging on to a rope: almost impossible (slips off the bar)
shot('K07', { scene: DAY, build() { ground({ road: false }); tree(-5, -12, 1.1, 3); for (const s of [-1, 1]) blk(0.15, 3.4, 0.15, M_(0x3a3a40, { m: 0.6 }), s * 1.4, 1.7, -6); const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 2.9, 10), M_(0xc8ccd2, { m: 0.9, r: 0.2 })); bar.rotation.z = Math.PI / 2; bar.position.set(0, 3.4, -6); add(bar);
  const A = person(ME, 0, -6, 0, 'cheer', { face: 'pain' }); A.anim = (Q, u) => { const q = Math.max(0, u - 1.4); Q.root.position.y = Math.max(0, 1.2 - 4.9 * q * q); Q.pose = q > 0 ? 'shock' : 'cheer'; Q.setFace(q > 0 ? 'shock' : 'pain'); };
  onPost((u) => { if (u < 1.4) { A.armL.rotation.set(0, 0, -3.0); A.armR.rotation.set(0, 0, 3.0); } });
  dynLabel((u) => u < 1.4 ? 'HOLD ON...' : 'SLIP', 0, 4.2, -5.6, { w: 2.4, size: 170, color: '#ffffff' }); shadowAt(0, -6, 8); }, cam: dolly(P([0.6, 2.4, -1.0], [0, 2.4, -6], 54), P([0.5, 2.3, -1.6], [0, 2.3, -6], 54)) });
// K08: now imagine everyone on Earth without their pinkies (a crowd waving four-finger hands)
shot('K08', { scene: DAY, build() { street({ n: 8 }); const r = rnd(5);
  for (let i = 0; i < 26; i++) { const d = PP[i % PP.length], x = -9 + (i % 9) * 2.2 + (r() - 0.5), z = -3 - Math.floor(i / 9) * 2.4; const A = person(d, x, z, (r() - 0.5) * 0.6, 'cheer', { face: 'confused' }); A.phase = r() * 6; }
  dynLabel(() => '8 BILLION', 0, 5.6, -8, { w: 6, size: 190, color: '#ffffff', stroke: '#c8281a' }); shadowAt(0, -6, 14); }, cam: dolly(P([0, 4.5, 9], [0, 2.4, -6], 54), P([0, 4.2, 7.5], [0, 2.4, -6], 54)) });
// K09: ladders, cranes, rock climbers: every single grip weaker (a crane drops its load, a climber slides)
shot('K09', { scene: { ...DAY, sky: ['#7aa0c8', '#e8eef2'] }, build() { ground({ road: false, grass: 0x9a9a8a });
  const crane = new THREE.Group(); add(crane); const ym = M_(0xf5c820, { r: 0.5 }); const mast = new THREE.Mesh(new THREE.BoxGeometry(0.8, 18, 0.8), ym); mast.position.set(-4, 9, -18); crane.add(mast); const jib = new THREE.Mesh(new THREE.BoxGeometry(16, 0.6, 0.6), ym); jib.position.set(2, 18, -18); crane.add(jib);
  const cable = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1, 6), M_(0x2a2a2a)); add(cable); const load = blk(2.6, 1.0, 1.2, M_(0x8a8a92, { m: 0.6 }), 3, 12, -18);
  on((u) => { const q = Math.max(0, u - 0.8); const y = Math.max(0.5, 12 - 4.9 * q * q); load.position.y = y; load.rotation.z = Math.min(0.4, q * 0.5); cable.visible = q === 0; cable.position.set(3, 15, -18); cable.scale.y = 6; });
  const rock = blk(5, 14, 4, M_(0x8a7a6a, { r: 0.9 }), -5.5, 7, -12, { k: 0.05 }); const C = person({ ...PP[0], acc: [] }, -3.2, -10.0, Math.PI / 2 + 0.3, 'cheer', { face: 'shock', y: 6 }); C.anim = (Q, u) => { const q = Math.max(0, u - 1.4); Q.root.position.y = Math.max(0, 6 - 3 * q * q); };
  dynLabel(() => 'EVERY GRIP', -0.5, 14.5, -14, { w: 6, size: 170, color: '#ff5a4a' }); shadowAt(0, -12, 20); }, cam: dolly(P([0.5, 5, 12], [-0.5, 6.5, -14], 58), P([0.4, 5.2, 10.6], [-0.5, 6.6, -14], 58)) });
// K10: the smallest finger... was holding everything together (the pinky comes back, glowing)
shot('K10', { scene: STUDIO, build() { studio(0x1a1a2a); const H = bigHand({ pos: [0, 0, 0], curl: (u) => { const a = 0.95 * sm(1.0, 2.0, u); return [a, a, a, a, a * 0.8]; } }); H.setPinky(false);
  sparkles(0.72, 1.3, 0.3, { n: 90, R: 0.5, h: 1.4, color: 0xffd23a, amount: (u) => Math.max(0, 1 - Math.abs(u - 0.6) / 0.5) }); const gl = glow(0.72, 1.6, 0.5, 0xffd23a, 1.6);
  on((u) => { H.setPinky(u > 0.6); gl.material.opacity = u > 0.6 ? 0.6 : 0; H.g.rotation.y = -0.2; });
  dynLabel(() => 'THE SMALLEST\nFINGER', 0, 3.4, 0, { w: 2.9, size: 140, color: '#ffd23a' }); }, cam: dolly(P([0.8, 1.0, 7.4], [0, 0.8, 0], 50), P([0.6, 1.0, 6.6], [0, 0.8, 0], 50)), fx: (u, d) => ({ fade: sm(d - 0.7, d, u) }) });
