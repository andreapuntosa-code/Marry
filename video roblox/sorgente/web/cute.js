// Cute "In this world..." helpers: speech bubbles, pets (cat, parrot, goldfish bowl), mood clouds with weather,
// umbrella, rainbow, and living shadows lying on the ground.
import { THREE, add, on, onPost, glowTex, rbox, room, person, sm, lerp, getScene } from './kit.js';
import { blk } from './sets.js';
import { M_, rnd } from './whatif.js';

const shiny = (c, o = {}) => new THREE.MeshPhysicalMaterial({ color: c, roughness: o.r ?? 0.35, clearcoat: 0.7 });

// a white comic speech bubble (billboard) that pops in at t0
export function bubble(textFn, x, y, z, o = {}) {
  const c = document.createElement('canvas'); c.width = 1024; c.height = 512; const g = c.getContext('2d'); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  const w = o.w ?? 1.6; const m = new THREE.Mesh(new THREE.PlaneGeometry(w, w / 2), new THREE.MeshBasicMaterial({ map: t, transparent: true, fog: false, depthTest: o.depthTest ?? true })); m.position.set(x, y, z); m.renderOrder = 5; add(m);
  let last = null; const t0 = o.t0 ?? 0, tail = o.tail ?? -1;
  on((u, d) => { const s = typeof textFn === 'function' ? textFn(u, d) : textFn; const k = sm(t0, t0 + 0.18, u); m.visible = u >= t0 && (o.t1 === undefined || u < o.t1); m.scale.setScalar(Math.max(0.01, k * (1 + 0.12 * Math.sin(Math.min(1, (u - t0) / 0.3) * Math.PI))));
    if (s === last) return; last = s; g.clearRect(0, 0, 1024, 512);
    g.fillStyle = '#ffffff'; g.strokeStyle = '#1a1030'; g.lineWidth = 14; g.lineJoin = 'round';
    const rr = (x0, y0, x1, y1, r) => { g.beginPath(); g.moveTo(x0 + r, y0); g.arcTo(x1, y0, x1, y1, r); g.arcTo(x1, y1, x0, y1, r); g.arcTo(x0, y1, x0, y0, r); g.arcTo(x0, y0, x1, y0, r); g.closePath(); };
    const tx = 512 + tail * 220; g.beginPath(); g.moveTo(tx - 60, 380); g.lineTo(tx + tail * 90, 500); g.lineTo(tx + 60, 380); g.closePath(); g.fill(); g.stroke();
    rr(30, 30, 994, 400, 120); g.fill(); g.stroke(); g.beginPath(); g.moveTo(tx - 52, 392); g.lineTo(tx + 52, 392); g.lineWidth = 20; g.strokeStyle = '#ffffff'; g.stroke();
    const lines = s.split('\n'); let sz = o.size ?? 150; g.font = `${sz}px Poppins`; while (Math.max(...lines.map(l => g.measureText(l).width)) > 860 || sz * 1.1 * lines.length > 330) { sz -= 6; g.font = `${sz}px Poppins`; }
    g.fillStyle = o.color ?? '#1a1030'; g.textAlign = 'center'; g.textBaseline = 'middle'; lines.forEach((ln, i) => g.fillText(ln, 512, 215 + (i - (lines.length - 1) / 2) * sz * 1.08)); t.needsUpdate = true; });
  onPost((u, d, cam) => m.quaternion.copy(cam.quaternion));
  return m;
}

