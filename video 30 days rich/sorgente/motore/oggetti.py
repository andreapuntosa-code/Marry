# -*- coding: utf-8 -*-
"""Oggetti del mondo: IA (sfere di luce), cristalli, edifici, tempio, muro, particelle."""
import math
import numpy as np
import skia
from .base import W, H, PAL, srgb, clamp, hash01, smoothstep
from .tela import glow, paint, path_from, clip_near, col4

LUCE_DIR = np.array([-0.45, 0.75, -0.35])
LUCE_DIR = LUCE_DIR / np.linalg.norm(LUCE_DIR)


class Scena:
    """Accumula oggetti con profondità e li disegna dal più lontano (painter's algorithm)."""

    def __init__(self, cam, tela):
        self.cam = cam
        self.tela = tela
        self.items = []
        self.lights = []
        self.labels = []   # (x, y, testo, colore) in coordinate schermo, per l'overlay

    def add(self, depth, fn):
        self.items.append((float(depth), len(self.items), fn))

    def light(self, pos, rgb, radius=3.0, intensity=1.0):
        self.lights.append([pos[0], max(0.3, pos[1]), pos[2], rgb[0], rgb[1], rgb[2], radius, intensity])

    def lights_array(self):
        return np.array(self.lights, np.float64) if self.lights else np.zeros((0, 8))

    def draw(self):
        for d, o, fn in sorted(self.items, key=lambda x: (-x[0], x[1])):
            fn()
        self.items = []


# ====================================================================== IA
def _ring_points(center, radius, tilt, yaw, n=64, style="round", t=0.0):
    a = np.linspace(0, 2 * math.pi, n + 1)
    if style == "hex":
        k = np.floor(a / (math.pi / 3))
        a0 = k * math.pi / 3
        frac = (a - a0) / (math.pi / 3)
        p0 = np.stack([np.cos(a0), np.sin(a0)], -1)
        p1 = np.stack([np.cos(a0 + math.pi / 3), np.sin(a0 + math.pi / 3)], -1)
        xy = p0 * (1 - frac)[:, None] + p1 * frac[:, None]
    elif style == "spike":
        rr = 1.0 + 0.28 * np.abs(np.sin(a * 3 + t * 0.5)) ** 6
        xy = np.stack([np.cos(a) * rr, np.sin(a) * rr], -1)
    else:
        xy = np.stack([np.cos(a), np.sin(a)], -1)
    pts = np.zeros((n + 1, 3))
    pts[:, 0] = xy[:, 0] * radius
    pts[:, 2] = xy[:, 1] * radius
    # inclinazione attorno a x, poi rotazione attorno a y
    ct, st = math.cos(tilt), math.sin(tilt)
    y = pts[:, 2] * st
    z = pts[:, 2] * ct
    pts[:, 1] = y
    pts[:, 2] = z
    cy, sy = math.cos(yaw), math.sin(yaw)
    x = pts[:, 0] * cy - pts[:, 2] * sy
    z = pts[:, 0] * sy + pts[:, 2] * cy
    pts[:, 0] = x
    pts[:, 2] = z
    return pts + np.asarray(center)


STILI = {"ISE": "double", "ORUN": "hex", "MIRA": "sparkle", "KASSA": "spike"}


