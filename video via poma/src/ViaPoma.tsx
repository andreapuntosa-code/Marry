import React from 'react';
import {AbsoluteFill, Html5Audio, Sequence, getStaticFiles, staticFile} from 'remotion';
import {Dust, Flicker, Grain, SceneFade, Vignette} from './components/effects';
import {S1ColdOpen} from './scenes/S1ColdOpen';
import {S2Building} from './scenes/S2Building';
import {S3Office} from './scenes/S3Office';
import {S4LightsOut} from './scenes/S4LightsOut';
import {S5CaseFile} from './scenes/S5CaseFile';
import {S6ThreadBoard} from './scenes/S6ThreadBoard';
import {S7DNA} from './scenes/S7DNA';
import {S8Finale} from './scenes/S8Finale';
import {COLORS} from './theme';
import {FADE, SCENES} from './timeline';

const COMPONENTS: Record<string, React.FC> = {
  coldOpen: S1ColdOpen,
  building: S2Building,
  office: S3Office,
  lightsOut: S4LightsOut,
  caseFile: S5CaseFile,
  threads: S6ThreadBoard,
  dna: S7DNA,
  finale: S8Finale,
};

const SOUNDTRACK = 'audio/soundtrack.wav';

export const ViaPoma: React.FC = () => {
  const hasAudio = getStaticFiles().some((f) => f.name === SOUNDTRACK);
  return (
    <AbsoluteFill style={{backgroundColor: COLORS.bg}}>
      {SCENES.map((s) => {
        const C = COMPONENTS[s.id];
        return (
          <Sequence key={s.id} from={s.from} durationInFrames={s.durationInFrames} name={s.id}>
            <SceneFade fade={FADE}>
              <C />
            </SceneFade>
          </Sequence>
        );
      })}
      <Dust />
      <Flicker />
      <Vignette />
      <Grain />
      {hasAudio ? <Html5Audio src={staticFile(SOUNDTRACK)} /> : null}
    </AbsoluteFill>
  );
};
