import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {CameraPush} from '../components/effects';
import {Typewriter} from '../components/Typewriter';
import {Office} from '../drawings/Office';
import {COLORS} from '../theme';
import {sceneData} from '../timeline';

/** 4. The lamp flickers and goes out. Text on black. */
export const S4LightsOut: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  const data = sceneData<{flickerOff: number[][]; lampOutAt: number}>('lightsOut');
  const off = data.flickerOff.some(([a, b]) => t >= a && t < b) || t >= data.lampOutAt;
  const lamp = off ? 0 : 1;
  const roomDim = interpolate(t, [data.lampOutAt, data.lampOutAt + 1.2], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const lines = 0.35 + 0.65 * lamp;
  return (
    <AbsoluteFill style={{backgroundColor: COLORS.bg}}>
      <AbsoluteFill style={{opacity: roomDim}}>
        <CameraPush from={1.04} to={1.09} origin="50% 55%">
          <Office draw={1} lamp={lamp} screen={t >= data.lampOutAt ? 0.4 : 1} redCircle={1} dim={lines} />
        </CameraPush>
      </AbsoluteFill>
      <AbsoluteFill style={{left: 220, top: 330}}>
        {data.texts!.map((tx, i) => (
          <Typewriter key={i} text={tx.text} at={tx.at} cps={tx.cps} size={48} style={{marginBottom: 56}} color={i === 0 ? COLORS.ink : COLORS.inkDim} />
        ))}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
