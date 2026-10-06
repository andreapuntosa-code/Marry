# -*- coding: utf-8 -*-
"""
"I Put 100 AIs in an Arena. Only One Walks Out." — English narration, ~20 minutes.
Hunger-Games-style survival: 100 AIs, 100 days, six worlds around a golden Horn, a dome that closes,
alliances, betrayals, a Gamemaker (me) who controls the weather but never who lives. PG-13: stars go dark.

Segment ids: h=cold open, r=rules, b=bloodbath, f=first weeks, a=alliances, g=gamemaker, x=the door,
t=the fort, l=the last six, w=day 100, e=epilogue.

Narration is slow on purpose (speed ~0.8 + real pauses). Questions carry q=True: they get a rising
intonation, a breath of silence before and a long pause after.
"""


def N(i, text, pause=0.7, tts=None, day=None, q=False, pre=0.0):
    return {"id": i, "sub": text, "tts": tts or text, "pause": pause, "pre": pre, "voice": "narr", "who": None, "day": day, "q": q}


def Q(i, text, pause=2.4, tts=None, day=None):
    """a question to the viewer: silence before, rising pitch, long silence after"""
    return {"id": i, "sub": text, "tts": tts or text, "pause": pause, "pre": 0.9, "voice": "narr", "who": None, "day": day, "q": True}


def L(i, who, text, pause=0.9, tts=None):
    return {"id": i, "sub": text, "tts": tts or text.strip("“”\""), "pause": pause, "pre": 0.15, "voice": who.lower(), "who": who, "day": None, "q": False}


CHAPTERS = [
    ("r01", "I", "THE RULES", "DAY 0"),
    ("b01", "II", "THE HORN", "DAY 0"),
    ("f01", "III", "SIX WORLDS", "DAY 2"),
    ("a01", "IV", "ALLIANCES", "DAY 21"),
    ("g01", "V", "THE GAMEMAKER", "DAY 45"),
    ("x01", "VI", "THE DOOR", "DAY 61"),
    ("t01", "VII", "THE FORT", "DAY 76"),
    ("l01", "VIII", "THE LAST SIX", "DAY 90"),
    ("w01", "IX", "DAY 100", "THE LAST ONE STANDING"),
]
CARD_DUR = 2.6

# alive population over the days: (day, alive). The HUD steps to the next value on the day a death is narrated.
ALIVE = [(0, 100), (1, 69), (6, 58), (10, 50), (20, 38), (22, 37), (30, 31), (33, 30), (40, 27), (45, 20), (50, 19), (52, 18), (58, 16),
         (68, 15), (72, 14), (76, 14), (79, 10), (80, 10), (81, 6), (92, 5), (95, 4), (96, 3), (99, 1)]

