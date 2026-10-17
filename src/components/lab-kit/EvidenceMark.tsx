import { describeEvidence, type Evidence } from '@/lib/threat-model/evidence-levels';
import EvidenceStepMark from './EvidenceStepMark';
import { shortLabelForEvidence, stepForEvidence } from './evidence-steps';

/** How much is written beside the mark. The full tier name is always in the accessible name. */
export type EvidenceLabelForm = 'full' | 'short' | 'hidden';

interface GlyphProps {
  evidence: Pick<Evidence, 'level' | 'label'>;
  /** "short" is for table columns, where the full tier name would be the widest thing in the row. */
  labelForm?: EvidenceLabelForm;
  /** Hide the words when a neighbouring label already says them. Same as labelForm "hidden". */
  isLabelHidden?: boolean;
  /** True when the mark repeats what its container already states in words, as one of many marks in a cell. */
  isDecorative?: boolean;
}

/** The mark itself, for a legend or a count where the evidence is already worked out. */
export function EvidenceGlyph({ evidence, labelForm = 'full', isLabelHidden = false, isDecorative = false }: GlyphProps) {
  const step = stepForEvidence(evidence);
  if (isDecorative) return <span className="lab-evidence" data-level={evidence.level} data-step={step} aria-hidden="true"><EvidenceStepMark step={step} /></span>;
  const form = isLabelHidden ? 'hidden' : labelForm;
  const accessibleName = `Evidence: ${evidence.label}`;
  return (
    <span className="lab-evidence" data-level={evidence.level} data-step={step} title={form === 'full' ? undefined : evidence.label}>
      <EvidenceStepMark step={step} label={form === 'full' ? undefined : accessibleName} />
      {form === 'full' && <span>{evidence.label}</span>}
      {form === 'short' && <span aria-hidden="true">{shortLabelForEvidence(evidence)}</span>}
    </span>
  );
}

interface Props {
  /** The catalog's evidence tier code, for example "demonstrated_lab"; null when the record has none. */
  tier: string | null;
  /** The legacy one-word status, used only when there is no tier. */
  status: string | null;
  labelForm?: EvidenceLabelForm;
  isLabelHidden?: boolean;
}

/** The one way evidence is drawn: a mark whose solidity grows with certainty, with the catalog's own words. */
export default function EvidenceMark({ tier, status, labelForm = 'full', isLabelHidden = false }: Props) {
  return <EvidenceGlyph evidence={describeEvidence({ evidenceTier: tier, evidenceStatus: status })} labelForm={labelForm} isLabelHidden={isLabelHidden} />;
}
