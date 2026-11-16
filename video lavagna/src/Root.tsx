import React from 'react';
import {Composition} from 'remotion';
import './fonts';
import {VIDEOS} from './generated';
import {Lavagna, type LavagnaProps} from './Lavagna';
import {buildTimeline} from './timeline';

/** Una composizione per ogni video in videos/ che ha già l'audio (npm run tts -- <video>). */
export const RemotionRoot: React.FC = () => (
  <>
    {VIDEOS.map((v) => (
      <Composition
        key={v.id}
        id={v.id}
        component={Lavagna as unknown as React.FC<Record<string, unknown>>}
        durationInFrames={buildTimeline(v.scenes, v.timings).totalFrames}
        fps={v.scenes.video.fps}
        width={v.scenes.video.width}
        height={v.scenes.video.height}
        defaultProps={{scenes: v.scenes, timings: v.timings} satisfies LavagnaProps}
      />
    ))}
  </>
);
