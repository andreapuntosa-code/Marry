# -*- coding: utf-8 -*-
"""
Five "What if...?" Shorts (vertical, under a minute) starring the Little AIs. One energetic narrator, quick reactions
from the Little AIs, a hook in the first two seconds, a 10-second timer during the event, a twist at the end.

  E  What if the Earth stopped spinning for 10 seconds?
  L  What if every atom lost one electron for 10 seconds?
  G  What if gravity turned off for 10 seconds?
  S  What if the Sun disappeared for 10 seconds?
  F  What if friction disappeared for 10 seconds?

Numbers used (checked):
  Earth's surface speed at the equator: 465 m/s = 1,670 km/h (faster than sound, 343 m/s); in 10 s: 4.65 km.
  Electron: every atom +e -> Earth's charge ~2e31 C, electrostatic energy ~(3/5)kQ^2/R ~ 3e65 J
    (a supernova ~1e44 J: about a billion billion billion times more); a human body: ~1e9 C, ~2e28 J
    (the Sun's output in about a minute: 3.8e26 W x 60 s = 2.3e28 J).
  Gravity off: straight-line drift vs the curving ground at the equator: (465 m/s x 10 s)^2 / (2 x 6371 km) = 1.7 m;
    a jump at ~2 m/s keeps going: 20 m in 10 s (about 6-7 floors).
  Sun: light and gravity take 8 min 20 s; Earth's orbital speed 30 km/s -> 300 km in 10 s.
"""

SHORTS = {
    "E": {"title": "What if the Earth stopped spinning for 10 seconds?", "file": "what_if_earth_stopped_spinning", "hook": ["WHAT IF THE EARTH", "STOPPED SPINNING?"]},
    "L": {"title": "What if every atom lost one electron for 10 seconds?", "file": "what_if_atoms_lost_an_electron", "hook": ["WHAT IF EVERY ATOM", "LOST AN ELECTRON?"]},
    "G": {"title": "What if gravity turned off for 10 seconds?", "file": "what_if_gravity_turned_off", "hook": ["WHAT IF GRAVITY", "TURNED OFF?"]},
    "S": {"title": "What if the Sun disappeared for 10 seconds?", "file": "what_if_the_sun_disappeared", "hook": ["WHAT IF THE SUN", "DISAPPEARED?"]},
    "F": {"title": "What if friction disappeared for 10 seconds?", "file": "what_if_friction_disappeared", "hook": ["WHAT IF FRICTION", "DISAPPEARED?"]},
}


def N(i, text, pause=0.25, tts=None, gfx=None, voice="narr"):
    return {"id": i, "sub": text, "tts": tts or text, "pause": pause, "voice": voice, "gfx": gfx or {}}


def K(i, who, text, pause=0.2, tts=None, gfx=None):
    return N(i, text, pause, tts, gfx, voice=who)


