---
title: "UNESCO Neurotechnology Ethics Alignment"
description: "Mapping QIF to the UNESCO Recommendation on the Ethics of Neurotechnology"
order: 9
---

# QIF Framework: UNESCO Neurotechnology Ethics Alignment

> Mapping the QIF Framework to the UNESCO Recommendation on the Ethics of Neurotechnology (2025) — the first global normative framework for neurotechnology governance.

**Last Updated:** 2026-02-10
**Version:** 1.0

---

## Table of Contents

- [Overview](#overview)
- [About the UNESCO Recommendation](#about-the-unesco-recommendation)
- [UNESCO Timeline](#unesco-timeline)
- [Pillar I: Core Values — QIF Alignment](#pillar-i-core-values--oni-alignment)
- [Pillar II: Ethical Principles — QIF Alignment](#pillar-ii-ethical-principles--oni-alignment)
- [Pillar III: Policy Action Areas — QIF Alignment](#pillar-iii-policy-action-areas--oni-alignment)
- [Complete Alignment Matrix](#complete-alignment-matrix)
- [Relationship to Other Neuroethics Frameworks](#relationship-to-other-neuroethics-frameworks)
- [What QIF Demonstrates](#what-oni-demonstrates)
- [Gaps and Future Work](#gaps-and-future-work)
- [References](#references)

---

## Overview

On **November 12, 2025**, UNESCO's 194 Member States adopted the **Recommendation on the Ethics of Neurotechnology** — the first global normative framework specifically addressing the ethical development and use of neurotechnology. This document maps every component of the QIF Framework to the UNESCO Recommendation's three pillars: **Values**, **Principles**, and **Policy Action Areas**.

The QIF Framework was designed with neuroethical principles as foundational constraints. This alignment document demonstrates that QIF anticipated and implemented technical safeguards for the very concerns UNESCO has now codified as global policy — in several cases years before the Recommendation's adoption.

---

## About the UNESCO Recommendation

| Attribute | Detail |
|-----------|--------|
| **Full Title** | Recommendation on the Ethics of Neurotechnology |
| **Adopted** | November 12, 2025, at the 43rd General Conference (Samarkand, Uzbekistan) |
| **Scope** | 194 Member States — the entire United Nations membership |
| **Legal Nature** | Non-binding soft law instrument; provisions to be considered by Member States, research organizations, and private sector |
| **Coverage** | Entire lifecycle of neurotechnology — from design to disposal |
| **Co-Chairs** | Hervé Chneiweiss (French neuroscientist) and Nita Farahany (Duke University legal scholar) |
| **Expert Group** | 24 high-level experts, multidisciplinary, geographically and gender balanced |
| **Input** | 8,000+ contributions from civil society, private sector, academia, and Member States |
| **Context** | 700% increase in neurotechnology investment between 2014–2021; market projected to reach $25B by 2030 |

### Precursor: IBC Report (2021)

Before the formal Recommendation, UNESCO's International Bioethics Committee (IBC) published the foundational report *Ethical Issues of Neurotechnology* (2021), identifying five ethical challenges:

1. Cerebral/mental integrity and human dignity
2. Personal integrity and psychological continuity
3. Autonomy
4. Mental privacy
5. Accessibility and social justice

This report served as the intellectual foundation for the 2025 Recommendation and aligns directly with the neuroethics principles QIF was built upon.

---

## UNESCO Timeline

| Date | Event | QIF Relevance |
|------|-------|---------------|
| **2019** | UNESCO Director-General Azoulay launches initiative | — |
| **2021** | IBC publishes *Ethical Issues of Neurotechnology* report | QIF references "UNESCO, 2021" in NEUROETHICS_ALIGNMENT.md |
| **Nov 2023** | 194 Member States mandate an international standard-setting instrument | QIF Framework development underway (2023–Present) |
| **Apr 2024** | First meeting of Ad Hoc Expert Group (AHEG) | QIF governance documentation being authored |
| **Aug 2024** | Second AHEG meeting; first draft finalized | — |
| **Sep 2024** | First draft shared with Member States | — |
| **May 2025** | Intergovernmental meeting to finalize draft | — |
| **Nov 12, 2025** | **Adopted by 43rd General Conference** | QIF already implements technical safeguards for all core concerns |

---

## Pillar I: Core Values — QIF Alignment

The UNESCO Recommendation establishes five high-level values. Below, each is mapped to specific QIF components.

### Value 1: Human Rights, Freedoms, and Dignity

> *Technology must respect and promote fundamental human rights.*

| UNESCO Requirement | QIF Implementation | Location |
|--------------------|--------------------|----------|
| Respect human rights | QIF's entire governance framework is built on the Ienca & Andorno (2017) neurorights: cognitive liberty, mental privacy, mental integrity, psychological continuity | `NEUROETHICS_ALIGNMENT.md` |
| Protect dignity | Neural Firewall (L8) enforces consent requirements — even "good-looking" signals need permission. Benevolent paternalism without consent is treated as a violation | `firewall.py`, `NEUROETHICS_ALIGNMENT.md` §2 |
| Prevent unauthorized interference | Zero-trust architecture: default-deny, authentication required, coherence validation | `firewall.py`, `QIF Hourglass` (L8) |
| Freedom from manipulation | BCI Anonymizer classifies cognitive sensitivity (P300, N170, N400 ERPs) and filters private data at source | `NEUROSECURITY_IMPLEMENTATION.md` |

### Value 2: Human Health and Well-Being

> *Resources should focus on neurotechnology benefiting the largest number of people.*

| UNESCO Requirement | QIF Implementation | Location |
|--------------------|--------------------|----------|
| Prioritize health benefit | Post-deployment ethics framework ensures continued device support after trials end, preventing patient abandonment | `POST_DEPLOYMENT_ETHICS.md` |
| Safety protections | Amplitude bounds and rate limiting prevent physical harm from overstimulation; DoS detection thresholds protect neural tissue | `firewall.py` |
| Lifecycle consideration | Full lifecycle planning: pre-deployment, active use, transition, end-of-life stages documented | `POST_DEPLOYMENT_ETHICS.md` §Lifecycle Planning |
| Prevent abandonment | Stakeholder responsibility matrix covers manufacturer, researcher, funder, patient, and regulator obligations across device lifecycle | `POST_DEPLOYMENT_ETHICS.md` §Stakeholder Matrix |

### Value 3: Respect for Diversity and Cultural Differences

> *Account for different cultures and contexts.*

| UNESCO Requirement | QIF Implementation | Location |
|--------------------|--------------------|----------|
| Cultural sensitivity | Relational autonomy model (Lázaro-Muñoz framework) recognizes autonomy is exercised within relationships, not in isolation — accommodates diverse decision-making structures | `NEUROETHICS_ALIGNMENT.md` §Relational Autonomy |
| Multi-stakeholder inclusion | Formal stakeholder roles defined: patient/user, caregiver, clinician, researcher, engineer/developer | `NEUROETHICS_ALIGNMENT.md` §Multi-Stakeholder |
| Open and transparent | Apache 2.0 open-source license; framework publicly available for adaptation across cultures and contexts | `LICENSE`, `TRANSPARENCY.md` |

### Value 4: Sustainability

> *Development must be environmentally and socially sustainable.*

| UNESCO Requirement | QIF Implementation | Location |
|--------------------|--------------------|----------|
| Long-term viability | Post-trial access framework addresses sustainability of implanted devices beyond research phases — high maintenance costs ($10,000+/year) explicitly documented | `POST_DEPLOYMENT_ETHICS.md` §Post-Trial Access |
| Social sustainability | Open-source model ensures knowledge is shared, not locked behind proprietary barriers | `README.md`, `LICENSE` |
| Standards development | QIF identifies gaps in upper cognitive layers (L11–L14) and calls for collaboration with neuroethicists, cognitive scientists, and governing agencies | `POST_DEPLOYMENT_ETHICS.md` §L11-L14 Gap |

### Value 5: Professional Integrity

> *High standards of professional conduct required.*

| UNESCO Requirement | QIF Implementation | Location |
|--------------------|--------------------|----------|
| Transparent methodology | Full Human-AI collaboration documentation with 40% AI suggestion modification rate; all corrections documented with reasoning | `TRANSPARENCY.md` |
| Research verification | Anti-hallucination firewall with uncertainty tags (✅ VERIFIED, ⚠️ INFERRED, 🔍 UNVERIFIED, ❌ CONTRADICTED) | `RESEARCH_VERIFICATION_PROTOCOL.md` |
| Citation rigor | 50+ peer-reviewed sources across neuroscience, cybersecurity, physics, and neuroethics | All publications |
| Multi-model verification | Uses Claude, Gemini, ChatGPT, and LMArena for epistemic hygiene — prevents single-model bias | `TRANSPARENCY.md` §Tool Disclosure |

---

## Pillar II: Ethical Principles — QIF Alignment

### Principle 1: Proportionality

> *Use of neurotechnology should be limited to what is appropriate and proportionate to the objectives pursued, based on scientific evidence.*

| UNESCO Requirement | QIF Implementation | Location |
|--------------------|--------------------|----------|
| Evidence-based decisions | Coherence Metric (Cₛ) provides quantitative, evidence-based signal assessment — not subjective judgment | `coherence.py` |
| Proportionate response | ACCEPT_FLAG intermediate state allows human review of borderline cases rather than binary accept/reject | `firewall.py` |
| Graduated response | Scale-frequency invariant (f × S ≈ k) provides deviation scoring — graduated response based on anomaly severity | `scale_freq.py` |
| Scientific grounding | Coherence metric grounded in spike-timing dependent plasticity and communication-through-coherence theory (Fries, 2005/2015) | `NEUROETHICS_ALIGNMENT.md` §1 |

### Principle 2: Protection of Freedom of Thought

> *Right to choose whether or not to use neurotechnology at any time; consent must be freely given and informed.*

| UNESCO Requirement | QIF Implementation | Location |
|--------------------|--------------------|----------|
| Right to choose | Cognitive Liberty is the first principle in QIF's neuroethics framework — right to mental self-determination | `NEUROETHICS_ALIGNMENT.md` §Core Principles |
| Informed consent | Full Informed Consent Framework with continuous consent model: Initial Consent → Active Monitoring → Re-consent | `INFORMED_CONSENT_FRAMEWORK.md` |
| Consent states | ConsentState enum: NOT_OBTAINED, INITIAL_ONLY, FULL_CONSENT, REVOKED, EXPIRED — integrated into firewall decision logic | `consent.py` |
| Consent + coherence | Firewall decision matrix: "High Coherence + Valid Auth + No Consent = REJECT" — quality does not override consent | `INFORMED_CONSENT_FRAMEWORK.md` §Validation |
| Revocability | Consent can be revoked at any time; REVOKED state triggers immediate signal rejection | `consent.py` |
| Therapeutic misconception disclosure | Consent documentation explicitly requires therapeutic misconception disclosure | `INFORMED_CONSENT_FRAMEWORK.md` §Documentation |

### Principle 3: Privacy

> *Neural data is particularly private and uniquely sensitive; strict safeguards against misuse required.*

| UNESCO Requirement | QIF Implementation | Location |
|--------------------|--------------------|----------|
| Neural data as sensitive | BCI Anonymizer classifies neural data by cognitive sensitivity level — P300 (attention/recognition), N170 (face recognition), N400 (semantic processing) | `NEUROSECURITY_IMPLEMENTATION.md` |
| Filter before transmission | BCI Anonymizer filters private cognitive data at the source before transmission — privacy by design | `NEUROSECURITY_IMPLEMENTATION.md` |
| Transport pathway integrity | Transport variance (σ²τ) detects unauthorized access pathways — signals arriving via unexpected routes indicate potential privacy breach | `coherence.py`, `NEUROETHICS_ALIGNMENT.md` §5 |
| Data classification | CCPA/GDPR data classification implemented across frameworks; neural data classified at highest sensitivity | `REGULATORY_COMPLIANCE.md` |
| Quantum-resistant encryption | Quantum encryption framework addresses Harvest-Now-Decrypt-Later (HNDL) threats — neural data with 50+ year lifespans requires post-quantum protection | Publications: `quantum-encryption/` |

### Principle 4: Protection of Children and Future Generations

> *Neurotechnology should promote holistic child development; limited to medical, therapeutic, or well-justified purposes.*

| UNESCO Requirement | QIF Implementation | Location |
|--------------------|--------------------|----------|
| Pediatric protections | Full Pediatric Considerations framework based on Lázaro-Muñoz et al. (NIH-funded research) | `INFORMED_CONSENT_FRAMEWORK.md` (Pediatric section) |
| Age-appropriate consent | Age-tiered assent framework: 0–6 (no formal assent), 7–11 (simple verbal), 12–14 (written), 15–17 (near-adult strong weight) | `INFORMED_CONSENT_FRAMEWORK.md` (Pediatric section) §Age Framework |
| Tri-level authorization | Level 1: Parental consent, Level 2: Minor's assent, Level 3: Clinician certification — all three required | `INFORMED_CONSENT_FRAMEWORK.md` (Pediatric section) §Tri-Level |
| Identity development | Special protections for developing brains and identity formation | `INFORMED_CONSENT_FRAMEWORK.md` (Pediatric section) §Incapacity |
| Clinician-identified concerns | Documented concerns from pediatric DBS clinicians: uncertainty about risks (72%), decision-making roles (52%), information scarcity (52%), adolescent assent capacity (80%) | `INFORMED_CONSENT_FRAMEWORK.md` (Pediatric section) §Clinician Concerns |

---

## Pillar III: Policy Action Areas — QIF Alignment

The UNESCO Recommendation contains at least 11 policy areas. Below are the key areas identified from available sources with QIF's corresponding implementation.

### Consumer Protection and Commercial Use

| UNESCO Recommendation | QIF Response | Location |
|-----------------------|-------------|----------|
| Prohibit neural data in manipulative recommender systems | BCI Anonymizer filters cognitive data at source, preventing downstream manipulation | `NEUROSECURITY_IMPLEMENTATION.md` |
| Restrict neural data for "nudging" | L14 (Identity & Ethics) explicitly addresses identity manipulation, memory tampering, personality modification | `QIF Hourglass` (L14) |
| Prohibit neuromarketing during sleep | Neural Firewall default-deny architecture blocks all unauthorized access regardless of user state | `firewall.py` |
| Apply consumer protection equally to neurotechnology | Regulatory compliance framework maps to FTC unfair/deceptive practices, COPPA, and health claims requirements | `REGULATORY_COMPLIANCE.md` §FTC |

### Enhancement

| UNESCO Recommendation | QIF Response | Location |
|-----------------------|-------------|----------|
| Prohibit pressure to use enhancement | Cognitive Liberty principle: right to mental self-determination, freedom from unauthorized interference | `NEUROETHICS_ALIGNMENT.md` §Core Principles |
| Prohibit enhancement undermining dignity/identity | Psychological Continuity right: protection of personal identity and sense of self | `NEUROETHICS_ALIGNMENT.md` §Core Principles |
| Guidance on acceptable vs. prohibited enhancement | QIF identifies this as a gap requiring policy collaboration — framework provides technical infrastructure for enforcement | `POST_DEPLOYMENT_ETHICS.md` §L11-L14 Gap |

### Workplace Protections

| UNESCO Recommendation | QIF Response | Location |
|-----------------------|-------------|----------|
| Warn against neural productivity monitoring | Mental Privacy right explicitly protects neural data and mental states from unauthorized access | `NEUROETHICS_ALIGNMENT.md` §Core Principles |
| Require explicit consent and transparency | Consent framework requires freely given, informed consent with documented scope of signal reading/modification | `INFORMED_CONSENT_FRAMEWORK.md` |

### Children and Young People

| UNESCO Recommendation | QIF Response | Location |
|-----------------------|-------------|----------|
| Ban non-therapeutic use for children | Full pediatric framework with age-tiered protections grounded in NIH-funded research | `INFORMED_CONSENT_FRAMEWORK.md` (Pediatric section) |

### Behavioral Influence and Addiction

| UNESCO Recommendation | QIF Response | Location |
|-----------------------|-------------|----------|
| Regulate products that influence behavior | Neural ransomware threat taxonomy identifies behavioral manipulation as attack vector; Coherence Metric detects anomalous signals | Publications: `neural-ransomware/` |
| Clear information to consumers | Open-source transparency with full documentation of all framework capabilities and limitations | `TRANSPARENCY.md` |

### Health and Social Well-Being

| UNESCO Recommendation | QIF Response | Location |
|-----------------------|-------------|----------|
| Ensure equitable access to therapeutic technology | Post-deployment ethics addresses post-trial access, device abandonment, and sustainability of care | `POST_DEPLOYMENT_ETHICS.md` |
| Lifecycle obligations | Manufacturer, researcher, funder, patient, and regulator responsibilities mapped across full device lifecycle | `POST_DEPLOYMENT_ETHICS.md` §Stakeholder Matrix |

### Oversight and Governance

| UNESCO Recommendation | QIF Response | Location |
|-----------------------|-------------|----------|
| Ensure suitable oversight | QIF provides technical infrastructure for oversight: logging, auditing, coherence scoring, firewall decisions | `firewall.py`, `NEUROETHICS_ALIGNMENT.md` |
| Prevent social control/surveillance | QIF is explicitly NOT a surveillance framework — security without surveillance; integrity validated without reading thoughts | `NEUROETHICS_ALIGNMENT.md` §Privacy Statement |
| Data protection and cybersecurity | Full regulatory compliance mapping: FDA, FCC, HIPAA, FTC, NIST, state neural data laws (Colorado, California, Minnesota, New York) | `REGULATORY_COMPLIANCE.md` |
| Lifecycle evaluation | Regulatory Window Analysis: Research (2000–2020) → Early Clinical (2020–2026) → Consumer Transition (2026–2030) → Mass Adoption (2030+) | `REGULATORY_COMPLIANCE.md` §Window |

### Access and Equity

| UNESCO Recommendation | QIF Response | Location |
|-----------------------|-------------|----------|
| Keep neurotechnology inclusive and affordable | Open-source (Apache 2.0); published to PyPI for free access; educational modules (Autodidactive) | `LICENSE`, PyPI packages |
| Protect vulnerable groups | Pediatric considerations, incapacity protections, variable capacity model, advance directives for neural devices | `INFORMED_CONSENT_FRAMEWORK.md` (Pediatric section) |

---

## Complete Alignment Matrix

| UNESCO Element | Type | QIF Component | Status |
|----------------|------|---------------|--------|
| Human rights, freedoms, dignity | Value | Neurorights framework (4 principles), Neural Firewall | ✅ Implemented |
| Human health and well-being | Value | Post-deployment ethics, amplitude bounds, rate limiting | ✅ Implemented |
| Respect for diversity | Value | Relational autonomy model, multi-stakeholder framework | ✅ Implemented |
| Sustainability | Value | Open-source, post-trial access framework | ✅ Implemented |
| Professional integrity | Value | Transparency audit trail, research verification protocol | ✅ Implemented |
| Proportionality | Principle | Coherence Metric, ACCEPT_FLAG, graduated response | ✅ Implemented |
| Freedom of thought | Principle | Cognitive Liberty, informed consent framework, consent states | ✅ Implemented |
| Privacy | Principle | BCI Anonymizer, transport variance, quantum encryption | ✅ Implemented |
| Protection of children | Principle | Pediatric framework, age-tiered assent, tri-level authorization | ✅ Implemented |
| Consumer protection | Policy | BCI Anonymizer, default-deny firewall, FTC compliance mapping | ✅ Implemented |
| Enhancement regulation | Policy | Cognitive Liberty, Psychological Continuity principles | ⚠️ Partial — technical infrastructure exists; policy guidance requires collaboration |
| Workplace protections | Policy | Mental Privacy, consent framework | ✅ Implemented |
| Children protections | Policy | Full pediatric framework | ✅ Implemented |
| Behavioral influence | Policy | Neural ransomware taxonomy, coherence detection | ✅ Implemented |
| Health and well-being | Policy | Post-deployment ethics, lifecycle obligations | ✅ Implemented |
| Oversight and governance | Policy | Logging, auditing, regulatory compliance mapping | ✅ Implemented |
| Access and equity | Policy | Open-source, free PyPI packages, educational modules | ✅ Implemented |

**Summary: 15 of 17 UNESCO elements fully implemented; 2 partially implemented (requiring policy collaboration beyond technical scope).**

---

## Relationship to Other Neuroethics Frameworks

The UNESCO Recommendation builds upon and extends prior neuroethics frameworks. QIF integrates all of them:

| Framework | Year | Key Contribution | QIF Integration |
|-----------|------|------------------|-----------------|
| **Ienca & Andorno** | 2017 | Four neurorights: cognitive liberty, mental privacy, mental integrity, psychological continuity | Core principles of NEUROETHICS_ALIGNMENT.md; each mapped to specific QIF technical components |
| **Yuste et al. / Morningside Group** | 2017 | Five neurorights: adds equal access and protection from algorithmic bias | Equal access via open-source; bias protection via multi-model verification and transparent methodology |
| **OECD** | 2019 | Responsible Innovation in Neurotechnology — first international instrument (36 members) | QIF follows responsible innovation principles: accountability, transparency, safety |
| **UNESCO IBC Report** | 2021 | Five ethical challenges for neurotechnology | Referenced in QIF governance since inception |
| **Chile Constitutional Amendment** | 2021 | First country to constitutionally protect neurorights | QIF's regulatory compliance maps Chilean precedent |
| **UNESCO Recommendation** | 2025 | First global normative framework (194 Member States) — values, principles, policy actions | **This document** maps comprehensive alignment |
| **Lázaro-Muñoz et al.** | 2020–2023 | Empirical researcher perspectives on DBS ethics, pediatric ethics, post-trial access | Full integration: stakeholder model, consent framework, pediatric considerations, post-deployment ethics |

### How UNESCO Extends Prior Frameworks

| Prior Framework | UNESCO Addition |
|-----------------|----------------|
| Ienca & Andorno (4 rights) | Adds explicit policy prohibitions (neuromarketing during sleep, workplace monitoring, child non-therapeutic use) |
| Yuste et al. (5 rights) | Adds implementation tools (Readiness Assessment, Ethical Impact Assessment, capacity-building) |
| OECD (36 members) | Extends to 194 Member States — truly global scope |
| Chile (1 country) | Provides model for 194 countries to follow |

---

## What QIF Demonstrates

For academic and policy audiences, this alignment demonstrates:

1. **Anticipatory Design**: QIF was built on neuroethics principles from its inception (2023), implementing technical safeguards for concerns that UNESCO codified as global policy in 2025

2. **Technical Implementation of Abstract Rights**: UNESCO articulates values and principles; QIF provides the engineering architecture that makes them enforceable — coherence metrics, neural firewalls, consent state machines, anonymizers

3. **Empirical Grounding**: QIF integrates not just philosophical frameworks but empirical research — Lázaro-Muñoz's clinician interviews, researcher-identified concerns with specific percentages, real-world cost data for post-trial access

4. **Comprehensive Coverage**: 15 of 17 UNESCO elements fully implemented; the 2 partial elements (enhancement regulation, detailed policy guidance) are explicitly outside the scope of a technical security framework and require policy collaboration

5. **Bridge Between Disciplines**: QIF translates between cybersecurity (SIEM, firewalls, threat taxonomies), neuroscience (ERPs, coherence theory, neural pathways), and ethics (neurorights, consent, governance) — exactly the interdisciplinary bridge UNESCO calls for

---

## Gaps and Future Work

| Gap | UNESCO Element | Status | Path Forward |
|-----|---------------|--------|--------------|
| Enhancement policy guidance | Enhancement (Policy) | ⚠️ Partial | Requires policy collaboration — QIF provides technical infrastructure for enforcement but cannot unilaterally define which enhancements are acceptable |
| Detailed implementation guidance for Member States | Implementation | Not in scope | QIF is a technical framework, not a policy implementation toolkit — complements UNESCO's planned Readiness Assessment Methodology |
| L11–L14 international standards | Oversight (Policy) | Identified gap | Upper cognitive layers lack established international standards; calls for collaboration with neuroethicists, cognitive scientists, and governing agencies |
| Readiness Assessment integration | Implementation | Future work | When UNESCO publishes Readiness Assessment Methodology, QIF should map technical capabilities to assessment criteria |

---

## References

UNESCO. (2025). *Recommendation on the Ethics of Neurotechnology*. Adopted at the 43rd session of the General Conference. https://www.unesco.org/en/ethics-neurotech/recommendation

UNESCO. (2021). *Ethical Issues of Neurotechnology*. International Bioethics Committee (IBC). https://unesdoc.unesco.org/ark:/48223/pf0000378724

UNESCO. (2025). *Report of the Director-General on the Draft Recommendation on the Ethics of Neurotechnology*. https://unesdoc.unesco.org/ark:/48223/pf0000393266

UNESCO. (2024). *First Draft of the Recommendation on the Ethics of Neurotechnology*. https://unesdoc.unesco.org/ark:/48223/pf0000391074

Ienca, M., & Andorno, R. (2017). Towards new human rights in the age of neuroscience and neurotechnology. *Life Sciences, Society and Policy*, 13(1), 5. https://doi.org/10.1186/s40504-017-0050-1

Yuste, R., Goering, S., Arcas, B. A. Y., et al. (2017). Four ethical priorities for neurotechnologies and AI. *Nature*, 551(7679), 159–163. https://doi.org/10.1038/551159a

OECD. (2019). *Recommendation on Responsible Innovation in Neurotechnology*. https://legalinstruments.oecd.org/api/print?ids=658&Lang=en

Lázaro-Muñoz, G., Pham, M. T., Muñoz, K. A., et al. (2020). Researcher Perspectives on Ethical Considerations in Adaptive Deep Brain Stimulation Trials. *Frontiers in Human Neuroscience*, 14, 578695. https://doi.org/10.3389/fnhum.2020.578695

Lázaro-Muñoz, G., Pham, M. T., Muñoz, K. A., et al. (2022). Post-trial access in implanted neural device research. *Brain Stimulation*, 15(5), 1029–1036. https://doi.org/10.1016/j.brs.2022.07.051

---

← Back to [Governance](/governance/) | [NEUROETHICS_ALIGNMENT.md](NEUROETHICS_ALIGNMENT.md) | [REGULATORY_COMPLIANCE.md](REGULATORY_COMPLIANCE.md)
