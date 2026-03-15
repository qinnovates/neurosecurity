/**
 * Domain Matrix Constants — biological domain × interaction mode taxonomy.
 *
 * Maps TARA techniques into a 12-row × 3-column heatmap grid:
 * - Rows: biological/functional domains (VIS, AUD, SOM, VES, MOT, EMO, COG, MEM, LNG, AUT, IDN, SIL)
 * - Columns: interaction modes (R=Read, M=Modulate, D=Disrupt)
 *
 * Techniques are mapped via keyword matching on name, description, tactic,
 * bands, and clinical data. A technique can appear in multiple cells.
 */

import type { ThreatVector } from '../../lib/threat-data';

// ═══ Domain Codes ═══

export type DomainCode =
  | 'VIS' | 'AUD' | 'SOM' | 'VES'   // Sensory zone
  | 'MOT' | 'EMO' | 'COG' | 'MEM' | 'LNG'  // Higher function zone
  | 'AUT' | 'IDN'                     // Regulatory zone
  | 'SIL';                            // Silicon zone

export const DOMAIN_ORDER: DomainCode[] = [
  'VIS', 'AUD', 'SOM', 'VES',
  'MOT', 'EMO', 'COG', 'MEM', 'LNG',
  'AUT', 'IDN',
  'SIL',
];

// ═══ Domain Zones ═══

export type ZoneId = 'sensory' | 'higher' | 'regulatory' | 'silicon';

export interface DomainZone {
  id: ZoneId;
  label: string;
  color: string;
  domains: DomainCode[];
}

export const DOMAIN_ZONES: DomainZone[] = [
  { id: 'sensory', label: 'Sensory', color: '#06b6d4', domains: ['VIS', 'AUD', 'SOM', 'VES'] },
  { id: 'higher', label: 'Higher Functions', color: '#10b981', domains: ['MOT', 'EMO', 'COG', 'MEM', 'LNG'] },
  { id: 'regulatory', label: 'Regulatory', color: '#8b5cf6', domains: ['AUT', 'IDN'] },
  { id: 'silicon', label: 'Silicon', color: '#3b82f6', domains: ['SIL'] },
];

/** Lookup zone for a domain code. */
export function getZoneForDomain(code: DomainCode): DomainZone {
  return DOMAIN_ZONES.find(z => z.domains.includes(code))!;
}

// ═══ Domain Labels ═══

export const DOMAIN_LABELS: Record<DomainCode, string> = {
  VIS: 'Visual',
  AUD: 'Auditory',
  SOM: 'Somatosensory',
  VES: 'Vestibular',
  MOT: 'Motor',
  EMO: 'Emotional',
  COG: 'Cognitive',
  MEM: 'Memory',
  LNG: 'Language',
  AUT: 'Autonomic',
  IDN: 'Identity',
  SIL: 'Silicon',
};

// ═══ Interaction Modes ═══

export type ModeCode = 'R' | 'M' | 'D';

export const MODE_ORDER: ModeCode[] = ['R', 'M', 'D'];

export const MODE_COLORS: Record<ModeCode, string> = {
  R: '#06b6d4',
  M: '#f59e0b',
  D: '#ef4444',
};

export const MODE_LABELS: Record<ModeCode, Record<string, string>> = {
  R: { security: 'Reconnaissance', clinical: 'Recording', both: 'Recon / Recording' },
  M: { security: 'Manipulation', clinical: 'Modulation', both: 'Manip / Modulation' },
  D: { security: 'Disruption', clinical: 'Damage', both: 'Disruption / Damage' },
};

// ═══ Technique → Domain Mapping ═══

/**
 * Keyword-based mapping rules. Each domain has a list of patterns matched
 * against technique name, description, bands, tactic, and clinical data.
 * Case-insensitive matching. A technique can map to multiple domains.
 */
const DOMAIN_KEYWORDS: Record<DomainCode, RegExp> = {
  VIS: /visual|vision|retina|occipital|V1|sight|phosphene|blindsight|optic|photopic|cortical\s*prosth/i,
  AUD: /auditory|hearing|cochlea|acoustic|sound|speech\s*decode|ultrasonic|infrasonic|temporal\s*lobe/i,
  SOM: /somatosens|touch|haptic|pain|nocicepti|thermal|temperature|tactile|sensory\s*cortex/i,
  VES: /vestibul|balance|vertigo|dizzi|nystagmus|galvanic|otolith|semicircular/i,
  MOT: /motor|movement|muscle|tremor|paralys|ataxia|gait|locomot|corticospinal|M1\b|spastic/i,
  EMO: /emotion|mood|affect|anxiety|depress|fear|amygdala|limbic|reward|pleasure|anhedon/i,
  COG: /cogniti|attention|executive|decision|perception|awareness|conscious|prefrontal|PFC/i,
  MEM: /memory|hippocamp|encoding|retrieval|amnesi|consolidat|engram|long.term|short.term/i,
  LNG: /language|speech|aphasia|Broca|Wernicke|verbal|semantic|lexical|dysarthri/i,
  AUT: /autonom|cardiac|heart\s*rate|blood\s*pressure|respir|sympathet|parasympathet|vagal|vagus|HRV|sweating|pupil/i,
  IDN: /identity|persona|self|agency|ownership|dissociat|dereali|depersonali|continuity/i,
  SIL: /firmware|protocol|bluetooth|wifi|wireless|USB|software|driver|amplif|ADC|RF|antenna|silicon|digital|network|encrypt|decrypt|key\s*exchange/i,
};

