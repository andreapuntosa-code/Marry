// "Let's learn colors!" -- a kids' Short (3-6): a bright toy world, a host who changes colour, one object per colour.
import { THREE, shot, person, glowTex, add, on, onPost, camLerp, sm, lerp, getScene, shadowAt, rbox } from './kit.js';
import { blk, sparkles } from './sets.js';
import { P, dolly, M_, rnd, dynLabel } from './whatif.js';

const COLS = { red: 0xff3b3b, blue: 0x2f7dff, yellow: 0xffd21f, green: 0x3fcf4f, orange: 0xff8a1f, purple: 0x9b4dff, pink: 0xff7ac0 };
const HOST = (c) => ({ skin: 0xf2c79a, shirt: c, pants: 0x3b3b8a, hair: { style: 'long', color: 0x6b3a1e }, face: 'smile' });
const KIDS = { interior: true, bloom: 0.25, bloomThreshold: 1.3, exposure: 0.82, env: 0.35 };
const shiny = (c, o = {}) => new THREE.MeshPhysicalMaterial({ color: c, roughness: o.r ?? 0.25, clearcoat: 1, clearcoatRoughness: 0.1, emissive: o.em ?? 0, emissiveIntensity: o.ei ?? 1 });
const popIn = (u, t0 = 0.05) => { const q = Math.max(0, u - t0) / 0.45; if (q >= 1) return 1; const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * (q - 1) ** 3 + c1 * (q - 1) ** 2; };

