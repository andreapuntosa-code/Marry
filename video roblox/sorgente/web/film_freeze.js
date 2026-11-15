// "What if water froze at 10 degrees?" -- Roblox v2 What-if. Shots for script_freeze.py
import { THREE, shot, person, street, ground, house, tree, glowTex, stars, add, on, onPost, camLerp, sm, lerp, getScene, shadowAt, rbox } from './kit.js';
import { blk, dust, sparkles } from './sets.js';
import { ME, PP, P, dolly, CUY, M_, DOF, DAY, SPACE, rnd, dynLabel, billboard, classroom, texOf, space, CONT } from './whatif.js';

const IN = { interior: true, bloom: 0.3, bloomThreshold: 1.1, exposure: 0.95, env: 0.45, dof: DOF };
const COLD = { ...DAY, sky: ['#8ab0d8', '#e0ecf4'] };
const iceM = () => new THREE.MeshPhysicalMaterial({ color: 0xe8f6ff, roughness: 0.25, clearcoat: 1, transparent: true, opacity: 0.95 });
// a bottle that is water until t0, then ice
function bottle(x, y, z, t0, s = 1) { const g = new THREE.Group(); g.position.set(x, y, z); g.scale.setScalar(s); add(g);
  const w = new THREE.MeshPhysicalMaterial({ color: 0x5ab0ff, roughness: 0.05, transparent: true, opacity: 0.7, clearcoat: 1 }); const b = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.8, 24), w); g.add(b);
  const n = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.16, 0.2, 16), w); n.position.y = 0.5; g.add(n); const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.08, 16), M_(0x2a6ad8)); cap.position.y = 0.64; g.add(cap);
  const ice = new THREE.Color(0xf0f8ff), wc = new THREE.Color(0x5ab0ff); on((u) => { const k = sm(t0, t0 + 0.4, u); w.color.copy(wc).lerp(ice, k); w.opacity = lerp(0.7, 0.95, k); w.roughness = lerp(0.05, 0.5, k); }); return g; }
// a globe painted: ocean frozen except a band |lat| < band(u)
function frozenGlobe(R, band) { const g = new THREE.Group(); add(g); const c = document.createElement('canvas'); c.width = 1024; c.height = 512; const q = c.getContext('2d'); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  const m = new THREE.Mesh(new THREE.SphereGeometry(R, 96, 64), new THREE.MeshStandardMaterial({ map: t, roughness: 0.6 })); g.add(m); const X = (lo) => (lo + 180) / 360 * 1024, Y = (la) => (90 - la) / 180 * 512; let last = -1;
  on((u) => { const b = band(u); if (Math.abs(b - last) < 0.3) return; last = b; q.fillStyle = '#eef6fb'; q.fillRect(0, 0, 1024, 512); q.fillStyle = '#1e6ab0'; q.fillRect(0, Y(b), 1024, Y(-b) - Y(b));
    CONT.forEach((poly) => { q.fillStyle = 'rgba(220,230,236,1)'; q.beginPath(); poly.forEach(([lo, la], k) => k ? q.lineTo(X(lo), Y(la)) : q.moveTo(X(lo), Y(la))); q.closePath(); q.fill(); });
    q.save(); q.beginPath(); q.rect(0, Y(b), 1024, Y(-b) - Y(b)); q.clip(); CONT.forEach((poly) => { q.fillStyle = '#4a9a3a'; q.beginPath(); poly.forEach(([lo, la], k) => k ? q.lineTo(X(lo), Y(la)) : q.moveTo(X(lo), Y(la))); q.closePath(); q.fill(); }); q.restore(); t.needsUpdate = true; });
  on((u) => { m.rotation.y = u * 0.25; }); const atm = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex(), color: 0xbfe0ff, transparent: true, opacity: 0.4, blending: THREE.AdditiveBlending, depthWrite: false })); atm.scale.setScalar(R * 3); g.add(atm); return g; }

