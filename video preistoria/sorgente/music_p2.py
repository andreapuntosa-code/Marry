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
    # ---------------------------------------------------------------- recap: warm memory, then the title hits
    S.pads(0.4, at('p12'), ['C', 'Am', 'F', 'G'], 4.0, gain=0.08, bright=1700, octave=3, choir=0.25, att=1.4)
    S.arp(at('p02'), at('p12'), ['C', 'Am', 'F', 'G'], 4.0, 0.4, 'pluck', gain=0.05, octave=4, pattern=(0, 1, 2, 1, 3, 2), vel=0.5)
    S.drone(at('p11'), at('title') + 0.3, 31, gain=0.16); S.T.add(at('p12', 1.0), M.riser(at('title') - at('p12', 1.0) + 0.1, 0.5), gain=0.7)
    S.hit(at('title', 0.05), 1.1, rev=False)
    # ---------------------------------------------------------------- I. the comment: playful, curious, then awe
    S.pads(at('chap:i01'), at('i08'), ['F', 'Dm', 'Bb', 'C'], 4.0, gain=0.08, bright=1700, octave=3)
    S.arp(at('chap:i01'), at('i08'), ['F', 'Dm', 'Bb', 'C'], 4.0, 0.4, 'pluck', gain=0.06, octave=4, pattern=(0, 1, 2, 1, 3, 2), vel=0.5)
    S.drone(at('i08'), at('i10'), 29, gain=0.14); S.T.add(at('i09'), M.riser(at('i10') - at('i09') + 0.3, 0.5), gain=0.7)
    S.hit(at('i10'), 1.0, rev=False)
    S.melody(at('i11', 0.3), [(65, 2), (None, 1), (65, 1), (67, 4)], 0.5, 'piano', gain=0.12)
    S.pads(at('i13'), at('i16'), ['Dm', 'Bb', 'Gm', 'A'], 3.6, gain=0.08, bright=1100, octave=3, choir=0.3)
    S.drone(at('i15'), at('i17'), 26, gain=0.18)
    S.pads(at('i16'), at('b01'), ['Am', 'Fmaj7', 'Dm', 'E'], 4.5, gain=0.09, bright=1200, octave=3, choir=0.5, att=1.8)
    S.arp(at('i17'), at('b01'), ['Am', 'Fmaj7', 'Dm', 'E'], 4.5, 0.5, 'bell', gain=0.06, octave=5, pattern=(0, 2, 1, 3), vel=0.5)
    S.hit(at('i22'), 0.9); S.T.add(at('i22', 1.5), M.riser(at('b01') - at('i22', 1.5), 0.45), gain=0.7)
    # ---------------------------------------------------------------- II. Bingus: everybody has a theory (comic chaos)
    S.ostinato(at('chap:b01'), at('b05'), ['G', 'G', 'C', 'D'], 2.4, 0.3, gain=0.06); S.pads(at('chap:b01'), at('b05'), ['G', 'C', 'G', 'D'], 3.6, gain=0.08, bright=1800, octave=3)
    S.arp(at('b05'), at('b15'), ['C', 'G', 'Am', 'F'], 3.2, 0.3, 'pluck', gain=0.06, octave=4, pattern=(0, 2, 1, 3, 2, 1), vel=0.55)
    S.drums(at('b06'), at('b15'), 0.4, 't.xk.xs.t.xk.xs.', gain=0.2)
    S.hit(at('b15', 0.2), 0.6, rev=False)
    S.pads(at('b16'), at('b18'), ['Am', 'F', 'C', 'G'], 4.0, gain=0.08, bright=1200, octave=3, choir=0.3)
    S.ostinato(at('b18'), at('b21'), ['Em', 'Em', 'C', 'D'], 2.0, 0.25, gain=0.09); S.drums(at('b18'), at('b21'), 0.36, 't.tk.t.sTtk.t.s', gain=0.32)
    S.hit(at('b20c'), 0.7, rev=False)
    S.pads(at('b21'), at('b30'), ['Dm', 'Bb', 'F', 'C'], 4.4, gain=0.09, bright=1300, octave=3, choir=0.4, att=1.6)
    S.melody(at('b21b', 0.5), [(69, 3), (72, 3), (74, 6), (72, 3), (69, 9)], 0.55, 'piano', gain=0.12)
    S.melody(at('b25'), [(65, 3), (69, 3), (72, 6), (70, 3), (69, 9)], 0.55, 'piano', gain=0.12)
    S.drone(at('b28'), at('l01'), 28, gain=0.18); S.T.add(at('b29'), M.riser(at('l01') - at('b29'), 0.5), gain=0.8)
    # ---------------------------------------------------------------- III. the Ladder: industry, rails, ambition
    S.hit(at('chap:l01', 2.4), 0.9, rev=False)
    S.pads(at('l01'), at('l07'), ['D', 'Bm', 'G', 'A'], 3.6, gain=0.08, bright=1900, octave=3)
    S.arp(at('l01'), at('l07'), ['D', 'Bm', 'G', 'A'], 3.6, 0.3, 'pluck', gain=0.07, octave=4, pattern=(0, 1, 2, 3, 2, 1), vel=0.55)
    S.drums(at('l05'), at('l12'), 0.34, 't.xk.xs.t.xk.xs.', gain=0.3)
    S.ostinato(at('l07'), at('l12'), ['Bm', 'G', 'D', 'A'], 2.4, 0.28, gain=0.1)
    S.pads(at('l07'), at('l12'), ['Bm', 'G', 'D', 'A'], 2.4, gain=0.09, bright=1500, octave=2, bass=0.6)
    S.hit(at('l09'), 0.8, rev=False)
    S.pads(at('l12'), at('l14'), ['Em', 'C', 'Am', 'B'], 3.4, gain=0.09, bright=1000, octave=2, bass=0.6, choir=0.3)
    S.drums(at('l12'), at('l14'), 0.4, 'T.tk.t.sTtk.t.s', gain=0.34)
    S.pads(at('l14b'), at('l17'), ['G', 'D', 'Em', 'C'], 4.0, gain=0.09, bright=1600, octave=3, choir=0.4)
    S.melody(at('l15'), [(67, 3), (71, 3), (74, 6), (72, 3), (71, 3), (67, 6)], 0.55, 'piano', gain=0.13)
    S.T.add(at('l16b'), M.riser(at('l17') - at('l16b') + 0.2, 0.5), gain=0.8); S.hit(at('l17'), 1.0, rev=False)
    S.pads(at('l17'), at('l20'), ['D', 'A', 'Bm', 'G'], 4.4, gain=0.1, bright=2100, octave=3, choir=0.7, att=1.4)
    S.drums(at('l17'), at('l20'), 0.38, 't.t.t.tkt.t.s.t.', gain=0.28)
    S.pads(at('l20'), at('s01'), ['Em', 'Bm'], 6.0, gain=0.08, bright=900, octave=3, choir=0.3, att=2.0)
    # ---------------------------------------------------------------- IV. the little ones: tender, then the vote
    S.pads(at('chap:s01'), at('s07'), ['C', 'G', 'Am', 'F'], 4.6, gain=0.08, bright=1600, octave=3, choir=0.3, att=1.8)
    S.melody(at('s01', 1.0), [(72, 3), (76, 3), (79, 6), (76, 3), (72, 9)], 0.55, 'piano', gain=0.12)
    S.arp(at('s03'), at('s08'), ['C', 'G', 'Am', 'F'], 4.6, 0.55, 'bell', gain=0.05, octave=5, pattern=(0, 2, 1, 3), vel=0.45)
    S.pads(at('s08'), at('s16'), ['Am', 'F', 'C', 'E'], 4.2, gain=0.08, bright=1300, octave=3, choir=0.3)
    S.melody(at('s08b', 0.5), [(69, 3), (72, 3), (76, 6), (74, 3), (72, 9)], 0.55, 'piano', gain=0.12)
    S.pads(at('s16'), at('s19'), ['Dm', 'Bb', 'Gm', 'A'], 3.2, gain=0.09, bright=900, octave=2, bass=0.6, choir=0.3)
    S.drone(at('s16'), at('s19'), 28, gain=0.18); S.hit(at('s17', 1.8), 0.6, rev=False)
    S.pads(at('s19'), at('s24'), ['F', 'C', 'Dm', 'Bb'], 4.4, gain=0.09, bright=1500, octave=3, choir=0.5, att=1.6)
    S.melody(at('s21'), [(65, 3), (69, 3), (72, 6), (70, 3), (69, 9)], 0.55, 'piano', gain=0.12)
    S.T.add(at('s24'), M.riser(at('e01') - at('s24') + 0.2, 0.5), gain=0.8)
    # ---------------------------------------------------------------- V. the edge: ascent, stars, the screen, the question
    S.hit(at('e01'), 1.0, rev=False)
    S.pads(at('e01'), at('e04'), ['C', 'G', 'Am', 'F'], 4.4, gain=0.1, bright=2100, octave=3, choir=0.7, att=1.6)
    S.arp(at('e02'), at('e04'), ['C', 'G', 'Am', 'F'], 4.4, 0.4, 'pluck', gain=0.06, octave=4, pattern=(0, 1, 2, 3, 2, 1), vel=0.55)
    S.drums(at('e03b'), at('e04'), 0.4, 't.t.t.tkt.t.s.t.', gain=0.2)
    S.pads(at('e04'), at('e05'), ['Am', 'Fmaj7'], 6.0, gain=0.09, bright=900, octave=3, choir=0.6, att=2.0)
    S.arp(at('e04b'), at('e05'), ['Am', 'Fmaj7', 'Dm', 'E'], 5.0, 0.7, 'bell', gain=0.05, octave=5, pattern=(0, 1, 2, 3), vel=0.45)
    S.T.add(at('e04b', 8.0), M.riser(at('e05') - at('e04b', 8.0), 0.5), gain=0.7)
    S.hit(at('e05'), 0.9, rev=False); S.drone(at('e05'), at('e09'), 30, gain=0.16)
    S.pads(at('e07'), at('e09'), ['Dm', 'Bb'], 3.2, gain=0.09, bright=900, octave=2, bass=0.6)
    S.T.add(at('e08', 2.2), M.riser(at('e09') - at('e08', 2.2), 0.5), gain=0.8); S.hit(at('e09'), 1.2, rev=False)
    S.pads(at('e10'), at('e14'), ['C', 'Am7', 'Fmaj7', 'Gsus'], 4.0, gain=0.1, bright=3000, octave=3, choir=1.0, att=1.2)
    S.arp(at('e11'), at('e14'), ['C', 'Am7', 'Fmaj7', 'Gsus'], 4.0, 0.5, 'bell', gain=0.06, octave=5, pattern=(0, 1, 2, 3), vel=0.5)
    S.hit(at('e13', 1.2), 0.9, rev=False)
    S.pads(at('e15'), at('e17'), ['Am', 'F'], 7.0, gain=0.05, bright=700, octave=3, choir=0.3, att=2.5)       # silence, wind: the music nearly stops
    S.pads(at('e17'), at('e19'), ['F', 'C', 'Dm', 'Am'], 4.4, gain=0.09, bright=1500, octave=3, choir=0.5, att=1.6)
    S.melody(at('e17', 2.0), [(72, 3), (74, 3), (76, 6), (74, 3), (72, 9)], 0.55, 'piano', gain=0.13)
    S.drone(at('e19'), at('e21'), 28, gain=0.14)
    S.melody(at('e19d'), [(76, 2), (None, 2), (74, 2), (None, 2), (72, 4)], 0.55, 'piano', gain=0.09)
    S.pads(at('e20'), at('e22'), ['C', 'G', 'Am', 'Em'], 4.0, gain=0.11, bright=2400, octave=3, choir=1.0, att=1.2)
    S.hit(at('e21'), 0.9, rev=False)
    S.pads(at('e22'), at('e26'), ['Am', 'F', 'C', 'G'], 4.6, gain=0.09, bright=1300, octave=3, choir=0.4)
    S.melody(at('e22', 0.6), [(69, 3), (72, 3), (76, 6), (74, 3), (72, 9)], 0.55, 'piano', gain=0.12)
    S.drone(at('e25'), at('e27'), 29, gain=0.2); S.hit(at('e26'), 1.0, rev=False)
    S.hit(at('e27'), 0.8, rev=False)
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
    os.makedirs(os.path.join(SCRATCH, "audio_p2"), exist_ok=True)
    sf.write(os.path.join(SCRATCH, "audio_p2", "music.wav"), np.stack([L[:n], R[:n]], 1).astype(np.float32), SR, subtype="FLOAT")
    print("music.wav", n / SR, "s")


if __name__ == "__main__":
    main()
