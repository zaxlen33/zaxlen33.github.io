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
  // pts: [base, 120%, 200%]  — values sourced directly from tasks.json
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
    // Artifacts — must come before 'power' to catch 'artifact coins' first
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
    // Labyrinth — must come after 'castle' to avoid catching 'castle'
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
    let container = document.getElementById('gfc-toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'gfc-toast-container';
      container.className = 'gfc-toast-container';
      document.body.appendChild(container);
    }

    // Ensure only one toast exists at a time and clear backdrop/toast
    container.innerHTML = '';
    container.classList.remove('active');

    // Create backdrop overlay for mobile
    const backdrop = document.createElement('div');
    backdrop.className = 'gfc-toast-backdrop';
    container.appendChild(backdrop);

    const toast = document.createElement('div');
    toast.className = `gfc-toast gfc-toast-${type}`;

    const iconMap = {
      error: '❌',
      success: '✅',
      warning: '⚠️'
    };

    const btnTextMap = {
      es: 'Entendido',
      en: 'Understood',
      fr: 'Compris',
      pt: 'Entendido',
      ja: '了解',
      vi: 'Đã hiểu',
      zh: '确定'
    };
    const activeLang = (window.i18n && window.i18n.currentLang) || 'en';
    const btnText = btnTextMap[activeLang] || btnTextMap['en'];

    toast.innerHTML = `
      <div class="gfc-toast-body">
        <span class="gfc-toast-icon">${iconMap[type] || '⚠️'}</span>
        <span class="gfc-toast-msg">${message}</span>
      </div>
      <button class="gfc-toast-close-btn">${btnText}</button>
    `;

    container.appendChild(toast);

    // Fade/scale in
    setTimeout(() => {
      container.classList.add('active');
      toast.classList.add('show');
    }, 10);

    const closeToast = () => {
      toast.classList.remove('show');
      container.classList.remove('active');
      setTimeout(() => {
        container.innerHTML = '';
      }, 300);
    };

    toast.querySelector('.gfc-toast-close-btn').addEventListener('click', closeToast);
    backdrop.addEventListener('click', closeToast);
  }

  // Limits per league
  const LEAGUE_LIMITS = {
    beginner:     { '200': 4, '120': 4, base: 5 },
    intermediate: { '200': 4, '120': 5, base: 5 },
    advanced:     { '200': 5, '120': 5, base: 5 },
    expert:       { '200': 6, '120': 6, base: 4 },
    master:       { '200': 7, '120': 7, base: 4 }
  };

  // ── Render leagues ───────────────────────────────────────────────────────────
  function renderLeagues() {
    const wrap = $('gfc-league-select-wrap');
    if (!wrap) return;

    const optionsHtml = LEAGUES.map(l => {
      const tKey = `gfc_league_${l.id}`;
      const label = typeof window.t === 'function' && window.t(tKey) !== tKey ? window.t(tKey) : l.label;
      return `<option value="${l.id}" ${selectedLeague?.id === l.id ? 'selected' : ''}>${label}</option>`;
    }).join('');

    wrap.innerHTML = `
      <select class="gfc-premium-select" id="gfc-league-select">
        ${optionsHtml}
      </select>
    `;

    const selectEl = $('gfc-league-select');
    if (selectEl) {
      selectEl.addEventListener('change', (e) => {
        selectedLeague = LEAGUES.find(l => l.id === e.target.value);
        renderLeagues();
        renderLeagueInfo();
        renderPlanSummary();
      });
    }
  }

  // ── Render league info panel ─────────────────────────────────────────────────
  function renderLeagueInfo() {
    let displayName = '—';
    if (selectedLeague) {
      const tKey = `gfc_league_${selectedLeague.id}`;
      displayName = typeof window.t === 'function' && window.t(tKey) !== tKey ? window.t(tKey) : selectedLeague.label;
    }
    $('gfc-league-name').textContent = displayName;
    $('gfc-league-attempts').textContent = selectedLeague ? selectedLeague.attempts : '—';
    $('gfc-league-minpts').textContent   = selectedLeague ? fmtPts(selectedLeague.minGuildPts) : '—';

    const targetInput = $('gfc-personal-target');
    const minRequiredSpan = $('gfc-min-required-pts');
    const computedGuildPts = $('gfc-computed-guild-pts');

    if (selectedLeague) {
      targetInput.disabled = false;
      const minRequired = selectedLeague.minGuildPts / 100;
      minRequiredSpan.textContent = fmtPts(minRequired);

      if (!personalTarget || personalTarget < minRequired) {
        personalTarget = minRequired;
        targetInput.value = personalTarget;
      }

      computedGuildPts.textContent = fmtPts(personalTarget * 100);
    } else {
      targetInput.disabled = true;
      targetInput.value = '';
      minRequiredSpan.textContent = '—';
      computedGuildPts.textContent = '—';
    }

    const bonusMsg = $('gfc-bonus-msg');
    if (bonusMsg) {
      bonusMsg.style.display = (selectedLeague?.hasBonus) ? '' : 'none';
    }
  }

  // ── Render category filter chips ──────────────────────────────────────────────
  function renderCatFilters() {
    const cats = ['All', ...new Set(QUESTS.map(q => q.cat))];
    const el   = $('gfc-cat-filters');
    if (!el) return;

    const optionsHtml = cats.map(c => `
      <option value="${c}" ${activeCat === c ? 'selected' : ''}>${tCat(c)}</option>
    `).join('');

    el.innerHTML = `
      <div class="gfc-select-wrap">
        <select class="gfc-premium-select" id="gfc-cat-select">
          ${optionsHtml}
        </select>
      </div>
    `;

    const selectEl = $('gfc-cat-select');
    if (selectEl) {
      selectEl.addEventListener('change', (e) => {
        activeCat = e.target.value;
        renderQuestTable();
      });
    }
  }

  // ── Render quest table ───────────────────────────────────────────────────────
  function renderQuestTable() {
    const tbody = $('gfc-quest-tbody');
    if (!tbody) return;

    let filtered = QUESTS.filter(q => {
      const catOk  = activeCat === 'All' || q.cat === activeCat;
      const displayCat = tCat(q.cat);
      // Search matches translated name, original name, translated category, or original category
      const translated = typeof tMission === 'function' ? tMission(q.name) : q.name;
      const termOk = !searchTerm
        || translated.toLowerCase().includes(searchTerm)
        || q.name.toLowerCase().includes(searchTerm)
        || displayCat.toLowerCase().includes(searchTerm)
        || q.cat.toLowerCase().includes(searchTerm);
      return catOk && termOk;
    });

    if (showBestQuestsOnly) {
      const ratingValue = { 'excellent': 1, 'good': 2, 'low': 3, 'none': 3 };
      filtered.sort((a, b) => {
        if (ratingValue[a.valueRating] !== ratingValue[b.valueRating]) {
          return ratingValue[a.valueRating] - ratingValue[b.valueRating];
        }
        return b.pts[0] - a.pts[0];
      });
    } else {
      filtered.sort((a, b) => a.cat !== b.cat ? a.cat.localeCompare(b.cat) : b.pts[0] - a.pts[0]);
    }

    if (!filtered.length) {
      const noMatches = typeof window.t === 'function' ? window.t('gfc_no_matches') : 'No missions match your search.';
      tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;padding:2rem;color:var(--text-muted)">${noMatches}</td></tr>`;
      return;
    }

    tbody.innerHTML = filtered.map(q => {
      const displayName = typeof tMission === 'function' ? tMission(q.name) : q.name;
      const displayCat = tCat(q.cat);
      let rowClass = '';
      if (q.valueRating === 'excellent') rowClass = 'gfc-quest-excellent';
      else if (q.valueRating === 'good') rowClass = 'gfc-quest-good';
      else if (q.valueRating === 'low') rowClass = 'gfc-quest-low';

      return `
      <tr class="${rowClass}">
        <td class="gfc-cell-name">
          <span class="gfc-quest-name">${displayName}</span>
          <span class="gfc-quest-cat">${displayCat}</span>
        </td>
        <td class="gfc-cell-req" style="text-align:center;color:var(--text-primary);font-size:.9rem;font-weight:600;">${q.req}</td>
        <td class="gfc-cell-time" style="text-align:center;color:var(--text-primary);font-size:.9rem;font-weight:600;">${q.time}</td>
        <td class="gfc-cell-score">
          <div class="gfc-score-btn-group">
            <button class="gfc-btn-score gfc-btn-base"    data-qid="${q.id}" data-type="base"  title="Base score">    ${fmtPts(q.pts[0])}</button>
            <button class="gfc-btn-score gfc-btn-120"     data-qid="${q.id}" data-type="120"   title="120% Bonus">    ${fmtPts(q.pts[1])}</button>
            <button class="gfc-btn-score gfc-btn-200"     data-qid="${q.id}" data-type="200"   title="200% Double">   ${fmtPts(q.pts[2])}</button>
          </div>
        </td>
      </tr>`;
    }).join('');

    // Bind score buttons
    tbody.querySelectorAll('.gfc-btn-score').forEach(btn => {
      btn.addEventListener('click', () => {
        const q    = QUESTS.find(x => x.id === btn.dataset.qid);
        const type = btn.dataset.type;
        if (!q) return;

        if (!selectedLeague) {
          const fallbackMap = {
            es: '¡Por favor selecciona tu liga primero!',
            en: 'Please select your league first!',
            fr: "Veuillez d'abord sélectionner votre ligue !",
            pt: 'Por favor, selecione sua liga primero!',
            ja: '最初にリーグを選択してください！',
            vi: 'Vui lòng chọn giải đấu của bạn trước!',
            zh: '请先选择您的联赛！'
          };
          const msg = getTranslationWithFallback('gfc_alert_league', null, fallbackMap);
          showToast(msg, 'error');
          return;
        }

        if (plan.length >= selectedLeague.attempts) {
          const fallbackMap = {
            es: `¡Límite alcanzado! No puedes agregar más de ${selectedLeague.attempts} misiones en esta liga.`,
            en: `Limit reached! You cannot add more than ${selectedLeague.attempts} missions in this league.`,
            fr: `Limite atteinte ! Vous ne pouvez pas ajouter plus de ${selectedLeague.attempts} missions dans cette ligue.`,
            pt: `Limite atingido! Você não pode adicionar mais de ${selectedLeague.attempts} missões nesta liga.`,
            ja: `上限に達しました！このリーグでは${selectedLeague.attempts}個以上のミッションを追加することはできません。`,
            vi: `Đã đạt giới hạn! Bạn không thể thêm quá ${selectedLeague.attempts} nhiệm vụ trong giải đấu này.`,
            zh: `已达上限！您在此联赛中最多只能添加 ${selectedLeague.attempts} 个任务。`
          };
          const msg = getTranslationWithFallback('gfc_alert_limit', { attempts: selectedLeague.attempts }, fallbackMap);
          showToast(msg, 'error');
          return;
        }

        // Check specific score type limits
        const limits = LEAGUE_LIMITS[selectedLeague.id] || { '200': 4, '120': 4, base: 5 };
        const currentTypeCount = plan.filter(p => p.type === type).length;
        if (currentTypeCount >= limits[type]) {
          const typeNameMap = {
            base: typeof window.t === 'function' && window.t('gfc_legend_base') !== 'gfc_legend_base' ? window.t('gfc_legend_base') : 'Base',
            '120': typeof window.t === 'function' && window.t('gfc_legend_120') !== 'gfc_legend_120' ? window.t('gfc_legend_120') : '120% Bonus',
            '200': typeof window.t === 'function' && window.t('gfc_legend_200') !== 'gfc_legend_200' ? window.t('gfc_legend_200') : '200% Double'
          };
          const typeName = typeNameMap[type] || type;
          const fallbackMap = {
            es: `¡Límite alcanzado! No puedes añadir más de ${limits[type]} misiones de tipo ${typeName} en esta liga.`,
            en: `Limit reached! You cannot add more than ${limits[type]} ${typeName} missions in this league.`,
            fr: `Limite atteinte ! Vous ne pouvez pas ajouter plus de ${limits[type]} missions de type ${typeName} dans cette ligue.`,
            pt: `Limite atingido! Você não pode adicionar mais de ${limits[type]} missões do tipo ${typeName} nesta liga.`,
            ja: `上限に達しました！このリーグでは${typeName}タイプの任務を${limits[type]}個以上追加することはできません。`,
            vi: `Đã đạt giới hạn! Bạn không thể thêm quá ${limits[type]} nhiệm vụ loại ${typeName} trong giải đấu này.`,
            zh: `已达上限！您在此联赛中最多只能添加 ${limits[type]} 个 ${typeName} 类型的任务。`
          };
          const limitMsg = getTranslationWithFallback('gfc_alert_type_limit', { typeName, limit: limits[type] }, fallbackMap);
          showToast(limitMsg, 'error');
          return;
        }

        const displayName = typeof tMission === 'function' ? tMission(q.name) : q.name;
        const ptsMap = { base: q.pts[0], '120': q.pts[1], '200': q.pts[2] };
        const labelMap = {
          base: displayName,
          '120': displayName + ' (120%)',
          '200': displayName + ' (200%)'
        };
        plan.push({ questId: q.id, rawName: q.name, label: labelMap[type], pts: ptsMap[type], type });
        renderPlanSummary();
      });
    });
  }

  // ── Render plan summary ──────────────────────────────────────────────────────
  function renderPlanSummary() {
    const totalPts    = plan.reduce((s, p) => s + p.pts, 0);
    const attempts    = selectedLeague ? selectedLeague.attempts : 0;
    const target      = selectedLeague ? personalTarget : 0;
    const needed      = Math.max(0, target - totalPts);
    const remaining   = attempts - plan.length;
    const avgNeeded   = remaining > 0 ? Math.ceil(needed / remaining) : 0;

    $('gfc-plan-count').textContent = `${plan.length} / ${attempts || '—'}`;
    const tabBadge = $('gfc-tab-badge');
    if (tabBadge) {
      tabBadge.textContent = plan.length;
    }
    $('gfc-plan-total').textContent = fmtPts(totalPts);
    $('gfc-plan-avg').textContent   = selectedLeague ? fmtPts(avgNeeded) : '—';

    // Progress bar
    const pct = target ? Math.min(100, Math.round(totalPts / target * 100)) : 0;
    const bar  = $('gfc-progress-fill');
    const pctLbl = $('gfc-progress-pct');
    if (bar)    bar.style.width = pct + '%';
    if (pctLbl) pctLbl.textContent = pct + '%';
    if (bar) {
      bar.style.background = pct >= 100
        ? 'var(--accent-green)'
        : pct >= 60
          ? '#f59e0b'
          : 'var(--accent-cyan)';
    }

    // Update mobile floating bar
    const mobCount = $('gfc-mob-count');
    const mobTotal = $('gfc-mob-total');
    const mobPct = $('gfc-mob-pct');
    const mobBar = $('gfc-mob-plan-bar');

    if (mobCount) {
      mobCount.textContent = `${plan.length} / ${attempts || '—'}`;
    }
    if (mobTotal) {
      mobTotal.textContent = `${fmtPts(totalPts)} pts`;
    }
    if (mobPct) {
      mobPct.textContent = `${pct}%`;
    }
    if (mobBar) {
      if (selectedLeague && plan.length > 0) {
        mobBar.classList.add('visible');
      } else {
        mobBar.classList.remove('visible');
      }
    }

    // Sequence list
    const list = $('gfc-plan-list');
    if (!list) return;
    if (!plan.length) {
      const emptyMsg = typeof window.t === 'function' ? window.t('gfc_plan_empty') : '→ Click a score button on the right to add it to your plan.';
      list.innerHTML = `<p style="text-align:center;color:var(--text-muted);font-size:.85rem;padding:1.5rem">
        ${emptyMsg}
      </p>`;
      return;
    }

    list.innerHTML = plan.map((item, i) => `
      <div class="gfc-seq-item">
        <span class="gfc-seq-number">${i + 1}</span>
        <div class="gfc-seq-content">
          <span class="gfc-seq-title">${
            (() => {
              const base = typeof tMission === 'function' && item.rawName ? tMission(item.rawName) : item.label;
              if (item.type === 'base') return base;
              return base + (item.type === '120' ? ' (120%)' : ' (200%)');
            })()
          }</span>
          <span class="gfc-seq-meta">${
            (() => {
              if (item.type === 'base') return typeof window.t === 'function' ? window.t('gfc_legend_base') : 'Base';
              if (item.type === '120') return typeof window.t === 'function' ? window.t('gfc_legend_120') : '120% Bonus';
              return typeof window.t === 'function' ? window.t('gfc_legend_200') : '200% Double';
            })()
          }</span>
        </div>
        <span class="gfc-seq-pts">+${fmtPts(item.pts)}</span>
        <button class="gfc-seq-remove" data-idx="${i}" title="Remove">✕</button>
      </div>
    `).join('');

    list.querySelectorAll('.gfc-seq-remove').forEach(btn => {
      btn.addEventListener('click', () => {
        plan.splice(+btn.dataset.idx, 1);
        renderPlanSummary();
      });
    });
  }

  // ── Init ─────────────────────────────────────────────────────────────────────
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
