// "Eyelashes are just for looks... right?" -- body series (looks useless -> catastrophe). Shots for script_lashes.py
import { THREE, shot, person, street, ground, glowTex, add, on, onPost, camLerp, sm, lerp, getScene, shadowAt } from './kit.js';
import { blk, dust, sparkles } from './sets.js';
import { ME, PP, P, dolly, CUY, M_, DOF, DAY, rnd, dynLabel } from './whatif.js';
import { bigEye, particles } from './body.js';

const STUDIO = { interior: true, bloom: 0.3, bloomThreshold: 1.5, exposure: 0.85, env: 0.5, dof: { aperture: 0.0015, maxblur: 0.005 } };
function studio(col = 0x2a3a5a) { const S = getScene(); S.background = new THREE.Color(col); S.fog = new THREE.Fog(col, 12, 40); S.userData.hemi.intensity = 0.9; S.userData.sun.intensity = 1.8; S.userData.sun.position.set(5, 10, 14); S.userData.sun.target.position.set(0, 0, 0); }
const CAM = (z = 7.2, z2 = 6.6) => dolly(P([0, 0.3, z], [0, 0.3, 0], 50), P([0, 0.3, z2], [0, 0.3, 0], 50));
// a small blink every few seconds
const blinkAt = (ts) => (u) => { let k = 1; for (const t of ts) { const q = Math.abs(u - t); if (q < 0.18) k = Math.min(k, q / 0.18); } return k; };
// wind streaks flowing across the eye (curving over it when shielded)
function wind(eye, shield) { const n = 40, segs = []; const m = new THREE.LineBasicMaterial({ color: 0xbfe0ff, transparent: true, opacity: 0.45 });
  for (let i = 0; i < n; i++) { const pts = []; for (let k = 0; k < 24; k++) pts.push(new THREE.Vector3()); const g = new THREE.BufferGeometry().setFromPoints(pts); const l = new THREE.Line(g, m); l.frustumCulled = false; add(l); segs.push([l, g, (i * 0.137) % 1, -2.2 + (i % 10) * 0.45]); }
  on((u, d) => { const sh = shield(u, d), R = eye.R; segs.forEach(([l, g, ph, y0]) => { const p = g.attributes.position.array, off = ((u * 0.6 + ph) % 1) * 10 - 5;
    for (let k = 0; k < 24; k++) { const x = off + k * 0.12 - 6, dy = y0; let y = dy, z = 1.9; const dd = Math.sqrt(x * x + dy * dy); if (dd < R * 1.6 && sh > 0.5) { y += Math.sign(dy || 1) * (R * 1.6 - dd) * 0.7; z += (R * 1.6 - dd) * 0.8; } p.set([x, y + 0.3, z], k * 3); } g.attributes.position.needsUpdate = true; }); });
}

// L01: just for looks... right? (a big eye with long lashes, blinking)
shot('L01', { scene: STUDIO, build() { studio(); bigEye({ pos: [0, 0.3, 0], open: blinkAt([1.2]) }); dynLabel(() => 'JUST FOR LOOKS?', 0, 2.9, 0, { w: 3.0, size: 100, color: '#ffd23a' }); }, cam: CAM() });
// L02: the perfect length: about one third of the eye's width (a ruler)
shot('L02', { scene: STUDIO, build() { studio(); const E = bigEye({ pos: [0, 0.3, 0], open: blinkAt([4.2]) });
  const ruler = blk(3.2, 0.22, 0.06, M_(0xffd23a, { r: 0.4 }), 0, -2.0, 1.4); for (let i = 0; i <= 12; i++) blk(0.025, i % 4 ? 0.1 : 0.2, 0.02, M_(0x1a1a1a), -1.5 + i * 0.25, -1.95, 1.44);
  const third = blk(1.0, 0.08, 0.05, M_(0xff4a4a, { em: 0x8a1a1a, ei: 0.6 }), -1.0, -1.72, 1.42); on((u) => { third.visible = u > 1.6; });
  dynLabel((u) => u < 1.6 ? 'PERFECT LENGTH' : '= 1/3 OF THE EYE', 0, 2.9, 0, { w: 3.0, size: 115, color: '#ffffff' }); }, cam: CAM(7.6, 7.0) });
// L03: they slow the air hitting your eye: half the dust and drying
shot('L03', { scene: STUDIO, build() { studio(0x1a2a3a); const E = bigEye({ pos: [0, 0.3, 0] }); wind(E, () => 1); particles(E, { n: 120, shield: () => 1 });
  dynLabel(() => '-50% DUST', 0, 2.9, 0, { w: 3.2, size: 160, color: '#7ad0ff' }); }, cam: CAM() });
// L04: they're sensors: touch one and you blink (a speck touches a lash -> blink)
shot('L04', { scene: STUDIO, build() { studio(); const E = bigEye({ pos: [0, 0.3, 0], open: (u) => { const q = u - 1.3; return q > 0 && q < 0.5 ? Math.abs(q - 0.25) / 0.25 : 1; } });
  const speck = new THREE.Mesh(new THREE.SphereGeometry(0.08, 10, 8), M_(0x5a4a3a)); add(speck); on((u) => { const k = sm(0, 1.3, u); speck.position.set(lerp(3, 0.3, k), lerp(2.6, 1.85, k), lerp(2.5, 1.7, k)); speck.visible = u < 1.45; });
  sparkles(0.3, 1.8, 1.6, { n: 30, R: 0.2, h: 0.4, color: 0xffd23a, amount: (u) => Math.max(0, 1 - Math.abs(u - 1.35) / 0.3) });
  dynLabel(() => 'SENSOR', 0, 2.9, 0, { w: 2.8, size: 170, color: '#ffd23a' }); }, cam: CAM() });
