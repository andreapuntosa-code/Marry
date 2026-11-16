import React from 'react';
import {AbsoluteFill, Easing, interpolate, random, useCurrentFrame, useVideoConfig} from 'remotion';

type Pt = [number, number];

const W = 1080;
const H = 1920;
const BRUSH = 430;
// Percorso a zig-zag del cancellino, dall'alto verso il basso
const PATH: Pt[] = [
  [-160, 120], [1240, 260], [-160, 560], [1240, 760], [-160, 1060], [1240, 1260], [-160, 1560], [1240, 1760], [-160, 2000],
];
const SEGS = PATH.slice(1).map((b, i) => Math.hypot(b[0] - PATH[i][0], b[1] - PATH[i][1]));
const TOTAL = SEGS.reduce((a, b) => a + b, 0);

const pointAt = (t: number): {pt: Pt; angle: number} => {
  let d = t * TOTAL;
  for (let i = 0; i < SEGS.length; i++) {
    if (d <= SEGS[i] || i === SEGS.length - 1) {
      const k = Math.min(1, d / SEGS[i]);
      const [a, b] = [PATH[i], PATH[i + 1]];
      return {pt: [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k], angle: (Math.atan2(b[1] - a[1], b[0] - a[0]) * 180) / Math.PI};
    }
    d -= SEGS[i];
  }
  return {pt: PATH[PATH.length - 1], angle: 0};
};

const pathD = PATH.map(([x, y], i) => `${i ? 'L' : 'M'}${x},${y}`).join(' ');

/** Maschera (data-URL SVG) che toglie il contenuto dove è già passato il cancellino. */
const maskUrl = (t: number) => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><defs><filter id="r"><feTurbulence type="fractalNoise" baseFrequency="0.02" numOctaves="2" seed="3"/><feDisplacementMap in="SourceGraphic" scale="70"/></filter><mask id="m"><rect width="${W}" height="${H}" fill="white"/><path d="${pathD}" pathLength="1" stroke-dasharray="1 1" stroke-dashoffset="${1 - t}" fill="none" stroke="black" stroke-width="${BRUSH}" stroke-linecap="round" stroke-linejoin="round" filter="url(#r)"/></mask></defs><rect width="${W}" height="${H}" fill="white" mask="url(#m)"/></svg>`;
  return `url("data:image/svg+xml;utf8,${encodeURIComponent(svg)}")`;
};

/** Cancellino da lavagna (legno + feltro). */
const Eraser: React.FC<{x: number; y: number; angle: number}> = ({x, y, angle}) => (
  <div
    style={{
      position: 'absolute',
      left: x - 170,
      top: y - 70,
      width: 340,
      height: 140,
      transform: `rotate(${angle * 0.25 - 8}deg)`,
      filter: 'drop-shadow(0 18px 18px rgba(0,0,0,0.45))',
    }}
  >
    <div style={{position: 'absolute', inset: '0 0 46px 0', borderRadius: 18, background: 'linear-gradient(180deg,#c99a63,#9c6b3a)', boxShadow: 'inset 0 4px 0 rgba(255,255,255,0.25)'}} />
    <div style={{position: 'absolute', left: 0, right: 0, bottom: 0, height: 52, borderRadius: '6px 6px 14px 14px', background: 'linear-gradient(180deg,#e9e6df,#b9b4aa)'}} />
  </div>
);

/**
 * Avvolge il contenuto di una scena e, da `startFrame`, lo cancella con il cancellino.
 * startFrame = null → nessuna cancellazione.
 */
export const EraseTransition: React.FC<{startFrame: number | null; durationSeconds?: number; children: React.ReactNode}> = ({
  startFrame,
  durationSeconds = 1,
  children,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  if (startFrame === null || frame < startFrame) return <AbsoluteFill>{children}</AbsoluteFill>;

  const t = interpolate(frame, [startFrame, startFrame + durationSeconds * fps], [0, 1], {
    extrapolateRight: 'clamp',
    easing: Easing.inOut(Easing.sin),
  });
  const {pt, angle} = pointAt(t);
  const haze = Math.sin(Math.PI * t) * 0.09;
  // polvere di gesso che resta dietro al cancellino
  const dust = new Array(26).fill(0).map((_, i) => {
    const back = random(`dust-t-${i}`) * 0.08;
    const q = pointAt(Math.max(0, t - back)).pt;
    return {
      x: q[0] + (random(`dust-x-${i}`) - 0.5) * BRUSH,
      y: q[1] + (random(`dust-y-${i}`) - 0.5) * 180 + back * 600,
      r: 2 + random(`dust-r-${i}`) * 5,
      o: (1 - back / 0.08) * 0.5,
    };
  });

  return (
    <AbsoluteFill>
      {t < 1 && (
        <AbsoluteFill style={{WebkitMaskImage: maskUrl(t), maskImage: maskUrl(t), WebkitMaskSize: '100% 100%', maskSize: '100% 100%'}}>
          {children}
        </AbsoluteFill>
      )}
      {/* alone lasciato dal cancellino */}
      <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
        <defs>
          <filter id="hazeBlur">
            <feGaussianBlur stdDeviation="40" />
          </filter>
        </defs>
        <path d={pathD} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - t} fill="none" stroke="#ffffff" strokeWidth={BRUSH * 0.8} strokeLinecap="round" opacity={haze} filter="url(#hazeBlur)" />
        {t < 1 && dust.map((d, i) => <circle key={i} cx={d.x} cy={d.y} r={d.r} fill="#f2f2f2" opacity={d.o} />)}
      </svg>
      {t < 1 && <Eraser x={pt[0]} y={pt[1]} angle={angle} />}
    </AbsoluteFill>
  );
};
