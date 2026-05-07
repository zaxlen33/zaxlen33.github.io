document.addEventListener('DOMContentLoaded', () => {
  if (window.location.pathname.split('/').pop() !== 'tracker.html') return;
  const checkI18n = setInterval(() => {
    if (window.i18n && Object.keys(window.i18n.data).length > 0) {
      clearInterval(checkI18n);
      initTracker();
    }
  }, 50);
});

async function initTracker() {
  const container = document.getElementById('tracker-container');
  if (!container) return;

  try {
    const resp = await fetch('./data/history.json?v=' + Date.now());
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const data = await resp.json();

    // Cutoff: changes older than 180 days are deprioritized (not deleted)
    const RECENT_DAYS = 180;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - RECENT_DAYS);
    const cutoffStr = cutoff.toISOString().slice(0, 10); // 'YYYY-MM-DD'

    const recentChanges = [];
    const olderChanges  = [];

    data.members.forEach(m => {
      const uid = m.uid || 'UE-????';
      const curName = m.name;
      let curMight = 0, curKills = 0;
      if (m.snapshots && m.snapshots.length > 0) {
        curMight = m.snapshots[m.snapshots.length - 1].might || 0;
        curKills = m.snapshots[m.snapshots.length - 1].kills || 0;
      }

      if (m.name_history && m.name_history.length > 0) {
        m.name_history.forEach(nh => {
          if (nh.name && nh.until) {
            const entry = {
              uid, oldName: nh.name, currentName: curName,
              until: nh.until, might: curMight, kills: curKills
            };
            if (nh.until >= cutoffStr) {
              recentChanges.push(entry);
            } else {
              olderChanges.push(entry);
            }
          }
        });
      }
    });

    const allChanges = [...recentChanges, ...olderChanges];

    if (allChanges.length === 0) {
      container.innerHTML = `<div class="card"><div class="empty-state" style="padding:3rem;"><p>${t('no_tracker_data')}</p></div></div>`;
      return;
    }

    /* ─── Helpers ────────────────────────────────────────── */

    function buildMonthGroups(changes) {
      const grouped = {};
      changes.forEach(c => {
        const monthKey = c.until.substring(0, 7);
        if (!grouped[monthKey]) grouped[monthKey] = [];
        grouped[monthKey].push(c);
      });
      return grouped;
    }

    function renderGroups(grouped) {
      let html = '';
      Object.keys(grouped).sort().reverse().forEach(monthKey => {
        const parts = monthKey.split('-');
        const mName = t('month_' + parseInt(parts[1], 10));
        const items = grouped[monthKey];

        html += `
          <div class="month-card">
            <div class="month-header"
              onclick="this.nextElementSibling.style.display = this.nextElementSibling.style.display === 'none' ? 'block' : 'none'">
              <span>🗓️ ${mName} ${parts[0]}</span>
              <span class="badge-count">${items.length} ${t('changes_count')}</span>
            </div>
            <div class="card table-wrapper" style="margin-top:0.5rem; display:block; border:none; padding:0;">
              <table style="border:none;">
                <thead>
                  <tr>
                    <th style="width:110px;">UID</th>
                    <th>${t('old_name_new_name')}</th>
                    <th class="right">${t('until_date')}</th>
                    <th class="right">${t('current_might')}</th>
                    <th class="right">${t('current_kills')}</th>
                  </tr>
                </thead>
                <tbody>
                  ${items.map(item => `
                    <tr>
                      <td data-label="UID"><span class="uid-badge">🔐 ${item.uid}</span></td>
                      <td data-label="${t('old_name_new_name')}">
                        <span style="color:var(--text-secondary);text-decoration:line-through;font-size:0.9rem;">${item.oldName}</span>
                        <strong style="color:var(--text-primary);margin-left:8px;display:inline-block;">➔ ${item.currentName}</strong>
                      </td>
                      <td class="right mono" style="color:var(--text-secondary)">${item.until}</td>
                      <td class="right mono font-number">${fmtCompact(item.might)}</td>
                      <td class="right mono font-number">${fmtCompact(item.kills)}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>`;
      });
      return html;
    }

    /* ─── Render ─────────────────────────────────────────── */

    let html = '';

    // Recent changes (≤180 days) — rendered at the top, expanded by default
    if (recentChanges.length > 0) {
      recentChanges.sort((a, b) => b.until.localeCompare(a.until));
      html += renderGroups(buildMonthGroups(recentChanges));
    }

    // Older changes (>180 days) — collapsed in a disclosure block
    if (olderChanges.length > 0) {
      olderChanges.sort((a, b) => b.until.localeCompare(a.until));
      html += `
        <details class="fs-archive-section" style="margin-top:1.5rem;">
          <summary class="fs-archive-summary">
            <span class="fs-archive-icon" aria-hidden="true">🗃️</span>
            <span>${t('tracker_archive_title')} <span class="fs-archive-count">(${olderChanges.length})</span></span>
            <span class="fs-archive-hint">${t('fs_archive_hint')}</span>
          </summary>
          <div class="fs-archive-body">
            ${renderGroups(buildMonthGroups(olderChanges))}
          </div>
        </details>`;
    }

    if (!html) {
      html = `<div class="card"><div class="empty-state" style="padding:3rem;"><p>${t('no_tracker_data')}</p></div></div>`;
    }

    container.innerHTML = html;

  } catch (err) {
    container.innerHTML = `<div class="error-state">⚠️ ${t('error_loading')}: ${err.message}</div>`;
  }
}

// Re-render when language changes
window.addEventListener('languageChanged', () => {
  if (window.location.pathname.split('/').pop() === 'tracker.html') initTracker();
});
