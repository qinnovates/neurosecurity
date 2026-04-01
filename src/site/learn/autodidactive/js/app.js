// Autodidactive — Main App Router & View Logic
import { POLYMATHS } from './data/polymaths.js';
import { PHILOSOPHERS } from './data/philosophers.js';
import { NEUROETHICS_PEOPLE } from './data/neuroethics.js';
import { NEUROSCIENCE } from './data/neuroscience.js';
import { QUANTUM } from './data/quantum.js';
import { CYBERSECURITY } from './data/cybersecurity.js';
import { PATTERNS, IMPLEMENT_PRACTICES, INFLUENTIAL_BOOKS } from './data/patterns.js';
import { CALCULUS_LABS } from './data/calculus.js';
import { LLM_LABS } from './data/llm.js';
import { initNoteWall, getNotesForBackground } from './notewall.js';
import { getRelated, getPathWithEdges, getAllNodes, getAllEdges } from './graph.js';
import { search, highlightMatch, groupResults } from './search.js';
import { renderPathList, renderPathDetail, markStepComplete, LEARNING_PATHS } from './paths.js?v=7';
import { initCanvas, addNodeToCanvas, addPathToCanvas, setLayout, renderTray, renderCanvasControls, saveCanvas, loadCanvas, stopAnimation, getActiveContext, syncNotes } from './canvas.js';
import { processMessage, processMessageTier3, renderChat, clearChat, trackStyle, getLearningStyle, getTutorPrefs, setTutorPref, initTier2, testConnection, processSynthesis, initTutorActionDelegation } from './tutor.js?v=7';
import { renderEthicsTimeline } from './ethics-timeline.js';
import { ETHICS_TIMELINE } from './data/ethics.js';
import { renderNeuroanatomy } from './neuroanatomy.js';
import { QIF_BANDS } from './data/neuroanatomy.js';
import { generateMindmapFromNotes, renderSavedMindmap } from './mindmap.js';
import { renderTARA, renderNISS, renderNeurowall, renderGuardrails, renderGovernance, renderBCIDevices, renderBrainAtlas } from './qif-views.js';
import { GUARDRAILS, DSM5_CLUSTERS, NEURORIGHTS } from './data/guardrails.js';
import { NEUROWALL } from './data/neurowall.js';
import { GOVERNANCE_DOCS, REGULATORY_LANDSCAPE } from './data/governance.js';

// Lazy-loaded data (large files loaded on demand)
let _TARA_TECHNIQUES = null;
let _TARA_STATS = null;
let _NISS_DEVICES = null;
let _BCI_COMPANIES = null;
let _BRAIN_REGIONS = null;

async function loadTARA() {
  if (!_TARA_TECHNIQUES) {
    const m = await import('./data/tara.js');
    _TARA_TECHNIQUES = m.TARA_TECHNIQUES;
    _TARA_STATS = m.TARA_STATS;
  }
  return { techniques: _TARA_TECHNIQUES, stats: _TARA_STATS };
}

async function loadNISS() {
  if (!_NISS_DEVICES) {
    const m = await import('./data/niss.js');
    _NISS_DEVICES = m.NISS_DEVICES;
  }
  return _NISS_DEVICES;
}

async function loadBCICompanies() {
  if (!_BCI_COMPANIES) {
    const m = await import('./data/bci-devices.js');
    _BCI_COMPANIES = m.BCI_COMPANIES;
  }
  return _BCI_COMPANIES;
}

async function loadBrainAtlas() {
  if (!_BRAIN_REGIONS) {
    const m = await import('./data/brain-atlas.js');
    _BRAIN_REGIONS = m.BRAIN_REGIONS;
  }
  return _BRAIN_REGIONS;
}

// ── All People ──────────────────────────────────────────────────────────────
const ALL_PEOPLE = [
  ...POLYMATHS,
  ...PHILOSOPHERS,
  ...NEUROETHICS_PEOPLE,
  ...NEUROSCIENCE,
  ...QUANTUM,
  ...CYBERSECURITY
];

// ── Category grid ───────────────────────────────────────────────────────────
const SCIENCE_PEOPLE = [...POLYMATHS, ...NEUROSCIENCE, ...QUANTUM];

const ETHICS_ALL = [...ETHICS_TIMELINE.filter(e => !e.isContext), ...PHILOSOPHERS, ...NEUROETHICS_PEOPLE];

const CATEGORIES = [
  { id: 'custom', label: 'Custom', icon: '🛠️', data: [...CALCULUS_LABS, ...LLM_LABS], type: 'group',
    subs: [
      { id: 'custom-calculus', label: 'Calculus', data: CALCULUS_LABS, type: 'labs' },
      { id: 'custom-llm',     label: 'LLMs',     data: LLM_LABS,     type: 'labs' }
    ]},
  { id: 'ethics', label: 'Ethics', icon: '⚖️', data: ETHICS_ALL, type: 'group',
    subs: [
      { id: 'ethics-timeline',    label: 'Timeline',     data: ETHICS_TIMELINE.filter(e => !e.isContext), type: 'timeline' },
      { id: 'ethics-philosophy',  label: 'Philosophy',   data: PHILOSOPHERS,      type: 'people' },
      { id: 'ethics-neuroethics', label: 'Neuroethics',  data: NEUROETHICS_PEOPLE, type: 'people' },
      { id: 'ethics-guardrails',  label: 'Guardrails',   data: GUARDRAILS,         type: 'guardrails' },
      { id: 'ethics-governance',  label: 'Governance',   data: GOVERNANCE_DOCS,    type: 'governance' }
    ]},
  { id: 'neuroscience', label: 'Neuroscience', icon: '🧬', data: QIF_BANDS, type: 'group',
    subs: [
      { id: 'neuro-hourglass', label: 'QIF Hourglass', data: QIF_BANDS, type: 'neuroanatomy' },
      { id: 'neuro-physics',   label: 'Why Hourglass?', data: QIF_BANDS, type: 'hourglass-physics' },
      { id: 'neuro-vision',    label: 'Vision',        data: QIF_BANDS, type: 'vision' },
      { id: 'neuro-atlas',     label: 'Brain Atlas',   data: QIF_BANDS, type: 'brain-atlas' },
      { id: 'neuro-devices',   label: 'BCI Devices',   data: QIF_BANDS, type: 'bci-devices' }
    ]},
  { id: 'security', label: 'Security', icon: '🔒', data: CYBERSECURITY, type: 'group',
    subs: [
      { id: 'sec-people',    label: 'Pioneers',   data: CYBERSECURITY,  type: 'people' },
      { id: 'sec-tara',      label: 'TARA Threats', data: CYBERSECURITY, type: 'tara' },
      { id: 'sec-niss',      label: 'NISS Scoring', data: CYBERSECURITY, type: 'niss' },
      { id: 'sec-neurowall', label: 'Neurowall',    data: CYBERSECURITY, type: 'neurowall' }
    ]},
  { id: 'science',   label: 'Science',   icon: '🔬', data: SCIENCE_PEOPLE, type: 'people' },
  { id: 'paths',     label: 'Paths',     icon: '🗺️', data: LEARNING_PATHS, type: 'paths' }
];

// Keep FIELDS for backward compat (search, etc.)
const FIELDS = [
  { id: 'all', label: 'All', data: ALL_PEOPLE },
  { id: 'polymaths', label: 'Polymaths', data: POLYMATHS },
  { id: 'philosophers', label: 'Philosophy', data: PHILOSOPHERS },
  { id: 'neuroethics', label: 'Neuroethics', data: NEUROETHICS_PEOPLE },
  { id: 'neuroscience', label: 'Neuroscience', data: NEUROSCIENCE },
  { id: 'quantum', label: 'Quantum', data: QUANTUM },
  { id: 'cybersecurity', label: 'Cybersecurity', data: CYBERSECURITY },
  { id: 'ethics', label: 'Ethics', data: ETHICS_TIMELINE.filter(e => !e.isContext) },
  { id: 'calculus', label: 'Calculus', data: CALCULUS_LABS },
  { id: 'llm', label: 'LLMs', data: LLM_LABS },
  { id: 'paths', label: 'Paths', data: LEARNING_PATHS }
];

// ── Daily Discovery (Seeded PRNG) ───────────────────────────────────────────
function dailySeed() {
  const d = new Date();
  return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
}

