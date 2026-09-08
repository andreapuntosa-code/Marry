# -*- coding: utf-8 -*-
"""
interfaccia.py — Interfaccia grafica in stile HUD (tkinter, nativo) per:
  - Cercare imprese (edili, elettricisti, idraulici, immobiliari) in una
    citta' (trova_locali.py)
  - Verificare che le email esistano davvero (verifica_email.py)
  - Inviare le proposte (invia_email.py)
  - Vedere e modificare la lista dei contatti (imprese.csv)

Tutto disegnato a mano su Canvas: nessuna immagine, nessuna libreria esterna.
Avvio:  python interfaccia.py   (oppure doppio clic sul file)
"""

import math
import os
import queue
import threading
import time
import tkinter as tk
from tkinter import font as tkfont
from tkinter import messagebox, ttk

# Lavora sempre nella cartella dello script (cosi' vale anche col doppio clic).
os.chdir(os.path.dirname(os.path.abspath(__file__)))

import account
import invia_email
import testi_imprese
import memoria
import trova_locali
import verifica_email

# ------------------------------- PALETTE ----------------------------------

BG        = "#120d06"   # fondo generale, bruno molto scuro
PANNELLO  = "#1e1509"   # fondo dei riquadri
PANNELLO2 = "#2a1d0c"   # fondo piu' chiaro (righe alterne, hover)
BORDO     = "#6b4415"   # linee sottili, bronzo
ACCENTO     = "#ff9d2e"   # colore principale: arancione cantiere
ACCENTO_CHI = "#ffcf94"   # arancione chiaro, per i numeri
ACCENTO_SCU = "#b8650a"   # arancione spento
TESTO     = "#f0d9b5"   # testo normale, crema caldo
TESTO_DEB = "#a9885f"   # testo secondario
VERDE     = "#7ed957"   # esito positivo
GIALLO    = "#ffd83d"   # lavorazione in corso
ROSSO     = "#ff5c4d"   # pericolo / stop

# Sfumature per simulare il bagliore degli anelli (dal centro verso fuori).
BAGLIORE = ["#3a2510", "#83530f", "#c67d15", ACCENTO]


# --------------------------- WIDGET PERSONALIZZATI -------------------------


class Bottone(tk.Frame):
    """Pulsante squadrato con bordo luminoso, come i comandi di un HUD.

    E' un Frame che fa da cornice e contiene il vero Button: e' l'unico modo
    per avere un bordo colorato di 1 pixel identico su tutti i sistemi."""

    def __init__(self, parent, testo, comando, colore=ACCENTO, larghezza=None):
        super().__init__(parent, bg=colore, bd=0, highlightthickness=0)
        self.colore = colore
        self.bottone = tk.Button(
            self, text=testo.upper(), command=comando, bg=PANNELLO, fg=colore,
            activebackground=colore, activeforeground=BG, relief="flat", bd=0,
            padx=16, pady=7, cursor="hand2", disabledforeground=BORDO,
            font=tkfont.Font(family="Consolas", size=9, weight="bold"))
        if larghezza:
            self.bottone.configure(width=larghezza)
        self.bottone.pack(padx=1, pady=1, fill="both", expand=True)
        self.bottone.bind("<Enter>", self._entra)
        self.bottone.bind("<Leave>", self._esce)

    def _attivo(self):
        return str(self.bottone["state"]) != "disabled"

    def _entra(self, _=None):
        if self._attivo():
            self.bottone.configure(bg=self.colore, fg=BG)

    def _esce(self, _=None):
        if self._attivo():
            self.bottone.configure(bg=PANNELLO, fg=self.colore)

    def configure(self, **kw):
        """Inoltra 'state' e 'text' al bottone interno, il resto alla cornice."""
        if "state" in kw:
            stato = kw.pop("state")
            self.bottone.configure(state=stato)
            spento = str(stato) == "disabled"
            self.bottone.configure(bg=PANNELLO, fg=BORDO if spento else self.colore)
            super().configure(bg=BORDO if spento else self.colore)
        if "text" in kw:
            self.bottone.configure(text=str(kw.pop("text")).upper())
        if kw:
            super().configure(**kw)

    config = configure


class Anello(tk.Canvas):
    """Indicatore circolare: anello di sfondo, arco di riempimento, tacche
    perimetrali e un settore che ruota lentamente per dare vita al quadro."""

    def __init__(self, parent, etichetta, colore=ACCENTO, dimensione=136):
        super().__init__(parent, width=dimensione, height=dimensione,
                         bg=PANNELLO, highlightthickness=0, bd=0)
        self.dim = dimensione
        self.colore = colore
        self.etichetta = etichetta
        self.valore = 0
        self.massimo = 1
        self.angolo = 0.0
        self.f_num = tkfont.Font(family="Consolas", size=20, weight="bold")
        self.f_eti = tkfont.Font(family="Consolas", size=8)
        self._disegna()

    def imposta(self, valore, massimo):
        self.valore = valore
        self.massimo = max(1, massimo)
        self._disegna()

    def ruota(self):
        """Fa avanzare il settore rotante di un passo (chiamata dal timer)."""
        self.angolo = (self.angolo + 2.2) % 360
        self._disegna()

    def _disegna(self):
        self.delete("all")
        d = self.dim
        c = d / 2
        r = c - 10

        # Tacche perimetrali: 48 trattini, piu' luminosi dove arriva il valore.
        quota = self.valore / self.massimo
        for i in range(48):
            ang = math.radians(i * 7.5 - 90)
            acceso = (i / 48.0) <= quota
            r1, r2 = (r + 2, r + 7) if acceso else (r + 3, r + 6)
            self.create_line(c + r1 * math.cos(ang), c + r1 * math.sin(ang),
                             c + r2 * math.cos(ang), c + r2 * math.sin(ang),
                             fill=self.colore if acceso else BORDO, width=1)

        # Anello di fondo.
        self.create_oval(c - r, c - r, c + r, c + r, outline=BORDO, width=6)

        # Arco del valore, disegnato tre volte con spessori calanti: da lontano
        # sembra un bagliore attorno alla linea principale.
        estensione = -359.9 * quota if quota >= 0.999 else -360 * quota
        if quota > 0:
            for larghezza, colore in ((10, BAGLIORE[1]), (7, BAGLIORE[2]), (4, self.colore)):
                self.create_arc(c - r, c - r, c + r, c + r, start=90,
                                extent=estensione, style="arc",
                                outline=colore, width=larghezza)

        # Settore che ruota: due archi corti in orbita esterna.
        for scarto in (0, 180):
            self.create_arc(c - r - 8, c - r - 8, c + r + 8, c + r + 8,
                            start=self.angolo + scarto, extent=34, style="arc",
                            outline=ACCENTO_SCU, width=2)

        # Cerchio interno e valori.
        self.create_oval(c - r + 14, c - r + 14, c + r - 14, c + r - 14,
                         outline=BORDO, width=1)
        self.create_text(c, c - 6, text=str(self.valore), fill=ACCENTO_CHI,
                         font=self.f_num)
        self.create_text(c, c + 18, text=self.etichetta.upper(), fill=TESTO_DEB,
                         font=self.f_eti)


