import { store } from '../store.js';
import { escapeHtml, showToast } from '../ui.js';

let addFoodOpen = false;

export function renderDieta(container) {
  const diet = store.getDiet();
  if (!diet) {
    container.innerHTML = '<h1 class="page-title">Dieta</h1><p class="muted">Nessuna dieta configurata.</p>';
    return;
  }

  const todayLog = store.getTodayFoodLog();
  const isLogged = (mealName, foodName) =>
    todayLog.some(e => e.mealName === mealName && e.foodName === foodName);

  const mealNames = diet.meals.map(m => m.name);

  container.innerHTML = `
    <h1 class="page-title">Dieta</h1>
    <p class="muted" style="margin:-8px 2px 12px">
      Tocca <b>+</b> per registrare un alimento come mangiato oggi.
      Per sostituzioni chiedi al <b>Coach</b>.
    </p>

    <div class="section-title">Diario di oggi</div>
    <div class="card">
      ${todayLog.length === 0
        ? '<p class="muted">Nessun alimento registrato oggi.</p>'
        : todayLog.map(entry => `
          <div class="list-row diary-row">
            <div>
              <div>${escapeHtml(entry.foodName)}</div>
              <div class="sub">${escapeHtml(entry.mealName)} · ${Math.round(entry.grams)}g · ${Math.round(entry.kcal)} kcal</div>
            </div>
            <button class="diary-remove" data-remove-log="${entry.ts}" aria-label="Rimuovi">✕</button>
          </div>`).join('')}
      ${addFoodOpen ? addFoodForm(mealNames) : `<button class="btn small mt8" id="toggle-add-food">+ Alimento libero</button>`}
    </div>

    ${diet.meals.map(meal => `
      <div class="section-title">${escapeHtml(meal.name)}</div>
      <div class="card">
        ${meal.foods.map(food => {
          const done = isLogged(meal.name, food.name);
          return `
          <div class="list-row food-row">
            <div>
              <div>${escapeHtml(food.name)}</div>
              <div class="sub">${Math.round(food.grams)}g · ${Math.round(food.kcal)} kcal · P ${Math.round(food.protein)} · C ${Math.round(food.carbs)} · G ${Math.round(food.fat)}</div>
            </div>
            <button class="food-log-btn ${done ? 'done' : ''}"
              data-meal="${escapeHtml(meal.name)}" data-food="${escapeHtml(food.name)}"
              aria-label="${done ? 'Già registrato' : 'Registra'}">${done ? '✓' : '+'}</button>
          </div>`;
        }).join('')}
      </div>
    `).join('')}
  `;

  container.querySelectorAll('.food-log-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const mealName = btn.dataset.meal;
      const foodName = btn.dataset.food;
      const meal = diet.meals.find(m => m.name === mealName);
      const food = meal?.foods.find(f => f.name === foodName);
      if (!food) return;

      if (btn.classList.contains('done')) {
        // Rimuove il log di oggi per questo alimento
        const entry = store.getTodayFoodLog().find(e => e.mealName === mealName && e.foodName === foodName);
        if (entry) store.removeFoodLog(entry.ts);
        showToast(`${food.name} rimosso dal diario`);
      } else {
        store.addFoodLog({
          mealName, foodName: food.name, grams: food.grams,
          kcal: food.kcal, protein: food.protein, carbs: food.carbs, fat: food.fat,
        });
        showToast(`${food.name} registrato ✓`);
      }
      renderDieta(container);
    });
  });

  container.querySelectorAll('[data-remove-log]').forEach(btn => {
    btn.addEventListener('click', () => {
      store.removeFoodLog(Number(btn.dataset.removeLog));
      showToast('Rimosso dal diario');
      renderDieta(container);
    });
  });

  const toggleBtn = container.querySelector('#toggle-add-food');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      addFoodOpen = true;
      renderDieta(container);
    });
  }

  const cancelBtn = container.querySelector('#cancel-add-food');
  if (cancelBtn) {
    cancelBtn.addEventListener('click', () => {
      addFoodOpen = false;
      renderDieta(container);
    });
  }

  const submitBtn = container.querySelector('#submit-add-food');
  if (submitBtn) {
    submitBtn.addEventListener('click', () => {
      const val = (id) => container.querySelector(id)?.value ?? '';
      const mealName = val('#af-meal');
      const foodName = val('#af-name').trim();
      const grams = parseFloat(val('#af-grams'));
      const kcal = parseFloat(val('#af-kcal'));
      const protein = parseFloat(val('#af-protein')) || 0;
      const carbs = parseFloat(val('#af-carbs')) || 0;
      const fat = parseFloat(val('#af-fat')) || 0;

      if (!foodName || !Number.isFinite(grams) || grams <= 0 || !Number.isFinite(kcal) || kcal < 0) {
        showToast('Compila nome, grammi e calorie');
        return;
      }
      store.addFoodLog({ mealName, foodName, grams, kcal, protein, carbs, fat });
      addFoodOpen = false;
      showToast(`${foodName} registrato ✓`);
      renderDieta(container);
    });
  }
}

function addFoodForm(mealNames) {
  return `
    <div class="add-food-form mt8">
      <div class="field">
        <label for="af-meal">Pasto</label>
        <select id="af-meal">
          ${mealNames.map(m => `<option value="${escapeHtml(m)}">${escapeHtml(m)}</option>`).join('')}
          <option value="Fuori pasto">Fuori pasto</option>
        </select>
      </div>
      <div class="field">
        <label for="af-name">Alimento</label>
        <input id="af-name" type="text" placeholder="es. Barretta proteica">
      </div>
      <div class="af-grid">
        <div class="field"><label for="af-grams">Grammi</label><input id="af-grams" type="number" inputmode="decimal" min="0" step="1"></div>
        <div class="field"><label for="af-kcal">Kcal</label><input id="af-kcal" type="number" inputmode="decimal" min="0" step="1"></div>
      </div>
      <div class="af-grid af-grid-3">
        <div class="field"><label for="af-protein">Proteine (g)</label><input id="af-protein" type="number" inputmode="decimal" min="0" step="1"></div>
        <div class="field"><label for="af-carbs">Carbo (g)</label><input id="af-carbs" type="number" inputmode="decimal" min="0" step="1"></div>
        <div class="field"><label for="af-fat">Grassi (g)</label><input id="af-fat" type="number" inputmode="decimal" min="0" step="1"></div>
      </div>
      <div style="display:flex;gap:8px">
        <button class="btn small" id="cancel-add-food">Annulla</button>
        <button class="btn small primary" id="submit-add-food">Aggiungi</button>
      </div>
    </div>
  `;
}
