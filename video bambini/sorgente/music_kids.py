# -*- coding: utf-8 -*-
"""Original procedural music for the kids video (no samples): a bouncy ukulele-and-glockenspiel tune at 110 bpm.
Each chapter gets its own key and flavour (colours: sunny, numbers: marching, animals: farmyard bounce, hide and seek:
tiptoe pizzicato, night: lullaby, dance party: four-on-the-floor), chapter cards get a little fanfare."""
import os, json
import numpy as np
import soundfile as sf
import music as M
from music import SR

HERE = os.path.dirname(os.path.abspath(__file__))
SCRATCH = os.environ.get("SCRATCH", "/tmp/claude-0/-home-user-Marry/e61fd834-a8c5-5cc5-8204-6c637a41951f/scratchpad")
OUT = os.path.join(SCRATCH, "audio_kids")
BPM = 110; B = 60 / BPM
PROG = [(0, 4, 7), (7, 11, 14), (9, 12, 16), (5, 9, 12)]      # I - V - vi - IV
PENTA = [0, 2, 4, 7, 9, 12, 14, 16]


def pad(m, dur, gain_l=1.0, **k):
    L, R = M.pad_note(m, dur, **k); return L, R


class Tune:
    def __init__(self, total):
        self.T = M.Track(total + 6); self.rng = np.random.default_rng(5)

    def add(self, t, y, g, pan=0.0):
        self.T.add(t, mono=y, gain=g, pan=pan)

    def section(self, t0, t1, root, style="sunny", mel=True, drums=True, level=1.0):
        t, i = t0, 0
        motif = [PENTA[self.rng.integers(0, 6)] for _ in range(8)]
        while t < t1 - 0.05:
            bar = i // 4; ch = PROG[bar % 4]; beat = i % 4
            r = root + ch[0]
            if style == "lullaby":
                if beat == 0:
                    for k, m in enumerate(ch): self.add(t + k * B * 0.5, M.bell(root + 12 + m, 2.5, 0.35), 0.10 * level, pan=-0.3 + 0.3 * k)
                    L, R = M.pad_note(root - 12 + ch[0], 4 * B, bright=700); self.T.add(t, L=L, R=R, gain=0.08 * level)
            else:
                # bass on 1 and 3
                if beat in (0, 2): self.add(t, M.pluck(r - 12, 0.5, 0.75, 900), 0.30 * level)
                # ukulele strum: chord on the 8ths (staccato for tiptoe)
                for h in range(2):
                    if style == "tiptoe" and h == 1: continue
                    vel = 0.42 if h == 0 else 0.3
                    for k, m in enumerate(ch): self.add(t + h * B / 2 + k * 0.012, M.pluck(root + 12 + m, 0.22 if style == "tiptoe" else 0.35, vel, 3200), 0.07 * level, pan=-0.2 + 0.2 * k)
                # soft piano chord on the bar
                if beat == 0 and style != "tiptoe":
                    for m in ch: self.add(t, M.epiano(root + m, 4 * B, 0.3), 0.06 * level)
                if drums:
                    if style == "party":
                        self.add(t, M.kick(0.9), 0.36 * level)
                        if beat in (1, 3): self.add(t, M.snare(0.55), 0.16 * level)
                        self.add(t + B / 2, M.hat(0.25), 0.12 * level)
                    elif style == "march":
                        self.add(t, M.kick(0.7 if beat in (0, 2) else 0.4), 0.26 * level)
                        self.add(t + B / 2, M.snare(0.18), 0.06 * level)
                        if beat in (1, 3): self.add(t, M.snare(0.45), 0.12 * level)
                    elif style == "tiptoe":
                        if beat in (0, 2): self.add(t, M.kick(0.35), 0.14 * level)
                    else:
                        if beat in (0, 2): self.add(t, M.kick(0.6), 0.22 * level)
                        if beat in (1, 3): self.add(t, M.snare(0.35), 0.09 * level)
                        self.add(t + B / 2, M.shaker(0.2), 0.08 * level)
            # glockenspiel tune: a 2-bar phrase on the even blocks of 4 bars, an answer on the odd ones
            if mel and style != "lullaby":
                blk = bar % 8
                if blk < 2 or 4 <= blk < 6:
                    step = (i % 8)
                    if step % 1 == 0:
                        m = motif[step] + (0 if blk < 4 else (2 if step % 2 else 0))
                        if not (style == "tiptoe" and step % 2): self.add(t, M.bell(root + 24 + m, 0.9, 0.42), 0.075 * level, pan=0.15)
            t += B; i += 1

    def fanfare(self, t, root):
        for k, m in enumerate([0, 4, 7, 12, 16]): self.add(t + k * 0.09, M.bell(root + 24 + m, 1.6, 0.6), 0.12)
        for m in (0, 4, 7): self.add(t + 0.45, M.pluck(root + 12 + m, 0.9, 0.6, 3000), 0.12)
        self.T.add(max(0, t - 1.0), mono=M.reverse_cymbal(1.0, 0.25), gain=0.25)
        self.add(t + 0.45, M.kick(0.8), 0.25)


