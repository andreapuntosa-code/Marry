# -*- coding: utf-8 -*-
"""
Frame driver: for every frame finds the shot, asks the three.js director to render it
(headless Chromium, SwiftShader), captures it, composites the on-screen graphics,
and pipes it to ffmpeg. Runs as N parallel workers over contiguous frame ranges.

  python3 render.py --preview 12.5 40.2 ...        # single frames -> jpg
  python3 render.py --range 0 240 --out x.mp4       # a frame range
  python3 render.py --all --workers 4               # the whole film (chunks + concat)
"""
import os, sys, json, math, time, argparse, subprocess, bisect
import numpy as np
import cv2
import skia
from playwright.sync_api import sync_playwright

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import overlays as OV
import graphics_plan as GP

W, H = 1920, 1080
CHROME = "/opt/pw-browsers/chromium-1194/chrome-linux/chrome"
URL = os.environ.get("RENDER_URL", "http://127.0.0.1:8124/index.html")
SCALE = float(os.environ.get("RENDER_SCALE", "0.8333"))
SCRATCH = os.environ.get("SCRATCH", "/tmp/claude-0/-home-user-Marry/e61fd834-a8c5-5cc5-8204-6c637a41951f/scratchpad")


# ------------------------------------------------------------------ timeline & shots
def load():
    tl = json.load(open(os.path.join(HERE, "timeline.json")))
    seg_by = {s["id"]: s for s in tl["segments"]}
    chap_by = {c["id"]: c for c in tl["chapters"]}
    return tl, seg_by, chap_by


def resolve(anchor, tl, seg_by, chap_by):
    if anchor == "start":
        return 0.0
    if anchor == "title":
        return tl["events"][0]["start"]
    if anchor == "outro":
        return tl["outro"]["start"]
    if anchor.startswith("chap:"):
        return chap_by[anchor[5:]]["start"]
    if anchor.startswith("t:"):
        return float(anchor[2:])
    return seg_by[anchor]["start"]


def build_shots(shot_list, tl, seg_by, chap_by):
    shots = []
    for s in shot_list:
        st = resolve(s["at"], tl, seg_by, chap_by) + s.get("off", 0.0)
        shots.append({**s, "start": st})
    shots.sort(key=lambda s: s["start"])
    for i, s in enumerate(shots):
        s["end"] = shots[i + 1]["start"] if i + 1 < len(shots) else tl["total"]
        s["dur"] = s["end"] - s["start"]
    return shots


def markers_for(shot, tl):
    m = {}
    for s in tl["segments"]:
        if s["start"] > shot["start"] - 30 and s["start"] < shot["end"] + 30:
            m[s["id"]] = round(s["start"] - shot["start"], 3)
    for c in tl["chapters"]:
        m["chap:" + c["id"]] = round(c["start"] - shot["start"], 3)
    return m


