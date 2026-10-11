# -*- coding: utf-8 -*-
"""On-screen graphics of the kids video, drawn in the render pass: the title, chapter cards, colour words with a drawn
icon, "can you say...?" bubbles, big numbers with dots, the rocket countdown, animal names and sound bursts, opposites,
dance words, a rainbow row of colour words (one per spoken word) and the goodbye card. Bubbly type (Poppins Black,
white outline, soft shadow), bright colours, gentle pop-in animations."""
import math
import numpy as np
import skia
import overlays as OV
import wordtimes
import script_kids as SK

W, H = 1920, 1080
HEX = SK.HEX
P = OV.P


def clamp(x, a=0.0, b=1.0): return max(a, min(b, x))
def eob(u):   # ease-out-back (a little overshoot)
    u = clamp(u); c1, c3 = 1.70158, 2.70158
    return 1 + c3 * (u - 1) ** 3 + c1 * (u - 1) ** 2


def bubbly(c, s, x, y, size, fill, a=1.0, scale=1.0, align='center', rot=0.0, stroke='#ffffff', sw=None, key='poppins'):
    if a <= 0.01 or not s: return 0
    f = OV.font(key, size); w = OV.text_width(s, key, size)
    x0 = x - w / 2 if align == 'center' else (x - w if align == 'right' else x)
    c.save(); c.translate(x, y - size * 0.35); c.rotate(rot); c.scale(scale, scale); c.translate(-x, -(y - size * 0.35))
    c.drawString(s, x0 + size * 0.04, y + size * 0.07, f, P('#000000', 0.28 * a, blur=size * 0.06))
    c.drawString(s, x0, y, f, P(stroke, a, stroke=sw or size * 0.16))
    c.drawString(s, x0, y, f, P(fill, a))
    c.restore()
    return w


def star(c, x, y, r, col='#ffd60a', a=1.0, rot=0.0):
    p = skia.Path()
    for k in range(10):
        rr = r if k % 2 == 0 else r * 0.45; ang = rot - math.pi / 2 + k * math.pi / 5
        (p.moveTo if k == 0 else p.lineTo)(x + math.cos(ang) * rr, y + math.sin(ang) * rr)
    p.close(); c.drawPath(p, P('#ffffff', a, stroke=r * 0.18)); c.drawPath(p, P(col, a))


def cloud(c, x, y, s, col='#ffffff', a=1.0):
    for dx, dy, r in [(-0.55, 0.1, 0.38), (-0.15, -0.18, 0.5), (0.35, -0.05, 0.42), (0.7, 0.15, 0.3), (0.1, 0.18, 0.4)]:
        c.drawCircle(x + dx * s, y + dy * s, r * s, P(col, a))


