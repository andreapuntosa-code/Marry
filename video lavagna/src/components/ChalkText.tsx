import React from 'react';
import {interpolate, random, useCurrentFrame, useVideoConfig} from 'remotion';
import {FONTS} from '../fonts';
import {STYLE, chalkColor} from '../theme';
import type {ChalkColor} from '../types';
import {useOut} from './useOut';

type Glyph = {ch: string; yellow: boolean};

/** "*parola*" → giallo. */
const parse = (text: string): Glyph[] => {
  const out: Glyph[] = [];
  let yellow = false;
  for (const ch of text) {
    if (ch === '*') {
      yellow = !yellow;
      continue;
    }
    out.push({ch, yellow});
  }
  return out;
};

const ARROWS: Record<string, number> = {'→': 0, '↓': 90, '←': 180, '↑': 270};

/** Le frecce non esistono nei font a mano: le disegniamo col gesso. */
const ArrowGlyph: React.FC<{dir: number; p: number; color: string}> = ({dir, p, color}) => {
  const len = 1;
  const style = {
    pathLength: len,
    strokeDasharray: '1 1',
    fill: 'none',
    stroke: color,
    strokeWidth: 9,
    strokeLinecap: 'round' as const,
  };
  return (
    <svg viewBox="0 0 100 100" style={{width: '0.62em', height: '0.62em', overflow: 'visible', verticalAlign: '-0.02em'}}>
      <g transform={`rotate(${dir} 50 50)`}>
        <path d="M10,52 C35,49 60,51 86,50" {...style} strokeDashoffset={1 - Math.min(1, p * 1.6)} />
        <path d="M88,50 L62,30 M88,50 L63,72" {...style} strokeDashoffset={1 - Math.max(0, p * 2.5 - 1.5)} />
      </g>
    </svg>
  );
};

export type ChalkTextProps = {
  text: string;
  /** frame (locale alla scena) in cui inizia a scriversi */
  startFrame: number;
  outFrame?: number | null;
  x: number;
  y: number;
  size?: number;
  color?: ChalkColor;
  /** caratteri al secondo */
  cps?: number;
  rotate?: number;
  font?: 'Caveat' | 'Gochi Hand';
};

/** Testo che si scrive lettera per lettera, con leggere imperfezioni da mano. */
export const ChalkText: React.FC<ChalkTextProps> = ({
  text,
  startFrame,
  outFrame = null,
  x,
  y,
  size = 100,
  color,
  cps = 14,
  rotate = 0,
  font,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const out = useOut(outFrame);
  if (frame < startFrame || out.hidden) return null;

  const glyphs = parse(text);
  const written = ((frame - startFrame) / fps) * cps;
  const seed = text;
  let idx = 0;
  const lines: Glyph[][] = [[]];
  for (const g of glyphs) {
    if (g.ch === '\n') lines.push([]);
    else lines[lines.length - 1].push(g);
  }

  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        transform: `translate(-50%, -50%) rotate(${rotate}deg)`,
        fontFamily: FONTS[font ?? STYLE.font],
        fontWeight: 700,
        fontSize: size,
        lineHeight: 1.05,
        textAlign: 'center',
        whiteSpace: 'pre',
        filter: `url(#chalk) ${out.filter}`,
        opacity: out.opacity,
        textShadow: '0 0 6px rgba(255,255,255,0.18)',
      }}
    >
      {lines.map((line, li) => (
        <div key={li}>
          {line.map((g) => {
            const i = idx++;
            const p = interpolate(written - i, [0, 1], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
            const c = g.yellow ? STYLE.accent : chalkColor(color);
            const dy = (random(`${seed}-y-${i}`) - 0.5) * size * 0.05;
            const rot = (random(`${seed}-r-${i}`) - 0.5) * 4;
            if (g.ch in ARROWS) {
              return (
                <span key={i} style={{display: 'inline-block', transform: `translateY(${dy}px)`}}>
                  <ArrowGlyph dir={ARROWS[g.ch]} p={p} color={c} />
                </span>
              );
            }
            return (
              <span
                key={i}
                style={{
                  display: 'inline-block',
                  color: c,
                  opacity: Math.min(1, p * 3),
                  clipPath: p >= 1 ? undefined : `inset(-0.5em calc(${(1 - p) * 100}% - ${p * 0.5}em) -0.5em -0.5em)`,
                  transform: `translateY(${dy}px) rotate(${rot}deg)`,
                }}
              >
                {g.ch === ' ' ? ' ' : g.ch}
              </span>
            );
          })}
        </div>
      ))}
    </div>
  );
};
