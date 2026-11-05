# -*- coding: utf-8 -*-
"""
Procedural sound design (all synthesized here — no recordings, no third-party audio):
ambience beds chosen per shot (day wind & birds, night crickets, storm rain, the creator's
room tone), plus spot effects tied to shots and story beats (fire, crowds, wolves, goats,
thunder, the flash, stones in bowls, spears dropping, UI beeps, whooshes on graphics).

  python3 sfx.py   ->  scratchpad/audio/sfx.wav (48 kHz stereo float)
"""
import os, json, math
import numpy as np
import soundfile as sf
from scipy import signal
from music import SR, lowpass, highpass, bandpass, Track, reverb_ir, osc, SAW, mtof

HERE = os.path.dirname(os.path.abspath(__file__))
SCRATCH = os.environ.get("SCRATCH", "/tmp/claude-0/-home-user-Marry/e61fd834-a8c5-5cc5-8204-6c637a41951f/scratchpad")
OUT = os.path.join(SCRATCH, "audio")
R = np.random.default_rng(77)


def noise(n):
    return R.standard_normal(n)


def pink(n):
    w = noise(n)
    b, a = [0.049922035, -0.095993537, 0.050612699, -0.004408786], [1, -2.494956002, 2.017265875, -0.522189400]
    return signal.lfilter(b, a, w) * 3.5


def brown(n):
    x = np.cumsum(noise(n)) * 0.02
    return highpass(x - np.mean(x), 20)


def fade(x, fi=0.5, fo=0.5):
    n = len(x); a, b = int(fi * SR), int(fo * SR)
    if a: x[:min(a, n)] *= np.linspace(0, 1, min(a, n))
    if b: x[-min(b, n):] *= np.linspace(1, 0, min(b, n))
    return x


def slowmod(n, rate=0.15, depth=0.5):
    t = np.arange(n) / SR
    m = 1 + depth * (np.sin(2 * np.pi * rate * t + R.random() * 6) * 0.6 + np.sin(2 * np.pi * rate * 2.3 * t + R.random() * 6) * 0.4)
    return m


# ------------------------------------------------------------------ beds
def wind(d, level=1.0, bright=600):
    n = int(d * SR)
    x = lowpass(pink(n), bright) * slowmod(n, 0.12, 0.6)
    return fade(x * 0.35 * level, 1.0, 1.0)


def birds(d, density=0.6):
    n = int(d * SR); y = np.zeros(n)
    t = 0.3
    while t < d - 0.5:
        k = int(t * SR)
        f0 = 2400 + R.random() * 2600; m = 1 + int(R.random() * 4)
        for j in range(m):
            ln = int((0.05 + R.random() * 0.08) * SR); tt = np.arange(ln) / SR
            f = f0 * (1 + 0.35 * np.sin(np.pi * tt / tt[-1]) * (1 if R.random() < 0.5 else -1))
            ch = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * tt / tt[-1]) ** 2
            s = k + int(j * 0.11 * SR)
            if s + ln < n:
                y[s:s + ln] += ch * (0.25 + 0.2 * R.random())
        t += (0.6 + R.random() * 2.5) / density
    return y * 0.25


def crickets(d, level=1.0):
    n = int(d * SR); t = np.arange(n) / SR
    y = np.zeros(n)
    for k in range(3):
        f = 4200 + k * 380 + R.random() * 200
        rate = 2.6 + R.random() * 1.2
        gate = (np.sin(2 * np.pi * rate * t + R.random() * 6) > 0.55).astype(float)
        puls = (np.sin(2 * np.pi * 32 * t) > 0).astype(float)
        y += np.sin(2 * np.pi * f * t) * gate * puls * (0.5 + 0.5 * R.random())
    y = lowpass(y, 7000)
    return fade(y * 0.03 * level, 0.8, 0.8)


def rain(d, heavy=1.0):
    n = int(d * SR)
    x = bandpass(noise(n), 3500, 6000) * 0.25 + lowpass(pink(n), 900) * 0.25 * heavy
    drops = np.zeros(n); idx = R.integers(0, n, int(d * 120 * heavy))
    drops[idx] = R.random(len(idx)) * 1.5
    x += bandpass(drops, 3000, 3000) * 0.6
    return fade(x * 0.5 * heavy, 0.8, 0.8)


