import React, {useMemo} from 'react';
import {useCurrentFrame, useVideoConfig} from 'remotion';
import {FONTS} from '../fonts';
import {STYLE} from '../theme';
import type {Word} from '../types';

type Chunk = {words: Word[]; start: number; end: number};

const MAX_CHARS = 34;

/** Divide le parole in righe brevi, spezzando sulla punteggiatura quando possibile. */
const toChunks = (words: Word[]): Chunk[] => {
  const chunks: Chunk[] = [];
  let cur: Word[] = [];
  let len = 0;
  const flush = () => {
    if (cur.length) chunks.push({words: cur, start: cur[0].start, end: cur[cur.length - 1].end});
    cur = [];
    len = 0;
  };
  for (const w of words) {
    if (len + w.text.length + 1 > MAX_CHARS) flush();
    cur.push(w);
    len += w.text.length + 1;
    if (/[.?!…:]$/.test(w.text) || (/[,;]$/.test(w.text) && len > 16)) flush();
  }
  flush();
  return chunks;
};

/** Sottolitoli piccoli, in basso, sempre visibili durante la narrazione. */
export const Subtitles: React.FC<{words: Word[]; bottom?: number; size?: number}> = ({words, bottom = 110, size = 50}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  const chunks = useMemo(() => toChunks(words), [words]);
  const i = chunks.findIndex((c, k) => t >= c.start - 0.08 && t < (chunks[k + 1]?.start ?? c.end + 1.5) - 0.08);
  const chunk = chunks[i];
  if (!chunk || t > chunk.end + 1.5) return null;

  return (
    <div style={{position: 'absolute', left: 60, right: 60, bottom, display: 'flex', justifyContent: 'center'}}>
      <div
        style={{
          fontFamily: FONTS[STYLE.font],
          fontWeight: 600,
          fontSize: size,
          lineHeight: 1.15,
          color: STYLE.chalk,
          background: 'rgba(8, 20, 14, 0.45)',
          padding: '6px 22px 10px',
          borderRadius: 16,
          textAlign: 'center',
          textShadow: '0 2px 4px rgba(0,0,0,0.6)',
        }}
      >
        {chunk.words.map((w, k) => (
          <span key={k} style={{color: t >= w.start && t < w.end + 0.05 ? STYLE.accent : undefined}}>
            {w.text}
            {k < chunk.words.length - 1 ? ' ' : ''}
          </span>
        ))}
      </div>
    </div>
  );
};