// the toy world: a pastel sky tinted by the colour, a big round stage with rainbow tiles, toy blocks and hills, confetti
function toyWorld(col) {
  const S = getScene(); const c = new THREE.Color(col), light = c.clone().lerp(new THREE.Color(0xffffff), 0.35), mid = c.clone().lerp(new THREE.Color(0xffffff), 0.1);
  const cv = document.createElement('canvas'); cv.width = 4; cv.height = 256; const g = cv.getContext('2d'); const gr = g.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, '#' + mid.getHexString()); gr.addColorStop(1, '#' + light.getHexString()); g.fillStyle = gr; g.fillRect(0, 0, 4, 256);
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; S.background = t; S.fog = new THREE.Fog(light.getHex(), 60, 200);
  S.userData.hemi.color.set(0xffffff); S.userData.hemi.groundColor.set(light); S.userData.hemi.intensity = 0.75; S.userData.sun.intensity = 1.8; S.userData.sun.position.set(6, 14, 12); S.userData.sun.target.position.set(0, 0, -2);
  // stage: rainbow ring tiles
  const tc = document.createElement('canvas'); tc.width = tc.height = 512; const q = tc.getContext('2d'); const rb = ['#ff3b3b', '#ff8a1f', '#ffd21f', '#3fcf4f', '#2f7dff', '#9b4dff', '#ff7ac0'];
  for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) { q.fillStyle = (i + j) % 2 ? '#f4f0ff' : rb[(i + j * 3) % 7]; q.fillRect(i * 64, j * 64, 64, 64); }
  const tt = new THREE.CanvasTexture(tc); tt.colorSpace = THREE.SRGBColorSpace; tt.wrapS = tt.wrapT = THREE.RepeatWrapping; tt.repeat.set(3, 3);
  const stage = new THREE.Mesh(new THREE.CylinderGeometry(7, 7.3, 0.6, 64), [new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4 }), new THREE.MeshStandardMaterial({ map: tt, roughness: 0.35 }), new THREE.MeshStandardMaterial({ color: 0xffffff })]); stage.position.set(0, -0.3, -3); stage.receiveShadow = true; add(stage);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(300, 300), M_(light.getHex(), { r: 0.9 })); ground.rotation.x = -Math.PI / 2; ground.position.y = -0.6; add(ground);
  const r = rnd(7), toyC = [0xff3b3b, 0x2f7dff, 0xffd21f, 0x3fcf4f, 0xff8a1f, 0x9b4dff, 0xff7ac0];
  for (let i = 0; i < 9; i++) { const h = new THREE.Mesh(new THREE.SphereGeometry(6 + r() * 6, 24, 16), M_(mid.clone().lerp(new THREE.Color(0x8ae08a), 0.4).getHex(), { r: 0.8 })); h.scale.y = 0.5; h.position.set(-40 + i * 10, -1, -26 - r() * 10); add(h); }
  for (let i = 0; i < 12; i++) { const s = 0.6 + r() * 0.6, side = i % 2 ? 1 : -1; const b = new THREE.Mesh(rbox(s, s, s, 0.2), shiny(toyC[i % 7])); b.position.set(side * (4.5 + r() * 2.5), s / 2 + (i % 3 === 0 ? s : 0), -3 - r() * 6); b.rotation.y = r() * 3; b.castShadow = true; add(b); }
  for (const [x, z, k] of [[-5.5, -6, 0], [5.8, -7, 3]]) { const bl = new THREE.Mesh(new THREE.SphereGeometry(0.6, 24, 18), shiny(toyC[k])); bl.scale.y = 1.15; bl.position.set(x, 3.6, z); add(bl); const st = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 3.2, 4), M_(0xffffff)); st.position.set(x, 1.6, z); add(st); on((u) => { bl.position.y = 3.6 + Math.sin(u * 2 + x) * 0.15; }); }
  // confetti in the colour
  const n = 140, conf = []; const cm = new THREE.MeshBasicMaterial({ color: col, side: THREE.DoubleSide }), wm = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide });
  for (let i = 0; i < n; i++) { const m = new THREE.Mesh(new THREE.PlaneGeometry(0.1, 0.16), i % 4 ? cm : wm); add(m); conf.push([m, r() * 8 - 4, r(), r() * 4 - 5, r() * 6]); }
  on((u) => conf.forEach(([m, x, ph, z, sp]) => { const q2 = (ph + u * 0.3) % 1; m.position.set(x + Math.sin(u * 2 + sp) * 0.3, 6 - q2 * 7, z); m.rotation.set(u * 3 + sp, u * 2, sp); m.visible = u > 0.05; }));
  return S;
}
// the host: a smiling girl in the colour, presenting the object
function host(col, pose = 'present') { const A = person(HOST(col), -1.15, -1.6, 0.45, pose, { face: 'smile' }); on((u) => { A.body.position.y = Math.abs(Math.sin(u * 4)) * 0.08; }); return A; }
function word(text, col) { const m = dynLabel(() => text, 0, 3.55, -2.6, { w: 3.6, size: 210, color: '#' + new THREE.Color(col).getHexString(), stroke: '#ffffff' }); on((u) => { const k = popIn(u, 0.0); m.scale.setScalar(Math.max(0.01, k)); m.rotation.z = Math.sin(u * 3) * 0.05; }); return m; }
// an object group that pops in and bobs at the centre
function hero(build, o = {}) { const g = new THREE.Group(); g.position.set(o.x ?? 0.7, o.y ?? 1.4, o.z ?? -2.5); add(g); build(g); const sp = sparkles(o.x ?? 0.7, 0.2, o.z ?? -2.5, { n: 70, R: 1.2, h: 2.6, color: 0xffffff, amount: (u) => Math.max(0, 1 - u / 1.2) });
  on((u) => { const k = popIn(u, 0.1); g.scale.setScalar(Math.max(0.01, k) * (o.s ?? 1)); g.rotation.y = (o.spin ?? 0.5) * u; g.position.y = (o.y ?? 1.4) + Math.sin(u * 3) * 0.1; }); return g; }
const face = (g, y, z, s = 1, dark = 0x1a1a1a) => { const e = new THREE.MeshBasicMaterial({ color: dark }); for (const x of [-0.18, 0.18]) { const m = new THREE.Mesh(new THREE.SphereGeometry(0.07 * s, 12, 10), e); m.position.set(x * s, y, z); g.add(m); }
  const mo = new THREE.Mesh(new THREE.TorusGeometry(0.14 * s, 0.03 * s, 8, 20, Math.PI), e); mo.rotation.z = Math.PI; mo.position.set(0, y - 0.15 * s, z); g.add(mo); };
