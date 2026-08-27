/**
 * UE Guild Dashboard — Hunt page (hunt.html): initHunt, renderHuntList, renderHuntDetail
 * Auto-split from the original 1492-line core/app.js — globals preserved (init*, render*).
 * Requires: app_common.js (for loadJSON, fmt*, setLoading, rankBadge, DATA_BASE, _getThemeColor,
 *                               updateChartDefaults, getHashParam, filterTable, setActiveNav).
 */

async function initHunt() {
  const listView   = document.getElementById('hunt-list-view');
  const detailView = document.getElementById('hunt-detail-view');
  if (!listView && !detailView) return;

  let hunts;
  try {
    hunts = await loadJSON('hunts.json');
  } catch (err) {
    if (listView) setError(listView, 'Could not load hunts.json. ' + err.message);
    return;
  }

  const hash = getHashParam();

  if (hash) {
    if (listView)   listView.style.display   = 'none';
    if (detailView) detailView.style.display = '';
    const hunt = hunts.find(h => h.id === hash || h.date === hash);
    if (!hunt) { setError(detailView, `No data found for "${hash}".`); return; }
    renderHuntDetail(detailView, hunt);
  } else {
    if (listView)   listView.style.display   = '';
    if (detailView) detailView.style.display = 'none';
    renderHuntList(listView, hunts);
  }

  // Hashchange handled by global router below
}

