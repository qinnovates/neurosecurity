# BCI Zoom: Image Stitch Workflow

> **Goal:** Create a 2D zoom animation from BCI implant → molecular scale using stitched images
> **Approach:** Ken Burns zoom effect with scientifically-accurate images
> **Status:** Planning

---

## Table of Contents

1. [Zoom Levels](#zoom-levels)
2. [Image Sources](#image-sources-free-cc-licensed)
3. [Asset Checklist](#asset-checklist)
4. [Stitching Tools](#stitching-tools)
5. [Scientific Accuracy Notes](#scientific-accuracy-notes)
6. [Workflow Steps](#workflow-steps)

---

## Zoom Levels

| # | Level | Scale | What to Show | Transition Point |
|---|-------|-------|--------------|------------------|
| 1 | **Brain + BCI** | ~10 cm | Brain with Neuralink-style device on motor cortex | Zoom into electrode array |
| 2 | **Electrode Array** | ~1 cm | Utah array or Neuralink threads contacting cortex | Zoom into single electrode tip |
| 3 | **Cortical Layer** | ~1 mm | Layers of neurons, electrode tip visible | Zoom into neural network |
| 4 | **Neural Network** | ~100 μm | Multiple interconnected neurons | Zoom into single neuron |
| 5 | **Single Neuron** | ~10 μm | Pyramidal cell with dendrites, axon | Zoom into synapse on dendrite |
| 6 | **Synapse** | ~1 μm | Pre/post synaptic terminals, vesicles | Zoom into synaptic cleft |
| 7 | **Neurotransmitter Release** | ~100 nm | Vesicles fusing, NT molecules released | Zoom into receptors |
| 8 | **Receptor Binding** | ~10 nm | Dopamine/glutamate binding to receptor | Zoom into ion channel |
| 9 | **Ion Channel** | ~1 nm | Na+/K+ channel structure | Final molecular view |

---

## Image Sources (Free, CC Licensed)

### Level 1: Brain + BCI
- **Existing:** `assets/brain/Brain/img/` (12 brain images)
- **BCI overlay:** Create composite using Neuralink diagrams from [PMC6914248](https://pmc.ncbi.nlm.nih.gov/articles/PMC6914248/) (CC-BY)

### Level 2-3: Electrode / Cortical
- [ResearchGate - Neuralink electrode inserter](https://www.researchgate.net/figure/Prototype-of-Neuralinks-robotic-electrode-inserter-with-zoomed-in-view-right-a_fig1_379761440) (CC-BY)
- [Wikimedia - Cerebral cortex layers](https://commons.wikimedia.org/wiki/Category:Cerebral_cortex)

### Level 4: Neural Network
- [Allen Brain Atlas](https://portal.brain-map.org/) - neuron morphologies
- [NeuroMorpho.org](https://neuromorpho.org/) - 3D neuron reconstructions
- **Existing:** `assets/neurons/pyramidal_cnic_001.swc` (convert to 2D render)

### Level 5: Single Neuron
- [Wikimedia - Complete neuron cell diagram](https://commons.wikimedia.org/wiki/File:Complete_neuron_cell_diagram_en.svg) (Public Domain - LadyofHats)
- [Wikimedia - Neuron.svg](https://commons.wikimedia.org/wiki/File:Neuron.svg)

### Level 6: Synapse
- [Wikimedia - Synapse diag1.svg](https://commons.wikimedia.org/wiki/File:Synapse_diag1.svg) - detailed labeled diagram
- [Wikimedia - Synapse Illustration unlabeled.svg](https://commons.wikimedia.org/wiki/File:Synapse_Illustration_unlabeled.svg)
- [Wikimedia - Neuron synapse.svg](https://commons.wikimedia.org/wiki/File:Neuron_synapse.svg)

### Level 7: Neurotransmitter Release
- [Wikimedia SVG synapses category](https://commons.wikimedia.org/wiki/Category:SVG_synapses) (27 files)
- BioRender free templates (attribution required)

### Level 8: Receptors
- **RCSB PDB renders:**
  - Dopamine D2: [6CM4](https://www.rcsb.org/structure/6CM4)
  - GABA receptor: [6HUG](https://www.rcsb.org/structure/6HUG)
  - Glutamate AMPA: [5WEO](https://www.rcsb.org/structure/5WEO)
- Use RCSB's built-in 3D viewer → screenshot or Mol* export

### Level 9: Ion Channels / Molecular
- [RCSB - Sodium channel](https://www.rcsb.org/structure/6J8E)
- [RCSB - Potassium channel](https://www.rcsb.org/structure/2R9R)

---

## Asset Checklist

```
assets/
├── 01-brain-bci/
│   ├── [ ] brain_base.png           # From existing brain images
│   ├── [ ] bci_overlay.png          # Neuralink-style device (transparent)
│   └── [ ] brain_with_bci.png       # Composite
│
├── 02-electrode-array/
│   ├── [ ] utah_array.png           # From PMC paper
│   └── [ ] electrode_cortex.png     # Electrode tips in tissue
│
├── 03-cortical-layer/
│   ├── [ ] cortex_layers.png        # Layer structure with neurons
│   └── [ ] electrode_tip.png        # Single electrode among neurons
│
├── 04-neural-network/
│   ├── [ ] neuron_network.png       # Multiple connected neurons
│   └── [ ] pyramidal_render.png     # From .swc file
│
├── 05-single-neuron/
│   ├── [ ] neuron_complete.svg      # From Wikimedia
│   └── [ ] neuron_detail.png        # Dendrite focus
│
├── 06-synapse/
│   ├── [ ] synapse_diagram.svg      # From Wikimedia
│   └── [ ] synapse_closeup.png      # Vesicles visible
│
├── 07-nt-release/
│   ├── [ ] vesicle_fusion.png       # Exocytosis
│   └── [ ] nt_molecules.png         # Dopamine/glutamate
│
├── 08-receptor/
│   ├── [ ] d2_receptor.png          # From PDB 6CM4
│   └── [ ] receptor_binding.png     # Ligand approaching
│
└── 09-ion-channel/
    ├── [ ] na_channel.png           # From PDB
    └── [ ] molecular_view.png       # Final atomic scale
```

---

## Stitching Tools

### Option A: FFmpeg (Simplest, CLI)

```bash
# Ken Burns zoom effect on each image
ffmpeg -loop 1 -i level_01.png -vf "zoompan=z='min(zoom+0.0015,1.5)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=150:s=1920x1080" -t 5 -c:v libx264 level_01.mp4

# Concatenate all levels
ffmpeg -f concat -i filelist.txt -c copy final_zoom.mp4
```

### Option B: Python + MoviePy

```python
from moviepy.editor import *

def zoom_transition(img_path, duration=3, zoom_factor=1.5):
    clip = ImageClip(img_path).set_duration(duration)
    return clip.resize(lambda t: 1 + (zoom_factor-1)*t/duration)

# Chain clips with crossfade
clips = [zoom_transition(f"level_{i:02d}.png") for i in range(1, 10)]
final = concatenate_videoclips(clips, method="crossfade", crossfade_duration=0.5)
final.write_videofile("bci_zoom.mp4", fps=30)
```

### Option C: Remotion (React-based, version controlled)

Already set up in `MAIN/legacy-core/oni-product-demo/` - can reuse infrastructure.

### Option D: Canva (Quick prototype)

1. Upload all images
2. Use "Magic Animate" or manual keyframes
3. Export as MP4

---

## Scientific Accuracy Notes

### What BCIs Actually Do (VERIFIED)

| Capability | Status | Note |
|------------|--------|------|
| Record action potentials | ✅ YES | Electrodes detect voltage changes |
| Stimulate neurons electrically | ✅ YES | Can trigger activity |
| Release specific neurotransmitters | ❌ NO | Operates at wrong scale (μm vs nm) |
| Read thoughts/memories | ❌ NO | Can only decode movement intentions |

### Key Facts to Convey

1. **Electrodes sit in motor cortex** (precentral gyrus)
2. **Depth:** 1-6mm into cortex (layer 5 pyramidal neurons)
3. **Resolution:** ~1000 electrodes, but billions of neurons
4. **Signal flow:** Neurons fire → electrodes record → decoder interprets → cursor moves
5. **Limitation:** Electrodes are 4-6μm; synapses are 20nm apart — 200x size difference

### Visual Storytelling Points

- **Level 1-4:** "This is what BCIs can ACCESS" (green/blue tint)
- **Level 5-6:** "This is the BOUNDARY" (yellow/orange tint)
- **Level 7-9:** "This is what BCIs CANNOT reach... yet" (red/purple tint)

---

## Workflow Steps

### Phase 1: Gather Assets (Day 1)
1. Download Wikimedia SVGs (neuron, synapse)
2. Screenshot PDB receptor structures
3. Composite brain + BCI image
4. Render .swc neuron file to 2D

### Phase 2: Prepare Images (Day 2)
1. Standardize resolution (1920x1080 or 4K)
2. Color-grade for consistency (ONI color palette)
3. Add scale bars to each level
4. Mark "hotspot" for zoom transition

### Phase 3: Create Transitions (Day 3)
1. Test zoom effect with FFmpeg
2. Adjust timing (3-5 sec per level)
3. Add crossfade/blur at transitions

### Phase 4: Add Annotations (Day 4)
1. Scale labels ("1 cm", "100 nm")
2. Structure labels ("Motor Cortex", "Synapse")
3. ONI layer indicators ("L9", "L8 Boundary")

### Phase 5: Export & Review (Day 5)
1. Export final video
2. Review for scientific accuracy
3. Add to GitHub/documentation

---

## Related Documents

- [Research-BCI_Mouse_Movement.md](../../autodidactive/neuroscience/brain-regions/cerebral-cortex/motor-cortex/Research-BCI_Mouse_Movement.md) — Electrode specs, neural decoding
- [scales.json](../../autodidactive/neuroscience/visualizing-the-mind/2D-mindmapper/manim/bci-zoom/data/scales.json) — Scientific scale data
- [KANBAN.md](../../MAIN/legacy-core/project/KANBAN.md) — Backlog item: `bci-macro-to-micro-visualization`

---

## Quick Start

```bash
# 1. Download Wikimedia assets
cd assets/05-single-neuron
curl -O "https://upload.wikimedia.org/wikipedia/commons/1/10/Blausen_0657_MultipolarNeuron.png"

# 2. Test FFmpeg zoom
ffmpeg -loop 1 -i brain_with_bci.png -vf "zoompan=z='min(zoom+0.001,1.5)':d=150:s=1920x1080" -t 5 test_zoom.mp4

# 3. View result
open test_zoom.mp4
```

---

*Created: 2026-01-26*
*Status: Ready to implement*
