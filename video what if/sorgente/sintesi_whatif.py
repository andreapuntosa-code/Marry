# -*- coding: utf-8 -*-
"""Voices for the What-if Shorts (Kokoro): one energetic narrator; the Little AIs are adult voices made childlike
(synthesized slower, played faster). Writes voice_whatif/<id>.wav + durations.json."""
import os, sys, json, time
import numpy as np, soundfile as sf
from scipy import signal

MODELS = os.environ.get("MODELS_DIR", "/tmp/claude-0/-home-user-Marry/e61fd834-a8c5-5cc5-8204-6c637a41951f/scratchpad/models")
OUT = os.environ.get("VOICE_DIR", "/tmp/claude-0/-home-user-Marry/e61fd834-a8c5-5cc5-8204-6c637a41951f/scratchpad/voice_whatif")
SR = 24000
NARR = ("am_puck", 1.1)
KIDV = {"red": ("am_puck", 1.30), "orange": ("af_bella", 1.22), "yellow": ("af_sky", 1.24), "green": ("am_echo", 1.32), "blue": ("am_adam", 1.34),
        "purple": ("af_nicole", 1.2), "pink": ("af_jessica", 1.24), "brown": ("am_fenrir", 1.36)}


def trim(x, sr, thr_db=-50, pad_start=0.02, pad_end=0.08):
    env = np.abs(x); win = max(1, int(sr * 0.01))
    e = np.convolve(env, np.ones(win) / win, mode="same")
    idx = np.where(e > 10 ** (thr_db / 20) * max(1e-6, e.max()))[0]
    return x if len(idx) == 0 else x[max(0, idx[0] - int(pad_start * sr)): min(len(x), idx[-1] + int(pad_end * sr))]


def say(k, text, voice):
    if voice == "narr":
        y, sr = k.create(text, voice=NARR[0], speed=NARR[1], lang="en-us")
        return trim(np.asarray(y, np.float32), sr)
    v, f = KIDV[voice]
    y, sr = k.create(text, voice=v, speed=1.1 / f, lang="en-us")
    y = signal.resample_poly(np.asarray(y, np.float32), 100, int(round(100 * f))).astype(np.float32)
    return trim(y, sr)


def main(only=None):
    from kokoro_onnx import Kokoro
    import script_whatif as W
    os.makedirs(OUT, exist_ok=True)
    k = Kokoro(f"{MODELS}/kokoro-v1.0.onnx", f"{MODELS}/voices-v1.0.bin")
    path = f"{OUT}/durations.json"
    info = json.load(open(path)) if os.path.exists(path) else {}
    for key, segs in W.SEG.items():
        for s in segs:
            sid = s["id"]
            if only and sid not in only and key not in only: continue
            if not only and sid in info and os.path.exists(f"{OUT}/{sid}.wav"): continue
            y = say(k, s["tts"], s["voice"]); y = (y / (np.abs(y).max() + 1e-9) * 0.9).astype(np.float32)
            sf.write(f"{OUT}/{sid}.wav", y, SR); info[sid] = {"dur": len(y) / SR, "sr": SR, "voice": s["voice"]}
            print(sid, round(len(y) / SR, 2), flush=True)
            json.dump(info, open(path, "w"), indent=1)


if __name__ == "__main__":
    main(sys.argv[1:] or None)
