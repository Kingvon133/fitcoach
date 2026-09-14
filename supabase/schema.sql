-- FitCoach — schema del database Supabase per account e sincronizzazione dati.
-- Esegui questo file una volta nel SQL Editor del tuo progetto Supabase
-- (supabase.com → il tuo progetto → SQL Editor → New query → incolla → Run).
--
-- Una riga per utente, con i dati salvati come JSON (stesso formato di localStorage
-- nell'app). La Row Level Security garantisce che ogni utente veda e modifichi
-- SOLO i propri dati: nessun altro, nemmeno con la anon key pubblica, può leggerli.

create table if not exists public.app_data (
  user_id     uuid primary key references auth.users(id) on delete cascade,
  diet        jsonb,
  food_log    jsonb default '[]'::jsonb,
  workout     jsonb,
  sessions    jsonb default '[]'::jsonb,
  weights     jsonb default '[]'::jsonb,
  chat        jsonb default '[]'::jsonb,
  updated_at  timestamptz default now()
);

alter table public.app_data enable row level security;

drop policy if exists "select own data" on public.app_data;
create policy "select own data"
  on public.app_data for select
  using (auth.uid() = user_id);

drop policy if exists "insert own data" on public.app_data;
create policy "insert own data"
  on public.app_data for insert
  with check (auth.uid() = user_id);

drop policy if exists "update own data" on public.app_data;
create policy "update own data"
  on public.app_data for update
  using (auth.uid() = user_id);

drop policy if exists "delete own data" on public.app_data;
create policy "delete own data"
  on public.app_data for delete
  using (auth.uid() = user_id);
