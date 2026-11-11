# -*- coding: utf-8 -*-
"""
"Your pinky looks useless..." -- body series: a part that looks useless, then the catastrophe without it.
Checked: power grip is driven by the ulnar (pinky) side of the hand; hand surgeons commonly say losing the little
finger can cost up to ~50% of grip strength, and the hand can no longer close into a full fist.
"""


def N(i, text, pause=0.2):
    return {"id": i, "text": text, "tts": text, "pause": pause}


SEGMENTS = [
    N("K01", "Your pinky finger looks useless, right?", 0.3),
    N("K02", "Tiny. Weak. You barely use it. So let's get rid of it.", 0.3),
    N("K03", "Surprise. Hand surgeons say your pinky gives you up to half of your grip strength.", 0.3),
    N("K04", "Try making a fist without it. Your hand can't close tight anymore."),
    N("K05", "Phones slip. Cups slip. Opening a jar? Forget it.", 0.25),
    N("K06", "Builders drop their hammers. Drivers can't hold the wheel firmly."),
    N("K07", "Pull-ups, climbing, hanging on to a rope... almost impossible.", 0.3),
    N("K08", "Now imagine everyone on Earth, without their pinkies.", 0.25),
    N("K09", "Ladders. Cranes. Rock climbers. Every single grip, weaker.", 0.3),
    N("K10", "The smallest finger... was holding everything together.", 1.2),
]
