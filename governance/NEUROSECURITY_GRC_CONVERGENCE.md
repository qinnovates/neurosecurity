---
title: "Neurosecurity GRC Convergence Strategy"
description: "Bridging security GRC and neuroethics into an integrated framework for brain-computer interface governance. Maps existing organizations, identifies the silo, and proposes convergence."
order: 13
---

# Neurosecurity GRC Convergence Strategy

> **Companion to:** [Neurosecurity GRC Gap Derivation](./NEUROSECURITY-GRC.md). That document shows the problem (what's missing). This document shows the solution (who needs to converge and how).

---

## 1. The Problem

No single organization currently bridges cybersecurity governance, risk, and compliance (GRC) with neuroethics for brain-computer interfaces.

On the security side, organizations like NIST, MITRE, and IEC produce world-class frameworks, but none address neural endpoints. On the neuroethics side, UNESCO, the Neurorights Foundation, and the International Neuroethics Society define rights and principles, but none produce technical security controls.

The result: a BCI manufacturer can be FDA-cleared, HIPAA-compliant, and ISO 27001-certified with zero protections against adversarial neurostimulation, neural signal tampering, or cognitive state inference.

| Domain | Key Organizations | What They Produce | What's Missing |
|--------|------------------|-------------------|----------------|
| Security GRC | NIST, ISO/IEC, MITRE, FIRST, IEC 62443 | Frameworks, controls, threat taxonomies, scoring | Neural-specific threat models, BCI security profiles, neural impact metrics |
| Neuroethics | UNESCO, Neurorights Foundation, INS, BCI Society | Rights definitions, ethical principles, policy recommendations | Technical enforcement mechanisms, security controls, audit criteria |
| Medical Device | FDA/CDRH, EU MDR | Safety clearance, manufacturing quality, patching mandates | Neural-specific cybersecurity requirements, threat classification |
| Policy/Legislation | Chile, Colorado, California | Constitutional amendments, privacy laws | Technical standards to operationalize the legislation |

---

## 2. Why the Silo Exists

Five validated reasons explain why security GRC and neuroethics have not converged:

**Tiny community.** Approximately 50 researchers worldwide work on BCI security. The entire field produces roughly 85 papers total. There is not enough critical mass to form joint working groups.

**No breach has occurred.** IT security standards emerged after breaches created urgency (TJX, Heartland, Target for PCI DSS; OPM for federal cybersecurity). BCI security has no equivalent forcing function yet. The LSL vulnerability (disclosed Feb 2026) is the closest, but it affects a research tool, not a clinical implant.

**Market just started.** The first commercial BCIs cleared FDA in 2025. Standardization requires a market to standardize. PCI DSS took 5 years after payment cards went mainstream. The BCI security standards window is opening now.

**Incentive misalignment.** Security researchers view BCIs as niche (too few devices to matter). Neuroethicists view cybersecurity as an implementation detail (not their department). Neither community has professional incentives to cross the boundary.

**Timeline mismatch.** Standards bodies operate on 3-5 year cycles. BCI development moves faster. By the time a standard completes the ISO process, the technology has shifted. This is why QIF is designed as a living framework (continuous updates) rather than a static standard.

---

## 3. Lessons from IT Security

Four precedents show how security standardization succeeds. Each offers a lesson for neurosecurity.

### PCI DSS: Prescriptive Controls Scale Adoption

The payment card industry created PCI DSS without government mandate. Compliance levels scale by transaction volume (Level 1 merchants face full audits; Level 4 does self-assessment). The key insight: prescriptive controls with proportional compliance requirements drove universal adoption.

**Neurosecurity application:** Scale requirements by device invasiveness. An EEG headband (non-invasive, consumer) needs lighter requirements than an intracortical implant (invasive, clinical). QIF's hourglass bands naturally map to compliance tiers.

### MITRE ATT&CK: Open Taxonomy Becomes Shared Language

ATT&CK succeeded because it described what adversaries actually do (techniques), not what vendors sell (products). It is free, open, and community-maintained. Within 5 years it became the universal language for threat intelligence.

**Neurosecurity application:** TARA follows the same model, using MITRE-compatible IDs, an open taxonomy, and technique-level granularity. The BCI security community needs a shared vocabulary before it can coordinate defense.

### NIST CSF: Voluntary Adoption Through Market Pressure

NIST CSF has no legal mandate, yet it is near-universally adopted. Adoption was driven by customers, cyber insurers, and investors requiring CSF alignment as a condition of doing business. The framework succeeded by being useful, not mandatory.

**Neurosecurity application:** Neurosecurity GRC will likely follow the same trajectory. Institutional review boards, research ethics committees, and BCI manufacturers' insurers will drive adoption before any government mandate exists.

### IEC 62443: Physical Interfaces Define Trust Boundaries

IEC 62443 bridged IT and OT security by defining trust boundaries at physical interfaces (zones and conduits) rather than at network layers. This worked because OT environments have fundamentally different physical constraints than IT networks.

**Neurosecurity application:** QIF's hourglass model applies the same principle. The neural interface (I0) is the trust boundary where biology meets silicon. Security controls are defined at this physical interface, not at arbitrary network layers.

---

## 4. Convergence Map

Specific asks for the organizations best positioned to bridge the gap.

### OECD: Connect Your Own Committees

The OECD has both a cybersecurity committee and a neurotechnology committee. They published neurotechnology principles in 2024 and AI principles in 2019. The committees do not collaborate.

**Ask:** Produce a joint working paper connecting cybersecurity governance to neurotechnology principles. A single cross-reference document would be a first.

### IEEE: Produce a BCI Cybersecurity Standard

IEEE SA has P7700 (neurotechnology ethics) and comprehensive cybersecurity standards. No standard bridges them. The IEEE Brain Initiative has working groups in both domains.

**Ask:** Launch a P27XX BCI cybersecurity standard under IEEE Brain, building on P7700 ethics with 802-series security engineering.

### MITRE: Create a Neural ATT&CK Sub-Matrix

ATT&CK has sub-matrices for enterprise, mobile, ICS, and cloud. Neural devices are absent. TARA provides 109 techniques in MITRE-compatible format.

**Ask:** Create an ATT&CK sub-matrix for neural devices. TARA can serve as the seed taxonomy, following the same community contribution model that built the ICS matrix.

### FIRST: Extend CVSS with Neural Impact Metrics

CVSS v4.0 cannot score biological harm, cognitive integrity loss, or reversibility of neural damage. NISS demonstrates what neural-specific scoring dimensions look like.

**Ask:** Add optional neural impact metrics to CVSS, or publish a CVSS supplemental guide for medical/neural devices using NISS as a reference model.

### NIST: Develop a BCI Security Profile for CSF 2.0

CSF 2.0 is device-agnostic by design. A BCI security profile would map CSF categories to neural-specific subcategories without changing the core framework.

**Ask:** Publish a BCI security profile (similar to the manufacturing profile or ransomware profile) with neural integrity and cognitive confidentiality subcategories.

### FDA: Add Neural Threat Categories to 524B

FDA Guidance 524B covers medical device cybersecurity but treats all devices identically. FDORA Sec. 3305 mandates patching but not neural-specific threat assessment.

**Ask:** Add neural-specific threat categories to 524B guidance. Require threat models that account for cognitive impact, not just device availability.

---

## 5. What QIF Bridges

Each neuroethics principle has a corresponding security gap. QIF fills the gap with an engineering component.

| Neuroethics Principle | Security Gap | QIF Component |
|----------------------|-------------|---------------|
| Mental Privacy | No neural data confidentiality controls | NISS scoring + NSP encryption + band-level access controls |
| Mental Integrity | No neural signal tampering detection | Neurowall coherence monitoring + TARA integrity techniques |
| Cognitive Liberty | No consent enforcement mechanism | Consent-per-band access model + informed consent framework |
| Psychological Continuity | No longitudinal signal integrity verification | Hash-chain signal provenance + temporal coherence baselines |
| Fair Augmentation | No equitable access assessment framework | Dual-use classification in TARA + therapeutic/attack boundary mapping |

---

## 6. Predecessor Research

QIF builds on approximately 15 years of foundational work by researchers who identified the problem before the tools existed to solve it.

| Authors | Year | Contribution | What QIF Extends |
|---------|------|-------------|-----------------|
| Denning, Matsuoka, Kohno | 2009 | Coined "neurosecurity." First paper framing BCI security as a distinct research area. | QIF provides the engineering framework they called for: quantified scoring, architectural model, wire protocol. |
| Martinovic et al. | 2012 | Proved consumer EEG leaks private information (PINs, bank details) via P300 responses. | TARA catalogs as T1001 with NISS scoring. QIF adds detection (coherence monitoring) and defense (signal authentication). |
| Bonaci, Calo, Chizeck | 2014 | Identified the "app store" threat model for BCIs. Proposed BCI anonymizer. | QIF extends with multi-band isolation, neural data classification, and consent-per-band access controls. |
| Bernal, Cammack, Peaceful | 2021 | Most comprehensive BCI attack taxonomy before TARA. CIA-based organization. | TARA extends from 3 categories to 109 techniques with NISS scoring and DSM-5-TR psychiatric mappings. |
| Schroder | 2025 | Practical security assessment of commercial BCI devices. | QIF provides systematic evaluation framework (NISS + hourglass) for the vulnerabilities identified. |
| Landau | 2020 | Connected neural data privacy to surveillance debates. Argued for neural data as special category. | QIF operationalizes with technical controls: classification by band, encryption requirements, access frameworks. |

---

## 7. Open Invitation

This convergence will not happen from one side alone. Security researchers need neuroethicists to validate that technical controls actually protect the rights they define. Neuroethicists need security engineers to build enforceable mechanisms for the principles they articulate.

QIF is published under Apache 2.0. The TARA registry, NISS scoring system, hourglass architecture, and all governance documents are open for adoption, critique, and extension.

We are looking for:
- **Security researchers** to stress-test the threat model and extend TARA
- **Neuroethicists** to validate neurorights-to-controls mappings
- **Standards body participants** to champion BCI security within their organizations
- **BCI manufacturers** to pilot the framework on real devices
- **Regulators** to incorporate neural-specific requirements into existing guidance

The gap between security GRC and neuroethics is not a technical problem. It is a coordination problem. The tools exist. The principles exist. They just have not been connected yet.

---

*Data source: `src/data/convergence-data.ts` | Last updated: February 2026*
