import React from 'react';
import {AbsoluteFill, random} from 'remotion';
import {useStyle} from '../theme';

/** Sfondo: lavagna verde con texture, aloni di gesso e vignettatura. Statico (nessuno sfarfallio). */
export const Chalkboard: React.FC = () => {
  const STYLE = useStyle();
  const smudges = new Array(9).fill(0).map((_, i) => ({
    cx: random(`sx${i}`) * 1080,
    cy: random(`sy${i}`) * 1920,
    rx: 220 + random(`sr${i}`) * 380,
    ry: 90 + random(`sq${i}`) * 200,
    rot: random(`st${i}`) * 50 - 25,
    o: 0.025 + random(`so${i}`) * 0.035,
  }));
  return (
    <AbsoluteFill style={{backgroundColor: STYLE.board}}>
      <svg width="100%" height="100%" viewBox="0 0 1080 1920" preserveAspectRatio="none">
        <defs>
          <radialGradient id="boardLight" cx="50%" cy="42%" r="75%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity={0.07} />
            <stop offset="60%" stopColor="#ffffff" stopOpacity={0.015} />
            <stop offset="100%" stopColor="#000000" stopOpacity={0.38} />
          </radialGradient>
          <filter id="boardGrain">
            <feTurbulence type="fractalNoise" baseFrequency="0.75" numOctaves="3" seed="2" />
            <feColorMatrix type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.11 0" />
          </filter>
          <filter id="boardBlotch">
            <feTurbulence type="fractalNoise" baseFrequency="0.004 0.009" numOctaves="3" seed="8" />
            <feColorMatrix type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.09 -0.02" />
          </filter>
          <filter id="smudgeBlur">
            <feGaussianBlur stdDeviation="45" />
          </filter>
        </defs>
        <rect width="1080" height="1920" filter="url(#boardBlotch)" />
        <g filter="url(#smudgeBlur)">
          {smudges.map((s, i) => (
            <ellipse key={i} cx={s.cx} cy={s.cy} rx={s.rx} ry={s.ry} fill="#ffffff" opacity={s.o} transform={`rotate(${s.rot} ${s.cx} ${s.cy})`} />
          ))}
        </g>
        <rect width="1080" height="1920" filter="url(#boardGrain)" />
        <rect width="1080" height="1920" fill="url(#boardLight)" />
      </svg>
    </AbsoluteFill>
  );
};
