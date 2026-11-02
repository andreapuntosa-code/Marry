# -*- coding: utf-8 -*-
"""
"30 DAYS TO GET RICH" EP1 -- the whole Short in one pass (1080x1920, 30 fps): timeline from the voice takes, the 2D
backgrounds (basement, kitchen, bookstore, phone, night, comment poll), Kevin and Mom, a camera that punches in,
the HUD (days left, bank, Mom's patience), stickers, popups, one giant word at a time, then music + sfx + mix.

  python3 rich.py --preview 3.0 12.0 ...    (frames -> scratchpad/rich_prev_*.jpg)
  python3 rich.py                            -> ../30_days_to_get_rich_ep1.mp4
"""
import os, sys, json, math, re, subprocess, argparse
import numpy as np
import skia, cv2
import soundfile as sf
from scipy import signal

HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HERE)
import script_rich as SC
import kevin as KV
from kevin import fill, stroke, shape, oval, rrect, col, OUT
import overlays as OV

S_DIR = os.environ.get("SCRATCH", "/tmp/claude-0/-home-user-Marry/e61fd834-a8c5-5cc5-8204-6c637a41951f/scratchpad")
VOICE = os.path.join(S_DIR, "voice_rich")
W, H, FPS, SR = 1080, 1920, 30, 48000
OUTF = os.path.join(os.path.dirname(HERE), "30_days_to_get_rich_ep1.mp4")
LEAD, TAIL = 0.2, 0.0


def clamp(x, a=0.0, b=1.0): return max(a, min(b, x))
def eob(u):
    u = clamp(u); c1, c3 = 1.70158, 2.70158
    return 1 + c3 * (u - 1) ** 3 + c1 * (u - 1) ** 2
def eio(u): u = clamp(u); return u * u * (3 - 2 * u)


# ------------------------------------------------------------------ voices, timeline, word times
def load_voice(sid):
    y, sr = sf.read(os.path.join(VOICE, sid + ".wav"), dtype="float32")
    return y if y.ndim == 1 else y.mean(1), sr


def word_times(seg):
    y, sr = load_voice(seg["id"]); dur = len(y) / sr
    toks = re.findall(r"\S+", seg["tts"])
    cl = [c.strip() for c in re.findall(r"[^,.?!]+[,.?!]*", seg["tts"]) if re.search(r"\w", c)]
    win = int(0.02 * sr); env = np.sqrt(np.convolve(y ** 2, np.ones(win) / win, mode="same"))
    q = env < 10 ** (-30 / 20) * env.max(); d = np.diff(np.concatenate([[0], q.astype(np.int8), [0]]))
    st, en = np.where(d == 1)[0], np.where(d == -1)[0]
    gaps = sorted(sorted([(a / sr, b / sr) for a, b in zip(st, en) if (b - a) / sr >= 0.07 and a > 0.1 * sr and b < len(y) - 0.1 * sr], key=lambda g: g[0] - g[1])[:max(0, len(cl) - 1)])
    out = []
    if len(gaps) == len(cl) - 1:
        bounds, t = [], 0.0
        for a, b in gaps: bounds.append((t, a)); t = b
        bounds.append((t, dur))
        for txt, (a, b) in zip(cl, bounds):
            ws = re.findall(r"\S+", txt); wts = [len(re.sub(r"\W", "", w)) + 1.0 for w in ws]; tot = sum(wts); acc = 0
            for w, k in zip(ws, wts): out.append((w, a + (b - a) * acc / tot)); acc += k
    if len(out) != len(toks):
        out = []; wts = [len(re.sub(r"\W", "", w)) + 1.0 for w in toks]; tot = sum(wts); acc = 0
        for w, k in zip(toks, wts): out.append((w, dur * acc / tot)); acc += k
    return out


def timeline():
    dur = json.load(open(os.path.join(VOICE, "durations.json")))
    t = LEAD; segs = []
    for s in SC.SEGMENTS:
        d = dur[s["id"]]["dur"]
        s2 = dict(s); s2.update(start=t, dur=d, end=t + d); s2["words"] = word_times(s2)
        segs.append(s2); t += d + s["pause"]
    for i, s in enumerate(segs): s["until"] = segs[i + 1]["start"] if i + 1 < len(segs) else t + TAIL
    return segs, t + TAIL


# ------------------------------------------------------------------ fonts and text
def font(size, key='poppins'): return OV.font(key, size)
def tw(s, size, key='poppins'): return OV.text_width(s, key, size)


def text(c, s, x, y, size, fillc='#ffffff', a=1.0, sw=None, strokec=OUT, align='center', key='poppins', shadow=True):
    w = tw(s, size, key); x0 = x - w / 2 if align == 'center' else (x if align == 'left' else x - w)
    f = font(size, key)
    if shadow: c.drawString(s, x0 + size * 0.04, y + size * 0.07, f, fill('#000000', 0.35 * a))
    if sw != 0: c.drawString(s, x0, y, f, stroke(strokec, sw or size * 0.16, a))
    c.drawString(s, x0, y, f, fill(fillc, a))
    return w


