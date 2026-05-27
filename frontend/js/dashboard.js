// ─── dashboard.js ─────────────────────────────────────────────────────────────
const REFRESH_MS        = 1000;
const MAX_HISTORY       = 30;
const INACTIVITY_MS     = 10000; // 10s senza aggiornamenti → INATTIVO

let bpmChart        = null;
let bpmHistory      = [];
let lastId          = null;
let lastSeenAt      = null; // Date dell'ultimo battito ricevuto con timestamp valido
let initialized     = false; // true dopo il primo tick, evita falsi attivi al reload

document.addEventListener('DOMContentLoaded', () => {
  startClock(document.getElementById('clock'));
  initChart();
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

    // Inattivo se non riceviamo un nuovo id_battito da più di INACTIVITY_MS
    const inactive = !lastSeenAt || (Date.now() - lastSeenAt.getTime() > INACTIVITY_MS);

    if (inactive) {
      setInactive();
      setChartInactive();
    } else {
      updateStats(hb);
      // Aggiorna il grafico solo se è arrivato un battito nuovo
      if (hb.id !== null && hb.id !== lastId) {
        pushChart(hb);
      }
    }

    lastId = hb.id;

  } catch (e) {
    console.error('[dashboard/tick]', e.message);
    setInactive();
  }
}

// ── STATO INATTIVO ────────────────────────────────────────────────────────────
function setInactive() {
  const bpmEl = document.getElementById('stat-bpm');
  if (bpmEl) { bpmEl.textContent = '-'; bpmEl.className = 'stat-value'; }


  const tsEl = document.getElementById('stat-time');
  if (tsEl) tsEl.textContent = lastSeenAt
    ? 'Ultimo: ' + formatTimestamp(lastSeenAt.toISOString())
    : '-';

  const statusEl = document.getElementById('stat-status');
  if (statusEl) statusEl.innerHTML = '<span class="badge badge-inactive">INATTIVO</span>';

  const card = document.getElementById('card-bpm');
  if (card) { card.classList.remove('danger', 'warn', 'success'); card.classList.add('inactive'); }
  document.querySelectorAll('.refresh-dot').forEach(d => d.classList.add('dot-inactive'));
}

// ── STATO ATTIVO ──────────────────────────────────────────────────────────────
function updateStats(hb) {
  const v = Number(hb.bpm);

  const bpmEl = document.getElementById('stat-bpm');
  if (bpmEl) {
    bpmEl.textContent = hb.bpm ?? '?';
    bpmEl.className   = 'stat-value ' + bpmClass(hb.bpm);
  }


  const tsEl = document.getElementById('stat-time');
  if (tsEl) tsEl.textContent = formatTimestamp(hb.timestamp);

  const statusEl = document.getElementById('stat-status');
  if (statusEl) {
    if (hb.irregolare && v > 100) statusEl.innerHTML = '<span class="badge badge-red">TACHICARDIA IRREGOLARE</span>';
    else if (hb.irregolare)       statusEl.innerHTML = '<span class="badge badge-yellow">IRREGOLARE</span>';
    else if (v > 100)             statusEl.innerHTML = '<span class="badge badge-red">TACHICARDICO</span>';
    else if (v < 50)              statusEl.innerHTML = '<span class="badge badge-yellow">BRADICARDICO</span>';
    else                          statusEl.innerHTML = '<span class="badge badge-green">NORMALE</span>';
  }

  const card = document.getElementById('card-bpm');
  if (card) {
    card.classList.remove('danger', 'warn', 'inactive');
    if (v > 100 || hb.irregolare) card.classList.add('danger');
    else if (v < 50)              card.classList.add('warn');
  }
  document.querySelectorAll('.refresh-dot').forEach(d => d.classList.remove('dot-inactive'));
}

// ── CHART ─────────────────────────────────────────────────────────────────────
function initChart() {
  const canvas = document.getElementById('bpm-chart');
  if (!canvas || !window.Chart) return;

  bpmChart = new Chart(canvas.getContext('2d'), {
    type: 'line',
    data: {
      labels: [],
      datasets: [{
        label: 'BPM',
        data: [],
        borderColor: 'rgba(13,158,110,1)',
        backgroundColor: 'rgba(13,158,110,.07)',
        borderWidth: 2,
        pointRadius: 3,
        pointBackgroundColor: 'rgba(13,158,110,1)',
        tension: .35,
        fill: true,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 200 },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#ffffff',
          borderColor: '#dde3ec',
          borderWidth: 1,
          titleColor: '#5a6a82',
          bodyColor: '#1a2233',
        }
      },
      scales: {
        x: {
          ticks: { color: '#5a6a82', font: { family: 'JetBrains Mono', size: 10 }, maxTicksLimit: 8 },
          grid:  { color: '#dde3ec' }
        },
        y: {
          min: 30, max: 170,
          ticks: { color: '#5a6a82', font: { family: 'JetBrains Mono', size: 10 } },
          grid:  { color: '#dde3ec' }
        }
      }
    }
  });
}

// Chiamata solo quando arriva un battito con id nuovo
function pushChart(hb) {
  if (!bpmChart) return;

  const label = new Date().toLocaleTimeString('it-IT', {
    hour: '2-digit', minute: '2-digit', second: '2-digit'
  });

  bpmHistory.push({ label, bpm: Number(hb.bpm) });
  if (bpmHistory.length > MAX_HISTORY) bpmHistory.shift();

  bpmChart.data.labels           = bpmHistory.map(p => p.label);
  bpmChart.data.datasets[0].data = bpmHistory.map(p => p.bpm);

  const last = bpmHistory[bpmHistory.length - 1].bpm;
  let lineColor = 'rgba(13,158,110,1)', fillColor = 'rgba(13,158,110,.07)';
  if (last > 100)     { lineColor = 'rgba(217,48,37,1)';  fillColor = 'rgba(217,48,37,.07)'; }
  else if (last < 50) { lineColor = 'rgba(192,124,0,1)';  fillColor = 'rgba(192,124,0,.07)'; }

  bpmChart.data.datasets[0].borderColor          = lineColor;
  bpmChart.data.datasets[0].backgroundColor      = fillColor;
  bpmChart.data.datasets[0].pointBackgroundColor = lineColor;
  bpmChart.update('none');
}

// Chiamata quando il sensore diventa inattivo - grigia la linea, nessun punto nuovo
function setChartInactive() {
  if (!bpmChart) return;
  bpmChart.data.datasets[0].borderColor          = 'rgba(156,163,175,1)';
  bpmChart.data.datasets[0].backgroundColor      = 'rgba(156,163,175,.07)';
  bpmChart.data.datasets[0].pointBackgroundColor = 'rgba(156,163,175,1)';
  bpmChart.update('none');
}
