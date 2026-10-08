# -*- coding: utf-8 -*-
"""English subtitles (SRT) from the timeline: every narration line and character line,
split into readable cues (max 2 lines x 42 characters)."""
import json, os, re, textwrap

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(os.path.dirname(HERE), "subtitles_en.srt")


def ts(t):
    h, r = divmod(t, 3600); m, s = divmod(r, 60)
    return f"{int(h):02d}:{int(m):02d}:{int(s):02d},{int(round((s - int(s)) * 1000)) % 1000:03d}"


def chunks(text, maxc=84):
    """split a line into cue-sized pieces at sentence/clause boundaries"""
    parts = re.split(r'(?<=[.!?:])\s+', text.strip())
    out, cur = [], ""
    for p in parts:
        if len(cur) + len(p) + 1 <= maxc:
            cur = (cur + " " + p).strip()
        else:
            if cur:
                out.append(cur)
            while len(p) > maxc:
                cut = p.rfind(', ', 0, maxc)
                cut = cut + 1 if cut > 20 else p.rfind(' ', 0, maxc)
                out.append(p[:cut].strip()); p = p[cut:].strip()
            cur = p
    if cur:
        out.append(cur)
    return out


def main():
    tl = json.load(open(os.path.join(HERE, "timeline.json")))
    cues = []
    for s in tl['segments']:
        text = s['sub']
        if s.get('who'):
            text = f"{s['who'].title()}: {text.strip('“”')}"
        pieces = chunks(text)
        total = sum(len(p) for p in pieces)
        t = s['start']
        for p in pieces:
            d = s['dur'] * len(p) / total
            cues.append((t, t + d + (0.25 if p is pieces[-1] else 0.0), p))
            t += d
    with open(OUT, "w", encoding="utf-8") as f:
        for i, (a, b, p) in enumerate(cues, 1):
            lines = textwrap.wrap(p, 42)
            if len(lines) > 2:
                lines = textwrap.wrap(p, (len(p) + 1) // 2 + 2)[:2]
            f.write(f"{i}\n{ts(a)} --> {ts(b)}\n" + "\n".join(lines) + "\n\n")
    print(OUT, len(cues), "cues")


if __name__ == "__main__":
    main()
