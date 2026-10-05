# -*- coding: utf-8 -*-
"""
Picture driver: for every frame finds the shot, asks the three.js director to render it
(headless Chromium, SwiftShader), captures the 2.39:1 picture band, grades it like film,
letterboxes it into 1920x1080 and pipes it to ffmpeg. No on-screen text here: titles, the
YEAR/POPULATION HUD and the end screen are composited afterwards by finish.py.
Key moments (graphics_plan.KEY) are "hero" shots: native resolution, depth of field, FXAA, bloom.

  python3 render.py --preview 12.5 40.2 ...          # single frames -> jpg
  python3 render.py --range 0 240 --out x.mp4         # a frame range
  python3 render.py --all --workers 3                 # the whole film (resumable chunks + concat)
"""
import os, sys, json, math, time, argparse, subprocess, bisect, base64
import numpy as np
import cv2
import skia

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import overlays as OV
import graphics_plan as GP

W, H = 1920, 1080
BW, BH = 1920, 804              # picture band (2.39:1)
BY = (H - BH) // 2              # 138
CHROME = "/opt/pw-browsers/chromium-1194/chrome-linux/chrome"
URL = os.environ.get("RENDER_URL", "http://127.0.0.1:8124/index.html")
SCALE = float(os.environ.get("RENDER_SCALE", "0.8333"))
SCRATCH = os.environ.get("SCRATCH", "/tmp/claude-0/-home-user-Marry/e61fd834-a8c5-5cc5-8204-6c637a41951f/scratchpad")
CHUNKS = os.path.join(SCRATCH, "chunks")


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


# ------------------------------------------------------------------ film grade (per shot mood)
def _curves(contrast=1.06, lift=0.0, gamma=1.0, sh=(0, 0, 0), hi=(0, 0, 0), mid=(0, 0, 0)):
    x = np.linspace(0, 1, 256)
    out = np.zeros((256, 1, 3), np.uint8)
    for ch in range(3):
        y = x ** gamma
        p = 1 + (contrast - 1) * 1.6                       # filmic S-curve around mid grey
        y = np.where(y < 0.5, 0.5 * (2 * y) ** p, 1 - 0.5 * (2 - 2 * y) ** p)
        y = lift + y * (1 - lift)
        y = y + sh[ch] * (1 - x) ** 2 + hi[ch] * x ** 2 + mid[ch] * 4 * x * (1 - x)
        out[:, 0, ch] = np.clip(np.nan_to_num(y) * 255 + 0.5, 0, 255).astype(np.uint8)
    return out


GRADES = {   # (RGB curves LUT, saturation)
    "day":    (_curves(1.07, 0.0, 1.0, sh=(-0.012, 0.004, 0.022), hi=(0.018, 0.006, -0.018)), 1.06),
    "golden": (_curves(1.09, 0.0, 1.0, sh=(0.0, -0.004, 0.02), hi=(0.03, 0.012, -0.03), mid=(0.012, 0.0, -0.012)), 1.1),
    "dawn":   (_curves(1.05, 0.01, 1.0, sh=(0.0, 0.0, 0.025), hi=(0.025, 0.004, 0.0)), 1.0),
    "night":  (_curves(1.05, 0.018, 0.96, sh=(-0.01, 0.004, 0.035), mid=(-0.012, 0.0, 0.03), hi=(0.012, 0.004, -0.01)), 0.86),
    "storm":  (_curves(1.06, 0.012, 1.0, sh=(-0.008, 0.0, 0.02), mid=(-0.006, 0.0, 0.012)), 0.72),
    "room":   (_curves(1.08, 0.01, 1.0, sh=(-0.01, 0.012, 0.03), hi=(0.03, 0.012, -0.02)), 0.82),
    "sad":    (_curves(1.04, 0.012, 1.0, sh=(-0.006, 0.0, 0.018), hi=(0.0, 0.0, -0.004)), 0.78),
}


