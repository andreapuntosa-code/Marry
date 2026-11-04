# What if your IQ kept going up?

Short verticale (1080×1920, 63 s, inglese) in stile **doodle disegnato a mano**: foglio di quaderno, linee a pennarello
che "tremano" (ridisegnate 8 volte al secondo), disegni che si tracciano da soli, Bob l'omino stilizzato con il
cervello rosa che cresce a ogni livello. Contatore IQ che sale: 100 → 200 → 1.000 → 10.000 → 1.000.000 →
1.000.000.000 → ∞ (all'infinito il foglio diventa cielo stellato e la testa di Bob una galassia).

- `what_if_your_iq_kept_going_up.mp4`

**Titolo**: What if your IQ kept going up? 🧠 (100 → ∞) #shorts
**Descrizione**: IQ 100, 200, 1,000... all the way to infinity. What would actually happen? 🧠 Comment your IQ 👇
#iq #whatif #brain #genius #animation #doodle #shorts #science

Numeri (IQ: media 100, deviazione 15): IQ 200 = +6,67 deviazioni → circa 1 su 76 miliardi, quindi statisticamente
nessuno degli 8 miliardi di persone vive oggi; i test reali smettono di funzionare molto prima (il video lo dice a
IQ 1.000: "from here, we're imagining"); il cervello usa circa il 20% dell'energia a riposo.

Ricostruire: `cd sorgente && python3 sintesi_iq.py && python3 iq.py` (testi in `script_iq.py`).
Font: Permanent Marker (Apache 2.0) e Patrick Hand (OFL), in `sorgente/font`.

---

# What if your IQ kept rising forever? (versione 3D cinematografica)

Short verticale (1080×1920, ~59 s, inglese) nello stile dei video "What if" in simulazione 3D low-poly: narratore
calmo, titolo con font serif, piccolo contatore "YOUR IQ" a sinistra, un sottotitolo corsivo serif alla volta,
inquadrature larghe e luce morbida. Sei a un picnic al parco mentre il tuo QI sale e a ogni livello capisci qualcosa
di impossibile per noi oggi:

| IQ | Cosa capiresti | Scena |
|---|---|---|
| 100 → 160 | più intelligente di tutti tranne 1 su 30.000 | picnic al parco |
| 250 → 320 | nessun test può misurarti; vedi schemi ovunque | fili luminosi tra persone e alberi |
| 500 | cos'è la materia oscura | notte, ragnatela cosmica nel cielo |
| 1.000 | l'invecchiamento come un refuso nel DNA | doppia elica dorata, un gradino rosso diventa verde |
| 10.000 | una piccola stella in un barattolo (fusione) | barattolo luminoso, la gente si avvicina |
| 100.000 | cos'è la coscienza | rete di neuroni che cresce dalla tua testa |
| 1.000.000 | come è nato l'universo e cosa c'era prima | galassia a spirale nel cielo |
| ∞ | tutto; "forse è la cosa più solitaria di tutte" | luce bianca, poi tu da solo nel parco al tramonto |

- `what_if_your_iq_kept_rising_forever.mp4`

**Titolo**: What if your IQ kept rising forever? 🧠✨ #shorts
**Descrizione**: From 100 to infinity — what would you finally understand? Dark matter, aging, consciousness, the
beginning of the universe... What would you want to understand first? 👇
#whatif #iq #simulation #science #universe #animation #shorts

Numeri: IQ 160 = +4 deviazioni ≈ 1 persona su 31.600. Oltre ~160 i test non misurano più nulla: il video dice che da
IQ 250 in poi è immaginazione.

Ricostruire (motore 3D in `../video what if/sorgente`, scene in `web/shots/iq_X.js`; server locale:
`cd "../video what if/sorgente/web" && python3 -m http.server 8128 --bind 127.0.0.1`):
`cd sorgente3d && python3 sintesi_iq3d.py && python3 iq3d.py --timeline && python3 iq3d.py --render && python3 iq3d.py --mux`
