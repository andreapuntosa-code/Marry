import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {CameraPush} from '../components/effects';
import {Typewriter} from '../components/Typewriter';
import {Building} from '../drawings/Building';
import {COLORS, FONTS} from '../theme';
import {sceneData} from '../timeline';

/** 8. Back to the building: only the amber window is left. Final title. */
export const S8Finale: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  const data = sceneData<{title: string; titleAt: number; fadeOutAt: number}>('finale');
  const textOut = interpolate(t, [data.fadeOutAt, data.fadeOutAt + 0.7], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const windowOut = interpolate(t, [data.fadeOutAt + 0.3, data.duration - 0.2], [1, 0.15], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const letters = data.title.split('');
  return (
    <AbsoluteFill style={{backgroundColor: COLORS.bg}}>
      <CameraPush from={1.04} to={1.1} origin="66% 40%">
        <AbsoluteFill style={{filter: 'brightness(0.75)'}}>
          <Building mode="finale" windowGlow={windowOut} />
        </AbsoluteFill>
      </CameraPush>
      <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(5,5,7,0.78) 0%, rgba(5,5,7,0.35) 30%, rgba(5,5,7,0) 50%)'}} />
      <AbsoluteFill style={{top: 110, alignItems: 'center', opacity: textOut}}>
        <div style={{fontFamily: FONTS.serif, fontSize: 104, color: COLORS.ink, fontStyle: 'italic', letterSpacing: '0.01em'}}>
          {letters.map((ch, i) => {
            const a = interpolate(t, [data.titleAt + i * 0.05, data.titleAt + i * 0.05 + 0.6], [0, 1], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            });
            return (
              <span key={i} style={{opacity: a, whiteSpace: 'pre'}}>
                {ch}
              </span>
            );
          })}
        </div>
        <div style={{marginTop: 26}}>
          {data.texts!.map((tx, i) => (
            <Typewriter key={i} text={tx.text} at={tx.at} cps={tx.cps} size={38} color={COLORS.inkDim} />
          ))}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