// L05: now remove them (poof)
shot('L05', { scene: STUDIO, build() { studio(); bigEye({ pos: [0, 0.3, 0], lashes: (u) => u < 0.35 }); sparkles(0, 1.7, 1.2, { n: 120, R: 1.2, h: 0.8, color: 0xffffff, amount: (u) => Math.max(0, 1 - Math.abs(u - 0.4) / 0.4) });
  dynLabel(() => 'REMOVE', 0, 2.9, 0, { w: 2.8, size: 170, color: '#ff5a4a' }); }, cam: CAM(6.8, 6.6) });
// L06: wind dries your eyes up to twice as fast: they burn, they itch (redness rising)
shot('L06', { scene: STUDIO, build() { studio(0x1a2a3a); const E = bigEye({ pos: [0, 0.3, 0], lashes: () => false, red: (u, d) => 0.6 * sm(0.5, d, u), open: blinkAt([2.2, 3.1, 3.6]) }); wind(E, () => 0);
  dynLabel(() => '2× DRIER', 0, 2.9, 0, { w: 3.0, size: 170, color: '#ff8a5a' }); }, cam: CAM() });
// L07: dust, pollen and sand land straight on your eyeball
shot('L07', { scene: STUDIO, build() { studio(0x2a2a1a); const E = bigEye({ pos: [0, 0.3, 0], lashes: () => false, red: () => 0.6 }); particles(E, { n: 220, shield: () => 0, color: 0xc8a050, size: 0.08 }); particles(E, { n: 90, shield: () => 0, color: 0xf8e060, size: 0.06, seed: 9 });
  dynLabel((u) => u < 0.7 ? 'DUST' : u < 1.4 ? 'POLLEN' : 'SAND', 0, 2.9, 0, { w: 2.8, size: 170, color: '#ffd23a' }); }, cam: CAM(6.8, 6.2) });
// L08: red, swollen, infected
shot('L08', { scene: STUDIO, build() { studio(0x2a1a1a); bigEye({ pos: [0, 0.3, 0], lashes: () => false, red: (u, d) => lerp(0.7, 1, sm(0, d, u)), swell: (u, d) => sm(0, d, u), open: () => 0.75 });
  dynLabel(() => 'INFECTED', 0, 2.9, 0, { w: 3.0, size: 170, color: '#ff4a4a' }); }, cam: CAM(6.4, 5.8) });
// L09: in the desert, one sandstorm could scratch your eyes
shot('L09', { scene: { sky: ['#c87a3a', '#f0c890'], bloom: 0.3, bloomThreshold: 1.5, exposure: 0.85, env: 0.3, dof: DOF, fog0: 6, fog1: 60 }, build() {
  const S = getScene(); S.fog.color.set(0xd8a060); S.userData.sun.color.set(0xffb070);
  const sand = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), M_(0xe0b070, { r: 0.95 })); sand.rotation.x = -Math.PI / 2; sand.receiveShadow = true; add(sand);
  const r = rnd(4); for (let i = 0; i < 20; i++) { const d = new THREE.Mesh(new THREE.SphereGeometry(6 + r() * 8, 16, 10), M_(0xd8a868, { r: 0.95 })); d.scale.y = 0.25; d.position.set((r() - 0.5) * 120, 0, -20 - r() * 80); add(d); }
  const A = person({ ...ME, acc: [] }, 0, -6, 0.2, 'shock', { face: 'pain' }); onPost(() => { A.armL.rotation.set(-2.6, 0, 0.3); A.armR.rotation.set(-2.6, 0, -0.3); });
  dust(2200, 0, 2, -6, 30, 5, 20, { color: 0xe8c080, size: 0.07, rise: 0.0, opacity: 0.9, seed: 3 });
  const n = 900, pos = new Float32Array(n * 3), b = []; for (let i = 0; i < n; i++) b.push([r() * 40 - 20, r() * 5, -r() * 20, 6 + r() * 6]);
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); const p = new THREE.Points(g, new THREE.PointsMaterial({ size: 0.06, color: 0xd8b070 })); p.frustumCulled = false; add(p);
  on((u) => { b.forEach(([x, y, z, v], i) => pos.set([((x + u * v + 20) % 40) - 20, y, z - 2], i * 3)); g.attributes.position.needsUpdate = true; });
  dynLabel(() => 'SANDSTORM', 0, 2.4, -5.4, { w: 1.3, size: 170, color: '#ff8a3a' }); shadowAt(0, -6, 8);
}, cam: CUY(0, -6, 0.2, { d: 4.0, side: 0.3, hy: 1.8 }) });
// L10: those tiny hairs are the only thing between your eyes and the world (lashes back, calm)
shot('L10', { scene: STUDIO, build() { studio(0x1a2a4a); const E = bigEye({ pos: [0, 0.3, 0], lashes: (u) => u > 0.5, open: blinkAt([2.2]) }); sparkles(0, 1.7, 1.2, { n: 120, R: 1.2, h: 0.8, color: 0xffd23a, amount: (u) => Math.max(0, 1 - Math.abs(u - 0.5) / 0.4) }); wind(E, () => 1);
  dynLabel(() => 'TINY HAIRS', 0, 2.9, 0, { w: 3.0, size: 170, color: '#ffd23a' }); }, cam: CAM(6.6, 7.6), fx: (u, d) => ({ fade: sm(d - 0.7, d, u) }) });
