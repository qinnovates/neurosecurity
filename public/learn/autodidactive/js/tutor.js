// AI Tutor — Autodidactive v2
// Tier 1: Template-based intent routing (always available, offline)
// Tier 2: Optional WebLLM RAG (on-device, user opt-in)

import { search } from './search.js';
import { getRelated, getPathWithEdges, getPeopleMap } from './graph.js';
import { LEARNING_PATHS, generatePath, renderPathDetail } from './paths.js';
import { addPathToCanvas, addNodeToCanvas } from './canvas.js';
import { IMPLEMENT_PRACTICES, PATTERNS, ACTION_EXAMPLES } from './data/patterns.js';
import { CALCULUS_LABS } from './data/calculus.js';

const CHAT_KEY = 'autodidactive-chat';
const TUTOR_KEY = 'autodidactive-tutor-prefs';
const STYLE_KEY = 'autodidactive-learning-style';
const PEOPLE_MAP = getPeopleMap();

function esc(str) {
  const div = document.createElement('div');
  div.textContent = str || '';
  return div.innerHTML;
}

// ── Learning style tracker ───────────────────────────────────────────────────
const styleCounters = {
  cards: 0,     // Reading person cards
  canvas: 0,    // Using canvas/spatial
  paths: 0,     // Following paths
  notes: 0,     // Taking notes
  recall: 0     // Doing recall exercises
};

function loadStyle() {
  try {
    const saved = JSON.parse(localStorage.getItem(STYLE_KEY));
    if (saved) Object.assign(styleCounters, saved);
  } catch { }
}

export function trackStyle(type) {
  if (styleCounters[type] !== undefined) {
    styleCounters[type]++;
    localStorage.setItem(STYLE_KEY, JSON.stringify(styleCounters));
  }
}

export function getLearningStyle() {
  const total = Object.values(styleCounters).reduce((a, b) => a + b, 0);
  if (total < 5) return { style: 'exploring', desc: 'Still exploring — keep going!' };
  const sorted = Object.entries(styleCounters).sort((a, b) => b[1] - a[1]);
  const dominant = sorted[0][0];
  const styles = {
    cards: { style: 'reader', desc: 'You learn best by reading deeply. Try the person cards and journal entries.' },
    canvas: { style: 'spatial', desc: 'You learn spatially. The Concept Canvas and graph views are your sweet spot.' },
    paths: { style: 'sequential', desc: 'You learn in sequences. Learning Paths are designed for you.' },
    notes: { style: 'kinesthetic', desc: 'You learn by doing. Keep using the Note Wall and practices.' },
    recall: { style: 'active', desc: 'You learn through testing. Active recall and the Socratic Challenge will push you further.' }
  };
  return styles[dominant] || styles.cards;
}

// ── Chat history ─────────────────────────────────────────────────────────────
let chatHistory = [];

function loadChat() {
  try {
    chatHistory = JSON.parse(sessionStorage.getItem(CHAT_KEY)) || [];
  } catch { chatHistory = []; }
}

function saveChat() {
  sessionStorage.setItem(CHAT_KEY, JSON.stringify(chatHistory));
}

function addMessage(role, content, actions) {
  chatHistory.push({ role, content, actions: actions || [], time: Date.now() });
  saveChat();
}

// ── Intent detection (Tier 1) ────────────────────────────────────────────────
const INTENTS = [
  { patterns: [/^(search|find|who|what|where)\b/i, /tell me about/i, /know about/i], handler: handleSearch },
  { patterns: [/connect|relat|link|between|path from/i, /how does .+ connect/i, /how are .+ related/i], handler: handleConnect },
  { patterns: [/^(path|plan|teach|guide|learn about|study)\b/i, /learning path/i, /take me through/i], handler: handlePath },
  { patterns: [/^(show|visualize|map|canvas|graph)\b/i, /put .+ on canvas/i], handler: handleVisualize },
  { patterns: [/compare|versus|vs\.?|differ/i, /what.s the difference/i], handler: handleCompare },
  { patterns: [/recommend|suggest|what should|what next/i, /where do i start/i], handler: handleRecommend },
  { patterns: [/practice|habit|routine|exercise|implement/i], handler: handlePractice },
  { patterns: [/pattern|theme|common/i, /what do .+ have in common/i], handler: handlePatterns },
  { patterns: [/quote|said|words/i], handler: handleQuote },
  { patterns: [/help|what can you/i, /how do i use/i], handler: handleHelp }
];

