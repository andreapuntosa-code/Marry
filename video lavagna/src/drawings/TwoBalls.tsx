import React from 'react';
import {ChalkPath} from './ChalkPath';
import {handEllipse, handLine, seg, smooth} from './sketch';
import type {DrawingDef, DrawingProps} from './types';

/** Due palline con un punto interrogativo in mezzo. */
const TwoBalls: React.FC<DrawingProps> = ({p, color, accent, sw, seed}) => {
  const ball = (cx: number, k: string) => handEllipse(cx, 200, 110, 108, seed + k);
  const hatch = (cx: number, k: string) =>
    [0, 1, 2, 3].map((i) => handLine([cx + 15 + i * 18, 290 - i * 8], [cx + 75 + i * 6, 230 - i * 22], seed + k + i, 2));
  const shine = (cx: number, k: string) => handEllipse(cx - 40, 160, 34, 34, seed + k, {start: 190, to: 0.22, overshoot: 0, n: 5});
  const q = smooth([
    [306, 150], [318, 110], [350, 92], [386, 104], [398, 138], [380, 170], [352, 192], [348, 232],
  ]);
  const dot = handEllipse(349, 275, 7, 7, seed + 'dot', {n: 8});
  return (
    <g>
      <ChalkPath d={ball(150, 'a')} p={seg(p, 0, 0.26)} color={color} width={sw} />
      <ChalkPath d={shine(150, 'sa')} p={seg(p, 0.26, 0.3)} color={color} width={sw * 0.8} />
      {hatch(150, 'ha').map((d, i) => <ChalkPath key={i} d={d} p={seg(p, 0.3 + i * 0.02, 0.32 + i * 0.02)} color={color} width={sw * 0.5} opacity={0.6} />)}
      <ChalkPath d={ball(550, 'b')} p={seg(p, 0.4, 0.66)} color={color} width={sw} />
      <ChalkPath d={shine(550, 'sb')} p={seg(p, 0.66, 0.7)} color={color} width={sw * 0.8} />
      {hatch(550, 'hb').map((d, i) => <ChalkPath key={i} d={d} p={seg(p, 0.7 + i * 0.02, 0.72 + i * 0.02)} color={color} width={sw * 0.5} opacity={0.6} />)}
      <ChalkPath d={q} p={seg(p, 0.8, 0.96)} color={accent} width={sw * 1.2} />
      <ChalkPath d={dot} p={seg(p, 0.96, 1)} color={accent} width={sw * 1.4} />
    </g>
  );
};

export default {viewBox: '0 0 700 400', component: TwoBalls} satisfies DrawingDef;
