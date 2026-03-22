# 🌀 05 — Proposed Model

> Like the Periodic Law before Mendeleev got it right, this diagram will evolve.
> This is the best way to visualize the problem with what we know today,
> while leaving room for what we don't.

---

## 🔑 The Core Idea: A Funnel, Not a Pyramid

The brain is not a stack. It's loops — many of them — at different depths.
The shortest loops are the most understood. The longest loops are the least.

```
Distance from center = complexity, unknowns, loop length

                AFFERENT (sensory input)
                         │
     ┌───────────────────┼───────────────────┐
     │   ⚠️  CORTICAL     │    CORTICAL  ⚠️    │ ← Longest loops
     │   (vision,sound,   │   (voluntary      │    Most unknowns
     │    perception,     │    movement,       │    Seconds to hours
     │    comprehension)  │    speech,         │
     │                    │    decision)       │
     │  ┌─────────────────┼─────────────────┐ │
     │  │ 🔶 SUBCORTICAL  │  SUBCORTICAL 🔶 │ │ ← Medium loops
     │  │ (fear fast-track,│ (fight/flight,  │ │    Some gaps
     │  │  amygdala,      │  autonomic,      │ │    ~100ms
     │  │  cerebellum)    │  hormonal)       │ │
     │  │  ┌──────────────┼──────────────┐  │ │
     │  │  │ ✅ BRAINSTEM  │  BRAINSTEM ✅│  │ │ ← Short loops
     │  │  │ (pupil,gag,  │ (HR adjust, │  │ │    Fully known
     │  │  │  startle,    │  breathing, │  │ │    ~10-50ms
     │  │  │  VOR,blink)  │  vomit,     │  │ │
     │  │  │              │  shiver)    │  │ │
     │  │  │  ┌───────────┼──────────┐  │  │ │
     │  │  │  │✅ SPINAL   │ SPINAL ✅│  │  │ │ ← Shortest loops
     │  │  │  │(hot→pull,  │(contract,│  │  │ │    100% known
     │  │  │  │ stretch→   │ withdraw,│  │  │ │    ~5-50ms
     │  │  │  │ jerk,      │ reflex   │  │  │ │
     │  │  │  │ pain→      │ response)│  │  │ │
     │  │  │  │ withdraw)  │          │  │  │ │
     │  │  │  │            │          │  │  │ │
     │  │  │  │     ┌──────┴──────┐   │  │  │ │
     │  │  │  │     │             │   │  │  │ │
     │  │  │  │     │  ⚡ NEURAL  │   │  │  │ │
     │  │  │  │     │  INTERFACE  │   │  │  │ │
     │  │  │  │     │ (BCI R/W)  │   │  │  │ │
     │  │  │  │     │             │   │  │  │ │
     │  │  │  │     └──────┬──────┘   │  │  │ │
     │  │  │  │            │          │  │  │ │
     │  │  │  └────────────┼──────────┘  │  │ │
     │  │  └───────────────┼─────────────┘  │ │
     │  └──────────────────┼────────────────┘ │
     └─────────────────────┼──────────────────┘
                           │
                EFFERENT (motor output)
```

---

## 📖 Reading the Funnel

```
CENTER (Neural Interface)
│
├── Ring 1: SPINAL REFLEX          ✅ 100% mapped, ~5-50ms
│   No cortex involved. Receptor → spinal cord → muscle.
│   Security: FULLY MODELABLE. Deterministic. Can write exact rules.
│
├── Ring 2: BRAINSTEM REFLEX       ✅ 100% mapped, ~10-50ms
│   Pupil, blink, gag, startle, VOR, breathing, heart rate.
│   Security: FULLY MODELABLE. Predictable responses.
│
├── Ring 3: SUBCORTICAL            🔶 ~80% mapped, ~100ms
│   Fear fast-track, cerebellum, autonomic, basic emotion.
│   Security: MOSTLY MODELABLE. Integration mechanisms have gaps.
│
├── Ring 4: CORTICAL               ⚠️  ~50% mapped, ~500ms+
│   Vision, hearing, touch → perception → decision → action.
│   Security: PARTIALLY MODELABLE. Internal processing = unknowns.
│
└── Ring ?: HIGHER COGNITION       ❓ ~20% mapped, seconds-years
    Memory formation, learning, personality, abstract thought.
    Security: WILDCARD ZONE. We can detect anomalies but can't
    model the expected behavior precisely.
```

---

## 🛡️ What This Means for Security

