/**
 * Neurosecurity GRC Convergence Data
 *
 * Structured data powering the convergence gap analysis on /neurogovernance/
 * and the companion governance doc NEUROSECURITY_GRC_CONVERGENCE.md.
 *
 * Source of truth for: governing bodies, convergence gaps, framework lessons,
 * and predecessor research in BCI security.
 */

// ─── Types ──────────────────────────────────────────────────────────────────

export type Domain = 'security' | 'neuroethics' | 'medical' | 'policy';
export type OrgType = 'standards' | 'regulatory' | 'certification' | 'industry' | 'academic' | 'advocacy';
export type EngagementLevel = 'none' | 'minimal' | 'indirect' | 'direct' | 'comprehensive';
export type BridgePotential = 'low' | 'medium' | 'high';

export interface GoverningBody {
  id: string;
  name: string;
  domain: Domain;
  type: OrgType;
  produces: string[];
  neurotechEngagement: EngagementLevel;
  securityEngagement: EngagementLevel;
  bridgePotential: BridgePotential;
  gap: string;
  convergenceAsk: string;
}

export interface ConvergenceGap {
  id: string;
  property: string;
  existingAnalog: string;
  neuralDifference: string;
  coveredBy: string[];
  qifSolution: string;
}

export interface FrameworkLesson {
  framework: string;
  lesson: string;
  applicability: string;
}

export interface PredecessorResearch {
  authors: string;
  year: number;
  title: string;
  venue: string;
  contribution: string;
  whatQifAdds: string;
}

// ─── Engagement Level Metadata ──────────────────────────────────────────────

export const ENGAGEMENT_COLORS: Record<EngagementLevel, string> = {
  none: '#ef4444',
  minimal: '#f97316',
  indirect: '#eab308',
  direct: '#22c55e',
  comprehensive: '#3b82f6',
};

export const ENGAGEMENT_LABELS: Record<EngagementLevel, string> = {
  none: 'None',
  minimal: 'Minimal',
  indirect: 'Indirect',
  direct: 'Direct',
  comprehensive: 'Comprehensive',
};

// ─── A. Governing Bodies ────────────────────────────────────────────────────

