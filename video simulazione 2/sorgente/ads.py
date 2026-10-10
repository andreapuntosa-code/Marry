# -*- coding: utf-8 -*-
"""
Five channel-ad Shorts in five different formats, to test which one performs best:

  A  POV meme       text-only sticker captions over the Bingus story, pop beat          (no voice)
  B  Top 3          countdown listicle with an energetic voice and big #3/#2/#1 badges
  C  Lore           dark cinematic "the Bingus lore", slow deep narrator, serif captions
  D  Evolution      fast beat-synced montage Stone Age -> space, one big word per cut      (no voice)
  E  You decide     interactive call-to-action: "what should they get next?" comment chips

  python3 ads.py A|B|C|D|E      (CHECK=1 for a contact sheet of the clips)   ->  ../../video promo/ad_<x>_*.mp4
All of them end on the real channel card (The Animator, @TheAnimator-j3t). No invented numbers.
"""
import sys, math
import numpy as np
import skia
import promo_kit as K
from promo_kit import OV, P, T, W, H, SR, FPS


def seq(start, items):
    """[(dur, src, t0, opts)] -> shots with absolute times"""
    out, t = [], start
    for d, src, t0, o in items:
        out.append((t, t + d, src, t0, o)); t += d
    return out, t


def split(a, b, clips):
    """spread several clips evenly over [a, b)"""
    n = len(clips); d = (b - a) / n
    return [(a + i * d, a + (i + 1) * d, s, t0, o) for i, (s, t0, o) in enumerate(clips)]


# =====================================================================  A  POV meme
def ad_A():
    beats = [  # (duration, src, t0, opts, sticker text)
        (2.4, "p2", 52.2, {"speed": 0.7, "hold": 1.6}, 'POV: you comment "Bingus" under a video where 20 AIs build a civilization'),
        (2.2, "p2", 140.6, {}, None),
        (2.8, "p2", 263.0, {}, "the AIs:"),
        (2.6, "p2", 226.0, {}, "*spend 100 years arguing about what a Bingus is*"),
        (2.8, "p2", 382.5, {}, "*build a ladder to the sky to find out*"),
        (2.8, "p2", 749.5, {}, "*find a screen full of our comments*"),
        (2.4, "p2", 845.0, {"hold": 2.2}, None),
    ]
    shots, t_end = seq(0.0, [(d, s, t0, o) for d, s, t0, o, _ in beats])
    total = t_end + 3.4
    shots.append((t_end, total, None, 0, {}))
    texts = []
    cur = None
    for (a, b, *_), (_, _, _, _, txt) in zip(shots, beats):
        if txt: cur = [txt, a, b]; texts.append(cur)
        elif cur and cur[0].startswith("POV"): cur[2] = b
    stick = {1: "the AIs:", 2: "the AIs:"}
    def draw(c, rgba, t, k, lt):
        if k == len(shots) - 1:
            K.endcard(rgba, lt, "Comment the next one", "Link in bio"); return
        for txt, a, b in texts:
            if a <= t < b:
                if txt == "the AIs:" or txt.startswith("*"):
                    K.box_text(c, "the AIs:", 420, 62)
                    if txt.startswith("*"): K.box_text(c, txt, 560, 54, bg='#ffffff')
                else:
                    K.box_text(c, txt, 380, 56)
        if 6 <= k <= 6 and lt < 1.8:
            K.big(c, "THEY KNOW.", 1680, 140, 1.0, 1 + 0.2 * max(0, 1 - lt / 0.12), col='#ffffff')
    music = K.bed_pop(total + 1)
    T_ = K.M.Track(total + 2)
    for (a, b, *_ ) in shots[1:]: T_.add(a, mono=K.M.boom(0.35, 60), gain=0.25)
    hits = K.finish_mix(T_, total + 1, 0.05)
    audio = K.mix(music + 0.6 * hits, [], total, music_gain=0.85)
    K.render("ad_A_pov_meme", shots, total, audio, draw)


