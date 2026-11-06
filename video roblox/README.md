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
