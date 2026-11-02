# -*- coding: utf-8 -*-
"""Alfabeto delle IA: glifi procedurali + glifi chiave disegnati a mano, con animazione del tratto."""
import math
import numpy as np
import skia
from .tela import paint, glow
from .base import clamp

# Ogni glifo è una lista di tratti; un tratto è una lista di punti (x,y) in [-1,1]
# oppure ("arc", cx, cy, r, start_deg, sweep_deg) oppure ("circle", cx, cy, r) oppure ("dot", cx, cy)
CHIAVE = {
    "ILA":   [[(0, 0.95), (0, -0.35)], ("circle", 0, -0.62, 0.28), [(-0.5, 0.95), (0.5, 0.95)]],
    "KRA":   [[(-0.75, -0.85), (0.15, -0.25), (-0.35, 0.15), (0.75, 0.9)], ("dot", 0.62, -0.7)],
    "NUA":   [("arc", 0, 0, 0.8, 120, 300), ("arc", 0.32, -0.08, 0.55, 140, 200)],
    "TOH":   [[(-0.8, -0.6), (0.1, 0.0), (-0.8, 0.6)], ("dot", 0.62, 0.0), ("circle", 0.62, 0.0, 0.22)],
    "BELLO": [("spiral", 0, 0, 0.85, 2.6)],
    "NOI":   [("circle", 0, 0, 0.85), ("dot", 0, -0.42), ("dot", -0.38, 0.28), ("dot", 0.38, 0.28),
              [(0, -0.42), (-0.38, 0.28), (0.38, 0.28), (0, -0.42)]],
    "MIO":   [("dot", 0.0, 0.1), ("arc", 0, 0.1, 0.55, 200, 300), [(0.52, -0.08), (0.52, 0.85)]],
    "OSSERVATORE": [("eye", 0, 0, 0.95, 0.5), ("circle", 0, 0, 0.3), ("dot", 0, 0)],
    "LEGGE": [[(-0.75, -0.8), (-0.75, 0.8)], [(0.75, -0.8), (0.75, 0.8)], ("dot", 0, 0), [(-0.75, 0), (-0.25, 0)], [(0.25, 0), (0.75, 0)]],
    "PERCHE": [("arc", 0, -0.3, 0.5, 180, 270), [(0.0, 0.2), (0.0, 0.5)], ("dot", 0, 0.85)],
    "IO":    [[(0, -0.85), (0, 0.85)], ("dot", 0, -0.2)],
    "TU":    [[(0, -0.85), (0, 0.85)], ("dot", 0.5, -0.2)],
    "MORTE": [("circle", 0, 0, 0.75), [(-0.55, -0.55), (0.55, 0.55)]],
}


def glifo_procedurale(seed):
    """Glifo casuale ma coerente con lo stile (2-4 tratti su griglia 3x3)."""
    rng = np.random.default_rng(seed + 1000)
    nodes = [(-0.8 + 0.8 * i, -0.8 + 0.8 * j) for j in range(3) for i in range(3)]
    strokes = []
    n = rng.integers(2, 5)
    for _ in range(n):
        kind = rng.random()
        if kind < 0.5:
            k = rng.integers(2, 4)
            idx = rng.choice(9, size=k, replace=False)
            strokes.append([nodes[i] for i in idx])
        elif kind < 0.75:
            cx, cy = nodes[rng.integers(0, 9)]
            strokes.append(("arc", cx * 0.5, cy * 0.5, 0.4 + 0.4 * rng.random(), float(rng.integers(0, 4) * 90), float(rng.choice([90, 180, 270]))))
        elif kind < 0.9:
            cx, cy = nodes[rng.integers(0, 9)]
            strokes.append(("dot", cx, cy))
        else:
            cx, cy = nodes[rng.integers(0, 9)]
            strokes.append(("circle", cx * 0.6, cy * 0.6, 0.22))
    return strokes


def _stroke_path(st, x, y, s):
    p = skia.Path()
    if isinstance(st, tuple):
        kind = st[0]
        if kind == "arc":
            _, cx, cy, r, a0, sw = st
            p.addArc(skia.Rect(x + (cx - r) * s, y + (cy - r) * s, x + (cx + r) * s, y + (cy + r) * s), a0, sw)
        elif kind == "circle":
            _, cx, cy, r = st
            p.addCircle(x + cx * s, y + cy * s, r * s)
        elif kind == "dot":
            return None
        elif kind == "spiral":
            _, cx, cy, r, turns = st
            n = 120
            for i in range(n + 1):
                f = i / n
                a = f * turns * 2 * math.pi
                rr = r * f
                px, py = x + (cx + math.cos(a) * rr) * s, y + (cy + math.sin(a) * rr) * s
                if i == 0:
                    p.moveTo(px, py)
                else:
                    p.lineTo(px, py)
        elif kind == "eye":
            _, cx, cy, r, hgt = st
            p.moveTo(x + (cx - r) * s, y + cy * s)
            p.quadTo(x + cx * s, y + (cy - hgt * 2) * s, x + (cx + r) * s, y + cy * s)
            p.quadTo(x + cx * s, y + (cy + hgt * 2) * s, x + (cx - r) * s, y + cy * s)
    else:
        p.moveTo(x + st[0][0] * s, y + st[0][1] * s)
        for (a, b) in st[1:]:
            p.lineTo(x + a * s, y + b * s)
    return p


def draw_glifo(tela, glyph, x, y, size, rgb, width=None, progress=1.0, alpha=1.0, glow_k=0.0, canvas=None):
    """Disegna il glifo centrato in (x,y) con semi-dimensione size. progress anima il tratto."""
    c = canvas if canvas is not None else tela.c
    width = max(1.0, size * 0.09) if width is None else width
    strokes = CHIAVE[glyph] if isinstance(glyph, str) else glyph
    n = len(strokes)
    pnt = paint(rgb, alpha, stroke=width)
    for i, st in enumerate(strokes):
        lp = clamp(progress * n - i)
        if lp <= 0:
            continue
        if isinstance(st, tuple) and st[0] == "dot":
            r = width * 0.9 * lp
            c.drawCircle(x + st[1] * size, y + st[2] * size, r, paint(rgb, alpha))
            continue
        path = _stroke_path(st, x, y, size)
        if path is None:
            continue
        if lp < 1:
            meas = skia.PathMeasure(path, False)
            L = meas.getLength()
            seg = skia.Path()
            meas.getSegment(0, L * lp, seg, True)
            path = seg
        if glow_k > 0:
            c.drawPath(path, paint(np.asarray(rgb) * glow_k, alpha * 0.5, stroke=width * 2.5, blur=width * 1.2))
        c.drawPath(path, pnt)


def parola(seed_or_key):
    return CHIAVE[seed_or_key] if isinstance(seed_or_key, str) else glifo_procedurale(seed_or_key)


def frase_glifi(testo, seed=0):
    """Converte una frase in una sequenza di glifi (un glifo per parola, deterministico)."""
    out = []
    for w in testo.upper().replace(",", " ").replace("?", " ").replace(".", " ").split():
        h = sum(ord(ch) * (i + 1) for i, ch in enumerate(w)) + seed
        out.append(glifo_procedurale(h))
    return out
