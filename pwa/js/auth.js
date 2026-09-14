// Autenticazione account (email/password + Google) via Supabase Auth.
import { getSupabase } from './supabaseClient.js';

let currentUser = null;
let ready = false;
const listeners = new Set();

function notify() {
  listeners.forEach(fn => fn(currentUser));
}

/** Registra un callback chiamato ad ogni cambio di stato login (utente o null). */
export function onAuthChange(fn) {
  listeners.add(fn);
  if (ready) fn(currentUser);
  return () => listeners.delete(fn);
}

export function getUser() {
  return currentUser;
}

export function isCloudEnabled() {
  return Boolean(getSupabase());
}

/** Da chiamare una volta all'avvio dell'app. */
export async function initAuth() {
  const sb = getSupabase();
  if (!sb) { ready = true; return; }
  const { data } = await sb.auth.getSession();
  currentUser = data?.session?.user || null;
  ready = true;
  notify();
  sb.auth.onAuthStateChange((_event, session) => {
    currentUser = session?.user || null;
    notify();
  });
}

export class AuthError extends Error {}

function friendlyError(error) {
  const msg = error?.message || '';
  if (msg.includes('Invalid login credentials')) return 'Email o password non corrette.';
  if (msg.includes('User already registered')) return 'Esiste già un account con questa email.';
  if (msg.includes('Password should be at least')) return 'La password deve avere almeno 6 caratteri.';
  if (msg.includes('Unable to validate email')) return 'Email non valida.';
  return msg || 'Errore imprevisto. Riprova.';
}

export async function signUpWithEmail(email, password) {
  const sb = getSupabase();
  if (!sb) throw new AuthError('Cloud non configurato.');
  const { data, error } = await sb.auth.signUp({ email, password });
  if (error) throw new AuthError(friendlyError(error));
  return data;
}

export async function signInWithEmail(email, password) {
  const sb = getSupabase();
  if (!sb) throw new AuthError('Cloud non configurato.');
  const { data, error } = await sb.auth.signInWithPassword({ email, password });
  if (error) throw new AuthError(friendlyError(error));
  return data;
}

export async function signInWithGoogle() {
  const sb = getSupabase();
  if (!sb) throw new AuthError('Cloud non configurato.');
  const { error } = await sb.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: window.location.origin + window.location.pathname },
  });
  if (error) throw new AuthError(friendlyError(error));
}

export async function signOut() {
  const sb = getSupabase();
  if (!sb) return;
  await sb.auth.signOut();
}
