#!/usr/bin/env python3
"""Generate the ambient soundtrack procedurally (no samples, no third-party audio).

Reads src/content.json so every cue (clock ticks, typewriter keys, stamps, pins, lamp)
lines up with the visuals. Writes public/audio/soundtrack.wav (48 kHz, stereo).
Run again after changing texts or timings:  npm run audio
"""
import json
import os
import wave

import numpy as np
from scipy.signal import butter, sosfilt

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SR = 48000
rng = np.random.default_rng(1990)

content = json.load(open(os.path.join(ROOT, 'src', 'content.json')))
starts, t0 = {}, 0.0
for s in content['scenes']:
    starts[s['id']] = t0
    t0 += s['duration']
TOTAL = t0
N = int(TOTAL * SR)
out = np.zeros((N, 2))


def sc(scene_id):
    return next(s for s in content['scenes'] if s['id'] == scene_id)


def filt(x, kind, f, order=2):
    return sosfilt(butter(order, f, kind, fs=SR, output='sos'), x)


def add(sig, at, gain=1.0, pan=0.5):
    i = int(at * SR)
    if i >= N or i + len(sig) <= 0:
        return
    sig = sig[: N - i]
    out[i:i + len(sig), 0] += sig * gain * np.sqrt(1 - pan)
    out[i:i + len(sig), 1] += sig * gain * np.sqrt(pan)


def env(n, attack, release):
    e = np.ones(n)
    a = max(1, int(attack * SR))
    r = max(1, int(release * SR))
    e[:a] = np.linspace(0, 1, a)
    e[-r:] *= np.linspace(1, 0, r)
    return e


def curve(points):
    """Piecewise-linear gain over the whole timeline: [(sec, gain), ...]."""
    ts = np.arange(N) / SR
    xs, ys = zip(*points)
    return np.interp(ts, xs, ys)


# ---------------------------------------------------------------- drone bed
ts = np.arange(N) / SR
drone = np.zeros(N)
for f, a in ((55.0, 0.5), (55.4, 0.4), (82.4, 0.25), (110.3, 0.12), (164.8, 0.05)):
    drone += a * np.sin(2 * np.pi * f * ts + rng.uniform(0, 6))
drone *= 0.6 + 0.4 * np.sin(2 * np.pi * ts / 11.0) ** 2
room = filt(rng.normal(0, 1, N), 'lowpass', 500) * 0.6
bed_gain = curve([
    (0, 0), (2, 0.5), (starts['building'], 0.7), (starts['office'], 0.6),
    (starts['lightsOut'] + 3.6, 0.9), (starts['caseFile'], 0.7), (starts['threads'], 0.85),
    (starts['dna'], 0.6), (starts['finale'], 0.9), (TOTAL - 1.2, 0.5), (TOTAL, 0),
])
for ch in range(2):
    out[:, ch] += (drone * 0.05 + room * 0.03) * bed_gain

# high, airy pad for the lab scene
dna = sc('dna')
s0 = starts['dna']
n = int(dna['duration'] * SR)
tt = np.arange(n) / SR
pad = sum(np.sin(2 * np.pi * f * tt + k) for k, f in enumerate((880.0, 1318.5, 1760.0)))
add(pad * env(n, 1.5, 2.0) * 0.006, s0)

# ---------------------------------------------------------------- one-shots
def click(freq=2600, decay=0.004, noise=0.6):
    n = int(0.03 * SR)
    t = np.arange(n) / SR
    x = (1 - noise) * np.sin(2 * np.pi * freq * t) + noise * rng.normal(0, 1, n)
    return filt(x * np.exp(-t / decay), 'highpass', 900)


def thump(freq=70, decay=0.18, n_sec=0.6):
    n = int(n_sec * SR)
    t = np.arange(n) / SR
    body = np.sin(2 * np.pi * freq * t * (1 - 0.3 * t)) * np.exp(-t / decay)
    hit = filt(rng.normal(0, 1, n), 'lowpass', 1800) * np.exp(-t / 0.012)
    return body + 0.5 * hit


def swish(n_sec=0.5, lo=600, hi=4000):
    n = int(n_sec * SR)
    t = np.arange(n) / SR
    x = filt(rng.normal(0, 1, n), 'bandpass', [lo, hi])
    return x * np.sin(np.pi * t / n_sec) ** 2


# clock ticks: one per second in the cold open (the hand jumps on each second)
for k in range(1, int(sc('coldOpen')['duration'])):
    add(click(3400, 0.003, 0.4), starts['coldOpen'] + k, 0.22 if k % 2 else 0.17, 0.5)
    add(thump(180, 0.02, 0.1), starts['coldOpen'] + k, 0.05)

# typewriter keys for every typed text
for s in content['scenes']:
    for tx in s.get('texts', []):
        at = starts[s['id']] + tx['at']
        for i, ch in enumerate(tx['text']):
            if ch in ' \n':
                continue
            t = at + i / tx['cps'] + rng.uniform(-0.006, 0.006)
            add(click(rng.uniform(1600, 2600), rng.uniform(0.003, 0.006), 0.75), t, rng.uniform(0.07, 0.11), rng.uniform(0.4, 0.6))
            add(thump(rng.uniform(140, 200), 0.015, 0.06), t, 0.04)

