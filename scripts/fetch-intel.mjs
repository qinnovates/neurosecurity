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
const MAX_RESPONSE_BYTES = 5 * 1024 * 1024; // 5 MB cap per feed response

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
  { url: 'https://rss.arxiv.org/rss/cs.NE', name: 'arXiv Neural Computing', category: 'research', maxItems: 5 },
  { url: 'https://www.nature.com/neuro.rss', name: 'Nature Neuroscience', category: 'research', maxItems: 5 },
  { url: 'https://www.nature.com/natbiomedeng.rss', name: 'Nature Biomed Engineering', category: 'research', maxItems: 5 },
  { url: 'https://spectrum.ieee.org/feeds/topic/biomedical.rss', name: 'IEEE Spectrum', category: 'research', maxItems: 5 },
  { url: 'https://neurosciencenews.com/neuroscience-topics/neurotech/feed/', name: 'Neuroscience News Neurotech', category: 'research', maxItems: 10, skipKeywordFilter: true },

  // Scholarly Journals (BCI-specific)
  { url: 'https://iopscience.iop.org/journal/rss/1741-2552', name: 'J Neural Engineering', category: 'research', maxItems: 5, skipKeywordFilter: true },
  { url: 'https://ieeexplore.ieee.org/rss/TOC7333.XML', name: 'IEEE TNSRE', category: 'research', maxItems: 5, skipKeywordFilter: true },
  { url: 'https://ieeexplore.ieee.org/rss/TOC10.XML', name: 'IEEE Trans Biomed Eng', category: 'research', maxItems: 5 },
  { url: 'https://rss.sciencedirect.com/publication/science/1935861X', name: 'Brain Stimulation', category: 'research', maxItems: 5, skipKeywordFilter: true },
  { url: 'https://rss.sciencedirect.com/publication/science/10538119', name: 'NeuroImage', category: 'research', maxItems: 5 },
  { url: 'https://www.cell.com/neuron/current.rss', name: 'Neuron', category: 'research', maxItems: 5 },
  { url: 'https://www.thelancet.com/action/showFeed?jc=laneur&type=etoc&feed=rss', name: 'Lancet Neurology', category: 'research', maxItems: 5 },
  { url: 'https://www.frontiersin.org/journals/neuroscience/rss', name: 'Frontiers Neuroscience', category: 'research', maxItems: 5 },
  { url: 'https://www.frontiersin.org/journals/human-neuroscience/rss', name: 'Frontiers Human Neuro', category: 'research', maxItems: 5 },
  // J Neuroscience removed: HTTP 403, bot-blocked
  { url: 'https://brain.ieee.org/feed/', name: 'IEEE Brain Initiative', category: 'research', maxItems: 5, skipKeywordFilter: true },
  { url: 'https://bcisociety.org/feed/', name: 'BCI Society', category: 'research', maxItems: 5, skipKeywordFilter: true },
  { url: 'https://www.pnas.org/action/showFeed?type=etoc&feed=rss&jc=PNAS', name: 'PNAS', category: 'research', maxItems: 3 },

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

  // Financial / Startup / Press Wire (neurotech-filtered)
  { url: 'https://medcitynews.com/feed/', name: 'MedCity News', category: 'funding', maxItems: 5 },
  { url: 'https://www.globenewswire.com/RssFeed/industry/4573-Biotechnology/feedTitle/GlobeNewswire%20-%20Biotechnology', name: 'GlobeNewswire Biotech', category: 'funding', maxItems: 5 },
  { url: 'https://www.globenewswire.com/RssFeed/industry/4535-Medical%20Equipment/feedTitle/GlobeNewswire%20-%20Medical%20Equipment', name: 'GlobeNewswire MedEquip', category: 'funding', maxItems: 5 },
  { url: 'https://www.prnewswire.com/rss/news-releases-list.rss', name: 'PR Newswire', category: 'funding', maxItems: 5 },

  // Additional News Sources (synced from intel-sources.json)
  { url: 'https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=19854910', name: 'CNBC Tech', category: 'news', maxItems: 5 },
  { url: 'https://www.biopharmadive.com/feeds/news/', name: 'BioPharma Dive', category: 'product', maxItems: 5 },
  { url: 'https://www.sciencedaily.com/rss/mind_brain.xml', name: 'ScienceDaily Neuro', category: 'research', maxItems: 5 },
  { url: 'https://hnrss.org/newest?q=BCI+OR+brain-computer+OR+neurotech', name: 'Hacker News BCI', category: 'news', maxItems: 5, skipKeywordFilter: true },
  { url: 'https://techcrunch.com/category/startups/feed/', name: 'TechCrunch Startups', category: 'funding', maxItems: 5 },

  // Regulatory & Medical Device Security
  { url: 'https://www.fda.gov/about-fda/contact-fda/stay-informed/rss-feeds/press-releases/rss.xml', name: 'FDA Press Releases', category: 'regulatory', maxItems: 5 },
  { url: 'https://www.nist.gov/blogs/cybersecurity-insights/rss.xml', name: 'NIST Cybersecurity', category: 'regulatory', maxItems: 5 },
  { url: 'https://www.cisa.gov/cybersecurity-advisories/ics-medical-advisories.xml', name: 'CISA ICS Medical', category: 'regulatory', maxItems: 10 },
  { url: 'https://www.cisa.gov/cybersecurity-advisories/ics-advisories.xml', name: 'CISA ICS Advisories', category: 'regulatory', maxItems: 5 },
  { url: 'https://www.healio.com/rss/neurology', name: 'Healio Neurology', category: 'research', maxItems: 5 },

  // Google News queries (pre-filtered, skip keyword check)
  { url: 'https://news.google.com/rss/search?q=brain+computer+interface+funding+OR+neurotech+funding&hl=en-US&gl=US&ceid=US:en', name: 'GN: BCI Funding', category: 'funding', maxItems: 10, skipKeywordFilter: true },
  { url: 'https://news.google.com/rss/search?q=Neuralink+OR+Synchron+OR+Paradromics+OR+Precision+Neuroscience+OR+Science+Corp&hl=en-US&gl=US&ceid=US:en', name: 'GN: BCI Companies', category: 'product', maxItems: 10, skipKeywordFilter: true },
  { url: 'https://news.google.com/rss/search?q=brain+implant+FDA+OR+neural+device+clearance&hl=en-US&gl=US&ceid=US:en', name: 'GN: BCI FDA', category: 'regulatory', maxItems: 5, skipKeywordFilter: true },
  { url: 'https://news.google.com/rss/search?q=neurorights+OR+neural+privacy+OR+cognitive+liberty+OR+neurodata+law&hl=en-US&gl=US&ceid=US:en', name: 'GN: Neurorights', category: 'policy', maxItems: 5, skipKeywordFilter: true },
  { url: 'https://news.google.com/rss/search?q=brain+computer+interface+clinical+trial+OR+neural+implant+trial&hl=en-US&gl=US&ceid=US:en', name: 'GN: BCI Trials', category: 'clinical', maxItems: 5, skipKeywordFilter: true },
  { url: 'https://news.google.com/rss/search?q=EEG+headset+consumer+OR+neurotech+wearable&hl=en-US&gl=US&ceid=US:en', name: 'GN: Consumer EEG', category: 'product', maxItems: 5, skipKeywordFilter: true },
  { url: 'https://news.google.com/rss/search?q=neurotechnology+regulation+EU+OR+US+OR+FDA+OR+PATCH+Act&hl=en-US&gl=US&ceid=US:en', name: 'GN: Neurotech Regulation', category: 'regulatory', maxItems: 5, skipKeywordFilter: true },
  // New: Medical device security, emerging modalities, gov funding, M&A
  { url: 'https://news.google.com/rss/search?q=medical+device+cybersecurity+OR+IoMT+security+OR+PATCH+Act+OR+FDA+524B&hl=en-US&gl=US&ceid=US:en', name: 'GN: MedDevice Security', category: 'regulatory', maxItems: 10, skipKeywordFilter: true },
  { url: 'https://news.google.com/rss/search?q=transcranial+ultrasound+BCI+OR+fNIRS+brain+computer+OR+focused+ultrasound+neuro&hl=en-US&gl=US&ceid=US:en', name: 'GN: Emerging Modalities', category: 'research', maxItems: 5, skipKeywordFilter: true },
  { url: 'https://news.google.com/rss/search?q=DARPA+neural+OR+NIH+brain+interface+OR+NSF+neurotechnology+grant&hl=en-US&gl=US&ceid=US:en', name: 'GN: Gov Funding Neuro', category: 'funding', maxItems: 5, skipKeywordFilter: true },
  { url: 'https://news.google.com/rss/search?q=neurotech+acquisition+OR+brain+device+IPO+OR+neural+interface+merger&hl=en-US&gl=US&ceid=US:en', name: 'GN: Neurotech M&A', category: 'funding', maxItems: 5, skipKeywordFilter: true },
  { url: 'https://news.google.com/rss/search?q=neurotech+venture+capital+OR+BCI+series+funding&hl=en-US&gl=US&ceid=US:en', name: 'GN: Neurotech VC', category: 'funding', maxItems: 10, skipKeywordFilter: true },
  { url: 'https://news.google.com/rss/search?q=brain+implant+patent+filing+OR+neural+interface+patent&hl=en-US&gl=US&ceid=US:en', name: 'GN: Neurotech Patents', category: 'product', maxItems: 5, skipKeywordFilter: true },
];

