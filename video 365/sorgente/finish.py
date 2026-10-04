# -*- coding: utf-8 -*-
"""
Final pass: on-screen graphics over the rendered picture, plus the mixed audio -> the master.

The picture chunks (render.py) carry no text. Here we add, following graphics_plan.py:
  - chapter cards, the title card, the end screen and the rolling credits;
  - the YEAR + POPULATION HUD, only in timelapses and transitions (never in KEY moments),
    with a red/green chip when the population changed while we were away, and a trend arrow
    while it is changing;
  - captions, name cards, rule cards... only outside KEY moments (KEY moments carry no text).

  python3 finish.py                      # film_video.mp4 + audio/mix.wav -> 100_AIs_Forest_vs_Plain_Day_365.mp4
  python3 finish.py --preview 120 485.5  # frames from the chunks, with graphics -> frames/fin_*.jpg
  python3 finish.py --check              # list graphics that would collide with KEY moments
"""
import os, sys, json, math, argparse, subprocess, time
import numpy as np
import cv2
import skia

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import overlays as OV
import graphics_plan as GP

W, H, FPS = 1920, 1080, 24
SCRATCH = os.environ.get("SCRATCH", "/tmp/claude-0/-home-user-Marry/e61fd834-a8c5-5cc5-8204-6c637a41951f/scratchpad")


def load():
    tl = json.load(open(os.path.join(HERE, "timeline.json")))
    return tl, {s["id"]: s for s in tl["segments"]}, {c["id"]: c for c in tl["chapters"]}


def _value(t, marks, ramps):
    """marks: [(t, v)] steps; ramps: [(t0, t1, v0, v1)] smooth. Inside a ramp the ramp wins unless a mark
    falls strictly inside it before t; otherwise the latest mark / ramp end wins (marks win ties)."""
    for a, b, v0, v1 in ramps:
        if a <= t < b and not any(a < tm <= t for tm, _ in marks):
            u = (t - a) / (b - a)
            u = u * u * (3 - 2 * u)
            return v0 + (v1 - v0) * u
    best, bt, bp = None, -1e9, -1
    for tm, v in marks:
        if tm <= t and (tm, 1) > (bt, bp):
            best, bt, bp = v, tm, 1
    for a, b, v0, v1 in ramps:
        if b <= t and (b, 0) > (bt, bp):
            best, bt, bp = v1, b, 0
    return best if best is not None else 0


