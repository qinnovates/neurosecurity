# LearnViz - Adaptive Learning Visualization Engine

> **Vision:** Visualizations that adapt to how *you* learn, not the other way around.

An AI-powered, local-first pipeline that transforms concepts into educational visualizations — with the goal of adapting to each individual's learning style, pace, and cognitive patterns.

---

## What Is LearnViz?

LearnViz generates educational visualizations from natural language concept descriptions. Unlike static educational content, LearnViz aims to become **adaptive** — learning how you learn and adjusting its output accordingly.

---

## Current Capabilities (v0.2)

### What Works NOW

| Feature | Status | Description |
|---------|--------|-------------|
| **Template-based Visualization** | ✅ Working | Pre-built animations for common concepts |
| **Concept Classification** | ✅ Working | Pattern matching to identify concept type |
| **Manim Rendering** | ✅ Working | Generate and render educational videos |
| **Voice Narration** | ✅ Working | TTS with edge-tts, gtts, or pyttsx3 |
| **Video + Audio Combining** | ✅ Working | Automatic merge with ffmpeg |
| **Web UI** | ✅ Working | Local Streamlit interface |
| **Ollama Integration** | ✅ Working | Custom AI-generated visualizations |

### Available Templates

These concepts have **high-quality, tested templates**:

| Template | What It Visualizes |
|----------|-------------------|
| `binary_search` | Step-by-step search with L/R pointers, elimination highlighting |
| `sorting` | Bubble/selection/insertion sort with bar chart representation |
| `pythagorean` | Theorem proof with squares on triangle sides |
| `tree_traversal` | Inorder/preorder/postorder with visit order display |
| `action_potential` | Neuron membrane depolarization, ion channels, voltage graph |
| `synapse` | Vesicle release, neurotransmitter diffusion, receptor binding |
| `motor_cortex_bci` | Electrode arrays, population coding, neural decoding |
| `neurotransmitter` | Dopamine, serotonin, norepinephrine pathways |

### Ollama Custom Generation

For concepts **without templates**, you can use a local LLM:

```bash
# Install Ollama first: https://ollama.ai
ollama pull llama3.2

# Generate custom visualization
python learnviz.py "How does TCP/IP work" --ollama --render
python learnviz.py "Explain photosynthesis" --ollama --ollama-model codellama --render
```

**Note:** Ollama-generated code may require manual fixes. Template-based visualizations are more reliable.

---

## NOT Yet Implemented (Future Work)

| Feature | Status | Target Version |
|---------|--------|----------------|
| **Learner Profiles** | 🔲 Planned | v0.4 |
| **Adaptive Pacing** | 🔲 Planned | v0.4 |
| **Interactive Mode** | 🔲 Planned | v0.5 |
| **Remotion Generator** | 🔲 Planned | v0.3 |
| **D3.js Generator** | 🔲 Planned | v0.3 |
| **Knowledge Graph** | 🔲 Planned | v0.4 |
| **Quiz Checkpoints** | 🔲 Planned | v0.5 |
| **Multi-language Support** | 🔲 Planned | v0.6 |

---

## Quick Start

### Installation

```bash
cd autodidactive/learnviz

# Install Python dependencies
pip install -r requirements.txt

# Install ffmpeg (required for video+audio)
brew install ffmpeg  # macOS
# or: apt install ffmpeg  # Linux

# Optional: Install Ollama for custom AI generation
# Download from https://ollama.ai
ollama pull llama3.2
```

### Web UI (Recommended)

```bash
python learnviz.py --ui
# Opens http://localhost:8501 (or next available port)
```

### Command Line

```bash
# Basic: Generate code only
python learnviz.py "Explain how binary search works"

# Full pipeline: Video + narration
python learnviz.py "Synaptic transmission" --render --tts edge-tts

# Custom AI generation (requires Ollama)
python learnviz.py "How does a compiler work" --ollama --render

# List available templates
python learnviz.py --list-templates

# Ollama setup help
python learnviz.py --ollama-setup
```

### CLI Options