def sticker(c, s, x, y, colr, rot, a=1.0, k=1.0, size=52):
    w = tw(s, size) + 56; h = size * 1.55
    c.save(); c.translate(x, y); c.rotate(rot); c.scale(k, k)
    c.drawRoundRect(skia.Rect(-w / 2 + 8, -h / 2 + 10, w / 2 + 8, h / 2 + 10), 10, 10, fill('#000000', 0.3 * a))
    c.drawRoundRect(skia.Rect(-w / 2, -h / 2, w / 2, h / 2), 10, 10, fill(colr, a))
    c.drawRoundRect(skia.Rect(-w / 2, -h / 2, w / 2, h / 2), 10, 10, stroke(OUT, 5, a))
    text(c, s, 0, size * 0.36, size, '#1d1530', a, sw=0, shadow=False)
    c.restore()


# ------------------------------------------------------------------ backgrounds (world coordinates)
def bg_basement(c, t, night=False):
    k = 0.55 if night else 1.0
    g = skia.Paint(AntiAlias=True); g.setShader(skia.GradientShader.MakeLinear([skia.Point(0, 0), skia.Point(0, 1500)], [col('#4a3290' if not night else '#251a52'), col('#2f2063' if not night else '#160f35')]))
    c.drawRect(skia.Rect(-400, -400, W + 400, 1560), g)
    c.drawRect(skia.Rect(-400, 1180, W + 400, 1190), fill('#ff5fb0', 0.9 * k)); c.drawRect(skia.Rect(-400, 1196, W + 400, 1204), fill('#5be1ff', 0.9 * k))
    c.drawRect(skia.Rect(-400, 1560, W + 400, H + 400), fill('#2a1f4d' if not night else '#140e2c'))
    c.drawOval(skia.Rect(140, 1620, 940, 1820), fill('#5b3fa0' if not night else '#2e2158'))
    # window with the moon
    c.drawRoundRect(skia.Rect(40, 420, 340, 700), 10, 10, fill('#151a3f')); c.drawRoundRect(skia.Rect(40, 420, 340, 700), 10, 10, stroke(OUT, 8))
    c.drawLine(190, 420, 190, 700, stroke(OUT, 8)); c.drawCircle(270, 500, 40, fill('#fff3a8'))
    for x, y in [(90, 470), (120, 620), (230, 650), (300, 600)]: c.drawCircle(x, y, 4, fill('#ffffff', 0.5 + 0.5 * math.sin(t * 3 + x)))
    # poster and desk with a red falling chart
    c.save(); c.rotate(-4, 860, 860); c.drawRect(skia.Rect(760, 760, 980, 960), fill('#ffd60a')); c.drawRect(skia.Rect(760, 760, 980, 960), stroke(OUT, 6))
    text(c, "HUSTLE", 870, 850, 46, '#1d1530', sw=0, shadow=False); text(c, "24/7", 870, 930, 60, '#e8413b', sw=0, shadow=False); c.restore()
    c.drawRect(skia.Rect(700, 1300, 1120, 1340), fill('#8a5a34')); c.drawRect(skia.Rect(700, 1300, 1120, 1340), stroke(OUT, 6))
    for x in (730, 1080): c.drawRect(skia.Rect(x, 1340, x + 26, 1560), fill('#6b4428'))
    c.drawRoundRect(skia.Rect(760, 1080, 1060, 1280), 14, 14, fill('#22223a')); c.drawRoundRect(skia.Rect(780, 1100, 1040, 1260), 8, 8, fill('#0f1830' if night else '#16264a'))
    pts = [(790, 1130), (840, 1150), (880, 1140), (930, 1190), (970, 1180), (1030, 1245)]
    p = skia.Path(); p.moveTo(*pts[0]); [p.lineTo(*q) for q in pts[1:]]; c.drawPath(p, stroke('#ff4d4d', 8))
    c.drawRect(skia.Rect(890, 1280, 930, 1300), fill('#22223a'))
    # energy drink pyramid
    for r, n in enumerate([3, 2, 1]):
        for i in range(n):
            x = 30 + i * 62 + r * 31; y = 1500 - r * 92
            c.drawRoundRect(skia.Rect(x, y - 90, x + 52, y), 10, 10, fill('#3ad46a')); c.drawRoundRect(skia.Rect(x, y - 90, x + 52, y), 10, 10, stroke(OUT, 4))
            c.drawRect(skia.Rect(x + 6, y - 60, x + 46, y - 40), fill('#1d1530'))
    # piggy bank on the desk
    c.drawOval(skia.Rect(800, 1220, 900, 1300), fill('#ff8fb5')); c.drawOval(skia.Rect(800, 1220, 900, 1300), stroke(OUT, 5))
    if night:
        c.drawCircle(910, 1180, 260, fill('#5be1ff', 0.08))


