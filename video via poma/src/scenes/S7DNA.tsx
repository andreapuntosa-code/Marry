import React from 'react';
import {AbsoluteFill, interpolate, random, useCurrentFrame, useVideoConfig, Easing} from 'remotion';
import {CameraPush} from '../components/effects';
import {Typewriter} from '../components/Typewriter';
import {COLORS, FONTS} from '../theme';
import {sceneData} from '../timeline';

/** 7. Modern lab: a thin-line DNA helix and seven profiles. */
export const S7DNA: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  const data = sceneData<{markersAt: number; markerStep: number}>('dna');
  const reveal = interpolate(t, [0.2, 1.8], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.quad)});

  const CX = 640;
  const Y0 = 110;
  const Y1 = 970;
  const A = 120;
  const k = (2 * Math.PI) / 320;
  const ph = t * 1.1;
  const yMax = Y0 + (Y1 - Y0) * reveal;
  const strand = (off: number) => {
    const segs: React.ReactNode[] = [];
    for (let y = Y0; y < yMax; y += 6) {
      const a1 = k * y + ph + off;
      const a2 = k * (y + 6) + ph + off;
      const depth = (Math.cos(a1) + 1) / 2;
      segs.push(
        <line
          key={`${off}-${y}`}
          x1={CX + A * Math.sin(a1)}
          y1={y}
          x2={CX + A * Math.sin(a2)}
          y2={y + 6}
          stroke={depth > 0.5 ? '#a9bccd' : COLORS.blueGrey}
          strokeWidth={1.2 + 1.4 * depth}
          opacity={0.25 + 0.7 * depth}
        />,
      );
    }
    return segs;
  };
  const rungs: React.ReactNode[] = [];
  for (let y = Y0 + 12; y < yMax; y += 24) {
    const a = k * y + ph;
    const x1 = CX + A * Math.sin(a);
    const x2 = CX + A * Math.sin(a + Math.PI);
    const depth = (Math.cos(a) + Math.cos(a + Math.PI) + 2) / 4;
    rungs.push(
      <g key={y} opacity={0.18 + 0.4 * Math.abs(Math.sin(a))}>
        <line x1={x1} y1={y} x2={x2} y2={y} stroke={COLORS.blueGrey} strokeWidth={1} />
        <circle cx={x1} cy={y} r={2.4} fill="#a9bccd" opacity={depth + 0.3} />
        <circle cx={x2} cy={y} r={2.4} fill="#a9bccd" opacity={depth + 0.3} />
      </g>,
    );
  }

  const texts = sceneData('dna').texts!;
  const doneAt = data.markersAt + 7 * data.markerStep + 0.4;

  return (
    <AbsoluteFill style={{backgroundColor: '#08090c'}}>
      <CameraPush origin="40% 50%">
        <svg width={1920} height={1080} style={{position: 'absolute'}}>
          {new Array(33).fill(0).map((_, i) => (
            <line key={`v${i}`} x1={i * 60} x2={i * 60} y1={0} y2={1080} stroke="#11151b" strokeWidth={1} />
          ))}
          {new Array(19).fill(0).map((_, i) => (
            <line key={`h${i}`} x1={0} x2={1920} y1={i * 60} y2={i * 60} stroke="#11151b" strokeWidth={1} />
          ))}
          {strand(0)}
          {strand(Math.PI)}
          {rungs}
        </svg>
        <div style={{position: 'absolute', left: 1000, top: 250, fontFamily: FONTS.mono, fontSize: 22, color: COLORS.inkDim, letterSpacing: '0.3em'}}>
          PROFILE COMPARISON
        </div>
        <div style={{position: 'absolute', left: 1000, top: 320, width: 820}}>
          <Typewriter text={texts[0].text} at={texts[0].at} cps={texts[0].cps} size={42} />
        </div>
        {/* seven profiles, checked one after another */}
        <div style={{position: 'absolute', left: 1000, top: 520, display: 'flex', gap: 18}}>
          {new Array(7).fill(0).map((_, i) => {
            const at = data.markersAt + i * data.markerStep;
            const on = t >= at;
            const active = on && t < doneAt;
            return (
              <div
                key={i}
                style={{
                  width: 92,
                  height: 118,
                  border: `1.5px solid ${active ? COLORS.amber : on ? '#3b4450' : '#1c2128'}`,
                  padding: 8,
                  boxSizing: 'border-box',
                  opacity: on ? 1 : 0.35,
                }}
              >
                <svg width={74} height={70}>
                  {new Array(12).fill(0).map((_, b) => (
                    <rect
                      key={b}
                      x={b * 6.2}
                      y={70 - 60 * random(`p${i}-${b}`)}
                      width={3.2}
                      height={60 * random(`p${i}-${b}`)}
                      fill={active ? COLORS.amber : COLORS.blueGrey}
                      opacity={on ? 0.8 : 0.3}
                    />
                  ))}
                </svg>
                <div style={{fontFamily: FONTS.mono, fontSize: 17, color: COLORS.inkDim, textAlign: 'center', marginTop: 4}}>
                  {String(i + 1).padStart(2, '0')}
                </div>
              </div>
            );
          })}
        </div>
        <div style={{position: 'absolute', left: 1000, top: 720}}>
          <Typewriter text={texts[1].text} at={texts[1].at} cps={texts[1].cps} size={64} />
        </div>
      </CameraPush>
    </AbsoluteFill>
  );
};
