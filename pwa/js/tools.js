// Tool dell'agente: dichiarazioni (schema OpenAPI subset) + esecuzione sullo store locale.

import { store } from './store.js';

const str = (description) => ({ type: 'string', description });
const num = (description) => ({ type: 'number', description });
const int = (description) => ({ type: 'integer', description });
const obj = (properties, required = []) => ({ type: 'object', properties, required });

export const toolDeclarations = [
  {
    name: 'get_diet_plan',
    description: 'Restituisce la dieta preimpostata: pasti, alimenti, grammature, calorie, macro e target giornalieri.',
  },
  {
    name: 'get_today_nutrition',
    description: 'Restituisce calorie e macro consumati oggi e i target giornalieri.',
  },
  {
    name: 'log_food',
    description: "Registra un alimento consumato oggi nel diario, con calorie e macro. Usalo quando l'utente dice cosa ha mangiato.",
    parameters: obj({
      meal_name: str('Pasto: Colazione, Pranzo, Cena, Spuntino'),
      food_name: str("Nome dell'alimento"),
      grams: num('Quantità in grammi'),
      kcal: num('Calorie totali'),
      protein: num('Proteine in grammi'),
      carbs: num('Carboidrati in grammi'),
      fat: num('Grassi in grammi'),
    }, ['meal_name', 'food_name', 'grams', 'kcal', 'protein', 'carbs', 'fat']),
  },
  {
    name: 'replace_planned_food',
    description: "Sostituisce un alimento nella dieta preimpostata con un'alternativa. Chiedi conferma all'utente prima di chiamarla.",
    parameters: obj({
      meal_name: str("Pasto che contiene l'alimento"),
      old_food_name: str('Alimento da sostituire'),
      new_food_name: str('Nuovo alimento'),
      grams: num('Grammi del nuovo alimento'),
      kcal: num('Calorie del nuovo alimento'),
      protein: num('Proteine in grammi'),
      carbs: num('Carboidrati in grammi'),
      fat: num('Grassi in grammi'),
    }, ['meal_name', 'old_food_name', 'new_food_name', 'grams', 'kcal', 'protein', 'carbs', 'fat']),
  },
  {
    name: 'get_workout_plan',
    description: 'Restituisce la scheda di allenamento: giorni, esercizi, serie, ripetizioni, recuperi.',
  },
  {
    name: 'get_exercise_history',
    description: 'Storico di carichi, serie e ripetizioni di un esercizio nelle ultime sessioni.',
    parameters: obj({
      exercise_name: str("Nome dell'esercizio"),
      limit: int('Numero massimo di sessioni (default 10)'),
    }, ['exercise_name']),
  },
  {
    name: 'replace_exercise',
    description: "Sostituisce un esercizio nella scheda (infortunio, attrezzatura mancante). Chiedi conferma all'utente prima di chiamarla.",
    parameters: obj({
      day_name: str('Giorno della scheda'),
      old_exercise_name: str('Esercizio da sostituire'),
      new_exercise_name: str('Nuovo esercizio'),
      muscle_group: str('Gruppo muscolare'),
      target_sets: int('Numero di serie'),
      target_reps: str('Range ripetizioni, es. 8-10'),
      rest_seconds: int('Recupero in secondi'),
      notes: str('Note tecniche opzionali'),
    }, ['day_name', 'old_exercise_name', 'new_exercise_name', 'muscle_group', 'target_sets', 'target_reps']),
  },
  {
    name: 'log_weight',
    description: 'Registra il peso corporeo di oggi in kg.',
    parameters: obj({ weight_kg: num('Peso in kg') }, ['weight_kg']),
  },
  {
    name: 'get_weight_history',
    description: 'Storico del peso corporeo.',
    parameters: obj({ limit: int('Numero massimo di misurazioni (default 30)') }),
  },
  {
    name: 'search_web',
    description: 'Cerca informazioni aggiornate sul web (valori nutrizionali, ricette, evidenze scientifiche). Usala quando servono dati che non conosci con certezza.',
    parameters: obj({ query: str('Ricerca specifica da effettuare') }, ['query']),
  },
];

export async function executeTool(name, args) {
  try {
    switch (name) {
      case 'get_diet_plan': return getDietPlan();
      case 'get_today_nutrition': return getTodayNutrition();
      case 'log_food': return logFood(args);
      case 'replace_planned_food': return replacePlannedFood(args);
      case 'get_workout_plan': return getWorkoutPlan();
      case 'get_exercise_history': return getExerciseHistory(args);
      case 'replace_exercise': return replaceExercise(args);
      case 'log_weight': return logWeight(args);
      case 'get_weight_history': return getWeightHistory(args);
      case 'search_web': {
        const { webSearch } = await import('./gemini.js');
        return await webSearch(String(args.query || ''));
      }
      default: return { error: `Tool sconosciuto: ${name}` };
    }
  } catch (error) {
    return { error: error.message };
  }
}

