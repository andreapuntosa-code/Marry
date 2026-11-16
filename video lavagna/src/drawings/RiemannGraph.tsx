import React from 'react';
import {ChalkPath} from './ChalkPath';
import {clamp01, ease, handLine, polyline, seg, type Pt} from './sketch';
import type {DrawingDef, DrawingProps} from './types';

// Velocità dell'auto nel tempo: accelera, con qualche frenata (sempre positiva)
const f = (x: number) => 1.2 + 0.45 * x + 1.6 * Math.sin(0.75 * x + 0.2) + 0.5 * Math.sin(2.1 * x);
const X1 = 10;
const OX = 90;
const OY = 600;
const SX = 760 / X1;
const SY = 520 / 8;
const px = (x: number, y: number): Pt => [OX + x * SX, OY - y * SY];

const leftSum = (n: number) => {
  let s = 0;
  for (let i = 0; i < n; i++) s += f((i * X1) / n) * (X1 / n);
  return s;
};
const EXACT = (() => {
  let s = 0;
  const n = 4000;
  for (let i = 0; i < n; i++) s += f(((i + 0.5) * X1) / n) * (X1 / n);
  return s;
})();

const SETS = [4, 10, 100];

/**
 * Grafico velocità-tempo con l'area sotto la curva approssimata da rettangoli.
 * cues: [0] area colorata, [1] 4 rettangoli, [2] 10, [3] 100, [4] area esatta.
 */
const RiemannGraph: React.FC<DrawingProps> = ({p, cues, color, accent, colors, sw, seed, font}) => {
  const c = (i: number) => cues[i] ?? 0;
  const curvePts: Pt[] = [];
  for (let x = 0; x <= X1 + 0.001; x += 0.08) curvePts.push(px(x, f(x)));
  const areaPath = `${polyline([px(0, 0), ...curvePts, px(X1, 0)])} Z`;
  const areaOpacity = 0.3 * (c(0) * (1 - c(1)) + c(4));
  const areaReveal = c(4) > 0 ? 1 : ease(c(0));
  const blue = colors.blue ?? color;

  // quale insieme di rettangoli è visibile
  const setOpacity = SETS.map((_, k) => c(k + 1) * (1 - c(k + 2)));
  const active = setOpacity.reduce((best, o, k) => (o > 0.5 ? k : best), -1);
  const label =
    c(4) > 0.5
      ? `exact = ${EXACT.toFixed(2)}`
      : active >= 0
        ? `${SETS[active]} rectangles ≈ ${leftSum(SETS[active]).toFixed(2)}`
        : '';

  return (
    <g>
      <defs>
        <clipPath id={`reveal-${seed}`}>
          <rect x={OX} y={0} width={760 * areaReveal} height={OY + 10} />
        </clipPath>
      </defs>
      {/* area sotto la curva */}
      {areaOpacity > 0.01 && <path d={areaPath} fill={accent} opacity={areaOpacity} clipPath={`url(#reveal-${seed})`} />}
      {/* rettangoli */}
      {SETS.map((n, k) => {
        const o = setOpacity[k];
        if (o <= 0.01) return null;
        const w = X1 / n;
        return (
          <g key={n} opacity={o}>
            {Array.from({length: n}, (_, i) => {
              const grow = clamp01(c(k + 1) * 1.6 - (i / n) * 0.6);
              const h = f(i * w) * SY * ease(grow);
              const [x0] = px(i * w, 0);
              return (
                <rect
                  key={i}
                  x={x0}
                  y={OY - h}
                  width={w * SX}
                  height={h}
                  fill={blue}
                  fillOpacity={0.28}
                  stroke={color}
                  strokeWidth={n > 50 ? sw * 0.15 : sw * 0.55}
                  strokeOpacity={0.9}
                />
              );
            })}
          </g>
        );
      })}
      {/* assi */}
      <ChalkPath d={handLine([OX, OY + 10], [OX, 50], seed + 'y', 2)} p={seg(p, 0, 0.17)} color={color} width={sw} />
      <ChalkPath d={handLine([OX - 10, OY], [880, OY], seed + 'x', 2)} p={seg(p, 0.17, 0.35)} color={color} width={sw} />
      <ChalkPath d={handLine([880, OY], [862, OY - 12], seed + 'xa', 1)} p={seg(p, 0.33, 0.36)} color={color} width={sw} />
      <ChalkPath d={handLine([OX, 50], [OX - 12, 68], seed + 'ya', 1)} p={seg(p, 0.15, 0.18)} color={color} width={sw} />
      {/* curva */}
      <ChalkPath d={polyline(curvePts)} p={seg(p, 0.36, 0.95)} color={accent} width={sw * 1.15} />
      <g opacity={seg(p, 0.9, 1)} fontFamily={font} fontWeight={700} fill={color}>
        <text x={OX + 16} y={74} fontSize={50}>
          speed
        </text>
        <text x={870} y={OY + 56} fontSize={50} textAnchor="end">
          time
        </text>
      </g>
      {label && (
        <text x={870} y={40} fontSize={54} fontFamily={font} fontWeight={700} fill={accent} textAnchor="end">
          {label}
        </text>
      )}
    </g>
  );
};

export default {viewBox: '0 -20 900 680', component: RiemannGraph} satisfies DrawingDef;