class Graphics:
    def __init__(self, tl, seg_by, chap_by, verbose=False):
        self.tl, self.seg_by, self.chap_by = tl, seg_by, chap_by
        S = lambda a: seg_by[a]["start"]
        self.outro0 = tl["outro"]["start"]
        self.keys = [(S(a) - 0.05, (S(b) - 0.05) if b else self.outro0) for a, b in GP.KEY]
        self.events = []
        for kind, anchor, dur, p in GP.EVENTS:
            s = seg_by[anchor]
            t0 = s["start"] + p.get("delay", 0.0)
            t1 = t0 + (dur if dur is not None else s["dur"] + s["pause"])
            if dur is not None and "delay" in p:
                t1 = s["start"] + dur
            if kind not in GP.KEY_OK:
                for k0, k1 in self.keys:
                    if t0 < k1 and t1 > k0:
                        if verbose:
                            print(f"WARNING: {kind} at {anchor} ({t0:.1f}-{t1:.1f}) overlaps KEY {k0:.1f}-{k1:.1f}")
            self.events.append((kind, t0, t1, p))
        self.day_marks = sorted([(S(a), v) for a, v in GP.DAY_MARKS])
        self.day_ramps = [(S(a), S(b), d0, d1) for a, b, d0, d1 in GP.DAY_RAMPS]
        self.pf_marks = sorted([(S(a), v) for a, v in GP.POP_F_MARKS]); self.pf_ramps = [(S(a), S(b), p0, p1) for a, b, p0, p1 in GP.POP_F_RAMPS]
        self.pp_marks = sorted([(S(a), v) for a, v in GP.POP_P_MARKS]); self.pp_ramps = [(S(a), S(b), p0, p1) for a, b, p0, p1 in GP.POP_P_RAMPS]
        self.hidden = []
        self.year_on = S("r12")
        ev = tl["events"][0]
        self.title = (ev["start"], ev["end"])
        self.cards = [(c["start"], c["end"]) for c in tl["chapters"]]
        self.hud_windows = []
        self.chips = []
        # everything that draws something, for a quick "anything to draw?" test
        self.active_iv = [(t0, t1) for _, t0, t1, _ in self.events] + [(self.year_on, self.outro0)] + self.cards + [self.title, (self.outro0, 1e9)]

    # ------------------------------------------------------------ values
    def day_at(self, t):
        return _value(t, self.day_marks, self.day_ramps)

    def pf_at(self, t):
        return _value(t, self.pf_marks, self.pf_ramps)

    def pp_at(self, t):
        return _value(t, self.pp_marks, self.pp_ramps)

    def in_key(self, t):
        return any(a <= t < b for a, b in self.keys)

    def hud_alpha(self, t):
        if t < self.year_on or t >= self.outro0 - 0.3:
            return 0.0
        a = OV.sm(self.year_on, self.year_on + 0.5, t)
        for k0, k1 in self.keys + self.hidden + self.cards + [self.title]:
            if t < k0 - 0.35 or t >= k1 + 0.35:
                continue
            if k0 <= t < k1:
                return 0.0
            a = min(a, 1 - OV.sm(k0 - 0.35, k0, t) if t < k0 else OV.sm(k1, k1 + 0.35, t))
        return a

    def active(self, t):
        return any(a <= t < b for a, b in self.active_iv)

    # ------------------------------------------------------------ drawing
    def draw(self, c, t):
        for c0, c1 in self.cards:
            if c0 <= t < c1:
                ch = [x for x in self.tl["chapters"] if x["start"] == c0][0]
                OV.chapter_card(c, (t - c0) / (c1 - c0), ch["label"], ch["title"], ch["sub"])
        if self.title[0] <= t < self.title[1]:
            OV.title_card(c, (t - self.title[0]) / (self.title[1] - self.title[0]))
        key = self.in_key(t)
        for kind, t0, t1, p in self.events:
            if not (t0 <= t < t1) or (key and kind not in GP.KEY_OK):
                continue
            u = (t - t0) / max(1e-3, t1 - t0)
            if kind == "rule":
                OV.rule_card(c, u, p["n"], p["l1"], p.get("l2"))
            elif kind == "caption":
                OV.caption(c, u, p["s"], p.get("color", "#ffffff"), p.get("y"), p.get("size", 78), p.get("key", "anton"), p.get("box"))
            elif kind == "name":
                OV.name_card(c, u, p["name"], p["role"], GP.C.get(p["c"], "#ffffff"), p.get("side", "left"))
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
            elif kind == "peoples":
                OV.peoples_card(c, u, p["items"])
            elif kind == "search":
                OV.hud_search(c, u, t)
            elif kind == "kings":
                OV.kings_ticker(c, u, p.get("first", "VII"), p.get("last", "XIX"))
            elif kind == "winner":
                OV.winner_card(c, u, p["name"], p["a"], p["b"])
            elif kind == "comment":
                OV.comment_prompt(c, u, t)
            elif kind == "flash":
                k = math.exp(-((t - (t0 + p["at"])) / 0.12) ** 2) if t >= t0 + p["at"] - 0.05 else 0.0
                OV.flash(c, k)
        a = self.hud_alpha(t)
        if a > 0:
            def tr(fn):
                dp = fn(t + 0.08) - fn(t - 0.08)
                return 0 if abs(dp) < 0.05 else (1 if dp > 0 else -1)
            OV.hud(c, self.day_at(t), self.pf_at(t), self.pp_at(t), a, tr(self.pf_at), tr(self.pp_at), t)
        if t >= self.outro0:
            o = self.tl["outro"]
            u = (t - o["start"]) / (o["end"] - o["start"])
            OV.end_screen(c, u)
            OV.end_credits(c, u)


def draw_over(img, gfx, t):
    if not gfx.active(t):
        return img
    rgba = np.empty((H, W, 4), np.uint8)
    rgba[..., :3] = img
    rgba[..., 3] = 255
    surf = skia.Surface(rgba)
    gfx.draw(surf.getCanvas(), t)
    return rgba[..., :3].copy()


