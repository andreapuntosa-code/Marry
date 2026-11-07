# Stile "Roblox"

Quando l'utente chiede "fai un video che … con **animazione Roblox**", si usa questo stile e questo kit
(definito dal video di riferimento del 05/11/2026: storie in prima persona in una città a blocchi).

**Grafica**: personaggi a blocchi (testa cilindrica con faccia disegnata, busto/braccia/gambe squadrati, capelli a
blocchi, accessori: occhiali, occhiali da sole, camice, cravatta, catena, fascia), città suburbana colorata (case con
tetto a falde, finestre bianche, porte rosse, staccionate bianche, alberi tondi, strada con linea gialla, marciapiedi),
interni semplici (camera, aula, garage), luce piena e colori saturi, un cane a blocchi.
**Inquadrature**: primi piani verticali come il riferimento (testa nel terzo alto, badge sopra la testa, parola
sul petto), più qualche campo largo della strada.
**Grafica sopra**: badge viola-blu arrotondato con numero bianco sopra le teste (appare con un "pop"), e una sola
parola gigante alla volta, bianca con contorno nero, minuscola, al 60% dell'altezza.
**Audio**: narratore in prima persona con la voce più simile a quella del riferimento: Kokoro **am_fenrir**, velocità 1,22, tono +3% (misurato: altezza ~158 Hz contro 157, stessa espressività e timbro), musica originale "simile" al riferimento: campane
morbide sostenute in Re maggiore (D–Bm–G–A), una nota ogni ~0,65 s, pad leggero, niente batteria; "pop" sui badge.
(La musica del riferimento non viene copiata: è di qualcun altro e nel video è mescolata alla voce. Per questo il render
produce due file: `<nome>.mp4` con sola voce + effetti, a cui aggiungere la canzone originale come "suono" in TikTok/CapCut,
e `<nome>_with_music.mp4` con la nostra traccia.)

## Kit
- `sorgente/web/kit.js` — avatar, pose, cane, città, stanze, luci, sistema di inquadrature (riutilizzabile)
- `sorgente/web/film_<nome>.js` — le inquadrature di un video (ancorate alle frasi del copione)
- `sorgente/script_<nome>.py` — il copione (frasi)
- `sorgente/sintesi.py` — voce: `SCRIPT=script_<nome> python3 sintesi.py`
- `sorgente/roblox.py` — render (Chromium headless) + badge + parole + musica + mix:
  `python3 roblox.py --film film_<nome> --script script_<nome> --preview 3 8 12` (anteprime)
  `python3 roblox.py --film film_<nome> --script script_<nome> --render --workers 3 --out ../<nome>.mp4`

Requisiti: `python3 -m pip install --break-system-packages playwright skia-python kokoro-onnx soundfile scipy opencv-python-headless`,
three.js in `video simulazione/sorgente/web/node_modules` (`npm install three@0.180.0`), modelli Kokoro nello scratchpad.

## Video
- `i_woke_up_with_my_iq_above_my_head.mp4` (solo voce, per la canzone originale) e `..._with_music.mp4` (con la nostra musica), 38 s — "One morning, I woke up with a number floating above my head…":
  il QI di Kevin sopra la testa sale (100 → 250 a scuola → 500 prende ogni palla senza guardare → 1.000 arrivano gli
  scienziati, materia oscura spiegata su un tovagliolo → 10.000 una piccola stella in garage che accende la città →
  1.000.000 nessuno lo capisce più → sa tutto), poi guarda il suo cane: il numero del cane è ∞. Finale:
  "What number would float above your head? Comment below."
  **Titolo**: I woke up with my IQ above my head 🧠 #shorts
  **Descrizione**: Everyone in my town has a number above their head. Mine kept going up… until I looked at my dog 🐶
  What number would float above YOUR head? 👇  #roblox #story #iq #animation #shorts #storytime