class Pannello(tk.Frame):
    """Riquadro con bordo sottile e piccoli angoli luminosi (stile HUD)."""

    def __init__(self, parent, titolo=None):
        super().__init__(parent, bg=BORDO, bd=0, highlightthickness=0)
        self.interno = tk.Frame(self, bg=PANNELLO, bd=0, highlightthickness=0)
        self.interno.pack(padx=1, pady=1, fill="both", expand=True)
        if titolo:
            barra = tk.Frame(self.interno, bg=PANNELLO)
            barra.pack(fill="x", padx=12, pady=(9, 0))
            tk.Label(barra, text="▸ " + titolo.upper(), bg=PANNELLO, fg=ACCENTO_SCU,
                     font=tkfont.Font(family="Consolas", size=8, weight="bold")
                     ).pack(side="left")
            linea = tk.Frame(barra, bg=BORDO, height=1)
            linea.pack(side="left", fill="x", expand=True, padx=(8, 0), pady=6)


# --------------------------------- APP -------------------------------------


class App:
    def __init__(self, root):
        self.root = root
        root.title("IMPRESE // MAIL OPS")
        root.geometry("1080x700")
        root.minsize(940, 620)
        root.configure(bg=BG)

        self._font()
        self._stili_ttk()

        self.coda_log = queue.Queue()
        self.log_attivo = None
        self.in_corso = False
        self.stop_event = threading.Event()
        self.pagine = {}
        self.nav = {}
        self.anelli = []

        # Barra superiore con marchio e orologio.
        self._barra_superiore()

        corpo = tk.Frame(root, bg=BG)
        corpo.pack(fill="both", expand=True)

        self.sidebar = tk.Frame(corpo, bg=BG, width=212)
        self.sidebar.pack(side="left", fill="y")
        self.sidebar.pack_propagate(False)

        self.area = tk.Frame(corpo, bg=BG)
        self.area.pack(side="left", fill="both", expand=True)

        self.contenuto = tk.Frame(self.area, bg=BG)
        self.contenuto.pack(fill="both", expand=True, padx=(4, 20), pady=(14, 6))
        self.contenuto.grid_rowconfigure(0, weight=1)
        self.contenuto.grid_columnconfigure(0, weight=1)

        self.barra = tk.Label(self.area, text="", bg=BG, fg=TESTO_DEB,
                              anchor="w", padx=4, pady=6, font=self.f_mono)
        self.barra.pack(fill="x", side="bottom")

        self._costruisci_sidebar()
        self._pagina_cerca()
        self._pagina_invia()
        self._pagina_contatti()
        self._pagina_testo()

        root.protocol("WM_DELETE_WINDOW", self._chiudi)
        self.root.after(100, self._svuota_coda)
        self.root.after(70, self._anima)
        self._orologio()
        self._applica_account()
        self._mostra("cerca")
        self._stato("sistema pronto")

    # ------------------------------ STILE --------------------------------

    def _font(self):
        disp = set(tkfont.families())
        mono = "Consolas" if "Consolas" in disp else "Courier New"
        testo = "Segoe UI" if "Segoe UI" in disp else "Helvetica"
        self.f_logo  = tkfont.Font(family=mono, size=14, weight="bold")
        self.f_h1    = tkfont.Font(family=mono, size=17, weight="bold")
        self.f_nav   = tkfont.Font(family=mono, size=10, weight="bold")
        self.f_mono  = tkfont.Font(family=mono, size=9)
        self.f_body  = tkfont.Font(family=testo, size=10)
        self.f_small = tkfont.Font(family=mono, size=8)
        self.f_log   = tkfont.Font(family=mono, size=9)

    def _stili_ttk(self):
        st = ttk.Style()
        try:
            st.theme_use("clam")
        except tk.TclError:
            pass
        st.configure("HUD.Treeview", background=PANNELLO, fieldbackground=PANNELLO,
                     foreground=TESTO, rowheight=27, borderwidth=0, font=self.f_mono)
        st.configure("HUD.Treeview.Heading", background=PANNELLO2, foreground=ACCENTO,
                     relief="flat", padding=6, font=self.f_small, borderwidth=0)
        st.map("HUD.Treeview.Heading", background=[("active", BORDO)])
        st.map("HUD.Treeview", background=[("selected", ACCENTO_SCU)],
               foreground=[("selected", "#00131a")])
        st.configure("HUD.Vertical.TScrollbar", troughcolor=BG, background=BORDO,
                     bordercolor=BG, arrowcolor=ACCENTO, relief="flat", borderwidth=0)
        st.map("HUD.Vertical.TScrollbar", background=[("active", ACCENTO_SCU)])
        st.configure("HUD.TCombobox", fieldbackground=PANNELLO, background=PANNELLO,
                     foreground=ACCENTO, arrowcolor=ACCENTO, bordercolor=BORDO,
                     lightcolor=BORDO, darkcolor=BORDO, insertcolor=ACCENTO,
                     selectbackground=PANNELLO, selectforeground=ACCENTO)
        st.map("HUD.TCombobox", fieldbackground=[("readonly", PANNELLO)],
               bordercolor=[("focus", ACCENTO)])
        self.root.option_add("*TCombobox*Listbox.background", PANNELLO)
        self.root.option_add("*TCombobox*Listbox.foreground", ACCENTO)
        self.root.option_add("*TCombobox*Listbox.selectBackground", ACCENTO_SCU)
        self.root.option_add("*TCombobox*Listbox.selectForeground", BG)
        self.root.option_add("*TCombobox*Listbox.font", self.f_mono)

    # --------------------------- PEZZI DI INTERFACCIA --------------------

    def _barra_superiore(self):
        top = tk.Frame(self.root, bg=BG)
        top.pack(fill="x", padx=20, pady=(12, 0))
        tk.Label(top, text="◆ IMPRESE", bg=BG, fg=ACCENTO, font=self.f_logo).pack(side="left")
        tk.Label(top, text="  //  MAIL OPERATIONS", bg=BG, fg=TESTO_DEB,
                 font=self.f_mono).pack(side="left")
        self.lbl_ora = tk.Label(top, text="", bg=BG, fg=ACCENTO_SCU, font=self.f_mono)
        self.lbl_ora.pack(side="right")
        linea = tk.Frame(self.root, bg=BORDO, height=1)
        linea.pack(fill="x", padx=20, pady=(6, 0))

    def _entry(self, parent, larghezza=24, password=False):
        cornice = tk.Frame(parent, bg=BORDO)
        e = tk.Entry(cornice, font=self.f_mono, bg=PANNELLO, fg=ACCENTO_CHI,
                     relief="flat", width=larghezza, bd=0, highlightthickness=0,
                     insertbackground=ACCENTO, show="•" if password else "")
        # fill+expand: cosi' il campo riempie la cornice anche quando questa
        # viene allargata (pack fill="x"), senza lasciare bordi spessi ai lati.
        e.pack(padx=1, pady=1, ipady=4, ipadx=6, fill="both", expand=True)
        e.cornice = cornice
        return e

    def _spin(self, parent, valore):
        cornice = tk.Frame(parent, bg=BORDO)
        s = tk.Spinbox(cornice, from_=1, to=999, width=5, font=self.f_mono,
                       relief="flat", bg=PANNELLO, fg=ACCENTO_CHI, bd=0,
                       highlightthickness=0, insertbackground=ACCENTO,
                       buttonbackground=PANNELLO2, justify="center")
        s.delete(0, "end")
        s.insert(0, valore)
        s.pack(padx=1, pady=1, ipady=4)
        s.cornice = cornice
        return s

    def _etichetta(self, parent, testo, colore=TESTO_DEB, font=None):
        return tk.Label(parent, text=testo, bg=PANNELLO, fg=colore,
                        font=font or self.f_small)

    def _titolo(self, parent, testo, sottotitolo):
        tk.Label(parent, text="// " + testo.upper(), bg=BG, fg=ACCENTO,
                 font=self.f_h1, anchor="w").pack(anchor="w")
        etichetta = tk.Label(parent, text=sottotitolo, bg=BG, fg=TESTO_DEB,
                             font=self.f_body, anchor="w", justify="left")
        etichetta.pack(anchor="w", pady=(2, 12))
        return etichetta

    def _log_box(self, parent, altezza=14):
        pannello = Pannello(parent, "console")
        interno = tk.Frame(pannello.interno, bg=PANNELLO)
        interno.pack(fill="both", expand=True, padx=12, pady=(6, 12))
        testo = tk.Text(interno, wrap="word", state="disabled", relief="flat", bd=0,
                        bg="#010a0e", fg=TESTO, insertbackground=ACCENTO,
                        font=self.f_log, padx=12, pady=10, height=altezza,
                        highlightthickness=1, highlightbackground=BORDO)
        scroll = ttk.Scrollbar(interno, orient="vertical", command=testo.yview,
                               style="HUD.Vertical.TScrollbar")
        testo.configure(yscrollcommand=scroll.set)
        testo.pack(side="left", fill="both", expand=True)
        scroll.pack(side="right", fill="y")
        # Colori per tipo di messaggio.
        testo.tag_configure("ok", foreground=VERDE)
        testo.tag_configure("no", foreground=ROSSO)
        testo.tag_configure("attesa", foreground=TESTO_DEB)
        testo.tag_configure("nota", foreground=ACCENTO)
        return pannello, testo

    # ------------------------------ SIDEBAR ------------------------------

    def _costruisci_sidebar(self):
        tk.Frame(self.sidebar, bg=BG, height=14).pack()
        voci = [("cerca", "01", "RICERCA"),
                ("invia", "02", "INVIO"),
                ("contatti", "03", "CONTATTI"),
                ("testo", "04", "MESSAGGIO")]
        for chiave, numero, etichetta in voci:
            riga = tk.Frame(self.sidebar, bg=BG, cursor="hand2")
            riga.pack(fill="x", pady=1)
            barretta = tk.Frame(riga, bg=BG, width=3)
            barretta.pack(side="left", fill="y")
            interno = tk.Frame(riga, bg=BG)
            interno.pack(side="left", fill="x", expand=True)
            num = tk.Label(interno, text=numero, bg=BG, fg=BORDO, font=self.f_small)
            num.pack(side="left", padx=(14, 8), pady=11)
            nome = tk.Label(interno, text=etichetta, bg=BG, fg=TESTO_DEB,
                            font=self.f_nav)
            nome.pack(side="left")
            gruppo = (riga, interno, num, nome, barretta)
            for w in gruppo[:4]:
                w.bind("<Button-1>", lambda e, k=chiave: self._mostra(k))
                w.bind("<Enter>", lambda e, k=chiave: self._hover_nav(k, True))
                w.bind("<Leave>", lambda e, k=chiave: self._hover_nav(k, False))
            self.nav[chiave] = gruppo

        tk.Frame(self.sidebar, bg=BORDO, height=1).pack(fill="x", pady=16, padx=14)

        # Riquadro di stato in fondo alla barra laterale.
        self.led = tk.Canvas(self.sidebar, width=180, height=54, bg=BG,
                             highlightthickness=0)
        self.led.pack(side="bottom", pady=16)
        self.lbl_account = tk.Label(self.sidebar, text="", bg=BG, fg=TESTO_DEB,
                                    font=self.f_small, wraplength=180,
                                    justify="left", anchor="w")
        self.lbl_account.pack(side="bottom", fill="x", padx=16, pady=(0, 4))
        self._disegna_led("attesa")

    def _disegna_led(self, stato):
        """Piccolo indicatore luminoso: verde a riposo, ambra durante il lavoro."""
        self.led.delete("all")
        colore = GIALLO if stato == "lavoro" else VERDE
        testo = "OPERAZIONE IN CORSO" if stato == "lavoro" else "IN ATTESA"
        self.led.create_rectangle(2, 2, 178, 52, outline=BORDO)
        for raggio, tinta in ((9, BORDO), (6, ACCENTO_SCU), (3, colore)):
            self.led.create_oval(20 - raggio, 27 - raggio, 20 + raggio, 27 + raggio,
                                 outline=tinta, fill=colore if raggio == 3 else "")
        self.led.create_text(38, 27, text=testo, anchor="w", fill=colore,
                             font=self.f_small)

    def _hover_nav(self, chiave, dentro):
        if chiave == getattr(self, "pagina_attiva", None):
            return
        riga, interno, num, nome, barretta = self.nav[chiave]
        sfondo = PANNELLO if dentro else BG
        for w in (riga, interno, num, nome):
            w.configure(bg=sfondo)
        nome.configure(fg=ACCENTO if dentro else TESTO_DEB)

    def _mostra(self, chiave):
        self.pagina_attiva = chiave
        for k, (riga, interno, num, nome, barretta) in self.nav.items():
            attivo = (k == chiave)
            sfondo = PANNELLO if attivo else BG
            for w in (riga, interno, num, nome):
                w.configure(bg=sfondo)
            nome.configure(fg=ACCENTO if attivo else TESTO_DEB)
            num.configure(fg=ACCENTO_SCU if attivo else BORDO)
            barretta.configure(bg=ACCENTO if attivo else BG)
        self.pagine[chiave].tkraise()
        if chiave == "contatti":
            self._carica_tabella()
        self._aggiorna_conteggi()

    def _nuova_pagina(self, chiave):
        p = tk.Frame(self.contenuto, bg=BG)
        p.grid(row=0, column=0, sticky="nsew")
        self.pagine[chiave] = p
        return p

    # ------------------------------ PAGINE -------------------------------

    def _pagina_cerca(self):
        p = self._nuova_pagina("cerca")
        self._titolo(p, "ricerca imprese",
                     "Dati aperti OpenStreetMap · vengono aggiunte solo imprese nuove")

        pan = Pannello(p, "parametri")
        pan.pack(fill="x")
        r = tk.Frame(pan.interno, bg=PANNELLO)
        r.pack(fill="x", padx=14, pady=(10, 4))

        self._etichetta(r, "CITTÀ").grid(row=0, column=0, sticky="w")
        self._etichetta(r, "MAX").grid(row=0, column=1, sticky="w", padx=(14, 0))
        self.citta = self._entry(r, 26)
        self.citta.insert(0, trova_locali.CITTA)
        self.citta.cornice.grid(row=1, column=0, sticky="w", pady=(3, 0))
        self.max_cerca = self._spin(r, 60)
        self.max_cerca.cornice.grid(row=1, column=1, sticky="w", padx=(14, 14), pady=(3, 0))
        self.btn_cerca = Bottone(r, "avvia scansione", self._avvia_ricerca)
        self.btn_cerca.grid(row=1, column=2, sticky="w", pady=(3, 0))
        self.btn_ferma_cerca = Bottone(r, "stop", self._ferma, ROSSO)
        self.btn_ferma_cerca.grid(row=1, column=3, sticky="w", padx=8, pady=(3, 0))
        self.btn_ferma_cerca.configure(state="disabled")

        riga_tipi = tk.Frame(pan.interno, bg=PANNELLO)
        riga_tipi.pack(fill="x", padx=14, pady=(10, 0))
        self._etichetta(riga_tipi, "TIPOLOGIE DA CERCARE").pack(anchor="w")
        scelte_tipi = tk.Frame(riga_tipi, bg=PANNELLO)
        scelte_tipi.pack(anchor="w", pady=(2, 0))
        self.tipi_ricerca = {}
        for tipo in trova_locali.TIPI_IMPRESA:
            var = tk.BooleanVar(value=True)      # tutte selezionate di default
            self.tipi_ricerca[tipo] = var
            tk.Checkbutton(scelte_tipi, text=testi_imprese.etichetta_tipo(tipo),
                           variable=var, bg=PANNELLO, fg=TESTO, font=self.f_small,
                           activebackground=PANNELLO, activeforeground=ACCENTO,
                           selectcolor=BG, relief="flat", bd=0, highlightthickness=0,
                           cursor="hand2").pack(side="left", padx=(0, 14))

        self.verifica_profonda = tk.BooleanVar(value=trova_locali.VERIFICA_PROFONDA)
        tk.Checkbutton(pan.interno, variable=self.verifica_profonda, bg=PANNELLO,
                       fg=TESTO, font=self.f_small, activebackground=PANNELLO,
                       activeforeground=ACCENTO, selectcolor=BG, relief="flat", bd=0,
                       highlightthickness=0, cursor="hand2", anchor="w",
                       text=" verifica che le email esistano davvero "
                            "(interroga i server di posta)"
                       ).pack(anchor="w", padx=12, pady=(2, 12))

        box, self.log_cerca = self._log_box(p)
        box.pack(fill="both", expand=True, pady=(12, 0))

    def _pagina_invia(self):
        p = self._nuova_pagina("invia")
        self.lbl_mittente = self._titolo(p, "invio proposte", "")

        # Fila di anelli con i numeri della campagna.
        fila = tk.Frame(p, bg=BG)
        fila.pack(fill="x")
        self.anello_coda = self._anello_in_pannello(fila, "in coda", ACCENTO)
        self.anello_inviati = self._anello_in_pannello(fila, "inviati", VERDE)
        self.anello_totale = self._anello_in_pannello(fila, "totale", ACCENTO_SCU)

        pan = Pannello(p, "parametri di invio")
        pan.pack(fill="x", pady=(12, 0))

        riga_acc = tk.Frame(pan.interno, bg=PANNELLO)
        riga_acc.pack(fill="x", padx=14, pady=(10, 0))
        self._etichetta(riga_acc, "CAMPAGNA — SERVIZIO E CASELLA").pack(anchor="w")
        self.account_scelto = tk.StringVar(value=account.attivo()["etichetta"])
        menu = ttk.Combobox(riga_acc, textvariable=self.account_scelto,
                            state="readonly", values=account.etichette(),
                            font=self.f_mono, width=42, style="HUD.TCombobox")
        menu.pack(anchor="w", pady=(3, 0), ipady=3)
        menu.bind("<<ComboboxSelected>>", self._cambia_account)

        riga_modo = tk.Frame(pan.interno, bg=PANNELLO)
        riga_modo.pack(fill="x", padx=14, pady=(10, 0))
        self._etichetta(riga_modo, "TIPO DI INVIO").pack(anchor="w")
        self.modo_invio = tk.StringVar(value="primo")
        scelte = tk.Frame(riga_modo, bg=PANNELLO)
        scelte.pack(anchor="w", pady=(2, 0))
        for valore, testo in (("primo", "primo contatto"),
                              ("rilancio", "rilancio · 2ª email a chi non ha risposto")):
            tk.Radiobutton(scelte, text=testo, value=valore, variable=self.modo_invio,
                           command=self._cambia_modo, bg=PANNELLO, fg=TESTO,
                           font=self.f_small, selectcolor=BG, activebackground=PANNELLO,
                           activeforeground=ACCENTO, relief="flat", bd=0,
                           highlightthickness=0, cursor="hand2").pack(side="left", padx=(0, 14))

        r = tk.Frame(pan.interno, bg=PANNELLO)
        r.pack(fill="x", padx=14, pady=(10, 4))
        self.lbl_password = self._etichetta(r, "")
        self.lbl_password.grid(row=0, column=0, sticky="w", columnspan=2)
        self._etichetta(r, "MAX INVII").grid(row=0, column=2, sticky="w", padx=(14, 0))
        self.password = self._entry(r, 24, password=True)
        self.password.cornice.grid(row=1, column=0, sticky="w", pady=(3, 0))
        self.mostra_pw = tk.BooleanVar(value=False)
        tk.Checkbutton(r, text="mostra", variable=self.mostra_pw, command=self._toggle_pw,
                       bg=PANNELLO, fg=TESTO_DEB, font=self.f_small, selectcolor=BG,
                       activebackground=PANNELLO, activeforeground=ACCENTO, relief="flat",
                       bd=0, highlightthickness=0, cursor="hand2"
                       ).grid(row=1, column=1, sticky="w", padx=(8, 0), pady=(3, 0))
        self.max_invii = self._spin(r, invia_email.MAX_INVII_PER_ESECUZIONE)
        self.max_invii.cornice.grid(row=1, column=2, sticky="w", padx=(14, 0), pady=(3, 0))

        azioni = tk.Frame(pan.interno, bg=PANNELLO)
        azioni.pack(fill="x", padx=14, pady=(8, 12))
        self.btn_invia = Bottone(azioni, "avvia invio", self._avvia_invio, VERDE)
        self.btn_invia.pack(side="left")
        self.btn_ferma = Bottone(azioni, "stop", self._ferma, ROSSO)
        self.btn_ferma.pack(side="left", padx=8)
        self.btn_ferma.configure(state="disabled")

        box, self.log_invia = self._log_box(p, altezza=10)
        box.pack(fill="both", expand=True, pady=(12, 0))

    def _anello_in_pannello(self, parent, etichetta, colore):
        pan = Pannello(parent)
        pan.pack(side="left", fill="both", expand=True, padx=(0, 12))
        anello = Anello(pan.interno, etichetta, colore)
        anello.pack(pady=10)
        self.anelli.append(anello)
        return anello

    def _pagina_contatti(self):
        p = self._nuova_pagina("contatti")
        self._titolo(p, "archivio contatti",
                     "Seleziona una o più righe per agire su di esse")

        barra = tk.Frame(p, bg=BG)
        barra.pack(fill="x", pady=(0, 10))
        Bottone(barra, "aggiorna", self._carica_tabella, ACCENTO_SCU).pack(side="left")
        self.btn_verifica = Bottone(barra, "verifica email", self._avvia_verifica)
        self.btn_verifica.pack(side="left", padx=8)
        Bottone(barra, "sospendi", lambda: self._cambia_stato("Sospeso"),
                ACCENTO_SCU).pack(side="left")
        Bottone(barra, "riattiva", self._riattiva, ACCENTO_SCU).pack(side="left", padx=8)
        Bottone(barra, "elimina", self._elimina_righe, ROSSO).pack(side="left")
        self.lbl_conta = tk.Label(barra, text="", bg=BG, fg=TESTO_DEB, font=self.f_mono)
        self.lbl_conta.pack(side="right")

        pan = Pannello(p)
        pan.pack(fill="both", expand=True)
        cont = tk.Frame(pan.interno, bg=PANNELLO)
        cont.pack(fill="both", expand=True, padx=10, pady=10)
        colonne = ("Nome", "Sito", "Tipo", "Email", "Stato")
        self.tabella = ttk.Treeview(cont, columns=colonne, show="headings",
                                    selectmode="extended", style="HUD.Treeview")
        for col, larg in zip(colonne, (200, 70, 110, 220, 200)):
            self.tabella.heading(col, text=col.upper())
            self.tabella.column(col, width=larg, anchor="w")
        self.tabella.column("Sito", anchor="center")
        self.tabella.column("Tipo", anchor="center")
        self.tabella.tag_configure("dispari", background=PANNELLO2)
        self.tabella.tag_configure("morta", foreground=ROSSO)
        self.tabella.tag_configure("fatta", foreground=TESTO_DEB)
        self.tabella.tag_configure("senzasito", foreground=VERDE)
        scroll = ttk.Scrollbar(cont, orient="vertical", command=self.tabella.yview,
                               style="HUD.Vertical.TScrollbar")
        self.tabella.configure(yscrollcommand=scroll.set)
        self.tabella.pack(side="left", fill="both", expand=True)
        scroll.pack(side="right", fill="y")

        box, self.log_verifica = self._log_box(p, altezza=6)
        box.pack(fill="x", pady=(12, 0))

        self.campi = ["Nome", "Email", "Stato"]
        self.righe = []

    def _pagina_testo(self):
        p = self._nuova_pagina("testo")
        self._titolo(p, "messaggio",
                     "{nome} = nome dell'impresa · ogni contatto riceve il testo "
                     "adatto al suo tipo di attività")

        barra_tipo = tk.Frame(p, bg=BG)
        barra_tipo.pack(fill="x", pady=(0, 10))
        tk.Label(barra_tipo, text="ANTEPRIMA PER:", bg=BG, fg=TESTO_DEB,
                 font=self.f_small).pack(side="left", padx=(0, 8))
        self.tipo_scelto = tk.StringVar(value=testi_imprese.TIPO_PREDEFINITO)
        for codice, etichetta in testi_imprese.TIPI_ETICHETTE.items():
            tk.Radiobutton(barra_tipo, text=etichetta, value=codice,
                           variable=self.tipo_scelto, command=self._applica_account,
                           bg=BG, fg=TESTO, font=self.f_small, selectcolor=PANNELLO,
                           activebackground=BG, activeforeground=ACCENTO, relief="flat",
                           bd=0, highlightthickness=0, cursor="hand2"
                           ).pack(side="left", padx=(0, 8))

        pan = Pannello(p, "contenuto email")
        pan.pack(fill="both", expand=True)
        w = tk.Frame(pan.interno, bg=PANNELLO)
        w.pack(fill="both", expand=True, padx=14, pady=(8, 14))

        self._etichetta(w, "NOME MITTENTE").pack(anchor="w")
        self.mittente_nome = self._entry(w, 60)
        self.mittente_nome.cornice.pack(anchor="w", fill="x", pady=(3, 10))

        self._etichetta(w, "OGGETTO").pack(anchor="w")
        self.oggetto = self._entry(w, 60)
        self.oggetto.cornice.pack(anchor="w", fill="x", pady=(3, 10))

        self._etichetta(w, "CORPO DEL MESSAGGIO").pack(anchor="w")
        cornice = tk.Frame(w, bg=BORDO)
        cornice.pack(fill="both", expand=True, pady=(3, 6))
        self.corpo = tk.Text(cornice, height=11, wrap="word", relief="flat", bd=0,
                             bg="#010a0e", fg=TESTO, insertbackground=ACCENTO,
                             font=self.f_body, padx=10, pady=8, highlightthickness=0)
        self.corpo.pack(padx=1, pady=1, fill="both", expand=True)
        self._etichetta(w, "Anteprima · i testi di tutti i tipi si "
                           "modificano in testi_imprese.py").pack(anchor="w")

    # ------------------------------ AZIONI -------------------------------

    def _cambia_account(self, evento=None):
        if self.in_corso:
            messagebox.showinfo("Operazione in corso",
                                "Aspetta la fine dell'invio prima di cambiare casella.")
            self.account_scelto.set(account.attivo()["etichetta"])
            return
        invia_email.usa_account(account.chiave_da_etichetta(self.account_scelto.get()))
        self._applica_account()
        # Ogni campagna ha la SUA lista e le SUE memorie: va ricaricato tutto.
        self._carica_tabella()
        self._aggiorna_conteggi()
        profilo = account.attivo()
        self._stato(f"campagna: {profilo['servizio']} · lista {profilo['csv']} · "
                    f"da {profilo['email']}")

    def _rilancio_attivo(self):
        return getattr(self, "modo_invio", None) is not None \
            and self.modo_invio.get() == "rilancio"

    def _cambia_modo(self):
        """Primo contatto o rilancio: cambia testo mostrato, anelli e bottone."""
        rilancio = self._rilancio_attivo()
        self.btn_invia.configure(text="avvia rilancio" if rilancio else "avvia invio")
        self._applica_account()
        self._aggiorna_conteggi()
        self._stato("modalità rilancio: seconda email a chi non ha risposto"
                    if rilancio else "modalità primo contatto")

    def _applica_account(self):
        """Allinea i campi alla casella attiva: mittente, password E testo."""
        profilo = account.attivo()
        self.lbl_mittente.configure(
            text=f"{profilo['nome']} <{profilo['email']}>  ·  {profilo['server']}"
                 f"  ·  pausa 30–90 s tra un invio e l'altro")
        self.lbl_password.configure(text="PASSWORD — " + profilo["aiuto"].upper())
        self.lbl_account.configure(
            text="\n   ".join(("◈ " + profilo["servizio"], profilo["email"],
                               profilo["csv"])))

        self.password.delete(0, "end")
        self.password.insert(0, os.environ.get(profilo["variabile"], ""))
        self.max_invii.delete(0, "end")
        self.max_invii.insert(0, profilo["max_invii"])

        if hasattr(self, "corpo"):
            # In modalità rilancio si mostra il testo del promemoria, per il
            # tipo di impresa selezionato in anteprima.
            rilancio = self._rilancio_attivo()
            tipo = (self.tipo_scelto.get() if hasattr(self, "tipo_scelto")
                    else testi_imprese.TIPO_PREDEFINITO)
            t = account.testi_per(tipo)
            self.mittente_nome.delete(0, "end")
            self.mittente_nome.insert(0, t["mittente"])
            self.oggetto.delete(0, "end")
            self.oggetto.insert(0, t["oggetto_rilancio" if rilancio else "oggetto"])
            self.corpo.delete("1.0", "end")
            self.corpo.insert("1.0", t["corpo_rilancio" if rilancio else "corpo"])

    def _toggle_pw(self):
        self.password.configure(show="" if self.mostra_pw.get() else "•")

    def _log(self, widget, testo):
        """Scrive nel riquadro console, colorando in base al contenuto."""
        tag = ""
        secco = testo.strip()
        if secco.startswith(("[INVIATO]", "[OK]", "[+]")):
            tag = "ok"
        elif secco.startswith(("[ERRORE]", "[SCARTATA]", "[x]")):
            tag = "no"
        elif secco.startswith(("[SALTATO]", "[INCERTA]", "[?]")) or "pausa" in secco:
            tag = "attesa"
        elif secco.startswith(("Verifica", "Aggiunti", "Fatto", "Casella", "Contatti")):
            tag = "nota"
        widget.configure(state="normal")
        widget.insert("end", testo + "\n", tag)
        widget.see("end")
        widget.configure(state="disabled")

    def _avvia_ricerca(self):
        if self.in_corso:
            return
        citta = self.citta.get().strip()
        if not citta:
            messagebox.showwarning("Manca la città", "Scrivi il nome di una città.")
            return
        try:
            limite = int(self.max_cerca.get())
        except ValueError:
            limite = 60
        tipi = [t for t, v in self.tipi_ricerca.items() if v.get()]
        if not tipi:
            messagebox.showwarning("Nessuna tipologia",
                                   "Seleziona almeno una tipologia da cercare.")
            return
        self._pulisci(self.log_cerca)
        self.log_attivo = self.log_cerca
        trova_locali.VERIFICA_PROFONDA = self.verifica_profonda.get()
        trova_locali.imposta_callback(log=self._push, stop=self.stop_event.is_set,
                                      interattivo=False)
        self._inizia(f"scansione di {citta}…", self.btn_cerca, con_stop=True)
        self._thread(lambda: trova_locali.esegui(citta, limite, tipi), self._fine_ricerca)

    def _avvia_invio(self):
        if self.in_corso:
            return
        password = self.password.get().replace(" ", "").strip()
        if not password:
            messagebox.showwarning(
                "Manca la password",
                f"Inserisci la password della casella {invia_email.MITTENTE_EMAIL}.")
            return
        try:
            limite = int(self.max_invii.get())
        except ValueError:
            limite = invia_email.MAX_INVII_PER_ESECUZIONE
        profilo = account.attivo()
        rilancio = self._rilancio_attivo()
        if rilancio:
            in_coda = invia_email.conta_da_rilanciare()
            intestazione = (f"SECONDA email (rilancio) a chi era già stato contattato "
                            f"e non ha risposto.\n"
                            f"In attesa di rilancio: {in_coda} contatti.\n\n")
        else:
            in_coda = invia_email.conta_da_inviare()
            intestazione = f"Primo contatto.\nIn coda: {in_coda} contatti.\n\n"

        if not messagebox.askyesno("Conferma invio",
                intestazione +
                f"Sto per inviare fino a {limite} email reali.\n\n"
                f"Da:      {profilo['nome']} <{profilo['email']}>\n"
                f"Oggetto: {self.oggetto.get()}\n\n"
                "Vuoi procedere?"):
            return

        self._pulisci(self.log_invia)
        self.log_attivo = self.log_invia
        invia_email.imposta_callback(log=self._push, stop=self.stop_event.is_set,
                                     interattivo=False)
        self._inizia("rilancio in corso…" if rilancio else "invio in corso…",
                     self.btn_invia, con_stop=True)
        self._thread(lambda: invia_email.esegui(password, limite, rilancio=rilancio),
                     self._fine_invio)

    def _avvia_verifica(self):
        if self.in_corso:
            return
        try:
            _, righe = invia_email.carica_contatti()
        except Exception:
            righe = []
        da_controllare = sum(1 for r in righe if invia_email.da_contattare(r))
        if not da_controllare:
            messagebox.showinfo("Verifica email", "Non ci sono contatti in coda da verificare.")
            return
        if not messagebox.askyesno(
                "Verifica email",
                f"Controllo {da_controllare} indirizzi interrogando i server di posta.\n"
                f"Servono circa {max(1, round(da_controllare * 2 / 60))} minuti.\n\n"
                "Gli indirizzi inesistenti verranno segnati (non cancellati).\n"
                "Procedo?"):
            return
        self._pulisci(self.log_verifica)
        self.log_attivo = self.log_verifica
        verifica_email.imposta_log(self._push)
        self._inizia("verifica indirizzi…", self.btn_verifica, con_stop=True)
        self._thread(
            lambda: verifica_email.verifica_csv(invia_email.csv_file(), profondo=True,
                                                stop=self.stop_event.is_set),
            self._fine_verifica)

    def _ferma(self):
        self.stop_event.set()
        self._stato("interruzione richiesta…")

    # ---------------------- gestione thread / coda ----------------------

    def _thread(self, lavoro, al_termine):
        def worker():
            try:
                risultato = lavoro()
                self.coda_log.put(("fine", (al_termine, risultato)))
            except invia_email.CredenzialiRifiutate as e:
                self.coda_log.put(("errore", str(e)))
            except ValueError as e:
                self.coda_log.put(("errore", str(e)))
            except Exception as e:
                self.coda_log.put(("errore", f"Errore imprevisto: {e}"))
        threading.Thread(target=worker, daemon=True).start()

    def _push(self, testo):
        self.coda_log.put(("log", str(testo)))

    def _svuota_coda(self):
        try:
            while True:
                tipo, dato = self.coda_log.get_nowait()
                if tipo == "log":
                    if self.log_attivo is not None:
                        self._log(self.log_attivo, dato)
                elif tipo == "fine":
                    al_termine, risultato = dato
                    al_termine(risultato)
                    self._termina()
                elif tipo == "errore":
                    if self.log_attivo is not None:
                        self._log(self.log_attivo, "\n" + dato)
                    messagebox.showerror("Errore", dato)
                    self._termina()
        except queue.Empty:
            pass
        self.root.after(100, self._svuota_coda)

    def _anima(self):
        """Fa girare gli anelli: solo quando la finestra e' visibile."""
        if self.pagina_attiva == "invia":
            for anello in self.anelli:
                anello.ruota()
        self.root.after(70, self._anima)

    def _orologio(self):
        self.lbl_ora.configure(text=time.strftime("%d/%m/%Y  %H:%M:%S"))
        self.root.after(1000, self._orologio)

    def _stato(self, messaggio):
        self.barra.configure(text="› " + messaggio)

    def _inizia(self, messaggio, bottone, con_stop=False):
        self.in_corso = True
        self.stop_event.clear()
        self._bottone_attivo = bottone
        bottone.configure(state="disabled")
        if con_stop:
            for b in self._bottoni_ferma():
                b.configure(state="normal")
        self._stato(messaggio)
        self._disegna_led("lavoro")

    def _bottoni_ferma(self):
        return [b for b in (getattr(self, "btn_ferma", None),
                            getattr(self, "btn_ferma_cerca", None)) if b is not None]

    def _termina(self):
        self.in_corso = False
        self._bottone_attivo.configure(state="normal")
        for b in self._bottoni_ferma():
            b.configure(state="disabled")
        self._disegna_led("attesa")
        self._aggiorna_conteggi()

    def _fine_ricerca(self, r):
        self._stato(f"scansione conclusa · {r['nuovi']} nuovi contatti, "
                    f"{r.get('scartate', 0)} scartati")
        if self.pagina_attiva == "contatti":
            self._carica_tabella()

    def _fine_invio(self, r):
        self._stato(f"invio concluso · {r['inviati']} inviate, "
                    f"{r['saltati']} saltate, {r['errori']} errori")

    def _fine_verifica(self, r):
        self._stato(f"verifica conclusa · {r[verifica_email.ESITO_OK]} valide, "
                    f"{r[verifica_email.ESITO_INCERTO]} incerte, "
                    f"{r[verifica_email.ESITO_SCARTA]} inesistenti")
        self._carica_tabella()

    # ------------------------- tabella contatti --------------------------

    def _carica_tabella(self):
        try:
            self.campi, self.righe = invia_email.carica_contatti()
        except (ValueError, OSError) as e:
            messagebox.showerror("CSV", f"Impossibile leggere {invia_email.csv_file()}:\n{e}")
            return
        self.tabella.delete(*self.tabella.get_children())
        for i, r in enumerate(self.righe):
            stato = (r.get("Stato") or "").strip().lower()
            sito = (r.get("Sito") or "").strip()
            ha_sito = trova_locali.sito_vero(sito)
            tag = ["dispari"] if i % 2 else []
            if stato.startswith(("email inesistente", "errore")):
                tag.append("morta")
            elif stato.startswith(("inviato", "gia")):
                tag.append("fatta")
            elif not ha_sito and "Sito" in self.campi:
                tag.append("senzasito")   # in verde: il cliente migliore
            if ha_sito:
                segno = "sì"
            elif sito:
                segno = "social"          # ha solo una pagina Facebook & co.
            else:
                segno = "—"
            etichetta_tipo = testi_imprese.etichetta_tipo((r.get("Tipo") or "").strip())
            self.tabella.insert("", "end", iid=str(i), tags=tuple(tag),
                                values=(r.get("Nome", ""), segno, etichetta_tipo,
                                        r.get("Email", ""), r.get("Stato", "")))
        self._aggiorna_conteggi()

    def _email_selezionate(self):
        return [(self.righe[int(i)].get("Email") or "").strip()
                for i in self.tabella.selection()]

    def _applica_a_selezionati(self, emails, nuovo_stato=None, elimina=False):
        """Modifica il CSV rileggendolo da zero e agendo per indirizzo email.

        Non si salva mai la lista tenuta in memoria: nel frattempo il file puo'
        essere cambiato (una ricerca che aggiunge contatti, un altro programma)
        e riscriverlo per intero cancellerebbe quelle righe."""
        bersagli = {e.lower() for e in emails if e}
        if not bersagli:
            return
        campi, righe = invia_email.carica_contatti()
        if elimina:
            righe = [r for r in righe
                     if (r.get("Email") or "").strip().lower() not in bersagli]
        else:
            for r in righe:
                if (r.get("Email") or "").strip().lower() in bersagli:
                    r["Stato"] = nuovo_stato
        if not invia_email.salva_contatti(campi, righe):
            messagebox.showwarning("File bloccato",
                                   f"{invia_email.csv_file()} è aperto in Excel: chiudilo e riprova.")
        self._carica_tabella()

    def _cambia_stato(self, nuovo):
        emails = self._email_selezionate()
        if emails:
            self._applica_a_selezionati(emails, nuovo_stato=nuovo)

    def _riattiva(self):
        """Rimette in coda i contatti selezionati.

        Se qualcuno aveva gia' ricevuto l'email, la memoria anti-doppioni lo
        bloccherebbe di nuovo: qui la sblocchiamo, ma solo per gli indirizzi
        che l'utente ha scelto a mano e dopo averlo avvertito."""
        sel = self.tabella.selection()
        if not sel:
            return

        emails = self._email_selezionate()
        contattati = memoria.carica_contattati()
        gia_scritti = [e for e in emails if e.lower() in contattati]

        if gia_scritti:
            elenco = "\n".join(f"  · {e}" for e in gia_scritti[:8])
            if len(gia_scritti) > 8:
                elenco += f"\n  · … e altri {len(gia_scritti) - 8}"
            if not messagebox.askyesno(
                    "Riattivare contatti già scritti?",
                    f"{len(gia_scritti)} dei contatti selezionati hanno GIÀ ricevuto "
                    f"l'email:\n\n{elenco}\n\n"
                    "Riattivandoli riceveranno un secondo messaggio.\n"
                    "Vuoi procedere?"):
                return
            memoria.dimentica_contattati(gia_scritti)
            memoria.dimentica_rilanci(gia_scritti)   # potranno ricevere di nuovo

        self._applica_a_selezionati(emails, nuovo_stato="")
        self._stato(f"riattivati {len(sel)} contatti"
                    + (f" · {len(gia_scritti)} sbloccati dalla memoria" if gia_scritti else ""))

    def _elimina_righe(self):
        emails = self._email_selezionate()
        if not emails:
            return
        if not messagebox.askyesno("Elimina",
                                   f"Eliminare {len(emails)} contatti dalla lista?"):
            return
        self._applica_a_selezionati(emails, elimina=True)

    # ------------------------------ varie --------------------------------

    def _aggiorna_conteggi(self):
        try:
            _, righe = invia_email.carica_contatti()
        except Exception:
            righe = []
        totale = len(righe)
        inviati = sum(1 for r in righe
                      if (r.get("Stato") or "").strip().lower().startswith(
                          ("inviato", "rilancio")))
        rilanciati = sum(1 for r in righe
                         if (r.get("Stato") or "").strip().lower().startswith("rilancio"))
        modo_rilancio = self._rilancio_attivo()
        if modo_rilancio:
            gia = memoria.carica_rilanci()
            coda = sum(1 for r in righe if invia_email.da_rilanciare(r, gia))
            secondo_numero = rilanciati
        else:
            coda = sum(1 for r in righe if invia_email.da_contattare(r))
            secondo_numero = inviati

        if hasattr(self, "anello_coda"):
            # Gli anelli cambiano significato secondo la modalità scelta.
            self.anello_coda.etichetta = "da rilanciare" if modo_rilancio else "in coda"
            self.anello_inviati.etichetta = "rilanciati" if modo_rilancio else "inviati"
            self.anello_coda.imposta(coda, totale or 1)
            self.anello_inviati.imposta(secondo_numero, totale or 1)
            self.anello_totale.etichetta = "totale"
            self.anello_totale.imposta(totale, totale or 1)
        if hasattr(self, "lbl_conta"):
            self.lbl_conta.configure(
                text=f"TOTALE {totale}   ·   CODA {coda}   ·   INVIATI {inviati}")

    def _pulisci(self, widget):
        widget.configure(state="normal")
        widget.delete("1.0", "end")
        widget.configure(state="disabled")

    def _chiudi(self):
        if self.in_corso:
            if not messagebox.askyesno("Operazione in corso",
                                       "Un'operazione è ancora attiva. Uscire comunque?"):
                return
            self.stop_event.set()
        self.root.destroy()


def main():
    root = tk.Tk()
    App(root)
    root.mainloop()


if __name__ == "__main__":
    main()
