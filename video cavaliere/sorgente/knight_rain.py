#!/usr/bin/env python3
"""Knight in the rain: 30 s vertical chill dark-fantasy loop (1080x1920, 30 fps).

Procedural 2D render with skia + numpy:
- sky, moon behind moving clouds
- castle on a crag with flickering windows
- knight in profile with a sword planted in the ground and a lantern on the crossguard
- cape in the wind, rain in 3 depth layers, ground splashes, ripples in the puddle
- distant lightning, fog, bloom, film grain

Usage:
  python3 knight_rain.py preview 0,150,250,630      # PNG frames in ./preview
  python3 knight_rain.py render out.mp4 [--jobs 4]  # full video (silent) + rain audio
"""
import math
import os
import subprocess
import sys

import cv2
import numpy as np
import skia

W, H = 1080, 1920
FPS = 30
DUR = 30.0
N = int(DUR * FPS)
HERE = os.path.dirname(os.path.abspath(__file__))

SAMPLING = skia.SamplingOptions(skia.FilterMode.kLinear)

# Scene layout
MOON = (770.0, 330.0, 88.0)          # x, y, radius
GROUND_Y = 1640.0                     # knight feet
KX = 330.0                            # knight x (feet)
FOCUS = (560.0, 1150.0)               # camera push-in focus
LIGHTNING = [8.3, 21.0]               # seconds
BOLT_X = [170.0, 420.0]


def col(r, g, b, a=255):
    return skia.Color(int(r), int(g), int(b), int(a))


def smoothstep(a, b, x):
    t = np.clip((x - a) / (b - a), 0, 1)
    return t * t * (3 - 2 * t)


def ease(x):
    x = min(max(x, 0.0), 1.0)
    return x * x * (3 - 2 * x)


# ----------------------------------------------------------------------------
# path helpers
# ----------------------------------------------------------------------------

def smooth_path(pts, closed=True, tension=1.0):
    """Catmull-Rom through points. A point (x, y, 's') is a sharp corner."""
    P = [(float(p[0]), float(p[1])) for p in pts]
    sharp = [len(p) > 2 for p in pts]
    n = len(P)
    path = skia.Path()
    path.moveTo(*P[0])
    segs = n if closed else n - 1
    for i in range(segs):
        p0 = P[(i - 1) % n] if (closed or i > 0) else P[i]
        p1 = P[i]
        p2 = P[(i + 1) % n]
        p3 = P[(i + 2) % n] if (closed or i + 2 < n) else p2
        k = tension / 6.0
        c1 = p1 if sharp[i] else (p1[0] + (p2[0] - p0[0]) * k, p1[1] + (p2[1] - p0[1]) * k)
        c2 = p2 if sharp[(i + 1) % n] else (p2[0] - (p3[0] - p1[0]) * k, p2[1] - (p3[1] - p1[1]) * k)
        path.cubicTo(c1[0], c1[1], c2[0], c2[1], p2[0], p2[1])
    if closed:
        path.close()
    return path


def poly_path(pts, closed=True):
    path = skia.Path()
    path.moveTo(*pts[0])
    for p in pts[1:]:
        path.lineTo(*p)
    if closed:
        path.close()
    return path


def tube(p0, p1, w0, w1, caps=6):
    """Rounded tube (arm segments) as a point list for smooth_path."""
    dx, dy = p1[0] - p0[0], p1[1] - p0[1]
    L = math.hypot(dx, dy)
    ux, uy = dx / L, dy / L
    nx, ny = -uy, ux
    pts = []
    pts.append((p0[0] + nx * w0 / 2, p0[1] + ny * w0 / 2))
    pts.append((p1[0] + nx * w1 / 2, p1[1] + ny * w1 / 2))
    for k in range(1, caps):
        a = math.pi / 2 - math.pi * k / caps
        pts.append((p1[0] + (nx * math.sin(a) + ux * math.cos(a)) * w1 / 2,
                    p1[1] + (ny * math.sin(a) + uy * math.cos(a)) * w1 / 2))
    pts.append((p1[0] - nx * w1 / 2, p1[1] - ny * w1 / 2))
    pts.append((p0[0] - nx * w0 / 2, p0[1] - ny * w0 / 2))
    for k in range(1, caps):
        a = math.pi / 2 - math.pi * k / caps
        pts.append((p0[0] - (nx * math.sin(a) + ux * math.cos(a)) * w0 / 2,
                    p0[1] - (ny * math.sin(a) + uy * math.cos(a)) * w0 / 2))
    return pts


def band(x0, x1, ytop, h, curve, n=14, slope=0.0, flare=0.0):
    """Curved armour lame: top edge arches up by `curve`."""
    top, bot = [], []
    for i in range(n + 1):
        u = i / n
        x = x0 + (x1 - x0) * u
        arch = curve * math.sin(math.pi * u)
        y = ytop - arch + slope * (u - 0.5)
        top.append((x, y))
        bot.append((x + flare * (u - 0.5) * 2, y + h + flare * 0.15))
    pts = [top[0] + ('s',)] + top[1:-1] + [top[-1] + ('s',), bot[-1] + ('s',)] + bot[-2:0:-1] + [bot[0] + ('s',)]
    return pts


def offset_path(path, dx, dy):
    p = skia.Path(path)
    p.offset(dx, dy)
    return p


def rim(path, lx, ly, w):
    """Edge of `path` facing light direction (lx, ly)."""
    n = math.hypot(lx, ly)
    return skia.Op(path, offset_path(path, -lx / n * w, -ly / n * w), skia.PathOp.kDifference_PathOp)


def new_surface(w=W, h=H):
    info = skia.ImageInfo.Make(w, h, skia.kRGBA_8888_ColorType, skia.kPremul_AlphaType)
    return skia.Surface.MakeRaster(info)


def img_from_rgba(arr):
    arr = np.ascontiguousarray(arr)
    return skia.Image.fromarray(arr, colorType=skia.kRGBA_8888_ColorType, alphaType=skia.kUnpremul_AlphaType)


# ----------------------------------------------------------------------------
# noise
# ----------------------------------------------------------------------------

def fbm(h, w, octaves, base, seed, persistence=0.55):
    rng = np.random.default_rng(seed)
    out = np.zeros((h, w), np.float32)
    amp, tot = 1.0, 0.0
    cell = base
    for _ in range(octaves):
        gh, gw = max(2, int(h / cell) + 3), max(2, int(w / cell) + 3)
        g = rng.random((gh, gw)).astype(np.float32)
        up = cv2.resize(g, (int(gw * cell), int(gh * cell)), interpolation=cv2.INTER_CUBIC)
        out += amp * up[:h, :w]
        tot += amp
        amp *= persistence
        cell /= 2.0
    return out / tot


def ridge(width, base_y, amp, seed, rough=0.55, step=4):
    rng = np.random.default_rng(seed)
    n = 257
    y = np.zeros(n)
    y[0], y[-1] = rng.normal(0, 1), rng.normal(0, 1)
    size, scale = n - 1, 1.0
    while size > 1:
        half = size // 2
        for i in range(half, n - 1, size):
            y[i] = (y[i - half] + y[i + half]) / 2 + rng.normal(0, scale)
        scale *= rough
        size = half
    y = (y - y.min()) / (y.max() - y.min() + 1e-6)
    xs = np.linspace(-40, width + 40, n)
    return [(float(xs[i]), float(base_y - y[i] * amp)) for i in range(n)]


# ----------------------------------------------------------------------------
# static layers
# ----------------------------------------------------------------------------

def make_sky():
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    t = np.clip(yy / 1150.0, 0, 1) ** 1.3
    top = np.array([4, 7, 13], np.float32)
    hor = np.array([30, 44, 60], np.float32)
    rgb = top[None, None, :] * (1 - t[..., None]) + hor[None, None, :] * t[..., None]
    mx, my, mr = MOON
    d = np.sqrt((xx - mx) ** 2 + (yy - my) ** 2)
    glow = np.exp(-np.maximum(d - mr, 0) / 260.0) * 0.55 + np.exp(-np.maximum(d - mr, 0) / 60.0) * 0.5
    rgb += glow[..., None] * np.array([70, 92, 112], np.float32)[None, None, :]
    # moon disk with soft maria
    disk = smoothstep(mr + 1.5, mr - 1.5, d)
    mar = fbm(H, W, 4, 60, 7)
    mar = cv2.GaussianBlur(mar, (0, 0), 3)
    shade = 0.82 + 0.18 * smoothstep(0.35, 0.65, mar)
    limb = 1 - 0.18 * (d / mr) ** 4
    moon = np.array([226, 233, 236], np.float32)[None, None, :] * (shade * limb)[..., None]
    rgb = rgb * (1 - disk[..., None]) + moon * disk[..., None]
    a = np.full((H, W, 1), 255, np.float32)
    return img_from_rgba(np.concatenate([np.clip(rgb, 0, 255), a], -1).astype(np.uint8))