def orb(scena, pos, rgb, r=0.35, intensity=1.0, t=0.0, seed=0, eye=None, style="round",
        dim=0.0, dead=False, speak=0.0, light=True, glow_scale=1.0, rings=True, label=None,
        label_rgb=None, flicker=0.0, detail=1.0, pupil=1.0, light_k=1.0, blink=0.0):
    """Una IA: sfera di luce con guscio di vetro, filamenti interni, iride a lamelle e anelli."""
    cam, tela = scena.cam, scena.tela
    pos = np.asarray(pos, float)
    sx, sy, z = cam.project1(pos)
    if z < 0.25:
        return
    pr = r * cam.focal / z
    rgb = np.asarray(rgb, float)
    if flicker > 0:
        intensity *= 1 - flicker * (0.5 + 0.5 * math.sin(t * 37 + seed * 3)) * hash01(int(t * 24), seed)
    inten = intensity * (1 - dim * 0.85)
    if dim > 0:
        rgb = rgb * (1 - dim) + srgb("#ff2a2a") * 0.5 * dim
    if light and not dead:
        scena.light(pos, rgb, 2.6, 0.55 * inten * light_k)
    if sx < -pr * 8 or sx > W + pr * 8 or sy < -pr * 8 or sy > H + pr * 8:
        return
    if label:
        scena.labels.append((sx, sy - max(pr * 2.2, 14), label, label_rgb if label_rgb is not None else rgb, z))
    big = smoothstep(14.0, 60.0, pr)          # quanto dettaglio mostrare

    def draw():
        c = tela.c
        if dead:
            if pr > 1.2:
                g = skia.GradientShader.MakeRadial(skia.Point(sx - pr * 0.3, sy - pr * 0.35), pr * 1.3,
                                                   [skia.Color4f(0.09, 0.095, 0.11, 1).toColor(), skia.Color4f(0.012, 0.012, 0.016, 1).toColor()])
                c.drawCircle(sx, sy, pr, skia.Paint(AntiAlias=True, Shader=g))
                if pr > 6:
                    pc = paint((0.0, 0.0, 0.0), 0.9, stroke=max(1.0, pr * 0.035))
                    rng = np.random.default_rng(seed)
                    for k in range(5):
                        a0 = rng.random() * 6.28
                        px, py = sx + math.cos(a0) * pr * 0.1, sy + math.sin(a0) * pr * 0.1
                        path = skia.Path()
                        path.moveTo(px, py)
                        for s in range(4):
                            a0 += rng.normal() * 0.6
                            px += math.cos(a0) * pr * 0.22
                            py += math.sin(a0) * pr * 0.22
                            path.lineTo(px, py)
                        c.drawPath(path, pc)
                    c.drawCircle(sx, sy, pr, paint((0.2, 0.22, 0.25), 0.5, stroke=max(1, pr * 0.025)))
            return
        # ---- aloni (limitati in primo piano per non allagare l'inquadratura)
        halo_r = min(pr * 7.0 * glow_scale, 0.42 * H + pr * 1.5)
        glow(tela, sx, sy, halo_r, rgb, 0.2 * inten * (1 - 0.45 * big), "alone")
        glow(tela, sx, sy, pr * (2.8 - 0.7 * big), rgb, 0.85 * inten * (1 - 0.35 * big), "alone")
        # ---- anelli orbitali
        ring_pts = []
        ring_a = smoothstep(7.0, 18.0, pr) * (1.0 if rings else 0.0)
        if ring_a > 0 and detail > 0:
            tilt = 1.15 + 0.25 * math.sin(t * 0.4 + seed)
            yaw = t * 0.6 + seed * 1.7
            st0 = ("hex" if style == "hex" else ("spike" if style == "spike" else "round")) if pr > 14 else "round"
            ring_pts.append(_ring_points(pos, r * 1.75, tilt, yaw, 96, st0, t))
            if style == "double" and pr > 14:
                ring_pts.append(_ring_points(pos, r * 2.15, tilt + 0.5, -yaw * 0.7 + 1.0, 96, "round"))
            elif style == "hex" and pr > 14:
                ring_pts.append(_ring_points(pos, r * 2.2, tilt - 0.35, yaw * 1.3 + 2.0, 96, "hex"))
        ring_w = max(1.0, pr * 0.028)

        def draw_ring(front):
            for k, rp in enumerate(ring_pts):
                X, Y, Z = cam.project(rp)
                mask = (Z < z) if front else (Z >= z)
                if not mask.any():
                    continue
                pth = skia.Path()
                started = False
                for i in range(len(X)):
                    if mask[i]:
                        if not started:
                            pth.moveTo(float(X[i]), float(Y[i])); started = True
                        else:
                            pth.lineTo(float(X[i]), float(Y[i]))
                    else:
                        started = False
                cc = rgb * (2.2 if front else 0.9) * inten
                c.drawPath(pth, paint(cc, 0.9 * ring_a, stroke=ring_w * (1.0 if k == 0 else 0.7)))
                # nodi che scorrono sull'anello
                if pr > 20:
                    nn = len(X) - 1
                    for q in range(3 if style != "sparkle" else 7):
                        idx = int(((t * (0.07 + 0.02 * k) + q / (3 if style != "sparkle" else 7) + seed * 0.1) % 1.0) * nn)
                        if mask[idx]:
                            glow(tela, float(X[idx]), float(Y[idx]), max(2.5, pr * 0.16), rgb, 2.0 * inten * ring_a, "nucleo", 64)

        draw_ring(False)
        if pr > 2.5:
            # ---- guscio di vetro con bordo di Fresnel
            g = skia.GradientShader.MakeRadial(skia.Point(sx, sy), pr,
                                               [col4(np.minimum(rgb * 0.10, 1), 0.65).toColor(),
                                                col4(np.minimum(rgb * 0.22, 1), 0.7).toColor(),
                                                col4(np.minimum(rgb * 0.85, 1), 0.85).toColor()], [0.0, 0.72, 1.0])
            c.drawCircle(sx, sy, pr, skia.Paint(AntiAlias=True, Shader=g))
            c.drawCircle(sx, sy, pr * 0.985, paint(rgb * 2.0 * inten, 0.9, stroke=max(0.8, pr * 0.03)))
            if big > 0:
                # filamenti di energia interni
                rng = np.random.default_rng(seed + 99)
                for k in range(6):
                    a0 = rng.random() * 6.28 + t * (0.25 + 0.1 * k) * (1 if k % 2 else -1)
                    rr = pr * (0.55 + 0.3 * rng.random())
                    sweep = 50 + 70 * rng.random()
                    oval = skia.Rect(sx - rr, sy - rr * (0.5 + 0.4 * rng.random()), sx + rr, sy + rr * (0.5 + 0.4 * rng.random()))
                    pth = skia.Path()
                    pth.addArc(oval, math.degrees(a0), sweep)
                    c.drawPath(pth, paint(rgb * 1.6 * inten, 0.45 * big, stroke=max(0.6, pr * 0.012)))
                # riflesso speculare sul vetro
                hl = skia.Path()
                hl.addArc(skia.Rect(sx - pr * 0.8, sy - pr * 0.8, sx + pr * 0.8, sy + pr * 0.8), 200, 50)
                c.drawPath(hl, paint((1, 1, 1), 0.35 * big, stroke=max(1.0, pr * 0.05)))
        # ---- nucleo
        corec = rgb * 0.6 + np.array([0.4, 0.4, 0.4])
        if eye is None or pr <= 26:
            glow(tela, sx, sy, pr * 1.25, corec, 3.0 * inten, "nucleo")
        else:
            ex, ey = eye
            cx2, cy2 = sx + ex * pr * 0.22, sy + ey * pr * 0.22
            glow(tela, cx2, cy2, pr * 1.0, corec, 1.6 * inten, "nucleo")
            # iride a lamelle (diaframma)
            ir = pr * 0.46
            nb = 9
            rot = t * 0.3 + seed
            open_k = 1.0 - blink
            for b in range(nb):
                a0 = rot * 57.3 + b * 360.0 / nb
                pth = skia.Path()
                pth.addArc(skia.Rect(cx2 - ir, cy2 - ir * open_k, cx2 + ir, cy2 + ir * open_k), a0, 360.0 / nb * 0.72)
                c.drawPath(pth, paint(rgb * 2.6 * inten, 0.95, stroke=max(1.2, pr * 0.07), cap="butt"))
            ir2 = pr * 0.33
            c.drawOval(skia.Rect(cx2 - ir2, cy2 - ir2 * open_k, cx2 + ir2, cy2 + ir2 * open_k), paint(rgb * 1.2 * inten, 0.6, stroke=max(0.8, pr * 0.012)))
            # pupilla
            prp = pr * 0.17 * pupil
            px, py = cx2 + ex * pr * 0.06, cy2 + ey * pr * 0.06
            c.drawOval(skia.Rect(px - prp, py - prp * open_k, px + prp, py + prp * open_k), paint((0.003, 0.003, 0.006), 0.96))
            c.drawOval(skia.Rect(px - prp, py - prp * open_k, px + prp, py + prp * open_k), paint(rgb * 3.0 * inten, 0.9, stroke=max(0.8, pr * 0.018)))
            glow(tela, px - prp * 0.45, py - prp * 0.5, prp * 0.55, (1, 1, 1), 2.2, "nucleo", 64)
        if speak > 0:
            ph = (t * 1.6 + seed * 0.13) % 1.0
            for k in range(2):
                phk = (ph + k * 0.5) % 1.0
                glow(tela, sx, sy, pr * (1.8 + 7 * phk), rgb, 1.4 * speak * (1 - phk) ** 2, "anello", 256)
        draw_ring(True)

    scena.add(z, draw)