function detectIntent(query) {
  for (const intent of INTENTS) {
    for (const pattern of intent.patterns) {
      if (pattern.test(query)) return intent.handler;
    }
  }
  // Fallback: try search
  return handleSearch;
}

// ── Intent handlers ──────────────────────────────────────────────────────────

function webSearch(query) {
  return new Promise((resolve) => {
    const cbName = '_ddgCb' + Date.now();
    const timeout = setTimeout(() => {
      cleanup();
      resolve(null);
    }, 5000);

    function cleanup() {
      clearTimeout(timeout);
      delete window[cbName];
      const el = document.getElementById(cbName);
      if (el) el.remove();
    }

    window[cbName] = (data) => {
      cleanup();
      const results = [];
      if (data.AbstractText) {
        results.push({ text: data.AbstractText, source: data.AbstractSource || 'DuckDuckGo', url: data.AbstractURL || '' });
      }
      if (data.Answer) {
        results.push({ text: data.Answer, source: 'Instant Answer', url: '' });
      }
      if (data.Definition) {
        results.push({ text: data.Definition, source: data.DefinitionSource || 'Definition', url: data.DefinitionURL || '' });
      }
      if (data.RelatedTopics) {
        for (const topic of data.RelatedTopics.slice(0, 4)) {
          if (topic.Text) {
            results.push({ text: topic.Text, source: 'Related', url: topic.FirstURL || '' });
          }
        }
      }
      resolve(results.length > 0 ? results : null);
    };

    const encoded = encodeURIComponent(query);
    const script = document.createElement('script');
    script.id = cbName;
    script.src = `https://api.duckduckgo.com/?q=${encoded}&format=json&no_html=1&skip_disambig=1&callback=${cbName}`;
    script.onerror = () => { cleanup(); resolve(null); };
    document.head.appendChild(script);
  });
}

async function handleSearch(query) {
  const results = search(query, 8);
  // Check if results are high quality (score >= 6 means exact phrase or 2+ real word matches)
  const hasGoodMatch = results.some(r => r.score >= 6);

  if (results.length === 0 || !hasGoodMatch) {
    // Web search fallback when no results or only low-quality trigram matches
    const prefs = getTutorPrefs();
    if (prefs.webSearch !== false) {
      try {
        const webResults = await webSearch(query);
        if (webResults) {
          let text = `**From the web** — "${query}":\n\n`;
          if (prefs.socraticMode) text = `I've looked outside our local records. Before I tell you what I found about "${query}", what does your intuition tell you about it? Here's a glimpse from the web:\n\n`;
          for (const r of webResults.slice(0, 3)) {
            text += `- ${r.text.slice(0, 200)}${r.text.length > 200 ? '...' : ''}`;
            if (r.url) text += ` ([source](${r.url}))`;
            text += '\n';
          }
          text += '\n*Results from DuckDuckGo. Not in local data.*';
          return { text, actions: [] };
        }
      } catch {
        // Network error — silent fallback
      }
    }
    if (results.length === 0) {
      return { text: `I couldn't find anything matching "${query}". Try a name, concept, or topic.`, actions: [] };
    }
  }

  const prefs = getTutorPrefs();
  const grouped = {};
  for (const r of results) {
    if (!grouped[r.type]) grouped[r.type] = [];
    grouped[r.type].push(r);
  }

  let text = `Here's what I found for "${query}":\n\n`;
  if (prefs.socraticMode) {
    const firstMatch = results[0].source;
    text = `Interesting that you're asking about "${query}". Based on what I know about ${firstMatch}, what specific aspect are you most curious about? Here are some starting points:\n\n`;
  }

  const actions = [];

  for (const [type, items] of Object.entries(grouped)) {
    text += `**${type}:**\n`;
    for (const item of items.slice(0, 3)) {
      text += `- ${item.source}${item.snippet ? ': ' + item.snippet.slice(0, 80) + '...' : ''}\n`;
      if (type === 'People') actions.push({ label: `Open ${item.source}`, action: 'openPerson', id: item.id });
      if (type === 'Labs') actions.push({ label: `Open ${item.source}`, action: 'openLab', id: item.id });
    }
    text += '\n';
  }

  return { text: text.trim(), actions };
}

