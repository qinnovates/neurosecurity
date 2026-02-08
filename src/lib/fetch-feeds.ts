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

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
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
          .replace(/<[^>]*>/g, '')
          .trim()
          .slice(0, 200),
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
      items.push({
        type: 'external',
        title: typeof title === 'string' ? title : String(title),
        date: parseDate(entry.updated || entry.published),
        url: typeof link === 'string' ? link : String(link),
        source: feed.name,
        summary: (typeof summary === 'string' ? summary : String(summary))
          .replace(/<[^>]*>/g, '')
          .trim()
          .slice(0, 200),
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
    const res = await fetch(feed.url, { signal: controller.signal });
    if (!res.ok) return [];
    const xml = await res.text();
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
