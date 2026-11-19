import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig, Easing} from 'remotion';
import {CameraPush, NOISE_URL} from '../components/effects';
import {Redacted} from '../components/Redacted';
import {Stamp} from '../components/Stamp';
import {COLORS, FONTS} from '../theme';
import {sceneData} from '../timeline';

type Suspect = {label: string; stamp: string; at: number; stampAt: number};
type CaseData = {openAt: number; sheet: string[][]; redact: {line: number; at: number}[]; suspects: Suspect[]};

const FOLDER_W = 760;
const FOLDER_H = 560;

const Silhouette: React.FC = () => (
  <svg width={250} height={210} viewBox="0 0 250 210">
    <rect width={250} height={210} fill="#1e2126" />
    {/* height marks on the side: just a neutral photo frame */}
    {[30, 70, 110, 150, 190].map((y) => (
      <line key={y} x1={0} x2={14} y1={y} y2={y} stroke="#2e333b" strokeWidth={2} />
    ))}
    <circle cx={125} cy={86} r={40} fill="#353a43" />
    <path d="M42 210 Q46 140 125 134 Q204 140 208 210 Z" fill="#353a43" />
    <text x={125} y={100} textAnchor="middle" fontFamily={FONTS.serif} fontSize={46} fill="#1e2126">
      ?
    </text>
  </svg>
);

const Card: React.FC<{s: Suspect; index: number; x: number; rot: number}> = ({s, index, x, rot}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps - s.at;
  if (t < 0) return null;
  const p = interpolate(t, [0, 0.7], [0, 1], {extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});
  const y = (1 - p) * 760;
  const r = rot + (1 - p) * 10;
  return (
    <div
      style={{
        position: 'absolute',
        left: x - 165,
        top: 300 + y,
        width: 330,
        height: 450,
        background: '#d3ccbb',
        transform: `rotate(${r}deg)`,
        boxShadow: '0 18px 40px rgba(0,0,0,0.65)',
        padding: 40,
        boxSizing: 'border-box',
      }}
    >
      <div style={{fontFamily: FONTS.mono, fontSize: 18, color: '#5a5245', marginBottom: 10}}>SUBJECT {index + 1}</div>
      <Silhouette />
      <div style={{fontFamily: FONTS.mono, fontSize: 27, color: '#26221d', marginTop: 16, lineHeight: 1.2, textTransform: 'uppercase'}}>
        {s.label}
      </div>
      <div style={{position: 'absolute', left: 0, right: 0, top: 334, display: 'flex', justifyContent: 'center'}}>
        <Stamp text={s.stamp} at={s.stampAt - s.at} rotate={index === 1 ? 7 : -9} size={s.stamp.length > 8 ? 40 : 46} />
      </div>
    </div>
  );
};

/** 5. Case file: the folder opens, three anonymous cards, three stamps. */
export const S5CaseFile: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  const data = sceneData<CaseData>('caseFile');
  const open = interpolate(t, [data.openAt, data.openAt + 1.4], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.inOut(Easing.cubic),
  });
  const shiftX = (1 - open) * -FOLDER_W / 2;

  return (
    <AbsoluteFill style={{backgroundColor: '#100e0d'}}>
      <CameraPush>
        {/* desk surface + lamp pool */}
        <AbsoluteFill style={{background: 'radial-gradient(ellipse 60% 70% at 40% 35%, rgba(232,163,61,0.16), rgba(0,0,0,0) 70%)'}} />
        <AbsoluteFill style={{backgroundImage: NOISE_URL, opacity: 0.05, mixBlendMode: 'screen'}} />
        <svg width={1920} height={1080} style={{position: 'absolute'}}>
          <circle cx={1650} cy={880} r={70} fill="none" stroke="#2a211a" strokeWidth={6} opacity={0.6} />
          <circle cx={1652} cy={884} r={64} fill="none" stroke="#1c1712" strokeWidth={3} opacity={0.5} />
        </svg>

        {/* folder */}
        <div
          style={{
            position: 'absolute',
            left: 960 + shiftX,
            top: 260,
            width: FOLDER_W,
            height: FOLDER_H,
            perspective: 2400,
            transformStyle: 'preserve-3d',
          }}
        >
          {/* back of the folder (inside right) */}
          <div style={{position: 'absolute', inset: 0, background: COLORS.paperDark, boxShadow: '0 30px 60px rgba(0,0,0,0.7)'}}>
            <div
              style={{
                position: 'absolute',
                left: 40,
                top: 34,
                width: 660,
                height: 480,
                background: COLORS.sheet,
                transform: 'rotate(0.8deg)',
                padding: '40px 48px',
                boxSizing: 'border-box',
                fontFamily: FONTS.mono,
                color: '#29251f',
                boxShadow: '0 4px 10px rgba(0,0,0,0.25)',
              }}
            >
              {data.sheet.map(([k, v], i) => {
                const red = data.redact.find((r) => r.line === i);
                return (
                  <div key={i} style={{fontSize: i === 0 ? 34 : 25, marginBottom: i === 0 ? 22 : 12, letterSpacing: i === 0 ? '0.2em' : 0}}>
                    <span style={{display: 'inline-block', width: i === 0 ? 'auto' : 200}}>{k}</span>
                    {red ? <Redacted at={red.at}>{v}</Redacted> : <span>{v}</span>}
                  </div>
                );
              })}
            </div>
            {/* paper clip */}
            <svg width={60} height={120} style={{position: 'absolute', left: 560, top: 6}}>
              <path d="M20 10 L20 90 Q20 108 34 108 Q48 108 48 90 L48 22 Q48 12 40 12 Q32 12 32 22 L32 80" fill="none" stroke="#8a8a86" strokeWidth={3} />
            </svg>
          </div>
          {/* cover: rotates around the left edge (the spine) */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              transformOrigin: '0% 50%',
              transform: `rotateY(${-180 * open}deg)`,
              transformStyle: 'preserve-3d',
            }}
          >
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: COLORS.paper,
                backfaceVisibility: 'hidden',
                padding: 60,
                boxSizing: 'border-box',
                fontFamily: FONTS.mono,
                color: '#3b3226',
              }}
            >
              <div style={{position: 'absolute', right: -2, top: -40, width: 260, height: 44, background: COLORS.paper, borderRadius: '10px 10px 0 0'}} />
              <div style={{fontSize: 30, letterSpacing: '0.25em', marginTop: 140, textAlign: 'center'}}>CASE FILE</div>
              <div style={{fontSize: 46, textAlign: 'center', marginTop: 24}}>VIA POMA &mdash; 1990</div>
              <div style={{width: 420, height: 2, background: '#7a6a50', margin: '30px auto'}} />
            </div>
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: '#b9a77f',
                transform: 'rotateY(180deg)',
                backfaceVisibility: 'hidden',
              }}
            />
          </div>
        </div>

        {data.suspects.map((s, i) => (
          <Card key={i} s={s} index={i} x={[560, 960, 1360][i]} rot={[-4, 2, -2][i]} />
        ))}
      </CameraPush>
    </AbsoluteFill>
  );
};