SEG = {
    "E": [
        N("E01", "What if the Earth stopped spinning... for just ten seconds?", 0.3, gfx={"hook": True}),
        N("E02", "Right now, you're spinning with the planet. At the equator, that's one thousand six hundred and seventy kilometers per hour.", 0.2, gfx={"big": "1,670 km/h"}),
        N("E03", "You don't feel it, because everything spins with you. The ground, the air, the oceans.", 0.2),
        N("E04", "Now... the Earth stops.", 0.15, gfx={"timer": "start", "stop": True}),
        N("E05", "But you don't.", 0.0),
        K("E05b", "red", "Whoaaaa!", 0.2),
        N("E06", "Everything that isn't bolted down keeps flying east. People, animals, cars... even the air itself.", 0.2),
        N("E07", "The wind would be faster than a jet. Faster than the speed of sound.", 0.2, gfx={"big": "SUPERSONIC WIND"}),
        N("E08", "In ten seconds, you'd fly almost five kilometers.", 0.2, gfx={"big": "4.6 km"}),
        N("E09", "The oceans would leave their beds and slam into the coasts as giant waves.", 0.2),
        N("E10", "The safest place on Earth? The North Pole. There, you'd just... slowly turn in place.", 0.2),
        N("E11", "Then the Earth starts spinning again, and everything gets thrown the other way.", 0.2, gfx={"timer": "end"}),
        K("E11b", "blue", "Not againnn!", 0.3),
        N("E12", "Ten seconds. That's all it would take.", 0.4),
        N("E13", "Follow for more what ifs!", 0.8, gfx={"end": True}),
    ],
    "L": [
        N("L01", "What if every atom lost just one electron... for ten seconds?", 0.3, gfx={"hook": True}),
        N("L02", "Every atom is a tiny balance: a positive nucleus, and negative electrons around it.", 0.2),
        N("L03", "Take away one electron, and every atom becomes positive.", 0.2, gfx={"big": "+ + + + +"}),
        N("L04", "And positive charges push each other away. Hard.", 0.2, gfx={"timer": "start"}),
        N("L05", "First, your skin would tingle, and every hair on your body would stand straight up.", 0.15),
        K("L05b", "yellow", "Huh? Why is my hair floating?", 0.2),
        N("L06", "Then your body would try to push itself apart, with as much energy as the Sun gives off in a whole minute.", 0.2),
        N("L07", "The ground, the oceans, the entire planet would blast apart from the inside.", 0.2),
        N("L08", "With more energy than a billion billion billion supernovas.", 0.25, gfx={"big": "10²¹ SUPERNOVAS"}),
        N("L09", "And the ten seconds? They don't matter. It would all be over in a tiny fraction of the very first second.", 0.3, gfx={"timer": "freeze"}),
        N("L10", "So the next time you lose something small... be glad it wasn't an electron.", 0.4),
        N("L11", "Follow for more what ifs!", 0.8, gfx={"end": True}),
    ],
    "G": [
        N("G01", "What if gravity switched off... for ten seconds?", 0.3, gfx={"hook": True}),
        N("G02", "At first, almost nothing happens. You don't shoot off into space.", 0.15, gfx={"timer": "start"}),
        K("G02b", "green", "Huh. That's it?", 0.2),
        N("G03", "But the Earth is spinning, and without gravity you keep going in a straight line. So the ground slowly curves away beneath you.", 0.2),
        N("G04", "After ten seconds, you're floating almost two meters up.", 0.2, gfx={"big": "1.7 m"}),
        N("G05", "And anyone who jumped right before it happened? They just keep going up. Twenty meters in ten seconds.", 0.15, gfx={"big": "20 m"}),
        K("G05b", "pink", "Heeelp!", 0.2),
        N("G06", "Animals float off the ground, water lifts out of lakes in giant wobbly blobs, and the air starts drifting up.", 0.2),
        N("G07", "Your ears would pop as the air pressure drops.", 0.2),
        N("G08", "Then... gravity comes back.", 0.15, gfx={"timer": "end"}),
        N("G09", "And everything falls. Two meters, no problem. But twenty meters? That's a seven-story fall.", 0.3),
        N("G10", "So if gravity ever switches off... don't jump.", 0.4),
        N("G11", "Follow for more what ifs!", 0.8, gfx={"end": True}),
    ],
    "S": [
        N("S01", "What if the Sun disappeared... for ten seconds?", 0.3, gfx={"hook": True}),
        N("S02", "Here's the crazy part. For eight minutes... nothing happens.", 0.2, gfx={"clock": "start"}),
        N("S03", "Sunlight takes eight minutes and twenty seconds to reach us. So we'd keep seeing a Sun that isn't there anymore.", 0.2, gfx={"big": "8 min 20 s"}),
        N("S04", "Even gravity travels at the speed of light. So the Earth keeps going around... nothing.", 0.25),
        K("S04b", "orange", "Nice day, huh?", 0.3),
        N("S05", "Then, eight minutes later... darkness.", 0.2, gfx={"timer": "start", "clock": "stop"}),
        N("S06", "Ten seconds of total night, in the middle of the day. Even the Moon goes dark, because it only reflects sunlight.", 0.2),
        K("S06b", "purple", "Who turned off the lights?!", 0.2),
        N("S07", "Meanwhile, the Earth flies off in a straight line, three hundred kilometers.", 0.2, gfx={"big": "300 km"}),
        N("S08", "Then the light and the gravity come back, and everything returns to normal.", 0.2, gfx={"timer": "end"}),
        N("S09", "Except for a lot of very confused animals.", 0.4),
        N("S10", "Follow for more what ifs!", 0.8, gfx={"end": True}),
    ],
    "F": [
        N("F01", "What if friction disappeared... for ten seconds?", 0.3, gfx={"hook": True}),
        N("F02", "Friction is the force that stops things from sliding. You use it every single time you take a step.", 0.2),
        N("F03", "Without it, the ground becomes perfect ice. Your foot pushes back... and just slips.", 0.15, gfx={"timer": "start"}),
        K("F03b", "brown", "Whoa, whoa, whoa!", 0.2),
        N("F04", "If you were already moving, you'd keep going. Nothing could slow you down.", 0.15),
        K("F04b", "red", "I can't stoooop!", 0.2),
        N("F05", "Every knot would untie. Shoelaces, ropes, even the knots in your hair.", 0.2),
        N("F06", "Nails and screws would slide right out of the wood. Fences and furniture would fall apart.", 0.2),
        N("F07", "You couldn't hold anything. Your food would squirt right out of your hands.", 0.2),
        N("F08", "Then friction comes back, all at once. Everything that was sliding stops... instantly.", 0.15, gfx={"timer": "end"}),
        N("F09", "Ten seconds, and the whole world ends up on the floor.", 0.4),
        N("F10", "Follow for more what ifs!", 0.8, gfx={"end": True}),
    ],
}
