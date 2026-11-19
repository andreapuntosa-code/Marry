import React from 'react';
import {interpolate, useCurrentFrame, useVideoConfig, Easing} from 'remotion';
import {COLORS, FONTS} from '../theme';
import {NOISE_URL} from './effects';

/** Rubber stamp that slams down at `at` seconds. Muted red ink with a worn texture. */
export const Stamp: React.FC<{text: string; at: number; rotate?: number; size?: number}> = ({
  text,
  at,
  rotate = -9,
  size = 52,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps - at;
  if (t < 0) return null;
  const s = interpolate(t, [0, 0.12], [2.1, 1], {extrapolateRight: 'clamp', easing: Easing.in(Easing.quad)});
  const o = interpolate(t, [0, 0.08], [0, 0.88], {extrapolateRight: 'clamp'});
  return (
    <div
      style={{
        transform: `rotate(${rotate}deg) scale(${s})`,
        opacity: o,
        color: COLORS.red,
        border: `5px solid ${COLORS.red}`,
        outline: `2px solid ${COLORS.red}`,
        outlineOffset: 5,
        padding: '6px 22px 2px',
        position: 'relative',
        fontFamily: FONTS.mono,
        fontSize: size,
        letterSpacing: '0.12em',
        mixBlendMode: 'multiply',
      }}
    >
      {text}
      {/* worn ink: light noise lifts patches of the red */}
      <div style={{position: 'absolute', inset: -12, backgroundImage: NOISE_URL, backgroundSize: '180px 180px', mixBlendMode: 'lighten', opacity: 0.4}} />
    </div>
  );
};
