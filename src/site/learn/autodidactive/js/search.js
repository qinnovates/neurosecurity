// Smart Search — Autodidactive v2
// Trigram-based fuzzy search across all content

import { POLYMATHS } from './data/polymaths.js';
import { PHILOSOPHERS } from './data/philosophers.js';
import { NEUROETHICS_PEOPLE } from './data/neuroethics.js';
import { NEUROSCIENCE } from './data/neuroscience.js';
import { QUANTUM } from './data/quantum.js';
import { CYBERSECURITY } from './data/cybersecurity.js';
import { PATTERNS, IMPLEMENT_PRACTICES, ACTION_EXAMPLES, INFLUENTIAL_BOOKS, JOURNAL_ENTRIES } from './data/patterns.js';
import { CALCULUS_LABS } from './data/calculus.js';

const ALL_PEOPLE = [
  ...POLYMATHS, ...PHILOSOPHERS, ...NEUROETHICS_PEOPLE,
  ...NEUROSCIENCE, ...QUANTUM, ...CYBERSECURITY
];

// ── Trigram index ────────────────────────────────────────────────────────────
// entry: { type, id, field, text, source }
const INDEX = [];

function trigrams(str) {
  const s = ` ${str.toLowerCase()} `;
  const tris = [];
  for (let i = 0; i < s.length - 2; i++) tris.push(s.slice(i, i + 3));
  return tris;
}

function addEntry(type, id, field, text, source) {
  if (!text) return;
  INDEX.push({ type, id, field, text, source, tris: new Set(trigrams(text)) });
}

// Build index from all data
function buildIndex() {
  for (const p of ALL_PEOPLE) {
    addEntry('People', p.id, 'name', p.name, p.name);
    addEntry('People', p.id, 'tagline', p.tagline, p.name);
    addEntry('People', p.id, 'bio', p.bio || p.struggles, p.name);
    addEntry('People', p.id, 'moment', p.moment, p.name);
    for (const f of p.frameworks) addEntry('People', p.id, 'framework', f, p.name);
    for (const h of p.habits) addEntry('People', p.id, 'habit', h, p.name);
    for (const q of (p.quotes || [])) addEntry('Quotes', p.id, 'quote', q.text, p.name);
    for (const f of p.fields) addEntry('People', p.id, 'field', f, p.name);
    for (const t of (p.takeaways || [])) {
      addEntry('People', p.id, 'takeaway', `${t.title} ${t.desc}`, p.name);
    }
    for (const b of (p.books || [])) {
      addEntry('Books', p.id, 'book', `${b.title} by ${b.author} ${b.desc}`, p.name);
    }
  }

  for (const pat of PATTERNS) {
    addEntry('Patterns', pat.title, 'pattern', `${pat.title} ${pat.desc} ${pat.names}`, pat.title);
  }

  for (const pr of IMPLEMENT_PRACTICES) {
    addEntry('Practices', pr.title, 'practice', `${pr.title} ${pr.origin} ${pr.desc} ${pr.how}`, pr.origin);
  }

  for (const ae of ACTION_EXAMPLES) {
    addEntry('Actions', ae.title, 'action', `${ae.title} ${ae.who} ${ae.desc} ${ae.lesson}`, ae.who);
  }

  for (const book of INFLUENTIAL_BOOKS) {
    addEntry('Books', book.reader, 'book', `${book.title} ${book.author} ${book.reader} ${book.desc}`, book.reader);
  }

  for (const je of JOURNAL_ENTRIES) {
    addEntry('Journals', je.id, 'journal', `${je.title} ${je.body.join(' ')}`, je.title);
  }

  for (const lab of CALCULUS_LABS) {
    addEntry('Labs', lab.id, 'lab', `${lab.name} ${lab.tagline} ${lab.description} ${lab.topics.join(' ')}`, lab.name);
  }
}

// ── Search ───────────────────────────────────────────────────────────────────
export function search(query, limit = 20) {
  if (!query || query.length < 2) return [];
  const q = query.toLowerCase().trim();
  const qTris = new Set(trigrams(q));
  const qWords = q.split(/\s+/);

  const results = [];

  for (const entry of INDEX) {
    const textLower = entry.text.toLowerCase();
    let score = 0;

    // Exact substring match (highest)
    if (textLower.includes(q)) {
      score += 10;
      // Bonus for match at word boundary
      const wordBoundary = new RegExp(`\\b${q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'i');
      if (wordBoundary.test(entry.text)) score += 5;
    }

    // Word matches
    for (const word of qWords) {
      if (word.length < 2) continue;
      if (textLower.includes(word)) score += 3;
    }

    // Trigram similarity
    if (score === 0 && qTris.size > 0) {
      let overlap = 0;
      for (const tri of qTris) {
        if (entry.tris.has(tri)) overlap++;
      }
      const similarity = overlap / qTris.size;
      if (similarity > 0.3) score += similarity * 5;
    }

    if (score > 0) {
      // Boost names and titles
      if (entry.field === 'name' || entry.field === 'quote') score *= 1.5;

      results.push({
        type: entry.type,
        id: entry.id,
        field: entry.field,
        snippet: extractSnippet(entry.text, q, qWords),
        score,
        source: entry.source
      });
    }
  }

  // Deduplicate: keep highest score per type+id
  const deduped = new Map();
  for (const r of results) {
    const key = `${r.type}|${r.id}`;
    const existing = deduped.get(key);
    if (!existing || r.score > existing.score) {
      deduped.set(key, r);
    }
  }

  return [...deduped.values()]
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

function extractSnippet(text, query, words) {
  const maxLen = 120;
  const lower = text.toLowerCase();
  let idx = lower.indexOf(query);
  if (idx === -1) {
    for (const w of words) {
      idx = lower.indexOf(w);
      if (idx >= 0) break;
    }
  }
  if (idx === -1) idx = 0;

  const start = Math.max(0, idx - 30);
  const end = Math.min(text.length, start + maxLen);
  let snippet = text.slice(start, end).trim();
  if (start > 0) snippet = '...' + snippet;
  if (end < text.length) snippet = snippet + '...';
  return snippet;
}

export function highlightMatch(text, query) {
  if (!query || query.length < 2) return escHtml(text);
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escaped})`, 'gi');
  return escHtml(text).replace(regex, '<mark>$1</mark>');
}

function escHtml(str) {
  const div = document.createElement('div');
  div.textContent = str || '';
  return div.innerHTML;
}

export function groupResults(results) {
  const groups = {};
  for (const r of results) {
    if (!groups[r.type]) groups[r.type] = [];
    groups[r.type].push(r);
  }
  return groups;
}

export function getConceptIndex() {
  const index = new Map();

  const add = (concept, personId) => {
    if (!concept) return;
    const key = concept.trim();
    if (!index.has(key)) index.set(key, new Set());
    index.get(key).add(personId);
  };

  for (const p of ALL_PEOPLE) {
    for (const f of p.fields) add(f, p.id);
    for (const fw of p.frameworks) add(fw, p.id);
    for (const t of (p.takeaways || [])) add(t.title, p.id);
  }

  // Convert to sorted array of { concept, peopleIds }
  return Array.from(index.entries())
    .map(([concept, ids]) => ({ concept, ids: Array.from(ids) }))
    .sort((a, b) => b.ids.length - a.ids.length || a.concept.localeCompare(b.concept));
}

// ── Init ─────────────────────────────────────────────────────────────────────

buildIndex();
console.log(`[Search] Indexed ${INDEX.length} entries`);
