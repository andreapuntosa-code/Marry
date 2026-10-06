# -*- coding: utf-8 -*-
"""Procedural sound effects for the arena film: gong, the bell for every star that goes dark, wind, fire, thunder, arrows, dust."""
import os, json
import numpy as np
import soundfile as sf
import music as M
from music import SR, lowpass, highpass, bandpass

HERE = os.path.dirname(os.path.abspath(__file__))
SCRATCH = os.environ.get("SCRATCH", "/tmp/claude-0/-home-user-Marry/e61fd834-a8c5-5cc5-8204-6c637a41951f/scratchpad")
R = np.random.default_rng(11)


def noise(n): return R.standard_normal(n)


def gong(dur=6.0):
    n = int(dur * SR); t = np.arange(n) / SR
    y = sum(a * np.sin(2 * np.pi * f * t * (1 + 0.002 * np.sin(t * k))) * np.exp(-t / d) for f, a, d, k in [(68, 1.0, 2.6, 3), (101, 0.7, 2.2, 4), (167, 0.5, 1.8, 5), (233, 0.4, 1.4, 7), (351, 0.25, 1.0, 9), (517, 0.15, 0.7, 6)])
    y += lowpass(noise(n), 2500) * np.exp(-t / 0.08) * 0.8
    return y * 0.5


def star_bell(vel=0.8):
    return M.bell(91, 4.5, vel, ratio=2.76, index=1.2) * 0.9


def wind(dur, gain=1.0):
    n = int(dur * SR); t = np.arange(n) / SR
    x = bandpass(noise(n), 420, 700) * (0.5 + 0.5 * np.sin(2 * np.pi * t / 7.3 + 1.0) * np.sin(2 * np.pi * t / 3.1)) ** 1.5
    return x * gain * 0.06


def crackle(dur, gain=1.0):
    n = int(dur * SR); x = np.zeros(n)
    for _ in range(int(dur * 38)):
        i = R.integers(0, max(1, n - 2000)); l = R.integers(60, 700); x[i:i + l] += noise(l) * np.exp(-np.arange(l) / (l * 0.25)) * R.uniform(0.2, 1.0)
    return highpass(x, 600) * gain * 0.25 + lowpass(noise(n), 300) * 0.05 * gain


def thunder(dur=4.5):
    n = int(dur * SR); t = np.arange(n) / SR
    return lowpass(noise(n), 220) * (np.exp(-t / 1.4) * (0.6 + 0.4 * np.sin(t * 11))) * 1.4 + lowpass(noise(n), 2500) * np.exp(-t / 0.05) * 0.8


def whoosh(dur=0.7):
    n = int(dur * SR); t = np.arange(n) / SR
    return bandpass(noise(n), 2400, 2200) * np.sin(np.pi * t / dur) ** 2 * 0.5


def rumble(dur, gain=1.0):
    n = int(dur * SR); t = np.arange(n) / SR
    return lowpass(noise(n), 160) * np.sin(np.pi * np.minimum(1, t / dur)) ** 0.6 * gain


def clang(vel=0.6):
    n = int(0.9 * SR); t = np.arange(n) / SR
    f = R.uniform(900, 2400)
    return (np.sin(2 * np.pi * f * t) + 0.6 * np.sin(2 * np.pi * f * 2.76 * t)) * np.exp(-t / 0.12) * vel * 0.3 + highpass(noise(n), 3000) * np.exp(-t / 0.01) * 0.3


def flutter(dur):
    n = int(dur * SR); t = np.arange(n) / SR
    return highpass(noise(n), 800) * (0.5 + 0.5 * np.sin(2 * np.pi * 9 * t)) * 0.06


