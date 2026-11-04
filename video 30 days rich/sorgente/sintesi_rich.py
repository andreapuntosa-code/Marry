# -*- coding: utf-8 -*-
"""Voices (Kokoro): punchy narrator, Kevin (a younger, brighter voice), Mom. Writes voice_rich/<id>.wav + durations.json."""
import os, sys, json
import numpy as np, soundfile as sf
from scipy import signal

MODELS = os.environ.get("MODELS_DIR", "/tmp/claude-0/-home-user-Marry/e61fd834-a8c5-5cc5-8204-6c637a41951f/scratchpad/models")
EPN = int(os.environ.get("EP", "1"))
OUT = os.environ.get("VOICE_DIR", "/tmp/claude-0/-home-user-Marry/e61fd834-a8c5-5cc5-8204-6c637a41951f/scratchpad/voice_rich" + ("" if EPN == 1 else str(EPN)))
SR = 24000
VOICES = {"narr": ("am_puck", 1.14, 1.0), "kevin": ("am_echo", 1.12, 1.12), "mom": ("af_sarah", 1.02, 1.0)}   # voice, tempo, pitch


def trim(x, sr, thr_db=-50, pad_start=0.02, pad_end=0.06):
    env = np.abs(x); win = max(1, int(sr * 0.01))
    e = np.convolve(env, np.ones(win) / win, mode="same")
    idx = np.where(e > 10 ** (thr_db / 20) * max(1e-6, e.max()))[0]
    return x if len(idx) == 0 else x[max(0, idx[0] - int(pad_start * sr)): min(len(x), idx[-1] + int(pad_end * sr))]


def main(only=None):
    from kokoro_onnx import Kokoro
    import importlib
    S = importlib.import_module("script_rich" if EPN == 1 else f"script_rich_ep{EPN}")
    os.makedirs(OUT, exist_ok=True)
    k = Kokoro(f"{MODELS}/kokoro-v1.0.onnx", f"{MODELS}/voices-v1.0.bin")
    path = f"{OUT}/durations.json"; info = json.load(open(path)) if os.path.exists(path) else {}
    for s in S.SEGMENTS:
        if only and s["id"] not in only: continue
        v, tempo, pitch = VOICES[s["voice"]]
        y, sr = k.create(s["tts"], voice=v, speed=tempo / pitch, lang="en-us")
        y = np.asarray(y, np.float32)
        if pitch != 1.0: y = signal.resample_poly(y, 100, int(round(100 * pitch))).astype(np.float32)
        y = trim(y, sr); y = (y / (np.abs(y).max() + 1e-9) * 0.9).astype(np.float32)
        sf.write(f"{OUT}/{s['id']}.wav", y, SR); info[s["id"]] = {"dur": len(y) / SR}
        print(s["id"], round(len(y) / SR, 2), flush=True)
    json.dump(info, open(path, "w"), indent=1)
    print("speech", round(sum(v["dur"] for v in info.values()), 1), "s")


if __name__ == "__main__":
    main(sys.argv[1:] or None)
