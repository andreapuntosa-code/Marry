import React from 'react';
import {AbsoluteFill, Html5Audio, Sequence, staticFile} from 'remotion';
import scenesJson from '../scenes.json';
import {ChalkDefs} from './components/ChalkDefs';
import {ChalkDrawing} from './components/ChalkDrawing';
import {ChalkText} from './components/ChalkText';
import {Chalkboard} from './components/Chalkboard';
import {EraseTransition} from './components/EraseTransition';
import {Subtitles} from './components/Subtitles';
import timingsJson from './generated/timings.json';
import {buildTimeline, type BuiltScene} from './timeline';
import type {ScenesFile, TimingsFile} from './types';

export const SCENES = scenesJson as ScenesFile;
export const TIMELINE = buildTimeline(SCENES, timingsJson as TimingsFile);

const SceneView: React.FC<{scene: BuiltScene}> = ({scene}) => (
  <>
    <Html5Audio src={staticFile(scene.audio)} />
    <EraseTransition startFrame={scene.eraseFrom} durationSeconds={SCENES.timing.erase}>
      {scene.actions.map((a, i) =>
        a.type === 'text' ? (
          <ChalkText key={i} text={a.text} startFrame={a.startFrame} outFrame={a.outFrame} x={a.x} y={a.y} size={a.size} color={a.color} cps={a.cps} rotate={a.rotate} font={a.font} />
        ) : (
          <ChalkDrawing
            key={i}
            drawing={a.drawing}
            startFrame={a.startFrame}
            duration={a.duration}
            thenFrame={a.thenFrame}
            thenDuration={a.thenDuration}
            outFrame={a.outFrame}
            x={a.x}
            y={a.y}
            width={a.width}
            height={a.height}
            color={a.color}
            rotate={a.rotate}
            props={a.props}
          />
        ),
      )}
    </EraseTransition>
  </>
);

export const Lavagna: React.FC = () => (
  <AbsoluteFill>
    <Chalkboard />
    <ChalkDefs />
    {TIMELINE.scenes.map((s) => (
      <Sequence key={s.id} from={s.from} durationInFrames={s.durationInFrames} name={s.id} layout="none">
        <SceneView scene={s} />
      </Sequence>
    ))}
    <Subtitles words={TIMELINE.words} />
    {TIMELINE.warnings.length > 0 && (
      <div style={{position: 'absolute', top: 30, left: 30, right: 30, background: '#b3261e', color: 'white', fontSize: 34, padding: 20, borderRadius: 12, fontFamily: 'sans-serif', whiteSpace: 'pre-line'}}>
        {TIMELINE.warnings.join('\n')}
      </div>
    )}
  </AbsoluteFill>
);
