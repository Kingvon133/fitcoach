// Wrapper minimale sul client Supabase (caricato via CDN in index.html come window.supabase).
import { SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_CONFIGURED } from './config.js';

let client = null;

/** Ritorna il client Supabase, o null se il cloud non è configurato (vedi config.js). */
export function getSupabase() {
  if (!SUPABASE_CONFIGURED) return null;
  if (!client) {
    if (!window.supabase?.createClient) return null; // script CDN non ancora caricato
    client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: true, autoRefreshToken: true },
    });
  }
  return client;
}
