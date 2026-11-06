# -*- coding: utf-8 -*-
"""
"I can see how many lies you told today" -- Roblox-style story (voice only, the user adds the music).
Lore: above everyone's head, the number of lies they told today; it resets to zero at midnight; only I can see it.
Everyone lies (Mom about my cooking, the teacher, the mayor at 47) -- except my girlfriend Emma, always at zero.
Tonight she says she was home all night: still zero. Then she says "I love you"... and her number goes to one.
Cliffhanger (part 2).
"""


def N(i, text, pause=0.18, voice=None):
    return {"id": i, "text": text, "tts": text, "pause": pause, "voice": voice}


SEGMENTS = [
    N("B01", "Since I was born, I can see a number above everyone's head."),
    N("B02", "It's how many lies they told today. And I'm the only one who can see it.", 0.25),
    N("B03", "Every night at midnight, it goes back to zero.", 0.25),
    N("B04", "My mom says she loves my cooking. Plus one.", 0.25),
    N("B05", "My teacher says this won't be on the test. Plus one.", 0.25),
    N("B06", "The mayor gave a speech. Forty-seven.", 0.35),
    N("B07", "But my girlfriend, Emma... she's always at zero."),
    N("B08", "Every single day. She's the only person I trust.", 0.35),
    N("B09", "Until tonight.", 0.4),
    N("B10", "I asked her where she was yesterday."),
    N("B11", "At home. All night.", 0.3, voice="mia"),
    N("B12", "Her number didn't move. Still zero.", 0.35),
    N("B13", "Then she smiled and said...", 0.2),
    N("B14", "I love you.", 0.5, voice="mia"),
    N("B15", "And her number went up to one.", 0.6),
    N("B16", "Comment truth if you want part two.", 0.9),
]
