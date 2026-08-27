/**
 * UE Guild Dashboard - app_common.js
 * Shared GLOBAL utilities, state, fetch helpers, formatters, and tiny widgets
 * used by every init*() page module: loadJSON, fmtNum/fmtCompact/fmtDelta,
 * setLoading/setError/setEmpty, initMobileMenu, filterTable, rankBadge, etc.
 *
 * This was the top of core/app.js (L1-216). It must load FIRST before any
 * per-page split JS (app_index.js, app_war.js, ...) and app_router.js.
 */

const _inPages = window.location.pathname.includes('/pages/');
const DATA_BASE = _inPages ? '../data/' : './data/';

const _getThemeColor = (variable, fallback) => {
  const val = getComputedStyle(document.documentElement).getPropertyValue(variable).trim();
  return val || fallback;
};

const updateChartDefaults = () => {
  if (window.Chart) {
    Chart.defaults.color = _getThemeColor('--text-secondary', '#8b949e');
    Chart.defaults.borderColor = _getThemeColor('--border', 'rgba(48,54,61,0.6)');
  }
};

window.addEventListener('themechanged', () => {
  updateChartDefaults();
  const newTextColor = _getThemeColor('--text-muted', '#6e7681');
  const newGridColor = _getThemeColor('--border', '#30363d');
  const newLegendColor = _getThemeColor('--text-secondary', '#8b949e');

  const instances = Chart.instances;
  const chartList = Array.isArray(instances) ? instances : Object.values(instances || {});

  chartList.forEach(chart => {
    if (chart.data && chart.data.datasets) {
      chart.data.datasets.forEach(dataset => {
        if (dataset._cssBorderVar) {
          const color = _getThemeColor(dataset._cssBorderVar);
          dataset.borderColor = color;
          dataset.pointBackgroundColor = color;
          dataset.pointHoverBackgroundColor = color;

          if (dataset.fill && dataset._cssBgVar) {
            const ctx = chart.ctx;
            const g = ctx.createLinearGradient(0, 0, 0, chart.height || 280);
            g.addColorStop(0, color + '38');
            g.addColorStop(1,   color + '00');
            dataset.backgroundColor = g;
          }
        } else if (dataset._cssBgVar) {
          dataset.backgroundColor = _getThemeColor(dataset._cssBgVar);
        }
      });
    }

    if (chart.options.scales) {
      ['x','y','y2'].forEach(axis => {
        if (chart.options.scales[axis]) {
          if (chart.options.scales[axis].ticks) chart.options.scales[axis].ticks.color = newTextColor;
          if (chart.options.scales[axis].grid)  chart.options.scales[axis].grid.color  = newGridColor;
        }
      });
    }
    if (chart.options.plugins?.legend?.labels) {
      chart.options.plugins.legend.labels.color = newLegendColor;
    }
    chart.update();
  });
});

async function loadJSON(filename) {
  const url = DATA_BASE + filename + '?v=' + Date.now();
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    throw new Error(`Failed to load ${filename}: ${err.message}`);
  }
}

function fmtNum(n) {
  if (n === null || n === undefined) return '-';
  return Number(n).toLocaleString(window.i18n?.currentLang || 'en');
}

function fmtCompact(n) {
  if (n === null || n === undefined) return '-';
  const num = Number(n);
  if (Math.abs(num) >= 1e9) return (num / 1e9).toFixed(2) + 'B';
  if (Math.abs(num) >= 1e6) return (num / 1e6).toFixed(1) + 'M';
  if (Math.abs(num) >= 1e4) return (num / 1e3).toFixed(1) + 'K';
  return fmtNum(n);
}

function fmtDelta(n, html = true) {
  if (n === null || n === undefined || n === 0) return html ? '<span class="delta zero">0</span>' : '0';
  const cls = n > 0 ? 'pos' : 'neg';
  const sign = n > 0 ? '+' : '';
  return html ? `<span class="delta ${cls}">${sign}${fmtCompact(n)}</span>` : `${sign}${fmtCompact(n)}`;
}

function cap(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : ''; }

function rankBadge(rank) {
  const cleanRank = (rank || '').trim().replace(/[\r\n]+/g, '');
  let rTier = '';
  if (cleanRank.includes('5')) rTier = 'r5';
  else if (cleanRank.includes('4')) rTier = 'r4';
  else if (cleanRank.includes('3')) rTier = 'r3';
  else if (cleanRank.includes('2')) rTier = 'r2';
  else if (cleanRank.includes('1')) rTier = 'r1';

  const label = rTier ? rTier.toUpperCase() : (cap(cleanRank) || '-');
  const cls = rTier || 'r1';

  return `<span class="rank-badge rank-${cls}">${label}</span>`;
}

function getHashParam() {
  const hash = window.location.hash.slice(1);
  return decodeURIComponent(hash);
}

function setLoading(el, msg) {
  const loadingMsg = msg || t('loading_data');
  if (el) el.innerHTML = `<div class="loading-state"><div class="spinner"></div><p>${loadingMsg}</p></div>`;
}

function setError(el, msg) {
  if (el) el.innerHTML = `<div class="error-state">⚠️ ${msg}</div>`;
}

function setEmpty(el, title, msg) {
  const emptyTitle = title || t('not_found');
  const emptyMsg = msg || '';
  el.innerHTML = `
    <div class="empty-state">
      <div class="empty-icon">📭</div>
      <h3>${emptyTitle}</h3>
      ${emptyMsg ? `<p>${emptyMsg}</p>` : ''}
    </div>`;
}

function initMobileMenu() {
  const toggle = document.querySelector('.menu-toggle');
  const nav = document.querySelector('.navbar-nav');
  if (!toggle || !nav) return;

  nav.classList.remove('open');

  if (!toggle.dataset.initialized) {
    toggle.addEventListener('click', () => nav.classList.toggle('open'));
    toggle.dataset.initialized = 'true';
  }
}

function filterTable(inputEl, tableEl, colIndexes = null) {
  const q = inputEl.value.trim().toLowerCase();
  const rows = tableEl.querySelectorAll('tbody tr[data-searchable]');
  rows.forEach(row => {
    const text = (row.dataset.searchable || row.textContent).toLowerCase();
    row.style.display = text.includes(q) ? '' : 'none';
  });
}

function setActiveNav() {
  const page = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.navbar-nav a').forEach(a => {
    const href = a.getAttribute('href') || '';
    if (href === page || (page === '' && href === 'index.html')) {
      a.classList.add('active');
    }
  });
}
