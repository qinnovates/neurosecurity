---
title: "Informed Consent Framework"
description: "Guidelines for ethical consent in brain-computer interface deployment"
order: 3
---

# QIF Framework: Informed Consent Framework for Neural Devices

> Guidelines for ethical consent in brain-computer interface deployment, informed by neuroethics research.

**Last Updated:** 2026-02-10
**Version:** 1.0
**Status:** Active Development

---

## Table of Contents

- [Overview](#overview)
- [Core Consent Requirements](#core-consent-requirements)
  - [Pre-Deployment Consent](#1-pre-deployment-consent)
  - [Continuous Consent Model](#2-continuous-consent-model)
  - [Understanding Requirements](#3-understanding-requirements)
- [Consent Validation in QIF Framework](#consent-validation-in-oni-framework)
  - [Integration with Neural Firewall (L8)](#integration-with-neural-firewall-l8)
  - [Consent as Authentication Requirement](#consent-as-authentication-requirement)
  - [Consent Revocation Rights](#consent-revocation-rights)
- [Stakeholder Perspectives](#stakeholder-perspectives)
- [Special Consent Considerations](#special-consent-considerations)
  - [Automaticity and Control](#automaticity-and-control)
  - [Enhancement vs. Treatment](#enhancement-vs-treatment)
- [Consent Documentation Requirements](#consent-documentation-requirements)
- [Integration with QIF Modules](#integration-with-oni-modules)
- [Gaps and Future Work](#gaps-and-future-work)
- [References](#references)

---

## Overview

This document establishes informed consent requirements for QIF-compliant neural devices. It draws on empirical neuroethics research, particularly the work of [Gabriel Lázaro-Muñoz and colleagues](https://bioethics.hms.harvard.edu/faculty-staff/gabriel-lazaro-munoz) at Harvard Medical School and Massachusetts General Hospital, who have conducted extensive research on consent challenges in adaptive deep brain stimulation (aDBS) and brain-computer interfaces.

**Key Finding:** In interviews with aDBS researchers, 74% identified informed consent as a pressing ethical challenge (Lázaro-Muñoz et al., 2020).

---

## Core Consent Requirements

### 1. Pre-Deployment Consent

Before any QIF-compliant neural device can be activated, the following must be documented:

| Requirement | Description | QIF Component |
|-------------|-------------|---------------|
| **Purpose Disclosure** | Clear explanation of what the device will do | L13 Semantic Layer documentation |
| **Data Collection Scope** | What neural data will be recorded, stored, processed | Privacy Score (Pₛ) categories |
| **Automaticity Disclosure** | Whether the device makes autonomous decisions | Firewall decision states |
| **Override Capability** | How the user can disable or override the device | User Override Interface |
| **Post-Trial Uncertainty** | Limitations on support after study/warranty ends | Post-Deployment obligations |

### 2. Continuous Consent Model

Unlike traditional one-time consent, neural devices require **ongoing consent verification**:

```
┌─────────────────────────────────────────────────────────────┐
│                    CONTINUOUS CONSENT MODEL                  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Initial Consent ──► Active Monitoring ──► Re-consent      │
│       │                    │                   │            │
│       ▼                    ▼                   ▼            │
│  Device activation    Threshold changes   Major updates    │
│  Data collection      New biomarkers      Firmware changes │
│  Processing scope     Autonomy changes    Purpose changes  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Rationale:** Adaptive systems that modify their behavior based on neural data represent a fundamentally different consent paradigm. As Lázaro-Muñoz et al. (2020) note, the closed-loop nature of aDBS means the device may change its intervention patterns in ways not anticipated at initial consent.

### 3. Understanding Requirements

Researchers have identified specific comprehension challenges:

| Challenge | Mitigation Strategy | QIF Implementation |
|-----------|---------------------|-------------------|
| **Therapeutic misconception** | Explicit disclosure that device is experimental | Consent validation check |
| **Complexity of automaticity** | Pre/post-operative counseling on adaptive behavior | Educational materials requirement |
| **Data sensitivity evolution** | Explanation that neural data value may increase over time | Future-proofing consent |
| **Post-trial limitations** | Upfront disclosure of support boundaries | POST_DEPLOYMENT_ETHICS.md |

---

## Consent Validation in QIF Framework

### Integration with Neural Firewall (L8)

The QIF Neural Firewall must verify consent state before processing signals:

```python
class ConsentState(Enum):
    NOT_OBTAINED = 0      # Device cannot activate
    INITIAL_ONLY = 1      # Basic operations permitted
    FULL_CONSENT = 2      # All authorized operations
    REVOKED = 3           # Device must cease operations
    EXPIRED = 4           # Re-consent required

# Firewall decision matrix with consent
if consent_state == ConsentState.REVOKED:
    return FirewallDecision.REJECT  # Absolute override
elif consent_state == ConsentState.EXPIRED:
    return FirewallDecision.ACCEPT_FLAG  # Require human review
```

### Consent as Authentication Requirement

Per the existing NEUROETHICS_ALIGNMENT.md principle:

> "Authentication required even for high-coherence signals — Consent is non-negotiable; quality doesn't imply permission."

This means:
- High Coherence + Valid Auth + **No Consent** = REJECT
- High Coherence + Valid Auth + **Valid Consent** = ACCEPT

### Consent Revocation Rights

Users must retain the ability to revoke consent at any time. The QIF Framework implements this as:

| Revocation Type | Effect | Restoration |
|-----------------|--------|-------------|
| **Temporary pause** | Device enters safe mode | User-initiated resume |
| **Scope reduction** | Specific functions disabled | Re-consent for functions |
| **Full revocation** | Device ceases all operations | Full re-consent process |

---

## Stakeholder Perspectives

Research by Lázaro-Muñoz et al. emphasizes **relational autonomy** — recognizing that consent decisions often involve multiple stakeholders:

| Stakeholder | Role in Consent | Considerations |
|-------------|-----------------|----------------|
| **Patient/User** | Primary decision-maker | Capacity assessment, understanding verification |
| **Caregiver** | Support and assistance | Trusted person designation, emergency override |
| **Clinician** | Medical guidance | Risk-benefit counseling, candidacy assessment |
| **Engineer/Developer** | Technical explanation | Device capabilities and limitations |

### Multi-Stakeholder Engagement

> "Engage stakeholders early regarding intervention preferences" — Lázaro-Muñoz et al. (2020)

QIF-compliant devices should:
1. Identify authorized stakeholders during initial consent
2. Define escalation paths for borderline decisions (ACCEPT_FLAG states)
3. Document preferences for device control distribution
4. Allow designation of trusted contacts for incapacity scenarios

---

## Special Consent Considerations

### Automaticity and Control

Adaptive neural devices raise unique autonomy concerns:

| Concern | Percentage of Researchers | QIF Response |
|---------|--------------------------|--------------|
| Autonomy and device control | 57% | User Override Interface requirement |
| Automatic stimulation effects | 83% | Amplitude bounds, rate limiting |
| Biomarker validity | 65% | Coherence validation at L8 |

**Design Principle:** The device should never make irreversible decisions without human oversight opportunity (ACCEPT_FLAG pathway).

### Enhancement vs. Treatment

Per Lázaro-Muñoz et al. (2022) research on enhancement:

> "100% of researchers felt aDBS should remain restricted to treatment until researchers achieve better understanding of normal brain circuitry."

QIF Framework position:
- Current framework optimized for **therapeutic applications**
- Enhancement use cases require **additional ethical review**
- Dual-use concerns (military, performance) require explicit consent scope

---

## Consent Documentation Requirements

### Minimum Information Set

Every consent record must include:

```markdown
## Consent Record

**Device ID:** [unique identifier]
**User ID:** [pseudonymous identifier]
**Consent Date:** [ISO 8601 timestamp]
**Consent Version:** [version of consent form]

### Scope Authorized
- [ ] Signal reading (input)
- [ ] Signal modification (output)
- [ ] Data storage (local)
- [ ] Data transmission (external)
- [ ] Adaptive behavior (autonomous adjustments)

### Duration
- [ ] Study period only
- [ ] Until explicitly revoked
- [ ] Time-limited: [end date]

### Stakeholders Authorized
- Primary user: [identifier]
- Caregiver access: [yes/no, identifier if yes]
- Clinician access: [yes/no, identifier if yes]
- Emergency override: [protocol]

### Acknowledgments
- [ ] Therapeutic misconception addressed
- [ ] Post-trial limitations disclosed
- [ ] Data sensitivity evolution explained
- [ ] Revocation rights confirmed
```

---

## Integration with QIF Modules

| QIF Module | Consent Integration |
|------------|---------------------|
| `oni.firewall` | Consent state check before ACCEPT |
| `oni.neurosecurity.anonymizer` | Consent scope defines allowlist |
| `oni.neurosecurity.privacy_score` | Consent determines acceptable Pₛ thresholds |
| `tara.nsam` | Consent violations trigger alerts |

---

## Gaps and Future Work

| Gap | Status | Notes |
|-----|--------|-------|
| Real-time consent verification protocol | Conceptual | Need low-latency consent checks |
| Consent interoperability standard | Planned | Cross-device consent portability |
| Machine-readable consent format | Planned | Integration with consent management systems |
| Incapacity consent protocols | See PEDIATRIC_CONSIDERATIONS.md | Surrogate decision framework |

---

## References

Lázaro-Muñoz, G., Pham, M. T., Muñoz, K. A., et al. (2020). Researcher Perspectives on Ethical Considerations in Adaptive Deep Brain Stimulation Trials. *Frontiers in Human Neuroscience*, 14, 578695. https://doi.org/10.3389/fnhum.2020.578695

Lázaro-Muñoz, G., Pham, M. T., Muñoz, K. A., et al. (2022). Researchers' Ethical Concerns About Using Adaptive Deep Brain Stimulation for Enhancement. *Frontiers in Human Neuroscience*, 16, 813922. https://doi.org/10.3389/fnhum.2022.813922

Zuk, P., Torgerson, L., & Sierra-Mercado, D. (2019). Neuroethics of neuromodulation: An update. *Current Opinion in Biomedical Engineering*, 8, 45-50.

---

← Back to [NEUROETHICS_ALIGNMENT.md](NEUROETHICS_ALIGNMENT.md) | [Governance](/governance/)
