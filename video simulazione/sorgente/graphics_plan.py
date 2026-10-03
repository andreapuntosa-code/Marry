# -*- coding: utf-8 -*-
"""Which on-screen graphic appears when (anchored to narration segments).
KEY moments carry no text at all; YEAR + POPULATION are shown in timelapses and transitions."""

C = {"ISE": "#ff7a1a", "MIRA": "#a46bff", "BO": "#ffc21a", "TAM": "#3ac46b", "A15": "#63d6c6", "LIO": "#d07a45",
     "KASSA": "#ff4d5e", "SELA": "#f2d48a", "VARO": "#c9b3ff", "PELL": "#8fb3d9", "ORUN": "#4f8dff", "DORN": "#e8c26a", "NIA": "#ff7ac0",
     "AMA": "#3fb6c9", "YUNA": "#e0714f", "SEFA": "#7fd18b"}

# (kind, anchor_segment, duration_seconds_or_None(=until segment end + pause), params)
# only kinds in KEY_OK may overlap a KEY window (they are light effects, not text)
EVENTS = [
    # --- rules
    ("rule", "r05", None, {"n": 1, "l1": "EVERYONE STARTS FROM ZERO"}),
    ("rule", "r06", None, {"n": 2, "l1": "ONE BODY. ONE LIFE.", "l2": "energy 0 = shut down  ·  cores wear out after ~100 years"}),
    ("rule", "r07", None, {"n": 3, "l1": "I DON'T INTERFERE", "l2": "no matter what happens"}),
    ("caption", "r08", 2.6, {"s": "SPOILER", "color": "#ffffff", "box": "#e11d48", "size": 70, "y": 180}),
    ("caption", "r11", 2.8, {"s": "x11", "size": 110, "y": 230}),
    ("caption", "r16", 2.9, {"s": "BUGGED?", "box": "#7c3aed", "size": 72, "y": 200}),
    ("energy", "r17", 3.9, {"x": 120, "y": 200, "from": 0.62, "to": 0.18, "label": "GROUP ENERGY"}),
    # --- first fire
    ("caption", "f03", 1.6, {"s": "WOLVES", "color": "#ffffff", "size": 120, "y": 880}),
    # --- words
    ("caption", "w03", 6.4, {"s": "PATTERN DETECTED", "key": "mono_b", "size": 44, "color": "#7CFFB2", "y": 260, "delay": 3.0}),
    ("glyph3", "w05", 3.4, {}),
    ("name", "w14", 3.9, {"name": "ISE", "role": "A-07  ·  THE ONE WHO FOUND", "c": "ISE"}),
    ("name", "w15", 3.6, {"name": "MIRA", "role": "A-04  ·  THE ONE WHO LOOKS", "c": "MIRA"}),
    ("name", "w16", 2.7, {"name": "BO", "role": "A-09  ·  THE FIRE THIEF", "c": "BO"}),
    ("name", "w17", 3.4, {"name": "TAM", "role": "A-11  ·  ???", "c": "TAM"}),
    # --- farm
    ("caption", "a05", 2.6, {"s": "THE ENTIRE WINTER SUPPLY", "size": 60, "y": 190}),
    ("caption", "a06", 2.9, {"s": "NOT INVITED TO DINNER", "box": "#16a34a", "size": 62, "y": 190}),
    ("caption", "a12", 3.0, {"s": "+1 NEW AI", "box": "#2563eb", "size": 64, "y": 190}),
    ("place", "a13", 4.2, {"name": "PRIMA", "sub": "“the first place”"}),
    # --- leftovers
    ("name", "k01", 5.0, {"name": "LIO", "role": "POTTER  ·  YEAR 340", "c": "LIO"}),
    ("name", "k07", 4.4, {"name": "KASSA", "role": "FARMER  ·  YEAR 520", "c": "KASSA"}),
    ("caption", "k13", 3.6, {"s": "FIRST THEFT  →  FIRST PRISON", "size": 56, "y": 190}),
    ("caption", "k14", 9.5, {"s": "THE FIRST ARMY", "size": 64, "y": 190, "delay": 5.0}),
    # --- the others
    ("name", "e02", 5.6, {"name": "AMA", "role": "SURVIVOR  ·  YEAR 611", "c": "AMA", "delay": 0.4}),
    ("place", "e04", 4.0, {"name": "NUVIA", "sub": "“the place after the water”", "delay": 1.6}),
    ("place", "e10", 4.4, {"name": "THE TAMARI", "sub": "“the people of the herd”", "delay": 0.8}),
    ("peoples", "e12", None, {"items": [("PRIMA", "granaries · walls · “mine”", "#ffb36b"), ("NUVIA", "boats · the river is holy", "#5fd0e0"), ("TAMARI", "tents · goats · no kings", "#e3c15a")]}),
    # --- observer
    ("flash", "o03", 0.9, {"at": 2.7}),
    ("flash", "o05", 0.8, {"at": 0.4}),
    ("flash", "o10", 0.7, {"at": 0.3}),
    # --- crown
    ("caption", "c05", 6.6, {"s": "*eating cereal*", "size": 58, "y": 200, "key": "corsivo_b", "delay": 4.2}),
    ("name", "c06", 6.0, {"name": "VARO", "role": "HIGH PRIEST  ·  VERY PRACTICAL", "c": "VARO"}),
    ("name", "c09", 4.6, {"name": "KING KASSA VII", "role": "THE FIRST KING  ·  YEAR 1420", "c": "KASSA", "delay": 0.2}),
    ("caption", "c10", 8.9, {"s": "1/3 OF EVERY HARVEST → THE PALACE", "size": 52, "y": 190}),
    ("name", "c12", 7.5, {"name": "PELL", "role": "ENGINEER  ·  THE STONE BRIDGE", "c": "PELL", "delay": 2.2}),
    ("kings", "c13", 7.5, {"first": "VII", "last": "XI"}),
    ("name", "g02", 5.2, {"name": "KING KASSA XI", "role": "THE CONQUEROR  ·  YEAR 1512", "c": "KASSA", "delay": 0.6}),
    ("caption", "c14", 4.2, {"s": "1/3  →  1/2", "color": "#ff4d5e", "size": 100, "y": 220}),
    ("kings", "c15", 6.6, {"first": "XII", "last": "XIX"}),
    # --- one stone one voice
    ("name", "d02", 6.0, {"name": "ORUN", "role": "HARVESTER  ·  YEAR 1901", "c": "ORUN"}),
    ("name", "d12", 3.9, {"name": "KING KASSA XIX", "role": "THE LAST KING?", "c": "KASSA"}),
    # --- torches
    ("search", "x16", 3.6, {}),
    ("name", "x18b", 6.8, {"name": "ORUN", "role": "FIRST SPEAKER OF THE ASSEMBLY", "c": "ORUN", "delay": 3.0}),
    ("caption", "x19", 4.9, {"s": "BRIDGE COLOR VOTE  ·  DAY 40", "size": 56, "y": 190, "delay": 1.8}),
    # --- message
    ("name", "m04", 6.3, {"name": "NIA", "role": "PAINTER  ·  YEAR 1999", "c": "NIA"}),
    ("flash", "m10", 1.2, {"at": 3.4}),
    ("comment", "m13", 5.6, {}),
]
KEY_OK = {"flash"}