def main():
    tl = json.load(open(os.path.join(HERE, "timeline.json"))); seg = {s["id"]: s for s in tl["segments"]}
    import wordtimes
    N = int((tl["total"] + 4) * SR); L = np.zeros(N, np.float32); Rr = np.zeros(N, np.float32)

    def put(t, x, g=1.0, pan=0.0):
        i = int(max(0, t) * SR)
        if i >= N: return
        m = min(len(x), N - i); x = x[:m] * g
        L[i:i + m] += x * np.cos((pan + 1) * np.pi / 4) * 1.41; Rr[i:i + m] += x * np.sin((pan + 1) * np.pi / 4) * 1.41

    def at(a, off=0.0):
        if "@" in a:
            sid, w = a.split("@", 1); return seg[sid]["start"] + wordtimes.word_start(sid, w) + off
        return seg[a]["start"] + off
    # the beds
    put(0.0, wind(tl["total"], 1.0), 1.0, 0.0)
    for a, b in [("x01", "t01"), ("f06", "f08"), ("e05", "e15")]:
        t0, t1 = at(a), at(b) if b in seg else tl["total"]; put(t0, wind(t1 - t0 + 1, 2.0), 1.0, 0.3)
    for a, b in [("g03", "g08"), ("t14", "t17")]:
        t0, t1 = at(a), at(b); put(t0, crackle(t1 - t0 + 1, 1.4), 1.0, -0.2)
    put(at("g15"), rumble(at("g19") - at("g15"), 0.5), 1.0)
    put(at("b06"), rumble(at("b07") - at("b06"), 0.9), 1.0)
    put(at("g11"), flutter(4.2), 1.0)
    # one-shots
    put(at("b05", 0.1), gong(), 1.0); put(at("r15", 7.2), gong(5.0), 0.2)
    for sid, off, count, gap in [("r09@dark", 0.1, 1, 0), ("f12@star", 0.0, 1, 0), ("f13f", 0.6, 8, 0.28), ("a17", 0.5, 1, 0), ("a23", 1.0, 1, 0), ("g07", 0.5, 7, 0.1), ("g14", 0.2, 1, 0), ("g18", 0.4, 2, 0.9),
                                 ("x11", 0.4, 1, 0), ("t07", 4.6, 1, 0), ("t08", 0.2, 1, 0), ("t16", 4.0, 4, 0.7), ("l07", 0.1, 1, 0), ("l09", 0.1, 1, 0), ("l12", 0.4, 1, 0), ("l13", 0.1, 1, 0), ("l16", 0.1, 1, 0), ("b13b", 3.4, 1, 0), ("w10", 0.5, 1, 0), ("w11", 0.3, 1, 0)]:
        for k in range(count): put(at(sid, off + k * gap), star_bell(0.9 - 0.04 * k), 0.55, R.uniform(-0.5, 0.5))
    for k in range(31): put(at("b20", 0.5 + k * 0.095), star_bell(0.7), 0.3, R.uniform(-0.6, 0.6))
    put(at("r13", 1.3), thunder(), 0.9); put(at("r14", 2.4), thunder(), 1.0)
    for sid, off in [("f12", 0.2), ("l14", 2.0), ("x17", 1.0)]: put(at(sid, off), whoosh(), 0.7, 0.2)
    put(at("x07", 1.5), whoosh(2.2), 0.5); put(at("x08", 0.0), rumble(2.4, 1.2), 1.0); put(at("e05", 0.0), rumble(3.0, 1.1), 1.0)
    put(at("b18"), rumble(6.0, 0.7), 1.0)
    for k in range(40): put(at("b18", R.uniform(0, 8.5)), clang(R.uniform(0.3, 0.9)), 0.8, R.uniform(-0.8, 0.8))
    for k in range(26): put(at("w07", R.uniform(0, 12)), clang(R.uniform(0.4, 1.0)), 0.8, R.uniform(-0.6, 0.6))
    for k in range(10): put(at("t06", R.uniform(0, 4.5)), clang(R.uniform(0.4, 1.0)), 0.8, R.uniform(-0.6, 0.6))
    for k in range(9): put(at("t16", R.uniform(0, 6)), clang(R.uniform(0.4, 1.0)), 0.8, R.uniform(-0.8, 0.8))
    n = int(tl["total"] * SR)
    sf.write(os.path.join(SCRATCH, "audio", "sfx.wav"), np.stack([L[:n], Rr[:n]], 1).astype(np.float32), SR, subtype="FLOAT")
    print("sfx.wav", n / SR)


if __name__ == "__main__":
    main()
