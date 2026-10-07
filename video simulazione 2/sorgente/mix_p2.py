# -*- coding: utf-8 -*-
"""Mix: narrator + character voices over music and sfx. Music ducks under every voice; question pauses breathe."""
import os, json
import numpy as np
import soundfile as sf
from scipy import signal

HERE = os.path.dirname(os.path.abspath(__file__))
SCRATCH = os.environ.get("SCRATCH", "/tmp/claude-0/-home-user-Marry/e61fd834-a8c5-5cc5-8204-6c637a41951f/scratchpad")
VOICE = os.path.join(SCRATCH, "voice_p2"); SR = 48000


def main():
    tl = json.load(open(os.path.join(HERE, "timeline.json")))
    N = int(tl["total"] * SR)
    voice = np.zeros(N, np.float32)
    for s in tl["segments"]:
        y, sr = sf.read(os.path.join(VOICE, s["id"] + ".wav"), dtype="float32")
        if y.ndim > 1: y = y.mean(1)
        g = np.gcd(SR, sr); y = signal.resample_poly(y, SR // g, sr // g).astype(np.float32)
        gain = 1.0 if s["voice"] == "narr" else 0.9
        y = y / (np.abs(y).max() + 1e-9) * 0.8 * gain
        i = int(s["start"] * SR); m = min(len(y), N - i)
        if m > 0: voice[i:i + m] += y[:m]
    music = sf.read(os.path.join(SCRATCH, "audio_p2", "music.wav"), dtype="float32")[0][:N]
    sfx = sf.read(os.path.join(SCRATCH, "audio_p2", "sfx.wav"), dtype="float32")[0][:N]
    act = (np.abs(voice) > 0.01).astype(np.float32)
    k = int(0.35 * SR); env = np.convolve(act, np.ones(k) / k, "same"); env = np.convolve((env > 0.03).astype(np.float32), np.ones(int(0.25 * SR)) / int(0.25 * SR), "same")
    duck = 1.0 - 0.62 * env
    mix = music * (0.62 * duck)[:, None] + sfx * (0.8 * (1 - 0.35 * env))[:, None] + voice[:, None] * 1.0
    mix = mix / (np.abs(mix).max() + 1e-9) * 0.9
    sf.write(os.path.join(SCRATCH, "audio_p2", "mix.wav"), mix.astype(np.float32), SR, subtype="FLOAT")
    print("mix.wav", N / SR, "s")


if __name__ == "__main__":
    main()