function handleConnect(query) {
  // Extract two names
  const match = query.match(/(?:connect|relat|link|between|path from)\s+(.+?)\s+(?:and|to|with)\s+(.+)/i);
  if (!match) {
    return { text: 'Try asking: "How does Socrates connect to Shannon?" or "Path from Curie to Feynman"', actions: [] };
  }

  const name1 = match[1].trim(), name2 = match[2].trim();
  const results1 = search(name1, 1), results2 = search(name2, 1);

  if (results1.length === 0) return { text: `I don't know who "${name1}" is. Try a full name.`, actions: [] };
  if (results2.length === 0) return { text: `I don't know who "${name2}" is. Try a full name.`, actions: [] };

  const id1 = results1[0].id, id2 = results2[0].id;
  const pathSteps = getPathWithEdges(id1, id2);

  if (!pathSteps) {
    return { text: `I couldn't find a connection between ${results1[0].source} and ${results2[0].source}. They may be in separate clusters.`, actions: [] };
  }

  let text = `**Connection: ${pathSteps[0].name} → ${pathSteps[pathSteps.length - 1].name}**\n\n`;
  for (let i = 0; i < pathSteps.length; i++) {
    text += `${pathSteps[i].emoji} ${pathSteps[i].name}`;
    if (pathSteps[i].edgeLabel) text += ` — *${pathSteps[i].edgeLabel}* →`;
    text += '\n';
  }

  return {
    text,
    actions: [
      { label: 'Show on Canvas', action: 'showOnCanvas', ids: pathSteps.map(s => s.id) },
      ...pathSteps.filter(s => PEOPLE_MAP.has(s.id)).map(s => ({ label: `Open ${s.name}`, action: 'openPerson', id: s.id }))
    ]
  };
}

