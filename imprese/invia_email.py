# -*- coding: utf-8 -*-
"""
invia_email.py — Invio proposte via email alle imprese lette da imprese.csv.

Caratteristiche:
  - Solo moduli nativi di Python (smtplib, email, csv, time, random, os, ssl).
  - Anti-duplicato: invia solo alle righe con Stato vuoto o "Da Inviare",
    poi scrive "Inviato <data/ora>" nel CSV subito dopo ogni invio riuscito.
  - Pausa casuale (30-90 s) tra un invio e l'altro per non insospettire Gmail.
  - Nessuna password nel codice: legge la password della casella dalla
    variabile d'ambiente GMAIL_APP_PASSWORD_IMPRESE oppure la chiede al volo.
  - Il testo dell'email cambia in base al TIPO di impresa (colonna "Tipo"
    del CSV): edile, elettricista, idraulico o immobiliare — vedi testi_imprese.py.

Uso da terminale:
    python invia_email.py
    python invia_email.py rilancio      seconda email a chi non ha risposto

Puo' anche essere pilotato dall'interfaccia grafica (interfaccia.py):
    imposta_callback(log=..., stop=..., interattivo=False)
    esegui(password)
"""

import csv
import getpass
import os
import random
import smtplib
import ssl
import sys
import time
from datetime import datetime
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.utils import formataddr

import account
import testi_imprese
import verifica_email
from memoria import (carica_contattati, carica_rilanci, ricorda_contattati,
                     ricorda_rilanci)

# ----------------------------- CONFIGURAZIONE -----------------------------

# Da quale casella si invia: il profilo sta in account.py.
SMTP_SERVER = ""                    # riempiti da usa_account() qui sotto
SMTP_PORT = 465
MITTENTE_EMAIL = ""
MITTENTE_NOME = ""
VARIABILE_PASSWORD = ""             # nome della variabile d'ambiente


def usa_account(chiave=None):
    """Seleziona la casella da usare: server, mittente E testo predefinito.

    Il testo effettivo di ogni invio dipende dal Tipo della riga (vedi
    invia_email() e tipo_riga()): questi valori sono solo i predefiniti
    mostrati nell'interfaccia prima di caricare i contatti."""
    global SMTP_SERVER, SMTP_PORT, MITTENTE_EMAIL, MITTENTE_NOME
    global VARIABILE_PASSWORD, MAX_INVII_PER_ESECUZIONE, OGGETTO, CORPO, CSV_FILE
    global OGGETTO_RILANCIO, CORPO_RILANCIO
    profilo = account.usa(chiave) if chiave else account.attivo()
    OGGETTO_RILANCIO = profilo["oggetto_rilancio"]
    CORPO_RILANCIO = profilo["corpo_rilancio"]
    SMTP_SERVER = profilo["server"]
    SMTP_PORT = profilo["porta"]
    MITTENTE_EMAIL = profilo["email"]
    MITTENTE_NOME = profilo["nome"]
    VARIABILE_PASSWORD = profilo["variabile"]
    MAX_INVII_PER_ESECUZIONE = profilo["max_invii"]
    OGGETTO = profilo["oggetto"]
    CORPO = profilo["corpo"]
    CSV_FILE = profilo["csv"]
    return profilo


def csv_file():
    """Lista di contatti della campagna attiva (imprese.csv)."""
    return account.attivo()["csv"]


# Compatibilita': alcune parti leggono ancora CSV_FILE come nome fisso.
CSV_FILE = account.attivo()["csv"]

PAUSA_MIN = 30                      # pausa minima tra due invii (secondi)
PAUSA_MAX = 90                      # pausa massima tra due invii (secondi)
VERIFICA_PRIMA_INVIO = True         # ricontrolla ogni indirizzo un attimo prima
                                    # di scrivergli: una lista raccolta settimane
                                    # fa puo' contenere caselle nel frattempo
                                    # chiuse, e ogni rimbalzo danneggia la
                                    # reputazione del dominio mittente.

