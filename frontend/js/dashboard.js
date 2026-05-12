// ─── dashboard.js ─────────────────────────────────────────────────────────────
const REFRESH_MS  = 2000;
const MAX_HISTORY = 30;

let bpmChart   = null;
let bpmHistory = [];
let lastId     = null; // usato solo per il badge "nuovo battito", non per il grafico

document.addEventListener('DOMContentLoaded', () => {
  startClock(document.getElementById('clock'));
  initChart();
  tick();
  setInterval(tick, REFRESH_MS);
});

// ── POLLING ───────────────────────────────────────────────────────────────────
async function tick() {
  // Aggiorna SEMPRE il timestamp — prima di qualsiasi await o guard
  const lastEl = document.getElementById('last-refresh');
  if (lastEl) lastEl.textContent = new Date().toLocaleTimeString('it-IT');

  try {
    const raw = await API.heartbeat.latest();
    const hb  = normalizeHeartbeat(raw);

    updateStats(hb);
    pushChart(hb); // il grafico riceve un punto ad ogni tick, sempre
    lastId = hb.id;

  } catch (e) {
    console.error('[dashboard/tick]', e.message);
    const bpmEl = document.getElementById('stat-bpm');
    if (bpmEl) { bpmEl.textContent = '—'; bpmEl.className = 'stat-value'; }
  }
}

// ── STATS ─────────────────────────────────────────────────────────────────────
function updateStats(hb) {
  const v = Number(hb.bpm);

  const bpmEl = document.getElementById('stat-bpm');
  if (bpmEl) {
    bpmEl.textContent = hb.bpm ?? '?';
    bpmEl.className   = 'stat-value ' + bpmClass(hb.bpm);
  }

  const sensorEl = document.getElementById('stat-sensor');
  if (sensorEl) sensorEl.textContent = `Sensore #${hb.id_sensore ?? '?'}`;

  const tsEl = document.getElementById('stat-time');
  if (tsEl) tsEl.textContent = formatTimestamp(hb.timestamp);

  const statusEl = document.getElementById('stat-status');
  if (statusEl) {
    if (hb.irregolare && v > 100) statusEl.innerHTML = '<span class="badge badge-red">⚡ TACHICARDIA IRREGOLARE</span>';
    else if (hb.irregolare)       statusEl.innerHTML = '<span class="badge badge-yellow">⚡ IRREGOLARE</span>';
    else if (v > 100)             statusEl.innerHTML = '<span class="badge badge-red">⬆ TACHICARDICO</span>';
    else if (v < 50)              statusEl.innerHTML = '<span class="badge badge-yellow">⬇ BRADICARDICO</span>';
    else                          statusEl.innerHTML = '<span class="badge badge-green">✓ NORMALE</span>';
  }

  const card = document.getElementById('card-bpm');
  if (card) {
    card.classList.remove('danger', 'warn');
    if (v > 100 || hb.irregolare) card.classList.add('danger');
    else if (v < 50)              card.classList.add('warn');
  }
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
        borderColor: 'rgba(0,229,176,1)',
        backgroundColor: 'rgba(0,229,176,.07)',
        borderWidth: 2,
        pointRadius: 3,
        pointBackgroundColor: 'rgba(0,229,176,1)',
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

// pushChart viene chiamata ad ogni tick — nessun guard sull'id.
// Il grafico deve muoversi continuamente come un monitor ECG.
function pushChart(hb) {
  if (!bpmChart) return;

  const label = new Date().toLocaleTimeString('it-IT', {
    hour: '2-digit', minute: '2-digit', second: '2-digit'
  });

  bpmHistory.push({ label, bpm: Number(hb.bpm) });
  if (bpmHistory.length > MAX_HISTORY) bpmHistory.shift();

  bpmChart.data.labels           = bpmHistory.map(p => p.label);
  bpmChart.data.datasets[0].data = bpmHistory.map(p => p.bpm);

  // Colore dinamico in base all'ultimo valore
  const last = bpmHistory[bpmHistory.length - 1].bpm;
  let lineColor, fillColor;
  if (last > 100)     { lineColor = 'rgba(255,61,107,1)'; fillColor = 'rgba(255,61,107,.07)'; }
  else if (last < 50) { lineColor = 'rgba(255,194,52,1)'; fillColor = 'rgba(255,194,52,.07)'; }
  else                { lineColor = 'rgba(0,229,176,1)';  fillColor = 'rgba(0,229,176,.07)';  }

  bpmChart.data.datasets[0].borderColor          = lineColor;
  bpmChart.data.datasets[0].backgroundColor      = fillColor;
  bpmChart.data.datasets[0].pointBackgroundColor = lineColor;

  // 'none' evita l'animazione su ogni tick — più fluido a 2s
  bpmChart.update('none');
}
