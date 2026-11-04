# -*- coding: utf-8 -*-
"""
"What if your IQ kept rising forever?" -- cinematic 3D Short (vertical, ~60 s) in the style of the low-poly
"What if" simulation videos: a calm narrator, a serif title, a small "YOUR IQ" counter in the corner, one
italic serif subtitle at a time, wide soft-lit 3D shots of a park where you sit on a picnic blanket while
your IQ climbs and the world reveals what you'd understand.

Numbers (IQ: mean 100, SD 15):
  IQ 160 = +4 SD -> about 1 in 31,600 people ("all but one person in thirty thousand").
  No real test measures far above ~160; the script says that from IQ 250 on it is imagination.
Everything above 250 is clearly framed as imagination (dark matter, aging, fusion, consciousness, the origin of
the universe are real open problems; the video doesn't claim the answers).

Segment: id, text (narration = subtitle), pause, iq (counter target reached during the line).
"""
INF = float("inf")


def N(i, text, pause=0.35, iq=None, sub=None):
    return {"id": i, "text": text, "tts": text, "sub": sub or text, "pause": pause, "iq": iq}


SEGMENTS = [
    N("X01", "What if your IQ kept rising... forever?", 0.6, 100),
    N("X02", "A picnic in the park. Your IQ is one hundred. Perfectly normal.", 0.3, 100),
    N("X03", "Then, it starts to climb.", 0.35, 130),
    N("X04", "At one sixty, you'd be smarter than all but one person in thirty thousand.", 0.3, 160),
    N("X05", "At two fifty, no test could measure you. From here, we can only imagine.", 0.3, 250),
    N("X06", "You'd see patterns everywhere. In the wind, the crowd, the trees.", 0.35, 320),
    N("X07", "At five hundred, you'd look at the night sky... and know what dark matter is.", 0.35, 500),
    N("X08", "At one thousand, aging would look like a typo in your DNA. One you could fix.", 0.35, 1000),
    N("X09", "At ten thousand, you'd build a tiny star in a bottle. Clean energy, forever.", 0.35, 10000),
    N("X10", "At a hundred thousand, you'd finally know what consciousness really is.", 0.35, 100000),
    N("X11", "At one million, you'd see how the universe began... and what came before.", 0.6, 1000000),
    N("X12", "And at infinity... you'd know everything.", 0.9, INF),
    N("X13", "Nothing left to discover. And maybe... that's the loneliest thing of all.", 0.7, INF),
    N("X14", "What would you want to understand first?", 1.6, INF),
]