// floating hearts (additive pink points rising)
export function hearts(x, y, z, o = {}) {
  const n = o.n ?? 24, r = rnd(o.seed ?? 4), cv = document.createElement('canvas'); cv.width = cv.height = 128; const g = cv.getContext('2d');
  g.fillStyle = '#ffffff'; g.beginPath(); g.moveTo(64, 112); g.bezierCurveTo(-20, 50, 30, -10, 64, 34); g.bezierCurveTo(98, -10, 148, 50, 64, 112); g.fill();
  const tex = new THREE.CanvasTexture(cv); const pos = new Float32Array(n * 3), b = []; for (let i = 0; i < n; i++) b.push([(r() - 0.5) * (o.R ?? 1.2), r(), 0.3 + r() * 0.5, (r() - 0.5) * (o.R ?? 1.2)]);
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const m = new THREE.PointsMaterial({ size: o.size ?? 0.22, map: tex, color: o.color ?? 0xff5a8a, transparent: true, depthWrite: false, alphaTest: 0.1 }); const p = new THREE.Points(geo, m); p.frustumCulled = false; add(p);
  on((u) => { m.opacity = o.amount ? o.amount(u) : 1; b.forEach(([dx, ph, sp, dz], i) => { const q = (u * sp * 0.5 + ph) % 1; pos.set([x + dx + Math.sin(u * 2 + i) * 0.08, y + q * (o.h ?? 1.4), z + dz], i * 3); }); geo.attributes.position.needsUpdate = true; });
  return p;
}

