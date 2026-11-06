# -*- coding: utf-8 -*-
"""
"Everyone has a number above their head" PART 2 -- the lock opens: 100. The whole town changes overnight;
Mia doesn't. Twist for part 3: another boy with a lock above his head, staring at Mia. Voice only (user adds music).
"""


def N(i, text, pause=0.18, voice=None):
    return {"id": i, "text": text, "tts": text, "pause": pause, "voice": voice}


SEGMENTS = [
    N("M01", "The lock opened... and my number was one hundred.", 0.35),
    N("M02", "The next morning, the whole town was waiting outside my house."),
    N("M03", "People who used to avoid me suddenly wanted to be my best friend."),
    N("M04", "Even the other hundred lost half his fans."),
    N("M05", "Everyone wanted my number. My phone number.", 0.3),
    N("M06", "But Mia didn't change at all.", 0.25),
    N("M07", "I liked you before I knew your number.", 0.35, voice="mia"),
    N("M08", "That's when I realized... she was worth more than any number.", 0.4),
    N("M09", "Then I saw him. Another guy, with a lock above his head.", 0.3),
    N("M10", "And he was staring right at Mia.", 0.5),
    N("M11", "Comment lock if you want part three.", 0.9),
]
