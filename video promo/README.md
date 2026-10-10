# Short promo per un altro account

`short_promo_canale.mp4`: 1080×1920, 29 secondi, voce inglese (diversa dal narratore del canale), sottotitoli parola per parola, musica.

Testo parlato:
> There's a YouTube channel where AIs build a civilization from zero. And the comments control it.
> Every episode, the most liked comment gets sent into the simulation. Last time, the top comment was... Bingus.
> So the AIs started a religion about it. Then they built a ladder to the sky, to find out what it means.
> And at the top, they found a giant screen. With our comments on it. You decide what happens next. Link in bio.

**Titolo** (Shorts/TikTok/Reels)
This YouTube channel lets the comments control an AI civilization 🤯 #shorts

**Descrizione / didascalia**
One comment said "Bingus". Now the AIs have a religion about it.
The most liked comment goes into the simulation every episode. Link to the channel in bio.
#ai #simulation #civilization #bingus #chatgpt #claude #gemini

Ricostruire: `video simulazione 2/sorgente/make_promo.py` (usa le parti del film Parte 2 in `video simulazione 2/film_parti/`).

---

# Versione 2: "un creator che ne parla" (canale vero, nessun numero inventato)

`short_promo_the_animator.mp4`: 1080×1920, ~30 secondi, nello stile del video di riferimento: tagli veloci tra spezzoni
dei film a tutto schermo e riprese "a mano" di un monitor con la pagina YouTube vera del canale **The Animator**
(@TheAnimator-j3t, avatar `avatar_the_animator.png`) e un dito che indica; sottotitoli una parola alla volta, voce maschile
informale (diversa dal narratore del canale). Nessun numero di iscritti, visualizzazioni, like o commenti.

> Okay, this YouTube channel is doing something nobody else is doing. They drop twenty AIs into an empty world,
> and the AIs have to build a whole civilization, from zero. But here's the crazy part. The comments control it.
> The most liked comment goes straight into the next video. Someone commented Bingus,
> and now the AIs have a whole religion about Bingus. They built a ladder to the sky, just to find out what it is.
> And there's a brand new one in the Stone Age. Cavemen, mammoths, fire.
> The channel's called The Animator. Go comment, you might end up in the next video. Link in bio.

**Titolo**: This YouTube channel lets the comments control an AI civilization 🤯 #shorts

Ricostruire: `python3 "video simulazione 2/sorgente/make_promo2.py"` (usa le parti dei film Parte 2 e Preistoria).

---

# Test A/B: 5 ad in formati diversi

Tutti 1080×1920, finiscono con la scheda vera del canale (The Animator, @TheAnimator-j3t, Subscribe, "Link in bio"). Nessun numero inventato.
Rigenerare: `python3 "video simulazione 2/sorgente/ads.py" A|B|C|D|E`.

| File | Formato | Durata | Voce | Idea |
|---|---|---|---|---|
| `ad_A_pov_meme.mp4` | **POV meme** | ~21 s | no (solo testo + beat) | "POV: you comment Bingus…" → the AIs: religione, scala verso il cielo, trovano i commenti, "THEY KNOW." |
| `ad_B_top3.mp4` | **Top 3 / classifica** | ~24 s | sì, energica | #3 la religione di Bingus, #2 l'arena da 100 IA, #1 l'Età della Pietra con due specie |
| `ad_C_lore.mp4` | **Lore cinematografica** | ~31 s | sì, profonda e lenta | "In the year 2040, twenty AIs received one word… Bingus." Musica cupa, scritte serif |
| `ad_D_evolution.mp4` | **Evoluzione a ritmo** | ~20 s | no (beat con drop) | Una parola grande per stacco: STONE AGE → FIRE → … → SPACE → "WHAT'S NEXT?" |
| `ad_E_you_decide.mp4` | **Decidi tu (call to action)** | ~21 s | sì, femminile | "What should they get next? Money? The internet? A volcano? Bingus 2?" con i commenti che appaiono |

Consiglio per il test: pubblicali a 1–2 giorni di distanza, alla stessa ora, con titolo e hashtag simili
(es. "This YouTube channel lets the comments control an AI civilization #shorts"), poi confronta dopo 48 h
la percentuale di visualizzazione (viewed vs swiped away), la durata media e quante persone aprono il canale.
