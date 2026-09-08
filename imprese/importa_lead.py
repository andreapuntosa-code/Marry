# -*- coding: utf-8 -*-
"""
importa_lead.py — Importa i lead trovati a mano (Facebook, LinkedIn, gruppi,
annunci locali...) nella pipeline: le email passano per la verifica e finiscono
nella campagna attiva, i numeri WhatsApp finiscono in un elenco separato che tu
scrivi a mano (nessun invio automatico: WhatsApp lo fai di persona).

Come si usa:
  1. Lancia lo script una volta: crea "nuovi_lead.csv" con le intestazioni.
  2. Apri il file (Excel, Fogli Google, un editor di testo...) e aggiungi una
     riga per ogni lead che trovi: basta il Nome e almeno un contatto
     (Email o WhatsApp).
  3. Rilancia lo script: legge le righe nuove, verifica le email, evita i
     doppioni e le smista.
  4. Puoi continuare ad aggiungere righe sotto e rilanciare quando vuoi: le
     righe gia' importate vengono segnate e non rientrano una seconda volta.

Colonne del file:
  Nome      obbligatorio
  Email     opzionale — se c'e', va nella campagna email attiva
  WhatsApp  opzionale — se c'e', va in contatti_whatsapp.csv (lo scrivi a mano)
  Tipo      opzionale (edile, elettricista, idraulico, immobiliare) —
            decide QUALE testo riceve. Se vuoto: "edile" (predefinito).
  Note      opzionale — dove l'hai trovato, e' solo per te

Uso da terminale:
    python importa_lead.py                        nuovi_lead.csv
    python importa_lead.py miei_lead.csv           file diverso
"""

import csv
import os
import re
import sys
from datetime import datetime

import account
import invia_email
import testi_imprese
import verifica_email
from memoria import carica_visti, ricorda_visti

FILE_PREDEFINITO = "nuovi_lead.csv"
FILE_WHATSAPP = "contatti_whatsapp.csv"
CAMPI_LEAD = ["Nome", "Email", "WhatsApp", "Tipo", "Note", "Importato"]
CAMPI_WHATSAPP = ["Nome", "Numero", "Servizio", "Tipo", "Note", "Stato", "Aggiunto"]

# Un numero e' quasi certamente sbagliato/incompleto sotto questa lunghezza
# (cifre, senza contare il prefisso internazionale).
NUMERO_MIN_CIFRE = 8


def crea_modello(percorso):
    """Crea il file vuoto con le intestazioni e una riga di esempio."""
    with open(percorso, "w", newline="", encoding="utf-8-sig") as f:
        scrittore = csv.DictWriter(f, fieldnames=CAMPI_LEAD)
        scrittore.writeheader()
        scrittore.writerow({
            "Nome": "Esempio Idraulica Rossi", "Email": "", "WhatsApp": "+39 333 1234567",
            "Tipo": "idraulico", "Note": "trovato nel gruppo FB Artigiani Bergamo",
            "Importato": "",
        })
    print(f"Creato '{percorso}' con le intestazioni e una riga di esempio.")
    print("Aprilo, cancella la riga di esempio, aggiungi i tuoi lead "
          "(basta Nome + Email o WhatsApp) e rilancia lo script.")


def normalizza_numero(numero):
    """Ripulisce un numero di telefono: tiene solo cifre e un '+' iniziale.

    Non verifica che il numero esista davvero (per WhatsApp non c'e' un
    equivalente della sonda SMTP): e' un controllo di forma, non di realta'."""
    numero = (numero or "").strip()
    if not numero:
        return ""
    pulito = re.sub(r"[^\d+]", "", numero)
    pulito = "+" + pulito.lstrip("+") if pulito.startswith("+") else pulito
    cifre = re.sub(r"\D", "", pulito)
    if len(cifre) < NUMERO_MIN_CIFRE:
        return ""                          # troppo corto: probabilmente un errore
    return pulito


def carica_whatsapp_esistenti():
    """Numeri gia' presenti in contatti_whatsapp.csv (per non duplicarli)."""
    if not os.path.exists(FILE_WHATSAPP):
        return set()
    with open(FILE_WHATSAPP, newline="", encoding="utf-8-sig") as f:
        return {(r.get("Numero") or "").strip() for r in csv.DictReader(f)}


def aggiungi_whatsapp(righe_nuove):
    """Accoda i nuovi contatti WhatsApp, creando il file se serve."""
    esiste = os.path.exists(FILE_WHATSAPP)
    with open(FILE_WHATSAPP, "a", newline="", encoding="utf-8-sig") as f:
        scrittore = csv.DictWriter(f, fieldnames=CAMPI_WHATSAPP, extrasaction="ignore")
        if not esiste:
            scrittore.writeheader()
        scrittore.writerows(righe_nuove)


def aggiungi_email_a_campagna(righe_nuove):
    """Accoda i nuovi contatti alla lista della campagna attiva.

    Rilegge il CSV appena prima di scrivere (non usa il "fondi" pensato per
    gli invii lunghi, che aggiorna solo righe gia' presenti: qui dobbiamo
    invece AGGIUNGERE righe nuove), cosi' la finestra in cui un altro processo
    potrebbe scrivere nel frattempo resta minima."""
    campi, righe_disco = invia_email.carica_contatti()
    esistenti = {(r.get("Email") or "").strip().lower() for r in righe_disco}
    davvero_nuove = [r for r in righe_nuove
                     if r["Email"].strip().lower() not in esistenti]
    if not davvero_nuove:
        return []
    tutte = righe_disco + davvero_nuove
    invia_email.salva_contatti(campi, tutte, fondi=False)
    return davvero_nuove