// ------------------------------------------------------------------ pets
export function cat(x, y, z, yaw = 0, o = {}) {
  const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = yaw; g.scale.setScalar(o.scale ?? 1); add(g);
  const fur = M_(o.color ?? 0xf0a040, { r: 0.8 }), pale = M_(0xfff0dc, { r: 0.8 });
  const body = new THREE.Mesh(rbox(0.5, 0.42, 0.8, 0.3), fur); body.position.y = 0.36; body.castShadow = true; g.add(body);
  for (const [lx, lz] of [[-0.16, 0.28], [0.16, 0.28], [-0.16, -0.28], [0.16, -0.28]]) { const l = new THREE.Mesh(rbox(0.13, 0.22, 0.13, 0.3), fur); l.position.set(lx, 0.11, lz); g.add(l); }
  const head = new THREE.Group(); head.position.set(0, 0.68, 0.38); g.add(head);
  const hm = new THREE.Mesh(rbox(0.52, 0.44, 0.42, 0.35), fur); hm.castShadow = true; head.add(hm);
  const mz = new THREE.Mesh(rbox(0.26, 0.14, 0.08, 0.4), pale); mz.position.set(0, -0.1, 0.21); head.add(mz);
  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.035, 10, 8), M_(0xf07a9a)); nose.position.set(0, -0.04, 0.26); head.add(nose);
  for (const s of [-1, 1]) { const ear = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.2, 4), fur); ear.position.set(s * 0.16, 0.29, 0); ear.rotation.y = Math.PI / 4; head.add(ear);
    const e = new THREE.Mesh(new THREE.SphereGeometry(0.055, 12, 10), M_(0x2a7a2a, { r: 0.2 })); e.scale.z = 0.4; e.position.set(s * 0.12, 0.05, 0.21); head.add(e);
    const pu = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.08, 0.01), M_(0x0a0a0a)); pu.position.set(s * 0.12, 0.05, 0.235); head.add(pu);
    if (o.bored) { const lid = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.06, 0.03), fur); lid.position.set(s * 0.12, 0.085, 0.235); head.add(lid); }
    for (const k of [-1, 1]) { const w = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.008, 0.008), M_(0xffffff)); w.position.set(s * 0.2, -0.08 + k * 0.025, 0.22); w.rotation.z = k * 0.15 * s; head.add(w); } }
  if (o.stripes !== false) for (let i = 0; i < 3; i++) { const st = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.03, 0.08), M_(0xc06a20)); st.position.set(0, 0.57, -0.2 + i * 0.18); g.add(st); }
  const tail = new THREE.Group(); tail.position.set(0, 0.45, -0.4); g.add(tail); const tm = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 0.6, 8), fur); tm.position.y = 0.3; tail.add(tm);
  on((u) => { tail.rotation.x = -0.5 + Math.sin(u * 2.2) * 0.15; tail.rotation.z = Math.sin(u * 1.6) * 0.4; head.rotation.y = o.look ? o.look(u) : Math.sin(u * 0.7) * 0.08; head.rotation.x = o.nod ? o.nod(u) : 0; });
  return { g, head };
}
export function parrot(x, y, z, yaw = 0, o = {}) {
  const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = yaw; g.scale.setScalar(o.scale ?? 1); add(g);
  const gr = shiny(0x2ac84a), rd = shiny(0xe83a2a), bl = shiny(0x2a6ae8), yl = shiny(0xffc21a);
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.22, 20, 16), gr); body.scale.set(1, 1.5, 0.95); body.position.y = 0.32; g.add(body);
  const head = new THREE.Group(); head.position.set(0, 0.68, 0.02); g.add(head);
  const hm = new THREE.Mesh(new THREE.SphereGeometry(0.17, 20, 16), rd); head.add(hm);
  const beak = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.18, 10), yl); beak.rotation.x = Math.PI / 2 + 0.5; beak.position.set(0, -0.04, 0.18); head.add(beak);
  for (const s of [-1, 1]) { const e = new THREE.Mesh(new THREE.SphereGeometry(0.045, 10, 8), M_(0xffffff)); e.position.set(s * 0.1, 0.04, 0.12); head.add(e); const p = new THREE.Mesh(new THREE.SphereGeometry(0.025, 8, 6), M_(0x0a0a0a)); p.position.set(s * 0.11, 0.04, 0.155); head.add(p);
    const w = new THREE.Mesh(rbox(0.08, 0.4, 0.26, 0.4), bl); w.position.set(s * 0.21, 0.32, -0.02); w.rotation.z = s * 0.15; g.add(w); }
  for (let i = 0; i < 3; i++) { const t = new THREE.Mesh(rbox(0.06, 0.45, 0.04, 0.3), i === 1 ? bl : rd); t.position.set((i - 1) * 0.06, 0.02, -0.16); t.rotation.x = 0.5; g.add(t); }
  const perch = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.8, 8), M_(0x8a5a34)); perch.rotation.z = Math.PI / 2; perch.position.y = 0.04; g.add(perch);
  on((u) => { head.rotation.z = Math.sin(u * 5) * (o.talk ? o.talk(u) : 0.05) * 3; head.position.y = 0.68 + Math.abs(Math.sin(u * 6)) * 0.03 * (o.talk ? o.talk(u) * 4 : 0); });
  return { g, head };
}
export function fishBowl(x, y, z, o = {}) {
  const g = new THREE.Group(); g.position.set(x, y, z); g.scale.setScalar(o.scale ?? 1); add(g);
  const water = new THREE.Mesh(new THREE.SphereGeometry(0.56, 40, 30, 0, Math.PI * 2, 0.5, Math.PI - 0.5), new THREE.MeshStandardMaterial({ color: 0x3aa8ff, transparent: true, opacity: 0.2, roughness: 0.05, depthWrite: false })); water.position.y = 0.6; g.add(water);
  const glass = new THREE.Mesh(new THREE.SphereGeometry(0.6, 40, 30, 0, Math.PI * 2, 0.35, Math.PI - 0.35), new THREE.MeshPhysicalMaterial({ color: 0xffffff, transparent: true, opacity: 0.06, roughness: 0.02, clearcoat: 1, depthWrite: false, side: THREE.DoubleSide })); glass.position.y = 0.6; g.add(glass);
  const r = rnd(8); for (let i = 0; i < 40; i++) { const p = new THREE.Mesh(new THREE.SphereGeometry(0.04, 6, 5), M_([0xff7a9a, 0x7ad0ff, 0xffd23a, 0x9aff7a][i % 4])); const a = r() * 6.28, d = r() * 0.32; p.position.set(Math.cos(a) * d, 0.12, Math.sin(a) * d); g.add(p); }
  const fish = new THREE.Group(); g.add(fish); const or = shiny(0xff7a1a, { r: 0.25 });
  const fb = new THREE.Mesh(new THREE.SphereGeometry(0.13, 20, 14), or); fb.scale.set(1.4, 1, 0.7); fish.add(fb);
  const tl = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.18, 4), or); tl.rotation.z = Math.PI / 2; tl.position.x = -0.24; fish.add(tl);
  for (const s of [-1, 1]) { const e = new THREE.Mesh(new THREE.SphereGeometry(0.035, 10, 8), M_(0xffffff)); e.position.set(0.12, 0.04, s * 0.07); fish.add(e); const p = new THREE.Mesh(new THREE.SphereGeometry(0.02, 8, 6), M_(0x0a0a0a)); p.position.set(0.135, 0.04, s * 0.09); fish.add(p); }
  on((u) => { const a = o.still ? 0 : u * 0.9; fish.position.set(Math.cos(a) * 0.22, 0.6 + Math.sin(u * 2) * 0.04, Math.sin(a) * 0.22); fish.rotation.y = o.still ? (o.face ?? -Math.PI / 2) : -a - Math.PI / 2 + Math.PI; tl.rotation.y = Math.sin(u * 12) * 0.5; });
  return { g, fish };
}

