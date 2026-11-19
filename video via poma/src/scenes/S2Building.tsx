import React from 'react';
import {AbsoluteFill} from 'remotion';
import {CameraPush} from '../components/effects';
import {Typewriter} from '../components/Typewriter';
import {Building} from '../drawings/Building';
import {COLORS} from '../theme';
import {sceneData} from '../timeline';

/** 2. The building in Prati at night, one office window lit amber. */
export const S2Building: React.FC = () => {
  const data = sceneData<{plaque: string}>('building');
  return (
    <AbsoluteFill style={{backgroundColor: COLORS.bg}}>
      <CameraPush origin="66% 40%">
        <Building mode="night" plaque={data.plaque} />
      </CameraPush>
      <AbsoluteFill
        style={{
          background: 'linear-gradient(90deg, rgba(5,5,7,0.85) 0%, rgba(5,5,7,0.5) 30%, rgba(5,5,7,0) 48%)',
        }}
      />
      <AbsoluteFill style={{left: 110, top: 760}}>
        {data.texts!.map((tx, i) => (
          <Typewriter key={i} text={tx.text} at={tx.at} cps={tx.cps} size={i === 0 ? 50 : 40} color={i === 0 ? COLORS.ink : COLORS.inkDim} />
        ))}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