# ------------------------------------------------------------------ 2D shots (inside the picture band)
def render_2d(kind, lt, dur, bg):
    img = np.zeros((BH, BW, 4), np.uint8)
    if bg is not None:
        b = cv2.GaussianBlur(bg, (0, 0), 6) * 0.35
        img[..., :3] = b.astype(np.uint8)
    img[..., 3] = 255
    surf = skia.Surface(img)
    c = surf.getCanvas()

    def T(s, x, y, size, hexs, a=1.0, key='mono_b', align='left'):
        OV.txt(c, s, x, y, key, size, hexs, a, align, 0.02, shadow=0)
    X0, Y0, X1, Y1 = 170, 40, BW - 170, BH - 40
    c.drawRoundRect(skia.Rect(X0, Y0, X1, Y1), 26, 26, OV.P('#05070b', 0.92))
    c.drawRoundRect(skia.Rect(X0, Y0, X1, Y1), 26, 26, OV.P('#2b3445', 1.0, stroke=4))
    if kind == "autosave":
        T("PRIMA.SIM  —  SERVER 01", X0 + 60, Y0 + 80, 34, '#7dd3fc')
        T("YEAR 1000  ·  DAY 1  ·  00:00:00", X0 + 60, Y0 + 128, 30, '#94a3b8', key='mono')
        p = OV.sm(0.8, dur * 0.7, lt)
        T("AUTOSAVE IN PROGRESS", BW / 2, 360, 64, '#ffffff', 1, align='center')
        c.drawRoundRect(skia.Rect(BW / 2 - 520, 410, BW / 2 + 520, 466), 12, 12, OV.P('#1e293b', 1))
        c.drawRoundRect(skia.Rect(BW / 2 - 520, 410, BW / 2 - 520 + 1040 * p, 466), 12, 12, OV.P('#38bdf8', 1))
        T(f"{int(p * 100)}%   ·   2,431,907 entities   ·   world state frozen", BW / 2, 524, 30, '#cbd5e1', key='mono', align='center')
        if p > 0.98:
            T("SAVED.  NEXT AUTOSAVE: YEAR 2000", BW / 2, 620, 36, '#4ade80', align='center')
    elif kind == "reset":
        T("PRIMA.SIM  —  ADMIN CONSOLE", X0 + 60, Y0 + 80, 34, '#fca5a5')
        lines = ["> status", "  year 1929  ·  population 5,212  ·  conflict: HIGH", "> reset --all"]
        for i, l in enumerate(lines):
            T(l, X0 + 60, Y0 + 170 + i * 56, 34, '#e2e8f0' if l.startswith('>') else '#94a3b8', key='mono_b' if l.startswith('>') else 'mono')
        T("RESET SIMULATION?  ALL DATA WILL BE LOST.", X0 + 60, Y0 + 400, 44, '#ffffff')
        T("[Y/N]", X0 + 60, Y0 + 480, 60, '#f87171')
        if (lt * 1.6) % 1 < 0.6:
            c.drawRect(skia.Rect(X0 + 260, Y0 + 436, X0 + 288, Y0 + 492), OV.P('#ffffff', 1))
        hb = 0.5 + 0.5 * math.sin(lt * 7.5)
        c.drawRoundRect(skia.Rect(X0, Y0, X1, Y1), 26, 26, OV.P('#ef4444', 0.25 + 0.35 * hb, stroke=6))
    return img[..., :3].copy()


# ------------------------------------------------------------------ key moments (hero shots)
def key_windows(tl, seg_by):
    out = []
    for a, b in getattr(GP, 'HERO', GP.KEY):
        t0 = seg_by[a]["start"] - 0.05
        t1 = seg_by[b]["start"] - 0.05 if b else tl["outro"]["start"]
        out.append((t0, t1))
    return out


def is_hero(shot, keys):
    """a shot is a hero shot when most of it lies inside a key window"""
    inside = sum(max(0.0, min(shot["end"], b) - max(shot["start"], a)) for a, b in keys)
    return inside >= 0.5 * max(1e-3, shot["end"] - shot["start"])


