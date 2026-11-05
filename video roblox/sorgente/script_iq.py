# -*- coding: utf-8 -*-
"""
"I woke up with my IQ above my head" -- a Roblox-style story Short (blocky characters, a colourful town, number
badges above every head, one giant word at a time, a calm first-person storyteller).

Segment: id, text, pause. The picture for each line is in web/film_iq.js (shot anchored to the segment id).
"""


def N(i, text, pause=0.18):
    return {"id": i, "text": text, "tts": text, "pause": pause}


SEGMENTS = [
    N("R01", "One morning, I woke up with a number floating above my head."),
    N("R02", "One hundred. It was my IQ."),
    N("R03", "And everyone in town had one."),
    N("R04", "My mom, one hundred twelve."),
    N("R05", "My neighbor... ninety-one."),
    N("R06", "But mine... kept going up.", 0.3),
    N("R07", "At school, I finished the test before the teacher handed it out."),
    N("R08", "At five hundred, I caught every ball without even looking."),
    N("R09", "At one thousand, scientists showed up at my door."),
    N("R10", "I explained dark matter to them. On a napkin.", 0.3),
    N("R11", "At ten thousand, I built a tiny star in the garage. Free power for the whole town."),
    N("R12", "At one million, nobody could understand me anymore."),
    N("R13", "I knew how the universe began. I knew everything.", 0.4),
    N("R14", "Then I looked at my dog.", 0.4),
    N("R15", "His number was higher than mine.", 0.5),
    N("R16", "What number would float above your head? Comment below.", 1.0),
]
