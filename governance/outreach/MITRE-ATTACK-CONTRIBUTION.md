---
title: "MITRE ATT&CK Contribution Strategy: BCI Threat Techniques"
description: "Phased contribution strategy for submitting BCI threat techniques to MITRE ATT&CK, ATLAS, and CWE."
order: 50
---

# MITRE ATT&CK Contribution Strategy: BCI Threat Techniques

**Version:** 1.0
**Date:** 2026-02-27
**Author:** Kevin Qi (Qinnovate)
**Status:** Draft — pre-submission

---

## Executive Summary

Brain-computer interfaces are cyber-physical systems with no representation in MITRE ATT&CK, ATLAS, or CWE. This document outlines a phased contribution strategy targeting three MITRE programs, with five literature-grounded techniques as initial candidates.

**Key constraint:** Core ATT&CK requires observed real-world adversary behavior. No documented BCI cyberattack has occurred in the wild. Therefore, direct technique submission to Enterprise or ICS ATT&CK is premature. The viable paths are ATLAS (accepts research case studies) and CTID (co-develops emerging domains).

---

## Submission Channels

| Channel | Evidence Threshold | BCI Fit | Timeline |
|---------|-------------------|---------|----------|
| **ATT&CK Enterprise/ICS** | Observed real-world adversary use | Not ready — no documented BCI incidents | Long-term (2030+) |
| **MITRE ATLAS** | Research case studies + ML adversarial evidence | Strong — closed-loop BCIs use ML decoders | Near-term (2026-2027) |
| **CTID Research Program** | Industry-sponsored research partnership | Ideal — co-develop BCI domain with manufacturer partner | Medium-term (2027-2029) |
| **ATT&CK ICS (new Asset)** | Documented adversary behavior against asset class | Partial — structural analogy to Safety Controllers | Medium-term (2028+) |

---

## Phase 1: ATLAS Contribution (Near-Term)

### Rationale

MITRE ATLAS (Adversarial Threat Landscape for AI Systems) explicitly accepts research case studies alongside real-world incidents. Closed-loop BCIs use machine learning decoders to translate neural signals into device commands. Adversarial attacks on these decoders — input perturbation, model poisoning, evasion — are legitimate ATLAS contributions.

### Candidate Techniques for ATLAS

#### 1. SSVEP Frequency Hijack (QIF-T0103)

**ATLAS Tactic:** ML Attack Staging → Craft Adversarial Data
**Description:** Imperceptible display flicker (60Hz) drives visual cortex SSVEP responses, injecting false commands into SSVEP-based BCI classifiers without user awareness.

**Published evidence (4 papers):**
- Ming et al. 2023 — "Imperceptible 60Hz SSVEP Stimulation" (*Journal of Neural Engineering*). Demonstrated imperceptible flicker produces classifiable SSVEP at 52.8 bits/min.
- Bian et al. 2022 — "SSVEP Square-Wave Attack Vectors" (*Journal of Neural Engineering*). Mapped SSVEP vulnerability surface.
- Upadhayay & Behzadan 2023 — "Sensory-Channel BCI Attacks via Display Manipulation" (*IEEE SMC Conference*). Generalized attack framework.
- Meng et al. 2024 — "Adversarial Robustness Benchmark for EEG-Based BCIs" (*Future Generation Computer Systems*, DOI: 10.1016/j.future.2023.01.028).

**Why this fits ATLAS:** The attack exploits the ML classifier's dependence on visual stimulus frequency. It is an adversarial input attack that manipulates the feature extraction pipeline — a core ATLAS concern.

#### 2. P300 Side-Channel Extraction (QIF-T0015 / QIF-T0051)

**ATLAS Tactic:** Exfiltration → Infer Training Data
**Description:** Subliminal visual stimuli probe the P300 event-related potential to extract private information (PINs, preferences, identity) from consumer EEG headsets.

**Published evidence:**
- Martinovic et al. 2012 — "On the Feasibility of Side-Channel Attacks with Brain-Computer Interfaces" (*USENIX Security Symposium*, pp. 143-158). Functional PoC on commercial EEG hardware.
- Schroder et al. 2025 — "Cyber Risks to Next-Gen Brain-Computer Interfaces" (*Neuroethics 18*, arXiv:2508.12571).

**Why this fits ATLAS:** The attack infers private data from the ML system's neural signal pipeline — analogous to training data extraction attacks on language models.

