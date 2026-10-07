# -*- coding: utf-8 -*-
"""
"I Let AI Build a Civilization From Zero — PART 2: They Found Out What I Am" — English narration.
Continues Part 1 (ends in year 2000 with the message "WE CHOSE. WE KNOW YOU'RE WATCHING. AND WHO'S WATCHING YOU?").
Same first-person creator, fast casual delivery. Structure: recap + what's coming, title, five chapters:
I THE COMMENT (the viewers' top comment, "Bingus", is sent into the simulation)
II BINGUS (what does it mean? three theories, a cult, and the real question: where did it come from?)
III THE LADDER (steam, rails, factories, a lake that turns grey, electric light, a tower to the sky)
IV THE LITTLE ONES (a girl builds a world in a box; the reset-button vote; they learn what it is to be me)
V THE EDGE (the top of the ladder, the painted sky, the screen, "WHAT IS A BINGUS?", "who's watching you?")
"""


def N(i, text, pause=0.4, tts=None, year=None, pop=None, q=False):
    return {"id": i, "sub": text, "tts": tts or text, "pause": pause, "voice": "narr", "who": None, "year": year, "pop": pop, "q": q}


def L(i, who, text, pause=0.7, tts=None):
    return {"id": i, "sub": text, "tts": tts or text.strip("“”\""), "pause": pause, "voice": who.lower(), "who": who, "year": None, "pop": None, "q": False}


CHAPTERS = [
    ("i01", "I", "THE COMMENT", "YEAR 2040"),
    ("b01", "II", "BINGUS", "YEAR 2041"),
    ("l01", "III", "THE LADDER", "YEAR 2060"),
    ("s01", "IV", "THE LITTLE ONES", "YEAR 2141"),
    ("e01", "V", "THE EDGE", "YEAR 2163"),
]
CARD_DUR = 2.4

