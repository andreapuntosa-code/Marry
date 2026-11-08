# -*- coding: utf-8 -*-
"""
"What if Earth was a perfect sphere?" -- Roblox What-if in the viral format (sign in the first frame, a fact that
starts arguments, catastrophic ending).
Checked:
  Equatorial radius 6378.1 km, polar 6356.8 km -> 21.4 km difference (the spin bulge).
  Everest summit is ~6382.3 km from the centre, Chimborazo (Ecuador, on the bulge) ~6384.4 km: the farthest point.
  Roughness: Everest 8.8 km / 6371 km = 0.14%; pool balls are made to about +-0.2% -> shrunk, Earth feels smoother.
  Make the ground a sphere of R = 6371 km while it keeps spinning: the sea still follows the spinning (oblate)
  equipotential, r(lat) = 6378.1 - 21.4 sin^2(lat). Ground minus sea level = -7.1 + 21.4 sin^2(lat) km:
  equator 7 km under water, zero at ~35 deg; filling everything below costs ~1.40e9 km^3, about all the oceans
  (1.335e9) -> one equatorial ocean (~35S to 35N) and two continents.
  Heights above the new sea level: Tokyo ~0, New York 2.0, Rome 2.4, London 6.0, Moscow 7.5, Oslo 8.9, poles 14.2 km.
  Air follows the same equipotential: ~47% pressure at 6 km, ~17% at 14 km (Everest's summit is ~33%).
"""


def N(i, text, pause=0.2):
    return {"id": i, "text": text, "tts": text, "pause": pause}


SEGMENTS = [
    N("E01", "What if Earth was a perfect sphere?", 0.3),
    N("E02", "It's already close. Shrink Earth to the size of a pool ball, and it would feel smoother than one.", 0.25),
    N("E03", "But it's not perfectly round. Because it spins, it bulges at the equator by twenty-one kilometers."),
    N("E04", "That's why the farthest point from Earth's center isn't Everest. It's a volcano in Ecuador.", 0.3),
    N("E05", "Now make it a perfect sphere... while it's still spinning.", 0.25),
    N("E06", "The oceans don't follow the ground. They slide toward the equator."),
    N("E07", "Brazil, India, most of Africa... under seven kilometers of water.", 0.3),
    N("E08", "Everything above thirty-five degrees becomes two giant continents.", 0.2),
    N("E09", "London would be six kilometers up. Higher than any mountain in Europe."),
    N("E10", "And the North Pole? Fourteen kilometers high. Almost no air to breathe.", 0.3),
    N("E11", "A perfect planet... where half the world drowns, and the other half suffocates.", 1.2),
]
