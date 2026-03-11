// Mindmap — Auto-generated from Note Wall using local NLP
// No data leaves the browser. All analysis runs client-side.

import { search } from './search.js';
import { getPeopleMap } from './graph.js';

const STORAGE_KEY = 'autodidactive-mindmap';
const PEOPLE_MAP = getPeopleMap();
const MAX_LABEL_RENDER = 22;

const CLUSTER_COLORS = [
  '#10b981', '#3b82f6', '#8b5cf6', '#ef4444', '#f59e0b',
  '#ec4899', '#14b8a6', '#f97316', '#6366f1', '#84cc16'
];

// ── Stop words for TF-IDF ────────────────────────────────────────────────────
const STOP_WORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
  'of', 'with', 'by', 'from', 'is', 'are', 'was', 'were', 'be', 'been',
  'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
  'could', 'should', 'may', 'might', 'can', 'shall', 'it', 'its', 'i',
  'me', 'my', 'we', 'our', 'you', 'your', 'he', 'she', 'they', 'them',
  'this', 'that', 'these', 'those', 'not', 'no', 'so', 'if', 'then',
  'than', 'too', 'very', 'just', 'about', 'also', 'some', 'any', 'all',
  'more', 'most', 'other', 'into', 'over', 'such', 'only', 'own', 'same',
  'up', 'out', 'as', 'what', 'when', 'where', 'how', 'which', 'who'
]);

function esc(str) {
  const div = document.createElement('div');
  div.textContent = str || '';
  return div.innerHTML;
}

function isFiniteNum(v) { return typeof v === 'number' && Number.isFinite(v); }

// ── TF-IDF local NLP engine ─────────────────────────────────────────────────
function tokenize(text) {
  return text.toLowerCase()
    .replace(/[^a-z0-9\s'-]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2 && !STOP_WORDS.has(w));
}

function computeTFIDF(docs) {
  const N = docs.length;
  if (N === 0) return [];

  // Document frequency
  const df = {};
  const tfVectors = [];

  for (const doc of docs) {
    const tokens = tokenize(doc);
    const tf = {};
    for (const t of tokens) {
      tf[t] = (tf[t] || 0) + 1;
    }
    // Normalize TF
    const maxFreq = Math.max(...Object.values(tf), 1);
    for (const t in tf) {
      tf[t] = tf[t] / maxFreq;
    }
    tfVectors.push(tf);
    // Count doc frequency
    const seen = new Set(tokens);
    for (const t of seen) {
      df[t] = (df[t] || 0) + 1;
    }
  }

  // Compute TF-IDF vectors
  return tfVectors.map(tf => {
    const tfidf = {};
    for (const t in tf) {
      tfidf[t] = tf[t] * Math.log(N / (df[t] || 1));
    }
    return tfidf;
  });
}

function cosineSimilarity(a, b) {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  let dot = 0, magA = 0, magB = 0;
  for (const k of keys) {
    const va = a[k] || 0;
    const vb = b[k] || 0;
    dot += va * vb;
    magA += va * va;
    magB += vb * vb;
  }
  const denom = Math.sqrt(magA) * Math.sqrt(magB);
  return denom === 0 ? 0 : dot / denom;
}

// ── Connection finding ──────────────────────────────────────────────────────
function findNoteConnections(notes) {
  if (notes.length < 2) return [];

  const texts = notes.map(n => n.text);
  const tfidfVectors = computeTFIDF(texts);
  const connections = [];

  // Compute pairwise similarity
  for (let i = 0; i < notes.length; i++) {
    for (let j = i + 1; j < notes.length; j++) {
      const sim = cosineSimilarity(tfidfVectors[i], tfidfVectors[j]);
      if (sim > 0.05) {
        // Find shared meaningful words for the label
        const wordsA = new Set(tokenize(texts[i]));
        const wordsB = new Set(tokenize(texts[j]));
        const shared = [...wordsA].filter(w => wordsB.has(w));
        const reason = shared.length > 0
          ? shared.slice(0, 3).join(', ')
          : findKnowledgeGraphLink(texts[i], texts[j]);

        connections.push({
          sourceIdx: i,
          targetIdx: j,
          strength: Math.round(sim * 10),
          similarity: sim,
          reason: reason || 'related'
        });
      }
    }
  }

  // Also check knowledge graph for cross-connections
  for (let i = 0; i < notes.length; i++) {
    const resultsI = search(texts[i]).slice(0, 3);
    const idsI = new Set(resultsI.map(r => r.id));

    for (let j = i + 1; j < notes.length; j++) {
      const existing = connections.find(c => c.sourceIdx === i && c.targetIdx === j);
      const resultsJ = search(texts[j]).slice(0, 3);
      const overlap = resultsJ.filter(r => idsI.has(r.id));

      if (overlap.length > 0) {
        const person = PEOPLE_MAP.get(overlap[0].id);
        const reason = person ? person.name : 'shared concept';
        if (existing) {
          existing.strength += overlap.length * 2;
          if (!existing.reason || existing.reason === 'related') {
            existing.reason = reason;
          }
        } else {
          connections.push({
            sourceIdx: i,
            targetIdx: j,
            strength: overlap.length * 2,
            similarity: 0.1,
            reason
          });
        }
      }
    }
  }

  // Sort by strength, keep top connections
  connections.sort((a, b) => b.strength - a.strength);
  return connections;
}

function findKnowledgeGraphLink(textA, textB) {
  const resA = search(textA).slice(0, 2);
  const resB = search(textB).slice(0, 2);
  for (const a of resA) {
    for (const b of resB) {
      if (a.id === b.id) {
        const person = PEOPLE_MAP.get(a.id);
        return person ? person.name : 'shared concept';
      }
    }
  }
  return '';
}

// ── Temporal clustering ─────────────────────────────────────────────────────
function assignTemporalClusters(notes) {
  if (notes.length === 0) return [];

  const sorted = [...notes].sort((a, b) => a.timestamp - b.timestamp);
  const clusters = [];
  let currentCluster = [sorted[0]];
  const GAP_THRESHOLD = 60 * 60 * 1000; // 1 hour gap = new cluster

  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i].timestamp - sorted[i - 1].timestamp > GAP_THRESHOLD) {
      clusters.push(currentCluster);
      currentCluster = [];
    }
    currentCluster.push(sorted[i]);
  }
  clusters.push(currentCluster);

  // Assign colors by cluster
  const colorMap = new Map();
  clusters.forEach((cluster, ci) => {
    const color = CLUSTER_COLORS[ci % CLUSTER_COLORS.length];
    for (const note of cluster) {
      colorMap.set(note.id, color);
    }
  });

  return { clusters, colorMap };
}

