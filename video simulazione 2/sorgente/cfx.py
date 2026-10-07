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
    "ARU": ("THE SPEAKER OF PRIMA", "#f08a3a", "claude"), "NERI": ("THE ASTRONOMER", "#b58cff", "gemini"), "MARU": ("PRIESTESS OF NUVIA", "#2fb3c6", None),
    "KUMA": ("ELDER OF THE TAMARI", "#d9a57a", None), "BRAX": ("CHIEF ENGINEER", "#1fb584", "gpt"), "ZOL": ("THE BAKER PROPHET", "#ff9a3a", None),
    "RIA": ("CAPTAIN OF THE LADDER", "#ff6a7a", None), "LUMI": ("AGE 19  ·  INVENTOR", "#ffd84f", None),
}
INTROS = [("i18@Neri", "NERI", "intro"), ("i21@Aru", "ARU", "intro"), ("b06@Maru", "MARU", "intro"), ("b08@Kuma", "KUMA", "intro"), ("b10@Brax", "BRAX", "intro"),
          ("b18@Zol", "ZOL", "intro"), ("s02@Lumi", "LUMI", "intro"), ("e02@Ria", "RIA", "intro"),
          ("l04@Brax", "BRAX", "tag"), ("l12@Maru", "MARU", "tag"), ("e02@Neri", "NERI", "tag"), ("e02@Brax", "BRAX", "tag"), ("e02@Kuma", "KUMA", "tag")]
