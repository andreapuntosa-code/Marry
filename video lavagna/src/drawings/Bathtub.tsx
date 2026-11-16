import React from 'react';
import {ChalkPath} from './ChalkPath';
import {handEllipse, handLine, jitter, seg, smooth} from './sketch';
import type {DrawingDef, DrawingProps} from './types';

/** Icona: vasca da bagno con rubinetto e bolle. */
const Bathtub: React.FC<DrawingProps> = ({p, color, colors, sw, seed}) => {
  const tub = smooth(jitter([[20, 110], [30, 170], [70, 205], [230, 205], [270, 170], [280, 110]], seed + 'tub', 2));
  const rim = handLine([10, 110], [290, 110], seed + 'rim', 2);
  const feet = [handLine([70, 205], [60, 228], seed + 'f1', 1), handLine([230, 205], [240, 228], seed + 'f2', 1)];
  const tap = smooth([[250, 110], [250, 40], [280, 30], [292, 52]]);
  const water = smooth(jitter([[30, 128], [80, 120], [130, 130], [180, 120], [230, 130], [272, 122]], seed + 'w', 2));
  const bubbles = [handEllipse(70, 92, 16, 16, seed + 'b1'), handEllipse(108, 76, 11, 11, seed + 'b2'), handEllipse(140, 94, 8, 8, seed + 'b3')];
  const blue = colors.blue ?? color;
  return (
    <g>
      <ChalkPath d={rim} p={seg(p, 0, 0.15)} color={color} width={sw} />
      <ChalkPath d={tub} p={seg(p, 0.15, 0.45)} color={color} width={sw} />
      {feet.map((d, i) => <ChalkPath key={i} d={d} p={seg(p, 0.45 + i * 0.05, 0.5 + i * 0.05)} color={color} width={sw} />)}
      <ChalkPath d={tap} p={seg(p, 0.55, 0.7)} color={color} width={sw} />
      <ChalkPath d={water} p={seg(p, 0.7, 0.85)} color={blue} width={sw} />
      {bubbles.map((d, i) => <ChalkPath key={i} d={d} p={seg(p, 0.85 + i * 0.05, 0.9 + i * 0.05)} color={blue} width={sw * 0.8} />)}
    </g>
  );
};

export default {viewBox: '0 0 300 240', component: Bathtub} satisfies DrawingDef;
