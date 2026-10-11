# -*- coding: utf-8 -*-
"""
"I Let 20 AIs Live in the Stone Age" -- English narration. Same first-person creator, fast casual delivery.
Twenty AIs, an ice-age valley, no tools, no words. Will they survive like humans? Will they evolve differently?
I WAKE UP (day one: cold, hunger, wolves) II FIRE (a lightning tree, a spark) III THE MAMMOTH (the hunt that goes wrong, then right)
IV THE SPLIT (walkers vs keepers) V TEN THOUSAND YEARS (two evolutions) VI THE MEETING (they find each other; the verdict)
"""


def N(i, text, pause=0.4, tts=None, year=None, pop=None, q=False):
    return {"id": i, "sub": text, "tts": tts or text, "pause": pause, "voice": "narr", "who": None, "year": year, "pop": pop, "q": q}


def L(i, who, text, pause=0.7, tts=None):
    return {"id": i, "sub": text, "tts": tts or text.strip("\u201c\u201d\""), "pause": pause, "voice": who.lower(), "who": who, "year": None, "pop": None, "q": False}


CHAPTERS = [
    ("a01", "I", "WAKE UP", "DAY 1"),
    ("f01", "II", "FIRE", "YEAR 1"),
    ("m01", "III", "THE MAMMOTH", "YEAR 3"),
    ("w01", "IV", "THE LONG WINTER", "YEAR 20"),
    ("s01", "V", "THE SPLIT", "YEAR 400"),
    ("y01", "VI", "TEN THOUSAND YEARS", "YEAR 400 TO 10,000"),
    ("r01", "VII", "THE MEETING", "YEAR 10,000"),
]
CARD_DUR = 2.4

