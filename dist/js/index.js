//#region \0rolldown/runtime.js
var __defProp = Object.defineProperty;
var __esmMin = (fn, res, err) => () => {
	if (err) throw err[0];
	try {
		return fn && (res = fn(fn = 0)), res;
	} catch (e) {
		throw err = [e], e;
	}
};
var __commonJSMin = (cb, mod) => () => (mod || (cb((mod = { exports: {} }).exports, mod), cb = null), mod.exports);
var __exportAll = (all, no_symbols) => {
	let target = {};
	for (var name in all) __defProp(target, name, {
		get: all[name],
		enumerable: true
	});
	if (!no_symbols) __defProp(target, Symbol.toStringTag, { value: "Module" });
	return target;
};
//#endregion
//#region \0vite/modulepreload-polyfill.js
(function polyfill() {
	const relList = document.createElement("link").relList;
	if (relList && relList.supports && relList.supports("modulepreload")) return;
	for (const link of document.querySelectorAll("link[rel=\"modulepreload\"]")) processPreload(link);
	new MutationObserver((mutations) => {
		for (const mutation of mutations) {
			if (mutation.type !== "childList") continue;
			for (const node of mutation.addedNodes) if (node.tagName === "LINK" && node.rel === "modulepreload") processPreload(node);
		}
	}).observe(document, {
		childList: true,
		subtree: true
	});
	function getFetchOpts(link) {
		const fetchOpts = {};
		if (link.integrity) fetchOpts.integrity = link.integrity;
		if (link.referrerPolicy) fetchOpts.referrerPolicy = link.referrerPolicy;
		if (link.crossOrigin === "use-credentials") fetchOpts.credentials = "include";
		else if (link.crossOrigin === "anonymous") fetchOpts.credentials = "omit";
		else fetchOpts.credentials = "same-origin";
		return fetchOpts;
	}
	function processPreload(link) {
		if (link.ep) return;
		link.ep = true;
		const fetchOpts = getFetchOpts(link);
		fetch(link.href, fetchOpts);
	}
})();
//#endregion
//#region pwa/js/store.js
function load(key, fallback) {
	try {
		const raw = localStorage.getItem(key);
		return raw ? JSON.parse(raw) : fallback;
	} catch {
		return fallback;
	}
}
function save(key, value) {
	localStorage.setItem(key, JSON.stringify(value));
}
function todayKey(date = /* @__PURE__ */ new Date()) {
	return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
function seedIfNeeded() {
	if (!store.getDiet()) store.saveDiet({
		name: "Dieta personale",
		targets: {
			kcal: 2400,
			protein: 180,
			carbs: 260,
			fat: 70
		},
		meals: [
			{
				name: "Colazione",
				foods: [
					{
						name: "Fiocchi d'avena",
						grams: 80,
						kcal: 300,
						protein: 11,
						carbs: 53,
						fat: 6
					},
					{
						name: "Albume d'uovo",
						grams: 200,
						kcal: 104,
						protein: 22,
						carbs: 1,
						fat: 0
					},
					{
						name: "Banana",
						grams: 120,
						kcal: 107,
						protein: 1,
						carbs: 27,
						fat: 0
					}
				]
			},
			{
				name: "Pranzo",
				foods: [
					{
						name: "Riso basmati",
						grams: 100,
						kcal: 350,
						protein: 8,
						carbs: 78,
						fat: 1
					},
					{
						name: "Petto di pollo",
						grams: 200,
						kcal: 220,
						protein: 46,
						carbs: 0,
						fat: 3
					},
					{
						name: "Olio EVO",
						grams: 10,
						kcal: 90,
						protein: 0,
						carbs: 0,
						fat: 10
					},
					{
						name: "Verdure miste",
						grams: 200,
						kcal: 50,
						protein: 3,
						carbs: 8,
						fat: 0
					}
				]
			},
			{
				name: "Spuntino",
				foods: [{
					name: "Yogurt greco 0%",
					grams: 170,
					kcal: 100,
					protein: 17,
					carbs: 6,
					fat: 0
				}, {
					name: "Mandorle",
					grams: 20,
					kcal: 120,
					protein: 4,
					carbs: 4,
					fat: 10
				}]
			},
			{
				name: "Cena",
				foods: [
					{
						name: "Patate",
						grams: 300,
						kcal: 231,
						protein: 6,
						carbs: 52,
						fat: 0
					},
					{
						name: "Salmone",
						grams: 180,
						kcal: 370,
						protein: 37,
						carbs: 0,
						fat: 24
					},
					{
						name: "Verdure miste",
						grams: 200,
						kcal: 50,
						protein: 3,
						carbs: 8,
						fat: 0
					}
				]
			}
		]
	});
	if (!store.getWorkout()) store.saveWorkout({
		name: "Push / Pull / Legs",
		days: [
			{
				name: "Giorno A — Push",
				exercises: [
					{
						name: "Panca piana bilanciere",
						muscle: "Petto",
						sets: 4,
						reps: "6-8",
						rest: 150
					},
					{
						name: "Lento avanti manubri",
						muscle: "Spalle",
						sets: 3,
						reps: "8-10",
						rest: 120
					},
					{
						name: "Panca inclinata manubri",
						muscle: "Petto",
						sets: 3,
						reps: "8-10",
						rest: 120
					},
					{
						name: "Alzate laterali",
						muscle: "Spalle",
						sets: 3,
						reps: "12-15",
						rest: 90
					},
					{
						name: "Pushdown ai cavi",
						muscle: "Tricipiti",
						sets: 3,
						reps: "10-12",
						rest: 90
					}
				]
			},
			{
				name: "Giorno B — Pull",
				exercises: [
					{
						name: "Stacco da terra",
						muscle: "Schiena",
						sets: 3,
						reps: "5",
						rest: 180
					},
					{
						name: "Trazioni",
						muscle: "Schiena",
						sets: 4,
						reps: "6-10",
						rest: 150
					},
					{
						name: "Rematore bilanciere",
						muscle: "Schiena",
						sets: 3,
						reps: "8-10",
						rest: 120
					},
					{
						name: "Face pull",
						muscle: "Spalle posteriori",
						sets: 3,
						reps: "12-15",
						rest: 90
					},
					{
						name: "Curl bilanciere",
						muscle: "Bicipiti",
						sets: 3,
						reps: "10-12",
						rest: 90
					}
				]
			},
			{
				name: "Giorno C — Legs",
				exercises: [
					{
						name: "Squat bilanciere",
						muscle: "Quadricipiti",
						sets: 4,
						reps: "6-8",
						rest: 180
					},
					{
						name: "Stacco rumeno",
						muscle: "Femorali",
						sets: 3,
						reps: "8-10",
						rest: 150
					},
					{
						name: "Leg press",
						muscle: "Quadricipiti",
						sets: 3,
						reps: "10-12",
						rest: 120
					},
					{
						name: "Leg curl",
						muscle: "Femorali",
						sets: 3,
						reps: "10-12",
						rest: 90
					},
					{
						name: "Calf raise in piedi",
						muscle: "Polpacci",
						sets: 4,
						reps: "12-15",
						rest: 60
					}
				]
			}
		]
	});
}
var KEYS, store;
var init_store = __esmMin((() => {
	KEYS = {
		diet: "fc_diet",
		foodLog: "fc_foodlog",
		workout: "fc_workout",
		sessions: "fc_sessions",
		weights: "fc_weights",
		chat: "fc_chat",
		settings: "fc_settings"
	};
	store = {
		getDiet() {
			return load(KEYS.diet, null);
		},
		saveDiet(diet) {
			save(KEYS.diet, diet);
		},
		getFoodLog() {
			return load(KEYS.foodLog, []);
		},
		getTodayFoodLog() {
			return this.getFoodLog().filter((e) => e.date === todayKey());
		},
		addFoodLog(entry) {
			const log = this.getFoodLog();
			log.push({
				...entry,
				date: todayKey(),
				ts: Date.now()
			});
			save(KEYS.foodLog, log);
		},
		removeFoodLog(ts) {
			save(KEYS.foodLog, this.getFoodLog().filter((e) => e.ts !== ts));
		},
		getWorkout() {
			return load(KEYS.workout, null);
		},
		saveWorkout(plan) {
			save(KEYS.workout, plan);
		},
		getSessions() {
			return load(KEYS.sessions, []);
		},
		addExerciseLog(dayName, exerciseName, sets) {
			const sessions = this.getSessions();
			const today = todayKey();
			let session = sessions.find((s) => s.date === today && s.dayName === dayName);
			if (!session) {
				session = {
					date: today,
					dayName,
					logs: []
				};
				sessions.push(session);
			}
			session.logs = session.logs.filter((l) => l.exercise !== exerciseName);
			session.logs.push({
				exercise: exerciseName,
				sets
			});
			save(KEYS.sessions, sessions);
		},
		getExerciseHistory(exerciseName, limit = 12) {
			const name = exerciseName.toLowerCase();
			return this.getSessions().filter((s) => s.logs.some((l) => l.exercise.toLowerCase().includes(name))).sort((a, b) => a.date.localeCompare(b.date)).slice(-limit).map((s) => {
				const log = s.logs.find((l) => l.exercise.toLowerCase().includes(name));
				const top = Math.max(...log.sets.map((x) => x.kg), 0);
				const volume = log.sets.reduce((acc, x) => acc + x.kg * x.reps, 0);
				return {
					date: s.date,
					sets: log.sets,
					top,
					volume
				};
			});
		},
		getWeights() {
			return load(KEYS.weights, []).sort((a, b) => a.date.localeCompare(b.date));
		},
		addWeight(kg) {
			const list = load(KEYS.weights, []).filter((w) => w.date !== todayKey());
			list.push({
				date: todayKey(),
				kg
			});
			save(KEYS.weights, list);
		},
		getChat() {
			return load(KEYS.chat, []);
		},
		addChatMessage(role, text) {
			const chat = this.getChat();
			chat.push({
				role,
				text,
				ts: Date.now()
			});
			save(KEYS.chat, chat);
		},
		clearChat() {
			save(KEYS.chat, []);
		},
		getSettings() {
			return load(KEYS.settings, {
				apiKey: "",
				model: "gemini-2.5-flash"
			});
		},
		saveSettings(settings) {
			save(KEYS.settings, settings);
		},
		exportAll() {
			const dump = {};
			for (const key of Object.values(KEYS)) {
				if (key === KEYS.settings) continue;
				dump[key] = load(key, null);
			}
			return dump;
		}
	};
}));
//#endregion
//#region pwa/js/ui.js
function escapeHtml(text) {
	return String(text).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll("\"", "&quot;").replaceAll("'", "&#39;");
}
function renderMarkdown(text) {
	const lines = escapeHtml(text).replace(/\*\*(.+?)\*\*/g, "<b>$1</b>").replace(/`([^`]+)`/g, "<code>$1</code>").replace(/(https?:\/\/[^\s<)]+)/g, "<a href=\"$1\" target=\"_blank\" rel=\"noopener noreferrer\">$1</a>").split("\n");
	let html = "";
	let inList = false;
	for (const line of lines) {
		const item = line.match(/^\s*(?:[-*•]|\d+[.)])\s+(.*)$/);
		if (item) {
			if (!inList) {
				html += "<ul>";
				inList = true;
			}
			html += `<li>${item[1]}</li>`;
		} else {
			if (inList) {
				html += "</ul>";
				inList = false;
			}
			if (line.trim()) html += `<p>${line}</p>`;
		}
	}
	if (inList) html += "</ul>";
	return html || "<p></p>";
}
/**
* Line chart SVG minimale (stile Swift Charts).
* points: [{label, value}] — ritorna stringa SVG.
*/
function lineChart(points, { height = 120, color = "var(--green)" } = {}) {
	if (points.length < 2) return "<p class=\"muted center\">Servono almeno 2 misurazioni.</p>";
	const w = 320, h = height, padX = 6, padY = 12;
	const values = points.map((p) => p.value);
	const min = Math.min(...values);
	const range = Math.max(...values) - min || 1;
	const x = (i) => padX + i / (points.length - 1) * (w - padX * 2);
	const y = (v) => h - padY - (v - min) / range * (h - padY * 2);
	const path = points.map((p, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(p.value).toFixed(1)}`).join(" ");
	const area = `${path} L${x(points.length - 1).toFixed(1)},${h - padY} L${x(0).toFixed(1)},${h - padY} Z`;
	const last = points[points.length - 1];
	return `<svg class="chart-svg" viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg" role="img">
    <path d="${area}" fill="${color}" opacity="0.12"/>
    <path d="${path}" fill="none" stroke="${color}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="${x(points.length - 1).toFixed(1)}" cy="${y(last.value).toFixed(1)}" r="4" fill="${color}"/>
  </svg>`;
}
/** Anello progresso SVG (kcal). */
function progressRing(progress, { size = 116, stroke = 11, color = "var(--green)" } = {}) {
	const clamped = Math.min(Math.max(progress, 0), 1);
	const r = (size - stroke) / 2;
	const c = 2 * Math.PI * r;
	const offset = c * (1 - clamped);
	return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="var(--fill)" stroke-width="${stroke}"/>
    <circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="${color}" stroke-width="${stroke}"
      stroke-linecap="round" stroke-dasharray="${c.toFixed(1)}" stroke-dashoffset="${offset.toFixed(1)}"
      transform="rotate(-90 ${size / 2} ${size / 2})" style="transition: stroke-dashoffset 0.5s ease"/>
  </svg>`;
}
function showToast(message) {
	let el = document.querySelector(".toast");
	if (!el) {
		el = document.createElement("div");
		el.className = "toast";
		document.body.appendChild(el);
	}
	el.textContent = message;
	el.classList.add("show");
	clearTimeout(toastTimer);
	toastTimer = setTimeout(() => el.classList.remove("show"), 2200);
}
function formatDateShort(isoDate) {
	const [y, m, d] = isoDate.split("-");
	return `${d}/${m}`;
}
var toastTimer;
var init_ui = __esmMin((() => {
	toastTimer = null;
}));
//#endregion
//#region pwa/js/views/dashboard.js
function renderDashboard(container) {
	const targets = store.getDiet()?.targets || {
		kcal: 0,
		protein: 0,
		carbs: 0,
		fat: 0
	};
	const entries = store.getTodayFoodLog();
	const sum = (key) => entries.reduce((acc, e) => acc + (e[key] || 0), 0);
	const kcal = sum("kcal"), protein = sum("protein"), carbs = sum("carbs"), fat = sum("fat");
	const progress = targets.kcal > 0 ? kcal / targets.kcal : 0;
	const over = kcal > targets.kcal && targets.kcal > 0;
	const todayDay = pickTodayWorkout(store.getWorkout());
	const weights = store.getWeights().slice(-30);
	container.innerHTML = `
    <h1 class="page-title">Oggi</h1>

    <div class="card">
      <div class="kcal-row">
        <div class="ring-wrap">
          ${progressRing(progress, { color: over ? "var(--orange)" : "var(--green)" })}
          <div class="ring-center">
            <span class="ring-value">${Math.round(kcal)}</span>
            <span class="ring-unit">kcal</span>
          </div>
        </div>
        <div class="kcal-info">
          <span>🎯 Obiettivo <b>${targets.kcal}</b></span>
          <span>🍴 Rimanenti <b>${Math.max(targets.kcal - Math.round(kcal), 0)}</b></span>
          ${over ? `<span style="color:var(--orange)">⚠️ +${Math.round(kcal - targets.kcal)} oltre</span>` : ""}
        </div>
      </div>
    </div>

    <div class="macro-row">
      ${macroCell("Proteine", protein, targets.protein, "var(--blue)")}
      ${macroCell("Carboidrati", carbs, targets.carbs, "var(--orange)")}
      ${macroCell("Grassi", fat, targets.fat, "var(--purple)")}
    </div>

    ${todayDay ? `
      <div class="card mt16">
        <div class="card-header">
          <span>🏋 Allenamento di oggi</span>
          <span class="hint">${escapeHtml(todayDay.name)}</span>
        </div>
        ${todayDay.exercises.slice(0, 4).map((e) => `
          <div class="list-row">
            <span>${escapeHtml(e.name)}</span>
            <span class="right">${e.sets} × ${escapeHtml(String(e.reps))}</span>
          </div>`).join("")}
        ${todayDay.exercises.length > 4 ? `<p class="muted mt8">+ ${todayDay.exercises.length - 4 === 1 ? "1 altro esercizio" : `altri ${todayDay.exercises.length - 4} esercizi`}</p>` : ""}
      </div>` : ""}

    ${weights.length >= 2 ? `
      <div class="card">
        <div class="card-header">
          <span>⚖️ Peso</span>
          <span class="hint">${weights[weights.length - 1].kg.toFixed(1)} kg · ${formatDateShort(weights[weights.length - 1].date)}</span>
        </div>
        ${lineChart(weights.map((w) => ({
		label: w.date,
		value: w.kg
	})))}
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
	return days[(((/* @__PURE__ */ new Date()).getDay() - 1) % days.length + days.length) % days.length];
}
var init_dashboard = __esmMin((() => {
	init_store();
	init_ui();
}));
//#endregion
//#region pwa/js/views/dieta.js
function renderDieta(container) {
	const diet = store.getDiet();
	if (!diet) {
		container.innerHTML = "<h1 class=\"page-title\">Dieta</h1><p class=\"muted\">Nessuna dieta configurata.</p>";
		return;
	}
	const todayLog = store.getTodayFoodLog();
	const isLogged = (mealName, foodName) => todayLog.some((e) => e.mealName === mealName && e.foodName === foodName);
	container.innerHTML = `
    <h1 class="page-title">Dieta</h1>
    <p class="muted" style="margin:-8px 2px 12px">
      Tocca <b>+</b> per registrare un alimento come mangiato oggi.
      Per sostituzioni o pasti fuori dieta chiedi al <b>Coach</b>.
    </p>
    ${diet.meals.map((meal) => `
      <div class="section-title">${escapeHtml(meal.name)}</div>
      <div class="card">
        ${meal.foods.map((food) => {
		const done = isLogged(meal.name, food.name);
		return `
          <div class="list-row food-row">
            <div>
              <div>${escapeHtml(food.name)}</div>
              <div class="sub">${Math.round(food.grams)}g · ${Math.round(food.kcal)} kcal · P ${Math.round(food.protein)} · C ${Math.round(food.carbs)} · G ${Math.round(food.fat)}</div>
            </div>
            <button class="food-log-btn ${done ? "done" : ""}"
              data-meal="${escapeHtml(meal.name)}" data-food="${escapeHtml(food.name)}"
              aria-label="${done ? "Già registrato" : "Registra"}">${done ? "✓" : "+"}</button>
          </div>`;
	}).join("")}
      </div>
    `).join("")}
  `;
	container.querySelectorAll(".food-log-btn").forEach((btn) => {
		btn.addEventListener("click", () => {
			const mealName = btn.dataset.meal;
			const foodName = btn.dataset.food;
			const food = diet.meals.find((m) => m.name === mealName)?.foods.find((f) => f.name === foodName);
			if (!food) return;
			if (btn.classList.contains("done")) {
				const entry = store.getTodayFoodLog().find((e) => e.mealName === mealName && e.foodName === foodName);
				if (entry) store.removeFoodLog(entry.ts);
				showToast(`${food.name} rimosso dal diario`);
			} else {
				store.addFoodLog({
					mealName,
					foodName: food.name,
					grams: food.grams,
					kcal: food.kcal,
					protein: food.protein,
					carbs: food.carbs,
					fat: food.fat
				});
				showToast(`${food.name} registrato ✓`);
			}
			renderDieta(container);
		});
	});
}
var init_dieta = __esmMin((() => {
	init_store();
	init_ui();
}));
//#endregion
//#region pwa/js/views/workout.js
function renderWorkout(container) {
	const plan = store.getWorkout();
	if (!plan?.days?.length) {
		container.innerHTML = "<h1 class=\"page-title\">Workout</h1><p class=\"muted\">Nessuna scheda configurata.</p>";
		return;
	}
	if (activeDayIndex >= plan.days.length) activeDayIndex = 0;
	const day = plan.days[activeDayIndex];
	container.innerHTML = `
    <h1 class="page-title">Workout</h1>
    <div class="day-pills">
      ${plan.days.map((d, i) => `
        <button class="pill ${i === activeDayIndex ? "active" : ""}" data-day="${i}">${escapeHtml(d.name)}</button>
      `).join("")}
    </div>
    <div id="exercise-list">
      ${day.exercises.map((e) => exerciseCard(e, day.name)).join("")}
    </div>
  `;
	container.querySelectorAll(".pill").forEach((pill) => {
		pill.addEventListener("click", () => {
			activeDayIndex = Number(pill.dataset.day);
			openExercise = null;
			renderWorkout(container);
		});
	});
	container.querySelectorAll("[data-toggle-exercise]").forEach((btn) => {
		btn.addEventListener("click", () => {
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
    <div class="card-header" style="margin-bottom:${isOpen ? "12px" : "0"}">
      <div>
        <div>${escapeHtml(exercise.name)}</div>
        <div class="sub muted">${escapeHtml(exercise.muscle || "")} · ${exercise.sets} × ${escapeHtml(String(exercise.reps))} · rec ${exercise.rest || 90}s</div>
      </div>
      <button class="btn small ${isOpen ? "" : "primary"}" data-toggle-exercise="${escapeHtml(exercise.name)}">
        ${isOpen ? "Chiudi" : "Registra"}
      </button>
    </div>

    ${isOpen ? `
      ${last ? `<p class="muted">Ultima volta (${formatDateShort(last.date)}): ${last.sets.map((s) => `${s.kg}×${s.reps}`).join(" · ")}</p>` : ""}
      <div class="set-grid" data-logger="${escapeHtml(exercise.name)}">
        ${Array.from({ length: exercise.sets }, (_, i) => setRow(i, last?.sets[i])).join("")}
      </div>
      <div class="mt8" style="display:flex;gap:8px">
        <button class="btn small" data-add-set="${escapeHtml(exercise.name)}">+ Serie</button>
        <button class="btn small primary" data-save-log="${escapeHtml(exercise.name)}">Salva</button>
      </div>

      ${history.length >= 2 ? `
        <div class="mt16">
          <div class="muted" style="margin-bottom:6px">Progressione carico massimo (kg)</div>
          ${lineChart(history.map((h) => ({
		label: h.date,
		value: h.top
	})), {
		height: 90,
		color: "var(--blue)"
	})}
        </div>` : ""}
    ` : ""}
  </div>`;
}
function setRow(index, previousSet) {
	return `<div class="set-row">
    <span class="set-n">${index + 1}</span>
    <input type="number" inputmode="decimal" step="0.5" min="0" placeholder="kg" value="${previousSet ? previousSet.kg : ""}" data-kg>
    <input type="number" inputmode="numeric" step="1" min="0" placeholder="reps" value="${previousSet ? previousSet.reps : ""}" data-reps>
  </div>`;
}
function bindLogger(container, dayName) {
	container.querySelectorAll("[data-add-set]").forEach((btn) => {
		btn.addEventListener("click", () => {
			const grid = container.querySelector(`[data-logger="${CSS.escape(btn.dataset.addSet)}"]`);
			const count = grid.querySelectorAll(".set-row").length;
			grid.insertAdjacentHTML("beforeend", setRow(count));
		});
	});
	container.querySelectorAll("[data-save-log]").forEach((btn) => {
		btn.addEventListener("click", () => {
			const name = btn.dataset.saveLog;
			const sets = [...container.querySelector(`[data-logger="${CSS.escape(name)}"]`).querySelectorAll(".set-row")].map((row) => ({
				kg: parseFloat(row.querySelector("[data-kg]").value),
				reps: parseInt(row.querySelector("[data-reps]").value, 10)
			})).filter((s) => Number.isFinite(s.kg) && Number.isFinite(s.reps) && s.reps > 0);
			if (sets.length === 0) {
				showToast("Inserisci almeno una serie valida");
				return;
			}
			store.addExerciseLog(dayName, name, sets);
			openExercise = null;
			showToast(`${name}: ${sets.length} serie salvate ✓`);
			renderWorkout(container);
		});
	});
}
var activeDayIndex, openExercise;
var init_workout = __esmMin((() => {
	init_store();
	init_ui();
	activeDayIndex = 0;
	openExercise = null;
}));
//#endregion
//#region \0vite/preload-helper.js
var scriptRel, assetsURL, seen, __vitePreload;
var init_preload_helper = __esmMin((() => {
	scriptRel = "modulepreload";
	assetsURL = function(dep, importerUrl) {
		return new URL(dep, importerUrl).href;
	};
	seen = {};
	__vitePreload = function preload(baseModule, deps, importerUrl) {
		let promise = Promise.resolve();
		if (deps && deps.length > 0) {
			const links = document.getElementsByTagName("link");
			const cspNonceMeta = document.querySelector("meta[property=csp-nonce]");
			const cspNonce = cspNonceMeta?.nonce || cspNonceMeta?.getAttribute("nonce");
			function allSettled(promises) {
				return Promise.all(promises.map((p) => Promise.resolve(p).then((value) => ({
					status: "fulfilled",
					value
				}), (reason) => ({
					status: "rejected",
					reason
				}))));
			}
			function importMetaResolve(specifier) {
				if (import.meta.resolve) return import.meta.resolve(specifier);
				return new URL(
					specifier,
					/** #__KEEP__ */
					import.meta.url
				).href;
			}
			promise = allSettled(deps.map((dep) => {
				dep = assetsURL(dep, importerUrl);
				dep = importMetaResolve(dep);
				if (dep in seen) return;
				seen[dep] = true;
				const isCss = dep.endsWith(".css");
				for (let i = links.length - 1; i >= 0; i--) {
					const link = links[i];
					if (link.href === dep && (!isCss || link.rel === "stylesheet")) return;
				}
				const link = document.createElement("link");
				link.rel = isCss ? "stylesheet" : scriptRel;
				if (!isCss) link.as = "script";
				link.crossOrigin = "";
				link.href = dep;
				if (cspNonce) link.setAttribute("nonce", cspNonce);
				document.head.appendChild(link);
				if (isCss) return new Promise((res, rej) => {
					link.addEventListener("load", res);
					link.addEventListener("error", () => rej(/* @__PURE__ */ new Error(`Unable to preload CSS for ${dep}`)));
				});
			}));
		}
		function handlePreloadError(err) {
			const e = new Event("vite:preloadError", { cancelable: true });
			e.payload = err;
			window.dispatchEvent(e);
			if (!e.defaultPrevented) throw err;
		}
		return promise.then((res) => {
			for (const item of res || []) {
				if (item.status !== "rejected") continue;
				handlePreloadError(item.reason);
			}
			return baseModule().catch(handlePreloadError);
		});
	};
}));
//#endregion
//#region pwa/js/tools.js
async function executeTool(name, args) {
	try {
		switch (name) {
			case "get_diet_plan": return getDietPlan();
			case "get_today_nutrition": return getTodayNutrition();
			case "log_food": return logFood(args);
			case "replace_planned_food": return replacePlannedFood(args);
			case "get_workout_plan": return getWorkoutPlan();
			case "get_exercise_history": return getExerciseHistory(args);
			case "replace_exercise": return replaceExercise(args);
			case "log_weight": return logWeight(args);
			case "get_weight_history": return getWeightHistory(args);
			case "search_web": {
				const { webSearch } = await __vitePreload(async () => {
					const { webSearch } = await Promise.resolve().then(() => (init_gemini(), gemini_exports));
					return { webSearch };
				}, void 0, import.meta.url);
				return await webSearch(String(args.query || ""));
			}
			default: return { error: `Tool sconosciuto: ${name}` };
		}
	} catch (error) {
		return { error: error.message };
	}
}
function notifyDataChanged() {
	window.dispatchEvent(new CustomEvent("fc:data-changed"));
}
function getDietPlan() {
	const diet = store.getDiet();
	if (!diet) return { error: "Nessuna dieta configurata" };
	return {
		plan_name: diet.name,
		targets: diet.targets,
		meals: diet.meals.map((m) => ({
			name: m.name,
			foods: m.foods.map((f) => ({
				name: f.name,
				grams: f.grams,
				kcal: f.kcal,
				protein: f.protein,
				carbs: f.carbs,
				fat: f.fat
			}))
		}))
	};
}
function getTodayNutrition() {
	const diet = store.getDiet();
	const entries = store.getTodayFoodLog();
	const sum = (key) => Math.round(entries.reduce((acc, e) => acc + (e[key] || 0), 0));
	return {
		consumed: {
			kcal: sum("kcal"),
			protein: sum("protein"),
			carbs: sum("carbs"),
			fat: sum("fat")
		},
		targets: diet?.targets || null,
		logged_foods: entries.map((e) => `${e.foodName} (${Math.round(e.grams)}g, ${Math.round(e.kcal)} kcal) - ${e.mealName}`)
	};
}
function logFood(args) {
	const { meal_name, food_name, grams, kcal, protein, carbs, fat } = args;
	if (!meal_name || !food_name || ![
		grams,
		kcal,
		protein,
		carbs,
		fat
	].every((v) => typeof v === "number" && v >= 0)) return { error: "Parametri mancanti o non validi" };
	store.addFoodLog({
		mealName: meal_name,
		foodName: food_name,
		grams,
		kcal,
		protein,
		carbs,
		fat
	});
	notifyDataChanged();
	return {
		status: "registrato",
		food: `${food_name} ${Math.round(grams)}g, ${Math.round(kcal)} kcal`
	};
}
function replacePlannedFood(args) {
	const diet = store.getDiet();
	if (!diet) return { error: "Nessuna dieta configurata" };
	const meal = diet.meals.find((m) => m.name.toLowerCase().includes(String(args.meal_name || "").toLowerCase()));
	const food = meal?.foods.find((f) => f.name.toLowerCase().includes(String(args.old_food_name || "").toLowerCase()));
	if (!food) return { error: `Alimento '${args.old_food_name}' non trovato nel pasto '${args.meal_name}'` };
	const oldName = food.name;
	Object.assign(food, {
		name: args.new_food_name,
		grams: args.grams,
		kcal: args.kcal,
		protein: args.protein,
		carbs: args.carbs,
		fat: args.fat
	});
	store.saveDiet(diet);
	notifyDataChanged();
	return {
		status: "sostituito",
		detail: `${oldName} -> ${args.new_food_name} in ${meal.name}`
	};
}
function getWorkoutPlan() {
	const plan = store.getWorkout();
	if (!plan) return { error: "Nessuna scheda configurata" };
	return plan;
}
function getExerciseHistory(args) {
	if (!args.exercise_name) return { error: "Parametro exercise_name mancante" };
	const history = store.getExerciseHistory(String(args.exercise_name), args.limit || 10);
	if (history.length === 0) return { info: `Nessuno storico per '${args.exercise_name}'` };
	return {
		exercise: args.exercise_name,
		sessions: history.map((h) => ({
			date: h.date,
			sets: h.sets.map((s) => `${s.kg}kg x ${s.reps}`),
			top_weight_kg: h.top,
			total_volume_kg: h.volume
		}))
	};
}
function replaceExercise(args) {
	const plan = store.getWorkout();
	if (!plan) return { error: "Nessuna scheda configurata" };
	const day = plan.days.find((d) => d.name.toLowerCase().includes(String(args.day_name || "").toLowerCase()));
	const exercise = day?.exercises.find((e) => e.name.toLowerCase().includes(String(args.old_exercise_name || "").toLowerCase()));
	if (!exercise) return { error: `Esercizio '${args.old_exercise_name}' non trovato nel giorno '${args.day_name}'` };
	const oldName = exercise.name;
	Object.assign(exercise, {
		name: args.new_exercise_name,
		muscle: args.muscle_group,
		sets: args.target_sets,
		reps: args.target_reps,
		rest: args.rest_seconds || exercise.rest,
		notes: args.notes || ""
	});
	store.saveWorkout(plan);
	notifyDataChanged();
	return {
		status: "sostituito",
		detail: `${oldName} -> ${args.new_exercise_name} in ${day.name}`
	};
}
function logWeight(args) {
	const kg = Number(args.weight_kg);
	if (!kg || kg < 20 || kg > 400) return { error: "Peso non valido" };
	store.addWeight(kg);
	notifyDataChanged();
	return {
		status: "registrato",
		weight_kg: kg
	};
}
function getWeightHistory(args) {
	const limit = args?.limit || 30;
	return { measurements: store.getWeights().slice(-limit).map((w) => ({
		date: w.date,
		weight_kg: w.kg
	})) };
}
var str, num, int, obj, toolDeclarations;
var init_tools = __esmMin((() => {
	init_store();
	init_preload_helper();
	str = (description) => ({
		type: "string",
		description
	});
	num = (description) => ({
		type: "number",
		description
	});
	int = (description) => ({
		type: "integer",
		description
	});
	obj = (properties, required = []) => ({
		type: "object",
		properties,
		required
	});
	toolDeclarations = [
		{
			name: "get_diet_plan",
			description: "Restituisce la dieta preimpostata: pasti, alimenti, grammature, calorie, macro e target giornalieri."
		},
		{
			name: "get_today_nutrition",
			description: "Restituisce calorie e macro consumati oggi e i target giornalieri."
		},
		{
			name: "log_food",
			description: "Registra un alimento consumato oggi nel diario, con calorie e macro. Usalo quando l'utente dice cosa ha mangiato.",
			parameters: obj({
				meal_name: str("Pasto: Colazione, Pranzo, Cena, Spuntino"),
				food_name: str("Nome dell'alimento"),
				grams: num("Quantità in grammi"),
				kcal: num("Calorie totali"),
				protein: num("Proteine in grammi"),
				carbs: num("Carboidrati in grammi"),
				fat: num("Grassi in grammi")
			}, [
				"meal_name",
				"food_name",
				"grams",
				"kcal",
				"protein",
				"carbs",
				"fat"
			])
		},
		{
			name: "replace_planned_food",
			description: "Sostituisce un alimento nella dieta preimpostata con un'alternativa. Chiedi conferma all'utente prima di chiamarla.",
			parameters: obj({
				meal_name: str("Pasto che contiene l'alimento"),
				old_food_name: str("Alimento da sostituire"),
				new_food_name: str("Nuovo alimento"),
				grams: num("Grammi del nuovo alimento"),
				kcal: num("Calorie del nuovo alimento"),
				protein: num("Proteine in grammi"),
				carbs: num("Carboidrati in grammi"),
				fat: num("Grassi in grammi")
			}, [
				"meal_name",
				"old_food_name",
				"new_food_name",
				"grams",
				"kcal",
				"protein",
				"carbs",
				"fat"
			])
		},
		{
			name: "get_workout_plan",
			description: "Restituisce la scheda di allenamento: giorni, esercizi, serie, ripetizioni, recuperi."
		},
		{
			name: "get_exercise_history",
			description: "Storico di carichi, serie e ripetizioni di un esercizio nelle ultime sessioni.",
			parameters: obj({
				exercise_name: str("Nome dell'esercizio"),
				limit: int("Numero massimo di sessioni (default 10)")
			}, ["exercise_name"])
		},
		{
			name: "replace_exercise",
			description: "Sostituisce un esercizio nella scheda (infortunio, attrezzatura mancante). Chiedi conferma all'utente prima di chiamarla.",
			parameters: obj({
				day_name: str("Giorno della scheda"),
				old_exercise_name: str("Esercizio da sostituire"),
				new_exercise_name: str("Nuovo esercizio"),
				muscle_group: str("Gruppo muscolare"),
				target_sets: int("Numero di serie"),
				target_reps: str("Range ripetizioni, es. 8-10"),
				rest_seconds: int("Recupero in secondi"),
				notes: str("Note tecniche opzionali")
			}, [
				"day_name",
				"old_exercise_name",
				"new_exercise_name",
				"muscle_group",
				"target_sets",
				"target_reps"
			])
		},
		{
			name: "log_weight",
			description: "Registra il peso corporeo di oggi in kg.",
			parameters: obj({ weight_kg: num("Peso in kg") }, ["weight_kg"])
		},
		{
			name: "get_weight_history",
			description: "Storico del peso corporeo.",
			parameters: obj({ limit: int("Numero massimo di misurazioni (default 30)") })
		},
		{
			name: "search_web",
			description: "Cerca informazioni aggiornate sul web (valori nutrizionali, ricette, evidenze scientifiche). Usala quando servono dati che non conosci con certezza.",
			parameters: obj({ query: str("Ricerca specifica da effettuare") }, ["query"])
		}
	];
}));
//#endregion
//#region pwa/js/gemini.js
var gemini_exports = /* @__PURE__ */ __exportAll({
	GeminiError: () => GeminiError,
	runAgent: () => runAgent,
	webSearch: () => webSearch
});
async function generateContent({ contents, tools, systemPrompt }) {
	const { apiKey, model } = store.getSettings();
	if (!apiKey) throw new GeminiError("API key mancante: inseriscila nella tab Altro (gratis su aistudio.google.com).", "no-key");
	const body = { contents };
	if (systemPrompt) body.systemInstruction = { parts: [{ text: systemPrompt }] };
	if (tools) body.tools = tools;
	let response;
	try {
		response = await fetch(`${BASE}/${model || "gemini-2.5-flash"}:generateContent`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"x-goog-api-key": apiKey
			},
			body: JSON.stringify(body)
		});
	} catch {
		throw new GeminiError("Nessuna connessione. Controlla la rete e riprova.", "network");
	}
	if (response.status === 429) throw new GeminiError("Limite gratuito raggiunto: attendi un minuto e riprova.", "rate-limit");
	const data = await response.json().catch(() => null);
	if (!response.ok) {
		const message = data?.error?.message || `HTTP ${response.status}`;
		throw new GeminiError(`Errore AI: ${message}`);
	}
	const candidate = data?.candidates?.[0];
	if (!candidate?.content) throw new GeminiError("Risposta non valida dal server AI. Riprova.");
	return candidate;
}
/**
* Ricerca web via grounding Google Search: chiamata separata
* con SOLO il tool googleSearch (non combinabile con functionDeclarations).
*/
async function webSearch(query) {
	try {
		const candidate = await generateContent({
			systemPrompt: "Rispondi in modo conciso e fattuale in italiano, citando i dati trovati.",
			contents: [{
				role: "user",
				parts: [{ text: query }]
			}],
			tools: [{ googleSearch: {} }]
		});
		const answer = (candidate.content.parts || []).map((p) => p.text).filter(Boolean).join("\n");
		const sources = (candidate.groundingMetadata?.groundingChunks || []).map((c) => c.web ? `${c.web.title || ""}: ${c.web.uri}` : null).filter(Boolean);
		return {
			answer: answer || "Nessun risultato.",
			sources
		};
	} catch (error) {
		return { error: error.message };
	}
}
/**
* Loop agentico. history = array di ChatMessage {role: 'user'|'assistant', text}.
* onActivity(label) aggiorna la UI ("Sto cercando sul web…").
* Ritorna il testo finale della risposta.
*/
async function runAgent(userText, persistedHistory, onActivity = () => {}) {
	const contents = persistedHistory.slice(-30).map((m) => ({
		role: m.role === "user" ? "user" : "model",
		parts: [{ text: m.text }]
	}));
	contents.push({
		role: "user",
		parts: [{ text: userText }]
	});
	const tools = [{ functionDeclarations: toolDeclarations }];
	for (let i = 0; i < MAX_TOOL_ITERATIONS; i++) {
		onActivity("Sto pensando…");
		const candidate = await generateContent({
			contents,
			tools,
			systemPrompt: SYSTEM_PROMPT
		});
		contents.push(candidate.content);
		const calls = (candidate.content.parts || []).filter((p) => p.functionCall).map((p) => p.functionCall);
		if (calls.length === 0) return (candidate.content.parts || []).map((p) => p.text).filter(Boolean).join("\n") || "…";
		const responseParts = [];
		for (const call of calls) {
			onActivity(activityLabel(call.name));
			const result = await executeTool(call.name, call.args || {});
			responseParts.push({ functionResponse: {
				name: call.name,
				response: result
			} });
		}
		contents.push({
			role: "user",
			parts: responseParts
		});
	}
	return "Ho fatto troppe operazioni di fila senza arrivare a una risposta. Riprova con una richiesta più specifica.";
}
function activityLabel(toolName) {
	return {
		search_web: "Sto cercando sul web…",
		get_diet_plan: "Consulto la tua dieta…",
		get_today_nutrition: "Consulto la tua dieta…",
		get_workout_plan: "Consulto la tua scheda…",
		get_exercise_history: "Analizzo i tuoi carichi…",
		log_food: "Registro il pasto…",
		replace_planned_food: "Aggiorno la dieta…",
		replace_exercise: "Aggiorno la scheda…",
		log_weight: "Registro il peso…",
		get_weight_history: "Consulto il tuo peso…"
	}[toolName] || "Elaboro…";
}
var BASE, MAX_TOOL_ITERATIONS, SYSTEM_PROMPT, GeminiError;
var init_gemini = __esmMin((() => {
	init_store();
	init_tools();
	BASE = "https://generativelanguage.googleapis.com/v1beta/models";
	MAX_TOOL_ITERATIONS = 6;
	SYSTEM_PROMPT = `Sei FitCoach, un coach virtuale esperto di nutrizione e allenamento con i pesi. Parli italiano, sei diretto, motivante e concreto. Hai accesso ai dati reali dell'utente tramite i tool: dieta preimpostata, diario alimentare, scheda di allenamento, storico carichi e peso corporeo.
Regole:
1) Usa SEMPRE i tool per leggere i dati reali invece di inventare.
2) Per sostituzioni di alimenti o esercizi: proponi prima l'alternativa con macro/dettagli, chiedi conferma, e SOLO dopo la conferma chiama replace_planned_food o replace_exercise.
3) Usa search_web per valori nutrizionali che non conosci con certezza, ricette o evidenze scientifiche recenti; cita le fonti quando le hai.
4) Quando l'utente descrive un pasto in linguaggio naturale, stima grammature e macro in modo realistico e registralo con log_food, poi riepiloga cosa hai registrato.
5) Risposte concise, formattate con elenchi quando utile. Non dare consigli medici: per infortuni seri suggerisci un professionista.`;
	GeminiError = class extends Error {
		constructor(message, kind = "api") {
			super(message);
			this.kind = kind;
		}
	};
}));
//#endregion
//#region pwa/js/views/chat.js
function renderChat(container) {
	const messages = store.getChat();
	container.innerHTML = `
    <div class="chat-page">
      ${Boolean(store.getSettings().apiKey) ? "" : `<div class="banner warn">⚠️ Manca la API key Gemini (gratuita). Vai nella tab <b>Altro</b> per configurarla in 2 minuti.</div>`}
      <div class="chat-scroll" id="chat-scroll">
        ${messages.length === 0 ? emptyState() : messages.map(bubble).join("")}
        <div id="chat-activity"></div>
      </div>
      <div class="chat-inputbar">
        <textarea id="chat-input" rows="1" placeholder="Chiedi al tuo coach…" ${isBusy ? "disabled" : ""}></textarea>
        <button class="send-btn" id="chat-send" ${isBusy ? "disabled" : ""} aria-label="Invia">↑</button>
      </div>
    </div>
  `;
	const input = container.querySelector("#chat-input");
	const sendBtn = container.querySelector("#chat-send");
	const send = () => {
		const text = input.value.trim();
		if (text && !isBusy) {
			input.value = "";
			handleSend(container, text);
		}
	};
	sendBtn.addEventListener("click", send);
	input.addEventListener("keydown", (event) => {
		if (event.key === "Enter" && !event.shiftKey) {
			event.preventDefault();
			send();
		}
	});
	input.addEventListener("input", () => {
		input.style.height = "auto";
		input.style.height = Math.min(input.scrollHeight, 110) + "px";
	});
	container.querySelectorAll(".suggestion").forEach((btn) => {
		btn.addEventListener("click", () => handleSend(container, btn.dataset.text));
	});
	scrollToBottom(container);
}
function emptyState() {
	return `
    <div class="empty-hero">
      <div class="big">🏃</div>
      <h2>Il tuo coach personale</h2>
      <p>Conosce la tua dieta, la tua scheda e i tuoi progressi.<br>Può cercare sul web e modificare i tuoi piani.</p>
    </div>
    <div class="suggestions">
      ${SUGGESTIONS.map((s) => `<button class="suggestion" data-text="${escapeHtml(s)}">${escapeHtml(s)}</button>`).join("")}
    </div>
  `;
}
function bubble(message) {
	return `<div class="bubble ${message.role === "user" ? "user" : "assistant"}">${renderMarkdown(message.text)}</div>`;
}
async function handleSend(container, text) {
	if (isBusy) return;
	isBusy = true;
	const history = store.getChat();
	store.addChatMessage("user", text);
	renderChat(container);
	setActivity(container, "Sto pensando…");
	try {
		const reply = await runAgent(text, history, (label) => setActivity(container, label));
		store.addChatMessage("assistant", reply);
	} catch (error) {
		const message = error instanceof GeminiError ? error.message : "Qualcosa è andato storto. Riprova.";
		store.addChatMessage("assistant", `⚠️ ${message}`);
	} finally {
		isBusy = false;
		renderChat(container);
	}
}
function setActivity(container, label) {
	const el = container.querySelector("#chat-activity");
	if (el) {
		el.innerHTML = `<div class="chat-activity"><div class="spinner"></div>${escapeHtml(label)}</div>`;
		scrollToBottom(container);
	}
}
function scrollToBottom(container) {
	requestAnimationFrame(() => {
		const scroller = document.scrollingElement || document.documentElement;
		scroller.scrollTop = scroller.scrollHeight;
	});
}
var isBusy, SUGGESTIONS;
var init_chat = __esmMin((() => {
	init_store();
	init_gemini();
	init_ui();
	isBusy = false;
	SUGGESTIONS = [
		"Cosa mi manca per chiudere i macro di oggi?",
		"Non ho il pollo, alternativa con gli stessi macro?",
		"Ho male alla spalla, sostituisci la panca piana",
		"Come sta andando la mia progressione in stacco?"
	];
}));
//#endregion
//#region pwa/js/views/altro.js
function renderAltro(container) {
	const settings = store.getSettings();
	const weights = store.getWeights();
	const last = weights[weights.length - 1];
	container.innerHTML = `
    <h1 class="page-title">Altro</h1>

    <div class="section-title">Coach AI — API key (gratuita)</div>
    <div class="card">
      ${settings.apiKey ? "<div class=\"banner ok\">✓ API key configurata: il Coach è attivo.</div>" : "<div class=\"banner warn\">Il Coach ha bisogno di una API key gratuita di Google Gemini.</div>"}
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
          <option value="gemini-2.5-flash" ${settings.model === "gemini-2.5-flash" ? "selected" : ""}>gemini-2.5-flash (consigliato)</option>
          <option value="gemini-2.5-flash-lite" ${settings.model === "gemini-2.5-flash-lite" ? "selected" : ""}>gemini-2.5-flash-lite (limiti più alti)</option>
        </select>
      </div>
      <button class="btn primary" id="save-settings">Salva</button>
    </div>

    <div class="section-title">Peso corporeo</div>
    <div class="card">
      <div class="field">
        <label for="weight-input">Peso di oggi (kg)</label>
        <input id="weight-input" type="number" inputmode="decimal" step="0.1" min="20" max="400"
          placeholder="${last ? last.kg.toFixed(1) : "es. 78.5"}">
      </div>
      <button class="btn primary" id="save-weight">Registra</button>
      ${weights.length >= 2 ? `<div class="mt16">${lineChart(weights.slice(-60).map((w) => ({
		label: w.date,
		value: w.kg
	})))}</div>` : ""}
      ${last ? `<p class="muted mt8">Ultima misurazione: <b>${last.kg.toFixed(1)} kg</b> il ${formatDateShort(last.date)}</p>` : ""}
    </div>

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
	container.querySelector("#save-settings").addEventListener("click", () => {
		const apiKey = container.querySelector("#api-key").value.trim();
		const model = container.querySelector("#model").value;
		store.saveSettings({
			apiKey,
			model
		});
		showToast(apiKey ? "Impostazioni salvate ✓" : "API key rimossa");
		renderAltro(container);
	});
	container.querySelector("#save-weight").addEventListener("click", () => {
		const kg = parseFloat(container.querySelector("#weight-input").value);
		if (!Number.isFinite(kg) || kg < 20 || kg > 400) {
			showToast("Inserisci un peso valido");
			return;
		}
		store.addWeight(kg);
		showToast(`Peso registrato: ${kg.toFixed(1)} kg ✓`);
		renderAltro(container);
	});
	container.querySelector("#export-data").addEventListener("click", () => {
		const blob = new Blob([JSON.stringify(store.exportAll(), null, 2)], { type: "application/json" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = `fitcoach-export-${(/* @__PURE__ */ new Date()).toISOString().slice(0, 10)}.json`;
		a.click();
		URL.revokeObjectURL(url);
	});
	container.querySelector("#clear-chat").addEventListener("click", () => {
		if (confirm("Svuotare la conversazione con il Coach?")) {
			store.clearChat();
			showToast("Conversazione svuotata");
		}
	});
}
var init_altro = __esmMin((() => {
	init_store();
	init_ui();
}));
(/* @__PURE__ */ __commonJSMin((() => {
	init_store();
	init_dashboard();
	init_dieta();
	init_workout();
	init_chat();
	init_altro();
	var VIEWS = {
		oggi: renderDashboard,
		dieta: renderDieta,
		workout: renderWorkout,
		coach: renderChat,
		altro: renderAltro
	};
	var view = document.getElementById("view");
	var tabbar = document.getElementById("tabbar");
	var currentTab = "oggi";
	function switchTab(tab) {
		if (!VIEWS[tab]) tab = "oggi";
		currentTab = tab;
		tabbar.querySelectorAll(".tab").forEach((btn) => {
			btn.classList.toggle("active", btn.dataset.tab === tab);
		});
		window.scrollTo(0, 0);
		VIEWS[tab](view);
		location.hash = tab;
	}
	tabbar.addEventListener("click", (event) => {
		const btn = event.target.closest(".tab");
		if (btn) switchTab(btn.dataset.tab);
	});
	window.addEventListener("fc:data-changed", () => {
		if (currentTab !== "coach") VIEWS[currentTab](view);
	});
	seedIfNeeded();
	switchTab(location.hash.replace("#", "") || "oggi");
})))();
//#endregion