def bg_kitchen(c, t):
    c.drawRect(skia.Rect(-400, -400, W + 400, 1560), fill('#f6e3b4'))
    for y in range(-400, 1560, 90): c.drawLine(-400, y, W + 400, y, stroke('#e2c98f', 3))
    for x in range(-400, W + 400, 90): c.drawLine(x, 1000, x, 1560, stroke('#e2c98f', 3))
    c.drawRect(skia.Rect(-400, 380, W + 400, 640), fill('#c98a4a')); c.drawRect(skia.Rect(-400, 380, W + 400, 640), stroke(OUT, 7))
    for x in range(-300, W + 400, 220): c.drawLine(x, 380, x, 640, stroke(OUT, 6)); c.drawCircle(x + 190, 600, 9, fill(OUT))
    c.drawRect(skia.Rect(-400, 1360, W + 400, 1560), fill('#c98a4a')); c.drawRect(skia.Rect(-400, 1330, W + 400, 1370), fill('#e8e2d0')); c.drawRect(skia.Rect(-400, 1330, W + 400, 1370), stroke(OUT, 6))
    c.drawRect(skia.Rect(-400, 1560, W + 400, H + 400), fill('#d9b98a'))
    # fridge with mom's note
    c.drawRoundRect(skia.Rect(800, 700, 1100, 1560), 24, 24, fill('#f2f4f8')); c.drawRoundRect(skia.Rect(800, 700, 1100, 1560), 24, 24, stroke(OUT, 8))
    c.drawLine(800, 1040, 1100, 1040, stroke(OUT, 6)); c.drawRect(skia.Rect(830, 900, 846, 1010), fill('#b0b6c2'))
    c.save(); c.rotate(5, 950, 820); c.drawRect(skia.Rect(870, 760, 1040, 900), fill('#fffbe0')); c.drawRect(skia.Rect(870, 760, 1040, 900), stroke(OUT, 4))
    text(c, "GET A JOB", 955, 815, 30, '#e8413b', sw=0, shadow=False); text(c, "♥ MOM", 955, 870, 34, '#1d1530', sw=0, shadow=False); c.restore()
    c.drawCircle(950, 760, 12, fill('#e8413b'))


def bg_store(c, t):
    c.drawRect(skia.Rect(-400, -400, W + 400, 1560), fill('#e9eef5'))
    cols = ['#ff3b30', '#ff9500', '#ffd60a', '#34c759', '#0a84ff', '#af52de', '#ff6fb5']
    for r in range(4):
        y = 420 + r * 260
        c.drawRect(skia.Rect(-400, y + 200, W + 400, y + 230), fill('#8a5a34')); c.drawRect(skia.Rect(-400, y + 200, W + 400, y + 230), stroke(OUT, 5))
        x = -300; i = r * 3
        while x < W + 300:
            w = 46 + (i * 17) % 30; h = 150 + (i * 23) % 45
            c.drawRect(skia.Rect(x, y + 200 - h, x + w, y + 200), fill(cols[i % len(cols)])); c.drawRect(skia.Rect(x, y + 200 - h, x + w, y + 200), stroke(OUT, 4))
            x += w + 4; i += 1
    c.drawRect(skia.Rect(-400, 1560, W + 400, H + 400), fill('#cfd6e0'))
    c.drawRoundRect(skia.Rect(330, 300, 750, 400), 18, 18, fill('#0a84ff')); c.drawRoundRect(skia.Rect(330, 300, 750, 400), 18, 18, stroke(OUT, 6)); text(c, "BOOKS", 540, 375, 66, '#ffffff', sw=0, shadow=False)


def bg_phone(c, t, mode, u):
    c.drawRect(skia.Rect(-400, -400, W + 400, H + 400), fill('#3a2a7a'))
    for k in range(14): c.drawCircle((k * 211) % W, (k * 397) % H, 60, fill('#ffffff', 0.04))
    x0, y0, x1, y1 = 150, 380, 930, 1820
    c.drawRoundRect(skia.Rect(x0 + 14, y0 + 20, x1 + 14, y1 + 20), 70, 70, fill('#000000', 0.35))
    c.drawRoundRect(skia.Rect(x0, y0, x1, y1), 70, 70, fill('#1d1530')); c.drawRoundRect(skia.Rect(x0 + 22, y0 + 22, x1 - 22, y1 - 22), 52, 52, fill('#ffffff'))
    c.drawRoundRect(skia.Rect(470, y0 + 38, 610, y0 + 70), 16, 16, fill('#1d1530'))
    text(c, "MarketPlace", 540, y0 + 160, 54, '#1d1530', sw=0, shadow=False)
    c.drawLine(x0 + 40, y0 + 200, x1 - 40, y0 + 200, stroke('#dddddd', 4))
    if mode == 'listing':
        # the gaming chair
        cx, cy = 540, 860
        c.drawRoundRect(skia.Rect(x0 + 60, y0 + 240, x1 - 60, y0 + 760), 30, 30, fill('#f1f0fa'))
        sp = rrect(cx - 120, cy - 260, cx + 120, cy + 60, 60); shape(c, sp, '#e8413b')
        c.drawRoundRect(skia.Rect(cx - 70, cy - 220, cx + 70, cy + 20), 40, 40, fill('#1d1530'))
        st = rrect(cx - 170, cy + 40, cx + 170, cy + 110, 30); shape(c, st, '#e8413b')
        c.drawRect(skia.Rect(cx - 12, cy + 110, cx + 12, cy + 210), fill(OUT))
        for dx in (-110, -40, 40, 110): c.drawCircle(cx + dx, cy + 220, 20, fill(OUT))
        text(c, "Gaming chair (legendary)", 540, y0 + 860, 46, '#1d1530', sw=0, shadow=False, key='corpo_b')
        k = eob(u / 0.35)
        c.save(); c.translate(540, y0 + 990); c.scale(k, k); text(c, "$1,000", 0, 0, 120, '#34c759', sw=0, shadow=False); c.restore()
        text(c, "0 views  •  0 likes", 540, y0 + 1090, 40, '#9a9aa8', sw=0, shadow=False, key='corpo_b')
        c.drawRoundRect(skia.Rect(x0 + 80, y0 + 1160, x1 - 80, y0 + 1290), 40, 40, fill('#0a84ff')); text(c, "LIST IT", 540, y0 + 1250, 64, '#ffffff', sw=0, shadow=False)
    else:
        text(c, "Messages", 540, y0 + 270, 44, '#9a9aa8', sw=0, shadow=False, key='corpo_b')
        c.drawCircle(x0 + 110, y0 + 400, 46, fill('#ff9500')); text(c, "D", x0 + 110, y0 + 420, 54, '#ffffff', sw=0, shadow=False)
        a = clamp(u / 0.3)
        c.drawRoundRect(skia.Rect(x0 + 180, y0 + 330, x1 - 70, y0 + 560), 40, 40, fill('#eceaf3', a))
        text(c, "Dave_42", x0 + 220, y0 + 395, 36, '#7a7a88', a, sw=0, shadow=False, align='left', key='corpo_b')
        text(c, "can u do", x0 + 220, y0 + 465, 54, '#1d1530', a, sw=0, shadow=False, align='left', key='corpo_b')
        text(c, "1 sandwich?", x0 + 220, y0 + 530, 54, '#1d1530', a, sw=0, shadow=False, align='left', key='corpo_b')
        if u > 1.2:   # sandwich picture
            k = eob((u - 1.2) / 0.35); cx, cy = 540, y0 + 860
            c.save(); c.translate(cx, cy); c.scale(k * 2.2, k * 2.2)
            b = rrect(-90, -50, 90, 6, 34); shape(c, b, '#f3c26b'); c.drawRect(skia.Rect(-96, 2, 96, 22), fill('#6cc04a')); c.drawRect(skia.Rect(-92, 20, 92, 36), fill('#e8413b'))
            c.drawRect(skia.Rect(-90, 34, 90, 46), fill('#ffd60a')); b2 = rrect(-90, 44, 90, 90, 28); shape(c, b2, '#f3c26b'); c.restore()


