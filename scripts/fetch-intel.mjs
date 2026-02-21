#!/usr/bin/env node

/**
 * BCI Business Intelligence Feed Fetcher
 * Fetches 50+ RSS feeds, filters for BCI/neurotech relevance,
 * auto-tags, extracts company mentions, deduplicates (URL + fuzzy title),
 * and appends new items to the accumulating bci-intel-feed.json store.
 *
 * Exit codes:
 *   0 = new items added
 *   2 = no new items (for CI to skip commit)
 *   1 = error
 */

import { XMLParser } from 'fast-xml-parser';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomBytes } from 'node:crypto';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const FEED_PATH = resolve(ROOT, 'src/data/bci-intel-feed.json');
const LANDSCAPE_PATH = resolve(ROOT, 'shared/bci-landscape.json');

const FETCH_TIMEOUT_MS = 10000;

// --- RSS Feed Sources ---

const INTEL_FEEDS = [
  // News & Press
  { url: 'https://techcrunch.com/feed/', name: 'TechCrunch', category: 'news', maxItems: 10 },
  { url: 'https://venturebeat.com/feed/', name: 'VentureBeat', category: 'news', maxItems: 10 },
  { url: 'https://www.theinformation.com/feed', name: 'The Information', category: 'news', maxItems: 5 },
  { url: 'https://api.axios.com/feed/', name: 'Axios', category: 'news', maxItems: 5 },
  { url: 'https://www.theverge.com/rss/index.xml', name: 'The Verge', category: 'news', maxItems: 5 },
  { url: 'https://www.wired.com/feed/rss', name: 'Wired', category: 'news', maxItems: 5 },
  { url: 'https://www.technologyreview.com/feed/', name: 'MIT Tech Review', category: 'news', maxItems: 5 },
  { url: 'https://arstechnica.com/feed/', name: 'Ars Technica', category: 'news', maxItems: 5 },
  { url: 'https://www.fastcompany.com/technology/rss', name: 'Fast Company', category: 'news', maxItems: 5 },
  { url: 'https://news.crunchbase.com/feed/', name: 'Crunchbase News', category: 'funding', maxItems: 10 },
  // PitchBook removed: bot-blocked, no public RSS
  { url: 'https://sifted.eu/feed', name: 'Sifted', category: 'news', maxItems: 5 },
  { url: 'https://betakit.com/feed/', name: 'BetaKit', category: 'news', maxItems: 5 },
  { url: 'https://www.siliconrepublic.com/feed', name: 'Silicon Republic', category: 'news', maxItems: 5 },

  // Biotech / MedTech
  { url: 'https://www.statnews.com/feed/', name: 'STAT News', category: 'product', maxItems: 5 },
  { url: 'https://www.fiercebiotech.com/rss/xml', name: 'Fierce Biotech', category: 'product', maxItems: 5 },
  { url: 'https://www.medtechdive.com/feeds/news/', name: 'MedTech Dive', category: 'product', maxItems: 5 },
  { url: 'https://www.medicaldevice-network.com/feed/', name: 'Medical Device Network', category: 'product', maxItems: 5 },
  { url: 'https://endpts.com/feed/', name: 'Endpoints News', category: 'product', maxItems: 5 },
  { url: 'https://connect.biorxiv.org/biorxiv_xml.php?subject=neuroscience', name: 'bioRxiv Neuro', category: 'research', maxItems: 5 },
  { url: 'https://connect.medrxiv.org/medrxiv_xml.php?subject=Health_Informatics', name: 'medRxiv Health', category: 'research', maxItems: 5 },

  // Research / Academic
  { url: 'https://rss.arxiv.org/rss/q-bio.NC', name: 'arXiv Neuroscience', category: 'research', maxItems: 5 },
  { url: 'https://www.nature.com/neuro.rss', name: 'Nature Neuroscience', category: 'research', maxItems: 5 },
  { url: 'https://spectrum.ieee.org/feeds/topic/biomedical.rss', name: 'IEEE Spectrum', category: 'research', maxItems: 5 },
  // Neuroscience News removed: captcha-gated, blocks automated fetch

  // Market Research / Analyst (free blog RSS)
  // Gartner removed: bot-blocked (Akamai), no public RSS
  // Forrester removed: endpoint returns 0 bytes
  { url: 'https://www.mckinsey.com/insights/rss', name: 'McKinsey Insights', category: 'market_research', maxItems: 5 },
  // Deloitte removed: broken redirect loop
  // ARK Invest removed: feed endpoint removed
  { url: 'https://www.grandviewresearch.com/blog/feed', name: 'Grand View Research', category: 'market_research', maxItems: 3 },

  // VC Blogs / Newsletters
  // a16z removed: migrated to Netlify, RSS feed removed
  { url: 'https://www.notboring.co/feed', name: 'Not Boring', category: 'opinion', maxItems: 3 },
  { url: 'https://stratechery.com/feed/', name: 'Stratechery', category: 'opinion', maxItems: 3 },
  { url: 'https://www.exponentialview.co/feed', name: 'Exponential View', category: 'opinion', maxItems: 3 },
  { url: 'https://neurotechx.com/feed/', name: 'NeurotechX', category: 'news', maxItems: 5 },

  // Regulatory
  { url: 'https://www.fda.gov/about-fda/contact-fda/stay-informed/rss-feeds/press-releases/rss.xml', name: 'FDA Press Releases', category: 'regulatory', maxItems: 5 },
  { url: 'https://www.nist.gov/blogs/cybersecurity-insights/rss.xml', name: 'NIST Cybersecurity', category: 'regulatory', maxItems: 5 },

  // Google News queries (pre-filtered, skip keyword check)
  { url: 'https://news.google.com/rss/search?q=brain+computer+interface+funding&hl=en-US&gl=US&ceid=US:en', name: 'GN: BCI Funding', category: 'funding', maxItems: 10, skipKeywordFilter: true },
  { url: 'https://news.google.com/rss/search?q=neurotechnology+investment&hl=en-US&gl=US&ceid=US:en', name: 'GN: Neurotech Investment', category: 'funding', maxItems: 10, skipKeywordFilter: true },
  { url: 'https://news.google.com/rss/search?q=Neuralink+OR+Synchron+OR+Paradromics&hl=en-US&gl=US&ceid=US:en', name: 'GN: BCI Companies', category: 'product', maxItems: 10, skipKeywordFilter: true },
  { url: 'https://news.google.com/rss/search?q=brain+implant+FDA&hl=en-US&gl=US&ceid=US:en', name: 'GN: BCI FDA', category: 'regulatory', maxItems: 5, skipKeywordFilter: true },
  { url: 'https://news.google.com/rss/search?q=neurorights+OR+neural+privacy+OR+cognitive+liberty&hl=en-US&gl=US&ceid=US:en', name: 'GN: Neurorights', category: 'policy', maxItems: 5, skipKeywordFilter: true },
  { url: 'https://news.google.com/rss/search?q=BCI+patent+OR+neural+interface+patent&hl=en-US&gl=US&ceid=US:en', name: 'GN: BCI Patents', category: 'patent', maxItems: 5, skipKeywordFilter: true },
  { url: 'https://news.google.com/rss/search?q=brain+computer+interface+clinical+trial&hl=en-US&gl=US&ceid=US:en', name: 'GN: BCI Trials', category: 'clinical', maxItems: 5, skipKeywordFilter: true },
  { url: 'https://news.google.com/rss/search?q=EEG+headset+consumer&hl=en-US&gl=US&ceid=US:en', name: 'GN: Consumer EEG', category: 'product', maxItems: 5, skipKeywordFilter: true },
  { url: 'https://news.google.com/rss/search?q=neurotechnology+regulation+EU+OR+US&hl=en-US&gl=US&ceid=US:en', name: 'GN: Neurotech Regulation', category: 'regulatory', maxItems: 5, skipKeywordFilter: true },
];

