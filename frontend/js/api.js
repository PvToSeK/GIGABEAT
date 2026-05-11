// ─── api.js — Fetch centralizzato GigaBeat ───────────────────────────────────
// Cambia BASE_URL se l'endpoint cambia
const BASE_URL = 'https://gigabeat-production.up.railway.app/api';

// Opzionale: aggiungi qui header di autenticazione se richiesti
// Es: const AUTH_HEADERS = { 'Authorization': 'Bearer TOKEN' };
const AUTH_HEADERS = {};

/**
 * Fetch generico con gestione errori
 * @param {string} path  - es. '/patients/all'
 * @returns {Promise<any>}
 */
async function apiFetch(path) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...AUTH_HEADERS
    }
  });
  if (!res.ok) {
    const msg = await res.text().catch(() => res.statusText);
    throw new Error(`API ${res.status}: ${msg}`);
  }
  return res.json();
}

// ─── ENDPOINTS ───────────────────────────────────────────────────────────────
const API = {
  heartbeat: {
    latest:  () => apiFetch('/heartbeat/latest'),
    all:     () => apiFetch('/heartbeat/all'),
    byPatient: (cf) => apiFetch(`/heartbeat/${cf}`), // se esiste
  },
  patients: {
    all:    () => apiFetch('/patients/all'),
    byCF:   (cf) => apiFetch(`/patients/${cf}`),
  },
  positions: {
    latest: (cf) => apiFetch(`/positions/latest/${cf}`),
  },
  emergencies: {
    all: () => apiFetch('/emergencies/all'), // da aggiungere nel backend
  }
};

// ─── UTILS ───────────────────────────────────────────────────────────────────

/** Formatta timestamp ISO → "HH:MM:SS DD/MM/YYYY" */
function formatTimestamp(ts) {
  if (!ts) return '—';
  const d = new Date(ts);
  if (isNaN(d)) return ts;
  return d.toLocaleTimeString('it-IT') + ' ' + d.toLocaleDateString('it-IT');
}

/**
 * Normalizza un oggetto battito al formato interno standard.
 * Struttura reale API: { id_battito, id_sensore, bpm, timestamp, irregolare }
 */
function normalizeHeartbeat(h) {
  return {
    id:         h.id_battito  ?? h.id ?? null,
    id_sensore: h.id_sensore  ?? null,
    bpm:        h.bpm         ?? null,
    timestamp:  h.timestamp   ?? h.created_at ?? null,
    irregolare: Boolean(h.irregolare), // 0 → false, 1 → true
  };
}

/** Ritorna badge HTML per un valore BPM */
function bpmBadge(bpm) {
  const v = Number(bpm);
  if (isNaN(v)) return `<span class="mono">—</span>`;
  if (v > 100) return `<span class="badge badge-red">⬆ ${v} BPM</span>`;
  if (v < 50)  return `<span class="badge badge-yellow">⬇ ${v} BPM</span>`;
  return `<span class="badge badge-green">${v} BPM</span>`;
}

/** Classifica BPM: 'high' | 'low' | 'ok' */
function bpmClass(bpm) {
  const v = Number(bpm);
  if (v > 100) return 'bpm-high';
  if (v < 50)  return 'bpm-low';
  return 'bpm-ok';
}

/** Clona un template HTML nascosto */
function renderLoader(container) {
  container.innerHTML = `
    <div class="loader">
      <div class="spinner"></div>
      Caricamento dati...
    </div>`;
}

function renderError(container, msg) {
  container.innerHTML = `
    <div class="error-box">
      <span>⚠</span> ${msg}
    </div>`;
}

function renderEmpty(container, msg = 'Nessun dato disponibile') {
  container.innerHTML = `
    <div class="empty-state">
      <div class="icon">📭</div>
      ${msg}
    </div>`;
}

/** Aggiorna il clock in topbar */
function startClock(el) {
  if (!el) return;
  const tick = () => {
    el.textContent = new Date().toLocaleTimeString('it-IT', {
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    });
  };
  tick();
  setInterval(tick, 1000);
}