def orb_points(scena, P, rgb, r=0.35, intensity=1.0, light_map=None, min_px=1.4):
    """Molte IA lontane come punti luminosi (veloce). P: (N,3)."""
    cam, tela = scena.cam, scena.tela
    if len(P) == 0:
        return
    X, Y, Z = cam.project(P)
    ok = (Z > 0.5) & (X > -20) & (X < W + 20) & (Y > -20) & (Y < H + 20)
    if not ok.any():
        return
    X, Y, Z = X[ok], Y[ok], Z[ok]
    pr = r * cam.focal / Z
    rgbs = np.asarray(rgb, float)
    per_point = rgbs.ndim == 2
    if per_point:
        rgbs = rgbs[ok]
    depth = float(np.median(Z))

    def draw():
        c = tela.c
        bins = [(0, 1.0), (1.0, 2.0), (2.0, 3.5), (3.5, 6), (6, 1e9)]
        for lo, hi in bins:
            m = (pr >= lo) & (pr < hi)
            if not m.any():
                continue
            w = max(min_px, min(hi, 8) * 1.1 if hi < 1e8 else 9)
            # attenuazione per punti più piccoli del pixel
            att = 1.0 if lo >= 1.0 else 0.55
            if per_point:
                cols = rgbs[m]
                keys = np.round(cols * 4) / 4
                uniq, inv = np.unique(keys, axis=0, return_inverse=True)
                for ui in range(len(uniq)):
                    mm = np.where(inv.ravel() == ui)[0]
                    pts = [skia.Point(float(a), float(b)) for a, b in zip(X[m][mm], Y[m][mm])]
                    p = paint(uniq[ui] * 3.0 * intensity * att, 1.0, stroke=w)
                    c.drawPoints(skia.Canvas.kPoints_PointMode, pts, p)
            else:
                pts = [skia.Point(float(a), float(b)) for a, b in zip(X[m], Y[m])]
                p = paint(rgbs * 3.0 * intensity * att, 1.0, stroke=w)
                c.drawPoints(skia.Canvas.kPoints_PointMode, pts, p)
                if lo >= 2.0:
                    for a, b, rr in zip(X[m], Y[m], pr[m]):
                        glow(tela, float(a), float(b), float(rr) * 5, rgbs, 0.25 * intensity, "alone", 64)
    scena.add(depth, draw)


