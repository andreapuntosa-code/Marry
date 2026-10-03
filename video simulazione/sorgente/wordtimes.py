# -*- coding: utf-8 -*-
"""Approximate word onset times inside a narration segment (character-weighted, with
pauses at punctuation) — used to place quick cuts on specific words."""
import json, sys, re
import script_en as S

def word_times(seg_id, tl=None):
    tl = tl or json.load(open('timeline.json'))
    seg = next(s for s in tl['segments'] if s['id'] == seg_id)
    text = next(s for s in S.SEGMENTS if s['id'] == seg_id)['sub']
    toks = re.findall(r"\S+", text)
    w = []
    for t in toks:
        base = len(re.sub(r"[^\w']", "", t)) + 1.2
        pause = 3.2 if t[-1] in '.?!:' else 1.6 if t[-1] in ',;' else 0
        w.append((t, base, pause))
    total = sum(b + p for _, b, p in w) - w[-1][2]
    k = seg['dur'] / total
    out, acc = [], 0.0
    for t, b, p in w:
        out.append((t, round(acc * k, 2)))
        acc += b + p
    return out

if __name__ == '__main__':
    for sid in sys.argv[1:]:
        print(sid, word_times(sid))


def pauses(seg_id, voice_dir='/tmp/claude-0/-home-user-Marry/e61fd834-a8c5-5cc5-8204-6c637a41951f/scratchpad/voice_en', min_gap=0.09):
    """Silent gaps inside the synthesized line: list of (start, end) seconds."""
    import soundfile as sf, numpy as np
    d, sr = sf.read(f"{voice_dir}/{seg_id}.wav")
    if d.ndim > 1:
        d = d.mean(1)
    hop = int(sr * 0.01)
    rms = np.sqrt(np.convolve(d ** 2, np.ones(hop * 3) / (hop * 3), 'same'))[::hop]
    thr = max(1e-4, np.percentile(rms, 95) * 0.06)
    quiet = rms < thr
    gaps, i = [], 0
    while i < len(quiet):
        if quiet[i]:
            j = i
            while j < len(quiet) and quiet[j]:
                j += 1
            if (j - i) * 0.01 >= min_gap and i > 0 and j < len(quiet):
                gaps.append((i * 0.01, j * 0.01))
            i = j
        else:
            i += 1
    return gaps


def onsets_after_punct(seg_id):
    """Onset times of words that follow a punctuation mark, measured from the audio gaps."""
    toks = re.findall(r"\S+", next(s for s in S.SEGMENTS if s['id'] == seg_id)['sub'])
    after = [toks[k + 1] for k in range(len(toks) - 1) if toks[k][-1] in '.?!:,;']
    g = pauses(seg_id)
    return list(zip(after, [round(e, 2) for _, e in g])), len(after), len(g)
