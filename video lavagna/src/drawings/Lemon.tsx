import React from 'react';
import {ChalkPath} from './ChalkPath';
import {jitter, seg, smooth} from './sketch';
import type {DrawingDef, DrawingProps} from './types';

/** Icona: limone con foglia. */
const Lemon: React.FC<DrawingProps> = ({p, accent, colors, sw, seed}) => {
  const body = smooth(
    jitter([[20, 120], [50, 70], [150, 45], [250, 70], [282, 120], [250, 170], [150, 195], [50, 170], [20, 120], [10, 120]], seed, 2),
  );
  const leaf = smooth([[235, 62], [262, 22], [292, 18], [270, 52], [235, 62]]);
  const vein = smooth([[238, 60], [262, 38], [286, 22]]);
  const shine = smooth([[80, 85], [120, 72], [160, 70]]);
  const green = colors.green ?? accent;
  return (
    <g>
      <ChalkPath d={body} p={seg(p, 0, 0.6)} color={accent} width={sw} />
      <ChalkPath d={shine} p={seg(p, 0.6, 0.72)} color={accent} width={sw * 0.6} opacity={0.7} />
      <ChalkPath d={leaf} p={seg(p, 0.72, 0.92)} color={green} width={sw * 0.9} />
      <ChalkPath d={vein} p={seg(p, 0.92, 1)} color={green} width={sw * 0.6} />
    </g>
  );
};

export default {viewBox: '0 0 300 220', component: Lemon} satisfies DrawingDef;
