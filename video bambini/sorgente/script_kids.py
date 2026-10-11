# -*- coding: utf-8 -*-
"""
"Learn Colors, Numbers & Animals with the Little AIs!" -- an 8-minute video for small children (2-6).
Ten Little AIs, one for each colour, on a sunny meadow. A warm narrator talks to the child, asks questions and
leaves real pauses for the answer. Chapters: COLORS (+ a find-the-colour game), NUMBERS (count to ten, rocket
countdown), ANIMALS (farm animals and their sounds, a surprise mammoth), OPPOSITES (big/small, fast/slow, up/down,
happy/sad, day/night), HIDE AND SEEK (where is Purple?), GOODBYE.

Segment: id, voice ('narr', 'chorus' or a kid's colour), subtitle, tts text, pause after (s), gfx (overlay cue).
"""

KIDS = ["red", "orange", "yellow", "green", "blue", "purple", "pink", "brown", "white", "black"]
HEX = {"red": "#ff3b30", "orange": "#ff9500", "yellow": "#ffd60a", "green": "#34c759", "blue": "#0a84ff", "purple": "#af52de",
       "pink": "#ff6fb5", "brown": "#a2703f", "white": "#ffffff", "black": "#2b2b2b"}


def N(i, text, pause=0.5, tts=None, gfx=None, voice="narr"):
    return {"id": i, "sub": text, "tts": tts or text, "pause": pause, "voice": voice, "gfx": gfx}


def K(i, who, text, pause=0.4, tts=None, gfx=None):
    return N(i, text, pause, tts, gfx, voice=who)


CHAPTERS = [   # first segment id, title, colour
    ("c00", "COLORS", "#ff3b30"),
    ("q00", "COLOR GAME", "#af52de"),
    ("n00", "NUMBERS", "#0a84ff"),
    ("a00", "ANIMALS", "#34c759"),
    ("o00", "OPPOSITES", "#ff9500"),
    ("h00", "HIDE AND SEEK", "#ff6fb5"),
    ("d00", "DANCE PARTY", "#34c759"),
    ("g00", "GOODBYE", "#ffd60a"),
]
CARD_DUR = 3.0

COLORS = [  # colour, what it is like, praise
    ("red", "Red, like a yummy red apple!", "apple", "Great job!"),
    ("orange", "Orange, like a juicy orange!", "orange", "Well done!"),
    ("yellow", "Yellow, like the bright yellow sun!", "sun", "Yes! Super!"),
    ("green", "Green, like the grass and the leaves!", "leaf", "Wonderful!"),
    ("blue", "Blue, like the big blue sky!", "cloud_sky", "Great job!"),
    ("purple", "Purple, like sweet purple grapes!", "grapes", "Fantastic!"),
    ("pink", "Pink, like a pretty pink flower!", "flower", "Well done!"),
    ("brown", "Brown, like a chocolate cookie!", "cookie", "Yummy! Great job!"),
    ("white", "White, like a soft, fluffy cloud!", "cloud", "Super!"),
    ("black", "Black, like the night sky, full of twinkly stars!", "stars", "Wonderful!"),
]
HELLO = {"red": "Hi! I'm Red!", "orange": "Hello! I'm Orange!", "yellow": "Hi hi! I'm Yellow!", "green": "Hey there! I'm Green!",
         "blue": "Hello! I'm Blue!", "purple": "Hi! I'm Purple!", "pink": "Hello, friends! I'm Pink!", "brown": "Hi! I'm Brown!",
         "white": "Hello! I'm White!", "black": "Hi! I'm Black!"}

ANIMALS = [  # animal, sound (subtitle, tts), who greets it, greeting
    ("cow", ("Moo!", "Moooo!"), "red", "Hello, cow!"),
    ("sheep", ("Baa!", "Baaaa!"), "pink", "So fluffy!"),
    ("horse", ("Neigh!", "Neeeigh!"), "blue", "Hello, horse!"),
    ("goat", ("Maa!", "Maaaa!"), "yellow", "Hee hee! Hello, goat!"),
    ("dog", ("Woof! Woof!", "Woof! Woof!"), "green", "Good doggy!"),
]
LOVES = {"red": ("I love to jump!", "jump"), "orange": ("I love to dance!", "dance"), "yellow": ("I love the sunshine!", "sun"),
         "green": ("I love to run!", "run"), "blue": ("I love to wave hello!", "wave"), "purple": ("I love to spin around!", "spin"),
         "pink": ("I love flowers!", "flower"), "brown": ("I love cookies! Yum!", "eat"), "white": ("I love to sleep. Zzz...", "sleep"),
         "black": ("I love the twinkly stars!", "stars")}
