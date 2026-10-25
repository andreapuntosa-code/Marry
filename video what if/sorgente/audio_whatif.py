# -*- coding: utf-8 -*-
"""Music, sound effects and the final mix of one What-if Short (no samples: everything is synthesized).
Music: a curious minor pulse under the hook, a riser into the event, a hard cut to silence on the "it stops" line,
then a big hit and a driving section while the 10-second timer runs, a release when it ends, a sting on the follow
card. SFX follow the story (launch whooshes and supersonic wind, sparks and the planet-sized boom, the jump and the
splash, the clock ticking and the lights going out, skids and toppling wood)."""
import os, sys, json
import numpy as np
import soundfile as sf
from scipy import signal
import music as M
import sfx as FX
from music import SR, lowpass, highpass, bandpass

HERE = os.path.dirname(os.path.abspath(__file__))
SCRATCH = os.environ.get("SCRATCH", "/tmp/claude-0/-home-user-Marry/e61fd834-a8c5-5cc5-8204-6c637a41951f/scratchpad")
VOICE = os.path.join(SCRATCH, "voice_whatif")
R = np.random.default_rng(8)
tt = lambda d: np.arange(int(d * SR)) / SR
BPM = 120; B = 60 / BPM
ROOT = {"E": 45, "L": 43, "G": 47, "S": 41, "F": 46}
PROG = [(0, 3, 7), (-4, 0, 3), (-7, -3, 0), (-2, 2, 5)]          # i - VI - III? (minor loop: Am F C G shape)


