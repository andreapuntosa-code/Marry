# -*- coding: utf-8 -*-
"""
"Everyone has a number above their head" -- Roblox-style story (voice only, the user adds the music).
A town where everyone's number is their attractiveness rating, 1 to 100. Everyone dates up (boys and girls alike);
the ones at the top are chased by everyone. Except me: above my head there's a lock, and the doctor says it opens
when I turn eighteen. Cliffhanger ending (part 2).
"""


def N(i, text, pause=0.18):
    return {"id": i, "text": text, "tts": text, "pause": pause}


SEGMENTS = [
    N("L01", "In my town, everyone has a number above their head."),
    N("L02", "From one to one hundred. It's how attractive you are."),
    N("L03", "And nobody ever dates below their number."),
    N("L04", "Nineties date nineties. Fifties date fifties."),
    N("L05", "And everyone is always trying to date up.", 0.25),
    N("L06", "If you're a hundred, the whole town chases you.", 0.3),
    N("L07", "But I'm different. Above my head... there's a lock.", 0.3),
    N("L08", "The doctor said it stays locked until I turn eighteen."),
    N("L09", "So nobody knows if I'm a ten... or a hundred.", 0.25),
    N("L10", "Some people avoid me, just in case."),
    N("L11", "But Mia, a seventy-four, sits with me anyway. She says she likes not knowing.", 0.25),
    N("L12", "Her friends say she's dating down. Or maybe up. Nobody can tell.", 0.3),
    N("L13", "Tonight is my eighteenth birthday.", 0.25),
    N("L14", "At midnight, the lock started to open...", 0.2),
    N("L15", "And my number was...", 0.6),
    N("L16", "Comment what you think my number is. Part two tomorrow.", 0.9),
]
