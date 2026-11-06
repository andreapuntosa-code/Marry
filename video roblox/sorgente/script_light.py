# -*- coding: utf-8 -*-
"""
"What if light was 2x slower?" -- Roblox-style What-if, escalating to a catastrophe (voice only, the user adds music).
Checked: c = 299,792 -> ~150,000 km/s; sunlight 8 min 19 s -> 16 min 38 s; GPS times signals at c, so every
position fix breaks. With the electric force unchanged, mu0 = 1/(eps0 c^2) -> magnetic fields 4x stronger for the
same currents and magnets; generators/transformers push far too much voltage -> the grid overloads.
Gold's yellow comes from relativistic effects (they scale with 1/c) -> it would change colour.
"""


def N(i, text, pause=0.2):
    return {"id": i, "text": text, "tts": text, "pause": pause}


SEGMENTS = [
    N("C01", "What if light traveled at half its speed?", 0.3),
    N("C02", "At first, you wouldn't even notice.", 0.3),
    N("C03", "The sunlight on your face would be sixteen minutes old, instead of eight."),
    N("C04", "Then GPS breaks. Every phone, every car, every plane thinks it's somewhere else.", 0.3),
    N("C04b", "Planes circle blind. Ships lose their way.", 0.3),
    N("C05", "But light isn't just light. It's tied to electricity and magnetism."),
    N("C06", "Cut its speed in half, and every magnet becomes four times stronger.", 0.3),
    N("C06b", "Kitchen magnets would rip the pots right off the stove.", 0.3),
    N("C07", "Generators push out far too much voltage."),
    N("C08", "Power lines overload. Transformers explode, one after another.", 0.3),
    N("C08b", "Hospitals switch to backup generators... and those fail too.", 0.35),
    N("C09", "Even gold would change color.", 0.3),
    N("C10", "And within minutes... the whole planet goes dark.", 1.2),
]
