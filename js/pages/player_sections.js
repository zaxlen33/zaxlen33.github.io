/**
 * Player page: buildWar/Hunt/Festival/History/DA sections + render views
 * Requires: player_head.js (fmt, chart factories, statCards, profileHeader)
 * Auto-split from the original large monolithic JS file (globals preserved).
 */

function _profileHeader(name, growth, view, telegram) {
  const snaps = growth ? (growth.snapshots || []) : [];
  const last = snaps.length ? snaps[snaps.length - 1] : null;
  const initial = name.charAt(0).toUpperCase();
  const uid = growth && growth.uid ? growth.uid : 'N/A';

  let backLink, backText;
  if (view === 'war') { backLink = './war.html'; backText = t('nav_war'); }
  else if (view === 'hunt') { backLink = './hunt.html'; backText = t('nav_hunt'); }
  else if (view === 'all') { backLink = './history.html'; backText = t('nav_history') || '📈 History'; }
  else { backLink = './members.html'; backText = t('nav_members'); }

  const badgeStyle = 'font-size:0.8rem;padding:4px 8px;display:inline-flex;align-items:center;line-height:1;margin:0;';
  const tgBadge = telegram ? `<span class="tg-badge" style="${badgeStyle}">💬 ${telegram}</span>` : '';
  const uidBadge = `<span class="uid-badge" style="${badgeStyle}">🔐 ${uid}</span>`;
  let rBadge = '';
  if (last && last.rank) {
    rBadge = rankBadge(last.rank).replace('class="rank-badge', `style="${badgeStyle}" class="rank-badge`);
  }

  const firstSeen = growth && growth.first_seen ? growth.first_seen : '-';
  const lastSeen = last ? last.date : '-';

  return `
    <div class="breadcrumb" style="margin-bottom:1.5rem;">
      <a href="${backLink}">${backText}</a><span class="sep">›</span><span class="current">${name}</span>
    </div>
    <div class="profile-header">
      <div class="profile-avatar">${initial}</div>
      <div class="profile-info" style="width:100%;">
        <div class="ph-top" style="display:flex;align-items:center;flex-wrap:wrap;gap:10px;">
          <h1 style="margin:0;">${name}</h1>
          <div style="display:flex;align-items:center;flex-wrap:wrap;gap:6px;">
            ${uidBadge}
            ${rBadge}
            ${tgBadge}
          </div>
        </div>
        <div class="ph-bottom" style="margin-top:12px;display:inline-flex;align-items:center;flex-wrap:wrap;gap:12px;color:var(--text-secondary);font-size:0.85rem;background:rgba(255,255,255,0.03);padding:7px 12px;border-radius:6px;border:1px solid rgba(255,255,255,0.05);">
          <div><span style="opacity:0.6;">${t('first_seen_label') || t('first_seen') || 'First seen'}:</span> <strong style="color:var(--text-primary);letter-spacing:0.5px;">${firstSeen}</strong></div>
          <div style="width:1px;height:12px;background:rgba(255,255,255,0.1);"></div>
          <div><span style="opacity:0.6;">${t('last_seen_label') || 'Last seen'}:</span> <strong style="color:var(--text-primary);letter-spacing:0.5px;">${lastSeen}</strong></div>
        </div>
      </div>
    </div>`;
}

// ─── Build war section HTML + mount charts ───────────────────────────────────