def compose(tl):
    total = tl["total"]; S = Tune(total)
    seg = {s["id"]: s for s in tl["segments"]}
    at = lambda sid, off=0.0: (seg[sid]["start"] if not sid.startswith("chap:") else next(c["start"] for c in tl["chapters"] if c["id"] == sid[5:])) + off
    ch = [c["start"] for c in tl["chapters"]]
    title0, title1 = tl["events"][0]["start"], tl["events"][0]["end"]
    # intro + title jingle
    S.section(0.0, title0, 60, "sunny", mel=False, level=0.8)
    S.fanfare(title0 + 0.1, 60)
    S.section(title0 + 0.6, ch[0], 60, "sunny", level=1.0)
    keys = {"c00": (60, "sunny"), "q00": (65, "tiptoe"), "n00": (67, "march"), "a00": (62, "sunny"), "o00": (65, "sunny"), "h00": (60, "tiptoe"), "d00": (67, "party"), "g00": (60, "sunny")}
    for k, c in enumerate(tl["chapters"]):
        c0 = c["start"]; c1 = ch[k + 1] if k + 1 < len(ch) else tl["outro"]["start"]
        root, style = keys[c["id"]]
        S.fanfare(c0 + 0.05, root)
        if c["id"] == "o00":   # opposites: sunny until the sunset, then a lullaby for the night
            S.section(c0 + 0.6, at("o10"), root, "sunny"); S.section(at("o10"), c1, root, "lullaby", level=1.1)
        elif c["id"] == "n00":   # numbers: march, then a drum build into "blast off"
            S.section(c0 + 0.6, at("n14"), root, "march")
            t = at("n14"); n = 0
            while t < at("n15"): S.add(t, M.snare(0.3 + 0.5 * n / 40), 0.14); t += B / 2 if t < at("n14") + (at("n15") - at("n14")) / 2 else B / 4; n += 1
            S.T.add(at("n14"), mono=M.riser(at("n15") - at("n14"), 0.5), gain=0.35)
            S.add(at("n15"), M.boom(1.0), 0.5)
            S.section(at("n15") + 0.2, c1, root, "party", level=0.9)
        else:
            S.section(c0 + 0.6, c1, root, style)
    # outro: the tune once more, then a final chord
    o0 = tl["outro"]["start"]
    S.section(o0, total - 2.4, 60, "sunny", level=1.0)
    for m in (0, 4, 7, 12): S.add(total - 2.4, M.pluck(72 + m, 2.0, 0.6, 3000), 0.12); S.add(total - 2.4, M.bell(84 + m, 2.4, 0.5), 0.08)
    S.add(total - 2.4, M.kick(0.8), 0.3)
    L, R = M.apply_reverb(S.T.L.astype(np.float64), S.T.R.astype(np.float64), wet=0.16)
    n = int(total * SR); mus = np.stack([L[:n], R[:n]], 1)
    return (mus / (np.abs(mus).max() + 1e-9) * 0.9).astype(np.float32)


if __name__ == "__main__":
    tl = json.load(open(os.path.join(HERE, "timeline.json")))
    os.makedirs(OUT, exist_ok=True)
    mus = compose(tl)
    sf.write(os.path.join(OUT, "music.wav"), mus, SR, subtype="FLOAT")
    print("music.wav", len(mus) / SR, "s")
