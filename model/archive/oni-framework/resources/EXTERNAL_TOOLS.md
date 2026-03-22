# External Tools & Libraries Reference

> A central catalog of every external tool, library, dataset, and standard referenced or used by the ONI Framework — with integration status, license, and relevance to the project.

**Author:** Kevin Qi
**Date:** 2026-01-29
**Version:** 1.0

---

## Purpose

The ONI Framework sits at the intersection of neuroscience, signal processing, cybersecurity, and physics. This document tracks every external dependency and tool the project uses or plans to use, organized by domain. Each entry includes what it does, why ONI uses it, its current integration status, and licensing.

### Integration Status Definitions

| Status | Meaning |
|--------|---------|
| **Integrated** | Currently used in code or documentation |
| **Planned** | On the development roadmap with a specific task |
| **Evaluated** | Assessed for suitability; decision pending |
| **Reference** | Cited in publications but not directly integrated |

---

## 1. Signal Processing & EEG

### BrainFlow

| Field | Value |
|-------|-------|
| **What** | Uniform API for 20+ biosensor boards (OpenBCI, Muse, BrainBit, Neurosity, etc.) |
| **Why ONI** | Primary data acquisition layer for live Cₛ(S) computation. Hardware-agnostic interface means ONI doesn't lock into a single board vendor. |
| **License** | MIT |
| **Language** | C++ core with Python, Java, C#, R bindings |
| **Website** | [brainflow.org](https://brainflow.org/) |
| **GitHub** | [brainflow-dev/brainflow](https://github.com/brainflow-dev/brainflow) |
| **Status** | **Planned** — `tara/data/brainflow_adapter.py` (see prd.json: `brainflow-integration`) |
| **Install** | `pip install brainflow` |
| **Boards** | OpenBCI Cyton/Ganglion/Daisy, Muse 2/S, BrainBit, Neurosity Crown, Enophone, synthetic |

### Neuromore

| Field | Value |
|-------|-------|
| **What** | Real-time biosignal processing engine with visual pipeline editor and neurofeedback display |
| **Why ONI** | Real-time neurofeedback visualization for coherence scoring. Visual pipeline editor enables rapid prototyping of detection algorithms without code changes. |
| **License** | Proprietary (free tier available) |
| **Language** | C++ engine, visual editor |
| **Website** | [neuromore.com](https://www.neuromore.com/) |
| **Status** | **Planned** — integration for real-time Cₛ(S) display (see prd.json: `layer-aware-coherence-implementation`, subtask 8) |

### MNE-Python

| Field | Value |
|-------|-------|
| **What** | Comprehensive Python package for exploring, visualizing, and analyzing human neurophysiological data (MEG, EEG, sEEG, ECoG, NIRS) |
| **Why ONI** | Offline EEG analysis, topographic mapping, source localization, and artifact removal. Used for validating coherence metric against standard neuroscience methods. |
| **License** | BSD 3-Clause |
| **Language** | Python |
| **Website** | [mne.tools](https://mne.tools/) |
| **GitHub** | [mne-tools/mne-python](https://github.com/mne-tools/mne-python) |
| **Status** | **Planned** — dependency for coherence implementation |
| **Install** | `pip install mne` |

### SciPy (Signal Processing)

| Field | Value |
|-------|-------|
| **What** | Scientific computing library — specifically `scipy.signal` for STFT, filtering, spectral analysis |
| **Why ONI** | Core computation: `scipy.signal.stft` for Short-Time Fourier Transform in Cₛ(S) pipeline. Also: `scipy.signal.welch` for power spectral density, `scipy.signal.butter` for bandpass filtering. |
| **License** | BSD 3-Clause |
| **GitHub** | [scipy/scipy](https://github.com/scipy/scipy) |
| **Status** | **Integrated** — used in `oni-framework` and `oni-tara` |
| **Install** | `pip install scipy` |
| **Key Functions** | `stft()`, `welch()`, `butter()`, `sosfilt()`, `hilbert()` |

### NumPy

| Field | Value |
|-------|-------|
| **What** | Fundamental array computing library for Python |
| **Why ONI** | Array operations for signal processing, variance computation, matrix operations in coherence metric |
| **License** | BSD 3-Clause |
| **GitHub** | [numpy/numpy](https://github.com/numpy/numpy) |
| **Status** | **Integrated** — core dependency |
| **Install** | `pip install numpy` |

---

## 2. Benchmarking & Datasets

### MOABB (Mother of All BCI Benchmarks)

| Field | Value |
|-------|-------|
| **What** | Standardized benchmarking framework for BCI algorithms with 30+ public EEG datasets |
| **Why ONI** | Validation of Cₛ(S) against real EEG data. Provides ground truth for attack detection accuracy (precision, recall, F1). Enables reproducible benchmarking. |
| **License** | BSD 3-Clause |
| **GitHub** | [NeuroTechX/moabb](https://github.com/NeuroTechX/moabb) |
| **Status** | **Integrated** — `tara/data/moabb_adapter.py` exists; benchmarking tasks planned |
| **Install** | `pip install oni-tara[moabb]` |
| **Datasets Used** | BNCI2014_001, PhysioNet MI, others |
| **Citation** | Jayaram & Barachant (2018) |
| **See Also** | [RELATED_WORK.md](../RELATED_WORK.md#moabb-mother-of-all-bci-benchmarks) |

### PhysioNet

| Field | Value |
|-------|-------|
| **What** | Repository of freely-available physiological signal databases and software |
| **Why ONI** | Public EEG datasets for validating Cₛ without requiring hardware. PhysioNet Motor Imagery dataset is a primary validation target. |
| **License** | Open Data Commons (ODC) |
| **Website** | [physionet.org](https://physionet.org/) |
| **Status** | **Reference** — datasets available through MOABB adapter |
| **Key Datasets** | EEG Motor Movement/Imagery Dataset, Sleep-EDF, CHB-MIT Scalp EEG |

---

## 3. Visualization & Web

### Three.js

| Field | Value |
|-------|-------|
| **What** | JavaScript 3D rendering library |
| **Why ONI** | Interactive 3D visualizations in GitHub Pages — brain topology, signal propagation, layer navigation |
| **License** | MIT |
| **Website** | [threejs.org](https://threejs.org/) |
| **Status** | **Integrated** — used in `docs/visualizations/` interactive demos |

### AOS.js (Animate on Scroll)

| Field | Value |
|-------|-------|
| **What** | CSS-driven scroll animation library |
| **Why ONI** | Smooth scroll animations on the GitHub Pages landing page |
| **License** | MIT |
| **Website** | [michalsnik.github.io/aos](https://michalsnik.github.io/aos/) |
| **Status** | **Integrated** — CDN-hosted in `docs/index.html`, auto-updated |

### Remotion

| Field | Value |
|-------|-------|
| **What** | React-based programmatic video generation framework |
| **Why ONI** | ONI demo video production — programmatic animation, frame-precise timing, reproducible builds |
| **License** | Business Source License (BSL) — free for individuals and small businesses |
| **Website** | [remotion.dev](https://remotion.dev/) |
| **GitHub** | [remotion-dev/remotion](https://github.com/remotion-dev/remotion) |
| **Status** | **Integrated** — `MAIN/legacy-core/oni-product-demo/` contains the ONI demo video project |

### Streamlit

| Field | Value |
|-------|-------|
| **What** | Python framework for building data apps |
| **Why ONI** | TARA web dashboard — real-time security monitoring UI |
| **License** | Apache 2.0 |
| **Website** | [streamlit.io](https://streamlit.io/) |
| **Status** | **Integrated** — `tara_mvp/ui/` uses Streamlit for the web interface |
| **Install** | `pip install oni-tara[full]` then `tara ui` |

### Blender

| Field | Value |
|-------|-------|
| **What** | Open-source 3D creation suite |
| **Why ONI** | Planned macro-to-micro BCI visualization (brain → region → neurons → synapses → neurotransmitters) |
| **License** | GPL 2+ |
| **Website** | [blender.org](https://www.blender.org/) |
| **Status** | **Planned** — see prd.json: `bci-macro-to-micro-visualization` |
| **Addons** | Molecular Nodes (for neurotransmitter rendering), brain2printAI (MRI → 3D models) |

---

## 4. Security & Analysis

### Bandit

| Field | Value |
|-------|-------|
| **What** | Python static security analysis tool (AST-based) |
| **Why ONI** | Scans `oni-framework` and `oni-tara` for common security issues (hardcoded secrets, SQL injection, command injection, etc.) |
| **License** | Apache 2.0 |
| **GitHub** | [PyCQA/bandit](https://github.com/PyCQA/bandit) |
| **Status** | **Integrated** — CI/CD security workflow, completed security scan (see prd.json: `pypi-security-scan`) |
| **Install** | `pip install bandit` |

### Safety

| Field | Value |
|-------|-------|
| **What** | Python dependency vulnerability scanner |
| **Why ONI** | Checks all pip dependencies against known vulnerability databases |
| **License** | MIT |
| **GitHub** | [pyupio/safety](https://github.com/pyupio/safety) |
| **Status** | **Integrated** — CI/CD security workflow |

---

## 5. Machine Learning & Statistics

### scikit-learn

| Field | Value |
|-------|-------|
| **What** | Machine learning library for Python |
| **Why ONI** | Classification, clustering, and anomaly detection for neural signal analysis. Used in TARA's detection pipeline. |
| **License** | BSD 3-Clause |
| **Website** | [scikit-learn.org](https://scikit-learn.org/) |
| **Status** | **Integrated** — used in `tara_mvp` for ML-based detection |

### Matplotlib

| Field | Value |
|-------|-------|
| **What** | Python plotting library |
| **Why ONI** | Signal visualization, spectral plots, coherence score timelines, EEG topographic maps |
| **License** | Matplotlib License (BSD-compatible) |
| **Status** | **Integrated** — used throughout for analysis plots |

---

## 6. Physics & Neuroscience References

These are not software dependencies but scientific foundations that ONI equations are built upon. For the full equation catalog, see [TechDoc-Equations_Reference.md](../publications/mathematical-foundations/TechDoc-Equations_Reference.md).

| Foundation | Key Equations | ONI Application | Reference |
|------------|---------------|-----------------|-----------|
| **Maxwell (quasi-static)** | ∇·(σ∇V) = Iₛ | Volume conduction in tissue | Maxwell, 1865; Plonsey & Heppner, 1967 |
| **Boltzmann distribution** | P ∝ e^(−E/kT) | Cₛ exponential form, ion channel gating | Boltzmann, 1877 |
| **Nernst equation** | E = (RT/zF) ln([ion]_out/[ion]_in) | Membrane potential thresholds | Nernst, 1889 |
| **Nernst-Planck** | J = −D∇c − (zF/RT)Dc∇V | Ion transport (actual current carriers) | Nernst, 1889; Planck, 1890 |
| **Einstein diffusion** | D = kT/(6πηr) | Neurotransmitter diffusion across synaptic cleft | Einstein, 1905 |
| **Hodgkin-Huxley** | C_m(dV/dt) = −Σ gᵢmᵖhᵍ(V − Eᵢ) + I_ext | Action potential generation — baseline for coherence | Hodgkin & Huxley, 1952 |
| **Cole-Cole model** | ε*(ω) = ε_∞ + Σ Δεᵢ/(1+(jωτᵢ)^(1−αᵢ)) | Frequency-dependent tissue properties, dispersion correction | Cole & Cole, 1941; Gabriel et al., 1996 |
| **Fourier Transform** | X(f) = ∫ x(t)e^(−i2πft) dt | Core analysis tool for all ONI metrics | Fourier, 1822 |

**What is NOT used (and why):** See [Equations Reference, Section 4](../publications/mathematical-foundations/TechDoc-Equations_Reference.md#4-what-is-not-used-and-why).

---

## 7. Development & CI/CD

### Python Testing

| Tool | Purpose | Status |
|------|---------|--------|
| **pytest** | Unit testing framework | Integrated (182 tests) |
| **pytest-cov** | Code coverage reporting | Integrated |
| **pytest-xdist** | Parallel test execution | Integrated |

### GitHub Actions

| Workflow | Purpose | Status |
|----------|---------|--------|
| **tests.yml** | Run Python tests (3.9-3.12) on push/PR | Integrated |
| **security.yml** | Bandit + Safety security scanning | Integrated |
| **publish.yml** | PyPI package publishing | Integrated |
| **brand-sync.yml** | Sync brand.json → README.md | Integrated |
| **auto-index.yml** | Auto-generate GLOSSARY.md via GitHub Models | Integrated |

### ElevenLabs

| Field | Value |
|-------|-------|
| **What** | AI voice generation platform |
| **Why ONI** | Voiceover for ONI demo video — psychology-backed voice selection |
| **License** | Proprietary (API-based) |
| **Status** | **Integrated** — used in `MAIN/legacy-core/oni-product-demo/` production pipeline |

---

## 8. Hardware Targets

These are BCI hardware platforms that ONI aims to validate against:

| Platform | Type | API | Integration Path | Status |
|----------|------|-----|------------------|--------|
| **OpenBCI Cyton** | 8-channel EEG | BrainFlow | `oni-openbci` adapter | Planned |
| **OpenBCI Ganglion** | 4-channel EEG | BrainFlow | Via BrainFlow adapter | Planned |
| **OpenBCI Daisy** | 16-channel EEG | BrainFlow | Via BrainFlow adapter | Planned |
| **Muse 2/S** | 4-channel EEG | BrainFlow | Via BrainFlow adapter | Evaluated |
| **Neurosity Crown** | 8-channel EEG | BrainFlow | Via BrainFlow adapter | Evaluated |
| **BrainBit** | 4-channel EEG | BrainFlow | Via BrainFlow adapter | Evaluated |

**Priority:** OpenBCI first (open-source hardware, largest dev community, affordable validation platform).

---

## 9. Standards & Specifications

| Standard | Body | Relevance | ONI Alignment |
|----------|------|-----------|---------------|
| **MITRE ATT&CK** | MITRE | Threat taxonomy methodology | ONI Threat Matrix uses similar structure |
| **NIST Cybersecurity Framework** | NIST | Security controls | ONI maps to NIST functions |
| **IEC 62443** | IEC | Industrial control security | Neural interface security parallels |
| **FDA BCI Guidance** | FDA | Regulatory requirements | REGULATORY_COMPLIANCE.md mapping |
| **IEEE Brain Initiative** | IEEE | BCI standards | Planned standards proposal |

---

## 10. Quick Install Reference

```bash
# Core ONI Framework
pip install oni-framework

# TARA Security Platform (full)
pip install oni-tara[full]

# TARA with MOABB benchmarking
pip install oni-tara[moabb]

# Signal processing stack (for development)
pip install numpy scipy mne brainflow matplotlib scikit-learn

# Security scanning
pip install bandit safety

# Testing
pip install pytest pytest-cov pytest-xdist
```

---

## Cross-References

| Document | Relationship |
|----------|-------------|
| [TechDoc-Equations_Reference.md](../publications/mathematical-foundations/TechDoc-Equations_Reference.md) | Master equation catalog — physics foundations |
| [TechDoc-Mathematical_Audit.md](../publications/mathematical-foundations/TechDoc-Mathematical_Audit.md) | Audit of mathematical claims |
| [TechDoc-Mathematical_Foundations.md](../publications/mathematical-foundations/TechDoc-Mathematical_Foundations.md) | Corrected physics with expansion stubs |
| [RELATED_WORK.md](../RELATED_WORK.md) | Academic citations and prior work |
| [PARTNERSHIPS.md](../PARTNERSHIPS.md) | Hardware and academic collaboration roadmap |
| [prd.json](../project/prd.json) | Task tracking for all integrations |
| [KANBAN.md](../project/KANBAN.md) | Visual task board |

---

← Back to [INDEX.md](../INDEX.md) | [README.md](../../README.md)

*This document is updated as new tools are adopted or evaluated.*