function buildWarSection(name, month, warDailyData, growth, warsData, warUidKey) {
  // warDailyData is keyed by str(igg_id); resolve the entry by uid key.
  // warUidKey is pre-resolved in initPlayer by matching the current name.
  const memberEntry = warUidKey ? warDailyData[warUidKey] : null;
  const allDays = memberEntry ? (memberEntry.snapshots || []) : [];
  // Chart always shows last 30 days of available daily data
  const chartDays = allDays.slice(-31);

  const last30 = chartDays.length ? chartDays[chartDays.length - 1] : null;
  const first30 = chartDays.length ? chartDays[0] : null;

  // For kills/might diff: use wars.json when a specific month is selected.
  // wars.json has the full month delta (first→last snapshot of the month) for
  // any historical month - no daily data window limitation.
  let mightDiff, killsDiff;
  // Helper: find a member in a war month's members array by UID first, then by name
  function findWarMember(warMonthObj, playerUidStr, playerName) {
    if (!warMonthObj) return null;
    const mbs = warMonthObj.members || [];
    if (playerUidStr) {
      const byUid = mbs.find(m => String(m.uid) === String(playerUidStr) || String(m.igg_id) === String(playerUidStr));
      if (byUid) return byUid;
    }
    return mbs.find(m => (m.name || '').toLowerCase() === (playerName || '').toLowerCase()) || null;
  }

  const playerUidStr = growth ? (growth.uid || null) : null;

  if (month && warsData) {
    const warMonth = warsData.find(w => w.month === month);
    const warMember = findWarMember(warMonth, playerUidStr, name);
    mightDiff = warMember ? (warMember.might_diff || 0) : ((last30 && first30) ? last30.might - first30.might : 0);
    killsDiff = warMember ? (warMember.kills_diff || 0) : ((last30 && first30) ? Math.max(0, last30.kills - first30.kills) : 0);
  } else {
    // General "last 30 days" view - use daily delta
    mightDiff = (last30 && first30) ? last30.might - first30.might : 0;
    killsDiff = (last30 && first30) ? Math.max(0, last30.kills - first30.kills) : 0;
  }

  let html = '';
  html += _statCards([
    { icon: '🏰', value: last30 ? fmtCompact(last30.might) : '-', label: t('current_might'), color: 'blue', delta: mightDiff, deltaLabel: month ? t('latest') : t('last_30_days') },
    { icon: '⚔️', value: last30 ? fmtCompact(last30.kills) : '-', label: t('current_kills'), color: 'yellow', delta: killsDiff, deltaLabel: month ? t('latest') : t('last_30_days') },
  ]);

  let quotaKillsDiff = killsDiff;
  if (warsData && warsData.length > 0) {
    const targetMonth = month || warsData[warsData.length - 1].month;
    const warMonth = warsData.find(w => w.month === targetMonth);
    const warMember = findWarMember(warMonth, playerUidStr, name);
    quotaKillsDiff = warMember ? (warMember.kills_diff || 0) : 0;
  }
  html += _quotaBadge(quotaKillsDiff);

  // Chart section - always shows last 30 days of daily snapshots
  html += `<div class="section-label">📅 ${t('last_30_days')}</div>`;
  html += `<div class="chart-grid">`;
  html += chartDays.length >= 2 ? _card(t('chart_power_30d'), 'chart-war-might-30d') : _noData(t('power_30d'));
  html += chartDays.length >= 2 ? _card(t('chart_kills_30d'), 'chart-war-kills-30d') : _noData(t('kills_30d'));
  html += `</div>`;

  html += `<div class="section-label">📊 ${t('yearly_history')}</div>`;
  const snaps52 = growth ? (growth.snapshots || []) : [];
  html += `<div class="chart-grid" style="margin-top:-0.5rem;">`;
  html += snaps52.length >= 2 ? _card(t('chart_power_52w'), 'chart-war-might-52w') : _noData(t('war_history'));
  html += snaps52.length >= 2 ? _card(t('chart_kills_52w'), 'chart-war-kills-52w') : _noData(t('war_history'));
  html += `</div>`;

  return {
    html, mount() {
      if (chartDays.length >= 2) {
        const dates = chartDays.map(s => s.date.slice(5));
        _lineChart('chart-war-might-30d', t('might'), dates, chartDays.map(s => s.might), '--accent-cyan', '#06b6d4');
        _lineChart('chart-war-kills-30d', t('kills'), dates, chartDays.map(s => s.kills), '--accent-red', '#f85149');
      }
      if (snaps52.length >= 2) {
        const dates = snaps52.map(s => s.date);
        _lineChart('chart-war-might-52w', t('might'), dates, snaps52.map(s => s.might), '--accent-cyan', '#06b6d4');
        _lineChart('chart-war-kills-52w', t('kills'), dates, snaps52.map(s => s.kills), '--accent-red', '#f85149');
      }
    }
  };
}

// ─── Build hunt section HTML + mount charts ──────────────────────────────────