// ── Persistence ─────────────────────────────────────────────────────────────
function loadMap() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    return parsed;
  } catch { return null; }
}

function saveMap(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

// ── Force-directed layout ───────────────────────────────────────────────────
function applyForceLayout(nodes, edges, width, height) {
  const iterations = 60;
  const k = Math.sqrt((width * height) / Math.max(nodes.length, 1)) * 0.4;

  // Initialize positions in a circle
  for (let i = 0; i < nodes.length; i++) {
    if (!nodes[i].x || !nodes[i].y) {
      const angle = (2 * Math.PI * i) / nodes.length;
      nodes[i].x = width / 2 + Math.cos(angle) * (width * 0.3);
      nodes[i].y = height / 2 + Math.sin(angle) * (height * 0.3);
    }
  }

  for (let iter = 0; iter < iterations; iter++) {
    const temp = 1 - iter / iterations;

    // Repulsion
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dx = nodes[i].x - nodes[j].x;
        const dy = nodes[i].y - nodes[j].y;
        const dist = Math.max(Math.sqrt(dx * dx + dy * dy), 1);
        const force = (k * k) / dist * 0.4 * temp;
        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;
        nodes[i].x += fx; nodes[i].y += fy;
        nodes[j].x -= fx; nodes[j].y -= fy;
      }
    }

    // Attraction along edges
    for (const edge of edges) {
      const source = nodes.find(n => n.id === edge.sourceId);
      const target = nodes.find(n => n.id === edge.targetId);
      if (!source || !target) continue;
      const dx = target.x - source.x;
      const dy = target.y - source.y;
      const dist = Math.max(Math.sqrt(dx * dx + dy * dy), 1);
      const force = (dist - k) * 0.008 * (1 + edge.strength * 0.1);
      source.x += (dx / dist) * force;
      source.y += (dy / dist) * force;
      target.x -= (dx / dist) * force;
      target.y -= (dy / dist) * force;
    }

    // Center gravity
    for (const node of nodes) {
      node.x += (width / 2 - node.x) * 0.01;
      node.y += (height / 2 - node.y) * 0.01;
    }
  }

  // Clamp to bounds
  const pad = 70;
  for (const node of nodes) {
    node.x = Math.max(pad, Math.min(width - pad, node.x));
    node.y = Math.max(pad, Math.min(height - pad, node.y));
  }
}

