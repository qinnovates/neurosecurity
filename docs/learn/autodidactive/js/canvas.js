import { getAllNodes, getAllEdges, getConnections, getPeopleMap } from './graph.js';
import { CALCULUS_LABS } from './data/calculus.js';
import { getNotes } from './notewall.js';

export function syncNotes() {
  const pinnedNotes = getNotes().filter(n => n.canvasPinned);
  for (const pn of pinnedNotes) {
    let node = nodes.find(n => n.id === pn.id);
    if (!node) {
      node = {
        id: pn.id,
        name: pn.text.slice(0, 15) + (pn.text.length > 15 ? '...' : ''),
        text: pn.text,
        emoji: '📝',
        type: 'note',
        color: pn.color,
        x: width / 2 + (Math.random() - 0.5) * 400,
        y: height / 2 + (Math.random() - 0.5) * 400,
        vx: 0, vy: 0,
        active: true
      };
      nodes.push(node);
    } else {
      node.active = true;
      node.name = pn.text.slice(0, 15) + (pn.text.length > 15 ? '...' : '');
      node.text = pn.text;
    }
  }
  // Deactivate notes that are no longer pinned
  const pinnedIds = new Set(pinnedNotes.map(pn => pn.id));
  for (const n of nodes) {
    if (n.type === 'note' && !pinnedIds.has(n.id)) {
      n.active = false;
    }
  }
  startAnimation();
}



const CANVAS_KEY = 'autodidactive-canvases';
const PEOPLE_MAP = getPeopleMap();

function esc(str) {
  const div = document.createElement('div');
  div.textContent = str || '';
  return div.innerHTML;
}

// ── Canvas state ─────────────────────────────────────────────────────────────
let canvas, ctx, dpr;
let nodes = []; // { id, x, y, vx, vy, name, emoji, pinned }
let edges = []; // { source, target, type, label }
let width, height;
let dragging = null;
let dragOffset = { x: 0, y: 0 };
let pan = { x: 0, y: 0 };
let zoom = 1;
let animating = false;
let layoutMode = 'freeform'; // freeform | timeline | cluster
let lastTouch = null;
let pinchDist = null;
let selectedNode = null;

const NODE_RADIUS = 28;
const EDGE_COLORS = {
  field: '#10b981',
  pattern: '#8b5cf6',
  book: '#a855f7',
  crossref: '#3b82f6',
  lab: '#fbbf24',
  era: '#94a3b8'
};

// ── Saved canvases ───────────────────────────────────────────────────────────
function getSavedCanvases() {
  try { return JSON.parse(localStorage.getItem(CANVAS_KEY)) || {}; } catch { return {}; }
}

function saveCanvas(name) {
  const canvases = getSavedCanvases();
  canvases[name] = {
    nodes: nodes.map(n => ({ id: n.id, x: n.x, y: n.y, pinned: n.pinned })),
    pan: { ...pan },
    zoom,
    layoutMode
  };
  localStorage.setItem(CANVAS_KEY, JSON.stringify(canvases));
}

function loadCanvas(name) {
  const canvases = getSavedCanvases();
  const data = canvases[name];
  if (!data) return false;
  pan = data.pan || { x: 0, y: 0 };
  zoom = data.zoom || 1;
  layoutMode = data.layoutMode || 'freeform';
  for (const saved of data.nodes) {
    const node = nodes.find(n => n.id === saved.id);
    if (node) { node.x = saved.x; node.y = saved.y; node.pinned = saved.pinned; node.active = true; }
  }
  return true;
}

function deleteCanvas(name) {
  const canvases = getSavedCanvases();
  delete canvases[name];
  localStorage.setItem(CANVAS_KEY, JSON.stringify(canvases));
}

// ── Add/remove nodes from canvas ─────────────────────────────────────────────
export function addNodeToCanvas(id) {
  const node = nodes.find(n => n.id === id);
  if (node) {
    node.active = true;
    node.x = width / 2 + (Math.random() - 0.5) * 200;
    node.y = height / 2 + (Math.random() - 0.5) * 200;
    // Also activate connected nodes
    const connections = getConnections(id);
    for (const conn of connections) {
      const connected = nodes.find(n => n.id === conn.target);
      if (connected && connected.active) {
        // Edge already visible
      }
    }
    startAnimation();
  }
}

