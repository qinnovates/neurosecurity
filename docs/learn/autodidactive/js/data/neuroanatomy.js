// QIF Neuroanatomy — 11-band hourglass mapped to brain structures
// Source: QIF Brain-BCI Atlas v1.2.0 (Kandel et al. 2021)
// Status: Proposed framework mapping, not an adopted standard

export const QIF_BANDS = [
  {
    id: 'N7', name: 'Neocortex', zone: 'neural', color: '#166534',
    emoji: '🧠',
    structures: ['Prefrontal Cortex (PFC)', 'Primary Motor Cortex (M1)', 'Primary Visual Cortex (V1)', 'Primary Somatosensory (S1)', 'Broca\'s Area', 'Wernicke\'s Area'],
    determinacy: 'Quantum Uncertain',
    severity: 'HIGH (cognitive)',
    function: 'Executive function, motor planning, sensory integration, language production and comprehension. The most complex neural band.',
    qifRationale: 'Highest cortical processing sits at the top of the hourglass because it represents the most indeterminate, information-rich layer. Attacks here affect cognition, decision-making, and identity. The widest threat surface in the neural stack.',
    keyFact: 'The neocortex is only 2-4mm thick but contains roughly 16 billion neurons and handles everything that makes us distinctly human.',
    oscillations: ['Theta (4-8 Hz)', 'Alpha (8-13 Hz)', 'Beta (13-30 Hz)', 'Gamma (30-100 Hz)']
  },
  {
    id: 'N6', name: 'Limbic System', zone: 'neural', color: '#3a7d44',
    emoji: '💚',
    structures: ['Hippocampus', 'Amygdala (BLA + CeA)', 'Anterior Cingulate Cortex (ACC)', 'Insula'],
    determinacy: 'Chaotic to Quantum Uncertain',
    severity: 'SEVERE (emotional/memory)',
    function: 'Emotion regulation, memory formation, fear conditioning, interoception. Bridges cognitive and autonomic processing.',
    qifRationale: 'Mapped to N6 because limbic structures process information less deterministically than lower bands but more predictably than cortex. Compromise here affects memory consolidation and emotional regulation, corresponding to clinical conditions like PTSD and anxiety disorders (for threat modeling purposes).',
    keyFact: 'The hippocampus is one of only two brain regions where new neurons are born throughout life (adult neurogenesis). It is also the first structure damaged in Alzheimer\'s disease.',
    oscillations: ['Theta (4-8 Hz)', 'Sharp-wave ripples (80-120 Hz)']
  },
  {
    id: 'N5', name: 'Basal Ganglia', zone: 'neural', color: '#5c7a38',
    emoji: '🔄',
    structures: ['Striatum (Caudate + Putamen)', 'Subthalamic Nucleus (STN)', 'Substantia Nigra', 'Globus Pallidus'],
    determinacy: 'Chaotic',
    severity: 'SEVERE (motor selection)',
    function: 'Motor selection, habit formation, reward processing, action initiation and suppression.',
    qifRationale: 'The primary target of deep brain stimulation (DBS) for Parkinson\'s disease. Mapped to N5 because its dynamics are chaotic but bounded. DBS devices directly modulate this band, making it a high-priority security boundary for implanted BCIs.',
    keyFact: 'The subthalamic nucleus (STN) is smaller than a pea but is the main DBS target. Over 200,000 people worldwide have electrodes implanted here.',
    oscillations: ['Beta (13-30 Hz, pathological in Parkinson\'s)', 'Gamma bursts']
  },
  {
    id: 'N4', name: 'Diencephalon', zone: 'neural', color: '#72772f',
    emoji: '🚦',
    structures: ['Thalamus', 'Hypothalamus', 'Lateral Geniculate Nucleus (LGN)', 'Medial Geniculate Nucleus (MGN)'],
    determinacy: 'Stochastic to Chaotic',
    severity: 'CRITICAL (relay/gating)',
    function: 'Thalamic relay and gating of all ascending sensory traffic. Hypothalamic homeostasis (temperature, hunger, circadian rhythm).',
    qifRationale: 'QIF calls this "the brain\'s firewall layer." Every sensory signal except smell passes through the thalamus before reaching cortex. Compromising this band means controlling what information the brain receives. The thalamus is the natural access-control checkpoint.',
    keyFact: 'The thalamus processes roughly 11 million bits of sensory information per second but only passes about 50 bits to conscious awareness. It is the ultimate information filter.',
    oscillations: ['Sleep spindles (12-14 Hz)', 'Alpha relay (8-13 Hz)']
  },
  {
    id: 'N3', name: 'Cerebellum', zone: 'neural', color: '#877226',
    emoji: '🎯',
    structures: ['Cerebellar Cortex', 'Deep Cerebellar Nuclei', 'Purkinje Cells'],
    determinacy: 'Stochastic',
    severity: 'HIGH (coordination)',
    function: 'Motor coordination, timing, error correction, procedural learning. Processes movement predictions in real time.',
    qifRationale: 'Contains over 50% of the brain\'s neurons but operates with more predictable dynamics than cortex. Mapped to N3 because its error-correction circuits are stochastic but well-characterized. Relevant for BCIs targeting motor rehabilitation.',
    keyFact: 'The cerebellum has roughly 69 billion neurons (more than the rest of the brain combined) packed into just 10% of brain volume. Purkinje cells are the largest neurons in the body.',
    oscillations: ['Complex spike patterns', 'Cerebellar oscillations (4-25 Hz)']
  },
  {
    id: 'N2', name: 'Brainstem', zone: 'neural', color: '#9b6c1e',
    emoji: '❤️',
    structures: ['Medulla Oblongata', 'Pons', 'Midbrain (Tectum + Tegmentum)', 'Reticular Formation'],
    determinacy: 'Stochastic',
    severity: 'LETHAL (vital functions)',
    function: 'Vital functions: respiration, heart rate, blood pressure, arousal, sleep-wake cycles. Compromise is life-threatening.',
    qifRationale: 'Mapped to N2 because brainstem circuits are the most critical-to-life in the neural stack. Any BCI that affects brainstem function crosses into safety-of-life territory. QIF assigns the highest severity rating here because disruption can be fatal.',
    keyFact: 'A brainstem lesion the size of a pencil tip can cause death, coma, or locked-in syndrome. It controls every breath you take without conscious effort.',
    oscillations: ['Respiratory rhythm (0.2-0.5 Hz)', 'Cardiac oscillations']
  },
  {
    id: 'N1', name: 'Spinal Cord', zone: 'neural', color: '#ae6616',
    emoji: '⚡',
    structures: ['Cervical Segments (C1-C8)', 'Thoracic Segments (T1-T12)', 'Lumbar Segments (L1-L5)', 'Sacral Segments (S1-S5)'],
    determinacy: 'Stochastic',
    severity: 'HIGH (motor/sensory)',
    function: 'Motor output and sensory input pathway. Local reflex arcs. The lowest neural band in the hourglass.',
    qifRationale: 'The bottom of the neural stack. Spinal cord BCIs (e.g., Onward Medical) target motor restoration for paralysis. Mapped to N1 because signals here are the most deterministic in the neural zone, closest to the interface boundary.',
    keyFact: 'Spinal reflexes operate in 1-2 milliseconds, faster than conscious thought. The spinal cord is only about 45cm long but carries every motor and sensory signal between brain and body.',
    oscillations: ['Motor neuron firing patterns', 'Reflex arcs (1-2ms)']
  },
  {
    id: 'I0', name: 'Neural Interface', zone: 'interface', color: '#f59e0b',
    emoji: '⚙️',
    structures: ['Electrode-Tissue Boundary', 'Measurement Transducer', 'Signal Collapse Point'],
    determinacy: 'Quasi-quantum',
    severity: 'CRITICAL (measurement/collapse)',
    function: 'Where biological signals become electronic signals (and vice versa). The physical bottleneck of the hourglass.',
    qifRationale: 'The hourglass narrows to its thinnest point here. I0 is where neural state space collapses into measurable data. This is the most security-critical boundary because it is the single point where biology meets silicon. Every attack and every defense must transit through I0.',
    keyFact: 'The electrode-tissue interface introduces impedance that changes over time as the body reacts to the implant (glial scarring). Signal quality degrades within weeks to months.',
    oscillations: ['Impedance spectrum (1 Hz - 100 kHz)']
  },
  {
    id: 'S1', name: 'Analog Front-End', zone: 'silicon', color: '#93c5fd',
    emoji: '📡',
    structures: ['Analog Amplifiers', 'Bandpass Filters', 'ADC/DAC Converters'],
    determinacy: 'Stochastic (analog noise)',
    severity: 'MEDIUM (signal integrity)',
    function: 'Amplification, filtering, and analog-to-digital conversion. Analog noise introduces residual stochasticity.',
    qifRationale: 'First silicon band above the interface. Still has stochastic properties due to thermal noise in analog circuits. Signal integrity attacks here (e.g., electromagnetic interference) can corrupt neural data before it reaches digital processing.',
    keyFact: 'Neural signals are measured in microvolts (1-100 uV). The amplifier must boost them by 1,000-10,000x while rejecting 60 Hz power line noise that is millions of times stronger.',
    oscillations: ['Sampling rate (250 Hz - 30 kHz depending on device)']
  },
  {
    id: 'S2', name: 'Digital Processing', zone: 'silicon', color: '#60a5fa',
    emoji: '💻',
    structures: ['Decoding Algorithms', 'Signal Classification', 'Digital Filters', 'On-Device Firmware'],
    determinacy: 'Deterministic',
    severity: 'MEDIUM (algorithm integrity)',
    function: 'Digital signal processing, feature extraction, neural decoding. Fully deterministic computation.',
    qifRationale: 'Classical cybersecurity territory begins here. Deterministic code means traditional vulnerability analysis applies (buffer overflows, firmware exploits). Mapped to S2 because it is the computational core between raw signal and user-facing application.',
    keyFact: 'Modern BCI decoders use machine learning models trained on each individual\'s brain patterns. An adversarial attack on the model could misclassify "stop" as "go."',
    oscillations: []
  },
  {
    id: 'S3', name: 'Application Layer', zone: 'silicon', color: '#3b82f6',
    emoji: '🌐',
    structures: ['Clinical Software', 'User Interface', 'Data Storage', 'Network / Cloud'],
    determinacy: 'Deterministic',
    severity: 'LOW-MEDIUM (software)',
    function: 'Clinical software, data storage, network transmission. The outermost silicon band.',
    qifRationale: 'The widest band at the silicon end of the hourglass. Standard IT security domain (encryption, access control, patching). Mapped to S3 because it is the furthest from biology but the most exposed to network-based attacks.',
    keyFact: 'BCI data transmitted over Bluetooth Low Energy has been shown to be interceptable within 10 meters. Most consumer EEG headsets have no encryption at all.',
    oscillations: []
  }
];

