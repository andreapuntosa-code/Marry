// "What if we deleted leap years?" -- Roblox v2 What-if. Shots for script_leap.py
import { THREE, shot, person, street, ground, house, tree, glowTex, stars, add, on, onPost, camLerp, sm, lerp, getScene, shadowAt, rbox } from './kit.js';
import { blk, dust, sparkles } from './sets.js';
import { ME, PP, P, dolly, CUY, M_, DOF, DAY, SPACE, rnd, dynLabel, billboard, classroom, globe, space } from './whatif.js';

const IN = { interior: true, bloom: 0.3, bloomThreshold: 1.1, exposure: 0.95, env: 0.45, dof: DOF };
// a giant wall calendar page: month name, a grid of days, one day highlighted
function calendar(x, y, z, month, days, hi, o = {}) { const g = new THREE.Group(); g.position.set(x, y, z); add(g);
  const c = document.createElement('canvas'); c.width = 768; c.height = 900; const q = c.getContext('2d'); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  const draw = (gone) => { q.fillStyle = '#ffffff'; q.fillRect(0, 0, 768, 900); q.fillStyle = o.head ?? '#e8403a'; q.fillRect(0, 0, 768, 170); q.fillStyle = '#ffffff'; q.font = '110px Poppins'; q.textAlign = 'center'; q.textBaseline = 'middle'; q.fillText(month, 384, 92);
    q.font = '62px Poppins'; for (let d = 1; d <= days; d++) { const i = d - 1, cx = 64 + (i % 7) * 106, cy = 250 + Math.floor(i / 7) * 120; if (d === hi) { if (gone) continue; q.fillStyle = '#ffd23a'; q.beginPath(); q.arc(cx, cy, 52, 0, 6.28); q.fill(); } q.fillStyle = d === hi ? '#c8281a' : '#2a2a3a'; q.fillText(String(d), cx, cy); } t.needsUpdate = true; };
  draw(false); const page = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 3.75), new THREE.MeshStandardMaterial({ map: t, roughness: 0.6 })); g.add(page); const back = new THREE.Mesh(rbox(3.4, 3.95, 0.12, 0.05), M_(0x8a5a34)); back.position.z = -0.08; g.add(back);
  for (const sx of [-1, 1]) { const ring = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.03, 8, 16), M_(0xc8ccd2, { m: 0.9, r: 0.2 })); ring.position.set(sx * 0.9, 1.9, 0.05); g.add(ring); }
  if (o.gone) { let last = false; on((u) => { const gn = o.gone(u); if (gn !== last) { last = gn; draw(gn); } }); } return g; }
function santaHat(A) { const c = new THREE.Mesh(new THREE.ConeGeometry(0.7, 1.4, 20), M_(0xd82a2a)); c.position.set(0, 1.25, -0.1); c.rotation.x = -0.25; A.head.add(c); const b = new THREE.Mesh(new THREE.TorusGeometry(0.66, 0.14, 10, 24), M_(0xffffff, { r: 0.9 })); b.rotation.x = Math.PI / 2; b.position.y = 0.62; A.head.add(b); const p = new THREE.Mesh(new THREE.SphereGeometry(0.18, 12, 10), M_(0xffffff)); p.position.set(0, 1.9, -0.45); A.head.add(p); }
function xmasTree(x, z, s = 1) { const g = new THREE.Group(); g.position.set(x, 0, z); g.scale.setScalar(s); add(g); for (let i = 0; i < 3; i++) { const c = new THREE.Mesh(new THREE.ConeGeometry(1.6 - i * 0.4, 1.6, 16), M_(0x1e7a3a)); c.position.y = 1.2 + i * 1.0; c.castShadow = true; g.add(c); }
  const star = new THREE.Mesh(new THREE.OctahedronGeometry(0.3), M_(0xffd23a, { em: 0xffa000, ei: 0.8 })); star.position.y = 4.2; g.add(star); const cols = [0xff3b3b, 0x2f7dff, 0xffd21f]; for (let i = 0; i < 18; i++) { const b = new THREE.Mesh(new THREE.SphereGeometry(0.1, 10, 8), M_(cols[i % 3], { em: cols[i % 3], ei: 0.4 })); const a = i * 2.4, h = 0.8 + (i % 6) * 0.5; b.position.set(Math.cos(a) * (1.5 - h * 0.3), h + 0.3, Math.sin(a) * (1.5 - h * 0.3)); g.add(b); } return g; }

