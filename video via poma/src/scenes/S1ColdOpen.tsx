import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig, Easing} from 'remotion';
import {CameraPush} from '../components/effects';
import {Typewriter} from '../components/Typewriter';
import {COLORS} from '../theme';
import {sceneData} from '../timeline';

/** 1. Cold open: black screen, a ticking second hand, the date typed out. */
export const S1ColdOpen: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const data = sceneData('coldOpen');
  const t = frame / fps;
  // the hand jumps once per second, with a tiny overshoot
  const sec = Math.floor(t);
  const f = t - sec;
  const jump = f < 0.12 ? Easing.out(Easing.back(3))(f / 0.12) : 1;
  const angle = (sec - 1 + jump) * 6;
  const clockIn = interpolate(t, [0.2, 1.4], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const R = 150;
  const C = {x: 960, y: 410};
  return (
    <AbsoluteFill style={{backgroundColor: COLORS.bg}}>
      <CameraPush origin="50% 45%">
        <svg width={1920} height={1080} style={{opacity: clockIn}}>
          <circle cx={C.x} cy={C.y} r={R} fill="none" stroke={COLORS.blueGreyDim} strokeWidth={2} />
          {new Array(60).fill(0).map((_, i) => {
            const a = (i * 6 * Math.PI) / 180;
            const long = i % 5 === 0;
            const r0 = R - (long ? 18 : 8);
            return (
              <line
                key={i}
                x1={C.x + Math.sin(a) * r0}
                y1={C.y - Math.cos(a) * r0}
                x2={C.x + Math.sin(a) * (R - 3)}
                y2={C.y - Math.cos(a) * (R - 3)}
                stroke={long ? COLORS.blueGrey : COLORS.blueGreyDim}
                strokeWidth={long ? 2.4 : 1.4}
              />
            );
          })}
          <g transform={`rotate(${angle} ${C.x} ${C.y})`}>
            <line x1={C.x} y1={C.y + 26} x2={C.x} y2={C.y - R + 22} stroke={COLORS.amber} strokeWidth={2} />
            <circle cx={C.x} cy={C.y + 18} r={5} fill="none" stroke={COLORS.amber} strokeWidth={1.6} />
          </g>
          <circle cx={C.x} cy={C.y} r={5} fill={COLORS.amber} />
        </svg>
      </CameraPush>
      {data.texts!.map((tx, i) => (
        <AbsoluteFill key={i} style={{top: 690, alignItems: 'center'}}>
          <Typewriter text={tx.text} at={tx.at} cps={tx.cps} size={58} />
        </AbsoluteFill>
      ))}
    </AbsoluteFill>
  );
};
