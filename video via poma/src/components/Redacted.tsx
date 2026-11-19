import React from 'react';
import {interpolate, useCurrentFrame, useVideoConfig, Easing} from 'remotion';

/** Black "redacted" bar that slides over its children starting at `at` seconds. */
export const Redacted: React.FC<{at: number; children: React.ReactNode; duration?: number}> = ({
  at,
  children,
  duration = 0.35,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const p = interpolate(frame / fps, [at, at + duration], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });
  return (
    <span style={{position: 'relative', display: 'inline-block'}}>
      {children}
      <span
        style={{
          position: 'absolute',
          left: -6,
          right: -6,
          top: '8%',
          bottom: '4%',
          background: '#060607',
          transform: `scaleX(${p})`,
          transformOrigin: 'left center',
          boxShadow: '0 0 1px rgba(0,0,0,0.9)',
        }}
      />
    </span>
  );
};
