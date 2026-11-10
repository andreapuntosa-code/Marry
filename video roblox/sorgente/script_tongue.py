# -*- coding: utf-8 -*-
"""
"What if humans didn't have a tongue?" -- Roblox What-if, human-body series (facts that sound wrong -> comments).
Checked: the "tongue map" (sweet at the tip, bitter at the back) is a myth: every region senses every basic taste.
Taste buds also sit on the soft palate, the throat (pharynx) and the epiglottis. Consonants made with the tongue:
t d n l k g r s z sh ch j th y; lips-only sounds (p b m f v w) and vowels remain. The tongue moves food back to the
throat to start swallowing. "Strongest muscle in the body" is a myth too (it's a group of 8 muscles, strong for its
size, not the strongest). After glossectomy (tongue removal) people can relearn to speak and swallow with therapy.
"""


def N(i, text, pause=0.2):
    return {"id": i, "text": text, "tts": text, "pause": pause}


SEGMENTS = [
    N("U01", "What if humans didn't have a tongue?", 0.3),
    N("U02", "First, that tongue map from school? It's wrong. Every part of your tongue tastes everything.", 0.25),
    N("U03", "Without one, you'd still taste a little. There are taste buds on the roof of your mouth and in your throat."),
    N("U04", "But try talking. T, D, N, L, K, G, R, S... they all need a tongue.", 0.2),
    N("U05", "Hello would sound like... eh oh.", 0.35),
    N("U06", "Eating gets hard too. Your tongue is what pushes food back into your throat."),
    N("U07", "Every bite would need a sip of water just to slide down.", 0.25),
    N("U08", "And no, it's not the strongest muscle in your body. That one's a myth too.", 0.3),
    N("U09", "People who lose their tongue can learn to talk and eat again. It just takes months of practice.", 0.3),
    N("U10", "So next time you bite it... say thank you. If you can.", 1.2),
]
