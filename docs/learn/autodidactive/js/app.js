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
  { id: 'calculus', label: 'Calculus', data: CALCULUS_LABS }
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
  const sr = getSRData();
  if (!sr[personId]) {
    sr[personId] = { lastSeen: Date.now(), interval: 1, easeFactor: 2.5, reviews: 0 };
  } else {
    sr[personId].lastSeen = Date.now();
    sr[personId].reviews++;
  }
  localStorage.setItem(SR_KEY, JSON.stringify(sr));
}

function processRecall(personId, correct) {
  const sr = getSRData();
  const card = sr[personId];
  if (!card) return;

  if (correct) {
    if (card.reviews === 0) card.interval = 1;
    else if (card.reviews === 1) card.interval = 3;
    else card.interval = Math.round(card.interval * card.easeFactor);
    card.easeFactor = Math.max(1.3, card.easeFactor + 0.1);
  } else {
    card.interval = 1;
    card.easeFactor = Math.max(1.3, card.easeFactor - 0.2);
  }
  card.reviews++;
  card.lastSeen = Date.now();
  localStorage.setItem(SR_KEY, JSON.stringify(sr));
}

function getDueRecallCard() {
  const sr = getSRData();
  const now = Date.now();
  const due = Object.entries(sr)
    .filter(([, card]) => {
      const dueTime = card.lastSeen + card.interval * 86400000;
      return now >= dueTime && card.reviews >= 1;
    })
    .sort((a, b) => a[1].lastSeen - b[1].lastSeen);

  if (due.length === 0) return null;
  const [personId] = due[0];
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
            background: ${['#fef3c7','#fce7f3','#d1fae5','#dbeafe','#ede9fe'][n.color || 0]};
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

  return `
    <div class="recall-card" id="recallCard">
      <div class="recall-label">Active Recall</div>
      <p class="recall-question">${esc(q.q)}</p>
      <button class="recall-reveal-btn" onclick="
        this.style.display='none';
        document.getElementById('recallAnswer').style.display='block';
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

  const field = FIELDS.find(f => f.id === currentField);
  if (!field) return;

  if (currentField === 'calculus') {
    grid.innerHTML = field.data.map(lab => `
      <div class="card lab-card" onclick="window._openLab('${lab.id}')">
        <div class="card-header">
          <div class="avatar" style="background: ${hashColor(lab.id)}">${lab.emoji}</div>
          <div class="card-header__info">
            <h3 class="card-header__name">${esc(lab.name)}</h3>
            <div class="card-header__tagline">${esc(lab.tagline)}</div>
          </div>
        </div>
        <div class="card-fields">
          ${lab.topics.map(t => `<span class="field-tag">${esc(t)}</span>`).join('')}
        </div>
        <div class="card-difficulty">
          <span class="difficulty-badge difficulty-${lab.difficulty}">${lab.difficulty}</span>
        </div>
      </div>
    `).join('');
    return;
  }

  grid.innerHTML = field.data.map(person => `
    <div class="card" onclick="window._openPerson('${person.id}')" data-person-id="${person.id}">
      <div class="card-header">
        <div class="avatar" style="background: ${hashColor(person.id)}">${person.emoji}</div>
        <div class="card-header__info">
          <h3 class="card-header__name">${esc(person.name)}</h3>
          <div class="card-header__dates">${esc(person.years)}</div>
          <div class="card-header__tagline">${esc(person.tagline)}</div>
        </div>
      </div>
      <div class="card-fields">
        ${person.fields.map(f => `<span class="field-tag">${esc(f)}</span>`).join('')}
      </div>
      ${person.quotes && person.quotes[0] ? `<div class="card-quote">"${esc(person.quotes[0].text).slice(0, 80)}${person.quotes[0].text.length > 80 ? '...' : ''}"</div>` : ''}
    </div>
  `).join('');
}

// ── Person Modal ────────────────────────────────────────────────────────────
function openPerson(personId) {
  const person = ALL_PEOPLE.find(p => p.id === personId);
  if (!person) return;

  trackView(personId, currentField);
  recordView(personId);

  const bookmarked = isBookmarked(personId);
  const overlay = document.getElementById('modal-overlay');
  const body = document.getElementById('modal-body');

  // Find books for this person from INFLUENTIAL_BOOKS
  const personBooks = person.books && person.books.length > 0
    ? person.books
    : INFLUENTIAL_BOOKS.filter(b => b.reader === person.name);

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
      ${person.quotes.map(q => `
        <div class="quote-block">
          <p class="quote-text">"${esc(q.text)}"</p>
          <span class="quote-attr">- ${esc(q.src)}</span>
        </div>
      `).join('')}
    </div>

    ${personBooks.length > 0 ? `
      <div class="modal-section section-books">
        <h4><span class="section-icon">📖</span> Influential Books</h4>
        ${personBooks.map(b => `
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
      <h3 class="profile-section-title">About Autodidactive</h3>
      <p class="profile-about">A daily learning companion featuring ${ALL_PEOPLE.length} historical figures across ${FIELDS.length - 1} disciplines. Built for daily scrolling and active recall.</p>
      <p class="profile-about">All data stored locally on your device. No account needed.</p>
    </div>
  `;
}

// ── Global Handlers ─────────────────────────────────────────────────────────
window._navigate = navigate;
window._openPerson = openPerson;
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
  processRecall(id, correct);
  const card = document.getElementById('recallCard');
  if (card) {
    card.innerHTML = `<div class="recall-done">${correct ? 'Nice! See you again in a few days.' : 'No worries. You\'ll see this one again soon.'}</div>`;
    setTimeout(() => card.remove(), 2000);
  }
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
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
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
});
