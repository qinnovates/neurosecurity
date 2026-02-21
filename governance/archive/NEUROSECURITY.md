---
title: "Why Neurosecurity?"
description: "The gap between neuroethics, neuroscience, and cybersecurity, and why a new discipline is needed"
order: 11
---

# Why Neurosecurity?

> Neuroethics writes the policies. Neuroscience explains the biology. Cybersecurity builds the defenses. Neurosecurity is the bridge.

---

## The Gap

Three fields converge on brain-computer interfaces, but none of them covers the full problem:

**Neuroethics** defines what should and shouldn't be done with BCIs. What constitutes consent. What rights people have over their neural data. It writes the rules. The three techniques in TARA tagged as "neuroethics_formalized" (identity erosion, agency manipulation, self-model corruption) came from neuroethics researchers (Yuste et al. 2017, Ienca & Andorno 2017, Goering et al. 2021) because they were the first to articulate these as harms.

**Neuroscience** provides the mechanism understanding. How neural signals actually work, what's physically possible, what the attack surface looks like. The 46 "qif_recontextualized" techniques in TARA came from neuroscience, physics, and sensor research. You cannot build a defense if you do not understand the biology.

**Cybersecurity** operationalizes it. Threat models, detection systems, scoring frameworks, incident response. The 49 techniques tagged as "literature" in TARA came from published BCI security research that already named these attacks.

The gap: neither neuroethics nor neuroscience has the operational security toolkit to actually detect, prevent, and respond to BCI threats. Neuroethics can say "mental privacy matters" but cannot tell you how to detect a P300 interrogation attack in real time. Neuroscience can explain how temporal interference reaches deep brain structures but does not score the severity or map the attack chain.

---

## The Lesson from IT Security

Information security learned this the hard way. Governance, Risk, and Compliance (GRC) was **retrofitted** onto existing security infrastructure decades after the internet shipped. The result: compliance frameworks that lag years behind threats, checkbox security that satisfies auditors but not attackers, and a permanent gap between policy and enforcement.

We do not need to repeat that for the brain.

BCI technology is still early. The window to build security into the foundation, not bolt it on later, is open now. That means neurosecurity needs to be designed alongside the neuroscience and neuroethics, not added after the first breach.

---

## What Neurosecurity Does

Neurosecurity takes phenomena described by neuroscientists and concerns raised by neuroethicists and puts them into a formal, testable, scoreable security framework.

### From Neuroethics: Policies Become Enforceable

| Neuroethics Says | Neurosecurity Implements |
|-----------------|------------------------|
| "People have a right to mental privacy" | NSP encrypts all neural data in transit with post-quantum cryptography |
| "Cognitive liberty must be protected" | QIF coherence metric detects injected signals; Neurowall blocks unauthorized stimulation |
| "Neural data is sensitive" | TARA catalogues 103 exfiltration vectors; NISS scores their severity |
| "Consent must be informed" | Informed consent framework with pediatric and incapacity protocols, regulatory crosswalk |

### From Neuroscience: Mechanisms Become Threat Models

| Neuroscience Knows | Neurosecurity Maps |
|-------------------|-------------------|
| Temporal interference can target deep brain structures (Grossman et al. 2017) | QIF-T0013: Deep targeting attack, NISS score 7.2, detected by spectral peak analysis |
| EEG signals can be decoded for P300 responses (Martinovic et al. 2012) | QIF-T0035: P300 interrogation, NISS score 5.6, countermeasure: response obfuscation |
| Consumer earbuds can capture in-ear EEG (Kaveh et al. 2020) | QIF-T0073 through T0074: Consumer sensor escalation chain to cognitive profiling |
| Bifurcation dynamics govern neural state transitions (Izhikevich 2007) | QIF-T0068: Bifurcation forcing attack, detected by CUSUM change-point analysis |

### From Cybersecurity: TTPs for the Brain

| Cybersecurity Provides | Applied to BCIs As |
|----------------------|-------------------|
| MITRE ATT&CK taxonomy | TARA: 109 techniques across 15 tactics, MITRE-compatible IDs |
| CVSS scoring | NISS: 5 neural-specific metrics that CVSS cannot express (biological impact, cognitive integrity, consent violation, reversibility, neuroplasticity) |
| Zero-trust architecture | QIF: every signal validated at every band crossing; no implicit trust |
| Threat detection and response | Neurowall: real-time coherence monitoring, spectral anomaly detection, CUSUM change-point analysis |

---

## How Security GRC Actually Works

In IT security, Governance, Risk, and Compliance (GRC) follows a well-established cycle. Understanding this cycle is essential because neurosecurity needs to build the same discipline, not reinvent it.

### The GRC Flow (IT Security)

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

### The Neurosecurity GRC Gap

For BCIs, this cycle is broken at step 1. The external forces barely exist:

| GRC Step | IT Security (Mature) | BCI Security (Today) | Delta |
|----------|---------------------|---------------------|-------|
| **1. External Requirements** | HIPAA, PCI-DSS, SOX, GDPR, FedRAMP, CMMC | FDA 510(k) covers safety but not neural-specific cybersecurity. FDORA Section 3305 (Patch Act) is the closest. No "HIPAA for neural data." No "PCI-DSS for BCIs." | **Critical gap**: no neural-specific regulations to comply with |
| **2. GRC Policy Translation** | Established frameworks (NIST CSF, ISO 27001, CIS Controls) map to organizational controls | No neural-specific framework existed before QIF. NIST/ISO controls are generic, not neural-aware. | **Structural gap**: existing frameworks lack neural metrics (tissue damage, cognitive integrity, consent violation) |
| **3. Security Implementation** | Firewalls, IDS/IPS, SIEM, encryption, IAM | No commercial BCI security tools. No neural firewalls. No BCI-specific encryption protocols. | **Tooling gap**: everything must be built from scratch |
| **4. Compliance Auditing** | SOC 2 auditors, PCI QSAs, HIPAA assessors, automated scanning | No BCI security auditors exist. No compliance certifications. No audit criteria. | **Ecosystem gap**: no one to audit, nothing to audit against |

