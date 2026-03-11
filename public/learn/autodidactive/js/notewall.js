// Note Wall — free-placement post-it notes with localStorage persistence

const STORAGE_KEY = 'autodidactive-notes';
const NOTE_COLORS = [
  { name: 'yellow', bg: '#fef3c7', border: '#f59e0b' },
  { name: 'pink', bg: '#fce7f3', border: '#ec4899' },
  { name: 'green', bg: '#d1fae5', border: '#10b981' },
  { name: 'blue', bg: '#dbeafe', border: '#3b82f6' },
  { name: 'purple', bg: '#ede9fe', border: '#8b5cf6' }
];

let notes = [];
let wallEl = null;
let dragState = null;

const DEFAULT_NOTE = {
  id: 'default-welcome',
  text: 'Hello world! Feel free to drop a note here.',
  x: 15, y: 12,
  color: 0,
  rotation: -1.5,
  created: Date.now()
};

function sanitizeNote(n) {
  if (!n || typeof n !== 'object') return null;
  if (typeof n.id !== 'string' || n.id.length > 30) return null;
  return {
    id: n.id,
    text: typeof n.text === 'string' ? n.text.slice(0, 500) : '',
    x: typeof n.x === 'number' && Number.isFinite(n.x) ? n.x : 15,
    y: typeof n.y === 'number' && Number.isFinite(n.y) ? n.y : 12,
    color: typeof n.color === 'number' && n.color >= 0 && n.color < NOTE_COLORS.length ? n.color : 0,
    rotation: typeof n.rotation === 'number' || typeof n.rotation === 'string' ? Number(n.rotation) || 0 : 0,
    author: typeof n.author === 'string' ? n.author.slice(0, 30) : '',
    timestamp: typeof n.timestamp === 'number' ? n.timestamp : Date.now(),
    pinned: n.pinned === true,
    canvasPinned: n.canvasPinned === true
  };
}

function loadNotes() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) { notes = [DEFAULT_NOTE]; return notes; }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) { notes = [DEFAULT_NOTE]; return notes; }
    notes = parsed.map(sanitizeNote).filter(Boolean).slice(0, 200);
    if (notes.length === 0) notes = [DEFAULT_NOTE];
  } catch {
    notes = [DEFAULT_NOTE];
  }
  return notes;
}

function saveNotes() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function randomRotation() {
  return (Math.random() * 5 - 2.5).toFixed(1);
}

function createNoteData(x, y, text = '', colorIdx = 0) {
  return {
    id: generateId(),
    text,
    x: Math.max(8, Math.min(x, 300)),
    y: Math.max(8, y),
    color: colorIdx,
    rotation: randomRotation(),
    author: '',
    timestamp: Date.now(),
    pinned: false,
    canvasPinned: false
  };
}

function renderNote(note) {
  const color = NOTE_COLORS[note.color] || NOTE_COLORS[0];
  const el = document.createElement('div');
  el.className = 'post-it' + (note.pinned ? ' pinned' : '') + (note.canvasPinned ? ' canvas-pinned' : '');
  el.dataset.noteId = note.id;
  el.style.cssText = `
    left: ${note.x}px;
    top: ${note.y}px;
    --rotation: ${note.rotation}deg;
    background: ${color.bg};
    border-left: 3px solid ${color.border};
  `;

  const time = new Date(note.timestamp);
  const timeStr = time.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  el.innerHTML = `
    <div class="post-it-content">${escapeHtml(note.text)}</div>
    <div class="post-it-meta">
      <span class="post-it-time">${timeStr}</span>
      ${note.author ? `<span class="post-it-author">${escapeHtml(note.author)}</span>` : ''}
    </div>
    <div class="post-it-actions">
      <button class="post-it-canvas-pin" title="Pin to Canvas">${note.canvasPinned ? '🖼️' : '◻️'}</button>
      <button class="post-it-pin" title="${note.pinned ? 'Unpin' : 'Pin'}">${note.pinned ? '📌' : '📍'}</button>
      <button class="post-it-delete" title="Delete">✕</button>
    </div>
  `;


  // Drag handling
  const startDrag = (startX, startY) => {
    const rect = el.getBoundingClientRect();
    const wallRect = wallEl.getBoundingClientRect();
    dragState = {
      noteId: note.id,
      offsetX: startX - rect.left,
      offsetY: startY - rect.top,
      wallLeft: wallRect.left,
      wallTop: wallRect.top
    };
    el.classList.add('dragging');
  };

  el.addEventListener('mousedown', (e) => {
    if (e.target.closest('.post-it-actions')) return;
    e.preventDefault();
    startDrag(e.clientX, e.clientY);
  });

  el.addEventListener('touchstart', (e) => {
    if (e.target.closest('.post-it-actions')) return;
    const touch = e.touches[0];
    startDrag(touch.clientX, touch.clientY);
  }, { passive: true });

  // Pin to Canvas
  el.querySelector('.post-it-canvas-pin').addEventListener('click', (e) => {
    e.stopPropagation();
    const n = notes.find(n => n.id === note.id);
    if (n) {
      n.canvasPinned = !n.canvasPinned;
      saveNotes();
      renderWall();
      if (window._syncNotesToCanvas) window._syncNotesToCanvas();
    }
  });

  // Pin
  el.querySelector('.post-it-pin').addEventListener('click', (e) => {

    e.stopPropagation();
    const n = notes.find(n => n.id === note.id);
    if (n) {
      n.pinned = !n.pinned;
      saveNotes();
      renderWall();
    }
  });

  // Delete
  el.querySelector('.post-it-delete').addEventListener('click', (e) => {
    e.stopPropagation();
    notes = notes.filter(n => n.id !== note.id);
    saveNotes();
    el.remove();
  });

  return el;
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function renderWall() {
  if (!wallEl) return;
  const noteEls = wallEl.querySelectorAll('.post-it');
  noteEls.forEach(el => el.remove());

  // Sort: pinned first, then by timestamp
  const sorted = [...notes].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return b.timestamp - a.timestamp;
  });

  sorted.forEach(note => {
    wallEl.appendChild(renderNote(note));
  });
}