export const HOURGLASS_EXPLAINER = {
  title: 'The QIF Hourglass: Why 7-1-3?',
  description: 'QIF maps the full brain-computer interface stack as an hourglass with 7 neural bands, 1 interface band, and 3 silicon bands. Neural bands widen at the top (more complex, less deterministic). Silicon bands widen at the bottom (more exposed, fully deterministic). The interface band I0 is the bottleneck where biology meets machine.',
  status: 'Proposed framework (QIF v4.0). Not an adopted standard. Based on neuroanatomical consensus (Kandel et al. 2021) with security-specific mapping by Kevin Qi.',
  keyPrinciple: 'The hourglass shape reflects the determinacy spectrum: neural systems at the top are indeterminate and unpredictable, silicon systems at the bottom are fully deterministic and auditable. Security approaches must differ across this spectrum because you cannot apply the same threat model to a neuron and a microchip.',
  zones: [
    { name: 'Neural Zone (N7-N1)', color: '#166534', description: '7 bands from neocortex to spinal cord. Signals are probabilistic. Traditional security tools do not apply. Requires novel approaches.' },
    { name: 'Interface (I0)', color: '#f59e0b', description: 'The bottleneck. Where measurement collapses neural state into data. Every attack and defense transits here. Highest security priority.' },
    { name: 'Silicon Zone (S1-S3)', color: '#3b82f6', description: '3 bands from analog front-end to application layer. Increasingly deterministic. Classical cybersecurity applies here.' }
  ]
};
