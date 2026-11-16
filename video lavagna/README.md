# Lavagna e gesso: video esplicativi verticali (Remotion)

Video 1080×1920, 30 fps, in stile lavagna verde con scritte e disegni tracciati a mano,
cancellino tra una sezione e l'altra, voce narrante italiana e sottotitoli sempre visibili.

Il primo video, *"Una pallina può stare in due posti nello stesso momento?"* (sovrapposizione
quantistica, circa 77 s), è già pronto in `sovrapposizione_quantistica.mp4`.

## Installazione

Servono Node.js 18 o più recente (consigliato 20+).

```bash
cd "video lavagna"
npm install
```

## Anteprima e render

```bash
npx remotion studio                                    # anteprima nel browser (oppure: npm run studio)
npx remotion render Lavagna out/video.mp4              # export MP4 (oppure: npm run render)
```

Al primo render Remotion scarica un Chrome headless. Per usarne uno già installato:
`REMOTION_BROWSER_EXECUTABLE=/percorso/chrome npx remotion render ...`

## La voce

```bash
npm run tts
```

Questo comando legge `scenes.json`, crea un file audio per ogni scena in `public/audio/` e scrive
i tempi di ogni parola in `src/generated/timings.json`. Scritte, disegni e sottotitoli si agganciano
a quei tempi.

- **ElevenLabs**: copia `.env.example` in `.env` e inserisci `ELEVENLABS_API_KEY=...`, poi lancia
  `npm run tts`. Usa il modello multilingua (`eleven_multilingual_v2`) e l'endpoint
  `with-timestamps`, quindi i tempi delle parole sono esatti. Voce, stabilità e velocità si
  cambiano in `scenes.json` → `voice.elevenlabs`, oppure con `ELEVENLABS_VOICE_ID` in `.env`.
- **Senza chiave**: `npm run tts` crea file WAV **muti** come segnaposto, con durata stimata, così
  il video si costruisce lo stesso.
- **La tua voce registrata**: salva i file come `public/audio/<id-scena>.mp3` (oppure `.wav` o
  `.m4a`), per esempio `public/audio/gancio.mp3`, e lancia `npm run tts -- --provider=manual`.
  Le durate vengono lette dai file. I tempi delle parole sono stimati in proporzione alla loro
  lunghezza.
- **Voce locale gratuita (Kokoro)**: è quella usata nel video già pronto, voce `if_sara`. Richiede
  Python con `pip install kokoro-onnx soundfile numpy` e i file `kokoro-v1.0.onnx` e
  `voices-v1.0.bin` in `./models`, oppure in una cartella indicata da `KOKORO_MODELS`. Si lancia con
  `npm run tts -- --provider=kokoro`. Qui i tempi sono esatti per frase e stimati per parola. Le
  parole inglesi si correggono in `voice.kokoro.pronunciations`.
- Per rigenerare solo alcune scene: `npm run tts -- --only=gancio,chiusura`.

Se cambi il testo di una scena senza rigenerare l'audio, nell'anteprima compare un avviso rosso.

## Fare un altro video: modifica solo `scenes.json`

```jsonc
{
  "timing": { "leadIn": 0.4, "hold": 0.6, "erase": 1.0, "tail": 2.0, "sentencePause": 0.5 },
  "scenes": [
    {
      "id": "gancio",                      // nome del file audio
      "narration": "Una pallina può stare in due posti...",
      "actions": [
        { "type": "text", "text": "Due posti\n*insieme?*", "at": "una", "x": 540, "y": 600, "size": 190 },
        { "type": "drawing", "drawing": "TwoBalls", "at": "stesso", "duration": 2.2,
          "x": 540, "y": 1120, "width": 860, "height": 470 }
      ]
    }
  ]
}
```

- `at`: la parola della narrazione in cui l'elemento inizia a comparire.
  - `"gira#2"` indica la seconda volta che compare "gira".
  - `"start"` e `"end"` indicano l'inizio e la fine della scena.
  - `delay` aggiunge secondi di ritardo.
- `out`: la parola in cui l'elemento sparisce (dissolvenza).
- Testi:
  - `*parola*` diventa gialla e `\n` va a capo;
  - `size` è la dimensione in px e `cps` le lettere al secondo;
  - `color` può essere `"white"` o `"yellow"`;
  - `font` può essere `"Caveat"` o `"Gochi Hand"`;
  - le frecce `→ ↑ ↓ ←` vengono disegnate col gesso.
- Disegni:
  - `drawing` è il nome del disegno; `x` e `y` sono il centro; `width` e `height` sono il riquadro;
  - `duration` è in secondi;
  - `then` e `thenDuration` attivano la seconda fase (la lampadina che si accende, l'onda che collassa);
  - `props` contiene parametri extra, per esempio `{ "direction": "up" }` per `Arrow`.
- Tra una scena e l'altra il cancellino pulisce la lavagna. Le coordinate sono in pixel su
  1080×1920. Lascia libera la fascia in basso (sotto y ≈ 1700), dove stanno i sottotitoli.

## Struttura

```
scenes.json                  copione + azioni sulla lavagna (l'unico file da cambiare)
scripts/tts.mjs              voce + tempi delle parole (ElevenLabs / segnaposto / manuale / Kokoro)
scripts/tts_kokoro.py        voce locale Kokoro
public/audio/                audio delle scene
public/fonts/                Caveat e Gochi Hand (SIL OFL), così il render funziona anche offline
src/generated/timings.json   tempi generati da npm run tts
src/Lavagna.tsx              composizione principale
src/timeline.ts              aggancia ogni azione alla sua parola
src/components/
  ChalkText.tsx              testo scritto lettera per lettera
  ChalkDrawing.tsx           disegno tracciato (stroke-dashoffset)
  EraseTransition.tsx        cancellino tra le sezioni
  Subtitles.tsx              sottotitoli in basso
  Chalkboard.tsx             lavagna con texture e aloni
  ChalkDefs.tsx              filtro SVG "gesso" (bordi ruvidi e grana)
src/drawings/                un file per disegno + index.ts (registro)
```

## Aggiungere un disegno

1. Crea `src/drawings/MioDisegno.tsx`. `Spiral.tsx` è l'esempio più semplice.

   ```tsx
   const MioDisegno: React.FC<DrawingProps> = ({p, color, sw, seed}) => (
     <ChalkPath d={handEllipse(100, 100, 80, 80, seed)} p={p} color={color} width={sw} />
   );
   export default {viewBox: '0 0 200 200', component: MioDisegno} satisfies DrawingDef;
   ```

   `p` è l'avanzamento da 0 a 1. Per tracciare più linee una dopo l'altra, usa
   `seg(p, inizio, fine)`. In `sketch.ts` trovi aiuti per linee e cerchi "a mano":
   `handLine`, `handEllipse`, `smooth`, `jitter`.
2. Registralo in `src/drawings/index.ts`.
3. Usalo in `scenes.json` con `"drawing": "MioDisegno"`.
