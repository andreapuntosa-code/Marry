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
    ch = lambda c: A('chap:' + c)
    D = lambda a, b, **k: S.pads(A(a), A(b), **k)
    VER = ['Dm', 'Bb', 'F', 'C']          # forest: modal, woody
    AUR = ['D', 'A', 'Bm', 'G']           # plain: open, golden
    MIN = ['Am', 'F', 'C', 'G']
    # ---------------- cold open: mystery -> build -> title hit
    t_title = A('title')
    S.drone(0.0, t_title, 38, gain=0.10)
    S.pads(0.3, 15.3, VER, 3.75, gain=0.07, bright=1200, att=1.6)
    motif = [(62, 1), (65, 1), (69, 2), (67, 1), (65, 1), (64, 2), (62, 4)]
    S.melody(0.8, motif, 0.47, 'piano', gain=0.14, vel=0.6)
    S.melody(8.6, [(m + 12 if m else None, b) for m, b in motif], 0.47, 'bell', gain=0.08, vel=0.5)
    S.pads(15.3, t_title, ['Dm', 'Bb', 'F', 'C', 'Gm', 'Bb', 'C', 'C'], 2.2, gain=0.09, bright=2400, choir=0.5, bass=0.6, att=0.8)
    S.ostinato(15.3, t_title - 0.3, ['Dm', 'Bb', 'F', 'C', 'Gm', 'Bb', 'C', 'C'], 2.2, 0.275, gain=0.05)
    S.drums(20.6, t_title - 0.3, 0.55, 't...t...t.t.t...', gain=0.22)
    S.T.add(t_title - 2.5, riser(2.5, 0.35))
    S.hit(t_title, 1.0)
    S.pads(t_title, ch('r01') + 1.0, AUR, 1.05, gain=0.11, bright=3200, choir=0.7, bass=0.8, att=0.2)
    S.melody(t_title, [(74, 1), (78, 1), (81, 2), (83, 1), (81, 1), (78, 2)], 0.35, 'bell', gain=0.10, vel=0.7)
    # ---------------- I the rules: curious, bright
    S.arp(ch('r01') + 0.4, ch('n01'), ['C', 'Am', 'F', 'G'], 2.4, 0.3, 'pluck', gain=0.09, octave=4, pattern=(0, 2, 1, 3, 2, 1))
    S.pads(ch('r01') + 0.4, ch('n01'), ['C', 'Am', 'F', 'G'], 2.4, gain=0.06, bright=1600, bass=0.5)
    S.drums(A('r09'), ch('n01'), 0.6, 'x.x.x.xxx.x.x.x.', gain=0.10)
    S.T.add(A('r09') - 0.3, boom(0.7), gain=0.35)
    # ---------------- II the first night: dark, lonely
    S.drone(ch('n01'), ch('s01'), 33, gain=0.10, bright=420)
    S.pads(ch('n01'), A('n24'), ['Am', 'F', 'Dm', 'Am'], 3.4, gain=0.07, bright=900, att=1.6)
    S.melody(A('n03'), [(69, 2), (67, 1), (64, 1), (62, 3), (None, 1), (64, 2), (60, 4)], 0.55, 'piano', gain=0.11, vel=0.5)
    S.pads(A('n24'), ch('s01'), VER, 2.6, gain=0.07, bright=1800, att=0.9)       # the forest cast
    S.melody(A('n24'), [(74, 1), (72, 1), (69, 2), (72, 1), (74, 1), (77, 2)], 0.4, 'pluck', gain=0.08, pan=-0.3)
    S.pads(A('n25'), ch('s01'), AUR, 2.6, gain=0.07, bright=2200, att=0.9)       # the plain cast
    S.melody(A('n25'), [(78, 1), (76, 1), (73, 2), (76, 1), (78, 1), (81, 2)], 0.4, 'bell', gain=0.07, pan=0.3)
    # ---------------- III survival: building, hopeful drive
    S.arp(ch('s01') + 0.5, ch('g01'), VER, 2.2, 0.275, 'pluck', gain=0.075, octave=4, pattern=(0, 1, 2, 1, 3, 1))
    S.pads(ch('s01') + 0.5, ch('g01'), VER, 2.2, gain=0.065, bright=1800, bass=0.6)
    S.ostinato(A('s08'), ch('g01'), VER, 2.2, 0.275, gain=0.045)
    S.drums(A('s12'), ch('g01'), 0.55, 'k...x...k.k.x...', gain=0.12)
    S.pads(A('s22'), ch('g01') + 0.5, ['Dm', 'Bb', 'Gm', 'A'], 1.6, gain=0.09, bright=2600, choir=0.5, bass=0.6)
    # ---------------- IV the gods: choir, wonder, then dread
    S.pads(ch('g01'), A('g02'), ['Am', 'F', 'C', 'G'], 3.0, gain=0.07, bright=1200, att=1.2)
    S.pads(A('g02'), A('g07'), ['Dm', 'Bb', 'Gm', 'A'], 2.4, gain=0.09, bright=2000, choir=0.9, bass=0.7, att=0.6)
    for sid in ('g02', 'g04', 'g06'):
        S.hit(A(sid), 0.8)
    S.pads(A('g07'), A('g10'), ['Dm', 'F', 'Am', 'C'], 3.0, gain=0.08, bright=1500, choir=0.8, att=1.6)
    S.pads(A('g10'), A('g15'), ['D', 'Bm', 'G', 'A'], 2.8, gain=0.10, bright=2400, choir=1.0, bass=0.8, att=1.0)
    S.T.add(A('g10') - 2.0, riser(2.0, 0.3)); S.hit(A('g12'), 0.9)
    S.pads(A('g15'), ch('v01'), ['Bm', 'G', 'D', 'A'], 2.8, gain=0.07, bright=1700, choir=0.5, att=1.2)
    # ---------------- V the vote: warm piano, civic
    S.arp(ch('v01') + 0.5, ch('u01'), ['G', 'Em', 'C', 'D'], 2.4, 0.3, 'piano', gain=0.075, octave=4, pattern=(0, 2, 1, 2))
    S.pads(ch('v01') + 0.5, ch('u01'), ['G', 'Em', 'C', 'D'], 2.4, gain=0.06, bright=1800, bass=0.5)
    S.pads(A('v14'), A('v18'), ['Bm', 'G', 'Em', 'F#'], 2.0, gain=0.09, bright=1300, att=1.0)        # Mara's promise
    S.ostinato(A('v14'), A('v18'), ['Bm', 'G', 'Em', 'F#'], 2.0, 0.25, gain=0.04)
    S.pads(A('v19'), ch('u01'), ['D', 'A', 'Bm', 'G'], 2.0, gain=0.10, bright=2800, choir=0.6, bass=0.6)
    # ---------------- VI the hunger: sparse, minor
    S.drone(ch('u01'), ch('k01'), 31, gain=0.09, bright=380)
    S.pads(ch('u01'), ch('k01'), ['Am', 'Dm', 'F', 'E'], 3.6, gain=0.06, bright=1000, att=1.6)
    S.melody(A('u02'), [(72, 2), (71, 1), (69, 1), (67, 3), (None, 1), (69, 4)], 0.6, 'piano', gain=0.10, vel=0.5)
    S.ostinato(A('u08'), A('u13'), ['Am', 'Dm', 'F', 'E'], 2.4, 0.3, gain=0.05)                        # the trial
    S.drums(A('u08'), A('u13'), 0.6, 't.......t.......', gain=0.15)
    S.pads(A('u21'), A('u24'), ['Dm', 'Bb', 'Gm', 'A'], 2.4, gain=0.09, bright=1400, choir=0.8, att=1.0)  # Thorn leaves
    S.pads(A('u26'), A('u31'), ['Am', 'F', 'Dm', 'E'], 4.0, gain=0.09, bright=900, choir=0.7, att=2.0)     # Bark dies
    S.melody(A('u26'), [(81, 3), (79, 1), (76, 4), (None, 1), (74, 3), (72, 4)], 0.7, 'bell', gain=0.07)
    S.pads(A('u32'), ch('k01'), ['F', 'C', 'G', 'Am'], 2.4, gain=0.07, bright=2000, choir=0.4)
    # ---------------- VII the coup: taiko, menace
    S.drone(ch('k01'), ch('c01'), 29, gain=0.10, bright=420)
    S.ostinato(A('k02'), A('k10'), ['Dm', 'Dm', 'Bb', 'A'], 2.0, 0.25, gain=0.07, octave=2)
    S.drums(A('k02'), A('k10'), 0.5, 't...t.t.t...t.tt', gain=0.24)
    S.pads(A('k02'), A('k10'), ['Dm', 'Bb', 'Gm', 'A'], 2.0, gain=0.09, bright=1800, choir=0.7, bass=0.9)
    S.hit(A('k05'), 1.0)
    S.pads(A('k10'), A('k13'), ['Dm', 'Bb', 'F', 'A'], 2.4, gain=0.08, bright=1500, bass=0.6)
    S.pads(A('k13'), A('k17'), ['F', 'C', 'Am', 'G'], 3.0, gain=0.08, bright=1600, choir=0.5, att=1.4)  # the Reapers leave
    S.melody(A('k13'), [(76, 2), (74, 1), (72, 1), (74, 3), (None, 1), (72, 4)], 0.55, 'piano', gain=0.11, vel=0.5)
    S.pads(A('k17'), ch('c01'), ['Gm', 'Eb', 'Bb', 'F'], 2.4, gain=0.08, bright=1400, bass=0.7)
    S.hit(A('k22'), 0.8)
    # ---------------- VIII the crack: tender, secret
    S.pads(ch('c01'), A('c14'), ['F', 'Am', 'Dm', 'Bb'], 3.2, gain=0.07, bright=1500, att=1.4)
    S.melody(A('c02'), [(77, 2), (76, 1), (72, 1), (74, 3), (None, 1), (77, 2), (76, 2), (72, 4)], 0.55, 'piano', gain=0.12, vel=0.55)
    S.pads(A('c14'), A('c20'), ['Am', 'Em', 'F', 'G'], 2.0, gain=0.08, bright=1100, att=0.8)
    S.ostinato(A('c14'), A('c20'), ['Am', 'Em', 'F', 'G'], 2.0, 0.25, gain=0.05)                      # the secret meeting
    S.pads(A('c20'), A('c32'), ['C', 'G', 'Am', 'F'], 2.4, gain=0.09, bright=2200, choir=0.6, att=0.8)
    S.melody(A('c25'), [(79, 1), (81, 1), (84, 2), (83, 1), (81, 1), (79, 2), (76, 4)], 0.45, 'bell', gain=0.09)  # the treaty
    S.pads(A('c32'), ch('p01'), ['Dm', 'Bb', 'Gm', 'A'], 2.0, gain=0.09, bright=1300, bass=0.8)     # Kesh and Thorn
    S.drone(A('c32'), ch('p01'), 31, gain=0.10, bright=380)
    # ---------------- IX the last night: the build to war
    S.pads(ch('p01'), A('p15'), ['Dm', 'Bb', 'F', 'C'], 2.4, gain=0.08, bright=1600, bass=0.7, choir=0.4)
    S.ostinato(A('p02'), A('p15'), ['Dm', 'Bb', 'F', 'C'], 2.4, 0.3, gain=0.05)
    S.drums(A('p04'), A('p15'), 0.6, 't.......t...t...', gain=0.16)
    S.melody(A('p10'), [(69, 3), (65, 1), (62, 4), (None, 2), (69, 2), (65, 2), (62, 4)], 0.6, 'bell', gain=0.07)
    S.pads(A('p15'), ch('w01'), ['Dm', 'Dm', 'Bb', 'A'], 1.8, gain=0.09, bright=1200, choir=0.6, att=1.2)
    S.T.add(ch('w01') - 3.0, riser(3.0, 0.35))
    # ---------------- X day 365: war
    S.drone(ch('w01'), A('w03'), 29, gain=0.12, bright=350)
    S.pads(A('w03'), A('w04'), ['Dm'], 3.0, gain=0.10, bright=900, choir=0.8)
    S.hit(A('w04', 0.0), 1.2)
    S.pads(A('w05'), A('w07'), ['Dm', 'Bb'], 2.8, gain=0.08, bright=1100, att=1.2)
    S.T.add(A('w07') + 0.2, boom(0.8), gain=0.3)
    S.ostinato(A('w08'), A('w19'), ['Dm', 'Dm', 'Bb', 'A'], 1.6, 0.2, gain=0.08, octave=2)
    S.drums(A('w08'), A('w19'), 0.45, 'T..t.t..T.t.t.tt', gain=0.30)
    S.pads(A('w08'), A('w19'), ['Dm', 'Bb', 'Gm', 'A'], 1.8, gain=0.10, bright=2200, choir=1.0, bass=0.9)
    S.drums(A('w12'), A('w19'), 0.45, 'kkskkskkskkskksk', gain=0.20)
    S.pads(A('w19'), A('w24'), ['Dm', 'Bb', 'F', 'A'], 1.6, gain=0.09, bright=1800, choir=0.6, bass=0.7)
    S.ostinato(A('w19'), A('w28'), ['Dm', 'Gm', 'Bb', 'A'], 1.6, 0.2, gain=0.08, octave=2)
    S.drums(A('w22'), A('w28'), 0.4, 'T.tt.tT.t.tt.tTt', gain=0.30)
    S.hit(A('w28'), 1.0, rev=False)                                                                  # Oak cuts the rope
    S.pads(A('w29'), A('w33'), ['Bb', 'Gm', 'Eb', 'F'], 3.6, gain=0.09, bright=1100, choir=0.8, att=1.6)
    S.melody(A('w30'), [(74, 3), (72, 1), (69, 4), (None, 1), (65, 3), (62, 4)], 0.7, 'piano', gain=0.11, vel=0.5)
    S.pads(A('w33'), A('w40'), ['Dm', 'Bb', 'Gm', 'A'], 3.0, gain=0.09, bright=1300, choir=0.7, att=1.4)
    S.melody(A('w37'), [(76, 3), (74, 1), (72, 4), (None, 1), (69, 6)], 0.7, 'piano', gain=0.12, vel=0.55)   # Thorn
    S.pads(A('w40'), A('w45'), ['F', 'C', 'Dm', 'Bb'], 2.4, gain=0.09, bright=1800, choir=0.6, att=0.8)      # the river
    S.melody(A('w44'), [(72, 2), (74, 2), (76, 4), (None, 1), (79, 6)], 0.6, 'bell', gain=0.09)
    S.pads(A('w45'), A('w49'), ['D', 'A', 'Bm', 'G'], 1.8, gain=0.12, bright=2800, choir=1.0, bass=0.7, att=0.3)  # Dune's choice
    S.hit(A('w45', 0.6), 0.9)
    S.drums(A('w47'), A('w49'), 0.45, 't...t.t.t...t.tt', gain=0.22)
    S.pads(A('w49'), A('w52'), ['Dm', 'Bb', 'Gm', 'A'], 1.6, gain=0.09, bright=1500, bass=0.9)
    S.drums(A('w50'), A('w53'), 0.45, 'T...............', gain=0.30)
    S.drone(A('w52'), A('w57'), 29, gain=0.12, bright=300)
    S.T.add(A('w54'), boom(1.0), gain=0.4)                                                           # the duel: silence, then one hit
    S.pads(A('w56'), A('w58'), ['Dm', 'Bb', 'F', 'Am'], 4.0, gain=0.10, bright=900, choir=0.9, att=2.0)
    S.melody(A('w56'), [(74, 4), (72, 2), (69, 6), (None, 2), (65, 8)], 0.75, 'piano', gain=0.12, vel=0.45)
    S.pads(A('w58'), A('w59'), ['Am'], 4.0, gain=0.07, bright=900, att=1.5)
    S.drone(A('w59'), A('w63'), 33, gain=0.08, bright=350)                                           # Moss: almost silence
    S.melody(A('w60'), [(69, 6), (None, 2), (67, 6)], 0.8, 'bell', gain=0.06)
    S.pads(A('w63'), ch('e01') + 2.0, ['F', 'Dm', 'Bb', 'C'], 3.4, gain=0.09, bright=1300, choir=0.7, att=1.6)
    # ---------------- XI the winner: silence, then grace
    S.drone(ch('e01'), A('e05'), 31, gain=0.08, bright=350)
    S.hit(A('e05', 0.0), 0.9, rev=False)
    S.pads(A('e05'), A('e07'), ['Dm', 'Bb'], 4.0, gain=0.06, bright=900, att=1.8)
    # e07-e12: no score but a single piano, then the handshake
    S.melody(A('e07') + 2.0, [(69, 4), (65, 2), (62, 6), (None, 2), (65, 4), (62, 2), (60, 8)], 0.7, 'piano', gain=0.11, vel=0.4)
    S.pads(A('e10'), A('e13'), ['F', 'C', 'Dm', 'Bb'], 3.2, gain=0.09, bright=1500, choir=0.7, att=1.4)
    S.melody(A('e11'), [(72, 2), (74, 2), (77, 4), (None, 1), (76, 2), (74, 2), (72, 6)], 0.6, 'bell', gain=0.09)
    S.pads(A('e13'), A('e17'), ['C', 'G', 'Am', 'F'], 2.8, gain=0.075, bright=1700, att=1.2)
    S.arp(A('e13'), A('e17'), ['C', 'G', 'Am', 'F'], 2.8, 0.35, 'piano', gain=0.06, octave=4, pattern=(0, 2, 1, 2))
    S.pads(A('e17'), A('e19'), ['Am', 'F', 'C', 'G'], 2.6, gain=0.07, bright=1500, att=1.0)
    S.pads(A('e19'), A('outro'), ['D', 'A', 'Bm', 'G'], 2.0, gain=0.10, bright=2800, choir=0.8, bass=0.7, att=0.4)
    S.melody(A('e19'), [(74, 1), (78, 1), (81, 2), (83, 1), (81, 1), (78, 2), (74, 4)], 0.4, 'bell', gain=0.09)
    S.pads(A('outro'), A('end'), ['D', 'A', 'Bm', 'G'], 2.4, gain=0.09, bright=2400, choir=0.6, bass=0.6, att=0.4)
    S.arp(A('outro'), A('end'), ['D', 'A', 'Bm', 'G'], 2.4, 0.3, 'pluck', gain=0.07, octave=4)
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