function mulberry32(seed) {
  return function () {
    seed |= 0;
    seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

function getTodaysDiscovery() {
  const rng = mulberry32(dailySeed());
  return ALL_PEOPLE[Math.floor(rng() * ALL_PEOPLE.length)];
}

// ── Streak Tracking ─────────────────────────────────────────────────────────
const STREAK_KEY = 'autodidactive-streak';

function getStreak() {
  try {
    const raw = localStorage.getItem(STREAK_KEY);
    if (!raw) return { count: 0, lastDate: null };
    return JSON.parse(raw);
  } catch {
    return { count: 0, lastDate: null };
  }
}

function updateStreak() {
  const today = new Date().toISOString().slice(0, 10);
  const streak = getStreak();
  if (streak.lastDate === today) return streak;

  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  if (streak.lastDate === yesterday) {
    streak.count++;
  } else if (streak.lastDate !== today) {
    streak.count = 1;
  }
  streak.lastDate = today;
  localStorage.setItem(STREAK_KEY, JSON.stringify(streak));
  return streak;
}

// ── Stats Tracking ──────────────────────────────────────────────────────────
const STATS_KEY = 'autodidactive-stats';

function getStats() {
  try {
    const raw = localStorage.getItem(STATS_KEY);
    if (!raw) return { viewed: [], bookmarked: [], fieldsExplored: [] };
    return JSON.parse(raw);
  } catch {
    return { viewed: [], bookmarked: [], fieldsExplored: [] };
  }
}

function trackView(personId, fieldId) {
  const stats = getStats();
  if (!stats.viewed.includes(personId)) {
    stats.viewed.push(personId);
  }
  if (fieldId && !stats.fieldsExplored.includes(fieldId)) {
    stats.fieldsExplored.push(fieldId);
  }
  localStorage.setItem(STATS_KEY, JSON.stringify(stats));
  return stats;
}

function toggleBookmark(personId) {
  const stats = getStats();
  const idx = stats.bookmarked.indexOf(personId);
  if (idx >= 0) {
    stats.bookmarked.splice(idx, 1);
  } else {
    stats.bookmarked.push(personId);
  }
  localStorage.setItem(STATS_KEY, JSON.stringify(stats));
  return stats;
}

function isBookmarked(personId) {
  return getStats().bookmarked.includes(personId);
}

// ── Spaced Repetition (SM-2 Simplified) ─────────────────────────────────────
const SR_KEY = 'autodidactive-sr';

function getSRData() {
  try {
    const raw = localStorage.getItem(SR_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function recordView(personId) {
  const views = JSON.parse(localStorage.getItem('autodidactive-views') || '{}');
  views[personId] = (views[personId] || 0) + 1;
  localStorage.setItem('autodidactive-views', JSON.stringify(views));
  recordActivity();
}

function processRecall(personId, success) {
  const sr = getSRData();
  let card = sr[personId] || { interval: 0, reviews: 0, lastReview: 0, nextReview: Date.now() };

  if (success) {
    card.reviews++;
    card.interval = Math.max(1, card.interval * 2);
    if (card.interval === 0) card.interval = 1;
  } else {
    card.interval = 1;
  }

  card.lastReview = Date.now();
  card.nextReview = Date.now() + card.interval * 24 * 60 * 60 * 1000;
  sr[personId] = card;
  localStorage.setItem('autodidactive-sr', JSON.stringify(sr));
  recordActivity();
}

function getDueRecallCard() {
  const sr = getSRData();
  const now = Date.now();
  const due = Object.entries(sr)
    .filter(([, data]) => data.nextReview <= now)
    .sort((a, b) => a[1].nextReview - b[1].nextReview);

  if (due.length === 0) return null;
  return ALL_PEOPLE.find(p => p.id === personId) || null;
}

// ── Recall Question Generator ───────────────────────────────────────────────
function generateRecallQuestion(person) {
  const questions = [
    { q: `What was ${person.name}'s defining struggle?`, a: person.struggles ? person.struggles.split('.').slice(0, 2).join('.') + '.' : person.bio.split('.').slice(0, 2).join('.') + '.' },
    { q: `Name one framework ${person.name} used.`, a: person.frameworks[0] },
    { q: `What was ${person.name}'s defining moment?`, a: person.moment.split('.').slice(0, 2).join('.') + '.' }
  ];
  if (person.books && person.books.length > 0) {
    questions.push({ q: `What book influenced ${person.name}?`, a: `"${person.books[0].title}" by ${person.books[0].author}` });
  }
  return questions[Math.floor(Math.random() * questions.length)];
}

// ── Mastery Calculation ─────────────────────────────────────────────────────
function calculateMastery(personId) {
  const sr = getSRData();
  const card = sr[personId];
  if (!card) return 0;
  // SM-2 mastery approximation
  const score = Math.min(100, (card.reviews * 15) + (card.interval * 5));
  return Math.round(score);
}

// ── Escape HTML ─────────────────────────────────────────────────────────────
function esc(str) {

  const div = document.createElement('div');
  div.textContent = str || '';
  return div.innerHTML;
}

// ── Hash Color ──────────────────────────────────────────────────────────────
function hashColor(id) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
  const h = Math.abs(hash) % 360;
  return `hsl(${h}, 55%, 90%)`;
}

// ── Router ──────────────────────────────────────────────────────────────────
let currentView = 'home';
let currentField = 'all';
let currentConcept = null;
let currentCategory = null; // null = show grid, string = show category content
let currentSub = null;      // sub-pill within a grouped category

function navigate(view) {
  currentView = view;
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  const target = document.getElementById(`view-${view}`);
  if (target) target.classList.add('active');

  // Update nav
  document.querySelectorAll('.tab-nav__item').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.view === view);
  });

  // Initialize views on navigation
  if (view === 'home') renderHome();
  if (view === 'learn') renderLearn();
  if (view === 'notewall') renderNoteWall();
  if (view === 'audio') renderAudioView();
  if (view === 'profile') renderProfile();

  window.scrollTo(0, 0);
}

// ── Home View ───────────────────────────────────────────────────────────────
function renderHome() {
  const container = document.getElementById('view-home');
  const streak = updateStreak();
  const today = getTodaysDiscovery();
  const bgNotes = getNotesForBackground();

  container.innerHTML = `
    <div class="landing">
      <div class="landing-bg">
        ${bgNotes.map(n => `
          <div class="landing-note" style="
            left: ${Math.random() * 80 + 5}%;
            top: ${Math.random() * 70 + 10}%;
            transform: rotate(${(Math.random() * 6 - 3).toFixed(1)}deg);
            background: ${['#fef3c7', '#fce7f3', '#d1fae5', '#dbeafe', '#ede9fe'][n.color || 0]};
          ">${esc(n.text).slice(0, 40)}${n.text.length > 40 ? '...' : ''}</div>
        `).join('')}
      </div>
      <div class="landing-content">
        <h1 class="landing-title">Autodidactive</h1>
        <p class="landing-subtitle">Learn something every day</p>
        <div class="landing-buttons">
          <button class="landing-btn landing-btn-learn" onclick="window._navigate('learn')">
            <span class="landing-btn-icon">📖</span>
            <span>Learn</span>
          </button>
          <button class="landing-btn landing-btn-notes" onclick="window._navigate('notewall')">
            <span class="landing-btn-icon">📝</span>
            <span>Note Wall</span>
          </button>
        </div>
        ${streak.count > 0 ? `
          <div class="streak-display">
            <span class="streak-fire">🔥</span>
            <span class="streak-count">${streak.count} day${streak.count !== 1 ? 's' : ''}</span>
          </div>
        ` : ''}
        <div class="discovery-preview" onclick="window._navigate('learn'); setTimeout(() => window._openPerson('${today.id}'), 100);">
          <div class="discovery-label">Today's Discovery</div>
          <div class="discovery-emoji">${today.emoji}</div>
          <div class="discovery-name">${esc(today.name)}</div>
          <div class="discovery-tagline">${esc(today.tagline)}</div>
        </div>
      </div>
    </div>
  `;
}

// ── Learn View ──────────────────────────────────────────────────────────────
function renderLearn() {
  const container = document.getElementById('view-learn');
  const today = getTodaysDiscovery();
  const stats = getStats();
  const viewCount = stats.viewed.length;

  // If a category is selected, show its content
  if (currentCategory) {
    renderCategoryView(container, today, viewCount);
    return;
  }

  // Otherwise show the category grid
  const toolIds = new Set(['paths']);
  const mainCats = CATEGORIES.filter(c => !toolIds.has(c.id));
  const pathsCat = CATEGORIES.find(c => c.id === 'paths');

  container.innerHTML = `
    <div class="learn-header">
      <h2 class="learn-title">Learn</h2>
      <button class="search-btn" onclick="window._openSearch()" aria-label="Search">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
      </button>
    </div>
    <div class="discovery-card" onclick="window._openPerson('${today.id}')">
      <div class="discovery-card-label">Daily Discovery</div>
      <div class="discovery-card-content">
        <span class="discovery-card-emoji">${today.emoji}</span>
        <div>
          <div class="discovery-card-name">${esc(today.name)}</div>
          <div class="discovery-card-years">${esc(today.years)}</div>
        </div>
      </div>
      <div class="discovery-card-tagline">${esc(today.tagline)}</div>
      ${today.quotes && today.quotes[0] ? `<div class="discovery-card-quote">"${esc(today.quotes[0].text)}"</div>` : ''}
    </div>
    ${viewCount >= 3 ? renderRecallPrompt() : ''}
    <div class="category-grid">
      ${mainCats.map(cat => `
        <button class="category-card" data-cat="${cat.id}">
          <span class="category-card-icon">${cat.icon}</span>
          <span class="category-card-label">${cat.label}</span>
          <span class="category-card-count">${cat.data.length}</span>
        </button>
      `).join('')}
    </div>
    <div class="category-tools">
    ${pathsCat ? `
    <button class="category-card category-card--wide" data-cat="paths">
      <span class="category-card-icon">${pathsCat.icon}</span>
      <span class="category-card-label">${pathsCat.label}</span>
      <span class="category-card-count">${pathsCat.data.length} guided journeys</span>
    </button>` : ''}
    </div>
    <div class="evolving-note">
      <p>Autodidactive will evolve as I stumble across more novel concepts that I find useful for newcomers to neurosecurity, neuroethics, and BCI work. It will grow as I go through school, helping me learn and understand more abstract concepts along the way.</p>
    </div>
  `;

  // Category card click handlers
  container.querySelectorAll('.category-card').forEach(card => {
    card.addEventListener('click', () => {
      currentCategory = card.dataset.cat;
      currentPath = null;
      renderLearn();
      window.scrollTo(0, 0);
    });
  });
}

function renderCategoryView(container, today, viewCount) {
  const cat = CATEGORIES.find(c => c.id === currentCategory);
  if (!cat) { currentCategory = null; renderLearn(); return; }

  // For grouped categories, default to first sub
  if (cat.subs && !currentSub) currentSub = cat.subs[0].id;

  container.innerHTML = `
    <div class="learn-header">
      <button class="category-back-btn" id="catBackBtn">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="15 18 9 12 15 6"/>
        </svg>
      </button>
      <h2 class="learn-title">${cat.icon} ${cat.label}</h2>
      <button class="search-btn" onclick="window._openSearch()" aria-label="Search">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
      </button>
    </div>
    ${cat.subs ? `
    <div class="field-chips" id="fieldChips">
      ${cat.subs.map(sub => `
        <button class="chip ${sub.id === currentSub ? 'active' : ''}" data-sub="${sub.id}">
          ${sub.label}
          <span class="chip-count">${sub.data.length}</span>
        </button>
      `).join('')}
    </div>` : ''}
    <div class="card-grid" id="cardGrid"></div>
  `;

  // Back button
  document.getElementById('catBackBtn').addEventListener('click', () => {
    currentCategory = null;
    currentSub = null;
    currentPath = null;
    renderLearn();
  });

  // Sub-pill handlers
  if (cat.subs) {
    container.querySelectorAll('.chip[data-sub]').forEach(chip => {
      chip.addEventListener('click', () => {
        currentSub = chip.dataset.sub;
        container.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        renderCardGrid();
      });
    });
  }

  // Render content
  renderCardGrid();
}

function renderRecallPrompt() {
  const person = getDueRecallCard();
  if (!person) return '';
  const q = generateRecallQuestion(person);
  const mastery = calculateMastery(person.id);
  const isFeynman = localStorage.getItem('autodidactive-feynman') === 'true';

  return `
    <div class="recall-card" id="recallCard">
      <div class="recall-header">
        <div class="recall-label">Active Recall</div>
        <label class="feynman-toggle" title="Feynman Mode: Write before you reveal">
          <span>Feynman</span>
          <input type="checkbox" onchange="localStorage.setItem('autodidactive-feynman', this.checked); window._renderHome()" ${isFeynman ? 'checked' : ''}>
        </label>
      </div>
      <div class="recall-mastery">
        <div class="mastery-label">Mastery: ${mastery}%</div>
        <div class="mastery-bar"><div class="mastery-fill" style="width: ${mastery}%"></div></div>
      </div>
      <p class="recall-question">${esc(q.q)}</p>
      
      ${isFeynman ? `
        <textarea id="feynman-input" class="feynman-input" placeholder="Explain this concept in your own words..."></textarea>
      ` : ''}

      <button class="recall-reveal-btn" onclick="
        if(${isFeynman} && !document.getElementById('feynman-input').value.trim()) {
          alert('Try explaining it first!');
          return;
        }
        this.style.display='none';
        document.getElementById('recallAnswer').style.display='block';
        if(document.getElementById('feynman-input')) document.getElementById('feynman-input').disabled = true;
      ">Reveal Answer</button>

      <div id="recallAnswer" class="recall-answer" style="display:none;">
        <p>${esc(q.a)}</p>
        <div class="recall-btns">
          <button class="recall-btn-wrong" onclick="window._processRecall('${person.id}', false)">Forgot</button>
          <button class="recall-btn-right" onclick="window._processRecall('${person.id}', true)">Remembered</button>
        </div>
      </div>
    </div>
  `;
}


function renderCardGrid() {
  const grid = document.getElementById('cardGrid');
  if (!grid) return;

  const cat = CATEGORIES.find(c => c.id === currentCategory);
  if (!cat) return;

  // Grouped category (e.g. Ethics with sub-pills)
  if (cat.type === 'group' && cat.subs) {
    const sub = cat.subs.find(s => s.id === currentSub) || cat.subs[0];
    renderByType(grid, sub.type, sub.data);
    return;
  }

  // Simple category
  renderByType(grid, cat.type, cat.data);
}

function renderAudioView() {
  const container = document.getElementById('view-audio');
  container.innerHTML = `
    <div class="audio-view-wrapper">
      <h2 class="audio-view-title">Auditory Learning</h2>
      <div class="auditory-section">
        <div class="auditory-intro">
          <p>Music that encodes philosophy, neuroscience, and security thinking into something you can feel. Every track starts from a real story — the knowledge is woven into the lyrics, but the entry point is human experience.</p>
        </div>
        <div class="auditory-links">
          <a href="https://open.spotify.com/album/1s3McB6Rcd9LdZrKiNlH6N?si=UMRzS2qATF-e_6hkon5VgQ" target="_blank" rel="noopener noreferrer" class="auditory-link auditory-link--spotify">
            <span class="auditory-link-icon">🎧</span>
            <div>
              <div class="auditory-link-title">Listen on Spotify</div>
              <div class="auditory-link-desc">Sawdust album — Stoic philosophy meets dark gospel blues</div>
            </div>
          </a>
          <a href="https://github.com/qinnovates/qinnovate/tree/main/principles-of-ethics/music/justbrowser" target="_blank" rel="noopener noreferrer" class="auditory-link auditory-link--github">
            <span class="auditory-link-icon">📄</span>
            <div>
              <div class="auditory-link-title">Documentation</div>
              <div class="auditory-link-desc">Lyrics, symbolic analysis, and methodology on GitHub</div>
            </div>
          </a>
        </div>
        <div class="auditory-tracks">
          <h4 class="auditory-tracks-title">Released</h4>
          <div class="auditory-track">
            <span class="auditory-track-emoji">🪵</span>
            <div>
              <div class="auditory-track-name">Sawdust</div>
              <div class="auditory-track-meta">Dark gospel blues (Dm, 74 BPM) — 10 Stoic teachings encoded</div>
            </div>
          </div>
          <div class="auditory-track">
            <span class="auditory-track-emoji">⚖️</span>
            <div>
              <div class="auditory-track-name">Principals of Ethics</div>
              <div class="auditory-track-meta">Cinematic neo-soul gospel (Dm, 70 BPM) — cognitive liberty, neural equity</div>
            </div>
          </div>
        </div>
        <div class="auditory-why">
          <h4 class="auditory-tracks-title">Why Auditory Learning</h4>
          <ul>
            <li>Emotional encoding improves retention</li>
            <li>Dual coding across modalities strengthens recall</li>
            <li>Songs you replay create natural spaced repetition</li>
          </ul>
        </div>
      </div>
    </div>
  `;
}

function renderHourglassPhysics(container) {
  container.innerHTML = `
    <div class="vision-section">
      <div class="vision-intro">
        <p class="vision-qualifier" style="background:#fef3c7;border-left:3px solid #f59e0b;padding:12px 16px;border-radius:6px;margin-bottom:16px;">
          <strong>Disclaimer:</strong> QIF is a proposed framework by Kevin Qi. It has not been peer-reviewed, independently validated, or adopted by any standards body. The physics and math referenced below are established science. The <em>mapping</em> of those principles to BCI security architecture is theoretical and requires independent verification. This page explains the reasoning, not settled fact.
        </p>
      </div>

      <div class="vision-card">
        <h4 class="vision-heading">The Problem I Was Trying to Solve</h4>
        <p>Brain-computer interfaces connect two fundamentally different systems: a biological brain and a silicon computer. When I started looking at how to secure that connection, I realized no existing security model covers both sides. Network security models (OSI, TCP/IP) stop at the wire. Neuroscience models (Kandel's CNS hierarchy) stop at the tissue. Nothing spans the full stack from thought to application.</p>
        <p>I needed a model that could map <em>where</em> an attack happens, <em>what kind</em> of signal is being attacked, and <em>how predictable</em> that signal is at each point. The shape of the answer turned out to be an hourglass.</p>
      </div>

      <div class="vision-card">
        <h4 class="vision-heading">Step 1: The Bottleneck is Real</h4>
        <p>The Internet protocol stack has an hourglass shape. Many applications at the top, many link technologies at the bottom, and IP as the "narrow waist" through which all traffic must pass (Deering, 1998). Every packet, no matter what it carries, transits IP.</p>
        <p>BCIs have the same structure. Every signal -- whether neural or synthetic, whether reading or writing -- must cross the electrode-tissue boundary. That physical boundary is not optional. It is where biology ends and silicon begins. I called it <strong>I0</strong>.</p>
        <p>This is not an analogy I chose for convenience. It is a physical constraint. There is no way to interface with neural tissue without crossing a boundary where the signal changes medium. That boundary is the narrowest point in the system, and it is where security matters most.</p>
      </div>

      <div class="vision-card">
        <h4 class="vision-heading">Step 2: The Neural Side Has Layers</h4>
        <p>Neuroscience already organizes the CNS into a functional hierarchy (Kandel et al., 2021). I mapped 7 bands to this hierarchy because each level has distinct signal properties that matter for security:</p>
        <div class="vision-table">
          <div class="vision-row vision-row-header"><span>Band</span><span>Structure</span><span>Why It Is Its Own Band</span></div>
          <div class="vision-row"><span>N7</span><span>Neocortex (PFC, M1, V1)</span><span>Highest abstraction. Processes like decision-making and abstract thought involve the smallest-scale dynamics where quantum effects may be non-negligible.</span></div>
          <div class="vision-row"><span>N6</span><span>Limbic (hippocampus, amygdala)</span><span>Emotion and memory encoding. Chaotic dynamics -- sensitive dependence on initial conditions (Lyapunov exponent > 0).</span></div>
          <div class="vision-row"><span>N5</span><span>Basal Ganglia (striatum, STN)</span><span>Action selection and reward. Oscillatory loops with chaotic switching between states.</span></div>
          <div class="vision-row"><span>N4</span><span>Diencephalon (thalamus)</span><span>The brain's router. 95% of LGN input is feedback from cortex, not sensory input. Acts as a biological firewall via the reticular thalamic nucleus (default-deny gating).</span></div>
          <div class="vision-row"><span>N3</span><span>Cerebellum</span><span>Motor coordination. High-frequency, timing-precise, stochastic but relatively predictable.</span></div>
          <div class="vision-row"><span>N2</span><span>Brainstem</span><span>Vital functions (breathing, heart rate). Rhythmic, stochastic, life-critical. Attacks here are immediately dangerous.</span></div>
          <div class="vision-row"><span>N1</span><span>Spinal Cord</span><span>Reflexes. Nearly deterministic. Simple input-output arcs that are the most predictable neural signals.</span></div>
        </div>
        <p>These are not arbitrary divisions. Each corresponds to a real anatomical structure with measurably different signal properties (frequency bands, firing patterns, noise characteristics). An attacker targeting N7 faces fundamentally different physics than one targeting N1.</p>
      </div>

      <div class="vision-card">
        <h4 class="vision-heading">Step 3: The Silicon Side Has Layers Too</h4>
        <p>Below I0, the signal enters silicon. I mapped 3 bands because BCI hardware follows a clear processing chain:</p>
        <div class="vision-table">
          <div class="vision-row vision-row-header"><span>Band</span><span>Function</span><span>Physics Regime</span></div>
          <div class="vision-row"><span>S1</span><span>Analog Front-End (amplification, ADC)</span><span>Near-field. Analog noise still present. Stochastic. On-device.</span></div>
          <div class="vision-row"><span>S2</span><span>Digital Processing (decoding, algorithms)</span><span>Guided-wave. Fully deterministic. Device-local.</span></div>
          <div class="vision-row"><span>S3</span><span>Application (software, cloud, storage)</span><span>Far-field. Fully deterministic. Off-device. Classical cybersecurity applies.</span></div>
        </div>
        <p>The organizing principle: <strong>physics regime + spatial scale</strong>. S1 is near-field (on the electrode), S2 is guided-wave (on the device), S3 is far-field (off the device into the network). The further from I0, the more classical and auditable the signal becomes.</p>
      </div>

      <div class="vision-card">
        <h4 class="vision-heading">Step 4: Width = Unpredictability</h4>
        <p>Here is where the hourglass shape comes from physics. The width of each band represents its <strong>state space</strong> -- how many possible states the system can occupy at that level. This maps directly to unpredictability, which maps directly to how hard it is to secure.</p>
        <p>I identified four types of unpredictability, each with different security implications:</p>
        <div class="vision-table">
          <div class="vision-row vision-row-header"><span>Type</span><span>What It Means</span><span>Bands</span><span>Can an Attacker Predict It?</span></div>
          <div class="vision-row"><span>Deterministic</span><span>Fully predictable given inputs</span><span>S2, S3</span><span>Yes, completely</span></div>
          <div class="vision-row"><span>Stochastic</span><span>Random, but randomness is epistemic (from ignorance, not physics)</span><span>S1, N1-N3</span><span>Statistically, yes</span></div>
          <div class="vision-row"><span>Chaotic</span><span>Deterministic equations, but tiny input differences explode exponentially</span><span>N4-N6</span><span>Short-term yes, long-term no</span></div>
          <div class="vision-row"><span>Quantum uncertain</span><span>Fundamentally indeterminate. No hidden variables (Bell's theorem, 1964).</span><span>N7</span><span>No. Not even in principle.</span></div>
        </div>
        <p><strong>The key distinction:</strong> Chaotic systems have hidden variables -- if you knew them perfectly, you could predict the system. Quantum systems do not. Bell's theorem (1964) and its experimental confirmations (Aspect 1982, Hensen 2015) proved this. The unpredictability at N7 is not from lack of information. It is from physics.</p>
        <p>This means the hourglass is widest at the top (N7, maximum state space, maximum unpredictability) and narrows monotonically down through the neural bands to I0 (measurement collapses state space to classical data), then widens again through silicon (S3 has the most classical attack surface -- APIs, networks, databases).</p>
      </div>

      <div class="vision-card">
        <h4 class="vision-heading">Step 5: The Math That Supports This Shape</h4>
        <p>Each claim above maps to established physics. None of these equations are mine. The <em>application</em> of them to BCI security architecture is what I am proposing.</p>
        <div class="vision-table">
          <div class="vision-row vision-row-header"><span>Equation</span><span>Status</span><span>What It Proves for QIF</span></div>
          <div class="vision-row"><span>Schrodinger / Hamiltonian: iℏ(d/dt)|ψ> = H|ψ></span><span>Established</span><span>Neural quantum states evolve according to this equation. Qinnovate's early attempt at unifying these physics into a single metric starts here -- the idea is to derive one number per band that captures its indeterminacy. That work is ongoing and unvalidated.</span></div>
          <div class="vision-row"><span>Decoherence: ρ_ij(t) ~ ρ_ij(0) * e^(-t/τ_D)</span><span>Established</span><span>Off-diagonal elements of the density matrix decay exponentially. τ_D ranges from 10^-13 s (fast decoherence) to hours (slow). This gradient maps to band width.</span></div>
          <div class="vision-row"><span>Density matrix purity: Tr(ρ^2)</span><span>Established</span><span>Ranges from 1 (pure quantum state, maximum coherence) to 1/d (maximally mixed). Purity decreases as you move from neural domain through I0 to silicon. This IS the hourglass shape in mathematical terms.</span></div>
          <div class="vision-row"><span>Shannon: C = B log2(1 + S/N)</span><span>Established</span><span>Information capacity at each band boundary is finite and measurable. The interface band I0 is the bandwidth bottleneck of the entire system.</span></div>
          <div class="vision-row"><span>Hodgkin-Huxley: Cm(dV/dt) = -Σgi*m^p*h^q*(V-Ei) + Iext</span><span>Established</span><span>How neurons fire. Action potential dynamics are deterministic at the channel level but stochastic at the population level (synaptic release probability ~0.1-0.9, Borst 2010).</span></div>
          <div class="vision-row"><span>Boltzmann: P proportional to e^(-E/kT)</span><span>Established</span><span>A neural spike is only detectable if E_spike / kT >> 1. This sets the physical floor on what any electrode can measure.</span></div>
          <div class="vision-row"><span>No-Cloning Theorem</span><span>Established</span><span>You cannot copy an arbitrary unknown quantum state. If neural signals at N7 retain any quantum coherence, they cannot be perfectly cloned by an attacker.</span></div>
          <div class="vision-row"><span>Heisenberg: ΔxΔp >= ℏ/2</span><span>Established</span><span>Measurement precision has fundamental limits. At I0, measuring a neural signal necessarily disturbs it. This is not instrument limitation -- it is physics.</span></div>
          <div class="vision-row"><span>Tunneling: T ~ e^(-2κd)</span><span>Established</span><span>Ion channels are narrow enough (~0.3-0.5 nm selectivity filter) that quantum tunneling of ions is non-negligible. This contributes to stochasticity at N3+ bands.</span></div>
        </div>
      </div>

      <div class="vision-card">
        <h4 class="vision-heading">Step 6: One Equation Governs the Full Stack</h4>
        <p>This was the insight that unified everything: <strong>L = v / f</strong> (wavelength = propagation velocity / frequency).</p>
        <p>This is not a QIF equation. It is basic wave physics. But it reveals something remarkable about BCI architecture:</p>
        <div class="vision-stats">
          <div class="vision-stat"><span class="vision-stat-num">0.1-0.5 m/s</span><span>Unmyelinated intracortical axons</span></div>
          <div class="vision-stat"><span class="vision-stat-num">5-30 m/s</span><span>Myelinated corticocortical fibers</span></div>
          <div class="vision-stat"><span class="vision-stat-num">~2x10^8 m/s</span><span>Copper PCB traces</span></div>
          <div class="vision-stat"><span class="vision-stat-num">3x10^8 m/s</span><span>RF wireless (speed of light)</span></div>
        </div>
        <p>Brain oscillations evolved at frequencies where wavelength matches brain structure size. Bluetooth Low Energy operates at frequencies where wavelength matches device proximity. Both converge on the human body scale (~15-20 cm). The brain and the BCI are physically coupled through the same equation, operating at compatible scales.</p>
        <p>The electromagnetic wavelength (λ) and the neural spatial extent (S) are the same physical quantity: the length of one oscillation in its medium. This means one equation describes signal behavior across the entire hourglass -- from cortical oscillation to RF transmission.</p>
      </div>

      <div class="vision-card">
        <h4 class="vision-heading">Step 7: The Bottleneck Determines Security</h4>
        <p>I0 is where biology meets silicon. Measurement at this boundary collapses the wide neural state space into a narrow classical data stream. How much protection remains depends on where the electrode sits:</p>
        <div class="vision-table">
          <div class="vision-row vision-row-header"><span>Placement</span><span>Neural Layers Above</span><span>Risk Level</span></div>
          <div class="vision-row"><span>I0-cortical (on brain surface)</span><span>0 -- bypasses all biological protection</span><span>Highest</span></div>
          <div class="vision-row"><span>I0-subcortical (deep brain, e.g. DBS)</span><span>1-3 layers</span><span>High</span></div>
          <div class="vision-row"><span>I0-spinal / peripheral</span><span>5-6 layers</span><span>Moderate</span></div>
          <div class="vision-row"><span>I0-noninvasive (scalp EEG)</span><span>All 7 layers intact</span><span>Lowest</span></div>
        </div>
        <p>The thalamus at N4 acts as the brain's natural firewall. Its reticular thalamic nucleus implements something like a default-deny policy: it gates and suppresses signals before they reach cortex. Only ~50 bits per second of the 11 million bits of sensory information processed by the thalamus reach conscious awareness. A cortical implant (I0-cortical) bypasses this protection entirely.</p>
        <p>This is why the hourglass model matters for security: the depth of the interface determines how many natural protection layers are bypassed, which determines the threat surface.</p>
      </div>

      <div class="vision-card">
        <h4 class="vision-heading">What This Does Not Claim</h4>
        <p>Intellectual honesty requires stating what is <em>not</em> established:</p>
        <ul style="margin:8px 0;padding-left:20px;line-height:1.7;">
          <li>Qinnovate's approach to unifying these equations into a single per-band metric is <strong>an early-stage attempt, not a finished tool</strong>. The idea is to combine the physics above into one number that captures each band's indeterminacy. That work is ongoing and has not been independently validated.</li>
          <li>Whether quantum coherence persists long enough to matter at N7 is an <strong>open question in quantum biology</strong>. Decoherence in warm, wet neural tissue is fast. Some researchers (Penrose, Hameroff) argue coherence matters; others strongly disagree.</li>
          <li>The 7-1-3 split is <strong>one possible mapping</strong>. Other researchers might draw boundaries differently. The number of bands is a design choice informed by neuroanatomy, not dictated by it.</li>
          <li>The security implications are <strong>theoretical</strong>. No adversary has, to my knowledge, exploited quantum properties of neural signals. The model anticipates a threat surface, it does not document active exploitation.</li>
          <li>NISS scores, TARA techniques, and the Coherence Metric (Cs) built on top of this model are <strong>proposed tools that require independent validation</strong>.</li>
        </ul>
        <p>The physics is real. The architecture is proposed. The validation is ahead of us.</p>
      </div>

      <div class="vision-card">
        <h4 class="vision-heading">Sources</h4>
        <ul style="margin:8px 0;padding-left:20px;line-height:1.8;font-size:0.85rem;">
          <li>Deering, S. (1998). "Watching the Waist of the Protocol Hourglass." IETF.</li>
          <li>Kandel, E. et al. (2021). <em>Principles of Neural Science</em>, 6th ed. McGraw-Hill.</li>
          <li>Bell, J.S. (1964). "On the Einstein Podolsky Rosen Paradox." <em>Physics</em> 1(3).</li>
          <li>Aspect, A. et al. (1982). "Experimental Realization of EPR-Bohm Gedankenexperiment." <em>Phys. Rev. Lett.</em> 49(2).</li>
          <li>Hensen, B. et al. (2015). "Loophole-free Bell inequality violation." <em>Nature</em> 526.</li>
          <li>Hodgkin, A.L. & Huxley, A.F. (1952). "A quantitative description of membrane current." <em>J. Physiol.</em> 117(4).</li>
          <li>Shannon, C.E. (1948). "A Mathematical Theory of Communication." <em>Bell System Tech. J.</em> 27.</li>
          <li>Borst, J.G.G. (2010). "The low synaptic release probability in vivo." <em>TINS</em> 33(6).</li>
          <li>Sherman, S.M. (2006). "Thalamocortical interactions." <em>Current Opinion in Neurobiology</em> 16(4).</li>
          <li>Fries, P. (2015). "Rhythms for Cognition: Communication through Coherence." <em>Neuron</em> 88(1).</li>
        </ul>
      </div>
    </div>
  `;
}

function renderVision(container) {
  container.innerHTML = `
    <div class="vision-section">
      <div class="vision-intro">
        <p>How the brain sees -- and what it means for brain-computer interfaces. The visual system is the best-understood sensory pipeline in neuroscience and the most advanced target for BCI prosthetics.</p>
        <a href="https://github.com/qinnovates/qinnovate/tree/main/public/learn/autodidactive/neuroscience/vision" target="_blank" rel="noopener noreferrer" class="vision-docs-link">Full documentation on GitHub</a>
      </div>

      <div class="vision-pipeline">
        <h4 class="vision-heading">The Visual Pipeline</h4>
        <div class="vision-stages">
          <div class="vision-stage"><span class="vision-stage-icon">👁️</span><div><strong>Retina</strong><span>130M photoreceptors, 100:1 compression</span></div></div>
          <div class="vision-arrow">→</div>
          <div class="vision-stage"><span class="vision-stage-icon">⚡</span><div><strong>Optic Nerve</strong><span>~1.2M axons, ~10 Mbps</span></div></div>
          <div class="vision-arrow">→</div>
          <div class="vision-stage"><span class="vision-stage-icon">🚦</span><div><strong>LGN (Thalamus)</strong><span>95% feedback, 5% retinal input</span></div></div>
          <div class="vision-arrow">→</div>
          <div class="vision-stage"><span class="vision-stage-icon">🧠</span><div><strong>V1 Visual Cortex</strong><span>Orientation detection, Gabor filters</span></div></div>
          <div class="vision-arrow">→</div>
          <div class="vision-stage"><span class="vision-stage-icon">🎯</span><div><strong>Higher Areas</strong><span>V4 (color), MT (motion), IT (objects)</span></div></div>
        </div>
      </div>

      <div class="vision-card">
        <h4 class="vision-heading">The Computer Analogy</h4>
        <div class="vision-table">
          <div class="vision-row vision-row-header"><span>Biology</span><span>Computing</span></div>
          <div class="vision-row"><span>Photoreceptors</span><span>Image sensor pixels</span></div>
          <div class="vision-row"><span>Ganglion cells</span><span>Edge detector filters (first conv layer)</span></div>
          <div class="vision-row"><span>Optic nerve</span><span>Serial data bus (~10 Mbps)</span></div>
          <div class="vision-row"><span>LGN</span><span>Router with attention-gating policy</span></div>
          <div class="vision-row"><span>V1 simple cells</span><span>Gabor filter bank (conv layer)</span></div>
          <div class="vision-row"><span>V1 complex cells</span><span>Pooling layer (spatial invariance)</span></div>
          <div class="vision-row"><span>IT cortex</span><span>Face embedding / classification layer</span></div>
        </div>
      </div>

      <div class="vision-card">
        <h4 class="vision-heading">Retinal Cell Types</h4>
        <div class="vision-table">
          <div class="vision-row vision-row-header"><span>Type</span><span>Count</span><span>Role</span></div>
          <div class="vision-row"><span>Rods</span><span>~120M</span><span>Low-light, peripheral</span></div>
          <div class="vision-row"><span>Cones (L/M/S)</span><span>~6-7M</span><span>Color, fine detail</span></div>
          <div class="vision-row"><span>Bipolar cells</span><span>~10M</span><span>ON/OFF edge splitting</span></div>
          <div class="vision-row"><span>Ganglion cells</span><span>~1.2M</span><span>Output to optic nerve</span></div>
        </div>
      </div>

      <div class="vision-card">
        <h4 class="vision-heading">BCI Visual Prosthetics</h4>
        <div class="vision-table">
          <div class="vision-row vision-row-header"><span>Device</span><span>Approach</span><span>Status</span></div>
          <div class="vision-row"><span>Argus II</span><span>Ganglion stim (downstream)</span><span>Discontinued</span></div>
          <div class="vision-row"><span>PRIMA</span><span>Bipolar stim (upstream)</span><span>NEJM published</span></div>
          <div class="vision-row"><span>Orion</span><span>V1 cortical surface</span><span>Feasibility trial</span></div>
          <div class="vision-row"><span>BrainPort</span><span>Tongue sensory sub</span><span>FDA cleared</span></div>
        </div>
      </div>

      <div class="vision-card">
        <h4 class="vision-heading">Key Numbers</h4>
        <div class="vision-stats">
          <div class="vision-stat"><span class="vision-stat-num">~576 MP</span><span>Full-field resolution (with saccades)</span></div>
          <div class="vision-stat"><span class="vision-stat-num">100:1</span><span>Retinal compression ratio</span></div>
          <div class="vision-stat"><span class="vision-stat-num">~30%</span><span>Cortex devoted to vision</span></div>
          <div class="vision-stat"><span class="vision-stat-num">3-4/sec</span><span>Saccadic eye movements</span></div>
          <div class="vision-stat"><span class="vision-stat-num">~10 Mbps</span><span>Optic nerve bandwidth</span></div>
          <div class="vision-stat"><span class="vision-stat-num">199K/mm²</span><span>Foveal cone density</span></div>
        </div>
      </div>

      <div class="vision-card">
        <h4 class="vision-heading">QIF Band Mapping</h4>
        <div class="vision-table">
          <div class="vision-row vision-row-header"><span>Band</span><span>Structure</span><span>Visual Role</span></div>
          <div class="vision-row"><span>N7</span><span>V1, V4, MT, IT</span><span>All cortical visual processing</span></div>
          <div class="vision-row"><span>N4</span><span>LGN (thalamus)</span><span>Relay + attention gating</span></div>
          <div class="vision-row"><span>N2</span><span>Superior colliculus</span><span>Reflexes, blindsight</span></div>
          <div class="vision-row"><span>I0</span><span>Electrode boundary</span><span>Prosthetic interface</span></div>
        </div>
      </div>
    </div>
  `;
}

function renderPersonCard(p) {
  const mastery = calculateMastery(p.id);
  return `
    <div class="person-card" onclick="window._openPerson('${esc(p.id)}')">
      <div class="person-card-header">
        <span class="person-card-emoji">${p.emoji || '👤'}</span>
        <div>
          <div class="person-card-name">${esc(p.name)}</div>
          <div class="person-card-tagline">${esc(p.tagline || (p.born ? p.born + (p.died ? ' – ' + p.died : '') : ''))}</div>
        </div>
      </div>
      <p class="person-card-desc">${esc(p.description || '')}</p>
      ${mastery > 0 ? `<div class="person-card-mastery"><div class="person-card-mastery-bar" style="width:${mastery}%"></div></div>` : ''}
    </div>
  `;
}

function renderByType(grid, type, data) {
  if (type === 'timeline') {
    renderEthicsTimeline(grid);
    return;
  }

  if (type === 'neuroanatomy') {
    renderNeuroanatomy(grid);
    return;
  }

  if (type === 'mindmap') {
    renderSavedMindmap(grid);
    return;
  }

  if (type === 'hourglass-physics') {
    renderHourglassPhysics(grid);
    return;
  }

  if (type === 'vision') {
    renderVision(grid);
    return;
  }

  if (type === 'tara') {
    grid.innerHTML = '<p style="padding:20px;color:var(--text-dim);">Loading threat atlas...</p>';
    loadTARA().then(({ techniques, stats }) => renderTARA(grid, techniques, stats));
    return;
  }

  if (type === 'niss') {
    grid.innerHTML = '<p style="padding:20px;color:var(--text-dim);">Loading NISS scores...</p>';
    loadNISS().then(devices => renderNISS(grid, devices));
    return;
  }

  if (type === 'neurowall') {
    renderNeurowall(grid);
    return;
  }

  if (type === 'guardrails') {
    renderGuardrails(grid);
    return;
  }

  if (type === 'governance') {
    renderGovernance(grid);
    return;
  }

  if (type === 'bci-devices') {
    grid.innerHTML = '<p style="padding:20px;color:var(--text-dim);">Loading BCI landscape...</p>';
    loadBCICompanies().then(companies => renderBCIDevices(grid, companies));
    return;
  }

  if (type === 'brain-atlas') {
    grid.innerHTML = '<p style="padding:20px;color:var(--text-dim);">Loading brain atlas...</p>';
    loadBrainAtlas().then(regions => renderBrainAtlas(grid, regions));
    return;
  }


  if (type === 'paths') {
    if (currentPath) {
      grid.innerHTML = renderPathDetail(currentPath);
    } else {
      grid.innerHTML = `<div class="path-list">${renderPathList()}</div>`;
    }
    return;
  }

  if (type === 'labs') {
    grid.innerHTML = data.map(lab => `
      <div class="person-card" onclick="window._openLab('${lab.id}')">
        <div class="person-card-header">
          <span class="person-card-emoji">${lab.emoji}</span>
          <div>
            <div class="person-card-name">${esc(lab.name)}</div>
            <div class="person-card-tagline">${esc(lab.tagline || '')}</div>
          </div>
        </div>
        <p class="person-card-desc">${esc(lab.description || '')}</p>
      </div>
    `).join('');
    return;
  }

  // Default: people cards
  grid.innerHTML = data.map(p => renderPersonCard(p)).join('');
}

function renderConceptIndex(container) {
  const index = getConceptIndex();
  container.innerHTML = `
    <div class="concept-grid">
      ${index.map(c => `
        <div class="concept-card" onclick="window._openConcept('${esc(c.concept)}')">
          <div class="concept-card-title">${esc(c.concept)}</div>
          <div class="concept-card-count">${c.ids.length} figures</div>
        </div>
      `).join('')}
    </div>
  `;
}

function openConcept(concept) {
  currentConcept = concept;
  renderCardGrid();
}

function closeConcept() {
  currentConcept = null;
  renderCardGrid();
}

// ── Person Modal ────────────────────────────────────────────────────────────
function openPerson(personId) {
  const person = ALL_PEOPLE.find(p => p.id === personId);
  if (!person) return;

  trackStyle('cards');
  recordView(personId);

  const bookmarked = isBookmarked(personId);
  const overlay = document.getElementById('modal-overlay');
  const body = document.getElementById('modal-body');

  body.innerHTML = `
    <div class="modal-hero">
      <div class="modal-hero-top">
        <span class="modal-emoji">${person.emoji}</span>
        <button class="bookmark-btn ${bookmarked ? 'active' : ''}" onclick="window._toggleBookmark('${person.id}')">
          ${bookmarked ? '★' : '☆'}
        </button>
      </div>
      <h2 class="modal-name">${esc(person.name)}</h2>
      <div class="modal-years">${esc(person.years)}</div>
      <div class="modal-tagline">${esc(person.tagline)}</div>
      <div class="modal-mastery">
        <span class="mastery-icon">🎓</span> Mastery: ${calculateMastery(person.id)}%
      </div>
    </div>


    <div class="modal-section section-struggle">
      <h4><span class="section-icon">🔥</span> The Struggle</h4>
      <p>${esc(person.bio || person.struggles)}</p>
    </div>

    <div class="modal-section section-moment">
      <h4><span class="section-icon">⚡</span> The Moment</h4>
      <p>${esc(person.moment)}</p>
    </div>

    <div class="modal-section section-framework">
      <h4><span class="section-icon">🧠</span> The Framework</h4>
      <ul>${person.frameworks.map(f => `<li>${esc(f)}</li>`).join('')}</ul>
    </div>

    <div class="modal-section section-habits">
      <h4><span class="section-icon">🔄</span> The Habits</h4>
      <ul>${person.habits.map(h => `<li>${esc(h)}</li>`).join('')}</ul>
    </div>

    <div class="modal-section section-quotes">
      <h4><span class="section-icon">💬</span> Quotes</h4>
      ${(person.quotes || []).map(q => `<blockquote>${esc(q.text)}</blockquote>`).join('')}
    </div>

    ${person.books && person.books.length > 0 ? `
      <div class="modal-section section-books">
        <h4><span class="section-icon">📖</span> Influential Books</h4>
        ${person.books.map(b => `
          <div class="book-item">
            <div class="book-title">${esc(b.title)}</div>
            <div class="book-author">by ${esc(b.author)}</div>
            <p class="book-desc">${esc(b.desc)}</p>
          </div>
        `).join('')}
      </div>
    ` : ''}

    <div class="modal-section section-takeaways">
      <h4><span class="section-icon">🎯</span> Implement This</h4>
      ${person.takeaways.map(t => `
        <div class="takeaway-item">
          <strong>${esc(t.title)}</strong>
          <p>${esc(t.desc)}</p>
        </div>
      `).join('')}
    </div>

    <div class="modal-section section-recall">
      <h4><span class="section-icon">🧠</span> Test Your Recall</h4>
      <p>Without scrolling up - what was ${esc(person.name.split(' ')[0])}'s core framework? What was their defining struggle?</p>
      <button class="recall-reveal-btn" onclick="
        this.style.display='none';
        this.nextElementSibling.style.display='block';
      ">Reveal Summary</button>
      <div class="recall-answer" style="display:none;">
        <p><strong>Framework:</strong> ${esc(person.frameworks[0])}</p>
        <p><strong>Struggle:</strong> ${esc((person.bio || person.struggles || '').split('.').slice(0, 2).join('.') + '.')}</p>
      </div>
    </div>

    ${(() => {
      const related = getRelated(personId, 6);
      if (related.length === 0) return '';
      return `
        <div class="modal-section section-connections">
          <h4><span class="section-icon">🔗</span> Connections</h4>
          <div class="connections-grid">
            ${related.map(r => `
              <div class="connection-card" onclick="${r.isLab ? `window._openLab('${r.id}')` : `window._openPerson('${r.id}')`}">
                <span class="connection-emoji">${r.emoji}</span>
                <div class="connection-info">
                  <div class="connection-name">${esc(r.name)}</div>
                  <div class="connection-labels">${r.labels.slice(0, 2).map(l => esc(l)).join(', ')}</div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    })()}

    ${person.deepDive ? `
      <div class="modal-section section-deepdive">
        <h4><span class="section-icon">🔍</span> Go Deeper</h4>
        <div class="deepdive-links">
          <a class="deepdive-btn" href="${person.deepDive.wikipedia}" target="_blank" rel="noopener noreferrer">Wikipedia</a>
          <a class="deepdive-btn" href="${person.deepDive.stanford}" target="_blank" rel="noopener noreferrer">Stanford</a>
          <a class="deepdive-btn" href="${person.deepDive.scholar}" target="_blank" rel="noopener noreferrer">Scholar</a>
          <a class="deepdive-btn" href="${person.deepDive.youtube}" target="_blank" rel="noopener noreferrer">YouTube</a>
          <a class="deepdive-btn" href="${person.deepDive.archive}" target="_blank" rel="noopener noreferrer">Archive</a>
        </div>
      </div>
    ` : ''}
  `;

  overlay.style.display = 'flex';
  overlay.scrollTop = 0;
}

function openLab(labId) {
  const lab = CALCULUS_LABS.find(l => l.id === labId);
  if (!lab) return;

  const overlay = document.getElementById('modal-overlay');
  const body = document.getElementById('modal-body');

  body.innerHTML = `
    <div class="modal-hero">
      <span class="modal-emoji">${lab.emoji}</span>
      <h2 class="modal-name">${esc(lab.name)}</h2>
      <div class="modal-tagline">${esc(lab.description)}</div>
    </div>
    <div class="lab-frame-container">
      <iframe class="lab-frame" src="${lab.src}" title="${esc(lab.name)}" sandbox="allow-scripts allow-same-origin"></iframe>
    </div>
  `;

  overlay.style.display = 'flex';
  overlay.scrollTop = 0;
}

function closeModal() {
  document.getElementById('modal-overlay').style.display = 'none';
}

// ── Note Wall View ──────────────────────────────────────────────────────────
let noteWallInitialized = false;

function renderNoteWall() {
  const container = document.getElementById('view-notewall');
  const noteCount = (JSON.parse(localStorage.getItem('autodidactive-notes') || '[]')).length;

  container.innerHTML = `
    <div class="notewall-header">
      <h2 class="notewall-title">Notes</h2>
    </div>
    <div class="notes-description">
      <p class="notes-description-text"><strong>Your thinking space.</strong> Drop notes as they come to you — each one is timestamped automatically. When you're ready, hit the button below and the app will analyze your notes locally to find the hidden connections between your ideas. No data leaves your device.</p>
      <details class="notes-how-it-works">
        <summary>How does this work?</summary>
        <p>Your notes are analyzed using <strong>TF-IDF cosine similarity</strong> — a lightweight natural language processing technique that runs entirely in your browser. It extracts meaningful words from each note, weights them by importance, then measures how similar any two notes are based on shared concepts.</p>
        <p>Notes are also checked against Autodidactive's knowledge graph to find connections through shared thinkers, concepts, or fields. Time-based clustering groups notes taken in the same session together.</p>
        <p><strong>Privacy by design:</strong> All analysis runs client-side in JavaScript. Your notes live in localStorage. Nothing is transmitted to any server. At scale, this approach works with WebLLM or Transformers.js for richer local AI — same principle, bigger models, still on your device.</p>
      </details>
    </div>
    <div class="notes-section">
      <p class="notewall-hint">Tap anywhere to add a note. Each note is auto-timestamped.</p>
      <div class="notewall-canvas" id="notewallCanvas"></div>
    </div>
    <div class="notes-section notes-section--mindmap">
      <button class="mindmap-trigger-btn" id="mindMyBusiness" ${noteCount < 2 ? 'disabled' : ''}>
        Let's mind my business!
      </button>
      <p class="mindmap-trigger-hint">${noteCount < 2 ? 'Add at least 2 notes first.' : `${noteCount} notes ready to map.`}</p>
      <div id="mindmapContainer"></div>
    </div>
  `;

  initNoteWall(document.getElementById('notewallCanvas'));
  noteWallInitialized = true;

  // Show last generated map if one exists
  renderSavedMindmap(document.getElementById('mindmapContainer'));

  // "Let's mind my business!" button
  document.getElementById('mindMyBusiness').addEventListener('click', () => {
    const allNotes = JSON.parse(localStorage.getItem('autodidactive-notes') || '[]');
    const valid = allNotes.filter(n => n && typeof n.text === 'string' && n.text.trim().length > 0);
    generateMindmapFromNotes(valid, document.getElementById('mindmapContainer'));
  });
}

// ── AI Settings ──────────────────────────────────────────────────────────────
function renderLearningDashboard() {
  const activities = JSON.parse(localStorage.getItem('autodidactive-activity') || '{}');
  const now = new Date();
  const days = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split('T')[0];
    days.push({ key, count: activities[key] || 0 });
  }

  const max = Math.max(...days.map(d => d.count), 1);
  const cellSize = 12;
  const gap = 3;

  const heatmap = `
    <svg width="${30 * (cellSize + gap)}" height="${cellSize}" class="heatmap">
      ${days.map((d, i) => {
    const opacity = d.count > 0 ? 0.2 + (d.count / max) * 0.8 : 0.05;
    const color = d.count > 0 ? 'var(--primary)' : 'var(--border-strong)';
    return `<rect x="${i * (cellSize + gap)}" y="0" width="${cellSize}" height="${cellSize}" rx="2" fill="${color}" fill-opacity="${opacity}" title="${d.key}: ${d.count}"></rect>`;
  }).join('')}
    </svg>
  `;

  const totalActions = Object.values(activities).reduce((a, b) => a + b, 0);
  const mastered = ALL_PEOPLE.filter(p => calculateMastery(p.id) > 80).length;

  return `
    <div class="dashboard-card card">
      <div class="card-header">
        <h3 class="card-header__name">Learning Ledger</h3>
      </div>
      <div class="dashboard-heatmap-container">
        ${heatmap}
        <div class="heatmap-legend">Last 30 Days</div>
      </div>
      <div class="dashboard-stats">
        <div class="dashboard-stat">
          <div class="dashboard-stat-val">${totalActions}</div>
          <div class="dashboard-stat-label">Total Actions</div>
        </div>
        <div class="dashboard-stat">
          <div class="dashboard-stat-val">${mastered}</div>
          <div class="dashboard-stat-label">Mastered</div>
        </div>
      </div>
    </div>
  `;
}
function renderAISettings() {
  const prefs = getTutorPrefs();
  const provider = prefs.provider || 'ollama';
  const showOllama = provider === 'ollama';
  const showCloud = provider === 'openai' || provider === 'anthropic';

  return `
    <div class="settings-group">
      <div class="settings-row">
        <div class="settings-row-info">
          <div class="settings-row-label">Web Search</div>
          <div class="settings-row-desc">Fall back to DuckDuckGo when local data has no answer</div>
        </div>
        <label class="toggle">
          <input type="checkbox" id="setting-webSearch" ${prefs.webSearch !== false ? 'checked' : ''}>
          <span class="toggle-slider"></span>
        </label>
      </div>

      <div class="settings-divider"></div>

      <div class="settings-row">
        <div class="settings-row-info">
          <div class="settings-row-label">Socratic Mode</div>
          <div class="settings-row-desc">Tutor will guide you with questions instead of answers</div>
        </div>
        <label class="toggle">
          <input type="checkbox" id="setting-socraticMode" ${prefs.socraticMode ? 'checked' : ''}>
          <span class="toggle-slider"></span>
        </label>
      </div>

      <div class="settings-divider"></div>

      <div class="settings-row">
        <div class="settings-row-info">
          <div class="settings-row-label">AI Provider</div>
          <div class="settings-row-desc">Choose an LLM for richer responses (optional)</div>
        </div>
        <select id="setting-provider" class="settings-select">
          <option value="none" ${!prefs.tier2 && !prefs.tier3 ? 'selected' : ''}>None</option>
          <option value="webllm" ${prefs.tier2 && !prefs.tier3 ? 'selected' : ''}>WebLLM (on-device)</option>
          <option value="ollama" ${prefs.tier3 && provider === 'ollama' ? 'selected' : ''}>Ollama (local)</option>
          <option value="openai" ${prefs.tier3 && provider === 'openai' ? 'selected' : ''}>OpenAI</option>
          <option value="anthropic" ${prefs.tier3 && provider === 'anthropic' ? 'selected' : ''}>Anthropic</option>
        </select>
      </div>

      <div id="settings-ollama" class="settings-extra" style="display:${prefs.tier3 && showOllama ? 'block' : 'none'}">
        <div class="settings-field">
          <label class="settings-field-label" for="setting-ollamaUrl">Ollama URL</label>
          <input type="text" id="setting-ollamaUrl" class="settings-input" value="${esc(prefs.ollamaUrl || 'http://localhost:11434')}" placeholder="http://localhost:11434">
        </div>
        <div class="settings-field">
          <label class="settings-field-label" for="setting-ollamaModel">Model</label>
          <input type="text" id="setting-ollamaModel" class="settings-input" value="${esc(prefs.ollamaModel || 'llama3.2')}" placeholder="llama3.2">
        </div>
      </div>

      <div id="settings-cloud" class="settings-extra" style="display:${prefs.tier3 && showCloud ? 'block' : 'none'}">
        <div class="settings-field">
          <label class="settings-field-label" for="setting-apiKey">API Key</label>
          <input type="password" id="setting-apiKey" class="settings-input" value="${esc(prefs.apiKey || '')}" placeholder="sk-...">
        </div>
        <div class="settings-field">
          <label class="settings-field-label" for="setting-cloudModel">Model</label>
          <input type="text" id="setting-cloudModel" class="settings-input" value="${esc(prefs.cloudModel || 'gpt-4o-mini')}" placeholder="gpt-4o-mini">
        </div>
        ${provider === 'anthropic' ? '<p class="settings-note">Anthropic requires the <code>anthropic-dangerous-direct-browser-access</code> header. If CORS blocks requests, use Ollama or OpenAI instead.</p>' : ''}
      </div>

      <div id="settings-test-row" class="settings-row" style="display:${prefs.tier3 ? 'flex' : 'none'}">
        <button id="setting-testBtn" class="settings-test-btn">Test Connection</button>
        <span id="setting-testResult" class="settings-test-result"></span>
      </div>

      <div id="settings-tier2-status" style="display:${prefs.tier2 && !prefs.tier3 ? 'block' : 'none'}">
        <p class="settings-note" id="tutor-tier2-status">WebLLM will load a ~1.7GB model in your browser on first use.</p>
      </div>
    </div>
  `;
}

function initAISettingsHandlers() {
  const webSearchEl = document.getElementById('setting-webSearch');
  const providerEl = document.getElementById('setting-provider');
  const testBtn = document.getElementById('setting-testBtn');

  if (webSearchEl) {
    webSearchEl.addEventListener('change', () => {
      setTutorPref('webSearch', webSearchEl.checked);
    });
  }

  const socraticEl = document.getElementById('setting-socraticMode');
  if (socraticEl) {
    socraticEl.addEventListener('change', () => {
      setTutorPref('socraticMode', socraticEl.checked);
    });
  }

  if (providerEl) {
    providerEl.addEventListener('change', () => {
      const val = providerEl.value;
      if (val === 'none') {
        setTutorPref('tier2', false);
        setTutorPref('tier3', false);
      } else if (val === 'webllm') {
        setTutorPref('tier2', true);
        setTutorPref('tier3', false);
        initTier2();
      } else {
        setTutorPref('tier2', false);
        setTutorPref('tier3', true);
        setTutorPref('provider', val);
        // Update default model for provider
        if (val === 'anthropic') setTutorPref('cloudModel', 'claude-sonnet-4-20250514');
        else if (val === 'openai') setTutorPref('cloudModel', 'gpt-4o-mini');
      }

      // Show/hide relevant fields
      const ollamaSection = document.getElementById('settings-ollama');
      const cloudSection = document.getElementById('settings-cloud');
      const testRow = document.getElementById('settings-test-row');
      const tier2Status = document.getElementById('settings-tier2-status');

      if (ollamaSection) ollamaSection.style.display = val === 'ollama' ? 'block' : 'none';
      if (cloudSection) cloudSection.style.display = (val === 'openai' || val === 'anthropic') ? 'block' : 'none';
      if (testRow) testRow.style.display = (val === 'ollama' || val === 'openai' || val === 'anthropic') ? 'flex' : 'none';
      if (tier2Status) tier2Status.style.display = val === 'webllm' ? 'block' : 'none';

      // Update cloud model display
      const cloudModelEl = document.getElementById('setting-cloudModel');
      if (cloudModelEl) {
        const prefs = getTutorPrefs();
        cloudModelEl.value = prefs.cloudModel || 'gpt-4o-mini';
      }
    });
  }

  // Persist field changes on blur
  for (const [id, key] of [['setting-ollamaUrl', 'ollamaUrl'], ['setting-ollamaModel', 'ollamaModel'], ['setting-apiKey', 'apiKey'], ['setting-cloudModel', 'cloudModel']]) {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('change', () => setTutorPref(key, el.value));
    }
  }

  if (testBtn) {
    testBtn.addEventListener('click', async () => {
      const resultEl = document.getElementById('setting-testResult');
      testBtn.disabled = true;
      testBtn.textContent = 'Testing...';
      if (resultEl) resultEl.textContent = '';

      const result = await testConnection();
      testBtn.disabled = false;
      testBtn.textContent = 'Test Connection';
      if (resultEl) {
        resultEl.textContent = result.message;
        resultEl.className = `settings-test-result ${result.ok ? 'settings-test-ok' : 'settings-test-fail'}`;
      }
    });
  }
}

// ── Profile View ────────────────────────────────────────────────────────────
function renderProfile() {
  const container = document.getElementById('view-profile');
  const streak = getStreak();
  const stats = getStats();
  const sr = getSRData();
  const dueCount = Object.values(sr).filter(card => {
    const dueTime = card.lastSeen + card.interval * 86400000;
    return Date.now() >= dueTime && card.reviews >= 1;
  }).length;

  container.innerHTML = `
    <div class="profile-header">
      <h2 class="profile-title">Profile</h2>
    </div>

    <div class="profile-streak">
      <div class="streak-badge-large">
        <span class="streak-fire-large">🔥</span>
        <span class="streak-number">${streak.count}</span>
      </div>
      <div class="streak-label">Day Streak</div>
    </div>

    <div class="stat-grid">
      <div class="stat-card">
        <div class="stat-number">${stats.viewed.length}</div>
        <div class="stat-label">Cards Viewed</div>
      </div>
      <div class="stat-card">
        <div class="stat-number">${stats.fieldsExplored.length}</div>
        <div class="stat-label">Fields Explored</div>
      </div>
      <div class="stat-card">
        <div class="stat-number">${stats.bookmarked.length}</div>
        <div class="stat-label">Bookmarked</div>
      </div>
      <div class="stat-card">
        <div class="stat-number">${dueCount}</div>
        <div class="stat-label">Due for Review</div>
      </div>
    </div>

    ${stats.bookmarked.length > 0 ? `
      <div class="profile-section">
        <h3 class="profile-section-title">Bookmarked</h3>
        <div class="bookmark-list">
          ${stats.bookmarked.map(id => {
    const p = ALL_PEOPLE.find(pp => pp.id === id);
    if (!p) return '';
    return `
              <div class="bookmark-item" onclick="window._openPerson('${p.id}')">
                <span class="bookmark-emoji">${p.emoji}</span>
                <div>
                  <div class="bookmark-name">${esc(p.name)}</div>
                  <div class="bookmark-field">${esc(p.field)}</div>
                </div>
              </div>
            `;
  }).join('')}
        </div>
      </div>
    ` : ''}

    <div class="profile-section">
      <h3 class="profile-section-title">AI & Search</h3>
      ${renderAISettings()}
    </div>

    <div class="profile-section">
      <h3 class="profile-section-title">Learning Style</h3>
      ${(() => {
      const style = getLearningStyle();
      return `<p class="profile-about"><strong>${esc(style.style)}</strong> — ${esc(style.desc)}</p>`;
    })()}
    </div>

    <div class="profile-section">
      <h3 class="profile-section-title">About Autodidactive</h3>
      <p class="profile-about">A daily learning companion featuring ${ALL_PEOPLE.length} historical figures across ${FIELDS.length - 1} disciplines. Built for daily scrolling and active recall.</p>
      <p class="profile-about">All data stored locally on your device. No account needed.</p>
    </div>
  `;

  // Defer event handler init to next tick (after DOM update)
  requestAnimationFrame(() => initAISettingsHandlers());
}

// ── Search Overlay ──────────────────────────────────────────────────────────
let searchDebounce = null;

function openSearch() {
  const overlay = document.getElementById('search-overlay');
  overlay.style.display = 'flex';
  const input = document.getElementById('search-input');
  input.value = '';
  input.focus();
  document.getElementById('search-results').innerHTML = '';
}

function closeSearch() {
  document.getElementById('search-overlay').style.display = 'none';
}

function handleSearchInput(e) {
  clearTimeout(searchDebounce);
  searchDebounce = setTimeout(() => {
    const query = e.target.value.trim();
    const container = document.getElementById('search-results');
    if (query.length < 2) { container.innerHTML = ''; return; }

    const results = search(query, 20);
    const grouped = groupResults(results);

    let html = '';
    for (const [type, items] of Object.entries(grouped)) {
      html += `<div class="search-group"><div class="search-group-title">${esc(type)}</div>`;
      for (const item of items) {
        const searchAction = item.type === 'Labs' ? 'openLab'
          : (item.type === 'People' || item.type === 'Quotes' || item.type === 'Books') ? 'openPerson'
            : 'close';
        html += `
          <div class="search-result-item" data-search-action="${searchAction}" data-search-id="${esc(item.id || '')}">
            <div class="search-result-source">${esc(item.source)}</div>
            <div class="search-result-snippet">${highlightMatch(item.snippet, query)}</div>
            <div class="search-result-field">${esc(item.field)}</div>
          </div>
        `;
      }
      html += '</div>';
    }
    if (results.length === 0) html = '<div class="search-empty">No results found.</div>';
    container.innerHTML = html;
  }, 150);
}

// ── Paths UI ────────────────────────────────────────────────────────────────
let currentPath = null;

function openPath(pathId) {
  navigate('learn');
  currentCategory = 'paths';
  currentPath = pathId;
  renderLearn();
  // Close tutor panel if open
  const tutor = document.getElementById('tutor-panel');
  if (tutor && tutor.style.display !== 'none') closeTutor();
}

function showPaths() {
  currentPath = null;
  currentCategory = 'paths';
  renderLearn();
}

// ── Canvas UI ───────────────────────────────────────────────────────────────
let canvasInitialized = false;

function openCanvas() {
  const view = document.getElementById('canvas-view');
  view.style.display = 'flex';
  document.querySelector('.app').style.display = 'none';
  document.querySelector('.tab-nav').style.display = 'none';
  document.getElementById('tutor-fab').style.display = 'none';

  if (!canvasInitialized) {
    initCanvas(document.getElementById('canvas-container'));
    canvasInitialized = true;
  }
  syncNotes();
  document.getElementById('canvas-tray').innerHTML = renderTray();
  document.getElementById('canvas-controls-container').innerHTML = renderCanvasControls();
}


function closeCanvas() {
  document.getElementById('canvas-view').style.display = 'none';
  document.querySelector('.app').style.display = '';
  document.querySelector('.tab-nav').style.display = '';
  document.getElementById('tutor-fab').style.display = '';
  stopAnimation();
}

function showOnCanvas(idsJson) {
  const ids = typeof idsJson === 'string' ? JSON.parse(idsJson) : idsJson;
  openCanvas();
  addPathToCanvas(ids);
}

// ── Tutor UI ────────────────────────────────────────────────────────────────
function openTutor() {
  const panel = document.getElementById('tutor-panel');
  panel.style.display = 'flex';
  document.getElementById('tutor-messages').innerHTML = renderChat();
  document.getElementById('tutor-input').focus();
  scrollTutorToBottom();
}

function closeTutor() {
  document.getElementById('tutor-panel').style.display = 'none';
}

async function sendTutorMessage() {
  const input = document.getElementById('tutor-input');
  const query = input.value.trim();
  if (!query) return;
  input.value = '';
  input.disabled = true;

  // Show loading state
  const msgs = document.getElementById('tutor-messages');
  msgs.innerHTML = renderChat() + '<div class="tutor-msg tutor-msg--tutor" id="tutor-loading"><div class="tutor-msg-text tutor-thinking">Thinking...</div></div>';
  scrollTutorToBottom();

  try {
    const prefs = getTutorPrefs();
    let response;
    if (prefs.tier3) {
      response = await processMessageTier3(query);
    } else if (prefs.tier2) {
      const { processMessageTier2 } = await import('./tutor.js');
      response = await processMessageTier2(query);
    } else {
      response = await processMessage(query);
    }

    msgs.innerHTML = renderChat();
    scrollTutorToBottom();
  } catch (err) {
    const loading = document.getElementById('tutor-loading');
    if (loading) loading.remove();
    console.error('[Tutor] Error:', err);
  } finally {
    input.disabled = false;
    input.focus();
  }
}

function scrollTutorToBottom() {
  const msgs = document.getElementById('tutor-messages');
  if (msgs) msgs.scrollTop = msgs.scrollHeight;
}

// ── Global Handlers ─────────────────────────────────────────────────────────
window._navigate = navigate;
window._renderHome = renderHome;
window._openPerson = (id) => { trackStyle('cards'); openPerson(id); };
window._openLab = openLab;
window._toggleBookmark = (id) => {
  toggleBookmark(id);
  const btn = document.querySelector('.bookmark-btn');
  if (btn) {
    const bookmarked = isBookmarked(id);
    btn.classList.toggle('active', bookmarked);
    btn.textContent = bookmarked ? '★' : '☆';
  }
};
window._processRecall = (id, correct) => {
  trackStyle('recall');
  processRecall(id, correct);
  const card = document.getElementById('recallCard');
  if (card) {
    card.innerHTML = `<div class="recall-done">${correct ? 'Nice! See you again in a few days.' : 'No worries. You\'ll see this one again soon.'}</div>`;
    setTimeout(() => card.remove(), 2000);
  }
};

// Search
window._openSearch = openSearch;
window._closeSearch = closeSearch;

// Paths
window._openPath = (id) => { currentConcept = null; openPath(id); };
window._showPaths = () => { currentConcept = null; showPaths(); };
window._markPathStep = (pathId, idx) => { markStepComplete(pathId, idx); trackStyle('paths'); };

// Concepts
window._openConcept = openConcept;
window._closeConcept = closeConcept;


// Canvas
window._openCanvas = openCanvas;
window._closeCanvas = closeCanvas;
window._addToCanvas = (id) => { addNodeToCanvas(id); trackStyle('canvas'); };
window._setCanvasLayout = setLayout;
window._saveCanvas = () => {
  const name = prompt('Canvas name:');
  if (name) saveCanvas(name);
};
window._loadCanvas = loadCanvas;
window._clearCanvas = () => { location.reload(); };
window._branchOut = (id) => { branchOut(id); if (window._updateCanvasControls) window._updateCanvasControls(); };
window._updateCanvasControls = () => {
  const container = document.getElementById('canvas-controls-container');
  if (container) container.innerHTML = renderCanvasControls();
};
window._syncNotesToCanvas = syncNotes;
window._setLayout = setLayout;
window._showOnCanvas = showOnCanvas;



// Tutor
window._openTutor = openTutor;
window._closeTutor = closeTutor;
window._tutorAsk = async (query) => {
  document.getElementById('tutor-input').value = query;
  await sendTutorMessage();
};

// ── Consent Gate ────────────────────────────────────────────────────────────
const CONSENT_KEY = 'autodidactive-consent';

function showConsentModal() {
  if (localStorage.getItem(CONSENT_KEY) === 'accepted') return false;

  const overlay = document.createElement('div');
  overlay.className = 'consent-overlay';
  overlay.innerHTML = `
    <div class="consent-modal" role="dialog" aria-modal="true" aria-labelledby="consent-title">
      <h2 id="consent-title" class="consent-title">Welcome to Autodidactive</h2>
      <div class="consent-body">
        <p>This is an early-stage MVP and a placeholder for something bigger. Right now, it helps me stay on track with learning while I finish my applications. It is bare-bones by design.</p>
        <p>The long-term goal is to build this into an accessible learning tool for anyone interested in neurosecurity, neuroethics, and BCI work — starting with full ADA/WCAG accessibility, then expanding toward BCI-compatible interfaces.</p>
        <p>I see this being genuinely useful for students entering this field, and I plan to develop it further once my applications are done. For now, consider this a foundation.</p>
        <p class="consent-storage">This app uses <strong>localStorage</strong> to save your notes, mindmaps, and learning progress. All data stays in your browser and is never transmitted to any server.</p>
      </div>
      <button class="consent-btn" id="consentAccept">I consent</button>
    </div>
  `;

  document.body.appendChild(overlay);
  document.getElementById('consentAccept').addEventListener('click', () => {
    localStorage.setItem(CONSENT_KEY, 'accepted');
    overlay.remove();
    initApp();
  });
  document.getElementById('consentAccept').focus();
  return true;
}

function initApp() {
  // Tab navigation
  document.querySelectorAll('.tab-nav__item').forEach(btn => {
    btn.addEventListener('click', () => navigate(btn.dataset.view));
  });

  // Modal close
  document.getElementById('modal-close').addEventListener('click', closeModal);
  document.getElementById('modal-overlay').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeModal();
  });

  // Search
  document.getElementById('search-input').addEventListener('input', handleSearchInput);
  // Delegated click handler for search results (avoids inline onclick injection)
  document.getElementById('search-results').addEventListener('click', (e) => {
    const item = e.target.closest('.search-result-item[data-search-action]');
    if (!item) return;
    const action = item.dataset.searchAction;
    const id = item.dataset.searchId;
    if (action === 'openLab' && window._openLab) window._openLab(id);
    else if (action === 'openPerson' && window._openPerson) window._openPerson(id);
    window._closeSearch && window._closeSearch();
  });
  document.getElementById('search-close').addEventListener('click', closeSearch);
  document.getElementById('search-overlay').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeSearch();
  });

  // Tutor
  initTutorActionDelegation(document.getElementById('tutor-messages'));
  document.getElementById('tutor-send').addEventListener('click', sendTutorMessage);
  document.getElementById('tutor-input').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') sendTutorMessage();
  });

  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (document.getElementById('search-overlay').style.display !== 'none') closeSearch();
      else if (document.getElementById('tutor-panel').style.display !== 'none') closeTutor();
      else if (document.getElementById('canvas-view').style.display !== 'none') closeCanvas();
      else closeModal();
    }
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      openSearch();
    }
  });

  // Check URL hash for deep link
  const hash = window.location.hash.slice(1);
  if (hash) {
    const person = ALL_PEOPLE.find(p => p.id === hash);
    if (person) {
      navigate('learn');
      setTimeout(() => openPerson(person.id), 100);
      return;
    }
  }

  // Default: home
  navigate('home');
  updateStreak();

  // Init Tier 2 if opted in
  initTier2();
}

// ── Init ────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  if (!showConsentModal()) {
    initApp();
  }
});
