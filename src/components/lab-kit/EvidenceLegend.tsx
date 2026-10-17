import type { ReactNode } from 'react';
import type { EvidenceCount } from '@/lib/threat-model/evidence-levels';
import EvidenceStepMark from './EvidenceStepMark';
import Legend, { type LegendItem } from './Legend';
import { EVIDENCE_STEP_SHORT_LABELS, EVIDENCE_STEPS, countByEvidenceStep, tierNamesForStep } from './evidence-steps';

interface Props {
  /** Counts by evidence value for the set on screen. When given, every step prints its integer, zero included. */
  counts?: readonly EvidenceCount[];
  /** Leave out the full tier names where the legend sits in a tight row. */
  isCompact?: boolean;
  note?: ReactNode;
}

/** All seven evidence marks, strongest first, with the short word and the catalog's tier names. */
export default function EvidenceLegend({ counts, isCompact = false, note }: Props) {
  const countByStep = counts === undefined ? null : countByEvidenceStep(counts);
  const items: LegendItem[] = EVIDENCE_STEPS.map((step) => {
    const shortLabel = EVIDENCE_STEP_SHORT_LABELS[step];
    const tierNames = tierNamesForStep(step).filter((name) => name !== shortLabel);
    return {
      id: step,
      mark: <EvidenceStepMark step={step} />,
      name: shortLabel,
      detail: isCompact || tierNames.length === 0 ? undefined : tierNames.join('; '),
      count: countByStep?.[step],
    };
  });
  return <Legend label="Evidence marks" items={items} isStacked={!isCompact} note={note} />;
}
