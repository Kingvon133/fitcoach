# FitCoach — Architettura

App per tracciamento Dieta + Allenamento con Agente AI integrato (Gemini, gratuito, con ricerca web).

> **Due implementazioni nello stesso repo:**
> - **`pwa/` — PWA web (ATTIVA)**: sviluppabile da Windows, installabile su iPhone senza Mac. Stack: HTML/CSS/JS vanilla (zero build), localStorage, grafici SVG custom. È la versione in uso.
> - **`FitCoach/` — Swift nativa (archiviata)**: SwiftUI + SwiftData + Swift Charts. Richiede Mac/Xcode per compilare; pronta per il futuro.
>
> L'architettura dell'agente AI descritta sotto è **identica** nei due stack (stessi tool, stesso loop, stesso pattern search-as-tool); cambiano solo persistenza e UI. Le sezioni 2-4 descrivono la versione Swift; per la PWA la mappa file è nel README.

## 1. Scelta tecnologica per l'Agente AI

### Raccomandazione: Google Gemini 2.5 Flash (API REST diretta)

| Criterio | Gemini 2.5 Flash | Groq + Tavily | OpenRouter free |
|---|---|---|---|
| Costo | **0€** (tier gratuito AI Studio) | 0€ ma 2 chiavi/2 servizi | 0€ ma modelli instabili |
| Function calling | ✅ nativo, affidabile | ✅ | ⚠️ dipende dal modello |
| Web search | ✅ **Google Search grounding nativo** (~500 query/giorno gratis) | Serve Tavily (1000/mese) | Serve tool esterno |
| SDK iOS | Non serve: REST + URLSession | REST | REST |
| Limiti free | ~10 RPM / ~250 req-giorno (Flash); flash-lite più alto | 30 RPM | Variabili |

**Vince Gemini**: una sola API key, un solo servizio, ricerca web di qualità Google integrata, function calling robusto. Nessun SDK di terze parti → zero dipendenze, build pulita.

### Pattern "search-as-tool" (decisione chiave)

L'API Gemini in alcune versioni non permette di combinare `googleSearch` e `functionDeclarations` nella **stessa** richiesta. Soluzione robusta:

1. L'agente ha un set di **funzioni locali** (leggere dieta, loggare pasti, sostituire esercizi, ecc.) **+ una funzione `search_web`**.
2. Quando l'agente chiama `search_web`, l'app esegue una **seconda chiamata Gemini separata** con solo il tool `googleSearch` attivo → risposta grounded con fonti.
3. Il risultato torna all'agente come `functionResponse`.

Vantaggi: nessun conflitto di tool, nessuna chiave extra, fonti citabili. Fallback opzionale: DuckDuckGo Instant Answer API (gratis, senza chiave) se il grounding è esaurito.

## 2. Architettura: MVVM + Repository leggero

```
┌──────────────────────────────────────────────────────┐
│ Views (SwiftUI)                                      │
│  RootTabView → Dashboard / Dieta / Workout / Chat    │
└──────────────┬───────────────────────────────────────┘
               │ @Observable / @Query
┌──────────────▼───────────────────────────────────────┐
│ ViewModels                                           │
│  ChatViewModel (loop agentico) · DashboardViewModel  │
└──────────────┬───────────────────────────────────────┘
               │
┌──────────────▼───────────────┐  ┌────────────────────┐
│ Services                     │  │ Persistence        │
│  GeminiService (REST client) │  │  SwiftData         │
│  AgentToolExecutor (tools)   │◄─┤  ModelContainer    │
│  WebSearchService (grounding)│  │                    │
└──────────────┬───────────────┘  └────────────────────┘
               │ HTTPS
        Google Gemini API (free tier)
```

### Flusso agentico (function calling loop)

```
Utente scrive → ChatViewModel.send()
  └─ GeminiService.generate(history, tools)
       ├─ risposta = testo → mostra, fine
       └─ risposta = functionCall(s)
            ├─ AgentToolExecutor esegue su SwiftData (o WebSearchService)
            ├─ appende functionResponse alla history
            └─ richiama generate() — max 6 iterazioni
```

### Tool esposti all'agente

| Tool | Scopo |
|---|---|
| `get_diet_plan` | Legge dieta preimpostata (pasti, alimenti, macro) |
| `get_today_nutrition` | Kcal/macro consumati oggi vs target |
| `log_food` | Registra alimento consumato (kcal + macro) |
| `replace_planned_food` | Sostituisce alimento nella dieta (alternative isocaloriche) |
| `get_workout_plan` | Legge scheda allenamento |
| `get_exercise_history` | Storico carichi/reps di un esercizio |
| `replace_exercise` | Sostituisce esercizio nella scheda (infortuni, varianti) |
| `log_weight` / `get_weight_history` | Peso corporeo |
| `search_web` | Ricerca online in tempo reale (grounding Google) |

L'agente ha così accesso a 360° ai dati e può **modificare** dieta e scheda su richiesta.

## 3. Struttura file

```
FitCoach/
├── FitCoachApp.swift            # Entry point, ModelContainer, seed
├── Config/
│   └── SecretsLoader.swift      # API key da Secrets.plist (gitignored)
├── Models/                      # SwiftData @Model
│   ├── DietModels.swift         # DietPlan, Meal, PlannedFood, FoodLogEntry
│   ├── WorkoutModels.swift      # WorkoutPlan, WorkoutDay, PlannedExercise,
│   │                            #   WorkoutSession, ExerciseLog, SetLog
│   └── TrackingModels.swift     # BodyMetric, ChatMessage
├── Services/
│   ├── GeminiService.swift      # Client REST v1beta, Codable, JSONValue
│   ├── AgentTools.swift         # Dichiarazioni tool + esecuzione su SwiftData
│   └── WebSearchService.swift   # Chiamata grounding googleSearch
├── ViewModels/
│   ├── ChatViewModel.swift      # Loop agentico, persistenza messaggi
│   └── DashboardViewModel.swift
├── Views/
│   ├── RootTabView.swift
│   ├── Dashboard/DashboardView.swift   # Ring kcal, macro, workout oggi, peso
│   └── Chat/ChatView.swift             # Chat agente, chip suggerimenti
└── Support/
    └── SeedData.swift           # Dieta + scheda d'esempio al primo avvio
```

## 4. Principi

- **@Observable** (Observation framework), niente `ObservableObject` legacy.
- SwiftData con relazioni `cascade`; `@Query` nelle view per dati reattivi, ViewModel per logica.
- Nessun segreto nel codice: `Secrets.plist` fuori da git.
- Errori gestiti a ogni livello: `GeminiError` tipizzato, messaggi user-friendly in chat.
- Grafici con Swift Charts, SF Symbols, dark/light nativi — zero librerie esterne.