// --- Relevance Keywords (expanded from fetch-news.mjs) ---

const RELEVANCE_KEYWORDS = [
  'brain-computer', 'brain computer', 'bci', 'neural interface', 'neurotechnology', 'neurotech',
  'eeg', 'neuroprosthetic', 'brain implant', 'neural implant', 'neurostimulation', 'brain stimulation',
  'tdcs', 'deep brain', 'cortical implant', 'neural decoder', 'brain-machine',
  'neuralink', 'synchron', 'merge labs', 'paradromics', 'blackrock neurotech', 'cortical', 'openbci',
  'emotiv', 'interaxon', 'muse headband', 'neurosity', 'brainco', 'kernel flow', 'cognixion',
  'neurable', 'arctop', 'precision neuroscience', 'inbrain',
  'post-quantum', 'post quantum', 'quantum cryptography', 'quantum key',
  'neuroethics', 'neurorights', 'cognitive liberty', 'neural security', 'neural privacy', 'neural data',
  'brain data', 'mind act', 'neuroprivacy',
  'neurotech funding', 'fda breakthrough', 'fda clearance', 'fda approval', '510(k)', 'de novo',
  'brain signal', 'neural signal', 'brain activity', 'neural recording',
  'cochlear implant', 'retinal implant', 'spinal cord stimulat',
  'neurofeedback', 'brain-to-text', 'speech neuroprosthesis', 'motor neuroprosthesis',
];

