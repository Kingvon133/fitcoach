import { store } from '../store.js';
import { runAgent, GeminiError } from '../gemini.js';
import { escapeHtml, renderMarkdown } from '../ui.js';
import { icon } from '../icons.js';

let isBusy = false;

const SUGGESTIONS = [
  'Cosa mi manca per chiudere i macro di oggi?',
  'Non ho il pollo, alternativa con gli stessi macro?',
  'Ho male alla spalla, sostituisci la panca piana',
  'Come sta andando la mia progressione in stacco?',
];

export function renderChat(container) {
  const messages = store.getChat();
  const hasKey = Boolean(store.getSettings().apiKey);

  container.innerHTML = `
    <div class="chat-page">
      ${hasKey ? '' : `<div class="banner warn">⚠️ Manca la API key Gemini (gratuita). Vai nella tab <b>Altro</b> per configurarla in 2 minuti.</div>`}
      <div class="chat-scroll" id="chat-scroll">
        ${messages.length === 0 ? emptyState() : messages.map(bubble).join('')}
        <div id="chat-activity"></div>
      </div>
      <div class="chat-inputbar">
        <textarea id="chat-input" rows="1" placeholder="Chiedi al tuo coach…" ${isBusy ? 'disabled' : ''}></textarea>
        <button class="send-btn" id="chat-send" ${isBusy ? 'disabled' : ''} aria-label="Invia">${icon('send')}</button>
      </div>
    </div>
  `;

  const input = container.querySelector('#chat-input');
  const sendBtn = container.querySelector('#chat-send');

  const send = () => {
    const text = input.value.trim();
    if (text && !isBusy) {
      input.value = '';
      handleSend(container, text);
    }
  };

  sendBtn.addEventListener('click', send);
  input.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      send();
    }
  });
  input.addEventListener('input', () => {
    input.style.height = 'auto';
    input.style.height = Math.min(input.scrollHeight, 110) + 'px';
  });

  container.querySelectorAll('.suggestion').forEach(btn => {
    btn.addEventListener('click', () => handleSend(container, btn.dataset.text));
  });

  scrollToBottom(container);
}

function emptyState() {
  return `
    <div class="empty-hero">
      <div class="big"><span class="hero-glyph">${icon('sparkles')}</span></div>
      <h2>Il tuo coach personale</h2>
      <p>Conosce la tua dieta, la tua scheda e i tuoi progressi.<br>Può cercare sul web e modificare i tuoi piani.</p>
    </div>
    <div class="suggestions">
      ${SUGGESTIONS.map(s => `<button class="suggestion" data-text="${escapeHtml(s)}">${escapeHtml(s)}</button>`).join('')}
    </div>
  `;
}

function bubble(message) {
  const roleClass = message.role === 'user' ? 'user' : 'assistant';
  return `<div class="bubble ${roleClass}">${renderMarkdown(message.text)}</div>`;
}

async function handleSend(container, text) {
  if (isBusy) return;
  isBusy = true;

  const history = store.getChat(); // history PRIMA del nuovo messaggio
  store.addChatMessage('user', text);
  renderChat(container);
  setActivity(container, 'Sto pensando…');

  try {
    const reply = await runAgent(text, history, (label) => setActivity(container, label));
    store.addChatMessage('assistant', reply);
  } catch (error) {
    const message = error instanceof GeminiError
      ? error.message
      : 'Qualcosa è andato storto. Riprova.';
    store.addChatMessage('assistant', `⚠️ ${message}`);
  } finally {
    isBusy = false;
    renderChat(container);
  }
}

function setActivity(container, label) {
  const el = container.querySelector('#chat-activity');
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
