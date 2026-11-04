# -*- coding: utf-8 -*-
"""
"What if your IQ kept going up?" -- the whole Short in one pass (1080x1920, 30 fps), hand-drawn doodle style:
notebook paper, "boiling" marker lines (re-jittered 8 times a second), strokes that draw themselves on, Bob the doodle
guy whose head and brain grow with every level, an IQ counter that rolls up, marker captions with a highlighter swipe.

  python3 iq.py --preview 3.0 12.0 ...   (frames -> scratchpad/iq_prev.jpg)
  python3 iq.py                           -> ../what_if_your_iq_kept_going_up.mp4
"""
import os, sys, json, math, re, subprocess, argparse
import numpy as np
import skia, cv2
import soundfile as sf
from scipy import signal

HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HERE)
import script_iq as SC

S_DIR = os.environ.get("SCRATCH", "/tmp/claude-0/-home-user-Marry/e61fd834-a8c5-5cc5-8204-6c637a41951f/scratchpad")
VOICE = os.path.join(S_DIR, "voice_iq")
W, H, FPS, SR = 1080, 1920, 30, 48000
OUTF = os.path.join(os.path.dirname(HERE), "what_if_your_iq_kept_going_up.mp4")
LEAD = 0.15
INF = float("inf")
INK = '#25221e'; PAPER = '#fbf7ec'
TIERS = [100, 200, 1000, 10000, 1e6, 1e9, INF]
HEAD_R = [100, 112, 126, 142, 158, 176, 196]

FONTS = {k: skia.Typeface.MakeFromFile(os.path.join(HERE, "font", f)) for k, f in
         (("marker", "PermanentMarker-Regular.ttf"), ("hand", "PatrickHand-Regular.ttf"))}


def clamp(x, a=0.0, b=1.0): return max(a, min(b, x))
def eob(u):
    u = clamp(u); c1, c3 = 1.70158, 2.70158
    return 1 + c3 * (u - 1) ** 3 + c1 * (u - 1) ** 2
def eio(u): u = clamp(u); return u * u * (3 - 2 * u)


def col(h, a=1.0):
    h = h.lstrip('#'); r, g, b = int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16)
    return skia.Color(r, g, b, int(255 * clamp(a)))
def fill(h, a=1.0): return skia.Paint(Color=col(h, a), AntiAlias=True)
def pen(h=INK, w=8, a=1.0):
    return skia.Paint(Color=col(h, a), AntiAlias=True, Style=skia.Paint.kStroke_Style, StrokeWidth=w,
                      StrokeCap=skia.Paint.kRound_Cap, StrokeJoin=skia.Paint.kRound_Join)
def font(size, key='marker'): return skia.Font(FONTS[key], size)
def tw(s, size, key='marker'): return font(size, key).measureText(s)


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


def chunks(words):
    """group words into caption chunks (<= 3 words, <= 16 chars)"""
    out, cur = [], []
    for i, (w, t) in enumerate(words):
        if cur and (len(cur) >= 3 or len(" ".join(words[j][0] for j in cur + [i])) > 16 or re.search(r"[.,?!]$", words[cur[-1]][0])):
            out.append(cur); cur = []
        cur.append(i)
    if cur: out.append(cur)
    return out


def timeline():
    dur = json.load(open(os.path.join(VOICE, "durations.json")))
    t = LEAD; segs = []
    for s in SC.SEGMENTS:
        d = dur[s["id"]]["dur"]
        s2 = dict(s); s2.update(start=t, dur=d, end=t + d); s2["words"] = word_times(s2); s2["chunks"] = chunks(s2["words"])
        segs.append(s2); t += d + s["pause"]
    for i, s in enumerate(segs): s["until"] = segs[i + 1]["start"] if i + 1 < len(segs) else t
    return segs, t


