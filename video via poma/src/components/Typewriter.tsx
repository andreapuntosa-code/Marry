import React from 'react';
import {useCurrentFrame, useVideoConfig} from 'remotion';
import {COLORS, FONTS} from '../theme';

/**
 * Text typed letter by letter (monospace). Untyped letters are kept invisible so the
 * layout never reflows. `at` is in seconds from the start of the scene.
 */
export const Typewriter: React.FC<{
  text: string;
  at: number;
  cps: number;
  size?: number;
  color?: string;
  font?: string;
  style?: React.CSSProperties;
  cursor?: boolean;
  lineHeight?: number;
}> = ({text, at, cps, size = 44, color = COLORS.ink, font = FONTS.mono, style, cursor = true, lineHeight = 1.45}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps - at;
  const n = Math.max(0, Math.min(text.length, Math.floor(t * cps)));
  const done = t * cps >= text.length;
  const blinkOn = Math.floor((frame / fps) * 2) % 2 === 0;
  const showCursor = cursor && t >= 0 && (!done || (t - text.length / cps < 1.6 && blinkOn));
  return (
    <div style={{fontFamily: font, fontSize: size, color, whiteSpace: 'pre-wrap', lineHeight, letterSpacing: '0.02em', ...style}}>
      <span>{text.slice(0, n)}</span>
      {showCursor ? (
        <span style={{display: 'inline-block', width: 0, position: 'relative'}}>
          <span
            style={{
              position: 'absolute',
              left: 2,
              top: '-0.82em',
              width: '0.5em',
              height: '0.95em',
              background: COLORS.amber,
              opacity: 0.85,
            }}
          />
        </span>
      ) : null}
      <span style={{opacity: 0}}>{text.slice(n)}</span>
    </div>
  );
};
