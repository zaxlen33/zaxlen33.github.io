/**
 * troops.js — Troops Calculator for UE Guild Dashboard
 *
 * Renders troop cards into tier panels, wires all interactions,
 * performs live calculations and updates both the desktop sidebar
 * and the mobile bottom sheet.
 *
 * HTML contract (troops-calculator.html):
 *   #tc-panel-{1-4}     — grid containers for each tier
 *   #tc-speed            — training speed input
 *   #tc-reset-all        — reset all button
 *   .tc-tab[data-tier]   — tier tab buttons
 *   #badge-{1-4}         — badge spans on tabs
 *   #tc-active-count     — "X troops selected" label
 *
 *   Desktop sidebar:
 *   #tc-placeholder / #tc-results  — toggle visibility
 *   #tc-gems-val / #tc-might-val / #tc-time-val
 *   #tc-speedup-list / #tc-res-list
 *
 *   Mobile bar: #tc-mobile-bar .visible
 *   #tc-m-gems / #tc-m-might / #tc-m-time
 *   #tc-mobile-see — opens sheet
 *
 *   Mobile sheet: #tc-sheet / #tc-backdrop / #tc-sheet-close
 *   #tc-s-gems / #tc-s-might / #tc-s-time
 *   #tc-s-speedup-list / #tc-s-res-list
 */