def bg_poll(c, t, segs, n18):
    c.drawRect(skia.Rect(-400, -400, W / 2, H + 400), fill('#2f6bff')); c.drawRect(skia.Rect(W / 2, -400, W + 400, H + 400), fill('#28b85a'))
    for k in range(18): c.drawLine(-400 + k * 120, -400, -400 + k * 120 + 600, H + 400, stroke('#ffffff', 30, 0.05))


# ------------------------------------------------------------------ popups (screen space)
def popup(c, kind, u, t, talk=0.0):
    a = clamp(u / 0.12); k = eob(u / 0.35)
    if kind in ('mom', 'mom_talk'):
        c.save(); c.translate(540, 820); c.rotate(-4 + math.sin(t * 2) * 1.5); c.scale(k, k)
        c.drawRect(skia.Rect(-300, -360, 300, 390), fill('#000000', 0.3)); c.drawRect(skia.Rect(-310, -380, 310, 380), fill('#ffffff')); c.drawRect(skia.Rect(-310, -380, 310, 380), stroke(OUT, 6))
        c.drawRect(skia.Rect(-270, -340, 270, 250), fill('#ffd1e3'))
        c.save(); c.clipRect(skia.Rect(-270, -340, 270, 250)); KV.draw_mom(c, 0, -60, 1.0, talk, t); c.restore()
        text(c, "MOM", 0, 340, 64, '#e8413b', sw=0, shadow=False)
        c.restore()
    elif kind == 'coupon':
        c.save(); c.translate(560, 760); c.rotate(-7); c.scale(k, k)
        c.drawRoundRect(skia.Rect(-300, -150, 300, 150), 24, 24, fill('#ffd60a')); c.drawRoundRect(skia.Rect(-300, -150, 300, 150), 24, 24, stroke(OUT, 6))
        c.drawLine(-120, -150, -120, 150, stroke(OUT, 4)); c.drawCircle(-300, 0, 30, fill('#4a3290')); c.drawCircle(300, 0, 30, fill('#4a3290'))
        p = skia.Path(); p.moveTo(-250, -90); p.lineTo(-150, -90); p.lineTo(-200, 90); p.close(); shape(c, p, '#ff9500'); c.drawCircle(-200, -30, 12, fill('#e8413b')); c.drawCircle(-185, 10, 10, fill('#e8413b'))
        text(c, "1/2 PIZZA", 90, -10, 64, '#1d1530', sw=0, shadow=False); text(c, "COUPON", 90, 70, 54, '#e8413b', sw=0, shadow=False)
        c.restore()
    elif kind == 'expired':
        popup(c, 'coupon', 9, t)
        kk = eob(u / 0.25)
        c.save(); c.translate(560, 760); c.rotate(-18); c.scale(1.6 - 0.6 * kk, 1.6 - 0.6 * kk)
        c.drawRoundRect(skia.Rect(-280, -70, 280, 70), 12, 12, stroke('#e8413b', 14, kk)); text(c, "EXPIRED", 0, 34, 96, '#e8413b', kk, sw=0, shadow=False); c.restore()
    elif kind in ('gauge_up', 'gauge_down'):
        c.save(); c.translate(540, 900); c.scale(k, k)
        for i, cc in enumerate(['#ff3b30', '#ffd60a', '#34c759']):
            c.drawArc(skia.Rect(-280, -280, 280, 280), 180 + i * 60, 60, False, stroke(cc, 60))
        c.drawArc(skia.Rect(-310, -310, 310, 310), 180, 180, False, stroke(OUT, 6)); c.drawArc(skia.Rect(-250, -250, 250, 250), 180, 180, False, stroke(OUT, 6))
        if kind == 'gauge_up': ang = 180 + 175 * eio(u / 0.9) + 3 * math.sin(t * 20)
        else: ang = 180 + 175 * (1 - eio((u - 0.3) / 0.8)) + 2 * math.sin(t * 20)
        r = math.radians(ang); c.drawLine(0, 0, math.cos(r) * 230, math.sin(r) * 230, stroke(OUT, 14)); c.drawCircle(0, 0, 26, fill(OUT))
        text(c, "CONFIDENCE" if kind == 'gauge_up' else "BANK ACCOUNT", 0, 110, 66, '#ffffff', sw=12)
        c.restore()
    elif kind == 'book':
        c.save(); c.translate(560, 780); c.rotate(5); c.scale(k, k)
        c.drawRoundRect(skia.Rect(-210, -280, 210, 280), 16, 16, fill('#ffd60a')); c.drawRoundRect(skia.Rect(-210, -280, 210, 280), 16, 16, stroke(OUT, 7))
        c.drawRect(skia.Rect(-210, -280, -170, 280), fill('#e0b800'))
        for i, ln in enumerate(["HOW TO", "BE A", "MILLION-", "AIRE"]): text(c, ln, 15, -150 + i * 80, 62, '#1d1530', sw=0, shadow=False)
        c.drawCircle(15, 200, 46, fill('#34c759')); text(c, "$", 15, 222, 60, '#ffffff', sw=0, shadow=False)
        c.restore(); sticker(c, "$24.99", 830, 1000, '#ffffff', 10, a, k)
    elif kind == 'declined':
        c.save(); c.translate(540, 900); c.scale(k, k)
        c.drawRoundRect(skia.Rect(-200, -260, 200, 260), 30, 30, fill('#2b2b3a')); c.drawRoundRect(skia.Rect(-200, -260, 200, 260), 30, 30, stroke(OUT, 7))
        c.drawRoundRect(skia.Rect(-160, -220, 160, -60), 14, 14, fill('#e8413b')); text(c, "ERROR", 0, -115, 62, '#ffffff', sw=0, shadow=False)
        for r in range(3):
            for q in range(3): c.drawRoundRect(skia.Rect(-140 + q * 100, -20 + r * 80, -60 + q * 100, 40 + r * 80), 10, 10, fill('#4a4a5e'))
        c.restore()
        kk = eob((u - 0.15) / 0.25)
        c.save(); c.translate(540, 560); c.rotate(-8); c.scale(1.8 - 0.8 * kk, 1.8 - 0.8 * kk)
        c.drawRoundRect(skia.Rect(-330, -90, 330, 90), 14, 14, fill('#ffffff', kk)); c.drawRoundRect(skia.Rect(-330, -90, 330, 90), 14, 14, stroke('#e8413b', 12, kk))
        text(c, "DECLINED", 0, 40, 110, '#e8413b', kk, sw=0, shadow=False); c.restore()


