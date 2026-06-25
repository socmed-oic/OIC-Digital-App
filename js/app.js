/**
 * ============================================================
 *  OIC Marketing & Analytics Dashboard — app.js
 *  Production-ready dashboard controller
 * ============================================================
 */

/* ---------------------------------------------------------- */
/*  0. COLOUR PALETTE & CHART DEFAULTS                        */
/* ---------------------------------------------------------- */

const COLORS = {
  primary:  '#1a1a2e',
  accent:   '#d4a574',
  success:  '#22c55e',
  danger:   '#ef4444',
  warning:  '#f59e0b',
  info:     '#3b82f6',
  purple:   '#8b5cf6',
  teal:     '#0d9488',
};

/** Apply global Chart.js defaults once the library is available. */
function applyChartDefaults() {
  if (typeof Chart === 'undefined') return;

  Chart.defaults.font.family            = "'Plus Jakarta Sans'";
  Chart.defaults.font.size              = 13;
  Chart.defaults.color                  = '#64748b';
  Chart.defaults.plugins.legend.labels.usePointStyle = true;
  Chart.defaults.plugins.legend.labels.padding       = 20;
}

/* ---------------------------------------------------------- */
/*  1. PIN LOGIN                                              */
/* ---------------------------------------------------------- */

const CORRECT_PIN = '1234';
let   currentPin  = '';

// DOM refs (resolved once in init)
let loginView, hubView, dashboardView;
let pinDots, pinKeys, pinClear, pinEnter, pinError;

/** Sync the visual dot indicators with the current PIN length. */
function updatePinDisplay() {
  pinDots.forEach((dot, i) => {
    dot.classList.toggle('filled', i < currentPin.length);
  });
}

/** Handle a digit key press on the PIN pad. */
function handlePinDigit(digit) {
  if (currentPin.length >= 4) return;
  currentPin += digit;
  updatePinDisplay();
}

/** Delete the last entered digit. */
function handlePinClear() {
  currentPin = currentPin.slice(0, -1);
  updatePinDisplay();
}

/** Validate the PIN and transition views. */
function handlePinEnter() {
  if (currentPin.length === 0) return;

  if (currentPin === CORRECT_PIN) {
    // Brief success animation on dots
    pinDots.forEach(d => d.classList.add('success'));
    setTimeout(() => {
      pinDots.forEach(d => d.classList.remove('success'));
      switchView(hubView);
      currentPin = '';
      updatePinDisplay();
    }, 500);
  } else {
    // Show error state
    pinError.textContent = 'Incorrect PIN';
    pinError.classList.add('visible');
    pinDots.forEach(d => d.classList.add('error'));

    setTimeout(() => {
      pinError.classList.remove('visible');
      pinDots.forEach(d => d.classList.remove('error'));
      currentPin = '';
      updatePinDisplay();
    }, 1500);
  }
}

/* ---------------------------------------------------------- */
/*  2. VIEW SWITCHING                                         */
/* ---------------------------------------------------------- */

/** Activate `target` view and deactivate the others. */
function switchView(target) {
  [loginView, hubView, dashboardView].forEach(v => {
    if (v) v.classList.remove('active');
  });
  if (target) target.classList.add('active');
}

/* ---------------------------------------------------------- */
/*  3. HUB NAVIGATION                                        */
/* ---------------------------------------------------------- */

/**
 * Show a specific module inside the dashboard view.
 * @param {string} targetId  – id of the .module-section to reveal
 * @param {string} titleText – label for the topbar title
 */
function showModule(targetId, titleText) {
  // Hide every module section
  document.querySelectorAll('.module-section').forEach(sec => {
    sec.classList.remove('active');
  });

  // De-activate every sidebar link
  document.querySelectorAll('.nav-links li').forEach(li => {
    li.classList.remove('active');
  });

  // Reveal the target section
  const target = document.getElementById(targetId);
  if (target) target.classList.add('active');

  // Highlight the matching sidebar link
  const matchingLink = document.querySelector(`.nav-links li[data-target="${targetId}"]`);
  if (matchingLink) matchingLink.classList.add('active');

  // Update topbar title
  const titleEl = document.getElementById('current-module-title');
  if (titleEl && titleText) titleEl.textContent = titleText;

  // Animate KPI counters that just became visible
  animateCounters(target);
}

/* ---------------------------------------------------------- */
/*  4. SIDEBAR NAVIGATION                                     */
/* ---------------------------------------------------------- */

