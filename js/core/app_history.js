/**
 * UE Guild Dashboard — History page (history.html): initHistory + renderHistory* helpers
 * Auto-split from the original 1492-line core/app.js — globals preserved (init*, render*).
 * Requires: app_common.js (for loadJSON, fmt*, setLoading, rankBadge, DATA_BASE, _getThemeColor,
 *                               updateChartDefaults, getHashParam, filterTable, setActiveNav).
 */

async function initHistory() {
  const container = document.getElementById('history-container');
  if (!container) return;

  setLoading(container, t('loading_history'));

  let data;
  try {
    data = await loadJSON('history.json');
  } catch (err) {
    setError(container, 'Could not load history.json. ' + err.message);
    return;
  }

  const members = data.members || [];
  if (!members.length) {
    setEmpty(container, t('not_found'), t('not_enough_data'));
    return;
  }

  const hash = getHashParam();
  if (hash) {
    const member = members.find(m => m.name === hash);
    if (member) {
      // Redirect to player dashboard with all charts - use UID for stable identity
      window.location.replace(`./player.html?view=all&uid=${encodeURIComponent(member.uid || '')}${!member.uid ? '&id=' + encodeURIComponent(member.name) : ''}`);
      return;
    }
  }

  renderHistoryList(container, members, data.last_updated);

  window.addEventListener('hashchange', () => {
    const h = getHashParam();
    if (h) {
      const m = members.find(x => x.name === h);
      if (m) {
        window.location.replace(`./player.html?view=all&uid=${encodeURIComponent(m.uid || '')}${!m.uid ? '&id=' + encodeURIComponent(m.name) : ''}`);
        return;
      }
    }
    renderHistoryList(container, members, data.last_updated);
  });
}

