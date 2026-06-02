/**
 * resources.js — Admin Resource Command Generator
 *
 * Loads members.json and renders a searchable list of guild members.
 * Each member shows 6 resource buttons. Clicking any button generates
 * the appropriate admin bot command and copies it to the clipboard.
 *
 * Search supports: player name, UID, @telegram, IGG ID
 * Commands use underscore (_) as space replacement in player names.
 *
 * Commands generated:
 *   General : !adminrss 32M 32M 32M 32M 10M PLAYER_NAME
 *   Food    : !adminfood PLAYER_NAME 32M
 *   Stone   : !adminstone PLAYER_NAME 32M
 *   Wood    : !adminwood PLAYER_NAME 32M
 *   Ore     : !adminore PLAYER_NAME 32M
 *   Gold    : !admingold PLAYER_NAME 32M
 */

(function () {

  /* ── Bootstrap ──────────────────────────────────────────────────── */

  document.addEventListener('DOMContentLoaded', () => {
    if (!window.location.pathname.includes('resources')) return;
    waitForI18nAndInit();
  });

  window.addEventListener('languageChanged', () => {
    if (window.location.pathname.includes('resources')) {
      // Re-render the UI strings without re-fetching data
      if (_allMembers.length > 0) renderResources();
    }
  });

  function waitForI18nAndInit() {
    const check = setInterval(() => {
      if (window.i18n && Object.keys(window.i18n.data).length > 0) {
        clearInterval(check);
        initResources();
      }
    }, 50);
  }

  /* ── State ──────────────────────────────────────────────────────── */

  let _allMembers = [];
  let _search     = '';
  let _toastTimer = null;

  /* ── Resource definitions ───────────────────────────────────────── */

  const RESOURCES = [
    { type: 'general', emoji: '⚡', label: 'General', cls: 'res-btn-general' },
    { type: 'food',    emoji: '🌾', label: 'Food',    cls: 'res-btn-food'    },
    { type: 'stone',   emoji: '🪨', label: 'Stone',   cls: 'res-btn-stone'   },
    { type: 'wood',    emoji: '🪵', label: 'Wood',    cls: 'res-btn-wood'    },
    { type: 'ore',     emoji: '⛏️', label: 'Ore',     cls: 'res-btn-ore'     },
    { type: 'gold',    emoji: '💰', label: 'Gold',    cls: 'res-btn-gold'    },
  ];

  /* ── Helpers ────────────────────────────────────────────────────── */

  /** Convert player name: spaces → underscores */
  function toCmd(name) {
    return (name || '').trim().replace(/\s+/g, '_');
  }

  /** Build the bot command string for a given resource type and player name */
  function buildCommand(type, name) {
    const pn = toCmd(name);
    switch (type) {
      case 'general': return `!adminrss 32M 32M 32M 32M 10M ${pn}`;
      case 'food':    return `!adminfood ${pn} 32M`;
      case 'stone':   return `!adminstone ${pn} 32M`;
      case 'wood':    return `!adminwood ${pn} 32M`;
      case 'ore':     return `!adminore ${pn} 32M`;
      case 'gold':    return `!admingold ${pn} 10M`;
      default:        return '';
    }
  }

  /** Copy text to clipboard (with fallback for older browsers) */
  async function copyToClipboard(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
    } else {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.cssText = 'position:fixed;opacity:0;pointer-events:none;';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
  }

  /** Show a bottom toast with the copied command */
  function showToast(cmd) {
    const toast = document.getElementById('res-toast');
    if (!toast) return;

    toast.innerHTML =
      `<span class="res-toast-icon">✅</span>` +
      `<div class="res-toast-body">` +
      `<span class="res-toast-label">Copied to clipboard!</span>` +
      `<code class="res-toast-cmd">${escHtml(cmd)}</code>` +
      `</div>`;

    toast.classList.add('show');
    clearTimeout(_toastTimer);
    _toastTimer = setTimeout(() => toast.classList.remove('show'), 3200);
  }

  /** Click handler: build command → copy → toast → flash button */
  async function handleResourceClick(btn) {
    const type = btn.dataset.type;
    const name = btn.dataset.name;
    const cmd  = buildCommand(type, name);
    if (!cmd) return;

    try {
      await copyToClipboard(cmd);
      showToast(cmd);
    } catch (err) {
      console.error('Clipboard error:', err);
    }

    btn.classList.add('res-btn-flash');
    setTimeout(() => btn.classList.remove('res-btn-flash'), 700);
  }

  /* ── Main Initializer ───────────────────────────────────────────── */

  async function initResources() {
    const container = document.getElementById('resources-container');
    if (!container) return;

    const _t = window.t || (k => k);

    container.innerHTML = `
      <div class="loading-state">
        <div class="spinner"></div>
        <p>${_t('loading_members')}</p>
      </div>`;

    try {
      const resp = await fetch('./data/members.json?v=' + Date.now());
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      _allMembers = await resp.json();

      renderResources();
    } catch (err) {
      container.innerHTML =
        `<div class="error-state">⚠️ ${window.t ? window.t('error_loading') : 'Error'}: ${escHtml(err.message)}</div>`;
    }
  }

  /* ── Render ─────────────────────────────────────────────────────── */

  function renderResources() {
    const container = document.getElementById('resources-container');
    if (!container) return;

    const _t = window.t || (k => k);

    container.innerHTML = `
      <div class="card">
        <div class="card-header">
          <h2>📦 ${_t('module_resources')}</h2>
          <span class="badge-count" id="res-count">${_allMembers.length} ${_t('players_suffix') || 'players'}</span>
        </div>
        <div class="card-body" style="padding:0.5rem;">

          <div class="toolbar">
            <div class="search-box" style="flex:1; min-width:220px;">
              <span class="search-icon">🔍</span>
              <input
                type="text"
                id="res-search"
                placeholder="${_t('res_search_placeholder')}"
                value="${escAttr(_search)}"
                autocomplete="off"
                spellcheck="false">
            </div>
          </div>

          <div class="res-hint">
            <span>⚡ General</span> = <code>!adminrss 32M 32M 32M 32M 10M PLAYER</code>
            &nbsp;·&nbsp;
            <span>🌾 Food</span> = <code>!adminfood PLAYER 32M</code>
            &nbsp;·&nbsp; etc.
          </div>

          <div id="res-list" class="res-list"></div>
        </div>
      </div>`;

    renderList();

    // Wire search
    const searchEl = document.getElementById('res-search');
    if (searchEl) {
      searchEl.addEventListener('input', e => {
        _search = e.target.value.trim().toLowerCase();
        renderList();
      });
      // Auto-focus the search bar
      setTimeout(() => searchEl.focus(), 100);
    }
  }

  function renderList() {
    const list = document.getElementById('res-list');
    if (!list) return;

    const _t = window.t || (k => k);

    // Filter by name / UID / telegram / IGG ID
    const filtered = _search
      ? _allMembers.filter(m =>
          (m.name     || '').toLowerCase().includes(_search) ||
          (m.uid      || '').toLowerCase().includes(_search) ||
          (m.telegram || '').toLowerCase().includes(_search) ||
          String(m.igg_id || '').includes(_search)
        )
      : _allMembers;

    // Update badge count
    const countEl = document.getElementById('res-count');
    if (countEl) countEl.textContent = `${filtered.length} ${_t('players_suffix') || 'players'}`;

    // Empty state
    if (!filtered.length) {
      list.innerHTML = `
        <div class="empty-state" style="padding:2.5rem 1rem;">
          <div style="font-size:2rem;margin-bottom:0.5rem;">🔍</div>
          <p>${_t('res_no_results')}</p>
        </div>`;
      return;
    }

    // Render rows — no kills, no power, no profile link; just name + resource buttons
    list.innerHTML = filtered.map((m, i) => {
      const tgBadge = m.telegram
        ? `<span class="tg-badge">💬 ${escHtml(m.telegram)}</span>`
        : '';
      const uidBadge = m.uid
        ? `<span class="uid-badge">🔐 ${escHtml(m.uid)}</span>`
        : '';

      const buttons = RESOURCES.map(r => {
        const cmd = buildCommand(r.type, m.name);
        return `<button
          class="res-btn ${r.cls}"
          data-type="${r.type}"
          data-name="${escAttr(m.name || '')}"
          title="${escAttr(cmd)}"
          aria-label="${r.label} — ${escAttr(cmd)}">
          ${r.emoji} ${r.label}
        </button>`;
      }).join('');

      return `
        <div class="res-member-row">
          <div class="res-member-info">
            <span class="res-member-index">${i + 1}</span>
            <div class="res-member-details">
              <div class="res-member-name">${escHtml(m.name || '—')}</div>
              <div class="res-member-meta">${uidBadge}${tgBadge}</div>
            </div>
          </div>
          <div class="res-btn-group">${buttons}</div>
        </div>`;
    }).join('');

    // Event delegation on the list container
    list.querySelectorAll('.res-btn').forEach(btn => {
      btn.addEventListener('click', () => handleResourceClick(btn));
    });
  }

  /* ── Utility ────────────────────────────────────────────────────── */

  function escHtml(str) {
    return (str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function escAttr(str) {
    return (str || '').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

})();
