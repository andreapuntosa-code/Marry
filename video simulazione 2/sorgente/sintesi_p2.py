# -*- coding: utf-8 -*-
"""Voices for Part 2 (Kokoro): the fast original narrator (am_puck, one take per segment, no pitch edits) + the new cast."""
import os, sys, json, time
import numpy as np, soundfile as sf

HERE = os.path.dirname(os.path.abspath(__file__))
MODELS = os.environ.get("MODELS_DIR", "/tmp/claude-0/-home-user-Marry/e61fd834-a8c5-5cc5-8204-6c637a41951f/scratchpad/models")
OUT = os.environ.get("VOICE_DIR", "/tmp/claude-0/-home-user-Marry/e61fd834-a8c5-5cc5-8204-6c637a41951f/scratchpad/voice_p2")

VOICES = {   # voice, speed, language
    "narr": ("am_puck", 1.04, "en-us"),
    "aru":  ("bf_emma", 1.0, "en-gb"),
    "neri": ("af_sky", 1.0, "en-us"),
    "brax": ("am_fenrir", 1.0, "en-us"),
    "maru": ("af_nicole", 0.98, "en-us"),
    "kuma": ("bm_lewis", 0.95, "en-gb"),
    "zol":  ("am_michael", 1.0, "en-us"),
    "ria":  ("af_jessica", 1.0, "en-us"),
    "lumi": ("af_bella", 1.0, "en-us"),
}


def trim(x, sr, thr_db=-52, pad_start=0.02, pad_end=0.12):
    env = np.abs(x); win = max(1, int(sr * 0.01))
    e = np.convolve(env, np.ones(win) / win, mode="same")
    idx = np.where(e > 10 ** (thr_db / 20) * max(1e-6, e.max()))[0]
    if len(idx) == 0:
        return x
    return x[max(0, idx[0] - int(pad_start * sr)): min(len(x), idx[-1] + int(pad_end * sr))]


def main(only=None):
    from kokoro_onnx import Kokoro
    import script_p2
    os.makedirs(OUT, exist_ok=True)
    k = Kokoro(f"{MODELS}/kokoro-v1.0.onnx", f"{MODELS}/voices-v1.0.bin")
    path = f"{OUT}/durations.json"
    info = json.load(open(path)) if (only and os.path.exists(path)) else {}
    for seg in script_p2.SEGMENTS:
        sid = seg["id"]
        if only and sid not in only:
            continue
        if not only and sid in info and os.path.exists(f"{OUT}/{sid}.wav"):
            continue
        voice, speed, lang = VOICES[seg["voice"]]
        t0 = time.time()
        s, sr = k.create(seg["tts"], voice=voice, speed=speed, lang=lang)
        s = trim(np.asarray(s, np.float32), sr)
        sf.write(f"{OUT}/{sid}.wav", s, sr)
        info[sid] = {"dur": len(s) / sr, "sr": sr, "voice": seg["voice"]}
        print(sid, round(len(s) / sr, 2), "s", round(time.time() - t0, 1), flush=True)
        json.dump(info, open(path, "w"), indent=1)
    print("TOTAL speech:", round(sum(v["dur"] for v in info.values()), 1))


if __name__ == "__main__":
    main(sys.argv[1:] or None)
