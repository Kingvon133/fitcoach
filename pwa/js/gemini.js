// Client Gemini API (REST v1beta) + loop agentico con function calling.
// Ricerca web: pattern "search-as-tool" — vedi docs/ARCHITECTURE.md.

import { store } from './store.js';
import { toolDeclarations, executeTool } from './tools.js';

const BASE = 'https://generativelanguage.googleapis.com/v1beta/models';
const MAX_TOOL_ITERATIONS = 6;

const SYSTEM_PROMPT = `Sei FitCoach, un coach virtuale esperto di nutrizione e allenamento con i pesi. Parli italiano, sei diretto, motivante e concreto. Hai accesso ai dati reali dell'utente tramite i tool: dieta preimpostata, diario alimentare, scheda di allenamento, storico carichi e peso corporeo.
Regole:
1) Usa SEMPRE i tool per leggere i dati reali invece di inventare.
2) Per sostituzioni di alimenti o esercizi: proponi prima l'alternativa con macro/dettagli, chiedi conferma, e SOLO dopo la conferma chiama replace_planned_food o replace_exercise.
3) Usa search_web per valori nutrizionali che non conosci con certezza, ricette o evidenze scientifiche recenti; cita le fonti quando le hai.
4) Quando l'utente descrive un pasto in linguaggio naturale, stima grammature e macro in modo realistico e registralo con log_food, poi riepiloga cosa hai registrato.
5) Risposte concise, formattate con elenchi quando utile. Non dare consigli medici: per infortuni seri suggerisci un professionista.`;

export class GeminiError extends Error {
  constructor(message, kind = 'api') {
    super(message);
    this.kind = kind;
  }
}

async function generateContent({ contents, tools, systemPrompt }) {
  const { apiKey, model } = store.getSettings();
  if (!apiKey) {
    throw new GeminiError('API key mancante: inseriscila nella tab Altro (gratis su aistudio.google.com).', 'no-key');
  }

  const body = { contents };
  if (systemPrompt) body.systemInstruction = { parts: [{ text: systemPrompt }] };
  if (tools) body.tools = tools;

  let response;
  try {
    response = await fetch(`${BASE}/${model || 'gemini-2.5-flash'}:generateContent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify(body),
    });
  } catch {
    throw new GeminiError('Nessuna connessione. Controlla la rete e riprova.', 'network');
  }

  if (response.status === 429) {
    throw new GeminiError('Limite gratuito raggiunto: attendi un minuto e riprova.', 'rate-limit');
  }

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const message = data?.error?.message || `HTTP ${response.status}`;
    throw new GeminiError(`Errore AI: ${message}`);
  }

  const candidate = data?.candidates?.[0];
  if (!candidate?.content) throw new GeminiError('Risposta non valida dal server AI. Riprova.');
  return candidate;
}

/**
 * Ricerca web via grounding Google Search: chiamata separata
 * con SOLO il tool googleSearch (non combinabile con functionDeclarations).
 */
export async function webSearch(query) {
  try {
    const candidate = await generateContent({
      systemPrompt: 'Rispondi in modo conciso e fattuale in italiano, citando i dati trovati.',
      contents: [{ role: 'user', parts: [{ text: query }] }],
      tools: [{ googleSearch: {} }],
    });
    const answer = (candidate.content.parts || []).map(p => p.text).filter(Boolean).join('\n');
    const sources = (candidate.groundingMetadata?.groundingChunks || [])
      .map(c => c.web ? `${c.web.title || ''}: ${c.web.uri}` : null)
      .filter(Boolean);
    return { answer: answer || 'Nessun risultato.', sources };
  } catch (error) {
    return { error: error.message };
  }
}

/**
 * Loop agentico. history = array di ChatMessage {role: 'user'|'assistant', text}.
 * onActivity(label) aggiorna la UI ("Sto cercando sul web…").
 * Ritorna il testo finale della risposta.
 */
export async function runAgent(userText, persistedHistory, onActivity = () => {}) {
  // Ricostruisce la history nel formato Gemini (solo testi persistiti)
  const contents = persistedHistory.slice(-30).map(m => ({
    role: m.role === 'user' ? 'user' : 'model',
    parts: [{ text: m.text }],
  }));
  contents.push({ role: 'user', parts: [{ text: userText }] });

  const tools = [{ functionDeclarations: toolDeclarations }];

  for (let i = 0; i < MAX_TOOL_ITERATIONS; i++) {
    onActivity('Sto pensando…');
    const candidate = await generateContent({ contents, tools, systemPrompt: SYSTEM_PROMPT });
    contents.push(candidate.content);

    const calls = (candidate.content.parts || []).filter(p => p.functionCall).map(p => p.functionCall);
    if (calls.length === 0) {
      const text = (candidate.content.parts || []).map(p => p.text).filter(Boolean).join('\n');
      return text || '…';
    }

    const responseParts = [];
    for (const call of calls) {
      onActivity(activityLabel(call.name));
      const result = await executeTool(call.name, call.args || {});
      responseParts.push({ functionResponse: { name: call.name, response: result } });
    }
    contents.push({ role: 'user', parts: responseParts });
  }

  return 'Ho fatto troppe operazioni di fila senza arrivare a una risposta. Riprova con una richiesta più specifica.';
}

function activityLabel(toolName) {
  const labels = {
    search_web: 'Sto cercando sul web…',
    get_diet_plan: 'Consulto la tua dieta…',
    get_today_nutrition: 'Consulto la tua dieta…',
    get_workout_plan: 'Consulto la tua scheda…',
    get_exercise_history: 'Analizzo i tuoi carichi…',
    log_food: 'Registro il pasto…',
    replace_planned_food: 'Aggiorno la dieta…',
    replace_exercise: 'Aggiorno la scheda…',
    log_weight: 'Registro il peso…',
    get_weight_history: 'Consulto il tuo peso…',
  };
  return labels[toolName] || 'Elaboro…';
}
