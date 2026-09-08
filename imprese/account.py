# -*- coding: utf-8 -*-
"""
account.py — La campagna del bot "imprese": una sola casella di posta, usata
per contattare imprese edili, elettricisti, idraulici e agenzie immobiliari.

A differenza del bot "ristoranti" (che sceglie il TESTO in base alla LINGUA
del paese), qui il testo cambia in base al TIPO di impresa — vedi
testi_imprese.py. E' un bot indipendente: file, memorie e casella di posta
sono TUTTI separati da quelli del bot ristoranti, apposta.

*** DA FARE PRIMA DEL PRIMO USO ***
L'indirizzo email qui sotto e' un segnaposto. Sostituiscilo con una casella
Gmail TUA, diversa da quelle gia' usate per il bot ristoranti (istruzioni
complete in setup.txt, nella cartella principale). Non e' mai stata
usata per nessun invio: crearla e configurarla e' il primo passo del setup.

Uso:
    import account
    account.attivo()["email"]
"""

import memoria
import testi_imprese

# =============================== LA CAMPAGNA ================================

ACCOUNT = {
    "imprese": {
        "etichetta": "Imprese — tuaemailimprese@gmail.com",
        "servizio": "IMPRESE",
        "server": "smtp.gmail.com",
        "porta": 465,                       # 465 = SSL, 587 = STARTTLS

        # <<< SOSTITUISCI QUESTO INDIRIZZO — vedi setup.txt, passo 3 >>>
        "email": "tuaemailimprese@gmail.com",

        "variabile": "GMAIL_APP_PASSWORD_IMPRESE",
        "aiuto": "Password per le app di Google della TUA casella imprese, "
                 "16 caratteri (NON la password normale dell'account)",
        "csv": "imprese.csv",
        "visti": "memoria_visti.txt",
        "contattati": "memoria_contattati.txt",
        "rilanci": "memoria_rilanci.txt",
        # Gmail gratuito tollera ~500 destinatari al giorno, ma un account
        # giovane che manda posta commerciale viene guardato con sospetto.
        "max_invii": 70,
    },
}

# Il nome mittente e i testi predefiniti (mostrati nell'interfaccia prima di
# scegliere un tipo specifico) sono quelli della categoria "edile".
for _chiave, _dati in ACCOUNT.items():
    _base = testi_imprese.testi_per_tipo(testi_imprese.TIPO_PREDEFINITO)
    _dati["nome"] = _base["mittente"]
    _dati["oggetto"] = _base["oggetto"]
    _dati["corpo"] = _base["corpo"]
    _dati["oggetto_rilancio"] = _base["oggetto_rilancio"]
    _dati["corpo_rilancio"] = _base["corpo_rilancio"]


def testi_per(tipo, chiave=None):
    """Testi e nome mittente per il tipo di impresa del destinatario."""
    return testi_imprese.testi_per_tipo(tipo)


PREDEFINITO = "imprese"

_attivo = PREDEFINITO


def elenco():
    """Chiavi delle campagne disponibili, in ordine stabile."""
    return list(ACCOUNT.keys())


def etichette():
    """Descrizioni leggibili, per i menu dell'interfaccia."""
    return [ACCOUNT[chiave]["etichetta"] for chiave in elenco()]


def chiave_da_etichetta(etichetta):
    """Dall'etichetta mostrata nel menu risale alla chiave della campagna."""
    for chiave, dati in ACCOUNT.items():
        if dati["etichetta"] == etichetta:
            return chiave
    return PREDEFINITO


def attivo():
    """La campagna attualmente in uso."""
    return ACCOUNT[_attivo]


def chiave_attiva():
    return _attivo


def usa(chiave):
    """Cambia campagna (per ora ce n'e' una sola, ma la struttura e' pronta
    per aggiungerne altre — es. un giorno "risposte alle recensioni" anche
    per le imprese). Restituisce la campagna scelta."""
    global _attivo
    if chiave not in ACCOUNT:
        raise ValueError(f"Campagna sconosciuta: {chiave!r}. "
                         f"Disponibili: {', '.join(elenco())}")
    _attivo = chiave
    dati = attivo()
    memoria.imposta_file(dati["visti"], dati["contattati"], dati["rilanci"])
    return dati


# All'avvio le memorie devono gia' puntare alla campagna predefinita.
usa(PREDEFINITO)
