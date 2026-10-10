# -*- coding: utf-8 -*-
"""
30-second vertical promo (1080x1920) for a second account: "there's a YouTube channel where the comments control an
AI civilization; the most liked comment goes into the simulation (like Bingus). Link in bio."
Footage: real clips from Part 1/2 (the 2.39:1 band, centred, over a blurred copy of itself), a recommender voice
(Kokoro, different from the channel's narrator), burned-in word-by-word captions, a small score, an end card.

  python3 make_promo.py   ->  ../../video promo/short_promo_canale.mp4
"""
import os, sys, glob, subprocess, re
import numpy as np
import cv2
import skia
import soundfile as sf
from scipy import signal

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import overlays as OV
import music as M

S = os.environ.get("SCRATCH", "/tmp/claude-0/-home-user-Marry/e61fd834-a8c5-5cc5-8204-6c637a41951f/scratchpad")
MODELS = os.path.join(S, "models")
ROOT = os.path.dirname(os.path.dirname(HERE))
OUTD = os.path.join(ROOT, "video promo"); os.makedirs(OUTD, exist_ok=True)
OUTF = os.path.join(OUTD, "short_promo_canale.mp4")
PARTS = sorted(glob.glob(os.path.join(ROOT, "video simulazione 2", "film_parti", "*.part*")))
SRC = "concat:" + "|".join(PARTS)
W, H, FPS, SR = 1080, 1920, 30, 48000
FONT = 'poppins'

# (voice line, caption highlight words, [(clip start in the Part 2 film, share of the line)])
LINES = [
    ("There's a YouTube channel where AIs build a civilization from zero.", {"AIs", "civilization"}, [(4.8, 0.5), (9.0, 0.5)]),
    ("And the comments control it.", {"comments"}, [(84.0, 1.0)]),
    ("Every episode, the most liked comment gets sent into the simulation.", {"most", "liked"}, [(92.0, 0.5), (87.0, 0.5)]),
    ("Last time, the top comment was... Bingus.", {"Bingus."}, [(111.4, 1.0)]),
    ("So the AIs started a religion about it.", {"religion"}, [(266.6, 0.5), (300.0, 0.5)]),
    ("Then they built a ladder to the sky, to find out what it means.", {"ladder", "sky,"}, [(382.0, 0.45), (699.0, 0.55)]),
    ("And at the top, they found a giant screen. With our comments on it.", {"screen.", "comments"}, [(761.0, 0.5), (769.4, 0.5)]),
    ("You decide what happens next.", {"You", "decide"}, [(843.0, 1.0)]),
    ("Link in bio.", {"Link", "bio."}, [("end", 1.0)]),
]
GAP = 0.18
HEADER = ["THE COMMENTS CONTROL", "THIS AI CIVILIZATION"]


