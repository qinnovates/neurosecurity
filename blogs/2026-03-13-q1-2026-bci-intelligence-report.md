---
title: "Q1 2026 BCI Intelligence Report"
date: 2026-03-13
tags: [neurosecurity, threat-intelligence, bci-security, research, report]
type: case-study
description: "Quarterly threat intelligence report covering the BCI industry's security posture, funding activity, regulatory milestones, and emerging attack surface — Q1 2026."
---

# Q1 2026 BCI Intelligence Report

**Published:** March 13, 2026
**Coverage Period:** January 1 – March 13, 2026
**Data Sources:** QIF BCI Landscape Tracker (57 companies), TARA v1.7 (109 techniques), NISS v2.1 (20 devices scored), CVE-Technique Mapping (55 CVEs), BCI Intel Feed (215 items)
**Classification:** PUBLIC — Qinnovate Threat Intelligence

---

## Executive Summary

The BCI industry entered 2026 at an inflection point. Capital is accelerating, devices are reaching patients, and regulatory milestones are stacking up. Security documentation remains absent.

This report covers 57 companies, 109 catalogued attack techniques, and 20 scored devices. The central finding is unchanged from our initial assessment but growing more urgent: **the industry is shipping devices into human nervous systems with no shared security framework, no adversarial threat model, and no neural-specific vulnerability tracking.**

Three developments define Q1 2026:

1. **$482M in new BCI funding** in a single quarter (Merge Labs $252M + Science Corp $230M), led by the largest BCI seed round in history
2. **First 510(k) clearance** for a high-density cortical BCI (Precision Neuroscience Layer 7, Mar 2025)
3. **Intelligence community investment** in two BCI companies (IQT participated in Synchron's $200M Series D and Science Corp's $230M Series C)

The security posture of the industry has not changed. Zero companies have published a formal security audit. The CVE coverage gap remains at 81.25% — meaning 81% of attacks that are physically possible today and map to clinical harm have no vulnerability tracking whatsoever.

---

## 1. Industry Landscape

### 1.1 Market Composition

| Metric | Count |
|--------|-------|
| Companies tracked | 57 |
| Active companies | 43 |
| Acquired | 5 |
| Defunct | 2 |
| Research-only | 4 |
| Public companies | 3 |

**By device type:**

| Type | Companies | % of Total |
|------|-----------|------------|
| Non-invasive | 27 | 47% |
| Invasive | 19 | 33% |
| Semi-invasive | 6 | 11% |
| Hybrid / Other | 5 | 9% |

**By company stage:**

| Stage | Count |
|-------|-------|
| Startup | 14 |
| Growth stage | 16 |
| Established | 6 |
| Public | 3 |
| Acquired | 5 |
| Research consortium / Lab | 5 |
| Defunct | 2 |

The industry remains heavily concentrated in the United States (38 of 57 companies), with secondary clusters in Europe (France, Spain, Switzerland, Austria, Netherlands) and emerging activity in Israel, Australia, and China.

### 1.2 Capital Activity — Q1 2026

| Company | Round | Amount | Date | Notable |
|---------|-------|--------|------|---------|
| Merge Labs | Seed | $252M | Jan 2026 | Largest BCI seed round ever. Led by OpenAI. Sam Altman co-founder. |
| Science Corp | Series C | $230M | Mar 2026 | IQT (CIA/IC venture arm) participated. Total raised: $490M. |

**Cumulative industry funding tracked:** $5.93B across 38 companies with disclosed funding (of 57 total tracked).

> **Coverage disclaimer:** These 57 companies represent our current tracking scope, not the full BCI market. Dozens of additional companies, university spinouts, defense-funded programs, and stealth startups remain uncrawled. Notable gaps include several Chinese BCI companies (beyond BrainCo), DBS/neurostimulation incumbents (Medtronic, Abbott, Boston Scientific), and early-stage programs that have not yet disclosed funding. The true industry capital figure is materially higher. We are expanding coverage each quarter.

![BCI Industry Capital Overview — Q1 2026](/images/bci-valuation-q1-2026.png)

