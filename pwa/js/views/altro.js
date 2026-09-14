import { store } from '../store.js';
import { escapeHtml, showToast, lineChart, formatDateShort } from '../ui.js';

export function renderAltro(container) {
  const settings = store.getSettings();
  const weights = store.getWeights();
  const last = weights[weights.length - 1];

  container.innerHTML = `
    <h1 class="page-title">Altro</h1>

    <div class="section-title">Coach AI — API key (gratuita)</div>
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

    <div class="section-title">Peso corporeo</div>
    <div class="card">
      <div class="field">
        <label for="weight-input">Peso di oggi (kg)</label>
        <input id="weight-input" type="number" inputmode="decimal" step="0.1" min="20" max="400"
          placeholder="${last ? last.kg.toFixed(1) : 'es. 78.5'}">
      </div>
      <button class="btn primary" id="save-weight">Registra</button>
      ${weights.length >= 2 ? `<div class="mt16">${lineChart(weights.slice(-60).map(w => ({ label: w.date, value: w.kg })))}</div>` : ''}
    </div>

    ${weights.length > 0 ? `
    <div class="card">
      ${[...weights].reverse().slice(0, 15).map(w => `
        <div class="list-row weight-row">
          <span>${formatDateShort(w.date)}</span>
          <div style="display:flex;align-items:center;gap:10px">
            <span class="right">${w.kg.toFixed(1)} kg</span>
            <button class="weight-remove" data-remove-weight="${w.date}" aria-label="Elimina">✕</button>
          </div>
        </div>`).join('')}
    </div>` : ''}

    <div class="section-title">Dati</div>
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
}