function handlePath(query) {
  // Check for curated paths first
  const lower = query.toLowerCase();
  for (const path of LEARNING_PATHS) {
    if (lower.includes(path.title.toLowerCase()) || path.title.toLowerCase().includes(lower) || lower.includes(path.id)) {
      return {
        text: `**${path.emoji} ${path.title}**\n\n${path.description}\n\n${path.steps.length} steps through: ${path.steps.map(s => {
          const p = PEOPLE_MAP.get(s.personId);
          return p ? p.name : s.personId;
        }).join(' → ')}`,
        actions: [{ label: `Start Path`, action: 'openPath', id: path.id }]
      };
    }
  }

  // Check for keyword match — map keywords to path IDs directly (no recursion)
  const keywords = lower.replace(/^(path|plan|teach|guide|learn about|study|take me through)\s*/i, '').trim();
  const keywordMap = [
    [['stoic'], 'stoic-os'],
    [['quantum'], 'quantum-revolution'],
    [['signal', 'brain'], 'signal-to-thought'],
    [['outsider', 'dropout'], 'outsiders-playbook'],
    [['neuro'], 'neurons-to-neuroethics'],
    [['cross', 'polymath'], 'cross-pollination'],
  ];
  for (const [keys, pathId] of keywordMap) {
    if (keys.some(k => keywords.includes(k))) {
      const matched = LEARNING_PATHS.find(p => p.id === pathId);
      if (matched) {
        return {
          text: `**${matched.emoji} ${matched.title}**\n\n${matched.description}\n\n${matched.steps.length} steps through: ${matched.steps.map(s => {
            const p = PEOPLE_MAP.get(s.personId);
            return p ? p.name : s.personId;
          }).join(' → ')}`,
          actions: [{ label: `Start Path`, action: 'openPath', id: matched.id }]
        };
      }
    }
  }

  // Try auto-generating from a person
  const results = search(keywords, 1);
  if (results.length > 0 && results[0].type === 'People') {
    const auto = generatePath(results[0].id, 5);
    const names = auto.map(id => {
      const p = PEOPLE_MAP.get(id);
      return p ? `${p.emoji} ${p.name}` : id;
    });
    return {
      text: `I built a custom path starting from **${results[0].source}**:\n\n${names.join(' → ')}\n\nThis path prioritizes cross-discipline connections.`,
      actions: auto.map(id => ({ label: `Open ${PEOPLE_MAP.get(id)?.name || id}`, action: 'openPerson', id }))
    };
  }

  // List all paths
  let text = '**Available Learning Paths:**\n\n';
  for (const p of LEARNING_PATHS) {
    text += `${p.emoji} **${p.title}** — ${p.description.slice(0, 60)}...\n`;
  }
  text += '\nOr ask: "Teach me about [topic]" and I\'ll generate a custom path.';
  return { text, actions: LEARNING_PATHS.map(p => ({ label: p.title, action: 'openPath', id: p.id })) };
}

function handleVisualize(query) {
  const keywords = query.replace(/^(show|visualize|map|canvas|graph|put)\s*/i, '').replace(/on canvas/i, '').trim();
  const results = search(keywords, 5);
  if (results.length === 0) {
    return { text: 'I couldn\'t find content to visualize. Try a name or field.', actions: [] };
  }

  const ids = results.filter(r => r.type === 'People' || r.type === 'Labs').map(r => r.id);
  if (ids.length === 0) {
    return { text: 'No people or labs matched that query for the canvas.', actions: [] };
  }

  return {
    text: `Adding ${ids.length} items to the canvas: ${results.filter(r => r.type === 'People' || r.type === 'Labs').map(r => r.source).join(', ')}`,
    actions: [{ label: 'Show on Canvas', action: 'showOnCanvas', ids }]
  };
}

function handleCompare(query) {
  const match = query.match(/(?:compare|versus|vs\.?|difference between)\s+(.+?)\s+(?:and|vs\.?|versus|with)\s+(.+)/i);
  if (!match) {
    return { text: 'Try: "Compare Seneca and Marcus Aurelius" or "Socrates vs Confucius"', actions: [] };
  }

  const r1 = search(match[1].trim(), 1), r2 = search(match[2].trim(), 1);
  if (r1.length === 0 || r2.length === 0) return { text: 'Couldn\'t find one of those names.', actions: [] };

  const p1 = PEOPLE_MAP.get(r1[0].id), p2 = PEOPLE_MAP.get(r2[0].id);
  if (!p1 || !p2) return { text: 'Comparison only works with historical figures.', actions: [] };

  let text = `**${p1.emoji} ${p1.name} vs ${p2.emoji} ${p2.name}**\n\n`;
  text += `**Era:** ${p1.years} vs ${p2.years}\n`;
  text += `**Fields:** ${p1.fields.join(', ')} vs ${p2.fields.join(', ')}\n`;

  // Shared fields
  const shared = p1.fields.filter(f => p2.fields.map(ff => ff.toLowerCase()).includes(f.toLowerCase()));
  if (shared.length > 0) text += `**Shared:** ${shared.join(', ')}\n`;

  text += `\n**${p1.name}:** "${p1.tagline}"\n`;
  text += `**${p2.name}:** "${p2.tagline}"\n`;

  if (p1.quotes?.[0] && p2.quotes?.[0]) {
    text += `\n**${p1.name} said:** "${p1.quotes[0].text}"\n`;
    text += `**${p2.name} said:** "${p2.quotes[0].text}"\n`;
  }

  // Check if connected
  const path = getPathWithEdges(p1.id, p2.id);
  if (path && path.length <= 4) {
    text += `\n**Connected in ${path.length - 1} steps** via the knowledge graph.`;
  }

  return {
    text,
    actions: [
      { label: `Open ${p1.name}`, action: 'openPerson', id: p1.id },
      { label: `Open ${p2.name}`, action: 'openPerson', id: p2.id },
      { label: 'Show on Canvas', action: 'showOnCanvas', ids: [p1.id, p2.id] }
    ]
  };
}

