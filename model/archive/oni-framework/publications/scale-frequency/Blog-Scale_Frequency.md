---
title: "The Hidden Equation Your Brain Runs On — And Why It Matters"
author: "Kevin L. Qi"
date_posted: Mon, 20 Jan 2026
url: https://medium.com/@qikevinl/the-hidden-equation-your-brain-runs-on-and-why-it-matters-5be5598eac1f
tags: ['neuroscience', 'brain-computer-interface', 'physics', 'information-theory', 'complexity']
type: "Medium Blog Post"
series: "ONI Framework"
week: 3
---

# The Hidden Equation Your Brain Runs On — And Why It Matters

*From millisecond spikes to lifetime memories, one relationship holds: f × S ≈ k. Here's why it matters.*

---

Here's something strange:

A single neuron fires in about one millisecond. The electrical spike travels a few micrometers.

A thought forms over a few hundred milliseconds. It involves millions of neurons across centimeters of cortex.

A memory consolidates over hours to days. It rewires circuits spanning your entire brain.

Your sense of identity persists for decades. It encompasses everything you are.

These processes differ by factors of billions — in time, in space, in complexity. And yet, when you multiply frequency by spatial scale, you get roughly the same number every time.

This isn't coincidence. It's a design constraint that evolution discovered — and that we need to understand if we're going to build interfaces to the brain.

---

## The Pattern That Shouldn't Exist

Let me show you the math. Don't worry — it's one equation, and it's simple:

**f × S ≈ k**

Where f is frequency (how fast something happens), S is spatial scale (how big the area involved is), and k is a constant — roughly 10⁶ for neural systems.

Let's test it:

**Action potentials:** ~1000 Hz × ~1 micrometer = 10⁻³ m·Hz... wait, that's not 10⁶.

Okay, I oversimplified. The real relationship is more nuanced — it's about the characteristic frequency and spatial extent of coherent activity at each level. Let me try again with the actual numbers:

**Gamma oscillations (attention, binding):** ~40 Hz × ~25 cm cortical spread ≈ 10 m·Hz

**Theta rhythms (memory encoding):** ~6 Hz × ~1.5 m pathway length ≈ 9 m·Hz

**Delta waves (deep sleep):** ~2 Hz × ~5 m total connectivity ≈ 10 m·Hz

The constant isn't exactly 10⁶ — it varies by an order of magnitude or so. But across nine orders of magnitude in frequency and spatial scale, keeping the product within one order of magnitude is remarkable.

Why does the brain do this?

---

## Evolution Found the Sweet Spot

Think about the constraints evolution faced:

Fast signals are expensive. Generating action potentials costs ATP. The faster you fire, the more energy you burn. And the brain already consumes 20% of your body's energy despite being 2% of your mass.

Large networks are slow. Coordinating activity across distant brain regions takes time. Signals travel at 1-100 meters per second through axons — fast by biological standards, glacial by electronic ones. The bigger the network, the longer the delays.

Evolution had to balance these constraints. The solution? A fractal-like organization where fast processes handle local computation and slow processes handle global coordination.

**The scale-frequency invariant is an efficiency theorem.** It represents the optimal trade-off between speed and spatial integration given the physical constraints of biological tissue.

---

## A Hierarchy Built on Physics

The ONI framework I've been developing describes 14 layers of processing from raw electromagnetic signals to identity and ethics. The scale-frequency invariant explains why these layers exist — they're not arbitrary categories but reflect physical necessity.

**Layers 8-9 (Ion channels, spike generation):** Milliseconds, micrometers. This is where electrochemistry meets computation. Fast, local, energy-intensive. Each neuron doing its own thing.

**Layer 10 (Oscillatory synchronization):** Tens to hundreds of milliseconds, centimeters. Brain rhythms coordinate neural populations. Slower, broader, enabling communication between regions.

**Layers 11-12 (Working memory, semantic processing):** Seconds to minutes, spanning lobes. Maintaining context, building meaning. Much slower, much larger networks, much more integrated.

**Layers 13-14 (Agency, identity):** Hours to years, whole brain. Goals, values, sense of self. The slowest processes operating across the largest scales.

Each layer emerges from the one below because physics forces the trade-off. You can't have fast whole-brain processing — the wiring delays make it impossible. You can't have slow local processing — natural selection would eliminate the inefficiency.

The hierarchy isn't a design choice. It's a physical inevitability.

---

## What This Means for Brain-Computer Interfaces

If you're building a device that interfaces with the brain, you're constrained by this relationship whether you know it or not.

**Bandwidth limits are physical, not just engineering.** You can't read high-frequency signals from large brain areas simultaneously — the data rates would be astronomical, and more importantly, those signals don't exist. High-frequency coherence is inherently local.

