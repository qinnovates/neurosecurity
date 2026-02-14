# Awesome-BCI Tools Review for ONI Framework

> **Reviewed:** 2026-01-25
> **Source:** https://github.com/NeuroTechX/awesome-bci
> **Purpose:** Identify tools for potential adoption in ONI security research

---

## Executive Summary

The NeuroTechX awesome-bci repository contains 100+ resources across software, hardware, datasets, and educational materials. This review identifies tools most relevant for ONI Framework security research and TARA platform integration.

---

## High Priority for Adoption

### Already Integrated ✅

| Tool | Status | ONI Component |
|------|--------|---------------|
| **MOABB** | ✅ Integrated | `tara_mvp/data/moabb_adapter.py` |
| **MNE-Python** | ✅ Dependency | Signal processing in TARA |

### Recommended for Integration

| Tool | Priority | Use Case | Integration Path |
|------|----------|----------|------------------|
| **BrainFlow** | High | Multi-device streaming, hardware abstraction | Add `BrainFlowAdapter` to `tara_mvp/data/` |
| **Lab Streaming Layer (LSL)** | High | Real-time data protocol, multi-source sync | Standard protocol for TARA input |
| **pyRiemann** | Medium | Riemannian geometry for EEG, covariance matrices | Enhance coherence metric with geometric methods |
| **Braindecode** | Medium | Deep learning for EEG, adversarial ML testing | Attack simulation, ML-based detection |

---

## Tool Analysis by Category

### Signal Processing & Analysis

| Tool | Description | Security Relevance |
|------|-------------|-------------------|
| **MNE-Python** | Comprehensive neuroimaging analysis | Baseline signal processing, artifact detection |
| **pyRiemann** | Riemannian geometry classification | Novel coherence metrics, anomaly detection |
| **Braindecode** | Deep learning for raw EEG | Adversarial ML research, attack detection |
| **BioSPPy** | Biosignal processing toolkit | Physiological signal validation |

**Recommendation:** pyRiemann's covariance-based methods could enhance Cₛ calculation for multi-channel coherence.

### Data Acquisition & Streaming

| Tool | Description | Security Relevance |
|------|-------------|-------------------|
| **BrainFlow** | Universal API for biosensors | Hardware abstraction for TARA |
| **Lab Streaming Layer** | Real-time streaming protocol | Protocol security analysis, data integrity |
| **Timeflux** | Real-time biosignal processing | Stream-based attack detection |
| **OpenViBE** | BCI design platform | Protocol fuzzing, integration testing |

**Recommendation:** BrainFlow provides unified access to OpenBCI, Muse, Emotiv, and other devices - critical for hardware validation of ONI concepts.

### Datasets for Security Research

| Dataset | Description | Security Use Case |
|---------|-------------|-------------------|
| **Temple University EEG** | Large clinical EEG corpus | Baseline normal patterns, anomaly thresholds |
| **PhysioNet** | Multi-modal physiological data | Cross-domain validation |
| **MindBigData** | EEG during visual tasks | Cognitive state modeling |
| **BNCI Horizon** | BCI competition datasets | Benchmark attack detection |

**Recommendation:** Temple University EEG provides clinical-scale data for training robust anomaly detectors.

### Hardware Platforms

| Platform | Type | ONI Validation Use |
|----------|------|-------------------|
| **OpenBCI** | Open-source, hackable | Primary validation platform (already planned) |
| **Muse** | Consumer, Bluetooth | Wireless protocol security testing |
| **Emotiv** | Consumer/research | Multi-channel validation |
| **Neurosity Crown** | Developer-focused | Modern BCI security patterns |

**Recommendation:** OpenBCI remains the primary target. Muse adds Bluetooth vulnerability research.

### Communication Protocols

| Protocol | Description | Security Analysis |
|----------|-------------|-------------------|
| **LSL** | Lab Streaming Layer | Time-sync attacks, stream injection |
| **OSC** | Open Sound Control | UDP-based, no authentication |
| **FieldTrip buffer** | Real-time data sharing | Buffer overflow, injection points |

**Recommendation:** Protocol security analysis should cover LSL (most common) and OSC (least secure).

---

## Integration Roadmap

### Phase 1: Data Layer Enhancement

```
tara_mvp/data/
├── moabb_adapter.py      # ✅ Done
├── brainflow_adapter.py  # 🔲 Add BrainFlow support
├── lsl_adapter.py        # 🔲 Add LSL streaming
└── dataset_registry.py   # 🔲 Registry for all datasets
```

### Phase 2: Analysis Enhancement

```
tara_mvp/analysis/
├── riemannian/           # 🔲 pyRiemann integration
│   └── covariance.py     # Covariance-based coherence
├── ml/                   # 🔲 Braindecode integration
│   └── adversarial.py    # Adversarial attack testing
└── protocols/            # 🔲 Protocol analysis
    └── lsl_security.py   # LSL vulnerability scanner
```

### Phase 3: Hardware Validation

```
oni-openbci/              # 🔲 Planned package
├── realtime_cs.py        # Real-time Cₛ on OpenBCI
├── muse_bluetooth.py     # Muse Bluetooth testing
└── protocol_fuzzer.py    # BCI protocol fuzzing
```

---

## Security-Specific Tools Gap Analysis

| Capability Needed | Available Tool | Gap |
|-------------------|----------------|-----|
| Signal injection testing | None found | Build in TARA |
| Protocol fuzzing | Generic fuzzers | BCI-specific needed |
| Coherence validation | None | ONI's Cₛ metric |
| Neural firewall | None | ONI's contribution |
| Privacy filtering | None open-source | ONI's BCIAnonymizer |

**Key Insight:** The BCI community has excellent signal processing tools but minimal security-focused tooling. ONI fills a critical gap.

---

## Recommended Next Steps

1. **Immediate:** Add BrainFlow adapter to TARA for hardware support
2. **Short-term:** Integrate LSL for real-time streaming protocol
3. **Medium-term:** Add pyRiemann for enhanced coherence metrics
4. **Research:** Use Braindecode for adversarial ML attack simulation
5. **Validation:** Download Temple University EEG for anomaly baseline

---

## Tools NOT Recommended

| Tool | Reason |
|------|--------|
| BCI2000 | C++ based, poor Python integration |
| BCILab | MATLAB dependency, license issues |
| Commercial SDKs | Closed source, can't validate security |

---

## References

- NeuroTechX awesome-bci: https://github.com/NeuroTechX/awesome-bci
- BrainFlow: https://brainflow.org/
- Lab Streaming Layer: https://github.com/sccn/labstreaminglayer
- pyRiemann: https://pyriemann.readthedocs.io/
- Braindecode: https://braindecode.org/

---

*Reviewed by: Claude Opus 4.5*
*For: ONI Framework / TARA Stack*
