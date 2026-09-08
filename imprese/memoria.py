# -*- coding: utf-8 -*-
"""
memoria.py — Le memorie permanenti, con significati DIVERSI:

  visti       locali gia' AGGIUNTI alla lista dalle ricerche: non verranno
              mai riproposti. Essere qui NON significa aver ricevuto un'email.
  contattati  locali a cui la PRIMA email e' gia' partita davvero.
  rilanci     locali a cui e' partita anche la SECONDA email (il promemoria):
              non riceveranno un terzo messaggio.

Ogni CAMPAGNA ha i suoi tre file (vedi account.py): i contatti del servizio
"siti web" e quelli del servizio "risposte alle recensioni" sono separati,
quindi lo stesso locale puo' ricevere una proposta per ciascun servizio.
imposta_file() viene chiamata da account.usa() a ogni cambio di campagna.

NON cancellare questi file: sono la garanzia anti-doppioni.
"""

import os

# File della campagna attiva: li cambia account.usa() (vedi imposta_file()).
VISTI_FILE = "memoria_visti.txt"
CONTATTATI_FILE = "memoria_contattati.txt"
RILANCI_FILE = "memoria_rilanci.txt"        # chi ha gia' ricevuto la 2a email


def imposta_file(visti=None, contattati=None, rilanci=None):
    """Punta le memorie ai file della campagna scelta."""
    global VISTI_FILE, CONTATTATI_FILE, RILANCI_FILE
    if visti:
        VISTI_FILE = visti
    if contattati:
        CONTATTATI_FILE = contattati
    if rilanci:
        RILANCI_FILE = rilanci


def _carica(percorso):
    """Insieme delle email nel file (una per riga, minuscole)."""
    if not os.path.exists(percorso):
        return set()
    with open(percorso, encoding="utf-8") as f:
        return {riga.strip().lower() for riga in f if riga.strip()}


def _aggiungi(percorso, emails):
    """Aggiunge le email al file, senza duplicati (scrittura in append)."""
    gia_presenti = _carica(percorso)
    nuove = []
    for email in emails:
        email = (email or "").strip().lower()
        if email and email not in gia_presenti and email not in nuove:
            nuove.append(email)
    if nuove:
        with open(percorso, "a", encoding="utf-8") as f:
            for email in nuove:
                f.write(email + "\n")


def carica_visti():
    """Email da non riproporre nelle ricerche: gia' in lista O gia' contattate."""
    return _carica(VISTI_FILE) | _carica(CONTATTATI_FILE)


def ricorda_visti(emails):
    _aggiungi(VISTI_FILE, emails)


def carica_contattati():
    """Email a cui e' gia' stata inviata la proposta: mai piu' ricontattare."""
    return _carica(CONTATTATI_FILE)


def ricorda_contattati(emails):
    _aggiungi(CONTATTATI_FILE, emails)


def _rimuovi(percorso, emails):
    """Toglie le email dal file. Restituisce quante ne ha tolte."""
    if not os.path.exists(percorso):
        return 0
    da_togliere = {(e or "").strip().lower() for e in emails if (e or "").strip()}
    if not da_togliere:
        return 0
    with open(percorso, encoding="utf-8") as f:
        righe = f.readlines()
    tenute = [r for r in righe if r.strip().lower() not in da_togliere]
    tolte = len(righe) - len(tenute)
    if tolte:
        with open(percorso, "w", encoding="utf-8") as f:
            f.writelines(tenute)
    return tolte


def carica_rilanci():
    """Email a cui e' gia' partita la SECONDA email (il rilancio).

    Chi e' qui dentro non ricevera' un terzo messaggio: un promemoria e'
    lecito, insistere ancora diventa molestia."""
    return _carica(RILANCI_FILE)


def ricorda_rilanci(emails):
    _aggiungi(RILANCI_FILE, emails)


def dimentica_rilanci(emails):
    """Annulla il "gia' rilanciato" per questi indirizzi (scelta manuale)."""
    return _rimuovi(RILANCI_FILE, emails)


def dimentica_contattati(emails):
    """Cancella il "gia' contattato" per questi indirizzi: potranno ricevere
    di nuovo l'email.

    Serve SOLO quando l'utente riattiva un contatto di proposito: la memoria
    esiste apposta per impedire i doppi invii accidentali, quindi nessuna
    parte del programma deve chiamare questa funzione da sola."""
    return _rimuovi(CONTATTATI_FILE, emails)