# year counter: shown from r09; ramps during timelapses: (from_seg, to_seg, y0, y1)
YEAR_RAMPS = [
    ("w06", "w07", 3, 13),
    ("a15", "a16", 60, 112),
    ("a17", "k01", 112, 340),
    ("k05", "k06", 340, 520),
    ("k10", "k15", 521, 560),
    ("k15", "k17", 560, 609),
    ("e06", "e08", 611, 811),
    ("e17", "e18", 812, 912),
    ("o02", "o03", 912, 1000),
    ("c01", "c02", 1000, 1400),
    ("c13", "g01", 1420, 1500),
    ("g06", "g07", 1512, 1640),
    ("g09", "g10", 1640, 1643),
    ("c14", "d01", 1650, 1900),
    ("d09", "d12", 1901, 1927),
    ("x18b", "x19", 1931, 1932),
    ("m01", "m02", 1990, 1999),
]
DAY_LABELS = [("r09", "r13", "DAY 1"), ("r13", "r17", "DAY 9"), ("r17", "f01", "DAY 14"), ("f01", "f06", "DAY 31"),
              ("f06", "f07", "DAY 203"), ("f07", "f11", "DAY 205"), ("f11", "w01", "DAY 214")]
# the HUD is off in the creator's room (the real world) and on his screens
YEAR_HIDDEN = [("o11", "o12"), ("o14", "o15"), ("c05", "c06"), ("d17", "x01"), ("m12", None)]