NUMW = ["One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten"]

SEGMENTS = [
    # ================================================================ INTRO
    N("i01", "Hello, friends! Welcome to the sunny meadow!", 0.6),
    N("i02", "Look who's here... It's the Little AIs!", 0.5),
    N("i03", "Hi, friends!", 0.6, voice="chorus"),
    N("i04", "Today we are going to learn colors, count to ten, and meet some funny animals!", 0.6),
    N("i05", "Are you ready? Let's go!", 0.8),
]
# ================================================================ COLORS
SEGMENTS += [N("c00", "First, let's learn our colors! Every Little AI has a different color. Let's meet them!", 0.7)]
for k, (c, like, icon, praise) in enumerate(COLORS):
    SEGMENTS += [
        K(f"c{k + 1:02d}a", c, HELLO[c], 0.35, gfx={"type": "color", "color": c, "icon": icon}),
        N(f"c{k + 1:02d}b", like, 0.45, gfx={"type": "color", "color": c, "icon": icon}),
        N(f"c{k + 1:02d}c", f"Can you say {c}?", 1.7, gfx={"type": "say", "color": c}),
        N(f"c{k + 1:02d}d", f"{c.capitalize()}! {praise}", 0.5, gfx={"type": "star", "color": c}),
        K(f"c{k + 1:02d}e", c, LOVES[c][0], 0.8),
    ]
SEGMENTS += [
    N("c90", "Wow! Now we know ten colors!", 0.4),
    N("c91", "Red, orange, yellow, green, blue, purple, pink, brown, white, and black!", 0.9, gfx={"type": "rainbow"}),
]
# ================================================================ COLOR GAME
SEGMENTS += [N("q00", "Let's play a game! Can you find the right Little AI?", 0.6)]
for k, (c, hint) in enumerate([("green", "Green, like the grass!"), ("pink", "Pink, like a flower!"), ("blue", "Blue, like the sky!")]):
    SEGMENTS += [
        N(f"q{k + 1}a", f"Where is {c}? Can you find {c}?", 2.2, gfx={"type": "find", "color": c}),
        N(f"q{k + 1}b", f"There it is! {hint}", 0.4, gfx={"type": "found", "color": c}),
        K(f"q{k + 1}c", c, "That's me!", 0.6),
    ]
# ================================================================ NUMBERS
SEGMENTS += [N("n00", "Now let's count the Little AIs! They will jump in, one by one. Count with me!", 0.8)]
for k, w in enumerate(NUMW):
    SEGMENTS += [N(f"n{k + 1:02d}", f"{w}!", 0.75, gfx={"type": "num", "n": k + 1, "color": KIDS[k]})]
SEGMENTS += [
    N("n11", "Ten Little AIs! Hooray!", 0.3, gfx={"type": "num", "n": 10, "color": "yellow", "hold": True}),
    N("n12", "Hooray!", 0.8, voice="chorus"),
    N("n12b", "Let's count again! This time, clap with me!", 0.6),
    N("n12c", "One! Two! Three! Four! Five! Six! Seven! Eight! Nine! Ten!", 0.8, gfx={"type": "claps"}),
    N("n13", "Now let's count backwards, like a rocket! Ready?", 0.7),
    N("n14", "Ten! Nine! Eight! Seven! Six! Five! Four! Three! Two! One!", 0.3, gfx={"type": "countdown"}),
    N("n15", "Blast off!", 1.2, gfx={"type": "blast"}),
    N("n16", "Wheee!", 0.8, voice="chorus"),
]
# ================================================================ ANIMALS
SEGMENTS += [N("a00", "The Little AIs are going for a walk to the farm. Let's see who lives there!", 0.8)]
for k, (an, (sound, sound_tts), who, hi) in enumerate(ANIMALS):
    SEGMENTS += [
        N(f"a{k + 1}a", f"Look! Who's that? It's a {an}!", 0.4, gfx={"type": "animal", "name": an}),
        N(f"a{k + 1}b", f"What does the {an} say?", 1.5, gfx={"type": "animal", "name": an}),
        N(f"a{k + 1}c", sound, 0.5, tts=sound_tts, gfx={"type": "sound", "text": sound.upper()}),
        K(f"a{k + 1}d", who, hi, 0.7),
    ]