const CAM = dolly(P([0, 2.0, 5.4], [0, 1.75, -2.5], 52), P([0, 1.95, 4.8], [0, 1.75, -2.5], 52));

// C01: hi friends, let's learn colors (the rainbow stage, the host waving, all colours of balls bouncing)
shot('C01', { scene: KIDS, build() { toyWorld(0xffd21f); const A = host(0xff7ac0, 'wave'); const cols = Object.values(COLS);
  cols.forEach((c, i) => { const b = new THREE.Mesh(new THREE.SphereGeometry(0.32, 24, 18), shiny(c)); b.castShadow = true; add(b); on((u) => { const ph = (u * 1.6 + i * 0.14) % 1; b.position.set(-0.6 + i * 0.5, 0.32 + Math.abs(Math.sin(ph * Math.PI)) * 1.6, -1.8 - (i % 2) * 0.5); }); });
  dynLabel(() => "LET'S LEARN\nCOLORS!", 0, 3.55, -2.6, { w: 3.8, size: 150, color: '#ff3b8a', stroke: '#ffffff' }); }, cam: CAM });
// C02 red apple
shot('C02', { scene: KIDS, build() { toyWorld(COLS.red); host(COLS.red); word('RED', COLS.red);
  hero((g) => { const a = new THREE.Mesh(new THREE.SphereGeometry(0.9, 40, 30), shiny(COLS.red)); a.scale.set(1, 0.92, 1); g.add(a); const st = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 0.4, 8), M_(0x6a3a1a)); st.position.y = 0.95; g.add(st); const lf = new THREE.Mesh(new THREE.SphereGeometry(0.22, 16, 10), shiny(0x3fcf4f)); lf.scale.set(1.4, 0.3, 0.7); lf.position.set(0.22, 1.05, 0); lf.rotation.z = 0.5; g.add(lf); face(g, 0.15, 0.86); }); }, cam: CAM });
// C03 blue sea (a blue bubble of sea with a jumping fish)
shot('C03', { scene: KIDS, build() { toyWorld(COLS.blue); host(COLS.blue); word('BLUE', COLS.blue);
  hero((g) => { const sea = new THREE.Mesh(new THREE.SphereGeometry(1.0, 40, 30, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), new THREE.MeshPhysicalMaterial({ color: COLS.blue, roughness: 0.1, clearcoat: 1, transparent: true, opacity: 0.9 })); g.add(sea);
    const top = new THREE.Mesh(new THREE.CircleGeometry(1.0, 40), new THREE.MeshPhysicalMaterial({ color: 0x5aa0ff, roughness: 0.05, clearcoat: 1 })); top.rotation.x = -Math.PI / 2; g.add(top);
    const fish = new THREE.Group(); g.add(fish); const fb = new THREE.Mesh(new THREE.SphereGeometry(0.28, 20, 14), shiny(0x1a5ad0)); fb.scale.set(1.4, 1, 0.7); fish.add(fb); const tail = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.3, 4), shiny(0x1a5ad0)); tail.rotation.z = Math.PI / 2; tail.position.x = -0.45; fish.add(tail); face(fish, 0.05, 0.2, 0.6);
    on((u) => { const q = (u * 0.9) % 1; fish.position.set(-0.5 + q, 0.2 + Math.sin(q * Math.PI) * 1.2, 0.2); fish.rotation.z = Math.cos(q * Math.PI) * 0.8; }); }, { spin: 0.2 }); }, cam: CAM });
// C04 yellow sun (with rays and a face)
shot('C04', { scene: KIDS, build() { toyWorld(COLS.yellow); host(COLS.yellow); word('YELLOW', COLS.yellow);
  hero((g) => { const s = new THREE.Mesh(new THREE.SphereGeometry(0.85, 40, 30), shiny(COLS.yellow, { em: 0x8a6a00, ei: 0.4 })); g.add(s); const rays = new THREE.Group(); g.add(rays);
    for (let i = 0; i < 12; i++) { const r = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.5, 10), shiny(0xffa81f)); const a = i / 12 * 6.283; r.position.set(Math.cos(a) * 1.15, Math.sin(a) * 1.15, 0); r.rotation.z = a - Math.PI / 2; rays.add(r); }
    face(g, 0.1, 0.84); on((u) => { rays.rotation.z = u * 0.6; }); }, { spin: 0 }); }, cam: CAM });
