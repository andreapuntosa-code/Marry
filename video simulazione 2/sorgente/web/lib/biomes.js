// The Arena: a round dome, two kilometres wide, with the Horn in the middle and six worlds around it.
// One function says how much of each world there is at any point; terrain, colours and vegetation blend by it.
import { Simplex, smoothstep, lerp, clamp } from './noise.js';

export const HG = { cx: 1000, cz: 300, R: 540, floorY: 2.6, waterY: 0.4 };
const SNb = new Simplex(9001), SNc = new Simplex(9002), SNd = new Simplex(9003);

// centres of the sectors, in degrees measured from +x towards +z ("south")
export const SECTORS = [
  { id: 'mountain', a: -90 },
  { id: 'swamp', a: -25 },
  { id: 'desert', a: 35 },
  { id: 'lake', a: 100 },
  { id: 'meadow', a: 148 },
  { id: 'forest', a: 208 },
];
export const BIOME_IDS = ['center', ...SECTORS.map(s => s.id)];
const angDiff = (a, b) => { let d = (a - b) % 360; if (d > 180) d -= 360; if (d < -180) d += 360; return d; };

// the sector boundaries wander a little so that they never look like a pie chart
export function biomeWeights(x, z, out = {}) {
  const dx = x - HG.cx, dz = z - HG.cz, r = Math.hypot(dx, dz);
  const ang = Math.atan2(dz, dx) * 180 / Math.PI + 26 * SNb.fbm(x / 210, z / 210, 3) + 9 * SNc.fbm(x / 60, z / 60, 2);
  let sum = 0;
  for (const s of SECTORS) { const d = angDiff(ang, s.a); const w = Math.pow(Math.exp(-(d * d) / (2 * 25 * 25)), 2.4); out[s.id] = w; sum += w; }
  const inner = 1 - smoothstep(55, 150, r + 18 * SNd.fbm(x / 80, z / 80, 2));       // the Horn's open ground
  for (const s of SECTORS) out[s.id] = out[s.id] / sum * (1 - inner);
  out.center = inner;
  return out;
}
export const dominant = (x, z) => { const w = biomeWeights(x, z); let b = 'center', m = -1; for (const k in w) if (w[k] > m) { m = w[k]; b = k; } return b; };
export const arenaR = (x, z) => Math.hypot(x - HG.cx, z - HG.cz);

// lake: a round basin in the southern sector
export const LAKE = { x: HG.cx - 55, z: HG.cz + 300, r: 130 };
export function lakeDepth(x, z) {            // 0 on land .. 1 in the deepest part
  const d = Math.hypot(x - LAKE.x, (z - LAKE.z) * 1.12) + 14 * SNb.fbm(x / 40, z / 40, 3);
  return 1 - smoothstep(LAKE.r * 0.45, LAKE.r * 1.05, d);
}
// swamp ponds
export function pondAmount(x, z) { const n = SNc.fbm(x / 62 + 3, z / 62, 3) + 0.3 * SNd.fbm(x / 16, z / 16, 2); return smoothstep(-0.12, 0.08, n); }

export function biomeHeight(x, z, w) {
  const f = HG.floorY;
  const n1 = SNb.fbm(x / 150 + 4, z / 150, 4), n2 = SNc.fbm(x / 40, z / 40, 3), n3 = SNd.fbm(x / 14, z / 14, 2);
  const hCenter = f + 0.25 * n3;
  const hForest = f + 6 + 9 * (0.5 + 0.5 * n1) + 1.0 * n2;
  const hMeadow = f + 1.2 + 2.4 * (0.5 + 0.5 * SNb.fbm(x / 120, z / 120, 3)) + 0.3 * n3;
  const pond = pondAmount(x, z);
  const hSwamp = lerp(HG.waterY + 0.32 + 0.25 * n2, HG.waterY - 0.7, pond);
  // dunes: long crescent ridges
  const dn = SNc.ridged(x / 70 + 1.7, z / 120, 3);
  const hDesert = f + 2 + 9 * dn * (0.7 + 0.5 * (0.5 + 0.5 * n1)) + 1.2 * n3;
  const ld = lakeDepth(x, z);
  const hLake = lerp(f + 0.8 + 0.8 * n2, HG.waterY - 9, ld * ld * (3 - 2 * ld));
  // the mountain climbs with distance from the Horn and is carved by ridges
  const r = Math.hypot(x - HG.cx, z - HG.cz);
  const climb = smoothstep(130, 520, r);
  const hMount = f + 4 + climb * (30 + 190 * SNb.ridged(x / 260 + 5.1, z / 260, 5) * (0.5 + 0.5 * climb)) + 2.5 * n2;
  return hCenter * w.center + hForest * w.forest + hMeadow * w.meadow + hSwamp * w.swamp + hDesert * w.desert + hLake * w.lake + hMount * w.mountain;
}