def make_mountains():
    s = new_surface()
    c = s.getCanvas()
    c.clear(0)
    layers = [
        (ridge(W, 1010, 210, 11), (24, 34, 46)),
        (ridge(W, 1090, 150, 23, rough=0.6), (17, 25, 35)),
    ]
    for pts, rgb in layers:
        path = poly_path(pts + [(W + 40, H), (-40, H)])
        paint = skia.Paint(AntiAlias=True)
        top = min(p[1] for p in pts)
        paint.setShader(skia.GradientShader.MakeLinear(
            [(0, top), (0, 1200)], [col(*rgb), col(rgb[0] + 18, rgb[1] + 24, rgb[2] + 30)]))
        c.drawPath(path, paint)
    return s.makeImageSnapshot()


CASTLE_WINDOWS = []


def make_castle(flash=False):
    """Castle on a crag. Returns image. Also fills CASTLE_WINDOWS (x, y, w, h)."""
    s = new_surface()
    c = s.getCanvas()
    c.clear(0)
    body = (13, 19, 27) if not flash else (58, 70, 86)
    paint = skia.Paint(AntiAlias=True, Color=col(*body))
    shapes = []

    # crag: jagged rocky spur fading into the valley fog
    crag = [(560, 1400), (566, 1300), (552, 1240, 's'), (574, 1190), (566, 1140, 's'), (590, 1090), (586, 1040, 's'),
            (604, 1006), (640, 996), (700, 1004), (780, 998), (860, 1004), (930, 998), (990, 1012),
            (1010, 1040, 's'), (1030, 1060), (1024, 1110, 's'), (1050, 1160), (1046, 1220, 's'), (1070, 1300), (1080, 1400)]
    cp = skia.Paint(AntiAlias=True)
    cp.setShader(skia.GradientShader.MakeLinear([(0, 1000), (0, 1390)], [col(*body), col(36, 48, 62, 230) if not flash else col(70, 84, 100, 230), col(40, 54, 70, 0)], [0, 0.55, 1]))
    c.drawPath(smooth_path(crag), cp)
    shapes.append(skia.Path())

    def tower(cx, base, top, w, roof, kind='cone', spire=0.0):
        pts = [(cx - w / 2, base, 's'), (cx - w / 2, top, 's'), (cx + w / 2, top, 's'), (cx + w / 2, base, 's')]
        shapes.append(poly_path([p[:2] for p in pts]))
        if kind == 'cone':
            ow = w * 0.62
            cone = [(cx - ow - 2, top + 2)]
            for i in range(1, 12):
                u = i / 12
                # slightly concave gothic roof
                x = cx - ow + ow * u
                y = top - roof * (u ** 1.35)
                cone.append((x, y))
            cone.append((cx, top - roof))
            for i in range(11, 0, -1):
                u = i / 12
                x = cx + ow - ow * u
                y = top - roof * (u ** 1.35)
                cone.append((x, y))
            cone.append((cx + ow + 2, top + 2))
            shapes.append(poly_path(cone))
            if spire:
                shapes.append(poly_path([(cx - 1.6, top - roof + 2), (cx, top - roof - spire), (cx + 1.6, top - roof + 2)]))
        else:
            mw = w / 7.0
            for i in range(4):
                x0 = cx - w / 2 + i * 2 * mw
                shapes.append(poly_path([(x0, top + 1), (x0, top - mw * 1.2), (x0 + mw, top - mw * 1.2), (x0 + mw, top + 1)]))

    def wall(x0, x1, base, top):
        shapes.append(poly_path([(x0, base), (x0, top), (x1, top), (x1, base)]))
        mw = 9
        x = x0
        while x + mw < x1:
            shapes.append(poly_path([(x, top + 1), (x, top - 10), (x + mw, top - 10), (x + mw, top + 1)]))
            x += mw * 2

    wall(600, 1000, 1010, 905)
    tower(612, 1010, 830, 48, 85, 'cone', 26)
    tower(668, 1000, 770, 40, 70, 'cone', 20)
    tower(770, 1000, 560, 78, 150, 'cone', 70)       # keep, spire pierces the moon
    tower(722, 1000, 700, 46, 0, 'crenel')
    tower(838, 1000, 650, 54, 105, 'cone', 34)
    tower(920, 1010, 760, 50, 90, 'cone', 24)
    tower(985, 1020, 860, 40, 66, 'cone', 16)
    # flying bridge to a lone tower on the left
    shapes.append(poly_path([(540, 960), (600, 950), (600, 962), (546, 972)]))
    tower(532, 1100, 905, 34, 60, 'cone', 14)
    shapes.append(smooth_path([(510, 1110), (520, 1060), (548, 1060), (560, 1110), (552, 1200), (515, 1200)]))

    for sh in shapes:
        c.drawPath(sh, paint)
    # moon rim (light from above, slightly right) and lighter crag face
    rimp = skia.Paint(AntiAlias=True, Color=col(110, 135, 158, 110 if not flash else 170))
    for sh in shapes[1:]:
        c.drawPath(rim(sh, 0.35, -1.0, 1.4), rimp)
    if flash:
        rp2 = skia.Paint(AntiAlias=True, Color=col(170, 190, 225, 120))
        for sh in shapes[1:]:
            c.drawPath(rim(sh, -1.0, -0.4, 1.6), rp2)

    if not CASTLE_WINDOWS:
        CASTLE_WINDOWS.extend([
            (770, 640, 7, 12), (760, 720, 6, 10), (781, 720, 6, 10), (770, 830, 8, 13),
            (838, 700, 6, 10), (838, 790, 6, 10), (612, 870, 6, 10), (668, 820, 5, 9),
            (920, 800, 6, 10), (920, 880, 5, 9), (985, 900, 5, 9), (722, 760, 5, 9),
            (650, 940, 5, 8), (880, 945, 5, 8), (532, 940, 4, 8), (800, 950, 5, 8),
        ])
    return s.makeImageSnapshot()


def make_cliff(flash=False):
    s = new_surface()
    c = s.getCanvas()
    c.clear(0)
    top = [(-30, 1655), (60, 1640), (160, 1632), (260, 1634), (380, 1638), (520, 1640), (640, 1642),
           (730, 1650), (790, 1668), (830, 1700)]
    face = [(870, 1760), (900, 1830), (930, 1880), (960, 1940), (-30, 1940)]
    path = smooth_path(top + face)
    base = (7, 9, 12) if not flash else (40, 46, 56)
    p = skia.Paint(AntiAlias=True)
    p.setShader(skia.GradientShader.MakeLinear([(0, 1630), (0, 1920)], [col(*base), col(3, 4, 6) if not flash else col(20, 24, 30)]))
    c.drawPath(path, p)
    # top surface sheen (wet stone seen from slightly above)
    surf = smooth_path([(-30, 1650), (160, 1630), (520, 1636), (730, 1648), (800, 1672), (700, 1700), (400, 1705), (100, 1700), (-30, 1705)])
    sp = skia.Paint(AntiAlias=True)
    sp.setShader(skia.GradientShader.MakeLinear([(0, 1630), (0, 1705)], [col(30, 38, 48, 150 if not flash else 230), col(10, 13, 17, 0)]))
    c.drawPath(surf, sp)
    # cracks on the face
    rng = np.random.default_rng(5)
    cp = skia.Paint(AntiAlias=True, Style=skia.Paint.kStroke_Style, StrokeWidth=2, Color=col(22, 28, 36, 160 if not flash else 255))
    for i in range(14):
        x = rng.uniform(40, 860)
        y = rng.uniform(1720, 1900)
        pts = [(x, y)]
        for k in range(5):
            x += rng.uniform(-18, 30)
            y += rng.uniform(6, 26)
            pts.append((x, y))
        c.drawPath(poly_path(pts, closed=False), cp)
    rp = skia.Paint(AntiAlias=True, Color=col(95, 118, 140, 170 if not flash else 240))
    c.drawPath(rim(path, 0.4, -1.0, 2.5), rp)
    # rocks
    rocks = [smooth_path([(20, 1645), (40, 1600), (95, 1590), (130, 1615), (138, 1648)]),
             smooth_path([(120, 1640), (135, 1618), (170, 1612), (190, 1636)]),
             smooth_path([(640, 1648), (660, 1630), (700, 1628), (715, 1650)])]
    rkp = skia.Paint(AntiAlias=True, Color=col(*(base if not flash else (52, 60, 72))))
    for r in rocks:
        c.drawPath(r, rkp)
        c.drawPath(rim(r, 0.4, -1.0, 2.5), rp)
    return s.makeImageSnapshot()


