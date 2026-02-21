# Autodidactive: Neurosecurity Education Platform

> *Lowering the barrier to entry for intellectually curious minds eager to shape the future of neural security.*

---

## Why Autodidactive Exists

While building the ONI Framework, I identified a critical gap: **neurosecurity concepts are not accessible**.

The intersection of neuroscience, cybersecurity, and brain-computer interfaces requires knowledge spanning multiple disciplines — yet educational resources remain fragmented across academic papers, proprietary training, and scattered blog posts. This creates a dangerous situation: as BCIs transition from research labs into consumer products, the security workforce isn't prepared.

**The stakes are high.** BCIs are being implanted in humans *today*. Companies are racing to connect minds to machines without a shared security vocabulary. The attack landscape is evolving faster than our ability to defend against it.

We need to change this. **Now.**

---

## The Vision: Preparing for Tomorrow

Brain-computer interfaces aren't just another gadget — they represent a fundamental shift in how humans interact with technology. This is **Web 5.0**: the era where the browser is your brain.

Consider the progression:
- **Web 1.0** — Static pages, read-only
- **Web 2.0** — User-generated content, social platforms
- **Web 3.0** — Decentralization, blockchain, crypto
- **Web 4.0** — AI integration, intelligent agents
- **Web 5.0** — Neural interfaces, direct mind-machine communication

Each transition brought new attack surfaces and required security professionals to adapt. The transition to Web 5.0 is no different — except the target is no longer just your data, it's *your thoughts*.

Autodidactive exists to ensure we're ready. We're building the educational infrastructure to:

1. **Democratize neurosecurity knowledge** — Make concepts accessible to anyone, not just PhDs
2. **Create a shared vocabulary** — Establish common terms for researchers, developers, and regulators
3. **Train the next generation** — Prepare security professionals for neural threat landscapes
4. **Accelerate responsible development** — Help BCI builders integrate security from day one

---

## What You'll Learn

Autodidactive provides structured learning paths covering the full neurosecurity stack:

### Core Modules

| Module | Description | Prerequisite |
|--------|-------------|--------------|
| **Introduction to Neurosecurity** | Threat landscape, attack motivation, why this matters now | None |
| **The 14-Layer Model** | ONI's extension of OSI into the biological domain (L1-L14) | Introduction |
| **Coherence Metric (Cₛ)** | Mathematical signal trust scoring — phase, amplitude, timing | 14-Layer Model |
| **Neural Firewall** | Zero-trust security at L8 Neural Gateway | Coherence Metric |
| **Attack Patterns** | Threat modeling for BCIs — from eavesdropping to neural ransomware | Neural Firewall |
| **NSAM Monitoring** | Real-time Neural Signal Assurance Monitoring | Attack Patterns |

### Interactive Tools (Online)