function buildHuntSection(name, weekId, huntDailyData, playerHunts52, huntUidKey, mhuntsEntry) {
  // huntDailyData is keyed by str(user_id); resolve by uid key.
  // huntUidKey is pre-resolved in initPlayer.
  const memberHuntEntry = huntUidKey ? huntDailyData[huntUidKey] : null;
  const playerWeeks = memberHuntEntry ? (memberHuntEntry.weeks || {}) : {};
  const available = Object.keys(playerWeeks).sort();
  const latestWeekId = available.length ? available[available.length - 1] : null;
  let statWeekId = weekId;

  // Since playerWeeks (daily data) is now optimized to only contain the latest week,
  // we must validate historical week requests against playerHunts52 instead.
  let isValidHistoricalWeek = false;
  if (statWeekId && playerHunts52 && playerHunts52.length > 0) {
    isValidHistoricalWeek = playerHunts52.some(w => w.date.startsWith(statWeekId));
  }

  if (!statWeekId || (!playerWeeks[statWeekId] && !isValidHistoricalWeek)) {
    statWeekId = latestWeekId;
  }

  // ── 1. Calculate quota/stats for the SPECIFIED week (statWeekId) ──
  let weekTotal = 0;
  let minPts = 35;
  let met = false;
  if (statWeekId) {
    const statWeek = playerHunts52.find(w => w.date && w.date.startsWith(statWeekId));
    if (statWeek) {
      weekTotal = statWeek.pts_total || 0;
      minPts = statWeek.min_required || (memberHuntEntry && memberHuntEntry.hunt_min) || 35;
      met = weekTotal >= minPts;
    }
  }

  const pct = Math.min(100, Math.round((weekTotal / minPts) * 100));
  const pctColor = met ? 'var(--accent-green)' : pct >= 75 ? 'var(--accent-yellow)' : 'var(--accent-red)';

  let statWeekLabel = '';
  if (statWeekId) {
    try {
      const mon = new Date(statWeekId + 'T00:00:00');
      const sun = new Date(mon); sun.setDate(sun.getDate() + 6);
      statWeekLabel = `${mon.toLocaleDateString(window.i18n?.currentLang || 'en', { month: 'short', day: 'numeric' })} – ${sun.toLocaleDateString(window.i18n?.currentLang || 'en', { month: 'short', day: 'numeric', year: 'numeric' })}`;
    } catch { statWeekLabel = statWeekId; }
  }

  // ── 2. Calculate daily cumulative for the LATEST week (latestWeekId) ──
  const chartDays = latestWeekId ? (playerWeeks[latestWeekId] || []) : [];
  const sortedChartDays = [...chartDays].sort((a, b) => a.date.localeCompare(b.date));

  let cumPts = 0;
  const cumDates = [], cumVals = [], cumMon = {}, cumPurch = {};
  for (const d of sortedChartDays) {
    cumPts += d.pts_total;
    cumDates.push(d.date.slice(5));
    cumVals.push(cumPts);
    for (let i = 1; i <= 5; i++) {
      cumMon[`lvl${i}`] = (cumMon[`lvl${i}`] || 0) + (d.monsters?.[`lvl${i}`] || 0);
      cumPurch[`lvl${i}`] = (cumPurch[`lvl${i}`] || 0) + (d.purchases?.[`lvl${i}`] || 0);
    }
  }

  let html = '';

  html += `<div class="card" style="border-top:3px solid ${pctColor};margin-bottom:1.5rem;">
    <div class="card-header"><h2>🎯 ${t('goal_title')} - ${statWeekLabel}</h2></div>
    <div class="card-body" style="display:flex;align-items:center;gap:1.2rem;flex-wrap:wrap;">
      <div style="font-size:2.2rem;">${met ? '✅' : '❌'}</div>
      <div style="flex:1;">
        <div style="font-weight:700;font-size:1rem;color:${pctColor};">${met ? t('goal_met') : t('goal_not_met')}</div>
        <div style="color:var(--text-secondary);margin-top:3px;">${fmtNum(weekTotal)} / ${minPts} ${t('pts_accumulated')}</div>
        <div style="margin-top:8px;">
          <div class="progress-bar" style="width:100%;max-width:280px;"><div class="progress-fill" style="width:${pct}%;background:${pctColor};"></div></div>
          <span style="font-family:var(--font-mono);font-size:.83rem;color:${pctColor};">${pct}%</span>
        </div>
      </div>
    </div>
  </div>`;

  html += `<div class="section-label">🗓️ ${t('last_7_days') || 'Last 7 Days'}</div>`;
  html += `<div class="chart-grid">`;
  html += sortedChartDays.length >= 1 ? _card(t('chart_hunt_pts_7d'), 'chart-hunt-pts-7d') : _noData(t('hunt_history'));
  html += sortedChartDays.length >= 1 ? _card(t('chart_hunt_bar_7d'), 'chart-hunt-bar-7d') : _noData(t('monsters_hunted'));
  html += `</div>`;

  html += `<div class="section-label">📊 ${t('hunt_history_title') || '52-Week History - Hunt Data'}</div>`;
  html += `<div class="chart-grid">`;
  html += playerHunts52.length >= 2 ? _card(t('chart_hunt_pts_52w'), 'chart-hunt-pts-52w') : _noData(t('hunt_history'));
  html += playerHunts52.length >= 1 ? _card(t('chart_hunt_bar_52w'), 'chart-hunt-bar-52w') : _noData(t('chests_purchased'));
  html += `</div>`;

  return {
    html, mount() {
      if (sortedChartDays.length >= 1) {
        _lineChart('chart-hunt-pts-7d', t('cumulative_points'), cumDates, cumVals, '--accent-green', '#3fb950');
        const lvls = ['Lvl 1', 'Lvl 2', 'Lvl 3', 'Lvl 4', 'Lvl 5'];
        _barChart('chart-hunt-bar-7d', lvls, [
          { label: t('monsters'), data: [cumMon.lvl1, cumMon.lvl2, cumMon.lvl3, cumMon.lvl4, cumMon.lvl5], backgroundColor: '#a371f7', _cssBgVar: '--accent-purple' },
          { label: t('chests'), data: [cumPurch.lvl1, cumPurch.lvl2, cumPurch.lvl3, cumPurch.lvl4, cumPurch.lvl5], backgroundColor: '#e3b341', _cssBgVar: '--accent-yellow' }
        ]);
      }
      if (playerHunts52.length >= 2) {
        const hd = playerHunts52.map((h, i) => {
          let d = h.date.split(' to ')[0];
          return i === playerHunts52.length - 1 ? d + ' ⟳' : d;
        });
        _lineChart('chart-hunt-pts-52w', t('hunt_history'), hd, playerHunts52.map(h => h.pts_total), '--accent-green', '#3fb950');
      }
      if (playerHunts52.length >= 1) {
        const monsters = mhuntsEntry ? (mhuntsEntry.lifetime_monsters || {}) : {};
        const purchases = mhuntsEntry ? (mhuntsEntry.lifetime_purchases || {}) : {};
        const lvls = ['Lvl 1', 'Lvl 2', 'Lvl 3', 'Lvl 4', 'Lvl 5'];
        _barChart('chart-hunt-bar-52w', lvls, [
          { label: t('monsters'), data: [monsters.lvl1 || 0, monsters.lvl2 || 0, monsters.lvl3 || 0, monsters.lvl4 || 0, monsters.lvl5 || 0], backgroundColor: '#a371f7', _cssBgVar: '--accent-purple' },
          { label: t('chests'), data: [purchases.lvl1 || 0, purchases.lvl2 || 0, purchases.lvl3 || 0, purchases.lvl4 || 0, purchases.lvl5 || 0], backgroundColor: '#e3b341', _cssBgVar: '--accent-yellow' }
        ]);
      }
    }
  };
}

