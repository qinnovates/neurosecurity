/** News & Intel data — single source of truth for news.astro and rss.xml.ts */

export interface Source {
  name: string;
  url: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  description: string;
  sources: Source[];
}

export interface Brief {
  date: string;
  title: string;
  category: string;
  summary: string;
  relevance: string;
  url?: string;
}

export const categories: Category[] = [
  {
    id: 'bci-security',
    name: 'BCI Security',
    icon: '&#9632;',
    color: 'var(--color-accent-primary)',
    description: 'Vulnerabilities, threat research, and defense strategies for neural interfaces.',
    sources: [
      { name: 'NIST Cybersecurity', url: 'https://www.nist.gov/cybersecurity' },
      { name: 'IEEE Brain Initiative', url: 'https://brain.ieee.org/' },
      { name: 'MITRE ATT&CK', url: 'https://attack.mitre.org/' },
    ],
  },
  {
    id: 'neurotechnology',
    name: 'Neurotechnology',
    icon: '&#9670;',
    color: 'var(--color-accent-secondary)',
    description: 'Device advances, clinical trials, FDA clearances, and industry developments.',
    sources: [
      { name: 'Neuralink', url: 'https://neuralink.com/blog/' },
      { name: 'Synchron', url: 'https://synchron.com/' },
      { name: 'BCI Society', url: 'https://bcisociety.org/' },
      { name: 'OpenBCI', url: 'https://openbci.com/' },
    ],
  },
  {
    id: 'quantum',
    name: 'Quantum Computing',
    icon: '&#8734;',
    color: 'var(--color-accent-tertiary)',
    description: 'Quantum security, post-quantum cryptography, and quantum-neural intersections.',
    sources: [
      { name: 'NIST PQC', url: 'https://csrc.nist.gov/projects/post-quantum-cryptography' },
      { name: 'Qiskit Blog', url: 'https://www.ibm.com/quantum/blog' },
      { name: 'Quantum Computing Report', url: 'https://quantumcomputingreport.com/' },
    ],
  },
  {
    id: 'neuroethics',
    name: 'Neuroethics & Policy',
    icon: '&#9674;',
    color: 'var(--color-status-safe)',
    description: 'Cognitive liberty, neural data governance, regulatory frameworks, and rights.',
    sources: [
      { name: 'Neurorights Foundation', url: 'https://neurorightsfoundation.org/' },
      { name: 'UNESCO Neuroethics', url: 'https://www.unesco.org/en/ethics-neurotechnology' },
      { name: 'OECD Neurotechnology', url: 'https://www.oecd.org/en/topics/sub-issues/neurotechnology.html' },
    ],
  },
  {
    id: 'research',
    name: 'Research & Academia',
    icon: '&#9830;',
    color: 'var(--color-text-muted)',
    description: 'Published papers, preprints, and academic developments in neural security.',
    sources: [
      { name: 'arXiv Neuroscience', url: 'https://arxiv.org/list/q-bio.NC/recent' },
      { name: 'Nature Neuroscience', url: 'https://www.nature.com/neuro/' },
      { name: 'IEEE Xplore', url: 'https://ieeexplore.ieee.org/' },
    ],
  },
];

export const briefs: Brief[] = [
  {
    date: '2026-02',
    title: 'Apple BCI-HID Protocol Makes Brain Control a Native Input Method',
    category: 'neurotechnology',
    summary: 'Apple\'s BCI Human Interface Device protocol, demonstrated with Synchron\'s Stentrode, makes neural signals a native input alongside touch and voice in iOS/iPadOS/visionOS. First public demo: ALS patient controlled iPad entirely by thought (Aug 2025). Meanwhile, OpenAI invested $250M in Merge Labs for non-invasive neural interfaces.',
    relevance: 'Billions of Apple devices become potential BCI endpoints. BCI-HID uses BLE transport with no PQ crypto. NSP device class tiers (T1/T2/T3) provide the compliance framework the MIND Act needs. QIF Band 3 and I0 threat models need Apple ecosystem-specific analysis.',
    url: '/publications/2026-02-07-apple-just-made-brain-control-a-native-input-method-now-what/',
  },
  {
    date: '2026-02',
    title: 'NIST Post-Quantum Cryptography Standards Finalized',
    category: 'quantum',
    summary: 'NIST has finalized three post-quantum cryptographic algorithms (ML-KEM, ML-DSA, SLH-DSA). These standards will directly impact BCI encryption protocols at QIF Band 3.',
    relevance: 'QIF Band 3 (Protocol Security) specifications should reference these PQC standards for forward-secure neural data encryption.',
    url: 'https://csrc.nist.gov/projects/post-quantum-cryptography',
  },
  {
    date: '2026-01',
    title: 'Synchron Stentrode Receives FDA Breakthrough Device Designation',
    summary: 'Endovascular BCI reaches another clinical milestone. The minimally invasive approach changes the attack surface analysis — no craniotomy means different physical security vectors.',
    category: 'neurotechnology',
    relevance: 'QIF I0 (Neural Gateway) threat model needs endovascular-specific vectors alongside traditional implanted devices.',
    url: 'https://synchron.com/',
  },
  {
    date: '2026-01',
    title: 'UNESCO Publishes Recommendations on Neurotechnology Ethics',
    summary: 'First intergovernmental framework for neurotechnology governance. Addresses cognitive liberty, mental privacy, and neural data as a special category.',
    category: 'neuroethics',
    relevance: 'QIF Band 7 (Cognitive Sovereignty) aligns with UNESCO cognitive liberty principles. Framework validation opportunity.',
    url: 'https://www.unesco.org/en/ethics-neurotechnology',
  },
  {
    date: '2026-01',
    title: 'First Adversarial EEG Attack Demonstrated at IEEE S&P',
    summary: 'Researchers demonstrate that adversarial perturbations in EEG signals can fool BCI decoders, causing misclassification of motor intent.',
    category: 'bci-security',
    relevance: 'Directly validates QIF threat model: adversarial signal injection at Band 5 (Signal Processing). Coherence metric could detect these perturbations.',
    url: 'https://ieeexplore.ieee.org/',
  },
];
