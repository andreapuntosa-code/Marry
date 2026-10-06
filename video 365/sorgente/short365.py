# -*- coding: utf-8 -*-
"""
YouTube Short (1080x1920, ~35 s) that teases "Forest vs Plain: Day 365" without spoiling the ending.
Same narrator voice (Kokoro), clips cut from the finished film, a small synthesized score
(pads + taiko + riser + boom, built from the film's own music primitives), big burned-in captions
(Shorts are mostly watched muted) and an end card that asks "who walks out?".

  python3 short365.py   ->  ../short_Forest_vs_Plain_teaser.mp4
"""
import os, sys, subprocess
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
PIC = os.path.join(S, "Forest_vs_Plain_Day_365.mp4")
MODELS = os.path.join(S, "models")
OUTF = os.path.join(os.path.dirname(HERE), "short_Forest_vs_Plain_teaser.mp4")
W, H, FPS, SR = 1080, 1920, 24, 48000
BY0, BH = 138, 804                     # picture band inside the 1920x1080 film frame
CX0 = 330                              # centre crop (1180 wide) that keeps the DAY/POPULATION HUD out of the vertical frame

# (narration, caption, [(film time, seconds), ...], highlighted text)
LINES = [
    ("Two hundred AIs. Split by a wall.", "200 AIs\nSPLIT BY A WALL", [(1.3, 2.0), (4.2, 1.8), (8.3, 2.0)], "WALL"),
    ("In three hundred sixty-five days, it falls.", "IN 365 DAYS\nIT FALLS", [(209.2, 2.2), (1342.7, 2.2)], "FALLS"),
    ("Until then, they build cities.", "THEY BUILD CITIES", [(355.0, 2.2), (470.1, 2.0)], "CITIES"),
    ("Invent gods.", "THEY INVENT GODS", [(405.5, 1.8)], "GODS"),
    ("Vote. And lie.", "THEY VOTE.\nTHEY LIE.", [(610.0, 2.2)], "LIE."),
    ("And one of them... will betray everyone.", "ONE WILL\nBETRAY EVERYONE", [(1170.0, 2.0), (1184.0, 2.2)], "BETRAY"),
    ("Two enemies share a secret. Through a crack in the wall.", "A SECRET...\nTHROUGH A CRACK", [(1026.0, 2.4), (1041.0, 2.6)], "SECRET..."),
    ("Then, at sunrise on day three sixty-five... the wall comes down.", "DAY 365.\nTHE WALL FALLS.", [(1369.0, 2.4), (1378.0, 3.2)], "FALLS."),
    ("Only one side walks out.", "ONLY ONE SIDE\nWALKS OUT", [(1397.8, 1.8), (1422.5, 1.6)], "ONE SIDE"),
    ("Who? Watch the full film.", "WHO?", [(1386.5, 2.6)], "WHO?"),
]
END_CARD = 3.8