def fire_bed(d, level=1.0):
    n = int(d * SR)
    roar = lowpass(brown(n), 500) * 0.5
    cr = np.zeros(n); idx = R.integers(0, n, int(d * 18)); cr[idx] = R.random(len(idx)) ** 2 * 3
    cr = bandpass(cr, 2500, 3500)
    pops = np.zeros(n); idx = R.integers(0, n, int(d * 1.5)); pops[idx] = 4
    pops = bandpass(pops, 900, 1200)
    return fade((roar + cr * 0.5 + pops * 0.4) * 0.4 * level, 0.4, 0.6)


def crowd(d, level=1.0, excite=0.0, voices=26):
    n = int(d * SR); t = np.arange(n) / SR
    y = np.zeros(n)
    base = pink(n)
    for v in range(voices):
        f = 350 + R.random() * 1600
        band = bandpass(np.roll(base, R.integers(0, n)), f, f * 0.5)
        syl = 0.5 + 0.5 * np.sin(2 * np.pi * (3 + R.random() * 3) * t + R.random() * 6)
        env = np.clip(np.sin(2 * np.pi * (0.1 + R.random() * 0.2) * t + R.random() * 6) + 0.3, 0, 1)
        y += band * syl ** 2 * env
    y = y / voices * 3.0 * (1 + excite * 1.5)
    if excite:
        y += bandpass(pink(n), 900, 1400) * excite * 0.6 * slowmod(n, 0.5, 0.4)
    return fade(y * 0.6 * level, 0.6, 0.8)


def room_tone(d):
    n = int(d * SR); t = np.arange(n) / SR
    hum = np.sin(2 * np.pi * 60 * t) * 0.015 + np.sin(2 * np.pi * 120 * t) * 0.006
    fan = lowpass(pink(n), 1200) * 0.05
    return fade(hum + fan, 0.3, 0.3)


def river(d, level=1.0):
    n = int(d * SR)
    x = bandpass(pink(n), 1100, 1800) * slowmod(n, 0.4, 0.3) * 0.4 + lowpass(brown(n), 300) * 0.3
    return fade(x * level, 0.6, 0.6)


def march(d, bpm=96, level=1.0):
    n = int(d * SR); y = np.zeros(n)
    step = 60 / bpm / 2
    t = 0.0
    while t < d:
        k = int(t * SR); ln = int(0.12 * SR)
        if k + ln < n:
            tt = np.arange(ln) / SR
            y[k:k + ln] += lowpass(noise(ln), 400) * np.exp(-tt / 0.03) * (0.6 + 0.4 * R.random())
        t += step * (0.92 + 0.16 * R.random())
    return fade(y * 0.5 * level, 0.5, 0.5)


# ------------------------------------------------------------------ spot effects
def thunder(level=1.0, dist=0.3):
    n = int(5.5 * SR); t = np.arange(n) / SR
    x = lowpass(noise(n), 600 - 300 * dist) * np.exp(-t / 1.4)
    crack = highpass(noise(n), 1500) * np.exp(-t / 0.08) * (1 - dist)
    rumble = sum(np.roll(lowpass(noise(n), 200) * np.exp(-t / 0.8), int(R.random() * SR * 1.2)) for _ in range(4))
    return (x * 0.8 + crack * 0.6 + rumble * 0.25) * level


def howl(level=1.0, f0=420):
    d = 3.2; n = int(d * SR); t = np.arange(n) / SR
    f = f0 * (1 + 0.55 * np.sin(np.pi * np.clip(t / 1.2, 0, 1) * 0.5)) * (1 - 0.18 * np.clip((t - 1.8) / 1.4, 0, 1))
    f = f * (1 + 0.012 * np.sin(2 * np.pi * 5.5 * t))
    ph = np.cumsum(f) / SR * 2 * np.pi
    y = np.sin(ph) + 0.35 * np.sin(2 * ph) + 0.12 * np.sin(3 * ph)
    env = np.clip(t / 0.35, 0, 1) * np.clip((d - t) / 0.9, 0, 1)
    y = y * env + bandpass(noise(n), 900, 800) * env * 0.05
    return y * 0.25 * level


