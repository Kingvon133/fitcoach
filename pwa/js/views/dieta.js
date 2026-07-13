import { store } from '../store.js';
import { escapeHtml, showToast } from '../ui.js';

export function renderDieta(container) {
  const diet = store.getDiet();
  if (!diet) {
    container.innerHTML = '<h1 class="page-title">Dieta</h1><p class="muted">Nessuna dieta configurata.</p>';
    return;
  }

  const todayLog = store.getTodayFoodLog();
  const isLogged = (mealName, foodName) =>
    todayLog.some(e => e.mealName === mealName && e.foodName === foodName);

  container.innerHTML = `
    <h1 class="page-title">Dieta</h1>
    <p class="muted" style="margin:-8px 2px 12px">
      Tocca <b>+</b> per registrare un alimento come mangiato oggi.
      Per sostituzioni o pasti fuori dieta chiedi al <b>Coach</b>.
    </p>
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
}
