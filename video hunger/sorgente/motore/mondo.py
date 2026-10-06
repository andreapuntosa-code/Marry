# -*- coding: utf-8 -*-
"""Il mondo della simulazione: planimetria di Prima nel tempo, cristalli, folle, lightmap."""
import math
import numpy as np
import cv2
from .base import PAL, srgb, clamp, smoothstep, hash01, colore_agente, COLORI_IA
from . import oggetti as og

SPAWN = np.array([-38.0, 0.0, -26.0])
A15_FINE = np.array([-96.0, 0.0, -84.0])
TEMPIO = np.array([0.0, 0.0, 0.0])
ASSEMBLEA = np.array([58.0, 0.0, -52.0])
ARCHIVIO = np.array([-34.0, 0.0, 30.0])
PRIGIONE = np.array([-72.0, 0.0, 46.0])
MAGAZZINO = np.array([42.0, 0.0, 48.0])
MURO_X = 22.0
PIATTAFORMA = (26.0, 26.0, 96.0, 96.0, 5.0)    # x0,z0,x1,z1,altezza del quartiere alto
MESSAGGIO_C = np.array([0.0, 0.0, -430.0])
BORDO_Z = 2400.0

CRISTALLI = [
    # (x, z, scala, seed, esaurito_al_ciclo)
    (0.0, 0.0, 1.7, 1, 1e9),          # il primo cristallo (sotto il futuro tempio)
    (52.0, 34.0, 1.0, 2, 7600),
    (-64.0, 58.0, 1.1, 3, 7200),
    (92.0, -44.0, 0.9, 4, 8300),
    (-112.0, -18.0, 1.0, 5, 6900),
    (22.0, 98.0, 1.2, 6, 8800),
    (132.0, 72.0, 0.85, 7, 8100),
    (-34.0, -124.0, 0.95, 8, 7800),
    (160.0, -10.0, 0.8, 9, 6400),
    (-150.0, 90.0, 0.9, 10, 7000),
]

COL_TESTIMONI = srgb("#ffc861")
COL_CALCOLATORI = srgb("#4fe3ff")
COL_KASSA = srgb("#ff3b4f")
COL_NEUTRO = srgb("#dfe8ff")