// ── Generate mind map from notes ────────────────────────────────────────────
export function generateMindmapFromNotes(notes, container) {
  if (!notes || notes.length === 0) {
    container.innerHTML = `
      <div class="mindmap-empty">
        <p>No notes yet. Add some notes above, then come back and let's mind your business.</p>
      </div>`;
    return;
  }

  if (notes.length === 1) {
    container.innerHTML = `
      <div class="mindmap-empty">
        <p>You have 1 note. Add a few more so the connections have something to work with.</p>
      </div>`;
    return;
  }

  // Show processing state
  container.innerHTML = `
    <div class="mindmap-processing">
      <div class="mindmap-processing-spinner"></div>
      <p>Analyzing ${notes.length} notes for connections...</p>
    </div>`;

  // Use requestAnimationFrame to let the UI update before heavy computation
  requestAnimationFrame(() => {
    const connections = findNoteConnections(notes);
    const { colorMap } = assignTemporalClusters(notes);

    // Build nodes from notes
    const mapNodes = notes.map((note, i) => ({
      id: note.id,
      label: note.text.length > 40 ? note.text.slice(0, 38) + '...' : note.text,
      fullText: note.text,
      color: colorMap.get(note.id) || CLUSTER_COLORS[i % CLUSTER_COLORS.length],
      timestamp: note.timestamp,
      x: 0,
      y: 0
    }));

    // Build edges
    const mapEdges = connections.map(c => ({
      sourceId: notes[c.sourceIdx].id,
      targetId: notes[c.targetIdx].id,
      strength: c.strength,
      similarity: c.similarity,
      reason: c.reason
    }));

    // Layout
    const w = Math.max(container.offsetWidth || 350, 350);
    const h = Math.max(400, notes.length * 50 + 200);

    applyForceLayout(mapNodes, mapEdges, w, h);

    // Save for persistence
    saveMap({ nodes: mapNodes, edges: mapEdges, generatedAt: Date.now() });

    // Render
    renderMindmapResult(container, mapNodes, mapEdges, connections.length, w, h);
  });
}

// ── Render the generated mind map ───────────────────────────────────────────
function renderMindmapResult(container, nodes, edges, totalConnections, w, h) {
  const strongConnections = edges.filter(e => e.strength >= 3).length;

  container.innerHTML = `
    <div class="mindmap-stats">
      <span>${nodes.length} notes</span>
      <span>${totalConnections} connections found</span>
      ${strongConnections > 0 ? `<span>${strongConnections} strong links</span>` : ''}
    </div>
    <div class="mindmap-canvas" id="mindmapCanvas" style="height: ${h}px;">
      <svg id="mindmapSvg" width="100%" height="100%"></svg>
    </div>
    <div class="mindmap-legend">
      <p class="mindmap-legend-label">Colors = time clusters (notes taken close together share a color)</p>
      <p class="mindmap-legend-label">Lines = content similarity (thicker = stronger connection)</p>
    </div>
  `;

  const svg = document.getElementById('mindmapSvg');
  const canvasEl = document.getElementById('mindmapCanvas');
  drawSvg(svg, nodes, edges, w, h);
  enableDrag(svg, canvasEl, nodes, edges, container);
}

// ── SVG Drawing ─────────────────────────────────────────────────────────────
function drawSvg(svg, nodes, edges, w, h) {
  svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
  let html = '';

  // Edges
  for (const edge of edges) {
    const source = nodes.find(n => n.id === edge.sourceId);
    const target = nodes.find(n => n.id === edge.targetId);
    if (!source || !target) continue;

    const mx = (source.x + target.x) / 2;
    const my = (source.y + target.y) / 2;
    const opacity = Math.min(0.8, 0.15 + (edge.similarity || 0) * 0.8);
    const strokeW = Math.min(3, 0.5 + edge.strength * 0.4);

    html += `<line x1="${source.x}" y1="${source.y}" x2="${target.x}" y2="${target.y}"
                   stroke="#94a3b8" stroke-width="${strokeW}" stroke-opacity="${opacity}" />`;
    if (edge.reason && edge.reason !== 'related') {
      html += `<text x="${mx}" y="${my - 6}" text-anchor="middle" fill="#94a3b8" font-size="8" opacity="0.6">${esc(edge.reason)}</text>`;
    }
  }

  // Nodes
  for (const node of nodes) {
    const label = node.label.length > MAX_LABEL_RENDER
      ? node.label.slice(0, MAX_LABEL_RENDER - 1) + '...'
      : node.label;
    const r = 10 + Math.min(label.length * 0.4, 10);
    const cx = isFiniteNum(node.x) ? node.x : 0;
    const cy = isFiniteNum(node.y) ? node.y : 0;
    const safeColor = esc(node.color);

    // Time label
    const t = new Date(node.timestamp);
    const timeLabel = t.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      + ' ' + t.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

    html += `
      <g class="mindmap-node" data-id="${esc(node.id)}" style="cursor: grab;">
        <circle cx="${cx}" cy="${cy}" r="${r}" fill="${safeColor}" fill-opacity="0.15" stroke="${safeColor}" stroke-width="2" />
        <text x="${cx}" y="${cy + 3}" text-anchor="middle" fill="${safeColor}" font-size="10" font-weight="600" font-family="var(--font-display, sans-serif)">
          ${esc(label)}
        </text>
        <text x="${cx}" y="${cy + r + 12}" text-anchor="middle" fill="#94a3b8" font-size="7.5" font-family="var(--font-display, sans-serif)">
          ${esc(timeLabel)}
        </text>
      </g>
    `;
  }

  svg.innerHTML = html;
}

