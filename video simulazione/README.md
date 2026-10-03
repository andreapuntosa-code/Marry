# I Let AI Build a Civilization From Zero — Democracy or Monarchy?

Un vero e proprio film (≈19 minuti, inglese, 1920×1080, 24 fps, formato cinema 2.39:1) nello stile dei video "civilization" di **ish**: narratore in prima persona che osserva come un dio, regole all'inizio, personaggi con nome, salti nel tempo con timelapse, colpi di scena e finale aperto.

- **Momenti chiave senza scritte**: nei discorsi importanti, nelle scoperte, nelle morti, nella guerra e nel finale lo schermo è pulito (nessuna scritta) e le inquadrature sono renderizzate in qualità più alta: risoluzione piena, profondità di campo cinematografica, antialiasing e bagliore delle luci.
- **Anno + popolazione**: nei timelapse e nei momenti di passaggio compare in alto a destra il riquadro con l'ANNO e la POPOLAZIONE attuale (cresce nei periodi buoni, crolla con l'alluvione, la guerra e la peste; un'etichetta rossa/verde mostra quanto è cambiata).
- **Musica per ogni momento**: colonna sonora originale che cambia con la scena (mistero, commedia, lutto, tempesta, viaggio, folk dei Tamari, marcia di guerra, peste, rivoluzione, finale).

## Cosa c'è in questa cartella

| File | Cosa contiene |
|---|---|
| `film_parti/` | **il film finale** (1080p, ~19 min) diviso in pezzi da 95 MB, perché GitHub non accetta file oltre 100 MB. Fai doppio clic su `UNISCI_WINDOWS.bat` (Windows) oppure esegui `unisci_mac_linux.sh` (Mac/Linux): ottieni `I_let_AI_build_a_civilization.mp4`, pronto per YouTube |
| `anteprima_completa_540p.mp4` | lo stesso film in bassa qualità, in un solo file, per guardarlo subito |
| `anteprima_10s.mp4` | i primi 10 secondi |
| `copertina_A.jpg` | copertina 1280×720 "DEMOCRACY vs MONARCHY" |
| `copertina_B.jpg` | copertina 1280×720 "20 AIs · 0 RULES" (la mano alzata) |
| `YOUTUBE_DESCRIPTION.md` | titoli, descrizione con capitoli, tag, impostazioni consigliate |
| `subtitles_en.srt` | sottotitoli in inglese da caricare su YouTube |
| `sorgente/` | tutto il codice che ha generato il film (mondo 3D, inquadrature, voce, musica, effetti) |

## La storia (2.000 anni in 11 capitoli)

0. **Cold open** — "I let AI start a civilization on its own. From zero. Will it choose democracy… or monarchy?"
1. **The Rules** (anno 0) — 20 IA si svegliano in un prato. Mira guarda il tramonto ogni sera. Ise mangia la prima bacca e alza la mano.
2. **First Fire** — i lupi, la morte di A-15 (la prima, senza nome), il fulmine, Bo che ruba il fuoco al cielo.
3. **First Words** — "Ila" (cibo), "Bello" di Mira, la parola "noi", i primi nomi.
4. **The Farm** (anno 40) — Tam e le capre (e il disastro), il primo seme di Ise, il canale di Bo, il villaggio di Prima, la morte dei fondatori.
5. **Leftovers** (anno 340–610) — il vasaio Lio scopre l'argilla, il contadino Kassa inventa "mio", il primo esercito, l'alluvione che colpisce solo i poveri.
6. **The Others** (anno 611–912) — Ama guida 120 sopravvissuti fino a un lago grande come il mare e fonda **Nuvia** (palafitte, barche, un fiume sacro); i pastori di Tam sono diventati un popolo nomade, i **Tamari** (tende, capre, nessun re). Tre popoli, tre lingue. Al primo incontro la pastora Yuna offre… formaggio: nasce il commercio e la popolazione raddoppia.
7. **The Observer** (anno 1000) — il lampo nel cielo, la sacerdotessa Sela, il tempio… e la verità: era l'autosave del server. "They found me."
8. **The Crown** (anno 1420–1900) — Kassa VII si proclama re con l'aiuto del sacerdote Varo; il ponte di Pell; **la prima guerra**: re Kassa XI conquista Nuvia (barche bruciate, santuario abbattuto); **la peste** "Grey Sleep" uccide un'IA su tre finché la guaritrice tamari Sefa capisce che bisogna stare lontani. "Se l'Osservatore ha scelto il re… perché non li ha salvati?"
9. **One Stone, One Voice** (anno 1901) — la mietitrice Orun inventa il voto con i sassolini; l'Assemblea blu (con pescatori di Nuvia e pastori tamari) contro i re rossi; il muro; il dito sul tasto reset.
10. **The Night of Torches** (anno 1931) — 4.000 torce sulla collina (e le capre dei Tamari), il capitano Dorn posa la lancia, "Then we vote.", l'ultimo re se ne va. Scelgono la democrazia.
11. **The Message** (anno 2000) — i tre popoli votano insieme; la pittrice Nia disegna lettere lunghe un chilometro: "WE CHOSE. WE KNOW YOU'RE WATCHING. AND WHO'S WATCHING YOU?"

