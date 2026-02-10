# QIF Framework: Post-Deployment Ethics

> Ethical obligations for neural device lifecycle management, maintenance, and end-of-life considerations.

**Last Updated:** 2026-02-10
**Version:** 1.0
**Status:** Active Development

---

## Table of Contents

- [Overview](#overview)
- [The Post-Deployment Gap](#the-post-deployment-gap)
  - [Current Reality](#current-reality)
  - [Ethical Problem Statement](#ethical-problem-statement)
- [QIF Framework Obligations](#qif-framework-obligations)
  - [Lifecycle Planning Requirement](#1-lifecycle-planning-requirement)
  - [Maintenance Obligation Categories](#2-maintenance-obligation-categories)
  - [Abandonment Prevention](#3-abandonment-prevention)
- [Transition Planning](#transition-planning)
  - [Pre-Deployment Disclosure Requirements](#pre-deployment-disclosure-requirements)
  - [Transition Decision Framework](#transition-decision-framework)
  - [Ethical Decision Criteria](#ethical-decision-criteria)
- [Cost and Access Barriers](#cost-and-access-barriers)
- [Device Removal Ethics](#device-removal-ethics)
- [Stakeholder Responsibilities](#stakeholder-responsibilities)
- [Integration with QIF Modules](#integration-with-oni-modules)
- [Future Work](#future-work)
- [References](#references)

---

## Overview

This document addresses the ethical obligations that extend beyond initial device deployment. It is informed by groundbreaking research from [Gabriel Lázaro-Muñoz et al.](https://pubmed.ncbi.nlm.nih.gov/35926784/) at Harvard Medical School and Massachusetts General Hospital, whose 2022 *Brain Stimulation* paper represents the first in-depth examination of post-trial access challenges for implanted neural devices.

**Critical Finding:** Post-trial access to beneficial implantable neural devices is generally not ensured, and lack of post-trial access is ethically problematic when participants do not have alternatives.

---

## The Post-Deployment Gap

### Current Reality

| Issue | Finding | Source |
|-------|---------|--------|
| **No safety net** | "None of them have a safety net in place where they can ensure access" | Lázaro-Muñoz, 2022 |
| **High maintenance costs** | $10,000+ per year for device maintenance, battery replacement, technical support | Industry analysis |
| **No uniform requirements** | In the US, no legal requirements for post-trial services | Regulatory review |
| **Manufacturer obligations** | "Nothing ensures device manufacturers have to provide parts or cover maintenance" | Lázaro-Muñoz, 2022 |

### Ethical Problem Statement

When a person receives an experimental neural implant that provides significant benefit, and then that device is removed or unsupported after a trial ends, the result can be:

1. **Regression to pre-treatment state** — Loss of therapeutic benefit
2. **Psychological harm** — Having experienced improvement, returning to baseline
3. **Physical risks** — Abandoned hardware in the body
4. **Financial burden** — Costs shifted entirely to patient

> "Like taking away a part of myself" — Participant description of post-trial device loss

---

## QIF Framework Obligations

### 1. Lifecycle Planning Requirement

QIF-compliant deployments must include documented lifecycle plans:

```
┌─────────────────────────────────────────────────────────────┐
│                  DEVICE LIFECYCLE STAGES                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Pre-deployment ──► Active Use ──► Transition ──► End-of-Life│
│       │                │              │              │       │
│       ▼                ▼              ▼              ▼       │
│  Consent includes   Maintenance    Alternative     Removal   │
│  post-trial plan    obligations    planning       support    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 2. Maintenance Obligation Categories

| Category | Minimum Standard | QIF Requirement |
|----------|------------------|-----------------|
| **Hardware maintenance** | Battery replacement, component repair | Documented service pathway |
| **Software updates** | Security patches, bug fixes | Update delivery mechanism |
| **Clinical support** | Ongoing medical monitoring | Referral network documented |
| **Technical support** | Device troubleshooting | Support channel specification |

### 3. Abandonment Prevention

**Device abandonment** occurs when a neural implant remains in a patient's body without proper support or a clear plan for management.

| Abandonment Type | Prevention Strategy | QIF Implementation |
|------------------|---------------------|-------------------|
| **Manufacturer abandonment** | Contractual maintenance obligations | Deployment prerequisites |
| **Clinical abandonment** | Care transition protocols | Documented handoff procedures |
| **Financial abandonment** | Funding pathway identification | Cost disclosure at consent |
| **Technical abandonment** | Open specifications | Interoperability standards |

---

## Transition Planning

### Pre-Deployment Disclosure Requirements

Before device activation, the following must be disclosed per INFORMED_CONSENT_FRAMEWORK.md:

1. **Expected device lifespan** — How long will hardware function?
2. **Maintenance schedule** — What ongoing services are needed?
3. **Cost projections** — Who pays for what, and for how long?
4. **End-of-study plans** — What happens when research concludes?
5. **Alternative pathways** — What options exist if this device is unavailable?

### Transition Decision Framework

When device status must change (end of trial, device failure, manufacturer exit):

```python
class TransitionDecision(Enum):
    CONTINUE_SUPPORT = 1      # Maintain current device with new provider
    UPGRADE_PATHWAY = 2       # Transition to commercial/approved version
    ALTERNATIVE_THERAPY = 3   # Switch to different intervention
    SAFE_REMOVAL = 4          # Explant with proper medical support
    MANAGED_DECLINE = 5       # Device winds down with clinical oversight
```

### Ethical Decision Criteria

| Criterion | Weight | Considerations |
|-----------|--------|----------------|
| **User preference** | Highest | Autonomous choice respected |
| **Clinical benefit** | High | Continued therapeutic value |
| **Safety risk** | High | Risks of continued use vs. removal |
| **Resource availability** | Moderate | Feasibility of options |
| **Precedent setting** | Moderate | Implications for future patients |

---

## Cost and Access Barriers

### Known Barriers (Lázaro-Muñoz, 2022)

| Barrier | Impact | Mitigation Strategy |
|---------|--------|---------------------|
| **Insurance gaps** | Coverage ends with trial | Pre-deployment insurance pathway |
| **Proprietary parts** | Only manufacturer can service | Open specification requirements |
| **Specialist access** | Few clinicians trained | Training and referral networks |
| **Geographic barriers** | Rural/international patients | Telemedicine and distributed care |

### Funding Recommendations

Based on researcher interviews (Lázaro-Muñoz et al., 2020):

1. **Provide rechargeable conventional batteries** at study conclusion
2. **Secure supplementary funding mechanisms** before trial starts
3. **Involve device manufacturers** in coverage solutions
4. **Establish institutional contingency funds** for device maintenance

---

## Device Removal Ethics

### When Removal is Indicated

| Scenario | Ethical Considerations | Required Process |
|----------|----------------------|------------------|
| **User request** | Autonomy respected | Counseling, informed consent for removal |
| **Device malfunction** | Beneficence (prevent harm) | Clinical assessment, alternatives considered |
| **Trial conclusion** | Justice (equitable treatment) | Transition plan execution |
| **Safety concern** | Non-maleficence | Immediate clinical review |

### Removal Decision Support

> "The device must never hold the user hostage."

Principles for removal decisions:

1. **No coercion** — Users should never feel trapped by device dependency
2. **Full information** — Clear explanation of post-removal state
3. **Reversibility consideration** — Can the device be reimplanted if desired?
4. **Psychological support** — Address identity and adjustment concerns

---

## Stakeholder Responsibilities

### Responsibility Matrix

| Stakeholder | Pre-Deployment | Active Use | Transition | End-of-Life |
|-------------|----------------|------------|------------|-------------|
| **Manufacturer** | Lifecycle cost disclosure | Maintenance provision | Transition support | Part availability |
| **Researcher/Clinic** | Protocol clarity | Clinical oversight | Care handoff | Referral pathway |
| **Funder** | Sustainability plan | Coverage continuation | Transition funding | Removal coverage |
| **Patient/User** | Informed decision | Adherence, reporting | Preference expression | Final choice |
| **Regulator** | Guidelines development | Compliance monitoring | Transition oversight | Outcome tracking |

---

## Integration with QIF Modules

### Lifecycle Monitoring

| QIF Component | Post-Deployment Role |
|---------------|---------------------|
| `tara.nsam` | Device health monitoring, anomaly detection |
| `oni.firewall` | Continued security validation |
| Consent records | Transition authorization tracking |
| TRANSPARENCY.md | Documentation of lifecycle decisions |

### Graceful Degradation

QIF-compliant devices should support **graceful degradation**:

```
Full Function ──► Limited Function ──► Safe Mode ──► Standby ──► Removal
     │                  │                 │            │           │
     ▼                  ▼                 ▼            ▼           ▼
 All features      Core only        Monitoring    Recording    Inert
 active            active           only          only
```

---

## Future Work

### L11-L14 Standards Development

The QIF Framework's upper layers (L11-L14: Cognitive Transport, Cognitive Session, Semantic Layer, Identity Layer) currently reference "Emerging neuroethics frameworks" for standards alignment. Unlike the lower layers:

| Layer Range | Current Standards | Status |
|-------------|-------------------|--------|
| L1-L7 | IEEE, IETF | Mature |
| L8-L10 | IEC 62443, FDA guidance | Established |
| **L11-L14** | **Emerging neuroethics frameworks** | **Not yet mature** |

**Gap:** No established international standards exist for cognitive and identity-layer security in neural interfaces.

**Required Collaboration:**

| Stakeholder Type | Examples | Role |
|-----------------|----------|------|
| **Subject Matter Experts** | Neuroethicists, cognitive scientists, BCI researchers | Define requirements and validate approaches |
| **Governing Agencies** | FDA, EU MDR, IEEE, UNESCO, OECD | Develop regulatory frameworks and standards |

**Actions (When Standards Emerge):**
1. Monitor emerging neuroethics frameworks from UNESCO, OECD, IEEE
2. Engage with standards bodies as L11-L14 guidelines develop
3. Contribute QIF framework principles to standards development efforts
4. Map QIF L11-L14 definitions to emerging standards as they mature

**Tracking:** See `prd.json` future work item `future-l11-l14-standards-development`

---

## References

Lázaro-Muñoz, G., Pham, M. T., Muñoz, K. A., et al. (2022). Post-trial access in implanted neural device research: Device maintenance, abandonment, and cost. *Brain Stimulation*, 15(5), 1029-1036. https://doi.org/10.1016/j.brs.2022.07.051

Lázaro-Muñoz, G., et al. (2020). Researcher Perspectives on Ethical Considerations in Adaptive Deep Brain Stimulation Trials. *Frontiers in Human Neuroscience*, 14, 578695.

---

← Back to [INFORMED_CONSENT_FRAMEWORK.md](INFORMED_CONSENT_FRAMEWORK.md) | [Governance](/governance/)
