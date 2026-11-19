import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig, Easing} from 'remotion';
import {CameraPush} from '../components/effects';
import {Typewriter} from '../components/Typewriter';
import {Office} from '../drawings/Office';
import {COLORS} from '../theme';
import {sceneData} from '../timeline';

/** 3. Inside: the office drawn in thin lines, lamp on. */
export const S3Office: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  const data = sceneData('office');
  const draw = interpolate(t, [0.3, 3.0], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.quad)});
  const lamp = interpolate(t, [2.2, 3.2], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const circle = interpolate(t, [7.5, 8.6], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.cubic)});
  return (
    <AbsoluteFill style={{backgroundColor: COLORS.bg}}>
      <CameraPush origin="50% 55%">
        <Office draw={draw} lamp={lamp} screen={lamp} redCircle={circle} />
      </CameraPush>
      <AbsoluteFill style={{left: 120, top: 905}}>
        {data.texts!.map((tx, i) => (
          <Typewriter key={i} text={tx.text.replace('\n', ' ')} at={tx.at} cps={tx.cps} size={46} />
        ))}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
