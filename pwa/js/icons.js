// Icone SVG minimali, stroke-based, in stile SF Symbols. Tutte usano currentColor
// così ereditano il colore del testo/contesto (tab attiva, bottoni, ecc).

const ICONS = {
  // Tab bar
  grid: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7.5" height="7.5" rx="1.8"/><rect x="13.5" y="3" width="7.5" height="7.5" rx="1.8"/><rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.8"/><rect x="3" y="13.5" width="7.5" height="7.5" rx="1.8"/></svg>`,
  bowl: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 11c0 4.4 3.6 8 8 8s8-3.6 8-8"/><line x1="2.5" y1="11" x2="21.5" y2="11"/><line x1="9" y1="21" x2="15" y2="21"/><line x1="12" y1="19" x2="12" y2="21"/></svg>`,
  dumbbell: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="1.5" y="10" width="2.2" height="4" rx="0.8"/><rect x="5" y="7.3" width="3" height="9.4" rx="1.3"/><line x1="8.2" y1="12" x2="15.8" y2="12"/><rect x="16" y="7.3" width="3" height="9.4" rx="1.3"/><rect x="20.3" y="10" width="2.2" height="4" rx="0.8"/></svg>`,
  sparkles: `<svg viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M11.5 3c.35 2.9 1.15 4.75 2.3 5.9s3 1.95 5.9 2.3c-2.9.35-4.75 1.15-5.9 2.3s-1.95 3-2.3 5.9c-.35-2.9-1.15-4.75-2.3-5.9S6.2 11.55 3.3 11.2c2.9-.35 4.75-1.15 5.9-2.3S11.15 5.9 11.5 3Z"/><path d="M19 2.6c.14 1.1.44 1.85.86 2.27.42.42 1.17.72 2.27.86-1.1.14-1.85.44-2.27.86-.42.42-.72 1.17-.86 2.27-.14-1.1-.44-1.85-.86-2.27C17.72 6.17 16.97 5.87 15.87 5.73c1.1-.14 1.85-.44 2.27-.86.42-.42.72-1.17.86-2.27Z"/></svg>`,
  gear: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82A1.65 1.65 0 0 0 3 13.09H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z"/></svg>`,

  // Azioni
  camera: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 8.5A1.5 1.5 0 0 1 4.5 7h2.6l1.2-2h7.4l1.2 2h2.6A1.5 1.5 0 0 1 21 8.5v9A1.5 1.5 0 0 1 19.5 19h-15A1.5 1.5 0 0 1 3 17.5v-9Z"/><circle cx="12" cy="12.7" r="3.6"/></svg>`,
  close: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>`,
  check: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7"/></svg>`,
  plus: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>`,
  chevronDown: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>`,
  scale: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="4"/><path d="M8 15c.6-3 2-4.6 4-4.6s3.4 1.6 4 4.6"/><circle cx="12" cy="8.3" r="1.1" fill="currentColor" stroke="none"/></svg>`,
  flame: `<svg viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M12.2 2.2c.7 2.6-.1 4.3-1.6 6C8.8 10.2 7 12 7 14.8A5 5 0 0 0 12 19.8a5 5 0 0 0 5-5c0-2.1-1-3.3-2.1-4.4.3 1.7-.3 2.8-1.3 3.5.2-2.1-.7-3.3-1.9-4.5-1.5-1.5-2.1-3.1-1.5-5.2-1.1.5-2.1 1.2-2.9 2.2Z"/></svg>`,
  target: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none"/></svg>`,
  send: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V6M6 11l6-6 6 6"/></svg>`,
  folder: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3.5 6.5A1.5 1.5 0 0 1 5 5h4l2 2.2h8a1.5 1.5 0 0 1 1.5 1.5v9A1.5 1.5 0 0 1 19 19.2H5A1.5 1.5 0 0 1 3.5 17.7v-11.2Z"/></svg>`,

  // Badge dei pasti
  sun: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="4.2"/><path d="M12 2.5v2.4M12 19.1v2.4M4.2 4.2l1.7 1.7M18.1 18.1l1.7 1.7M2.5 12h2.4M19.1 12h2.4M4.2 19.8l1.7-1.7M18.1 5.9l1.7-1.7"/></svg>`,
  leaf: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 19c9 0 14-5 14-14-9 0-14 5-14 14Z"/><path d="M5 19c0-5 2-8 6-10.5"/></svg>`,
  moon: `<svg viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M20.5 14.8A8.5 8.5 0 1 1 9.2 3.5a7 7 0 0 0 11.3 11.3Z"/></svg>`,
  drop: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2.8c3.2 4 6.5 7.7 6.5 11.4a6.5 6.5 0 1 1-13 0c0-3.7 3.3-7.4 6.5-11.4Z"/></svg>`,
  user: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8.2" r="3.6"/><path d="M4.5 20c1.3-4 4.2-6 7.5-6s6.2 2 7.5 6"/></svg>`,
  cloud: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M7 18.5a4.3 4.3 0 0 1-1-8.5 5.5 5.5 0 0 1 10.7-2 4.5 4.5 0 0 1-.7 10.5H7Z"/></svg>`,
};

export function icon(name, className = '') {
  const svg = ICONS[name] || '';
  if (!svg) return '';
  return className ? svg.replace('<svg ', `<svg class="${className}" `) : svg;
}
