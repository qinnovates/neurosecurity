/** Build-time RSS fetcher — runs in Astro frontmatter, not in the browser */

import { XMLParser } from 'fast-xml-parser';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { ExternalItem } from './feed-types';
import {
  RSS_FEEDS,
  RELEVANCE_KEYWORDS,
  MAX_EXTERNAL_ITEMS,
  FETCH_TIMEOUT_MS,
  type FeedSource,
} from './feed-config';

const CACHE_PATH = resolve(process.cwd(), 'src/data/external-news-cache.json');
const MAX_RESPONSE_BYTES = 5 * 1024 * 1024; // 5 MB cap per feed response

/** Defang a URL for safe storage: https://example.com → hxxps://example[.]com */
function defangUrl(url: string): string {
  if (!url) return '';
  return url
    .replace(/^https:\/\//i, 'hxxps://')
    .replace(/^http:\/\//i, 'hxxp://')
    .replace(/\./g, '[.]');
}

/** Validate URL scheme — only allow http(s) */
function isValidUrl(url: string): boolean {
  return /^https?:\/\//i.test(url);
}

/** Strip HTML tags (iterative), decode entities, strip control chars, collapse whitespace */
function sanitizeText(str: string): string {
  if (typeof str !== 'string') return String(str || '');
  let result = str;
  let prev: string;
  do {
    prev = result;
    result = result.replace(/<[^>]*>/g, '');
  } while (result !== prev);
  // Decode common HTML entities that could hide script tags
  result = result.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"').replace(/&#x27;/g, "'").replace(/&#39;/g, "'");
  do {
    prev = result;
    result = result.replace(/<[^>]*>/g, '');
  } while (result !== prev);
  result = result.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  result = result.replace(/\s+/g, ' ').trim();
  return result;
}

// Hardened XML parser: disable entity processing to prevent XXE / Billion Laughs
const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  processEntities: false,
  htmlEntities: false,
});

function isRelevant(title: string, summary: string, feed: FeedSource): boolean {
  if (feed.skipKeywordFilter) return true;
  const text = `${title} ${summary}`.toLowerCase();
  return RELEVANCE_KEYWORDS.some((kw) => text.includes(kw));
}

function parseDate(raw: string | undefined): string {
  if (!raw) return new Date().toISOString().slice(0, 10);
  const d = new Date(raw);
  return isNaN(d.getTime()) ? new Date().toISOString().slice(0, 10) : d.toISOString().slice(0, 10);
}

function extractItems(xml: string, feed: FeedSource): ExternalItem[] {
  const parsed = parser.parse(xml);
  const items: ExternalItem[] = [];

  // RSS 2.0
  const rssItems = parsed?.rss?.channel?.item;
  if (rssItems) {
    const list = Array.isArray(rssItems) ? rssItems : [rssItems];
    for (const item of list.slice(0, feed.maxItems)) {
      const title = typeof item.title === 'string' ? item.title : String(item.title || '');
      const summary = item.description || '';
      if (!isRelevant(title, summary, feed)) continue;
      const rawUrl = typeof item.link === 'string' ? item.link.trim() : String(item.link || '');
      if (!isValidUrl(rawUrl)) continue;
      items.push({
        type: 'external',
        title: sanitizeText(title).slice(0, 300),
        date: parseDate(item.pubDate),
        url: defangUrl(rawUrl),
        source: feed.name,
        summary: sanitizeText(typeof summary === 'string' ? summary : String(summary)).slice(0, 200),
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
        ? entry.link.find((l: any) => l['@_rel'] === 'alternate')?.['@_href'] || entry.link[0]?.['@_href']
        : entry.link?.['@_href'] || entry.link || '';
      const rawUrl = typeof link === 'string' ? link.trim() : String(link);
      if (!isValidUrl(rawUrl)) continue;
      items.push({
        type: 'external',
        title: sanitizeText(typeof title === 'string' ? title : String(title)).slice(0, 300),
        date: parseDate(entry.updated || entry.published),
        url: defangUrl(rawUrl),
        source: feed.name,
        summary: sanitizeText(typeof summary === 'string' ? summary : String(summary)).slice(0, 200),
        category: feed.category,
      });
    }
    return items;
  }

  return items;
}

async function fetchSingleFeed(feed: FeedSource): Promise<ExternalItem[]> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(feed.url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'QinnovateBCINewsBot/1.0 (research)',
        Accept: 'application/rss+xml, application/atom+xml, application/xml, text/xml',
      },
    });
    if (!res.ok) return [];
    const contentLength = parseInt(res.headers.get('content-length') || '0', 10);
    if (contentLength > MAX_RESPONSE_BYTES) return [];
    const xml = await res.text();
    if (xml.length > MAX_RESPONSE_BYTES) return [];
    return extractItems(xml, feed);
  } catch {
    return [];
  } finally {
    clearTimeout(timeout);
  }
}

function readCache(): ExternalItem[] {
  try {
    const raw = readFileSync(CACHE_PATH, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function writeCache(items: ExternalItem[]): void {
  try {
    writeFileSync(CACHE_PATH, JSON.stringify(items, null, 2));
  } catch {
    // Non-fatal: cache write failure doesn't break the build
  }
}

export async function fetchExternalNews(): Promise<ExternalItem[]> {
  const results = await Promise.allSettled(RSS_FEEDS.map(fetchSingleFeed));

  const items: ExternalItem[] = [];
  for (const result of results) {
    if (result.status === 'fulfilled') {
      items.push(...result.value);
    }
  }

  // Sort by date, dedupe by URL, limit
  const seen = new Set<string>();
  const deduped = items
    .sort((a, b) => b.date.localeCompare(a.date))
    .filter((item) => {
      if (seen.has(item.url)) return false;
      seen.add(item.url);
      return true;
    })
    .slice(0, MAX_EXTERNAL_ITEMS);

  if (deduped.length > 0) {
    writeCache(deduped);
    return deduped;
  }

  // Fallback to cache if all feeds failed
  return readCache();
}
