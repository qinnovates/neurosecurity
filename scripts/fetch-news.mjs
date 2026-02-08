#!/usr/bin/env node

/**
 * Standalone RSS feed fetcher — runs independently of Astro build.
 * Updates src/data/external-news-cache.json with fresh feed data.
 * Used by the update-news GitHub Actions workflow for modular rebuilds.
 */

import { XMLParser } from 'fast-xml-parser';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const CACHE_PATH = resolve(ROOT, 'src/data/external-news-cache.json');

// --- Inline config (mirrors feed-config.ts so this runs without TypeScript) ---

const RSS_FEEDS = [
  // Tech journalism
  { url: 'https://techcrunch.com/feed/', name: 'TechCrunch', category: 'neurotechnology', maxItems: 5 },
  { url: 'https://www.theverge.com/rss/index.xml', name: 'The Verge', category: 'neurotechnology', maxItems: 5 },
  { url: 'https://www.wired.com/feed/rss', name: 'Wired', category: 'neurotechnology', maxItems: 5 },
  { url: 'https://www.technologyreview.com/feed/', name: 'MIT Technology Review', category: 'research', maxItems: 5 },
  // Biotech / medtech
  { url: 'https://www.statnews.com/feed/', name: 'STAT News', category: 'neurotechnology', maxItems: 5 },
  { url: 'https://www.fiercebiotech.com/rss/xml', name: 'Fierce Biotech', category: 'neurotechnology', maxItems: 5 },
  // Google News (pre-filtered)
  { url: 'https://news.google.com/rss/search?q=brain+computer+interface&hl=en-US&gl=US&ceid=US:en', name: 'Google News — BCI', category: 'neurotechnology', maxItems: 5, skipKeywordFilter: true },
  { url: 'https://news.google.com/rss/search?q=Neuralink&hl=en-US&gl=US&ceid=US:en', name: 'Google News — Neuralink', category: 'neurotechnology', maxItems: 5, skipKeywordFilter: true },
  { url: 'https://news.google.com/rss/search?q=MIND+Act+neurotechnology&hl=en-US&gl=US&ceid=US:en', name: 'Google News — MIND Act', category: 'neuroethics', maxItems: 5, skipKeywordFilter: true },
  { url: 'https://news.google.com/rss/search?q=neural+interface+startup&hl=en-US&gl=US&ceid=US:en', name: 'Google News — Neural Startups', category: 'neurotechnology', maxItems: 5, skipKeywordFilter: true },
  // Academic / research
  { url: 'https://rss.arxiv.org/rss/q-bio.NC', name: 'arXiv Neuroscience', category: 'research', maxItems: 5 },
  { url: 'https://www.nature.com/neuro.rss', name: 'Nature Neuroscience', category: 'research', maxItems: 5 },
  { url: 'https://spectrum.ieee.org/feeds/topic/biomedical.rss', name: 'IEEE Spectrum', category: 'neurotechnology', maxItems: 5 },
  { url: 'https://www.nist.gov/blogs/cybersecurity-insights/rss.xml', name: 'NIST Cybersecurity', category: 'bci-security', maxItems: 5 },
];

const RELEVANCE_KEYWORDS = [
  'brain-computer', 'brain computer', 'bci', 'neural interface', 'neurotechnology', 'neurotech',
  'eeg', 'neuroprosthetic', 'brain implant', 'neural implant', 'neurostimulation', 'brain stimulation',
  'tdcs', 'deep brain',
  'neuralink', 'synchron', 'merge labs', 'paradromics', 'blackrock neurotech', 'cortical', 'openbci',
  'post-quantum', 'post quantum', 'quantum cryptography', 'quantum key',
  'neuroethics', 'neurorights', 'cognitive liberty', 'neural security', 'neural privacy', 'neural data',
  'brain data', 'mind act',
  'neurotech funding', 'fda breakthrough', 'fda clearance',
  'altman',
];

