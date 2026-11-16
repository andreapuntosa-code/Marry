import React from 'react';
import {ChalkPath} from './ChalkPath';
import {handEllipse, handLine, jitter, seg, smooth} from './sketch';
import type {DrawingDef, DrawingProps} from './types';

/** La trottola. */
const Spinner: React.FC<DrawingProps> = ({p, color, sw, seed}) => {
  const handle = [handLine([140, 22], [140, 100], seed + 'h1', 2), handLine([160, 22], [160, 100], seed + 'h2', 2), handLine([138, 22], [162, 22], seed + 'h3', 1)];
  const rim = handEllipse(150, 118, 125, 30, seed + 'rim', {start: 180});
  const left = smooth(jitter([[25, 120], [42, 200], [92, 292], [150, 392]], seed + 'l', 3));
  const right = smooth(jitter([[275, 120], [258, 200], [208, 292], [150, 392]], seed + 'r', 3));
  const band1 = smooth(jitter([[40, 190], [150, 222], [260, 190]], seed + 'b1', 2));
  const band2 = smooth(jitter([[78, 262], [150, 284], [222, 262]], seed + 'b2', 2));
  const tip = handLine([150, 392], [150, 414], seed + 't', 1);
  return (
    <g>
      {handle.map((d, i) => <ChalkPath key={i} d={d} p={seg(p, i * 0.06, i * 0.06 + 0.06)} color={color} width={sw} />)}
      <ChalkPath d={rim} p={seg(p, 0.18, 0.42)} color={color} width={sw} />
      <ChalkPath d={left} p={seg(p, 0.42, 0.6)} color={color} width={sw} />
      <ChalkPath d={right} p={seg(p, 0.6, 0.78)} color={color} width={sw} />
      <ChalkPath d={band1} p={seg(p, 0.78, 0.87)} color={color} width={sw * 0.7} opacity={0.8} />
      <ChalkPath d={band2} p={seg(p, 0.87, 0.95)} color={color} width={sw * 0.7} opacity={0.8} />
      <ChalkPath d={tip} p={seg(p, 0.95, 1)} color={color} width={sw} />
    </g>
  );
};

export default {viewBox: '0 0 300 420', component: Spinner} satisfies DrawingDef;