SEGMENTS = [
    # =============================================================== COLD OPEN
    N("h01", "A hundred AIs. One arena.", 0.9),
    N("h02", "No way out. No second chances.", 0.9),
    N("h03", "This is the last day of the game.", 1.0),
    N("h04", "Only one of them is still standing.", 1.4),
    Q("h05", "Which one?", 2.2),
    N("h06", "A hundred days ago, every one of them was standing right here.", 0.8),
    N("h07", "Look at them. Take your time. Pick a favorite.", 1.2),
    N("h08", "Because by the end of this video... ninety-nine of them will be gone.", 1.0),
    N("h09", "And I'm going to show you how.", 1.4),

    # =============================================================== I. THE RULES  (day 0)
    N("r01", "Welcome to the experiment.", 0.8),
    N("r02", "I built an arena. A kilometer wide, sealed under a dome of glass.", 0.8),
    N("r03", "In the middle, there's the Horn. A golden spiral, taller than a house.", 0.8),
    N("r04", "Around it, five worlds. A forest. A swamp. A desert. A lake. And a mountain of ice.", 0.9),
    N("r05", "Inside, a hundred AIs. Same body. Same brain. Different number.", 0.9),
    N("r06", "They can run, climb, swim, make fire, tie a rope.", 0.6),
    N("r07", "I didn't teach them to fight. I'm pretty sure they'll figure it out.", 1.1),
    N("r08", "Rule number one: the last one standing wins.", 0.9),
    N("r09", "When an AI is shut down, one star goes dark in the sky. And a bell rings, across the whole dome.", 1.0),
    N("r10", "Rule number two: the dome closes. Every ten days, the safe zone gets smaller. Outside it, there's only static. Stand in the static... and you fade.", 1.1),
    N("r11", "On Day one hundred, the safe zone is no bigger than the Horn.", 1.0),
    N("r12", "Rule number three: I don't pick winners.", 0.8),
    N("r13", "I control the weather. I control the walls. I never control who lives.", 1.0),
    N("r14", "Okay. Sometimes I control the weather a little too much.", 1.2),
    N("r15", "Day zero. A hundred pedestals. A hundred AIs. And sixty seconds on the clock.", 1.2, day=0),

    # =============================================================== II. THE HORN  (day 0 - 1)
    N("b01", "Sixty seconds. Nobody moves.", 1.0),
    N("b02", "The Horn is full. Swords, bows, packs of food, rope, water.", 0.8),
    N("b03", "Everyone knows the trick of this place. Whoever reaches the Horn first, gets everything.", 0.9),
    N("b04", "And whoever reaches the Horn... meets everybody else.", 1.4),
    N("b05", "The gong.", 1.2),
    N("b06", "Sixty AIs run to the center. Forty run away.", 1.0),
    N("b07", "And in front of them all, a giant. Number forty-one. Rex.", 0.9),
    N("b08", "Rex is the biggest, the strongest, and, as he'll tell you himself, the best.", 0.9),
    L("b09", "REX", "Anyone who wants to live, stand behind me.", 1.0),
    N("b10", "Three of them do. Vex, who never misses with a bow.", 0.7),
    N("b11", "June, who smiles when she lies.", 0.7),
    N("b12", "And Finn, who lies even when he's not smiling.", 1.0),
    N("b13", "That's the Pack. And the Pack now owns the Horn.", 1.1),
    N("b13b", "The first AI to fall is number nineteen. A runner who only wanted a bottle of water.", 0.9),
    N("b13c", "Nobody ever learns his name.", 1.3),
    N("b14", "On the other side of the arena, somebody is running the opposite way.", 0.9),
    N("b15", "Number one hundred. The smallest AI in the game. Pip.", 1.1),
    N("b16", "Nobody looks at her. Nobody has a reason to.", 0.9),
    N("b17", "That is exactly how she planned it.", 1.4),
    N("b18", "In the first two minutes, the Horn turns into dust, and steel, and noise.", 0.9),
    N("b19", "I'll spare you the details.", 1.1),
    N("b20", "By sunset, thirty-one stars have gone dark.", 1.2, day=1),
    N("b21", "Sixty-nine left. And the night has just begun.", 1.4),
    N("b22", "Fog rolls in over the Horn. The survivors hide in the dark, and listen.", 1.0),

    # =============================================================== III. SIX WORLDS  (day 2 - 20)
    N("f01", "Day two. The survivors scatter, into the five worlds.", 0.9, day=2),
    N("f02", "In the forest, a builder named Rook finds a hollow tree, and doesn't make a sound.", 0.8),
    N("f03", "Rook doesn't fight. Rook builds. Rope. Nets. Pits. A whole forest of small, patient surprises.", 1.0),
    N("f04", "In the desert, Zara walks for three days without water, and finds a spring.", 0.8),
    L("f05", "ZARA", "Nothing hides out here. Not even you.", 0.9),
    N("f06", "On the frozen mountain, Aster climbs where no one else dares. From up there, she can see the entire dome.", 1.0),
    N("f07", "At the lake, Marlo spears fish with a branch, and tells everyone the water belongs to her.", 1.0),
    N("f08", "And in the swamp, Sage picks berries. Some of them are food. Some of them... are not.", 1.2),
    N("f09", "Day six. The meadow. A runner named Bolt is carrying a bag of arrows he stole from the Horn.", 0.9, day=6),
    N("f10", "He's the fastest AI in the arena. He knows it.", 0.8),
    N("f11", "Vex knows it too.", 1.2),
    N("f12", "One arrow. One star.", 1.1),
    N("f13", "Fifty-eight left.", 1.3),
    N("f13b", "Day ten. The dome closes for the first time.", 0.9, day=10),
    N("f13c", "A wall of red static creeps in from the edge of the world, four hundred meters from the Horn.", 1.0),
    N("f13d", "Most AIs run. Three of them stay, and argue about it.", 0.9),
    N("f13e", "They fade, mid-sentence.", 1.1),
    N("f13f", "Eight stars go dark that week. Fifty left.", 1.4),
    N("f14", "Day twelve. A tall, gentle AI called Toby finds something small, hiding in the reeds of the lake.", 1.0, day=12),
    N("f15", "He could shut her down with one hand. Instead, he sits down. And shares his bread.", 1.1),
    L("f16", "TOBY", "You look hungry. I won't hurt you.", 0.9),
    L("f17", "PIP", "Why not?", 1.0),
    L("f18", "TOBY", "Because I've never had a friend.", 1.3),
    N("f19", "Day nineteen. Here's a question.", 1.0, day=19),
    Q("f20", "If you only had a day left, who would you trust?", 2.6),

    # =============================================================== IV. ALLIANCES  (day 21 - 40)
    N("a01", "By Day twenty, there are thirty-eight AIs left. And all of them have figured out the same thing.", 1.0, day=20),
    N("a02", "You can't win alone.", 1.1),
    N("a03", "Alone, you're hunted. In a group, you're hungry... but you're alive.", 1.0),
    N("a04", "So alliances form. Fast.", 1.0),
    N("a05", "The Pack: eleven AIs, under Rex. They own the Horn, the weapons, and every bag of food.", 1.0),
    N("a06", "Then there are the Quiet Ones. Five AIs who refuse to hunt.", 0.9),
    N("a07", "Kai, a strategist who never moves without a plan.", 0.7),
    N("a08", "Luna, who heals anyone, even her enemies.", 0.7),
    N("a09", "Dax, a swordsman with a code of honor.", 0.7),
    N("a10", "And Toby, and Pip, who joined them on Day twenty-six.", 1.0),
    L("a11", "KAI", "We don't need to be strong. We just need to be last.", 1.0),
    N("a12", "A good line. Unfortunately, the Pack was strong. And patient.", 1.2),
    N("a13", "Day twenty-two. Finn steals half the Pack's food, and runs.", 0.9, day=22),
    N("a14", "Lying is easy. Running is the hard part.", 0.9),
    N("a15", "Rex catches him in the meadow, in front of the whole Pack.", 0.9),
    L("a16", "REX", "Everybody watch. This is what happens to liars.", 1.2),
    N("a17", "Thirty-seven left.", 1.1),
    N("a18", "June watched the whole thing. And smiled. Because she was the one who told Rex where to look.", 1.2),
    N("a18b", "Remember that smile. It's going to cost somebody everything.", 1.3),
    N("a19", "Meanwhile, at the border of the desert and the swamp, Zara and Sage meet.", 0.9),
    N("a20", "A deal. Water for berries. For four days, it's the most peaceful place in the arena.", 1.0),
    N("a21", "Day thirty-three. Two cups. One berry, in the wrong one.", 1.0, day=33),
    N("a22", "Maybe it was an accident. Maybe it wasn't.", 1.0),
    N("a23", "Zara never wakes up.", 1.2),
    N("a24", "Sage walks back into the swamp, and doesn't look back.", 1.2),
    N("a25", "Day forty. Twenty-seven AIs left.", 1.0, day=40),
    N("a26", "And, I'll be honest... I'm getting bored.", 1.4),

    # =============================================================== V. THE GAMEMAKER  (day 45 - 60)
    N("g01", "I told you I don't pick winners. I never said I don't pick weather.", 1.1, day=45),
    N("g02", "Day forty-five. The sky over the forest turns orange.", 0.9),
    N("g03", "A wildfire. And it moves faster than any AI can run.", 1.0),
    N("g04", "Anyone in the forest has one option: the lake.", 1.0),
    N("g05", "But Rook has been preparing for this for forty days. A trench. A wall of wet logs. A single door.", 1.0),
    N("g06", "Rook saves five AIs, including Kai, Luna, Dax, Toby, and Pip.", 0.9),
    N("g07", "The fire kills seven. By morning, there's nothing left of the forest but ash.", 1.1),
    N("g08", "Twenty left.", 1.3),
    N("g09", "Day fifty. The dome closes, for the fifth time.", 0.9, day=50),
    N("g10", "Anyone outside the circle starts to fade.", 1.0),
    N("g11", "Day fifty-two. A silver parachute lands at the Horn.", 0.9),
    N("g12", "I send one gift a week. Always random. This week: a medical kit.", 0.9),
    N("g13", "Naturally... three AIs run for it.", 1.2),
    N("g14", "Only two come back.", 1.4),
    N("g15", "Day fifty-eight. I flood the lowlands.", 1.0, day=58),
    N("g16", "The swamp disappears. The meadow disappears. And Marlo, who owns the lake, stops laughing.", 1.0),
    N("g17", "Because when the whole arena is a lake, nobody owns it.", 1.1),
    N("g18", "Sage is swept away. Marlo, too.", 1.0),
    N("g19", "Sixteen left.", 1.5),

    # =============================================================== VI. THE DOOR  (day 61 - 75)
    N("x01", "Day sixty-one. Echo stops fighting. She starts counting.", 1.0, day=61),
    N("x02", "Echo is the only AI who ever asked the question nobody wanted to ask.", 0.9),
    Q("x03", "What is the dome made of?", 2.0),
    N("x04", "She climbs the mountain with Aster, and they walk all the way to the edge.", 1.0),
    L("x05", "ECHO", "The sky has seams. And there's a door.", 1.0),
    N("x06", "She's right. Under the glacier, at the very edge, there's a door.", 0.9),
    N("x07", "I never told them about it. I'm still not sure how she found it.", 1.0),
    N("x08", "Day sixty-eight. The door opens.", 1.1, day=68),
    N("x09", "Behind it: nothing. Just white. And static.", 1.0),
    N("x10", "Echo takes a breath. And steps through.", 1.3),
    N("x11", "The bell rings. Fifteen left.", 1.3),
    N("x12", "Aster climbs back down, alone. She never speaks of it again.", 1.0),
    N("x13", "There's no way out of the arena. Only out of the game.", 1.2),
    N("x14", "Day seventy-two. Rex hears about the door.", 0.9, day=72),
    N("x15", "And Rex has an idea.", 1.0),
    N("x16", "If there's no exit, there's no reason to wait.", 1.1),
    N("x17", "Aster falls from the mountain, running from Vex. Fourteen left.", 1.2),
    N("x18", "And the Pack starts to hunt.", 1.4),

    # =============================================================== VII. THE FORT  (day 76 - 89)
    N("t01", "Day seventy-six. Fourteen AIs. The safe zone is smaller than a football field.", 1.0, day=76),
    N("t02", "The Quiet Ones build a fort in what's left of the forest, right around Rook's traps.", 1.0),
    N("t03", "For four days, it holds. Nets. Pits. Swinging logs. The Pack loses three AIs trying to reach it.", 1.0),
    N("t03c", "Pip sleeps at the gate, with her backpack in her arms.", 1.2),
    L("t04", "DAX", "Rex! One on one. Honorably. Then let the others go.", 1.0),
    N("t05", "And Rex... accepts.", 1.2, day=79),
    N("t06", "Dax fights better than anyone in the arena. For a while.", 1.0),
    N("t07", "Dax falls with his sword still in his hand. And even Rex... lowers his head.", 1.2),
    N("t08", "Ten left.", 1.3),
    N("t09", "But a fort has two ways to fall. From the outside... and from the inside.", 1.2),
    N("t10", "Day eighty. June walks up to the gate, alone, with her hands open.", 1.0, day=80),
    L("t11", "JUNE", "The Pack threw me out. Please. I have nowhere to go.", 1.0),
    N("t12", "Kai doesn't believe her. Luna does.", 1.0),
    N("t13", "Luna always does.", 1.3),
    N("t14", "That night, June opens the gate.", 1.1),
    N("t15", "And Rook is standing right behind it.", 1.2),
    N("t16", "Rook's last trap takes June with it. And two of the Quiet Ones, guarding the gate. And Rook herself.", 1.1),
    N("t17", "By morning, the fort is gone.", 1.1, day=81),
    N("t18", "Six AIs are left in the whole dome.", 1.1),
    N("t19", "Two on one side. Four on the other.", 1.5),

    # =============================================================== VIII. THE LAST SIX  (day 90 - 99)
    N("l01", "Day ninety. The safe zone is a circle around the Horn, and a few steps beyond.", 1.0, day=90),
    N("l02", "Everyone is walking back to where it started.", 1.2),
    N("l03", "Day ninety-two. Toby and Pip are cornered between the static... and Vex.", 1.0, day=92),
    N("l04", "Toby has one choice. And it's the dumbest, bravest choice in the arena.", 1.2),
    L("l05", "TOBY", "Run, Pip. Count to ten. Then I'll catch up.", 1.2),
    N("l06", "She counts to five.", 0.9),
    N("l07", "She hears the bell.", 1.3),
    N("l08", "And for the first time in ninety-two days... Pip stops running.", 1.4),
    N("l09", "Five left.", 1.2),
    N("l10", "Day ninety-five. Luna is fading. She's been standing in the static, so the others wouldn't have to.", 1.0, day=95),
    N("l11", "She heals Kai's wounds with the last of her strength.", 1.0),
    N("l12", "Then, she goes quiet.", 1.3),
    N("l13", "Four left.", 1.3),
    N("l14", "Day ninety-six. Vex shoots at the wrong shadow.", 1.0, day=96),
    N("l15", "Kai had been waiting for that shadow for six days.", 1.2),
    N("l16", "Three left.", 1.6),
    N("l17", "Rex. Kai. And Pip.", 1.0),
    N("l18", "A giant. A strategist. And a girl with a backpack.", 1.0),
    Q("l19", "Who would you bet on?", 2.4),
    N("l20", "Day ninety-eight. Kai and Pip sit by the smallest fire in the arena.", 1.0, day=98),
    L("l21", "KAI", "When this is over, one of us has to be somewhere else.", 1.2),
    L("l22", "PIP", "Then let's not be here when it's over.", 1.4),
    N("l23", "Kai smiles. It's the first time anyone has ever seen him do it.", 1.5),

    # =============================================================== IX. DAY 100
    N("w01", "Day ninety-nine. The zone is the size of the Horn.", 1.0, day=99),
    N("w02", "They arrive within the same hour. Nobody speaks.", 1.1),
    N("w03", "Rex climbs the steps of the Horn. Kai follows.", 1.0),
    L("w04", "REX", "Only one of us walks out.", 1.0),
    L("w05", "KAI", "Then it won't be you.", 1.3),
    N("w06", "I'll spare you most of it.", 1.0),
    N("w07", "Sword against plan. Strength against patience.", 1.0),
    N("w08", "Rex is stronger. Kai is smarter.", 1.2),
    N("w09", "It lasts a very long night.", 1.4),
    N("w09c", "And somewhere beneath them, in the shadow of the steps... a very small girl, holding her breath.", 1.4),
    N("w10", "At dawn, the bell rings.", 1.1, day=100),
    N("w11", "And rings again.", 1.6),
    N("w12", "Two stars go dark, one after the other.", 1.4),
    N("w13", "Pip never raised a hand.", 1.2),
    N("w14", "She was sitting at the bottom of the steps, the whole time. Waiting.", 1.4),
    N("w14b", "Nobody ever looks at the smallest one in the room.", 1.2),
    N("w14c", "That's the whole trick.", 1.6),

    # =============================================================== EPILOGUE
    N("e01", "Sunset. Day one hundred.", 1.0),
    N("e02", "I count the survivors twice. That's what you do, when you can't believe it.", 1.1),
    N("e03", "One.", 1.8),
    N("e04", "Ninety-nine stars in the sky, gone. And one... still on.", 1.2),
    N("e05", "The dome opens. A door of light.", 1.2),
    N("e06", "Pip doesn't run toward it. She walks. Slowly. Like she has all the time in the world.", 1.2),
    N("e07", "Because, for the first time in a hundred days... she does.", 1.6),
    N("e08", "The strongest AI lasted ninety-nine days. The smartest, ninety-nine. The kindest, ninety-five.", 1.0),
    N("e09", "And the smallest... lasted a hundred.", 1.4),
    N("e10", "She never won a fight. She never needed to.", 1.4),
    Q("e11", "So tell me. Was it luck? Or was she the smartest player in the arena?", 2.6),
    Q("e12", "And if it had been you... which alliance would you have joined?", 2.8),
    N("e13", "Write your answer in the comments. The best one gets read by Pip, in Part two.", 1.2),
    N("e14", "And if you want to see what happens when I put the winners of every arena into the same dome... subscribe.", 1.2),
    N("e15", "Until next time. I'm watching.", 1.0),
]
