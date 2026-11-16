import React from 'react';
import {Easing, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {DRAWINGS} from '../drawings';
import {STYLE, chalkColor} from '../theme';
import type {ChalkColor} from '../types';
import {useOut} from './useOut';

export type ChalkDrawingProps = {
  drawing: string;
  startFrame: number;
  /** secondi per tracciarlo */
  duration?: number;
  thenFrame?: number | null;
  thenDuration?: number;
  outFrame?: number | null;
  x: number;
  y: number;
  width: number;
  height: number;
  color?: ChalkColor;
  rotate?: number;
  props?: Record<string, unknown>;
  /** spessore del tratto in pixel a schermo */
  strokePx?: number;
};

/** Mostra un disegno di /drawings tracciandolo con il gesso. */
export const ChalkDrawing: React.FC<ChalkDrawingProps> = ({
  drawing,
  startFrame,
  duration = 1.2,
  thenFrame = null,
  thenDuration = 0.8,
  outFrame = null,
  x,
  y,
  width,
  height,
  color,
  rotate = 0,
  props = {},
  strokePx = 7,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const out = useOut(outFrame);
  const def = DRAWINGS[drawing];
  if (!def) throw new Error(`Disegno "${drawing}" non registrato in src/drawings/index.ts`);
  if (frame < startFrame || out.hidden) return null;

  const opts = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.quad)} as const;
  const p = interpolate(frame, [startFrame, startFrame + duration * fps], [0, 1], opts);
  const p2 = thenFrame === null ? 0 : interpolate(frame, [thenFrame, thenFrame + thenDuration * fps], [0, 1], opts);

  const viewBox = typeof def.viewBox === 'function' ? def.viewBox(props) : def.viewBox;
  const [, , vw, vh] = viewBox.split(/\s+/).map(Number);
  const scale = Math.min(width / vw, height / vh);
  const Comp = def.component;

  return (
    <svg
      viewBox={viewBox}
      style={{
        position: 'absolute',
        left: x - width / 2,
        top: y - height / 2,
        width,
        height,
        overflow: 'visible',
        transform: rotate ? `rotate(${rotate}deg)` : undefined,
        filter: `url(#chalk) ${out.filter}`,
        opacity: out.opacity,
      }}
    >
      <Comp p={p} p2={p2} color={chalkColor(color)} accent={STYLE.accent} sw={strokePx / scale} seed={`${drawing}-${x}-${y}`} props={props} />
    </svg>
  );
};