def icon(c, kind, x, y, r, a=1.0):
    """a drawn picture inside a white badge"""
    c.drawCircle(x + 6, y + 10, r + 12, P('#000000', 0.22 * a, blur=14))
    c.drawCircle(x, y, r + 12, P('#ffffff', a))
    if kind == 'apple':
        c.drawCircle(x - r * 0.28, y + r * 0.08, r * 0.52, P('#ff3b30', a)); c.drawCircle(x + r * 0.28, y + r * 0.08, r * 0.52, P('#ff3b30', a))
        c.drawCircle(x - r * 0.3, y - r * 0.12, r * 0.14, P('#ffffff', 0.5 * a))
        c.drawRoundRect(skia.Rect(x - r * 0.04, y - r * 0.72, x + r * 0.06, y - r * 0.38), 4, 4, P('#6b3e1f', a))
        lf = skia.Path(); lf.moveTo(x + r * 0.05, y - r * 0.55); lf.quadTo(x + r * 0.5, y - r * 0.85, x + r * 0.55, y - r * 0.5); lf.quadTo(x + r * 0.3, y - r * 0.35, x + r * 0.05, y - r * 0.55); c.drawPath(lf, P('#34c759', a))
    elif kind == 'orange':
        c.drawCircle(x, y + r * 0.08, r * 0.66, P('#ff9500', a))
        for k in range(9): c.drawCircle(x + math.cos(k * 2.3) * r * 0.38, y + r * 0.08 + math.sin(k * 2.3) * r * 0.38, r * 0.035, P('#e07a00', a))
        c.drawCircle(x - r * 0.25, y - r * 0.15, r * 0.13, P('#ffffff', 0.45 * a))
        lf = skia.Path(); lf.moveTo(x, y - r * 0.55); lf.quadTo(x + r * 0.45, y - r * 0.85, x + r * 0.5, y - r * 0.5); lf.quadTo(x + r * 0.25, y - r * 0.4, x, y - r * 0.55); c.drawPath(lf, P('#34c759', a))
    elif kind == 'sun':
        for k in range(12):
            ang = k * math.pi / 6; c.drawLine(x + math.cos(ang) * r * 0.5, y + math.sin(ang) * r * 0.5, x + math.cos(ang) * r * 0.82, y + math.sin(ang) * r * 0.82, P('#ffb800', a, stroke=r * 0.1))
        c.drawCircle(x, y, r * 0.45, P('#ffd60a', a)); c.drawCircle(x - r * 0.15, y - r * 0.05, r * 0.05, P('#5a3a00', a)); c.drawCircle(x + r * 0.15, y - r * 0.05, r * 0.05, P('#5a3a00', a))
        c.drawArc(skia.Rect(x - r * 0.18, y - r * 0.08, x + r * 0.18, y + r * 0.22), 20, 140, False, P('#5a3a00', a, stroke=r * 0.04))
    elif kind == 'leaf':
        lf = skia.Path(); lf.moveTo(x - r * 0.6, y + r * 0.5); lf.cubicTo(x - r * 0.6, y - r * 0.4, x + r * 0.2, y - r * 0.7, x + r * 0.62, y - r * 0.6); lf.cubicTo(x + r * 0.6, y + r * 0.1, x - r * 0.1, y + r * 0.6, x - r * 0.6, y + r * 0.5); lf.close()
        c.drawPath(lf, P('#34c759', a)); c.drawLine(x - r * 0.6, y + r * 0.5, x + r * 0.45, y - r * 0.45, P('#1f8a3a', a, stroke=r * 0.05))
    elif kind == 'cloud_sky':
        c.drawCircle(x, y, r * 0.78, P('#0a84ff', a)); cloud(c, x - r * 0.05, y + r * 0.05, r * 0.5, '#ffffff', a)
    elif kind == 'grapes':
        for i, (dx, dy) in enumerate([(-0.3, -0.25), (0, -0.25), (0.3, -0.25), (-0.15, 0.02), (0.15, 0.02), (0, 0.28), (-0.3, 0.02), (0.3, 0.02), (-0.15, 0.28), (0.15, 0.28), (0, 0.52)]):
            c.drawCircle(x + dx * r, y + dy * r, r * 0.17, P('#af52de', a)); c.drawCircle(x + dx * r - r * 0.05, y + dy * r - r * 0.05, r * 0.04, P('#ffffff', 0.5 * a))
        c.drawLine(x, y - r * 0.42, x + r * 0.1, y - r * 0.7, P('#6b3e1f', a, stroke=r * 0.06))
    elif kind == 'flower':
        for k in range(6):
            ang = k * math.pi / 3; c.drawCircle(x + math.cos(ang) * r * 0.36, y + math.sin(ang) * r * 0.36, r * 0.26, P('#ff6fb5', a))
        c.drawCircle(x, y, r * 0.22, P('#ffd60a', a))
    elif kind == 'cookie':
        c.drawCircle(x, y, r * 0.68, P('#c88a4a', a)); c.drawCircle(x, y, r * 0.68, P('#a2703f', a, stroke=r * 0.06))
        for dx, dy in [(-0.3, -0.25), (0.2, -0.3), (0.32, 0.1), (-0.1, 0.05), (-0.35, 0.25), (0.1, 0.35)]: c.drawCircle(x + dx * r, y + dy * r, r * 0.08, P('#4a2a12', a))
    elif kind == 'cloud':
        c.drawCircle(x, y, r * 0.78, P('#8fd0ff', a)); cloud(c, x - r * 0.05, y + r * 0.05, r * 0.5, '#ffffff', a)
    elif kind == 'stars':
        c.drawCircle(x, y, r * 0.8, P('#1d2459', a))
        moon = skia.Path(); moon.addCircle(x - r * 0.15, y - r * 0.05, r * 0.36); cut = skia.Path(); cut.addCircle(x + r * 0.02, y - r * 0.15, r * 0.32)
        c.drawPath(skia.Op(moon, cut, skia.PathOp.kDifference_PathOp), P('#ffe58a', a))
        for dx, dy, s in [(0.35, -0.35, 0.12), (0.45, 0.15, 0.09), (0.05, 0.45, 0.1), (-0.45, 0.35, 0.07)]: star(c, x + dx * r, y + dy * r, r * s, '#ffd60a', a)