// --- Auto-Tagging Rules ---

const TAG_RULES = [
  { tag: 'funding',     patterns: ['funding', 'raised', 'series', 'round', 'investment', 'valuation', 'ipo', 'spac', 'acquisition', 'merger'] },
  { tag: 'product',     patterns: ['launch', 'device', 'fda clear', 'fda approv', 'implant', 'headset', 'wearable', 'product'] },
  { tag: 'regulatory',  patterns: ['fda', 'regulation', 'compliance', 'approval', 'clearance', '510k', 'de novo', 'pma'] },
  { tag: 'research',    patterns: ['study', 'trial', 'paper', 'published', 'journal', 'arxiv', 'preprint', 'peer-review'] },
  { tag: 'policy',      patterns: ['legislation', 'bill', 'act', 'policy', 'neurorights', 'privacy', 'governance', 'law'] },
  { tag: 'opinion',     patterns: ['opinion', 'editorial', 'analysis', 'forecast', 'outlook', 'trend', 'prediction'] },
  { tag: 'partnership', patterns: ['partner', 'collaborat', 'alliance', 'joint venture', 'agreement', 'mou'] },
  { tag: 'patent',      patterns: ['patent', 'intellectual property', 'ip filing', 'trademark'] },
  { tag: 'clinical',    patterns: ['clinical trial', 'phase 1', 'phase 2', 'phase 3', 'patient', 'enrollment', 'endpoint'] },
];

// --- Company Names (loaded from bci-landscape.json) ---

function loadCompanyNames() {
  try {
    const data = JSON.parse(readFileSync(LANDSCAPE_PATH, 'utf-8'));
    return (data.companies || []).map((c) => c.name);
  } catch {
    console.warn('  [WARN] Could not load bci-landscape.json for company extraction');
    return [];
  }
}

// --- Fuzzy Dedup: Word Trigram Jaccard ---

function wordTrigrams(text) {
  const words = text.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(Boolean);
  const trigrams = new Set();
  for (let i = 0; i <= words.length - 3; i++) {
    trigrams.add(`${words[i]} ${words[i + 1]} ${words[i + 2]}`);
  }
  // Also add bigrams for short titles
  for (let i = 0; i <= words.length - 2; i++) {
    trigrams.add(`${words[i]} ${words[i + 1]}`);
  }
  return trigrams;
}

function jaccardSimilarity(setA, setB) {
  if (setA.size === 0 && setB.size === 0) return 1;
  if (setA.size === 0 || setB.size === 0) return 0;
  let intersection = 0;
  for (const item of setA) {
    if (setB.has(item)) intersection++;
  }
  return intersection / (setA.size + setB.size - intersection);
}

const FUZZY_THRESHOLD = 0.6;

// --- Helpers ---

const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_' });

function generateId() {
  return randomBytes(4).toString('hex');
}

function isRelevant(title, summary, feed) {
  if (feed.skipKeywordFilter) return true;
  const text = `${title} ${summary}`.toLowerCase();
  return RELEVANCE_KEYWORDS.some((kw) => text.includes(kw));
}

