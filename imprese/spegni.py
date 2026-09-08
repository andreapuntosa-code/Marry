# -*- coding: utf-8 -*-
"""
spegni.py — Timer di spegnimento: imposti i minuti, lui aspetta, chiude i
programmi aperti e spegne il computer.

Pensato per lanciare un invio lungo e andare a dormire: quando il conto
arriva a zero il PC si spegne da solo.

Come chiude i programmi:
  1. chiede gentilmente a ogni finestra aperta di chiudersi (come se
     premessi la X): i programmi possono salvare il lavoro;
  2. dopo qualche secondo forza quelli rimasti aperti;
  3. spegne.
I processi di sistema non vengono mai toccati.

Uso:
    python spegni.py            finestra con timer da impostare
    python spegni.py 60         parte subito con 60 minuti
    python spegni.py 90 --ora   nessuna finestra: 90 minuti in console
"""

import os
import subprocess
import sys
import time
import tkinter as tk
from tkinter import font as tkfont
from tkinter import messagebox

# ------------------------------- PALETTE ----------------------------------
# Gli stessi colori dell'interfaccia principale.

BG        = "#02090f"
PANNELLO  = "#04141d"
BORDO     = "#0b4a5c"
CIANO     = "#22e0ff"
CIANO_CHI = "#8df4ff"
TESTO     = "#a9e8f5"
TESTO_DEB = "#4d8b9c"
VERDE     = "#25f0a8"
ROSSO     = "#ff5c6e"
AMBRA     = "#ffc857"

MINUTI_PREDEFINITI = 60
ATTESA_CHIUSURA = 8          # secondi concessi ai programmi per chiudersi da soli

# Processi che NON vanno mai chiusi: sono Windows stesso, oppure servono
# a far arrivare vivo lo spegnimento (compreso questo script).
INTOCCABILI = {
    # Windows stesso: chiuderli manderebbe in crisi il sistema.
    "system", "registry", "smss", "csrss", "wininit", "winlogon", "services",
    "lsass", "svchost", "fontdrvhost", "dwm", "explorer", "sihost", "ctfmon",
    "taskhostw", "runtimebroker", "textinputhost", "applicationframehost",
    "shellexperiencehost", "startmenuexperiencehost", "searchhost", "searchapp",
    "lockapp", "dllhost", "conhost", "audiodg", "systemsettings",
    # Servono a far arrivare vivo lo spegnimento (compreso questo script).
    "python", "pythonw", "py", "cmd", "powershell", "windowsterminal",
    "openconsole",
}


# ------------------------------- FUNZIONI ---------------------------------


def programmi_aperti():
    """Nomi dei programmi con una finestra aperta, senza i processi di sistema.

    Chiede a PowerShell i processi che hanno una finestra principale: e' il
    modo piu' diretto per distinguere un programma che stai usando da un
    servizio che gira in sottofondo.
    (Il vecchio 'tasklist /V' faceva lo stesso lavoro ma impiegava oltre
    mezzo minuto, mentre questo risponde in meno di un secondo.)"""
    comando = ("Get-Process | Where-Object {$_.MainWindowTitle -ne ''} "
               "| Select-Object -ExpandProperty ProcessName")
    try:
        grezzo = subprocess.run(
            ["powershell", "-NoProfile", "-NonInteractive", "-Command", comando],
            capture_output=True, text=True, encoding="utf-8", errors="replace",
            timeout=30, creationflags=getattr(subprocess, "CREATE_NO_WINDOW", 0)
        ).stdout
    except Exception:
        return []                          # nel dubbio non si chiude niente:
                                           # ci pensera' comunque shutdown /f

    trovati = []
    for riga in grezzo.splitlines():
        nome = riga.strip()
        if not nome or nome.lower() in INTOCCABILI:
            continue
        # PowerShell restituisce "blocco note", a taskkill serve "blocco note.exe"
        eseguibile = nome if nome.lower().endswith(".exe") else nome + ".exe"
        if eseguibile not in trovati:
            trovati.append(eseguibile)
    return trovati


def chiudi(nome, forza=False):
    """Chiede a un programma di chiudersi (o lo forza)."""
    comando = ["taskkill", "/IM", nome]
    if forza:
        comando.insert(1, "/F")
    try:
        esito = subprocess.run(comando, capture_output=True, text=True, timeout=20,
                               creationflags=getattr(subprocess, "CREATE_NO_WINDOW", 0))
        return esito.returncode == 0
    except Exception:
        return False


