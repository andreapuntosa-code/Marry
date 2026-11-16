import React from 'react';
import {ChalkPath} from './ChalkPath';
import {ease, handLine, seg, type Pt} from './sketch';
import type {DrawingDef, DrawingProps} from './types';

const OX = 90;
const OY = 500;
const U = 170;
const px = (x: number, y: number): Pt => [OX + x * U, OY - y * U];

/**
 * Grafico della retta y = x. cues: [0] area colorata da 0 a 2, [1] triangolo evidenziato con base e altezza.
 */
const LineGraph: React.FC<DrawingProps> = ({p, cues, color, accent, sw, seed, font}) => {
  const c0 = ease(cues[0] ?? 0);
  const c1 = cues[1] ?? 0;
  const tri = `M${px(0, 0)} L${px(2, 0)} L${px(2, 2)} Z`;
  return (
    <g>
      <defs>
        <clipPath id={`lg-${seed}`}>
          <rect x={OX} y={0} width={2 * U * c0} height={OY + 4} />
        </clipPath>
      </defs>
      {c0 > 0 && <path d={tri} fill={accent} opacity={0.3} clipPath={`url(#lg-${seed})`} />}
      <ChalkPath d={handLine([OX, OY + 10], px(0, 2.75), seed + 'y', 2)} p={seg(p, 0, 0.2)} color={color} width={sw} />
      <ChalkPath d={handLine([OX - 10, OY], px(2.9, 0), seed + 'x', 2)} p={seg(p, 0.2, 0.4)} color={color} width={sw} />
      {[1, 2].map((v, i) => (
        <g key={v}>
          <ChalkPath d={handLine(px(v, 0.07), px(v, -0.07), seed + 'tx' + v, 1)} p={seg(p, 0.4 + i * 0.05, 0.45 + i * 0.05)} color={color} width={sw * 0.8} />
          <ChalkPath d={handLine(px(-0.07, v), px(0.07, v), seed + 'ty' + v, 1)} p={seg(p, 0.4 + i * 0.05, 0.45 + i * 0.05)} color={color} width={sw * 0.8} />
        </g>
      ))}
      <ChalkPath d={handLine(px(0, 0), px(2.6, 2.6), seed + 'line', 3)} p={seg(p, 0.55, 0.95)} color={accent} width={sw * 1.15} />
      <g opacity={seg(p, 0.85, 1)} fontFamily={font} fontWeight={700} fill={color} fontSize={44}>
        <text x={px(1, 0)[0]} y={OY + 52} textAnchor="middle">1</text>
        <text x={px(2, 0)[0]} y={OY + 52} textAnchor="middle">2</text>
        <text x={OX - 30} y={px(0, 1)[1] + 14} textAnchor="middle">1</text>
        <text x={OX - 30} y={px(0, 2)[1] + 14} textAnchor="middle">2</text>
        <text x={OX - 30} y={OY + 44} textAnchor="middle">0</text>
        <text x={px(2.6, 2.6)[0] - 10} y={px(2.6, 2.6)[1] - 18} fill={accent} textAnchor="end">y = x</text>
      </g>
      {c1 > 0 && (
        <g>
          <ChalkPath d={tri} p={c1} color={accent} width={sw * 1.3} />
          <g opacity={seg(c1, 0.6, 1)} fontFamily={font} fontWeight={700} fill={accent} fontSize={46}>
            <text x={px(1, 0)[0]} y={OY + 100} textAnchor="middle">base 2</text>
            <text x={px(2, 1)[0] + 20} y={px(2, 1)[1] + 14}>height 2</text>
          </g>
        </g>
      )}
    </g>
  );
};

export default {viewBox: '0 0 640 620', component: LineGraph} satisfies DrawingDef;
