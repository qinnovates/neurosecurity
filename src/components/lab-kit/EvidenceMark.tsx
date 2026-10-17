import { evidenceLabel, evidenceLevelOf } from '@/lib/threat-model/evidence-levels';

interface Props {
  /** Evidence status as the catalog writes it, for example "CONFIRMED". */
  status: string;
  /** Hide the word when a column heading or a neighbouring label already says it. The mark keeps its accessible name. */
  isLabelHidden?: boolean;
}

/** The one way evidence is drawn: a mark that is more solid the stronger the evidence, with the catalog's own word. */
export default function EvidenceMark({ status, isLabelHidden = false }: Props) {
  const label = evidenceLabel(status);
  return (
    <span className="lab-evidence" data-level={evidenceLevelOf(status)}>
      <span className="lab-evidence-mark" role="img" aria-label={isLabelHidden ? `Evidence: ${label}` : undefined} aria-hidden={isLabelHidden ? undefined : true} />
      {!isLabelHidden && <span>{label}</span>}
    </span>
  );
}
