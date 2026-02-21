# Autodidact

> **Status:** Active Development

> **Ultimate Goal:** Build a self-directed learning system that adapts to how each individual learns — making complex knowledge accessible through personalized visualizations, pacing, and pathways. Eventually delivered through BCI technology.

The `autodidact` module is the educational arm of Mindloft. It's not just documentation — it's a living system for learning and teaching neurosecurity concepts, built on the principle that **education should adapt to the learner, not the other way around**.

---

## Table of Contents

- [Autodidactive: The Web Platform](#autodidactive-the-web-platform)
  - [Relationship to QIF](#relationship-to-qif)
  - [Why the Separation Matters](#why-the-separation-matters)
  - [Current Features (Demo)](#current-features-demo)
  - [Browser AI & Animations (v0.2)](#browser-ai--animations-v02)
  - [Live Demo](#live-demo)
- [The BCI Vision](#the-bci-vision)
  - [The Future: Learning Through BCIs](#the-future-learning-through-bcis)
  - [How This Enhances QIF](#how-this-enhances-qif)
  - [The Feedback Loop](#the-feedback-loop)
- [AI-Powered Learning Pipeline](#ai-powered-learning-pipeline)
- [The Adaptive Learning Vision](#the-adaptive-learning-vision)
- [Components](#components)
  - [1. Autodidactive Web -- Interactive Learning Platform](#1-autodidactive-web--interactive-learning-platform)
  - [2. LearnViz -- Adaptive Visualization Engine](#2-learnviz--adaptive-visualization-engine)
  - [3. QIF Academy -- Structured Curriculum](#3-qif-academy--structured-curriculum)
  - [4. Neuroscience -- Research Foundation](#4-neuroscience--research-foundation)
- [How They Align](#how-they-align)
- [Design Principles](#design-principles)
  - [1. Separation of Concerns](#1-separation-of-concerns)
  - [2. Adaptive by Default](#2-adaptive-by-default)
  - [3. Progressive Enhancement](#3-progressive-enhancement)
  - [4. Security-First (QIF Integration)](#4-security-first-qif-integration)
- [Roadmap](#roadmap)
  - [Phase 1: Foundation](#phase-1-foundation-)
  - [Phase 2: Autodidactive Web Platform](#phase-2-autodidactive-web-platform--current)
  - [Phase 3: Content Expansion](#phase-3-content-expansion)
  - [Phase 4: Adaptive Learning](#phase-4-adaptive-learning)
  - [Phase 5: AR/Glasses Integration](#phase-5-arglasses-integration)
  - [Phase 6: BCI Integration (Long-term Vision)](#phase-6-bci-integration-long-term-vision)
- [File Structure](#file-structure)
- [Getting Started](#getting-started)
  - [For Interactive Learning (Easiest)](#for-interactive-learning-easiest)
  - [For QIF Academy (pip install)](#for-qif-academy-pip-install)
  - [For Creating Visualizations](#for-creating-visualizations)
  - [For Contributing Research](#for-contributing-research)
- [Philosophy](#philosophy)
- [Related](#related)

---

## Autodidactive: The Web Platform

**[Autodidactive](https://frontend-phi-seven-64.vercel.app)** is the public-facing web application built on this research. It's a demo of what adaptive AI-driven learning can look like.

### Relationship to QIF

| Project | Purpose | Audience |
|---------|---------|----------|
| **QIF Framework** | BCI security research, hourglass architecture, academic publications | Researchers, academics, security professionals |
| **Autodidactive** | Interactive learning platform, AI-generated content, knowledge graphs | Learners, students, curious minds |

**Key distinction:** QIF is the *research foundation*. Autodidactive is an *application* that demonstrates how QIF concepts can be taught interactively. They're related but serve different purposes.

### Why the Separation Matters

Academics visiting the QIF Framework expect rigorous security research — threat models, formal methods, peer-reviewed concepts. They shouldn't be confused by a learning platform.

Learners visiting Autodidactive want to explore topics interactively — click around, expand nodes, watch generated videos. They don't need the full academic depth upfront.

**Autodidactive showcases QIF. QIF doesn't depend on Autodidactive.**

### Current Features (Demo)

- **Interactive Knowledge Graphs** — Click nodes to explore topics
- **QIF Framework Courses** — Pre-built curriculum (no API key needed)
- **Browser AI Mode** — Run LLMs directly in your browser using WebGPU (no API key needed!)
- **Explore Any Topic** — AI-generated graphs for any subject (Browser AI or bring your own API key)
- **Interactive Animations** — Manim-like educational animations generated in the browser
- **Memory-Only Security** — API keys never persisted, cleared on refresh

### Browser AI & Animations (v0.2)

The platform now includes **browser-based AI** using WebLLM:
- **No API keys required** — AI runs entirely in your browser
- **Works offline** after initial model download
- **Privacy-first** — your data never leaves your device
- **Supports multiple models** — Llama 3.2, Phi-3, Mistral

**Animation Engine:**
- Generates educational animations from any topic
- Manim-like canvas rendering with easing functions
- Supports circles, rectangles, arrows, text, paths
- Sequenced animations with narration overlay
- Play/pause/seek controls with fullscreen mode

### Live Demo

**Web:** [frontend-phi-seven-64.vercel.app](https://frontend-phi-seven-64.vercel.app)

**Source:** [kevinqicode/personal/projects/autodidactive](https://github.com/kevinqicode) (private development repo)

---

## The BCI Vision

This is where it all connects to the larger Mindloft mission.

### The Future: Learning Through BCIs

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     THE BCI LEARNING PIPELINE                            │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   TODAY (Autodidactive Demo)                                            │
│   ┌─────────────────────────────────────────────────────────────────┐   │
│   │  User Input: "I want to learn quantum computing"                │   │
│   │       ↓                                                         │   │
│   │  AI generates knowledge graph + explanations                    │   │
│   │       ↓                                                         │   │
│   │  User clicks to explore (screen-based)                          │   │
│   │       ↓                                                         │   │
│   │  AI generates video when visual explanation helps               │   │
│   └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│   NEAR FUTURE (AR Glasses Integration)                                  │
│   ┌─────────────────────────────────────────────────────────────────┐   │
│   │  Knowledge graphs visualized in 3D space around you             │   │
│   │  Point at a node → expand explanation                           │   │
│   │  Voice interaction: "Explain this deeper"                       │   │
│   │  Contextual learning: See related concepts in your environment  │   │
│   └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│   LONG-TERM (Direct BCI Integration)                                    │
│   ┌─────────────────────────────────────────────────────────────────┐   │
│   │  BCI detects confusion/comprehension states                     │   │
│   │       ↓                                                         │   │
│   │  Automatically adjusts explanation depth/pace                   │   │
│   │       ↓                                                         │   │
│   │  Visualizations rendered directly to visual cortex              │   │
│   │       ↓                                                         │   │
│   │  Learning optimized for YOUR neural patterns                    │   │
│   │                                                                 │   │
│   │  ⚠️  SECURED BY QIF FRAMEWORK                                   │   │
│   │  • Hourglass architecture protects neural data                  │   │
│   │  • Coherence metric validates signal integrity                  │   │
│   │  • Neural firewall prevents unauthorized access                 │   │
│   └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### How This Enhances QIF

| QIF Component | How Autodidactive Uses It | Future BCI Application |
|---------------|---------------------------|------------------------|
| **Hourglass Architecture** | Teaches users the security layers | Validates learning content at each layer |
| **Coherence Metric (Cₛ)** | Explains signal integrity | Monitors neural signal quality during learning |
| **Neural Firewall** | Interactive demo of threat detection | Protects learner's brain from malicious content |
| **Scale-Frequency Invariant** | Visualizes f × S ≈ k | Optimizes content delivery across neural scales |

### The Feedback Loop

```
QIF Research → Autodidactive Content → User Learning Data → Better QIF Research
     ↑                                                              │
     └──────────────────────────────────────────────────────────────┘
```

1. **QIF defines** how to secure brain-computer interfaces
2. **Autodidactive demonstrates** these concepts through interactive learning
3. **User engagement** reveals which explanations work best
4. **Insights feed back** into QIF research (e.g., how people understand neural security)

---

## AI-Powered Learning Pipeline

Autodidact leverages AI and automation to accelerate content creation and personalization:

| Component | AI/Automation Role |
|-----------|-------------------|
| **LearnViz** | LLM-powered concept → visualization pipeline |
| **Autodidactive Web** | AI-generated knowledge graphs and explanations |
| **QIF Academy** | Pre-built modules from research notes |
| **Research Synthesis** | AI-assisted paper summarization and knowledge extraction |
| **Content Pipeline** | Automated rendering, publishing, and cross-linking |

This isn't AI replacing learning — it's AI **enabling** self-directed learning at scale.

---

## The Adaptive Learning Vision

```
┌─────────────────────────────────────────────────────────────────┐
│                    AUTODIDACT ECOSYSTEM                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │                   LEARNER PROFILE                        │   │
│   │   • Learning style (visual/verbal/kinesthetic)          │   │
│   │   • Pace & comprehension tracking                       │   │
│   │   • Knowledge graph (what you already know)             │   │
│   │   • Preferences (animation speed, detail level)         │   │
│   │   • [Future] Neural patterns from BCI feedback          │   │
│   └─────────────────────────────────────────────────────────┘   │
│                            │                                    │
│                            ▼                                    │
│   ┌─────────────┐   ┌─────────────┐   ┌─────────────┐          │
│   │  LEARNVIZ   │   │AUTODIDACTIVE│   │ NEUROSCIENCE│          │
│   │  Adaptive   │◀──│    Web      │◀──│   RESEARCH  │          │
│   │  Visuals    │   │  Platform   │   │  Foundation │          │
│   └─────────────┘   └─────────────┘   └─────────────┘          │
│         │                 │                 │                   │
│         └─────────────────┼─────────────────┘                   │
│                           ▼                                     │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │              PERSONALIZED LEARNING PATH                 │   │
│   │   • Auto-adjusting difficulty                           │   │
│   │   • Visualizations tailored to your style               │   │
│   │   • Pacing based on your comprehension                  │   │
│   │   • Prerequisites auto-detected from knowledge graph    │   │
│   │   • [Future] BCI-optimized content delivery             │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Components

### 1. Autodidactive Web — Interactive Learning Platform

**Purpose:** Public demo of AI-driven adaptive learning.

**Current (v0.1 Demo):**
- Interactive knowledge graph exploration
- Pre-built QIF Framework courses
- AI-generated content for any topic (with API key)
- React Flow visualization
- Next.js + Vercel deployment

**Future:**
- Real-time video generation (LearnViz integration)
- User accounts with learning profiles
- AR/glasses integration
- BCI comprehension feedback

**Live:** [frontend-phi-seven-64.vercel.app](https://frontend-phi-seven-64.vercel.app)

---

### 2. LearnViz — Adaptive Visualization Engine

**Purpose:** Generate educational visualizations that adapt to individual learning behaviors.

**Current (v0.2):**
- Concept → Code → Video pipeline
- Pattern-based concept classification
- 8 Manim templates (binary search, sorting, Pythagorean, trees, action potential, synapse, motor cortex BCI, neurotransmitters)
- Local rendering with Manim
- Voice narration (edge-tts, gtts, pyttsx3)
- Ollama integration for custom AI-generated visualizations
- Web UI (Streamlit)

**Future (v0.4+):**
- Learner profiles with style/pace tracking
- Visualizations that adjust to YOUR learning patterns
- Cloud LLM integration (Claude, OpenAI) for web platform
- Real-time generation for Autodidactive

**Location:** [`learnviz/`](./learnviz/)

```bash
# Example usage
cd learnviz
python learnviz.py "Explain binary search" --render
```

---

### 3. QIF Academy — Structured Curriculum

**Purpose:** Provide structured learning paths for neurosecurity concepts, from basics to advanced.

**What it offers:**
- Learning modules (hourglass architecture, coherence metric, neural firewall, etc.)
- Interactive web tools (no installation required)
- Python API for programmatic access
- CLI for quick exploration

**Location:** [`oni-academy/`](./oni-academy/)

```bash
# Install
pip install oni-academy

# List modules
oni-academy list

# Launch UI
oni-academy ui
```

**Web Tools (no install):**
- [Coherence Metric Playground](https://qinnovates.github.io/mindloft/visualizations/01-coherence-metric-playground.html)
- [Layer Explorer](https://qinnovates.github.io/mindloft/visualizations/02-oni-layer-explorer.html)
- [NSAM Checkpoint Simulator](https://qinnovates.github.io/mindloft/visualizations/04-nsam-checkpoint-simulator.html)

---

### 4. Neuroscience — Research Foundation

**Purpose:** Personal research repository for understanding the biological substrate that BCIs interface with.

**What it contains:**
- Brain region documentation (motor cortex, limbic system, etc.)
- BCI research notes (how electrodes work, signal decoding)
- Visualization projects (Blender 3D, Manim 2D)
- Key questions the research aims to answer

**Location:** [`neuroscience/`](./neuroscience/)

**Why it matters:** You can't secure what you don't understand. This research feeds directly into QIF Academy content and LearnViz visualizations.

---

## How They Align

```
┌──────────────────────────────────────────────────────────────────┐
│                     KNOWLEDGE FLOW                               │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│   NEUROSCIENCE                                               │
│   ┌────────────────────────────┐                                 │
│   │ • Raw research notes       │                                 │
│   │ • Brain region anatomy     │                                 │
│   │ • BCI signal processing    │                                 │
│   └────────────┬───────────────┘                                 │
│                │ (research matures into curriculum)              │
│                ▼                                                 │
│   QIF ACADEMY + AUTODIDACTIVE                                    │
│   ┌────────────────────────────┐                                 │
│   │ • Structured modules       │                                 │
│   │ • Interactive web platform │                                 │
│   │ • Knowledge graph explorer │                                 │
│   │ • AI-generated content     │                                 │
│   └────────────┬───────────────┘                                 │
│                │ (curriculum generates visualizations)           │
│                ▼                                                 │
│   LEARNVIZ                                                       │
│   ┌────────────────────────────┐                                 │
│   │ • Adaptive visualizations  │                                 │
│   │ • Video generation         │                                 │
│   │ • TTS narration            │                                 │
│   │ • Custom pacing/style      │                                 │
│   └────────────────────────────┘                                 │
│                                                                  │
│   ════════════════════════════════════════════════════           │
│   FUTURE: BCI-delivered personalized learning that               │
│   adapts in real-time to neural comprehension signals            │
│   ════════════════════════════════════════════════════           │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

---

## Design Principles

### 1. Separation of Concerns

- **QIF** = Security research (for academics)
- **Autodidactive** = Learning application (for everyone)
- **LearnViz** = Visualization engine (for content creation)

Each can evolve independently while feeding into the others.

### 2. Adaptive by Default

Every component eventually adapts to the learner:
- **Pace:** How fast you comprehend
- **Style:** Visual vs verbal vs kinesthetic
- **Depth:** Beginner-friendly or expert-level
- **History:** Skip what you already know
- **[Future] Neural feedback:** Real-time BCI signals

### 3. Progressive Enhancement

```
Web (today) → AR Glasses (near-term) → Direct BCI (long-term)
```

The same content works across delivery mechanisms. Start with screens, add spatial computing, eventually integrate neural interfaces.

### 4. Security-First (QIF Integration)

All future BCI learning features are secured by the QIF Framework:
- Content validated through the hourglass architecture
- Signal integrity via Coherence Metric
- Unauthorized access blocked by Neural Firewall

---

## Roadmap

### Phase 1: Foundation ✅
- [x] QIF Academy pip package with learning modules
- [x] Interactive web tools (browser-based)
- [x] Neuroscience research repository structure
- [x] LearnViz v0.1 (concept → video pipeline)

### Phase 2: Autodidactive Web Platform ← **CURRENT**
- [x] Knowledge graph visualization (React Flow)
- [x] Pre-built QIF courses
- [x] AI-powered topic exploration
- [x] Browser-based AI (WebLLM - no API key needed)
- [x] Browser-based animation engine (Manim-like)
- [ ] LearnViz video integration (server-side Manim)
- [ ] User learning profiles

### Phase 3: Content Expansion
- [ ] More LearnViz templates (graphs, recursion, physics)
- [ ] Expanded QIF Academy modules
- [ ] Brain region deep dives (motor cortex → full)
- [ ] Cross-linking between components

### Phase 4: Adaptive Learning
- [ ] Learner profile implementation
- [ ] Pace/style tracking
- [ ] Knowledge graph per user
- [ ] Auto-adjusting difficulty
- [ ] Personalized learning paths

### Phase 5: AR/Glasses Integration
- [ ] Spatial knowledge graph visualization
- [ ] Voice-controlled exploration
- [ ] Contextual learning overlays
- [ ] Gesture-based interaction

### Phase 6: BCI Integration (Long-term Vision)
- [ ] Comprehension detection from neural signals
- [ ] Real-time difficulty adjustment
- [ ] Direct visual cortex rendering (far future)
- [ ] Full QIF security integration

---

## File Structure

```
autodidactive/
├── README.md                    # This file — ecosystem overview
├── pyproject.toml               # Python package configuration
│
├── learnviz/                    # Adaptive visualization engine
│   ├── README.md                # Vision, implementation, roadmap
│   ├── learnviz.py              # CLI orchestrator
│   ├── analyzer.py              # Concept classification
│   ├── generators/              # Code generators (Manim, Remotion, D3)
│   └── output/                  # Generated scripts
│
├── oni-academy/                 # Structured learning platform
│   ├── README.md                # Package documentation
│   ├── ONI_ACADEMY.md           # Full curriculum guide
│   ├── oni_academy/             # Python package source
│   └── tests/                   # Unit tests
│
├── neuroscience/            # Research foundation
│   ├── README.md                # Research roadmap
│   ├── brain-regions/           # Anatomical documentation
│   └── visualizing-the-mind/    # BCI zoom animations
│
└── neuroscience-homework-todo/  # Active research tasks
```

**Web Platform Source:** `kevinqicode/personal/projects/autodidactive/` (separate repo)

---

## Getting Started

### For Interactive Learning (Easiest)

Visit **[Autodidactive](https://frontend-phi-seven-64.vercel.app)** — no installation required.

### For QIF Academy (pip install)

```bash
# Install QIF Academy
pip install oni-academy

# Explore modules
oni-academy list
oni-academy ui
```

Or just use the [web tools](https://qinnovates.github.io/mindloft/visualizations/) — no installation required.

### For Creating Visualizations

```bash
cd autodidactive/learnviz

# Install Manim
pip install manim

# Generate a visualization
python learnviz.py "Binary search algorithm" --render
```

### For Contributing Research

1. Add notes to `neuroscience/brain-regions/[region]/`
2. Use `Notes-[Topic].md` for informal notes
3. Use `Research-[Topic].md` for structured research
4. Tag questions with `[Q]` and unknowns with `[?]`

---

## Philosophy

> *"The best teacher adapts to the student, not the other way around."*

Traditional education assumes everyone learns the same way. Autodidact rejects this assumption. By tracking how you learn — your pace, your preferred modalities, what you already know — we can generate educational experiences tailored specifically to you.

**The BCI connection:** Eventually, we won't need to infer learning styles from clicks and watch time. BCIs will provide direct neural feedback — confusion, comprehension, engagement — enabling truly adaptive education.

**But security comes first.** That's why QIF exists. Before we pipe learning content directly to brains, we need robust security frameworks. Autodidactive demonstrates the learning system; QIF secures it.

**The ultimate goal:** Anyone, anywhere, can learn any topic at their own pace, in their own style, eventually through direct neural interfaces — safely.

---

## Related

- [Mindloft](../) — The Mindloft project hub
- [QIF Framework](../MAIN/qif/) — Quantum Indeterministic Framework for Neural Security
- [TARA Platform](../MAIN/legacy-core/tara-nsec-platform/) — Security monitoring & simulation
- [GitHub Pages](https://qinnovates.github.io/mindloft/) — Live interactive tools
- [Autodidactive Demo](https://frontend-phi-seven-64.vercel.app) — Interactive learning platform

---

*Part of [Mindloft](https://github.com/qinnovates/mindloft)*

> *"Autodidact: Learn how you learn, then learn faster. Eventually, learn through thought."*
