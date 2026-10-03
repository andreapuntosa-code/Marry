# -*- coding: utf-8 -*-
"""Which on-screen graphic appears when (anchored to narration segments)."""

C = {"ISE": "#ff7a1a", "MIRA": "#a46bff", "BO": "#ffc21a", "TAM": "#3ac46b", "A15": "#63d6c6", "LIO": "#d07a45",
     "KASSA": "#ff4d5e", "SELA": "#f2d48a", "VARO": "#c9b3ff", "PELL": "#8fb3d9", "ORUN": "#4f8dff", "DORN": "#e8c26a", "NIA": "#ff7ac0"}

# (kind, anchor_segment, duration_seconds_or_None(=until segment end + pause), params)
EVENTS = [
    # --- rules
    ("rule", "r05", None, {"n": 1, "l1": "EVERYONE STARTS FROM ZERO"}),
    ("rule", "r06", None, {"n": 2, "l1": "ONE BODY. ONE LIFE.", "l2": "energy 0 = shut down  ·  cores wear out after ~100 years"}),
    ("rule", "r07", None, {"n": 3, "l1": "I DON'T INTERFERE", "l2": "no matter what happens"}),
    ("caption", "r08", 2.6, {"s": "SPOILER", "color": "#ffffff", "box": "#e11d48", "size": 70, "y": 180}),
    ("caption", "r11", 2.8, {"s": "x11", "size": 110, "y": 230}),
    ("caption", "r16", 2.9, {"s": "BUGGED?", "box": "#7c3aed", "size": 72, "y": 200}),
    ("energy", "r17", 3.9, {"x": 120, "y": 200, "from": 0.62, "to": 0.18, "label": "GROUP ENERGY"}),
    ("energy", "r20", 4.0, {"x": 120, "y": 200, "from": 0.14, "to": 0.93, "label": "A-07 ENERGY"}),
    ("caption", "r22", 2.5, {"s": "NOBODY TAUGHT HER THAT", "size": 64}),
    # --- first fire
    ("caption", "f03", 1.6, {"s": "WOLVES", "color": "#ffffff", "size": 120, "y": 880}),
    ("energy", "f07", 3.2, {"x": 120, "y": 200, "from": 0.0, "to": 0.0, "label": "A-15 ENERGY"}),
    ("caption", "f10", 4.6, {"s": "A-15   ·   NAME: —", "size": 64, "y": 170}),
    # --- words
    ("caption", "w03", 6.4, {"s": "PATTERN DETECTED", "key": "mono_b", "size": 44, "color": "#7CFFB2", "y": 260, "delay": 3.0}),
    ("glyph", "w04", 2.6, {"key": "ILA", "word": "Ila", "meaning": "food", "color": "#ff7a1a"}),
    ("glyph3", "w05", 3.4, {}),
    ("glyph", "w09", 1.7, {"key": "BELLO", "word": "Beautiful", "meaning": "the first word for nothing useful", "color": "#a46bff"}),
    ("caption", "w11", 2.4, {"s": "NOT “I”.  NOT “YOU”.", "size": 64}),
    ("glyph", "w12", 2.3, {"key": "NOI", "word": "We", "meaning": "", "color": "#ffd27a"}),
    ("name", "w14", 3.9, {"name": "ISE", "role": "A-07  ·  THE ONE WHO FOUND", "c": "ISE"}),
    ("name", "w15", 3.6, {"name": "MIRA", "role": "A-04  ·  THE ONE WHO LOOKS", "c": "MIRA"}),
    ("name", "w16", 2.7, {"name": "BO", "role": "A-09  ·  THE FIRE THIEF", "c": "BO"}),
    ("name", "w17", 3.4, {"name": "TAM", "role": "A-11  ·  ???", "c": "TAM"}),
    # --- farm
    ("caption", "a05", 2.6, {"s": "THE ENTIRE WINTER SUPPLY", "size": 60, "y": 190}),
    ("caption", "a06", 2.9, {"s": "NOT INVITED TO DINNER", "box": "#16a34a", "size": 62, "y": 190}),
    ("name", "a08", 4.0, {"name": "THE FIRST SEED", "role": "YEAR 40  ·  ISE", "c": "ISE"}),
    ("caption", "a12", 3.0, {"s": "+1 NEW AI", "box": "#2563eb", "size": 64, "y": 190}),
    ("place", "a13", 4.2, {"name": "PRIMA", "sub": "“the first place”"}),
    # --- leftovers
    ("name", "k01", 5.0, {"name": "LIO", "role": "POTTER  ·  YEAR 340", "c": "LIO"}),
    ("caption", "k02", 1.4, {"s": "CLAY", "size": 120, "y": 600}),
    ("caption", "k04", 1.8, {"s": "LEFTOVERS", "size": 110, "y": 600}),
    ("name", "k07", 4.4, {"name": "KASSA", "role": "FARMER  ·  YEAR 520", "c": "KASSA"}),
    ("caption", "k09", 1.6, {"s": "MINE.", "color": "#ff4d5e", "size": 150, "y": 620}),
    ("caption", "k13", 3.6, {"s": "FIRST THEFT  →  FIRST PRISON", "size": 56, "y": 190}),
    ("caption", "k14", 9.5, {"s": "THE FIRST ARMY", "size": 64, "y": 190, "delay": 5.0}),
    ("caption", "k21", 1.9, {"s": "YEAH.", "size": 110, "y": 600}),
    ("caption", "k23", 1.8, {"s": "WHY?", "size": 140, "y": 620}),
    # --- observer
    ("flash", "o03", 0.9, {"at": 2.7}),
    ("flash", "o05", 0.8, {"at": 0.4}),
    ("name", "o04", 6.0, {"name": "SELA", "role": "PRIESTESS  ·  YEAR 1000", "c": "SELA"}),
    ("glyph", "o07", 2.2, {"key": "OSSERVATORE", "word": "The Observer", "meaning": "", "color": "#f2d48a"}),
    ("flash", "o10", 0.7, {"at": 0.3}),
    # --- crown
    ("caption", "c05", 6.6, {"s": "*eating cereal*", "size": 58, "y": 200, "key": "corsivo_b", "delay": 4.2}),
    ("name", "c06", 6.0, {"name": "VARO", "role": "HIGH PRIEST  ·  VERY PRACTICAL", "c": "VARO"}),
    ("name", "c08", 2.6, {"name": "KING KASSA VII", "role": "FIRST KING  ·  YEAR 1420", "c": "KASSA"}),
    ("caption", "c10", 8.9, {"s": "1/3 OF EVERY HARVEST → THE PALACE", "size": 52, "y": 190}),
    ("name", "c12", 7.5, {"name": "PELL", "role": "ENGINEER  ·  THE STONE BRIDGE", "c": "PELL", "delay": 2.2}),
    ("kings", "c13", 7.5, {}),
    ("caption", "c14", 4.2, {"s": "1/3  →  1/2", "color": "#ff4d5e", "size": 100, "y": 220}),
    # --- one stone one voice
    ("name", "d02", 6.0, {"name": "ORUN", "role": "HARVESTER  ·  YEAR 1901", "c": "ORUN"}),
    ("caption", "d06", 2.3, {"s": "ONE STONE  ·  ONE VOICE", "color": "#ffffff", "box": "#2563eb", "size": 70, "y": 200}),
    ("caption", "d07", 8.0, {"s": "41 AIs  ·  41 STONES", "size": 60, "y": 190, "delay": 5.0}),
    ("name", "d12", 3.9, {"name": "KING KASSA XIX", "role": "THE LAST KING?", "c": "KASSA"}),
    ("rule", "d20", None, {"n": 3, "l1": "I DON'T INTERFERE", "l2": "no matter what happens"}),
    # --- torches
    ("name", "x07", 5.0, {"name": "DORN", "role": "CAPTAIN OF THE GUARD", "c": "DORN", "delay": 1.0}),
    ("caption", "x09", 3.1, {"s": "1 . . . 10 . . . 40", "size": 80, "y": 200}),
    ("caption", "x13", 4.6, {"s": "SHUT HIM DOWN   ·   LET HIM GO", "size": 54, "y": 250, "delay": 2.2}),
    ("search", "x16", 3.6, {}),
    ("name", "x18b", 6.8, {"name": "ORUN", "role": "FIRST SPEAKER OF THE ASSEMBLY", "c": "ORUN", "delay": 3.0}),
    ("caption", "x19", 4.9, {"s": "BRIDGE COLOR VOTE  ·  DAY 40", "size": 56, "y": 190, "delay": 1.8}),
    # --- message
    ("name", "m04", 6.3, {"name": "NIA", "role": "PAINTER  ·  YEAR 1999", "c": "NIA"}),
    ("flash", "m10", 1.2, {"at": 3.4}),
    ("comment", "m13", 5.6, {}),
]

# year counter: hidden before r09, ramps during timelapses: (from_seg, to_seg, y0, y1)
YEAR_RAMPS = [
    ("w06", "w07", 3, 13),
    ("a15", "a16", 60, 112),
    ("a17", "k01", 112, 340),
    ("k05", "k06", 340, 520),
    ("o02", "o03", 610, 1000),
    ("c01", "c02", 1000, 1400),
    ("c13", "c14", 1420, 1900),
    ("d09", "d11", 1901, 1925),
    ("x18b", "x19", 1931, 1932),
    ("m01", "m02", 1990, 1999),
]
DAY_LABELS = [("r09", "f06", "DAY 1"), ("f06", "f07", "DAY 203"), ("f07", "f11", "DAY 205"), ("f11", "w01", "DAY 214")]
YEAR_HIDDEN = [("o11", "o12"), ("o14", "o15"), ("c05", "c06"), ("d17", "x01"), ("m12", None)]
