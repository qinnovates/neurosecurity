---
title: "Neurosecurity GRC Gap Derivation"
description: "Systematic mapping of existing regulatory, ethical, and security frameworks to BCI security. Identifies what exists, what partially applies, and what is missing entirely."
order: 12
---

# Neurosecurity GRC Gap Derivation

> **Methodology:** For every framework cited below, we follow the same process: state what the framework says, identify what it covers for BCIs, and document the specific gap. The gaps are the derivation. They define why neurosecurity GRC must exist as a discipline.

---

## 1. The Three Regulatory Domains

BCI security sits at the intersection of three regulatory domains that do not talk to each other:

**Domain A: Medical Device Regulations** (FDA, FDORA, EU MDR)
Controls device safety, manufacturing quality, and (recently) cybersecurity. Does not address neural data as a special category.

**Domain B: Privacy and Neurorights** (State neurorights laws, HIPAA, GDPR Art. 9, Chile Law 21.383, UNESCO 2025)
Controls consent, data handling, and (aspirationally) cognitive liberty. Does not specify technical security controls.

**Domain C: IT Security Frameworks** (NIST SP 800-53, ISO 27001, IEC 62443, SOC 2, PCI DSS)
Provides comprehensive control catalogs for information systems. Does not address biological endpoints, neural data properties, or cognitive impact.

The gap is the center: **no framework addresses all three simultaneously.** A BCI manufacturer can be FDA-cleared, HIPAA-compliant, and ISO 27001-certified, and still have zero protections against adversarial neurostimulation, neural signal tampering, or cognitive state inference.

---

## 2. Framework-by-Framework Gap Analysis

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

---

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

---

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