# ------------------------------------------------------------------ HUD, title, captions, poll
def hud(c, days, bank, mom, ep=1):
    c.drawRoundRect(skia.Rect(16, 150, W - 16, 320), 26, 26, fill('#120c26', 0.92)); c.drawRoundRect(skia.Rect(16, 150, W - 16, 320), 26, 26, stroke('#2e2358', 4))
    text(c, "DAYS LEFT", 108, 200, 28, '#ffffff', sw=0, shadow=False, key='corpo_b')
    text(c, str(days), 108, 290, 80, '#ffd60a', sw=0, shadow=False)
    c.drawLine(206, 172, 206, 300, stroke('#2e2358', 4))
    text(c, f"BANK  ${bank:,.2f}", 236, 205, 30, '#ffffff', sw=0, shadow=False, align='left', key='corpo_b'); text(c, "GOAL $1,000,000", W - 40, 205, 26, '#9a90c0', sw=0, shadow=False, align='right', key='corpo_b')
    c.drawRoundRect(skia.Rect(236, 220, W - 40, 236), 8, 8, fill('#2e2358')); c.drawRoundRect(skia.Rect(236, 220, 236 + max(10, (W - 276) * bank / 1e6), 236), 8, 8, fill('#34c759'))
    text(c, f"MOM'S PATIENCE ♥ {int(round(mom))}%", 236, 280, 30, '#ffffff', sw=0, shadow=False, align='left', key='corpo_b')
    c.drawRoundRect(skia.Rect(236, 294, W - 40, 310), 8, 8, fill('#2e2358')); c.drawRoundRect(skia.Rect(236, 294, 236 + (W - 276) * mom / 100, 310), 8, 8, fill('#ff5fb0'))
    c.save(); c.rotate(4, W - 90, 375); c.drawRoundRect(skia.Rect(W - 150, 345, W - 30, 405), 12, 12, fill('#e8413b')); text(c, f"EP {ep}", W - 90, 393, 44, '#ffffff', sw=0, shadow=False); c.restore()


