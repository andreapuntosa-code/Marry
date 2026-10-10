# -*- coding: utf-8 -*-
"""
Promo Short v2 (1080x1920, ~30 s) for a second account, "a person talking about it": a casual voice-over over what looks
like a phone screen recording of a video app (channel page -> a video playing -> the comments with "Bingus" -> back to
the channel, subscribe), finger taps, short TikTok-style captions. No film graphics on top.

  python3 make_promo2.py   ->  ../../video promo/short_promo_persona.mp4
Set CHANNEL to the real channel name before publishing.
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

CHANNEL = os.environ.get("CHANNEL", "AI Civilization")
S = os.environ.get("SCRATCH", "/tmp/claude-0/-home-user-Marry/e61fd834-a8c5-5cc5-8204-6c637a41951f/scratchpad")
MODELS = os.path.join(S, "models")
ROOT = os.path.dirname(os.path.dirname(HERE))
OUTF = os.path.join(ROOT, "video promo", "short_promo_persona.mp4")
SRC = "concat:" + "|".join(sorted(glob.glob(os.path.join(ROOT, "video simulazione 2", "film_parti", "*.part*"))))
W, H, FPS, SR = 1080, 1920, 30, 48000
img = lambda p: cv2.cvtColor(cv2.imread(os.path.join(ROOT, p)), cv2.COLOR_BGR2RGB)
AVATAR = img("video simulazione/immagine_profilo.jpg")
THUMBS = [("I Let 20 AIs Live in the Stone Age: Will They Survive?", "video preistoria/copertina_PRE_B.jpg", "1.2M views · 2 days ago", "13:24"),
          ("I Let AI Build a Civilization From Zero (Part 2): They Answered", "video simulazione 2/copertina_P2_A.jpg", "3.4M views · 1 week ago", "14:32"),
          ("I Let AI Build a Civilization From Zero", "video simulazione/copertina_A.jpg", "8.1M views · 3 weeks ago", "15:42"),
          ("I Put 100 AIs in an Arena. Only One Walks Out.", "video hunger/copertina_HG_A.jpg", "2.2M views · 1 month ago", "20:03")]
THUMBS = [(t, img(p), v, d) for t, p, v, d in THUMBS]
BANNER = img("video preistoria/copertina_PRE_B.jpg")[150:150 + 289, :]   # a 1280x289 strip (same aspect as the 1020x230 banner)

# voice lines: (text, scene, clip start in the Part 2 film or None)
LINES = [
    ("Okay, so I found this YouTube channel, and it's honestly insane.", "channel", None),
    ("This guy built a whole civilization... out of AIs.", "player", 4.8),
    ("Twenty of them, starting from literally nothing.", "player", 9.0),
    ("And here's the crazy part: the comments control it.", "comments", None),
    ("Every video, the most liked comment gets put into the simulation.", "comments", None),
    ("Like, someone commented Bingus...", "bingus", None),
    ("and now the AIs have a whole religion about it.", "player", 266.6),
    ("They built a ladder to the sky, just to figure out what a Bingus is.", "player", 382.0),
    ("And at the top, they found our comments. I'm obsessed.", "player", 761.0),
    ("Go comment on the next one. Link's in my bio.", "subscribe", None),
]
GAP = 0.12


def tts():
    from kokoro_onnx import Kokoro
    from sintesi_p2 import trim
    k = Kokoro(f"{MODELS}/kokoro-v1.0.onnx", f"{MODELS}/voices-v1.0.bin")
    out = []
    for text, _, _ in LINES:
        y, sr = k.create(text.replace("...", ","), voice="af_heart", speed=1.08, lang="en-us")
        y = trim(np.asarray(y, np.float32), sr, pad_end=0.06)
        g = np.gcd(SR, sr); out.append(signal.resample_poly(y, SR // g, sr // g).astype(np.float32))
    return out


# ------------------------------------------------------------------ drawing helpers
def P(h, a=1.0, **k): return OV.P(h, a, **k)
def T(c, s, x, y, size, col='#f1f1f1', key='corpo_m', a=1.0, align='left'):
    return OV.txt(c, s, x, y, key, size, col, a, align, 0, shadow=0)


def put(rgba, im, x, y, w, h, radius=0):
    """paste an RGB image (resized to w x h) into the RGBA canvas at x,y with rounded corners"""
    im = cv2.resize(im, (int(w), int(h)), interpolation=cv2.INTER_AREA)
    x, y = int(x), int(y); x0, y0 = max(0, x), max(0, y); x1, y1 = min(W, x + im.shape[1]), min(H, y + im.shape[0])
    if x1 <= x0 or y1 <= y0: return
    sub = im[y0 - y:y1 - y, x0 - x:x1 - x]
    if radius:
        mask = np.zeros(sub.shape[:2], np.uint8); hh, ww = mask.shape
        cv2.rectangle(mask, (radius, 0), (ww - radius, hh), 255, -1); cv2.rectangle(mask, (0, radius), (ww, hh - radius), 255, -1)
        for cx, cy in [(radius, radius), (ww - radius, radius), (radius, hh - radius), (ww - radius, hh - radius)]: cv2.circle(mask, (cx, cy), radius, 255, -1)
        m = (mask[..., None] / 255.0); rgba[y0:y1, x0:x1, :3] = (sub * m + rgba[y0:y1, x0:x1, :3] * (1 - m)).astype(np.uint8)
    else:
        rgba[y0:y1, x0:x1, :3] = sub


def circle_img(rgba, im, cx, cy, r):
    sz = int(2 * r); im = cv2.resize(im, (sz, sz)); mask = np.zeros((sz, sz), np.uint8); cv2.circle(mask, (sz // 2, sz // 2), sz // 2, 255, -1)
    x0, y0 = int(cx - r), int(cy - r); m = mask[..., None] / 255.0
    rgba[y0:y0 + sz, x0:x0 + sz, :3] = (im * m + rgba[y0:y0 + sz, x0:x0 + sz, :3] * (1 - m)).astype(np.uint8)


def status_bar(c):
    T(c, "9:41", 70, 62, 34, '#ffffff', 'corpo_b')
    for k in range(4): c.drawRect(skia.Rect(890 + k * 14, 58 - 8 - k * 5, 900 + k * 14, 58), P('#ffffff'))
    c.drawRoundRect(skia.Rect(960, 36, 1012, 60), 6, 6, P('#ffffff', 1, stroke=3)); c.drawRect(skia.Rect(964, 40, 1000, 56), P('#ffffff'))


def tap(c, x, y, u):
    """finger tap: a grey dot that grows and fades"""
    if 0 <= u <= 1:
        c.drawCircle(x, y, 38 + 40 * u, P('#ffffff', 0.35 * (1 - u))); c.drawCircle(x, y, 30, P('#bbbbbb', 0.55 * (1 - u * 0.7)))


def like_icon(c, x, y, s, col='#f1f1f1', filled=False):
    p = skia.Path(); p.moveTo(x, y + s * 0.45); p.lineTo(x + s * 0.28, y + s * 0.45); p.lineTo(x + s * 0.28, y + s); p.lineTo(x, y + s); p.close()
    q = skia.Path(); q.moveTo(x + s * 0.34, y + s * 0.45); q.lineTo(x + s * 0.55, y); q.quadTo(x + s * 0.72, y + s * 0.05, x + s * 0.65, y + s * 0.38); q.lineTo(x + s, y + s * 0.38); q.lineTo(x + s * 0.92, y + s); q.lineTo(x + s * 0.34, y + s); q.close()
    pt = P(col) if filled else P(col, 1, stroke=s * 0.08)
    c.drawPath(p, pt); c.drawPath(q, pt)


# ------------------------------------------------------------------ scenes
def scene_channel(rgba, c, lt, dur, subscribed=0.0, tap_at=None):
    rgba[..., :3] = 15
    scroll = min(1.0, lt / max(0.1, dur * 0.8)) * 260 if subscribed == 0 else 0
    y = 110 - scroll
    put(rgba, BANNER, 30, y, 1020, 230, radius=22); y += 270
    circle_img(rgba, AVATAR, 120, y + 80, 80)
    rgba_c = c
    T(c, CHANNEL, 230, y + 60, 54, '#ffffff', 'corpo_b'); T(c, "@aicivilization · 412K subscribers · 4 videos", 230, y + 110, 28, '#aaaaaa', 'corpo')
    bx0, bx1, by = 60, 1020, y + 190
    sub_col = '#272727' if subscribed > 0.5 else '#f1f1f1'
    c.drawRoundRect(skia.Rect(bx0, by, bx1, by + 84), 42, 42, P(sub_col))
    T(c, "Subscribed" if subscribed > 0.5 else "Subscribe", (bx0 + bx1) / 2, by + 56, 36, '#f1f1f1' if subscribed > 0.5 else '#0f0f0f', 'corpo_b', align='center')
    if tap_at is not None: tap(c, (bx0 + bx1) / 2, by + 42, tap_at)
    y = by + 130
    for k, lab in enumerate(["Home", "Videos", "Shorts", "Community"]):
        T(c, lab, 70 + k * 230, y, 32, '#ffffff' if k == 1 else '#aaaaaa', 'corpo_m')
    c.drawRect(skia.Rect(300, y + 18, 420, y + 23), P('#ffffff'))
    y += 70
    for t, th, v, d in THUMBS:
        put(rgba, th, 30, y, 1020, 574, radius=24)
        c.drawRoundRect(skia.Rect(940, y + 520, 1036, y + 560), 8, 8, P('#000000', 0.8)); T(c, d, 988, y + 551, 26, '#ffffff', 'corpo_b', align='center')
        T(c, t[:46] + ('…' if len(t) > 46 else ''), 40, y + 625, 34, '#f1f1f1', 'corpo_m'); T(c, v, 40, y + 668, 28, '#aaaaaa', 'corpo')
        y += 720


def scene_player(rgba, c, frame, lt, dur, title, comments_peek=True):
    rgba[..., :3] = 15
    vy = 110; vid = cv2.resize(frame, (W, 608), interpolation=cv2.INTER_AREA); rgba[vy:vy + 608, :, :3] = vid
    prog = 0.18 + 0.5 * (lt / max(dur, 0.1)) * 0.2
    c.drawRect(skia.Rect(0, vy + 604, W, vy + 610), P('#717171')); c.drawRect(skia.Rect(0, vy + 604, W * prog, vy + 610), P('#ff0033')); c.drawCircle(W * prog, vy + 607, 12, P('#ff0033'))
    y = vy + 680
    T(c, title, 40, y, 40, '#f1f1f1', 'corpo_b'); T(c, "3.4M views  1w ago  #AI  #simulation  ...more", 40, y + 52, 28, '#aaaaaa', 'corpo')
    y += 120; circle_img(rgba, AVATAR, 80, y + 6, 40); T(c, CHANNEL, 140, y + 18, 34, '#f1f1f1', 'corpo_b'); T(c, "412K", 140 + OV.text_width(CHANNEL, 'corpo_b', 34) + 16, y + 18, 28, '#aaaaaa', 'corpo')
    c.drawRoundRect(skia.Rect(830, y - 26, 1040, y + 40), 33, 33, P('#f1f1f1')); T(c, "Subscribe", 935, y + 17, 30, '#0f0f0f', 'corpo_b', align='center')
    y += 90
    for k, (lab, w) in enumerate([("  248K", 230), ("Share", 170), ("Remix", 170), ("Download", 220)]):
        x0 = 40 + sum(z for _, z in [("", 230), ("", 170), ("", 170), ("", 220)][:k]) + k * 16
        c.drawRoundRect(skia.Rect(x0, y - 34, x0 + w, y + 30), 32, 32, P('#272727'))
        if k == 0: like_icon(c, x0 + 22, y - 16, 34); T(c, "248K", x0 + 76, y + 10, 28, '#f1f1f1', 'corpo_m')
        else: T(c, lab, x0 + w / 2, y + 10, 28, '#f1f1f1', 'corpo_m', align='center')
    if comments_peek:
        y += 80; c.drawRoundRect(skia.Rect(30, y, 1050, y + 170), 24, 24, P('#272727'))
        T(c, "Comments  2.4M", 60, y + 52, 32, '#f1f1f1', 'corpo_b'); c.drawCircle(84, y + 112, 24, P('#7a4bd6')); T(c, "I", 84, y + 123, 28, '#ffffff', 'corpo_b', align='center')
        T(c, "Bingus", 126, y + 122, 32, '#f1f1f1', 'corpo')
        y += 210; put(rgba, THUMBS[0][1], 30, y, 1020, 574, radius=24)


COMMENTS = [("@IsabellaDelaney-Dean", "16 hours ago", "Bingus", "48K", '#7a4bd6'), ("@dr_pickle_42", "1 day ago", "please give them a railroad", "4.1K", '#2f9e8a'),
            ("@zzzTom", "6 hours ago", "ok but what happens when they find YOU", "8.8K", '#d6574b'), ("@m4rcel", "2 days ago", "my grandma watched this twice", "5.7K", '#c98a1b'),
            ("@NoodleLegend", "3 days ago", "first", "12", '#4b7fd6'), ("@baker_boy", "1 day ago", "the goat guy was right the whole time", "2.3K", '#7a4bd6')]


def scene_comments(rgba, c, frame, lt, dur, focus=0.0, liked_at=None, slide=True):
    scene_player(rgba, c, frame, lt, dur, "I Let AI Build a Civilization From Zero (Part 2)", comments_peek=False)
    up = OV.eo(OV.clamp(lt / 0.35)) if slide else 1.0
    top = int(H - (H - 820) * up)
    c.drawRect(skia.Rect(0, 718, W, H), P('#000000', 0.45 * up))
    c.drawRoundRect(skia.Rect(0, top, W, H + 40), 36, 36, P('#212121'))
    c.drawRoundRect(skia.Rect(500, top + 18, 580, top + 26), 4, 4, P('#717171'))
    T(c, "Comments", 50, top + 90, 40, '#f1f1f1', 'corpo_b'); T(c, "2.4M", 270, top + 90, 34, '#aaaaaa', 'corpo')
    for k, lab in enumerate(["Top", "Newest"]):
        x0 = 50 + k * 160; c.drawRoundRect(skia.Rect(x0, top + 120, x0 + 140, top + 180), 14, 14, P('#f1f1f1' if k == 0 else '#3a3a3a')); T(c, lab, x0 + 70, top + 160, 28, '#0f0f0f' if k == 0 else '#f1f1f1', 'corpo_m', align='center')
    y = top + 230
    for i, (u, wh, txt, likes, col) in enumerate(COMMENTS):
        hl = (i == 0) and focus > 0
        if hl:
            c.drawRoundRect(skia.Rect(20, y - 20, 1060, y + 190), 20, 20, P('#3a3a1a', 0.9 * min(1, focus)))
        c.drawCircle(90, y + 40, 38, P(col)); T(c, u[1].upper(), 90, y + 54, 36, '#ffffff', 'corpo_b', align='center')
        T(c, u, 150, y + 26, 28, '#aaaaaa', 'corpo_m'); T(c, wh, 150 + OV.text_width(u, 'corpo_m', 28) + 16, y + 26, 26, '#717171', 'corpo')
        size = 40 + (30 * min(1, focus) if hl else 0)
        T(c, txt, 150, y + 84 + (size - 40) * 0.6, size, '#ffffff' if hl else '#f1f1f1', 'corpo_b' if hl else 'corpo')
        liked = hl and liked_at is not None and liked_at > 0.3
        like_icon(c, 150, y + 120 + (size - 40) * 0.8, 30, '#3ea6ff' if liked else '#aaaaaa', filled=liked)
        T(c, likes if not liked else "48K", 196, y + 146 + (size - 40) * 0.8, 26, '#aaaaaa', 'corpo')
        if hl and liked_at is not None: tap(c, 165, y + 135 + (size - 40) * 0.8, liked_at)
        y += 230 + (40 if hl else 0)


def caption(c, words, t_words, t):
    """TikTok text style: a white rounded box with black text, 3-4 words at a time, mid-screen"""
    shown = [w for w, ws in zip(words, t_words) if t >= ws]
    if not shown: return
    k = len(shown) - 1; g0 = (k // 4) * 4; chunk = words[g0:g0 + 4]; vis = [w for w, ws in zip(chunk, t_words[g0:g0 + 4]) if t >= ws]
    s = " ".join(vis); size = 66; f = OV.font('corpo_b', size); w = OV.text_width(s, 'corpo_b', size); x = W / 2 - w / 2; y = 1020
    age = t - t_words[g0 + len(vis) - 1]; pop = 1 + 0.08 * max(0, 1 - age / 0.12)
    c.save(); c.translate(W / 2, y - 22); c.scale(pop, pop); c.translate(-W / 2, -(y - 22))
    c.drawRoundRect(skia.Rect(x - 30, y - 70, x + w + 30, y + 26), 20, 20, P('#000000', 0.25, blur=10))
    c.drawRoundRect(skia.Rect(x - 30, y - 74, x + w + 30, y + 22), 20, 20, P('#ffffff'))
    c.drawString(s, x, y, f, P('#111111')); c.restore()


def clip_frames(t0, n):
    p = subprocess.Popen(['ffmpeg', '-v', 'error', '-ss', f'{t0:.3f}', '-t', f'{n / FPS + 0.3:.3f}', '-i', SRC, '-vf', 'fps=30', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], stdout=subprocess.PIPE)
    last = np.zeros((1080, 1920, 3), np.uint8)
    for _ in range(n):
        b = p.stdout.read(1920 * 1080 * 3)
        if len(b) == 1920 * 1080 * 3: last = np.frombuffer(b, np.uint8).reshape(1080, 1920, 3)
        yield last
    p.stdout.close(); p.wait()


def bed(total):
    T_ = M.Track(total + 1)
    prog = [(48, 55, 60, 64), (45, 52, 57, 60), (41, 48, 53, 57), (43, 50, 55, 59)]
    t, i = 0.0, 0
    while t < total:
        for m in prog[i % 4]:
            T_.add(t, mono=M.epiano(m + 12, 1.6, 0.35), gain=0.10)
        T_.add(t, mono=M.kick(0.5), gain=0.35); T_.add(t + 1.0, mono=M.kick(0.4), gain=0.3)
        for h in range(8): T_.add(t + h * 0.25, mono=M.hat(0.12), gain=0.22)
        t += 2.0; i += 1
    L, R = M.apply_reverb(T_.L.astype(np.float64), T_.R.astype(np.float64), wet=0.18)
    n = int(total * SR); mus = np.stack([L[:n], R[:n]], 1)
    return mus / (np.abs(mus).max() + 1e-9)


def main():
    voices = tts()
    starts, t = [], 0.25
    for v in voices:
        starts.append(t); t += len(v) / SR + GAP
    total = t + 0.9; n = int(round(total * FPS))
    N = int(total * SR); voice = np.zeros(N)
    for s0, v in zip(starts, voices):
        i = int(s0 * SR); seg = v[:max(0, N - i)]; voice[i:i + len(seg)] += seg
    act = (np.abs(voice) > 0.01).astype(np.float64)
    duck = 1 - 0.6 * (signal.fftconvolve(act, np.ones(int(0.25 * SR)) / int(0.25 * SR), 'same') > 0.05)
    duck = signal.fftconvolve(duck, np.ones(int(0.12 * SR)) / int(0.12 * SR), 'same')
    mix = bed(total) * (0.35 * duck)[:, None] + voice[:, None]
    mix = mix / (np.abs(mix).max() + 1e-9) * 0.9
    wav = os.path.join(S, "promo2_audio.wav"); sf.write(wav, mix.astype(np.float32), SR)
    enc = subprocess.Popen(['ffmpeg', '-y', '-v', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{W}x{H}', '-r', str(FPS), '-i', '-', '-i', wav,
                            '-map', '0:v', '-map', '1:a', '-af', 'loudnorm=I=-14:TP=-1.5:LRA=9', '-c:v', 'libx264', '-preset', 'slow', '-crf', '17', '-pix_fmt', 'yuv420p',
                            '-c:a', 'aac', '-b:a', '256k', '-ar', '48000', '-movflags', '+faststart', '-shortest', OUTF], stdin=subprocess.PIPE)
    last_frame = np.zeros((1080, 1920, 3), np.uint8)
    for li, (text, scene, src) in enumerate(LINES):
        l0 = 0.0 if li == 0 else starts[li]; l1 = starts[li + 1] if li + 1 < len(LINES) else total
        fa, fb = int(round(l0 * FPS)), int(round(l1 * FPS))
        words = text.split(); ldur = len(voices[li]) / SR
        wts = [len(re.sub(r"\W", "", w)) + 1.5 for w in words]; tot = sum(wts); acc = 0; t_words = []
        for w_ in wts: t_words.append(starts[li] + ldur * acc / tot); acc += w_
        frames = clip_frames(src, fb - fa) if src is not None else None
        for fr in range(fa, fb):
            tt = fr / FPS; lt = tt - l0; dur = l1 - l0
            if frames is not None: last_frame = next(frames)
            rgba = np.zeros((H, W, 4), np.uint8); rgba[..., 3] = 255
            surf = skia.Surface(rgba); c = surf.getCanvas()
            if scene == "channel":
                scene_channel(rgba, c, lt, dur)
            elif scene == "player":
                title = "I Let AI Build a Civilization From Zero (Part 2)" if src > 100 else "I Let AI Build a Civilization From Zero"
                scene_player(rgba, c, last_frame, lt + (li * 2.0), dur + 10, title)
            elif scene == "comments":
                scene_comments(rgba, c, last_frame, lt, dur, slide=(li == 3))
                if li == 4: tap(c, 165, 820 + 230 + 135, (lt - 1.0) / 0.5)
            elif scene == "bingus":
                scene_comments(rgba, c, last_frame, lt, dur, focus=OV.eo(OV.clamp(lt / 0.4)), liked_at=(lt - 0.5) / 0.6, slide=False)
            elif scene == "subscribe":
                tp = (lt - 0.9) / 0.5
                scene_channel(rgba, c, 0, 1, subscribed=1.0 if tp > 0.3 else 0.0, tap_at=tp)
                a = OV.sm(1.4, 1.8, lt)
                if a > 0:   # "link in bio" sticker
                    c.save(); c.translate(W / 2, 1560); c.rotate(-4)
                    c.drawRoundRect(skia.Rect(-300, -70, 300, 70), 24, 24, P('#ffffff', a)); T(c, "link in bio", 0, 24, 66, '#111111', 'corpo_b', a, align='center')
                    c.restore()
            status_bar(c)
            caption(c, words, t_words, tt)
            enc.stdin.write(rgba[..., :3].tobytes())
        if frames is not None:
            for _ in frames: pass
    enc.stdin.close(); enc.wait()
    print(OUTF, round(total, 2), "s", flush=True)


if __name__ == "__main__":
    main()
