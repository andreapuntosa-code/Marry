# -*- coding: utf-8 -*-
"""
YouTube Short (1080x1920, ~45 s) that teases the full film and sends viewers to it.
New narration (Kokoro, same narrator voice) over clips taken from the clean rendered picture
(film_video.mp4, no overlays), the cold-open score as music bed, big burned-in captions
(Shorts are mostly watched muted) and an end card pointing to the full video.

  python3 short.py   ->  ../short_I_let_AI_build_a_civilization.mp4
"""
import os, sys, json, subprocess
import numpy as np
import cv2
import skia
import soundfile as sf
from scipy import signal

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import overlays as OV

S = os.environ.get("SCRATCH", "/tmp/claude-0/-home-user-Marry/e61fd834-a8c5-5cc5-8204-6c637a41951f/scratchpad")
PIC = os.path.join(S, "film_video.mp4")
MUSIC = os.path.join(S, "audio", "music.wav")
MODELS = os.path.join(S, "models")
OUTF = os.path.join(os.path.dirname(HERE), "short_I_let_AI_build_a_civilization.mp4")
W, H, FPS, SR = 1080, 1920, 24, 48000
BY0, BH = 138, 804

# (narration, caption, [(film shot start time, seconds available), ...], highlight word)
LINES = [
    ("I gave twenty AIs a world. With zero rules.", "I GAVE 20 AIs A WORLD.\nZERO RULES.", [(8.49, 6.8)], "ZERO RULES."),
    ("They stole fire from the sky.", "THEY STOLE FIRE\nFROM THE SKY", [(189.99, 3.17), (193.16, 3.26)], "FIRE"),
    ("They invented a new word. Mine.", "THEY INVENTED\nA NEW WORD:\n\"MINE.\"", [(405.0, 2.5), (409.54, 1.71)], "\"MINE.\""),
    ("They split into three peoples.", "THEY SPLIT INTO\n3 PEOPLES", [(517.76, 1.72), (534.49, 2.07)], "3 PEOPLES"),
    ("And invented trade. With cheese.", "THEY INVENTED TRADE...\nWITH CHEESE", [(560.75, 2.21), (565.86, 2.9)], "CHEESE"),
    ("Then came the first king.", "THEN CAME\nTHE FIRST KING", [(721.2, 2.14), (723.34, 1.89)], "KING"),
    ("The first war.", "THE FIRST WAR", [(768.18, 3.23)], "WAR"),
    ("A plague that turned them grey.", "A PLAGUE THAT\nTURNED THEM GREY", [(795.48, 3.08), (803.14, 3.48)], "GREY"),
    ("And one night, four thousand torches.", "ONE NIGHT...\n4,000 TORCHES", [(953.67, 3.29), (976.32, 4.94)], "4,000 TORCHES"),
    ("Then they found out... someone was watching.", "THEN THEY FOUND OUT\nSOMEONE WAS WATCHING", [(595.28, 3.66), (1095.21, 4.21)], "WATCHING"),
    ("Democracy, or monarchy? Watch the full film.", "DEMOCRACY\nOR MONARCHY?", [(1009.98, 1.87), (987.01, 2.29)], "MONARCHY?"),
]
END_CARD = 3.6


def tts():
    from kokoro_onnx import Kokoro
    from sintesi_voce import trim
    k = Kokoro(f"{MODELS}/kokoro-v1.0.onnx", f"{MODELS}/voices-v1.0.bin")
    out = []
    for text, *_ in LINES:
        s, sr = k.create(text, voice="am_puck", speed=1.08, lang="en-us")
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
    OV.txt(c, "I LET AI BUILD", W / 2, 250, 'anton', 74, '#ffffff', a, 'center', 0.02, shadow=0.8)
    OV.txt(c, "A CIVILIZATION", W / 2, 336, 'anton', 74, '#ffffff', a, 'center', 0.02, shadow=0.8)
    OV.txt(c, "20 AIs  ·  0 RULES  ·  2,000 YEARS", W / 2, 400, 'ui_b', 34, '#ffd27a', a, 'center', 0.12, shadow=0.6)


