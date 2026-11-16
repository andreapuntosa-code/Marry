# -*- coding: utf-8 -*-
"""
"In this world, everyone has a tiny cloud above their head that shows how they feel." -- Roblox v2 cute story.
Sunshine when happy, thunder when angry, glitter rain when in love. The new girl's cloud rains every day; nobody sits
next to her. I bring an umbrella. Forty days later: a tiny rainbow. And my cloud? Raining glitter.
"""


def N(i, text, pause=0.22, voice=None):
    return {"id": i, "text": text, "tts": text, "pause": pause, "voice": voice}


SEGMENTS = [
    N("C01", "In this world, everyone has a tiny cloud above their head. It shows how they feel.", 0.3),
    N("C02", "Happy people get sunshine."),
    N("C03", "Angry people get thunder."),
    N("C04", "And when you're in love... it rains glitter.", 0.35),
    N("C05", "Mine is usually sunny. Except on Mondays.", 0.35),
    N("C06", "Then a new girl came to my school. Her cloud was raining. Every single day.", 0.3),
    N("C07", "Nobody sat next to her. Nobody wanted to get wet.", 0.35),
    N("C08", "So one day, I brought an umbrella... and sat next to her.", 0.3),
    N("C09", "We didn't talk much. I just held the umbrella.", 0.3),
    N("C10", "The next day, I did it again. And the day after that.", 0.3),
    N("C11", "On the fortieth day... the rain stopped.", 0.4),
    N("C12", "And her cloud made a tiny rainbow.", 0.45),
    N("C13", "Then I looked up at mine.", 0.35),
    N("C14", "It was raining glitter.", 0.6),
    N("C15", "Comment a rainbow if you'd hold the umbrella.", 1.0),
]
