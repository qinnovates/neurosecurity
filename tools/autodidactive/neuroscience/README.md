# Neuroscience & BCI Research

> **Purpose:** Personal research and learning repository for neuroscience concepts I need to understand to build the ONI Framework. This is where I figure out things I don't know but need to know.

**This is NOT polished documentation.** It's a working knowledge base for building understanding of the biological substrate that BCIs interface with.

---

## Table of Contents

1. [Kanban](#kanban)
2. [Folder Structure](#folder-structure)
3. [Purpose of Each Folder](#purpose-of-each-folder)
4. [Research Documents](#research-documents)
5. [Key Questions](#key-questions-this-research-aims-to-answer)
6. [Related Projects](#related-projects)
7. [Adding Research](#adding-research)

---

## Kanban

### Backlog
| Task | Description | Priority |
|------|-------------|----------|
| Motor cortex deep dive | Understand electrode placement, neural decoding | High |
| Neurotransmitter systems | DA, 5-HT, NE pathways and cofactors | High |
| BCI-to-neuron zoom animation | Blender/Manim visualization project | Medium |
| Synaptic transmission | How signals cross synapses | Medium |
| Ion channel mechanics | Na+/K+ channels, action potentials | Low |

### In Progress
| Task | Description | Notes |
|------|-------------|-------|
| BCI Mouse Movement | How BCIs decode motor signals | See brain-regions/cerebral-cortex/motor-cortex/Research-BCI_Mouse_Movement.md |

### Done
| Task | Completed | Output |
|------|-----------|--------|
| Initial folder structure | 2026-01-26 | Brain region folders created |
| Visualization assets collected | 2026-01-26 | visualizing-the-mind/ |

---

## Folder Structure

```
autodidactive/neuroscience/
├── README.md                           # This file
│
├── visualizing-the-mind/               # BCI macro-to-micro zoom animations
│   ├── README.md                       # Project objectives and overview
│   ├── 3D-mindmapper/                  # 3D visualization (Blender)
│   │   └── blender/bci-zoom-3d/        # Photorealistic zoom animation
│   └── 2D-mindmapper/                  # 2D visualization (Manim)
│       └── manim/bci-zoom/             # Scientific dual-axis animation
│
└── brain-regions/                      # Anatomical brain region research
    ├── cerebral-cortex/                # Outer brain layer (higher functions)
    │   ├── motor-cortex/               # Movement control (BCI primary target)
    │   │   └── Research-BCI_Mouse_Movement.md  # How BCIs decode motor signals
    │   ├── sensory-cortex/             # Touch, proprioception
    │   ├── prefrontal-cortex/          # Executive function, planning
    │   ├── visual-cortex/              # Vision processing
    │   ├── auditory-cortex/            # Hearing processing
    │   └── parietal-cortex/            # Spatial awareness, integration
    │
    ├── cerebellum/                     # Movement coordination, balance
    │
    ├── brainstem/                      # Vital functions
    │   ├── medulla/                    # Heart rate, breathing
    │   ├── pons/                       # Sleep, arousal
    │   └── midbrain/                   # Eye movement, hearing
    │
    ├── limbic-system/                  # Emotion, memory
    │   ├── amygdala/                   # Fear, emotion processing
    │   ├── hippocampus/                # Memory formation
    │   └── cingulate-cortex/           # Decision-making, emotion
    │
    ├── thalamus/                       # Sensory relay station
    ├── hypothalamus/                   # Hormones, homeostasis
    ├── basal-ganglia/                  # Movement initiation, habits
    ├── corpus-callosum/                # Hemispheric communication
    └── neural-pathways/                # Major fiber tracts
```

---

## Purpose of Each Folder

Each brain region folder is for documenting:

1. **How it works** — Function, anatomy, connections
2. **Research notes** — Papers, findings, key facts
3. **Questions** — Things to ask researchers/professionals
4. **Unknowns** — What science hasn't figured out yet
5. **BCI relevance** — How this region relates to brain-computer interfaces
6. **Security implications** — Potential vulnerabilities, attack surfaces

---

## Research Documents

| Document | Description |
|----------|-------------|
| [Research-BCI_Mouse_Movement.md](./brain-regions/cerebral-cortex/motor-cortex/Research-BCI_Mouse_Movement.md) | Deep dive on how BCIs decode motor cortex signals for cursor control |

---

## Key Questions This Research Aims to Answer

1. Where exactly do BCI electrodes sit in the brain?
2. How deep do they go?
3. What signals do they record?
4. How are those signals decoded into actions?
5. What are the current technological limitations?
6. What questions remain unanswered in the field?

---

## Related Projects

- **Visualizations:** [visualizing-the-mind/](./visualizing-the-mind/) — BCI macro-to-micro zoom animations
  - [3D-mindmapper/](./visualizing-the-mind/3D-mindmapper/) — Blender photorealistic rendering
  - [2D-mindmapper/](./visualizing-the-mind/2D-mindmapper/) — Manim scientific animations
- **Backlog:** [bci-to-neuron-zoom-rendering](../docs/visualizations/pending/bci-to-neuron-zoom-rendering/) — GitHub Pages pending visualization
- **Video Assets:** `autodidactive/bci-zoom/` — Video project files
- **ONI_LAYERS.md:** Biological Foundation section — How this maps to L8-L14
- **oni/neuromapping.py:** Python API for brain region → layer mappings

---

## Adding Research

When adding research to a brain region folder:

1. Create a file named `Notes-[Topic].md` for informal notes
2. Create `Research-[Topic].md` for structured research
3. Include sources with links
4. Tag questions with `[Q]` prefix
5. Tag unknowns with `[?]` prefix

Example:
```markdown
## Motor Cortex Notes

[Q] Why do some neurons respond to imagined movement but not actual movement?

[?] Unknown: The exact mechanism by which motor cortex neurons "know" whether movement is intended vs executed.

Source: Smith et al. (2023) - https://example.com/paper
```

---

*Last Updated: 2026-01-26*
