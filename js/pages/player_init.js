/**
 * Player page: initPlayer() — URL params, data load, tabs routing, DOMContentLoaded
 * Requires: player_head.js, player_sections.js
 * Auto-split from the original large monolithic JS file (globals preserved).
 */

  if (growth && growth.name_history && growth.name_history.length > 0) {
    nameChangesHtml = `<div class="card" style="margin-bottom:1.5rem;">
      <div class="card-header" style="cursor:pointer;" onclick="this.nextElementSibling.style.display=this.nextElementSibling.style.display==='none'?'block':'none'">
        <h2 style="font-size:1.1rem; color:var(--text-primary);"><span style="margin-right:8px;">📝</span>${t('identity_tracker')} (${growth.name_history.length} ${t('previous_names')}) <span style="font-size:0.8rem;float:right;color:var(--text-secondary);font-weight:normal;">${t('view_all')} ▾</span></h2>
      </div>
      <div class="card-body" style="display:none; padding:0; border-top:1px solid var(--border);">
        <table style="border:none;margin:0;">
          <thead><tr><th>${t('old_name_new_name')}</th><th class="right">${t('until_date')}</th></tr></thead>
          <tbody>
            ${growth.name_history.map(nh => `<tr style="transition:background 0.15s;" onmouseover="this.style.background='var(--bg-hover)'" onmouseout="this.style.background=''"><td class="card-main" style="color:var(--text-secondary);text-decoration:line-through">${nh.name}</td><td class="right mono" data-label="${t('until_date')}">${nh.until}</td></tr>`).join('')}
          </tbody>
        </table>
      </div>
    </div>`;
  }

  const cleanEmoji = str => (str || '').replace(/^(?:[\p{Extended_Pictographic}\u{1F000}-\u{1FFFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]\s*)+/u, '');

  container.innerHTML = `
    ${_profileHeader(name, growth, 'member', telegram)}
    ${nameChangesHtml}
    <div style="display:flex;gap:.5rem;margin:1.2rem 0;flex-wrap:wrap;">
      <button id="btn-war"  class="player-tab active" onclick="switchMemberTab('war')">${cleanEmoji(t('nav_war'))}</button>
      <button id="btn-hunt" class="player-tab" onclick="switchMemberTab('hunt')">${cleanEmoji(t('nav_hunt'))}</button>
      <button id="btn-fest" class="player-tab" onclick="switchMemberTab('fest')">${cleanEmoji(t('nav_festival'))}</button>
      <button id="btn-da"   class="player-tab" onclick="switchMemberTab('da')">Dragon Arena</button>
      <button id="btn-all"  class="player-tab" onclick="switchMemberTab('all')">${cleanEmoji(t('nav_history'))}</button>
    </div>
    <div id="tab-war"></div>
    <div id="tab-hunt" style="display:none;"></div>
    <div id="tab-fest" style="display:none;"></div>
    <div id="tab-all"  style="display:none;"></div>
    <div id="tab-da"   style="display:none;"></div>`;

  const mounted = { war: false, hunt: false, fest: false, all: false, da: false };

  function mountTab(tab) {
    if (mounted[tab]) return;
    mounted[tab] = true;
    const el = document.getElementById(`tab-${tab}`);
    const urlMonth = new URLSearchParams(window.location.search).get('month') || '';
    const urlWeek = new URLSearchParams(window.location.search).get('week') || '';
    let sec;
    if (tab === 'war') sec = buildWarSection(name, urlMonth, warDailyData, growth, warsData, warUidKey);
    else if (tab === 'hunt') sec = buildHuntSection(name, urlWeek, huntDailyData, playerHunts52, huntUidKey, mhuntsEntry);
    else if (tab === 'fest') sec = buildFestivalSection(name, growth, festivalData);
    else if (tab === 'da') sec = buildDragonArenaSection(name, growth, daEvents);
    else sec = buildAllHistorySection(name, growth, playerHunts52, mhuntsEntry, festivalData, daEvents);
    el.innerHTML = sec.html;
    sec.mount();
  }

  mountTab('war');

  window.switchMemberTab = function (tab) {
    ['war', 'hunt', 'fest', 'all', 'da'].forEach(t => {
      const tabEl = document.getElementById(`tab-${t}`);
      const btnEl = document.getElementById(`btn-${t}`);
      if (tabEl) tabEl.style.display = t === tab ? '' : 'none';
      if (btnEl) btnEl.classList.toggle('active', t === tab);
    });
    mountTab(tab);
  };
}

