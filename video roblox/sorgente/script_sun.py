# -*- coding: utf-8 -*-
"""
"What if the Sun was 1% brighter?" -- Roblox-style What-if, escalating to a slow catastrophe (voice only, the user adds music).
Checked: 1% of the solar constant (1361 W/m2) is ~13.6 W/m2; spread over the sphere (/4) and minus the ~30% reflected
-> ~2.4 W/m2 of extra forcing, the same order as doubling CO2 (~3.7 W/m2) -> roughly +1.5 to +2 C at equilibrium.
That makes rare heatwaves frequent, bleaches corals, stresses crops, and over centuries melts ice sheets
(metres of sea-level rise). The video says "over decades" for the warming and "over the centuries" for the sea.
"""


def N(i, text, pause=0.2):
    return {"id": i, "text": text, "tts": text, "pause": pause}


SEGMENTS = [
    N("S01", "What if the Sun was just one percent brighter?", 0.3),
    N("S02", "One percent. That's nothing, right?", 0.3),
    N("S03", "On day one, you'd just get sunburned a little faster."),
    N("S03b", "Your ice cream would melt a few seconds sooner.", 0.3),
    N("S04", "But one percent of the Sun is a crazy amount of energy. Almost as much as doubling all the CO2 in the air.", 0.3),
    N("S05", "Over a few decades, the whole planet warms by almost two degrees."),
    N("S05b", "Doesn't sound like much? The last ice age was only about six degrees colder than today.", 0.3),
    N("S06", "Heatwaves that came once every fifty years now come every summer.", 0.25),
    N("S07", "Air conditioners run day and night... until the power grid gives up.", 0.3),
    N("S08", "Coral reefs turn white. Crops dry up in the fields.", 0.2),
    N("S08b", "Food gets more expensive, everywhere.", 0.3),
    N("S09", "Glaciers melt. The ice of Greenland and Antarctica slides into the sea.", 0.25),
    N("S10", "Over the centuries, the oceans rise by meters. Beaches disappear. Then streets. Then whole cities.", 0.3),
    N("S11", "Hundreds of millions of people have to move.", 0.4),
    N("S12", "And all it took... was one percent.", 1.2),
]
