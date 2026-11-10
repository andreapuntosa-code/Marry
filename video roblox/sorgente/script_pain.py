# -*- coding: utf-8 -*-
"""
"What if you couldn't feel pain?" -- Roblox What-if, human-body series.
Checked: congenital insensitivity to pain is real and rare (e.g. SCN9A mutations). Children often bite their lips,
tongue and fingers, get burns and fractures that go unnoticed; joints get damaged because they never shift position
to relieve strain; infections like appendicitis can go unnoticed. The brain tissue has no pain receptors, which is
why awake craniotomy is possible (headaches come from membranes and blood vessels, not the brain tissue).
"""


def N(i, text, pause=0.2):
    return {"id": i, "text": text, "tts": text, "pause": pause}


SEGMENTS = [
    N("N01", "What if you couldn't feel pain?", 0.3),
    N("N02", "Fun fact: your brain can't feel pain at all. Surgeons can operate on it while you're awake and talking.", 0.3),
    N("N03", "Sounds like a superpower. And it's real. A few people are born like this."),
    N("N04", "As babies, they chew their own lips and fingers... and never cry.", 0.3),
    N("N05", "They walk on broken bones for weeks, because nothing tells them to stop."),
    N("N06", "They don't notice when soup is too hot. Or when they've sat the wrong way for hours.", 0.25),
    N("N07", "Appendicitis? No warning at all. Until it's an emergency.", 0.3),
    N("N08", "Pain isn't your enemy. It's your body's alarm system."),
    N("N09", "Without it, a small cut, a burn, or a twisted ankle can quietly turn into something much worse.", 0.3),
    N("N10", "Pain hurts... but it's the reason you're still alive.", 1.2),
]
