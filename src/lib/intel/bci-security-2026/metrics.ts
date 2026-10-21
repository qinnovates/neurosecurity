/**
 * Headline metrics for the State of BCI Security 2026 report, computed from the
 * datalake (companies, CVE mappings, TARA registrar, VC aggregates) and the report
 * dataset. Nothing here is a hand-typed count.
 */
import landscapeJson from '@shared/bci-landscape.json';
import cveMappingJson from '@shared/cve-technique-mapping.json';
import registrarJson from '@shared/qtara-registrar.json';
import { REPORT } from './report-data';
import type {
  ChannelSplit, CompanyClass, CveDeviceGroup, DisclosureStatus, EvidenceMaturity, FundingRound, NeuralDeviceCve,
} from './types';

interface LandscapeCompany { name: string; type: string; funding_total_usd: number | null; security_posture: string }
interface CveMapping { cve_id: string; product: string; category: string; cvss: { score: number } }
interface RegistrarTechnique { id: string; evidence?: { tier?: string } }
interface VcYear { year: number; deals: number; total_usd: number; source?: string }

const COMPANIES = (landscapeJson as { companies: LandscapeCompany[] }).companies;
const VC_BY_YEAR = (landscapeJson as { market_data: { vc_aggregate_by_year: VcYear[] } }).market_data.vc_aggregate_by_year;
const CVE_MAPPINGS = (cveMappingJson as { mappings: CveMapping[] }).mappings;
const TECHNIQUES = (registrarJson as { techniques: RegistrarTechnique[] }).techniques;

export const NEURAL_DEVICE_CVE_CATEGORY = 'Neural/EEG Systems';
const DEMONSTRATED_TIERS = new Set(['demonstrated_lab', 'demonstrated_case']);
const REPLICATED_TIERS = new Set(['validated_rct', 'validated_replication']);
const LARGEST_HOLDER = 'Neuralink';

export function normalizeCompanyClass(type: string): CompanyClass {
  const normalized = type.replace('-', '_');
  if (normalized === 'invasive' || normalized === 'semi_invasive' || normalized === 'non_invasive') return normalized;
  throw new Error(`State of BCI Security 2026: company type "${type}" in datalake/bci-landscape.json has no report class. Add it to normalizeCompanyClass.`);
}

function auditStatusByCompany(): Map<string, DisclosureStatus> {
  return new Map(REPORT.disclosure_audit.companies.map((row) => [row.company, row.status]));
}

function statusOf(company: LandscapeCompany, statuses: Map<string, DisclosureStatus>): DisclosureStatus {
  const status = statuses.get(company.name);
  if (!status) throw new Error(`State of BCI Security 2026: "${company.name}" is in the datalake but missing from disclosure_audit. Re-run the audit.`);
  return status;
}

const emptySplit = (): ChannelSplit => ({ found: 0, none_found: 0, not_checked: 0 });

export function disclosureByClass(): Record<CompanyClass, ChannelSplit> {
  const statuses = auditStatusByCompany();
  const byClass: Record<CompanyClass, ChannelSplit> = { invasive: emptySplit(), semi_invasive: emptySplit(), non_invasive: emptySplit() };
  for (const company of COMPANIES) byClass[normalizeCompanyClass(company.type)][statusOf(company, statuses)] += 1;
  return byClass;
}

export function sumSplits(splits: ChannelSplit[]): ChannelSplit {
  return splits.reduce((total, split) => ({
    found: total.found + split.found,
    none_found: total.none_found + split.none_found,
    not_checked: total.not_checked + split.not_checked,
  }), emptySplit());
}

/** Tracked funding (company funding_total_usd) split by disclosure-channel status. */
export function capitalByChannel(options: { excludeLargestHolder?: boolean } = {}): ChannelSplit {
  const statuses = auditStatusByCompany();
  const split = emptySplit();
  for (const company of COMPANIES) {
    if (options.excludeLargestHolder && company.name === LARGEST_HOLDER) continue;
    split[statusOf(company, statuses)] += company.funding_total_usd ?? 0;
  }
  return split;
}

export function trackedFunding(): { totalUsd: number; companiesWithFunding: number; largestHolder: string; largestHolderUsd: number } {
  const funded = COMPANIES.filter((company) => (company.funding_total_usd ?? 0) > 0);
  const largest = COMPANIES.find((company) => company.name === LARGEST_HOLDER);
  return {
    totalUsd: funded.reduce((sum, company) => sum + (company.funding_total_usd ?? 0), 0),
    companiesWithFunding: funded.length,
    largestHolder: LARGEST_HOLDER,
    largestHolderUsd: largest?.funding_total_usd ?? 0,
  };
}

