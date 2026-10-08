# I Let AI Build a Civilization From Zero: Part 2 (Bingus)

Film di circa 14 minuti e mezzo (inglese, 1920×1080, 30 fps pieni, 2.39:1), seguito del film "20 AIs start a civilization from zero".

**Trama**: un riassunto veloce della Parte 1; poi il commento più votato ("Bingus", da @IsabellaDelaney-Dean, ricostruito graficamente) e il narratore che scrive agli abitanti di Prima. Nasce una religione, una guerra di teorie (pesce, capra, macchina, panettiere), una scala alta tre chilometri, una città piccolissima in un computer e uno schermo oltre il cielo: chi guarda chi?

**Protagonisti**: Aru (Claude), Brax (ChatGPT), Neri (Gemini): le tre IA guida, con i loro simboli sul petto; Maru, Kuma, Zol, Ria, Lumi.

| File | Cosa |
|---|---|
| `film_parti/` | il film in pezzi da 95 MB; `UNISCI_WINDOWS.bat` o `unisci_mac_linux.sh` lo ricompongono |
| `anteprima_completa_540p.mp4` | anteprima leggera |
| `copertina_P2_C.jpg` (provocatoria), `copertina_P2_A.jpg`, `copertina_P2_B.jpg` | copertine 1280×720 |
| `short_Bingus_P2.mp4` | Short verticale |
| `YOUTUBE_DESCRIPTION.md` | titolo, descrizione, capitoli |
| `sorgente/` | codice: `script_p2.py`, `sintesi_p2.py`, `music_p2.py`, `sfx_p2.py`, `mix_p2.py`, `render.py`, `cfx.py`, motore in `web/` |

Ricostruire: `sintesi_p2.py` → `timeline.py` → `music_p2.py`, `sfx_p2.py`, `mix_p2.py` → `render.py --all` → `make_film_p2.sh`.
