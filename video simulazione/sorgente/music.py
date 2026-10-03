# -*- coding: utf-8 -*-
"""
Original procedural film score (no samples, no third-party audio: everything is synthesized
here, so the music is 100% copyright-free). Cues follow the story beats of the timeline:
mystery cold open, playful rules, wolves at night, grief, the storm, Bo's heroic fire,
wonder of the first words, pastoral farm comedy, the ominous "Mine.", the mystical Observer,
lo-fi creator's room, the regal crown, the secret vote, the epic night of torches, the message.

  python3 music.py            ->  scratchpad/audio/music.wav  (48 kHz stereo float)
"""
import os, json, math
import numpy as np
import soundfile as sf
from scipy import signal

SR = 48000
HERE = os.path.dirname(os.path.abspath(__file__))
SCRATCH = os.environ.get("SCRATCH", "/tmp/claude-0/-home-user-Marry/e61fd834-a8c5-5cc5-8204-6c637a41951f/scratchpad")
OUT = os.path.join(SCRATCH, "audio")
RNG = np.random.default_rng(2025)


def mtof(m):
    return 440.0 * 2 ** ((m - 69) / 12.0)


NOTE = {n: i for i, n in enumerate(['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'])}
NOTE.update({'Db': 1, 'Eb': 3, 'Gb': 6, 'Ab': 8, 'Bb': 10})


def chord(sym, octave=3):
    """'Dm', 'F', 'Bb', 'C7', 'Gsus', 'Am7', 'Ebmaj7' -> list of MIDI notes (root position)."""
    r = sym[0] + (sym[1] if len(sym) > 1 and sym[1] in '#b' else '')
    q = sym[len(r):]
    root = 12 * (octave + 1) + NOTE[r]
    iv = {'': [0, 4, 7], 'm': [0, 3, 7], '7': [0, 4, 7, 10], 'm7': [0, 3, 7, 10], 'maj7': [0, 4, 7, 11], 'sus': [0, 5, 7], 'sus2': [0, 2, 7],
          'dim': [0, 3, 6], 'add9': [0, 4, 7, 14], 'm9': [0, 3, 7, 10, 14], '5': [0, 7, 12]}[q]
    return [root + i for i in iv]


# ------------------------------------------------------------------ building blocks
TAB_N = 4096


def _table(harm):
    ph = np.arange(TAB_N) / TAB_N * 2 * np.pi
    w = np.zeros(TAB_N)
    for k, a in harm:
        w += a * np.sin(k * ph)
    return w / (np.abs(w).max() + 1e-9)