function handleRecommend(query) {
  const style = getLearningStyle();
  const related = [];

  // Check what user has viewed
  try {
    const stats = JSON.parse(localStorage.getItem('autodidactive-stats')) || {};
    const viewed = stats.viewed || [];
    if (viewed.length > 0) {
      const lastViewed = viewed[viewed.length - 1];
      const recs = getRelated(lastViewed, 4);
      for (const r of recs) {
        if (!viewed.includes(r.id)) related.push(r);
      }
    }
  } catch { }

  let text = `**Your learning style:** ${style.style}\n${style.desc}\n\n`;

  if (related.length > 0) {
    text += '**Based on what you\'ve been reading:**\n';
    for (const r of related.slice(0, 3)) {
      text += `- ${r.emoji} ${r.name} (${r.types.join(', ')})\n`;
    }
    text += '\n';
  }

  // Recommend a path based on style
  if (style.style === 'sequential') {
    text += 'Try the **Stoic Operating System** path — it\'s designed for sequential learners.';
  } else if (style.style === 'spatial') {
    text += 'Open the **Concept Canvas** and add a few figures — visual connections will emerge.';
  } else {
    text += 'Pick any card that catches your eye. Follow curiosity — the graph connects everything.';
  }

  return {
    text,
    actions: related.slice(0, 3).map(r => ({ label: `Open ${r.name}`, action: 'openPerson', id: r.id }))
  };
}

function handlePractice(query) {
  const keywords = query.toLowerCase();
  let matching = IMPLEMENT_PRACTICES.filter(p =>
    p.title.toLowerCase().includes(keywords) ||
    p.origin.toLowerCase().includes(keywords) ||
    p.desc.toLowerCase().includes(keywords)
  );

  if (matching.length === 0) matching = IMPLEMENT_PRACTICES;

  let text = '**Practices to Implement:**\n\n';
  for (const p of matching.slice(0, 4)) {
    text += `**${p.title}** (from ${p.origin})\n${p.desc.slice(0, 100)}...\n\n`;
  }

  return { text, actions: [] };
}

function handlePatterns(query) {
  let text = '**Cross-Figure Patterns:**\n\n';
  for (const p of PATTERNS) {
    text += `**${p.title}**\n${p.desc.slice(0, 100)}...\n*${p.names}*\n\n`;
  }
  return { text, actions: [] };
}

function handleQuote(query) {
  const results = search(query.replace(/quote|said|words/i, '').trim(), 10);
  const quotes = results.filter(r => r.field === 'quote');
  if (quotes.length === 0) return { text: 'No matching quotes found.', actions: [] };

  let text = '';
  for (const q of quotes.slice(0, 5)) {
    text += `"${q.snippet}" — *${q.source}*\n\n`;
  }
  return { text, actions: quotes.slice(0, 3).map(q => ({ label: `Open ${q.source}`, action: 'openPerson', id: q.id })) };
}

function handleHelp() {
  return {
    text: `**I can help you explore ${PEOPLE_MAP.size} historical figures, ${LEARNING_PATHS.length} learning paths, and ${CALCULUS_LABS.length} interactive labs.**

Try asking:
- "Tell me about Seneca"
- "How does Socrates connect to Shannon?"
- "Teach me about quantum physics"
- "Compare Curie and Tesla"
- "Show the Stoics on canvas"
- "What practices can I implement?"
- "What do these thinkers have in common?"
- "Recommend something for me"
- "Find quotes about wisdom"`,
    actions: []
  };
}

