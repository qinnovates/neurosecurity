---
title: "Research Outreach Tracker"
description: "Tiered researcher and standards body engagement plan for QIF."
order: 51
---

# Research Outreach Tracker

> **Purpose:** Track researcher and standards body engagement for QIF. Outreach happens when we have something concrete to show — not before.
>
> **Last updated:** 2026-02-27

---

## Outreach Principles

1. **Reach out when you have something to show them.** A preprint, simulation results, a defense against their attack vector. Not before.
2. **Lead with their work.** "We built on your finding" is a better opening than "look at our framework."
3. **One or two contacts at a time.** Don't blast everyone simultaneously.
4. **Track responses.** A non-response after 2 weeks gets one follow-up. After that, move on.

---

## Tier 1 — Reach Out When Preprint Is on arXiv

These researchers' work is directly extended by QIF. They would benefit from knowing someone is treating their findings as security problems.

| Researcher(s) | Affiliation | Their Work | QIF Connection | Trigger | Status |
|----------------|-------------|------------|----------------|---------|--------|
| Ming et al. | Tsinghua University | 60 Hz SSVEP BCI above CFF threshold (DOI: 10.1088/1741-2552/acb51e) | Foundation of T0103 (SSVEP Frequency Hijack). QIF's 6-layer depth model and Neurowall detection build directly on their finding that subliminal flicker drives BCI commands. | arXiv preprint live | Not started |
| Upadhayay & Behzadan | SAIL Lab, University of New Haven | Sensory-channel manipulation degrades motor imagery BCI (DOI: 10.1109/SMC53992.2023.10394505) | Their "attack the human, not the BCI" insight is the exact threat model Neurowall's L1 signal boundary defends against. They are already in BCI security. | arXiv preprint live | Not started |

**Template:** "We cited your work in [paper title]. Your finding that [specific result] led us to build [Neurowall / T0103 threat model / sovereignty attack classification]. Here are the detection results: [link]. We think this extends your work into [direction]. Would welcome your feedback."

---

## Tier 2 — Reach Out When Standards Engagement Is Active

Standards bodies and working groups where QIF's contributions (NISS, TARA, neurorights mapping) are directly relevant.

| Contact | Organization | Their Work | QIF Connection | Trigger | Status |
|---------|--------------|------------|----------------|---------|--------|
| Nick Leali | FIRST / CVSS SIG | CVSS v4.0 maintenance, vulnerability scoring standards | NISS extends CVSS with 6 neural-specific metrics (BI, CR, CD, CV, RV, NP). TARA maps 109 BCI attack techniques. 71.6% dual-use therapeutic overlap. | CVSS SIG meeting / email response | Draft email ready (`drafts/nick-leali-cvss-sig-email.md`) |
| MITRE CWE team | MITRE | Common Weakness Enumeration | CWE gap analysis: no neural-specific weakness types exist. QIF's TARA techniques map to CWE gaps. | After CVSS SIG traction | Not started |
| IEEE SA | IEEE | Neuroethics standards (P2794, P2731) | QIF's neurorights operationalization (5 rights mapped to NISS metrics and TARA techniques) provides technical grounding for IEEE's ethical framework. | After arXiv + CVSS SIG | Not started |

---

## Tier 3 — Reach Out When Hardware Validation Exists

These researchers would want to see real hardware results, not simulation. Wait until Neurowall has been validated on physical BCI hardware.

| Researcher(s) | Affiliation | Their Work | QIF Connection | Trigger | Status |
|----------------|-------------|------------|----------------|---------|--------|
| Bian, Meng & Wu | Chinese Academy of Sciences | Square wave injection forces target BCI classification (DOI: 10.1007/s11432-022-3440-5) | Their attack is scenario #1 in Neurowall's test suite. Detection confirmed in simulation. Hardware validation would close the loop. | Neurowall hardware validation | Not started |
| Zhang et al. | Multiple (China) | Imperceptible adversarial perturbations on EEG-BCI spellers (DOI: 10.1093/nsr/nwaa233) | Their adversarial perturbation model maps to Neurowall's spectral mimicry detection (scenario #14). | Neurowall hardware validation | Not started |
| Graz BCI Conference community | TU Graz | Annual BCI conference, clinical BCI research | QIF whitepaper, TARA Atlas, Neurowall simulation results relevant to clinical BCI security. Conference submission pathway. | Conference submission (March 2026 deadline) | Not started |

---

## Tier 4 — Collaboration Partners (Longer Term)

Potential collaborators for specific QIF components. Not outreach targets yet — these are people to watch and engage when the work matures.

| Area | Who to Watch | Why |
|------|-------------|-----|
| Formal security proofs | Bellare-Rogaway model researchers, Tamarin/ProVerif community | NSP handshake needs formal security reduction |
| Post-quantum hardware | NIST PQC implementation teams, embedded crypto researchers | NSP power budget (3.25%) needs hardware confirmation |
| Neural signal processing | PhysioNet / MNE-Python maintainers | Neurowall needs validation against recorded EEG datasets |
| Neurorights policy | Yuste Lab (Columbia), NeuroRights Foundation | QIF operationalizes neurorights with technical metrics — policy people need to see it |
| Traffic analysis | ML-based network analysis researchers | NSP constant-rate transmission needs evaluation against ML classifiers |

---

## Response Log

Track all outreach attempts and responses here.

| Date | Contact | Channel | Message Summary | Response | Follow-up |
|------|---------|---------|-----------------|----------|-----------|
| — | — | — | — | — | — |

---

## Notes

- **No PII in this file.** Use names and affiliations only. No email addresses, phone numbers, or private contact details. Store actual contact info separately (not in git).
- **DOI links are public.** Referencing published papers by DOI is standard academic practice.
- **Update this file** when: outreach is sent, a response is received, a trigger condition is met, or a new potential contact is identified.