def title(c, u, a=1.0):
    k1, k2 = eob(u / 0.35), eob((u - 0.15) / 0.35)
    c.save(); c.translate(540, 560); c.scale(k1, k1); c.rotate(-3); text(c, "30 DAYS", 0, 0, 150, '#ffd60a', a, sw=22); c.restore()
    c.save(); c.translate(540, 680); c.scale(k2, k2); c.rotate(-3); text(c, "TO GET RICH", 0, 0, 104, '#ffffff', a, sw=18); c.restore()


def caption(c, word, age, y=1470):
    size = 140; w = tw(word, size)
    if w > W - 80: size *= (W - 80) / w
    k = 1 + 0.12 * max(0, 1 - age / 0.1)
    c.save(); c.translate(540, y - size * 0.35); c.scale(k, k); c.translate(-540, -(y - size * 0.35))
    text(c, word, 540, y, size, '#ffffff', sw=size * 0.18, strokec='#000000'); c.restore()


def poll(c, t, u, insane_u=None):
    text(c, "COMMENT ONE WORD", 540, 470, 66, '#ffffff', sw=12)
    for x, lab in ((270, "LEMONADE"), (810, "CRYPTO")): text(c, lab, x, 610, 96 if lab == "CRYPTO" else 86, '#ffffff', sw=14)
    c.drawCircle(540, 1000, 80, fill('#ffffff')); c.drawCircle(540, 1000, 80, stroke(OUT, 7)); text(c, "VS", 540, 1028, 76, '#1d1530', sw=0, shadow=False)
    sticker(c, "MOST LIKED WINS", 540, 780, '#ffffff', -3, 1.0, eob((u - 0.6) / 0.3), 48)
    # props: a lemonade stand cup and a crypto chart
    c.save(); c.translate(270, 1030)
    cup = skia.Path(); cup.moveTo(-60, -90); cup.lineTo(60, -90); cup.lineTo(44, 90); cup.lineTo(-44, 90); cup.close(); shape(c, cup, '#fff27a')
    c.drawLine(20, -90, 50, -170, stroke(OUT, 10)); c.drawCircle(40, -100, 26, fill('#ffd60a')); c.restore()
    c.save(); c.translate(810, 1030)
    c.drawRoundRect(skia.Rect(-110, -100, 110, 100), 16, 16, fill('#1d1530')); pts = [(-90, 60), (-50, 20), (-10, 40), (30, -30), (70, -60), (90, -80)]
    p = skia.Path(); p.moveTo(*pts[0]); [p.lineTo(*q) for q in pts[1:]]; c.drawPath(p, stroke('#34c759', 10)); c.restore()
    for x, e in ((270, 'excited'), (810, 'greedy')):
        KV.draw_kevin(c, x, 1760, 0.56, e, 'cheer' if x < 540 else 'point', t + x)
    if insane_u is not None and insane_u > 0:
        kk = eob(insane_u / 0.3)
        c.save(); c.translate(540, 1170); c.rotate(-6); c.scale(kk, kk)
        c.drawRoundRect(skia.Rect(-390, -80, 390, 80), 16, 16, fill('#ffffff')); c.drawRoundRect(skia.Rect(-390, -80, 390, 80), 16, 16, stroke('#e8413b', 10))
        text(c, "DAY 30 IS INSANE", 0, 34, 84, '#e8413b', sw=0, shadow=False); c.restore()


def confetti(c, u, seed=3):
    rg = np.random.default_rng(seed); cols = ['#ff3b30', '#ffd60a', '#34c759', '#0a84ff', '#ff5fb0', '#ffffff']
    for i in range(90):
        x0, vx, vy, r0 = rg.uniform(0, W), rg.uniform(-140, 140), rg.uniform(500, 900), rg.uniform(0, 6)
        x, y = x0 + vx * u, 300 + vy * u - 200 + 300 * u * u
        c.save(); c.translate(x, y); c.rotate(math.degrees(r0 + u * 6)); c.drawRect(skia.Rect(-12, -6, 12, 6), fill(cols[i % 6])); c.restore()


# ------------------------------------------------------------------ the frame
SMALL_POP = ("mom", "mom_talk", "coupon", "gauge_up", "gauge_down", "book", "declined", "expired")   # Kevin shrinks to a corner


