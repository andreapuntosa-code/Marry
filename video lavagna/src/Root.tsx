import React from 'react';
import {Composition} from 'remotion';
import {Lavagna, SCENES, TIMELINE} from './Lavagna';
import './fonts';

export const RemotionRoot: React.FC = () => (
  <Composition
    id="Lavagna"
    component={Lavagna}
    durationInFrames={TIMELINE.totalFrames}
    fps={SCENES.video.fps}
    width={SCENES.video.width}
    height={SCENES.video.height}
  />
);
