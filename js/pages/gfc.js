/**
 * guild-festival-calc.js
 * Guild Festival Calculator for UE Guild Dashboard
 * Inspired by imperial-lm.com/fdg
 */

(function () {
  'use strict';

  // ── League data ──────────────────────────────────────────────────────────────
  const LEAGUES = [
    { id: 'beginner',     label: 'Beginner',      attempts: 13, minGuildPts: 94000,  hasBonus: false },
    { id: 'intermediate', label: 'Intermediate',   attempts: 14, minGuildPts: 131000, hasBonus: false },
    { id: 'advanced',     label: 'Advanced',       attempts: 15, minGuildPts: 177000, hasBonus: false },
    { id: 'expert',       label: 'Expert',         attempts: 16, minGuildPts: 236000, hasBonus: false },
    { id: 'master',       label: 'Master',         attempts: 18, minGuildPts: 310000, hasBonus: true  },
  ];

  // ── Quest catalogue (fallback when tasks.json unavailable) ──────────────────
  // pts: [base, 120%, 200%]  - values sourced directly from tasks.json
  const DEFAULT_QUESTS = [
    // ─ Resources ─
    { id: 'q01',  cat: 'Resources', name: 'Collect resources',                          req: '6.3m',      time: '24h', pts: [97,  116, 194] },
    { id: 'q02',  cat: 'Resources', name: 'Collect resources',                          req: '12.5m',     time: '24h', pts: [115, 138, 230] },
    { id: 'q03',  cat: 'Resources', name: 'Collect resources',                          req: '21.9m',     time: '24h', pts: [138, 165, 276] },
    { id: 'q04',  cat: 'Resources', name: 'Spend guild coins',                          req: '250k',      time: '24h', pts: [93,  111, 186] },
    { id: 'q05',  cat: 'Resources', name: 'Spend guild coins',                          req: '500k',      time: '24h', pts: [110, 132, 220] },
    { id: 'q06',  cat: 'Resources', name: 'Spend gems',                                req: '30k',       time: '24h', pts: [148, 177, 296] },
    { id: 'q07',  cat: 'Resources', name: 'Spend gems',                                req: '60k',       time: '24h', pts: [175, 210, 350] },
    { id: 'q08',  cat: 'Resources', name: 'Spend gems',                                req: '105k',      time: '2d',  pts: [210, 252, 420] },
    { id: 'q08b', cat: 'Resources', name: 'Spend gems',                                req: '195k',      time: '3d',  pts: [253, 303, 506] },
    // ─ Tycoon ─
    { id: 'q09',  cat: 'Tycoon',    name: 'Spend lucky tokens',                        req: '80 units',  time: '24h', pts: [148, 177, 296] },
    { id: 'q10',  cat: 'Tycoon',    name: 'Spend lucky tokens',                        req: '150 units', time: '24h', pts: [175, 210, 350] },
    { id: 'q39',  cat: 'Tycoon',    name: 'Find goblin in Kingdom Treasury',           req: '6 times',   time: '24h', pts: [148, 177, 296] },
    { id: 'q40',  cat: 'Tycoon',    name: 'Find goblin in Kingdom Treasury',           req: '12 times',  time: '24h', pts: [175, 210, 350] },
    // ─ Artifacts ─
    { id: 'q11',  cat: 'Artifacts', name: 'Spend artifact coins',                      req: '5k',        time: '24h', pts: [148, 177, 296] },
    { id: 'q11b', cat: 'Artifacts', name: 'Spend artifact coins',                      req: '10k',       time: '24h', pts: [175, 210, 350] },
    { id: 'q11c', cat: 'Artifacts', name: 'Spend artifact coins',                      req: '17.5k',     time: '2d',  pts: [210, 252, 420] },
    { id: 'q12',  cat: 'Artifacts', name: 'Spend artifact coins',                      req: '32.5k',     time: '3d',  pts: [253, 303, 506] },
    { id: 'q12b', cat: 'Artifacts', name: 'Upgrade artifacts',                         req: '2 times',   time: '24h', pts: [156, 183, 312] },
    { id: 'q12c', cat: 'Artifacts', name: 'Upgrade artifacts',                         req: '3 times',   time: '24h', pts: [180, 216, 360] },
    { id: 'q12d', cat: 'Artifacts', name: 'Upgrade artifacts',                         req: '6 times',   time: '2d',  pts: [216, 259, 432] },
    { id: 'q12e', cat: 'Artifacts', name: 'Upgrade artifacts',                         req: '7 times',   time: '3d',  pts: [261, 313, 522] },
    { id: 'q12f', cat: 'Artifacts', name: 'Enhance artifacts',                         req: '1 time',    time: '24h', pts: [156, 183, 312] },
    { id: 'q12g', cat: 'Artifacts', name: 'Enhance artifacts',                         req: '2 times',   time: '24h', pts: [180, 216, 360] },
    { id: 'q12h', cat: 'Artifacts', name: 'Enhance artifacts',                         req: '4 times',   time: '2d',  pts: [216, 259, 432] },
    { id: 'q12i', cat: 'Artifacts', name: 'Enhance artifacts',                         req: '4 times',   time: '3d',  pts: [261, 313, 522] },
    // ─ Might ─
    { id: 'q13',  cat: 'Might',     name: 'Increase troop power',                      req: '1.1m',      time: '24h', pts: [123, 147, 246] },
    { id: 'q14',  cat: 'Might',     name: 'Increase troop power',                      req: '2.1m',      time: '24h', pts: [145, 174, 290] },
    { id: 'q15',  cat: 'Might',     name: 'Increase troop power',                      req: '7.3m',      time: '2d',  pts: [174, 208, 348] },
    { id: 'q16',  cat: 'Might',     name: 'Increase troop power',                      req: '8.2m',      time: '3d',  pts: [210, 252, 420] },
    { id: 'q16b', cat: 'Might',     name: 'Increase research power',                   req: '700k',      time: '24h', pts: [123, 147, 246] },
    { id: 'q18',  cat: 'Might',     name: 'Increase research power',                   req: '1.4m',      time: '24h', pts: [145, 174, 290] },
    { id: 'q20',  cat: 'Might',     name: 'Increase research power',                   req: '5.5m',      time: '2d',  pts: [174, 208, 348] },
    { id: 'q21',  cat: 'Might',     name: 'Increase research power',                   req: '6.6m',      time: '3d',  pts: [210, 252, 420] },
    { id: 'q13b', cat: 'Might',     name: 'Increase total power',                      req: '1.3m',      time: '24h', pts: [123, 147, 246] },
    { id: 'q14b', cat: 'Might',     name: 'Increase total power',                      req: '2.6m',      time: '24h', pts: [145, 174, 290] },
    { id: 'q15b', cat: 'Might',     name: 'Increase total power',                      req: '6.3m',      time: '2d',  pts: [174, 208, 348] },
    { id: 'q16c', cat: 'Might',     name: 'Increase total power',                      req: '8.5m',      time: '3d',  pts: [210, 252, 420] },
    // ─ Hunting ─
    { id: 'q22',  cat: 'Hunting',   name: 'Attack monsters',                           req: '60 times',  time: '24h', pts: [119, 142, 238] },
    { id: 'q23',  cat: 'Hunting',   name: 'Attack monsters',                           req: '120 times', time: '24h', pts: [140, 172, 280] },
    { id: 'q24',  cat: 'Hunting',   name: 'Attack monsters',                           req: '210 times', time: '24h', pts: [165, 201, 330] },
    { id: 'q25',  cat: 'Hunting',   name: 'Obtain level 5 monster gift',               req: '1 unit',    time: '24h', pts: [159, 186, 318] },
    { id: 'q26',  cat: 'Hunting',   name: 'Obtain level 5 monster gift',               req: '2 units',   time: '24h', pts: [186, 223, 372] },
    { id: 'q27',  cat: 'Hunting',   name: 'Obtain level 5 monster gift',               req: '4 units',   time: '2d',  pts: [224, 268, 448] },
    // ─ Bastions ─
    { id: 'q28',  cat: 'Bastions',  name: 'Obtain essence 19+',                        req: '4 times',   time: '24h', pts: [120, 144, 240] },
    { id: 'q29',  cat: 'Bastions',  name: 'Obtain essence 19+',                        req: '7 times',   time: '24h', pts: [144, 174, 288] },
    { id: 'q30',  cat: 'Bastions',  name: 'Win battle against Chaos Bastion (leader)', req: '6 times',   time: '24h', pts: [115, 138, 230] },
    { id: 'q31',  cat: 'Bastions',  name: 'Win battle against Chaos Bastion (leader)', req: '9 times',   time: '24h', pts: [138, 165, 276] },
    { id: 'q32',  cat: 'Bastions',  name: 'Win a battle against Chaos Bastion (as leader)', req: '3 times', time: '24h', pts: [97, 116, 194] },
    // ─ Familiars ─
    { id: 'q33',  cat: 'Familiars', name: 'Use familiar battle skills',                req: '2 times',   time: '24h', pts: [127, 152, 254] },
    { id: 'q34',  cat: 'Familiars', name: 'Use familiar battle skills',                req: '3 times',   time: '24h', pts: [150, 180, 300] },
    { id: 'q35',  cat: 'Familiars', name: 'Use familiar skills',                       req: '2 times',   time: '24h', pts: [127, 152, 254] },
    { id: 'q36',  cat: 'Familiars', name: 'Use familiar skills',                       req: '3 times',   time: '24h', pts: [150, 180, 300] },
    // ─ Heroes ─
    { id: 'qh1',  cat: 'Heroes',    name: 'Complete all Hero Trials',                  req: '90 times',  time: '24h', pts: [119, 142, 238] },
    { id: 'qh2',  cat: 'Heroes',    name: 'Complete all Hero Trials',                  req: '180 times', time: '24h', pts: [138, 168, 276] },
    // ─ Castle ─
    { id: 'qc1',  cat: 'Castle',    name: 'Obtain castle style star',                  req: '1 time',    time: '24h', pts: [180, 216, 360] },
    { id: 'qc2',  cat: 'Castle',    name: 'Obtain castle style star',                  req: '2 times',   time: '24h', pts: [216, 259, 432] },
    { id: 'qc3',  cat: 'Castle',    name: 'Obtain castle style star',                  req: '3 times',   time: '3d',  pts: [261, 313, 522] },
    // ─ Labyrinth ─
    { id: 'q37',  cat: 'Labyrinth', name: 'Fight Labyrinth Guardian',                  req: '5 times',   time: '24h', pts: [148, 180, 296] },
    { id: 'q38',  cat: 'Labyrinth', name: 'Fight Labyrinth Guardian',                  req: '9 times',   time: '24h', pts: [175, 210, 350] },
    { id: 'q41',  cat: 'Labyrinth', name: 'Find guardian in elite labyrinth',          req: '1 time',    time: '24h', pts: [185, 222, 370] },
    { id: 'q41b', cat: 'Labyrinth', name: 'Find guardian in elite labyrinth',          req: '2 times',   time: '2d',  pts: [222, 266, 444] },
    { id: 'q43',  cat: 'Labyrinth', name: 'Find guardian in elite labyrinth',          req: '3 times',   time: '3d',  pts: [275, 330, 550] },
    { id: 'q44',  cat: 'Labyrinth', name: 'Use stars',                                 req: '28k',       time: '24h', pts: [148, 177, 296] },
    { id: 'q45',  cat: 'Labyrinth', name: 'Use stars',                                 req: '55k',       time: '24h', pts: [175, 210, 350] },
    { id: 'q46',  cat: 'Labyrinth', name: 'Use stars',                                 req: '97k',       time: '2d',  pts: [210, 252, 420] },
    { id: 'q47',  cat: 'Labyrinth', name: 'Use stars',                                 req: '125k',      time: '3d',  pts: [253, 303, 506] },
    // ─ Events (Hell Event) ─
    { id: 'q48',  cat: 'Events',    name: 'Complete phase 3 of Infernal Event',        req: '2 times',   time: '24h', pts: [148, 210, 296] },
    { id: 'q49',  cat: 'Events',    name: 'Complete phase 3 of Infernal Event',        req: '3 times',   time: '24h', pts: [175, 210, 350] },
    { id: 'q50',  cat: 'Events',    name: 'Complete phase 3 of Infernal Event',        req: '6 times',   time: '2d',  pts: [210, 252, 420] },
    { id: 'q50b', cat: 'Events',    name: 'Complete phase 3 of Infernal Event',        req: '10 times',  time: '3d',  pts: [253, 303, 506] },
    { id: 'q51',  cat: 'Events',    name: 'Achieve top 10 in Infernal Event',          req: '1 time',    time: '24h', pts: [185, 222, 370] },
    { id: 'q52',  cat: 'Events',    name: 'Achieve top 10 in Infernal Event',          req: '2 times',   time: '2d',  pts: [223, 266, 446] },
    { id: 'q53',  cat: 'Events',    name: 'Achieve top 10 in Infernal Event',          req: '4 times',   time: '3d',  pts: [268, 330, 536] },
    // ─ Speedups ─
    { id: 'q62',  cat: 'Speedups',  name: 'Use speedups',                              req: '10 days',   time: '24h', pts: [127, 152, 254] },
    { id: 'q63',  cat: 'Speedups',  name: 'Use speedups',                              req: '20 days',   time: '24h', pts: [150, 180, 300] },
    { id: 'q64',  cat: 'Speedups',  name: 'Use speedups',                              req: '35 days',   time: '2d',  pts: [180, 216, 360] },
    { id: 'q65',  cat: 'Speedups',  name: 'Use speedups',                              req: '65 days',   time: '3d',  pts: [217, 260, 434] },
    { id: 'q66',  cat: 'Speedups',  name: 'Reduce time with creation speedups',        req: '4d 12h',    time: '24h', pts: [127, 152, 254] },
    { id: 'q67',  cat: 'Speedups',  name: 'Reduce time with creation speedups',        req: '9 days',    time: '24h', pts: [150, 180, 300] },
    { id: 'q68',  cat: 'Speedups',  name: 'Reduce time with creation speedups',        req: '15d 18h',   time: '2d',  pts: [180, 216, 360] },
    { id: 'q69',  cat: 'Speedups',  name: 'Reduce time with creation speedups',        req: '29d 6h',    time: '3d',  pts: [217, 260, 434] },
    // ─ Gear ─
    { id: 'q70',  cat: 'Gear',      name: 'Craft Gear',                                req: '12k',       time: '24h', pts: [148, 177, 296] },
    { id: 'q71',  cat: 'Gear',      name: 'Craft Gear',                                req: '24k',       time: '24h', pts: [175, 210, 350] },
    { id: 'q71b', cat: 'Gear',      name: 'Craft Gear',                                req: '52k',       time: '2d',  pts: [210, 252, 420] },
    { id: 'q72',  cat: 'Gear',      name: 'Craft Gear',                                req: '78k',       time: '3d',  pts: [253, 303, 506] },
    // ─ Spending ─
    { id: 'q58',  cat: 'Spending',  name: 'Purchase special packages',                 req: '1 time',    time: '24h', pts: [187, 224, 374] },
    { id: 'q59',  cat: 'Spending',  name: 'Purchase special packages',                 req: '2 times',   time: '24h', pts: [220, 264, 440] },
    { id: 'q59b', cat: 'Spending',  name: 'Purchase special packages',                 req: '3 times',   time: '3d',  pts: [268, 322, 536] },
    { id: 'q60',  cat: 'Spending',  name: 'Purchase special packages',                 req: '7 times',   time: '3d',  pts: [319, 382, 638] },
    // ─ Other ─
    { id: 'q54',  cat: 'Other',     name: 'Complete daily missions',                   req: '100 times', time: '24h', pts: [93,  111, 186] },
    { id: 'q55',  cat: 'Other',     name: 'Complete daily missions',                   req: '200 times', time: '24h', pts: [110, 132, 220] },
    { id: 'q56',  cat: 'Other',     name: 'Complete guild missions',                   req: '100 times', time: '24h', pts: [93,  111, 186] },
    { id: 'q57',  cat: 'Other',     name: 'Complete guild missions',                   req: '200 times', time: '24h', pts: [110, 132, 220] },
    { id: 'q61',  cat: 'Other',     name: 'Obtain random mission',                     req: '1',         time: '24h', pts: [225, 330, 450] },
    { id: 'q61b', cat: 'Other',     name: 'Obtain random mission',                     req: '1',         time: '3d',  pts: [275, 330, 550] },
  ];

  let QUESTS = [];

  const tCat = (cat) => {
    if (typeof window.t === 'function') {
      const key = 'cat_' + cat.toLowerCase();
      const translated = window.t(key);
      return translated === key ? cat : translated;
    }
    return cat;
  };

  function getMissionCategory(mission) {
    const m = (mission || '').toLowerCase();
    // Artifacts - must come before 'power' to catch 'artifact coins' first
    if (m.includes('artifact') || m.includes('upgrade artifacts') || m.includes('enhance artifacts')) return 'Artifacts';
    // Might
    if (m.includes('total power') || m.includes('troop power') || m.includes('research power') || m.includes('might')) return 'Might';
    // Hunting
    if (m.includes('monster') || m.includes('gift') || m.includes('hunt') || m.includes('slay')) return 'Hunting';
    // Spending
    if (m.includes('purchase') || m.includes('package') || m.includes('lotes especiales')) return 'Spending';
    // Gear
    if (m.includes('craft gear') || m.includes('gear') || m.includes('equipo')) return 'Gear';
    // Events (Hell Event)
    if (m.includes('infernal') || m.includes('hell') || m.includes('phase 3') || m.includes('fase 3') || m.includes('top 10')) return 'Events';
    // Bastions
    if (m.includes('essence') || m.includes('bastion') || m.includes('darknest') || m.includes('fortaleza')) return 'Bastions';
    // Resources
    if (m.includes('collect resources') || m.includes('spend gems') || m.includes('spend guild coins') || m.includes('gather') || m.includes('suministro') || m.includes('supply')) return 'Resources';
    // Heroes
    if (m.includes('hero trial') || m.includes('all hero') || m.includes('trials') || m.includes('etapas')) return 'Heroes';
    // Castle
    if (m.includes('castle style') || m.includes('castle star') || m.includes('estrellas de castillo')) return 'Castle';
    // Labyrinth - must come after 'castle' to avoid catching 'castle'
    if (m.includes('use stars') || m.includes('labyrinth') || m.includes('guardian') || m.includes('elite labyrinth')) return 'Labyrinth';
    // Tycoon
    if (m.includes('goblin') || m.includes('lucky token') || m.includes('amuletos') || m.includes('treasury') || m.includes('treasurer')) return 'Tycoon';
    // Familiars
    if (m.includes('familiar') || m.includes('pact') || m.includes('pactos') || m.includes('fragment')) return 'Familiars';
    // Speedups
    if (m.includes('speedup') || m.includes('creation speedup') || m.includes('tiempo reducido') || m.includes('reduce time')) return 'Speedups';
    // Troops
    if (m.includes('train') || m.includes('soldier') || m.includes('entrenar') || m.includes('troop')) return 'Troops';
    // Colosseum
    if (m.includes('colosseum') || m.includes('coliseo')) return 'Colosseum';
    return 'Other';
  }

  /**
   * Build the QUESTS array from tasks.json.
   *
   * Source of pts:
   *   - 200_percent_bonus_missions[].required_points  → 200% column
   *   - 120_percent_bonus_missions[].required_points  → 120% column
   *   - base = 200% / 2  (exact game formula)
   *
   * Key = mission|quantity|time_limit to avoid collisions where the same
   * mission name + quantity can have different pts under different time limits.
   */
  function buildQuestsFromTasks(tasksData) {
    const t200 = tasksData['200_percent_bonus_missions'] || [];
    const t120 = tasksData['120_percent_bonus_missions'] || [];
    const map  = new Map();

    // Index 200% entries
    t200.forEach(entry => {
      const k = `${entry.mission.trim()}|${entry.quantity.trim()}|${entry.time_limit || '24h'}`;
      const cur = map.get(k) || { name: entry.mission.trim(), req: entry.quantity.trim(), time: entry.time_limit || '24h', p200: null, p120: null };
      if (entry.required_points > (cur.p200 || 0)) cur.p200 = entry.required_points;
      map.set(k, cur);
    });

    // Index 120% entries
    t120.forEach(entry => {
      const k = `${entry.mission.trim()}|${entry.quantity.trim()}|${entry.time_limit || '24h'}`;
      const cur = map.get(k) || { name: entry.mission.trim(), req: entry.quantity.trim(), time: entry.time_limit || '24h', p200: null, p120: null };
      if (entry.required_points > (cur.p120 || 0)) cur.p120 = entry.required_points;
      map.set(k, cur);
    });

    // Build quest objects
    const quests = [];
    let id = 1;

    map.forEach(q => {
      let pBase, p120, p200;
      if (q.p200 !== null && q.p200 > 0) {
        pBase = Math.round(q.p200 / 2);
        p200  = q.p200;
        p120  = (q.p120 !== null && q.p120 > 0) ? q.p120 : Math.round(pBase * 1.2);
      } else if (q.p120 !== null && q.p120 > 0) {
        pBase = Math.round(q.p120 / 1.2);
        p120  = q.p120;
        p200  = pBase * 2;
      } else {
        return; // skip malformed entries with no point data
      }
      quests.push({ 
        id: `q${id++}`, 
        cat: getMissionCategory(q.name), 
        name: q.name, 
        req: q.req, 
        time: q.time, 
        pts: [pBase, p120, p200],
        valueRating: getMissionValueRating(q.name)
      });
    });

    // Sort: category A→Z, then base pts descending
    quests.sort((a, b) => a.cat !== b.cat ? a.cat.localeCompare(b.cat) : b.pts[0] - a.pts[0]);
    return quests;
  }

  function getMissionValueRating(name) {
    const m = (name || '').toLowerCase();
    
    // Excellent (Green)
    if (
      m.includes('random') || m.includes('aleatoria') ||
      m.includes('guardian') || m.includes('guardián') ||
      m.includes('monster') || m.includes('monstruo') ||
      m.includes('chaos bastion') || m.includes('fortaleza') || m.includes('darknest') ||
      m.includes('collect') || m.includes('gather') || m.includes('recolectar') ||
      m.includes('daily mission') || m.includes('misiones diarias') || m.includes('admin')
    ) {
      return 'excellent';
    }
    
    // Good (Yellow)
    if (
      m.includes('upgrade artifact') || m.includes('mejorar artefacto') ||
      m.includes('speedup') || m.includes('acelerador') ||
      m.includes('research') || m.includes('investigación') || m.includes('investigacion')
    ) {
      return 'good';
    }
    
    return 'low';
  }

  // Keep old name as alias for any other code that might call it
  const mergeQuests = (defaults, tasksData) => buildQuestsFromTasks(tasksData);

  // ── State ────────────────────────────────────────────────────────────────────
  let selectedLeague = LEAGUES.find(l => l.id === 'master');
  let plan = [];           // { questId, label, pts, type }
  let activeCat  = 'All';
  let searchTerm = '';
  let showBestQuestsOnly = false;
  let personalTarget = 0;

  // ── Helpers ──────────────────────────────────────────────────────────────────
  const $ = (id) => document.getElementById(id);
  const fmtPts = (n) => n.toLocaleString();

  function getTranslationWithFallback(key, args, fallbackMap) {
    if (typeof window.t === 'function') {
      const translated = window.t(key, args);
      if (translated && translated !== key) {
        return translated;
      }
    }
    const lang = (window.i18n && window.i18n.currentLang) || 'en';
    return fallbackMap[lang] || fallbackMap['en'] || key;
  }

  function showToast(message, type = 'warning') {

async function init() {
    const section = document.getElementById('gfc-section');
    if (!section) return; // Not on tools page

    try {
      const tasksData = await loadJSON('tasks.json');
      QUESTS = mergeQuests(DEFAULT_QUESTS, tasksData);
    } catch (err) {
      console.warn('Could not load tasks.json, falling back to default quests:', err);
      // Run the DEFAULT_QUESTS through the builder to assign ratings properly just in case
      QUESTS = mergeQuests(DEFAULT_QUESTS, { '200_percent_bonus_missions': [], '120_percent_bonus_missions': [] });
    }

    // Process default quests if the builder above didn't inject anything because tasksData was empty
    if (!QUESTS || QUESTS.length === 0) {
      QUESTS = DEFAULT_QUESTS.map(q => ({ ...q, valueRating: getMissionValueRating(q.name) }));
    }

    renderLeagues();
    renderLeagueInfo();
    renderCatFilters();
    renderQuestTable();
    renderPlanSummary();

    // Initialize mobile tabs
    const tabs = document.querySelectorAll('.gfc-tab-btn');
    const layout = document.querySelector('.gfc-layout');
    
    function setMobileTab(tabId) {
      tabs.forEach(btn => {
        const isActive = btn.dataset.tab === tabId;
        btn.classList.toggle('active', isActive);
      });
      if (layout) {
        if (tabId === 'catalogue') {
          layout.classList.remove('show-plan');
          layout.classList.add('show-catalogue');
        } else {
          layout.classList.remove('show-catalogue');
          layout.classList.add('show-plan');
        }
      }
    }

    tabs.forEach(btn => {
      btn.addEventListener('click', () => {
        setMobileTab(btn.dataset.tab);
      });
    });

    // Switch to plan tab on mobile floating bar click (no scrolling needed)
    const scrollPlanBtn = $('gfc-mob-scroll-plan');
    if (scrollPlanBtn) {
      scrollPlanBtn.addEventListener('click', () => {
        setMobileTab('plan');
        // Scroll slightly to top of section so they don't stay scrolled down
        const section = $('gfc-section');
        if (section) {
          section.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    }

    // Best quests filter
    const bestToggle = $('gfc-best-toggle');
    if (bestToggle) {
      bestToggle.addEventListener('click', () => {
        showBestQuestsOnly = !showBestQuestsOnly;
        bestToggle.classList.toggle('active', showBestQuestsOnly);
        renderQuestTable();
      });
    }

    // Search
    const searchEl = $('gfc-search');
    if (searchEl) {
      searchEl.addEventListener('input', e => {
        searchTerm = e.target.value.toLowerCase().trim();
        renderQuestTable();
      });
    }

    // Reset plan
    const resetBtn = $('gfc-reset');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        plan = [];
        renderPlanSummary();
      });
    }

    // Personal target input handler
    const targetInput = $('gfc-personal-target');
    if (targetInput) {
      targetInput.addEventListener('input', (e) => {
        if (!selectedLeague) return;
        const val = parseInt(e.target.value, 10) || 0;
        personalTarget = val;

        const minRequired = selectedLeague.minGuildPts / 100;
        const errorDiv = $('gfc-target-error');
        const computedGuildPts = $('gfc-computed-guild-pts');

        if (personalTarget < minRequired) {
          errorDiv.style.display = 'block';
          computedGuildPts.textContent = fmtPts(selectedLeague.minGuildPts);
        } else {
          errorDiv.style.display = 'none';
          computedGuildPts.textContent = fmtPts(personalTarget * 100);
        }

        renderPlanSummary();
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Re-render quest names and plan when the language changes
  window.addEventListener('languageChanged', () => {
    renderLeagues();
    renderCatFilters();
    renderQuestTable();
    renderPlanSummary();
  });

})();
