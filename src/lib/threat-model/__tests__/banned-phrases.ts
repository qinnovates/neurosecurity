/**
 * Phrases that must not reach a reader of the Lab, each with the rule it would break.
 * The guard test scans the Lab's source for them. An exception is a place where the phrase
 * is allowed to stand; the count is asserted, so adding one is a visible change to this file.
 */

export interface BannedPhrase {
  pattern: RegExp;
  /** The standing rule the phrase would break. */
  rule: string;
  /** How many times the phrase may appear across the scanned files. */
  allowedOccurrences: number;
}

export const BANNED_PHRASES: readonly BannedPhrase[] = [
  { pattern: /detection rate/gi, rule: 'The Lab is not a detection system and has measured no rate.', allowedOccurrences: 0 },
  { pattern: /false positive rate/gi, rule: 'The Lab is not a detection system and has measured no rate.', allowedOccurrences: 0 },
  { pattern: /detectab/gi, rule: 'How easily a step is noticed is not graded; the catalog note is shown as written.', allowedOccurrences: 0 },
  { pattern: /neuro-?surveillance/gi, rule: 'Two CVE descriptions were reworded with this term; CVE descriptions are not printed.', allowedOccurrences: 0 },
  { pattern: /\bcompliant\b/gi, rule: 'The checklist never says a device is compliant.', allowedOccurrences: 0 },
  { pattern: /suggested controls/gi, rule: 'The catalog holds no control for an individual technique.', allowedOccurrences: 0 },
  { pattern: /weaker evidence/gi, rule: 'A technique with no placement decision has not been graded as weaker.', allowedOccurrences: 0 },
  { pattern: /precedent cves/gi, rule: 'Linked CVEs are headed as found in other products.', allowedOccurrences: 0 },
];

/** Total exceptions across the list, asserted so the list cannot loosen unnoticed. */
export const EXPECTED_EXCEPTION_COUNT = 0;

/** Directories whose source can put words in front of a reader of the Lab. */
export const SCANNED_DIRECTORIES: readonly string[] = [
  'src/components/workbench', 'src/components/explore', 'src/components/threat-model', 'src/components/monitor',
  'src/components/query', 'src/components/lab-kit', 'src/lib/threat-model',
];
