/**
 * Index page module — initIndex()
 * (Extracted from core/app.js former L218-285)
 */
async function initIndex() {
  const container = document.getElementById('dashboard');
  if (!container) return;

  const targetLang = window.i18n?.currentLang;
  container.dataset.loadingLang = targetLang;

  setLoading(container, t('loading_dashboard'));

  try {
    const [wars, hunts, history, weekly] = await Promise.allSettled([
      loadJSON('wars.json'),
      loadJSON('hunts.json'),
      loadJSON('history.json'),
      loadJSON('weekly.json'),
    ]);

    const warsData    = wars.status    === 'fulfilled' ? wars.value    : [];
    const huntsData   = hunts.status   === 'fulfilled' ? hunts.value   : [];
    const historyData = history.status === 'fulfilled' ? history.value : { members: [] };
    const weeklyData  = weekly.status  === 'fulfilled' ? weekly.value  : [];

    const latestWeek  = weeklyData.length ? weeklyData[weeklyData.length - 1] : null;
    const memberCount = historyData.members ? historyData.members.length : 0;

    if (container.dataset.loadingLang !== window.i18n?.currentLang) {
      console.warn('Language changed during fetch, discarding stale render.');
      return;
    }

    container.innerHTML = `
      <div class="stats-grid">
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
          <div class="stat-value">${latestWeek ? fmtCompact(latestWeek.total_power) : '-'}</div>
          <div class="stat-label" data-i18n="guild_power">${t('guild_power')}</div>
        </div>
        <div class="stat-card yellow">
          <div class="stat-icon">⚔️</div>
          <div class="stat-value">${latestWeek ? fmtCompact(latestWeek.total_kills) : '-'}</div>
          <div class="stat-label" data-i18n="guild_kills">${t('guild_kills')}</div>
        </div>
      </div>`;

  } catch (err) {
    setError(container, 'Could not load dashboard data. ' + err.message);
  }
}
