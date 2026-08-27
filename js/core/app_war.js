/**
 * UE Guild Dashboard — War page (war.html): initWar, renderWarList, renderWarDetail
 * Auto-split from the original 1492-line core/app.js — globals preserved (init*, render*).
 * Requires: app_common.js (for loadJSON, fmt*, setLoading, rankBadge, DATA_BASE, _getThemeColor,
 *                               updateChartDefaults, getHashParam, filterTable, setActiveNav).
 */

async function initWar() {
  const listView   = document.getElementById('war-list-view');
  const detailView = document.getElementById('war-detail-view');
  if (!listView && !detailView) return;

  // Load both data sources:
  // - weekly.json → weekly overview list + 52-week chart
  // - wars.json   → member detail view (unchanged)
  let wars, weekly;
  try {
    [wars, weekly] = await Promise.all([
      loadJSON('wars.json'),
      loadJSON('weekly.json'),
    ]);
  } catch (err) {
    if (listView) setError(listView, 'Could not load war data. ' + err.message);
    return;
  }

  const hash = getHashParam();

  if (hash) {
    // ── Detail view ── (month hash e.g. #2026-03)
    if (listView)   listView.style.display   = 'none';
    if (detailView) detailView.style.display = '';

    const war = wars.find(w => w.month === hash);
    if (!war) {
      setError(detailView, `No data found for "${hash}". The report may not exist yet.`);
      return;
    }
    renderWarDetail(detailView, war);
  } else {
    // ── List view ──
    if (listView)   listView.style.display   = '';
    if (detailView) detailView.style.display = 'none';
    renderWarList(listView, weekly, wars);
  }

  // Hashchange handled by global router below
}

