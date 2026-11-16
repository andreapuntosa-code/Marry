import {interpolate, useCurrentFrame, useVideoConfig} from 'remotion';

/** Dissolvenza "passata col dito" per gli elementi con il campo "out". */
export const useOut = (outFrame: number | null) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  if (outFrame === null || frame < outFrame) return {opacity: 1, filter: '', hidden: false};
  const t = interpolate(frame, [outFrame, outFrame + fps * 0.45], [0, 1], {extrapolateRight: 'clamp'});
  return {opacity: 1 - t, filter: `blur(${t * 6}px)`, hidden: t >= 1};
};
