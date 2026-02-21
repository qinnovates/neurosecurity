---
title: "Neurosecurity Governance"
description: "Unified governance framework: why neurosecurity exists, what regulatory gaps it fills, how it maps to neuroethics and UNESCO principles, and the convergence strategy to connect security GRC with brain science."
order: 5
---

# Neurosecurity Governance

> Unified governance framework for brain-computer interface security. Covers the discipline of neurosecurity, the regulatory gap analysis, neuroethics and UNESCO alignment, regulatory compliance, and the convergence strategy to connect security GRC with brain science.

**Last Updated:** 2026-02-21
**Version:** 3.0

---

## Table of Contents

- [1. Why Neurosecurity](#1-why-neurosecurity)
- [2. The GRC Gap](#2-the-grc-gap)
- [3. Framework-by-Framework Analysis](#3-framework-by-framework-analysis)
- [4. Neuroethics Alignment](#4-neuroethics-alignment)
- [5. UNESCO Alignment](#5-unesco-alignment)
- [6. Regulatory Compliance](#6-regulatory-compliance)
- [7. The Convergence Problem](#7-the-convergence-problem)
- [8. Convergence Strategy and Outreach](#8-convergence-strategy-and-outreach)
- [9. Open Invitation](#9-open-invitation)
- [References](#references)
- [Document History](#document-history)
- [Related Documents](#related-documents)

---

## 1. Why Neurosecurity

> Neuroethics writes the policies. Neuroscience explains the biology. Cybersecurity builds the defenses. Neurosecurity is the bridge.

### The Gap

Three fields converge on brain-computer interfaces, but none of them covers the full problem:

**Neuroethics** defines what should and should not be done with BCIs. What constitutes consent. What rights people have over their neural data. It writes the rules. The three techniques in TARA tagged as "neuroethics_formalized" (identity erosion, agency manipulation, self-model corruption) came from neuroethics researchers (Yuste et al. 2017, Ienca & Andorno 2017, Goering et al. 2021) because they were the first to articulate these as harms.

**Neuroscience** provides the mechanism understanding. How neural signals actually work, what is physically possible, what the attack surface looks like. The 46 "qif_recontextualized" techniques in TARA came from neuroscience, physics, and sensor research. You cannot build a defense if you do not understand the biology.

**Cybersecurity** operationalizes it. Threat models, detection systems, scoring frameworks, incident response. The 49 techniques tagged as "literature" in TARA came from published BCI security research that already named these attacks.

The gap: neither neuroethics nor neuroscience has the operational security toolkit to actually detect, prevent, and respond to BCI threats. Neuroethics can say "mental privacy matters" but cannot tell you how to detect a P300 interrogation attack in real time. Neuroscience can explain how temporal interference reaches deep brain structures but does not score the severity or map the attack chain.

### The Lesson from IT Security

Information security learned this the hard way. Governance, Risk, and Compliance (GRC) was **retrofitted** onto existing security infrastructure decades after the internet shipped. The result: compliance frameworks that lag years behind threats, checkbox security that satisfies auditors but not attackers, and a permanent gap between policy and enforcement.

We do not need to repeat that for the brain.

BCI technology is still early. The window to build security into the foundation, not bolt it on later, is open now. That means neurosecurity needs to be designed alongside the neuroscience and neuroethics, not added after the first breach.

### What Neurosecurity Does

Neurosecurity takes phenomena described by neuroscientists and concerns raised by neuroethicists and puts them into a formal, testable, scoreable security framework.

#### From Neuroethics: Policies Become Enforceable

| Neuroethics Says | Neurosecurity Implements |
|-----------------|------------------------|
| "People have a right to mental privacy" | NSP encrypts all neural data in transit with post-quantum cryptography |
| "Cognitive liberty must be protected" | QIF coherence metric detects injected signals; Neurowall blocks unauthorized stimulation |
| "Neural data is sensitive" | TARA catalogues 103 exfiltration vectors; NISS scores their severity |
| "Consent must be informed" | Informed consent framework with pediatric and incapacity protocols, regulatory crosswalk |

#### From Neuroscience: Mechanisms Become Threat Models

| Neuroscience Knows | Neurosecurity Maps |
|-------------------|-------------------|
| Temporal interference can target deep brain structures (Grossman et al. 2017) | QIF-T0013: Deep targeting attack, NISS score 7.2, detected by spectral peak analysis |
| EEG signals can be decoded for P300 responses (Martinovic et al. 2012) | QIF-T0035: P300 interrogation, NISS score 5.6, countermeasure: response obfuscation |
| Consumer earbuds can capture in-ear EEG (Kaveh et al. 2020) | QIF-T0073 through T0074: Consumer sensor escalation chain to cognitive profiling |
| Bifurcation dynamics govern neural state transitions (Izhikevich 2007) | QIF-T0068: Bifurcation forcing attack, detected by CUSUM change-point analysis |

#### From Cybersecurity: TTPs for the Brain

| Cybersecurity Provides | Applied to BCIs As |
|----------------------|-------------------|
| MITRE ATT&CK taxonomy | TARA: 109 techniques across 15 tactics, MITRE-compatible IDs |
| CVSS scoring | NISS: 5 neural-specific metrics that CVSS cannot express (biological impact, cognitive integrity, consent violation, reversibility, neuroplasticity) |
| Zero-trust architecture | QIF: every signal validated at every band crossing; no implicit trust |
| Threat detection and response | Neurowall: real-time coherence monitoring, spectral anomaly detection, CUSUM change-point analysis |

### How Security GRC Actually Works

In IT security, Governance, Risk, and Compliance (GRC) follows a well-established cycle. Understanding this cycle is essential because neurosecurity needs to build the same discipline, not reinvent it.

#### The GRC Flow (IT Security)

```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│  ┌──────────────────────┐                                           │
│  │  1. EXTERNAL FORCES  │  Regulations: HIPAA, PCI-DSS, SOX, GDPR  │
│  │     SET REQUIREMENTS │  Standards: NIST CSF, ISO 27001, CIS      │
│  │                      │  Contracts: SOC 2, customer questionnaires │
│  └──────────┬───────────┘                                           │
│             │                                                       │
│             ▼                                                       │
│  ┌──────────────────────┐                                           │
│  │  2. GRC TRANSLATES   │  Maps requirements to controls            │
│  │     INTO POLICY      │  Writes internal security policies        │
│  │                      │  Maintains the risk register              │
│  └──────────┬───────────┘                                           │
│             │                                                       │
│             ▼                                                       │
│  ┌──────────────────────┐                                           │
│  │  3. SECURITY ENG     │  Firewalls, encryption, access mgmt       │
│  │     IMPLEMENTS       │  Monitoring, detection, response          │
│  │                      │  Architecture, code, infrastructure       │
│  └──────────┬───────────┘                                           │
│             │                                                       │
│             ▼                                                       │
│  ┌──────────────────────┐                                           │
│  │  4. GRC AUDITS       │  Evidence collection, gap analysis        │
│  │     ADHERENCE        │  Audit prep, remediation tracking         │
│  │                      │  Continuous monitoring, reporting         │
│  └──────────┬───────────┘                                           │
│             │                                                       │
│             └───────────────────── loops back to 1 ─────────────────┘
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

This cycle works because every step has mature infrastructure behind it. HIPAA tells you what to protect. NIST tells you how. Your security team builds the controls. Your GRC team audits the evidence.

#### The BCI Security Delta

For BCIs, this cycle is broken at step 1. The external forces barely exist:

| GRC Step | IT Security (Mature) | BCI Security (Today) | Delta |
|----------|---------------------|---------------------|-------|
| **1. External Requirements** | HIPAA, PCI-DSS, SOX, GDPR, FedRAMP, CMMC | FDA 510(k) covers safety but not neural-specific cybersecurity. FDORA Section 3305 (Patch Act) is the closest. No "HIPAA for neural data." No "PCI-DSS for BCIs." | **Critical gap**: no neural-specific regulations to comply with |
| **2. GRC Policy Translation** | Established frameworks (NIST CSF, ISO 27001, CIS Controls) map to organizational controls | No neural-specific framework existed before QIF. NIST/ISO controls are generic, not neural-aware. | **Structural gap**: existing frameworks lack neural metrics (tissue damage, cognitive integrity, consent violation) |
| **3. Security Implementation** | Firewalls, IDS/IPS, SIEM, encryption, IAM | No commercial BCI security tools. No neural firewalls. No BCI-specific encryption protocols. | **Tooling gap**: everything must be built from scratch |
| **4. Compliance Auditing** | SOC 2 auditors, PCI QSAs, HIPAA assessors, automated scanning | No BCI security auditors exist. No compliance certifications. No audit criteria. | **Ecosystem gap**: no one to audit, nothing to audit against |

### Marr's Three Levels

David Marr (1982) argued that understanding any information processing system requires three levels:

1. **Computational** (what problem is being solved?) = neuroethics
2. **Algorithmic** (what process solves it?) = neuroscience
3. **Implementational** (what physical system runs it?) = cybersecurity

Neurosecurity is the discipline that connects all three. You need DSM-5-TR diagnostic mappings, TTPs, BCI limits equations, physics constraints, and neuroscience before you can start the actual security work. That is why QIF integrates all of them.

### The Origin Classification

Every technique in TARA has been classified by its intellectual origin:

| Category | Count | What It Means |
|----------|-------|--------------|
| **Literature** | 49 | Attack already named in published BCI security research. QIF maps it into the framework. |
| **QIF Recontextualized** | 46 | Phenomenon from neuroscience, physics, RF engineering, or sensor research that QIF identifies as a BCI security threat for the first time. |
| **QIF Chain Synthesis** | 5 | Novel composite attack chain combining existing techniques into a new threat model. |
| **QIF Theoretical** | 6 | Pure QIF derivation with no existing literature source. |
| **Neuroethics Formalized** | 3 | Neuroethics concern (identity erosion, agency manipulation, self-model corruption) formalized as a concrete, scoreable security technique. |

Original authors are credited in every technique entry. QIF's contribution is the formal framework mapping, not the invention of the underlying phenomena.

---

## 2. The GRC Gap

### The Three Regulatory Domains

BCI security sits at the intersection of three regulatory domains that do not talk to each other:

**Domain A: Medical Device Regulations** (FDA, FDORA, EU MDR)
Controls device safety, manufacturing quality, and (recently) cybersecurity. Does not address neural data as a special category.

**Domain B: Privacy and Neurorights** (State neurorights laws, HIPAA, GDPR Art. 9, Chile Law 21.383, UNESCO 2025)
Controls consent, data handling, and (aspirationally) cognitive liberty. Does not specify technical security controls.

**Domain C: IT Security Frameworks** (NIST SP 800-53, ISO 27001, IEC 62443, SOC 2, PCI DSS)
Provides comprehensive control catalogs for information systems. Does not address biological endpoints, neural data properties, or cognitive impact.

The gap is the center: **no framework addresses all three simultaneously.** A BCI manufacturer can be FDA-cleared, HIPAA-compliant, and ISO 27001-certified, and still have zero protections against adversarial neurostimulation, neural signal tampering, or cognitive state inference.

### The Seven Unaddressed Properties

Across all three domains, no existing framework addresses these properties unique to neural data:

| # | Property | Why It's Different | Closest Existing Analog | Why the Analog Fails |
|---|----------|--------------------|------------------------|---------------------|
| 1 | **Neural signal authenticity** | The signal IS the user's thoughts. Tampering affects cognition, not just data. | Data integrity (NIST SI) | SI verifies bits. Neural authenticity verifies that a signal reflects genuine neural activity, not injected patterns. |
| 2 | **Adversarial neurostimulation prevention** | BCIs can write to the brain, not just read. A compromised write channel causes neurological harm. | Command injection (OWASP) | Command injection crashes a server. Neural injection can cause seizures, personality changes, or memory loss. |
| 3 | **Cognitive state integrity** | Neural data reveals and affects subjective experience. | Processing integrity (SOC 2) | SOC 2 checks data accuracy. Cognitive integrity means the person's subjective experience has not been altered. |
| 4 | **Neural re-identification risk** | Brain signals may be as unique as fingerprints. De-anonymization is potentially permanent. | Biometric data (GDPR Art. 9) | GDPR covers biometric categories but has no provisions for neural-specific re-identification or the inability to "reset" a brain signature. |
| 5 | **Right to disconnect** | Implanted devices cannot be easily removed. "Turning it off" may disable critical function. | Availability (CIA triad) | Availability assumes the system can be taken offline for maintenance. A neural prosthesis controlling communication cannot. |
| 6 | **Surgical update constraint** | Security patches may require surgery. The cost of remediation is medical, not just operational. | Vulnerability management (FDORA) | FDORA requires patching. It does not account for the fact that a firmware update may require a craniotomy. |
| 7 | **Cognitive integrity as security property** | "Cognitive integrity" (the person's sense of self and agency remains intact) has no equivalent in any security framework. | Psychological Continuity (Ienca) | Ienca defines it as a right. No framework defines it as a measurable, testable security property. NISS does. |

### Regulatory Coverage Matrix

This matrix maps which frameworks cover which security properties for BCIs. An X means the framework addresses this property. A tilde (~) means partial coverage. Empty means no coverage.

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
| Neural signal authenticity | | | | | | | | | | | | | X |
| Adversarial stimulation prevention | | | | | | | | | | | | | X |
| Cognitive state integrity | | | | | | | | | | | | ~ | X |
| Neural re-identification | | | | ~ | | | | | | | | ~ | X |
| Biological impact scoring | | | | | | | | | | | | | X |
| Consent violation severity | | | | | | | | | | | | | X |
| Reversibility assessment | | | | | | | | | | | | | X |

The bottom five rows are properties that only QIF addresses. They are the gap this project fills.

---

## 3. Framework-by-Framework Analysis

### Domain A: Medical Device Regulations

#### FDA BCI Guidance (May 2021)

**What it says:** "Implanted Brain-Computer Interface (BCI) Devices for Patients with Paralysis or Amputation: Non-clinical Testing and Clinical Considerations." Covers electrode arrays, signal processing, biocompatibility, chronic reliability, and clinical endpoints.

**What it covers for BCIs:** Biocompatibility testing, chronic implant reliability, clinical study design for motor BCIs.

**Gap:** Scoped only to patients with paralysis or amputation. No cybersecurity requirements for the neural data pathway. No guidance on adversarial signal injection, neural signal authentication, or integrity of decoded signals. No mention of consumer BCIs.

#### FDORA Section 3305 / Patch Act (Dec 2022, effective March 2023)

**What it says:** Defines "cyber device" as any device with software vulnerable to cybersecurity threats. Requires SBOM, vulnerability monitoring, coordinated disclosure, and postmarket patching. Civil penalties up to $15,000/violation, $1,000,000/proceeding.

**What it covers for BCIs:** Any BCI with software (all of them) qualifies as a "cyber device." SBOM, patching, and disclosure requirements apply. This is the closest existing federal cybersecurity mandate.

**Gap:** Treats BCIs identically to insulin pumps or MRI machines. No recognition that neural data has unique integrity and confidentiality requirements. No neural-specific threat categories. No cognitive impact assessment.

#### FDA Cybersecurity Guidance (Feb 2026, final)

**What it says:** Implements Section 524B of the FD&C Act. Requires threat modeling, security architecture documentation, SBOM, vulnerability monitoring, and coordinated disclosure for all premarket submissions. Aligns with new Quality Management System Regulation (QMSR).

**What it covers for BCIs:** General cybersecurity lifecycle requirements. Threat modeling and risk assessment are mandatory.

**Gap:** Contains no neural-data-specific controls. Does not address the unique threat surface of neural signal manipulation, adversarial neurostimulation, or cognitive/identity impacts of BCI compromise. Threat modeling frameworks referenced (STRIDE, CVSS) lack neural dimensions.

#### EU Medical Device Regulation (MDR 2017/745)

**What it says:** Neural implants classified as Class III (highest risk) under Rule 8 (invasive devices in contact with CNS) and Rule 20 (brain stimulation equipment). Requires conformity assessment by Notified Body, clinical evaluation, post-market surveillance.

**What it covers for BCIs:** Comprehensive safety classification. Strictest regulatory pathway in the world for neural implants.

**Gap:** MDR predates modern cybersecurity requirements. No cybersecurity-specific guidance for neural implants. The intersection with the EU AI Act creates dual compliance obligations but no unified neural-data-specific security standard.

#### FCC MedRadio (47 CFR Part 95, Subpart I)

**What it says:** Wireless medical devices including implanted BCIs must operate in the 401-406 MHz band (EIRP 25 microwatts) or MBAN 2360-2400 MHz band.

**What it covers for BCIs:** Electromagnetic interference prevention, spectrum allocation for wireless neural links.

**Gap:** Addresses RF spectrum, not data security. A wireless BCI could be FCC-compliant while transmitting neural data in cleartext with no authentication. No requirements for encrypted medical device communications.

### Domain B: Privacy and Neurorights

#### Colorado HB 24-1058 (effective Aug 2024)

**What it says:** First-in-nation. Adds "biological data" and "neural data" as protected categories under the Colorado Privacy Act. Requires affirmative opt-in consent.

**What it covers for BCIs:** Legal protection for neural data. Consent requirements for collection and use.

**Gap:** Addresses privacy (consent, disclosure, data handling) but not security controls. No encryption standards, access controls, or incident response requirements. No definition of what "securing" neural data means technically.

#### California SB 1223 (effective Jan 2025)

**What it says:** Amends CCPA to classify "neural data" as sensitive personal information. Defines neural data as "information generated by measuring the activity of a consumer's central or peripheral nervous system, not inferred from nonneural information."

**What it covers for BCIs:** Stricter consent requirements, disclosure obligations for neural data processors.

**Gap:** Same as Colorado. Privacy law, not security law. No technical controls specified.

#### HIPAA Security Rule (45 CFR Part 164)

**What it says:** Administrative, physical, and technical safeguards for Protected Health Information. Access control, audit controls, integrity controls, transmission security.

**What it covers for BCIs:** Neural data collected in clinical settings (hospitals, physician practices) is PHI. HIPAA safeguards apply to covered entities and business associates.

**Gap:** Consumer BCIs (headbands, gaming EEG, wellness neurofeedback) are **not covered** because they are not used by covered entities. Encryption is "addressable" (recommended but not required), which is inadequate for neural data. No concept of neural data integrity, cognitive state protection, or neural signal authenticity.

#### Chile Law 21.383 (Oct 2021)

**What it says:** Constitutional amendment protecting cerebral activity and information derived from it. Brain data treated with the same legal status as an organ (cannot be bought, sold, trafficked, or manipulated).

**What it covers for BCIs:** Constitutional-level protection. Strongest legal framework for neurorights globally.

**Gap:** Aspirational and declaratory. The implementing legislation is still in development. No technical cybersecurity standards specified. Cannot be audited or enforced technically.

#### EU AI Act (effective Aug 2026 for high-risk)

**What it says:** BCIs with AI components classified as high-risk under Article 6(1) + Annex I (safety components of MDR devices) and Annex III Section 1 (biometric systems). Requires risk management, data governance, human oversight, accuracy/robustness/cybersecurity (Article 15).

**What it covers for BCIs:** High-risk classification for AI-enabled BCIs. Cybersecurity explicitly required (Article 15).

**Gap:** Article 15 cybersecurity requirements are general. No neural-specific controls. No guidance on what "robustness" means for neural signal processing, or how to test adversarial attacks on neural decoders.

#### UNESCO Neurotechnology Ethics (Nov 2025)

**What it says:** First global ethical framework for neurotechnology. Values: respect for human rights/dignity, health/well-being, diversity, sustainability, professional integrity. Prohibitions on coercive enhancement.

**What it covers for BCIs:** Global consensus on ethical principles. Non-binding guidance.

**Gap:** Governance-level only. No technical controls. No specification of what "safeguarding" means in engineering terms.

#### Ienca & Andorno (2017): Four Neurorights

**What it says:** Proposes four rights: Cognitive Liberty, Mental Privacy, Mental Integrity, Psychological Continuity.

**Security mapping:**
- Mental Privacy = Confidentiality (protection against unauthorized reading)
- Mental Integrity = Integrity (protection against unauthorized writing)
- Cognitive Liberty = Authorization/Consent (protection against coercive use)
- Psychological Continuity = Availability + State Preservation (protection against identity alteration)

**Gap:** Philosophical/legal constructs with no technical implementation guidance. No mapping to security controls, no measurable compliance criteria. QIF provides the first such mapping.

#### Yuste et al. (2017): Four Ethical Priorities

**What it says:** Privacy and consent, agency and identity, augmentation equity, bias protection.

**Gap:** Same as Ienca & Andorno. High-level priorities with no technical specification.

#### OECD Responsible Innovation in Neurotechnology (2019)

**What it says:** Nine principles including "safeguard personal brain data" (Principle 7) and "anticipate misuse" (Principle 9).

**Gap:** Governance-level guidance with no technical controls. No specification of what "safeguarding" or "anticipating" means in engineering terms.

### Domain C: IT Security Frameworks

#### NIST SP 800-53 Rev 5

**What it says:** 20 control families, 1,150+ controls. Access Control (AC), System Integrity (SI), System/Communications Protection (SC), Audit (AU), Identification/Authentication (IA), Privacy (PT), Supply Chain (SR).

**What it covers for BCIs:**
- AC: Who can access neural data streams, send stimulation commands, access decoded cognitive states
- SI: Integrity verification of neural signal processing pipeline
- SC: Encryption of neural data in transit/at rest, RF link protection
- AU: Logging of all neural data access and stimulation commands
- IA: Device authentication, firmware update authentication

**Gap:** Technology-agnostic. No neural-data-specific controls. No control addresses "cognitive integrity," "neural signal authenticity," "biological impact assessment," or "consent violation severity." NISS metrics (biological impact, cognitive integrity, consent violation, reversibility, neuroplasticity) have no NIST equivalent.

#### NIST Cybersecurity Framework 2.0 (Feb 2024)

**What it says:** Six functions: Govern, Identify, Protect, Detect, Respond, Recover. Govern is new and placed at center.

**What it covers for BCIs:** The Govern function aligns with neurotechnology oversight boards, ethical review of security trade-offs, and supply chain management for neural implant components.

**Gap:** Sector-agnostic. No healthcare or medical device profile published for CSF 2.0. No neural-data-specific subcategories.

#### ISO/IEC 27001:2022

**What it says:** 93 controls in four themes (Organizational, People, Physical, Technological). Information Security Management System (ISMS) standard.

**What it covers for BCIs:** Control objectives (confidentiality, integrity, availability) apply to neural data. Organizational and people controls apply to BCI development teams.

**Gap:** Designed for organizational information systems, not embedded medical devices. No neural-data-specific controls. No asset classification for neural data. Physical security controls assume traditional IT infrastructure, not surgically implanted hardware.

#### IEC 62443 (Industrial Automation and Control Systems Security)

**What it says:** Zones and conduits model. Security levels SL-1 through SL-4. Secure product development lifecycle (Part 4-1). Component security requirements (Part 4-2). FDA recognizes IEC 62443 as a consensus standard for medical devices (2014).

**What it covers for BCIs:** Closest architectural parallel. BCIs are cyber-physical systems like industrial control systems. Zones: implant, external controller, clinician workstation, cloud platform. Conduits: RF link, USB, internet. Security levels map to attacker sophistication.

**Gap:** Does not address biological endpoints. Threat models assume industrial processes (valves, motors), not neural tissue. No guidance on neurological harm from security incidents. Real-time latency requirements of neural prostheses may conflict with security overhead.

#### SOC 2 Type II

**What it says:** Five Trust Service Criteria: Security (mandatory), Availability, Processing Integrity, Confidentiality, Privacy. Minimum 3-month observation period.

**What it covers for BCIs:**
- Processing Integrity: Neural signal decoding must be accurate, authorized, and auditable
- Confidentiality: Neural data should be classified at highest tier
- Privacy: Could incorporate neural-data-specific commitments

**Gap:** Designed for service organizations (cloud providers, SaaS), not medical device manufacturers. A BCI cloud platform could pursue SOC 2, but the implanted device and local processing are outside scope. No neural-data-specific criteria.

#### PCI DSS (Maturity Model Lessons)

**What it says:** Unified payment card security standard since 2004. PCI Security Standards Council (independent governance body). Tiered compliance by risk. Qualified Security Assessors (QSA) ecosystem.

**Structural lessons for neurosecurity:**
1. Industry self-regulation through a standards council (analogous to a Neural Data Security Standards Council)
2. Tiered compliance based on risk: consumer EEG headband vs. implanted neuroprosthesis
3. Qualified assessor ecosystem: certified neural security assessors
4. Regular standard evolution as threats mature
5. The 20+ year journey from fragmentation to mature compliance

**Gap:** PCI DSS protects a 16-digit number. Neural data is orders of magnitude more complex, personal, and dangerous if compromised. The model provides structural inspiration but cannot be directly adopted.

---

## 4. Neuroethics Alignment

### Privacy and Ethics Statement

**QIF is NOT a surveillance framework.**

The QIF Framework exists to **protect** neural privacy and ensure the **integrity** of brain-computer interfaces. Its purpose is:

- **Defense** against malicious attacks (nation-state actors, cybercriminals, ransomware)
- **Protection** from accidental risks (MRI exposure, electromagnetic interference, device malfunction)
- **Privacy preservation** ensuring neural data remains confidential
- **Availability** maintaining BCI functionality when users depend on it
- **Human sovereignty** keeping humans in control of their own neural interfaces

The framework provides security without requiring surveillance. Signal integrity can be validated without reading thoughts. Attacks can be detected without decoding intent. The goal is to implement BCI security that preserves confidentiality, integrity, and availability.

### Core Neuroethics Principles

The following principles are widely recognized in neuroethics literature (Ienca & Andorno, 2017; Yuste et al., 2017; UNESCO IBC, 2021; UNESCO Recommendation on the Ethics of Neurotechnology, 2025):

| Principle | Definition | Threat Without Protection | Security GRC Counterpart |
|-----------|------------|---------------------------|--------------------------|
| **Cognitive Liberty** | Right to mental self-determination; freedom from unauthorized interference | External control of thoughts, forced neural modification | Authorization/Consent controls (NIST AC-3). **Gap:** no neural-specific consent enforcement mechanism exists in any GRC framework. |
| **Mental Privacy** | Right to keep neural data and mental states confidential | Unauthorized brain reading, thought surveillance | Confidentiality controls (NIST SC-28). **Gap:** no neural data classification standard exists. HIPAA/GDPR do not define neural data sensitivity tiers. |
| **Mental Integrity** | Right to protection from unauthorized alteration of neural function | Neural hacking, cognitive manipulation, "brain malware" | Integrity controls (NIST SI-4). **Gap:** no neural signal tampering detection standard exists. SI-4 monitors packets, not neural waveforms. |
| **Psychological Continuity** | Right to maintain personal identity and sense of self | Identity manipulation, memory tampering, personality modification | Availability + State controls (NIST PL-4). **Gap:** no longitudinal neural integrity verification exists in any control family. |

### Framework-to-Ethics Mapping

#### 1. Coherence Metric (Cs) to Mental Integrity

**The Problem**: How does a person (or their BCI) know if a neural signal is genuinely from their own brain versus injected by an attacker?

**QIF Solution**: The coherence metric quantifies signal trustworthiness across three dimensions:

| Component | What It Measures | Integrity Protection |
|-----------|------------------|----------------------|
| Phase variance (s2phi) | Timing consistency | Detects out-of-sync injections that don't match brain rhythms |
| Transport variance (s2tau) | Pathway integrity | Flags signals bypassing biological routes |
| Gain variance (s2gamma) | Amplitude stability | Catches artificially over/under-powered signals |

**Ethical Reasoning**: A signal that does not match expected biological patterns may indicate unauthorized alteration of neural function. By scoring coherence, the system provides a *quantitative basis* for mental integrity assessment (Ienca & Andorno, 2017).

**Design Decision**: The formula `Cs = e^(-(s2phi + s2tau + s2gamma))` was chosen because:
- Exponential decay ensures high sensitivity to small variances
- Multiplicative combination means *any* anomaly reduces trust
- Score range [0,1] enables threshold-based decisions

#### 2. Neural Firewall (L8) to Cognitive Liberty and Mental Integrity

**The Problem**: How do you prevent unauthorized neural signals from reaching the brain (input attacks) or unauthorized reading of neural signals (output attacks)?

**QIF Solution**: Zero-trust security at the Neural Gateway (Layer 8), where electrodes meet neurons.

| Firewall Feature | Liberty/Integrity Protection |
|------------------|------------------------------|
| Coherence threshold | Blocks signals that don't "belong" |
| Authentication requirement | Ensures signal source is verified |
| Amplitude bounds | Prevents dangerously strong stimulation |
| Rate limiting | Stops flooding/DoS attacks on neural tissue |
| ACCEPT_FLAG state | Allows human review of borderline cases |

**Ethical Reasoning**:
- **Cognitive Liberty**: The firewall enforces the user's right to choose what enters their neural space. Unauthenticated signals are rejected regardless of coherence. You must have permission.
- **Mental Integrity**: Hardware bounds and rate limiting protect against physical harm from overstimulation.

**Design Decision**: The decision matrix requires *both* high coherence AND valid authentication for unconditional acceptance. This embodies the principle that even "good-looking" signals need permission. Benevolent paternalism without consent is still a violation.

```
High Coherence + No Auth = REJECT (consent required)
Low Coherence + Valid Auth = REJECT (harm prevention)
```

#### 3. 14-Layer Model to Comprehensive Threat Mapping

**The Problem**: Where can attacks occur? Where should defenses be placed?

**QIF Solution**: A complete architectural model from molecules to applications, with attack surfaces and defenses catalogued at each layer.

| Layer Range | Ethical Concern | QIF Contribution |
|-------------|-----------------|------------------|
| L1-L3 (Molecular to Microcircuit) | Biological manipulation at cellular level | Identifies attack surfaces; notes biological defenses |
| L4-L7 (Regional to Behavioral) | Higher-order cognitive manipulation | Maps system-level vulnerabilities |
| L8 (Neural Gateway) | The critical boundary | Places firewall at bio-digital interface |
| L9-L14 (Biology) | Neural/cognitive attack vectors | QIF-specific neurodefense applies |

**Ethical Reasoning**: You cannot protect what you cannot name. The 14-layer model provides *vocabulary* for discussing neural security across disciplines (neuroscience, security, ethics, law).

#### 4. Scale-Frequency Invariant to Anomaly Detection for Mental Integrity

**The Problem**: How do you detect signals that are technically "correct" but biologically implausible?

**QIF Solution**: The f x S ~ k invariant validates that signal frequencies match the spatial scale they claim to originate from.

| Check | What It Catches | Integrity Protection |
|-------|-----------------|---------------------|
| Frequency vs. scale | Signals with wrong frequency for claimed origin | Attacker using 100Hz to target whole-brain (should be ~1Hz) |
| Deviation scoring | How "wrong" a signal is | Graduated response based on anomaly severity |
| Hierarchy validation | Does signal fit known neural processing levels? | Flags signals that don't match any biological scale |

**Ethical Reasoning**: An attacker might craft a signal that passes coherence checks but targets the wrong level of neural processing. Scale-frequency validation provides a *biological plausibility check* independent of signal quality.

#### 5. Transport Variance to Mental Privacy Protection

**The Problem**: How do you detect if someone is accessing neural signals through unauthorized pathways?

**QIF Solution**: Transport variance (s2tau) measures pathway integrity based on expected reliability of biological signal routes.

**Ethical Reasoning**: If a signal arrives via an unexpected pathway (bypassing normal synaptic routes), it may indicate:
- Unauthorized access point
- Compromised electrode
- Side-channel attack

By modeling expected pathway reliability, the system can flag signals that "took the wrong route," a potential privacy breach.

#### 6. Signal Rejection to Cognitive Sovereignty

**The Problem**: Who has final say over what enters or exits the neural space?

**QIF Solution**: The firewall's REJECT decision is absolute. Rejected signals do not reach neural tissue.

**Ethical Design Principles**:

1. **Default Deny**: Unknown signals are rejected, not accepted
2. **User Override**: System should support user-configurable thresholds (future work)
3. **Transparency**: Every rejection includes a reason (`result.reason`)
4. **Logging**: All decisions logged for audit (`firewall.log`)

**Ethical Reasoning**: Cognitive sovereignty means the human retains ultimate authority. The firewall is a *tool* that implements the user's policy, not an autonomous gatekeeper making independent judgments about what is "good" for the user.

### Ethical Design Decisions Summary

| Decision | Alternatives Considered | Ethical Reasoning for Choice |
|----------|------------------------|------------------------------|
| Exponential coherence decay | Linear scoring | Higher sensitivity to anomalies protects integrity |
| Authentication required even for high-coherence signals | Coherence-only acceptance | Consent is non-negotiable; quality does not imply permission |
| ACCEPT_FLAG intermediate state | Binary accept/reject | Allows human review; preserves user agency in edge cases |
| Open-source framework | Proprietary/closed | Transparency enables scrutiny; security through obscurity fails |
| Explicit documentation of limitations | Marketing-style claims | Honesty about research status enables informed adoption |

### Stakeholder Perspectives (Lazaro-Munoz Framework)

Research by Gabriel Lazaro-Munoz et al. at Harvard Medical School and Massachusetts General Hospital provides empirical grounding for QIF's ethical framework through extensive stakeholder interviews.

#### Researcher-Identified Ethical Concerns

From interviews with 23 adaptive DBS researchers (Lazaro-Munoz et al., 2020):

| Concern | Frequency | QIF Framework Response |
|---------|-----------|----------------------|
| **Data Privacy & Security** | 91% | Coherence validation, Privacy Score (Ps), BCI Anonymizer |
| **Risks & Safety** | 83% | Amplitude bounds, rate limiting, REJECT decisions |
| **Informed Consent** | 74% | See [INFORMED_CONSENT_FRAMEWORK.md](INFORMED_CONSENT_FRAMEWORK.md) |
| **Automaticity & Programming** | 65% | Biomarker validation via scale-frequency invariant |
| **Autonomy & Control** | 57% | User Override Interface (planned), ACCEPT_FLAG pathway |
| **Patient Selection** | 39% | Candidacy criteria documentation |
| **Post-Trial Access** | 39% | See [POST_DEPLOYMENT_ETHICS.md](POST_DEPLOYMENT_ETHICS.md) |
| **Personality & Identity** | 30% | L14 Identity Layer protection, psychological continuity |

#### Multi-Stakeholder Decision Model

QIF recognizes that neural device decisions involve multiple stakeholders with legitimate interests:

| Stakeholder | Role | Framework Integration |
|-------------|------|----------------------|
| **Patient/User** | Primary autonomy holder | Consent requirements, override capability |
| **Caregiver** | Support and assistance | Trusted contact designation, escalation paths |
| **Clinician** | Medical expertise | Candidacy assessment, parameter guidance |
| **Researcher** | Scientific understanding | Transparency documentation, data sharing protocols |
| **Engineer/Developer** | Technical capabilities | Security implementation, documentation |

#### Relational Autonomy

Rather than strict individual autonomy, QIF adopts a **relational autonomy** model:

> "Patients could identify a close caregiver to provide assistance" in treatment decisions. (Lazaro-Munoz et al., 2020)

This means:
- Autonomy is exercised within relationships, not in isolation
- Trusted others can be formally designated in consent records
- ACCEPT_FLAG decisions can escalate to designated stakeholders
- Collaborative decision-making is supported, not just tolerated

### Gaps and Future Work

#### Policy-Layer Neurorights (Outside Security Scope)

Three neurorights proposed by Yuste and the NeuroRights Foundation (2017) and reinforced by UNESCO's 2025 Recommendation are intentionally not mapped in QIF's threat taxonomy. These are distributive justice and governance concerns. No attack technique directly violates them, and they cannot be operationalized through a security framework alone:

| Right | Source | Why Outside QIF Scope |
|-------|--------|----------------------|
| **Equitable Access to Mental Augmentation** | Yuste et al. (2017); UNESCO (2025) | Structural inequality, not an attack vector. No technique in TARA violates "fair access." |
| **Protection from Algorithmic Bias** | Yuste et al. (2017) | Downstream consequence of data misuse, partially addressed by Mental Privacy (MP). Bias arises from systems processing neural data, not from attacks on the interface itself. |
| **Free Will / Autonomous Decision-Making** | Yuste et al. (2017) | Substantially overlaps with Cognitive Liberty (CL), which covers freedom from external interference with mental processes. The philosophical distinction between CL and free will is important for neuroethics but does not produce distinct attack-technique-to-harm mappings. |

These rights are addressed at QIF's governance layer (this document, regulatory compliance guidance, and open publication) rather than the security layer (TARA, NISS, hourglass model). Their full operationalization is an active area of research.

#### Currently Unaddressed

| Ethical Concern | Status | Notes |
|-----------------|--------|-------|
| **Informed Consent Mechanisms** | Not implemented | Framework validates signals but does not manage consent workflows |
| **User Override Interface** | Designed, not built | Users should be able to adjust thresholds based on risk tolerance |
| **Long-term Identity Protection** | Theoretical only | Psychological continuity requires longitudinal monitoring not in scope |
| **Pediatric/Incapacity Considerations** | Not addressed | Surrogate decision-making adds complexity |
| **Dual-Use Concerns** | Acknowledged | Security tools can inform attacks; mitigated by open publication |

---

## 5. UNESCO Alignment

### About the UNESCO Recommendation

| Attribute | Detail |
|-----------|--------|
| **Full Title** | Recommendation on the Ethics of Neurotechnology |
| **Adopted** | November 12, 2025, at the 43rd General Conference (Samarkand, Uzbekistan) |
| **Scope** | 194 Member States, the entire United Nations membership |
| **Legal Nature** | Non-binding soft law instrument; provisions to be considered by Member States, research organizations, and private sector |
| **Coverage** | Entire lifecycle of neurotechnology, from design to disposal |
| **Co-Chairs** | Herve Chneiweiss (French neuroscientist) and Nita Farahany (Duke University legal scholar) |
| **Expert Group** | 24 high-level experts, multidisciplinary, geographically and gender balanced |
| **Input** | 8,000+ contributions from civil society, private sector, academia, and Member States |
| **Context** | 700% increase in neurotechnology investment between 2014 and 2021; market projected to reach $25B by 2030 |

#### IBC Report (2021) Precursor

Before the formal Recommendation, UNESCO's International Bioethics Committee (IBC) published the foundational report *Ethical Issues of Neurotechnology* (2021), identifying five ethical challenges:

1. Cerebral/mental integrity and human dignity
2. Personal integrity and psychological continuity
3. Autonomy
4. Mental privacy
5. Accessibility and social justice

This report served as the intellectual foundation for the 2025 Recommendation and aligns directly with the neuroethics principles QIF was built upon.

### UNESCO Timeline

| Date | Event | QIF Relevance |
|------|-------|---------------|
| **2019** | UNESCO Director-General Azoulay launches initiative | |
| **2021** | IBC publishes *Ethical Issues of Neurotechnology* report | QIF references "UNESCO, 2021" in neuroethics alignment |
| **Nov 2023** | 194 Member States mandate an international standard-setting instrument | QIF Framework development underway (2023-Present) |
| **Apr 2024** | First meeting of Ad Hoc Expert Group (AHEG) | QIF governance documentation being authored |
| **Aug 2024** | Second AHEG meeting; first draft finalized | |
| **Sep 2024** | First draft shared with Member States | |
| **May 2025** | Intergovernmental meeting to finalize draft | |
| **Nov 12, 2025** | **Adopted by 43rd General Conference** | QIF already implements technical safeguards for all core concerns |

### Pillar I: Core Values

#### Value 1: Human Rights, Freedoms, and Dignity

> *Technology must respect and promote fundamental human rights.*

| UNESCO Requirement | QIF Implementation | Location |
|--------------------|--------------------|----------|
| Respect human rights | QIF's entire governance framework is built on the Ienca & Andorno (2017) neurorights: cognitive liberty, mental privacy, mental integrity, psychological continuity | Neuroethics Alignment (Section 4) |
| Protect dignity | Neural Firewall (L8) enforces consent requirements. Even "good-looking" signals need permission. Benevolent paternalism without consent is treated as a violation | firewall.py, Section 4 |
| Prevent unauthorized interference | Zero-trust architecture: default-deny, authentication required, coherence validation | firewall.py, QIF Hourglass (L8) |
| Freedom from manipulation | BCI Anonymizer classifies cognitive sensitivity (P300, N170, N400 ERPs) and filters private data at source | NSP Implementation |

#### Value 2: Human Health and Well-Being

> *Resources should focus on neurotechnology benefiting the largest number of people.*

| UNESCO Requirement | QIF Implementation | Location |
|--------------------|--------------------|----------|
| Prioritize health benefit | Post-deployment ethics framework ensures continued device support after trials end, preventing patient abandonment | POST_DEPLOYMENT_ETHICS.md |
| Safety protections | Amplitude bounds and rate limiting prevent physical harm from overstimulation; DoS detection thresholds protect neural tissue | firewall.py |
| Lifecycle consideration | Full lifecycle planning: pre-deployment, active use, transition, end-of-life stages documented | POST_DEPLOYMENT_ETHICS.md |
| Prevent abandonment | Stakeholder responsibility matrix covers manufacturer, researcher, funder, patient, and regulator obligations across device lifecycle | POST_DEPLOYMENT_ETHICS.md |

#### Value 3: Respect for Diversity and Cultural Differences

> *Account for different cultures and contexts.*

| UNESCO Requirement | QIF Implementation | Location |
|--------------------|--------------------|----------|
| Cultural sensitivity | Relational autonomy model (Lazaro-Munoz framework) recognizes autonomy is exercised within relationships, not in isolation, accommodating diverse decision-making structures | Section 4, Relational Autonomy |
| Multi-stakeholder inclusion | Formal stakeholder roles defined: patient/user, caregiver, clinician, researcher, engineer/developer | Section 4, Multi-Stakeholder Model |
| Open and transparent | Apache 2.0 open-source license; framework publicly available for adaptation across cultures and contexts | LICENSE, TRANSPARENCY.md |

#### Value 4: Sustainability

> *Development must be environmentally and socially sustainable.*

| UNESCO Requirement | QIF Implementation | Location |
|--------------------|--------------------|----------|
| Long-term viability | Post-trial access framework addresses sustainability of implanted devices beyond research phases. High maintenance costs ($10,000+/year) explicitly documented | POST_DEPLOYMENT_ETHICS.md |
| Social sustainability | Open-source model ensures knowledge is shared, not locked behind proprietary barriers | LICENSE |
| Standards development | QIF identifies gaps in upper cognitive layers (L11-L14) and calls for collaboration with neuroethicists, cognitive scientists, and governing agencies | POST_DEPLOYMENT_ETHICS.md |

#### Value 5: Professional Integrity

> *High standards of professional conduct required.*

| UNESCO Requirement | QIF Implementation | Location |
|--------------------|--------------------|----------|
| Transparent methodology | Full Human-AI collaboration documentation with 40% AI suggestion modification rate; all corrections documented with reasoning | TRANSPARENCY.md |
| Research verification | Anti-hallucination firewall with uncertainty tags (VERIFIED, INFERRED, UNVERIFIED, CONTRADICTED) | RESEARCH_VERIFICATION_PROTOCOL.md |
| Citation rigor | 50+ peer-reviewed sources across neuroscience, cybersecurity, physics, and neuroethics | All publications |
| Multi-model verification | Uses Claude, Gemini, ChatGPT, and LMArena for epistemic hygiene, preventing single-model bias | TRANSPARENCY.md |

### Pillar II: Ethical Principles

#### Principle 1: Proportionality

> *Use of neurotechnology should be limited to what is appropriate and proportionate to the objectives pursued, based on scientific evidence.*

| UNESCO Requirement | QIF Implementation | Location |
|--------------------|--------------------|----------|
| Evidence-based decisions | Coherence Metric (Cs) provides quantitative, evidence-based signal assessment, not subjective judgment | coherence.py |
| Proportionate response | ACCEPT_FLAG intermediate state allows human review of borderline cases rather than binary accept/reject | firewall.py |
| Graduated response | Scale-frequency invariant (f x S ~ k) provides deviation scoring, graduated response based on anomaly severity | scale_freq.py |
| Scientific grounding | Coherence metric grounded in spike-timing dependent plasticity and communication-through-coherence theory (Fries, 2005/2015) | Section 4 |

#### Principle 2: Protection of Freedom of Thought

> *Right to choose whether or not to use neurotechnology at any time; consent must be freely given and informed.*

| UNESCO Requirement | QIF Implementation | Location |
|--------------------|--------------------|----------|
| Right to choose | Cognitive Liberty is the first principle in QIF's neuroethics framework, the right to mental self-determination | Section 4 |
| Informed consent | Full Informed Consent Framework with continuous consent model: Initial Consent, Active Monitoring, Re-consent | INFORMED_CONSENT_FRAMEWORK.md |
| Consent states | ConsentState enum: NOT_OBTAINED, INITIAL_ONLY, FULL_CONSENT, REVOKED, EXPIRED, integrated into firewall decision logic | consent.py |
| Consent + coherence | Firewall decision matrix: "High Coherence + Valid Auth + No Consent = REJECT". Quality does not override consent | INFORMED_CONSENT_FRAMEWORK.md |
| Revocability | Consent can be revoked at any time; REVOKED state triggers immediate signal rejection | consent.py |
| Therapeutic misconception disclosure | Consent documentation explicitly requires therapeutic misconception disclosure | INFORMED_CONSENT_FRAMEWORK.md |

#### Principle 3: Privacy

> *Neural data is particularly private and uniquely sensitive; strict safeguards against misuse required.*

| UNESCO Requirement | QIF Implementation | Location |
|--------------------|--------------------|----------|
| Neural data as sensitive | BCI Anonymizer classifies neural data by cognitive sensitivity level: P300 (attention/recognition), N170 (face recognition), N400 (semantic processing) | NSP Implementation |
| Filter before transmission | BCI Anonymizer filters private cognitive data at the source before transmission, privacy by design | NSP Implementation |
| Transport pathway integrity | Transport variance (s2tau) detects unauthorized access pathways. Signals arriving via unexpected routes indicate potential privacy breach | coherence.py |
| Data classification | CCPA/GDPR data classification implemented across frameworks; neural data classified at highest sensitivity | REGULATORY_COMPLIANCE.md |
| Quantum-resistant encryption | Quantum encryption framework addresses Harvest-Now-Decrypt-Later (HNDL) threats. Neural data with 50+ year lifespans requires post-quantum protection | NSP quantum-encryption |

#### Principle 4: Protection of Children and Future Generations

> *Neurotechnology should promote holistic child development; limited to medical, therapeutic, or well-justified purposes.*

| UNESCO Requirement | QIF Implementation | Location |
|--------------------|--------------------|----------|
| Pediatric protections | Full Pediatric Considerations framework based on Lazaro-Munoz et al. (NIH-funded research) | INFORMED_CONSENT_FRAMEWORK.md |
| Age-appropriate consent | Age-tiered assent framework: 0-6 (no formal assent), 7-11 (simple verbal), 12-14 (written), 15-17 (near-adult strong weight) | INFORMED_CONSENT_FRAMEWORK.md |
| Tri-level authorization | Level 1: Parental consent, Level 2: Minor's assent, Level 3: Clinician certification. All three required | INFORMED_CONSENT_FRAMEWORK.md |
| Identity development | Special protections for developing brains and identity formation | INFORMED_CONSENT_FRAMEWORK.md |
| Clinician-identified concerns | Documented concerns from pediatric DBS clinicians: uncertainty about risks (72%), decision-making roles (52%), information scarcity (52%), adolescent assent capacity (80%) | INFORMED_CONSENT_FRAMEWORK.md |

### Pillar III: Policy Action Areas

#### Consumer Protection and Commercial Use

| UNESCO Recommendation | QIF Response | Location |
|-----------------------|-------------|----------|
| Prohibit neural data in manipulative recommender systems | BCI Anonymizer filters cognitive data at source, preventing downstream manipulation | NSP Implementation |
| Restrict neural data for "nudging" | L14 (Identity & Ethics) explicitly addresses identity manipulation, memory tampering, personality modification | QIF Hourglass (L14) |
| Prohibit neuromarketing during sleep | Neural Firewall default-deny architecture blocks all unauthorized access regardless of user state | firewall.py |
| Apply consumer protection equally to neurotechnology | Regulatory compliance framework maps to FTC unfair/deceptive practices, COPPA, and health claims requirements | Section 6 |

#### Enhancement

| UNESCO Recommendation | QIF Response | Location |
|-----------------------|-------------|----------|
| Prohibit pressure to use enhancement | Cognitive Liberty principle: right to mental self-determination, freedom from unauthorized interference | Section 4 |
| Prohibit enhancement undermining dignity/identity | Psychological Continuity right: protection of personal identity and sense of self | Section 4 |
| Guidance on acceptable vs. prohibited enhancement | QIF identifies this as a gap requiring policy collaboration. Framework provides technical infrastructure for enforcement | POST_DEPLOYMENT_ETHICS.md |

#### Workplace Protections

| UNESCO Recommendation | QIF Response | Location |
|-----------------------|-------------|----------|
| Warn against neural productivity monitoring | Mental Privacy right explicitly protects neural data and mental states from unauthorized access | Section 4 |
| Require explicit consent and transparency | Consent framework requires freely given, informed consent with documented scope of signal reading/modification | INFORMED_CONSENT_FRAMEWORK.md |

#### Children and Young People

| UNESCO Recommendation | QIF Response | Location |
|-----------------------|-------------|----------|
| Ban non-therapeutic use for children | Full pediatric framework with age-tiered protections grounded in NIH-funded research | INFORMED_CONSENT_FRAMEWORK.md |

#### Behavioral Influence and Addiction

| UNESCO Recommendation | QIF Response | Location |
|-----------------------|-------------|----------|
| Regulate products that influence behavior | Neural ransomware threat taxonomy identifies behavioral manipulation as attack vector; Coherence Metric detects anomalous signals | TARA |
| Clear information to consumers | Open-source transparency with full documentation of all framework capabilities and limitations | TRANSPARENCY.md |

#### Health and Social Well-Being

| UNESCO Recommendation | QIF Response | Location |
|-----------------------|-------------|----------|
| Ensure equitable access to therapeutic technology | Post-deployment ethics addresses post-trial access, device abandonment, and sustainability of care | POST_DEPLOYMENT_ETHICS.md |
| Lifecycle obligations | Manufacturer, researcher, funder, patient, and regulator responsibilities mapped across full device lifecycle | POST_DEPLOYMENT_ETHICS.md |

#### Oversight and Governance

| UNESCO Recommendation | QIF Response | Location |
|-----------------------|-------------|----------|
| Ensure suitable oversight | QIF provides technical infrastructure for oversight: logging, auditing, coherence scoring, firewall decisions | firewall.py |
| Prevent social control/surveillance | QIF is explicitly NOT a surveillance framework. Security without surveillance; integrity validated without reading thoughts | Section 4 |
| Data protection and cybersecurity | Full regulatory compliance mapping: FDA, FCC, HIPAA, FTC, NIST, state neural data laws (Colorado, California, Montana, Connecticut) | Section 6 |
| Lifecycle evaluation | Regulatory Window Analysis: Research (2000-2020) to Early Clinical (2020-2026) to Consumer Transition (2026-2030) to Mass Adoption (2030+) | Section 6 |

#### Access and Equity

| UNESCO Recommendation | QIF Response | Location |
|-----------------------|-------------|----------|
| Keep neurotechnology inclusive and affordable | Open-source (Apache 2.0); published to PyPI for free access; educational modules | LICENSE, PyPI packages |
| Protect vulnerable groups | Pediatric considerations, incapacity protections, variable capacity model, advance directives for neural devices | INFORMED_CONSENT_FRAMEWORK.md |

### Complete Alignment Matrix

| UNESCO Element | Type | QIF Component | Status | Missing Security Control |
|----------------|------|---------------|--------|--------------------------|
| Human rights, freedoms, dignity | Value | Neurorights framework (4 principles), Neural Firewall | Implemented | No NIST/ISO control family for cognitive liberty enforcement. Closest is AC-3 (Access Enforcement) but it has no neural consent semantics. |
| Human health and well-being | Value | Post-deployment ethics, amplitude bounds, rate limiting | Implemented | No medical device security control for "neural tissue safety bounds." IEC 62443 SL levels do not account for biological harm. |
| Respect for diversity | Value | Relational autonomy model, multi-stakeholder framework | Implemented | No GRC control for culturally adaptive consent models. ISO 27001 A.5 (Policies) assumes uniform organizational context. |
| Sustainability | Value | Open-source, post-trial access framework | Implemented | No control for "post-trial device continuity." NIST SC (System/Communications Protection) covers uptime, not surgical dependency. |
| Professional integrity | Value | Transparency audit trail, research verification protocol | Implemented | No control for AI-assisted research verification. NIST AU (Audit) covers log integrity, not epistemic integrity. |
| Proportionality | Principle | Coherence Metric, ACCEPT_FLAG, graduated response | Implemented | No control for "graduated neural response." NIST IR (Incident Response) is binary, not graduated. |
| Freedom of thought | Principle | Cognitive Liberty, informed consent framework, consent states | Implemented | No NIST/ISO control for "freedom of thought" enforcement. AC-3 enforces system access, not cognitive access. |
| Privacy | Principle | BCI Anonymizer, transport variance, quantum encryption | Implemented | No neural data classification standard in NIST/ISO. SC-28 (Protection of Information at Rest) does not address neural re-identification. |
| Protection of children | Principle | Pediatric framework, age-tiered assent, tri-level authorization | Implemented | No pediatric-specific security control family. NIST PT (Privacy) does not address age-tiered neural consent. |
| Consumer protection | Policy | BCI Anonymizer, default-deny firewall, FTC compliance mapping | Implemented | No consumer neural device security baseline. PCI DSS provides a model but no neural equivalent exists. |
| Enhancement regulation | Policy | Cognitive Liberty, Psychological Continuity principles | Partial: technical infrastructure exists; policy guidance requires collaboration | No control for "enhancement boundary enforcement." This is a policy gap, not a technical one. |
| Workplace protections | Policy | Mental Privacy, consent framework | Implemented | No workplace neural monitoring prohibition control. NIST PT-3 (Personally Identifiable Information Processing) does not address employer neural data collection. |
| Children protections | Policy | Full pediatric framework | Implemented | Same as "Protection of children" above. |
| Behavioral influence | Policy | Neural ransomware taxonomy, coherence detection | Implemented | No control for "behavioral manipulation detection." NIST SI-4 (System Monitoring) detects network anomalies, not cognitive influence patterns. |
| Health and well-being | Policy | Post-deployment ethics, lifecycle obligations | Implemented | No control for "device abandonment prevention." Lifecycle coverage in ISO 27001 ends at information system decommissioning, not surgical implant end-of-life. |
| Oversight and governance | Policy | Logging, auditing, regulatory compliance mapping | Implemented | No neural-specific governance control. NIST PM (Program Management) addresses organizational security programs, not neurotechnology oversight boards. |
| Access and equity | Policy | Open-source, free PyPI packages, educational modules | Implemented | No control for "equitable neural technology access." This is a distributive justice concern outside GRC scope. |

**Summary: 15 of 17 UNESCO elements fully implemented; 2 partially implemented (requiring policy collaboration beyond technical scope).**

### Relationship to Other Neuroethics Frameworks

| Framework | Year | Key Contribution | QIF Integration |
|-----------|------|------------------|-----------------|
| **Ienca & Andorno** | 2017 | Four neurorights: cognitive liberty, mental privacy, mental integrity, psychological continuity | Core principles of neuroethics alignment; each mapped to specific QIF technical components |
| **Yuste et al. / Morningside Group** | 2017 | Five neurorights: adds equal access and protection from algorithmic bias | Equal access via open-source; bias protection via multi-model verification and transparent methodology |
| **OECD** | 2019 | Responsible Innovation in Neurotechnology, first international instrument (36 members) | QIF follows responsible innovation principles: accountability, transparency, safety |
| **UNESCO IBC Report** | 2021 | Five ethical challenges for neurotechnology | Referenced in QIF governance since inception |
| **Chile Constitutional Amendment** | 2021 | First country to constitutionally protect neurorights | QIF's regulatory compliance maps Chilean precedent |
| **UNESCO Recommendation** | 2025 | First global normative framework (194 Member States), values, principles, policy actions | Comprehensive alignment documented in this section |
| **Lazaro-Munoz et al.** | 2020-2023 | Empirical researcher perspectives on DBS ethics, pediatric ethics, post-trial access | Full integration: stakeholder model, consent framework, pediatric considerations, post-deployment ethics |

#### How UNESCO Extends Prior Frameworks

| Prior Framework | UNESCO Addition |
|-----------------|----------------|
| Ienca & Andorno (4 rights) | Adds explicit policy prohibitions (neuromarketing during sleep, workplace monitoring, child non-therapeutic use) |
| Yuste et al. (5 rights) | Adds implementation tools (Readiness Assessment, Ethical Impact Assessment, capacity-building) |
| OECD (36 members) | Extends to 194 Member States, truly global scope |
| Chile (1 country) | Provides model for 194 countries to follow |

### UNESCO Gaps and Future Work

| Gap | UNESCO Element | Status | Path Forward |
|-----|---------------|--------|--------------|
| Enhancement policy guidance | Enhancement (Policy) | Partial | Requires policy collaboration. QIF provides technical infrastructure for enforcement but cannot unilaterally define which enhancements are acceptable |
| Detailed implementation guidance for Member States | Implementation | Not in scope | QIF is a technical framework, not a policy implementation toolkit. Complements UNESCO's planned Readiness Assessment Methodology |
| L11-L14 international standards | Oversight (Policy) | Identified gap | Upper cognitive layers lack established international standards; calls for collaboration with neuroethicists, cognitive scientists, and governing agencies |
| Readiness Assessment integration | Implementation | Future work | When UNESCO publishes Readiness Assessment Methodology, QIF should map technical capabilities to assessment criteria |

---

## 6. Regulatory Compliance

### Executive Summary

Brain-Computer Interfaces (BCIs) represent one of the most consequential technological developments of the 21st century. As these devices transition from research laboratories to consumer markets, the regulatory framework governing their deployment will determine whether this technology serves humanity or endangers it.

**The QIF Framework establishes security and safety standards that complement, and in some cases exceed, existing regulatory requirements.** This section maps QIF compliance to US federal and state regulations, international frameworks, and emerging neurotechnology legislation worldwide, identifying gaps that manufacturers, regulators, and policymakers must address before mass BCI adoption.

> **Key Principle:** Mass adoption of BCIs is inevitable. The question is not *whether* but *how*. QIF-compliant devices prioritize security, privacy, and human sovereignty from the design phase, not as regulatory afterthoughts.

### Why Compliance Matters Now

#### The Regulatory Window

| Phase | Characteristics | Regulatory Posture |
|-------|-----------------|-------------------|
| **Research** (2000-2020) | Academic labs, small cohorts, IRB oversight | Minimal commercial regulation |
| **Early Clinical** (2020-2026) | FDA breakthrough designations, compassionate use | Emerging medical device framework |
| **Consumer Transition** (2026-2030) | Non-invasive consumer devices, wellness claims | Regulatory gap, unclear jurisdiction |
| **Mass Adoption** (2030+) | Widespread deployment, critical infrastructure | **Urgent need for comprehensive framework** |

#### Consequences of Delayed Action

| Risk Category | Without Proactive Regulation | With QIF-Compliant Framework |
|---------------|------------------------------|------------------------------|
| **Security Incidents** | Neural ransomware, cognitive hijacking, mass exploitation | Defense-in-depth, attack detection, rapid response |
| **Privacy Violations** | Thought surveillance, neural data harvesting, identity theft | Encrypted transport, data minimization, consent enforcement |
| **Public Trust** | Backlash, adoption resistance, restrictive legislation | Informed adoption, transparent security, ethical deployment |
| **International Competition** | Fragmented standards, race to bottom | Unified standards, global interoperability |

### US Regulatory Overview

#### Food and Drug Administration (FDA)

**Device Classification:**

| Class | Risk Level | Examples | Regulatory Pathway |
|-------|------------|----------|-------------------|
| **Class I** | Low | External EEG headbands (wellness) | General Controls, Exempt |
| **Class II** | Moderate | Non-invasive neurofeedback, cochlear implants | 510(k) Premarket Notification |
| **Class III** | High | Implanted neural interfaces, deep brain stimulators | Premarket Approval (PMA) |

**Key FDA Regulations:**

| Regulation | Citation | QIF Alignment |
|------------|----------|---------------|
| **Quality System Regulation** | 21 CFR Part 820 | QIF L8-L14 validation checkpoints map to design controls |
| **Medical Device Reporting** | 21 CFR Part 803 | NSAM alerting provides adverse event detection |
| **Unique Device Identification** | 21 CFR Part 830 | QIF node identification supports UDI requirements |
| **Cybersecurity Guidance** | FDA-2023-D-0100 | **Direct alignment**, QIF exceeds current FDA cyber guidance |
| **Software as Medical Device** | IMDRF/SaMD | QIF firmware security addresses SaMD concerns |

**Breakthrough Device Designations:**

- **Synchron**, Stentrode endovascular BCI
- **Blackrock Neurotech**, Utah Array systems
- **Neuralink**, N1 implant
- **Paradromics**, High-bandwidth cortical interface

> **QIF Recommendation:** Breakthrough designation should require demonstrated cybersecurity architecture. Current designation focuses on therapeutic benefit without mandating security standards.

**FDORA & PATCH Act (2022): Mandatory Cybersecurity Submissions**

The Food and Drug Omnibus Reform Act of 2022 (FDORA) and Protecting and Transforming Cyber Health Care Act of 2022 (PATCH Act) amended the Federal Food, Drug, and Cosmetic Act by adding Section 524B. As of October 2023, FDA enforces a Refuse-to-Accept (RTA) policy: submissions lacking cybersecurity documentation are rejected before review begins.

| FDORA/PATCH Requirement | What Manufacturers Must Submit | QIF Tool |
|------------------------|-------------------------------|----------|
| **Threat modeling** | Identification of cybersecurity risks and attack vectors | TARA, 71 neural-specific attack techniques across 7 domains |
| **Vulnerability assessment** | Known vulnerabilities and severity ratings | NISS, extends CVSS v4.0 with 5 neural-specific metrics |
| **Software Bill of Materials (SBOM)** | Component transparency | QIF component registry |
| **Security architecture** | Design controls for cybersecurity | 11-band hourglass security model |
| **Post-market plan** | Ongoing vulnerability monitoring and patching | NSAM continuous monitoring |

> **The structural gap:** Section 524B mandates *that* manufacturers perform threat modeling but does not specify *which* threat taxonomy or scoring system to use for neural devices. The referenced standards (CVSS, IEC 62443, AAMI TIR57, ISO 14971) provide processes and scoring for general medical devices. None catalog neural-specific attack techniques. TARA and NISS fill this gap.

**FDA Cybersecurity Guidance (2023):**

| Requirement | FDA Expectation | QIF Implementation |
|-------------|-----------------|-------------------|
| **Threat Modeling** | Identify attack vectors | QIF layered attack surface mapping |
| **Security by Design** | Built-in security controls | L8 Neural Firewall, coherence validation |
| **Software Bill of Materials** | Component transparency | QIF component registry |
| **Vulnerability Management** | Ongoing security updates | NSAM continuous monitoring |
| **Incident Response** | Breach detection/response | Alert escalation, quarantine protocols |

#### Federal Communications Commission (FCC)

| Regulation | Scope | BCI Relevance |
|------------|-------|---------------|
| **47 CFR Part 15** | Unlicensed devices | Consumer EEG, Bluetooth/WiFi BCIs |
| **47 CFR Part 18** | Industrial/scientific/medical | Medical-grade implants |
| **47 CFR Part 95** | Medical Device Radio (MICS) | Implanted device telemetry |
| **SAR Limits** | Specific Absorption Rate | RF exposure near brain tissue |

| FCC Concern | QIF Solution |
|-------------|--------------|
| Electromagnetic interference | L1-L2 signal integrity validation |
| Unauthorized transmission | L8 firewall blocks rogue RF |
| Spectrum security | Transport layer authentication |

#### Health Insurance Portability and Accountability Act (HIPAA)

| Rule | Requirements | QIF Alignment |
|------|--------------|---------------|
| **Privacy Rule** | Minimum necessary use, patient consent, disclosure limits | QIF data minimization, consent framework |
| **Security Rule** | Administrative, physical, technical safeguards | QIF L6-L14 encryption, access controls |
| **Breach Notification** | 60-day notification for breaches >500 individuals | NSAM detection enables rapid breach identification |

**Neural Data Classification:**

| Data Type | HIPAA Status | QIF Protection |
|-----------|--------------|----------------|
| Raw EEG/neural signals | PHI if linked to individual | Encrypted at L6, anonymized at L10 |
| Decoded intentions/commands | PHI, highly sensitive | Never stored, processed ephemerally |
| Cognitive state inferences | PHI, derived health data | Kohno taxonomy protection |
| Device telemetry | PHI if linked | Pseudonymized device IDs |

> **Critical Gap:** HIPAA was designed for medical records, not real-time neural streams. New regulatory frameworks are needed for continuous neural data flows.

#### Federal Trade Commission (FTC)

| Area | FTC Concern | QIF Relevance |
|------|-------------|---------------|
| **Deceptive Practices** | False claims about BCI capabilities | Honest coherence reporting |
| **Unfair Practices** | Inadequate data security | QIF security baseline |
| **Children's Privacy (COPPA)** | Under-13 protections | Pediatric BCI considerations |
| **Health Claims** | Wellness vs. medical distinctions | Clear device classification |

**FTC Enforcement Precedents:**

| Case | Relevance to BCIs |
|------|-------------------|
| **FTC v. Lumosity (2016)** | Brain training claims must be substantiated |
| **FTC v. Practice Fusion (2020)** | Health tech data practices scrutinized |
| **FTC v. BetterHelp (2023)** | Mental health data requires heightened protection |

#### National Institute of Standards and Technology (NIST)

| Framework | Application | QIF Mapping |
|-----------|-------------|-------------|
| **NIST CSF 2.0** | Identify, Protect, Detect, Respond, Recover | QIF lifecycle security |
| **NIST SP 800-53** | Security and Privacy Controls | QIF control implementation |
| **NIST SP 800-183** | Networks of Things | L1-L7 network security |
| **NIST AI RMF** | AI Risk Management | Cognitive layer (L13-L14) governance |

**NIST CSF to QIF Mapping:**

| NIST Function | NIST Categories | QIF Implementation |
|---------------|-----------------|-------------------|
| **IDENTIFY** | Asset Management, Risk Assessment | 14-layer asset inventory, attack surface mapping |
| **PROTECT** | Access Control, Data Security, Maintenance | L8 Firewall, Coherence validation, secure updates |
| **DETECT** | Anomalies, Continuous Monitoring | NSAM, Scale-frequency anomaly detection |
| **RESPOND** | Response Planning, Communications | Alert escalation, quarantine protocols |
| **RECOVER** | Recovery Planning, Improvements | Failsafe modes, post-incident learning |

### State-Level Regulations

#### Enacted State Legislation

| State | Legislation | Effective | Key Provisions |
|-------|-------------|-----------|----------------|
| **Colorado** | H.B. 24-1058 (Neurotechnology Privacy) | August 2024 | First US state law explicitly protecting neural data; classifies neural data as "sensitive data" under the Colorado Privacy Act; requires opt-in consent for collection; prohibits neural data sale without consent |
| **California** | SB 1223 (Neurorights Act) | January 2025 | Amends CCPA to include neural data as "sensitive personal information"; grants right to delete neural data; prohibits neural data sale without explicit consent; covers both medical and consumer neurotechnology |
| **Montana** | SB 163 (Neural Data Privacy) | October 2025 | Classifies neural data as protected health information; requires informed consent for neural data collection; establishes penalties for unauthorized neural data access |
| **Connecticut** | SB 1295 (Neurotechnology Protection) | July 2026 | Comprehensive neurotechnology consumer protection; requires transparency in neural data processing; establishes neural data minimization requirements |

#### Proposed State Legislation

| State | Legislation | Status | Key Provisions |
|-------|-------------|--------|----------------|
| **Minnesota** | HF 1370 | Proposed 2024 | Neural data consent requirements |
| **New York** | A8749 | Proposed 2024 | Brain-computer interface privacy |

#### California CCPA Implications (SB 1223)

| CCPA Right | Neural Data Application |
|------------|------------------------|
| Right to Know | What neural data is collected, including inferred cognitive states |
| Right to Delete | Erasure of neural recordings and derived data |
| Right to Opt-Out | Decline neural data sale. Explicit opt-in required for sensitive neural data |
| Right to Non-Discrimination | No penalties for exercising neural data rights |

> **QIF Position:** While state-level action demonstrates urgency, fragmentation creates compliance complexity. Federal neural data legislation is needed.

### US Federal Legislation

#### MIND Act (S. 2925)

The Mental-health Innovation and Neurotechnology Development (MIND) Act (S. 2925), introduced in September 2025, represents the first US federal bill specifically addressing neurotechnology governance.

| Aspect | Detail |
|--------|--------|
| **Bill Number** | S. 2925 |
| **Introduced** | September 2025 |
| **Sponsors** | Bipartisan coalition |
| **Status** | Committee consideration |
| **Scope** | Federal neurotechnology standards, neural data protection, research ethics |

Key provisions:
- Establishes federal standards for neural data collection, storage, and sharing
- Creates a Neurotechnology Advisory Committee under HHS
- Mandates cybersecurity requirements for neural devices receiving federal funding
- Requires informed consent standards for neurotechnology research
- Addresses Harvest-Now-Decrypt-Later threats to neural data

> **QIF Alignment:** The MIND Act's cybersecurity requirements align directly with QIF's 14-layer security model. QIF-compliant devices would meet or exceed the proposed federal standards.

### Hardened Neurorights-to-Regulatory Crosswalk

| Neuroright | Regulation | Framework Codes | TARA Attack Vector | Technical Evidence | QIF Enforcement |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Cognitive Liberty** | **CCPA (SB 1223)** | NIST AC-3 / ISO A.9 | Signal Injection (T0001) | `firewall.log`: REJECT counts | L8 Neural Firewall |
| **Mental Privacy** | **GDPR / HIPAA** | NIST SC-28 / ISO A.18 | ERP Decoding (T0012) | `anonymizer.log`: Filter counts | BCI Anonymizer |
| **Mental Integrity** | **CCPA (SB 1223) / FDORA** | NIST SI-4 / ISO A.12 | Neural Ransomware (T0002) | `niss_report.json`: Impact score | NISS v1.0 Scoring |
| **Psychological Continuity** | **CCPA (SB 1223)** | NIST PL-4 / ISO A.5 | Calibration Poisoning (T0034) | `identity_guard.log`: Alerts | Scale-Frequency Invariants |

### Hardened Compliance Validation Checklist

- [ ] **Default-Deny Enforced**: Verify L8 Firewall rejects all signals without valid cryptographic signatures.
- [ ] **Quantifiable Anonymization**: Verify the BCI Anonymizer maintains a differential privacy budget (epsilon) below 2.0.
- [ ] **Impact Accountability**: Verify every BCI feature is mapped to a NISS score (Biological/Cognitive/Plasticity).
- [ ] **Tamper-Evident Auditing**: Verify all neural security logs are cryptographically hashed and stored in a secure enclave.

### Regulatory and Structural Gaps

#### 1. HIPAA: The Real-Time Stream Auditing Gap

**Legal Context:** HIPAA requires 6-year retention of access logs for Protected Health Information (PHI).

- **The Gap:** BCIs generate high-velocity neural streams (often 500Hz to 2,000Hz).
- **The Challenge:** Logging every individual packet or "read" event for a continuous neural stream would create a data footprint larger than the neural data itself.
- **QIF Implementation:** Temporal Aggregation Logs (auditing sessions and changes in coherence rather than individual spikes) satisfy the *intent* of HIPAA without shattering the storage overhead.
- **Policy Need:** Regulatory clarification on "Streaming Sovereignty" and how real-time biometric auditing should be handled.

#### 2. GDPR: The Neural Fingerprinting Gap

**Legal Context:** GDPR requires "true anonymization" where data can no longer be linked to an individual.

- **The Gap:** Neural time-series data is fundamentally unique. Much like a fingerprint or a heartbeat, a person's "Coherence Signature" can often be used to re-identify them across sessions.
- **The Challenge:** Stripping the data of all identifiable patterns often destroys the "Security Signature" needed to detect unauthorized neural injection or malicious interference.
- **QIF Implementation:** Differential Privacy (calibrated noise) and Bucketed Transmission minimize re-identification risk while maintaining security utility.
- **Policy Need:** Recognition of "Neural Uniqueness" as a special category where anonymization and utility must be balanced via technical thresholds.

#### 3. CCPA / SB 1223: The Precedent Gap

**Legal Context:** California SB 1223 protects "Mental Integrity," "Cognitive Liberty," and "Psychological Continuity."

- **The Gap:** These are abstract philosophical concepts that have now become binding law, but there is **zero case law** defining their technical boundaries.
- **The Challenge:** At what point does a targeted advertisement become a "violation of cognitive liberty"? When does a neural firewall's "benevolent paternalism" violate a user's autonomy?
- **QIF Implementation:** These rights map directly to NISS (Neural Impact Scoring System) to provide a technical baseline for when a violation has occurred.
- **Policy Need:** Test cases and technical legal standards to define the "Threshold of Violation" for neurorights.

#### 4. FDORA / PATCH Act: The Scoring Standard Gap

**Legal Context:** Section 524B of the FD&C Act (via FDORA) requires medical device makers to provide a "Software Bill of Materials" and perform "Threat Modeling."

- **The Gap:** There is no officially sanctioned "CVSS for Brains." Standard cybersecurity scores (CVSS 4.0) cannot express biological damage, cognitive integrity, or neuroplasticity.
- **The Challenge:** Device makers may satisfy the law with standard IT security scores while missing catastrophic neural-specific risks.
- **QIF Implementation:** NISS v1.0 maps neural-specific impacts (Biological, Cognitive, Plasticity).
- **Policy Need:** Global adoption of a neural-specific impact scoring extension for CVSS to provide a "Common Language" for risk.

#### 5. International: The "Soft Law" Enforcement Gap

**Legal Context:** UNESCO Recommendation (2025) and OECD Principles (2019).

- **The Gap:** Most international frameworks are "Soft Law" that carry moral weight but no binding legal penalties.
- **The Challenge:** Companies can claim "UNESCO Alignment" in their marketing while ignoring the technical enforcement mechanisms that actually protect the user.
- **QIF Implementation:** QIF is built to be a Technical Policy Enforcement Point (PEP). Values are coded into the Neural Firewall, not just stated.
- **Policy Need:** Development of binding international treaties for Neurotechnology that mandate technical enforcement mechanisms, not just ethical statements.

### NIST/ISO Hardened Goals

#### Objective

Provide a standardized, machine-verifiable bridge between high-level ethical frameworks (like UNESCO Neurorights or the CCPA Neurorights Act) and low-level technical evidence (like firewall logs and encryption headers).

#### Why "Hardened"?

The term "Hardened Mapping" distinguishes typical documentation-only compliance from Evidence-Based Compliance.

1. **Auditable Evidence**: Instead of simply claiming "we protect mental privacy," the hardened mapping specifies exactly which log file (`anonymizer.log`) and which filter count confirms the privacy enforcement.
2. **Machine-Readable Registry**: By embedding NIST/ISO codes directly into the `qtara-registrar.json`, the QIF framework enables automated compliance auditing tools to "crawl" the neuro-attack surface and verify control coverage.
3. **Cross-Jurisdictional Stability**: Framework codes from NIST and ISO provide a stable taxonomy that remains relevant regardless of whether the governing law is CCPA, GDPR, or a future federal MIND Act.

#### Hardened Policy Matrix (NISS-to-NIST/ISO Mapping)

| NISS Metric/Threshold | Mandatory Hardened Control | Technical Evidence (Example) | Requirement Level |
| :--- | :--- | :--- | :--- |
| **PINS Flag = True** | **NIST SI-4 (Information System Monitoring)** | Real-time neural telemetry stream via TAL | **CRITICAL** |
| **Biological Impact (BI) >= H** | **NIST AC-3 (Access Control)** | TAL, Neural Firewall: Deny/Permit by band | **MANDATORY** |
| **Mental Privacy (MP) >= H** | **NIST SC-28 (Protection of Info at Rest)** | TAL, Anonymizer: Differential privacy logs | **MANDATORY** |
| **Cognitive Integrity (CG) >= H** | **NIST SI-7 (Software/Firmware Integrity)** | Cryptographically signed neural stimulation staves | **MANDATORY** |
| **Consent Violation (CV) = Implicit**| **ISO/IEC 27001 A.18.1.1 (Compliance)** | Formal audit log of real-time consent handshake | **MANDATORY** |
| **NISS Score >= 7.0 (High)** | **ISO/IEC 27001 A.12.4.1 (Logging)** | Comprehensive system/neural audit log (TAL) retention | **MANDATORY** |

#### Neural Regulatory-as-Code (RaC) Integration

By anchoring NISS scores in NIST/ISO controls, QIF moves from an assessment tool to an Enforcement Platform.

- **Detection-to-Evidence**: When the Neural Firewall detects an attack (e.g., T0001: Signal Jamming), it does not just block it; it tags the event with the corresponding NIST AC-3 control ID for the compliance report in the TAL.
- **Automated Auditing**: Regulators can query the framework for "Evidence of NIST SC-28 compliance" and receive a pre-filtered log of all differentially private neural transfers via the Temporal Aggregation Log.

### QIF Compliance Matrix

**Legend:**
- Full Alignment: QIF meets or exceeds requirement
- Partial Alignment: QIF addresses concern, regulatory gap exists
- Future Work: Requirement identified, implementation planned

| Requirement | FDA | FCC | HIPAA | FTC | NIST | QIF Component |
|-------------|-----|-----|-------|-----|------|---------------|
| **Threat Modeling** | Full | -- | -- | -- | Full | 14-Layer Attack Surface |
| **Access Control** | Full | -- | Full | Full | Full | L8 Firewall Authentication |
| **Data Encryption** | Full | -- | Full | Full | Full | L6 Presentation Layer |
| **Signal Integrity** | Full | Full | -- | -- | Full | Coherence Metric (Cs) |
| **Anomaly Detection** | Full | -- | -- | -- | Full | NSAM, Scale-Frequency |
| **Incident Response** | Full | -- | Full | -- | Full | Alert Escalation |
| **Audit Trail** | Full | -- | Full | -- | Full | Event Logging |
| **Consent Management** | Partial | -- | Full | Full | -- | Consent Framework |
| **Data Minimization** | -- | -- | Full | Full | Full | Kohno Privacy Filters |
| **Secure Updates** | Full | -- | -- | -- | Full | Signed Firmware |
| **Device Identity** | Full | Full | -- | -- | Full | Node Identification |
| **RF Safety** | -- | Full | -- | -- | -- | L1-L2 Validation |
| **Breach Detection** | Partial | -- | Full | Full | Full | NSAM Alerting |

### QIF-Compliant BCI Requirements

#### Mandatory Requirements

| ID | Requirement | QIF Layer | Regulatory Basis |
|----|-------------|-----------|------------------|
| **QIF-R1** | 14-layer security architecture documentation | All | FDA Cybersecurity Guidance |
| **QIF-R2** | Real-time coherence validation (Cs >= 0.7 threshold) | L8-L10 | Signal integrity |
| **QIF-R3** | Neural Gateway firewall with authentication | L8 | Access control |
| **QIF-R4** | End-to-end encryption for neural data | L6 | HIPAA Security Rule |
| **QIF-R5** | NSAM continuous monitoring | L9-L14 | NIST Detect function |
| **QIF-R6** | Kohno threat taxonomy implementation | L11-L14 | Privacy by design |
| **QIF-R7** | Incident response and alerting | All | FDA MDR, HIPAA Breach |
| **QIF-R8** | Secure boot and signed firmware | L1-L3 | Supply chain security |
| **QIF-R9** | Audit logging with tamper evidence | All | HIPAA, NIST |
| **QIF-R10** | Fail-safe degradation modes | L8 | Patient safety |

#### Recommended Enhancements

| ID | Enhancement | Benefit |
|----|-------------|---------|
| **QIF-E1** | Quantum-resistant cryptography | Future-proofing |
| **QIF-E2** | Federated learning for model updates | Privacy preservation |
| **QIF-E3** | Hardware security module (HSM) | Key protection |
| **QIF-E4** | Zero-knowledge proofs for verification | Privacy-preserving audit |

### Certification Pathway

#### Proposed QIF Certification Levels

| Level | Name | Requirements | Use Cases |
|-------|------|--------------|-----------|
| **Level 1** | QIF-Basic | QIF-R1 through QIF-R5 | Research devices |
| **Level 2** | QIF-Clinical | All mandatory (R1-R10) | Medical BCIs |
| **Level 3** | QIF-Consumer | R1-R10 + FTC compliance | Consumer devices |
| **Level 4** | QIF-Critical | All requirements + E1-E4 | High-risk/military |

#### Certification Process

```
┌─────────────────────────────────────────────────────────────────┐
│                    QIF CERTIFICATION PATHWAY                     │
└─────────────────────────────────────────────────────────────────┘

Phase 1: Self-Assessment
├── Complete QIF compliance checklist
├── Document 14-layer architecture
└── Identify gaps

Phase 2: Third-Party Audit
├── Security architecture review
├── Penetration testing (QIF attack scenarios)
└── Code/firmware review

Phase 3: Certification
├── Submit audit report
├── Remediate findings
└── Receive QIF certification

Phase 4: Ongoing Compliance
├── Annual recertification
├── Incident reporting
└── Vulnerability disclosure
```

### International Regulatory Overview

#### Global Normative Frameworks

| Framework | Scope | Status | QIF Alignment |
|-----------|-------|--------|---------------|
| **UNESCO Recommendation on the Ethics of Neurotechnology (2025)** | First global normative framework, 194 Member States | Adopted November 2025 | **15 of 17 elements fully implemented** (see Section 5) |
| **OECD Responsible Innovation in Neurotechnology (2019)** | Policy guidelines for OECD member nations | Active | Accountability, transparency, safety addressed |
| **Council of Europe Strategic Action Plan on Neurotechnology (2025)** | Human rights-based framework for 46 member states | Adopted January 2025 | Aligns with QIF's rights-based approach to cognitive liberty and mental integrity |

#### Latin American Neurorights Legislation

| Country | Legislation | Status | Key Provisions |
|---------|-------------|--------|----------------|
| **Chile** | Constitutional Amendment (Art. 19 no. 1) | Enacted October 2021 | **First country in the world** to constitutionally protect neurorights; protects mental integrity and prohibits unauthorized brain data collection |
| **Chile** | Neuroprotection Law (Law 21.383) | Enacted October 2021 | Implementing legislation; classifies neural data as organ tissue (cannot be commercialized); requires informed consent for neurotechnology |
| **Brazil** | Rio Grande do Sul State Amendment | Enacted 2024 | State-level constitutional protection of neural data; first Brazilian jurisdiction to codify neurorights |
| **Brazil** | Federal Neurorights Bill | Under consideration | Federal constitutional amendment modeled on Chilean approach |
| **Mexico** | General Law on Neurotechnology (GLNN) | Under consideration | Comprehensive national neurotechnology governance framework |

#### European Union

| Regulation | Scope | Status | QIF Alignment |
|------------|-------|--------|---------------|
| **EU MDR 2017/745** | Medical Device Regulation | Active | QIF certification pathway maps to MDR requirements |
| **GDPR** | Data Protection | Active | QIF data minimization, consent, and encryption align |
| **EU AI Act** | AI Systems (including BCIs) | Phased 2025-2027 | High-risk AI transparency requirements met via documentation |
| **EU Neurotechnology Legislative Package** | Dedicated neurotech regulation | Under development (2026) | Anticipated to incorporate UNESCO Recommendation principles |

#### Spain

| Framework | Status | Key Provisions |
|-----------|--------|----------------|
| **Digital Rights Charter** | Adopted 2021 | Includes neurorights provisions guaranteeing mental privacy and cognitive integrity; non-binding but establishes policy direction |

#### Other Jurisdictions

| Region | Key Considerations |
|--------|-------------------|
| **United Kingdom** | Post-Brexit UKCA marking, UK GDPR, active neurotechnology ethics review |
| **Canada** | Health Canada medical device licensing, active neurorights policy discussion |
| **Australia** | TGA regulation, Privacy Act 1988, emerging neurotech ethics guidelines |
| **Japan** | PMDA approval, APPI data protection, active BCI research governance |
| **China** | NMPA regulation, data localization, significant state BCI investment |
| **South Korea** | Emerging neurotechnology ethics framework, KFDA medical device oversight |

#### International Standards Bodies

| Organization | Standard/Initiative | Relevance |
|--------------|---------------------|-----------|
| **ISO** | ISO 13485 (QMS), ISO 27001 (InfoSec), ISO 14971 (Risk) | Quality, security, and risk management for medical devices |
| **IEC** | IEC 62443 (Industrial cybersecurity), IEC 60601 (Medical electrical) | Cybersecurity and electrical safety for neural devices |
| **IEEE** | **P2794** (Neural Interface Research Reporting Standard) | Standardizes how neural interface research is documented and reported |
| **IEEE** | **P2731** (Brain-Computer Interface Terminology Standard) | Establishes common vocabulary for BCI development |
| **IEEE** | IEEE 7000 series (Ethics in Autonomous Systems) | Ethical design principles for AI and autonomous systems |
| **IMDRF** | International Medical Device Regulators Forum | Global coordination of medical device regulation |
| **Neurorights Foundation** | Advocacy and policy advisory | Founded by Rafael Yuste (Columbia); instrumental in Chile's neurorights legislation; advises multiple governments on neurotechnology governance |

---

## 7. The Convergence Problem

### The Problem

No single organization currently bridges cybersecurity governance, risk, and compliance (GRC) with neuroethics for brain-computer interfaces.

On the security side, organizations like NIST, MITRE, and IEC produce world-class frameworks, but none address neural endpoints. On the neuroethics side, UNESCO, the Neurorights Foundation, and the International Neuroethics Society define rights and principles, but none produce technical security controls.

The result: a BCI manufacturer can be FDA-cleared, HIPAA-compliant, and ISO 27001-certified with zero protections against adversarial neurostimulation, neural signal tampering, or cognitive state inference.

| Domain | Key Organizations | What They Produce | What's Missing |
|--------|------------------|-------------------|----------------|
| Security GRC | NIST, ISO/IEC, MITRE, FIRST, IEC 62443 | Frameworks, controls, threat taxonomies, scoring | Neural-specific threat models, BCI security profiles, neural impact metrics |
| Neuroethics | UNESCO, Neurorights Foundation, INS, BCI Society | Rights definitions, ethical principles, policy recommendations | Technical enforcement mechanisms, security controls, audit criteria |
| Medical Device | FDA/CDRH, EU MDR | Safety clearance, manufacturing quality, patching mandates | Neural-specific cybersecurity requirements, threat classification |
| Policy/Legislation | Chile, Colorado, California | Constitutional amendments, privacy laws | Technical standards to operationalize the legislation |

### Why the Silo Exists

Five validated reasons explain why security GRC and neuroethics have not converged:

**Tiny community.** Approximately 50 researchers worldwide work on BCI security. The entire field produces roughly 85 papers total. There is not enough critical mass to form joint working groups.

**No breach has occurred.** IT security standards emerged after breaches created urgency (TJX, Heartland, Target for PCI DSS; OPM for federal cybersecurity). BCI security has no equivalent forcing function yet. The LSL vulnerability (disclosed Feb 2026) is the closest, but it affects a research tool, not a clinical implant.

**Market just started.** The first commercial BCIs cleared FDA in 2025. Standardization requires a market to standardize. PCI DSS took 5 years after payment cards went mainstream. The BCI security standards window is opening now.

**Incentive misalignment.** Security researchers view BCIs as niche (too few devices to matter). Neuroethicists view cybersecurity as an implementation detail (not their department). Neither community has professional incentives to cross the boundary.

**Timeline mismatch.** Standards bodies operate on 3-5 year cycles. BCI development moves faster. By the time a standard completes the ISO process, the technology has shifted. This is why QIF is designed as a living framework (continuous updates) rather than a static standard.

### Lessons from IT Security

Four precedents show how security standardization succeeds. Each offers a lesson for neurosecurity.

#### PCI DSS: Prescriptive Controls Scale Adoption

The payment card industry created PCI DSS without government mandate. Compliance levels scale by transaction volume (Level 1 merchants face full audits; Level 4 does self-assessment). The key insight: prescriptive controls with proportional compliance requirements drove universal adoption.

**Neurosecurity application:** Scale requirements by device invasiveness. An EEG headband (non-invasive, consumer) needs lighter requirements than an intracortical implant (invasive, clinical). QIF's hourglass bands naturally map to compliance tiers.

#### MITRE ATT&CK: Open Taxonomy Becomes Shared Language

ATT&CK succeeded because it described what adversaries actually do (techniques), not what vendors sell (products). It is free, open, and community-maintained. Within 5 years it became the universal language for threat intelligence.

**Neurosecurity application:** TARA follows the same model, using MITRE-compatible IDs, an open taxonomy, and technique-level granularity. The BCI security community needs a shared vocabulary before it can coordinate defense.

#### NIST CSF: Voluntary Adoption Through Market Pressure

NIST CSF has no legal mandate, yet it is near-universally adopted. Adoption was driven by customers, cyber insurers, and investors requiring CSF alignment as a condition of doing business. The framework succeeded by being useful, not mandatory.

**Neurosecurity application:** Neurosecurity GRC will likely follow the same trajectory. Institutional review boards, research ethics committees, and BCI manufacturers' insurers will drive adoption before any government mandate exists.

#### IEC 62443: Physical Interfaces Define Trust Boundaries

IEC 62443 bridged IT and OT security by defining trust boundaries at physical interfaces (zones and conduits) rather than at network layers. This worked because OT environments have fundamentally different physical constraints than IT networks.

**Neurosecurity application:** QIF's hourglass model applies the same principle. The neural interface (I0) is the trust boundary where biology meets silicon. Security controls are defined at this physical interface, not at arbitrary network layers.

---

## 8. Convergence Strategy and Outreach

### Specific Asks for Key Organizations

#### OECD: Connect Your Own Committees

The OECD has both a cybersecurity committee and a neurotechnology committee. They published neurotechnology principles in 2024 and AI principles in 2019. The committees do not collaborate.

**Ask:** Produce a joint working paper connecting cybersecurity governance to neurotechnology principles. A single cross-reference document would be a first.

#### IEEE: Produce a BCI Cybersecurity Standard

IEEE SA has P7700 (neurotechnology ethics) and comprehensive cybersecurity standards. No standard bridges them. The IEEE Brain Initiative has working groups in both domains.

**Ask:** Launch a P27XX BCI cybersecurity standard under IEEE Brain, building on P7700 ethics with 802-series security engineering.

#### MITRE: Create a Neural ATT&CK Sub-Matrix

ATT&CK has sub-matrices for enterprise, mobile, ICS, and cloud. Neural devices are absent. TARA provides 109 techniques in MITRE-compatible format.

**Ask:** Create an ATT&CK sub-matrix for neural devices. TARA can serve as the seed taxonomy, following the same community contribution model that built the ICS matrix.

#### FIRST: Extend CVSS with Neural Impact Metrics

CVSS v4.0 cannot score biological harm, cognitive integrity loss, or reversibility of neural damage. NISS demonstrates what neural-specific scoring dimensions look like.

**Ask:** Add optional neural impact metrics to CVSS, or publish a CVSS supplemental guide for medical/neural devices using NISS as a reference model.

#### NIST: Develop a BCI Security Profile for CSF 2.0

CSF 2.0 is device-agnostic by design. A BCI security profile would map CSF categories to neural-specific subcategories without changing the core framework.

**Ask:** Publish a BCI security profile (similar to the manufacturing profile or ransomware profile) with neural integrity and cognitive confidentiality subcategories.

#### FDA: Add Neural Threat Categories to 524B

FDA Guidance 524B covers medical device cybersecurity but treats all devices identically. FDORA Sec. 3305 mandates patching but not neural-specific threat assessment.

**Ask:** Add neural-specific threat categories to 524B guidance. Require threat models that account for cognitive impact, not just device availability.

### What QIF Bridges

Each neuroethics principle has a corresponding security gap. QIF fills the gap with an engineering component.

| Neuroethics Principle | Security Gap | QIF Component |
|----------------------|-------------|---------------|
| Mental Privacy | No neural data confidentiality controls | NISS scoring + NSP encryption + band-level access controls |
| Mental Integrity | No neural signal tampering detection | Neurowall coherence monitoring + TARA integrity techniques |
| Cognitive Liberty | No consent enforcement mechanism | Consent-per-band access model + informed consent framework |
| Psychological Continuity | No longitudinal signal integrity verification | Hash-chain signal provenance + temporal coherence baselines |
| Fair Augmentation | No equitable access assessment framework | Dual-use classification in TARA + therapeutic/attack boundary mapping |

### Predecessor Research

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

## 9. Open Invitation

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

## References

### US Regulations

1. Food and Drug Administration. (2021). *Implanted Brain-Computer Interface (BCI) Devices for Patients with Paralysis or Amputation: Non-clinical Testing and Clinical Considerations*. Final Guidance.
2. Food and Drug Administration. (2023). *Cybersecurity in Medical Devices: Quality System Considerations and Content of Premarket Submissions*. FDA-2023-D-0100.
3. Food and Drug Administration. (2026). *Cybersecurity in Medical Devices: Quality System Considerations and Content of Premarket Submissions*. Final Guidance.
4. U.S. Congress. (2022). *Food and Drug Omnibus Reform Act of 2022 (FDORA)*. Division FF of the Consolidated Appropriations Act, 2023 (Pub. L. 117-328). Added Section 524B to the FD&C Act.
5. U.S. Congress. (2022). *Protecting and Transforming Cyber Health Care Act of 2022 (PATCH Act)*. Incorporated into FDORA.
6. U.S. Department of Health and Human Services. (2013). *HIPAA Security Rule*. 45 CFR Part 160 and Part 164.
7. Federal Communications Commission. (2023). *Title 47 Code of Federal Regulations*.
8. National Institute of Standards and Technology. (2024). *Cybersecurity Framework 2.0*. NIST CSF 2.0.
9. National Institute of Standards and Technology. (2020). *Security and Privacy Controls for Information Systems and Organizations*. NIST SP 800-53 Rev. 5.
10. U.S. Senate. (2025). *S. 2925: Mental-health Innovation and Neurotechnology Development (MIND) Act*.

### US State Legislation

11. Colorado General Assembly. (2024). *H.B. 24-1058: Concerning Protections for Biological and Neural Data*.
12. California Legislature. (2024). *SB 1223: California Consumer Privacy Act, Neurorights*. Effective January 1, 2025.
13. Montana Legislature. (2025). *SB 163: Neural Data Privacy Act*.
14. Connecticut General Assembly. (2026). *SB 1295: An Act Concerning Neurotechnology Consumer Protection*.

### International Frameworks and Legislation

15. UNESCO. (2025). *Recommendation on the Ethics of Neurotechnology*. Adopted at the 43rd session of the General Conference. https://www.unesco.org/en/ethics-neurotech/recommendation
16. UNESCO. (2021). *Ethical Issues of Neurotechnology*. International Bioethics Committee (IBC). https://unesdoc.unesco.org/ark:/48223/pf0000378724
17. UNESCO. (2025). *Report of the Director-General on the Draft Recommendation on the Ethics of Neurotechnology*. https://unesdoc.unesco.org/ark:/48223/pf0000393266
18. UNESCO. (2024). *First Draft of the Recommendation on the Ethics of Neurotechnology*. https://unesdoc.unesco.org/ark:/48223/pf0000391074
19. OECD. (2019). *Recommendation on Responsible Innovation in Neurotechnology*. https://legalinstruments.oecd.org/api/print?ids=658&Lang=en
20. Council of Europe. (2025). *Strategic Action Plan on Neurotechnology*.
21. Republic of Chile. (2021). *Constitutional Amendment on Neurorights* (Art. 19 no. 1) and *Neuroprotection Law* (Law 21.383).
22. Spain. (2021). *Digital Rights Charter*.
23. EU Regulation 2017/745 (Medical Device Regulation).
24. EU Regulation 2024/1689 (AI Act).

### Academic Sources

25. Ienca, M., & Andorno, R. (2017). Towards new human rights in the age of neuroscience and neurotechnology. *Life Sciences, Society and Policy*, 13(1), 5.
26. Yuste, R., Goering, S., Arcas, B. A. Y., et al. (2017). Four ethical priorities for neurotechnologies and AI. *Nature*, 551(7679), 159-163.
27. Goering, S., et al. (2021). Recommendations for responsible development and application of neurotechnologies. *Neuroethics*, 14, 365-386.
28. Martinovic, I., et al. (2012). On the feasibility of side-channel attacks with brain-computer interfaces. *USENIX Security Symposium*.
29. Grossman, N., et al. (2017). Noninvasive deep brain stimulation via temporally interfering electric fields. *Cell*, 169(6), 1029-1041.
30. Izhikevich, E.M. (2007). *Dynamical Systems in Neuroscience: The Geometry of Excitability and Bursting*. MIT Press.
31. Kaveh, A., et al. (2020). In-ear EEG: robust, unobtrusive, automatic. *IEEE Transactions on Biomedical Engineering*.
32. Marr, D. (1982). *Vision: A Computational Investigation into the Human Representation and Processing of Visual Information*. W.H. Freeman.
33. Lazaro-Munoz, G., Pham, M. T., Munoz, K. A., et al. (2020). Researcher Perspectives on Ethical Considerations in Adaptive Deep Brain Stimulation Trials. *Frontiers in Human Neuroscience*, 14, 578695.
34. Lazaro-Munoz, G., Pham, M. T., Munoz, K. A., et al. (2022). Post-trial access in implanted neural device research. *Brain Stimulation*, 15(5), 1029-1036.
35. Munoz, K. A., Blumenthal-Barby, J., Storch, E. A., Torgerson, L., & Lazaro-Munoz, G. (2020). Pediatric Deep Brain Stimulation for Dystonia: Current State and Ethical Considerations. *Cambridge Quarterly of Healthcare Ethics*, 29(4), 557-573.
36. Denning, T., Matsuoka, Y., & Kohno, T. (2009). Neurosecurity: security and privacy for neural devices. *Neurosurgical Focus*, 27(1), E7.
37. Bonaci, T., Calo, R., & Chizeck, H. J. (2015). App Stores for the Brain: Privacy & Security in Brain-Computer Interfaces. *IEEE Ethics*.
38. Bernal, S. L., Cammack, D., & Peaceful, I. (2021). BCI Attack Taxonomy. Published survey.
39. Schroder, T., Sirbu, R., Park, S., Morley, J., Street, S., & Floridi, L. (2025). Cyber Risks to Next-Gen Brain-Computer Interfaces: Analysis and Recommendations. arXiv:2508.12571.
40. Landau, S. (2020). Neural data privacy implications. Published work on surveillance and neural data.
41. Kohno, T., & Narayanan, A. (2009). Security and Privacy of Medical Devices. *Proceedings of IEEE S&P*.

### Industry Standards

42. ISO/IEC 27001:2022. Information Security Management Systems.
43. IEC 62443. Industrial Automation and Control Systems Security.
44. AICPA. SOC 2 Trust Services Criteria.
45. PCI Security Standards Council. PCI DSS v4.0.
46. International Medical Device Regulators Forum. (2017). *Software as a Medical Device: Possible Framework for Risk Categorization and Corresponding Considerations*.
47. Association for the Advancement of Medical Instrumentation. (2022). *AAMI TIR57: Principles for Medical Device Security, Risk Management*.
48. IEEE Standards Association. (in development). *P2794: Standard for Reporting in Neural Interface Research*.
49. IEEE Standards Association. (in development). *P2731: Standard for Brain-Computer Interface Terminology*.

---

## Document History

| Version | Date | Changes |
|---------|------|---------|
| 3.0 | 2026-02-21 | Unified governance document consolidating: NEUROSECURITY.md, NEUROSECURITY-GRC.md, NEUROSECURITY_GRC_CONVERGENCE.md, NEUROETHICS_ALIGNMENT.md, UNESCO_ALIGNMENT.md, REGULATORY_COMPLIANCE.md. Added Security GRC Counterpart mappings to neuroethics and UNESCO sections. Previous versions archived in governance/archive/. |

---

## Related Documents

- [QIF-NEUROETHICS.md](QIF-NEUROETHICS.md) - QIF neuroethics principles and design rationale
- [INFORMED_CONSENT_FRAMEWORK.md](INFORMED_CONSENT_FRAMEWORK.md) - Consent requirements including pediatric and incapacity considerations
- [POST_DEPLOYMENT_ETHICS.md](POST_DEPLOYMENT_ETHICS.md) - Lifecycle obligations and post-trial device access
- [TRANSPARENCY.md](TRANSPARENCY.md) - Human-AI collaboration audit trail

---

*This is a living document. As regulations evolve and international frameworks are added, this guide will be updated to reflect current requirements.*
