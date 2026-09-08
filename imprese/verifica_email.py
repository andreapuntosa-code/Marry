# -*- coding: utf-8 -*-
"""
verifica_email.py — Controlla se un indirizzo email esiste DAVVERO ed e' in
grado di ricevere messaggi, prima ancora di provare a scrivergli.

Tre livelli di controllo, dal piu' leggero al piu' severo:

  1. SINTASSI      forma dell'indirizzo, caratteri ammessi, domini con errori
                   di battitura noti, indirizzi tecnici (noreply@, sentry@...).
  2. DOMINIO (MX)  interroga il DNS e verifica che il dominio esista e abbia
                   un server di posta. Un dominio senza MX (ne' A) non puo'
                   ricevere email: l'indirizzo e' inutilizzabile.
                   Usa DNS-over-HTTPS (Google/Cloudflare): gratuito, nessuna
                   chiave, nessuna libreria da installare.
  3. CASELLA (SMTP) si collega al server di posta del dominio e gli chiede se
                   quella casella accetta messaggi (comando RCPT TO), SENZA
                   inviare nulla: la conversazione si chiude prima del testo.
                   Per non farsi ingannare dai server "catch-all" (che dicono
                   si' a qualunque indirizzo) prova anche un indirizzo finto:
                   se accetta pure quello, l'esito e' dichiarato incerto.

Esiti possibili:
  "ok"       verificato, la casella accetta posta
  "scarta"   certamente inutilizzabile (dominio inesistente, casella assente)
  "incerto"  non dimostrabile (server catch-all, greylisting, porta bloccata):
             l'indirizzo viene tenuto, ma sai che non e' garantito.

Solo moduli nativi: urllib, json, re, smtplib, socket, random, time.
Uso da terminale:
    python verifica_email.py mario@rossi.it
    python verifica_email.py locali.csv        # verifica un'intera lista
"""

import csv
import json
import os
import random
import re
import shutil
import smtplib
import socket
import sys
import time
import urllib.parse
import urllib.request

# ----------------------------- CONFIGURAZIONE -----------------------------

TIMEOUT_DNS = 10                 # secondi per la richiesta DNS-over-HTTPS
TIMEOUT_SMTP = 12                # secondi per la sonda SMTP
PAUSA_TRA_SONDE = 1.0            # pausa tra una sonda SMTP e l'altra

# Mittente e nome usati nella conversazione SMTP di prova: sono quelli della
# casella attiva, perche' molti server rifiutano chi si presenta male.
# Si leggono al momento dell'uso, cosi' seguono l'account selezionato.
import account


def mittente_sonda():
    return account.attivo()["email"]


def helo_nome():
    return mittente_sonda().split("@")[-1]


USER_AGENT = "verifica-email/1.0 (+https://siriodigital.it)"

ESITO_OK = "ok"
ESITO_SCARTA = "scarta"
ESITO_INCERTO = "incerto"

# Forma dell'indirizzo: piu' severa della regex "acchiappa tutto" usata per
# estrarre gli indirizzi dalle pagine web.
SINTASSI_RE = re.compile(
    r"^[a-z0-9!#$%&'*+/=?^_`{|}~-]+"
    r"(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*"
    r"@(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,24}$"
)

# Caselle tecniche o automatiche: esistono ma non le legge nessuno.
PREFISSI_INUTILI = (
    "noreply", "no-reply", "donotreply", "do-not-reply", "postmaster",
    "mailer-daemon", "abuse", "privacy", "webmaster@wordpress", "sentry",
    "wordpress@", "notifiche@", "notification", "bounce", "unsubscribe",
)

# Domini scritti male: errori di battitura comuni sui provider italiani.
DOMINI_ERRATI = {
    "gmial.com": "gmail.com", "gmai.com": "gmail.com", "gmail.con": "gmail.com",
    "gmail.it": "gmail.com", "hotmial.com": "hotmail.com", "hotmail.con": "hotmail.com",
    "libero.it.it": "libero.it", "liberno.it": "libero.it", "tiscali.com": "tiscali.it",
    "alice.it.it": "alice.it", "yahoo.con": "yahoo.com", "outlook.con": "outlook.com",
    "virgillio.it": "virgilio.it", "virgilio.com": "virgilio.it",
}

# Domini di immagini/servizi che finiscono nelle regex ma non sono email vere.
ESTENSIONI_FILE = (".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg", ".css", ".js")