function initSidebarNav() {
  // Sidebar link clicks
  document.querySelectorAll('.nav-links li').forEach(li => {
    li.addEventListener('click', () => {
      const targetId  = li.getAttribute('data-target');
      const titleText = li.querySelector('span')?.textContent || '';
      showModule(targetId, titleText);
    });
  });

  // Back-to-hub button
  const backBtn = document.getElementById('back-to-hub');
  if (backBtn) {
    backBtn.addEventListener('click', () => switchView(hubView));
  }
}

/* ---------------------------------------------------------- */
/*  5. GOOGLE SHEETS INTEGRATION                              */
/* ---------------------------------------------------------- */

const SheetsManager = {
  sheetUrl:     '',
  sheetId:      '',
  isConnected:  false,
  data:         [],

  /**
   * Extract the spreadsheet ID from common Google Sheets URL patterns.
   * @param {string} url
   * @returns {string|null}
   */
  parseSheetUrl(url) {
    // Matches /spreadsheets/d/SHEET_ID
    const regex = /\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/;
    const match = url.match(regex);
    return match ? match[1] : null;
  },

  /**
   * Fetch data from a published Google Sheet via the gviz endpoint.
   * @param {string} sheetId
   * @returns {Promise<Object[]>}
   */
  async fetchData(sheetId) {
    const endpoint =
      `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json`;

    const res  = await fetch(endpoint);
    const text = await res.text();

    // Strip the JSONP wrapper: google.visualization.Query.setResponse({...})
    const jsonString = text.replace(
      /^.*google\.visualization\.Query\.setResponse\(([\s\S]*?)\);?\s*$/,
      '$1'
    );
    const json = JSON.parse(jsonString);

    const cols = json.table.cols.map(c => c.label || c.id);
    const rows = json.table.rows.map(r => {
      const obj = {};
      r.c.forEach((cell, i) => {
        obj[cols[i]] = cell ? (cell.v ?? cell.f ?? '') : '';
      });
      return obj;
    });

    return rows;
  },

  /**
   * Full connection flow: parse → fetch → update UI.
   * @param {string} url
   * @returns {Promise<Object[]>}
   */
  async connect(url) {
    this.sheetUrl = url;
    this.updateStatus('loading');

    const id = this.parseSheetUrl(url);
    if (!id) throw new Error('Invalid Google Sheets URL');

    this.sheetId = id;
    const data   = await this.fetchData(id);

    this.data        = data;
    this.isConnected = true;
    this.updateStatus('connected', data.length);

    return data;
  },

  /**
   * Reflect connection state in the UI.
   * @param {'connected'|'disconnected'|'loading'} status
   * @param {number} [rowCount]
   */
  updateStatus(status, rowCount) {
    const el = document.querySelector('.sheets-status');
    if (!el) return;

    el.classList.remove('connected', 'disconnected', 'loading');
    el.classList.add(status);

    const messages = {
      connected:    `Connected — ${rowCount ?? 0} rows loaded`,
      disconnected: 'Not connected',
      loading:      'Connecting…',
    };
    el.textContent = messages[status] || status;
  },
};

/**
 * Placeholder mapper — logs loaded sheet data.
 * Replace the body of this function once the user's column
 * structure is known.
 */
function updateAdsFromSheet(data) {
  console.log('[OIC] Sheet data loaded:', data);
  // TODO: map spreadsheet columns → KPI values & chart datasets
}

function initSheetsConnect() {
  const btn   = document.getElementById('connect-sheets');
  const input = document.getElementById('sheets-url') ||
                document.querySelector('.sheets-url-input');

  if (!btn || !input) return;

  btn.addEventListener('click', async () => {
    const url = input.value.trim();
    if (!url) return;

    try {
      const data = await SheetsManager.connect(url);
      updateAdsFromSheet(data);
    } catch (err) {
      console.error('[OIC] Sheets connection error:', err);
      SheetsManager.updateStatus('disconnected');
      const statusEl = document.querySelector('.sheets-status');
      if (statusEl) statusEl.textContent = 'Failed to connect';
    }
  });
}

/* ---------------------------------------------------------- */
/*  6. CHART.JS CONFIGURATIONS                                */
/* ---------------------------------------------------------- */

/** Registry so we can update / destroy charts later. */
const charts = {};