// Y01: the billboard: 365.25 days -> no leap years
shot('Y01', { scene: DAY, build() {
  street(); billboard((u) => u < 0.8 ? '1 YEAR = 365¼ DAYS' : 'NO LEAP YEARS', 0, -7.8, { size: 92 });
  [[PP[0], -2.5, -5.2, 0.3], [PP[2], 2.4, -5.4, -0.3], [ME, 0, -5.0, 0]].forEach(([d, x, z, yw]) => { const A = person(d, x, z, yw, 'idle'); A.pitch = -0.25; on((u) => { A.pose = u > 0.8 ? 'shock' : 'idle'; A.setFace(u > 0.8 ? 'shock' : 'smile'); }); });
  shadowAt(0, -6, 10);
}, cam: dolly(P([0.2, 2.2, 3.4], [0, 3.7, -7.8], 58), P([0.1, 2.1, 2.6], [0, 3.8, -7.8], 58)) });
// Y02: a year is 365 and almost a quarter days
shot('Y02', { scene: IN, build() { classroom((u) => u < 2.0 ? '1 YEAR =\n365 DAYS?' : '365.2422\nDAYS', { size: 115 }); const A = person(ME, 2.4, -2.6, -0.5, 'idle', { face: 'confused' }); on((u) => { A.pose = u > 2.0 ? 'shock' : 'think'; A.setFace(u > 2.0 ? 'shock' : 'confused'); }); },
  cam: dolly(P([0.3, 3.0, 4.0], [0.2, 2.9, -4.3], 56), P([0.2, 3.0, 3.4], [0.2, 2.9, -4.3], 56)) });
// Y03: every four years February gets an extra day (the 29th glowing)
shot('Y03', { scene: IN, build() { const S = getScene(); S.background = new THREE.Color(0xf4e8d0); S.fog = null; blk(14, 8, 0.3, M_(0xf0e0c0), 0, 3, -3.4); calendar(0, 2.8, -3.1, 'FEBRUARY', 29, 29); sparkles(1.6, 1.4, -2.8, { n: 60, R: 0.5, h: 1.2, color: 0xffd23a });
  dynLabel(() => 'EVERY 4 YEARS', 0, 5.1, -3.0, { w: 3.6, size: 100, color: '#e8403a', stroke: '#ffffff' }); }, cam: dolly(P([0, 3.0, 3.6], [0, 3.1, -3.1], 54), P([0, 3.0, 3.0], [0, 3.1, -3.1], 54)) });
// Y04: delete it: the calendar slips almost 6 hours every year
shot('Y04', { scene: IN, build() { const S = getScene(); S.background = new THREE.Color(0xf4e8d0); S.fog = null; blk(14, 8, 0.3, M_(0xf0e0c0), 0, 3, -3.4); calendar(0, 2.8, -3.1, 'FEBRUARY', 29, 29, { gone: (u) => u > 0.5 }); sparkles(1.6, 1.4, -2.8, { n: 90, R: 0.6, h: 1.0, color: 0xffffff, amount: (u) => Math.max(0, 1 - Math.abs(u - 0.5) / 0.4) });
  dynLabel((u) => u < 1.0 ? 'DELETED' : '+6 HOURS / YEAR', 0, 5.1, -3.0, { w: 3.6, size: 95, color: '#e8403a', stroke: '#ffffff' }); }, cam: dolly(P([0, 3.0, 3.6], [0, 3.1, -3.1], 54), P([0, 3.0, 3.0], [0, 3.1, -3.1], 54)) });
