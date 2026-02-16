---
title: "I Built a Security Model for the Brain. It Might Also Be a Blueprint for Efficient AI."
date: "2026-02-16"
author: "Kevin L. Qi"
tags: ["qif", "bci", "ai", "hourglass", "security"]
---

> **Status:** DRAFT — For qinnovate.com blog

I wasn't looking for this.

I was trying to protect brains from hackers.

For the past six weeks, I've been building QIF — the Quantum-Informed Framework for brain-computer interface security. The core of QIF is an 11-band hourglass model that maps every layer of neural processing an attacker could target, from the neocortex down to the spinal cord, through the electrode-tissue interface, and into the silicon stack below.

```
N7  Neocortex           ─┐
N6  Limbic System         │  Neural Domain
N5  Basal Ganglia         │  (expensive → cheap)
N4  Thalamus              │
N3  Brainstem             │
N2  Cranial Nerves        │
N1  Spinal Cord          ─┘
─────────────────────────────
I0  Neural Interface      ←  THE WAIST
─────────────────────────────
S1  Analog Frontend      ─┐
S2  Digital Processing    │  Silicon Domain
S3  Radio/Wireless       ─┘
```

The shape comes from Steve Deering's internet hourglass principle (IETF, 1998): the internet works because everything passes through one narrow waist — IP. I applied the same idea to BCIs: everything passes through I0, the physical boundary where biology meets silicon. That bottleneck is where security controls live.

While mapping 102 attack techniques across this hierarchy, I noticed something that had nothing to do with security.

## The Brain Doesn't Send Everything to the Cortex

The neural bands aren't just attack surfaces. They encode a gradient of computational cost.

At the top, the neocortex handles complex reasoning — novel problems, abstract thought, creative solutions. It's powerful, but expensive. Only 1-5% of cortical neurons fire at any given time (Lennie, 2003). The cortex consumes roughly 20% of the body's total energy despite being about 2% of its mass (Attwell & Laughlin, 2001). The brain rations cortical processing like a company rations GPU time.

In the middle, the thalamus acts as a router. It decides what signals deserve expensive cortical attention and what can be handled by cheaper circuits below. It gates sensory input based on attention and behavioral state (Sherman & Guillery, 2006). Not everything gets promoted to the cortex. Most of it gets filtered.

At the bottom, the spinal cord handles reflexes — touch a hot stove, and your hand pulls back before you consciously register pain. No cortical involvement needed. The problem was already solved millions of years ago. The solution is hardwired.

The pattern: **expensive, sparse, flexible processing at the top for novel problems. Cheap, fast, automatic processing at the bottom for solved problems. A routing layer in the middle deciding which is which.**

Sound familiar?

## AI Is Reinventing This Architecture

In January 2026, DeepSeek released a model with 671 billion parameters — but only 37 billion activate per token. That's 5.51%. The rest sit dormant, waiting for queries complex enough to need them.

Their Engram module stores static knowledge in O(1) lookup tables that bypass the transformer backbone entirely. If the model already knows the answer, it doesn't re-derive it through 100+ layers of attention. It looks it up. This is functionally identical to how the spinal cord handles reflexes: known patterns don't need re-reasoning.

Their sparse attention mechanism selects only relevant tokens instead of attending to everything. This is thalamic gating — deciding what deserves expensive processing.

Here's what's interesting: DeepSeek's papers don't frame any of this in neuroscience terms. They present it as pure engineering optimization. The "brain-inspired AI" framing comes from media, not from DeepSeek. Other companies are more explicit — Google's Pathways architecture explicitly cites neuroscience, and Numenta's HTM is built directly on cortical column theory.

But the convergence is real whether it's deliberate or not. These companies are independently arriving at the same principles the brain evolved over hundreds of millions of years: **don't waste expensive computation on problems that don't need it.**

## The Hourglass Compute Hypothesis

This led me to a hypothesis I wasn't expecting to form.

The hourglass isn't just a useful shape for network protocols and brain security models. It may be a missing structural principle in AI architecture.