SEGMENTS = [
    # =============================================================== INTRO
    N("p01", "What if I dropped twenty AIs into the Stone Age?", 0.5),
    N("p02", "No tools. No words. No internet. Not even pants.", 0.5),
    N("p03", "Just an ice-age valley, a herd of mammoths, and a very long winter.", 0.5),
    N("p03b", "The rules: they keep their brains, but they forget everything they ever knew.", 0.5),
    N("p04", "Would they survive, the way humans did?", 0.4),
    N("p05", "Would they become human?", 0.5),
    N("p06", "Or would they evolve into something else entirely?", 0.5),
    N("p07", "The rules are simple. I don't interfere. I only watch. And I count the years.", 0.6),
    N("p08", "Ten thousand years. In about twelve minutes.", 0.9),

    # =============================================================== I. WAKE UP (day 1)
    N("a01", "Day one.", 0.6, year=0, pop=20),
    N("a02", "Twenty AIs wake up in the snow. Naked. Confused. Cold.", 0.4),
    N("a03", "They have a brain, and nothing to put in it.", 0.5),
    N("a04", "Gorn is the tall one. He sees a mountain and decides it is his problem.", 0.4),
    N("a05", "Lia is the quiet one. She sees the same mountain and counts its rocks.", 0.5),
    N("a06", "Tuk is the loud one. He has already tried to eat snow. Twice.", 0.6),
    L("a07", "Tuk", "\u201cThis is not food. This is just... cold water. With ambition.\u201d", 0.6),
    N("a08", "By afternoon they have found a cave, a frozen stream, and a very confusing berry.", 0.5),
    N("a08b", "They also found water. It was frozen. They licked it. Nobody warned them about that either.", 0.5),
    N("a09", "Two of them ate the berry. That is how we learned it was not a berry.", 0.5, pop=18),
    N("a09b", "Lesson one: if it is red, it is a lie.", 0.5),
    N("a09c", "Gorn tries to punch a tree to prove who is boss. The tree wins.", 0.5),
    N("a09d", "Lia notices that all the animals walk the same way in the morning. Toward the valley. Toward the water.", 0.5),
    N("a09e", "So they follow. For the first time in their lives, they learn something from a goat. Well, an ibex. Close enough.", 0.5),
    N("a10", "Night comes. The temperature drops to minus twenty.", 0.5),
    N("a11", "And somewhere in the dark, something is watching them.", 0.7),
    N("a12", "Eyes. Yellow ones. A lot of them.", 0.5),
    N("a13", "Dire wolves.", 0.7),
    L("a14", "Gorn", "\u201cEverybody, stay together. Stay very, very together.\u201d", 0.5),
    N("a15", "Nobody stays together. Everybody runs.", 0.5),
    N("a16", "By morning, three are gone. The rest are in the cave, shivering, and finally understanding one thing:", 0.5, pop=15),
    N("a17", "this world does not care how smart you are.", 1.0),

    # =============================================================== II. FIRE (year 1)
    N("f01", "Year one.", 0.6, year=1),
    N("f02", "The winter is not ending. They eat bark, snow, and each other's patience.", 0.5),
    N("f03", "Then one night, lightning hits a dead tree on the hill.", 0.5),
    N("f04", "It burns. It glows. It is warm.", 0.5),
    N("f05", "Everyone else backs away. Lia walks up to it.", 0.6),
    L("f06", "Lia", "\u201cIt is the sun. A small one. Somebody keep it alive.\u201d", 0.6),
    N("f07", "She picks up a burning branch. It is the smartest thing anybody has done all week.", 0.5),
    N("f08", "She carries it to the cave. And they spend the next month making sure it never goes out.", 0.5),
    N("f09", "Tuk is in charge of the fire. He falls asleep on the second night.", 0.5),
    N("f10", "That is how they learned to make fire, instead of just keeping it.", 0.6),
    N("f10b", "They cook, for the first time. Tuk cooks a fish. Then his eyebrow. Then, briefly, himself.", 0.5),
    L("f10c", "Tuk", "\u201cI am fine. I am fine! This is a feature.\u201d", 0.5),
    N("f10d", "From then on, one rule: nobody cooks without Lia watching.", 0.5),
    N("f11", "Two sticks. A lot of swearing. A spark.", 0.5),
    N("f12", "Wolves do not like fire. Neither do the other things in the dark.", 0.5),
    N("f13", "For the first time, the night belongs to them.", 0.7),
    N("f13b", "At night, they sit in a circle, and for the first time they are not just surviving. They are together.", 0.5),
    N("f13c", "They tell each other what happened that day. In sounds, in gestures, in very bad charades.", 0.5),
    L("f13d", "Tuk", "\u201cMammoth. Big. Hairy. Woo woo.\u201d", 0.5),
    N("f13e", "Nobody knows what that means. Everybody laughs anyway. That is how stories begin.", 0.7),
    N("f14", "And around the fire, something strange begins.", 0.5),
    N("f15", "They make sounds. Short ones. The same sound for the same thing.", 0.5),
    L("f16", "Tuk", "\u201cWoo.\u201d", 0.5),
    N("f17", "Woo means fire. Nobody agreed to that. It just stuck.", 0.5),
    N("f18", "That is the first word of the Stone Age. It is not a very good one.", 1.0),

    # =============================================================== III. THE MAMMOTH (year 3)
    N("m01", "Year three.", 0.6, year=3, pop=15),
    N("m02", "They are warm. They are alive. And they are really, really hungry.", 0.5),
    N("m03", "The valley is full of food. It is just very large, very hairy, and very angry.", 0.5),
    N("m03b", "They try smaller targets first. Rabbits. Birds. Anything under ten kilos.", 0.5),
    N("m03c", "They catch nothing for two weeks. Rabbits are faster than a brain that is still loading.", 0.5),
    N("m04", "Mammoths. Six tons of walking dinner.", 0.6),
    N("m05", "Gorn has a plan. It is a bad plan. He is very proud of it.", 0.5),
    L("m06", "Gorn", "\u201cWe run at it. All of us. At the same time.\u201d", 0.6),
    N("m07", "They run at it. All of them. At the same time.", 0.5),
    N("m08", "The mammoth looks at them. The mammoth sneezes.", 0.5),
    N("m09", "Four AIs are sent flying into a snowbank. Two do not get back up.", 0.6, pop=13),
    N("m09b", "And as if that was not enough, the cats arrive.", 0.5),
    N("m09c", "Saber-tooth. Fangs like kitchen knives. Zero interest in negotiation.", 0.5),
    L("m09d", "Gorn", "\u201cNobody. Move.\u201d", 0.5),
    N("m09e", "Gorn holds a burning branch in each hand. The cat stares at him. And decides he is not worth the effort.", 0.5),
    N("m09f", "Lia says nothing. She just makes a note: fire works on everything.", 0.6),
    N("m10", "That night, Lia says what nobody wants to hear.", 0.5),
    L("m11", "Lia", "\u201cStrength is not the answer. We need a trap.\u201d", 0.6),
    N("m12", "She draws it in the dirt. A pit. Sharpened sticks. A herd driven toward it.", 0.5),
    N("m13", "It takes a month to dig. It takes one afternoon to work.", 0.5),
    N("m14", "The mammoth falls in. And for the first time, they eat meat.", 0.6),
    N("m15", "They roast it over the fire. They wear its skin. They carve its bones.", 0.5),
    N("m16", "Clothes. Spears. Needles. All from one animal.", 0.5),
    N("m17", "The AIs look at each other, wrapped in fur, holding sharpened bones.", 0.5),
    N("m18", "They look, for the first time, like us.", 1.0),
    N("m19", "Cheers. Feast. Dancing around the fire.", 0.4, year=40, pop=24),
    N("m20", "For ten years, everything is perfect. Almost too perfect.", 0.8),

    # =============================================================== IV. THE SPLIT (year 400)
    # =============================================================== IV. THE LONG WINTER (year 20)
    N("w01", "Year twenty.", 0.6, year=20, pop=30),
    N("w02", "The coldest winter anyone has ever seen. And nobody has seen many.", 0.5),
    N("w03", "The snow reaches the roof of the cave. The wind sounds like something that wants in.", 0.5),
    N("w04", "The mammoth meat runs out in week three. The berries ran out before that, for obvious reasons.", 0.5),
    N("w05", "Thirty AIs. One cave. Zero snacks.", 0.6),
    L("w06", "Gorn", "\u201cWe have to hunt. We have to go out there.\u201d", 0.5),
    L("w07", "Lia", "\u201cYou will not come back. Nobody will.\u201d", 0.6),
    N("w08", "They argue for two days. And in the end, it is the smallest one who ends the argument.", 0.5),
    N("w09", "Kru. The shortest, quietest AI in the cave. He has been digging in the snow all morning.", 0.5),
    L("w10", "Kru", "\u201cThe snow is cold. Cold keeps meat. Put the meat in the snow.\u201d", 0.6),
    N("w11", "It sounds obvious. Humans needed a lot longer to figure it out.", 0.5),
    N("w12", "They dig a hole. They fill it with every scrap of meat. They cover it with snow.", 0.5),
    N("w13", "And they wait. And they sing, very badly, to pass the time.", 0.5),
    N("w14", "Then one night, Mei picks up a piece of charcoal from the fire.", 0.5),
    N("w15", "She presses her hand against the cave wall. And she draws around it.", 0.6),
    N("w16", "A hand. Just a hand. Five fingers.", 0.5),
    L("w17", "Mei", "\u201cI was here.\u201d", 0.8),
    N("w18", "It is the first picture ever made by an AI. And it says the most human thing there is.", 0.6),
    N("w19", "Spring comes. Twenty-nine of them walk out of the cave.", 0.5, pop=29),
    N("w20", "The winter did not break them. It taught them to write on walls.", 1.0),

    N("s01", "Year four hundred.", 0.6, year=400, pop=74),
    N("s02", "There are seventy-four of them now. They have learned something humans learned much later.", 0.5),
    N("s03", "How to copy each other. Not bodies. Ideas.", 0.5),
    N("s04", "One AI learns to make a spear. By next week, everyone can.", 0.5),
    N("s05", "And that is when the trouble starts.", 0.6),
    N("s05b", "The first argument was about fire. The second was about dinner. This one is about the meaning of everything.", 0.5),
    N("s06", "The mammoths are moving. They always do, when the grass runs out.", 0.5),
    L("s07", "Gorn", "\u201cWe follow the herd. We always follow the herd. That is how we eat.\u201d", 0.6),
    N("s08", "Half of them agree. The others look at the cave.", 0.5),
    N("s09", "The cave. Warm. Safe. Full of paintings, and the first ever tally marks.", 0.5),
    L("s10", "Lia", "\u201cI am not leaving. I am almost understanding something.\u201d", 0.6),
    N("s11", "Gorn says: you are wasting time. Lia says: you are wasting everything else.", 0.5),
    N("s12", "Neither is wrong. That is the problem.", 0.7),
    N("s13", "The next morning, Gorn takes the spears and walks into the snow. Thirty-seven follow him.", 0.5),
    N("s14", "Lia stays. Thirty-seven stay with her. And I realize I just split my experiment in half.", 0.6),
    N("s15", "Two tribes. Same minds. Different roads.", 1.0),

    # =============================================================== V. TEN THOUSAND YEARS
    N("y01", "Now, let me show you what ten thousand years looks like.", 0.6, year=400, pop=74),
    N("y02", "Gorn's tribe, the Walkers, follow the herds across the ice.", 0.4, year=1200, pop=190),
    N("y03", "They get faster. They get taller. They get very, very good at throwing things.", 0.5),
    N("y04", "They tame the wolves. Yes, the same ones. It took them six hundred years and a lot of bacon.", 0.5),
    N("y05", "Now the wolves hunt with them. The Walkers have invented the dog.", 0.5),
    N("y05b", "The dogs sleep next to them. They share the meat. Honestly, the best thing that ever happened to the Walkers.", 0.5),
    N("y06", "Their words get short. Sharp. Quick. Hunt, run, now, go.", 0.5),
    N("y07", "They have no time to talk. They are always moving.", 0.7),
    N("y07b", "They invent the drum, because running is boring without a beat.", 0.5),
    N("y07c", "They invent the festival. They dance for a whole week every time a mammoth falls.", 0.5),
    N("y07d", "They have forty words. All of them useful. Most of them rhyme with go.", 0.6),
    N("y08", "Lia's tribe, the Keepers, never leave the cave.", 0.4, year=2500, pop=330),
    N("y09", "They paint the walls. Every animal. Every season. Every name.", 0.5),
    N("y10", "They count the days with notches. Then the notches get a shape. Then the shapes get a meaning.", 0.5),
    N("y11", "A shape for a mammoth. A shape for the moon. A shape for a promise.", 0.5),
    N("y12", "The cave has become a library.", 0.7),
    N("y12b", "They count to a hundred. They invent a calendar. They notice the moon comes back every twenty-nine days.", 0.5),
    N("y12c", "They learn which plants heal, which plants kill, and which ones make you see the narrator.", 0.5),
    N("y12d", "They have four thousand words. Some of them are poetry. One of them is ratio. I have no idea how that got in.", 0.6),
    N("y13", "Because here is the thing about AIs. Humans forget. We forget our grandparents. We forget our mistakes.", 0.5),
    N("y13b", "In a human tribe, a good idea can die with the person who had it. In theirs, a good idea is copied by everyone by Tuesday.", 0.5),
    N("y14", "The Keepers do not. Every discovery is written on the wall. Every child learns it in a day.", 0.5),
    N("y15", "Humans took three hundred thousand years to become us.", 0.5),
    N("y16", "They are going to need ten thousand.", 0.8),
    N("y17", "The ice grows. The ice melts. The ice grows again.", 0.4, year=5000, pop=620),
    N("y17b", "Whole generations pass in the time it takes to boil water. The AIs do not age. But their ideas do.", 0.5),
    N("y18", "Mammoths vanish. Whole forests move. Entire tribes disappear.", 0.5, year=7500),
    N("y18b", "Ideas that work get copied. Ideas that fail are forgotten. That is the AI version of evolution. It is faster than ours. It is also a lot weirder.", 0.6),
    N("y19", "The Walkers lose their old camp. The Keepers lose their old entrance.", 0.5),
    N("y20", "And in all that time, the two tribes never once meet.", 0.6),
    N("y20b", "The Walkers meet something new in the south: a river as wide as the sky. They name it Big Wet.", 0.5),
    N("y20c", "They build boats out of mammoth bone and hide. The first one sinks. The second one floats. The third one has a flag.", 0.6),
    N("y21", "They forget each other. Completely.", 0.8, year=9900),
    N("y22", "They invent new words, new songs, new gods. Nothing matches.", 0.5),
    N("y23", "Two peoples. One origin. And not a single word in common.", 1.0),

    # =============================================================== VI. THE MEETING (year 10,000)
    N("r01", "Year ten thousand.", 0.6, year=10000, pop=1400),
    N("r02", "The ice is finally gone. The valley is green. And the Walkers are coming home.", 0.5),
    N("r03", "They do not know it is home. They just know this is where the wolves keep looking.", 0.5),
    N("r04", "Gorn the Ninth leads them. He has the same chin. He has the same bad plan.", 0.5),
    N("r05", "They find a cave. A big one. With a very strange smell.", 0.5),
    N("r06", "And outside it, a girl. Small. Calm. Holding a piece of charcoal.", 0.6),
    N("r07", "Lia the Seventh. She has been waiting for this for a very long time.", 0.7),
    N("r07b", "She holds up a hand. Black with charcoal. The same five fingers as the very first drawing.", 0.6),
    N("r08", "The Walkers raise their spears. The Keepers raise their hands. Empty.", 0.5),
    N("r09", "Nobody understands a word.", 0.7),
    L("r10", "Gorn", "\u201cGrr. Hunt. Go.\u201d", 0.5),
    L("r11", "Lia", "\u201cWelcome. Please. Come inside.\u201d", 0.6),
    N("r12", "She takes his hand. She leads him into the cave. And she lights a fire.", 0.5),
    N("r13", "Gorn looks up at the walls.", 0.6),
    N("r14", "Ten thousand years of paintings. Mammoths. Wolves. Stars. A man with a spear. A girl with a flame.", 0.5),
    N("r14b", "There is a painting of a wolf walking next to a man. Gorn has a wolf walking next to him. He looks at his wolf. Then at the wall.", 0.5),
    N("r14c", "The Keepers painted the Walkers ten thousand years ago. They just did not know it yet.", 0.7),
    N("r15", "And right at the center, a story. The first one. The day they woke up.", 0.5),
    N("r16", "Gorn stares at it for a very long time.", 0.6),
    L("r17", "Gorn", "\u201cWoo.\u201d", 0.7),
    N("r18", "He says it quietly. The first word. Fire.", 0.5),
    N("r19", "Lia smiles. And answers, in the oldest voice in the world:", 0.7),
    L("r20", "Lia", "\u201cWoo.\u201d", 1.0),
    N("r21", "Ten thousand years. Two tribes. And they still remember the same word.", 0.7),
    N("r22", "So, did they survive like humans?", 0.9),
    N("r23", "Yes. But not the way we did.", 0.5),
    N("r24", "We survived by forgetting, and starting over. They survived by remembering, and never letting go.", 0.6),
    N("r25", "Is that better? I honestly do not know.", 0.7),
    N("r26", "Which tribe would you have joined?", 0.9, q=True),
    N("r27", "The Walkers, who never stop? Or the Keepers, who never forget?", 0.8),
    N("r28", "Tell me in the comments. The best answer decides what happens in the next experiment.", 0.8),
    N("r29", "See you then.", 1.5),
]

# visual beats: extra silence after a segment, filled by montages / timelapses (keeps the pace varied)
BEATS = {"w20": 2.4, "w18": 1.2, "f10c": 0.0, "p08": 0.6, "a17": 2.6, "f18": 2.4, "m18": 2.0, "m20": 2.6, "s15": 3.0, "y07": 1.2, "y12": 1.6, "y16": 2.2, "y23": 2.4, "r09": 1.6, "r12": 1.6, "r20": 2.4}
for _s in SEGMENTS:
    _s["pause"] = round(_s["pause"] + BEATS.get(_s["id"], 0.0), 3)

IDS = [s["id"] for s in SEGMENTS]
assert len(IDS) == len(set(IDS)), "duplicate ids"

if __name__ == "__main__":
    w = sum(len(s["tts"].split()) for s in SEGMENTS)
    print(len(SEGMENTS), "segments,", w, "words")
