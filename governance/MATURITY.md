---
title: "Research Maturity & Opportunities"
description: "What has been built, what remains unvalidated, and where collaborators can contribute."
order: 10
---

# Research Maturity & Opportunities

> This page tracks what QIF has built, what it has NOT yet done, and where collaborators can contribute. Items listed here are opportunistic — they represent work that becomes possible when the right expertise, resources, or partnerships are available. Nothing here is claimed as complete.

## How to Read This Page

- **Built** = implemented and available in the current release
- **Simulated** = tested in software only; hardware/clinical validation pending
- **Proposed** = documented but not independently reviewed or adopted
- **Opportunity** = identified work requiring specific expertise or resources the project does not currently have

---

## Validation Maturity

What has been tested, how, and what has not.

| Component | Validation Level | What's Missing |
|-----------|-----------------|----------------|
| Neurowall coherence monitor | Simulated (50-run stats, 0% FPR) | Real EEG data, real hardware, IRB approval |
| BrainFlow integration | Independent library validation | Real BCI device streams |
| Physics security guardrails | Analytical + cross-AI review | Experimental physics validation |
| LSL protocol vulnerability | Responsibly disclosed to maintainers | Maintainer fix (acknowledged as "by design") |
| NSP transport | Round-trip simulation PASS | Hardware transport on embedded MCU |
| NISS scoring engine | 109/109 techniques scored correctly | Clinician review of score magnitudes |
| Citation verification | 3 fabricated citations caught in v1.0 | Ongoing for all new sources |
| DSM-5-TR mappings | Literature-derived | Clinical psychiatrist validation |
| BCI Limits equation | Hypothesis only | Physics lab, multi-site measurements |
| Real adversarial attacks | Not tested | BCI hardware, controlled lab, IRB + ethics |
| NISS clinical appropriateness | Not tested | Clinical BCI experts, incident database |

---

## Standards & Policy Opportunities

Proposals documented but not yet submitted or adopted. Each requires engagement with the target organization.

| Opportunity | Target | What Exists | What's Needed | Realistic Horizon |
|-------------|--------|-------------|---------------|-------------------|
| NISS as CVSS v4.0 extension | FIRST.org CVSS SIG | Full specification, 109 scored techniques | SIG meeting response, formal review | SIG: 2027-28; Spec: 2030+ |
| Neural threat techniques for ATT&CK | MITRE | 109 TARA techniques with MITRE-compatible IDs | Community contribution process evaluation | Evaluation: 2026-28; Sub-matrix: 2029+ |
| BCI security community profile | NIST CSF 2.0 | Policy proposal with gap analysis | Working group formation | WG: 2026-27; Profile: 2028-30 |
| BCI cybersecurity working group | IEEE Brain Initiative | Neurorights operationalization (4 rights mapped to NISS metrics) | Academic partnership, WG formation | WG: 2027-28; Standard: 2030+ |
| Neural device cybersecurity guidance | FDA/CDRH | Section 524B gap analysis | Regulatory engagement | Guidance: 2027-28; Update: 2029+ |
| Technical implementation annex | UNESCO | Alignment analysis with 2025 Neurotechnology Recommendation | Partnership with technical standards body | Partnership: 2027-28; Annex: 2030+ |

---

## Hardware Implementation Opportunities

The Neurowall development pipeline has 4 phases. Phases 0-1 are complete (simulation). Phases 2-4 require hardware.

| Phase | Status | What's Needed | Estimated Cost |
|-------|--------|---------------|----------------|
| Phase 0: Foundation (NSP Rust, Runemate Forge) | Complete | -- | -- |
| Phase 1: Simulation (Neurowall sim.py v0.8) | Complete | -- | -- |
| Phase 2: Lab Bench (nRF5340 + UART) | Next | nRF5340 DK, Saleae Logic 8, Nordic PPK2 | ~$275 |
| Phase 3: Wearable Prototype (NXP i.MX RT685 + BLE) | Planned | Hardware, OpenBCI Cyton Daisy, 8-12 weeks dev | ~$800 |
| Phase 4: Human Validation | Planned | IRB approval, BCI research lab partnership, clinical expertise | Partnership-dependent |

### Phase 2 Deliverables (Opportunistic)
- ML-KEM handshake over UART on nRF5340
- AES-256-GCM-SIV frame encryption on Cortex-M33
- Delta+LZ4 compression in 4KB SRAM
- Runemate Scribe minimal interpreter on-chip
- L1 SSVEP notch filter + L2 Local-DP on real MCU
- 250Hz processing cadence without frame drops

### Phase 3 Deliverables (Opportunistic)
- Real BLE transport with ML-KEM key exchange
- SPHINCS+ key rotation proof of concept
- OpenBCI Cyton Daisy dry EEG sensor input
- Power profiling (target: < 5% of 40mW budget)

---

## Clinical Validation Opportunities

These mappings exist as research artifacts. Clinical validation requires domain expertise.

