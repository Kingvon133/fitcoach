import { store } from '../store.js';
import { escapeHtml, showToast } from '../ui.js';
import { estimateMealFromPhoto, GeminiError } from '../gemini.js';
import { icon } from '../icons.js';

let addFoodOpen = false;
let addFoodPrefill = null; // valori precompilati dalla foto AI
let photoBusy = false;
let activeDayIndex = todayDayIndex();

function todayDayIndex() {
  // 0 = Lunedì … 6 = Domenica (coerente con workout)
  const weekday = new Date().getDay();
  return (weekday + 6) % 7;
}

export function renderDieta(container) {
  const diet = store.getDiet();
  if (!diet) {
    container.innerHTML = '<h1 class="page-title">Dieta</h1><p class="muted">Nessuna dieta configurata.</p>';
    return;
  }

  if (activeDayIndex >= diet.days.length) activeDayIndex = 0;
  const activeDay = diet.days[activeDayIndex];

  const todayLog = store.getTodayFoodLog();
  const isLogged = (mealName, foodName) =>
    todayLog.some(e => e.mealName === mealName && e.foodName === foodName);

  const allMeals = [...diet.fixedMeals, ...activeDay.meals];
  const mealNames = [...new Set([...diet.fixedMeals.map(m => m.name), 'Pranzo', 'Cena'])];
  const hasKey = Boolean(store.getSettings().apiKey);

  container.innerHTML = `
    <h1 class="page-title">Dieta</h1>
    <p class="muted" style="margin:-8px 2px 12px">
      Tocca <b>+</b> per registrare un alimento come mangiato oggi.
      Per sostituzioni chiedi al <b>Coach</b>.
    </p>

    ${(diet.restrictions?.length || diet.notes?.length) ? `
      <div class="diet-notes">
        ${diet.restrictions?.length ? `<div class="diet-restrictions">${diet.restrictions.map(r => `<span class="chip-warn">${escapeHtml(r)}</span>`).join('')}</div>` : ''}
        ${diet.notes?.length ? `<ul class="diet-note-list">${diet.notes.map(n => `<li>${escapeHtml(n)}</li>`).join('')}</ul>` : ''}
      </div>` : ''}

    <button class="photo-cta" id="photo-cta" ${photoBusy ? 'disabled' : ''}>
      <span class="photo-cta-icon">${photoBusy ? '<span class="spinner light"></span>' : icon('camera')}</span>
      <span class="photo-cta-text">
        <span class="photo-cta-title">${photoBusy ? 'Sto analizzando la foto…' : 'Fotografa il piatto'}</span>
        <span class="photo-cta-sub">${photoBusy ? 'Qualche secondo, ricevo la stima dall’AI' : 'Stima calorie e macro automaticamente'}</span>
      </span>
    </button>
    <input type="file" accept="image/*" capture="environment" id="photo-input" hidden>

    <div class="section-title"><span class="section-icon accent-green">${icon('check')}</span>Diario di oggi</div>
    <div class="card">
      ${todayLog.length === 0
        ? '<p class="muted">Nessun alimento registrato oggi.</p>'
        : todayLog.map(entry => `
          <div class="list-row diary-row">
            <div>
              <div>${escapeHtml(entry.foodName)}</div>
              <div class="sub">${escapeHtml(entry.mealName)} · ${Math.round(entry.grams)}g · ${Math.round(entry.kcal)} kcal</div>
            </div>
            <button class="icon-btn danger" data-remove-log="${entry.ts}" aria-label="Rimuovi">${icon('close')}</button>
          </div>`).join('')}
      ${addFoodOpen ? addFoodForm(mealNames, addFoodPrefill) : `<button class="btn small mt8" id="toggle-add-food">+ Alimento libero</button>`}
    </div>

    ${diet.fixedMeals.map(meal => mealCard(meal, isLogged)).join('')}

    <div class="section-title" style="margin-top:26px">Pranzo &amp; cena della settimana</div>
    <div class="day-pills">
      ${diet.days.map((d, i) => `<button class="pill ${i === activeDayIndex ? 'active' : ''}" data-day="${i}">${escapeHtml(d.name)}</button>`).join('')}
    </div>
    <div id="day-meals">
      ${activeDay.meals.map(meal => mealCard(meal, isLogged)).join('')}
    </div>
  `;

  container.querySelectorAll('.pill').forEach(pill => {
    pill.addEventListener('click', () => {
      activeDayIndex = Number(pill.dataset.day);
      renderDieta(container);
    });
  });

  container.querySelectorAll('.food-log-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const mealName = btn.dataset.meal;
      const foodName = btn.dataset.food;
      const meal = allMeals.find(m => m.name === mealName && m.foods.some(f => f.name === foodName));
      const food = meal?.foods.find(f => f.name === foodName);
      if (!food) return;

      if (btn.classList.contains('done')) {
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
      addFoodPrefill = null;
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
      addFoodPrefill = null;
      showToast(`${foodName} registrato ✓`);
      renderDieta(container);
    });
  }

  const photoInput = container.querySelector('#photo-input');
  const photoCta = container.querySelector('#photo-cta');
  if (photoCta && photoInput) {
    photoCta.addEventListener('click', () => {
      if (!hasKey) {
        showToast('Configura prima la API key nella tab Altro');
        return;
      }
      photoInput.value = '';
      photoInput.click();
    });
    photoInput.addEventListener('change', async () => {
      const file = photoInput.files?.[0];
      if (!file) return;
      photoBusy = true;
      renderDieta(container);
      try {
        const { data, mimeType } = await resizeImageToBase64(file);
        const result = await estimateMealFromPhoto(data, mimeType);
        if (!result.items || result.items.length === 0) {
          showToast('Nessun alimento riconosciuto. Riprova o aggiungi a mano.');
          addFoodOpen = true;
          addFoodPrefill = null;
        } else {
          addFoodPrefill = combineItems(result.items, guessMealName());
          addFoodOpen = true;
          if (result.note) showToast(result.note);
        }
      } catch (error) {
        const message = error instanceof GeminiError ? error.message : 'Analisi foto non riuscita. Riprova.';
        showToast(message);
      } finally {
        photoBusy = false;
        renderDieta(container);
      }
    });
  }
}

