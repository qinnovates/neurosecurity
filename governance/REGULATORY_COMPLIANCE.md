---
title: "Regulatory Compliance Guide"
description: "Mapping QIF-compliant BCIs to regulatory requirements for safe, legal deployment"
order: 5
---

# QIF Framework: Regulatory Compliance Guide

> Mapping QIF-compliant BCIs to regulatory requirements for safe, legal deployment.

**Last Updated:** 2026-02-15
**Version:** 2.1
**Status:** Living Document — US & International Coverage

---

## Table of Contents

- [Executive Summary](#executive-summary)
- [Why Compliance Matters Now](#why-compliance-matters-now)
- [US Regulatory Landscape](#us-regulatory-landscape)
  - [Food and Drug Administration (FDA)](#food-and-drug-administration-fda)
  - [Federal Communications Commission (FCC)](#federal-communications-commission-fcc)
  - [Health Insurance Portability and Accountability Act (HIPAA)](#health-insurance-portability-and-accountability-act-hipaa)
  - [Federal Trade Commission (FTC)](#federal-trade-commission-ftc)
  - [National Institute of Standards and Technology (NIST)](#national-institute-of-standards-and-technology-nist)
  - [State-Level Regulations](#state-level-regulations)
- [US Federal Legislation](#us-federal-legislation)
- [QIF Compliance Matrix](#qif-compliance-matrix)
- [QIF-Compliant BCI Requirements](#qif-compliant-bci-requirements)
- [Certification Pathway](#certification-pathway)
- [International Regulatory Landscape](#international-regulatory-landscape)
- [References](#references)

---

## Executive Summary

Brain-Computer Interfaces (BCIs) represent one of the most consequential technological developments of the 21st century. As these devices transition from research laboratories to consumer markets, the regulatory framework governing their deployment will determine whether this technology serves humanity or endangers it.

**The QIF Framework establishes security and safety standards that complement—and in some cases exceed—existing regulatory requirements.** This document maps QIF compliance to US federal and state regulations, international frameworks, and emerging neurotechnology legislation worldwide, identifying gaps that manufacturers, regulators, and policymakers must address before mass BCI adoption.

> **Key Principle:** Mass adoption of BCIs is inevitable. The question is not *whether* but *how*. QIF-compliant devices prioritize security, privacy, and human sovereignty from the design phase—not as regulatory afterthoughts.

---

## Why Compliance Matters Now

### The Regulatory Window

We are currently in a critical regulatory window. BCIs are transitioning from:

| Phase | Characteristics | Regulatory Posture |
|-------|-----------------|-------------------|
| **Research** (2000-2020) | Academic labs, small cohorts, IRB oversight | Minimal commercial regulation |
| **Early Clinical** (2020-2026) | FDA breakthrough designations, compassionate use | Emerging medical device framework |
| **Consumer Transition** (2026-2030) | Non-invasive consumer devices, wellness claims | Regulatory gap — unclear jurisdiction |
| **Mass Adoption** (2030+) | Widespread deployment, critical infrastructure | **Urgent need for comprehensive framework** |

### Consequences of Delayed Action

| Risk Category | Without Proactive Regulation | With QIF-Compliant Framework |
|---------------|------------------------------|------------------------------|
| **Security Incidents** | Neural ransomware, cognitive hijacking, mass exploitation | Defense-in-depth, attack detection, rapid response |
| **Privacy Violations** | Thought surveillance, neural data harvesting, identity theft | Encrypted transport, data minimization, consent enforcement |
| **Public Trust** | Backlash, adoption resistance, restrictive legislation | Informed adoption, transparent security, ethical deployment |
| **International Competition** | Fragmented standards, race to bottom | Unified standards, global interoperability |

---

## US Regulatory Landscape

### Food and Drug Administration (FDA)

The FDA is the primary regulator for medical BCIs in the United States. BCI devices fall under the Medical Device classification.

#### Device Classification

| Class | Risk Level | Examples | Regulatory Pathway |
|-------|------------|----------|-------------------|
| **Class I** | Low | External EEG headbands (wellness) | General Controls, Exempt |
| **Class II** | Moderate | Non-invasive neurofeedback, cochlear implants | 510(k) Premarket Notification |
| **Class III** | High | Implanted neural interfaces, deep brain stimulators | Premarket Approval (PMA) |

#### Key FDA Regulations

| Regulation | Citation | QIF Alignment |
|------------|----------|---------------|
| **Quality System Regulation** | 21 CFR Part 820 | QIF L8-L14 validation checkpoints map to design controls |
| **Medical Device Reporting** | 21 CFR Part 803 | NSAM alerting provides adverse event detection |
| **Unique Device Identification** | 21 CFR Part 830 | QIF node identification supports UDI requirements |
| **Cybersecurity Guidance** | FDA-2023-D-0100 | **Direct alignment** — QIF exceeds current FDA cyber guidance |
| **Software as Medical Device** | IMDRF/SaMD | QIF firmware security addresses SaMD concerns |

#### FDA Breakthrough Device Designation

Several BCI companies have received Breakthrough Device Designation:

- **Synchron** — Stentrode endovascular BCI
- **Blackrock Neurotech** — Utah Array systems
- **Neuralink** — N1 implant
- **Paradromics** — High-bandwidth cortical interface

> **QIF Recommendation:** Breakthrough designation should require demonstrated cybersecurity architecture. Current designation focuses on therapeutic benefit without mandating security standards.

#### FDORA & PATCH Act (2022): Mandatory Cybersecurity Submissions

The **Food and Drug Omnibus Reform Act of 2022 (FDORA)** and **Protecting and Transforming Cyber Health Care Act of 2022 (PATCH Act)** amended the Federal Food, Drug, and Cosmetic Act by adding **Section 524B**, which requires cybersecurity information to be submitted alongside premarket applications for all cyber devices. As of October 2023, FDA enforces a **Refuse-to-Accept (RTA) policy** — submissions lacking cybersecurity documentation are rejected before review begins.

| FDORA/PATCH Requirement | What Manufacturers Must Submit | QIF Tool |
|------------------------|-------------------------------|----------|
| **Threat modeling** | Identification of cybersecurity risks and attack vectors | TARA — 71 neural-specific attack techniques across 7 domains |
| **Vulnerability assessment** | Known vulnerabilities and severity ratings | NISS — extends CVSS v4.0 with 5 neural-specific metrics |
| **Software Bill of Materials (SBOM)** | Component transparency | QIF component registry |
| **Security architecture** | Design controls for cybersecurity | 11-band hourglass security model |
| **Post-market plan** | Ongoing vulnerability monitoring and patching | NSAM continuous monitoring |

> **The structural gap:** Section 524B mandates *that* manufacturers perform threat modeling but does not specify *which* threat taxonomy or scoring system to use for neural devices. The referenced standards (CVSS, IEC 62443, AAMI TIR57, ISO 14971) provide processes and scoring for general medical devices — none catalog neural-specific attack techniques. TARA and NISS fill this gap, providing the neural threat registry and impact scoring that manufacturers need to satisfy FDORA requirements for BCI submissions.

#### FDA Cybersecurity Guidance (2023)

The FDA's 2023 final guidance on cybersecurity for medical devices (FDA-2023-D-0100), implementing Section 524B, establishes:

| Requirement | FDA Expectation | QIF Implementation |
|-------------|-----------------|-------------------|
| **Threat Modeling** | Identify attack vectors | QIF layered attack surface mapping |
| **Security by Design** | Built-in security controls | L8 Neural Firewall, coherence validation |
| **Software Bill of Materials** | Component transparency | QIF component registry |
| **Vulnerability Management** | Ongoing security updates | NSAM continuous monitoring |
| **Incident Response** | Breach detection/response | Alert escalation, quarantine protocols |

---

### Federal Communications Commission (FCC)

BCIs with wireless capabilities fall under FCC jurisdiction for electromagnetic emissions and spectrum use.

#### Applicable Regulations

| Regulation | Scope | BCI Relevance |
|------------|-------|---------------|
| **47 CFR Part 15** | Unlicensed devices | Consumer EEG, Bluetooth/WiFi BCIs |
| **47 CFR Part 18** | Industrial/scientific/medical | Medical-grade implants |
| **47 CFR Part 95** | Medical Device Radio (MICS) | Implanted device telemetry |
| **SAR Limits** | Specific Absorption Rate | RF exposure near brain tissue |

#### QIF-FCC Alignment

| FCC Concern | QIF Solution |
|-------------|--------------|
| Electromagnetic interference | L1-L2 signal integrity validation |
| Unauthorized transmission | L8 firewall blocks rogue RF |
| Spectrum security | Transport layer authentication |

---

### Health Insurance Portability and Accountability Act (HIPAA)

Neural data constitutes Protected Health Information (PHI) under HIPAA when collected in healthcare contexts.

#### HIPAA Requirements

| Rule | Requirements | QIF Alignment |
|------|--------------|---------------|
| **Privacy Rule** | Minimum necessary use, patient consent, disclosure limits | QIF data minimization, consent framework |
| **Security Rule** | Administrative, physical, technical safeguards | QIF L6-L14 encryption, access controls |
| **Breach Notification** | 60-day notification for breaches >500 individuals | NSAM detection enables rapid breach identification |

#### Neural Data Classification

| Data Type | HIPAA Status | QIF Protection |
|-----------|--------------|----------------|
| Raw EEG/neural signals | PHI if linked to individual | Encrypted at L6, anonymized at L10 |
| Decoded intentions/commands | PHI — highly sensitive | Never stored, processed ephemerally |
| Cognitive state inferences | PHI — derived health data | Kohno taxonomy protection |
| Device telemetry | PHI if linked | Pseudonymized device IDs |

> **Critical Gap:** HIPAA was designed for medical records, not real-time neural streams. New regulatory frameworks are needed for continuous neural data flows.

---

### Federal Trade Commission (FTC)

The FTC regulates consumer BCIs marketed outside medical contexts (wellness, productivity, gaming).

#### FTC Authority

| Area | FTC Concern | QIF Relevance |
|------|-------------|---------------|
| **Deceptive Practices** | False claims about BCI capabilities | Honest coherence reporting |
| **Unfair Practices** | Inadequate data security | QIF security baseline |
| **Children's Privacy (COPPA)** | Under-13 protections | Pediatric BCI considerations |
| **Health Claims** | Wellness vs. medical distinctions | Clear device classification |

#### FTC Enforcement Actions (Precedents)

| Case | Relevance to BCIs |
|------|-------------------|
| **FTC v. Lumosity (2016)** | Brain training claims must be substantiated |
| **FTC v. Practice Fusion (2020)** | Health tech data practices scrutinized |
| **FTC v. BetterHelp (2023)** | Mental health data requires heightened protection |

---

### National Institute of Standards and Technology (NIST)

NIST provides cybersecurity frameworks that apply to BCI manufacturers.

#### Applicable Frameworks

| Framework | Application | QIF Mapping |
|-----------|-------------|-------------|
| **NIST Cybersecurity Framework (CSF) 2.0** | Identify, Protect, Detect, Respond, Recover | QIF lifecycle security |
| **NIST SP 800-53** | Security and Privacy Controls | QIF control implementation |
| **NIST SP 800-183** | Networks of Things | L1-L7 network security |
| **NIST AI RMF** | AI Risk Management | Cognitive layer (L13-L14) governance |

#### NIST CSF → QIF Mapping

| NIST Function | NIST Categories | QIF Implementation |
|---------------|-----------------|-------------------|
| **IDENTIFY** | Asset Management, Risk Assessment | 14-layer asset inventory, attack surface mapping |
| **PROTECT** | Access Control, Data Security, Maintenance | L8 Firewall, Coherence validation, secure updates |
| **DETECT** | Anomalies, Continuous Monitoring | NSAM, Scale-frequency anomaly detection |
| **RESPOND** | Response Planning, Communications | Alert escalation, quarantine protocols |
| **RECOVER** | Recovery Planning, Improvements | Failsafe modes, post-incident learning |

---

### State-Level Regulations

Several US states have enacted neural data protections, with a growing wave of legislation since 2024.

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

#### California Consumer Privacy Act (CCPA) Implications

With SB 1223 (effective January 2025), California's CCPA now explicitly covers neural data:

| CCPA Right | Neural Data Application |
|------------|------------------------|
| Right to Know | What neural data is collected, including inferred cognitive states |
| Right to Delete | Erasure of neural recordings and derived data |
| Right to Opt-Out | Decline neural data sale — explicit opt-in required for sensitive neural data |
| Right to Non-Discrimination | No penalties for exercising neural data rights |

> **QIF Position:** While state-level action demonstrates urgency, fragmentation creates compliance complexity. Federal neural data legislation is needed — see the MIND Act below.

---

### US Federal Legislation

#### MIND Act (S. 2925)

The **Mental-health Innovation and Neurotechnology Development (MIND) Act** (S. 2925), introduced in September 2025, represents the first US federal bill specifically addressing neurotechnology governance.

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

---

## QIF Compliance Matrix

This matrix maps QIF Framework components to regulatory requirements.

### Legend

- ✅ **Full Alignment** — QIF meets or exceeds requirement
- ⚠️ **Partial Alignment** — QIF addresses concern, regulatory gap exists
- 🔲 **Future Work** — Requirement identified, implementation planned

### Compliance Matrix

| Requirement | FDA | FCC | HIPAA | FTC | NIST | QIF Component |
|-------------|-----|-----|-------|-----|------|---------------|
| **Threat Modeling** | ✅ | — | — | — | ✅ | 14-Layer Attack Surface |
| **Access Control** | ✅ | — | ✅ | ✅ | ✅ | L8 Firewall Authentication |
| **Data Encryption** | ✅ | — | ✅ | ✅ | ✅ | L6 Presentation Layer |
| **Signal Integrity** | ✅ | ✅ | — | — | ✅ | Coherence Metric (Cₛ) |
| **Anomaly Detection** | ✅ | — | — | — | ✅ | NSAM, Scale-Frequency |
| **Incident Response** | ✅ | — | ✅ | — | ✅ | Alert Escalation |
| **Audit Trail** | ✅ | — | ✅ | — | ✅ | Event Logging |
| **Consent Management** | ⚠️ | — | ✅ | ✅ | — | Consent Framework |
| **Data Minimization** | — | — | ✅ | ✅ | ✅ | Kohno Privacy Filters |
| **Secure Updates** | ✅ | — | — | — | ✅ | Signed Firmware |
| **Device Identity** | ✅ | ✅ | — | — | ✅ | Node Identification |
| **RF Safety** | — | ✅ | — | — | — | L1-L2 Validation |
| **Breach Detection** | ⚠️ | — | ✅ | ✅ | ✅ | NSAM Alerting |

---

## QIF-Compliant BCI Requirements

For a BCI to be considered QIF-compliant, it must implement the following:

### Mandatory Requirements

| ID | Requirement | QIF Layer | Regulatory Basis |
|----|-------------|-----------|------------------|
| **QIF-R1** | 14-layer security architecture documentation | All | FDA Cybersecurity Guidance |
| **QIF-R2** | Real-time coherence validation (Cₛ ≥ 0.7 threshold) | L8-L10 | Signal integrity |
| **QIF-R3** | Neural Gateway firewall with authentication | L8 | Access control |
| **QIF-R4** | End-to-end encryption for neural data | L6 | HIPAA Security Rule |
| **QIF-R5** | NSAM continuous monitoring | L9-L14 | NIST Detect function |
| **QIF-R6** | Kohno threat taxonomy implementation | L11-L14 | Privacy by design |
| **QIF-R7** | Incident response and alerting | All | FDA MDR, HIPAA Breach |
| **QIF-R8** | Secure boot and signed firmware | L1-L3 | Supply chain security |
| **QIF-R9** | Audit logging with tamper evidence | All | HIPAA, NIST |
| **QIF-R10** | Fail-safe degradation modes | L8 | Patient safety |

### Recommended Enhancements

| ID | Enhancement | Benefit |
|----|-------------|---------|
| **QIF-E1** | Quantum-resistant cryptography | Future-proofing |
| **QIF-E2** | Federated learning for model updates | Privacy preservation |
| **QIF-E3** | Hardware security module (HSM) | Key protection |
| **QIF-E4** | Zero-knowledge proofs for verification | Privacy-preserving audit |

---

## Certification Pathway

### Proposed QIF Certification Levels

| Level | Name | Requirements | Use Cases |
|-------|------|--------------|-----------|
| **Level 1** | QIF-Basic | QIF-R1 through QIF-R5 | Research devices |
| **Level 2** | QIF-Clinical | All mandatory (R1-R10) | Medical BCIs |
| **Level 3** | QIF-Consumer | R1-R10 + FTC compliance | Consumer devices |
| **Level 4** | QIF-Critical | All requirements + E1-E4 | High-risk/military |

### Certification Process

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

---

## International Regulatory Landscape

### Global Normative Frameworks

| Framework | Scope | Status | QIF Alignment |
|-----------|-------|--------|---------------|
| **UNESCO Recommendation on the Ethics of Neurotechnology (2025)** | First global normative framework — 194 Member States | Adopted November 2025 | **15 of 17 elements fully implemented** — see [UNESCO_ALIGNMENT.md](UNESCO_ALIGNMENT.md) |
| **OECD Responsible Innovation in Neurotechnology (2019)** | Policy guidelines for OECD member nations | Active | Accountability, transparency, safety addressed |
| **Council of Europe Strategic Action Plan on Neurotechnology (2025)** | Human rights-based framework for 46 member states | Adopted January 2025 | Aligns with QIF's rights-based approach to cognitive liberty and mental integrity |

### Latin American Neurorights Legislation

Latin America leads globally in constitutional and legislative neurorights protections:

| Country | Legislation | Status | Key Provisions |
|---------|-------------|--------|----------------|
| **Chile** | Constitutional Amendment (Art. 19 §1) | Enacted October 2021 | **First country in the world** to constitutionally protect neurorights; protects mental integrity and prohibits unauthorized brain data collection |
| **Chile** | Neuroprotection Law (Law 21.383) | Enacted October 2021 | Implementing legislation; classifies neural data as organ tissue (cannot be commercialized); requires informed consent for neurotechnology |
| **Brazil** | Rio Grande do Sul State Amendment | Enacted 2024 | State-level constitutional protection of neural data; first Brazilian jurisdiction to codify neurorights |
| **Brazil** | Federal Neurorights Bill | Under consideration | Federal constitutional amendment modeled on Chilean approach |
| **Mexico** | General Law on Neurotechnology (GLNN) | Under consideration | Comprehensive national neurotechnology governance framework |

### European Union

| Regulation | Scope | Status | QIF Alignment |
|------------|-------|--------|---------------|
| **EU MDR 2017/745** | Medical Device Regulation | Active | QIF certification pathway maps to MDR requirements |
| **GDPR** | Data Protection | Active | QIF data minimization, consent, and encryption align |
| **EU AI Act** | AI Systems (including BCIs) | Phased 2025-2027 | High-risk AI transparency requirements met via documentation |
| **EU Neurotechnology Legislative Package** | Dedicated neurotech regulation | Under development (2026) | Anticipated to incorporate UNESCO Recommendation principles |

### Spain

| Framework | Status | Key Provisions |
|-----------|--------|----------------|
| **Digital Rights Charter** | Adopted 2021 | Includes neurorights provisions guaranteeing mental privacy and cognitive integrity; non-binding but establishes policy direction |

### Other Jurisdictions

| Region | Key Considerations |
|--------|-------------------|
| **United Kingdom** | Post-Brexit UKCA marking, UK GDPR, active neurotechnology ethics review |
| **Canada** | Health Canada medical device licensing, active neurorights policy discussion |
| **Australia** | TGA regulation, Privacy Act 1988, emerging neurotech ethics guidelines |
| **Japan** | PMDA approval, APPI data protection, active BCI research governance |
| **China** | NMPA regulation, data localization, significant state BCI investment |
| **South Korea** | Emerging neurotechnology ethics framework, KFDA medical device oversight |

### International Standards Bodies

| Organization | Standard/Initiative | Relevance |
|--------------|---------------------|-----------|
| **ISO** | ISO 13485 (QMS), ISO 27001 (InfoSec), ISO 14971 (Risk) | Quality, security, and risk management for medical devices |
| **IEC** | IEC 62443 (Industrial cybersecurity), IEC 60601 (Medical electrical) | Cybersecurity and electrical safety for neural devices |
| **IEEE** | **P2794** (Neural Interface Research Reporting Standard) | Standardizes how neural interface research is documented and reported — directly relevant to QIF's transparency requirements |
| **IEEE** | **P2731** (Brain-Computer Interface Terminology Standard) | Establishes common vocabulary for BCI development — supports QIF's 14-layer naming conventions |
| **IEEE** | IEEE 7000 series (Ethics in Autonomous Systems) | Ethical design principles for AI and autonomous systems |
| **IMDRF** | International Medical Device Regulators Forum | Global coordination of medical device regulation |
| **Neurorights Foundation** | Advocacy and policy advisory | Founded by Rafael Yuste (Columbia); instrumental in Chile's neurorights legislation; advises multiple governments on neurotechnology governance |

---

## References

### US Regulations

1. Food and Drug Administration. (2023). *Cybersecurity in Medical Devices: Quality System Considerations and Content of Premarket Submissions*. FDA-2023-D-0100.

2. U.S. Congress. (2022). *Food and Drug Omnibus Reform Act of 2022 (FDORA)*. Division FF of the Consolidated Appropriations Act, 2023 (Pub. L. 117-328). Added Section 524B to the FD&C Act.

3. U.S. Congress. (2022). *Protecting and Transforming Cyber Health Care Act of 2022 (PATCH Act)*. Incorporated into FDORA. Mandates cybersecurity documentation in premarket device submissions.

4. U.S. Department of Health and Human Services. (2013). *HIPAA Security Rule*. 45 CFR Part 160 and Part 164.

5. Federal Communications Commission. (2023). *Title 47 Code of Federal Regulations*.

6. National Institute of Standards and Technology. (2024). *Cybersecurity Framework 2.0*. NIST CSF 2.0.

7. National Institute of Standards and Technology. (2020). *Security and Privacy Controls for Information Systems and Organizations*. NIST SP 800-53 Rev. 5.

### US State & Federal Neurotechnology Legislation

8. Colorado General Assembly. (2024). *H.B. 24-1058: Concerning Protections for Biological and Neural Data*. Signed into law August 2024.

9. California Legislature. (2024). *SB 1223: California Consumer Privacy Act — Neurorights*. Effective January 1, 2025. Amends CCPA to classify neural data as sensitive personal information.

10. Montana Legislature. (2025). *SB 163: Neural Data Privacy Act*. Effective October 2025.

11. Connecticut General Assembly. (2026). *SB 1295: An Act Concerning Neurotechnology Consumer Protection*. Effective July 2026.

12. U.S. Senate. (2025). *S. 2925: Mental-health Innovation and Neurotechnology Development (MIND) Act*. Introduced September 2025.

### International Frameworks & Legislation

13. UNESCO. (2025). *Recommendation on the Ethics of Neurotechnology*. Adopted at the 43rd session of the General Conference, November 12, 2025. https://www.unesco.org/en/ethics-neurotech/recommendation

14. UNESCO. (2021). *Ethical Issues of Neurotechnology*. International Bioethics Committee (IBC). https://unesdoc.unesco.org/ark:/48223/pf0000378724

15. OECD. (2019). *Recommendation on Responsible Innovation in Neurotechnology*. https://legalinstruments.oecd.org/api/print?ids=658&Lang=en

16. Council of Europe. (2025). *Strategic Action Plan on Neurotechnology*. Adopted January 2025.

17. Republic of Chile. (2021). *Constitutional Amendment on Neurorights* (Art. 19 §1) and *Neuroprotection Law* (Law 21.383). October 2021.

18. Spain. (2021). *Digital Rights Charter*. Includes neurorights provisions.

### Academic Sources

19. Kohno, T., & Narayanan, A. (2009). Security and Privacy of Medical Devices. *Proceedings of IEEE S&P*.

20. Bonaci, T., Calo, R., & Chizeck, H. J. (2015). App Stores for the Brain: Privacy & Security in Brain-Computer Interfaces. *IEEE Ethics*.

21. Yuste, R., et al. (2017). Four ethical priorities for neurotechnologies and AI. *Nature*, 551, 159-163.

22. Ienca, M., & Andorno, R. (2017). Towards new human rights in the age of neuroscience and neurotechnology. *Life Sciences, Society and Policy*, 13(1), 5.

23. Schroder, T., Sirbu, R., Park, S., Morley, J., Street, S., & Floridi, L. (2025). Cyber Risks to Next-Gen Brain-Computer Interfaces: Analysis and Recommendations. arXiv:2508.12571. https://arxiv.org/abs/2508.12571

### Industry Standards

24. International Medical Device Regulators Forum. (2017). *Software as a Medical Device: Possible Framework for Risk Categorization and Corresponding Considerations*.

25. Association for the Advancement of Medical Instrumentation. (2022). *AAMI TIR57: Principles for Medical Device Security—Risk Management*.

26. IEEE Standards Association. (in development). *P2794: Standard for Reporting in Neural Interface Research*. Active working group.

27. IEEE Standards Association. (in development). *P2731: Standard for Brain-Computer Interface Terminology*. Active working group.

---

## Document History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-01-25 | Initial release — US regulatory focus |
| 2.0 | 2026-02-10 | Major expansion: added enacted US state legislation (Colorado H.B. 24-1058, California SB 1223, Montana SB 163, Connecticut SB 1295), US MIND Act (S. 2925), international regulatory landscape (UNESCO 2025, Council of Europe, Latin American neurorights, Spain, EU developments), IEEE standards (P2794, P2731), and Neurorights Foundation |
| 2.1 | 2026-02-15 | Added FDORA/PATCH Act (2022) Section 524B with QIF compliance mapping, RTA enforcement policy, Schroder et al. (2025) citation |

---

## Related Documents

- [NEUROETHICS_ALIGNMENT.md](NEUROETHICS_ALIGNMENT.md) — Ethical principles mapping
- [UNESCO_ALIGNMENT.md](UNESCO_ALIGNMENT.md) — Comprehensive UNESCO Recommendation mapping
- [INFORMED_CONSENT_FRAMEWORK.md](INFORMED_CONSENT_FRAMEWORK.md) — Consent requirements
- [POST_DEPLOYMENT_ETHICS.md](POST_DEPLOYMENT_ETHICS.md) — Lifecycle obligations
- [PEDIATRIC_CONSIDERATIONS.md](PEDIATRIC_CONSIDERATIONS.md) — Minors and incapacity
- [TRANSPARENCY.md](TRANSPARENCY.md) — Human-AI collaboration audit

---

*This is a living document. As regulations evolve and international frameworks are added, this guide will be updated to reflect current requirements.*

← Back to [Governance](/governance/)