// ------------------------------------------------------------------ mood clouds
// a cloud parented to a person's head (follows them). mood(u) -> 'sun' | 'rain' | 'thunder' | 'glitter' | 'rainbow' | 'none'
export function moodCloud(A, mood, o = {}) {
  const S = 1 / 0.42 / (A.def.scale ?? 1), g = new THREE.Group(); g.position.set(0, 4.62 + 1.2 * S, 0); g.scale.setScalar(S * (o.size ?? 0.8)); A.body.add(g);
  const grey = M_(0x8a94a8, { r: 0.95 }), white = M_(0xffffff, { r: 0.95 }); const puffs = [];
  for (const [px, py, pr] of [[-0.28, 0, 0.24], [0, 0.08, 0.3], [0.28, 0, 0.24], [0.12, -0.06, 0.22], [-0.12, -0.06, 0.22]]) { const p = new THREE.Mesh(new THREE.SphereGeometry(pr, 18, 14), white); p.position.set(px, py, 0); g.add(p); puffs.push(p); }
  const sun = new THREE.Group(); sun.position.set(0.32, 0.22, -0.05); g.add(sun); const sb = new THREE.Mesh(new THREE.SphereGeometry(0.16, 20, 14), new THREE.MeshStandardMaterial({ color: 0xffd23a, emissive: 0xffb21a, emissiveIntensity: 1.6 })); sun.add(sb);
  for (let i = 0; i < 8; i++) { const r = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.12, 0.02), new THREE.MeshBasicMaterial({ color: 0xffe07a })); const a = i / 8 * 6.283; r.position.set(Math.sin(a) * 0.25, Math.cos(a) * 0.25, 0); r.rotation.z = -a; sun.add(r); }
  // rain / glitter drops
  const n = 70, pos = new Float32Array(n * 3), r = rnd(o.seed ?? 7), b = []; for (let i = 0; i < n; i++) b.push([(r() - 0.5) * 0.7, r(), (r() - 0.5) * 0.25]);
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const dm = new THREE.PointsMaterial({ size: 0.05 * S * 0.42, color: 0x5ab8ff, transparent: true, map: glowTex(), depthWrite: false }); const drops = new THREE.Points(geo, dm); drops.frustumCulled = false; g.add(drops);
  const bolt = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.4, 3), new THREE.MeshBasicMaterial({ color: 0xffe94a })); bolt.position.set(0.05, -0.38, 0.05); bolt.rotation.z = 0.3; g.add(bolt);
  const bow = new THREE.Group(); bow.position.set(0, 0.0, -0.02); g.add(bow);
  ['#ff4a4a', '#ff9a2a', '#ffe02a', '#4ad04a', '#3a9aff', '#9a5aff'].forEach((c, i) => { const t = new THREE.Mesh(new THREE.TorusGeometry(0.62 - i * 0.055, 0.03, 6, 40, Math.PI), new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: 0.6 })); bow.add(t); });
  const dropLen = o.dropLen ?? 1.0;
  on((u, d) => { const m = mood(u, d); g.visible = m !== 'none'; const dark = m === 'rain' || m === 'thunder'; puffs.forEach(p => p.material = dark ? grey : white);
    sun.visible = m === 'sun'; sun.rotation.z = u * 0.8; drops.visible = m === 'rain' || m === 'thunder' || m === 'glitter';
    dm.color.set(m === 'glitter' ? [0xff7ac8, 0xffd23a, 0xbf8aff][Math.floor(u * 8) % 3] : 0x5ab8ff); dm.size = (m === 'glitter' ? 0.13 : 0.1);
    bolt.visible = m === 'thunder' && (Math.floor(u * 5) % 3 === 0); bow.visible = m === 'rainbow'; bow.scale.setScalar(m === 'rainbow' ? sm(0, 0.6, (o.bowT ? u - o.bowT : 1)) + 0.001 : 1);
    g.position.x = Math.sin(u * 1.3) * 0.05 * S; g.rotation.z = m === 'thunder' ? Math.sin(u * 30) * 0.05 : 0;
    b.forEach(([dx, ph, dz], i) => { const q = (u * (m === 'glitter' ? 0.6 : 1.4) + ph) % 1; pos.set([dx + (m === 'glitter' ? Math.sin(u * 3 + i) * 0.05 : 0), -0.2 - q * dropLen * 2.2, dz], i * 3); }); geo.attributes.position.needsUpdate = true; });
  return g;
}
export function umbrella(A, o = {}) {   // held in the right hand, canopy above the head (and over a neighbour if o.lean)
  const g = new THREE.Group(); A.armR.add(g); g.position.set(0, -1.9, 0);
  const stick = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 5.2, 8), M_(0x2a2a30)); stick.position.y = 2.4; g.add(stick);
  const can = new THREE.Mesh(new THREE.ConeGeometry(3.4, 1.4, 12, 1, true), new THREE.MeshStandardMaterial({ color: o.color ?? 0xff4a6a, roughness: 0.6, side: THREE.DoubleSide })); can.position.y = 5.2; g.add(can);
  return g;
}