// ─── Build festival section HTML + mount charts ──────────────────────────────

function buildFestivalSection(name, growth, rawFestivalData) {
  let html = '';
  if (!rawFestivalData || !rawFestivalData.length) return { html: _noData('🎪 Festival History'), mount() { } };

  const uid = growth ? (growth.uid || 'N/A') : 'N/A';
  const festHist = [];
  rawFestivalData.forEach(fest => {
    // Find player by UID or current Name
    const p = fest.players.find(x => x.uid === uid || x.name === name);
    if (p) {
      let dateSpan = fest.date;
      try {
        const dEnd = new Date(fest.date + 'T00:00:00');
        const dStart = new Date(dEnd);
        dStart.setDate(dStart.getDate() - 7);
        dateSpan = `${dStart.toLocaleDateString(window.i18n?.currentLang || 'en-US', { month: 'short', day: 'numeric' })} – ${dEnd.toLocaleDateString(window.i18n?.currentLang || 'en-US', { month: 'short', day: 'numeric' })}`;
      } catch (e) { }
      festHist.push({
        date: fest.date,
        dateSpan,
        score: p ? p.score : 0,
        participated: !!p,
        min: fest.summary.festival_min_score || 3100
      });
    }
  });

  const last12 = festHist.slice(-12);

  html += `<div class="section-label">🎪 ${t('festival_last_12')}</div>`;
  html += `<div class="chart-grid">`;
  html += last12.length > 0 ? _card(t('chart_fest_line_12e'), 'chart-player-fest-line') : _noData(t('festival_scores_line'));
  html += last12.length > 0 ? _card(t('chart_fest_bar_12e'), 'chart-player-fest-bar') : _noData(t('festival_scores_bar'));
  html += `</div>`;

  html += `<div class="card table-wrapper" style="margin-top:1.5rem">
    <table>
      <thead><tr><th>${t('date')}</th><th class="right">${t('score')}</th></tr></thead>
      <tbody>
        ${last12.slice().reverse().map(f => `<tr style="transition:background 0.15s;" onmouseover="this.style.background='var(--bg-hover)'" onmouseout="this.style.background=''"><td class="card-main">${f.dateSpan}</td><td data-label="${t('score')}" class="right mono">${f.participated ? Number(f.score).toLocaleString() : '-'}</td></tr>`).join('')}
      </tbody>
    </table>
  </div>`;

  return {
    html,
    mount() {
      if (last12.length > 0) {
        _barChart('chart-player-fest-bar', last12.map(f => f.dateSpan), [
          { label: t('score'), data: last12.map(f => f.score), backgroundColor: '#a371f7', _cssBgVar: '--accent' }
        ]);
        _lineChart('chart-player-fest-line', t('score'), last12.map(f => f.dateSpan), last12.map(f => f.score), '--accent', '#bc8cff');
      }
    }
  };
}