# ------------------------------------------------------------------ effects
def confetti(c, u, seed=1, n=70, a=1.0):
    rng = np.random.default_rng(seed); cols = list(HEX.values())
    for i in range(n):
        x0, vx, vy, rot, cc = rng.uniform(0, W), rng.uniform(-120, 120), rng.uniform(260, 520), rng.uniform(0, 6), cols[i % len(cols)]
        y = -40 + vy * u * 1.6 + 120 * u * u; x = x0 + vx * u + 30 * math.sin(u * 6 + i)
        if y > H + 40: continue
        c.save(); c.translate(x, y); c.rotate(math.degrees(rot + u * 5)); c.drawRect(skia.Rect(-9, -5, 9, 5), P(cc if cc != '#2b2b2b' else '#ff6fb5', a)); c.restore()


def sparkle_burst(c, x, y, u, col='#ffd60a', n=8, R=180):
    if not 0 <= u <= 1.2: return
    for k in range(n):
        ang = k * 2 * math.pi / n + 0.3; d = R * eob(u / 0.6) * (0.7 + 0.3 * (k % 2)); a = clamp(1.4 - u)
        star(c, x + math.cos(ang) * d, y + math.sin(ang) * d, 22 + 10 * (k % 2), col, a, u * 3)


def panel(c, x0, y0, x1, y1, col, a=1.0, r=40):
    c.drawRoundRect(skia.Rect(x0 + 8, y0 + 12, x1 + 8, y1 + 12), r, r, P('#000000', 0.22 * a, blur=16))
    c.drawRoundRect(skia.Rect(x0, y0, x1, y1), r, r, P('#ffffff', a))
    c.drawRoundRect(skia.Rect(x0 + 10, y0 + 10, x1 - 10, y1 - 10), r - 8, r - 8, P(col, a))


def bubble(c, x, y, w, h, a=1.0, tail=(-1, 1)):
    c.drawRoundRect(skia.Rect(x - w / 2 + 6, y - h / 2 + 10, x + w / 2 + 6, y + h / 2 + 10), h / 2, h / 2, P('#000000', 0.2 * a, blur=12))
    t = skia.Path(); t.moveTo(x + tail[0] * w * 0.22, y + h * 0.3); t.lineTo(x + tail[0] * w * 0.34, y + h * 0.85); t.lineTo(x + tail[0] * w * 0.08, y + h * 0.4); t.close()
    c.drawPath(t, P('#ffffff', a)); c.drawRoundRect(skia.Rect(x - w / 2, y - h / 2, x + w / 2, y + h / 2), h / 2, h / 2, P('#ffffff', a))


def burst(c, x, y, R, col, a=1.0, rot=0.0):
    p = skia.Path()
    for k in range(24):
        rr = R if k % 2 == 0 else R * 0.72; ang = rot + k * math.pi / 12
        (p.moveTo if k == 0 else p.lineTo)(x + math.cos(ang) * rr, y + math.sin(ang) * rr)
    p.close(); c.drawPath(p, P('#000000', 0.2 * a, blur=14)); c.drawPath(p, P('#ffffff', a)); c.save(); c.translate(x, y); c.scale(0.86, 0.86); c.translate(-x, -y); c.drawPath(p, P(col, a)); c.restore()


