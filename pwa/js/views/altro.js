import { store } from '../store.js';
import { escapeHtml, showToast, lineChart, formatDateShort } from '../ui.js';
import { icon } from '../icons.js';
import { isCloudEnabled, getUser, signUpWithEmail, signInWithEmail, signInWithGoogle, signOut, AuthError } from '../auth.js';
import { getSyncing } from '../sync.js';

let authMode = 'signin'; // 'signin' | 'signup'
let authBusy = false;

export function renderAltro(container) {
  const settings = store.getSettings();
  const weights = store.getWeights();
  const last = weights[weights.length - 1];

  container.innerHTML = `
    <h1 class="page-title">Altro</h1>

    <div class="section-title"><span class="section-icon accent-blue">${icon('user')}</span>Account</div>
    <div class="card">${accountSection()}</div>

    <div class="section-title"><span class="section-icon accent-purple">${icon('sparkles')}</span>Coach AI — API key (gratuita)</div>
    <div class="card">
      ${settings.apiKey
        ? '<div class="banner ok">✓ API key configurata: il Coach è attivo.</div>'
        : '<div class="banner warn">Il Coach ha bisogno di una API key gratuita di Google Gemini.</div>'}
      <p class="muted" style="margin-bottom:12px">
        1. Vai su <b>aistudio.google.com</b> (Safari)<br>
        2. Accedi con account Google → <b>Get API key</b> → <b>Create API key</b><br>
        3. Copia e incolla qui sotto. Resta solo su questo dispositivo.
      </p>
      <div class="field">
        <label for="api-key">API key Gemini</label>
        <input id="api-key" type="password" autocomplete="off" placeholder="AIza…" value="${escapeHtml(settings.apiKey)}">
      </div>
      <div class="field">
        <label for="model">Modello</label>
        <select id="model">
          <option value="gemini-2.5-flash" ${settings.model === 'gemini-2.5-flash' ? 'selected' : ''}>gemini-2.5-flash (consigliato)</option>
          <option value="gemini-2.5-flash-lite" ${settings.model === 'gemini-2.5-flash-lite' ? 'selected' : ''}>gemini-2.5-flash-lite (limiti più alti)</option>
        </select>
      </div>
      <button class="btn primary" id="save-settings">Salva</button>
    </div>

    <div class="section-title"><span class="section-icon accent-blue">${icon('scale')}</span>Peso corporeo</div>
    <div class="card">
      <div class="field">
        <label for="weight-input">Peso di oggi (kg)</label>
        <input id="weight-input" type="number" inputmode="decimal" step="0.1" min="20" max="400"
          placeholder="${last ? last.kg.toFixed(1) : 'es. 78.5'}">
      </div>
      <button class="btn primary" id="save-weight">Registra</button>
      ${weights.length >= 2 ? `<div class="mt16">${lineChart(weights.slice(-60).map(w => ({ label: w.date, value: w.kg })), { colorKey: 'purple' })}</div>` : ''}
    </div>

    ${weights.length > 0 ? `
    <div class="card">
      ${[...weights].reverse().slice(0, 15).map(w => `
        <div class="list-row weight-row">
          <span>${formatDateShort(w.date)}</span>
          <div style="display:flex;align-items:center;gap:10px">
            <span class="right">${w.kg.toFixed(1)} kg</span>
            <button class="icon-btn danger" data-remove-weight="${w.date}" aria-label="Elimina">${icon('close')}</button>
          </div>
        </div>`).join('')}
    </div>` : ''}

    <div class="section-title"><span class="section-icon accent-green">${icon('folder')}</span>Dati</div>
    <div class="card">
      <div class="list-row">
        <div>
          <div>Esporta dati (JSON)</div>
          <div class="sub">Dieta, diario, allenamenti, peso, chat</div>
        </div>
        <button class="btn small" id="export-data">Esporta</button>
      </div>
      <div class="list-row">
        <div>
          <div>Svuota conversazione Coach</div>
          <div class="sub">I dati di dieta e allenamento restano</div>
        </div>
        <button class="btn small danger" id="clear-chat">Svuota</button>
      </div>
    </div>

    <p class="muted center mt16">FitCoach · dati salvati solo su questo dispositivo</p>
  `;

  container.querySelector('#save-settings').addEventListener('click', () => {
    const apiKey = container.querySelector('#api-key').value.trim();
    const model = container.querySelector('#model').value;
    store.saveSettings({ apiKey, model });
    showToast(apiKey ? 'Impostazioni salvate ✓' : 'API key rimossa');
    renderAltro(container);
  });

  container.querySelector('#save-weight').addEventListener('click', () => {
    const kg = parseFloat(container.querySelector('#weight-input').value);
    if (!Number.isFinite(kg) || kg < 20 || kg > 400) {
      showToast('Inserisci un peso valido');
      return;
    }
    store.addWeight(kg);
    showToast(`Peso registrato: ${kg.toFixed(1)} kg ✓`);
    renderAltro(container);
  });

  container.querySelectorAll('[data-remove-weight]').forEach(btn => {
    btn.addEventListener('click', () => {
      store.removeWeight(btn.dataset.removeWeight);
      showToast('Misurazione eliminata');
      renderAltro(container);
    });
  });

  container.querySelector('#export-data').addEventListener('click', () => {
    const blob = new Blob([JSON.stringify(store.exportAll(), null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fitcoach-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  });

  container.querySelector('#clear-chat').addEventListener('click', () => {
    if (confirm('Svuotare la conversazione con il Coach?')) {
      store.clearChat();
      showToast('Conversazione svuotata');
    }
  });

  bindAccount(container);
}

function accountSection() {
  if (!isCloudEnabled()) {
    return `
      <div class="banner warn">Il salvataggio su account non è ancora attivo su questa installazione.</div>
      <p class="muted">I tuoi dati restano comunque salvati su questo dispositivo, come sempre.</p>
    `;
  }

  const user = getUser();
  if (user) {
    const syncing = getSyncing();
    return `
      <div class="list-row" style="border-bottom:none;padding-bottom:0">
        <div>
          <div>${escapeHtml(user.email || 'Account')}</div>
          <div class="sub"><span class="inline-icon ${syncing ? 'accent-blue' : 'accent-green'}">${icon('cloud')}</span>${syncing ? 'Sincronizzazione…' : 'Sincronizzato'}</div>
        </div>
        <button class="btn small danger" id="sign-out">Esci</button>
      </div>
    `;
  }

  return `
    <p class="muted" style="margin-bottom:12px">Crea un account per salvare dieta, allenamenti e progressi nel cloud e ritrovarli su qualsiasi dispositivo.</p>
    <div class="auth-tabs">
      <button class="auth-tab ${authMode === 'signin' ? 'active' : ''}" data-auth-mode="signin">Accedi</button>
      <button class="auth-tab ${authMode === 'signup' ? 'active' : ''}" data-auth-mode="signup">Crea account</button>
    </div>
    <div class="field">
      <label for="auth-email">Email</label>
      <input id="auth-email" type="email" autocomplete="email" placeholder="tuemail@esempio.com">
    </div>
    <div class="field">
      <label for="auth-password">Password</label>
      <input id="auth-password" type="password" autocomplete="${authMode === 'signup' ? 'new-password' : 'current-password'}" placeholder="Almeno 6 caratteri">
    </div>
    <button class="btn primary" id="auth-submit" style="width:100%" ${authBusy ? 'disabled' : ''}>
      ${authBusy ? 'Un attimo…' : authMode === 'signup' ? 'Crea account' : 'Accedi'}
    </button>
    <div class="auth-divider"><span>oppure</span></div>
    <button class="btn" id="auth-google" style="width:100%" ${authBusy ? 'disabled' : ''}>Continua con Google</button>
  `;
}

function bindAccount(container) {
  const signOutBtn = container.querySelector('#sign-out');
  if (signOutBtn) {
    signOutBtn.addEventListener('click', async () => {
      await signOut();
      showToast('Disconnesso');
      renderAltro(container);
    });
  }

  container.querySelectorAll('[data-auth-mode]').forEach(btn => {
    btn.addEventListener('click', () => {
      authMode = btn.dataset.authMode;
      renderAltro(container);
    });
  });

  const submitBtn = container.querySelector('#auth-submit');
  if (submitBtn) {
    submitBtn.addEventListener('click', async () => {
      const email = container.querySelector('#auth-email').value.trim();
      const password = container.querySelector('#auth-password').value;
      if (!email || password.length < 6) {
        showToast('Inserisci email e una password di almeno 6 caratteri');
        return;
      }
      authBusy = true;
      renderAltro(container);
      try {
        if (authMode === 'signup') {
          const { session } = await signUpWithEmail(email, password);
          showToast(session ? 'Account creato ✓' : 'Controlla la tua email per confermare l\'account');
        } else {
          await signInWithEmail(email, password);
          showToast('Accesso effettuato ✓');
        }
      } catch (error) {
        showToast(error instanceof AuthError ? error.message : 'Errore imprevisto. Riprova.');
      } finally {
        authBusy = false;
        renderAltro(container);
      }
    });
  }

  const googleBtn = container.querySelector('#auth-google');
  if (googleBtn) {
    googleBtn.addEventListener('click', async () => {
      try {
        await signInWithGoogle(); // reindirizza fuori dall'app, poi torna autenticato
      } catch (error) {
        showToast(error instanceof AuthError ? error.message : 'Errore imprevisto. Riprova.');
      }
    });
  }
}
