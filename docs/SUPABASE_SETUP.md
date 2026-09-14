# Attivare account e salvataggio cloud (Supabase)

Senza questo passaggio l'app funziona esattamente come prima (tutto in locale, nessun
account). Con Supabase configurato, chiunque può creare un account (email/password o
Google) e ritrovare i propri dati su qualsiasi dispositivo. Gratis fino a scale enormi
per un'app come questa (tier free: 50.000 utenti attivi/mese, 500MB di database).

Tempo richiesto: ~5 minuti per email/password, +10 minuti se vuoi anche Google.

## 1. Crea il progetto Supabase

1. Vai su [supabase.com](https://supabase.com) → **Start your project** → accedi con GitHub o email
2. **New project**: scegli un nome (es. `fitcoach`), una password del database (salvala, non serve per l'app ma per l'accesso admin), e una regione vicina (es. `Europe West`)
3. Attendi ~2 minuti che il progetto sia pronto

## 2. Crea la tabella dati

1. Nel progetto, vai su **SQL Editor** (icona nella sidebar) → **New query**
2. Copia e incolla tutto il contenuto di [`supabase/schema.sql`](../supabase/schema.sql) di questo repo
3. **Run**

Questo crea la tabella `app_data` con la sicurezza (Row Level Security) già attiva:
ogni utente vede solo i propri dati.

## 3. Copia le chiavi nel codice

1. Vai su **Project Settings** (icona ingranaggio) → **API**
2. Copia **Project URL** e la chiave **anon public** (NON la `service_role`, quella non va mai usata lato client)
3. Apri [`pwa/js/config.js`](../pwa/js/config.js) in questo repo e incolla i due valori:

```js
export const SUPABASE_URL = 'https://xxxxxxxx.supabase.co';
export const SUPABASE_ANON_KEY = 'eyJhbGciOi...'; // la "anon public" key
```

Questi due valori sono pubblici per progettazione (protetti dalle policy del database),
sicuri da committare anche in un repository pubblico.

## 4. (Opzionale) Attiva il login con Google

1. Su Google: vai su [console.cloud.google.com](https://console.cloud.google.com) → crea un progetto (o usane uno esistente) → **APIs & Services → Credentials → Create Credentials → OAuth client ID** → tipo **Web application**
2. In **Authorized redirect URIs** incolla l'URL di callback che Supabase ti mostra al passo successivo (di solito `https://xxxxxxxx.supabase.co/auth/v1/callback`)
3. Copia **Client ID** e **Client secret**
4. Su Supabase: **Authentication → Providers → Google** → attiva → incolla Client ID e Client secret → **Save**
5. Sempre su Supabase, in **Authentication → URL Configuration**, aggiungi l'URL del sito (es. `https://tuonome.github.io/fitcoach/`) tra i **Redirect URLs**

Senza questo passaggio, il pulsante "Continua con Google" nell'app darà un errore — email/password funziona comunque.

## 5. Deploy

Fai commit e push delle modifiche a `pwa/js/config.js` (il resto del codice è già pronto):

```bash
git add pwa/js/config.js
git commit -m "chore: configura Supabase"
git push
```

GitHub Actions ripubblica il sito automaticamente. Da quel momento la sezione **Account**
nella tab **Altro** mostra login/registrazione invece dell'avviso "non ancora attivo".

## Come funziona per l'utente

- Senza account: tutto locale come prima (localStorage), zero differenze
- Con account: i dati restano comunque locali (per velocità/offline) ma vengono anche
  salvati nel cloud automaticamente ad ogni modifica, e scaricati al login su un nuovo
  dispositivo
- La API key Gemini **non viene mai sincronizzata**: resta solo sul dispositivo per
  scelta di sicurezza e per non far ricadere i costi AI su un solo account condiviso —
  ogni persona usa la propria chiave gratuita