// --- Relevance Keywords (expanded from fetch-news.mjs) ---

const RELEVANCE_KEYWORDS = [
  // Core BCI / Neurotech
  'brain-computer', 'brain computer', 'bci', 'neural interface', 'neurotechnology', 'neurotech',
  'eeg', 'neuroprosthetic', 'brain implant', 'neural implant', 'neurostimulation', 'brain stimulation',
  'tdcs', 'deep brain', 'cortical implant', 'neural decoder', 'brain-machine',
  // Companies
  'neuralink', 'synchron', 'merge labs', 'paradromics', 'blackrock neurotech', 'cortical', 'openbci',
  'emotiv', 'interaxon', 'muse headband', 'neurosity', 'brainco', 'kernel flow', 'cognixion',
  'neurable', 'arctop', 'precision neuroscience', 'inbrain', 'science corp', 'cortical labs',
  'neuros medical', 'nalu medical',
  // Quantum + Security
  'post-quantum', 'post quantum', 'quantum cryptography', 'quantum key',
  'quantum neural', 'quantum bci', 'neuromorphic quantum',
  // Neuroethics / Policy / Governance
  'neuroethics', 'neurorights', 'cognitive liberty', 'neural security', 'neural privacy', 'neural data',
  'brain data', 'mind act', 'neuroprivacy', 'neural data protection', 'neurodata',
  'mental privacy bill', 'brain data governance',
  // Medical Device Security / IoMT
  'iomt', 'internet of medical things', 'patch act', 'fdora', '524b',
  'medical device cybersecurity', 'medical device vulnerability', 'sbom', 'software bill of materials',
  // Regulatory / FDA
  'neurotech funding', 'fda breakthrough', 'fda clearance', 'fda approval', '510(k)', 'de novo',
  // Signals / Measurement
  'brain signal', 'neural signal', 'brain activity', 'neural recording',
  // Devices / Applications
  'cochlear implant', 'retinal implant', 'spinal cord stimulat',
  'neurofeedback', 'brain-to-text', 'speech neuroprosthesis', 'motor neuroprosthesis',
  // Emerging Modalities
  'fnirs', 'functional near-infrared', 'magnetoencephalography', 'meg neuroimaging',
  'transcranial ultrasound', 'focused ultrasound', 'tfus', 'tus neuromodulation',
  'optogenetics', 'functional ultrasound', 'ecog', 'electrocorticography',
  // Financial / Investment
  'series a', 'series b', 'series c', 'seed round', 'neurotech ipo',
  'brain device acquisition', 'medtech merger', 'bioelectronics',
  // Security Research
  'neural adversarial', 'eeg attack', 'brain signal spoofing',
  'neural injection', 'bci security',
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

// --- Security: Sanitization Helpers ---

/** Defang a URL for safe storage: https://example.com → hxxps://example[.]com */
function defangUrl(url) {
  if (typeof url !== 'string' || !url) return '';
  return url
    .replace(/^https:\/\//i, 'hxxps://')
    .replace(/^http:\/\//i, 'hxxp://')
    .replace(/\./g, '[.]');
}

/** Validate URL scheme — only allow http(s). Rejects javascript:, data:, file:, etc. */
function isValidUrl(url) {
  if (typeof url !== 'string') return false;
  return /^https?:\/\//i.test(url);
}

/** Strip HTML tags (iterative to handle nested/malformed), control chars, null bytes */
function sanitizeText(str) {
  if (typeof str !== 'string') return String(str || '');
  let result = str;
  // Strip HTML tags (loop handles nested tags like <a<script>>)
  let prev;
  do {
    prev = result;
    result = result.replace(/<[^>]*>/g, '');
  } while (result !== prev);
  // Strip null bytes and control characters (keep newlines/tabs for readability)
  result = result.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  // Collapse excessive whitespace
  result = result.replace(/\s+/g, ' ').trim();
  return result;
}

/** Sanitize a title — strip HTML, control chars, cap length */
function sanitizeTitle(raw) {
  return sanitizeText(raw).slice(0, 300);
}

/** Sanitize a summary — strip HTML, control chars, cap length */
function sanitizeSummary(raw) {
  return sanitizeText(raw).slice(0, 200);
}

// --- Helpers ---

// Hardened XML parser: disable entity processing to prevent XXE / Billion Laughs
const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  processEntities: false,
  htmlEntities: false,
});

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
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp(`\\b${escaped}\\b`, 'i');
    if (re.test(text)) {
      found.push(name);
    }
  }
  return found;
}