# Caselle di Posta Elettronica Certificata: rifiutano la posta ordinaria
# (rispondono 554). Scriverci e' garanzia di rimbalzo.
DOMINI_PEC = (
    "pec.it", "legalmail.it", "postecert.it", "pec.aruba.it", "arubapec.it",
    "sicurezzapostale.it", "cert.legalmail.it", "pecimprese.it", "ingpec.eu",
    "peceasy.it", "mypec.eu", "pec.net", "consulentidellavoropec.it",
)

# ------------------------------- CACHE ------------------------------------
# Le informazioni sul dominio valgono per tutti gli indirizzi di quel dominio:
# le teniamo in memoria per non ripetere le stesse richieste.

_cache_mx = {}          # dominio -> (stato, [host_mx])
_cache_catchall = {}    # dominio -> True/False/None
_porta25 = None         # None = non ancora testata, True/False = esito

_log = print


def imposta_log(funzione):
    """Permette alla GUI di ricevere i messaggi invece di stamparli."""
    global _log
    if funzione is not None:
        _log = funzione


# ------------------------- 1. CONTROLLO SINTASSI --------------------------


def controlla_sintassi(email):
    """Restituisce (esito, motivo) senza toccare la rete."""
    indirizzo = (email or "").strip().lower()

    if not indirizzo or indirizzo.count("@") != 1:
        return ESITO_SCARTA, "forma non valida"
    if len(indirizzo) > 254:
        return ESITO_SCARTA, "indirizzo troppo lungo"
    if ".." in indirizzo or indirizzo.startswith(".") or "@." in indirizzo:
        return ESITO_SCARTA, "punti fuori posto"
    # "%20info@..." e simili: residui di indirizzi estratti male dalle pagine web.
    if "%" in indirizzo:
        return ESITO_SCARTA, "contiene codici di pagina web (estratta male)"
    # "-0975446451ristorante@..." : numero di telefono attaccato all'indirizzo.
    if indirizzo.startswith(("-", "_")) or indirizzo.split("@")[0].endswith("-"):
        return ESITO_SCARTA, "inizia o finisce con un trattino (estratta male)"
    if indirizzo.endswith(ESTENSIONI_FILE):
        return ESITO_SCARTA, "e' un nome di file, non un indirizzo"
    if not SINTASSI_RE.match(indirizzo):
        return ESITO_SCARTA, "forma non valida"

    parte_locale, dominio = indirizzo.split("@")
    if len(parte_locale) > 64:
        return ESITO_SCARTA, "parte prima della @ troppo lunga"
    if any(indirizzo.startswith(p) or p in indirizzo for p in PREFISSI_INUTILI):
        return ESITO_SCARTA, "casella automatica (nessuno la legge)"
    if dominio in DOMINI_ERRATI:
        return ESITO_SCARTA, f"dominio scritto male (forse {DOMINI_ERRATI[dominio]}?)"
    if dominio in DOMINI_PEC or dominio.startswith("pec."):
        return ESITO_SCARTA, "casella PEC: non accetta email ordinarie"

    return ESITO_OK, "sintassi corretta"


# --------------------- 2. CONTROLLO DOMINIO (DNS/MX) ----------------------


def _interroga_dns(dominio, tipo):
    """Interrogazione DNS-over-HTTPS. Restituisce il JSON o None."""
    try:
        nome = dominio.encode("idna").decode()   # domini con accenti
    except Exception:
        nome = dominio
    parametri = urllib.parse.urlencode({"name": nome, "type": tipo})
    for url in (f"https://dns.google/resolve?{parametri}",
                f"https://cloudflare-dns.com/dns-query?{parametri}"):
        try:
            richiesta = urllib.request.Request(url, headers={
                "User-Agent": USER_AGENT, "Accept": "application/dns-json"})
            with urllib.request.urlopen(richiesta, timeout=TIMEOUT_DNS) as risposta:
                return json.loads(risposta.read().decode("utf-8", errors="replace"))
        except Exception:
            continue
    return None


