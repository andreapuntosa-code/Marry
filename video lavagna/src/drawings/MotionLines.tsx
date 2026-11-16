import React from 'react';
import {ChalkPath} from './ChalkPath';
import {handEllipse, handLine, seg} from './sketch';
import type {DrawingDef, DrawingProps} from './types';

/** Archi di movimento attorno a un oggetto che gira. */
const MotionLines: React.FC<DrawingProps> = ({p, color, sw, seed}) => {
  const top = handEllipse(320, 250, 290, 190, seed + 'a', {start: 200, to: 0.33, overshoot: 0, n: 8});
  const bottom = handEllipse(320, 250, 290, 190, seed + 'b', {start: 20, to: 0.33, overshoot: 0, n: 8});
  // punte di freccia alla fine di ciascun arco (senso di rotazione)
  const headTop = [handLine([548, 108], [592, 134], seed + 'h1', 1), handLine([592, 134], [566, 86], seed + 'h2', 1)];
  const headBot = [handLine([92, 392], [48, 366], seed + 'h3', 1), handLine([48, 366], [74, 414], seed + 'h4', 1)];
  const ticks = [
    handLine([14, 210], [44, 206], seed + 't1', 1),
    handLine([10, 250], [40, 250], seed + 't2', 1),
    handLine([626, 250], [596, 252], seed + 't3', 1),
    handLine([622, 290], [592, 292], seed + 't4', 1),
  ];
  return (
    <g opacity={0.85}>
      <ChalkPath d={top} p={seg(p, 0, 0.35)} color={color} width={sw * 0.8} />
      {headTop.map((d, i) => <ChalkPath key={i} d={d} p={seg(p, 0.35 + i * 0.05, 0.4 + i * 0.05)} color={color} width={sw * 0.8} />)}
      <ChalkPath d={bottom} p={seg(p, 0.45, 0.8)} color={color} width={sw * 0.8} />
      {headBot.map((d, i) => <ChalkPath key={i} d={d} p={seg(p, 0.8 + i * 0.05, 0.85 + i * 0.05)} color={color} width={sw * 0.8} />)}
      {ticks.map((d, i) => <ChalkPath key={i} d={d} p={seg(p, 0.92 + i * 0.02, 0.94 + i * 0.02)} color={color} width={sw * 0.6} />)}
    </g>
  );
};

export default {viewBox: '0 0 640 500', component: MotionLines} satisfies DrawingDef;
