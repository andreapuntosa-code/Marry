import React from 'react';
import {ChalkPath} from './ChalkPath';
import {handLine, seg} from './sketch';
import type {DrawingDef, DrawingProps} from './types';

type Dir = 'up' | 'down' | 'left' | 'right';
const vertical = (d: unknown) => d !== 'left' && d !== 'right';

/** Freccia. props.direction: up | down | left | right */
const Arrow: React.FC<DrawingProps> = ({p, color, sw, seed, props}) => {
  const dir = (props.direction as Dir) ?? 'right';
  // disegnata verso destra in un box 300x120, poi ruotata
  const shaft = handLine([20, 60], [272, 60], seed + 's', 6);
  const h1 = handLine([280, 60], [222, 26], seed + 'a', 2);
  const h2 = handLine([280, 60], [222, 96], seed + 'b', 2);
  const rot = {right: '', left: 'rotate(180 150 60)', up: 'translate(0,300) rotate(-90)', down: 'translate(120,0) rotate(90)'}[dir];
  return (
    <g transform={rot}>
      <ChalkPath d={shaft} p={seg(p, 0, 0.65)} color={color} width={sw} />
      <ChalkPath d={h1} p={seg(p, 0.65, 0.82)} color={color} width={sw} />
      <ChalkPath d={h2} p={seg(p, 0.82, 1)} color={color} width={sw} />
    </g>
  );
};

export default {
  viewBox: (props) => (vertical(props.direction) ? '0 0 120 300' : '0 0 300 120'),
  component: Arrow,
} satisfies DrawingDef;
