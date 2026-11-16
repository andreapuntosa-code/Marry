import React from 'react';
import {ChalkPath} from './ChalkPath';
import {handEllipse, handLine, jitter, seg, smooth} from './sketch';
import type {DrawingDef, DrawingProps} from './types';

const roundRect = (x: number, y: number, w: number, h: number, r: number, seed: string) =>
  smooth(
    jitter(
      [
        [x + r, y], [x + w / 2, y], [x + w - r, y], [x + w, y + r], [x + w, y + h / 2], [x + w, y + h - r],
        [x + w - r, y + h], [x + w / 2, y + h], [x + r, y + h], [x, y + h - r], [x, y + h / 2], [x, y + r], [x + r + 6, y - 1],
      ],
      seed,
      2.5,
    ),
  );

/** Chip quantistico stilizzato. */
const Chip: React.FC<DrawingProps> = ({p, color, accent, sw, seed}) => {
  const body = roundRect(70, 70, 180, 180, 18, seed + 'body');
  const pins: string[] = [];
  [0, 1, 2, 3].forEach((i) => {
    const o = 100 + i * 40;
    pins.push(handLine([o, 68], [o, 30], seed + 't' + i, 1));
    pins.push(handLine([o, 252], [o, 290], seed + 'b' + i, 1));
    pins.push(handLine([68, o], [30, o], seed + 'l' + i, 1));
    pins.push(handLine([252, o], [290, o], seed + 'r' + i, 1));
  });
  const ring = handEllipse(160, 160, 46, 46, seed + 'ring');
  const orbit = handEllipse(160, 160, 46, 14, seed + 'orb', {start: 0});
  const vec = handLine([160, 160], [186, 122], seed + 'v', 1);
  return (
    <g>
      <ChalkPath d={body} p={seg(p, 0, 0.3)} color={color} width={sw} />
      {pins.map((d, i) => <ChalkPath key={i} d={d} p={seg(p, 0.3 + i * 0.022, 0.33 + i * 0.022)} color={color} width={sw * 0.8} />)}
      <ChalkPath d={ring} p={seg(p, 0.68, 0.84)} color={accent} width={sw * 0.8} />
      <ChalkPath d={orbit} p={seg(p, 0.84, 0.93)} color={accent} width={sw * 0.6} opacity={0.8} />
      <ChalkPath d={vec} p={seg(p, 0.93, 1)} color={accent} width={sw * 0.8} />
    </g>
  );
};

export default {viewBox: '0 0 320 320', component: Chip} satisfies DrawingDef;
