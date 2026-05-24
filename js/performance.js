/**
 * performance.js — Global Historical Underperformance Ranking Dashboard
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

    const label = rTier ? rTier.toUpperCase() : (cleanRank || '—');
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

  async function initDashboard() {
    const container = document.getElementById('performance-container');
    if (!container) return;

    // Show Loader
    container.innerHTML = `
      <div class="loading-state">
        <div class="spinner"></div>
        <p data-i18n="loading_data">${window.t ? window.t('loading_data') : 'Loading data…'}</p>
      </div>
    `;
    if (window.i18n) window.i18n.applyTranslations();

    try {
      const [warsRes, huntsRes, festivalRes, historyRes, membersRes] = await Promise.all([
        fetch('./data/wars.json?v=' + Date.now()),
        fetch('./data/hunts.json?v=' + Date.now()),
        fetch('./data/festival.json?v=' + Date.now()),
        fetch('./data/history.json?v=' + Date.now()),
        fetch('./data/members.json?v=' + Date.now())
      ]);

      if (!warsRes.ok || !huntsRes.ok || !festivalRes.ok || !historyRes.ok || !membersRes.ok) {
        throw new Error("HTTP error loading JSON resources.");
      }

      const warsData = await warsRes.json();
      const huntsData = await huntsRes.json();
      const festivalData = await festivalRes.json();
      const historyData = await historyRes.json();
      const membersData = await membersRes.json();

      const currentUids = new Set();
      if (historyData && historyData.members) {
        let lastDay = historyData.last_updated;
        if (!lastDay) {
          lastDay = historyData.members.reduce((max, m) => (m.last_seen > max ? m.last_seen : max), "");
        }
        historyData.members.forEach(m => {
          if (m.uid && m.last_seen === lastDay) {
            currentUids.add(m.uid);
          }
        });
      } else if (membersData && Array.isArray(membersData)) {
        membersData.forEach(m => {
          if (m.uid) currentUids.add(m.uid);
        });
      }

      const nameToUid = new Map();
      const uidToName = new Map();

      if (historyData && historyData.members) {
        historyData.members.forEach(m => {
          if (m.uid && m.name) {
            uidToName.set(m.uid, m.name);
            nameToUid.set(m.name, m.uid);
            if (m.name_history) {
              m.name_history.forEach(nh => {
                if (nh.name) nameToUid.set(nh.name, m.uid);
              });
            }
          }
        });
      }

      if (membersData && Array.isArray(membersData)) {
        membersData.forEach(m => {
          if (m.uid && m.name) {
            uidToName.set(m.uid, m.name);
            nameToUid.set(m.name, m.uid);
          }
        });
      }

      const playerMap = new Map();

      function getOrCreatePlayer(rawName, rawUid = null) {
        let uid = rawUid;
        if (!uid) uid = nameToUid.get(rawName) || rawName;

        const displayName = uidToName.get(uid) || rawName;

        if (!playerMap.has(uid)) {
          playerMap.set(uid, {
            uid: uid,
            name: displayName,
            rank: '',
            failures: 0,
            participations: 0,
            globalFailures: 0,
            war: { participations: 0, failures: 0, totalKills: 0, totalQuota: 0, globalMet: false },
            hunt: { participations: 0, failures: 0, totalPoints: 0, totalQuota: 0, globalMet: false },
            festival: { participations: 0, failures: 0, totalScore: 0, totalQuota: 0, globalMet: false }
          });
        }
        return playerMap.get(uid);
      }

      // Pre-populate playerMap with all members currently in the daily report
      if (membersData && Array.isArray(membersData)) {
        membersData.forEach(m => {
          if (m.uid && m.name) {
            const player = getOrCreatePlayer(m.name, m.uid);
            if (m.rank && !player.rank) player.rank = m.rank;
          }
        });
      }

      // 1. Process ALL historical War reports
      warsData.forEach(report => {
        if (report.members) {
          report.members.forEach(m => {
            if (!m.name) return;
            const player = getOrCreatePlayer(m.name);
            player.participations++;
            player.war.participations++;
            player.war.totalQuota += 1000000;

            const met = m.kills_diff >= 1000000;
            if (!met) {
              player.failures++;
              player.war.failures++;
            }
            player.war.totalKills += (m.kills_diff || 0);
            if (m.rank && !player.rank) player.rank = m.rank;
          });
        }
      });

      // 2. Process ALL historical Hunt reports
      huntsData.forEach(report => {
        const minReq = report.summary?.min_required || 56;
        if (report.players) {
          report.players.forEach(p => {
            if (!p.name) return;
            const player = getOrCreatePlayer(p.name);
            player.participations++;
            player.hunt.participations++;
            player.hunt.totalQuota += minReq;

            const met = p.met_minimum === true;
            if (!met) {
              player.failures++;
              player.hunt.failures++;
            }
            player.hunt.totalPoints += (p.pts_total || 0);
            if (p.rank && !player.rank) player.rank = p.rank;
          });
        }
      });

      // 3. Process ALL historical Festival reports
      festivalData.forEach(report => {
        const minScore = report.summary?.festival_min_score || 3100;
        if (report.players) {
          report.players.forEach(f => {
            if (!f.name) return;
            const player = getOrCreatePlayer(f.name, f.uid);
            player.participations++;
            player.festival.participations++;
            player.festival.totalQuota += minScore;

            const met = f.score >= minScore;
            if (!met) {
              player.failures++;
              player.festival.failures++;
            }
            player.festival.totalScore += (f.score || 0);
          });
        }
      });

      // Calculate compensatory rates
      cachedPlayers = Array.from(playerMap.values()).filter(p => currentUids.has(p.uid));
      cachedPlayers.forEach(p => {
        p.war.globalMet = p.war.totalKills >= p.war.totalQuota;
        p.hunt.globalMet = p.hunt.totalPoints >= p.hunt.totalQuota;
        p.festival.globalMet = p.festival.totalScore >= p.festival.totalQuota;

        p.globalFailures = 0;
        if (p.war.participations > 0 && !p.war.globalMet) p.globalFailures++;
        if (p.hunt.participations > 0 && !p.hunt.globalMet) p.globalFailures++;
        if (p.festival.participations > 0 && !p.festival.globalMet) p.globalFailures++;

        p.failureRate = p.participations > 0 ? (p.failures / p.participations) : 0;
      });

      renderDashboardUI();

    } catch (err) {
      console.error(err);
      container.innerHTML = `
        <div class="error-state" style="padding: 3rem 1rem;">
          <span style="font-size: 2rem;">⚠️</span>
          <h3>${window.t ? window.t('error_loading') : 'Could not load data'}</h3>
          <p>${err.message}</p>
        </div>
      `;
    }
  }

  function sortPlayers() {
    const sortSelect = document.getElementById('perf-sort');
    const sortMode = sortSelect ? sortSelect.value : 'failures_desc';

    cachedPlayers.sort((a, b) => {
      if (sortMode === 'failures_desc') {
        if (b.globalFailures !== a.globalFailures) return b.globalFailures - a.globalFailures;
        if (b.failures !== a.failures) return b.failures - a.failures;
        if (b.failureRate !== a.failureRate) return b.failureRate - a.failureRate;
      } else if (sortMode === 'rate_desc') {
        if (b.failureRate !== a.failureRate) return b.failureRate - a.failureRate;
        if (b.failures !== a.failures) return b.failures - a.failures;
      } else if (sortMode === 'war_desc') {
        if (b.war.failures !== a.war.failures) return b.war.failures - a.war.failures;
        if (b.war.participations !== a.war.participations) return b.war.participations - a.war.participations;
      } else if (sortMode === 'hunt_desc') {
        if (b.hunt.failures !== a.hunt.failures) return b.hunt.failures - a.hunt.failures;
        if (b.hunt.participations !== a.hunt.participations) return b.hunt.participations - a.hunt.participations;
      } else if (sortMode === 'fest_desc') {
        if (b.festival.failures !== a.festival.failures) return b.festival.failures - a.festival.failures;
        if (b.festival.participations !== a.festival.participations) return b.festival.participations - a.festival.participations;
      }
      return a.name.localeCompare(b.name);
    });
  }

  function renderDashboardUI() {
    const container = document.getElementById('performance-container');
    if (!container) return;

    const totalAssessed = cachedPlayers.length;
    const failures1 = cachedPlayers.filter(p => p.globalFailures >= 1).length;
    const failures2 = cachedPlayers.filter(p => p.globalFailures >= 2).length;
    const failures3 = cachedPlayers.filter(p => p.globalFailures >= 3).length;

    container.innerHTML = `
      <div class="perf-unlocked-header">
        <div class="perf-unlocked-title">
          <span>⚠️</span>
          <div>
            <strong>${getPerfT('failures')} Ranking</strong>
            <div style="font-size: 0.75rem; font-weight: normal; color: var(--text-muted); margin-top: 2px;">
              ${getPerfT('unlocked_subtitle')}
            </div>
          </div>
        </div>
        <button id="perf-btn-lock" class="perf-btn-lock">🔒 Lock</button>
      </div>

      <div class="stats-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 1rem; padding: 1.5rem 1.5rem 0.5rem 1.5rem;">
        <div class="stat-card">
          <span class="stat-icon" style="color: var(--accent-blue);">👥</span>
          <span class="stat-value" id="stats-total-members">${totalAssessed}</span>
          <span class="stat-label">${getPerfT('stat_total')}</span>
        </div>
        <div class="stat-card" style="border-left: 3px solid var(--accent-yellow);">
          <span class="stat-icon" style="color: var(--accent-yellow);">⚠️</span>
          <span class="stat-value" id="stats-under-1">${failures1}</span>
          <span class="stat-label">${getPerfT('stat_under1')}</span>
        </div>
        <div class="stat-card" style="border-left: 3px solid #f0883e;">
          <span class="stat-icon" style="color: #f0883e;">🔥</span>
          <span class="stat-value" id="stats-under-3">${failures2}</span>
          <span class="stat-label">${getPerfT('stat_under3')}</span>
        </div>
        <div class="stat-card" style="border-left: 3px solid var(--accent-red);">
          <span class="stat-icon" style="color: var(--accent-red);">🚨</span>
          <span class="stat-value" id="stats-under-5">${failures3}</span>
          <span class="stat-label">${getPerfT('stat_under5')}</span>
        </div>
      </div>

      <div style="padding: 0 1.5rem 1rem 1.5rem;">
        <div class="toolbar" style="margin-bottom: 0.5rem; display: flex; gap: 10px; flex-wrap: wrap;">
          <div class="search-box" style="flex: 1; min-width: 200px;">
            <span class="search-icon">🔍</span>
            <input type="text" id="perf-search" placeholder="${window.t ? window.t('search_placeholder') : 'Search by name…'}" autocomplete="off">
          </div>
          
          <select class="select-box" id="perf-filter" style="min-width: 180px; background: var(--bg-secondary); border: 1px solid var(--border); border-radius: var(--radius); color: var(--text-primary); padding: 8px 12px; outline: none; cursor: pointer;">
            <option value="all">${getPerfT('filter_all')}</option>
            <option value="fail1">${getPerfT('filter_fail1')}</option>
            <option value="fail3">${getPerfT('filter_fail3')}</option>
            <option value="fail5">${getPerfT('filter_fail5')}</option>
          </select>

          <select class="select-box" id="perf-sort" style="min-width: 220px; background: var(--bg-secondary); border: 1px solid var(--border); border-radius: var(--radius); color: var(--text-primary); padding: 8px 12px; outline: none; cursor: pointer;">
            <option value="failures_desc">${getPerfT('sort_failures_desc')}</option>
            <option value="rate_desc">${getPerfT('sort_rate_desc')}</option>
            <option value="war_desc">${getPerfT('sort_war_desc')}</option>
            <option value="hunt_desc">${getPerfT('sort_hunt_desc')}</option>
            <option value="fest_desc">${getPerfT('sort_fest_desc')}</option>
            <option value="name_asc">${getPerfT('sort_name_asc')}</option>
          </select>
        </div>
      </div>

      <div style="padding: 0 1.5rem 1.5rem 1.5rem;">
        <div class="table-wrapper">
          <table style="width:100%; border-collapse: collapse;">
            <thead>
              <tr style="border-bottom: 1px solid var(--border); text-align: left;">
                <th style="padding: 10px 8px; font-size: 0.8rem; color: var(--text-muted); font-weight: 600; width: 40px;">${getPerfT('rank')}</th>
                <th style="padding: 10px 8px; font-size: 0.8rem; color: var(--text-muted); font-weight: 600; width: 140px;">${getPerfT('player')}</th>
                <th style="padding: 10px 8px; font-size: 0.8rem; color: var(--text-muted); font-weight: 600; width: 20%;">${getPerfT('war')}</th>
                <th style="padding: 10px 8px; font-size: 0.8rem; color: var(--text-muted); font-weight: 600; width: 20%;">${getPerfT('hunt')}</th>
                <th style="padding: 10px 8px; font-size: 0.8rem; color: var(--text-muted); font-weight: 600; width: 20%;">${getPerfT('festival')}</th>
                <th style="padding: 10px 8px; font-size: 0.8rem; color: var(--text-muted); font-weight: 600; text-align: center; width: 10%;">${getPerfT('failures')}</th>
              </tr>
            </thead>
            <tbody id="perf-table-body">
              <!-- Rows injected dynamically -->
            </tbody>
          </table>
        </div>
      </div>
    `;

    document.getElementById('perf-btn-lock').addEventListener('click', () => {
      sessionStorage.removeItem('performance_unlocked');
      renderLockScreen();
    });

    const searchInput = document.getElementById('perf-search');
    const filterSelect = document.getElementById('perf-filter');
    const sortSelect = document.getElementById('perf-sort');

    const updateTrigger = () => {
      sortPlayers();
      updateTableRows();
    };

    searchInput.addEventListener('input', updateTableRows);
    filterSelect.addEventListener('change', updateTableRows);
    sortSelect.addEventListener('change', updateTrigger);

    updateTrigger();
    if (window.i18n) window.i18n.applyTranslations();
  }

  function updateTableRows() {
    const tableBody = document.getElementById('perf-table-body');
    if (!tableBody) return;

    const query = document.getElementById('perf-search').value.toLowerCase().trim();
    const filterType = document.getElementById('perf-filter').value;

    const filtered = cachedPlayers.filter(p => {
      if (query && !p.name.toLowerCase().includes(query)) return false;
      if (filterType === 'fail1' && p.globalFailures < 1) return false;
      if (filterType === 'fail3' && p.globalFailures < 2) return false;
      if (filterType === 'fail5' && p.globalFailures < 3) return false;
      return true;
    });

    if (filtered.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align: center; padding: 3rem 1rem; color: var(--text-muted);">
            <div style="font-size: 1.5rem; margin-bottom: 0.5rem;">🔍</div>
            <p>${getPerfT('no_results')}</p>
          </td>
        </tr>
      `;
      return;
    }

    const MET_STR = getPerfT('met_label');
    const MISS_STR = getPerfT('miss_label');

    let rowsHTML = "";
    filtered.forEach((p, idx) => {
      const isFailRow = p.globalFailures >= 1;
      const rowClass = isFailRow ? 'class="perf-row-fail"' : '';

      // War cell markup (Compensatory 6-boxes style)
      let warCell = "";
      if (p.war.participations === 0) {
        warCell = `<span class="text-muted" style="font-size: 0.88rem;">➖ N/A</span>`;
      } else {
        const isMet = p.war.failures === 0;
        const color = isMet ? 'var(--accent-green)' : 'var(--accent-red)';
        const gColor = p.war.globalMet ? 'var(--accent-green)' : 'var(--accent-red)';
        warCell = `
          <div style="display: flex; gap: 6px; min-width: 140px;">
            <div style="flex:1; border: 1px solid rgba(255,255,255,0.08); border-radius: 4px; padding: 6px 4px; text-align: center; background: rgba(0,0,0,0.15);">
              <strong style="color: ${color}; font-size: 0.8rem; display: block;">${p.war.failures}/${p.war.participations} ${isMet ? MET_STR : MISS_STR}</strong>
              <span style="font-size: 0.65rem; color: var(--text-muted);">Indiv.</span>
            </div>
            <div style="flex:1; border: 1px solid ${p.war.globalMet ? 'rgba(46,160,67,0.3)' : 'rgba(248,81,73,0.3)'}; border-radius: 4px; padding: 6px 4px; text-align: center; background: ${p.war.globalMet ? 'rgba(46,160,67,0.08)' : 'rgba(248,81,73,0.08)'};">
              <strong style="color: ${gColor}; font-size: 0.8rem; display: block;">${p.war.globalMet ? '✔ TOTAL' : '❌ TOTAL'}</strong>
              <span style="font-size: 0.65rem; color: var(--text-muted); font-family: var(--font-mono);">${fmtNum(p.war.totalKills)}/${fmtNum(p.war.totalQuota)}</span>
            </div>
          </div>
        `;
      }

      // Hunt cell markup
      let huntCell = "";
      if (p.hunt.participations === 0) {
        huntCell = `<span class="text-muted" style="font-size: 0.88rem;">➖ N/A</span>`;
      } else {
        const isMet = p.hunt.failures === 0;
        const color = isMet ? 'var(--accent-green)' : 'var(--accent-red)';
        const gColor = p.hunt.globalMet ? 'var(--accent-green)' : 'var(--accent-red)';
        huntCell = `
          <div style="display: flex; gap: 6px; min-width: 140px;">
            <div style="flex:1; border: 1px solid rgba(255,255,255,0.08); border-radius: 4px; padding: 6px 4px; text-align: center; background: rgba(0,0,0,0.15);">
              <strong style="color: ${color}; font-size: 0.8rem; display: block;">${p.hunt.failures}/${p.hunt.participations} ${isMet ? MET_STR : MISS_STR}</strong>
              <span style="font-size: 0.65rem; color: var(--text-muted);">Indiv.</span>
            </div>
            <div style="flex:1; border: 1px solid ${p.hunt.globalMet ? 'rgba(46,160,67,0.3)' : 'rgba(248,81,73,0.3)'}; border-radius: 4px; padding: 6px 4px; text-align: center; background: ${p.hunt.globalMet ? 'rgba(46,160,67,0.08)' : 'rgba(248,81,73,0.08)'};">
              <strong style="color: ${gColor}; font-size: 0.8rem; display: block;">${p.hunt.globalMet ? '✔ TOTAL' : '❌ TOTAL'}</strong>
              <span style="font-size: 0.65rem; color: var(--text-muted); font-family: var(--font-mono);">${fmtComma(p.hunt.totalPoints)}/${fmtComma(p.hunt.totalQuota)}</span>
            </div>
          </div>
        `;
      }

      // Festival cell markup
      let festCell = "";
      if (p.festival.participations === 0) {
        festCell = `<span class="text-muted" style="font-size: 0.88rem;">➖ N/A</span>`;
      } else {
        const isMet = p.festival.failures === 0;
        const color = isMet ? 'var(--accent-green)' : 'var(--accent-red)';
        const gColor = p.festival.globalMet ? 'var(--accent-green)' : 'var(--accent-red)';
        festCell = `
          <div style="display: flex; gap: 6px; min-width: 140px;">
            <div style="flex:1; border: 1px solid rgba(255,255,255,0.08); border-radius: 4px; padding: 6px 4px; text-align: center; background: rgba(0,0,0,0.15);">
              <strong style="color: ${color}; font-size: 0.8rem; display: block;">${p.festival.failures}/${p.festival.participations} ${isMet ? MET_STR : MISS_STR}</strong>
              <span style="font-size: 0.65rem; color: var(--text-muted);">Indiv.</span>
            </div>
            <div style="flex:1; border: 1px solid ${p.festival.globalMet ? 'rgba(46,160,67,0.3)' : 'rgba(248,81,73,0.3)'}; border-radius: 4px; padding: 6px 4px; text-align: center; background: ${p.festival.globalMet ? 'rgba(46,160,67,0.08)' : 'rgba(248,81,73,0.08)'};">
              <strong style="color: ${gColor}; font-size: 0.8rem; display: block;">${p.festival.globalMet ? '✔ TOTAL' : '❌ TOTAL'}</strong>
              <span style="font-size: 0.65rem; color: var(--text-muted); font-family: var(--font-mono);">${fmtComma(p.festival.totalScore)}/${fmtComma(p.festival.totalQuota)}</span>
            </div>
          </div>
        `;
      }

      // Overall Failures Badge uses globalFailures now
      let failBadgeStyle = "background: rgba(46, 160, 67, 0.15); color: var(--accent-green); border: 1px solid rgba(46, 160, 67, 0.3);";
      if (p.globalFailures >= 3) {
        failBadgeStyle = "background: rgba(248, 81, 73, 0.25); color: #ff6e67; border: 1px solid rgba(248, 81, 73, 0.6); font-weight: bold; box-shadow: 0 0 10px rgba(248,81,73,0.3);";
      } else if (p.globalFailures >= 2) {
        failBadgeStyle = "background: rgba(248, 81, 73, 0.15); color: var(--accent-red); border: 1px solid rgba(248, 81, 73, 0.3); font-weight: bold;";
      } else if (p.globalFailures >= 1) {
        failBadgeStyle = "background: rgba(210, 153, 34, 0.2); color: #d29922; border: 1px solid rgba(210, 153, 34, 0.4); font-weight: bold;";
      }

      rowsHTML += `
        <tr ${rowClass} style="border-bottom: 1px solid rgba(255,255,255,0.03); transition: background-color 0.2s;">
          <td data-label="${getPerfT('rank')}" style="padding: 12px 8px; font-weight: bold; font-family: var(--font-mono); color: var(--text-muted); font-size: 0.9rem;">
            ${idx + 1}
          </td>
          <td data-label="${getPerfT('player')}" style="padding: 12px 8px;">
            <div style="display: flex; flex-direction: column; align-items: flex-start; gap: 4px;">
              <a href="player.html?view=all&id=${encodeURIComponent(p.name)}" class="perf-link" style="font-size: 0.95rem; font-weight: 700;">
                ${p.name}
              </a>
              ${rankBadge(p.rank)}
            </div>
          </td>
          <td data-label="${getPerfT('war')}" style="padding: 12px 8px;">
            ${warCell}
          </td>
          <td data-label="${getPerfT('hunt')}" style="padding: 12px 8px;">
            ${huntCell}
          </td>
          <td data-label="${getPerfT('festival')}" style="padding: 12px 8px;">
            ${festCell}
          </td>
          <td data-label="${getPerfT('failures')}" style="padding: 12px 8px; text-align: center; vertical-align: middle;">
            <span class="badge" style="${failBadgeStyle} font-size: 0.9rem; padding: 4px 12px; border-radius: 20px; display: inline-block; min-width: 48px;">
              ${p.globalFailures}
            </span>
            <div style="font-size: 0.65rem; color: var(--text-muted); margin-top: 4px;">Globales</div>
          </td>
        </tr>
      `;
    });

    tableBody.innerHTML = rowsHTML;
  }

  function init() {
    const isUnlocked = sessionStorage.getItem('performance_unlocked') === 'true';
    if (isUnlocked) {
      initDashboard();
    } else {
      renderLockScreen();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      window.addEventListener('languageChanged', () => {
        if (sessionStorage.getItem('performance_unlocked') === 'true') {
          renderDashboardUI();
        } else {
          renderLockScreen();
        }
      });
      init();
    });
  } else {
    window.addEventListener('languageChanged', () => {
      if (sessionStorage.getItem('performance_unlocked') === 'true') {
        renderDashboardUI();
      } else {
        renderLockScreen();
      }
    });
    init();
  }

})();
