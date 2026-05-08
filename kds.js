// kds.js - Kingdom & Battle Reports Viewer (English)
let kingdomsData = null;
let currentKingdomIndex = 0;
let allKingdoms = [];

// DOM Elements
const prevBtn = document.getElementById('prevKingdomBtn');
const nextBtn = document.getElementById('nextKingdomBtn');
const goBtn = document.getElementById('goKingdomBtn');
const kingdomInput = document.getElementById('kingdomInput');
const kingdomCounterSpan = document.getElementById('kingdomCounter');
const statsArea = document.getElementById('kingdomStatsArea');
const battlesContainer = document.getElementById('battlesListContainer');
const battleCountBadge = document.getElementById('battleCountBadge');
const metaInfoSpan = document.getElementById('metaInfo');
const scrapedDateSpan = document.getElementById('scrapedDate');
const rangeInfoSpan = document.getElementById('rangeInfo');

// Render kingdom stats
function renderKingdomStats(kingdom) {
    if (!kingdom) return '<div class="skeleton-loader">Kingdom not available</div>';
    const stats = kingdom.stats || {};
    const carto = stats["View on Cartography"] || null;
    
    return `
        <div class="stats-grid">
            <div class="stat-item">
                <div class="stat-label"><i class="fas fa-flag-checkered"></i> KINGDOM</div>
                <div class="stat-value">${kingdom.kingdom_name} (ID ${kingdom.kingdom_id})</div>
            </div>
            <div class="stat-item">
                <div class="stat-label"><i class="fas fa-chart-simple"></i> RALLIES (LAST WEEK)</div>
                <div class="stat-value">${stats["Rallies last week"] || '—'}</div>
            </div>
            <div class="stat-item">
                <div class="stat-label"><i class="fas fa-skull"></i> TROOPS LOST</div>
                <div class="stat-value">${stats["Troops loss last week"] || '—'}</div>
            </div>
            <div class="stat-item">
                <div class="stat-label"><i class="fas fa-tower-broadcast"></i> MIGHT LOST</div>
                <div class="stat-value">${stats["Might loss last week"] || '—'}</div>
            </div>
            ${carto ? `<div class="stat-item">
                <div class="stat-label"><i class="fas fa-map"></i> CARTOGRAPHY</div>
                <div class="stat-value"><a href="${carto.href || '#'}" target="_blank" rel="noopener noreferrer" class="cartography-link"><i class="fas fa-external-link-alt"></i> ${carto.text || 'View Map'}</a></div>
            </div>` : ''}
        </div>
    `;
}

// Render battles table
function renderBattles(kingdom) {
    const battles = kingdom?.battles || [];
    if (!battles.length) {
        return `<div class="skeleton-loader" style="background: none;"><i class="fas fa-ban"></i> No combat reports recorded for this kingdom.</div>`;
    }
    
    let tableHtml = `
        <table class="battle-table">
            <thead>
                <tr><th>Date/Time</th><th>Outcome</th><th>Might Loss</th><th>Troops Loss</th><th>Attacker (Guild)</th><th>Defender (Guild)</th><th>Battle ID</th></tr>
            </thead>
            <tbody>
    `;
    
    battles.forEach(b => {
        const outcomeText = b.outcome === 'burned' ? '🔥 Burned' : (b.outcome || '—');
        const attackerText = `${b.attacker?.name || '?'} <span class="guild-name">[${b.attacker?.guild || '?'}]</span>`;
        const defenderText = `${b.defender?.name || '?'} <span class="guild-name">[${b.defender?.guild || '?'}]</span>`;
        tableHtml += `
            <tr>
                <td>${b.timestamp || '—'}</td>
                <td><span class="outcome-badge">${outcomeText}</span></td>
                <td>${b.might_loss || '—'}</td>
                <td>${b.troops_loss || '—'}</td>
                <td>${attackerText}</td>
                <td>${defenderText}</td>
                <td style="font-family: monospace;">${b.battle_id || '—'}</td>
            </tr>
        `;
    });
    tableHtml += `</tbody></table>`;
    return tableHtml;
}

// Update whole UI
function updateUI() {
    if (!allKingdoms.length) return;
    const kingdom = allKingdoms[currentKingdomIndex];
    if (!kingdom) return;
    
    kingdomCounterSpan.innerHTML = `<i class="fas fa-crown"></i> Kingdom ${currentKingdomIndex+1} of ${allKingdoms.length} · ID ${kingdom.kingdom_id}`;
    
    statsArea.innerHTML = renderKingdomStats(kingdom);
    const battlesHtml = renderBattles(kingdom);
    battlesContainer.innerHTML = battlesHtml;
    battleCountBadge.innerText = `${kingdom.battles?.length || 0} battles`;
    
    prevBtn.disabled = (currentKingdomIndex === 0);
    nextBtn.disabled = (currentKingdomIndex === allKingdoms.length - 1);
    prevBtn.style.opacity = prevBtn.disabled ? '0.5' : '1';
    nextBtn.style.opacity = nextBtn.disabled ? '0.5' : '1';
}

// Go to kingdom by ID
function goToKingdomById(id) {
    const targetId = Number(id);
    if (isNaN(targetId)) {
        alert("Please enter a valid kingdom ID (e.g. 1400)");
        return false;
    }
    const foundIndex = allKingdoms.findIndex(k => k.kingdom_id === targetId);
    if (foundIndex === -1) {
        alert(`Kingdom with ID ${targetId} not found in data.`);
        return false;
    }
    currentKingdomIndex = foundIndex;
    updateUI();
    return true;
}

// Load data from kingdoms.json
async function loadData() {
    try {
        metaInfoSpan.innerHTML = '<i class="fas fa-spinner fa-pulse"></i> Loading reports...';
        const response = await fetch('kingdoms.json');
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        kingdomsData = data;
        allKingdoms = data.kingdoms || [];
        
        if (!allKingdoms.length) {
            statsArea.innerHTML = '<div class="skeleton-loader">⚠️ No kingdoms available in JSON file.</div>';
            battlesContainer.innerHTML = '<div class="skeleton-loader">No data</div>';
            return;
        }
        
        if (data.scraped_at) scrapedDateSpan.innerText = new Date(data.scraped_at).toLocaleString();
        if (data.range) rangeInfoSpan.innerText = data.range;
        metaInfoSpan.innerHTML = `<i class="fas fa-database"></i> ${data.total_success || 0} active kingdoms · Scraped: ${data.scraped_at ? data.scraped_at.split('T')[0] : '—'}`;
        
        currentKingdomIndex = 0;
        updateUI();
    } catch (error) {
        console.error("Error loading JSON:", error);
        statsArea.innerHTML = `<div class="skeleton-loader" style="color:#ff9f7c;"><i class="fas fa-exclamation-triangle"></i> Failed to load kingdoms.json. Make sure the file exists and is valid.</div>`;
        battlesContainer.innerHTML = '<div class="skeleton-loader">Unable to fetch battle reports.</div>';
        metaInfoSpan.innerHTML = 'Data connection error';
    }
}

// Event listeners
prevBtn.addEventListener('click', () => {
    if (currentKingdomIndex > 0) {
        currentKingdomIndex--;
        updateUI();
    }
});
nextBtn.addEventListener('click', () => {
    if (currentKingdomIndex < allKingdoms.length - 1) {
        currentKingdomIndex++;
        updateUI();
    }
});
goBtn.addEventListener('click', () => {
    const rawId = kingdomInput.value.trim();
    if (rawId === "") return;
    goToKingdomById(rawId);
});
kingdomInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') goBtn.click();
});

// Start app
loadData();