(function () {
  'use strict';

  const _inPages = window.location.pathname.includes('/pages/');
  const IMG_BASE = _inPages ? '../' : './';

  /* ═══════════════════════════════════════════════════════════
     GAME DATA
  ═══════════════════════════════════════════════════════════ */

  // data-res = [food, stone, wood, ore, gold]
  const TROOPS = [
    // ── Tier 1
    { id: 'tier_1_grunt',           tier: 1, might: 2,  res: [50,  0,   50,  50,  0],   img: 'images/troops/T1/inf_grunt.jpg',               type: 'Infantry' },
    { id: 'tier_1_archer',          tier: 1, might: 2,  res: [50,  50,  50,  0,   0],   img: 'images/troops/T1/rng_archer.jpg',              type: 'Ranged'   },
    { id: 'tier_1_cataphract',      tier: 1, might: 2,  res: [50,  50,  0,   50,  0],   img: 'images/troops/T1/cav_cataphract.jpg',          type: 'Cavalry'  },
    { id: 'tier_1_ballista',        tier: 1, might: 2,  res: [50,  50,  50,  50,  0],   img: 'images/troops/T1/siege_ballista.jpg',          type: 'Siege'    },
    // ── Tier 2
    { id: 'tier_2_gladiator',       tier: 2, might: 8,  res: [100, 0,   100, 100, 5],   img: 'images/troops/T2/inf_gladiator.jpg',           type: 'Infantry' },
    { id: 'tier_2_sharpshooter',    tier: 2, might: 8,  res: [100, 100, 100, 0,   5],   img: 'images/troops/T2/rng_sharpshooter.jpg',        type: 'Ranged'   },
    { id: 'tier_2_reptilian_rider', tier: 2, might: 8,  res: [100, 100, 0,   100, 5],   img: 'images/troops/T2/cav_reptilian_rider.jpg',     type: 'Cavalry'  },
    { id: 'tier_2_catapult',        tier: 2, might: 8,  res: [100, 100, 100, 100, 5],   img: 'images/troops/T2/siege_catapult.jpg',          type: 'Siege'    },
    // ── Tier 3
    { id: 'tier_3_royal_guard',     tier: 3, might: 24, res: [150, 0,   150, 150, 10],  img: 'images/troops/T3/inf_royal_guard.jpg',         type: 'Infantry' },
    { id: 'tier_3_stealth_sniper',  tier: 3, might: 24, res: [150, 150, 150, 0,   10],  img: 'images/troops/T3/rng_stealth_sniper.jpg',      type: 'Ranged'   },
    { id: 'tier_3_royal_cavalry',   tier: 3, might: 24, res: [150, 150, 0,   150, 10],  img: 'images/troops/T3/cav_royal_cavalry.jpg',       type: 'Cavalry'  },
    { id: 'tier_3_fire_trebuchet',  tier: 3, might: 24, res: [150, 150, 150, 150, 10],  img: 'images/troops/T3/siege_fire_trebuchet.jpg',    type: 'Siege'    },
    // ── Tier 4
    { id: 'tier_4_heroic_fighter',       tier: 4, might: 36, res: [1000, 0,    1000, 1000, 500], img: 'images/troops/T4/inf_heroic_fighter.jpg',       type: 'Infantry' },
    { id: 'tier_4_heroic_cannoneer',     tier: 4, might: 36, res: [1000, 1000, 1000, 0,    500], img: 'images/troops/T4/rng_heroic_cannoneer.jpg',     type: 'Ranged'   },
    { id: 'tier_4_ancient_drake_rider',  tier: 4, might: 36, res: [1000, 1000, 0,    1000, 500], img: 'images/troops/T4/cav_ancient_drake_rider.jpg',  type: 'Cavalry'  },
    { id: 'tier_4_destroyer',            tier: 4, might: 36, res: [1000, 1000, 1000, 1000, 500], img: 'images/troops/T4/siege_destroyer.jpg',           type: 'Siege'    },
  ];

  // Troop display names (English fallback — i18n overrides via troop.nameKey if added later)
  const TROOP_NAMES = {
    tier_1_grunt:           'Grunt',
    tier_1_archer:          'Archer',
    tier_1_cataphract:      'Cataphract',
    tier_1_ballista:        'Ballista',
    tier_2_gladiator:       'Gladiator',
    tier_2_sharpshooter:    'Sharpshooter',
    tier_2_reptilian_rider: 'Reptilian Rider',
    tier_2_catapult:        'Catapult',
    tier_3_royal_guard:     'Royal Guard',
    tier_3_stealth_sniper:  'Stealth Sniper',
    tier_3_royal_cavalry:   'Royal Cavalry',
    tier_3_fire_trebuchet:  'Fire Trebuchet',
    tier_4_heroic_fighter:        'Heroic Fighter',
    tier_4_heroic_cannoneer:      'Heroic Cannoneer',
    tier_4_ancient_drake_rider:   'Ancient Drake Rider',
    tier_4_destroyer:             'Destroyer',
  };

  // Base training time per tier (seconds per unit) — Lords Mobile values
  const BASE_TIME = { 1: 10, 2: 20, 3: 45, 4: 120 };

  // Speedups: key → { seconds, cost (gems), img }
  const SPEEDUPS = {
    '3d':  { seconds: 259200, cost: 4400, img: 'images/speeds/3days.png'    },
    '24h': { seconds: 86400,  cost: 1500, img: 'images/speeds/24hours.png'  },
    '15h': { seconds: 54000,  cost: 1000, img: 'images/speeds/15hours.png'  },
    '8h':  { seconds: 28800,  cost: 650,  img: 'images/speeds/8hours.png'   },
    '3h':  { seconds: 10800,  cost: 300,  img: 'images/speeds/3hours.png'   },
    '60m': { seconds: 3600,   cost: 130,  img: 'images/speeds/60minutes.png'}
  };

  // Resources (order matches data-res array)
  const RESOURCES = [
    { key: 'calc_res_food',  name: 'Food',  img: 'images/resources/food.png'  },
    { key: 'calc_res_stone', name: 'Stone', img: 'images/resources/stone.png' },
    { key: 'calc_res_wood',  name: 'Wood',  img: 'images/resources/wood.png'  },
    { key: 'calc_res_ore',   name: 'Ore',   img: 'images/resources/ore.png'   },
    { key: 'calc_res_gold',  name: 'Gold',  img: 'images/resources/gold.png'  },
  ];

  /* ═══════════════════════════════════════════════════════════
     STATE
  ═══════════════════════════════════════════════════════════ */

  const _qty = {}; // id → number

  /* ═══════════════════════════════════════════════════════════
     BOOTSTRAP
  ═══════════════════════════════════════════════════════════ */

  document.addEventListener('DOMContentLoaded', () => {
    const path = window.location.pathname + window.location.href;
    if (!path.includes('troops-calculator')) return;
    waitForI18n();
  });

  window.addEventListener('languageChanged', () => {
    const path = window.location.pathname + window.location.href;
    if (!path.includes('troops-calculator')) return;
    applyI18nLabels();
    recalc();
  });

  function waitForI18n() {
    const iv = setInterval(() => {
      if (window.i18n && Object.keys(window.i18n.data).length > 0) {
        clearInterval(iv);
        init();
      }
    }, 50);
  }

  /* ═══════════════════════════════════════════════════════════
     INIT
  ═══════════════════════════════════════════════════════════ */

  function init() {
    renderPanels();
    wireTabs();
    wireControls();
    wireMobileSheet();
    recalc();
  }

  /* ═══════════════════════════════════════════════════════════
     RENDER — troop card panels
  ═══════════════════════════════════════════════════════════ */

  function renderPanels() {
    [1, 2, 3, 4].forEach(tier => {
      const panel = document.getElementById(`tc-panel-${tier}`);
      if (!panel) return;
      const troops = TROOPS.filter(t => t.tier === tier);
      panel.innerHTML = troops.map(troop => buildCard(troop)).join('');
    });
  }

  function buildCard(troop) {
    const name = TROOP_NAMES[troop.id] || troop.id;
    return `
      <div class="tc-card" id="card-${troop.id}">
        <div class="tc-card-img-wrap">
          <img class="tc-card-img"
               src="${IMG_BASE}${troop.img}"
               alt="${esc(name)}"
               loading="lazy"
               onerror="this.parentElement.style.background='#1c2233';this.style.display='none'">
          <span class="tc-type-pill">${esc(troop.type)}</span>
        </div>
        <div class="tc-card-body">
          <div class="tc-card-name">${esc(name)}</div>
          <div class="tc-stepper">
            <button class="tc-step-btn minus" data-action="step" data-id="${troop.id}" data-delta="-1000" title="-1K">−</button>
            <input  class="tc-qty-input" type="number" min="0" placeholder="0"
                    id="inp-${troop.id}" data-id="${troop.id}" autocomplete="off">
            <button class="tc-step-btn plus"  data-action="step" data-id="${troop.id}" data-delta="1000"  title="+1K">+</button>
          </div>
          <div class="tc-quick-row">
            <button class="tc-q-btn" data-action="add" data-id="${troop.id}" data-amount="100000">+100K</button>
            <button class="tc-q-btn" data-action="add" data-id="${troop.id}" data-amount="500000">+500K</button>
            <button class="tc-q-btn" data-action="add" data-id="${troop.id}" data-amount="1000000">+1M</button>
            <button class="tc-q-btn del" data-action="reset" data-id="${troop.id}" title="Reset">✕</button>
          </div>
        </div>
      </div>`;
  }

  /* ═══════════════════════════════════════════════════════════
     TABS
  ═══════════════════════════════════════════════════════════ */

  function wireTabs() {
    document.querySelectorAll('.tc-tab').forEach(btn => {
      btn.addEventListener('click', () => {
        const tier = btn.dataset.tier;
        document.querySelectorAll('.tc-tab').forEach(b => {
          b.classList.remove('active');
          b.setAttribute('aria-selected', 'false');
        });
        btn.classList.add('active');
        btn.setAttribute('aria-selected', 'true');
        document.querySelectorAll('.tc-panel').forEach(p => p.classList.remove('active'));
        document.getElementById(`tc-panel-${tier}`)?.classList.add('active');
      });
    });
  }

  /* ═══════════════════════════════════════════════════════════
     CONTROLS — event delegation
  ═══════════════════════════════════════════════════════════ */

  function wireControls() {
    // Training speed
    document.getElementById('tc-speed')
      ?.addEventListener('input', recalc);

    // Reset all
    document.getElementById('tc-reset-all')
      ?.addEventListener('click', resetAll);

    // Event delegation — all four panels
    document.querySelectorAll('.tc-panel').forEach(panel => {
      panel.addEventListener('click',  handlePanelClick);
      panel.addEventListener('input',  handlePanelInput);
    });
  }

  function handlePanelClick(e) {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    // Ignore clicks on the input itself (let input event handle it)
    if (btn.tagName === 'INPUT') return;
    const id     = btn.dataset.id;
    const action = btn.dataset.action;

    if (action === 'add') {
      setQty(id, (_qty[id] || 0) + parseInt(btn.dataset.amount, 10));
    } else if (action === 'step') {
      const delta = parseInt(btn.dataset.delta, 10);
      setQty(id, Math.max(0, (_qty[id] || 0) + delta));
    } else if (action === 'reset') {
      setQty(id, 0);
    }
  }

  function handlePanelInput(e) {
    const inp = e.target.closest('.tc-qty-input');
    if (!inp) return;
    syncFromInput(inp);
  }

  function syncFromInput(inp) {
    const id  = inp.dataset.id;
    const val = Math.max(0, parseInt(inp.value, 10) || 0);
    _qty[id]  = val;
    updateCardBadge(id);
    recalc();
  }

  function setQty(id, val) {
    val = Math.max(0, val);
    _qty[id] = val;
    const inp = document.getElementById(`inp-${id}`);
    if (inp) inp.value = val > 0 ? val : '';
    updateCardBadge(id);
    recalc();
  }

  function updateCardBadge(id) {
    const val  = _qty[id] || 0;
    const card = document.getElementById(`card-${id}`);
    if (card) card.classList.toggle('has-qty', val > 0);
  }

  function resetAll() {
    TROOPS.forEach(t => {
      _qty[t.id] = 0;
      const inp = document.getElementById(`inp-${t.id}`);
      if (inp) inp.value = '';
      updateCardBadge(t.id);
    });
    recalc();
  }

  /* ═══════════════════════════════════════════════════════════
     MOBILE SHEET
  ═══════════════════════════════════════════════════════════ */

  function wireMobileSheet() {
    const openBtn  = document.getElementById('tc-mob-open');
    const sheet    = document.getElementById('tc-sheet');
    const backdrop = document.getElementById('tc-backdrop');
    const closeBtn = document.getElementById('tc-sheet-close');
    const closeBtnBottom = document.getElementById('tc-sheet-close-bottom');

    function open() {
      sheet?.classList.add('open');
      backdrop?.classList.add('open');
      document.body.style.overflow = 'hidden';
      // Push history state to intercept physical back button on mobile
      window.history.pushState({ tcSheetOpen: true }, '');
    }

    function close(fromPopState = false) {
      if (sheet?.classList.contains('open')) {
        sheet.classList.remove('open');
        backdrop?.classList.remove('open');
        document.body.style.overflow = '';
        if (!fromPopState) {
          if (window.history.state && window.history.state.tcSheetOpen) {
            window.history.back();
          }
        }
      }
    }

    openBtn?.addEventListener('click', open);
    closeBtn?.addEventListener('click', () => close(false));
    closeBtnBottom?.addEventListener('click', () => close(false));
    backdrop?.addEventListener('click', () => close(false));

    window.addEventListener('popstate', (e) => {
      close(true);
    });
  }

  /* ═══════════════════════════════════════════════════════════
     CALCULATION
  ═══════════════════════════════════════════════════════════ */

  function recalc() {
    const speed = parseFloat(document.getElementById('tc-speed')?.value) || 0;

    let totalMight = 0;
    const totalRes = [0, 0, 0, 0, 0];
    const byTier   = { 1: 0, 2: 0, 3: 0, 4: 0 };

    TROOPS.forEach(t => {
      const qty = _qty[t.id] || 0;
      if (qty > 0) {
        totalMight += t.might * qty;
        byTier[t.tier] = (byTier[t.tier] || 0) + qty;
        t.res.forEach((r, i) => totalRes[i] += r * qty);
      }
    });

    // Total training time
    let totalSecs = 0;
    for (const [tier, qty] of Object.entries(byTier)) {
      if (qty > 0) {
        const baseT = BASE_TIME[parseInt(tier)];
        totalSecs  += (baseT / ((100 + speed) / 100)) * qty;
      }
    }

    // Max tier (for speedup filtering)
    let maxTier = 0;
    for (const [tier, qty] of Object.entries(byTier)) {
      if (qty > 0) maxTier = Math.max(maxTier, parseInt(tier));
    }

    // Filter speedups — exclude large ones for low tiers
    const exclude = [];
    if (maxTier > 0 && maxTier <= 2) { exclude.push('3d'); }

    // Greedy speedup plan
    let remaining = Math.ceil(totalSecs);
    let totalGems = 0;
    const plan    = [];

    const relevant = Object.entries(SPEEDUPS)
      .filter(([k]) => !exclude.includes(k))
      .map(([id, s]) => ({ id, ...s }))
      .sort((a, b) => b.seconds - a.seconds);

    relevant.forEach(sp => {
      if (remaining >= sp.seconds) {
        const count = Math.floor(remaining / sp.seconds);
        plan.push({ id: sp.id, count, img: sp.img });
        totalGems += count * sp.cost;
        remaining  = remaining % sp.seconds;
      }
    });

    // Remaining → gems
    if (remaining > 0) {
      let tempGems = Math.ceil(remaining / 60) * 5;
      const sp60 = SPEEDUPS['60m'];
      if (sp60) {
        const c = Math.floor(remaining / sp60.seconds);
        const g = c * sp60.cost + Math.ceil((remaining % sp60.seconds) / 60) * 5;
        if (g < tempGems) tempGems = g;
      }
      totalGems += tempGems;
    }

    // Build HTML fragments
    const troopsHTML  = buildTroopsHTML();
    const speedupHTML = buildSpeedupHTML(plan, totalSecs);
    const resHTML     = buildResHTML(totalRes);

    // Update all targets
    updateDOM({
      totalMight, totalSecs, totalGems,
      troopsHTML, speedupHTML, resHTML,
      active: TROOPS.filter(t => (_qty[t.id] || 0) > 0).length,
    });

    // Tab dot badges
    [1, 2, 3, 4].forEach(tier => {
      const hasTroops = TROOPS
        .filter(t => t.tier === tier && (_qty[t.id] || 0) > 0).length > 0;
      document.querySelector(`.tc-tab[data-tier="${tier}"]`)
        ?.classList.toggle('has-troops', hasTroops);
    });
  }

  function buildTroopsHTML() {
    const active = TROOPS.filter(t => (_qty[t.id] || 0) > 0);
    if (active.length === 0) return '';
    return active.map(t => {
      const name = TROOP_NAMES[t.id] || t.id;
      const qty = _qty[t.id];
      return `
        <div class="tc-speedup-item">
          <div class="tc-speedup-left">
            <img src="${IMG_BASE}${t.img}" class="tc-speedup-img" style="object-fit: cover; transform: scale(1.3);" alt="${esc(name)}">
            <span>${esc(name)}</span>
          </div>
          <span class="tc-speedup-badge">x ${fmtNum(qty)}</span>
        </div>`;
    }).join('');
  }

  function buildSpeedupHTML(plan, totalSecs) {
    const noSpeedups = t('calc_no_big_speedups');
    const prefix     = t('calc_speedup_prefix');
    if (plan.length === 0) {
      return `<p class="tc-no-speedups">${esc(totalSecs > 0 ? noSpeedups : '—')}</p>`;
    }
    return plan.map(p => `
      <div class="tc-speedup-item">
        <div class="tc-speedup-left">
          ${p.img
            ? `<img src="${IMG_BASE}${p.img}" class="tc-speedup-img" alt="${esc(p.id)}">`
            : `<span class="tc-speedup-fallback">⏱️</span>`}
          <span>${esc(prefix)} ${esc(p.id)}</span>
        </div>
        <span class="tc-speedup-badge">x ${fmtNum(p.count)}</span>
      </div>`).join('');
  }

  function buildResHTML(totalRes) {
    return RESOURCES.map((r, i) => `
      <div class="tc-res-item">
        <span class="tc-res-name">
          <img src="${IMG_BASE}${r.img}" class="tc-res-icon" alt="${esc(r.name)}">
          <span>${esc(t(r.key) || r.name)}</span>
        </span>
        <span class="tc-res-val">${fmtShort(totalRes[i])}</span>
      </div>`).join('');
  }

  function updateDOM({ totalMight, totalSecs, totalGems, troopsHTML, speedupHTML, resHTML, active }) {
    const hasData = totalMight > 0;

    // Active count label
    const countEl = document.getElementById('tc-active-count');
    if (countEl) {
      countEl.textContent = active > 0
        ? `${active} troop type${active !== 1 ? 's' : ''} selected`
        : '\u2014';
    }

    // ── Desktop sidebar ──
    const ph     = document.getElementById('tc-ph');
    const result = document.getElementById('tc-result');
    if (ph)     ph.style.display     = hasData ? 'none' : 'block';
    if (result) result.style.display = hasData ? 'block' : 'none';

    setText('d-gems',  fmtNum(totalGems));
    setText('d-might', fmtNum(totalMight));
    setText('d-time',  fmtTime(totalSecs));
    setHTML('d-troops', troopsHTML);
    setHTML('d-sp',    speedupHTML);
    setHTML('d-res',   resHTML);

    // ── Mobile bar ──
    const bar = document.getElementById('tc-mob-bar');
    if (bar) bar.classList.toggle('visible', hasData);
    setText('m-gems',  fmtNum(totalGems));
    setText('m-might', fmtNum(totalMight));
    setText('m-time',  fmtTime(totalSecs));

    // ── Mobile sheet ──
    setText('s-gems',  fmtNum(totalGems));
    setText('s-might', fmtNum(totalMight));
    setText('s-time',  fmtTime(totalSecs));
    setHTML('s-troops', troopsHTML);
    setHTML('s-sp',    speedupHTML);
    setHTML('s-res',   resHTML);
  }

  /* ═══════════════════════════════════════════════════════════
     i18n RE-APPLY
  ═══════════════════════════════════════════════════════════ */

  function applyI18nLabels() {
    // data-i18n elements inside the page (handled by i18n.js already for static ones)
    // Re-apply resource names inside dynamically built HTML by re-running recalc
  }

  /* ═══════════════════════════════════════════════════════════
     UTILITIES
  ═══════════════════════════════════════════════════════════ */

  function t(key) {
    return window.t ? window.t(key) : key;
  }

  function setText(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  }

  function setHTML(id, html) {
    const el = document.getElementById(id);
    if (el) el.innerHTML = html;
  }

  function fmtNum(n) {
    return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  function fmtShort(n) {
    if (n >= 1e9) return (n / 1e9).toFixed(1).replace(/\.0$/, '') + 'B';
    if (n >= 1e6) return (n / 1e6).toFixed(1).replace(/\.0$/, '') + 'M';
    if (n >= 1e3) return (n / 1e3).toFixed(0) + 'K';
    return String(n);
  }

  function fmtTime(s) {
    if (s <= 0) return '0s';
    s = Math.ceil(s);
    const d = Math.floor(s / 86400); s %= 86400;
    const h = Math.floor(s / 3600);  s %= 3600;
    const m = Math.floor(s / 60);
    const sec = s % 60;
    const parts = [];
    if (d)   parts.push(`${d}d`);
    if (h)   parts.push(`${h}h`);
    if (m)   parts.push(`${m}m`);
    if (sec || !parts.length) parts.push(`${sec}s`);
    return parts.join(' ');
  }

  function esc(str) {
    return (str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

})();