def tts():
    from kokoro_onnx import Kokoro
    from sintesi_p2 import trim
    k = Kokoro(f"{MODELS}/kokoro-v1.0.onnx", f"{MODELS}/voices-v1.0.bin")
    out = []
    for text, _, _ in LINES:
        y, sr = k.create(text.replace("...", ","), voice="am_michael", speed=1.04, lang="en-us")
        y = trim(np.asarray(y, np.float32), sr)
        g = np.gcd(SR, sr); out.append(signal.resample_poly(y, SR // g, sr // g).astype(np.float32))
    return out


def word_times(text, dur):
    toks = text.split(); wts = [len(re.sub(r"\W", "", w)) + 1.5 for w in toks]; tot = sum(wts); acc = 0; res = []
    for w, k in zip(toks, wts):
        res.append((w, dur * acc / tot)); acc += k
    return res


def clip_reader(t0, dur):
    cmd = ['ffmpeg', '-v', 'error', '-ss', f'{t0:.3f}', '-t', f'{dur + 0.2:.3f}', '-i', SRC, '-vf', 'crop=1920:804:0:138,fps=30', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-']
    return subprocess.Popen(cmd, stdout=subprocess.PIPE)


def read_frame(p, last):
    b = p.stdout.read(1920 * 804 * 3)
    if len(b) < 1920 * 804 * 3:
        return last
    return np.frombuffer(b, np.uint8).reshape(804, 1920, 3)


def compose_bg(band):
    c = band[:, (1920 - 452) // 2:(1920 + 452) // 2]
    small = cv2.resize(c, (180, 320), interpolation=cv2.INTER_AREA)
    small = cv2.GaussianBlur(small, (0, 0), 6)
    return (cv2.resize(small, (W, H), interpolation=cv2.INTER_LINEAR) * 0.42).astype(np.uint8)


def fg_of(band, zoom):
    cw = int(1500 / zoom); ch = int(cw * 804 / 1500)
    x0 = (1920 - cw) // 2; y0 = (804 - ch) // 2
    return cv2.resize(band[y0:y0 + ch, x0:x0 + cw], (W, 579), interpolation=cv2.INTER_AREA)


FG_Y = 690


def text_center(c, s, y, size, col='#ffffff', a=1.0, stroke=0.11):
    f = OV.font(FONT, size); w = OV.text_width(s, FONT, size); x = W / 2 - w / 2
    c.drawString(s, x + 3, y + 8, f, OV.P('#000000', 0.5 * a, blur=10))
    c.drawString(s, x, y, f, skia.Paint(AntiAlias=True, Color=OV.col('#000000', a), Style=skia.Paint.kStroke_Style, StrokeWidth=size * stroke, StrokeJoin=skia.Paint.kRound_Join))
    c.drawString(s, x, y, f, OV.P(col, a))


def caption(c, text, hl, u_words, y0=1440):
    """word-by-word caption: words appear as they are said, the current/important ones in yellow"""
    words = text.split(); size = 78; f = OV.font(FONT, size); space = OV.text_width(" ", FONT, size)
    lines, cur, cw = [], [], 0
    for i, w in enumerate(words):
        ww = OV.text_width(w, FONT, size)
        if cur and cw + space + ww > W - 120:
            lines.append(cur); cur, cw = [], 0
        cur.append((i, w, ww)); cw += (space if cw else 0) + ww
    if cur: lines.append(cur)
    for li, ln in enumerate(lines):
        tw = sum(x[2] for x in ln) + space * (len(ln) - 1); x = W / 2 - tw / 2; y = y0 + li * 96
        for i, w, ww in ln:
            if i < u_words:
                pop = 1.0
                col = '#ffd21f' if w in hl else '#ffffff'
                c.drawString(w, x + 3, y + 7, f, OV.P('#000000', 0.55, blur=9))
                c.drawString(w, x, y, f, skia.Paint(AntiAlias=True, Color=OV.col('#000000'), Style=skia.Paint.kStroke_Style, StrokeWidth=size * 0.12, StrokeJoin=skia.Paint.kRound_Join))
                c.drawString(w, x, y, f, OV.P(col, pop))
            x += ww + space


def end_card(c, u, t):
    a = OV.sm(0, 0.15, u)
    text_center(c, "LINK IN BIO", 1020, 150, '#ffd21f', a)
    # bouncing arrow pointing up (to the profile / bio)
    by = 780 - 30 * abs(np.sin(t * 5)); c.save()
    p = skia.Path(); p.moveTo(W / 2, by - 120); p.lineTo(W / 2 + 90, by - 20); p.lineTo(W / 2 + 35, by - 20); p.lineTo(W / 2 + 35, by + 90); p.lineTo(W / 2 - 35, by + 90); p.lineTo(W / 2 - 35, by - 20); p.lineTo(W / 2 - 90, by - 20); p.close()
    c.drawPath(p, OV.P('#000000', 0.5 * a, blur=12)); c.drawPath(p, OV.P('#ffffff', a)); c.restore()
    text_center(c, "watch Part 1 & Part 2", 1150, 56, '#ffffff', a * OV.sm(0.2, 0.4, u), stroke=0.09)
    text_center(c, "and write the next comment", 1225, 56, '#ffffff', a * OV.sm(0.3, 0.5, u), stroke=0.09)


def bed(total, cuts):
    T = M.Track(total + 1)
    prog = [(45, 57, 60, 64), (41, 53, 57, 60), (48, 55, 60, 64), (43, 55, 59, 62)]
    t, i = 0.0, 0
    while t < total:
        for m in prog[i % 4]:
            L, R = M.pad_note(m, 2.2, bright=1600, att=0.3, rel=1.0)
            T.add(t, L=L, R=R, gain=0.13 if m < 50 else 0.07)
        t += 2.0; i += 1
    k = 0.0
    while k < total - 3:
        T.add(k, mono=M.kick(0.7), gain=0.5); T.add(k + 0.5, mono=M.hat(0.25), gain=0.4); T.add(k + 0.25, mono=M.hat(0.15), gain=0.3); T.add(k + 0.75, mono=M.hat(0.15), gain=0.3)
        if int(k * 2) % 4 == 2: T.add(k, mono=M.snare(0.5), gain=0.35)
        k += 0.5
    for tc in cuts[1:]:
        T.add(max(0, tc - 0.25), mono=M.reverse_cymbal(0.4, 0.25), gain=0.25)
    T.add(cuts[-1], mono=M.boom(0.9), gain=0.8)
    L, R = M.apply_reverb(T.L.astype(np.float64), T.R.astype(np.float64), wet=0.2)
    n = int(total * SR); mus = np.stack([L[:n], R[:n]], 1)
    return mus / (np.abs(mus).max() + 1e-9)


def main():
    voices = tts()
    starts, t = [], 0.35
    for v in voices:
        starts.append(t); t += len(v) / SR + GAP
    total = t + 1.4
    n = int(round(total * FPS))
    # audio
    N = int(total * SR); voice = np.zeros(N)
    for s0, v in zip(starts, voices):
        i = int(s0 * SR); seg = v[:max(0, N - i)]; voice[i:i + len(seg)] += seg
    mus = bed(total, starts)
    act = (np.abs(voice) > 0.01).astype(np.float64)
    duck = 1 - 0.55 * (signal.fftconvolve(act, np.ones(int(0.25 * SR)) / int(0.25 * SR), 'same') > 0.05)
    duck = signal.fftconvolve(duck, np.ones(int(0.12 * SR)) / int(0.12 * SR), 'same')
    fade = np.ones(N); fl = int(0.8 * SR); fade[-fl:] = np.linspace(1, 0, fl)
    mix = mus * (0.55 * duck * fade)[:, None] + voice[:, None] * 1.0
    mix = mix / (np.abs(mix).max() + 1e-9) * 0.9
    wav = os.path.join(S, "promo_audio.wav"); sf.write(wav, mix.astype(np.float32), SR)
    # the clip plan: each line split into its sub-clips
    plan = []
    for li, (text, hl, clips) in enumerate(LINES):
        l0 = starts[li]; l1 = starts[li + 1] if li + 1 < len(LINES) else total
        acc = l0
        for (src, share) in clips:
            d = (l1 - l0) * share; plan.append((acc, acc + d, src, li)); acc += d
    plan[0] = (0.0,) + plan[0][1:]
    enc = subprocess.Popen(['ffmpeg', '-y', '-v', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{W}x{H}', '-r', str(FPS), '-i', '-', '-i', wav,
                            '-map', '0:v', '-map', '1:a', '-af', 'loudnorm=I=-14:TP=-1.5:LRA=9', '-c:v', 'libx264', '-preset', 'slow', '-crf', '15', '-pix_fmt', 'yuv420p',
                            '-c:a', 'aac', '-b:a', '256k', '-ar', '48000', '-movflags', '+faststart', '-shortest', OUTF], stdin=subprocess.PIPE)
    end_band = None
    f = 0
    for pi, (a, b, src, li) in enumerate(plan):
        fa, fb = int(round(a * FPS)), int(round(b * FPS))
        rd = clip_reader(src, (fb - fa) / FPS) if src != "end" else None
        last = np.zeros((804, 1920, 3), np.uint8)
        for fr in range(fa, fb):
            t = fr / FPS
            if rd is not None:
                last = read_frame(rd, last); band = last; end_band = band
            else:
                band = end_band if end_band is not None else last
            lt = (fr - fa) / max(1, fb - fa)
            img = compose_bg(band)
            if src != "end":
                fgi = fg_of(band, 1.0 + 0.06 * lt)
                if fr - fa < 2 and pi > 0:   # tiny white flash on each cut
                    fgi = np.clip(fgi.astype(np.int16) + 70 - 35 * (fr - fa), 0, 255).astype(np.uint8)
                img[FG_Y:FG_Y + 579] = fgi
            rgba = np.dstack([img, np.full((H, W), 255, np.uint8)])
            surf = skia.Surface(rgba); c = surf.getCanvas()
            if src != "end":
                c.drawRect(skia.Rect(0, FG_Y - 3, W, FG_Y), OV.P('#ffffff', 0.85)); c.drawRect(skia.Rect(0, FG_Y + 579, W, FG_Y + 582), OV.P('#ffffff', 0.85))
                text_center(c, HEADER[0], 330, 74, '#ffffff'); text_center(c, HEADER[1], 425, 74, '#ffd21f')
            text, hl, _ = LINES[li]
            lstart = starts[li]; ldur = len(voices[li]) / SR
            wt = word_times(text, ldur); said = sum(1 for _, ws in wt if t >= lstart + ws - 0.02)
            if src == "end":
                end_card(c, (t - lstart) / max(0.1, total - lstart), t)
            else:
                caption(c, text, hl, said)
            enc.stdin.write(rgba[..., :3].tobytes()); f += 1
        if rd is not None:
            rd.stdout.close(); rd.wait()
    enc.stdin.close(); enc.wait()
    print(OUTF, round(total, 2), "s", f, "frames", flush=True)


if __name__ == "__main__":
    main()