**Top 10 by total funding:**

| # | Company | Total Raised | Type | Valuation |
|---|---------|-------------|------|-----------|
| 1 | Neuralink | ~$1.3B | Invasive | $9.6B |
| 2 | Science Corp | $490M | Semi-invasive | $1.5B |
| 3 | BrainCo | $370M | Non-invasive | $1.3B |
| 4 | Synchron | $345M | Semi-invasive | — |
| 5 | MindMaze | $330M | Non-invasive | — |
| 6 | Merge Labs | $252M | Non-invasive | $850M |
| 7 | Blackrock Neurotech | $210M | Invasive | $350M |
| 8 | Precision Neuroscience | $183M | Invasive | $500M |
| 9 | Kernel | $158M | Non-invasive | — |
| 10 | Paradromics | $127M | Invasive | — |

Four companies have reached or are approaching unicorn valuation: Neuralink ($9.6B), Science Corp ($1.5B), BrainCo ($1.3B+), and Merge Labs ($850M). The combined valuation of the top four alone exceeds $13B.

### 1.4 BCI Industry Cumulative Valuation

The total disclosed valuation across all tracked BCI companies with known valuations:

| Company | Valuation | Type | Source |
|---------|-----------|------|--------|
| Neuralink | $9,600M | Invasive | Series E, Jun 2025 |
| Science Corp | $1,500M | Semi-invasive | Series C, Mar 2026 |
| BrainCo | $1,300M | Non-invasive | Pre-IPO, 2025 |
| Merge Labs | $850M | Non-invasive | Seed, Jan 2026 |
| Precision Neuroscience | $500M | Invasive | Last reported |
| Blackrock Neurotech | $350M | Invasive | Last reported |
| **Total (disclosed)** | **$14,100M** | | |

This figure represents only companies with publicly reported valuations. The majority of the 57 tracked companies are private with undisclosed valuations. The true industry market cap is higher.

For context: the BCI industry's disclosed valuation of $14.1B is concentrated in the top 3 companies (88%). Neuralink alone represents 68% of the total. This concentration creates systemic risk — a single company's setback could reshape the market narrative for the entire sector.

### 1.3 Key Q1 Events

- **Merge Labs public launch (Jan 15, 2026).** Spun out of Forest Neurotech (nonprofit FRO). Functional ultrasound + genetically encoded molecular reporters (gas vesicle proteins delivered via AAV gene therapy). Co-founded by Sam Altman (OpenAI CEO) and Alex Blania (Tools for Humanity CEO). OpenAI as lead investor raises AI-BCI convergence questions that no existing governance framework addresses.