export const GOVERNING_BODIES: GoverningBody[] = [
  // === Security Side ===
  {
    id: 'nist',
    name: 'NIST',
    domain: 'security',
    type: 'standards',
    produces: ['SP 800 series', 'CSF 2.0', 'PQC standards'],
    neurotechEngagement: 'none',
    securityEngagement: 'comprehensive',
    bridgePotential: 'high',
    gap: 'No BCI security profile. CSF 2.0 categories are device-agnostic but lack neural-specific subcategories.',
    convergenceAsk: 'Develop a BCI security profile for CSF 2.0 with neural integrity and cognitive confidentiality subcategories.',
  },
  {
    id: 'iso-iec',
    name: 'ISO/IEC',
    domain: 'security',
    type: 'standards',
    produces: ['ISO 27001', 'ISO 27002', 'ISO 27799'],
    neurotechEngagement: 'none',
    securityEngagement: 'comprehensive',
    bridgePotential: 'medium',
    gap: 'ISO 27799 covers health informatics but treats neural data as generic PHI. No neural data classification.',
    convergenceAsk: 'Add neural data classification tiers to ISO 27799 and publish a BCI security technical report.',
  },
  {
    id: 'ieee-sa',
    name: 'IEEE SA',
    domain: 'security',
    type: 'standards',
    produces: ['P2794', 'P7700 series'],
    neurotechEngagement: 'indirect',
    securityEngagement: 'comprehensive',
    bridgePotential: 'high',
    gap: 'P7700 covers neurotechnology ethics but not cybersecurity. No BCI security standard exists.',
    convergenceAsk: 'Produce a BCI cybersecurity standard (P27XX) bridging P7700 ethics with 802-series security.',
  },
  {
    id: 'mitre',
    name: 'MITRE',
    domain: 'security',
    type: 'standards',
    produces: ['ATT&CK', 'CVE', 'CWE', 'D3FEND'],
    neurotechEngagement: 'none',
    securityEngagement: 'comprehensive',
    bridgePotential: 'high',
    gap: 'No ATT&CK sub-matrix for neural devices. No BCI-specific CVEs (except LSL, disclosed Feb 2026).',
    convergenceAsk: 'Create an ATT&CK sub-matrix for neural devices using TARA as seed taxonomy.',
  },
  {
    id: 'first-cvss',
    name: 'FIRST/CVSS',
    domain: 'security',
    type: 'standards',
    produces: ['CVSS v4.0', 'EPSS'],
    neurotechEngagement: 'none',
    securityEngagement: 'comprehensive',
    bridgePotential: 'high',
    gap: 'CVSS has no neural impact metrics. Cannot score biological harm, cognitive integrity loss, or reversibility.',
    convergenceAsk: 'Extend CVSS with neural impact metrics using NISS as reference model.',
  },
  {
    id: 'owasp',
    name: 'OWASP',
    domain: 'security',
    type: 'industry',
    produces: ['Top 10', 'ASVS', 'IoT Top 10'],
    neurotechEngagement: 'none',
    securityEngagement: 'comprehensive',
    bridgePotential: 'medium',
    gap: 'IoT Top 10 applies to BCI wireless but misses neural-specific attack surfaces.',
    convergenceAsk: 'Publish a "BCI Security Top 10" extending IoT Top 10 with neural attack categories.',
  },
  {
    id: 'iec-62443',
    name: 'IEC 62443',
    domain: 'security',
    type: 'standards',
    produces: ['OT/ICS security zones and conduits'],
    neurotechEngagement: 'none',
    securityEngagement: 'comprehensive',
    bridgePotential: 'medium',
    gap: 'Closest architectural parallel (zones/conduits = hourglass bands) but assumes industrial endpoints, not biological.',
    convergenceAsk: 'Map IEC 62443 zones to BCI security boundaries. Biological endpoints need their own security level.',
  },
  {
    id: 'cisa',
    name: 'CISA',
    domain: 'security',
    type: 'regulatory',
    produces: ['KEV catalog', 'advisories', 'BODs'],
    neurotechEngagement: 'none',
    securityEngagement: 'comprehensive',
    bridgePotential: 'medium',
    gap: 'Medical device advisories exist but no neural device threat intelligence program.',
    convergenceAsk: 'Include neural devices in critical infrastructure threat monitoring. BCI = healthcare + comms.',
  },
  {
    id: 'enisa',
    name: 'ENISA',
    domain: 'security',
    type: 'regulatory',
    produces: ['Threat Landscape', 'guidelines', 'certifications'],
    neurotechEngagement: 'minimal',
    securityEngagement: 'comprehensive',
    bridgePotential: 'medium',
    gap: 'Published a health sector threat landscape but treats neural devices as generic IoMT.',
    convergenceAsk: 'Develop a neurotechnology threat landscape report. EU AI Act intersects with neural data.',
  },
  {
    id: 'isc2',
    name: 'ISC2',
    domain: 'security',
    type: 'certification',
    produces: ['CISSP', 'CCSP', 'code of ethics'],
    neurotechEngagement: 'none',
    securityEngagement: 'comprehensive',
    bridgePotential: 'low',
    gap: 'No neurosecurity domain in any certification. No CBK coverage of BCI or neural data.',
    convergenceAsk: 'Add a neurosecurity elective domain to CISSP or create a neurosecurity specialization.',
  },
  {
    id: 'isaca',
    name: 'ISACA',
    domain: 'security',
    type: 'certification',
    produces: ['COBIT', 'CISM', 'CRISC'],
    neurotechEngagement: 'none',
    securityEngagement: 'comprehensive',
    bridgePotential: 'low',
    gap: 'COBIT governance framework has no neurotechnology controls. CRISC has no neural risk categories.',
    convergenceAsk: 'Extend COBIT with neurotechnology governance objectives and neural risk factors.',
  },
  {
    id: 'pci-ssc',
    name: 'PCI SSC',
    domain: 'security',
    type: 'certification',
    produces: ['PCI DSS', 'PA-DSS'],
    neurotechEngagement: 'none',
    securityEngagement: 'comprehensive',
    bridgePotential: 'low',
    gap: 'Model for prescriptive compliance but focused on payment cards. No neural data equivalent.',
    convergenceAsk: 'Study PCI DSS compliance levels as a model for neurosecurity certification tiers.',
  },

  // === Neuroethics Side ===
  {
    id: 'unesco',
    name: 'UNESCO',
    domain: 'neuroethics',
    type: 'standards',
    produces: ['Recommendation on Neurotechnology (2025)', 'AI Ethics (2021)'],
    neurotechEngagement: 'comprehensive',
    securityEngagement: 'none',
    bridgePotential: 'high',
    gap: 'Strong on rights and principles. Zero technical security guidance. No threat models.',
    convergenceAsk: 'Partner with NIST/ISO to produce a technical annex with security controls for each recommendation.',
  },
  {
    id: 'oecd',
    name: 'OECD',
    domain: 'neuroethics',
    type: 'standards',
    produces: ['Neurotechnology Principles (2024)', 'AI Principles (2019)'],
    neurotechEngagement: 'direct',
    securityEngagement: 'indirect',
    bridgePotential: 'high',
    gap: 'Has both cybersecurity and neurotechnology committees. They do not collaborate.',
    convergenceAsk: 'Connect the OECD cybersecurity committee with the neurotechnology committee for a joint working paper.',
  },
  {
    id: 'neurorights-foundation',
    name: 'Neurorights Foundation',
    domain: 'neuroethics',
    type: 'advocacy',
    produces: ['5 neurorights framework', 'Chile legislation support'],
    neurotechEngagement: 'comprehensive',
    securityEngagement: 'none',
    bridgePotential: 'medium',
    gap: 'Defines rights beautifully. No mechanism to enforce them technically. No threat model.',
    convergenceAsk: 'Map each neuroright to technical security controls. QIF provides the mapping; they bring legitimacy.',
  },
  {
    id: 'ins',
    name: 'International Neuroethics Society',
    domain: 'neuroethics',
    type: 'academic',
    produces: ['Neuroethics journal', 'annual meeting'],
    neurotechEngagement: 'comprehensive',
    securityEngagement: 'none',
    bridgePotential: 'medium',
    gap: 'Academic society focused on ethics, philosophy, and policy. No cybersecurity researchers in membership.',
    convergenceAsk: 'Host a joint session with security researchers at the annual meeting. Bridge the vocabulary gap.',
  },
  {
    id: 'bci-society',
    name: 'BCI Society',
    domain: 'neuroethics',
    type: 'academic',
    produces: ['BCI Journal', 'Graz BCI Conference'],
    neurotechEngagement: 'comprehensive',
    securityEngagement: 'minimal',
    bridgePotential: 'medium',
    gap: 'Focused on BCI performance and clinical outcomes. Security papers are rare at Graz.',
    convergenceAsk: 'Add a security track to the BCI Conference. Encourage security-focused submissions.',
  },
  {
    id: 'berman-institute',
    name: 'Berman Institute (JHU)',
    domain: 'neuroethics',
    type: 'academic',
    produces: ['BCI ethics research', 'seminars', 'policy recommendations'],
    neurotechEngagement: 'direct',
    securityEngagement: 'none',
    bridgePotential: 'medium',
    gap: 'Leading BCI ethics research. Device abandonment, consent frameworks. No security angle.',
    convergenceAsk: 'Collaborate on security implications of device abandonment and neural data lifecycle.',
  },

  // === Medical/Regulatory ===
  {
    id: 'fda-cdrh',
    name: 'FDA/CDRH',
    domain: 'medical',
    type: 'regulatory',
    produces: ['510(k)', 'PMA', 'Guidance 524B', 'FDORA Sec. 3305'],
    neurotechEngagement: 'direct',
    securityEngagement: 'indirect',
    bridgePotential: 'high',
    gap: 'FDORA Sec. 3305 mandates patching but not neural-specific threat categories. 524B is device-generic.',
    convergenceAsk: 'Add neural-specific threat categories to 524B guidance. Require NISS-style scoring for BCI submissions.',
  },
  {
    id: 'eu-mdr',
    name: 'EU MDR/EMA',
    domain: 'medical',
    type: 'regulatory',
    produces: ['EU MDR 2017/745', 'MDCG guidance'],
    neurotechEngagement: 'indirect',
    securityEngagement: 'indirect',
    bridgePotential: 'medium',
    gap: 'Software as Medical Device (SaMD) guidance exists but no neural data classification. Intersects with EU AI Act.',
    convergenceAsk: 'Classify neural data under EU AI Act high-risk categories. Align MDR cybersecurity with neural risks.',
  },
  {
    id: 'chile',
    name: 'Chile (Law 21.383)',
    domain: 'policy',
    type: 'regulatory',
    produces: ['Constitutional neuroright amendment', 'neurotechnology data law'],
    neurotechEngagement: 'comprehensive',
    securityEngagement: 'none',
    bridgePotential: 'medium',
    gap: 'First country to constitutionalize neurorights. No technical enforcement mechanism. No security standards.',
    convergenceAsk: 'Develop technical standards to operationalize the constitutional amendment.',
  },
  {
    id: 'us-states',
    name: 'Colorado/California',
    domain: 'policy',
    type: 'regulatory',
    produces: ['Colorado SB 24-058', 'California AB-1008'],
    neurotechEngagement: 'direct',
    securityEngagement: 'none',
    bridgePotential: 'low',
    gap: 'Privacy-focused legislation. Defines neural data as sensitive but no security requirements.',
    convergenceAsk: 'Reference neurosecurity frameworks in implementing regulations.',
  },

  // === Bridgers ===
  {
    id: 'ieee-brain',
    name: 'IEEE Brain Initiative',
    domain: 'security',
    type: 'industry',
    produces: ['Standards roadmap', 'working groups'],
    neurotechEngagement: 'direct',
    securityEngagement: 'indirect',
    bridgePotential: 'high',
    gap: 'Active in both domains but no dedicated security working group.',
    convergenceAsk: 'Launch a BCI cybersecurity working group under IEEE Brain.',
  },
  {
    id: 'darpa',
    name: 'DARPA',
    domain: 'security',
    type: 'regulatory',
    produces: ['N3 program', 'SUBNETS', 'RAM'],
    neurotechEngagement: 'comprehensive',
    securityEngagement: 'comprehensive',
    bridgePotential: 'high',
    gap: 'Funds both BCI development and cybersecurity. Programs are siloed. No BCI security program.',
    convergenceAsk: 'Fund a dedicated BCI cybersecurity research program bridging neurotech and security portfolios.',
  },
  {
    id: 'eff',
    name: 'EFF',
    domain: 'policy',
    type: 'advocacy',
    produces: ['Policy analysis', 'legal advocacy', 'security research'],
    neurotechEngagement: 'minimal',
    securityEngagement: 'direct',
    bridgePotential: 'medium',
    gap: 'Strong on digital rights and security advocacy. Limited neurotechnology coverage.',
    convergenceAsk: 'Extend digital rights advocacy to neural data. Publish a neurorights position paper.',
  },
];

