/**
 * Types for the State of BCI Security 2026 report dataset
 * (src/data/intel/state-of-bci-security-2026.json) and the metrics computed from it
 * and from the datalake.
 */

export interface ReportSource {
  id: string;
  ledger_id: string;
  publisher: string;
  date: string;
  url: string;
}

export interface Sourced {
  source_ids: string[];
}

export type RoundDeviceClass = 'implant' | 'non_invasive';

export interface FundingRound extends Sourced {
  company: string;
  amount_usd: number;
  round: string;
  date: string;
  device_class: RoundDeviceClass;
  datalake_trace?: string;
  note?: string;
}

export interface DatedEvent extends Sourced {
  date: string;
  label: string;
  jurisdiction?: string;
}

export interface StagedCve extends Sourced {
  cve_id: string;
  vendor: string;
  product: string;
  published: string;
  cvss31: number;
  cvss40: number;
  device_group: CveDeviceGroup;
  note: string;
}

export type CveDeviceGroup = 'clinical_software' | 'consumer_home';

export type DisclosureStatus = 'found' | 'none_found' | 'not_checked';

export interface DisclosureAuditRow {
  company: string;
  status: DisclosureStatus;
  source_ids?: string[];
}

export interface Correction extends Sourced {
  id: string;
  q1_said: string;
  correct: string;
}

export interface Q1Baseline {
  companies: number;
  funding_total_usd: number;
  funding_companies: number;
  techniques: number;
  techniques_demonstrated_or_confirmed: number;
  mapped_cves: number;
  no_documentation_companies: number;
  q1_cohort_demonstrated_now: number;
  added_since_q1: number;
  added_since_q1_demonstrated: number;
  added_since_q1_theoretical_proposed: number;
  neural_device_cves_reported_in_q1: number;
  neural_device_cves_in_nvd_at_q1: number;
}

export interface ReportData {
  meta: {
    title: string;
    edition: string;
    published: string;
    coverage_start: string;
    coverage_end: string;
    datalake_commit: string;
    posture_last_full_review: string;
    q1_report_url: string;
    contact: { user: string; domain: string };
  };
  sources: ReportSource[];
  rounds_2026: FundingRound[];
  clinical_milestones: DatedEvent[];
  regulatory_clock: DatedEvent[];
  us_state_neural_data_laws: Sourced & { count: number; states: string[]; federal_law: boolean; federal_bill: Sourced & { name: string; status: string } };
  kev_check: Sourced & { catalog_version: string; neural_device_cves_in_kev: number };
  lsl_transport: Sourced & { label: string };
  featured_advisory: Sourced & { cve_id: string; vendor: string; product: string; cvss31: number; advisory: string; quote: string; context: string };
  staged_cves: StagedCve[];
  neural_device_cve_groups: Record<string, string>;
  neural_device_cve_published: Record<string, Sourced & { published: string }>;
  strict_demonstrated_exclusions: { reason: string; technique_ids: string[] };
  corporate_incidents: (DatedEvent & { company: string })[];
  q1_baseline: Q1Baseline;
  corrections: Correction[];
  disclosure_audit: Sourced & { checked_on: string; method: string; limits: string; companies: DisclosureAuditRow[] };
  announcement_audit: Sourced & { checked_on: string; readable: number; mention_device_security: number; not_retrievable: number };
  reproduce_queries: ReproduceQuery[];
}

/** Device classes as the report groups them; the datalake spells non-invasive two ways. */
export type CompanyClass = 'invasive' | 'semi_invasive' | 'non_invasive';

export interface ChannelSplit {
  found: number;
  none_found: number;
  not_checked: number;
}

export interface EvidenceMaturity {
  total: number;
  replicated: number;
  demonstrated: number;
  demonstratedStrict: number;
  demonstratedCase: number;
  demonstratedLab: number;
  theoretical: number;
  speculative: number;
}

export interface NeuralDeviceCve {
  cveId: string;
  vendor: string;
  product: string;
  published: string;
  cvss: number;
  group: CveDeviceGroup;
  isStaged: boolean;
}

export interface ReproduceQuery {
  label: string;
  query: string;
  expected_count: number;
}