def importa(percorso, chiave_campagna=None):
    if chiave_campagna:
        invia_email.usa_account(chiave_campagna)
    profilo = account.attivo()

    if not os.path.exists(percorso):
        crea_modello(percorso)
        return

    with open(percorso, newline="", encoding="utf-8-sig") as f:
        lettore = csv.DictReader(f)
        campi = list(lettore.fieldnames or [])
        righe = list(lettore)

    for obbligatoria in ("Nome",):
        if obbligatoria not in campi:
            sys.exit(f"ERRORE: nel file manca la colonna '{obbligatoria}'.")
    for colonna in CAMPI_LEAD:
        if colonna not in campi:
            campi.append(colonna)
    for riga in righe:
        for colonna in CAMPI_LEAD:
            riga.setdefault(colonna, "")

    da_importare = [r for r in righe if not (r.get("Importato") or "").strip()]
    print(f"Campagna attiva : {profilo['servizio']} ({profilo['csv']})")
    print(f"Righe nel file  : {len(righe)}  ·  da elaborare: {len(da_importare)}\n")
    if not da_importare:
        print("Niente di nuovo da importare: aggiungi righe sotto quelle "
              "gia' segnate e rilancia.")
        return

    # Doppioni: email gia' nella memoria permanente (visti/contattati/rilanci)
    # UNIONE alle email gia' presenti nel CSV in questo momento — stesso
    # schema di trova_locali.py — cosi' un lead identico a una riga aggiunta
    # a mano nel CSV (mai passata dalla memoria) non viene reinserito.
    _, righe_csv_attuali = invia_email.carica_contatti()
    email_nel_csv = {(r.get("Email") or "").strip().lower() for r in righe_csv_attuali
                     if (r.get("Email") or "").strip()}
    contattati_e_visti = carica_visti() | email_nel_csv
    whatsapp_esistenti = carica_whatsapp_esistenti()

    nuove_email, nuovi_whatsapp = [], []
    scartate_email = saltate_doppie = senza_contatto = 0
    ora = datetime.now().strftime("%d/%m/%Y %H:%M")

    for riga in da_importare:
        nome = riga["Nome"].strip()
        email = riga["Email"].strip().lower()
        whatsapp = normalizza_numero(riga["WhatsApp"])
        tipo = testi_imprese.tipo_valido(riga["Tipo"])
        note = riga["Note"].strip()

        if not nome:
            print("  [SALTATA]  riga senza nome")
            riga["Importato"] = ora
            continue
        if not email and not whatsapp:
            print(f"  [SALTATO]  {nome}: nessun contatto utilizzabile "
                  f"(manca email e WhatsApp)")
            senza_contatto += 1
            riga["Importato"] = ora
            continue

        if email:
            if email in contattati_e_visti:
                print(f"  [SALTATO]  {nome} <{email}>: gia' in lista o gia' contattato")
                saltate_doppie += 1
            else:
                esito, motivo = verifica_email.verifica(email, profondo=True)
                if esito == verifica_email.ESITO_SCARTA:
                    print(f"  [SCARTATA] {nome} <{email}>: {motivo}")
                    scartate_email += 1
                else:
                    marchio = "OK" if esito == verifica_email.ESITO_OK else "incerta"
                    print(f"  [{marchio.upper():7}] {nome} <{email}>"
                          + (f" — {motivo}" if esito != verifica_email.ESITO_OK else ""))
                    nuove_email.append({"Nome": nome, "Email": email, "Stato": "",
                                        "Sito": "", "Tipo": tipo})
                    contattati_e_visti.add(email)      # non ripescarla in questa stessa importazione

        if whatsapp:
            if whatsapp in whatsapp_esistenti:
                print(f"  [SALTATO]  {nome} <{whatsapp}>: numero gia' in elenco")
            else:
                etichetta = testi_imprese.etichetta_tipo(tipo)
                print(f"  [WHATSAPP] {nome} <{whatsapp}>  ({etichetta})")
                nuovi_whatsapp.append({
                    "Nome": nome, "Numero": whatsapp, "Servizio": profilo["servizio"],
                    "Tipo": etichetta, "Note": note, "Stato": "Da scrivere",
                    "Aggiunto": ora,
                })
                whatsapp_esistenti.add(whatsapp)

        riga["Importato"] = ora

    # Scrittura: prima le email (che passano per la verifica anti-doppioni
    # permanente), poi WhatsApp, infine il file di input viene segnato cosi'
    # non si reimporta nulla al prossimo giro.
    aggiunte_davvero = aggiungi_email_a_campagna(nuove_email) if nuove_email else []
    if aggiunte_davvero:
        ricorda_visti([r["Email"] for r in aggiunte_davvero])
    if nuovi_whatsapp:
        aggiungi_whatsapp(nuovi_whatsapp)

    with open(percorso, "w", newline="", encoding="utf-8-sig") as f:
        scrittore = csv.DictWriter(f, fieldnames=campi, extrasaction="ignore")
        scrittore.writeheader()
        scrittore.writerows(righe)

    print(f"\nEmail aggiunte a {profilo['csv']}   : {len(aggiunte_davvero)}")
    print(f"Email scartate (inesistenti)     : {scartate_email}")
    print(f"Email gia' in lista/contattate   : {saltate_doppie}")
    print(f"Numeri WhatsApp aggiunti         : {len(nuovi_whatsapp)}  "
          f"(in {FILE_WHATSAPP}, da scrivere a mano)")
    if senza_contatto:
        print(f"Righe senza alcun contatto       : {senza_contatto}")


def main():
    percorso = sys.argv[1] if len(sys.argv) > 1 else FILE_PREDEFINITO
    try:
        importa(percorso)
    except ValueError as errore:
        sys.exit(f"ERRORE: {errore}")


if __name__ == "__main__":
    main()