// ─── B. Convergence Gaps ────────────────────────────────────────────────────

export const CONVERGENCE_GAPS: ConvergenceGap[] = [
  {
    id: 'neural-impact-scoring',
    property: 'Neural impact severity scoring',
    existingAnalog: 'CVSS scores vulnerability severity on a 0-10 scale with exploitability and impact metrics.',
    neuralDifference: 'Cannot express biological harm, cognitive integrity loss, reversibility of neural damage, or neuroplasticity risk. A CVSS 9.8 web exploit and a CVSS 9.8 BCI exploit that causes permanent cognitive deficit are treated identically.',
    coveredBy: ['FIRST/CVSS (partially)'],
    qifSolution: 'NISS adds 5 neural-specific dimensions: biological impact, cognitive integrity, consent violation, reversibility, and neuroplasticity risk. Every TARA technique is scored on dimensions CVSS cannot express.',
  },
  {
    id: 'neural-threat-taxonomy',
    property: 'BCI-specific threat taxonomy',
    existingAnalog: 'MITRE ATT&CK catalogs 594 enterprise techniques across 14 tactics.',
    neuralDifference: 'No neural injection, cognitive exfiltration, neurostimulation manipulation, or signal dynamics disruption in any MITRE matrix. Neural attacks have no TTP classification.',
    coveredBy: ['MITRE ATT&CK (structure only)'],
    qifSolution: 'TARA provides 109 BCI techniques across 15 tactics with MITRE-compatible IDs and dual-use therapeutic mappings.',
  },
  {
    id: 'biological-endpoint-security',
    property: 'Biological endpoint protection',
    existingAnalog: 'IEC 62443 zones/conduits model segments OT networks into security zones with defined trust boundaries.',
    neuralDifference: 'Assumes industrial process endpoints (PLCs, HMIs). No guidance for when a security incident causes neurological harm. The "endpoint" is a human brain.',
    coveredBy: ['IEC 62443 (architecture only)'],
    qifSolution: 'QIF 11-band hourglass traces from brain (N7) through interface (I0) to external systems (S3). Every band is a security zone with biology-first controls.',
  },
  {
    id: 'neurorights-enforcement',
    property: 'Technical enforcement of neurorights',
    existingAnalog: 'Privacy rights enforced via RBAC, encryption, access logs, DLP. GDPR Art. 25 mandates privacy by design.',
    neuralDifference: 'Neurorights (cognitive liberty, mental privacy, mental integrity, psychological continuity, fair augmentation) exist as principles but have no technical controls, no audit criteria, and no compliance tests.',
    coveredBy: ['Neurorights Foundation (principles)', 'Chile (constitutional)', 'UNESCO (recommendations)'],
    qifSolution: 'QIF maps each neuroright to specific hourglass bands, TARA techniques, and NISS thresholds. Technical controls for each right.',
  },
  {
    id: 'neural-data-classification',
    property: 'Neural data sensitivity classification',
    existingAnalog: 'Data classification tiers (public, internal, confidential, restricted) in ISO 27001. HIPAA PHI categories.',
    neuralDifference: 'Neural data encodes thoughts, emotions, intentions, and medical conditions simultaneously. A single EEG recording can reveal psychiatric diagnoses, cognitive state, and biometric identity. No classification scheme captures this.',
    coveredBy: ['HIPAA (as generic PHI)', 'GDPR Art. 9 (as biometric)'],
    qifSolution: 'Neural data classified by band origin (N7 cortical = highest sensitivity), temporal resolution, and inference potential. Classification drives encryption and access controls.',
  },
  {
    id: 'dual-use-governance',
    property: 'Dual-use therapeutic/attack classification',
    existingAnalog: 'Wassenaar Arrangement for conventional arms. Export controls for cryptography. DARPA dual-use research policies.',
    neuralDifference: 'Every therapeutic neurostimulation technique is also an attack vector. DBS for Parkinson is the same hardware path as forced motor control. TMS for depression uses the same physics as cognitive disruption. No framework classifies the dual-use boundary.',
    coveredBy: ['FDA (therapeutic side only)'],
    qifSolution: 'TARA classifies every technique as attack, therapeutic, or dual-use. Dual-use techniques require additional safeguards and informed consent documentation.',
  },
  {
    id: 'post-quantum-neural',
    property: 'Post-quantum protection for neural data',
    existingAnalog: 'NIST PQC standards (ML-KEM, ML-DSA). TLS 1.3 with hybrid key exchange.',
    neuralDifference: 'Neural data has decades-long sensitivity (lifetime of the patient). Harvest-now-decrypt-later is an existential threat for BCIs. No BCI wire protocol uses PQC.',
    coveredBy: ['NIST PQC (algorithms only)'],
    qifSolution: 'NSP (Neural Security Protocol) implements ML-KEM + ML-DSA with a 6-layer validation stack and physics-based signal authenticity.',
  },
];

