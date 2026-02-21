# ONI Layer ↔ Zoom Scale Mapping

Quick reference for mapping animation zoom levels to ONI framework layers.

## Visual Guide

```
BIOLOGY (L9-L14) — What BCI cannot directly control
═══════════════════════════════════════════════════

    ┌────────────────────────────────────────────┐
    │  L14  IDENTITY LAYER         Self          │  ← Whole brain
    │       #4ade80 (light green)                │     15 cm
    │       Continuity, agency, consent          │
    ├────────────────────────────────────────────┤
    │  L13  SEMANTIC LAYER         Intent        │  ← Brain regions
    │       #22c55e (green)                      │     1-5 cm
    │       Meaning, goals, planning             │
    ├────────────────────────────────────────────┤
    │  L12  COGNITIVE SESSION      Context       │  ← Cortical columns
    │       #16a34a (green)                      │     ~1 mm
    │       Working memory, state                │
    ├────────────────────────────────────────────┤
    │  L11  COGNITIVE TRANSPORT    Delivery      │  ← Neural circuits
    │       #15803d (dark green)                 │     ~100 μm
    │       Information routing                  │
    ├────────────────────────────────────────────┤
    │  L10  NEURAL PROTOCOL        Encoding      │  ← Single neuron
    │       #166534 (darker green)               │     10-50 μm
    │       Spike patterns, neural code          │
    ├────────────────────────────────────────────┤
    │  L9   SIGNAL PROCESSING      Filtering     │  ← Synapse
    │       #14532d (darkest green)              │     ~1 μm
    │       Preprocessing, ion channels          │
    └────────────────────────────────────────────┘
                         │
                         ▼
    ╔════════════════════════════════════════════╗
    ║  L8   NEURAL GATEWAY         Firewall      ║  ← BCI INTERFACE
    ║       #d97706 (ORANGE)                     ║     BOUNDARY
    ║       Where silicon meets biology          ║
    ║       ★ THE CRITICAL MOMENT ★              ║
    ╚════════════════════════════════════════════╝
                         │
                         ▼
    ┌────────────────────────────────────────────┐
    │           MOLECULAR DOMAIN                 │
    │           (Below L9 abstraction)           │
    │                                            │
    │   Synaptic cleft      20-40 nm             │
    │   Ion channels        5-10 nm              │
    │   Receptors           5-10 nm              │
    │   Neurotransmitters   ~1 nm                │
    │                                            │
    │   These are what L9 "encapsulates"         │
    │   BCI can trigger, but not synthesize      │
    └────────────────────────────────────────────┘
                         │
                         ▼
SILICON (L1-L7) — Traditional OSI model
═══════════════════════════════════════════════════
```

## Animation Keyframes

| Keyframe | Time | Scale | Structure | ONI Layer | Color |
|----------|------|-------|-----------|-----------|-------|
| KF1 | 0:00 | 15 cm | Whole brain | L14 Identity | `#4ade80` |
| KF2 | 0:05 | 5 cm | Frontal lobe | L13 Semantic | `#22c55e` |
| KF3 | 0:10 | 5 mm | Motor cortex patch | L12 Session | `#16a34a` |
| KF4 | 0:15 | 500 μm | Cortical column | L11 Transport | `#15803d` |
| KF5 | 0:20 | 50 μm | Pyramidal neuron | L10 Protocol | `#166534` |
| KF6 | 0:25 | 5 μm | Axon terminal | L9 Processing | `#14532d` |
| **KF7** | **0:30** | **1 μm** | **Synapse** | **L8 Gateway** | **`#d97706`** |
| KF8 | 0:35 | 100 nm | Synaptic cleft | — | (transition) |
| KF9 | 0:40 | 10 nm | D2 receptor | — | (molecular) |
| KF10 | 0:45 | 1 nm | Dopamine molecule | — | (molecular) |

## The L8 Gateway Moment

This is the **narrative climax** of the animation:

