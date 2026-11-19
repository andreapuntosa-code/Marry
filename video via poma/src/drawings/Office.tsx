import React from 'react';
import {useCurrentFrame} from 'remotion';
import {COLORS, FONTS} from '../theme';

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));

/**
 * Minimal line-art office: desk, terminal, typewriter, desk lamp, empty chair,
 * filing cabinet, a window with blinds and a wall calendar (August 1990).
 *
 * draw:     0..1 progress of the hand-drawn reveal
 * lamp:     0..1 lamp intensity (flicker / off)
 * screen:   0..1 terminal brightness
 * redCircle 0..1 progress of the red circle around the 7th on the calendar
 * dim:      0..1 overall line brightness
 */
export const Office: React.FC<{draw?: number; lamp?: number; screen?: number; redCircle?: number; dim?: number}> = ({
  draw = 1,
  lamp = 1,
  screen = 1,
  redCircle = 0,
  dim = 1,
}) => {
  const frame = useCurrentFrame();
  const t = frame / 30;
  let idx = 0;
  const TOTAL = 34;
  // each stroked element reveals in turn
  const L = (d: string, extra: React.SVGProps<SVGPathElement> = {}) => {
    const i = idx++;
    const p = clamp01((draw * (TOTAL + 6) - i) / 6);
    return (
      <path
        key={i}
        d={d}
        pathLength={1}
        strokeDasharray={1}
        strokeDashoffset={1 - p}
        fill="none"
        stroke={COLORS.blueGrey}
        strokeWidth={2.2}
        strokeLinecap="round"
        strokeLinejoin="round"
        {...extra}
      />
    );
  };
  const fadeIn = clamp01(draw * 1.4 - 0.4);

  // calendar: August 1990 starts on a Wednesday (Monday-first grid)
  const cal = {x: 214, y: 196, w: 172, h: 206};
  const cellW = cal.w / 7;
  const cellH = 28;
  const days: React.ReactNode[] = [];
  for (let d = 1; d <= 31; d++) {
    const pos = d + 1; // Monday = 0, Aug 1 = Wednesday (2)
    const col = pos % 7;
    const row = Math.floor(pos / 7);
    days.push(
      <text
        key={d}
        x={cal.x + col * cellW + cellW / 2}
        y={cal.y + 62 + row * cellH}
        textAnchor="middle"
        fontFamily={FONTS.mono}
        fontSize={13}
        fill={COLORS.blueGrey}
        opacity={fadeIn}
      >
        {d}
      </text>,
    );
  }
  const seven = {x: cal.x + (8 % 7) * cellW + cellW / 2, y: cal.y + 57 + Math.floor(8 / 7) * cellH};

  const lampHead = {x: 948, y: 404};
  const screenLines = [0.9, 0.62, 0.78, 0.4, 0.7, 0.55];

  return (
    <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{opacity: dim}}>
      <defs>
        <radialGradient id="deskPool" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor={COLORS.amber} stopOpacity={0.55} />
          <stop offset="0.5" stopColor={COLORS.amber} stopOpacity={0.16} />
          <stop offset="1" stopColor={COLORS.amber} stopOpacity={0} />
        </radialGradient>
        <radialGradient id="roomGlow" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor={COLORS.amber} stopOpacity={0.14} />
          <stop offset="1" stopColor={COLORS.amber} stopOpacity={0} />
        </radialGradient>
        <linearGradient id="beam" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={COLORS.amberSoft} stopOpacity={0.3} />
          <stop offset="1" stopColor={COLORS.amber} stopOpacity={0.04} />
        </linearGradient>
        <radialGradient id="crt" cx="0.5" cy="0.5" r="0.6">
          <stop offset="0" stopColor="#3a2408" />
          <stop offset="1" stopColor="#120c05" />
        </radialGradient>
        <clipPath id="blinds">
          <rect x={1182} y={182} width={376} height={376} />
        </clipPath>
      </defs>

      {/* lamp light on the room */}
      <ellipse cx={960} cy={560} rx={760} ry={420} fill="url(#roomGlow)" opacity={lamp} />

      {/* room structure */}
      {L('M140 60 L140 860 L1780 860 L1780 60')}
      {L('M140 860 L0 1080 M1780 860 L1920 1080')}
      {L('M140 820 L1780 820', {strokeWidth: 1.4, opacity: 0.6})}

      {/* window with venetian blinds; street light leaks through the slats */}
      {L('M1180 180 L1560 180 L1560 560 L1180 560 Z')}
      {L('M1370 180 L1370 560', {strokeWidth: 1.6})}
      {L('M1166 566 L1574 566', {strokeWidth: 3})}
      <g clipPath="url(#blinds)" opacity={fadeIn}>
        {new Array(15).fill(0).map((_, k) => (
          <g key={k}>
            <line x1={1180} x2={1560} y1={190 + k * 18} y2={190 + k * 18} stroke={COLORS.blueGrey} strokeWidth={1.3} opacity={0.75} />
            <line
              x1={1180}
              x2={1560}
              y1={197 + k * 18}
              y2={197 + k * 18}
              stroke={COLORS.amber}
              strokeWidth={3}
              opacity={0.08 + 0.05 * Math.sin(k * 1.7)}
            />
          </g>
        ))}
      </g>
      {/* slatted light on the floor */}
      <g opacity={fadeIn * 0.5}>
        {new Array(6).fill(0).map((_, k) => (
          <path key={k} d={`M${1230 + k * 34} 870 L${1262 + k * 34} 870 L${1300 + k * 48} 1000 L${1262 + k * 48} 1000 Z`} fill={COLORS.amber} opacity={0.05} />
        ))}
      </g>

      {/* wall calendar */}
      {L(`M${cal.x} ${cal.y} L${cal.x + cal.w} ${cal.y} L${cal.x + cal.w} ${cal.y + cal.h} L${cal.x} ${cal.y + cal.h} Z`)}
      {L(`M${cal.x + cal.w / 2 - 8} ${cal.y - 14} L${cal.x + cal.w / 2} ${cal.y - 22} L${cal.x + cal.w / 2 + 8} ${cal.y - 14}`, {strokeWidth: 1.4})}
      <text x={cal.x + cal.w / 2} y={cal.y + 30} textAnchor="middle" fontFamily={FONTS.mono} fontSize={18} fill={COLORS.ink} opacity={fadeIn * 0.85}>
        AGOSTO 1990
      </text>
      {days}
      {redCircle > 0 ? (
        <ellipse
          cx={seven.x}
          cy={seven.y - 4}
          rx={16}
          ry={13}
          fill="none"
          stroke={COLORS.red}
          strokeWidth={2.4}
          pathLength={1}
          strokeDasharray={1}
          strokeDashoffset={1 - redCircle}
          transform={`rotate(-12 ${seven.x} ${seven.y - 4})`}
        />
      ) : null}

      {/* filing cabinet + telephone */}
      {L('M200 470 L400 470 L400 860 L200 860 Z')}
      {L('M200 567 L400 567 M200 664 L400 664 M200 761 L400 761', {strokeWidth: 1.6})}
      {L('M280 515 L320 515 M280 612 L320 612 M280 709 L320 709 M280 806 L320 806', {strokeWidth: 3})}
      {L('M240 470 L246 440 L354 440 L360 470')}
      {L('M236 436 Q240 414 262 416 L338 416 Q360 414 364 436', {strokeWidth: 3})}

      {/* desk */}
      {L('M560 600 L1380 600 L1420 640 L520 640 Z')}
      {L('M520 640 L520 656 L1420 656 L1420 640')}
      {L('M540 656 L540 860 M760 656 L760 860 M540 724 L760 724 M540 792 L760 792')}
      {L('M630 690 L670 690 M630 758 L670 758 M630 826 L670 826', {strokeWidth: 3})}
      {L('M1396 656 L1396 860 M1370 656 L1370 860', {strokeWidth: 1.8})}

      {/* desk lamp light pool */}
      <ellipse cx={932} cy={624} rx={300} ry={46} fill="url(#deskPool)" opacity={lamp} />
      <path d={`M${lampHead.x - 40} ${lampHead.y + 22} L${lampHead.x + 42} ${lampHead.y + 10} L1150 626 L720 626 Z`} fill="url(#beam)" opacity={lamp * 0.8} />

      {/* terminal */}
      {L('M596 382 L864 382 Q876 382 876 394 L876 588 Q876 600 864 600 L596 600 Q584 600 584 588 L584 394 Q584 382 596 382 Z')}
      <rect x={618} y={402} width={224} height={160} rx={14} fill="url(#crt)" opacity={fadeIn * (0.25 + 0.75 * screen)} />
      {L('M618 416 Q618 402 632 402 L828 402 Q842 402 842 416 L842 548 Q842 562 828 562 L632 562 Q618 562 618 548 Z', {strokeWidth: 1.8})}
      <g opacity={fadeIn * screen}>
        {screenLines.map((w, k) => (
          <rect key={k} x={638} y={420 + k * 20} width={184 * w} height={8} fill={COLORS.amber} opacity={0.55} />
        ))}
        {Math.floor(t * 2) % 2 === 0 ? <rect x={638} y={540} width={12} height={10} fill={COLORS.amberSoft} opacity={0.9} /> : null}
      </g>
      {L('M690 600 L670 626 L790 626 L770 600', {strokeWidth: 1.8})}
      {L('M612 630 L860 630 L872 640 L600 640 Z', {strokeWidth: 1.6})}

      {/* typewriter */}
      {L('M1090 560 L1310 560 L1330 626 L1070 626 Z')}
      {L('M1100 548 L1300 548 Q1312 548 1312 560 M1100 548 Q1088 548 1088 560', {strokeWidth: 3})}
      {L('M1134 548 L1134 470 L1266 470 L1266 548', {strokeWidth: 1.6})}
      {L('M1150 492 L1240 492 M1150 506 L1226 506 M1150 520 L1250 520', {strokeWidth: 1, opacity: 0.6})}
      <g opacity={fadeIn}>
        {[0, 1, 2].map((r) =>
          new Array(10 - r).fill(0).map((_, k) => (
            <circle key={`${r}-${k}`} cx={1104 + r * 10 + k * 21} cy={584 + r * 13} r={5} fill="none" stroke={COLORS.blueGrey} strokeWidth={1.4} />
          )),
        )}
      </g>

      {/* desk lamp */}
      {L('M960 600 Q990 584 1020 600 Z', {strokeWidth: 2.6})}
      {L('M990 590 L1032 470 L960 412', {strokeWidth: 2.6})}
      {L(`M${lampHead.x - 46} ${lampHead.y + 26} L${lampHead.x - 4} ${lampHead.y - 28} L${lampHead.x + 30} ${lampHead.y - 18} L${lampHead.x + 44} ${lampHead.y + 12} Z`, {strokeWidth: 2.6})}
      <circle cx={1032} cy={470} r={6} fill="none" stroke={COLORS.blueGrey} strokeWidth={2} opacity={fadeIn} />
      <ellipse cx={lampHead.x} cy={lampHead.y + 18} rx={30} ry={8} fill={COLORS.amberSoft} opacity={lamp * 0.95} transform={`rotate(-14 ${lampHead.x} ${lampHead.y + 18})`} />

      {/* empty chair, pushed back from the desk */}
      {L('M1468 548 Q1468 534 1482 534 L1598 534 Q1612 534 1612 548 L1606 690 L1474 690 Z')}
      {L('M1452 700 L1628 700 L1618 724 L1462 724 Z')}
      {L('M1540 724 L1540 810 M1540 810 L1470 850 M1540 810 L1610 850 M1540 810 L1540 858 M1540 810 L1500 860 M1540 810 L1580 860')}
      {L('M1474 690 L1482 700 M1606 690 L1598 700', {strokeWidth: 1.6})}
      {L('M1420 760 L1452 712 M1660 760 L1628 712', {strokeWidth: 1.2, opacity: 0.5})}
    </svg>
  );
};