def bleat(level=1.0, f0=430):
    d = 0.7; n = int(d * SR); t = np.arange(n) / SR
    f = f0 * (1 + 0.06 * np.sin(2 * np.pi * 22 * t)) * (1 - 0.15 * t)
    x = osc(f, n, SAW[2])
    y = bandpass(x, 600, 300) * 1.0 + bandpass(x, 1800, 500) * 0.6 + bandpass(x, 2600, 600) * 0.3
    env = np.clip(t / 0.04, 0, 1) * np.clip((d - t) / 0.2, 0, 1)
    return y * env * 0.9 * level


def stone_click(level=1.0):
    n = int(0.12 * SR); t = np.arange(n) / SR
    f = 2200 + R.random() * 1800
    return (np.sin(2 * np.pi * f * t) * np.exp(-t / 0.012) + lowpass(noise(n), 1200) * np.exp(-t / 0.02) * 0.6) * 0.5 * level


def clank(level=1.0):
    n = int(1.2 * SR); t = np.arange(n) / SR
    y = sum(np.sin(2 * np.pi * f * t + R.random()) * np.exp(-t / dcy) * a for f, dcy, a in [(523, 0.5, 0.5), (1371, 0.3, 0.35), (2210, 0.2, 0.25), (3870, 0.1, 0.2)])
    thud = lowpass(noise(n), 300) * np.exp(-t / 0.05)
    return (y * 0.6 + thud * 0.8) * level


def clink(level=1.0):
    n = int(1.5 * SR); t = np.arange(n) / SR
    y = sum(np.sin(2 * np.pi * f * t + R.random()) * np.exp(-t / dcy) * a for f, dcy, a in [(1870, 0.7, 0.5), (3120, 0.5, 0.4), (5230, 0.3, 0.25)])
    return y * 0.4 * level


def whoosh(d=0.45, level=1.0, up=True):
    n = int(d * SR); t = np.arange(n) / SR
    x = noise(n); out = np.zeros(n); seg = SR // 50
    for i in range(0, n, seg):
        u = i / n; u = u if up else 1 - u
        fc = 400 * (12 ** u)
        out[i:i + seg] = bandpass(x[i:i + seg + 100], fc, fc)[:len(out[i:i + seg])]
    env = np.sin(np.pi * t / d) ** 1.5
    return out * env * 0.5 * level


def flash_fx(level=1.0):
    pre = whoosh(1.0, 0.8, True)
    n = int(3.0 * SR); t = np.arange(n) / SR
    ring = np.sin(2 * np.pi * 2960 * t) * np.exp(-t / 0.9) * 0.08 + np.sin(2 * np.pi * 4440 * t) * np.exp(-t / 0.6) * 0.05
    thump = np.sin(2 * np.pi * np.cumsum(48 * (1 + 2 * np.exp(-t / 0.05))) / SR) * np.exp(-t / 0.5) * 0.7
    return np.concatenate([pre, ring + thump]) * level, len(pre) / SR


def beep(f=1320, d=0.09, level=1.0):
    n = int(d * SR); t = np.arange(n) / SR
    return np.sin(2 * np.pi * f * t) * np.clip(t / 0.005, 0, 1) * np.clip((d - t) / 0.01, 0, 1) * 0.25 * level


def keys(d, rate=9, level=1.0):
    n = int(d * SR); y = np.zeros(n); t = 0.05
    while t < d - 0.1:
        k = int(t * SR); ln = int(0.03 * SR)
        y[k:k + ln] += bandpass(noise(ln), 2500 + R.random() * 2000, 2500) * np.exp(-np.arange(ln) / (0.004 * SR))
        t += (0.4 + R.random() * 1.2) / rate
    return y * 0.5 * level


def crunch(d, level=1.0):
    n = int(d * SR); y = np.zeros(n); t = 0.2
    while t < d - 0.3:
        for j in range(5):
            k = int((t + j * 0.035) * SR); ln = int(0.05 * SR)
            if k + ln < n:
                y[k:k + ln] += bandpass(noise(ln), 1800 + R.random() * 2500, 2400) * np.exp(-np.arange(ln) / (0.012 * SR)) * R.random()
        t += 0.55 + R.random() * 0.3
    return y * 0.6 * level