function renderHistoryList(container, members, lastUpdated) {
  // Sort by latest might desc
  const sorted = [...members].sort((a, b) => {
    const aS = a.snapshots || [];
    const bS = b.snapshots || [];
    const aM = aS.length ? aS[aS.length - 1].might || 0 : 0;
    const bM = bS.length ? bS[bS.length - 1].might || 0 : 0;
    return bM - aM;
  });

  const totalMight = sorted.reduce((s, m) => {
    const snaps = m.snapshots || [];
    return s + (snaps.length ? snaps[snaps.length - 1].might || 0 : 0);
  }, 0);

  const totalKills = sorted.reduce((s, m) => {
    const snaps = m.snapshots || [];
    return s + (snaps.length ? snaps[snaps.length - 1].kills || 0 : 0);
  }, 0);

  container.innerHTML = `
    <div class="stats-grid" style="margin-bottom:1.5rem;">
      <div class="stat-card purple">
        <div class="stat-icon">👥</div>
        <div class="stat-value">${members.length}</div>
        <div class="stat-label" data-i18n="tracked_members">${t('tracked_members')}</div>
      </div>
      <div class="stat-card blue">
        <div class="stat-icon">🏰</div>
        <div class="stat-value">${fmtCompact(totalMight)}</div>
        <div class="stat-label" data-i18n="total_guild_might_label">${t('total_guild_might_label')}</div>
      </div>
      <div class="stat-card yellow">
        <div class="stat-icon">⚔️</div>
        <div class="stat-value">${fmtCompact(totalKills)}</div>
        <div class="stat-label" data-i18n="total_guild_kills_label">${t('total_guild_kills_label')}</div>
      </div>
      <div class="stat-card green">
        <div class="stat-icon">📅</div>
        <div class="stat-value">${lastUpdated || '-'}</div>
        <div class="stat-label" data-i18n="last_updated_label">${t('last_updated_label')}</div>
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <h2>📈 ${t('member_history_overview')}</h2>
        <span class="badge-count">${members.length} ${t('players')}</span>
      </div>
      <div class="card-body" style="padding:0.5rem;">
        <div class="toolbar">
          <div class="search-box">
            <span class="search-icon">🔍</span>
            <input type="text" id="history-search" placeholder="${t('search_member_placeholder')}" autocomplete="off">
          </div>
          <select class="select-box" id="history-sort">
            <option value="rank" selected>${t('sort_rank')}</option>
            <option value="might">${t('sort_might')}</option>
            <option value="kills">${t('sort_kills')}</option>
            <option value="might_diff">${t('sort_might_diff')}</option>
            <option value="kills_diff">${t('sort_kills_diff')}</option>
            <option value="name">${t('sort_name')}</option>
          </select>
          <select class="select-box" id="history-rank-filter">
            <option value="">${t('all_ranks')}</option>
            <option value="r5">R5</option>
            <option value="r4">R4</option>
            <option value="r3">R3</option>
            <option value="r2">R2</option>
            <option value="r1">R1</option>
          </select>
        </div>
        <div class="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th data-i18n="player">${t('player')}</th>
                <th class="center" data-i18n="rank_label">${t('rank_label')}</th>
                <th class="right" data-i18n="current_might">${t('current_might')}</th>
                <th class="right" data-i18n="might_gained_label">${t('might_gained_label')}</th>
                <th class="right" data-i18n="current_kills">${t('current_kills')}</th>
                <th class="right" data-i18n="kills_gained_label">${t('kills_gained_label')}</th>
                <th class="right" data-i18n="snapshots_label">${t('snapshots_label')}</th>
                <th class="center" data-i18n="detail_label">${t('detail_label')}</th>
              </tr>
            </thead>
            <tbody id="history-tbody"></tbody>
          </table>
        </div>
      </div>
    </div>`;

  const tbody = document.getElementById('history-tbody');
  let currentMembers = [...sorted];

  function renderHistoryRows() {
    if (!currentMembers.length) {
      tbody.innerHTML = `<tr><td colspan="9"><div class="empty-state" style="padding:1.5rem;"><p>${t('no_members_match')}</p></div></td></tr>`;
      return;
    }
    tbody.innerHTML = currentMembers.map((m, i) => {
      const snaps = m.snapshots || [];
      const last  = snaps.length ? snaps[snaps.length - 1] : null;
      const might      = last ? last.might      || 0 : 0;
      const might_diff = last ? last.might_diff || 0 : 0;
      const kills      = last ? last.kills      || 0 : 0;
      const kills_diff = last ? last.kills_diff || 0 : 0;
      const lastRank   = last ? last.rank || '' : '';
      return `
        <tr data-searchable="${(m.name || '').toLowerCase()} ${lastRank.toLowerCase()}">
          <td class="mono" data-label="#" style="color:var(--text-muted);">${i + 1}</td>
          <td data-label="${t('table_player')}" style="font-weight:500;"><a href="player.html?view=all&uid=${encodeURIComponent(m.uid||'')}${!m.uid?'&id='+encodeURIComponent(m.name||''):''}" class="member-link">${m.name || '-'}</a></td>
          <td class="center" data-label="${t('table_rank')}">${rankBadge(lastRank)}</td>
          <td class="right mono" data-label="${t('table_might')}">${fmtCompact(might)}</td>
          <td class="right hide-mobile" data-label="${t('table_might_gained')}">${fmtDelta(might_diff)}</td>
          <td class="right mono" data-label="${t('table_kills')}" style="color:var(--accent-yellow);">${fmtCompact(kills)}</td>
          <td class="right hide-mobile" data-label="${t('table_kills_gained')}">${fmtDelta(kills_diff)}</td>
          <td class="right mono" data-label="${t('snapshots_label')}">${snaps.length}</td>
          <td class="center" data-label="${t('table_action')}">
            <a href="player.html?view=all&uid=${encodeURIComponent(m.uid||'')}${!m.uid?'&id='+encodeURIComponent(m.name||''):''}" class="btn btn-primary action-btn">${t('view_arrow')}</a>
          </td>
        </tr>`;
    }).join('');
  }

  let _search = '', _rank = '', _sort = 'rank';

  applyHistoryAll();

  function applyHistoryAll() {
    const _rn = x => { const v=(x||''); return v.includes('5')?5:v.includes('4')?4:v.includes('3')?3:v.includes('2')?2:v.includes('1')?1:0; };
    currentMembers = sorted.filter(m => {
      const snaps = m.snapshots || [];
      const last = snaps.length ? snaps[snaps.length - 1] : {};
      const nameOk = !_search
        || (m.name || '').toLowerCase().includes(_search)
        || (m.uid  || '').toLowerCase().includes(_search);
      const rankOk = !_rank || (last.rank || '').toLowerCase().replace(/\s+/g, '') === _rank;
      return nameOk && rankOk;
    });
    currentMembers.sort((a, b) => {
      if (_sort === 'name') return (a.name||'').localeCompare(b.name||'');
      if (_sort === 'rank') {
        const getLastRank = x => { const snaps = x.snapshots || []; const last = snaps.length ? snaps[snaps.length-1] : {}; return last.rank || ''; };
        const diff = _rn(getLastRank(b)) - _rn(getLastRank(a));
        return diff !== 0 ? diff : (a.name||'').localeCompare(b.name||'');
      }
      const getVal = (x) => {
        const snaps = x.snapshots || [];
        const last = snaps.length ? snaps[snaps.length - 1] : {};
        return last[_sort] || 0;
      };
      return getVal(b) - getVal(a);
    });
    renderHistoryRows();
  }

  document.getElementById('history-search').addEventListener('input', e => { _search = e.target.value.trim().toLowerCase(); applyHistoryAll(); });
  document.getElementById('history-sort').addEventListener('change', e => { _sort = e.target.value; applyHistoryAll(); });
  document.getElementById('history-rank-filter').addEventListener('change', e => { _rank = e.target.value; applyHistoryAll(); });
}