// ─── C. Framework Lessons ───────────────────────────────────────────────────

export const FRAMEWORK_LESSONS: FrameworkLesson[] = [
  {
    framework: 'PCI DSS',
    lesson: 'Prescriptive controls with compliance levels scaled by transaction volume drove universal adoption in payment card security, even without government mandate.',
    applicability: 'Neurosecurity needs prescriptive controls scaled by device invasiveness. An EEG headband has different requirements than an intracortical implant, just as a small merchant has different PCI requirements than a payment processor.',
  },
  {
    framework: 'MITRE ATT&CK',
    lesson: 'A community-driven, free, open taxonomy became the universal language for threat intelligence because it described what adversaries actually do, not what vendors sell.',
    applicability: 'TARA follows the same model: MITRE-compatible IDs, open taxonomy, technique-level granularity. The BCI security community needs a shared vocabulary before it can coordinate defense.',
  },
  {
    framework: 'NIST CSF',
    lesson: 'A voluntary framework achieved near-universal adoption through market pressure (customers, insurers, investors required it) rather than legal mandate.',
    applicability: 'Neurosecurity GRC will likely follow the same path: voluntary adoption driven by institutional review boards, insurers, and research ethics committees before any government mandate exists.',
  },
  {
    framework: 'IEC 62443',
    lesson: 'The zones/conduits model successfully bridged IT and OT security by defining trust boundaries at physical interfaces rather than network layers.',
    applicability: 'QIF\'s hourglass model applies the same principle: define security boundaries at the physical neural interface (I0) rather than at arbitrary network layers. Biology-first segmentation.',
  },
];