- **Science Corp Series C closes at $230M (Mar 2026).** IQT participation marks the second intelligence community investment in a BCI company (after Synchron's Series D, Nov 2025). Science Corp's PRIMA retinal implant received CE mark and FDA submissions in June 2025; PRIMAvera pivotal results published in NEJM (Oct 2025). The Biohybrid Neural Interface program — stem cell-derived living neurons in silicon scaffold with ~90,000 microwells — represents a fundamentally new TARA attack surface category.

- **Neuralink reaches ~20 global implants.** PRIME (US), CAN-PRIME (Canada, Nov 2024), GB-PRIME (UK, Jul 2025). Twelve patients confirmed by Sep 2025; the company completed its stated goal of 20 implants by end of 2025, including 7 in Great Britain. PMA application filed Nov 2024. FDA Emergency Use Authorization for calibration software in acute locked-in syndrome (Apr 2025).

- **Paradromics first-in-human recording (May 2025).** Acute implantation during epilepsy surgery at University of Michigan (Dr. Matthew Willsey). Connexus DDI with 421 microelectrodes successfully recorded neural activity in a 20-minute procedure. FDA IDE approved Nov 2025 for Connect-One Early Feasibility Study — first IDE for speech restoration with a fully implantable BCI. Chronic clinical study planned for Q1 2026.

---

## 2. Security Posture Assessment

### 2.1 Industry Security Documentation

This is the most consequential finding in this report.

| Security Posture | Companies | % |
|------------------|-----------|---|
| No documentation published | 44 | 77% |
| Minimal claims (unverified) | 3 | 5% |
| Basic encryption claims | 4 | 7% |
| Regulatory compliance only | 3 | 5% |
| Open source (community-auditable) | 1 | 2% |
| Formal security audit published | 0 | 0% |

**Zero out of 57 tracked BCI companies have published a formal security audit.**

The four companies claiming "basic encryption" (Emotiv, InteraXon, Neurosity, and one other) reference Bluetooth encryption or AES-128 for data transfer. None have published the scope of these claims, the threat model they defend against, or independent verification.

The three companies in "regulatory compliance" (Nihon Kohden, Natus/Integra, one other) are subject to FDA cybersecurity requirements and IEC 62443 — but these frameworks were designed for general medical devices, not adversarial neural interfaces. They evaluate intended-use safety, not adversarial signal-level threats.

OpenBCI is the only company with an open-source security posture — community-auditable by design, though without formal security certifications.

### 2.2 Known Vulnerabilities

The entire BCI industry has produced **4 published CVEs**, all from a single product:

| CVE | Product | CVSS | Impact |
|-----|---------|------|--------|
| CVE-2017-2853 | Natus Xltek EEG | 9.8 (Critical) | Remote code execution via stack buffer overflow |
| CVE-2017-2867 | Natus Xltek EEG | — | — |
| CVE-2017-2868 | Natus Xltek EEG | — | — |
| CVE-2017-2869 | Natus Xltek EEG | — | — |

All four were disclosed in 2017 via ICS-CERT advisories. No new BCI-specific CVEs have been published since. This does not mean no vulnerabilities exist. It means no one is looking.

### 2.3 CVE Coverage Gap Analysis

We mapped 55 neurotech-adjacent CVEs against our 109 TARA techniques. The coverage gap tells a clear story:

**By hourglass band:**

| Band | CVE Coverage | Techniques | CVE-Backed |
|------|-------------|------------|------------|
| S3 (Cloud/Application) | 23.9% | 46 | 11 |
| S2 (Digital/Firmware) | 21.7% | 60 | 13 |
| S1 (Analog/Signal) | 16.0% | 50 | 8 |
| I0 (Interface) | 6.5% | 31 | 2 |
| N7–N1 (All Neural Bands) | 0.0% | 8–45 per band | 0 |

**The gradient is stark: 20% synthetic coverage → 6% at the interface → 0% across all seven neural bands.**

No CVE exists for neural-layer exploitation. The vulnerability tracking infrastructure that protects every other computing domain does not extend past the electrode.

**Clinical blind spot:** Of the 62 techniques that are physically feasible today, 52 map to direct clinical harm (DSM-5-TR diagnostic categories, for threat modeling purposes). Of those 52, only 6 have any CVE backing. **81.25% of attacks that are both feasible and clinically harmful are invisible to existing vulnerability tracking.**

**I0 chokepoint exposure:** The interface band — where silicon meets biology — has 31 catalogued techniques. Two have CVE validation. **93.5% of the most critical attack surface is untracked.**

---

## 3. Threat Landscape

### 3.1 TARA Overview (v1.7)

| Metric | Value |
|--------|-------|
| Total techniques | 109 |
| Total tactics | 16 |
| Total domains | 8 |
| Enriched techniques | 103 |
| Techniques with clinical analog | 77 (71%) |
| Silicon-only techniques | 25 (23%) |

**By status (evidence tier):**

| Status | Count | % | Meaning |
|--------|-------|---|---------|
| DEMONSTRATED | 35 | 32% | Reproduced in lab or clinical settings |
| THEORETICAL | 31 | 28% | Physically plausible, not yet demonstrated |
| EMERGING | 22 | 20% | Early evidence, active research |
| CONFIRMED | 19 | 17% | Independently verified, published |
| PLAUSIBLE | 1 | 1% | Logically sound, minimal evidence |
| SPECULATIVE | 1 | 1% | Requires unproven capability |

54 techniques (50%) are CONFIRMED or DEMONSTRATED — not theoretical. Half the threat catalog has laboratory or clinical evidence.

**By severity:**

| Severity | Count | % |
|----------|-------|---|
| Critical | 29 | 27% |
| High | 60 | 55% |
| Medium | 17 | 16% |
| Low | 3 | 3% |

82% of catalogued techniques rate High or Critical severity.

### 3.2 Dual-Use Finding

The most significant structural finding in the TARA is that attack mechanisms and therapeutic mechanisms are often the same physics:

| Dual-Use Status | Count | % |
|-----------------|-------|---|
| Confirmed dual-use | 52 | 48% |
| Probable dual-use | 16 | 15% |
| Possible dual-use | 9 | 8% |
| Silicon-only (no biological analog) | 25 | 23% |

**71% of techniques have a clinical analog.** The same transcranial magnetic stimulation parameters that treat depression can, at different dosages and without consent, induce cognitive disruption. The same deep brain stimulation that manages Parkinson's symptoms can, if manipulated, alter mood and behavior.

The boundary between attack and therapy is not physics. It is consent, dosage, and oversight.

### 3.3 NISS-CVSS Gap

NISS extends CVSS v4.0 with six neural-specific metrics that CVSS cannot express. We flagged 33 techniques where NISS and CVSS scoring diverge significantly:

| Gap Group | Techniques | Description |
|-----------|-----------|-------------|
| Group 1 (minor gap) | 12 | NISS adds context but CVSS is directionally correct |
| Group 2 (moderate gap) | 28 | CVSS misses biological reversibility, cognitive impact, or consent violation |
| Group 3 (severe gap) | 58 | CVSS fundamentally cannot express the harm — neural-layer attacks with no digital analog |

**53% of techniques fall in Gap Group 3** — CVSS is not just insufficient, it is structurally incapable of scoring these threats. A new metric is required.

### 3.4 Clinical Impact Mapping

102 of 109 techniques map to neurorights implications. The DSM-5-TR mapping (used for threat modeling purposes, not diagnostic claims):

| Clinical Cluster | Techniques |
|------------------|-----------|
| Non-diagnostic (signal disruption, no DSM category) | 42 |
| Mood / Trauma spectrum | 21 |
| Cognitive / Psychotic spectrum | 16 |
| Motor / Neurocognitive | 16 |
| Persistent / Personality | 7 |

| Risk Classification | Techniques |
|--------------------|-----------|
| Direct clinical risk | 51 |
| Indirect clinical risk | 9 |
| No clinical mapping | 42 |

51 techniques pose direct clinical risk — meaning the attack mechanism, if successful, maps to a recognized diagnostic category. These are not hypothetical harms. They are the same mechanisms used in clinical interventions, applied without consent.

---

## 4. Device Risk Scoring

### 4.1 NISS Scores by Device

20 devices scored using NISS v2.1. Subscores: CL (Cognitive Liberty), MI (Mental Integrity), MP (Mental Privacy), PC (Psychological Continuity), EA (External Accessibility).

**Top 10 by overall NISS score (highest risk):**

| # | Device | Type | NISS | Severity | Techniques | Vector |
|---|--------|------|------|----------|------------|--------|
| 1 | Neuralink N1 | Invasive | 6.02 | High | 22 | CL:6.31 MI:6.32 MP:5.88 PC:4.59 EA:7.37 |
| 2 | Neuralink Blindsight | Invasive | 6.02 | High | 22 | CL:6.31 MI:6.32 MP:5.88 PC:4.59 EA:7.37 |
| 3 | INBRAIN Graphene Probe | Invasive | 5.11 | High | 9 | CL:5.29 MI:5.41 MP:3.87 PC:4.27 EA:7.37 |
| 4 | Natus Xltek EEG | Non-invasive | 4.71 | Medium | 14 | CL:5.36 MI:5.39 MP:4.01 PC:4.59 EA:4.38 |
| 5 | Synchron Stentrode | Semi-invasive | 4.60 | Medium | 12 | CL:4.35 MI:4.41 MP:4.01 PC:4.03 EA:6.63 |
| 6 | BrainCo Focus 1 | Non-invasive | 4.43 | Medium | 12 | CL:5.50 MI:5.51 MP:4.45 PC:4.59 EA:2.75 |
| 7 | Blackrock MoveAgain | Invasive | 4.38 | Medium | 13 | CL:4.94 MI:5.07 MP:2.98 PC:2.92 EA:7.37 |
| 8 | Blackrock NeuroPort | Invasive | 4.36 | Medium | 13 | CL:4.94 MI:5.07 MP:2.98 PC:2.92 EA:7.25 |
| 9 | Emotiv EPOC X | Non-invasive | 4.03 | Medium | 13 | CL:5.50 MI:5.51 MP:4.45 PC:4.50 EA:1.75 |
| 10 | Nihon Kohden Neurofax | Non-invasive | 3.96 | Medium | 11 | CL:3.64 MI:3.89 MP:3.91 PC:4.03 EA:4.38 |

### 4.2 Risk Distribution

| Severity | Devices | % |
|----------|---------|---|
| High (NISS 5.0+) | 3 | 15% |
| Medium (NISS 3.0–4.99) | 15 | 75% |
| Low (NISS < 3.0) | 2 | 10% |

**Key observations:**

- **Invasive devices cluster highest.** The Neuralink N1 and Blindsight score 6.02 — the highest in the dataset. Direct electrode-to-cortex contact maximizes the attack surface across all five NISS subscores.

- **External Accessibility (EA) is the differentiator.** Invasive devices with wireless telemetry score EA 7.25–7.37. Consumer devices with BLE-only connectivity score EA 1.75. The wireless interface to an implanted electrode is the single largest risk factor.

- **Non-invasive consumer devices score higher on CL and MI than expected.** The BrainCo Focus 1 (deployed in 10,000+ Chinese schools for attention monitoring) scores CL:5.50 and MI:5.51 — higher than some invasive devices — because cloud data processing and behavioral analytics create cognitive liberty and mental integrity risks through the data layer, not the signal layer.

- **The only device with published CVEs (Natus Xltek) ranks #4.** This is not because it is the fourth most dangerous device. It is because it is one of the few devices anyone has ever tested.

### 4.3 Scoring Methodology Note

NISS is a proposed scoring system extending CVSS v4.0. It has not been independently validated or adopted by any standards body. Scores represent the research team's assessment based on published device specifications, disclosed capabilities, and TARA technique mapping. They are not manufacturer-endorsed. See the [QIF preprint](https://doi.org/10.5281/zenodo.18640105) for full methodology.

---

## 5. Intelligence Community Interest

A pattern emerged in Q1 2026 that warrants dedicated tracking.

**IQT (In-Q-Tel) — the CIA and intelligence community's strategic venture arm — has now invested in two BCI companies:**

1. **Synchron** — $200M Series D (Nov 2025). Endovascular Stentrode, 10 implanted patients. Semi-invasive. Bezos Expeditions, QIA, and IQT participated.
2. **Science Corp** — Series C (Mar 2026). PRIMA retinal implant (38 patients, NEJM published), Biohybrid cortical interface (rodent PoC). Semi-invasive + invasive.

**OpenAI as BCI investor:** Sam Altman co-founded Merge Labs and OpenAI led its $252M seed round. This is the first direct capital link between a frontier AI company and a BCI hardware program. The convergence of large language models and neural interfaces raises governance questions that no existing framework — regulatory, ethical, or technical — currently addresses.

These investments do not imply malicious intent. Intelligence agencies fund dual-use technology across many domains. But they confirm that state-level actors view BCI as strategically significant, and any security framework for BCIs must account for nation-state threat actors in its threat model.

---

## 6. Regulatory Milestones

| Date | Company | Milestone |
|------|---------|-----------|
| Mar–Apr 2025 | Precision Neuroscience | FDA 510(k) cleared (K242618, clearance letter dated Mar 30, announced Apr 17) — first high-density cortical BCI to receive full regulatory clearance |
| Apr 2025 | Neuralink | FDA Emergency Use Authorization for calibration software (acute locked-in syndrome) |
| Jun 2025 | Science Corp | CE mark + FDA submissions for PRIMA |
| Jul 2025 | Neuralink | GB-PRIME (UK) trial begins |
| May 2025 | Paradromics | First-in-human acute recording (University of Michigan) |
| Nov 2025 | Paradromics | FDA IDE approved for Connect-One Early Feasibility Study |
| Oct 2025 | Science Corp | PRIMAvera pivotal results published in NEJM |

**Regulatory gap:** FDA evaluates safety and efficacy for intended use. It does not evaluate adversarial threat models. The 510(k) pathway that cleared Precision's Layer 7 assesses whether the device performs as intended — not whether a motivated adversary could manipulate the 1,024-channel cortical interface. IEC 60601 (medical device electrical safety) and IEC 62443 (industrial cybersecurity) do not cover neural-specific attack vectors.

---

## 7. Emerging Attack Surfaces

Three developments in Q1 2026 introduce novel TARA categories that did not exist in our initial assessment:

### 7.1 Gene Therapy Delivery Vectors

Merge Labs' approach uses AAV (adeno-associated virus) gene therapy to deliver gas vesicle protein molecular reporters to target brain regions. This introduces:

- **Viral vector integrity attacks.** Manipulation of the AAV construct during manufacturing or delivery could alter which proteins are expressed in which brain regions.
- **Genetic manipulation surface.** The gene therapy component creates a biological attack vector that traditional cybersecurity frameworks have no vocabulary for.
- **Supply chain risk.** AAV manufacturing is a specialized pharmaceutical process with its own chain of custody requirements.

### 7.2 Biohybrid Living-Neuron Interfaces

Science Corp's Biohybrid Neural Interface embeds stem cell-derived living neurons in a silicon scaffold. These neurons form biological synaptic connections with host cortex. This is not an electrode reading signals — it is an engineered biological circuit integrating with the brain.

The security implications are unprecedented. The interface is alive. It grows. It forms connections that were not explicitly programmed. The attack surface is the synapse itself.

### 7.3 Functional Ultrasound Neuromodulation

Merge Labs and Forest Neurotech are developing read-write capable ultrasound-based neural interfaces. Unlike EEG (read-only surface signals) or DBS (write-only deep stimulation), these systems aim to read and write across the full cortical depth without penetrating the skull.

Non-invasive write capability at depth is a step change in the threat model. Current non-invasive BCI risk is limited by physics — you can read surface EEG but you cannot precisely stimulate deep structures through the skull. Focused ultrasound may change that constraint.

---

## 8. Recommendations

### For BCI Companies

1. **Publish a security posture document.** Even a minimal threat model is better than silence. The fact that 77% of companies have published nothing is an industry-wide liability.
2. **Engage with CVSS SIG on neural-specific metrics.** CVSS v4.0 cannot score your risk. Participate in extending it before regulators mandate their own framework.
3. **Conduct and publish a third-party security audit** before scaling human implantation. This should be table stakes for any company putting hardware in a human brain.

### For Regulators

1. **FDA should require adversarial threat modeling** as part of BCI premarket submissions. The current safety/efficacy paradigm was designed for passive devices, not bidirectional neural interfaces.
2. **Extend ICS-CERT advisories** to cover BCI-specific vulnerabilities. The 2017 Natus Xltek CVEs were disclosed through ICS-CERT — but nothing has followed in 9 years.

### For Researchers

1. **Test BCI devices adversarially.** The 0% CVE coverage across all neural bands is not evidence of security. It is evidence of the absence of testing.
2. **Cite and extend the TARA.** 109 techniques need independent validation. The Zenodo DOI is [10.5281/zenodo.18640105](https://doi.org/10.5281/zenodo.18640105).

### For Standards Bodies

1. **FIRST.org CVSS SIG:** Consider neural-specific base metrics (biological reversibility, cognitive impact scope, consent violation).
2. **MITRE:** The CWE catalog has no weakness categories for neural-layer exploitation. This is a gap.
3. **IEEE:** The Graz BCI Conference community is positioned to define technical standards before market forces outpace governance.

---

## Methodology

This report is produced by the QIF research initiative. Data is sourced from:

- **BCI Landscape Tracker:** 57 companies, maintained from public filings, press releases, FDA databases, and clinical trial registries
- **TARA v1.7:** 109 techniques catalogued from peer-reviewed literature, recontextualized clinical research, and chain-synthesis analysis
- **NISS v2.1:** Neural impact scoring extending CVSS v4.0, applied to 20 devices based on published specifications
- **CVE-Technique Mapping:** 55 NVD-verified CVEs mapped to TARA techniques across 4 validation rounds (10 AI-hallucinated CVEs caught and excluded)
- **BCI Intel Feed:** 215 items from arXiv, journal RSS, industry news, regulatory filings

**Fact-Check Sources (verified Mar 13, 2026):**
- Merge Labs $252M: [TechCrunch](https://techcrunch.com/2026/01/15/openai-invests-in-sam-altmans-brain-computer-interface-startup-merge-labs/), [Bloomberg](https://www.bloomberg.com/news/articles/2026-01-15/altman-s-merge-raises-252-million-to-link-brains-and-computers), [OpenAI](https://openai.com/index/investing-in-merge-labs/)
- Science Corp $230M / $1.5B valuation: [TechCrunch](https://techcrunch.com/2026/03/05/science-corp-closes-230m-round-as-it-pushes-to-get-its-brain-implant-to-patients/), [BusinessWire](https://www.businesswire.com/news/home/20260305896789/en/)
- Precision 510(k) K242618: [FDA](https://www.accessdata.fda.gov/cdrh_docs/pdf24/K242618.pdf), [GlobeNewsWire](https://www.globenewswire.com/news-release/2025/04/17/3063418/0/en/)
- Neuralink ~$1.3B funding / $9.6B valuation: [Sacra](https://sacra.com/c/neuralink/), [Neuralink](https://neuralink.com/updates/neuralink-raises-650m-series-e/)
- Paradromics first-in-human May 2025: [CNBC](https://www.cnbc.com/2025/06/02/neuralink-paradromics-human-implant.html), [Michigan Medicine](https://www.michiganmedicine.org/news-release/university-michigan-team-leads-first-human-recording-new-wireless-brain-computer-interface)
- Synchron IQT/Series D: [Family Office Hub](https://familyofficehub.io/blog/bezos-family-office-invests-in-synchrons-200m-series-d/), [IQT](https://www.iqt.org/library/iqt-quarterly-recap-spring-2025)
- BrainCo $1.3B valuation: [AInvest](https://www.ainvest.com/news/brainco-seeks-100-million-pre-ipo-funding-1-3-billion-valuation-2508/)

QIF is a proposed research framework. It has not been independently peer-reviewed or adopted by any standards body. NISS scores are research assessments, not manufacturer endorsements. All claims in this report are classified per the QIF evidence classification system (see [epistemic-integrity rules](https://qinnovate.com)).

**AI Disclosure:** This report was written with AI assistance (Claude). All data, metrics, and claims were derived from the QIF datalake and verified by the author. No metrics were fabricated or estimated without source data.

---

**Q2 2026 Report** will be published in July 2026. To track developments between reports, see the [BCI Intel Feed](https://qinnovate.com/dashboards/intel) on qinnovate.com.

**Citation:** Qi, K.L. (2026). Q1 2026 BCI Intelligence Report. Qinnovate. https://qinnovate.com/research/papers/q1-2026-bci-intelligence-report/

**Framework Reference:** Qi, K.L. (2026). Securing Neural Interfaces: Architecture, Threat Taxonomy, and Neural Impact Scoring for Brain-Computer Interfaces. Zenodo. https://doi.org/10.5281/zenodo.18640105