SAW = [_table([(k, 1.0 / k) for k in range(1, kmax + 1)]) for kmax in (64, 32, 16, 8, 4)]
SQR = _table([(k, 1.0 / k) for k in range(1, 30, 2)])
TRI = _table([(k, (1.0 / k ** 2) * (1 if (k // 2) % 2 == 0 else -1)) for k in range(1, 20, 2)])


def osc(freq, n, table=None, vib=0.0, vib_rate=5.0, phase0=None, drift=0.0):
    """wavetable oscillator with vibrato; freq may be scalar or array"""
    t = np.arange(n) / SR
    f = np.full(n, freq, float) if np.isscalar(freq) else freq
    if vib:
        f = f * (1 + vib * np.sin(2 * np.pi * vib_rate * t + RNG.random() * 6.28))
    if drift:
        f = f * (1 + drift * np.sin(2 * np.pi * 0.13 * t + RNG.random() * 6.28))
    if table is None:
        fm = float(np.mean(f))
        table = SAW[0 if fm < 160 else 1 if fm < 400 else 2 if fm < 1000 else 3 if fm < 2500 else 4]
    ph = (phase0 if phase0 is not None else RNG.random()) + np.cumsum(f) / SR
    idx = (ph * TAB_N).astype(np.int64) % TAB_N
    return table[idx]


def env_adsr(n, a=0.01, d=0.1, s=0.7, r=0.3, hold=None):
    a_n, d_n, r_n = int(a * SR), int(d * SR), int(r * SR)
    hold_n = max(0, (n - r_n) if hold is None else int(hold * SR))
    e = np.zeros(n)
    x = np.arange(n)
    e[:a_n] = np.linspace(0, 1, max(1, a_n))[:min(a_n, n)]
    if a_n < n:
        k = np.arange(min(d_n, n - a_n))
        e[a_n:a_n + len(k)] = 1 - (1 - s) * (k / max(1, d_n))
        e[a_n + len(k):] = s
    if hold_n < n:
        rel = np.arange(n - hold_n)
        e[hold_n:] = e[hold_n] * np.exp(-rel / max(1, r_n) * 4.6)
    return e


def lowpass(x, fc, q=0.7):
    b, a = signal.iirfilter(2, min(0.99, fc / (SR / 2)), btype='low', ftype='butter')
    return signal.lfilter(b, a, x)


def highpass(x, fc):
    b, a = signal.iirfilter(2, min(0.99, fc / (SR / 2)), btype='high', ftype='butter')
    return signal.lfilter(b, a, x)


def bandpass(x, f0, bw):
    lo, hi = max(20, f0 - bw / 2), min(SR / 2 - 100, f0 + bw / 2)
    b, a = signal.iirfilter(2, [lo / (SR / 2), hi / (SR / 2)], btype='band', ftype='butter')
    return signal.lfilter(b, a, x)


class Track:
    """stereo float buffer for the whole film"""
    def __init__(self, dur):
        self.n = int(dur * SR) + SR * 4
        self.L = np.zeros(self.n, np.float32)
        self.R = np.zeros(self.n, np.float32)

    def add(self, t, mono=None, gain=1.0, pan=0.0, L=None, R=None):
        i = int(t * SR)
        if i >= self.n:
            return
        if mono is not None:
            L = mono * math.cos((pan + 1) * math.pi / 4) * 1.4142
            R = mono * math.sin((pan + 1) * math.pi / 4) * 1.4142
        m = min(len(L), self.n - i)
        if i < 0:
            L, R, m, i = L[-i:], R[-i:], m + i, 0
            m = min(m, len(L))
        self.L[i:i + m] += (L[:m] * gain).astype(np.float32)
        self.R[i:i + m] += (R[:m] * gain).astype(np.float32)


# ------------------------------------------------------------------ instruments
def pad_note(m, dur, bright=1800, voices=3, att=0.9, rel=1.8, vib=0.003, table=None):
    n = int((dur + rel) * SR)
    f = mtof(m)
    L = np.zeros(n); R = np.zeros(n)
    for v in range(voices):
        det = (v - (voices - 1) / 2) * 0.006
        x = osc(f * (1 + det), n, table, vib=vib, vib_rate=4.5 + v * 0.7, drift=0.002)
        p = (v / max(1, voices - 1) - 0.5) * 1.2
        L += x * math.cos((p + 1) * math.pi / 4); R += x * math.sin((p + 1) * math.pi / 4)
    e = env_adsr(n, att, 0.5, 0.85, rel, hold=dur)
    L = lowpass(L * e, bright); R = lowpass(R * e, bright)
    return L / voices, R / voices


def piano(m, dur=2.5, vel=0.8):
    f = mtof(m)
    n = int((dur + 1.2) * SR)
    t = np.arange(n) / SR
    y = np.zeros(n)
    B = 0.00035
    for k in range(1, 10):
        fk = k * f * math.sqrt(1 + B * k * k)
        if fk > SR / 2.2:
            break
        amp = vel / k ** 1.25 * (1 + 0.3 * (k == 2))
        t60 = 3.8 / (1 + 0.55 * k) * (440 / max(120, f)) ** 0.35
        y += amp * np.sin(2 * np.pi * fk * t + RNG.random()) * np.exp(-t / t60 * 6.9 / 3)
    click = RNG.standard_normal(n) * np.exp(-t / 0.004) * 0.08 * vel
    y = y + lowpass(click, 3000)
    rel = np.ones(n); hold = int(dur * SR)
    if hold < n:
        rel[hold:] = np.exp(-np.arange(n - hold) / (0.25 * SR) * 4.6)
    return y * rel * 0.5


def bell(m, dur=3.0, vel=0.6, ratio=3.5, index=2.5):
    f = mtof(m)
    n = int(dur * SR); t = np.arange(n) / SR
    I = index * np.exp(-t / 0.8)
    y = np.sin(2 * np.pi * f * t + I * np.sin(2 * np.pi * f * ratio * t)) * np.exp(-t / (dur / 4.0))
    return y * vel * 0.4


def pluck(m, dur=0.6, vel=0.6, bright=3500):
    """Karplus-Strong-ish plucked string via filtered decaying saw (cheap)"""
    f = mtof(m)
    n = int(dur * SR); t = np.arange(n) / SR
    x = osc(f, n) * np.exp(-t / (dur / 4.5))
    x = lowpass(x, bright * (1.0 if f < 600 else 1.4))
    return x * vel * 0.5


def epiano(m, dur=1.5, vel=0.5):
    f = mtof(m)
    n = int((dur + 0.6) * SR); t = np.arange(n) / SR
    I = 1.4 * np.exp(-t / 0.35)
    y = np.sin(2 * np.pi * f * t + I * np.sin(2 * np.pi * f * t)) * np.exp(-t / 1.6)
    hold = int(dur * SR)
    if hold < n:
        y[hold:] *= np.exp(-np.arange(n - hold) / (0.2 * SR) * 4.6)
    return y * vel * 0.4


VOWEL = [(800, 80, 1.0), (1150, 90, 0.5), (2900, 120, 0.12), (3900, 130, 0.08)]   # "ah"


def choir_note(m, dur, att=1.2, rel=2.0, voices=4):
    f0 = mtof(m)
    harm = []
    for k in range(1, int(5000 / f0)):
        fk = k * f0
        a = sum(g / (1 + ((fk - F) / bw) ** 2) for F, bw, g in VOWEL) + 0.02 / k
        harm.append((k, a))
    tab = _table(harm)
    n = int((dur + rel) * SR)
    L = np.zeros(n); R = np.zeros(n)
    for v in range(voices):
        x = osc(f0 * (1 + (v - 1.5) * 0.004), n, tab, vib=0.006, vib_rate=4.8 + v * 0.4, drift=0.003)
        p = (v / (voices - 1) - 0.5) * 1.4
        L += x * math.cos((p + 1) * math.pi / 4); R += x * math.sin((p + 1) * math.pi / 4)
    e = env_adsr(n, att, 0.6, 0.9, rel, hold=dur)
    return L * e / voices, R * e / voices


def timpani(f0=55, vel=1.0, decay=1.4):
    n = int((decay + 0.5) * SR); t = np.arange(n) / SR
    f = f0 * (1 + 0.6 * np.exp(-t / 0.04))
    y = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / (decay / 4))
    nz = lowpass(RNG.standard_normal(n), 900) * np.exp(-t / 0.05) * 0.5
    return (y + nz) * vel * 0.9


def taiko(vel=1.0):
    n = int(1.6 * SR); t = np.arange(n) / SR
    f = 62 * (1 + 1.2 * np.exp(-t / 0.025))
    y = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.35)
    nz = lowpass(RNG.standard_normal(n), 1600) * np.exp(-t / 0.03)
    return (y * 1.0 + nz * 0.6) * vel


def boom(vel=1.0, f0=42):
    n = int(4.5 * SR); t = np.arange(n) / SR
    f = f0 * (1 + 1.5 * np.exp(-t / 0.06))
    y = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 1.2)
    nz = lowpass(RNG.standard_normal(n), 400) * np.exp(-t / 0.25) * 0.4
    return np.tanh((y + nz) * 1.5) * vel


def riser(dur=2.5, vel=0.5):
    n = int(dur * SR); t = np.arange(n) / SR
    nz = RNG.standard_normal(n)
    out = np.zeros(n)
    seg = SR // 20
    for i in range(0, n, seg):
        u = i / n
        fc = 300 * (20 ** u)
        out[i:i + seg] = bandpass(nz[i:i + seg + 200], fc, fc * 0.8)[:len(out[i:i + seg])]
    tone = osc(110 * (2 ** (2 * t / dur)), n, SAW[2]) * 0.2
    return (out * 0.8 + lowpass(tone, 2500)) * (t / dur) ** 2.2 * vel


def reverse_cymbal(dur=1.6, vel=0.4):
    n = int(dur * SR); t = np.arange(n) / SR
    x = highpass(RNG.standard_normal(n), 4000) * (t / dur) ** 3
    return x * vel


def shaker(vel=0.25):
    n = int(0.09 * SR); t = np.arange(n) / SR
    return highpass(RNG.standard_normal(n), 6000) * np.exp(-t / 0.02) * vel


def kick(vel=0.9):
    n = int(0.5 * SR); t = np.arange(n) / SR
    f = 52 * (1 + 2.5 * np.exp(-t / 0.03))
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.18) * vel


def snare(vel=0.6):
    n = int(0.35 * SR); t = np.arange(n) / SR
    nz = bandpass(RNG.standard_normal(n), 3000, 4000) * np.exp(-t / 0.07)
    tone = np.sin(2 * np.pi * 190 * t) * np.exp(-t / 0.05) * 0.5
    return (nz + tone) * vel * 0.6


def hat(vel=0.25):
    n = int(0.06 * SR); t = np.arange(n) / SR
    return highpass(RNG.standard_normal(n), 7500) * np.exp(-t / 0.012) * vel


def drone(m, dur, vel=0.4, bright=600):
    n = int(dur * SR)
    x = osc(mtof(m), n, SAW[0], drift=0.003) * 0.6 + osc(mtof(m - 12), n, TRI, drift=0.002) * 0.8
    e = env_adsr(n, 2.0, 0.5, 1.0, 2.5, hold=dur - 2.5)
    return lowpass(x * e, bright) * vel


# ------------------------------------------------------------------ cue writers
class Score:
    def __init__(self, tl):
        self.tl = tl
        self.seg = {s['id']: s for s in tl['segments']}
        self.chap = {c['id']: c for c in tl['chapters']}
        self.T = Track(tl['total'] + 2)

    def at(self, sid, off=0.0):
        if sid.startswith('chap:'):
            return self.chap[sid[5:]]['start'] + off
        if sid == 'title':
            return self.tl['events'][0]['start'] + off
        if sid == 'outro':
            return self.tl['outro']['start'] + off
        if sid == 'end':
            return self.tl['total'] + off
        return self.seg[sid]['start'] + off

    # sustained chords (pads / strings / choir)
    def pads(self, t0, t1, prog, bar, gain=0.12, bright=1800, octave=3, choir=0.0, bass=0.0, att=1.0):
        t, i = t0, 0
        while t < t1 - 0.2:
            d = min(bar, t1 - t)
            ns = chord(prog[i % len(prog)], octave)
            for k, m in enumerate(ns):
                L, R = pad_note(m + (12 if k == 0 and len(ns) > 3 else 0), d, bright=bright, att=att)
                self.T.add(t, L=L, R=R, gain=gain)
            if choir:
                for m in ns[:3]:
                    L, R = choir_note(m + 12, d, att=att * 1.2)
                    self.T.add(t, L=L, R=R, gain=gain * choir)
            if bass:
                L, R = pad_note(ns[0] - 12, d, bright=500, voices=2, att=0.3)
                self.T.add(t, L=L, R=R, gain=gain * bass)
            t += bar; i += 1

    def arp(self, t0, t1, prog, bar, step, inst='pluck', gain=0.1, octave=4, pattern=(0, 1, 2, 1), pan=0.3, vel=0.6):
        t, b = t0, 0
        while t < t1 - 0.05:
            ns = chord(prog[b % len(prog)], octave)
            ns = ns + [n + 12 for n in ns]
            k = 0
            tb = t
            while tb < min(t + bar, t1) - 0.02:
                m = ns[pattern[k % len(pattern)] % len(ns)]
                x = pluck(m, step * 3.5, vel) if inst == 'pluck' else bell(m, step * 6, vel * 0.8) if inst == 'bell' else piano(m, step * 2, vel) if inst == 'piano' else epiano(m, step * 2, vel)
                self.T.add(tb, x, gain=gain, pan=pan * (1 if k % 2 else -1))
                tb += step; k += 1
            t += bar; b += 1

    def melody(self, t0, notes, step, inst='piano', gain=0.16, vel=0.7, pan=0.0):
        """notes: list of (midi or None, beats)"""
        t = t0
        for m, beats in notes:
            if m is not None:
                d = beats * step
                x = piano(m, d * 1.2, vel) if inst == 'piano' else bell(m, max(2.0, d * 2), vel) if inst == 'bell' else pluck(m, d * 2, vel) if inst == 'pluck' else epiano(m, d, vel)
                self.T.add(t, x, gain=gain, pan=pan)
            t += beats * step
        return t

    def ostinato(self, t0, t1, prog, bar, step, gain=0.07, octave=2, bright=1400):
        t, b = t0, 0
        while t < t1 - 0.05:
            ns = chord(prog[b % len(prog)], octave)
            tb = t
            k = 0
            while tb < min(t + bar, t1) - 0.02:
                m = ns[0] if k % 4 != 2 else ns[min(2, len(ns) - 1)]
                n = int(step * 0.9 * SR)
                x = osc(mtof(m), n) * env_adsr(n, 0.005, 0.05, 0.6, 0.06, hold=step * 0.6) + osc(mtof(m + 12), n) * 0.5 * env_adsr(n, 0.005, 0.05, 0.6, 0.06, hold=step * 0.6)
                self.T.add(tb, lowpass(x, bright), gain=gain * (1.0 if k % 2 == 0 else 0.75), pan=-0.2 if k % 2 else 0.2)
                tb += step; k += 1
            t += bar; b += 1

    def drums(self, t0, t1, beat, pattern, gain=0.35):
        """pattern: string over 16ths per bar: k=kick s=snare h=hat t=taiko x=shaker . = rest"""
        step = beat / 4
        t, k = t0, 0
        while t < t1 - 0.02:
            c = pattern[k % len(pattern)]
            if c == 'k': self.T.add(t, kick(), gain=gain)
            elif c == 's': self.T.add(t, snare(), gain=gain)
            elif c == 'h': self.T.add(t, hat(), gain=gain, pan=0.3)
            elif c == 't': self.T.add(t, taiko(), gain=gain)
            elif c == 'T': self.T.add(t, taiko(1.3), gain=gain); self.T.add(t, timpani(49, 0.8), gain=gain * 0.6)
            elif c == 'x': self.T.add(t, shaker(), gain=gain, pan=-0.3)
            t += step; k += 1

    def hit(self, t, vel=1.0, rev=True):
        if rev:
            self.T.add(t - 1.6, reverse_cymbal(1.6, 0.35 * vel), gain=1.0)
        self.T.add(t, boom(vel), gain=0.45)
        self.T.add(t, timpani(41, vel), gain=0.35)

    def drone(self, t0, t1, m, gain=0.12, bright=500):
        self.T.add(t0, drone(m, t1 - t0 + 2.5, 1.0, bright), gain=gain)


def compose(tl):
    S = Score(tl)
    A = S.at
    # ---------------- cold open: mystery -> build -> title hit
    t_title = A('title')
    S.drone(0.0, t_title, 38, gain=0.10)
    S.pads(0.3, 15.3, ['Dm', 'Bb', 'F', 'C'], 3.75, gain=0.07, bright=1200, att=1.6)
    motif = [(62, 1), (65, 1), (69, 2), (67, 1), (65, 1), (64, 2), (62, 4)]
    S.melody(0.8, motif, 0.47, 'piano', gain=0.14, vel=0.6)
    S.melody(8.6, [(m + 12 if m else None, b) for m, b in motif], 0.47, 'bell', gain=0.08, vel=0.5)
    S.pads(15.3, t_title, ['Dm', 'Bb', 'F', 'C', 'Gm', 'Bb', 'C', 'C'], 2.2, gain=0.09, bright=2400, choir=0.5, bass=0.6, att=0.8)
    S.ostinato(15.3, t_title - 0.3, ['Dm', 'Bb', 'F', 'C', 'Gm', 'Bb', 'C', 'C'], 2.2, 0.275, gain=0.05)
    S.drums(20.6, t_title - 0.3, 0.55, 't...t...t.t.t...', gain=0.22)
    S.T.add(t_title - 2.5, riser(2.5, 0.35))
    S.hit(t_title, 1.0)
    S.pads(t_title, A('chap:r01') + 1.0, ['D', 'A', 'Bm', 'G'], 1.05, gain=0.11, bright=3200, choir=0.7, bass=0.8, att=0.2)
    S.melody(t_title, [(74, 1), (78, 1), (81, 2), (83, 1), (81, 1), (78, 2)], 0.35, 'bell', gain=0.10, vel=0.7)
    # ---------------- chapter I: playful curiosity
    c1, c1e = A('chap:r01'), A('r13')
    S.arp(c1 + 0.4, c1e, ['C', 'Am', 'F', 'G'], 2.4, 0.3, 'pluck', gain=0.095, octave=4, pattern=(0, 2, 1, 3, 2, 1))
    S.pads(c1 + 0.4, c1e, ['C', 'Am', 'F', 'G'], 2.4, gain=0.065, bright=1600, bass=0.5)
    S.drums(A('r09'), c1e, 0.6, 'x.x.x.xxx.x.x.x.', gain=0.12)
    S.melody(A('r11'), [(76, 0.5), (74, 0.5), (72, 1), (None, 1), (76, 0.5), (79, 0.5), (77, 1)], 0.3, 'bell', gain=0.06)
    # Mira's sunset: tender
    S.pads(A('r13'), A('r17'), ['F', 'Am', 'Dm', 'Bb'], 3.2, gain=0.08, bright=1500, att=1.5)
    S.melody(A('r13', 0.3), [(72, 2), (69, 1), (70, 1), (72, 3), (None, 1), (74, 2), (72, 1), (69, 1), (67, 4)], 0.5, 'piano', gain=0.12, vel=0.55)
    # energy drops -> hope -> the raised hand
    S.pads(A('r17'), A('r20'), ['Am', 'F', 'C', 'G'], 2.8, gain=0.06, bright=1100)
    S.arp(A('r18'), A('r21'), ['Am', 'F', 'C', 'G'], 2.0, 0.25, 'piano', gain=0.075, octave=4, pattern=(0, 1, 2, 1))
    S.pads(A('r19'), A('r21'), ['F', 'C', 'G', 'Am'], 2.0, gain=0.06, bright=2000, choir=0.5, att=0.8)
    S.T.add(A('r21') - 2.0, riser(2.0, 0.25))
    S.pads(A('r21'), A('chap:f01') + 0.5, ['F', 'C', 'G', 'Am'], 1.6, gain=0.11, bright=2800, choir=0.8, bass=0.6, att=0.4)
    S.melody(A('r21'), [(81, 1), (79, 1), (77, 1), (79, 2), (76, 3)], 0.4, 'bell', gain=0.09)
    # ---------------- chapter II: night, wolves, death, storm, fire
    c2 = A('chap:f01')
    S.drone(c2, A('f06'), 33, gain=0.12, bright=400)
    S.pads(c2 + 0.5, A('f06'), ['Em', 'Cmaj7', 'Em', 'B'], 4.0, gain=0.05, bright=900, att=2.0)
    for k in range(int((A('f06') - A('f02')) / 1.05)):
        S.T.add(A('f02') + k * 1.05, kick(0.6), gain=0.18); S.T.add(A('f02') + k * 1.05 + 0.22, kick(0.4), gain=0.12)
    S.T.add(A('f03'), boom(0.6, 36), gain=0.35)
    # A-15: grief
    S.pads(A('f06'), A('f11'), ['Am', 'F', 'Dm', 'E'], 3.6, gain=0.08, bright=1300, att=1.8)
    S.melody(A('f07'), [(69, 2), (72, 1), (71, 1), (69, 3), (None, 1), (64, 2), (65, 1), (64, 1), (62, 2), (64, 4)], 0.55, 'piano', gain=0.12, vel=0.5)
    S.pads(A('f08'), A('f11'), ['Am', 'F', 'Dm', 'E'], 3.6, gain=0.05, choir=0.6, bright=1200, att=2.0)
    # storm
    S.drone(A('f11'), A('f14'), 28, gain=0.14, bright=350)
    S.ostinato(A('f11', 0.5), A('f14'), ['Dm', 'Dm', 'Bb', 'A'], 1.6, 0.2, gain=0.06, octave=2)
    S.drums(A('f12'), A('f14'), 0.8, 't.......t...t...', gain=0.25)
    S.hit(A('f12', 1.5), 0.8)
    # Bo steals fire: heroic
    S.T.add(A('f14') - 1.5, riser(1.5, 0.3))
    S.pads(A('f14'), A('f16'), ['D', 'A', 'Bm', 'G'], 1.55, gain=0.11, bright=3000, choir=0.7, bass=0.8, att=0.3)
    S.drums(A('f14'), A('f16'), 0.78, 'T.......t...t...', gain=0.25)
    S.melody(A('f14', 0.2), [(74, 1), (78, 1), (81, 2), (83, 1), (81, 1), (78, 2), (76, 1), (78, 1), (74, 4)], 0.39, 'bell', gain=0.10)
    S.hit(A('f15'), 0.7, rev=False)
    S.pads(A('f16'), A('chap:w01') + 1.0, ['D', 'G', 'D', 'A'], 2.4, gain=0.07, bright=1600, att=1.0)
    # ---------------- chapter III: wonder of words
    c3 = A('chap:w01')
    S.pads(c3 + 0.5, A('w07'), ['F', 'Am', 'Bb', 'C'], 2.8, gain=0.06, bright=1500)
    S.arp(c3 + 0.5, A('w07'), ['F', 'Am', 'Bb', 'C'], 2.8, 0.35, 'bell', gain=0.05, octave=5, pattern=(0, 1, 2, 3, 2, 1, 0, 1))
    S.drums(A('w02'), A('w03'), 0.45, 'h.hhh.h.hhh.h..h', gain=0.08)
    S.pads(A('w07'), A('w10'), ['Bb', 'F', 'Gm', 'Eb'], 3.0, gain=0.08, bright=1400, att=1.4)
    S.melody(A('w08'), [(70, 2), (74, 1), (72, 1), (70, 3), (None, 1), (77, 2), (75, 1), (74, 1), (72, 4)], 0.5, 'piano', gain=0.12, vel=0.55)
    S.pads(A('w10'), A('w13'), ['Gm', 'Eb', 'Bb', 'F'], 2.6, gain=0.07, bright=1500, choir=0.6, att=1.2)
    S.hit(A('w12'), 0.4, rev=True)
    S.arp(A('w13'), A('chap:a01') + 0.5, ['C', 'G', 'Am', 'F'], 2.2, 0.275, 'pluck', gain=0.07, octave=4, pattern=(0, 1, 2, 1, 3, 1))
    S.pads(A('w13'), A('chap:a01') + 0.5, ['C', 'G', 'Am', 'F'], 2.2, gain=0.05, bright=1500)
    S.drums(A('w14'), A('chap:a01'), 0.55, 'k.x.s.x.k.x.s.xx', gain=0.12)
    # ---------------- chapter IV: pastoral farm & comedy
    c4 = A('chap:a01')
    S.arp(c4 + 0.4, A('a07'), ['G', 'C', 'D', 'G'], 2.0, 0.25, 'pluck', gain=0.07, octave=4, pattern=(0, 2, 1, 2, 3, 2, 1, 2))
    S.pads(c4 + 0.4, A('a07'), ['G', 'C', 'D', 'G'], 2.0, gain=0.05, bright=1600)
    S.drums(c4 + 0.4, A('a07'), 0.5, 'k.x.s.x.k.xks.x.', gain=0.13)
    S.melody(A('a03'), [(79, 0.5), (81, 0.5), (83, 1), (79, 1), (76, 1), (78, 0.5), (79, 0.5), (74, 2)], 0.25, 'bell', gain=0.07)
    S.T.add(A('a05'), boom(0.35, 60), gain=0.25)
    S.melody(A('a06', 0.2), [(67, 1), (66, 1), (65, 1), (64, 3)], 0.32, 'pluck', gain=0.10, vel=0.7)
    S.pads(A('a07'), A('a14'), ['C', 'Em', 'F', 'G', 'Am', 'F', 'C', 'G'], 2.6, gain=0.07, bright=1800, att=1.0)
    S.arp(A('a08'), A('a14'), ['C', 'Em', 'F', 'G', 'Am', 'F', 'C', 'G'], 2.6, 0.325, 'piano', gain=0.05, octave=4, pattern=(0, 1, 2, 1))
    S.melody(A('a10'), [(72, 1), (76, 1), (79, 2), (77, 1), (76, 1), (74, 2), (72, 4)], 0.42, 'bell', gain=0.08)
    S.ostinato(A('a14'), A('a16'), ['Am', 'F', 'C', 'G'], 1.0, 0.125, gain=0.05, octave=3)
    S.pads(A('a14'), A('a16'), ['Am', 'F', 'C', 'G'], 1.0, gain=0.07, bright=2600, bass=0.6, att=0.3)
    S.drums(A('a14'), A('a16'), 0.5, 'k.h.s.h.k.hks.h.', gain=0.16)
    S.pads(A('a16'), A('chap:k01') + 0.6, ['Am', 'F', 'C', 'Em', 'F', 'C', 'Dm', 'E'], 2.2, gain=0.08, bright=1300, choir=0.5, att=1.5)
    S.melody(A('a16', 0.2), [(76, 2), (74, 1), (72, 1), (71, 2), (69, 2), (None, 1), (72, 1), (71, 1), (69, 1), (68, 4)], 0.5, 'piano', gain=0.12, vel=0.5)
    S.melody(A('a17', 1.0), [(81, 1), (79, 1), (77, 1), (79, 2), (76, 3)], 0.42, 'bell', gain=0.07)
    # ---------------- chapter V: clay, "Mine.", the army, the flood
    c5 = A('chap:k01')
    S.arp(c5 + 0.4, A('k05'), ['Em', 'C', 'G', 'D'], 2.4, 0.3, 'pluck', gain=0.06, octave=4, pattern=(0, 1, 2, 1))
    S.pads(c5 + 0.4, A('k05'), ['Em', 'C', 'G', 'D'], 2.4, gain=0.05, bright=1400)
    S.T.add(A('k02') - 0.8, reverse_cymbal(0.8, 0.25))
    S.pads(A('k02'), A('k04'), ['G', 'D', 'Em', 'C'], 1.6, gain=0.08, bright=2400, choir=0.7, att=0.4)
    S.melody(A('k02', 0.1), [(79, 1), (83, 1), (86, 2), (84, 1), (83, 1), (81, 3)], 0.33, 'bell', gain=0.09)
    S.pads(A('k04'), A('k05'), ['C', 'G'], 1.0, gain=0.07, bright=2600, att=0.2)
    S.melody(A('k04', 0.05), [(72, 0.5), (76, 0.5), (79, 0.5), (84, 1.5)], 0.22, 'pluck', gain=0.11, vel=0.8)
    S.ostinato(A('k05'), A('k07'), ['Em', 'C', 'G', 'D'], 1.2, 0.15, gain=0.05, octave=3)
    S.drums(A('k05'), A('k07'), 0.6, 'k.h.s.h.k.hks.h.', gain=0.13)
    S.drone(A('k07'), A('k16'), 31, gain=0.13, bright=450)
    S.T.add(A('k09'), boom(0.7, 38), gain=0.4)
    S.pads(A('k09'), A('k16'), ['Bm', 'G', 'Bm', 'F#'], 3.2, gain=0.06, bright=1000, att=1.4)
    S.drums(A('k13'), A('k16'), 0.75, 's.s.s...s.s.s...', gain=0.12)
    S.drums(A('k14'), A('k16'), 0.75, 't...t...t...t.t.', gain=0.18)
    S.drone(A('k16'), A('k22'), 28, gain=0.14, bright=380)
    S.ostinato(A('k17'), A('k19'), ['Dm', 'Dm', 'Bb', 'A'], 1.4, 0.175, gain=0.07, octave=2)
    S.drums(A('k17'), A('k19'), 0.7, 'T.....t.t...t...', gain=0.24)
    S.hit(A('k18'), 0.9)
    S.pads(A('k19'), A('k23'), ['Dm', 'Bb', 'Gm', 'A'], 2.6, gain=0.07, bright=1100, choir=0.5, att=1.6)
    S.melody(A('k22'), [(74, 2), (72, 1), (70, 1), (69, 4)], 0.6, 'piano', gain=0.11, vel=0.5)
    S.T.add(A('k23'), bell(86, 4.0, 0.4), gain=0.10)
    # ---------------- chapter VI: the others — exodus, the lake, the Tamari, first contact, trade
    c6b = A('chap:e01')
    S.drone(c6b - 0.5, A('e03'), 38, gain=0.09, bright=420)
    S.pads(c6b, A('e02', 3.4), ['Dm', 'Bb', 'Gm', 'A'], 3.0, gain=0.06, bright=1100, att=1.6)
    S.melody(A('e02', 0.3), [(69, 2), (70, 1), (69, 1), (67, 2), (65, 2), (None, 1), (64, 1), (65, 1), (67, 1), (69, 4)], 0.45, 'piano', gain=0.11, vel=0.5)
    S.pads(A('e02', 3.4), A('e03'), ['F', 'C', 'Dm', 'Bb'], 1.9, gain=0.07, bright=1500, att=1.0)
    # the journey south (timelapse) -> the lake reveal
    S.arp(A('e03'), A('e03', 2.31), ['Dm', 'C', 'Bb', 'C'], 1.16, 0.145, 'pluck', gain=0.07, octave=4, pattern=(0, 1, 2, 1, 3, 1, 2, 1))
    S.drums(A('e03'), A('e03', 2.31), 0.58, 'k...k.k.k...k.k.', gain=0.14)
    S.T.add(A('e03', 2.31) - 1.6, riser(1.6, 0.3))
    S.pads(A('e03', 2.31), A('e05'), ['D', 'A', 'Bm', 'G', 'D', 'G', 'A', 'A'], 1.05, gain=0.11, bright=3200, choir=0.9, bass=0.8, att=0.3)
    S.hit(A('e03', 2.31), 0.6, rev=True)
    S.melody(A('e03', 2.4), [(74, 1), (78, 1), (81, 3), (79, 1), (78, 1), (76, 1), (74, 4)], 0.36, 'bell', gain=0.09)
    # Nuvia: watery, modal
    S.pads(A('e05'), A('e08'), ['Fmaj7', 'G', 'Am', 'Em'], 3.0, gain=0.06, bright=1600, att=1.4)
    S.arp(A('e05'), A('e08'), ['Fmaj7', 'G', 'Am', 'Em'], 3.0, 0.25, 'bell', gain=0.045, octave=5, pattern=(0, 2, 1, 3, 2, 4, 3, 1))
    S.drums(A('e06'), A('e07'), 0.5, 'x...x.x.x...x.xx', gain=0.08)
    S.pads(A('e07', 1.72), A('e08'), ['Am', 'Fmaj7'], 1.6, gain=0.05, choir=0.8, bright=1300, att=0.8)
    # remember Tam? (the goat tune, again)
    S.arp(A('e08'), A('e09'), ['G', 'C', 'D', 'G'], 1.2, 0.15, 'pluck', gain=0.1, octave=4, pattern=(0, 2, 1, 2, 3, 2, 1, 2))
    S.pads(A('e08'), A('e09'), ['G', 'C', 'D', 'G'], 1.2, gain=0.05, bright=1800, att=0.3)
    S.melody(A('e08', 1.84), [(79, 0.5), (81, 0.5), (83, 1), (79, 1), (76, 1)], 0.25, 'bell', gain=0.07)
    # the Tamari: open fifths, a hand drum, a folk tune (D dorian)
    S.drone(A('e09'), A('e12'), 38, gain=0.08, bright=700)
    S.drums(A('e09'), A('e11'), 0.52, 't..t.t..t..t.tt.', gain=0.14)
    S.drums(A('e09'), A('e11'), 0.52, '..x...x...x...xx', gain=0.10)
    S.arp(A('e09'), A('e11'), ['Dm', 'C', 'G', 'Dm'], 2.08, 0.26, 'pluck', gain=0.06, octave=4, pattern=(0, 1, 2, 4, 3, 1))
    S.melody(A('e09', 2.28), [(74, 1), (76, 1), (77, 1), (79, 2), (77, 1), (76, 1), (74, 2), (72, 1), (74, 3)], 0.26, 'pluck', gain=0.10, vel=0.75)
    S.melody(A('e10', 2.07), [(81, 1), (79, 1), (77, 1), (76, 1), (74, 2), (72, 2), (74, 4)], 0.26, 'pluck', gain=0.09, vel=0.7)
    # the evening fire: warm and quiet
    S.pads(A('e11'), A('e12'), ['Dm', 'Am', 'C', 'G'], 1.2, gain=0.06, bright=1300, att=0.8)
    S.melody(A('e11', 0.2), [(69, 2), (72, 1), (74, 1), (72, 2), (69, 2)], 0.4, 'piano', gain=0.10, vel=0.5)
    # three peoples: the theme, broad
    S.pads(A('e12'), A('e13'), ['C', 'G', 'Am', 'F'], 1.2, gain=0.09, bright=2600, choir=0.8, bass=0.7, att=0.4)
    for o in (0.0, 0.9, 1.82):
        S.T.add(A('e12', o), bell(84 - int(o * 2), 3.0, 0.5), gain=0.09)
    # first contact: suspense, a heartbeat, then the cheese
    S.pads(A('e13'), A('e15'), ['Gsus', 'G', 'Csus2', 'C', 'Gsus', 'G'], 1.8, gain=0.06, bright=1200, att=1.0)
    S.drone(A('e13'), A('e15'), 31, gain=0.08, bright=500)
    for k in range(int((A('e15') - A('e14')) / 0.8)):
        S.T.add(A('e14') + k * 0.8, kick(0.5), gain=0.14); S.T.add(A('e14') + k * 0.8 + 0.18, kick(0.32), gain=0.09)
    S.T.add(A('e15', 0.1), pluck(84, 0.5, 0.8), gain=0.12); S.T.add(A('e15', 0.35), pluck(91, 0.5, 0.7), gain=0.1)
    # trade: joy
    S.arp(A('e16'), A('e18'), ['C', 'F', 'G', 'C', 'Am', 'F', 'G', 'G'], 1.0, 0.125, 'pluck', gain=0.07, octave=4, pattern=(0, 2, 1, 2, 3, 2, 1, 2))
    S.pads(A('e16'), A('e18'), ['C', 'F', 'G', 'C', 'Am', 'F', 'G', 'G'], 1.0, gain=0.06, bright=2200, bass=0.6, att=0.3)
    S.drums(A('e16', 2.9), A('e18'), 0.5, 'k.h.s.h.k.hks.h.', gain=0.15)
    S.melody(A('e16', 2.9), [(72, 1), (76, 1), (79, 1), (84, 2), (83, 1), (79, 1), (81, 2), (79, 1), (76, 1), (77, 1), (74, 1), (72, 4)], 0.25, 'bell', gain=0.08)
    S.ostinato(A('e17'), A('e18'), ['C', 'G', 'Am', 'F'], 1.0, 0.125, gain=0.05, octave=3)
    # ...about to become a problem
    S.drone(A('e18'), A('chap:o01'), 30, gain=0.12, bright=380)
    S.pads(A('e18', 1.0), A('chap:o01'), ['Cm', 'Ab'], 2.4, gain=0.05, bright=800, att=1.2)
    S.T.add(A('e18', 1.74), bell(78, 4.0, 0.45, 3.7), gain=0.10)
    S.T.add(A('chap:o01') - 1.4, reverse_cymbal(1.4, 0.35))
    # ---------------- chapter VI: the Observer (mystic), autosave reveal, lo-fi room
    c6 = A('chap:o01')
    S.drone(c6, A('o09'), 29, gain=0.10, bright=500)
    S.pads(c6 + 0.4, A('o03'), ['Fmaj7', 'G', 'Em', 'Am'], 3.2, gain=0.06, bright=1300, choir=0.6, att=1.8)
    S.arp(A('o02'), A('o03'), ['Fmaj7', 'G', 'Em', 'Am'], 2.0, 0.25, 'bell', gain=0.04, octave=5, pattern=(0, 2, 1, 3))
    S.T.add(A('o03', 2.7) - 1.6, reverse_cymbal(1.6, 0.4))
    S.T.add(A('o03', 2.7), bell(93, 6.0, 0.6, 3.2), gain=0.18); S.T.add(A('o03', 2.7), boom(0.5, 50), gain=0.3)
    S.pads(A('o03', 3.0), A('o08'), ['Am', 'Fmaj7', 'C', 'G'], 3.0, gain=0.07, bright=1500, choir=0.7, att=1.4)
    S.T.add(A('o05', 0.4), bell(88, 5.0, 0.5, 3.2), gain=0.14)
    S.pads(A('o08'), A('o09'), ['F', 'C', 'Dm', 'Bb', 'F', 'C', 'Bb', 'C'], 1.6, gain=0.09, bright=2600, choir=0.8, bass=0.7, att=0.6)
    S.melody(A('o08', 0.5), [(77, 1), (79, 1), (81, 2), (84, 2), (82, 1), (81, 1), (79, 4)], 0.4, 'bell', gain=0.08)
    S.drone(A('o09'), A('o14'), 26, gain=0.12, bright=320)
    S.pads(A('o09'), A('o13'), ['Em', 'C', 'Am', 'B'], 2.4, gain=0.06, bright=900, att=1.2)
    S.T.add(A('o10', 0.3), bell(91, 5.0, 0.5, 3.2), gain=0.14)
    S.T.add(A('o13') - 2.0, riser(2.0, 0.35)); S.hit(A('o13'), 0.9, rev=False)
    # lo-fi room
    S.drums(A('o14'), A('chap:c01'), 0.72, 'k...s..kk.k.s...', gain=0.16)
    S.drums(A('o14'), A('chap:c01'), 0.72, 'h.h.h.h.h.h.h.hh', gain=0.06)
    S.arp(A('o14'), A('chap:c01'), ['Fmaj7', 'Em', 'Dm', 'Cmaj7'], 2.88, 0.72, 'epiano', gain=0.07, octave=4, pattern=(0, 1, 2, 3))
    # ---------------- chapter VII: growth montage, the crown
    c7 = A('chap:c01')
    S.ostinato(c7 + 0.4, A('c03'), ['C', 'G', 'Am', 'F'], 1.0, 0.125, gain=0.05, octave=3)
    S.pads(c7 + 0.4, A('c03'), ['C', 'G', 'Am', 'F'], 2.0, gain=0.07, bright=2600, bass=0.5, att=0.5)
    S.drums(c7 + 0.4, A('c02'), 0.5, 'k.h.s.h.k.hks.h.', gain=0.15)
    S.melody(A('c01', 1.6), [(72, 1), (76, 1), (79, 1), (84, 2), (83, 1), (79, 1), (76, 1), (77, 2), (76, 1), (74, 1), (72, 4)], 0.25, 'bell', gain=0.07)
    S.drums(A('c02'), A('c03'), 0.4, 'kshs kshs ksshkshs'.replace(' ', '.'), gain=0.12)
    S.drone(A('c03'), A('c05'), 34, gain=0.11, bright=450)
    S.pads(A('c03'), A('c05'), ['Cm', 'Ab', 'Eb', 'G'], 2.6, gain=0.07, bright=1200, choir=0.5, att=1.0)
    S.drums(A('c04'), A('c05'), 0.65, 'T.......t...t...', gain=0.2)
    S.drums(A('c05'), A('c06'), 0.72, 'k...s..kk.k.s...', gain=0.16)
    S.arp(A('c05'), A('c06'), ['Fmaj7', 'Em', 'Dm', 'Cmaj7'], 2.88, 0.72, 'epiano', gain=0.07, octave=4, pattern=(0, 1, 2, 3))
    S.arp(A('c06'), A('c07'), ['Am', 'E', 'Am', 'E'], 1.2, 0.15, 'pluck', gain=0.11, octave=4, pattern=(0, 2, 1, 2, 0, 3, 1, 2))
    S.pads(A('c06'), A('c07'), ['Am', 'E'], 2.4, gain=0.05, bright=900, att=0.4)
    S.T.add(A('c06', 3.0), bell(76, 2.0, 0.4), gain=0.07)
    S.drums(A('c06'), A('c07'), 0.6, '..h...h...h..hh.', gain=0.08)
    S.T.add(A('c07') - 1.2, riser(1.2, 0.3))
    S.pads(A('c07'), A('c11'), ['Eb', 'Ab', 'Bb', 'Eb', 'Cm', 'Ab', 'Bb', 'Bb'], 1.6, gain=0.1, bright=2800, choir=0.8, bass=0.8, att=0.3)
    S.hit(A('c07'), 0.8, rev=False)
    S.drums(A('c07'), A('c11'), 0.8, 'T.......t.t.t...', gain=0.22)
    S.melody(A('c08'), [(75, 1), (79, 1), (82, 2), (80, 1), (79, 1), (77, 2), (75, 4)], 0.4, 'bell', gain=0.09)
    S.pads(A('c11'), A('c13'), ['Eb', 'Bb', 'Cm', 'Ab'], 2.4, gain=0.07, bright=2000, att=1.0)
    S.arp(A('c11'), A('c13'), ['Eb', 'Bb', 'Cm', 'Ab'], 2.4, 0.3, 'piano', gain=0.05, octave=4)
    S.drums(A('c13'), A('g01'), 0.55, 's.s.s.s.s.s.sss.', gain=0.13)
    S.pads(A('c13'), A('g01'), ['Cm', 'Ab', 'Fm', 'G'], 2.2, gain=0.07, bright=1200, att=1.0)
    # ---------------- the war on Nuvia (1512)
    S.drone(A('g01'), A('g05'), 24, gain=0.13, bright=380)
    S.pads(A('g01'), A('g02'), ['Cm', 'Ab'], 1.6, gain=0.07, bright=900, att=0.8)
    S.T.add(A('g01', 0.4), timpani(41, 0.6), gain=0.3)
    S.drums(A('g02'), A('g03'), 0.5, 's.ss.s.ss.s.sss', gain=0.16)
    S.drums(A('g02'), A('g03'), 0.5, 't.......t.......', gain=0.22)
    S.ostinato(A('g02'), A('g03'), ['Cm', 'Cm', 'Ab', 'G'], 1.0, 0.125, gain=0.06, octave=2)
    S.pads(A('g02'), A('g03'), ['Cm', 'Ab', 'Fm', 'G'], 1.0, gain=0.07, bright=1500, bass=0.8, att=0.3)
    S.T.add(A('g03') - 1.2, riser(1.2, 0.3))
    S.drums(A('g03'), A('g03', 3.2), 0.42, 'T.t.t.t.T.t.tttt', gain=0.28)
    S.ostinato(A('g03'), A('g03', 3.2), ['Cm', 'Cm', 'Db', 'C'], 0.84, 0.105, gain=0.07, octave=2)
    S.pads(A('g03'), A('g03', 3.2), ['Cm', 'Db', 'Cm', 'G'], 0.84, gain=0.09, bright=2400, choir=0.9, bass=0.8, att=0.2)
    S.hit(A('g03', 3.23), 1.0, rev=False)
    # aftermath: a lament for Nuvia
    S.pads(A('g03', 3.6), A('g05'), ['Fm', 'Db', 'Ab', 'C', 'Fm', 'Db', 'Eb', 'C'], 2.0, gain=0.07, bright=1200, choir=0.7, att=1.4)
    S.melody(A('g04', 0.4), [(77, 2), (76, 1), (77, 1), (80, 3), (None, 1), (79, 2), (77, 1), (75, 1), (72, 4), (None, 2), (77, 2), (73, 1), (72, 1), (68, 4)], 0.5, 'piano', gain=0.11, vel=0.5)
    # the Tamari move their tents (dry humor)
    S.pads(A('g05'), A('g06'), ['Dm', 'Am'], 2.4, gain=0.04, bright=900, att=1.0)
    S.melody(A('g05', 2.4), [(74, 0.5), (72, 0.5), (69, 1), (None, 0.5), (74, 0.5), (76, 0.5), (74, 1.5)], 0.3, 'pluck', gain=0.12, vel=0.7)
    S.pads(A('g05'), A('g06'), ['Am', 'Dm'], 3.0, gain=0.04, bright=1100, att=1.0)
    # ---------------- the Grey Sleep (1640-1643)
    S.T.add(A('g06') - 1.6, reverse_cymbal(1.6, 0.4))
    S.drone(A('g06'), A('g10'), 25, gain=0.13, bright=330)
    S.pads(A('g06'), A('g07'), ['Am', 'F'], 2.3, gain=0.06, bright=900, att=1.0)
    for k in range(3):
        S.T.add(A('g06', 0.3 + k * 1.5), bell(57 + (k % 2) * 6, 4.0, 0.6, 1.41, 3.0), gain=0.12)
    S.pads(A('g07'), A('g08'), ['Am', 'Fm', 'Am', 'Fm'], 1.95, gain=0.06, bright=700, att=0.8)
    t = A('g07', 0.2)
    while t < A('g08'):
        S.T.add(t, hat(0.35), gain=0.12, pan=RNG.random() - 0.5); t += 0.09 + RNG.random() * 0.35
    S.T.add(A('g07', 1.69), bell(70, 3.0, 0.4, 1.41), gain=0.08)
    S.T.add(A('g07', 4.77), bell(64, 3.0, 0.4, 1.41), gain=0.08)
    S.pads(A('g08'), A('g10'), ['Am'], 4.0, gain=0.05, bright=600, choir=0.9, att=1.2)
    beat = 0.75
    t = A('g08')
    while t < A('g10') - 0.2:
        S.T.add(t, kick(0.55), gain=0.16); S.T.add(t + 0.2, kick(0.35), gain=0.1); beat *= 1.12; t += beat
    for k in range(4):
        S.T.add(A('g09', 0.2 + k * 0.9), bell(45, 3.0, 0.7, 1.0, 1.2), gain=0.12)
    # Sefa: hope, carefully
    S.pads(A('g10'), A('g11', 2.6), ['Am', 'F', 'C', 'G'], 2.4, gain=0.07, bright=1500, att=1.4)
    S.melody(A('g10', 0.4), [(69, 2), (72, 1), (76, 1), (74, 3), (None, 1), (72, 1), (74, 1), (76, 2), (79, 4)], 0.45, 'piano', gain=0.11, vel=0.5)
    S.T.add(A('g11', 2.11), bell(84, 3.0, 0.4), gain=0.08)
    # a dangerous question
    S.drone(A('g11', 2.6), A('c14'), 28, gain=0.12, bright=420)
    S.pads(A('g11', 2.6), A('c14'), ['Em', 'C', 'Em', 'B'], 2.0, gain=0.06, bright=1000, att=1.0)
    S.T.add(A('g12', 1.66), bell(83, 4.0, 0.45, 3.7), gain=0.10)
    S.T.add(A('c14') - 1.2, riser(1.2, 0.25))
    S.pads(A('c14'), A('chap:d01') + 0.5, ['Cm', 'Ab', 'Fm', 'G'], 2.2, gain=0.07, bright=1200, att=1.0)
    S.drums(A('c14'), A('chap:d01'), 0.55, 's.s.s.s.s.s.sss.', gain=0.11)
    S.drone(A('c14'), A('chap:d01'), 31, gain=0.11, bright=420)
    # ---------------- chapter VIII: one stone, one voice
    c8 = A('chap:d01')
    S.pads(c8 + 0.4, A('d04'), ['D', 'Bm', 'G', 'A'], 3.0, gain=0.06, bright=1500, att=1.4)
    S.arp(c8 + 0.4, A('d03'), ['D', 'Bm', 'G', 'A'], 3.0, 0.375, 'piano', gain=0.05, octave=4, pattern=(0, 1, 2, 1))
    S.melody(A('d03L'), [(74, 1), (76, 1), (78, 2), (81, 3), (79, 1), (78, 4)], 0.45, 'bell', gain=0.07)
    S.arp(A('d04'), A('d07'), ['G', 'D', 'Em', 'C'], 2.2, 0.275, 'pluck', gain=0.1, octave=4, pattern=(0, 2, 1, 2, 3, 2, 1, 2))
    S.pads(A('d04'), A('d07'), ['G', 'D', 'Em', 'C'], 2.2, gain=0.07, bright=2000, choir=0.5, bass=0.5)
    S.melody(A('d05', 0.3), [(79, 1), (83, 1), (86, 2), (84, 1), (83, 1), (81, 2), (79, 1), (81, 1), (83, 4)], 0.4, 'bell', gain=0.08)
    S.T.add(A('d06') - 1.0, riser(1.0, 0.2))
    S.T.add(A('d06'), bell(86, 3.5, 0.5), gain=0.12)
    S.pads(A('d07'), A('d09'), ['Em', 'C', 'G', 'D'], 3.0, gain=0.07, bright=1200, choir=0.6, att=1.8)
    S.arp(A('d07'), A('d09'), ['Em', 'C', 'G', 'D'], 3.0, 0.5, 'bell', gain=0.04, octave=5, pattern=(0, 1, 2, 3))
    S.ostinato(A('d09'), A('d12'), ['G', 'D', 'Em', 'C'], 1.2, 0.15, gain=0.05, octave=3)
    S.pads(A('d09'), A('d12'), ['G', 'D', 'Em', 'C'], 1.2, gain=0.07, bright=2400, bass=0.6, att=0.4)
    S.drums(A('d10'), A('d12'), 0.6, 'k.h.s.h.k.hks.h.', gain=0.15)
    S.pads(A('d11b', 3.47), A('d12'), ['C', 'G', 'D', 'D'], 1.2, gain=0.06, choir=0.9, bright=2400, att=0.5)
    S.melody(A('d11b', 3.47), [(74, 1), (79, 1), (83, 2), (81, 1), (79, 1), (78, 2)], 0.35, 'bell', gain=0.08)
    S.drone(A('d12'), A('d17'), 30, gain=0.13, bright=420)
    S.pads(A('d12'), A('d15'), ['Fm', 'Db', 'Fm', 'C'], 2.6, gain=0.06, bright=1000, att=1.2)
    S.drums(A('d13'), A('d15'), 0.7, 't...t...t...t.t.', gain=0.18)
    S.ostinato(A('d15'), A('d16'), ['Fm', 'Fm', 'Db', 'C'], 1.0, 0.125, gain=0.07, octave=2)
    S.drums(A('d15'), A('d16'), 0.5, 'T.t.t.t.T.t.tttt', gain=0.22)
    S.hit(A('d16'), 0.8, rev=False)
    S.pads(A('d16', 0.4), A('d17'), ['Fm', 'Db'], 2.2, gain=0.06, bright=900, att=1.6)
    # reset: eerie
    S.pads(A('d17'), A('chap:x01') + 0.4, ['Em', 'Em', 'C', 'B'], 2.8, gain=0.05, bright=700, att=2.0)
    for k in range(int((A('chap:x01') - A('d18')) / 0.9)):
        S.T.add(A('d18') + k * 0.9, kick(0.5), gain=0.16); S.T.add(A('d18') + k * 0.9 + 0.2, kick(0.32), gain=0.1)
    S.T.add(A('d20'), bell(83, 4.0, 0.4), gain=0.1)
    # ---------------- chapter IX: the night of torches (epic)
    c9 = A('chap:x01')
    S.drone(c9, A('x08'), 26, gain=0.14, bright=420)
    S.drums(c9 + 0.4, A('x05'), 0.9, 'T.......t.......', gain=0.26)
    S.pads(A('x02'), A('x05'), ['Dm', 'Bb', 'C', 'Dm', 'Gm', 'Bb', 'A', 'A'], 1.85, gain=0.08, bright=1800, choir=0.7, bass=0.8, att=0.8)
    S.ostinato(A('x02'), A('x05'), ['Dm', 'Bb', 'C', 'Dm', 'Gm', 'Bb', 'A', 'A'], 1.85, 0.231, gain=0.05, octave=2)
    S.pads(A('x05'), A('x07'), ['Dm', 'Dm'], 3.0, gain=0.05, bright=800, att=1.0)
    S.arp(A('x06'), A('x07'), ['Dm', 'Bb', 'F', 'C'], 1.8, 0.225, 'piano', gain=0.06, octave=4, pattern=(0, 1, 2, 3))
    S.pads(A('x07'), A('x08'), ['Bb', 'F', 'C', 'C'], 1.5, gain=0.07, bright=1600, choir=0.5, att=0.8)
    S.T.add(A('x08') - 1.5, riser(1.5, 0.3))
    S.pads(A('x08'), A('x11'), ['F', 'C', 'Dm', 'Bb', 'F', 'C', 'Bb', 'Bb'], 1.15, gain=0.11, bright=3000, choir=0.9, bass=0.8, att=0.25)
    S.hit(A('x08', 0.2), 0.9, rev=False)
    S.melody(A('x09'), [(77, 1), (81, 1), (84, 2), (86, 1), (84, 1), (81, 2), (79, 1), (81, 1), (77, 4)], 0.3, 'bell', gain=0.10)
    S.drums(A('x11'), A('x12'), 0.45, 'T.t.t.t.T.t.tttt', gain=0.26)
    S.ostinato(A('x11'), A('x12'), ['Dm', 'Dm', 'Bb', 'A'], 0.9, 0.1125, gain=0.07, octave=2)
    S.pads(A('x12'), A('x13'), ['Dm'], 3.0, gain=0.04, bright=700, att=0.6)
    S.T.add(A('x12L'), piano(62, 3.0, 0.5), gain=0.14)
    S.pads(A('x13'), A('x15'), ['Bb', 'F', 'C', 'Dm'], 1.6, gain=0.07, bright=1800, choir=0.5, att=0.8)
    S.drums(A('x13'), A('x14'), 0.4, 't.t.t.t.t.t.tttt', gain=0.18)
    S.hit(A('x14'), 0.7, rev=True)
    S.pads(A('x15'), A('x17'), ['Am', 'F', 'C', 'G'], 2.4, gain=0.07, bright=1400, att=1.4)
    S.melody(A('x15', 0.4), [(76, 2), (72, 1), (74, 1), (71, 3), (None, 1), (69, 2), (71, 1), (72, 1), (69, 4)], 0.5, 'piano', gain=0.11, vel=0.5)
    S.T.add(A('x17'), bell(81, 3.0, 0.4), gain=0.1)
    S.pads(A('x18'), A('x19'), ['D', 'A', 'Bm', 'G', 'D', 'A', 'G', 'A'], 1.3, gain=0.11, bright=3200, choir=0.9, bass=0.8, att=0.3)
    S.hit(A('x18', 1.2), 0.8, rev=False)
    S.melody(A('x18', 1.2), [(74, 1), (78, 1), (81, 2), (83, 1), (81, 1), (78, 2), (76, 1), (78, 1), (74, 4)], 0.36, 'bell', gain=0.10)
    S.arp(A('x19'), A('x21'), ['G', 'D', 'C', 'D'], 1.8, 0.225, 'pluck', gain=0.07, octave=4, pattern=(0, 2, 1, 2, 3, 2, 1, 2))
    S.drums(A('x19'), A('x20'), 0.45, 'k.x.s.x.k.xks.x.', gain=0.12)
    S.pads(A('x20'), A('x21'), ['D', 'G'], 1.0, gain=0.07, bright=1800, att=0.6)
    S.pads(A('x21'), A('chap:m01') + 0.6, ['D', 'A', 'Bm', 'G', 'D', 'A', 'G', 'A'], 1.2, gain=0.1, bright=3000, choir=0.8, bass=0.8, att=0.3)
    S.drums(A('x21'), A('x21', 5.6), 0.6, 'T...t...T...t.t.', gain=0.24)
    S.melody(A('x21', 0.0), [(74, 1), (78, 1), (81, 2), (83, 1), (81, 1), (78, 2), (76, 1), (78, 1), (74, 4)], 0.42, 'bell', gain=0.10)
    for o in (0.11, 0.63, 1.15, 1.69, 2.17, 2.69, 3.25):
        S.T.add(A('x21', o), taiko(0.9), gain=0.2); S.T.add(A('x21', o), timpani(49, 0.5), gain=0.15)
    S.hit(A('x21', 7.45), 1.0, rev=True)
    # ---------------- chapter X: the message (awe)
    c10 = A('chap:m01')
    S.drone(c10, A('m11'), 26, gain=0.11, bright=450)
    S.pads(c10 + 0.6, A('m05'), ['Bm', 'G', 'D', 'A'], 3.2, gain=0.06, bright=1400, choir=0.5, att=1.6)
    S.arp(A('m04'), A('m05'), ['Bm', 'G', 'D', 'A'], 1.6, 0.2, 'pluck', gain=0.05, octave=4, pattern=(0, 1, 2, 1))
    S.pads(A('m05'), A('m07'), ['G', 'D', 'Em', 'Bm', 'C', 'G', 'D', 'D'], 1.8, gain=0.08, bright=2200, choir=0.8, bass=0.6, att=0.8)
    S.T.add(A('m06') - 1.4, riser(1.4, 0.3))
    for sid in ('m07', 'm08'):
        S.hit(A(sid), 0.7, rev=False)
    S.pads(A('m07'), A('m10'), ['C', 'G', 'Am', 'F'], 1.9, gain=0.09, bright=2800, choir=0.9, bass=0.8, att=0.4)
    S.pads(A('m09'), A('m10'), ['Am'], 2.5, gain=0.05, bright=900, att=0.5)
    S.T.add(A('m10') - 2.0, riser(2.0, 0.4))
    S.hit(A('m10', 0.15), 1.0, rev=False)
    S.T.add(A('m10', 3.4), boom(0.8, 38), gain=0.4)
    S.pads(A('m11'), A('m14'), ['D', 'Bm', 'G', 'A'], 2.6, gain=0.06, bright=1600, att=1.6)
    S.arp(A('m11'), A('m14'), ['D', 'Bm', 'G', 'A'], 2.6, 0.325, 'piano', gain=0.05, octave=4, pattern=(0, 1, 2, 1))
    S.pads(A('m14'), A('outro'), ['Em', 'C'], 2.6, gain=0.075, bright=900, choir=0.4, att=1.4)
    S.T.add(A('m14', 3.8), bell(95, 5.0, 0.4, 2.8), gain=0.1)
    # ---------------- outro: the theme, warm
    o = A('outro')
    S.pads(o, A('end') - 0.5, ['D', 'A', 'Bm', 'G'], 2.4, gain=0.09, bright=2400, choir=0.6, bass=0.7, att=0.8)
    S.melody(o + 0.4, [(74, 1), (78, 1), (81, 2), (83, 1), (81, 1), (78, 2), (76, 1), (78, 1), (74, 4), (None, 2), (74, 1), (78, 1), (81, 2), (86, 2), (83, 2), (81, 4)], 0.6, 'piano', gain=0.13, vel=0.55)
    S.arp(o + 4.8, A('end') - 1.0, ['D', 'A', 'Bm', 'G'], 2.4, 0.3, 'bell', gain=0.04, octave=5, pattern=(0, 1, 2, 3))
    return S.T


def reverb_ir(seconds=3.0, seed=1):
    n = int(seconds * SR); t = np.arange(n) / SR
    r = np.random.default_rng(seed)
    out = []
    for ch in range(2):
        x = r.standard_normal(n) * np.exp(-t / (seconds / 6.9) * 1.0)
        # darker tail: progressively lowpassed
        lo = lowpass(x, 3000)
        x = x * np.exp(-t * 2.0) + lo * (1 - np.exp(-t * 2.0))
        x[:int(0.012 * SR)] *= np.linspace(0, 1, int(0.012 * SR))
        out.append(x / np.sqrt(np.sum(x ** 2)))
    return out


def apply_reverb(L, R, wet=0.28, seconds=3.2):
    irL, irR = reverb_ir(seconds)
    wL = signal.fftconvolve(L, irL)[:len(L)]
    wR = signal.fftconvolve(R, irR)[:len(R)]
    return L * (1 - wet) + wL * wet * 2.2, R * (1 - wet) + wR * wet * 2.2


if __name__ == "__main__":
    os.makedirs(OUT, exist_ok=True)
    tl = json.load(open(os.path.join(HERE, "timeline.json")))
    T = compose(tl)
    L, R = apply_reverb(T.L.astype(np.float64), T.R.astype(np.float64))
    L, R = highpass(L, 28), highpass(R, 28)
    pk = max(np.abs(L).max(), np.abs(R).max())
    L, R = L / pk * 0.89, R / pk * 0.89
    n = int(tl['total'] * SR)
    sf.write(os.path.join(OUT, "music.wav"), np.stack([L[:n], R[:n]], 1).astype(np.float32), SR, subtype='FLOAT')
    print("music.wav", n / SR, "s")