// ─── D. Predecessor Research ────────────────────────────────────────────────

export const PREDECESSOR_RESEARCH: PredecessorResearch[] = [
  {
    authors: 'Denning, Matsuoka, Kohno',
    year: 2009,
    title: 'Neurosecurity: Security and Privacy for Neural Devices',
    venue: 'Neurosurgical Focus',
    contribution: 'First paper to frame BCI security as a distinct research area. Coined "neurosecurity." Identified brain-computer interface trust model.',
    whatQifAdds: 'QIF provides the engineering framework Denning called for: quantified threat scoring, architectural model, and wire protocol.',
  },
  {
    authors: 'Martinovic, Davies, Frank, Perito, Ros, Song',
    year: 2012,
    title: 'On the Feasibility of Side-Channel Attacks with Brain-Computer Interfaces',
    venue: 'USENIX Security',
    contribution: 'Demonstrated that consumer EEG can leak private information (PINs, bank details, location) via P300 evoked responses.',
    whatQifAdds: 'TARA catalogs this as T1001 (Cognitive State Inference) with NISS severity scoring. QIF adds detection via coherence monitoring and defense via signal authentication.',
  },
  {
    authors: 'Bonaci, Calo, Chizeck',
    year: 2014,
    title: 'App Stores for the Brain: Privacy and Security in Brain-Computer Interfaces',
    venue: 'IEEE Ethics in Engineering, Science and Technology',
    contribution: 'Identified the "app store" threat model for BCIs: third-party applications with neural data access. Proposed BCI anonymizer.',
    whatQifAdds: 'QIF extends with multi-band isolation (apps limited to specific hourglass bands), neural data classification, and consent-per-band access controls.',
  },
  {
    authors: 'Bernal, Cammack, Peaceful',
    year: 2021,
    title: 'A Framework and Taxonomy of Attacks on Brain-Computer Interfaces',
    venue: 'arXiv preprint',
    contribution: 'Most comprehensive BCI attack taxonomy before TARA. Organized attacks by confidentiality, integrity, and availability.',
    whatQifAdds: 'TARA extends from their CIA foundation to 109 techniques with NISS scoring, dual-use classification, and DSM-5-TR psychiatric impact mappings.',
  },
  {
    authors: 'Schroder',
    year: 2025,
    title: 'Consumer BCI Security Assessment',
    venue: 'Independent research',
    contribution: 'Practical security assessment of commercial BCI devices. Identified real-world vulnerabilities in consumer products.',
    whatQifAdds: 'QIF provides the scoring framework (NISS) and architectural model (hourglass) to systematically evaluate the vulnerabilities Schroder identifies.',
  },
  {
    authors: 'Landau',
    year: 2020,
    title: 'Neural Data Privacy: Progress and Challenges',
    venue: 'Science',
    contribution: 'Connected neural data privacy to broader surveillance debates. Argued for neural data as a special category requiring unique protections.',
    whatQifAdds: 'QIF operationalizes Landau\'s arguments with technical controls: neural data classification by band, encryption requirements, and access control frameworks.',
  },
];

// ─── Helper Functions ───────────────────────────────────────────────────────

export function getBodiesByDomain(domain: Domain): GoverningBody[] {
  return GOVERNING_BODIES.filter(b => b.domain === domain);
}

export function getHighBridgeBodies(): GoverningBody[] {
  return GOVERNING_BODIES.filter(b => b.bridgePotential === 'high');
}

export function getBodyById(id: string): GoverningBody | undefined {
  return GOVERNING_BODIES.find(b => b.id === id);
}
