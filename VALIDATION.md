# Validation Status

**Last updated:** 2026-02-21
**Source of truth:** [`shared/validation-registry.json`](shared/validation-registry.json)
**Machine-readable:** [`/api/validation.json`](https://qinnovate.com/api/validation.json) (after build)

---

## Summary

| Tier | Count | Description |
|------|-------|-------------|
| Simulation | 7 | Tested against synthetic data or simulated environments |
| Independent Validation | 2 | Verified by independent code or third-party tool |
| Coordinated Disclosure | 1 | Confirmed through responsible disclosure |
| Analytical Review | 1 | Systematic constraint/logic review |
| Cross-AI Verification | 1 | Independently verified by multiple AI systems |
| Clinical / IRB | 0 | Not yet tested on human subjects |
| Real Hardware | 0 | Not yet tested on physical BCI equipment |

**9 components tested. 6 components not yet tested. 0 on real hardware or human subjects.**

---

## Tested Components

### VAL-001: Neurowall Coherence Monitor {#val-001}

**Tiers:** Simulation, Independent Validation
**Status:** PASS
**Date:** 2026-02-15

**Methodology:** Simulated 14 distinct attack patterns against the coherence monitoring pipeline. Each attack tested with 50 independent runs to establish statistical significance.

**Results:**
- 15-second window: 11/14 attack types detected (78.6%)
- 20-second window: 9/9 tested attack types detected (100%)
- 50-run stats: mean detection latency, false positive rate, confidence intervals computed
- Zero false positives across all 50-run batches at 20s window

**Limitations:**
- All tests used synthetic EEG data, not real brain signals
- Attack patterns are theoretical, not from actual adversaries
- Detection window trade-off: faster detection = lower accuracy

**Source:** [`tools/neurowall/`](tools/neurowall/)

---

### VAL-002: BrainFlow Independent Validation {#val-002}

**Tiers:** Independent Validation, Simulation
**Status:** PASS
**Date:** 2026-02-15

**Methodology:** Independent validation using BrainFlow SDK to generate synthetic multi-channel EEG. Coherence analysis pipeline tested across 16 channels simultaneously.

**Results:**
- 16-channel simultaneous monitoring: all channels processed correctly
- 100% detection rate for injected anomalies
- 0% false positive rate on clean synthetic signals
- BrainFlow SDK confirmed as viable real-hardware integration path

**Limitations:**
- BrainFlow synthetic board, not real EEG hardware
- Single session duration, not long-term stability tested
- 16 channels is below clinical-grade density (64-256 channels)

**Source:** [`tools/neurowall/`](tools/neurowall/)

---

### VAL-003: NSP Transport Pipeline {#val-003}

**Tiers:** Simulation
**Status:** PASS
**Date:** 2026-02-10

**Methodology:** End-to-end simulation of the NSP transport layer including ML-KEM-768 key exchange, AES-256-GCM-SIV encryption, frame serialization, and payload compression benchmarks.

**Results:**
- Round-trip encrypt/decrypt: PASS (all test vectors)
- 65-90% compression ratio depending on signal type
- Frame format serialization/deserialization: PASS
- Post-quantum key exchange simulation: PASS

**Limitations:**
- Software simulation only, not tested on implant-class hardware (ARM Cortex-M4)
- Latency benchmarks are desktop-class, not embedded
- No real BCI data streams tested

**Source:** [`qif-framework/nsp/nsp-core/`](qif-framework/nsp/nsp-core/)

---

### VAL-004: NISS Scoring Engine {#val-004}

**Tiers:** Simulation
**Status:** PASS
**Date:** 2026-02-08

**Methodology:** All 103 TARA techniques scored through the NISS engine. Verified severity escalation, PINS flag triggers, and context profile weight shifts.

**Results:**
- 103/103 techniques scored without errors
- PINS flag correctly triggered for all qualifying techniques
- Severity thresholds verified
- Context profiles shift weights correctly

**Limitations:**
- No external NISS implementation to compare against
- Clinical appropriateness of score magnitudes not validated by clinicians
- Equal-weight default assumption untested against real BCI incident data

**Source:** [`qif-framework/NISS-v1.0-SPEC.md`](qif-framework/NISS-v1.0-SPEC.md), [`shared/qtara-registrar.json`](shared/qtara-registrar.json)

---

### VAL-005: L1 Signal Boundary {#val-005}

**Tiers:** Simulation
**Status:** PASS
**Date:** 2026-02-12

**Methodology:** Simulated the S1 (Analog) band boundary conditions: 50/60 Hz notch filtering, electrode impedance monitoring, and signal amplitude guards.

**Results:**
- Notch filters: 50/60 Hz rejection verified at -40dB
- Impedance guard: drift detection triggers at configured threshold
- Signal amplitude clipping: out-of-range values rejected
- Baseline coherence maintained through filtering pipeline

**Limitations:**
- Simulated signals, not real electrode recordings
- No tissue-electrode interface modeling
- Single-channel validation only

**Related TARA techniques:** QIF-T0001, QIF-T0003, QIF-T0005

**Source:** [`qif-framework/`](qif-framework/)

---

### VAL-006: BCI Streaming Protocol Vulnerability {#val-006}

**Tiers:** Coordinated Disclosure
**Status:** CONFIRMED
**Date:** 2026-02-11

**Methodology:** Protocol analysis of a widely-used open-source BCI streaming library revealed missing authentication, encryption, and integrity verification. PoC developed and tested.

**Results:**
- Vulnerability confirmed in protocol design
- PoC demonstrates unauthenticated stream injection
- Coordinated disclosure initiated with maintainers
- Details withheld pending vendor response

**Limitations:**
- PoC tested against software implementation, not clinical deployment
- Impact assessment is theoretical for clinical BCI contexts
- Awaiting vendor response for severity classification

**Related TARA techniques:** QIF-T0001

---

### VAL-007: Physics Security Guardrails {#val-007}

**Tiers:** Analytical Review, Cross-AI Verification
**Status:** PASS
**Date:** 2026-02-18

This is the most architecturally significant validation result. The guardrails document derives BCI security controls from physics first principles rather than policy decisions.

**Methodology:** Systematic derivation of security guardrails from physics equations (thermodynamics, electromagnetism, information theory). Each constraint cross-verified by multiple AI systems. Architecture reviewed for internal consistency and completeness.

**Results:**
- 12/13 constraint equations verified as physically sound
- 4-layer architecture derived: Physics Boundary, Signal Integrity, Anomaly Detection, Protocol Enforcement
- 1 constraint (mechanical mismatch epsilon_safe) flagged as requiring empirical calibration
- Cross-AI verification: Claude and Gemini independently confirmed constraint derivations
- No published equivalent found (literature gap confirmed)

**Limitations:**
- Analytical derivation, not empirical validation
- Constraint parameters need calibration against real BCI hardware
- Architecture is concept design, not implemented
- Cross-AI verification does not substitute for peer review

**Source:** [`qif-framework/qif-sec-guardrails.md`](qif-framework/qif-sec-guardrails.md)

---

### VAL-008: Fact-Checking Pipeline {#val-008}

**Tiers:** Simulation
**Status:** PASS (with issues)
**Date:** 2026-02-21

**Methodology:** Automated pipeline resolves DOIs, arXiv references, and hyperlinks. Searches Crossref for named citations. Run against all 20 field journal blog posts.

**Results:**
- 19/20 posts passed (fact_checked: true)
- 1 failure: Entry 011 dead URL
- 59 warnings: unsourced numerical claims (expected for personal journal entries)
- All DOIs and arXiv references resolved successfully

**Limitations:**
- Cannot verify claims that lack citations
- Crossref search uses fuzzy matching
- Pipeline verifies link liveness, not claim accuracy

**Source:** [`scripts/verify/fact_check_field_journal.py`](scripts/verify/fact_check_field_journal.py)

---

### VAL-009: Citation Verification {#val-009}

**Tiers:** Simulation
**Status:** PASS
**Date:** 2026-02-12

**Methodology:** Manual and automated verification of all citations in the Zenodo preprint. Every DOI resolved via Crossref API. Triggered after Dr. Schroder flagged a fabricated citation.

**Results:**
- 3 fabricated AI-hallucinated citations identified and removed
- 3 wrong author lists corrected
- All remaining citations verified via DOI resolution
- Verification protocol now mandatory for all future publications

**Limitations:**
- Caught after publication (v1.0), not before
- Manual process, not fully automated
- Only covers DOI-resolvable references

**Source:** [`scripts/verify/verify_citations.py`](scripts/verify/verify_citations.py), [`paper/references.bib`](paper/references.bib)

---

## Not Yet Tested

These components require resources beyond what a solo researcher can provide. They are listed here for transparency.

| Component | Why Not Tested | What's Needed |
|-----------|---------------|---------------|
| NISS Clinical Validation | Requires clinician review against real BCI incident data | Clinical BCI experts, incident database, IRB approval |
| DSM-5-TR Diagnostic Mappings | 103 mappings need clinical psychiatrist review | Psychiatrist with BCI experience, case study data |
| BCI Limits Equation | Novel integration of established physics; hypothesis status | BCI hardware lab, multi-site measurements, peer review |
| NSP on Real Hardware | Protocol tested in software only | ARM Cortex-M4 dev board, real-time latency measurement, power profiling |
| Real EEG Validation | All coherence monitoring uses synthetic signals | EEG equipment, IRB approval, baseline recording protocol |
| Real BCI Attack Testing | All attack patterns are theoretical models | BCI hardware, controlled lab, IRB + security ethics approval |

---

## Validation Tiers

| Tier | What It Means |
|------|---------------|
| **Simulation** | Tested against synthetic data or simulated environments. The most common tier for solo research. |
| **Independent Validation** | Verified by independent code, separate implementation, or third-party tool (e.g., BrainFlow). |
| **Coordinated Disclosure** | Vulnerability confirmed through responsible disclosure to the affected vendor. |
| **Analytical Review** | Systematic review of constraints, equations, or logic. Not empirical but rigorous. |
| **Cross-AI Verification** | Independently verified by multiple AI systems. Useful for constraint checking but does not replace peer review. |
| **Clinical / IRB** | Tested on real human subjects with IRB approval. None of this project's work has reached this tier. |
| **Real Hardware** | Tested on physical BCI hardware or real EEG equipment. None of this project's work has reached this tier. |

---

*This document is generated from [`shared/validation-registry.json`](shared/validation-registry.json). For the interactive dashboard, visit [qinnovate.com/validation](https://qinnovate.com/validation/).*