- `everyone_has_a_number_above_their_head.mp4` (solo voce, 41 s) — tutti hanno un numero sopra la testa: il voto di
  bellezza da 1 a 100. Nessuno esce con chi ha un numero più basso, tutti cercano di "salire" (ragazzi e ragazze), il 100
  è inseguito da tutta la città. Tranne me: ho un lucchetto, il dottore dice che si apre a 18 anni. Mia (74) si siede
  con me lo stesso; le sue amiche non sanno se sta "scendendo" o "salendo". Mezzanotte del mio diciottesimo: il
  lucchetto si apre, i numeri girano… "?". Finale: "Comment what you think my number is. Part two tomorrow."
  **Titolo**: Everyone has a number above their head… except me 🔒 #shorts
  **Descrizione**: In my town, your number is how attractive you are. Mine is locked until I turn 18… What do you
  think my number is? 👇 Part 2 tomorrow
  #roblox #story #storytime #animation #shorts #glowup
- `everyone_has_a_number_above_their_head_part2.mp4` (solo voce, 28 s) — Parte 2: il lucchetto si apre, **100**. La
  mattina dopo tutta la città aspetta davanti a casa, chi mi evitava vuole essere mio amico, l'altro 100 perde metà
  dei fan, tutti vogliono il mio numero (di telefono). Mia non cambia: "I liked you before I knew your number" (voce
  femminile). Colpo di scena: un altro ragazzo con un lucchetto sopra la testa… e fissa Mia. "Comment lock if you want
  part three." **Titolo**: My lock finally opened… 100 🔒 (Part 2) #shorts
  **Descrizione**: The whole town changed overnight. She didn't. But who is the other guy with a lock? 👀 Comment LOCK for part 3
  #roblox #story #storytime #animation #shorts #part2
- `i_can_see_how_many_lies_you_told_today.mp4` (solo voce, 36 s) — vedo sopra la testa di tutti quante bugie hanno
  detto oggi (si azzera a mezzanotte), solo io posso vederlo. Mamma: "adoro come cucini" +1; prof: "non sarà nel
  compito" +1; il sindaco al comizio: 47. La mia ragazza Emma è sempre a zero, l'unica di cui mi fido. Stanotte le
  chiedo dov'era ieri: "a casa, tutta la notte" (voce femminile) — resta a zero. Poi sorride e dice "I love you"…
  e il suo numero sale a 1. "Comment truth if you want part two."
  **Titolo**: I can see how many lies you told today 🤥 #shorts
  **Descrizione**: Only I can see the number. Everyone lies… except my girlfriend. Until tonight 💔 Comment TRUTH for part 2 👇
  #roblox #story #storytime #animation #shorts #lies
- `what_if_gravity_was_10.mp4` (solo voce, 42 s) — What if gravity was 10 m/s² instead of 9.81? Solo +2%, "sembra niente":
  70 kg pesano come 71,4; salti 50 → 49 cm; aerei e razzi consumano di più; la Stazione Spaziale diventa troppo lenta,
  scende a ~150 km nell'atmosfera e inizia a cadere; migliaia di satelliti la seguono; la Luna si avvicina, maree più
  forti; gli orologi a pendolo vanno avanti di quasi 14 minuti al giorno. (Calcoli nell'intestazione di `script_gravity.py`.)
  **Titolo**: What if gravity was 10 instead of 9.81? 🌍 #shorts
  **Descrizione**: Just 2% stronger… sounds like nothing. Until the Space Station starts falling 😳
  #whatif #gravity #science #physics #roblox #animation #shorts
- `what_if_light_was_2x_slower.mp4` (solo voce, 39 s) — What if light traveled at half its speed? Escalation fino al
  blackout: all'inizio non te ne accorgi (luce del Sole vecchia 16 minuti invece di 8), poi il GPS impazzisce (auto,
  aerei e navi persi), le calamite diventano 4 volte più forti (attirano oggetti di metallo, strappano le pentole dai
  fornelli), i generatori danno troppa tensione, i trasformatori esplodono uno dopo l'altro, gli ospedali perdono anche
  i generatori di riserva, persino l'oro cambia colore… e il pianeta resta al buio. (Fisica nell'intestazione di `script_light.py`.)
  **Titolo**: What if light was 2x slower? 💡 #shorts
  **Descrizione**: At first you wouldn't notice… then the whole planet goes dark 😳
  #whatif #science #physics #light #roblox #animation #shorts