export function companyCount(): number {
  return COMPANIES.length;
}

/** Companies whose datalake security_posture field is none_published (last full review: report meta). */
export function postureNonePublishedCount(): number {
  return COMPANIES.filter((company) => company.security_posture === 'none_published').length;
}

export function disclosureLeaders(): string[] {
  return REPORT.disclosure_audit.companies.filter((row) => row.status === 'found').map((row) => row.company);
}

export function evidenceMaturity(): EvidenceMaturity {
  const tiers = TECHNIQUES.map((technique) => technique.evidence?.tier ?? 'unknown');
  const excluded = new Set(REPORT.strict_demonstrated_exclusions.technique_ids);
  const demonstrated = TECHNIQUES.filter((technique) => DEMONSTRATED_TIERS.has(technique.evidence?.tier ?? ''));
  const count = (tier: string): number => tiers.filter((value) => value === tier).length;
  return {
    total: TECHNIQUES.length,
    replicated: tiers.filter((tier) => REPLICATED_TIERS.has(tier)).length,
    demonstrated: demonstrated.length,
    demonstratedStrict: demonstrated.filter((technique) => !excluded.has(technique.id)).length,
    demonstratedCase: count('demonstrated_case'),
    demonstratedLab: count('demonstrated_lab'),
    theoretical: count('theoretical_proposed') + count('theoretical_modeled'),
    speculative: count('speculative'),
  };
}

function cveGroup(product: string): { vendor: string; group: CveDeviceGroup } {
  const vendor = Object.keys(REPORT.neural_device_cve_groups).find((prefix) => product.startsWith(prefix));
  if (!vendor) throw new Error(`State of BCI Security 2026: no device group for neural-device CVE product "${product}". Add its vendor to neural_device_cve_groups.`);
  return { vendor, group: REPORT.neural_device_cve_groups[vendor] as CveDeviceGroup };
}

function publishedDate(cveId: string): string {
  const entry = REPORT.neural_device_cve_published[cveId];
  if (!entry) throw new Error(`State of BCI Security 2026: no NVD publication date recorded for ${cveId}. Add it to neural_device_cve_published.`);
  return entry.published;
}

/** Neural-device CVEs: the datalake's mapped rows plus verified CVEs staged for mapping. */
export function neuralDeviceCves(): NeuralDeviceCve[] {
  const mapped = CVE_MAPPINGS.filter((row) => row.category === NEURAL_DEVICE_CVE_CATEGORY).map((row) => ({
    cveId: row.cve_id, product: row.product, published: publishedDate(row.cve_id), cvss: row.cvss.score, isStaged: false, ...cveGroup(row.product),
  }));
  const staged = REPORT.staged_cves.map((row) => ({
    cveId: row.cve_id, vendor: row.vendor, product: row.product, published: row.published, cvss: row.cvss31, group: row.device_group, isStaged: true,
  }));
  return [...mapped, ...staged].sort((a, b) => a.published.localeCompare(b.published));
}

export function roundsSummary(): { rounds: FundingRound[]; totalUsd: number; topFourShare: number; implantShare: number } {
  const rounds = [...REPORT.rounds_2026].sort((a, b) => b.amount_usd - a.amount_usd);
  const totalUsd = rounds.reduce((sum, round) => sum + round.amount_usd, 0);
  const topFour = rounds.slice(0, 4).reduce((sum, round) => sum + round.amount_usd, 0);
  const implant = rounds.filter((round) => round.device_class === 'implant').reduce((sum, round) => sum + round.amount_usd, 0);
  return { rounds, totalUsd, topFourShare: topFour / totalUsd, implantShare: implant / totalUsd };
}

export function vcByYear(): VcYear[] {
  return [...VC_BY_YEAR].sort((a, b) => a.year - b.year);
}

/** Tracked 2026 round recipients that are also in the company tracker, with their audit status. */
export function trackedRoundRecipients(): { company: string; status: DisclosureStatus }[] {
  const statuses = auditStatusByCompany();
  return REPORT.rounds_2026.flatMap((round) => {
    const status = statuses.get(round.company);
    return status ? [{ company: round.company, status }] : [];
  });
}
