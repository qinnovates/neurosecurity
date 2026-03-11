// Mindmap — Free-form topic mapping with auto-connections
// Users add topics, system finds logical connections using keyword matching + knowledge graph

import { search } from './search.js';
import { getRelated, getPeopleMap } from './graph.js';

const STORAGE_KEY = 'autodidactive-mindmap';
const PEOPLE_MAP = getPeopleMap();
const MAX_NODES = 100;
const MAX_TOPIC_LENGTH = 80;
const MAX_LABEL_RENDER = 18;

// ── Colors for auto-assigned clusters ──────────────────────────────────────
const CLUSTER_COLORS = [
  '#10b981', '#3b82f6', '#8b5cf6', '#ef4444', '#f59e0b',
  '#ec4899', '#14b8a6', '#f97316', '#6366f1', '#84cc16'
];

function esc(str) {
  const div = document.createElement('div');
  div.textContent = str || '';
  return div.innerHTML;
}

// ── Sanitization ──────────────────────────────────────────────────────────
const ID_RE = /^mm-\d{1,15}$/;
const HEX_RE = /^#[0-9a-fA-F]{6}$/;

function isFiniteNum(v) { return typeof v === 'number' && Number.isFinite(v); }

function sanitizeNode(n) {
  if (!n || typeof n !== 'object') return null;
  const id = typeof n.id === 'string' && ID_RE.test(n.id) ? n.id : null;
  if (!id) return null;
  const label = typeof n.label === 'string' ? n.label.slice(0, MAX_TOPIC_LENGTH) : '';
  const color = typeof n.color === 'string' && HEX_RE.test(n.color) ? n.color : CLUSTER_COLORS[0];
  return {
    id,
    label,
    color,
    linkedPersonId: typeof n.linkedPersonId === 'string' ? n.linkedPersonId.slice(0, 80) : null,
    x: isFiniteNum(n.x) ? n.x : 0,
    y: isFiniteNum(n.y) ? n.y : 0,
    pinned: n.pinned === true
  };
}

function sanitizeEdge(e, validIds) {
  if (!e || typeof e !== 'object') return null;
  const sourceId = typeof e.sourceId === 'string' && validIds.has(e.sourceId) ? e.sourceId : null;
  const targetId = typeof e.targetId === 'string' && validIds.has(e.targetId) ? e.targetId : null;
  if (!sourceId || !targetId) return null;
  return {
    sourceId,
    targetId,
    strength: isFiniteNum(e.strength) ? Math.max(0, Math.min(e.strength, 20)) : 1,
    reason: typeof e.reason === 'string' ? e.reason.slice(0, 100) : ''
  };
}

// ── Persistence ────────────────────────────────────────────────────────────
function loadMap() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { nodes: [], edges: [] };
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return { nodes: [], edges: [] };
    const nodes = Array.isArray(parsed.nodes)
      ? parsed.nodes.map(sanitizeNode).filter(Boolean).slice(0, MAX_NODES)
      : [];
    const validIds = new Set(nodes.map(n => n.id));
    const edges = Array.isArray(parsed.edges)
      ? parsed.edges.map(e => sanitizeEdge(e, validIds)).filter(Boolean)
      : [];
    return { nodes, edges };
  } catch { return { nodes: [], edges: [] }; }
}

