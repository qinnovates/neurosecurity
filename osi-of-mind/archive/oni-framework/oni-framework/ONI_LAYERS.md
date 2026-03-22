# ONI Layer Model Reference

> **ONI**: Open Neurocomputing Interface — A 14-layer framework extending OSI for brain-computer interface (BCI) security.

---

## Table of Contents

- [Executive Summary](#executive-summary)
- [Privacy & Ethics Statement](#privacy--ethics-statement)
- [Complete 14-Layer Model](#complete-14-layer-model)
  - [OSI Stack — Classical Networking (L1-L7)](#osi-stack--classical-networking-l1-l7)
  - [ONI Extension Stack — Neural & Cognitive Systems (L8-L14)](#oni-extension-stack--neural--cognitive-systems-l8-l14)
- [Visual Summary](#visual-summary)
- [Why This Architecture Works](#why-this-architecture-works)
- [Biological Foundation: What L8 Encapsulates](#biological-foundation-what-l8-encapsulates)
  - [The Molecular Substrate Hierarchy](#the-molecular-substrate-hierarchy)
  - [Example 1: The Iron → Dopamine Chain (Detailed)](#example-1-the-iron--dopamine-chain-detailed)
  - [Example 2: Coffee and Alertness (Common Knowledge)](#example-2-coffee-and-alertness-common-knowledge)
  - [Neurotransmitter Systems: Cofactors and Brain Regions](#neurotransmitter-systems-cofactors-and-brain-regions)
  - [Time-Scale Hierarchy Across All Layers](#time-scale-hierarchy-across-all-layers)
  - [What BCI Can and Cannot Do](#what-bci-can-and-cannot-do)
  - [Security Implications: Attack Surfaces Beyond Electrical Monitoring](#security-implications-attack-surfaces-beyond-electrical-monitoring)
- [Threat Landscape by Layer](#threat-landscape-by-layer)
- [External Physical Threats](#external-physical-threats)
- [Coherence Score (Cₛ) Across Layers](#coherence-score-cₛ-across-layers)
- [Scale-Frequency Invariant](#scale-frequency-invariant)
- [Implementation Guide](#implementation-guide)
  - [For BCI Developers](#for-bci-developers)
  - [For Security Researchers](#for-security-researchers)
  - [For Neuroethicists](#for-neuroethicists)
- [References](#references)
- [Changelog](#changelog)

---

## Executive Summary

The ONI Framework extends the classical OSI 7-layer networking model with 7 additional layers (L8-L14) specifically designed for neural and cognitive systems. This creates a complete security model for brain-computer interfaces.

**Key Principle:**
- **OSI (L1-L7)** answers: *How does data move?*
- **ONI (L8-L14)** answers: *Should it move, can it be trusted, and what does it mean—especially when the endpoint is a human brain?*

**L8 (Neural Gateway) is the critical boundary:**
- No neural data crosses without policy, trust, and security validation
- This is where the ONI Firewall operates
- Most attacked, least standardized, most dangerous layer

---

## Privacy & Ethics Statement

**ONI is NOT a surveillance framework.**

The ONI Framework exists to **protect** neural privacy and ensure the **integrity** of brain-computer interfaces. Its purpose is:

- **Defense** against malicious attacks (nation-state actors, cybercriminals)
- **Protection** from accidental risks (MRI exposure, electromagnetic interference, device malfunction)
- **Privacy preservation** ensuring neural data remains confidential
- **Availability** maintaining BCI functionality when users depend on it
- **Human sovereignty** keeping humans in control of their own neural interfaces

The framework provides security without requiring surveillance. Signal integrity can be validated without reading thoughts. Attacks can be detected without decoding intent.

---

## Complete 14-Layer Model
See all detailed layers here: 
[https://github.com/qinnovates/mindloft/edit/main/MAIN/legacy-core/oni-framework/ONI_LAYERS.md](https://qinnovates.github.io/ONI/visualizations/08-oni-framework-viz.html)

### OSI Stack — Classical Networking (L1-L7)

These layers handle data movement. They do not know or care about brains.

| Layer | Name | Domain | Function | Examples |
|-------|------|--------|----------|----------|
| **L1** | Physical | OSI | Transmission of raw bits over a medium | Copper, fiber optics, RF |
| **L2** | Data Link | OSI | Framing, MAC addressing, local delivery | Ethernet, Wi-Fi, Bluetooth |
| **L3** | Network | OSI | Logical addressing and routing | IP, ICMP, BGP |
| **L4** | Transport | OSI | End-to-end delivery, flow control | TCP, UDP, QUIC |
| **L5** | Session | OSI | Connection lifecycle management | TLS sessions, RPC |
| **L6** | Presentation | OSI | Encoding, encryption, compression | TLS, JSON, ASN.1 |
| **L7** | Application | OSI | User-facing network services | HTTP, REST APIs |

**Stop here for traditional networking.** No neurons. No spikes. No cognition. This discipline is what gives ONI legitimacy.

---

### ONI Extension Stack — Neural & Cognitive Systems (L8-L14)

This is where the brain enters the network.

#### L8 — Neural Gateway (Hard Boundary Layer)

| Attribute | Value |
|-----------|-------|
| **Domain** | Bridge (Biology ↔ Silicon) |
| **Function** | Physical and logical interface between neural tissue and computation |
| **Signals** | Action potentials, local field potentials |
| **Frequency** | ~1–500 Hz |
| **Scale** | μm–mm |
| **Examples** | Utah arrays, Neuralink threads, ECoG grids, cochlear implants |

**This is the firewall layer.** All security policy enforcement happens here:
- Read/write access control
- Signal validation and provenance
- Trust establishment
- Isolation enforcement

##### Bidirectional BCI Security at L8

Modern BCIs increasingly support bidirectional operation:

| Direction | Operation | Security Concern | Validation |
|-----------|-----------|------------------|------------|
| **READ** | Brain → Computer | Eavesdropping, privacy leakage | Coherence score (Cₛ), anomaly detection |
| **WRITE** | Computer → Brain | Unauthorized stimulation, tissue damage | Safety bounds, region authorization |

**Stimulation Safety Bounds (WRITE direction):**

The L8 firewall must enforce hardware safety limits for stimulation:

| Parameter | Typical Safe Range | Rationale |
|-----------|-------------------|-----------|
| **Amplitude** | 0–5 mA (5000 μA) | Prevent tissue damage, electrode degradation |
| **Frequency** | 0.1–500 Hz | Within physiological range |
| **Pulse Width** | 50–1000 μs | Balance efficacy and charge injection |
| **Charge Density** | <30 μC/cm²/phase | Shannon limit (k=1.5) prevents irreversible damage |

**Stimulation Command Validation:**

All WRITE commands must pass:
1. **Authentication** — Command source verified
2. **Authorization** — Target region explicitly approved
3. **Safety bounds** — Amplitude, frequency, pulse width within limits
4. **Charge density** — Below tissue damage threshold
5. **Rate limiting** — Prevent stimulation flooding

**References:**
- Shannon, R. V. (1992). A model of safe levels for electrical stimulation. *IEEE Trans Biomed Eng*, 39(4), 424-426.
- Merrill, D. R., Bikson, M., & Jefferys, J. G. (2005). Electrical stimulation of excitable tissue. *J Neurosci Methods*, 141(2), 171-198.

#### L9 — Signal Processing

| Attribute | Value |
|-----------|-------|
| **Domain** | Biology |
| **Function** | Filtering, amplification, denoising, digitization |
| **Signals** | Sampled neural waveforms, spike trains |
| **Frequency** | 1–500 Hz (sampled at kHz rates) |
| **Scale** | Embedded systems, edge compute |
| **Examples** | Spike sorting, FFT analysis, adaptive filters |

#### L10 — Neural Protocol

| Attribute | Value |
|-----------|-------|
| **Domain** | Biology |
| **Function** | Mapping neural signals to machine-readable formats |
| **Signals** | Encoded spike patterns, feature vectors |
| **Frequency** | Event-driven |
| **Scale** | Device ↔ compute node |
| **Examples** | Neural codecs, BCI data schemas, protocol buffers |

#### L11 — Cognitive Transport

| Attribute | Value |
|-----------|-------|
| **Domain** | Biology |
| **Function** | Reliable transmission of neural/cognitive state |
| **Signals** | Structured cognitive packets |
| **Frequency** | Seconds → minutes |
| **Scale** | Distributed systems |
| **Examples** | Cognitive state streaming, redundancy checks, integrity validation |

#### L12 — Cognitive Session

| Attribute | Value |
|-----------|-------|
| **Domain** | Cognitive Systems |
| **Function** | Context persistence, working memory windows |
| **Signals** | Sustained activation patterns |
| **Frequency** | Seconds → minutes |
| **Scale** | Distributed cortical networks |
| **Examples** | Attention windows, task context, session state |

#### L13 — Semantic Layer

| Attribute | Value |
|-----------|-------|
| **Domain** | Cognitive / Executive |
| **Function** | Meaning construction, goal formation, agency |
| **Signals** | Distributed semantic representations |
| **Frequency** | Minutes → hours |
| **Scale** | Association cortex, PFC loops |
| **Examples** | Concept binding, decision policies, action planning, intent decoding |

#### L14 — Identity Layer

| Attribute | Value |
|-----------|-------|
| **Domain** | Human |
| **Function** | Self-model, moral reasoning, long-term coherence |
| **Signals** | Integrated whole-brain patterns |
| **Frequency** | Days → lifetime |
| **Scale** | Whole brain |
| **Examples** | Personal identity, values, ethical constraints, continuity of self |

---

## Visual Summary

```
┌─────────────────────────────────────────────────────────────┐
│                    L14: Identity Layer                       │
│              Self-model, ethics, continuity                  │
├─────────────────────────────────────────────────────────────┤
│                   L13: Semantic Layer                        │
│              Meaning, intent, goals                          │
├─────────────────────────────────────────────────────────────┤
│                 L12: Cognitive Session                       │
│              Context, attention, working memory              │
├─────────────────────────────────────────────────────────────┤
│                L11: Cognitive Transport                      │
│              Reliable neural data delivery                   │
├─────────────────────────────────────────────────────────────┤
│                  L10: Neural Protocol                        │
│              Neural data formatting                          │
├─────────────────────────────────────────────────────────────┤
│                L9: Signal Processing                         │
│              Filtering, digitization                         │
╠═════════════════════════════════════════════════════════════╣
│           ████  L8: NEURAL GATEWAY  ████                     │
│           ████    ONI FIREWALL      ████                     │
│              Trust, Policy, Security                         │
╠═════════════════════════════════════════════════════════════╣
│                  L7: Application (OSI)                       │
│              HTTP, APIs, user services                       │
├─────────────────────────────────────────────────────────────┤
│                 L6: Presentation (OSI)                       │
│              Encoding, encryption                            │
├─────────────────────────────────────────────────────────────┤
│                   L5: Session (OSI)                          │
│              Connection management                           │
├─────────────────────────────────────────────────────────────┤
│                  L4: Transport (OSI)                         │
│              TCP/UDP, flow control                           │
├─────────────────────────────────────────────────────────────┤
│                   L3: Network (OSI)                          │
│              IP routing, addressing                          │
├─────────────────────────────────────────────────────────────┤
│                  L2: Data Link (OSI)                         │
│              Framing, MAC addresses                          │
├─────────────────────────────────────────────────────────────┤
│                  L1: Physical (OSI)                          │
│              Bits on wire, electrical signals                │
└─────────────────────────────────────────────────────────────┘
```

---

## Why This Architecture Works

### 1. OSI Remains Untouched
L1-L7 are exactly what network engineers expect. No biological concepts leak into networking layers.

### 2. Clean Separation of Concerns
- **L1-L7:** Data movement (networking)
- **L8:** Trust boundary (security)
- **L9-L14:** Meaning and cognition (neural)

### 3. L8 as True Choke Point
All data crossing between silicon and biology must pass through L8. This is not a metaphor—it's an enforcement point.

### 4. Standards Alignment
ONI can adopt existing standards:
- L1-L7: IEEE, IETF standards
- L8-L10: Medical device standards (IEC 62443, FDA guidance)
- L11-L14: Emerging neuroethics frameworks

> **⚠️ Future Work (L11-L14):** Unlike the mature standards for L1-L10, no established international standards currently exist for cognitive and identity-layer security. Standards development for L11-L14 requires collaboration with subject matter experts (neuroethicists, cognitive scientists, BCI researchers) and governing agencies (FDA, EU MDR, IEEE, UNESCO, OECD). See `MAIN/governance/POST_DEPLOYMENT_ETHICS.md` and `prd.json` item `future-l11-l14-standards-development` for tracking.

### 5. Scalability
The model works for:
- Current BCIs (cochlear implants, deep brain stimulators)
- Near-term BCIs (Neuralink, Synchron)
- Future neural networks and brain-to-brain interfaces

---

## Biological Foundation: What L8 Encapsulates

A critical design principle of the ONI Framework: **L8 (Neural Gateway) encapsulates all molecular neurobiology**—just as OSI L1 (Physical) abstracts the physics of electrons in copper wire.

Understanding what happens *within* L8 is essential for security because it reveals attack surfaces that **cannot be addressed by electrical monitoring alone**.

### The Molecular Substrate Hierarchy

Neural signaling depends on a cascade of biochemical prerequisites. Each layer must be intact for the next to function:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  MOLECULAR SUBSTRATE (Within L8 Biological Tissue)                          │
│  ───────────────────────────────────────────────────────────────────────── │
│                                                                             │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐ │
│  │   DIETARY   │ →  │  TRANSPORT  │ →  │   STORAGE   │ →  │  AVAILABLE  │ │
│  │   INTAKE    │    │  PROTEINS   │    │  PROTEINS   │    │   POOL      │ │
│  │  (nutrients)│    │(transferrin)│    │ (ferritin)  │    │   (Fe²⁺)    │ │
│  └─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘ │
│                                                                      ↓      │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐ │
│  │  RECEPTOR   │ ←  │  SYNAPTIC   │ ←  │  VESICLE    │ ←  │   ENZYME    │ │
│  │  BINDING    │    │  RELEASE    │    │  STORAGE    │    │  SYNTHESIS  │ │
│  │ (D1,D2,etc) │    │ (exocytosis)│    │  (VMAT)     │    │   (TH+BH4)  │ │
│  └─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘ │
│         ↓                                                                   │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  SIGNAL TRANSDUCTION → G-proteins → Second messengers → Gene expr.  │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ═══════════════════════════════════════════════════════════════════════   │
│                        L8 BOUNDARY (BCI Interface)                          │
│  ═══════════════════════════════════════════════════════════════════════   │
│                                                                             │
│  BCI can READ/WRITE here: Action potentials, LFPs, population activity     │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

### Example 1: The Iron → Dopamine Chain (Detailed)

This example demonstrates why molecular dependencies matter for BCI security, including the specific brain regions involved.

#### Brain Regions in the Dopamine System

| Pathway | Origin | Target | Function |
|---------|--------|--------|----------|
| **Nigrostriatal** | Substantia Nigra pars compacta (SNc) | Dorsal Striatum (caudate, putamen) | Motor control; ~80% of brain dopamine |
| **Mesolimbic** | Ventral Tegmental Area (VTA) | Nucleus Accumbens (NAc) | Reward, motivation, reinforcement |
| **Mesocortical** | Ventral Tegmental Area (VTA) | Prefrontal Cortex (PFC) | Executive function, working memory |
| **Tuberoinfundibular** | Hypothalamus | Pituitary gland | Prolactin regulation |

**Reference:** Björklund, A., & Dunnett, S. B. (2007). Dopamine neuron systems in the brain: an update. *Trends in Neurosciences*, 30(5), 194-202.

#### The Chain of Dependencies

| Step | Component | Function | Brain Location | If Missing |
|------|-----------|----------|----------------|------------|
| 1 | **Dietary Iron** | Raw material | Absorbed in gut | Chain fails at start |
| 2 | **Transferrin** | Blood transport protein | Systemic circulation | Iron cannot reach brain |
| 3 | **Transferrin Receptor 1 (TfR1)** | Neuronal iron uptake | SNc, VTA neurons | Neurons become iron-deficient |
| 4 | **Ferritin** | Iron storage protein | Neuronal cytoplasm | No stable Fe²⁺ reservoir |
| 5 | **Labile Iron Pool (Fe²⁺)** | Available cofactor | Active enzyme sites | Enzymes cannot function |
| 6 | **Tyrosine Hydroxylase (TH)** | Rate-limiting enzyme | SNc, VTA cell bodies | No L-DOPA synthesis |
| 7 | **BH4 (Tetrahydrobiopterin)** | Essential cofactor | Enzyme active site | TH inactive even with iron |
| 8 | **L-DOPA** | Dopamine precursor | Cytoplasm | No dopamine produced |
| 9 | **DOPA Decarboxylase (DDC)** | Conversion enzyme | Cytoplasm | L-DOPA accumulates unused |
| 10 | **Dopamine** | Final neurotransmitter | Vesicles → synaptic terminals | No signal to release |

#### Research Evidence

**Iron-Dopamine Link (PNAS, 2016):**

> "Loss of transferrin receptor 1, but not loss of ferroportin, can cause neurodegeneration in a subset of dopaminergic neurons in mice... Loss of transferrin receptor caused neuronal iron deficiency and neurodegeneration with features similar to Parkinson's disease."

— Matak, P., et al. (2016). Disrupted iron homeostasis causes dopaminergic neurodegeneration in mice. *PNAS*, 113(13), 3428-3435. https://doi.org/10.1073/pnas.1519473113

**Tyrosine Hydroxylase Cofactors:**

> "Tyrosine hydroxylase (TH), which was discovered at the National Institutes of Health (NIH) in 1964, is a tetrahydrobiopterin (BH4)-requiring monooxygenase that catalyzes the first and rate-limiting step in the biosynthesis of catecholamines... Each of the four subunits in tyrosine hydroxylase is coordinated with an iron(II) atom. If the iron is oxidized to Fe(III), the enzyme is inactivated."

— Nagatsu, T. (2016). Tyrosine hydroxylase (TH), its cofactor tetrahydrobiopterin (BH4)... *J Neural Transm*, 123, 729-738. https://pubmed.ncbi.nlm.nih.gov/27491309/

**Iron in Substantia Nigra:**

> "The substantia nigra, where the selective loss of dopaminergic neurons occurs, is the primary region in the brain known to deposit iron. Aberrant iron concentrations have been observed... increased iron levels in the substantia nigra correlate with the severity of PD."

— Zucca, F.A., et al. (2017). Iron deposition in substantia nigra. *Scientific Reports*, 7, 14721. https://doi.org/10.1038/s41598-017-14721-1

#### Security Implication

A nutritional depletion attack (cutting iron supply) would cause gradual dopaminergic dysfunction in the **substantia nigra** and **VTA** that a BCI would detect as "reduced signaling" in the **striatum** and **prefrontal cortex**, but could not identify the molecular cause or compensate via electrical stimulation.

---

### Example 2: Coffee and Alertness (Common Knowledge)

A familiar example that illustrates the same molecular-before-electrical principle, showing how even everyday experiences depend on specific brain circuits.

#### Brain Regions in the Adenosine/Caffeine System

| Structure | Location | Role in Sleep-Wake |
|-----------|----------|-------------------|
| **Nucleus Accumbens (NAc) Shell** | Ventral striatum | **Primary site of caffeine action**; A2A receptors here mediate arousal |
| **Basal Forebrain** | Rostral to hypothalamus | Adenosine accumulates here during wakefulness |
| **Ventrolateral Preoptic Area (VLPO)** | Anterior hypothalamus | Primary sleep-promoting center (GABAergic) |
| **Lateral Hypothalamus (LHA)** | Hypothalamus | Contains orexin/hypocretin wake-promoting neurons |
| **Locus Coeruleus (LC)** | Brainstem (pons) | Norepinephrine arousal center |
| **Tuberomammillary Nucleus (TMN)** | Posterior hypothalamus | Histamine arousal center |

#### Mechanism

```
NORMAL SLEEP DRIVE:
  Wakefulness → ATP breakdown → Adenosine accumulates (basal forebrain)
      ↓
  Adenosine binds A1/A2A receptors → Inhibits arousal circuits
      ↓
  NAc shell A2A activation → GABAergic output → Inhibits LHA, TMN, LC
      ↓
  Sleepiness increases

WITH COFFEE:
  Caffeine (adenosine receptor antagonist) → Blocks A2A receptors in NAc shell
      ↓
  Adenosine cannot bind → Arousal circuits disinhibited
      ↓
  LHA (orexin), TMN (histamine), LC (norepinephrine) remain active
      ↓
  Sustained wakefulness
```

#### Research Evidence

**Nucleus Accumbens as Caffeine Target (Journal of Neuroscience, 2011):**

> "Using selective gene deletion strategies... we reported that the A2A receptors in the shell region of the nucleus accumbens (NAc) are responsible for the effect of caffeine on wakefulness... the arousal effect of caffeine was abolished in NAc–A2AR KO mice."

— Lazarus, M., et al. (2011). Arousal effect of caffeine depends on adenosine A2A receptors in the shell of the nucleus accumbens. *J Neurosci*, 31(27), 10067-10075. https://doi.org/10.1523/JNEUROSCI.6730-10.2011

**Adenosine Accumulation in Basal Forebrain:**

> "Continuous monitoring of adenosine levels during a sleep-wake cycle of freely moving cats showed that adenosine accumulates during prolonged wakefulness (6 h) in the basal forebrain and, to a lower degree, in the cortex."

— Porkka-Heiskanen, T., et al. (1997). Adenosine: A mediator of the sleep-inducing effects of prolonged wakefulness. *Science*, 276(5316), 1265-1268.

**Region Specificity:**

> "Caffeine-induced arousal was not affected in rats when A2ARs were focally removed from the NAc core or other A2AR-positive areas of the basal ganglia... the area of the human brain in which caffeine acts to counteract fatigue, the shell of the NAc, is just about the astonishingly small size of a pea."

— Lazarus, M., et al. (2011). *J Neurosci*, 31(27), 10067-10075.

#### What a BCI Could and Could NOT Do

| Observation | BCI Capability | Limitation |
|-------------|---------------|------------|
| Detect increased neural firing in cortex | ✅ Can detect | Cannot identify caffeine as cause |
| Measure changed oscillation patterns | ✅ Can detect | Cannot distinguish from other arousal states |
| Directly block adenosine receptors | ❌ Cannot | Requires caffeine molecule at A2A receptor |
| Stimulate NAc to produce wakefulness | ⚠️ Partial | Can increase activity, but effect differs from receptor blockade |
| Reverse adenosine binding | ❌ Cannot | Molecular process, not electrical |

**The insight:** Even a simple, familiar experience like "feeling awake after coffee" involves molecular machinery in a **pea-sized region** (NAc shell) that electrical stimulation cannot replicate. A BCI can *trigger* neurons that are ready to fire, but cannot *supply* the molecular antagonist or *block* specific receptor binding.

---

### Neurotransmitter Systems: Cofactors and Brain Regions

| System | Rate-Limiting Enzyme | Required Cofactors | Primary Brain Regions | BCI Can Trigger Release? |
|--------|---------------------|-------------------|----------------------|-------------------------|
| **Dopamine** | Tyrosine Hydroxylase | Fe²⁺, BH4, O₂ | SNc, VTA → Striatum, NAc, PFC | Yes, if pre-synthesized |
| **Serotonin** | Tryptophan Hydroxylase | Fe²⁺, BH4, O₂ | Raphe nuclei → Widespread | Yes, if pre-synthesized |
| **Norepinephrine** | Dopamine β-Hydroxylase | Cu²⁺, Ascorbate, O₂ | Locus coeruleus → Widespread | Yes, if pre-synthesized |
| **GABA** | Glutamic Acid Decarboxylase | Pyridoxal-5'-phosphate (B6) | Cortex, basal ganglia, cerebellum | Yes, if pre-synthesized |
| **Glutamate** | Glutaminase | Phosphate | Cortex, hippocampus, thalamus | Yes, if pre-synthesized |
| **Acetylcholine** | Choline Acetyltransferase | Acetyl-CoA, Choline | Basal forebrain, brainstem | Yes, if pre-synthesized |
| **Endorphins** | Prohormone Convertases | Ca²⁺-dependent proteases | Hypothalamus (arcuate), PAG | Yes, if POMC processed |
| **Endocannabinoids** | DAGL (2-AG), NAPE-PLD (AEA) | Membrane lipid precursors | Widespread (retrograde signaling) | Partially (on-demand synthesis) |

---

### Time-Scale Hierarchy Across All Layers

Neural processing spans **15+ orders of magnitude** in time—from femtoseconds to decades:

| Time Scale | Duration | Process | ONI Layer | Brain Example | BCI Access |
|------------|----------|---------|-----------|---------------|------------|
| **Femtoseconds** | 10⁻¹⁵ s | Electron transfer in enzymes | Within L8 | Fe²⁺ oxidation in TH | ❌ None |
| **Picoseconds** | 10⁻¹² s | Molecular vibrations | Within L8 | BH4 conformational change | ❌ None |
| **Nanoseconds** | 10⁻⁹ s | Ion channel gating | Within L8 | Na⁺ channel activation | ❌ None |
| **Microseconds** | 10⁻⁶ s | Vesicle fusion, NT release | L8 boundary | Dopamine release at striatal synapse | ⚠️ Indirect |
| **Milliseconds** | 10⁻³ s | Action potentials | L8-L9 | SNc neuron spike | ✅ Direct |
| **Tens of ms** | 10⁻² s | Synaptic integration | L9 | Striatal MSN integration | ✅ Direct |
| **Hundreds of ms** | 10⁻¹ s | Sensory processing | L9-L10 | Visual cortex response | ✅ Direct |
| **Seconds** | 10⁰ s | Working memory | L10-L11 | PFC sustained activity | ✅ Direct |
| **Minutes** | 10² s | Short-term plasticity | L11-L12 | Hippocampal STD/STF | ✅ Direct |
| **Hours** | 10⁴ s | LTP, memory consolidation | L12-L13 | Hippocampus → Cortex transfer | ⚠️ Indirect |
| **Days** | 10⁵ s | Synaptic remodeling | L13 | Dendritic spine changes | ⚠️ Indirect |
| **Weeks-Months** | 10⁶-⁷ s | Structural plasticity | L13-L14 | Motor cortex reorganization | ⚠️ Indirect |
| **Years-Lifetime** | 10⁸+ s | Identity formation | L14 | Autobiographical memory networks | ❌ Read-only |

**The Speed Boundary:** BCIs operate effectively in the **milliseconds-to-seconds** range (action potentials, LFPs, population dynamics). Faster processes (molecular) and slower processes (plasticity, identity) are largely inaccessible to direct electrical intervention.

---

### What BCI Can and Cannot Do

| Capability | BCI Direct | BCI Indirect | Requires Pharmacology |
|------------|-----------|--------------|----------------------|
| **Detect action potentials** | ✅ | — | — |
| **Trigger action potentials** | ✅ | — | — |
| **Cause neurotransmitter release** | — | ✅ (via AP→Ca²⁺) | — |
| **Synthesize neurotransmitters** | ❌ | ❌ | ✅ Precursors/cofactors |
| **Block specific receptors** | ❌ | ❌ | ✅ Antagonists |
| **Activate specific receptors** | ❌ | ❌ | ✅ Agonists |
| **Supply missing cofactors (Fe²⁺, BH4, B6)** | ❌ | ❌ | ✅ Supplements |
| **Read population activity** | ✅ | — | — |
| **Decode cognitive state** | — | ✅ (inference) | — |
| **Modify gene expression** | ❌ | ⚠️ (via sustained activity) | ✅ Direct |
| **Alter synaptic strength** | — | ✅ (plasticity protocols) | ✅ Direct |

---

### Security Implications: Attack Surfaces Beyond Electrical Monitoring

Understanding the molecular substrate reveals attack vectors that **L8 electrical monitoring alone cannot detect**:

| Attack Type | Target | Brain Region Affected | Detection by BCI | Required Defense |
|-------------|--------|----------------------|------------------|------------------|
| **Iron depletion** | TfR1, Ferritin | SNc, VTA | ⚠️ Sees reduced striatal DA | Metabolic monitoring |
| **BH4 inhibition** | GTP cyclohydrolase | All catecholamine neurons | ⚠️ Sees reduced NT globally | Pterin level assays |
| **B6 depletion** | GAD (GABA synthesis) | Cortex, basal ganglia | ⚠️ Sees reduced inhibition | Vitamin monitoring |
| **Receptor antagonism** | D1/D2 in striatum | Motor, reward circuits | ❌ Sees normal release, no effect | Receptor occupancy imaging |
| **Adenosine agonism** | A2A in NAc shell | Arousal circuits | ❌ Sees normal firing, increased sleep | Sleep architecture analysis |
| **Precursor depletion** | Tyrosine, tryptophan | SNc, VTA, raphe | ⚠️ Delayed detection | Amino acid monitoring |

**Conclusion:** Comprehensive BCI security requires integration with biochemical monitoring systems—electrical signals alone provide an incomplete picture of neural health and potential manipulation.

---

## Threat Landscape by Layer

| Layer | Primary Threats | Defense Strategy |
|-------|-----------------|------------------|
| **L1-L4** | Network attacks, MitM, DDoS | Standard network security |
| **L5-L7** | Application exploits, injection | Input validation, encryption |
| **L8 (READ)** | Eavesdropping, signal interception | ONI Firewall, coherence validation |
| **L8 (WRITE)** | Unauthorized stimulation, tissue damage | Safety bounds, region authorization, charge limits |
| **L9** | Signal injection, jamming | Anomaly detection, hardware validation |
| **L10** | Protocol manipulation | Schema validation, checksums |
| **L11-L12** | Session hijacking, state corruption | Session tokens, integrity checks |
| **L13** | Intent manipulation, semantic attacks | Context validation, anomaly detection |
| **L14** | Identity attacks, long-term manipulation | Behavioral baselines, ethics filters |

### Bidirectional Threat Considerations

For BCIs supporting both READ and WRITE operations:

| Attack Type | Direction | Target Layers | Impact |
|-------------|-----------|---------------|--------|
| **Motor Hijacking** | WRITE | L8, L13 | Unauthorized movement commands |
| **Sensory Override** | WRITE | L8, L12 | Fake sensory input injection |
| **Stimulation Flooding** | WRITE | L8 | DoS via rapid command sequences |
| **Amplifier Saturation** | WRITE | L8-L9 | Exceed safe charge density |
| **Closed-Loop Poisoning** | BOTH | L8-L11 | Manipulate feedback systems |
| **Cognitive State Manipulation** | BOTH | L11-L14 | Alter mood, attention, memory |

---

## External Physical Threats

BCIs face unique threats from the physical environment:

| Threat | Description | Detection | Mitigation |
|--------|-------------|-----------|------------|
| **MRI Exposure** | Strong magnetic fields can damage implants or cause heating | Pre-scan protocols | MRI-conditional designs |
| **Electromagnetic Interference** | RF, power lines, industrial equipment | EMI signature detection | Shielding, filtering |
| **Physical Trauma** | Impact to head affecting implant | Accelerometer data, signal disruption | Ruggedized designs |
| **Intentional Jamming** | Deliberate RF interference | Signal quality monitoring | Frequency hopping |
| **Proximity Attacks** | ProxMark-style RFID/NFC attacks | Unexpected command sequences | Authentication, encryption |
| **ESD/Lightning** | Electrostatic discharge | Transient detection | Surge protection |

---

## Coherence Score (Cₛ) Across Layers

The Coherence Score measures signal integrity and trustworthiness:

```
Cₛ = e^-(σ²ᵩ + σ²τ + σ²γ)

Where:
  σ²ᵩ = Phase variance (timing jitter)
  σ²τ = Transport variance (pathway reliability)
  σ²γ = Gain variance (amplitude stability)
```

| Layer | Coherence Role |
|-------|----------------|
| **L8** | Primary validation point—signals with Cₛ < threshold are blocked |
| **L9** | Hardware-level coherence (SNR, impedance) |
| **L10-L11** | Protocol-level coherence (packet integrity) |
| **L12-L14** | Cognitive coherence (semantic consistency) |

---

## Scale-Frequency Invariant

A fundamental constraint observed across neural systems:

```
f × S ≈ k

Where:
  f = Frequency (Hz)
  S = Spatial scale
  k = Constant (~20-25 for neural systems)
```

This invariant helps validate signals: violations may indicate attacks or malfunctions.

| Scale | Typical Frequency | f × S |
|-------|-------------------|-------|
| Synapse (μm) | ~1000 Hz | ~1 |
| Microcircuit (mm) | ~100 Hz | ~100 |
| Region (cm) | ~10 Hz | ~100 |
| Whole brain | ~1 Hz | ~100 |

---

## Implementation Guide

### For BCI Developers

1. **Implement L8 first** — This is your security foundation
2. **Use Cₛ validation** — Block signals below coherence threshold
3. **Monitor L9 metrics** — Impedance, SNR, signal quality
4. **Log all boundary crossings** — Audit trail for L8 events

### For Security Researchers

1. **Focus on L8 attacks** — Most impactful, least standardized
2. **Study coherence manipulation** — Can attackers fake Cₛ?
3. **Cross-layer attacks** — How do L1-L7 attacks propagate to L8+?
4. **Develop detection signatures** — For NSAM integration

### For Neuroethicists

1. **L14 is the identity layer** — What protections are needed?
2. **Consent at L8** — How is read/write permission granted?
3. **L13 intent privacy** — Can intent be validated without being read?

---

## Layer Definition File Locations

> **CRITICAL:** When updating layer names, zones, or definitions, ALL files below must be updated to maintain consistency.

### Source of Truth Hierarchy

| Priority | File | Purpose | Update When |
|----------|------|---------|-------------|
| **1** | `MAIN/legacy-core/oni-framework/ONI_LAYERS.md` | Authoritative reference | Layer definitions change |
| **2** | `MAIN/legacy-core/resources/brand/brand.json` | Machine-readable source | Any layer name/zone change |

### Consumer Files (Must Match Source of Truth)

| File | Type | Contains |
|------|------|----------|
| `docs/index.html` | HTML | GitHub Pages visualization (14-layer animation) |
| `MAIN/legacy-core/oni-product-demo/src/components/LayerStack.tsx` | React/Remotion | Demo video layer stack component |
| `MAIN/legacy-core/oni-product-demo/src/data/oni-theme.ts` | TypeScript | Video theme colors and layer comments |
| `autodidactive/motion/src/theme.ts` | TypeScript | Motion Canvas video theme |
| `MAIN/legacy-core/tara-nsec-platform/tara_mvp/visualization/themes/oni_theme.py` | Python | TARA dashboard visualization |
| `MAIN/legacy-core/resources/editor/checks/layer_validation.md` | Markdown | Editor Agent validation rules |
| `MAIN/legacy-core/oni-framework/oni/layers.py` | Python | ONI Framework Python API |

### Current Layer Mapping (v3.0)

| Layer | Name | Zone Label | Domain | OSI Parallel |
|-------|------|------------|--------|--------------|
| L1 | Physical Carrier | Physical | Silicon | Physical |
| L2 | Signal Processing | Data Link | Silicon | Data Link |
| L3 | Protocol | Network | Silicon | Network |
| L4 | Transport | Transport | Silicon | Transport |
| L5 | Session | Session | Silicon | Session |
| L6 | Presentation | Presentation | Silicon | Presentation |
| L7 | Application Interface | Application | Silicon | Application |
| **L8** | **Neural Gateway** | **Firewall** | **Bridge** | — |
| L9 | Signal Processing | Filtering | Biology | Data Link |
| L10 | Neural Protocol | Encoding | Biology | Network |
| L11 | Cognitive Transport | Delivery | Biology | Transport |
| L12 | Cognitive Session | Context | Biology | Session |
| L13 | Semantic Layer | Intent | Biology | Presentation |
| L14 | Identity Layer | Self | Biology | Application |

### Biological Foundation Mapping

The Biology layers (L9-L14) process signals that originate from molecular and cellular processes encapsulated within L8. Key mappings:

| Neurotransmitter System | Key Brain Regions | Primary ONI Layer |
|------------------------|-------------------|-------------------|
| Dopamine | SNc, VTA → Striatum, NAc, PFC | L13 (Semantic - reward, motivation) |
| Serotonin | Raphe nuclei → Widespread | L12-L14 (mood, cognition) |
| Norepinephrine | Locus coeruleus → Widespread | L11-L13 (arousal, attention) |
| GABA | Cortex, basal ganglia | L9-L12 (inhibition, filtering) |
| Glutamate | Cortex, hippocampus | L9-L12 (excitation, encoding) |
| Adenosine | NAc shell, basal forebrain | L11-L12 (sleep pressure, context) |

### Update Protocol

When layer definitions change:

1. **Update ONI_LAYERS.md** (this file) with new definitions
2. **Update brand.json** with machine-readable changes
3. **Run verification:**
   ```bash
   grep -rn "L9.*Signal Processing\|L10.*Neural Protocol" MAIN/legacy-core/
   grep -rn "L9.*Ion Channel\|L10.*Spike Train" MAIN/legacy-core/  # Should return 0 results
   ```
4. **Update all consumer files** listed above
5. **Update CLAUDE.md** instructions if workflow changes
6. **Commit with clear message** noting layer changes

---

## References

### Standards & Guidelines
- OSI Model: ISO/IEC 7498-1
- Medical Device Cybersecurity: FDA Guidance 2023
- BCI Security: [ONI Framework Publications](../publications/0-oni-framework/)
- Coherence Metric: [Technical Document](../publications/coherence-metric/)
- Neural Firewall: [Technical Document](../publications/neural-firewall/)

### Neuroscience Research (Biological Foundation Section)

**Dopamine & Iron:**
- Matak, P., et al. (2016). Disrupted iron homeostasis causes dopaminergic neurodegeneration in mice. *PNAS*, 113(13), 3428-3435. https://doi.org/10.1073/pnas.1519473113
- Nagatsu, T. (2016). Tyrosine hydroxylase (TH), its cofactor tetrahydrobiopterin (BH4), other catecholamine-related enzymes... *J Neural Transm*, 123, 729-738. https://pubmed.ncbi.nlm.nih.gov/27491309/
- Zucca, F.A., et al. (2017). Iron deposition in substantia nigra. *Scientific Reports*, 7, 14721. https://doi.org/10.1038/s41598-017-14721-1
- Björklund, A., & Dunnett, S. B. (2007). Dopamine neuron systems in the brain: an update. *Trends in Neurosciences*, 30(5), 194-202.

**Adenosine & Caffeine:**
- Lazarus, M., et al. (2011). Arousal effect of caffeine depends on adenosine A2A receptors in the shell of the nucleus accumbens. *J Neurosci*, 31(27), 10067-10075. https://doi.org/10.1523/JNEUROSCI.6730-10.2011
- Porkka-Heiskanen, T., et al. (1997). Adenosine: A mediator of the sleep-inducing effects of prolonged wakefulness. *Science*, 276(5316), 1265-1268.
- Huang, Z.L., et al. (2005). Adenosine A2A, but not A1, receptors mediate the arousal effect of caffeine. *Nat Neurosci*, 8, 858-859.

**BH4 & Neurotransmitter Synthesis:**
- Werner, E.R., et al. (2011). Tetrahydrobiopterin: biochemistry and pathophysiology. *Biochem J*, 438(3), 397-414.
- Thöny, B., et al. (2000). Tetrahydrobiopterin biosynthesis, regeneration and functions. *Biochem J*, 347, 1-16.

**Synaptic Transmission & Calcium:**
- Südhof, T.C. (2012). Calcium control of neurotransmitter release. *Cold Spring Harb Perspect Biol*, 4(1), a011353. https://pmc.ncbi.nlm.nih.gov/articles/PMC3249630/
- Katz, B., & Miledi, R. (1967). The timing of calcium action during neuromuscular transmission. *J Physiol*, 189(3), 535-544.

### Visual Implementations

These implementations render the 14-layer model and must stay synchronized with this document:

| Implementation | Location | Purpose |
|----------------|----------|---------|
| **brand.json** | [`MAIN/legacy-core/resources/brand/brand.json`](../resources/brand/brand.json) | Single source of truth for layer data (names, colors, zones) |
| **Video Animation** | [`MAIN/legacy-core/oni-product-demo/src/components/LayerStack.tsx`](../oni-product-demo/src/components/LayerStack.tsx) | Remotion video layer stack with cascade animation |
| **GitHub Pages** | [`docs/index.html`](../../docs/index.html) | Website scroll-reveal animation with L8 expansion effect |
| **Python API - Layers** | [`oni/layers.py`](oni/layers.py) | Programmatic layer access, attack surfaces, defenses |
| **Python API - Neuroscience** | [`oni/neuromapping.py`](oni/neuromapping.py) | Brain regions, neurotransmitters, functions, citations |

> **Sync Protocol:** When updating layer names or structure, update `brand.json` first, then propagate to all consumers listed above.

### Python API: Neuroscience Mappings

The ONI Framework Python API (`oni-framework`) includes a comprehensive neuroscience mapping module that connects brain regions, neurotransmitter systems, and cognitive functions to the 14-layer model. All mappings are backed by peer-reviewed research citations.

#### Installation

```bash
pip install oni-framework
```

#### Quick Start

```python
from oni import ONIStack, NeuroscienceAtlas, get_atlas

# Get the ONI stack with neuroscience integration
stack = ONIStack()

# Get brain regions relevant to Layer 13 (Semantic Layer)
regions = stack.brain_regions_for_layer(13)
print(regions)  # ['VTA', 'NAc', 'PFC', 'hippocampus', 'amygdala']

# Get neurotransmitters for Layer 12 (Cognitive Session)
neurotransmitters = stack.neurotransmitters_for_layer(12)
print(neurotransmitters)  # ['dopamine', 'serotonin', 'norepinephrine', ...]

# Generate a comprehensive layer report
print(stack.layer_neuroscience_report(13))
```

#### Available Mappings

| Mapping Type | Module | Count | Description |
|--------------|--------|-------|-------------|
| **Brain Regions** | `BrainRegionAtlas` | 15+ | SNc, VTA, NAc, PFC, hippocampus, etc. |
| **Neurotransmitters** | `NeurotransmitterAtlas` | 8 | DA, 5-HT, NE, GABA, Glu, ACh, adenosine, eCB |
| **Cognitive Functions** | `CognitiveFunctionAtlas` | 10 | motor, memory, attention, reward, emotion, etc. |
| **Time Scales** | `TimeScaleHierarchy` | 13 | Femtoseconds to lifetime |
| **Citations** | `References` | 20+ | Peer-reviewed sources for all data |

#### Brain Region Lookup

```python
from oni import get_atlas

atlas = get_atlas()

# Look up a brain region
snc = atlas.brain_region("SNc")
print(f"{snc.full_name}")           # "Substantia Nigra pars compacta"
print(f"Functions: {snc.primary_functions}")  # ['motor control', 'movement initiation', ...]
print(f"ONI Layers: {snc.oni_layers}")        # [9, 10, 11]
print(f"BCI Access: {snc.bci_access}")        # 'low'

# Find regions by neurotransmitter
dopamine_regions = atlas.regions.by_neurotransmitter("dopamine")
for r in dopamine_regions:
    print(f"  {r.abbreviation}: {r.full_name}")
```

#### Neurotransmitter System Lookup

```python
from oni import get_atlas

atlas = get_atlas()

# Look up a neurotransmitter system
da = atlas.neurotransmitter("dopamine")
print(f"Synthesis enzyme: {da.synthesis_enzyme}")     # "Tyrosine Hydroxylase (TH)"
print(f"Required cofactors: {da.required_cofactors}") # ['Fe²⁺', 'BH4', 'O₂']
print(f"Synthesis regions: {da.synthesis_regions}")   # ['SNc', 'VTA']
print(f"BCI can trigger release: {da.bci_can_trigger_release}")  # True
print(f"BCI can synthesize: {da.bci_can_synthesize}")            # False

# Find systems requiring a specific cofactor
iron_dependent = atlas.neurotransmitters.by_cofactor("Fe")
print("Iron-dependent systems:", [nt.name for nt in iron_dependent])
# ['dopamine', 'serotonin']
```

#### Security Analysis

```python
from oni import ONIStack

stack = ONIStack()

# Get security implications for a layer
implications = stack.security_implications_for_layer(13)
for imp in implications:
    print(f"⚠ {imp}")
# ⚠ Reward Processing: Reward pathway manipulation could alter motivation or cause addiction
# ⚠ dopamine: Iron depletion attack would reduce synthesis. BCI cannot compensate via electrical stimulation.
```

#### Research Citations

All data in the neuroscience mappings is backed by peer-reviewed research:

```python
from oni import get_atlas

atlas = get_atlas()

# Get citations for a topic
for cite in atlas.citations_for("dopamine"):
    print(cite.apa_format())
# Björklund, A., & Dunnett, S. B. (2007). Dopamine neuron systems in the brain...
# Matak, P., et al. (2016). Disrupted iron homeostasis causes dopaminergic neurodegeneration...

# Access a specific citation
bjorklund = atlas.citation("bjorklund2007")
print(f"Key finding: {bjorklund.key_finding}")
# "Comprehensive mapping of dopamine pathways: nigrostriatal, mesolimbic, mesocortical, tuberoinfundibular"
```

#### BCI Capabilities Summary

```python
from oni import get_atlas

atlas = get_atlas()
capabilities = atlas.bci_capabilities_summary()

print("Can trigger release:", capabilities["can_trigger_release"])
# ['dopamine', 'serotonin', 'norepinephrine', 'GABA', 'glutamate', 'acetylcholine', 'endocannabinoids']

print("Cannot synthesize:", capabilities["cannot_synthesize"])
# All neurotransmitters - BCI cannot create molecules

print("Accessible time range:", capabilities["accessible_time_range"])
# ('milliseconds (10⁻³ s)', 'minutes (10² s)')

print("High BCI access regions:", capabilities["high_access_regions"])
# ['PFC', 'M1', 'V1', 'A1']
```

#### Layer-to-Neuroscience Mapping Table

| ONI Layer | Brain Regions | Neurotransmitters | Primary Functions |
|-----------|---------------|-------------------|-------------------|
| L9 (Signal Processing) | V1, A1 | Glu, GABA | Sensory processing |
| L10 (Neural Protocol) | M1, SNc, striatum | DA, Glu, GABA | Motor control, encoding |
| L11 (Cognitive Transport) | LC, BF, LHA, VLPO | NE, ACh, adenosine | Attention, arousal, sleep |
| L12 (Cognitive Session) | PFC, hippocampus, NAc | DA, 5-HT, ACh, NE | Working memory, context |
| L13 (Semantic Layer) | VTA, NAc, PFC, amygdala | DA, 5-HT | Reward, decision, intent |
| L14 (Identity Layer) | PFC, hippocampus | DA, 5-HT | Self-awareness, identity |

> **Citation Note:** All mappings are derived from peer-reviewed neuroscience literature. See the `References` class in `oni/neuromapping.py` for complete citations including DOIs and PubMed IDs.

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 3.1 | 2026-01-26 | **Python API neuroscience mappings**: Added `neuromapping.py` module with brain regions (15+), neurotransmitter systems (8), cognitive functions (10), time scales (13), research citations (20+). All data backed by peer-reviewed literature with DOIs/PMIDs. |
| 3.0 | 2026-01-26 | **Major addition**: Biological Foundation section with molecular substrate hierarchy, time-scale analysis (femtoseconds to lifetime), detailed examples (Iron→Dopamine with SNc/VTA/Striatum, Caffeine→Adenosine with NAc shell), BCI capabilities vs limitations, research citations |
| 2.2 | 2026-01-25 | Added bidirectional BCI security: stimulation safety bounds, WRITE direction threats |
| 2.1 | 2026-01-24 | Fixed L9-L11 domain labels: Silicon → Biology (L9+ is neural side of bridge) |
| 2.0 | 2026-01-22 | Major revision: L1-L7 now pure OSI, L8-L14 neural extension |
| 1.0 | 2026-01 | Initial release with biological L1-L7 (deprecated) |

---

*This document is the authoritative reference for ONI layer definitions. All other documentation should reference this file.*

*Last Updated: 2026-01-26*
