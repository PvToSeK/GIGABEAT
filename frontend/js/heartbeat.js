// ─── heartbeat.js ─────────────────────────────────────────────────────────────
const REFRESH_MS    = 1000;
const MAX_RECORDS   = 100;
const INACTIVITY_MS = 10000; // 10s senza aggiornamenti → INATTIVO

let readings    = [];
let lastId      = null;
let lastSeenAt  = null; // Date dell'ultimo battito con timestamp valido
let initialized = false; // true dopo il primo tick, evita falsi attivi al reload

document.addEventListener('DOMContentLoaded', () => {
  startClock(document.getElementById('clock'));
  tick();
  setInterval(tick, REFRESH_MS);
});

// ── POLLING ───────────────────────────────────────────────────────────────────
async function tick() {
  const lastEl = document.getElementById('last-refresh');
  if (lastEl) lastEl.textContent = new Date().toLocaleTimeString('it-IT');

  try {
    const raw = await API.heartbeat.latest();
    const hb  = normalizeHeartbeat(raw);

    // Al primo tick registriamo solo l'id di baseline senza attivare il sensore.
    // Questo evita che al reload la pagina appaia attiva prima di aver
    // confermato un battito realmente nuovo rispetto alla sessione precedente.
    if (!initialized) {
      initialized = true;
    } else if (hb.id !== null && hb.id !== lastId) {
      lastSeenAt = new Date();
    }

    const inactive = !lastSeenAt || (Date.now() - lastSeenAt.getTime() > INACTIVITY_MS);

    // Aggiorna banner stato sensore
    renderSensorStatus(inactive);

    // Aggiunge riga solo se battito nuovo e sensore attivo
    if (!inactive && hb.id !== null && hb.id !== lastId) {
      readings.unshift(hb);
      if (readings.length > MAX_RECORDS) readings.pop();
      renderSummary();
      renderTable();
    }

    // Aggiorna lastId sempre, come in dashboard.js,
    // altrimenti al secondo tick lastId è ancora null e lastSeenAt viene impostato erroneamente
    lastId = hb.id;

  } catch (e) {
    renderSensorStatus(true);
    renderError(document.getElementById('hb-error'), e.message);
  }
}

// ── BANNER STATO SENSORE ──────────────────────────────────────────────────────
function renderSensorStatus(inactive) {
  const el = document.getElementById('sensor-status');
  if (!el) return;

  document.querySelectorAll('.refresh-dot').forEach(d => d.classList.toggle('dot-inactive', inactive));

  if (inactive) {
    el.innerHTML = `
      <div class="alert-banner danger">
        <div>
          <strong>Segnale assente</strong> - nessun dato disponibile
          ${lastSeenAt ? `<span style="font-size:12px;opacity:.8"> · Ultimo: ${formatTimestamp(lastSeenAt.toISOString())}</span>` : ''}
        </div>
      </div>`;
  } else {
    el.innerHTML = `
      <div class="alert-banner info" style="padding:9px 14px">
        <span>Sensore attivo</span>
        <span class="refresh-tag" style="margin-left:auto">
          <span class="refresh-dot"></span> segnale ricevuto
        </span>
      </div>`;
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
  setText('hb-avg',   avg ? avg + ' BPM' : '-');
}

// ── TABELLA ───────────────────────────────────────────────────────────────────
function renderTable() {
  const tbody = document.getElementById('heartbeat-body');
  if (!tbody) return;

  if (!readings.length) {
    tbody.innerHTML = `
      <tr><td colspan="3">
        <div class="empty-state">
          In attesa del primo battito...
        </div>
      </td></tr>`;
    return;
  }

  tbody.innerHTML = readings.map(hb => {
    const v = Number(hb.bpm);

    let badge;
    if (hb.irregolare && v > 100) badge = '<span class="badge badge-red">Tachicardia + Irregolare</span>';
    else if (hb.irregolare)       badge = '<span class="badge badge-yellow">Irregolare</span>';
    else if (v > 100)             badge = '<span class="badge badge-red">Tachicardia</span>';
    else if (v < 50)              badge = '<span class="badge badge-yellow">Bradicardia</span>';
    else                          badge = '<span class="badge badge-green">Normale</span>';

    const rowBg = (v > 100 || hb.irregolare)
      ? 'background:#fff5f5'
      : v < 50 ? 'background:#fffbf0' : '';
 
    return `
      <tr style="${rowBg}">
        <td class="mono ${bpmClass(hb.bpm)}" style="font-size:18px;font-weight:600">${hb.bpm ?? '?'}</td>
        <td>${badge}</td>
        <td class="mono" style="color:var(--text-sub);font-size:12px">${formatTimestamp(hb.timestamp)}</td>
      </tr>`;
  }).join('');
}

// ── UTILS ─────────────────────────────────────────────────────────────────────
function setText(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}
