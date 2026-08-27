/**
 * Player page: formatters, chart factories, card/header helpers
 * Requires: Utils (Utils.paths, Utils.fmt, Utils.fetchJSON, Utils.destroyChart)
 * Auto-split from the original large monolithic JS file (globals preserved).
 */

// website/js/player.js - Player Detail Dashboard
// Views driven by ?view=war|hunt|all|member&id=NAME[&month=YYYY-MM][&week=WEEK_ID]


// ─── Injected styles ─────────────────────────────────────────────────────────
const _style = document.createElement('style');
_style.textContent = `
  .player-tab{padding:.5rem 1.1rem;border:1.5px solid var(--border);background:var(--bg-card);color:var(--text-secondary);border-radius:8px;cursor:pointer;font-size:.88rem;font-weight:600;transition:all .2s;}
  .player-tab:hover{border-color:var(--accent);color:var(--accent);}
  .player-tab.active{background:var(--accent);border-color:var(--accent);color:var(--bg-primary);}
  .chart-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:1.5rem;margin-bottom:1.5rem;}
  .chart-box{position:relative;height:270px;}
  .profile-header{display:flex;align-items:center;gap:1rem;margin-bottom:1.5rem;background:var(--bg-card);padding:1.4rem;border-radius:12px;border:1px solid var(--border);}
  .profile-avatar{width:68px;height:68px;border-radius:50%;background:var(--accent);display:flex;align-items:center;justify-content:center;font-size:1.9rem;font-weight:700;color:var(--bg-primary);flex-shrink:0;}
  .profile-info h1{margin:0 0 4px;font-size:1.7rem;color:var(--text-primary); display:flex; align-items:center;}
  .profile-info p{margin:0;color:var(--text-secondary);font-family:var(--font-mono);font-size:.88rem;}
  .section-label{color:var(--text-secondary);margin:1.5rem 0 .6rem;font-size:.8rem;text-transform:uppercase;letter-spacing:1px;font-weight:600;}
  @media(max-width:520px){ 
    .chart-grid{grid-template-columns:1fr;} 
    .ph-top, .ph-bottom { justify-content:center !important; } 
    .profile-info { text-align:center; }
  }
`;
document.head.appendChild(_style);

// ─── Chart helpers ───────────────────────────────────────────────────────────

// Shared tooltip formatter
function _fmtVal(v) {
  if (v >= 1e9) return (v / 1e9).toFixed(2) + 'B';
  if (v >= 1e6) return (v / 1e6).toFixed(2) + 'M';
  if (v >= 1e3) return (v / 1e3).toFixed(1) + 'k';
  return v;
}

// Shared tick formatter (shorter)
function _tickFmtShort(v) {
  if (v >= 1e9) return (v / 1e9).toFixed(1) + 'B';
  if (v >= 1e6) return (v / 1e6).toFixed(1) + 'M';
  if (v >= 1e3) return (v / 1e3).toFixed(0) + 'k';
  return v;
}

// Premium tooltip config shared between chart types
function _tooltipCfg(extra) {
  return {
    mode: 'index', intersect: false,
    backgroundColor: 'rgba(10,12,18,0.97)',
    titleColor: '#e6edf3',
    bodyColor: '#8b949e',
    borderColor: 'rgba(99,110,123,0.4)',
    borderWidth: 1,
    padding: 12,
    cornerRadius: 10,
    titleFont: { size: 12, weight: '600' },
    bodyFont: { size: 12 },
    displayColors: true,
    boxWidth: 8,
    boxHeight: 8,
    usePointStyle: true,
    ...(extra || {})
  };
}

function _lineChart(id, label, labels, data, cssVar, fallbackColor, dashed = false) {
  const el = document.getElementById(id);
  if (!el) return;
  const ctx = el.getContext('2d');

  const color = _getThemeColor(cssVar, fallbackColor);

  // Rich two-stop gradient: vivid at top, fully transparent at bottom
  const g = ctx.createLinearGradient(0, 0, 0, 260);
  g.addColorStop(0, color + '25');
  g.addColorStop(0.5, color + '08');
  g.addColorStop(1, color + '00');

  new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label, data,
        borderColor: color,
        backgroundColor: g,
        borderWidth: 2.5,
        fill: true,
        tension: 0.4,
        // Points: hidden normally, visible on hover
        pointBackgroundColor: color,
        pointBorderColor: 'rgba(10,12,18,0.9)',
        pointBorderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 6,
        pointHoverBackgroundColor: color,
        pointHoverBorderColor: '#fff',
        pointHoverBorderWidth: 2,
        _cssBorderVar: cssVar,
        _cssBgVar: cssVar,
        ...(dashed ? { borderDash: [6, 4] } : {})
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 600, easing: 'easeOutQuart' },
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { display: false },
        tooltip: {
          ..._tooltipCfg(),
          callbacks: {
            title: items => items[0]?.label || '',
            label: c => {
              const v = c.raw;
              return `  ${label}: ${_fmtVal(v)}`;
            }
          }
        }
      },
      scales: {
        x: {
          grid: { display: false },
          border: { display: false },
          ticks: {
            maxRotation: 40,
            color: _getThemeColor('--text-muted', '#6e7681'),
            font: { size: 11 }
          }
        },
        y: {
          beginAtZero: false,
          grid: {
            color: _getThemeColor('--border', '#30363d'),
            lineWidth: 1
          },
          border: { display: false, dash: [4, 4] },
          ticks: {
            color: _getThemeColor('--text-muted', '#6e7681'),
            font: { size: 11 },
            padding: 8,
            callback: v => _tickFmtShort(v)
          }
        }
      }
    }
  });
}

