# -*- coding: utf-8 -*-
"""
YouTube Short (1080x1920, 30 fps, ~37 s) for "I put 100 AIs in the Hunger Games".
Frames come from short_frames.py (dedicated vertical hero shots, 1.5x supersampled); this script adds
the narrator (same Kokoro voice as the film), a small score (pads, taiko heartbeat, riser + boom, star bells),
burned-in captions (Shorts are mostly watched muted), an ALIVE counter that falls from 100 to 1, and an end card
that asks "who wins?" without revealing the winner.

  python3 make_short_hg.py   ->  ../short_Hunger_Arena_100.mp4
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
FR = os.path.join(S, "short_frames")
MODELS = os.path.join(S, "models")
OUTF = os.path.join(os.path.dirname(HERE), "short_Hunger_Arena_100.mp4")
W, H, FPS, SR = 1080, 1920, 30, 48000
END = 4.6

# name, duration, narration, caption, highlighted text
SHOTS = [
    ("horn", 4.0, "One hundred AIs.", "100 AIs.\nONE ARENA.", "100 AIs."),
    ("ring", 3.6, "Last one alive... wins.", "LAST ONE\nALIVE WINS", "WINS"),
    ("hide", 3.6, "They hide.", "THEY HIDE.", "HIDE."),
    ("fight", 3.4, "They fight.", "THEY FIGHT.", "FIGHT."),
    ("alliance", 3.4, "They make alliances.", "THEY MAKE\nALLIANCES", "ALLIANCES"),
    ("betray", 3.2, "And break them.", "AND BETRAY\nTHEM.", "BETRAY"),
    ("closing", 3.6, "The arena closes in.", "THE ARENA\nCLOSES IN", "CLOSES IN"),
    ("stars", 4.4, "Every fall... a star goes dark.", "EVERY FALL...\nA STAR GOES DARK", "DARK"),
    ("walk", 3.6, "Only one... will walk out.", "ONLY ONE\nWALKS OUT", "ONE"),
]
END_LINE = "Who wins? Watch the full film."
STARS_T0 = [0.9, 1.7, 2.5, 3.2]


def starts():
    t, out = 0.0, []
    for s in SHOTS:
        out.append(t); t += s[1]
    return out, t


def tts():
    """same narrator and settings as the first Shorts: am_puck at 1.05, one take per line (no clause splitting, no pitch edit)"""
    from kokoro_onnx import Kokoro
    from sintesi_hg import trim
    k = Kokoro(f"{MODELS}/kokoro-v1.0.onnx", f"{MODELS}/voices-v1.0.bin")
    res = []
    for text in [s[2] for s in SHOTS] + [END_LINE]:
        y, sr = k.create(text, voice="am_puck", speed=1.05, lang="en-us")
        y = trim(np.asarray(y, np.float32), sr)
        g = np.gcd(SR, sr); y = signal.resample_poly(y, SR // g, sr // g)
        res.append(y.astype(np.float32))
    return res


# ------------------------------------------------------------------ audio
def bed(total, st, t_end, voices):
    T = M.Track(total)
    prog = [(45, 57, 60, 64), (41, 53, 57, 60), (48, 55, 60, 64), (43, 55, 59, 62)]
    t, i = 0.0, 0
    while t < total:
        for m in prog[i % 4]:
            L, R = M.pad_note(m, 4.2, bright=1300, att=1.4, rel=2.0)
            T.add(t, L=L, R=R, gain=0.16 if m < 50 else 0.09)
        t += 4.0; i += 1
    # taiko heartbeat from "they hide" to "the arena closes in", growing
    t0, t1 = st[2], st[7]
    k = 0
    while t0 + k * 0.6 < t1:
        u = (t0 + k * 0.6 - t0) / (t1 - t0)
        T.add(t0 + k * 0.6, mono=M.taiko(0.25 + 0.5 * u), gain=0.7)
        k += 1
    # riser through "closes in", boom as the first star dies, bells for the stars
    T.add(st[7] - 3.0, mono=M.riser(3.0, 0.55), gain=0.8)
    T.add(st[7], mono=M.boom(1.0), gain=0.9)
    for j, ts in enumerate(STARS_T0):
        L, R = M.pad_note(88 - 3 * j, 1.6, bright=3800, att=0.02, rel=1.4)
        T.add(st[7] + ts, L=L, R=R, gain=0.22)
    T.add(st[8] - 0.1, mono=M.boom(0.6), gain=0.6)
    T.add(t_end + 0.05, mono=M.boom(0.9), gain=0.8)
    L, R = M.apply_reverb(T.L.astype(np.float64), T.R.astype(np.float64), wet=0.3)
    L, R = M.highpass(L, 28), M.highpass(R, 28)
    n = int(total * SR)
    mus = np.stack([L[:n], R[:n]], 1)
    return mus / (np.abs(mus).max() + 1e-9)


def audio(total, st, t_end, voices):
    N = int(total * SR)
    mus = bed(total, st, t_end, voices)
    mus = np.pad(mus, ((0, max(0, N - len(mus))), (0, 0)))[:N]
    fade = np.ones(N); fl = int(1.2 * SR); fade[-fl:] = np.linspace(1, 0, fl)
    voice = np.zeros(N)
    for s0, v in zip([x + 0.30 for x in st] + [t_end + 0.35], voices):
        i = int(s0 * SR); seg = v[:max(0, N - i)]; voice[i:i + len(seg)] += seg
    act = (np.abs(voice) > 0.01).astype(np.float64)
    duck = 1 - 0.5 * (np.convolve(act, np.ones(int(0.3 * SR)) / int(0.3 * SR), 'same') > 0.05)
    duck = np.convolve(duck, np.ones(int(0.15 * SR)) / int(0.15 * SR), 'same')
    mix = mus * (0.6 * duck * fade)[:, None] + voice[:, None] * 0.95
    mix = mix / (np.abs(mix).max() + 1e-9) * 0.89
    wav = os.path.join(S, "short_hg_audio.wav")
    sf.write(wav, mix.astype(np.float32), SR)
    return wav


# ------------------------------------------------------------------ graphics
def caption(c, text, hl, u, y0=1290):
    lines = text.split("\n")
    k = OV.eo(OV.clamp(u * 6))
    size = 104
    for i, l in enumerate(lines):
        y = y0 + i * (size * 1.08) + (1 - k) * 34
        f = OV.font('anton', size); wdt = OV.text_width(l, 'anton', size)
        x = W / 2 - wdt / 2
        c.drawString(l, x, y + 6, f, OV.P('#000000', 0.55 * OV.clamp(k * 1.5), blur=10))
        c.drawString(l, x, y, f, skia.Paint(AntiAlias=True, Color=skia.ColorBLACK, Style=skia.Paint.kStroke_Style, StrokeWidth=16, StrokeJoin=skia.Paint.kRound_Join))
        # highlighted word in yellow: draw the line in white, then the highlight part over it
        c.drawString(l, x, y, f, OV.P('#ffffff', OV.clamp(k * 1.5)))
        if hl and hl in l:
            pre = l[:l.index(hl)]
            xo = x + OV.text_width(pre, 'anton', size) if pre else x
            c.drawString(hl, xo, y, f, OV.P('#ffd21f', OV.clamp(k * 1.5)))


def alive_at(t, st):
    """100 -> 1 across the story (monotonic, no spoiler: 'walk' ends on 1 alive but never says who)"""
    a, b = st[2], st[8] + 2.4
    if t < a:
        return 100
    u = min(1.0, (t - a) / (b - a))
    return max(1, int(round(100 * (1 - u) ** 1.9)))


def hud(c, n, pulse):
    x, y = W - 70, 150
    OV.txt(c, "ALIVE", x, y - 78, 'ui_b', 34, '#ffd27a', 0.95, 'right', 0.2, shadow=0.7)
    col = '#ff4d3a' if pulse > 0.02 else '#ffffff'
    OV.txt(c, f"{n:03d}" if n >= 10 else f"{n:02d}", x, y + 14 - 6 * pulse, 'anton', 104 + 14 * pulse, col, 1.0, 'right', 0.02, shadow=0.8)


def title(c, a):
    OV.txt(c, "I PUT 100 AIs IN THE", 70, 175, 'anton', 62, '#ffffff', a, 'left', 0.02, shadow=0.8)
    OV.txt(c, "HUNGER GAMES", 70, 245, 'anton', 74, '#ffd21f', a, 'left', 0.02, shadow=0.8)


def end_card(c, u):
    a = OV.sm(0, 0.12, u)
    g = skia.GradientShader.MakeLinear([skia.Point(0, 600), skia.Point(0, 1500)], [OV.col('#000000', 0.0), OV.col('#000000', 0.78 * a)])
    c.drawRect(skia.Rect(0, 600, W, H), skia.Paint(Shader=g))
    OV.txt(c, "WHO WINS?", W / 2, 1090, 'anton', 190, '#ffffff', a, 'center', 0.02, shadow=0.9)
    pulse = 1 + 0.05 * np.sin(u * END * 7)
    bw, bh = 800 * pulse, 148 * pulse
    r = skia.Rect(W / 2 - bw / 2, 1270 - bh / 2, W / 2 + bw / 2, 1270 + bh / 2)
    c.drawRoundRect(r, 74, 74, OV.P('#e11d48', a))
    tri = skia.Path(); tx = W / 2 - 330 * pulse; tri.moveTo(tx, 1236); tri.lineTo(tx + 54, 1270); tri.lineTo(tx, 1304); tri.close()
    c.drawPath(tri, OV.P('#ffffff', a))
    OV.txt(c, "WATCH THE FULL FILM", W / 2 + 46, 1297, 'anton', 62, '#ffffff', a, 'center', 0.02, shadow=0)
    OV.txt(c, "GUESS THE WINNER IN THE COMMENTS", W / 2, 1400, 'ui_b', 38, '#ffd27a', a * OV.sm(0.25, 0.4, u), 'center', 0.08, shadow=0.7)
    OV.txt(c, "20 MINUTES  ·  100 AIs  ·  100 DAYS", W / 2, 1470, 'ui_b', 30, '#ffffff', a * 0.8 * OV.sm(0.3, 0.45, u), 'center', 0.14, shadow=0.7)


def frame_img(name, i):
    p = f"{FR}/{name}/{i:04d}.jpg"
    if not os.path.exists(p):
        raise FileNotFoundError(p)
    return cv2.cvtColor(cv2.imread(p), cv2.COLOR_BGR2RGB)


def main():
    st, t_end = starts()
    total = t_end + END
    n = int(round(total * FPS))
    voices = tts()
    for (nm, d, *_), v in zip(SHOTS, voices):
        assert len(v) / SR < d - 0.3, f"narration '{nm}' too long: {len(v) / SR:.2f}s for a {d}s shot"
    wav = audio(total, st, t_end, voices)
    enc = subprocess.Popen(['ffmpeg', '-y', '-v', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{W}x{H}', '-r', str(FPS), '-i', '-', '-i', wav,
                            '-map', '0:v', '-map', '1:a', '-af', 'loudnorm=I=-14:TP=-1.5:LRA=9', '-c:v', 'libx264', '-preset', 'slow', '-crf', '14', '-pix_fmt', 'yuv420p',
                            '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-c:a', 'aac', '-b:a', '256k', '-ar', '48000', '-movflags', '+faststart', '-shortest', OUTF],
                           stdin=subprocess.PIPE)
    last_alive = 100; pulse_until = -1
    for f in range(n):
        t = f / FPS
        if t < t_end:
            si = max(k for k in range(len(SHOTS)) if st[k] <= t + 1e-6)
            name, dur, _, cap, hl = SHOTS[si]
            lf = min(int(round((t - st[si]) * FPS)), int(round(dur * FPS)) - 1)
            img = frame_img(name, lf)
            # quick white dip on the first frames of each cut
            if lf < 3 and si > 0:
                img = np.clip(img.astype(np.float32) * (1 - 0.0) + 255 * (0.30 - 0.1 * lf), 0, 255).astype(np.uint8)
            u_line = (t - st[si]) / 0.5
        else:
            name = 'end'
            img = frame_img('end', 0)
            eu = (t - t_end) / END
            z = 1.0 + 0.05 * eu
            h, w = img.shape[:2]
            ch, cw = int(h / z), int(w / z)
            y0, x0 = (h - ch) // 2, (w - cw) // 2
            img = cv2.resize(img[y0:y0 + ch, x0:x0 + cw], (w, h), interpolation=cv2.INTER_CUBIC)
        rgba = np.dstack([img, np.full((H, W), 255, np.uint8)])
        surf = skia.Surface(rgba); c = surf.getCanvas()
        if t < t_end:
            a_now = alive_at(t, st)
            if a_now != last_alive:
                pulse_until = t + 0.18; last_alive = a_now
            hud(c, a_now, max(0.0, (pulse_until - t) / 0.18))
            if t < 6.5:
                title(c, 1 - OV.sm(5.8, 6.5, t))
            g = skia.GradientShader.MakeLinear([skia.Point(0, 1100), skia.Point(0, 1500)], [OV.col('#000000', 0.0), OV.col('#000000', 0.38)])
            c.drawRect(skia.Rect(0, 1100, W, 1500), skia.Paint(Shader=g))
            caption(c, cap, hl, u_line)
        else:
            hud(c, 1, 0.0)
            end_card(c, (t - t_end) / END)
        enc.stdin.write(rgba[..., :3].tobytes())
    enc.stdin.close(); enc.wait()
    print(OUTF, round(total, 2), "s", flush=True)


if __name__ == "__main__":
    main()