# ====================================================================== poligoni
def _shade(normal, base, amb=0.35, dif=0.65):
    k = amb + dif * max(0.0, float(np.dot(normal, LUCE_DIR)))
    return np.asarray(base) * k


def face(scena, pts3, fill, edge=None, edge_w=1.2, alpha=1.0, gradient=None, cull=True, depth_bias=0.0):
    """Faccia poligonale piana (pts3: lista di punti 3D, ordine antiorario visto da fuori)."""
    cam = scena.cam
    P = np.asarray(pts3, float)
    ctr = P.mean(0)
    if cull and len(P) >= 3:
        n = np.cross(P[1] - P[0], P[2] - P[0])
        if np.dot(n, cam.pos - ctr) <= 0:
            return
    d = P - cam.pos
    zs = d @ cam.fwd
    if (zs < 0.15).all():
        return
    if (zs < 0.15).any():
        P = np.array(clip_near(zs, list(P)))
        if len(P) < 3:
            return
    X, Y, Z = cam.project(P)
    if X.max() < 0 or X.min() > W or Y.max() < 0 or Y.min() > H:
        return
    depth = float(Z.mean()) + depth_bias
    tela = scena.tela

    def draw():
        pth = path_from(X, Y)
        if gradient is not None:
            (p0, c0), (p1, c1) = gradient
            a0 = cam.project1(p0)
            a1 = cam.project1(p1)
            sh = skia.GradientShader.MakeLinear([skia.Point(a0[0], a0[1]), skia.Point(a1[0], a1[1])],
                                                [col4(np.minimum(c0, 1), alpha).toColor(), col4(np.minimum(c1, 1), alpha).toColor()])
            tela.c.drawPath(pth, skia.Paint(AntiAlias=True, Shader=sh))
        elif fill is not None:
            tela.c.drawPath(pth, paint(fill, alpha))
        if edge is not None:
            tela.c.drawPath(pth, paint(edge, 1.0, stroke=edge_w))
    scena.add(depth, draw)