```
SECURITY CONFIDENCE DECREASES WITH DISTANCE FROM CENTER

     ✅ ✅ ✅ ✅ ✅ ✅ ✅ ✅ ✅ ✅        Ring 1-2: Can write firewall rules
     🔶 🔶 🔶 🔶 🔶 🔶 🔶 🔶 ░░        Ring 3: Can detect anomalies
     ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ░░ ░░ ░░ ░░ ░░        Ring 4: Can monitor, hard to validate
     ❓ ❓ ❓ ░░ ░░ ░░ ░░ ░░ ░░ ░░        Ring 5: Can observe, cannot predict

     The Neural Interface (center) is the ONE POINT we fully control.
     Everything beyond it is progressively less certain.
```

---

## ⚡ Reflex Bypass: Things That Skip the Filter

Some signals never reach the center of the funnel. They short-circuit:

```
                    Normal path:
                    Sensor → ··· → Interface → ··· → Response

                    Reflex bypass:
                    Sensor → Spinal cord → Response
                             (never touches the interface)

                    Fear bypass:
                    Sensor → Thalamus → Amygdala → Response
                             (~74ms, before cortex even knows; Mendez-Bertolo et al. 2016)
```

### 📋 Known Bypasses

```
┌────────────────────────┬──────────────────────┬───────────┬──────────────────┐
│ TRIGGER                │ BYPASS ROUTE         │ SPEED     │ BCI CAN DETECT?  │
├────────────────────────┼──────────────────────┼───────────┼──────────────────┤
│ Hot surface            │ Spinal reflex arc    │ ~50ms     │ ⚠️ After the fact│
│ Muscle overstretch     │ Monosynaptic spinal  │ ~25ms     │ ⚠️ After the fact│
│ Sharp pain             │ Spinal withdrawal    │ ~50ms     │ ⚠️ After the fact│
│ Loud bang              │ Brainstem startle    │ ~10ms     │ ⚠️ After the fact│
│ Threat shape           │ Thalamus→amygdala    │ ~74ms     │ 🔶 Possibly      │
│ Corneal touch          │ Brainstem→facial     │ ~30ms     │ ⚠️ After the fact│
│ Blood pressure drop    │ Baroreceptor→NTS     │ ~200ms    │ ❌ Below BCI     │
│ CO2 buildup            │ Medulla respiratory  │ continuous│ ❌ Below BCI     │
│ Internal temperature   │ Hypothalamic         │ continuous│ ❌ Below BCI     │
└────────────────────────┴──────────────────────┴───────────┴──────────────────┘
```

**Security implication:** A BCI sitting at the neural interface CANNOT intercept
spinal reflexes — they complete before the signal reaches cortex. The firewall
only works for signals that pass through the interface.

---

## 🕳️ The Quantum Tunneling Thought Experiment

> *Half joke, half contemplation. But maybe worth thinking about.*

In quantum mechanics, tunneling is when a particle passes through a barrier
it classically shouldn't be able to cross. It doesn't go over or around —
it goes *through*, with some probability.

The brain has analogs:

### 🔮 Where "Tunneling" Might Apply

```
┌─────────────────────────┬──────────────────────────────────────────────────┐
│ PHENOMENON              │ WHY IT LOOKS LIKE TUNNELING                     │
├─────────────────────────┼──────────────────────────────────────────────────┤
│ Fear fast-track         │ Signal reaches amygdala BEFORE cortex processes │
│ (thalamus → amygdala)   │ it. Bypasses the normal processing layers.      │
│                         │ Like tunneling through the cortical barrier.     │
├─────────────────────────┼──────────────────────────────────────────────────┤
│ Blindsight              │ Patient is cortically blind (V1 destroyed) but  │
│                         │ can still react to visual stimuli via superior   │
│                         │ colliculus. Signal "tunnels" past the damaged    │
│                         │ processing layer.                                │
├─────────────────────────┼──────────────────────────────────────────────────┤
│ Priming effects         │ Subliminal stimulus (below conscious threshold) │
│                         │ still affects behavior. Signal crosses the       │
│                         │ awareness barrier without "enough energy" to     │
│                         │ reach consciousness.                             │
├─────────────────────────┼──────────────────────────────────────────────────┤
│ Gut feelings            │ Interoceptive signals from vagus nerve influence │
│                         │ decision-making without conscious awareness.     │
│                         │ The body "tunnels" information past cognition.   │
├─────────────────────────┼──────────────────────────────────────────────────┤
│ Implicit memory         │ You can't consciously recall learning to ride a │
│                         │ bike, but the skill is there. Knowledge stored   │
│                         │ without passing through declarative memory.      │
├─────────────────────────┼──────────────────────────────────────────────────┤
│ Sleep consolidation     │ During sleep, hippocampus "replays" memories to │
│                         │ cortex. Information transfers between regions    │
│                         │ while the conscious processing layer is offline. │
├─────────────────────────┼──────────────────────────────────────────────────┤
│ Phantom limb            │ Brain generates sensation for a limb that       │
│                         │ doesn't exist. Signal with no physical source   │
│                         │ — the cortex "tunnels" a percept into existence.│
├─────────────────────────┼──────────────────────────────────────────────────┤
│ Placebo effect          │ Belief alone triggers measurable physiological  │
│                         │ change. A cognitive state "tunnels" through to   │
│                         │ affect molecular-level processes (endorphin      │
│                         │ release, immune modulation).                     │
└─────────────────────────┴──────────────────────────────────────────────────┘
```