// --- XML Parsing (same approach as fetch-news.mjs) ---

/** Build a sanitized + defanged feed item, or null if URL is invalid */
function buildItem(rawTitle, rawSummary, rawUrl, rawDate, feed, companyNames) {
  const title = sanitizeTitle(rawTitle);
  const summary = sanitizeSummary(rawSummary);
  const url = typeof rawUrl === 'string' ? rawUrl.trim() : String(rawUrl || '');

  // Reject non-http(s) URLs — blocks javascript:, data:, file: injection
  if (!isValidUrl(url)) return null;
  if (!isRelevant(title, summary, feed)) return null;

  return {
    id: generateId(),
    title,
    date: parseDate(rawDate),
    url: defangUrl(url),
    source: feed.name,
    source_category: feed.category,
    summary,
    tags: autoTag(title, summary),
    companies: extractCompanies(title, summary, companyNames),
    fetched: new Date().toISOString().slice(0, 10),
  };
}

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
      const result = buildItem(title, rawSummary, item.link, item.pubDate, feed, companyNames);
      if (result) items.push(result);
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
      const link = Array.isArray(entry.link)
        ? entry.link.find((l) => l['@_rel'] === 'alternate')?.['@_href'] || entry.link[0]?.['@_href']
        : entry.link?.['@_href'] || entry.link || '';
      const result = buildItem(titleStr, rawSummary, link, entry.updated || entry.published, feed, companyNames);
      if (result) items.push(result);
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
      const result = buildItem(title, rawSummary, item.link, item['dc:date'] || item.pubDate, feed, companyNames);
      if (result) items.push(result);
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
    // Enforce response size limit to prevent memory exhaustion
    const contentLength = parseInt(res.headers.get('content-length') || '0', 10);
    if (contentLength > MAX_RESPONSE_BYTES) {
      console.warn(`  [SKIP] ${feed.name}: response too large (${contentLength} bytes)`);
      return [];
    }
    const xml = await res.text();
    if (xml.length > MAX_RESPONSE_BYTES) {
      console.warn(`  [SKIP] ${feed.name}: response body too large (${xml.length} chars)`);
      return [];
    }
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
