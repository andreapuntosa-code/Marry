# Cavaliere sotto la pioggia (dark fantasy, chill)

Video verticale 1080×1920, 30 fps, 30 secondi. Un cavaliere in armatura sta su una rupe di notte,
sotto la pioggia, con la spada piantata nel terreno e una lanterna appesa all'elsa. Davanti a lui
c'è un castello con le finestre accese e la luna che spunta tra le nuvole. Sotto va la musica
(Golden Brown).

| File | Contenuto |
|---|---|
| `knight_in_the_rain.mp4` | video + ambiente pioggia leggero (gocce, tintinnii sull'armatura, due tuoni lontani) |
| `knight_in_the_rain_silent.mp4` | solo video, senza audio: pronto per metterci sotto la canzone |

## Cosa si muove

- Pioggia su 3 livelli di profondità. Le gocce vicino alla lanterna diventano arancioni.
- Schizzi a terra, cerchi nella pozzanghera, gocce che rimbalzano sull'armatura e gocce che colano
  da spallaccio, elsa e mantello.
- Mantello e pennacchio mossi dal vento. La lanterna oscilla e la sua fiamma tremola.
- Il cavaliere respira, con un movimento appena percettibile.
- Nuvole che scorrono davanti alla luna, nebbia nella valle e a terra.
- Finestre del castello che tremolano.
- Due lampi lontani: a 8,3 s e a 21 s.
- Lenta carrellata in avanti con parallasse, bloom, grana pellicola e vignettatura.

## Rifare il render

Servono Python 3 con `numpy`, `opencv-python`, `scipy`, `skia-python` e `ffmpeg`.

```bash
cd "video cavaliere/sorgente"
python3 knight_rain.py preview 60,250,630                        # fotogrammi PNG in ./preview
python3 knight_rain.py render ../knight_in_the_rain.mp4 --jobs 4  # video completo (circa 8 minuti)
```

Tutto è generato da codice, senza immagini esterne. Le cose che si cambiano più spesso sono
all'inizio di `knight_rain.py`:

- `LIGHTNING`: i secondi in cui cadono i lampi;
- `MOON`: posizione e raggio della luna;
- `DUR`: la durata.
