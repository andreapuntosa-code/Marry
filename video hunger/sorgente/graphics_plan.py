# -*- coding: utf-8 -*-
"""Which on-screen graphic appears when (anchored to narration segments).
KEY moments carry no text at all; DAY + the two populations are shown in transitions and ordinary scenes."""

C = {"WREN": "#78e08a", "OAK": "#a8c04a", "FERN": "#aee6bd", "BRAM": "#2fb36a", "MOSS": "#9bbcb4", "IVY": "#2fd0b0", "THORN": "#7f9a4a",
     "SOL": "#ffc72e", "DUNE": "#f19a3a", "ASH": "#c3beb4", "KESH": "#ff5a42", "LARK": "#fff2b8", "REED": "#f0c883", "MARA": "#ff7094",
     "F": "#6fd27c", "P": "#f2c14a"}

# (kind, anchor_segment, duration_seconds_or_None(=until segment end + pause), params)
EVENTS = [
    # --- the rules (cold open is clean)
    ("rule", "r08", None, {"n": 1, "l1": "BOTH SIDES KNOW ABOUT THE WALL"}),
    ("rule", "r09", None, {"n": 2, "l1": "DAY 365 · SUNRISE · THE WALL FALLS", "l2": "most AIs alive at sunset wins the valley"}),
    ("rule", "r10", None, {"n": 3, "l1": "I DON'T INTERFERE", "l2": "no matter what"}),
    ("caption", "r06", 3.0, {"s": "SAME BASIC KNOWLEDGE", "size": 60, "y": 190, "delay": 0.3}),
    ("caption", "r07", 3.0, {"s": "NO POLITICS · NO RELIGION · NO WAR", "size": 50, "y": 190, "delay": 0.2}),
    # --- the first night
    ("caption", "n02", 3.2, {"s": "12 LOST · 4 × SAME TREE", "size": 56, "y": 190, "delay": 3.0}),
    ("caption", "n11", 3.4, {"s": "91 → LEFT", "size": 90, "y": 220, "delay": 1.8, "box": "#ca8a04"}),
    ("caption", "n14", 3.4, {"s": "MEETING: 11 HOURS", "size": 60, "y": 190, "delay": 0.6, "box": "#16a34a"}),
    ("caption", "n15", 3.0, {"s": "ROOF: 40 MINUTES", "size": 60, "y": 190, "delay": 3.0}),
    ("place", "n19", 4.2, {"name": "THE WALL", "sub": "“every sunrise, one mark goes dark”", "delay": 3.0}),
    # introductions: forest on the left, plain on the right
    ("name", "n24", 2.1, {"name": "WREN", "role": "SCOUT · FOREST", "c": "WREN", "delay": 3.6, "side": "left"}),
    ("name", "n24", 2.1, {"name": "OAK", "role": "BUILDER · FOREST", "c": "OAK", "delay": 4.9, "side": "left"}),
    ("name", "n24", 2.1, {"name": "FERN", "role": "HEALER · FOREST", "c": "FERN", "delay": 6.2, "side": "left"}),
    ("name", "n24", 2.1, {"name": "BRAM", "role": "HUNTER · FOREST", "c": "BRAM", "delay": 7.3, "side": "left"}),
    ("name", "n24", 2.1, {"name": "MOSS", "role": "LISTENS TO TREES · FOREST", "c": "MOSS", "delay": 8.8, "side": "left"}),
    ("name", "n24", 2.1, {"name": "IVY", "role": "TALKS TO EVERYONE · FOREST", "c": "IVY", "delay": 10.4, "side": "left"}),
    ("name", "n24", 2.4, {"name": "THORN", "role": "TRUSTS NO ONE · FOREST", "c": "THORN", "delay": 12.0, "side": "left"}),
    ("name", "n25", 2.1, {"name": "SOL", "role": "FARMER · PLAIN", "c": "SOL", "delay": 1.4, "side": "right"}),
    ("name", "n25", 2.1, {"name": "DUNE", "role": "AFRAID OF HORSES · PLAIN", "c": "DUNE", "delay": 3.4, "side": "right"}),
    ("name", "n25", 2.1, {"name": "ASH", "role": "SMITH · PLAIN", "c": "ASH", "delay": 5.2, "side": "right"}),
    ("name", "n25", 2.1, {"name": "KESH", "role": "BORN SOLDIER · PLAIN", "c": "KESH", "delay": 6.8, "side": "right"}),
    ("name", "n25", 2.1, {"name": "LARK", "role": "WATCHES THE SUN · PLAIN", "c": "LARK", "delay": 8.6, "side": "right"}),
    ("name", "n25", 2.1, {"name": "REED", "role": "TRADES EVERYTHING · PLAIN", "c": "REED", "delay": 10.2, "side": "right"}),
    ("name", "n25", 2.4, {"name": "MARA", "role": "PROMISES EVERYTHING · PLAIN", "c": "MARA", "delay": 11.8, "side": "right"}),
    # --- survival
    ("caption", "s05", 2.6, {"s": "3 ARROWS · 3 WOLVES", "size": 58, "y": 190, "delay": 0.2}),
    ("place", "s18", 4.2, {"name": "ROOTHOLM", "sub": "“the city in the air”", "delay": 2.0}),
    ("caption", "s12", 3.0, {"s": "DAY 23 · METAL", "size": 60, "y": 190, "delay": 3.5, "box": "#78716c"}),
    ("caption", "s20", 3.6, {"s": "FALLEN OFF: 11 TIMES", "size": 58, "y": 190, "delay": 2.2, "box": "#c2410c"}),
    ("caption", "s22", 3.4, {"s": "30 HORSES · 30 BOWS", "size": 56, "y": 190, "delay": 0.4}),
    # --- gods
    ("place", "g07", 4.0, {"name": "THE HOLLOW OAK", "sub": "“the Tree is speaking”", "delay": 1.2}),
    ("caption", "g13", 3.0, {"s": "PROPHET", "size": 100, "y": 210, "delay": 0.4, "box": "#ca8a04"}),
    ("place", "g14", 4.0, {"name": "THE DAWN HALL", "sub": "“the sun is a person”", "delay": 0.8}),
    ("caption", "g21", 3.6, {"s": "TAX: 10% · 10%", "size": 70, "y": 190, "delay": 0.6, "box": "#9a3412"}),
    ("peoples", "g19", None, {"items": [("VERDANE", "the wall is the bark · the Tree speaks", "#6fd27c"), ("AUREL", "the wall is the shadow · the Sun is watching", "#f2c14a")]}),
    # --- the vote
    ("caption", "v02", 3.2, {"s": "1 STAG · 11 FAMILIES · 2 DAYS", "size": 52, "y": 190, "delay": 3.8}),
    ("rule", "v06", None, {"n": "L", "l1": "THE LEAF LAW", "l2": "one Speaker · a Council of seven · a vote every 30 days"}),
    ("caption", "v09", 2.8, {"s": "IVY WINS · +3 VOTES", "size": 60, "y": 190, "delay": 0.1, "box": "#0f766e"}),
    ("caption", "v10", 2.8, {"s": "THE WARDENS · 30 ARCHERS", "size": 52, "y": 190, "delay": 1.5}),
    ("caption", "v19", 3.2, {"s": "SOL WINS · +11 VOTES", "size": 60, "y": 190, "delay": 0.0, "box": "#ca8a04"}),
    ("caption", "v21", 3.4, {"s": "KESH: RIDERS · DUNE: CAPTAIN", "size": 50, "y": 190, "delay": 0.6}),
    # --- the hunger
    ("caption", "u02", 3.4, {"s": "THE GREAT FIELD: GONE", "size": 60, "y": 190, "delay": 1.5, "box": "#7f1d1d"}),
    ("caption", "u06", 3.4, {"s": "400 → 260 SACKS", "size": 70, "y": 190, "delay": 3.0}),
    ("caption", "u07", 3.4, {"s": "140 SACKS MISSING", "size": 72, "y": 190, "delay": 0.0, "box": "#b91c1c"}),
    ("caption", "u14", 3.0, {"s": "“HE'S SOFT”", "size": 74, "y": 190, "delay": 1.8, "key": "corsivo_b"}),
    ("caption", "u16", 3.6, {"s": "FERN: 9 DAYS · 41 SAVED", "size": 56, "y": 190, "delay": 3.8, "box": "#15803d"}),
    ("caption", "u24", 3.0, {"s": "THE SPLINTER · 22", "size": 64, "y": 190, "delay": 0.3, "box": "#365314"}),
    ("caption", "u28", 3.4, {"s": "FIRST KILLED BY ANOTHER AI", "size": 52, "y": 190, "delay": 0.0, "box": "#7f1d1d"}),
    ("rule", "u32", None, {"n": "P", "l1": "THE STREAM PACT", "l2": "the Splinter keeps its grove · it fights with the forest on Day 365"}),
    # --- the coup
    ("caption", "k05", 3.4, {"s": "COUP · 11 MINUTES", "size": 72, "y": 190, "delay": 0.8, "box": "#7f1d1d"}),
    ("name", "k10", 3.4, {"name": "KESH", "role": "MARSHAL OF THE LIGHT", "c": "KESH", "delay": 0.2, "side": "right"}),
    ("caption", "k13", 3.4, {"s": "26 FARMERS LEAVE WITH SOL", "size": 52, "y": 190, "delay": 0.6}),
    ("caption", "k15", 3.2, {"s": "THE REAPERS · NO SPEAR · NO HORSE", "size": 50, "y": 190, "delay": 0.2, "box": "#a16207"}),
    ("caption", "k22", 3.4, {"s": "6 OF 7 SEATS", "size": 80, "y": 200, "delay": 0.6, "box": "#14532d"}),
    ("caption", "k24", 3.4, {"s": "THE ROOT COURT · THE RIGHT TO CALL TO ARMS", "size": 44, "y": 190, "delay": 0.2}),
    # --- the crack
    ("caption", "c03", 2.8, {"s": "A CRACK · ONE HAND WIDE", "size": 58, "y": 190, "delay": 0.2}),
    ("caption", "c10", 3.0, {"s": "6 HOURS OF TALKING", "size": 58, "y": 190, "delay": 0.4}),
    ("caption", "c13", 3.4, {"s": "84 DAYS TO GO", "size": 64, "y": 190, "delay": 1.0}),
    ("rule", "c21", None, {"n": 1, "l1": "THE REAPERS AND THE HEALERS MEET AT THE RIVER", "l2": "unarmed · white cloth on the arm"}),
    ("rule", "c22", None, {"n": 2, "l1": "NOBODY WEARING WHITE IS TOUCHED", "l2": "by either side"}),
    ("rule", "c23", None, {"n": 3, "l1": "ONE CITY. NOT TWO.", "l2": "built by whoever is left"}),
    ("caption", "c25", 3.0, {"s": "TREATY OF THE CRACK", "size": 66, "y": 190, "delay": 0.6, "box": "#0f766e"}),
    # --- the last night
    ("caption", "p02", 3.6, {"s": "120 TRAPS", "size": 80, "y": 190, "delay": 3.0}),
    ("caption", "p04", 3.4, {"s": "400 ARROWS · EVERY PLATFORM", "size": 54, "y": 190, "delay": 3.2}),
    ("caption", "p08", 3.6, {"s": "140 SPEARS · 30 SWORDS · 60 SHIELDS", "size": 46, "y": 190, "delay": 3.0}),
    ("caption", "p09", 3.0, {"s": "60 RIDERS", "size": 74, "y": 190, "delay": 3.6, "box": "#c2410c"}),
    # --- the winner
    ("winner", "e05", 6.4, {"name": "THE FOREST", "a": 61, "b": 34, "delay": 0.0}),
    ("comment", "e19", 6.0, {}),
]
KEY_OK = set()