SEGMENTS += [
    N("a5e", "And look over there, near the trees! It's a deer! Deer are very quiet. Shhh!", 0.9, gfx={"type": "animal", "name": "deer"}),
    N("a5f", "Blue is riding the horse! Giddy up, horse!", 0.4),
    K("a5g", "blue", "Wheee! This is fun!", 0.8),
    N("a6a", "How many sheep can you see? Let's count!", 0.5),
    N("a6b", "One... two... three! Three sheep!", 0.8, gfx={"type": "count3"}),
    N("a7a", "Oh! What's that big, hairy animal? It's a woolly mammoth!", 0.5, gfx={"type": "animal", "name": "mammoth"}),
    N("a7b", "What does the mammoth say?", 1.4, gfx={"type": "animal", "name": "mammoth"}),
    N("a7c", "Pawoooo!", 0.4, tts="Pa-woooooo!", gfx={"type": "sound", "text": "PAWOOO!"}),
    N("a7d", "Whoa! So big!", 0.9, voice="chorus"),
]
# ================================================================ OPPOSITES
SEGMENTS += [
    N("o00", "Now let's learn opposites!", 0.6),
    N("o01", "The mammoth is big. The goat is small.", 0.4, gfx={"type": "opp", "a": "BIG", "b": "SMALL"}),
    N("o02", "Big... and small!", 0.8, gfx={"type": "opp", "a": "BIG", "b": "SMALL"}),
    N("o03", "Red runs fast! Brown walks slow.", 0.4, gfx={"type": "opp", "a": "FAST", "b": "SLOW"}),
    N("o04", "Fast... and slow!", 0.8, gfx={"type": "opp", "a": "FAST", "b": "SLOW"}),
    N("o05", "Blue jumps up! And now, Blue sits down.", 0.4, gfx={"type": "opp", "a": "UP", "b": "DOWN"}),
    N("o06", "Up... and down!", 0.8, gfx={"type": "opp", "a": "UP", "b": "DOWN"}),
    N("o07", "Yellow is happy! But Orange is sad. Oh no!", 0.5, gfx={"type": "opp", "a": "HAPPY", "b": "SAD"}),
    N("o08", "Let's give Orange a big hug!", 0.6),
    K("o09", "orange", "Thank you! Now I'm happy!", 0.8),
    N("o10", "Look at the sun. It's daytime...", 0.4, gfx={"type": "opp", "a": "DAY", "b": "NIGHT"}),
    N("o11", "and now the sun goes down. It's nighttime! Day... and night!", 1.0, gfx={"type": "opp", "a": "DAY", "b": "NIGHT"}),
]
# ================================================================ HIDE AND SEEK
SEGMENTS += [
    N("h00", "Good morning! Let's play hide and seek! Purple is hiding. Where is Purple?", 0.6),
    N("h01", "Is Purple behind the big rock?", 1.2),
    N("h02", "No! Not behind the rock.", 0.5),
    N("h03", "Is Purple behind the tree?", 1.2),
    N("h04", "Yes! Peekaboo!", 0.4),
    K("h05", "purple", "Peekaboo! You found me!", 0.7),
    N("h06", "Now Green is hiding! Where is Green? Is Green behind the cow?", 1.3),
    N("h07", "Yes! There's Green!", 0.4),
    K("h08", "green", "You found me too! Hee hee!", 0.9),
]
# ================================================================ DANCE PARTY
SEGMENTS += [
    N("d00", "Now it's time for a dance party! Everybody, dance with the Little AIs!", 0.5),
    N("d01", "Jump! Jump! Jump!", 0.6, gfx={"type": "dance", "word": "JUMP!"}),
    N("d02", "Clap your hands!", 0.6, gfx={"type": "dance", "word": "CLAP!"}),
    N("d03", "Spin around!", 0.6, gfx={"type": "dance", "word": "SPIN!"}),
    N("d04", "And wave your arms up high!", 0.8, gfx={"type": "dance", "word": "WAVE!"}),
    N("d05", "Yay!", 1.0, voice="chorus"),
]
# ================================================================ GOODBYE
SEGMENTS += [
    N("g00", "What a wonderful day! We learned colors, numbers, animals, and opposites!", 0.6),
    N("g01", "Let's say our colors one more time, all together!", 0.5),
    N("g02", "Red! Orange! Yellow! Green! Blue! Purple! Pink! Brown! White! Black!", 0.9, voice="chorus", gfx={"type": "rainbow"}),
    N("g03", "You were amazing today! Give yourself a big clap!", 0.9),
    N("g04", "Time to say goodbye. Wave bye-bye to the Little AIs!", 0.6),
    N("g05", "Bye-bye, friends! See you next time!", 1.0, voice="chorus"),
]
