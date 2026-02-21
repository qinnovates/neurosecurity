# BCI Zoom Animation: From Brain to Molecule

> A multi-scale 3D animation visualizing the journey from whole brain to molecular receptor, aligned with the ONI 14-layer model.

## Concept: "The Dive"

Camera descends through biological scales, passing through the **Neural Gateway (L8)** - the critical boundary where silicon meets biology. Each zoom level maps to ONI layers, making this both scientifically accurate AND a visualization of the framework itself.

```
┌─────────────────────────────────────────────────────────────────┐
│  MACRO                                                          │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  L14 Identity Layer    │  Whole Brain      │  ~15 cm    │   │
│  │  L13 Semantic Layer    │  Brain Regions    │  ~1-5 cm   │   │
│  └─────────────────────────────────────────────────────────┘   │
│                              ↓                                  │
│  MESO                                                           │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  L12 Cognitive Session │  Cortical Columns │  ~1 mm     │   │
│  │  L11 Cognitive Transport│ Neural Circuits  │  ~100 μm   │   │
│  └─────────────────────────────────────────────────────────┘   │
│                              ↓                                  │
│  MICRO                                                          │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  L10 Neural Protocol   │  Single Neuron    │  ~10-50 μm │   │
│  │  L9  Signal Processing │  Synapse          │  ~1 μm     │   │
│  └─────────────────────────────────────────────────────────┘   │
│                              ↓                                  │
│  ════════════════════════════════════════════════════════════  │
│  ████  L8 NEURAL GATEWAY  ████  BCI Electrode Interface  ████  │
│  ════════════════════════════════════════════════════════════  │
│                              ↓                                  │
│  NANO/MOLECULAR                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Synaptic Cleft        │  Vesicles         │  ~20-40 nm │   │
│  │  Ion Channels          │  Proteins         │  ~5-10 nm  │   │
│  │  Neurotransmitters     │  Molecules        │  ~1 nm     │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

## Color Palette (ONI Brand)

From `brand.json` - colors transition as we descend:

| Layer | Color | Hex |
|-------|-------|-----|
| L14 Identity | Light Green | `#4ade80` |
| L13 Semantic | Green | `#22c55e` |
| L12 Cognitive Session | Green | `#16a34a` |
| L11 Cognitive Transport | Green | `#15803d` |
| L10 Neural Protocol | Dark Green | `#166534` |
| L9 Signal Processing | Darkest Green | `#14532d` |
| **L8 Neural Gateway** | **Orange** | **`#d97706`** |

## Asset Pipeline

### Layer 1: Macro Brain (brain2print + Sketchfab blend)

**Primary Source: brain2print.org**
```
1. Go to https://brain2print.org
2. Use sample MRI or upload T1-weighted scan
3. Run AI segmentation (WebGPU, ~2-5 min)
4. Export options:
   - Cortex only (for external detail)
   - White matter (for internal structure)
   - Full brain (combined)
5. Download as STL or OBJ
```

**Secondary Source: Existing Sketchfab model**
- Location: `assets/brain/Brain/`
- Use for: Surface detail, internal structures (limbic, ventricles)
- Blend strategy: brain2print for accuracy, Sketchfab for beauty

**Blender Compositing:**
```
Brain2print mesh (base geometry, anatomically correct)
    + Sketchfab cortex (displacement/detail layer)
    + Sketchfab internal (deep structures)
    = Final macro brain
```

### Layer 2: Meso - Cortical Structure

**Source: Brain cutaway from Sketchfab model**
- Use Brain2.obj or Brain3.obj (internal structures)
- Create cross-section revealing cortical layers

**Transition technique:**
- Camera enters through sulcus (brain fold)
- Dissolve outer cortex to reveal columnar structure
- Show 6 cortical layers if possible

### Layer 3: Micro - Neurons

**Primary Source: NeuroMorpho.org**
```
1. Go to neuromorpho.org
2. Search: "pyramidal" or "purkinje" (visually striking)
3. Filter by species: human or rat
4. Download SWC format
5. Import to Blender via NeuroMorphoVis addon
   - Or convert SWC → OBJ online
```

**Recommended neurons:**
- Pyramidal cell (cortex) - classic triangular shape
- Purkinje cell (cerebellum) - dramatic dendritic tree
- Dopaminergic neuron (substantia nigra) - connects to our research

**Blender setup:**
- Import multiple neurons
- Arrange in realistic network
- Add axons connecting between them

### Layer 4: Nano - Synapse

**Source: Sketchfab / Custom modeling**
- Search: "synapse 3D model", "synaptic junction"
- Or model simplified version:
  - Presynaptic terminal (bulb shape)
  - Synaptic cleft (gap)
  - Postsynaptic density
  - Vesicles (spheres)

**Key elements to show:**
- Synaptic vesicles (50nm spheres)
- Vesicle docking at membrane
- Synaptic cleft (~20nm gap)
- Postsynaptic receptors

### Layer 5: Molecular - Ion Channels & Receptors

**Source: RCSB Protein Data Bank (rcsb.org)**

| Component | PDB ID | Description |
|-----------|--------|-------------|
| Sodium channel | 6J8E | Voltage-gated, Nav1.7 |
| Potassium channel | 1BL8 | Classic structure |
| NMDA receptor | 6WHA | Glutamate receptor |
| GABA-A receptor | 6HUG | Inhibitory receptor |
| Dopamine D2 | 6CM4 | Key for reward pathway |

**Blender import:**
```
1. Install "Molecular Nodes" addon for Blender
2. Download PDB file from rcsb.org
3. Import via Molecular Nodes
4. Style: surface representation with ONI colors
```

### Layer 6: Molecular - Neurotransmitters

