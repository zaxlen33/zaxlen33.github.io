// Render only the stats bar on the index page (not the full dashboard div)
document.addEventListener('DOMContentLoaded', () => {
  // Wait for i18n + app.js to be ready
  window.addEventListener('load', initIndexStats);
  // Also attempt immediately in case scripts already ran
  if (document.readyState === 'complete') initIndexStats();

  // Re-render stats when language changes
  window.addEventListener('languageChanged', () => {
    const el = document.getElementById('dashboard-stats');
    if (el) {
      el.dataset.loaded = ''; 
      initIndexStats();
    }
  });
});

async function initIndexStats() {
  const el = document.getElementById('dashboard-stats');
  if (!el || el.dataset.loaded) return;
  el.dataset.loaded = 'true';
  try {
    const [wars, hunts, history, weekly] = await Promise.allSettled([
      loadJSON('wars.json'), loadJSON('hunts.json'),
      loadJSON('history.json'), loadJSON('weekly.json'),
    ]);
    const warsData    = wars.status    === 'fulfilled' ? wars.value    : [];
    const huntsData   = hunts.status   === 'fulfilled' ? hunts.value   : [];
    const historyData = history.status === 'fulfilled' ? history.value : { members: [] };
    const weeklyData  = weekly.status  === 'fulfilled' ? weekly.value  : [];
    const latestWeek  = weeklyData.length ? weeklyData[weeklyData.length - 1] : null;
    const memberCount = historyData.members ? historyData.members.length : 0;

    el.innerHTML = `
      <div class="stat-card blue">
        <div class="stat-icon">🏰</div>
        <div class="stat-value">${fmtNum(warsData.length)}</div>
        <div class="stat-label" data-i18n="war_reports">${t('war_reports')}</div>
      </div>
      <div class="stat-card green">
        <div class="stat-icon">🦅</div>
        <div class="stat-value">${huntsData.length}</div>
        <div class="stat-label" data-i18n="hunt_reports">${t('hunt_reports')}</div>
      </div>
      <div class="stat-card purple">
        <div class="stat-icon">👥</div>
        <div class="stat-value">${memberCount}</div>
        <div class="stat-label" data-i18n="tracked_members">${t('tracked_members')}</div>
      </div>
      <div class="stat-card orange">
        <div class="stat-icon">⭐</div>
        <div class="stat-value">${latestWeek ? fmtCompact(latestWeek.total_power) : '—'}</div>
        <div class="stat-label" data-i18n="guild_power">${t('guild_power')}</div>
      </div>
      <div class="stat-card yellow">
        <div class="stat-icon">⚔️</div>
        <div class="stat-value">${latestWeek ? fmtCompact(latestWeek.total_kills) : '—'}</div>
        <div class="stat-label" data-i18n="guild_kills">${t('guild_kills')}</div>
      </div>`;
  } catch (e) {
    el.innerHTML = '';
  }
}