function saveMap(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

// ── Auto-connect logic ─────────────────────────────────────────────────────
function findConnections(newTopic, existingNodes) {
  const connections = [];
  const topicWords = newTopic.toLowerCase().split(/\s+/);

  for (const node of existingNodes) {
    const nodeWords = node.label.toLowerCase().split(/\s+/);
    // Shared word matching (skip very short words)
    const shared = topicWords.filter(w => w.length > 3 && nodeWords.some(nw => nw.includes(w) || w.includes(nw)));
    if (shared.length > 0) {
      connections.push({ targetId: node.id, strength: shared.length, reason: shared.join(', ') });
    }
  }

  // Also check against the knowledge graph
  const results = search(newTopic);
  const matchedIds = new Set(results.slice(0, 5).map(r => r.id));

  for (const node of existingNodes) {
    if (node.linkedPersonId && matchedIds.has(node.linkedPersonId)) {
      const existing = connections.find(c => c.targetId === node.id);
      if (!existing) {
        connections.push({ targetId: node.id, strength: 2, reason: 'knowledge graph' });
      } else {
        existing.strength += 2;
      }
    }
    // Check if both topics match the same person
    const nodeResults = search(node.label);
    const nodeMatchedIds = new Set(nodeResults.slice(0, 3).map(r => r.id));
    const overlap = [...matchedIds].filter(id => nodeMatchedIds.has(id));
    if (overlap.length > 0 && !connections.find(c => c.targetId === node.id)) {
      const person = PEOPLE_MAP.get(overlap[0]);
      connections.push({
        targetId: node.id,
        strength: overlap.length,
        reason: person ? person.name : 'shared concept'
      });
    }
  }

  return connections;
}

// ── Force-directed layout ──────────────────────────────────────────────────
function applyForceLayout(nodes, edges, width, height) {
  const iterations = 50;
  const k = Math.sqrt((width * height) / Math.max(nodes.length, 1)) * 0.5;

  for (let iter = 0; iter < iterations; iter++) {
    // Repulsion between all nodes
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dx = nodes[i].x - nodes[j].x;
        const dy = nodes[i].y - nodes[j].y;
        const dist = Math.max(Math.sqrt(dx * dx + dy * dy), 1);
        const force = (k * k) / dist * 0.5;
        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;
        if (!nodes[i].pinned) { nodes[i].x += fx; nodes[i].y += fy; }
        if (!nodes[j].pinned) { nodes[j].x -= fx; nodes[j].y -= fy; }
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
      const force = (dist - k) * 0.01;
      const fx = (dx / dist) * force;
      const fy = (dy / dist) * force;
      if (!source.pinned) { source.x += fx; source.y += fy; }
      if (!target.pinned) { target.x -= fx; target.y -= fy; }
    }

    // Center gravity
    for (const node of nodes) {
      if (node.pinned) continue;
      node.x += (width / 2 - node.x) * 0.01;
      node.y += (height / 2 - node.y) * 0.01;
    }
  }

  // Clamp to bounds
  for (const node of nodes) {
    node.x = Math.max(60, Math.min(width - 60, node.x));
    node.y = Math.max(40, Math.min(height - 40, node.y));
  }
}

// ── Render ─────────────────────────────────────────────────────────────────
export function renderMindmap(container) {
  const data = loadMap();
  const mapHeight = Math.max(400, data.nodes.length * 60 + 200);

  container.innerHTML = `
    <div class="mindmap-section">
      <div class="mindmap-input-row">
        <input type="text" id="mindmapInput" class="mindmap-input"
               placeholder="Type a topic and press Enter..." autocomplete="off" />
        <button id="mindmapAdd" class="mindmap-add-btn">+</button>
      </div>
      <div class="mindmap-hint">${data.nodes.length === 0 ? 'Add your first topic to start building connections.' : `${data.nodes.length} topics, ${data.edges.length} connections`}</div>
      <div class="mindmap-canvas" id="mindmapCanvas" style="height: ${mapHeight}px;">
        <svg id="mindmapSvg" width="100%" height="100%"></svg>
      </div>
      ${data.nodes.length > 0 ? `<button class="mindmap-clear-btn" id="mindmapClear">Clear Map</button>` : ''}
    </div>
  `;

  const svg = document.getElementById('mindmapSvg');
  const canvasEl = document.getElementById('mindmapCanvas');
  const input = document.getElementById('mindmapInput');
  const addBtn = document.getElementById('mindmapAdd');
  const clearBtn = document.getElementById('mindmapClear');

  // Render existing nodes
  if (data.nodes.length > 0) {
    const rect = canvasEl.getBoundingClientRect();
    const w = rect.width || 350;
    const h = mapHeight;

    // Initialize positions if needed
    for (const node of data.nodes) {
      if (!node.x || !node.y) {
        node.x = w / 2 + (Math.random() - 0.5) * (w * 0.6);
        node.y = h / 2 + (Math.random() - 0.5) * (h * 0.6);
      }
    }

    applyForceLayout(data.nodes, data.edges, w, h);
    drawSvg(svg, data, w, h);
    saveMap(data); // save computed positions
  }

  function addTopic() {
    const topic = input.value.trim().slice(0, MAX_TOPIC_LENGTH);
    if (!topic) return;

    const data = loadMap();
    if (data.nodes.length >= MAX_NODES) {
      input.value = '';
      return;
    }
    const id = 'mm-' + Date.now();
    const colorIdx = data.nodes.length % CLUSTER_COLORS.length;

    // Find best matching person from knowledge graph
    const results = search(topic);
    const linkedPersonId = results.length > 0 ? results[0].id : null;

    const rect = canvasEl.getBoundingClientRect();
    const w = rect.width || 350;

    const newNode = {
      id,
      label: topic,
      color: CLUSTER_COLORS[colorIdx],
      linkedPersonId,
      x: w / 2 + (Math.random() - 0.5) * 100,
      y: mapHeight / 2 + (Math.random() - 0.5) * 100,
      pinned: false
    };

    // Find auto-connections
    const connections = findConnections(topic, data.nodes);
    const newEdges = connections.map(c => ({
      sourceId: id,
      targetId: c.targetId,
      strength: c.strength,
      reason: c.reason
    }));

    data.nodes.push(newNode);
    data.edges.push(...newEdges);

    applyForceLayout(data.nodes, data.edges, w, mapHeight);
    saveMap(data);

    input.value = '';
    renderMindmap(container); // re-render
  }

  input.addEventListener('keydown', e => { if (e.key === 'Enter') addTopic(); });
  addBtn.addEventListener('click', addTopic);

  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      if (confirm('Clear the entire mindmap?')) {
        saveMap({ nodes: [], edges: [] });
        renderMindmap(container);
      }
    });
  }

  // Node drag
  enableDrag(svg, canvasEl, data, container);
}