export function addPathToCanvas(stepIds) {
  for (const id of stepIds) {
    const node = nodes.find(n => n.id === id);
    if (node) {
      node.active = true;
      node.x = width / 2 + (Math.random() - 0.5) * 300;
      node.y = height / 2 + (Math.random() - 0.5) * 300;
    }
  }
  startAnimation();
}

export function branchOut(nodeId) {
  const related = getRelated(nodeId, 3);
  for (const r of related) {
    const node = nodes.find(n => n.id === r.id);
    if (node && !node.active) {
      node.active = true;
      const parent = nodes.find(n => n.id === nodeId);
      if (parent) {
        node.x = parent.x + (Math.random() - 0.5) * 100;
        node.y = parent.y + (Math.random() - 0.5) * 100;
      }
    }
  }
  startAnimation();
}


export function getActiveContext() {
  return activeNodes.map(n => n.name).join(', ');
}

// ── Initialize ───────────────────────────────────────────────────────────────
export function initCanvas(containerEl) {
  const container = containerEl;
  canvas = document.createElement('canvas');
  canvas.className = 'concept-canvas';
  container.appendChild(canvas);
  ctx = canvas.getContext('2d');

  resize();
  window.addEventListener('resize', resize);

  // Build all possible nodes (inactive by default)
  const allNodes = getAllNodes();
  const allEdges = getAllEdges();

  nodes = allNodes.map((n, i) => ({
    id: n.id,
    name: n.name,
    emoji: n.emoji,
    type: n.type,
    fields: n.fields,
    x: width / 2 + (Math.random() - 0.5) * width * 0.6,
    y: height / 2 + (Math.random() - 0.5) * height * 0.6,
    vx: 0, vy: 0,
    pinned: false,
    active: false
  }));

  edges = allEdges;

  // Input handlers
  canvas.addEventListener('mousedown', onMouseDown);
  canvas.addEventListener('mousemove', onMouseMove);
  canvas.addEventListener('mouseup', onMouseUp);
  canvas.addEventListener('wheel', onWheel, { passive: false });
  canvas.addEventListener('touchstart', onTouchStart, { passive: false });
  canvas.addEventListener('touchmove', onTouchMove, { passive: false });
  canvas.addEventListener('touchend', onTouchEnd);
  canvas.addEventListener('dblclick', onDblClick);

  startAnimation();
}

