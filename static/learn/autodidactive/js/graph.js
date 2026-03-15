// Knowledge Graph Engine — Autodidactive v2
// Precomputed relationship graph from static data

import { POLYMATHS } from './data/polymaths.js';
import { PHILOSOPHERS } from './data/philosophers.js';
import { NEUROETHICS_PEOPLE } from './data/neuroethics.js';
import { NEUROSCIENCE, NEUROSCIENCE_CROSSREFS } from './data/neuroscience.js';
import { QUANTUM } from './data/quantum.js';
import { CYBERSECURITY } from './data/cybersecurity.js';
import { PATTERNS, INFLUENTIAL_BOOKS } from './data/patterns.js';
import { CALCULUS_LABS } from './data/calculus.js';

const ALL_PEOPLE = [
  ...POLYMATHS, ...PHILOSOPHERS, ...NEUROETHICS_PEOPLE,
  ...NEUROSCIENCE, ...QUANTUM, ...CYBERSECURITY
];

const PEOPLE_MAP = new Map(ALL_PEOPLE.map(p => [p.id, p]));

// ── Edge types & weights ─────────────────────────────────────────────────────
const WEIGHT = {
  field: 3,
  pattern: 4,
  book: 5,
  crossref: 6,
  lab: 2,
  era: 1
};

// ── Graph storage ────────────────────────────────────────────────────────────
// adjacency: Map<id, Array<{ target, type, weight, label }>>
const adjacency = new Map();

function addEdge(a, b, type, label) {
  if (a === b) return;
  const w = WEIGHT[type] || 1;
  const edge = { target: b, type, weight: w, label };
  const reverseEdge = { target: a, type, weight: w, label };

  if (!adjacency.has(a)) adjacency.set(a, []);
  if (!adjacency.has(b)) adjacency.set(b, []);

  // Avoid duplicate edges of same type between same pair
  const existing = adjacency.get(a);
  if (!existing.some(e => e.target === b && e.type === type)) {
    existing.push(edge);
    adjacency.get(b).push(reverseEdge);
  }
}

// ── Era parsing ──────────────────────────────────────────────────────────────
function parseEraYear(years) {
  if (!years) return null;
  const bcMatch = years.match(/(\d+)\s*BC/i);
  if (bcMatch) return -parseInt(bcMatch[1], 10);
  const adMatch = years.match(/(\d{3,4})/);
  if (adMatch) return parseInt(adMatch[1], 10);
  return null;
}

// ── Name-to-ID fuzzy matcher ─────────────────────────────────────────────────
function nameToId(name) {
  const lower = name.toLowerCase().trim();
  // Direct match on name
  for (const p of ALL_PEOPLE) {
    if (p.name.toLowerCase() === lower) return p.id;
  }
  // Partial match (last name or common name)
  for (const p of ALL_PEOPLE) {
    const parts = p.name.toLowerCase().split(/\s+/);
    if (parts.some(part => lower.includes(part) && part.length > 3)) return p.id;
  }
  // Special cases
  const aliases = {
    'da vinci': 'davinci', 'leonardo': 'davinci',
    'marcus aurelius': 'marcus', 'marcus': 'marcus',
    'lao tzu': 'laotzu',
    'ibn sina': 'ibn-sina', 'avicenna': 'ibn-sina',
    'cajal': 'cajal', 'ramon y cajal': 'cajal',
    'shannon': 'claude-shannon',
    'epictetus (via arrian)': 'epictetus',
    'edison': null, // Not in dataset
    'wright brothers': null
  };
  for (const [alias, id] of Object.entries(aliases)) {
    if (lower.includes(alias)) return id;
  }
  return null;
}

// ── Build graph ──────────────────────────────────────────────────────────────
function buildGraph() {
  // 1. Shared fields — people sharing discipline labels
  const fieldIndex = new Map(); // field -> [personId]
  for (const p of ALL_PEOPLE) {
    for (const f of p.fields) {
      const key = f.toLowerCase();
      if (!fieldIndex.has(key)) fieldIndex.set(key, []);
      fieldIndex.get(key).push(p.id);
    }
  }
  for (const [field, ids] of fieldIndex) {
    for (let i = 0; i < ids.length; i++) {
      for (let j = i + 1; j < ids.length; j++) {
        addEdge(ids[i], ids[j], 'field', field);
      }
    }
  }

  // 2. Patterns — names grouped by meta-pattern
  for (const pat of PATTERNS) {
    const names = pat.names.split(',').map(n => n.trim());
    const ids = names.map(nameToId).filter(Boolean);
    for (let i = 0; i < ids.length; i++) {
      for (let j = i + 1; j < ids.length; j++) {
        addEdge(ids[i], ids[j], 'pattern', pat.title);
      }
    }
  }

  // 3. Books — reader-to-reader connections via shared influence
  for (const book of INFLUENTIAL_BOOKS) {
    const readerId = nameToId(book.reader);
    if (!readerId) continue;
    // Connect readers of same author
    for (const other of INFLUENTIAL_BOOKS) {
      if (other === book) continue;
      const otherId = nameToId(other.reader);
      if (!otherId || otherId === readerId) continue;
      if (other.author === book.author) {
        addEdge(readerId, otherId, 'book', `Both read ${book.author}`);
      }
    }
  }

  // 4. Cross-references
  for (const xref of NEUROSCIENCE_CROSSREFS) {
    const targetId = xref.crossRef;
    if (!PEOPLE_MAP.has(targetId)) continue;
    // Link cross-referenced people to neuroscience figures
    for (const neuro of NEUROSCIENCE) {
      addEdge(neuro.id, targetId, 'crossref', xref.note);
    }
  }

  // 5. Lab-to-figure connections via topic-field overlap
  for (const lab of CALCULUS_LABS) {
    for (const p of ALL_PEOPLE) {
      const pFields = p.fields.map(f => f.toLowerCase());
      const overlap = lab.topics.some(t =>
        pFields.some(f => f.includes(t.toLowerCase()) || t.toLowerCase().includes(f))
      );
      if (overlap) {
        addEdge(lab.id, p.id, 'lab', `${lab.name} topics`);
      }
    }
    // Also link signal-related labs to Shannon
    if (lab.topics.some(t => ['signal processing', 'Fourier', 'frequency analysis', 'sampling'].includes(t))) {
      addEdge(lab.id, 'claude-shannon', 'lab', 'Signal theory');
    }
  }

  // 6. Era proximity (within 50 years)
  for (let i = 0; i < ALL_PEOPLE.length; i++) {
    const y1 = parseEraYear(ALL_PEOPLE[i].years);
    if (y1 === null) continue;
    for (let j = i + 1; j < ALL_PEOPLE.length; j++) {
      const y2 = parseEraYear(ALL_PEOPLE[j].years);
      if (y2 === null) continue;
      if (Math.abs(y1 - y2) <= 50) {
        addEdge(ALL_PEOPLE[i].id, ALL_PEOPLE[j].id, 'era', 'contemporaries');
      }
    }
  }
}

