/**
 * Performance dashboard: i18n wrapper, rankBadge, lock/password screen
 * Requires: Utils.paths, Utils.rankBadge
 * Auto-split from the original large monolithic JS file (globals preserved).
 */

/**
 * performance.js - Global Historical Underperformance Ranking Dashboard
 * 
 * Fetches ALL historical reports from War, Hunt, and Guild Festival datasets,
 * calculates both snapshot-based and global compensatory metrics (6 squares),
 * and renders a high-fidelity comparison table protected by an obfuscated password.
 */

(function () {
  // ── Configuration & State ──────────────────────────────────────────────────
  const checkAccess = async (v) => {
    if (!v) return false;
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(v));
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('') === "63ecbfa3a1ad34a1fdd5e3dd3aeaec31456d1d676552c654d5ecf7dab0b2f4f8";
  };
  let cachedPlayers = [];

  // ── Self-contained Localization Fallbacks ──────────────────────────────

  function getPerfT(key) {
    if (window.t) {
      const val = window.t('perf_' + key);
      return val !== ('perf_' + key) ? val : key;
    }
    return key;
  }

  // ── Formatters ─────────────────────────────────────────────────────────────
  const fmtNum = n => (n >= 1_000_000 ? (n / 1_000_000).toFixed(1) + 'M'
    : n >= 1_000 ? (n / 1_000).toFixed(1) + 'K'
      : String(n));

  const fmtComma = n => Number(n).toLocaleString(window.i18n?.currentLang || 'en');

  function rankBadge(rank) {
    const cleanRank = (rank || '').trim().replace(/[\r\n]+/g, '');
    let rTier = '';
    if (cleanRank.includes('5')) rTier = 'r5';
    else if (cleanRank.includes('4')) rTier = 'r4';
    else if (cleanRank.includes('3')) rTier = 'r3';
    else if (cleanRank.includes('2')) rTier = 'r2';
    else if (cleanRank.includes('1')) rTier = 'r1';

    const label = rTier ? rTier.toUpperCase() : (cleanRank || '-');
    const cls = rTier || 'r1';

    return `<span class="rank-badge rank-${cls}">${label}</span>`;
  }

  // ── Rendering Functions ─────────────────────────────────────────────────────

  function renderLockScreen() {
    const container = document.getElementById('performance-container');
    if (!container) return;

    container.innerHTML = `
      <div class="perf-lock-zone">
        <div class="perf-lock-icon">🔒</div>
        <h2 class="perf-lock-title" data-i18n="perf_control_title">${getPerfT('lock_title')}</h2>
        <p class="perf-lock-desc" data-i18n="perf_control_desc">${getPerfT('lock_desc')}</p>
        <form id="perf-unlock-form" class="perf-form-group">
          <input type="password" id="perf-pass-input" class="perf-input" data-i18n="perf_enter_key" placeholder="Enter security key..." autofocus required>
          <button type="submit" class="btn perf-btn-unlock" data-i18n="perf_unlock_btn">Unlock</button>
        </form>
        <div id="perf-err" class="perf-error-msg" data-i18n="perf_wrong_password">${getPerfT('wrong_pw')}</div>
      </div>
    `;

    const form = document.getElementById('perf-unlock-form');
    const input = document.getElementById('perf-pass-input');
    const errDiv = document.getElementById('perf-err');

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const value = input.value.trim();
      if (await checkAccess(value)) {
        sessionStorage.setItem('performance_unlocked', 'true');
        initDashboard();
      } else {
        errDiv.style.display = 'block';
        input.classList.add('shake-effect');
        input.value = '';
        setTimeout(() => {
          input.classList.remove('shake-effect');
        }, 500);
      }
    });

    if (window.i18n) window.i18n.applyTranslations();
  }