**Qinnovate mapping:** 5 NIST controls mapped in [REGULATORY_COMPLIANCE.md](REGULATORY_COMPLIANCE.md). 1,145+ controls unmapped. See [NIST/ISO Hardened Goals](REGULATORY_COMPLIANCE.md#nistiso-hardened-goals).

#### NIST Cybersecurity Framework 2.0 (Feb 2024)

**What it says:** Six functions: Govern, Identify, Protect, Detect, Respond, Recover. Govern is new and placed at center.

**What it covers for BCIs:** The Govern function aligns with neurotechnology oversight boards, ethical review of security trade-offs, and supply chain management for neural implant components.

**Gap:** Sector-agnostic. No healthcare or medical device profile published for CSF 2.0. No neural-data-specific subcategories.

#### ISO/IEC 27001:2022

**What it says:** 93 controls in four themes (Organizational, People, Physical, Technological). Information Security Management System (ISMS) standard.

**What it covers for BCIs:** Control objectives (confidentiality, integrity, availability) apply to neural data. Organizational and people controls apply to BCI development teams.

**Gap:** Designed for organizational information systems, not embedded medical devices. No neural-data-specific controls. No asset classification for neural data. Physical security controls assume traditional IT infrastructure, not surgically implanted hardware.

**Qinnovate mapping:** 5 ISO controls mapped in [REGULATORY_COMPLIANCE.md](REGULATORY_COMPLIANCE.md). 88 controls unmapped.

#### IEC 62443 (Industrial Automation and Control Systems Security)

**What it says:** Zones and conduits model. Security levels SL-1 through SL-4. Secure product development lifecycle (Part 4-1). Component security requirements (Part 4-2). FDA recognizes IEC 62443 as a consensus standard for medical devices (2014).

**What it covers for BCIs:** Closest architectural parallel. BCIs are cyber-physical systems like industrial control systems. Zones: implant, external controller, clinician workstation, cloud platform. Conduits: RF link, USB, internet. Security levels map to attacker sophistication.

**Gap:** Does not address biological endpoints. Threat models assume industrial processes (valves, motors), not neural tissue. No guidance on neurological harm from security incidents. Real-time latency requirements of neural prostheses may conflict with security overhead.

**Qinnovate mapping:** No IEC 62443 zone mapping exists yet. This is identified as a priority gap.

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

## 3. The Seven Unaddressed Properties

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

---

## 4. Regulatory Coverage Matrix

This matrix maps which frameworks cover which security properties for BCIs. A checkmark means the framework addresses this property. A tilde (~) means partial coverage. Empty means no coverage.

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

## 5. Qinnovate's GRC Convergence Strategy

Rather than inventing from nothing, Qinnovate maps existing frameworks and fills only the gaps:

| GRC Step | Existing Foundation | What It Covers | Qinnovate Extension | What It Adds |
|----------|-------------------|----------------|---------------------|-------------|
| **Requirements** | FDA, FDORA, HIPAA, GDPR Art. 9, State neurorights laws | Device safety, generic cybersecurity, data privacy consent | [Regulatory Compliance Guide](REGULATORY_COMPLIANCE.md) | Maps all existing requirements. Identifies 7 structural gaps where no regulation exists. |
| **Policy** | NIST SP 800-53, ISO 27001, OECD Principles, IEEE P7700 | Information security controls, organizational governance, ethical principles | [NIST/ISO Hardened Mapping](REGULATORY_COMPLIANCE.md#nistiso-hardened-goals), [Neurorights Alignment](NEUROETHICS_ALIGNMENT.md), [Informed Consent](INFORMED_CONSENT_FRAMEWORK.md) | Anchors NISS scores to NIST/ISO control IDs. Adds neurorights policy layer. Operationalizes consent for BCIs. |
| **Implementation** | IEC 62443 (OT security patterns), FDORA (patching lifecycle) | Zones/conduits model, secure development lifecycle, vulnerability management | [QIF](https://qinnovate.com/whitepaper/), [NSP](https://qinnovate.com/nsp/), [Neurowall](../tools/neurowall/), [TARA](https://qinnovate.com/TARA/), [NISS](https://qinnovate.com/scoring/) | Neural-specific security architecture, post-quantum wire protocol, real-time coherence monitoring, 109-technique threat registry, neural impact scoring. |
| **Audit** | SOC 2 methodology, ISO 27001 certification process | Evidence collection, observation periods, control testing | [Transparency audit trail](TRANSPARENCY.md), [Citation verification](../scripts/verify/) | Cross-AI validation log, living citation pipeline, regulatory-as-code (planned). |

---

## 6. The Maturity Path

Based on PCI DSS evolution (20+ years from fragmentation to maturity), neurosecurity GRC will likely follow a similar trajectory:

| Phase | PCI DSS Timeline | Neurosecurity Equivalent | Status |
|-------|-----------------|--------------------------|--------|
| **Fragmentation** | Pre-2004: Each card brand had its own program | Each BCI company self-defines security | **Current state** |
| **Unification** | 2004: PCI DSS v1.0 unified standards | QIF, TARA, NISS: first unified BCI security framework | **In progress (Qinnovate)** |
| **Governance body** | 2006: PCI SSC established | Neural Data Security Standards Council | **Not yet** |
| **Assessor ecosystem** | 2006+: QSA certification | Certified neural security assessors | **Not yet** |
| **Tiered compliance** | Levels 1-4 by transaction volume | Tiers by device invasiveness: consumer EEG, surface electrode, implanted, deep brain | **Proposed** |
| **Regulatory adoption** | PCI DSS referenced by regulators | BCI security framework referenced by FDA, EU MDR | **Not yet** |

---

## References

- FDA. (2021). Implanted Brain-Computer Interface (BCI) Devices for Patients with Paralysis or Amputation: Non-clinical Testing and Clinical Considerations. Final Guidance.
- FDA. (2026). Cybersecurity in Medical Devices: Quality System Considerations and Content of Premarket Submissions. Final Guidance.
- FDORA Section 3305, Consolidated Appropriations Act, FY2023 (Pub. L. 117-328).
- Colorado HB 24-1058 (2024). Protections for Biological and Neural Data.
- California SB 1223 (2024). California Consumer Privacy Act: Neural Data.
- Chile Law 21.383 (2021). Constitutional Amendment on Neurorights.
- EU Regulation 2024/1689 (AI Act).
- EU Regulation 2017/745 (Medical Device Regulation).
- UNESCO. (2025). Recommendation on the Ethics of Neurotechnology.
- NIST SP 800-53 Rev 5 (2020). Security and Privacy Controls for Information Systems and Organizations.
- ISO/IEC 27001:2022. Information Security Management Systems.
- IEC 62443. Industrial Automation and Control Systems Security.
- AICPA. SOC 2 Trust Services Criteria.
- PCI Security Standards Council. PCI DSS v4.0.
- Ienca, M. & Andorno, R. (2017). Towards new human rights in the age of neuroscience and neurotechnology. *Life Sciences, Society and Policy*, 13(1), 5.
- Yuste, R., et al. (2017). Four ethical priorities for neurotechnologies and AI. *Nature*, 551(7679), 159-163.
- OECD. (2019). Recommendation on Responsible Innovation in Neurotechnology.

---

*This document is part of the [Qinnovate governance suite](../governance/). See also: [Why Neurosecurity?](NEUROSECURITY.md) | [Regulatory Compliance](REGULATORY_COMPLIANCE.md) | [Transparency Statement](TRANSPARENCY.md)*
