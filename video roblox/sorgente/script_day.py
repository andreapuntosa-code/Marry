# -*- coding: utf-8 -*-
"""
"What if Earth spun in exactly 24 hours?" -- Roblox What-if in the viral format: the most famous number of all
(24 h) and a true fact that sounds wrong (one spin = 23 h 56 m 4 s, the sidereal day).
Checked:
  Sidereal day 86,164.1 s; the solar day is ~3 min 56 s longer because Earth also moves along its orbit.
  Spin period 24 h exactly -> 0.27% slower; the solar day becomes ~24 h 4 min -> clocks fall 4 min behind the Sun per
  day: ~28 min a week, ~12 h after ~half a year (if nobody changed the clocks).
  Oceans (short term, solid Earth unchanged): centrifugal potential drops by 1/2 d(w^2) R^2 cos^2(lat) -> sea level
  change = -60 m x (cos^2(lat) - 2/3): equator -20 m, London +17 m, Amsterdam +18 m, St Petersburg +25 m, poles +40 m.
"""


def N(i, text, pause=0.2):
    return {"id": i, "text": text, "tts": text, "pause": pause}


SEGMENTS = [
    N("D01", "What if Earth spun once in exactly twenty-four hours?", 0.3),
    N("D02", "Wait, doesn't it already? Nope. One spin takes twenty-three hours and fifty-six minutes.", 0.25),
    N("D03", "The other four minutes? Earth also moves around the Sun, so it has to turn a little extra to face it again.", 0.25),
    N("D04", "So make it spin in exactly twenty-four hours. Just four minutes slower.", 0.25),
    N("D05", "Every day would run four minutes longer than your clock. In a week, sunrise is half an hour late."),
    N("D06", "Leave the clocks alone, and in six months the Sun is up at midnight.", 0.3),
    N("D07", "But the real problem is the oceans. Earth's spin is what pushes water toward the equator."),
    N("D08", "Slow it down, and the water slides toward the poles.", 0.25),
    N("D09", "At the equator, the sea drops twenty meters. Harbors end up on dry land."),
    N("D10", "Up north, it rises. London and Amsterdam, under seventeen meters of water.", 0.3),
    N("D11", "Four minutes. That's all it would take.", 1.2),
]
