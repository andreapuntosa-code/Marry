# 100 AIs in an Arena: Only One Walks Out

Film di circa 20 minuti (inglese, 1920×1080, 30 fps pieni, formato cinema 2.39:1) nello stile dei film precedenti: manichini-AI, narratore in prima persona.

**Il setup**: 100 IA in un'arena sotto una cupola di vetro, con il Corno d'oro al centro e sei mondi attorno (foresta, palude, deserto, lago, montagna di ghiaccio, prato). L'ultimo in piedi vince. Ogni 10 giorni la zona sicura si restringe (statica rossa fuori), e a Day 100 è grande come il Corno. Il narratore controlla il tempo e le pareti, mai chi vive. Quando una IA viene spenta, una stella si spegne nel cielo e suona una campana (PG-13).

**Protagonisti (16)**: Rex, Vex, June, Finn (il Branco); Kai, Luna, Dax, Toby, Pip (i Quieti); Bolt, Rook, Aster, Marlo, Sage, Echo, Zara.

**Cosa cambia rispetto ai film precedenti**
- Voce più lenta (velocità 0,8 e pause vere), domande con intonazione che sale (PSOLA) e pause lunghe prima e dopo.
- Ogni fotogramma è disegnato davvero (niente fotogrammi ripetuti): 30 fps.
- Schede animate con il nome quando un personaggio compare, e richiami brevi quando torna dopo un po'.
- Grafica (giorno, sopravvissuti, 100 stelle) dentro lo stesso render: un solo render, poi si aggiunge solo l'audio.
- Controllo automatico animazioni (`sorgente/qa_anim.py`): arti nel terreno, mani nel corpo, armi nel suolo, giunti iperestesi.
- Corretto un bug dello scheletro che sfalsava corpo e accessori dei personaggi molto alti o piccoli.

| File | Cosa |
|---|---|
| `film_parti/` | il film in pezzi da 95 MB; `UNISCI_WINDOWS.bat` o `unisci_mac_linux.sh` lo ricompongono in `Hunger_Arena_100.mp4` |
| `anteprima_completa_540p.mp4` | anteprima leggera |
| `YOUTUBE_DESCRIPTION.md` | titolo, descrizione, capitoli |
| `sorgente/` | codice: `script_hg.py`, `sintesi_hg.py`, `music_hg.py`, `sfx_hg.py`, `mix_hg.py`, `render.py`, `hgfx.py`, motore in `web/` |
