// Calculus interactive modules — metadata for iframe embedding
export const CALCULUS_LABS = [
  {
    id: 'calc-fundamentals',
    name: 'Calculus Fundamentals',
    tagline: 'Limits, derivatives, and integrals — interactive visualizations',
    emoji: '📐',
    description: 'Explore the core concepts of calculus through interactive graphs. Drag points to see how limits work, watch derivatives form in real time, and shade areas under curves to build intuition for integration.',
    src: 'labs/calculus-fundamentals.html',
    topics: ['limits', 'derivatives', 'integrals', 'continuity'],
    difficulty: 'beginner'
  },
  {
    id: 'calc-bci-limits',
    name: 'Calculus for BCI: Signal Limits',
    tagline: 'How calculus governs brain-computer interface signals',
    emoji: '🧠',
    description: 'See how limits and convergence apply to real BCI signal processing. Explore sampling rates, Nyquist frequencies, and how calculus ensures we capture neural signals accurately.',
    src: 'labs/calculus-bci-limits.html',
    topics: ['sampling', 'Nyquist', 'signal processing', 'BCI'],
    difficulty: 'intermediate'
  },
  {
    id: 'calc-signals',
    name: 'Calculus of Signals',
    tagline: 'Fourier transforms, convolutions, and signal decomposition',
    emoji: '📊',
    description: 'Decompose complex signals into frequency components using Fourier analysis. Visualize convolutions, understand filtering, and see how calculus transforms messy real-world data into clean information.',
    src: 'labs/calculus-signals.html',
    topics: ['Fourier', 'convolution', 'filtering', 'frequency analysis'],
    difficulty: 'advanced'
  }
];
