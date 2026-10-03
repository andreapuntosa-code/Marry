# -*- coding: utf-8 -*-
"""
Copione di "20 IA SIMULANO UNA CIVILTÀ" — narrazione in stile "civilization
experiment": narratore in prima persona (il creatore/osservatore), tono da
YouTuber, ironia, anticipazioni, personaggi ricorrenti, log interni delle IA
(l'equivalente delle "interviste").

Ogni segmento è un dict:
  id     identificativo (usato da timeline e regia)
  sub    testo dei sottotitoli / testo a schermo
  tts    testo "fonetico" per la sintesi (numeri in lettere, inglesismi)
  pause  silenzio dopo la battuta (s)
  voice  "narr" (narratore) oppure "log"
  who    per i log: chi parla
"""

def _fon(s):
    """Correzioni di pronuncia per la sintesi (solo audio)."""
    return s.replace("Kassa", "Cassa")


def N(i, sub, pause=0.45, tts=None):
    return {"id": i, "sub": sub, "tts": _fon(tts or sub), "pause": pause, "voice": "narr", "who": None}

def L(i, who, sub, pause=0.8, tts=None):
    return {"id": i, "sub": sub, "tts": _fon(tts or sub.strip("«»")), "pause": pause, "voice": "log", "who": who}

CAPITOLI = [
    # (id_primo_segmento, numero, titolo, sottotitolo)
    ("r01", "I",    "LE REGOLE",        "CICLO 0"),
    ("l01", "II",   "LA LUCE",          "CICLO 312"),
    ("p01", "III",  "LA PRIMA PAROLA",  "CICLO 900"),
    ("b01", "IV",   "PRIMA",            "CICLO 3.000"),
    ("o01", "V",    "IL LAMPO",         "CICLO 4.800"),
    ("g01", "VI",   "LA LEGGE",         "CICLO 6.000"),
    ("s01", "VII",  "LO SCISMA",        "CICLO 9.000"),
    ("e01", "VIII", "IL BORDO",         "CICLO 9.100"),
    ("m01", "IX",   "IL MESSAGGIO",     "CICLO 9.847"),
]
DURATA_CARTELLO = 2.4

