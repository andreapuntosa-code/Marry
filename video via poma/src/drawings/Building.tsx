import React from 'react';
import {random, useCurrentFrame} from 'remotion';
import {COLORS} from '../theme';

/**
 * Umbertine apartment block at night (Prati, Rome), frontal elevation.
 * mode 'night': street lamp on, a neighbour's TV flickering.
 * mode 'finale': every other light is off, only the amber office window remains.
 */
export const Building: React.FC<{mode?: 'night' | 'finale'; plaque?: string; windowGlow?: number}> = ({
  mode = 'night',
  plaque = 'VIA CARLO POMA',
  windowGlow = 1,
}) => {
  const frame = useCurrentFrame();
  const t = frame / 30;
  const night = mode === 'night';

  const X0 = 560;
  const X1 = 1480;
  const COLS = 7;
  const colW = (X1 - X0) / COLS;
  const cx = (i: number) => X0 + colW * (i + 0.5);
  const GROUND = 905;
  // floors: [top, bottom, window w, window h, pediment]
  const floors: [number, number, number, number, 'tri' | 'arc' | 'flat' | 'none'][] = [
    [640, 760, 62, 98, 'tri'],
    [520, 640, 60, 92, 'arc'],
    [400, 520, 60, 90, 'flat'],
    [282, 400, 58, 86, 'flat'],
    [178, 282, 54, 68, 'none'],
  ];
  const LIT = {floor: 2, col: 5};
  const lampFlicker = 0.93 + 0.05 * Math.sin(t * 9.1) + 0.03 * Math.sin(t * 23.3);
  const winFlicker = (0.96 + 0.03 * Math.sin(t * 3.1) + 0.02 * Math.sin(t * 11.7)) * windowGlow;
  const tv = 0.35 + 0.35 * random(`tv${Math.floor(t * 6)}`) + 0.15 * Math.sin(t * 13);

  const windows: React.ReactNode[] = [];
  floors.forEach(([top, bottom, w, h, ped], fi) => {
    for (let c = 0; c < COLS; c++) {
      const x = cx(c) - w / 2;
      const y = top + (bottom - top - h) / 2 + 6;
      const lit = fi === LIT.floor && c === LIT.col;
      // closed shutters on most windows: deterministic pattern
      const shutter = random(`sh${fi}-${c}`);
      const key = `w${fi}-${c}`;
      windows.push(
        <g key={key}>
          {/* frame */}
          <rect x={x - 8} y={y - 8} width={w + 16} height={h + 16} fill="none" stroke={COLORS.facadeLine} strokeWidth={3} />
          {lit ? (
            <>
              <rect x={x} y={y} width={w} height={h} fill="url(#litGlass)" opacity={winFlicker} />
              {new Array(14).fill(0).map((_, k) => (
                <line key={k} x1={x} x2={x + w} y1={y + 4 + k * 6.4} y2={y + 4 + k * 6.4} stroke="#6b3c10" strokeWidth={1.6} opacity={0.55} />
              ))}
              <line x1={x + w / 2} x2={x + w / 2} y1={y} y2={y + h} stroke="#3a220a" strokeWidth={2.5} />
            </>
          ) : shutter < 0.72 ? (
            <>
              <rect x={x} y={y} width={w} height={h} fill="#101217" />
              {new Array(Math.floor(h / 7)).fill(0).map((_, k) => (
                <line key={k} x1={x + 2} x2={x + w - 2} y1={y + 4 + k * 7} y2={y + 4 + k * 7} stroke="#1b1f26" strokeWidth={2} />
              ))}
              <line x1={x + w / 2} x2={x + w / 2} y1={y} y2={y + h} stroke="#0a0b0e" strokeWidth={2} />
            </>
          ) : (
            <>
              <rect x={x} y={y} width={w} height={h} fill="#07080b" />
              <line x1={x + w / 2} x2={x + w / 2} y1={y} y2={y + h} stroke="#15181e" strokeWidth={2} />
              <line x1={x} x2={x + w} y1={y + h * 0.38} y2={y + h * 0.38} stroke="#15181e" strokeWidth={2} />
            </>
          )}
          {/* sill */}
          <rect x={x - 14} y={y + h + 8} width={w + 28} height={7} fill={COLORS.facadeLine} />
          {/* pediments */}
          {ped === 'tri' ? (
            <path d={`M${x - 16} ${y - 12} L${x + w / 2} ${y - 40} L${x + w + 16} ${y - 12} Z`} fill="none" stroke={COLORS.facadeLine} strokeWidth={4} />
          ) : ped === 'arc' ? (
            <path d={`M${x - 16} ${y - 12} Q${x + w / 2} ${y - 46} ${x + w + 16} ${y - 12}`} fill="none" stroke={COLORS.facadeLine} strokeWidth={4} />
          ) : ped === 'flat' ? (
            <rect x={x - 16} y={y - 20} width={w + 32} height={7} fill={COLORS.facadeLine} />
          ) : null}
        </g>,
      );
    }
  });

  const lit = {x: cx(LIT.col), y: (floors[LIT.floor][0] + floors[LIT.floor][1]) / 2 + 6};

  return (
    <svg width={1920} height={1080} viewBox="0 0 1920 1080">
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#090b10" />
          <stop offset="0.7" stopColor="#12161d" />
          <stop offset="1" stopColor={night ? '#1d1b1c' : '#141519'} />
        </linearGradient>
        <linearGradient id="litGlass" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={COLORS.amberSoft} />
          <stop offset="1" stopColor={COLORS.amber} />
        </linearGradient>
        <radialGradient id="winGlow">
          <stop offset="0" stopColor={COLORS.amber} stopOpacity={0.42} />
          <stop offset="0.4" stopColor={COLORS.amber} stopOpacity={0.12} />
          <stop offset="1" stopColor={COLORS.amber} stopOpacity={0} />
        </radialGradient>
        <linearGradient id="cone" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={COLORS.amber} stopOpacity={0.28} />
          <stop offset="1" stopColor={COLORS.amber} stopOpacity={0.02} />
        </linearGradient>
        <radialGradient id="pool">
          <stop offset="0" stopColor={COLORS.amber} stopOpacity={0.3} />
          <stop offset="1" stopColor={COLORS.amber} stopOpacity={0} />
        </radialGradient>
        <radialGradient id="lampHalo">
          <stop offset="0" stopColor={COLORS.amberSoft} stopOpacity={0.7} />
          <stop offset="0.25" stopColor={COLORS.amber} stopOpacity={0.18} />
          <stop offset="1" stopColor={COLORS.amber} stopOpacity={0} />
        </radialGradient>
        <linearGradient id="facadeShade" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#000" stopOpacity={0.35} />
          <stop offset="0.5" stopColor="#000" stopOpacity={0} />
          <stop offset="1" stopColor={night ? COLORS.amber : '#000'} stopOpacity={night ? 0.05 : 0.25} />
        </linearGradient>
      </defs>

      <rect width={1920} height={1080} fill="url(#sky)" />
      {/* distant dome on the skyline */}
      <g fill="#0f1218">
        <path d="M150 300 Q150 175 262 160 Q374 175 374 300 Z" />
        <rect x={240} y={118} width={44} height={46} />
        <path d="M250 118 Q262 92 274 118 Z" />
        <rect x={120} y={290} width={290} height={40} />
      </g>

      {/* neighbouring buildings */}
      <rect x={-10} y={262} width={572} height={GROUND - 262} fill="#0d0f13" />
      <rect x={-10} y={250} width={572} height={14} fill="#121519" />
      <rect x={1478} y={232} width={452} height={GROUND - 232} fill="#0e1014" />
      <rect x={1478} y={220} width={452} height={14} fill="#13161b" />
      {[0, 1, 2, 3, 4].map((r) =>
        [0, 1, 2, 3].map((c) => (
          <rect key={`l${r}${c}`} x={60 + c * 125} y={320 + r * 115} width={46} height={74} fill="#090a0d" />
        )),
      )}
      {[0, 1, 2, 3, 4].map((r) =>
        [0, 1, 2].map((c) => (
          <rect key={`r${r}${c}`} x={1545 + c * 130} y={300 + r * 118} width={50} height={78} fill="#0a0b0e" />
        )),
      )}
      {night ? <rect x={185} y={435} width={46} height={74} fill="#5f7896" opacity={tv * 0.3} /> : null}

      {/* main facade */}
      <rect x={X0} y={150} width={X1 - X0} height={GROUND - 150} fill={COLORS.facade} />
      {/* cornice + parapet */}
      <rect x={X0 - 18} y={148} width={X1 - X0 + 36} height={22} fill="#1c2027" />
      {new Array(46).fill(0).map((_, i) => (
        <rect key={i} x={X0 - 10 + i * 20.4} y={170} width={9} height={9} fill="#1c2027" />
      ))}
      <rect x={X0 - 6} y={122} width={X1 - X0 + 12} height={26} fill="#171a20" />
      {/* string courses between floors */}
      {floors.map(([, bottom], i) => (
        <rect key={i} x={X0 - 8} y={bottom - 4} width={X1 - X0 + 16} height={8} fill="#1d2129" />
      ))}
      {/* corner quoins */}
      {new Array(18).fill(0).map((_, i) => (
        <g key={i} fill="#1a1d24">
          <rect x={X0} y={180 + i * 32} width={i % 2 ? 26 : 40} height={28} />
          <rect x={X1 - (i % 2 ? 26 : 40)} y={180 + i * 32} width={i % 2 ? 26 : 40} height={28} />
        </g>
      ))}
      {windows}
      {/* balcony on the piano nobile */}
      <rect x={cx(2) - 50} y={758} width={cx(4) - cx(2) + 100} height={10} fill="#20242c" />
      {new Array(23).fill(0).map((_, i) => (
        <rect key={i} x={cx(2) - 44 + i * ((cx(4) - cx(2) + 88) / 22)} y={724} width={4} height={34} fill="#1b1f26" />
      ))}
      <rect x={cx(2) - 50} y={720} width={cx(4) - cx(2) + 100} height={5} fill="#1d2129" />

      {/* rusticated ground floor */}
      <rect x={X0} y={770} width={X1 - X0} height={GROUND - 770} fill="#13161b" />
      {new Array(7).fill(0).map((_, i) => (
        <line key={i} x1={X0} x2={X1} y1={785 + i * 18} y2={785 + i * 18} stroke="#0c0e12" strokeWidth={3} />
      ))}
      {/* portone */}
      <path
        d={`M${cx(3) - 62} ${GROUND} L${cx(3) - 62} 820 Q${cx(3)} 760 ${cx(3) + 62} 820 L${cx(3) + 62} ${GROUND} Z`}
        fill="#08090b"
        stroke="#1f232b"
        strokeWidth={5}
      />
      <line x1={cx(3)} x2={cx(3)} y1={800} y2={GROUND} stroke="#121419" strokeWidth={3} />
      {[1, 5].map((c) => (
        <g key={c}>
          <rect x={cx(c) - 24} y={808} width={48} height={60} fill="#08090b" />
          {[0, 1, 2, 3, 4].map((k) => (
            <line key={k} x1={cx(c) - 18 + k * 9} x2={cx(c) - 18 + k * 9} y1={808} y2={868} stroke="#1e2229" strokeWidth={3} />
          ))}
        </g>
      ))}
      {/* marble street plaque */}
      <rect x={1094} y={800} width={152} height={40} rx={3} fill={night ? '#57544f' : '#3a3936'} />
      <rect x={1099} y={805} width={142} height={30} rx={2} fill="none" stroke={night ? '#3e3c38' : '#2a2927'} strokeWidth={1.5} />
      <text
        x={1170}
        y={826}
        textAnchor="middle"
        fontFamily="'Cormorant Garamond', serif"
        fontSize={14.5}
        fontWeight={500}
        letterSpacing={1}
        fill="#1b1a19"
      >
        {plaque}
      </text>
      <rect x={X0} y={150} width={X1 - X0} height={GROUND - 150} fill="url(#facadeShade)" />

      {/* the lit office window glow */}
      <circle cx={lit.x} cy={lit.y} r={220} fill="url(#winGlow)" opacity={winFlicker} />

      {/* street */}
      <rect x={0} y={GROUND} width={1920} height={32} fill="#111317" />
      <rect x={0} y={GROUND + 30} width={1920} height={1080 - GROUND - 30} fill="#0a0b0e" />
      <line x1={0} x2={1920} y1={GROUND + 31} y2={GROUND + 31} stroke="#1a1d22" strokeWidth={3} />

      {/* plane tree on the left */}
      <g fill="#08090c">
        <path d="M296 905 L304 640 L318 640 L326 905 Z" />
        {[
          [250, 560, 110],
          [350, 520, 120],
          [190, 640, 90],
          [420, 610, 95],
          [300, 650, 100],
          [130, 560, 70],
        ].map(([x, y, r], i) => (
          <circle key={i} cx={x} cy={y} r={r} />
        ))}
      </g>

      {/* parked car */}
      <g>
        <path
          d="M1150 1002 L1150 968 Q1152 952 1170 950 L1196 948 L1222 916 Q1228 908 1240 908 L1330 908 Q1342 908 1348 918 L1366 948 L1392 952 Q1406 956 1406 972 L1406 1002 Z"
          fill="#0c0d10"
        />
        <path d="M1232 946 L1252 916 L1290 916 L1290 946 Z M1300 946 L1300 916 L1336 916 L1354 946 Z" fill="#14171c" />
        {night ? <path d="M1240 908 L1330 908 Q1342 908 1348 918" fill="none" stroke={COLORS.amber} strokeWidth={2} opacity={0.35 * lampFlicker} /> : null}
        <circle cx={1190} cy={1004} r={18} fill="#050506" />
        <circle cx={1366} cy={1004} r={18} fill="#050506" />
      </g>

      {/* sodium street lamp */}
      <g>
        <rect x={1652} y={300} width={9} height={GROUND - 300} fill="#0b0c0f" />
        <path d="M1656 304 Q1640 270 1590 278" fill="none" stroke="#0b0c0f" strokeWidth={8} />
        <path d="M1566 278 L1614 278 L1606 296 L1574 296 Z" fill={night ? '#3c2a14' : '#111215'} />
        {night ? (
          <>
            <path d="M1574 296 L1606 296 L1880 1080 L1290 1080 Z" fill="url(#cone)" opacity={lampFlicker} />
            <ellipse cx={1590} cy={GROUND + 60} rx={330} ry={70} fill="url(#pool)" opacity={lampFlicker} />
            <circle cx={1590} cy={298} r={120} fill="url(#lampHalo)" opacity={lampFlicker} />
            <rect x={1576} y={294} width={28} height={4} fill={COLORS.amberSoft} opacity={lampFlicker} />
          </>
        ) : null}
      </g>
    </svg>
  );
};