function initCharts() {
  if (typeof Chart === 'undefined') {
    console.warn('[OIC] Chart.js not loaded — skipping chart init.');
    return;
  }

  applyChartDefaults();

  /* ---- a) Ads Performance — Bar ---- */
  tryCreateChart('adsChart', (ctx) => {
    charts.adsChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Google Ads', 'Meta Ads', 'TikTok Ads', 'LinkedIn'],
        datasets: [
          {
            label: 'Impressions (M)',
            data: [2.5, 3.2, 4.1, 1.8],
            backgroundColor: COLORS.primary,
            borderRadius: 8,
          },
          {
            label: 'Clicks (K)',
            data: [150, 210, 320, 85],
            backgroundColor: COLORS.accent,
            borderRadius: 8,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'top' } },
        scales: {
          x: { grid: { display: false } },
          y: { grid: { color: '#f0f2f5' }, border: { display: false } },
        },
      },
    });
  });

  /* ---- b) Ads Spend Doughnut ---- */
  tryCreateChart('adsPieChart', (ctx) => {
    charts.adsPieChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Google', 'Meta', 'TikTok', 'LinkedIn'],
        datasets: [{
          data: [25, 35, 30, 10],
          backgroundColor: [
            COLORS.primary,
            COLORS.info,
            COLORS.danger,
            COLORS.accent,
          ],
          borderWidth: 0,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '72%',
        plugins: { legend: { display: false } },
      },
    });
  });

  /* ---- c) PR ROI — Line ---- */
  tryCreateChart('prRoiChart', (ctx) => {
    charts.prRoiChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        datasets: [
          {
            label: 'PR Cost',
            data: [10, 15, 12, 20, 18, 25],
            borderColor: COLORS.primary,
            fill: false,
            tension: 0.4,
            pointBackgroundColor: COLORS.primary,
            pointRadius: 5,
            pointHoverRadius: 8,
          },
          {
            label: 'Earned Media Value',
            data: [25, 35, 30, 50, 45, 65],
            borderColor: COLORS.accent,
            fill: true,
            backgroundColor: 'rgba(212,165,116,0.1)',
            tension: 0.4,
            pointBackgroundColor: COLORS.accent,
            pointRadius: 5,
            pointHoverRadius: 8,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: { grid: { display: false } },
          y: { grid: { color: '#f0f2f5' }, border: { display: false } },
        },
      },
    });
  });

  /* ---- d) Sentiment — Doughnut ---- */
  tryCreateChart('sentimentChart', (ctx) => {
    charts.sentimentChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Positive', 'Neutral', 'Negative'],
        datasets: [{
          data: [75, 20, 5],
          backgroundColor: [COLORS.success, COLORS.warning, COLORS.danger],
          borderWidth: 0,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '75%',
        plugins: { legend: { position: 'bottom' } },
      },
    });
  });

  /* ---- e) Trend — Radar ---- */
  tryCreateChart('trendChart', (ctx) => {
    charts.trendChart = new Chart(ctx, {
      type: 'radar',
      data: {
        labels: ['Wellness', 'Beauty', 'Fitness', 'Mental Health', 'Nutrition'],
        datasets: [{
          label: 'Trend Score',
          data: [85, 65, 90, 75, 60],
          backgroundColor: 'rgba(212,165,116,0.15)',
          borderColor: COLORS.accent,
          pointBackgroundColor: COLORS.primary,
          pointRadius: 5,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          r: {
            ticks: { display: false },
            grid:  { color: 'rgba(0,0,0,0.05)' },
          },
        },
      },
    });
  });

  /* ---- f) Outlet Performance — Horizontal Bar ---- */
  tryCreateChart('outletChart', (ctx) => {
    charts.outletChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Jabodetabek', 'Jawa Barat', 'Jawa Timur', 'Bali', 'Jawa Tengah'],
        datasets: [{
          label: 'Outlets',
          data: [1200, 850, 750, 950, 600],
          backgroundColor: [
            COLORS.primary,
            'rgba(26,26,46,0.8)',
            'rgba(26,26,46,0.6)',
            'rgba(26,26,46,0.45)',
            'rgba(26,26,46,0.3)',
          ],
          borderRadius: 8,
        }],
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: { grid: { color: '#f0f2f5' }, border: { display: false } },
          y: { grid: { display: false } },
        },
      },
    });
  });
}

/**
 * Safely create a chart — missing canvases won't crash the app.
 * @param {string}   canvasId
 * @param {Function} factory  – receives the 2D context
 */
