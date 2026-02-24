// Learning Paths — Autodidactive v2
// Path rendering, auto-generation, and progress tracking

import { LEARNING_PATHS } from './data/paths.js';
import { getRelated, getPeopleMap } from './graph.js';
import { IMPLEMENT_PRACTICES } from './data/patterns.js';
import { CALCULUS_LABS } from './data/calculus.js';

const PATHS_KEY = 'autodidactive-paths';
const PEOPLE_MAP = getPeopleMap();

function esc(str) {
  const div = document.createElement('div');
  div.textContent = str || '';
  return div.innerHTML;
}

// ── Progress tracking ────────────────────────────────────────────────────────
function getProgress() {
  try {
    return JSON.parse(localStorage.getItem(PATHS_KEY)) || {};
  } catch { return {}; }
}

function saveProgress(data) {
  localStorage.setItem(PATHS_KEY, JSON.stringify(data));
}

export function markStepComplete(pathId, stepIndex) {
  const progress = getProgress();
  if (!progress[pathId]) progress[pathId] = { completed: [] };
  if (!progress[pathId].completed.includes(stepIndex)) {
    progress[pathId].completed.push(stepIndex);
  }
  saveProgress(progress);
}

export function getPathProgress(pathId) {
  const progress = getProgress();
  const path = LEARNING_PATHS.find(p => p.id === pathId);
  if (!path) return { completed: 0, total: 0, percent: 0 };
  const done = (progress[pathId]?.completed || []).length;
  return { completed: done, total: path.steps.length, percent: Math.round((done / path.steps.length) * 100) };
}

// ── Auto-generate path ──────────────────────────────────────────────────────
export function generatePath(startId, length = 5) {
  const visited = new Set([startId]);
  const path = [startId];

  let current = startId;
  for (let i = 0; i < length - 1; i++) {
    const related = getRelated(current, 10);
    // Prefer cross-discipline jumps
    const candidates = related.filter(r => !visited.has(r.id) && !r.isLab);
    if (candidates.length === 0) break;

    // Score: prefer different fields
    const currentPerson = PEOPLE_MAP.get(current);
    const currentFields = currentPerson ? new Set(currentPerson.fields.map(f => f.toLowerCase())) : new Set();

    let best = candidates[0];
    let bestScore = 0;
    for (const c of candidates) {
      const p = PEOPLE_MAP.get(c.id);
      if (!p) continue;
      const pFields = new Set(p.fields.map(f => f.toLowerCase()));
      let crossScore = c.score;
      // Bonus for different disciplines
      let overlap = 0;
      for (const f of pFields) { if (currentFields.has(f)) overlap++; }
      if (overlap === 0) crossScore += 5; // Cross-discipline bonus
      if (crossScore > bestScore) { bestScore = crossScore; best = c; }
    }

    visited.add(best.id);
    path.push(best.id);
    current = best.id;
  }

  return path;
}

// ── Render path list ─────────────────────────────────────────────────────────
export function renderPathList() {
  return LEARNING_PATHS.map(path => {
    const prog = getPathProgress(path.id);
    const stepPreviews = path.steps.slice(0, 4).map(s => {
      const p = PEOPLE_MAP.get(s.personId);
      const lab = CALCULUS_LABS.find(l => l.id === s.personId);
      return p ? p.emoji : lab ? lab.emoji : '?';
    }).join(' ');

    return `
      <div class="path-card" onclick="window._openPath('${path.id}')">
        <div class="path-card-header">
          <span class="path-card-emoji">${path.emoji}</span>
          <div class="path-card-info">
            <h3 class="path-card-title">${esc(path.title)}</h3>
            <div class="path-card-meta">${path.steps.length} steps ${stepPreviews}</div>
          </div>
        </div>
        <p class="path-card-desc">${esc(path.description)}</p>
        <div class="path-progress">
          <div class="path-progress-bar">
            <div class="path-progress-fill" style="width: ${prog.percent}%"></div>
          </div>
          <span class="path-progress-text">${prog.completed}/${prog.total}</span>
        </div>
      </div>
    `;
  }).join('');
}

// ── Render single path detail ────────────────────────────────────────────────
export function renderPathDetail(pathId) {
  const path = LEARNING_PATHS.find(p => p.id === pathId);
  if (!path) return '<p>Path not found.</p>';

  const progress = getProgress();
  const completed = progress[pathId]?.completed || [];

  // Find matching practices
  const practices = (path.practices || []).map(title =>
    IMPLEMENT_PRACTICES.find(p => p.title === title)
  ).filter(Boolean);

  let html = `
    <div class="path-detail-header">
      <button class="path-back-btn" onclick="window._showPaths()">← Paths</button>
      <span class="path-detail-emoji">${path.emoji}</span>
      <h2 class="path-detail-title">${esc(path.title)}</h2>
      <p class="path-detail-desc">${esc(path.description)}</p>
    </div>
    <div class="path-timeline">
  `;

  for (let i = 0; i < path.steps.length; i++) {
    const step = path.steps[i];
    const person = PEOPLE_MAP.get(step.personId);
    const lab = CALCULUS_LABS.find(l => l.id === step.personId);
    const isDone = completed.includes(i);
    const entity = person || lab;
    if (!entity) continue;

    const isLabStep = step.isLab || !!lab;

    html += `
      <div class="path-step ${isDone ? 'path-step--done' : ''}">
        <div class="path-step-line"></div>
        <div class="path-step-dot ${isDone ? 'path-step-dot--done' : ''}"></div>
        <div class="path-step-content">
          <div class="path-step-card" onclick="${isLabStep ? `window._openLab('${step.personId}')` : `window._openPerson('${step.personId}')`}; window._markPathStep('${path.id}', ${i})">
            <div class="path-step-header">
              <span class="path-step-emoji">${entity.emoji}</span>
              <div>
                <div class="path-step-name">${esc(entity.name)}</div>
                ${person ? `<div class="path-step-years">${esc(person.years)}</div>` : ''}
                ${isLabStep ? '<div class="path-step-badge">Interactive Lab</div>' : ''}
              </div>
            </div>
          </div>
          <div class="path-step-connector">${esc(step.connector)}</div>
        </div>
      </div>
    `;

    // Insert practice step between figures if available
    if (practices.length > 0 && i < path.steps.length - 1 && i < practices.length) {
      const practice = practices[i];
      html += `
        <div class="path-practice-step">
          <div class="path-step-line"></div>
          <div class="path-practice-dot">✦</div>
          <div class="path-practice-content">
            <div class="path-practice-label">Practice</div>
            <div class="path-practice-title">${esc(practice.title)}</div>
            <div class="path-practice-origin">from ${esc(practice.origin)}</div>
            <p class="path-practice-desc">${esc(practice.how)}</p>
          </div>
        </div>
      `;
    }
  }

  html += '</div>';
  return html;
}

export { LEARNING_PATHS };