// ─── Build "All History" section (52w only) ──────────────────────────────────

function buildAllHistorySection(name, growth, playerHunts52, mhuntsEntry, rawFestivalData, daEvents) {
  const snaps52 = growth ? (growth.snapshots || []) : [];
  const last52 = snaps52.length ? snaps52[snaps52.length - 1] : null;
  const lastH52 = playerHunts52.length ? playerHunts52[playerHunts52.length - 1] : null;

  let html = _statCards([
    { icon: '🏰', value: last52 ? fmtCompact(last52.might) : '-', label: t('current_might'), color: 'blue' },
    { icon: '⚔️', value: last52 ? fmtCompact(last52.kills) : '-', label: t('current_kills'), color: 'yellow' },
    { icon: '🎯', value: lastH52 ? fmtNum(lastH52.pts_total) : '-', label: t('points'), color: 'green' },
    { icon: '📊', value: snaps52.length, label: t('snapshots_label'), color: 'purple' },
  ]);

  html += `<div class="section-label">📊 ${t('all_history_52w')}</div>`;
  html += `<div class="chart-grid">`;
  html += snaps52.length >= 2 ? _card(t('chart_power_52w'), 'chart-all-might') : _noData(t('power_52w'));
  html += snaps52.length >= 2 ? _card(t('chart_kills_52w'), 'chart-all-kills') : _noData(t('kills_52w'));
  html += `</div><div class="chart-grid">`;
  html += playerHunts52.length >= 2 ? _card(t('chart_hunt_pts_52w'), 'chart-all-hunt-pts') : _noData(t('hunt_pts_52w'));
  html += lastH52 ? _card(t('chart_hunt_bar_52w'), 'chart-all-hunt-bar') : _noData(t('monsters_chests_52w'));
  html += `</div>`;

  const uid = growth ? (growth.uid || 'N/A') : 'N/A';
  const festHist = [];
  if (rawFestivalData) {
    rawFestivalData.forEach(fest => {
      const p = fest.players.find(x => x.uid === uid || x.name === name);
      if (p) {
        let dateSpan = fest.date;
        try {
          const dEnd = new Date(fest.date + 'T00:00:00');
          const dStart = new Date(dEnd);
          dStart.setDate(dStart.getDate() - 7);
          dateSpan = `${dStart.toLocaleDateString(window.i18n?.currentLang || 'en-US', { month: 'short', day: 'numeric' })} – ${dEnd.toLocaleDateString(window.i18n?.currentLang || 'en-US', { month: 'short', day: 'numeric' })}`;
        } catch (e) { }
        festHist.push({ dateSpan, score: p ? p.score : 0, participated: !!p });
      }
    });
  }
  const last12Fest = festHist.slice(-12);

  html += `<div class="section-label">🎪 ${t('festival_last_12')}</div>`;
  html += `<div class="chart-grid">`;
  html += last12Fest.length > 0 ? _card(t('chart_fest_line_12e'), 'chart-all-fest-line') : _noData(t('festival_scores_line'));
  html += last12Fest.length > 0 ? _card(t('chart_fest_bar_12e'), 'chart-all-fest-bar') : _noData(t('festival_scores_bar'));
  html += `</div>`;

  const daSec = buildDragonArenaSection(name, growth, daEvents);
  html += `<div style="margin-top:2rem;"></div>` + daSec.html;

  return {
    html, mount() {
      if (snaps52.length >= 2) {
        const dates = snaps52.map(s => s.date);
        _lineChart('chart-all-might', t('might'), dates, snaps52.map(s => s.might), '--accent-cyan', '#06b6d4');
        _lineChart('chart-all-kills', t('kills'), dates, snaps52.map(s => s.kills), '--accent-red', '#f85149');
      }
      if (playerHunts52.length >= 2) {
        const hd = playerHunts52.map((h, i) => {
          let d = h.date.split(' to ')[0];
          return i === playerHunts52.length - 1 ? d + ' ⟳' : d;
        });
        _lineChart('chart-all-hunt-pts', t('points'), hd, playerHunts52.map(h => h.pts_total), '--accent-green', '#3fb950');
      }
      if (lastH52) {
        const monsters = mhuntsEntry ? (mhuntsEntry.lifetime_monsters || {}) : {};
        const purchases = mhuntsEntry ? (mhuntsEntry.lifetime_purchases || {}) : {};
        const lvls = ['Lvl 1', 'Lvl 2', 'Lvl 3', 'Lvl 4', 'Lvl 5'];
        _barChart('chart-all-hunt-bar', lvls, [
          { label: t('monsters'), data: [monsters.lvl1 || 0, monsters.lvl2 || 0, monsters.lvl3 || 0, monsters.lvl4 || 0, monsters.lvl5 || 0], backgroundColor: '#a371f7', _cssBgVar: '--accent-purple' },
          { label: t('chests'), data: [purchases.lvl1 || 0, purchases.lvl2 || 0, purchases.lvl3 || 0, purchases.lvl4 || 0, purchases.lvl5 || 0], backgroundColor: '#e3b341', _cssBgVar: '--accent-yellow' }
        ]);
      }
      if (last12Fest.length > 0) {
        _lineChart('chart-all-fest-line', t('score'), last12Fest.map(f => f.dateSpan), last12Fest.map(f => f.score), '--accent', '#bc8cff');
        _barChart('chart-all-fest-bar', last12Fest.map(f => f.dateSpan), [
          { label: t('score'), data: last12Fest.map(f => f.score), backgroundColor: '#a371f7', _cssBgVar: '--accent' }
        ]);
      }
      daSec.mount();
    }
  };
}