# (segment or seg@word) -> year / population marks come from the timeline segments themselves
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
        return int(_interp(t, self.ppts))

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
            OV.txt(c, "I LET AI BUILD", W / 2, H / 2 - 64 + (1 - k) * 20, 'anton', 124, '#ffffff', a, 'center', 0.02, shadow=0.8)
            OV.txt(c, "A CIVILIZATION", W / 2, H / 2 + 62 + (1 - k) * 20, 'anton', 124, '#ffffff', a, 'center', 0.02, shadow=0.8)
            OV.txt(c, "PART 2  ·  BINGUS", W / 2, H / 2 + 152, 'ui_b', 46, '#ffd84a', a * OV.sm(0.3, 0.45, u), 'center', 0.2)
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
            OV.txt(c, "WHAT IS A BINGUS?", 120, BY0 + 170, 'anton', 88, '#ffffff', a, 'left', 0.02, shadow=0.8)
            OV.txt(c, "TELL ME IN THE COMMENTS.", 120, BY0 + 262, 'anton', 64, '#ffd84a', a, 'left', 0.02, shadow=0.8)
            OV.txt(c, "the best answer gets sent up to them, in Part 3", 120, BY0 + 316, 'corsivo_b', 34, '#ffd27a', a, 'left', 0, shadow=0.8)
            x0, y0, w, h = 120, BY0 + 366, 576, 324
            c.drawRoundRect(skia.Rect(x0, y0, x0 + w, y0 + h), 16, 16, OV.P('#ffffff', 0.07 * a))
            c.drawRoundRect(skia.Rect(x0, y0, x0 + w, y0 + h), 16, 16, OV.P('#ffffff', 0.32 * a, stroke=2))
            OV.txt(c, "PART 3", x0 + w / 2, y0 + h / 2 + 10, 'ui_b', 22, '#ffffff', a * 0.75, 'center', 0.12, shadow=0)


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
    img = np.zeros((BH, BW, 4), np.uint8)
    if bg is not None:
        img[..., :3] = (cv2.GaussianBlur(bg, (0, 0), 8) * 0.30).astype(np.uint8)
    img[..., 3] = 255
    surf = skia.Surface(img)
    c = surf.getCanvas()
    u = lt / max(dur, 1e-3)

    def T(s, x, y, size, hexs, a=1.0, key='ui_b', align='left', sp=0.0):
        return OV.txt(c, s, x, y, key, size, hexs, a, align, sp, shadow=0)
    cx = BW / 2
    if kind in ("comments", "comments2", "comments3"):
        X0, Y0, X1, Y1 = 330, 30, BW - 330, BH - 30
        c.drawRoundRect(skia.Rect(X0, Y0, X1, Y1), 20, 20, OV.P('#0f0f0f', 1.0))
        T("2,431,907 Comments", X0 + 50, Y0 + 52, 32, '#f1f1f1')
        spd = {"comments": 1.2, "comments2": 2.0, "comments3": 6.0}[kind]
        _scroll_comments(c, X0, Y0 + 70, X1, Y1, 3 + lt * spd + (lt * lt * 0.6 if kind == "comments3" else 0))
        c.drawRoundRect(skia.Rect(X0, Y0, X1, Y1), 20, 20, OV.P('#2b3445', 1.0, stroke=3))
    elif kind == "bingus":
        k = OV.eo(OV.clamp(u * 3.5)); X0, X1 = 330, BW - 330
        sc = 1.0 + 0.05 * u
        c.save(); c.translate(cx, BH / 2); c.scale(sc, sc); c.translate(-cx, -BH / 2)
        c.drawRoundRect(skia.Rect(X0, 120, X1, BH - 100), 26, 26, OV.P('#0f0f0f', 1.0))
        c.drawRoundRect(skia.Rect(X0, 120, X1, BH - 100), 26, 26, OV.P('#ffd27a', 0.6 + 0.3 * math.sin(lt * 4), stroke=4))
        T("TOP COMMENT", X0 + 70, 190, 22, '#ffd27a', sp=0.3)
        _avatar(c, X0 + 120, 310, 52, "I", '#6a3fd1')
        T("@IsabellaDelaney-Dean", X0 + 200, 296, 36, '#f1f1f1', 1.0)
        T("16 hours ago", X0 + 200 + 460, 296, 28, '#aaaaaa', 1.0, key='ui')
        a2 = OV.sm(0.12, 0.3, u)
        T("Bingus", X0 + 200, 420, 96, '#ffffff', a2, key='anton')
        c.drawCircle(X0 + 214, BH - 210, 16, OV.P('#aaaaaa', 1.0, stroke=3.5))
        T("most liked comment of Part 1", X0 + 250, BH - 198, 28, '#aaaaaa', 1.0, key='ui')
        c.restore()
    elif kind == "notthis":
        items = [("Hello.", 0.08), ("Run.", 0.26), ("The meaning of life.", 0.44)]
        for i, (s, t0) in enumerate(items):
            a = OV.sm(t0, t0 + 0.05, u); y = 170 + i * 96
            w = T(s, cx, y, 70, '#cfd8e6', a, 'ui_b', 'center')
            if u > t0 + 0.07:
                p = OV.eo(OV.clamp((u - t0 - 0.07) / 0.06))
                w2 = OV.text_width(s, 'ui_b', 70) if hasattr(OV, 'text_width') else 500
                c.drawLine(cx - w2 / 2 - 20, y - 24, cx - w2 / 2 - 20 + (w2 + 40) * p, y - 24, OV.P('#ff5a6a', 1.0, stroke=8))
        a = OV.sm(0.64, 0.7, u); k = OV.eo(OV.clamp((u - 0.64) / 0.12))
        T("Bingus.", cx, 650 + (1 - k) * 20, 170, '#ffd84a', a, 'anton', 'center', 0.02)
    elif kind == "rule3":
        T("RULE #3", cx, 190, 40, '#ffd27a', 1.0, 'ui_b', 'center', 0.35)
        T("I DON'T INTERFERE.", cx, 330, 112, '#ffffff', 1.0, 'anton', 'center', 0.01)
        w = OV.text_width("INTERFERE.", 'anton', 112)
        a = OV.sm(0.35, 0.5, u)
        T("it never said I can't text.", cx, 500, 64, '#ffd84a', a, 'corsivo_b', 'center')
        T("> Hello.", cx - 260, 640, 40, '#7dd3fc', OV.sm(0.6, 0.7, u), 'mono_b')
        if (lt * 2) % 1 < 0.6 and u > 0.6:
            c.drawRect(skia.Rect(cx - 50, 606, cx - 28, 648), OV.P('#7dd3fc', 1.0))
    elif kind in ("tally", "tally2"):
        if kind == "tally":
            rows = [("FISH", 3400, '#4f86e0'), ("GOAT", 3400, '#d9a57a'), ("MACHINE", 3200, '#1fb584')]; mx = 3600; head = "THE VOTE"; foot = "NOBODY KNOWS."
        else:
            rows = [("FOR INTERFERING", 41000, '#ffd84a'), ("AGAINST", 42000, '#ff6a7a')]; mx = 45000; head = "THE VOTE: SHOULD HE INTERFERE?"; foot = "ONE THOUSAND STONES."
        T(head, cx, 130, 44, '#ffd27a', 1.0, 'ui_b', 'center', 0.3)
        for i, (nm, v, col) in enumerate(rows):
            y = 220 + i * (440 // len(rows)); p = OV.eo(OV.clamp((u - 0.1 - 0.1 * i) / 0.4))
            T(nm, 220, y + 40, 38, '#e8edf5', 1.0)
            c.drawRoundRect(skia.Rect(780, y, 780 + 860, y + 60), 12, 12, OV.P('#1e293b', 1))
            c.drawRoundRect(skia.Rect(780, y, 780 + 860 * v / mx * p, y + 60), 12, 12, OV.P(col, 1))
            T(f"{int(v * p):,}", 1670, y + 44, 40, '#ffffff', 1.0, 'anton')
        T(foot, cx, 710, 70, '#ffffff', OV.sm(0.6, 0.72, u), 'anton', 'center')
    elif kind == "railmap":
        T("THE FIRST RAILROAD  ·  YEAR 2070", cx, 120, 40, '#ffd27a', 1.0, 'ui_b', 'center', 0.25)
        x0, x1, y = 300, 1620, 420
        p = OV.eo(OV.clamp((u - 0.1) / 0.6))
        c.drawLine(x0, y, x1, y, OV.P('#3a4358', 1.0, stroke=10))
        c.drawLine(x0, y, x0 + (x1 - x0) * p, y, OV.P('#ffd84a', 1.0, stroke=10))
        for k in range(0, 41, 4):
            xx = x0 + (x1 - x0) * k / 40; c.drawLine(xx, y - 16, xx, y + 16, OV.P('#8693ad', 1.0, stroke=3))
        c.drawCircle(x0, y, 24, OV.P('#7dd3fc', 1.0)); c.drawCircle(x1, y, 24, OV.P('#ff9a3a', 1.0))
        T("PRIMA", x0, y + 80, 40, '#7dd3fc', 1.0, 'ui_b', 'center'); T("IRON MINES", x1, y + 80, 40, '#ff9a3a', 1.0, 'ui_b', 'center')
        c.drawRoundRect(skia.Rect(x0 + (x1 - x0) * p - 34, y - 52, x0 + (x1 - x0) * p + 34, y - 18), 8, 8, OV.P('#ffffff', 1.0))
        T("40 KM", cx, 640, 100, '#ffffff', OV.sm(0.3, 0.45, u), 'anton', 'center')
        T("10 YEARS", cx, 720, 44, '#ffd84a', OV.sm(0.45, 0.6, u), 'ui_b', 'center', 0.3)
    elif kind == "ask":
        T("WHAT IS A BINGUS?", cx, 230, 120, '#ffffff', OV.sm(0.0, 0.1, u), 'anton', 'center', 0.01)
        T("write it in the comments", cx, 340, 54, '#ffd27a', OV.sm(0.2, 0.35, u), 'corsivo_b', 'center')
        a = OV.sm(0.3, 0.45, u)
        c.drawRoundRect(skia.Rect(330, 460, BW - 330, 560), 12, 12, OV.P('#272727', a))
        s = "Add a comment..."
        T(s, 380, 524, 36, '#aaaaaa', a, 'ui')
        T("the best explanation gets sent up to them", cx, 700, 40, '#e8edf5', OV.sm(0.55, 0.7, u), 'ui_b', 'center', 0.05)
    elif kind == "watcher":
        a = OV.sm(0.0, 0.2, u)
        ew, eh = 360, 150
        path = skia.Path(); path.moveTo(cx - ew, 330); path.quadTo(cx, 330 - eh * 1.5, cx + ew, 330); path.quadTo(cx, 330 + eh * 1.5, cx - ew, 330); path.close()
        c.drawPath(path, OV.P('#e8edf5', a)); c.drawPath(path, OV.P('#ffffff', a, stroke=8))
        px = cx + math.sin(lt * 0.9) * 40; py = 330 + math.cos(lt * 1.3) * 12
        c.drawCircle(px, py, 82, OV.P('#2a6ad6', a)); c.drawCircle(px, py, 40, OV.P('#05070b', a)); c.drawCircle(px - 20, py - 22, 14, OV.P('#ffffff', a))
        T("WHO'S WATCHING YOU?", cx, 640, 100, '#ffffff', OV.sm(0.3, 0.45, u), 'anton', 'center', 0.01)
    elif kind == "part3":
        T("SEE YOU IN", cx, 330, 80, '#ffffff', OV.sm(0.0, 0.2, u), 'ui_b', 'center', 0.3)
        T("PART 3", cx, 520, 210, '#ffd84a', OV.sm(0.15, 0.4, u), 'anton', 'center', 0.02)
    return img[..., :3].copy()