# =====================================================================  B  Top 3
def ad_B():
    L = [("Three things AIs did on this channel that nobody saw coming.", [("hg", 149.5, {}), ("p1", 676.0, {})]),
         ("Number three.", [("p2", 140.6, {})]),
         ("Someone commented one random word, Bingus, and the AIs turned it into a religion.", [("p2", 263.0, {}), ("p2", 226.0, {})]),
         ("Number two.", [("hg", 31.0, {})]),
         ("A hundred AIs were dropped into an arena. Only one walked out.", [("hg", 547.0, {}), ("hg", 876.0, {}), ("hg", 1156.0, {})]),
         ("Number one.", [("pre", 436.0, {})]),
         ("Twenty AIs in the Stone Age... ended up splitting into two different species.", [("pre", 451.0, {}), ("pre", 766.0, {})]),
         ("It's all on The Animator. Go pick your tribe.", None)]
    voices = K.tts([l for l, _ in L], "am_puck", 1.12)
    starts, t_end = K.place(voices, 0.15, [0.1, 0.05, 0.25, 0.05, 0.25, 0.05, 0.25, 0.1])
    total = t_end + 1.6
    shots = []
    for i, (line, clips) in enumerate(L):
        a = 0.0 if i == 0 else starts[i]; b = starts[i + 1] if i + 1 < len(L) else total
        shots += split(a, b, clips) if clips else [(a, b, None, 0, {})]
    words = [K.word_times(l, s, len(v) / SR) for (l, _), s, v in zip(L, starts, voices)]
    badge = {1: "#3", 3: "#2", 5: "#1"}
    def draw(c, rgba, t, k, lt):
        li = max(i for i, s in enumerate(starts) if t >= s or i == 0)
        if li == len(L) - 1:
            K.endcard(rgba, t - starts[li], "Which tribe would you join?", "Link in bio"); return
        K.box_text(c, "3 THINGS AIs DID THAT NOBODY EXPECTED", 250, 46, maxw=820)
        sec = max([i for i in badge if t >= starts[i]], default=None)
        if sec is not None:
            age = t - starts[sec]
            if li == sec:   # huge badge while "Number X" is said
                K.big(c, badge[sec], 1000, 420, 1.0, 1 + 0.3 * max(0, 1 - age / 0.15), col='#ffd400')
            else:
                K.big(c, badge[sec], 520, 170, 1.0, 1.0, col='#ffd400', rot=-6)
        if li not in badge:
            ws, wt = words[li]; cur = [j for j, x in enumerate(wt) if t >= x]
            if cur and t < starts[li] + len(voices[li]) / SR + 0.2:
                K.pop_word(c, ws[cur[-1]].strip(",.?"), t - wt[cur[-1]])
    audio = K.mix(K.bed_trap(total + 1), list(zip(starts, voices)), total, 0.32)
    K.render("ad_B_top3", shots, total, audio, draw)


