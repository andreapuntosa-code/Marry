# -*- coding: utf-8 -*-
"""On-screen graphics of Part 2, drawn inside the render pass: chapter cards, title, YEAR + POPULATION HUD,
name cards (with a short reminder tag), the 2D "screen" shots (comments, Bingus, tallies, rail map...), the end screen."""
import math
import numpy as np
import skia
import overlays as OV
import wordtimes

W, H = 1920, 1080
BY0, BY1 = 138, 942
BW, BH = 1920, 804

CAST = {   # name: (role, colour, badge)
    "GORN": ("THE STRONG ONE", "#e8903a", None), "LIA": ("THE FIRE KEEPER", "#8fd3c8", None), "TUK": ("THE LOUD ONE", "#ffc21a", None),
    "KRU": ("THE SMALLEST", "#6fd16a", None), "MEI": ("THE PAINTER", "#c77dff", None),
}
INTROS = [("a04@Gorn", "GORN", "intro"), ("a05@Lia", "LIA", "intro"), ("a06@Tuk", "TUK", "intro"), ("w09@Kru", "KRU", "intro"), ("w14@Mei", "MEI", "intro"),
          ("f06@", "LIA", "tag"), ("m05@Gorn", "GORN", "tag"), ("s07@", "GORN", "tag"), ("s10@", "LIA", "tag"), ("r04@Gorn", "GORN", "tag"), ("r07@Lia", "LIA", "tag")]
BAD = {"intro": 3.0, "tag": 2.0}


def _interp(t, pts):
    if t <= pts[0][0]: return pts[0][1]
    for (t0, v0), (t1, v1) in zip(pts, pts[1:]):
        if t0 <= t < t1:
            u = (t - t0) / max(1e-6, t1 - t0); return v0 + (v1 - v0) * u
    return pts[-1][1]