function renderWarList(container, weekly, wars) {
  // The list shows monthly reports; the chart uses weekly data.
  if (!wars || !wars.length) {
    setEmpty(container, 'No war reports yet', 'Upload a Guild List Excel file to start tracking war data.');
    return;
  }

  const sortedWars = [...wars].reverse(); // newest monthly first
  const latest = sortedWars[0];

  // Use the last weekly.json entry for headline stats (last actual GUILD_LIST report)
  const latestWeek = weekly && weekly.length ? weekly[weekly.length - 1] : null;
  const lrPower = latestWeek ? latestWeek.total_power : (latest ? latest.total_might : 0);
  const lrKills = latestWeek ? latestWeek.total_kills : (latest ? latest.total_kills : 0);
  const lrMembers = latestWeek ? latestWeek.member_count : (latest ? latest.total_members : 0);
  const lrAvg = lrMembers > 0 ? Math.floor(lrPower / lrMembers) : 0;

  // Chart data from weekly.json (weekly granularity, up to 52 weeks)
  // Each entry uses the LAST GUILD_LIST report of that week as the single source of truth.
  const chartWeeks  = weekly ? [...weekly].slice(-52) : [];
  const chartLabels = chartWeeks.map(w => w.chart_label || w.label);
  const chartPower  = chartWeeks.map(w => w.total_power);
  const chartKills  = chartWeeks.map(w => w.total_kills);
  // report_date: the exact GUILD_LIST day used for that week's totals
  const chartReportDates  = chartWeeks.map(w => w.report_date || '');
  const chartMemberCounts = chartWeeks.map(w => w.member_count || 0);

  container.innerHTML = `
    <div class="stats-grid" style="margin-bottom:1.5rem;">
      <div class="stat-card blue">
        <div class="stat-icon">📅</div>
        <div class="stat-value">${wars.length}</div>
        <div class="stat-label" data-i18n="monthly_reports">${t('monthly_reports')}</div>
      </div>
      <div class="stat-card green">
        <div class="stat-icon">👥</div>
        <div class="stat-value">${lrMembers}</div>
        <div class="stat-label" data-i18n="members_last">${t('members_last')}</div>
      </div>
      <div class="stat-card orange">
        <div class="stat-icon">🏰</div>
        <div class="stat-value">${fmtCompact(lrPower)}</div>
        <div class="stat-label" data-i18n="might_last">${t('might_last')}</div>
      </div>
      <div class="stat-card yellow">
        <div class="stat-icon">⚔️</div>
        <div class="stat-value">${fmtCompact(lrKills)}</div>
        <div class="stat-label" data-i18n="kills_last">${t('kills_last')}</div>
      </div>
      <div class="stat-card purple">
        <div class="stat-icon">📊</div>
        <div class="stat-value">${fmtCompact(lrAvg)}</div>
        <div class="stat-label" data-i18n="avg_might_last">${t('avg_might_last')}</div>
      </div>
    </div>

    <div class="card" style="margin-bottom:1.5rem;">
      <div class="card-header">
        <h2>📈 ${t('yearly_history')}</h2>
      </div>
      <div class="card-body">
        <div class="chart-box" style="position:relative;height:250px;">
          <canvas id="chart-war-combined-guild"></canvas>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <h2>📋 ${t('all_war_reports')}</h2>
        <span class="badge-count">${wars.length} ${wars.length !== 1 ? t('reports_suffix') : t('reports_suffix').replace(/s$/, '')}</span>
      </div>
      <div class="card-body" style="padding:0;">
        <div id="war-month-list"></div>
      </div>
    </div>`;

  // Render monthly report list
  const list = document.getElementById('war-month-list');
  list.innerHTML = sortedWars.map((w, i) => `
    <a href="war.html#${w.month}" style="text-decoration:none;">
      <div class="session-card" style="border-radius:0;border-left:none;border-right:none;border-top:none;margin:0;cursor:pointer;" onmouseover="this.style.background='var(--bg-hover)'" onmouseout="this.style.background=''">
        <div class="session-title">
          <span>🏰 ${w.label}${i === 0 ? ` <span class="badge" style="font-size:0.7rem;margin-left:6px;">${t('latest')}</span>` : ''}</span>
          <span style="font-size:0.78rem;color:var(--text-muted);">${w.snapshots_count} ${w.snapshots_count !== 1 ? t('snapshots_suffix') : t('snapshots_suffix').replace(/s$/, '')}</span>
        </div>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:0.5rem;font-size:0.85rem;color:var(--text-secondary);">
          <div>👥 <span data-i18n="players">${t('players')}</span>: <strong style="color:var(--text-primary);">${w.total_members}</strong></div>
          <div>⚔️ <span data-i18n="guild_kills">${t('guild_kills')}</span>: <strong style="color:var(--accent-yellow);">${fmtCompact(w.total_kills)}</strong></div>
          <div>🏰 <span data-i18n="average">${t('average')}</span> <span data-i18n="might">${t('might')}</span>: <strong style="color:var(--accent-cyan);">${fmtCompact(w.avg_might)}</strong></div>
          <div>📈 <span data-i18n="kills_gained_title">${t('kills_gained_title')}</span>: <strong style="color:var(--accent-green);">${fmtCompact(w.total_kills_gained)}</strong></div>
        </div>
        <div style="margin-top:8px;font-size:0.8rem;color:var(--accent-cyan);" data-i18n="view_breakdown">${t('view_breakdown')}</div>
      </div>
    </a>`).join('');

  // Render the 52-week chart using weekly data
  if (chartWeeks.length >= 1 && window.Chart) {
    updateChartDefaults();

    const _tickFmt = v => v>=1e9?(v/1e9).toFixed(1)+'B':v>=1e6?(v/1e6).toFixed(1)+'M':v>=1e3?(v/1e3).toFixed(0)+'k':v;
    const _tpCfg = {
      backgroundColor: _getThemeColor('--bg-secondary', 'rgba(10,12,18,0.97)'),
      titleColor: _getThemeColor('--text-primary', '#e6edf3'),
      bodyColor: _getThemeColor('--text-secondary', '#8b949e'),
      borderColor: _getThemeColor('--border', 'rgba(99,110,123,0.4)'),
      borderWidth: 1, padding: 12, cornerRadius: 10,
      titleFont: { size: 12, weight: '600' }, bodyFont: { size: 12 },
      displayColors: true, boxWidth: 8, boxHeight: 8, usePointStyle: true
    };

    const ctxGuild = document.getElementById('chart-war-combined-guild');
    if (ctxGuild) {
      const gCtx = ctxGuild.getContext('2d');
      const blueColor = _getThemeColor('--accent-cyan', '#06b6d4');
      const redColor  = _getThemeColor('--accent-red', '#f85149');
      
      const gBlue = gCtx.createLinearGradient(0, 0, 0, 280);
      gBlue.addColorStop(0, blueColor + '20'); gBlue.addColorStop(1, blueColor + '00');
      const gRed = gCtx.createLinearGradient(0, 0, 0, 280);
      gRed.addColorStop(0, redColor + '20'); gRed.addColorStop(1, redColor + '00');

      new Chart(gCtx, {
        type: 'line',
        data: { labels: chartLabels, datasets: [
          { label: t('chart_guild_power'), data: chartPower, borderColor: blueColor, backgroundColor: gBlue,
            borderWidth: 2.5, tension: 0.4, fill: true,
            pointRadius: 0, pointBackgroundColor: blueColor, pointBorderColor: _getThemeColor('--bg-primary', 'rgba(10,12,18,0.9)'),
            pointBorderWidth: 2, pointHoverRadius: 6, pointHoverBackgroundColor: blueColor,
            pointHoverBorderColor: '#fff', pointHoverBorderWidth: 2, yAxisID: 'y',
            _cssBorderVar: '--accent-cyan', _cssBgVar: '--accent-cyan' },
          { label: t('chart_total_kills'), data: chartKills, borderColor: redColor, backgroundColor: gRed,
            borderWidth: 2.5, tension: 0.4, fill: true,
            pointRadius: 0, pointBackgroundColor: redColor, pointBorderColor: _getThemeColor('--bg-primary', 'rgba(10,12,18,0.9)'),
            pointBorderWidth: 2, pointHoverRadius: 6, pointHoverBackgroundColor: redColor,
            pointHoverBorderColor: '#fff', pointHoverBorderWidth: 2, yAxisID: 'y2',
            _cssBorderVar: '--accent-red', _cssBgVar: '--accent-red' }
        ]},
        options: {
          responsive: true, maintainAspectRatio: false,
          animation: { duration: 600, easing: 'easeOutQuart' },
          interaction: { mode: 'index', intersect: false },
          plugins: {
            legend: { display: true, position: 'top', labels: { boxWidth: 10, boxHeight: 10, usePointStyle: true, pointStyle: 'circle', color: _getThemeColor('--text-secondary', '#8b949e'), padding: 16, font: { size: 12 } } },
            tooltip: {
              ..._tpCfg,
              mode: 'index', intersect: false,
              callbacks: {
                title: (items) => {
                  const i = items[0]?.dataIndex ?? 0;
                  const rd = chartReportDates[i];
                  const mc = chartMemberCounts[i];
                  const w = `${t('week_of')} ${chartLabels[i]}`;
                  return rd ? `${w}  (${t('report_label')} ${rd}, ${mc} ${t('members_lower')})` : w;
                },
                label: (item) => `  ${item.dataset.label}: ${_tickFmt(item.raw)}`
              }
            }
          },
          scales: {
            x: { grid: { display: false }, border: { display: false }, ticks: { color: _getThemeColor('--text-muted', '#6e7681'), font: { size: 11 } } },
            y:  { beginAtZero: false, border: { display: false }, ticks: { callback: _tickFmt, color: _getThemeColor('--text-muted', '#6e7681'), font: { size: 11 }, padding: 8 }, grid: { color: _getThemeColor('--border', 'rgba(48,54,61,0.5)') } },
            y2: { position: 'right', beginAtZero: false, border: { display: false }, ticks: { callback: _tickFmt, color: _getThemeColor('--text-muted', '#6e7681'), font: { size: 11 }, padding: 8 }, grid: { drawOnChartArea: false } }
          }
        }
      });
    }
  }
}