def make_fog(w, h, seed, stretch=6):
    n = fbm(h // 4, w // (4 * stretch) + 4, 5, 18, seed)
    n = cv2.resize(n, (w, h), interpolation=cv2.INTER_CUBIC)
    return n


# ----------------------------------------------------------------------------
# knight
# ----------------------------------------------------------------------------

def K(x, y):
    """Knight local coords (origin at feet, y up negative) -> screen."""
    return (KX + x, GROUND_Y + y)


def Kp(pts):
    return [K(p[0], p[1]) + tuple(p[2:]) for p in pts]


LANTERN_PIVOT_L = (246.0, -421.0)   # crossguard right tip (local)
LANTERN_LEN = 34.0


def knight_parts():
    """Ordered list of (name, path, tone). tone: 0 = far (darker), 1 = near."""
    parts = []

    def add(name, pts, tone=1.0, smooth=True):
        path = smooth_path(Kp(pts)) if smooth else poly_path([p[:2] for p in Kp(pts)])
        parts.append((name, path, tone))

    # ---- far (back) leg, rotated back around the hip
    def rot(pts, cx, cy, ang):
        ca, sa = math.cos(ang), math.sin(ang)
        out = []
        for p in pts:
            x, y = p[0] - cx, p[1] - cy
            out.append((cx + x * ca - y * sa, cy + x * sa + y * ca) + tuple(p[2:]))
        return out

    # leg pieces (near leg); hip ~(18,-410), knee ~(38,-228), ankle ~(30,-42)
    thigh = tube((14, -408), (38, -236), 72, 52)
    greave = [(14, -44), (46, -44), (54, -100), (60, -152), (56, -210), (20, -212), (12, -160), (8, -108)]
    knee = [(22, -258), (50, -260), (66, -236, 's'), (56, -214), (34, -208), (22, -228)]
    kneewing = [(14, -252), (26, -248), (30, -230), (24, -212), (12, -216), (8, -234)]
    sabaton = [(-24, -2), (104, 0, 's'), (88, -10), (60, -20), (40, -32), (12, -46), (-12, -46), (-26, -30)]

    def shift(pts, dx, dy=0):
        return [(p[0] + dx, p[1] + dy) + tuple(p[2:]) for p in pts]

    # far leg: stepped back
    add('farthigh', shift(rot(thigh, 14, -408, math.radians(6)), -6), 0.5)
    add('fargreave', shift(greave, -40, 0), 0.5)
    add('farsabaton', shift(sabaton, -62), 0.5)

    # sword blade (behind the near arm, in front of the far leg)
    bx = 190
    blade = [(bx - 13, -421, 's'), (bx + 13, -421, 's'), (bx + 11, -120), (bx + 6, -20), (bx + 1, 6, 's'), (bx - 1, 6, 's'), (bx - 6, -20), (bx - 11, -120)]
    add('blade', blade, 1.0, smooth=False)

    # near leg
    add('thigh', thigh)
    add('greave', greave)
    add('knee', knee)
    add('kneewing', kneewing)
    add('sabaton', sabaton)

    # torso (narrower, peascod breastplate)
    add('backplate', [(-44, -452), (-58, -520), (-64, -590), (-50, -632), (-6, -644), (-6, -452)])
    add('tasset2', band(-14, 74, -416, 50, 4, slope=10, flare=12))
    add('tasset1', band(-18, 70, -444, 34, 4, slope=8, flare=8))
    add('fauld', band(-50, 58, -470, 30, 3, flare=4))
    add('breast', [(-30, -466), (50, -462, 's'), (68, -508), (78, -558), (70, -604), (42, -636), (-4, -644), (-30, -600)])
    add('belt', band(-50, 60, -478, 10, 2))
    add('tabard', [(-24, -474, 's'), (60, -474, 's'), (66, -420), (60, -350), (54, -292), (44, -300), (38, -276), (26, -290),
                   (14, -270), (4, -292), (-8, -282), (-14, -300), (-26, -296), (-30, -360), (-30, -420)])

    # sword hilt
    add('guard', [(bx - 58, -425), (bx - 50, -431), (bx + 50, -431), (bx + 58, -425), (bx + 56, -415), (bx + 46, -419), (bx - 46, -419), (bx - 56, -415)])
    add('grip', [(bx - 7, -431, 's'), (bx + 7, -431, 's'), (bx + 7, -492, 's'), (bx - 7, -492, 's')], smooth=False)
    add('pommel', [(bx, -515), (bx + 14, -503), (bx + 11, -490), (bx, -486), (bx - 11, -490), (bx - 14, -503)])

    # near arm: shoulder (2,-596) elbow (34,-478) wrist (160,-466)
    add('rerebrace', tube((2, -590), (34, -490), 40, 36))
    add('vambrace', tube((40, -480), (160, -468), 36, 30))
    add('couter', [(14, -500), (42, -508), (58, -486), (50, -458), (24, -454), (10, -476)])
    add('couterwing', [(6, -506), (20, -500), (22, -476), (10, -458), (-4, -468), (-6, -492)])
    add('cuff', [(146, -492), (172, -500), (178, -468), (172, -440), (146, -446), (142, -468)])
    add('fist', [(170, -500), (204, -503), (214, -486), (213, -452), (204, -436), (172, -438), (166, -470)])
    add('thumb', [(186, -501), (206, -505), (214, -494), (200, -488), (186, -490)])

    # gorget
    add('gorget2', band(-40, 46, -642, 20, 5))
    add('gorget1', band(-36, 40, -658, 20, 5))

    # helmet: armet with a long pointed visor and a comb
    add('skull', [(-50, -652), (-60, -702), (-48, -748), (-14, -772), (24, -770), (54, -748), (64, -716), (44, -664), (0, -650)])
    add('comb', [(-44, -752), (-14, -780), (26, -778), (46, -760), (24, -768), (-14, -770)])
    add('visor', [(28, -754), (64, -750), (98, -728), (132, -702, 's'), (96, -684), (66, -666), (36, -660), (22, -704)])
    add('bevor', [(-50, -664), (-10, -656), (44, -664), (66, -668), (54, -642), (-8, -630), (-54, -636)])

    # pauldron: big layered lames, clearly above the arm
    add('paul4', band(-50, 50, -556, 24, 9, slope=10, flare=8))
    add('paul3', band(-62, 62, -580, 28, 11, slope=10, flare=8))
    add('paul2', band(-72, 72, -606, 30, 13, slope=10, flare=8))
    add('paul1', [(-80, -604), (-70, -646), (-28, -672), (26, -670), (66, -646), (84, -610), (62, -598), (0, -596), (-56, -598)])
    return parts


def lantern_screen_pos(t):
    th = math.radians(5.5) * math.sin(2 * math.pi * t / 3.1) + math.radians(2.0) * math.sin(2 * math.pi * t / 1.7 + 1.0)
    px, py = K(*LANTERN_PIVOT_L)
    return px, py, th


def lantern_center(t):
    px, py, th = lantern_screen_pos(t)
    return px + math.sin(th) * (LANTERN_LEN + 26), py + math.cos(th) * (LANTERN_LEN + 26)


def make_knight_layers():
    parts = knight_parts()
    steel_hi = np.array([34, 39, 47])
    steel_lo = np.array([7, 8, 11])
    base = new_surface()
    warm = new_surface()
    flash = new_surface()
    rimmask = new_surface()
    cb, cw, cf, cr = base.getCanvas(), warm.getCanvas(), flash.getCanvas(), rimmask.getCanvas()
    for cc in (cb, cw, cf, cr):
        cc.clear(0)
    lx0, ly0 = lantern_center(0)
    seam = skia.Paint(AntiAlias=True, Style=skia.Paint.kStroke_Style, StrokeWidth=2.4, Color=col(5, 6, 8))
    for name, path, tone in parts:
        b = path.computeTightBounds()
        hi = steel_hi * (0.55 + 0.45 * tone)
        lo = steel_lo * (0.7 + 0.3 * tone)
        if name in ('blade',):
            hi, lo = np.array([70, 78, 90]), np.array([18, 20, 25])
        if name == 'tabard':
            hi, lo = np.array([36, 11, 14]), np.array([10, 3, 5])
        if name in ('grip',):
            hi, lo = np.array([40, 26, 20]), np.array([14, 9, 7])
        fp = skia.Paint(AntiAlias=True)
        fp.setShader(skia.GradientShader.MakeLinear(
            [(b.right(), b.top()), (b.left(), b.bottom())], [col(*hi), col(*lo)]))
        cb.drawPath(path, fp)
        # flash: occlude everything behind (so far parts do not glow through), then light
        cf.drawPath(path, skia.Paint(AntiAlias=True, Color=col(0, 0, 0, 0), BlendMode=skia.BlendMode.kClear))
        fl = skia.Paint(AntiAlias=True, Color=col(60, 70, 86, int(90 * tone)))
        cf.drawPath(path, fl)
        cw.drawPath(path, skia.Paint(AntiAlias=True, BlendMode=skia.BlendMode.kClear))
        cr.drawPath(path, skia.Paint(AntiAlias=True, BlendMode=skia.BlendMode.kClear))
        # moon rim (moon is up-right)
        if tone > 0.9:
            r1 = rim(path, 0.45, -0.9, 3.2)
            cb.drawPath(r1, skia.Paint(AntiAlias=True, Color=col(150, 178, 200, 210)))
            cr.drawPath(r1, skia.Paint(AntiAlias=True, Color=col(255, 255, 255, 255)))
            soft = skia.Paint(AntiAlias=True, Color=col(110, 140, 165, 60))
            soft.setMaskFilter(skia.MaskFilter.MakeBlur(skia.kNormal_BlurStyle, 4))
            cb.drawPath(rim(path, 0.45, -0.9, 9), soft)
        else:
            cb.drawPath(rim(path, 0.45, -0.9, 2.0), skia.Paint(AntiAlias=True, Color=col(90, 110, 128, 120)))
        cb.drawPath(path, seam)
        # warm lantern rim: edges facing the lantern
        cx, cy = b.centerX(), b.centerY()
        wx, wy = lx0 - cx, ly0 - cy
        dist = math.hypot(wx, wy)
        if dist < 420:
            wp = skia.Paint(AntiAlias=True)
            wp.setShader(skia.GradientShader.MakeRadial((lx0, ly0), 360,
                         [col(255, 176, 92, 255), col(255, 140, 60, 150), col(255, 120, 40, 0)], [0.0, 0.45, 1.0]))
            cw.drawPath(rim(path, wx, wy, 5.0 if tone > 0.9 else 3.0), wp)
            wp2 = skia.Paint(AntiAlias=True)
            wp2.setShader(skia.GradientShader.MakeRadial((lx0, ly0), 300,
                          [col(255, 150, 70, 70), col(255, 120, 40, 0)]))
            cw.drawPath(path, wp2)
        # lightning rim from the upper left
        fr = skia.Paint(AntiAlias=True, Color=col(190, 210, 245, int(200 * tone)))
        cf.drawPath(rim(path, -0.8, -0.6, 2.6), fr)

    # specular sheen strokes on curved plates
    sp = skia.Paint(AntiAlias=True, Style=skia.Paint.kStroke_Style, StrokeWidth=3, Color=col(170, 196, 218, 130),
                    StrokeCap=skia.Paint.kRound_Cap)
    sp.setMaskFilter(skia.MaskFilter.MakeBlur(skia.kNormal_BlurStyle, 1.2))
    sheens = [
        [(54, -470), (66, -515), (70, -562), (60, -600)],      # breastplate
        [(30, -764), (52, -746), (60, -724)],                  # skull
        [(70, -746), (100, -724), (126, -704)],                # visor top
        [(-40, -658), (10, -668), (60, -648)],                 # pauldron top
        [(54, -196), (60, -140), (54, -60)],                   # greave shin
        [(46, -280), (56, -360)],                              # thigh
        [(196, -400), (195, -200), (192, -60)],                # blade
    ]
    for s in sheens:
        cb.drawPath(smooth_path(Kp(s), closed=False), sp)
    # visor eye slit + breaths
    slit = skia.Paint(AntiAlias=True, Style=skia.Paint.kStroke_Style, StrokeWidth=5, Color=col(2, 2, 3), StrokeCap=skia.Paint.kRound_Cap)
    cb.drawPath(smooth_path(Kp([(38, -730), (70, -728), (102, -716)]), closed=False), slit)
    hp = skia.Paint(AntiAlias=True, Color=col(2, 2, 3))
    for (hx, hy) in [(80, -704), (91, -700), (102, -697), (86, -692), (97, -689)]:
        cb.drawCircle(*K(hx, hy), 2.0, hp)
    # rivets
    rv = skia.Paint(AntiAlias=True, Color=col(70, 82, 94))
    for (hx, hy) in [(6, -712), (-46, -626), (10, -628), (62, -622)]:
        cb.drawCircle(*K(hx, hy), 2.6, rv)
    # fist finger lines
    fl = skia.Paint(AntiAlias=True, Style=skia.Paint.kStroke_Style, StrokeWidth=2, Color=col(6, 7, 9))
    for yy in (-486, -470, -454):
        cb.drawPath(smooth_path(Kp([(184, yy), (200, yy - 2), (212, yy + 1)]), closed=False), fl)
    # blade fuller
    fu = skia.Paint(AntiAlias=True, Style=skia.Paint.kStroke_Style, StrokeWidth=3, Color=col(20, 24, 30, 200))
    cb.drawPath(poly_path([K(190, -415), K(190, -150)], closed=False), fu)

    rm = rimmask.toarray()[..., 3]
    return base.makeImageSnapshot(), warm.makeImageSnapshot(), flash.makeImageSnapshot(), rm


# ----------------------------------------------------------------------------
# cape
# ----------------------------------------------------------------------------

CAPE_TEETH = None


def cape_paths(t):
    global CAPE_TEETH
    if CAPE_TEETH is None:
        rng = np.random.default_rng(42)
        u = np.linspace(0, 1, 121)
        teeth = np.zeros_like(u)
        for k in range(10):
            c = rng.uniform(0.05, 1.0)
            wdt = rng.uniform(0.012, 0.035)
            teeth += rng.uniform(0.04, 0.11) * np.exp(-((u - c) / wdt) ** 2)
        teeth += 0.02 * np.abs(np.sin(u * 61))
        CAPE_TEETH = (u, teeth)

    inner = np.array([(-30, -652), (-74, -560), (-74, -440), (-66, -330), (-58, -228)], float)
    outer = np.array([(-38, -660), (-150, -560), (-232, -430), (-280, -330), (-305, -238)], float)
    vk = np.linspace(0, 1, len(inner))

    def curve(arr, v):
        return np.stack([np.interp(v, vk, arr[:, 0]), np.interp(v, vk, arr[:, 1])], -1)

    def P(u, v):
        a, b = curve(inner, v), curve(outer, v)
        p = a * (1 - u)[..., None] + b * u[..., None]
        w1 = 2 * math.pi / 2.6
        w2 = 2 * math.pi / 1.15
        ph = w1 * t - 5.0 * (u + v)
        ph2 = w2 * t - 9.0 * (u * 0.6 + v) + 1.3
        gust = 0.75 + 0.25 * math.sin(2 * math.pi * t / 7.5)
        amp = (u ** 1.2) * (v ** 0.7)
        dx = -amp * (34 * gust + 22 * np.sin(ph) + 7 * np.sin(ph2))
        dy = amp * (14 * np.sin(ph + 1.1) + 5 * np.sin(ph2 * 1.3)) - amp * 18 * gust
        p[..., 0] += dx
        p[..., 1] += dy
        return p, ph

    tu, tt = CAPE_TEETH
    M = 16
    nv = 28
    strips = []
    outline_bottom = []
    for i in range(M):
        u0, u1 = i / M, (i + 1) / M
        us = np.linspace(u0, u1, 9)
        vend = 1 - np.interp(us, tu, tt)
        left_v = np.linspace(0, vend[0], nv)
        right_v = np.linspace(0, vend[-1], nv)
        pl, phl = P(np.full(nv, u0), left_v)
        pb, _ = P(us, vend)
        pr, _ = P(np.full(nv, u1), right_v)
        pts = list(map(tuple, pl)) + list(map(tuple, pb[1:-1])) + list(map(tuple, pr[::-1]))
        um = (u0 + u1) / 2
        _, phm = P(np.array([um]), np.array([0.6]))
        fold = math.cos(phm[0])
        strips.append((pts, fold, um))
        outline_bottom.extend(list(map(tuple, pb)))
    # full silhouette: inner edge top->bottom, bottom edge, outer edge bottom->top
    vi = np.linspace(0, 1 - tt[0], nv)
    pin, _ = P(np.zeros(nv), vi)
    vo = np.linspace(0, 1 - tt[-1], nv)
    pout, _ = P(np.ones(nv), vo)
    sil = list(map(tuple, pin)) + outline_bottom + list(map(tuple, pout[::-1]))
    return sil, strips


def draw_plume(c, t, flash_amt):
    rng = np.random.default_rng(9)
    base = K(-20, -776)
    p = skia.Paint(AntiAlias=True, Style=skia.Paint.kStroke_Style, StrokeCap=skia.Paint.kRound_Cap)
    for i in range(34):
        L = rng.uniform(90, 200)
        ph = rng.uniform(0, 6.28)
        w = rng.uniform(3.0, 6.0)
        x0 = base[0] + rng.uniform(-22, 26)
        y0 = base[1] + rng.uniform(-4, 6)
        pts = []
        for k in range(9):
            u = k / 8
            sway = 10 * u * math.sin(2 * math.pi * t / 1.3 - u * 4 + ph) + 5 * u * math.sin(2 * math.pi * t / 0.7 + ph * 2 - u * 6)
            pts.append((x0 - L * u * 0.85, y0 + L * 0.8 * u * u + sway))
        r_ = 40 + rng.uniform(0, 30)
        p.setStrokeWidth(w)
        p.setColor(col(r_ * 0.75, 8, 11, 235))
        c.drawPath(smooth_path(pts, closed=False), p)
    # moon sheen on top strands
    p.setStrokeWidth(1.2)
    p.setColor(col(170, 120, 130, 90 + int(120 * min(1, flash_amt))))
    for i in range(5):
        x0 = base[0] + rng.uniform(-10, 20)
        pts = [(x0 - 130 * u, base[1] - 2 + 120 * u * u + 8 * u * math.sin(2 * math.pi * t / 1.3 - u * 4 + i)) for u in np.linspace(0, 1, 9)]
        c.drawPath(smooth_path(pts, closed=False), p)


def draw_cape(c, t, sy, flash_amt):
    sil, strips = cape_paths(t)

    def tr(pts):
        return [(KX + x, GROUND_Y + y * sy) for x, y in pts]

    silp = poly_path(tr(sil))
    c.drawPath(silp, skia.Paint(AntiAlias=True, Color=col(18, 5, 7)))
    for pts, fold, um in strips:
        path = poly_path(tr(pts))
        b = path.computeTightBounds()
        k = 0.5 + 0.5 * fold
        topc = np.array([20, 5, 8]) + k * np.array([48, 12, 12]) * (0.6 + 0.4 * (1 - um))
        botc = np.array([10, 3, 5]) + k * np.array([22, 5, 5])
        p = skia.Paint(AntiAlias=True)
        p.setShader(skia.GradientShader.MakeLinear([(0, b.top()), (0, b.bottom())], [col(*topc), col(*botc)]))
        c.drawPath(path, p)
    # moon rim along the top edge of the cape
    c.drawPath(rim(silp, 0.3, -1.0, 3.0), skia.Paint(AntiAlias=True, Color=col(150, 120, 130, 120)))
    if flash_amt > 0.01:
        c.drawPath(rim(silp, -0.9, -0.4, 5.0), skia.Paint(AntiAlias=True, Color=col(220, 200, 230, int(220 * min(1, flash_amt)))))


# ----------------------------------------------------------------------------
# lantern
# ----------------------------------------------------------------------------

def draw_lantern(c, t, flick):
    px, py, th = lantern_screen_pos(t)
    c.save()
    c.translate(px, py)
    c.rotate(math.degrees(-th))
    chain = skia.Paint(AntiAlias=True, Style=skia.Paint.kStroke_Style, StrokeWidth=2.2, Color=col(30, 30, 34))
    for k in range(4):
        y0 = 2 + k * 8
        c.drawOval(skia.Rect.MakeXYWH(-3 + (k % 2) * 1, y0, 6 - (k % 2) * 2, 9), chain)
    y0 = LANTERN_LEN
    iron = skia.Paint(AntiAlias=True, Color=col(18, 18, 20))
    c.drawPath(poly_path([(-9, y0), (9, y0), (17, y0 + 10), (-17, y0 + 10)]), iron)
    c.drawCircle(0, y0 - 2, 4, chain)
    # glass with flame glow
    g = skia.Paint(AntiAlias=True)
    g.setShader(skia.GradientShader.MakeRadial((0, y0 + 28), 22,
                [col(255, 236, 170), col(255, 170, 70), col(200, 90, 30)], [0, 0.5, 1]))
    g.setAlphaf(min(1.0, 0.75 + 0.25 * flick))
    c.drawRect(skia.Rect.MakeLTRB(-13, y0 + 10, 13, y0 + 46), g)
    bars = skia.Paint(AntiAlias=True, Style=skia.Paint.kStroke_Style, StrokeWidth=2.5, Color=col(20, 18, 18))
    for x in (-13, -4.5, 4.5, 13):
        c.drawLine(x, y0 + 10, x, y0 + 46, bars)
    c.drawPath(poly_path([(-16, y0 + 46), (16, y0 + 46), (11, y0 + 54), (-11, y0 + 54)]), iron)
    # flame
    fl = skia.Paint(AntiAlias=True, Color=col(255, 250, 220))
    fh = 9 + 3 * flick
    c.drawPath(smooth_path([(0, y0 + 38 - fh), (4, y0 + 34), (3, y0 + 40), (0, y0 + 42), (-3, y0 + 40), (-4, y0 + 34)]), fl)
    c.restore()


# ----------------------------------------------------------------------------
# lightning
# ----------------------------------------------------------------------------

def flash_at(t):
    v = 0.0
    for t0, strength in zip(LIGHTNING, (1.0, 0.7)):
        for dt, a, tau in ((0.0, 1.0, 0.07), (0.17, 0.65, 0.06), (0.40, 0.38, 0.09), (0.55, 0.2, 0.2)):
            x = t - (t0 + dt)
            if x >= 0:
                v += strength * a * math.exp(-x / tau)
            elif x > -0.03:
                v += strength * a * (1 + x / 0.03)
    return min(v, 1.3)


def bolt_path(x0, seed):
    rng = np.random.default_rng(seed)

    def seg(a, b, disp, depth, out):
        if depth == 0:
            out.append((a, b))
            return
        mx = (a[0] + b[0]) / 2 + rng.normal(0, disp)
        my = (a[1] + b[1]) / 2 + rng.normal(0, disp * 0.25)
        m = (mx, my)
        seg(a, m, disp / 1.9, depth - 1, out)
        seg(m, b, disp / 1.9, depth - 1, out)
        if depth >= 3 and rng.random() < 0.35:
            end = (mx + rng.normal(0, 70) - 30, my + rng.uniform(60, 160))
            branch = []
            seg(m, end, disp / 2.5, depth - 2, branch)
            out.extend([(s[0], s[1], 'b') for s in branch])

    out = []
    seg((x0, 330), (x0 + rng.normal(0, 40), 940), 70, 7, out)
    return out


BOLTS = [bolt_path(BOLT_X[i], 100 + i) for i in range(len(LIGHTNING))]


def draw_bolt(c, idx, amt):
    if amt <= 0.02:
        return
    glow = skia.Paint(AntiAlias=True, Style=skia.Paint.kStroke_Style, StrokeWidth=10, Color=col(150, 180, 255, int(90 * amt)),
                      StrokeCap=skia.Paint.kRound_Cap)
    glow.setMaskFilter(skia.MaskFilter.MakeBlur(skia.kNormal_BlurStyle, 10))
    glow.setBlendMode(skia.BlendMode.kPlus)
    core = skia.Paint(AntiAlias=True, Style=skia.Paint.kStroke_Style, StrokeWidth=2.6, Color=col(235, 242, 255, int(255 * min(1, amt))),
                      StrokeCap=skia.Paint.kRound_Cap)
    core.setBlendMode(skia.BlendMode.kPlus)
    for s in BOLTS[idx]:
        a, b = s[0], s[1]
        thin = len(s) > 2
        core.setStrokeWidth(1.3 if thin else 2.6)
        c.drawLine(a[0], a[1], b[0], b[1], glow)
        c.drawLine(a[0], a[1], b[0], b[1], core)


# ----------------------------------------------------------------------------
# rain
# ----------------------------------------------------------------------------

class Rain:
    def __init__(self, seed=1):
        rng = np.random.default_rng(seed)
        self.layers = []
        # (count, speed px/s, length, width, alpha, blur)
        spec = [(900, 1500, 26, 1.1, 0.22, 0), (320, 2100, 55, 1.8, 0.30, 0), (45, 2900, 150, 4.5, 0.16, 3.5)]
        for count, sp, ln, wd, al, bl in spec:
            self.layers.append(dict(
                x=rng.uniform(-300, W + 300, count), y=rng.uniform(0, H + 300, count),
                s=sp * rng.uniform(0.85, 1.15, count), ln=ln * rng.uniform(0.7, 1.3, count),
                wd=wd, al=al * rng.uniform(0.6, 1.4, count), bl=bl))
        self.slant = -0.22

    def draw(self, c, t, layer_idx, lantern, flash_amt):
        L = self.layers[layer_idx]
        span_y = H + 300
        ys = (L['y'] + L['s'] * t) % span_y - 150
        xs = (L['x'] + self.slant * L['s'] * t) % (W + 600) - 300
        p = skia.Paint(AntiAlias=True, Style=skia.Paint.kStroke_Style, StrokeWidth=L['wd'], StrokeCap=skia.Paint.kRound_Cap)
        if L['bl']:
            p.setMaskFilter(skia.MaskFilter.MakeBlur(skia.kNormal_BlurStyle, L['bl']))
        lx, ly = lantern
        for x, y, ln, al in zip(xs, ys, L['ln'], L['al']):
            dx, dy = -self.slant * ln, -ln
            d = math.hypot(x - lx, y - ly)
            warm = max(0.0, 1 - d / 260.0) ** 1.5 if layer_idx > 0 else max(0.0, 1 - d / 200.0) ** 2 * 0.6
            r = 175 + 80 * warm
            g = 195 + 10 * warm
            b = 215 - 120 * warm
            a = al * (1 + 2.2 * warm + 1.5 * flash_amt)
            p.setColor(col(r, g, b, min(255, 255 * a)))
            c.drawLine(x, y, x + dx, y + dy, p)


# ----------------------------------------------------------------------------
# renderer
# ----------------------------------------------------------------------------

class Scene:
    def __init__(self):
        self.sky = make_sky()
        self.mountains = make_mountains()
        self.castle = make_castle()
        self.castle_flash = make_castle(True)
        self.cliff = make_cliff()
        self.cliff_flash = make_cliff(True)
        self.k_base, self.k_warm, self.k_flash, rm = make_knight_layers()
        ys, xs = np.nonzero(rm > 180)
        self.rim_pts = np.stack([xs, ys], -1).astype(np.float32)
        # clouds (quarter res)
        self.cl_far = fbm(330, 700, 6, 70, 3)
        self.cl_near = fbm(330, 900, 6, 50, 4)
        self.fog_back = make_fog(3000, 360, 8)
        self.fog_val = make_fog(3200, 640, 9)
        self.fog_low = make_fog(3000, 260, 10, stretch=8)
        self.rain = Rain()
        rng = np.random.default_rng(77)
        # vignette + grain bank
        yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
        r2 = ((xx - W / 2) / (W * 0.62)) ** 2 + ((yy - H * 0.52) / (H * 0.6)) ** 2
        self.vign = (1 - 0.42 * np.clip(r2, 0, 1.6) ** 1.2)[..., None].astype(np.float32)
        self.grain = [cv2.resize(rng.normal(0, 1, (H // 2, W // 2)).astype(np.float32), (W, H)) for _ in range(6)]
        self.win_phase = rng.uniform(0, 100, len(CASTLE_WINDOWS))
        self.win_on = rng.uniform(0.55, 1.0, len(CASTLE_WINDOWS))
        # splash / ripple / drip events (deterministic)
        self.splashes = [(rng.uniform(0, DUR), rng.uniform(-20, 840), rng.uniform(0, 1)) for _ in range(int(DUR * 70))]
        self.ripples = [(rng.uniform(0, DUR), rng.uniform(470, 740), rng.uniform(1652, 1686)) for _ in range(int(DUR * 7))]
        self.armor_hits = [(rng.uniform(0, DUR), int(rng.integers(0, len(self.rim_pts)))) for _ in range(int(DUR * 26))]
        drip_src = [(-62, -548), (66, -548), (122, -700), (bx := 190, 2), (bx - 56, -413), (-305, -240), (84, -350)]
        self.drips = []
        for sx, sy_ in drip_src:
            tt = rng.uniform(0, 1.2)
            while tt < DUR:
                self.drips.append((tt, sx, sy_))
                tt += rng.uniform(0.7, 2.2)

    # --- camera
    def cam(self, c, t, depth):
        z = 1.018 + 0.075 * ease(t / DUR) * depth
        z = 1.0 + (z - 1.0) * (0.35 + 0.65 * depth)
        dx = (5 * math.sin(2 * math.pi * t / 13.0) + 2 * math.sin(2 * math.pi * t / 5.3)) * depth
        dy = (4 * math.sin(2 * math.pi * t / 9.7 + 1) + 1.5 * math.sin(2 * math.pi * t / 4.1)) * depth
        fx, fy = FOCUS
        c.translate(fx + dx, fy + dy)
        c.scale(z, z)
        c.translate(-fx, -fy)

    def clouds(self, t, fl):
        h4, w4 = 480, 270
        out = np.zeros((h4, w4, 4), np.float32)
        yy, xx = np.mgrid[0:h4, 0:w4].astype(np.float32)
        mx, my = MOON[0] / 4, MOON[1] / 4
        dm = np.sqrt((xx - mx) ** 2 + (yy - my) ** 2)
        for tex, speed, y0, alpha, dark in ((self.cl_far, 2.2, 0, 0.75, 1.0), (self.cl_near, 4.5, 0, 0.85, 0.75)):
            off = speed * t
            i0 = int(off)
            fr = off - i0
            sub = tex[:, i0:i0 + w4 + 1]
            sub = sub[:, :-1] * (1 - fr) + sub[:, 1:] * fr
            dens = np.zeros((h4, w4), np.float32)
            dens[y0:y0 + sub.shape[0]] = sub[:h4 - y0]
            # fade clouds toward horizon
            vfade = smoothstep(290, 150, yy)
            c = smoothstep(0.42, 0.72, dens) * vfade
            moonlit = np.exp(-dm / 55.0)
            edge = np.clip(1 - c, 0, 1)
            rgb = np.stack([16 + 120 * moonlit * edge, 22 + 140 * moonlit * edge, 30 + 160 * moonlit * edge], -1) * dark
            if fl > 0.01:
                for bx in BOLT_X:
                    pass
                bxs = [BOLT_X[i] / 4 for i, t0 in enumerate(LIGHTNING) if abs(t - t0 - 0.3) < 1.2]
                for bx in bxs:
                    lit = np.exp(-np.abs(xx - bx) / 60.0) * fl
                    rgb += (lit * (0.4 + dens))[..., None] * np.array([90, 110, 150], np.float32)
            a = c * alpha
            out[..., :3] = out[..., :3] * (1 - a[..., None]) + rgb * a[..., None]
            out[..., 3] = out[..., 3] * (1 - a) + a
        rgb = out[..., :3] / np.maximum(out[..., 3:4], 1e-4)
        o = np.concatenate([np.clip(rgb, 0, 255), out[..., 3:4] * 255], -1).astype(np.uint8)
        o = cv2.resize(o, (W, H), interpolation=cv2.INTER_LINEAR)
        return img_from_rgba(o)

    def fog_img(self, tex, t, speed, alpha, rgb, fade_top=0.25, fade_bot=0.25):
        h, w = tex.shape
        off = int(speed * t) % (w - W - 2)
        sub = tex[:, off:off + W]
        dens = smoothstep(0.35, 0.8, sub)
        v = np.linspace(0, 1, h, dtype=np.float32)[:, None]
        env = smoothstep(0, fade_top, v) * smoothstep(1, 1 - fade_bot, v)
        a = (dens * env * alpha * 255).astype(np.uint8)
        arr = np.empty((h, W, 4), np.uint8)
        arr[..., 0], arr[..., 1], arr[..., 2] = rgb
        arr[..., 3] = a
        return img_from_rgba(arr)

    def frame(self, f):
        t = f / FPS
        fl = flash_at(t)
        flick = 0.82 + 0.1 * math.sin(t * 13.1) + 0.06 * math.sin(t * 29.7 + 1) + 0.05 * math.sin(t * 7.3 + 2)
        surf = new_surface()
        c = surf.getCanvas()
        c.clear(col(0, 0, 0))

        # sky + moon
        c.save(); self.cam(c, t, 0.2)
        c.drawImage(self.sky, 0, 0, SAMPLING)
        if fl > 0.01:
            p = skia.Paint(AntiAlias=True)
            p.setShader(skia.GradientShader.MakeLinear([(0, 0), (0, 1100)], [col(80, 100, 140, int(110 * min(1, fl))), col(60, 80, 110, int(40 * min(1, fl)))]))
            p.setBlendMode(skia.BlendMode.kPlus)
            c.drawRect(skia.Rect.MakeWH(W, 1200), p)
        for i, t0 in enumerate(LIGHTNING):
            if 0 <= t - t0 < 0.8:
                draw_bolt(c, i, flash_at(t) if t - t0 < 0.6 else 0)
        c.drawImage(self.clouds(t, fl), 0, 0, SAMPLING)
        c.restore()

        # mountains, back fog
        c.save(); self.cam(c, t, 0.3)
        c.drawImage(self.mountains, 0, 0, SAMPLING)
        c.drawImage(self.fog_img(self.fog_back, t, 9, 0.55, (44, 58, 74)), 0, 880, SAMPLING)
        c.restore()

        # castle
        c.save(); self.cam(c, t, 0.45)
        c.drawImage(self.castle, 0, 0, SAMPLING)
        if fl > 0.01:
            c.drawImage(self.castle_flash, 0, 0, SAMPLING, skia.Paint(Alphaf=min(1.0, fl)))
        wp = skia.Paint(AntiAlias=True)
        gp = skia.Paint(AntiAlias=True)
        gp.setBlendMode(skia.BlendMode.kPlus)
        for i, (x, y, w_, h_) in enumerate(CASTLE_WINDOWS):
            k = self.win_on[i] * (0.78 + 0.12 * math.sin(t * 5.1 + self.win_phase[i]) + 0.1 * math.sin(t * 11.7 + self.win_phase[i] * 2))
            wp.setColor(col(255, 190 + 30 * k, 100, 255 * min(1, k)))
            r = skia.RRect.MakeRectXY(skia.Rect.MakeXYWH(x - w_ / 2, y - h_ / 2, w_, h_), w_ / 2, w_ / 2)
            c.drawRRect(r, wp)
            gp.setShader(skia.GradientShader.MakeRadial((x, y), 28, [col(255, 150, 60, 70 * k), col(255, 120, 40, 0)]))
            c.drawCircle(x, y, 28, gp)
        c.restore()

        # valley fog
        c.save(); self.cam(c, t, 0.6)
        c.drawImage(self.fog_val, 0, 0, SAMPLING) if False else None
        c.drawImage(self.fog_img(self.fog_val, t, 16, 0.6, (52, 66, 82), 0.2, 0.35), 0, 1010, SAMPLING)
        c.restore()

        # far rain
        self.rain.draw(c, t, 0, lantern_center(t), fl)

        # foreground: cliff + knight
        c.save(); self.cam(c, t, 1.0)
        c.drawImage(self.cliff, 0, 0, SAMPLING)
        if fl > 0.01:
            c.drawImage(self.cliff_flash, 0, 0, SAMPLING, skia.Paint(Alphaf=min(1.0, fl)))
        lx, ly = lantern_center(t)
        # warm pool on the ground + puddle
        pool = skia.Paint(AntiAlias=True)
        pool.setShader(skia.GradientShader.MakeRadial((lx, GROUND_Y + 15), 330, [col(255, 140, 60, 90 * flick), col(255, 110, 40, 0)]))
        pool.setBlendMode(skia.BlendMode.kPlus)
        c.save(); c.scale(1, 0.22); c.translate(0, (GROUND_Y + 15) / 0.22 - (GROUND_Y + 15))
        c.drawCircle(lx, GROUND_Y + 15, 330, pool)
        c.restore()
        self.draw_puddle(c, t, lx, ly, flick)

        breath = 1 + 0.0035 * math.sin(2 * math.pi * t / 5.5)
        c.save()
        c.translate(0, GROUND_Y); c.scale(1, breath); c.translate(0, -GROUND_Y)
        draw_cape(c, t, 1.0, fl)
        draw_plume(c, t, fl)
        c.drawImage(self.k_base, 0, 0, SAMPLING)
        c.drawImage(self.k_warm, 0, 0, SAMPLING, skia.Paint(Alphaf=min(1.0, 0.85 * flick)))
        if fl > 0.01:
            c.drawImage(self.k_flash, 0, 0, SAMPLING, skia.Paint(Alphaf=min(1.0, fl)))
        self.draw_armor_hits(c, t)
        c.restore()
        draw_lantern(c, t, flick)
        glow = skia.Paint(AntiAlias=True)
        glow.setBlendMode(skia.BlendMode.kPlus)
        glow.setShader(skia.GradientShader.MakeRadial((lx, ly), 420, [col(255, 150, 70, 95 * flick), col(255, 120, 50, 30 * flick), col(255, 100, 40, 0)], [0, 0.35, 1]))
        c.drawCircle(lx, ly, 420, glow)
        glow.setShader(skia.GradientShader.MakeRadial((lx, ly), 70, [col(255, 220, 150, 150 * flick), col(255, 160, 80, 0)]))
        c.drawCircle(lx, ly, 70, glow)
        self.draw_drips(c, t)
        self.draw_splashes(c, t)
        # low ground mist
        c.drawImage(self.fog_img(self.fog_low, t, 22, 0.35, (60, 72, 88), 0.4, 0.4), 0, 1560, SAMPLING)
        c.restore()

        # near rain
        self.rain.draw(c, t, 1, lantern_center(t), fl)
        self.rain.draw(c, t, 2, lantern_center(t), fl)

        arr = surf.toarray()[..., :3].astype(np.float32) / 255.0
        return self.post(arr, f, fl)

    def draw_puddle(self, c, t, lx, ly, flick):
        pud = smooth_path([(470, 1660), (560, 1650), (690, 1654), (745, 1668), (690, 1684), (560, 1688), (480, 1680)])
        c.save()
        c.clipPath(pud, doAntiAlias=True)
        p = skia.Paint(AntiAlias=True)
        p.setShader(skia.GradientShader.MakeLinear([(0, 1650), (0, 1690)], [col(34, 44, 56, 200), col(18, 22, 28, 160)]))
        c.drawPath(pud, p)
        # lantern reflection: vertical warm streak
        rp = skia.Paint(AntiAlias=True)
        rp.setBlendMode(skia.BlendMode.kPlus)
        rp.setShader(skia.GradientShader.MakeRadial((lx, 1668), 40, [col(255, 170, 80, 200 * flick), col(255, 120, 40, 0)]))
        c.save(); c.translate(lx, 1668); c.scale(0.6, 1.0); c.translate(-lx, -1668)
        c.drawCircle(lx, 1668, 40, rp)
        c.restore()
        # sword reflection
        c.drawLine(KX + 190, 1650, KX + 190, 1690, skia.Paint(AntiAlias=True, StrokeWidth=8, Color=col(10, 12, 15, 200)))
        # ripples
        rpp = skia.Paint(AntiAlias=True, Style=skia.Paint.kStroke_Style, StrokeWidth=1.4)
        for t0, x, y in self.ripples:
            a = t - t0
            if 0 <= a < 0.9:
                r = 4 + 34 * a
                warm = max(0.0, 1 - abs(x - lx) / 160)
                rpp.setColor(col(150 + 100 * warm, 175 + 20 * warm, 200 - 100 * warm, 170 * (1 - a / 0.9)))
                c.drawOval(skia.Rect.MakeLTRB(x - r, y - r * 0.22, x + r, y + r * 0.22), rpp)
        c.restore()
        c.drawPath(rim(pud, 0.0, -1.0, 1.5), skia.Paint(AntiAlias=True, Color=col(110, 130, 150, 120)))

    def draw_splashes(self, c, t):
        p = skia.Paint(AntiAlias=True, Style=skia.Paint.kStroke_Style, StrokeWidth=1.6, StrokeCap=skia.Paint.kRound_Cap)
        for t0, x, depth in self.splashes:
            a = t - t0
            if 0 <= a < 0.14:
                y = 1636 + depth * 50 + (x > 760) * (x - 760) * 0.6
                k = a / 0.14
                h = 3 + 9 * math.sin(math.pi * k)
                al = 200 * (1 - k)
                p.setColor(col(185, 205, 225, al))
                for dx in (-5, 0, 5):
                    c.drawLine(x, y, x + dx * (0.4 + k), y - h * (1.0 if dx == 0 else 0.7), p)

    def draw_armor_hits(self, c, t):
        p = skia.Paint(AntiAlias=True, Color=col(225, 238, 250))
        rp = skia.Paint(AntiAlias=True, Style=skia.Paint.kStroke_Style, StrokeWidth=1.2)
        for t0, idx in self.armor_hits:
            a = t - t0
            if 0 <= a < 0.18:
                x, y = self.rim_pts[idx]
                k = a / 0.18
                p.setAlphaf(1 - k)
                c.drawCircle(x, y - 2 - 6 * k, 1.8 * (1 - k) + 0.6, p)
                rp.setColor(col(200, 220, 240, 160 * (1 - k)))
                c.drawCircle(x, y, 2 + 6 * k, rp)

    def draw_drips(self, c, t):
        p = skia.Paint(AntiAlias=True)
        for t0, sx, sy in self.drips:
            a = t - t0
            if a < 0:
                continue
            x0, y0 = K(sx, sy)
            # forming drop hanging, then falling
            if a < 0.35:
                r = 1 + 2.2 * a / 0.35
                p.setColor(col(190, 210, 230, 220))
                c.drawCircle(x0, y0 + r, r, p)
            elif a < 1.4:
                fa = a - 0.35
                y = y0 + 4 + 0.5 * 1800 * fa * fa
                if y > GROUND_Y + 30:
                    continue
                p.setColor(col(200, 215, 235, 200))
                c.drawOval(skia.Rect.MakeLTRB(x0 - 1.8, y - 3 - fa * 18, x0 + 1.8, y + 2), p)

    def post(self, img, f, fl):
        small = cv2.resize(img, (W // 4, H // 4), interpolation=cv2.INTER_AREA)
        lum = small.max(-1, keepdims=True)
        bright = small * np.clip((lum - 0.42) / 0.4, 0, 1)
        b1 = cv2.GaussianBlur(bright, (0, 0), 4)
        b2 = cv2.GaussianBlur(bright, (0, 0), 16)
        bloom = cv2.resize(b1 * 0.7 + b2 * 0.9, (W, H), interpolation=cv2.INTER_LINEAR)
        img = img + bloom * 0.55
        # grade: lifted blue blacks, slight teal shadows, filmic shoulder
        img = img * np.array([0.95, 1.0, 1.05], np.float32) + np.array([0.004, 0.007, 0.012], np.float32)
        img = img * (1 + 0.06 * fl)
        img = img / (1 + 0.25 * img) * 1.12
        img = img ** 1.12
        img = img * self.vign
        img += self.grain[f % len(self.grain)][..., None] * 0.018
        return (np.clip(img, 0, 1) * 255).astype(np.uint8)


# ----------------------------------------------------------------------------
# audio (rain bed + distant thunder)
# ----------------------------------------------------------------------------

def make_audio(path):
    from scipy.signal import butter, sosfilt
    sr = 48000
    n = int(DUR * sr)
    rng = np.random.default_rng(3)
    out = np.zeros((n, 2), np.float64)
    hp = butter(2, 300, 'hp', fs=sr, output='sos')
    bp = butter(2, [500, 7000], 'bandpass', fs=sr, output='sos')
    lp = butter(2, 1400, 'lp', fs=sr, output='sos')
    for ch in range(2):
        wn = rng.normal(0, 1, n)
        hiss = sosfilt(bp, wn) * 0.22
        roar = sosfilt(lp, rng.normal(0, 1, n)) * 0.35
        swell = 1 + 0.15 * np.sin(2 * np.pi * np.arange(n) / sr / 9.0 + ch)
        out[:, ch] = sosfilt(hp, hiss + roar) * swell
    # droplets
    for _ in range(int(DUR * 220)):
        t0 = int(rng.uniform(0, DUR - 0.05) * sr)
        fr = rng.uniform(1800, 6500)
        L = int(sr * rng.uniform(0.004, 0.012))
        tt = np.arange(L) / sr
        s = np.sin(2 * np.pi * fr * tt) * np.exp(-tt / (L / sr / 4)) * rng.uniform(0.02, 0.08)
        pan = rng.uniform(0, 1)
        out[t0:t0 + L, 0] += s * (1 - pan)
        out[t0:t0 + L, 1] += s * pan
    # metal tinks (rain on armour)
    for _ in range(int(DUR * 4)):
        t0 = int(rng.uniform(0, DUR - 0.2) * sr)
        fr = rng.uniform(3200, 5200)
        L = int(sr * 0.09)
        tt = np.arange(L) / sr
        s = (np.sin(2 * np.pi * fr * tt) + 0.4 * np.sin(2 * np.pi * fr * 2.7 * tt)) * np.exp(-tt / 0.02) * 0.035
        out[t0:t0 + L, 0] += s * 0.45
        out[t0:t0 + L, 1] += s * 0.55
    # thunder
    lp_t = butter(2, 160, 'lp', fs=sr, output='sos')
    lp_c = butter(2, 900, 'lp', fs=sr, output='sos')
    for t0, delay in zip(LIGHTNING, (2.4, 1.8)):
        st = int((t0 + delay) * sr)
        L = min(int(6.5 * sr), n - st)
        if L <= 0:
            continue
        tt = np.arange(L) / sr
        env = (1 - np.exp(-tt / 0.25)) * np.exp(-tt / 1.9)
        env *= 1 + 0.5 * np.sin(2 * np.pi * tt * 1.3) * np.exp(-tt / 1.2)
        for ch in range(2):
            rum = sosfilt(lp_t, rng.normal(0, 1, L)) * 2.4
            cr = sosfilt(lp_c, rng.normal(0, 1, L)) * 0.5 * np.exp(-tt / 0.5)
            out[st:st + L, ch] += (rum + cr) * env
    fade = int(1.5 * sr)
    ramp = np.linspace(0, 1, fade)
    out[:fade] *= ramp[:, None]
    out[-fade:] *= ramp[::-1, None]
    out *= 0.5 / np.max(np.abs(out))   # peak -6 dBFS (thunder); rain bed sits well below
    import wave
    data = (out * 32767).astype(np.int16)
    with wave.open(path, 'wb') as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(sr)
        w.writeframes(data.tobytes())


# ----------------------------------------------------------------------------

def render_range(args):
    a, b, path = args
    sc = Scene()
    ff = subprocess.Popen(['ffmpeg', '-y', '-v', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{W}x{H}', '-r', str(FPS),
                           '-i', '-', '-c:v', 'libx264', '-preset', 'medium', '-crf', '14', '-pix_fmt', 'yuv420p', path],
                          stdin=subprocess.PIPE)
    for f in range(a, b):
        ff.stdin.write(sc.frame(f).tobytes())
        if f % 50 == 0:
            print(f'frame {f}', flush=True)
    ff.stdin.close()
    ff.wait()
    return path


def main():
    mode = sys.argv[1]
    if mode == 'preview':
        frames = [int(x) for x in sys.argv[2].split(',')]
        os.makedirs(os.path.join(HERE, 'preview'), exist_ok=True)
        sc = Scene()
        for f in frames:
            img = sc.frame(f)
            cv2.imwrite(os.path.join(HERE, 'preview', f'f{f:04d}.png'), cv2.cvtColor(img, cv2.COLOR_RGB2BGR))
            print('ok', f)
    elif mode == 'render':
        out = sys.argv[2]
        jobs = int(sys.argv[sys.argv.index('--jobs') + 1]) if '--jobs' in sys.argv else 4
        tmp = os.path.join(os.path.dirname(os.path.abspath(out)), '_parts')
        os.makedirs(tmp, exist_ok=True)
        step = math.ceil(N / jobs)
        ranges = [(i, min(N, i + step), os.path.join(tmp, f'p{k}.mp4')) for k, i in enumerate(range(0, N, step))]
        from multiprocessing import Pool
        with Pool(jobs) as pool:
            parts = pool.map(render_range, ranges)
        lst = os.path.join(tmp, 'list.txt')
        with open(lst, 'w') as fh:
            fh.writelines(f"file '{p}'\n" for p in parts)
        wav = os.path.join(tmp, 'rain.wav')
        make_audio(wav)
        silent = out.replace('.mp4', '_silent.mp4')
        subprocess.run(['ffmpeg', '-y', '-v', 'error', '-f', 'concat', '-safe', '0', '-i', lst,
                        '-c:v', 'libx264', '-preset', 'slow', '-crf', '21', '-tune', 'grain', '-pix_fmt', 'yuv420p',
                        '-movflags', '+faststart', silent], check=True)
        subprocess.run(['ffmpeg', '-y', '-v', 'error', '-i', silent, '-i', wav, '-map', '0:v', '-map', '1:a',
                        '-c:v', 'copy', '-c:a', 'aac', '-b:a', '160k', '-shortest', '-movflags', '+faststart', out], check=True)
        print('done', out, silent)


if __name__ == '__main__':
    main()
