// Reusable stone-age scene builders
import { T, L, PRE, ai, circle, beast, herd, snow, lineup, campfire, PRE20, WALKERS, KEEPERS, walker, KIT, height, lerp } from './pre_kit.js';
export const crew = PRE20;
const P = (f, dx, dz) => f.p(dx, dz);
// the cave with a fire inside and AIs sitting around it
export function cavefire(c, f, o = {}) {
  PRE.cave(c, f.x, f.z, f.yaw, { phase: o.phase ?? 0.02, lightI: o.lightI ?? 6, glow: o.glow ?? 0.6 });
  if (o.fire !== false) campfire(c, ...P(f, 0, -3.2), { size: o.fireSize ?? 1.0, li: o.fireLi ?? 14, ld: 12 });
  const names = o.names ?? crew.slice(0, 10), kind = o.kind ?? 'rag', r = o.r ?? 2.0;
  names.forEach((n, i) => { const a = i / names.length * Math.PI * 2 + 0.4, q = P(f, Math.cos(a) * r * 1.2, -3.2 + Math.sin(a) * r); ai(c, n, q[0], q[1], Array.isArray(o.pose) ? o.pose[i % o.pose.length] : (o.pose ?? 'sitGround'), kind, { yawTo: P(f, 0, -3.2), phase: i * 0.7 }); });
}
// two figures facing each other (a left, b right) at the frame origin
export function pair(c, f, a, b, ka, kb, pa = 'talk', pb = 'idle', gap = 1.7, dz = 0) {
  const A = P(f, -gap / 2, dz), B = P(f, gap / 2, dz);
  ai(c, a, A[0], A[1], pa, ka, { yawTo: B }); ai(c, b, B[0], B[1], pb, kb, { yawTo: A });
}
export const rag = 'rag', walker_ = 'walker', keeper = 'keeper';
// mammoth that walks to a pit and falls in
export function fallingMammoth(c, f, t0 = 2.0) {
  const s = P(f, -14, 6), e = P(f, 0, 0), a = beast(c, 'mammoth', 1, s[0], s[1], Math.atan2(e[0] - s[0], e[1] - s[1]), { speed: 0.6, move: e, v: 2.2 });
  c.on((t) => { if (t > t0) { const u = Math.min(1, (t - t0) / 0.7), y = height(e[0], e[1]); a.root.position.y = y - u * 2.6; a.root.rotation.x = u * 0.5; } });
  return a;
}
export { T, L, PRE, ai, circle, beast, herd, snow, lineup, campfire, PRE20, WALKERS, KEEPERS, walker, KIT };
