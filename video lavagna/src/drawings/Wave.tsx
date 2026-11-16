import React from 'react';
import {random} from 'remotion';
import {ChalkPath} from './ChalkPath';
import {ease, handLine, polyline, seg, type Pt} from './sketch';
import type {DrawingDef, DrawingProps} from './types';

/**
 * Onda (funzione d'onda). Nella seconda fase ("then") collassa in un solo picco.
 * props.axis = true disegna anche l'asse orizzontale.
 */
const Wave: React.FC<DrawingProps> = ({p, p2, color, accent, sw, seed, props}) => {
  const k = ease(p2);
  const pts: Pt[] = [];
  for (let x = 30; x <= 670; x += 5) {
    const env = Math.sin(((x - 30) / 640) * Math.PI); // inviluppo: l'onda nasce e muore dolcemente
    const wave = 130 - 85 * env * Math.sin(((x - 30) / 640) * Math.PI * 7);
    const peak = 205 - 180 * Math.exp(-Math.pow((x - 350) / 26, 2));
    const wob = (random(`${seed}-${x}`) - 0.5) * 2.2;
    pts.push([x, wave * (1 - k) + peak * k + wob]);
  }
  const axis = handLine([20, 208], [680, 208], seed + 'ax', 3);
  const strokeColor = k > 0.5 ? accent : color;
  return (
    <g>
      {Boolean(props.axis) && <ChalkPath d={axis} p={seg(p, 0, 0.3)} color={color} width={sw * 0.6} opacity={0.7} />}
      <ChalkPath d={polyline(pts)} p={props.axis ? seg(p, 0.3, 1) : p} color={strokeColor} width={sw} />
    </g>
  );
};

export default {viewBox: '0 0 700 240', component: Wave} satisfies DrawingDef;
