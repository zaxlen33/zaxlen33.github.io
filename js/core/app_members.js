/**
 * UE Guild Dashboard — Members page (members.html): initMembers + renderRows/search/sort toolbar
 * Auto-split from the original 1492-line core/app.js — globals preserved (init*, render*).
 * Requires: app_common.js (for loadJSON, fmt*, setLoading, rankBadge, DATA_BASE, _getThemeColor,
 *                               updateChartDefaults, getHashParam, filterTable, setActiveNav).
 */

async function initMembers() {
  const container = document.getElementById('members-container');
  if (!container) return;

  setLoading(container, t('loading_members'));

  let data;
  try {
    data = await loadJSON('members.json');
  } catch (err) {
    setError(container, t('error_loading') + ': ' + err.message);
    return;
  }

  if (!data.length) {
    setEmpty(container, t('no_members_match'), t('no_tracker_data')); // Use generic no data msg if file empty
    return;
  }

  container.classList.add('members-container');
  container.innerHTML = `
    <div class="card">
      <div class="card-header">
        <h2>👥 ${t('active_members')}</h2>
        <span class="badge-count">${data.length} ${t('players')}</span>
      </div>
      <div class="card-body" style="padding:0.5rem;">
        <div class="toolbar">
          <div class="search-box">
            <span class="search-icon">🔍</span>
            <input type="text" id="members-search" placeholder="${t('search_members_placeholder')}" autocomplete="off">
          </div>
          <select class="select-box" id="members-sort">
            <option value="rank" selected>${t('sort_rank')}</option>
            <option value="kills">${t('sort_kills')}</option>
            <option value="might">${t('sort_might')}</option>
            <option value="name">${t('sort_name')}</option>
          </select>
        </div>
        <div class="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>${t('player')}</th>
                <th class="center">${t('rank_label')}</th>
                <th class="center">${t('telegram')}</th>
                <th class="right">${t('might')}</th>
                <th class="right">${t('kills')}</th>
                <th class="center">${t('table_action')}</th>
              </tr>
            </thead>
            <tbody id="members-tbody"></tbody>
          </table>
        </div>
      </div>
    </div>`;

  const tbody = document.getElementById('members-tbody');
  let currentMembers = [...data];

  function _tgBadge(tg) {
    if (!tg) return '<span style="color:var(--text-muted);font-size:0.9rem;">-</span>';
    return `<span class="tg-badge">💬 ${tg}</span>`;
  }

  function renderRows() {
    if (!currentMembers.length) {
      tbody.innerHTML = `<tr><td colspan="7"><div class="empty-state" style="padding:1.5rem;"><p>${t('no_members_match')}</p></div></td></tr>`;
      return;
    }
    tbody.innerHTML = currentMembers.map((m, i) => `
      <tr data-searchable="${(m.name || '').toLowerCase()} ${(m.rank || '').toLowerCase()} ${(m.telegram || '').toLowerCase()}">
        <td class="mono" data-label="#" style="color:var(--text-muted);">${i + 1}</td>
        <td class="card-main" data-label="${t('table_player')}"><strong>${m.name || '-'}</strong></td>
        <td class="center" data-label="${t('rank_label')}">${rankBadge(m.rank)}</td>
        <td class="center td-telegram" data-label="${t('telegram')}">${_tgBadge(m.telegram)}</td>
        <td class="right mono" data-label="${t('might')}">${fmtCompact(m.might)}</td>
        <td class="right mono" data-label="${t('kills')}" style="color:var(--accent-yellow);">${fmtCompact(m.kills)}</td>
        <td class="center" data-label="${t('table_action')}">
          <a href="player.html?view=member&uid=${encodeURIComponent(m.uid||'')}${!m.uid?'&id='+encodeURIComponent(m.name||''):''}" class="btn btn-primary action-btn">${t('view_profile')}</a>
        </td>
      </tr>`).join('');
  }

  let _search = '', _sortKey = 'rank';

  applyFilters();

  function applyFilters() {
    const _rn = x => { if (!x) return 0; if (x.includes('5')) return 5; if (x.includes('4')) return 4; if (x.includes('3')) return 3; if (x.includes('2')) return 2; if (x.includes('1')) return 1; return 0; };
    currentMembers = data.filter(m => !_search
      || (m.name     || '').toLowerCase().includes(_search)
      || (m.uid      || '').toLowerCase().includes(_search)
      || (m.telegram || '').toLowerCase().includes(_search)
      || String(m.igg_id || '').includes(_search));
    currentMembers.sort((a, b) => {
      if (_sortKey === 'name') return (a.name||'').localeCompare(b.name||'');
      if (_sortKey === 'rank') {
        const diff = _rn(b.rank) - _rn(a.rank);
        return diff !== 0 ? diff : (a.name||'').localeCompare(b.name||'');
      }
      return (b[_sortKey]||0) - (a[_sortKey]||0);
    });
    renderRows();
  }

  document.getElementById('members-search').addEventListener('input', e => { _search = e.target.value.trim().toLowerCase(); applyFilters(); });
  document.getElementById('members-sort').addEventListener('change', e => { _sortKey = e.target.value; applyFilters(); });
}
