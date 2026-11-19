import React from 'react';
import {Composition} from 'remotion';
import {ViaPoma} from './ViaPoma';
import {FPS, TOTAL_FRAMES} from './timeline';
import './theme';

export const RemotionRoot: React.FC = () => (
  <Composition id="ViaPoma" component={ViaPoma} durationInFrames={TOTAL_FRAMES} fps={FPS} width={1920} height={1080} />
);