function drawSvg(svg, data, w, h) {
  svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
  let html = '';

  // Edges
  for (const edge of data.edges) {
    const source = data.nodes.find(n => n.id === edge.sourceId);
    const target = data.nodes.find(n => n.id === edge.targetId);
    if (!source || !target) continue;

    const mx = (source.x + target.x) / 2;
    const my = (source.y + target.y) / 2;
    const opacity = Math.min(0.8, 0.2 + edge.strength * 0.15);

    html += `<line x1="${source.x}" y1="${source.y}" x2="${target.x}" y2="${target.y}"
                   stroke="#94a3b8" stroke-width="${Math.min(3, 0.5 + edge.strength * 0.5)}" stroke-opacity="${opacity}" />`;
    html += `<text x="${mx}" y="${my - 6}" text-anchor="middle" fill="#94a3b8" font-size="9" opacity="0.7">${esc(edge.reason)}</text>`;
  }

  // Nodes
  for (const node of data.nodes) {
    const r = 8 + Math.min(node.label.length * 0.5, 12);
    const safeId = esc(node.id);
    const safeColor = esc(node.color);
    const cx = isFiniteNum(node.x) ? node.x : 0;
    const cy = isFiniteNum(node.y) ? node.y : 0;
    html += `
      <g class="mindmap-node" data-id="${safeId}" style="cursor: grab;">
        <circle cx="${cx}" cy="${cy}" r="${r}" fill="${safeColor}" fill-opacity="0.15" stroke="${safeColor}" stroke-width="2" />
        <text x="${cx}" y="${cy + 4}" text-anchor="middle" fill="${safeColor}" font-size="11" font-weight="600" font-family="var(--font-display, sans-serif)">
          ${esc(node.label.length > MAX_LABEL_RENDER ? node.label.slice(0, MAX_LABEL_RENDER - 2) + '...' : node.label)}
        </text>
      </g>
    `;
  }

  svg.innerHTML = html;
}

function enableDrag(svg, canvasEl, data, container) {
  let dragNode = null;
  let offset = { x: 0, y: 0 };

  function getSvgPoint(e) {
    const rect = canvasEl.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const scaleX = (parseFloat(svg.getAttribute('viewBox')?.split(' ')[2]) || rect.width) / rect.width;
    const scaleY = (parseFloat(svg.getAttribute('viewBox')?.split(' ')[3]) || rect.height) / rect.height;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  }

  function onStart(e) {
    const pt = getSvgPoint(e);
    for (const node of data.nodes) {
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
    const rect = canvasEl.getBoundingClientRect();
    const w = parseFloat(svg.getAttribute('viewBox')?.split(' ')[2]) || rect.width;
    const h = parseFloat(svg.getAttribute('viewBox')?.split(' ')[3]) || rect.height;
    drawSvg(svg, data, w, h);
  }

  function onEnd() {
    if (dragNode) {
      dragNode.pinned = true;
      dragNode = null;
      saveMap(data);
    }
  }

  svg.addEventListener('mousedown', onStart);
  svg.addEventListener('mousemove', onMove);
  svg.addEventListener('mouseup', onEnd);
  svg.addEventListener('touchstart', onStart, { passive: false });
  svg.addEventListener('touchmove', onMove, { passive: false });
  svg.addEventListener('touchend', onEnd);
}