def _gen_citta():
    rng = np.random.default_rng(42)
    B = []

    def add(**kw):
        kw.setdefault("y0", 0.0)
        kw.setdefault("destroy", None)
        kw.setdefault("rebuild", None)
        kw.setdefault("win", 0.0)
        kw.setdefault("seed", int(rng.integers(0, 1 << 30)))
        kw.setdefault("rot", 0.0)
        B.append(kw)

    # --- 1. anello di muri bassi attorno al primo cristallo (2000-2400)
    for k in range(18):
        a = k * 2 * math.pi / 18
        r = 11.0
        if k % 6 == 0:
            continue
        cx, cz = math.cos(a) * r, math.sin(a) * r
        add(kind="box", x=cx, z=cz, w=3.2, d=1.0, h=2.2, b0=2000 + k * 20, b1=2150 + k * 20, district="core",
            rot=a + math.pi / 2)
    # --- 2. cupole (2200-2900)
    for k in range(14):
        a = k * 2 * math.pi / 14 + 0.2
        r = 19 + rng.uniform(-2, 3)
        add(kind="dome", x=math.cos(a) * r, z=math.sin(a) * r, r=rng.uniform(2.8, 4.2), h=0, b0=2200 + k * 40, b1=2350 + k * 40,
            district="core")
    # --- 3. prime torri (2500-3000)
    for k in range(9):
        a = k * 2 * math.pi / 9 + 0.5
        r = 30 + rng.uniform(-3, 5)
        add(kind="tower", x=math.cos(a) * r, z=math.sin(a) * r, r=rng.uniform(1.6, 2.4), h=rng.uniform(16, 28), b0=2500 + k * 50,
            b1=2700 + k * 50, district="core", bands=3)
    # --- 4. quartiere alto (piattaforma) 3000-4000
    x0, z0, x1, z1, ph = PIATTAFORMA
    add(kind="platform", x=(x0 + x1) / 2, z=(z0 + z1) / 2, w=x1 - x0, d=z1 - z0, h=ph, b0=3000, b1=3150, district="alto")
    for k in range(70):
        px, pz = rng.uniform(x0 + 4, x1 - 4), rng.uniform(z0 + 4, z1 - 4)
        if rng.random() < 0.45:
            add(kind="tower", x=px, z=pz, r=rng.uniform(1.4, 2.6), h=rng.uniform(18, 52), y0=ph, b0=3150 + k * 12, b1=3350 + k * 12,
                district="alto", bands=int(rng.integers(2, 6)), destroy=4230 if rng.random() < 0.2 else None)
        else:
            w, d = rng.uniform(3, 7), rng.uniform(3, 7)
            add(kind="box", x=px, z=pz, w=w, d=d, h=rng.uniform(6, 20), y0=ph, b0=3150 + k * 12, b1=3300 + k * 12,
                district="alto", win=0.75, destroy=4230 if rng.random() < 0.2 else None)
    # --- 5. quartiere basso 3200-4100
    for k in range(150):
        px, pz = rng.uniform(-98, -18), rng.uniform(-98, -16)
        if (px + 38) ** 2 + (pz + 26) ** 2 < 70:   # lascia libero il punto di spawn
            continue
        w, d = rng.uniform(2.2, 5), rng.uniform(2.2, 5)
        add(kind="box", x=px, z=pz, w=w, d=d, h=rng.uniform(1.6, 5.5), b0=3200 + k * 6, b1=3300 + k * 6, district="basso",
            win=0.25, destroy=4215 + int(rng.integers(0, 50)) if rng.random() < 0.8 else None)
    # --- 6. anello medio (3000-4200)
    for k in range(120):
        a = rng.uniform(0, 2 * math.pi)
        r = rng.uniform(36, 75)
        px, pz = math.cos(a) * r, math.sin(a) * r
        if x0 - 4 < px < x1 + 4 and z0 - 4 < pz < z1 + 4:
            continue
        if px < -16 and pz < -14:
            continue
        if rng.random() < 0.2:
            add(kind="tower", x=px, z=pz, r=rng.uniform(1.3, 2.2), h=rng.uniform(12, 30), b0=3000 + k * 10, b1=3200 + k * 10,
                district="medio", bands=3, destroy=4240 if rng.random() < 0.5 else None)
        else:
            add(kind="box", x=px, z=pz, w=rng.uniform(2.5, 6), d=rng.uniform(2.5, 6), h=rng.uniform(3, 11), b0=3000 + k * 10,
                b1=3150 + k * 10, district="medio", win=0.5, destroy=4220 + int(rng.integers(0, 60)) if rng.random() < 0.5 else None)
    # --- 7. ricostruzione ed espansione (4400-9000)
    for k in range(380):
        a = rng.uniform(0, 2 * math.pi)
        r = rng.uniform(40, 165)
        px, pz = math.cos(a) * r, math.sin(a) * r
        if x0 - 4 < px < x1 + 4 and z0 - 4 < pz < z1 + 4:
            continue
        if abs(px - MURO_X) < 4:
            continue
        b0 = 4400 + (r - 40) / 125 * 4300 + rng.uniform(-300, 300)
        if rng.random() < 0.18:
            add(kind="tower", x=px, z=pz, r=rng.uniform(1.2, 2.4), h=rng.uniform(14, 40), b0=b0, b1=b0 + 150, district="esterno", bands=3)
        else:
            add(kind="box", x=px, z=pz, w=rng.uniform(2.5, 7), d=rng.uniform(2.5, 7), h=rng.uniform(3, 14), b0=b0, b1=b0 + 120,
                district="esterno", win=0.55)
    # --- edifici speciali
    add(kind="archive", x=ARCHIVIO[0], z=ARCHIVIO[2], w=12, d=7, h=6, b0=3050, b1=3200, district="core", win=0.0)
    add(kind="magazzino", x=MAGAZZINO[0], z=MAGAZZINO[2], w=10, d=10, h=7, y0=PIATTAFORMA[4], b0=3500, b1=3600, district="alto", win=0.0)
    add(kind="prigione", x=PRIGIONE[0], z=PRIGIONE[2], w=10, d=10, h=4, b0=3913, b1=3930, district="basso")
    add(kind="assemblea", x=ASSEMBLEA[0], z=ASSEMBLEA[2], r=16, h=4, b0=5800, b1=6000, district="esterno")
    return B


CITTA = _gen_citta()


def _built(b, ciclo):
    if ciclo < b["b0"]:
        return 0.0
    return clamp((ciclo - b["b0"]) / max(1.0, b["b1"] - b["b0"]))


def stato_edificio(b, ciclo):
    """(frazione_costruita, stato) con stato in {'ok','crollo','rovina'}."""
    f = _built(b, ciclo)
    d = b["destroy"]
    if d is not None and ciclo >= d:
        rb = 4500 + (b["seed"] % 2500)
        if b["district"] == "basso":
            rb = 1e9   # il quartiere basso non viene ricostruito
        if ciclo >= rb:
            return clamp((ciclo - rb) / 150.0), "ok"
        if ciclo < d + 25:
            return 1.0 - (ciclo - d) / 25.0 * 0.7, "crollo"
        return 0.3, "rovina"
    return f, "ok"


