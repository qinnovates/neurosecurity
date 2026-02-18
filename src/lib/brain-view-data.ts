/**
 * Brain View Data — prepares all 3 views (Security, Clinical, Governance)
 * for the unified BrainVisualization component.
 *
 * All computation happens at build time (Astro frontmatter).
 * The component receives pre-computed view data as props.
 */

import { THREAT_VECTORS, getClinicalTechniques } from './threat-data';
import type { ThreatVector, CategoryId } from './threat-data';
import { getNeurogovernanceData } from './neurogovernance-data';

// ═══ Shared Types ═══

export interface BrainViewRegion {
  id: string;
  name: string;
  description: string;
  color: string;
  intensity: number;
  stat: { label: string; value: string };
  badges: { label: string; color: string }[];
  details: { id: string; label: string; href: string; color: string }[];
}

export interface BrainView {
  id: string;
  label: string;
  icon: 'shield' | 'heart' | 'scale';
  accentColor: string;
  regions: BrainViewRegion[];
}

// ═══ Brain Region definitions (shared across all views) ═══

const BRAIN_REGIONS = [
  { id: 'N7', name: 'Neocortex', description: 'PFC, M1, V1, Broca, Wernicke — executive function, language, movement, perception' },
  { id: 'N6', name: 'Limbic System', description: 'Hippocampus, amygdala, insula — emotion, memory, interoception' },
  { id: 'N5', name: 'Basal Ganglia', description: 'Striatum, STN, substantia nigra — motor selection, reward, habit' },
  { id: 'N4', name: 'Diencephalon', description: 'Thalamus, hypothalamus — sensory gating, consciousness relay' },
  { id: 'N3', name: 'Cerebellum', description: 'Cerebellar cortex, deep nuclei — motor coordination, timing' },
  { id: 'N2', name: 'Brainstem', description: 'Medulla, pons, midbrain — vital functions, arousal, reflexes' },
  { id: 'N1', name: 'Spinal Cord', description: 'Cervical through sacral — reflexes, peripheral relay' },
] as const;

// ═══ Clinical domain definitions (reused from therapeutics page) ═══

const CLINICAL_DOMAINS = [
  { id: 'movement', label: 'Movement & Motor', color: '#22c55e', keywords: ['parkinson', 'tremor', 'dystonia', 'motor', 'paralysis', 'spinal cord', 'stroke', 'gait', 'spasticity', 'tetraplegia', 'limb prosth', 'multiple sclerosis motor', 'balance', 'movement disorder', 'FES'] },
  { id: 'seizure', label: 'Seizure & Epilepsy', color: '#ef4444', keywords: ['epilepsy', 'seizure', 'excitab', 'status epilepticus'] },
  { id: 'mood', label: 'Mood & Affective', color: '#f59e0b', keywords: ['depress', 'anxiety', 'PTSD', 'OCD', 'bipolar', 'substance', 'mood', 'suicidal', 'addiction', 'stress', 'dissociative', 'depersonalization', 'body dysmorphia', 'catatonia', 'psychedelic'] },
  { id: 'cognitive', label: 'Cognitive & Neurodev', color: '#8b5cf6', keywords: ['ADHD', 'attention', 'dementia', 'alzheimer', 'autism', 'cognitive', 'memory', 'learning', 'schizophren', 'concussion', 'traumatic brain', 'working memory', 'MCI', 'meditation', 'fatigue', 'brain tumor', 'connectome', 'presurgical', 'intraoperative', 'anesthesia'] },
  { id: 'pain', label: 'Pain & Somatosensory', color: '#06b6d4', keywords: ['pain', 'phantom', 'tinnitus', 'neuropath', 'somatosens', 'migraine'] },
  { id: 'sleep', label: 'Sleep & Circadian', color: '#3b82f6', keywords: ['sleep', 'insomnia', 'narcolepsy', 'circadian'] },
  { id: 'comms', label: 'Communication & Rehab', color: '#10b981', keywords: ['locked-in', 'aphasia', 'dysarthria', 'communication', 'ALS', 'speech', 'laryngectomy'] },
] as const;

function matchClinicalDomains(conditions: string[]): string[] {
  const joined = conditions.join(' ').toLowerCase();
  const matched: string[] = [];
  for (const domain of CLINICAL_DOMAINS) {
    if (domain.keywords.some(kw => joined.includes(kw.toLowerCase()))) {
      matched.push(domain.id);
    }
  }
  return matched;
}

// ═══ Category labels for security badges ═══

const CATEGORY_LABELS: Record<string, string> = {
  SI: 'Signal Injection',
  SE: 'Signal Eavesdrop',
  DM: 'Data Manipulation',
  DS: 'Denial of Service',
  PE: 'Privilege Escalation',
  CI: 'Cognitive Integrity',
  PS: 'Physical Safety',
  EX: 'Data Exfiltration',
};

const CATEGORY_COLORS: Record<string, string> = {
  SI: '#ef4444', SE: '#f59e0b', DM: '#eab308', DS: '#94a3b8',
  PE: '#a855f7', CI: '#8b5cf6', PS: '#ec4899', EX: '#06b6d4',
};

// ═══ View builders ═══

function getThreatsForRegion(regionId: string): ThreatVector[] {
  return THREAT_VECTORS.filter(t => t.bands.includes(regionId as any));
}

