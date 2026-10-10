# -*- coding: utf-8 -*-
"""
Promo Short v2 (1080x1920, ~30 s) for a second account, in the "creator talking about a channel" format:
fast hard cuts between full-screen clips of the films and handheld shots of a computer monitor showing the real
channel (The Animator, @TheAnimator-j3t) with a finger pointing at it, a casual voice-over and one-word-at-a-time
captions. No invented numbers anywhere (no subscribers, views, likes or comment counts).

  python3 make_promo2.py   ->  ../../video promo/short_promo_the_animator.mp4
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
OUTF = os.path.join(ROOT, "video promo", "short_promo_the_animator.mp4")
films = lambda d: "concat:" + "|".join(sorted(glob.glob(os.path.join(ROOT, d, "film_parti", "*.part*"))))
SRC = {"p2": films("video simulazione 2"), "pre": films("video preistoria")}
W, H, FPS, SR = 1080, 1920, 30, 48000
img = lambda p: cv2.cvtColor(cv2.imread(os.path.join(ROOT, p)), cv2.COLOR_BGR2RGB)
AVATAR = img("video promo/avatar_the_animator.png")
THUMBS = [("I Let 20 AIs Live in the Stone Age: Will They Survive?", "video preistoria/copertina_PRE_B.jpg", "13:24"),
          ("I Let AI Build a Civilization From Zero (Part 2): They Answered", "video simulazione 2/copertina_P2_A.jpg", "14:32"),
          ("I Let AI Build a Civilization From Zero", "video simulazione/copertina_A.jpg", "15:42"),
          ("I Put 100 AIs in an Arena. Only One Walks Out.", "video hunger/copertina_HG_A.jpg", "20:03")]
THUMBS = [(t, img(p), d) for t, p, d in THUMBS]
COMMENTS = [("@IsabellaDelaney-Dean", "Bingus", '#7a4bd6'), ("@zzzTom", "ok but what happens when they find YOU", '#d6574b'),
            ("@dr_pickle_42", "please give them a railroad", '#2f9e8a'), ("@m4rcel", "my grandma watched this twice", '#c98a1b'),
            ("@baker_boy", "the goat guy was right the whole time", '#4b7fd6')]

# (voice line, shot). Shots: ("film", source, t0)  or  ("mon", screen, focus keys, finger keys, extra)
#   focus keys: [(t, cx, cy, width)] in screen pixels; finger keys: [(t, x, y, press)] (screen pixels) or None
LINES = [
    ("Okay, this YouTube channel is doing something nobody else is doing.", ("film", "p2", 51.1, 0.72)),
    ("They drop twenty AIs into an empty world,", ("mon", "channel", [(0, 900, 360, 1300), (2.5, 760, 330, 1000)], [(0.4, 760, 300, 0), (1.3, 700, 250, 1), (2.5, 740, 280, 0)], {})),
    ("and the AIs have to build a whole civilization, from zero.", ("film", "p2", 64.3)),
    ("But here's the crazy part.", ("film", "p2", 140.5)),
    ("The comments control it.", ("mon", "comments", [(0, 640, 560, 1200), (1.6, 640, 600, 1000)], [(0.3, 900, 800, 0), (1.6, 880, 520, 0)], {"scroll": (0.0, 1.6, 300, 660)})),
    ("The most liked comment goes straight into the next video.", ("mon", "comments", [(0, 560, 470, 1000), (3.0, 520, 450, 900)], [(0.2, 700, 700, 0), (1.0, 182, 732, 0), (1.5, 182, 732, 1), (3.0, 200, 750, 0)], {"scroll": 660, "like_at": 1.5})),
    ("Someone commented Bingus,", ("mon", "comments", [(0, 420, 700, 760), (1.2, 380, 700, 560)], [(0.15, 520, 860, 0), (0.7, 220, 700, 1), (1.4, 250, 720, 0)], {"scroll": 660, "liked": True, "hl": True})),
    ("and now the AIs have a whole religion about Bingus.", ("film", "p2", 262.5)),
    ("They built a ladder to the sky, just to find out what it is.", ("film", "p2", 382.0)),
    ("And there's a brand new one in the Stone Age.", ("mon", "channel", [(0, 900, 800, 1400), (2.2, 360, 790, 820)], [(0.5, 700, 900, 0), (1.4, 350, 790, 1), (2.4, 380, 810, 0)], {})),
    ("Cavemen, mammoths, fire.", ("film", "pre", 157.5)),
    ("The channel's called The Animator.", ("mon", "channel", [(0, 700, 320, 1100), (1.8, 640, 300, 900)], [(0.3, 560, 300, 0), (1.5, 640, 262, 0)], {})),
    ("Go comment, you might end up in the next video. Link in bio.", ("mon", "channel", [(0, 640, 330, 900), (3.0, 600, 360, 780)], [(0.2, 700, 520, 0), (0.9, 595, 430, 0), (1.25, 595, 430, 1), (3.0, 615, 450, 0)], {"sub_at": 1.25})),
]
GAP = 0.06


def tts():
    from kokoro_onnx import Kokoro
    from sintesi_p2 import trim
    k = Kokoro(f"{MODELS}/kokoro-v1.0.onnx", f"{MODELS}/voices-v1.0.bin")
    out = []
    for text, _ in LINES:
        y, sr = k.create(text, voice="am_michael", speed=1.12, lang="en-us")
        y = trim(np.asarray(y, np.float32), sr, pad_end=0.04)
        g = np.gcd(SR, sr); out.append(signal.resample_poly(y, SR // g, sr // g).astype(np.float32))
    return out


# ------------------------------------------------------------------ drawing helpers
P = OV.P
def T(c, s, x, y, size, col='#f1f1f1', key='corpo_m', a=1.0, align='left'):
    return OV.txt(c, s, x, y, key, size, col, a, align, 0, shadow=0)


def canvas(h, w):
    rgba = np.zeros((h, w, 4), np.uint8); rgba[..., :3] = 15; rgba[..., 3] = 255
    return rgba, skia.Surface(rgba).getCanvas()


def put(rgb, im, x, y, w, h, radius=0):
    im = cv2.resize(im, (int(w), int(h)), interpolation=cv2.INTER_AREA)
    x, y = int(x), int(y); HH, WW = rgb.shape[:2]
    x0, y0 = max(0, x), max(0, y); x1, y1 = min(WW, x + im.shape[1]), min(HH, y + im.shape[0])
    if x1 <= x0 or y1 <= y0: return
    sub = im[y0 - y:y1 - y, x0 - x:x1 - x]
    mask = np.full(sub.shape[:2], 255, np.uint8)
    if radius:
        mask[:] = 0; hh, ww = mask.shape
        cv2.rectangle(mask, (radius, 0), (ww - radius, hh), 255, -1); cv2.rectangle(mask, (0, radius), (ww, hh - radius), 255, -1)
        for cx, cy in [(radius, radius), (ww - radius, radius), (radius, hh - radius), (ww - radius, hh - radius)]: cv2.circle(mask, (cx, cy), radius, 255, -1)
    m = mask[..., None] / 255.0; rgb[y0:y1, x0:x1, :3] = (sub * m + rgb[y0:y1, x0:x1, :3] * (1 - m)).astype(np.uint8)


def circle_img(rgb, im, cx, cy, r):
    sz = int(2 * r); im = cv2.resize(im, (sz, sz), interpolation=cv2.INTER_AREA); mask = np.zeros((sz, sz), np.uint8)
    cv2.circle(mask, (sz // 2, sz // 2), sz // 2 - 1, 255, -1, cv2.LINE_AA)
    x0, y0 = int(cx - r), int(cy - r); m = mask[..., None] / 255.0
    rgb[y0:y0 + sz, x0:x0 + sz, :3] = (im * m + rgb[y0:y0 + sz, x0:x0 + sz, :3] * (1 - m)).astype(np.uint8)


def like_icon(c, x, y, s, col='#f1f1f1', filled=False):
    p = skia.Path(); p.moveTo(x, y + s * 0.45); p.lineTo(x + s * 0.28, y + s * 0.45); p.lineTo(x + s * 0.28, y + s); p.lineTo(x, y + s); p.close()
    q = skia.Path(); q.moveTo(x + s * 0.34, y + s * 0.45); q.lineTo(x + s * 0.55, y); q.quadTo(x + s * 0.72, y + s * 0.05, x + s * 0.65, y + s * 0.38); q.lineTo(x + s, y + s * 0.38); q.lineTo(x + s * 0.92, y + s); q.lineTo(x + s * 0.34, y + s); q.close()
    pt = P(col) if filled else P(col, 1, stroke=s * 0.08)
    c.drawPath(p, pt); c.drawPath(q, pt)


# ------------------------------------------------------------------ the desktop screen (1920x1080, YouTube dark mode)
SW, SH = 1920, 1080


def topbar(c):
    c.drawRect(skia.Rect(0, 0, SW, 74), P('#0f0f0f'))
    for k in range(3): c.drawRect(skia.Rect(36, 26 + k * 10, 64, 29 + k * 10), P('#f1f1f1'))
    c.drawRoundRect(skia.Rect(96, 22, 136, 50), 8, 8, P('#ff0033'))
    tri = skia.Path(); tri.moveTo(111, 29); tri.lineTo(124, 36); tri.lineTo(111, 43); tri.close(); c.drawPath(tri, P('#ffffff'))
    T(c, "YouTube", 142, 47, 27, '#ffffff', 'corpo_b')
    c.drawRoundRect(skia.Rect(640, 16, 1220, 58), 21, 21, P('#121212')); c.drawRoundRect(skia.Rect(640, 16, 1220, 58), 21, 21, P('#303030', 1, stroke=1.5))
    T(c, "Search", 664, 45, 22, '#888888', 'corpo')
    c.drawCircle(1860, 37, 18, P('#7a4bd6'))


def screen_channel(sub_t=None):
    rgba, c = canvas(SH, SW)
    topbar(c)
    circle_img(rgba, AVATAR, 300, 300, 150)
    T(c, CHANNEL, 490, 262, 74, '#ffffff', 'corpo_b')
    T(c, HANDLE, 492, 318, 28, '#f1f1f1', 'corpo_m')
    T(c, "More about this channel ", 492, 364, 26, '#aaaaaa', 'corpo'); T(c, "...more", 492 + OV.text_width("More about this channel ", 'corpo', 26), 364, 26, '#f1f1f1', 'corpo_b')
    subbed = sub_t is not None and sub_t > 0.1
    c.drawRoundRect(skia.Rect(490, 400, 740 if subbed else 700, 460), 30, 30, P('#272727' if subbed else '#f1f1f1'))
    T(c, "Subscribed" if subbed else "Subscribe", 615 if subbed else 595, 440, 26, '#f1f1f1' if subbed else '#0f0f0f', 'corpo_b', align='center')
    for k, lab in enumerate(["Home", "Videos", "Shorts", "Posts"]):
        T(c, lab, 160 + k * 150, 560, 26, '#f1f1f1' if k == 1 else '#aaaaaa', 'corpo_m')
    c.drawRect(skia.Rect(305, 578, 395, 582), P('#f1f1f1')); c.drawRect(skia.Rect(150, 584, 1780, 585), P('#3a3a3a'))
    for k, lab in enumerate(["Latest", "Popular", "Oldest"]):
        x0 = 160 + k * 140; c.drawRoundRect(skia.Rect(x0, 610, x0 + 124, 656), 10, 10, P('#f1f1f1' if k == 0 else '#272727'))
        T(c, lab, x0 + 62, 641, 22, '#0f0f0f' if k == 0 else '#f1f1f1', 'corpo_m', align='center')
    for k, (t, th, d) in enumerate(THUMBS):
        x0, y0 = 160 + k * 410, 690
        put(rgba, th, x0, y0, 390, 219, radius=14)
        c.drawRoundRect(skia.Rect(x0 + 330, y0 + 186, x0 + 382, y0 + 212), 6, 6, P('#000000', 0.8)); T(c, d, x0 + 356, y0 + 206, 18, '#ffffff', 'corpo_b', align='center')
        lines, cur = [], ""
        for w_ in t.split():
            if OV.text_width((cur + " " + w_).strip(), 'corpo_b', 22) > 380: lines.append(cur); cur = w_
            else: cur = (cur + " " + w_).strip()
        lines.append(cur)
        for i, ln in enumerate(lines[:2]): T(c, ln, x0, y0 + 254 + i * 30, 22, '#f1f1f1', 'corpo_b')
    return rgba[..., :3].copy()


def screen_comments(frame, scroll, like_t=None, liked=False, hl=False):
    """watch page scrolled down to the comments; the video keeps playing in the player at the top"""
    rgba, c = canvas(SH + 1400, SW)
    put(rgba, frame, 90, 94, 1240, 698, radius=16)
    c.drawRect(skia.Rect(90, 786, 1330, 790), P('#717171')); c.drawRect(skia.Rect(90, 786, 520, 790), P('#ff0033'))
    T(c, "I Let AI Build a Civilization From Zero (Part 2): They Answered", 90, 846, 32, '#f1f1f1', 'corpo_b')
    circle_img(rgba, AVATAR, 120, 910, 30); T(c, CHANNEL, 166, 920, 26, '#f1f1f1', 'corpo_b')
    c.drawRoundRect(skia.Rect(370, 886, 520, 934), 24, 24, P('#f1f1f1')); T(c, "Subscribe", 445, 918, 21, '#0f0f0f', 'corpo_b', align='center')
    c.drawRoundRect(skia.Rect(1030, 886, 1170, 934), 24, 24, P('#272727')); like_icon(c, 1052, 897, 26)
    c.drawRoundRect(skia.Rect(1186, 886, 1330, 934), 24, 24, P('#272727')); T(c, "Share", 1258, 918, 21, '#f1f1f1', 'corpo_m', align='center')
    c.drawRoundRect(skia.Rect(90, 960, 1330, 1090), 14, 14, P('#272727'))
    T(c, "20 AIs. Zero knowledge. The most liked comment goes into the next video.", 114, 1004, 22, '#f1f1f1', 'corpo_m')
    T(c, "#AI #simulation #civilization", 114, 1044, 22, '#3ea6ff', 'corpo_m')
    T(c, "Comments", 90, 1160, 34, '#f1f1f1', 'corpo_b')
    c.drawCircle(120, 1232, 26, P('#7a4bd6')); T(c, "Add a comment...", 170, 1240, 22, '#aaaaaa', 'corpo'); c.drawRect(skia.Rect(170, 1252, 1330, 1253), P('#717171'))
    y = 1320
    for i, (u, txt, colr) in enumerate(COMMENTS):
        big = i == 0 and hl
        if big: c.drawRoundRect(skia.Rect(80, y - 34, 1340, y + 112), 14, 14, P('#3a3618'))
        c.drawCircle(120, y + 6, 26, P(colr)); T(c, u[1].upper(), 120, y + 16, 26, '#ffffff', 'corpo_b', align='center')
        T(c, u, 170, y - 6, 20, '#f1f1f1', 'corpo_b')
        T(c, txt, 170, y + 32 + (6 if big else 0), 34 if big else 24, '#f1f1f1', 'corpo')
        lk = i == 0 and (liked or (like_t is not None and like_t > 0.05))
        ly = y + 58 + (8 if big else 0)
        like_icon(c, 170, ly, 24, '#3ea6ff' if lk else '#aaaaaa', filled=lk)
        T(c, "Reply", 240, ly + 20, 19, '#aaaaaa', 'corpo_b')
        y += 150
    for k, (t, th, d) in enumerate(THUMBS):             # right column: up next
        y0 = 94 + k * 150
        put(rgba, th, 1380, y0, 240, 135, radius=10)
        T(c, t[:24] + ('…' if len(t) > 24 else ''), 1636, y0 + 30, 20, '#f1f1f1', 'corpo_b'); T(c, CHANNEL, 1636, y0 + 62, 18, '#aaaaaa', 'corpo')
    o = rgba[int(scroll):int(scroll) + SH].copy()
    topbar(skia.Surface(o).getCanvas())
    return o[..., :3].copy()


# ------------------------------------------------------------------ the handheld camera on the monitor
BZ = 34
ROOM = None


def room():
    """blurred background: bright window up top, a wall, a light desk at the bottom"""
    yy = np.linspace(0, 1, H)[:, None, None]
    r = (np.array([206, 210, 214]) * (1 - yy) + np.array([120, 116, 110]) * yy) * np.ones((1, W, 1))
    r[:520] = (226, 230, 236)
    for x in range(-40, W, 260): r[:520, max(0, x):x + 22] = (150, 150, 152)
    r[1480:] = np.array([214, 211, 205]) * (1 - 0.25 * np.linspace(0, 1, H - 1480))[:, None, None]
    r = cv2.GaussianBlur(r.astype(np.float32), (0, 0), 28)
    return np.clip(r, 0, 255).astype(np.uint8)


def monitor_img(screen):
    m = np.full((SH + 2 * BZ, SW + 2 * BZ, 3), 10, np.uint8)
    m[BZ:BZ + SH, BZ:BZ + SW] = screen
    cv2.rectangle(m, (0, 0), (m.shape[1] - 1, m.shape[0] - 1), (44, 44, 46), 3)
    return m


def interp(keys, t):
    if t <= keys[0][0]: return np.array(keys[0][1:], float)
    for a, b in zip(keys, keys[1:]):
        if t <= b[0]:
            u = 0.5 - 0.5 * math.cos(math.pi * (t - a[0]) / max(1e-6, b[0] - a[0]))
            return np.array(a[1:], float) * (1 - u) + np.array(b[1:], float) * u
    return np.array(keys[-1][1:], float)


def shake(t, seed, amp=1.0):
    f = lambda w, p: math.sin(t * w + p + seed)
    return amp * (6 * f(1.7, 0) + 3 * f(4.3, 1)), amp * (5 * f(1.3, 2) + 3 * f(3.7, 3)), amp * (0.5 * f(1.1, 4) + 0.25 * f(2.9, 5))


def camera(focus, t, seed):
    cx, cy, fw = focus
    s = W * 1.02 / fw
    oc = np.array([540.0, 820.0]); dx, dy, rot = shake(t, seed)
    src = [(0, 0), (SW + 2 * BZ, 0), (SW + 2 * BZ, SH + 2 * BZ), (0, SH + 2 * BZ)]
    pts = []
    for (x, y) in src:
        p = np.array([x - BZ - cx, y - BZ - cy]) * s
        p[0] *= 1 + 0.06 * (p[1] / 1000.0)                     # keystone: the phone looks slightly down at the screen
        a = math.radians(-2.0 + rot); p = np.array([p[0] * math.cos(a) - p[1] * math.sin(a), p[0] * math.sin(a) + p[1] * math.cos(a)])
        pts.append(p + oc + (dx, dy))
    return cv2.getPerspectiveTransform(np.float32(src), np.float32(pts)), np.float32(pts)


def to_out(Mx, x, y):
    v = Mx @ np.array([x + BZ, y + BZ, 1.0]); return v[:2] / v[2]


def finger(c, tip, press, alpha=1.0):
    """a pointing index finger coming in from the bottom right (slightly out of focus, like a phone shot)"""
    x, y = tip; k = 1 - 0.05 * press
    c.drawCircle(x + 22 + 30 * (1 - press), y + 30 + 30 * (1 - press), 44 * k, P('#000000', 0.38 * alpha, blur=24 - 12 * press))
    c.save(); c.translate(x, y); c.rotate(-26); c.scale(k, k)
    lay = skia.Paint(); lay.setImageFilter(skia.ImageFilters.Blur(5, 5))
    c.saveLayer(None, lay)                                                              # hand: further from the lens, blurrier
    c.drawRoundRect(skia.Rect(-140, 360, 230, 980), 160, 160, P('#b98067', alpha))
    c.drawRoundRect(skia.Rect(10, 300, 210, 420), 60, 60, P('#c99076', alpha))
    c.drawRoundRect(skia.Rect(30, 390, 230, 520), 60, 60, P('#c18970', alpha))
    c.drawArc(skia.Rect(10, 330, 210, 420), 20, 120, False, P('#7d4b37', 0.5 * alpha, stroke=6))
    c.restore()
    lay2 = skia.Paint(); lay2.setImageFilter(skia.ImageFilters.Blur(1.4, 1.4)); c.saveLayer(None, lay2)
    sh = skia.GradientShader.MakeLinear([skia.Point(-44, 0), skia.Point(44, 0)], [OV.col('#8e5a44', alpha), OV.col('#d4a088', alpha), OV.col('#e8bba2', alpha), OV.col('#d29d84', alpha), OV.col('#93604a', alpha)], [0, 0.35, 0.52, 0.72, 1])
    pb = skia.Paint(AntiAlias=True); pb.setShader(sh)
    fp = skia.Path(); fp.moveTo(-40, 50); fp.quadTo(-40, 0, 0, 0); fp.quadTo(40, 0, 40, 50); fp.lineTo(50, 560); fp.lineTo(-48, 560); fp.close()
    c.drawPath(fp, pb)
    for yy, w in ((175, 34), (205, 30), (330, 38)):
        c.drawArc(skia.Rect(-w, yy - 6, w, yy + 6), 200, 140, False, P('#7a4a36', 0.45 * alpha, stroke=2))
    nail = skia.Path(); nail.moveTo(-27, 60); nail.quadTo(-29, 10, 0, 9); nail.quadTo(29, 10, 27, 60); nail.quadTo(0, 70, -27, 60); nail.close()
    c.drawPath(nail, P('#e9c3b4', alpha)); c.drawPath(nail, P('#b8877a', 0.55 * alpha, stroke=1.8))
    c.drawRoundRect(skia.Rect(-18, 16, -4, 46), 7, 7, P('#ffffff', 0.3 * alpha))
    c.restore()
    c.restore()


GLARE = None


def shot_monitor(screen, focus, t, seed, fing=None):
    global ROOM, GLARE
    if ROOM is None:
        ROOM = room()
        g = np.linspace(0, 1, W)[None, :] * 0.5 + np.linspace(0, 1, H)[:, None] * 0.5
        GLARE = (np.clip(1 - np.abs(g - 0.35) * 3.0, 0, 1) * 22).astype(np.float32)
    mon = monitor_img(screen)
    Mx, pts = camera(focus, t, seed)
    out = ROOM.copy()
    bc = (pts[2] + pts[3]) / 2; nb = np.linalg.norm(pts[2] - pts[3]) / (SW + 2 * BZ)
    cv2.rectangle(out, (int(bc[0] - 70 * nb), int(bc[1])), (int(bc[0] + 70 * nb), int(bc[1] + 340 * nb)), (40, 40, 42), -1)
    cv2.ellipse(out, (int(bc[0]), int(bc[1] + 340 * nb)), (int(300 * nb), int(36 * nb)), 0, 0, 360, (36, 36, 38), -1)
    warped = cv2.warpPerspective(mon, Mx, (W, H), flags=cv2.INTER_LINEAR)
    m = cv2.warpPerspective(np.full(mon.shape[:2], 255, np.uint8), Mx, (W, H))[..., None] / 255.0
    scr = warped.astype(np.float32) * 0.9 + np.array([22, 24, 30], np.float32)   # photographed screen: lifted blacks, a bit cool
    out = scr * m + out * (1 - m) + (m[..., 0] * GLARE)[..., None]
    out = cv2.GaussianBlur(np.clip(out, 0, 255).astype(np.float32), (0, 0), 0.9)
    rgba = np.dstack([out.astype(np.uint8), np.full((H, W), 255, np.uint8)])
    if fing is not None:
        fx, fy, press = fing
        finger(skia.Surface(rgba).getCanvas(), to_out(Mx, fx, fy), press)
    return rgba


def shot_film(frame, lt, seed):
    s = 1.0 + 0.05 * lt / 3.0; dx, dy, rot = shake(lt, seed, 0.6)
    h0 = 800 / s; w0 = h0 * 9 / 16; cx, cy = 960 + dx, 540 + dy      # inside the 2.39:1 picture band (138..942)
    M_ = cv2.getRotationMatrix2D((cx, cy), rot * 0.6, 1.0)
    M_[0, 2] -= cx - w0 / 2; M_[1, 2] -= cy - h0 / 2; M_ *= W / w0
    out = cv2.warpAffine(frame, M_, (W, H), flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_REFLECT)
    out = cv2.addWeighted(out, 1.5, cv2.GaussianBlur(out, (0, 0), 2.5), -0.5, 0)   # light unsharp after the upscale
    return np.dstack([out, np.full((H, W), 255, np.uint8)])


def caption(c, word, age):
    """one word at a time, white with a soft dark shadow, a bit below the middle (creator-video style)"""
    size, key = 92, 'corpo_b'; w = OV.text_width(word, key, size); x, y = W / 2 - w / 2, 1270
    pop = 1 + 0.10 * max(0, 1 - age / 0.09); f = OV.font(key, size)
    c.save(); c.translate(W / 2, y - 30); c.scale(pop, pop); c.translate(-W / 2, -(y - 30))
    c.drawString(word, x + 3, y + 5, f, P('#000000', 0.55, blur=8))
    c.drawString(word, x, y, f, P('#000000', 0.6, stroke=5))
    c.drawString(word, x, y, f, P('#ffffff'))
    c.restore()


def clip_frames(src, t0, n, speed=1.0):
    p = subprocess.Popen(['ffmpeg', '-v', 'error', '-ss', f'{t0:.3f}', '-t', f'{n * speed / FPS + 0.3:.3f}', '-i', SRC[src], '-vf', f'setpts=PTS/{speed},fps=30', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], stdout=subprocess.PIPE)
    last = np.zeros((1080, 1920, 3), np.uint8)
    for _ in range(n):
        b = p.stdout.read(1920 * 1080 * 3)
        if len(b) == 1920 * 1080 * 3: last = np.frombuffer(b, np.uint8).reshape(1080, 1920, 3)
        yield last
    p.stdout.close(); p.wait()


def bed(total):
    T_ = M.Track(total + 1)
    prog = [(45, 52, 57, 60), (41, 48, 53, 57), (48, 55, 60, 64), (43, 50, 55, 59)]
    t, i = 0.0, 0
    while t < total:
        for m in prog[i % 4]: T_.add(t, mono=M.epiano(m + 12, 1.8, 0.3), gain=0.09)
        for b in (0, 0.75, 1.0, 1.5): T_.add(t + b, mono=M.kick(0.4), gain=0.3 if b in (0, 1.0) else 0.16)
        T_.add(t + 0.5, mono=M.snare(0.3), gain=0.12); T_.add(t + 1.5, mono=M.snare(0.3), gain=0.12)
        for h in range(8): T_.add(t + h * 0.25, mono=M.hat(0.08), gain=0.16)
        t += 2.0; i += 1
    L, R = M.apply_reverb(T_.L.astype(np.float64), T_.R.astype(np.float64), wet=0.15)
    n = int(total * SR); mus = np.stack([L[:n], R[:n]], 1)
    return mus / (np.abs(mus).max() + 1e-9)


def main():
    only = os.environ.get("ONLY")                                # e.g. ONLY=6 renders a single still of line 6 for checking
    voices = tts() if not only else [np.zeros(int(2.5 * SR), np.float32)] * len(LINES)
    starts, t = [], 0.15
    for v in voices:
        starts.append(t); t += len(v) / SR + GAP
    total = t + 0.6
    if only:
        li = int(only); text, shot = LINES[li]; lt = float(os.environ.get("AT", "1.0"))
        fr = next(clip_frames(shot[1], shot[2] + lt, 1)) if shot[0] == "film" else next(clip_frames("p2", 300.0, 1))
        rgba = render(shot, lt, li, fr, fr)
        caption(skia.Surface(rgba).getCanvas(), text.split()[0].strip(",."), 1.0)
        cv2.imwrite(os.path.join(S, f"promo3_l{li}.jpg"), cv2.cvtColor(rgba[..., :3], cv2.COLOR_RGB2BGR)); return
    N = int(total * SR); voice = np.zeros(N)
    for s0, v in zip(starts, voices):
        i = int(s0 * SR); seg = v[:max(0, N - i)]; voice[i:i + len(seg)] += seg
    act = (np.abs(voice) > 0.01).astype(np.float64)
    duck = 1 - 0.55 * (signal.fftconvolve(act, np.ones(int(0.25 * SR)) / int(0.25 * SR), 'same') > 0.05)
    duck = signal.fftconvolve(duck, np.ones(int(0.12 * SR)) / int(0.12 * SR), 'same')
    mix = bed(total) * (0.30 * duck)[:, None] + voice[:, None]
    mix = mix / (np.abs(mix).max() + 1e-9) * 0.9
    wav = os.path.join(S, "promo3_audio.wav"); sf.write(wav, mix.astype(np.float32), SR)
    enc = subprocess.Popen(['ffmpeg', '-y', '-v', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{W}x{H}', '-r', str(FPS), '-i', '-', '-i', wav,
                            '-map', '0:v', '-map', '1:a', '-af', 'loudnorm=I=-14:TP=-1.5:LRA=9', '-c:v', 'libx264', '-preset', 'slow', '-crf', '21', '-tune', 'grain', '-pix_fmt', 'yuv420p',
                            '-c:a', 'aac', '-b:a', '256k', '-ar', '48000', '-movflags', '+faststart', '-shortest', OUTF], stdin=subprocess.PIPE)
    rng = np.random.default_rng(3)
    cf = clip_frames("p2", 300.0, int(round(total * FPS)) + 5)   # what plays in the player on the watch page
    for li, (text, shot) in enumerate(LINES):
        l0 = 0.0 if li == 0 else starts[li]; l1 = starts[li + 1] if li + 1 < len(LINES) else total
        fa, fb = int(round(l0 * FPS)), int(round(l1 * FPS))
        words = text.split(); ldur = len(voices[li]) / SR
        wts = [len(re.sub(r"\W", "", w)) + 1.5 for w in words]; tot = sum(wts); acc = 0; t_words = []
        for w_ in wts: t_words.append(starts[li] + ldur * acc / tot); acc += w_
        frames = clip_frames(shot[1], shot[2], fb - fa, *shot[3:]) if shot[0] == "film" else None
        for fr in range(fa, fb):
            tt = fr / FPS; lt = tt - l0
            player = next(cf); film = next(frames) if frames is not None else None
            rgba = render(shot, lt, li, film, player)
            if fr - fa < 3:                                              # punch-in on every cut
                k = 1.06 - 0.02 * (fr - fa)
                rgba[..., :3] = cv2.warpAffine(rgba[..., :3], cv2.getRotationMatrix2D((540, 960), 0, k), (W, H), borderMode=cv2.BORDER_REFLECT)
            rgba[..., :3] = np.clip(rgba[..., :3].astype(np.int16) + rng.integers(-4, 5, (H, W, 1), dtype=np.int16), 0, 255).astype(np.uint8)
            cur = [i for i, ws in enumerate(t_words) if tt >= ws]
            if cur and tt < starts[li] + ldur + 0.25:
                i = cur[-1]; caption(skia.Surface(rgba).getCanvas(), words[i].strip(",."), tt - t_words[i])
            enc.stdin.write(rgba[..., :3].tobytes())
        if frames is not None:
            for _ in frames: pass
    for _ in cf: pass
    enc.stdin.close(); enc.wait()
    print(OUTF, round(total, 2), "s", flush=True)


CH_PLAIN = None


def render(shot, lt, li, film, player):
    global CH_PLAIN
    seed = li * 1.7
    if shot[0] == "film":
        return shot_film(film, lt, seed)
    _, scr, fk, gk, ex = shot
    if scr == "channel":
        if CH_PLAIN is None: CH_PLAIN = screen_channel()
        st = (lt - ex["sub_at"]) if "sub_at" in ex else None
        screen = CH_PLAIN if st is None or st < 0.1 else screen_channel(st)
    else:
        sc = ex["scroll"]
        if isinstance(sc, tuple):
            u = OV.clamp((lt - sc[0]) / (sc[1] - sc[0])); sc = sc[2] + (sc[3] - sc[2]) * (0.5 - 0.5 * math.cos(math.pi * u))
        lt_ = (lt - ex["like_at"]) if "like_at" in ex else None
        screen = screen_comments(player, sc, like_t=lt_, liked=ex.get("liked", False), hl=ex.get("hl", False))
    fing = None
    if gk:
        a = OV.clamp((lt - (gk[0][0] - 0.3)) / 0.3)
        if a > 0:
            fx, fy, pr = interp(gk, lt); ent = 1 - OV.eo(a)              # slides in from the bottom right
            fing = (fx + 700 * ent, fy + 900 * ent, pr)
    return shot_monitor(screen, interp(fk, lt), lt, seed, fing)


if __name__ == "__main__":
    main()