// ── Drag ────────────────────────────────────────────────────────────────────
function enableDrag(svg, canvasEl, nodes, edges, container) {
  let dragNode = null;
  let offset = { x: 0, y: 0 };

  function getSvgPoint(e) {
    const rect = canvasEl.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const vb = svg.getAttribute('viewBox')?.split(' ') || [0, 0, rect.width, rect.height];
    const scaleX = parseFloat(vb[2]) / rect.width;
    const scaleY = parseFloat(vb[3]) / rect.height;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  }

  function onStart(e) {
    const pt = getSvgPoint(e);
    for (const node of nodes) {
      const dx = pt.x - node.x;
      const dy = pt.y - node.y;
      if (Math.sqrt(dx * dx + dy * dy) < 30) {
        dragNode = node;
        offset = { x: dx, y: dy };
        e.preventDefault();
        break;
      }
    }
  }

  function onMove(e) {
    if (!dragNode) return;
    e.preventDefault();
    const pt = getSvgPoint(e);
    dragNode.x = pt.x - offset.x;
    dragNode.y = pt.y - offset.y;
    const vb = svg.getAttribute('viewBox')?.split(' ');
    drawSvg(svg, nodes, edges, parseFloat(vb?.[2]) || 350, parseFloat(vb?.[3]) || 400);
  }

  function onEnd() {
    if (dragNode) {
      dragNode = null;
      saveMap({ nodes, edges, generatedAt: Date.now() });
    }
  }

  svg.addEventListener('mousedown', onStart);
  svg.addEventListener('mousemove', onMove);
  svg.addEventListener('mouseup', onEnd);
  svg.addEventListener('touchstart', onStart, { passive: false });
  svg.addEventListener('touchmove', onMove, { passive: false });
  svg.addEventListener('touchend', onEnd);
}

// ── Render last saved map (for returning to Notes tab) ──────────────────────
export function renderSavedMindmap(container) {
  const saved = loadMap();
  if (!saved || !saved.nodes || saved.nodes.length === 0) return false;

  const w = Math.max(container.offsetWidth || 350, 350);
  const h = Math.max(400, saved.nodes.length * 50 + 200);
  const edges = saved.edges || [];

  container.innerHTML = `
    <div class="mindmap-stats">
      <span>${saved.nodes.length} notes</span>
      <span>${edges.length} connections</span>
      <span class="mindmap-stats-time">Last mapped: ${new Date(saved.generatedAt || Date.now()).toLocaleString()}</span>
    </div>
    <div class="mindmap-canvas" id="mindmapCanvas" style="height: ${h}px;">
      <svg id="mindmapSvg" width="100%" height="100%"></svg>
    </div>
    <div class="mindmap-legend">
      <p class="mindmap-legend-label">Colors = time clusters | Lines = content similarity</p>
    </div>
  `;

  const svg = document.getElementById('mindmapSvg');
  const canvasEl = document.getElementById('mindmapCanvas');
  drawSvg(svg, saved.nodes, edges, w, h);
  enableDrag(svg, canvasEl, saved.nodes, edges, container);
  return true;
}

// Legacy export for backward compatibility during transition
export function renderMindmap(container) {
  if (!renderSavedMindmap(container)) {
    container.innerHTML = `
      <div class="mindmap-empty">
        <p>Add notes above, then tap "Let's mind my business!" to see your thought connections.</p>
      </div>`;
  }
}