function parseDate(raw) {
  if (!raw) return new Date().toISOString().slice(0, 10);
  const d = new Date(raw);
  return isNaN(d.getTime()) ? new Date().toISOString().slice(0, 10) : d.toISOString().slice(0, 10);
}

function autoTag(title, summary) {
  const text = `${title} ${summary}`.toLowerCase();
  const tags = [];
  for (const rule of TAG_RULES) {
    if (rule.patterns.some((p) => text.includes(p))) {
      tags.push(rule.tag);
    }
  }
  return tags.length > 0 ? tags : ['general'];
}

function extractCompanies(title, summary, companyNames) {
  const text = `${title} ${summary}`;
  const found = [];
  for (const name of companyNames) {
    // Case-insensitive match, but require word boundary-ish matching
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp(`\\b${escaped}\\b`, 'i');
    if (re.test(text)) {
      found.push(name);
    }
  }
  return found;
}

function stripHtml(str) {
  if (typeof str !== 'string') return String(str || '');
  return str.replace(/<[^>]*>/g, '').trim();
}

// --- XML Parsing (same approach as fetch-news.mjs) ---

function extractItems(xml, feed, companyNames) {
  const parsed = parser.parse(xml);
  const items = [];

  // RSS 2.0
  const rssItems = parsed?.rss?.channel?.item;
  if (rssItems) {
    const list = Array.isArray(rssItems) ? rssItems : [rssItems];
    for (const item of list.slice(0, feed.maxItems)) {
      const title = typeof item.title === 'string' ? item.title : String(item.title || '');
      const rawSummary = item.description || '';
      const summary = stripHtml(rawSummary).slice(0, 200);
      if (!isRelevant(title, summary, feed)) continue;
      items.push({
        id: generateId(),
        title,
        date: parseDate(item.pubDate),
        url: item.link || '',
        source: feed.name,
        source_category: feed.category,
        summary,
        tags: autoTag(title, summary),
        companies: extractCompanies(title, summary, companyNames),
        fetched: new Date().toISOString().slice(0, 10),
      });
    }
    return items;
  }

  // Atom
  const atomEntries = parsed?.feed?.entry;
  if (atomEntries) {
    const list = Array.isArray(atomEntries) ? atomEntries : [atomEntries];
    for (const entry of list.slice(0, feed.maxItems)) {
      const title = entry.title?.['#text'] || entry.title || '';
      const titleStr = typeof title === 'string' ? title : String(title);
      const rawSummary = entry.summary?.['#text'] || entry.summary || entry.content?.['#text'] || '';
      const summary = stripHtml(rawSummary).slice(0, 200);
      if (!isRelevant(titleStr, summary, feed)) continue;
      const link = Array.isArray(entry.link)
        ? entry.link.find((l) => l['@_rel'] === 'alternate')?.['@_href'] || entry.link[0]?.['@_href']
        : entry.link?.['@_href'] || entry.link || '';
      items.push({
        id: generateId(),
        title: titleStr,
        date: parseDate(entry.updated || entry.published),
        url: typeof link === 'string' ? link : String(link),
        source: feed.name,
        source_category: feed.category,
        summary,
        tags: autoTag(titleStr, summary),
        companies: extractCompanies(titleStr, summary, companyNames),
        fetched: new Date().toISOString().slice(0, 10),
      });
    }
    return items;
  }

  // RDF (some older feeds)
  const rdfItems = parsed?.['rdf:RDF']?.item;
  if (rdfItems) {
    const list = Array.isArray(rdfItems) ? rdfItems : [rdfItems];
    for (const item of list.slice(0, feed.maxItems)) {
      const title = typeof item.title === 'string' ? item.title : String(item.title || '');
      const rawSummary = item.description || '';
      const summary = stripHtml(rawSummary).slice(0, 200);
      if (!isRelevant(title, summary, feed)) continue;
      items.push({
        id: generateId(),
        title,
        date: parseDate(item['dc:date'] || item.pubDate),
        url: item.link || '',
        source: feed.name,
        source_category: feed.category,
        summary,
        tags: autoTag(title, summary),
        companies: extractCompanies(title, summary, companyNames),
        fetched: new Date().toISOString().slice(0, 10),
      });
    }
    return items;
  }

  return items;
}