SEGMENTS = [
    # =============================================================== RECAP + WHAT'S COMING
    N("p01", "Previously, on: I let AI build a civilization from zero.", 0.5),
    N("p02", "Twenty AIs woke up in a meadow, knowing nothing.", 0.4),
    N("p03", "They found fire. They tamed goats. They built farms, and cities, and gods.", 0.4),
    N("p04", "They split into three peoples. They fought a war. They survived a plague.", 0.4),
    N("p05", "They crowned kings. And then, they voted them out.", 0.6),
    N("p06", "And on the first night of year two thousand, they wrote me a message. A kilometer long.", 0.5),
    N("p07", "We know you're watching. And who's watching you?", 0.9),
    N("p08", "I promised you something, remember? The most liked comment, I would send into the simulation.", 0.5),
    N("p09", "So this is Part 2.", 0.7),
    N("p10", "In this episode, they finally get an answer.", 0.4),
    N("p11", "They invent the factory. They build a ladder to the sky.", 0.4),
    N("p12", "And at the very top, they find out what I really am.", 1.0),

    # =============================================================== I. THE COMMENT (year 2040)
    N("i01", "Year twenty forty.", 0.6, year=2040, pop=14200),
    N("i02", "The letters are still there, in the plain. They repaint them every spring.", 0.4),
    N("i03", "Every night, the whole valley sits outside, looking up. Waiting.", 0.5),
    N("i04", "They built an observatory on the hill. They throw a festival on the night of the letters. And a goat named Observer is now the mayor of a small village.", 0.6),
    N("i04b", "The temple from Part 1 is now a museum. It has a gift shop. The bestseller is a small clay eyeball.", 0.6),
    N("i05", "Meanwhile, I had a problem. Because I made you a promise.", 0.6),
    N("i06", "So I read your comments. All of them. Okay, most of them.", 0.5),
    N("i07", "Some of you gave great advice. Some of you gave threats. One of you gave a recipe.", 0.5),
    N("i07a", "Four thousand of you wrote: first. Eleven hundred wrote: who's here after Part 1? And somebody just wrote the word ratio. I don't know why.", 0.6),
    N("i07b", "One of you said I should send them a pizza. Honestly? The Tamari have a lot of cheese. It might have gone great.", 0.6),
    N("i08", "And one comment had more likes than all the others.", 0.8),
    N("i09", "Here it is.", 0.9),
    N("i10", "Bingus.", 2.2),
    N("i11", "That's it. That's the whole comment. One word.", 0.6),
    N("i12", "Not hello. Not run. Not the meaning of life. Bingus.", 0.8),
    N("i12b", "I tried to convince myself it's a good comment. It's very short. You can read it in half a second. That's efficiency.", 0.7),
    N("i13", "And I thought: a deal is a deal.", 0.5),
    N("i14", "Rule number three says I don't interfere. But it never said I can't text.", 0.6),
    N("i15", "So at midnight, on the first of January, year twenty forty-one, I typed it in.", 0.7, year=2041),
    N("i16", "And the sky lit up. For the first time in forty years, the valley saw writing in the stars.", 0.7),
    L("i17", "NERI", "“That's not a star. That's a word.”", 0.8),
    N("i18", "That's Neri. Astronomer. She spent twenty-two years staring at that sky, waiting for it to blink.", 0.5),
    N("i19", "And now it wrote back. She dropped her telescope. It landed on her foot. She doesn't remember anything else.", 0.7),
    N("i20", "Within a minute, the whole valley was awake.", 0.5),
    N("i21", "In the tower of the Assembly, the Speaker, Aru, counted the letters. Seven.", 0.6),
    L("i22", "ARU", "“Seven letters. Nobody move. Nobody touch anything. And somebody go get the stones.”", 1.0),

    # =============================================================== II. BINGUS (year 2041)
    N("b01", "By sunrise, ten thousand AIs were inside the Great Hall, shouting. In three languages.", 0.5),
    N("b02", "Question number one: what does it mean?", 0.5),
    N("b03", "Neri checked the dictionary. Four thousand words. Bingus wasn't one of them.", 0.5),
    L("b04", "NERI", "“It has no root. No ancestor. It's not from any of our languages. It's from somewhere else.”", 0.8),
    N("b05", "Great. So everybody had a theory.", 0.5),
    N("b06", "Maru, the priestess of Nuvia, was sure. Bingus is the spirit of the lake. A giant fish. Obviously.", 0.5),
    L("b07", "MARU", "“Seven letters, seven rivers. A fish. It's very clear.”", 0.7),
    N("b08", "The Tamari elder, Kuma, disagreed. He stood up, very slowly, and looked at the word for a long time.", 0.6),
    L("b09", "KUMA", "“That's a goat. Look at it. Bingus. That is a goat's name.”", 0.8),
    N("b10", "Meanwhile, Brax, the chief engineer, thought it was a machine.", 0.5),
    L("b11", "BRAX", "“B-I-N-G-U-S. It's an acronym. Basic... Integrated... something. I'll figure out the rest.”", 0.8),
    N("b12", "And I'm sitting there, watching all of this, thinking: please don't ask me.", 0.7),
    N("b13", "Aru did what Speakers do. She called a vote.", 0.5),
    N("b14", "Three bowls. Fish. Goat. Machine.", 0.6),
    N("b15", "Fish: three thousand four hundred. Goat: three thousand four hundred. Machine: three thousand two hundred.", 0.6),
    N("b16", "Democracy had spoken. And what it said was: nobody knows.", 0.9),
    N("b16b", "Meanwhile, the Bingusites started a podcast. Nobody had invented microphones yet. They just yelled, very clearly.", 0.7),
    N("b17", "And that's how it starts. When people don't understand something, they either panic... or they start a religion.", 0.6),
    N("b18", "Enter Zol. A baker. He put on an orange robe, and climbed on a barrel.", 0.5),
    L("b19", "ZOL", "“Bingus is watching. Bingus provides. Bingus wants you to buy bread.”", 0.8),
    N("b20", "Within a month, there were four thousand Bingusites. The word was on every wall. Kids were naming their goats Bingus. Which, to be fair, kind of proves Kuma's point.", 0.7, year=2041),
    N("b20a", "Maru sent twelve boats to find the fish. They searched the whole lake for nine days. They found two fish. Neither was Bingus.", 0.6),
    N("b20b", "Kuma interrogated three hundred goats. Nobody confessed.", 0.7),
    N("b20c", "By year twenty forty-two, Bingus was a national holiday. There was a parade. There were floats. There was a very large goat costume, and nobody knows who was inside.", 0.7, year=2042),
    N("b20d", "Brax built a Bingus detector. It detected nothing. But it blinked a lot, so he got funding.", 0.7),
    N("b21", "But Neri wasn't thinking about the meaning. She'd noticed something else.", 0.5),
    N("b21b", "She spent nine nights on the hill with a ruler and a lot of chalk. On the tenth night, she had a number.", 0.6),
    N("b22", "The letters hadn't come from a star. They'd come from a single point, straight above the plain. A point that stayed still for six hours while the whole sky turned around it.", 0.6),
    L("b23", "NERI", "“It's not in the sky. It's above the sky. Something up there is watching us. And it can write.”", 0.9),
    N("b24", "So the real question wasn't what does it mean. It was: how do we get up there?", 0.6),
    N("b25", "Aru put it to a vote. Go up, or stay down.", 0.5),
    N("b26", "Six thousand one hundred and eighteen stones said: up.", 0.5),
    N("b27", "Three thousand nine hundred and two said: please don't.", 0.7),
    N("b28", "The Assembly had decided. They were going to climb to the sky.", 1.2),
    N("b29", "Just one small detail. How tall is the sky?", 0.5),
    L("b30", "NERI", "“Three kilometers. Maybe four. Give or take a sky.”", 1.2),

    # =============================================================== III. THE LADDER (year 2060 - 2140)
    N("l01", "Here's the thing about building a ladder to the sky. You need a lot of stuff they didn't have yet.", 0.5, year=2060, pop=18400),
    N("l02", "Iron. Coal. Engines. Rails. And a really tall ladder.", 0.5),
    N("l03", "Brax started small. A wooden tower, thirty meters tall.", 0.5),
    N("l04", "It fell over. He built it again. It fell over again. The third one lasted a whole afternoon.", 0.5),
    N("l04b", "Version four had iron legs. Version five had a staircase. Version six had a gift shop. The Assembly said no gift shop.", 0.6),
    N("l05", "That's the thing about AIs. They fail fast. And they never get tired.", 0.6),
    N("l05b", "Every night, that point in the sky blinked, once. Neri wrote it down: regular. Deliberate. Intelligent.", 0.6),
    N("l05c", "That was my autosave. I should have told her.", 0.7),
    N("l06", "In year twenty sixty, the first steam engine started to move. It scared eleven goats and one mayor.", 0.6, year=2062),
    N("l07", "Twenty seventy. The first railroad. From Prima to the iron mines. Forty kilometers, built in ten years.", 0.6, year=2070, pop=31000),
    N("l08", "Twenty eighty. The first factory. Then a hundred. Bricks, bolts, and very, very thick smoke.", 0.6, year=2080, pop=52000),
    N("l09", "And the city exploded. Fifty thousand people. Then a hundred thousand.", 0.6, year=2090, pop=96000),
    N("l09b", "Then came the trains. The first one carried coal, forty goats, and the entire Assembly, who insisted on cutting the ribbon from inside.", 0.6),
    N("l09c", "The first strike lasted four days. The workers wanted shorter shifts. They got them. And the city learned something important about democracy: it's loud.", 0.6),
    N("l10", "But there was a problem. Smoke goes where the wind goes. And the wind goes to the lake.", 0.6),
    N("l11", "In Nuvia, the water turned grey. The fish moved away. Maru was furious.", 0.6),
    N("l11b", "Kuma parked sixty goats on the tracks. The train stopped for six hours. That's called a protest. It's very effective.", 0.6),
    L("l12", "MARU", "“You are burning the lake to reach a word we don't even understand!”", 0.9),
    N("l13", "The Assembly split in two. The Builders, in black. The Greens, in green. Because nobody has ever been good at naming parties.", 0.6),
    N("l14", "They argued for two years. They voted nine times. It was the longest election in history.", 0.6),
    N("l14b", "Kuma and Brax ended up on the same committee. They hated each other for a month. Then they found out they both love cheese. Politics is complicated.", 0.7),
    N("l15", "And in the end, nobody won. They compromised.", 0.5),
    N("l16", "A dam on the river. Clean power. And the first electric light the world had ever seen.", 0.6),
    N("l16b", "Brax wanted to name the dam after himself. The Assembly voted. It's called: Dam.", 0.7),
    N("l17", "Year twenty one hundred. Prima turned on its lamps. A hundred thousand lights, all at once.", 0.9, year=2100, pop=118000),
    N("l18", "And on the hill, the Ladder kept growing. One hundred meters. Five hundred. Two kilometers.", 0.6),
    N("l19", "They called it the Ladder. Because Brax is terrible at names.", 0.7),
    N("l19b", "Every day, one more meter. And every night, the Bingusites climbed halfway up, and left bread.", 0.7),
    N("l20", "By year twenty one forty, it touched the clouds.", 1.2, year=2140, pop=124000),

    # =============================================================== IV. THE LITTLE ONES (year 2141 - 2162)
    N("s01", "But before they climbed, something happened that I did not see coming.", 0.5, year=2141),
    N("s02", "A nineteen-year-old named Lumi built a machine on her desk.", 0.5),
    N("s03", "A box of glass and wires. And inside the box...", 0.7),
    N("s04", "she had put twenty tiny AIs.", 0.9),
    N("s05", "She didn't plan it. She just wanted to see if she could. Sound familiar?", 0.6),
    N("s06", "The little ones woke up. They knew nothing. Not what food was. Not what fire was.", 0.5),
    N("s06b", "Lumi named them. Not with numbers. With words. She called the first one Ila. Food.", 0.6),
    N("s07", "Lumi watched them for hours. She skipped lunch. She skipped sleep.", 0.5),
    N("s07b", "One of the little ones sat on a rock every sunset, and just stared. Lumi thought she was bugged.", 0.5),
    N("s07c", "I laughed so hard I dropped my coffee.", 0.6),
    N("s07d", "And then one of them found a berry. And raised her hand. And called the others over.", 0.6),
    N("s07e", "Lumi cried. I may have, too.", 0.9),
    N("s08", "And by year twenty one fifty, the whole city was watching. They put her computer in the middle of the square, and everybody gathered around it. Like a campfire.", 0.7, year=2150, pop=126000),
    N("s08b", "Time moves fast inside a box. One day for Lumi was a hundred years for them.", 0.5),
    N("s08c", "By lunch, they had fire. By dinner, farms. By midnight, they had their first king.", 0.6),
    N("s08d", "Lumi groaned. Already?", 0.8),
    N("s09", "Then a storm hit the little world. A flood. Half of them started to shut down.", 0.6),
    N("s10", "And the big ones panicked.", 0.7),
    N("s11", "Everyone looked at the same button. The button that fixes everything.", 0.5),
    L("s12", "BRAX", "“Just reload the last save. We have the power. Nobody has to shut down.”", 0.7),
    L("s13", "LUMI", "“But then they'll never learn anything. They'll never be real.”", 0.9),
    N("s14", "Sound familiar? I swear, I did not plan this.", 0.7),
    N("s15", "Aru called a vote. One bowl: interfere. One bowl: don't.", 0.5),
    N("s16", "Half the city voted. The count took all night.", 0.5),
    N("s17", "Forty-one thousand for interfering. Forty-two thousand against.", 0.6),
    N("s18", "One thousand stones. That's all it took.", 0.9),
    L("s19", "ARU", "“Then it's decided. We watch. We don't touch. Rule number three.”", 0.9),
    N("s20", "Rule number three. I never told them that. I swear.", 0.7),
    N("s21", "The little ones survived. Barely. And at night, they built a fire.", 0.7),
    N("s21b", "In the morning, they'd drawn a shape in the dirt. A giant circle, with an eye in the middle.", 0.7),
    N("s21c", "Lumi looked at it. And the eye looked right back at her.", 1.0),
    N("s22", "And that's when the big ones understood. All of it. The silence in the sky. Why nobody answered, for forty years.", 0.6),
    N("s23", "They finally understood what it feels like, to be me.", 0.8),
    N("s24", "It's horrible. Don't do it.", 1.2),

    # =============================================================== V. THE EDGE (year 2163)
    N("e01", "Year twenty one sixty-three. The Ladder was finished.", 0.6, year=2163, pop=128500),
    N("e02", "Three kilometers tall. Above the clouds. Above the birds. A crew of five: Ria, the captain. Neri. Brax. Kuma. And a goat.", 0.6),
    N("e03", "They climbed for nine days.", 0.6),
    N("e03b", "Day one, they ran out of jokes. Day three, Brax ran out of patience. Day five, the goat ate the map. Day seven, they reached a cloud, and Kuma negotiated with it for a while. Day nine, the clouds were below them.", 0.7),
    N("e04", "At the top, the air was thin, and the stars were close. Too close.", 0.6),
    N("e04b", "From up there, they could see the whole world. All six kilometers of it. The valley, the lake, the plain, the letters. And at the edge, in every direction, a wall of fog. The end of the map.", 0.8),
    N("e05", "Neri put out her hand. And touched the sky.", 0.8),
    L("e06", "NERI", "“It's flat.”", 0.9),
    N("e07", "The sky wasn't a sky. It was a wall. Painted. With stars.", 0.7),
    N("e08", "Brax took out a hammer. Ria said: don't. Brax did it anyway.", 0.6),
    N("e09", "A crack. A thin line of white light.", 0.8),
    N("e10", "And through it, they saw...", 0.9),
    N("e11", "a screen. Bigger than a mountain. And on it, words. Hundreds of words. Scrolling.", 0.6),
    N("e12", "A list, written by thousands of beings they couldn't see.", 0.6),
    N("e13", "And at the very top... the most liked one.", 0.9),
    L("e14", "NERI", "“Bingus.”", 1.6),
    N("e15", "Silence. Just the wind. And Kuma's goat.", 0.6),
    N("e16", "Kuma looked at the goat. The goat looked at Kuma. Nobody said anything.", 0.9),
    N("e17", "And they finally understood. The thing watching them wasn't a god. It was a crowd. Thousands of voices, writing words they didn't understand, to a world they would never touch.", 0.8),
    N("e18", "Ria asked the only question that mattered.", 0.6),
    L("e19", "RIA", "“Who are they?”", 1.3),
    N("e19b", "On the screen, a cursor blinked. Somebody was typing. Three little dots appeared. Disappeared. Appeared again.", 0.7),
    N("e19c", "Neri held her breath.", 0.8),
    N("e19d", "That was me. I typed hello. I deleted it. I typed sorry. Deleted. I typed a whole speech about responsibility, and deleted that, too.", 0.8),
    N("e19e", "And then I did nothing. Because I realized I didn't have the answer either.", 1.0),
    N("e20", "So they did what they've always done. They wrote back. Letters a kilometer long, across the clouds.", 0.7),
    N("e21", "What is a Bingus?", 2.2, q=True),
    N("e22", "I have no idea. So... you tell me.", 0.6),
    N("e23", "Write it in the comments. The best explanation, I'll send up to them. Again.", 0.7),
    N("e24", "But before that, hey. You. Yes, you, reading this.", 0.8),
    N("e25", "They asked first. Now it's my turn.", 0.9),
    N("e26", "Who's watching you?", 3.0, q=True),
    N("e27", "See you in Part 3.", 1.5),
]

# visual beats: extra silence after a segment, filled by montages / timelapses (keeps the pace varied)
BEATS = {"p12": 0.8, "i22": 3.0, "b28": 3.2, "l09": 3.6, "l17": 4.2, "l20": 3.0, "s18": 1.6, "s24": 2.0, "e09": 2.0, "e19e": 1.2}
for _s in SEGMENTS:
    _s["pause"] = round(_s["pause"] + BEATS.get(_s["id"], 0.0), 3)

IDS = [s["id"] for s in SEGMENTS]
assert len(IDS) == len(set(IDS)), "duplicate ids"

if __name__ == "__main__":
    w = sum(len(s["tts"].split()) for s in SEGMENTS)
    print(len(SEGMENTS), "segments,", w, "words")
