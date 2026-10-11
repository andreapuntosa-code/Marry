# -*- coding: utf-8 -*-
"""Procedural sound effects for the kids video: pops when a word or picture appears, boings for the jumps, an
ascending chime for each number, ta-da + sparkles for every "well done", a whoosh on chapter cards, claps, the
rocket, the mammoth's trumpet, birdsong in the daytime and crickets at night."""
import os, json
import numpy as np
import soundfile as sf
import music as M
import sfx as FX
from music import SR, lowpass, highpass, bandpass
import wordtimes

HERE = os.path.dirname(os.path.abspath(__file__))
SCRATCH = os.environ.get("SCRATCH", "/tmp/claude-0/-home-user-Marry/e61fd834-a8c5-5cc5-8204-6c637a41951f/scratchpad")
OUT = os.path.join(SCRATCH, "audio_kids")
R = np.random.default_rng(3)
tt = lambda d: np.arange(int(d * SR)) / SR


def pop(f0=700, f1=1500, d=0.09):
    t = tt(d); f = f0 + (f1 - f0) * (t / d) ** 0.6
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.03) * 0.8


def boing(f0=260, d=0.45):
    t = tt(d); f = f0 * (1 + 0.6 * np.exp(-t / 0.08)) * (1 + 0.08 * np.sin(2 * np.pi * 18 * t) * np.exp(-t / 0.2))
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.14) * 0.7


def chime(m):
    return M.bell(m, 1.6, 0.7, ratio=2.0, index=0.8) * 0.9


def tada():
    out = np.zeros(int(2.2 * SR))
    for k, (m, t0, d) in enumerate([(72, 0.0, 0.16), (79, 0.16, 1.2)]):
        t = tt(d + 0.3); f = 440 * 2 ** ((m - 69) / 12)
        y = sum(np.sin(2 * np.pi * f * h * t) / h for h in range(1, 7)) * np.minimum(1, t / 0.015) * np.exp(-np.maximum(0, t - d) / 0.12)
        i = int(t0 * SR); out[i:i + len(y)] += lowpass(y, 2600) * 0.35
    for k, m in enumerate([91, 96, 98, 103]):
        y = M.bell(m, 0.8, 0.4); i = int((0.25 + k * 0.06) * SR); out[i:i + len(y)] += y[:len(out) - i] * 0.25
    return out


def sparkle():
    out = np.zeros(int(1.2 * SR))
    for k, m in enumerate([96, 100, 103, 108, 103]):
        y = M.bell(m, 0.6, 0.35); i = int(k * 0.05 * SR); out[i:i + len(y)] += y[:len(out) - i] * 0.3
    return out


def clap():
    t = tt(0.12); x = bandpass(R.standard_normal(len(t)), 1400, 1800) * np.exp(-t / 0.02)
    return x * 1.2


def trumpet(d=1.4):
    t = tt(d); f = 330 * (1 + 0.25 * np.minimum(1, t / 0.25)) * (1 + 0.012 * np.sin(2 * np.pi * 6 * t))
    ph = 2 * np.pi * np.cumsum(f) / SR
    y = sum(np.sin(ph * h) / h for h in range(1, 10))
    y = bandpass(y, 900, 900) * np.minimum(1, t / 0.05) * np.exp(-np.maximum(0, t - d + 0.3) / 0.12)
    return y * 0.6


def rocket(d=2.0):
    t = tt(d); nz = R.standard_normal(len(t)); x = (lowpass(nz, 900) * (1 - t / d) + lowpass(nz, 3500) * (t / d)) * np.minimum(1, t / 0.1) * np.exp(-np.maximum(0, t - d * 0.6) / 0.4)
    return x * 0.5


