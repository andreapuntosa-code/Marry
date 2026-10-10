# -*- coding: utf-8 -*-
"""
Shared toolkit for the channel ad Shorts (1080x1920): clips from the films cropped to 9:16, captions in a few styles,
the channel end card (The Animator, real avatar, no numbers), procedural music beds, TTS and the encoder.

A video is a list of shots [(t_start, t_end, src, t0, opts)] plus a draw(c, rgba, t, k, lt) overlay callback.
  CHECK=1 python3 ad_x.py   -> a contact sheet of every shot (first / middle / last frame) to verify the clip times
"""
import os, sys, glob, subprocess, re, math
import numpy as np
import cv2
import skia
import soundfile as sf
from scipy import signal

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import overlays as OV
import music as M

CHANNEL, HANDLE = "The Animator", "@TheAnimator-j3t"
S = os.environ.get("SCRATCH", "/tmp/claude-0/-home-user-Marry/e61fd834-a8c5-5cc5-8204-6c637a41951f/scratchpad")
MODELS = os.path.join(S, "models")
ROOT = os.path.dirname(os.path.dirname(HERE))
OUTDIR = os.path.join(ROOT, "video promo")
W, H, FPS, SR = 1080, 1920, 30, 48000
_films = lambda d: "concat:" + "|".join(sorted(glob.glob(os.path.join(ROOT, d, "film_parti", "*.part*"))))
SRC = {"p1": _films("video simulazione"), "p2": _films("video simulazione 2"), "pre": _films("video preistoria"), "hg": _films("video hunger")}
BAND = {"p1": (140, 940), "hg": (0, 1080), "p2": (140, 940), "pre": (140, 940)}   # the 2.39:1 films are letterboxed
AVATAR = cv2.cvtColor(cv2.imread(os.path.join(OUTDIR, "avatar_the_animator.png")), cv2.COLOR_BGR2RGB)
P = OV.P


def T(c, s, x, y, size, col='#ffffff', key='corpo_b', a=1.0, align='left'):
    return OV.txt(c, s, x, y, key, size, col, a, align, 0, shadow=0)