### 🎯 What This Means for the Model

These "tunneling" phenomena represent **cross-layer shortcuts** that violate
strict layering. They are:

1. **Real** — documented, reproducible, clinically significant
2. **Unpredictable** — we can't always predict when they'll activate
3. **Security-relevant** — an attacker could potentially exploit them
4. **Outside the firewall** — most bypass the neural interface entirely

In the funnel model, these are **arrows that cut across rings** rather than
following the concentric path. They're the biological equivalent of a packet
that bypasses the firewall via a side channel.

```
    Normal path (follows the rings):

    ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
    │ Cortical │ ← │Subcortic.│ ← │Brainstem │ ← │ Spinal   │
    └──────────┘    └──────────┘    └──────────┘    └──────────┘

    "Tunneling" path (skips rings):

    ┌──────────┐                                     ┌──────────┐
    │ Cortical │ ◄════════════ TUNNEL ══════════════ │ Spinal   │
    └──────────┘                                     └──────────┘
```

### ❓ Open Question

If we adopt "quantum tunneling" as a metaphor for cross-layer shortcuts:

- Can we **categorize** the known tunneling paths?
- Can we assign **probability** to when they activate? (Like actual tunneling has a probability coefficient)
- Can we **model the security risk** of each tunnel?
- Does this give us a framework for the unknowns — things that might tunnel but we haven't discovered yet?

This is speculative. But the pattern is real. The brain DOES have side channels.
Whether calling them "quantum tunneling" is just a metaphor or something deeper
is a question for another day.

---

## 🏗️ The Dependency Stack (At Every Ring)

At each concentric ring, the Kandel dependency stack applies vertically:

```
At EVERY point on the funnel, this stack exists:

    Network/System  (10⁻¹ m)   ← Multiple regions coordinating
         ↑
    Regional        (10⁻² m)   ← Specialized brain area
         ↑
    Local Circuit   (10⁻³ m)   ← Columns, nuclei, local computation
         ↑
    Neuronal        (10⁻⁵ m)   ← Single neuron integration
         ↑
    Synaptic        (10⁻⁷ m)   ← Neuron-to-neuron transmission + plasticity
         ↑
    Molecular       (10⁻⁹ m)   ← Ion channels, receptors, neurotransmitters
```

The funnel rings tell you HOW FAR the signal travels.
The dependency stack tells you HOW DEEP the signal goes.
The BCI interface taps in at a specific RING and DEPTH.

```
                FUNNEL RING (horizontal = loop length)
              ┌──────────────────────────────────────────┐
              │ Spinal │ Brain- │ Sub-   │ Cortical      │
              │ Reflex │ stem   │ cort.  │               │
    ──────────┼────────┼────────┼────────┼───────────────┤
    Network   │        │        │   ●    │      ●        │ D
    Regional  │        │   ●    │   ●    │      ●        │ E
    Circuit   │   ●    │   ●    │   ●    │      ●        │ P
    Neuronal  │   ●    │   ●    │   ●    │      ●        │ T
    Synaptic  │   ●    │   ●    │   ●    │      ●        │ H
    Molecular │   ●    │   ●    │   ●    │      ●        │
    ──────────┴────────┴────────┴────────┴───────────────┘

    ●  = this depth is active in this ring
    BCI taps in at a specific (ring, depth) coordinate
```

---

## 🚀 What's Next

```
┌──────────────────────────────────────────────────┐
│  TO DO                                           │
│                                                  │
│  □  Formalize the funnel rings as named layers   │
│  □  Map every BCI capability to (ring, depth)    │
│  □  Define security posture per ring             │
│  □  Catalog all known "tunneling" bypasses       │
│  □  Assign probability/risk to each bypass       │
│  □  Build the interactive 3D visualization       │
│  □  Validate against new AI brain-mapping data   │
│  □  Peer review with neuroscience community      │
│                                                  │
│  This document is version 0.1.                   │
│  Like Mendeleev's first periodic table,          │
│  it will have gaps and corrections.              │
│  That's the point — the gaps are labeled,        │
│  not hidden.                                     │
│                                                  │
└──────────────────────────────────────────────────┘
```

