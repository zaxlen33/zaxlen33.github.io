/**
 * dragon-arena.js - Public Dragon Arena Dashboard
 * Reads data/dragon_arena.json and renders:
 *  1. Summary stats cards
 *  2. Participation bar chart (players per event)
 *  3. Events list
 *  4. Event detail view (breadcrumb + participant table)
 */

(function () {
  'use strict';

  const _inPages = window.location.pathname.includes('/pages/');
  const DATA_BASE = _inPages ? '../data/' : './data/';

  // ── Slot schedule (UTC-5) ──────────────────────────────────────────────────
  const SLOTS = [
    { slot: 1, start: '1:00 am',  end: '2:00 am',  utc: '6:00-7:00 am UTC'  },
    { slot: 2, start: '4:00 am',  end: '5:00 am',  utc: '9:00-10:00 am UTC' },
    { slot: 3, start: '7:00 am',  end: '8:00 am',  utc: '12:00-1:00 pm UTC' },
    { slot: 4, start: '10:00 am', end: '11:00 am', utc: '3:00-4:00 pm UTC'  },
    { slot: 5, start: '1:00 pm',  end: '2:00 pm',  utc: '6:00-7:00 pm UTC'  },
    { slot: 6, start: '4:00 pm',  end: '5:00 pm',  utc: '9:00-10:00 pm UTC' },
    { slot: 7, start: '7:00 pm',  end: '8:00 pm',  utc: '12:00-1:00 am UTC+1'},
    { slot: 8, start: '10:00 pm', end: '11:00 pm', utc: '3:00-4:00 am UTC+1' },
  ];

  function getSlot(n) { return SLOTS.find(s => s.slot === n) || null; }

  function slotLabel(n) {
    return `Slot ${n}`;
  }

  function slotFull(n) {
    return `Slot ${n}`;
  }

  // ── Helpers ────────────────────────────────────────────────────────────────
  function fmtDate(d) {
    try {
      const dt = new Date(d + 'T00:00:00');
      return dt.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch { return d; }
  }

  function teamBadge(team) {
    if (team === 'A')           return '<span class="da-badge da-badge-a"><span data-i18n="da_team_a">Team A</span></span>';
    if (team === 'B')           return '<span class="da-badge da-badge-b"><span data-i18n="da_team_b">Team B</span></span>';
    if (team === 'no_show')     return '<span class="da-badge da-badge-noshow"><span data-i18n="da_no_show">No Show</span></span>';
    if (team === 'unconfirmed') return '<span class="da-badge da-badge-unconfirmed"><span data-i18n="da_team_b_unconf">Team B (Unconf.)</span></span>';
    return '<span class="da-badge da-badge-absent"><span data-i18n="da_absent">Absent</span></span>';
  }

  function rankBadge(rank) {
    const r = (rank || '').trim();
    let tier = '';
    if (r.includes('5')) tier = 'r5';
    else if (r.includes('4')) tier = 'r4';
    else if (r.includes('3')) tier = 'r3';
    else if (r.includes('2')) tier = 'r2';
    else if (r.includes('1')) tier = 'r1';
    const label = tier ? tier.toUpperCase() : (r || 'N/A');
    return `<span class="rank-badge rank-${tier || 'r1'}">${label}</span>`;
  }

  function applyI18n() {
    if (window.i18n && typeof window.i18n.applyTranslations === 'function') {
      window.i18n.applyTranslations();
    }
  }

  // ── Chart helpers ──────────────────────────────────────────────────────────
  const _getColor = (v, fb) => getComputedStyle(document.documentElement).getPropertyValue(v).trim() || fb;

  function buildParticipationChart(canvasId, events) {
    const el = document.getElementById(canvasId);
    if (!el || !events.length) return;
    const ctx = el.getContext('2d');

    const chartEvents = [...events].reverse();
    const labels = chartEvents.map(e => {
      const d = fmtDate(e.date);
      return `${d}\n${slotLabel(e.slot)}`;
    });
    const teamA    = chartEvents.map(e => (e.participants || []).filter(p => p.team === 'A' && p.status === 'confirmed').length);
    const teamB    = chartEvents.map(e => (e.participants || []).filter(p => p.team === 'B' && p.status === 'confirmed').length);
    const noShow   = chartEvents.map(e => (e.participants || []).filter(p => p.status === 'no_show').length);

    new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Team A',
            data: teamA,
            borderColor: 'rgba(63,185,80,1)',
            backgroundColor: 'rgba(63,185,80,0.1)',
            pointBackgroundColor: 'rgba(63,185,80,1)',
            pointBorderColor: 'rgba(10,12,18,0.97)',
            pointHoverBackgroundColor: 'rgba(63,185,80,1)',
            pointHoverBorderColor: '#fff',
            pointRadius: 5,
            pointHoverRadius: 7,
            borderWidth: 2.5,
            tension: 0.35,
            fill: false
          },
          {
            label: 'Team B',
            data: teamB,
            borderColor: 'rgba(88,166,255,1)',
            backgroundColor: 'rgba(88,166,255,0.1)',
            pointBackgroundColor: 'rgba(88,166,255,1)',
            pointBorderColor: 'rgba(10,12,18,0.97)',
            pointHoverBackgroundColor: 'rgba(88,166,255,1)',
            pointHoverBorderColor: '#fff',
            pointRadius: 5,
            pointHoverRadius: 7,
            borderWidth: 2.5,
            tension: 0.35,
            fill: false
          },
          {
            label: 'No Show',
            data: noShow,
            borderColor: 'rgba(248,81,73,1)',
            backgroundColor: 'rgba(248,81,73,0.1)',
            pointBackgroundColor: 'rgba(248,81,73,1)',
            pointBorderColor: 'rgba(10,12,18,0.97)',
            pointHoverBackgroundColor: 'rgba(248,81,73,1)',
            pointHoverBorderColor: '#fff',
            pointRadius: 5,
            pointHoverRadius: 7,
            borderWidth: 2.5,
            tension: 0.35,
            fill: false
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 600, easing: 'easeOutQuart' },
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: {
            position: 'top',
            labels: {
              boxWidth: 10, boxHeight: 10,
              usePointStyle: true, pointStyle: 'rectRounded',
              color: _getColor('--text-secondary', '#8b949e'),
              padding: 16, font: { size: 12 }
            }
          },
          tooltip: {
            backgroundColor: 'rgba(10,12,18,0.97)',
            titleColor: '#e6edf3', bodyColor: '#8b949e',
            borderColor: 'rgba(99,110,123,0.4)', borderWidth: 1,
            padding: 12, cornerRadius: 10,
            callbacks: {
              title: items => {
                const idx = items[0].dataIndex;
                const e = chartEvents[idx];
                if (!e) return '';
                const d = fmtDate(e.date);
                const s = getSlot(e.slot);
                if (s) {
                  return `${d} · Slot ${e.slot} (${s.start}–${s.end} UTC-5)`;
                }
                return `${d} · Slot ${e.slot}`;
              },
              label: c => `  ${c.dataset.label}: ${c.raw} players`
            }
          }
        },
        scales: {
          x: {
            grid: { display: false }, border: { display: false },
            ticks: { color: _getColor('--text-muted', '#6e7681'), font: { size: 10 }, maxRotation: 30 }
          },
          y: {
            beginAtZero: true,
            grid: { color: _getColor('--border', '#30363d') },
            border: { display: false },
            ticks: {
              color: _getColor('--text-muted', '#6e7681'), font: { size: 11 },
              stepSize: 1, callback: v => Number.isInteger(v) ? v : ''
            }
          }
        }
      }
    });
  }

  // ── State ──────────────────────────────────────────────────────────────────
  let _allEvents = [];
  let _allMembers = [];
  let _currentView = 'list'; // 'list' | 'detail'
  let _currentDetailEvent = null;

  // ── Render: Events List ────────────────────────────────────────────────────
  function renderList() {
    _currentView = 'list';
    _currentDetailEvent = null;

    const container = document.getElementById('da-container');
    if (!container) return;

    const events = _allEvents;
    const totalParticipations = events.reduce((s, e) =>
      s + (e.participants || []).filter(p => p.status === 'confirmed').length, 0);
    const avgPlayers = events.length
      ? Math.round(totalParticipations / events.length) : 0;

    container.innerHTML = `
      <div class="page-header">
        <h1 data-i18n="dragon_arena">🐉 Dragon Arena</h1>
        <p data-i18n="da_public_desc">Participation history and team rosters for all Dragon Arena events.</p>
      </div>

      <!-- Stats -->
      <div class="stats-grid" style="margin-bottom:1.5rem;">
        <div class="stat-card blue">
          <span class="stat-icon">🐉</span>
          <span class="stat-value">${events.length}</span>
          <span class="stat-label" data-i18n="da_stat_events">Events Recorded</span>
        </div>
        <div class="stat-card green">
          <span class="stat-icon">🛡️</span>
          <span class="stat-value">${events.reduce((s,e)=>s+(e.participants||[]).filter(p=>p.team==='A' && p.status==='confirmed').length,0)}</span>
          <span class="stat-label" data-i18n="da_stat_team_a">Total Team A Slots</span>
        </div>
        <div class="stat-card purple">
          <span class="stat-icon">⚔️</span>
          <span class="stat-value">${events.reduce((s,e)=>s+(e.participants||[]).filter(p=>p.team==='B' && p.status==='confirmed').length,0)}</span>
          <span class="stat-label" data-i18n="da_stat_team_b">Total Team B Slots</span>
        </div>
        <div class="stat-card yellow">
          <span class="stat-icon">👥</span>
          <span class="stat-value">${avgPlayers}</span>
          <span class="stat-label" data-i18n="da_stat_avg">Avg Players / Event</span>
        </div>
        <div class="stat-card red">
          <span class="stat-icon">❌</span>
          <span class="stat-value">${events.reduce((s,e)=>s+(e.participants||[]).filter(p=>p.status==='no_show').length,0)}</span>
          <span class="stat-label" data-i18n="da_stat_noshow">Total No-Shows</span>
        </div>
      </div>

      ${events.length === 0 ? `
        <div class="card">
          <div class="card-body" style="text-align:center;padding:3rem;">
            <div style="font-size:3rem;margin-bottom:1rem;">🐉</div>
            <h3 style="color:var(--text-secondary);" data-i18n="da_no_events_title">No events recorded yet</h3>
            <p style="color:var(--text-muted);" data-i18n="da_no_events_desc">Dragon Arena records will appear here once the admin exports and uploads data.</p>
          </div>
        </div>
      ` : `
      <!-- Participation Chart -->
      <div class="card" style="margin-bottom:1.5rem;">
        <div class="card-header">
          <h2 data-i18n="da_chart_title">📊 Participation per Event</h2>
          <span class="badge-count">${events.length} <span data-i18n="nav_events">events</span></span>
        </div>
        <div class="card-body">
          <div style="position:relative;height:280px;">
            <canvas id="chart-da-participation"></canvas>
          </div>
        </div>
      </div>

      <!-- Events List -->
      <div class="card">
        <div class="card-header">
          <h2 data-i18n="da_all_events">📋 All Events</h2>
          <div class="toolbar" style="margin:0;">
            <div class="search-box" style="min-width:180px;">
              <span class="search-icon">🔍</span>
              <input type="text" id="da-search" data-i18n="[placeholder]da_filter_placeholder" placeholder="Filter by date or slot…">
            </div>
          </div>
        </div>
        <div class="card-body" style="padding:0;">
          <div id="da-events-list">
            ${events.map(e => {
              const parts = e.participants || [];
              const teamA = parts.filter(p => p.team === 'A' && p.status === 'confirmed').length;
              const teamB = parts.filter(p => p.team === 'B' && p.status === 'confirmed').length;
              const noShow = parts.filter(p => p.status === 'no_show').length;
              return `
              <div class="da-event-row" data-id="${e.id}" onclick="window.__daOpenEvent('${e.id}')"
                   data-search="${(e.date||'').toLowerCase()} slot${e.slot} slot ${e.slot}">
                <div class="da-event-main">
                  <div class="da-event-date">📅 ${fmtDate(e.date)}</div>
                  <div class="da-event-slot">${slotLabel(e.slot)}</div>
                </div>
                <div class="da-event-stats">
                  <span class="da-mini-badge da-mini-a">🛡️ ${teamA}</span>
                  <span class="da-mini-badge da-mini-b">⚔️ ${teamB}</span>
                  ${noShow ? `<span class="da-mini-badge da-mini-ns">❌ ${noShow}</span>` : ''}
                  <span class="da-mini-badge da-mini-total">👥 ${teamA + teamB}</span>
                </div>
                <div class="da-event-arrow">›</div>
              </div>`;
            }).join('')}
          </div>
        </div>
      </div>
      `}
    `;

    applyI18n();

    if (events.length > 0) {
      buildParticipationChart('chart-da-participation', events);

      // Search filter
      const search = document.getElementById('da-search');
      if (search) {
        search.addEventListener('input', e => {
          const q = e.target.value.trim().toLowerCase();
          document.querySelectorAll('.da-event-row').forEach(row => {
            const searchable = (row.dataset.search || '').toLowerCase();
            row.style.display = (!q || searchable.includes(q)) ? '' : 'none';
          });
        });
      }
    }

    // open event handler
    window.__daOpenEvent = id => {
      const ev = _allEvents.find(e => e.id === id);
      if (ev) renderDetail(ev);
    };
  }

  // ── Render: Event Detail ───────────────────────────────────────────────────
  function renderDetail(ev) {
    _currentView = 'detail';
    _currentDetailEvent = ev;

    const container = document.getElementById('da-container');
    if (!container) return;

    const parts = ev.participants || [];
    const teamA   = parts.filter(p => p.team === 'A' && p.status === 'confirmed');
    const teamB   = parts.filter(p => p.team === 'B' && p.status === 'confirmed');
    const noShow  = parts.filter(p => p.status === 'no_show');
    const unconf  = parts.filter(p => p.status === 'unconfirmed');
    // Members not in participants (absent)
    const knownUids = new Set(parts.map(p => p.uid));
    const absent = _allMembers.filter(m => !knownUids.has(m.uid));

    const rows = [
      ...teamA.map(p => ({ ...p, _status: 'A' })),
      ...teamB.map(p => ({ ...p, _status: 'B' })),
      ...noShow.map(p => ({ ...p, team: 'no_show', _status: 'no_show' })),
      ...unconf.map(p => ({ ...p, team: 'unconfirmed', _status: 'unconfirmed' })),
      ...absent.map(m => ({ uid: m.uid, name: m.name, rank: m.rank, team: 'absent', _status: 'absent' })),
    ];

    container.innerHTML = `
      <div class="breadcrumb" style="margin-bottom:1.5rem;">
        <a href="#" id="da-back">← <span data-i18n="da_back_events">All Events</span></a>
        <span class="sep">›</span>
        <span class="current">${fmtDate(ev.date)} · ${slotLabel(ev.slot)}</span>
      </div>

      <!-- Summary -->
      <div class="stats-grid" style="margin-bottom:1.5rem;">
        <div class="stat-card blue">
          <span class="stat-icon">📅</span>
          <span class="stat-value">${fmtDate(ev.date)}</span>
          <span class="stat-label" data-i18n="da_lbl_date">Date</span>
        </div>
        <div class="stat-card purple">
          <span class="stat-icon">⏰</span>
          <span class="stat-value">Slot ${ev.slot}</span>
          <span class="stat-label" data-i18n="da_slot">Slot</span>
        </div>
        <div class="stat-card green">
          <span class="stat-icon">🛡️</span>
          <span class="stat-value">${teamA.length}</span>
          <span class="stat-label" data-i18n="da_stat_team_a">Team A Players</span>
        </div>
        <div class="stat-card blue">
          <span class="stat-icon">⚔️</span>
          <span class="stat-value">${teamB.length}</span>
          <span class="stat-label" data-i18n="da_stat_team_b">Team B Players</span>
        </div>
        <div class="stat-card red">
          <span class="stat-icon">❌</span>
          <span class="stat-value">${noShow.length}</span>
          <span class="stat-label" data-i18n="da_stat_noshow">No Shows</span>
        </div>
        <div class="stat-card yellow">
          <span class="stat-icon">👥</span>
          <span class="stat-value">${teamA.length + teamB.length}</span>
          <span class="stat-label" data-i18n="da_stat_avg">Total Participants</span>
        </div>
      </div>

      <!-- Participant Table -->
      <div class="card">
        <div class="card-header">
          <h2 data-i18n="da_event_roster">🐉 Event Roster</h2>
          <div class="toolbar" style="margin:0;">
            <div class="search-box" style="min-width:180px;">
              <span class="search-icon">🔍</span>
              <input type="text" id="da-detail-search" data-i18n="[placeholder]da_search_player" placeholder="Search player…">
            </div>
          </div>
        </div>
        <div class="table-wrapper">
          <table id="da-detail-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Player</th>
                <th class="center">Rank</th>
                <th class="center">Team / Status</th>
              </tr>
            </thead>
            <tbody id="da-detail-tbody">
              ${rows.map((r, i) => `
                <tr data-name="${(r.name||'').toLowerCase()}">
                  <td class="mono" style="color:var(--text-muted);">${i + 1}</td>
                  <td class="card-main"><strong>${r.name || ''}</strong></td>
                  <td class="center">${r.rank ? rankBadge(r.rank) : 'N/A'}</td>
                  <td class="center">${teamBadge(r.team)}</td>
                </tr>`).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;

    applyI18n();

    document.getElementById('da-back').addEventListener('click', e => {
      e.preventDefault();
      renderList();
    });

    const detailSearch = document.getElementById('da-detail-search');
    if (detailSearch) {
      detailSearch.addEventListener('input', e => {
        const q = e.target.value.trim().toLowerCase();
        document.querySelectorAll('#da-detail-tbody tr').forEach(row => {
          const name = row.dataset.name || '';
          row.style.display = (!q || name.includes(q)) ? '' : 'none';
        });
      });
    }
  }

  // ── Init ───────────────────────────────────────────────────────────────────
  async function init() {
    const container = document.getElementById('da-container');
    if (!container) return;

    try {
      const [evRes, membRes] = await Promise.allSettled([
        fetch(DATA_BASE + 'dragon_arena.json?v=' + Date.now()).then(r => r.json()),
        fetch(DATA_BASE + 'members.json?v=' + Date.now()).then(r => r.json()),
      ]);

      _allEvents  = (evRes.status  === 'fulfilled' ? evRes.value  : []) || [];
      _allMembers = (membRes.status === 'fulfilled' ? membRes.value : []) || [];

      // Sort events by date desc
      _allEvents.sort((a, b) => (b.date || '').localeCompare(a.date || ''));

    } catch (err) {
      _allEvents  = [];
      _allMembers = [];
    }

    renderList();
  }

  // Listen for language changes to refresh view
  window.addEventListener('languageChanged', () => {
    if (_currentView === 'detail' && _currentDetailEvent) {
      renderDetail(_currentDetailEvent);
    } else {
      renderList();
    }
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