function _barChart(id, labels, datasets) {
  const el = document.getElementById(id);
  if (!el) return;
  const ctx = el.getContext('2d');

  new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: datasets.map(d => {
        const bgVar = d._cssBgVar;
        const resolvedBg = bgVar ? _getThemeColor(bgVar, d.backgroundColor) : d.backgroundColor;
        return {
          ...d,
          backgroundColor: resolvedBg,
          borderRadius: { topLeft: 6, topRight: 6 },
          borderSkipped: false,
          borderWidth: 0,
          hoverBorderWidth: 0,
        };
      })
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 500, easing: 'easeOutQuart' },
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: {
          position: 'top',
          labels: {
            boxWidth: 10,
            boxHeight: 10,
            usePointStyle: true,
            pointStyle: 'rectRounded',
            color: _getThemeColor('--text-secondary', '#8b949e'),
            padding: 16,
            font: { size: 12 }
          }
        },
        tooltip: {
          ..._tooltipCfg(),
          callbacks: {
            label: c => `  ${c.dataset.label}: ${_fmtVal(c.raw)}`
          }
        }
      },
      scales: {
        x: {
          grid: { display: false },
          border: { display: false },
          ticks: { color: _getThemeColor('--text-muted', '#6e7681'), font: { size: 11 } }
        },
        y: {
          beginAtZero: true,
          grid: { color: _getThemeColor('--border', '#30363d'), lineWidth: 1 },
          border: { display: false },
          ticks: {
            color: _getThemeColor('--text-muted', '#6e7681'),
            font: { size: 11 },
            padding: 8,
            callback: v => _tickFmtShort(v)
          }
        }
      }
    }
  });
}

// ─── DOM builders ────────────────────────────────────────────────────────────

function _card(title, canvasId) {
  return `<div class="card"><div class="card-header"><h2>${title}</h2></div>
    <div class="card-body"><div class="chart-box"><canvas id="${canvasId}"></canvas></div></div></div>`;
}
function _noData(title, msg) {
  const message = msg || t('not_enough_data');
  return `<div class="card"><div class="card-header"><h2>${title}</h2></div>
    <div class="card-body"><p style="color:var(--text-muted);text-align:center;padding:2rem;">${message}</p></div></div>`;
}

function _quotaBadge(killsDiff) {
  const met = killsDiff >= 1_000_000;
  const pct = Math.min(100, Math.round(killsDiff / 10_000));
  const col = met ? 'var(--accent-green)' : pct >= 60 ? 'var(--accent-yellow)' : 'var(--accent-red)';
  return `<div class="card" style="border-top:3px solid ${col};margin-bottom:1.5rem;">
    <div class="card-header"><h2>⚔️ ${t('quota_title')}</h2></div>
    <div class="card-body" style="display:flex;align-items:center;gap:1.2rem;flex-wrap:wrap;">
      <div style="font-size:2.2rem;">${met ? '✅' : '❌'}</div>
      <div style="flex:1;">
        <div style="font-weight:700;font-size:1rem;color:${col};">${met ? t('quota_met') : t('quota_not_met')}</div>
        <div style="color:var(--text-secondary);margin-top:3px;">${fmtCompact(killsDiff)} / 1M ${t('kills_this_month')}</div>
        <div style="margin-top:8px;">
          <div class="progress-bar" style="width:100%;max-width:280px;"><div class="progress-fill" style="width:${pct}%;background:${col};"></div></div>
          <span style="font-family:var(--font-mono);font-size:.83rem;color:${col};">${pct}%</span>
        </div>
      </div>
    </div>
  </div>`;
}

function _statCards(cards) {
  return `<div class="stats-grid" style="margin-bottom:1.5rem;">${cards.map(c => `
    <div class="stat-card ${c.color || 'blue'}">
      <div class="stat-icon">${c.icon}</div>
      <div class="stat-value">${c.value}</div>
      <div class="stat-label">${c.label}</div>
      ${c.delta !== undefined ? `<div class="stat-delta ${c.delta > 0 ? 'positive' : c.delta < 0 ? 'negative' : 'neutral'}">${fmtDelta(c.delta, false)}${c.deltaLabel ? `<span style="opacity:0.5; margin-left:6px; font-weight:500;">• ${c.deltaLabel}</span>` : ''}</div>` : ''}
    </div>`).join('')}</div>`;
}