// W01: the billboard: water freezes at 0 -> 10
shot('W01', { scene: DAY, build() {
  street(); billboard((u) => u < 1.2 ? 'WATER FREEZES\nAT 0°C' : 'WATER FREEZES\nAT 10°C', 0, -7.8, { size: 112 });
  [[PP[0], -2.5, -5.2, 0.3], [PP[2], 2.4, -5.4, -0.3], [ME, 0, -5.0, 0]].forEach(([d, x, z, yw]) => { const A = person(d, x, z, yw, 'idle'); A.pitch = -0.25; on((u) => { A.pose = u > 1.2 ? 'shock' : 'idle'; A.setFace(u > 1.2 ? 'shock' : 'smile'); }); });
  shadowAt(0, -6, 10);
}, cam: dolly(P([0.2, 2.2, 3.4], [0, 3.7, -7.8], 58), P([0.1, 2.1, 2.6], [0, 3.8, -7.8], 58)) });
// W02: supercooled water stays liquid down to -40 (a bottle on the desk, then a tap: instant ice)
shot('W02', { scene: IN, build() { classroom((u) => u < 3.6 ? 'SUPERCOOLED\n−40°C = LIQUID' : 'TAP... ICE!', { size: 88 }); blk(3, 0.15, 1.4, M_(0x8a5a34), 0, 1.4, -2.2); for (const s of [-1, 1]) blk(0.12, 1.4, 1.2, M_(0x5a3a24), s * 1.3, 0.7, -2.2);
  bottle(0, 1.95, -2.1, 4.2, 1.2); sparkles(0, 1.8, -2.1, { n: 60, R: 0.4, h: 1.2, color: 0xffffff, amount: (u) => Math.max(0, 1 - Math.abs(u - 4.3) / 0.4) });
  const A = person(ME, 1.6, -1.8, -0.5, 'idle', { face: 'confused' }); on((u) => { A.pose = u > 4 ? 'point' : 'think'; }); }, cam: dolly(P([0.2, 2.8, 3.4], [0, 2.4, -3], 54), P([0.1, 2.8, 2.8], [0, 2.4, -3], 54)) });
// W03: anything below 10 degrees turns to ice (a thermometer sign at 9 C, puddles freezing)
shot('W03', { scene: COLD, build() { street(); blk(0.15, 3, 0.15, M_(0x3a3a40), 1.5, 1.5, -7.2); blk(1.6, 0.9, 0.12, M_(0x1a1a1a), 1.5, 3.2, -7.2); dynLabel((u) => u < 1.0 ? '11°C' : '9°C', 1.5, 3.2, -7.12, { w: 1.5, size: 200, color: '#ff7a3a', stroke: false });
  const r = rnd(4); for (let i = 0; i < 7; i++) { const p = new THREE.Mesh(new THREE.CircleGeometry(0.5 + r() * 0.6, 32), new THREE.MeshPhysicalMaterial({ color: 0x4a8ad8, roughness: 0.05, clearcoat: 1 })); p.rotation.x = -Math.PI / 2; p.position.set((r() - 0.5) * 7, 0.04, -3 - r() * 5); add(p); const w = new THREE.Color(0x4a8ad8), ice = new THREE.Color(0xeaf6ff); on((u) => { p.material.color.copy(w).lerp(ice, sm(1.0 + i * 0.15, 1.6 + i * 0.15, u)); }); }
  const A = person(ME, -0.6, -5.2, 0.2, 'idle', { face: 'confused' }); on((u) => A.setFace(u > 1.4 ? 'shock' : 'confused'));
  dynLabel(() => 'BELOW 10°C = ICE', 0, 4.6, -8, { w: 4.4, size: 100, color: '#bfe8ff', stroke: '#1a3a6a' }); shadowAt(0, -6, 10); }, cam: dolly(P([0.6, 2.4, 2.6], [0, 1.8, -6], 54), P([0.5, 2.3, 1.8], [0, 1.8, -6], 54)) });
