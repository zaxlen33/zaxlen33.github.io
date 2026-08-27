/**
 * UE Guild Dashboard — Router + DOMContentLoaded boot (i18n wait, languageChanged/hashchange)
 * Auto-split from the original 1492-line core/app.js — globals preserved (init*, render*).
 * Requires: app_common.js (for loadJSON, fmt*, setLoading, rankBadge, DATA_BASE, _getThemeColor,
 *                               updateChartDefaults, getHashParam, filterTable, setActiveNav).
 */


function route() {
  initMobileMenu();
  setActiveNav();

  const page = window.location.pathname.split('/').pop() || 'index.html';

  if (page === 'index.html' || page === '') initIndex();
  else if (page === 'war.html')              initWar();
  else if (page === 'hunt.html')             initHunt();
  else if (page === 'history.html')          initHistory();
  else if (page === 'members.html')          initMembers();
  
  window.scrollTo(0, 0);
}

document.addEventListener('DOMContentLoaded', () => {
  // Wait for i18n to be ready before first render
  const checkI18n = setInterval(() => {
    if (window.i18n && Object.keys(window.i18n.data).length > 0) {
      clearInterval(checkI18n);
      route();
    }
  }, 50);

  // Re-render when language changes
  window.addEventListener('languageChanged', () => route());
  // Handle back/forward and anchor navigation
  window.addEventListener('hashchange', () => route());
});

// ══════════════════════════════════════════════════════════