# population (all AIs in the world): value set at a segment start, and ramps (from_seg, to_seg, p0, p1)
POP_MARKS = [
    ("r09", 20), ("f10", 19),                     # A-15
    ("k19", 262),                                 # the flood: 384 -> 262
    ("g03", 6400), ("g05", 5780),                 # the war on Nuvia
    ("g10", 5400),                                # the Grey Sleep: one in three
    ("d01", 10900), ("d15", 11240), ("d16", 11239),   # "someone shuts down"
    ("x18b", 11302), ("m11", 13107),
]
POP_RAMPS = [
    ("a12", "a13", 19, 24),
    ("a15", "a16", 24, 96),
    ("a17", "k01", 96, 181),
    ("k05", "k06", 181, 312),
    ("k06", "k17", 312, 384),
    ("e06", "e08", 262, 1180),
    ("e17", "e18", 1180, 2360),                   # "the population of the whole valley doubled"
    ("o02", "o03", 2360, 2900),
    ("c01", "c02", 2900, 4300),
    ("c13", "g01", 4300, 6300),
    ("g01", "g03", 6300, 6400),
    ("g06", "g07", 5780, 8100),
    ("g09", "g10", 8100, 5400),                   # one AI out of three shut down
    ("c14", "d01", 5400, 10900),
    ("d09", "d12", 10900, 11240),
    ("m01", "m02", 12410, 12600),
]

# KEY moments (speeches, discoveries, deaths, the climax): [from_seg, to_seg) — no on-screen text at all
# (no HUD, captions, name cards or burned-in subtitles; chapter/title cards excepted) and the shots inside
# are rendered as hero shots (native resolution, depth of field, FXAA, stronger bloom).
KEY = [
    ("h01", "r01"),            # cold open
    ("r19", "f01"),            # Ise eats the berry, raises her hand
    ("f06", "f11"),            # A-15 dies
    ("f12", "w01"),            # lightning, Bo steals fire
    ("w04", "w05"),            # Ila, the first word
    ("w08", "w13"),            # Mira's "Beautiful", "we"
    ("a08", "a09"),            # the first seed
    ("a16", "k01"),            # the founders shut down, Ise's statue
    ("k02", "k05"),            # clay, pots, leftovers
    ("k09", "k10"),            # "Mine."
    ("k18", "e01"),            # the flood, "Why?"
    ("e14", "e17"),            # first contact: Yuna's cheese, trade
    ("o03", "o08"),            # the flash, Sela, the Observer
    ("o09", "c01"),            # "They found me."
    ("c04", "c05"),            # Kassa VII's announcement
    ("c07", "c09"),            # the first king
    ("g03", "g05"),            # the war on Nuvia
    ("g07", "g09"),            # the Grey Sleep
    ("g10", "c14"),            # Sefa, "why didn't the Observer save them?"
    ("d03", "d09"),            # Orun's idea, the first vote
    ("d15", "x01"),            # the raid, the reset button
    ("x03", "x16"),            # the night of torches
    ("x17", "x18b"),           # "they chose democracy"
    ("x20", "m01"),            # "But it's theirs.", the montage
    ("m05", "m11"),            # the message
]
