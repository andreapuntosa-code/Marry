# -*- coding: utf-8 -*-
"""
"30 DAYS ON A DESERT ISLAND" -- EP1 (comedy series, Roblox v2, comments vote the next day).
Max falls off a cruise ship on day one; island, a coconut, a rubber duck, a phone at 2%; a crab; a monkey wearing his
sunglasses. HUD on top: DAY n/30 + FOOD / WATER / ENERGY bars. Ending: comment WATER or FIRE.
"""


def N(i, text, pause=0.2):
    return {"id": i, "text": text, "tts": text, "pause": pause}


SEGMENTS = [
    N("I01", "Max had one rule for his cruise vacation: don't fall off the boat.", 0.35),
    N("I02", "Day one. He fell off the boat.", 0.45),
    N("I03", "He washed up on an island with three things: a coconut, a rubber duck, and his phone at two percent.", 0.3),
    N("I04", "He used that two percent wisely... to post a selfie.", 0.3),
    N("I05", "Zero percent.", 0.45),
    N("I06", "The rules are simple. Survive thirty days, and maybe a boat will find him."),
    N("I07", "Food: zero. Water: zero. Shelter: one very confused crab.", 0.35),
    N("I08", "Then he met the island's only other resident. A monkey. Wearing sunglasses. His sunglasses.", 0.35),
    N("I09", "By sunset, Max was hungry, thirsty, and losing an argument with a monkey.", 0.35),
    N("I10", "Tomorrow, he only has energy for one thing.", 0.3),
    N("I11", "Comment one word: water, or fire. The most liked comment decides day two.", 1.2),
]
