import React from 'react';
import {AbsoluteFill, interpolate, random, useCurrentFrame, useVideoConfig, Easing} from 'remotion';
import {COLORS} from '../theme';

const NOISE_SVG = `<svg xmlns='http://www.w3.org/2000/svg' width='320' height='320'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/><feColorMatrix type='saturate' values='0'/></filter><rect width='100%' height='100%' filter='url(#n)'/></svg>`;
export const NOISE_URL = `url("data:image/svg+xml,${encodeURIComponent(NOISE_SVG)}")`;

/** Film grain: one cached noise tile, jumped to a random offset every frame. */
export const Grain: React.FC<{opacity?: number}> = ({opacity = 0.09}) => {
  const frame = useCurrentFrame();
  const x = Math.floor(random(`gx${frame}`) * 320);
  const y = Math.floor(random(`gy${frame}`) * 320);
  return (
    <AbsoluteFill
      style={{
        backgroundImage: NOISE_URL,
        backgroundPosition: `${x}px ${y}px`,
        opacity,
        mixBlendMode: 'screen',
        pointerEvents: 'none',
      }}
    />
  );
};

export const Vignette: React.FC<{strength?: number}> = ({strength = 0.78}) => (
  <AbsoluteFill
    style={{
      background: `radial-gradient(ellipse 75% 70% at 50% 48%, rgba(0,0,0,0) 45%, rgba(0,0,0,${strength}) 100%)`,
      pointerEvents: 'none',
    }}
  />
);

/** Slow, irregular light flicker: a faint black veil whose opacity drifts. */
export const Flicker: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / 30;
  let o = 0.05 + 0.03 * Math.sin(t * 1.7) + 0.02 * Math.sin(t * 4.3 + 1.2);
  // occasional short dips, like a projector lamp
  const bucket = Math.floor(t * 3);
  if (random(`fl${bucket}`) > 0.94) o += 0.06;
  return <AbsoluteFill style={{backgroundColor: COLORS.black, opacity: Math.max(0, o), pointerEvents: 'none'}} />;
};

/** Drifting dust particles. */
export const Dust: React.FC<{count?: number; color?: string; seed?: string}> = ({
  count = 46,
  color = '#d9cbb0',
  seed = 'dust',
}) => {
  const frame = useCurrentFrame();
  const {width, height} = useVideoConfig();
  const t = frame / 30;
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      <svg width={width} height={height}>
        {new Array(count).fill(0).map((_, i) => {
          const r = (k: string) => random(`${seed}${i}${k}`);
          const sx = r('vx') * 14 - 5;
          const sy = r('vy') * 10 - 7;
          const x = ((r('x') * (width + 200) + sx * t + 20 * Math.sin(t * 0.4 + i)) % (width + 200)) - 100;
          const y = ((r('y') * (height + 200) + sy * t + 14 * Math.cos(t * 0.33 + i * 1.7) + 4000) % (height + 200)) - 100;
          const size = 0.8 + r('s') * 2.4;
          const tw = 0.5 + 0.5 * Math.sin(t * (0.6 + r('f')) + i);
          return <circle key={i} cx={x} cy={y} r={size} fill={color} opacity={(0.08 + r('o') * 0.28) * (0.4 + 0.6 * tw)} />;
        })}
      </svg>
    </AbsoluteFill>
  );
};

/** Slow camera push: scale 1.0 -> 1.08 across the scene. */
export const CameraPush: React.FC<{
  children: React.ReactNode;
  from?: number;
  to?: number;
  origin?: string;
}> = ({children, from = 1.0, to = 1.08, origin = '50% 50%'}) => {
  const frame = useCurrentFrame();
  const {durationInFrames} = useVideoConfig();
  const s = interpolate(frame, [0, durationInFrames], [from, to], {
    easing: Easing.inOut(Easing.quad),
    extrapolateRight: 'clamp',
  });
  return <AbsoluteFill style={{transform: `scale(${s})`, transformOrigin: origin}}>{children}</AbsoluteFill>;
};

/** Fade in from black and out to black at the scene edges. */
export const SceneFade: React.FC<{children: React.ReactNode; fade: number}> = ({children, fade}) => {
  const frame = useCurrentFrame();
  const {durationInFrames} = useVideoConfig();
  const o = Math.min(
    interpolate(frame, [0, fade], [0, 1], {extrapolateRight: 'clamp'}),
    interpolate(frame, [durationInFrames - fade, durationInFrames], [1, 0], {extrapolateLeft: 'clamp'}),
  );
  return <AbsoluteFill style={{opacity: o}}>{children}</AbsoluteFill>;
};
