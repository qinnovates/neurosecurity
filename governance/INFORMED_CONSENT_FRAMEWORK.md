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
- [Pediatric & Incapacity Considerations](#pediatric--incapacity-considerations)
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
| Incapacity consent protocols | See below | Surrogate decision framework |

---

## Pediatric & Incapacity Considerations

> Ethical guidelines for neural device use in minors and individuals with limited decision-making capacity.

This section is informed by extensive research from [Gabriel Lázaro-Muñoz and colleagues](https://pmc.ncbi.nlm.nih.gov/articles/PMC10586720/) whose NIH-funded studies (R01MH121371) have examined pediatric deep brain stimulation ethics.

**Foundational Principle:**

> "From both an ethical and a clinical standpoint, it is very important not to treat minors as small adults." -- Gabriel Lázaro-Muñoz, PhD, JD

### Scope of Application

| Population | Age/Capacity | Key Considerations |
|------------|--------------|-------------------|
| **Pediatric** | Under 18 years | Developing brain, evolving autonomy, surrogate consent |
| **Adolescent** | 12-17 years | Emerging autonomy, assent capacity, identity formation |
| **Cognitive impairment** | Any age | Variable capacity, supported decision-making |
| **Temporary incapacity** | Any age | Emergency protocols, advance directives |

### Key Ethical Concerns

#### Clinician-Identified Concerns (Lázaro-Muñoz et al., 2023)

Research with 29 clinicians caring for pediatric patients identified four pressing concerns:

| Concern | Frequency | Description |
|---------|-----------|-------------|
| **Uncertainty about risks/benefits** | 72% | Challenge to informed decision-making |
| **Decision-making roles** | 52% | How to integrate stakeholder perspectives |
| **Information scarcity** | 52% | Limited data affects consent quality |
| **Regulatory status/access** | 24% | Lack of FDA-approved indications |

#### Adolescent-Specific Concerns

| Issue | Clinician Concern Rate | QIF Implication |
|-------|----------------------|-----------------|
| **Adolescent assent capacity** | 80% | Age-appropriate assent protocols required |
| **Identity formation effects** | High | Device effects on developing sense of self |
| **Long-term unknown effects** | High | Developing brain plasticity considerations |

### Consent and Assent Framework

#### Tri-Level Authorization Model

```
Level 1: PARENTAL/GUARDIAN CONSENT
  - Full informed consent from legal guardian
  - Understanding of child-specific risks
  - Long-term commitment acknowledgment

Level 2: MINOR'S ASSENT (age-appropriate)
  - Developmentally appropriate explanation
  - Opportunity to ask questions
  - Voluntary agreement (or documented dissent)
  - Understanding that disagreement is respected

Level 3: CLINICIAN CERTIFICATION
  - Medical necessity determination
  - Developmental impact assessment
  - Alternative treatment consideration
```

#### Age-Appropriate Assent

| Age Range | Assent Approach | Documentation |
|-----------|-----------------|---------------|
| **0-6 years** | No formal assent; minimize distress | Parental consent only |
| **7-11 years** | Simple explanation; verbal assent | Documented discussion |
| **12-14 years** | Detailed explanation; written assent | Formal assent form |
| **15-17 years** | Near-adult discussion; strong assent weight | Assent + transition plan |

#### Dissent Handling

If a minor expresses dissent:

1. **Document the dissent** -- Record the child's concerns
2. **Explore reasons** -- Understand the basis for refusal
3. **Weigh seriously** -- Dissent should influence decision
4. **Override only with justification** -- Clear documentation if proceeding
5. **Re-evaluate periodically** -- Assent status should be reassessed

### Developmental Considerations

#### The Developing Brain

| Factor | Consideration | QIF Implication |
|--------|---------------|-----------------|
| **Brain plasticity** | Higher adaptability, unknown long-term effects | Conservative thresholds |
| **Developmental milestones** | Device may affect normal development | Milestone monitoring |
| **Identity formation** | Adolescent identity still developing | Enhanced L14 protections |
| **Changing capacity** | Autonomy increases over time | Transition planning |

#### Transition to Adult Care

```
Age 14-15: Transition planning begins
  - Educate minor about device and condition
  - Introduce independent decision-making concept
  - Begin documenting minor's preferences

Age 16-17: Increasing autonomy
  - Minor takes lead in clinical discussions
  - Practice independent consent decisions
  - Identify adult care providers

Age 18+: Full autonomy transfer
  - Independent consent (new consent process)
  - Access to all records and history
  - Full control over device parameters
```

### Incapacity Considerations

#### Variable Capacity

| Capacity Level | Decision Authority | Safeguards |
|----------------|-------------------|------------|
| **Full capacity** | Individual consent | Standard framework |
| **Fluctuating** | Supported decision-making | Lucid interval documentation |
| **Partial** | Co-decision with support | Maximize participation |
| **No capacity** | Surrogate decision-maker | Best interest standard |

#### Advance Directives for Neural Devices

```markdown
## Neural Device Advance Directive

**Prepared by:** [Name]
**Date:** [Date]

### If I lose decision-making capacity:

**Designated decision-maker:** [Name, relationship]

### My preferences:

**Continue device operation:** [ ] Yes [ ] No [ ] Defer
**Device modifications:** [ ] Permitted [ ] Not permitted
**Device removal if no benefit:** [ ] Yes [ ] No [ ] Defer

### Values to guide decisions:

[Free text describing what matters most]
```

### Special Protections

#### Identity Protection in Developing Brains

| Protection | Implementation | Rationale |
|------------|----------------|-----------|
| **Psychological continuity monitoring** | Regular assessments | L14 protection for developing self |
| **Personality change detection** | Baseline + periodic evaluation | 30% researcher concern rate |
| **Reversibility preference** | Favor reversible interventions | Preserve developmental options |

#### Enhanced Oversight

1. **Ethics committee review** -- Required for initial deployment
2. **Periodic re-review** -- Annual or with significant changes
3. **Adverse event escalation** -- Faster reporting timelines
4. **Third-party monitoring** -- Independent developmental assessment

### Proposed Consent State Extension

```python
class PediatricConsentState(Enum):
    NO_CONSENT = 0
    GUARDIAN_ONLY = 1          # Young child
    GUARDIAN_PLUS_ASSENT = 2   # Minor with assent
    TRANSITIONAL = 3           # 16-17, increasing autonomy
    ADULT_FULL = 4             # 18+, full consent
    SURROGATE = 5              # Adult with incapacity
    SUPPORTED = 6              # Supported decision-making
```

---

## References

Lázaro-Muñoz, G., Pham, M. T., Muñoz, K. A., et al. (2020). Researcher Perspectives on Ethical Considerations in Adaptive Deep Brain Stimulation Trials. *Frontiers in Human Neuroscience*, 14, 578695. https://doi.org/10.3389/fnhum.2020.578695

Lázaro-Muñoz, G., Pham, M. T., Muñoz, K. A., et al. (2022). Researchers' Ethical Concerns About Using Adaptive Deep Brain Stimulation for Enhancement. *Frontiers in Human Neuroscience*, 16, 813922. https://doi.org/10.3389/fnhum.2022.813922

Zuk, P., Torgerson, L., & Sierra-Mercado, D. (2019). Neuroethics of neuromodulation: An update. *Current Opinion in Biomedical Engineering*, 8, 45-50.

Lázaro-Muñoz, G., et al. (2023). Deep Brain Stimulation for Pediatric Dystonia: Clinicians' Perspectives on the Most Pressing Ethical Challenges. *Stereotactic and Functional Neurosurgery*. https://doi.org/10.1159/000530694

Muñoz, K. A., Blumenthal-Barby, J., Storch, E. A., Torgerson, L., & Lázaro-Muñoz, G. (2020). Pediatric Deep Brain Stimulation for Dystonia: Current State and Ethical Considerations. *Cambridge Quarterly of Healthcare Ethics*, 29(4), 557-573.

Muñoz, K. A., & Lázaro-Muñoz, G. (2021). Pressing ethical issues in considering pediatric deep brain stimulation for obsessive-compulsive disorder. *Brain Stimulation*, 14(6), 1568-1576.

---

← Back to [NEUROETHICS_ALIGNMENT.md](NEUROETHICS_ALIGNMENT.md) | [Governance](/governance/)
