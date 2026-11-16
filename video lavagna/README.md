# Lavagna e gesso: video esplicativi verticali (Remotion)

Video 1080×1920, 30 fps, in stile lavagna verde con scritte e disegni tracciati a mano, oggetti
**3D** (three.js) con la stessa grana del gesso, cancellino tra una sezione e l'altra, voce
narrante e sottotitoli sempre visibili.

Ogni video è una cartella in `videos/` con il suo `scenes.json`:

| Video | Cartella | MP4 pronto |
|---|---|---|
| Sovrapposizione quantistica (EN, circa 77 s) | `videos/superposition` | `superposition_explained.mp4` |
| Integrali: vasca, limone, auto (EN, circa 2 min 18 s, con 3D) | `videos/integrals` | `integrals_explained.mp4` |
| Sovrapposizione quantistica (IT, solo copione) | `videos/superposizione-it` | lancia prima `npm run tts -- superposizione-it` |

## Installazione

Servono Node.js 18 o più recente (consigliato 20+).

```bash
cd "video lavagna"
npm install
```

## Anteprima e render

```bash
npx remotion studio                                          # anteprima: a sinistra scegli il video
npx remotion render integrals out/integrals.mp4 --gl=angle   # export MP4 di un video
```

L'id della composizione è il nome della cartella in `videos/`. Per gli oggetti 3D serve WebGL:
`--gl=angle` va bene su Mac e Windows. Su Linux senza GPU usa `--gl=swangle`, che è più lento.
Al primo render Remotion scarica un Chrome headless. Per usarne uno già installato:
`REMOTION_BROWSER_EXECUTABLE=/percorso/chrome npx remotion render ...`

## La voce

```bash
npm run tts -- integrals                 # <video> = nome della cartella in videos/
```

Questo comando legge `videos/<video>/scenes.json`, crea un file audio per ogni scena in
`public/audio/<video>/`, scrive i tempi di ogni parola in `src/generated/<video>.timings.json` e
aggiunge il video all'elenco di Remotion. Scritte, disegni, oggetti 3D e sottotitoli si agganciano
a quei tempi.

- **ElevenLabs**: copia `.env.example` in `.env` e inserisci `ELEVENLABS_API_KEY=...`, poi lancia
  `npm run tts -- <video>`. Usa il modello multilingua (`eleven_multilingual_v2`) e l'endpoint
  `with-timestamps`, quindi i tempi delle parole sono esatti. Voce, stabilità e velocità si
  cambiano in `scenes.json` → `voice.elevenlabs`, oppure con `ELEVENLABS_VOICE_ID` in `.env`.
- **Senza chiave**: crea file WAV **muti** come segnaposto, con durata stimata.
- **La tua voce registrata**: salva i file come `public/audio/<video>/<id-scena>.mp3` (oppure
  `.wav` o `.m4a`) e lancia `npm run tts -- <video> --provider=manual`. Le durate vengono lette
  dai file e i tempi delle parole sono stimati.
- **Voce locale gratuita (Kokoro)**: è quella dei video già pronti, voce `af_heart`. Richiede
  Python con `pip install kokoro-onnx soundfile numpy` e i file `kokoro-v1.0.onnx` e
  `voices-v1.0.bin` in `./models`, oppure in una cartella indicata da `KOKORO_MODELS`. Si lancia con
  `npm run tts -- <video> --provider=kokoro`. I tempi sono esatti per frase e stimati per parola.
  - La lingua si imposta in `voice.kokoro.lang` (`en-us`, `it`, ...).
  - Le parole difficili si correggono in `voice.kokoro.pronunciations`.
- Per rigenerare solo alcune scene: `npm run tts -- <video> --only=hook,outro`.

Se cambi il testo di una scena senza rigenerare l'audio, nell'anteprima compare un avviso rosso.

## Fare un altro video

Crea `videos/mio-video/scenes.json` (copia quello degli integrali), lancia
`npm run tts -- mio-video` e poi `npx remotion studio`.

```jsonc
{
  "style": { "board": "#1F3B2D", "chalk": "#F2F2F2", "accent": "#F5D76E", "font": "Caveat",
             "palette": { "blue": "#8FC3E8", "pink": "#F2A7B8", "green": "#A8DDA0" } },
  "timing": { "leadIn": 0.4, "hold": 1.0, "erase": 1.0, "tail": 2.2, "sentencePause": 0.5 },
  "scenes": [
    {
      "id": "lemon",
      "narration": "Now, a lemon. ... So let's slice it! ... Thinner slices? ...",
      "actions": [
        { "type": "3d", "model": "Lemon3D", "at": "lemon", "duration": 1.4,
          "cues": ["slice", "thinner"], "x": 540, "y": 780, "width": 1040, "height": 820 },
        { "type": "text", "text": "1 slice ≈ *1 coin*", "at": "coin", "x": 540, "y": 1270, "size": 90 },
        { "type": "drawing", "drawing": "Check", "at": "works", "x": 820, "y": 1410,
          "width": 140, "height": 130, "color": "green" }
      ]
    }
  ]
}
```

- `at`: la parola della narrazione in cui l'elemento inizia a comparire.
  - `"two#2"` indica la seconda volta che compare "two".
  - `"car"` trova anche "car's", e `"elettrone"` trova anche "l'elettrone".
  - `"start"` e `"end"` indicano l'inizio e la fine della scena.
  - `delay` aggiunge secondi di ritardo.
