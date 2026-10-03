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


def boom_low(level=1.0):
    n = int(4.0 * SR); t = np.arange(n) / SR
    f = 38 * (1 + 1.4 * np.exp(-t / 0.08))
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 1.1) * 0.8 * level


# ------------------------------------------------------------------ the plan
def build(tl, shots):
    T = Track(tl['total'] + 2)
    seg = {s['id']: s for s in tl['segments']}
    chap = {c['id']: c for c in tl['chapters']}

    def at(anchor):
        if anchor == 'start': return 0.0
        if anchor == 'title': return tl['events'][0]['start']
        if anchor == 'outro': return tl['outro']['start']
        if anchor.startswith('chap:'): return chap[anchor[5:]]['start']
        if anchor.startswith('t:'): return float(anchor[2:])
        return seg[anchor]['start']
    for s in shots:
        s['start'] = at(s['at']) + s.get('off', 0)
    shots.sort(key=lambda s: s['start'])
    for i, s in enumerate(shots):
        s['end'] = shots[i + 1]['start'] if i + 1 < len(shots) else tl['total']
    S = {s['id']: s for s in shots}

    def span(ids):
        """merge contiguous shots into (t0, t1) spans"""
        sp = []
        for s in shots:
            if any(s['id'] == i or (i.endswith('*') and s['id'].startswith(i[:-1])) for i in ids):
                if sp and abs(sp[-1][1] - s['start']) < 0.05:
                    sp[-1][1] = s['end']
                else:
                    sp.append([s['start'], s['end']])
        return sp

    # ---- ambience beds by shot light (contiguous shots of the same kind share one bed)
    def amb(s):
        if s.get('kind') == '2d': return 'room'
        if s.get('interior'): return 'room'
        g = s.get('grade', 'day')
        if g == 'storm' or (s.get('storm') or 0) >= 0.5: return 'storm'
        if g == 'night': return 'night'
        if g == 'sad': return 'sad'
        return 'day_wild' if (s.get('year') or 0) < 1100 else 'day_town'
    spans = []
    for s in shots:
        a = amb(s)
        if spans and spans[-1][0] == a and abs(spans[-1][2] - s['start']) < 0.05:
            spans[-1][2] = s['end']
        else:
            spans.append([a, s['start'], s['end']])
    for a, t0, t1 in spans:
        t0 -= 0.3; d = t1 - t0 + 0.8
        if a == 'room':
            T.add(t0, room_tone(d), gain=0.9)
        elif a == 'storm':
            T.add(t0, rain(d, 1.0), gain=0.55); T.add(t0, wind(d, 1.2, 900), gain=0.5)
        elif a == 'night':
            T.add(t0, crickets(d), gain=0.8); T.add(t0, wind(d, 0.5, 450), gain=0.5)
        elif a == 'sad':
            T.add(t0, wind(d, 0.9, 500), gain=0.5)
        else:
            T.add(t0, wind(d, 0.7, 650), gain=0.45)
            if a == 'day_wild':
                T.add(t0, birds(d, 0.5), gain=0.5, pan=R.random() - 0.5)
            else:
                T.add(t0, crowd(d, 0.25), gain=0.3)
    # ---- fire, crowds, rivers, marching
    FIRE = ['op5a', 'op2', 'f14b', 'f15', 'f16', 'w_card', 'w01', 'w02a', 'w02b', 'w10', 'w11', 'w12', 'w16', 'a06', 'a16a', 'a16b', 'a17a', 'k03a', 'o03a', 'o03b', 'o04a', 'o04b', 'o06', 'o06L', 'o09', 'c01d',
            'd03c', 'd03L', 'd04', 'd07a', 'd07b', 'd15', 'x_card', 'x01', 'x03', 'x04', 'x05', 'x06', 'x06L', 'x07', 'x08', 'x09', 'x10', 'x11', 'x12', 'x12L', 'x13', 'x14', 'm05a', 'm05b', 'm06', 'm07', 'm08', 'm09', 'm10', 'm14',
            'f12b', 'f13', 'f14a']
    for t0, t1 in span(FIRE):
        T.add(t0, fire_bed(t1 - t0 + 0.4, 1.0), gain=0.55)
    CROWD = ['op2', 'c01f', 'c01g', 'c02c', 'c04a', 'c04L', 'o03a', 'o06', 'd09', 'd10', 'd11a', 'm01', 'x05', 'x06', 'x06L', 'x13', 'x18', 'x18b', 'm03b', 'm05a', 'x02b', 'x02a']
    for t0, t1 in span(CROWD):
        T.add(t0, crowd(t1 - t0 + 0.5, 0.9), gain=0.5)
    for t0, t1 in span(['x11']):
        T.add(t0, crowd(t1 - t0 + 0.5, 1.2, excite=1.0), gain=0.6)
    for t0, t1 in span(['x18', 'o03a']):
        T.add(t0, crowd(t1 - t0 + 0.5, 1.0, excite=0.7), gain=0.45)
    for t0, t1 in span(['a09a', 'k01a', 'k01b', 'k02', 'o01c', 'c12c', 'c12d', 'c02b', 'x19', 'k15b']):
        T.add(t0, river(t1 - t0 + 0.4), gain=0.45)
    for t0, t1 in span(['x02a', 'x02b', 'x02c']):
        T.add(t0, march(t1 - t0 + 0.4), gain=0.6)
    for t0, t1 in span(['k17', 'k18', 'k19']):
        T.add(t0, lowpass(brown(int((t1 - t0 + 1) * SR)), 180) * 0.8, gain=0.6)
    # ---- spot effects
    def S0(i, off=0.0):
        return S[i]['start'] + off
    T.add(S0('f12a', 1.5), thunder(1.0, 0.0), gain=0.9)
    for i, o in [('f11', 1.5), ('k16', 1.0), ('k17', 1.2), ('k17', 3.0), ('c12d', 1.0), ('d16', 1.5)]:
        T.add(S0(i, o), thunder(0.6, 0.7), gain=0.6, pan=R.random() - 0.5)
    T.add(S0('f02', 2.4), howl(1.0, 410), gain=0.55, pan=0.3)
    T.add(S0('f02', 0.3), howl(0.5, 470), gain=0.35, pan=-0.5)
    T.add(S0('f03', 0.25), howl(1.2, 430), gain=0.7)
    T.add(S0('f04', 1.5), howl(0.4, 390), gain=0.3, pan=0.6)
    for i, o, f in [('a02a', 1.0, 440), ('a03', 0.8, 470), ('a03', 2.2, 410), ('a04a', 1.2, 450), ('a05', 0.7, 400), ('a05', 1.9, 420), ('a06', 1.4, 380), ('x02c', 0.6, 450), ('x02c', 1.6, 420), ('a16c', 0.3, 400)]:
        T.add(S0(i, o), bleat(1.0, f), gain=0.45, pan=R.random() * 0.6 - 0.3)
    for i in ['d05b', 'd07b', 'x13']:
        s = S[i]; d = s['end'] - s['start']; k = 0
        t = s['start'] + 0.2
        while t < s['end'] - 0.1:
            T.add(t, stone_click(0.5 + R.random() * 0.5), gain=0.35, pan=R.random() - 0.5)
            t += 0.05 + R.random() * (0.25 if i != 'x13' else 0.03); k += 1
    T.add(S0('d06', 1.15), stone_click(1.2), gain=0.6)
    T.add(S0('x08', 1.0), clank(1.0), gain=0.6)
    s = S['x09']; t = s['start'] + 0.5
    for k in range(18):
        T.add(t, clank(0.6 + R.random() * 0.4), gain=0.35, pan=R.random() - 0.5); t += 0.12 + R.random() * 0.2
    T.add(S0('x15a', 2.3), clink(1.0), gain=0.5)
    for i, o in [('o03a', 2.7), ('o05', 0.4), ('o10', 0.3), ('m02', 1.3), ('m10', 3.4)]:
        x, pre = flash_fx(1.0)
        T.add(S0(i, o) - pre, x, gain=0.55)
    # room
    T.add(S0('o14'), keys(S['o14']['end'] - S['o14']['start'], 10), gain=0.6)
    T.add(S0('c05'), crunch(S['c05']['end'] - S['c05']['start']), gain=0.55)
    T.add(S0('d18', 0.8), beep(220, 0.25, 0.6), gain=0.4)
    for i in ['o11', 'd19a', 'd20']:
        s = S[i]; t = s['start'] + 0.3
        while t < s['end'] - 0.2:
            T.add(t, beep(1320 if i == 'o11' else 660, 0.06, 0.6), gain=0.3); t += 0.5 if i == 'o11' else 0.7
        T.add(s['start'], keys(min(1.2, s['end'] - s['start']), 12), gain=0.5)
    # chapter cards and the title: a deep boom
    for c in tl['chapters']:
        T.add(c['start'], boom_low(0.8), gain=0.45); T.add(c['start'] - 0.45, whoosh(0.45, 0.6), gain=0.3)
    # whooshes on name cards and big captions
    import graphics_plan as GP
    for kind, anchor, dur, p in GP.EVENTS:
        if kind in ('name', 'caption', 'rule', 'glyph', 'place'):
            t = seg[anchor]['start'] + p.get('delay', 0.0)
            T.add(t - 0.12, whoosh(0.35, 0.5, True), gain=0.25, pan=-0.3 if kind == 'name' else 0)
    return T


if __name__ == "__main__":
    os.makedirs(OUT, exist_ok=True)
    tl = json.load(open(os.path.join(HERE, "timeline.json")))
    shots = json.load(open(os.path.join(HERE, "shots.json")))
    T = build(tl, shots)
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
