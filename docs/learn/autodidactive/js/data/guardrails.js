// Autodidactive — QIF Guardrails Data
// Source: shared/qif-guardrails.json + shared/qif-dsm-mappings.json

export const GUARDRAILS = [
  {
    id: 'G1', name: 'Neuromodesty', category: 'overclaim',
    author: 'Morse (2006/2011)',
    constraint: 'Neural correlates do not prove causation or eliminate agency. Neuroscience findings are routinely overclaimed when applied to law and policy.',
    violation: 'Brain activity X proves cognitive state Y',
    correct: 'Brain activity X is associated with / correlates with cognitive state Y',
    qifScope: 'NISS measures physical amplitude disruption, not "thought harm."'
  },
  {
    id: 'G2', name: 'Reverse Inference Fallacy', category: 'methodology',
    author: 'Poldrack (2006)',
    constraint: 'Brain region activation does not uniquely identify a cognitive process.',
    violation: 'Activation of X means the person is experiencing Y',
    correct: 'Activation of X is associated with multiple cognitive processes including Y',
    qifScope: 'TARA catalogs physical interference patterns, not cognitive content.'
  },
  {
    id: 'G3', name: 'Neurorealism Triad', category: 'framing',
    author: 'Racine & Illes (2005)',
    constraint: 'Brain images make claims feel more scientific (neuro-realism), reduce people to brains (neuro-essentialism), and prematurely justify policy (neuro-policy).',
    violation: 'Brain scan shows the criminal mind',
    correct: 'Brain imaging reveals structural or functional differences associated with behavior X',
    qifScope: 'QIF visualizations must not imply diagnostic capability. Data is for threat modeling, not diagnosis.'
  },
  {
    id: 'G4', name: 'Anti-Inflationism', category: 'rights',
    author: 'Ienca (2021), Bublitz (2022)',
    constraint: 'Existing human rights may cover neural data without inventing new "neurorights." Do not assume new rights are needed without showing the gap.',
    violation: 'We need entirely new neurorights because nothing protects the brain',
    correct: 'Existing rights (privacy, bodily integrity) cover much of neural data. New rights may be needed where specific gaps exist.',
    qifScope: 'NSP is a technical specification, not legislation. "NSP specifies" not "NSP requires."'
  },
  {
    id: 'G5', name: 'Conceptual Underspecification', category: 'definitions',
    author: 'Kellmeyer (2022)',
    constraint: '"Mental privacy" and "mental integrity" lack agreed operational definitions. Do not use them as settled concepts.',
    violation: 'Mental privacy is a well-defined right that...',
    correct: '"Mental privacy" (definition varies by author) refers to...',
    qifScope: 'QIF defines measurable properties (signal amplitude, frequency, coherence), not philosophically contested mental states.'
  },
  {
    id: 'G6', name: 'Brain Reading Limits', category: 'capability',
    author: 'Ienca (2018), Wexler (2019)',
    constraint: 'Current BCI cannot "read thoughts." Outputs are selected from known lists, require cooperation, and need training.',
    violation: 'BCIs can read your thoughts',
    correct: 'BCIs can decode selected signals from trained categories with user cooperation',
    qifScope: 'Every TARA technique must distinguish current vs. projected capabilities. Never present projected attacks as current threats.'
  },
  {
    id: 'G7', name: 'Dual-Use Trap', category: 'governance',
    author: 'Tennison & Moreno (2012)',
    constraint: 'Security framing of neurotech risks enabling surveillance. Pair threat descriptions with governance constraints.',
    violation: 'Here is how to attack a BCI [with no defense context]',
    correct: 'This threat technique exists. Here are the defensive controls and governance constraints.',
    qifScope: 'The threat catalog exists to inform defense, not enable attack. Every threat paired with a governance constraint.'
  },
  {
    id: 'G8', name: 'Statistical Inflation', category: 'methodology',
    author: 'Vul et al. (2009), Eklund et al. (2016)',
    constraint: 'Neuroimaging studies have high false-positive rates. Never cite fMRI correlations as strong evidence without noting methodological limitations.',
    violation: 'fMRI study proves that...',
    correct: 'fMRI study reports correlation (r=0.XX, p<0.05, uncorrected) suggesting...',
    qifScope: 'NISS scores correspond to psychiatric diagnostic categories for threat modeling, not diagnostic claims.'
  }
];