// --- Fetch Single Feed ---

async function fetchSingleFeed(feed, companyNames) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(feed.url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'QinnovateBCIIntelBot/1.0 (research; weekly)',
        Accept: 'application/rss+xml, application/atom+xml, application/xml, text/xml',
      },
    });
    if (!res.ok) {
      console.warn(`  [SKIP] ${feed.name}: HTTP ${res.status}`);
      return [];
    }
    const xml = await res.text();
    const items = extractItems(xml, feed, companyNames);
    console.log(`  [OK]   ${feed.name}: ${items.length} items`);
    return items;
  } catch (err) {
    console.warn(`  [FAIL] ${feed.name}: ${err.message || err}`);
    return [];
  } finally {
    clearTimeout(timeout);
  }
}

// --- Read Existing Feed ---

function readFeed() {
  try {
    return JSON.parse(readFileSync(FEED_PATH, 'utf-8'));
  } catch {
    return [];
  }
}

// --- Dedup: URL exact + fuzzy title ---

function dedup(newItems, existingItems) {
  const existingUrls = new Set(existingItems.map((i) => i.url));
  const existingTrigrams = existingItems.map((i) => ({
    trigrams: wordTrigrams(i.title),
    title: i.title,
  }));

  const accepted = [];

  for (const item of newItems) {
    // URL exact dedup
    if (existingUrls.has(item.url)) continue;

    // Fuzzy title dedup against existing
    const itemTrigrams = wordTrigrams(item.title);
    let isDupe = false;
    for (const existing of existingTrigrams) {
      if (jaccardSimilarity(itemTrigrams, existing.trigrams) >= FUZZY_THRESHOLD) {
        isDupe = true;
        break;
      }
    }
    if (isDupe) continue;

    // Also check against already-accepted new items
    let dupeInNew = false;
    for (const acc of accepted) {
      if (acc.url === item.url) { dupeInNew = true; break; }
      const accTrigrams = wordTrigrams(acc.title);
      if (jaccardSimilarity(itemTrigrams, accTrigrams) >= FUZZY_THRESHOLD) {
        dupeInNew = true;
        break;
      }
    }
    if (dupeInNew) continue;

    accepted.push(item);
    existingUrls.add(item.url);
    existingTrigrams.push({ trigrams: itemTrigrams, title: item.title });
  }

  return accepted;
}

// --- Main ---

console.log(`\nBCI Intel Feed Fetcher`);
console.log(`Fetching ${INTEL_FEEDS.length} feeds...\n`);

const companyNames = loadCompanyNames();
console.log(`Loaded ${companyNames.length} company names for extraction\n`);

const results = await Promise.allSettled(
  INTEL_FEEDS.map((feed) => fetchSingleFeed(feed, companyNames))
);

const allNewItems = [];
let feedsOk = 0;
let feedsFail = 0;

for (const result of results) {
  if (result.status === 'fulfilled') {
    allNewItems.push(...result.value);
    if (result.value.length > 0) feedsOk++;
  } else {
    feedsFail++;
  }
}

console.log(`\nFetched: ${allNewItems.length} candidate items from ${feedsOk} feeds (${feedsFail} failed)\n`);

// Read existing and dedup
const existing = readFeed();
const genuinelyNew = dedup(allNewItems, existing);

if (genuinelyNew.length === 0) {
  console.log('No new items after dedup. Feed unchanged.');
  process.exit(2);
}

// Append and sort
const combined = [...existing, ...genuinelyNew];
combined.sort((a, b) => b.date.localeCompare(a.date));

writeFileSync(FEED_PATH, JSON.stringify(combined, null, 2) + '\n');

console.log(`Added ${genuinelyNew.length} new items. Feed now has ${combined.length} total items.`);

// Show sample of new items
const sample = genuinelyNew.slice(0, 5);
for (const item of sample) {
  const tags = item.tags.join(', ');
  const cos = item.companies.length > 0 ? ` [${item.companies.join(', ')}]` : '';
  console.log(`  + ${item.title.slice(0, 80)} (${tags})${cos}`);
}
if (genuinelyNew.length > 5) {
  console.log(`  ... and ${genuinelyNew.length - 5} more`);
}
