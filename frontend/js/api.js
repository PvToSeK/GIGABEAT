// ─── api.js - GigaBeat (single-patient edition) ──────────────────────────────
const BASE_URL = 'https://gigabeat-production.up.railway.app/api';

// Aggiungi header auth qui se necessario, es: { 'Authorization': 'Bearer TOKEN' }
const AUTH_HEADERS = {};

async function apiFetch(path) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...AUTH_HEADERS }
  });
  if (!res.ok) {
    const msg = await res.text().catch(() => res.statusText);
    throw new Error(`API ${res.status}: ${msg}`);
  }
  return res.json();
}

// ─── ENDPOINTS DISPONIBILI ────────────────────────────────────────────────────
const API = {
  heartbeat: {
    // Risposta: { id_battito, id_sensore, bpm, timestamp, irregolare }
    latest: () => apiFetch('/heartbeat/latest'),
  },
};

// ─── NORMALIZZAZIONE ─────────────────────────────────────────────────────────
function normalizeHeartbeat(h) {
  return {
    id:         h.id_battito ?? h.id ?? null,
    id_sensore: h.id_sensore ?? null,
    bpm:        h.bpm        ?? null,
    timestamp:  h.timestamp  ?? h.created_at ?? null,
    irregolare: Boolean(h.irregolare), // 0→false, 1→true
  };
}

// ─── UTILS CONDIVISI ─────────────────────────────────────────────────────────
function formatTimestamp(ts) {
  if (!ts) return '-';
  const d = new Date(ts);
  if (isNaN(d)) return ts;
  return d.toLocaleTimeString('it-IT') + ' ' + d.toLocaleDateString('it-IT');
}

/** 'bpm-ok' | 'bpm-high' | 'bpm-low' */
function bpmClass(bpm) {
  const v = Number(bpm);
  if (v > 100) return 'bpm-high';
  if (v < 50)  return 'bpm-low';
  return 'bpm-ok';
}

function renderLoader(el) {
  if (!el) return;
  el.innerHTML = `<div class="loader"><div class="spinner"></div>Caricamento...</div>`;
}

function renderError(el, msg) {
  if (!el) return;
  el.innerHTML = `<div class="error-box"><span>⚠</span> ${msg}</div>`;
}

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