// ── Process user message (Tier 1) ────────────────────────────────────────────
export async function processMessage(query) {
  addMessage('user', query);
  const handler = detectIntent(query);
  const response = await handler(query);
  addMessage('tutor', response.text, response.actions);
  return response;
}

// ── Render chat panel ────────────────────────────────────────────────────────
export function renderChat() {
  loadChat();
  if (chatHistory.length === 0) {
    const style = getLearningStyle();
    return `
      <div class="tutor-welcome">
        <div class="tutor-welcome-emoji">✨</div>
        <h3 class="tutor-welcome-title">Ask me anything</h3>
        <p class="tutor-welcome-desc">${esc(style.desc)}</p>
        <div class="tutor-suggestions">
          <button class="tutor-suggestion" onclick="window._tutorAsk('Who should I learn about first?')">Who should I start with?</button>
          <button class="tutor-suggestion" onclick="window._tutorAsk('Teach me about the Stoics')">Teach me Stoicism</button>
          <button class="tutor-suggestion" onclick="window._tutorAsk('Compare Socrates and Confucius')">Compare thinkers</button>
          <button class="tutor-suggestion" onclick="window._tutorAsk('What practices can I implement?')">Show practices</button>
        </div>
      </div>
    `;
  }

  return chatHistory.map(msg => {
    if (msg.role === 'user') {
      return `<div class="tutor-msg tutor-msg--user"><div class="tutor-msg-text">${esc(msg.content)}</div></div>`;
    }
    // Format markdown-lite
    let html = esc(msg.content)
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br>');

    let actionsHtml = '';
    if (msg.actions && msg.actions.length > 0) {
      actionsHtml = '<div class="tutor-actions">' +
        msg.actions.map(a => {
          if (a.action === 'openPerson') return `<button class="tutor-action-btn" onclick="window._openPerson('${a.id}')">${esc(a.label)}</button>`;
          if (a.action === 'openLab') return `<button class="tutor-action-btn" onclick="window._openLab('${a.id}')">${esc(a.label)}</button>`;
          if (a.action === 'openPath') return `<button class="tutor-action-btn" onclick="window._openPath('${a.id}')">${esc(a.label)}</button>`;
          if (a.action === 'showOnCanvas') return `<button class="tutor-action-btn" onclick="window._showOnCanvas('${JSON.stringify(a.ids).replace(/"/g, '&quot;')}')">${esc(a.label)}</button>`;
          return `<button class="tutor-action-btn">${esc(a.label)}</button>`;
        }).join('') +
        '</div>';
    }

    return `<div class="tutor-msg tutor-msg--tutor"><div class="tutor-msg-text">${html}</div>${actionsHtml}</div>`;
  }).join('');
}

export function clearChat() {
  chatHistory = [];
  sessionStorage.removeItem(CHAT_KEY);
}

// ── Tier 2: WebLLM (optional, user opt-in) ──────────────────────────────────
let webllmEngine = null;
let tier2Enabled = false;

export function isTier2Available() { return tier2Enabled && webllmEngine !== null; }

const DEFAULT_PREFS = {
  tier2: false,
  tier3: false,
  socraticMode: false,
  provider: 'ollama',
  ollamaUrl: 'http://localhost:11434',
  ollamaModel: 'llama3.2',
  apiKey: '',
  cloudModel: 'gpt-4o-mini',
  webSearch: true
};

export function getTutorPrefs() {
  try {
    const saved = JSON.parse(localStorage.getItem(TUTOR_KEY));
    return saved ? { ...DEFAULT_PREFS, ...saved } : { ...DEFAULT_PREFS };
  } catch { return { ...DEFAULT_PREFS }; }
}

export function setTutorPref(key, value) {
  const prefs = getTutorPrefs();
  prefs[key] = value;
  localStorage.setItem(TUTOR_KEY, JSON.stringify(prefs));
}

