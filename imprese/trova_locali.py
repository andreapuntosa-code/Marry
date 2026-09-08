# -*- coding: utf-8 -*-
"""
trova_locali.py — Ricava automaticamente imprese (edili, elettricisti,
idraulici, agenzie immobiliari) con relativa email e le aggiunge a
imprese.csv, pronte per invia_email.py.

Fonti, tutte gratuite e SENZA chiavi API:
  - Nominatim (OpenStreetMap): converte il nome della citta' nelle coordinate.
  - Overpass API (OpenStreetMap): elenca le imprese dentro quell'area.
  - Il sito dell'impresa stessa: se in OSM non c'e' l'email ma c'e' il sito,
    lo script apre la home + le pagine "contatti" e cerca l'indirizzo.

Solo moduli nativi: urllib, json, csv, re, time, sys, html.

Uso da terminale:
    python trova_locali.py                        citta' impostata sotto (CITTA), tutte le tipologie
    python trova_locali.py "Bergamo"               citta' scelta, tutte le tipologie
    python trova_locali.py "Bergamo" 60            citta' + numero massimo
    python trova_locali.py "Bergamo" 60 idraulico  citta' + numero + una sola tipologia

Puo' anche essere pilotato dall'interfaccia grafica (interfaccia.py):
    imposta_callback(log=..., stop=...)
    esegui("Bergamo", 50, tipi=["idraulico"])
"""

import csv
import html
import json
import os
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request

import account
import testi_imprese
import verifica_email
from memoria import carica_visti, ricorda_visti

# ----------------------------- CONFIGURAZIONE -----------------------------

CITTA = "Bergamo"                # citta'/comune da cui ricavare le imprese


def csv_file():
    """Lista della campagna attiva: la ricerca scrive dove serve."""
    return account.attivo()["csv"]


# Tipi di impresa da cercare: nome interno -> (chiave OSM, valore OSM).
# La chiave OSM decide come OpenStreetMap classifica quel mestiere: i
# muratori/imprese edili e gli impiantisti usano "craft", le agenzie
# immobiliari usano "office".
TIPI_IMPRESA = {
    "edile": ("craft", "builder"),
    "elettricista": ("craft", "electrician"),
    "idraulico": ("craft", "plumber"),
    "immobiliare": ("office", "estate_agent"),
}

MAX_LOCALI = 60                  # quante imprese processare al massimo per esecuzione
VISITA_SITI = True                # True = visita i siti per trovare le email mancanti
MAX_PAGINE_PER_SITO = 3          # home + fino a 2 pagine "contatti" per sito
PAUSA_TRA_SITI = 1.0             # secondi di pausa tra la visita di un sito e l'altro

# Verifica che l'indirizzo esista DAVVERO prima di metterlo in lista.
#   True  = controlla anche la casella interrogando il server di posta (piu'
#           lento, ~1-2 s per indirizzo, ma scarta le email inesistenti).
#   False = si ferma al controllo di sintassi e di esistenza del dominio.
VERIFICA_PROFONDA = True
TIENI_INCERTE = True             # gli indirizzi non verificabili (server
                                 # catch-all, greylisting) vengono comunque
                                 # tenuti: metterli da parte perderebbe
                                 # contatti buoni.

# Nominatim/Overpass chiedono un User-Agent che li identifichi: non serve
# un dominio vero, basta un nome riconoscibile per le loro statistiche.
USER_AGENT = "trova-imprese-script/1.0 (uso privato)"

NOMINATIM_URL = "https://nominatim.openstreetmap.org/search"

# Piu' server Overpass equivalenti: se uno e' sovraccarico (504), si passa al
# successivo. Sono mirror gratuiti degli stessi dati OpenStreetMap.
OVERPASS_MIRRORS = [
    "https://overpass-api.de/api/interpreter",
    "https://maps.mail.ru/osm/tools/overpass/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter",
    "https://overpass.private.coffee/api/interpreter",
]

# Query minuscola usata come "ping" per capire se un mirror e' vivo
# prima di mandargli la query pesante.
QUERY_SONDA = "[out:json][timeout:5];node(1);out;"

# Regex per gli indirizzi email nel testo delle pagine.
EMAIL_RE = re.compile(r"[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,24}")
# href dei link, per scovare le pagine "contatti".
HREF_RE = re.compile(r'href=["\']([^"\']+)["\']', re.IGNORECASE)