# ====================================================================== cristalli
def crystal_cluster(scena, center, seed=0, scale=1.0, rgb=None, intensity=1.0, n=7, growth=1.0, light=True):
    rgb = PAL["ciano"] if rgb is None else np.asarray(rgb)
    rng = np.random.default_rng(seed)
    cam = scena.cam
    center = np.asarray(center, float)
    if growth <= 0.01:
        return
    for k in range(n):
        ang = rng.random() * 6.283
        dist = (0.0 if k == 0 else rng.uniform(0.6, 1.7)) * scale
        base = center + np.array([math.cos(ang) * dist, 0, math.sin(ang) * dist])
        hgt = (rng.uniform(2.6, 4.6) if k == 0 else rng.uniform(1.0, 3.0)) * scale * growth
        rad = (rng.uniform(0.45, 0.65) if k == 0 else rng.uniform(0.22, 0.42)) * scale
        tilt = 0 if k == 0 else rng.uniform(0.15, 0.55)
        tdir = np.array([math.cos(ang), 0, math.sin(ang)])
        axis = np.array([0, 1.0, 0]) * math.cos(tilt) + tdir * math.sin(tilt)
        axis /= np.linalg.norm(axis)
        # base ortonormale
        u = np.cross(axis, [0, 0, 1.0])
        if np.linalg.norm(u) < 1e-3:
            u = np.cross(axis, [1.0, 0, 0])
        u /= np.linalg.norm(u)
        v = np.cross(axis, u)
        rot = rng.random() * 6.28
        ring_b = []
        ring_t = []
        for s in range(6):
            a = rot + s * math.pi / 3
            off = (u * math.cos(a) + v * math.sin(a)) * rad
            ring_b.append(base + off - axis * 0.4 * scale)
            ring_t.append(base + off * 0.92 + axis * hgt)
        tip = base + axis * (hgt + rad * 1.6)
        inten = intensity * (0.8 + 0.4 * rng.random())
        for s in range(6):
            a, b = ring_b[s], ring_b[(s + 1) % 6]
            c_, d_ = ring_t[(s + 1) % 6], ring_t[s]
            nrm = np.cross(b - a, d_ - a)
            nrm /= (np.linalg.norm(nrm) + 1e-9)
            lit = 0.55 + 0.45 * max(0.0, float(np.dot(nrm, LUCE_DIR)))
            low = rgb * 0.10 * lit * inten
            high = rgb * 0.85 * lit * inten
            face(scena, [a, b, c_, d_], None, edge=rgb * 1.6 * inten, edge_w=1.0,
                 gradient=((base, low), (base + axis * hgt, high)))
            nrm2 = np.cross(ring_t[(s + 1) % 6] - ring_t[s], tip - ring_t[s])
            nrm2 /= (np.linalg.norm(nrm2) + 1e-9)
            lit2 = 0.6 + 0.4 * max(0.0, float(np.dot(nrm2, LUCE_DIR)))
            face(scena, [ring_t[s], ring_t[(s + 1) % 6], tip], rgb * 1.3 * lit2 * inten, edge=rgb * 2.2 * inten, edge_w=1.0)
    # bagliore e luce sul terreno
    sx, sy, z = cam.project1(center + np.array([0, 2.0 * scale * growth, 0]))
    if z > 0.3:
        pr = scale * cam.focal / z
        scena.add(z - 2.5 * scale, lambda: (glow(scena.tela, sx, sy, pr * 6, rgb, 0.45 * intensity, "alone"),
                                           glow(scena.tela, sx, sy, pr * 2.0, rgb, 0.8 * intensity, "alone")))
    if light:
        scena.light(center + np.array([0, 1.5 * scale, 0]), rgb, 5.0 * scale, 2.2 * intensity * growth)


# ====================================================================== edifici
def box(scena, x0, z0, x1, z1, h, y0=0.0, fill=None, edge=None, edge_w=1.0, windows=0.0, win_rgb=None,
        seed=0, top_edge_only=False, alpha=1.0):
    fill = srgb("#0d1220") if fill is None else np.asarray(fill)
    y1 = y0 + h
    A = np.array([x0, y0, z0]); B = np.array([x1, y0, z0]); C = np.array([x1, y0, z1]); D = np.array([x0, y0, z1])
    A2, B2, C2, D2 = A + [0, h, 0], B + [0, h, 0], C + [0, h, 0], D + [0, h, 0]
    faces = [
        ([A2, D2, C2, B2], np.array([0, 1.0, 0])),      # top
        ([A, A2, B2, B], np.array([0, 0, -1.0])),       # z0
        ([B, B2, C2, C], np.array([1.0, 0, 0])),        # x1
        ([C, C2, D2, D], np.array([0, 0, 1.0])),        # z1
        ([D, D2, A2, A], np.array([-1.0, 0, 0])),       # x0
    ]
    for pts, nrm in faces:
        col = _shade(nrm, fill)
        face(scena, pts, col, edge=edge, edge_w=edge_w, alpha=alpha)
    if windows > 0 and h > 1.0:
        _windows(scena, (x0, z0, x1, z1, y0, y1), windows, win_rgb, seed)


