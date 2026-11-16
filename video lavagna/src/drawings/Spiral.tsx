import React from 'react';
import {ChalkPath} from './ChalkPath';
import {smooth, type Pt} from './sketch';
import type {DrawingDef, DrawingProps} from './types';

/** Spirale (trottola che gira, vista dall'alto). */
const Spiral: React.FC<DrawingProps> = ({p, color, sw}) => {
  const pts: Pt[] = [];
  const turns = 2.6;
  for (let i = 0; i <= 40; i++) {
    const t = i / 40;
    const a = t * turns * Math.PI * 2;
    const r = 4 + t * 58;
    pts.push([70 + Math.cos(a) * r, 70 + Math.sin(a) * r]);
  }
  return <ChalkPath d={smooth(pts)} p={p} color={color} width={sw} />;
};

export default {viewBox: '0 0 140 140', component: Spiral} satisfies DrawingDef;