export const DSM5_CLUSTERS = [
  {
    id: 'cognitive_psychotic', label: 'Cognitive/Psychotic', color: '#f59e0b',
    bands: ['N7', 'N6', 'N4'],
    description: 'Disorders involving cognitive distortion, perceptual anomalies, or psychotic features.',
    conditions: [
      { code: 'F20.x', name: 'Schizophrenia spectrum', bands: ['N7', 'N6', 'N4'] },
      { code: 'F06.2', name: 'Psychotic disorder (medical)', bands: ['N7', 'N4'] },
      { code: 'F05', name: 'Delirium', bands: ['N7', 'N4', 'N2'] }
    ]
  },
  {
    id: 'mood_trauma', label: 'Mood/Trauma', color: '#eab308',
    bands: ['N7', 'N6', 'N5'],
    description: 'Mood disorders, PTSD, anxiety, and stress-related conditions.',
    conditions: [
      { code: 'F32.x', name: 'Major depressive disorder', bands: ['N7', 'N6', 'N5'] },
      { code: 'F31.x', name: 'Bipolar disorder', bands: ['N7', 'N6'] },
      { code: 'F43.10', name: 'PTSD', bands: ['N6', 'N7'] },
      { code: 'F41.1', name: 'Generalized anxiety', bands: ['N7', 'N6'] },
      { code: 'F42.x', name: 'OCD', bands: ['N7', 'N5', 'N6'] }
    ]
  },
  {
    id: 'motor_neurocognitive', label: 'Motor/Neurocognitive', color: '#ef4444',
    bands: ['N5', 'N3', 'N2', 'N1'],
    description: 'Movement disorders and neurocognitive decline.',
    conditions: [
      { code: 'G20', name: "Parkinson's disease", bands: ['N5', 'N3'] },
      { code: 'G35', name: 'Multiple sclerosis', bands: ['N7', 'N3', 'N1'] },
      { code: 'G40.x', name: 'Epilepsy', bands: ['N7', 'N6', 'N4'] },
      { code: 'G30', name: "Alzheimer's disease", bands: ['N7', 'N6'] }
    ]
  },
  {
    id: 'sensory_somatic', label: 'Sensory/Somatic', color: '#8b5cf6',
    bands: ['N4', 'N3', 'N2', 'N1'],
    description: 'Sensory processing disorders, pain syndromes, and somatic conditions.',
    conditions: [
      { code: 'F45.x', name: 'Somatic symptom disorder', bands: ['N7', 'N4'] },
      { code: 'G89.x', name: 'Chronic pain syndromes', bands: ['N4', 'N2', 'N1'] },
      { code: 'F44.x', name: 'Conversion disorder', bands: ['N7', 'N5', 'N1'] }
    ]
  },
  {
    id: 'autonomic_sleep', label: 'Autonomic/Sleep', color: '#06b6d4',
    bands: ['N4', 'N2'],
    description: 'Sleep-wake disorders and autonomic dysregulation.',
    conditions: [
      { code: 'G47.x', name: 'Sleep-wake disorders', bands: ['N4', 'N2'] },
      { code: 'G90.x', name: 'Autonomic dysfunction', bands: ['N2'] }
    ]
  }
];

export const NEURORIGHTS = [
  { id: 'MP', name: 'Mental Privacy', description: 'Right to keep neural data private. Protection against unauthorized access to brain signals.', techniques: 64, source: 'Ienca & Andorno 2017' },
  { id: 'CL', name: 'Cognitive Liberty', description: 'Right to freedom of thought and cognitive self-determination. Protection against coerced cognitive modification.', techniques: 60, source: 'Ienca & Andorno 2017' },
  { id: 'MI', name: 'Mental Integrity', description: 'Right to protection from unauthorized neural manipulation or interference.', techniques: 81, source: 'Ienca & Andorno 2017' },
  { id: 'PC', name: 'Psychological Continuity', description: 'Right to preserve personal identity and sense of self over time.', techniques: 28, source: 'Ienca & Andorno 2017' },
  { id: 'EA', name: 'Equal Access', description: 'Right to equitable access to neurotechnology benefits regardless of socioeconomic status.', techniques: null, source: 'Chile Neurorights Law 2021' },
  { id: 'DI', name: 'Dynamical Integrity', description: 'Protection of neural homeodynamics in feedback therapies. QIF-proposed extension.', techniques: null, source: 'QIF (proposed)' },
  { id: 'IDA', name: 'Informational Disassociation', description: 'Right not to have neural data fused across modalities without consent. QIF-proposed extension.', techniques: null, source: 'QIF (proposed)' }
];