def rocket(c, x, y, s, a=1.0, flame=0.0):
    body = skia.Path(); body.moveTo(x, y - s); body.cubicTo(x + s * 0.45, y - s * 0.6, x + s * 0.35, y + s * 0.4, x + s * 0.3, y + s * 0.55); body.lineTo(x - s * 0.3, y + s * 0.55); body.cubicTo(x - s * 0.35, y + s * 0.4, x - s * 0.45, y - s * 0.6, x, y - s); body.close()
    for sg in (-1, 1):
        fin = skia.Path(); fin.moveTo(x + sg * s * 0.28, y + s * 0.15); fin.lineTo(x + sg * s * 0.6, y + s * 0.7); fin.lineTo(x + sg * s * 0.25, y + s * 0.55); fin.close(); c.drawPath(fin, P('#ff3b30', a))
    if flame > 0:
        fl = skia.Path(); fl.moveTo(x - s * 0.22, y + s * 0.55); fl.quadTo(x, y + s * (0.9 + 0.5 * flame), x + s * 0.22, y + s * 0.55); fl.close(); c.drawPath(fl, P('#ff9500', a)); c.save(); c.translate(x, y + s * 0.55); c.scale(0.55, 0.6); c.translate(-x, -(y + s * 0.55)); c.drawPath(fl, P('#ffd60a', a)); c.restore()
    c.drawPath(body, P('#ffffff', a, stroke=s * 0.08)); c.drawPath(body, P('#f2f2f7', a)); c.drawCircle(x, y - s * 0.3, s * 0.16, P('#0a84ff', a)); c.drawCircle(x, y - s * 0.3, s * 0.16, P('#8e8e93', a, stroke=s * 0.05))


# ------------------------------------------------------------------ the graphics
NUM_WORDS = {"one": 1, "two": 2, "three": 3, "four": 4, "five": 5, "six": 6, "seven": 7, "eight": 8, "nine": 9, "ten": 10}


class Graphics:
    def __init__(self, tl, seg_by, chap_by):
        self.tl, self.seg_by = tl, seg_by
        self.segs = tl["segments"]
        self.cards = [(c["start"], c["end"], c) for c in tl["chapters"]]
        ev = tl["events"][0]; self.title = (ev["start"], ev["end"])
        self.outro = tl["outro"]["start"]; self.total = tl["total"]
        for i, s in enumerate(self.segs):
            s["until"] = self.segs[i + 1]["start"] if i + 1 < len(self.segs) else self.outro
        self.words = {}

    def wt(self, sid):
        if sid not in self.words:
            try: self.words[sid] = wordtimes.word_times(sid)
            except Exception: self.words[sid] = []
        return self.words[sid]

    def seg_at(self, t):
        for s in self.segs:
            if s["start"] - 0.05 <= t < s["until"]: return s
        return None