MAX_INVII_PER_ESECUZIONE = 40       # valore di partenza: viene poi impostato
                                    # da usa_account() secondo il profilo, perche'
                                    # ogni provider ha un tetto giornaliero diverso
                                    # e superarlo blocca la casella.

# Oggetto e corpo NON stanno qui: sono i testi PREDEFINITI (tipo "edile"),
# caricati da account.py. Il testo davvero usato per ogni invio dipende dal
# Tipo di ciascuna riga (vedi invia_email() e tipo_riga() piu' sotto).
OGGETTO = ""
CORPO = ""
OGGETTO_RILANCIO = ""
CORPO_RILANCIO = ""

usa_account()                       # applica il profilo predefinito (account.py)

# ------------------------- CALLBACK (log / stop) --------------------------
# Di default lo script scrive su schermo (print) e non si ferma mai.
# L'interfaccia grafica puo' sostituire queste callback per ricevere i
# messaggi in una finestra e per poter interrompere l'invio a meta'.

_log = print
_stop = lambda: False
INTERATTIVO = True                  # False = pilotato dalla GUI (niente input())


def imposta_callback(log=None, stop=None, interattivo=None):
    """Permette alla GUI di dirottare log/stop e disattivare gli input()."""
    global _log, _stop, INTERATTIVO
    if log is not None:
        _log = log
        verifica_email.imposta_log(log)   # anche i messaggi della verifica
    if stop is not None:
        _stop = stop
    if interattivo is not None:
        INTERATTIVO = interattivo


class CredenzialiRifiutate(Exception):
    """Il server di posta ha rifiutato indirizzo o password."""


# ------------------------------- FUNZIONI ---------------------------------


def leggi_password():
    """Recupera la password della casella attiva senza mai salvarla nel codice.

    Ordine: 1) variabile d'ambiente del profilo (GMAIL_APP_PASSWORD_IMPRESE)
            2) richiesta interattiva nascosta (getpass)
    Gli spazi vengono tolti: Google mostra la password per le app a gruppi
    di quattro, ma quegli spazi sono solo estetici.
    """
    password = os.environ.get(VARIABILE_PASSWORD)
    if not password:
        print(f"Variabile {VARIABILE_PASSWORD} non trovata.")
        print(f"Serve: {account.attivo()['aiuto']}")
        password = getpass.getpass(
            f"Password di {MITTENTE_EMAIL} (non viene mostrata): ")
    return password.replace(" ", "").strip()


def _dormi(secondi):
    """Dorme un secondo alla volta, interrompibile con la callback di stop."""
    for _ in range(int(secondi)):
        if _stop():
            return
        time.sleep(1)