| Mapping | Current Basis | What's Needed for Validation |
|---------|--------------|------------------------------|
| 109 TARA technique-to-therapy pairs | Published literature review | Clinical neuroscientist review, interrater reliability study |
| DSM-5-TR diagnostic category references | Literature-derived, for threat modeling only | Clinical psychiatrist panel review |
| Neural Impact Chain (signal to outcome) | Proposed model, not a diagnostic tool | Empirical testing against real BCI incident data |
| Dual-use classification (75% therapeutic overlap) | FDA status + published evidence levels | Independent clinical audit |
| Neurowall detection thresholds | Synthetic signals, 50-run Monte Carlo | Recorded EEG datasets (PhysioNet, MNE-Python), then real subjects |

---

## Academic Partnership Opportunities

Identified researchers and labs whose published work intersects with QIF. Outreach is staged by readiness.

| Priority | Who | Connection | Trigger |
|----------|-----|------------|---------|
| Tier 1 | Ming et al. (Tsinghua) | SSVEP BCI above CFF threshold; QIF built T0103 on their finding | Working paper on arXiv |
| Tier 1 | Upadhayay & Behzadan (UNH SAIL Lab) | Sensory-channel manipulation attacks | Working paper on arXiv |
| Tier 2 | FIRST CVSS SIG | NISS extends CVSS with 6 neural metrics | SIG meeting response |
| Tier 2 | IEEE SA | Neurorights operationalization for P2794, P2731 | After arXiv + CVSS SIG traction |
| Tier 3 | Bian, Meng & Wu (Chinese Academy of Sciences) | Square wave injection attack | Neurowall hardware validation |
| Tier 3 | Graz BCI Conference (TU Graz) | Annual BCI clinical research conference | Conference submission |
| Tier 4 | Yuste Lab (Columbia), NeuroRights Foundation | Neurorights policy | Long-term collaboration |
| Tier 4 | Bellare-Rogaway formal methods community | NSP handshake security proofs | NSP hardware implementation |

---

## Governance Documents: Maturity Status

| Document | Status | Peer Reviewed | Adopted |
|----------|--------|--------------|---------|
| Code of Conduct | Published | No | Internal only |
| Transparency Statement | Published, audit trail active | No | Internal only |
| Data Policy FAQ | Drafted | No | No |
| Accessibility Requirements | Partially implemented | No | No |
| Informed Consent Framework | Published | No | No |
| Pediatric Considerations | Published | No | No |
| Post-Deployment Ethics | Published | No | No |
| Neurosecurity Governance | Published | No | No |
| Policy Proposal (6 recommendations) | Published, v1.2 | No | No |
| QIF Neuroethics Position | Published | No | No |

All governance documents are initial drafts synthesized by the author with AI assistance. None have been independently reviewed by ethicists, legal experts, or policy specialists. They represent starting positions for discussion, not adopted standards.

---

## Open Research Questions

Foundational questions identified through the research process. Each represents a potential thesis chapter or collaborative research project.

1. **Quantum Biometric Governance** — Who holds your quantum neural identity? Can it be revoked? (Physically: no.)
2. **AI Custodianship of Neural Data** — What governance prevents AI systems processing neural data from being compromised?
3. **Cognitive Liberty vs. Security Monitoring** — How do we guarantee security monitoring cannot become surveillance?
4. **Pediatric Neural Data** — Does neural biometric change as children develop? Can parents consent on behalf of minors?
5. **Cross-Border Neural Data Sovereignty** — How do existing sovereignty frameworks handle continuous cross-border neural data flows?
6. **Neural Data Discrimination** — Prevention of insurance, employment, or social discrimination based on neural biometrics.
7. **Informed Consent for Irreversible Measurement** — Can patients meaningfully consent to measurements that irreversibly alter quantum states?
8. **Post-Mortem Neural Data** — Who inherits neural data when a BCI user dies?
9. **Decoherence Governance Gap** — Regulate proactively (assuming quantum effects are real) or reactively (wait for evidence)?
10. **Signal Integrity Formalization** — Mathematical framework for how physics dimensions combine into a composite coherence metric. Requires collaboration with physicists.

---

## How to Contribute

If any of these opportunities match your expertise:

- **Clinicians / Neuroscientists:** Clinical validation of TARA mappings, DSM-5-TR references, NISS score magnitudes
- **Security Researchers:** Adversarial BCI testing, NSP formal verification, Neurowall evasion analysis
- **Policy / Ethics Experts:** Governance document review, regulatory engagement, neurorights operationalization
- **Hardware Engineers:** Embedded implementation (nRF5340, NXP i.MX RT685), power profiling, BLE transport
- **Physicists:** BCI Limits equation validation, signal integrity formalization, decoherence measurements

Contact: [GitHub Issues](https://github.com/qinnovates/qinnovate/issues)

---

*Last updated: 2026-03-06. This page is maintained as a living document.*