def tts():
    from kokoro_onnx import Kokoro
    from sintesi_voce import trim
    k = Kokoro(f"{MODELS}/kokoro-v1.0.onnx", f"{MODELS}/voices-v1.0.bin")
    out = []
    for text, *_ in LINES:
        s, sr = k.create(text, voice="am_puck", speed=1.05, lang="en-us")
        s = trim(np.asarray(s, np.float32), sr)
        g = np.gcd(SR, sr); s = signal.resample_poly(s, SR // g, sr // g)
        out.append(s)
    return out


def caption(c, text, hl, u, y0=1430):
    """big pop-in caption, highlight word in yellow"""
    lines = text.split("\n")
    k = OV.eo(OV.clamp(u * 6))
    size = 92
    for i, l in enumerate(lines):
        y = y0 + i * (size * 1.08) + (1 - k) * 30
        col = '#ffd21f' if hl and hl in l else '#ffffff'
        f = OV.font('anton', size); wdt = OV.text_width(l, 'anton', size)
        x = W / 2 - wdt / 2
        c.drawString(l, x, y, f, skia.Paint(AntiAlias=True, Color=skia.ColorBLACK, Style=skia.Paint.kStroke_Style, StrokeWidth=14, StrokeJoin=skia.Paint.kRound_Join))
        c.drawString(l, x, y, f, OV.P(col, OV.clamp(k * 1.5)))


def header(c, a=1.0):
    OV.txt(c, "FOREST vs PLAIN", W / 2, 260, 'anton', 104, '#ffffff', a, 'center', 0.02, shadow=0.8)
    OV.txt(c, "200 AIs  ·  1 WALL  ·  365 DAYS", W / 2, 345, 'ui_b', 38, '#ffd27a', a, 'center', 0.12, shadow=0.6)


def end_card(c, u):
    a = OV.sm(0, 0.12, u)
    c.drawRect(skia.Rect(0, 0, W, H), OV.P('#000000', 0.6 * a))
    OV.txt(c, "WHO WALKS OUT?", W / 2, 690, 'anton', 124, '#ffffff', a, 'center', 0.02, shadow=0.8)
    OV.txt(c, "THE FOREST", W / 2, 850, 'anton', 112, '#6fd16f', a, 'center', 0.02, shadow=0.8)
    OV.txt(c, "or", W / 2, 940, 'corsivo_b', 70, '#ffffff', a, 'center', 0, shadow=0.8)
    OV.txt(c, "THE PLAIN", W / 2, 1050, 'anton', 112, '#ffc94d', a, 'center', 0.02, shadow=0.8)
    pulse = 1 + 0.05 * np.sin(u * END_CARD * 7)
    bw, bh = 820 * pulse, 150 * pulse
    r = skia.Rect(W / 2 - bw / 2, 1260 - bh / 2, W / 2 + bw / 2, 1260 + bh / 2)
    c.drawRoundRect(r, 75, 75, OV.P('#e11d48', a))
    tri = skia.Path(); tx = W / 2 - 345 * pulse; tri.moveTo(tx, 1225); tri.lineTo(tx + 55, 1260); tri.lineTo(tx, 1295); tri.close()
    c.drawPath(tri, OV.P('#ffffff', a))
    OV.txt(c, "WATCH THE FULL FILM", W / 2 + 50, 1287, 'anton', 66, '#ffffff', a, 'center', 0.02, shadow=0)
    OV.txt(c, "link below  ·  30 minutes  ·  Day 365", W / 2, 1410, 'ui_b', 40, '#ffd27a', a, 'center', 0.05, shadow=0.6)


def read_band(t0, n):
    r = subprocess.run(['ffmpeg', '-v', 'error', '-ss', f'{t0:.3f}', '-i', PIC, '-frames:v', str(n), '-vf', f'crop=1920:{BH}:0:{BY0}',
                        '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], capture_output=True)
    fr = np.frombuffer(r.stdout, np.uint8)
    k = len(fr) // (1920 * BH * 3)
    return fr[:k * 1920 * BH * 3].reshape(k, BH, 1920, 3)


def compose(band, t_local, line_i, u_line, end_u):
    # blurred, zoomed background + the picture (1180 wide centre crop) in the middle
    cx = CX0 + 590
    bg = cv2.resize(band[:, cx - 226:cx + 226], (W, H), interpolation=cv2.INTER_LINEAR)
    bg = (cv2.GaussianBlur(bg, (0, 0), 28) * 0.45).astype(np.uint8)
    main = cv2.resize(band[:, CX0:CX0 + 1180], (W, 736), interpolation=cv2.INTER_AREA)
    img = bg.copy(); y = 560
    img[y:y + 736] = main
    rgba = np.dstack([img, np.full((H, W), 255, np.uint8)])
    surf = skia.Surface(rgba); c = surf.getCanvas()
    c.drawRect(skia.Rect(0, y - 4, W, y), OV.P('#ffffff', 0.5)); c.drawRect(skia.Rect(0, y + 736, W, y + 740), OV.P('#ffffff', 0.5))
    if end_u is None:
        header(c)
        text, cap, shots, hl = LINES[line_i]
        caption(c, cap, hl, u_line)
    else:
        header(c, 1 - OV.sm(0, 0.15, end_u))
        end_card(c, end_u)
    return rgba[..., :3].copy()


def bed(total, starts, voices):
    """short score: dark pads, taiko pulse from 'betray' on, riser into a boom on 'the wall comes down', closing boom."""
    T = M.Track(total)
    prog = [(45, 57, 60, 64), (41, 53, 57, 60), (48, 55, 60, 64), (43, 55, 59, 62)]
    t, i = 0.0, 0
    while t < total:
        for m in prog[i % 4]:
            L, R = M.pad_note(m, 4.2, bright=1300, att=1.4, rel=2.0)
            T.add(t, L=L, R=R, gain=0.16 if m < 50 else 0.09)
        t += 4.0; i += 1
    # taiko heartbeat grows from the betrayal line to the wall falling
    t0, t1 = starts[5], starts[7] + len(voices[7]) / SR - 0.6
    k = 0
    while t0 + k * 0.6 < t1:
        u = (t0 + k * 0.6 - starts[5]) / (t1 - starts[5])
        T.add(t0 + k * 0.6, mono=M.taiko(0.25 + 0.45 * u), gain=0.7)
        k += 1
    # riser into the boom just as the wall comes down
    tb = starts[7] + len(voices[7]) / SR - 0.5
    T.add(tb - 3.0, mono=M.riser(3.0, 0.55), gain=0.8)
    T.add(tb, mono=M.boom(1.0), gain=0.9)
    # closing hit on the end card
    te = starts[-1] + len(voices[-1]) / SR + 0.35
    T.add(te, mono=M.boom(0.9), gain=0.7)
    L, R = M.apply_reverb(T.L.astype(np.float64), T.R.astype(np.float64), wet=0.3)
    L, R = M.highpass(L, 28), M.highpass(R, 28)
    n = int(total * SR)
    mus = np.stack([L[:n], R[:n]], 1)
    return mus / (np.abs(mus).max() + 1e-9)


def main():
    voices = tts()
    starts, t = [], 0.3
    for v in voices:
        starts.append(t); t += len(v) / SR + 0.22
    t_end = t + 0.1
    total = t_end + END_CARD
    n = int(total * FPS)
    # picture: per line, fill its duration with its shots in order; the end card holds the last frames
    plan = []                                   # (film time, line index) per output frame
    for i, (text, cap, shots, hl) in enumerate(LINES):
        a = int(starts[i] * FPS) if i else 0
        b = int(starts[i + 1] * FPS) if i + 1 < len(LINES) else int(t_end * FPS)
        need = b - a
        per = [max(1, int(need * d / sum(d2 for _, d2 in shots))) for _, d in shots]
        per[-1] = need - sum(per[:-1])
        for (s0, d), m in zip(shots, per):
            for j in range(m):
                plan.append((s0 + 0.1 + j / FPS, i))
    while len(plan) < n:
        plan.append((plan[-1][0] + 1 / FPS, len(LINES) - 1))
    plan = plan[:n]
    # decode contiguous runs
    frames = []
    run0 = 0
    while run0 < n:
        run1 = run0 + 1
        while run1 < n and abs(plan[run1][0] - plan[run1 - 1][0] - 1 / FPS) < 1e-3:
            run1 += 1
        frames.extend(read_band(plan[run0][0], run1 - run0))
        while len(frames) < run1: frames.append(frames[-1])
        run0 = run1
    # audio: narration + score bed
    N = int(total * SR)
    mus = bed(total, starts, voices)
    mus = np.pad(mus, ((0, max(0, N - len(mus))), (0, 0)))[:N]
    fade = np.ones(N); fl = int(1.5 * SR); fade[-fl:] = np.linspace(1, 0, fl)
    voice = np.zeros(N)
    for s0, v in zip(starts, voices):
        i = int(s0 * SR); voice[i:i + len(v)] += v[:N - i]
    duck = 1 - 0.5 * (np.convolve(np.abs(voice) > 0.01, np.ones(int(0.3 * SR)) / int(0.3 * SR), 'same') > 0.05)
    duck = np.convolve(duck, np.ones(int(0.15 * SR)) / int(0.15 * SR), 'same')
    mix = mus * (0.6 * duck * fade)[:, None] + voice[:, None] * 0.95
    mix = mix / (np.abs(mix).max() + 1e-9) * 0.89
    wav = os.path.join(S, "short365_audio.wav"); sf.write(wav, mix.astype(np.float32), SR)
    enc = subprocess.Popen(['ffmpeg', '-y', '-v', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{W}x{H}', '-r', str(FPS), '-i', '-', '-i', wav,
                            '-map', '0:v', '-map', '1:a', '-af', 'loudnorm=I=-14:TP=-1.5:LRA=9', '-c:v', 'libx264', '-preset', 'slow', '-crf', '19', '-pix_fmt', 'yuv420p',
                            '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-movflags', '+faststart', '-shortest', OUTF], stdin=subprocess.PIPE)
    for f in range(n):
        t = f / FPS
        if t >= t_end:
            img = compose(frames[f], t, len(LINES) - 1, 1.0, (t - t_end) / END_CARD)
        else:
            li = max(i for i in range(len(LINES)) if starts[i] <= t or i == 0)
            img = compose(frames[f], t, li, (t - starts[li]) / 0.5, None)
        enc.stdin.write(img.tobytes())
    enc.stdin.close(); enc.wait()
    print(OUTF, round(total, 2), "s")


if __name__ == "__main__":
    main()
