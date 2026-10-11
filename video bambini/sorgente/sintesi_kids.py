# -*- coding: utf-8 -*-
"""Voices for the kids video (Kokoro): a warm, slow narrator; the ten Little AIs are adult voices made childlike
(synthesized slower, then played faster: higher pitch at a normal tempo); 'chorus' = five kids at once.
Lists (colours, countdown) are spoken clause by clause with exact digital silence between, so wordtimes.py can find
every word for the graphics."""
import os, sys, json, re, time
import numpy as np, soundfile as sf
from scipy import signal

HERE = os.path.dirname(os.path.abspath(__file__))
MODELS = os.environ.get("MODELS_DIR", "/tmp/claude-0/-home-user-Marry/e61fd834-a8c5-5cc5-8204-6c637a41951f/scratchpad/models")
OUT = os.environ.get("VOICE_DIR", "/tmp/claude-0/-home-user-Marry/e61fd834-a8c5-5cc5-8204-6c637a41951f/scratchpad/voice_kids")
SR = 24000

NARR = ("af_heart", 0.88)
KIDV = {   # voice, pitch factor
    "red": ("am_puck", 1.30), "orange": ("af_bella", 1.22), "yellow": ("af_sky", 1.24), "green": ("am_echo", 1.32), "blue": ("am_adam", 1.34),
    "purple": ("af_nicole", 1.2), "pink": ("af_jessica", 1.24), "brown": ("am_fenrir", 1.36), "white": ("bf_emma", 1.22), "black": ("am_michael", 1.32),
}
CHORUS = ["red", "orange", "yellow", "pink", "blue"]
SPLIT = {"c91", "g02", "n14", "n12c", "a6b", "o02", "o04", "o06", "d01"}


def trim(x, sr, thr_db=-50, pad_start=0.02, pad_end=0.1):
    env = np.abs(x); win = max(1, int(sr * 0.01))
    e = np.convolve(env, np.ones(win) / win, mode="same")
    idx = np.where(e > 10 ** (thr_db / 20) * max(1e-6, e.max()))[0]
    if len(idx) == 0:
        return x
    return x[max(0, idx[0] - int(pad_start * sr)): min(len(x), idx[-1] + int(pad_end * sr))]


def kid(k, text, who, tempo=1.05):
    voice, f = KIDV[who]
    y, sr = k.create(text, voice=voice, speed=tempo / f, lang="en-us")
    y = np.asarray(y, np.float32)
    y = signal.resample_poly(y, 100, int(round(100 * f))).astype(np.float32)   # same sr, fewer samples: higher pitch
    return trim(y, sr)


def say(k, text, voice):
    if voice == "narr":
        y, sr = k.create(text, voice=NARR[0], speed=NARR[1], lang="en-us")
        return trim(np.asarray(y, np.float32), sr)
    if voice == "chorus":
        parts = [kid(k, text, w, 1.0) for w in CHORUS]
        n = max(len(p) for p in parts) + int(0.05 * SR)
        out = np.zeros(n, np.float32)
        for i, p in enumerate(parts):
            d = int(i * 0.012 * SR); out[d:d + len(p)] += p * (0.9 if i == 0 else 0.6)
        return out / (np.abs(out).max() + 1e-9) * 0.8
    return kid(k, text, voice)


def clauses(text):
    return [c.strip() for c in re.findall(r"[^,!.?]+[,!.?]*", text) if c.strip()]


def main(only=None):
    from kokoro_onnx import Kokoro
    import script_kids
    os.makedirs(OUT, exist_ok=True)
    k = Kokoro(f"{MODELS}/kokoro-v1.0.onnx", f"{MODELS}/voices-v1.0.bin")
    path = f"{OUT}/durations.json"
    info = json.load(open(path)) if os.path.exists(path) else {}
    for seg in script_kids.SEGMENTS:
        sid = seg["id"]
        if only and sid not in only:
            continue
        if not only and sid in info and os.path.exists(f"{OUT}/{sid}.wav"):
            continue
        t0 = time.time()
        if sid in SPLIT:
            gap = np.zeros(int(0.2 * SR), np.float32)
            parts = []
            for c in clauses(seg["tts"]):
                parts += [say(k, c, seg["voice"]), gap]
            y = np.concatenate(parts[:-1])
        else:
            y = say(k, seg["tts"], seg["voice"])
        y = (y / (np.abs(y).max() + 1e-9) * 0.9).astype(np.float32)
        sf.write(f"{OUT}/{sid}.wav", y, SR)
        info[sid] = {"dur": len(y) / SR, "sr": SR, "voice": seg["voice"]}
        print(sid, round(len(y) / SR, 2), "s", round(time.time() - t0, 1), flush=True)
        json.dump(info, open(path, "w"), indent=1)
    print("TOTAL speech:", round(sum(v["dur"] for v in info.values()), 1))


if __name__ == "__main__":
    main(sys.argv[1:] or None)
