# -*- coding: utf-8 -*-
"""v2 look test: the opening of an original mystery (the midnight library)."""


def N(i, text, pause=0.3):
    return {"id": i, "text": text, "tts": text, "pause": pause}


SEGMENTS = [
    N("T01", "Every night at midnight, the old library opens a door that wasn't there before."),
    N("T02", "Tonight, I went in."),
    N("T03", "The potion maker told me one thing. Never read the last page."),
    N("T04", "Of course... I read it.", 1.0),
]
