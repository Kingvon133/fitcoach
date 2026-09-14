// Persistenza locale (localStorage, JSON). Dati solo sul dispositivo.

const KEYS = {
  diet: 'fc_diet',
  foodLog: 'fc_foodlog',
  workout: 'fc_workout',
  sessions: 'fc_sessions',
  weights: 'fc_weights',
  chat: 'fc_chat',
  settings: 'fc_settings',
};

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
};

// Dieta + scheda personali (dalle foto del piano fornito). Modificabili dalla chat o da "Altro".
export function seedIfNeeded() {
  if (!store.getDiet()) {
    store.saveDiet({
      name: 'Dieta settimanale — Ricomposizione corporea',
      targets: { kcal: 1950, protein: 175, carbs: 165, fat: 65 },
      restrictions: ['Zero uova', 'Zero verdure'],
      notes: [
        'Idratazione: 2L/giorno',
        'Olio EVO: 2 cucchiai/giorno (20g totali)',
        'Whey: 60g di polvere al giorno (es. 2 scoop da 30g)',
      ],
      // Pasti fissi, uguali ogni giorno della settimana.
      fixedMeals: [
        { name: 'Colazione', foods: [
          { name: 'Plumcake (2 fette)', grams: 60, kcal: 234, protein: 4, carbs: 32, fat: 9 },
          { name: 'Yogurt greco alla frutta', grams: 150, kcal: 173, protein: 8, carbs: 24, fat: 5 },
        ]},
        { name: 'Spuntino mattina', foods: [
          { name: 'Frutto medio (mela/banana/pera)', grams: 150, kcal: 83, protein: 1, carbs: 20, fat: 0 },
        ]},
        { name: 'Spuntino pomeriggio', foods: [
          { name: 'Affettato magro (fesa tacchino/bresaola)', grams: 80, kcal: 96, protein: 22, carbs: 1, fat: 2 },
        ]},
        { name: 'Extra giornaliero', foods: [
          { name: 'Olio EVO', grams: 20, kcal: 177, protein: 0, carbs: 0, fat: 20 },
          { name: 'Proteine whey (polvere)', grams: 60, kcal: 228, protein: 45, carbs: 5, fat: 4 },
        ]},
      ],
      // Pranzo e cena cambiano ogni giorno.
      days: [
        { name: 'Lunedì', meals: [
          { name: 'Pranzo', foods: [
            { name: 'Pasta in bianco', grams: 70, kcal: 252, protein: 8, carbs: 53, fat: 1 },
            { name: 'Mozzarellata', grams: 150, kcal: 330, protein: 26, carbs: 5, fat: 24 },
          ]},
          { name: 'Cena', foods: [
            { name: 'Petto di pollo ai ferri', grams: 280, kcal: 462, protein: 87, carbs: 0, fat: 10 },
            { name: 'Patate lesse', grams: 150, kcal: 128, protein: 3, carbs: 30, fat: 0 },
          ]},
        ]},
        { name: 'Martedì', meals: [
          { name: 'Pranzo', foods: [
            { name: 'Riso', grams: 80, kcal: 288, protein: 6, carbs: 64, fat: 0 },
            { name: 'Tonno naturale', grams: 250, kcal: 263, protein: 60, carbs: 0, fat: 3 },
          ]},
          { name: 'Cena', foods: [
            { name: 'Riso', grams: 90, kcal: 324, protein: 6, carbs: 72, fat: 1 },
            { name: 'Parmigiano', grams: 30, kcal: 117, protein: 10, carbs: 0, fat: 9 },
          ]},
        ]},
        { name: 'Mercoledì', meals: [
          { name: 'Pranzo', foods: [
            { name: 'Piadina', grams: 70, kcal: 193, protein: 6, carbs: 34, fat: 4 },
            { name: 'Prosciutto crudo sgrassato', grams: 190, kcal: 304, protein: 53, carbs: 1, fat: 10 },
          ]},
          { name: 'Cena', foods: [
            { name: 'Salmone', grams: 220, kcal: 440, protein: 44, carbs: 0, fat: 29 },
            { name: 'Pane comune', grams: 100, kcal: 275, protein: 9, carbs: 55, fat: 1 },
          ]},
        ]},
        { name: 'Giovedì', meals: [
          { name: 'Pranzo', foods: [
            { name: 'Gnocchi', grams: 170, kcal: 272, protein: 5, carbs: 56, fat: 2 },
            { name: 'Parmigiano', grams: 25, kcal: 98, protein: 8, carbs: 0, fat: 7 },
          ]},
          { name: 'Cena', foods: [
            { name: 'Fesa di tacchino a cubetti', grams: 300, kcal: 345, protein: 72, carbs: 0, fat: 4.5 },
            { name: 'Patate lesse', grams: 140, kcal: 119, protein: 3, carbs: 28, fat: 0 },
          ]},
        ]},
        { name: 'Venerdì', meals: [
          { name: 'Pranzo', foods: [
            { name: 'Couscous', grams: 70, kcal: 263, protein: 9, carbs: 54, fat: 1 },
            { name: 'Tonno naturale', grams: 220, kcal: 231, protein: 53, carbs: 0, fat: 2 },
          ]},
          { name: 'Cena', foods: [
            { name: 'Pizza margherita classica', grams: 280, kcal: 800, protein: 32, carbs: 100, fat: 28 },
          ]},
        ]},
        { name: 'Sabato', meals: [
          { name: 'Pranzo', foods: [
            { name: 'Pane in cassetta', grams: 120, kcal: 318, protein: 10, carbs: 60, fat: 4 },
            { name: 'Bresaola', grams: 180, kcal: 270, protein: 58, carbs: 1, fat: 4 },
          ]},
          { name: 'Cena', foods: [
            { name: 'Tagliata di manzo magro', grams: 270, kcal: 513, protein: 84, carbs: 0, fat: 19 },
            { name: 'Patate al forno', grams: 140, kcal: 154, protein: 3, carbs: 28, fat: 3 },
          ]},
        ]},
        { name: 'Domenica', meals: [
          { name: 'Pranzo', foods: [
            { name: 'Pasta corta', grams: 80, kcal: 288, protein: 10, carbs: 60, fat: 1 },
            { name: 'Ragù di manzo magro (macinato)', grams: 220, kcal: 308, protein: 46, carbs: 4, fat: 13 },
          ]},
          { name: 'Cena', foods: [
            { name: 'Pane rustico tostato', grams: 90, kcal: 261, protein: 8, carbs: 50, fat: 3 },
            { name: 'Prosciutto cotto sgrassato', grams: 200, kcal: 220, protein: 40, carbs: 2, fat: 6 },
          ]},
        ]},
      ],
    });
  }

  if (!store.getWorkout()) {
    store.saveWorkout({
      name: 'Full Body — 3x settimana',
      notes: [
        'Riscaldamento: 5-10 min di mobilità prima di ogni sessione',
        'Progressione: aumenta il peso quando fai tutte le rep con buona forma',
        'Riposo tra le serie: 90-120s sui multiarticolari, 45-60s sul plank',
        'Durata sessione: circa 35-40 minuti',
        'Obiettivo generale: 10.000 passi al giorno',
      ],
      days: [
        { name: 'Full Body', weekdays: [0, 2, 4], exercises: [
          { name: 'Leg press', muscle: 'Gambe/Quadricipiti', sets: 4, reps: '8-12', rest: 105 },
          { name: 'Leg curl', muscle: 'Femorali', sets: 3, reps: '10-12', rest: 90 },
          { name: 'Chest press machine', muscle: 'Petto', sets: 4, reps: '8-12', rest: 105 },
          { name: 'Shoulder press machine', muscle: 'Spalle', sets: 3, reps: '10-12', rest: 90 },
          { name: 'Lat machine presa larga', muscle: 'Dorso', sets: 4, reps: '8-12', rest: 105 },
          { name: 'Seated row / rematore ai cavi', muscle: 'Dorso centrale', sets: 3, reps: '10-12', rest: 90 },
          { name: 'Plank', muscle: 'Core', sets: 3, reps: '45-60s', rest: 50 },
        ]},
      ],
      // indice giorno (0=Lun..6=Dom) -> nota per i giorni senza scheda in sala pesi
      restSchedule: {
        1: 'Camminata 30-40 min',
        3: 'Camminata 30-40 min',
        5: 'Riposo o camminata leggera',
        6: 'Riposo o camminata leggera',
      },
    });
  }
}
