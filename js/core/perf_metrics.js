/**
 * Performance dashboard: initDashboard() + getOrCreatePlayer — load JSONs, compute player metrics
 * Requires: perf_access.js, Utils.loadMany (wars/hunts/festival/history/members)
 * Auto-split from the original large monolithic JS file (globals preserved).
 */

  async function initDashboard() {
    const container = document.getElementById('performance-container');
    if (!container) return;

    // Show Loader
    container.innerHTML = `
      <div class="loading-state">
        <div class="spinner"></div>
        <p data-i18n="loading_data">${window.t ? window.t('loading_data') : 'Loading data…'}</p>
      </div>
    `;
    if (window.i18n) window.i18n.applyTranslations();

    try {
      const [warsData, huntsData, festivalData, historyData, membersData] = await window.Utils.loadMany([
        'wars.json','hunts.json','festival.json','history.json','members.json'
      ]);

      const currentUids = new Set();
      if (historyData && historyData.members) {
        let lastDay = historyData.last_updated;
        if (!lastDay) {
          lastDay = historyData.members.reduce((max, m) => (m.last_seen > max ? m.last_seen : max), "");
        }
        historyData.members.forEach(m => {
          if (m.uid && m.last_seen === lastDay) {
            currentUids.add(m.uid);
          }
        });
      } else if (membersData && Array.isArray(membersData)) {
        membersData.forEach(m => {
          if (m.uid) currentUids.add(m.uid);
        });
      }

      const nameToUid = new Map();
      const uidToName = new Map();

      if (historyData && historyData.members) {
        historyData.members.forEach(m => {
          if (m.uid && m.name) {
            uidToName.set(m.uid, m.name);
            nameToUid.set(m.name, m.uid);
            if (m.name_history) {
              m.name_history.forEach(nh => {
                if (nh.name) nameToUid.set(nh.name, m.uid);
              });
            }
          }
        });
      }

      if (membersData && Array.isArray(membersData)) {
        membersData.forEach(m => {
          if (m.uid && m.name) {
            uidToName.set(m.uid, m.name);
            nameToUid.set(m.name, m.uid);
          }
        });
      }

      const playerMap = new Map();

      function getOrCreatePlayer(rawName, rawUid = null) {
        let uid = rawUid;
        if (!uid) uid = nameToUid.get(rawName) || rawName;

        const displayName = uidToName.get(uid) || rawName;

        if (!playerMap.has(uid)) {
          playerMap.set(uid, {
            uid: uid,
            name: displayName,
            rank: '',
            failures: 0,
            participations: 0,
            globalFailures: 0,
            war: { participations: 0, failures: 0, totalKills: 0, totalQuota: 0, globalMet: false },
            hunt: { participations: 0, failures: 0, totalPoints: 0, totalQuota: 0, globalMet: false },
            festival: { participations: 0, failures: 0, totalScore: 0, totalQuota: 0, globalMet: false }
          });
        }
        return playerMap.get(uid);
      }

      // Pre-populate playerMap with all members currently in the daily report
      if (membersData && Array.isArray(membersData)) {
        membersData.forEach(m => {
          if (m.uid && m.name) {
            const player = getOrCreatePlayer(m.name, m.uid);
            if (m.rank && !player.rank) player.rank = m.rank;
          }
        });
      }

      // 1. Process ALL historical War reports
      warsData.forEach(report => {
        if (report.members) {
          report.members.forEach(m => {
            if (!m.name) return;
            const player = getOrCreatePlayer(m.name);
            player.participations++;
            player.war.participations++;
            player.war.totalQuota += 1000000;

            const met = m.kills_diff >= 1000000;
            if (!met) {
              player.failures++;
              player.war.failures++;
            }
            player.war.totalKills += (m.kills_diff || 0);
            if (m.rank && !player.rank) player.rank = m.rank;
          });
        }
      });

      // 2. Process ALL historical Hunt reports
      huntsData.forEach(report => {
        const minReq = report.summary?.min_required || 35;
        if (report.players) {
          report.players.forEach(p => {
            if (!p.name) return;
            const player = getOrCreatePlayer(p.name);
            player.participations++;
            player.hunt.participations++;
            player.hunt.totalQuota += minReq;

            const met = p.met_minimum === true;
            if (!met) {
              player.failures++;
              player.hunt.failures++;
            }
            player.hunt.totalPoints += (p.pts_total || 0);
            if (p.rank && !player.rank) player.rank = p.rank;
          });
        }
      });

      // 3. Process ALL historical Festival reports
      festivalData.forEach(report => {
        const minScore = report.summary?.festival_min_score || 3100;
        if (report.players) {
          report.players.forEach(f => {
            if (!f.name) return;
            const player = getOrCreatePlayer(f.name, f.uid);
            player.participations++;
            player.festival.participations++;
            player.festival.totalQuota += minScore;

            const met = f.score >= minScore;
            if (!met) {
              player.failures++;
              player.festival.failures++;
            }
            player.festival.totalScore += (f.score || 0);
          });
        }
      });

      // Calculate compensatory rates
      cachedPlayers = Array.from(playerMap.values()).filter(p => currentUids.has(p.uid));
      cachedPlayers.forEach(p => {
        p.war.globalMet = p.war.totalKills >= p.war.totalQuota;
        p.hunt.globalMet = p.hunt.totalPoints >= p.hunt.totalQuota;
        p.festival.globalMet = p.festival.totalScore >= p.festival.totalQuota;

        p.globalFailures = 0;
        if (p.war.participations > 0 && !p.war.globalMet) p.globalFailures++;
        if (p.hunt.participations > 0 && !p.hunt.globalMet) p.globalFailures++;
        if (p.festival.participations > 0 && !p.festival.globalMet) p.globalFailures++;

        p.failureRate = p.participations > 0 ? (p.failures / p.participations) : 0;
      });

      renderDashboardUI();

    } catch (err) {
      console.error(err);
      container.innerHTML = `
        <div class="error-state" style="padding: 3rem 1rem;">
          <span style="font-size: 2rem;">⚠️</span>
          <h3>${window.t ? window.t('error_loading') : 'Could not load data'}</h3>
          <p>${err.message}</p>
        </div>
      `;
    }
  }
