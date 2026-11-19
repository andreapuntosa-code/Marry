import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig, Easing} from 'remotion';
import {CameraPush, NOISE_URL} from '../components/effects';
import {COLORS, FONTS} from '../theme';
import {sceneData} from '../timeline';

type Word = {text: string; at: number};
type BoardData = {hub: Word; words: Word[]; threadsAt: number; tightenAt: number; slackAt: number};

// card centres on the board (hub first, then the words in order)
const POS = [
  [960, 520],
  [430, 290],
  [1480, 280],
  [390, 770],
  [1490, 760],
  [960, 885],
];
const ROT = [1, -3, 2.5, 2, -2.5, -1];
// extra links between words (indices into POS)
const CROSS = [
  [1, 2],
  [3, 4],
  [5, 1],
];

const pinOf = (i: number) => ({x: POS[i][0], y: POS[i][1] - 34});

/** 6. Red-thread board: pins, words, threads that tighten and then go slack. */
export const S6ThreadBoard: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  const data = sceneData<BoardData>('threads');
  const items = [data.hub, ...data.words];

  const tight = interpolate(t, [data.tightenAt, data.tightenAt + 1.6], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.inOut(Easing.cubic),
  });
  const slack = interpolate(t, [data.slackAt, data.slackAt + 2.2], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.bounce),
  });
  const sag = 55 * (1 - tight) + 3 * tight + 150 * slack;

  const links = [...data.words.map((_, i) => [0, i + 1]), ...CROSS];

  return (
    <AbsoluteFill style={{backgroundColor: '#0d0b09'}}>
      <CameraPush origin="50% 50%">
        {/* cork board */}
        <AbsoluteFill style={{left: 60, top: 50, right: 60, bottom: 50, background: '#1b1510', boxShadow: 'inset 0 0 120px rgba(0,0,0,0.9)', border: '18px solid #0a0807'}} />
        <AbsoluteFill style={{left: 78, top: 68, right: 78, bottom: 68, backgroundImage: NOISE_URL, opacity: 0.12, mixBlendMode: 'screen'}} />
        <AbsoluteFill style={{background: 'radial-gradient(ellipse 55% 60% at 50% 40%, rgba(232,163,61,0.13), rgba(0,0,0,0) 70%)'}} />

        {/* notes */}
        {items.map((w, i) => {
          const a = interpolate(t, [w.at, w.at + 0.25], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
          if (a <= 0) return null;
          const s = 1.12 - 0.12 * a;
          const hub = i === 0;
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: POS[i][0],
                top: POS[i][1],
                transform: `translate(-50%, -50%) rotate(${ROT[i]}deg) scale(${s})`,
                opacity: a,
                background: hub ? COLORS.paper : '#cfc8b6',
                padding: hub ? '34px 44px 26px' : '30px 36px 22px',
                fontFamily: FONTS.mono,
                fontSize: hub ? 46 : 40,
                color: '#2a251e',
                whiteSpace: 'nowrap',
                boxShadow: '0 10px 24px rgba(0,0,0,0.6)',
              }}
            >
              {w.text}
            </div>
          );
        })}

        {/* threads */}
        <svg width={1920} height={1080} style={{position: 'absolute'}}>
          {links.map(([a, b], k) => {
            const pa = pinOf(a);
            const pb = pinOf(b);
            const start = data.threadsAt + k * 0.18;
            const p = interpolate(t, [start, start + 1.1], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.quad)});
            if (p <= 0) return null;
            const len = Math.hypot(pb.x - pa.x, pb.y - pa.y);
            const s = sag * (0.5 + len / 1400) * (k % 2 ? 1.1 : 0.9);
            const d = `M${pa.x} ${pa.y} Q${(pa.x + pb.x) / 2} ${(pa.y + pb.y) / 2 + s} ${pb.x} ${pb.y}`;
            return (
              <g key={k}>
                <path d={d} transform="translate(4 7)" fill="none" stroke="#000" strokeOpacity={0.45} strokeWidth={3} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - p} />
                <path d={d} fill="none" stroke={COLORS.red} strokeWidth={2.8} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - p} />
              </g>
            );
          })}
          {/* brass pins */}
          {items.map((w, i) => {
            if (t < w.at) return null;
            const p = pinOf(i);
            return (
              <g key={i}>
                <circle cx={p.x + 3} cy={p.y + 5} r={10} fill="#000" opacity={0.5} />
                <circle cx={p.x} cy={p.y} r={10} fill={COLORS.amberDeep} />
                <circle cx={p.x - 3} cy={p.y - 3} r={4} fill={COLORS.amberSoft} opacity={0.8} />
              </g>
            );
          })}
        </svg>
      </CameraPush>
    </AbsoluteFill>
  );
};
