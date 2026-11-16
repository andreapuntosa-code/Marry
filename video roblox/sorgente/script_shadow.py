# -*- coding: utf-8 -*-
"""
"In this world, your shadow does whatever it wants." -- Roblox v2 cute story.
Mine dances when I'm nervous; the teacher's naps in class; Dad's is five seconds late; Grandma's is still twenty and
does cartwheels. Shadows know things before you do: at the bus stop, Lily and I only said hi... but our shadows were
holding hands. Twelve years later, at our wedding, the shadows were dancing before the music started.
"""


def N(i, text, pause=0.22, voice=None):
    return {"id": i, "text": text, "tts": text, "pause": pause, "voice": voice}


SEGMENTS = [
    N("H01", "In this world, your shadow does whatever it wants.", 0.35),
    N("H02", "Mine dances when I'm nervous."),
    N("H03", "My teacher's shadow takes naps during her own lessons."),
    N("H04", "My dad's shadow is always five seconds late."),
    N("H05", "And my grandma's shadow is still twenty years old. It does cartwheels.", 0.35),
    N("H06", "But here's the thing. Your shadow knows things before you do.", 0.35),
    N("H07", "Like the day I met Lily at the bus stop."),
    N("H08", "I said hi. She said hi. Very cool. Very normal.", 0.35),
    N("H09", "But on the ground... our shadows were holding hands.", 0.45),
    N("H10", "We looked down. Then at each other. Then very quickly at the sky.", 0.4),
    N("H11", "Twelve years later, at our wedding...", 0.3),
    N("H12", "our shadows started dancing before the music did.", 0.6),
    N("H13", "Comment what your shadow would do.", 1.0),
]
