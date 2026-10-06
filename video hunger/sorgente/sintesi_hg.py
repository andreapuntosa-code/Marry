# -*- coding: utf-8 -*-
"""
Voice synthesis for the arena film (Kokoro): slow narrator, real pauses inside sentences,
and questions that actually sound like questions (Kokoro lowers its pitch at "?", so the last word
is re-pitched with Praat PSOLA to end on a rise).

  python3 sintesi_hg.py            -> every segment
  python3 sintesi_hg.py h05 x03    -> only those ids
"""
import os, sys, re, json, time
import numpy as np
import soundfile as sf

HERE = os.path.dirname(os.path.abspath(__file__))
MODELS = os.environ.get("MODELS_DIR", "/tmp/claude-0/-home-user-Marry/e61fd834-a8c5-5cc5-8204-6c637a41951f/scratchpad/models")
OUT = os.environ.get("VOICE_DIR", "/tmp/claude-0/-home-user-Marry/e61fd834-a8c5-5cc5-8204-6c637a41951f/scratchpad/voice_hg")
SR = 24000

# voice, speed, language   (Kokoro's default speed 1.0 is ~3.9 words/s: far too fast for a documentary narrator)
VOICES = {
    "narr": ("am_puck", 0.80, "en-us"),
    "rex":  ("am_fenrir", 0.82, "en-us"),
    "vex":  ("af_nova", 0.88, "en-us"),
    "june": ("af_jessica", 0.88, "en-us"),
    "finn": ("am_eric", 0.9, "en-us"),
    "kai":  ("am_adam", 0.85, "en-us"),
    "luna": ("af_nicole", 0.85, "en-us"),
    "toby": ("am_michael", 0.82, "en-us"),
    "dax":  ("bm_lewis", 0.85, "en-gb"),
    "bolt": ("am_liam", 0.95, "en-us"),
    "rook": ("bm_daniel", 0.85, "en-gb"),
    "aster": ("af_aoede", 0.88, "en-us"),
    "marlo": ("bm_george", 0.85, "en-gb"),
    "sage": ("bf_isabella", 0.85, "en-gb"),
    "echo": ("af_river", 0.88, "en-us"),
    "zara": ("bf_emma", 0.85, "en-gb"),
    "pip":  ("af_sky", 0.88, "en-us"),
}
# silence after a clause, by its closing punctuation (seconds)
GAP = {",": 0.30, ";": 0.40, ":": 0.45, ".": 0.62, "!": 0.62, "?": 0.0, "…": 0.85, "...": 0.85}


def trim(x, sr, thr_db=-52, pad_start=0.02, pad_end=0.10):
    env = np.abs(x)
    win = max(1, int(sr * 0.01))
    e = np.convolve(env, np.ones(win) / win, mode="same")
    thr = 10 ** (thr_db / 20) * max(1e-6, e.max())
    idx = np.where(e > thr)[0]
    if len(idx) == 0:
        return x
    a = max(0, idx[0] - int(pad_start * sr)); b = min(len(x), idx[-1] + int(pad_end * sr))
    return x[a:b]


def clauses(text):
    """[(clause, closing punctuation)] — ellipses and commas become real pauses"""
    out, cur = [], ""
    i = 0
    while i < len(text):
        c = text[i]
        if text.startswith("...", i):
            cur += "..."; out.append((cur.strip(), "...")); cur = ""; i += 3; continue
        cur += c
        if c in ",;:.!?":
            nxt = text[i + 1:i + 2]
            if c == "." and nxt and nxt.isdigit():
                i += 1; continue
            out.append((cur.strip(), c)); cur = ""
        i += 1
    if cur.strip():
        out.append((cur.strip(), "."))
    return [(a, b) for a, b in out if re.search(r"\w", a)]


def rise(y, sr, semis=6.5, tail=0.42):
    """make the end of a question rise: PSOLA re-pitch of the last `tail` seconds of voiced speech"""
    import parselmouth
    from parselmouth.praat import call
    snd = parselmouth.Sound(y.astype(np.float64), sr)
    man = call(snd, "To Manipulation", 0.01, 70, 330)
    pt = call(man, "Extract pitch tier")
    n = call(pt, "Get number of points")
    if n < 8:
        return y
    ts = np.array([call(pt, "Get time from index", i + 1) for i in range(n)])
    fs = np.array([call(pt, "Get value at index", i + 1) for i in range(n)])
    t_end = ts[-1]
    t0 = t_end - tail
    k0 = np.searchsorted(ts, t0)
    f_ref = float(np.median(fs[max(0, k0 - 3):k0 + 1])) if k0 > 0 else float(fs[0])
    new = fs.copy()
    for i in range(k0, n):
        u = (ts[i] - t0) / max(1e-3, t_end - t0)
        new[i] = f_ref * 2 ** ((semis * (u ** 1.25)) / 12.0)
    call(pt, "Remove points between", t0, t_end + 0.01)
    for t, f in zip(ts[k0:], new[k0:]):
        call(pt, "Add point", float(t), float(min(f, 420.0)))
    call([pt, man], "Replace pitch tier")
    res = call(man, "Get resynthesis (overlap-add)")
    return np.asarray(res.values[0], np.float32)


def synth_segment(k, seg):
    voice, speed, lang = VOICES[seg["voice"]]
    parts = clauses(seg["tts"])
    pieces = []
    for j, (txt, p) in enumerate(parts):
        s, sr = k.create(txt, voice=voice, speed=speed, lang=lang)
        s = trim(np.asarray(s, np.float32), sr)
        if seg.get("q") and j == len(parts) - 1 and p == "?":
            s = rise(s, sr)
        pieces.append(s)
        if j < len(parts) - 1:
            pieces.append(np.zeros(int(GAP.get(p, 0.3) * sr), np.float32))
    y = np.concatenate(pieces)
    return y, sr


def main(only=None):
    from kokoro_onnx import Kokoro
    import script_hg
    os.makedirs(OUT, exist_ok=True)
    k = Kokoro(f"{MODELS}/kokoro-v1.0.onnx", f"{MODELS}/voices-v1.0.bin")
    path = f"{OUT}/durations.json"
    info = json.load(open(path)) if (only and os.path.exists(path)) else {}
    for seg in script_hg.SEGMENTS:
        sid = seg["id"]
        if only and sid not in only:
            continue
        t0 = time.time()
        y, sr = synth_segment(k, seg)
        sf.write(f"{OUT}/{sid}.wav", y, sr)
        info[sid] = {"dur": len(y) / sr, "sr": sr, "voice": seg["voice"]}
        print(sid, round(len(y) / sr, 2), "s", round(time.time() - t0, 1), flush=True)
        json.dump(info, open(path, "w"), indent=1)
    print("TOTAL speech:", round(sum(v["dur"] for v in info.values()), 1))


if __name__ == "__main__":
    main(sys.argv[1:] or None)