def build(tl):
    total = tl["total"]; T = M.Track(total + 4)
    add = lambda t, y, g, pan=0.0: T.add(t, mono=y, gain=g, pan=pan)
    seg = {s["id"]: s for s in tl["segments"]}
    for c in tl["chapters"]:
        add(c["start"] - 0.25, FX.whoosh(0.5, 1.0, True), 0.45); add(c["start"] + 0.1, pop(500, 1300, 0.12), 0.4)
    ev = tl["events"][0]; add(ev["start"] + 0.5, sparkle(), 0.5)
    pent = [72, 74, 76, 79, 81, 84, 86, 88, 91, 93]
    for s in tl["segments"]:
        g = s.get("gfx") or {}; typ = g.get("type"); st = s["start"]
        if typ == "color" and s["id"].endswith("a"): add(st, pop(), 0.5)
        if typ == "say": add(st, pop(900, 1700, 0.07), 0.35)
        if typ == "star": add(st, tada(), 0.5)
        if typ == "found": add(st, sparkle(), 0.55)
        if typ == "find": add(st, pop(600, 1200), 0.4)
        if typ == "num" and not g.get("hold"):
            n = g["n"]; add(st + 0.45, boing(240 + 12 * n), 0.4); add(st, chime(pent[n - 1]), 0.45)
        if g.get("hold"): add(st, tada(), 0.55)
        if typ == "animal" and s["id"].endswith("a"): add(st, pop(500, 1000, 0.1), 0.4)
        if typ == "sound": add(st, pop(400, 900, 0.1), 0.3)
        if typ == "opp" and s["id"] in ("o01", "o03", "o05", "o07", "o10"): add(st, pop(), 0.35)
        if typ in ("claps", "countdown", "count3", "rainbow"):
            for wi, (w, wt) in enumerate(wordtimes.word_times(s["id"])):
                if typ == "claps": add(st + wt, clap(), 0.6); add(st + wt + 0.13, clap(), 0.4)
                elif typ == "countdown": add(st + wt, chime(pent[max(0, 9 - wi)]), 0.3)
                elif typ == "count3" and w.strip(".!").lower() in ("one", "two", "three"): add(st + wt, pop(600 + 200 * ["one", "two", "three"].index(w.strip(".!").lower()), 1500), 0.45)
                elif typ == "rainbow": add(st + wt, pop(700, 1400, 0.06), 0.25)
        if typ == "blast": add(st, rocket(2.2), 0.6); add(st, M.boom(0.8), 0.4)
        if typ == "dance": add(st, pop(500, 1500, 0.1), 0.4)
    # the mammoth's trumpet under the narrator's "Pa-woo"
    add(seg["a7c"]["start"] - 0.05, trumpet(1.5), 0.35)
    # claps for the child ("give yourself a big clap") and the dancers
    for k in range(10): add(seg["g03"]["start"] + seg["g03"]["dur"] + 0.1 + k * 0.22 + R.uniform(0, 0.03), clap(), 0.35)
    for sid in ("d02",):
        for k in range(8): add(seg[sid]["start"] + seg[sid]["dur"] + k * 0.27, clap(), 0.4)
    # ambience: birds all day, crickets at night (o11), a soft farm breeze
    night0, night1 = seg["o11"]["start"] + 2.0, seg["h00"]["start"] - 3.0
    day = FX.birds(total, 0.5) * 0.35
    n = len(day); k0, k1 = int(night0 * SR), int(night1 * SR)
    day[k0:k1] *= 0.0
    T.add(0, mono=day, gain=0.5)
    T.add(night0, mono=FX.crickets(night1 - night0 + 3.0, 0.8), gain=0.25)
    L, Rr = T.L, T.R
    nn = int(total * SR); out = np.stack([L[:nn], Rr[:nn]], 1)
    return (out / (np.abs(out).max() + 1e-9) * 0.9).astype(np.float32)


if __name__ == "__main__":
    tl = json.load(open(os.path.join(HERE, "timeline.json")))
    os.makedirs(OUT, exist_ok=True)
    y = build(tl)
    sf.write(os.path.join(OUT, "sfx.wav"), y, SR, subtype="FLOAT")
    print("sfx.wav", len(y) / SR, "s")