/**
 * Mode mapping rules. Each mode has patterns matched against technique fields.
 * Falls back to category-based mapping.
 */
const MODE_KEYWORDS: Record<ModeCode, RegExp> = {
  R: /eavesdrop|intercept|decode|record|capture|exfiltrat|inference|sniff|monitor|reconnais|read|harvest|extract/i,
  M: /modulat|inject|stimulat|manipulat|alter|modify|bias|entrainment|feedback|implant|subvert/i,
  D: /disrupt|denial|DoS|damage|destroy|degrad|impair|seizure|ablat|jam|interfere|overload|corrupt/i,
};

/** Category → mode fallback mapping. */
const CATEGORY_MODE_MAP: Record<string, ModeCode> = {
  SI: 'M', SE: 'R', DM: 'M', DS: 'D', PE: 'M',
  CR: 'R', CD: 'D', PS: 'D', EX: 'R',
};

/** Band → domain fallback mapping. */
const BAND_DOMAIN_MAP: Record<string, DomainCode[]> = {
  N7: ['COG', 'LNG', 'MOT', 'VIS'],
  N6: ['EMO', 'MEM'],
  N5: ['MOT', 'COG'],
  N4: ['VIS', 'AUD', 'SOM', 'COG'],
  N3: ['MOT', 'VES'],
  N2: ['AUT', 'SOM'],
  N1: ['MOT', 'AUT', 'SOM'],
  I0: ['SIL'],
  S1: ['SIL'],
  S2: ['SIL'],
  S3: ['SIL'],
};

/** Classify a technique into domain codes. Returns at least one. */
export function classifyDomains(t: ThreatVector): DomainCode[] {
  const text = [
    t.name,
    t.description,
    t.bandsStr,
    t.tara?.clinical?.therapeutic_analog ?? '',
    ...(t.tara?.clinical?.conditions ?? []),
  ].join(' ');

  const matched = new Set<DomainCode>();

  // Keyword matching
  for (const [code, re] of Object.entries(DOMAIN_KEYWORDS) as [DomainCode, RegExp][]) {
    if (re.test(text)) matched.add(code);
  }

  // Band-based fallback
  if (matched.size === 0) {
    for (const band of t.bands) {
      const domains = BAND_DOMAIN_MAP[band];
      if (domains) domains.forEach(d => matched.add(d));
    }
  }

  // Last resort: COG for neural/cognitive domain, SIL for synthetic
  if (matched.size === 0) {
    const hasSynthetic = t.bands.some(b => b.startsWith('S') || b === 'I0');
    matched.add(hasSynthetic ? 'SIL' : 'COG');
  }

  return Array.from(matched);
}

/** Classify a technique into interaction modes. Returns at least one. */
export function classifyModes(t: ThreatVector): ModeCode[] {
  const text = [t.name, t.description].join(' ');
  const matched = new Set<ModeCode>();

  for (const [code, re] of Object.entries(MODE_KEYWORDS) as [ModeCode, RegExp][]) {
    if (re.test(text)) matched.add(code);
  }

  // Category fallback
  if (matched.size === 0) {
    const fallback = CATEGORY_MODE_MAP[t.category];
    if (fallback) matched.add(fallback);
  }

  if (matched.size === 0) matched.add('D');

  return Array.from(matched);
}

// ═══ Matrix Builder ═══

export type DomainModeMatrix = Record<DomainCode, Record<ModeCode, ThreatVector[]>>;

/** Build the full 12×3 matrix from a list of techniques. */
export function buildMatrix(techniques: ThreatVector[]): DomainModeMatrix {
  const matrix = {} as DomainModeMatrix;
  for (const d of DOMAIN_ORDER) {
    matrix[d] = { R: [], M: [], D: [] };
  }

  for (const t of techniques) {
    const domains = classifyDomains(t);
    const modes = classifyModes(t);
    for (const d of domains) {
      for (const m of modes) {
        matrix[d][m].push(t);
      }
    }
  }

  return matrix;
}