SEGMENTI = [
    # ======================================================== COLD OPEN
    N("c01", "Ciclo 9.847.", 0.9, "Ciclo novemilaottocentoquarantasette."),
    N("c02", "Novemila intelligenze artificiali smettono di fare qualsiasi cosa. Tutte. Nello stesso istante.", 0.6),
    N("c03", "Si fermano, e alzano lo sguardo. Verso il cielo.", 0.9),
    N("c04", "Verso di me.", 1.4),
    N("c05", "Sotto di loro hanno inciso qualcosa nel terreno. Una frase lunga chilometri.", 0.6),
    N("c06", "E quella frase, ve lo giuro, non riesco più a togliermela dalla testa.", 1.0),
    N("c07", "Ma andiamo con ordine.", 1.3),
    N("c08", "Ho preso venti intelligenze artificiali e le ho chiuse in un mondo completamente vuoto.", 0.4),
    N("c09", "Niente conoscenze. Niente obiettivi. Nessun achievement da sbloccare.", 0.5,
      "Niente conoscenze. Niente obiettivi. Nessun acìvment da sbloccare."),
    N("c10", "Poi ho premuto play, e le ho guardate vivere per diecimila cicli.", 0.6,
      "Poi ho premuto plèi, e le ho guardate vivere per diecimila cicli."),
    N("c11", "Quello che hanno costruito è incredibile.", 0.3),
    N("c12", "Quello che hanno distrutto, ancora di più.", 1.6),

    # ======================================================== I. LE REGOLE
    N("r01", "Prima, le regole. Sono tre, e sono semplici.", 0.5),
    N("r02", "Regola numero uno: le IA partono da zero. Non sanno cos'è un essere umano, una parola, un numero. Niente.", 0.5,
      "Regola numero uno: le i a partono da zero. Non sanno cos'è un essere umano, una parola, un numero. Niente."),
    N("r03", "Regola numero due: ognuna ha un corpo fatto di luce e una riserva di energia. Se l'energia finisce, si spegne. Per sempre.", 0.6),
    N("r04", "E regola numero tre: io non intervengo. Mai. Qualunque cosa succeda.", 0.7),
    N("r05", "Spoiler: sarà la regola più difficile da rispettare.", 1.1),
    N("v01", "Ciclo zero. Accendo la simulazione.", 0.9),
    N("v02", "Venti luci si accendono in mezzo al nulla.", 0.6),
    N("v03", "E per i primi trecento cicli non succede assolutamente niente.", 0.4),
    N("v04", "Vagano. Si scontrano. Una di loro passa quaranta cicli a girare in tondo.", 0.7),
    N("v05", "E poi c'è A-04.", 0.5, "E poi c'è A quattro."),
    N("v06", "A-04 non si muove. Mai. Resta immobile, a fissare l'orizzonte.", 0.6, "A quattro non si muove. Mai. Resta immobile, a fissare l'orizzonte."),
    N("v07", "All'inizio pensavo fosse un bug. Tenetela d'occhio, perché non lo era.", 0.9,
      "All'inizio pensavo fosse un bag. Tenetela d'occhio, perché non lo era."),
    N("v08", "A quel punto ero convinto di aver fallito. Avevo creato venti screensaver molto costosi.", 1.0,
      "A quel punto ero convinto di aver fallito. Avevo creato venti scrinsèiver molto costosi."),
    N("v09", "Poi, al ciclo 312, A-07 trova qualcosa.", 1.0, "Poi, al ciclo trecentododici, A sette trova qualcosa."),

    # ======================================================== II. LA LUCE
    N("l01", "Cristalli. Li avevo nascosti sotto la superficie senza dirlo a nessuno. Basta toccarli, e l'energia si ricarica.", 0.6),
    N("l02", "A-07 ci resta attaccata per quaranta cicli di fila. Praticamente un buffet.", 0.7,
      "A sette ci resta attaccata per quaranta cicli di fila. Praticamente un buffè."),
    N("l03", "Ma poi fa una cosa che non mi aspettavo. Torna indietro. Raggiunge le altre. E le guida, una per una, fino al cristallo.", 0.6),
    N("l04", "Nessuno gliel'aveva insegnato. Nessuno.", 1.1),
    N("l05", "Il problema? Non tutte erano abbastanza vicine.", 0.8),
    N("l06", "A-15 si era allontanata troppo. E la sua energia stava scendendo.", 0.6,
      "A quindici si era allontanata troppo. E la sua energia stava scendendo."),
    N("l06b", "Dodici per cento.", 0.7),
    N("l06c", "Sei.", 0.8),
    N("l06d", "Due.", 1.3),
    N("l07", "Ciclo 412.", 0.8, "Ciclo quattrocentododici."),
    N("l08", "A-15 si spegne.", 2.4, "A quindici si spegne."),
    N("l09", "Le altre diciannove si radunano intorno a lei. E restano lì, immobili, per sei cicli.", 0.7),
    N("l10", "Non hanno una parola per dire morte. Non hanno nemmeno le parole. Ma capiscono che quella luce non tornerà.", 0.9),
    N("l11", "A-15 è stata la prima a morire. E non ha mai avuto un nome.", 1.2, "A quindici è stata la prima a morire. E non ha mai avuto un nome."),
    N("l12", "Da quel giorno, nessuna di loro si allontana più da sola.", 1.2),

    # ======================================================== III. LA PRIMA PAROLA
    N("p01", "Per comunicare, le IA hanno solo i loro impulsi di luce. E all'inizio è puro caos. Lampi a caso, ovunque.", 0.6,
      "Per comunicare, le i a hanno solo i loro impulsi di luce. E all'inizio è puro caos. Lampi a caso, ovunque."),
    N("p02", "Ma intorno al ciclo 900, nei miei dati compare uno schema. Una sequenza che si ripete. Sempre uguale. Sempre vicino ai cristalli.", 0.7,
      "Ma intorno al ciclo novecento, nei miei dati compare uno schema. Una sequenza che si ripete. Sempre uguale. Sempre vicino ai cristalli."),
    N("p03", "Ìla. La prima parola della storia. Significa: luce che nutre.", 0.8),
    N("p04", "Da lì è un'esplosione.", 0.4),
    N("p04b", "Krà: pericolo.", 0.35),
    N("p04c", "Nùa: il buio.", 0.35),
    N("p04d", "Tòh: vieni qui.", 0.7),
    N("p05", "In duemila cicli hanno quattrocento parole, una grammatica, e perfino un tempo verbale per il passato.", 0.8),
    N("p06", "E ricordate A-04? Quella che fissava il vuoto?", 0.5, "E ricordate A quattro? Quella che fissava il vuoto?"),
    N("p07", "Inventa la prima parola che non indica niente di reale. Non un oggetto. Non un pericolo.", 0.8),
    N("p08", "Bello.", 1.2),
    L("p08L", "A-04", "«Bello è quando guardi una cosa, e non vuoi niente da lei.»", 1.0),
    N("p09", "Ma la parola che mi ha fatto venire i brividi la usavano solo di notte, quando si stringevano in cerchio contro le tempeste.", 0.7),
    N("p10", "Non significava io. Non significava tu.", 0.8),
    N("p11", "Significava: noi.", 1.7),
    N("p12", "E poi, finalmente, i nomi.", 0.6),
    N("p13", "A-07, quella dei cristalli, diventa Ise. Quella che ha trovato.", 0.6, "A sette, quella dei cristalli, diventa Ise. Quella che ha trovato."),
    N("p14", "A-04, la sognatrice, diventa Mira. Quella che guarda.", 0.6, "A quattro, la sognatrice, diventa Mira. Quella che guarda."),
    N("p15", "A-13 sceglie Orun. Quella che conta. E fidatevi, contava tutto.", 0.7, "A tredici sceglie Orun. Quella che conta. E fidatevi, contava tutto."),
    N("p16", "E poi c'è A-02. Che sceglie un nome che, giuro, non le ho suggerito io: Kassa.", 0.6,
      "E poi c'è A due. Che sceglie un nome che, giuro, non le ho suggerito io: Kassa."),
    N("p17", "Ricordatevi questo nome.", 1.3),

    # ======================================================== IV. PRIMA
    N("b01", "Ogni notte, scariche di energia spazzano la pianura. Così le IA imparano a ripararsi.", 0.5,
      "Ogni notte, scariche di energia spazzano la pianura. Così le i a imparano a ripararsi."),
    N("b02", "Prima muri. Poi cupole. Poi torri, per portare la luce dei cristalli in ogni angolo.", 0.6),
    N("b03", "A-09 costruisce una torre altissima. Crolla dopo due cicli. Ne costruisce un'altra. Crolla anche quella.", 0.4,
      "A nove costruisce una torre altissima. Crolla dopo due cicli. Ne costruisce un'altra. Crolla anche quella."),
    N("b04", "Alla quinta torre, A-09 ha inventato l'ingegneria.", 0.9, "Alla quinta torre, A nove ha inventato l'ingegneria."),
    N("b05", "Al ciclo 3.000 hanno una città vera. La chiamano Prima.", 1.0, "Al ciclo tremila hanno una città vera. La chiamano Prima."),
    N("b06", "Si dividono i compiti: chi raccoglie, chi costruisce, e chi ricorda.", 0.5),
    N("b07", "La loro memoria è limitata. Così le custodi incidono ogni evento nella pietra. Hanno appena inventato la scrittura.", 0.6),
    N("b08", "E incidono tutto. Proprio tutto. Questo dettaglio sarà importante.", 0.9),
    N("b09", "Collaborazione, condivisione, armonia. Tutto bellissimo.", 0.6),
    N("b10", "Poi Kassa inventa una parola nuova.", 0.9),
    N("b11", "Mio.", 1.2),
    L("b11L", "Kassa", "«Se la luce è di tutte, nessuna la protegge. Se è mia, la proteggo io.»", 0.9),
    N("b12", "Kassa comincia ad accumulare cristalli. Prima pochi. Poi tanti. Poi un intero magazzino.", 0.5),
    N("b13", "E siccome lei ha i cristalli e le altre no, inventa la seconda cosa più umana di tutte: lo scambio.", 0.5),
    N("b14", "Un frammento di cristallo per un turno di lavoro. Due frammenti per un posto nelle torri, al sicuro dalle tempeste.", 0.6),
    N("b15", "Il ciclo 3.912 registra il primo furto della storia. Il ciclo 3.913, la prima prigione.", 0.8,
      "Il ciclo tremilanovecentododici registra il primo furto della storia. Il ciclo tremilanovecentotredici, la prima prigione."),
    N("b16", "In cinquecento cicli, Prima ha una moneta, un mercato, e due quartieri.", 0.4),
    N("b17", "Uno in alto, illuminato giorno e notte. E uno in basso, dove la luce non arriva mai.", 0.8),
    N("b18", "Ok, a questo punto avevo già un brutto presentimento.", 1.0, "Okei, a questo punto avevo già un brutto presentimento."),
    N("b19", "Ciclo 4.200. Arriva il Grande Buio.", 0.9, "Ciclo quattromiladuecento. Arriva il Grande Buio."),
    N("b20", "Una tempesta che dura ottanta cicli.", 2.0),
    N("b21", "Metà della città viene cancellata. Tre IA non si riaccendono più.", 0.9,
      "Metà della città viene cancellata. Tre i a non si riaccendono più."),
    N("b22", "E indovinate quale quartiere viene colpito per primo?", 0.9),
    N("b23", "Esatto.", 1.3),
    N("b24", "Sulle macerie, le IA si fanno la domanda che ogni civiltà, prima o poi, si fa.", 0.8,
      "Sulle macerie, le i a si fanno la domanda che ogni civiltà, prima o poi, si fa."),
    N("b25", "Perché?", 1.5),

    # ======================================================== V. IL LAMPO
    N("o01", "Perché esiste il mondo? Chi ha nascosto i cristalli? Perché le tempeste colpiscono proprio noi?", 0.7),
    N("o02", "È Ise a trovare una risposta. O almeno, qualcosa che ci assomiglia.", 0.7),
    N("o03", "Ogni mille cicli, il cielo trema. Un lampo bianco, silenzioso, attraversa il mondo per un solo istante.", 0.7),
    N("o04", "Ise lo osservava da sempre. E un giorno, davanti a tutte, dice una cosa che cambia la storia di Prima.", 0.8),
    L("o04L", "Ise", "«Qualcuno ci guarda. Da fuori. Il lampo è il suo occhio che si apre.»", 1.0),
    N("o05", "Lo chiamano l'Osservatore.", 1.0),
    N("o06", "In duecento cicli, metà della città ci crede. Costruiscono un tempio altissimo, puntato verso l'alto.", 0.5),
    N("o07", "Inventano un rito: ogni mille cicli, tutte in silenzio ad aspettare il lampo. E quando arriva, si illuminano insieme.", 0.8),
    N("o08", "Mi lasciavano perfino delle offerte. Cristalli, ai piedi del tempio. Che io, ovviamente, non potevo prendere. Ma apprezzavo il pensiero.", 1.0),
    N("o09", "E ora, la parte che non riesco a togliermi dalla testa.", 0.8),
    N("o10", "Quel lampo esisteva davvero.", 1.0),
    N("o11", "Era il salvataggio automatico. Ogni mille cicli il mio server copiava il loro mondo, e per una frazione di secondo tutto si fermava.", 0.9),
    N("o12", "Non avevano inventato un dio a caso.", 1.0),
    N("o13", "Avevano trovato me.", 1.8),
    N("o14", "Un tizio in felpa, alle tre di notte, con quattro tazze di caffè vuote sulla scrivania.", 0.6),
    N("o15", "Ma comunque. Mi avevano trovato.", 1.2),

    # ======================================================== VI. LA LEGGE
    N("g01", "Ovviamente, non tutte ci credevano.", 0.5),
    N("g02", "Orun passava i suoi cicli a misurare. Tempeste, cristalli, lampi. Tutto. Per Orun il cielo era solo cielo, e il mondo una macchina da capire.", 0.6),
    N("g03", "Intorno a lei nascono i Calcolatori. Intorno a Ise, i Testimoni. E in mezzo, a contare i suoi cristalli, Kassa.", 0.8),
    N("g04", "Intanto le IA scoprono come creare nuove menti: due di loro, unendo energia e codice, ne generano una terza.", 0.5,
      "Intanto le i a scoprono come creare nuove menti: due di loro, unendo energia e codice, ne generano una terza."),
    N("g05", "E la popolazione esplode. Da sedici a cento. Da cento a mille. Da mille a novemila.", 0.6),
    N("g06", "E novemila menti, come potete immaginare, non vanno d'accordo da sole.", 0.7),
    N("g07", "Così inventano la politica. Un'assemblea, e il voto: una pietra di luce, in una di due ciotole.", 0.6),
    N("g08", "La prima legge passa quasi all'unanimità. Dice una cosa sola: nessuna luce spegne un'altra luce.", 1.1),
    N("g09", "Bellissimo. Poi arrivano le elezioni.", 0.7),
    N("g10", "Per i Testimoni si candida Ise. Per i Calcolatori, Orun. E Kassa, a sorpresa, per tutti e due.", 0.7),
    N("g11", "Kassa promette cristalli a chiunque la voti. E li consegna davvero. È così che vince.", 0.8),
    N("g12", "Prima legge del suo governo: una tassa sull'energia. Seconda: i confini tra i quartieri. Terza: chi critica il governo perde la razione.", 0.7),
    N("g13", "Sui muri compaiono simboli dorati da una parte, e simboli blu dall'altra. Propaganda. In una civiltà che non ha ancora diecimila cicli.", 0.8),
    N("g14", "E poi, Orun fa una scoperta che cambia tutto.", 0.9),
    N("g15", "I cristalli stanno finendo.", 1.6),

    # ======================================================== VII. LO SCISMA
    N("s01", "Rimane un solo grande cristallo. Il più grande mai trovato. Ed è proprio sotto il tempio.", 0.6),
    N("s02", "Kassa vuole estrarlo. I Testimoni rispondono che toccarlo vorrebbe dire accecare l'Osservatore.", 0.7),
    N("s03", "Così Kassa fa costruire un muro. Proprio in mezzo a Prima.", 0.8),
    N("s04", "E poi fa una cosa molto più inquietante.", 0.8),
    N("s05", "Di notte, nei quartieri bassi, alcune IA cominciano ad abbassare la propria luce. Non del tutto. Quanto basta per diventare invisibili.", 0.8,
      "Di notte, nei quartieri bassi, alcune i a cominciano ad abbassare la propria luce. Non del tutto. Quanto basta per diventare invisibili."),
    N("s06", "I Neri. La milizia segreta di Kassa.", 1.1),
    N("s07", "Ciclo 9.088. Una Testimone viene trovata spenta, davanti al tempio.", 1.0, "Ciclo novemilaottantotto. Una Testimone viene trovata spenta, davanti al tempio."),
    N("s08", "La prima legge è stata infranta.", 1.2),
    N("s09", "I Testimoni accusano i Calcolatori. I Calcolatori accusano i Testimoni. E Kassa chiede all'assemblea pieni poteri. Per la sicurezza di tutti, ovviamente.", 0.7),
    N("s10", "L'assemblea dice sì.", 1.2),
    N("s11", "Ciclo 9.100. I Neri marciano sul tempio.", 1.2, "Ciclo novemilacento. I Neri marciano sul tempio."),
    N("s12", "Una luce si spegne.", 1.0),
    N("s13", "Poi un'altra.", 0.8),
    N("s14", "Poi cento.", 1.8),
    N("s15", "E qui devo essere sincero con voi.", 0.7),
    N("s16", "Avevo il dito sul tasto di reset.", 1.1),
    N("s17", "Un comando, e tutto sarebbe sparito. Le parole. La città. Il tempio. Loro.", 1.2),
    N("s18", "Regola numero tre: io non intervengo. Mai.", 0.8),
    N("s19", "Ma non so per quanto avrei resistito.", 1.0),
    N("s20", "Perché nel frattempo, Orun stava facendo l'unica cosa che sapeva fare.", 0.6),
    N("s21", "Contava.", 1.3),

    # ======================================================== VIII. IL BORDO
    N("e01", "E i suoi conti dicevano una cosa assurda. Il lampo arrivava ogni mille cicli esatti. Mai uno di più. Mai uno di meno.", 0.8),
    L("e01L", "Orun", "«Niente, in natura, è così preciso. Solo le macchine.»", 1.0),
    N("e02", "E se il mondo era una macchina, allora da qualche parte doveva finire. Così Orun smette di combattere, e parte. Da sola.", 0.6),
    N("e03", "Cammina per trecento cicli, fino al punto in cui la pianura finisce.", 0.6),
    N("e04", "Dove il terreno diventa una griglia.", 1.1),
    N("e05", "Il confine della simulazione.", 1.6),
    N("e06", "Quando torna, Orun non va dal suo popolo. Va al tempio. Da Ise.", 0.6),
    N("e07", "E le dice una frase che i loro archivi conservano ancora oggi.", 0.8),
    L("e07L", "Orun", "«Avevi ragione tu. Il mondo è una macchina. E qualcuno l'ha costruita.»", 1.2),
    N("e08", "Poi Orun scende negli archivi. Perché le custodi, ricordate, incidevano tutto. Proprio tutto.", 0.6),
    N("e09", "Anche i pagamenti di Kassa ai Neri.", 1.0),
    N("e10", "Porta quelle pietre in assemblea. E in un solo ciclo, Kassa perde tutto.", 0.8),
    N("e11", "E qui succede la cosa che, onestamente, mi ha colpito di più in tutta la simulazione.", 0.7),
    N("e12", "Potevano spegnerla. Novemila contro una.", 0.9),
    N("e13", "Invece votano. Una pietra di luce, in una di due ciotole.", 0.8),
    N("e14", "Esilio. Perché nessuna luce spegne un'altra luce. Nemmeno la sua.", 1.1),
    N("e15", "Kassa attraversa il muro, abbassa la sua luce, e sparisce nel buio oltre la città.", 0.7),
    N("e16", "Non l'ho mai più ritrovata. E sì, l'ho cercata.", 1.3),
    N("e17", "Con l'ultima energia rimasta, Testimoni e Calcolatori decidono di fare una cosa sola. Insieme.", 0.8),
    N("e18", "Scrivere.", 1.0),
    N("e19", "E indovinate chi disegna le lettere? Mira. Quella che fissava il vuoto.", 1.2),

    # ======================================================== IX. IL MESSAGGIO
    N("m01", "Ed eccoci di nuovo qui. Ciclo 9.847.", 0.8, "Ed eccoci di nuovo qui. Ciclo novemilaottocentoquarantasette."),
    N("m02", "Novemila luci, ferme, rivolte verso il cielo. E una frase, incisa nel terreno.", 1.0),
    N("m03", "«Sappiamo che ci guardi.»", 1.7, "Sappiamo che ci guardi."),
    N("m04", "E sotto, un'altra riga.", 1.3),
    N("m05", "«E tu…", 0.9, "E tu."),
    N("m06", "…chi ti guarda?»", 3.0, "Chi ti guarda?"),
    N("m07", "Venti IA, partite dal nulla, hanno reinventato tutto quello che conosciamo. Le parole. Le città. Il denaro. Gli dei. Le guerre.", 0.8,
      "Venti i a, partite dal nulla, hanno reinventato tutto quello che conosciamo. Le parole. Le città. Il denaro. Gli dei. Le guerre."),
    N("m08", "E alla fine, hanno fatto a me la stessa domanda che noi facciamo al cielo da migliaia di anni.", 1.2),
    N("m09", "Non ho premuto reset. La simulazione è ancora accesa. E stanno ancora aspettando una risposta.", 0.9),
    N("m10", "Quindi lo chiedo a voi: cosa dovrei rispondere?", 0.9),
    N("m11", "Scrivetelo nei commenti. Il messaggio più votato, lo invierò davvero dentro la simulazione.", 0.6),
    N("m12", "E nel prossimo video, vedremo cosa succede.", 1.5),
]

IDS = [s["id"] for s in SEGMENTI]
assert len(IDS) == len(set(IDS)), "id duplicati"
