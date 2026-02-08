/** RSS feed configuration for external news fetching */

export interface FeedSource {
  url: string;
  name: string;
  category: string;
  maxItems: number;
}

export const RSS_FEEDS: FeedSource[] = [
  {
    url: 'https://rss.arxiv.org/rss/q-bio.NC',
    name: 'arXiv Neuroscience',
    category: 'research',
    maxItems: 5,
  },
  {
    url: 'https://rss.arxiv.org/rss/quant-ph',
    name: 'arXiv Quantum Physics',
    category: 'quantum',
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
  'brain-computer',
  'brain computer',
  'bci',
  'neural interface',
  'neurotechnology',
  'neurotech',
  'eeg',
  'neuralink',
  'synchron',
  'post-quantum',
  'post quantum',
  'quantum cryptography',
  'quantum key',
  'neuroethics',
  'neurorights',
  'cognitive liberty',
  'neural security',
  'neural privacy',
  'brain data',
  'neuroprosthetic',
  'brain implant',
  'neurostimulation',
];

export const MAX_EXTERNAL_ITEMS = 20;
export const FETCH_TIMEOUT_MS = 5000;