// ─── Main entry ──────────────────────────────────────────────────────────────

async function initPlayer() {
  const container = document.getElementById('player-container');
  if (!container) return;

  const p = new URLSearchParams(window.location.search);
  // Accept ?uid=UID (primary, stable) or legacy ?id=NAME (fallback for old links)
  const uidParam = p.get('uid') || '';
  const nameParam = p.get('id') || '';
  const view = p.get('view') || 'all';
  const month = p.get('month') || '';
  const week = p.get('week') || '';

  if (!uidParam && !nameParam) { setError(container, t('not_found')); return; }
  setLoading(container, t('loading_player_param').replace('{name}', uidParam || nameParam));

  try {
    const [histRes, mhuntsRes, warDailyRes, huntDailyRes, festRes, membersRes, warsRes, daRes] = await Promise.allSettled([
      loadJSON('history.json'),
      loadJSON('member_hunts.json'),
      loadJSON('member_war_daily.json'),
      loadJSON('member_hunt_daily.json'),
      loadJSON('festival.json'),
      loadJSON('members.json'),
      loadJSON('wars.json'),       // full monthly war data - used for accurate kills/might delta
      loadJSON('dragon_arena.json'),
    ]);

    const histData = histRes.status === 'fulfilled' ? histRes.value : { members: [] };
    const mhunts = mhuntsRes.status === 'fulfilled' ? mhuntsRes.value : {};
    const warDailyData = warDailyRes.status === 'fulfilled' ? warDailyRes.value : {};
    const huntDailyData = huntDailyRes.status === 'fulfilled' ? huntDailyRes.value : {};
    const festivalData = festRes.status === 'fulfilled' ? festRes.value : [];
    const membersData = membersRes.status === 'fulfilled' ? membersRes.value : [];
    const warsData = warsRes.status === 'fulfilled' ? warsRes.value : [];
    const daEvents = daRes.status === 'fulfilled' ? daRes.value : [];

    // ── Resolve player in history.json - UID-FIRST, name as fallback ──────────
    // history.json has { uid, igg_id, name, snapshots[], name_history[], ... } per member.
    // We ALWAYS prefer UID lookup (stable hash or numeric igg_id) to avoid collisions when two players share a name.
    let growth = null;
    if (uidParam) {
      // Primary: match by stable hashed UID or numeric igg_id
      growth = (histData.members || []).find(m =>
        String(m.uid) === String(uidParam) ||
        (m.igg_id && String(m.igg_id) === String(uidParam))
      ) || null;
    }
    if (!growth && nameParam) {
      // Fallback for legacy ?id=NAME links: match by current name
      growth = (histData.members || []).find(m => m.name === nameParam) || null;
    }

    // The display name comes from history.json (reflects any recent rename).
    // If player not found in history, use the param as display name.
    const name = growth ? growth.name : (nameParam || uidParam);

    // The player's stable display UID (UE-XXXXX)
    const playerUid = growth ? (growth.uid || null) : (uidParam || null);

    // Resolve the stable numeric igg_id (which is used as the key in daily-data and member_hunts files)
    let playerIggId = null;
    if (growth && growth.igg_id) {
      playerIggId = String(growth.igg_id);
    }

    // Fallback 1: look up in membersData (members.json) by matching display UID
    if (!playerIggId && playerUid && membersData) {
      const mb = membersData.find(m => String(m.uid) === String(playerUid));
      if (mb && mb.igg_id) {
        playerIggId = String(mb.igg_id);
      }
    }

    // Fallback 2: look up in mhunts (member_hunts.json) where entry's .uid matches playerUid
    if (!playerIggId && playerUid && mhunts) {
      const foundKey = Object.keys(mhunts).find(k => mhunts[k] && String(mhunts[k].uid) === String(playerUid));
      if (foundKey) {
        playerIggId = foundKey;
      }
    }

    // Fallback 3: look up in warsData (wars.json) by matching display UID
    if (!playerIggId && playerUid && warsData) {
      for (const monthData of warsData) {
        const mb = (monthData.members || []).find(m => String(m.uid) === String(playerUid));
        if (mb && mb.igg_id) {
          playerIggId = String(mb.igg_id);
          break;
        }
      }
    }

    // Fallback 4: if the uidParam itself is numeric (e.g. 1924268117), it is the IGG ID
    if (!playerIggId && uidParam && /^\d+$/.test(uidParam)) {
      playerIggId = uidParam;
    }

    const nameLower = name.toLowerCase();

    // ── Helper: find matching key in a daily-data object ─────────────────────
    // Priority: 1) key === playerIggId (numeric key), 2) key === playerUid (fallback), 3) name match
    function findDailyKey(dailyData) {
      // 1. Match by numeric IGG ID key (most reliable)
      if (playerIggId) {
        const byIgg = Object.keys(dailyData).find(
          k => String(k) === String(playerIggId)
        );
        if (byIgg) return byIgg;
      }
      // 2. Match by display UID (if daily data somehow is keyed by UE-XXXXX)
      if (playerUid) {
        const byUid = Object.keys(dailyData).find(
          k => String(k) === String(playerUid)
        );
        if (byUid) return byUid;
      }
      // 3. Fallback: name match (for players not yet in history/hunts etc.)
      const byName = Object.keys(dailyData).find(
        k => (dailyData[k].name || '').toLowerCase() === nameLower
      );
      return byName || null;
    }

    const warUidKey = findDailyKey(warDailyData);
    const huntUidKey = findDailyKey(huntDailyData);

    // ── member_hunts: UID-first lookup ────────────────────────────────────────
    const mhuntsUidKey = (() => {
      // 1. Match by numeric IGG ID key
      if (playerIggId) {
        const byIgg = Object.keys(mhunts).find(
          k => String(k) === String(playerIggId)
        );
        if (byIgg) return byIgg;
      }
      // 2. Match by searching inside the entries for .uid matching playerUid
      if (playerUid) {
        const byUid = Object.keys(mhunts).find(
          k => mhunts[k] && String(mhunts[k].uid) === String(playerUid)
        );
        if (byUid) return byUid;
      }
      // 3. Fallback: name match
      const byName = Object.keys(mhunts).find(
        k => (mhunts[k].name || '').toLowerCase() === nameLower
      );
      return byName || null;
    })();
    const mhuntsEntry = mhuntsUidKey ? mhunts[mhuntsUidKey] : null;
    const playerHunts52 = mhuntsUidKey ? (mhunts[mhuntsUidKey].weeks || []) : [];

    // ── Telegram: resolve from members.json by UID/IGG ID first, then name ────
    const memberEntry = membersData.find(m =>
      (playerUid && String(m.uid) === String(playerUid)) ||
      (playerIggId && m.igg_id && String(m.igg_id) === String(playerIggId)) ||
      (m.name || '').toLowerCase() === nameLower
    );
    const telegram = memberEntry ? (memberEntry.telegram || '') : '';

    if (view === 'war') await renderWarView(container, name, month, growth, warDailyData, telegram, warsData, warUidKey);
    else if (view === 'hunt') await renderHuntView(container, name, week, huntDailyData, playerHunts52, mhuntsEntry, telegram, growth, huntUidKey);
    else if (view === 'all') await renderAllHistoryView(container, name, growth, playerHunts52, mhuntsEntry, festivalData, telegram);
    else /* member */         await renderMemberView(container, name, growth, warDailyData, huntDailyData, playerHunts52, mhuntsEntry, festivalData, telegram, warsData, warUidKey, huntUidKey, daEvents);

  } catch (err) {
    setError(container, t('error_loading') + ': ' + err.message);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  if (window.location.pathname.split('/').pop() !== 'player.html') return;
  // Wait for i18n to be ready before first render
  const checkI18n = setInterval(() => {
    if (window.i18n && Object.keys(window.i18n.data).length > 0) {
      clearInterval(checkI18n);
      initPlayer();
    }
  }, 50);
});

window.addEventListener('languageChanged', () => {
  if (window.location.pathname.split('/').pop() === 'player.html') initPlayer();
});