export async function initTier2() {
  const prefs = getTutorPrefs();
  if (!prefs.tier2) return;

  try {
    // Dynamic import — only loads if user opted in
    const { CreateMLCEngine } = await import('https://esm.run/@mlc-ai/web-llm');
    webllmEngine = await CreateMLCEngine('SmolLM2-1.7B-Instruct-q4f16_1-MLC', {
      initProgressCallback: (progress) => {
        const el = document.getElementById('tutor-tier2-status');
        if (el) el.textContent = progress.text || 'Loading model...';
      }
    });
    tier2Enabled = true;
    console.log('[Tutor] Tier 2 WebLLM ready');
  } catch (err) {
    console.warn('[Tutor] Tier 2 failed to load:', err.message);
    tier2Enabled = false;
  }
}

export async function processMessageTier2(query) {
  if (!tier2Enabled || !webllmEngine) return processMessage(query);

  const prefs = getTutorPrefs();
  addMessage('user', query);

  // RAG: gather context from search + graph
  const searchResults = search(query, 5);
  const context = searchResults.map(r => `[${r.type}] ${r.source}: ${r.snippet}`).join('\n');

  let systemPrompt = `You are a learning tutor for Autodidactive, an app about historical polymaths, philosophers, and scientists. Answer ONLY from the provided context. If the context doesn't contain the answer, say so. Be concise and conversational. Include the names of figures you reference.`;

  if (prefs.socraticMode) {
    systemPrompt += ` SOCRATIC MODE ACTIVE: Instead of giving direct answers, ask a thought-provoking question that guides the learner to discover the answer themselves based on the context. If they are completely stuck, provide a small hint.`;
  }

  try {
    const response = await webllmEngine.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Context:\n${context}\n\nQuestion: ${query}` }
      ],
      max_tokens: 300,
      temperature: 0.7
    });

    const text = response.choices[0].message.content;
    const actions = searchResults.filter(r => r.type === 'People').slice(0, 3).map(r => ({
      label: `Open ${r.source}`, action: 'openPerson', id: r.id
    }));

    addMessage('tutor', text, actions);
    return { text, actions };
  } catch (err) {
    console.error('[Tutor] Tier 2 error:', err);
    return processMessage(query); // Fallback to Tier 1
  }
}


// ── Tier 3: External LLM (Ollama / OpenAI / Anthropic) ───────────────────────

async function callOllama(messages, prefs) {
  const base = (prefs.ollamaUrl || 'http://localhost:11434').replace(/\/+$/, '');
  const resp = await fetch(`${base}/v1/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: prefs.ollamaModel || 'llama3.2',
      messages,
      max_tokens: 400,
      temperature: 0.7
    })
  });
  if (!resp.ok) throw new Error(`Ollama error: ${resp.status}`);
  const data = await resp.json();
  return data.choices[0].message.content;
}

