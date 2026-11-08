# -*- coding: utf-8 -*-
"""
"What if pi was exactly 3?" -- Roblox What-if in the format of the viral gravity video (number sign in the first
frame, school number everyone knows, one correct-but-counterintuitive detail for the comments, catastrophic ending).
Checked:
  pizza: 30 cm diameter -> crust 3.1416 x 30 = 94.2 cm; with pi = 3 -> 90 cm.
  On flat (Euclidean) ground circumference/diameter is always 3.14159... A ratio below pi happens on positively
  curved space, e.g. a circle drawn on a ball: C = 2 pi R sin(r/R), d = 2r -> C/d = pi sin(x)/x with x = r/R.
  C/d = 3 needs sin(x)/x = 3/pi, solved exactly by x = pi/6 (sin(pi/6) = 1/2). So R = 6r/pi.
  For a 30 cm pizza (r = 0.15 m): R = 0.286 m -> the "universe" closes after 2 pi R = 1.8 m (less than two metres).
  Light (and you) going straight comes back from behind -> you'd see the back of your own head.
  On a sphere triangle angles add up to more than 180 degrees; "parallel" straight lines (great circles) meet.
"""


def N(i, text, pause=0.2):
    return {"id": i, "text": text, "tts": text, "pause": pause}


SEGMENTS = [
    N("P01", "What if pi was exactly three?", 0.3),
    N("P02", "Engineers would finally be happy.", 0.3),
    N("P03", "A thirty centimeter pizza would have ninety centimeters of crust. Easy math."),
    N("P04", "But here's the problem. On flat ground, a circle can never be just three times its width.", 0.25),
    N("P05", "For pi to be three, space itself has to bend. Like drawing circles on a ball.", 0.25),
    N("P06", "Triangles would have more than a hundred and eighty degrees. Parallel lines would crash into each other.", 0.3),
    N("P07", "And for your pizza to follow the rule, the whole universe would have to curl up in less than two meters.", 0.35),
    N("P08", "Look straight ahead... and you'd see the back of your own head.", 0.3),
    N("P09", "Take one step... and you'd bump into yourself.", 0.35),
    N("P10", "The entire universe... smaller than your bedroom.", 1.2),
]
