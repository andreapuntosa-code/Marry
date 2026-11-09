# -*- coding: utf-8 -*-
"""
"What if Earth wasn't tilted?" -- Roblox What-if in the viral format (23.5 degrees, a fact that sounds wrong).
Checked: obliquity 23.44 deg causes the seasons; perihelion is in early January (147.1 vs 152.1 million km).
With 0 deg tilt: day and night 12 h everywhere, every day (the Sun stays on the equator's sky); at the poles the
Sun circles along the horizon forever. No seasons (only a tiny ~7% swing from the orbit's shape, the same in both
hemispheres). High latitudes lose their summer sunshine -> snow stops melting; low obliquity is one of the orbital
conditions linked to the start of ice ages (Milankovitch cycles).
"""


def N(i, text, pause=0.2):
    return {"id": i, "text": text, "tts": text, "pause": pause}


SEGMENTS = [
    N("T01", "What if Earth wasn't tilted?", 0.3),
    N("T02", "Right now it leans twenty-three and a half degrees. That's the real reason we have seasons.", 0.25),
    N("T03", "Not distance. In January, Earth is actually closest to the Sun.", 0.3),
    N("T04", "Stand it up straight, and every place on Earth gets twelve hours of day and twelve of night. Every single day."),
    N("T05", "No summer. No winter. The same weather, all year long.", 0.25),
    N("T06", "At the poles, the Sun would just roll along the horizon. Forever.", 0.25),
    N("T07", "Up north, crops that need a hot summer would stop growing."),
    N("T08", "And the snow at the poles would never get a summer to melt it.", 0.2),
    N("T09", "Every year, the ice grows a little more. And a little more.", 0.3),
    N("T10", "Less tilt is exactly how ice ages begin.", 1.2),
]