// Y05: in 100 years the seasons are 24 days off
shot('Y05', { scene: IN, build() { classroom((u) => '100 YEARS\n= ' + Math.round(24 * sm(0.3, 1.8, u)) + ' DAYS OFF', { size: 105, color: '#ffd23a' }); }, cam: dolly(P([0, 3.0, 3.6], [0, 3.0, -4.3], 56), P([0, 3.0, 3.0], [0, 3.0, -4.3], 56)) });
// Y06: in 400 years spring starts at the end of June (blossom tree, hot sun, calendar 'JUNE 28')
shot('Y06', { scene: { ...DAY, sky: ['#4a9ae8', '#fff0c8'] }, build() { street(); getScene().userData.sun.intensity = 2.4;
  const g = tree(5.2, -9.5, 1.0, 4); g.traverse((n) => { if (n.material && n.geometry && n.geometry.type === 'IcosahedronGeometry') n.material = M_(0xffa8d0, { r: 0.8 }); });
  calendar(-1.3, 2.6, -8.2, 'JUNE', 30, 28, { head: '#3fa84f' }); const A = person(ME, 1.0, -5.6, -0.2, 'shrug', { face: 'confused' });
  dynLabel(() => 'SPRING?!', 0, 5.0, -8, { w: 3.4, size: 170, color: '#ff7ac0' }); shadowAt(0, -6, 10); }, cam: dolly(P([0.2, 2.6, 2.8], [0, 2.8, -8], 54), P([0.1, 2.6, 2.0], [0, 2.9, -8], 54)) });
// Y07: in ~750 years, Christmas in the middle of summer (Santa hat at the beach)
shot('Y07', { scene: { ...DAY, sky: ['#2a8ae8', '#bfe8ff'] }, build() { const sand = new THREE.Mesh(new THREE.PlaneGeometry(300, 300), M_(0xf0d898, { r: 0.95 })); sand.rotation.x = -Math.PI / 2; sand.receiveShadow = true; add(sand);
  const sea = new THREE.Mesh(new THREE.PlaneGeometry(300, 100), M_(0x2aa8d8, { r: 0.1, m: 0.2 })); sea.rotation.x = -Math.PI / 2; sea.position.set(0, 0.02, -70); add(sea); getScene().userData.sun.intensity = 2.6;
  xmasTree(-2.2, -7, 0.9); const A = person({ ...ME, shirt: 0xd82a2a }, 0.8, -5.6, -0.2, 'idle', { face: 'sad' }); santaHat(A); on((u) => A.setFace(Math.floor(u * 2) % 2 ? 'sad' : 'pain'));
  sparkles(0.8, 2.0, -5.4, { n: 30, R: 0.4, h: 0.6, color: 0x7ad0ff, size: 0.06 });
  const um = new THREE.Mesh(new THREE.ConeGeometry(1.4, 0.7, 12), M_(0xff7ac0)); um.position.set(2.8, 2.6, -8); add(um); blk(0.08, 2.6, 0.08, M_(0xffffff), 2.8, 1.3, -8);
  dynLabel(() => 'DECEMBER 25', 0, 5.0, -8, { w: 4.4, size: 140, color: '#d82a2a', stroke: '#ffffff' }); shadowAt(0, -6, 10); }, cam: dolly(P([0.4, 2.4, 1.8], [0, 2.6, -8], 54), P([0.3, 2.4, 1.0], [0, 2.7, -8], 54)) });
// Y08: school years, harvests, holidays... all in the wrong season (kids with backpacks in the snow, 'SUMMER BREAK')
shot('Y08', { scene: { ...DAY, sky: ['#9ab0c8', '#e8eef4'] }, build() { street({ grass: 0xf4f8fc }); dust(900, 0, 6, -6, 30, 12, 20, { color: 0xffffff, size: 0.1, rise: -0.2, opacity: 0.9, seed: 7 });
  [[PP[0], -1.2], [{ ...ME, scale: 0.7 }, 0], [PP[2], 1.3]].forEach(([d, x], i) => { const A = person({ ...d, scale: 0.7 }, x, -5.2, 0, 'idle', { face: 'confused' }); const bp = new THREE.Mesh(rbox(1.4, 1.6, 0.6, 0.2), M_([0xff3b3b, 0x2f7dff, 0xffd21f][i])); bp.position.set(0, 3.0, -0.8); A.body.add(bp); });
  dynLabel(() => 'SUMMER BREAK', 0, 3.8, -7, { w: 3.6, size: 105, color: '#ff8a1f', stroke: '#ffffff' }); shadowAt(0, -6, 10); }, cam: dolly(P([0.3, 2.0, 1.4], [0, 2.0, -7], 54), P([0.2, 2.0, 0.6], [0, 2.1, -7], 54)) });