# ------------------------------------------------------------------ voice
def tts(lines, voice, speed):
    from kokoro_onnx import Kokoro
    from sintesi_p2 import trim
    k = Kokoro(f"{MODELS}/kokoro-v1.0.onnx", f"{MODELS}/voices-v1.0.bin")
    out = []
    for text in lines:
        y, sr = k.create(text, voice=voice, speed=speed, lang="en-us")
        y = trim(np.asarray(y, np.float32), sr, pad_end=0.04)
        g = np.gcd(SR, sr); out.append(signal.resample_poly(y, SR // g, sr // g).astype(np.float32))
    return out


def place(voices, t0=0.2, gaps=0.08):
    starts, t = [], t0
    for i, v in enumerate(voices):
        starts.append(t); t += len(v) / SR + (gaps[i] if isinstance(gaps, (list, tuple)) else gaps)
    return starts, t


def word_times(text, start, dur):
    words = text.split(); wts = [len(re.sub(r"\W", "", w)) + 1.5 for w in words]; tot = sum(wts); acc = 0; out = []
    for w_ in wts: out.append(start + dur * acc / tot); acc += w_
    return words, out


# ------------------------------------------------------------------ clips
class Clip:
    def __init__(self, src, t0, n, speed=1.0, hold=None):
        self.src, self.n = src, n
        d = min(n * speed / FPS + 0.3, hold or 1e9)
        self.p = subprocess.Popen(['ffmpeg', '-v', 'error', '-ss', f'{t0:.3f}', '-t', f'{d:.3f}', '-i', SRC[src], '-vf', f'setpts=PTS/{speed},fps=30',
                                   '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], stdout=subprocess.PIPE, stderr=subprocess.DEVNULL)
        self.last = np.zeros((1080, 1920, 3), np.uint8)

    def next(self):
        if self.p is not None:
            b = self.p.stdout.read(1920 * 1080 * 3)
            if len(b) == 1920 * 1080 * 3: self.last = np.frombuffer(b, np.uint8).reshape(1080, 1920, 3)
            else: self.close()
        return self.last

    def close(self):
        if self.p is not None:
            self.p.stdout.close(); self.p.kill(); self.p.wait(); self.p = None


def shake(t, seed, amp=1.0):
    f = lambda w, p: math.sin(t * w + p + seed)
    return amp * (6 * f(1.7, 0) + 3 * f(4.3, 1)), amp * (5 * f(1.3, 2) + 3 * f(3.7, 3)), amp * (0.5 * f(1.1, 4) + 0.25 * f(2.9, 5))


def film(frame, src, lt, seed, xoff=0.0, zoom=1.0, rate=0.017, amp=0.6):
    """9:16 full-screen crop of a film frame (inside the picture band), slow push-in and a little handheld drift"""
    y0, y1 = BAND[src]; bh = y1 - y0
    s = zoom + rate * lt; dx, dy, rot = shake(lt, seed, amp)
    h0 = bh / s; w0 = h0 * 9 / 16; cx, cy = 960 + xoff * 1920 + dx, (y0 + y1) / 2 + dy
    M_ = cv2.getRotationMatrix2D((cx, cy), rot * 0.6, 1.0)
    M_[0, 2] -= cx - w0 / 2; M_[1, 2] -= cy - h0 / 2; M_ *= W / w0
    out = cv2.warpAffine(frame, M_, (W, H), flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_REFLECT)
    out = cv2.addWeighted(out, 1.5, cv2.GaussianBlur(out, (0, 0), 2.5), -0.5, 0)
    return np.dstack([out, np.full((H, W), 255, np.uint8)])


# ------------------------------------------------------------------ text styles
def pop_word(c, word, age, y=1270, size=92, key='corpo_b', col='#ffffff'):
    """creator style: one word at a time, white with a soft shadow"""
    w = OV.text_width(word, key, size)
    if w > W - 80: size *= (W - 80) / w; w = W - 80
    x = W / 2 - w / 2; pop = 1 + 0.10 * max(0, 1 - age / 0.09); f = OV.font(key, size)
    c.save(); c.translate(W / 2, y - size / 3); c.scale(pop, pop); c.translate(-W / 2, -(y - size / 3))
    c.drawString(word, x + 3, y + 5, f, P('#000000', 0.55, blur=8))
    c.drawString(word, x, y, f, P('#000000', 0.6, stroke=size * 0.055))
    c.drawString(word, x, y, f, P(col)); c.restore()


def wrap(s, key, size, maxw):
    lines, cur = [], ""
    for w_ in s.split():
        if OV.text_width((cur + " " + w_).strip(), key, size) > maxw and cur: lines.append(cur); cur = w_
        else: cur = (cur + " " + w_).strip()
    return lines + [cur]


def box_text(c, s, y, size=58, a=1.0, maxw=900, key='corpo_b', bg='#ffffff', fg='#111111'):
    """TikTok text sticker: white rounded boxes, one per line, black text"""
    if a <= 0: return y
    lines = wrap(s, key, size, maxw); lh = size * 1.32
    for i, ln in enumerate(lines):
        w = OV.text_width(ln, key, size); x = W / 2 - w / 2; yy = y + i * lh
        c.drawRoundRect(skia.Rect(x - 26, yy - size * 1.02, x + w + 26, yy + size * 0.36), 16, 16, P(bg, a))
        c.drawString(ln, x, yy, OV.font(key, size), P(fg, a))
    return y + len(lines) * lh


def big(c, s, y, size=150, a=1.0, scale=1.0, key='poppins', col='#ffffff', stroke='#000000', rot=0.0):
    """big punchy title, auto-fit to the width"""
    if a <= 0: return
    w = OV.text_width(s, key, size)
    if w > W - 90: size *= (W - 90) / w; w = W - 90
    f = OV.font(key, size); x = W / 2 - w / 2
    c.save(); c.translate(W / 2, y - size * 0.35); c.rotate(rot); c.scale(scale, scale); c.translate(-W / 2, -(y - size * 0.35))
    c.drawString(s, x + 6, y + 10, f, P('#000000', 0.45 * a, blur=14))
    c.drawString(s, x, y, f, P(stroke, a, stroke=size * 0.09))
    c.drawString(s, x, y, f, P(col, a)); c.restore()


def circle_img(rgb, im, cx, cy, r):
    sz = int(2 * r); im = cv2.resize(im, (sz, sz), interpolation=cv2.INTER_AREA); mask = np.zeros((sz, sz), np.uint8)
    cv2.circle(mask, (sz // 2, sz // 2), sz // 2 - 1, 255, -1, cv2.LINE_AA)
    x0, y0 = int(cx - r), int(cy - r); m = mask[..., None] / 255.0
    rgb[y0:y0 + sz, x0:x0 + sz, :3] = (im * m + rgb[y0:y0 + sz, x0:x0 + sz, :3] * (1 - m)).astype(np.uint8)


def endcard(rgba, u, line1="Comment the next one", line2="Link in bio", dark=False):
    """channel card over the (blurred, darkened) last picture: real avatar, name, handle, subscribe pill"""
    a = OV.eo(OV.clamp(u / 0.35))
    bg = cv2.GaussianBlur(rgba[..., :3], (0, 0), 18).astype(np.float32) * (0.35 if dark else 0.5)
    rgba[..., :3] = (rgba[..., :3] * (1 - a) + bg * a).astype(np.uint8)
    if a < 0.05: return
    c = skia.Surface(rgba).getCanvas()
    k = OV.eo(OV.clamp((u - 0.1) / 0.4)); r = 190 * (0.7 + 0.3 * k)
    c.drawCircle(W / 2, 700, r + 12, P('#ffffff', a))
    circle_img(rgba, AVATAR, W / 2, 700, r)
    T(c, CHANNEL, W / 2, 1010, 104, '#ffffff', 'corpo_b', a, align='center')
    T(c, HANDLE, W / 2, 1080, 46, '#d0d0d0', 'corpo_m', a, align='center')
    b = OV.eo(OV.clamp((u - 0.45) / 0.3))
    if b > 0:
        c.drawRoundRect(skia.Rect(W / 2 - 230, 1150, W / 2 + 230, 1260), 55, 55, P('#ff0033', b))
        T(c, "SUBSCRIBE", W / 2, 1224, 52, '#ffffff', 'corpo_b', b, align='center')
    d = OV.eo(OV.clamp((u - 0.8) / 0.3))
    if d > 0:
        T(c, line1, W / 2, 1420, 64, '#ffffff', 'corpo_b', d, align='center')
        if line2:
            w = OV.text_width(line2, 'corpo_b', 58)
            c.drawRoundRect(skia.Rect(W / 2 - w / 2 - 30, 1475, W / 2 + w / 2 + 30, 1565), 20, 20, P('#ffffff', d))
            T(c, line2, W / 2, 1540, 58, '#111111', 'corpo_b', d, align='center')


def vignette(rgba, strength=0.45):
    global _VIG
    if '_VIG' not in globals():
        yy, xx = np.mgrid[0:H, 0:W]; r = np.sqrt(((xx - W / 2) / (W * 0.75)) ** 2 + ((yy - H / 2) / (H * 0.62)) ** 2)
        globals()['_VIG'] = np.clip(1 - strength * np.clip(r - 0.35, 0, 1) ** 1.4 * 1.8, 0, 1).astype(np.float32)[..., None]
    rgba[..., :3] = (rgba[..., :3] * _VIG).astype(np.uint8)


# ------------------------------------------------------------------ music
def pad(*a, **k):
    L, R = M.pad_note(*a, **k); return (L + R) / 2


def choir(*a, **k):
    L, R = M.choir_note(*a, **k); return (L + R) / 2


def finish_mix(T_, total, wet=0.15):
    L, R = M.apply_reverb(T_.L.astype(np.float64), T_.R.astype(np.float64), wet=wet)
    n = int(total * SR); mus = np.stack([L[:n], R[:n]], 1)
    return mus / (np.abs(mus).max() + 1e-9)


def bed_pop(total, bpm=112, root=45):
    """bright pop: pluck chords, four-on-the-floor kick, clap on 2 and 4, offbeat hats"""
    T_ = M.Track(total + 2); b = 60 / bpm
    prog = [(0, 7, 12, 16), (-4, 3, 8, 12), (3, 10, 15, 19), (-2, 5, 10, 14)]
    t, i = 0.0, 0
    while t < total:
        ch = prog[(i // 4) % 4]
        for m in ch: T_.add(t, mono=M.pluck(root + 12 + m, 0.5, 0.45), gain=0.10)
        if i % 4 == 0: T_.add(t, mono=pad(root + ch[0], b * 4, bright=900), gain=0.10)
        T_.add(t, mono=M.kick(0.8), gain=0.34)
        if i % 2 == 1: T_.add(t, mono=M.snare(0.5), gain=0.16)
        T_.add(t + b / 2, mono=M.hat(0.2), gain=0.16)
        t += b; i += 1
    return finish_mix(T_, total)


def bed_trap(total, bpm=140, root=41):
    """dark trap: 808-ish boom, half-time snare, rolling hats, minor bell motif"""
    T_ = M.Track(total + 2); b = 60 / bpm; bar = 4 * b
    motif = [0, 3, 7, 10, 7, 3, 0, -2]
    t, i = 0.0, 0
    while t < total:
        for k, m in enumerate(motif): T_.add(t + k * b / 2, mono=M.bell(root + 24 + m, 0.6, 0.25), gain=0.06)
        T_.add(t, mono=M.boom(0.7, 44), gain=0.35); T_.add(t + 2.5 * b, mono=M.boom(0.5, 44), gain=0.25)
        T_.add(t, mono=M.kick(0.9), gain=0.32); T_.add(t + 1.5 * b, mono=M.kick(0.6), gain=0.22)
        T_.add(t + 2 * b, mono=M.snare(0.8), gain=0.22)
        for h in range(16 if i % 2 else 8):
            step = b / 4 if i % 2 else b / 2
            T_.add(t + h * step, mono=M.hat(0.18), gain=0.14)
        t += bar; i += 1
    return finish_mix(T_, total, 0.12)


def bed_dark(total, hits=()):
    """cinematic dread: low drone, choir swells, timpani/boom on the hits"""
    T_ = M.Track(total + 4)
    for k, m in enumerate([38, 36, 34, 36]):
        t0 = k * total / 4
        T_.add(t0, mono=M.drone(m, total / 4 + 2, 0.5, 500), gain=0.35)
        T_.add(t0, mono=choir(m + 24, total / 4 + 1.5), gain=0.10)
    for t in np.arange(0, total, 2.4): T_.add(t, mono=M.timpani(55, 0.35), gain=0.12)
    for t in hits:
        T_.add(t, mono=M.boom(1.0), gain=0.6); T_.add(max(0, t - 1.6), mono=M.reverse_cymbal(1.6, 0.5), gain=0.25)
    return finish_mix(T_, total, 0.3)


def bed_hype(total, drop, bpm=128, root=45):
    """build then drop: riser into a hard four-on-the-floor at `drop`"""
    T_ = M.Track(total + 3); b = 60 / bpm
    T_.add(max(0, drop - 2.5), mono=M.riser(2.5, 0.6), gain=0.35)
    t = 0.0; i = 0
    while t < drop:
        T_.add(t, mono=M.pluck(root + 12 + (0 if i % 8 < 4 else 3), 0.3, 0.4), gain=0.10)
        if t > drop - 2 * 4 * b: T_.add(t, mono=M.snare(0.3 + 0.5 * (t / drop)), gain=0.12)
        t += b / 2; i += 1
    T_.add(drop, mono=M.boom(1.0), gain=0.5)
    t, i = drop, 0
    prog = [0, -4, 3, -2]
    while t < total:
        m = prog[(i // 8) % 4]
        T_.add(t, mono=M.kick(1.0), gain=0.40)
        if i % 2 == 1: T_.add(t, mono=M.snare(0.6), gain=0.18)
        T_.add(t + b / 2, mono=M.hat(0.25), gain=0.18)
        for x in (0, 7, 12): T_.add(t, mono=M.pluck(root + 12 + m + x, 0.35, 0.5), gain=0.08)
        if i % 8 == 0: T_.add(t, mono=pad(root + m, 8 * b, bright=1400), gain=0.12)
        t += b; i += 1
    return finish_mix(T_, total, 0.14)


def mix(music, voice_tracks, total, music_gain=0.30, duck=0.55):
    N = int(total * SR); voice = np.zeros(N)
    for s0, v in voice_tracks:
        i = int(s0 * SR); seg = v[:max(0, N - i)]; voice[i:i + len(seg)] += seg
    music = music[:N]
    if len(music) < N: music = np.pad(music, ((0, N - len(music)), (0, 0)))
    if voice_tracks:
        act = (np.abs(voice) > 0.01).astype(np.float64)
        d = 1 - duck * (signal.fftconvolve(act, np.ones(int(0.25 * SR)) / int(0.25 * SR), 'same') > 0.05)
        d = signal.fftconvolve(d, np.ones(int(0.12 * SR)) / int(0.12 * SR), 'same')
    else:
        d = np.ones(N)
    fade = np.clip((total - np.arange(N) / SR) / 0.6, 0, 1)
    out = music * (music_gain * d * fade)[:, None] + voice[:, None]
    return out / (np.abs(out).max() + 1e-9) * 0.9


# ------------------------------------------------------------------ render
def check_sheet(shots, name):
    tiles = []
    for (a, b, src, t0, o) in shots:
        if src is None: continue
        dur = (b - a) * o.get("speed", 1.0)
        if o.get("hold"): dur = min(dur, o["hold"])
        row = []
        for tt in (t0 + 0.05, t0 + dur / 2, t0 + max(0.05, dur - 0.1)):
            p = subprocess.run(['ffmpeg', '-v', 'error', '-ss', f'{tt:.3f}', '-i', SRC[src], '-frames:v', '1', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], capture_output=True)
            fr = np.frombuffer(p.stdout[:1920 * 1080 * 3], np.uint8).reshape(1080, 1920, 3) if len(p.stdout) >= 1920 * 1080 * 3 else np.zeros((1080, 1920, 3), np.uint8)
            row.append(cv2.resize(film(fr, src, 0, 0, o.get("x", 0.0), o.get("zoom", 1.0), amp=0)[..., :3], (135, 240)))
        tile = np.hstack(row); cv2.putText(tile, f"{src} {t0:.1f}", (4, 16), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 0), 1)
        tiles.append(tile)
    cols = 4; rows = [np.hstack(tiles[i:i + cols] + [np.zeros_like(tiles[0])] * (cols - len(tiles[i:i + cols]))) for i in range(0, len(tiles), cols)]
    out = os.path.join(S, f"check_{name}.jpg"); cv2.imwrite(out, cv2.cvtColor(np.vstack(rows), cv2.COLOR_RGB2BGR)); print(out)


def render(name, shots, total, audio, draw, grade=None, punch=True):
    """shots: [(t_start, t_end, src or None, t0, opts)]; draw(c, rgba, t, k, lt) adds the overlays"""
    if os.environ.get("CHECK"):
        check_sheet(shots, name); return
    wav = os.path.join(S, f"{name}_audio.wav"); sf.write(wav, audio.astype(np.float32), SR)
    out = os.path.join(OUTDIR, f"{name}.mp4")
    enc = subprocess.Popen(['ffmpeg', '-y', '-v', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{W}x{H}', '-r', str(FPS), '-i', '-', '-i', wav,
                            '-map', '0:v', '-map', '1:a', '-af', 'loudnorm=I=-14:TP=-1.5:LRA=9', '-c:v', 'libx264', '-preset', 'slow', '-crf', '20', '-pix_fmt', 'yuv420p',
                            '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-movflags', '+faststart', '-shortest', out], stdin=subprocess.PIPE)
    n = int(round(total * FPS)); k = -1; clip = None; last = np.zeros((H, W, 4), np.uint8)
    for fr in range(n):
        t = fr / FPS
        while k + 1 < len(shots) and t >= shots[k + 1][0]:
            k += 1
            if clip: clip.close()
            a, b, src, t0, o = shots[k]
            clip = Clip(src, t0, int((b - a) * FPS) + 3, o.get("speed", 1.0), o.get("hold")) if src else None
            f0 = fr
        a, b, src, t0, o = shots[k]; lt = t - a
        if src:
            rgba = film(clip.next(), src, lt, k * 1.7, o.get("x", 0.0), o.get("zoom", 1.0), o.get("rate", 0.017), o.get("amp", 0.6))
            if punch and not o.get("nopunch") and fr - f0 < 3:
                kk = 1.06 - 0.02 * (fr - f0)
                rgba[..., :3] = cv2.warpAffine(rgba[..., :3], cv2.getRotationMatrix2D((540, 960), 0, kk), (W, H), borderMode=cv2.BORDER_REFLECT)
            if grade: grade(rgba, t)
            last = rgba.copy()
        else:
            rgba = last.copy()
        draw(skia.Surface(rgba).getCanvas(), rgba, t, k, lt)
        enc.stdin.write(rgba[..., :3].tobytes())
    if clip: clip.close()
    enc.stdin.close(); enc.wait()
    print(out, round(total, 2), "s", flush=True)