def carica_contatti():
    """Legge tutto il CSV in memoria e restituisce (intestazioni, righe).

    Se il file non esiste ancora, restituisce una lista vuota con le
    intestazioni standard (utile al primo avvio dell'interfaccia)."""
    if not os.path.exists(csv_file()):
        return ["Nome", "Email", "Stato"], []

    with open(csv_file(), newline="", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        campi = list(reader.fieldnames or [])
        righe = list(reader)

    for obbligatorio in ("Nome", "Email"):
        if obbligatorio not in campi:
            raise ValueError(f"Nel CSV manca la colonna '{obbligatorio}'.")

    # Se manca la colonna Stato la aggiungiamo, cosi' il tracking funziona comunque.
    if "Stato" not in campi:
        campi.append("Stato")
    for riga in righe:
        riga.setdefault("Stato", "")

    return campi, righe


def salva_contatti(campi, righe, fondi=False):
    """Riscrive il CSV in modo atomico (file temporaneo + sostituzione):
    se lo script si interrompe a meta' scrittura, il CSV originale resta intatto.
    Restituisce True se salvato, False se rinuncia (file bloccato da Excel).

    fondi=True rilegge prima il file e aggiorna SOLO le righe che conosciamo
    (confrontandole per email), lasciando intatte quelle comparse nel frattempo.
    Serve durante gli invii lunghi: la lista in memoria e' stata caricata
    all'inizio, e riscriverla per intero cancellerebbe i contatti aggiunti da
    una ricerca o da un'altra finestra mentre l'invio era in corso.

    Se il CSV e' bloccato (tipicamente: aperto in Excel):
      - da terminale (INTERATTIVO) chiede di chiuderlo e riprova;
      - dalla GUI riprova per qualche secondo e poi rinuncia (i doppi invii
        restano impossibili grazie alla memoria permanente)."""
    while True:
        try:
            da_scrivere, colonne = righe, campi
            if fondi and os.path.exists(csv_file()):
                colonne_disco, righe_disco = carica_contatti()
                nostre = {(r.get("Email") or "").strip().lower(): r for r in righe
                          if (r.get("Email") or "").strip()}
                # Si parte da cio' che c'e' sul disco: le righe che non
                # conosciamo restano dove sono, quelle nostre vengono aggiornate.
                da_scrivere = [nostre.get((r.get("Email") or "").strip().lower(), r)
                               for r in righe_disco]
                if len(colonne_disco) >= len(colonne):
                    colonne = colonne_disco

            temporaneo = csv_file() + ".tmp"
            with open(temporaneo, "w", newline="", encoding="utf-8-sig") as f:
                writer = csv.DictWriter(f, fieldnames=colonne, extrasaction="ignore")
                writer.writeheader()
                writer.writerows(da_scrivere)
            os.replace(temporaneo, csv_file())
            return True
        except PermissionError:
            _log(f"ATTENZIONE: '{csv_file()}' e' bloccato — probabilmente aperto in Excel.")
            if INTERATTIVO:
                try:
                    input("Chiudi il file e premi Invio per riprovare... ")
                except EOFError:
                    return False
            else:
                _dormi(3)
                return False


def da_contattare(riga):
    """True se la riga va processata: Stato vuoto oppure 'Da Inviare'."""
    stato = (riga.get("Stato") or "").strip().lower()
    return stato in ("", "da inviare")


def da_rilanciare(riga, gia_rilanciati=None):
    """True se alla riga va mandata la SECONDA email (il promemoria).

    Condizioni: ha gia' ricevuto la prima email e non ha ancora ricevuto il
    rilancio. Chi e' stato sospeso, chi ha dato errore e chi ha risposto
    "No grazie" (cioe' qualunque altro Stato) resta fuori."""
    stato = (riga.get("Stato") or "").strip().lower()
    if not stato.startswith("inviato"):
        return False
    if gia_rilanciati is None:
        gia_rilanciati = carica_rilanci()
    return (riga.get("Email") or "").strip().lower() not in gia_rilanciati


def tipo_riga(riga):
    """Tipo di impresa (e quindi testo) di questo contatto, dalla colonna "Tipo".

    Le righe senza colonna Tipo (aggiunte a mano, o vecchie) ricevono il
    tipo predefinito ("edile")."""
    return testi_imprese.tipo_valido((riga.get("Tipo") or "").strip())


def conta_da_inviare():
    """Quanti contatti sono in coda (per l'interfaccia)."""
    _, righe = carica_contatti()
    return sum(1 for r in righe if da_contattare(r))


def conta_da_rilanciare():
    """Quanti contatti aspettano la seconda email (per l'interfaccia)."""
    _, righe = carica_contatti()
    gia = carica_rilanci()
    return sum(1 for r in righe if da_rilanciare(r, gia))


def invia_email(password, nome, destinatario, rilancio=False, tipo=None):
    """Costruisce e invia una singola email in testo semplice.

    Con rilancio=True usa il testo del promemoria invece di quello del primo
    contatto. Il testo semplice (niente HTML) e' volutamente scelto: per un
    primo contatto ha una deliverability migliore e sembra scritto a mano.
    Apriamo una connessione nuova per ogni invio: con pause di 30-90 s
    una connessione tenuta aperta verrebbe comunque chiusa dal server.
    """
    if tipo:
        # Ogni destinatario riceve l'email adatta al suo tipo di attivita',
        # firmata col nome mittente corrispondente.
        t = account.testi_per(tipo)
        oggetto = t["oggetto_rilancio"] if rilancio else t["oggetto"]
        corpo = t["corpo_rilancio"] if rilancio else t["corpo"]
        mittente = t["mittente"]
    else:
        oggetto = OGGETTO_RILANCIO if rilancio else OGGETTO
        corpo = CORPO_RILANCIO if rilancio else CORPO
        mittente = MITTENTE_NOME

    messaggio = MIMEMultipart("alternative")
    messaggio["Subject"] = oggetto.format(nome=nome)
    messaggio["From"] = formataddr((mittente, MITTENTE_EMAIL))
    messaggio["To"] = destinatario
    messaggio["Reply-To"] = MITTENTE_EMAIL
    messaggio.attach(MIMEText(corpo.format(nome=nome), "plain", "utf-8"))

    contesto = ssl.create_default_context()
    if SMTP_PORT == 465:
        # Connessione SSL diretta (Gmail)
        with smtplib.SMTP_SSL(SMTP_SERVER, SMTP_PORT, context=contesto, timeout=30) as server:
            server.login(MITTENTE_EMAIL, password)
            server.send_message(messaggio)
    else:
        # Porta 587: connessione in chiaro promossa a TLS (Outlook)
        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT, timeout=30) as server:
            server.starttls(context=contesto)
            server.login(MITTENTE_EMAIL, password)
            server.send_message(messaggio)