function buildDragonArenaSection(name, growth, daEvents) {
  const SLOTS = [
    { slot: 1, start: '1:00 am', end: '2:00 am' },
    { slot: 2, start: '4:00 am', end: '5:00 am' },
    { slot: 3, start: '7:00 am', end: '8:00 am' },
    { slot: 4, start: '10:00 am', end: '11:00 am' },
    { slot: 5, start: '1:00 pm', end: '2:00 pm' },
    { slot: 6, start: '4:00 pm', end: '5:00 pm' },
    { slot: 7, start: '7:00 pm', end: '8:00 pm' },
    { slot: 8, start: '10:00 pm', end: '11:00 pm' }
  ];

  const uid = growth ? (growth.uid || 'N/A') : 'N/A';
  const events = (daEvents || []).slice().sort((a, b) => (a.date || '').localeCompare(b.date || ''));

  let aConf = 0, bConf = 0, bUnconf = 0, noShow = 0, absent = 0;
  const slotData = Array.from({ length: 8 }, () => ({ a: 0, bConf: 0, bUnconf: 0, noShow: 0 }));
  const historyRows = [];

  events.forEach(ev => {
    const p = (ev.participants || []).find(x =>
      (uid && uid !== 'N/A' && x.uid === uid) ||
      (x.name && x.name.toLowerCase() === (name || '').toLowerCase())
    );
    let cat = 'absent';
    if (p) {
      const st = p.status, tm = p.team;
      if (st === 'confirmed' && tm === 'A') { cat = 'a_conf'; aConf++; if (ev.slot >= 1 && ev.slot <= 8) slotData[ev.slot - 1].a++; }
      else if (st === 'confirmed' && tm === 'B') { cat = 'b_conf'; bConf++; if (ev.slot >= 1 && ev.slot <= 8) slotData[ev.slot - 1].bConf++; }
      else if (st === 'unconfirmed') { cat = 'b_unconf'; bUnconf++; if (ev.slot >= 1 && ev.slot <= 8) slotData[ev.slot - 1].bUnconf++; }
      else if (st === 'no_show') { cat = 'no_show'; noShow++; if (ev.slot >= 1 && ev.slot <= 8) slotData[ev.slot - 1].noShow++; }
      else { absent++; }
    } else { absent++; }
    historyRows.push({ date: ev.date, slot: ev.slot, cat, team: p ? p.team : null, status: p ? p.status : null });
  });

  const total = events.length;
  const confirmed = aConf + bConf;
  const pct = total ? Math.round((confirmed / total) * 100) : 0;
  const hasSlots = slotData.some(s => s.a + s.bConf + s.bUnconf + s.noShow > 0);

  // ── Stat row ────────────────────────────────────────────────────────────────
  const mkStat = (label, val, accent) =>
    `<div style="display:flex;flex-direction:column;gap:2px;padding:.9rem 1.1rem;background:var(--bg-card);border:1px solid var(--border);border-radius:10px;min-width:110px;">
       <span style="font-size:1.45rem;font-weight:700;color:${accent};letter-spacing:-.5px;">${val}</span>
       <span style="font-size:.72rem;text-transform:uppercase;letter-spacing:.06em;color:var(--text-muted);font-weight:500;">${label}</span>
     </div>`;

  let html = `<div style="display:flex;flex-wrap:wrap;gap:.6rem;margin-bottom:1.4rem;">
    ${mkStat('Team A · Confirmado', aConf, '#3fb950')}
    ${mkStat('Team B · Confirmado', bConf, '#58a6ff')}
    ${mkStat('Team B · Sin confirmar', bUnconf, '#e3a030')}
    ${mkStat('No Show', noShow, '#f85149')}
    ${mkStat('Ausencias', absent, '#6e7681')}
    <div style="display:flex;flex-direction:column;gap:4px;padding:.9rem 1.1rem;background:var(--bg-card);border:1px solid var(--border);border-radius:10px;min-width:130px;justify-content:center;">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;">
        <div style="flex:1;height:6px;background:var(--border);border-radius:3px;overflow:hidden;">
          <div style="width:${pct}%;height:100%;background:linear-gradient(90deg,#3fb950,#58a6ff);border-radius:3px;"></div>
        </div>
        <span style="font-size:1rem;font-weight:700;color:#e6edf3;">${pct}%</span>
      </div>
      <span style="font-size:.72rem;text-transform:uppercase;letter-spacing:.06em;color:var(--text-muted);font-weight:500;">Tasa de asistencia</span>
    </div>
  </div>`;

  // ── Slot chart ──────────────────────────────────────────────────────────────
  html += `<div style="margin-bottom:.4rem;font-size:.78rem;font-weight:600;text-transform:uppercase;letter-spacing:.08em;color:var(--text-muted);">Participación por Slot · UTC-5</div>`;
  html += `<div class="chart-grid">`;
  html += hasSlots ? _card('', 'chart-da-slots') : _noData('Sin datos de slots');
  html += `</div>`;

  // ── History table ───────────────────────────────────────────────────────────
  const STATUS_MAP = {
    a_conf: { label: 'Team A', sub: 'Confirmado', dot: '#3fb950' },
    b_conf: { label: 'Team B', sub: 'Confirmado', dot: '#58a6ff' },
    b_unconf: { label: 'Team B', sub: 'Sin confirmar', dot: '#e3a030' },
    no_show: { label: 'No Show', sub: 'Registrado · ausente', dot: '#f85149' },
    absent: { label: 'Ausente', sub: 'Sin registro', dot: '#6e7681' },
  };

  if (historyRows.length > 0) {
    const rows = historyRows.slice().reverse().map(row => {
      const sl = SLOTS.find(s => s.slot === row.slot);
      const sm = STATUS_MAP[row.cat] || STATUS_MAP.absent;
      const time = sl ? `${sl.start} – ${sl.end} UTC-5` : '—';
      return `<tr style="transition:background .12s;" onmouseover="this.style.background='var(--bg-hover)'" onmouseout="this.style.background=''">
        <td style="padding:.5rem .85rem;white-space:nowrap;font-size:.86rem;">${row.date}</td>
        <td style="padding:.5rem .85rem;">
          <span style="font-weight:700;font-size:.9rem;color:var(--text-primary);">Slot ${row.slot}</span>
          <br><span style="font-size:.78rem;color:var(--text-muted);">${time}</span>
        </td>
        <td style="padding:.5rem .85rem;">
          <div style="display:flex;align-items:center;gap:6px;">
            <span style="width:7px;height:7px;border-radius:50%;flex-shrink:0;background:${sm.dot};display:inline-block;box-shadow:0 0 4px ${sm.dot}88;"></span>
            <div>
              <span style="font-size:.86rem;font-weight:600;color:var(--text-primary);">${sm.label}</span>
              <br><span style="font-size:.75rem;color:var(--text-muted);">${sm.sub}</span>
            </div>
          </div>
        </td>
      </tr>`;
    }).join('');

    html += `
    <div style="margin-top:1.4rem;font-size:.78rem;font-weight:600;text-transform:uppercase;letter-spacing:.08em;color:var(--text-muted);margin-bottom:.4rem;">Historial de participación</div>
    <div class="card" style="overflow:hidden;">
      <div style="overflow-x:auto;">
        <table style="margin:0;border:none;border-collapse:collapse;width:100%;">
          <thead>
            <tr style="border-bottom:1px solid var(--border);">
              <th style="padding:.5rem .85rem;font-size:.74rem;text-transform:uppercase;letter-spacing:.06em;color:var(--text-muted);font-weight:600;text-align:left;">Fecha</th>
              <th style="padding:.5rem .85rem;font-size:.74rem;text-transform:uppercase;letter-spacing:.06em;color:var(--text-muted);font-weight:600;text-align:left;">Slot · Horario</th>
              <th style="padding:.5rem .85rem;font-size:.74rem;text-transform:uppercase;letter-spacing:.06em;color:var(--text-muted);font-weight:600;text-align:left;">Estado</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </div>`;
  } else {
    html += `<p style="color:var(--text-secondary);margin-top:1.2rem;font-size:.9rem;">Sin historial de eventos registrado.</p>`;
  }

  return {
    html,
    mount() {
      if (!hasSlots) return;
      const el = document.getElementById('chart-da-slots');
      if (!el) return;
      const ctx = el.getContext('2d');
      const getC = (v, fb) => getComputedStyle(document.documentElement).getPropertyValue(v).trim() || fb;

      new Chart(ctx, {
        type: 'bar',
        data: {
          labels: SLOTS.map(s => [`Slot ${s.slot}`, `${s.start} – ${s.end}`]),
          datasets: [
            { label: 'Team A · Confirmado', data: slotData.map(s => s.a), backgroundColor: 'rgba(63,185,80,0.88)', stack: 'st', borderSkipped: false },
            { label: 'Team B · Confirmado', data: slotData.map(s => s.bConf), backgroundColor: 'rgba(88,166,255,0.88)', stack: 'st', borderSkipped: false },
            { label: 'Team B · Sin confirmar', data: slotData.map(s => s.bUnconf), backgroundColor: 'rgba(227,160,48,0.78)', stack: 'st', borderSkipped: false },
            { label: 'No Show', data: slotData.map(s => s.noShow), backgroundColor: 'rgba(248,81,73,0.78)', stack: 'st', borderSkipped: false },
          ]
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          animation: { duration: 500, easing: 'easeOutQuart' },
          plugins: {
            legend: {
              position: 'top',
              labels: { boxWidth: 9, boxHeight: 9, usePointStyle: true, pointStyle: 'circle', color: getC('--text-secondary', '#8b949e'), padding: 16, font: { size: 11 } }
            },
            tooltip: {
              backgroundColor: 'rgba(10,12,18,0.97)', titleColor: '#e6edf3', bodyColor: '#8b949e',
              borderColor: 'rgba(99,110,123,0.35)', borderWidth: 1, padding: 12, cornerRadius: 10,
              callbacks: {
                title: items => {
                  const s = SLOTS[items[0].dataIndex];
                  return `Slot ${s.slot}   ·   ${s.start} – ${s.end} UTC-5`;
                },
                label: c => c.raw > 0 ? `  ${c.dataset.label}: ${c.raw} vez${c.raw !== 1 ? 'es' : ''}` : null,
                filter: item => item.raw > 0
              }
            }
          },
          scales: {
            x: {
              stacked: true,
              grid: { display: false }, border: { display: false },
              ticks: {
                color: getC('--text-muted', '#6e7681'), font: { size: 10 }, maxRotation: 0,
                callback(val, i) {
                  const s = SLOTS[i];
                  return [`Slot ${s.slot}`, `${s.start}`];
                }
              }
            },
            y: {
              stacked: true, beginAtZero: true,
              grid: { color: getC('--border', '#30363d') }, border: { display: false },
              ticks: { color: getC('--text-muted', '#6e7681'), stepSize: 1, callback: v => Number.isInteger(v) ? v : '' }
            }
          }
        }
      });
    }
  };
}

