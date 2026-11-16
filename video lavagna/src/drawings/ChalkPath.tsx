import React from 'react';

/**
 * Un tratto di gesso che si "traccia" con stroke-dashoffset.
 * p = avanzamento 0..1. Disegna due passate sovrapposte per un aspetto più materico.
 */
export const ChalkPath: React.FC<{d: string; p: number; color: string; width: number; opacity?: number}> = ({
  d,
  p,
  color,
  width,
  opacity = 1,
}) => {
  if (p <= 0.001) return null;
  const common = {
    d,
    pathLength: 1,
    strokeDasharray: '1 1',
    strokeDashoffset: 1 - p,
    fill: 'none',
    stroke: color,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };
  return (
    <g opacity={opacity}>
      <path {...common} strokeWidth={width} opacity={0.9} />
      <path {...common} strokeWidth={width * 0.45} opacity={0.5} transform={`translate(${width * 0.25},${-width * 0.2})`} />
    </g>
  );
};