def controlla_dominio(dominio):
    """Il dominio esiste e puo' ricevere posta?

    Restituisce (esito, motivo, [host_mx])."""
    dominio = dominio.lower().strip(".")
    if dominio in _cache_mx:
        esito, motivo, host = _cache_mx[dominio]
        return esito, motivo, host

    risposta = _interroga_dns(dominio, "MX")
    if risposta is None:
        esito = (ESITO_INCERTO, "DNS non raggiungibile", [])
        _cache_mx[dominio] = esito
        return esito

    # Status 3 = NXDOMAIN: il dominio non esiste proprio.
    if risposta.get("Status") == 3:
        esito = (ESITO_SCARTA, "il dominio non esiste", [])
        _cache_mx[dominio] = esito
        return esito

    host = []
    for record in risposta.get("Answer", []):
        if record.get("type") == 15:                       # 15 = MX
            parti = str(record.get("data", "")).split()
            if len(parti) == 2:
                host.append((int(parti[0]), parti[1].rstrip(".")))
    host = [h for _, h in sorted(host)]                     # priorita' crescente
    # Un MX "." (null MX, RFC 7505) dichiara esplicitamente: non ricevo posta.
    if host and host[0] in ("", "."):
        esito = (ESITO_SCARTA, "il dominio dichiara di non ricevere posta", [])
        _cache_mx[dominio] = esito
        return esito

    if host:
        esito = (ESITO_OK, f"dominio con {len(host)} server di posta", host)
        _cache_mx[dominio] = esito
        return esito

    # Nessun MX: per le regole della posta si puo' consegnare al record A.
    risposta_a = _interroga_dns(dominio, "A")
    if risposta_a and any(r.get("type") == 1 for r in risposta_a.get("Answer", [])):
        indirizzi = [r["data"] for r in risposta_a["Answer"] if r.get("type") == 1]
        esito = (ESITO_INCERTO, "nessun server di posta dedicato (solo sito web)",
                 indirizzi[:1])
        _cache_mx[dominio] = esito
        return esito

    esito = (ESITO_SCARTA, "il dominio non ha server di posta", [])
    _cache_mx[dominio] = esito
    return esito


# ---------------------- 3. CONTROLLO CASELLA (SMTP) -----------------------


def porta25_disponibile():
    """Molti provider domestici bloccano la porta 25 in uscita: senza quella
    la sonda SMTP e' impossibile. Lo verifichiamo una volta sola."""
    global _porta25
    if _porta25 is not None:
        return _porta25
    try:
        with socket.create_connection(("aspmx.l.google.com", 25), timeout=8):
            _porta25 = True
    except Exception:
        _porta25 = False
        _log("    (porta 25 bloccata dal tuo provider: uso solo i controlli DNS)")
    return _porta25


def _conversazione_smtp(host_mx, email, dominio):
    """Chiede al server se accetta l'indirizzo, senza inviare nulla.

    Restituisce (codice_vero, codice_finto) oppure (None, None) se fallisce.
    L'indirizzo finto serve a smascherare i server 'catch-all'."""
    finto = f"zz-non-esiste-{random.randint(10 ** 9, 10 ** 10)}@{dominio}"
    server = None
    try:
        server = smtplib.SMTP(timeout=TIMEOUT_SMTP)
        server.connect(host_mx, 25)
        server.helo(helo_nome())
        server.mail(mittente_sonda())
        codice_vero, _ = server.rcpt(email)      # prima il vero: se il server
        try:                                     # chiude dopo un rifiuto,
            codice_finto, _ = server.rcpt(finto)  # l'informazione utile e' salva
        except Exception:
            codice_finto = None
        return codice_vero, codice_finto
    except (smtplib.SMTPServerDisconnected, smtplib.SMTPConnectError,
            socket.timeout, socket.gaierror, ConnectionError, OSError):
        return None, None
    except Exception:
        return None, None
    finally:
        if server is not None:
            try:
                server.quit()
            except Exception:
                pass


def controlla_casella(email, host_mx, dominio):
    """Interroga il server di posta. Restituisce (esito, motivo)."""
    if not host_mx:
        return ESITO_INCERTO, "nessun server da interrogare"
    if not porta25_disponibile():
        return ESITO_INCERTO, "sonda SMTP non disponibile (porta 25 bloccata)"

    for host in host_mx[:2]:                     # al massimo due server
        codice_vero, codice_finto = _conversazione_smtp(host, email, dominio)
        if codice_vero is None:
            continue                             # server muto: prova il prossimo

        if 500 <= codice_vero < 600:
            # Rifiuto definitivo del nostro indirizzo: la casella non esiste.
            # (Se rifiuta pure il finto e' coerente; se accettasse solo il
            # finto sarebbe assurdo, quindi non serve distinguere.)
            return ESITO_SCARTA, f"il server rifiuta la casella (codice {codice_vero})"
        if codice_vero in (250, 251):
            if codice_finto in (250, 251):
                return ESITO_INCERTO, "server catch-all: accetta qualsiasi indirizzo"
            return ESITO_OK, "casella confermata dal server"
        if 400 <= codice_vero < 500:
            return ESITO_INCERTO, f"risposta temporanea del server ({codice_vero})"

    return ESITO_INCERTO, "il server non ha risposto in modo utile"


