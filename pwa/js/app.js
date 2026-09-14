import { seedIfNeeded } from './store.js';
import { icon } from './icons.js';
import { initAuth } from './auth.js';
import './sync.js'; // si auto-registra sugli eventi di scrittura/login, nessuna chiamata esplicita
import { renderDashboard } from './views/dashboard.js';
import { renderDieta } from './views/dieta.js';
import { renderWorkout } from './views/workout.js';
import { renderChat } from './views/chat.js';
import { renderAltro } from './views/altro.js';

const VIEWS = {
  oggi: renderDashboard,
  dieta: renderDieta,
  workout: renderWorkout,
  coach: renderChat,
  altro: renderAltro,
};

const view = document.getElementById('view');
const tabbar = document.getElementById('tabbar');
let currentTab = 'oggi';

function switchTab(tab) {
  if (!VIEWS[tab]) tab = 'oggi';
  currentTab = tab;
  tabbar.querySelectorAll('.tab').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tab);
  });
  window.scrollTo(0, 0);
  VIEWS[tab](view);
  location.hash = tab;
}

tabbar.addEventListener('click', (event) => {
  const btn = event.target.closest('.tab');
  if (btn) switchTab(btn.dataset.tab);
});

// L'agente (o il pull cloud) ha modificato dieta/scheda/log: aggiorna la vista corrente
// (tranne la chat, che si gestisce da sola)
window.addEventListener('fc:data-changed', () => {
  if (currentTab !== 'coach') VIEWS[currentTab](view);
});

// Stato di sincronizzazione cambiato: aggiorna la tab Altro se è quella aperta
window.addEventListener('fc:sync-status', () => {
  if (currentTab === 'altro') VIEWS.altro(view);
});

tabbar.querySelectorAll('.tab-icon[data-icon]').forEach(el => {
  el.innerHTML = icon(el.dataset.icon);
});

seedIfNeeded();
switchTab(location.hash.replace('#', '') || 'oggi');
initAuth();