### What Exists Today (and Where Qinnovate Maps)

The approach is not to build neurosecurity GRC from nothing. Existing frameworks cover significant ground. The work is finding what maps, what partially maps, and what is missing entirely.

| Existing Framework | What It Covers for BCIs | What It Misses |
|-------------------|------------------------|----------------|
| **NIST SP 800-53** | Access control (AC), system monitoring (SI-4), encryption (SC-28), logging (AU) | No controls for neural signal integrity, cognitive impact assessment, or consent violation severity |
| **ISO 27001** | Information security management, risk assessment methodology, audit trails | No asset classification for neural data, no control objectives for biological impact |
| **FDA 21 CFR 820** | Quality system regulation for medical devices, design controls | No cybersecurity threat modeling requirement, no neural-specific validation |
| **FDORA Sec. 3305** | Cyber device patching, vulnerability management, SBOM | Closest existing requirement. Still lacks neural-specific threat categories |
| **HIPAA** | PHI protection, breach notification, access controls | Neural data is PHI but HIPAA has no provisions for real-time neural monitoring or cognitive state inference |
| **IEC 62443** | Industrial control system security (OT security) | Closest architectural parallel to BCI security. Lacks biological endpoint considerations |
| **GDPR Art. 9** | Special category data (biometric, health) | Neural data arguably qualifies but no explicit mention. No provisions for thought data vs. signal data |

### Qinnovate's GRC Convergence

Rather than inventing everything new, Qinnovate maps existing frameworks to neurosecurity and fills the gaps:

| GRC Step | Existing Foundation | Qinnovate Extension |
|----------|-------------------|---------------------|
| **1. Requirements** | FDA, FDORA, HIPAA, GDPR Art. 9 | [Regulatory Compliance Guide](REGULATORY_COMPLIANCE.md) maps all existing requirements. Identifies 5 structural gaps where no regulation exists. |
| **2. Policy** | NIST SP 800-53, ISO 27001 | [NIST/ISO Hardened Mapping](REGULATORY_COMPLIANCE.md#nistiso-hardened-goals) anchors NISS scores to NIST/ISO control IDs. [Neurorights mapping](NEUROETHICS_ALIGNMENT.md) adds the policy layer that no existing framework covers. |
| **3. Implementation** | IEC 62443 (OT security patterns) | [QIF](https://qinnovate.com/whitepaper/) (security architecture), [NSP](https://qinnovate.com/nsp/) (wire protocol), [Neurowall](../tools/neurowall/) (detection), [TARA](https://qinnovate.com/TARA/) (threat registry), [NISS](https://qinnovate.com/scoring/) (scoring) |
| **4. Audit** | SOC 2 methodology, ISO 27001 certification process | [Transparency audit trail](TRANSPARENCY.md), [citation verification](../scripts/verify/), Regulatory-as-Code (planned: machine-verifiable compliance) |

The long-term vision is a neurosecurity-specific professional code of ethics adapted from ISC2 and CEH models. But that comes after the compliance foundation is solid. You do not write a code of ethics for a profession that does not yet have compliance standards to enforce.

---

## The Origin Classification

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

## Marr's Three Levels

David Marr (1982) argued that understanding any information processing system requires three levels:

1. **Computational** (what problem is being solved?) -- neuroethics
2. **Algorithmic** (what process solves it?) -- neuroscience
3. **Implementational** (what physical system runs it?) -- cybersecurity

Neurosecurity is the discipline that connects all three. You need DSM-5-TR diagnostic mappings, TTPs, BCI limits equations, physics constraints, and neuroscience before you can start the actual security work. That is why QIF integrates all of them.

---

## References

- Ienca, M. & Andorno, R. (2017). Towards new human rights in the age of neuroscience and neurotechnology. *Life Sciences, Society and Policy*, 13(1), 5.
- Yuste, R., et al. (2017). Four ethical priorities for neurotechnologies and AI. *Nature*, 551(7679), 159-163.
- Goering, S., et al. (2021). Recommendations for responsible development and application of neurotechnologies. *Neuroethics*, 14, 365-386.
- Marr, D. (1982). *Vision: A Computational Investigation into the Human Representation and Processing of Visual Information*. W.H. Freeman.
- Martinovic, I., et al. (2012). On the feasibility of side-channel attacks with brain-computer interfaces. *USENIX Security Symposium*.
- Grossman, N., et al. (2017). Noninvasive deep brain stimulation via temporally interfering electric fields. *Cell*, 169(6), 1029-1041.
- Izhikevich, E.M. (2007). *Dynamical Systems in Neuroscience: The Geometry of Excitability and Bursting*. MIT Press.
- Kaveh, A., et al. (2020). In-ear EEG: robust, unobtrusive, automatic. *IEEE Transactions on Biomedical Engineering*.

---

*This document is part of the [Qinnovate governance suite](../governance/). See also: [Neurorights Map](../README.md#neurorights-map) | [TARA Atlas](https://qinnovate.com/TARA/) | [Transparency Statement](TRANSPARENCY.md)*
