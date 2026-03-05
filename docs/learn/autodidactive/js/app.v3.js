// Autodidactive — Main App Router & View Logic
import { POLYMATHS } from './data/polymaths.js';
import { PHILOSOPHERS } from './data/philosophers.js';
import { NEUROETHICS_PEOPLE } from './data/neuroethics.js';
import { NEUROSCIENCE } from './data/neuroscience.js';
import { QUANTUM } from './data/quantum.js';
import { CYBERSECURITY } from './data/cybersecurity.js';
import { PATTERNS, IMPLEMENT_PRACTICES, INFLUENTIAL_BOOKS } from './data/patterns.js';
import { CALCULUS_LABS } from './data/calculus.js';
import { initNoteWall, getNotesForBackground } from './notewall.js';
import { getRelated, getPathWithEdges, getAllNodes, getAllEdges } from './graph.js';
import { search, highlightMatch, groupResults } from './search.js';
import { renderPathList, renderPathDetail, markStepComplete, LEARNING_PATHS } from './paths.js';
import { initCanvas, addNodeToCanvas, addPathToCanvas, setLayout, renderTray, renderCanvasControls, saveCanvas, loadCanvas, stopAnimation, getActiveContext, syncNotes } from './canvas.js';
import { processMessage, processMessageTier3, renderChat, clearChat, trackStyle, getLearningStyle, getTutorPrefs, setTutorPref, initTier2, testConnection, processSynthesis } from './tutor.js';

// ── All People ──────────────────────────────────────────────────────────────
const ALL_PEOPLE = [
  ...POLYMATHS,
  ...PHILOSOPHERS,
  ...NEUROETHICS_PEOPLE,
  ...NEUROSCIENCE,
  ...QUANTUM,
  ...CYBERSECURITY
];

const FIELDS = [
  { id: 'all', label: 'All', data: ALL_PEOPLE },
  { id: 'polymaths', label: 'Polymaths', data: POLYMATHS },
  { id: 'philosophers', label: 'Philosophy', data: PHILOSOPHERS },
  { id: 'neuroethics', label: 'Neuroethics', data: NEUROETHICS_PEOPLE },
  { id: 'neuroscience', label: 'Neuroscience', data: NEUROSCIENCE },
  { id: 'quantum', label: 'Quantum', data: QUANTUM },
  { id: 'cybersecurity', label: 'Cybersecurity', data: CYBERSECURITY },
  { id: 'calculus', label: 'Calculus', data: CALCULUS_LABS },
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
  return ALL_PEOPLE.find(p => p.id === due[0][0]) || null;
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

  container.innerHTML = `
    <div class="learn-header">
      <h2 class="learn-title">Learn</h2>
      <button class="search-btn" onclick="window._openSearch()" aria-label="Search">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
      </button>
    </div>
    <div class="field-chips" id="fieldChips">
      ${FIELDS.map(f => `
        <button class="chip ${f.id === currentField ? 'active' : ''}" data-field="${f.id}">
          ${f.label}
          <span class="chip-count">${f.data.length}</span>
        </button>
      `).join('')}
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
    <div class="card-grid" id="cardGrid"></div>
  `;

  // Render cards
  renderCardGrid();

  // Field chip handlers
  container.querySelectorAll('.chip').forEach(chip => {
    chip.addEventListener('click', () => {
      currentField = chip.dataset.field;
      container.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      renderCardGrid();
    });
  });
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


function renderPersonCard(p) {
  const mastery = calculateMastery(p.id);
  const bookmarked = isBookmarked(p.id);
  return `
    <div class="card" onclick="window._openPerson('${p.id}')">
      <div class="card-header">
        <span class="card-header__emoji">${p.emoji}</span>
        <div class="card-header__info">
          <div class="card-header__name">${esc(p.name)}</div>
          <div class="card-header__dates">${esc(p.years)}</div>
        </div>
      </div>
      <div class="card-header__tagline">${esc(p.tagline)}</div>
      ${p.fields ? `<div class="card-fields">${p.fields.map(f => `<span class="field-tag">${esc(f)}</span>`).join('')}</div>` : ''}
      ${mastery > 0 ? `<div class="card-difficulty">${mastery}% mastery</div>` : ''}
    </div>
  `;
}

function renderCardGrid() {
  const grid = document.getElementById('cardGrid');
  if (!grid) return;

  if (currentField === 'Concepts') {
    renderConceptIndex(grid);
    return;
  }

  if (currentField === 'paths' || currentField === 'Paths') {
    if (currentPath) {
      grid.innerHTML = renderPathDetail(currentPath);
    } else {
      grid.innerHTML = `<div class="path-list">${renderPathList()}</div>`;
    }
    return;
  }

  // Handle standard field filtering OR concept filtering
  let people = ALL_PEOPLE;
  if (currentConcept) {
    const conceptData = getConceptIndex().find(c => c.concept === currentConcept);
    if (conceptData) {
      people = ALL_PEOPLE.filter(p => conceptData.ids.includes(p.id));
    }
  } else if (currentField && currentField !== 'all' && currentField !== 'All') {
    const fieldDef = FIELDS.find(f => f.id === currentField);
    if (fieldDef) {
      people = fieldDef.data;
    }
  }

  const conceptHeader = currentConcept
    ? `<div class="concept-header"><button class="concept-back-btn" onclick="window._closeConcept()">← Concepts</button> <h2 class="concept-title">${esc(currentConcept)}</h2></div>`
    : '';

  grid.innerHTML = conceptHeader + people.map(p => renderPersonCard(p)).join('');
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
  if (!noteWallInitialized) {
    container.innerHTML = `
      <div class="notewall-header">
        <h2 class="notewall-title">Note Wall</h2>
        <p class="notewall-hint">Tap anywhere to add a note</p>
      </div>
      <div class="notewall-canvas" id="notewallCanvas"></div>
    `;
    initNoteWall(document.getElementById('notewallCanvas'));
    noteWallInitialized = true;
  }
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
        const onclick = item.type === 'Labs' ? `window._openLab('${item.id}'); window._closeSearch();`
          : item.type === 'People' || item.type === 'Quotes' || item.type === 'Books' ? `window._openPerson('${item.id}'); window._closeSearch();`
            : `window._closeSearch();`;
        html += `
          <div class="search-result-item" onclick="${onclick}">
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
  currentField = 'paths';
  currentPath = pathId;
  renderCardGrid();
  // Close tutor panel if open
  const tutor = document.getElementById('tutor-panel');
  if (tutor && tutor.style.display !== 'none') closeTutor();
}

function showPaths() {
  currentPath = null;
  currentField = 'paths';
  renderCardGrid();
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

// ── Init ────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
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
  document.getElementById('search-close').addEventListener('click', closeSearch);
  document.getElementById('search-overlay').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeSearch();
  });

  // Tutor
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
});