def _windows(scena, b, density, rgb, seed):
    x0, z0, x1, z1, y0, y1 = b
    cam = scena.cam
    rng = np.random.default_rng(seed)
    rgb = PAL["oro"] if rgb is None else np.asarray(rgb)
    pts = []
    rows = max(1, int((y1 - y0) / 1.6))
    for side in range(4):
        if side == 0:
            a, bb, nrm = np.array([x0, 0, z0]), np.array([x1, 0, z0]), np.array([0, 0, -1.0])
        elif side == 1:
            a, bb, nrm = np.array([x1, 0, z0]), np.array([x1, 0, z1]), np.array([1.0, 0, 0])
        elif side == 2:
            a, bb, nrm = np.array([x1, 0, z1]), np.array([x0, 0, z1]), np.array([0, 0, 1.0])
        else:
            a, bb, nrm = np.array([x0, 0, z1]), np.array([x0, 0, z0]), np.array([-1.0, 0, 0])
        mid = (a + bb) / 2 + np.array([0, (y0 + y1) / 2, 0])
        if np.dot(nrm, cam.pos - mid) <= 0:
            continue
        L = np.linalg.norm(bb - a)
        cols = max(1, int(L / 1.3))
        for rr in range(rows):
            for cc in range(cols):
                if rng.random() > density:
                    continue
                p = a + (bb - a) * ((cc + 0.5) / cols) + np.array([0, y0 + (rr + 0.6) * (y1 - y0) / (rows + 0.2), 0]) + nrm * 0.03
                pts.append(p)
    if not pts:
        return
    P = np.array(pts)
    X, Y, Z = cam.project(P)
    ok = Z > 0.3
    if not ok.any():
        return
    X, Y, Z = X[ok], Y[ok], Z[ok]
    sz = np.clip(0.45 * cam.focal / Z, 1.0, 14)
    depth = float(Z.mean()) - 0.05
    tela = scena.tela

    def draw():
        for lo, hi in ((0, 1.6), (1.6, 3), (3, 6), (6, 100)):
            m = (sz >= lo) & (sz < hi)
            if m.any():
                p = paint(rgb * 2.2, 1.0, stroke=float(min(hi, 8)), cap="butt")
                tela.c.drawPoints(skia.Canvas.kPoints_PointMode, [skia.Point(float(a), float(b)) for a, b in zip(X[m], Y[m])], p)
    scena.add(depth, draw)


def tower(scena, cx, cz, radius, h, sides=6, fill=None, edge=None, bands=0, band_rgb=None, beacon=None, y0=0.0, rot=0.0):
    fill = srgb("#0c111e") if fill is None else np.asarray(fill)
    ring0, ring1 = [], []
    for s in range(sides):
        a = rot + s * 2 * math.pi / sides
        ring0.append(np.array([cx + math.cos(a) * radius, y0, cz + math.sin(a) * radius]))
        ring1.append(np.array([cx + math.cos(a) * radius * 0.82, y0 + h, cz + math.sin(a) * radius * 0.82]))
    for s in range(sides):
        a, b = ring0[s], ring0[(s + 1) % sides]
        c, d = ring1[(s + 1) % sides], ring1[s]
        nrm = np.cross(c - a, d - a) * -1
        nrm = np.cross(b - a, d - a)
        nrm /= np.linalg.norm(nrm) + 1e-9
        face(scena, [a, d, c, b], _shade(-nrm, fill), edge=edge, edge_w=1.0)
    face(scena, list(reversed(ring1)), _shade(np.array([0, 1.0, 0]), fill) * 1.2, edge=edge, edge_w=1.0)
    if bands:
        brgb = PAL["ciano"] if band_rgb is None else np.asarray(band_rgb)
        for k in range(1, bands + 1):
            yy = y0 + h * k / (bands + 1)
            rr = radius * (1 - 0.18 * k / (bands + 1)) + 0.04
            pts = [np.array([cx + math.cos(rot + s * 2 * math.pi / 24) * rr, yy, cz + math.sin(rot + s * 2 * math.pi / 24) * rr]) for s in range(25)]
            _polyline3(scena, pts, brgb * 2.0, 1.4, front_only=True, center=np.array([cx, yy, cz]))
    if beacon is not None:
        top = np.array([cx, y0 + h + 0.4, cz])
        sx, sy, z = scena.cam.project1(top)
        if z > 0.3:
            pr = 0.4 * scena.cam.focal / z
            scena.add(z - 0.5, lambda: glow(scena.tela, sx, sy, max(3, pr * 5), beacon, 1.2, "alone"))
            scena.light(top, beacon, 6.0, 0.6)