class Graphics:
    def __init__(self, tl, seg_by, chap_by):
        self.tl, self.seg_by = tl, seg_by
        self.cards = [(c["start"], c["end"], c) for c in tl["chapters"]]
        ev = tl["events"][0]; self.title = (ev["start"], ev["end"])
        self.outro = tl["outro"]["start"]; self.total = tl["total"]
        self.hud_on = self.cards[0][1] + 0.2
        self.names = []
        for k, (anch, nm, kind) in enumerate(INTROS):
            sid, w = anch.split("@")
            try:
                t0 = seg_by[sid]["start"] + wordtimes.word_start(sid, w) + 0.1
            except Exception:
                t0 = seg_by[sid]["start"] + 0.2
            self.names.append((t0, t0 + BAD[kind], nm, kind, "left" if k % 2 == 0 else "right"))
        ys = [(s["start"], s["year"]) for s in tl["segments"] if s.get("year")]
        ps = [(s["start"], s["pop"]) for s in tl["segments"] if s.get("pop")]
        self.ypts = ys + [(self.outro, ys[-1][1])]
        self.ppts = ps + [(self.outro, ps[-1][1])]
        self.hidden = [(c0 - 0.3, c1 + 0.3) for c0, c1, _ in self.cards] + [(self.title[0] - 0.3, self.title[1] + 0.3), (self.outro - 0.3, 1e9)]

    def year(self, t):   # year steps (no fractions: it jumps when the narrator jumps)
        v = None
        for tm, y in self.ypts:
            if tm <= t: v = y
        return v if v is not None else self.ypts[0][1]

    def pop(self, t):
        v = None
        for tm, p in self.ppts:
            if tm <= t: v = p
        v = v if v is not None else self.ppts[0][1]
        return int(v) if v < 100 else int(_interp(t, self.ppts))

    def hud_alpha(self, t):
        if t < self.hud_on: return 0.0
        a = OV.sm(self.hud_on, self.hud_on + 0.6, t)
        for h0, h1 in self.hidden:
            if h0 <= t < h1: return 0.0
            if h0 - 0.3 <= t < h0: a = min(a, 1 - OV.sm(h0 - 0.3, h0, t))
            if h1 <= t < h1 + 0.3: a = min(a, OV.sm(h1, h1 + 0.3, t))
        return a

    def active(self, t):
        return True

    def draw_hud(self, c, t, a):
        y, p = self.year(t), self.pop(t)
        x1, y0 = W - 70, BY0 + 30
        c.drawRoundRect(skia.Rect(x1 - 290, y0 - 6, x1 + 14, y0 + 150), 14, 14, OV.P('#05070b', 0.5 * a))
        OV.txt(c, "YEAR", x1 - 270, y0 + 24, "ui_b", 20, '#9fb0c8', a, 'left', 0.24, shadow=0)
        OV.txt(c, f"{y}", x1 - 270, y0 + 90, "anton", 62, '#ffffff', a, 'left', 0.02, shadow=0.5)
        OV.txt(c, "POPULATION", x1 - 270, y0 + 116, 'ui_b', 18, '#9fb0c8', a, 'left', 0.24, shadow=0)
        OV.txt(c, f"{p:,}", x1 - 270 + 188, y0 + 118, 'anton', 38, '#ffd84a', a, 'left', 0.02, shadow=0.5)

    def tag(self, c, u, name, role, col, side):
        a = OV.sm(0.0, 0.12, u) * (1 - OV.sm(0.82, 1.0, u))
        if a <= 0: return
        sl = (1 - OV.eo(OV.clamp(u * 6))) * 40
        x = 96 - sl if side == "left" else W - 96 + sl; y = BY1 - 70
        al = "left" if side == "left" else "right"; sg = 1 if side == "left" else -1
        w = 380
        c.drawRoundRect(skia.Rect(x if side == "left" else x - w, y - 52, x + w if side == "left" else x, y + 20), 10, 10, OV.P('#05070b', 0.6 * a))
        c.drawRect(skia.Rect(x - (0 if side == "left" else 6), y - 52, x + (6 if side == "left" else 0), y + 20), OV.P(col, a))
        OV.txt(c, name, x + sg * 22, y - 8, 'anton', 44, '#ffffff', a, al, 0.01, shadow=0.4)
        OV.txt(c, role, x + sg * 22, y + 14, 'ui_b', 15, col, a, al, 0.16, shadow=0)

    def draw(self, c, t):
        for c0, c1, ch in self.cards:
            if c0 <= t < c1: OV.chapter_card(c, (t - c0) / (c1 - c0), ch["label"], ch["title"], ch["sub"])
        if self.title[0] <= t < self.title[1]:
            u = (t - self.title[0]) / (self.title[1] - self.title[0])
            a = OV.sm(0.0, 0.12, u) * (1 - OV.sm(0.86, 1.0, u)); k = OV.eo(OV.clamp(u * 1.8))
            c.drawRect(skia.Rect(0, 0, W, H), OV.P('#000000', 0.62 * a))
            OV.txt(c, "I LET 20 AIs LIVE", W / 2, H / 2 - 64 + (1 - k) * 20, 'anton', 124, '#ffffff', a, 'center', 0.02, shadow=0.8)
            OV.txt(c, "IN THE STONE AGE", W / 2, H / 2 + 62 + (1 - k) * 20, 'anton', 124, '#ffffff', a, 'center', 0.02, shadow=0.8)
            OV.txt(c, "WILL THEY SURVIVE?", W / 2, H / 2 + 152, 'ui_b', 46, '#ffd84a', a * OV.sm(0.3, 0.45, u), 'center', 0.2)
        for t0, t1, nm, kind, side in self.names:
            if t0 <= t < t1:
                role, col, _ = CAST[nm]; u = (t - t0) / (t1 - t0)
                if kind == "intro": OV.name_card(c, u, nm, role, col, side)
                else: self.tag(c, u, nm, role, col, side)
        a = self.hud_alpha(t)
        if a > 0: self.draw_hud(c, t, a)
        if t >= self.outro:
            u = (t - self.outro) / (self.total - self.outro); a = OV.sm(0.0, 0.1, u)
            g = skia.GradientShader.MakeLinear([skia.Point(0, 0), skia.Point(W, 0)], [OV.col('#000000', 0.66 * a), OV.col('#000000', 0.2 * a), OV.col('#000000', 0.5 * a)])
            c.drawRect(skia.Rect(0, BY0, W, BY1), skia.Paint(Shader=g))
            OV.txt(c, "WHICH TRIBE", 120, BY0 + 150, 'anton', 92, '#ffffff', a, 'left', 0.02, shadow=0.8)
            OV.txt(c, "WOULD YOU JOIN?", 120, BY0 + 246, 'anton', 92, '#ffd84a', a, 'left', 0.02, shadow=0.8)
            OV.txt(c, "the Walkers who never stop, or the Keepers who never forget?", 120, BY0 + 316, 'corsivo_b', 34, '#ffd27a', a, 'left', 0, shadow=0.8)
            x0, y0, w, h = 120, BY0 + 366, 576, 324
            c.drawRoundRect(skia.Rect(x0, y0, x0 + w, y0 + h), 16, 16, OV.P('#ffffff', 0.07 * a))
            c.drawRoundRect(skia.Rect(x0, y0, x0 + w, y0 + h), 16, 16, OV.P('#ffffff', 0.32 * a, stroke=2))
            OV.txt(c, "NEXT EXPERIMENT", x0 + w / 2, y0 + h / 2 + 10, 'ui_b', 22, '#ffffff', a * 0.75, 'center', 0.12, shadow=0)


