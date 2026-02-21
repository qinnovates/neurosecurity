# BCI Zoom 3D - Blender Animation

> **True 3D visualization of BCI implant to molecular scale**
> Smooth continuous camera zoom with time dilation effect

## What This Creates

A 60-second animation showing:
1. **Brain surface** with Neuralink-style BCI implant
2. **Electrode threads** penetrating cortex
3. **Neural network** with interconnected neurons
4. **Single neuron** detail (soma, dendrites, axon, spines)
5. **Synapse** junction with vesicles and receptors
6. **Ion channel** cross-section with passing ions
7. **Molecular structure** with Fe²⁺ cofactor and electron cloud

All positioned in 3D space so the camera smoothly zooms through each level.

## Quick Start

### Option 1: Open in Blender GUI

```bash
# Open Blender
open -a Blender

# In Blender:
# 1. Go to Scripting workspace
# 2. Open scripts/bci_zoom_3d.py
# 3. Click "Run Script"
# 4. Switch to Layout workspace to see the scene
# 5. Press Space to play animation preview
# 6. Render > Render Animation (or Ctrl+F12)
```

### Option 2: Command Line (Headless)

```bash
cd autodidactive/neuroscience/visualizing-the-mind/3D-mindmapper/blender/bci-zoom-3d

# Generate scene (creates .blend file)
blender --background --python scripts/bci_zoom_3d.py

# Render animation
blender --background scene.blend -a -o //renders/frame_ -F PNG

# Or render to video directly
blender --background scene.blend -o //renders/bci_zoom.mp4 -F FFMPEG -a
```

### Option 3: Interactive Setup

```bash
# Open Blender with script
blender --python scripts/bci_zoom_3d.py
```

## Project Structure

```
bci-zoom-3d/
├── README.md
├── scripts/
│   └── bci_zoom_3d.py      # Main scene generation script
├── assets/                  # Import external models here
│   ├── neurons/            # NeuroMorpho.org exports
│   ├── proteins/           # PDB molecular structures
│   └── textures/           # Surface textures
└── renders/                # Output directory
    └── bci_zoom_3d.mp4
```

## Scene Elements Created

| Element | Scale | Description |
|---------|-------|-------------|
| Brain surface | 3m radius | Subdivided icosphere with noise displacement |
| BCI implant | 0.8m disc | Cylinder with 16 electrode threads |
| Neurons (5x) | 0.3m | Soma + dendrites + axon + terminals |
| Synapse | 0.2m | Pre/post synaptic with vesicles, receptors |
| Ion channel | 0.05m | Torus protein with selectivity filter |
| Molecular | 0.02m | Fe²⁺ center with atomic structure |

## Camera Animation

The camera follows a smooth bezier path:

| Time | Position | What's Visible |
|------|----------|----------------|
| 0-6s | Far (15m) | Brain + BCI overview |
| 6-12s | Medium (8m) | Cortical surface detail |
| 12-21s | Close (4m) | Neural circuits |
| 21-30s | Very close (2m) | Single neuron |
| 30-39s | Micro (1m) | Synapse |
| 39-45s | Ultra (0.5m) | Vesicle release |
| 45-51s | Nano (0.3m) | Receptor binding |
| 51-57s | Atomic (0.15m) | Ion channel |
| 57-60s | Molecular (0.08m) | Electron orbitals |

## Customization

### Change Duration

Edit `CONFIG` in `bci_zoom_3d.py`:
```python
CONFIG = {
    "duration_seconds": 60,  # Change this
    "fps": 60,
    ...
}
```

### Add Real Neuron Morphology

1. Download SWC file from [NeuroMorpho.org](https://neuromorpho.org)
2. Use Blender's SWC importer addon or convert to OBJ
3. Replace `create_neuron()` call with imported model

### Add Protein Structures

1. Download PDB file from [RCSB PDB](https://www.rcsb.org/)
2. Use [Molecular Nodes](https://github.com/BradyAJohnston/MolecularNodes) addon
3. Import receptor/channel structures

### Improve Materials

For more realistic rendering:
```python
# In create_material(), add:
principled.inputs['Subsurface'].default_value = 0.3  # For organic look
principled.inputs['Specular'].default_value = 0.5
principled.inputs['Metallic'].default_value = 0  # For non-metals
```

## Render Settings

| Preset | Engine | Quality | Time |
|--------|--------|---------|------|
| Preview | EEVEE | Fast, good | ~10 min |
| Production | Cycles | Photorealistic | ~2-4 hours |

### For YouTube (Recommended)

```python
CONFIG = {
    "resolution_x": 1920,
    "resolution_y": 1080,
    "fps": 60,
}
# Use EEVEE with bloom enabled
```

### For Maximum Quality

```python
# In setup_scene():
scene.render.engine = 'CYCLES'
scene.cycles.samples = 256
scene.cycles.use_denoising = True
```

## Adding Time Dilation Indicator

To show timescale changing as we zoom, add this overlay in post:

1. Export camera depth data as EXR
2. In Davinci Resolve/After Effects:
   - Map depth to timescale (log scale)
   - Overlay text: "Timescale: X" updating based on depth
   - Or use Manim to render the axis overlay

Or use Blender's compositor:
```python
# Add compositor nodes to overlay timescale text
# based on camera Z position
```

## Troubleshooting

### Script doesn't run
- Make sure you're using Blender 4.0+
- Run from Text Editor, not Python console

### Objects too small/large
- Adjust `scale` parameter in each `create_*()` function
- Or scale the camera keyframes

### Render is black
- Check lighting is enabled
- Verify camera is pointing at objects
- Check world background color

### Animation stutters
- Reduce object count
- Lower subdivision levels
- Use EEVEE instead of Cycles

## Integration with Manim

For the dual-axis overlay (timescale + spatial scale):

1. Render Blender animation with transparent background (PNG sequence)
2. Render Manim axes animation
3. Composite in DaVinci Resolve:
   - Bottom layer: Blender 3D
   - Top layer: Manim axes (with alpha)

## Credits

- **ONI Framework**: Kevin L. Qi / Qinnovate
- **Blender**: blender.org
- **Scientific basis**: ONI_LAYERS.md v3.0

---

*Part of the ONI Framework visualization suite*
*Last Updated: 2026-01-26*