function renderHuntList(container, hunts) {
  if (!hunts.length) {
    setEmpty(container, t('no_hunt_reports'), t('upload_gift_stats_help'));
    return;
  }

  const sorted = [...hunts].reverse();
  const chartHunts = [...hunts].slice(-52);
  const chartLabels = chartHunts.map(h => h.chart_label || h.id || h.date);
  const chartTotalPts = [];
  const chartMonsters = [0,0,0,0,0];
  const chartChests = [0,0,0,0,0];
  
  chartHunts.forEach(h => {
    let wTot = 0;
    (h.players || []).forEach(p => {
      wTot += (p.pts_total || 0);
      for(let i=1; i<=5; i++) {
        chartMonsters[i-1] += (p.monsters?.[`lvl${i}`] || 0);
        chartChests[i-1] += (p.purchases?.[`lvl${i}`] || 0);
      }
    });
    chartTotalPts.push(wTot);
  });

  const totalPlayers = hunts.reduce((s, h) => s + (h.summary.total_players || 0), 0);
  const avgMet = hunts.length
    ? Math.round(hunts.reduce((s, h) => {
        return s + (h.summary.total_players > 0 ? (h.summary.met_minimum / h.summary.total_players) : 0);
      }, 0) / hunts.length * 100) : 0;

  container.innerHTML = `
    <div class="stats-grid" style="margin-bottom:1.5rem;">
      <div class="stat-card blue">
        <div class="stat-icon">📋</div>
        <div class="stat-value">${hunts.length}</div>
        <div class="stat-label" data-i18n="total_hunt_reports">${t('total_hunt_reports')}</div>
      </div>
      <div class="stat-card green">
        <div class="stat-icon">✅</div>
        <div class="stat-value">${avgMet}%</div>
        <div class="stat-label" data-i18n="avg_goal_met_rate">${t('avg_goal_met_rate')}</div>
      </div>
      <div class="stat-card yellow">
        <div class="stat-icon">👥</div>
        <div class="stat-value">${sorted[0]?.summary?.total_players || '-'}</div>
        <div class="stat-label" data-i18n="players_latest">${t('players_latest')}</div>
      </div>
      <div class="stat-card purple">
        <div class="stat-icon">🎯</div>
        <div class="stat-value">${sorted[0]?.summary?.min_required || '-'}</div>
        <div class="stat-label" data-i18n="min_required_pts">${t('min_required_pts')}</div>
      </div>
    </div>

    <div class="card" style="margin-bottom:1.5rem;">
      <div class="card-header">
        <h2 data-i18n="hunt_history_title">📈 ${t('hunt_history_title')}</h2>
      </div>
      <div class="card-body">
        <div class="chart-box" style="position:relative;height:250px;">
          <canvas id="chart-hunt-pts-guild"></canvas>
        </div>
      </div>
    </div>

    <div class="card" style="margin-bottom:1.5rem;">
      <div class="card-header">
        <h2 data-i18n="hunt_box_history_title">📦 ${t('hunt_box_history_title')}</h2>
      </div>
      <div class="card-body">
        <div class="chart-box" style="position:relative;height:250px;">
          <canvas id="chart-hunt-box-guild"></canvas>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <h2 data-i18n="all_hunt_reports">📋 ${t('all_hunt_reports')}</h2>
        <span class="badge-count">${hunts.length} ${hunts.length !== 1 ? t('reports_suffix') : t('reports_suffix').replace(/s$/, '')}</span>
      </div>
      <div style="padding: 10px 15px; background: rgba(88,166,255,0.05); border-bottom: 1px solid var(--border); font-size: 0.85rem; color: var(--text-secondary); display:flex; gap:8px; align-items:center;">
        <span>ℹ️</span> <span>${t('latest_report_note')}</span>
      </div>
      <div class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th data-i18n="date">${t('date')}</th>
              <th class="right" data-i18n="players">${t('players')}</th>
              <th class="right" data-i18n="met_goal">${t('met_goal')}</th>
              <th class="right" data-i18n="not_met">${t('not_met')}</th>
              <th class="right" data-i18n="min_required">${t('min_required')}</th>
              <th class="center" data-i18n="goal_rate">${t('goal_rate')}</th>
              <th class="center" data-i18n="table_action">${t('table_action')}</th>
            </tr>
          </thead>
          <tbody>
            ${sorted.map((h, i) => {
              const pct = h.summary.total_players > 0
                ? Math.round((h.summary.met_minimum / h.summary.total_players) * 100) : 0;
              const color = pct >= 80 ? 'var(--accent-green)' : pct >= 50 ? 'var(--accent-yellow)' : 'var(--accent-red)';
              return `
              <tr>
                <td class="mono" data-label="#" style="color:var(--text-muted);">${i + 1}</td>
                <td data-label="${t('date')}" style="font-weight:500;">${h.date}</td>
                <td class="right mono" data-label="${t('players')}">${h.summary.total_players}</td>
                <td class="right" data-label="${t('met_goal')}"><span class="badge-met">✅ ${h.summary.met_minimum}</span></td>
                <td class="right" data-label="${t('not_met')}"><span class="badge-not-met">❌ ${h.summary.not_met}</span></td>
                <td class="right mono" data-label="${t('min_required')}">${h.summary.min_required}</td>
                <td class="center" data-label="${t('goal_rate')}">
                  <div style="display:flex;align-items:center;gap:8px;justify-content:center;">
                    <div class="progress-bar" style="width:80px;">
                      <div class="progress-fill" style="width:${pct}%;background:${color};"></div>
                    </div>
                    <span style="font-weight:700;color:${color};font-family:var(--font-mono);font-size:0.85rem;">${pct}%</span>
                  </div>
                </td>
                <td class="center" data-label="${t('table_action')}">
                  <a href="hunt.html#${h.id}" class="btn btn-primary action-btn">
                    ${t('view_arrow')}
                  </a>
                </td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>`;

  if (chartHunts.length >= 1 && window.Chart) {
    updateChartDefaults();

    const _tpCfg = {
      backgroundColor: _getThemeColor('--bg-secondary', 'rgba(10,12,18,0.97)'),
      titleColor: _getThemeColor('--text-primary', '#e6edf3'),
      bodyColor: _getThemeColor('--text-secondary', '#8b949e'),
      borderColor: _getThemeColor('--border', 'rgba(99,110,123,0.4)'),
      borderWidth: 1, padding: 12, cornerRadius: 10,
      titleFont: { size: 12, weight: '600' }, bodyFont: { size: 12 },
      displayColors: true, boxWidth: 8, boxHeight: 8, usePointStyle: true
    };
    const _tickFmt = v => v>=1e6?(v/1e6).toFixed(1)+'M':v>=1e3?(v/1e3).toFixed(0)+'k':v;

    const ctxHuntLine = document.getElementById('chart-hunt-pts-guild');
    if (ctxHuntLine) {
      const hlCtx = ctxHuntLine.getContext('2d');
      const greenColor = _getThemeColor('--accent-green', '#3fb950');
      const gGreen = hlCtx.createLinearGradient(0, 0, 0, 280);
      gGreen.addColorStop(0, greenColor + '20'); gGreen.addColorStop(1, greenColor + '00');

      new Chart(hlCtx, {
        type: 'line',
        data: { labels: chartLabels, datasets: [{
          label: t('hunt_history_title'), data: chartTotalPts,
          borderColor: greenColor, backgroundColor: gGreen,
          borderWidth: 2.5, tension: 0.4, fill: true,
          pointRadius: 0, pointBackgroundColor: greenColor, pointBorderColor: _getThemeColor('--bg-primary', 'rgba(10,12,18,0.9)'),
          pointBorderWidth: 2, pointHoverRadius: 6, pointHoverBackgroundColor: greenColor,
          pointHoverBorderColor: '#fff', pointHoverBorderWidth: 2,
          _cssBorderVar: '--accent-green', _cssBgVar: '--accent-green'
        }]},
        options: {
          responsive: true, maintainAspectRatio: false,
          animation: { duration: 600, easing: 'easeOutQuart' },
          interaction: { mode: 'index', intersect: false },
          plugins: {
            legend: { display: true, position: 'top', labels: { boxWidth: 10, boxHeight: 10, usePointStyle: true, pointStyle: 'circle', color: _getThemeColor('--text-secondary', '#8b949e'), padding: 16, font: { size: 12 } } },
            tooltip: { ..._tpCfg, mode: 'index', intersect: false, callbacks: { label: c => `  ${c.dataset.label}: ${_tickFmt(c.raw)}` } }
          },
          scales: {
            x: { grid: { display: false }, border: { display: false }, ticks: { color: _getThemeColor('--text-muted', '#6e7681'), font: { size: 11 } } },
            y: { beginAtZero: false, border: { display: false }, ticks: { callback: _tickFmt, color: _getThemeColor('--text-muted', '#6e7681'), font: { size: 11 }, padding: 8 }, grid: { color: _getThemeColor('--border', 'rgba(48,54,61,0.5)') } }
          }
        }
      });
    }

    const lvls = ['Lvl 1','Lvl 2','Lvl 3','Lvl 4','Lvl 5'];
    new Chart(document.getElementById('chart-hunt-box-guild'), {
      type: 'bar',
      data: { labels: lvls, datasets: [
        { label: t('monsters_hunted_all'), data: chartMonsters, backgroundColor: '#a371f7', borderRadius: { topLeft: 6, topRight: 6 }, borderSkipped: false, borderWidth: 0, _cssBgVar: '--accent-purple' },
        { label: t('chests_purchased_all'), data: chartChests,  backgroundColor: '#e3b341', borderRadius: { topLeft: 6, topRight: 6 }, borderSkipped: false, borderWidth: 0, _cssBgVar: '--accent-yellow' }
      ]},
      options: {
        responsive: true, maintainAspectRatio: false,
        animation: { duration: 500, easing: 'easeOutQuart' },
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: { position: 'top', labels: { boxWidth: 10, boxHeight: 10, usePointStyle: true, pointStyle: 'rectRounded', color: _getThemeColor('--text-secondary', '#8b949e'), padding: 16, font: { size: 12 } } },
          tooltip: { ..._tpCfg, mode: 'index', intersect: false, callbacks: { label: c => `  ${c.dataset.label}: ${_tickFmt(c.raw)}` } }
        },
        scales: {
          x: { grid: { display: false }, border: { display: false }, ticks: { color: _getThemeColor('--text-muted', '#6e7681'), font: { size: 11 } } },
          y: { beginAtZero: true, border: { display: false }, ticks: { color: _getThemeColor('--text-muted', '#6e7681'), font: { size: 11 }, padding: 8 }, grid: { color: _getThemeColor('--border', 'rgba(48,54,61,0.5)') } }
        }
      }
    });
  }
}

function renderHuntDetail(container, hunt) {
  const players = [...(hunt.players || [])].sort((a, b) => (b.pts_total || 0) - (a.pts_total || 0));
  const minReq  = hunt.summary.min_required || 0;
  const pct     = hunt.summary.total_players > 0
    ? Math.round((hunt.summary.met_minimum / hunt.summary.total_players) * 100) : 0;

  container.innerHTML = `
    <div class="breadcrumb">
      <a href="hunt.html">${t('nav_hunt')}</a>
      <span class="sep">›</span>
      <span class="current">${hunt.date}</span>
    </div>

    <div class="detail-header">
      <h2>🦅 ${hunt.date}</h2>

    </div>

    <div class="stats-grid" style="margin-bottom:1.5rem;">
      <div class="stat-card blue">
        <div class="stat-icon">👥</div>
        <div class="stat-value">${hunt.summary.total_players}</div>
        <div class="stat-label" data-i18n="players">${t('players')}</div>
      </div>
      <div class="stat-card green">
        <div class="stat-icon">✅</div>
        <div class="stat-value">${hunt.summary.met_minimum}</div>
        <div class="stat-label" data-i18n="met_goal_label" data-i18n-args='{"min":"${minReq}"}'>${t('met_goal_label', {min: minReq})}</div>
      </div>
      <div class="stat-card red">
        <div class="stat-icon">❌</div>
        <div class="stat-value">${hunt.summary.not_met}</div>
        <div class="stat-label" data-i18n="did_not_meet_goal">${t('did_not_meet_goal')}</div>
      </div>
      <div class="stat-card ${pct >= 80 ? 'green' : pct >= 50 ? 'yellow' : 'red'}">
        <div class="stat-icon">🎯</div>
        <div class="stat-value">${pct}%</div>
        <div class="stat-label" data-i18n="goal_met_rate">${t('goal_met_rate')}</div>
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <h2 data-i18n="player_rankings_title">🏆 ${t('player_rankings_title')}</h2>
        <span class="badge-count">${players.length} <span data-i18n="players_suffix">${t('players_suffix')}</span></span>
      </div>
      <div class="card-body" style="padding:0.5rem;">
        <div class="toolbar">
          <div class="search-box">
            <span class="search-icon">🔍</span>
            <input type="text" id="hunt-search" placeholder="${t('search_player_placeholder')}" autocomplete="off">
          </div>
          <select class="select-box" id="hunt-filter">
            <option value="">${t('all_players_filter')}</option>
            <option value="met">✅ ${t('status_met')}</option>
            <option value="not_met">❌ ${t('status_miss')}</option>
          </select>
          <select class="select-box" id="hunt-sort">
            <option value="rank" selected>${t('sort_rank')}</option>
            <option value="name">${t('sort_name')}</option>
            <option value="pts_total">${t('sort_total_pts')}</option>
          </select>
        </div>
        <div class="table-wrapper">
          <table id="hunt-table">
            <thead>
              <tr>
                <th>#</th>
                <th data-i18n="table_player">${t('table_player')}</th>
                <th class="center" data-i18n="table_rank">${t('table_rank')}</th>
                <th class="right" data-i18n="total_score">${t('total_score')}</th>
                <th class="center" data-i18n="table_goal">${t('table_goal')}</th>
                <th class="center" data-i18n="table_status">${t('table_status')}</th>
              </tr>
            </thead>
            <tbody id="hunt-tbody"></tbody>
          </table>
        </div>
      </div>
    </div>`;

  const tbody = document.getElementById('hunt-tbody');
  let currentPlayers = [...players];

  function renderHuntRows() {
    if (!currentPlayers.length) {
      tbody.innerHTML = `<tr><td colspan="10"><div class="empty-state" style="padding:1.5rem;"><p>${t('no_players_match')}</p></div></td></tr>`;
      return;
    }
    tbody.innerHTML = currentPlayers.map((p, i) => {
      const goalPct = minReq > 0 ? Math.min(100, Math.round((p.pts_total / minReq) * 100)) : 0;
      const pctColor = p.met_minimum ? 'var(--accent-green)' : goalPct >= 75 ? 'var(--accent-yellow)' : 'var(--accent-red)';
      return `
        <tr data-searchable="${(p.name || '').toLowerCase()} ${(p.rank || '').toLowerCase()}">
          <td class="mono" data-label="#" style="color:var(--text-muted);">${i + 1}</td>
          <td data-label="${t('table_player')}" style="font-weight:500;"><a href="player.html?view=hunt&uid=${encodeURIComponent(p.uid||p.user_id||'')}${!(p.uid||p.user_id)?'&id='+encodeURIComponent(p.name||''):''}&week=${encodeURIComponent(hunt.id)}" class="member-link">${p.name || '-'}</a></td>
          <td class="center" data-label="${t('table_rank')}">${rankBadge(p.rank || '')}</td>
          <td class="right mono" data-label="${t('points')}" style="font-weight:700;"><span>${fmtCompact(p.pts_total)} <span style="font-size:0.75rem;color:var(--text-muted);">/ ${fmtCompact(minReq)}</span></span></td>
          <td class="center" data-label="${t('goal_rate')}">
            <div style="display:flex;align-items:center;gap:6px;justify-content:center;min-width:100px;">
              <div class="progress-bar" style="width:55px;">
                <div class="progress-fill" style="width:${goalPct}%;background:${pctColor};"></div>
              </div>
              <span class="pct-label" style="color:${pctColor};">${goalPct}%</span>
            </div>
          </td>
          <td class="center" data-label="${t('table_status')}">
            ${p.met_minimum
              ? `<span class="badge-met">✅ ${t('status_met')}</span>`
              : `<span class="badge-not-met">❌ ${t('status_miss')}</span>`}
          </td>
        </tr>`;
    }).join('');
  }

  let _search = '', _filter = '', _sortKey = 'rank';

  applyHuntAll();

  function applyHuntAll() {
    currentPlayers = players.filter(p => {
      const nameOk = !_search
        || (p.name || '').toLowerCase().includes(_search)
        || (p.uid  || p.user_id || '').toLowerCase().includes(_search);
      const filterOk = !_filter || (_filter === 'met' ? p.met_minimum : !p.met_minimum);
      return nameOk && filterOk;
    });
    currentPlayers.sort((a, b) => {
      const _rn = x => { const v=(x||''); return v.includes('5')?5:v.includes('4')?4:v.includes('3')?3:v.includes('2')?2:v.includes('1')?1:0; };
      if (_sortKey === 'name') return (a.name||'').localeCompare(b.name||'');
      if (_sortKey === 'rank') {
        const diff = _rn(b.rank) - _rn(a.rank);
        return diff !== 0 ? diff : (a.name||'').localeCompare(b.name||'');
      }
      return (b[_sortKey]||0) - (a[_sortKey]||0);
    });
    renderHuntRows();
  }

  document.getElementById('hunt-search').addEventListener('input', e => { _search = e.target.value.trim().toLowerCase(); applyHuntAll(); });
  document.getElementById('hunt-filter').addEventListener('change', e => { _filter = e.target.value; applyHuntAll(); });
  document.getElementById('hunt-sort').addEventListener('change', e => { _sortKey = e.target.value; applyHuntAll(); });
}

// ══════════════════════════════════════════════════════════