def edifici_attivi(ciclo):
    return [(b, *stato_edificio(b, ciclo)) for b in CITTA if stato_edificio(b, ciclo)[0] > 0.01]


def colori_distretto(b, ciclo, fazioni=False):
    d = b["district"]
    if fazioni and ciclo >= 6200 and d != "basso":
        east = b["x"] > MURO_X
        edge = (COL_CALCOLATORI if east else COL_TESTIMONI) * 1.4
        win = (COL_CALCOLATORI if east else COL_TESTIMONI)
        if d == "alto":
            edge = COL_KASSA * 1.3
        return edge, win
    if d == "alto":
        return PAL["oro"] * 1.6, PAL["oro"]
    if d == "basso":
        return srgb("#3a6f8f") * 0.9, srgb("#ff9a3c") * 0.6
    return PAL["ciano"] * 1.1, srgb("#ffd9a0")


def disegna_citta(scena, ciclo, t=0.0, fazioni=False, max_dist=420.0, luce_finestre=1.0, tempio_beam=0.0,
                  muro_rise=None, spenti=False, tempio_build=None):
    cam = scena.cam
    for b, f, st in edifici_attivi(ciclo):
        dx, dz = b["x"] - cam.pos[0], b["z"] - cam.pos[2]
        dist = math.hypot(dx, dz)
        if dist > max_dist:
            continue
        # culling grossolano dietro la camera
        v = np.array([b["x"], b.get("y0", 0) + b.get("h", 4) * 0.5, b["z"]]) - cam.pos
        if v @ cam.fwd < -30:
            continue
        edge, win = colori_distretto(b, ciclo, fazioni)
        if st != "ok":
            edge = edge * 0.25
        if spenti:
            edge = edge * 0.35
        k = b["kind"]
        y0 = b.get("y0", 0.0)
        if k == "box":
            hh = b["h"] * f
            if b["rot"]:
                # muretti ruotati: faccia manuale con box orientato
                _box_ruotato(scena, b, hh, edge)
            else:
                og.box(scena, b["x"] - b["w"] / 2, b["z"] - b["d"] / 2, b["x"] + b["w"] / 2, b["z"] + b["d"] / 2, hh, y0=y0,
                       edge=edge, edge_w=1.0, windows=(b["win"] * luce_finestre if (st == "ok" and f > 0.98) else 0.0),
                       win_rgb=win, seed=b["seed"])
        elif k == "tower":
            og.tower(scena, b["x"], b["z"], b["r"], b["h"] * f, sides=6, edge=edge, bands=b.get("bands", 0) if st == "ok" else 0,
                     band_rgb=win * 1.2, y0=y0, rot=b["seed"] % 6, beacon=(win * 1.5 if (st == "ok" and f > 0.98 and b["h"] > 25) else None))
        elif k == "dome":
            og.dome(scena, b["x"], b["z"], b["r"] * (0.3 + 0.7 * f) if st == "ok" else b["r"] * 0.5, edge=edge, lat=3, lon=10)
        elif k == "platform":
            og.box(scena, b["x"] - b["w"] / 2, b["z"] - b["d"] / 2, b["x"] + b["w"] / 2, b["z"] + b["d"] / 2, b["h"] * f,
                   fill=srgb("#10141f"), edge=PAL["oro"] * 1.3, edge_w=1.6)
        elif k in ("archive", "magazzino"):
            col = PAL["ciano"] * 1.5 if k == "archive" else COL_KASSA * 1.4
            og.box(scena, b["x"] - b["w"] / 2, b["z"] - b["d"] / 2, b["x"] + b["w"] / 2, b["z"] + b["d"] / 2, b["h"] * f, y0=y0,
                   fill=srgb("#121826"), edge=col, edge_w=1.8)
        elif k == "prigione":
            hw = b["w"] / 2
            for (ax, az, bx, bz) in ((-hw, -hw, hw, -hw), (hw, -hw, hw, hw), (hw, hw, -hw, hw), (-hw, hw, -hw, -hw)):
                og.wall(scena, b["x"] + ax, b["z"] + az, b["x"] + bx, b["z"] + bz, b["h"] * f, thick=0.8, edge=COL_KASSA * 1.2)
        elif k == "assemblea":
            _anfiteatro(scena, b, f)
    # tempio sul primo cristallo
    if ciclo >= 4800:
        tb = clamp((ciclo - 4800) / 200.0) if tempio_build is None else tempio_build
        og.temple(scena, TEMPIO[0], TEMPIO[2], size=12.0, tiers=5, beam=tempio_beam, t=t, build=tb,
                  edge=(PAL["oro"] * (2.0 if not spenti else 0.8)))
    # muro
    if ciclo >= 9000:
        rise = clamp((ciclo - 9000) / 40.0) if muro_rise is None else muro_rise
        og.wall(scena, MURO_X, -170, MURO_X, -7, 9.0, thick=1.6, rise=rise)
        og.wall(scena, MURO_X, 7, MURO_X, 170, 9.0, thick=1.6, rise=rise)


