# I Let 20 AIs Live in the Stone Age: Will They Survive?

Film di circa 13 minuti e mezzo (inglese, 1920×1080, 30 fps pieni, 2.39:1), stesso stile dei film precedenti: manichini-AI, narratore in prima persona veloce.

**Trama**: venti IA senza utensili né parole si svegliano nella neve di un'era glaciale. Il freddo, i lupi, il primo fuoco da un fulmine, la caccia al mammut (la prima va male, la seconda con una trappola), un inverno terribile in cui nasce la prima pittura (una mano sulla parete) e la scoperta della neve come frigorifero. Poi la divisione: i Camminatori (Walkers) seguono le mandrie, addomesticano i lupi e inventano il tamburo; i Custodi (Keepers) restano nella grotta e trasformano la parete in una biblioteca. Dopo diecimila anni si ritrovano senza una parola in comune... tranne la prima: "Woo", fuoco.

**Personaggi**: Gorn (il forte), Lia (la custode del fuoco), Tuk (il chiassoso), Kru (il più piccolo), Mei (la pittrice) e altre quindici IA, vestite in pelli, ossa e pittura sul viso; nelle copertine tre guide con i simboli in stile Claude, ChatGPT e Gemini.

| File | Cosa |
|---|---|
| `film_parti/` | il film in pezzi da 95 MB; `UNISCI_WINDOWS.bat` o `unisci_mac_linux.sh` lo ricompongono |
| `anteprima_completa_540p.mp4` | anteprima leggera |
| `copertina_PRE.jpg` | copertina 1280×720 |
| `YOUTUBE_DESCRIPTION.md` | titolo, descrizione, capitoli |
| `sorgente/` | codice: `script_pre.py`, `sintesi_pre.py`, `music_pre.py`, `sfx_pre.py`, `mix_pre.py`, `render.py`, `cfx.py`, motore in `web/` (animali mammut/dente a sciabola, accessori preistorici, neve, grotta con pitture in `web/lib/pre.js`) |

Ricostruire: `sintesi_pre.py` → `timeline.py` → `music_pre.py`, `sfx_pre.py`, `mix_pre.py` → `render.py --all` → `make_film_pre.sh`.
