import React from 'react';
import {ChalkPath} from './ChalkPath';
import {smooth} from './sketch';
import type {DrawingDef, DrawingProps} from './types';

/** Segno di spunta ✓ */
const Check: React.FC<DrawingProps> = ({p, color, sw}) => (
  <ChalkPath d={smooth([[14, 70], [40, 100], [58, 116], [90, 60], [126, 12]])} p={p} color={color} width={sw * 1.4} />
);

export default {viewBox: '0 0 140 130', component: Check} satisfies DrawingDef;