def _box_ruotato(scena, b, hh, edge):
    c, s = math.cos(b["rot"]), math.sin(b["rot"])
    hw, hd = b["w"] / 2, b["d"] / 2
    corners = [(-hw, -hd), (hw, -hd), (hw, hd), (-hw, hd)]
    P = [np.array([b["x"] + x * c - z * s, 0.0, b["z"] + x * s + z * c]) for x, z in corners]
    up = np.array([0, hh, 0])
    fill = srgb("#0d1220")
    for i in range(4):
        a, bb = P[i], P[(i + 1) % 4]
        q = [a, a + up, bb + up, bb]
        nrm = np.cross(q[1] - q[0], q[3] - q[0])
        nrm /= np.linalg.norm(nrm) + 1e-9
        og.face(scena, q, og._shade(nrm, fill), edge=edge, edge_w=1.0)
    og.face(scena, [P[0] + up, P[3] + up, P[2] + up, P[1] + up], fill * 1.4, edge=edge, edge_w=1.0)


def _anfiteatro(scena, b, f):
    """Anfiteatro a gradoni concentrici (luogo dell'assemblea)."""
    cx, cz = b["x"], b["z"]
    for ring in range(4):
        r0 = 6 + ring * 3.0
        hh = 0.8 * (ring + 1) * f
        n = 24
        for k in range(n):
            if k in (0, 1):   # ingresso
                continue
            a0 = k * 2 * math.pi / n
            a1 = (k + 1) * 2 * math.pi / n
            p0 = np.array([cx + math.cos(a0) * r0, 0, cz + math.sin(a0) * r0])
            p1 = np.array([cx + math.cos(a1) * r0, 0, cz + math.sin(a1) * r0])
            p2 = np.array([cx + math.cos(a1) * (r0 + 3), 0, cz + math.sin(a1) * (r0 + 3)])
            p3 = np.array([cx + math.cos(a0) * (r0 + 3), 0, cz + math.sin(a0) * (r0 + 3)])
            up = np.array([0, hh, 0])
            og.face(scena, [p0 + up, p3 + up, p2 + up, p1 + up], srgb("#161b2a"), edge=PAL["ciano"] * 0.9, edge_w=1.0)
            nrm = np.cross(p1 - p0, up)
            og.face(scena, [p0, p0 + up, p1 + up, p1], srgb("#0e121c"), edge=None)


def disegna_cristalli(scena, ciclo, growth=1.0, intensita=1.0, solo_primo=False, escludi_primo=False):
    for i, (x, z, s, seed, esaurito) in enumerate(CRISTALLI):
        if solo_primo and i > 0:
            continue
        if escludi_primo and i == 0:
            continue
        if i == 0 and ciclo >= 4800:
            continue   # coperto dal tempio
        g = growth
        inten = intensita
        if ciclo >= esaurito:
            continue
        if ciclo > esaurito - 1200:
            inten *= clamp((esaurito - ciclo) / 1200.0) * 0.8 + 0.2
        og.crystal_cluster(scena, (x, 0, z), seed=seed, scale=s, growth=g, intensity=inten)


# ====================================================================== folle
def folla_citta(ciclo, n, seed=0, raggio=150.0):
    rng = np.random.default_rng(seed)
    a = rng.uniform(0, 2 * np.pi, n)
    r = np.sqrt(rng.uniform(0.02, 1.0, n)) * raggio
    P = np.stack([np.cos(a) * r, np.full(n, 1.0), np.sin(a) * r], -1)
    x0, z0, x1, z1, ph = PIATTAFORMA
    up = (P[:, 0] > x0) & (P[:, 0] < x1) & (P[:, 2] > z0) & (P[:, 2] < z1)
    P[up, 1] += ph
    P[:, 1] += rng.normal(0, 0.12, n)
    return P