```
Before L8:  Biology layers — what the brain does naturally
            Neurotransmitter synthesis, receptor expression,
            cognitive processing — BCI cannot create these

AT L8:      The interface — where electrode meets neuron
            This is where security matters most
            The "firewall" between silicon and biology

After L8:   Molecular detail — what L8 "encapsulates"
            Ion channels, vesicle release, receptor binding
            BCI can TRIGGER these, but not SUPPLY the molecules
```

### Visual Treatment for L8

1. **Color shift** — Greens fade to orange glow
2. **Text overlay** — "L8 — Neural Gateway"
3. **Particle effect** — Electrons/signals crossing boundary
4. **Sound design** — Dramatic shift in audio
5. **Brief pause** — Let the moment land

## Connecting to ONI Research

This animation visualizes the **Biological Foundation** research:

> "L8 encapsulates everything BCI electrical stimulation cannot directly control — from molecular prerequisites (cofactors, neurotransmitter synthesis) to emergent cognition."

The zoom reveals WHY this matters:
- At macro scale: Identity, meaning, intent (protected)
- At micro scale: The mechanisms BCI interfaces with
- At molecular scale: What BCI CANNOT supply (dopamine, receptors)

## Color Application in Blender

```python
# ONI Biology Layer Colors (sRGB)
oni_colors = {
    'L14': (0.290, 0.871, 0.502),  # #4ade80
    'L13': (0.133, 0.773, 0.369),  # #22c55e
    'L12': (0.086, 0.639, 0.290),  # #16a34a
    'L11': (0.082, 0.502, 0.239),  # #15803d
    'L10': (0.086, 0.396, 0.204),  # #166534
    'L9':  (0.078, 0.325, 0.176),  # #14532d
    'L8':  (0.851, 0.467, 0.024),  # #d97706 (GATEWAY)
}

# Apply as emission for glow effect at layer transitions
```

## Storyboard Sketches

```
[Frame 1: Macro]          [Frame 2: Enter]         [Frame 3: Meso]
┌──────────────┐          ┌──────────────┐          ┌──────────────┐
│    .-~~-.    │          │    .-~~-.    │          │ ║║║║║║║║║║║║ │
│   /      \   │          │   /   ●  \   │          │ ║║║║║║║║║║║║ │
│  |  BRAIN |  │    →     │  |   ↓   |  │    →     │ ║║ CORTEX ║║ │
│   \      /   │          │   \      /   │          │ ║║ LAYERS ║║ │
│    '-__-'    │          │    '-__-'    │          │ ║║║║║║║║║║║║ │
└──────────────┘          └──────────────┘          └──────────────┘

[Frame 4: Micro]          [Frame 5: Synapse]       [Frame 6: L8 GATEWAY]
┌──────────────┐          ┌──────────────┐          ╔══════════════╗
│      Y       │          │  ○○○         │          ║   ★ L8 ★     ║
│     /|\      │          │  ○○○ ══╗     │          ║              ║
│    / | \     │    →     │       ║     │    →     ║  ⚡GATEWAY⚡  ║
│   NEURON     │          │    SYNAPSE   │          ║              ║
│      |       │          │       ╚══ □  │          ║  [BOUNDARY]  ║
└──────────────┘          └──────────────┘          ╚══════════════╝

[Frame 7: Cleft]          [Frame 8: Receptor]      [Frame 9: Molecule]
┌──────────────┐          ┌──────────────┐          ┌──────────────┐
│  ○ ○ ○ ○ ○   │          │              │          │              │
│  ↓ ↓ ↓ ↓ ↓   │          │    ╔═══╗    │          │      ●       │
│ ═══════════  │    →     │    ║ R ║    │    →     │    DOPAMINE  │
│  VESICLE     │          │    ╚═╦═╝    │          │   BINDING    │
│  RELEASE     │          │  RECEPTOR    │          │      ↓       │
└──────────────┘          └──────────────┘          └──────────────┘
```
