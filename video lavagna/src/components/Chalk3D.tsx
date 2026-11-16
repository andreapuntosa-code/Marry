import {ThreeCanvas} from '@remotion/three';
import React from 'react';
import {MODELS} from '../models3d';
import {useStyle} from '../theme';
import {usePhases} from './usePhases';
import {useOut} from './useOut';

export type Chalk3DProps = {
  model: string;
  startFrame: number;
  duration?: number;
  thenFrame?: number | null;
  thenDuration?: number;
  cueFrames?: number[];
  cueDuration?: number;
  outFrame?: number | null;
  x: number;
  y: number;
  width: number;
  height: number;
  props?: Record<string, unknown>;
};

/** Oggetto 3D (three.js) disegnato sulla lavagna, con la grana del gesso. */
export const Chalk3D: React.FC<Chalk3DProps> = ({model, outFrame = null, x, y, width, height, props = {}, ...timing}) => {
  const style = useStyle();
  const {p, p2, cues, t, visible} = usePhases(timing);
  const out = useOut(outFrame);
  const def = MODELS[model];
  if (!def) throw new Error(`Modello 3D "${model}" non registrato in src/models3d/index.ts`);
  if (!visible || out.hidden) return null;
  const Comp = def.component;
  const colors = {chalk: style.chalk, accent: style.accent, ...(style.palette ?? {})};
  return (
    <div
      style={{
        position: 'absolute',
        left: x - width / 2,
        top: y - height / 2,
        width,
        height,
        filter: `url(#chalk) ${out.filter}`,
        opacity: out.opacity,
      }}
    >
      <ThreeCanvas
        width={width}
        height={height}
        camera={{fov: def.fov ?? 35, near: 0.1, far: 100}}
        gl={{alpha: true, antialias: true, preserveDrawingBuffer: true}}
        onCreated={({gl}) => {
          gl.localClippingEnabled = true;
          gl.setClearColor(0x000000, 0);
        }}
      >
        <Comp p={p} p2={p2} cues={cues} t={t} colors={colors} width={width} height={height} props={props} />
      </ThreeCanvas>
    </div>
  );
};
