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
  source: 'ienca-andorno' | 'qif-original';
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

const NEURORIGHT_DEFS: Record<string, { name: string; shortDef: string; source: 'ienca-andorno' | 'qif-original'; color: string }> = {
  MP: {
    name: 'Mental Privacy',
    shortDef: 'Your thoughts are yours. No one should read them without permission.',
    source: 'ienca-andorno',
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
    shortDef: 'Your brain should not be harmed or altered without consent.',
    source: 'ienca-andorno',
    color: '#ef4444',
  },
  PC: {
    name: 'Psychological Continuity',
    shortDef: 'Your sense of self should remain stable. No covert personality changes.',
    source: 'ienca-andorno',
    color: '#f59e0b',
  },
  CA: {
    name: 'Cognitive Authenticity',
    shortDef: 'Your thoughts should be genuinely yours, not implanted or manufactured.',
    source: 'qif-original',
    color: '#10b981',
  },
  DI: {
    name: 'Dynamical Integrity',
    shortDef: 'Your brain\'s natural rhythms and timing should not be disrupted.',
    source: 'qif-original',
    color: '#06b6d4',
  },
  IDA: {
    name: 'Informational Disassociation',
    shortDef: 'Your neural data should not be linked back to you without consent.',
    source: 'qif-original',
    color: '#a855f7',
  },
};

/** Map neurorights to the brain regions they primarily protect */
const NEURORIGHT_BRAIN_MAP: Record<string, string[]> = {
  MP: ['temporal', 'frontal'],
  CL: ['frontal', 'limbic'],
  MI: ['frontal', 'motor', 'limbic', 'temporal'],
  PC: ['limbic', 'frontal'],
  CA: ['frontal', 'temporal'],
  DI: ['motor', 'cerebellum', 'brainstem'],
  IDA: ['temporal', 'occipital'],
};

/** Simplified brain regions for the visualization */
const BRAIN_REGIONS: { id: string; name: string; description: string; bandIds: string[] }[] = [
  { id: 'frontal', name: 'Frontal Cortex', description: 'Executive function, decision-making, personality', bandIds: ['N7'] },
  { id: 'temporal', name: 'Temporal Lobe', description: 'Language, memory, auditory processing', bandIds: ['N7', 'N6'] },
  { id: 'limbic', name: 'Limbic System', description: 'Emotion, memory formation, motivation', bandIds: ['N6'] },
  { id: 'motor', name: 'Motor Cortex', description: 'Voluntary movement, coordination', bandIds: ['N7', 'N5'] },
  { id: 'occipital', name: 'Occipital Lobe', description: 'Visual processing, perception', bandIds: ['N7'] },
  { id: 'cerebellum', name: 'Cerebellum', description: 'Balance, motor learning, timing', bandIds: ['N3'] },
  { id: 'brainstem', name: 'Brainstem', description: 'Vital functions, arousal, reflexes', bandIds: ['N2'] },
];

/** Compute all neurogovernance data from the registrar */
export function getNeurogovernanceData(): NeurogovernanceData {
  const RIGHTS = ['MP', 'CL', 'MI', 'PC', 'CA', 'DI', 'IDA'] as const;

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