# ------------------------------------------------------------------ the doodle pen
class Doodle:
    """Every primitive gets a time slot: it draws itself on (stroke trimmed by progress), lines boil 8x a second."""
    def __init__(self, c, t, u, seed, speed=1.5):
        self.c, self.t, self.u, self.seed, self.speed = c, t, u, seed, speed
        self.cur = 0.0; self.n = 0; self.boil = int(t * 8)

    def rng(self):
        self.n += 1
        return np.random.default_rng((self.seed * 7919 + self.n * 104729 + self.boil * 31337) % (2 ** 32))

    def slot(self, d):
        d /= self.speed; p = clamp((self.u - self.cur) / d); self.cur += d * 0.6; return p

    def wait(self, d): self.cur += d / self.speed

    def jit(self, pts, amt):
        rg = self.rng(); return [(x + rg.normal() * amt, y + rg.normal() * amt) for x, y in pts]

    def _draw(self, pts, colr, w, closed, d, fillc, amt, falpha=0.9):
        p = self.slot(d)
        if p <= 0: return 0.0
        pts = self.jit(pts, amt)
        path = skia.Path(); path.moveTo(*pts[0])
        for q in pts[1:]: path.lineTo(*q)
        if closed: path.close()
        if fillc and p > 0.5:
            fp = skia.Path(path); fp.offset(5, 6); self.c.drawPath(fp, fill(fillc, falpha * clamp((p - 0.5) / 0.4)))
        if w > 0:
            if p < 1:
                pm = skia.PathMeasure(path, False); dst = skia.Path(); pm.getSegment(0, pm.getLength() * p, dst, True); path = dst
            self.c.drawPath(path, pen(colr, w))
        return p

    def line(self, x0, y0, x1, y1, colr=INK, w=8, d=0.18, amt=1.6):
        n = max(4, int(math.hypot(x1 - x0, y1 - y0) / 30))
        return self._draw([(x0 + (x1 - x0) * k / n, y0 + (y1 - y0) * k / n) for k in range(n + 1)], colr, w, False, d, None, amt)

    def poly(self, pts, colr=INK, w=8, closed=False, fillc=None, d=0.25, amt=1.6, falpha=0.9):
        # resample long edges so they wobble too
        out = []
        P = pts + ([pts[0]] if closed else [])
        for (x0, y0), (x1, y1) in zip(P[:-1], P[1:]):
            n = max(1, int(math.hypot(x1 - x0, y1 - y0) / 34))
            out += [(x0 + (x1 - x0) * k / n, y0 + (y1 - y0) * k / n) for k in range(n)]
        out.append(P[-1])
        return self._draw(out, colr, w, False, d, fillc, amt, falpha)

    def ellipse(self, cx, cy, rx, ry, colr=INK, w=8, fillc=None, d=0.25, amt=1.6, rot=0.0, falpha=0.9, over=0.22):
        n = max(18, int((rx + ry) / 5)); a0 = self.rng().uniform(0, 6.28); cr, sr_ = math.cos(rot), math.sin(rot)
        pts = []
        for k in range(n + 1):
            a = a0 + (2 * math.pi + over) * k / n; x, y = math.cos(a) * rx, math.sin(a) * ry
            pts.append((cx + x * cr - y * sr_, cy + x * sr_ + y * cr))
        return self._draw(pts, colr, w, False, d, fillc, amt, falpha)

    def circle(self, cx, cy, r, **k): return self.ellipse(cx, cy, r, r, **k)

    def rect(self, x0, y0, x1, y1, **k): return self.poly([(x0, y0), (x1, y0), (x1, y1), (x0, y1)], closed=True, **k)

    def curve(self, fn, n=40, colr=INK, w=8, d=0.3, fillc=None, closed=False, amt=1.4):
        return self._draw([fn(k / n) for k in range(n + 1)], colr, w, closed, d, fillc, amt)

    def text(self, s, x, y, size, colr=INK, key='marker', align='center', d=None, rot=0.0, hl=None):
        """written left to right; optional highlighter swipe behind"""
        p = self.slot(d or 0.06 + 0.02 * len(s))
        if p <= 0: return 0.0
        wdt = tw(s, size, key); x0 = x - wdt / 2 if align == 'center' else (x if align == 'left' else x - wdt)
        rg = self.rng(); jx, jy = rg.normal() * 1.2, rg.normal() * 1.2
        c = self.c; c.save(); c.rotate(rot, x, y)
        if hl:
            hp = skia.Path(); hp.moveTo(x0 - 16, y - size * 0.62); hp.lineTo(x0 + (wdt + 32) * p - 16, y - size * 0.7)
            hp.lineTo(x0 + (wdt + 32) * p - 10, y + size * 0.12); hp.lineTo(x0 - 20, y + size * 0.18); hp.close()
            c.drawPath(hp, fill(hl, 0.75))
        c.clipRect(skia.Rect(x0 - 10, y - size * 1.2, x0 - 10 + (wdt + 20) * p, y + size * 0.6))
        c.drawString(s, x0 + jx, y + jy, font(size, key), fill(colr))
        c.restore(); return p

    def arrow(self, x0, y0, x1, y1, colr=INK, w=8, d=0.22, head=34):
        p = self.line(x0, y0, x1, y1, colr, w, d)
        if p >= 1:
            a = math.atan2(y1 - y0, x1 - x0)
            for s in (-1, 1): self.line(x1, y1, x1 - math.cos(a + s * 0.5) * head, y1 - math.sin(a + s * 0.5) * head, colr, w, 0.06)
        return p

    def check(self, x, y, s=1.0, colr='#2f9e44', w=12, d=0.15):
        return self.poly([(x - 30 * s, y), (x - 8 * s, y + 24 * s), (x + 34 * s, y - 30 * s)], colr, w, d=d)

    def cross(self, x, y, s=1.0, colr='#e03131', w=14, d=0.14):
        self.line(x - 40 * s, y - 40 * s, x + 40 * s, y + 40 * s, colr, w, d); self.line(x + 40 * s, y - 40 * s, x - 40 * s, y + 40 * s, colr, w, d)

    def bubble(self, x0, y0, x1, y1, tail, colr=INK, fillc='#ffffff', d=0.25):
        """speech bubble with a tail pointing at `tail`"""
        cx = (x0 + x1) / 2; bx = clamp(tail[0], x0 + 40, x1 - 40)
        tip_y = y1 if tail[1] > y1 else y0
        pts = [(x0, y0), (x1, y0), (x1, y1), (bx + 30, y1), tail, (bx - 20, y1), (x0, y1)] if tip_y == y1 else \
              [(x0, y0), (bx - 20, y0), tail, (bx + 30, y0), (x1, y0), (x1, y1), (x0, y1)]
        return self.poly(pts, colr, 7, closed=True, fillc=fillc, d=d, falpha=1.0)

    def cloud(self, cx, cy, rx, ry, tail=None, fillc='#ffffff', d=0.3):
        def f(u):
            a = u * 2 * math.pi; r = 1 + 0.12 * abs(math.sin(a * 5))
            return (cx + math.cos(a) * rx * r, cy + math.sin(a) * ry * r)
        p = self.curve(f, 60, INK, 7, d, fillc, True)
        if tail and p >= 1:
            for k, r in enumerate((22, 15, 10)):
                q = (k + 1) / 4; self.circle(cx + (tail[0] - cx) * (0.55 + 0.45 * q), cy + ry * 0.9 + (tail[1] - cy - ry * 0.9) * q, r, w=5, fillc='#ffffff', d=0.05)
        return p


