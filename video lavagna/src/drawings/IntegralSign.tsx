import React from 'react';
import {ChalkPath} from './ChalkPath';
import {handEllipse, seg} from './sketch';
import type {DrawingDef, DrawingProps} from './types';

/** Il simbolo di integrale ∫ (una "S" allungata: somma). */
const IntegralSign: React.FC<DrawingProps> = ({p, color, sw, seed}) => {
  const body = 'M102,52 C100,20 70,10 60,40 C50,80 64,300 54,352 C46,392 18,392 14,362';
  const dotTop = handEllipse(104, 54, 5, 5, seed + 't', {n: 6});
  const dotBot = handEllipse(13, 360, 5, 5, seed + 'b', {n: 6});
  return (
    <g>
      <ChalkPath d={dotTop} p={seg(p, 0, 0.06)} color={color} width={sw * 2} />
      <ChalkPath d={body} p={seg(p, 0.04, 0.94)} color={color} width={sw * 1.9} />
      <ChalkPath d={dotBot} p={seg(p, 0.94, 1)} color={color} width={sw * 2} />
    </g>
  );
};

export default {viewBox: '0 0 120 410', component: IntegralSign} satisfies DrawingDef;
