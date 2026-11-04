# -*- coding: utf-8 -*-
"""
"What if your IQ kept rising forever?" -- driver for the cinematic 3D version. Uses the three.js engine of the
What-if Shorts (../../video what if/sorgente: render.py + web/shots/iq_X.js) for the picture, and draws the
reference-style graphics on top in the same pass: a serif title, a small "YOUR IQ" counter, one italic serif
subtitle at a time. Then ambient music + narrator.

  python3 iq3d.py --timeline                 (voice durations -> timeline_X.json)
  python3 iq3d.py --preview 3 12 ...         (frames with graphics -> scratchpad/iq3d_prev.jpg)
  python3 iq3d.py --render [--workers 3]     (whole film, resumable chunks) then --mux
"""
import os, sys, json, math, argparse, subprocess
os.environ.setdefault("WHATIF", "X")
import numpy as np
import cv2, skia
import soundfile as sf
from scipy import signal

HERE = os.path.dirname(os.path.abspath(__file__))
ENGINE = os.path.normpath(os.path.join(HERE, "..", "..", "video what if", "sorgente"))
sys.path.insert(0, HERE); sys.path.insert(1, ENGINE)
import script_iq3d as SC
import render as R

S_DIR = os.environ.get("SCRATCH", "/tmp/claude-0/-home-user-Marry/e61fd834-a8c5-5cc5-8204-6c637a41951f/scratchpad")
VOICE = os.path.join(S_DIR, "voice_iq3d")
OUTF = os.path.join(os.path.dirname(HERE), "what_if_your_iq_kept_rising_forever.mp4")
W, H, FPS, SR = 1080, 1920, 30, 48000
LEAD = 0.4
INF = float("inf")
FONT = os.path.join(ENGINE, "font")
TF = {k: skia.Typeface.MakeFromFile(os.path.join(FONT, f)) for k, f in
      (("serif", "CormorantGaramond-500.ttf"), ("italic", "CormorantGaramond-500i.ttf"), ("label", "Inter-600.ttf"))}


def clamp(x, a=0.0, b=1.0): return max(a, min(b, x))
def sm(a, b, x): u = clamp((x - a) / (b - a)); return u * u * (3 - 2 * u)


# ------------------------------------------------------------------ timeline
def build_timeline():
    dur = json.load(open(os.path.join(VOICE, "durations.json")))
    t = LEAD; segs = []
    for s in SC.SEGMENTS:
        d = dur[s["id"]]["dur"]; segs.append({"id": s["id"], "start": round(t, 3), "dur": round(d, 3), "end": round(t + d, 3)}); t += d + s["pause"]
    tl = {"segments": segs, "chapters": [], "events": [{"start": 0.0}], "outro": {"start": round(t, 3)}, "total": round(t, 3)}
    json.dump(tl, open(os.path.join(ENGINE, "timeline_X.json"), "w"), indent=1)
    return tl


def load_tl():
    return json.load(open(os.path.join(ENGINE, "timeline_X.json")))


