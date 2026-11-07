# -*- coding: utf-8 -*-
"""
"In this town, you can enter any painting in the museum." -- Roblox v2 story, ~90 s, voice only (user adds music).
One rule: be out before the museum closes at six, or you stay in the painting forever. In the last room, a painting
has been under a red curtain for decades. Grandpa, the night guard for forty years, disappears... and appears, tiny,
with a lantern, inside the stormy lighthouse painting. I go in at 5:45. He isn't trapped: he's guarding it. From
inside, we see the red curtain move: something is stepping out. Six o'clock: the edges of the painting start to dry.
"""


def N(i, text, pause=0.25, voice=None):
    return {"id": i, "text": text, "tts": text, "pause": pause, "voice": voice}


SEGMENTS = [
    N("M01", "In this town, you can enter any painting in the museum.", 0.35),
    N("M02", "Just touch the frame... and step inside.", 0.4),
    N("M03", "Kids go swimming in old seascapes."),
    N("M04", "Couples have dinner in a cafe that closed a hundred years ago.", 0.35),
    N("M04b", "Old men go fishing on lakes that dried up centuries ago.", 0.4),
    N("M05", "There's only one rule. Be out before the museum closes at six."),
    N("M06", "Or you stay in the painting... forever.", 0.5),
    N("M07", "My grandpa was the night guard here for forty years."),
    N("M08", "He always said the painting in the last room wasn't painted. It was locked.", 0.4),
    N("M09", "It's been under a red curtain since before I was born.", 0.4),
    N("M09b", "Every night, he sat in front of it with his flashlight. He never turned his back to it.", 0.5),
    N("M10", "Last month, Grandpa disappeared. The police said he just left town.", 0.4),
    N("M11", "But yesterday... I saw him.", 0.4),
    N("M12", "In the corner of the stormy lighthouse painting. A tiny man with a lantern... waving at me.", 0.5),
    N("M13", "So today, at five forty-five, I touched the frame.", 0.5),
    N("M13b", "The canvas felt like warm water.", 0.5),
    N("M14", "Rain. Thunder. Waves as tall as houses.", 0.35),
    N("M15", "And at the top of the lighthouse... Grandpa.", 0.35),
    N("M15b", "He didn't look surprised to see me. He looked scared.", 0.4),
    N("M16", "You shouldn't be here! I'm not trapped. I'm guarding it.", 0.4, voice="grandpa"),
    N("M17", "He pointed at the edge of the painting. From inside, you could see the whole museum.", 0.35),
    N("M18", "And in the last room... the red curtain was moving.", 0.4),
    N("M19", "Something was stepping out.", 0.6),
    N("M19b", "A long, thin hand... made of black paint.", 0.6),
    N("M20", "Then the clock struck six.", 0.4),
    N("M21", "And the edges of the painting started to dry.", 0.6),
    N("M22", "Part two? Comment paint if you want to know what came out.", 1.0),
]