# ------------------------------------------------------------------ graphics schedule
class Graphics:
    def __init__(self, tl, seg_by, chap_by):
        self.tl, self.seg_by, self.chap_by = tl, seg_by, chap_by
        self.events = []
        for kind, anchor, dur, p in GP.EVENTS:
            s = seg_by[anchor]
            t0 = s["start"] + p.get("delay", 0.0)
            t1 = t0 + (dur if dur is not None else s["dur"] + s["pause"])
            if dur is not None and "delay" in p:
                t1 = s["start"] + dur
            self.events.append((kind, t0, t1, p))
        # years
        self.year_marks = sorted([(s["start"], s["year"]) for s in tl["segments"] if s.get("year") is not None])
        self.ramps = [(seg_by[a]["start"], seg_by[b]["start"], y0, y1) for a, b, y0, y1 in GP.YEAR_RAMPS]
        self.days = [(seg_by[a]["start"], seg_by[b]["start"], lab) for a, b, lab in GP.DAY_LABELS]
        self.hidden = [(seg_by[a]["start"], seg_by[b]["start"] if b else 1e9) for a, b in GP.YEAR_HIDDEN]
        self.year_on = seg_by["r09"]["start"]

    def year_at(self, t):
        for a, b, y0, y1 in self.ramps:
            if a <= t < b:
                u = (t - a) / (b - a)
                u = u * u * (3 - 2 * u)
                return y0 + (y1 - y0) * u
        y = 0
        for ts, yr in self.year_marks:
            if ts <= t:
                y = yr
        for a, b, y0, y1 in self.ramps:
            if t >= b and b > 0:
                best = [m for m in self.year_marks if m[0] <= t]
                last_mark_t = best[-1][0] if best else -1
                if b > last_mark_t:
                    y = y1
        return y

    def draw(self, canvas, t):
        c = canvas
        # chapter cards
        for ch in self.tl["chapters"]:
            if ch["start"] <= t < ch["end"]:
                OV.chapter_card(c, (t - ch["start"]) / (ch["end"] - ch["start"]), ch["label"], ch["title"], ch["sub"])
        ev = self.tl["events"][0]
        if ev["start"] <= t < ev["end"]:
            OV.title_card(c, (t - ev["start"]) / (ev["end"] - ev["start"]))
        for kind, t0, t1, p in self.events:
            if not (t0 <= t < t1):
                continue
            u = (t - t0) / max(1e-3, t1 - t0)
            if kind == "rule":
                OV.rule_card(c, u, p["n"], p["l1"], p.get("l2"))
            elif kind == "caption":
                OV.caption(c, u, p["s"], p.get("color", "#ffffff"), p.get("y"), p.get("size", 78), p.get("key", "anton"), p.get("box"))
            elif kind == "name":
                OV.name_card(c, u, p["name"], p["role"], GP.C.get(p["c"], "#ffffff"))
            elif kind == "glyph":
                OV.glyph_card(c, u, p["key"], p["word"], p["meaning"], p.get("color", "#ffd27a"))
            elif kind == "glyph3":
                for i, (k, w_, m_, colr) in enumerate([("KRA", "Kra", "danger", "#ff5a5a"), ("NUA", "Nua", "night", "#8ea8ff"), ("TOH", "Toh", "come here", "#7ee08a")]):
                    ui = (u * 3.0 - i * 0.55)
                    if 0 <= ui <= 1.6:
                        OV.glyph_card(c, min(1.0, ui / 1.6), k, w_, m_, colr, x=W * (0.22 + 0.28 * i) + 60)
            elif kind == "energy":
                lv = p["from"] + (p["to"] - p["from"]) * OV.sm(0.15, 0.85, u)
                OV.energy_bar(c, u, p["x"], p["y"], lv, p.get("label", "ENERGY"))
            elif kind == "place":
                OV.place_card(c, u, p["name"], p["sub"])
            elif kind == "search":
                OV.hud_search(c, u, t)
            elif kind == "kings":
                OV.kings_ticker(c, u)
            elif kind == "comment":
                OV.comment_prompt(c, u, t)
            elif kind == "flash":
                k = math.exp(-((t - (t0 + p["at"])) / 0.12) ** 2) if t >= t0 + p["at"] - 0.05 else 0.0
                OV.flash(c, k)
            elif kind == "letterbox":
                OV.letterbox(c, OV.sm(t0, t0 + 0.8, t) * (1 - OV.sm(t1 - 0.8, t1, t)))
        # year counter (top-right)
        if t >= self.year_on and not any(a <= t < b for a, b in self.hidden) and t < self.tl["outro"]["start"]:
            a = OV.sm(self.year_on, self.year_on + 0.5, t)
            for ch in self.tl["chapters"]:
                if ch["start"] <= t < ch["end"]:
                    a *= 0.0
            sub = None
            for d0, d1, lab in self.days:
                if d0 <= t < d1:
                    sub = lab
            OV.year_counter(c, self.year_at(t), a, "YEAR", sub)
        o = self.tl["outro"]
        if t >= o["start"]:
            OV.end_screen(c, (t - o["start"]) / (o["end"] - o["start"]))


