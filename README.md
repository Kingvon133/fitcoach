# FitCoach — Dieta + Allenamento con Coach AI (gratis, senza Mac)

App **PWA** (web app installabile): si sviluppa da Windows, si installa sull'iPhone da Safari con "Aggiungi a schermata Home". Icona, fullscreen, offline, stile iOS nativo. Agente AI Gemini con function calling e ricerca web Google. **Costo: 0€.**

> Perché PWA e non app nativa: compilare Swift richiede Mac/Xcode. Il codice Swift originale resta in `FitCoach/` per un eventuale futuro Mac. Architettura agente identica nei due stack: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Cosa fa

- **Oggi**: anello calorie, barre macro, allenamento del giorno, grafico peso
- **Dieta**: dieta preimpostata, tocca **+** per registrare un alimento mangiato
- **Workout**: scheda per giorni, logger serie (kg × reps) con valori precompilati dall'ultima sessione, grafico progressione carico per esercizio
- **Coach**: agente AI con accesso totale ai tuoi dati. Registra pasti descritti a parole, propone alternative isocaloriche, sostituisce esercizi nella scheda, analizza la progressione, **cerca sul web** (tabelle nutrizionali, evidenze scientifiche) citando fonti
- **Altro**: API key, peso corporeo, export dati JSON

Dati salvati **solo sul dispositivo** (localStorage). Nessun server, nessun account.

## Setup in 3 passi

### 1. Metti l'app online (una volta sola, gratis)

Serve un URL HTTPS per installarla su iPhone. Opzione più semplice — **GitHub Pages**:

1. Crea repository su github.com (es. `fitcoach`), carica il **contenuto della cartella `pwa/`** (via web: "uploading an existing file", trascina tutto).
2. Settings → Pages → Source: `main` branch, cartella `/ (root)` → Save.
3. Dopo ~1 minuto l'app è su `https://TUONOME.github.io/fitcoach/`.

Alternative: Netlify / Vercel (trascini la cartella `pwa/` nel browser).

Per provarla subito sul PC: `python -m http.server 8735 --directory pwa` e apri `http://localhost:8735`.

### 2. Installa su iPhone

1. Apri l'URL in **Safari**.
2. Tasto **Condividi** (quadrato con freccia) → **Aggiungi a schermata Home**.
3. Icona FitCoach sulla home: si apre fullscreen come app nativa.

### 3. Attiva il Coach AI (2 minuti, gratis, senza carta)

1. Su Safari vai su **aistudio.google.com**, accedi con account Google.
2. **Get API key → Create API key**, copia la chiave (`AIza…`).
3. Nell'app: tab **Altro** → incolla la chiave → **Salva**.

La chiave resta solo sul tuo dispositivo (localStorage), mai nel codice né su server.

Limiti tier gratuito (indicativi, verifica su [ai.google.dev/pricing](https://ai.google.dev/pricing)):

| Risorsa | Limite free |
|---|---|
| `gemini-2.5-flash` | ~10 richieste/min, ~250/giorno |
| `gemini-2.5-flash-lite` | limiti più alti (selezionabile in Altro) |
| Google Search grounding | ~500 ricerche/giorno |

Per uso personale ampiamente sufficiente.

## Prova l'agente

- *"Ho mangiato 150g di riso e 200g di pollo a pranzo"* → stima macro + log automatico
- *"Non ho il pollo, cosa mangio con gli stessi macro?"* → alternativa, conferma, dieta aggiornata
- *"Ho male alla spalla, sostituisci la panca piana"* → scheda aggiornata
- *"Quante proteine ha 100g di skyr? Cerca online"* → ricerca web con fonti
- *"Come va la mia progressione in panca?"* → analisi storico carichi

## Personalizza dieta e scheda

Al primo avvio carica esempi (`pwa/js/store.js`, funzione `seedIfNeeded`). Due modi per metterci i tuoi dati reali:

1. **Via Coach** (consigliato): *"Sostituisci la mia colazione con: 100g skyr, 60g avena, 30g burro d'arachidi"* — l'agente aggiorna la dieta pezzo per pezzo.
2. **Via codice**: modifica `seedIfNeeded` in `store.js` prima del deploy (poi svuota i dati del sito su iPhone per ricaricare il seed).

## Come funziona la ricerca web a costo zero

L'agente ha un tool `search_web`: quando lo chiama, l'app esegue una **seconda chiamata Gemini** con il tool nativo `googleSearch` (grounding). Risultati con fonti reali, nessuna chiave aggiuntiva. Dettagli: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Struttura

```
pwa/
├── index.html               # Shell + tab bar
├── manifest.webmanifest     # PWA (icona, standalone)
├── sw.js                    # Service worker (offline)
├── css/app.css              # Stile iOS, dark/light automatico
├── icons/                   # Icone app
└── js/
    ├── app.js               # Router tab
    ├── store.js             # Persistenza localStorage + seed
    ├── gemini.js            # Client Gemini + loop agentico
    ├── tools.js             # 10 tool dell'agente
    ├── ui.js                # Markdown sicuro, grafici SVG, toast
    └── views/               # dashboard, dieta, workout, chat, altro
FitCoach/                    # Versione Swift nativa (richiede Mac)
docs/ARCHITECTURE.md         # Architettura e scelte tecniche
```

## Risoluzione problemi

| Problema | Fix |
|---|---|
| Banner "Manca la API key" | Tab Altro → incolla chiave da aistudio.google.com |
| "Limite gratuito raggiunto" | Attendi 1 minuto, o passa a `gemini-2.5-flash-lite` in Altro |
| L'app non si aggiorna dopo un deploy | Il service worker cachea: chiudi e riapri l'app, o Impostazioni Safari → Dati siti web → rimuovi il sito |
| Ricerca web non risponde | Grounding esaurito (500/giorno) o rete assente |