// Y09: people born on February 29th would never have a birthday again
shot('Y09', { scene: IN, build() { const S = getScene(); S.background = new THREE.Color(0xf4d8e0); S.fog = null; blk(14, 8, 0.3, M_(0xf8e0e8), 0, 3, -3.4); const fl = new THREE.Mesh(new THREE.PlaneGeometry(14, 10), M_(0xc8a880)); fl.rotation.x = -Math.PI / 2; add(fl);
  blk(2.4, 1.2, 1.4, M_(0xffffff), 0.6, 0.6, -1.6); const cake = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.5, 32), M_(0xff9ad0)); cake.position.set(0.6, 1.45, -1.6); add(cake); const icing = new THREE.Mesh(new THREE.CylinderGeometry(0.57, 0.57, 0.08, 32), M_(0xffffff)); icing.position.set(0.6, 1.72, -1.6); add(icing);
  for (let i = 0; i < 5; i++) { const c = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.25, 8), M_([0xff3b3b, 0x2f7dff, 0xffd21f, 0x3fcf4f, 0x9b4dff][i])); const a = i / 5 * 6.28; c.position.set(0.6 + Math.cos(a) * 0.3, 1.88, -1.6 + Math.sin(a) * 0.3); add(c); }
  calendar(-1.1, 3.0, -3.1, 'FEBRUARY', 29, 29, { gone: (u) => u > 1.2 }); const A = person(ME, -0.4, -0.6, 0.3, 'idle', { face: 'sad' }); on((u) => A.setFace(u < 1.2 ? 'smile' : 'cry'));
  dynLabel(() => 'NO BIRTHDAY', 1.3, 4.6, -3.0, { w: 2.6, size: 100, color: '#c8281a', stroke: '#ffffff' }); }, cam: dolly(P([0.4, 2.9, 5.4], [0, 2.6, -2.2], 54), P([0.3, 2.9, 4.8], [0, 2.6, -2.2], 54)) });
// Y10: a quarter of a day holding all our seasons in place (Earth on its orbit)
shot('Y10', { scene: SPACE, build() { space(); const sun = new THREE.Mesh(new THREE.SphereGeometry(2, 40, 30), new THREE.MeshBasicMaterial({ color: new THREE.Color(3, 2.6, 1.8) })); add(sun); const L = new THREE.PointLight(0xfff0d0, 600, 80, 1.5); add(L);
  const orbit = new THREE.Mesh(new THREE.TorusGeometry(9, 0.03, 6, 200), new THREE.MeshBasicMaterial({ color: 0x5a6aa8 })); orbit.rotation.x = Math.PI / 2; add(orbit);
  const arc = new THREE.Mesh(new THREE.TorusGeometry(9, 0.12, 8, 60, 0.4), new THREE.MeshBasicMaterial({ color: 0xffd23a })); arc.rotation.x = Math.PI / 2; add(arc);
  const E = globe('now', 0.8); on((u) => { const a = 0.4 + sm(0.2, 2.6, u) * 0.0; E.position.set(Math.cos(a) * 9, 0, Math.sin(a) * 9); E.userData.mesh.rotation.y = u * 2; });
  dynLabel(() => '+¼ DAY', 6.5, 2.4, 3.5, { w: 3.0, size: 170, color: '#ffd23a', billboard: true }); }, cam: dolly(P([5, 7, 19], [5, 0, 2], 50), P([6, 6, 17], [6, 0, 2.5], 50)), fx: (u, d) => ({ fade: sm(d - 0.7, d, u) }) });
