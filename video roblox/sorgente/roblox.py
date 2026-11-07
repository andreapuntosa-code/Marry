# -*- coding: utf-8 -*-
"""
"Roblox" style Shorts -- the driver (reusable for every video in this style).

  picture: three.js scene (web/kit.js + web/<film>.js) in headless Chromium, frame by frame
  on top:  the number badges above the heads (purple-blue rounded box, white bold number) and one giant
           white word at a time (black outline), drawn with skia
  sound:   calm storyteller (Kokoro, sintesi.py) + a soft sustained-bell score in D major (no drums) + pops

  SCRIPT=script_iq python3 sintesi.py                    (voice)
  python3 roblox.py --film film_iq --script script_iq --preview 2 5 9
  python3 roblox.py --film film_iq --script script_iq --render --workers 3 --out ../name.mp4
"""
import os, sys, json, math, re, time, argparse, subprocess, importlib, base64, threading, http.server, socketserver, functools
import numpy as np
import cv2, skia
import soundfile as sf
from scipy import signal

HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HERE)
ROOT = os.path.normpath(os.path.join(HERE, "..", ".."))           # the repository: serves web/ and three.js
S_DIR = os.environ.get("SCRATCH", "/tmp/claude-0/-home-user-Marry/e61fd834-a8c5-5cc5-8204-6c637a41951f/scratchpad")
CHROME = os.environ.get("CHROME", "/opt/pw-browsers/chromium-1243/chrome-linux64/chrome")
W, H, FPS, SR = 1080, 1920, 30, 48000
LEAD = 0.25
PORT = int(os.environ.get("RBX_PORT", "8131"))
FONT = skia.Typeface.MakeFromFile(os.path.join(HERE, "font", "Poppins-Black.ttf"))


def clamp(x, a=0.0, b=1.0): return max(a, min(b, x))
def eob(u):
    u = clamp(u); c1, c3 = 1.70158, 2.70158
    return 1 + c3 * (u - 1) ** 3 + c1 * (u - 1) ** 2


# ------------------------------------------------------------------ narration timeline + word times
def voice_dir(script): return os.path.join(S_DIR, "voice_rbx_" + script)


def load_voice(script, sid):
    y, sr = sf.read(os.path.join(voice_dir(script), sid + ".wav"), dtype="float32")
    return y if y.ndim == 1 else y.mean(1), sr


def word_times(script, seg):
    y, sr = load_voice(script, seg["id"]); dur = len(y) / sr
    toks = re.findall(r"\S+", seg["tts"])
    cl = [c.strip() for c in re.findall(r"[^,.?!]+[,.?!]*", seg["tts"]) if re.search(r"\w", c)]
    win = int(0.02 * sr); env = np.sqrt(np.convolve(y ** 2, np.ones(win) / win, mode="same"))
    q = env < 10 ** (-30 / 20) * env.max(); d = np.diff(np.concatenate([[0], q.astype(np.int8), [0]]))
    st, en = np.where(d == 1)[0], np.where(d == -1)[0]
    gaps = sorted(sorted([(a / sr, b / sr) for a, b in zip(st, en) if (b - a) / sr >= 0.07 and a > 0.1 * sr and b < len(y) - 0.1 * sr], key=lambda g: g[0] - g[1])[:max(0, len(cl) - 1)])
    out = []
    if len(gaps) == len(cl) - 1:
        bounds, t = [], 0.0
        for a, b in gaps: bounds.append((t, a)); t = b
        bounds.append((t, dur))
        tot_c = sum(len(re.sub(r"\W", "", c)) + 1 for c in cl)
        ok = all((b - a) > 0.5 * dur * (len(re.sub(r"\W", "", c)) + 1) / tot_c for c, (a, b) in zip(cl, bounds))
        for txt, (a, b) in (zip(cl, bounds) if ok else []):
            ws = re.findall(r"\S+", txt); wts = [len(re.sub(r"\W", "", w)) + 1.0 for w in ws]; tot = sum(wts); acc = 0
            for w, k in zip(ws, wts): out.append((w, a + (b - a) * acc / tot)); acc += k
    if len(out) != len(toks):
        out = []; wts = [len(re.sub(r"\W", "", w)) + 1.0 for w in toks]; tot = sum(wts); acc = 0
        for w, k in zip(toks, wts): out.append((w, dur * acc / tot)); acc += k
    return out


