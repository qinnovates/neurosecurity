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

## Neurogovernance: GRC for the Brain

Traditional IT security learned a painful lesson: Governance, Risk, and Compliance (GRC) was bolted on decades after systems shipped. Auditors checked boxes while attackers exploited gaps the compliance frameworks hadn't caught up to yet. That lag cost billions.

Neurogovernance applies the three GRC pillars to BCIs from the start, not as an afterthought:

| Pillar | What It Covers | Qinnovate Implementation |
|--------|---------------|-------------------------|
| **Governance** | Policies, rights, consent, ethics | [Neurorights mapping](NEUROETHICS_ALIGNMENT.md) (5 rights), [Informed Consent Framework](INFORMED_CONSENT_FRAMEWORK.md) (pediatric + incapacity), [Code of Ethics](ETHICAL-NEUROSECURITY-CODE-OF-ETHICS.md), [UNESCO alignment](UNESCO_ALIGNMENT.md) |
| **Risk** | Threat assessment, severity scoring, attack modeling | [TARA](https://qinnovate.com/TARA/) (109 techniques), [NISS](https://qinnovate.com/scoring/) (neural severity scoring), [BCI Limits Equation](../qif-framework/qif-sec-guardrails.md) (physics constraints), DSM-5-TR diagnostic mappings |
| **Compliance** | Regulatory adherence, audit trails, verification | [FDORA/FDA crosswalk](REGULATORY_COMPLIANCE.md), NIST SP 800-53 control mapping, ISO 27001 alignment, [Transparency audit trail](TRANSPARENCY.md), [citation verification pipeline](../scripts/verify/) |

The difference from IT: we are building these before the first mass-market BCI ships, not after the first breach. The governance documents, risk assessments, and compliance mappings exist alongside the security tools, not in a separate department.

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
