NOTE: Trying to codify this and stitching the elements together. It's not as easy as expected and will need to be backlogged for now and revisiting! This is a great way for visual learners like myself to grasp at how BCIs truly work at the bio-digital boundary and demonstrate the synapses that get stimulated.

# BCI Macro-to-Micro Zoom Animation Rendering (3D)

> **Objective:** Learn and visually demonstrate how different BCIs stimulate neurons — including Utah Arrays, Neuralink, and other devices — showing what depth they reach, which brain regions they target, and how signals propagate from electrode to molecule.

---

## Why This Homework Assignment Matters

To take my understanding of BCI security to the next level, I need to deeply understand the physical interface between silicon and biology. Building the ONI Framework requires more than theoretical knowledge — I need to *see* how electrodes interact with neurons, how signals propagate through tissue, and what happens at each scale from implant to molecule.

This isn't just about making pretty animations. It's about building intuition for the attack surfaces I'm trying to protect.

**Questions this visualization helps me answer:**

1. **Where do electrodes go?** — Which cortical layers? How deep?
2. **What do they touch?** — Neuron somata? Axons? Dendrites?
3. **How do signals propagate?** — From electrical stimulation to neurotransmitter release
4. **What's the timescale hierarchy?** — From millisecond spikes to femtosecond electron transfer
5. **How do different BCIs compare?** — Utah Array (surface) vs Neuralink (penetrating) vs DBS (deep brain)

---

## The Learning Goal

Create an animated "Powers of Ten" style zoom that:

| Scale | What's Shown | BCI Relevance |
|-------|--------------|---------------|
| **Centimeters** | BCI implant on skull/cortex | Device placement, electrode arrays |
| **Millimeters** | Cortical layers I-VI | Penetration depth, layer targeting |
| **100 μm** | Neural circuits | Microcircuit connectivity |
| **10 μm** | Single neurons | Recording/stimulation targets |
| **1 μm** | Synapses | Signal transmission points |
| **100 nm** | Vesicle release | Neurotransmitter dynamics |
| **10 nm** | Receptor binding | Molecular targets |
| **1 nm** | Ion channels | Channel gating, selectivity |
| **Ångström** | Molecular structure | Electron transfer, cofactors |

---

## BCI Devices to Compare

| Device | Type | Depth | Target | Channels |
|--------|------|-------|--------|----------|
| **Utah Array** | Penetrating microelectrode | 1-2mm | Cortical L2/3-L5 | 96-128 |
| **Neuralink N1** | Penetrating threads | 3-5mm | Cortical L5/6 | 1024 |
| **ECoG Grid** | Surface (subdural) | 0mm | Cortical surface | 64-256 |
| **DBS Electrodes** | Deep brain stimulation | 40-80mm | Basal ganglia, thalamus | 4-8 |
| **Stentrode** | Endovascular | N/A (vessel) | Motor cortex (M1) | 16 |

---

## Subprojects

### 1. Blender 3D Animation

**Location:** [`3D-mindmapper/blender/bci-zoom-3d/`](./3D-mindmapper/blender/bci-zoom-3d/)

True 3D visualization with smooth camera zoom through all scales.

**What it creates:**
- 60-second animation from brain surface to molecular level
- Realistic 3D models: brain mesh, electrode threads, neurons, synapses, ion channels
- Continuous camera zoom with depth-of-field effects
- Can import real neuron morphologies (NeuroMorpho.org) and protein structures (PDB)

**Best for:** Final production renders, photorealistic visuals, YouTube

### 2. Manim 2D/2.5D Animation

**Location:** [`2D-mindmapper/manim/bci-zoom/`](./2D-mindmapper/manim/bci-zoom/)

Scientific visualization with dual logarithmic axes showing scale relationships.

**What it creates:**
- Animated zoom with simultaneous spatial scale (X-axis) and timescale (Y-axis)
- Shows the fundamental relationship: **smaller structures = faster events**
- Clean, diagrammatic style matching ONI documentation
- Easy to add labels, annotations, and educational overlays

**Best for:** Educational content, quick iteration, data-driven visualizations

---

## Scientific Foundation

All visualizations are based on peer-reviewed neuroscience:

| Concept | Source | Key Finding |
|---------|--------|-------------|
| Cortical layer depths | Mountcastle (1997) | L1-L6 organization, ~2mm total depth |
| Utah Array penetration | Rousche & Normann (1998) | 1.0-1.5mm optimal depth |
| Neuralink specifications | Musk & Neuralink (2019) | 1024 electrodes, 6μm threads |
| Action potential timing | Hodgkin & Huxley (1952) | 1-2ms duration |
| Synaptic transmission | Südhof (2012) | ~100μs vesicle fusion |
| Ion channel gating | Hille (2001) | ns-μs timescales |
| Electron transfer | Marcus (1956) | fs-ps timescales |

---

## How These Projects Relate to ONI

| ONI Layer | What Visualization Shows |
|-----------|--------------------------|
| **L8 (Neural Gateway)** | The silicon-biology boundary — where electrodes meet tissue |
| **L9 (Signal Processing)** | How raw neural signals are filtered and amplified |
| **L10 (Neural Protocol)** | The "encoding" of neural information in spike patterns |
| **L11 (Cognitive Transport)** | How signals propagate through neural circuits |
| **L12-L14** | The biological substrate these signals ultimately affect |

Understanding this physical interface is critical for BCI security because **attacks at L8 translate to effects at L9-L14**.

---

## Status

| Component | Status | Notes |
|-----------|--------|-------|
| Blender scene generation | ✅ Complete | Script creates all objects |
| Blender camera animation | ✅ Complete | Smooth bezier path |
| Manim basic animation | ✅ Complete | All 9 zoom levels |
| Manim dual axes | ✅ Complete | Log-log scaling |
| Real neuron morphologies | 📋 Backlog | Import from NeuroMorpho.org |
| Protein structures | 📋 Backlog | Import from PDB via MolecularNodes |
| Utah Array model | 📋 Backlog | Accurate 10x10 grid |
| Neuralink model | 📋 Backlog | Thread array with electrodes |
| DBS electrode model | 📋 Backlog | Deep brain placement |
| Composite final video | 📋 Backlog | Blender + Manim overlay |

---

## Render Outputs

| Folder | Content |
|--------|---------|
| `3D-mindmapper/blender/bci-zoom-3d/renders/` | Blender frame sequences and MP4 |
| `2D-mindmapper/manim/bci-zoom/media/videos/` | Manim rendered animations |

---

## Quick Start

```bash
# Blender (3D visualization)
cd 3D-mindmapper/blender/bci-zoom-3d
blender --python scripts/bci_zoom_3d.py

# Manim (2D scientific animation)
cd 2D-mindmapper/manim/bci-zoom
manim -pql scenes/bci_zoom_animation.py BCIZoomAnimation
```

---

## Related Resources

- **ONI_LAYERS.md:** Biological Foundation section with time-scale hierarchy
- **neuromapping.py:** Brain region → ONI layer mappings
- **BCI research notes:** [`../Research-BCI_Mouse_Movement.md`](../Research-BCI_Mouse_Movement.md)
- **Brain regions:** [`../bci-electrode-zones/`](../bci-electrode-zones/) and [`../brain-regions/`](../brain-regions/)

---

*Part of the [autodidactive/neuroscience](../) learning project*
*Last Updated: 2026-01-26*
