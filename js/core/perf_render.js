/**
 * Performance dashboard: sortPlayers, renderDashboardUI cards+table+charts, init bootstrap
 * Requires: perf_access.js, perf_metrics.js, Utils.charts.* for chart theming
 * Auto-split from the original large monolithic JS file (globals preserved).
 */

  function sortPlayers() {
    const sortSelect = document.getElementById('perf-sort');
    const sortMode = sortSelect ? sortSelect.value : 'rank';

    cachedPlayers.sort((a, b) => {
      if (sortMode === 'rank') {
        const _rn = x => { const v = (x || ''); return v.includes('5')?5:v.includes('4')?4:v.includes('3')?3:v.includes('2')?2:v.includes('1')?1:0; };
        const diff = _rn(b.rank) - _rn(a.rank);
        return diff !== 0 ? diff : (a.name || '').localeCompare(b.name || '');
      }
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
          <span class="stat-icon" style="color: var(--accent-cyan);">👥</span>
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
            <option value="rank" selected>${window.t ? window.t('sort_rank') : 'Sort by Rank'}</option>
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
      if (query && !p.name.toLowerCase().includes(query)
               && !(p.uid || '').toLowerCase().includes(query)) return false;
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
              <a href="player.html?view=all&uid=${encodeURIComponent(p.uid||'')}${!p.uid?'&id='+encodeURIComponent(p.name):''}" class="perf-link" style="font-size: 0.95rem; font-weight: 700;">
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
