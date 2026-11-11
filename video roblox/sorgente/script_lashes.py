# -*- coding: utf-8 -*-
"""
"Eyelashes are just for looks... right?" -- body series: looks useless, catastrophe without it.
Checked: Amador et al. 2015 (J. R. Soc. Interface): across 22 mammals eyelashes are ~1/3 of the eye's width, the
length that best reduces airflow at the eye surface, cutting evaporation and particle deposition by up to ~50%.
Touching the lashes triggers the blink reflex. Without lashes (madarosis) eyes get more irritation and infections.
"""


def N(i, text, pause=0.2):
    return {"id": i, "text": text, "tts": text, "pause": pause}


SEGMENTS = [
    N("L01", "Eyelashes are just for looks... right?", 0.3),
    N("L02", "Wrong. Scientists found they're the perfect length to protect your eyes. About one third of your eye's width.", 0.25),
    N("L03", "They slow down the air hitting your eye. That cuts dust and drying by about half."),
    N("L04", "And they're sensors. Touch one, and you blink before anything hits your eye.", 0.3),
    N("L05", "Now remove them.", 0.35),
    N("L06", "Every gust of wind dries your eyes up to twice as fast. They burn. They itch."),
    N("L07", "Dust, pollen and sand land straight on your eyeball.", 0.25),
    N("L08", "Your eyes turn red, swollen, infected.", 0.3),
    N("L09", "In the desert, one sandstorm could scratch your eyes.", 0.3),
    N("L10", "Those tiny hairs are the only thing between your eyes and the world.", 1.2),
]
