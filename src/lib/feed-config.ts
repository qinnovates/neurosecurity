/** RSS feed configuration for external news fetching */

export interface FeedSource {
  url: string;
  name: string;
  category: string;
  maxItems: number;
  /** Skip keyword relevance check — useful for Google News feeds already filtered by query */
  skipKeywordFilter?: boolean;
}

export const RSS_FEEDS: FeedSource[] = [
  // --- Tech journalism (catches funding, product launches, policy) ---
  {
    url: 'https://techcrunch.com/feed/',
    name: 'TechCrunch',
    category: 'neurotechnology',
    maxItems: 5,
  },
  {
    url: 'https://www.theverge.com/rss/index.xml',
    name: 'The Verge',
    category: 'neurotechnology',
    maxItems: 5,
  },
  {
    url: 'https://www.wired.com/feed/rss',
    name: 'Wired',
    category: 'neurotechnology',
    maxItems: 5,
  },
  {
    url: 'https://www.technologyreview.com/feed/',
    name: 'MIT Technology Review',
    category: 'research',
    maxItems: 5,
  },

  // --- Biotech / medtech industry (clinical trials, device news) ---
  {
    url: 'https://www.statnews.com/feed/',
    name: 'STAT News',
    category: 'neurotechnology',
    maxItems: 5,
  },
  {
    url: 'https://www.fiercebiotech.com/rss/xml',
    name: 'Fierce Biotech',
    category: 'neurotechnology',
    maxItems: 5,
  },

  // --- Google News custom queries (pre-filtered, skip keyword check) ---
  {
    url: 'https://news.google.com/rss/search?q=brain+computer+interface&hl=en-US&gl=US&ceid=US:en',
    name: 'Google News — BCI',
    category: 'neurotechnology',
    maxItems: 5,
    skipKeywordFilter: true,
  },
  {
    url: 'https://news.google.com/rss/search?q=Neuralink&hl=en-US&gl=US&ceid=US:en',
    name: 'Google News — Neuralink',
    category: 'neurotechnology',
    maxItems: 5,
    skipKeywordFilter: true,
  },
  {
    url: 'https://news.google.com/rss/search?q=MIND+Act+neurotechnology&hl=en-US&gl=US&ceid=US:en',
    name: 'Google News — MIND Act',
    category: 'neuroethics',
    maxItems: 5,
    skipKeywordFilter: true,
  },
  {
    url: 'https://news.google.com/rss/search?q=neural+interface+startup&hl=en-US&gl=US&ceid=US:en',
    name: 'Google News — Neural Startups',
    category: 'neurotechnology',
    maxItems: 5,
    skipKeywordFilter: true,
  },

  // --- Academic / research (kept from original) ---
  {
    url: 'https://rss.arxiv.org/rss/q-bio.NC',
    name: 'arXiv Neuroscience',
    category: 'research',
    maxItems: 5,
  },
  {
    url: 'https://www.nature.com/neuro.rss',
    name: 'Nature Neuroscience',
    category: 'research',
    maxItems: 5,
  },
  {
    url: 'https://spectrum.ieee.org/feeds/topic/biomedical.rss',
    name: 'IEEE Spectrum',
    category: 'neurotechnology',
    maxItems: 5,
  },
  {
    url: 'https://www.nist.gov/blogs/cybersecurity-insights/rss.xml',
    name: 'NIST Cybersecurity',
    category: 'bci-security',
    maxItems: 5,
  },
];

export const RELEVANCE_KEYWORDS = [
  // Core BCI terms
  'brain-computer',
  'brain computer',
  'bci',
  'neural interface',
  'neurotechnology',
  'neurotech',
  'eeg',
  'neuroprosthetic',
  'brain implant',
  'neural implant',
  'neurostimulation',
  'brain stimulation',
  'tdcs',
  'deep brain',
  // Companies & orgs
  'neuralink',
  'synchron',
  'merge labs',
  'paradromics',
  'blackrock neurotech',
  'cortical',
  'openbci',
  // Quantum / crypto
  'post-quantum',
  'post quantum',
  'quantum cryptography',
  'quantum key',
  // Policy & ethics
  'neuroethics',
  'neurorights',
  'cognitive liberty',
  'neural security',
  'neural privacy',
  'neural data',
  'brain data',
  'mind act',
  // Industry / funding
  'neurotech funding',
  'fda breakthrough',
  'fda clearance',
  // People
  'altman',
];

export const MAX_EXTERNAL_ITEMS = 30;
export const FETCH_TIMEOUT_MS = 8000;
