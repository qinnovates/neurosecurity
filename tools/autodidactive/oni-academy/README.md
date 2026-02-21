# ONI Academy

[![PyPI version](https://badge.fury.io/py/oni-academy.svg)](https://badge.fury.io/py/oni-academy)
[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![Python 3.9+](https://img.shields.io/badge/python-3.9+-blue.svg)](https://www.python.org/downloads/)

> **Educational Platform for Neurosecurity** - Learn brain-computer interface security concepts through interactive modules and tutorials.

> **Status:** Alpha. The core framework and [interactive web tools](https://qinnovates.github.io/ONI/visualizations/) are functional. Learning module content is a work-in-progress and will expand with future iterations. Contributions welcome.

---

## Overview

ONI Academy is the educational arm of the ONI Framework project. It provides structured learning paths for understanding neural security concepts, from basic principles to advanced attack patterns.

**Why ONI Academy exists:** Neurosecurity concepts are not accessible. While building the ONI Framework, we identified a critical gap — the knowledge needed to secure BCIs is fragmented across academic papers and proprietary training. ONI Academy bridges that gap.

For the full vision and detailed documentation, see [ONI_ACADEMY.md](https://github.com/qinnovates/mindloft/blob/main/autodidactive/oni-academy/ONI_ACADEMY.md).

---

## Quick Start

### Installation

```bash
# Basic installation
pip install oni-academy

# Full installation (with interactive UI)
pip install oni-academy[full]
```

### Usage

```python
from oni_academy import list_modules, get_course

# See available learning modules
modules = list_modules()
print(modules)
# ['introduction', '14-layer-model', 'coherence-metric',
#  'neural-firewall', 'attack-patterns', 'nsam-monitoring']

# Get course content
intro = get_course("introduction")
print(intro['title'])
# "Introduction to Open Neurosecurity Interoperability"
```

### CLI

```bash
oni-academy list                    # List available modules
oni-academy info intro              # Get module information
oni-academy templates               # List visualization templates
oni-academy visualize "binary search" --render  # Generate visualization
oni-academy ui                      # Launch LearnViz web interface
```

### Visualization API

```python
from oni_academy import visualize, list_templates

# Generate a visualization
result = visualize("How does an action potential work?")
print(result.code)        # Generated Manim code
print(result.template)    # Template used (e.g., "action_potential")

# With video rendering
result = visualize(
    "binary search algorithm",
    render=True,
    narration=True,
    output_dir="./videos"
)
print(result.video_path)  # Path to rendered video
```

---

## LearnViz Integration

ONI Academy includes **LearnViz**, an AI-powered visualization engine that generates educational animations from natural language:

| Feature | Description |
|---------|-------------|
| **8 Built-in Templates** | Binary search, sorting, trees, action potential, synapse, motor cortex BCI, neurotransmitters |
| **Voice Narration** | TTS with edge-tts, gtts, or pyttsx3 |
| **Ollama Support** | Custom AI-generated visualizations for concepts without templates |
| **Web UI** | Local Streamlit interface for interactive use |

```bash
# Install with visualization support
pip install oni-academy[full]

# Generate visualization with narration
oni-academy visualize "synaptic transmission" --render --narration
```

---

## Package Ecosystem

| Package | Purpose | Install |
|---------|---------|---------|
| **oni-academy** | Educational content, tutorials (this package) | `pip install oni-academy` |
| **oni-framework** | Core API library for BCI security | `pip install oni-framework` |
| **oni-tara** | Security monitoring & attack simulation | `pip install oni-tara` |

**oni-framework is API-only** — use it when building applications. ONI Academy is for learning.

---

## Learning Modules

| Module | Description |
|--------|-------------|
| **Introduction** | Threat landscape, why neurosecurity matters |
| **14-Layer Model** | ONI architecture from silicon to cognition |
| **Coherence Metric** | Signal trust scoring (Cₛ formula) |
| **Neural Firewall** | Zero-trust validation at L8 |
| **Attack Patterns** | Threat modeling for BCIs |
| **NSAM Monitoring** | Real-time security assurance |

---

## Interactive Tools (Web)

No installation required — explore these in your browser:

- [Coherence Metric Playground](https://qinnovates.github.io/ONI/visualizations/01-coherence-metric-playground.html)
- [ONI Layer Explorer](https://qinnovates.github.io/ONI/visualizations/02-oni-layer-explorer.html)
- [NSAM Checkpoint Simulator](https://qinnovates.github.io/ONI/visualizations/04-nsam-checkpoint-simulator.html)
- [Scale-Frequency Navigator](https://qinnovates.github.io/ONI/visualizations/05-scale-frequency-navigator.html)
- [ONI Threat Matrix](https://qinnovates.github.io/ONI/visualizations/06-oni-threat-matrix.html)

---

## Documentation & Resources

**Full documentation on GitHub:**

| Resource | Description |
|----------|-------------|
| [ONI Academy Guide](https://github.com/qinnovates/mindloft/blob/main/autodidactive/oni-academy/ONI_ACADEMY.md) | Complete installation, learning paths, architecture |
| [ONI Framework Wiki](https://github.com/qinnovates/mindloft/blob/main/MAIN/legacy-core/INDEX.md) | Central hub — navigation, dependencies, roadmap |
| [Interactive Demos](https://qinnovates.github.io/ONI/visualizations/) | Browser-based learning tools (no install required) |

**Related packages:**

| Package | Purpose | Install |
|---------|---------|---------|
| [oni-framework](https://pypi.org/project/oni-framework/) | Core API library (for building apps) | `pip install oni-framework` |
| [oni-tara](https://pypi.org/project/oni-tara/) | Security monitoring, attack simulation | `pip install oni-tara` |

---

## License

Apache 2.0

---

*ONI Academy — Lowering the barrier to entry for intellectually curious minds eager to shape the future of neural security.*
