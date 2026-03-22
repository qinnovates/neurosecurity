/**
 * Universal KQL Table Builder — the QIF Data Lake query layer.
 *
 * ALL dashboards consume data through this single interface.
 * JSON files in shared/ are the storage layer. This file flattens them
 * into queryable KQL tables. Add a new JSON → add its table builder here
 * → it appears in every dashboard automatically.
 *
 * Architecture:
 *   shared/*.json  →  kql-tables.ts (build time)  →  BciKql.tsx (browser)
 *                                                  →  ClinicalDashboard.tsx
 *                                                  →  AtlasDashboard.tsx
 *                                                  →  data-lake.astro
 */

// ═══ Imports: Storage Layer ═══
// Core anatomy & threats
import atlasRaw from '@shared/qif-brain-bci-atlas.json';
import registrarRaw from '@shared/qtara-registrar.json';
import pathwaysRaw from '@shared/qif-neural-pathways.json';
import neurotransmitterRaw from '@shared/qif-neurotransmitters.json';
import dsmRaw from '@shared/qif-dsm-mappings.json';
import neuroRaw from '@shared/qif-neurological-mappings.json';

// Devices & industry
import landscapeRaw from '@shared/bci-landscape.json';
import cveRaw from '@shared/cve-technique-mapping.json';

// Governance & security
import ethicsRaw from '@shared/qif-ethics-controls.json';
import controlsRaw from '@shared/qif-security-controls.json';
import guardrailsRaw from '@shared/qif-guardrails.json';
import scoresRaw from '@shared/neurosecurity-scores.json';

// Additional sources (site data + docs)
import timelineRaw from '@/data/qif-timeline.json';
import newsRaw from '@/data/external-news-cache.json';
import validationRaw from '@shared/validation-registry.json';
import automationRaw from '@/data/automation-registry.json';
import hardwareRaw from '../../site/bci-hardware-inventory.json';
import intelFeedRaw from '@/data/bci-intel-feed.json';
import intelSourcesRaw from '@/data/intel-sources.json';

// Research & derivation
import registryRaw from '@shared/research-registry.json';
import derivationTimelineRaw from '@shared/derivation-timeline.json';

// Extended neuroscience data
import cranialNervesRaw from '@shared/qif-cranial-nerves.json';
import neuroendocrineRaw from '@shared/qif-neuroendocrine.json';
import glialRaw from '@shared/qif-glial-cells.json';
import neurovascularRaw from '@shared/qif-neurovascular.json';
import receptorsRaw from '@shared/qif-receptors.json';

// NeuroSIM simulation data
import neurosimRaw from '@shared/qif-neurosim.json';

// EEG sample registry
import eegSamplesRaw from '@shared/eeg-samples.json';

// Precomputed tables (eliminates O(n⁴) build-time computation)
import impactChainsRaw from '@shared/impact-chains.json';

// ═══ Types ═══

export type Row = Record<string, unknown>;
export type KqlTables = Record<string, Row[]>;

export interface DataLakeStats {
  totalTables: number;
  totalRows: number;
  byTable: Record<string, number>;
  // Summary counts
  techniques: number;
  regions: number;
  pathways: number;
  neurotransmitters: number;
  receptorFamilies: number;
  cranialNerves: number;
  neuroendocrineAxes: number;
  glialCellTypes: number;
  dsmConditions: number;
  neurologicalConditions: number;
  companies: number;
  devices: number;
  neuronTypes: number;
  oscillationBands: number;
  whiteMatterTracts: number;
  eegElectrodes: number;
}

// ═══ Helpers ═══

const atlas = atlasRaw as any;
const registrar = registrarRaw as any;
const landscape = landscapeRaw as any;
const dsm = dsmRaw as any;
const ethics = ethicsRaw as any;
const cve = cveRaw as any;
const controls = controlsRaw as any;
const pathways = pathwaysRaw as any;
const ntData = neurotransmitterRaw as any;
const timeline = timelineRaw as any;
const news = newsRaw as any;
const validation = validationRaw as any;
const automation = automationRaw as any;
const hardware = hardwareRaw as any;
const intelFeed = intelFeedRaw as any;
const intelSources = intelSourcesRaw as any;
const registry = registryRaw as any;
const derivationTimeline = derivationTimelineRaw as any;
const neuro = neuroRaw as any;
const neurosim = neurosimRaw as any;

