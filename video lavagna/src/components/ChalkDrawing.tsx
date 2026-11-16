import React from 'react';
import {DRAWINGS} from '../drawings';
import {FONTS} from '../fonts';
import {chalkColor, useStyle} from '../theme';
import type {ChalkColor} from '../types';
import {usePhases} from './usePhases';
import {useOut} from './useOut';

export type ChalkDrawingProps = {
  drawing: string;
  startFrame: number;
  /** secondi per tracciarlo */
  duration?: number;
  thenFrame?: number | null;
  thenDuration?: number;
  cueFrames?: number[];
  cueDuration?: number;
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
  outFrame = null,
  x,
  y,
  width,
  height,
  color,
  rotate = 0,
  props = {},
  strokePx = 7,
  ...timing
}) => {
  const style = useStyle();
  const {p, p2, cues, t, visible} = usePhases(timing);
  const out = useOut(outFrame);
  const def = DRAWINGS[drawing];
  if (!def) throw new Error(`Disegno "${drawing}" non registrato in src/drawings/index.ts`);
  if (!visible || out.hidden) return null;

  const viewBox = typeof def.viewBox === 'function' ? def.viewBox(props) : def.viewBox;
  const [, , vw, vh] = viewBox.split(/\s+/).map(Number);
  const scale = Math.min(width / vw, height / vh);
  const Comp = def.component;
  const colors = {chalk: style.chalk, accent: style.accent, ...(style.palette ?? {})};

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
      <Comp
        p={p}
        p2={p2}
        cues={cues}
        t={t}
        color={chalkColor(style, color)}
        accent={style.accent}
        colors={colors}
        font={FONTS[style.font]}
        sw={strokePx / scale}
        seed={`${drawing}-${x}-${y}`}
        props={props}
      />
    </svg>
  );
};