def timeline(script):
    SC = importlib.import_module(script)
    dur = json.load(open(os.path.join(voice_dir(script), "durations.json")))
    t = LEAD; segs = []
    for s in SC.SEGMENTS:
        d = dur[s["id"]]["dur"]; s2 = dict(s); s2.update(start=t, dur=d, end=t + d); s2["words"] = word_times(script, s2); segs.append(s2); t += d + s["pause"]
    return segs, t


# ------------------------------------------------------------------ overlays
def fmt(v):
    if isinstance(v, str): return v
    return f"{int(round(v)):,}"


# v2 finish: a soft vignette and a little film grain
_yy, _xx = np.mgrid[0:H, 0:W].astype(np.float32)
VIGN = (1.0 - 0.22 * np.clip(((_xx - W / 2) / (W / 2)) ** 2 * 0.7 + ((_yy - H / 2) / (H / 2)) ** 2 * 0.5, 0, 1.4) ** 1.4).astype(np.float32)[..., None]
GRAIN = [(np.random.default_rng(k).standard_normal((H // 2, W // 2)) * 3.2).astype(np.float32) for k in range(6)]
del _yy, _xx


def cinematic(img, k):
    if os.environ.get("RBX_FINISH", "1") == "0": return img
    g = cv2.resize(GRAIN[k % len(GRAIN)], (W, H), interpolation=cv2.INTER_LINEAR)[..., None]
    return np.clip(img.astype(np.float32) * VIGN + g, 0, 255).astype(np.uint8)


class Overlay:
    def __init__(self, segs):
        self.segs = segs; self.seen = {}

    def badge(self, c, b, t):
        txt = fmt(b["v"]); key = b.get("id") or f"{int(b['x'])}"
        special = txt if txt in ("LOCK", "UNLOCK", "SPIN") else None
        if special == "SPIN": txt = str(1 + (int(t * 22) * 37) % 99)
        last = self.seen.get(key)
        if last is None or last[0] != txt:
            # a new value: pop (only when it is a new appearance or a jump, not every roll step)
            pop = last is None or (t - last[1] > 0.5 and abs(len(txt) - len(last[0])) > 0) or not txt[0].isdigit()
            if special == "SPIN" and last is not None and last[0].isdigit(): pop = False
            self.seen[key] = (txt, t if (last is None or pop) else last[1], last[2] if last else t)
        first = self.seen[key][2]
        k = eob((t - first) / 0.35)
        hpx = clamp(b["k"] * H * 0.5 * 0.3, 30, 150) * k             # badge height in pixels (scales with distance)
        if hpx < 6: return
        size = hpx * 0.66; f = skia.Font(FONT, size); tw = f.measureText(txt)
        if tw + hpx * 0.8 > W - 80:                                     # huge numbers: shrink the text to fit
            size *= (W - 80 - hpx * 0.8) / tw; f = skia.Font(FONT, size); tw = f.measureText(txt)
        if special in ("LOCK", "UNLOCK"): tw = hpx * 0.5
        w = max(hpx * 1.7, tw + hpx * 0.8); x, y = clamp(b["x"], w / 2 + 30, W - w / 2 - 30), b["y"] - hpx * 0.6
        age = t - self.seen[key][1]
        if special == "UNLOCK":                                         # shaking, glowing, the shackle lifts
            x += math.sin(t * 61) * hpx * 0.05 * (1 - clamp((age - 2.2) / 0.4)); gl = clamp(age / 1.5)
            gp = skia.Paint(Color=skia.Color(255, 220, 90, int(150 * gl)), AntiAlias=True); gp.setMaskFilter(skia.MaskFilter.MakeBlur(skia.kNormal_BlurStyle, hpx * 0.5))
            c.drawRoundRect(skia.Rect(x - w / 2 - hpx * 0.3, y - hpx * 0.8, x + w / 2 + hpx * 0.3, y + hpx * 0.8), hpx * 0.5, hpx * 0.5, gp)
        r = skia.Rect(x - w / 2, y - hpx / 2, x + w / 2, y + hpx / 2); rad = hpx * 0.32
        sh = skia.Paint(Color=skia.Color(0, 0, 0, 90), AntiAlias=True); sh.setMaskFilter(skia.MaskFilter.MakeBlur(skia.kNormal_BlurStyle, hpx * 0.06))
        c.drawRoundRect(r.makeOffset(0, hpx * 0.07), rad, rad, sh)
        g = skia.Paint(AntiAlias=True); g.setShader(skia.GradientShader.MakeLinear([skia.Point(0, r.top()), skia.Point(0, r.bottom())], [skia.Color(122, 104, 255), skia.Color(60, 42, 214)]))
        c.drawRoundRect(r, rad, rad, g)
        hi = skia.Paint(AntiAlias=True); hi.setShader(skia.GradientShader.MakeLinear([skia.Point(0, r.top()), skia.Point(0, r.centerY())], [skia.Color(255, 255, 255, 70), skia.Color(255, 255, 255, 0)]))
        c.drawRoundRect(skia.Rect(r.left() + 3, r.top() + 3, r.right() - 3, r.centerY()), rad * 0.8, rad * 0.8, hi)
        c.drawRoundRect(r, rad, rad, skia.Paint(Color=skia.Color(30, 22, 120), AntiAlias=True, Style=skia.Paint.kStroke_Style, StrokeWidth=max(2, hpx * 0.06)))
        c.drawRoundRect(r.makeInset(hpx * 0.06, hpx * 0.06), rad * 0.8, rad * 0.8, skia.Paint(Color=skia.Color(170, 200, 255, 160), AntiAlias=True, Style=skia.Paint.kStroke_Style, StrokeWidth=max(1.5, hpx * 0.03)))
        if special in ("LOCK", "UNLOCK"):
            op = clamp((age - 0.4) / 1.6) if special == "UNLOCK" else 0.0
            bw, bh = hpx * 0.56, hpx * 0.42; by = y + hpx * 0.1
            c.drawRoundRect(skia.Rect(x - bw / 2, by - bh / 2, x + bw / 2, by + bh / 2), hpx * 0.06, hpx * 0.06, skia.Paint(Color=skia.Color(255, 214, 64), AntiAlias=True))
            c.drawRoundRect(skia.Rect(x - bw / 2, by - bh / 2, x + bw / 2, by + bh / 2), hpx * 0.06, hpx * 0.06, skia.Paint(Color=skia.Color(25, 18, 90), AntiAlias=True, Style=skia.Paint.kStroke_Style, StrokeWidth=hpx * 0.035))
            c.drawCircle(x, by - bh * 0.05, hpx * 0.045, skia.Paint(Color=skia.Color(25, 18, 90), AntiAlias=True)); c.drawRect(skia.Rect(x - hpx * 0.018, by, x + hpx * 0.018, by + bh * 0.28), skia.Paint(Color=skia.Color(25, 18, 90), AntiAlias=True))
            c.save(); c.translate(x + bw * 0.3, by - bh / 2 - op * hpx * 0.12); c.rotate(-op * 35); c.translate(-(x + bw * 0.3), -(by - bh / 2))
            sp = skia.Path(); r0 = bw * 0.3; sp.moveTo(x - r0, by - bh / 2); sp.lineTo(x - r0, by - bh / 2 - hpx * 0.1); sp.arcTo(skia.Rect(x - r0, by - bh / 2 - hpx * 0.1 - r0, x + r0, by - bh / 2 - hpx * 0.1 + r0), 180, 180, False); sp.lineTo(x + r0, by - bh / 2)
            c.drawPath(sp, skia.Paint(Color=skia.Color(25, 18, 90), AntiAlias=True, Style=skia.Paint.kStroke_Style, StrokeWidth=hpx * 0.11, StrokeCap=skia.Paint.kRound_Cap))
            c.drawPath(sp, skia.Paint(Color=skia.Color(235, 235, 245), AntiAlias=True, Style=skia.Paint.kStroke_Style, StrokeWidth=hpx * 0.06, StrokeCap=skia.Paint.kRound_Cap))
            c.restore(); return
        ty = y + size * 0.36
        if special == "SPIN":                                           # a blur of numbers rolling past
            c.save(); c.clipRRect(skia.RRect.MakeRectXY(r, rad, rad), doAntiAlias=True)
            for dy, a_ in ((-0.5, 60), (0.5, 60)): c.drawString(str(1 + (int(t * 22 + 1) * 53) % 99), x - tw / 2, ty + dy * hpx, f, skia.Paint(Color=skia.Color(255, 255, 255, a_), AntiAlias=True))
            c.restore()
        c.drawString(txt, x - tw / 2, ty, f, skia.Paint(Color=skia.Color(25, 18, 90), AntiAlias=True, Style=skia.Paint.kStroke_Style, StrokeWidth=size * 0.14, StrokeJoin=skia.Paint.kRound_Join))
        c.drawString(txt, x - tw / 2, ty, f, skia.Paint(Color=skia.Color(255, 255, 255), AntiAlias=True))

    def caption(self, c, t):
        for s in self.segs:
            if s["start"] <= t < s["end"] + 0.12: break
        else: return
        u = t - s["start"]; cur = max([j for j, (_, wt) in enumerate(s["words"]) if u >= wt - 0.02] or [0])
        wd = re.sub(r"[^\w'?!-]", "", s["words"][cur][0]).lower()
        if not wd: return
        size = 104; f = skia.Font(FONT, size); tw = f.measureText(wd)
        if tw > W - 120: size *= (W - 120) / tw; f = skia.Font(FONT, size); tw = f.measureText(wd)
        age = u - s["words"][cur][1]; k = 1 + 0.08 * max(0, 1 - age / 0.08)
        x, y = W / 2, H * 0.6
        c.save(); c.translate(x, y); c.scale(k, k)
        c.drawString(wd, -tw / 2, size * 0.35, f, skia.Paint(Color=skia.Color(0, 0, 0), AntiAlias=True, Style=skia.Paint.kStroke_Style, StrokeWidth=size * 0.2, StrokeJoin=skia.Paint.kRound_Join))
        c.drawString(wd, -tw / 2, size * 0.35, f, skia.Paint(Color=skia.Color(255, 255, 255), AntiAlias=True))
        c.restore()

    def draw(self, img, badges, t):
        img = cinematic(img, int(t * FPS))
        buf = np.ascontiguousarray(np.dstack([img, np.full(img.shape[:2], 255, np.uint8)]))
        surf = skia.Surface(buf); c = surf.getCanvas()
        for b in sorted(badges, key=lambda b: b["k"]): self.badge(c, b, t)
        self.caption(c, t)
        out = np.array(surf.toarray()[..., :3]); del surf; return out


# ------------------------------------------------------------------ browser
_srv = None
def serve():
    global _srv
    if _srv: return
    try:
        import urllib.request; urllib.request.urlopen(f"http://127.0.0.1:{PORT}/video%20roblox/sorgente/web/index.html", timeout=2); return
    except Exception: pass
    h = functools.partial(http.server.SimpleHTTPRequestHandler, directory=ROOT)
    class Q(http.server.SimpleHTTPRequestHandler):
        def log_message(self, *a): pass
    socketserver.TCPServer.allow_reuse_address = True
    try:
        _srv = socketserver.ThreadingTCPServer(("127.0.0.1", PORT), functools.partial(Q, directory=ROOT))
    except OSError:          # another worker started it a moment ago: use that one
        time.sleep(1.0); return
    threading.Thread(target=_srv.serve_forever, daemon=True).start()


class Page:
    def __init__(self, film, segs, total):
        from playwright.sync_api import sync_playwright
        serve()
        self.pw = sync_playwright().start()
        self.br = self.pw.chromium.launch(executable_path=CHROME, headless=True, args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--use-gl=angle'])
        self.pg = self.br.new_page(viewport={'width': W, 'height': H}); self.errors = []
        self.pg.on('pageerror', lambda e: self.errors.append(str(e)))
        self.pg.goto(f"http://127.0.0.1:{PORT}/video%20roblox/sorgente/web/index.html?film={film}")
        self.pg.wait_for_function('window.ready === true || window.loadError', timeout=120000)
        err = self.pg.evaluate('window.loadError || null')
        if err: raise RuntimeError(err)
        TL = {s["id"]: round(s["start"], 4) for s in segs}
        self.shots = self.pg.evaluate(f"setTimeline({json.dumps(TL)}, {total:.4f})")
        self.cdp = self.pg.context.new_cdp_session(self.pg)

    def frame(self, t):
        badges = self.pg.evaluate(f"renderAt({t:.4f})")
        r = self.cdp.send('Page.captureScreenshot', {'format': 'jpeg', 'quality': 95, 'clip': {'x': 0, 'y': 0, 'width': W, 'height': H, 'scale': 1}})
        img = cv2.imdecode(np.frombuffer(base64.b64decode(r['data']), np.uint8), cv2.IMREAD_COLOR)
        if self.errors: print("PAGE ERRORS:", self.errors[-3:], flush=True); self.errors.clear()
        return cv2.cvtColor(img, cv2.COLOR_BGR2RGB), badges

    def close(self):
        try: self.br.close(); self.pw.stop()
        except Exception: pass


def render_range(film, script, f0, f1, out):
    segs, total = timeline(script); pg = Page(film, segs, total); ov = Overlay(segs)
    enc = subprocess.Popen(['ffmpeg', '-y', '-v', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{W}x{H}', '-r', str(FPS), '-i', '-',
                            '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '15', '-pix_fmt', 'yuv420p', out + '.part.mp4'], stdin=subprocess.PIPE)
    t0 = time.time()
    for k, f in enumerate(range(f0, f1)):
        t = f / FPS; img, badges = pg.frame(t); enc.stdin.write(ov.draw(img, badges, t).tobytes())
        if k % 60 == 0: print(f"[{f0}-{f1}] {k}/{f1 - f0} {(time.time() - t0) / (k + 1):.2f}s/frame", flush=True)
    enc.stdin.close(); enc.wait(); pg.close(); os.replace(out + '.part.mp4', out)


# ------------------------------------------------------------------ score: soft sustained bells in D major, no drums
def build_audio(script, segs, total, events=(), music=True):
    import music as M
    N = int(total * SR); T = M.Track(total + 4); X = M.Track(total + 4)
    beat = 0.65                                      # ~92 bpm, a new note every beat, a chord every 2 bars
    prog = [[62, 66, 69, 74, 78, 81], [59, 62, 66, 71, 74, 78], [55, 59, 62, 67, 71, 74], [57, 61, 64, 69, 73, 76]]   # D  Bm  G  A
    pat = [5, 3, 4, 2, 5, 3, 1, 4]
    t, i = 0.0, 0
    while t < total + 1:
        ch = prog[(i // 8) % 4]
        T.add(t, mono=M.bell(ch[pat[i % 8]], 2.6, 0.32, ratio=2.0, index=1.2), gain=0.11, pan=0.25 * math.sin(i * 1.3))
        if i % 8 == 0:
            for m in ch[:3]:
                pl, pr = M.pad_note(m - 12, beat * 8.4, 1500); T.add(t, L=pl, R=pr, gain=0.045)
            T.add(t, mono=M.pluck(ch[0] - 24, 1.2, 0.5, 600), gain=0.06)
        t += beat; i += 1
    tt = lambda d: np.arange(int(d * SR)) / SR
    def pop(f0=700, f1=1500, d=0.09):
        q = tt(d); f = f0 + (f1 - f0) * (q / d) ** 0.6; return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-q / 0.03) * 0.7
    for (te, kind) in events:
        if kind == 'pop': X.add(te, mono=pop(), gain=0.35)
        elif kind == 'ding': X.add(te, mono=M.bell(88, 1.2, 0.6), gain=0.25)
    voice = np.zeros(N, np.float32)
    for s in segs:
        y, sr = load_voice(script, s["id"]); g = np.gcd(SR, sr); y = signal.resample_poly(y, SR // g, sr // g).astype(np.float32); y = y / (np.abs(y).max() + 1e-9) * 0.85
        a = int(s["start"] * SR); m = min(len(y), N - a); voice[a:a + m] += y[:m]
    Lm, Rm = M.apply_reverb(T.L.astype(np.float64), T.R.astype(np.float64), wet=0.32, seconds=3.0)
    mus = np.stack([Lm[:N], Rm[:N]], 1); mus /= np.abs(mus).max() + 1e-9
    fx = np.stack([X.L[:N], X.R[:N]], 1); fx /= np.abs(fx).max() + 1e-9
    act = (np.abs(voice) > 0.01).astype(np.float32); kk = int(0.3 * SR)
    env = signal.fftconvolve(act, np.ones(kk) / kk, "same"); env = signal.fftconvolve((env > 0.03).astype(np.float32), np.ones(int(0.2 * SR)) / int(0.2 * SR), "same")
    mix = (mus * (0.4 * (1 - 0.3 * env))[:, None] if music else 0) + fx * 0.35 + voice[:, None]
    q = np.arange(N) / SR; mix *= (np.clip(q / 0.3, 0, 1) * np.clip((total - q) / 0.7, 0, 1))[:, None]
    mix = mix / (np.abs(mix).max() + 1e-9) * 0.9
    out = os.path.join(S_DIR, f"rbx_{script}_mix{'' if music else '_nomusic'}.wav"); sf.write(out, mix.astype(np.float32), SR, subtype="FLOAT"); return out


def badge_events(film, script):
    """pops for the badges: read once from the page at 10 fps (first appearance of each badge id)"""
    segs, total = timeline(script); pg = Page(film, segs, total); seen = set(); ev = []
    for f in range(0, int(total * 10)):
        t = f / 10; bs = pg.pg.evaluate(f"renderAt({t:.3f}, false)")   # positions only, no drawing
        for b in bs:
            key = (b.get("id") or "", fmt(b["v"]) if not str(b["v"])[0].isdigit() else "n")
            if key not in seen: seen.add(key); ev.append((t, 'pop'))
    pg.close(); return ev


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--film", default="film_iq"); ap.add_argument("--script", default="script_iq")
    ap.add_argument("--preview", nargs="*", type=float); ap.add_argument("--render", action="store_true"); ap.add_argument("--workers", type=int, default=3)
    ap.add_argument("--out", default=None); ap.add_argument("--nomusic", action="store_true", help="only the voice-only version")
    a = ap.parse_args()
    segs, total = timeline(a.script)
    if a.preview:
        pg = Page(a.film, segs, total); ov = Overlay(segs); ims = []
        for t in a.preview:
            ov.seen = {}; img, b = pg.frame(t - 0.4); ov.draw(img, b, t - 0.4); img, b = pg.frame(t); ims.append(cv2.resize(cv2.cvtColor(ov.draw(img, b, t), cv2.COLOR_RGB2BGR), (360, 640)))
        pg.close()
        while len(ims) % 6: ims.append(np.zeros_like(ims[0]))
        cv2.imwrite(os.path.join(S_DIR, "rbx_prev.jpg"), np.vstack([np.hstack(ims[k:k + 6]) for k in range(0, len(ims), 6)]))
        print("total", round(total, 2)); return
    if a.render:
        import multiprocessing as mp
        nf = int(math.ceil(total * FPS)); size = int(math.ceil(nf / a.workers / 2))
        cdir = os.path.join(S_DIR, f"rbx_chunks_{a.film}"); os.makedirs(cdir, exist_ok=True)
        jobs = [(f, min(nf, f + size), os.path.join(cdir, f"c_{f:06d}.mp4")) for f in range(0, nf, size)]
        todo = [j for j in jobs if not os.path.exists(j[2])]
        with mp.Pool(a.workers) as pool:
            pool.starmap(render_range, [(a.film, a.script, f0, f1, out) for f0, f1, out in todo])
        lst = os.path.join(cdir, "list.txt"); open(lst, "w").write("".join(f"file '{j[2]}'\n" for j in jobs))
        vid = os.path.join(S_DIR, f"rbx_{a.film}_video.mp4")
        subprocess.run(['ffmpeg', '-y', '-v', 'error', '-f', 'concat', '-safe', '0', '-i', lst, '-c', 'copy', vid], check=True)
        ev = badge_events(a.film, a.script); out = a.out or os.path.join(os.path.dirname(HERE), f"{a.film}.mp4")
        # main file: voice + pops only (add the original song as a sound in TikTok/CapCut); second file: with our score
        for music, path in ((False, out),) + (() if a.nomusic else ((True, out[:-4] + "_with_music.mp4"),)):
            wav = build_audio(a.script, segs, total, ev, music=music)
            subprocess.run(['ffmpeg', '-y', '-v', 'error', '-i', vid, '-i', wav, '-map', '0:v', '-map', '1:a', '-c:v', 'libx264', '-preset', 'slow', '-crf', '18', '-pix_fmt', 'yuv420p',
                            '-af', 'loudnorm=I=-14:TP=-1.5:LRA=9', '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-movflags', '+faststart', '-shortest', path], check=True)
            print(path, round(total, 2), "s")



if __name__ == "__main__":
    main()