Current transformer designs are flat rectangles — uniform width, uniform compute per layer. Every token gets the same computational budget regardless of complexity. But the brain doesn't work this way. Neither does the internet. Both route traffic through a narrow waist that separates expensive processing from cheap retrieval.

What if a transformer was designed with an explicit hourglass shape?

- **Above the waist:** Expensive reasoning layers — sparse activation, deep attention, for novel and complex queries
- **At the waist:** A compressed universal interface — the point where reasoning and retrieval meet
- **Below the waist:** Cheap retrieval layers — O(1) lookups, cached patterns, for known information

The Perceiver architecture (Jaegle et al., 2021) comes closest to this — it uses a compressed latent bottleneck. Hourglass transformers exist in NLP (Nawrot et al., 2022) and vision (U-Net). But these architectures use the hourglass shape for computational compression — fewer tokens in the middle layers — or for feature extraction and reconstruction. None of them formalize the functional separation proposed here: reasoning above, retrieval below, routing at the waist.

That separation is what the brain does. It's what the internet does. And it's what AI companies are converging on piecemeal — MoE for sparse activation, memory modules for cheap retrieval, attention mechanisms for routing. The hourglass would unify these under one structural principle.

## What I'm Claiming (and What I'm Not)

I want to be precise about this.

**I am NOT claiming:**
- That I've built an AI architecture
- That QIF was designed for compute efficiency — it was designed for BCI security, and that remains its purpose
- That DeepSeek copied the brain (their papers present engineering, not biomimicry)
- That the compute analogy is proven — it's an observation that emerged from security research and needs independent experimental validation by ML researchers before it means anything actionable

**I am claiming:**
- The pattern connecting Deering's networking hourglass, the brain's processing hierarchy, and emerging AI efficiency techniques is non-obvious and worth formalizing
- No existing work connects the neuroanatomical processing hierarchy (cortex → thalamus → brainstem → spinal cord) to AI architecture design as a formal principle — I checked
- The same architecture that makes a system efficient (sparse activation, hierarchical routing, bottleneck compression) also makes it more securable and interpretable, because the bottleneck provides a natural inspection point

That last point is the one I care about most, and it's the one that came from security research, not AI research. The bottleneck isn't just efficient. It's auditable. You can inspect what crosses the waist. In the brain, that means monitoring the electrode-tissue interface for malicious signals. In AI, it could mean monitoring the reasoning/retrieval boundary for hallucination, bias, or adversarial inputs. The architecture that makes a system fast is the same architecture that makes it trustworthy. That's not a coincidence. That's a design principle.

## How I Got Here

I started by asking how to protect the brain from hackers. I mapped every layer of neural processing to understand where attacks land. I scored each band for vulnerability, reversibility, and clinical impact. I built a registry of 102 techniques spanning neural, interface, and synthetic domains.

Then I noticed the hierarchy that reveals where the brain is vulnerable also reveals how the brain achieves efficiency. The security model became a compute model. I didn't plan for that. Nobody plans for the side effects of staring at a problem long enough.

The internet hourglass. The neural hourglass. The AI efficiency problem. Same shape. Same principle. Different domains.

QIF is a neurotech framework born from security — it maps the brain's architecture through the lens of what needs protecting, but what it revealed goes beyond security alone. But frameworks built on real structure sometimes reveal more than they were designed to find. The hourglass may have implications beyond neurosecurity that we don't fully understand yet. The only honest thing to do is publish the observation, flag that it's unvalidated, and let the people with the right expertise test it.

---

*The Hourglass Compute Hypothesis is derived from the QIF neurosecurity framework (DOI: [10.5281/zenodo.18640105](https://doi.org/10.5281/zenodo.18640105)). The full hypothesis document, including literature validation and specific predictions, is available on request.*

*This is a position statement, not a proof. The hypothesis proposes testable predictions. Here's one: take a standard transformer, add a compressed bottleneck layer and a large-scale key-value memory beneath it. Train the model to route queries — force simple, fact-based questions through the memory (retrieval) and complex, inferential questions through the transformer layers (reasoning). The prediction is that this architecture achieves comparable accuracy at a fraction of the inference cost. If you have the ML engineering chops to run that experiment, I'd love to hear from you.*