# ------------------------------------------------------------------ graphics
class Gfx:
    def __init__(self, tl):
        self.tl = tl; self.segs = tl["segments"]; self.meta = {s["id"]: s for s in SC.SEGMENTS}
        prev = 100
        for s in self.segs:
            m = self.meta[s["id"]]; s["iq0"] = prev; s["iq1"] = m["iq"] if m["iq"] is not None else prev; prev = s["iq1"]
            s["sub"] = m["sub"]

    def seg_at(self, t):
        cur = self.segs[0]
        for s in self.segs:
            if t >= s["start"] - 0.05: cur = s
        return cur

    def iq(self, t):
        s = self.seg_at(t); a, b = s["iq0"], s["iq1"]; u = t - s["start"]
        if a == b: return b
        if b == INF:
            k = sm(0.0, 2.2, u)
            return INF if k >= 1 else a * 10 ** (14 * k ** 2)
        span = s["dur"] if s["id"] == "X03" else 1.6
        return a * (b / a) ** sm(0, span, u)

    def draw(self, img, t):
        buf = np.ascontiguousarray(np.dstack([img, np.full(img.shape[:2], 255, np.uint8)]))
        surf = skia.Surface(buf)
        c = surf.getCanvas()
        first = self.segs[0]; last = self.segs[-1]
        # a soft dark gradient at the bottom (subtitles stay readable, even in the white-out)
        x12 = next(q for q in self.segs if q["id"] == "X12")
        gk = 0.45 + 0.35 * (sm(x12["start"] + 1.0, x12["start"] + 2.5, t) * (1 - sm(x12["end"] + 0.3, x12["end"] + 1.0, t)))
        gp = skia.Paint(); gp.setShader(skia.GradientShader.MakeLinear([skia.Point(0, 1150), skia.Point(0, H)], [skia.Color(0, 0, 0, 0), skia.Color(0, 0, 0, int(255 * gk))]))
        c.drawRect(skia.Rect(0, 1150, W, H), gp)
        # title (first line)
        ta = sm(0.2, 1.0, t) * (1 - sm(first["end"] + 0.8, first["end"] + 1.6, t))
        if ta > 0:
            self.text(c, "What if your", 540, 380, 96, 'serif', ta)
            parts = [("IQ", '#9fd8ff'), (" kept rising", '#ffffff')]
            self.line(c, parts, 540, 495, 96, ta); self.text(c, "forever?", 540, 610, 96, 'serif', ta)
        # HUD: small caps label + serif number (left, like the reference)
        ha = sm(0.6, 1.4, t)
        if ha > 0:
            v = self.iq(t); x0, y0 = 70, 1380
            self.text(c, "YOUR IQ", x0, y0, 34, 'label', ha * 0.92, align='left', spacing=4)
            s = "∞" if v == INF else f"{int(round(v)):,}"
            size = 150 if v == INF else min(124, 124 * 900 / max(1, self.width(s, 124, 'serif')))
            self.text(c, s, x0 - 4, y0 + 112, size, 'serif', ha, align='left')
            sub = "AND RISING" if (v != INF and t < self.segs[-3]["start"]) else ("NO LIMIT" if v == INF else "")
            if sub: self.text(c, sub, x0, y0 + 160, 26, 'label', ha * 0.6, align='left', spacing=3)
        # subtitle: the whole line, italic serif, centred
        s = self.seg_at(t)
        if s is not first or t > first["end"]:
            pass
        for sg in self.segs:
            if sg is first: continue
            a = sm(sg["start"] - 0.15, sg["start"] + 0.25, t) * (1 - sm(sg["end"] + 0.25, sg["end"] + 0.6, t))
            if a <= 0: continue
            big = sg is last
            self.para(c, sg["sub"], 540, 1700 if not big else 860, 70 if not big else 90, a, maxw=940)
        # white flash out of infinity (into the empty park)
        x13 = next(s for s in self.segs if s["id"] == "X13")
        wa = 1 - sm(x13["start"] - 0.02, x13["start"] + 1.0, t) if t >= x13["start"] - 0.02 else 0
        if wa > 0: c.drawRect(skia.Rect(0, 0, W, H), skia.Paint(Color=skia.Color(255, 255, 255, int(255 * wa))))
        # fade in/out of the whole film
        fo = max(1 - sm(0, 0.5, t), sm(self.tl["total"] - 0.6, self.tl["total"], t))
        if fo > 0: c.drawRect(skia.Rect(0, 0, W, H), skia.Paint(Color=skia.Color(0, 0, 0, int(255 * fo))))
        out = np.array(surf.toarray()[..., :3]); del surf; return out

    # text helpers
    def font(self, size, key): return skia.Font(TF[key], size)
    def width(self, s, size, key, spacing=0): return self.font(size, key).measureText(s) + spacing * max(0, len(s) - 1)

    def text(self, c, s, x, y, size, key, a=1.0, align='center', colr='#ffffff', spacing=0):
        w = self.width(s, size, key, spacing); x0 = x - w / 2 if align == 'center' else x
        f = self.font(size, key)
        sh = skia.Paint(Color=skia.Color(0, 0, 0, int(110 * a)), AntiAlias=True); sh.setMaskFilter(skia.MaskFilter.MakeBlur(skia.kNormal_BlurStyle, size * 0.08))
        p = skia.Paint(Color=skia.Color(*[int(colr[i:i + 2], 16) for i in (1, 3, 5)], int(255 * a)), AntiAlias=True)
        if spacing:
            xx = x0
            for ch in s:
                c.drawString(ch, xx + 2, y + 3, f, sh); c.drawString(ch, xx, y, f, p); xx += f.measureText(ch) + spacing
        else:
            c.drawString(s, x0 + 2, y + 3, f, sh); c.drawString(s, x0, y, f, p)

    def line(self, c, parts, x, y, size, a):
        w = sum(self.width(s, size, 'serif') for s, _ in parts); xx = x - w / 2
        for s, colr in parts:
            self.text(c, s, xx, y, size, 'serif', a, align='left', colr=colr); xx += self.width(s, size, 'serif')

    def para(self, c, s, x, y, size, a, maxw=900):
        words = s.split(); lines = []; cur = ""
        for w in words:
            nxt = (cur + " " + w).strip()
            if self.width(nxt, size, 'italic') > maxw and cur: lines.append(cur); cur = w
            else: cur = nxt
        if cur: lines.append(cur)
        y0 = y - (len(lines) - 1) * size * 0.62
        for i, ln in enumerate(lines): self.text(c, ln, x, y0 + i * size * 1.22, size, 'italic', a)


