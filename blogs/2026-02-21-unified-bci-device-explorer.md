---
title: "Introducing the Unified BCI Device Explorer"
subtitle: "24 devices, 38 brain regions, 13 physics constraints, 103 threat techniques. One searchable interface, one open API."
date: "2026-02-21"
author: "Kevin L. Qi"
tags: ["qif", "bci", "tara", "api", "open-data", "bci-explorer", "research-tools", "niss", "brain-atlas", "physics"]
---

## The Problem

If you want to research BCI security today, you have to piece it together yourself. Device specs are scattered across FDA 510(k) filings, manufacturer marketing pages, and paywalled journal papers. Threat models for neural interfaces don't exist in any structured, machine-readable form. The physics constraints that govern what BCIs can and cannot do are buried across thermodynamics textbooks, electromagnetics references, and neuroscience papers that rarely cite each other.

There is no single place where a researcher, developer, or policymaker can look up a BCI device, see what brain regions it targets, understand what attacks apply to it, check which physics constraints limit its design, and pull all of that into their own analysis.

We built that place.

## What We Built

The [BCI Research Hub](https://qinnovate.com/bci/) is now live at [qinnovate.com/bci](https://qinnovate.com/bci/). It consolidates everything the QIF (Quantum Information Framework) project has catalogued about brain-computer interface hardware, physics constraints, and security into a single, searchable, cross-referenced research tool.

This is not a product page. Every data point links back to its source: FDA filings, manufacturer datasheets, peer-reviewed papers, or the [QIF derivation log](https://qinnovate.com/lab/derivation-log/) where it was first documented. Every number has a confidence level. Every cross-reference is explicit.

The hub has four sections, each addressing a different layer of BCI research. They all feed into a single open API.

## The Four Sections

### 1. Device Explorer

**URL:** [qinnovate.com/bci/explorer](https://qinnovate.com/bci/explorer/)

24 BCI devices catalogued from FDA filings, manufacturer datasheets, and peer-reviewed literature. Each device card includes:

- **Full hardware specs:** electrode type, channel count, sampling rate, data rate, signal bandwidth
- **Modality:** EEG, ECoG, intracortical, fNIRS, TMS, focused ultrasound
- **Invasiveness tier:** non-invasive, minimally invasive, invasive
- **FDA status:** cleared, breakthrough designation, investigational, research-only
- **Target brain regions:** which of the 38 mapped brain structures each device can reach
- **Mapped threat techniques:** which of the 103 TARA techniques apply to this device's QIF band
- **Confidence level:** how well-sourced each data point is (peer-reviewed, manufacturer-stated, inferred)

The explorer is searchable and filterable. You can find all non-invasive EEG devices with 32+ channels, or all invasive devices with FDA breakthrough designation, or all devices that operate in the N1 (electrode-tissue) band of the QIF model.

Devices span the full range: consumer headsets like the Emotiv EPOC X and Muse 2, research-grade systems like the g.tec g.USBamp and ANT Neuro eego, clinical devices like the NeuroPace RNS and Medtronic Percept PC, and cutting-edge implants like Neuralink N1, Synchron Stentrode, and Blackrock MicroPort's Utah Array.

### 2. BCI Limits Equation

**URL:** [qinnovate.com/bci/limits](https://qinnovate.com/bci/limits/)

Before you can secure a BCI, you need to know what physics allows. We synthesized 13 constraints from thermodynamics, electromagnetism, information theory, Moore's Law scaling, and biocompatibility into a unified system that defines the fundamental design envelope for any brain-computer interface.

The 13 constraints are grouped into five categories:

**Thermodynamics & Power:**
- Landauer limit (minimum energy per bit erasure)
- Thermal ceiling (2C max brain temperature rise, Penne bioheat equation)
- On-chip vs. telemetry power trade-off (40 mW implant budget)
- Margolus-Levitin bound (maximum computational speed per unit energy)

**Electromagnetic & Wireless:**
- EM propagation (tissue attenuation at target frequencies)
- Wireless bandwidth (Shannon capacity under neural-safe power limits)

**Scaling & Geometry:**
- Moore's Law scaling (electrode density doubling time ~7.4 years)
- Geometric fit (cortical curvature vs. rigid electrode arrays)
- Information-theoretic ceiling (simultaneous neuron recording limits)

**Safety & Biocompatibility:**
- Shannon electrode safety (charge injection limits per electrode area)
- Mechanical mismatch (brain tissue ~1.5 kPa vs. silicon ~170 GPa)

**Signal & Detection:**
- Boltzmann detectability (minimum detectable signal vs. Johnson-Nyquist noise at 310K)
- QIF coherence floor (minimum signal integrity for meaningful BCI operation)

Each constraint page shows the equation, a plain-English explanation, the physical constant values used, and how it connects to BCI design decisions.

No published paper unifies all 13 of these constraints into a single system. This is original work, documented in [Entry 60 of the QIF Derivation Log](https://github.com/qinnovates/qinnovate/blob/main/qif-framework/QIF-DERIVATION-LOG.md). The system was independently [cross-validated by Gemini 2.5 Pro](https://github.com/qinnovates/qinnovate/blob/main/governance/TRANSPARENCY.md), which verified 12 of 13 constraints as correct and identified 2 corrections (mechanical mismatch ratio inverted, Johnson noise temperature corrected to 310K). Both corrections were applied.

### 3. Security Guardrails

**URL:** [qinnovate.com/bci/guardrails](https://qinnovate.com/bci/guardrails/)

The on-device defense stack that QIF proposes for BCI signal integrity. Four layers:

- **L0: Impedance Guard** - Hardware-level electrode impedance monitoring. Detects physical tampering, electrode degradation, and injection attacks at the analog front-end.
- **L1: Coherence Monitor** - The core of Neurowall. Computes a real-time coherence score (Cs) from phase variance, spectral entropy, and cross-channel correlation. Detects signal injection, spectral manipulation, and feedback loop attacks.
- **L2: Thermal Budget** - Enforces the 2C thermal ceiling from the BCI Limits Equation. Prevents sustained high-power attacks that could cause tissue damage.
- **L3: Protocol Envelope** - NSP (Neural Security Protocol) session validation. Post-quantum key exchange (ML-KEM-768) and signatures (ML-DSA-65) for authenticated neural data transport.

The guardrails page also includes a "What Exists vs. What's New" breakdown showing which defenses are established practice and which are original QIF contributions, along with a six-phase implementation roadmap.

### 4. API Documentation

**URL:** [qinnovate.com/bci/api](https://qinnovate.com/bci/api/)

Full documentation for the unified QIF API, including endpoint details, response structure, usage examples in JavaScript, Python, and curl, and information about legacy endpoints.

## The Unified QIF API

Everything in the BCI Research Hub, plus the full TARA threat registry, brain atlas, scoring specifications, and project timeline, is available through a single open endpoint. No authentication. No rate limits. No API key. CORS enabled for browser-side use.

### Endpoint

```
GET https://qinnovate.com/api/qif.json
```

Full [API documentation](https://qinnovate.com/bci/api/) is available with interactive examples.

### What the API Returns

| Section | Description | Count |
|---------|-------------|-------|
| `hourglass_bands` | QIF 11-band model (N7-N1, I0, S1-S3) | 11 |
| `threats.techniques` | TARA attack/therapeutic techniques | 103 |
| `threats.categories` | Threat categories | 13 |
| `threats.tactics` | MITRE-compatible tactics | 13 |
| `devices.inventory` | BCI hardware with full specs | 24 |
| `brain_atlas.regions` | Mapped brain structures | 38 |
| `brain_atlas.device_mappings` | Device-to-region cross-references | per device |
| `brain_atlas.neural_latency` | Neural pathway timing metrics | per region |
| `physics.constraints` | BCI Limits Equation constraints | 13 |
| `physics.constants` | Verified physical constants | 14 |
| `specs.niss` | Neural Impact Scoring System specification | 1 |
| `specs.tara` | TARA registry specification | 1 |
| `specs.dsm5` | DSM-5-TR diagnostic mapping specification | 1 |
| `timeline` | Project milestones and discoveries | 31 |
| `current_stats` | Live dataset statistics | 1 |

Total payload: ~580 KB. Cached for 1 hour.

### Quick Start

**JavaScript:**
```javascript
const qif = await fetch('https://qinnovate.com/api/qif.json').then(r => r.json());

// All devices with their brain region mappings
qif.devices.inventory.forEach(d => {
  console.log(`${d.name}: ${d.channels}ch ${d.modality}, regions: ${d.regions?.map(r => r.name).join(', ')}`);
});

// Cross-reference: which threats apply to intracortical devices?
const invasiveDevices = qif.devices.inventory.filter(d => d.invasiveness === 'invasive');
const invasiveBands = [...new Set(invasiveDevices.flatMap(d => d.qif_bands))];
const relevantThreats = qif.threats.techniques.filter(t => invasiveBands.includes(t.band));
```

**Python:**
```python
import requests

qif = requests.get('https://qinnovate.com/api/qif.json').json()

# Physics constraints grouped by category
for c in qif['physics']['constraints']:
    print(f"[{c['category']}] {c['name']}: {c['equation']}")

# Devices by FDA status
from collections import Counter
fda = Counter(d.get('fda_status', 'unknown') for d in qif['devices']['inventory'])
print(fda)

# High-severity threats with DSM-5 mappings
for t in qif['threats']['techniques']:
    if t.get('severity') == 'critical':
        print(f"{t['id']}: {t['name']} — DSM-5: {t.get('dsm5_codes', 'unmapped')}")
```

**curl + jq:**
```bash
# Device summary table
curl -s https://qinnovate.com/api/qif.json | \
  jq -r '.devices.inventory[] | [.name, .modality, .channels, .fda_status] | @tsv'

# All physics constraint equations
curl -s https://qinnovate.com/api/qif.json | \
  jq '.physics.constraints[] | {name, equation, category}'

# Project timeline
curl -s https://qinnovate.com/api/qif.json | \
  jq '.timeline[] | "\(.date) [\(.type)] \(.title)"'
```

## How It All Connects

The key design decision behind the BCI Research Hub is cross-referencing. Every dataset shares the same identifiers:

- **QIF band IDs** (N7, N6, N5, N4, N3, N2, N1, I0, S1, S2, S3) link devices to threats to physics constraints. A device operating at band N1 (electrode-tissue interface) faces a specific subset of the 103 TARA techniques, is governed by specific physics constraints (Shannon electrode safety, mechanical mismatch, impedance), and maps to specific brain regions.

- **TARA technique IDs** (QIF-T0001 through QIF-T0103) link threats to devices, brain regions, DSM-5-TR diagnostic codes, neurorights implications, FDORA regulatory coverage, and physics feasibility tiers. Each technique page is at [qinnovate.com/TARA/QIF-T{id}](https://qinnovate.com/TARA/).

- **Brain region mappings** link the 38 structures in the [Brain-BCI Atlas](https://qinnovate.com/atlas/) to specific devices, neural latency metrics, and QIF bands.

This cross-referencing is what makes the dataset useful beyond a simple catalog. You can start from any entry point, a device, a threat, a brain region, a physics constraint, and trace connections across the entire system.

## Related Work

The BCI Research Hub builds on several other QIF components that are also publicly available:

- **[TARA Registry](https://qinnovate.com/TARA/)** - The full 103-technique threat and therapeutic atlas. Each technique has its own page with NISS scoring, DSM-5-TR mappings, neurorights analysis, physics feasibility tier, and FDORA regulatory coverage. The [TARA blog post](https://qinnovate.com/publications/2026-02-09-tara-therapeutic-atlas-of-risks-and-applications/) explains the dual-use reframing.

- **[Brain-BCI Atlas](https://qinnovate.com/atlas/)** - Interactive 3D visualization of 38 brain structures mapped to BCI devices and QIF bands.

- **[QIF Security Model](https://qinnovate.com/security/)** - The 11-band hourglass model, coherence scoring pipeline, and the four-step Map-Score-Protect-Deliver framework.

- **[Neural Security Protocol (NSP)](https://qinnovate.com/nsp/)** - Post-quantum secure transport protocol for neural data. ML-KEM-768 key exchange, ML-DSA-65 signatures, 5-layer defense stack. [Rust implementation](https://github.com/qinnovates/qinnovate/tree/main/qif-framework/nsp/nsp-core) available.

- **[Neurowall](https://qinnovate.com/publications/2026-02-21-neurowall-simulation-results/)** - Signal integrity monitor simulation. 7 of 9 attack types detected at 15 seconds, 9 of 9 at 30 seconds. ROC-optimized operating point: 5% false positive rate, 100% true positive rate at threshold=12, duration=20s.

- **[NISS Scoring](https://qinnovate.com/scoring/)** - The Neural Impact Scoring System that quantifies threat severity across reversibility, detectability, consent violation, and clinical impact dimensions.

- **[DSM-5-TR Psychiatric Mapping](https://qinnovate.com/psychiatric/)** - The Neural Impact Chain that bridges TARA attack techniques to DSM-5-TR diagnostic codes, showing how neural attacks map to potential psychiatric outcomes.

- **[Zenodo Preprint](https://doi.org/10.5281/zenodo.18640105)** - The academic paper (v1.4, 28 pages, 6 figures, CC-BY 4.0) documenting the full QIF framework.

- **[Validation Dashboard](https://qinnovate.com/validation/)** - Live tracking of cross-AI validation sessions, citation verification, and fact-checking status.

## Why Open

BCI security is too important to be locked behind paywalls or proprietary databases. The devices listed in this explorer are being implanted in human brains right now. The attack techniques in TARA are not theoretical, they are grounded in published research with demonstrated feasibility. The physics constraints are laws of nature, not trade secrets.

We compiled it, verified it, cross-referenced it, and put it behind a single GET request with no authentication. The source data is on [GitHub](https://github.com/qinnovates/qinnovate). The API is at [qinnovate.com/api/qif.json](https://qinnovate.com/api/qif.json). The [API documentation](https://qinnovate.com/bci/api/) explains every field.

Use it. Build on it. If you find an error, [open an issue](https://github.com/qinnovates/qinnovate/issues). If you want to add a device or technique, submit a pull request.

## What's Next

- More devices as new FDA filings and peer-reviewed papers come out
- Real-time data feeds from Neurowall simulation runs
- STIX/TAXII format export for integration with existing cybersecurity tooling (already available at [/api/stix.json](https://qinnovate.com/api/stix.json))
- Community contributions via pull request
- Interactive cross-reference explorer (click a device, see its threats, brain regions, and physics constraints in one view)

## A Personal Note

I'm tired but wired right now. I can't fully process what I've been able to build in the span of one month.

Mid-January, I made a commitment to myself: get sober, get serious, make my dreams come true. The first thing I did was draw a mind map. I mapped out my future, what I care about, what gets me excited. Ironically, what I landed on was mapping the mind.

I started with 60 attack techniques in a spreadsheet. One month later: 103 threat techniques mapped to 68 DSM-5 psychiatric diagnoses. 4 neurorights mapped across every technique. 24 BCI devices catalogued from FDA filings and manufacturer datasheets. 38 brain regions cross-referenced to devices and threats. 13 physics constraints unified into a single limits equation. An 11-band hourglass security model derived from scratch. A post-quantum neural security protocol (NSP) implemented in Rust. A coherence monitor (Neurowall) that detects 9 out of 9 attacks at 30 seconds and validated on real EEG hardware. A domain-specific rendering language (Runemate). A peer-reviewed preprint on Zenodo. 9 cross-AI validation sessions. 165 research sources. 70 derivation log entries. 50 blog posts. And now a unified API serving all of it at a single endpoint.

I thought this had taken six weeks. I checked the git log. First commit: February 1. Three weeks. I was wrong by double.

It started with a mind map. I hope it helps science, research, and a whole lot more.

---

*Written with AI assistance (Claude). All claims verified by the author.*