# --------------------------------- CORE ------------------------------------


def esegui(password, max_invii=None, rilancio=False):
    """Invia le email ai contatti in coda. Restituisce un riepilogo.

    rilancio=False -> primo contatto: righe con Stato vuoto o "Da Inviare".
    rilancio=True  -> seconda email: righe gia' inviate che non hanno ancora
                      ricevuto il promemoria (memoria_rilanci.txt).

    Solleva CredenzialiRifiutate se il server rifiuta l'accesso."""
    if not password:
        raise CredenzialiRifiutate("Password per le app mancante.")
    if max_invii is None:
        max_invii = MAX_INVII_PER_ESECUZIONE

    campi, righe = carica_contatti()

    # Due memorie diverse a seconda del giro:
    #  - primo contatto: chi e' gia' stato contattato non riceve nulla;
    #  - rilancio:       chi ha gia' avuto il promemoria non ne riceve un altro.
    if rilancio:
        memoria = carica_rilanci()
        selezione = lambda r: da_rilanciare(r, memoria)
        etichetta_stato = "Rilancio "
        registra = ricorda_rilanci
    else:
        memoria = carica_contattati()
        gia_inviate = [(r.get("Email") or "").strip() for r in righe
                       if (r.get("Stato") or "").strip().lower().startswith("inviato")]
        ricorda_contattati(gia_inviate)
        memoria.update(e.lower() for e in gia_inviate if e)
        selezione = da_contattare
        etichetta_stato = "Inviato "
        registra = ricorda_contattati

    coda = [r for r in righe if selezione(r)]
    tipo_esecuzione = "RILANCIO (2ª email)" if rilancio else "primo contatto"
    _log(f"Modalità: {tipo_esecuzione}")
    _log(f"Contatti totali: {len(righe)} — da inviare: {len(coda)} "
         f"(massimo {max_invii} in questa esecuzione)\n")

    if not coda:
        _log("Niente da fare: nessun contatto corrisponde a questa modalità.")
        return {"inviati": 0, "errori": 0, "saltati": 0, "coda": 0}

    inviati = errori = saltati = 0
    for riga in righe:
        if _stop():
            _log("\nInterrotto dall'utente.")
            break
        if not selezione(riga):
            continue
        if inviati >= max_invii:
            _log("\nRaggiunto il limite per questa esecuzione. "
                 "Rilancia piu' tardi per proseguire.")
            break

        nome = (riga.get("Nome") or "").strip()
        email = (riga.get("Email") or "").strip()
        tipo = tipo_riga(riga)

        # Controllo minimo sull'indirizzo: evita un errore SMTP inutile.
        if "@" not in email or "." not in email.split("@")[-1]:
            riga["Stato"] = "Errore: email non valida"
            salva_contatti(campi, righe, fondi=True)
            saltati += 1
            _log(f"[SALTATO]  {nome}: indirizzo non valido ({email!r})")
            continue

        # Anti-doppione permanente: gia' contattato in passato? Mai piu'.
        # Nel rilancio il filtro e' gia' fatto da da_rilanciare(), e riscrivere
        # lo Stato qui cancellerebbe la data del primo invio.
        if not rilancio and email.lower() in memoria:
            riga["Stato"] = "Gia' contattato"
            salva_contatti(campi, righe, fondi=True)
            saltati += 1
            _log(f"[SALTATO]  {nome}: gia' contattato in passato")
            continue

        # Ultimo controllo prima di scrivere: la casella esiste ancora?
        if VERIFICA_PRIMA_INVIO:
            esito, motivo = verifica_email.verifica(email, profondo=True)
            if esito == verifica_email.ESITO_SCARTA:
                riga["Stato"] = f"Email inesistente: {motivo}"
                salva_contatti(campi, righe, fondi=True)
                saltati += 1
                _log(f"[SALTATO]  {nome} <{email}>: {motivo}")
                continue

        try:
            invia_email(password, nome, email, rilancio=rilancio, tipo=tipo)
        except smtplib.SMTPAuthenticationError:
            raise CredenzialiRifiutate(
                f"Il server {SMTP_SERVER} ha rifiutato le credenziali.\n"
                f"Indirizzo: {MITTENTE_EMAIL}\n"
                f"Serve: {account.attivo()['aiuto']}")
        except Exception as errore:
            riga["Stato"] = f"Errore: {errore}"
            salva_contatti(campi, righe, fondi=True)
            errori += 1
            _log(f"[ERRORE]   {nome} <{email}>: {errore}")
            continue

        riga["Stato"] = etichetta_stato + datetime.now().strftime("%d/%m/%Y %H:%M")
        inviati += 1
        # Prima la memoria permanente, poi il CSV: anche se il salvataggio
        # del CSV fallisse, questo contatto non verrebbe ricontattato due volte.
        registra([email])
        memoria.add(email.lower())
        salva_contatti(campi, righe, fondi=True)
        marchio = "[RILANCIO]" if rilancio else "[INVIATO] "
        etichetta_tipo = testi_imprese.etichetta_tipo(tipo)
        _log(f"{marchio} {nome} <{email}>  [{etichetta_tipo}]  "
             f"({inviati}/{min(len(coda), max_invii)})")

        # Pausa casuale solo se c'e' ancora qualcosa da inviare dopo questa riga.
        restanti = [r for r in righe if selezione(r)]
        if restanti and inviati < max_invii and not _stop():
            pausa = random.randint(PAUSA_MIN, PAUSA_MAX)
            _log(f"           pausa di {pausa} secondi...")
            _dormi(pausa)

    _log(f"\nFatto. Email inviate in questa esecuzione: {inviati}.")
    return {"inviati": inviati, "errori": errori, "saltati": saltati,
            "coda": len(coda)}


# --------------------------------- MAIN ------------------------------------


def main():
    # python invia_email.py            -> primo contatto
    # python invia_email.py rilancio   -> seconda email a chi non ha risposto
    rilancio = "rilancio" in [a.lower() for a in sys.argv[1:]]

    if "tuaemailimprese@gmail.com" in MITTENTE_EMAIL:
        sys.exit("ERRORE: configura prima la tua casella in account.py "
                 "(vedi setup.txt, passo 3).")

    print(f"Casella in uso: {account.attivo()['etichetta']}")
    print(f"Oggetto (edile, predefinito): {OGGETTO_RILANCIO if rilancio else OGGETTO}\n")
    try:
        esegui(leggi_password(), rilancio=rilancio)
    except CredenzialiRifiutate as errore:
        sys.exit(f"\nERRORE: {errore}")


if __name__ == "__main__":
    main()