// W04: your fridge is at 4 degrees: every drink inside is a block of ice
shot('W04', { scene: IN, build() { const S = getScene(); S.background = new THREE.Color(0xe8dcc4); S.fog = null;
  const fl = new THREE.Mesh(new THREE.PlaneGeometry(12, 10), M_(0xc8c0b0)); fl.rotation.x = -Math.PI / 2; add(fl); blk(12, 6, 0.3, M_(0xe8e0d0), 0, 3, -3.4);
  const fw = M_(0xf4f4f8, { r: 0.3 }); blk(2.4, 4.2, 0.1, fw, 0, 2.1, -3.15); for (const sx of [-1, 1]) blk(0.12, 4.2, 1.6, fw, sx * 1.14, 2.1, -2.4); blk(2.4, 0.12, 1.6, fw, 0, 4.15, -2.4); blk(2.4, 0.12, 1.6, fw, 0, 0.05, -2.4); const inner = new THREE.Mesh(new THREE.PlaneGeometry(2.1, 3.9), new THREE.MeshBasicMaterial({ color: 0xdff0ff })); inner.position.set(0, 2.1, -3.09); add(inner);
  
  for (const y of [1.2, 2.3, 3.4]) blk(2.1, 0.05, 1.4, M_(0xc8e8ff, { t: true, op: 0.6 }), 0, y, -2.4); [[-0.6, 1.25], [0, 1.25], [0.6, 1.25], [-0.4, 2.35], [0.4, 2.35]].forEach(([x, y], i) => bottle(x, y + 0.42, -2.3, 0.6 + i * 0.25, 0.75));
  const L = new THREE.PointLight(0xdff0ff, 6, 6, 1.6); L.position.set(0, 3.6, -1.4); add(L);
  const A = person(ME, 1.5, -0.4, -0.7, 'shock', { face: 'shock' }); dynLabel(() => '4°C', 0, 4.7, -1.6, { w: 1.8, size: 220, color: '#7ad0ff' }); }, cam: dolly(P([0.6, 2.7, 5.0], [0, 2.3, -1.8], 52), P([0.5, 2.7, 4.4], [0, 2.4, -1.8], 52)) });
// W05: London, 11 degrees on average: its rivers would freeze for half the year (people skating on the river)
shot('W05', { scene: COLD, build() { ground({ road: false, grass: 0x7a8a6a }); const river = new THREE.Mesh(new THREE.PlaneGeometry(200, 10), iceM()); river.rotation.x = -Math.PI / 2; river.position.set(0, 0.03, -8); add(river);
  for (const s of [-1, 1]) blk(200, 0.6, 1, M_(0x9a9088), 0, 0.3, -8 + s * 5.5); const tw = blk(2.4, 16, 2.4, M_(0xc8a868), 9, 8, -16); const roof = new THREE.Mesh(new THREE.ConeGeometry(1.9, 4, 4), M_(0x3a4a5a)); roof.rotation.y = 0.785; roof.position.set(9, 18, -16); add(roof);
  const face = new THREE.Mesh(new THREE.CircleGeometry(0.85, 32), M_(0xf6efdc)); face.position.set(9, 13, -14.78); add(face);
  for (let i = 0; i < 5; i++) house(-14 + i * 6, -18, 0, { w: 5, h: 7 + (i % 2) * 2, fence: false, color: [0xa86a4a, 0xc8b8a0, 0x8a6a5a][i % 3] });
  [[ME, 0], [PP[0], 1], [PP[2], 2], [PP[1], 3]].forEach(([d, i]) => { const A = person(d, -4 + i * 2.4, -8, Math.PI / 2, 'walk', { face: 'smile' }); A.anim = (Q, u) => { Q.root.position.x = -4 + i * 2.4 + u * 1.2; Q.root.position.z = -8 + Math.sin(u * 2 + i) * 1.2; Q.root.rotation.z = Math.sin(u * 3 + i) * 0.1; }; });
  dynLabel(() => 'LONDON · 11°C', 0, 6, -12, { w: 6, size: 130, color: '#ffffff', stroke: '#1a3a6a' }); shadowAt(0, -8, 14); }, cam: dolly(P([1, 7, 9], [1, 1.5, -10], 52), P([0.8, 6.6, 7.6], [1, 1.6, -10], 52)) });
// W06-W07: the ocean, deep down below 4 degrees: a cut-away block; then the deep part freezes
function oceanCut(k) { const S = getScene(); S.background = new THREE.Color(0x0e1a2a); S.fog = null; S.userData.hemi.intensity = 0.9; S.userData.sun.intensity = 1.6; S.userData.sun.position.set(5, 12, 10);
  const top = new THREE.Mesh(new THREE.BoxGeometry(6, 0.5, 3), new THREE.MeshPhysicalMaterial({ color: 0x3ad0e8, roughness: 0.1, clearcoat: 1, transparent: true, opacity: 0.9 })); top.position.set(0, 3.0, -3); add(top);
  const deep = new THREE.Mesh(new THREE.BoxGeometry(6, 4, 3), new THREE.MeshPhysicalMaterial({ color: 0x0e3a7a, roughness: 0.15, clearcoat: 1, transparent: true, opacity: 0.92 })); deep.position.set(0, 0.75, -3); add(deep);
  const floor = new THREE.Mesh(new THREE.BoxGeometry(6, 0.4, 3), M_(0x5a4a3a)); floor.position.set(0, -1.45, -3); add(floor);
  const blue = new THREE.Color(0x0e3a7a), ice = new THREE.Color(0xe8f6ff); on((u, d) => { const q = k(u, d); deep.material.color.copy(blue).lerp(ice, q); deep.material.roughness = lerp(0.15, 0.5, q); });
  for (let i = 0; i < 12; i++) { const f = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.2, 4), M_(0xffa040)); f.rotation.z = Math.PI / 2; add(f); on((u, d) => { const fr = 1 - k(u, d); f.position.set(-2.6 + ((u * 0.6 * fr + i * 0.37) % 1) * 5.2, -0.6 + (i % 4) * 0.7, -1.6); }); }
  const key = new THREE.DirectionalLight(0xffffff, 1.5); key.position.set(-4, 6, 8); add(key); }
