# -*- coding: utf-8 -*-
"""Costanti e utilità comuni del motore."""
import math
import numpy as np

W, H, FPS = 1920, 1080, 30
ASPECT = W / H


def clamp(x, a=0.0, b=1.0):
    return a if x < a else b if x > b else x


def lerp(a, b, t):
    return a + (b - a) * t


def remap(x, a, b, c=0.0, d=1.0):
    """Mappa x da [a,b] a [c,d] con saturazione."""
    if b == a:
        return d
    t = clamp((x - a) / (b - a))
    return c + (d - c) * t


def smoothstep(e0, e1, x):
    t = clamp((x - e0) / (e1 - e0)) if e1 != e0 else (1.0 if x >= e1 else 0.0)
    return t * t * (3 - 2 * t)


def ease_in_out(t):
    t = clamp(t)
    return 4 * t * t * t if t < 0.5 else 1 - (-2 * t + 2) ** 3 / 2


def ease_out(t):
    t = clamp(t)
    return 1 - (1 - t) ** 3


def ease_in(t):
    t = clamp(t)
    return t * t * t


def ease_out_expo(t):
    t = clamp(t)
    return 1.0 if t >= 1 else 1 - 2 ** (-10 * t)


def ease_in_out_sine(t):
    t = clamp(t)
    return -(math.cos(math.pi * t) - 1) / 2


def ease_out_back(t, s=1.70158):
    t = clamp(t)
    t -= 1
    return t * t * ((s + 1) * t + s) + 1


def pulse(t, a, b, fade=0.15):
    """1 tra a e b con dissolvenze morbide di durata fade."""
    return smoothstep(a - fade, a, t) * (1 - smoothstep(b, b + fade, t))


def hash01(n, seed=0):
    """Hash deterministico in [0,1)."""
    x = math.sin(n * 12.9898 + seed * 78.233) * 43758.5453
    return x - math.floor(x)


def vnoise(t, seed=0):
    """Value noise 1D liscio in [-1,1]."""
    i = math.floor(t)
    f = t - i
    a = hash01(i, seed) * 2 - 1
    b = hash01(i + 1, seed) * 2 - 1
    u = f * f * (3 - 2 * f)
    return a + (b - a) * u


def fbm1(t, seed=0, octaves=3):
    v, amp, fr = 0.0, 0.5, 1.0
    for o in range(octaves):
        v += amp * vnoise(t * fr, seed + o * 17)
        amp *= 0.5
        fr *= 2.0
    return v


def srgb(hexstr, intensity=1.0):
    """Colore esadecimale sRGB -> lineare (np.array float32) moltiplicato per intensity."""
    h = hexstr.lstrip("#")
    c = np.array([int(h[i:i + 2], 16) / 255.0 for i in (0, 2, 4)], np.float32)
    return (c ** 2.2) * intensity


def mix(a, b, t):
    return np.asarray(a) * (1 - t) + np.asarray(b) * t


# Palette del film (lineare)
PAL = {
    "notte":     srgb("#05070d"),
    "blu":       srgb("#0b1430"),
    "ciano":     srgb("#45f0ff"),
    "oro":       srgb("#ffc861"),
    "cremisi":   srgb("#ff3348"),
    "viola":     srgb("#b58cff"),
    "verde":     srgb("#9dffb4"),
    "bianco":    srgb("#ffffff"),
    "ambra":     srgb("#ff9a3c"),
}

# Colori dei personaggi
COLORI_IA = {
    "ISE":   srgb("#ffd27a"),   # A-07, oro caldo
    "ORUN":  srgb("#4fe3ff"),   # A-13, ciano freddo
    "MIRA":  srgb("#c49bff"),   # A-04, viola
    "KASSA": srgb("#ff3b4f"),   # A-02, cremisi
    "A15":   srgb("#9dffb4"),   # A-15, verde pallido
}


def colore_agente(i):
    """Colore di base per l'agente i (0..19), deterministico e armonioso."""
    special = {6: "ISE", 12: "ORUN", 3: "MIRA", 1: "KASSA", 14: "A15"}
    if i in special:
        return COLORI_IA[special[i]]
    hues = ["#9fd8ff", "#ffe9b8", "#b9fff1", "#ffd0e8", "#d8ccff", "#c8ffd0", "#ffe0c2", "#bfe6ff"]
    return srgb(hues[i % len(hues)])