function renderHistoryDetail(container, member, lastUpdated) {
  const snaps = [...(member.snapshots || [])].sort((a, b) => (a.date || '').localeCompare(b.date || ''));
  const last  = snaps.length ? snaps[snaps.length - 1] : null;

  container.innerHTML = `
    <div class="breadcrumb">
      <a href="history.html">📈 ${t('member_history_overview')}</a>
      <span class="sep">›</span>
      <span class="current">${member.name}</span>
    </div>

    <div class="detail-header">
      <h2>📈 ${member.name}</h2>
      <div class="meta-row">
        <div class="meta-item">📅 ${t('first_seen_label')}: <strong>${member.first_seen || '-'}</strong></div>
        <div class="meta-item">🔄 ${t('last_seen_label')}: <strong>${member.last_seen || '-'}</strong></div>
        <div class="meta-item">📊 ${t('snapshots_label')}: <strong>${snaps.length}</strong></div>
        ${member.name_history && member.name_history.length ? `<div class="meta-item">📝 ${t('name_changes_label')}: <strong>${member.name_history.length}</strong></div>` : ''}
      </div>
    </div>

    ${last ? `
    <div class="stats-grid" style="margin-bottom:1.5rem;">
      <div class="stat-card blue">
        <div class="stat-icon">🏰</div>
        <div class="stat-value">${fmtCompact(last.might)}</div>
        <div class="stat-label">${t('current_might')}</div>
        <div class="stat-delta ${last.might_diff > 0 ? 'positive' : last.might_diff < 0 ? 'negative' : 'neutral'}">
          ${fmtDelta(last.might_diff, false)} ${t('this_period_label')}
        </div>
      </div>
      <div class="stat-card yellow">
        <div class="stat-icon">⚔️</div>
        <div class="stat-value">${fmtCompact(last.kills)}</div>
        <div class="stat-label">${t('current_kills')}</div>
        <div class="stat-delta ${last.kills_diff > 0 ? 'positive' : last.kills_diff < 0 ? 'negative' : 'neutral'}">
          ${fmtDelta(last.kills_diff, false)} ${t('this_period_label')}
        </div>
      </div>
      <div class="stat-card purple">
        <div class="stat-icon">🎖️</div>
        <div class="stat-value">${(last.rank || '-').toUpperCase()}</div>
        <div class="stat-label">${t('current_rank_label')}</div>
      </div>
      <div class="stat-card green">
        <div class="stat-icon">📅</div>
        <div class="stat-value">${last.date || '-'}</div>
        <div class="stat-label">${t('latest_snapshot_label')}</div>
      </div>
    </div>` : ''}

    <div class="card">
      <div class="card-header">
        <h2>📊 ${t('snapshot_history_label')}</h2>
        <span class="badge-count">${snaps.length} ${t('snapshots_label')}</span>
      </div>
      <div class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>${t('date')}</th>
              <th>${t('file_label')}</th>
              <th class="center">${t('rank_label')}</th>
              <th class="right">${t('might')}</th>
              <th class="right">${t('might_gained_label')}</th>
              <th class="right">${t('kills')}</th>
              <th class="right">${t('kills_gained_label')}</th>
            </tr>
          </thead>
          <tbody>
            ${[...snaps].reverse().map((s, i) => `
              <tr>
                <td class="mono" data-label="#" style="color:var(--text-muted);">${i + 1}</td>
                <td data-label="${t('date')}" style="font-weight:500;">${s.date || '-'}</td>
                <td class="mono" data-label="${t('file_label')}" style="font-size:0.78rem;color:var(--text-muted);">${(s.filename || '').replace(/\.[^/.]+$/, '')}</td>
                <td class="center" data-label="${t('rank_label')}">${rankBadge(s.rank)}</td>
                <td class="right mono" data-label="${t('might')}">${fmtCompact(s.might)}</td>
                <td class="right" data-label="${t('might_gained_label')}">${fmtDelta(s.might_diff)}</td>
                <td class="right mono" data-label="${t('kills')}" style="color:var(--accent-yellow);">${fmtCompact(s.kills)}</td>
                <td class="right" data-label="${t('kills_gained_label')}">${fmtDelta(s.kills_diff)}</td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>
    </div>

    ${member.name_history && member.name_history.length ? `
    <div class="card">
      <div class="card-header"><h2>📝 ${t('name_history_title')}</h2></div>
      <div class="card-body">
        ${member.name_history.map(n => `<div style="padding:4px 0;font-family:var(--font-mono);font-size:0.88rem;color:var(--text-secondary);">${n}</div>`).join('')}
      </div>
    </div>` : ''}`;
}

// ══════════════════════════════════════════════════════════
