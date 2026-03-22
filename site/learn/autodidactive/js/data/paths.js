// ═══════════════════════════════════════════════════════════════════════════════
// LEARNING PATHS — Curated cross-disciplinary journeys
// ═══════════════════════════════════════════════════════════════════════════════

export const LEARNING_PATHS = [
  {
    id: 'stoic-security',
    title: 'The Stoic Security Engineer',
    description: 'From ancient philosophy to modern threat modeling — how Stoic principles map to cybersecurity thinking.',
    emoji: '🛡️',
    steps: [
      { personId: 'marcus', connector: 'Meditations on what you can control leads to...' },
      { personId: 'epictetus', connector: 'The dichotomy of control maps directly to...' },
      { personId: 'claude-shannon', connector: 'Information theory quantifies uncertainty, which connects to...' },
      { personId: 'bruce-schneier', connector: 'Schneier\'s security mindset is applied Stoicism — assume breach...' },
      { personId: 'kerckhoffs-principle', connector: 'The system must be secure even if everything except the key is public knowledge.' }
    ],
    practices: ['Voluntary Discomfort', 'The Evening Review']
  },
  {
    id: 'observation-to-discovery',
    title: 'The Observer\'s Path',
    description: 'Learn to see before you theorize — from da Vinci\'s notebooks to Cajal\'s neurons.',
    emoji: '👁️',
    steps: [
      { personId: 'davinci', connector: 'Saper vedere — knowing how to see — trained his eye for...' },
      { personId: 'galileo', connector: 'The telescope didn\'t show him anything new — it showed him how to look, which inspired...' },
      { personId: 'cajal', connector: 'Drew every neuron by hand. Observation revealed the doctrine of...' },
      { personId: 'paul-broca', connector: 'One patient, careful observation, localized brain function to...' },
      { personId: 'penfield', connector: 'Mapped the living brain by observing responses during surgery.' }
    ],
    practices: ['The Capture Notebook', 'The Socratic Challenge']
  },
  {
    id: 'ethics-through-time',
    title: 'The Ethics Arc',
    description: 'From "do no harm" to brain-computer interfaces — the evolution of what we owe each other.',
    emoji: '⚖️',
    steps: [
      { personId: 'hippocrates', connector: 'First, do no harm — but what counts as harm when we can read minds? This tension drove...' },
      { personId: 'socrates', connector: 'The unexamined life is not worth living — applied to technology by...' },
      { personId: 'descartes', connector: 'The mind-body split created the framework that...' },
      { personId: 'delgado', connector: 'Stimulated a bull\'s brain to stop a charge — proved the mind could be controlled, raising...' },
      { personId: 'freeman', connector: 'The cautionary tale — when intervention outpaces ethics.' }
    ],
    practices: ['The Socratic Challenge', 'The Evening Review']
  },
  {
    id: 'quantum-mind',
    title: 'The Quantum Mind',
    description: 'From Planck\'s desperate hypothesis to the neural code — how physics illuminates the brain.',
    emoji: '⚛️',
    steps: [
      { personId: 'max-planck', connector: 'Quantized energy — the universe isn\'t continuous. Neither is...' },
      { personId: 'niels-bohr', connector: 'Complementarity — you can\'t observe everything at once. Same principle in...' },
      { personId: 'werner-heisenberg', connector: 'Uncertainty isn\'t ignorance — it\'s fundamental. The brain faces the same...' },
      { personId: 'roger-sperry', connector: 'Split-brain experiments showed the mind isn\'t unified. Two hemispheres, two perspectives...' },
      { personId: 'eric-kandel', connector: 'Memory is molecular. The quantum of learning is a synapse.' }
    ],
    practices: ['The Morning Question']
  },
  {
    id: 'polymath-method',
    title: 'The Polymath\'s Toolkit',
    description: 'How to learn across disciplines without being shallow — methods from history\'s deepest thinkers.',
    emoji: '🧠',
    steps: [
      { personId: 'aristotle', connector: 'Categorized all of human knowledge. The original framework builder, who inspired...' },
      { personId: 'ibn-sina', connector: 'Wrote the Canon of Medicine AND philosophy — bridging empirical and theoretical, like...' },
      { personId: 'franklin', connector: 'Invented the lightning rod AND founded a nation. Practical polymathy at scale. His method influenced...' },
      { personId: 'curie', connector: 'Physics AND chemistry. Crossed disciplines when no one thought a woman could master one, let alone...' },
      { personId: 'tesla', connector: 'Visualized entire machines before building them. The polymath as pattern-matcher.' }
    ],
    practices: ['The Capture Notebook', 'The Morning Question', 'Voluntary Discomfort']
  },
  {
    id: 'encryption-to-neurons',
    title: 'From Encryption to Neurons',
    description: 'The security of information — from mathematical proofs to biological signals.',
    emoji: '🔐',
    steps: [
      { personId: 'claude-shannon', connector: 'Information is surprise. Entropy measures uncertainty. This foundation enabled...' },
      { personId: 'diffie-hellman', connector: 'Public key exchange — trust without prior contact. The same problem arises in...' },
      { personId: 'dorothy-denning', connector: 'Intrusion detection — watching for anomalies in signal patterns, just like...' },
      { personId: 'carl-wernicke', connector: 'Language processing in the brain — biological signal interpretation at scale...' },
      { personId: 'brenda-milner', connector: 'Memory systems — the brain\'s own key management for encoding and retrieval.' }
    ],
    practices: ['The Socratic Challenge']
  },
  {
    id: 'warriors-discipline',
    title: 'The Warrior\'s Discipline',
    description: 'Philosophy forged in hardship — from Musashi\'s sword to Seneca\'s exile.',
    emoji: '⚔️',
    steps: [
      { personId: 'musashi', connector: 'The Book of Five Rings: mastery requires crossing disciplines. From swordsmanship to...' },
      { personId: 'seneca', connector: 'Exiled, recalled, forced to tutor a tyrant. Wrote On the Shortness of Life while running out of it...' },
      { personId: 'epictetus', connector: 'Born a slave. Built philosophy from nothing but his own mind. His endurance connects to...' },
      { personId: 'hypatia', connector: 'Taught mathematics in Alexandria while the world burned. Killed for thinking. The cost of knowledge...' },
      { personId: 'confucius', connector: 'Wandered for 14 years, rejected by every ruler. Never stopped teaching.' }
    ],
    practices: ['Voluntary Discomfort', 'The Evening Review', 'The Morning Question']
  },
  {
    id: 'calculus-to-bci',
    title: 'Calculus for Brain-Computer Interfaces',
    description: 'The math behind neural signals — from fundamentals to signal processing.',
    emoji: '📐',
    steps: [
      { personId: 'calc-fundamentals', connector: 'Limits and derivatives — the foundation for understanding rates of change in...', isLab: true },
      { personId: 'newton', connector: 'Invented calculus to describe motion. The same tools now describe...' },
      { personId: 'maxwell', connector: 'Maxwell\'s equations unified electricity and magnetism — the forces behind neural signaling...' },
      { personId: 'calc-signals', connector: 'Fourier transforms decompose neural signals into frequency components...', isLab: true },
      { personId: 'calc-bci-limits', connector: 'The mathematical limits of brain-computer interfaces.', isLab: true }
    ],
    practices: []
  },
  {
    id: 'memory-and-forgetting',
    title: 'Memory and Forgetting',
    description: 'How the brain remembers, forgets, and reconstructs — and what happens when it can\'t.',
    emoji: '💭',
    steps: [
      { personId: 'william-james', connector: 'Principles of Psychology — defined the stream of consciousness, which led to studying...' },
      { personId: 'patient-hm', connector: 'Lost his ability to form new memories. The most studied brain in history revealed...' },
      { personId: 'brenda-milner', connector: 'Tested H.M. for decades. Proved memory isn\'t one system — it\'s many, which connects to...' },
      { personId: 'eric-kandel', connector: 'Won the Nobel for showing how synapses encode memory at the molecular level...' },
      { personId: 'richard-feynman', connector: 'The art of not fooling yourself — because memory already does that.' }
    ],
    practices: ['The Evening Review']
  },
  {
    id: 'electromagnetic-mind',
    title: 'The Electromagnetic Mind',
    description: 'From Faraday\'s fields to EEG — the electrical nature of thought.',
    emoji: '⚡',
    steps: [
      { personId: 'faraday', connector: 'Discovered electromagnetic induction with no formal math. Pure intuition about fields, which...' },
      { personId: 'maxwell', connector: 'Gave Faraday\'s intuitions mathematical form. The equations that describe...' },
      { personId: 'cajal', connector: 'Saw that neurons communicate via electrical signals across gaps — synapses...' },
      { personId: 'roger-sperry', connector: 'Split the brain\'s electrical pathways and discovered two minds in one skull...' },
      { personId: 'morris-worm', connector: 'The first internet worm — when electrical networks go wrong, the same vulnerabilities appear in neural ones.' }
    ],
    practices: ['The Capture Notebook']
  }
];