# ------------------------------------------------------------------ paper, counter, Bob
_PAPER = None
def paper(c, t, cosmic=0.0):
    global _PAPER
    if _PAPER is None:
        rg = np.random.default_rng(5); n = rg.normal(0, 1, (H // 4, W // 4)); n = cv2.GaussianBlur(n, (0, 0), 1.2)
        a = np.zeros((H // 4, W // 4, 4), np.uint8); a[..., :3] = 120; a[..., 3] = np.clip(14 + n * 10, 0, 40).astype(np.uint8)
        _PAPER = skia.Image.fromarray(cv2.resize(a, (W, H)), colorType=skia.kRGBA_8888_ColorType)
    c.drawRect(skia.Rect(0, 0, W, H), fill(PAPER))
    for y in range(60, H, 56): c.drawLine(0, y, W, y, pen('#9ec5e8', 2.5, 0.8))
    c.drawLine(118, 0, 118, H, pen('#ef8a8a', 3, 0.9))
    for y in (300, 960, 1620): c.drawCircle(56, y, 22, fill('#e9e2d0')); c.drawCircle(56, y, 22, pen('#d6ccb4', 3))
    c.drawImage(_PAPER, 0, 0)
    if cosmic > 0:   # infinity: the page turns into night sky
        c.drawRect(skia.Rect(0, 0, W, H), fill('#14122a', 0.9 * cosmic))
        rg = np.random.default_rng(9)
        for k in range(120):
            x, y, r = rg.uniform(0, W), rg.uniform(0, H), rg.uniform(1.5, 4.5)
            c.drawCircle(x, y, r * (0.7 + 0.3 * math.sin(t * 3 + k)), fill('#fff6d0', cosmic))


def fmt_iq(v):
    if v == INF: return "inf"
    return f"{int(round(v)):,}"


def infinity(c, x, y, s, colr, w):
    p = skia.Path()
    for k in range(81):
        a = k / 80 * 2 * math.pi; d = 1 + math.sin(a) ** 2
        px, py = x + s * math.cos(a) / d, y + s * math.sin(a) * math.cos(a) / d
        (p.moveTo if k == 0 else p.lineTo)(px, py)
    c.drawPath(p, pen(colr, w))


def counter(c, t, value, bump, tier, cosmic):
    ink = INK if cosmic < 0.5 else '#fff6d0'
    rg = np.random.default_rng(int(t * 8))
    c.save(); c.translate(540, 250); c.scale(1 + 0.12 * bump, 1 + 0.12 * bump); c.rotate(-2 + rg.normal() * 0.3)
    # a box drawn in marker, highlighter fill
    c.drawRoundRect(skia.Rect(-420 + 6, -150 + 8, 420 + 6, 130 + 8), 30, 30, fill('#ffe066', 0.85))
    c.drawRoundRect(skia.Rect(-420, -150, 420, 130), 30, 30, pen(INK, 9))
    c.drawString("YOUR IQ", -tw("YOUR IQ", 50, 'hand') / 2, -90, font(50, 'hand'), fill(INK))
    if value == INF:
        infinity(c, 0, 30, 190, '#e03131', 28)
    else:
        s = fmt_iq(value); size = min(170, 170 * 760 / max(1, tw(s, 170)))
        c.drawString(s, -tw(s, size) / 2, 30 + size * 0.36, font(size), fill('#e03131' if tier >= 2 else INK))
    c.restore()
    # level dots
    for k in range(7):
        x = 540 - 3 * 64 + k * 64; done = k <= tier
        c.drawCircle(x, 420, 17, fill('#e03131' if done else '#ffffff')); c.drawCircle(x, 420, 17, pen(ink, 5))


def draw_bob(c, t, x, feet, tier, expr, grow, jump=0.0, galaxy=0.0, fan=0.0, steam=0.0):
    """the doodle guy: stick body, big round head, a pink brain that grows with the level"""
    rg = np.random.default_rng(int(t * 8) * 7 + 3); J = lambda a=1.6: rg.normal() * a
    y0 = feet - 28 * math.sin(clamp(jump) * math.pi)
    hr = HEAD_R[max(0, tier - 1)] + (HEAD_R[tier] - HEAD_R[max(0, tier - 1)]) * eob(grow) if tier > 0 else HEAD_R[0] + 30 * grow
    hip = (x, y0 - 150); neck = (x, y0 - 310); hc = (x, neck[1] - hr * 0.92)
    P = pen(INK, 9)
    for s in (-1, 1): c.drawLine(hip[0], hip[1], x + s * 46 + J(), y0 + J(), P)                   # legs
    for s in (-1, 1): c.drawLine(x + s * 46, y0, x + s * 76, y0 + 2, P)                             # feet
    c.drawLine(neck[0] + J(), neck[1], hip[0] + J(), hip[1], P)                                    # body
    sh = (x, neck[1] + 30); wave = math.sin(t * 6)
    arms = {
        'neutral': [(-90, 120), (90, 120)], 'happy': [(-110, -90 + 12 * wave), (110, -90 - 12 * wave)],
        'shocked': [(-120, -60), (120, -60)], 'smug': [(-70, 100), (100, -40)], 'bored': [(-50, 140), (50, 140)],
        'confused': [(-90, 120), (40, -hr * 0.9 - 40)], 'wink': [(-90, 110), (110, -70)], 'hot': [(-90, 110), (110 + 20 * math.sin(t * 20), -60)],
    }.get(expr, [(-90, 120), (90, 120)])
    for (dx, dy) in arms:
        ex, ey = sh[0] + dx * 0.55 + J(), sh[1] + (dy * 0.5 + 30)
        c.drawLine(sh[0], sh[1], ex, ey, P); c.drawLine(ex, ey, sh[0] + dx + J(), sh[1] + dy + J(), P)
    if expr == 'wink':   # thumbs up
        hx, hy = sh[0] + 110, sh[1] - 70; c.drawCircle(hx, hy, 18, fill('#ffffff')); c.drawCircle(hx, hy, 18, pen(INK, 6)); c.drawLine(hx, hy - 16, hx, hy - 44, pen(INK, 8))
    # head
    hp = skia.Path(); n = 44; a0 = rg.uniform(0, 6)
    for k in range(n + 1):
        a = a0 + (2 * math.pi + 0.2) * k / n; (hp.moveTo if k == 0 else hp.lineTo)(hc[0] + math.cos(a) * (hr + J(1.2)), hc[1] + math.sin(a) * (hr + J(1.2)))
    c.drawCircle(hc[0], hc[1], hr, fill('#fffaf0'))
    if galaxy > 0:
        c.save(); c.clipPath(skia.Path().addCircle(hc[0], hc[1], hr), doAntiAlias=True)
        c.drawCircle(hc[0], hc[1], hr, fill('#1d1a3a', galaxy))
        for k in range(4):
            a = t * 0.8 + k * 1.57
            sp = skia.Path(); sp.moveTo(hc[0], hc[1])
            for j in range(20): r = j / 20 * hr; sp.lineTo(hc[0] + math.cos(a + j * 0.25) * r, hc[1] + math.sin(a + j * 0.25) * r)
            c.drawPath(sp, pen(['#b197fc', '#74c0fc', '#ffd43b', '#f783ac'][k], 10, 0.8 * galaxy))
        r2 = np.random.default_rng(4)
        for k in range(40): c.drawCircle(hc[0] + r2.uniform(-hr, hr), hc[1] + r2.uniform(-hr, hr), r2.uniform(2, 5), fill('#ffffff', galaxy))
        c.restore()
    # brain: a pink squiggly blob in the top of the head, bigger each level
    if galaxy < 0.9:
        bk = 0.42 + 0.06 * tier
        bw, bh = hr * bk * 1.5, hr * bk; by = hc[1] - hr * 0.42
        c.save(); c.clipPath(skia.Path().addCircle(hc[0], hc[1], hr - 4), doAntiAlias=True)
        bp = skia.Path()
        for k in range(37):
            a = k / 36 * 2 * math.pi; r = 1 + 0.08 * math.sin(a * 7 + t)
            (bp.moveTo if k == 0 else bp.lineTo)(hc[0] + math.cos(a) * bw * r, by + math.sin(a) * bh * r)
        c.drawPath(bp, fill('#ffa8c5', 1 - galaxy)); c.drawPath(bp, pen('#d6336c', 5, 1 - galaxy))
        sq = skia.Path(); sq.moveTo(hc[0] - bw * 0.7, by)
        for k in range(1, 9): sq.lineTo(hc[0] - bw * 0.7 + bw * 1.4 * k / 8, by + (bh * 0.35 if k % 2 else -bh * 0.35))
        c.drawPath(sq, pen('#d6336c', 4, 1 - galaxy)); c.restore()
    c.drawPath(hp, pen(INK, 9))
    # face
    ey = hc[1] + hr * 0.2; ex = hr * 0.32; fc = INK if galaxy < 0.5 else '#ffffff'
    if expr == 'shocked':
        for s in (-1, 1): c.drawCircle(hc[0] + s * ex, ey, 17, fill('#ffffff')); c.drawCircle(hc[0] + s * ex, ey, 17, pen(fc, 5)); c.drawCircle(hc[0] + s * ex, ey, 7, fill(fc))
        c.drawOval(skia.Rect(hc[0] - 18, ey + hr * 0.3, hc[0] + 18, ey + hr * 0.3 + 40), fill(fc))
    else:
        for s in (-1, 1):
            if expr == 'wink' and s == 1: c.drawLine(hc[0] + ex - 14, ey, hc[0] + ex + 14, ey, pen(fc, 7))
            elif expr in ('bored',): c.drawLine(hc[0] + s * ex - 14, ey, hc[0] + s * ex + 14, ey, pen(fc, 7)); c.drawArc(skia.Rect(hc[0] + s * ex - 15, ey - 12, hc[0] + s * ex + 15, ey + 12), 0, 180, False, pen(fc, 5))
            else: c.drawCircle(hc[0] + s * ex, ey, 10, fill(fc))
        my = ey + hr * 0.38
        if expr in ('happy', 'wink'): c.drawArc(skia.Rect(hc[0] - 36, my - 30, hc[0] + 36, my + 22), 10, 160, False, pen(fc, 7))
        elif expr == 'smug': c.drawArc(skia.Rect(hc[0] - 34, my - 26, hc[0] + 34, my + 10), 20, 120, False, pen(fc, 7))
        elif expr == 'confused':
            m = skia.Path(); m.moveTo(hc[0] - 28, my); m.quadTo(hc[0] - 10, my - 10, hc[0], my); m.quadTo(hc[0] + 12, my + 10, hc[0] + 28, my); c.drawPath(m, pen(fc, 7))
        elif expr == 'bored': c.drawLine(hc[0] - 24, my, hc[0] + 24, my + 4, pen(fc, 7))
        elif expr == 'hot': c.drawOval(skia.Rect(hc[0] - 22, my - 8, hc[0] + 22, my + 20), fill(fc)); c.drawLine(hc[0] - 4, my + 14, hc[0] + 6, my + 34, pen('#e03131', 10))
        else: c.drawLine(hc[0] - 22, my, hc[0] + 22, my, pen(fc, 7))
    if tier >= 1 and galaxy < 0.5:   # glasses
        for s in (-1, 1): c.drawCircle(hc[0] + s * ex, ey, 30, pen(INK, 6))
        c.drawLine(hc[0] - ex + 30, ey, hc[0] + ex - 30, ey, pen(INK, 6))
    if expr == 'hot':
        for s in (-1, 1): c.drawCircle(hc[0] + s * hr * 0.62, ey + 22, 18, fill('#ff6b6b', 0.5))
    if tier >= 3 and galaxy < 0.5:   # little sparkle rays
        for k in range(8):
            a = k / 8 * 2 * math.pi + t * 0.5; r0, r1 = hr + 24, hr + 44 + 6 * math.sin(t * 5 + k)
            c.drawLine(hc[0] + math.cos(a) * r0, hc[1] + math.sin(a) * r0, hc[0] + math.cos(a) * r1, hc[1] + math.sin(a) * r1, pen('#f59f00', 6))
    if steam > 0:
        for k in range(3):
            ph = (t * 0.9 + k / 3) % 1; sx = hc[0] - hr * 0.5 + k * hr * 0.5
            sp = skia.Path(); sp.moveTo(sx, hc[1] - hr - 10 - ph * 120)
            for j in range(1, 6): sp.lineTo(sx + (14 if j % 2 else -14), hc[1] - hr - 10 - ph * 120 - j * 18)
            c.drawPath(sp, pen('#868e96', 6, steam * (1 - ph)))
    if fan > 0:   # propeller beanie
        top = hc[1] - hr
        c.drawArc(skia.Rect(hc[0] - hr * 0.7, top - 20, hc[0] + hr * 0.7, top + hr * 0.6), 180, 180, True, fill('#4dabf7'))
        c.drawArc(skia.Rect(hc[0] - hr * 0.7, top - 20, hc[0] + hr * 0.7, top + hr * 0.6), 180, 180, True, pen(INK, 6))
        c.drawLine(hc[0], top - 20, hc[0], top - 60, pen(INK, 6))
        a = t * 30; L = 70 * fan
        for s in (-1, 1):
            c.drawOval(skia.Rect(hc[0] - L, top - 72, hc[0] + L, top - 52).makeOffset(0, 0), fill(['#ffd43b', '#ff6b6b'][s > 0], 0.4))
        c.drawLine(hc[0] - L * math.cos(a), top - 62, hc[0] + L * math.cos(a), top - 62, pen(INK, 10))
    return hc, hr


# ------------------------------------------------------------------ props (each draws itself on)
def prop(c, pid, t, u, seed, ctx):
    d = Doodle(c, t, u, seed)
    hc, hr, iq, tier = ctx["hc"], ctx["hr"], ctx["iq"], ctx["tier"]
    if pid == 'hook':
        for k, (x, y) in enumerate(((210, 900), (870, 860), (200, 640), (880, 600))):
            d.arrow(x, y + 160, x, y - 60, '#e03131', 12, 0.18)
        for k, (x, y, r) in enumerate(((300, 640, -12), (780, 600, 10), (540, 780, 0))):
            d.text("?", x, y, 150 + 30 * k, '#7048e8', rot=r)
    elif pid == 'bell':
        if tier <= 1:
            x0, x1, base, top = 150, 930, 900, 560
            f = lambda q: (x0 + (x1 - x0) * q, base - (base - top) * math.exp(-((q - 0.5) * 6.2) ** 2 / 2))
            d.line(x0 - 20, base, x1 + 20, base, w=7, d=0.15)
            d.curve(f, 50, '#1c7ed6', 10, 0.35)
            for v in (70, 100, 130):
                x = 540 + (v - 100) / 15 * 120; d.line(x, base - 12, x, base + 12, w=6, d=0.04); d.text(str(v), x, base + 60, 44, key='hand', d=0.08)
            if tier == 0:
                d.circle(540, top - 4, 22, colr='#e03131', fillc='#e03131', w=6, d=0.12)
                d.arrow(700, 470, 566, 540, '#e03131', 8, 0.15); d.text("YOU", 770, 476, 64, '#e03131', d=0.12)
                d.text("AVERAGE", 540, 1050, 70, hl='#ffe066')
            else:
                d.circle(950, base - 18, 22, colr='#e03131', fillc='#e03131', w=6, d=0.12)
                d.arrow(950, 640, 950, 850, '#e03131', 8, 0.15); d.text("YOU", 950, 610, 64, '#e03131', d=0.12)
                d.text("1 IN 76 BILLION", 540, 1050, 66, hl='#ffe066')
        else:
            x0, x1, base, top = 150, 450, 900, 720
            f = lambda q: (x0 + (x1 - x0) * q, base - (base - top) * math.exp(-((q - 0.5) * 6.2) ** 2 / 2))
            d.line(x0 - 20, base, x1 + 20, base, w=7, d=0.12); d.curve(f, 40, '#1c7ed6', 9, 0.25)
            d.text("everyone", 300, 700, 46, key='hand', d=0.1)
            d.arrow(480, 860, 1040, 860, '#e03131', 10, 0.25)
            lab = {2: "OFF THE CHART", 3: "WAY OFF THE CHART", 4: "OFF THE PAPER", 5: "OFF THE PLANET", 6: "OFF... EVERYTHING"}[tier]
            d.text("YOU ->", 830, 800, 56, '#e03131', d=0.12)
            d.text(lab, 540, 590, 70 if len(lab) < 15 else 62, hl='#ffe066')
    elif pid == 'half':
        for k in range(10):
            x = 170 + k * 82; y = 640; cc = '#40c057' if k < 5 else '#adb5bd'
            d.circle(x, y - 70, 22, w=5, fillc=cc, d=0.05); d.line(x, y - 48, x, y + 10, w=5, d=0.03)
            d.line(x, y + 10, x - 16, y + 50, w=5, d=0.03); d.line(x, y + 10, x + 16, y + 50, w=5, d=0.03)
        d.text("50% SMARTER", 350, 520, 46, '#2f9e44'); d.text("THAN THESE", 760, 520, 46, '#868e96')
    elif pid == 'kitchen':
        d.rect(780, 760, 1010, 1640, w=8, fillc='#e9ecef', d=0.2); d.circle(808, 1200, 10, fillc=INK, w=4, d=0.04)
        d.text("KITCHEN", 895, 820, 40, key='hand')
        d.cloud(330, 820, 190, 95, tail=(hc[0] - 60, hc[1] - hr), d=0.25)
        d.text("why am I here?", 330, 838, 52, key='hand')
    elif pid == 'nobody':
        d.circle(540, 690, 190, colr=INK, w=8, fillc='#a5d8ff', d=0.3)
        d.poly([(440, 590), (520, 560), (580, 620), (530, 700), (450, 690)], closed=True, fillc='#8ce99a', w=6, d=0.12)
        d.poly([(580, 740), (660, 720), (690, 800), (610, 830)], closed=True, fillc='#8ce99a', w=6, d=0.1)
        d.text("8 BILLION PEOPLE", 540, 470, 56)
        d.text("SMARTER: 0", 540, 970, 76, '#e03131', hl='#ffe066')
    elif pid == 'lang':
        for (x0, y0, x1, y1, s, rot) in ((140, 470, 470, 590, "HOLA!", -4), (620, 480, 960, 600, "CIAO!", 3), (260, 640, 720, 760, "KONNICHIWA!", -2)):
            d.bubble(x0, y0, x1, y1, ((x0 + x1) / 2, y1 + 50), d=0.15); d.text(s, (x0 + x1) / 2, (y0 + y1) / 2 + 22, 56, rot=rot)
    elif pid == 'cube':
        cx, cy, s = 860, 940, 90
        top = [(cx, cy - s), (cx + s, cy - s / 2), (cx, cy), (cx - s, cy - s / 2)]
        lf = [(cx - s, cy - s / 2), (cx, cy), (cx, cy + s), (cx - s, cy + s / 2)]
        rt = [(cx, cy), (cx + s, cy - s / 2), (cx + s, cy + s / 2), (cx, cy + s)]
        d.poly(top, closed=True, fillc='#ffd43b', w=7, d=0.1); d.poly(lf, closed=True, fillc='#ff6b6b', w=7, d=0.1); d.poly(rt, closed=True, fillc='#4dabf7', w=7, d=0.1)
        d.text("SOLVED", cx, cy + s + 70, 50, '#2f9e44'); d.check(cx + 120, cy + s + 40, 1.0)
    elif pid == 'snail':
        d.bubble(560, 470, 1020, 640, (900, 760), d=0.2); d.text("sooo... hoooow...", 790, 540, 46, key='hand', d=0.5); d.text("aaare... yoouuu...", 790, 610, 46, key='hand', d=0.5)
        fx, fy = 900, 1640
        d.circle(fx, fy - 260, 44, w=6, fillc='#ffffff', d=0.08); d.line(fx, fy - 216, fx, fy - 100, w=6, d=0.05)
        d.line(fx, fy - 100, fx - 30, fy, w=6, d=0.04); d.line(fx, fy - 100, fx + 30, fy, w=6, d=0.04)
        d.line(fx, fy - 190, fx - 50, fy - 130, w=6, d=0.04); d.line(fx, fy - 190, fx + 50, fy - 130, w=6, d=0.04)
        sx = 200 + 12 * u
        d.circle(sx, 1590, 40, w=6, fillc='#ffc078', d=0.1); d.curve(lambda q: (sx + math.cos(q * 9) * 40 * (1 - q), 1590 + math.sin(q * 9) * 40 * (1 - q)), 30, INK, 4, 0.08)
        d.poly([(sx - 70, 1632), (sx + 60, 1632), (sx + 90, 1610)], w=6, d=0.06)
        d.text("Z z z", hc[0] + hr + 60, hc[1] - hr, 52, '#868e96', key='hand')
    elif pid == 'test':
        d.rect(150, 470, 470, 900, w=7, fillc='#ffffff', d=0.18)
        d.text("IQ TEST", 310, 540, 50)
        for k in range(5): d.line(190, 600 + k * 50, 430, 600 + k * 50, '#adb5bd', 5, 0.04)
        d.text("MAX ~160", 310, 870, 40, '#e03131', key='hand')
        d.text("ERROR", 320, 720, 96, '#e03131', rot=-18, d=0.12)
    elif pid == 'imagine':
        d.cloud(780, 680, 220, 140, fillc='#f3f0ff', d=0.3)
        for k, cc in enumerate(('#ff6b6b', '#ffa94d', '#ffd43b', '#69db7c', '#4dabf7')):
            d.ellipse(780, 760, 160 - k * 18, 120 - k * 16, colr=cc, w=12, d=0.08, over=-3.14)
        d.text("IMAGINATION", 780, 640, 52, '#7048e8'); d.text("MODE", 780, 700, 52, '#7048e8')
    elif pid == 'board':
        d.rect(130, 460, 950, 900, colr='#5c3d1e', w=12, fillc='#2b5a3e', d=0.2, falpha=1.0)
        for k, s in enumerate(("x^n + y^n = z^n", "P = NP ?", "zeta(s) = 0 ...")):
            d.text(s, 470, 560 + k * 110, 60, '#ffffff', key='hand', d=0.3)
            d.check(830, 540 + k * 110, 1.0, '#8ce99a')
        d.text("BEFORE BREAKFAST", 540, 990, 60, hl='#ffe066')
    elif pid == 'virus':
        for (x, y, r) in ((300, 650, 90), (760, 620, 70), (560, 820, 55)):
            d.circle(x, y, r, colr=INK, w=7, fillc='#94d82d', d=0.1)
            for k in range(8):
                a = k / 8 * 2 * math.pi; d.line(x + math.cos(a) * r, y + math.sin(a) * r, x + math.cos(a) * (r + 26), y + math.sin(a) * (r + 26), w=6, d=0.02)
        for (x, y, s) in ((300, 650, 1.6), (760, 620, 1.3), (560, 820, 1.0)): d.cross(x, y, s)
        d.text("CURED!", 540, 1000, 80, '#2f9e44', hl='#ffe066')
    elif pid == 'books':
        cols = ['#ff6b6b', '#4dabf7', '#ffd43b', '#69db7c', '#b197fc', '#ffa94d']
        for k in range(6): d.rect(120, 1560 - k * 46, 330, 1600 - k * 46, w=6, fillc=cols[k], d=0.05)
        d.text("EVERY BOOK EVER", 540, 520, 64, hl='#ffe066')
        rg = np.random.default_rng(2)
        for k in range(14):   # books flying into the head
            q = (u * 1.4 - k * 0.18) % 2.6
            if q > 1 or u < 0.4: continue
            sx, sy = 225, 1380; ex_, ey_ = hc[0], hc[1] - hr * 0.3
            x = sx + (ex_ - sx) * q; y = sy + (ey_ - sy) * q - math.sin(q * math.pi) * 380; s = 1 - 0.6 * q
            c.save(); c.translate(x, y); c.rotate(q * 400 + k * 30)
            c.drawRect(skia.Rect(-50 * s, -34 * s, 50 * s, 34 * s), fill(cols[k % 6])); c.drawRect(skia.Rect(-50 * s, -34 * s, 50 * s, 34 * s), pen(INK, 5))
            c.drawLine(0, -34 * s, 0, 34 * s, pen(INK, 4)); c.restore()
        d.text(f"READ: {min(int(u * 4e7), 158000000):,}", 540, 640, 54, '#e03131', key='marker', d=0.2)
    elif pid == 'predict':
        fx, fy = 890, 1640
        d.circle(fx, fy - 270, 50, w=6, fillc='#ffffff', d=0.08); d.line(fx, fy - 220, fx, fy - 100, w=6, d=0.05)
        d.line(fx, fy - 100, fx - 32, fy, w=6, d=0.04); d.line(fx, fy - 100, fx + 32, fy, w=6, d=0.04)
        d.line(fx, fy - 190, fx - 52, fy - 120, w=6, d=0.04); d.line(fx, fy - 190, fx + 52, fy - 120, w=6, d=0.04)
        d.bubble(640, 820, 1030, 960, (880, 1290), d=0.15)
        d.cloud(330, 640, 210, 110, tail=(hc[0] - 40, hc[1] - hr), fillc='#fff9db', d=0.2)
        d.text("\"want pizza?\"", 330, 660, 54, key='hand')
        if u > 2.0:
            d2 = Doodle(c, t, u - 2.0, seed + 99); d2.text("want pizza?", 835, 905, 52, key='hand')
        d.text("1 SEC AHEAD", 330, 500, 44, '#e03131')
    elif pid == 'atom':
        x, y = 290, 650
        for k in range(3): d.ellipse(x, y, 170, 60, colr='#1c7ed6', w=7, rot=k * 1.05, d=0.15)
        d.circle(x, y, 26, colr=INK, w=6, fillc='#ff6b6b', d=0.06)
        if u > 0.6:
            for k in range(3):
                a = t * 3 + k * 2; px, py = math.cos(a) * 170, math.sin(a) * 60; r = k * 1.05
                c.drawCircle(x + px * math.cos(r) - py * math.sin(r), y + px * math.sin(r) + py * math.cos(r), 12, fill('#ffd43b'))
        d.text("UNIVERSE: SOLVED", 290, 870, 46, '#2f9e44')
    elif pid == 'rocket':
        d.rect(600, 470, 1010, 900, colr='#1864ab', w=7, fillc='#339af0', d=0.15, falpha=1.0)
        for k in range(6): d.line(600, 520 + k * 70, 1010, 520 + k * 70, '#74c0fc', 2, 0.02)
        cx = 805
        d.poly([(cx, 510), (cx + 60, 620), (cx + 60, 790), (cx - 60, 790), (cx - 60, 620)], colr='#ffffff', w=7, closed=True, d=0.2)
        d.poly([(cx - 60, 720), (cx - 110, 810), (cx - 60, 790)], colr='#ffffff', w=6, d=0.06); d.poly([(cx + 60, 720), (cx + 110, 810), (cx + 60, 790)], colr='#ffffff', w=6, d=0.06)
        d.circle(cx, 660, 26, colr='#ffffff', w=6, d=0.06)
        d.text("YEAR 3025", 805, 870, 46, '#ffffff', key='hand')
    elif pid == 'battery':
        d.rect(160, 520, 480, 680, w=8, fillc='#ffffff', d=0.15); d.rect(480, 570, 510, 630, w=7, fillc=INK, d=0.04)
        d.rect(176, 536, 176 + 290 * 0.2 * min(1, u / 0.8), 664, w=0, fillc='#ff6b6b', d=0.1, falpha=1.0)
        d.text("BRAIN = 20%", 320, 770, 56, '#e03131')
        d.text("of your energy", 320, 830, 44, key='hand')
    elif pid == 'fan':
        x, y = 860, 600
        d.rect(x - 22, y, x + 22, y + 340, w=7, fillc='#ffffff', d=0.12); d.circle(x, y + 380, 52, w=7, fillc='#ff6b6b', d=0.08)
        lvl = clamp(u / 1.2)
        c.drawRect(skia.Rect(x - 12, y + 330 - 320 * lvl, x + 12, y + 360), fill('#ff6b6b'))
        d.text("HOT!", x, y - 30, 64, '#e03131')
    elif pid == 'earth':
        d.cloud(380, 680, 250, 180, tail=(hc[0] - 50, hc[1] - hr), fillc='#ffffff', d=0.25)
        if u > 0.4:
            ex_, ey_, r = 380, 680, 130
            c.save(); c.clipPath(skia.Path().addCircle(ex_, ey_, r), doAntiAlias=True)
            c.drawCircle(ex_, ey_, r, fill('#74c0fc'))
            for k in range(3):
                ox = ((t * 60 + k * 120) % 360) - 180
                c.drawOval(skia.Rect(ex_ + ox - 50, ey_ - 70 + k * 50, ex_ + ox + 40, ey_ - 20 + k * 50), fill('#8ce99a'))
            c.restore(); c.drawCircle(ex_, ey_, r, pen(INK, 7))
        d.wait(0.3); d.text("SIMULATED", 850, 990, 50, '#7048e8')
    elif pid == 'weather':
        x0, y0 = 690, 520
        d.rect(x0, y0, x0 + 320, y0 + 400, w=7, fillc='#ffffff', d=0.15); d.rect(x0, y0, x0 + 320, y0 + 70, w=7, fillc='#ff6b6b', d=0.08)
        d.text("NEXT YEAR", x0 + 160, y0 + 52, 40, '#ffffff')
        for k in range(9):
            cx, cy = x0 + 60 + (k % 3) * 100, y0 + 140 + (k // 3) * 100
            if k % 3 == 0: d.circle(cx, cy, 24, colr='#f59f00', w=5, fillc='#ffd43b', d=0.04)
            elif k % 3 == 1: d.cloud(cx, cy, 34, 20, fillc='#e9ecef', d=0.04)
            else: d.line(cx - 20, cy - 20, cx - 30, cy + 20, '#1c7ed6', 5, 0.02); d.line(cx + 10, cy - 20, cx, cy + 20, '#1c7ed6', 5, 0.02)
    elif pid == 'everything':
        for k in range(8):
            a = k / 8 * 2 * math.pi; x, y = 540 + math.cos(a) * 400, 690 + math.sin(a) * 190
            if u < 0.4 + k * 0.18: d.text("?", x, y + 30, 90, '#fff6d0')
            else: d.check(x, y, 1.4, '#8ce99a', 14)
        d.text("EVERYTHING", 540, 720, 100, '#ffd43b')
    elif pid == 'comment':
        d.rect(140, 480, 940, 760, w=8, fillc='#ffffff', d=0.18, falpha=1.0)
        d.circle(220, 560, 44, w=6, fillc='#ffa94d', d=0.06)
        s = "my IQ is..."; nch = int(clamp((u - 0.5) / 1.5) * len(s))
        c.drawString(s[:nch] + ("|" if int(t * 3) % 2 else ""), 290, 590, font(64, 'hand'), fill(INK))
        d.line(290, 680, 880, 680, '#ced4da', 6, 0.1)
        d.text("I KNOW.", 540, 900, 96, '#ffd43b', rot=-4)
    elif pid == 'cta':
        d.text("COMMENT", 540, 600, 120, '#ffd43b', rot=-3)
        d.text("YOUR IQ", 540, 740, 120, '#ffd43b', rot=-3)
        d.arrow(540, 820, 540, 1060, '#ff6b6b', 14, 0.2)


# ------------------------------------------------------------------ the frame
class Film:
    def __init__(self):
        self.segs, self.total = timeline()
        st = {"iq": 100, "bob": "neutral"}
        prev_iq = 100
        for s in self.segs:
            cue = s["cue"]; s["iq_from"] = st["iq"]
            if "iq" in cue: st["iq"] = cue["iq"]
            if "bob" in cue: st["bob"] = cue["bob"]
            s["state"] = dict(st); s["tier"] = TIERS.index(st["iq"]); s["tier_from"] = TIERS.index(s["iq_from"])
            s["newtier"] = s["tier"] != s["tier_from"]

    def seg_at(self, t):
        for s in self.segs:
            if t < s["until"]: return s
        return self.segs[-1]

    def iq_value(self, s, u):
        a, b = s["iq_from"], s["state"]["iq"]
        if s["cue"].get("hook"):
            return 100 * 10 ** (12 * eio(u / s["dur"]))
        if a == b: return b
        k = eio(u / 0.9)
        if b == INF: return INF if k >= 1 else a * 10 ** (8 * k)
        return a * (b / a) ** k

    def frame(self, t):
        arr = np.zeros((H, W, 4), np.uint8); arr[..., 3] = 255
        c = skia.Surface(arr).getCanvas()
        s = self.seg_at(t); u = t - s["start"]; st = s["state"]; tier = s["tier"]
        inf_seg = next(x for x in self.segs if x["state"]["iq"] == INF)
        cosmic = eio((t - inf_seg["start"] - 0.5) / 0.8) if t >= inf_seg["start"] else 0.0
        bump = max(0.0, 1 - abs(u - 0.9) / 0.25) if s["newtier"] else 0.0
        z = 1 + 0.03 * bump
        c.save(); c.translate(540, 960); c.scale(z, z); c.translate(-540, -960)
        paper(c, t, cosmic)
        grow = eob((u - 0.7) / 0.5) if s["newtier"] else 1.0
        if s["cue"].get("hook"): grow = clamp(u / s["dur"])
        jump = clamp((u - 0.6) / 0.5) if s["newtier"] else 0.0
        fan_seg = next(x for x in self.segs if any(p == 'fan' for p, _ in x["cue"].get("props", [])))
        fan_t = fan_seg["start"] + fan_seg["words"][14][1]
        fan = clamp((t - fan_t) / 0.3) if (fan_t <= t < fan_seg["until"]) else 0.0
        steam = 1.0 if st["bob"] == 'hot' else 0.0
        hc, hr = draw_bob(c, t, 540, 1640, tier, st["bob"], grow, jump, galaxy=cosmic, fan=fan, steam=steam)
        ctx = {"hc": hc, "hr": hr, "iq": st["iq"], "tier": tier}
        for k, (pid, wi) in enumerate(s["cue"].get("props", [])):
            w_t = s["words"][min(wi, len(s["words"]) - 1)][1] if wi > 0 else 0.0
            if u >= w_t: prop(c, pid, t, u - w_t, sum(map(ord, s["id"])) * 13 + k * 17, ctx)
        counter(c, t, self.iq_value(s, u), bump, tier, cosmic)
        c.restore()
        # captions: the chunk being spoken, current word in red, a highlighter swipe behind
        if s["start"] <= t < s["end"] + 0.2:
            cur = max([j for j, (_, wt) in enumerate(s["words"]) if u >= wt - 0.02] or [0])
            ch = next(cc for cc in s["chunks"] if cur in cc)
            words = [re.sub(r"[^\w$'%?!.,-]", "", s["words"][j][0]) for j in ch]
            size = 92; full = " ".join(words); wd = tw(full, size)
            if wd > W - 120: size *= (W - 120) / wd; wd = tw(full, size)
            y = 1800; x = 540 - wd / 2
            ink = INK if cosmic < 0.5 else '#fff6d0'
            hp = skia.Path(); hp.moveTo(x - 24, y - size * 0.7); hp.lineTo(x + wd + 24, y - size * 0.78); hp.lineTo(x + wd + 30, y + size * 0.16); hp.lineTo(x - 18, y + size * 0.22); hp.close()
            c.drawPath(hp, fill('#ffe066' if cosmic < 0.5 else '#7048e8', 0.8))
            for j, w in zip(ch, words):
                c.drawString(w, x, y, font(size), fill(('#e03131' if cosmic < 0.5 else '#ffd43b') if j == cur else ink)); x += tw(w + " ", size)
        return arr[..., :3]


# ------------------------------------------------------------------ audio
def build_audio(film):
    import music as M, sfx as FX
    total = film.total; N = int(total * SR); T = M.Track(total + 3); X = M.Track(total + 3)
    B = 60 / 112; prog = [(0, 4, 7), (-3, 0, 4), (5, 9, 12), (7, 11, 14)]; root = 60
    inf_t = next(x["start"] for x in film.segs if x["state"]["iq"] == INF)
    t, i = 0.0, 0
    while t < total:
        ch = prog[(i // 8) % 4]; cosmic = t >= inf_t
        if not cosmic:
            if i % 2 == 0: T.add(t, mono=M.pluck(root - 24 + ch[0] + (7 if i % 4 == 2 else 0), 0.3, 0.7, 900), gain=0.22)
            if i % 4 == 1: T.add(t, mono=M.pluck(root + ch[(i // 4) % 3], 0.2, 0.5, 4000), gain=0.08, pan=-0.3)
            if i % 4 == 3: T.add(t, mono=M.pluck(root + 12 + ch[(i // 4 + 1) % 3], 0.2, 0.4, 5000), gain=0.06, pan=0.3)
            T.add(t, mono=M.shaker(0.2), gain=0.05)
            if i % 8 == 0: T.add(t, mono=M.kick(0.6), gain=0.18)
        else:
            if i % 8 == 0:
                for m_, g_ in ((root - 12 + ch[0], 0.12), (root + ch[1], 0.07)):
                    pl, pr = M.pad_note(m_, B * 4.2, 1800); T.add(t, L=pl, R=pr, gain=g_)
            if i % 2 == 0: T.add(t, mono=M.bell(root + 12 + ch[(i // 2) % 3], 1.5, 0.4), gain=0.06, pan=0.3 * math.sin(i))
        t += B / 2; i += 1
    add = lambda t, y, g, p=0.0: X.add(t, mono=y, gain=g, pan=p)
    tt = lambda d: np.arange(int(d * SR)) / SR
    rg = np.random.default_rng(3)
    def scribble(d=0.4):
        q = tt(d); n = rg.normal(0, 1, len(q)); n = M.bandpass(n, 3200, 2400)
        am = 0.5 + 0.5 * np.abs(np.sin(2 * np.pi * 7 * q + rg.uniform(0, 3))); return n * am * np.minimum(1, q / 0.02) * np.minimum(1, (d - q) / 0.08) * 0.5
    def tick():
        q = tt(0.03); return np.sin(2 * np.pi * 2400 * q) * np.exp(-q / 0.006) * 0.6
    for s in film.segs:
        for k, (pid, wi) in enumerate(s["cue"].get("props", [])):
            w_t = s["words"][min(wi, len(s["words"]) - 1)][1] if wi > 0 else 0.0
            add(s["start"] + w_t + 0.02, scribble(0.5), 0.35, 0.4 * (-1) ** k)
        if s["newtier"]:
            for j in range(16): add(s["start"] + j * 0.055, tick(), 0.3)
            add(s["start"] + 0.9, M.bell(84 + 2 * s["tier"], 1.6, 0.7), 0.3)
            add(s["start"] + 0.6, FX.whoosh(0.4, 0.8, True), 0.3)
        if s["cue"].get("hook"):
            for j in range(int(s["dur"] / 0.05)): add(s["start"] + j * 0.05, tick(), 0.18)
            add(s["start"], M.riser(s["dur"], 0.5), 0.3)
        if s["state"]["iq"] == INF and s["newtier"]:
            add(s["start"] - 1.5, M.riser(1.6, 0.6), 0.4); add(s["start"] + 0.85, FX.boom_low(0.8), 0.5)
    voice = np.zeros(N, np.float32)
    for s in film.segs:
        y, sr = load_voice(s["id"]); g = np.gcd(SR, sr); y = signal.resample_poly(y, SR // g, sr // g).astype(np.float32)
        y = y / (np.abs(y).max() + 1e-9) * 0.85
        a = int(s["start"] * SR); m = min(len(y), N - a); voice[a:a + m] += y[:m]
    Lm, Rm = M.apply_reverb(T.L.astype(np.float64), T.R.astype(np.float64), wet=0.12)
    mus = np.stack([Lm[:N], Rm[:N]], 1); mus /= np.abs(mus).max() + 1e-9
    sfx = np.stack([X.L[:N], X.R[:N]], 1); sfx /= np.abs(sfx).max() + 1e-9
    act = (np.abs(voice) > 0.01).astype(np.float32); kk = int(0.3 * SR)
    env = signal.fftconvolve(act, np.ones(kk) / kk, "same"); env = signal.fftconvolve((env > 0.03).astype(np.float32), np.ones(int(0.2 * SR)) / int(0.2 * SR), "same")
    mix = mus * (0.38 * (1 - 0.45 * env))[:, None] + sfx * 0.5 + voice[:, None]
    mix *= np.clip((total - np.arange(N) / SR) / 0.5, 0, 1)[:, None]; mix = mix / (np.abs(mix).max() + 1e-9) * 0.9
    out = os.path.join(S_DIR, "iq_mix.wav"); sf.write(out, mix.astype(np.float32), SR, subtype="FLOAT"); return out


def main():
    ap = argparse.ArgumentParser(); ap.add_argument("--preview", nargs="*", type=float); a = ap.parse_args()
    film = Film()
    if a.preview is not None:
        ims = [cv2.resize(cv2.cvtColor(film.frame(t), cv2.COLOR_RGB2BGR), (360, 640)) for t in a.preview]
        while len(ims) % 6: ims.append(np.zeros_like(ims[0]))
        cv2.imwrite(os.path.join(S_DIR, "iq_prev.jpg"), np.vstack([np.hstack(ims[k:k + 6]) for k in range(0, len(ims), 6)]))
        print("total", round(film.total, 2)); return
    wav = build_audio(film)
    enc = subprocess.Popen(['ffmpeg', '-y', '-v', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{W}x{H}', '-r', str(FPS), '-i', '-', '-i', wav,
                            '-map', '0:v', '-map', '1:a', '-af', 'loudnorm=I=-14:TP=-1.5:LRA=9', '-c:v', 'libx264', '-preset', 'slow', '-crf', '18', '-pix_fmt', 'yuv420p',
                            '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-movflags', '+faststart', '-shortest', OUTF], stdin=subprocess.PIPE)
    for f in range(int(round(film.total * FPS))):
        enc.stdin.write(np.ascontiguousarray(film.frame(f / FPS)).tobytes())
    enc.stdin.close(); enc.wait(); print(OUTF, round(film.total, 2), "s")


if __name__ == "__main__":
    main()