def spegni_ora(ritardo=10):
    """Ordina a Windows di spegnersi."""
    subprocess.run(["shutdown", "/s", "/f", "/t", str(ritardo),
                    "/c", "Spegnimento programmato dal timer."],
                   creationflags=getattr(subprocess, "CREATE_NO_WINDOW", 0))


def annulla_spegnimento():
    subprocess.run(["shutdown", "/a"], capture_output=True,
                   creationflags=getattr(subprocess, "CREATE_NO_WINDOW", 0))


# ------------------------------- FINESTRA ---------------------------------


class Timer:
    def __init__(self, root, minuti_iniziali=None):
        self.root = root
        root.title("Timer di spegnimento")
        root.geometry("430x330")
        root.resizable(False, False)
        root.configure(bg=BG)

        mono = "Consolas" if "Consolas" in set(tkfont.families()) else "Courier New"
        self.f_titolo = tkfont.Font(family=mono, size=13, weight="bold")
        self.f_conto = tkfont.Font(family=mono, size=42, weight="bold")
        self.f_pic = tkfont.Font(family=mono, size=9)
        self.f_bot = tkfont.Font(family=mono, size=9, weight="bold")

        self.restanti = 0
        self.attivo = False
        self.in_chiusura = False

        tk.Label(root, text="◈ TIMER DI SPEGNIMENTO", bg=BG, fg=CIANO,
                 font=self.f_titolo).pack(pady=(18, 2))
        self.sotto = tk.Label(root, text="imposta i minuti e avvia", bg=BG,
                              fg=TESTO_DEB, font=self.f_pic)
        self.sotto.pack()

        self.conto = tk.Label(root, text="--:--", bg=BG, fg=CIANO_CHI,
                              font=self.f_conto)
        self.conto.pack(pady=(14, 6))

        riga = tk.Frame(root, bg=BG)
        riga.pack()
        tk.Label(riga, text="MINUTI", bg=BG, fg=TESTO_DEB,
                 font=self.f_pic).pack(side="left", padx=(0, 8))
        cornice = tk.Frame(riga, bg=BORDO)
        cornice.pack(side="left")
        self.campo = tk.Spinbox(cornice, from_=1, to=1440, width=6, justify="center",
                                font=self.f_bot, bg=PANNELLO, fg=CIANO_CHI, bd=0,
                                relief="flat", highlightthickness=0,
                                buttonbackground=PANNELLO)
        self.campo.delete(0, "end")
        self.campo.insert(0, minuti_iniziali or MINUTI_PREDEFINITI)
        self.campo.pack(padx=1, pady=1, ipady=3)

        bottoni = tk.Frame(root, bg=BG)
        bottoni.pack(pady=16)
        self.btn_avvia = self._bottone(bottoni, "AVVIA", self.avvia, VERDE)
        self.btn_avvia.pack(side="left", padx=4)
        self.btn_piu = self._bottone(bottoni, "+15 MIN", self.rimanda, CIANO)
        self.btn_piu.pack(side="left", padx=4)
        self.btn_annulla = self._bottone(bottoni, "ANNULLA", self.annulla, ROSSO)
        self.btn_annulla.pack(side="left", padx=4)

        self.nota = tk.Label(root, text="", bg=BG, fg=TESTO_DEB, font=self.f_pic,
                             wraplength=390, justify="center")
        self.nota.pack(pady=(0, 6))

        root.protocol("WM_DELETE_WINDOW", self.chiudi_finestra)
        self.aggiorna_bottoni()
        if minuti_iniziali:
            self.avvia()

    def _bottone(self, parent, testo, comando, colore):
        cornice = tk.Frame(parent, bg=colore)
        b = tk.Button(cornice, text=testo, command=comando, bg=PANNELLO, fg=colore,
                      activebackground=colore, activeforeground=BG, relief="flat",
                      bd=0, padx=14, pady=7, cursor="hand2", font=self.f_bot,
                      disabledforeground=BORDO)
        b.pack(padx=1, pady=1)
        cornice.bottone = b
        return cornice

    def aggiorna_bottoni(self):
        self.btn_avvia.bottone.configure(state="disabled" if self.attivo else "normal")
        for c in (self.btn_piu, self.btn_annulla):
            c.bottone.configure(state="normal" if self.attivo else "disabled")

    # ------------------------------ azioni --------------------------------

    def avvia(self):
        if self.attivo:
            return
        try:
            minuti = max(1, int(self.campo.get()))
        except ValueError:
            minuti = MINUTI_PREDEFINITI
        self.restanti = minuti * 60
        self.attivo = True
        aperti = programmi_aperti()
        self.sotto.configure(text="il PC si spegnerà allo scadere", fg=AMBRA)
        self.nota.configure(
            text=f"Verranno chiusi {len(aperti)} programmi aperti. "
                 "Salva il lavoro importante: dopo l'avviso i programmi che non "
                 "rispondono vengono chiusi comunque.")
        self.aggiorna_bottoni()
        self.tic()

    def rimanda(self):
        if self.attivo:
            self.restanti += 15 * 60
            self.mostra()

    def annulla(self):
        self.attivo = False
        self.restanti = 0
        annulla_spegnimento()           # se lo spegnimento era gia' stato ordinato
        self.conto.configure(text="--:--", fg=CIANO_CHI)
        self.sotto.configure(text="annullato: nessuno spegnimento previsto",
                             fg=TESTO_DEB)
        self.nota.configure(text="")
        self.aggiorna_bottoni()

    def chiudi_finestra(self):
        if self.attivo and not messagebox.askyesno(
                "Timer attivo",
                "Il timer è in funzione. Chiudendo la finestra lo spegnimento "
                "viene annullato.\n\nVuoi uscire?"):
            return
        annulla_spegnimento()
        self.root.destroy()

    # ------------------------------ conteggio ------------------------------

    def mostra(self):
        ore, resto = divmod(max(0, self.restanti), 3600)
        minuti, secondi = divmod(resto, 60)
        testo = f"{ore}:{minuti:02d}:{secondi:02d}" if ore else f"{minuti:02d}:{secondi:02d}"
        self.conto.configure(text=testo,
                             fg=ROSSO if self.restanti <= 60 else CIANO_CHI)

    def tic(self):
        if not self.attivo:
            return
        self.mostra()
        if self.restanti <= 0:
            self.esegui_spegnimento()
            return
        self.restanti -= 1
        self.root.after(1000, self.tic)

    def esegui_spegnimento(self):
        """Chiude i programmi con garbo, poi forza, poi spegne."""
        if self.in_chiusura:
            return
        self.in_chiusura = True
        self.attivo = False
        self.aggiorna_bottoni()
        self.conto.configure(text="00:00", fg=ROSSO)
        self.sotto.configure(text="chiusura dei programmi in corso…", fg=AMBRA)
        self.root.update()

        aperti = programmi_aperti()
        for nome in aperti:
            chiudi(nome)                       # richiesta gentile
        self.nota.configure(text=f"Chiusura richiesta a {len(aperti)} programmi. "
                                 f"Attendo {ATTESA_CHIUSURA} secondi…")
        self.root.update()

        # Attesa durante la quale la finestra resta viva e disegnata.
        fine = time.time() + ATTESA_CHIUSURA
        while time.time() < fine:
            self.root.update()
            time.sleep(0.1)

        rimasti = [n for n in programmi_aperti() if n in aperti]
        for nome in rimasti:
            chiudi(nome, forza=True)           # chi non ha risposto

        self.sotto.configure(text="spegnimento in corso…", fg=ROSSO)
        self.nota.configure(text="Per fermarlo adesso: apri il Prompt dei comandi "
                                 "e scrivi  shutdown /a")
        self.root.update()
        spegni_ora(10)


