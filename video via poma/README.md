# Via Poma: animated noir documentary opening (Remotion)

A ~92-second, 1920×1080, 30 fps animated opening about the unsolved 1990 Via Poma case in Rome.
Everything is drawn in code (SVG and CSS). The soundtrack is synthesised in code too, so there are
no photos, no samples and no third-party assets. The victim is never shown and neither is any
violence: the film only suggests.

- Final video: `out/via_poma.mp4`
- Look-check stills: `out/stills/`

## Setup

```bash
cd "video via poma"
npm install
npm run studio        # live preview in the browser
npm run render        # renders out/via_poma.mp4 (raw CRF 18, ~260 MB because of the grain)
npx remotion still ViaPoma out/stills/frame.png --frame=540   # a single frame
```

On Linux without a desktop Chrome, point Remotion at any Chromium:
`REMOTION_BROWSER_EXECUTABLE=/path/to/chrome npm run render`.

## Where to change things

| What | File |
|---|---|
| All on-screen text, scene durations, cue times | `src/content.json` |
| Colours and fonts | `src/theme.ts` |
| Scene layouts and animation | `src/scenes/S1…S8*.tsx` (one component per scene) |
| The building / the office drawings | `src/drawings/Building.tsx`, `src/drawings/Office.tsx` |
| Grain, vignette, flicker, dust, camera push, fades | `src/components/effects.tsx` |
| Typed text, redaction bars, rubber stamps | `src/components/Typewriter.tsx`, `Redacted.tsx`, `Stamp.tsx` |
| Soundtrack | `scripts/make_audio.py` → `public/audio/soundtrack.wav` |

### Text and timings (`src/content.json`)

- Each scene has a `duration` in seconds. Scenes play back to back, and each one fades in from
  black and out to black (`fadeSeconds`). The total length is the sum of the durations.
- `texts`: `text` is what gets typed (`\n` starts a new line), `at` is the second within the scene
  when typing starts, and `cps` is characters per second.
- Scene-specific cues are also in this file, all in seconds from the start of the scene:
  - `lightsOut.flickerOff` and `lightsOut.lampOutAt`: when the lamp flickers and when it goes out;
  - `caseFile`: the folder opening (`openAt`), the sheet lines, the redaction bars, and the suspect
    cards with their stamps;
  - `threads`: the words on the board, and when the threads appear, tighten and go slack;
  - `dna`: when the seven profiles light up;
  - `finale`: the title and its timing.

**After changing any text or timing, regenerate the soundtrack** so that the typewriter keys,
stamps and pins stay in sync:

```bash
npm run audio      # needs python3 with numpy + scipy
```

### Colours and fonts (`src/theme.ts`)

`COLORS` holds the whole palette:

- `bg`: the near-black background;
- the blue-greys for line art;
- `amber` for the sodium-lamp light;
- `red`: the one muted red, used only for the stamps, the threads and the calendar circle.

Fonts are bundled in `public/fonts`:

- Special Elite, a typewriter face (Apache 2.0), used for dates and case-file text;
- Cormorant Garamond (SIL OFL), used for titles.

### Effects (`src/components/effects.tsx`)

| Effect | Where to adjust it |
|---|---|
| Grain | `opacity` on `<Grain>` |
| Vignette | `strength` |
| Light flicker | The formula inside `Flicker` |
| Dust | `count` and `color` |
| Camera push | `CameraPush` (`from`, `to` and `origin`, set per scene) |

## Audio

`scripts/make_audio.py` builds the whole ambience with numpy and scipy. Nothing is sampled:

- a low drone and room tone;
- clock ticks in the cold open;
- a typewriter key for every typed character;
- distant city noise under the building scenes;
- lamp hum and crackle, and a low thump when the lamp dies;
- paper sounds and stamp thuds in the case file;
- pins and a rising/falling tone on the thread board;
- soft blips in the DNA scene;
- one low note under the final title.

It is mastered quietly, at about −23 LUFS, so you can lay narration or music on top. To use your
own track instead, replace `public/audio/soundtrack.wav`. If that file is missing, the video simply
renders silent.

## Content note

The storyboard text was supplied by the producer. Verify the 2026 DNA line against current
reporting before publishing.

## Output size

Film grain is very hard to compress. The raw Remotion render at CRF 18 is about 260 MB. The
committed `out/via_poma.mp4` was re-encoded with a two-pass encode at 7 Mbit/s (about 80 MB), so
it stays under GitHub's 100 MB file limit:

```bash
ffmpeg -i raw.mp4 -c:v libx264 -preset slow -b:v 7000k -pass 1 -an -f null /dev/null
ffmpeg -i raw.mp4 -c:v libx264 -preset slow -b:v 7000k -maxrate 10000k -bufsize 16000k -pass 2 \
  -pix_fmt yuv420p -c:a aac -b:a 160k -movflags +faststart out/via_poma.mp4
```
