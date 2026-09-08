# -*- coding: utf-8 -*-
"""
testi_imprese.py — I testi delle email, uno per tipo di impresa.

A differenza del bot "ristoranti" (che sceglie la LINGUA in base al paese),
qui si sceglie il TESTO in base al TIPO di attivita': un'impresa edile, un
elettricista, un idraulico e un'agenzia immobiliare hanno bisogni ed
esigenze diverse, quindi meritano un messaggio diverso anche se l'offerta
di fondo (sito realizzato prima, pagato solo se piace) resta la stessa.

Il tipo di ogni contatto viene deciso dalla ricerca (trova_locali.py, in
base alla categoria OpenStreetMap) e scritto nella colonna "Tipo" del CSV.

Solo italiano: il bot "imprese" lavora sul mercato locale, non ha bisogno
delle 6 lingue del bot ristoranti (che cerca in tutto il mondo).

In ogni testo, {nome} viene sostituito col nome dell'impresa.
"""

TIPO_PREDEFINITO = "edile"      # per le righe senza colonna Tipo (vecchie o importate a mano)

TIPI_ETICHETTE = {
    "edile": "Impresa edile",
    "elettricista": "Elettricista",
    "idraulico": "Idraulico",
    "immobiliare": "Agenzia immobiliare",
}