# distant city at night under the building scenes
for sid, dur_gain in (('building', 0.022), ('finale', 0.014)):
    s = sc(sid)
    n = int(s['duration'] * SR)
    t = np.arange(n) / SR
    city = filt(rng.normal(0, 1, n), 'lowpass', 300) * (0.8 + 0.2 * np.sin(2 * np.pi * t / 7))
    add(city * env(n, 1.0, 1.5), starts[sid], dur_gain * 6)
# a single car passing far away
n = int(5 * SR)
t = np.arange(n) / SR
car = filt(rng.normal(0, 1, n), 'bandpass', [80, 700]) * np.exp(-((t - 2.5) / 1.1) ** 2)
add(car, starts['building'] + 4.5, 0.05, 0.3)

# lamp hum + flicker in the office scenes, then the lamp dies
for sid in ('office', 'lightsOut'):
    s = sc(sid)
    n = int(s['duration'] * SR)
    t = np.arange(n) / SR
    hum = (np.sin(2 * np.pi * 100 * t) + 0.4 * np.sin(2 * np.pi * 200 * t) + 0.2 * np.sin(2 * np.pi * 300 * t))
    gate = np.ones(n)
    if sid == 'office':
        gate *= np.clip((t - 2.2) / 1.0, 0, 1)
    else:
        for a, b in s['flickerOff']:
            gate[int(a * SR):int(b * SR)] = 0
        gate[int(s['lampOutAt'] * SR):] = 0
        for a, b in s['flickerOff']:  # little electrical crackle on each flicker
            add(filt(rng.normal(0, 1, int(0.05 * SR)), 'highpass', 2000) * np.exp(-np.arange(int(0.05 * SR)) / SR / 0.01), starts[sid] + a, 0.05)
    gate = filt(gate, 'lowpass', 60, 1)
    add(hum * gate * 0.012, starts[sid])
s = sc('lightsOut')
add(click(1200, 0.01, 0.5), starts['lightsOut'] + s['lampOutAt'], 0.18)
add(thump(48, 0.9, 3.0), starts['lightsOut'] + s['lampOutAt'], 0.22)

# case file: folder opens, cards slide, stamps land
cf = sc('caseFile')
add(swish(0.9, 300, 3000), starts['caseFile'] + cf['openAt'], 0.05, 0.45)
for i, sp in enumerate(cf['suspects']):
    add(swish(0.6, 800, 5000), starts['caseFile'] + sp['at'], 0.045, 0.3 + 0.2 * i)
    add(thump(90, 0.08, 0.5), starts['caseFile'] + sp['stampAt'], 0.35, 0.3 + 0.2 * i)
    add(click(900, 0.01, 0.9), starts['caseFile'] + sp['stampAt'], 0.12, 0.3 + 0.2 * i)
for r in cf['redact']:
    add(swish(0.3, 2000, 7000), starts['caseFile'] + r['at'], 0.03, 0.6)

# thread board: pins, a tightening tone, then slack
th = sc('threads')
for w in [th['hub']] + th['words']:
    add(click(2200, 0.004, 0.3), starts['threads'] + w['at'], 0.16, rng.uniform(0.3, 0.7))
    add(thump(160, 0.02, 0.1), starts['threads'] + w['at'], 0.06)
n = int(2.4 * SR)
t = np.arange(n) / SR
rise = np.sin(2 * np.pi * np.cumsum(110 + 60 * t / 2.4) / SR) * env(n, 0.8, 0.6)
add(rise, starts['threads'] + th['tightenAt'], 0.03)
fall = np.sin(2 * np.pi * np.cumsum(170 - 80 * t / 2.4) / SR) * env(n, 0.05, 1.6)
add(fall, starts['threads'] + th['slackAt'], 0.03)

# DNA: soft blips as each profile is checked
for i in range(7):
    n = int(0.12 * SR)
    t = np.arange(n) / SR
    add(np.sin(2 * np.pi * 1320 * t) * np.exp(-t / 0.03), starts['dna'] + dna['markersAt'] + i * dna['markerStep'], 0.04, 0.5)

# finale: one low, piano-like note under the title
fin = sc('finale')
n = int(6 * SR)
t = np.arange(n) / SR
note = sum((0.6 ** k) * np.sin(2 * np.pi * 110 * (k + 1) * t) * np.exp(-t / (2.4 / (k + 1))) for k in range(6))
note += 0.5 * sum((0.6 ** k) * np.sin(2 * np.pi * 164.8 * (k + 1) * t) * np.exp(-t / (2.0 / (k + 1))) for k in range(4))
add(note * env(n, 0.01, 1.0), starts['finale'] + fin['titleAt'], 0.08)

# ---------------------------------------------------------------- master
# normalise to a quiet documentary level (about -22 LUFS), soft-limit the peaks
rms = np.sqrt(np.mean(out ** 2))
out *= 10 ** (-24 / 20) / rms
out = 0.9 * np.tanh(out / 0.9)
os.makedirs(os.path.join(ROOT, 'public', 'audio'), exist_ok=True)
path = os.path.join(ROOT, 'public', 'audio', 'soundtrack.wav')
with wave.open(path, 'wb') as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes((out * 32767).astype(np.int16).tobytes())
print(f'wrote {path} ({TOTAL:.1f} s)')
