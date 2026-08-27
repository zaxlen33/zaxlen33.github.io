/**
 * utils.js — Shared utility module (no framework).
 * Aggregates ALL duplicated helpers across the 17 page scripts:
 *   - Path helpers (DATA_BASE, IMG_BASE, PAGES_BASE)
 *   - Fetch + cache-bust helpers (fetchJSON, loadMany parallel)
 *   - Chart.js theme helpers (_getThemeColor, updateChartDefaults, chart themechange listener)
 *   - Number/date formatters (fmtNum, fmtComma, shortDate, fullDate)
 *   - Misc: destroyChart, rankBadge, waitForChart, onDomReady
 *
 * Include AFTER app.js, BEFORE any page-specific <script src="pages/*.js">.
 *
 * Exposed on window.Utils (global), e.g.:
 *   const base  = window.Utils.paths.DATA_BASE;
 *   const data  = await window.Utils.fetchJSON('festival.json');
 *   const [a,b] = await window.Utils.loadMany(['wars.json','hunts.json']);
 *   window.Utils.charts.updateDefaults();
 */
(function () {
  'use strict';

  // ── 1. PATH HELPERS ────────────────────────────────────────────────────────

  const _inPages = window.location.pathname.includes('/pages/');

  const paths = Object.freeze({
    /** Whether we're inside /pages/ subfolder (affects relative URLs). */
    IN_PAGES: _inPages,
    /** Prefix for data JSONs (already includes trailing slash). */
    DATA_BASE: _inPages ? '../data/' : './data/',
    /** Prefix for data/i18n/ JSONs (trailing slash). */
    I18N_BASE: _inPages ? '../data/i18n/' : './data/i18n/',
    /** Prefix for static assets: images/, css/ (relative from HTML). */
    ASSETS_BASE: _inPages ? '../' : './',
    /** Prefix for *.html pages (for nav links). */
    PAGES_BASE: _inPages ? './' : './pages/',
    /** Absolute path to index.html. */
    HOME_URL: _inPages ? '../index.html' : './index.html',
  });

  // ── 2. FETCH HELPERS ───────────────────────────────────────────────────────

  /** Append a cache-busting query param if not already present. */
  function _cacheBust(url, v) {
    const sep = url.includes('?') ? '&' : '?';
    return url + sep + 'v=' + (v == null ? Date.now() : v);
  }

  /**
   * Fetch a URL, return parsed JSON. Auto-appends ?v=Date.now() for cache busting.
   * @param {string} url – absolute or relative URL (DATA_BASE prefix is optional, caller decides)
   * @param {object} opts
   *   opts.cacheBust = true (default) | false | string version
   *   opts.timeoutMs = 0 (default, browser default)
   * @returns {Promise<any>} parsed JSON body
   * @throws Error on HTTP !ok or network failure
   */
  async function fetchJSON(url, opts = {}) {
    const bust = opts.cacheBust;
    const finalUrl = bust === false ? url : _cacheBust(url, typeof bust === 'string' ? bust : undefined);

    const controller = (typeof AbortController !== 'undefined' && opts.timeoutMs > 0)
      ? new AbortController() : null;
    if (controller) setTimeout(() => controller.abort(), opts.timeoutMs);

    const resp = await fetch(finalUrl, controller ? { signal: controller.signal } : undefined);
    if (!resp.ok) throw new Error(`HTTP ${resp.status} for ${url}`);
    return resp.json();
  }

  /**
   * Fetch MANY JSON files IN PARALLEL via Promise.all.
   * Each item in `names` is joined to paths.DATA_BASE automatically (unless it looks like a full URL).
   *
   * @param {string[]} names – e.g. ['wars.json', 'hunts.json', 'history.json']
   * @param {object} [opts] – passed to fetchJSON
   * @returns {Promise<any[]>} – parsed JSONs in SAME ORDER as names
   *
   * Example:
   *   const [wars, hunts, history] = await Utils.loadMany(['wars.json','hunts.json','history.json']);
   */
  async function loadMany(names, opts = {}) {
    const jobs = names.map(name => {
      const url = /^https?:\/\//i.test(name) ? name : (paths.DATA_BASE + name);
      return fetchJSON(url, opts);
    });
    return Promise.all(jobs);
  }

  // ── 3. CHART.JS HELPERS ────────────────────────────────────────────────────

  function _getThemeColor(variable, fallback) {
    const val = getComputedStyle(document.documentElement).getPropertyValue(variable).trim();
    return val || fallback || '';
  }

  function updateChartDefaults() {
    if (!window.Chart) return;
    Chart.defaults.color           = _getThemeColor('--text-secondary', '#8b949e');
    Chart.defaults.borderColor     = _getThemeColor('--border', 'rgba(48,54,61,0.6)');
    Chart.defaults.font.family     = "'Inter', -apple-system, sans-serif";
  }

  /**
   * Live-apply CSS-var theme changes to all Chart.js charts on the page.
   * Automatically subscribes to the global 'themechanged' event exactly once per
   * page (idempotent – safe to call from multiple scripts in any order).
   *
   * Honors dataset hints:
   *   dataset._cssBorderVar  → borderColor, pointBorderColor, pointHoverBackgroundColor
   *   dataset._cssBgVar      → backgroundColor (with 0x12 alpha when used alongside a border var)
   */
  let _themeListenerInstalled = false;
  function installChartThemeListener() {
    if (_themeListenerInstalled) return;
    _themeListenerInstalled = true;

    window.addEventListener('themechanged', () => {
      updateChartDefaults();
      if (!window.Chart) return;

      const instances = Chart.instances;
      const list = Array.isArray(instances) ? instances : Object.values(instances || {});

      const newTextColor   = _getThemeColor('--text-muted', '#6e7681');
      const newGridColor   = _getThemeColor('--border', '#30363d');
      const newLegendColor = _getThemeColor('--text-secondary', '#8b949e');

      list.forEach(chart => {
        if (chart.data?.datasets) {
          chart.data.datasets.forEach(ds => {
            if (ds._cssBorderVar) {
              const color = _getThemeColor(ds._cssBorderVar);
              ds.borderColor             = color;
              ds.pointBorderColor        = color;
              ds.pointHoverBackgroundColor = color;
              if (ds._cssBgVar) {
                // Background-only case (pure bar fill, no gradient wanted)
                ds.backgroundColor = _getThemeColor(ds._cssBgVar);
              } else if (ds.fill && chart.ctx) {
                // Gradient fill (common for line chart area fills)
                const g = chart.ctx.createLinearGradient(0, 0, 0, chart.height || 280);
                g.addColorStop(0, color + '38');
                g.addColorStop(1, color + '00');
                ds.backgroundColor = g;
              }
            } else if (ds._cssBgVar) {
              ds.backgroundColor = _getThemeColor(ds._cssBgVar);
            }
          });
        }
        if (chart.options.scales) {
          ['x', 'y'].forEach(axis => {
            const s = chart.options.scales[axis];
            if (!s) return;
            if (s.ticks) s.ticks.color = newTextColor;
            if (s.grid)  s.grid.color  = newGridColor;
            if (s.title) s.title.color = newTextColor;
          });
        }
        if (chart.options.plugins?.legend?.labels) {
          chart.options.plugins.legend.labels.color = newLegendColor;
        }
        try { chart.update(); } catch {}
      });
    });
  }

  /** Promise-like helper that resolves when window.Chart is available (for CDN async loads). */
  function waitForChart(timeoutMs = 5000) {
    return new Promise((res, rej) => {
      const start = Date.now();
      const check = () => {
        if (window.Chart) return res(Chart);
        if (Date.now() - start > timeoutMs) return rej(new Error('Chart.js not loaded'));
        setTimeout(check, 50);
      };
      check();
    });
  }

  // ── 4. FORMATTERS (i18n-aware fallbacks) ───────────────────────────────────

  const _currentLang = () => (window.i18n?.currentLang || navigator.language || 'en');

  function fmtNum(n) {
    const x = Number(n) || 0;
    if (x >= 1_000_000) return (x / 1_000_000).toFixed(1) + 'M';
    if (x >= 1_000)     return (x / 1_000).toFixed(1)     + 'K';
    return String(x);
  }

  function fmtComma(n) {
    return Number(n).toLocaleString(_currentLang());
  }

  function shortDate(d) {
    try {
      const dt = new Date(d + 'T00:00:00');
      return dt.toLocaleDateString(_currentLang(), { month: 'short', day: 'numeric' });
    } catch {
      return (d || '').slice(5, 10);
    }
  }

  function fullDate(d) {
    try {
      const dt = new Date(d + 'T00:00:00');
      return dt.toLocaleDateString(_currentLang(), { year: 'numeric', month: 'long', day: 'numeric' });
    } catch {
      return d || '';
    }
  }

  // ── 5. MISCELLANEOUS ───────────────────────────────────────────────────────

  function destroyChart(c) {
    if (!c) return;
    try { c.destroy(); } catch {}
  }

  /**
   * Renders a rank badge (R1–R5) matching the guild-rank colors in styles.css.
   * Works with strings like "R5 - General", "R4", "Officer (R3)" etc.
   */
  function rankBadge(rank) {
    const clean = (rank || '').trim().replace(/[\r\n]+/g, '');
    let tier = '';
    if      (clean.includes('5')) tier = 'r5';
    else if (clean.includes('4')) tier = 'r4';
    else if (clean.includes('3')) tier = 'r3';
    else if (clean.includes('2')) tier = 'r2';
    else if (clean.includes('1')) tier = 'r1';

    const cls   = tier || 'r1';
    const label = tier ? tier.toUpperCase() : (clean || '-');
    return `<span class="rank-badge rank-${cls}">${label}</span>`;
  }

  function onDomReady(fn) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fn, { once: true });
    } else {
      setTimeout(fn, 0);
    }
  }

  // ── EXPORTS (global) ───────────────────────────────────────────────────────

  window.Utils = Object.freeze({
    paths,
    fetchJSON,
    loadMany,
    charts: Object.freeze({
      getThemeColor: _getThemeColor,
      updateDefaults: updateChartDefaults,
      installThemeListener: installChartThemeListener,
      waitFor: waitForChart,
    }),
    fmt: Object.freeze({
      num:    fmtNum,
      comma:  fmtComma,
      shortDate,
      fullDate,
    }),
    destroyChart,
    rankBadge,
    onDomReady,
  });

  // Auto-start: prime chart defaults + theme listener so page scripts don't have to.
  installChartThemeListener();
  onDomReady(updateChartDefaults);
})();