# DAY counter marks (seg id, day) and timelapse ramps (from_seg, to_seg, d0, d1)
DAY_MARKS = [("r12", 0), ("n01", 1), ("n17", 5), ("n23", 5), ("s01", 12), ("s05", 14), ("s10", 16), ("s12", 23), ("s19", 30), ("s21", 38), ("s22", 40),
             ("g01", 61), ("g10", 70), ("g11", 79), ("g14", 84), ("g20", 100), ("v01", 111), ("v08", 120), ("v12", 130), ("v22", 150),
             ("u01", 170), ("u06", 174), ("u15", 180), ("u25", 200), ("u32", 203), ("k01", 226), ("k17", 240), ("k21", 251), ("k26", 270),
             ("c01", 281), ("c14", 291), ("c26", 318), ("p01", 330), ("p15", 364), ("w01", 365)]
DAY_RAMPS = [("n23", "s01", 5, 12), ("s12", "s19", 23, 30), ("s22", "g01", 40, 61), ("g14", "g20", 84, 100), ("g24", "v01", 100, 111), ("v22", "u01", 150, 170),
             ("u16", "u25", 181, 200), ("u34", "k01", 203, 226), ("k27", "c01", 270, 281), ("c14", "c26", 291, 318), ("c39", "p01", 318, 330), ("p01", "p15", 330, 364)]