## Grafica v2 (dal 06/11/2026)
Obiettivo: qualità e realismo molto più alti (riferimento di qualità, non da copiare). Nel kit: illuminazione da
ambiente (RoomEnvironment/PMREM), bloom, profondità di campo (il cielo è escluso dal pre-passaggio di profondità),
parti arrotondate (RoundedBoxGeometry), pavimenti a specchio (Reflector), vignettatura e grana. Soglie del bloom
diverse per giorno/notte/interni (in luce lineare i muri al sole superano 1). Set ricchi in `web/sets.js`: biblioteca
magica, negozio di pozioni, bottega di antiquariato, Stanza delle cose perse, porta antica, regno fantasy; particelle
(polvere, pagine, scintille), raggi di luce, lampadari, cerchio magico, libro luminoso, peluche, torcia.

- `test_v2_midnight_library.mp4` — test della v2 (11 s).
- `in_this_town_lost_things.mp4` (solo voce, ~1:53) — **"In this town, lost things end up in the same room."**
  Un ragazzo di 16 anni perde il peluche (Mister Button) che il papà gli regalò il giorno prima di andarsene. La
  signora della bottega di antiquariato: "Segui il suono della cosa che ti manca di più… e non restare dopo l'alba".
  Una porta mai vista in fondo alla strada; la Stanza: montagne di ombrelli, fiumi di calzini spaiati, chiavi, anelli,
  telefoni, aquiloni, lettere, palloncini sul soffitto. Dietro una pila di giocattoli, un bambino che piange e
  abbraccia il peluche: è lui a sei anni, la parte di sé che ha perso il giorno in cui il papà se n'è andato. L'alba,
  la porta che si chiude… "Comment found for part two." (voci: narratore, papà, signora, bambino)
  **Titolo**: In this town, lost things end up in the same room… 🧸 #shorts
  **Descrizione**: I went looking for my old stuffed bunny. I found something I lost a long time ago 🥺 Comment FOUND for part 2
  #roblox #story #storytime #animation #emotional #intheTown
- `in_this_town_paintings.mp4` (solo voce, ~1:26) — **"In this town, you can enter any painting in the museum."**
  Basta toccare la cornice: i bambini nuotano in vecchie marine, le coppie cenano in un caffè chiuso da cent'anni, i
  vecchi pescano su laghi prosciugati. Una regola: uscire prima delle sei, o si resta nel quadro per sempre. Il nonno,
  guardiano notturno per quarant'anni, sorvegliava ogni notte il quadro coperto dalla tenda rossa nell'ultima sala…
  sparisce, e il nipote lo rivede minuscolo, con una lanterna, nel quadro del faro in tempesta. Entra alle 17:45: il
  nonno non è intrappolato, sta facendo la guardia. Da dentro si vede il museo: la tenda rossa si muove, esce una mano
  lunga e sottile di vernice nera. Scoccano le sei e i bordi del quadro iniziano a seccarsi. Set in `web/museum.js`
  (galleria con marmo a specchio, quadri dipinti a pennellate, orologio, tenda di velluto, mondi dentro i quadri);
  effetti nel driver: look a olio, increspatura della tela, bordi che si seccano, lampi; suoni: pioggia, tuoni, rintocchi.
  **Titolo**: In this town, you can enter any painting… 🖼️ #shorts
  **Descrizione**: Grandpa wasn't trapped in the painting. He was guarding it 😨 Comment PAINT for part 2
  #roblox #story #storytime #animation #horror #mystery #intheTown
- `what_if_the_sun_was_1_percent_brighter.mp4` (solo voce, ~55 s) — **What if the Sun was 1% brighter?** Un po' di
  scottatura in più, il gelato che si scioglie prima… ma l'1% del Sole vale quasi quanto raddoppiare tutta la CO₂
  (~2,4 W/m² contro ~3,7): circa +2 °C in qualche decennio (l'ultima era glaciale era solo ~6 °C più fredda). Ondate
  di calore ogni estate, rete elettrica in tilt, coralli bianchi, raccolti secchi, prezzi alle stelle, ghiacciai che
  crollano, mari più alti di metri nei secoli, centinaia di milioni di persone in viaggio. "And all it took… was one
  percent." (Conti nell'intestazione di `script_sun.py`; set in `web/film_sun.js`.)
  **Titolo**: What if the Sun was just 1% brighter? ☀️ #shorts
  **Descrizione**: 1% doesn't sound like much… 😳
  #whatif #science #sun #climate #roblox #animation #shorts
