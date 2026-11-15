# -*- coding: utf-8 -*-
"""
"Let's learn colors!" -- a YouTube Short for kids (3-6), toy-world 3D, cheerful voice + bouncy music.
Seven colors, each with one familiar object, then a rainbow. Mark the video as "Made for kids" on YouTube.
Voice: RBX_VOICE=af_bella RBX_SPEED=0.9 RBX_PITCH=1.1
"""
# the music style for the driver: bright and bouncy
MUSIC = "kids"


def N(i, text, pause=0.9):
    return {"id": i, "text": text, "tts": text, "pause": pause}


SEGMENTS = [
    N("C01", "Hi friends! Let's learn colors!", 0.35),
    N("C02", "Red! Red like a big, shiny apple!"),
    N("C03", "Blue! Blue like the deep blue sea!"),
    N("C04", "Yellow! Yellow like the happy sun!"),
    N("C05", "Green! Green like a little frog! Ribbit!"),
    N("C06", "Orange! Orange like a juicy orange!"),
    N("C07", "Purple! Purple like yummy grapes!"),
    N("C08", "Pink! Pink like a happy little pig! Oink!", 0.35),
    N("C09", "Now all together... a rainbow!", 1.2),
    N("C10", "Which color is your favorite? Bye bye, friends!", 1.2),
]
SFX = [("C01", 0.0, "pop"), ("C02", 0.0, "pop"), ("C03", 0.0, "pop"), ("C04", 0.0, "pop"), ("C05", 0.0, "pop"),
       ("C06", 0.0, "pop"), ("C07", 0.0, "pop"), ("C08", 0.0, "pop"), ("C09", 1.0, "chime"), ("C10", 0.0, "pop")]
