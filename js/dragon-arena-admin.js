/**
 * dragon-arena-admin.js - Dragon Arena Registration Tool
 *
 * Flow:
 *  1. Password lock screen (SHA-256 of "155218")
 *  2. Event wizard: pick date + slot
 *  3. Members list with 3 toggle buttons (Team A / Team B / No Show)
 *  4. Export JSON + Excel
 *
 * NO data is stored anywhere - purely an export tool.
 */

(function () {
  'use strict';

  const _inPages = window.location.pathname.includes('/pages/');
  const DATA_BASE = _inPages ? '../data/' : './data/';

  // SHA-256 of "155218"
  const HASH = '69f749cd125740869fc35c29101e36851a6b48fdf364d9d0344a2270b4ae0111';

  // ── Slot schedule (UTC-5) ───────────────────────────────────────────────────
  const SLOTS = [
    { slot: 1, start: '1:00 am',  end: '2:00 am',  utc: '6:00–7:00 am UTC'   },
    { slot: 2, start: '4:00 am',  end: '5:00 am',  utc: '9:00–10:00 am UTC'  },
    { slot: 3, start: '7:00 am',  end: '8:00 am',  utc: '12:00–1:00 pm UTC'  },
    { slot: 4, start: '10:00 am', end: '11:00 am', utc: '3:00–4:00 pm UTC'   },
    { slot: 5, start: '1:00 pm',  end: '2:00 pm',  utc: '6:00–7:00 pm UTC'   },
    { slot: 6, start: '4:00 pm',  end: '5:00 pm',  utc: '9:00–10:00 pm UTC'  },
    { slot: 7, start: '7:00 pm',  end: '8:00 pm',  utc: '12:00–1:00 am UTC+1'},
    { slot: 8, start: '10:00 pm', end: '11:00 pm', utc: '3:00–4:00 am UTC+1' },
  ];

  // ── State ───────────────────────────────────────────────────────────────────
  let _members  = [];
  let _roster   = {};   // { uid: 'A' | 'B' | 'no_show' }
  let _eventDate = '';
  let _eventSlot = 0;

  // ── Utilities ───────────────────────────────────────────────────────────────
  async function checkAccess(v) {
    if (!v) return false;
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(v));
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('') === HASH;
  }

  function rankOrder(r) {
    if (!r) return 0;
    if (r.includes('5')) return 5;
    if (r.includes('4')) return 4;
    if (r.includes('3')) return 3;
    if (r.includes('2')) return 2;
    return 1;
  }

  function rankBadge(rank) {
    const r = (rank || '').trim();
    let tier = '';
    if (r.includes('5')) tier = 'r5';
    else if (r.includes('4')) tier = 'r4';
    else if (r.includes('3')) tier = 'r3';
    else if (r.includes('2')) tier = 'r2';
    else if (r.includes('1')) tier = 'r1';
    return `<span class="rank-badge rank-${tier || 'r1'}">${tier ? tier.toUpperCase() : (r || '-')}</span>`;
  }

  function getSlot(n) { return SLOTS.find(s => s.slot === n) || null; }

  // ── Phase 1: Lock screen ────────────────────────────────────────────────────
  function renderLock() {
    const c = document.getElementById('da-admin-container');
    if (!c) return;
    c.innerHTML = `
      <div class="perf-lock-zone">
        <div class="perf-lock-icon">🔒</div>
        <h2 class="perf-lock-title" data-i18n="da_restricted_area"></h2>
        <p class="perf-lock-desc" data-i18n="da_lock_desc"></p>
        <form id="da-unlock-form" class="perf-form-group">
          <input type="password" id="da-pass-input" class="perf-input"
            data-i18n="[placeholder]da_enter_pass" placeholder="Clave de acceso…" autofocus required>
          <button type="submit" class="btn perf-btn-unlock" data-i18n="da_unlock"></button>
        </form>
        <div id="da-err" class="perf-error-msg" style="display:none;" data-i18n="da_incorrect_pass">
          ❌ Contraseña incorrecta. Inténtalo de nuevo.
        </div>
      </div>`;

    document.getElementById('da-unlock-form').addEventListener('submit', async e => {
      e.preventDefault();
      const val = document.getElementById('da-pass-input').value.trim();
      if (await checkAccess(val)) {
        await loadMembersAndRenderWizard();
      } else {
        document.getElementById('da-err').style.display = 'block';
        document.getElementById('da-pass-input').value = '';
        document.getElementById('da-pass-input').focus();
      }
    });
  }

  // ── Phase 2: Load members + wizard ─────────────────────────────────────────
  async function loadMembersAndRenderWizard() {
    const c = document.getElementById('da-admin-container');
    c.innerHTML = '<div class="loading-state"><div class="spinner"></div><p data-i18n="da_loading_members">Cargando miembros…</p></div>';

    try {
      const res = await fetch(DATA_BASE + 'members.json?v=' + Date.now());
      _members = await res.json();
      // Sort by rank desc then name
      _members.sort((a, b) => {
        const rd = rankOrder(b.rank) - rankOrder(a.rank);
        return rd !== 0 ? rd : (a.name || '').localeCompare(b.name || '');
      });
    } catch (err) {
      _members = [];
    }

    renderWizard();
  }

  // ── Phase 2: Wizard ─────────────────────────────────────────────────────────
  function renderWizard() {
    const c = document.getElementById('da-admin-container');
    if (!c) return;

    const today = new Date().toISOString().split('T')[0];

    c.innerHTML = `
      <div class="card da-wizard-card">
        <div class="card-header" style="display: block;">
          <h2 data-i18n="da_config_event" style="margin: 0 0 6px 0;">⚙️ Configurar Evento</h2>
          <p style="color:var(--text-muted);font-size:.88rem;margin:0;" data-i18n="da_config_desc">Selecciona la fecha y el slot del Dragon Arena antes de registrar participantes.</p>
        </div>
        <div class="card-body">
          <div class="da-wizard-fields">
            <div class="da-field-group">
              <label class="da-field-label" for="da-date" data-i18n="da_event_date">📅 Fecha del Evento</label>
              <input type="date" id="da-date" class="da-date-input" value="${_eventDate || today}" max="${today}">
            </div>
            <div class="da-field-group">
              <label class="da-field-label" for="da-slot" data-i18n="da_slot">⏰ Slot</label>
              <div class="custom-select" id="da-custom-slot">
                <div class="custom-select-trigger" id="da-slot-trigger">
                  <span id="da-slot-selected-text" data-i18n="da_select_slot">- Selecciona un slot -</span>
                  <span class="custom-select-arrow"></span>
                </div>
                <div class="custom-select-options" id="da-slot-options">
                  <div class="custom-option ${_eventSlot ? '' : 'selected'}" data-value="">
                    <span data-i18n="da_select_slot">- Selecciona un slot -</span>
                  </div>
                  ${SLOTS.map(s => `<div class="custom-option ${_eventSlot === s.slot ? 'selected' : ''}" data-value="${s.slot}">Slot ${s.slot} &middot; ${s.start}&ndash;${s.end} UTC-5</div>`).join('')}
                </div>
              </div>
              <input type="hidden" id="da-slot" value="${_eventSlot || ''}">
            </div>
          </div>

          <div id="da-slot-info" class="da-slot-badge" style="display:none;"></div>

          <button id="da-start-btn" class="btn btn-primary" style="margin-top:1.5rem;padding:.7rem 2rem;font-size:1rem;" data-i18n="da_start_registration" disabled>
            🐉 Comenzar Registro
          </button>
        </div>
      </div>`;

    const dateInput = document.getElementById('da-date');
    const slotInput = document.getElementById('da-slot');
    const slotInfo = document.getElementById('da-slot-info');
    const startBtn = document.getElementById('da-start-btn');

    // Custom select logic
    const customSelect = document.getElementById('da-custom-slot');
    const trigger = document.getElementById('da-slot-trigger');
    const optionsCont = document.getElementById('da-slot-options');
    const selectedText = document.getElementById('da-slot-selected-text');

    trigger.addEventListener('click', (e) => {
      customSelect.classList.toggle('open');
      e.stopPropagation();
    });

    // Remove any previous global click listener to prevent memory leaks
    if (window._daSelectListener) {
      document.removeEventListener('click', window._daSelectListener);
    }
    window._daSelectListener = (e) => {
      const select = document.getElementById('da-custom-slot');
      if (select && !select.contains(e.target)) {
        select.classList.remove('open');
      }
    };
    document.addEventListener('click', window._daSelectListener);

    optionsCont.querySelectorAll('.custom-option').forEach(opt => {
      opt.addEventListener('click', (e) => {
        const val = opt.getAttribute('data-value');
        
        // Update styling
        optionsCont.querySelectorAll('.custom-option').forEach(o => o.classList.remove('selected'));
        opt.classList.add('selected');
        
        // Update trigger text safely (if it has i18n, we re-apply it)
        if (opt.firstElementChild && opt.firstElementChild.hasAttribute('data-i18n')) {
          selectedText.setAttribute('data-i18n', opt.firstElementChild.getAttribute('data-i18n'));
          selectedText.innerHTML = opt.firstElementChild.innerHTML;
        } else {
          selectedText.removeAttribute('data-i18n');
          selectedText.innerHTML = opt.innerHTML;
        }
        
        // Update hidden input and trigger change
        slotInput.value = val;
        customSelect.classList.remove('open');
        updateSlotInfo();
      });
    });

    function updateSlotInfo() {
      const slotNum = parseInt(slotInput.value);
      const s = getSlot(slotNum);
      if (s) {
        slotInfo.style.display = 'flex';
        slotInfo.innerHTML = `
          <span>⏰</span>
          <div>
            <strong>Slot ${s.slot}</strong> &nbsp;·&nbsp;
            <span style="color:var(--accent-green);">${s.start}–${s.end} UTC-5</span>
            &nbsp;&nbsp;<span style="color:var(--text-muted);font-size:.85rem;">(${s.utc})</span>
          </div>`;
      } else {
        slotInfo.style.display = 'none';
      }
      startBtn.disabled = !(dateInput.value && slotInput.value);
    }

    dateInput.addEventListener('change', updateSlotInfo);

    // Initialize trigger text if editing
    if (_eventSlot) {
      const activeOpt = optionsCont.querySelector('.custom-option.selected');
      if (activeOpt) {
        selectedText.removeAttribute('data-i18n');
        selectedText.innerHTML = activeOpt.innerHTML;
        updateSlotInfo();
      }
    }

    // Initial translation run for custom select if needed
    if (window.i18n && typeof window.i18n.applyTranslations === 'function') {
      window.i18n.applyTranslations();
      // Fallback timeout in case browser hasn't flushed DOM
      setTimeout(() => window.i18n.applyTranslations(), 50);
    }

    startBtn.addEventListener('click', () => {
      _eventDate = dateInput.value;
      _eventSlot = parseInt(slotInput.value);
      _roster = {};
      renderRegistration();
    });
  }

  // ── Phase 3: Registration list ──────────────────────────────────────────────
  function renderRegistration() {
    const c = document.getElementById('da-admin-container');
    if (!c) return;

    const slot = getSlot(_eventSlot);
    const fmtDate = d => {
      try {
        const dt = new Date(d + 'T00:00:00');
        return dt.toLocaleDateString('en-US', { weekday:'long', year:'numeric', month:'long', day:'numeric' });
      } catch { return d; }
    };

    c.innerHTML = `
      <!-- Event Header Info -->
      <div class="da-event-header-card">
        <div class="da-event-header-info">
          <div>
            <span class="da-eh-label" data-i18n="da_lbl_date">📅 Fecha</span>
            <strong class="da-eh-value">${fmtDate(_eventDate)}</strong>
          </div>
          <div class="da-eh-sep"></div>
          <div>
            <span class="da-eh-label" data-i18n="da_lbl_slot">⏰ Slot</span>
            <strong class="da-eh-value">Slot ${_eventSlot}</strong>
          </div>
          <div class="da-eh-sep"></div>
          <div>
            <span class="da-eh-label" data-i18n="da_lbl_time_utc5">🕐 Horario UTC-5</span>
            <strong class="da-eh-value">${slot ? slot.start + '–' + slot.end : '-'}</strong>
          </div>
          ${slot ? `
          <div class="da-eh-sep"></div>
          <div>
            <span class="da-eh-label" data-i18n="da_lbl_utc">🌐 UTC</span>
            <strong class="da-eh-value">${slot.utc}</strong>
          </div>` : ''}
        </div>
        <button class="btn" id="da-change-event" style="font-size:.85rem;padding:.4rem 1rem;" data-i18n="da_change_event">✏️ Cambiar evento</button>
      </div>

      <!-- Live counters bar -->
      <div class="da-counter-bar" id="da-counter-bar">
        <div class="da-cnt-pill da-cnt-a">
          <span class="da-cnt-label"><span data-i18n="da_team_a">Team A</span></span>
          <span class="da-cnt-val" id="cnt-a-val">0</span>
        </div>
        <div class="da-cnt-pill da-cnt-ns">
          <span class="da-cnt-label"><span data-i18n="da_ns_a">No Show A</span></span>
          <span class="da-cnt-val" id="cnt-ns-a-val">0</span>
        </div>
        <div class="da-cnt-pill da-cnt-b">
          <span class="da-cnt-label">⚔️ <span data-i18n="da_team_b_conf">Team B (Conf.)</span></span>
          <span class="da-cnt-val" id="cnt-b-val">0</span>
        </div>
        <div class="da-cnt-pill da-cnt-none">
          <span class="da-cnt-label">❔ <span data-i18n="da_team_b_unconf">Team B (Sin Conf.)</span></span>
          <span class="da-cnt-val" id="cnt-unconf-b-val">0</span>
        </div>
      </div>

      <!-- Search + list -->
      <div class="card">
        <div class="card-header">
          <h2 data-i18n="da_guild_members">👥 Miembros del Gremio</h2>
          <div class="toolbar" style="margin:0;">
            <div class="search-box" style="min-width:200px;">
              <span class="search-icon">🔍</span>
              <input type="text" id="da-reg-search" data-i18n="[placeholder]da_search_member" placeholder="Buscar miembro…">
            </div>
          </div>
        </div>
        <div class="card-body" style="padding:0;">
          <div id="da-members-list">
            ${_members.map(m => `
              <div class="da-member-row" id="row-${m.uid}" data-uid="${m.uid}"
                   data-search="${(m.name||'').toLowerCase()} ${(m.rank||'').toLowerCase()} ${(m.telegram||'').toLowerCase()} ${m.uid}">
                <div class="da-member-info">
                  <div class="da-member-avatar">${(m.name || '?').charAt(0).toUpperCase()}</div>
                  <div style="min-width:0;">
                    <div class="da-member-name">${m.name || '-'}</div>
                    <div class="da-member-sub" style="flex-wrap:wrap;">
                      ${rankBadge(m.rank)} 
                      <span class="da-uid-badge"><svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" style="opacity:.7;flex-shrink:0"><path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/></svg>${m.uid}</span>
                      ${m.telegram ? `<span class="tg-badge" style="font-size:.8rem;padding:2px 6px;">💬 ${m.telegram}</span>` : ''}
                    </div>
                  </div>
                </div>
                <div class="da-team-btns" data-uid="${m.uid}">
                  <button class="da-tbtn da-tbtn-a" data-uid="${m.uid}" data-team="A" title="Asistió al Slot A">Slot A</button>
                  <button class="da-tbtn da-tbtn-ns-a" data-uid="${m.uid}" data-team="NS_A" title="No asistió al Slot A">No A</button>
                  <button class="da-tbtn da-tbtn-b" data-uid="${m.uid}" data-team="B" title="Confirmó Slot B">Slot B</button>
                </div>
              </div>`).join('')}
          </div>
        </div>
      </div>

      <!-- Export buttons (sticky bottom) -->
      <div class="da-export-bar" id="da-export-bar">
        <div class="da-export-summary" id="da-export-summary">
          Listo para exportar · ${_members.length} miembros
        </div>
        <div class="da-export-btns">
          <button class="btn da-btn-export-json" id="da-export-json" data-i18n="da_export_json">💾 Exportar JSON</button>
          <button class="btn da-btn-export-excel" id="da-export-excel" data-i18n="da_export_excel">📊 Exportar Excel</button>
        </div>
      </div>
    `;

    // Re-apply translations if i18n is initialized
    if (window.i18n && typeof window.i18n.applyTranslations === 'function') {
      window.i18n.applyTranslations();
    }

    // Wire change event button
    document.getElementById('da-change-event').addEventListener('click', () => {
      _roster = {};
      renderWizard();
    });

    // Wire team buttons
    document.querySelectorAll('.da-tbtn').forEach(btn => {
      btn.addEventListener('click', () => {
        const uid  = btn.dataset.uid;
        const team = btn.dataset.team;
        const prev = _roster[uid];

        if (prev === team) {
          // toggle off
          delete _roster[uid];
        } else {
          _roster[uid] = team;
        }

        updateRowUI(uid);
        updateCounters();
        updateExportSummary();
      });
    });

    // Wire search
    document.getElementById('da-reg-search').addEventListener('input', e => {
      const q = e.target.value.trim().toLowerCase();
      document.querySelectorAll('.da-member-row').forEach(row => {
        const s = (row.dataset.search || '').toLowerCase();
        row.style.display = (!q || s.includes(q)) ? '' : 'none';
      });
    });

    // Wire export buttons
    document.getElementById('da-export-json').addEventListener('click', exportJSON);
    document.getElementById('da-export-excel').addEventListener('click', exportExcel);

    updateCounters();
    updateExportSummary();
  }

  function updateRowUI(uid) {
    const row = document.getElementById(`row-${uid}`);
    if (!row) return;
    const team = _roster[uid] || null;
    row.querySelectorAll('.da-tbtn').forEach(btn => {
      btn.classList.toggle('da-tbtn-active-a',    btn.dataset.team === 'A'    && team === 'A');
      btn.classList.toggle('da-tbtn-active-ns-a', btn.dataset.team === 'NS_A' && team === 'NS_A');
      btn.classList.toggle('da-tbtn-active-b',    btn.dataset.team === 'B'    && team === 'B');
    });
    // Row tint
    row.classList.remove('da-row-a', 'da-row-ns-a', 'da-row-b');
    if (team === 'A')       row.classList.add('da-row-a');
    else if (team === 'NS_A') row.classList.add('da-row-ns-a');
    else if (team === 'B')  row.classList.add('da-row-b');
  }

  function updateCounters() {
    const vals = Object.values(_roster);
    const cntA   = vals.filter(v => v === 'A').length;
    const cntNSA = vals.filter(v => v === 'NS_A').length;
    const cntB   = vals.filter(v => v === 'B').length;
    const unconfB = _members.length - cntA - cntNSA - cntB;

    const elA = document.getElementById('cnt-a-val');
    const elNSA = document.getElementById('cnt-ns-a-val');
    const elB = document.getElementById('cnt-b-val');
    const elUnconfB = document.getElementById('cnt-unconf-b-val');

    if (elA) elA.textContent = cntA;
    if (elNSA) elNSA.textContent = cntNSA;
    if (elB) elB.textContent = cntB;
    if (elUnconfB) elUnconfB.textContent = unconfB;
  }

  function updateExportSummary() {
    const vals = Object.values(_roster);
    const cntA   = vals.filter(v => v === 'A').length;
    const cntNSA = vals.filter(v => v === 'NS_A').length;
    const cntB   = vals.filter(v => v === 'B').length;
    const unconfB = _members.length - cntA - cntNSA - cntB;

    const el = document.getElementById('da-export-summary');
    if (el) {
      const t = (k) => (window.i18n && window.i18n.t) ? window.i18n.t(k) : k;
      const strReady = t('da_ready_export') !== 'da_ready_export' ? t('da_ready_export') : 'Listo para exportar';
      const strMembers = t('da_members') !== 'da_members' ? t('da_members') : 'miembros';
      const strParticipants = t('da_participants') !== 'da_participants' ? t('da_participants') : 'participantes';
      const strNoShow = t('da_no_show') !== 'da_no_show' ? t('da_no_show') : 'No Asistieron';
      
      const total = cntA + cntB;
      
      el.innerHTML = `
        <span class="da-sum-chip da-sum-a"><strong>${cntA}</strong> Team A</span>
        <span class="da-sum-chip da-sum-ns"><strong>${cntNSA}</strong> No Show A</span>
        <span class="da-sum-chip da-sum-b"><strong>${cntB}</strong> Team B</span>
        <span class="da-sum-chip da-sum-unconf"><strong>${unconfB}</strong> Sin Conf.</span>
      `;
    }
  }

  // ── Build export data ────────────────────────────────────────────────────────
  function buildEventPayload() {
    const slot = getSlot(_eventSlot);
    const participants = [];

    // Unmarked default to Team B, unconfirmed
    _members.forEach(m => {
      const team = _roster[m.uid];
      participants.push({
        uid:  m.uid,
        name: m.name,
        rank: m.rank,
        team: team === 'A' || team === 'NS_A' ? 'A' : 'B',
        status: team === 'A' || team === 'B' ? 'confirmed' : (team === 'NS_A' ? 'no_show' : 'unconfirmed')
      });
    });

    return {
      id:          `${_eventDate}-S${_eventSlot}`,
      date:        _eventDate,
      slot:        _eventSlot,
      slot_label:  slot ? `Slot ${_eventSlot} · ${slot.start}–${slot.end} UTC-5` : `Slot ${_eventSlot}`,
      slot_utc:    slot ? slot.utc : '',
      recorded_at: new Date().toISOString(),
      participants,
    };
  }

  // ── Export JSON ──────────────────────────────────────────────────────────────
  function exportJSON() {
    const payload = buildEventPayload();
    const json    = JSON.stringify([payload], null, 2);
    const blob    = new Blob([json], { type: 'application/json' });
    const url     = URL.createObjectURL(blob);
    const a       = document.createElement('a');
    a.href        = url;
    a.download    = `dragon_arena_${_eventDate}_S${_eventSlot}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // ── Export Excel ─────────────────────────────────────────────────────────────
  function exportExcel() {
    if (!window.XLSX) {
      alert('SheetJS no cargó. Verifica tu conexión a internet.');
      return;
    }
    const payload = buildEventPayload();
    const slot    = getSlot(_eventSlot);

    // Build rows for ALL members
    const rows = _members.map(m => {
      const team = _roster[m.uid];
      let status = 'Unconfirmed';
      let teamLabel = 'Team B';
      if (team === 'A')       { status = 'Confirmed'; teamLabel = 'Team A'; }
      else if (team === 'NS_A') { status = 'No Show'; teamLabel = 'Team A'; }
      else if (team === 'B')  { status = 'Confirmed'; teamLabel = 'Team B'; }
      
      return {
        'UID':       m.uid || '',
        'Name':      m.name || '',
        'Rank':      m.rank || '',
        'Telegram':  m.telegram || '',
        'Team':      teamLabel,
        'Status':    status,
      };
    });

    const ws = XLSX.utils.json_to_sheet(rows);

    // Column widths
    ws['!cols'] = [
      { wch: 12 }, { wch: 22 }, { wch: 10 }, { wch: 20 }, { wch: 12 }, { wch: 14 }
    ];

    const wb = XLSX.utils.book_new();

    const vals = _members.map(m => _roster[m.uid]);
    const unconfB = _members.length - vals.filter(v => v === 'A' || v === 'NS_A' || v === 'B').length;

    // Info sheet
    const infoData = [
      ['Event ID',       payload.id],
      ['Date',           _eventDate],
      ['Slot',           `Slot ${_eventSlot}`],
      ['Schedule UTC-5', slot ? `${slot.start}–${slot.end}` : '-'],
      ['Schedule UTC',   slot ? slot.utc : '-'],
      ['Recorded At',    new Date().toLocaleString()],
      ['Total Members',  _members.length],
      ['Team A (Confirmed)',   vals.filter(v => v === 'A').length],
      ['Team A (No Show)',     vals.filter(v => v === 'NS_A').length],
      ['Team B (Confirmed)',   vals.filter(v => v === 'B').length],
      ['Team B (Unconfirmed)', unconfB],
    ];
    const wsInfo = XLSX.utils.aoa_to_sheet(infoData);
    wsInfo['!cols'] = [{ wch: 20 }, { wch: 30 }];

    XLSX.utils.book_append_sheet(wb, wsInfo, 'Event Info');
    XLSX.utils.book_append_sheet(wb, ws, 'Participants');

    XLSX.writeFile(wb, `dragon_arena_${_eventDate}_S${_eventSlot}.xlsx`);
  }

  // ── Init ─────────────────────────────────────────────────────────────────────
  function init() {
    const c = document.getElementById('da-admin-container');
    if (!c) return;
    renderLock();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
