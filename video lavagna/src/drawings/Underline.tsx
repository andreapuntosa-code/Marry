import React from 'react';
import {ChalkPath} from './ChalkPath';
import {jitter, seg, smooth} from './sketch';
import type {DrawingDef, DrawingProps} from './types';

/** Sottolineatura a mano. props.count = numero di linee (default 1). */
const Underline: React.FC<DrawingProps> = ({p, color, sw, seed, props}) => {
  const count = Number(props.count ?? 1);
  return (
    <g>
      {new Array(count).fill(0).map((_, i) => {
        const y = 22 + i * 32;
        const x0 = 20 + i * 40;
        const x1 = 690 - i * 25;
        const d = smooth(jitter([[x0, y + 4], [(x0 + x1) / 2, y - 3], [x1, y + 2]], seed + i, 3));
        return <ChalkPath key={i} d={d} p={seg(p, i / count, (i + 1) / count)} color={color} width={sw} />;
      })}
    </g>
  );
};

export default {viewBox: '0 0 710 90', component: Underline} satisfies DrawingDef;