function tryCreateChart(canvasId, factory) {
  try {
    const canvas = document.getElementById(canvasId);
    if (!canvas) {
      console.warn(`[OIC] Canvas #${canvasId} not found — skipped.`);
      return;
    }
    factory(canvas.getContext('2d'));
  } catch (err) {
    console.error(`[OIC] Error creating chart "${canvasId}":`, err);
  }
}

/* ---------------------------------------------------------- */
/*  7. ANIMATED NUMBER COUNTERS                               */
/* ---------------------------------------------------------- */

/**
 * Animate all .bento-kpi .value elements inside `scope`
 * from 0 → target over ~1.5 s.  Handles suffixes like M, %, K, x.
 * @param {HTMLElement} [scope=document]
 */
function animateCounters(scope = document) {
  if (!scope) return;

  const DURATION = 1500; // ms
  const valueEls = scope.querySelectorAll('.bento-kpi .value');

  valueEls.forEach(el => {
    // Avoid re-animating an element that is already done
    if (el.dataset.animated === 'true') return;

    const raw      = el.textContent.trim();
    // Split numeric part from suffix (e.g. "3.2M" → 3.2 + "M")
    const match    = raw.match(/^([\d,.]+)\s*(.*)$/);
    if (!match) return;

    const target   = parseFloat(match[1].replace(/,/g, ''));
    const suffix   = match[2];
    const decimals = (match[1].includes('.'))
      ? match[1].split('.')[1].length
      : 0;

    let start = null;

    function step(ts) {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / DURATION, 1);
      // Ease-out quad
      const eased    = 1 - Math.pow(1 - progress, 2);
      const current  = (target * eased).toFixed(decimals);

      // Re-add thousand-separator if the original had commas
      const formatted = match[1].includes(',')
        ? Number(current).toLocaleString('en-US', {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals,
          })
        : current;

      el.textContent = formatted + suffix;

      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        el.dataset.animated = 'true';
      }
    }

    requestAnimationFrame(step);
  });
}

/* ---------------------------------------------------------- */
/*  8. REAL-TIME CLOCK                                        */
/* ---------------------------------------------------------- */

function updateClock() {
  const el = document.getElementById('topbar-date') ||
             document.querySelector('.topbar-date');
  if (!el) return;

  const now  = new Date();
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = [
    'Jan','Feb','Mar','Apr','May','Jun',
    'Jul','Aug','Sep','Oct','Nov','Dec',
  ];

  const formatted =
    `${days[now.getDay()]}, ${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`;

  el.textContent = formatted;
}

function startClock() {
  updateClock();
  // Refresh every 60 s
  setInterval(updateClock, 60_000);
}

/* ---------------------------------------------------------- */
/*  9. INITIALISATION                                         */
/* ---------------------------------------------------------- */

document.addEventListener('DOMContentLoaded', () => {
  /* --- Resolve DOM refs --- */
  loginView     = document.getElementById('login-view');
  hubView       = document.getElementById('hub-view');
  dashboardView = document.getElementById('dashboard-view');

  pinDots   = document.querySelectorAll('.pin-dot');
  pinKeys   = document.querySelectorAll('.pin-keypad .key:not(.action-key)');
  pinClear  = document.getElementById('pin-clear');
  pinEnter  = document.getElementById('pin-enter');
  pinError  = document.getElementById('pin-error');

  /* --- PIN keypad listeners --- */
  pinKeys.forEach(key => {
    key.addEventListener('click', () => handlePinDigit(key.textContent.trim()));
  });

  if (pinClear) pinClear.addEventListener('click', handlePinClear);
  if (pinEnter) pinEnter.addEventListener('click', handlePinEnter);

  /* --- Hub card listeners --- */
  document.querySelectorAll('.hub-card').forEach(card => {
    card.addEventListener('click', () => {
      const moduleId = card.getAttribute('data-module');
      const title    = card.querySelector('.hub-card-title')?.textContent
                    || card.querySelector('h3')?.textContent
                    || card.querySelector('span')?.textContent
                    || '';
      switchView(dashboardView);
      showModule(moduleId, title);
    });
  });

  /* --- Sidebar & back button --- */
  initSidebarNav();

  /* --- Google Sheets --- */
  initSheetsConnect();

  /* --- Charts (safe init) --- */
  try {
    initCharts();
  } catch (err) {
    console.error('[OIC] Chart initialisation error:', err);
  }

  /* --- Clock --- */
  startClock();

  /* --- Default view: login --- */
  switchView(loginView);

  console.log('[OIC] Dashboard initialised ✓');
});
