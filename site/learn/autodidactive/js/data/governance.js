// Autodidactive — Governance & Policy Data
// Source: governance/*.md, qif-framework/GUARDRAILS.md

export const GOVERNANCE_DOCS = [
  {
    id: 'neurosecurity-governance', title: 'Neurosecurity Governance Framework',
    summary: 'Comprehensive governance framework aligned with UNESCO recommendations. Covers regulatory compliance, organizational structure, and policy requirements for neurotechnology.',
    topics: ['UNESCO alignment', 'Regulatory compliance', 'Organizational governance'],
    url: 'https://github.com/qinnovates/qinnovate/blob/main/governance/NEUROSECURITY_GOVERNANCE.md'
  },
  {
    id: 'policy-proposal', title: 'Neurosecurity Policy Proposal',
    summary: 'Six-ask proposal targeting six organizations with a phased implementation timeline. Bridges the gap between existing cybersecurity standards and emerging neural threats.',
    topics: ['FIRST/CVSS', 'MITRE CWE', 'FDA', 'IEEE', 'ISO', 'NIST'],
    url: 'https://github.com/qinnovates/qinnovate/blob/main/governance/NEUROSECURITY_POLICY_PROPOSAL.md'
  },
  {
    id: 'informed-consent', title: 'Informed Consent Framework',
    summary: 'Consent requirements for BCI users including pediatric considerations, incapacity protocols, and tiered consent models based on device invasiveness.',
    topics: ['Tiered consent', 'Pediatric considerations', 'Incapacity protocols', 'Dual-use disclosure'],
    url: 'https://github.com/qinnovates/qinnovate/blob/main/governance/INFORMED_CONSENT_FRAMEWORK.md'
  },
  {
    id: 'post-deployment', title: 'Post-Deployment Ethics',
    summary: 'Device lifecycle management, abandonment prevention, and long-term support obligations for implanted neurotechnology.',
    topics: ['Device lifecycle', 'Abandonment prevention', 'Long-term support'],
    url: 'https://github.com/qinnovates/qinnovate/blob/main/governance/POST_DEPLOYMENT_ETHICS.md'
  },
  {
    id: 'legislation-survey', title: 'Neuroethics Legislation Survey (2026)',
    summary: 'Global survey of neurotechnology legislation including Chile (first neurorights law), EU AI Act, US FDORA Section 3305, and emerging frameworks.',
    topics: ['Chile neurorights', 'EU AI Act', 'US FDORA', 'Global landscape'],
    url: 'https://github.com/qinnovates/qinnovate/blob/main/governance/NEUROETHICS_LEGISLATION_SURVEY.md'
  },
  {
    id: 'accessibility', title: 'Accessibility Standards',
    summary: 'Accessibility requirements for neurotechnology including ADA compliance, WCAG alignment, and inclusive design principles for users with disabilities.',
    topics: ['ADA compliance', 'WCAG', 'Inclusive design', 'Assistive BCI'],
    url: 'https://github.com/qinnovates/qinnovate/blob/main/governance/ACCESSIBILITY.md'
  },
  {
    id: 'data-policy', title: 'Data Policy FAQ',
    summary: 'Neural data privacy framework including user rights, data minimization, retention limits, and cross-border data flows.',
    topics: ['Neural data privacy', 'User rights', 'Data minimization', 'Retention'],
    url: 'https://github.com/qinnovates/qinnovate/blob/main/governance/DATA_POLICY_FAQ.md'
  },
  {
    id: 'transparency', title: 'Transparency & AI Disclosure',
    summary: 'QIF project transparency log including cross-AI validation sessions, human-AI collaboration audit trail, and AI disclosure compliance.',
    topics: ['AI disclosure', 'Cross-AI validation', 'Audit trail', 'Human decision log'],
    url: 'https://github.com/qinnovates/qinnovate/blob/main/governance/TRANSPARENCY.md'
  }
];

export const REGULATORY_LANDSCAPE = [
  { jurisdiction: 'Chile', year: 2021, law: 'Constitutional Amendment + Neurorights Law', scope: 'First country to constitutionally protect neurorights. Covers mental privacy, personal identity, free will, non-discrimination, equitable access.' },
  { jurisdiction: 'EU', year: 2024, law: 'EU AI Act (Articles 5, 52)', scope: 'Bans subliminal manipulation, social scoring. Requires transparency for emotion recognition. BCIs classified as high-risk AI systems.' },
  { jurisdiction: 'US', year: 2022, law: 'FDORA Section 3305 / 524B', scope: 'Cyber device requirements for medical devices. Threat modeling, vulnerability assessment, SBOM, software assurance, patch management.' },
  { jurisdiction: 'Spain', year: 2023, law: 'Digital Rights Charter', scope: 'Includes neurorights provisions. Non-binding but signals regulatory direction.' },
  { jurisdiction: 'Brazil', year: 2023, law: 'Neurorights Bill (proposed)', scope: 'Proposed constitutional protection of mental privacy and cognitive liberty.' },
  { jurisdiction: 'OECD', year: 2019, law: 'Recommendation on Responsible Innovation in Neurotechnology', scope: 'Non-binding guidelines for responsible neurotechnology development.' },
  { jurisdiction: 'UNESCO', year: 2023, law: 'Report on Neurotechnology and Human Rights', scope: 'Framework for international governance of neurotechnology.' }
];