def end_card(c, u):
    a = OV.sm(0, 0.12, u)
    c.drawRect(skia.Rect(0, 0, W, H), OV.P('#000000', 0.55 * a))
    OV.txt(c, "WHO WON?", W / 2, 700, 'anton', 150, '#ffffff', a, 'center', 0.02, shadow=0.8)
    OV.txt(c, "DEMOCRACY", W / 2, 860, 'anton', 110, '#5ea4ff', a, 'center', 0.02, shadow=0.8)
    OV.txt(c, "or", W / 2, 950, 'corsivo_b', 70, '#ffffff', a, 'center', 0, shadow=0.8)
    OV.txt(c, "MONARCHY", W / 2, 1060, 'anton', 110, '#ff5a5a', a, 'center', 0.02, shadow=0.8)
    pulse = 1 + 0.05 * np.sin(u * END_CARD * 7)
    bw, bh = 820 * pulse, 150 * pulse
    r = skia.Rect(W / 2 - bw / 2, 1260 - bh / 2, W / 2 + bw / 2, 1260 + bh / 2)
    c.drawRoundRect(r, 75, 75, OV.P('#e11d48', a))
    tri = skia.Path(); tx = W / 2 - 345 * pulse; tri.moveTo(tx, 1225); tri.lineTo(tx + 55, 1260); tri.lineTo(tx, 1295); tri.close()
    c.drawPath(tri, OV.P('#ffffff', a))
    OV.txt(c, "WATCH THE FULL FILM", W / 2 + 50, 1287, 'anton', 66, '#ffffff', a, 'center', 0.02, shadow=0)
    OV.txt(c, "link below  ·  19 minutes  ·  2,000 years", W / 2, 1410, 'ui_b', 40, '#ffd27a', a, 'center', 0.05, shadow=0.6)


def read_band(t0, n):
    r = subprocess.run(['ffmpeg', '-v', 'error', '-ss', f'{t0:.3f}', '-i', PIC, '-frames:v', str(n), '-vf', f'crop=1920:{BH}:0:{BY0}',
                        '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], capture_output=True)
    fr = np.frombuffer(r.stdout, np.uint8)
    k = len(fr) // (1920 * BH * 3)
    return fr[:k * 1920 * BH * 3].reshape(k, BH, 1920, 3)


def compose(band, t_local, line_i, u_line, end_u):
    # blurred, zoomed background + the picture (centre crop 1180 wide) in the middle
    bg = cv2.resize(band[:, 734:1186], (W, H), interpolation=cv2.INTER_LINEAR)
    bg = (cv2.GaussianBlur(bg, (0, 0), 28) * 0.45).astype(np.uint8)
    main = cv2.resize(band[:, 370:1550], (W, 736), interpolation=cv2.INTER_AREA)
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


def main():
    voices = tts()
    # timeline: each line = its narration + a short breath
    starts, t = [], 0.25
    for v in voices:
        starts.append(t); t += len(v) / SR + 0.18
    t_end = t + 0.1
    total = t_end + END_CARD
    n = int(total * FPS)
    # picture: per line, fill its duration with its shots in order; the end card holds the last frames
    plan = []                                   # (film time, line index) per output frame
    for i, (text, cap, shots, hl) in enumerate(LINES):
        a = int(starts[i] * FPS) if i else 0
        b = int(starts[i + 1] * FPS) if i + 1 < len(LINES) else int(t_end * FPS)
        need, k = b - a, 0
        per = [max(1, int(need * d / sum(d2 for _, d2 in shots))) for _, d in shots]
        per[-1] = need - sum(per[:-1])
        for (s0, d), m in zip(shots, per):
            for j in range(m):
                plan.append((s0 + 0.15 + j / FPS, i))
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
    # audio: narration + cold-open score as bed
    mus, sr = sf.read(MUSIC)
    N = int(total * SR)
    bed = mus[int(0.5 * SR):int(0.5 * SR) + N]
    bed = np.pad(bed, ((0, max(0, N - len(bed))), (0, 0)))
    fade = np.ones(N); fl = int(1.2 * SR); fade[-fl:] = np.linspace(1, 0, fl)
    voice = np.zeros(N)
    for s0, v in zip(starts, voices):
        i = int(s0 * SR); voice[i:i + len(v)] += v[:N - i]
    duck = 1 - 0.55 * (np.convolve(np.abs(voice) > 0.01, np.ones(int(0.3 * SR)) / int(0.3 * SR), 'same') > 0.05)
    duck = np.convolve(duck, np.ones(int(0.15 * SR)) / int(0.15 * SR), 'same')
    mix = bed * (0.55 * duck * fade)[:, None] + voice[:, None] * 0.95
    mix = mix / (np.abs(mix).max() + 1e-9) * 0.89
    wav = os.path.join(S, "short_audio.wav"); sf.write(wav, mix.astype(np.float32), SR)
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
