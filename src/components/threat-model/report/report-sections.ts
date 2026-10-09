import { CHECKLIST_TITLE } from '@/lib/threat-model/compliance-us';
import type { ArchitectureView } from '@/lib/threat-model/report-types';

/** The report's numbered sections, in the order they are printed. The title block comes before them and has no number. */
export const REPORT_SECTIONS = [
  { id: 'overview', title: 'Overview summary' },
  { id: 'system', title: 'System as modelled' },
  { id: 'scope', title: 'Scope, stated with reasons' },
  { id: 'register', title: 'Risk register' },
  { id: 'architecture', title: 'Security architecture views' },
  { id: 'chains', title: 'Attack chain hypotheses' },
  { id: 'checklist', title: CHECKLIST_TITLE },
  { id: 'cves', title: 'CVEs in other products' },
] as const;

export type ReportSectionId = typeof REPORT_SECTIONS[number]['id'];

/** "4. Risk register": the section's place in the order, then its title. */
export function headingFor(sectionId: ReportSectionId): string {
  const position = REPORT_SECTIONS.findIndex((section) => section.id === sectionId);
  return `${position + 1}. ${REPORT_SECTIONS[position].title}`;
}

export const VIEW_LABELS: Record<ArchitectureView, string> = {
  global_system: 'Global system view',
  multi_patient_harm: 'Multi-patient harm view',
  updateability: 'Updateability and patchability view',
  security_use_case: 'Security use case view',
};

const NOT_RECORDED = 'Not recorded';
const ISO_MINUTE_PATTERN = /^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})/;

/** The moment the report was generated, to the minute, from the ISO text the engine was given. */
export function formatGeneratedAt(generatedAt: string): string {
  const match = generatedAt.match(ISO_MINUTE_PATTERN);
  return match === null ? NOT_RECORDED : `${match[1]} ${match[2]} UTC`;
}

/** A code from the model shown as written, with its underscores as spaces. */
export function wordsOf(code: string): string {
  return code.replaceAll('_', ' ');
}