# ------------------------------------------------------------------ previews from the rendered chunks
def chunk_frame(t, size=240):
    ch = os.path.join(SCRATCH, "chunks")
    f = int(round(t * FPS)); c0 = (f // size) * size
    files = [n for n in os.listdir(ch) if n.startswith(f"c_{c0:06d}_") and n.endswith(".mp4") and "part" not in n]
    if not files:
        return None
    r = subprocess.run(['ffmpeg', '-v', 'error', '-ss', f'{(f - c0) / FPS:.4f}', '-i', os.path.join(ch, files[0]), '-frames:v', '1',
                        '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], capture_output=True)
    if len(r.stdout) < W * H * 3:
        return None
    return np.frombuffer(r.stdout[:W * H * 3], np.uint8).reshape(H, W, 3).copy()


# ------------------------------------------------------------------ the master
def finish(video, audio, out, crf=19):
    tl, seg_by, chap_by = load()
    gfx = Graphics(tl, seg_by, chap_by, verbose=True)
    n = int(math.ceil(tl["total"] * FPS))
    fade_out = tl["total"] - 1.6
    dec = subprocess.Popen(['ffmpeg', '-v', 'error', '-i', video, '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], stdout=subprocess.PIPE, bufsize=W * H * 3 * 4)
    enc = subprocess.Popen(['ffmpeg', '-y', '-hide_banner', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{W}x{H}', '-r', str(FPS), '-i', '-',
                            '-i', audio, '-map', '0:v:0', '-map', '1:a:0',
                            '-vf', f'fade=t=in:st=0:d=0.7,fade=t=out:st={fade_out:.3f}:d=1.6', '-af', f'afade=t=out:st={fade_out:.3f}:d=1.6',
                            '-c:v', 'libx264', '-preset', 'slow', '-tune', 'film', '-crf', str(crf), '-maxrate', '9M', '-bufsize', '18M',
                            '-profile:v', 'high', '-pix_fmt', 'yuv420p', '-g', '48', '-bf', '2',
                            '-c:a', 'aac', '-b:a', '320k', '-ar', '48000', '-movflags', '+faststart', '-shortest',
                            '-metadata', 'title=100 AIs in a Forest vs 100 on a Plain: The Wall Falls on Day 365', out], stdin=subprocess.PIPE)
    t0 = time.time()
    fb = W * H * 3
    for i in range(n):
        buf = dec.stdout.read(fb)
        if len(buf) < fb:
            print(f"picture ended at frame {i} of {n}", flush=True)
            break
        img = np.frombuffer(buf, np.uint8).reshape(H, W, 3)
        enc.stdin.write(draw_over(img, gfx, i / FPS).tobytes())
        if i % 1200 == 0:
            el = time.time() - t0
            print(f"{i}/{n} frames  {el / 60:.1f} min  ~{el / max(1, i) * (n - i) / 60:.1f} min left", flush=True)
    enc.stdin.close(); enc.wait(); dec.kill()
    print("master ->", out, flush=True)


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--preview", nargs="*", type=float)
    ap.add_argument("--check", action="store_true")
    ap.add_argument("--video", default=os.path.join(SCRATCH, "film_video.mp4"))
    ap.add_argument("--audio", default=os.path.join(SCRATCH, "audio", "mix.wav"))
    ap.add_argument("--out", default=os.path.join(SCRATCH, "100_AIs_Forest_vs_Plain_Day_365.mp4"))
    a = ap.parse_args()
    if a.check:
        tl, sb, cb = load()
        g = Graphics(tl, sb, cb, verbose=True)
        print("checked")
    elif a.preview:
        tl, sb, cb = load()
        g = Graphics(tl, sb, cb)
        os.makedirs(os.path.join(SCRATCH, "frames"), exist_ok=True)
        for t in a.preview:
            img = chunk_frame(t)
            if img is None:
                img = np.zeros((H, W, 3), np.uint8); img[138:942] = 70
            out = draw_over(img, g, t)
            p = os.path.join(SCRATCH, "frames", f"fin_{t:08.3f}.jpg")
            cv2.imwrite(p, cv2.cvtColor(out, cv2.COLOR_RGB2BGR), [cv2.IMWRITE_JPEG_QUALITY, 90])
            print(p)
    else:
        finish(a.video, a.audio, a.out)