# --------------------------- VERIFICA COMPLETA ----------------------------


def verifica(email, profondo=True):
    """Esegue i controlli in cascata. Restituisce (esito, motivo).

    Si ferma al primo esito definitivo: cosi' non si interroga la rete per
    indirizzi gia' scartabili a occhio."""
    indirizzo = (email or "").strip().lower()

    esito, motivo = controlla_sintassi(indirizzo)
    if esito != ESITO_OK:
        return esito, motivo

    dominio = indirizzo.split("@")[1]
    esito, motivo, host = controlla_dominio(dominio)
    if esito == ESITO_SCARTA:
        return esito, motivo
    peggiore = motivo if esito == ESITO_INCERTO else ""

    if not profondo:
        return (ESITO_INCERTO, peggiore) if peggiore else (ESITO_OK, motivo)

    esito_casella, motivo_casella = controlla_casella(indirizzo, host, dominio)
    if esito_casella == ESITO_SCARTA:
        return esito_casella, motivo_casella
    if esito_casella == ESITO_OK and not peggiore:
        return ESITO_OK, motivo_casella
    return ESITO_INCERTO, peggiore or motivo_casella


# ------------------------ VERIFICA DI UNA LISTA CSV -----------------------


def verifica_csv(percorso="locali.csv", profondo=True, solo_da_inviare=True,
                 stop=lambda: False):
    """Verifica gli indirizzi di un CSV e segna nello Stato quelli inutilizzabili.

    Le righe scartate NON vengono cancellate: prendono Stato
    'Email inesistente: <motivo>', cosi' resta traccia e non verranno inviate.
    Restituisce un riepilogo."""
    if not os.path.exists(percorso):
        raise FileNotFoundError(f"File non trovato: {percorso}")

    shutil.copy(percorso, percorso + ".bak")

    with open(percorso, newline="", encoding="utf-8-sig") as f:
        lettore = csv.DictReader(f)
        campi = list(lettore.fieldnames or [])
        righe = list(lettore)
    if "Stato" not in campi:
        campi.append("Stato")

    conteggio = {ESITO_OK: 0, ESITO_SCARTA: 0, ESITO_INCERTO: 0, "saltate": 0}

    for riga in righe:
        if stop():
            _log("\nInterrotto dall'utente.")
            break
        stato = (riga.get("Stato") or "").strip().lower()
        if solo_da_inviare and stato not in ("", "da inviare"):
            conteggio["saltate"] += 1
            continue

        email = (riga.get("Email") or "").strip()
        nome = (riga.get("Nome") or "").strip()
        esito, motivo = verifica(email, profondo)
        conteggio[esito] += 1

        if esito == ESITO_SCARTA:
            riga["Stato"] = f"Email inesistente: {motivo}"
            _log(f"  [SCARTATA] {nome} <{email}> — {motivo}")
        elif esito == ESITO_INCERTO:
            _log(f"  [INCERTA]  {nome} <{email}> — {motivo}")
        else:
            _log(f"  [OK]       {nome} <{email}>")

        if profondo:
            time.sleep(PAUSA_TRA_SONDE)

    temporaneo = percorso + ".tmp"
    with open(temporaneo, "w", newline="", encoding="utf-8-sig") as f:
        scrittore = csv.DictWriter(f, fieldnames=campi, extrasaction="ignore")
        scrittore.writeheader()
        scrittore.writerows(righe)
    os.replace(temporaneo, percorso)

    _log(f"\nVerifica finita — valide: {conteggio[ESITO_OK]}, "
         f"incerte: {conteggio[ESITO_INCERTO]}, "
         f"scartate: {conteggio[ESITO_SCARTA]}, "
         f"gia' gestite: {conteggio['saltate']}.")
    _log(f"Copia di sicurezza del file precedente: {percorso}.bak")
    return conteggio


# --------------------------------- MAIN ------------------------------------


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        return
    bersaglio = sys.argv[1]
    if bersaglio.lower().endswith(".csv"):
        verifica_csv(bersaglio)
    else:
        esito, motivo = verifica(bersaglio)
        print(f"{bersaglio}: {esito.upper()} — {motivo}")


if __name__ == "__main__":
    main()
