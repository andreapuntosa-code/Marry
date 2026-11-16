import React from 'react';
import {interpolateColors} from 'remotion';
import {ChalkPath} from './ChalkPath';
import {handLine, jitter, seg, smooth} from './sketch';
import type {DrawingDef, DrawingProps} from './types';

/**
 * Lampadina. Si accende nella seconda fase (campo "then"), oppure subito con props.lit = true.
 */
const LightBulb: React.FC<DrawingProps> = ({p, p2, color, accent, sw, seed, props}) => {
  const lit = props.lit ? seg(p, 0.75, 1) : p2;
  const glass = smooth(
    jitter(
      [[115, 292], [104, 252], [70, 205], [58, 150], [80, 88], [150, 56], [220, 88], [242, 150], [230, 205], [196, 252], [185, 292]],
      seed + 'g',
      3,
    ),
  );
  const base = [
    handLine([112, 296], [188, 296], seed + 'b1', 1.5),
    handLine([112, 318], [188, 318], seed + 'b2', 1.5),
    handLine([116, 340], [184, 340], seed + 'b3', 1.5),
    handLine([126, 362], [174, 362], seed + 'b4', 1.5),
    handLine([140, 380], [160, 380], seed + 'b5', 1),
  ];
  const filament = smooth([[132, 292], [134, 230], [138, 200], [146, 182], [152, 204], [160, 182], [166, 200], [168, 230], [168, 292]]);
  const rayAngles = [180, 208, 238, 270, 302, 332, 0];
  const rays = rayAngles.map((a, i) => {
    const rad = (a * Math.PI) / 180;
    return handLine([150 + Math.cos(rad) * 140, 160 + Math.sin(rad) * 140], [150 + Math.cos(rad) * 190, 160 + Math.sin(rad) * 190], seed + 'r' + i, 2);
  });
  const fil = interpolateColors(lit, [0, 1], [color, accent]);
  const drawP = props.lit ? seg(p, 0, 0.75) : p;
  return (
    <g>
      {lit > 0 && <circle cx={150} cy={160} r={175} fill="url(#bulbGlow)" opacity={lit} />}
      <defs>
        <radialGradient id="bulbGlow">
          <stop offset="0%" stopColor={accent} stopOpacity={0.45} />
          <stop offset="55%" stopColor={accent} stopOpacity={0.12} />
          <stop offset="100%" stopColor={accent} stopOpacity={0} />
        </radialGradient>
      </defs>
      <ChalkPath d={glass} p={seg(drawP, 0, 0.5)} color={color} width={sw} />
      {base.map((d, i) => <ChalkPath key={i} d={d} p={seg(drawP, 0.5 + i * 0.06, 0.56 + i * 0.06)} color={color} width={sw} />)}
      <ChalkPath d={filament} p={seg(drawP, 0.82, 1)} color={fil} width={sw * 0.7} />
      {rays.map((d, i) => <ChalkPath key={i} d={d} p={seg(lit, i * 0.08, i * 0.08 + 0.4)} color={accent} width={sw} />)}
    </g>
  );
};

export default {viewBox: '-50 -45 400 440', component: LightBulb} satisfies DrawingDef;