class Film:
    def __init__(self):
        self.segs, self.total = timeline()
        self.env = {}
        for s in self.segs:
            if s["voice"] in ("kevin", "mom"):
                y, sr = load_voice(s["id"]); win = int(sr / 30)
                e = np.sqrt(np.convolve(y ** 2, np.ones(win) / win, mode="same")); self.env[s["id"]] = (e / (e.max() + 1e-9), sr)
        # persistent state along the film: scene, expression, pose, zoom, hud
        st = {"scene": "basement", "expr": "happy", "pose": "idle", "zoom": 1.0, "days": 30, "bank": 3.47, "mom": 55}
        for s in self.segs:
            cue = s["cue"]
            for k in ("scene", "expr", "pose", "zoom"):
                if k in cue: st[k] = cue[k]
            if "hud" in cue: st.update(cue["hud"])
            s["state"] = dict(st)

    def seg_at(self, t):
        for s in self.segs:
            if t < s["until"]: return s
        return self.segs[-1]

    def talk(self, s, t):
        if s["id"] not in self.env or not (s["start"] <= t < s["end"]): return 0.0
        e, sr = self.env[s["id"]]; i = int((t - s["start"]) * sr)
        return float(np.clip(e[min(len(e) - 1, max(0, i))] * 1.4, 0, 1))

    def frame(self, t):
        arr = np.zeros((H, W, 4), np.uint8); arr[..., 3] = 255
        c = skia.Surface(arr).getCanvas()
        s = self.seg_at(t); st = s["state"]; cue = s["cue"]; u = t - s["start"]
        i = self.segs.index(s); prev = self.segs[i - 1]["state"] if i > 0 else st
        scene = st["scene"]
        # camera: eased zoom towards this line's framing, a little sway, shake on impacts
        z0, z1 = prev["zoom"], st["zoom"]; z = z0 + (z1 - z0) * eio(u / 0.35)
        z *= 1 + 0.015 * math.sin(t * 1.3)
        fy = 1180 - (z - 1.0) * 300
        sh = (math.sin(t * 61) * 12 * max(0, 1 - u / 0.6)) if cue.get("shake") else 0.0
        talker = s["voice"] == "kevin"; talk = self.talk(s, t) if talker else 0.0
        blink = 1.0 if (t % 3.3) < 0.12 else 0.0
        c.save()
        if scene in ("phone",):
            bg_phone(c, t, cue.get("popup", "listing"), u)
        elif scene == "poll":
            bg_poll(c, t, self.segs, None)
        else:
            c.translate(540 + sh, 1060); c.scale(z, z); c.translate(-540, -fy)
            {"basement": lambda: bg_basement(c, t), "night": lambda: bg_basement(c, t, True), "kitchen": lambda: bg_kitchen(c, t), "store": lambda: bg_store(c, t)}[scene]()
            look = (0.4 * math.sin(t * 0.7), 0.0) if not talker else (0, 0.2)
            small = s["cue"].get("popup") in SMALL_POP
            if not small:
                KV.draw_kevin(c, 540, 1780, 1.08, st["expr"], st["pose"], t, talk, look, blink)
        c.restore()
        if scene not in ("phone", "poll"):
            if s["cue"].get("popup") in SMALL_POP:
                KV.draw_kevin(c, 880, 1860, 0.42, st["expr"], st["pose"], t, 0, (-0.6, 0), blink)
        # popups
        pk = cue.get("popup")
        if pk and scene != "phone":
            popup(c, pk, u, t, self.talk(s, t) if s["voice"] == "mom" else 0.0)
        if scene == "poll":
            first_poll = next(x for x in self.segs if x["state"]["scene"] == "poll")
            ins = next((x for x in self.segs if x["cue"].get("insane")), None)
            poll(c, t, t - first_poll["start"], (t - ins["start"]) if ins and t >= ins["start"] else None)
        if cue.get("confetti"): confetti(c, u)
        # stickers of this line (pop on their word)
        for (txt, wi, x, y, colr, rot) in cue.get("stickers", []):
            w_t = s["words"][min(wi, len(s["words"]) - 1)][1]
            if u >= w_t: sticker(c, txt, x, y, colr, rot, 1.0, eob((u - w_t) / 0.3))
        if cue.get("title"): title(c, u)
        # HUD (animated values)
        k = eio(u / 0.8)
        hud(c, st["days"], prev["bank"] + (st["bank"] - prev["bank"]) * k, prev["mom"] + (st["mom"] - prev["mom"]) * k)
        # one giant word at a time
        if s["start"] <= t < s["end"] + 0.15:
            cur = max([j for j, (_, wt) in enumerate(s["words"]) if u >= wt - 0.02] or [0])
            wd = re.sub(r"[^\w$'.,!?/-]", "", s["words"][cur][0]).strip(",.!?").upper()
            if wd: caption(c, wd, u - s["words"][cur][1], {"poll": 1560, "phone": 1790}.get(scene, 1500))
        # scene-change whip
        if i > 0 and scene != prev["scene"] and u < 0.12:
            a2 = arr[..., :3].copy(); kx = int(60 * (1 - u / 0.12)) * 2 + 1
            arr[..., :3] = cv2.blur(a2, (kx, 1))
        return arr[..., :3]