// C05 green frog (hops)
shot('C05', { scene: KIDS, build() { toyWorld(COLS.green); host(COLS.green); word('GREEN', COLS.green);
  const F = hero((g) => { const b = new THREE.Mesh(rbox(1.4, 0.8, 1.1, 0.3), shiny(COLS.green)); g.add(b); const belly = new THREE.Mesh(rbox(1.0, 0.5, 0.1, 0.3), shiny(0xc8f0a0)); belly.position.set(0, -0.1, 0.55); g.add(belly);
    for (const x of [-0.4, 0.4]) { const e = new THREE.Mesh(new THREE.SphereGeometry(0.26, 20, 14), shiny(COLS.green)); e.position.set(x, 0.5, 0.15); g.add(e); const w = new THREE.Mesh(new THREE.SphereGeometry(0.17, 16, 12), shiny(0xffffff)); w.position.set(x, 0.55, 0.32); g.add(w); const p = new THREE.Mesh(new THREE.SphereGeometry(0.08, 12, 10), M_(0x111111)); p.position.set(x, 0.56, 0.47); g.add(p); }
    const mo = new THREE.Mesh(new THREE.TorusGeometry(0.35, 0.04, 8, 24, Math.PI), M_(0x1a5a1a)); mo.rotation.z = Math.PI; mo.position.set(0, 0.08, 0.56); g.add(mo);
    for (const x of [-0.6, 0.6]) { const l = new THREE.Mesh(rbox(0.4, 0.3, 0.6, 0.3), shiny(0x2aa83a)); l.position.set(x, -0.4, 0.2); g.add(l); } }, { spin: 0, y: 1.0 });
  on((u) => { const q = (u * 1.2) % 1; F.position.y = 1.0 + Math.abs(Math.sin(q * Math.PI)) * 0.9; }); }, cam: CAM });
// C06 orange orange
shot('C06', { scene: KIDS, build() { toyWorld(COLS.orange); host(COLS.orange); word('ORANGE', COLS.orange);
  hero((g) => { const c = document.createElement('canvas'); c.width = c.height = 256; const q = c.getContext('2d'); q.fillStyle = '#ff8a1f'; q.fillRect(0, 0, 256, 256); const r = rnd(2); for (let i = 0; i < 700; i++) { q.fillStyle = 'rgba(200,90,0,0.35)'; q.beginPath(); q.arc(r() * 256, r() * 256, 2, 0, 6.28); q.fill(); }
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; const o = new THREE.Mesh(new THREE.SphereGeometry(0.9, 40, 30), new THREE.MeshPhysicalMaterial({ map: t, roughness: 0.35, clearcoat: 0.6 })); g.add(o);
    const lf = new THREE.Mesh(new THREE.SphereGeometry(0.25, 16, 10), shiny(0x3fcf4f)); lf.scale.set(1.4, 0.3, 0.7); lf.position.set(0.15, 0.92, 0); lf.rotation.z = 0.4; g.add(lf); face(g, 0.1, 0.88); }); }, cam: CAM });
// C07 purple grapes
shot('C07', { scene: KIDS, build() { toyWorld(COLS.purple); host(COLS.purple); word('PURPLE', COLS.purple);
  hero((g) => { const m = shiny(COLS.purple); let k = 0; for (let row = 0; row < 5; row++) for (let i = 0; i <= 4 - row; i++) { const s = new THREE.Mesh(new THREE.SphereGeometry(0.25, 20, 16), m); s.position.set((i - (4 - row) / 2) * 0.42, 0.7 - row * 0.36, (k++ % 2) * 0.12); g.add(s); }
    const st = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 0.4, 8), M_(0x6a3a1a)); st.position.y = 1.05; g.add(st); const lf = new THREE.Mesh(new THREE.SphereGeometry(0.28, 16, 10), shiny(0x3fcf4f)); lf.scale.set(1.4, 0.3, 0.8); lf.position.set(0.3, 1.05, 0); g.add(lf); }); }, cam: CAM });
