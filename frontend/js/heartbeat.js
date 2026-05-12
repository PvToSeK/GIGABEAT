// ─── heartbeat.js ─────────────────────────────────────────────────────────────
// Accumula battiti in memoria pollingando /latest ogni 2s.
// Aggiunge un nuovo record solo quando id_battito cambia.

const REFRESH_MS  = 2000;
const MAX_RECORDS = 100;

let readings = [];
let lastId   = null;

document.addEventListener('DOMContentLoaded', () => {
  startClock(document.getElementById('clock'));
  tick();
  setInterval(tick, REFRESH_MS);
});

// ── POLLING ───────────────────────────────────────────────────────────────────
async function tick() {
  // Aggiorna SEMPRE il timestamp — fuori dal try, fuori da qualsiasi guard
  const lastEl = document.getElementById('last-refresh');
  if (lastEl) lastEl.textContent = new Date().toLocaleTimeString('it-IT');

  try {
    const raw = await API.heartbeat.latest();
    const hb  = normalizeHeartbeat(raw);

    // Battito già registrato → nessuna nuova riga, ma il clock ha già aggiornato
    if (hb.id !== null && hb.id === lastId) return;
    lastId = hb.id;

    readings.unshift(hb);                          // più recente in cima
    if (readings.length > MAX_RECORDS) readings.pop();

    renderSummary();
    renderTable();

  } catch (e) {
    const errEl = document.getElementById('hb-error');
    renderError(errEl, e.message);
  }
}

// ── SUMMARY ───────────────────────────────────────────────────────────────────
function renderSummary() {
  const bpms  = readings.map(r => Number(r.bpm)).filter(v => v > 0);
  const high  = bpms.filter(v => v > 100).length;
  const low   = bpms.filter(v => v < 50).length;
  const irreg = readings.filter(r => r.irregolare).length;
  const avg   = bpms.length
    ? Math.round(bpms.reduce((a, b) => a + b, 0) / bpms.length)
    : 0;

  setText('hb-total', readings.length);
  setText('hb-high',  high);
  setText('hb-low',   low);
  setText('hb-irreg', irreg);
  setText('hb-avg',   avg ? avg + ' BPM' : '—');
}

// ── TABELLA ───────────────────────────────────────────────────────────────────
function renderTable() {
  const tbody = document.getElementById('heartbeat-body');
  if (!tbody) return;

  if (!readings.length) {
    tbody.innerHTML = `
      <tr><td colspan="4">
        <div class="empty-state">
          <div class="icon">💓</div>
          In attesa del primo battito...
        </div>
      </td></tr>`;
    return;
  }

  tbody.innerHTML = readings.map(hb => {
    const v = Number(hb.bpm);

    let badge;
    if (hb.irregolare && v > 100) badge = '<span class="badge badge-red">⚠ Tachicardia + Irregolare</span>';
    else if (hb.irregolare)       badge = '<span class="badge badge-yellow">⚡ Irregolare</span>';
    else if (v > 100)             badge = '<span class="badge badge-red">⬆ Tachicardia</span>';
    else if (v < 50)              badge = '<span class="badge badge-yellow">⬇ Bradicardia</span>';
    else                          badge = '<span class="badge badge-green">✓ Normale</span>';

    const rowBg = (v > 100 || hb.irregolare)
      ? 'background:rgba(255,61,107,.04)'
      : v < 50 ? 'background:rgba(255,194,52,.04)' : '';

    return `
      <tr style="${rowBg}">
        <td class="mono ${bpmClass(hb.bpm)}" style="font-size:18px;font-weight:600">${hb.bpm ?? '?'}</td>
        <td>${badge}</td>
        <td class="mono" style="color:var(--text-sub);font-size:12px">${formatTimestamp(hb.timestamp)}</td>
        <td class="mono" style="color:var(--text-dim);font-size:11px">#${hb.id ?? '—'}</td>
      </tr>`;
  }).join('');
}

// ── UTILS ─────────────────────────────────────────────────────────────────────
function setText(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}