#### 3. Calibration Data Poisoning (QIF-T0034)

**ATLAS Tactic:** ML Attack Staging → Poison Training Data
**Description:** Corrupted calibration data causes BCI decoder to learn incorrect neural-to-intent mappings. Leads to misclassification of user intent and potential neuroplastic maladaptation as the brain adapts to the poisoned model.

**Published evidence:**
- Bonaci et al. 2015 — "App Stores for the Brain" (*IEEE Technology and Society Magazine*, DOI: 10.1109/MTS.2015.2425551). Identified calibration as attack surface.
- Meng et al. 2024 — Benchmarked adversarial robustness of EEG classifiers.

**Why this fits ATLAS:** Classic data poisoning attack on a deployed ML system. The BCI decoder is the model; calibration sessions are the training data.

### ATLAS Submission Format

Email to: atlas@mitre.org

```
Subject: [ATLAS] Case Study Submission — Adversarial Attacks on BCI ML Decoders

Case Study Title: [Technique name]
ATLAS Tactic: [Mapped tactic]
ATLAS Technique: [Closest existing or proposed new]

Summary: [2-3 sentences]

Target ML System: Brain-computer interface decoder (EEG classifier)
Attack Type: [Evasion / Poisoning / Inference]
Evidence: [Citations with DOIs]
Impact: [What the attacker gains]
Mitigations: [Known defenses]

Submitted by: Kevin Qi, Qinnovate (qinnovate.com)
```

---

## Phase 2: ICS Asset Proposal (Medium-Term)

### Rationale

BCIs are cyber-physical systems. Compromise causes physical harm, not just data loss. The ICS ATT&CK domain already models this threat pattern through 18 Asset types including Safety Controllers, Field I/O, and Intelligent Electronic Devices.

### Proposed New Asset: Implantable Neural Interface

| Field | Value |
|-------|-------|
| **Asset Name** | Implantable Neural Interface |
| **Description** | Surgically implanted device that records from and/or stimulates neural tissue. Includes cortical electrode arrays, deep brain stimulators, and cochlear implants with digital interfaces. |
| **Sectors** | Healthcare |
| **Related Assets** | Safety Controller (fail-safe requirements), Field I/O (sensor/actuator), IED (programmable parameters) |
| **Platforms** | Embedded firmware (ARM Cortex-M), wireless (BLE, proprietary RF) |

### Structural Analogy

| ICS Concept | BCI Equivalent |
|-------------|----------------|
| Safety Controller | Stimulation safety bounds (charge density limits, frequency caps) |
| Field I/O | Neural signal acquisition (electrodes) + stimulation delivery |
| HMI | Clinical programming interface |
| Engineering Workstation | Research/calibration software |
| PLC program | BCI decoder model (ML classifier) |
| Process variable | Neural signal features (band power, ERP amplitude) |
| Physical consequence of compromise | Seizure, tissue damage, cognitive disruption |

### ICS Tactics Applicable to BCIs

| ICS Tactic | BCI Application |
|------------|----------------|
| Impair Process Control | Manipulate closed-loop stimulation parameters |
| Inhibit Response Function | Block safety interlocks on stimulation amplitude |
| Loss of Safety | Disable charge density limits |
| Loss of Control | Override user intent classification |
| Damage to Property | Neural tissue damage from excess stimulation |

**Prerequisite:** This proposal requires documented adversary interest in medical device compromise. The 2023 CISA ICS-CERT advisories on medical device vulnerabilities (insulin pumps, pacemakers) provide the closest existing evidence base.

---

## Phase 3: CTID Research Partnership (Medium-Term)

### Proposal Concept

Engage MITRE's Center for Threat-Informed Defense (CTID) to co-develop a BCI/neurotechnology threat research program, following the precedent of:
- **Secure AI (2024)** — ATLAS expansion through CTID industry consortium
- **Defending OT with ATT&CK (2024)** — ICS domain extension through CTID research

### What We Bring

