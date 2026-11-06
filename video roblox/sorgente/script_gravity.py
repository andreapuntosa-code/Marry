# -*- coding: utf-8 -*-
"""
"What if gravity was 10 m/s² instead of 9.81?" -- Roblox-style What-if (narrator + townspeople, no badges, voice only).
Checked numbers (+1.94% gravity, i.e. Earth's pull 1.94% stronger at the same radius):
  70 kg person weighs like 70 x 10 / 9.81 = 71.4 kg; jump height h = v²/2g -> ~2% lower (50 cm -> 49 cm).
  Pendulum clocks: period ∝ 1/sqrt(g) -> run 1 - sqrt(9.81/10) = 0.96% fast = 13.8 min per day.
  ISS (r = 6,771 km): with GM up 1.94% its speed is now too low -> e ≈ 0.019, perigee = r(1-e)/(1+e) ≈ 6,518 km
    -> about 150 km altitude, inside the atmosphere: it starts to fall back. Same for low satellites.
  Moon: the same small eccentricity -> perigee ~3.8% (~15,000 km) closer; stronger tides.
"""


def N(i, text, pause=0.2):
    return {"id": i, "text": text, "tts": text, "pause": pause}


SEGMENTS = [
    N("G01", "What if gravity was exactly ten meters per second squared, instead of nine point eight one?", 0.3),
    N("G02", "That's only two percent stronger. Sounds like nothing.", 0.35),
    N("G03", "First, you'd feel heavier. A seventy kilo person would weigh like seventy-one and a half."),
    N("G04", "Every jump would be a little lower. World records would be just out of reach."),
    N("G05", "Planes would burn more fuel to stay up. And rockets would carry less into space.", 0.3),
    N("G06", "But the real problem would be up there.", 0.35),
    N("G07", "The Space Station would suddenly be too slow for its orbit."),
    N("G08", "It would dip down to about a hundred and fifty kilometers, into the air, and start falling back to Earth.", 0.3),
    N("G09", "Thousands of satellites would follow it."),
    N("G10", "The Moon would swing closer every month, and the tides would get stronger.", 0.3),
    N("G11", "And every pendulum clock on Earth would run fast. Almost fourteen minutes a day.", 1.0),
]