def pulse(T, t0, t1, root, energy=1.0, mel=True):
    t, i = t0, 0
    motif = [0, 7, 12, 7, 3, 7, 10, 7]
    while t < t1 - 0.02:
        ch = PROG[(i // 8) % 4]; beat = i % 4
        T.add(t, mono=M.pluck(root - 12 + ch[0], 0.22, 0.7, 700), gain=0.26 * energy)                    # 8th-note bass
        if mel: T.add(t, mono=M.pluck(root + 12 + ch[0] + motif[i % 8], 0.3, 0.45, 2600), gain=0.06 * energy, pan=0.2 * ((i % 2) * 2 - 1))
        if i % 2 == 0:
            if beat in (0, 2): T.add(t, mono=M.kick(0.8), gain=0.30 * energy)
            if beat in (1, 3) and energy > 0.7: T.add(t, mono=M.snare(0.5), gain=0.12 * energy)
        T.add(t, mono=M.hat(0.25), gain=0.07 * energy)
        if i % 8 == 0:
            L, Rr = M.pad_note(root + ch[0], 4 * B, bright=1100); T.add(t, L=L, R=Rr, gain=0.07 * energy)
        t += B / 2; i += 1


def drive(T, t0, t1, root):
    """the event: four-on-the-floor, toms, brighter pads"""
    t, i = t0, 0
    while t < t1 - 0.02:
        ch = PROG[(i // 8) % 4]
        T.add(t, mono=M.pluck(root - 12 + ch[0], 0.2, 0.9, 900), gain=0.3)
        if i % 2 == 0: T.add(t, mono=M.kick(1.0), gain=0.36)
        if i % 4 == 2: T.add(t, mono=M.snare(0.7), gain=0.16)
        T.add(t + B / 4, mono=M.hat(0.3), gain=0.08)
        if i % 8 == 0:
            for m in ch: T.add(t, mono=M.pluck(root + 12 + m, 1.6, 0.5, 3500), gain=0.07)
            T.add(t, mono=M.taiko(0.6), gain=0.12)
        t += B / 2; i += 1


def hit(T, t, big=1.0):
    T.add(t, mono=M.boom(1.0 * big), gain=0.6); T.add(t, mono=M.timpani(45, 0.9), gain=0.3)
    T.add(max(0, t - 1.4), mono=M.reverse_cymbal(1.4, 0.5), gain=0.3)


def zap(d=0.25):
    t = tt(d); f = 2200 + 1800 * np.sin(2 * np.pi * 37 * t)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * (R.random(len(t)) > 0.4) * np.exp(-t / 0.08) * 0.5 + highpass(R.standard_normal(len(t)), 3000) * np.exp(-t / 0.05) * 0.4


def sweep(d=0.9, f0=900, f1=60):
    t = tt(d); f = f0 * (f1 / f0) ** (t / d)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / (d * 0.7)) * 0.6


def tick():
    t = tt(0.04); return highpass(R.standard_normal(len(t)), 2500) * np.exp(-t / 0.006) * 0.8


def thud(level=1.0):
    t = tt(0.3); return (np.sin(2 * np.pi * 70 * t * (1 - 0.4 * t)) * np.exp(-t / 0.08) + lowpass(R.standard_normal(len(t)), 500) * np.exp(-t / 0.03) * 0.5) * level


def skid(d=0.8):
    t = tt(d); return bandpass(R.standard_normal(len(t)), 1800, 900) * np.exp(-t / (d * 0.6)) * 0.4


def build(key):
    tl = json.load(open(os.path.join(HERE, f"timeline_{key}.json")))
    total = tl["total"]; N = int(total * SR)
    seg = {s["id"]: s for s in tl["segments"]}; at = lambda sid, off=0.0: seg[sid]["start"] + off
    T = M.Track(total + 3); X = M.Track(total + 3)
    root = ROOT[key]
    t_on = next(s["start"] for s in tl["segments"] if s["gfx"].get("timer") == "start")
    t_off = next((s["start"] for s in tl["segments"] if s["gfx"].get("timer") in ("end", "freeze")), total - 4)
    t_end = next(s["start"] for s in tl["segments"] if s["gfx"].get("end"))
    # ---- music
    pulse(T, 0.0, t_on - 0.05, root, 0.9)
    T.add(max(0, t_on - 2.4), mono=M.riser(2.4, 0.55), gain=0.3)
    hit(T, t_on + 0.45)
    drive(T, t_on + 0.45, t_off, root)
    hit(T, t_off, 0.8)
    pulse(T, t_off + 0.4, t_end, root, 0.6, mel=False)
    for k, m in enumerate([0, 7, 12, 15]): T.add(t_end + k * 0.08, mono=M.bell(root + 24 + m, 1.6, 0.5), gain=0.09)
    T.add(t_end, mono=M.kick(0.9), gain=0.3)
    # ---- whoosh into every 2D scene
    for s in tl["segments"]:
        pass
    # ---- story sfx
    add = lambda t, y, g, pan=0.0: X.add(t, mono=y, gain=g, pan=pan)
    if key == "E":
        add(at("E05", 0.3), FX.whoosh(0.7, 1.2, True), 0.7); X.add(at("E05"), mono=FX.wind(at("E10") - at("E05"), 1.6, 1400), gain=1.0)
        add(at("E07", 0.2), FX.boom_low(1.0), 0.6); add(at("E07", 0.2), FX.thunder(0.8, 0.1), 0.4)
        add(at("E09"), FX.river(4.0, 1.4), 0.6); add(at("E09", 0.5), FX.boom_low(0.6), 0.4)
        X.add(at("E10"), mono=FX.wind(at("E11") - at("E10"), 0.4, 500), gain=0.6)
        add(at("E11", 0.15), FX.whoosh(0.7, 1.2, True), 0.7); X.add(at("E11"), mono=FX.wind(at("E12") - at("E11"), 1.4, 1400), gain=0.9)
        for k in range(4): add(at("E12", 0.1 + k * 0.18), thud(0.8), 0.5)
    if key == "L":
        for k in range(10): add(at("L05", 0.3 + k * 0.35 + R.uniform(0, 0.2)), zap(0.2), 0.25)
        for k in range(26): add(at("L06", k * 0.18 + R.uniform(0, 0.1)), zap(0.3), 0.3 + 0.02 * k)
        add(at("L06", 2.3), FX.whoosh(0.6, 1.3, True), 0.6)
        add(at("L07", 2.0), FX.boom_low(1.0), 0.9); add(at("L07", 2.0), FX.thunder(1.0, 0.0), 0.6); add(at("L08"), FX.whoosh(1.2, 1.0, False), 0.5)
        for k in range(8): add(at("L09", k * 0.5), tick(), 0.4)
    if key == "G":
        add(at("G02", 0.3), sweep(1.6, 200, 900), 0.15)
        add(at("G05", 0.2), FX.whoosh(1.2, 0.8, True), 0.5); add(at("G07", 0.5), FX.splash(0.3) * 0, 0)
        t = tt(0.06); popf = np.sin(2 * np.pi * 900 * t) * np.exp(-t / 0.01); add(at("G07", 1.0), popf, 0.5); add(at("G07", 1.4), popf, 0.5)
        for k in range(5): add(at("G09", 0.6 + k * 0.05), thud(0.7), 0.45)
        add(at("G09", 2.6 + 1.7), FX.splash(1.0), 0.8); add(at("G09", 2.6), FX.whoosh(1.6, 1.0, False), 0.5)
    if key == "S":
        t = at("S02")
        while t < at("S05", 1.5): add(t, tick(), 0.35); t += 0.5
        add(at("S05", 1.45), sweep(1.0, 700, 50), 0.6); add(at("S05", 1.45), FX.boom_low(0.6), 0.4)
        X.add(at("S05", 1.6), mono=FX.crickets(at("S08", 1.2) - at("S05", 1.6), 1.0), gain=0.6)
        add(at("S08", 1.15), sweep(0.7, 60, 900), 0.5)
        for k in range(3): add(at("S09", 0.3 + k * 0.8), FX.bleat(0.7, 380 + 60 * k), 0.4)
    if key == "F":
        add(at("F01", 0.6), skid(1.2), 0.5); add(at("F03", 1.0), skid(1.0), 0.5); add(at("F03", 2.3), thud(1.0), 0.6); add(at("F03", 2.6), thud(0.8), 0.5)
        add(at("F03b", 1.1), thud(1.0), 0.6); add(at("F04"), skid(2.5), 0.4); add(at("F04b"), skid(1.6), 0.5)
        add(at("F06", 0.7), FX.creak_fall(1.0), 0.7)
        for k in range(6): add(at("F06", 1.0 + k * 0.15), FX.clank(0.6) if hasattr(FX, "clank") else thud(0.5), 0.3)
        t = tt(0.08); add(at("F07", 1.2), np.sin(2 * np.pi * np.cumsum(500 + 2500 * t / 0.08) / SR) * np.exp(-t / 0.03), 0.5)
        st = at("F08") + 3.0
        for k in range(3): add(st + k * 0.06, thud(1.0), 0.6)
    # ---- voices
    voice = np.zeros(N, np.float32)
    for s in tl["segments"]:
        y, sr = sf.read(os.path.join(VOICE, s["id"] + ".wav"), dtype="float32")
        g = np.gcd(SR, sr); y = signal.resample_poly(y, SR // g, sr // g).astype(np.float32)
        y = y / (np.abs(y).max() + 1e-9) * (0.85 if s["voice"] == "narr" else 0.75)
        i = int(s["start"] * SR); m = min(len(y), N - i)
        if m > 0: voice[i:i + m] += y[:m]
    Lm, Rm = M.apply_reverb(T.L.astype(np.float64), T.R.astype(np.float64), wet=0.12)
    mus = np.stack([Lm[:N], Rm[:N]], 1); mus /= (np.abs(mus).max() + 1e-9)
    sfx = np.stack([X.L[:N], X.R[:N]], 1); sfx /= (np.abs(sfx).max() + 1e-9)
    act = (np.abs(voice) > 0.01).astype(np.float32); k = int(0.3 * SR)
    env = signal.fftconvolve(act, np.ones(k) / k, "same"); env = signal.fftconvolve((env > 0.03).astype(np.float32), np.ones(int(0.2 * SR)) / int(0.2 * SR), "same")
    mix = mus * (0.42 * (1 - 0.5 * env))[:, None] + sfx * (0.55 * (1 - 0.3 * env))[:, None] + voice[:, None]
    fade = np.clip((total - np.arange(N) / SR) / 0.5, 0, 1)[:, None]
    mix = mix * fade; mix = mix / (np.abs(mix).max() + 1e-9) * 0.9
    out = os.path.join(SCRATCH, f"whatif_{key}_mix.wav"); sf.write(out, mix.astype(np.float32), SR, subtype="FLOAT")
    return out


if __name__ == "__main__":
    for key in (sys.argv[1:] or ["E", "L", "G", "S", "F"]):
        print(build(key), flush=True)