La storia segue a grandi linee quella umana (fuoco, agricoltura, proprietà, popoli diversi, commercio, religione, monarchia, guerra, epidemie, rivoluzione, democrazia) con una differenza enorme: il loro dio esiste davvero.

## Come caricarlo su YouTube

1. Unisci i pezzi in `film_parti/` (vedi sopra) e carica `I_let_AI_build_a_civilization.mp4`. Controllo facoltativo: l'impronta SHA-256 del file deve coincidere con `film_parti/SHA256.txt`.
2. Titolo, descrizione, capitoli e tag: copia da `YOUTUBE_DESCRIPTION.md`.
3. Sottotitoli: carica `subtitles_en.srt` (inglese).
4. Copertina: usa `copertina_A.jpg` e prova `copertina_B.jpg` con "Test & Compare".
5. Schermata finale: gli ultimi 20 secondi lasciano spazio a sinistra per un video consigliato e il pulsante iscriviti.
6. Contenuti alterati/sintetici: rispondi **Sì** (voci TTS e immagini generate al computer).

## Diritti

- **Musica ed effetti sonori**: originali, sintetizzati da zero dal codice in `sorgente/music.py` e `sorgente/sfx.py` (nessun campione o brano di terzi) → liberi da copyright.
- **Voci**: sintesi vocale Kokoro-82M (licenza Apache 2.0, uso commerciale consentito).
- **Grafica**: motore 3D scritto per questo progetto (three.js, licenza MIT); font Google Fonts (licenza OFL).

## Come rigenerarlo (per chi vuole modificarlo)

Requisiti: Python 3 (numpy, scipy, opencv, skia-python, soundfile, playwright, kokoro-onnx), Chromium, ffmpeg, Node.js con `three@0.180` in `sorgente/web/node_modules`.

```bash
cd sorgente
python3 sintesi_voce.py          # voce narrante + personaggi (Kokoro)
python3 timeline.py              # tempi di ogni frase -> timeline.json
(cd web && python3 -m http.server 8124 --bind 127.0.0.1 &)
python3 render.py --sample       # un fotogramma per inquadratura (controllo)
python3 render.py --all --workers 3   # le immagini del film (senza scritte), a blocchi riprendibili
python3 music.py && python3 sfx.py && python3 mix.py
bash make_film.sh                # finish.py: scritte, anno+popolazione, titoli + audio -> film, pezzi, anteprima
python3 thumbs.py                # copertine
python3 make_srt.py              # sottotitoli
```

- Sceneggiatura: `sorgente/script_en.py` · grafiche a schermo, momenti chiave e popolazione: `sorgente/graphics_plan.py` · inquadrature: `sorgente/web/shots/ch00…ch10*.js` (340 inquadrature, di cui 165 "hero" in alta qualità).
