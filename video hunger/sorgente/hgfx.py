# -*- coding: utf-8 -*-
"""On-screen graphics of the arena film, drawn inside the render pass (one render, no second pass):
chapter cards, title, DAY + ALIVE HUD with the hundred stars, name cards when a character is introduced
(short reminder tags when they come back), rule cards, the 60-second countdown, the end screen."""
import math
import numpy as np
import skia
import overlays as OV
import wordtimes

W, H = 1920, 1080
BY0, BY1 = 138, 942

CAST = {   # name: (id, role, colour)
    "REX": ("041", "THE GIANT", "#ff5a6a"), "VEX": ("017", "THE ARCHER", "#b87cf0"), "JUNE": ("066", "SMILES WHEN SHE LIES", "#ffa86b"),
    "FINN": ("029", "THE TRICKSTER", "#d9ea66"), "KAI": ("008", "THE STRATEGIST", "#6aa2ff"), "LUNA": ("052", "THE HEALER", "#6fe6d2"),
    "TOBY": ("073", "THE GENTLE GIANT", "#d9a57a"), "DAX": ("035", "THE SWORDSMAN", "#d5dae3"), "BOLT": ("088", "THE RUNNER", "#ffd84f"),
    "ROOK": ("022", "THE BUILDER", "#9aa0a8"), "ASTER": ("061", "THE CLIMBER", "#8fd3ff"), "MARLO": ("047", "THE FISHER", "#4f86e0"),
    "SAGE": ("013", "THE FORAGER", "#92d46d"), "ECHO": ("095", "THE QUESTIONER", "#f0fcff"), "ZARA": ("079", "THE DESERT WALKER", "#f0b85a"),
    "PIP": ("100", "NUMBER ONE HUNDRED", "#ff8fbd"),
}
# (anchor "seg@word" or "seg", name, kind) kind: 'intro' big card, 'tag' small reminder
INTROS = [("b07@Rex.", "REX", "intro"), ("b10@Vex,", "VEX", "intro"), ("b11@June,", "JUNE", "intro"), ("b12@Finn,", "FINN", "intro"), ("b15@Pip.", "PIP", "intro"),
          ("f02@Rook", "ROOK", "intro"), ("f04@Zara", "ZARA", "intro"), ("f06@Aster", "ASTER", "intro"), ("f07@Marlo", "MARLO", "intro"), ("f08@Sage", "SAGE", "intro"),
          ("f09@Bolt", "BOLT", "intro"), ("f14@Toby", "TOBY", "intro"), ("a07@Kai,", "KAI", "intro"), ("a08@Luna,", "LUNA", "intro"), ("a09@Dax,", "DAX", "intro"),
          ("x01@Echo", "ECHO", "intro"),
          ("a05@Rex.", "REX", "tag"), ("a18@June", "JUNE", "tag"), ("g05@Rook", "ROOK", "tag"), ("g06@Kai,", "KAI", "tag"), ("g06@Luna,", "LUNA", "tag"), ("g06@Dax,", "DAX", "tag"),
          ("g06@Toby,", "TOBY", "tag"), ("g06@Pip.", "PIP", "tag"), ("x04@Aster,", "ASTER", "tag"), ("x14@Rex", "REX", "tag"), ("x17@Aster", "ASTER", "tag"), ("t04@", "DAX", "tag"),
          ("t10@June", "JUNE", "tag"), ("t15@Rook", "ROOK", "tag"), ("l03@Toby", "TOBY", "tag"), ("l03@Vex.", "VEX", "tag"), ("l10@Luna", "LUNA", "tag"), ("l17@Rex.", "REX", "tag"),
          ("l17@Kai.", "KAI", "tag"), ("l17@Pip.", "PIP", "tag")]
RULES = [("r08", 1, "THE LAST ONE STANDING WINS", "when an AI is shut down, one star goes dark"), ("r10", 2, "THE DOME CLOSES", "every ten days the safe zone shrinks · outside it: static"),
         ("r12", 3, "I DON'T PICK WINNERS", "weather, walls, never who lives")]