function renderWarDetail(container, war) {
  // Sort members: by kills desc
  const members = [...(war.members || [])].sort((a, b) => (b.kills || 0) - (a.kills || 0));

  container.innerHTML = `
    <div class="breadcrumb">
      <a href="war.html">${t('nav_war')}</a>
      <span class="sep">›</span>
      <span class="current">${war.label}</span>
    </div>

    <div class="detail-header">
      <h2>🏰 ${war.label}</h2>
      <div class="meta-row">
        <div class="meta-item">📅 <span data-i18n="date">${t('date')}</span>: <strong>${war.month}</strong></div>
        <div class="meta-item">👥 <span data-i18n="players">${t('players')}</span>: <strong>${war.total_members}</strong></div>
        <div class="meta-item">⚔️ <span data-i18n="guild_kills">${t('guild_kills')}</span>: <strong>${fmtCompact(war.total_kills)}</strong></div>
        <div class="meta-item">🏰 <span data-i18n="average">${t('average')}</span> <span data-i18n="might">${t('might')}</span>: <strong>${fmtCompact(war.avg_might)}</strong></div>
        <div class="meta-item">📊 <span data-i18n="snapshots_suffix">${t('snapshots_suffix')}</span>: <strong>${war.snapshots_count}</strong></div>
      </div>
    </div>

    <div class="stats-grid" style="margin-bottom:1.5rem;">
      <div class="stat-card blue">
        <div class="stat-icon">🏰</div>
        <div class="stat-value">${fmtCompact(war.total_might)}</div>
        <div class="stat-label" data-i18n="guild_power_title">${t('guild_power_title')}</div>
      </div>
      <div class="stat-card yellow">
        <div class="stat-icon">⚔️</div>
        <div class="stat-value">${fmtCompact(war.total_kills)}</div>
        <div class="stat-label" data-i18n="guild_kills_title">${t('guild_kills_title')}</div>
      </div>
      <div class="stat-card green">
        <div class="stat-icon">📈</div>
        <div class="stat-value">${fmtCompact(war.total_might_gained)}</div>
        <div class="stat-label" data-i18n="might_gained_title">${t('might_gained_title')}</div>
      </div>
      <div class="stat-card orange">
        <div class="stat-icon">🗡️</div>
        <div class="stat-value">${fmtCompact(war.total_kills_gained)}</div>
        <div class="stat-label" data-i18n="kills_gained_title">${t('kills_gained_title')}</div>
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <h2>👥 ${t('members_rankings')}</h2>
        <span class="badge-count">${members.length} ${t('players')}</span>
      </div>
      <div class="card-body" style="padding:0.5rem;">
        <div class="toolbar">
          <div class="search-box">
            <span class="search-icon">🔍</span>
            <input type="text" id="war-search" placeholder="${t('search_placeholder')}" autocomplete="off">
          </div>
          <select class="select-box" id="war-sort">
            <option value="rank" selected>${t('sort_rank')}</option>
            <option value="might">${t('sort_might')}</option>
            <option value="kills">${t('sort_kills')}</option>
            <option value="name">${t('sort_name')}</option>
          </select>
        </div>
        <div class="table-wrapper">
          <table id="war-members-table">
            <thead>
              <tr>
                <th>#</th>
                <th data-i18n="table_player">${t('table_player')}</th>
                <th class="center" data-i18n="table_rank">${t('table_rank')}</th>
                <th class="right" data-i18n="table_might">${t('table_might')}</th>
                <th class="right hide-mobile" data-i18n="table_might_gained">${t('table_might_gained')}</th>
                <th class="right" data-i18n="table_kills">${t('table_kills')}</th>
                <th class="right hide-mobile" data-i18n="table_kills_gained">${t('table_kills_gained')}</th>
                <th class="right" data-i18n="table_goal">${t('table_goal')}</th>
                <th class="center" data-i18n="table_status">${t('table_status')}</th>
              </tr>
            </thead>
            <tbody id="war-tbody"></tbody>
          </table>
        </div>
      </div>
    </div>`;

  const tbody = document.getElementById('war-tbody');
  let currentMembers = [...members];

  function renderRows() {
    if (!currentMembers.length) {
      tbody.innerHTML = `<tr><td colspan="9"><div class="empty-state" style="padding:2rem;"><p>${t('no_filter_match')}</p></div></td></tr>`;
      return;
    }
    const KILL_GOAL = 1_000_000;
    tbody.innerHTML = currentMembers.map((m, i) => {
      const gained  = Math.max(0, m.kills_diff || 0);
      const killPct = Math.min(100, Math.round((gained / KILL_GOAL) * 100));
      const pctColor = killPct >= 100 ? 'var(--accent-green)' : killPct >= 50 ? 'var(--accent-yellow)' : 'var(--accent-red)';
      const met = gained >= KILL_GOAL;
      return `
      <tr data-searchable="${(m.name || '').toLowerCase()} ${(m.rank || '').toLowerCase()}">
        <td class="mono" data-label="#" style="color:var(--text-muted);">${i + 1}</td>
        <td data-label="${t('table_player')}" style="font-weight:500;"><a href="player.html?view=war&uid=${encodeURIComponent(m.uid||m.igg_id||'')}${!(m.uid||m.igg_id)?'&id='+encodeURIComponent(m.name||''):''}&month=${war.month}" class="member-link">${m.name || '-'}</a></td>
        <td class="center" data-label="${t('table_rank')}">${rankBadge(m.rank)}</td>
        <td class="right mono" data-label="${t('table_might')}">${fmtCompact(m.might)}</td>
        <td class="right hide-mobile" data-label="${t('table_might_gained')}">${fmtDelta(m.might_diff)}</td>
        <td class="right mono" data-label="${t('table_kills')}" style="color:var(--accent-yellow);">${fmtCompact(m.kills)}</td>
        <td class="right hide-mobile" data-label="${t('table_kills_gained')}">${fmtDelta(m.kills_diff)}</td>
        <td class="right" data-label="${t('table_goal')}">
          <span class="mono" style="font-weight:700;">${fmtCompact(gained)} <span style="font-size:0.75rem;color:var(--text-muted);">/ 1M</span></span>
          <div style="display:flex;align-items:center;gap:5px;margin-top:3px;justify-content:flex-end;">
            <div class="progress-bar" style="width:55px;">
              <div class="progress-fill" style="width:${killPct}%;background:${pctColor};"></div>
            </div>
            <span class="pct-label" style="color:${pctColor};">${killPct}%</span>
          </div>
        </td>
        <td class="center" data-label="${t('table_status')}">${met
          ? `<span class="badge-met">✅ ${t('status_met')}</span>`
          : `<span class="badge-not-met">❌ ${t('status_miss')}</span>`}
        </td>
      </tr>`;
    }).join('');
  }

  let _search = '';

  applyAll();

  // Search and Sort
  document.getElementById('war-search').addEventListener('input', e => { 
    _search = e.target.value.trim().toLowerCase(); 
    applyAll(); 
  });
  
  document.getElementById('war-sort').addEventListener('change', () => { 
    applyAll(); 
  });

  function applyAll() {
    const sKey = document.getElementById('war-sort').value;
    const _rn  = x => { const v = (x || ''); return v.includes('5')?5:v.includes('4')?4:v.includes('3')?3:v.includes('2')?2:v.includes('1')?1:0; };
    currentMembers = members.filter(m => !_search
      || (m.name || '').toLowerCase().includes(_search)
      || (m.uid  || '').toLowerCase().includes(_search));
    currentMembers.sort((a, b) => {
      if (sKey === 'name') return (a.name || '').localeCompare(b.name || '');
      if (sKey === 'rank') {
        const diff = _rn(b.rank) - _rn(a.rank);
        return diff !== 0 ? diff : (a.name || '').localeCompare(b.name || '');
      }
      return (b[sKey] || 0) - (a[sKey] || 0);
    });
    renderRows();
  }
}

// ══════════════════════════════════════════════════════════