const MAX_EXTERNAL_ITEMS = 30;
const FETCH_TIMEOUT_MS = 8000;

// --- Logic (mirrors fetch-feeds.ts) ---

const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_' });

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

function extractItems(xml, feed) {
  const parsed = parser.parse(xml);
  const items = [];

  // RSS 2.0
  const rssItems = parsed?.rss?.channel?.item;
  if (rssItems) {
    const list = Array.isArray(rssItems) ? rssItems : [rssItems];
    for (const item of list.slice(0, feed.maxItems)) {
      const title = item.title || '';
      const summary = item.description || '';
      if (!isRelevant(title, summary, feed)) continue;
      items.push({
        type: 'external',
        title: typeof title === 'string' ? title : String(title),
        date: parseDate(item.pubDate),
        url: item.link || '',
        source: feed.name,
        summary: (typeof summary === 'string' ? summary : String(summary))
          .replace(/<[^>]*>/g, '').trim().slice(0, 200),
        category: feed.category,
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
      const summary = entry.summary?.['#text'] || entry.summary || entry.content?.['#text'] || '';
      if (!isRelevant(title, summary, feed)) continue;
      const link = Array.isArray(entry.link)
        ? entry.link.find((l) => l['@_rel'] === 'alternate')?.['@_href'] || entry.link[0]?.['@_href']
        : entry.link?.['@_href'] || entry.link || '';
      items.push({
        type: 'external',
        title: typeof title === 'string' ? title : String(title),
        date: parseDate(entry.updated || entry.published),
        url: typeof link === 'string' ? link : String(link),
        source: feed.name,
        summary: (typeof summary === 'string' ? summary : String(summary))
          .replace(/<[^>]*>/g, '').trim().slice(0, 200),
        category: feed.category,
      });
    }
    return items;
  }

  return items;
}

async function fetchSingleFeed(feed) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(feed.url, { signal: controller.signal });
    if (!res.ok) {
      console.warn(`  [SKIP] ${feed.name}: HTTP ${res.status}`);
      return [];
    }
    const xml = await res.text();
    const items = extractItems(xml, feed);
    console.log(`  [OK]   ${feed.name}: ${items.length} items`);
    return items;
  } catch (err) {
    console.warn(`  [FAIL] ${feed.name}: ${err.message || err}`);
    return [];
  } finally {
    clearTimeout(timeout);
  }
}

function readCache() {
  try {
    return JSON.parse(readFileSync(CACHE_PATH, 'utf-8'));
  } catch {
    return [];
  }
}

// --- Main ---

console.log(`Fetching ${RSS_FEEDS.length} feeds...`);
const results = await Promise.allSettled(RSS_FEEDS.map(fetchSingleFeed));

const items = [];
for (const result of results) {
  if (result.status === 'fulfilled') items.push(...result.value);
}

const seen = new Set();
const deduped = items
  .sort((a, b) => b.date.localeCompare(a.date))
  .filter((item) => {
    if (seen.has(item.url)) return false;
    seen.add(item.url);
    return true;
  })
  .slice(0, MAX_EXTERNAL_ITEMS);

const oldCache = readCache();
const oldUrls = new Set(oldCache.map((i) => i.url));
const newUrls = new Set(deduped.map((i) => i.url));
const added = deduped.filter((i) => !oldUrls.has(i.url)).length;
const removed = oldCache.filter((i) => !newUrls.has(i.url)).length;

if (deduped.length > 0) {
  writeFileSync(CACHE_PATH, JSON.stringify(deduped, null, 2) + '\n');
  console.log(`\nCache updated: ${deduped.length} items (+${added} new, -${removed} dropped)`);
} else {
  console.log('\nAll feeds failed — keeping existing cache.');
}

// Exit with code 0 if cache changed, 2 if unchanged (for CI to skip commit)
const changed = added > 0 || removed > 0;
if (!changed) {
  console.log('No changes to cache.');
  process.exit(2);
}