# ------------------------------------------------------------------ worker
class Worker:
    def __init__(self, scale=SCALE):
        from playwright.sync_api import sync_playwright
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
        self.size = (int(round(BW * scale)), int(round(BH * scale)))

    def frame3d(self, shot, lt, markers, hero=False):
        key = (shot["id"], hero)
        if self.cur != key:
            r = self.page.evaluate(f"loadShot({json.dumps(shot['id'])}, {shot['dur']:.4f}, {json.dumps(markers)}, {{hero: {'true' if hero else 'false'}}})")
            self.size = tuple(r["size"])
            self.cur = key
        self.page.evaluate(f"renderShot({lt:.4f})")
        cw, ch = self.size
        r = self.cdp.send('Page.captureScreenshot', {'format': 'jpeg', 'quality': 95 if hero else 94, 'clip': {'x': 0, 'y': 0, 'width': cw, 'height': ch, 'scale': 1}})
        buf = np.frombuffer(base64.b64decode(r['data']), np.uint8)
        img = cv2.imdecode(buf, cv2.IMREAD_COLOR)
        if img.shape[1] != BW or img.shape[0] != BH:
            img = cv2.resize(img, (BW, BH), interpolation=cv2.INTER_LANCZOS4)
        return cv2.cvtColor(img, cv2.COLOR_BGR2RGB)

    def close(self):
        try:
            self.browser.close(); self.pw.stop()
        except Exception:
            pass