// Notifica alle view che i dati sono cambiati (ri-render)
function notifyDataChanged() {
  window.dispatchEvent(new CustomEvent('fc:data-changed'));
}

function getDietPlan() {
  const diet = store.getDiet();
  if (!diet) return { error: 'Nessuna dieta configurata' };
  return {
    plan_name: diet.name,
    targets: diet.targets,
    meals: diet.meals.map(m => ({
      name: m.name,
      foods: m.foods.map(f => ({ name: f.name, grams: f.grams, kcal: f.kcal, protein: f.protein, carbs: f.carbs, fat: f.fat })),
    })),
  };
}

function getTodayNutrition() {
  const diet = store.getDiet();
  const entries = store.getTodayFoodLog();
  const sum = (key) => Math.round(entries.reduce((acc, e) => acc + (e[key] || 0), 0));
  return {
    consumed: { kcal: sum('kcal'), protein: sum('protein'), carbs: sum('carbs'), fat: sum('fat') },
    targets: diet?.targets || null,
    logged_foods: entries.map(e => `${e.foodName} (${Math.round(e.grams)}g, ${Math.round(e.kcal)} kcal) - ${e.mealName}`),
  };
}

function logFood(args) {
  const { meal_name, food_name, grams, kcal, protein, carbs, fat } = args;
  if (!meal_name || !food_name || ![grams, kcal, protein, carbs, fat].every(v => typeof v === 'number' && v >= 0)) {
    return { error: 'Parametri mancanti o non validi' };
  }
  store.addFoodLog({ mealName: meal_name, foodName: food_name, grams, kcal, protein, carbs, fat });
  notifyDataChanged();
  return { status: 'registrato', food: `${food_name} ${Math.round(grams)}g, ${Math.round(kcal)} kcal` };
}

function replacePlannedFood(args) {
  const diet = store.getDiet();
  if (!diet) return { error: 'Nessuna dieta configurata' };
  const meal = diet.meals.find(m => m.name.toLowerCase().includes(String(args.meal_name || '').toLowerCase()));
  const food = meal?.foods.find(f => f.name.toLowerCase().includes(String(args.old_food_name || '').toLowerCase()));
  if (!food) return { error: `Alimento '${args.old_food_name}' non trovato nel pasto '${args.meal_name}'` };

  const oldName = food.name;
  Object.assign(food, {
    name: args.new_food_name,
    grams: args.grams, kcal: args.kcal,
    protein: args.protein, carbs: args.carbs, fat: args.fat,
  });
  store.saveDiet(diet);
  notifyDataChanged();
  return { status: 'sostituito', detail: `${oldName} -> ${args.new_food_name} in ${meal.name}` };
}

function getWorkoutPlan() {
  const plan = store.getWorkout();
  if (!plan) return { error: 'Nessuna scheda configurata' };
  return plan;
}

function getExerciseHistory(args) {
  if (!args.exercise_name) return { error: 'Parametro exercise_name mancante' };
  const history = store.getExerciseHistory(String(args.exercise_name), args.limit || 10);
  if (history.length === 0) return { info: `Nessuno storico per '${args.exercise_name}'` };
  return {
    exercise: args.exercise_name,
    sessions: history.map(h => ({
      date: h.date,
      sets: h.sets.map(s => `${s.kg}kg x ${s.reps}`),
      top_weight_kg: h.top,
      total_volume_kg: h.volume,
    })),
  };
}

function replaceExercise(args) {
  const plan = store.getWorkout();
  if (!plan) return { error: 'Nessuna scheda configurata' };
  const day = plan.days.find(d => d.name.toLowerCase().includes(String(args.day_name || '').toLowerCase()));
  const exercise = day?.exercises.find(e => e.name.toLowerCase().includes(String(args.old_exercise_name || '').toLowerCase()));
  if (!exercise) return { error: `Esercizio '${args.old_exercise_name}' non trovato nel giorno '${args.day_name}'` };

  const oldName = exercise.name;
  Object.assign(exercise, {
    name: args.new_exercise_name,
    muscle: args.muscle_group,
    sets: args.target_sets,
    reps: args.target_reps,
    rest: args.rest_seconds || exercise.rest,
    notes: args.notes || '',
  });
  store.saveWorkout(plan);
  notifyDataChanged();
  return { status: 'sostituito', detail: `${oldName} -> ${args.new_exercise_name} in ${day.name}` };
}

function logWeight(args) {
  const kg = Number(args.weight_kg);
  if (!kg || kg < 20 || kg > 400) return { error: 'Peso non valido' };
  store.addWeight(kg);
  notifyDataChanged();
  return { status: 'registrato', weight_kg: kg };
}

function getWeightHistory(args) {
  const limit = args?.limit || 30;
  const weights = store.getWeights().slice(-limit);
  return { measurements: weights.map(w => ({ date: w.date, weight_kg: w.kg })) };
}