// ── Public API ───────────────────────────────────────────────────────────────

export function getConnections(id) {
  return adjacency.get(id) || [];
}

export function getRelated(id, limit = 6) {
  const edges = getConnections(id);
  // Aggregate by target, sum weights
  const scores = new Map();
  for (const e of edges) {
    scores.set(e.target, (scores.get(e.target) || 0) + e.weight);
  }
  return [...scores.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([targetId, score]) => {
      const person = PEOPLE_MAP.get(targetId);
      const lab = CALCULUS_LABS.find(l => l.id === targetId);
      const types = edges.filter(e => e.target === targetId).map(e => e.type);
      const labels = edges.filter(e => e.target === targetId).map(e => e.label);
      return {
        id: targetId,
        name: person ? person.name : lab ? lab.name : targetId,
        emoji: person ? person.emoji : lab ? lab.emoji : '',
        score,
        types: [...new Set(types)],
        labels: [...new Set(labels)],
        isLab: !!lab
      };
    });
}

export function getPath(fromId, toId, maxDepth = 5) {
  if (fromId === toId) return [fromId];
  // BFS
  const visited = new Set([fromId]);
  const queue = [[fromId]];
  while (queue.length > 0) {
    const path = queue.shift();
    if (path.length > maxDepth) return null;
    const current = path[path.length - 1];
    const edges = adjacency.get(current) || [];
    for (const edge of edges) {
      if (visited.has(edge.target)) continue;
      const newPath = [...path, edge.target];
      if (edge.target === toId) return newPath;
      visited.add(edge.target);
      queue.push(newPath);
    }
  }
  return null;
}

export function getPathWithEdges(fromId, toId, maxDepth = 5) {
  const path = getPath(fromId, toId, maxDepth);
  if (!path) return null;
  const steps = [];
  for (let i = 0; i < path.length - 1; i++) {
    const edges = (adjacency.get(path[i]) || []).filter(e => e.target === path[i + 1]);
    const best = edges.sort((a, b) => b.weight - a.weight)[0];
    const person = PEOPLE_MAP.get(path[i]);
    steps.push({
      id: path[i],
      name: person ? person.name : path[i],
      emoji: person ? person.emoji : '',
      edgeType: best ? best.type : '',
      edgeLabel: best ? best.label : ''
    });
  }
  const last = PEOPLE_MAP.get(path[path.length - 1]);
  steps.push({
    id: path[path.length - 1],
    name: last ? last.name : path[path.length - 1],
    emoji: last ? last.emoji : '',
    edgeType: '',
    edgeLabel: ''
  });
  return steps;
}

export function getFieldGraph(fieldId) {
  const nodes = new Set();
  const edges = [];
  for (const [id, adj] of adjacency) {
    for (const e of adj) {
      if (e.type === 'field' && e.label === fieldId) {
        nodes.add(id);
        nodes.add(e.target);
        if (id < e.target) {
          edges.push({ source: id, target: e.target, type: e.type, label: e.label });
        }
      }
    }
  }
  return {
    nodes: [...nodes].map(id => {
      const p = PEOPLE_MAP.get(id);
      return { id, name: p ? p.name : id, emoji: p ? p.emoji : '' };
    }),
    edges
  };
}

export function getAllNodes() {
  const nodes = [];
  for (const p of ALL_PEOPLE) {
    nodes.push({ id: p.id, name: p.name, emoji: p.emoji, type: 'person', fields: p.fields });
  }
  for (const l of CALCULUS_LABS) {
    nodes.push({ id: l.id, name: l.name, emoji: l.emoji, type: 'lab', fields: l.topics });
  }
  return nodes;
}

export function getAllEdges() {
  const seen = new Set();
  const edges = [];
  for (const [source, adj] of adjacency) {
    for (const e of adj) {
      const key = [source, e.target].sort().join('|') + '|' + e.type;
      if (seen.has(key)) continue;
      seen.add(key);
      edges.push({ source, target: e.target, type: e.type, label: e.label, weight: e.weight });
    }
  }
  return edges;
}

export function getPeopleMap() {
  return PEOPLE_MAP;
}

// ── Init ─────────────────────────────────────────────────────────────────────
buildGraph();
console.log(`[Graph] Built: ${ALL_PEOPLE.length} people, ${adjacency.size} nodes, ${getAllEdges().length} edges`);