These web-based visualizations are available immediately at [qinnovates.github.io/ONI/visualizations](https://qinnovates.github.io/ONI/visualizations/):

| Tool | Purpose | What You'll Learn |
|------|---------|-------------------|
| **Coherence Metric Playground** | Calculate Cₛ in real-time | How phase, amplitude, and timing affect signal trust |
| **ONI Layer Explorer** | Navigate all 14 layers interactively | How data flows from silicon to cognition |
| **NSAM Checkpoint Simulator** | Become the firewall — analyze and block signals | Real-time security decision making |
| **Scale-Frequency Navigator** | Explore neural patterns across time scales | From femtoseconds to years in neural processing |
| **ONI Threat Matrix** | 10 tactics, 46 techniques mapped to ONI layers | How attackers think about neural systems |
| **Academic Alignment** | Research foundation from 12+ universities | The science behind the framework |

### Advanced Platform (Downloadable)

For deeper exploration, TARA (Telemetry Analysis & Response Automation) provides:

- **Neural network simulation** with configurable neuron models (LIF, Izhikevich, Hodgkin-Huxley)
- **Attack simulation engine** with 25+ attack patterns
- **Real EEG data integration** via MOABB datasets
- **3D brain topology visualization** with electrode monitoring
- **Kohno threat taxonomy** implementation (Alteration, Blocking, Eavesdropping)

---

## Installation

### Step 1: Prerequisites

Ensure you have Python 3.9 or higher installed:

```bash
python --version  # Should show Python 3.9+
```

### Step 2: Install Autodidactive

```bash
# Basic installation (includes oni-framework as dependency)
pip install oni-academy

# Full installation (with interactive UI)
pip install oni-academy[full]
```

### Step 3: Verify Installation

```python
import oni_academy
import oni

print(f"Autodidactive v{oni_academy.__version__}")
print(f"ONI Framework v{oni.__version__}")

# List available learning modules
from oni_academy import list_modules
print(list_modules())
```

### Step 4: Launch the Learning Portal

```bash
# CLI interface
oni-academy list          # See available modules
oni-academy info intro    # Get module details
oni-academy ui            # Launch interactive UI (requires [ui] extras)
```

Or use TARA for advanced simulations:

```bash
pip install oni-tara[ui]
tara ui                   # Opens at http://localhost:8501
```

### Step 5: Explore the Interactive Tools

**Web-based (no installation required):**
Visit [qinnovates.github.io/ONI/visualizations](https://qinnovates.github.io/ONI/visualizations/)

**TARA Stack pages:**

| Page | What to Explore |
|------|-----------------|
| **Dashboard** | System overview, real-time metrics |
| **Brain Topology** | 3D visualization of electrode monitoring |
| **Neural Firewall** | L8-L14 validation pipeline |
| **Neural Simulator** | Run simulations with different neuron models |
| **Attack Simulator** | Test attack patterns against the system |
| **Neurosecurity** | Kohno threat rules, privacy calculations |

---

## Package Ecosystem

The ONI ecosystem is organized into three packages with distinct purposes:

| Package | Purpose | When to Use |
|---------|---------|-------------|
| **oni-framework** | Core API library | Building BCI applications, integrating security primitives |
| **oni-academy** | Educational platform | Learning neurosecurity concepts, tutorials |
| **oni-tara** | Security monitoring | Attack simulation, threat detection, monitoring dashboards |

```
oni-academy (this package)
    │
    ├── depends on: oni-framework (core API)
    │
    └── optional: oni-tara (advanced simulations)
```

**oni-framework is API-only** — designed for developers integrating neural security into their applications. No educational content or UI included.

---

## How It Works

### Architecture

```
Autodidactive Learning Stack
==========================

┌─────────────────────────────────────────────────────────────┐
│                    INTERACTIVE TOOLS (Web)                  │
│  Coherence Playground | Layer Explorer | NSAM Simulator     │
│                  (No installation required)                 │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    TARA PLATFORM (Local)                    │
│    UI Dashboard | Neural Simulator | Attack Engine          │
│                  pip install oni-tara                       │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    ONI FRAMEWORK (Core)                     │
│    Coherence Metric | 14-Layer Model | Neural Firewall      │
│                pip install oni-framework                    │
└─────────────────────────────────────────────────────────────┘
```

### Component Overview

#### ONI Framework (`oni-framework`)

The core library providing:

- **`CoherenceCalculator`** — Compute signal trust scores using the Cₛ formula
- **`ONILayers`** — The 14-layer reference model (L1-L14)
- **`NeuralFirewall`** — Decision matrix for signal validation
- **`ScaleFrequency`** — The f × S ≈ k invariant across temporal scales

```python
from oni import CoherenceCalculator, ONILayers, NeuralFirewall

# Calculate coherence
calc = CoherenceCalculator()
score = calc.calculate(signal_data)
print(f"Trust score: {score.value:.3f}")

# Check layer mapping
layer = ONILayers.get_layer(8)
print(f"L8: {layer.name} — {layer.description}")

# Firewall decision
firewall = NeuralFirewall()
decision = firewall.evaluate(signal_data)
print(f"Action: {decision.action}")  # ALLOW, BLOCK, QUARANTINE
```

#### TARA Stack (`oni-tara`)

The security monitoring and simulation platform:

- **Simulation Engine** — Neural network models with configurable parameters
- **Attack Patterns** — 25+ attack types mapped to ONI layers
- **NSAM (Neural Signal Assurance Monitoring)** — Real-time detection rules
- **Visualization** — 3D brain topology, signal charts, firewall pipeline

```python
from tara_mvp import AttackSimulator, AttackPattern

# Simulate an attack
simulator = AttackSimulator()
result = simulator.run_attack(
    pattern=AttackPattern.NEURAL_RANSOMWARE,
    target_layer=13,
    duration=10.0
)

print(f"Attack detected: {result.detected}")
print(f"Time to detection: {result.detection_time:.2f}s")
```

#### Interactive Visualizations (Web)

Browser-based tools requiring no installation:

- Built with vanilla JavaScript for maximum compatibility
- Designed for both learning and demonstration
- Connected to the academic research foundation

---

## Learning Paths

### Path 1: Security Professional

*For those with cybersecurity background wanting to specialize in neural security*

1. Review the **14-Layer Model** to understand how ONI extends OSI
2. Use the **ONI Layer Explorer** to see attack surfaces at each layer
3. Study the **ONI Threat Matrix** — compare to MITRE ATT&CK
4. Run attack simulations in TARA to see detection in action
5. Implement custom detection rules using NSAM

### Path 2: BCI Developer

*For engineers building neural interfaces who need security primitives*

1. Start with the **Coherence Metric Playground** to understand signal trust
2. Integrate `oni-framework` into your signal processing pipeline
3. Use the **Neural Firewall** for real-time validation
4. Test your implementation against TARA attack patterns
5. Review **Neurosecurity** page for privacy-preserving techniques

### Path 3: Researcher

*For academics studying BCI security and neuroethics*

1. Explore the **Academic Alignment** visualization
2. Read the [Related Work](../RELATED_WORK.md) for foundational papers
3. Use TARA's MOABB integration for testing against real EEG data
4. Contribute new attack patterns or detection rules
5. Reference ONI in your publications

### Path 4: Curious Mind

*For anyone interested in the future of neural security*

1. Watch the demo video on the [main site](https://qinnovates.github.io/ONI/)
2. Play with the **NSAM Checkpoint Simulator** — become the firewall
3. Explore the **Scale-Frequency Navigator** to understand neural timescales
4. Read the [INDEX.md](../INDEX.md) for the full documentation map
5. Star the repo and join the discussion

---

## Contributing to Education

Autodidactive is open-source. Help us improve neurosecurity education:

### Ways to Contribute

- **Create tutorials** — Write guides for specific use cases
- **Build visualizations** — Add new interactive learning tools
- **Translate content** — Help make materials accessible in other languages
- **Report issues** — Found something confusing? Let us know
- **Suggest topics** — What should we cover next?

### Contribution Guidelines

See [CONTRIBUTING.md](../CONTRIBUTING.md) for details on:
- Code style and documentation standards
- How to submit pull requests
- The review process

---

## Related Resources

| Resource | Purpose |
|----------|---------|
| [ONI Framework README](../oni-framework/README.md) | Core library documentation |
| [TARA Stack README](../tara-nsec-platform/README.md) | Security stack documentation |
| [ONI Layers Reference](../oni-framework/ONI_LAYERS.md) | Complete 14-layer specification |
| [Academic Landscape](../ACADEMIC_LANDSCAPE.md) | Universities and researchers |
| [Related Work](../RELATED_WORK.md) | Foundational BCI security research |
| [Neuroethics Alignment](../governance/NEUROETHICS_ALIGNMENT.md) | Ethics framework mapping |

---

## License

Apache 2.0 — Free to use, modify, and distribute.

---

*Autodidactive — Because the brain's first firewall won't build itself.*

*Last Updated: 2026-01-26*
