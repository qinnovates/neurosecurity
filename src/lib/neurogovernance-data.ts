/**
 * Neurogovernance Data — transforms registrar JSON into visualization-ready structures.
 * All computation happens at build time (Astro frontmatter). React components receive pre-computed props.
 */

import registry from '@shared/qtara-registrar.json';
import { HOURGLASS_BANDS } from './qif-constants';

const techniques = (registry as any).techniques ?? [];

/** Neuroright metadata */
export interface NeurorightInfo {
  id: string;
  name: string;
  shortDef: string;
  source: 'ienca-andorno' | 'qif-extended';
  color: string;
  brainRegions: string[];
  threatCount: number;
  cciMean: number;
  topThreats: { id: string; name: string; severity: string; cci: number }[];
}

/** Brain region with associated neurorights */
export interface BrainRegion {
  id: string;
  name: string;
  description: string;
  neurorights: string[];
  threatCount: number;
}

/** Full page data payload */
export interface NeurogovernanceData {
  neurorights: NeurorightInfo[];
  brainRegions: BrainRegion[];
  stats: {
    totalRights: number;
    totalThreats: number;
    totalMapped: number;
    cciMean: number;
    cciMax: number;
    highCciCount: number;
  };
}

const NEURORIGHT_DEFS: Record<string, { name: string; shortDef: string; source: 'ienca-andorno' | 'qif-extended'; color: string }> = {
  MP: {
    name: 'Mental Privacy',
    shortDef: 'Your thoughts are yours. No one should read, store, or re-link them without permission.',
    source: 'qif-extended',
    color: '#3b82f6',
  },
  CL: {
    name: 'Cognitive Liberty',
    shortDef: 'You decide what enters your mind. No forced stimulation or suppression.',
    source: 'ienca-andorno',
    color: '#8b5cf6',
  },
  MI: {
    name: 'Mental Integrity',
    shortDef: 'Your brain should not be harmed, altered, or have its natural rhythms disrupted without consent.',
    source: 'qif-extended',
    color: '#ef4444',
  },
  PC: {
    name: 'Psychological Continuity',
    shortDef: 'Your sense of self should remain stable. No covert personality changes.',
    source: 'ienca-andorno',
    color: '#f59e0b',
  },
};

/** Map neurorights to QIF bands they primarily protect */
const NEURORIGHT_BRAIN_MAP: Record<string, string[]> = {
  MP: ['N7', 'N6', 'N1'],           // thoughts + data linkage (absorbs IDA)
  CL: ['N7', 'N6', 'N4'],           // cognition spans cortex, limbic, thalamic gating
  MI: ['N7', 'N6', 'N5', 'N4', 'N3', 'N2', 'N1'], // integrity + dynamics + authenticity across all layers
  PC: ['N6', 'N7'],                  // identity rooted in limbic + cortex
};

/** QIF neural bands as brain regions — 1:1 with the hourglass model */
const BRAIN_REGIONS: { id: string; name: string; description: string; bandIds: string[] }[] = [
  { id: 'N7', name: 'Neocortex', description: 'PFC, M1, V1, Broca, Wernicke — executive function, language, movement, perception', bandIds: ['N7'] },
  { id: 'N6', name: 'Limbic System', description: 'Hippocampus, amygdala, insula — emotion, memory, interoception', bandIds: ['N6'] },
  { id: 'N5', name: 'Basal Ganglia', description: 'Striatum, STN, substantia nigra — motor selection, reward, habit', bandIds: ['N5'] },
  { id: 'N4', name: 'Diencephalon', description: 'Thalamus, hypothalamus — sensory gating, consciousness relay', bandIds: ['N4'] },
  { id: 'N3', name: 'Cerebellum', description: 'Cerebellar cortex, deep nuclei — motor coordination, timing', bandIds: ['N3'] },
  { id: 'N2', name: 'Brainstem', description: 'Medulla, pons, midbrain — vital functions, arousal, reflexes', bandIds: ['N2'] },
  { id: 'N1', name: 'Spinal Cord', description: 'Cervical through sacral — reflexes, peripheral relay', bandIds: ['N1'] },
];

/** Compute all neurogovernance data from the registrar */
export function getNeurogovernanceData(): NeurogovernanceData {
  const RIGHTS = ['MP', 'CL', 'MI', 'PC'] as const;

  // Collect per-right technique data
  const rightTechniques: Record<string, any[]> = {};
  for (const r of RIGHTS) rightTechniques[r] = [];

  for (const t of techniques) {
    const nr = t?.neurorights;
    if (!nr?.affected) continue;
    for (const r of nr.affected) {
      if (rightTechniques[r]) {
        rightTechniques[r].push({
          id: t.id,
          name: t.attack,
          severity: t.severity,
          cci: nr.cci ?? 0,
        });
      }
    }
  }

  // Build neuroright info
  const neurorights: NeurorightInfo[] = RIGHTS.map(r => {
    const def = NEURORIGHT_DEFS[r];
    const techs = rightTechniques[r];
    const ccis = techs.map(t => t.cci);
    const sorted = [...techs].sort((a, b) => b.cci - a.cci);

    return {
      id: r,
      name: def.name,
      shortDef: def.shortDef,
      source: def.source,
      color: def.color,
      brainRegions: NEURORIGHT_BRAIN_MAP[r] ?? [],
      threatCount: techs.length,
      cciMean: ccis.length > 0 ? Math.round(ccis.reduce((a, b) => a + b, 0) / ccis.length * 100) / 100 : 0,
      topThreats: sorted.slice(0, 3),
    };
  });

  // Build brain region data
  const brainRegions: BrainRegion[] = BRAIN_REGIONS.map(region => {
    const associatedRights = RIGHTS.filter(r => NEURORIGHT_BRAIN_MAP[r]?.includes(region.id));
    // Count techniques that affect bands in this region
    const regionThreats = new Set<string>();
    for (const t of techniques) {
      const bandIds: string[] = t.band_ids ?? [];
      if (bandIds.some(b => region.bandIds.includes(b))) {
        regionThreats.add(t.id);
      }
    }

    return {
      id: region.id,
      name: region.name,
      description: region.description,
      neurorights: associatedRights,
      threatCount: regionThreats.size,
    };
  });

  // Aggregate stats
  const allCci = techniques.map((t: any) => t?.neurorights?.cci ?? 0).filter((c: number) => c > 0);
  const stats = {
    totalRights: RIGHTS.length,
    totalThreats: techniques.length,
    totalMapped: techniques.filter((t: any) => t?.neurorights?.affected?.length > 0).length,
    cciMean: allCci.length > 0 ? Math.round(allCci.reduce((a: number, b: number) => a + b, 0) / allCci.length * 100) / 100 : 0,
    cciMax: allCci.length > 0 ? Math.max(...allCci) : 0,
    highCciCount: allCci.filter((c: number) => c > 2.0).length,
  };

  return { neurorights, brainRegions, stats };
}