| Flag | Description |
|------|-------------|
| `--render` | Render video after generating code |
| `--tts ENGINE` | Add voice narration (edge-tts, gtts, pyttsx3) |
| `--ollama` | Use Ollama for custom AI generation |
| `--ollama-model MODEL` | Specify Ollama model (default: llama3.2) |
| `--format FORMAT` | Output format: mp4 or gif |
| `--quality QUALITY` | Render quality: l, m, h, k |
| `--ui` | Launch web interface |
| `--interactive` | Refine plan before generation |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    LEARNVIZ PIPELINE (v0.2)                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   [User: "Explain binary search"]                               │
│          │                                                      │
│          ▼                                                      │
│   ┌──────────────┐                                              │
│   │   ANALYZER   │ ← Pattern matching (no AI needed)            │
│   │              │   Outputs: type, complexity, template        │
│   └──────┬───────┘                                              │
│          │                                                      │
│          ▼                                                      │
│   ┌──────────────┐     ┌──────────────┐                         │
│   │  GENERATOR   │ ←── │   OLLAMA     │ ← For custom concepts   │
│   │  (Templates) │     │   (Optional) │   (local LLM)           │
│   └──────┬───────┘     └──────────────┘                         │
│          │                                                      │
│          ▼                                                      │
│   ┌──────────────┐                                              │
│   │    MANIM     │ ← Local render                               │
│   │   RENDERER   │   Outputs: MP4/GIF                           │
│   └──────┬───────┘                                              │
│          │                                                      │
│          ▼                                                      │
│   ┌──────────────┐                                              │
│   │     TTS      │ ← Voice narration                            │
│   │  + FFMPEG    │   Outputs: MP4 with audio                    │
│   └─────────────┘                                               │
│                                                                 │
│   [100% Local - No cloud required*]                             │
│   *edge-tts requires internet for voice synthesis               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## How It Works (No Claude Required)

LearnViz runs **entirely locally** without any cloud AI services:

1. **Pattern Matching** (`analyzer.py`): Regex-based classification determines concept type
2. **Template Selection**: Maps concept to pre-built Manim templates
3. **Code Generation**: Fills template parameters OR uses local Ollama LLM
4. **Rendering**: Manim renders Python code to video locally
5. **Narration**: TTS generates audio, ffmpeg combines with video

**Users don't need Claude Code, OpenAI, or any API keys.**

---

## TTS Engines

| Engine | Quality | Requires Internet | Install |
|--------|---------|-------------------|---------|
| `edge-tts` | Best | Yes | `pip install edge-tts` |
| `gtts` | Good | Yes | `pip install gtts` |
| `pyttsx3` | Basic | No | `pip install pyttsx3` |

---

## File Structure

```
learnviz/
├── README.md                 # This file
├── learnviz.py               # Main CLI orchestrator
├── analyzer.py               # Concept classification (pattern matching)
├── ui.py                     # Streamlit web interface
├── requirements.txt          # Python dependencies
│
├── generators/
│   ├── __init__.py
│   ├── manim_gen.py          # Template-based Manim generator
│   ├── narration.py          # TTS script generation
│   └── ollama_gen.py         # Ollama LLM integration
│
├── output/                   # Generated code and audio
└── media/                    # Rendered videos (gitignored)
```

---

## Roadmap

### v0.2 (Current)
- ✅ Template-based visualization
- ✅ Ollama integration for custom concepts
- ✅ Voice narration pipeline
- ✅ Web UI

### v0.3 (Next)
- 🔲 More templates (graphs, recursion, linked lists)
- 🔲 Remotion generator (React-based video)
- 🔲 D3.js generator (interactive web)
- 🔲 Improved Ollama prompts

### v0.4 (Core Vision)
- 🔲 **Learner Profiles** - Track your learning style
- 🔲 **Adaptive Pacing** - Adjust to your speed
- 🔲 **Knowledge Graph** - Remember what you know
- 🔲 **Difficulty Calibration** - Match your level

### v0.5
- 🔲 Interactive mode (pause, rewind, ask questions)
- 🔲 Quiz checkpoints
- 🔲 Branching paths

### v1.0
- 🔲 Full adaptive learning engine
- 🔲 Community templates (opt-in)
- 🔲 Multi-language support

---

## Limitations

### Current Limitations

1. **Template Coverage**: Only ~10 templates available. Concepts without templates get generic or AI-generated visualizations.

2. **Ollama Quality**: AI-generated code may have errors and require manual fixes. Templates are more reliable.

3. **No Adaptation Yet**: The system doesn't learn your preferences or adjust to your pace (planned for v0.4).

4. **Manim Only**: Currently only generates Manim visualizations. D3.js and Remotion planned for v0.3.

5. **English Only**: Narration and templates are English-only.

### What This Is NOT

- ❌ Not a replacement for human teachers
- ❌ Not connected to any cloud AI (unless you count edge-tts)
- ❌ Not tracking your data (100% local)
- ❌ Not generating perfect code every time (especially with Ollama)

---

## Contributing

Contributions welcome! Priority areas:

1. **New Templates**: Add visualizations for more concepts
2. **Ollama Prompts**: Improve code generation quality
3. **Bug Fixes**: Especially in Manim rendering edge cases
4. **Documentation**: Examples, tutorials, translations

---

## Credits

Built on:
- [Manim Community](https://www.manim.community/) — Mathematical animations
- [Ollama](https://ollama.ai/) — Local LLM inference
- [Streamlit](https://streamlit.io/) — Web interface
- [edge-tts](https://github.com/rany2/edge-tts) — Text-to-speech

---

*Part of the ONI Framework — autodidact module*

> *"Learn how you learn, then learn faster."*