def draw_over(img, gfx, t):
    rgba = np.empty((H, W, 4), np.uint8); rgba[..., :3] = img; rgba[..., 3] = 255
    surf = skia.Surface(rgba); gfx.draw(surf.getCanvas(), t)
    return rgba[..., :3].copy()


# ------------------------------------------------------------------ 2D shots (picture band BW x BH)
def _card(c, X0, Y0, X1, Y1, fill='#05070b', fa=0.9, line='#2b3445'):
    c.drawRoundRect(skia.Rect(X0, Y0, X1, Y1), 22, 22, OV.P(fill, fa))
    if line: c.drawRoundRect(skia.Rect(X0, Y0, X1, Y1), 22, 22, OV.P(line, 1.0, stroke=3))


def _avatar(c, x, y, r, letter, hexs):
    c.drawCircle(x, y, r, OV.P(hexs, 1))
    OV.txt(c, letter, x, y + r * 0.36, 'ui_b', r * 1.15, '#ffffff', 1, 'center', 0, shadow=0)


COMM = [("@dr_pickle_42", "3 days ago", "Part 1 was insane. Please give them a railroad", 4100), ("@NoodleLegend", "5 days ago", "first", 12), ("@sir_tobias", "1 day ago", "the goat guy was right the whole time", 2300),
        ("@mildlyannoyed", "2 days ago", "ratio", 96), ("@Quokka.Enjoyer", "4 days ago", "Who's here after Part 1?", 1100), ("@m4rcel", "6 days ago", "my grandma watched this twice", 5700),
        ("@zzzTom", "6 hours ago", "ok but what happens when they find YOU", 8800), ("@baker_boy", "1 day ago", "grandma's soup recipe: 2 onions, 1 leek...", 310)]


def _comment(c, x, y, w, user, when, text, likes, a=1.0, size=1.0):
    r = 30 * size
    _avatar(c, x + r, y + r, r, user[1].upper(), ['#7a4bd6', '#d6574b', '#2f9e8a', '#c98a1b', '#4b7fd6'][sum(map(ord, user)) % 5])
    OV.txt(c, user, x + r * 2 + 22, y + 22 * size, 'ui_b', 24 * size, '#f1f1f1', a, 'left', 0, shadow=0)
    OV.txt(c, when, x + r * 2 + 22 + 250 * size + len(user) * 6 * size, y + 22 * size, 'ui', 21 * size, '#aaaaaa', a, 'left', 0, shadow=0)
    OV.txt(c, text, x + r * 2 + 22, y + 66 * size, 'ui', 30 * size, '#f1f1f1', a, 'left', 0, shadow=0)
    c.drawCircle(x + r * 2 + 36, y + 112 * size, 9 * size, OV.P('#aaaaaa', a * 0.9, stroke=2.5))
    OV.txt(c, f"{likes:,}", x + r * 2 + 62, y + 120 * size, 'ui', 22 * size, '#aaaaaa', a, 'left', 0, shadow=0)


def _scroll_comments(c, X0, Y0, X1, Y1, scroll, speed_blur=False):
    c.save(); c.clipRect(skia.Rect(X0 + 4, Y0 + 4, X1 - 4, Y1 - 4))
    n = len(COMM); step = 160
    off = scroll * step
    for i in range(-1, 9):
        k = int(off // step) + i
        u, wh, tx, lk = COMM[k % n]
        y = Y0 + 40 + i * step - (off % step)
        _comment(c, X0 + 50, y, X1 - X0 - 100, u, wh, tx, lk)
    c.restore()


def render_2d(kind, lt, dur, bg):
    import cv2
    img = np.zeros((BH, BW, 3), np.uint8)
    if bg is not None: img[...] = (cv2.GaussianBlur(bg, (0, 0), 8) * 0.3).astype(np.uint8)
    return img
