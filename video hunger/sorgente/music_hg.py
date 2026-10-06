# -*- coding: utf-8 -*-
"""Original procedural score for the arena film (no samples): built from the film's own synthesizer."""
import os, json
import numpy as np
import soundfile as sf
import music as M
from music import Score, SR

HERE = os.path.dirname(os.path.abspath(__file__))
SCRATCH = os.environ.get("SCRATCH", "/tmp/claude-0/-home-user-Marry/e61fd834-a8c5-5cc5-8204-6c637a41951f/scratchpad")


def compose_hg(tl):
    S = Score(tl); at = S.at
    # ---------------------------------------------------------------- cold open: eerie, one question
    S.drone(0, at('r01') + 2, 33, gain=0.2)
    S.pads(0.5, at('r01'), ['Am', 'Fmaj7', 'Am', 'Em'], 5.5, gain=0.07, bright=1100, octave=3, choir=0.25, att=2.0)
    S.arp(at('h06'), at('r01'), ['Am', 'F', 'C', 'G'], 4.0, 0.5, 'bell', gain=0.05, octave=4, pattern=(0, 2, 1, 2), vel=0.5)
    S.hit(at('h05'), 0.9); S.hit(at('title', 0.1), 1.0)
    # ---------------------------------------------------------------- I. rules: curious, a little playful
    S.pads(at('r01'), at('b01'), ['Dm', 'Bb', 'F', 'C'], 4.2, gain=0.08, bright=1500, octave=3)
    S.arp(at('r01'), at('r10'), ['Dm', 'Bb', 'F', 'C'], 4.2, 0.35, 'pluck', gain=0.06, octave=4, pattern=(0, 1, 2, 1, 3, 2), vel=0.5)
    S.hit(at('r09', 3.0), 0.7); S.hit(at('r10'), 0.8); S.hit(at('r12'), 0.8)
    S.ostinato(at('r10'), at('r15'), ['Dm', 'Dm', 'Bb', 'C'], 2.4, 0.3, gain=0.05)
    S.T.add(at('r15', 3.5), M.riser(at('b01') - at('r15', 3.5), 0.45), gain=0.7)
    # ---------------------------------------------------------------- II. the Horn: sixty seconds, then chaos
    S.drone(at('b01'), at('b05'), 31, gain=0.16)
    t = at('b01')
    while t < at('b05') - 0.5:
        S.T.add(t, M.timpani(48, 0.35 + 0.5 * (t - at('b01')) / (at('b05') - at('b01'))), gain=0.5); t += 0.9 - 0.4 * (t - at('b01')) / (at('b05') - at('b01'))
    S.hit(at('b05'), 1.2, rev=False)
    S.drums(at('b05', 0.6), at('b19'), 0.4, 't.tk.s.t.tk.s.s', gain=0.35)
    S.pads(at('b05'), at('b19'), ['Am', 'F', 'Dm', 'E'], 2.6, gain=0.1, bright=1700, octave=2, bass=0.6)
    S.pads(at('b19'), at('f01'), ['Am', 'Fmaj7', 'Dm', 'Am'], 6.0, gain=0.09, bright=900, octave=3, choir=0.4, att=2.0)
    S.drone(at('b19'), at('f01'), 33, gain=0.15)
    # ---------------------------------------------------------------- III. six worlds: adventure
    S.pads(at('f01'), at('f13b'), ['D', 'Bm', 'G', 'A'], 4.0, gain=0.08, bright=2000, octave=3)
    S.arp(at('f01'), at('f13b'), ['D', 'Bm', 'G', 'A'], 4.0, 0.3, 'pluck', gain=0.07, octave=4, pattern=(0, 1, 2, 3, 2, 1), vel=0.55)
    S.drums(at('f09'), at('f12'), 0.35, 't.xk.xs.t.xk.xs.', gain=0.28)
    S.hit(at('f12', 1.9), 0.9, rev=False)
    S.drone(at('f13b'), at('f14'), 38, gain=0.14); S.pads(at('f13b'), at('f14'), ['Bm', 'G', 'Bm', 'A'], 3.0, gain=0.08, bright=900, octave=2, bass=0.6)
    S.hit(at('f13c'), 0.7); S.hit(at('f13f', 0.2), 0.6, rev=False)
    S.pads(at('f14'), at('a01'), ['G', 'D', 'Em', 'C'], 4.6, gain=0.09, bright=1500, octave=3, choir=0.3, att=1.6)
    S.melody(at('f14', 1.0), [(67, 2), (71, 2), (74, 3), (None, 1), (72, 2), (71, 2), (69, 4)], 0.55, 'piano', gain=0.13)
    S.melody(at('f19'), [(74, 2), (76, 2), (78, 4), (76, 2), (74, 6)], 0.6, 'piano', gain=0.12)
    # ---------------------------------------------------------------- IV. alliances: warmth, then suspicion
    S.pads(at('a01'), at('a05'), ['Em', 'C', 'G', 'D'], 4.2, gain=0.08, bright=1600, octave=3)
    S.arp(at('a01'), at('a05'), ['Em', 'C', 'G', 'D'], 4.2, 0.45, 'piano', gain=0.07, octave=4, pattern=(0, 2, 1, 3), vel=0.5)
    S.ostinato(at('a05'), at('a06'), ['Em', 'Em', 'C', 'D'], 2.2, 0.28, gain=0.08); S.drums(at('a05'), at('a06'), 0.5, 't...t.t.', gain=0.3)
    S.pads(at('a06'), at('a12'), ['G', 'D', 'Em', 'C'], 4.0, gain=0.09, bright=1500, octave=3, choir=0.3)
    S.pads(at('a12'), at('a19'), ['Em', 'Am', 'Em', 'B'], 3.6, gain=0.09, bright=1000, octave=2, bass=0.5)
    S.drums(at('a13'), at('a17'), 0.45, 't...t...t.t.t...', gain=0.28); S.hit(at('a16', 2.5), 0.7, rev=False)
    S.pads(at('a19'), at('a25'), ['Am', 'F', 'C', 'E'], 4.2, gain=0.08, bright=1300, octave=3)
    S.drone(at('a25'), at('g01'), 31, gain=0.2); S.T.add(at('a26', 0.4), M.riser(at('g01') - at('a26', 0.4), 0.5), gain=0.8)
    # ---------------------------------------------------------------- V. the Gamemaker: fire and flood
    S.hit(at('g01'), 1.0); S.drone(at('g01'), at('g08'), 28, gain=0.22)
    S.pads(at('g01'), at('g08'), ['Dm', 'Bb', 'Gm', 'A'], 3.2, gain=0.1, bright=900, octave=2, bass=0.7, choir=0.2)
    S.drums(at('g03'), at('g07'), 0.38, 'T.tk.t.sTtk.t.s', gain=0.38)
    S.hit(at('g07'), 0.9, rev=False)
    S.pads(at('g08'), at('g11'), ['Dm', 'Dm'], 6.0, gain=0.08, bright=800, octave=3, choir=0.4, att=2.0)
    S.arp(at('g11'), at('g15'), ['Dm', 'F', 'C', 'A'], 4.0, 0.5, 'bell', gain=0.06, octave=5, pattern=(0, 2, 1, 2), vel=0.5)
    S.hit(at('g14', 1.0), 0.6, rev=False)
    S.drone(at('g15'), at('x01'), 26, gain=0.24); S.pads(at('g15'), at('x01'), ['Bb', 'Gm', 'Eb', 'F'], 4.5, gain=0.1, bright=1100, octave=2, bass=0.6, choir=0.3, att=2.5)
    S.T.add(at('g16'), M.riser(at('g18') - at('g16'), 0.5), gain=0.7); S.hit(at('g18'), 0.8, rev=False)
    # ---------------------------------------------------------------- VI. the door: ethereal
    S.pads(at('x01'), at('x08'), ['Cmaj7', 'Am7', 'Fmaj7', 'Gsus'], 5.2, gain=0.09, bright=1700, octave=3, choir=0.6, att=2.0)
    S.arp(at('x01'), at('x08'), ['Cmaj7', 'Am7', 'Fmaj7', 'Gsus'], 5.2, 0.7, 'bell', gain=0.06, octave=5, pattern=(0, 1, 2, 3), vel=0.45)
    S.T.add(at('x07', 1.5), M.riser(at('x08') - at('x07', 1.5), 0.6), gain=0.8); S.hit(at('x08'), 1.1, rev=False)
    S.pads(at('x08'), at('x10'), ['C', 'G', 'Am'], 4.0, gain=0.12, bright=3000, octave=3, choir=1.0, att=1.2)
    S.hit(at('x11'), 0.9, rev=False); S.pads(at('x11'), at('x14'), ['Am', 'Em'], 6.0, gain=0.08, bright=900, octave=3, choir=0.3, att=2)
    S.ostinato(at('x14'), at('t01'), ['Em', 'Em', 'C', 'D'], 2.4, 0.26, gain=0.08); S.drums(at('x15'), at('t01'), 0.5, 't.t.t.tkt.t.s.t.', gain=0.34)
    # ---------------------------------------------------------------- VII. the fort: war drums
    S.pads(at('t01'), at('t03c'), ['Em', 'C', 'Am', 'B'], 3.4, gain=0.09, bright=1100, octave=2, bass=0.7)
    S.drums(at('t03'), at('t03c'), 0.42, 't...t.t.t...t.t.', gain=0.3)
    S.melody(at('t03c'), [(64, 3), (67, 3), (71, 6), (69, 3), (67, 3), (64, 6)], 0.6, 'piano', gain=0.13)
    S.drums(at('t05'), at('t07'), 0.36, 'T.tk.t.sTtk.t.s', gain=0.38); S.pads(at('t05'), at('t08'), ['Em', 'C', 'G', 'D'], 2.4, gain=0.1, bright=1300, octave=2, bass=0.6)
    S.pads(at('t07', 0.5), at('t09'), ['Am', 'F', 'Dm'], 5.0, gain=0.1, bright=1000, octave=3, choir=0.5, att=1.8)
    S.melody(at('t07', 1.0), [(69, 3), (67, 3), (64, 6), (62, 3), (60, 9)], 0.6, 'piano', gain=0.14)
    S.drone(at('t09'), at('t14'), 29, gain=0.2); S.pads(at('t10'), at('t14'), ['Dm', 'Bb', 'Dm', 'A'], 3.6, gain=0.08, bright=800, octave=2, bass=0.5)
    S.drums(at('t14', 1.0), at('t16', 6), 0.34, 'T.tk.t.sTtkTt.s', gain=0.42); S.hit(at('t16', 5.0), 1.0, rev=False)
    S.pads(at('t17'), at('l01'), ['Am', 'F', 'Dm', 'Am'], 6.0, gain=0.09, bright=800, octave=3, choir=0.5, att=2.5)
    # ---------------------------------------------------------------- VIII. the last six: sparse, sad
    S.pads(at('l01'), at('l17'), ['Am', 'F', 'C', 'G'], 5.0, gain=0.07, bright=900, octave=3, choir=0.35, att=2.2)
    S.melody(at('l01', 1.0), [(69, 4), (72, 4), (76, 6), (74, 4), (72, 4), (69, 8)], 0.55, 'piano', gain=0.12)
    S.melody(at('l05', 0.5), [(76, 3), (74, 3), (72, 6), (69, 3), (67, 3), (64, 9)], 0.55, 'piano', gain=0.13)
    S.melody(at('l10'), [(72, 4), (71, 4), (69, 8), (67, 4), (64, 8)], 0.6, 'piano', gain=0.12)
    S.drone(at('l17'), at('w01'), 31, gain=0.2); S.drums(at('l17'), at('l19'), 0.8, 't...............', gain=0.3)
    S.pads(at('l20'), at('w01'), ['C', 'Am', 'F', 'G'], 4.6, gain=0.09, bright=1400, octave=3, choir=0.4, att=1.6)
    S.melody(at('l20', 1.0), [(72, 3), (74, 3), (76, 6), (74, 3), (72, 9)], 0.6, 'piano', gain=0.12)
    # ---------------------------------------------------------------- IX. day 100
    S.ostinato(at('w01'), at('w10'), ['Am', 'Am', 'F', 'E'], 2.2, 0.26, gain=0.09); S.pads(at('w01'), at('w10'), ['Am', 'F', 'C', 'E'], 4.4, gain=0.1, bright=1500, octave=2, bass=0.7, choir=0.3)
    S.drums(at('w01'), at('w07'), 0.55, 't...t...t.t.t...', gain=0.3); S.drums(at('w07'), at('w09'), 0.34, 'T.tk.t.sTtkTt.s', gain=0.45)
    S.drone(at('w09c'), at('w10'), 28, gain=0.22); S.T.add(at('w09c', 3.0), M.riser(at('w10') - at('w09c', 3.0), 0.6), gain=0.8)
    S.hit(at('w10'), 1.1, rev=False); S.hit(at('w11'), 0.9, rev=False)
    S.pads(at('w12'), at('e01'), ['Am', 'F', 'C', 'G'], 5.0, gain=0.09, bright=1300, octave=3, choir=0.6, att=2.0)
    S.melody(at('w13'), [(69, 4), (72, 4), (76, 8), (74, 4), (72, 8)], 0.6, 'piano', gain=0.13)
    # ---------------------------------------------------------------- epilogue: hope
    S.pads(at('e01'), at('e15', 3.4), ['C', 'G', 'Am', 'F'], 4.6, gain=0.1, bright=2000, octave=3, choir=0.8, att=1.6)
    S.arp(at('e04'), at('e15', 3.4), ['C', 'G', 'Am', 'F'], 4.6, 0.5, 'bell', gain=0.06, octave=5, pattern=(0, 1, 2, 3, 2, 1), vel=0.45)
    S.T.add(at('e04', 4.2), M.riser(at('e05') - at('e04', 4.2) + 0.2, 0.5), gain=0.7); S.hit(at('e05'), 1.0, rev=False)
    S.melody(at('e06'), [(72, 4), (74, 4), (76, 4), (79, 8), (77, 4), (76, 4), (74, 4), (72, 8)], 0.6, 'piano', gain=0.15)
    S.melody(at('e09'), [(79, 3), (81, 3), (84, 8)], 0.6, 'piano', gain=0.13)
    S.pads(at('e14'), at('e15', 3.4), ['F', 'C', 'G', 'C'], 4.0, gain=0.11, bright=2400, octave=3, choir=1.0, att=1.4)
    return S.T


def main():
    tl = json.load(open(os.path.join(HERE, "timeline.json")))
    T = compose_hg(tl)
    L, R = M.apply_reverb(T.L.astype(np.float64), T.R.astype(np.float64))
    L, R = M.highpass(L, 28), M.highpass(R, 28)
    pk = max(np.abs(L).max(), np.abs(R).max()); L, R = L / pk * 0.89, R / pk * 0.89
    n = int(tl["total"] * SR)
    os.makedirs(os.path.join(SCRATCH, "audio"), exist_ok=True)
    sf.write(os.path.join(SCRATCH, "audio", "music.wav"), np.stack([L[:n], R[:n]], 1).astype(np.float32), SR, subtype="FLOAT")
    print("music.wav", n / SR, "s")


if __name__ == "__main__":
    main()