function mealCard(meal, isLogged) {
  return `
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
            aria-label="${done ? 'Già registrato' : 'Registra'}">${done ? icon('check') : icon('plus')}</button>
        </div>`;
      }).join('')}
    </div>
  `;
}

function combineItems(items, mealName) {
  const sum = (key) => Math.round(items.reduce((acc, it) => acc + (Number(it[key]) || 0), 0));
  const names = items.map(it => it.name).filter(Boolean);
  const label = names.length > 2 ? `${names.slice(0, 2).join(', ')} +${names.length - 2}` : names.join(', ');
  return {
    mealName,
    foodName: label || 'Piatto fotografato',
    grams: sum('grams'),
    kcal: sum('kcal'),
    protein: sum('protein'),
    carbs: sum('carbs'),
    fat: sum('fat'),
  };
}

function guessMealName() {
  const hour = new Date().getHours();
  if (hour < 11) return 'Colazione';
  if (hour < 15) return 'Pranzo';
  if (hour < 18) return 'Spuntino pomeriggio';
  return 'Cena';
}

/** Ridimensiona l'immagine lato client (max 1024px, JPEG) prima di inviarla all'AI. */
function resizeImageToBase64(file, maxDim = 1024, quality = 0.82) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      let { width, height } = img;
      if (width > height && width > maxDim) { height = Math.round((height * maxDim) / width); width = maxDim; }
      else if (height > maxDim) { width = Math.round((width * maxDim) / height); height = maxDim; }
      const canvas = document.createElement('canvas');
      canvas.width = width; canvas.height = height;
      canvas.getContext('2d').drawImage(img, 0, 0, width, height);
      URL.revokeObjectURL(url);
      const dataUrl = canvas.toDataURL('image/jpeg', quality);
      resolve({ data: dataUrl.split(',')[1], mimeType: 'image/jpeg' });
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Immagine non valida')); };
    img.src = url;
  });
}

function addFoodForm(mealNames, prefill) {
  const v = prefill || {};
  return `
    <div class="add-food-form mt8">
      ${prefill ? `<div class="banner ok" style="margin-top:0">✨ Stima dalla foto — controlla e correggi se serve</div>` : ''}
      <div class="field">
        <label for="af-meal">Pasto</label>
        <select id="af-meal">
          ${mealNames.map(m => `<option value="${escapeHtml(m)}" ${v.mealName === m ? 'selected' : ''}>${escapeHtml(m)}</option>`).join('')}
          <option value="Fuori pasto" ${v.mealName === 'Fuori pasto' ? 'selected' : ''}>Fuori pasto</option>
        </select>
      </div>
      <div class="field">
        <label for="af-name">Alimento</label>
        <input id="af-name" type="text" placeholder="es. Barretta proteica" value="${escapeHtml(v.foodName || '')}">
      </div>
      <div class="af-grid">
        <div class="field"><label for="af-grams">Grammi</label><input id="af-grams" type="number" inputmode="decimal" min="0" step="1" value="${v.grams ?? ''}"></div>
        <div class="field"><label for="af-kcal">Kcal</label><input id="af-kcal" type="number" inputmode="decimal" min="0" step="1" value="${v.kcal ?? ''}"></div>
      </div>
      <div class="af-grid af-grid-3">
        <div class="field"><label for="af-protein">Proteine (g)</label><input id="af-protein" type="number" inputmode="decimal" min="0" step="1" value="${v.protein ?? ''}"></div>
        <div class="field"><label for="af-carbs">Carbo (g)</label><input id="af-carbs" type="number" inputmode="decimal" min="0" step="1" value="${v.carbs ?? ''}"></div>
        <div class="field"><label for="af-fat">Grassi (g)</label><input id="af-fat" type="number" inputmode="decimal" min="0" step="1" value="${v.fat ?? ''}"></div>
      </div>
      <div style="display:flex;gap:8px">
        <button class="btn small" id="cancel-add-food">Annulla</button>
        <button class="btn small primary" id="submit-add-food">Aggiungi</button>
      </div>
    </div>
  `;
}