# ------------------------------------------------------------------ 2D shots
def render_2d(kind, lt, dur, bg):
    img = np.zeros((H, W, 4), np.uint8)
    if bg is not None:
        b = cv2.GaussianBlur(bg, (0, 0), 6) * 0.35
        img[..., :3] = b.astype(np.uint8)
    img[..., 3] = 255
    surf = skia.Surface(img)
    c = surf.getCanvas()
    def T(s, x, y, size, hexs, a=1.0, key='mono_b', align='left'):
        OV.txt(c, s, x, y, key, size, hexs, a, align, 0.02, shadow=0)
    # monitor frame
    c.drawRoundRect(skia.Rect(150, 110, W - 150, H - 110), 26, 26, OV.P('#05070b', 0.92))
    c.drawRoundRect(skia.Rect(150, 110, W - 150, H - 110), 26, 26, OV.P('#2b3445', 1.0, stroke=4))
    if kind == "autosave":
        T("PRIMA.SIM  —  SERVER 01", 220, 200, 34, '#7dd3fc')
        T("YEAR 1000  ·  DAY 1  ·  00:00:00", 220, 250, 30, '#94a3b8', key='mono')
        p = OV.sm(0.8, dur * 0.7, lt)
        T("AUTOSAVE IN PROGRESS", W / 2, 520, 64, '#ffffff', 1, align='center')
        c.drawRoundRect(skia.Rect(W / 2 - 520, 580, W / 2 + 520, 640), 12, 12, OV.P('#1e293b', 1))
        c.drawRoundRect(skia.Rect(W / 2 - 520, 580, W / 2 - 520 + 1040 * p, 640), 12, 12, OV.P('#38bdf8', 1))
        T(f"{int(p * 100)}%   ·   2,431,907 entities   ·   world state frozen", W / 2, 700, 30, '#cbd5e1', key='mono', align='center')
        if p > 0.98:
            T("SAVED.  NEXT AUTOSAVE: YEAR 2000", W / 2, 800, 36, '#4ade80', align='center')
    elif kind == "reset":
        T("PRIMA.SIM  —  ADMIN CONSOLE", 220, 200, 34, '#fca5a5')
        lines = ["> status", "  year 1929  ·  population 5,212  ·  conflict: HIGH", "> reset --all"]
        for i, l in enumerate(lines):
            T(l, 220, 300 + i * 56, 34, '#e2e8f0' if l.startswith('>') else '#94a3b8', key='mono_b' if l.startswith('>') else 'mono')
        T("RESET SIMULATION?  ALL DATA WILL BE LOST.", 220, 520, 44, '#ffffff')
        T("[Y/N]", 220, 600, 60, '#f87171')
        if (lt * 1.6) % 1 < 0.6:
            c.drawRect(skia.Rect(420, 556, 448, 612), OV.P('#ffffff', 1))
        hb = 0.5 + 0.5 * math.sin(lt * 7.5)
        c.drawRoundRect(skia.Rect(150, 110, W - 150, H - 110), 26, 26, OV.P('#ef4444', 0.25 + 0.35 * hb, stroke=6))
    return img[..., :3].copy()


