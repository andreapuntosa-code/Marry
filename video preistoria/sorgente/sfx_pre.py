# -*- coding: utf-8 -*-
"""Procedural sound effects for Part 2: wind at the top of the Ladder, factory and train, hammer, the crack in the sky, typing, the Bingus ding."""
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




def tick(vel=0.5):
    n = int(0.05 * SR); t = np.arange(n) / SR
    return (highpass(noise(n), 2500) * np.exp(-t / 0.006) * vel * 0.5)


def chug(dur, rate=3.2, gain=1.0):
    n = int(dur * SR); x = np.zeros(n)
    k = 0.0
    while k < dur - 0.3:
        i = int(k * SR); l = int(0.16 * SR); t = np.arange(l) / SR
        x[i:i + l] += (lowpass(noise(l), 700) * np.exp(-t / 0.05))[:max(0, min(l, n - i))] * (0.9 if int(k * rate) % 4 else 0.6)
        k += 1.0 / rate
    return x * gain * 0.7


def ding():
    return M.bell(84, 2.4, 0.8, ratio=3.5, index=1.0) * 0.6


def crack(dur=2.2):
    n = int(dur * SR); t = np.arange(n) / SR
    return highpass(noise(n), 1800) * np.exp(-t / 0.35) * 0.8 + lowpass(noise(n), 200) * np.exp(-t / 0.5) * 0.8


def crowd(dur, gain=1.0):
    n = int(dur * SR); t = np.arange(n) / SR
    return bandpass(noise(n), 700, 900) * (0.6 + 0.4 * np.sin(2 * np.pi * t / 2.7)) * gain * 0.07


def howl(dur=2.8):
    n = int(dur * SR); t = np.arange(n) / SR
    f = 380 + 260 * np.sin(np.pi * np.minimum(1, t / dur) ** 0.8) + 8 * np.sin(2 * np.pi * 6 * t)
    ph = 2 * np.pi * np.cumsum(f) / SR
    y = (np.sin(ph) + 0.4 * np.sin(2 * ph) + 0.2 * np.sin(3 * ph)) * np.sin(np.pi * np.minimum(1, t / dur)) ** 1.2
    return lowpass(y, 2600) * 0.5


def trumpet(dur=2.2):
    n = int(dur * SR); t = np.arange(n) / SR
    f = 150 + 120 * np.sin(np.pi * np.minimum(1, t / dur) ** 0.7)
    ph = 2 * np.pi * np.cumsum(f) / SR
    y = np.sign(np.sin(ph)) * 0.4 + np.sin(ph) * 0.6 + noise(n) * 0.15
    return lowpass(y, 1800) * np.sin(np.pi * np.minimum(1, t / dur)) ** 0.7 * 0.7


def growl(dur=2.0):
    n = int(dur * SR); t = np.arange(n) / SR
    return lowpass(noise(n) * (0.6 + 0.4 * np.sin(2 * np.pi * 28 * t)), 420) * np.sin(np.pi * np.minimum(1, t / dur)) * 1.2


def thud(vel=0.8):
    n = int(0.5 * SR); t = np.arange(n) / SR
    return (np.sin(2 * np.pi * 52 * t * np.exp(-t * 3)) * np.exp(-t / 0.12) + lowpass(noise(n), 400) * np.exp(-t / 0.04) * 0.6) * vel


def dig(dur):
    n = int(dur * SR); x = np.zeros(n)
    for k in range(int(dur * 2.4)):
        i = int(k / 2.4 * SR + R.uniform(0, 0.1) * SR); l = int(0.18 * SR)
        if i + l < n: x[i:i + l] += lowpass(noise(l), 900) * np.exp(-np.arange(l) / (l * 0.3)) * R.uniform(0.4, 0.9)
    return x * 0.5


def main():
    tl = json.load(open(os.path.join(HERE, "timeline.json"))); seg = {s["id"]: s for s in tl["segments"]}
    N = int((tl["total"] + 4) * SR); L = np.zeros(N, np.float32); Rr = np.zeros(N, np.float32)

    def put(t, x, g=1.0, pan=0.0):
        i = int(max(0, t) * SR)
        if i >= N: return
        m = min(len(x), N - i); x = x[:m] * g
        L[i:i + m] += x * np.cos((pan + 1) * np.pi / 4) * 1.41; Rr[i:i + m] += x * np.sin((pan + 1) * np.pi / 4) * 1.41

    def at(a, off=0.0):
        if a == "end": return tl["total"] + off
        if a == "outro": return tl["outro"]["start"] + off
        if a.startswith("chap:"): return next(c["start"] for c in tl["chapters"] if c["id"] == a[5:]) + off
        return seg[a]["start"] + off
    # beds: wind everywhere (a lot in the blizzard), fire in the cave scenes
    put(0.0, wind(tl["total"], 1.4), 1.0, 0.0)
    put(at("chap:w01"), wind(at("w14") - at("chap:w01"), 4.0), 1.0, 0.2)
    put(at("a10"), wind(at("a16") - at("a10"), 3.0), 1.0, -0.2)
    for a, b in [("f04", "f18"), ("m15", "m20"), ("w04", "w19"), ("s09", "s10"), ("y05b", "y07d"), ("r12", "r25")]:
        t0, t1 = at(a), at(b); put(t0, crackle(t1 - t0 + 1, 1.3), 1.0, 0.1)
    # one-shots
    put(at("a12", 0.3), howl(), 0.6, -0.5); put(at("a13", 0.0), howl(3.0), 0.8, 0.4); put(at("f12", 0.5), howl(2.4), 0.5, -0.4)
    put(at("f03", 1.15), thunder(), 1.0)
    put(at("m08", 0.4), trumpet(), 0.9, 0.1); put(at("m04", 0.0), trumpet(1.8), 0.5, -0.3)
    for k in range(4): put(at("m09", 0.4 + k * 0.5), thud(0.9), 0.9, R.uniform(-0.5, 0.5))
    put(at("m14", 2.9), thud(1.0), 1.1); put(at("m14", 2.8), rumble(1.6, 0.8), 1.0)
    put(at("m09c", 0.0), growl(), 0.8, 0.2)
    for sid in ["m13", "w12"]: put(at(sid), dig(seg[sid]["dur"] + 0.4), 0.8)
    put(at("w09"), dig(seg["w09"]["dur"]), 0.6); put(at("f11"), dig(2.4), 0.5)
    put(at("chap:w01"), rumble(2.4, 0.6), 0.8)
    put(tl["events"][0]["start"], whoosh(1.2), 0.6)
    put(at("w17", -0.2), whoosh(0.6), 0.4); put(at("r17", 0.0), ding(), 0.5) if False else None
    n = int(tl["total"] * SR)
    os.makedirs(os.path.join(SCRATCH, "audio_pre"), exist_ok=True)
    sf.write(os.path.join(SCRATCH, "audio_pre", "sfx.wav"), np.stack([L[:n], Rr[:n]], 1).astype(np.float32), SR, subtype="FLOAT")
    print("sfx.wav", n / SR)


if __name__ == "__main__":
    main()
