# -*- coding: utf-8 -*-
"""
"What if you could divide by zero?" -- Roblox What-if (school number, debated fact, catastrophic ending).
Checked: 1/x -> +inf from the right and -inf from the left, so 1/0 has no value in the real numbers.
If x/0 were allowed with the usual rules: 1x0 = 0 = 2x0 -> dividing by 0 gives 1 = 2, and then every number equals
every other. USS Yorktown (1997): a zero entered in a database field caused a divide-by-zero that crashed the ship's
network and left it dead in the water for hours.
"""


def N(i, text, pause=0.2):
    return {"id": i, "text": text, "tts": text, "pause": pause}


SEGMENTS = [
    N("Z01", "What if you could divide by zero?", 0.3),
    N("Z02", "Your calculator says error. Most people think the answer is infinity. It's not.", 0.25),
    N("Z03", "Come from one side, you get infinity. From the other side, minus infinity. So there's no answer at all.", 0.3),
    N("Z04", "But let's make it legal. One times zero is zero. Two times zero is zero."),
    N("Z05", "Divide both by zero... and one equals two.", 0.35),
    N("Z06", "And if one equals two, every number equals every other number."),
    N("Z07", "Zero dollars in your bank account? That's also a million.", 0.25),
    N("Z08", "Computers crash. In 1997, a US Navy warship stopped dead in the water... because of one division by zero.", 0.3),
    N("Z09", "Money, time, physics... every number would mean nothing."),
    N("Z10", "That's why your calculator says error. It's protecting the universe.", 1.2),
]
