import type { EvidenceCount } from '@/lib/threat-model/evidence-levels';
import { EvidenceGlyph } from './EvidenceMark';

interface Props {
  /** One entry per evidence value, strongest first. */
  counts: readonly EvidenceCount[];
  /** What is being counted, for the accessible summary: "techniques", "techniques placed on this device". */
  subject: string;
}

/**
 * A set of techniques tallied by how strongly each is evidenced: an integer, the mark and
 * the short tier word. The integers are exact; no bar is drawn, because widths cannot be
 * read as counts.
 */
export default function EvidenceBar({ counts, subject }: Props) {
  const total = counts.reduce((sum, entry) => sum + entry.count, 0);
  const summary = counts.map((entry) => `${entry.count} ${entry.label}`).join(', ');
  return (
    <ul className="lab-evidence-legend" aria-label={total === 0 ? `No ${subject}.` : `${total} ${subject}: ${summary}.`}>
      {counts.map((entry) => (
        <li key={entry.label}><span className="lab-figure">{entry.count}</span> <EvidenceGlyph evidence={entry} labelForm="short" /></li>
      ))}
    </ul>
  );
}