function resize() {
  if (!canvas) return;
  const rect = canvas.parentElement.getBoundingClientRect();
  dpr = window.devicePixelRatio || 1;
  width = rect.width;
  height = rect.height;
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  canvas.style.width = width + 'px';
  canvas.style.height = height + 'px';
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

// ── Force-directed layout (Fruchterman-Reingold) ─────────────────────────────
function simulate() {
  const activeNodes = nodes.filter(n => n.active);
  if (activeNodes.length < 2) return;

  const k = Math.sqrt((width * height) / activeNodes.length) * 0.5;
  const temp = 2;

  // Repulsion between all active nodes
  for (let i = 0; i < activeNodes.length; i++) {
    for (let j = i + 1; j < activeNodes.length; j++) {
      const a = activeNodes[i], b = activeNodes[j];
      let dx = a.x - b.x, dy = a.y - b.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      const force = (k * k) / dist * 0.1;
      const fx = (dx / dist) * force;
      const fy = (dy / dist) * force;
      if (!a.pinned && a !== dragging) { a.vx += fx; a.vy += fy; }
      if (!b.pinned && b !== dragging) { b.vx -= fx; b.vy -= fy; }
    }
  }

  // Attraction along edges
  const activeIds = new Set(activeNodes.map(n => n.id));
  for (const edge of edges) {
    if (!activeIds.has(edge.source) || !activeIds.has(edge.target)) continue;
    const a = nodes.find(n => n.id === edge.source);
    const b = nodes.find(n => n.id === edge.target);
    if (!a || !b) continue;
    let dx = b.x - a.x, dy = b.y - a.y;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
    const force = (dist / k) * 0.05 * (edge.weight || 1);
    const fx = (dx / dist) * force;
    const fy = (dy / dist) * force;
    if (!a.pinned && a !== dragging) { a.vx += fx; a.vy += fy; }
    if (!b.pinned && b !== dragging) { b.vx -= fx; b.vy -= fy; }
  }

  // Apply velocity with damping
  for (const node of activeNodes) {
    if (node.pinned || node === dragging) continue;
    const speed = Math.sqrt(node.vx * node.vx + node.vy * node.vy);
    if (speed > temp) {
      node.vx = (node.vx / speed) * temp;
      node.vy = (node.vy / speed) * temp;
    }
    node.x += node.vx;
    node.y += node.vy;
    node.vx *= 0.85;
    node.vy *= 0.85;
    // Bounds
    node.x = Math.max(NODE_RADIUS, Math.min(width - NODE_RADIUS, node.x));
    node.y = Math.max(NODE_RADIUS, Math.min(height - NODE_RADIUS, node.y));
  }
}

// ── Render ───────────────────────────────────────────────────────────────────
function draw() {
  ctx.clearRect(0, 0, width, height);
  ctx.save();
  ctx.translate(pan.x, pan.y);
  ctx.scale(zoom, zoom);

  const activeNodes = nodes.filter(n => n.active);
  const activeIds = new Set(activeNodes.map(n => n.id));

  // Draw edges
  for (const edge of edges) {
    if (!activeIds.has(edge.source) || !activeIds.has(edge.target)) continue;
    const a = nodes.find(n => n.id === edge.source);
    const b = nodes.find(n => n.id === edge.target);
    if (!a || !b) continue;

    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.strokeStyle = EDGE_COLORS[edge.type] || '#cbd5e1';
    ctx.lineWidth = Math.min(edge.weight || 1, 3) * 0.5;
    ctx.globalAlpha = 0.4;
    ctx.stroke();
    ctx.globalAlpha = 1;

    // Edge label at midpoint
    if (zoom > 0.7) {
      const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
      ctx.font = `${9 / zoom}px "Outfit", sans-serif`;
      ctx.fillStyle = '#94a3b8';
      ctx.textAlign = 'center';
      ctx.fillText(edge.label || edge.type, mx, my - 4);
    }
  }

  // Draw nodes
  for (const node of activeNodes) {
    const isSelected = selectedNode === node;

    if (node.type === 'note') {
      const colors = ['#fef3c7', '#fce7f3', '#d1fae5', '#dbeafe', '#ede9fe'];
      const bg = colors[node.color] || colors[0];

      ctx.fillStyle = bg;
      ctx.shadowColor = 'rgba(0,0,0,0.1)';
      ctx.shadowBlur = 4;
      ctx.shadowOffsetY = 2;
      ctx.fillRect(node.x - 40, node.y - 30, 80, 60);
      ctx.shadowBlur = 0;
      ctx.shadowOffsetY = 0;

      ctx.strokeStyle = isSelected ? '#3b82f6' : 'rgba(0,0,0,0.1)';
      ctx.lineWidth = isSelected ? 2 : 1;
      ctx.strokeRect(node.x - 40, node.y - 30, 80, 60);

      ctx.font = `${9}px "EB Garamond", serif`;
      ctx.fillStyle = '#1e293b';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const words = node.name.split(' ');
      ctx.fillText(words.slice(0, 3).join(' '), node.x, node.y - 8);
      if (words.length > 3) ctx.fillText(words.slice(3, 6).join(' '), node.x, node.y + 8);
    } else {
      // Circle background
      ctx.beginPath();
      ctx.arc(node.x, node.y, NODE_RADIUS, 0, Math.PI * 2);
      ctx.fillStyle = isSelected ? '#e0f2fe' : '#fff';
      ctx.fill();
      ctx.strokeStyle = isSelected ? '#3b82f6' : '#e2e8f0';
      ctx.lineWidth = isSelected ? 2 : 1;
      ctx.stroke();

      // Emoji
      ctx.font = `${20}px serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(node.emoji, node.x, node.y - 1);

      // Name below
      ctx.font = `500 ${10}px "Outfit", sans-serif`;
      ctx.fillStyle = '#0f172a';
      ctx.textBaseline = 'top';
      ctx.fillText(node.name.length > 14 ? node.name.slice(0, 12) + '..' : node.name, node.x, node.y + NODE_RADIUS + 4);
    }
  }

  ctx.restore();
}

// ── Animation loop ───────────────────────────────────────────────────────────
let frameId = null;
function startAnimation() {
  if (animating) return;
  animating = true;
  let frames = 0;
  function tick() {
    simulate();
    draw();
    frames++;
    if (frames < 300 || dragging) {
      frameId = requestAnimationFrame(tick);
    } else {
      animating = false;
      draw(); // Final frame
    }
  }
  tick();
}

export function stopAnimation() {
  animating = false;
  if (frameId) cancelAnimationFrame(frameId);
}

// ── Input handlers ───────────────────────────────────────────────────────────
function screenToCanvas(sx, sy) {
  return { x: (sx - pan.x) / zoom, y: (sy - pan.y) / zoom };
}

function hitTest(cx, cy) {
  for (const node of nodes) {
    if (!node.active) continue;
    const dx = node.x - cx, dy = node.y - cy;
    if (dx * dx + dy * dy < NODE_RADIUS * NODE_RADIUS) return node;
  }
  return null;
}

function onMouseDown(e) {
  const rect = canvas.getBoundingClientRect();
  const { x, y } = screenToCanvas(e.clientX - rect.left, e.clientY - rect.top);
  const node = hitTest(x, y);
  if (node) {
    dragging = node;
    dragOffset = { x: x - node.x, y: y - node.y };
    selectedNode = node;
    canvas.style.cursor = 'grabbing';
    startAnimation();
  } else {
    selectedNode = null;
    lastTouch = { x: e.clientX, y: e.clientY };
  }
  if (window._updateCanvasControls) window._updateCanvasControls();
  draw();
}


function onMouseMove(e) {
  const rect = canvas.getBoundingClientRect();
  const { x, y } = screenToCanvas(e.clientX - rect.left, e.clientY - rect.top);
  if (dragging) {
    dragging.x = x - dragOffset.x;
    dragging.y = y - dragOffset.y;
    draw();
  } else if (lastTouch) {
    pan.x += e.clientX - lastTouch.x;
    pan.y += e.clientY - lastTouch.y;
    lastTouch = { x: e.clientX, y: e.clientY };
    draw();
  } else {
    const node = hitTest(x, y);
    canvas.style.cursor = node ? 'grab' : 'default';
  }
}

function onMouseUp() {
  dragging = null;
  lastTouch = null;
  canvas.style.cursor = 'default';
}

function onWheel(e) {
  e.preventDefault();
  const delta = e.deltaY > 0 ? 0.9 : 1.1;
  const newZoom = Math.max(0.2, Math.min(3, zoom * delta));
  const rect = canvas.getBoundingClientRect();
  const mx = e.clientX - rect.left, my = e.clientY - rect.top;
  pan.x = mx - ((mx - pan.x) / zoom) * newZoom;
  pan.y = my - ((my - pan.y) / zoom) * newZoom;
  zoom = newZoom;
  draw();
}

function onTouchStart(e) {
  if (e.touches.length === 1) {
    const t = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    const { x, y } = screenToCanvas(t.clientX - rect.left, t.clientY - rect.top);
    const node = hitTest(x, y);
    if (node) {
      e.preventDefault();
      dragging = node;
      dragOffset = { x: x - node.x, y: y - node.y };
      selectedNode = node;
      startAnimation();
    } else {
      lastTouch = { x: t.clientX, y: t.clientY };
    }
  } else if (e.touches.length === 2) {
    e.preventDefault();
    const dx = e.touches[0].clientX - e.touches[1].clientX;
    const dy = e.touches[0].clientY - e.touches[1].clientY;
    pinchDist = Math.sqrt(dx * dx + dy * dy);
  }
}

function onTouchMove(e) {
  if (e.touches.length === 1 && dragging) {
    e.preventDefault();
    const t = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    const { x, y } = screenToCanvas(t.clientX - rect.left, t.clientY - rect.top);
    dragging.x = x - dragOffset.x;
    dragging.y = y - dragOffset.y;
    draw();
  } else if (e.touches.length === 1 && lastTouch) {
    const t = e.touches[0];
    pan.x += t.clientX - lastTouch.x;
    pan.y += t.clientY - lastTouch.y;
    lastTouch = { x: t.clientX, y: t.clientY };
    draw();
  } else if (e.touches.length === 2 && pinchDist) {
    e.preventDefault();
    const dx = e.touches[0].clientX - e.touches[1].clientX;
    const dy = e.touches[0].clientY - e.touches[1].clientY;
    const newDist = Math.sqrt(dx * dx + dy * dy);
    const scale = newDist / pinchDist;
    zoom = Math.max(0.2, Math.min(3, zoom * scale));
    pinchDist = newDist;
    draw();
  }
}

function onTouchEnd() {
  dragging = null;
  lastTouch = null;
  pinchDist = null;
}

function onDblClick(e) {
  const rect = canvas.getBoundingClientRect();
  const { x, y } = screenToCanvas(e.clientX - rect.left, e.clientY - rect.top);
  const node = hitTest(x, y);
  if (node) {
    if (node.type === 'lab') {
      window._openLab(node.id);
    } else {
      window._openPerson(node.id);
    }
  }
}

// ── Layout modes ─────────────────────────────────────────────────────────────
export function setLayout(mode) {
  layoutMode = mode;
  const activeNodes = nodes.filter(n => n.active);

  if (mode === 'timeline') {
    // Sort by era year, spread horizontally
    const nodesWithYears = activeNodes.map(n => ({
      node: n,
      year: parseYear(n.fields.includes('Person') || n.type === 'person' ? PEOPLE_MAP.get(n.id)?.years : '')
    })).filter(n => n.year !== null);

    if (nodesWithYears.length > 0) {
      const minYear = Math.min(...nodesWithYears.map(n => n.year));
      const maxYear = Math.max(...nodesWithYears.map(n => n.year));
      const span = maxYear - minYear || 100;

      nodesWithYears.forEach(({ node, year }) => {
        node.x = 80 + ((year - minYear) / span) * (width - 160);
        node.y = height / 2 + (Math.random() - 0.5) * 100;
        node.pinned = true; // Pin during timeline mode
      });
    }
  } else if (mode === 'circular') {
    activeNodes.forEach((n, i) => {
      const angle = (i / activeNodes.length) * Math.PI * 2;
      n.x = width / 2 + Math.cos(angle) * 200;
      n.y = height / 2 + Math.sin(angle) * 200;
      n.pinned = true;
    });
  } else {
    // Freeform — unpin all
    for (const n of activeNodes) n.pinned = false;
  }
  startAnimation();
}

function parseYear(years) {
  if (!years) return null;
  const bc = years.match(/(\d+)\s*BC/i);
  if (bc) return -parseInt(bc[1], 10);
  const m = years.match(/(\d{3,4})/);
  return m ? parseInt(m[1], 10) : null;
}


// ── Tray render ──────────────────────────────────────────────────────────────
export function renderTray() {
  const allNodes = getAllNodes();
  return allNodes.filter(n => n.type === 'person').map(n => `
    <div class="canvas-tray-item" draggable="true" data-id="${n.id}" onclick="window._addToCanvas('${n.id}')">
      <span class="canvas-tray-emoji">${n.emoji}</span>
      <span class="canvas-tray-name">${esc(n.name.split(' ').pop())}</span>
    </div>
  `).join('');
}

// ── Canvas controls render ───────────────────────────────────────────────────
export function renderCanvasControls() {
  const saved = Object.keys(getSavedCanvases());
  return `
    <div class="canvas-controls">
      <div class="canvas-header">
        <div class="canvas-title">Concept Canvas</div>
        <div class="canvas-layouts">
          <button class="layout-btn ${layout === 'free' ? 'active' : ''}" onclick="window._setLayout('free')">Free</button>
          <button class="layout-btn ${layout === 'circular' ? 'active' : ''}" onclick="window._setLayout('circular')">Circle</button>
          <button class="layout-btn ${layout === 'timeline' ? 'active' : ''}" onclick="window._setLayout('timeline')">Timeline</button>
        </div>
      </div>
      <div class="canvas-actions">
        ${selectedNode ? `<button class="canvas-action-btn btn-branch" onclick="window._branchOut('${selectedNode.id}')">Branch Out</button>` : ''}
        <button class="canvas-action-btn" onclick="window._synthesize()">Synthesize</button>
        <button class="canvas-action-btn" onclick="window._saveCanvas()">Save</button>

        <button class="canvas-action-btn" onclick="window._clearCanvas()">Clear</button>
      </div>
      ${saved.length > 0 ? `
        <div class="canvas-saved">
          ${saved.map(name => `
            <button class="canvas-saved-btn" onclick="window._loadCanvas('${esc(name)}')">${esc(name)}</button>
          `).join('')}
        </div>
      ` : ''}
    </div>
  `;
}


export { saveCanvas, loadCanvas, deleteCanvas, nodes };