# ------------------------------------------------------------------ worker
class Worker:
    def __init__(self, scale=SCALE):
        self.scale = scale
        self.pw = sync_playwright().start()
        self.browser = self.pw.chromium.launch(executable_path=CHROME, headless=True,
            args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--use-gl=angle', '--disable-gpu-vsync'])
        self.page = self.browser.new_page(viewport={'width': W, 'height': H})
        self.errors = []
        self.page.on('pageerror', lambda e: self.errors.append(str(e)))
        self.page.goto(f"{URL}?scale={scale}")
        self.page.wait_for_function('window.ready === true || window.loadError', timeout=300000)
        err = self.page.evaluate('window.loadError || null')
        if err:
            raise RuntimeError(err)
        self.cdp = self.page.context.new_cdp_session(self.page)
        self.cur = None
        self.shot_list = self.page.evaluate('window.SHOT_LIST')

    def frame3d(self, shot, lt, markers):
        if self.cur != shot["id"]:
            self.page.evaluate(f"loadShot({json.dumps(shot['id'])}, {shot['dur']:.4f}, {json.dumps(markers)})")
            self.cur = shot["id"]
        self.page.evaluate(f"renderShot({lt:.4f})")
        r = self.cdp.send('Page.captureScreenshot', {'format': 'jpeg', 'quality': 93})
        import base64
        buf = np.frombuffer(base64.b64decode(r['data']), np.uint8)
        img = cv2.imdecode(buf, cv2.IMREAD_COLOR)
        if self.scale < 0.999:
            img = img[:int(round(H * self.scale)), :int(round(W * self.scale))] if img.shape[1] == W and False else img
        if img.shape[1] != W or img.shape[0] != H:
            img = cv2.resize(img, (W, H), interpolation=cv2.INTER_LANCZOS4)
        return cv2.cvtColor(img, cv2.COLOR_BGR2RGB)

    def close(self):
        try:
            self.browser.close(); self.pw.stop()
        except Exception:
            pass


_rng = np.random.default_rng(7)
GRAIN = [(_rng.standard_normal((H // 2, W // 2)) * 2.2).astype(np.float32) for _ in range(4)]
yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
VIGN = (1.0 - 0.22 * np.clip((((xx - W / 2) / (W / 2)) ** 2 * 0.8 + ((yy - H / 2) / (H / 2)) ** 2 * 0.6), 0, 1.5) ** 1.3).astype(np.float32)
del yy, xx


def post(img, fi, sharpen=True):
    f = img.astype(np.float32)
    if sharpen and SCALE < 0.999:
        bl = cv2.GaussianBlur(f, (0, 0), 1.1)
        f = f + (f - bl) * 0.55
    f *= VIGN[..., None]
    g = cv2.resize(GRAIN[fi % 4], (W, H), interpolation=cv2.INTER_LINEAR)
    f += g[..., None]
    return np.clip(f, 0, 255).astype(np.uint8)


def compose(frame_rgb, graphics, t):
    rgba = np.empty((H, W, 4), np.uint8)
    rgba[..., :3] = frame_rgb; rgba[..., 3] = 255
    surf = skia.Surface(rgba)
    graphics.draw(surf.getCanvas(), t)
    return rgba[..., :3].copy()


def render_range(f0, f1, out, fps=24, previews=None):
    tl, seg_by, chap_by = load()
    wk = Worker()
    shots = build_shots(wk.shot_list, tl, seg_by, chap_by)
    starts = [s["start"] for s in shots]
    gfx = Graphics(tl, seg_by, chap_by)
    proc = None
    if out:
        proc = subprocess.Popen(['ffmpeg', '-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{W}x{H}', '-r', str(fps), '-i', '-',
                                 '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '14', '-pix_fmt', 'yuv420p', out], stdin=subprocess.PIPE)
    bg_cache = {}
    t_start = time.time()
    frames = previews if previews is not None else [f / fps for f in range(f0, f1)]
    for k, t in enumerate(frames):
        i = max(0, bisect.bisect_right(starts, t) - 1)
        shot = shots[i]
        lt = t - shot["start"]
        if shot.get("kind") == "2d":
            bgid = shot.get("bg")
            if bgid and bgid not in bg_cache:
                bshot = {"id": bgid, "dur": 4.0, "start": 0, "end": 4}
                bg_cache[bgid] = wk.frame3d(bshot, 1.0, {})
            img = render_2d(shot["name"], lt, shot["dur"], bg_cache.get(bgid))
        else:
            img = wk.frame3d(shot, lt, markers_for(shot, tl))
        img = post(img, k)
        img = compose(img, gfx, t)
        if proc:
            proc.stdin.write(img.tobytes())
        else:
            cv2.imwrite(os.path.join(SCRATCH, "frames", f"prev_{t:08.3f}.jpg"), cv2.cvtColor(img, cv2.COLOR_RGB2BGR), [cv2.IMWRITE_JPEG_QUALITY, 92])
        if k % 24 == 0:
            el = time.time() - t_start
            print(f"[{os.getpid()}] {k}/{len(frames)} t={t:.2f} shot={shot['id']} {el / (k + 1):.2f}s/frame", flush=True)
        if wk.errors:
            print("PAGE ERRORS:", wk.errors[-3:], flush=True); wk.errors.clear()
    if proc:
        proc.stdin.close(); proc.wait()
    wk.close()


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--preview", nargs="*", type=float)
    ap.add_argument("--range", nargs=2, type=int)
    ap.add_argument("--out")
    a = ap.parse_args()
    if a.preview:
        render_range(0, 0, None, previews=a.preview)
    elif a.range:
        render_range(a.range[0], a.range[1], a.out)