shot('W06', { scene: { interior: true, bloom: 0.3, bloomThreshold: 1.1, exposure: 0.95, env: 0.4 }, build() { oceanCut(() => 0);
  dynLabel(() => '> 10°C', 0, 3.9, -1.4, { w: 4, size: 170, color: '#3ad0e8' }); dynLabel((u) => u < 1.4 ? '' : '< 4°C', 0, 0.8, -1.4, { w: 4, size: 170, color: '#7aa0ff' }); },
  cam: dolly(P([3.0, 3.6, 9.5], [0, 1.2, -3], 52), P([2.7, 3.4, 8.8], [0, 1.2, -3], 52)) });
shot('W07', { scene: { interior: true, bloom: 0.3, bloomThreshold: 1.1, exposure: 0.95, env: 0.4 }, build() { oceanCut((u, d) => sm(0.1, d - 0.2, u)); dynLabel(() => 'ICE', 0, 0.8, -1.4, { w: 2.2, size: 220, color: '#1a3a6a', stroke: '#ffffff' }); },
  cam: dolly(P([2.0, 3.0, 9.0], [0, 1.2, -3], 52), P([1.7, 2.9, 8.4], [0, 1.2, -3], 52)) });
// W08: only a thin warm layer near the equator stays liquid
shot('W08', { scene: SPACE, build() { space(); frozenGlobe(3, () => 15); dynLabel(() => 'ONLY HERE', 0, -4.2, 0, { w: 3.4, size: 150, color: '#3ad0e8', billboard: true }); }, cam: dolly(P([0, 0.8, 14], [0, -0.3, 0], 50), P([0, 0.6, 13], [0, -0.3, 0], 50)) });
// W09: white ice reflects sunlight: colder planet, more ice
shot('W09', { scene: SPACE, build() { space(); frozenGlobe(3, (u, d) => lerp(15, 6, sm(0, 3.5, u)));
  const arrows = []; for (let i = 0; i < 6; i++) { const g = new THREE.Group(); add(g); const sh = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 2.2, 8), new THREE.MeshBasicMaterial({ color: 0xffd23a })); g.add(sh); const hd = new THREE.Mesh(new THREE.ConeGeometry(0.15, 0.35, 10), sh.material); hd.position.y = 1.2; g.add(hd); arrows.push(g); }
  on((u) => arrows.forEach((g, i) => { const y = -2 + i * 0.8, ph = (u * 0.8 + i * 0.17) % 1; const inb = ph < 0.5; const k = inb ? ph * 2 : (ph - 0.5) * 2; g.position.set(inb ? lerp(-9, -3.2, k) : lerp(-3.2, -9, k), y + (inb ? 0 : k * 1.5), 0.5); g.rotation.z = inb ? -Math.PI / 2 : Math.PI / 2 - 0.3; }));
  dynLabel(() => 'REFLECTS\nSUNLIGHT', 0, 4.4, 0, { w: 4, size: 130, color: '#ffd23a', billboard: true }); }, cam: dolly(P([-2, 0.8, 14], [-1.5, -0.2, 0], 50), P([-2, 0.6, 13], [-1.5, -0.2, 0], 50)) });
// W10: ten degrees... and Earth becomes a snowball
shot('W10', { scene: SPACE, build() { space(); frozenGlobe(3, (u, d) => lerp(6, 0, sm(0, 1.6, u))); dynLabel((u) => u < 1.2 ? '' : 'SNOWBALL EARTH', 0, -4.3, 0, { w: 5.0, size: 110, color: '#ffffff', billboard: true }); },
  cam: dolly(P([0, 0.8, 12.5], [0, -0.4, 0], 50), P([0, 1.0, 15], [0, -0.6, 0], 50)), fx: (u, d) => ({ fade: sm(d - 0.7, d, u) }) });