def draw_over(out, G, t):
    rgba = np.dstack([out, np.full(out.shape[:2], 255, np.uint8)])
    c = skia.Surface(rgba).getCanvas()
    # ---- title
    t0, t1 = G.title
    if t0 - 0.2 <= t < t1:
        u = t - t0; a = clamp((t1 - t) / 0.4)
        for k, col in enumerate(['#ff3b30', '#ff9500', '#ffd60a', '#34c759', '#0a84ff', '#af52de']):
            r = 520 - k * 34; sweep = 180 * clamp(u / 1.0 - k * 0.05)
            c.drawArc(skia.Rect(W / 2 - r, 640 - r, W / 2 + r, 640 + r), 180, sweep, False, P(col, 0.92 * a, stroke=36))
        bubbly(c, "THE LITTLE AIs", W / 2, 470, 150, '#ff3b30', a, eob((u - 0.5) / 0.5))
        sub = "Colors  •  Numbers  •  Animals"
        bubbly(c, sub, W / 2, 610, 74, '#0a84ff', a * clamp((u - 1.2) / 0.4), 1.0)
        for k in range(6): star(c, 260 + k * 280, 820 + 30 * math.sin(u * 3 + k), 26 + 8 * math.sin(u * 4 + k * 2), list(HEX.values())[k], a * clamp((u - 1.5) / 0.4), u)
    # ---- chapter cards
    for c0, c1, ch in G.cards:
        if c0 - 0.1 <= t < c1:
            u = t - c0; a = clamp((c1 - t) / 0.35); s = eob(u / 0.45)
            c.drawRect(skia.Rect(0, 0, W, H), P('#000000', 0.18 * a))
            confetti(c, u, seed=int(c0), a=a)
            w = OV.text_width(ch["title"] + "!", 'poppins', 150) + 160
            c.save(); c.translate(W / 2, H / 2); c.scale(s, s); c.rotate(-3 + 3 * math.sin(u * 3)); c.translate(-W / 2, -H / 2)
            panel(c, W / 2 - w / 2, H / 2 - 150, W / 2 + w / 2, H / 2 + 130, ch["color"], a)
            bubbly(c, ch["title"] + "!", W / 2, H / 2 + 50, 150, '#ffffff', a, 1.0, stroke='#222222', sw=18)
            c.restore()
            return rgba[..., :3]
    # ---- per segment cues
    s = G.seg_at(t)
    if s and s.get("gfx") and t < G.outro:
        g = s["gfx"]; u = t - s["start"]; a = clamp((s["until"] - t) / 0.3) * clamp((u + 0.05) / 0.2)
        typ = g["type"]
        if typ == "color":
            col = HEX[g["color"]]; first = s["id"].endswith("a"); uu = u if first else u + 2
            icon(c, g["icon"], 1600, 300, 150 * eob(uu / 0.45), a)
            fill = col if g["color"] != "white" else '#ffffff'
            bubbly(c, g["color"].upper(), W / 2, 980, 150, fill, a, eob(uu / 0.4), stroke='#ffffff' if g["color"] not in ("white", "yellow") else '#222222')
        elif typ == "say":
            col = HEX[g["color"]]; s1 = eob(u / 0.4)
            bubble(c, 560, 230, 760, 170, a * s1)
            w1 = OV.text_width("Can you say ", 'poppins', 64); w2 = OV.text_width(g["color"].upper() + "?", 'poppins', 64)
            x0 = 560 - (w1 + w2) / 2
            bubbly(c, "Can you say ", x0, 255, 64, '#333333', a * s1, 1.0, align='left', stroke='#ffffff', sw=2)
            bubbly(c, g["color"].upper() + "?", x0 + w1, 255, 64, col if g["color"] != "white" else '#9aa0a6', a * s1, 1.0, align='left', stroke='#ffffff' if g["color"] != "white" else '#555555', sw=8)
            if u > 1.2:   # pulsing ear/mic dots while the child answers
                for k in range(3): c.drawCircle(1040 + k * 46, 250, 12 + 6 * max(0, math.sin(u * 6 - k)), P(col if g["color"] != "white" else '#9aa0a6', a))
        elif typ == "star":
            col = HEX[g["color"]]
            bubbly(c, g["color"].upper() + "!", W / 2, 980, 150, col if g["color"] != "white" else '#ffffff', a, eob(u / 0.35) * (1 + 0.04 * math.sin(u * 8)), stroke='#ffffff' if g["color"] not in ("white", "yellow") else '#222222')
            sparkle_burst(c, W / 2, 520, u, '#ffd60a', 10, 380)
        elif typ == "rainbow":
            words = G.wt(s["id"]); xs = []
            names = [w.strip(",.!").lower() for w, _ in words if w.strip(",.!").lower() in HEX]
            shown = [(w.strip(",.!").lower(), wt) for w, wt in words if w.strip(",.!").lower() in HEX]
            size = 66; gap = 26; tot = sum(OV.text_width(n.upper(), 'poppins', size) for n in names) + gap * (len(names) - 1)
            if tot > W - 140: k = (W - 140) / tot; size *= k; gap *= k; tot = W - 140
            x = W / 2 - tot / 2
            for n, wt in shown:
                ww = OV.text_width(n.upper(), 'poppins', size)
                if u >= wt - 0.05:
                    bubbly(c, n.upper(), x + ww / 2, 1010, size, HEX[n] if n != "white" else '#ffffff', a, eob((u - wt) / 0.3), stroke='#ffffff' if n not in ("white", "yellow") else '#222222', sw=12)
                x += ww + gap
        elif typ == "find":
            col = HEX[g["color"]]; s1 = eob(u / 0.4)
            panel(c, W / 2 - 360, 80, W / 2 + 360, 250, '#ffffff', a * s1)
            bubbly(c, "FIND " + g["color"].upper() + "!", W / 2, 200, 96, col, a * s1, 1.0, stroke='#ffffff' if g["color"] != "white" else '#555555')
            # magnifying glass
            gx, gy = W / 2 + 480 + 20 * math.sin(u * 2), 165 + 10 * math.cos(u * 2)
            c.drawCircle(gx, gy, 50, P('#ffffff', a * 0.6)); c.drawCircle(gx, gy, 50, P('#6b3e1f', a * s1, stroke=14)); c.drawLine(gx + 36, gy + 36, gx + 90, gy + 90, P('#6b3e1f', a * s1, stroke=20))
        elif typ == "found":
            col = HEX[g["color"]]
            bubbly(c, g["color"].upper() + "!", W / 2, 200, 130, col, a, eob(u / 0.35), stroke='#ffffff' if g["color"] != "white" else '#555555')
            sparkle_burst(c, W / 2, 160, u, '#ffd60a', 10, 330)
        elif typ == "num":
            n = g["n"]; col = HEX[g["color"]]; s1 = eob(u / 0.35)
            bubbly(c, str(n), W / 2, 560, 360, col if g["color"] != "white" else '#ffffff', a, s1, stroke='#ffffff' if g["color"] not in ("white", "yellow") else '#222222', sw=34)
            bubbly(c, SK.NUMW[n - 1].upper(), W / 2, 720, 90, '#ffffff', a, s1, stroke='#222222', sw=14)
            r = 30; gap = 22; x0 = W / 2 - (n * 2 * r + (n - 1) * gap) / 2 + r
            for k in range(n):
                kc = HEX[SK.KIDS[k]] if not g.get("hold") else HEX[SK.KIDS[k]]
                c.drawCircle(x0 + k * (2 * r + gap) + 4, 905, r, P('#000000', 0.2 * a, blur=6)); c.drawCircle(x0 + k * (2 * r + gap), 900, r + 6, P('#ffffff', a)); c.drawCircle(x0 + k * (2 * r + gap), 900, r, P(kc, a))
            if g.get("hold"): confetti(c, u, seed=7, a=a)
        elif typ in ("countdown", "claps", "count3"):
            words = G.wt(s["id"]); cur = None
            for w, wt in words:
                key = w.strip(",.!").lower()
                if key in NUM_WORDS and u >= wt - 0.05: cur = (NUM_WORDS[key], wt)
            if cur:
                n, wt = cur; uu = u - wt
                col = HEX[SK.KIDS[(n - 1) % 10]]
                if typ == "countdown":
                    bubbly(c, str(n), W / 2, 640, 420, col, a, eob(uu / 0.25) * (1.15 - 0.15 * clamp(uu / 0.5)), stroke='#ffffff', sw=36)
                    rocket(c, 1650, 620, 150, a)
                elif typ == "claps":
                    bubbly(c, str(n), W / 2, 600, 300, col, a, eob(uu / 0.25), stroke='#ffffff', sw=30)
                    sparkle_burst(c, W / 2, 470, uu * 1.6, '#ffd60a', 8, 300)
                else:
                    for k in range(n):
                        bubbly(c, str(k + 1), W / 2 + (k - (n - 1) / 2) * 260, 300, 200, HEX[SK.KIDS[k + 1]], a, 1.0 if k < n - 1 else eob(uu / 0.3), stroke='#ffffff', sw=24)
        elif typ == "blast":
            yb = 620 - 900 * clamp(u / 1.6) ** 1.6
            rocket(c, 1650, yb, 150, a, flame=1.0 + 0.3 * math.sin(u * 30))
            bubbly(c, "BLAST OFF!", W / 2, 560, 190, '#ff3b30', a, eob(u / 0.3), rot=-4, stroke='#ffffff', sw=26)
            confetti(c, u, seed=11, a=a)
        elif typ == "animal":
            name = g["name"].upper(); s1 = eob(u / 0.4)
            w = OV.text_width(name, 'poppins', 110) + 140
            panel(c, 120, 820, 120 + w, 1010, '#34c759' if g["name"] != "mammoth" else '#a2703f', a * s1)
            bubbly(c, name, 120 + w / 2, 955, 110, '#ffffff', a * s1, 1.0, stroke='#222222', sw=14)
        elif typ == "sound":
            s1 = eob(u / 0.3) * (1 + 0.05 * math.sin(u * 14))
            c.save(); c.translate(1380, 330); c.scale(s1, s1); c.translate(-1380, -330)
            burst(c, 1380, 330, 260, '#ffd60a', a, u * 0.5)
            bubbly(c, g["text"], 1380, 370, 120 if len(g["text"]) < 7 else 90, '#ff3b30', a, 1.0, rot=-6, stroke='#ffffff', sw=18)
            c.restore()
        elif typ == "opp":
            words = [w.strip(",.!").lower() for w, _ in G.wt(s["id"])]
            wts = G.wt(s["id"])
            on_b = any(w.strip(",.!").lower() in (g["b"].lower(), "slow", "down", "sad", "night", "small", "sits", "nighttime!") and u >= wt for w, wt in wts)
            for k, (lab, xx, col) in enumerate([(g["a"], W / 2 - 430, '#0a84ff'), (g["b"], W / 2 + 430, '#ff3b30')]):
                active = (k == 1) == on_b or s["id"] in ("o02", "o04", "o06")
                al = a * (1.0 if active else 0.45)
                panel(c, xx - 340, 860, xx + 340, 1040, col, al * eob(u / 0.4))
                bubbly(c, lab, xx, 990, 110, '#ffffff', al * eob(u / 0.4), 1.0 + (0.08 * math.sin(u * 7) if active else 0), stroke='#222222', sw=14)
        elif typ == "dance":
            col = ['#ff3b30', '#0a84ff', '#34c759', '#af52de'][int(s["id"][-1]) % 4]
            bubbly(c, g["word"], W / 2, 300 + 18 * math.sin(u * 9), 210, col, a, eob(u / 0.3), rot=6 * math.sin(u * 5), stroke='#ffffff', sw=28)
            for k in range(8): star(c, 200 + k * 220, 120 + 50 * math.sin(u * 4 + k), 24, list(HEX.values())[k], a, u * 2 + k)
    # ---- goodbye card
    if t >= G.outro:
        u = t - G.outro; a = clamp(u / 0.5)
        panel(c, W / 2 - 620, 160, W / 2 + 620, 520, '#ffd60a', a * eob(u / 0.5))
        bubbly(c, "BYE-BYE!", W / 2, 330, 160, '#ff3b30', a * eob(u / 0.5), 1.0, stroke='#ffffff', sw=22)
        bubbly(c, "See you next time!", W / 2, 460, 80, '#0a84ff', a * clamp((u - 0.6) / 0.4), 1.0, stroke='#ffffff', sw=14)
        for k in range(10): star(c, 180 + k * 175, 700 + 40 * math.sin(u * 2.5 + k), 30, list(HEX.values())[k], a * clamp((u - 1.0) / 0.5), u + k)
        confetti(c, u, seed=21, a=a * clamp(2.5 - u * 0.2))
    return rgba[..., :3]
