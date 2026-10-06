# 100 AIs in a Forest vs 100 AIs on a Plain — The Wall Falls on Day 365

Un film (≈30 minuti, inglese, 1920×1080, 24 fps, formato cinema 2.39:1) nello stesso stile del primo, con gli stessi personaggi-manichino. Narratore in prima persona che osserva senza intervenire.

**Il setup**: 100 IA in una foresta fitta e nebbiosa (i **Verdane**, case sugli alberi) e 100 IA su una pianura dorata di grano e cavalli (gli **Aurel**), separate da un Muro gigante. Conoscenze di base: parlare, contare, fuoco, corda, ascia, piantare un seme. Al giorno 365, all'alba, il Muro cade. Vince chi ha più IA vive al tramonto.

## Personaggi principali
- 🌲 **Verdane**: Wren (esploratrice), Oak (costruttore), Fern (guaritrice), Bram (cacciatore, capo di guerra), Moss (sacerdote dell'Albero Cavo), Ivy (la Speaker), Thorn (ribelle).
- 🌾 **Aurel**: Sol (contadino, capo), Dune (cavaliere), Ash (fabbro), Kesh (generale), Lark (sacerdotessa del Sole), Reed (mercante), Mara (populista).

## Capitoli
| | Capitolo | Giorno |
|---|---|---|
| I | The Rules | 0 |
| II | The First Night | 1 |
| III | Survival | 12 |
| IV | The Gods | 61 |
| V | The Vote | 111 |
| VI | The Hunger | 170 |
| VII | The Coup | 226 |
| VIII | The Crack | 281 |
| IX | The Last Night | 330 |
| X | Day 365 — The Wall Falls | 365 |
| XI | The Winner | tramonto |

Circa il 75% del film è preparazione: società, politica, religioni, alleanze, tradimenti. La guerra arriva alla fine.

## Cosa c'è in questa cartella
| File | Cosa contiene |
|---|---|
| `film_parti/` | **il film finale** (1080p) diviso in pezzi da 95 MB; `UNISCI_WINDOWS.bat` o `unisci_mac_linux.sh` lo ricompongono in `Forest_vs_Plain_Day_365.mp4` |
| `anteprima_completa_540p.mp4` | lo stesso film in bassa qualità, in un solo file |
| `copertina_A.jpg`, `copertina_B.jpg` | copertine 1280×720 |
| `YOUTUBE_DESCRIPTION.md` | titoli, descrizione con capitoli, tag |
| `subtitles_en.srt` | sottotitoli in inglese |
| `sorgente/` | tutto il codice (mondo 3D, inquadrature, voce, musica, effetti) |

## Note tecniche
- Render con three.js + Playwright. Nelle scene normali un fotogramma ogni tre viene disegnato e ripetuto (per i tempi di render); i momenti chiave (cold open, scelta di Dune, duello Kesh–Bram, stretta di mano finale) sono a 24 fps con profondità di campo.
- HUD in alto a destra: giorno e le due popolazioni (Foresta / Pianura).