// C08 pink pig
shot('C08', { scene: KIDS, build() { toyWorld(COLS.pink); host(COLS.pink); word('PINK', COLS.pink);
  hero((g) => { const b = new THREE.Mesh(rbox(1.5, 1.1, 1.0, 0.35), shiny(COLS.pink)); g.add(b); const sn = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.18, 24), shiny(0xff9ad0)); sn.rotation.x = Math.PI / 2; sn.position.set(0, -0.05, 0.56); g.add(sn);
    for (const x of [-0.1, 0.1]) { const n = new THREE.Mesh(new THREE.SphereGeometry(0.05, 10, 8), M_(0xa83a6a)); n.position.set(x, -0.05, 0.66); g.add(n); }
    for (const x of [-0.45, 0.45]) { const e = new THREE.Mesh(new THREE.SphereGeometry(0.08, 12, 10), M_(0x111111)); e.position.set(x * 0.7, 0.25, 0.51); g.add(e); const ear = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.35, 4), shiny(COLS.pink)); ear.position.set(x, 0.65, 0); ear.rotation.z = -x * 0.6; g.add(ear); }
    for (const [x, z] of [[-0.5, 0.3], [0.5, 0.3], [-0.5, -0.3], [0.5, -0.3]]) { const l = new THREE.Mesh(rbox(0.25, 0.4, 0.25, 0.3), shiny(0xff9ad0)); l.position.set(x, -0.7, z); g.add(l); } }, { spin: 0.3 }); }, cam: CAM });
// C09 now all together... a rainbow!
shot('C09', { scene: KIDS, build() { toyWorld(0x9bd8ff); host(0xff3b3b, 'cheer'); const cols = [0xff3b3b, 0xff8a1f, 0xffd21f, 0x3fcf4f, 0x2f7dff, 0x9b4dff, 0xff7ac0];
  const R = new THREE.Group(); R.position.set(0.6, 0.2, -3.2); add(R); cols.forEach((c, i) => { const t = new THREE.Mesh(new THREE.TorusGeometry(2.4 - i * 0.24, 0.12, 12, 64, Math.PI), shiny(c, { em: c, ei: 0.25 })); R.add(t); });
  for (const x of [-2.4, 2.4]) { const cl = new THREE.Group(); cl.position.set(x + 0.6, 0.3, -3.0); add(cl); for (let k = 0; k < 4; k++) { const s = new THREE.Mesh(new THREE.SphereGeometry(0.45 - k * 0.05, 20, 14), shiny(0xffffff)); s.position.set((k - 1.5) * 0.4, (k % 2) * 0.2, 0); cl.add(s); } }
  on((u) => { R.children.forEach((t, i) => { t.geometry.dispose(); t.geometry = new THREE.TorusGeometry(2.4 - i * 0.24, 0.12, 12, 64, Math.PI * sm(i * 0.12, 0.9 + i * 0.12, u) + 0.001); }); });
  dynLabel(() => 'RAINBOW!', 0, 3.6, -2.6, { w: 3.6, size: 200, color: '#ff3b8a', stroke: '#ffffff' }); }, cam: CAM });
// C10 which colour is your favourite? bye bye! (all the friends together, waving)
shot('C10', { scene: KIDS, build() { toyWorld(0xff7ac0); const A = host(0x9b4dff, 'wave'); const cols = Object.values(COLS);
  cols.forEach((c, i) => { const b = new THREE.Mesh(new THREE.SphereGeometry(0.3, 24, 18), shiny(c)); add(b); on((u) => { const a = u * 1.2 + i / 7 * 6.283; b.position.set(0.8 + Math.cos(a) * 1.4, 1.6 + Math.sin(a) * 1.0, -2.6); }); });
  dynLabel((u) => u < 1.6 ? 'FAVORITE\nCOLOR?' : 'BYE BYE!', 0, 3.55, -2.6, { w: 3.8, size: 160, color: '#9b4dff', stroke: '#ffffff' }); }, cam: CAM, fx: (u, d) => ({ fade: sm(d - 0.5, d, u) }) });
