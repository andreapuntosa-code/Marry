# -*- coding: utf-8 -*-
"""
"What if water froze at 10 degrees?" -- Roblox What-if.
Checked: pure water can stay liquid (supercooled) down to about -40 C. Fridges run at ~4 C. London's annual mean is
~11 C, with daily means below 10 C roughly from November to April. Most of the ocean's volume (deep water) is colder
than ~4 C; only the upper layer in warm regions is above 10 C. Ice reflects sunlight (high albedo) -> cooling ->
more ice (ice-albedo feedback; "snowball Earth").
"""


def N(i, text, pause=0.2):
    return {"id": i, "text": text, "tts": text, "pause": pause}


SEGMENTS = [
    N("W01", "What if water froze at ten degrees instead of zero?", 0.3),
    N("W02", "Fun fact: water doesn't always freeze at zero. Super clean water can stay liquid down to minus forty.", 0.3),
    N("W03", "But in this world, anything below ten degrees turns to ice.", 0.25),
    N("W04", "Your fridge is at four degrees. Every drink inside is a block of ice."),
    N("W05", "London's average temperature is eleven degrees. Its rivers would freeze for half the year.", 0.3),
    N("W06", "But the real problem is the ocean. Deep down, almost all of it is colder than four degrees."),
    N("W07", "So most of the ocean... would be solid ice.", 0.3),
    N("W08", "Only a thin warm layer near the equator would stay liquid."),
    N("W09", "And white ice reflects sunlight. Less sunlight, a colder planet, even more ice.", 0.3),
    N("W10", "Ten degrees... and Earth becomes a snowball.", 1.2),
]
