# QIF Lab — Equation Testing & Whitepaper Engine

> **The QIF whitepaper is generated as-code.** All figures, tables, and computed values are produced by Python code that reads from a single configuration source (`config.py`) and equation implementation (`qif_equations.py`). Change the equations, re-render, the paper updates.

**Framework:** QIF (Quantum Indeterministic Framework for Neural Security)
**Author:** Kevin Qi, with Claude (Anthropic)
**License:** Apache 2.0

---

## Table of Contents

- [Quick Start](#quick-start)
  - [Prerequisites](#prerequisites)
  - [Render the Whitepaper](#render-the-whitepaper)
  - [Run Equation Tests](#run-equation-tests)
- [Architecture](#architecture)
  - [As-Code Principle](#as-code-principle)
- [How to Collaborate](#how-to-collaborate)
  - [For Researchers](#for-researchers)
  - [For Ethicists & Policy Researchers](#for-ethicists--policy-researchers)
  - [For Experimentalists](#for-experimentalists)
  - [For Engineers](#for-engineers)
- [Interactive Features (HTML Whitepaper)](#interactive-features-html-whitepaper)
- [Security](#security)
- [Key Files Outside This Directory](#key-files-outside-this-directory)
- [Citation](#citation)

---

## Quick Start

### Prerequisites

```bash
python >= 3.10
pip install numpy pandas matplotlib plotly scipy
pip install quarto  # Or install Quarto CLI: https://quarto.org/docs/get-started/
```

Optional (for real EEG data validation):
```bash
pip install pyedflib  # PhysioNet EEGBCI dataset support
```

### Render the Whitepaper

```bash
cd whitepaper/

# HTML (immersive 3D experience with interactive Plotly figures)
quarto render index.qmd --to html

# PDF (static matplotlib figures, academic format)
quarto render index.qmd --to pdf

# Both
quarto render index.qmd
```

The rendered output lands in `whitepaper/_output/`.

### Run Equation Tests

```bash
cd qif-lab/
python -m pytest tests/ -v
```

---

## Architecture

```
qif-lab/
├── src/                        # Source of truth for all QIF equations
│   ├── config.py               # Constants, thresholds, layer definitions, scenarios
│   ├── qif_equations.py        # All QIF equations (coherence, QI candidates, tunneling, entropy)
│   ├── synthetic_data.py       # Synthetic + BrainFlow data generators
│   ├── real_data.py            # PhysioNet EEGBCI real data pipeline
│   ├── figures.py              # Centralized figure generation
│   ├── visualizations.py       # Visualization utilities
│   └── bib_generator.py        # Bibliography generation
│
├── tests/                      # Equation validation test suite
│
├── whitepaper/                 # Quarto project — the rendered whitepaper
│   ├── _quarto.yml             # Build config (HTML + PDF)
│   ├── index.qmd               # Main document (all figures inline)
│   ├── qif-whitepaper.qmd      # Consolidated master document
│   ├── chapters/               # Individual chapter .qmd files
│   │   ├── 01-introduction.qmd
│   │   ├── ...
│   │   ├── 07-qi-equation.qmd  # Sensitivity analysis, heatmaps
│   │   ├── 12-experiments.qmd  # Real EEG validation
│   │   └── 16-encyclopedia.qmd
│   ├── qif-immersive.css       # 3D visual effects (9 effects)
│   ├── qif-immersive.js        # Scroll engine, dictation, interactivity
│   ├── qif-head-includes.html  # CSP headers, Plotly CDN with SRI
│   ├── styles.css              # Base theme overrides
│   └── references.bib          # Bibliography
│
└── README.md                   # This file
```

### As-Code Principle

**Everything is generated from code. Nothing is hardcoded.**

| Layer | Source | Consumers |
|-------|--------|-----------|
| **Constants** | `config.py` | All equations, all figures, all tables |
| **Equations** | `qif_equations.py` | Whitepaper figures, test suite, blog posts |
| **Figures** | `.qmd` Python blocks | HTML whitepaper (Plotly), PDF whitepaper (matplotlib) |
| **Tables** | `.qmd` Python blocks | Both formats |
| **Theme** | `qif-immersive.css` | HTML only |

**Change flow:** `config.py` or `qif_equations.py` -> `quarto render` -> updated whitepaper.

---

## How to Collaborate

### For Researchers

1. **Fork the repo** and clone locally
2. **Read `QIF-TRUTH.md`** — the canonical source of truth for all equations and validated values
3. **Modify equations** in `src/qif_equations.py` (not in the .qmd files)
4. **Run tests** to validate: `python -m pytest tests/ -v`
5. **Re-render** the whitepaper: `quarto render index.qmd --to html`
6. **Submit a PR** with your changes, test results, and reasoning

### For Ethicists & Policy Researchers

See **`QIF-NEUROETHICS.md`** — a living document of open ethical questions raised by the framework, particularly around quantum biometric governance and regulatory gaps. Contributions to the ethics questions are welcome.

### For Experimentalists

The framework makes **5 testable predictions** (see whitepaper Section: Experimental Predictions):

1. Ion channel tunneling profiles are unique per individual
2. 1kHz+ BCI sampling stabilizes quantum coherence (Zeno-BCI)
3. Davydov solitons generated by THz radiation
4. Decoherence at BCI interface is measurable
5. QI score drops under quantum-level attack

If you can test any of these, we want to hear from you.

### For Engineers

- **Add scenarios** to `src/synthetic_data.py` (new attack types, new brain states)
- **Add equations** to `src/qif_equations.py` (new quantum phenomena, new classical metrics)
- **Add visualizations** to `src/figures.py` or directly in chapter .qmd files

---

## Interactive Features (HTML Whitepaper)

The HTML whitepaper includes an immersive reading experience:

| Feature | Description |
|---------|-------------|
| **Interactive Plotly figures** | Hover for values, zoom/pan, click legend to toggle, 3D rotation on surface plots |
| **Curved monitor effect** | Subtle barrel distortion on scroll — ultrawide display feel |
| **Aurora gradient background** | Animated gradient mesh that shifts with scroll position |
| **Glassmorphism UI** | Frosted glass callouts, tables, and code blocks |
| **Floating particles** | 15 CSS-animated translucent orbs in background |
| **Depth-of-field blur** | Top/bottom viewport blur — camera lens feel |
| **Section reveals** | Sections fade in on scroll (IntersectionObserver) |
| **AI dictation** | Toggle speech synthesis to read sections aloud (Alt+D) |
| **Noise texture** | SVG film grain overlay for analog depth |

All effects respect `prefers-reduced-motion`. PDF output is unaffected.

---

## Security

- **CSP headers** on all HTML output (Content Security Policy)
- **SRI hashes** on all CDN dependencies (Subresource Integrity)
- **No innerHTML** in JavaScript — all DOM via createElement/textContent
- **No eval()** — zero dynamic code execution
- **Privacy disclosure** on dictation feature (some browsers use cloud TTS)

---

## Key Files Outside This Directory

| File | Location | Purpose |
|------|----------|---------|
| **QIF-TRUTH.md** | `../QIF-TRUTH.md` | Canonical equations and validated values |
| **QIF-NEUROETHICS.md** | `../QIF-NEUROETHICS.md` | Running ethics questions and thesis foundation |
| **PROPAGATION.md** | `../PROPAGATION.md` | Change protocol and sync map |
| **QIF-DERIVATION-LOG.md** | `../QIF-DERIVATION-LOG.md` | Chronological research journal |

---

## Citation

```bibtex
@misc{qi2026qif,
  author = {Qi, Kevin and Claude (Anthropic)},
  title = {QIF: Quantum Indeterministic Framework for Neural Security},
  year = {2026},
  url = {https://github.com/qinnovates/mindloft},
  note = {Working draft}
}
```

---

*Built by Kevin Qi — Qinnovate*