# alive count: (segment, value) steps; ramps: (seg_a, seg_b, v0, v1)
ALIVE_MARKS = [("r15", 100), ("b21", 69), ("f13", 58), ("f13f", 50), ("a17", 37), ("a25", 27), ("g08", 20), ("g09", 19), ("g14", 18), ("g19", 16), ("x11", 15), ("x17", 14), ("t08", 10), ("t18", 6),
               ("l09", 5), ("l13", 4), ("l16", 3), ("w10", 2), ("w11", 1)]
ALIVE_RAMPS = [("b18", "b21", 100, 69), ("f13c", "f13f", 58, 50), ("a18", "a25", 37, 27), ("g06", "g08", 27, 20), ("t03", "t04", 14, 11), ("t16", "t18", 10, 6)]


def _interp(t, pts):
    if t <= pts[0][0]: return pts[0][1]
    for (t0, v0), (t1, v1) in zip(pts, pts[1:]):
        if t0 <= t < t1:
            u = (t - t0) / max(1e-6, t1 - t0); return v0 + (v1 - v0) * u
    return pts[-1][1]


def _star(c, x, y, r, hexs, a):
    path = skia.Path()
    for i in range(10):
        ang = -math.pi / 2 + i * math.pi / 5; rr = r if i % 2 == 0 else r * 0.45
        (path.moveTo if i == 0 else path.lineTo)(x + math.cos(ang) * rr, y + math.sin(ang) * rr)
    path.close(); c.drawPath(path, OV.P(hexs, a))


