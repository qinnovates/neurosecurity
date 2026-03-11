// ═══════════════════════════════════════════════════════════════════════════════
// Ethics Timeline Wall — Interactive vertical timeline of ethics philosophers
// ═══════════════════════════════════════════════════════════════════════════════

import { ETHICS_TIMELINE } from './data/ethics.js';

// ── Escape HTML ──────────────────────────────────────────────────────────────
function esc(str) {
  const div = document.createElement('div');
  div.textContent = str || '';
  return div.innerHTML;
}

// ── Region Config ────────────────────────────────────────────────────────────
const REGIONS = [
  { id: 'all', label: 'All' },
  { id: 'western', label: 'Western', color: '#3b82f6' },
  { id: 'eastern-chinese', label: 'Chinese', color: '#ef4444' },
  { id: 'eastern-indian', label: 'Indian', color: '#f59e0b' },
  { id: 'eastern-japanese', label: 'Japanese', color: '#ec4899' },
  { id: 'middle-eastern', label: 'Islamic', color: '#10b981' },
  { id: 'african', label: 'African', color: '#8b5cf6' }
];

function getRegionColor(region) {
  const r = REGIONS.find(reg => reg.id === region);
  return r ? r.color : '#64748b';
}

// ── State ────────────────────────────────────────────────────────────────────
let currentRegion = 'all';
let observer = null;

// ── Render Timeline ──────────────────────────────────────────────────────────
export function renderEthicsTimeline(container) {
  const filtered = currentRegion === 'all'
    ? ETHICS_TIMELINE
    : ETHICS_TIMELINE.filter(entry => {
        if (entry.isContext) return true;
        return entry.region === currentRegion;
      });

  // Remove context markers that have no philosopher entries near them
  const cleaned = filterOrphanedContextMarkers(filtered);

  container.innerHTML = `
    <div class="ethics-timeline">
      <div class="ethics-region-pills">
        ${REGIONS.map(r => `
          <button class="ethics-region-pill ${r.id === currentRegion ? 'active' : ''}"
                  data-region="${r.id}"
                  ${r.color ? `style="--pill-color: ${r.color}"` : ''}>
            ${esc(r.label)}
          </button>
        `).join('')}
      </div>

      <div class="ethics-timeline-wall">
        ${cleaned.map(entry => entry.isContext
          ? renderContextMarker(entry)
          : renderTimelineCard(entry)
        ).join('')}
      </div>
    </div>
  `;

  // Region pill handlers
  container.querySelectorAll('.ethics-region-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      currentRegion = pill.dataset.region;
      renderEthicsTimeline(container);
    });
  });

  // Card click handlers
  container.querySelectorAll('.ethics-card').forEach(card => {
    card.addEventListener('click', () => {
      const id = card.dataset.id;
      const entry = ETHICS_TIMELINE.find(e => e.id === id);
      if (entry) openEthicsDetail(entry);
    });
  });

  // Scroll animation with IntersectionObserver
  setupScrollAnimation(container);
}

// ── Filter orphaned context markers ──────────────────────────────────────────
function filterOrphanedContextMarkers(entries) {
  const result = [];
  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    if (!entry.isContext) {
      result.push(entry);
      continue;
    }
    // Check if there's at least one non-context entry after this context
    // before the next context marker (or end)
    let hasContent = false;
    for (let j = i + 1; j < entries.length; j++) {
      if (entries[j].isContext) break;
      hasContent = true;
      break;
    }
    // Also check if there's content before this context
    let hadContent = false;
    for (let j = i - 1; j >= 0; j--) {
      if (entries[j].isContext) break;
      hadContent = true;
      break;
    }
    if (hasContent || hadContent) {
      result.push(entry);
    }
  }
  return result;
}

// ── Render a context marker ──────────────────────────────────────────────────
function renderContextMarker(entry) {
  return `
    <div class="ethics-context-marker ethics-animate">
      <span class="ethics-context-line"></span>
      <span class="ethics-context-text">${esc(entry.years)} &mdash; ${esc(entry.label)}</span>
      <span class="ethics-context-line"></span>
    </div>
  `;
}

// ── Render a timeline card ───────────────────────────────────────────────────
function renderTimelineCard(entry) {
  const color = getRegionColor(entry.region);
  return `
    <div class="ethics-card ethics-animate" data-id="${esc(entry.id)}" style="--region-color: ${color}">
      <div class="ethics-card-header">
        <span class="ethics-card-emoji">${entry.emoji}</span>
        <div class="ethics-card-title">
          <div class="ethics-card-name">${esc(entry.name)}</div>
          <div class="ethics-card-years">${esc(entry.years)}</div>
        </div>
        <span class="ethics-card-tradition">${esc(entry.tradition)}</span>
      </div>
      <div class="ethics-card-body">
        <p class="ethics-card-ideas">${esc(entry.coreIdeas)}</p>
        <p class="ethics-card-impact">${esc(entry.impact)}</p>
      </div>
    </div>
  `;
}

// ── Open detail modal ────────────────────────────────────────────────────────
function openEthicsDetail(entry) {
  const overlay = document.getElementById('modal-overlay');
  const body = document.getElementById('modal-body');
  if (!overlay || !body) return;

  const color = getRegionColor(entry.region);
  const geminiUrl = 'https://gemini.google.com/app?q=' + encodeURIComponent(entry.searchQuery);
  const scholarUrl = 'https://scholar.google.com/scholar?q=' + encodeURIComponent(entry.name + ' ' + (entry.works[0] || ''));
  const stanfordUrl = 'https://plato.stanford.edu/search/searcher.py?query=' + encodeURIComponent(entry.name);

  body.innerHTML = `
    <div class="ethics-detail">
      <div class="ethics-detail-hero" style="border-left: 4px solid ${color}">
        <span class="ethics-detail-emoji">${entry.emoji}</span>
        <h2 class="ethics-detail-name">${esc(entry.name)}</h2>
        <div class="ethics-detail-years">${esc(entry.years)}</div>
        <span class="ethics-detail-tradition">${esc(entry.tradition)}</span>
      </div>

      <div class="ethics-detail-section">
        <h4>Works</h4>
        <ul class="ethics-detail-works">
          ${entry.works.map(w => `<li>${esc(w)}</li>`).join('')}
        </ul>
      </div>

      <div class="ethics-detail-section">
        <h4>Core Ideas</h4>
        <p>${esc(entry.coreIdeas)}</p>
      </div>

      <div class="ethics-detail-section">
        <h4>Impact</h4>
        <p>${esc(entry.impact)}</p>
      </div>

      <div class="ethics-detail-links">
        <a class="ethics-detail-btn ethics-btn-gemini" href="${geminiUrl}" target="_blank" rel="noopener noreferrer">
          Explore on Gemini
        </a>
        <a class="ethics-detail-btn ethics-btn-scholar" href="${scholarUrl}" target="_blank" rel="noopener noreferrer">
          Google Scholar
        </a>
        <a class="ethics-detail-btn ethics-btn-stanford" href="${stanfordUrl}" target="_blank" rel="noopener noreferrer">
          Stanford Encyclopedia
        </a>
      </div>
    </div>
  `;

  overlay.style.display = 'flex';
  overlay.scrollTop = 0;
}

// ── Scroll Animation ─────────────────────────────────────────────────────────
function setupScrollAnimation(container) {
  // Disconnect previous observer
  if (observer) observer.disconnect();

  const cards = container.querySelectorAll('.ethics-animate');

  observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('ethics-visible');
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.1,
    rootMargin: '0px 0px -40px 0px'
  });

  cards.forEach(card => observer.observe(card));
}
