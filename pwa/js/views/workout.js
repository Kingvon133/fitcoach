import { store } from '../store.js';
import { escapeHtml, showToast, lineChart, formatDateShort } from '../ui.js';

let activeDayIndex = 0;
let openExercise = null; // nome esercizio con logger aperto

export function renderWorkout(container) {
  const plan = store.getWorkout();
  if (!plan?.days?.length) {
    container.innerHTML = '<h1 class="page-title">Workout</h1><p class="muted">Nessuna scheda configurata.</p>';
    return;
  }
  if (activeDayIndex >= plan.days.length) activeDayIndex = 0;
  const day = plan.days[activeDayIndex];

  container.innerHTML = `
    <h1 class="page-title">Workout</h1>
    <div class="day-pills">
      ${plan.days.map((d, i) => `
        <button class="pill ${i === activeDayIndex ? 'active' : ''}" data-day="${i}">${escapeHtml(d.name)}</button>
      `).join('')}
    </div>
    <div id="exercise-list">
      ${day.exercises.map(e => exerciseCard(e, day.name)).join('')}
    </div>
  `;

  container.querySelectorAll('.pill').forEach(pill => {
    pill.addEventListener('click', () => {
      activeDayIndex = Number(pill.dataset.day);
      openExercise = null;
      renderWorkout(container);
    });
  });

  container.querySelectorAll('[data-toggle-exercise]').forEach(btn => {
    btn.addEventListener('click', () => {
      const name = btn.dataset.toggleExercise;
      openExercise = openExercise === name ? null : name;
      renderWorkout(container);
    });
  });

  bindLogger(container, day.name);
}

function exerciseCard(exercise, dayName) {
  const history = store.getExerciseHistory(exercise.name, 12);
  const last = history[history.length - 1];
  const isOpen = openExercise === exercise.name;

  return `
  <div class="card">
    <div class="card-header" style="margin-bottom:${isOpen ? '12px' : '0'}">
      <div>
        <div>${escapeHtml(exercise.name)}</div>
        <div class="sub muted">${escapeHtml(exercise.muscle || '')} · ${exercise.sets} × ${escapeHtml(String(exercise.reps))} · rec ${exercise.rest || 90}s</div>
      </div>
      <button class="btn small ${isOpen ? '' : 'primary'}" data-toggle-exercise="${escapeHtml(exercise.name)}">
        ${isOpen ? 'Chiudi' : 'Registra'}
      </button>
    </div>

    ${isOpen ? `
      ${last ? `<p class="muted">Ultima volta (${formatDateShort(last.date)}): ${last.sets.map(s => `${s.kg}×${s.reps}`).join(' · ')}</p>` : ''}
      <div class="set-grid" data-logger="${escapeHtml(exercise.name)}">
        ${Array.from({ length: exercise.sets }, (_, i) => setRow(i, last?.sets[i])).join('')}
      </div>
      <div class="mt8" style="display:flex;gap:8px">
        <button class="btn small" data-add-set="${escapeHtml(exercise.name)}">+ Serie</button>
        <button class="btn small primary" data-save-log="${escapeHtml(exercise.name)}">Salva</button>
      </div>

      ${history.length >= 2 ? `
        <div class="mt16">
          <div class="muted" style="margin-bottom:6px">Progressione carico massimo (kg)</div>
          ${lineChart(history.map(h => ({ label: h.date, value: h.top })), { height: 90, color: 'var(--blue)' })}
        </div>` : ''}
    ` : ''}
  </div>`;
}

function setRow(index, previousSet) {
  return `<div class="set-row">
    <span class="set-n">${index + 1}</span>
    <input type="number" inputmode="decimal" step="0.5" min="0" placeholder="kg" value="${previousSet ? previousSet.kg : ''}" data-kg>
    <input type="number" inputmode="numeric" step="1" min="0" placeholder="reps" value="${previousSet ? previousSet.reps : ''}" data-reps>
  </div>`;
}

function bindLogger(container, dayName) {
  container.querySelectorAll('[data-add-set]').forEach(btn => {
    btn.addEventListener('click', () => {
      const grid = container.querySelector(`[data-logger="${CSS.escape(btn.dataset.addSet)}"]`);
      const count = grid.querySelectorAll('.set-row').length;
      grid.insertAdjacentHTML('beforeend', setRow(count));
    });
  });

  container.querySelectorAll('[data-save-log]').forEach(btn => {
    btn.addEventListener('click', () => {
      const name = btn.dataset.saveLog;
      const grid = container.querySelector(`[data-logger="${CSS.escape(name)}"]`);
      const sets = [...grid.querySelectorAll('.set-row')]
        .map(row => ({
          kg: parseFloat(row.querySelector('[data-kg]').value),
          reps: parseInt(row.querySelector('[data-reps]').value, 10),
        }))
        .filter(s => Number.isFinite(s.kg) && Number.isFinite(s.reps) && s.reps > 0);

      if (sets.length === 0) {
        showToast('Inserisci almeno una serie valida');
        return;
      }
      store.addExerciseLog(dayName, name, sets);
      openExercise = null;
      showToast(`${name}: ${sets.length} serie salvate ✓`);
      renderWorkout(container);
    });
  });
}
