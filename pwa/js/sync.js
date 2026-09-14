// Sincronizzazione cloud: locale resta la fonte di verità immediata, il cloud è
// uno specchio per account e multi-dispositivo. Push automatico (debounced) ad ogni
// scrittura locale; pull all'accesso per riportare giù i dati salvati altrove.
import { getSupabase } from './supabaseClient.js';
import { getUser, isCloudEnabled, onAuthChange } from './auth.js';
import { store } from './store.js';

const TABLE = 'app_data';
const PUSH_DELAY_MS = 1200;
let pushTimer = null;
let syncing = false;

function notifyUi() {
  window.dispatchEvent(new CustomEvent('fc:data-changed'));
  window.dispatchEvent(new CustomEvent('fc:sync-status'));
}

export function getSyncing() {
  return syncing;
}

/** Scarica i dati dell'account e sovrascrive lo stato locale. Se l'account non ha
 * ancora nulla salvato, carica invece lo stato locale attuale come primo salvataggio. */
export async function pullFromCloud() {
  const sb = getSupabase();
  const user = getUser();
  if (!sb || !user) return;
  syncing = true;
  notifyUi();
  try {
    const { data, error } = await sb.from(TABLE).select('*').eq('user_id', user.id).maybeSingle();
    if (error) { console.warn('Sync: pull fallita', error); return; }
    if (data) {
      store.replaceAll({
        diet: data.diet,
        foodLog: data.food_log,
        workout: data.workout,
        sessions: data.sessions,
        weights: data.weights,
        chat: data.chat,
      });
    } else {
      await pushToCloud();
    }
  } finally {
    syncing = false;
    notifyUi();
  }
}

export function scheduleSync() {
  if (!isCloudEnabled() || !getUser()) return;
  clearTimeout(pushTimer);
  pushTimer = setTimeout(pushToCloud, PUSH_DELAY_MS);
}

export async function pushToCloud() {
  const sb = getSupabase();
  const user = getUser();
  if (!sb || !user) return;
  syncing = true;
  notifyUi();
  try {
    const payload = {
      user_id: user.id,
      diet: store.getDiet(),
      food_log: store.getFoodLog(),
      workout: store.getWorkout(),
      sessions: store.getSessions(),
      weights: store.getWeights(),
      chat: store.getChat(),
      updated_at: new Date().toISOString(),
    };
    const { error } = await sb.from(TABLE).upsert(payload, { onConflict: 'user_id' });
    if (error) console.warn('Sync: push fallita', error);
  } finally {
    syncing = false;
    notifyUi();
  }
}

// Ogni scrittura locale (tranne le impostazioni/API key) pianifica un push cloud.
window.addEventListener('fc:store-write', scheduleSync);

// Al login: scarica i dati dell'account. Al logout: nessuna azione sui dati locali
// (restano sul dispositivo, così l'app funziona comunque senza account).
let lastUserId = null;
onAuthChange((user) => {
  const id = user?.id || null;
  if (id && id !== lastUserId) pullFromCloud();
  lastUserId = id;
});