| Asset | Detail |
|-------|--------|
| Threat taxonomy | 109 techniques across 8 domains (TARA v1.7) |
| Scoring system | NISS v1.1 — CVSS v4.0 extension with 6 neural metrics |
| STIX 2.1 feed | Machine-readable threat data ([qinnovate.com/api/stix.json](https://qinnovate.com/api/stix.json)) |
| Published research | Zenodo preprint (DOI: 10.5281/zenodo.18640105), 193 verified sources |
| Standards engagement | FIRST.org CVSS SIG member, NISS accepted for CVSS Resources repo |
| Open source | Full framework, scoring engine, and data (Apache 2.0) |

### What We Need

- Industry co-sponsor (BCI manufacturer: Neuralink, Synchron, Paradromics, or Blackrock Neurotech)
- MITRE CTID engagement (research program proposal)
- Academic partner (IRB-approved research environment for empirical validation)

### Outreach Draft

```
To: ctid@mitre.org
Subject: Research Program Proposal — Threat-Informed Defense for Brain-Computer Interfaces

Dear CTID Team,

I am writing to propose a research collaboration on threat-informed defense
for brain-computer interfaces (BCIs). BCIs are a growing category of
cyber-physical medical devices with no representation in ATT&CK, ATLAS, or
any MITRE framework.

We have published an open-source threat taxonomy (TARA, 109 techniques in
STIX 2.1 format) and a CVSS v4.0 scoring extension (NISS, accepted for the
FIRST.org CVSS Resources repository) that together provide a starting
corpus for BCI threat modeling.

The structural analogy to ICS is direct: BCIs are cyber-physical systems
where compromise causes physical harm. The ICS ATT&CK domain's Safety
Controller and Field I/O assets have clear BCI equivalents.

We believe a CTID research program — similar to Secure AI or Defending OT
— could evaluate whether BCI threats warrant representation in ATT&CK,
ATLAS, or a dedicated domain. We are prepared to contribute our taxonomy,
scoring system, and published research as starting material.

Would it be possible to schedule a brief call to discuss whether this
aligns with CTID's research priorities?

Best regards,
Kevin Qi
Qinnovate | qinnovate.com
FIRST.org CVSS SIG Member
```

---

## Five Candidate Techniques — Evidence Summary

| # | QIF ID | Name | Evidence | Citations | Best Channel |
|---|--------|------|----------|-----------|-------------|
| 1 | QIF-T0103 | SSVEP Frequency Hijack | 4 peer-reviewed papers, PoC demonstrated | Ming 2023, Bian 2022, Upadhayay 2023, Meng 2024 | ATLAS |
| 2 | QIF-T0003 | Signal Interception / Eavesdropping | 3 papers, functional PoC | Kohno 2009, Martinovic 2012, Schroder 2025 | ATLAS / ICS |
| 3 | QIF-T0001 | Signal Injection | 2 papers, inferred from tDCS safety data | Kohno 2009, Bonaci 2015 | ICS (Safety Controller) |
| 4 | QIF-T0051 | Neural Data Exfiltration | 2 papers, P300 extraction PoC | Martinovic 2012, Schroder 2025 | ATLAS |
| 5 | QIF-T0034 | Calibration Data Poisoning | 2 papers, adversarial ML benchmark | Bonaci 2015, Meng 2024 | ATLAS |

---

## Pre-Flight Checklist

Before submitting to any MITRE channel:

- [ ] Verify all citations resolve (DOI check via Crossref API)
- [ ] Confirm no existing ATT&CK/ATLAS technique covers the same behavior
- [ ] Email attack@mitre.org or atlas@mitre.org to confirm submission is welcome before writing full package
- [ ] Get ATLAS case study template (if one exists)
- [ ] Review ATLAS existing techniques for closest analogs
- [ ] Consider co-submission with an academic partner for credibility

---

## References

- [MITRE ATT&CK Contribution Process](https://attack.mitre.org/resources/engage-with-attack/contribute/)
- [MITRE ATLAS](https://atlas.mitre.org/)
- [MITRE CTID](https://ctid.mitre.org/)
- [ATT&CK Design and Philosophy (PDF)](https://attack.mitre.org/docs/ATTACK_Design_and_Philosophy_March_2020.pdf)
- [ATT&CK for ICS Design and Philosophy (PDF)](https://attack.mitre.org/docs/ATTACK_for_ICS_Philosophy_March_2020.pdf)
- [ICS Assets](https://attack.mitre.org/assets/)
- [TARA Atlas](https://qinnovate.com/TARA/)
- [NISS Specification](https://qinnovate.com/niss/)
- [QIF Preprint (DOI: 10.5281/zenodo.18640105)](https://doi.org/10.5281/zenodo.18640105)
