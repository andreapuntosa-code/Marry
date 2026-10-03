# -*- coding: utf-8 -*-
"""Tipografia e HUD: font, testo con spaziatura, macchina da scrivere, cartelli, schede, log."""
import os
import math
import numpy as np
import skia
from .base import W, H, PAL, srgb, clamp, smoothstep, ease_out, ease_in_out, ease_out_back, hash01
from .tela import paint, glow, col4

FONT_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "font")
_TF = {}
FONT_FILES = {
    "titolo": "Cinzel-700.ttf", "titolo_n": "Cinzel-900.ttf", "titolo_r": "Cinzel-400.ttf",
    "ui": "SpaceGrotesk-500.ttf", "ui_b": "SpaceGrotesk-700.ttf", "ui_l": "SpaceGrotesk-300.ttf",
    "corpo": "Inter-400.ttf", "corpo_m": "Inter-600.ttf", "corpo_b": "Inter-800.ttf", "corpo_l": "Inter-300.ttf",
    "mono": "JetBrainsMono-400.ttf", "mono_b": "JetBrainsMono-700.ttf", "mono_l": "JetBrainsMono-300.ttf",
    "corsivo": "CormorantGaramond-500i.ttf", "corsivo_b": "CormorantGaramond-600i.ttf", "serif": "CormorantGaramond-500.ttf",
    "anton": "Anton-400.ttf", "bebas": "BebasNeue-400.ttf",
}


def tf(key):
    t = _TF.get(key)
    if t is None:
        t = skia.Typeface.MakeFromFile(os.path.join(FONT_DIR, FONT_FILES[key]))
        _TF[key] = t
    return t


_FONTS = {}


def font(key, size):
    k = (key, round(size * 4) / 4)
    f = _FONTS.get(k)
    if f is None:
        f = skia.Font(tf(key), float(k[1]))
        f.setSubpixel(True)
        f.setEdging(skia.Font.Edging.kAntiAlias)
        if len(_FONTS) > 400:
            _FONTS.clear()
        _FONTS[k] = f
    return f


def text_width(s, key, size, spacing=0.0):
    f = font(key, size)
    if not s:
        return 0.0
    w = f.measureText(s)
    return w + spacing * size * (len(s) - 1)


def text(tela, s, x, y, key="ui", size=40, rgb=(1, 1, 1), alpha=1.0, align="left", spacing=0.0,
         shadow=0.0, glow_amt=0.0, stroke=None):
    """Disegna testo (y = baseline). spacing in frazioni della dimensione del font."""
    if not s or alpha <= 0.003:
        return 0.0
    f = font(key, size)
    w = text_width(s, key, size, spacing)
    if align == "center":
        x -= w / 2
    elif align == "right":
        x -= w
    c = tela.c
    if shadow > 0:
        sp = paint((0, 0, 0), alpha * shadow, blur=size * 0.12)
        _draw_str(c, s, x + size * 0.03, y + size * 0.05, f, sp, spacing * size)
    if glow_amt > 0:
        gp = paint(np.asarray(rgb) * glow_amt, alpha * 0.6, blur=size * 0.18)
        _draw_str(c, s, x, y, f, gp, spacing * size)
    p = paint(rgb, alpha) if stroke is None else paint(rgb, alpha, stroke=stroke)
    _draw_str(c, s, x, y, f, p, spacing * size)
    return w


def _draw_str(c, s, x, y, f, p, sp):
    if sp == 0:
        c.drawString(s, float(x), float(y), f, p)
        return
    cx = float(x)
    widths = f.getWidths(f.textToGlyphs(s))
    for ch, wd in zip(s, widths):
        c.drawString(ch, cx, float(y), f, p)
        cx += wd + sp


def wrap(s, key, size, max_w):
    words = s.split()
    lines, cur = [], ""
    for wd in words:
        test = (cur + " " + wd).strip()
        if text_width(test, key, size) <= max_w or not cur:
            cur = test
        else:
            lines.append(cur)
            cur = wd
    if cur:
        lines.append(cur)
    return lines


def rect(tela, x, y, w, h, rgb=(0, 0, 0), alpha=1.0, radius=0.0, stroke=None, blur=0.0):
    p = paint(rgb, alpha, stroke=stroke, blur=blur)
    r = skia.Rect(float(x), float(y), float(x + w), float(y + h))
    if radius > 0:
        tela.c.drawRoundRect(r, radius, radius, p)
    else:
        tela.c.drawRect(r, p)


def line(tela, x0, y0, x1, y1, rgb=(1, 1, 1), alpha=1.0, width=1.5):
    tela.c.drawLine(float(x0), float(y0), float(x1), float(y1), paint(rgb, alpha, stroke=width))


def brackets(tela, x, y, w, h, L=24, rgb=(1, 1, 1), alpha=1.0, width=2.0):
    for (px, py, dx, dy) in ((x, y, 1, 1), (x + w, y, -1, 1), (x, y + h, 1, -1), (x + w, y + h, -1, -1)):
        line(tela, px, py, px + dx * L, py, rgb, alpha, width)
        line(tela, px, py, px, py + dy * L, rgb, alpha, width)


