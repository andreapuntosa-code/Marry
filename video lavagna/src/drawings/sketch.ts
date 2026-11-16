import {random} from 'remotion';

/** Utilità per disegni "a mano": linee leggermente storte, cerchi che non si chiudono perfettamente. */
export type Pt = [number, number];

export const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
/** Avanzamento locale di un tratto che occupa l'intervallo [a, b] dell'avanzamento totale. */
export const seg = (p: number, a: number, b: number) => clamp01((p - a) / (b - a));
export const ease = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

const r = (seed: string | number, i: number) => random(`${seed}-${i}`) * 2 - 1;

/** Sposta leggermente ogni punto (imperfezione del gesso). */
export const jitter = (pts: Pt[], seed: string | number, amt = 3): Pt[] =>
  pts.map(([x, y], i) => [x + r(seed, i * 2) * amt, y + r(seed, i * 2 + 1) * amt]);

/** Curva morbida (Catmull-Rom → Bézier) che passa per tutti i punti. */
export const smooth = (pts: Pt[], closed = false): string => {
  if (pts.length < 2) return '';
  const p = closed ? [pts[pts.length - 1], ...pts, pts[0], pts[1]] : [pts[0], ...pts, pts[pts.length - 1]];
  let d = `M${p[1][0].toFixed(1)},${p[1][1].toFixed(1)}`;
  for (let i = 1; i < p.length - 2; i++) {
    const [p0, p1, p2, p3] = [p[i - 1], p[i], p[i + 1], p[i + 2]];
    const c1: Pt = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2: Pt = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C${c1[0].toFixed(1)},${c1[1].toFixed(1)} ${c2[0].toFixed(1)},${c2[1].toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
  }
  return d;
};

/** Spezzata (per curve campionate fitte, es. onde). */
export const polyline = (pts: Pt[]): string =>
  pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ');

/** Linea a mano libera tra due punti, con una leggera curvatura. */
export const handLine = (a: Pt, b: Pt, seed: string | number, bow = 4): string => {
  const mid: Pt = [(a[0] + b[0]) / 2 + r(seed, 1) * bow, (a[1] + b[1]) / 2 + r(seed, 2) * bow];
  return smooth(jitter([a, mid, b], seed, bow * 0.3));
};

/** Cerchio/ellisse disegnato a mano: parte da un angolo e "sborda" un poco oltre la chiusura. */
export const handEllipse = (
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  seed: string | number,
  {start = -100, overshoot = 0.07, n = 16, amt = 0.035, from = 0, to = 1}: {start?: number; overshoot?: number; n?: number; amt?: number; from?: number; to?: number} = {},
): string => {
  const pts: Pt[] = [];
  const a0 = (start * Math.PI) / 180;
  const span = Math.PI * 2 * (to - from + overshoot);
  for (let i = 0; i <= n; i++) {
    const a = a0 + Math.PI * 2 * from + (span * i) / n;
    const k = 1 + r(seed, i) * amt;
    pts.push([cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k]);
  }
  return smooth(pts);
};
