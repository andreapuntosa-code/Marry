# -*- coding: utf-8 -*-
"""Original procedural score for Part 2 (no samples): built from the film's own synthesizer."""
import os, json
import numpy as np
import soundfile as sf
import music as M
from music import Score, SR

HERE = os.path.dirname(os.path.abspath(__file__))
SCRATCH = os.environ.get("SCRATCH", "/tmp/claude-0/-home-user-Marry/e61fd834-a8c5-5cc5-8204-6c637a41951f/scratchpad")


def compose_p2(tl):
    S = Score(tl); at = S.at
    # ---------------------------------------------------------------- intro: a cold, mysterious question
    S.drone(0, at('p08') + 2, 31, gain=0.18)
    S.pads(0.4, at('p08'), ['Am', 'Fmaj7', 'Am', 'Em'], 5.0, gain=0.08, bright=1100, octave=3, choir=0.3, att=1.8)
    S.arp(at('p03'), at('p08'), ['Am', 'F', 'C', 'G'], 4.0, 0.5, 'bell', gain=0.05, octave=4, pattern=(0, 2, 1, 2), vel=0.5)
    S.T.add(at('p07'), M.riser(at('p08') - at('p07') + 2.5, 0.5), gain=0.7); S.hit(tl['events'][0]['start'] + 0.05, 1.1, rev=False)
    # ---------------------------------------------------------------- I. wake up
    S.pads(at('chap:a01'), at('a10'), ['Dm', 'Bb', 'Gm', 'A'], 4.4, gain=0.08, bright=1200, octave=3, choir=0.2)
    S.melody(at('a07', 0.5), [(62, 2), (65, 2), (69, 4)], 0.5, 'piano', gain=0.08)
    S.drone(at('a10'), at('a16'), 27, gain=0.2)
    k = at('a10')
    while k < at('a15'): S.T.add(k, M.timpani(48, 0.3 + 0.4 * (k - at('a10')) / (at('a15') - at('a10'))), gain=0.5); k += 0.8 - 0.3 * (k - at('a10')) / (at('a15') - at('a10'))
    S.hit(at('a13'), 0.9, rev=False); S.drums(at('a15'), at('a16'), 0.3, 'T.tk.t.sTtk.t.s', gain=0.4)
    S.pads(at('a16'), at('f01'), ['Am', 'F', 'Dm', 'E'], 5.0, gain=0.08, bright=900, octave=3, choir=0.4, att=2.0)
    S.melody(at('a16', 1.0), [(69, 4), (67, 4), (64, 8)], 0.55, 'piano', gain=0.1)
    # ---------------------------------------------------------------- II. fire
    S.pads(at('chap:f01'), at('f03'), ['Am', 'Em', 'Am', 'G'], 5.0, gain=0.06, bright=800, octave=3, choir=0.2)
    S.hit(at('f03', 1.2), 1.0, rev=False); S.drone(at('f03'), at('f05'), 29, gain=0.16)
    S.pads(at('f05'), at('f10b'), ['F', 'C', 'Dm', 'Bb'], 4.4, gain=0.09, bright=1500, octave=3, choir=0.4, att=1.6)
    S.melody(at('f07'), [(65, 3), (69, 3), (72, 6), (70, 3), (69, 3), (65, 6)], 0.55, 'piano', gain=0.12)
    S.arp(at('f10b'), at('f14'), ['F', 'C', 'Gm', 'Bb'], 3.2, 0.3, 'pluck', gain=0.07, octave=4, pattern=(0, 1, 2, 3, 2, 1), vel=0.55)
    S.drums(at('f10b'), at('f13e'), 0.4, 't.xk.xs.t.xk.xs.', gain=0.14)
    S.pads(at('f14'), at('m01'), ['F', 'C', 'Dm', 'Bb'], 4.6, gain=0.1, bright=1800, octave=3, choir=0.8, att=1.4)
    S.melody(at('f17'), [(72, 3), (77, 3), (81, 8)], 0.6, 'piano', gain=0.12)
    # ---------------------------------------------------------------- III. the mammoth
    S.pads(at('chap:m01'), at('m03'), ['Dm', 'Bb', 'F', 'C'], 4.0, gain=0.08, bright=1300, octave=3)
    S.arp(at('m03'), at('m07'), ['Dm', 'Bb', 'F', 'C'], 3.6, 0.3, 'pluck', gain=0.07, octave=4, pattern=(0, 2, 1, 3, 2, 1), vel=0.55)
    S.drums(at('m04'), at('m09'), 0.38, 't.xk.xs.t.xk.xs.', gain=0.24); S.hit(at('m08'), 0.9, rev=False)
    S.drone(at('m09b'), at('m10'), 28, gain=0.2); S.pads(at('m09b'), at('m10'), ['Gm', 'Eb'], 5.0, gain=0.07, bright=800, octave=2, bass=0.6)
    S.pads(at('m10'), at('m13'), ['Am', 'F', 'Dm', 'E'], 3.6, gain=0.08, bright=1100, octave=3, choir=0.3)
    S.ostinato(at('m12'), at('m14'), ['Dm', 'Dm', 'Bb', 'C'], 2.4, 0.3, gain=0.07)
    S.drums(at('m13'), at('m14'), 0.4, 'T.tk.t.sTtk.t.s', gain=0.3); S.hit(at('m14', 1.8), 1.0, rev=False)
    S.pads(at('m14', 2.5), at('w01'), ['C', 'G', 'Am', 'F'], 4.0, gain=0.1, bright=2000, octave=3, choir=0.5)
    S.arp(at('m15'), at('w01'), ['C', 'G', 'Am', 'F'], 4.0, 0.3, 'pluck', gain=0.07, octave=4, pattern=(0, 1, 2, 3, 2, 1), vel=0.6)
    S.drums(at('m17'), at('w01'), 0.4, 't.t.t.tkt.t.s.t.', gain=0.2)
    S.melody(at('m18'), [(72, 3), (76, 3), (79, 6)], 0.55, 'piano', gain=0.12)
    # ---------------------------------------------------------------- IV. the long winter
    S.drone(at('chap:w01'), at('w09'), 26, gain=0.2); S.pads(at('chap:w01'), at('w14'), ['Am', 'Em', 'F', 'E'], 5.0, gain=0.07, bright=800, octave=3, choir=0.3, att=2.0)
    S.melody(at('w09', 1.0), [(67, 3), (69, 3), (72, 6), (69, 9)], 0.55, 'piano', gain=0.1)
    S.pads(at('w13'), at('w19'), ['F', 'C', 'Dm', 'C'], 4.8, gain=0.1, bright=1400, octave=3, choir=0.6, att=1.8)
    S.melody(at('w14', 0.5), [(72, 4), (76, 4), (79, 8), (77, 4), (76, 8)], 0.6, 'piano', gain=0.14)
    S.hit(at('w16'), 0.6, rev=False)
    S.pads(at('w19'), at('s01'), ['C', 'G', 'Am', 'F'], 4.4, gain=0.1, bright=2000, octave=3, choir=0.7, att=1.4)
    # ---------------------------------------------------------------- V. the split
    S.pads(at('chap:s01'), at('s05'), ['G', 'D', 'Em', 'C'], 4.0, gain=0.08, bright=1600, octave=3)
    S.arp(at('s02'), at('s05'), ['G', 'D', 'Em', 'C'], 4.0, 0.4, 'pluck', gain=0.06, octave=4, pattern=(0, 1, 2, 1), vel=0.5)
    S.drone(at('s05'), at('s13'), 29, gain=0.18); S.pads(at('s05'), at('s13'), ['Em', 'C', 'Am', 'B'], 3.4, gain=0.09, bright=1000, octave=2, bass=0.6)
    S.drums(at('s07'), at('s13'), 0.45, 't...t.t.t...t.t.', gain=0.3)
    S.hit(at('s13'), 1.0, rev=False)
    S.pads(at('s13'), at('y01'), ['Am', 'F', 'Dm', 'Am'], 6.0, gain=0.09, bright=900, octave=3, choir=0.6, att=2.0)
    S.melody(at('s14'), [(69, 4), (67, 4), (64, 8)], 0.55, 'piano', gain=0.13)
    # ---------------------------------------------------------------- VI. ten thousand years
    S.T.add(at('y01', 0.0), M.riser(3.0, 0.5), gain=0.7)
    S.ostinato(at('y01'), at('y08'), ['Em', 'Em', 'C', 'D'], 2.0, 0.26, gain=0.1); S.pads(at('y01'), at('y08'), ['Em', 'C', 'G', 'D'], 3.2, gain=0.09, bright=1500, octave=2, bass=0.6)
    S.drums(at('y02'), at('y08'), 0.34, 'T.tk.t.sTtkTt.s', gain=0.34)
    S.hit(at('y05'), 0.6, rev=False)
    S.pads(at('y08'), at('y13'), ['Dm', 'Bb', 'F', 'C'], 5.0, gain=0.09, bright=1500, octave=3, choir=0.7, att=1.8)
    S.arp(at('y08'), at('y13'), ['Dm', 'Bb', 'F', 'C'], 5.0, 0.7, 'bell', gain=0.06, octave=5, pattern=(0, 1, 2, 3), vel=0.45)
    S.melody(at('y09'), [(69, 3), (72, 3), (74, 6), (72, 3), (69, 9)], 0.55, 'piano', gain=0.12)
    S.pads(at('y13'), at('y17'), ['Am', 'F', 'C', 'G'], 4.4, gain=0.1, bright=1700, octave=3, choir=0.6, att=1.6)
    S.drums(at('y13'), at('y15'), 0.4, 't.t.t.tkt.t.s.t.', gain=0.22)
    S.melody(at('y15'), [(72, 3), (76, 3), (79, 8)], 0.55, 'piano', gain=0.12)
    S.pads(at('y17'), at('r01'), ['Am', 'Em', 'F', 'C'], 5.0, gain=0.09, bright=1100, octave=3, choir=0.5, att=2.0)
    S.drone(at('y21'), at('r01'), 28, gain=0.16); S.hit(at('y21'), 0.7, rev=False)
    # ---------------------------------------------------------------- VII. the meeting
    S.pads(at('chap:r01'), at('r08'), ['C', 'G', 'Am', 'F'], 4.6, gain=0.09, bright=1800, octave=3, choir=0.5, att=1.6)
    S.arp(at('r02'), at('r08'), ['C', 'G', 'Am', 'F'], 4.6, 0.4, 'pluck', gain=0.06, octave=4, pattern=(0, 1, 2, 3), vel=0.5)
    S.drone(at('r08'), at('r12'), 29, gain=0.16); S.hit(at('r09'), 0.7, rev=False)
    S.pads(at('r12'), at('r15'), ['Am', 'F', 'C', 'E'], 4.0, gain=0.1, bright=1400, octave=3, choir=0.9, att=1.2)
    S.T.add(at('r15'), M.riser(at('r17') - at('r15') + 0.4, 0.5), gain=0.7); S.hit(at('r17'), 1.0, rev=False)
    S.melody(at('r18'), [(72, 3), (76, 3), (79, 8)], 0.6, 'piano', gain=0.14)
    S.pads(at('r20'), at('r25'), ['C', 'G', 'Am', 'F'], 4.6, gain=0.11, bright=2200, octave=3, choir=1.0, att=1.2)
    S.melody(at('r21'), [(72, 4), (74, 4), (76, 4), (79, 8), (77, 4), (76, 8)], 0.6, 'piano', gain=0.15)
    S.pads(at('r25'), at('r29'), ['Am', 'F', 'C', 'G'], 5.0, gain=0.09, bright=1300, octave=3, choir=0.6)
    S.melody(at('r26'), [(69, 3), (72, 3), (76, 6), (74, 3), (72, 9)], 0.55, 'piano', gain=0.11)
    S.pads(at('outro'), at('end'), ['C', 'G', 'Am', 'F'], 5.0, gain=0.1, bright=1800, octave=3, choir=0.7, att=1.8)
    S.melody(at('outro', 0.5), [(72, 4), (76, 4), (79, 8), (77, 4), (76, 8)], 0.6, 'piano', gain=0.13)
    return S.T


def main():
    tl = json.load(open(os.path.join(HERE, "timeline.json")))
    T = compose_p2(tl)
    L, R = M.apply_reverb(T.L.astype(np.float64), T.R.astype(np.float64))
    L, R = M.highpass(L, 28), M.highpass(R, 28)
    pk = max(np.abs(L).max(), np.abs(R).max()); L, R = L / pk * 0.89, R / pk * 0.89
    n = int(tl["total"] * SR)
    os.makedirs(os.path.join(SCRATCH, "audio_pre"), exist_ok=True)
    sf.write(os.path.join(SCRATCH, "audio_pre", "music.wav"), np.stack([L[:n], R[:n]], 1).astype(np.float32), SR, subtype="FLOAT")
    print("music.wav", n / SR, "s")


if __name__ == "__main__":
    main()
