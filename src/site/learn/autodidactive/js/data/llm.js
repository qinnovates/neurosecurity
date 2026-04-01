// LLM interactive modules — metadata for iframe embedding
export const LLM_LABS = [
  {
    id: 'llm-explainer',
    name: 'How LLMs Work',
    tagline: 'Vectors to Transformers — the math behind language models',
    emoji: '🤖',
    description: 'Interactive 3D visualizations of every step: tokens, embeddings, dot products, attention, the Transformer block, and autoregressive generation. Built on the "Attention Is All You Need" paper.',
    src: 'labs/llm-explainer.html',
    topics: ['vectors', 'embeddings', 'attention', 'transformers', 'generation', 'softmax'],
    difficulty: 'intermediate'
  },
  {
    id: 'transformer-attention',
    name: 'Transformer Visualized',
    tagline: 'Step through attention heads, residual streams, and layer norms',
    emoji: '⚡',
    description: 'A visual walkthrough of the Transformer architecture — see how queries, keys, and values flow through multi-head attention, how residual connections preserve information, and how layer normalization stabilizes training.',
    src: 'labs/transformer-attention.html',
    topics: ['attention', 'multi-head', 'residual', 'layer norm', 'transformer'],
    difficulty: 'intermediate'
  }
];