def colori_fazioni(P, ciclo, seed=0):
    rng = np.random.default_rng(seed + 5)
    n = len(P)
    C = np.tile(COL_NEUTRO, (n, 1))
    if ciclo >= 5200:
        east = P[:, 0] > MURO_X
        r = rng.random(n)
        C[~east & (r < 0.75)] = COL_TESTIMONI
        C[east & (r < 0.7)] = COL_CALCOLATORI
        x0, z0, x1, z1, ph = PIATTAFORMA
        up = (P[:, 0] > x0) & (P[:, 0] < x1) & (P[:, 2] > z0) & (P[:, 2] < z1)
        C[up & (r < 0.5)] = COL_KASSA
    return C


def folla_cerchi(centro, n, r0=16.0, passo=1.6, seed=0):
    """Folla disposta in cerchi concentrici (rito al tempio)."""
    pts = []
    ring = 0
    rng = np.random.default_rng(seed)
    while len(pts) < n:
        r = r0 + ring * passo
        k = int(2 * math.pi * r / 1.5)
        for i in range(k):
            a = i * 2 * math.pi / k + ring * 0.3
            pts.append((centro[0] + math.cos(a) * r + rng.normal(0, 0.15), 1.0 + rng.normal(0, 0.05),
                        centro[2] + math.sin(a) * r + rng.normal(0, 0.15)))
            if len(pts) >= n:
                break
        ring += 1
    return np.array(pts)


def lightmap_folla(P, C, bounds, res=512, sigma=1.6, k=0.06):
    """Lightmap in coordinate mondo per migliaia di IA (pozze di luce aggregate)."""
    x0, z0, x1, z1 = bounds
    acc = np.zeros((res, res, 3), np.float32)
    u = ((P[:, 0] - x0) / (x1 - x0) * res).astype(int)
    v = ((P[:, 2] - z0) / (z1 - z0) * res).astype(int)
    ok = (u >= 0) & (u < res) & (v >= 0) & (v < res)
    for c in range(3):
        np.add.at(acc[..., c], (v[ok], u[ok]), C[ok, c])
    acc = cv2.GaussianBlur(acc, (0, 0), sigma) * k * 40
    return acc


_LM_CACHE = {}


def lightmap_citta(ciclo, bounds=(-200, -200, 200, 200), res=768, fazioni=False, spenti=False):
    """Bagliore della città sul terreno (strade e piazze illuminate)."""
    key = (int(ciclo // 25), bounds, res, fazioni, spenti)
    if key in _LM_CACHE:
        return _LM_CACHE[key]
    x0, z0, x1, z1 = bounds
    acc = np.zeros((res, res, 3), np.float32)

    def splat(x, z, rgb, w):
        u = int((x - x0) / (x1 - x0) * res)
        v = int((z - z0) / (z1 - z0) * res)
        if 0 <= u < res and 0 <= v < res:
            acc[v, u] += np.asarray(rgb) * w

    for b, f, st in edifici_attivi(ciclo):
        if st != "ok" or f < 0.5:
            continue
        edge, win = colori_distretto(b, ciclo, fazioni)
        wgt = 1.0 if b["district"] != "basso" else 0.25
        splat(b["x"], b["z"], win, wgt * (2.0 if b["district"] == "alto" else 1.0))
    acc = cv2.GaussianBlur(acc, (0, 0), res / 160) * 1.0 + cv2.GaussianBlur(acc, (0, 0), res / 40) * 2.0
    # viali radiali luminosi
    if ciclo >= 3000:
        img = np.zeros((res, res), np.float32)
        cxp = int((0 - x0) / (x1 - x0) * res)
        czp = int((0 - z0) / (z1 - z0) * res)
        rr = int(min(1.0, (ciclo - 3000) / 4000 + 0.4) * 165 / (x1 - x0) * res)
        for k in range(8):
            a = k * math.pi / 4 + 0.39
            cv2.line(img, (cxp, czp), (int(cxp + math.cos(a) * rr), int(czp + math.sin(a) * rr)), 1.0, 1, cv2.LINE_AA)
        for rad in (0.35, 0.6, 0.85):
            cv2.circle(img, (cxp, czp), int(rr * rad), 0.7, 1, cv2.LINE_AA)
        img = cv2.GaussianBlur(img, (0, 0), 0.8)
        acc += img[..., None] * srgb("#ffcf8a") * 0.35
    if spenti:
        acc *= 0.25
    _LM_CACHE[key] = acc
    if len(_LM_CACHE) > 40:
        _LM_CACHE.pop(next(iter(_LM_CACHE)))
    return acc
