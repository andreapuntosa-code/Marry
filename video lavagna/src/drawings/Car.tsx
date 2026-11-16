import React from 'react';
import {ChalkPath} from './ChalkPath';
import {handEllipse, handLine, jitter, seg, smooth} from './sketch';
import type {DrawingDef, DrawingProps} from './types';

/** Icona: auto da corsa con linee di velocità. */
const Car: React.FC<DrawingProps> = ({p, color, colors, sw, seed}) => {
  const body = smooth(
    jitter([[40, 150], [36, 118], [80, 104], [120, 70], [190, 66], [230, 100], [290, 108], [300, 140], [292, 152]], seed + 'b', 2),
  );
  const bottom = handLine([40, 152], [292, 152], seed + 'bot', 2);
  const window = smooth(jitter([[128, 100], [140, 80], [186, 78], [210, 100], [128, 100]], seed + 'w', 1.5));
  const wheels = [handEllipse(95, 156, 26, 26, seed + 'w1'), handEllipse(240, 156, 26, 26, seed + 'w2')];
  const speed = [handLine([0, 100], [28, 100], seed + 's1', 1), handLine([-12, 125], [24, 125], seed + 's2', 1), handLine([0, 150], [28, 150], seed + 's3', 1)];
  const red = colors.pink ?? color;
  return (
    <g>
      <ChalkPath d={body} p={seg(p, 0, 0.45)} color={red} width={sw} />
      <ChalkPath d={bottom} p={seg(p, 0.45, 0.55)} color={red} width={sw} />
      <ChalkPath d={window} p={seg(p, 0.55, 0.68)} color={color} width={sw * 0.8} />
      {wheels.map((d, i) => <ChalkPath key={i} d={d} p={seg(p, 0.68 + i * 0.1, 0.78 + i * 0.1)} color={color} width={sw} />)}
      {speed.map((d, i) => <ChalkPath key={i} d={d} p={seg(p, 0.9 + i * 0.03, 0.93 + i * 0.03)} color={color} width={sw * 0.7} />)}
    </g>
  );
};

export default {viewBox: '-20 50 340 140', component: Car} satisfies DrawingDef;