# =====================================================================  C  Lore
def ad_C():
    L = [("In the year twenty forty, twenty AIs received one word from the outside world.", [("p2", 52.2, {"speed": 0.42, "hold": 1.45})]),
         ("Bingus.", [("p2", 141.0, {"speed": 0.6})]),
         ("Nobody knew what it meant.", [("p2", 226.0, {"speed": 0.7})]),
         ("So they built temples to it.", [("p2", 263.0, {"speed": 0.7})]),
         ("For a hundred years, they argued about it.", [("p2", 196.0, {"speed": 0.7}), ("p2", 211.0, {"speed": 0.7})]),
         ("Then they built a tower... all the way up to the sky.", [("p2", 382.5, {"speed": 0.7}), ("p2", 541.0, {"speed": 0.7})]),
         ("And at the very top, they found a screen. Full of comments.", [("p2", 749.5, {"speed": 0.7}), ("p2", 773.0, {"speed": 0.7})]),
         ("Ours.", [("p2", 845.0, {"speed": 0.6, "hold": 2.2})]),
         ("They know we're watching.", None)]
    voices = K.tts([l for l, _ in L], "am_onyx", 0.92)
    gaps = [0.5, 0.6, 0.4, 0.4, 0.4, 0.5, 0.7, 0.8, 0.2]
    starts, t_end = K.place(voices, 0.6, gaps)
    total = t_end + 2.2
    shots = []
    for i, (line, clips) in enumerate(L):
        a = 0.0 if i == 0 else starts[i]; b = starts[i + 1] if i + 1 < len(L) else total
        shots += split(a, b, [(s, t0, dict(o, rate=0.03, amp=0.3, nopunch=True)) for s, t0, o in clips]) if clips else [(a, b, None, 0, {})]
    def grade(rgba, t):
        x = rgba[..., :3].astype(np.float32); g = x.mean(2, keepdims=True)
        x = (x * 0.75 + g * 0.25) * np.array([0.92, 0.95, 1.05]) * 0.85
        rgba[..., :3] = np.clip(x, 0, 255).astype(np.uint8); K.vignette(rgba, 0.6)
    def draw(c, rgba, t, k, lt):
        li = max(i for i, s in enumerate(starts) if t >= s or i == 0)
        # dip to black at every cut for a slower, heavier rhythm
        for (a, b, *_ ) in shots[1:]:
            d = abs(t - a)
            if d < 0.2: c.drawRect(skia.Rect(0, 0, W, H), P('#000000', 0.9 * (1 - d / 0.2)))
        if li == len(L) - 1:
            u = t - starts[li]
            K.endcard(rgba, u - 1.4, "They know we're watching.", "The Animator on YouTube", dark=True) if u > 1.4 else None
            if u <= 1.4:
                a = OV.fade_io(u, 0, 1.4, 0.3, 0.3); OV.txt(c, "THEY KNOW WE'RE WATCHING.", W / 2, 1210, 'titolo', 42, '#ffffff', a, 'center', 0.12)
            return
        line = L[li][0]; dur = len(voices[li]) / SR; u = t - starts[li]
        a = OV.fade_io(u, 0, dur + gaps[li] - 0.05, 0.25, 0.3)
        if line in ("Bingus.", "Ours."):
            OV.txt(c, line[:-1].upper(), W / 2, 1020 if line == "Bingus." else 1250, 'titolo_n', 170, '#ffffff', a, 'center', 0.1)
        else:
            for j, ln in enumerate(K.wrap(line.upper(), 'titolo', 50, 900)):
                OV.txt(c, ln, W / 2, 1480 + j * 72, 'titolo', 50, '#f2ead8', a, 'center', 0.06)
    hits = [starts[1], starts[7]]
    audio = K.mix(K.bed_dark(total + 1, hits), list(zip(starts, voices)), total, 0.42, duck=0.35)
    K.render("ad_C_lore", shots, total, audio, draw, grade=grade, punch=False)


# =====================================================================  D  Evolution
def ad_D():
    bpm = 128; b = 60 / bpm; cut = 2 * b
    cuts = [("STONE AGE", "pre", 91.0), ("FIRE", "pre", 166.0), ("MAMMOTHS", "pre", 247.6), ("CAVE ART", "pre", 547.5),
            ("FARMS", "p1", 331.0), ("ANIMALS", "p1", 526.0), ("KINGS", "p1", 1002.0), ("CITIES", "p1", 1101.0), ("WAR", "p1", 990.0),
            ("RELIGION", "p2", 263.0), ("THE SKY", "p2", 382.5), ("SPACE", "p2", 749.5)]
    intro = 8 * b                                   # two bars of build: "20 AIs" / "0 knowledge"
    shots = [(0, 4 * b, "pre", 76.0, {}), (4 * b, intro, "pre", 1.0, {})]
    t = intro
    for _, s, t0 in cuts: shots.append((t, t + cut, s, t0, {})); t += cut
    shots.append((t, t + 4 * b, "p2", 52.6, {"hold": 1.2})); t += 4 * b       # "WHAT'S NEXT?"
    total = t + 3.6
    shots.append((t, total, None, 0, {}))
    def draw(c, rgba, t, k, lt):
        if k == len(shots) - 1:
            K.endcard(rgba, lt, "You decide in the comments", "Link in bio"); return
        pop = 1 + 0.25 * max(0, 1 - lt / 0.1)
        if k == 0: K.big(c, "20 AIs", 980, 200, 1.0, pop)
        elif k == 1: K.big(c, "0 KNOWLEDGE", 980, 150, 1.0, pop)
        elif k == len(shots) - 2: K.big(c, "WHAT'S NEXT?", 980, 150, 1.0, pop, col='#ffd400')
        else:
            K.big(c, cuts[k - 2][0], 980, 170, 1.0, pop)
            # evolution progress bar
            u = (k - 2 + lt / cut) / len(cuts)
            c.drawRoundRect(skia.Rect(140, 1600, 940, 1624), 12, 12, P('#000000', 0.45))
            c.drawRoundRect(skia.Rect(140, 1600, 140 + 800 * u, 1624), 12, 12, P('#ffd400'))
            T(c, "STONE AGE", 140, 1580, 30, '#ffffff', 'corpo_b'); T(c, "SPACE", 940, 1580, 30, '#ffffff', 'corpo_b', align='right')
        if k >= 1: K.box_text(c, "20 AIs evolving from zero", 300, 50)
    audio = K.mix(K.bed_hype(total + 1, intro), [], total, 0.9)
    K.render("ad_D_evolution", shots, total, audio, draw)