def _polyline3(scena, pts, rgb, w, front_only=False, center=None):
    cam = scena.cam
    P = np.asarray(pts, float)
    X, Y, Z = cam.project(P)
    if (Z < 0.3).any():
        return
    keep = np.ones(len(P), bool)
    if front_only and center is not None:
        keep = ((P - center) @ (cam.pos - center)) > 0
    depth = float(Z.mean()) - 0.1
    tela = scena.tela

    def draw():
        pth = skia.Path()
        started = False
        for i in range(len(X)):
            if keep[i]:
                if not started:
                    pth.moveTo(float(X[i]), float(Y[i])); started = True
                else:
                    pth.lineTo(float(X[i]), float(Y[i]))
            else:
                started = False
        tela.c.drawPath(pth, paint(rgb, 1.0, stroke=w))
    scena.add(depth, draw)


def dome(scena, cx, cz, radius, fill=None, edge=None, lat=4, lon=12, y0=0.0):
    fill = srgb("#0d1322") if fill is None else np.asarray(fill)
    for i in range(lat):
        a0 = (i / lat) * math.pi / 2
        a1 = ((i + 1) / lat) * math.pi / 2
        for j in range(lon):
            b0 = j * 2 * math.pi / lon
            b1 = (j + 1) * 2 * math.pi / lon
            def P(a, b):
                return np.array([cx + math.cos(a) * math.cos(b) * radius, y0 + math.sin(a) * radius, cz + math.cos(a) * math.sin(b) * radius])
            p00, p01, p11, p10 = P(a0, b0), P(a0, b1), P(a1, b1), P(a1, b0)
            nrm = (p00 + p01 + p11 + p10) / 4 - np.array([cx, y0, cz])
            nrm /= np.linalg.norm(nrm) + 1e-9
            pts = [p00, p10, p11, p01] if i < lat - 1 else [p00, p10, p01]
            face(scena, pts, _shade(nrm, fill, 0.3, 0.8), edge=edge, edge_w=1.0)


def temple(scena, cx, cz, size=10.0, tiers=5, fill=None, edge=None, beam=0.0, beam_rgb=None, t=0.0, build=1.0):
    """Ziggurat a gradoni con guglia e fascio di luce verso il cielo."""
    fill = srgb("#121522") if fill is None else np.asarray(fill)
    edge = PAL["oro"] * 2.0 if edge is None else edge
    th = size * 0.22
    nt = max(1, int(math.ceil(tiers * build)))
    for k in range(nt):
        s = size * (1 - k / (tiers + 0.6))
        frac = 1.0 if k < nt - 1 else (tiers * build - k)
        box(scena, cx - s, cz - s, cx + s, cz + s, th * clamp(frac, 0.05, 1), y0=k * th, fill=fill, edge=edge, edge_w=1.4)
    top_y = tiers * th
    if build >= 1.0:
        tip = np.array([cx, top_y + size * 1.6, cz])
        s2 = size * 0.22
        base = [np.array([cx - s2, top_y, cz - s2]), np.array([cx + s2, top_y, cz - s2]), np.array([cx + s2, top_y, cz + s2]), np.array([cx - s2, top_y, cz + s2])]
        for i in range(4):
            a, b = base[i], base[(i + 1) % 4]
            nrm = np.cross(b - a, tip - a)
            nrm /= np.linalg.norm(nrm) + 1e-9
            face(scena, [a, tip, b][::-1], _shade(nrm, fill * 1.4), edge=edge * 1.2, edge_w=1.4)
        if beam > 0:
            brgb = PAL["oro"] if beam_rgb is None else np.asarray(beam_rgb)
            light_column(scena, np.array([cx, top_y + size * 1.6, cz]), 2000.0, size * 0.35, brgb, beam, t)
        scena.light(np.array([cx, top_y, cz]), PAL["oro"], size * 1.4, 1.2 + 3 * beam)


