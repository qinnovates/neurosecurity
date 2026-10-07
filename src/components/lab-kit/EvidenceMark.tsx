import { describeEvidence, type Evidence } from '@/lib/threat-model/evidence-levels';

interface GlyphProps {
  evidence: Pick<Evidence, 'level' | 'label'>;
  /** Hide the words when a neighbouring label already says them. The mark keeps its accessible name. */
  isLabelHidden?: boolean;
  /** True when the mark repeats what its container already states in words, as one of many marks in a cell. */
  isDecorative?: boolean;
}

/** The mark itself, for a legend or a count where the evidence is already worked out. */
export function EvidenceGlyph({ evidence, isLabelHidden = false, isDecorative = false }: GlyphProps) {
  if (isDecorative) return <span className="lab-evidence" data-level={evidence.level} aria-hidden="true"><span className="lab-evidence-mark" /></span>;
  return (
    <span className="lab-evidence" data-level={evidence.level}>
      <span className="lab-evidence-mark" role="img" aria-label={isLabelHidden ? `Evidence: ${evidence.label}` : undefined} aria-hidden={isLabelHidden ? undefined : true} />
      {!isLabelHidden && <span>{evidence.label}</span>}
    </span>
  );
}

interface Props {
  /** The catalog's evidence tier code, for example "demonstrated_lab"; null when the record has none. */
  tier: string | null;
  /** The legacy one-word status, used only when there is no tier. */
  status: string | null;
  isLabelHidden?: boolean;
}

/** The one way evidence is drawn: a mark that is more solid the stronger the evidence, with the catalog's own words. */
export default function EvidenceMark({ tier, status, isLabelHidden = false }: Props) {
  return <EvidenceGlyph evidence={describeEvidence({ evidenceTier: tier, evidenceStatus: status })} isLabelHidden={isLabelHidden} />;
}