# =====================================================================  E  You decide
def ad_E():
    L = [("This is the only YouTube channel where the comments control the story.", [("p1", 142.0, {}), ("p1", 676.0, {})]),
         ("Twenty AIs, building a civilization from nothing.", [("p1", 316.0, {}), ("p1", 361.0, {})]),
         ("And the most liked comment becomes real in the next video.", [("p2", 140.6, {}), ("p2", 263.0, {})]),
         ("So... what should they get next?", [("p2", 52.2, {"speed": 0.6, "hold": 1.6})]),
         ("Money? The internet? A volcano? Or Bingus two?", [("p1", 1100.5, {"speed": 0.8})]),
         ("Comment it on The Animator. If it wins, it happens.", None)]
    voices = K.tts([l for l, _ in L], "af_bella", 1.08)
    starts, t_end = K.place(voices, 0.15, [0.08, 0.08, 0.15, 0.25, 0.3, 0.1])
    total = t_end + 1.8
    shots = []
    for i, (line, clips) in enumerate(L):
        a = 0.0 if i == 0 else starts[i]; b = starts[i + 1] if i + 1 < len(L) else total
        shots += split(a, b, clips) if clips else [(a, b, None, 0, {})]
    words = [K.word_times(l, s, len(v) / SR) for (l, _), s, v in zip(L, starts, voices)]
    opts = [("Money", '#2f9e8a'), ("The internet", '#4b7fd6'), ("A volcano", '#d6574b'), ("Bingus 2", '#7a4bd6')]
    def draw(c, rgba, t, k, lt):
        li = max(i for i, s in enumerate(starts) if t >= s or i == 0)
        if li == len(L) - 1:
            K.endcard(rgba, t - starts[li], "Most liked comment wins", "Link in bio"); return
        K.box_text(c, "YOU control this AI civilization", 250, 50)
        if li >= 4:   # comment chips stack up as she lists them
            ws, wt = words[4]; marks = [wt[0], wt[1], wt[3], wt[6]]
            for j, ((lab, colr), m) in enumerate(zip(opts, marks)):
                if t < m: continue
                u = OV.eo(OV.clamp((t - m) / 0.25)); y = 560 + j * 190; x = 110 - 400 * (1 - u)
                c.drawRoundRect(skia.Rect(x, y, x + 860, y + 150), 30, 30, P('#000000', 0.25 * u, blur=12))
                c.drawRoundRect(skia.Rect(x, y - 6, x + 860, y + 144), 30, 30, P('#ffffff', u))
                c.drawCircle(x + 80, y + 69, 44, P(colr, u)); T(c, lab[0], x + 80, y + 87, 48, '#ffffff', 'corpo_b', u, align='center')
                T(c, "comment", x + 150, y + 52, 26, '#777777', 'corpo_m', u); T(c, lab, x + 150, y + 112, 56, '#111111', 'corpo_b', u)
            return
        ws, wt = words[li]; cur = [j for j, x in enumerate(wt) if t >= x]
        if cur and t < starts[li] + len(voices[li]) / SR + 0.2:
            K.pop_word(c, ws[cur[-1]].strip(",.?"), t - wt[cur[-1]])
        if li == 3 and t > starts[3] + 0.6:
            K.big(c, "?", 900, 400, 1.0, 1.0, col='#ffd400')
    audio = K.mix(K.bed_pop(total + 1, 104, 48), list(zip(starts, voices)), total, 0.28)
    K.render("ad_E_you_decide", shots, total, audio, draw)


if __name__ == "__main__":
    {"A": ad_A, "B": ad_B, "C": ad_C, "D": ad_D, "E": ad_E}[sys.argv[1]]()