def lap(d, level=1.0):
    """small waves on a lake shore"""
    n = int(d * SR); t = np.arange(n) / SR
    base = lowpass(pink(n), 900) * 0.25
    y = np.zeros(n); k = 0.4
    while k < d - 0.5:
        ln = int((0.6 + R.random() * 0.8) * SR); tt = np.arange(ln) / SR
        w = bandpass(noise(ln), 700 + R.random() * 600, 900) * np.sin(np.pi * tt / tt[-1]) ** 2
        s0 = int(k * SR)
        if s0 + ln < n: y[s0:s0 + ln] += w * (0.4 + 0.4 * R.random())
        k += 1.2 + R.random() * 1.6
    return fade((base + y) * 0.5 * level, 0.8, 0.8)


def splash(level=1.0):
    n = int(0.35 * SR); t = np.arange(n) / SR
    return bandpass(noise(n), 1500, 2400) * np.exp(-t / 0.08) * 0.5 * level


def glitch(d=0.6, level=1.0):
    """digital corruption: bit-crushed noise bursts and a falling tone"""
    n = int(d * SR); t = np.arange(n) / SR
    x = noise(n)
    hold = 40 + int(R.random() * 80)
    x = np.repeat(x[::hold], hold)[:n]
    gate = (np.sin(2 * np.pi * (7 + R.random() * 9) * t) > 0.1).astype(float)
    tone = np.sign(np.sin(2 * np.pi * np.cumsum(900 * (1 - 0.6 * t / d)) / SR)) * 0.3
    return highpass((x * 0.5 + tone) * gate, 300) * np.exp(-t / (d * 0.7)) * 0.4 * level


def creak_fall(level=1.0):
    n = int(2.4 * SR); t = np.arange(n) / SR
    f = 140 + 60 * np.sin(2 * np.pi * 1.3 * t)
    cr = np.sign(np.sin(2 * np.pi * np.cumsum(f) / SR)) * (t < 1.6) * np.exp(-((t - 0.8) / 0.6) ** 2)
    th = np.zeros(n); i = int(1.7 * SR); m = n - i; tt = np.arange(m) / SR
    th[i:] = (np.sin(2 * np.pi * 55 * tt) * np.exp(-tt / 0.25) + lowpass(noise(m), 500) * np.exp(-tt / 0.12))
    return (lowpass(cr, 1200) * 0.25 + th * 0.9) * level


def battle(d, level=1.0):
    n = int(d * SR); y = crowd(d, 1.2, excite=1.0, voices=40) * 0.8
    t = 0.2
    while t < d - 0.3:
        c = clank(0.5 + R.random() * 0.5); s0 = int(t * SR)
        if s0 + len(c) < n: y[s0:s0 + len(c)] += c * 0.5
        t += 0.1 + R.random() * 0.35
    return y * level


def boom_low(level=1.0):
    n = int(4.0 * SR); t = np.arange(n) / SR
    f = 38 * (1 + 1.4 * np.exp(-t / 0.08))
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 1.1) * 0.8 * level