# Frammenti che indicano un'email finta/tecnica, da scartare.
EMAIL_SPAZZATURA = (
    "example.", "sentry", "wixpress", "yourdomain", "dominio", "email@",
    "@2x", ".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg", "godaddy",
    "domain.com", "test@", "name@", "user@", "nome@",
)

# ------------------------- CALLBACK (log / stop) --------------------------
# Di default scrive su schermo (print) e non si ferma mai. La GUI puo'
# sostituire queste callback per ricevere i messaggi in finestra e fermare.

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


# ------------------------------- FUNZIONI ---------------------------------


def http_get(url, timeout=25):
    """GET HTTP con User-Agent, restituisce (bytes, charset)."""
    richiesta = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(richiesta, timeout=timeout) as risposta:
        dati = risposta.read()
        charset = risposta.headers.get_content_charset() or "utf-8"
    return dati, charset


def http_post(url, dati_form, timeout=90):
    """POST HTTP (usato per Overpass), restituisce testo."""
    corpo = urllib.parse.urlencode(dati_form).encode("utf-8")
    richiesta = urllib.request.Request(url, data=corpo, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(richiesta, timeout=timeout) as risposta:
        return risposta.read().decode("utf-8", errors="replace")


def trova_bbox(citta):
    """Chiede a Nominatim le coordinate (bounding box) della citta'.

    Il bot imprese lavora solo in italiano (vedi testi_imprese.py), quindi
    non serve rilevare il paese come nel bot ristoranti: basta l'area.
    Solleva ValueError se la citta' non viene trovata."""
    query = urllib.parse.urlencode({"q": citta, "format": "json", "limit": 1})
    dati, _ = http_get(f"{NOMINATIM_URL}?{query}")
    risultati = json.loads(dati.decode("utf-8", errors="replace"))
    if not risultati:
        raise ValueError(f"Citta' '{citta}' non trovata su OpenStreetMap.")
    # boundingbox = [sud, nord, ovest, est] (stringhe)
    sud, nord, ovest, est = (float(x) for x in risultati[0]["boundingbox"])
    return sud, ovest, nord, est


def mirror_vivo(mirror):
    """Ping leggero: il mirror risponde entro 10 secondi?

    Evita di sprecare fino a 90 secondi mandando la query pesante
    a un server morto."""
    try:
        http_post(mirror, {"data": QUERY_SONDA}, timeout=10)
        return True
    except Exception:
        return False


def esegui_query_overpass(query, giri=2, attesa=25):
    """Prova la query su ogni mirror finche' uno risponde.

    Se il giro completo fallisce, aspetta `attesa` secondi e riprova:
    i 504 sono quasi sempre congestione momentanea che si libera da sola.
    Restituisce il testo JSON, oppure None se anche l'ultimo giro fallisce:
    in quel caso il chiamante ridurra' l'area della query."""
    for giro in range(giri):
        if _stop():
            return None
        if giro > 0:
            _log(f"    tutti i server occupati: aspetto {attesa} secondi e riprovo...")
            time.sleep(attesa)
        for mirror in OVERPASS_MIRRORS:
            if _stop():
                return None
            nome_server = mirror.split("/")[2]
            if not mirror_vivo(mirror):
                _log(f"    mirror morto, lo salto: {nome_server}")
                continue
            try:
                return http_post(mirror, {"data": query})
            except urllib.error.HTTPError as errore:
                if errore.code in (429, 504):
                    _log(f"    server occupato ({errore.code}): {nome_server}")
                    time.sleep(2)
                    continue
                raise
            except (urllib.error.URLError, TimeoutError, OSError):
                _log(f"    connessione interrotta: {nome_server}")
                continue
    return None


def costruisci_query(bbox, tipi):
    """Query Overpass per una o piu' tipologie di impresa.

    Ogni tipologia usa una coppia chiave/valore OSM diversa (es. craft=
    electrician oppure office=estate_agent), quindi la query e' un'unione
    di piu' blocchi, uno per tipologia richiesta."""
    sud, ovest, nord, est = bbox
    blocchi = []
    for tipo in tipi:
        chiave, valore = TIPI_IMPRESA[tipo]
        blocchi.append(f'  node["{chiave}"="{valore}"]({sud},{ovest},{nord},{est});')
        blocchi.append(f'  way["{chiave}"="{valore}"]({sud},{ovest},{nord},{est});')
    corpo = "\n".join(blocchi)
    return f"[out:json][timeout:60];\n(\n{corpo}\n);\nout center tags;\n"


def scarica_elementi(bbox, tipi, profondita=0):
    """Scarica gli elementi OSM nella bbox per le tipologie richieste.

    Le citta' grandi possono essere troppo pesanti per una query sola e il
    server risponde 504: in quel caso l'area viene divisa in 4 quadranti e
    ogni quadrante viene scaricato separatamente (ricorsivo, massimo 2
    livelli = fino a 16 sotto-aree)."""
    if _stop():
        return []
    query = costruisci_query(bbox, tipi)
    risposta = esegui_query_overpass(query)
    if risposta is not None:
        try:
            return json.loads(risposta).get("elements", [])
        except json.JSONDecodeError:
            pass  # risposta troncata/corrotta: trattala come area troppo pesante

    if _stop() or profondita >= 2:
        if profondita >= 2:
            _log("    zona troppo pesante anche dopo la divisione: la salto.")
        return []

    _log(f"    area troppo pesante: la divido in 4 quadranti (livello {profondita + 1})...")
    sud, ovest, nord, est = bbox
    lat_meta = (sud + nord) / 2
    lon_meta = (ovest + est) / 2
    quadranti = [
        (sud, ovest, lat_meta, lon_meta),
        (sud, lon_meta, lat_meta, est),
        (lat_meta, ovest, nord, lon_meta),
        (lat_meta, lon_meta, nord, est),
    ]
    elementi = []
    for quadrante in quadranti:
        if _stop():
            break
        elementi.extend(scarica_elementi(quadrante, tipi, profondita + 1))
        time.sleep(1)  # respiro tra una query e l'altra
    return elementi


def tipo_di_elemento(tag):
    """Quale tipologia (edile/elettricista/idraulico/immobiliare) corrisponde
    ai tag OSM di questo elemento."""
    for tipo, (chiave, valore) in TIPI_IMPRESA.items():
        if tag.get(chiave) == valore:
            return tipo
    return None


def scarica_locali(bbox, tipi):
    """Interroga Overpass e restituisce una lista di dict
    {nome, email, sito, tipo}."""
    elementi = scarica_elementi(bbox, tipi)

    imprese = []
    gia_viste = set()
    for elemento in elementi:
        # Un'impresa al confine tra due quadranti puo' arrivare due volte:
        # deduplichiamo con l'id OSM.
        chiave_elemento = (elemento.get("type"), elemento.get("id"))
        if chiave_elemento in gia_viste:
            continue
        gia_viste.add(chiave_elemento)

        tag = elemento.get("tags", {})
        nome = (tag.get("name") or "").strip()
        if not nome:
            continue  # senza nome non ci interessa
        email = (tag.get("email") or tag.get("contact:email") or "").strip()
        sito = (tag.get("website") or tag.get("contact:website")
                or tag.get("url") or "").strip()
        tipo = tipo_di_elemento(tag)
        imprese.append({"nome": nome, "email": email, "sito": sito, "tipo": tipo})
    return imprese


def email_valida(indirizzo):
    """Filtro rapido e gratuito (nessuna rete): scarta le email palesemente
    finte o tecniche. Il controllo serio lo fa poi verifica_email.py."""
    basso = indirizzo.lower()
    if any(spazzatura in basso for spazzatura in EMAIL_SPAZZATURA):
        return False
    if basso.count("@") != 1:
        return False
    return verifica_email.controlla_sintassi(basso)[0] != verifica_email.ESITO_SCARTA


def estrai_email_da_html(testo, dominio_sito):
    """Restituisce la migliore email trovata nel testo HTML, o stringa vuota.

    Preferisce le email il cui dominio coincide con quello del sito
    (piu' probabile che sia quella "ufficiale" dell'impresa)."""
    trovate = []
    # unquote: nei link "mailto:" gli spazi arrivano come %20 e finirebbero
    # dentro l'indirizzo (es. "%20info@impresa.it"), rendendolo inutilizzabile.
    testo_pulito = urllib.parse.unquote(html.unescape(testo))
    for grezza in EMAIL_RE.findall(testo_pulito):
        indirizzo = grezza.strip(" .,;:-_").lower()
        if email_valida(indirizzo) and indirizzo not in trovate:
            trovate.append(indirizzo)
    if not trovate:
        return ""
    if dominio_sito:
        for indirizzo in trovate:
            if indirizzo.split("@")[-1].endswith(dominio_sito):
                return indirizzo
    return trovate[0]


def normalizza_url(sito):
    """Assicura che l'URL abbia lo schema http/https."""
    if not sito:
        return ""
    if not sito.startswith(("http://", "https://")):
        return "https://" + sito
    return sito


def cerca_email_sul_sito(sito):
    """Apre la home e qualche pagina 'contatti' del sito e cerca un'email."""
    url = normalizza_url(sito)
    if not url:
        return ""
    try:
        dominio = urllib.parse.urlparse(url).netloc.lower().lstrip("www.")
    except ValueError:
        return ""

    pagine_da_visitare = [url]
    visitate = set()

    for pagina in pagine_da_visitare[:MAX_PAGINE_PER_SITO]:
        if _stop() or pagina in visitate:
            continue
        visitate.add(pagina)
        try:
            dati, charset = http_get(pagina, timeout=15)
        except Exception:
            continue
        testo = dati.decode(charset, errors="replace")

        email = estrai_email_da_html(testo, dominio)
        if email:
            return email

        # Cerca link verso pagine "contatti" da visitare dopo la home.
        if len(pagine_da_visitare) < MAX_PAGINE_PER_SITO:
            for href in HREF_RE.findall(testo):
                if any(parola in href.lower() for parola in ("contat", "contact")):
                    link = urllib.parse.urljoin(pagina, href)
                    if urllib.parse.urlparse(link).netloc.lower().lstrip("www.") == dominio:
                        if link not in pagine_da_visitare:
                            pagine_da_visitare.append(link)
    return ""


def carica_email_esistenti():
    """Legge le email gia' presenti nel CSV per evitare duplicati."""
    esistenti = set()
    if os.path.exists(csv_file()):
        with open(csv_file(), newline="", encoding="utf-8-sig") as f:
            for riga in csv.DictReader(f):
                email = (riga.get("Email") or "").strip().lower()
                if email:
                    esistenti.add(email)
    return esistenti


CAMPI_CSV = ["Nome", "Email", "Stato", "Sito", "Tipo"]
# "Sito" vuoto = nessun sito · "Tipo" = edile/elettricista/idraulico/immobiliare, decide il testo

# Indirizzi che in OpenStreetMap stanno nel campo "sito" ma NON sono un sito:
# pagine social, portali di annunci, scorciatoie. Un'impresa che ha solo
# questi e' a tutti gli effetti senza sito, quindi un buon cliente.
NON_SONO_SITI = (
    "facebook.", "fb.com", "fb.me", "instagram.", "linkedin.com",
    "twitter.com", "x.com/", "tiktok.com", "youtube.com",
    "business.site", "google.com/maps", "goo.gl/maps", "maps.app.goo.gl",
    # portali immobiliari: un'agenzia presente solo li' non ha un sito suo
    "immobiliare.it", "casa.it", "idealista.it", "subito.it",
)


def sito_vero(sito):
    """True solo se l'impresa ha un sito web suo, non una pagina social
    o una scheda su un portale di settore."""
    indirizzo = (sito or "").strip().lower()
    if not indirizzo:
        return False
    return not any(pezzo in indirizzo for pezzo in NON_SONO_SITI)


def assicura_colonne(percorso):
    """Restituisce le colonne del CSV, aggiungendo quelle mancanti.

    Serve quando il file e' stato creato da una versione precedente che non
    aveva ancora una colonna: le righe gia' presenti la ricevono vuota,
    nessun dato viene perso."""
    if not os.path.exists(percorso):
        return list(CAMPI_CSV)

    with open(percorso, newline="", encoding="utf-8-sig") as f:
        lettore = csv.DictReader(f)
        campi = list(lettore.fieldnames or [])
        righe = list(lettore)

    mancanti = [c for c in CAMPI_CSV if c not in campi]
    if not mancanti:
        return campi

    campi = campi + mancanti
    temporaneo = percorso + ".tmp"
    with open(temporaneo, "w", newline="", encoding="utf-8-sig") as f:
        scrittore = csv.DictWriter(f, fieldnames=campi, extrasaction="ignore")
        scrittore.writeheader()
        for riga in righe:
            for colonna in mancanti:
                riga.setdefault(colonna, "")
            scrittore.writerow(riga)
    os.replace(temporaneo, percorso)
    _log(f"    (aggiunta al CSV la colonna: {', '.join(mancanti)})")
    return campi


def aggiungi_al_csv(nuove_righe):
    """Aggiunge le nuove righe al CSV, creando l'intestazione se serve.

    Se il CSV e' bloccato (Excel aperto): da terminale chiede di chiuderlo;
    dalla GUI salva in un file di recupero per non perdere il lavoro fatto."""

    def scrivi(percorso):
        campi = assicura_colonne(percorso)
        esiste = os.path.exists(percorso)
        with open(percorso, "a", newline="", encoding="utf-8-sig") as f:
            scrittore = csv.DictWriter(f, fieldnames=campi, extrasaction="ignore")
            if not esiste:
                scrittore.writeheader()
            for riga in nuove_righe:
                scrittore.writerow(riga)   # Stato vuoto = "da inviare"

    while True:
        try:
            scrivi(csv_file())
            return csv_file()
        except PermissionError:
            _log(f"\nATTENZIONE: '{csv_file()}' e' bloccato — probabilmente aperto in Excel.")
            if INTERATTIVO:
                try:
                    input("Chiudi il file e premi Invio per riprovare... ")
                    continue
                except EOFError:
                    pass
            recupero = "imprese_recupero.csv"
            scrivi(recupero)
            _log(f"Contatti salvati in '{recupero}': incollali in {csv_file()} a mano.")
            return recupero


# --------------------------------- CORE ------------------------------------


def esegui(citta=None, limite=None, tipi=None):
    """Cerca le imprese di una citta' e le aggiunge al CSV. Restituisce riepilogo.

    tipi=None cerca TUTTE le tipologie insieme (edile, elettricista,
    idraulico, immobiliare); altrimenti passa una lista, es. ["idraulico"]."""
    citta = citta or CITTA
    limite = int(limite) if limite else MAX_LOCALI
    tipi = [t for t in (tipi or list(TIPI_IMPRESA)) if t in TIPI_IMPRESA]
    if not tipi:
        raise ValueError(f"Tipologia sconosciuta. Disponibili: "
                         f"{', '.join(TIPI_IMPRESA)}")

    etichette = ", ".join(testi_imprese.etichetta_tipo(t) for t in tipi)
    _log(f"Cerco a: {citta} (max {limite}) — tipologie: {etichette}")
    bbox = trova_bbox(citta)
    time.sleep(1)  # rispetta il limite di Nominatim (1 richiesta/secondo)

    imprese_trovate = scarica_locali(bbox, tipi)
    _log(f"Imprese trovate su OpenStreetMap: {len(imprese_trovate)}")
    if _stop():
        _log("\nInterrotto dall'utente.")
        return {"nuovi": 0, "da_osm": 0, "da_sito": 0}

    # Anti-duplicato permanente: unione tra le email nel CSV di oggi e la
    # memoria dei "visti" (che include anche i gia' contattati). Cosi' ogni
    # ricerca da' SOLO imprese mai viste prima, anche a distanza di giorni.
    esistenti_csv = carica_email_esistenti()
    ricorda_visti(esistenti_csv)  # allinea la memoria con il CSV attuale
    esistenti = esistenti_csv | carica_visti()
    nuove_righe = []
    gia_viste = set()
    con_email_diretta = 0
    da_sito = 0
    scartate = 0
    incerte = 0
    senza_sito = 0
    con_sito = 0

    # ORDINE DI PRECEDENZA: prima le imprese SENZA SITO, che sono i clienti
    # naturali per chi vende siti web (uguale al bot ristoranti).
    def precedenza(impresa):
        ha_email = bool(impresa["email"])
        ha_sito = sito_vero(impresa["sito"])
        if ha_email and not ha_sito:
            return 0
        if ha_email:
            return 1
        if ha_sito:
            return 2
        return 3

    imprese_trovate.sort(key=precedenza)
    senza_sito_disponibili = sum(1 for i in imprese_trovate if precedenza(i) == 0)
    if senza_sito_disponibili:
        _log(f"Imprese senza sito e con email pubblica: {senza_sito_disponibili} "
             f"(hanno la precedenza)")

    for impresa in imprese_trovate:
        if _stop():
            _log("\nInterrotto dall'utente.")
            break
        if len(nuove_righe) >= limite:
            break

        nome = impresa["nome"]
        email = impresa["email"].lower()
        tipo = impresa["tipo"] or testi_imprese.TIPO_PREDEFINITO

        if email and email_valida(email):
            fonte = "diretta"
        elif VISITA_SITI and impresa["sito"]:
            _log(f"  visito il sito di: {nome}")
            email = cerca_email_sul_sito(impresa["sito"])
            fonte = "sito"
            time.sleep(PAUSA_TRA_SITI)  # gentilezza verso i server
        else:
            continue  # niente email e niente sito da cui ricavarla

        if not email or not email_valida(email):
            continue
        if email in esistenti or email in gia_viste:
            continue  # gia' presente: no duplicati

        # Controllo vero: l'indirizzo esiste e puo' ricevere posta?
        esito, motivo = verifica_email.verifica(email, VERIFICA_PROFONDA)
        if esito == verifica_email.ESITO_SCARTA:
            scartate += 1
            _log(f"  [x] {nome} <{email}> — scartata: {motivo}")
            continue
        if esito == verifica_email.ESITO_INCERTO:
            incerte += 1
            if not TIENI_INCERTE:
                _log(f"  [?] {nome} <{email}> — non verificabile: {motivo}")
                continue

        gia_viste.add(email)
        sito = impresa["sito"]
        nuove_righe.append({"Nome": nome, "Email": email, "Stato": "",
                            "Sito": sito, "Tipo": tipo})
        if fonte == "diretta":
            con_email_diretta += 1
        else:
            da_sito += 1
        etichetta = testi_imprese.etichetta_tipo(tipo)
        if sito_vero(sito):
            con_sito += 1
            _log(f"  [+] {nome} <{email}>  [{etichetta}] (ha già un sito)")
        else:
            senza_sito += 1
            extra = " (solo social/portale)" if sito else ""
            _log(f"  [+] {nome} <{email}>  [{etichetta}] ** SENZA SITO **{extra}")

    if nuove_righe:
        file_usato = aggiungi_al_csv(nuove_righe)
        # Memorizza SOLO dopo che i contatti sono al sicuro su disco:
        # da questo momento non verranno mai piu' riproposti dalle ricerche.
        ricorda_visti([riga["Email"] for riga in nuove_righe])
        _log(f"\nAggiunte {len(nuove_righe)} nuove imprese a {file_usato} "
             f"({con_email_diretta} da OSM, {da_sito} dai siti).")
        _log(f"Di queste, {senza_sito} SENZA SITO (le migliori da contattare) "
             f"e {con_sito} con un sito già esistente.")
    else:
        _log("\nNessun contatto nuovo trovato (le imprese con email erano "
             "gia' tutte in lista o in memoria). Prova un'altra citta'.")
    if scartate or incerte:
        _log(f"Verifica: {scartate} indirizzi scartati perche' inesistenti, "
             f"{incerte} non verificabili con certezza"
             f"{' (tenuti comunque)' if TIENI_INCERTE else ' (esclusi)'}.")

    return {"nuovi": len(nuove_righe), "da_osm": con_email_diretta,
            "da_sito": da_sito, "scartate": scartate, "incerte": incerte,
            "senza_sito": senza_sito, "con_sito": con_sito}


# --------------------------------- MAIN ------------------------------------


def main():
    citta = sys.argv[1] if len(sys.argv) > 1 else CITTA
    limite = int(sys.argv[2]) if len(sys.argv) > 2 else MAX_LOCALI
    tipi = None
    if len(sys.argv) > 3:
        richiesto = sys.argv[3].lower()
        if richiesto not in ("tutte", "tutti"):
            tipi = [richiesto]
    try:
        esegui(citta, limite, tipi)
    except ValueError as errore:
        sys.exit(f"ERRORE: {errore}")
    print("Ora puoi lanciare:  python invia_email.py")


if __name__ == "__main__":
    main()