- `out`: la parola in cui l'elemento sparisce (dissolvenza).
- `color`: `"white"`, `"yellow"`, un nome di `style.palette` (`"blue"`, `"pink"`, ...) o un
  colore CSS.
- Testi:
  - `*parola*` diventa gialla e `\n` va a capo;
  - `size` è in px e `cps` sono le lettere al secondo;
  - le frecce `→ ↑ ↓ ←` vengono disegnate col gesso.
- Disegni (`"type": "drawing"`) e oggetti 3D (`"type": "3d"`):
  - `x` e `y` sono il centro; `width` e `height` sono il riquadro;
  - `duration` è il tempo di comparsa;
  - `then` e `thenDuration` attivano una seconda fase (la vasca che si riempie, la lampadina che si accende);
  - `cues` è una lista di parole, ognuna delle quali attiva una fase successiva (le fette del
    limone, i rettangoli 4 → 10 → 100);
  - `props` contiene parametri extra.
- Coordinate in pixel su 1080×1920. Lascia libera la fascia in basso (sotto y ≈ 1700), dove
  stanno i sottotitoli.

### Disegni disponibili (`src/drawings`)

| Nome | Uso e fasi |
|---|---|
| `Arrow` | Freccia; `props.direction`: up, down, left, right |
| `Underline` | Sottolineatura; `props.count` |
| `IntegralSign` | Simbolo ∫ |
| `Check` | Spunta ✓ |
| `Spiral` | Spirale |
| `TwoBalls` | Due palline con il punto interrogativo |
| `Bathtub`, `Lemon`, `Car` | Icone |
| `Spinner` | Trottola |
| `MotionLines` | Linee di movimento |
| `LightBulb` | Lampadina; si accende con `then` oppure con `props.lit` |
| `Wave` | Onda; collassa in un picco con `then`; `props.axis` |
| `Chip` | Chip quantistico |
| `RiemannGraph` | Grafico velocità/tempo. `cues`: area, 4 rettangoli, 10, 100, area esatta. I valori numerici sono calcolati davvero |
| `LineGraph` | Retta y = x. `cues`: area da 0 a 2, poi il triangolo con base e altezza |

### Oggetti 3D disponibili (`src/models3d`)

| Nome | Fasi |
|---|---|
| `Tank3D` | Vasca con rubinetto. `then`: si riempie uno strato al "secondo" (veloce, poi lento, poi variabile). `cues[0]`: gli strati si separano per contarli |
| `Lemon3D` | Limone. `cues[0]`: 7 fette spesse e separate. `cues[1]`: 26 fette sottili, quasi unite |

La camera gira lentamente attorno agli oggetti 3D. Contorni bianchi spessi e grana del gesso li
fanno sembrare disegnati sulla lavagna.

## Struttura

```
videos/<video>/scenes.json     copione + azioni sulla lavagna (un file per video)
scripts/tts.mjs                voce + tempi delle parole (ElevenLabs / segnaposto / manuale / Kokoro)
public/audio/<video>/          audio delle scene
public/fonts/                  Caveat e Gochi Hand (SIL OFL), così il render funziona anche offline
src/generated/                 tempi e elenco dei video (generati da npm run tts)
src/Lavagna.tsx                composizione principale
src/timeline.ts                aggancia ogni azione alla sua parola
src/components/
  ChalkText.tsx                testo scritto lettera per lettera
  ChalkDrawing.tsx             disegno 2D tracciato (stroke-dashoffset)
  Chalk3D.tsx                  oggetto 3D (three.js) con la grana del gesso
  EraseTransition.tsx          cancellino tra le sezioni
  Subtitles.tsx                sottotitoli in basso
  Chalkboard.tsx, ChalkDefs.tsx  lavagna, texture e filtro "gesso"
src/drawings/                  disegni 2D (un file per disegno) + index.ts
src/models3d/                  oggetti 3D (un file per oggetto) + index.ts + chalk3d.tsx (utilità)
```

## Aggiungere un disegno 2D

1. Crea `src/drawings/MioDisegno.tsx`. `Spiral.tsx` è l'esempio più semplice.

   ```tsx
   const MioDisegno: React.FC<DrawingProps> = ({p, color, sw, seed}) => (
     <ChalkPath d={handEllipse(100, 100, 80, 80, seed)} p={p} color={color} width={sw} />
   );
   export default {viewBox: '0 0 200 200', component: MioDisegno} satisfies DrawingDef;
   ```

   `p` è l'avanzamento da 0 a 1. Per tracciare più linee una dopo l'altra, usa
   `seg(p, inizio, fine)`. `cues[i]` contiene le fasi extra. In `sketch.ts` trovi aiuti per
   linee e cerchi "a mano": `handLine`, `handEllipse`, `smooth`, `jitter`.
2. Registralo in `src/drawings/index.ts`.

## Aggiungere un oggetto 3D

1. Crea `src/models3d/MioOggetto.tsx`, partendo da `Tank3D.tsx`. Il componente riceve
   `p`, `p2`, `cues`, `t` (secondi) e `colors`. In `chalk3d.tsx` ci sono:
   - `ChalkEdges`: contorni spessi di una geometria;
   - `ChalkLine`: linee spesse;
   - `OrbitCamera`: camera che gira attorno all'oggetto;
   - `ChalkLights`: luci;
   - `useRevealPlane`: fa comparire l'oggetto dal basso verso l'alto.
2. Registralo in `src/models3d/index.ts`.
3. Usalo in `scenes.json` con `{ "type": "3d", "model": "MioOggetto", ... }`.