**Source: PubChem 3D (pubchem.ncbi.nlm.nih.gov)**

| Molecule | CID | Relevance |
|----------|-----|-----------|
| Dopamine | 681 | Reward, motor control |
| Glutamate | 33032 | Excitatory |
| GABA | 119 | Inhibitory |
| Serotonin | 5202 | Mood regulation |
| Acetylcholine | 187 | Memory, attention |

**Download:** 3D SDF format → convert to OBJ or import directly

## Blender Scene Structure

```
bci-zoom.blend
│
├── Collections
│   ├── 01_Macro_Brain
│   │   ├── brain2print_cortex
│   │   ├── brain2print_white_matter
│   │   └── sketchfab_detail_overlay
│   │
│   ├── 02_Meso_Cortex
│   │   ├── cortical_crosssection
│   │   └── cortical_columns
│   │
│   ├── 03_Micro_Neurons
│   │   ├── pyramidal_cell_01
│   │   ├── pyramidal_cell_02
│   │   └── neural_network_connections
│   │
│   ├── 04_Nano_Synapse
│   │   ├── presynaptic_terminal
│   │   ├── postsynaptic_density
│   │   └── vesicles
│   │
│   ├── 05_Molecular_Receptors
│   │   ├── NMDA_receptor
│   │   ├── dopamine_D2_receptor
│   │   └── ion_channels
│   │
│   ├── 06_Molecular_Transmitters
│   │   ├── dopamine
│   │   ├── glutamate
│   │   └── GABA
│   │
│   └── 07_BCI_Device (optional)
│       ├── electrode_array
│       └── neuralink_style_threads
│
├── Camera
│   └── zoom_camera (animated path, logarithmic scale)
│
├── Lighting
│   ├── macro_lighting_setup
│   ├── micro_lighting_setup
│   └── molecular_lighting_setup
│
└── World
    └── dark_background (like ONI website)
```

## Animation Strategy

### Camera Path: Logarithmic Zoom

Since we're spanning 8 orders of magnitude, use logarithmic interpolation:

```python
# Pseudocode for zoom
import math

start_scale = 0.15  # 15cm (brain)
end_scale = 1e-9    # 1nm (molecule)
frames = 900        # 30 seconds at 30fps

for frame in range(frames):
    t = frame / frames
    # Logarithmic interpolation
    log_start = math.log10(start_scale)
    log_end = math.log10(end_scale)
    current_log = log_start + t * (log_end - log_start)
    current_scale = 10 ** current_log
```

### Transition Timing

| Time | Scale | What's Visible | ONI Layer |
|------|-------|----------------|-----------|
| 0:00-0:05 | 15cm | Full brain rotating | L14 |
| 0:05-0:10 | 5cm | Zoom to motor cortex | L13 |
| 0:10-0:15 | 1mm | Enter cortical column | L12 |
| 0:15-0:20 | 100μm | Neural network visible | L11 |
| 0:20-0:25 | 10μm | Single neuron fills frame | L10 |
| 0:25-0:30 | 1μm | Synapse structure | L9 |
| 0:30-0:32 | — | **L8 GATEWAY MOMENT** | L8 |
| 0:32-0:37 | 100nm | Synaptic cleft, vesicles | — |
| 0:37-0:42 | 10nm | Receptor proteins | — |
| 0:42-0:45 | 1nm | Dopamine binding to D2 | — |

### The L8 Gateway Moment

At the transition point (0:30-0:32), create a dramatic visual:
- Flash of orange (#d97706)
- Text overlay: "L8 — Neural Gateway"
- Visual representation of where electrode meets neuron
- This is the "firewall" - the boundary between silicon and biology

## Post-Production

### Overlays to Add (After Effects / DaVinci)

1. **Scale bar** - Updates at each zoom level
2. **ONI layer labels** - Fade in/out with color coding
3. **Depth indicator** - "You are here" on the ONI stack
4. **Scientific labels** - Structure names (optional)

### Audio Design

- Ambient: Deep, resonant tones at macro scale
- Transition: Whoosh/dive sounds
- Micro: Higher frequencies, electrical crackles
- Molecular: Abstract, almost musical

## File Organization

```
bci-zoom/
├── README.md (this file)
├── assets/
│   ├── brain/
│   │   ├── Brain/ (Sketchfab model - existing)
│   │   └── brain2print/ (to be added)
│   ├── neurons/
│   │   └── neuromorpho/ (SWC files)
│   ├── synapse/
│   ├── ion-channels/
│   │   └── pdb/ (PDB files)
│   └── molecules/
│       └── pubchem/ (SDF files)
├── blender/
│   ├── bci-zoom-main.blend
│   └── materials/
├── renders/
│   ├── test/
│   └── final/
└── reference/
    ├── scale-diagram.png
    └── oni-layers-mapping.md
```

## Next Steps

1. [ ] Download brain from brain2print.org (use sample MRI)
2. [ ] Test import brain2print mesh to Blender
3. [ ] Download 2-3 neurons from NeuroMorpho.org
4. [ ] Download key PDB structures (NMDA, D2 receptor)
5. [ ] Create Blender scene with collection structure
6. [ ] Test camera zoom with placeholder geometry
7. [ ] Replace placeholders with real assets
8. [ ] Add lighting and materials
9. [ ] Render test sequence
10. [ ] Add overlays and audio

## References

- brain2print: https://brain2print.org
- NeuroMorpho.org: https://neuromorpho.org
- RCSB PDB: https://rcsb.org
- PubChem 3D: https://pubchem.ncbi.nlm.nih.gov
- Molecular Nodes (Blender): https://github.com/BradyAJohnston/MolecularNodes
- ONI Layers Reference: /MAIN/legacy-core/oni-framework/ONI_LAYERS.md