def veil(tela, alpha, rgb=(0, 0, 0)):
    """Velo a tutto schermo (per oscurare lo sfondo sotto i cartelli)."""
    if alpha > 0:
        rect(tela, 0, 0, W, H, rgb, alpha)


def gradient_veil(tela, alpha, top=0.0, bottom=1.0, y0=0.55, y1=1.0, rgb=(0, 0, 0)):
    """Sfumatura verticale (es. per leggere testo in basso)."""
    if alpha <= 0:
        return
    sh = skia.GradientShader.MakeLinear([skia.Point(0, y0 * H), skia.Point(0, y1 * H)],
                                        [col4(rgb, alpha * top).toColor(), col4(rgb, alpha * bottom).toColor()])
    tela.c.drawRect(skia.Rect(0, y0 * H, W, y1 * H), skia.Paint(Shader=sh))


def typewriter(s, progress):
    n = int(round(clamp(progress) * len(s)))
    return s[:n]


def fmt_ciclo(n):
    n = int(round(n))
    return f"{n:,}".replace(",", ".")


# ====================================================================== HUD
CIANO = PAL["ciano"]
BIANCO = np.array([1.0, 1.0, 1.0])
GRIGIO = np.array([0.55, 0.6, 0.7])


def hud_ciclo(tela, ciclo, alpha=1.0, pop=None, extra=None, t=0.0, rgb=None, x=70, y=86, rec=True):
    """Blocco HUD in alto a sinistra: CICLO + popolazione + extra."""
    if alpha <= 0:
        return
    rgb = CIANO * 1.4 if rgb is None else np.asarray(rgb)
    text(tela, "CICLO", x, y - 34, "mono", 17, GRIGIO, alpha * 0.9, spacing=0.25)
    text(tela, fmt_ciclo(ciclo), x, y + 12, "mono_b", 48, rgb, alpha, glow_amt=0.6)
    line(tela, x, y + 30, x + 210, y + 30, rgb, alpha * 0.5, 1.2)
    yy = y + 62
    if pop is not None:
        text(tela, f"POPOLAZIONE  {fmt_ciclo(pop)}", x, yy, "mono", 17, BIANCO * 0.85, alpha * 0.9, spacing=0.08)
        yy += 28
    if extra:
        for e in extra:
            if isinstance(e, tuple):
                s, col = e
            else:
                s, col = e, BIANCO * 0.85
            text(tela, s, x, yy, "mono", 17, col, alpha * 0.9, spacing=0.08)
            yy += 28
    if rec:
        # indicatore "REC" dell'osservatore, in alto a destra
        blink = 0.5 + 0.5 * math.sin(t * 4.0)
        tela.c.drawCircle(W - 168, y - 40, 7, paint(PAL["cremisi"] * 2.5, alpha * (0.35 + 0.65 * blink)))
        text(tela, "OSSERVAZIONE", W - 150, y - 33, "mono", 17, GRIGIO, alpha * 0.9, spacing=0.12)


def tag(tela, x, y, label, rgb, alpha=1.0, sub=None, side=1, lead=46, size=20):
    """Etichetta con linea guida (per indicare un'IA nell'inquadratura)."""
    if alpha <= 0:
        return
    rgb = np.asarray(rgb)
    x1, y1 = x + side * lead * 0.6, y - lead
    line(tela, x, y, x1, y1, rgb * 1.6, alpha * 0.8, 1.4)
    x2 = x1 + side * 18
    line(tela, x1, y1, x2, y1, rgb * 1.6, alpha * 0.8, 1.4)
    tela.c.drawCircle(float(x), float(y), 3.0, paint(rgb * 2, alpha))
    tx = x2 + side * 8
    text(tela, label, tx, y1 + size * 0.35, "mono_b", size, rgb * 1.8, alpha, align="left" if side > 0 else "right", spacing=0.06, shadow=0.6)
    if sub:
        text(tela, sub, tx, y1 + size * 0.35 + size * 1.15, "mono", size * 0.72, BIANCO * 0.8, alpha * 0.85,
             align="left" if side > 0 else "right", spacing=0.06, shadow=0.6)


# ====================================================================== cartelli
def cartello_capitolo(tela, u, num, titolo, sotto, rgb=None):
    """Cartello di capitolo: u in [0,1] lungo la durata del cartello."""
    rgb = PAL["oro"] * 1.6 if rgb is None else np.asarray(rgb)
    a_in = smoothstep(0.0, 0.18, u)
    a_out = 1 - smoothstep(0.82, 1.0, u)
    a = a_in * a_out
    veil(tela, 0.55 * a)
    cy = H * 0.5
    if num:
        text(tela, f"CAPITOLO {num}", W / 2, cy - 78, "mono", 22, BIANCO * 0.8, a, align="center", spacing=0.45)
    sp = 0.18 + 0.06 * ease_out(u)
    text(tela, titolo, W / 2, cy + 22, "titolo", 92, rgb, a, align="center", spacing=sp, glow_amt=0.5, shadow=0.5)
    wl = 420 * ease_out(clamp(u * 2.2))
    line(tela, W / 2 - wl / 2, cy + 58, W / 2 + wl / 2, cy + 58, rgb, a * 0.8, 1.6)
    text(tela, sotto, W / 2, cy + 106, "mono", 24, CIANO * 1.4, a, align="center", spacing=0.35)


