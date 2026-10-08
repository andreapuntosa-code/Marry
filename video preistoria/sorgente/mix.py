# -*- coding: utf-8 -*-
"""
Final audio mix: narration + characters' lines placed on the timeline, the original score
(levelled and ducked under the voice), and the sound design. Writes a 48 kHz stereo master;
loudness is normalized afterwards with ffmpeg (EBU R128, -14 LUFS, -1 dBTP) in make_film.sh.

  python3 mix.py   ->  scratchpad/audio/mix.wav
"""
import os, json
import numpy as np
import soundfile as sf
from scipy import signal

SR = 48000
HERE = os.path.dirname(os.path.abspath(__file__))
SCRATCH = os.environ.get("SCRATCH", "/tmp/claude-0/-home-user-Marry/e61fd834-a8c5-5cc5-8204-6c637a41951f/scratchpad")
AUD = os.path.join(SCRATCH, "audio")
VOICE_DIR = os.environ.get("VOICE_DIR", os.path.join(SCRATCH, "voice365"))


def env_follow(x, win=0.05, att=0.02, rel=0.35):
    """smoothed amplitude envelope (RMS over win, then attack/release smoothing)"""
    hop = int(SR * 0.01)
    n = len(x) // hop
    p = x[:n * hop].reshape(n, hop) ** 2
    blk = p.mean(1)                                   # 10 ms power blocks
    k = max(1, int(win / 0.01))
    cs = np.concatenate([[0.0], np.cumsum(blk)])
    lo = np.clip(np.arange(n) - k // 2, 0, n); hi = np.clip(np.arange(n) + k - k // 2, 0, n)
    r = np.sqrt((cs[hi] - cs[lo]) / np.maximum(1, hi - lo) + 1e-12)
    out = np.zeros(n); a_a, a_r = np.exp(-0.01 / att), np.exp(-0.01 / rel); e = 0.0
    for i in range(n):
        v = r[i]
        e = a_a * e + (1 - a_a) * v if v > e else a_r * e + (1 - a_r) * v
        out[i] = e
    if not n:
        return np.zeros(len(x))
    e = np.repeat(out, hop)
    return np.pad(e, (0, max(0, len(x) - len(e))), mode='edge')[:len(x)]


def pad_to(x, n):
    return np.pad(x, (0, max(0, n - len(x))))[:n]


def main():
    tl = json.load(open(os.path.join(HERE, "timeline.json")))
    N = int(tl['total'] * SR)
    # ---- voice
    voice = np.zeros(N)
    for s in tl['segments']:
        x, sr = sf.read(os.path.join(VOICE_DIR, f"{s['id']}.wav"))
        if x.ndim > 1:
            x = x.mean(1)
        if sr != SR:
            g = np.gcd(SR, sr); x = signal.resample_poly(x, SR // g, sr // g)
        i = int(s['start'] * SR)
        gain = 1.0 if s.get('who') is None else 0.92
        m = min(len(x), N - i)
        voice[i:i + m] += x[:m] * gain
    b, a = signal.butter(2, 75 / (SR / 2), 'high'); voice = signal.lfilter(b, a, voice)
    # gentle presence lift and compression
    b, a = signal.butter(2, [2500 / (SR / 2), 6000 / (SR / 2)], 'band'); voice = voice + signal.lfilter(b, a, voice) * 0.25
    ev = env_follow(voice, 0.03, 0.005, 0.12)
    thr = np.percentile(ev[ev > 1e-3], 70) if np.any(ev > 1e-3) else 0.1
    comp = np.where(ev > thr, (thr / np.maximum(ev, 1e-9)) ** 0.45, 1.0)
    voice = voice * comp
    act = ev > 1e-3
    vr = np.sqrt(np.mean(voice[act] ** 2)) if act.any() else 0.1
    voice = voice / vr * 10 ** (-17 / 20)          # speech at about -17 dBFS RMS
    # ---- music: level it, then duck under the voice
    mus, _ = sf.read(os.path.join(AUD, "music.wav")); mus = np.stack([pad_to(mus[:, 0], N), pad_to(mus[:, 1], N)], 1)
    mm = mus.mean(1)
    lev = env_follow(mm, 3.0, 1.5, 4.0)
    tgt = 10 ** (-26 / 20)
    g_lev = np.clip(tgt / np.maximum(lev, 1e-6), 0.4, 6.0)
    g_lev = signal.filtfilt(*signal.butter(1, 0.3 / (SR / 2)), g_lev)
    mus = mus * g_lev[:, None]
    vd = env_follow(voice, 0.08, 0.05, 0.6)
    vn = np.clip(vd / (np.percentile(vd[act], 60) + 1e-9), 0, 1)
    duck = 1.0 - 0.62 * vn                          # about -8.5 dB while someone speaks
    mus = mus * duck[:, None]
    # ---- sound design
    fx, _ = sf.read(os.path.join(AUD, "sfx.wav")); fx = np.stack([pad_to(fx[:, 0], N), pad_to(fx[:, 1], N)], 1)
    fx = fx * (1.0 - 0.35 * vn)[:, None]
    # ---- sum
    out = np.stack([voice, voice], 1) * 1.0 + mus * 0.62 + fx * 0.42
    # soft limiter
    pk = np.abs(out).max()
    out = np.tanh(out / max(1.0, pk * 0.7) * 1.1) * 0.95
    sf.write(os.path.join(AUD, "mix.wav"), out.astype(np.float32), SR, subtype='FLOAT')
    print("mix.wav", N / SR, "s")


if __name__ == "__main__":
    main()
