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
N7  Neocortex           ─┐  complex · costly · resilient
N6  Limbic System         │
N5  Basal Ganglia         │  Neural Domain
N4  Thalamus              │  (routes what needs cortex)
N3  Brainstem             │
N2  Cranial Nerves        │
N1  Spinal Cord          ─┘  simple · fast · fragile
─────────────────────────────
I0  Neural Interface      ←  THE WAIST
─────────────────────────────
S1  Analog Frontend      ─┐
S2  Digital Processing    │  Silicon Domain
S3  Radio/Wireless       ─┘  simplest · fastest · most exposed
```

The shape comes from Steve Deering's internet hourglass principle (IETF, 1998): the internet works because everything passes through one narrow waist — IP. I applied the same idea to BCIs: everything passes through I0, the physical boundary where biology meets silicon. That bottleneck is where security controls live.

While mapping 102 attack techniques across this hierarchy, I noticed something that had nothing to do with security.

## The Brain Doesn't Send Everything to the Cortex

The neural bands aren't just attack surfaces. They encode a gradient of complexity — and complexity determines everything: how much a system costs to run, how hard it is to break, and whether it can recover when something goes wrong.

At the top, the neocortex handles complex reasoning — novel problems, abstract thought, creative solutions. It's powerful, but expensive. Only 1-5% of cortical neurons fire at any given time (Lennie, 2003). The cortex consumes roughly 20% of the body's total energy despite being about 2% of its mass (Attwell & Laughlin, 2001). The brain rations cortical processing like a company rations GPU time.

In the middle, the thalamus acts as a router. It decides what signals deserve expensive cortical attention and what can be handled by cheaper circuits below. It gates sensory input based on attention and behavioral state (Sherman & Guillery, 2006). Not everything gets promoted to the cortex. Most of it gets filtered.

At the bottom, the spinal cord handles reflexes — touch a hot stove, and your hand pulls back in ~30ms before you consciously register pain. No cortical involvement needed. The problem was already solved millions of years ago. The solution is hardwired.

This is the key insight: **the spinal cord is more deterministic than the cortex.** The same input produces the same output every time. A reflex arc is a biological lookup table — there's no deliberation, no probabilistic weighing of options, no state-dependent variation. The neocortex is the opposite: the same input can produce wildly different outputs depending on mood, attention, context, and memory. That indeterminacy is what makes the cortex powerful, but it's also what makes it expensive. Deterministic processing is cheap because there's nothing to resolve.

The pattern: **complex, indeterministic, flexible processing at the top for novel problems. Simple, deterministic, automatic processing at the bottom for solved problems. A routing layer in the middle deciding which is which.**

## The Fragility Tax

But here's what I didn't see coming. The same property that makes the spinal cord cheap to run makes it cheap to break.

Consider B12 deficiency. Inadequate nutrition — or pernicious anemia, or a vegan diet without supplementation — depletes vitamin B12. The result is subacute combined degeneration of the spinal cord: the myelin sheaths that insulate those fast, deterministic reflex pathways literally dissolve. The hardware degrades. Reflexes fail. Sensation disappears. If caught late, the damage is permanent.

Nitrous oxide does the same thing faster. N2O oxidizes the cobalt atom in cobalamin, inactivating B12 in a single chemical step. A dentist visit with too much gas, or recreational use, can trigger the same spinal cord degeneration. One cheap molecule disabling an entire processing layer.

The list goes on. Copper deficiency causes a myelopathy that mimics B12 deficiency — often misdiagnosed for months. Diabetes, the most common cause of peripheral neuropathy worldwide, degrades the deterministic nerve pathways first. Lead paint in an old house. Mercury in contaminated fish. Organophosphates in pesticides disrupting the neuromuscular junction. A herniated disc from years of bad posture compressing the cord mechanically. Polio targeting spinal motor neurons specifically. Tetanus toxin blocking inhibitory neurotransmitters in the spinal cord.

There are even cross-domain attack chains hiding in plain sight. Stimulant ADHD medications — Adderall, Ritalin, Vyvanse — suppress appetite as a primary side effect. Reduced food intake leads to nutritional depletion, including B12. A drug prescribed to help the cortex think better can quietly degrade the spinal cord underneath it. Add a proton pump inhibitor for the GI side effects, and you've further impaired B12 absorption by reducing the stomach acid needed to unbind it from food proteins. The attack starts in the cognitive layer (N6-N7) and lands in the deterministic layer (N1), and nobody involved — patient, psychiatrist, gastroenterologist — is thinking about it as a systems problem.

Every one of these is cheap, widely available, and devastating. You don't need a nation-state budget or a sophisticated exploit chain. Bad diet. A dental procedure. A prescription meant to help you focus. Sitting wrong for a decade.

Now compare that to the cortex. Children survive hemispherectomies — surgeons remove an entire hemisphere, and the remaining half rewires itself to recover language, motor control, even personality. Stroke patients regain function through neuroplasticity as the cortex routes around damaged tissue. The cortex is expensive to run, but it's also expensive to kill. Its complexity gives it redundancy. Its indeterminacy gives it the flexibility to adapt when things break.

The spinal cord can't do any of that. Damage the pathway and it's gone. There's no rerouting. There's no "thinking around" the problem. Deterministic systems don't adapt because adaptation requires the very indeterminacy they traded away for speed.

This redefines what "cheap" means in the hourglass. It's not just about compute cost. **Simplicity is cheap in every direction — cheap to run, cheap to attack, and cheap to lose.** Complexity is expensive in every direction — expensive to run, expensive to attack, and expensive to replace, but possible to recover. The hourglass isn't a cost gradient. It's a **complexity gradient**, and efficiency, fragility, and resilience all fall out of the same variable.

Sound familiar?

## AI Is Reinventing This Architecture (Unevenly)

In January 2026, DeepSeek released a model with 671 billion parameters — but only 37 billion activate per token. That's 5.51%. The rest sit dormant, waiting for queries complex enough to need them. This is the cortex principle: don't fire everything for every problem.

Their Engram module stores static knowledge in O(1) lookup tables that bypass the transformer backbone entirely. If the model already knows the answer, it doesn't re-derive it through 100+ layers of attention. It looks it up. This is the spinal cord principle: known patterns don't need re-reasoning. A lookup table is a reflex arc.

Their sparse attention mechanism selects only relevant tokens instead of attending to everything. This is the thalamus principle: decide what deserves expensive processing and gate the rest.

Three brain principles. Three engineering solutions. But DeepSeek didn't frame it this way — their papers present pure optimization. The "brain-inspired AI" framing comes from media, not from their research. Other companies are more explicit — Google's Pathways architecture explicitly cites neuroscience, and Numenta's HTM is built directly on cortical column theory.

The convergence is real whether it's deliberate or not. These companies are independently arriving at the same principles the brain evolved over hundreds of millions of years: **don't waste expensive computation on problems that don't need it.**

But they're arriving at it unevenly. And the gap is telling.

DeepSeek built the cortex (sparse reasoning) and the thalamus (attention gating). Their Engram is a first attempt at the spinal cord (cached retrieval). But Engram isn't a true spinal cord — it's a memory layer within a language model. It doesn't have a body. It doesn't need reflexes. It never has to pull a hand off a hot stove in 30ms or it loses the hand.

That's because current AI doesn't have a body. LLMs are pure cognition — disembodied cortex. They don't need a spinal cord because they don't interact with the physical world in real time. There's no latency constraint that would kill them if they deliberated too long.

Robotics changes this. A self-driving car that runs every sensor input through a 671-billion-parameter reasoning model will kill someone while it's still thinking. A surgical robot that routes motor commands through transformer attention layers will tremor. A humanoid robot reaching for a falling object needs the same thing the human nervous system built: a fast, deterministic, hardwired reflex layer that acts before the reasoning layers finish processing.

The spinal cord isn't missing from AI because it's unnecessary. It's missing because AI hasn't needed a body yet. The moment AI becomes embodied — the moment latency kills — the spinal cord becomes the most important layer in the stack. And the fragility tax comes with it. Those hardwired reflexes will be fast and cheap and brittle, just like ours. A poisoned reflex table in a surgical robot is B12 deficiency with a scalpel.

## The Hourglass Compute Hypothesis

This led me to a hypothesis I wasn't expecting to form.

The hourglass isn't just a useful shape for network protocols and brain security models. It may be a missing structural principle in AI architecture — one that becomes mandatory when AI gets a body.

Current transformer designs are flat rectangles — uniform width, uniform compute per layer. Every token gets the same computational budget regardless of complexity. But the brain doesn't work this way. Neither does the internet. Both route traffic through a narrow waist that separates complex processing from simple retrieval.

And both face the same trade-off the spinal cord reveals: simple systems are fast but fragile. AI's version of B12 deficiency is data poisoning — corrupt the lookup table, corrupt every answer that depends on it, and the system has no reasoning layer to catch the error. An LLM that memorizes a wrong fact will confidently repeat it forever. An LLM that reasons through the problem from principles might catch the contradiction. Memorization is the spinal cord. Reasoning is the cortex. You need both, but you need to know which one breaks how.

What if a neural network was designed with an explicit hourglass shape?

- **Above the waist (cortex):** Expensive reasoning layers — sparse activation, deep attention, for novel and complex queries. Indeterministic. Slow. Resilient.
- **At the waist (thalamus/I0):** A compressed universal interface — the routing layer where reasoning and retrieval meet. The inspection point. The bottleneck that makes the system auditable.
- **Below the waist (spinal cord):** Cheap retrieval layers — O(1) lookups, cached patterns, hardwired responses. Deterministic. Fast. Fragile.

The Perceiver architecture (Jaegle et al., 2021) comes closest to this — it uses a compressed latent bottleneck. Hourglass transformers exist in NLP (Nawrot et al., 2022) and vision (U-Net). But these architectures use the hourglass shape for computational compression — fewer tokens in the middle layers — or for feature extraction and reconstruction. None of them formalize the functional separation proposed here: reasoning above, retrieval below, routing at the waist. And none of them account for the fragility gradient — the fact that the cheap layers are the ones that break first and break worst.

That separation is what the brain does. It's what the internet does. And it's what AI companies are converging on piecemeal — MoE for sparse activation, memory modules for cheap retrieval, attention mechanisms for routing. The hourglass would unify these under one structural principle, with an additional insight the engineering-only approach misses: **the architecture that makes a system fast is the same architecture that makes it fragile, and the bottleneck in the middle is where you detect both.**

## What I'm Claiming (and What I'm Not)

I want to be precise about this.

**I am NOT claiming:**
- That I've built an AI architecture
- That QIF was designed for compute efficiency — it was designed for BCI security, and that remains its purpose
- That DeepSeek copied the brain (their papers present engineering, not biomimicry)
- That current LLMs need a spinal cord — they don't have bodies. The claim is that embodied AI will.
- That the compute analogy is proven — it's an observation that emerged from security research and needs independent experimental validation by ML researchers before it means anything actionable

**I am claiming:**
- The pattern connecting Deering's networking hourglass, the brain's processing hierarchy, and emerging AI efficiency techniques is non-obvious and worth formalizing
- No existing work connects the neuroanatomical processing hierarchy (cortex → thalamus → brainstem → spinal cord) to AI architecture design as a formal principle — I checked
- The hourglass encodes a complexity gradient where efficiency, fragility, and resilience are not independent variables — they're the same variable. Simple systems are cheap to run and cheap to break. Complex systems are expensive to run and expensive to break. This trade-off is visible in neurology (B12 myelopathy vs cortical neuroplasticity), in AI (memorization brittleness vs reasoning robustness), and in network engineering (edge devices vs core routers)
- The same architecture that makes a system efficient (sparse activation, hierarchical routing, bottleneck compression) also makes it more securable and interpretable, because the bottleneck provides a natural inspection point

That last point is the one I care about most, and it's the one that came from security research, not AI research. The bottleneck isn't just efficient. It's auditable. You can inspect what crosses the waist. In the brain, that means monitoring the electrode-tissue interface for malicious signals. In AI, it could mean monitoring the reasoning/retrieval boundary for hallucination, bias, or adversarial inputs. The architecture that makes a system fast is the same architecture that makes it trustworthy. That's not a coincidence. That's a design principle.

## How I Got Here

I started by asking how to protect the brain from hackers. I mapped every layer of neural processing to understand where attacks land. I scored each band for vulnerability, reversibility, and clinical impact. I built a registry of 102 techniques spanning neural, interface, and synthetic domains.

Then I noticed the hierarchy that reveals where the brain is vulnerable also reveals how the brain achieves efficiency. The security model became a compute model. I didn't plan for that. Nobody plans for the side effects of staring at a problem long enough.

The internet hourglass. The neural hourglass. The AI efficiency problem. Same shape. Same principle. Different domains.

QIF is a neurotech framework born from security — it maps the brain's architecture through the lens of what needs protecting, but what it revealed goes beyond security alone. But frameworks built on real structure sometimes reveal more than they were designed to find. The hourglass may have implications beyond neurosecurity that we don't fully understand yet. The only honest thing to do is publish the observation, flag that it's unvalidated, and let the people with the right expertise test it.

---

*The Hourglass Compute Hypothesis is derived from the QIF neurosecurity framework (DOI: [10.5281/zenodo.18640105](https://doi.org/10.5281/zenodo.18640105)). The full hypothesis document, including literature validation and specific predictions, is available on request.*

*This is a position statement, not a proof. The hypothesis proposes testable predictions. Here are two:*

*First: take a standard transformer, add a compressed bottleneck layer and a large-scale key-value memory beneath it. Train the model to route queries — force simple, fact-based questions through the memory (retrieval) and complex, inferential questions through the transformer layers (reasoning). The prediction is that this architecture achieves comparable accuracy at a fraction of the inference cost.*

*Second: poison the retrieval layer. Corrupt 1% of the lookup entries and measure how error propagates. Then damage 1% of the reasoning layers and measure the same thing. The prediction — from the fragility gradient — is that retrieval corruption produces confident, undetectable errors (the B12 pattern), while reasoning corruption produces detectable degradation (the hemispherectomy pattern). If that holds, it tells you exactly where to put your monitoring: at the waist, where retrieval meets reasoning.*

*If you have the ML engineering chops to run either experiment, I'd love to hear from you.*