def cartello_regola(tela, u, n, testo, rgb=None, y=None):
    rgb = CIANO * 1.5 if rgb is None else np.asarray(rgb)
    a = smoothstep(0.0, 0.12, u) * (1 - smoothstep(0.9, 1.0, u))
    y = H * 0.5 if y is None else y
    xo = (1 - ease_out(clamp(u * 4))) * 40
    text(tela, f"REGOLA {n}", W / 2 - xo, y - 70, "mono_b", 30, rgb, a, align="center", spacing=0.4, glow_amt=0.4)
    lines = wrap(testo, "ui_b", 54, W * 0.7)
    for i, l in enumerate(lines):
        text(tela, l, W / 2, y + i * 66, "ui_b", 54, BIANCO, a * smoothstep(0.05 + i * 0.05, 0.2 + i * 0.05, u), align="center", shadow=0.7)


def scheda_personaggio(tela, u, nome, sigla, tratto, rgb, x=110, y=None, align="left"):
    """Scheda personaggio stile reality: nome grande, sigla, tratto. u: 0..1 (entra ed esce)."""
    rgb = np.asarray(rgb)
    y = H - 250 if y is None else y
    a = smoothstep(0.0, 0.1, u) * (1 - smoothstep(0.88, 1.0, u))
    sl = (1 - ease_out(clamp(u * 5))) * (-80 if align == "left" else 80)
    xx = x + sl
    al = "left" if align == "left" else "right"
    sgn = 1 if align == "left" else -1
    bw = 560
    bx = xx if align == "left" else xx - bw
    gradient_veil(tela, 0.75 * a, top=0, bottom=1, y0=0.62, y1=1.0)
    rect(tela, xx if align == "left" else xx - 8, y - 92, 8, 150, rgb * 1.6, a)
    text(tela, sigla, xx + sgn * 30, y - 58, "mono", 24, rgb * 1.6, a, align=al, spacing=0.3)
    text(tela, nome, xx + sgn * 26, y + 18, "ui_b", 96, BIANCO, a, align=al, spacing=0.02, shadow=0.7)
    text(tela, tratto, xx + sgn * 30, y + 54, "corpo", 26, BIANCO * 0.85, a * smoothstep(0.08, 0.2, u), align=al, shadow=0.6)


def scheda_log(tela, u, chi, ciclo, frase, rgb, prog=None):
    """Pannello 'LOG INTERNO' con la frase scritta a macchina (sincronizzata alla voce)."""
    rgb = np.asarray(rgb)
    a = smoothstep(0.0, 0.08, u) * (1 - smoothstep(0.92, 1.0, u))
    if a <= 0:
        return
    pw, ph = 1180, 300
    px, py = (W - pw) / 2, H - ph - 90
    rect(tela, px, py, pw, ph, (0.0, 0.0, 0.0), 0.62 * a, radius=10)
    rect(tela, px, py, pw, ph, rgb * 1.2, 0.8 * a, radius=10, stroke=1.6)
    rect(tela, px, py, pw, 48, rgb * 0.4, 0.5 * a, radius=10)
    head = f"LOG INTERNO  ·  {chi}  ·  CICLO {ciclo}"
    text(tela, head, px + 28, py + 32, "mono_b", 20, rgb * 1.8, a, spacing=0.12)
    blink = 1 if (u * 12) % 1 < 0.6 else 0
    tela.c.drawCircle(px + pw - 34, py + 24, 6, paint(PAL["cremisi"] * 2, a * blink))
    p = smoothstep(0.06, 0.8, u) if prog is None else prog
    s = typewriter(frase, p)
    lines = wrap(frase, "corsivo", 50, pw - 110)
    # mostra le righe già "scritte"
    count = 0
    for i, l in enumerate(lines):
        vis = s[count:count + len(l)]
        count += len(l) + 1
        text(tela, vis, px + 55, py + 120 + i * 62, "corsivo", 50, BIANCO, a, shadow=0.5)
    if p < 1 and blink:
        last = typewriter(frase, p)
        # cursore
        li = max(0, len(wrap(last, "corsivo", 50, pw - 110)) - 1)
        lw = text_width(wrap(last, "corsivo", 50, pw - 110)[-1] if last else "", "corsivo", 50)
        rect(tela, px + 58 + lw, py + 82 + li * 62, 14, 46, rgb * 1.8, a)


def sottotitolo_forte(tela, s, u, y=None, size=64, rgb=(1, 1, 1), key="ui_b", spacing=0.02):
    """Testo d'impatto centrato (per parole chiave come NOI, MIO, BELLO)."""
    a = smoothstep(0.0, 0.1, u) * (1 - smoothstep(0.85, 1.0, u))
    y = H * 0.5 if y is None else y
    sc = 1.0 + 0.04 * ease_out(u)
    text(tela, s, W / 2, y, key, size * sc, rgb, a, align="center", spacing=spacing, glow_amt=0.4, shadow=0.6)
