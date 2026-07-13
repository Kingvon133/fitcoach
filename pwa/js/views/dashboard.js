import { store } from '../store.js';
import { escapeHtml, progressRing, lineChart, formatDateShort } from '../ui.js';

export function renderDashboard(container) {
  const diet = store.getDiet();
  const targets = diet?.targets || { kcal: 0, protein: 0, carbs: 0, fat: 0 };
  const entries = store.getTodayFoodLog();
  const sum = (key) => entries.reduce((acc, e) => acc + (e[key] || 0), 0);
  const kcal = sum('kcal'), protein = sum('protein'), carbs = sum('carbs'), fat = sum('fat');
  const progress = targets.kcal > 0 ? kcal / targets.kcal : 0;
  const over = kcal > targets.kcal && targets.kcal > 0;

  const workout = store.getWorkout();
  const todayDay = pickTodayWorkout(workout);
  const weights = store.getWeights().slice(-30);

  container.innerHTML = `
    <h1 class="page-title">Oggi</h1>

    <div class="card">
      <div class="kcal-row">
        <div class="ring-wrap">
          ${progressRing(progress, { color: over ? 'var(--orange)' : 'var(--green)' })}
          <div class="ring-center">
            <span class="ring-value">${Math.round(kcal)}</span>
            <span class="ring-unit">kcal</span>
          </div>
        </div>
        <div class="kcal-info">
          <span>🎯 Obiettivo <b>${targets.kcal}</b></span>
          <span>🍴 Rimanenti <b>${Math.max(targets.kcal - Math.round(kcal), 0)}</b></span>
          ${over ? `<span style="color:var(--orange)">⚠️ +${Math.round(kcal - targets.kcal)} oltre</span>` : ''}
        </div>
      </div>
    </div>

    <div class="macro-row">
      ${macroCell('Proteine', protein, targets.protein, 'var(--blue)')}
      ${macroCell('Carboidrati', carbs, targets.carbs, 'var(--orange)')}
      ${macroCell('Grassi', fat, targets.fat, 'var(--purple)')}
    </div>

    ${todayDay ? `
      <div class="card mt16">
        <div class="card-header">
          <span>🏋 Allenamento di oggi</span>
          <span class="hint">${escapeHtml(todayDay.name)}</span>
        </div>
        ${todayDay.exercises.slice(0, 4).map(e => `
          <div class="list-row">
            <span>${escapeHtml(e.name)}</span>
            <span class="right">${e.sets} × ${escapeHtml(String(e.reps))}</span>
          </div>`).join('')}
        ${todayDay.exercises.length > 4 ? `<p class="muted mt8">+ ${todayDay.exercises.length - 4 === 1 ? '1 altro esercizio' : `altri ${todayDay.exercises.length - 4} esercizi`}</p>` : ''}
      </div>` : ''}

    ${weights.length >= 2 ? `
      <div class="card">
        <div class="card-header">
          <span>⚖️ Peso</span>
          <span class="hint">${weights[weights.length - 1].kg.toFixed(1)} kg · ${formatDateShort(weights[weights.length - 1].date)}</span>
        </div>
        ${lineChart(weights.map(w => ({ label: w.date, value: w.kg })))}
      </div>` : `
      <div class="card">
        <p class="muted">Registra il peso nella tab <b>Altro</b> (o dillo al Coach) per vedere il grafico.</p>
      </div>`}
  `;
}

function macroCell(name, value, target, color) {
  const progress = target > 0 ? Math.min(value / target, 1) : 0;
  return `<div class="macro-cell">
    <div class="macro-name">${name}</div>
    <div class="macro-val">${Math.round(value)}g</div>
    <div class="macro-target">/ ${target}g</div>
    <div class="macro-bar"><div style="width:${(progress * 100).toFixed(0)}%;background:${color}"></div></div>
  </div>`;
}

function pickTodayWorkout(workout) {
  const days = workout?.days;
  if (!days?.length) return null;
  const weekday = new Date().getDay(); // 0 = domenica
  const index = ((weekday - 1) % days.length + days.length) % days.length; // lunedì = giorno 0
  return days[index];
}