# --------------------------------- MAIN ------------------------------------


def modalita_console(minuti):
    """Versione senza finestra, per chi preferisce il terminale."""
    print(f"Spegnimento fra {minuti} minuti. Ctrl+C per annullare.")
    try:
        for restanti in range(minuti * 60, 0, -1):
            ore, resto = divmod(restanti, 3600)
            m, s = divmod(resto, 60)
            print(f"\r  mancano {ore}:{m:02d}:{s:02d}   ", end="", flush=True)
            time.sleep(1)
    except KeyboardInterrupt:
        print("\nAnnullato.")
        return

    print("\nChiudo i programmi aperti…")
    aperti = programmi_aperti()
    for nome in aperti:
        chiudi(nome)
    time.sleep(ATTESA_CHIUSURA)
    for nome in [n for n in programmi_aperti() if n in aperti]:
        chiudi(nome, forza=True)
    print("Spegnimento. Per fermarlo:  shutdown /a")
    spegni_ora(10)


def main():
    if os.name != "nt":
        sys.exit("Questo script funziona su Windows.")

    minuti = None
    for argomento in sys.argv[1:]:
        if argomento.isdigit():
            minuti = int(argomento)

    if "--ora" in sys.argv or "--console" in sys.argv:
        return modalita_console(minuti or MINUTI_PREDEFINITI)

    root = tk.Tk()
    Timer(root, minuti)
    root.mainloop()


if __name__ == "__main__":
    main()