def light_column(scena, base, height, width, rgb, intensity, t=0.0):
    """Colonna di luce verticale (billboard additivo)."""
    cam = scena.cam
    top = base + np.array([0, height, 0])
    bx, by, bz = cam.project1(base)
    tx, ty, tz = cam.project1(top)
    if bz < 0.3:
        return
    wpx = width * cam.focal / bz
    tela = scena.tela

    def draw():
        n = 40
        for i in range(n):
            f = i / n
            x = bx + (tx - bx) * f if tz > 0.3 else bx
            y = by + (ty - by) * f if tz > 0.3 else by - f * H * 2
            k = intensity * (1 - f) ** 1.5 * (0.85 + 0.15 * math.sin(t * 3 + f * 20))
            glow(tela, x, y, wpx * (2.5 + f * 2), rgb, 0.18 * k, "alone")
        glow(tela, bx, by, wpx * 6, rgb, 1.5 * intensity, "alone")
        glow(tela, bx, by, wpx * 2, (1, 1, 1), 2.0 * intensity, "nucleo")
    scena.add(bz - 1, draw)


def wall(scena, x0, z0, x1, z1, h, thick=1.2, fill=None, edge=None, rise=1.0):
    fill = srgb("#0a0c12") if fill is None else np.asarray(fill)
    edge = PAL["cremisi"] * 2.0 if edge is None else edge
    d = np.array([x1 - x0, 0, z1 - z0])
    L = np.linalg.norm(d)
    d /= L
    n = np.array([-d[2], 0, d[0]]) * thick / 2
    hh = h * rise
    if hh < 0.05:
        return
    seg = max(1, int(L / 12))
    for s in range(seg):
        a = np.array([x0, 0, z0]) + d * L * s / seg
        b = np.array([x0, 0, z0]) + d * L * (s + 1) / seg
        pts = [a - n, b - n, b + n, a + n]
        xs = [p[0] for p in pts]
        zs = [p[2] for p in pts]
        # usa box allineato agli assi se possibile, altrimenti facce manuali
        A, B, C, D = pts
        up = np.array([0, hh, 0])
        for q in ([A, A + up, B + up, B], [B, B + up, C + up, C], [C, C + up, D + up, D], [D, D + up, A + up, A]):
            nrm = np.cross(q[1] - q[0], q[3] - q[0])
            nrm /= np.linalg.norm(nrm) + 1e-9
            face(scena, q, _shade(nrm, fill), edge=edge * 0.6, edge_w=1.0)
        face(scena, [A + up, D + up, C + up, B + up], fill * 1.5, edge=edge, edge_w=1.6)


# ====================================================================== particelle
def dust(scena, t, n=160, seed=1, box_size=40.0, rgb=None, intensity=0.5, center=None, speed=0.4):
    """Pulviscolo sospeso attorno alla camera (con bokeh per quelli vicini)."""
    cam = scena.cam
    rng = np.random.default_rng(seed)
    base = rng.random((n, 3)) * box_size - box_size / 2
    drift = rng.normal(size=(n, 3)) * 0.3
    drift[:, 1] = np.abs(drift[:, 1]) * 0.6
    c0 = cam.pos if center is None else np.asarray(center)
    P = base + drift * t * speed * 10
    P = (P - (c0 - box_size / 2)) % box_size + (c0 - box_size / 2)
    P[:, 1] = np.abs(P[:, 1]) % (box_size / 3) + 0.2
    X, Y, Z = cam.project(P)
    rgb = srgb("#7fb2ff") * 0.6 if rgb is None else np.asarray(rgb)
    tela = scena.tela
    for i in range(n):
        if Z[i] < 0.5 or X[i] < -50 or X[i] > W + 50 or Y[i] < -50 or Y[i] > H + 50:
            continue
        z = Z[i]
        pr = 0.03 * cam.focal / z
        bok = max(0.0, 7.0 - z) / 7.0
        rad = max(1.2, pr * 3 + bok * 30)
        inten = intensity * (0.4 + 0.6 * hash01(i, seed)) / (1 + bok * 25) * (0.5 if rad > 6 else 1.0)
        x, y = float(X[i]), float(Y[i])
        scena.add(z, (lambda x=x, y=y, rad=rad, inten=inten: glow(tela, x, y, rad, rgb, inten, "disco" if rad > 6 else "nucleo", 64)))
