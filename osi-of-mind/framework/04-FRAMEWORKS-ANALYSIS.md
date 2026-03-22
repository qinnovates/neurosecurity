# 📐 04 — Frameworks Analysis

> Comparing OSI, Kandel's nervous system hierarchy, and biological organization
> to find the mathematical pattern that should govern the new model.

---

## 🔬 The Three Frameworks

### 🌐 OSI Model (ISO/IEC 7498-1)

```
L7  Application         ~10⁷ m    ~10⁴ s     Meaningful service
L6  Presentation        ~10⁷ m    ~10⁻³ s    Format independence
L5  Session             ~10⁷ m    ~10³ s     Dialog management
L4  Transport           ~10⁷ m    ~10⁰ s     End-to-end reliability
L3  Network             ~10⁴ m    ~10⁻¹ s    Routing & addressing
L2  Data Link           ~10² m    ~10⁻⁵ s    Reliable hop delivery
L1  Physical            ~10⁰ m    ~10⁻⁹ s    Signaling
```

### 🧬 Kandel's Nervous System Hierarchy

```
7   Whole Brain          ~10⁰ m    ~10⁹ s     Unified behavior
6   Systems/Network      ~10⁻¹ m   ~10⁴ s     Multimodal integration
5   Regional             ~10⁻² m   ~10² s     Functional specialization
4   Local Circuit        ~10⁻³ m   ~10⁰ s     Local computation
3   Neuronal             ~10⁻⁵ m   ~10⁻³ s    Integration & threshold
2   Synaptic             ~10⁻⁷ m   ~10⁻¹ s    Directed transmission + plasticity
1   Molecular            ~10⁻⁹ m   ~10⁻⁶ s    Signal transduction
```

### 🦠 Biological Organization (Campbell's Biology)

```
8   Organism             ~10⁰ m    ~10⁹ s     Integrated behavior
7   Organ System         ~10⁰ m    ~10⁷ s     Systemic regulation
6   Organ                ~10⁻¹ m   ~10⁶ s     Multi-tissue function
5   Tissue               ~10⁻² m   ~10⁵ s     Coordinated group function
4   Cell                 ~10⁻⁵ m   ~10⁵ s     Life
3   Organelle            ~10⁻⁶ m   ~10⁰ s     Compartmentalization
2   Macromolecule        ~10⁻⁹ m   ~10⁻³ s    Molecular function
1   Atom                 ~10⁻¹⁰ m  ~10⁻¹⁵ s   Chemical reactivity
```

---

## 📏 The Pattern

### 📐 Spatial Scale Per Layer

```
Framework               Scale Span    Layers    Orders/Layer
──────────────────────────────────────────────────────────────
OSI                     10⁰→10⁷       7         ~1.0
Nervous System          10⁻⁹→10⁰      7         ~1.3
Bio Organization        10⁻¹⁰→10⁰     8         ~1.25
                                                 ─────
                                          Mean:   ~1.1
```

### ⏱️ Temporal Scale Per Layer

```
Framework               Time Span     Layers    Orders/Layer
──────────────────────────────────────────────────────────────
OSI                     10⁻⁹→10⁴      7         ~1.9
Nervous System          10⁻⁶→10⁹      7         ~2.1
Bio Organization        10⁻¹⁵→10⁹     8         ~3.0
                                                 ─────
                                          Mean:   ~2.1
```

### 🧮 The Formula

```
N ≈ log₁₀(S_max / S_min) / 1.1

Where:
  N = predicted number of layers
  S_max = largest spatial scale
  S_min = smallest spatial scale
  1.1 = empirical constant (orders of magnitude per layer)
```

### 🧪 Testing It

```
Framework          log₁₀(span)    Predicted N    Actual N    Error
─────────────────────────────────────────────────────────────────────
OSI                7               6.4            7           +0.6
Bio Organization   10              9.1            8           -1.1
Nervous System     9               8.2            7           -1.2
```

**Works within ±1.5 layers.** Not exact, but the logarithmic relationship is real.

---

## 🤝 Where They Meet

```
BIOLOGY                              OSI
10⁻¹⁰ ──── Atoms
10⁻⁹  ──── Molecules
10⁻⁷  ──── Organelles
10⁻⁵  ──── Cells
10⁻²  ──── Tissue/Regions
10⁻¹  ──── Networks

10⁰   ──── Organism ════════════════ Physical ──── 10⁰
                                     Data Link ─── 10²
                                     Network ───── 10⁴
                                     Transport ─── 10⁷
                                     ...
                                     Application ─ 10⁷

         ▲                    ▲
         │                    │
         └──── THEY MEET ─────┘
               AT ~1 METER
         (the organism boundary)
         (the physical interface)
```

**This is not a coincidence. This is where the BCI sits.**

---

## ⚖️ The Delta (What's Different)

```
                    OSI                     BIOLOGY
                    ─────────────────────── ───────────────────────
Layer coupling      Strict (N±1 only)       Cross-layer shortcuts
                                            (hormones skip 5 levels)

Addressing          Symbolic (IP, MAC)      Molecular recognition
                                            (shape matching)

Dataflow            Primarily feedforward   Dense bidirectional
                                            feedback at every level

Self-repair         None                    Wound healing,
                                            neuroplasticity

Learning            None                    LTP/LTD, conditioning,
                                            epigenetics

Feedback            Sparse (congestion,     Nested multi-timescale
                    error reports)          loops everywhere

Session concept     Setup/teardown          Persistent or ephemeral
                    protocols               (no middle ground)
```

---

## 🎯 What This Means for v2

```
KEEP from OSI:
  ✅ Dependency-based layering
  ✅ Each layer provides service to layer above
  ✅ Encapsulation principle
  ✅ ~1.1 orders of magnitude per layer

KEEP from Biology:
  ✅ The natural seams (molecular → synaptic → neuronal → circuit → region → network)
  ✅ Cross-layer coupling is real (model must acknowledge it)
  ✅ Bidirectional dataflow at every level
  ✅ Plasticity as a property, not a layer

CANNOT IMPORT from OSI:
  ✗ Strict layering (brain violates it)
  ✗ Symbolic addressing (brain uses molecular recognition)
  ✗ Session/Presentation (no biological equivalent — OSI's weakest layers)

CANNOT IMPORT from Biology:
  ✗ Consciousness / unified behavior (can't model it)
  ✗ Emotion as a layer (it's a cross-cutting axis, not a level)
```