// ------------------------------------------------------------------ living shadows
// a black, flat copy of an avatar lying on the ground behind the person (head away from the camera unless o.dir)
export function shadowOf(def, x, z, o = {}) {
  const A = person({ ...def, acc: [], logo: null }, x, z, 0, o.pose ?? 'idle', { y: 0.02, anim: o.anim });
  const black = new THREE.MeshBasicMaterial({ color: o.color ?? 0x262a34 });
  A.root.traverse((n) => { if (n.isMesh) { if (n.material === A.faceMat) n.visible = false; else { n.material = black; n.castShadow = false; n.receiveShadow = false; n.renderOrder = 1; } } });
  A.setFace = () => {};
  const W = new THREE.Group(); W.position.set(x, o.y ?? 0.27, z); W.rotation.y = o.yaw ?? 0; getScene().remove(A.root); W.add(A.root); add(W); A.root.position.set(0, 0, 0); A.root.rotation.set(-Math.PI / 2, 0, 0); A.wrap = W;
  const s = 0.42 * (def.scale ?? 1); A.root.scale.set(s, s * (o.stretch ?? 1.15), 0.002); A.shadowFlat = true;
  return A;
}
export const noShadow = (A) => A.root.traverse((n) => { if (n.isMesh) n.castShadow = false; });