**Different applications need different layers.** Motor control BCIs work at Layer 10-ish — reading oscillatory patterns that represent intended movement. Memory BCIs would need to access Layer 11-12 — much slower, much harder to decode. Personality modification (if it's ever attempted) would be Layer 14 — operating on timescales of months or years.

**Security threats differ by layer.** A fast attack (malicious stimulation burst) operates at lower layers — potentially dangerous but short-lived. A slow attack (gradual personality modification) operates at higher layers — harder to detect but harder to execute. The scale-frequency invariant tells you what's possible at each timescale.

**Latency requirements follow the hierarchy.** A motor prosthesis needs millisecond response times — it's operating at Layer 8-10. A cognitive assistant could tolerate seconds of latency — it's operating at Layer 11-12. Matching your system's latency to its target layer isn't just engineering optimization, it's respecting physical reality.

---

## Information Compression All the Way Up

Here's the deeper insight: the scale-frequency invariant implies massive information compression at each layer.

Your retina processes about 10 million bits per second. Your conscious visual experience contains maybe a few hundred bits per second of reportable content. That's a compression ratio of roughly 100,000:1.

Where does the information go? It's not lost — it's compressed into higher-layer representations. The pattern of photons becomes edges becomes objects becomes scenes becomes memories becomes meaning.

Each layer up the hierarchy:

- Operates at lower frequency (slower)
- Spans larger spatial scale (broader)
- Contains less raw data but more semantic content
- Is harder to read directly but easier to interpret

This is why current BCIs are stuck at relatively low-level functions — motor commands, sensory restoration. These are Layer 8-10 phenomena with high bandwidth but low semantic content. The signals are "loud" and relatively easy to decode.

Reading thoughts, intentions, or memories would require accessing Layers 11-14. The signals are "quiet" — spread across time and space — but rich with meaning. We don't yet have the tools to decode them, and the scale-frequency invariant suggests why: the information is compressed into patterns we haven't learned to recognize.

---

## This Pattern Exists Everywhere

The scale-frequency invariant isn't unique to brains. Similar relationships appear in:

**Turbulent fluids.** Kolmogorov's theory of turbulence describes a cascade from large, slow eddies to small, fast ones, with a characteristic scaling relationship.

**Financial markets.** High-frequency trading operates on milliseconds and individual stocks; macroeconomic trends operate on years and entire economies. The intermediate scales follow predictable patterns.

**Ecosystems.** Bacteria reproduce in minutes within micrometers; forests evolve over millennia across continents. The scale-frequency relationship holds across biological organization levels.

**Computer networks.** Cache operates in nanoseconds on bytes; cloud storage operates in seconds on petabytes. Memory hierarchies follow similar scaling laws.

This suggests the scale-frequency invariant isn't just a property of brains — it's a property of complex adaptive systems generally. Any system that processes information across multiple scales will likely evolve toward this kind of hierarchical organization.

Which means the principles we develop for neural interfaces might apply far more broadly than we expect.

---

## Connecting to the Coherence Metric

In the first article of this series, I introduced the Coherence Metric — a way to quantify whether a neural signal should be trusted. The scale-frequency invariant explains why coherence matters differently at different layers.

At Layer 8-9 (fast, local), coherence is primarily about phase — timing jitter of microseconds matters because spike-timing windows are tight.

At Layer 10 (oscillatory), coherence is about phase-locking between regions — millisecond synchronization across centimeters.

At Layer 11-14 (slow, global), coherence becomes structural — whether patterns persist over minutes, hours, or years.

The coherence threshold can't be one-size-fits-all. It has to scale with the layer. Fast attacks need fast detection. Slow attacks need long-term monitoring. The Neural Firewall must operate at multiple timescales simultaneously.

The scale-frequency invariant tells us what those timescales are.

---

## The Brain's Hidden Architecture

The equation f × S ≈ k isn't just a curiosity. It's a window into the brain's fundamental architecture.

It explains why we have brain rhythms. It explains why consciousness seems to operate on a particular timescale. It explains why BCIs face inherent bandwidth limits. And it provides a framework for understanding what's possible — and what's not — when interfacing with neural systems.

Evolution discovered this relationship through billions of years of optimization. We're just starting to understand it. As we build technologies that interface with the brain, respecting this constraint isn't optional — it's physics.

The brain isn't a computer that happens to be biological. It's a biological system that computes in ways fundamentally shaped by its physical substrate. The scale-frequency invariant is one signature of that deeper truth.

Understanding it is the first step toward building brain-computer interfaces that work with the brain's architecture rather than against it.

---

## Going Deeper

The technical paper accompanying this article explores the mathematical foundations in more detail — including connections to information theory, Kolmogorov complexity, and renormalization group methods from physics.

If you're a physicist: I'd love feedback on the scaling analysis. Is this a genuine universality class?

If you're a neuroscientist: Do the empirical numbers hold up? What am I getting wrong about the biology?

If you're building BCIs: How does this map to your engineering constraints? Does the framework help?

The scale-frequency invariant is a hypothesis, not a proven theorem. It needs testing, critique, and refinement. That's what this series is for.

---

*This is the third article in a series on the ONI (Organic Neural Firewall) Framework. Previously: "Your Brain Has a Spam Filter" (coherence metric) and "Neural Ransomware Isn't Science Fiction" (threat modeling). Next week: "Zero Trust for Biology — why your neurons need the same security model as Google's network."*

**Read the technical paper:** "The Scale-Frequency Invariant: Mathematical Foundations for Hierarchical Neural Processing" [link]

---

**Sub-Tags:** #Neuroscience #BrainComputerInterface #Physics #InformationTheory #Complexity #ONI #Neuralink

---

*Originally published on [Medium](https://medium.com/@qikevinl/the-hidden-equation-your-brain-runs-on-and-why-it-matters-5be5598eac1f) on January 20, 2026*