TESTI = {

"edile": {
"mittente": "Andrea — Siti web per imprese edili",
"oggetto": "Il nuovo sito di {nome}: prima lo vede, poi decide",
"corpo": """Buongiorno,

mi occupo di siti web per imprese edili, e lavoro in un modo un po' diverso dal solito: il sito lo realizzo PRIMA, e voi decidete solo dopo averlo visto.

Oggi chi deve ristrutturare casa o costruire cerca l'impresa su Google prima di chiedere un preventivo: se non trova un sito con i lavori fatti, i contatti e le referenze, spesso si rivolge a un concorrente che ce l'ha. Una pagina Facebook da sola non basta a dare questa fiducia.

Per questo preparo gratuitamente il nuovo sito di {nome}, con una galleria dei lavori realizzati, e ve lo mostro finito: se vi piace, lo acquistate; se non vi piace, non pagate nulla e non avete perso nulla. Nessun anticipo, nessun impegno.

Vi va di vederlo? Basta rispondere a questa email.

Cordiali saluti,
Andrea

P.S. Se preferite non ricevere altre email, rispondete "No grazie": non vi contatterò più.
""",
"oggetto_rilancio": "Le avevo scritto per il sito di {nome}",
"corpo_rilancio": """Buongiorno,

qualche giorno fa vi avevo scritto a proposito del sito web di {nome}. Non voglio insistere: vi riassumo la proposta in due righe, poi decidete voi.

Realizzo il sito PRIMA, con una galleria dei vostri lavori, e ve lo mostro finito: se vi piace lo acquistate, se non vi piace non pagate nulla e non avete perso niente. Nessun anticipo, nessun impegno.

Se volete vederlo, mi basta un "sì" in risposta a questa email.

Cordiali saluti,
Andrea

P.S. Se preferite non ricevere altre email, rispondete "No grazie": non vi contatterò più.
""",
},

"elettricista": {
"mittente": "Andrea — Siti web per elettricisti",
"oggetto": "Il nuovo sito di {nome}: prima lo vede, poi decide",
"corpo": """Buongiorno,

mi occupo di siti web per elettricisti, e lavoro in un modo un po' diverso dal solito: il sito lo realizzo PRIMA, e lei decide solo dopo averlo visto.

Oggi chi ha un guasto o deve rifare l'impianto cerca "elettricista" su Google prima di chiamare: se non trova un sito chiaro, con la zona coperta, i contatti in evidenza e magari il pronto intervento, spesso sceglie chi ce l'ha. Una pagina social da sola non basta a farsi trovare bene.

Per questo preparo gratuitamente il nuovo sito di {nome} e glielo mostro finito: se le piace, lo acquista; se non le piace, non paga nulla e non ha perso nulla. Nessun anticipo, nessun impegno.

Le va di vederlo? Le basta rispondere a questa email.

Cordiali saluti,
Andrea

P.S. Se preferisce non ricevere altre email, mi risponda "No grazie": non la contatterò più.
""",
"oggetto_rilancio": "Le avevo scritto per il sito di {nome}",
"corpo_rilancio": """Buongiorno,

qualche giorno fa le avevo scritto a proposito del sito web di {nome}. Non voglio insistere: le riassumo la proposta in due righe, poi decide lei.

Realizzo il sito PRIMA e glielo mostro finito: se le piace lo acquista, se non le piace non paga nulla e non ha perso niente. Nessun anticipo, nessun impegno.

Se vuole vederlo, mi basta un "sì" in risposta a questa email.

Cordiali saluti,
Andrea

P.S. Se preferisce non ricevere altre email, mi risponda "No grazie": non la contatterò più.
""",
},

"idraulico": {
"mittente": "Andrea — Siti web per idraulici",
"oggetto": "Il nuovo sito di {nome}: prima lo vede, poi decide",
"corpo": """Buongiorno,

mi occupo di siti web per idraulici, e lavoro in un modo un po' diverso dal solito: il sito lo realizzo PRIMA, e lei decide solo dopo averlo visto.

Oggi chi ha una perdita o deve cambiare la caldaia cerca "idraulico" su Google prima di chiamare, spesso con urgenza: se non trova un sito chiaro, con la zona coperta e i contatti in evidenza, spesso sceglie chi si fa trovare meglio. Una pagina social da sola non basta.

Per questo preparo gratuitamente il nuovo sito di {nome} e glielo mostro finito: se le piace, lo acquista; se non le piace, non paga nulla e non ha perso nulla. Nessun anticipo, nessun impegno.

Le va di vederlo? Le basta rispondere a questa email.

Cordiali saluti,
Andrea

P.S. Se preferisce non ricevere altre email, mi risponda "No grazie": non la contatterò più.
""",
"oggetto_rilancio": "Le avevo scritto per il sito di {nome}",
"corpo_rilancio": """Buongiorno,

qualche giorno fa le avevo scritto a proposito del sito web di {nome}. Non voglio insistere: le riassumo la proposta in due righe, poi decide lei.

Realizzo il sito PRIMA e glielo mostro finito: se le piace lo acquista, se non le piace non paga nulla e non ha perso niente. Nessun anticipo, nessun impegno.

Se vuole vederlo, mi basta un "sì" in risposta a questa email.

Cordiali saluti,
Andrea

P.S. Se preferisce non ricevere altre email, mi risponda "No grazie": non la contatterò più.
""",
},

"immobiliare": {
"mittente": "Andrea — Siti web per agenzie immobiliari",
"oggetto": "Il nuovo sito di {nome}: prima lo vede, poi decide",
"corpo": """Buongiorno,

mi occupo di siti web per agenzie immobiliari, e lavoro in un modo un po' diverso dal solito: il sito lo realizzo PRIMA, e voi decidete solo dopo averlo visto.

Oggi chi cerca casa guarda online prima di entrare in agenzia: un sito vostro, con la vetrina degli immobili, vi dà una visibilità che i soli portali (dove pagate per farvi notare in mezzo a tutti) non danno, e trasmette più fiducia di una semplice pagina social.

Per questo preparo gratuitamente il nuovo sito di {nome}, con una vetrina degli immobili, e ve lo mostro finito: se vi piace, lo acquistate; se non vi piace, non pagate nulla e non avete perso nulla. Nessun anticipo, nessun impegno.

Vi va di vederlo? Basta rispondere a questa email.

Cordiali saluti,
Andrea

P.S. Se preferite non ricevere altre email, rispondete "No grazie": non vi contatterò più.
""",
"oggetto_rilancio": "Le avevo scritto per il sito di {nome}",
"corpo_rilancio": """Buongiorno,

qualche giorno fa vi avevo scritto a proposito del sito web di {nome}. Non voglio insistere: vi riassumo la proposta in due righe, poi decidete voi.

Realizzo il sito PRIMA, con la vetrina dei vostri immobili, e ve lo mostro finito: se vi piace lo acquistate, se non vi piace non pagate nulla e non avete perso niente. Nessun anticipo, nessun impegno.

Se volete vederlo, mi basta un "sì" in risposta a questa email.

Cordiali saluti,
Andrea

P.S. Se preferite non ricevere altre email, rispondete "No grazie": non vi contatterò più.
""",
},
}


def tipo_valido(tipo):
    """Un tipo tra quelli scritti a mano, oppure il predefinito."""
    tipo = (tipo or "").strip().lower()
    return tipo if tipo in TESTI else TIPO_PREDEFINITO


def testi_per_tipo(tipo=None):
    """Testi e nome mittente per quel tipo di impresa."""
    return TESTI[tipo_valido(tipo)]


def etichetta_tipo(tipo):
    return TIPI_ETICHETTE.get(tipo_valido(tipo), tipo or "")