# ------------------------------------------------------------------ audio
def build_audio(film):
    import music as M, sfx as FX
    total = film.total; N = int(total * SR); T = M.Track(total + 3); X = M.Track(total + 3)
    B = 60 / 100; prog = [(0, 4, 7), (-3, 0, 4), (5, 9, 12), (7, 11, 14)]; root = 57
    t, i = 0.0, 0
    poll_t = next(x["start"] for x in film.segs if x["state"]["scene"] == "poll")
    while t < total:
        ch = prog[(i // 8) % 4]; beat = i % 4
        T.add(t, mono=M.pluck(root - 24 + ch[0], 0.25, 0.7, 700), gain=0.24)
        if i % 2 == 0 and beat in (0, 2): T.add(t, mono=M.kick(0.8), gain=0.3)
        if i % 4 == 2: T.add(t, mono=M.snare(0.5), gain=0.12)
        T.add(t + B / 4, mono=M.hat(0.2), gain=0.06)
        if i % 2 == 0: T.add(t, mono=M.pluck(root + ch[(i // 2) % 3] + (12 if i % 8 >= 4 else 0), 0.25, 0.4, 3200), gain=0.07, pan=0.2)
        t += B / 2; i += 1
    add = lambda t, y, g: X.add(t, mono=y, gain=g)
    tt = lambda d: np.arange(int(d * SR)) / SR
    def pop(f0=700, f1=1500, d=0.08):
        q = tt(d); f = f0 + (f1 - f0) * (q / d) ** 0.6; return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-q / 0.03) * 0.8
    def ching():
        q = tt(0.9); return sum(np.sin(2 * np.pi * f * q) * np.exp(-q / dd) for f, dd in [(2093, 0.4), (2637, 0.3), (3136, 0.25)]) * 0.3
    def buzz():
        q = tt(0.6); return np.sign(np.sin(2 * np.pi * 120 * q)) * 0.25 * np.exp(-np.maximum(0, q - 0.45) / 0.05)
    def scratch():
        q = tt(0.35); f = 900 * (1 - q / 0.35) + 200; return np.sin(2 * np.pi * np.cumsum(f) / SR) * (np.random.default_rng(1).random(len(q)) - 0.5) * 1.2 * np.exp(-q / 0.2)
    prev_scene = None
    for s in film.segs:
        st = s["state"]; cue = s["cue"]
        if st["scene"] != prev_scene and prev_scene is not None: add(s["start"] - 0.1, FX.whoosh(0.4, 1.0, True), 0.5)
        prev_scene = st["scene"]
        for (_, wi, *_r) in cue.get("stickers", []): add(s["start"] + s["words"][min(wi, len(s["words"]) - 1)][1], pop(), 0.35)
        pk = cue.get("popup")
        if pk in ("coupon", "mom", "book", "listing", "offer", "gauge_up"): add(s["start"], pop(500, 1200, 0.1), 0.45)
        if pk == "gauge_up": add(s["start"] + 0.3, FX.whoosh(0.6, 0.8, True), 0.4)
        if pk == "gauge_down": add(s["start"] + 0.3, FX.whoosh(0.8, 0.8, False), 0.45)
        if pk == "declined": add(s["start"] + 0.1, buzz(), 0.6)
        if pk == "expired": add(s["start"] + 0.05, FX.boom_low(0.5), 0.4); add(s["start"], scratch(), 0.4)
        if cue.get("confetti") or s["id"] == "k02": add(s["start"], ching(), 0.5)
        if cue.get("insane"): add(s["start"], FX.boom_low(0.7), 0.5)
    voice = np.zeros(N, np.float32)
    for s in film.segs:
        y, sr = load_voice(s["id"]); g = np.gcd(SR, sr); y = signal.resample_poly(y, SR // g, sr // g).astype(np.float32)
        y = y / (np.abs(y).max() + 1e-9) * (0.85 if s["voice"] == "narr" else 0.8)
        a = int(s["start"] * SR); m = min(len(y), N - a); voice[a:a + m] += y[:m]
    Lm, Rm = M.apply_reverb(T.L.astype(np.float64), T.R.astype(np.float64), wet=0.1)
    mus = np.stack([Lm[:N], Rm[:N]], 1); mus /= np.abs(mus).max() + 1e-9
    sfx = np.stack([X.L[:N], X.R[:N]], 1); sfx /= np.abs(sfx).max() + 1e-9
    act = (np.abs(voice) > 0.01).astype(np.float32); kk = int(0.3 * SR)
    env = signal.fftconvolve(act, np.ones(kk) / kk, "same"); env = signal.fftconvolve((env > 0.03).astype(np.float32), np.ones(int(0.2 * SR)) / int(0.2 * SR), "same")
    mix = mus * (0.4 * (1 - 0.45 * env))[:, None] + sfx * 0.55 + voice[:, None]
    mix *= np.clip((total - np.arange(N) / SR) / 0.4, 0, 1)[:, None]; mix = mix / (np.abs(mix).max() + 1e-9) * 0.9
    out = os.path.join(S_DIR, "rich_mix.wav"); sf.write(out, mix.astype(np.float32), SR, subtype="FLOAT"); return out


def main():
    ap = argparse.ArgumentParser(); ap.add_argument("--preview", nargs="*", type=float); a = ap.parse_args()
    film = Film()
    if a.preview is not None:
        ims = [cv2.cvtColor(film.frame(t), cv2.COLOR_RGB2BGR) for t in a.preview]
        ims = [cv2.resize(x, (360, 640)) for x in ims]
        while len(ims) % 6: ims.append(np.zeros_like(ims[0]))
        cv2.imwrite(os.path.join(S_DIR, "rich_prev.jpg"), np.vstack([np.hstack(ims[k:k + 6]) for k in range(0, len(ims), 6)]))
        print("total", round(film.total, 2)); return
    wav = build_audio(film)
    enc = subprocess.Popen(['ffmpeg', '-y', '-v', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{W}x{H}', '-r', str(FPS), '-i', '-', '-i', wav,
                            '-map', '0:v', '-map', '1:a', '-af', 'loudnorm=I=-14:TP=-1.5:LRA=9', '-c:v', 'libx264', '-preset', 'slow', '-crf', '18', '-pix_fmt', 'yuv420p',
                            '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-movflags', '+faststart', '-shortest', OUTF], stdin=subprocess.PIPE)
    n = int(round(film.total * FPS))
    for f in range(n):
        enc.stdin.write(np.ascontiguousarray(film.frame(f / FPS)).tobytes())
    enc.stdin.close(); enc.wait(); print(OUTF, round(film.total, 2), "s")


if __name__ == "__main__":
    main()