# ------------------------------------------------------------------ hook the graphics into the engine's renderer
_GFX = {}
def frame_with_gfx(self, t, k, overlays=False, hero=None):
    img, shot = self.band(t, k, hero)
    out = R.letterbox(img)
    if overlays:
        g = _GFX.get("g") or _GFX.setdefault("g", Gfx(load_tl()))
        out = g.draw(out, t)
    return out, shot
R.Renderer.frame = frame_with_gfx
R.key_windows = lambda tl, seg_by: []


# ------------------------------------------------------------------ audio: ambient score + narrator
def build_audio(tl):
    import music as M, sfx as FX
    total = tl["total"]; N = int(total * SR); T = M.Track(total + 4); X = M.Track(total + 4)
    seg = {s["id"]: s for s in tl["segments"]}
    # slow chords (Dmaj7 - Bm9 - Gmaj7 - A6), 4 s each, pads + sparse piano, brighter as the IQ climbs
    prog = [(50, [62, 66, 69, 73]), (47, [62, 66, 69, 73]), (43, [62, 66, 71, 74]), (45, [61, 64, 69, 73])]
    t, i = 0.0, 0
    x12 = seg["X12"]["start"]; x13 = seg["X13"]["start"]
    while t < total:
        root, ch = prog[i % 4]; lift = clamp(t / x12)
        for m in ch[:3]:
            pl, pr = M.pad_note(m - 12, 4.4, 1200 + 2200 * lift); T.add(t, L=pl, R=pr, gain=0.05)
        bl, br = M.pad_note(root - 12, 4.4, 400); T.add(t, L=bl, R=br, gain=0.08)
        if t > 3.0 and not (x12 - 0.5 < t < x13 + 1.0):
            for j, m in enumerate(ch):
                if (i + j) % 2 == 0 or lift > 0.5: T.add(t + j * 0.5 + (0.25 if lift > 0.6 else 0), mono=M.piano(m + (12 if lift > 0.4 and j % 2 else 0), 2.0, 0.35), gain=0.07, pan=(j - 1.5) * 0.25)
        t += 4.0; i += 1
    # infinity: a long riser into a soft boom and a high shimmer; the lonely ending: just a few piano notes
    X.add(x12 - 0.2, mono=M.riser(3.4, 0.5), gain=0.25)
    X.add(x13 - 0.05, mono=FX.boom_low(0.6), gain=0.35)
    for k, m in enumerate((74, 73, 69, 66)): T.add(x13 + 0.6 + k * 1.1, mono=M.piano(m, 2.5, 0.4), gain=0.1)
    for s in tl["segments"]:   # a soft whoosh on every cut
        if s["id"] not in ("X02", "X04", "X06", "X14"): X.add(s["start"] - 0.25, mono=FX.whoosh(0.5, 0.35, True), gain=0.12)
    voice = np.zeros(N, np.float32)
    for s in tl["segments"]:
        y, sr = sf.read(os.path.join(VOICE, s["id"] + ".wav"), dtype="float32"); y = y if y.ndim == 1 else y.mean(1)
        g = np.gcd(SR, sr); y = signal.resample_poly(y, SR // g, sr // g).astype(np.float32); y = y / (np.abs(y).max() + 1e-9) * 0.85
        a = int(s["start"] * SR); m = min(len(y), N - a); voice[a:a + m] += y[:m]
    Lm, Rm = M.apply_reverb(T.L.astype(np.float64), T.R.astype(np.float64), wet=0.35, seconds=4.0)
    mus = np.stack([Lm[:N], Rm[:N]], 1); mus /= np.abs(mus).max() + 1e-9
    fx = np.stack([X.L[:N], X.R[:N]], 1); fx /= np.abs(fx).max() + 1e-9
    act = (np.abs(voice) > 0.01).astype(np.float32); kk = int(0.4 * SR)
    env = signal.fftconvolve(act, np.ones(kk) / kk, "same"); env = signal.fftconvolve((env > 0.03).astype(np.float32), np.ones(int(0.3 * SR)) / int(0.3 * SR), "same")
    vr = np.stack(M.apply_reverb(voice.astype(np.float64), voice.astype(np.float64), wet=0.08, seconds=1.2), 1)[:N]
    mix = mus * (0.42 * (1 - 0.4 * env))[:, None] + fx * 0.4 + vr
    tt = np.arange(N) / SR; mix *= (np.clip(tt / 0.5, 0, 1) * np.clip((total - tt) / 0.8, 0, 1))[:, None]
    mix = mix / (np.abs(mix).max() + 1e-9) * 0.9
    out = os.path.join(S_DIR, "iq3d_mix.wav"); sf.write(out, mix.astype(np.float32), SR, subtype="FLOAT"); return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--timeline", action="store_true"); ap.add_argument("--preview", nargs="*", type=float)
    ap.add_argument("--render", action="store_true"); ap.add_argument("--workers", type=int, default=3); ap.add_argument("--mux", action="store_true")
    ap.add_argument("--hero", choices=["on", "off"], default="on")
    a = ap.parse_args()
    if a.timeline: print("total", build_timeline()["total"])
    if a.preview:
        r = R.Renderer(); ims = []
        for k, t in enumerate(a.preview):
            img, shot = r.frame(t, k, overlays=True, hero=(a.hero == "on")); print(round(t, 2), shot["id"], flush=True)
            ims.append(cv2.resize(cv2.cvtColor(img, cv2.COLOR_RGB2BGR), (360, 640)))
        r.close()
        while len(ims) % 6: ims.append(np.zeros_like(ims[0]))
        cv2.imwrite(os.path.join(S_DIR, "iq3d_prev.jpg"), np.vstack([np.hstack(ims[k:k + 6]) for k in range(0, len(ims), 6)]))
    if a.render:
        R.render_all(workers=a.workers, size=150)
    if a.mux:
        wav = build_audio(load_tl()); vid = os.path.join(S_DIR, "film_video_whatif_X.mp4")
        subprocess.run(['ffmpeg', '-y', '-hide_banner', '-loglevel', 'error', '-i', vid, '-i', wav, '-map', '0:v:0', '-map', '1:a:0', '-c:v', 'libx264', '-preset', 'slow', '-crf', '18',
                        '-pix_fmt', 'yuv420p', '-af', 'loudnorm=I=-14:TP=-1.5:LRA=9', '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-movflags', '+faststart', '-shortest', OUTF], check=True)
        print(OUTF)


if __name__ == "__main__":
    main()
