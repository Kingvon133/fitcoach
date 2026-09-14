// Configurazione del backend cloud (Supabase) per l'account e il salvataggio dati.
//
// Questi due valori sono PUBBLICI per progettazione: la "anon key" di Supabase è pensata
// per essere usata lato client (è protetta dalle policy di Row Level Security nel
// database, vedi supabase/schema.sql) — sicura da tenere in un repository pubblico,
// esattamente come funziona per qualsiasi app Supabase. NON è un segreto.
//
// Per attivare account e sincronizzazione cloud: crea un progetto gratuito su
// supabase.com, esegui supabase/schema.sql nel suo SQL editor, poi incolla qui
// Project URL e anon public key (Project Settings → API). Guida completa:
// docs/SUPABASE_SETUP.md
export const SUPABASE_URL = 'https://cypwqbubmfxeicujwwmb.supabase.co';
export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN5cHdxYnVibWZ4ZWljdWp3d21iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkzODc1MDMsImV4cCI6MjEwNDk2MzUwM30.cvVrf5Ubcwd4uMTObTFlyw2B0aPBpBTOhh38TZY6-uA';

export const SUPABASE_CONFIGURED = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