async function callOpenAI(messages, prefs) {
  const resp = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${prefs.apiKey}`
    },
    body: JSON.stringify({
      model: prefs.cloudModel || 'gpt-4o-mini',
      messages,
      max_tokens: 400,
      temperature: 0.7
    })
  });
  if (!resp.ok) throw new Error(`OpenAI error: ${resp.status}`);
  const data = await resp.json();
  return data.choices[0].message.content;
}

async function callAnthropic(messages, prefs) {
  const systemMsg = messages.find(m => m.role === 'system');
  const userMsgs = messages.filter(m => m.role !== 'system');
  const resp = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': prefs.apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true'
    },
    body: JSON.stringify({
      model: prefs.cloudModel || 'claude-sonnet-4-20250514',
      max_tokens: 400,
      system: systemMsg ? systemMsg.content : '',
      messages: userMsgs.map(m => ({ role: m.role, content: m.content }))
    })
  });
  if (!resp.ok) throw new Error(`Anthropic error: ${resp.status}`);
  const data = await resp.json();
  return data.content[0].text;
}

async function callProvider(messages, prefs) {
  switch (prefs.provider) {
    case 'ollama': return callOllama(messages, prefs);
    case 'openai': return callOpenAI(messages, prefs);
    case 'anthropic': return callAnthropic(messages, prefs);
    default: throw new Error(`Unknown provider: ${prefs.provider}`);
  }
}

export async function processMessageTier3(query) {
  const prefs = getTutorPrefs();
  if (!prefs.tier3) {
    if (prefs.tier2 && tier2Enabled && webllmEngine) return processMessageTier2(query);
    return processMessage(query);
  }

  addMessage('user', query);

  const searchResults = search(query, 5);
  const context = searchResults.map(r => `[${r.type}] ${r.source}: ${r.snippet}`).join('\n');

  let systemPrompt = `You are a learning tutor for Autodidactive, an app about historical polymaths, philosophers, and scientists. Answer from the provided context when available. Be concise and conversational. Include the names of figures you reference. If context is empty, answer from your own knowledge but note it's not from the local dataset.`;

  if (prefs.socraticMode) {
    systemPrompt += ` SOCRATIC MODE ACTIVE: Instead of giving direct answers, ask a thought-provoking question that guides the learner to discover the answer themselves based on the context. If they are completely stuck, provide a small hint. Use the Socratic method to lead them to the truth.`;
  }

  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: context ? `Context:\n${context}\n\nQuestion: ${query}` : query }
  ];


  try {
    const text = await callProvider(messages, prefs);
    const actions = searchResults.filter(r => r.type === 'People').slice(0, 3).map(r => ({
      label: `Open ${r.source}`, action: 'openPerson', id: r.id
    }));
    addMessage('tutor', text, actions);
    return { text, actions };
  } catch (err) {
    console.warn('[Tutor] Tier 3 error:', err.message);
    // Fallback chain: Tier 2 → Tier 1
    if (prefs.tier2 && tier2Enabled && webllmEngine) return processMessageTier2(query);
    return processMessage(query);
  }
}

export async function testConnection() {
  const prefs = getTutorPrefs();
  try {
    if (prefs.provider === 'ollama') {
      const base = (prefs.ollamaUrl || 'http://localhost:11434').replace(/\/+$/, '');
      const resp = await fetch(`${base}/api/tags`);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data = await resp.json();
      const models = (data.models || []).map(m => m.name);
      return { ok: true, message: `Connected. Models: ${models.slice(0, 5).join(', ')}` };
    }
    // Cloud providers: send a tiny completion
    const messages = [
      { role: 'system', content: 'Reply with exactly: OK' },
      { role: 'user', content: 'Test' }
    ];
    const text = await callProvider(messages, prefs);
    return { ok: true, message: `Connected. Response: "${text.slice(0, 40)}"` };
  } catch (err) {
    return { ok: false, message: err.message };
  }
}

// ── Init ─────────────────────────────────────────────────────────────────────
loadChat();
loadStyle();

export async function processSynthesis(nodeNames) {
  const prefs = getTutorPrefs();
  const query = `Find a deep, non-obvious connection or synthesis between these concepts/figures: ${nodeNames}. How do their frameworks overlap or contrast? Be visionary and insightful.`;

  if (prefs.tier2 || (prefs.tier3 && prefs.apiKey)) {
    const originalSocratic = prefs.socraticMode;
    prefs.socraticMode = false; // Direct insight for synthesis

    let result;
    if (prefs.tier2) {
      result = await processMessageTier2(query);
    } else {
      result = await processMessageTier3(query);
    }

    prefs.socraticMode = originalSocratic;
    return result;
  }

  return `**Synthesis Engine (Tier 1)**: Looking at ¹${nodeNames}¹, I see an underlying pattern of intellectual courage. Each of these figures challenged the status quo to reveal deeper truths about existence, logic, or the physical world. Their synthesis lies in the relentless pursuit of first principles.`;
}
