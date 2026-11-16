import React, {useMemo} from 'react';
import {AbsoluteFill, Html5Audio, Sequence, staticFile} from 'remotion';
import {Chalk3D} from './components/Chalk3D';
import {ChalkDefs} from './components/ChalkDefs';
import {ChalkDrawing} from './components/ChalkDrawing';
import {ChalkText} from './components/ChalkText';
import {Chalkboard} from './components/Chalkboard';
import {EraseTransition} from './components/EraseTransition';
import {Subtitles} from './components/Subtitles';
import {DEFAULT_STYLE, StyleContext} from './theme';
import {buildTimeline, type BuiltScene, type ResolvedAction} from './timeline';
import type {ScenesFile, TimingsFile} from './types';

const ActionView: React.FC<{a: ResolvedAction}> = ({a}) => {
  if (a.type === 'text') {
    return <ChalkText text={a.text} startFrame={a.startFrame} outFrame={a.outFrame} x={a.x} y={a.y} size={a.size} color={a.color} cps={a.cps} rotate={a.rotate} font={a.font} />;
  }
  const timing = {
    startFrame: a.startFrame,
    duration: a.duration,
    thenFrame: a.thenFrame,
    thenDuration: a.thenDuration,
    cueFrames: a.cueFrames,
    cueDuration: a.cueDuration,
    outFrame: a.outFrame,
  };
  if (a.type === '3d') {
    return <Chalk3D model={a.model} {...timing} x={a.x} y={a.y} width={a.width} height={a.height} props={a.props} />;
  }
  return <ChalkDrawing drawing={a.drawing} {...timing} x={a.x} y={a.y} width={a.width} height={a.height} color={a.color} rotate={a.rotate} props={a.props} />;
};

const SceneView: React.FC<{scene: BuiltScene; erase: number}> = ({scene, erase}) => (
  <>
    <Html5Audio src={staticFile(scene.audio)} />
    <EraseTransition startFrame={scene.eraseFrom} durationSeconds={erase}>
      {scene.actions.map((a, i) => (
        <ActionView key={i} a={a} />
      ))}
    </EraseTransition>
  </>
);

export type LavagnaProps = {scenes: ScenesFile; timings: TimingsFile};

export const Lavagna: React.FC<LavagnaProps> = ({scenes, timings}) => {
  const timeline = useMemo(() => buildTimeline(scenes, timings), [scenes, timings]);
  return (
    <StyleContext.Provider value={{...DEFAULT_STYLE, ...scenes.style}}>
      <AbsoluteFill>
        <Chalkboard />
        <ChalkDefs />
        {timeline.scenes.map((s) => (
          <Sequence key={s.id} from={s.from} durationInFrames={s.durationInFrames} name={s.id} layout="none">
            <SceneView scene={s} erase={scenes.timing.erase} />
          </Sequence>
        ))}
        <Subtitles words={timeline.words} />
        {timeline.warnings.length > 0 && (
          <div style={{position: 'absolute', top: 30, left: 30, right: 30, background: '#b3261e', color: 'white', fontSize: 34, padding: 20, borderRadius: 12, fontFamily: 'sans-serif', whiteSpace: 'pre-line'}}>
            {timeline.warnings.join('\n')}
          </div>
        )}
      </AbsoluteFill>
    </StyleContext.Provider>
  );
};