_rng = np.random.default_rng(7)
GRAIN = [(_rng.standard_normal((BH // 2, BW // 2)) * 2.0).astype(np.float32) for _ in range(6)]
yy, xx = np.mgrid[0:BH, 0:BW].astype(np.float32)
_r2 = np.clip((((xx - BW / 2) / (BW / 2)) ** 2 * 0.75 + ((yy - BH / 2) / (BH / 2)) ** 2 * 0.55), 0, 1.5)
VIGN = (1.0 - 0.24 * _r2 ** 1.3).astype(np.float32)
VIGN_HERO = (1.0 - 0.32 * _r2 ** 1.25).astype(np.float32)
del yy, xx, _r2
LUMA = np.array([[0.299, 0.587, 0.114]], np.float32)
# bloom per grade: (threshold, strength); hero shots glow more and get an anamorphic streak on the brightest lights
BLOOM = {"day": (215, 0.10), "golden": (190, 0.18), "dawn": (200, 0.14), "night": (150, 0.34), "storm": (200, 0.12), "room": (170, 0.22), "sad": (210, 0.08)}


def bloom(f, grade, hero):
    th, k = BLOOM.get(grade, BLOOM["day"])
    if hero:
        k *= 1.5
    sw, sh = BW // 4, BH // 4
    small = cv2.resize(f, (sw, sh), interpolation=cv2.INTER_AREA)
    hi = np.maximum(small - th, 0) * (255.0 / (255.0 - th))
    b = cv2.GaussianBlur(hi, (0, 0), 3.0) * 0.5 + cv2.GaussianBlur(hi, (0, 0), 10.0) * 0.5
    out = b * k
    if hero and grade in ("night", "room", "golden"):
        hot = np.maximum(small - 228, 0) * (255.0 / 27.0)
        streak = cv2.GaussianBlur(hot, (0, 0), sigmaX=46, sigmaY=0.8)
        out += streak * np.array([0.55, 0.75, 1.0], np.float32) * 0.5
    return f + cv2.resize(out, (BW, BH), interpolation=cv2.INTER_LINEAR)


def post(img, fi, grade="day", sharpen=True, hero=False):
    f = img.astype(np.float32)
    if sharpen and not hero and SCALE < 0.999:
        bl = cv2.GaussianBlur(f, (0, 0), 1.1)
        f = f + (f - bl) * 0.5
    f = bloom(f, grade, hero)
    lut, sat = GRADES.get(grade, GRADES["day"])
    if hero:
        sat *= 1.04
    if abs(sat - 1.0) > 1e-3:
        g = cv2.transform(f, LUMA)[..., None]
        f = g + (f - g) * sat
    f *= (VIGN_HERO if hero else VIGN)[..., None]
    gr = cv2.resize(GRAIN[fi % len(GRAIN)], (BW, BH), interpolation=cv2.INTER_LINEAR)
    f += gr[..., None]
    out = np.clip(f, 0, 255).astype(np.uint8)
    return cv2.LUT(out, lut)


def letterbox(band_rgb):
    out = np.zeros((H, W, 3), np.uint8)
    out[BY:BY + BH] = band_rgb
    return out


class Renderer:
    def __init__(self):
        self.tl, self.seg_by, self.chap_by = load()
        self.wk = Worker()
        self.shots = build_shots(self.wk.shot_list, self.tl, self.seg_by, self.chap_by)
        self.starts = [s["start"] for s in self.shots]
        self.keys = key_windows(self.tl, self.seg_by)
        for s in self.shots:
            s["hero"] = s.get("kind") != "2d" and not s.get("noHero") and (s.get("forceHero") or is_hero(s, self.keys))
        self.bg_cache = {}
        self.gfx = None

    def band(self, t, k, hero=None):
        i = max(0, bisect.bisect_right(self.starts, t) - 1)
        shot = self.shots[i]
        lt = t - shot["start"]
        if shot.get("kind") == "2d":
            bgid = shot.get("bg")
            if bgid and bgid not in self.bg_cache:
                self.bg_cache[bgid] = self.wk.frame3d({"id": bgid, "dur": 4.0, "start": 0, "end": 4}, 1.0, {})
                self.wk.cur = None
            img = render_2d(shot["name"], lt, shot["dur"], self.bg_cache.get(bgid))
            img = post(img, k, "room", sharpen=False)
        else:
            h = shot["hero"] if hero is None else hero
            img = self.wk.frame3d(shot, lt, markers_for(shot, self.tl), h)
            img = post(img, k, shot.get("grade") or "day", hero=h)
        if self.wk.errors:
            print("PAGE ERRORS:", self.wk.errors[-3:], flush=True); self.wk.errors.clear()
        return img, shot

    def frame(self, t, k, overlays=False, hero=None):
        img, shot = self.band(t, k, hero)
        out = letterbox(img)
        if overlays:          # previews only: the film gets its graphics in finish.py
            import finish
            if self.gfx is None:
                self.gfx = finish.Graphics(self.tl, self.seg_by, self.chap_by)
            out = finish.draw_over(out, self.gfx, t)
        return out, shot

    def range_to(self, f0, f1, out, fps=24, crf=13):
        tmp = out + ".part.mp4"
        proc = subprocess.Popen(['ffmpeg', '-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{W}x{H}', '-r', str(fps), '-i', '-',
                                 '-c:v', 'libx264', '-preset', 'ultrafast', '-crf', str(crf), '-pix_fmt', 'yuv420p', tmp], stdin=subprocess.PIPE)
        t0 = time.time()
        for k, f in enumerate(range(f0, f1)):
            img, shot = self.frame(f / fps, f)
            proc.stdin.write(img.tobytes())
            if k % 48 == 0:
                print(f"[{os.getpid()}] {f0}-{f1}: {k}/{f1 - f0} shot={shot['id']}{'*' if shot.get('hero') else ''} {(time.time() - t0) / (k + 1):.2f}s/frame", flush=True)
        proc.stdin.close(); proc.wait()
        os.replace(tmp, out)

    def close(self):
        self.wk.close()


def chunk_list(total_frames, size):
    return [(f, min(total_frames, f + size)) for f in range(0, total_frames, size)]


def chunk_path(f0, f1):
    return os.path.join(CHUNKS, f"c_{f0:06d}_{f1:06d}.mp4")


def worker_proc(q, wid):
    r = Renderer()
    while True:
        try:
            job = q.get_nowait()
        except Exception:
            break
        f0, f1 = job
        p = chunk_path(f0, f1)
        if os.path.exists(p):
            continue
        r.range_to(f0, f1, p)
    r.close()


def render_all(workers=3, size=240, fps=24, frames=None):
    import multiprocessing as mp
    os.makedirs(CHUNKS, exist_ok=True)
    tl, _, _ = load()
    total = int(math.ceil(tl["total"] * fps))
    jobs = [j for j in chunk_list(total, size) if not os.path.exists(chunk_path(*j))]
    if frames:
        jobs = [j for j in jobs if j[1] > frames[0] and j[0] < frames[1]]
    print(f"{len(jobs)} chunks to render ({total} frames total)", flush=True)
    q = mp.Queue()
    for j in jobs:
        q.put(j)
    ps = [mp.Process(target=worker_proc, args=(q, w)) for w in range(workers)]
    for p in ps:
        p.start(); time.sleep(8)
    for p in ps:
        p.join()
    missing = [j for j in chunk_list(total, size) if not os.path.exists(chunk_path(*j))]
    print("missing chunks:", len(missing), flush=True)
    if not missing:
        lst = os.path.join(CHUNKS, "list.txt")
        with open(lst, "w") as f:
            for j in chunk_list(total, size):
                f.write(f"file '{chunk_path(*j)}'\n")
        subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', lst, '-c', 'copy', os.path.join(SCRATCH, 'film_video.mp4')], check=True)
        print("concatenated ->", os.path.join(SCRATCH, 'film_video.mp4'), flush=True)


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--preview", nargs="*", type=float)
    ap.add_argument("--range", nargs=2, type=int)
    ap.add_argument("--out")
    ap.add_argument("--all", action="store_true")
    ap.add_argument("--workers", type=int, default=3)
    ap.add_argument("--chunk", type=int, default=240)
    ap.add_argument("--frames", nargs=2, type=int)
    ap.add_argument("--sample", nargs="*", help="preview the middle frame of every shot whose id starts with one of these prefixes")
    ap.add_argument("--at", type=float, default=0.45)
    ap.add_argument("--overlays", action="store_true", help="previews: draw the finish.py graphics on top")
    ap.add_argument("--hero", choices=["auto", "on", "off"], default="auto", help="previews: force hero quality on/off")
    ap.add_argument("--tag", default="")
    ap.add_argument("--heroonly", action="store_true")
    a = ap.parse_args()
    hero = None if a.hero == "auto" else (a.hero == "on")
    if a.sample is not None:
        r = Renderer()
        os.makedirs(os.path.join(SCRATCH, "frames"), exist_ok=True)
        t0 = time.time()
        for k, s in enumerate(r.shots):
            if a.sample and not any(s["id"] == p[:-1] if p.endswith("$") else s["id"].startswith(p) for p in a.sample):
                continue
            if a.heroonly and not s.get("hero"):
                continue
            t = s["start"] + s["dur"] * a.at
            t1 = time.time()
            img, shot = r.frame(t, k, a.overlays, hero)
            cv2.imwrite(os.path.join(SCRATCH, "frames", f"s_{t:08.3f}_{s['id']}{a.tag}.jpg"), cv2.cvtColor(img, cv2.COLOR_RGB2BGR), [cv2.IMWRITE_JPEG_QUALITY, 88])
            print(f"{t:8.2f} {shot['id']:10s}{'*' if (shot.get('hero') if hero is None else hero) else ' '} {time.time() - t1:5.1f}s  total {time.time() - t0:6.1f}s", flush=True)
        r.close()
        sys.exit(0)
    if a.preview:
        r = Renderer()
        os.makedirs(os.path.join(SCRATCH, "frames"), exist_ok=True)
        t0 = time.time()
        for k, t in enumerate(a.preview):
            img, shot = r.frame(t, k, a.overlays, hero)
            cv2.imwrite(os.path.join(SCRATCH, "frames", f"prev_{t:08.3f}{a.tag}.jpg"), cv2.cvtColor(img, cv2.COLOR_RGB2BGR), [cv2.IMWRITE_JPEG_QUALITY, 92])
            print(f"{t:8.2f} {shot['id']:10s} {time.time() - t0:6.1f}s", flush=True)
        r.close()
    elif a.range:
        r = Renderer()
        r.range_to(a.range[0], a.range[1], a.out)
        r.close()
    elif a.all:
        render_all(a.workers, a.chunk, frames=a.frames)