class Graphics:
    def __init__(self, tl, seg_by, chap_by):
        self.tl, self.seg_by = tl, seg_by
        S = lambda a: seg_by[a]["start"]
        def T(anchor):
            if "@" in anchor:
                sid, w = anchor.split("@", 1)
                return S(sid) + (wordtimes.word_start(sid, w) if w else 0.0)
            return S(anchor)
        self.cards = [(c["start"], c["end"], c) for c in tl["chapters"]]
        ev = tl["events"][0]; self.title = (ev["start"], ev["end"])
        self.outro = tl["outro"]["start"]; self.total = tl["total"]
        self.hud_on = S("r15"); self.countdown = (S("r15") + 3.4, S("b05"))
        self.names = []
        for k, (anch, nm, kind) in enumerate(INTROS):
            t0 = T(anch) + 0.15
            self.names.append((t0, t0 + (2.9 if kind == "intro" else 1.9), nm, kind, "left" if k % 2 == 0 else "right"))
        self.rules = [(S(a), S(a) + seg_by[a]["dur"] + 0.8, n, l1, l2) for a, n, l1, l2 in RULES]
        # day: piecewise linear through the narrated days
        dp = [(s["start"], s["day"]) for s in tl["segments"] if s.get("day") is not None]
        self.day_pts = [(0.0, 0)] + dp + [(self.outro, 100)]
        marks = [(S(a), v) for a, v in ALIVE_MARKS]; ramps = [(S(a), S(b), v0, v1) for a, b, v0, v1 in ALIVE_RAMPS]
        self.marks, self.ramps = sorted(marks), ramps
        rnd = np.random.default_rng(3); self.order = list(rnd.permutation(100))   # the order in which the stars go dark
        self.hidden = [(c0 - 0.3, c1 + 0.3) for c0, c1, _ in self.cards] + [(self.title[0] - 0.3, self.title[1] + 0.3), (self.outro - 0.3, 1e9)]
        self.qs = [(s["start"], s["start"] + s["dur"] + s["pause"]) for s in tl["segments"] if s.get("q")]

    def alive(self, t):
        for a, b, v0, v1 in self.ramps:
            if a <= t < b and not any(a < tm <= t for tm, _ in self.marks):
                u = (t - a) / (b - a); return round(v0 + (v1 - v0) * u)
        best, bt = 100, -1e9
        for tm, v in self.marks:
            if tm <= t and tm > bt: best, bt = v, tm
        for a, b, v0, v1 in self.ramps:
            if b <= t and b > bt: best, bt = v1, b
        return best

    def day(self, t):
        return int(round(_interp(t, self.day_pts)))

    def hud_alpha(self, t):
        if t < self.hud_on: return 0.0
        a = OV.sm(self.hud_on, self.hud_on + 0.6, t)
        for h0, h1 in self.hidden:
            if h0 <= t < h1: return 0.0
            if h0 - 0.3 <= t < h0: a = min(a, 1 - OV.sm(h0 - 0.3, h0, t))
            if h1 <= t < h1 + 0.3: a = min(a, OV.sm(h1, h1 + 0.3, t))
        return a

    def active(self, t):
        return t >= self.hud_on - 0.1 or any(c0 <= t < c1 for c0, c1, _ in self.cards) or self.title[0] <= t < self.title[1]

    # ------------------------------------------------------------------ drawing
    def draw_hud(self, c, t, a):
        alive, day = self.alive(t), self.day(t)
        x1, y0 = W - 70, BY0 + 34
        c.drawRoundRect(skia.Rect(x1 - 300, y0 - 8, x1 + 18, y0 + 232), 14, 14, OV.P('#05070b', 0.5 * a))
        OV.txt(c, "DAY", x1 - 280, y0 + 28, 'ui_b', 22, '#9fb0c8', a, 'left', 0.24, shadow=0)
        OV.txt(c, f"{day:03d}", x1 - 280, y0 + 90, 'anton', 74, '#ffffff', a, 'left', 0.02, shadow=0.5)
        OV.txt(c, "/ 100", x1 - 150, y0 + 88, 'ui_b', 26, '#9fb0c8', a, 'left', 0.1, shadow=0)
        OV.txt(c, "ALIVE", x1 - 280, y0 + 132, 'ui_b', 22, '#9fb0c8', a, 'left', 0.24, shadow=0)
        OV.txt(c, f"{alive:03d}", x1 - 190, y0 + 134, 'anton', 52, '#ffd84a' if alive > 1 else '#ff8fbd', a, 'left', 0.02, shadow=0.5)
        # a grid of a hundred stars: the lit ones are the living
        lit = set(self.order[:alive])
        for i in range(100):
            gx, gy = i % 20, i // 20
            on = i in lit
            _star(c, x1 - 276 + gx * 14.2, y0 + 168 + gy * 13.0, 5.2 if on else 3.6, '#ffd84a' if on else '#3a4252', a * (1.0 if on else 0.8))

    def draw(self, c, t):
        for c0, c1, ch in self.cards:
            if c0 <= t < c1: OV.chapter_card(c, (t - c0) / (c1 - c0), ch["label"], ch["title"], ch["sub"])
        if self.title[0] <= t < self.title[1]:
            u = (t - self.title[0]) / (self.title[1] - self.title[0])
            a = OV.sm(0.0, 0.12, u) * (1 - OV.sm(0.86, 1.0, u)); k = OV.eo(OV.clamp(u * 1.8))
            c.drawRect(skia.Rect(0, 0, W, H), OV.P('#000000', 0.3 * a))
            OV.txt(c, "I PUT 100 AIs", W / 2, H / 2 - 60 + (1 - k) * 20, 'anton', 120, '#ffffff', a, 'center', 0.02, shadow=0.8)
            OV.txt(c, "IN AN ARENA.", W / 2, H / 2 + 62 + (1 - k) * 20, 'anton', 120, '#ffffff', a, 'center', 0.02, shadow=0.8)
            OV.txt(c, "ONLY ONE WALKS OUT.", W / 2, H / 2 + 150, 'ui_b', 46, '#ffd84a', a * OV.sm(0.3, 0.45, u), 'center', 0.2)
        if self.countdown[0] <= t < self.countdown[1]:
            left = (self.countdown[1] - t) / (self.countdown[1] - self.countdown[0])
            sec = int(math.ceil(left * 60)); u = (t - self.countdown[0])
            a = OV.sm(0, 0.4, u) * (1 - OV.sm(self.countdown[1] - self.countdown[0] - 0.3, self.countdown[1] - self.countdown[0], u))
            c.drawRoundRect(skia.Rect(W / 2 - 150, BY0 + 30, W / 2 + 150, BY0 + 130), 14, 14, OV.P('#05070b', 0.55 * a))
            OV.txt(c, f"00:{sec:02d}", W / 2, BY0 + 104, 'anton', 74, '#ff5a6a' if sec <= 10 else '#ffffff', a, 'center', 0.04, shadow=0.5)
        for t0, t1, n, l1, l2 in self.rules:
            if t0 <= t < t1: OV.rule_card(c, (t - t0) / (t1 - t0), n, l1, l2)
        for t0, t1, nm, kind, side in self.names:
            if t0 <= t < t1:
                idn, role, col = CAST[nm]; u = (t - t0) / (t1 - t0)
                if kind == "intro":
                    OV.name_card(c, u, nm, f"No. {idn}  ·  {role}", col, side)
                else:
                    self.tag(c, u, nm, role, col, side)
        a = self.hud_alpha(t)
        if a > 0: self.draw_hud(c, t, a)
        if t >= self.outro:
            u = (t - self.outro) / (self.total - self.outro); a = OV.sm(0.0, 0.1, u)
            c.drawRect(skia.Rect(0, BY0, W, BY1), OV.P('#000000', 0.55 * a))
            OV.txt(c, "WHO WALKS OUT", 120, BY0 + 170, 'anton', 84, '#ffffff', a, 'left', 0.02, shadow=0.8)
            OV.txt(c, "OF THE NEXT ONE?", 120, BY0 + 262, 'anton', 84, '#ffd84a', a, 'left', 0.02, shadow=0.8)
            OV.txt(c, "the best comment gets read by Pip, in Part 2", 120, BY0 + 316, 'corsivo_b', 34, '#ffd27a', a, 'left', 0, shadow=0.8)
            x0, y0, w, h = 120, BY0 + 366, 576, 324
            c.drawRoundRect(skia.Rect(x0, y0, x0 + w, y0 + h), 16, 16, OV.P('#ffffff', 0.07 * a))
            c.drawRoundRect(skia.Rect(x0, y0, x0 + w, y0 + h), 16, 16, OV.P('#ffffff', 0.32 * a, stroke=2))
            OV.txt(c, "PART 2", x0 + w / 2, y0 + h / 2 + 10, 'ui_b', 22, '#ffffff', a * 0.75, 'center', 0.12, shadow=0)

    def tag(self, c, u, name, role, col, side):
        a = OV.sm(0.0, 0.12, u) * (1 - OV.sm(0.82, 1.0, u))
        if a <= 0: return
        sl = (1 - OV.eo(OV.clamp(u * 6))) * 40
        x = 96 - sl if side == "left" else W - 96 + sl; y = BY1 - 70
        al = "left" if side == "left" else "right"; sg = 1 if side == "left" else -1
        w = 330
        c.drawRoundRect(skia.Rect(x if side == "left" else x - w, y - 52, x + w if side == "left" else x, y + 20), 10, 10, OV.P('#05070b', 0.6 * a))
        c.drawRect(skia.Rect(x - (0 if side == "left" else 6), y - 52, x + (6 if side == "left" else 0), y + 20), OV.P(col, a))
        OV.txt(c, name, x + sg * 22, y - 8, 'anton', 44, '#ffffff', a, al, 0.01, shadow=0.4)
        OV.txt(c, role, x + sg * 22, y + 14, 'ui_b', 15, col, a, al, 0.16, shadow=0)


def draw_over(img, gfx, t):
    if not gfx.active(t): return img
    rgba = np.empty((H, W, 4), np.uint8); rgba[..., :3] = img; rgba[..., 3] = 255
    surf = skia.Surface(rgba); gfx.draw(surf.getCanvas(), t)
    return rgba[..., :3].copy()