/** Refang a defanged URL */
function refangUrl(url: string): string {
  if (!url) return '';
  return url
    .replace(/^hxxps:\/\//i, 'https://')
    .replace(/^hxxp:\/\//i, 'http://')
    .replace(/\[\.]/g, '.');
}

// ═══ Table Builders ═══
// Each function returns Row[]. Tables are named by convention.
// Dynamic pattern: if source data is null/empty, table is omitted.

function buildBrainRegions(): Row[] {
  return (atlas.brain_regions || []).map((r: any) => ({
    id: r.id,
    name: r.name,
    abbreviation: r.abbreviation || r.id,
    qif_band: r.qif_band || '',
    parent_structure: r.parent_structure || '',
    depth_class: r.depth_class || '',
    function: r.function || r.primary_function || '',
    response_latency_ms: r.response_latency_ms?.value ?? r.response_latency_ms ?? '',
    connections: (r.connections || []).join(', '),
  }));
}

function buildHourglassBands(): Row[] {
  return (atlas.qif_bands || []).map((b: any) => ({
    id: b.id,
    name: b.name,
    zone: b.zone,
    determinacy: b.determinacy || '',
    qi_range: (b.qi_range || []).join('-'),
    severity_if_compromised: b.severity_if_compromised || '',
  }));
}

function parseNissVector(vector: string): Record<string, string> {
  const metrics: Record<string, string> = {};
  if (!vector) return metrics;
  for (const part of vector.split('/').slice(1)) {
    const [code, value] = part.split(':');
    metrics[code.toLowerCase()] = value;
  }
  return metrics;
}

function buildTechniques(): Row[] {
  return (registrar.techniques || []).map((t: any) => {
    const nv = parseNissVector(t.niss?.vector || '');
    return {
      id: t.id,
      name: t.attack || t.name,
      tactic: t.tactic,
      severity: t.severity,
      status: t.status,
      niss_score: t.niss?.score || 0,
      niss_vector: t.niss?.vector || '',
      niss_severity: t.niss?.severity || '',
      niss_pins: t.niss?.pins || false,
      niss_bi: nv.bi || '',
      niss_cr: nv.cr || '',
      niss_cd: nv.cd || '',
      niss_cv: nv.cv || '',
      niss_rv: nv.rv || '',
      niss_np: nv.np || '',
      bands: Array.isArray(t.bands) ? t.bands.join(', ') : (t.bands || ''),
      ui_category: t.ui_category || '',
      physics_tier: t.physics_tier || '',
      dual_use: t.dual_use || '',
      consent_tier: t.consent_tier || '',
      tara_alias: t.tara_alias || '',
      tara_domain: t.tara_domain_primary || '',
      tara_domain_secondary: (t.tara_domain_secondary || []).join(', '),
      tara_mode: t.tara_mode || '',
    };
  });
}

function buildTactics(): Row[] {
  return (registrar.tactics || []).map((t: any) => ({
    id: t.id,
    name: t.name,
    domain: t.domain,
    domain_code: t.domain_code,
    action_code: t.action_code,
    description: t.description || '',
  }));
}

function buildNeuralPathways(): Row[] {
  return (pathways.pathways || []).map((p: any) => ({
    id: p.id,
    name: p.name,
    type: p.type || '',
    neurotransmitter: p.neurotransmitter || '',
    origin: (p.origin || []).join(', '),
    origin_band: p.origin_band || '',
    targets: (p.targets || []).join(', '),
    target_bands: (p.target_bands || []).join(', '),
    function: p.function || '',
    bci_relevance: p.bci_relevance || '',
    dsm_conditions: (p.dsm_conditions || []).join(', '),
    confidence: p.confidence || '',
  }));
}

function buildNeurotransmitters(): Row[] {
  return (ntData.neurotransmitters || []).map((nt: any) => ({
    id: nt.id,
    name: nt.name,
    abbreviation: nt.abbreviation || nt.id,
    chemical_class: nt.chemical_class || '',
    primary_bands: (nt.primary_qif_bands || []).join(', '),
    primary_regions: (nt.primary_regions || []).join(', '),
    receptor_count: Array.isArray(nt.receptors) ? nt.receptors.length : 0,
    cofactor_count: (nt.cofactor_dependencies || []).length,
    synthesis_steps: (nt.synthesis_pathway || []).length,
    dsm_condition_count: (nt.dsm_conditions || []).length,
    bci_relevance: nt.bci_relevance || '',
    confidence: nt.confidence || '',
  }));
}

function buildNeurotransmitterReceptors(): Row[] {
  // Flatten receptors from neurotransmitter data
  return (ntData.neurotransmitters || []).flatMap((nt: any) =>
    (nt.receptors || []).map((r: any) => ({
      receptor_id: r.id || r.name || '',
      neurotransmitter: nt.name,
      neurotransmitter_id: nt.id,
      type: r.type || '',
      gene: r.gene || '',
      mechanism: r.mechanism || '',
      location: r.primary_location || r.location || '',
    }))
  );
}

function buildCofactors(): Row[] {
  // Flatten cofactors from neurotransmitter data
  const seen = new Set<string>();
  return (ntData.neurotransmitters || []).flatMap((nt: any) =>
    (nt.cofactor_dependencies || []).map((c: any) => {
      const key = `${c.cofactor}:${nt.id}`;
      if (seen.has(key)) return null;
      seen.add(key);
      return {
        cofactor: c.cofactor,
        neurotransmitter: nt.name,
        neurotransmitter_id: nt.id,
        role: c.role || '',
        deficiency_effect: c.deficiency_effect || '',
      };
    }).filter(Boolean)
  ) as Row[];
}

function buildDsm5(): Row[] {
  return Object.entries(dsm.diagnostic_clusters || {}).flatMap(([clusterId, cluster]: [string, any]) =>
    (cluster.conditions || []).map((c: any) => ({
      code: c.code,
      diagnosis: c.name,
      cluster: cluster.label || clusterId,
      cluster_id: clusterId,
      qif_bands: (c.bands || []).join(', '),
      color: cluster.color || '',
    }))
  );
}

function buildNeurologicalConditions(): Row[] {
  return (neuro.conditions || []).map((c: any) => ({
    id: c.id,
    code: c.code,
    name: c.name,
    category: c.category,
    subcategory: c.subcategory || '',
    definition: c.definition || '',
    pathway_ids: (c.pathway_ids || []).join(', '),
    qif_bands: (c.bands || []).join(', '),
    bci_attack_vector: c.bci_attack_vector || '',
    niss_primary: c.niss_primary || '',
    niss_affected: (c.niss_affected || []).join(', '),
    confidence: c.confidence || '',
  }));
}

function buildCves(): Row[] {
  return (cve.mappings || []).map((m: any) => ({
    cve_id: m.cve_id,
    product: m.product,
    cvss: m.cvss?.score || 0,
    category: m.category || '',
    technique_ids: (m.tara_techniques || []).join(', '),
    cwe: (m.cwe || []).join(', '),
  }));
}

function buildCompanies(): Row[] {
  return (landscape.companies || []).map((c: any) => ({
    name: c.name,
    type: c.type,
    category: c.company_category || '',
    founded: c.founded,
    status: c.status,
    headquarters: c.headquarters || '',
    employees_approx: c.employees_approx || 0,
    security_posture: c.security_posture,
    security_notes: (c.security_notes || '').slice(0, 200),
    funding_total_usd: c.funding_total_usd || 0,
    valuation_usd: c.valuation_usd || 0,
    device_count: (c.devices || []).length,
    attack_surface_count: (c.tara_attack_surface || []).length,
  }));
}

function buildDevices(): Row[] {
  return (landscape.companies || []).flatMap((c: any) =>
    (c.devices || []).map((d: any) => ({
      device: d.name,
      company: c.name,
      type: d.type,
      channels: d.channels || 0,
      electrode_type: d.electrode_type || '',
      fda_status: d.fda_status || 'none',
      units_deployed: d.units_deployed || '',
      first_human: d.first_human || '',
      target_use: d.target_use || '',
      price_usd: d.price_usd || 0,
      cve_count: (d.cves_known || []).length,
      company_type: c.type || '',
      company_category: c.company_category || '',
      company_status: c.status || '',
      company_funding: c.funding_total_usd || 0,
      security_posture: c.security_posture || '',
      attack_surface_count: (c.tara_attack_surface || []).length,
    }))
  );
}

function buildNeurorights(): Row[] {
  return Object.entries(ethics.neurorights || {}).map(([id, r]: [string, any]) => ({
    id,
    name: r.name,
    shortDef: r.shortDef,
    bands: (r.bands || []).join(', '),
    frameworks: (r.frameworks || []).join(', '),
  }));
}

function buildControls(): Row[] {
  return Object.entries(controls.controls_by_band || {}).flatMap(([band, types]: [string, any]) =>
    ['detection', 'prevention', 'response'].flatMap(type =>
      (types[type] || []).map((control: string) => ({
        band,
        type,
        control,
      }))
    )
  );
}

function buildNeurosecurityScores(): Row[] {
  return ((scoresRaw as any).scores || []).map((s: any) => ({
    device: s.device || s.name || '',
    overall_score: s.overall_score || s.score || 0,
    authentication: s.authentication || '',
    encryption: s.encryption || '',
    firmware: s.firmware || '',
    physical: s.physical || '',
  }));
}

// ═══ NEW DATA LAKE TABLES (dynamic — only built if data exists) ═══

function buildCranialNerves(): Row[] {
  if (!cranialNervesRaw) return [];
  return (cranialNervesRaw.cranial_nerves || []).map((cn: any) => ({
    id: cn.id,
    number: cn.number,
    name: cn.name,
    type: cn.type,
    fiber_components: (cn.fiber_components || []).join(', '),
    function: cn.function || '',
    qif_band: cn.qif_band || '',
    qif_band_confidence: cn.qif_band_confidence || '',
    neurotransmitters: (cn.neurotransmitters || []).join(', '),
    bci_relevance: cn.bci_relevance || '',
    bci_devices: (cn.bci_devices || []).join(', '),
    clinical_significance: cn.clinical_significance || '',
    confidence: cn.confidence || '',
  }));
}

function buildNeuroendocrineAxes(): Row[] {
  if (!neuroendocrineRaw) return [];
  return (neuroendocrineRaw.axes || []).map((ax: any) => ({
    id: ax.id,
    name: ax.name,
    abbreviation: ax.abbreviation || '',
    releasing_hormone: ax.releasing_hormone?.name || '',
    releasing_gene: ax.releasing_hormone?.gene || '',
    pituitary_hormone: ax.pituitary_hormone?.name || '',
    pituitary_gene: ax.pituitary_hormone?.gene || '',
    target_hormone: ax.target_hormone?.name || '',
    receptor_count: (ax.receptors || []).length,
    qif_bands: (ax.qif_bands || []).join(', '),
    dsm_condition_count: (ax.dsm_conditions || []).length,
    bci_relevance: ax.bci_relevance || '',
    confidence: ax.confidence || '',
  }));
}

function buildNeuroendocrineReceptors(): Row[] {
  if (!neuroendocrineRaw) return [];
  return (neuroendocrineRaw.axes || []).flatMap((ax: any) =>
    (ax.receptors || []).map((r: any) => ({
      receptor_id: r.id,
      axis: ax.name,
      axis_id: ax.id,
      gene: r.gene || '',
      type: r.type || '',
      g_protein: r.g_protein || '',
      location: r.location || '',
    }))
  );
}

function buildGlialCells(): Row[] {
  if (!glialRaw) return [];
  return (glialRaw.glial_types || []).map((g: any) => ({
    id: g.id,
    name: g.name,
    subtype_count: (g.subtypes || []).length,
    marker_count: (g.molecular_markers || []).length,
    function_count: (g.functions || []).length,
    functions: (g.functions || []).join('; '),
    qif_bands: (g.qif_bands || []).join(', '),
    bci_relevance: g.bci_relevance || '',
    security_relevance: g.security_relevance || '',
    confidence: g.confidence || '',
  }));
}

function buildGlialMarkers(): Row[] {
  if (!glialRaw) return [];
  return (glialRaw.glial_types || []).flatMap((g: any) =>
    (g.molecular_markers || []).map((m: any) => ({
      marker: m.name,
      gene: m.gene || '',
      glial_type: g.name,
      glial_id: g.id,
      notes: m.notes || '',
    }))
  );
}

function buildBBB(): Row[] {
  if (!neurovascularRaw) return [];
  const bbb = neurovascularRaw.blood_brain_barrier;
  if (!bbb) return [];
  const rows: Row[] = [];
  const band = bbb.qif_band || 'I0';
  // Components (endothelial cells, pericytes, astrocytic end-feet)
  for (const comp of bbb.components || []) {
    rows.push({
      category: 'component', name: comp.name, gene: '', function: comp.description || comp.function || '', qif_band: band,
    });
  }
  // Tight junction proteins (top-level in BBB object)
  for (const tj of bbb.tight_junction_proteins || []) {
    rows.push({
      category: 'tight_junction', name: tj.name, gene: tj.gene || '', function: tj.function || '', qif_band: band,
    });
  }
  // Transport proteins (top-level in BBB object)
  for (const tp of bbb.transport_proteins || []) {
    rows.push({
      category: 'transporter', name: tp.name, gene: tp.gene || '', function: tp.function || '', qif_band: band,
    });
  }
  return rows;
}

function buildMeningealSystem(): Row[] {
  if (!neurovascularRaw) return [];
  const rows: Row[] = [];
  // Meninges (dura, arachnoid, pia)
  for (const layer of neurovascularRaw.meninges || []) {
    rows.push({
      category: 'meningeal_layer', name: layer.name,
      derivation: layer.derivation || '', composition: layer.composition || '',
      functions: (layer.functions || []).join(', '),
    });
  }
  // Meningeal spaces
  for (const space of neurovascularRaw.meningeal_spaces || []) {
    rows.push({
      category: 'meningeal_space', name: space.name,
      contents: space.contents || '', clinical: space.clinical || '',
    });
  }
  return rows;
}

function buildReceptorFamilies(): Row[] {
  if (!receptorsRaw) return [];
  return (receptorsRaw.receptor_families || []).map((rf: any) => ({
    id: rf.id,
    name: rf.name,
    type: rf.type || '',
    ligand: rf.ligand || '',
    parent_neurotransmitter: rf.parent_neurotransmitter || '',
    subunit_count: (rf.subunits || []).length,
    ion_selectivity: rf.ion_selectivity || '',
    signaling_mechanism: rf.signaling_mechanism || '',
    brain_regions: (rf.brain_regions || []).join(', '),
    dsm_condition_count: (rf.dsm_conditions || []).length,
    bci_relevance: rf.bci_relevance || '',
    confidence: rf.confidence || '',
  }));
}

function buildReceptorSubunits(): Row[] {
  if (!receptorsRaw) return [];
  return (receptorsRaw.receptor_families || []).flatMap((rf: any) =>
    (rf.subunits || []).map((su: any) => ({
      subunit: su.name,
      gene: su.gene || '',
      ncbi_gene_id: su.ncbi_gene_id || '',
      receptor_family: rf.name,
      receptor_id: rf.id,
      expression: su.expression || '',
      notes: su.notes || '',
    }))
  );
}

// ═══ Market & Business Tables ═══

function buildFunding(): Row[] {
  return (landscape.market_data?.major_funding_rounds || []).map((r: any) => ({
    company: r.company,
    amount_usd: r.amount_usd,
    date: r.date,
    series: r.series || '',
    lead_investors: (r.lead_investors || []).join(', ') || r.investors || '',
    valuation: r.post_money_valuation_usd || 0,
  }));
}

function buildMarketForecasts(): Row[] {
  return (landscape.market_data?.market_size_estimates || []).map((m: any) => ({
    year: m.year,
    value_billion_usd: m.value_billion_usd,
    source: m.source || '',
    cagr_percent: m.cagr_percent || '',
  }));
}

function buildConsentTiers(): Row[] {
  return Object.entries(ethics.consent_tiers || {}).map(([id, t]: [string, any]) => ({
    id,
    label: t.label,
    description: t.description || '',
    bands: Array.isArray(t.bands) ? t.bands.join(', ') : (t.bands || ''),
  }));
}

function buildFrameworks(): Row[] {
  return (ethics.governance_frameworks || []).map((f: any) => ({
    id: f.id,
    name: f.name,
    year: f.year,
    status: f.status,
    scope: f.scope || '',
  }));
}

// ═══ Landscape: Additional Market & Intel Tables ═══

function buildGrants(): Row[] {
  return (landscape.market_data?.government_grants || []).map((g: any) => ({
    program: g.program, total_usd: g.total_usd, period: g.period, note: g.note || '',
  }));
}

function buildAcquisitions(): Row[] {
  return (landscape.market_data?.acquisition_history || []).map((a: any) => ({
    target: a.target, acquirer: a.acquirer, date: a.date,
    price_usd_estimate: a.price_usd_estimate || 0, note: a.note || '',
  }));
}

function buildPolicy(): Row[] {
  return (landscape.policy_timeline || []).map((p: any) => ({
    date: p.date, event: p.event, type: p.type, jurisdiction: p.jurisdiction,
  }));
}

function buildPublications(): Row[] {
  return (landscape.publication_trends || []).map((t: any) => ({
    year: t.year, pubmed_bci: t.pubmed_bci, security_bci: t.security_bci,
    security_pct: t.pubmed_bci > 0 ? Number(((t.security_bci / t.pubmed_bci) * 100).toFixed(2)) : 0,
  }));
}

function buildVcDeals(): Row[] {
  return (landscape.market_data?.vc_aggregate_by_year || []).map((v: any) => ({
    year: v.year, deals: v.deals, total_usd: v.total_usd, source: v.source || '', note: v.note || '',
  }));
}

function buildSecurityGap(): Row[] {
  return (landscape.market_data?.security_gap?.comparison_markets || []).map((c: any) => ({
    market: c.market, size_2025_usd: c.size_2025_usd, cagr_percent: c.cagr_percent, source: c.source || '',
  }));
}

function buildAdjacentMarkets(): Row[] {
  return [
    ...(landscape.market_data?.broader_neurotech_market || []).map((m: any) => ({
      market: 'Neurotechnology (all)', year: m.year, value_billion_usd: m.value_billion_usd,
      cagr_percent: m.cagr_percent || '', source: m.source || '',
    })),
    ...(landscape.market_data?.eeg_devices_market || []).map((m: any) => ({
      market: 'EEG Devices', year: m.year, value_billion_usd: m.value_billion_usd,
      cagr_percent: m.cagr_percent || '', source: m.source || '',
    })),
    ...(landscape.market_data?.bci_implant_market || []).map((m: any) => ({
      market: 'BCI Implants (invasive only)', year: m.year, value_billion_usd: m.value_billion_usd,
      cagr_percent: m.cagr_percent || '', source: m.source || '',
    })),
  ];
}

function buildSources(): Row[] {
  return [
    ...(landscape.market_data?.security_gap?.key_sources || []).map((s: any) => ({
      title: s.title, url: s.url || '', date: s.date || '', category: 'security_gap',
    })),
    ...(landscape.market_data?.market_size_estimates || []).filter((m: any) => m.source_url).map((m: any) => ({
      title: m.source, url: m.source_url, date: String(m.year), category: 'market_forecast',
    })),
    ...(landscape.market_data?.major_funding_rounds || []).filter((r: any) => r.source_url).map((r: any) => ({
      title: `${r.company} ${r.series}`, url: r.source_url, date: r.date, category: 'funding_round',
    })),
  ];
}

// Investor Intelligence
function buildCrossPortfolio(): Row[] {
  const intel = landscape.market_data?.investor_intelligence || {};
  return (intel.cross_portfolio_vcs || []).map((v: any) => ({
    firm: v.firm, type: v.type || 'VC', aum_B: v.aum_billions || '',
    bci_companies: (v.bci_investments || []).map((i: any) => i.company).join(', '),
    bci_bet_count: (v.bci_investments || []).length, signal: v.signal || '',
  }));
}

function buildSovereignFunds(): Row[] {
  const intel = landscape.market_data?.investor_intelligence || {};
  return (intel.sovereign_wealth_funds || []).map((s: any) => ({
    fund: s.fund, country: s.country || '', aum_B: s.aum_billions || '',
    bci_investments: (s.bci_investments || []).map((i: any) => `${i.company} (${i.round})`).join(', '),
    signal: s.signal || '',
  }));
}

function buildBigTechBci(): Row[] {
  const intel = landscape.market_data?.investor_intelligence || {};
  return (intel.big_tech_corporate_venture || []).map((t: any) => ({
    company: t.company, type: t.type || '', bci_investment: t.bci_investment || '',
    amount: t.amount || '', strategy: t.strategy || '',
  }));
}

function buildPeFirms(): Row[] {
  const intel = landscape.market_data?.investor_intelligence || {};
  return (intel.pe_firms || []).map((p: any) => ({
    firm: p.firm, type: p.type || 'PE', bci_investment: p.bci_investment || '',
    amount: p.amount || '', signal: p.signal || '',
  }));
}

function buildIntelDefense(): Row[] {
  const intel = landscape.market_data?.investor_intelligence || {};
  return (intel.intelligence_agencies_defense || []).map((i: any) => ({
    entity: i.entity, type: i.type || '', bci_investment: i.bci_investment || '',
    round: i.round || '', signal: i.signal || '',
  }));
}

function buildNotableInvestors(): Row[] {
  const intel = landscape.market_data?.investor_intelligence || {};
  return (intel.notable_individual_investors || []).map((n: any) => ({
    name: n.name, role: n.role || '', bci_investments: (n.bci_investments || []).join(', '),
    signal: n.signal || '',
  }));
}

function buildInvestmentPatterns(): Row[] {
  const intel = landscape.market_data?.investor_intelligence || {};
  return (intel.key_patterns || []).map((p: any, i: number) => ({
    id: i + 1, pattern: p.pattern || '', evidence: p.evidence || '', implication: p.implication || '',
  }));
}

// Hardware, Comms & Ops
function buildHardwareSpecs(): Row[] {
  return (hardware.devices || []).map((d: any) => ({
    id: d.id, manufacturer: d.manufacturer, device_name: d.device_name,
    device_type: d.device_type || '', fda_status: (d.fda_status || '').slice(0, 40),
    channels: d.core_specs?.channel_count?.value ?? '',
    power_mw: d.core_specs?.power_consumption_total?.value ?? '',
    directionality: d.core_specs?.directionality?.value ?? '',
  }));
}

function buildComms(): Row[] {
  return (hardware.devices || []).map((d: any) => {
    const pc = d.physics_constraints || {};
    const wp = pc.wireless_protocol || {};
    const wpVal = typeof wp === 'string' ? wp : (wp.value || '');
    const wpLower = wpVal.toLowerCase();
    let rf_band = '';
    if (wpLower.includes('ble') || wpLower.includes('bluetooth')) rf_band = '2.4 GHz ISM';
    else if (wpLower.includes('wifi')) rf_band = '2.4/5 GHz';
    else if (wpLower.includes('near-field') || wpLower.includes('nfc') || wpLower.includes('inductive')) rf_band = 'Near-field';
    else if (wpLower.includes('near-infrared') || wpLower.includes('optical')) rf_band = 'NIR optical';
    else if (wpLower.includes('wired') || wpLower.includes('percutaneous')) rf_band = 'N/A (wired)';
    const data_link_risk = wpLower.includes('ble') || wpLower.includes('bluetooth') ? 'HIGH (BLE sniffable)'
      : wpLower.includes('wifi') ? 'HIGH (WiFi interceptable)'
      : wpLower.includes('wired') || wpLower.includes('percutaneous') ? 'LOW (physical access)'
      : wpLower.includes('near-infrared') || wpLower.includes('optical') ? 'LOW (line-of-sight)'
      : wpLower.includes('near-field') || wpLower.includes('nfc') ? 'MEDIUM (proximity)' : 'UNKNOWN';
    return {
      device: d.device_name, manufacturer: d.manufacturer, wireless_protocol: wpVal || 'Unknown',
      rf_band: rf_band || 'Unknown', data_link_risk,
    };
  });
}

function buildNspLayers(): Row[] {
  return (controls.nsp_layers || []).map((l: any) => ({
    layer: l.layer, name: l.name, bands: (l.bands || []).join(', '), overhead_pct: l.overhead || '',
  }));
}

function buildValidations(): Row[] {
  return (validation.entries || []).map((v: any) => ({
    id: v.id, component: v.component, category: v.category,
    tiers: (v.tiers || []).join(', '), status: v.status, summary: v.summary || '', date: v.date || '',
  }));
}

function buildAutomations(): Row[] {
  return (automation.entries || []).map((a: any) => ({
    id: a.id, name: a.name, trigger: a.trigger || '', type: a.type || '',
    status: a.status, category: a.category || '',
  }));
}

function buildMilestones(): Row[] {
  return (timeline.milestones || []).map((m: any) => ({
    date: m.date, title: m.title, type: m.type, description: m.description || '',
  }));
}

function buildNews(): Row[] {
  return (Array.isArray(news) ? news : []).map((n: any) => ({
    title: n.title, date: n.date, source: n.source, category: n.category, url: refangUrl(n.url || ''),
  }));
}

function buildIntelFeed(): Row[] {
  return (Array.isArray(intelFeed) ? intelFeed : []).map((item: any) => ({
    id: item.id, title: item.title, date: item.date, source: item.source,
    source_category: item.source_category, tags: (item.tags || []).join(', '),
    companies: (item.companies || []).join(', '), url: refangUrl(item.url || ''),
  }));
}

function buildIntelSources(): Row[] {
  return (Array.isArray(intelSources) ? intelSources : []).map((s: any) => ({
    name: s.name, category: s.category, tier: s.tier, url: s.url, has_rss: !!s.rss_url, has_api: !!s.has_api,
  }));
}

// ═══ Timelines: Unified ═══

function buildNeuroethicsTimeline(): Row[] {
  return (registry.timelines?.neuroethics || []).map((t: any) => ({
    year: t.year, label: t.label, authors: t.authors || '', desc: t.desc, domain: 'neuroethics',
  }));
}

function buildNeurosecurityTimeline(): Row[] {
  return (registry.timelines?.neurosecurity || []).map((t: any) => ({
    year: t.year, label: t.label, authors: t.authors || '', venue: t.venue || '',
    doi: t.doi || '', desc: t.desc, detail: t.detail || '', domain: 'neurosecurity',
  }));
}

function buildAiEthicsTimeline(): Row[] {
  return (registry.timelines?.ai_ethics || []).map((t: any) => ({
    year: t.year, label: t.label, authors: t.authors || '', desc: t.desc, domain: 'ai_ethics',
  }));
}

function buildIndustryTimeline(): Row[] {
  return (landscape.industry_timeline || []).map((t: any) => ({
    year: t.year, label: t.label, type: t.type, domain: 'industry',
  }));
}

function buildDerivationMilestones(): Row[] {
  return (derivationTimeline.milestones || []).map((m: any) => ({
    id: m.id || '', entry: m.entry || '', date: m.date, title: m.title,
    description: m.description || '', category: m.category || '', type: m.type || '',
    domain: 'derivation',
  }));
}

// Computed Analysis
function buildTamSamSom(): Row[] {
  const base2024 = (landscape.market_data?.market_size_estimates || [])
    .filter((m: any) => m.year === 2024).map((m: any) => m.value_billion_usd).sort((a: number, b: number) => a - b);
  const median2024 = base2024.length > 0 ? base2024[Math.floor(base2024.length / 2)] : 2.3;
  const cagrs = (landscape.market_data?.market_size_estimates || [])
    .filter((m: any) => m.cagr_percent).map((m: any) => m.cagr_percent).sort((a: number, b: number) => a - b);
  const medianCagr = cagrs.length > 0 ? cagrs[Math.floor(cagrs.length / 2)] : 15.0;
  const rows: Row[] = [];
  for (let yr = 2024; yr <= 2035; yr++) {
    const yO = yr - 2024;
    const bci = median2024 * Math.pow(1 + medianCagr / 100, yO);
    const tam = bci * 0.065; const sam = tam * 0.70;
    const somPct = yr <= 2024 ? 0 : Math.min(0.25, 0.05 + (yr - 2025) * 0.04);
    rows.push({ year: yr, bci_market_B: Number(bci.toFixed(2)), tam_M: Math.round(tam * 1000),
      sam_M: Math.round(sam * 1000), som_pct: `${(somPct * 100).toFixed(0)}%`,
      som_M: Math.round(sam * somPct * 1000), median_cagr: `${medianCagr}%` });
  }
  return rows;
}

function buildConvergence(): Row[] {
  return [
    { year: 2019, market: 'Automotive Cyber', event: 'Pre-regulation baseline', value_B: 1.7, security_spend_B: 1.7 },
    { year: 2020, market: 'Automotive Cyber', event: 'UN R155 adopted', value_B: 2.0, security_spend_B: 2.0 },
    { year: 2022, market: 'Automotive Cyber', event: 'Mandatory new types', value_B: 3.0, security_spend_B: 3.0 },
    { year: 2025, market: 'Automotive Cyber', event: 'Mature market', value_B: 4.7, security_spend_B: 4.7 },
    { year: 2023, market: 'BCI (actual)', event: 'FDORA 524B', value_B: 1.8, security_spend_B: 0 },
    { year: 2025, market: 'BCI (actual)', event: 'GAO: no BCI privacy law', value_B: 2.8, security_spend_B: 0 },
    { year: 2026, market: 'BCI (projected)', event: 'Pre-regulation', value_B: 3.3, security_spend_B: 0 },
    { year: 2028, market: 'BCI (projected)', event: 'FDA BCI guidance', value_B: 4.4, security_spend_B: 0.05 },
    { year: 2030, market: 'BCI (projected)', event: 'Security spend emerges', value_B: 5.8, security_spend_B: 0.38 },
  ];
}

function buildMomentum(): Row[] {
  const vc = landscape.market_data?.vc_aggregate_by_year || [];
  let cum = 0;
  return vc.map((v: any, i: number) => {
    cum += v.total_usd;
    const prev = i > 0 ? vc[i - 1].total_usd : null;
    return {
      year: v.year, total_invested_M: Math.round(v.total_usd / 1e6), deals: v.deals,
      yoy_growth: prev ? ((v.total_usd - prev) / prev * 100).toFixed(0) + '%' : 'N/A',
      cumulative_invested_M: Math.round(cum / 1e6),
    };
  });
}

function buildRiskProfile(): Row[] {
  return buildCompanies().map((c: any) => {
    const fB = (c.funding_total_usd || 0) / 1e9;
    const ss = c.security_posture === 'none_published' ? 0 : c.security_posture === 'minimal' ? 1
      : c.security_posture === 'basic' ? 2 : c.security_posture === 'moderate' ? 3 : 4;
    return {
      company: c.name, type: c.type, funding_B: Number(fB.toFixed(2)),
      devices: c.device_count, security_posture: c.security_posture,
      security_score: `${ss}/4`, attack_surfaces: c.attack_surface_count,
      risk_index: Number((fB * Math.max(c.device_count, 1) * (5 - ss)).toFixed(2)),
    };
  }).sort((a: any, b: any) => (b.risk_index as number) - (a.risk_index as number));
}

// ═══ Cross-Reference: Impact Chain ═══

export interface ImpactChainLink {
  technique_id: string;
  technique_name: string;
  severity: string;
  niss_score: number;
  band_id: string;
  band_name: string;
  region_id: string;
  region_name: string;
  pathway_id: string;
  pathway_name: string;
  neurotransmitter: string;
  dsm_code: string;
  dsm_name: string;
  dsm_cluster: string;
}

/**
 * Impact chains are precomputed by shared/scripts/compute-impact-chains.mjs
 * to eliminate the O(n⁴) nested-loop computation at build time.
 * Regenerate with: node shared/scripts/compute-impact-chains.mjs
 */
function buildImpactChains(): Row[] {
  return (impactChainsRaw as any) as Row[];
}

// ═══ NeuroSIM Tables ═══

function buildNeuronTypes(): Row[] {
  if (!neurosim?.neuronTypes) return [];
  return neurosim.neuronTypes.map((n: any) => ({
    id: n.id,
    name: n.name,
    category: n.category,
    neurotransmitter: n.neurotransmitter,
    regions: n.regions.join(', '),
    proportion: n.proportion,
    soma_size_um: n.morphology.somaSize_um,
    soma_shape: n.morphology.somaShape,
    spine_count: n.morphology.spineCount,
    axon_length_um: n.morphology.axon.length_um,
    axon_myelinated: n.morphology.axon.myelinated,
    axon_collaterals: n.morphology.axon.collaterals,
    resting_potential_mV: n.electrophysiology.restingPotential_mV,
    threshold_mV: n.electrophysiology.threshold_mV,
    peak_amplitude_mV: n.electrophysiology.peakAmplitude_mV,
    ap_duration_ms: n.electrophysiology.apDuration_ms,
    firing_rate_min_Hz: n.electrophysiology.firingRate_Hz.min,
    firing_rate_typical_Hz: n.electrophysiology.firingRate_Hz.typical,
    firing_rate_max_Hz: n.electrophysiology.firingRate_Hz.max,
    refractory_absolute_ms: n.electrophysiology.refractoryAbsolute_ms,
  }));
}

function buildCorticalLayers(): Row[] {
  if (!neurosim?.corticalLayers) return [];
  return neurosim.corticalLayers.map((l: any) => ({
    id: l.id,
    name: l.name,
    thickness_um: l.thickness_um,
    cell_types: l.cellTypes.join(', '),
    description: l.description,
  }));
}

function buildActionPotentialPhases(): Row[] {
  if (!neurosim?.actionPotential?.phases) return [];
  return neurosim.actionPotential.phases.map((p: any) => ({
    id: p.id,
    label: p.label,
    voltage_mV: p.voltage_mV,
    duration_ms: p.duration_ms,
    description: p.description,
  }));
}

function buildIonChannels(): Row[] {
  if (!neurosim?.actionPotential?.ionChannels) return [];
  return neurosim.actionPotential.ionChannels.map((ch: any) => ({
    id: ch.id,
    name: ch.name,
    ion: ch.ion,
    direction: ch.direction,
    activation: ch.activation,
    conductance_pS: ch.conductance_pS,
  }));
}

function buildSimReceptors(): Row[] {
  if (!neurosim?.receptors) return [];
  return neurosim.receptors.map((r: any) => ({
    id: r.id,
    name: r.name,
    type: r.type,
    neurotransmitter: r.neurotransmitter,
    ions: r.ions.join(', '),
    conductance_pS: r.conductance_pS,
    kinetics: r.kinetics,
    notes: r.notes || '',
  }));
}

function buildDendriticSpines(): Row[] {
  if (!neurosim?.spineTypes) return [];
  return neurosim.spineTypes.map((s: any) => ({
    id: s.id,
    name: s.name,
    head_diameter_um: s.headDiameter_um,
    neck_length_um: s.neckLength_um,
    neck_diameter_um: s.neckDiameter_um,
    stability: s.stability,
    ampa_count: s.ampaCount,
  }));
}

function buildBrainNetworks(): Row[] {
  if (!neurosim?.networks) return [];
  return neurosim.networks.map((n: any) => ({
    id: n.id,
    name: n.name,
    regions: n.regions.join(', '),
    tract: n.tract,
  }));
}

function buildConductionVelocities(): Row[] {
  if (!neurosim?.conductionVelocities) return [];
  return neurosim.conductionVelocities.map((cv: any) => ({
    fiber_type: cv.fiberType,
    myelinated: cv.myelinated,
    diameter_um: cv.diameter_um,
    velocity_ms: cv.velocity_ms,
    function: cv.function,
  }));
}

function buildSynapseParameters(): Row[] {
  if (!neurosim?.synapse) return [];
  const s = neurosim.synapse;
  return [
    { parameter: 'cleft_width_nm', value: s.cleftWidth_nm, category: 'structure' },
    { parameter: 'presynaptic_diameter_um', value: s.presynapticTerminal.diameter_um, category: 'structure' },
    { parameter: 'vesicle_count_rrp', value: s.presynapticTerminal.vesicleCount_rrp, category: 'vesicles' },
    { parameter: 'vesicle_count_reserve', value: s.presynapticTerminal.vesicleCount_reserve, category: 'vesicles' },
    { parameter: 'vesicle_diameter_nm', value: s.presynapticTerminal.vesicle_diameter_nm, category: 'vesicles' },
    { parameter: 'psd_diameter_nm', value: s.postsynapticDensity.diameter_nm, category: 'structure' },
    { parameter: 'psd_thickness_nm', value: s.postsynapticDensity.thickness_nm, category: 'structure' },
    ...Object.entries(s.timing).map(([k, v]) => ({
      parameter: k,
      value: v as number,
      category: 'timing',
    })),
  ];
}

function buildOscillationBands(): Row[] {
  if (!neurosim?.oscillationBands) return [];
  return neurosim.oscillationBands.map((ob: any) => ({
    id: ob.id,
    name: ob.name,
    frequency_min_Hz: ob.frequency_min_Hz,
    frequency_max_Hz: ob.frequency_max_Hz,
    amplitude_uV: ob.amplitude_uV,
    regions: ob.regions.join(', '),
    function: ob.function,
    clinical: ob.clinical,
    bci_relevance: ob.bci_relevance,
  }));
}

function buildWhiteMatterTracts(): Row[] {
  if (!neurosim?.whitematterTracts) return [];
  return neurosim.whitematterTracts.map((t: any) => ({
    id: t.id,
    name: t.name,
    type: t.type,
    connects: t.connects.join(', '),
    fiber_count_million: t.fiberCount_million,
    function: t.function,
    clinical: t.clinical,
  }));
}

function buildSynapticPlasticity(): Row[] {
  if (!neurosim?.synapticPlasticity) return [];
  return neurosim.synapticPlasticity.map((sp: any) => ({
    id: sp.id,
    name: sp.name,
    mechanism: sp.mechanism,
    induction: sp.induction,
    requires: sp.requires,
    duration: sp.duration,
    protein_synthesis: sp.protein_synthesis,
    structural: sp.structural,
  }));
}

function buildEegElectrodes(): Row[] {
  if (!neurosim?.eegElectrodes) return [];
  return neurosim.eegElectrodes.map((e: any) => ({
    id: e.id,
    name: e.name,
    lobe: e.lobe,
    hemisphere: e.hemisphere,
    function: e.function,
    bci_use: e.bci_use,
  }));
}

// ═══ EEG Sample Registry ═══

function buildEegSamples(): Row[] {
  const samples = (eegSamplesRaw as any)?.samples;
  if (!Array.isArray(samples)) return [];
  return samples.map((s: any) => ({
    id: s.id,
    name: s.name,
    source: s.source,
    source_url: s.sourceUrl ?? '',
    type: s.type,
    conditions: Array.isArray(s.condition) ? s.condition.join(', ') : '',
    dsm5_code: s.dsm5Code ?? '',
    channels: s.channels ?? 0,
    channel_names: Array.isArray(s.channelNames) ? s.channelNames.join(', ') : '',
    sampling_rate_hz: s.samplingRateHz ?? 0,
    format: s.format,
    license: s.license,
    redistributable: s.redistributable ? 'yes' : 'no',
    subjects: s.subjects ?? 0,
    subject_breakdown: s.subjectBreakdown ?? '',
    paradigm: s.paradigm ?? '',
    tara_id: s.taraId ?? '',
    tara_relevance: s.taraRelevance ?? '',
    paper_doi: s.paperDoi ?? '',
    data_doi: s.dataDoi ?? '',
    research_tags: Array.isArray(s.researchTags) ? s.researchTags.join(', ') : '',
    notes: s.notes ?? '',
  }));
}

// ═══ Main Builder ═══

let _cache: { tables: KqlTables; stats: DataLakeStats } | null = null;

/**
 * Build all KQL tables from the data lake.
 * Cached after first call (build-time memoization).
 * Returns only non-empty tables — dashboards auto-discover what's available.
 */
export function getKqlTables(): KqlTables {
  if (_cache) return _cache.tables;

  const allTables: Record<string, Row[]> = {
    // Core anatomy
    brain_regions: buildBrainRegions(),
    hourglass_bands: buildHourglassBands(),
    neural_pathways: buildNeuralPathways(),
    neurotransmitters: buildNeurotransmitters(),
    nt_receptors: buildNeurotransmitterReceptors(),
    cofactors: buildCofactors(),

    // Threats
    techniques: buildTechniques(),
    tactics: buildTactics(),
    cves: buildCves(),
    impact_chains: buildImpactChains(),

    // Clinical
    dsm5: buildDsm5(),
    neurological_conditions: buildNeurologicalConditions(),

    // Devices & industry
    companies: buildCompanies(),
    devices: buildDevices(),
    funding: buildFunding(),
    market_forecasts: buildMarketForecasts(),
    grants: buildGrants(),
    acquisitions: buildAcquisitions(),
    vc_deals: buildVcDeals(),
    adjacent_markets: buildAdjacentMarkets(),
    security_gap: buildSecurityGap(),
    sources: buildSources(),

    // Investor intelligence
    cross_portfolio: buildCrossPortfolio(),
    sovereign_funds: buildSovereignFunds(),
    big_tech_bci: buildBigTechBci(),
    pe_firms: buildPeFirms(),
    intel_defense: buildIntelDefense(),
    notable_investors: buildNotableInvestors(),
    investment_patterns: buildInvestmentPatterns(),

    // Hardware & comms
    hardware_specs: buildHardwareSpecs(),
    comms: buildComms(),

    // Governance
    neurorights: buildNeurorights(),
    controls: buildControls(),
    consent_tiers: buildConsentTiers(),
    frameworks: buildFrameworks(),
    neurosecurity_scores: buildNeurosecurityScores(),
    nsp_layers: buildNspLayers(),
    policy: buildPolicy(),

    // Ops & timeline
    validations: buildValidations(),
    automations: buildAutomations(),
    milestones: buildMilestones(),
    publications: buildPublications(),
    news: buildNews(),
    intel_feed: buildIntelFeed(),
    intel_sources: buildIntelSources(),

    // Computed analysis
    tam_sam_som: buildTamSamSom(),
    convergence: buildConvergence(),
    momentum: buildMomentum(),
    risk_profile: buildRiskProfile(),

    // Timelines (unified)
    neuroethics_timeline: buildNeuroethicsTimeline(),
    neurosecurity_timeline: buildNeurosecurityTimeline(),
    ai_ethics_timeline: buildAiEthicsTimeline(),
    industry_timeline: buildIndustryTimeline(),
    derivation_milestones: buildDerivationMilestones(),

    // New data lake sources (dynamic)
    cranial_nerves: buildCranialNerves(),
    neuroendocrine_axes: buildNeuroendocrineAxes(),
    neuroendocrine_receptors: buildNeuroendocrineReceptors(),
    glial_cells: buildGlialCells(),
    glial_markers: buildGlialMarkers(),
    bbb_proteins: buildBBB(),
    meningeal_system: buildMeningealSystem(),
    receptor_families: buildReceptorFamilies(),
    receptor_subunits: buildReceptorSubunits(),

    // NeuroSIM simulation
    neuron_types: buildNeuronTypes(),
    cortical_layers: buildCorticalLayers(),
    action_potential_phases: buildActionPotentialPhases(),
    ion_channels: buildIonChannels(),
    sim_receptors: buildSimReceptors(),
    dendritic_spines: buildDendriticSpines(),
    brain_networks: buildBrainNetworks(),
    conduction_velocities: buildConductionVelocities(),
    synapse_parameters: buildSynapseParameters(),
    oscillation_bands: buildOscillationBands(),
    white_matter_tracts: buildWhiteMatterTracts(),
    synaptic_plasticity: buildSynapticPlasticity(),
    eeg_electrodes: buildEegElectrodes(),

    // EEG sample registry (tagged datasets)
    eeg_samples: buildEegSamples(),
  };

  // Filter out empty tables — dynamic discovery
  const tables: KqlTables = {};
  for (const [name, rows] of Object.entries(allTables)) {
    if (rows.length > 0) {
      tables[name] = rows;
    }
  }

  const stats = computeStats(tables);
  _cache = { tables, stats };
  return tables;
}

/**
 * Get data lake statistics. Call after getKqlTables().
 */
export function getDataLakeStats(): DataLakeStats {
  if (!_cache) getKqlTables();
  return _cache!.stats;
}

function computeStats(tables: KqlTables): DataLakeStats {
  const byTable: Record<string, number> = {};
  let totalRows = 0;
  for (const [name, rows] of Object.entries(tables)) {
    byTable[name] = rows.length;
    totalRows += rows.length;
  }

  return {
    totalTables: Object.keys(tables).length,
    totalRows,
    byTable,
    techniques: byTable['techniques'] || 0,
    regions: byTable['brain_regions'] || 0,
    pathways: byTable['neural_pathways'] || 0,
    neurotransmitters: byTable['neurotransmitters'] || 0,
    receptorFamilies: byTable['receptor_families'] || 0,
    cranialNerves: byTable['cranial_nerves'] || 0,
    neuroendocrineAxes: byTable['neuroendocrine_axes'] || 0,
    glialCellTypes: byTable['glial_cells'] || 0,
    dsmConditions: byTable['dsm5'] || 0,
    neurologicalConditions: byTable['neurological_conditions'] || 0,
    companies: byTable['companies'] || 0,
    devices: byTable['devices'] || 0,
    neuronTypes: byTable['neuron_types'] || 0,
    oscillationBands: byTable['oscillation_bands'] || 0,
    whiteMatterTracts: byTable['white_matter_tracts'] || 0,
    eegElectrodes: byTable['eeg_electrodes'] || 0,
  };
}

/**
 * Get the list of all available table names.
 * Dashboards use this to dynamically build UI — no hardcoded sections.
 */
export function getAvailableTableNames(): string[] {
  return Object.keys(getKqlTables());
}

/**
 * Get a specific table by name. Returns empty array if not found.
 */
export function getTable(name: string): Row[] {
  return getKqlTables()[name] || [];
}
