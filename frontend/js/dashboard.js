// ─── dashboard.js — monitor personale ────────────────────────────────────────
const REFRESH_MS  = 2000;
const MAX_HISTORY = 30; // punti nel grafico

let bpmChart   = null;
let bpmHistory = []; // { label, bpm }[]
let lastId     = null;

// ── INIT ──────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  startClock(document.getElementById('clock'));
  initChart();
  tick();
  setInterval(tick, REFRESH_MS);
});

// ── POLLING ───────────────────────────────────────────────────────────────────
async function tick() {
  try {
    const raw = await API.heartbeat.latest();
    const hb  = normalizeHeartbeat(raw);

    updateStats(hb);
    pushChart(hb);

    const lastEl = document.getElementById('last-refresh');
    if (lastEl) lastEl.textContent = new Date().toLocaleTimeString('it-IT');

  } catch (e) {
    console.error('[dashboard]', e.message);
    setBpmError();
  }
}

// ── STATS ─────────────────────────────────────────────────────────────────────
function updateStats(hb) {
  const bpm = hb.bpm ?? '?';
  const v   = Number(bpm);

  // Valore BPM
  const bpmEl = document.getElementById('stat-bpm');
  if (bpmEl) {
    bpmEl.textContent = bpm;
    bpmEl.className   = 'stat-value ' + bpmClass(bpm);
  }

  // Sensore
  const sensorEl = document.getElementById('stat-sensor');
  if (sensorEl) sensorEl.textContent = `Sensore #${hb.id_sensore ?? '?'}`;

  // Timestamp
  const tsEl = document.getElementById('stat-time');
  if (tsEl) tsEl.textContent = formatTimestamp(hb.timestamp);

  // Badge stato
  const statusEl = document.getElementById('stat-status');
  if (statusEl) {
    if (hb.irregolare) {
      statusEl.innerHTML = '<span class="badge badge-yellow">⚡ IRREGOLARE</span>';
    } else if (v > 100) {
      statusEl.innerHTML = '<span class="badge badge-red">⬆ TACHICARDICO</span>';
    } else if (v < 50) {
      statusEl.innerHTML = '<span class="badge badge-yellow">⬇ BRADICARDICO</span>';
    } else {
      statusEl.innerHTML = '<span class="badge badge-green">✓ NORMALE</span>';
    }
  }

  // Card colore dinamico
  const card = document.getElementById('card-bpm');
  if (card) {
    card.classList.remove('danger','warn');
    if (v > 100 || hb.irregolare) card.classList.add('danger');
    else if (v < 50)              card.classList.add('warn');
  }
}

function setBpmError() {
  const el = document.getElementById('stat-bpm');
  if (el) { el.textContent = '—'; el.className = 'stat-value'; }
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
        borderColor: '#00e5b0',
        backgroundColor: 'rgba(0,229,176,.07)',
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
      animation: { duration: 300 },
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
          ticks: { color: '#5a7ab5', font: { family: 'DM Mono', size: 10 }, maxTicksLimit: 8 },
          grid:  { color: '#1c2d52' }
        },
        y: {
          min: 30, max: 170,
          ticks: { color: '#5a7ab5', font: { family: 'DM Mono', size: 10 } },
          grid:  { color: '#1c2d52' }
        }
      }
    }
  });
}

function pushChart(hb) {
  if (!bpmChart) return;

  // Aggiungi solo se è un battito nuovo (id diverso dall'ultimo)
  if (hb.id !== null && hb.id === lastId) return;
  lastId = hb.id;

  const label = hb.timestamp
    ? new Date(hb.timestamp).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : new Date().toLocaleTimeString('it-IT');

  bpmHistory.push({ label, bpm: Number(hb.bpm) });
  if (bpmHistory.length > MAX_HISTORY) bpmHistory.shift();

  bpmChart.data.labels            = bpmHistory.map(p => p.label);
  bpmChart.data.datasets[0].data  = bpmHistory.map(p => p.bpm);

  // Colora la linea in base all'ultimo valore
  const last = bpmHistory[bpmHistory.length - 1].bpm;
  const color = last > 100 ? '#ff3d6b' : last < 50 ? '#ffc234' : '#00e5b0';
  bpmChart.data.datasets[0].borderColor      = color;
  bpmChart.data.datasets[0].backgroundColor  = color.replace(')', ',.07)').replace('rgb','rgba');

  bpmChart.update();
}