// a cozy living room (open towards +z): sofa, rug, lamp, window, picture frames
export function livingRoom(o = {}) {
  const S = getScene(); const R = room({ wall: o.wall ?? 0xf6e2c8, floor: o.floor ?? '#c99a6a', w: 12, d: 10, h: 6, lamp: o.night ? 8 : 26 });
  const sofa = M_(o.sofa ?? 0x5a8ad8, { r: 0.9 }); blk(4.2, 0.9, 1.4, sofa, 0, 0.6, -4.1); blk(4.2, 1.3, 0.4, sofa, 0, 1.3, -4.7); for (const s of [-1, 1]) blk(0.4, 1.1, 1.4, sofa, s * 2.2, 0.85, -4.1);
  const rug = new THREE.Mesh(new THREE.CircleGeometry(2.4, 48), M_(o.rug ?? 0xe86a5a, { r: 1 })); rug.rotation.x = -Math.PI / 2; rug.position.set(0, 0.02, -1.4); rug.receiveShadow = true; add(rug);
  const rug2 = new THREE.Mesh(new THREE.RingGeometry(1.8, 2.0, 48), M_(0xffe0a0, { r: 1 })); rug2.rotation.x = -Math.PI / 2; rug2.position.set(0, 0.025, -1.4); add(rug2);
  const win = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 2.0), new THREE.MeshBasicMaterial({ color: o.night ? 0x1a2a5a : 0xbfe8ff })); win.position.set(-3.6, 3.4, -4.84); add(win);
  for (const s of [-1, 1]) blk(0.12, 2.2, 0.12, M_(0xffffff), -3.6 + s * 1.25, 3.4, -4.8); blk(2.6, 0.12, 0.14, M_(0xffffff), -3.6, 2.35, -4.8); blk(2.6, 0.12, 0.14, M_(0xffffff), -3.6, 4.45, -4.8);
  [[1.6, 3.6, 0xffb0c0], [3.4, 3.2, 0xa0d8ff]].forEach(([fx, fy, c]) => { blk(1.1, 0.9, 0.08, M_(0x8a5a34), fx, fy, -4.82); blk(0.9, 0.7, 0.06, M_(c), fx, fy, -4.77); });
  blk(0.2, 2.6, 0.2, M_(0x2a2a30), 3.6, 1.3, -3.6); const shade = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.55, 0.6, 20, 1, true), new THREE.MeshStandardMaterial({ color: 0xfff0c8, emissive: 0xffd28a, emissiveIntensity: o.night ? 1.4 : 0.3, side: THREE.DoubleSide })); shade.position.set(3.6, 2.8, -3.6); add(shade);
  if (o.night) { const L = new THREE.PointLight(0xffc27a, 14, 12, 1.5); L.position.set(3.0, 2.6, -2.8); add(L); S.userData.hemi.intensity = 0.45; S.userData.sun.intensity = 0.25; }
  return R;
}
export const CROWD = [
  { skin: 0xf2c79a, shirt: 0xf28c28, pants: 0x2f4a8a, hair: { style: 'spiky', color: 0x2a1a10 }, acc: ['headband'] },
  { skin: 0x8a5a3a, shirt: 0x3fa7d6, pants: 0xc9b38a, hair: { style: 'short', color: 0x1a1210 } },
  { skin: 0xffd9b3, shirt: 0xb04ac9, pants: 0x4a4a55, hair: { style: 'bun', color: 0x8a3a1a } },
  { skin: 0xc68a5a, shirt: 0xd23a3a, pants: 0x2a2a35, hair: { style: 'long', color: 0x2a1a10 } },
  { skin: 0xf2c79a, shirt: 0x6cc24a, pants: 0x3b5ba8, hair: { style: 'short', color: 0x8a5a2a } },
  { skin: 0x5a3a26, shirt: 0x4a5ad6, pants: 0x2f4a8a, hair: { style: 'short', color: 0x111111 }, acc: ['glasses'] },
  { skin: 0xf6d2b0, shirt: 0x9a9aa8, pants: 0x55555f, hair: { style: 'spiky', color: 0x6a6a6a } },
  { skin: 0xe8b98a, shirt: 0x36c2b4, pants: 0x2a2a35, hair: { style: 'bun', color: 0xf2d24a } },
];
// an open umbrella standing in the world (stick from a hand at (x, y0, z) up to the canopy); open(u) 0..1
export function umbrellaAt(x, y0, z, o = {}) {
  const g = new THREE.Group(); g.position.set(x, y0, z); g.rotation.z = o.tilt ?? 0; add(g);
  const stick = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 1.5, 8), M_(0x2a2a30)); stick.position.y = 0.75; g.add(stick);
  const hook = new THREE.Mesh(new THREE.TorusGeometry(0.08, 0.025, 6, 12, Math.PI), M_(0x2a2a30)); hook.rotation.z = Math.PI; g.add(hook);
  const can = new THREE.Mesh(new THREE.ConeGeometry(o.R ?? 1.3, 0.55, 16, 1, true), new THREE.MeshStandardMaterial({ color: o.color ?? 0xff4a6a, roughness: 0.55, side: THREE.DoubleSide })); can.position.y = 1.6; can.castShadow = true; g.add(can);
  const tip = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 6), M_(0x2a2a30)); tip.position.y = 1.9; g.add(tip);
  on((u, d) => { const k = o.open ? o.open(u, d) : 1; g.visible = k > 0.01; can.scale.set(k, 0.5 + 0.5 * k, k); });
  return g;
}