// ─── VIEWS ───────────────────────────────────────────────────────────────────


async function renderWarView(container, name, month, growth, warDailyData, telegram, warsData, warUidKey) {
  const sec = buildWarSection(name, month, warDailyData, growth, warsData, warUidKey);
  container.innerHTML = _profileHeader(name, growth, 'war', telegram) + sec.html;
  sec.mount();
}

async function renderHuntView(container, name, week, huntDailyData, playerHunts52, mhuntsEntry, telegram, growth, huntUidKey) {
  const sec = buildHuntSection(name, week, huntDailyData, playerHunts52, huntUidKey, mhuntsEntry);
  container.innerHTML = _profileHeader(name, growth, 'hunt', telegram) + sec.html;
  sec.mount();
}

async function renderAllHistoryView(container, name, growth, playerHunts52, mhuntsEntry, festivalData, telegram) {
  const sec = buildAllHistorySection(name, growth, playerHunts52, mhuntsEntry, festivalData);
  container.innerHTML = _profileHeader(name, growth, 'all', telegram) + sec.html;
  sec.mount();
}

async function renderMemberView(container, name, growth, warDailyData, huntDailyData, playerHunts52, mhuntsEntry, festivalData, telegram, warsData, warUidKey, huntUidKey, daEvents) {
  let nameChangesHtml = '';
