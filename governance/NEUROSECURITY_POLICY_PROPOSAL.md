---
title: "Closing the Neurosecurity Gap"
description: "Policy recommendations for brain-computer interface security governance"
order: 8
---

# Closing the Neurosecurity Gap

> Policy recommendations for brain-computer interface security governance. Identifies seven security properties that no existing framework addresses, proposes concrete next steps for standards bodies, regulators, and industry, and offers open-source reference implementations as starting points for discussion.

**Version:** 1.2
**Date:** 2026-02-21
**Status:** Active Development
**Author:** Kevin Qi (Qinnovate)

**Disclosure:** The author develops the QIF framework referenced in this document. QIF is presented as one possible approach to the problems described, not as a prescription. The proposals in this document are intended to benefit the BCI security field broadly, regardless of which specific frameworks or tools are ultimately adopted. All QIF components are open-source (Apache 2.0) and freely available for evaluation, adaptation, or replacement.

---

## Audience Routing Guide

Not every section applies to every reader. Use this guide to find what matters to you:

| If you are... | Start with | Then read | Optional |
|---------------|-----------|-----------|----------|
| **A regulator** (FDA, FTC, EU) | Executive Summary, Part I (Sections 1-4) | Section 6 (Regulators) | Appendix B |
| **A standards body** (NIST, MITRE, IEEE, ISO) | Executive Summary, Section 2 (Seven Properties) | Section 5 (Standards Bodies) | Section 10 (Reference Implementations) |
| **A BCI manufacturer** | Executive Summary, Section 2 | Section 7 (Industry) | Section 9 (Timeline), Appendix C |
| **An academic researcher** | Section 4 (Why Proactive) | Section 8 (Academia) | Section 10, Appendix A |
| **A policy advisor or legislator** | Executive Summary, Section 3 (Structural Gaps) | Section 6 (Regulators) | Section 9 (Timeline) |
| **A neuroethicist** | Sections 2-3 | Section 8 (Academia) | Section 5 (Standards Bodies) |
| **A patient or caregiver** | Executive Summary, Sections 2.5 (Right to Disconnect), 2.6 (Surgical Updates) | Section 7.1 (Manufacturer Baseline) | Appendix D (Glossary) |
| **A clinician** (neurologist, neurosurgeon) | Executive Summary, Sections 2.2, 2.5, 2.6 | Section 6.1 (FDA), Section 7.1 (Manufacturers) | Section 3 (Structural Gaps) |
| **A legal professional** | Section 3 (Structural Gaps, especially 3.3 on case law) | Section 6.4 (Model Legislation) | Appendix A |

**Companion document:** This proposal builds on the analysis in [NEUROSECURITY_GOVERNANCE.md](NEUROSECURITY_GOVERNANCE.md), which provides the detailed regulatory coverage matrix, framework-by-framework analysis, neuroethics alignment, and convergence strategy. This document focuses on recommendations, not re-analysis.

---

## Table of Contents

