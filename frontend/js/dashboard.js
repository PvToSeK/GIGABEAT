// ─── dashboard.js ────────────────────────────────────────────────────────────
// Logica per index.html — si aggiorna ogni REFRESH_MS millisecondi

const REFRESH_MS = 2000;
let bpmChart = null;
let bpmHistory = []; // { time, bpm }[]

// ─── INIT ─────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  startClock(document.getElementById('clock'));
  initChart();
  loadDashboard();
  setInterval(loadDashboard, REFRESH_MS);
});

async function loadDashboard() {
  await Promise.allSettled([
    loadLatestHeartbeat(),
    loadPatientStats(),
  ]);
  // Aggiorna indicatore refresh
  const el = document.getElementById('last-refresh');
  if (el) el.textContent = new Date().toLocaleTimeString('it-IT');
}

// ─── LATEST HEARTBEAT ────────────────────────────────────────────────────────
async function loadLatestHeartbeat() {
  const bpmEl     = document.getElementById('stat-bpm');
  const cfEl      = document.getElementById('stat-cf');
  const timeEl    = document.getElementById('stat-time');
  const statusEl  = document.getElementById('stat-status');

  try {
    const raw  = await API.heartbeat.latest();
    const data = normalizeHeartbeat(raw);

    // Struttura reale: { id_battito, id_sensore, bpm, timestamp, irregolare }
    const bpm  = data.bpm ?? '?';
    const cf   = `Sensore #${data.id_sensore ?? '?'}`;
    const ts   = data.timestamp;

    if (bpmEl) {
      bpmEl.textContent = bpm;
      bpmEl.className = 'stat-value ' + bpmClass(bpm);
    }
    if (cfEl)   cfEl.textContent = cf;
    if (timeEl) timeEl.textContent = formatTimestamp(ts);
    if (statusEl) {
      const v = Number(bpm);
      if (data.irregolare) {
        statusEl.innerHTML = '<span class="badge badge-yellow">⚡ IRREGOLARE</span>';
      } else if (v > 100) {
        statusEl.innerHTML = '<span class="badge badge-red">⚠ TACHICARDICO</span>';
      } else if (v < 50) {
        statusEl.innerHTML = '<span class="badge badge-yellow">⚠ BRADICARDICO</span>';
      } else {
        statusEl.innerHTML = '<span class="badge badge-green">✓ NORMALE</span>';
      }
    }

    // Aggiungi al grafico
    pushBpmHistory(bpm, ts);

  } catch (e) {
    if (bpmEl) bpmEl.textContent = 'ERR';
    console.error('[heartbeat/latest]', e);
  }
}

// ─── PATIENT STATS ───────────────────────────────────────────────────────────
async function loadPatientStats() {
  const countEl = document.getElementById('stat-patients');
  try {
    const data = await API.patients.all();
    const list = Array.isArray(data) ? data : (data.patients ?? data.data ?? []);
    if (countEl) countEl.textContent = list.length;

    // Popola tabella ultimi pazienti
    renderRecentPatients(list.slice(0, 6));
  } catch (e) {
    if (countEl) countEl.textContent = '—';
    console.error('[patients/all]', e);
  }
}

function renderRecentPatients(patients) {
  const tbody = document.getElementById('recent-patients-body');
  if (!tbody) return;
  if (!patients.length) { renderEmpty(tbody.parentElement.parentElement); return; }

  tbody.innerHTML = patients.map(p => {
    const nome = p.nome ?? p.name ?? '—';
    const cf   = p.cf ?? p.codice_fiscale ?? '—';
    const eta  = p.eta ?? p.age ?? '—';
    const stato= p.stato ?? p.status ?? '—';
    return `
      <tr onclick="location.href='patient.html?cf=${cf}'">
        <td class="mono">${cf}</td>
        <td>${nome}</td>
        <td>${eta}</td>
        <td>${statusBadge(stato)}</td>
      </tr>`;
  }).join('');
}

function statusBadge(stato) {
  const s = String(stato).toLowerCase();
  if (s.includes('critico') || s.includes('critic')) return `<span class="badge badge-red">🔴 ${stato}</span>`;
  if (s.includes('osservaz') || s.includes('attenz')) return `<span class="badge badge-yellow">🟡 ${stato}</span>`;
  return `<span class="badge badge-green">🟢 ${stato || 'Normale'}</span>`;
}

// ─── CHART ───────────────────────────────────────────────────────────────────
function initChart() {
  const canvas = document.getElementById('bpm-chart');
  if (!canvas || !window.Chart) return;

  const ctx = canvas.getContext('2d');
  bpmChart = new window.Chart(ctx, {
    type: 'line',
    data: {
      labels: [],
      datasets: [{
        label: 'BPM',
        data: [],
        borderColor: '#00e5b0',
        backgroundColor: 'rgba(0,229,176,.08)',
        borderWidth: 2,
        pointRadius: 3,
        pointBackgroundColor: '#00e5b0',
        tension: .35,
        fill: true,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 400 },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#0d1526',
          borderColor: '#1c2d52',
          borderWidth: 1,
          titleColor: '#5a7ab5',
          bodyColor: '#dce8ff',
        }
      },
      scales: {
        x: {
          ticks: { color: '#5a7ab5', font: { family: 'DM Mono', size: 10 } },
          grid:  { color: '#1c2d52' }
        },
        y: {
          min: 30, max: 160,
          ticks: { color: '#5a7ab5', font: { family: 'DM Mono', size: 10 } },
          grid:  { color: '#1c2d52' }
        }
      }
    }
  });
}

function pushBpmHistory(bpm, ts) {
  if (!bpmChart) return;
  const label = ts ? new Date(ts).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : new Date().toLocaleTimeString('it-IT');
  bpmHistory.push({ label, bpm: Number(bpm) });
  if (bpmHistory.length > 20) bpmHistory.shift(); // mantieni ultimi 20 punti

  bpmChart.data.labels   = bpmHistory.map(h => h.label);
  bpmChart.data.datasets[0].data = bpmHistory.map(h => h.bpm);
  bpmChart.update();
}
