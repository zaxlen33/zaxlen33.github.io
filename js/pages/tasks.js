async function initTasks() {
  const container = document.getElementById('tasks-container');
  if (!container) return;

  const loadingMsg = typeof t === 'function' ? t('loading_missions') : 'Loading missions…';
  setLoading(container, loadingMsg);

  try {
    const tasks = await loadJSON('tasks.json');
    
    const t200 = tasks['200_percent_bonus_missions'] || [];
    const t120 = tasks['120_percent_bonus_missions'] || [];
    
    const label200 = typeof t === 'function' ? t('bonus_missions_200') : '200% Bonus Missions';
    const label120 = typeof t === 'function' ? t('bonus_missions_120') : '120% Bonus Missions';
    const labelTotal = typeof t === 'function' ? t('total_missions_tracked') : 'Total Missions Tracked';

    const title200 = typeof t === 'function' ? t('bonus_missions_200_title') : '🔥 200% Bonus Missions';
    const title120 = typeof t === 'function' ? t('bonus_missions_120_title') : '🌟 120% Bonus Missions';

    container.innerHTML = `
      <div class="stats-grid" style="margin-bottom:1.5rem;">
        <div class="stat-card orange">
          <div class="stat-icon">🔥</div>
          <div class="stat-value">${t200.length}</div>
          <div class="stat-label">${label200}</div>
        </div>
        <div class="stat-card blue">
          <div class="stat-icon">🌟</div>
          <div class="stat-value">${t120.length}</div>
          <div class="stat-label">${label120}</div>
        </div>
        <div class="stat-card green">
          <div class="stat-icon">🎯</div>
          <div class="stat-value">${t200.length + t120.length}</div>
          <div class="stat-label">${labelTotal}</div>
        </div>
      </div>
      
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:1rem;">
        ${renderTaskTable(title200, t200, 'orange')}
        ${renderTaskTable(title120, t120, 'blue')}
      </div>
    `;
  } catch (err) {
    setError(container, 'Could not load tasks.json. ' + err.message);
  }
}

function renderTaskTable(title, tasksList, colorClass) {
  if (!tasksList.length) {
    const emptyMsg = typeof t === 'function' ? t('missions_tier_empty') : 'No missions available in this tier.';
    return `
      <div class="card">
        <div class="card-header"><h2>${title}</h2></div>
        <div class="empty-state" style="padding:2rem;"><p>${emptyMsg}</p></div>
      </div>
    `;
  }
  
  const thPoints = typeof t === 'function' ? t('points') : 'Points';
  const thMission = typeof t === 'function' ? t('mission') : 'Mission';
  const thQtyTime = typeof t === 'function' ? t('qty_time_limit') : 'Qty / Time Limit';

  return `
    <div class="card" style="border-top:3px solid var(--accent-${colorClass});">
      <div class="card-header">
        <h2>${title}</h2>
        <span class="badge-count">${tasksList.length}</span>
      </div>
      <div class="table-wrapper">
        <table style="font-size:0.9rem;">
          <thead>
            <tr>
              <th class="right" style="width:70px;">${thPoints}</th>
              <th>${thMission}</th>
              <th>${thQtyTime}</th>
            </tr>
          </thead>
          <tbody>
            ${tasksList.map(t => {
              const displayName = typeof tMission === 'function' ? tMission(t.mission) : t.mission;
              return `
                <tr style="transition:background 0.15s;" onmouseover="this.style.background='var(--bg-hover)'" onmouseout="this.style.background=''">
                  <td class="right mono" style="font-weight:700;color:var(--accent-${colorClass});font-size:0.95rem;">${t.required_points}</td>
                  <td style="font-weight:600;color:var(--text-primary);">${displayName}</td>
                  <td>
                    <div style="color:var(--text-secondary);font-weight:500;">${t.quantity}</div>
                    <div style="color:var(--text-muted);font-size:0.8rem;margin-top:2px;">⏳ ${t.time_limit}</div>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

document.addEventListener('DOMContentLoaded', () => {
  const page = window.location.pathname.split('/').pop();
  if (page === 'tasks.html') {
    initTasks();
  }
});

// Re-render when language changes
window.addEventListener('languageChanged', () => {
  const page = window.location.pathname.split('/').pop();
  if (page === 'tasks.html') {
    initTasks();
  }
});