- [Executive Summary](#executive-summary)
- **Part I: The Case for Proactive BCI Security**
  - [1. The Regulatory Landscape](#1-the-regulatory-landscape)
  - [2. The Seven Unaddressed Properties](#2-the-seven-unaddressed-properties)
  - [3. The Five Structural Gaps](#3-the-five-structural-gaps)
  - [4. Why Proactive, Not Reactive](#4-why-proactive-not-reactive)
- **Part II: Recommendations by Audience**
  - [5. Standards Bodies](#5-standards-bodies)
  - [6. Regulators](#6-regulators)
  - [7. Industry](#7-industry)
  - [8. Academia and International Bodies](#8-academia-and-international-bodies)
- **Part III: Implementation Framework**
  - [9. Phased Timeline](#9-phased-timeline)
  - [10. QIF as Reference Implementation](#10-qif-as-reference-implementation)
  - [11. Limitations and Open Questions](#11-limitations-and-open-questions)
  - [12. How to Engage](#12-how-to-engage)
- [Appendix A: Complete Regulatory Coverage Matrix](#appendix-a-complete-regulatory-coverage-matrix)
- [Appendix B: 25-Organization Directory](#appendix-b-25-organization-directory)
- [Appendix C: QIF Technical Summary Card](#appendix-c-qif-technical-summary-card)
- [Appendix D: Glossary](#appendix-d-glossary)
- [Appendix E: References](#appendix-e-references)

---

## Executive Summary

Brain-computer interfaces sit at the intersection of three regulatory domains: medical device regulation, privacy and neurorights law, and IT security frameworks. These three domains do not talk to each other. A BCI manufacturer can be FDA-cleared, HIPAA-compliant, and ISO 27001-certified and still have zero protections against adversarial neurostimulation, neural signal tampering, or cognitive state inference.

This is not a hypothetical gap. Across 25 mapped organizations and 13 regulatory frameworks, seven security properties unique to neural interfaces remain completely unaddressed by any existing standard, regulation, or guideline. No framework addresses neural signal authenticity. No scoring system expresses biological harm from a cybersecurity incident. No threat taxonomy catalogs BCI-specific attack techniques.

The gap is fillable. Early research implementations demonstrate that technical approaches to each of these problems are feasible. For example, the open-source QIF project (one of several emerging efforts in this space) has produced:

- A BCI-specific threat taxonomy with 109 techniques across 15 tactics
- A neural impact scoring system with 5 dimensions that CVSS cannot express
- A post-quantum encryption protocol designed for implantable power budgets (estimated 3.25% overhead at 40 mW in simulation)
- A real-time coherence monitoring system tested against 15 simulated attack scenarios

These are early-stage proofs of concept, not production-ready systems. They have not been independently audited or clinically validated. Their value is in demonstrating that the problem space is tractable: technical approaches exist for problems the regulatory world has not yet named. The specific tools that ultimately fill these gaps should emerge from multi-stakeholder standards processes, not from any single project.

### Six Recommendations for Six Organizations

| # | Organization | Recommendation | Realistic Horizon |
|---|-------------|---------------|-------------------|
| 1 | **NIST** | Convene a working group to explore a BCI Security Community Profile for CSF 2.0 | Working group: 2026-2027; profile: 2028-2030 |
| 2 | **MITRE** | Evaluate BCI-specific threat techniques for inclusion in ATT&CK through the existing community contribution process | Evaluation: 2026-2028; sub-matrix if warranted: 2029+ |
| 3 | **FIRST** | Explore a supplemental metric group for neural/biological impact alongside CVSS | SIG formation: 2027-2028; draft specification: 2030+ |
| 4 | **IEEE** | Launch a BCI cybersecurity working group under IEEE Brain Initiative to scope a standard | Working group: 2027-2028; standard: 2030+ |
| 5 | **FDA/CDRH** | Acknowledge neural devices as a distinct cybersecurity category and explore neural-specific threat guidance for Section 524B | Guidance clarification: 2027-2028; formal update: 2029+ |
| 6 | **UNESCO** | Partner with a technical standards body to develop implementation guidance for the 2025 Recommendation's security-relevant provisions | Partnership: 2027-2028; technical annex: 2030+ |

### Three-Phase Timeline

- **Phase 1: Exploration (2026-2028):** Working group formation, vocabulary development, voluntary pilot programs
- **Phase 2: Standardization (2028-2031):** Formal standards development, manufacturer pilots, first assessment criteria
- **Phase 3: Maturation (2031+):** Binding requirements, qualified assessor ecosystem, routine compliance

---

# Part I: The Case for Proactive BCI Security

## 1. The Regulatory Landscape

### Three Domains, One Gap

BCI security sits at the intersection of three regulatory domains that developed independently and have no formal coordination mechanism:

**Domain A: Medical Device Regulations** (FDA, FDORA Section 3305, EU MDR 2017/745)
Controls device safety, manufacturing quality, and (since 2023) cybersecurity. Treats BCIs as generic medical devices. Does not recognize neural data as a special category requiring unique protections. Note: FDA's 2023 cybersecurity guidance is non-binding advisory guidance, not legally enforceable regulation. FDORA Section 524B is the statutory mandate, but it specifies process requirements (threat modeling, SBOMs), not neural-specific controls.

**Domain B: Privacy and Neurorights** (HIPAA, GDPR Art. 9, Colorado HB 24-1058, California SB 1223, Chile Law 21.383, UNESCO 2025)
Controls consent, data handling, and (aspirationally) cognitive liberty. Defines rights and privacy obligations. Does not specify technical security controls. Important scope limitations: HIPAA applies only to covered entities and business associates, not consumer BCI devices sold direct-to-consumer. GDPR Art. 9's application to neural data has not been litigated or definitively settled by any DPA. State neurorights laws (Colorado, California) define privacy protections but do not prescribe technical security controls (encryption, incident response, monitoring).

**Domain C: IT Security Frameworks** (NIST SP 800-53, NIST CSF 2.0, ISO 27001, IEC 62443, SOC 2, PCI DSS)
Provides comprehensive control catalogs for information systems. Does not address biological endpoints, neural data properties, or cognitive impact.

**Adjacent but not addressed here:** Clinical research governance (45 CFR 46 Common Rule, ICH GCP E6(R2), IRB review) governs human subjects research with BCIs and provides substantial participant protections. These frameworks address informed consent, risk-benefit assessment, and adverse event reporting, but they do not specify cybersecurity controls for the devices used in research. Section 8.3 addresses the intersection of research ethics and cybersecurity.

### 25 Organizations Mapped

Across these three domains, 25 organizations produce the standards, regulations, and guidance that govern technology security. The full directory is in [Appendix B](#appendix-b-25-organization-directory), but the coverage picture is stark:

| Domain | Organizations | Neurotech Engagement | Security Engagement |
|--------|--------------|---------------------|---------------------|
| Security GRC | NIST, ISO/IEC, IEEE SA, MITRE, FIRST, OWASP, IEC 62443, CISA, ENISA, ISC2, ISACA, PCI SSC | None to minimal | Comprehensive |
| Neuroethics | UNESCO, OECD, Neurorights Foundation, INS, BCI Society, Berman Institute (JHU) | Direct to comprehensive | None to minimal |
| Medical/Regulatory | FDA/CDRH, EU MDR/EMA | Direct | Indirect |
| Policy | Chile, Colorado/California | Direct | None |
| Bridgers | IEEE Brain Initiative, DARPA, EFF | Direct | Indirect to comprehensive |

The pattern is consistent: security organizations have zero neurotechnology engagement, and neuroethics organizations have zero security engagement. The few "bridgers" (IEEE Brain, DARPA) touch both domains but have no dedicated BCI security program.

### The Coverage Matrix (Gap Rows Only)

The full regulatory coverage matrix is documented in [NEUROSECURITY_GOVERNANCE.md, Section 2](NEUROSECURITY_GOVERNANCE.md#2-the-grc-gap). The critical finding: seven security properties are addressed by no existing framework except QIF.

| Security Property | FDA | FDORA | HIPAA | State Laws | Chile | EU MDR | EU AI Act | NIST 800-53 | ISO 27001 | IEC 62443 | SOC 2 | Neurorights | **QIF** |
|-------------------|-----|-------|-------|------------|-------|--------|-----------|-------------|-----------|-----------|-------|-------------|---------|
| Neural signal authenticity | | | | | | | | | | | | | **X** |
| Adversarial stimulation prevention | | | | | | | | | | | | | **X** |
| Cognitive state integrity | | | | | | | | | | | | ~ | **X** |
| Neural re-identification | | | | ~ | | | | | | | | ~ | **X** |
| Biological impact scoring | | | | | | | | | | | | | **X** |
| Consent violation severity | | | | | | | | | | | | | **X** |
| Reversibility assessment | | | | | | | | | | | | | **X** |

A BCI manufacturer achieving full compliance across all three domains (FDA-cleared + HIPAA-compliant + ISO 27001-certified) still has zero coverage for these seven properties. This is the gap.

**An important caveat:** This does not mean existing frameworks are useless for BCI security. NIST CSF 2.0, IEC 62443, and ISO 27001 provide substantial infrastructure that could be extended to address neural-specific properties. The gap is in the neural-specific extensions, not in the foundations. Several of the recommendations in Part II propose exactly this: extending existing frameworks rather than replacing them.

---

## 2. The Seven Unaddressed Properties

Each property below is unique to neural interfaces. For each: what it is, why existing analogs fail, what the risk looks like, and what QIF proof demonstrates it can be addressed.

### 2.1 Neural Signal Authenticity

**What it is:** Verification that a neural signal reflects genuine neural activity from the user's brain, not an injected pattern from an attacker or a replayed recording.

**Why existing analogs fail:** NIST SI (System and Information Integrity) verifies data integrity at the bit level. It confirms that bits were not altered in transit. Neural signal authenticity requires confirming that the signal is biologically genuine, produced by actual neural tissue, not merely that its bytes are intact. A perfectly preserved recording of yesterday's neural signals passes every data integrity check but is not authentic.

**What the risk looks like:** An attacker replays a previously recorded motor command, causing a paralyzed patient's BCI-controlled prosthetic to move without their intent. The data is "intact" by every IT standard. The signal is not authentic.

**Feasibility evidence:** Signal authenticity can be approached through coherence scoring (measuring phase, transport, and gain variance against expected biological patterns) and cryptographic signal binding (per-frame hashes with post-quantum signatures). Early simulations show promise, but clinical validation against real-world attack scenarios remains an open research problem. The point is that the problem is technically addressable, not that any current tool has solved it.

### 2.2 Adversarial Neurostimulation Prevention

**What it is:** Protection against unauthorized write operations to the brain through a compromised BCI stimulation channel.

**Why existing analogs fail:** OWASP's command injection category addresses unauthorized commands to servers. A compromised server crashes or leaks data. A compromised stimulation channel can cause seizures, induce personality changes, impair memory formation, or cause irreversible neurological damage. The severity categories, countermeasures, and incident response requirements are fundamentally different.

**What the risk looks like:** A therapeutic deep brain stimulator for Parkinson's disease is compromised. The attacker modifies stimulation parameters beyond safe bounds. The patient experiences seizure activity or involuntary motor responses. Current medical device cybersecurity guidance does not categorize this as a distinct threat class separate from generic device compromise.

**Feasibility evidence:** Hardware-level amplitude bounds, rate limiting, and policy-driven stimulation suppression are technically achievable. A systematic taxonomy of stimulation-related attack techniques enables risk assessment that current generic device security frameworks do not provide. These approaches require clinical validation and integration with existing device safety systems.

### 2.3 Cognitive State Integrity

**What it is:** Assurance that the person's subjective experience, cognitive function, and decision-making capacity have not been altered by external manipulation through the BCI.

**Why existing analogs fail:** SOC 2's Processing Integrity criterion checks that system processing is complete, valid, accurate, timely, and authorized. It applies to data transformations, not to the cognitive state of the person whose data is being processed. A BCI could pass every SOC 2 processing integrity check while subtly altering the user's mood, attention, or decision-making through out-of-spec stimulation.

**What the risk looks like:** A mood-regulation BCI introduces a systematic bias in emotional response, gradually shifting the user's baseline emotional state. Every data processing check shows the system is operating "correctly." The user's personality is changing.

**Feasibility evidence:** Cognitive integrity can be operationalized as a scored metric by evaluating whether a given technique can alter subjective experience. BCI-specific threat taxonomies can identify concrete cognitive integrity threats (identity erosion, agency manipulation, self-model corruption) that generic security frameworks miss entirely. This is an area where neuroethics researchers and security engineers must collaborate closely, as the definitions of "cognitive integrity" need both clinical and technical grounding.

### 2.4 Neural Re-identification Risk

**What it is:** The possibility that "anonymized" neural data can be linked back to an individual because brain signals may be as unique as fingerprints, and unlike passwords, a person cannot change their neural signature.

**Why existing analogs fail:** GDPR Art. 9 classifies biometric data as a special category requiring additional protection. But it provides no provisions for the specific challenge of neural biometrics: the signal patterns used for authentication and security are the same patterns that enable re-identification. Standard anonymization techniques (k-anonymity, differential privacy) can destroy the security utility of neural data. And unlike other biometrics, there is no "reset" option if a neural signature is compromised.

**What the risk looks like:** A research dataset of "anonymized" EEG recordings is released for academic use. A motivated actor cross-references the neural signatures against a separate dataset (clinical, consumer, or law enforcement) and re-identifies participants. The participants cannot change their brain signatures.

**Feasibility evidence:** Calibrated differential privacy (epsilon-bounded noise injection) provides a mathematical framework for reducing re-identification risk while preserving signal utility. Cryptographic signal binding can enable authentication without exposing raw neural signatures. The optimal privacy-utility tradeoff for neural data is an open research question that requires input from privacy researchers, neuroscientists, and regulators.

### 2.5 Right to Disconnect

**What it is:** The right of a user to cease using a neural device, including turning it off, having it removed, or suspending its function, without losing critical capabilities that the device now mediates.

**Why existing analogs fail:** The CIA triad's Availability assumes that a system can be taken offline for maintenance, patching, or replacement. For a neural prosthesis that has become the primary communication channel for a locked-in patient, "taking it offline" means the person cannot communicate. For a deep brain stimulator managing severe Parkinson's symptoms, "turning it off" means immediate symptom return. The security concept of availability does not account for systems whose removal carries medical consequences.

**What the risk looks like:** A manufacturer discontinues support for an implanted device. The user faces a choice between continuing to use an unsupported, unpatched neural implant, or undergoing a craniotomy to remove it. Neither option appears in any IT security framework's remediation guidance.

**Feasibility evidence:** Lifecycle obligation frameworks, abandonment prevention strategies, and graceful degradation modes (Full Function to Limited Function to Safe Mode to Standby to Removal) can be formally defined and documented. Lazaro-Munoz et al. (2022) provide empirical grounding from researcher and patient interviews. See [POST_DEPLOYMENT_ETHICS.md](POST_DEPLOYMENT_ETHICS.md) for one approach to addressing the gap between IT availability (system uptime) and neural availability (cognitive function continuity).

### 2.6 Surgical Update Constraint

**What it is:** The fact that security patches for implanted neural devices may require surgery, fundamentally changing the cost, risk, and feasibility of vulnerability remediation.

**Why existing analogs fail:** FDORA Section 3305 requires patching. Its framework assumes that patching is an operational activity (downloading and installing software). For an implanted BCI, a firmware update may require a clinical procedure. A critical vulnerability in an implant's cryptographic module cannot be remediated by telling the user to "install the latest update." The vulnerability management lifecycle must account for the difference between a software patch (minutes, no risk) and a surgical procedure (hours, medical risk, recovery time, cost).

**What the risk looks like:** A post-quantum cryptographic weakness is discovered in an implant's key exchange protocol. The patch requires replacing a hardware security module that is physically located inside the patient's skull. The cost of "patching" is a neurosurgical procedure.

**Feasibility evidence:** Crypto agility (algorithm substitution without re-keying) can allow cryptographic upgrades via software update for many scenarios, reducing the need for surgical intervention for cryptographic maintenance. Forward secrecy and long-lifecycle key management can minimize the window where surgical updates are necessary. Vulnerability severity scoring for implanted devices should incorporate surgical update costs as a distinct factor. These engineering principles are well-established in other embedded systems; their application to neural implants requires collaboration between security engineers and neurosurgeons.

### 2.7 Cognitive Integrity as Measurable Security Property

**What it is:** The ability to define, measure, test, and audit "cognitive integrity" as a formal security property, comparable to how confidentiality, integrity, and availability are measurable in IT security.

**Why existing analogs fail:** Ienca and Andorno (2017) define psychological continuity as a right. This is a philosophical and legal construct. No framework defines it as a measurable, testable security property. You cannot audit "cognitive integrity" compliance because there are no metrics, thresholds, or test procedures. A BCI manufacturer cannot demonstrate cognitive integrity protection because there is no standard for what that means technically.

**What the risk looks like:** A BCI manufacturer claims their device "protects cognitive integrity" in marketing materials. There is no standard against which this claim can be evaluated, no audit procedure to verify it, and no metric to measure it. The claim is unfalsifiable.

**Feasibility evidence:** Cognitive integrity can be defined as a scored metric with specific thresholds, making it auditable rather than purely aspirational. BCI-specific threat techniques can be evaluated against cognitive integrity impact. Signal coherence monitoring can provide real-time indicators of potential cognitive integrity violations. This is not a complete solution. The definition of cognitive integrity thresholds requires input from clinical neuroscientists, neuroethicists, and patients before any scoring system can claim validity. But the alternative, leaving "cognitive integrity" as an unmeasurable concept, guarantees that no compliance framework can address it.

---

## 3. The Five Structural Gaps

Beyond the seven unaddressed properties, five structural gaps in existing regulation create specific failure modes for BCI security. For each: the legal context, the failure mode, the consequence, the solution direction, and who must act.

### 3.1 HIPAA: Real-Time Stream Auditing

**Legal context:** HIPAA requires 6-year retention of access logs for Protected Health Information (PHI). 45 CFR Part 164 specifies administrative, physical, and technical safeguards. HIPAA applies to covered entities (providers, plans, clearinghouses) and their business associates. Consumer BCI devices sold direct-to-consumer outside the clinical setting may not fall under HIPAA's scope, creating a coverage gap for the fastest-growing BCI market segment.

**Failure mode:** BCIs generate continuous neural streams at 500Hz to 2,000Hz. Logging every individual packet or "read" event for a continuous neural stream creates a data footprint larger than the neural data itself. Current HIPAA auditing assumes discrete access events (a doctor opens a patient record), not continuous streams (a BCI transmitting 2,000 data points per second, 24 hours a day).

**Consequence:** BCI manufacturers face an impossible choice: log every neural data access event (storage costs explode, system performance degrades) or aggregate logs (potentially non-compliant with HIPAA audit requirements). Neither option has been tested in enforcement.

**Solution direction:** Temporal Aggregation Logs (auditing sessions and changes in coherence state rather than individual data points) satisfy the intent of HIPAA without breaking storage budgets. Regulatory clarification is needed on how "streaming sovereignty" applies to continuous biometric data.

**Who must act:** HHS Office for Civil Rights (HIPAA enforcement), with input from NIST on technical standards for continuous data auditing.

### 3.2 GDPR: The Neural Fingerprinting Paradox

**Legal context:** GDPR requires "true anonymization" where data can no longer be linked to an individual. Art. 9 classifies biometric data as a special category. Whether neural data constitutes "biometric data" under Art. 9 has not been definitively settled by any Data Protection Authority or court. The classification is plausible but not established law.

**Failure mode:** Neural time-series data is inherently unique. A person's coherence signature, spectral power distribution, and ERP timing can be used to re-identify them across sessions, much like a fingerprint. Stripping the data of all identifiable patterns often destroys the security signature needed to detect unauthorized neural injection. The same features that enable re-identification are the features that enable threat detection.

**Consequence:** BCI manufacturers must choose between anonymization (privacy-preserving but security-blind) and signal preservation (security-enabled but privacy-violating). GDPR provides no framework for resolving this tension.

**Solution direction:** Recognition of "neural uniqueness" as a special category where anonymization and security utility must be balanced through technical thresholds. Calibrated differential privacy (epsilon-bounded noise injection) provides a mathematical framework for this balance. Regulators need to define acceptable epsilon ranges for neural data.

**Who must act:** European Data Protection Board (EDPB) for GDPR interpretation, with technical input from IEEE or ISO on differential privacy standards for neural data.

### 3.3 CCPA / SB 1223: Zero Case Law

**Legal context:** California SB 1223 (effective January 2025) adds "neural data" as sensitive personal information under CCPA and grants protections for "mental integrity," "cognitive liberty," and "psychological continuity."

**Failure mode:** These are philosophical concepts that are now binding law, but no case has tested their technical boundaries. At what point does a targeted notification become a violation of cognitive liberty? When does a neural device's autonomous threshold adjustment violate a user's psychological continuity? When does aggregated neural data processing cross the line from analysis to "cognitive state inference" requiring explicit consent?

**Consequence:** BCI manufacturers have no technical baseline for compliance. California's Attorney General has enforcement authority but no technical standards against which to evaluate violations. The first enforcement action will define the law's scope, retroactively, potentially years after devices have shipped.

**Solution direction:** Technical standards that define "threshold of violation" for neurorights. NISS provides a model: each neuroright maps to scored metrics with defined thresholds. Test cases and technical legal standards are needed before the first enforcement action, not after.

**Liability implications:** The absence of case law creates uncertainty for everyone. BCI manufacturers cannot predict what "compliance" means. Plaintiffs' attorneys have no precedent for neural data claims. Insurers cannot price the risk. Defense counsel cannot advise on safe harbors. The first case to test SB 1223's neural data provisions will set precedent that applies retroactively to every device already on the market. Proactive technical standards reduce this uncertainty for all parties.

**Who must act:** California Attorney General's office (enforcement guidance), with input from BCI industry and technical standards bodies on defining measurable compliance criteria.

### 3.4 FDORA: No Neural Scoring Standard

**Legal context:** Section 524B of the FD&C Act (via FDORA) mandates threat modeling and cybersecurity documentation for all medical devices with software. FDA enforces a Refuse-to-Accept policy: submissions lacking cybersecurity documentation are rejected before review.

**Failure mode:** Section 524B mandates that manufacturers perform threat modeling but does not specify which threat taxonomy or scoring system to use for neural devices. The referenced standards (CVSS, IEC 62443, AAMI TIR57, ISO 14971) provide processes and scoring for general medical devices. None catalog neural-specific attack techniques. A manufacturer can satisfy FDORA by performing CVSS-based threat modeling that scores a neural injection attack identically to a web application SQL injection, both rated on the same scale with no neural-specific dimensions.

**Consequence:** FDA receives cybersecurity documentation that technically satisfies the requirement but fails to identify or score the most dangerous BCI-specific threats. A neural ransomware scenario scores the same as a data breach scenario because CVSS has no dimension for "biological harm" or "cognitive integrity loss."

**Solution direction:** A neural impact scoring extension that adds BCI-specific dimensions to CVSS or establishes a parallel scoring system. NISS provides the reference model with five dimensions: biological impact, cognitive integrity, consent violation, reversibility, and neuroplasticity risk.

**Who must act:** FDA/CDRH (guidance update to reference neural-specific scoring), FIRST (CVSS extension or companion standard), with input from BCI manufacturers and clinical researchers.

### 3.5 International: Soft Law Enforcement Vacuum

**Legal context:** UNESCO's Recommendation on the Ethics of Neurotechnology (November 2025) is the first global normative framework for neurotechnology, adopted by all 194 Member States. The OECD Responsible Innovation in Neurotechnology Principles (2019) provide additional guidance.

**Failure mode:** Both frameworks are "soft law": they carry moral authority and set expectations but impose no binding legal penalties. A BCI manufacturer can claim "UNESCO alignment" in marketing materials while implementing none of the technical safeguards that would actually protect users. There is no audit procedure, no certification body, and no enforcement mechanism.

**Consequence:** The strongest global consensus on neurotechnology ethics has no teeth. Manufacturers that invest in genuine compliance are at a competitive disadvantage compared to those who claim alignment without implementation. The gap between stated principles and technical enforcement grows wider as the market scales.

**Solution direction:** Technical annexes to soft law frameworks that specify measurable security controls. Chile's Law 21.383 (constitutional neurorights, October 2021) demonstrates that legislative action is possible, but even Chile lacks implementing technical standards. Binding international treaties with technical enforcement mechanisms are the long-term solution.

**Who must act:** UNESCO (technical annex development, partnering with NIST or ISO), OECD (cross-committee collaboration between cybersecurity and neurotechnology committees), national legislatures (implementing legislation with technical requirements), with support from IEEE and IEC for standards development.

---

## 4. Why Proactive, Not Reactive

### The IT Security Precedent

Information security governance was retrofitted. The internet shipped without security. Email shipped without encryption. Web applications shipped without input validation. The cost: decades of breach-driven compliance, trillions of dollars in damages, and a permanent gap between policy and enforcement.

The timeline:

| Year | Event | Years After Technology Shipped |
|------|-------|-------------------------------|
| 1969 | ARPANET launches | 0 |
| 1988 | Morris Worm | 19 years |
| 1996 | HIPAA enacted | 27 years |
| 2002 | Sarbanes-Oxley | 33 years |
| 2004 | PCI DSS v1.0 | 35 years |
| 2013 | NIST CSF v1.0 | 44 years |
| 2016 | GDPR adopted | 47 years |
| 2024 | NIST CSF v2.0 | 55 years |

IT security is still catching up. The BCI security window is different.

### The BCI Window

BCIs are early. The first commercial BCIs received FDA clearance in 2025. The consumer transition is projected for 2026-2030. Mass adoption is projected for 2030+. The window to build security into the foundation, rather than bolt it on after the first breach, is open right now.

This window will not stay open. As BCIs scale from thousands of research participants to millions of consumers, the cost of retrofitting security will grow exponentially. Every device shipped without neural security becomes technical debt that must be remediated later, potentially through surgical procedures.

### Four Precedents

Four security standardization efforts demonstrate that proactive, voluntary adoption can succeed:

**PCI DSS (2004):** Created by the payment card industry without government mandate. Prescriptive controls with compliance levels scaled by transaction volume drove universal adoption. Key insight: proportional requirements (different tiers for different risk levels) enable broad adoption. Neurosecurity application: scale requirements by device invasiveness.

**MITRE ATT&CK (2013):** A free, open taxonomy that described what adversaries actually do. Became the universal language for threat intelligence within 5 years. Key insight: shared vocabulary precedes coordinated defense. Neurosecurity application: TARA provides the seed taxonomy using the same model.

**NIST CSF (2014):** A voluntary framework with no legal mandate achieved near-universal adoption through market pressure (customers, insurers, investors required it). Key insight: usefulness drives adoption, not mandates. Neurosecurity application: IRBs, research ethics committees, and BCI insurers will drive adoption before government mandates.

**IEC 62443 (2009):** Bridged IT and OT security by defining trust boundaries at physical interfaces (zones and conduits). Key insight: physical interfaces define security boundaries, not network layers. Neurosecurity application: QIF's hourglass model places the trust boundary at the neural interface (I0), where biology meets silicon.

### The Cost of Delay

Two scenarios illustrate the cost of waiting for the first breach:

**Neural ransomware:** An attacker compromises a deep brain stimulator and threatens to alter stimulation parameters unless a ransom is paid. The patient cannot simply "disconnect" without medical consequences. There is no incident response playbook for this scenario. There is no CVSS score for "held hostage by your own implant." There is no insurance product that covers this risk. Every one of these gaps must be addressed from scratch, under crisis conditions, after the damage is done.

**Cognitive state inference at scale:** A consumer BCI platform collects EEG data for "wellness" purposes. A data breach exposes neural recordings. The recordings reveal psychiatric conditions, emotional states, and cognitive decline patterns for millions of users. There is no notification framework for "your brain data was compromised." There is no remediation possible because the users cannot change their neural signatures.

### The Canary: LSL Vulnerability (February 2026)

In February 2026, QIF disclosed the first BCI-infrastructure vulnerability in the Lab Streaming Layer (LSL), the most widely used real-time data transport in BCI research. LSL is used in hundreds of research labs worldwide and carries live neural data.

The vulnerability is real but affects a research tool, not a clinical implant. It is the canary. The next one may not be in a research library. It may be in a device implanted in a human brain. The time to build the frameworks, taxonomies, scoring systems, and incident response procedures is before that happens, not after.

---

# Part II: Recommendations by Audience

## 5. Standards Bodies

Each recommendation below is tiered by timeline: Near-term (2026-2028), Medium-term (2028-2031), and Long-term (2031+). These timelines reflect the reality of standards development cycles. Each recommendation has a low-cost entry point (convene a discussion, evaluate a gap) that does not commit the organization to a specific outcome.

### 5.1 NIST: BCI Security Profile for CSF 2.0

**The gap:** NIST CSF 2.0's six functions (Govern, Identify, Protect, Detect, Respond, Recover) are sector-agnostic. No healthcare or medical device community profile has been published for CSF 2.0. Neural-specific subcategories do not exist.

**Recommendation:** Explore a BCI Security Community Profile through NIST's existing Community Profile program, which is designed for sector-specific adaptation of CSF 2.0.

| Timeline | Action | Deliverable |
|----------|--------|-------------|
| **Near-term** | Convene a BCI security working group under NIST's Community Profile program, with representation from BCI manufacturers, FDA, neuroethics researchers, clinicians, and patient advocates | Working group charter |
| **Near-term** | Map existing CSF 2.0 subcategories to BCI-specific requirements and identify neural-specific gaps | Gap analysis document |
| **Medium-term** | Develop and publish a BCI Security Community Profile | CSF 2.0 profile with neural integrity, cognitive confidentiality, and biological impact subcategories |
| **Medium-term** | Develop a companion SP 800-series publication on neural data security | Technical guidance for implementing the profile |
| **Long-term** | Consider integrating neural security controls into future SP 800-53 revisions | Neural data classification, cognitive integrity controls added to core control catalog |

**Available reference material:** Open-source BCI security frameworks (including QIF) provide gap analysis data, metric definitions, and threat taxonomies that could inform the working group's initial assessment.

### 5.2 MITRE: Neural ATT&CK Sub-Matrix

**The gap:** MITRE ATT&CK catalogs 594 enterprise techniques across 14 tactics. None address neural injection, cognitive exfiltration, neurostimulation manipulation, or signal dynamics disruption. BCI attacks have no TTP classification in any MITRE matrix (Enterprise, Mobile, ICS).

**Recommendation:** Evaluate BCI-specific threat techniques for potential inclusion in ATT&CK through MITRE's established community contribution process.

A critical distinction: ATT&CK catalogs *observed* adversary behavior, not theoretical possibilities. Of the techniques identified in published BCI security literature, approximately 49 are based on published research demonstrating real attacks or feasibility demonstrations (Martinovic et al. 2012, Bonaci et al. 2014, Lopez Bernal et al. 2021, among others). These literature-grounded techniques are the strongest candidates for ATT&CK contribution. Theoretical or recontextualized techniques would need additional evidence before meeting ATT&CK's inclusion criteria.

| Timeline | Action | Deliverable |
|----------|--------|-------------|
| **Near-term** | MITRE evaluates whether BCI threats warrant a dedicated matrix or can be accommodated within existing matrices (Enterprise, ICS) | Assessment report |
| **Near-term** | BCI security researchers submit literature-grounded techniques through MITRE's community contribution process | Contributed techniques with published evidence |
| **Medium-term** | If warranted, develop a Neural Devices matrix with BCI-specific tactics and techniques | Public ATT&CK sub-matrix (or expansion of ICS matrix) |
| **Long-term** | Community-maintained contribution model as real-world BCI security incidents provide observed behavior data | Ongoing maintenance |

**Available reference material:** Published BCI security research provides approximately 49 techniques with empirical evidence. Open-source threat taxonomies (including TARA) provide additional recontextualized and theoretical techniques that may inform future ATT&CK expansion as evidence matures.

### 5.3 FIRST: CVSS Neural Impact Metrics

**The gap:** CVSS v4.0 scores vulnerability severity across exploitability, scope, and impact. Impact metrics cover confidentiality, integrity, and availability. None address biological harm, cognitive integrity loss, consent violation severity, reversibility of neural damage, or neuroplasticity risk. A CVSS 9.8 web exploit and a CVSS 9.8 BCI exploit that causes permanent cognitive deficit are scored identically.

**Recommendation:** Explore whether a supplemental metric group or companion scoring system can address neural and biological impact dimensions that CVSS currently cannot express.

CVSS is a consensus-driven standard maintained by hundreds of organizations. Proposing changes requires broad community buy-in and years of development. A more realistic path is to develop a complementary, domain-specific scoring system that can be used *alongside* CVSS for BCI vulnerability assessment, similar to how the DREAD model or OWASP Risk Rating complement CVSS in specific domains.

| Timeline | Action | Deliverable |
|----------|--------|-------------|
| **Near-term** | Form a special interest group (SIG) within FIRST to evaluate neural impact dimensions | SIG charter and initial membership |
| **Medium-term** | Develop a domain-specific scoring system for BCI vulnerabilities, designed to complement CVSS | Draft specification piloted against known BCI vulnerabilities |
| **Long-term** | If community consensus supports it, propose integration of neural dimensions into CVSS mainline or publish as a permanent supplemental standard | Final specification |

**NISS dimensions for consideration:**

| NISS Dimension | What It Scores | Why CVSS Cannot Express It |
|----------------|---------------|---------------------------|
| Biological Impact (BI) | Physical harm to neural tissue | CVSS has no "tissue damage" metric |
| Cognitive Integrity (CG) | Alteration of subjective experience | CVSS "Integrity" means data integrity, not cognitive integrity |
| Consent Violation (CV) | Whether the attack bypasses user consent | CVSS has no consent dimension |
| Reversibility (RV) | Whether damage can be undone | CVSS assumes software remediation, not biological recovery |
| Neuroplasticity (NP) | Long-term neural adaptation risk | No equivalent in any scoring system |

### 5.4 IEEE: BCI Cybersecurity Standard

**The gap:** IEEE SA produces the P7700 series on neurotechnology ethics and P2794 on neural interface research reporting. IEEE Brain Initiative has working groups on BCI terminology (P2731) and standards roadmaps. No IEEE standard addresses BCI cybersecurity. Ethics and security are separate work streams with no bridge.

**Recommendation:** Produce a BCI Cybersecurity Standard (P27XX) under IEEE Brain Initiative that bridges P7700 ethics with security requirements.

| Timeline | Action | Deliverable |
|----------|--------|-------------|
| **Near-term** | Launch a BCI Cybersecurity Working Group under IEEE Brain | Working group charter, initial membership |
| **Medium-term** | Develop a standard covering threat modeling, security architecture, and compliance requirements for BCI devices | Draft standard for ballot |
| **Medium-term** | Align with P7700 ethics requirements and P2731 terminology | Cross-referencing between standards |
| **Long-term** | Publish the standard and develop a conformity assessment program | Published standard, assessor training |

### 5.5 ISO/IEC: Neural Security Extension

**The gap:** ISO 27001 provides 93 controls for information security management. ISO 27799 covers health informatics security but treats neural data as generic PHI. No ISO control addresses neural signal authenticity, cognitive integrity, or biological impact from cybersecurity incidents.

**Recommendation:** Add neural data classification tiers to ISO 27799 and publish a technical report (TR) on BCI security.

| Timeline | Action | Deliverable |
|----------|--------|-------------|
| **Near-term** | Propose a study period for neural data security within SC 27 | Study period proposal |
| **Medium-term** | Develop ISO/IEC TR on BCI security controls (technical report, lower barrier than full standard) | Published TR with neural data classification, BCI-specific controls |
| **Long-term** | Integrate neural security controls into ISO 27001 revision or publish as ISO 27XXX | Full international standard |

---

## 6. Regulators

### 6.1 FDA/CDRH: Neural Threat Categories in 524B Guidance

**The gap:** Section 524B mandates cybersecurity documentation but references generic frameworks (CVSS, IEC 62443). The February 2026 cybersecurity guidance implements the requirement with no neural-data-specific controls.

**Recommendation:** Update the 524B guidance to include neural-specific threat categories and require neural impact scoring alongside CVSS for BCI submissions.

| Timeline | Action | Deliverable |
|----------|--------|-------------|
| **Near-term** | Acknowledge neural devices as a distinct device class for cybersecurity purposes | Guidance update or FAQ clarifying neural-specific expectations |
| **Near-term** | Reference BCI-specific threat taxonomies in pre-submission guidance for BCI manufacturers | Updated pre-submission guidance |
| **Medium-term** | Require neural impact assessment as part of cybersecurity documentation for neural devices | 524B guidance supplement for neural devices |
| **Medium-term** | Develop BCI-specific cybersecurity review criteria for Breakthrough Device submissions | Internal review guidance for CDRH |
| **Long-term** | Integrate neural security requirements into the next major revision of cybersecurity guidance | Unified guidance covering generic and neural-specific requirements |

**The structural gap in current guidance:** FDA's cybersecurity guidance asks manufacturers to "identify cybersecurity risks" but provides no neural-specific risk categories. A BCI manufacturer can satisfy this requirement by identifying network-level threats (man-in-the-middle, denial of service, firmware tampering) while entirely missing neural-level threats (signal injection, cognitive exfiltration, neurostimulation manipulation). TARA's 109 techniques provide the taxonomy that would make this requirement meaningful for neural devices.

### 6.2 FTC: Consumer BCI Security Baseline

**The gap:** FTC enforces against deceptive and unfair practices under Section 5 of the FTC Act. FTC has brought enforcement actions against health technology companies (Lumosity 2016, Practice Fusion 2020, BetterHelp 2023) but has no consumer BCI security baseline.

**Recommendation:** Publish consumer BCI security guidelines that define minimum security requirements for non-medical neural devices.

| Timeline | Action | Deliverable |
|----------|--------|-------------|
| **Near-term** | Issue a public statement classifying neural data as requiring heightened protection under Section 5 | Policy statement or blog post |
| **Medium-term** | Publish consumer BCI security guidelines | FTC guidance document with minimum security requirements for consumer neural devices |
| **Medium-term** | Clarify the intersection of COPPA with pediatric BCI devices | Guidance on children's neural data protection |
| **Long-term** | Establish enforcement precedents for inadequate consumer BCI security | Enforcement actions that define the standard of care |

### 6.3 EU: Cross-Reference MDR with AI Act

**The gap:** Neural implants are classified as Class III under MDR Rule 8 (invasive, contact with CNS) and Rule 20 (brain stimulation). AI-enabled BCIs simultaneously fall under the EU AI Act as high-risk systems (Article 6(1) + Annex I). These two regulatory frameworks have overlapping cybersecurity requirements but no unified neural-data-specific security standard.

**Recommendation:** Develop a unified compliance pathway for BCI devices under both MDR and AI Act, with neural-specific cybersecurity requirements.

| Timeline | Action | Deliverable |
|----------|--------|-------------|
| **Near-term** | MDCG (Medical Device Coordination Group) guidance on cybersecurity for AI-enabled BCIs | Guidance document addressing dual MDR/AI Act compliance |
| **Medium-term** | Harmonize MDR cybersecurity requirements with AI Act Article 15 for neural devices | Harmonized standard or guidance |
| **Medium-term** | Classify neural data within the EU AI Act's data governance framework (Article 10) | Data governance guidance for neural data |
| **Long-term** | Include the upcoming EU Neurotechnology Legislative Package neural security requirements | Legislative provisions with technical standards references |

### 6.4 State Legislatures: Model Legislation

**The gap:** Four US states (Colorado, California, Montana, Connecticut) have enacted neural data protection laws. Each defines neural data differently, imposes different consent requirements, and specifies no technical security standards. The result is compliance fragmentation without actual security improvement.

**Recommendation:** Develop model legislation that includes technical security requirements alongside privacy protections.

| Timeline | Action | Deliverable |
|----------|--------|-------------|
| **Near-term** | NCSL or similar body convenes a neural data legislation working group | Working group with technical advisors |
| **Medium-term** | Publish model legislation that references technical standards for neural data security (not just privacy) | Model bill with security requirements |
| **Long-term** | Federal preemption through the MIND Act (S. 2925) or successor legislation | Federal neural data law that harmonizes state-level fragmentation |

### 6.5 International: Binding Treaties with Technical Enforcement

**The gap:** International soft law frameworks (UNESCO 2025, OECD 2019) set ethical expectations but impose no binding obligations. Chile's constitutional amendment (Law 21.383, 2021) demonstrates that binding legislation is possible but lacks implementing technical standards.

**Recommendation:** Develop binding international agreements that reference technical enforcement mechanisms.

| Timeline | Action | Deliverable |
|----------|--------|-------------|
| **Near-term** | Chile develops implementing technical standards for Law 21.383 | Technical standards referenced in Chilean regulation |
| **Medium-term** | Council of Europe's Strategic Action Plan on Neurotechnology (2025) develops binding protocols | Binding protocol under the Council of Europe framework |
| **Long-term** | UN treaty on neurotechnology governance with technical enforcement annexes | International treaty with technical standards |

---

## 7. Industry

### 7.1 BCI Manufacturers: Voluntary Security Baseline

**Recommendation:** Adopt a voluntary BCI security baseline that addresses neural-specific threats beyond what generic medical device cybersecurity requires. A meaningful baseline should include:

**Neural-specific threat modeling:** Use a BCI-focused threat taxonomy (such as TARA or a future standards body equivalent) during device design. Map identified techniques to your device's attack surface. Generic IT threat modeling misses the most dangerous BCI-specific scenarios.

**Neural impact scoring:** Score identified threats using dimensions that capture biological harm, cognitive impact, and reversibility. Standard CVSS scoring cannot express these dimensions. Until a formal standard exists, any domain-specific scoring approach is better than none.

**Baseline security requirements:** The following represent minimum security properties that any BCI should address:

| # | Requirement | What It Means |
|---|-------------|--------------|
| 1 | Security architecture documentation | Document your device's security boundaries, including the neural-silicon interface |
| 2 | Signal authenticity verification | Implement some form of checking that neural signals are genuine, not injected |
| 3 | Authenticated neural interface | Authenticate before accepting or sending neural signals |
| 4 | End-to-end encryption for neural data | Encrypt neural data in transit and at rest, with post-quantum readiness for long-lived implants |
| 5 | Continuous monitoring | Implement anomaly detection for the neural signal chain |

| Timeline | Action |
|----------|--------|
| **Near-term** | BCI manufacturers review available threat taxonomies against their device architectures |
| **Near-term** | Explore neural-specific impact scoring for identified threats in FDORA cybersecurity submissions |
| **Medium-term** | Implement baseline neural security requirements (signal authentication, encryption, monitoring) |
| **Medium-term** | Participate in standards body working groups |
| **Long-term** | Full QIF-Clinical (R1-R10) or equivalent standard compliance |

### 7.2 Cloud and Platform Providers: Neural Data as Highest Tier

**Recommendation:** Cloud providers hosting BCI data should classify neural data at the highest sensitivity tier, above PII and PHI.

| Requirement | Rationale |
|------------|-----------|
| Encrypt neural data with dedicated keys (not shared with other data types) | Neural data uniqueness means compromise affects a person permanently |
| Implement neural-data-specific access controls | Access to neural data should require additional authentication beyond standard PHI controls |
| Retain neural data audit logs for the lifetime of the patient, not a fixed retention period | The sensitivity of neural data does not decay over time |
| Prohibit neural data use for secondary purposes without explicit consent | Neural data can reveal psychiatric conditions, cognitive decline, and emotional state |

### 7.3 Insurers: BCI Security as Underwriting Criterion

**Recommendation:** Cyber insurers and medical device insurers should incorporate BCI security assessment into underwriting.

| Timeline | Action |
|----------|--------|
| **Near-term** | Insurers develop BCI-specific risk questionnaires informed by emerging threat taxonomies |
| **Medium-term** | Offer premium discounts for devices meeting recognized BCI security standards |
| **Long-term** | Require minimum BCI security certification for neural device coverage |

The insurance industry drove adoption of PCI DSS for payment card security, NIST CSF for enterprise security, and building codes for property insurance. The same market mechanism can drive BCI security adoption before government mandates exist.

---

## 8. Academia and International Bodies

### 8.1 UNESCO: Technical Enforcement for the 2025 Recommendation

**The gap:** The UNESCO Recommendation on the Ethics of Neurotechnology (November 2025) establishes the global ethical framework. It defines values (human rights, health, diversity, sustainability, professional integrity) and principles (proportionality, freedom of thought, privacy, protection of children). It does not specify how to implement any of them technically.

**Recommendation:** Partner with a technical standards body (NIST, ISO, or IEEE) to produce a technical annex that maps each recommendation to specific, auditable security controls.

| UNESCO Element | Proposed Technical Control | Standards Body |
|----------------|---------------------------|---------------|
| Freedom of thought | Neural firewall with consent enforcement | NIST (CSF profile) |
| Privacy | Differential privacy for neural data, post-quantum encryption | ISO (27799 extension) |
| Protection of children | Age-tiered neural access controls, pediatric consent protocols | IEEE (P27XX) |
| Proportionality | Graduated response based on anomaly severity | IEC (62443 neural profile) |

### 8.2 OECD: Cross-Committee Collaboration

**The gap:** The OECD has both a cybersecurity committee and a neurotechnology committee. They published neurotechnology principles in 2024 and AI/cybersecurity guidance separately. The committees do not collaborate.

**Recommendation:** Convene a joint working session between the OECD cybersecurity committee and the neurotechnology committee to produce a shared working paper on BCI security governance.

| Timeline | Action |
|----------|--------|
| **Near-term** | Joint session at the next committee meeting cycle |
| **Medium-term** | Working paper on "Cybersecurity for Neurotechnology: Connecting OECD Principles" |
| **Long-term** | Integrated OECD guidance covering both cybersecurity and neurotechnology |

### 8.3 IRBs and BCI Society: Cybersecurity in Research Ethics

**The gap:** Institutional Review Boards (IRBs) evaluate BCI research protocols for ethical compliance. They assess informed consent, risk/benefit balance, and participant protection. They do not evaluate cybersecurity. A BCI research protocol can receive IRB approval while transmitting neural data in cleartext over an unencrypted wireless link.

**Recommendation:** Include cybersecurity review as part of IRB evaluation for BCI research protocols.

| Timeline | Action |
|----------|--------|
| **Near-term** | BCI Society publishes a cybersecurity checklist for BCI researchers |
| **Medium-term** | IRBs add a cybersecurity assessment section to BCI research protocol review |
| **Medium-term** | BCI Conference (Graz and others) adds a security track for submissions |
| **Long-term** | Cybersecurity assessment becomes standard practice for BCI research ethics review |

### 8.4 International Neuroethics Society: Technical Enforcement Working Group

**The gap:** The International Neuroethics Society (INS) is the premier academic society for neuroethics. Its members define the rights and principles that QIF and similar frameworks aim to enforce technically. No cybersecurity researchers participate in INS, and no INS working group addresses technical enforcement.

**Recommendation:** Establish a working group on technical enforcement of neurorights, with joint membership from neuroethics and cybersecurity.

| Timeline | Action |
|----------|--------|
| **Near-term** | Invite security researchers to present at the INS annual meeting |
| **Medium-term** | Form a joint working group on "Technical Enforcement of Neurorights" |
| **Long-term** | Publish joint papers bridging neuroethics principles and security engineering |

---

# Part III: Implementation Framework

## 9. Phased Timeline

### Phase 1: Exploration (2026-2028)

**Goal:** Establish vocabulary, convene discussions, begin voluntary pilot programs.

| Action | Owner | Success Criteria |
|--------|-------|-----------------|
| Open-source BCI threat taxonomies and scoring frameworks published for community review | BCI security researchers | Multiple frameworks available for evaluation |
| First standards body working group convened (NIST, IEEE, or ISO) | Standards body | Working group charter and initial membership |
| MITRE evaluates BCI-specific techniques through community contribution process | MITRE + BCI security researchers | Initial assessment report |
| BCI manufacturers begin voluntary neural-specific threat modeling | Industry | At least 2 manufacturers pilot BCI-specific threat assessments |
| FDA acknowledges neural devices as a distinct cybersecurity category | FDA/CDRH | Guidance clarification or public communication |
| LSL vulnerability remediated and disclosure process documented | SCCN/Community | CVE assigned, patch available |

### Phase 2: Standardization (2028-2031)

**Goal:** Formal standards development, manufacturer pilots, first assessment criteria.

| Action | Owner | Success Criteria |
|--------|-------|-----------------|
| NIST publishes BCI Security Community Profile for CSF 2.0 | NIST | Published profile with neural subcategories |
| BCI-specific techniques begin appearing in MITRE knowledge base | MITRE | Contributed techniques with evidence |
| Domain-specific BCI vulnerability scoring system published | FIRST SIG or independent body | Specification complementing CVSS |
| IEEE BCI cybersecurity standard enters development | IEEE SA | Draft standard in progress |
| FDA 524B guidance updated with neural-specific considerations | FDA/CDRH | Updated guidance document |
| First IRBs include cybersecurity assessment in BCI research review | Research institutions | At least 5 IRBs pilot cybersecurity checklist |
| UNESCO begins technical annex development | UNESCO + technical standards body | Joint project charter |

### Phase 3: Maturation (2031+)

**Goal:** Recognized standards, assessor ecosystem development, broader compliance adoption.

| Action | Owner | Success Criteria |
|--------|-------|-----------------|
| ISO publishes neural security technical report or standard | ISO/IEC JTC 1/SC 27 | Published document |
| FDA requires neural-specific cybersecurity documentation | FDA/CDRH | Regulatory requirement, not just guidance |
| Qualified BCI security assessors begin training | Standards body + certification body | Assessor training program |
| Cyber insurance incorporates BCI security assessment | Insurance industry | BCI-specific risk questionnaires in use |
| BCI security becomes standard component of research ethics review | Research institutions | Widespread adoption |

**Note:** These timelines are optimistic projections. Standards development processes typically take 3-7 years from working group formation to published standard. Regulatory guidance updates can take 2-5 years. The timelines above assume that the urgency of BCI security will motivate faster-than-typical action, but delays should be expected.

### Timeline Visualization

```
2026     2027     2028     2029     2030     2031     2032+
  |        |        |        |        |        |        |
  |===== Phase 1: Exploration =======|                  |
  |  Vocabulary, working groups,     |                  |
  |  voluntary pilots, evaluation    |                  |
  |                                  |                  |
                    |========= Phase 2: Standardization =========|
                    |  Formal development, manufacturer pilots,   |
                    |  first assessment criteria, guidance updates|
                    |                                             |
                                              |======== Phase 3: Maturation =====>
                                              |  Recognized standards,
                                              |  assessor ecosystem,
                                              |  compliance adoption
```

---

## 10. QIF as Reference Implementation

QIF is one early attempt to address the gaps described in this proposal. It is not the only approach, and it is not a finished product. It is presented here as evidence that the problems are technically tractable, not as a recommendation for adoption. Standards bodies should evaluate, adapt, build upon, or replace every component below based on their own assessment processes.

### Component Summary

| Component | What It Does | Validation Data | Availability |
|-----------|-------------|----------------|--------------|
| **TARA** | BCI threat taxonomy: 109 techniques, 15 tactics, MITRE-compatible IDs | 49 from published literature, 46 recontextualized from neuroscience, 5 chain syntheses, 6 theoretical, 3 neuroethics-formalized. Not independently peer-reviewed. | Apache 2.0, GitHub, PyPI (`qtara`) |
| **NISS** | Neural impact scoring: 5 dimensions CVSS cannot express | All TARA techniques scored. Dimensions informed by clinical research but not clinically validated. | Apache 2.0, GitHub |
| **Hourglass Model** | 11-band security architecture: N7-N1 (neural), I0 (interface), S1-S3 (synthetic) | Architectural model. Mapped against 24 commercial BCI devices and IEC 62443 zones/conduits. | Apache 2.0, GitHub |
| **NSP** | Post-quantum BCI encryption protocol: ML-KEM + ML-DSA + AES-256-GCM-SIV | Estimated 3.25% power overhead at 40 mW in simulation. Uses NIST FIPS 203/204/205 primitives. Not tested on implantable hardware. | Apache 2.0, GitHub, Rust reference implementation |
| **Neurowall** | Real-time neural security monitor: 3-layer defense (signal boundary, inference guard, policy agent) | Detected all 15 simulated attack scenarios in controlled testing. 5% false positive rate. Tested against BrainFlow synthetic board (16 channels). Not tested against real adversaries or in clinical settings. | Apache 2.0, GitHub, Python |
| **Runemate** | Policy engine: DSL for neural security rules with prioritized rule-stack evaluation | 5-rule stack with sustained window tracking. Validated in Neurowall simulation only. | Apache 2.0, GitHub, Rust compiler |

### What QIF Is Not

- QIF is not a standards body. It does not claim authority to define binding requirements.
- QIF is not a certification authority. It proposes certification levels but does not issue certificates.
- QIF is not a complete solution. The validation data comes from simulation, not clinical deployment.
- QIF is not the only approach. Alternative architectures may address the same gaps differently.

### What QIF Suggests Is Feasible

- Neural signal authenticity verification is technically approachable through coherence monitoring (demonstrated in simulation, not in clinical settings).
- BCI-specific threats can be systematically cataloged and scored (109 techniques cataloged, scoring framework defined, neither independently peer-reviewed).
- Post-quantum cryptography may be feasible on implantable power budgets (estimated 3.25% overhead in simulation, not tested on actual implant hardware).
- Neurorights can be mapped to technical security controls (mapping exists, clinical and legal validity not yet established).
- Adaptive policy enforcement can respond to neural threat levels dynamically (demonstrated in simulation only).

### Preprint and DOI

The QIF framework is documented in a Zenodo preprint (DOI: [10.5281/zenodo.18640105](https://doi.org/10.5281/zenodo.18640105)), version 1.4 as of February 2026. The preprint covers the theoretical foundation, hourglass model, TARA taxonomy, NISS scoring, and validation results. All code is available on GitHub under Apache 2.0.

---

## 11. Limitations and Open Questions

This proposal has limitations that should inform how readers evaluate its recommendations.

### Evidentiary Limitations

**No clinical validation.** All technical feasibility evidence comes from simulation and synthetic data. No component has been tested on real human neural data, real BCI hardware, or in clinical environments. The gap between simulation and clinical deployment is significant and uncertain.

**No independent audit.** The QIF framework referenced throughout has not been independently audited, peer-reviewed (beyond preprint), or evaluated by any standards body. The validation data is self-reported by the developer.

**No adversarial testing.** Simulated attack scenarios were designed by the same team that built the defenses. Real adversaries may find attack vectors that simulation does not anticipate. The 15 simulated scenarios should not be taken as comprehensive coverage of the BCI threat space.

**Limited BCI incident data.** Unlike IT security, where decades of breach data inform risk assessment, BCI security has almost no real-world incident data. The threat techniques, scoring weights, and risk assessments in this proposal are based on theoretical analysis and analogical reasoning, not observed attacks on deployed BCIs.

### Scope Limitations

**Single-author perspective.** This proposal reflects one researcher's analysis. It has not been developed through multi-stakeholder consultation, which is the standard process for legitimate policy recommendations. The recommendations should be treated as starting points for discussion, not as vetted policy positions.

**US-centric regulatory analysis.** While international frameworks (EU, Chile, UNESCO) are discussed, the regulatory analysis is most detailed for US frameworks (FDA, HIPAA, state laws). Readers in other jurisdictions should evaluate the recommendations against their own regulatory contexts.

**No cost-benefit analysis.** The proposal recommends actions without estimating their cost to the organizations involved. Standards development, regulatory guidance, and industry adoption all carry significant resource requirements. A complete policy analysis would include cost estimates and economic impact assessment.

**No patient/user input.** The recommendations affect people who use or will use BCIs. This proposal was written without direct input from BCI users, patients, or patient advocacy groups. Their perspectives are essential for legitimate policy development.

### Open Questions

1. **What is the right balance between neural data privacy and security utility?** Differential privacy parameters for neural data have not been empirically validated.
2. **How should "cognitive integrity" be defined for compliance purposes?** The term appears in law (SB 1223) but has no technical definition that clinicians, engineers, and regulators agree on.
3. **Are the proposed timelines realistic?** Standards development often takes longer than projected. The phases above assume motivation; experience suggests friction.
4. **Will voluntary adoption work?** PCI DSS and NIST CSF succeeded as voluntary standards, but BCI security may require regulatory mandates if the market is too small to generate adoption pressure.
5. **What happens when the first real BCI security incident occurs?** This proposal assumes a proactive approach. A major incident could accelerate or distort the standardization process in unpredictable ways.

---

## 12. How to Engage

### For Standards Bodies

- Review the TARA taxonomy and NISS scoring framework at [github.com/qinnovates/qinnovate](https://github.com/qinnovates/qinnovate)
- Contact the author to discuss working group participation
- Use any QIF component as reference material in standards development (Apache 2.0 license)

### For Regulators

- Reference this proposal when developing neural-device-specific guidance
- Engage with the BCI manufacturer community on technical security requirements
- Consider TARA and NISS as examples of neural-specific threat modeling and scoring

### For BCI Manufacturers

- Run TARA against your device architecture to identify neural-specific threats
- Score identified threats with NISS to capture dimensions CVSS misses
- Implement QIF-Basic (R1-R5) as a starting point for neural security
- Participate in standards body working groups to shape the standards you will need to comply with

### For Researchers

- Include cybersecurity assessment in BCI research protocols
- Submit security-focused papers to BCI conferences
- Use the QIF framework as a teaching tool for interdisciplinary courses

### For Everyone

- The code is open source: [github.com/qinnovates/qinnovate](https://github.com/qinnovates/qinnovate)
- The preprint is open access: [doi.org/10.5281/zenodo.18640105](https://doi.org/10.5281/zenodo.18640105)
- Issues, feedback, and contributions are welcome on GitHub

---

## Appendix A: Complete Regulatory Coverage Matrix

This matrix maps which frameworks address which security properties for BCIs. **X** = full coverage, **~** = partial coverage, empty = no coverage.

| Security Property | FDA | FDORA | HIPAA | State Laws | Chile | EU MDR | EU AI Act | NIST 800-53 | ISO 27001 | IEC 62443 | SOC 2 | Neurorights | QIF |
|-------------------|-----|-------|-------|------------|-------|--------|-----------|-------------|-----------|-----------|-------|-------------|-----|
| Device safety | X | | | | | X | | | | | | | |
| Software patching | | X | | | | | | ~ | | ~ | | | |
| Data confidentiality | | | X | X | X | | | X | X | X | X | X | X |
| Data integrity | | | ~ | | | | | X | X | X | X | | X |
| Access control | | | X | | | | | X | X | X | X | | X |
| Encryption | | | ~ | | | | | X | X | X | | | X |
| Audit logging | | | X | | | | | X | X | | X | | X |
| Consent | | | X | X | X | | | | | | ~ | X | X |
| **Neural signal authenticity** | | | | | | | | | | | | | **X** |
| **Adversarial stimulation prevention** | | | | | | | | | | | | | **X** |
| **Cognitive state integrity** | | | | | | | | | | | | ~ | **X** |
| **Neural re-identification** | | | | ~ | | | | | | | | ~ | **X** |
| **Biological impact scoring** | | | | | | | | | | | | | **X** |
| **Consent violation severity** | | | | | | | | | | | | | **X** |
| **Reversibility assessment** | | | | | | | | | | | | | **X** |

Source: [NEUROSECURITY_GOVERNANCE.md, Section 2](NEUROSECURITY_GOVERNANCE.md#2-the-grc-gap)

---

## Appendix B: 25-Organization Directory

| # | Organization | Domain | Type | Neurotech Engagement | Security Engagement | Bridge Potential | Specific Ask |
|---|-------------|--------|------|---------------------|---------------------|-----------------|-------------|
| 1 | NIST | Security | Standards | None | Comprehensive | High | BCI Security Profile for CSF 2.0 |
| 2 | ISO/IEC | Security | Standards | None | Comprehensive | Medium | Neural data classification in ISO 27799 |
| 3 | IEEE SA | Security | Standards | Indirect | Comprehensive | High | BCI Cybersecurity Standard (P27XX) |
| 4 | MITRE | Security | Standards | None | Comprehensive | High | Neural ATT&CK sub-matrix |
| 5 | FIRST/CVSS | Security | Standards | None | Comprehensive | High | Neural impact metrics for CVSS |
| 6 | OWASP | Security | Industry | None | Comprehensive | Medium | BCI Security Top 10 |
| 7 | IEC 62443 | Security | Standards | None | Comprehensive | Medium | Map zones/conduits to BCI boundaries |
| 8 | CISA | Security | Regulatory | None | Comprehensive | Medium | Neural device threat intelligence |
| 9 | ENISA | Security | Regulatory | Minimal | Comprehensive | Medium | Neurotechnology threat report |
| 10 | ISC2 | Security | Certification | None | Comprehensive | Low | Neurosecurity specialization |
| 11 | ISACA | Security | Certification | None | Comprehensive | Low | Neurotechnology governance in COBIT |
| 12 | PCI SSC | Security | Certification | None | Comprehensive | Low | Model for certification tiers |
| 13 | UNESCO | Neuroethics | Standards | Comprehensive | None | High | Technical annex for 2025 Recommendation |
| 14 | OECD | Neuroethics | Standards | Direct | Indirect | High | Cross-committee working paper |
| 15 | Neurorights Foundation | Neuroethics | Advocacy | Comprehensive | None | Medium | Map neurorights to security controls |
| 16 | Int'l Neuroethics Society | Neuroethics | Academic | Comprehensive | None | Medium | Joint security working group |
| 17 | BCI Society | Neuroethics | Academic | Comprehensive | Minimal | Medium | Security track at BCI Conference |
| 18 | Berman Institute (JHU) | Neuroethics | Academic | Direct | None | Medium | Security of abandoned devices |
| 19 | FDA/CDRH | Medical | Regulatory | Direct | Indirect | High | Neural threat categories in 524B |
| 20 | EU MDR/EMA | Medical | Regulatory | Indirect | Indirect | Medium | Unified MDR + AI Act pathway |
| 21 | Chile (Law 21.383) | Policy | Regulatory | Comprehensive | None | Medium | Technical implementation standards |
| 22 | Colorado/California | Policy | Regulatory | Direct | None | Low | Model legislation with security reqs |
| 23 | IEEE Brain Initiative | Security | Industry | Direct | Indirect | High | BCI cybersecurity working group |
| 24 | DARPA | Security | Regulatory | Comprehensive | Comprehensive | High | Dedicated BCI security research program |
| 25 | EFF | Policy | Advocacy | Minimal | Direct | Medium | Neurorights position paper |

Source: [convergence-data.ts](../src/data/convergence-data.ts)

---

## Appendix C: QIF Technical Summary Card

```
QIF — Quantified Interconnection Framework for Neural Security
Version: 4.0 (Hourglass Model)
License: Apache 2.0
Preprint: doi.org/10.5281/zenodo.18640105

Architecture: 11-Band Hourglass (7-1-3)
  N7 (Cortex) → N6 → N5 → N4 → N3 → N2 → N1 → I0 (Interface) → S1 → S2 → S3 (Cloud)

Components:
  TARA    109 techniques | 15 tactics | MITRE-compatible IDs
  NISS    5 neural impact dimensions | 0-10 scale | extends CVSS
  NSP     Post-quantum encryption | ML-KEM + ML-DSA | 3.25% power overhead
  Neurowall  3-layer defense | 15 attacks tested | 5% FPR | auto-calibrating
  Runemate   Policy DSL | 5-rule stack | Rust compiler

Validation (simulation only, not clinically validated):
  Neurowall: 15 simulated attack scenarios detected, 5% FPR
  NSP: Estimated 3.25% power overhead at 40 mW (FIPS 203/204/205)
  TARA: 49 literature-sourced + 46 recontextualized + 14 novel
  BrainFlow: 16-channel synthetic board validation

Code: github.com/qinnovates/qinnovate
PyPI: pip install qtara
```

---

## Appendix D: Glossary

| Term | Definition |
|------|-----------|
| **ATT&CK** | Adversarial Tactics, Techniques, and Common Knowledge. MITRE's threat knowledge base. |
| **BCI** | Brain-Computer Interface. A device that reads from and/or writes to the brain. |
| **Coherence Metric (Cs)** | QIF's signal trustworthiness score combining phase, transport, and gain variance. Range [0,1]. |
| **CSF** | NIST Cybersecurity Framework. Six functions: Govern, Identify, Protect, Detect, Respond, Recover. |
| **CVSS** | Common Vulnerability Scoring System. Scores vulnerability severity on a 0-10 scale. Maintained by FIRST. |
| **Differential Privacy** | Mathematical framework for adding calibrated noise to data to prevent re-identification while preserving statistical utility. |
| **FDORA** | Food and Drug Omnibus Reform Act (2022). Section 3305 mandates cybersecurity for medical devices. |
| **GRC** | Governance, Risk, and Compliance. The organizational discipline connecting policy to implementation. |
| **Hourglass Model** | QIF's 11-band security architecture: 7 neural bands (N7-N1), 1 interface band (I0), 3 synthetic bands (S1-S3). |
| **I0** | Interface Zero. The hourglass band where biology meets silicon. The critical trust boundary. |
| **ICS** | Industrial Control Systems. Physical systems controlled by software, analogous to BCIs. |
| **ML-KEM** | Module-Lattice-Based Key Encapsulation Mechanism. NIST FIPS 203. Post-quantum key exchange. |
| **ML-DSA** | Module-Lattice-Based Digital Signature Algorithm. NIST FIPS 204. Post-quantum signatures. |
| **Neurorights** | Rights proposed by Ienca & Andorno (2017): cognitive liberty, mental privacy, mental integrity, psychological continuity. |
| **Neurowall** | QIF's real-time neural security monitor. Three layers: signal boundary, inference guard, policy agent. |
| **NISS** | Neural Impact Scoring System. Five neural-specific severity dimensions extending CVSS. |
| **NSP** | Neural Security Protocol. Post-quantum encryption protocol for BCI data links. |
| **PQC** | Post-Quantum Cryptography. Cryptographic algorithms resistant to quantum computing attacks. |
| **Runemate** | QIF's policy engine. Domain-specific language for neural security rules. |
| **SB 1223** | California Senate Bill 1223 (2025). Adds neural data as sensitive personal information under CCPA. |
| **SPHINCS+** | Stateless Hash-Based Signature Scheme. NIST FIPS 205. Post-quantum signatures with large signature size. |
| **TARA** | Threat Assessment for Risk Analysis. QIF's BCI threat taxonomy: 109 techniques, 15 tactics. |

---

## Appendix E: References

### Academic and Research

Bonaci, T., Calo, R., & Chizeck, H. J. (2014). App Stores for the Brain: Privacy and Security in Brain-Computer Interfaces. *IEEE Ethics in Engineering, Science and Technology*.

Denning, T., Matsuoka, Y., & Kohno, T. (2009). Neurosecurity: Security and Privacy for Neural Devices. *Neurosurgical Focus*, 27(1), E7.

Ienca, M., & Andorno, R. (2017). Towards new human rights in the age of neuroscience and neurotechnology. *Life Sciences, Society and Policy*, 13, 5.

Lazaro-Munoz, G., Pham, M. T., Munoz, K. A., et al. (2022). Post-trial access in implanted neural device research: Device maintenance, abandonment, and cost. *Brain Stimulation*, 15(5), 1029-1036.

Lopez Bernal, S., Celdran, A. H., & Perez, G. M. (2021). A Framework and Taxonomy of Attacks on Brain-Computer Interfaces. *arXiv preprint*.

Martinovic, I., Davies, D., Frank, M., Perito, D., Ros, T., & Song, D. (2012). On the Feasibility of Side-Channel Attacks with Brain-Computer Interfaces. *USENIX Security Symposium*.

Qi, K. (2026). Quantified Interconnection Framework for Neural Security. *Zenodo*. DOI: 10.5281/zenodo.18640105.

Yuste, R., et al. (2017). Four ethical priorities for neurotechnologies and AI. *Nature*, 551, 159-163.

### Regulatory and Standards

EU AI Act, Regulation (EU) 2024/1689 (2024).

EU Medical Device Regulation (MDR) 2017/745 (2017).

FDA. (2023). Cybersecurity in Medical Devices: Quality System Considerations and Content of Premarket Submissions. Guidance for Industry and FDA Staff.

FDORA Section 3305 / PATCH Act. Food and Drug Omnibus Reform Act of 2022, Pub. L. 117-328.

FIRST. (2023). Common Vulnerability Scoring System v4.0 Specification.

HIPAA Security Rule, 45 CFR Part 164 (1996, amended).

IEC 62443. Industrial communication networks: Network and system security (2009-present).

ISO/IEC 27001:2022. Information security, cybersecurity and privacy protection.

NIST. (2024). Cybersecurity Framework 2.0. NIST CSWP 29.

NIST. (2020). Security and Privacy Controls for Information Systems and Organizations. SP 800-53 Rev. 5.

### Neurorights and Ethics

Chile Law 21.383 (2021). Constitutional amendment protecting cerebral activity.

Colorado HB 24-1058 (2024). Protections for Biological and Neural Data.

California SB 1223 (2025). Neural Data as Sensitive Personal Information.

OECD. (2019). Recommendation on Responsible Innovation in Neurotechnology.

UNESCO. (2025). Recommendation on the Ethics of Neurotechnology. 43rd General Conference.

---

## Document History

| Version | Date | Changes |
|---------|------|---------|
| 1.2 | 2026-02-21 | ChatGPT cross-AI review: legal accuracy caveats (FDA non-binding, HIPAA scope, GDPR unlitigated, state laws privacy-not-security), clinical research governance noted, existing standards adaptability acknowledged |
| 1.1 | 2026-02-21 | Gemini cross-AI review: conflict of interest disclosure, qualified validation claims, stretched timelines, audience routing expanded, tone recalibrated, limitations section added |
| 1.0 | 2026-02-21 | Initial publication |

---

## Related Documents

- [NEUROSECURITY_GOVERNANCE.md](NEUROSECURITY_GOVERNANCE.md) (the analysis this proposal builds on)
- [POST_DEPLOYMENT_ETHICS.md](POST_DEPLOYMENT_ETHICS.md) (device lifecycle and abandonment)
- [INFORMED_CONSENT_FRAMEWORK.md](INFORMED_CONSENT_FRAMEWORK.md) (consent protocols)
- [QIF Framework README](../qif-framework/README.md) (technical framework overview)
- [NSP Protocol Spec](../qif-framework/NSP-PROTOCOL-SPEC.md) (encryption protocol)
- [Neurowall](../tools/neurowall/README.md) (neural security monitor)

---

*Published under [Apache 2.0](../LICENSE) alongside the rest of the Qinnovate project.*
