import type { EvidenceCount } from '@/lib/threat-model/evidence-levels';
import { EvidenceGlyph } from './EvidenceMark';

interface Props {
  /** One entry per evidence value, strongest first. */
  counts: readonly EvidenceCount[];
  /** What is being counted, for the accessible summary: "techniques", "techniques placed on this device". */
  subject: string;
  /** Leave out the list under the bar where space is tight and the bar is explained nearby. */
  isLegendHidden?: boolean;
}

/**
 * A set of techniques split by how strongly each is evidenced. Segments use the same
 * solidity as the evidence mark and re-size in place when the set changes.
 */
export default function EvidenceBar({ counts, subject, isLegendHidden = false }: Props) {
  const total = counts.reduce((sum, entry) => sum + entry.count, 0);
  const summary = counts.map((entry) => `${entry.count} ${entry.label}`).join(', ');
  return (
    <div className="lab-evidence-bar">
      <div className="lab-evidence-track" role="img" aria-label={total === 0 ? `No ${subject}.` : `${total} ${subject}: ${summary}.`}>
        {counts.filter((entry) => entry.count > 0).map((entry) => (
          <span key={entry.label} className="lab-evidence-segment" data-level={entry.level} style={{ flexGrow: entry.count }} title={`${entry.label}: ${entry.count}`} />
        ))}
      </div>
      {!isLegendHidden && (
        <ul className="lab-evidence-legend">
          {counts.map((entry) => (
            <li key={entry.label}><span className="lab-figure">{entry.count}</span> <EvidenceGlyph evidence={entry} /></li>
          ))}
        </ul>
      )}
    </div>
  );
}
