// Utility UI condivise: escape, markdown minimale, grafici SVG, toast.

export function escapeHtml(text) {
  return String(text)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

// Markdown minimale e sicuro: prima escape, poi pattern. Per le bolle chat.
export function renderMarkdown(text) {
  const escaped = escapeHtml(text);
  const withInline = escaped
    .replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/(https?:\/\/[^\s<)]+)/g, '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>');

  const lines = withInline.split('\n');
  let html = '';
  let inList = false;
  for (const line of lines) {
    const item = line.match(/^\s*(?:[-*•]|\d+[.)])\s+(.*)$/);
    if (item) {
      if (!inList) { html += '<ul>'; inList = true; }
      html += `<li>${item[1]}</li>`;
    } else {
      if (inList) { html += '</ul>'; inList = false; }
      if (line.trim()) html += `<p>${line}</p>`;
    }
  }
  if (inList) html += '</ul>';
  return html || '<p></p>';
}

let gradientSeq = 0;
const GRADIENTS = {
  green: ['#30d158', '#0acf83'],
  orange: ['#ff9f0a', '#ff6482'],
  blue: ['#0a84ff', '#5e5ce6'],
  purple: ['#bf5af2', '#af52de'],
};

function gradientDef(colorKey) {
  const stops = GRADIENTS[colorKey] || GRADIENTS.green;
  const id = `fc-grad-${colorKey}-${gradientSeq++}`;
  const def = `<linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0%" stop-color="${stops[0]}"/>
    <stop offset="100%" stop-color="${stops[1]}"/>
  </linearGradient>`;
  return { id, def };
}

/**
 * Line chart SVG minimale (stile Swift Charts), con tratto in gradiente.
 * points: [{label, value}] — ritorna stringa SVG.
 */
export function lineChart(points, { height = 120, colorKey = 'green' } = {}) {
  if (points.length < 2) return '<p class="muted center">Servono almeno 2 misurazioni.</p>';

  const w = 320, h = height, padX = 6, padY = 12;
  const values = points.map(p => p.value);
  const min = Math.min(...values), max = Math.max(...values);
  const range = max - min || 1;

  const x = (i) => padX + (i / (points.length - 1)) * (w - padX * 2);
  const y = (v) => h - padY - ((v - min) / range) * (h - padY * 2);

  const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(p.value).toFixed(1)}`).join(' ');
  const area = `${path} L${x(points.length - 1).toFixed(1)},${h - padY} L${x(0).toFixed(1)},${h - padY} Z`;
  const last = points[points.length - 1];
  const { id, def } = gradientDef(colorKey);

  return `<svg class="chart-svg" viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg" role="img">
    <defs>${def}</defs>
    <path d="${area}" fill="url(#${id})" opacity="0.14"/>
    <path d="${path}" fill="none" stroke="url(#${id})" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="${x(points.length - 1).toFixed(1)}" cy="${y(last.value).toFixed(1)}" r="4.5" fill="url(#${id})"/>
  </svg>`;
}

/** Anello progresso SVG (kcal), con tratto in gradiente. */
export function progressRing(progress, { size = 116, stroke = 12, colorKey = 'green' } = {}) {
  const clamped = Math.min(Math.max(progress, 0), 1);
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - clamped);
  const { id, def } = gradientDef(colorKey);
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <defs>${def}</defs>
    <circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="var(--fill)" stroke-width="${stroke}"/>
    <circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="url(#${id})" stroke-width="${stroke}"
      stroke-linecap="round" stroke-dasharray="${c.toFixed(1)}" stroke-dashoffset="${offset.toFixed(1)}"
      transform="rotate(-90 ${size / 2} ${size / 2})" style="transition: stroke-dashoffset 0.5s ease"/>
  </svg>`;
}

let toastTimer = null;
export function showToast(message) {
  let el = document.querySelector('.toast');
  if (!el) {
    el = document.createElement('div');
    el.className = 'toast';
    document.body.appendChild(el);
  }
  el.textContent = message;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 2200);
}

export function formatDateShort(isoDate) {
  const [y, m, d] = isoDate.split('-');
  return `${d}/${m}`;
}
