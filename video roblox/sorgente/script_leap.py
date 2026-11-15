# -*- coding: utf-8 -*-
"""
"What if we deleted leap years?" -- Roblox What-if.
Checked: tropical year = 365.2422 days. A 365-day calendar drifts ~0.2422 days (~5.8 h) a year against the seasons:
~24 days per century, ~97 days in 400 years (the March equinox would fall in late June), ~half a year in ~750 years
(Christmas in northern summer). Leap day = 29 February.
"""


def N(i, text, pause=0.2):
    return {"id": i, "text": text, "tts": text, "pause": pause}


SEGMENTS = [
    N("Y01", "What if we deleted leap years?", 0.3),
    N("Y02", "A year isn't three hundred sixty-five days. It's three hundred sixty-five, and almost a quarter.", 0.25),
    N("Y03", "That's why every four years, February gets an extra day."),
    N("Y04", "Delete it, and the calendar slips almost six hours every year.", 0.25),
    N("Y05", "In a hundred years, the seasons are twenty-four days off."),
    N("Y06", "In four hundred years, spring starts at the end of June.", 0.25),
    N("Y07", "In about seven hundred and fifty years... Christmas in the middle of summer.", 0.3),
    N("Y08", "School years, harvests, holidays... all in the wrong season."),
    N("Y09", "And people born on February twenty-ninth? They'd never have a birthday again.", 0.3),
    N("Y10", "A quarter of a day... holding all our seasons in place.", 1.2),
]
