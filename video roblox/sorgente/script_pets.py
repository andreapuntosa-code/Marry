# -*- coding: utf-8 -*-
"""
"In this world, every pet can talk for one day a year." -- Roblox v2 cute story (~60 s, voice only).
Pet Day: cats roast your cooking, parrots leak your secrets, goldfish forget what they wanted to say.
Biscuit, a 14-year-old dog, says his first words: "Thank you for picking me." Then spends the day saying my name.
"""


def N(i, text, pause=0.22, voice=None):
    return {"id": i, "text": text, "tts": text, "pause": pause, "voice": voice}


SEGMENTS = [
    N("T01", "In this world, every pet can talk... for one day a year.", 0.35),
    N("T02", "We call it Pet Day. And the whole town goes crazy."),
    N("T03", "Cats finally tell you what they think of your cooking."),
    N("T04", "Mid.", 0.35, voice="cat"),
    N("T05", "Parrots tell everyone your secrets."),
    N("T06", "He still sleeps with a night light!", 0.35, voice="parrot"),
    N("T07", "And goldfish... forget what they wanted to say."),
    N("T08", "Hi! I'm... uh... hi!", 0.4, voice="kid"),
    N("T09", "My dog Biscuit is fourteen. He's slow, he's grey, and he sleeps all day.", 0.3),
    N("T10", "At midnight, I sat next to him, waiting for his first word ever.", 0.3),
    N("T11", "I was scared he'd say I didn't walk him enough. That I wasn't a good owner.", 0.35),
    N("T12", "He looked at me with his tired eyes...", 0.45),
    N("T13", "Thank you... for picking me.", 0.6, voice="grandpa"),
    N("T14", "Fourteen years ago, at the shelter, everyone walked past the smallest, ugliest puppy.", 0.25),
    N("T15", "Except me.", 0.5),
    N("T16", "He spent the rest of his day with his head on my lap... saying my name. Over and over.", 0.5),
    N("T17", "Comment your pet's name. Biscuit wants to say hi.", 1.0),
]
