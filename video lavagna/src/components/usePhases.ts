import {Easing, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';

const opts = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.quad)} as const;

/**
 * Avanzamenti 0..1 di un disegno/oggetto 3D:
 *  p    = tracciamento (da startFrame per `duration` secondi)
 *  p2   = seconda fase (campo "then")
 *  cues = una fase per ogni parola di "cues"
 *  t    = secondi trascorsi da startFrame (per movimenti continui)
 */
export const usePhases = (o: {
  startFrame: number;
  duration?: number;
  thenFrame?: number | null;
  thenDuration?: number;
  cueFrames?: number[];
  cueDuration?: number;
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const {startFrame, duration = 1.2, thenFrame = null, thenDuration = 0.8, cueFrames = [], cueDuration = 0.8} = o;
  const p = interpolate(frame, [startFrame, startFrame + duration * fps], [0, 1], opts);
  const p2 = thenFrame === null ? 0 : interpolate(frame, [thenFrame, thenFrame + thenDuration * fps], [0, 1], opts);
  const cues = cueFrames.map((c) => interpolate(frame, [c, c + cueDuration * fps], [0, 1], opts));
  return {p, p2, cues, t: (frame - startFrame) / fps, visible: frame >= startFrame};
};
