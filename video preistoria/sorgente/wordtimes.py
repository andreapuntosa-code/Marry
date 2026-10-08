# -*- coding: utf-8 -*-
"""
Word onset times inside a narration segment, measured from the synthesized audio: the clause
boundaries are the digital-silence gaps that sintesi_hg.py inserts, words are spread inside each clause
by character weight. Used to cut the picture on a specific word:  anchor "r04@forest" or "r04@5".
"""
import json, os, re, sys
import numpy as np
import soundfile as sf
import script_pre as S

VOICE_DIR = os.environ.get("VOICE_DIR", "/tmp/claude-0/-home-user-Marry/e61fd834-a8c5-5cc5-8204-6c637a41951f/scratchpad/voice_pre")
_cache = {}


def _gaps(y, sr, min_gap=0.14):
    z = (np.abs(y) < 1e-7).astype(np.int8)
    d = np.diff(np.concatenate([[0], z, [0]]))
    st, en = np.where(d == 1)[0], np.where(d == -1)[0]
    return [(a / sr, b / sr) for a, b in zip(st, en) if (b - a) / sr >= min_gap]


def _norm(w):
    return re.sub(r"[^\w']", "", w).lower()


def word_times(seg_id):
    """[(word, t_seconds_from_segment_start)]"""
    if seg_id in _cache:
        return _cache[seg_id]
    seg = next(s for s in S.SEGMENTS if s["id"] == seg_id)
    y, sr = sf.read(os.path.join(VOICE_DIR, seg_id + ".wav"))
    dur = len(y) / sr
    gaps = _gaps(y, sr)
    bounds, t = [], 0.0
    for a, b in gaps:
        bounds.append((t, a)); t = b
    bounds.append((t, dur))
    cl = []
    out = []
    if len(cl) == len(bounds):
        for (txt, _), (a, b) in zip(cl, bounds):
            toks = re.findall(r"\S+", txt)
            wts = [len(_norm(w)) + 1.0 for w in toks]
            tot = sum(wts); acc = 0.0
            for w, k in zip(toks, wts):
                out.append((w, round(a + (b - a) * acc / tot, 3))); acc += k
    else:   # fallback: spread over the whole segment
        toks = re.findall(r"\S+", seg["tts"]); wts = [len(_norm(w)) + 1.0 for w in toks]; tot = sum(wts); acc = 0.0
        for w, k in zip(toks, wts):
            out.append((w, round(dur * acc / tot, 3))); acc += k
    _cache[seg_id] = out
    return out


def word_start(seg_id, key):
    wt = word_times(seg_id)
    if isinstance(key, int) or re.fullmatch(r"-?\d+", str(key)):
        return wt[int(key)][1]
    k = _norm(str(key))
    for w, t in wt:
        if _norm(w) == k:
            return t
    raise KeyError(f"{seg_id}: no word '{key}' in {[w for w, _ in wt]}")


if __name__ == "__main__":
    for sid in sys.argv[1:]:
        print(sid, word_times(sid))