# ------------------------------------------------------------------ the plan
def build(tl, shots=None):
    T = Track(tl['total'] + 2)
    seg = {s['id']: s for s in tl['segments']}
    chap = {c['id']: c for c in tl['chapters']}
    total = tl['total']

    def at(a, off=0.0):
        if a == 'start': return off
        if a == 'title': return tl['events'][0]['start'] + off
        if a == 'outro': return tl['outro']['start'] + off
        if a == 'end': return total + off
        if a.startswith('chap:'): return chap[a[5:]]['start'] + off
        return seg[a]['start'] + off

    def bed(a0, a1, fn, gain, **kw):
        t0 = at(a0) - 0.3; d = at(a1) - t0 + 0.6
        T.add(t0, fn(d, **kw) if kw else fn(d), gain=gain, pan=R.random() * 0.4 - 0.2)

    # ---- ambience: forest chapters wind+birds; plain chapters wind; nights crickets; war battle
    bed('title', 'chap:n01', wind, 0.45)
    bed('chap:r01', 'chap:n01', birds, 0.4)
    bed('chap:n01', 'n24', crickets, 0.8); bed('chap:n01', 'n24', wind, 0.45, level=0.5, bright=450)
    bed('n24', 'chap:s01', wind, 0.45); bed('n24', 'chap:s01', birds, 0.45)
    bed('chap:s01', 'chap:g01', wind, 0.4); bed('chap:s01', 'chap:g01', birds, 0.4)
    bed('chap:g01', 'chap:v01', wind, 0.45)
    bed('chap:v01', 'chap:u01', wind, 0.4); bed('chap:v01', 'chap:u01', birds, 0.35)
    bed('chap:u01', 'chap:k01', wind, 0.5, level=0.9, bright=500)
    bed('chap:k01', 'chap:c01', wind, 0.45)
    bed('chap:c01', 'chap:p01', wind, 0.4); bed('chap:c01', 'chap:p01', birds, 0.3)
    bed('chap:p01', 'chap:w01', crickets, 0.7); bed('chap:p01', 'chap:w01', wind, 0.4, level=0.6, bright=450)
    bed('chap:w01', 'w08', wind, 0.5, level=1.0, bright=500)
    bed('w08', 'w40', wind, 0.35)
    bed('w40', 'w57', wind, 0.4)
    bed('w57', 'chap:e01', wind, 0.5, level=0.9, bright=420)
    bed('chap:e01', 'outro', wind, 0.45, level=0.8, bright=450)
    bed('chap:e01', 'outro', crickets, 0.45)
    # ---- fires, crowds, rivers, marching
    for a, b in [('n05', 'n24'), ('s05', 's12'), ('g07', 'g10'), ('p04', 'p15')]:
        bed(a, b, fire_bed, 0.5)
    for a, b, k in [('n24', 'n25', 0.8), ('n25', 'chap:s01', 0.8), ('g19', 'chap:v01', 0.8), ('v06', 'v12', 0.9), ('v19', 'v22', 1.0), ('k05', 'k10', 1.1), ('k17', 'k22', 1.0), ('p08', 'p12', 0.9)]:
        bed(a, b, crowd, 0.4, level=k)
    bed('v10', 'v12', march, 0.5)
    bed('u16', 'u21', crowd, 0.4, level=0.7)
    for a, b in [('c01', 'c14'), ('c21', 'c26'), ('w40', 'w48'), ('e08', 'e12')]:
        bed(a, b, river, 0.5)
    bed('w01', 'w03', crowd, 0.2, level=0.4)
    bed('w08', 'w10', march, 0.9, bpm=100, level=1.2)
    bed('w09', 'w12', march, 0.8, bpm=110, level=1.2)
    bed('w08', 'w19', battle, 0.55)
    bed('w22', 'w29', battle, 0.5)
    bed('w42', 'w49', battle, 0.55)
    bed('w56', 'w57', battle, 0.15)
    bed('p02', 'p08', fire_bed, 0.3)
    # ---- spot effects
    for sid, o in [('g02', 1.0), ('g03', 0.5), ('g04', 0.5), ('g05', 1.0)]:
        T.add(at(sid, o), thunder(1.0, 0.0), gain=0.9)
    T.add(at('n06', 0.2), howl(1.0, 410), gain=0.55, pan=0.3)
    T.add(at('n07', 0.5), howl(0.7, 450), gain=0.4, pan=-0.4)
    T.add(at('u18', 0.5), howl(0.6, 420), gain=0.3, pan=0.5)
    for sid in ['n10', 'n20', 's20', 'g16']:
        T.add(at(sid, 0.6), thunder(0.5, 0.7), gain=0.4, pan=R.random() - 0.5)
    for sid in ['s05', 's06', 's11', 's15', 'p09', 'w06']:
        T.add(at(sid, 0.8), clink(1.0), gain=0.35, pan=R.random() - 0.5)
    for sid in ['s12', 's13']:
        t = at(sid, 0.3)
        for k in range(8):
            T.add(t, clank(0.5 + R.random() * 0.5), gain=0.35, pan=R.random() - 0.5); t += 0.35 + R.random() * 0.4
    T.add(at('w03', 0.0), whoosh(2.0, 0.6, True), gain=0.4)
    for k in range(8):
        T.add(at('w03', 0.2 + k * 0.5), stone_click(0.8 + R.random() * 0.5), gain=0.5, pan=R.random() - 0.5)
    T.add(at('w04', 0.0), thunder(1.2, 0.0), gain=1.0); T.add(at('w04', 0.2), boom_low(1.0), gain=0.8)
    for k in range(10):
        T.add(at('w04', 0.3 + k * 0.28), stone_click(1.0), gain=0.5, pan=R.random() - 0.5)
        T.add(at('w04', 0.4 + k * 0.28), boom_low(0.4), gain=0.35)
    T.add(at('w07', 0.3), whoosh(1.2, 0.6, True), gain=0.5)          # the horn
    t = at('w12', 0.2)
    for k in range(18):
        T.add(t, whoosh(0.3, 0.5, True), gain=0.25, pan=R.random() - 0.5); t += 0.1 + R.random() * 0.15
    t = at('w14', 0.1)
    for k in range(14):
        T.add(t, bleat(0.9, 360 + R.random() * 140), gain=0.35, pan=R.random() - 0.5)
        T.add(t + 0.1, creak_fall(0.6), gain=0.3, pan=R.random() - 0.5); t += 0.5 + R.random() * 0.5
    T.add(at('w28', 0.3), creak_fall(1.0), gain=0.8); T.add(at('w29', 0.1), splash(1.0), gain=0.4)
    T.add(at('w29', 0.2), boom_low(0.8), gain=0.5)
    T.add(at('w38', 0.2), boom_low(0.6), gain=0.5)
    T.add(at('w45', 0.3), splash(1.0), gain=0.5)
    for k in range(10):
        T.add(at('w54', 0.2 + k * 0.5), clank(0.5 + R.random() * 0.5), gain=0.4, pan=R.random() * 0.4 - 0.2)
    T.add(at('w54', 4.5), boom_low(1.0), gain=0.6)
    T.add(at('w63', 0.8), whoosh(2.5, 0.6, True), gain=0.3)          # the horns
    T.add(at('e05', 0.0), boom_low(1.0), gain=0.6)
    # chapter cards: a deep boom
    for c in tl['chapters']:
        T.add(c['start'], boom_low(0.8), gain=0.45); T.add(c['start'] - 0.45, whoosh(0.45, 0.6), gain=0.3)
    # whooshes on name cards and big captions
    import graphics_plan as GP
    for kind, anchor, dur, p in GP.EVENTS:
        if kind in ('name', 'caption', 'rule', 'place', 'peoples', 'winner'):
            t = seg[anchor]['start'] + p.get('delay', 0.0)
            T.add(t - 0.12, whoosh(0.35, 0.5, True), gain=0.25, pan=-0.3 if kind == 'name' and p.get('side') == 'left' else 0.3 if kind == 'name' else 0)
    return T


if __name__ == "__main__":
    os.makedirs(OUT, exist_ok=True)
    tl = json.load(open(os.path.join(HERE, "timeline.json")))
    T = build(tl)
    L, Rr = T.L.astype(np.float64), T.R.astype(np.float64)
    irL, irR = reverb_ir(1.6, 5)
    L = L + signal.fftconvolve(L, irL)[:len(L)] * 0.25
    Rr = Rr + signal.fftconvolve(Rr, irR)[:len(Rr)] * 0.25
    n = int(tl['total'] * SR)
    X = np.stack([L[:n], Rr[:n]], 1)
    rms = np.sqrt(np.mean(X ** 2)) + 1e-9
    X = X / rms * 10 ** (-27 / 20)                  # beds around -27 dBFS RMS before the mix
    X = np.tanh(X / 0.9) * 0.9                      # thunder & booms soft-limited
    sf.write(os.path.join(OUT, "sfx.wav"), X.astype(np.float32), SR, subtype='FLOAT')
    print("sfx.wav", n / SR)
