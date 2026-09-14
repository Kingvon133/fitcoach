// Persistenza locale (localStorage, JSON) + sincronizzazione cloud opzionale (account).
// Il dispositivo resta sempre la fonte di verità immediata: ogni scrittura salva subito
// in locale e, se l'utente ha effettuato l'accesso, notifica sync.js per il salvataggio
// cloud (vedi 'fc:store-write'). La API key (settings) NON viene mai sincronizzata: resta
// solo sul dispositivo, per scelta di sicurezza/costi.

const KEYS = {
  diet: 'fc_diet',
  foodLog: 'fc_foodlog',
  workout: 'fc_workout',
  sessions: 'fc_sessions',
  weights: 'fc_weights',
  chat: 'fc_chat',
  settings: 'fc_settings',
};

let suppressWriteEvent = false;

function load(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function save(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
  if (key !== KEYS.settings && !suppressWriteEvent) {
    window.dispatchEvent(new CustomEvent('fc:store-write'));
  }
}

export function todayKey(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export const store = {
  // --- Dieta ---
  getDiet() { return load(KEYS.diet, null); },
  saveDiet(diet) { save(KEYS.diet, diet); },

  // --- Diario alimentare ---
  getFoodLog() { return load(KEYS.foodLog, []); },
  getTodayFoodLog() { return this.getFoodLog().filter(e => e.date === todayKey()); },
  addFoodLog(entry) {
    const log = this.getFoodLog();
    log.push({ ...entry, date: todayKey(), ts: Date.now() });
    save(KEYS.foodLog, log);
  },
  removeFoodLog(ts) {
    save(KEYS.foodLog, this.getFoodLog().filter(e => e.ts !== ts));
  },

  // --- Scheda ---
  getWorkout() { return load(KEYS.workout, null); },
  saveWorkout(plan) { save(KEYS.workout, plan); },

  // --- Sessioni allenamento ---
  getSessions() { return load(KEYS.sessions, []); },
  addExerciseLog(dayName, exerciseName, sets) {
    // sets: [{kg, reps}] — accorpa nella sessione di oggi per quel giorno
    const sessions = this.getSessions();
    const today = todayKey();
    let session = sessions.find(s => s.date === today && s.dayName === dayName);
    if (!session) {
      session = { date: today, dayName, logs: [] };
      sessions.push(session);
    }
    session.logs = session.logs.filter(l => l.exercise !== exerciseName);
    session.logs.push({ exercise: exerciseName, sets });
    save(KEYS.sessions, sessions);
  },
  getExerciseHistory(exerciseName, limit = 12) {
    const name = exerciseName.toLowerCase();
    return this.getSessions()
      .filter(s => s.logs.some(l => l.exercise.toLowerCase().includes(name)))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-limit)
      .map(s => {
        const log = s.logs.find(l => l.exercise.toLowerCase().includes(name));
        const top = Math.max(...log.sets.map(x => x.kg), 0);
        const volume = log.sets.reduce((acc, x) => acc + x.kg * x.reps, 0);
        return { date: s.date, sets: log.sets, top, volume };
      });
  },

  // --- Peso corporeo ---
  getWeights() { return load(KEYS.weights, []).sort((a, b) => a.date.localeCompare(b.date)); },
  addWeight(kg) {
    const list = load(KEYS.weights, []).filter(w => w.date !== todayKey());
    list.push({ date: todayKey(), kg });
    save(KEYS.weights, list);
  },
  removeWeight(date) {
    save(KEYS.weights, load(KEYS.weights, []).filter(w => w.date !== date));
  },

  // --- Chat ---
  getChat() { return load(KEYS.chat, []); },
  addChatMessage(role, text) {
    const chat = this.getChat();
    chat.push({ role, text, ts: Date.now() });
    save(KEYS.chat, chat);
  },
  clearChat() { save(KEYS.chat, []); },

  // --- Impostazioni ---
  getSettings() { return load(KEYS.settings, { apiKey: '', model: 'gemini-2.5-flash' }); },
  saveSettings(settings) { save(KEYS.settings, settings); },

  // --- Export ---
  exportAll() {
    const dump = {};
    for (const key of Object.values(KEYS)) {
      if (key === KEYS.settings) continue; // mai esportare la API key
      dump[key] = load(key, null);
    }
    return dump;
  },

  // --- Sync cloud: sovrascrive lo stato locale con i dati scaricati dall'account ---
  replaceAll({ diet, foodLog, workout, sessions, weights, chat }) {
    suppressWriteEvent = true;
    try {
      if (diet !== undefined) save(KEYS.diet, diet);
      if (foodLog !== undefined) save(KEYS.foodLog, foodLog);
      if (workout !== undefined) save(KEYS.workout, workout);
      if (sessions !== undefined) save(KEYS.sessions, sessions);
      if (weights !== undefined) save(KEYS.weights, weights);
      if (chat !== undefined) save(KEYS.chat, chat);
    } finally {
      suppressWriteEvent = false;
    }
  },
};

const WEEKDAY_NAMES = ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato', 'Domenica'];

// Dieta + scheda d'esempio al primo avvio (nessun account, o account nuovo senza dati).
// Pensati per essere generici: chi arriva sull'app li personalizza dal Coach, a mano o
// con la foto del piatto. Se avevi già dati locali (account personale) restano invariati:
// seedIfNeeded scrive solo se non c'è ancora nulla salvato.
export function seedIfNeeded() {
  if (!store.getDiet()) {
    store.saveDiet({
      name: 'Dieta di esempio — personalizzala!',
      targets: { kcal: 2200, protein: 150, carbs: 240, fat: 70 },
      notes: [
        'Questi sono dati di esempio: sostituiscili con i tuoi dal Coach, a mano o con la foto del piatto',
      ],
      fixedMeals: [
        { name: 'Colazione', foods: [
          { name: "Fiocchi d'avena", grams: 80, kcal: 300, protein: 11, carbs: 53, fat: 6 },
          { name: "Albume d'uovo", grams: 200, kcal: 104, protein: 22, carbs: 1, fat: 0 },
          { name: 'Banana', grams: 120, kcal: 107, protein: 1, carbs: 27, fat: 0 },
        ]},
        { name: 'Spuntino', foods: [
          { name: 'Yogurt greco 0%', grams: 170, kcal: 100, protein: 17, carbs: 6, fat: 0 },
          { name: 'Mandorle', grams: 20, kcal: 120, protein: 4, carbs: 4, fat: 10 },
        ]},
      ],
      // Pranzo e cena: stesso esempio ripetuto ogni giorno — personalizzabile giorno per giorno.
      days: WEEKDAY_NAMES.map(name => ({
        name,
        meals: [
          { name: 'Pranzo', foods: [
            { name: 'Riso basmati', grams: 100, kcal: 350, protein: 8, carbs: 78, fat: 1 },
            { name: 'Petto di pollo', grams: 200, kcal: 220, protein: 46, carbs: 0, fat: 3 },
            { name: 'Olio EVO', grams: 10, kcal: 90, protein: 0, carbs: 0, fat: 10 },
            { name: 'Verdure miste', grams: 200, kcal: 50, protein: 3, carbs: 8, fat: 0 },
          ]},
          { name: 'Cena', foods: [
            { name: 'Patate', grams: 300, kcal: 231, protein: 6, carbs: 52, fat: 0 },
            { name: 'Salmone', grams: 180, kcal: 370, protein: 37, carbs: 0, fat: 24 },
            { name: 'Verdure miste', grams: 200, kcal: 50, protein: 3, carbs: 8, fat: 0 },
          ]},
        ],
      })),
    });
  }

  if (!store.getWorkout()) {
    store.saveWorkout({
      name: 'Push / Pull / Legs — personalizzala!',
      notes: ['Scheda di esempio: sostituiscila con la tua dal Coach o dalla tab Workout'],
      days: [
        { name: 'Giorno A — Push', exercises: [
          { name: 'Panca piana bilanciere', muscle: 'Petto', sets: 4, reps: '6-8', rest: 150 },
          { name: 'Lento avanti manubri', muscle: 'Spalle', sets: 3, reps: '8-10', rest: 120 },
          { name: 'Panca inclinata manubri', muscle: 'Petto', sets: 3, reps: '8-10', rest: 120 },
          { name: 'Alzate laterali', muscle: 'Spalle', sets: 3, reps: '12-15', rest: 90 },
          { name: 'Pushdown ai cavi', muscle: 'Tricipiti', sets: 3, reps: '10-12', rest: 90 },
        ]},
        { name: 'Giorno B — Pull', exercises: [
          { name: 'Stacco da terra', muscle: 'Schiena', sets: 3, reps: '5', rest: 180 },
          { name: 'Trazioni', muscle: 'Schiena', sets: 4, reps: '6-10', rest: 150 },
          { name: 'Rematore bilanciere', muscle: 'Schiena', sets: 3, reps: '8-10', rest: 120 },
          { name: 'Face pull', muscle: 'Spalle posteriori', sets: 3, reps: '12-15', rest: 90 },
          { name: 'Curl bilanciere', muscle: 'Bicipiti', sets: 3, reps: '10-12', rest: 90 },
        ]},
        { name: 'Giorno C — Legs', exercises: [
          { name: 'Squat bilanciere', muscle: 'Quadricipiti', sets: 4, reps: '6-8', rest: 180 },
          { name: 'Stacco rumeno', muscle: 'Femorali', sets: 3, reps: '8-10', rest: 150 },
          { name: 'Leg press', muscle: 'Quadricipiti', sets: 3, reps: '10-12', rest: 120 },
          { name: 'Leg curl', muscle: 'Femorali', sets: 3, reps: '10-12', rest: 90 },
          { name: 'Calf raise in piedi', muscle: 'Polpacci', sets: 4, reps: '12-15', rest: 60 },
        ]},
      ],
    });
  }
}
