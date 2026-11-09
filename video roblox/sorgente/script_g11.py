# -*- coding: utf-8 -*-
"""
"What if gravity was 11 m/s²?" -- sequel of the viral g = 10 video (same assumption: Earth's pull, GM, +12.1%).
Checked: scale 70 x 11/9.81 = 78.5 kg (bathroom scales measure force); jump 50 cm -> 44.6 cm (-11%);
pendulum clocks run fast by sqrt(11/9.81) - 1 = 5.9% -> 85 min a day.
ISS (r = 6,771 km) keeps its speed -> e = 0.108, perigee 5,449 km (below the surface): it reaches 100 km
altitude ~13 min later. Moon: same e -> perigee ~309,000 km (20% closer); tides at perigee x2.15.
Bridges are designed with large safety factors (well above +12% load).
"""


def N(i, text, pause=0.2):
    return {"id": i, "text": text, "tts": text, "pause": pause}


SEGMENTS = [
    N("H01", "What if gravity was eleven meters per second squared?", 0.3),
    N("H02", "Last time we tried ten. This time, let's push it further.", 0.25),
    N("H03", "A seventy kilo person would see seventy-eight and a half on the scale. And yes, scales measure force, not mass.", 0.3),
    N("H04", "Every jump would be ten percent lower. Stand up too fast, and you'd get dizzy."),
    N("H05", "Pendulum clocks would run fast. Almost an hour and a half every day.", 0.25),
    N("H06", "Most bridges would hold. Engineers build them way stronger than they need to be.", 0.3),
    N("H07", "But up there, it's a disaster. The Space Station would suddenly be way too slow."),
    N("H08", "In about fifteen minutes, it would hit the atmosphere. Thousands of satellites right behind it.", 0.3),
    N("H09", "The Moon would swing twenty percent closer every month. Tides, twice as strong.", 0.3),
    N("H10", "Coastal cities would flood... twice a day.", 1.2),
]
