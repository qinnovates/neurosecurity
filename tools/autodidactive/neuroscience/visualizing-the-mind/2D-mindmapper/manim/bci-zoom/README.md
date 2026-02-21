# BCI Macro-to-Micro Zoom Animation Rendering (3D). The objective is to learn and visually demonstrate how different BCIs stimulate neurons (i.e. Utah Arrays, Neuralink, and what depth, which reglion, etc.)

> **From Implant to Molecule: A 15-order-of-magnitude journey through the brain**

This Manim project visualizes how future BCIs interface with the brain, zooming from the implant surface down to molecular dynamics—with scientifically accurate timescales and spatial scales.

## Preview

The animation shows:
1. **BCI Implant** (cm scale, seconds) - Neuralink-style device on brain surface
2. **Cortical Surface** (mm scale, 100s ms) - Electrode penetrating cortical layers
3. **Neural Circuits** (100 μm, 10s ms) - Microcircuit connectivity
4. **Single Neurons** (10 μm, milliseconds) - Soma, dendrites, axon
5. **Synapses** (μm, microseconds) - Pre/post synaptic structures
6. **NT Release** (100 nm, nanoseconds) - Vesicle fusion, SNARE proteins
7. **Receptor Binding** (10 nm, nanoseconds) - Ligand-receptor interaction
8. **Ion Channels** (nm, picoseconds) - Channel gating
9. **Molecular Dynamics** (Ångström, femtoseconds) - Electron transfer, enzyme catalysis

## Dual Axes

| Axis | Range | Scale Type |
|------|-------|------------|
| **Y: Timescale** | 1 s → 10⁻¹⁵ s (femtoseconds) | Logarithmic |
| **X: Spatial Scale** | 1 cm → 10⁻¹⁰ m (Ångström) | Logarithmic |

This captures the fundamental relationship: **smaller structures = faster events**.

## Quick Start

```bash
# Install Manim
pip install manim

# Navigate to project
cd autodidactive/neuroscience/visualizing-the-mind/2D-mindmapper/manim/bci-zoom

# Quick preview (low quality)
manim -pql scenes/bci_zoom_animation.py BCIZoomAnimation

# High quality render
manim -pqh scenes/bci_zoom_animation.py BCIZoomAnimation

# Test individual level
manim -pql scenes/bci_zoom_animation.py TestZoomLevel
```

## Project Structure

```
bci-zoom/
├── README.md                    # This file
├── scenes/
│   └── bci_zoom_animation.py    # Main animation (BCIZoomAnimation class)
├── assets/
│   ├── svg/                     # SVG assets (BioRender exports)
│   │   ├── neuron.svg           # [TODO] Import from BioRender
│   │   ├── synapse.svg          # [TODO] Import from BioRender
│   │   └── receptor.svg         # [TODO] Import from BioRender
│   └── textures/                # Background textures
├── data/
│   └── scales.json              # Scientific scale data from ONI_LAYERS.md
└── utils/
    └── theme.py                 # ONI color palette and helpers
```

## Scientific Sources

All timescales and spatial scales are derived from:

| Source | Content |
|--------|---------|
| **ONI_LAYERS.md v3.0** | Time-Scale Hierarchy (Table in "Biological Foundation" section) |
| **Südhof, 2012** | Calcium control of neurotransmitter release |
| **Matak et al., 2016** | Iron-dopamine chain, molecular timescales |
| **Lazarus et al., 2011** | Adenosine receptor specificity |

### Key Timescale References

| Process | Timescale | Source |
|---------|-----------|--------|
| Action potential | 1-2 ms | Hodgkin & Huxley, 1952 |
| Synaptic delay | 0.5-5 ms | Katz & Miledi, 1967 |
| Vesicle fusion | ~100 μs | Südhof, 2012 |
| Ion channel gating | ~10-100 ns | Hille, 2001 |
| Electron transfer | ~fs-ps | Marcus, 1956 |

## Customization

### Adding New Zoom Levels

1. Edit `data/scales.json` to add new level
2. Create visualization method in `bci_zoom_animation.py`:
   ```python
   def create_new_level_viz(self, level: dict) -> VGroup:
       viz = VGroup()
       # ... build visualization
       return viz
   ```
3. Register in `create_level_visualization()` switch statement

### Importing SVG Assets

For higher fidelity visualizations, export SVGs from:
- **BioRender** (biorender.com) - Academic free tier
- **Servier Medical Art** (smart.servier.com) - CC BY 3.0

```python
# In your scene:
neuron_svg = SVGMobject("assets/svg/neuron.svg")
neuron_svg.set_color(ONIColors.SCALE_NEURON)
```

### Changing Color Theme

Edit `utils/theme.py`:
```python
class ONIColors:
    PRIMARY = "#4A90D9"      # Change this
    GATEWAY = "#FF9500"      # L8 accent
    # ...
```

## Render Settings

| Quality | Command | Resolution | Use Case |
|---------|---------|------------|----------|
| Preview | `-pql` | 480p, 15fps | Quick iteration |
| Medium | `-pqm` | 720p, 30fps | Draft review |
| High | `-pqh` | 1080p, 60fps | Final render |
| 4K | `-pqk` | 4K, 60fps | YouTube upload |

### Recommended for YouTube

```bash
manim -pqh --fps 60 scenes/bci_zoom_animation.py BCIZoomAnimation
```

## Integration with ONI Repository

This visualization references:
- `MAIN/legacy-core/oni-framework/ONI_LAYERS.md` - Layer definitions, timescale table
- `MAIN/legacy-core/resources/brand/brand.json` - Brand colors (should sync with theme.py)

When ONI layer definitions change, update:
1. `data/scales.json` - Scale mappings
2. `utils/theme.py` - If colors change
3. Info panel text in animation

## Future Enhancements

- [ ] Import BioRender SVGs for photorealistic structures
- [ ] Add particle systems for ion flow
- [ ] Implement smooth camera zoom transitions
- [ ] Add audio narration sync points
- [ ] Create looping "ambient" version for presentations
- [ ] Add NeuroMorpho.org real neuron morphologies

## Credits

- **ONI Framework**: Kevin L. Qi / Qinnovate
- **Animation**: Created with Manim Community Edition
- **Scientific Review**: Based on peer-reviewed neuroscience literature

---

*Part of the ONI Framework visualization suite*
*Last Updated: 2026-01-26*