function buildSecurityView(): BrainView {
  const regions: BrainViewRegion[] = BRAIN_REGIONS.map(region => {
    const threats = getThreatsForRegion(region.id);
    const count = threats.length;

    // Color by severity — red / orange / yellow (consistent across all views)
    const color =
      count >= 60 ? '#ef4444'
      : count >= 30 ? '#f97316'
      : '#eab308';

    // Collect unique attack categories
    const catSet = new Set<string>();
    for (const t of threats) catSet.add(t.category);
    const badges = Array.from(catSet).map(cat => ({
      label: cat,
      color: CATEGORY_COLORS[cat] ?? '#94a3b8',
    }));

    // Top 5 by NISS severity
    const top5 = [...threats]
      .sort((a, b) => b.niss.score - a.niss.score)
      .slice(0, 5);

    const severityColors: Record<string, string> = {
      critical: '#ef4444', high: '#f59e0b', medium: '#eab308', low: '#94a3b8',
    };

    return {
      id: region.id,
      name: region.name,
      description: region.description,
      color,
      intensity: Math.min(1, count / 80),
      stat: { label: 'threats', value: String(count) },
      badges,
      details: top5.map(t => ({
        id: t.id,
        label: t.name,
        href: `/TARA/${t.id}/`,
        color: severityColors[t.severity] ?? '#94a3b8',
      })),
    };
  });

  return { id: 'security', label: 'Security', icon: 'shield', accentColor: '#ef4444', regions };
}

function buildClinicalView(): BrainView {
  const clinical = getClinicalTechniques();

  const regions: BrainViewRegion[] = BRAIN_REGIONS.map(region => {
    // Clinical techniques that affect this band
    const regionClinical = clinical.filter(t => t.bands.includes(region.id as any));
    const count = regionClinical.length;

    // Find which clinical domains are represented
    const domainCounts = new Map<string, number>();
    for (const t of regionClinical) {
      const domains = matchClinicalDomains(t.tara?.clinical?.conditions ?? []);
      for (const d of domains) {
        domainCounts.set(d, (domainCounts.get(d) ?? 0) + 1);
      }
    }

    // Color by therapy count — red / orange / yellow (consistent across all views)
    const color =
      count >= 50 ? '#ef4444'
      : count >= 25 ? '#f97316'
      : '#eab308';

    // Badges = domains present
    const badges = Array.from(domainCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([domId]) => {
        const def = CLINICAL_DOMAINS.find(d => d.id === domId);
        return { label: def?.label ?? domId, color: def?.color ?? '#94a3b8' };
      });

    // Top 5 by evidence tier
    const evidenceOrder: Record<string, number> = {
      meta_analysis: 1, RCT: 2, cohort: 3, case_series: 4, preclinical: 5, theoretical: 6, 'N/A': 7,
    };
    const top5 = [...regionClinical]
      .sort((a, b) => (evidenceOrder[a.tara?.clinical?.evidence_level ?? 'N/A'] ?? 7) - (evidenceOrder[b.tara?.clinical?.evidence_level ?? 'N/A'] ?? 7))
      .slice(0, 5);

    const evidenceColors: Record<string, string> = {
      meta_analysis: '#10b981', RCT: '#22c55e', cohort: '#06b6d4',
      case_series: '#f59e0b', preclinical: '#a855f7', theoretical: '#94a3b8',
    };

    return {
      id: region.id,
      name: region.name,
      description: region.description,
      color,
      intensity: Math.min(1, count / 50),
      stat: { label: 'therapies', value: String(count) },
      badges,
      details: top5.map(t => ({
        id: t.id,
        label: t.tara?.clinical?.therapeutic_analog ?? t.name,
        href: `/TARA/${t.id}/`,
        color: evidenceColors[t.tara?.clinical?.evidence_level ?? 'N/A'] ?? '#94a3b8',
      })),
    };
  });

  return { id: 'clinical', label: 'Clinical', icon: 'heart', accentColor: '#10b981', regions };
}

function buildGovernanceView(): BrainView {
  const govData = getNeurogovernanceData();

  const NEURORIGHT_COLORS: Record<string, string> = {
    MP: '#3b82f6', CL: '#8b5cf6', MI: '#ef4444', PC: '#f59e0b', CA: '#10b981',
  };
  const NEURORIGHT_NAMES: Record<string, string> = {
    MP: 'Mental Privacy', CL: 'Cognitive Liberty', MI: 'Mental Integrity',
    PC: 'Psychological Continuity', CA: 'Cognitive Authenticity',
  };

  const regions: BrainViewRegion[] = govData.brainRegions.map(region => {
    const count = region.threatCount;

    // Color by threat count — red / orange / yellow (consistent across all views)
    const color =
      count >= 60 ? '#ef4444'
      : count >= 30 ? '#f97316'
      : '#eab308';

    // Badges = neurorights protecting this region
    const badges = region.neurorights.map(nrId => ({
      label: NEURORIGHT_NAMES[nrId] ?? nrId,
      color: NEURORIGHT_COLORS[nrId] ?? '#94a3b8',
    }));

    // Details = neurorights with links
    const details = region.neurorights.map(nrId => ({
      id: nrId,
      label: NEURORIGHT_NAMES[nrId] ?? nrId,
      href: '/neurogovernance/#rights',
      color: NEURORIGHT_COLORS[nrId] ?? '#94a3b8',
    }));

    // Find the matching region description from our static definitions
    const staticRegion = BRAIN_REGIONS.find(r => r.id === region.id);

    return {
      id: region.id,
      name: region.name,
      description: staticRegion?.description ?? region.description,
      color,
      intensity: Math.min(1, count / 80),
      stat: { label: 'techniques target this region', value: String(count) },
      badges,
      details,
    };
  });

  return { id: 'governance', label: 'Governance', icon: 'scale', accentColor: '#8b5cf6', regions };
}

// ═══ Main export ═══

export function getBrainViewData(): BrainView[] {
  return [
    buildSecurityView(),
    buildClinicalView(),
    buildGovernanceView(),
  ];
}