function showAddNoteForm(x, y) {
  // Remove any existing form
  const existing = wallEl.querySelector('.note-form');
  if (existing) existing.remove();

  const form = document.createElement('div');
  form.className = 'note-form';
  form.style.cssText = `left: ${x}px; top: ${y}px;`;

  form.innerHTML = `
    <textarea class="note-form-input" placeholder="Write a note..." rows="3" maxlength="500"></textarea>
    <div class="note-form-colors">
      ${NOTE_COLORS.map((c, i) => `
        <button class="note-color-btn${i === 0 ? ' active' : ''}" data-color="${i}" style="background:${c.bg}; border: 2px solid ${c.border};" title="${c.name}"></button>
      `).join('')}
    </div>
    <div class="note-form-footer">
      <input class="note-form-author" type="text" placeholder="Name (optional)" maxlength="30" />
      <div class="note-form-btns">
        <button class="note-form-cancel">Cancel</button>
        <button class="note-form-save">Add</button>
      </div>
    </div>
  `;

  let selectedColor = 0;

  form.querySelectorAll('.note-color-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      form.querySelectorAll('.note-color-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selectedColor = parseInt(btn.dataset.color, 10);
    });
  });

  form.querySelector('.note-form-cancel').addEventListener('click', () => form.remove());

  form.querySelector('.note-form-save').addEventListener('click', () => {
    const text = form.querySelector('.note-form-input').value.trim();
    if (!text) return;
    const author = form.querySelector('.note-form-author').value.trim();
    const note = createNoteData(x, y, text, selectedColor);
    note.author = author;
    notes.push(note);
    saveNotes();
    form.remove();
    wallEl.appendChild(renderNote(note));
  });

  // Auto-focus textarea
  wallEl.appendChild(form);
  form.querySelector('.note-form-input').focus();

  // Enter to save (shift+enter for newline)
  form.querySelector('.note-form-input').addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      form.querySelector('.note-form-save').click();
    }
  });
}

export function initNoteWall(container) {
  wallEl = container;
  loadNotes();
  renderWall();

  // Click on empty wall space to add note
  wallEl.addEventListener('click', (e) => {
    if (e.target === wallEl || e.target.classList.contains('notewall-bg')) {
      const rect = wallEl.getBoundingClientRect();
      const x = e.clientX - rect.left + wallEl.scrollLeft;
      const y = e.clientY - rect.top + wallEl.scrollTop;
      showAddNoteForm(x, y);
    }
  });

  // Touch to add on mobile
  wallEl.addEventListener('touchend', (e) => {
    if (e.target === wallEl || e.target.classList.contains('notewall-bg')) {
      if (dragState) return; // Was dragging, not tapping
      const touch = e.changedTouches[0];
      const rect = wallEl.getBoundingClientRect();
      const x = touch.clientX - rect.left + wallEl.scrollLeft;
      const y = touch.clientY - rect.top + wallEl.scrollTop;
      showAddNoteForm(x, y);
    }
  });

  // Global move handlers for drag
  function findNoteEl(noteId) {
    // Safe lookup — avoid selector injection by iterating instead of querySelector
    const els = wallEl.querySelectorAll('.post-it');
    for (const el of els) {
      if (el.dataset.noteId === noteId) return el;
    }
    return null;
  }

  const onMove = (clientX, clientY) => {
    if (!dragState) return;
    const x = clientX - dragState.wallLeft - dragState.offsetX + wallEl.scrollLeft;
    const y = clientY - dragState.wallTop - dragState.offsetY + wallEl.scrollTop;
    const el = findNoteEl(dragState.noteId);
    if (el) {
      el.style.left = `${Math.max(0, x)}px`;
      el.style.top = `${Math.max(0, y)}px`;
    }
  };

  const onEnd = (clientX, clientY) => {
    if (!dragState) return;
    const x = clientX - dragState.wallLeft - dragState.offsetX + wallEl.scrollLeft;
    const y = clientY - dragState.wallTop - dragState.offsetY + wallEl.scrollTop;
    const note = notes.find(n => n.id === dragState.noteId);
    if (note) {
      note.x = Math.max(0, x);
      note.y = Math.max(0, y);
      saveNotes();
    }
    const el = findNoteEl(dragState.noteId);
    if (el) el.classList.remove('dragging');
    dragState = null;
  };

  document.addEventListener('mousemove', (e) => onMove(e.clientX, e.clientY));
  document.addEventListener('mouseup', (e) => onEnd(e.clientX, e.clientY));
  document.addEventListener('touchmove', (e) => {
    if (dragState) {
      const touch = e.touches[0];
      onMove(touch.clientX, touch.clientY);
    }
  });
  document.addEventListener('touchend', (e) => {
    if (dragState) {
      const touch = e.changedTouches[0];
      onEnd(touch.clientX, touch.clientY);
    }
  });
}

export function getNotes() {
  return loadNotes();
}

export function getNotesForBackground() {
  loadNotes();
  return notes.slice(0, 12); // Max 12 for background decoration
}