# the HUD is hidden under cards/key moments (computed in finish.py); explicit extra windows:
HUD_HIDDEN = []

# populations: (seg, value) marks and ramps (from_seg, to_seg, p0, p1) for the forest (F) and the plain (P)
POP_F_MARKS = [("r12", 100), ("s22", 103), ("g13", 106), ("v10", 111), ("u16", 110), ("u28", 109), ("k01", 110), ("c01", 112), ("w01", 112), ("e04", 61)]
POP_F_RAMPS = [("s12", "s22", 100, 103), ("g01", "g13", 103, 106), ("v01", "v10", 106, 111), ("w05", "w62", 112, 61)]
POP_P_MARKS = [("r12", 100), ("s22", 104), ("g13", 108), ("v21", 113), ("u05", 108), ("k01", 108), ("c01", 110), ("p01", 114), ("w01", 114), ("e03", 34)]
POP_P_RAMPS = [("s10", "s22", 100, 104), ("g01", "g13", 104, 108), ("v01", "v21", 108, 113), ("u01", "u05", 113, 108), ("k17", "c01", 108, 110), ("c01", "p01", 110, 114), ("w05", "w62", 114, 34)]

# KEY moments (speeches, discoveries, deaths, the climax): [from_seg, to_seg) — no on-screen text and hero-quality shots
KEY = [
    ("h01", "r01"),            # cold open
    ("n03", "n06"),            # Wren climbs
    ("g02", "g07"),            # lightning, the Hollow Oak
    ("g10", "g15"),            # the eclipse, Lark
    ("v14", "v18"),            # Mara's promise, Sol's numbers
    ("u08", "u13"),            # the trial
    ("u21", "u24"),            # Thorn leaves
    ("u26", "u31"),            # Bark dies, Ivy's no
    ("k02", "k10"),            # the coup
    ("c02", "c10"),            # the crack, first words
    ("c14", "c20"),            # the secret meeting
    ("c32", "p01"),            # Kesh and Thorn
    ("p15", "p25"),            # the last night
    ("w01", "e04"),            # day 365
    ("e07", "e13"),            # the handshake
]

# hero-quality (DOF, native res) only where it matters most; everything else is the normal pipeline
HERO = [("h01", "r01"), ("w44", "w46"), ("w51", "w57"), ("e07", "e13")]
