---
title: "Your Brain Has Rights. We Counted Them."
subtitle: "How mapping 102 attack techniques to neurorights confirmed four established rights and extended two with engineering depth"
date_posted: "2026-02-16"
source: "https://qinnovate.com"
tags: ["#Neurorights", "#TARA", "#QIF", "#BCI", "#Neuroethics", "#ConsentComplexity", "#IencaAndorno"]
---

## TL;DR

We mapped all 102 TARA techniques to 4 neurorights from Ienca & Andorno (2017) and built a Consent Complexity Index. QIF extends two of those rights with engineering-level depth: Mental Integrity (with signal dynamics protections) and Mental Privacy (with data-lifecycle protections). QIF also maps these neurorights onto the CIA triad (MP = Confidentiality, MI = Integrity) and provides the first concrete exploit chain (LSL CVE) demonstrating both violations. Three findings you should care about: (1) Four "silicon-only" attacks that supposedly don't touch biology have NISS scores above 6.0 but require only standard consent. (2) Techniques that cause permanent personality changes are classified as "enhanced" consent, not IRB. (3) Two techniques labeled "indirect risk" have NISS scores of 8.1.

---

## The Neurorights Gap

In 2017, Marcello Ienca and Roberto Andorno proposed four neurorights: Mental Privacy, Cognitive Liberty, Mental Integrity, and Psychological Continuity. Chile enshrined them in law. The OECD endorsed them. The literature cited them.

Nobody tested them against actual threats.

We have 102 threats. We tested them.

## What We Did

Every technique in the [TARA registry](https://qinnovate.com/TARA) now has a `neurorights` field mapping it to the affected rights. The mapping is systematic, not editorial:

1. **UI category** provides the primary signal — signal injection violates Mental Integrity + Cognitive Liberty; exfiltration violates Mental Privacy; persona attacks violate Mental Integrity.
2. **DSM-5-TR cluster** adds overlays — persistent_personality techniques always get Psychological Continuity; cognitive/psychotic clusters add Mental Integrity.
3. **NISS vector components** refine the mapping — high brain impact (BI:H) maps to Mental Integrity; high cognitive impact (CG:H) maps to Cognitive Liberty + Mental Integrity.
4. **Cross-modal data fusion** triggers data-lifecycle protections under Mental Privacy (extended).
5. **Signal dynamics disruption** triggers dynamical integrity protections under Mental Integrity (extended).

## Four Rights, Not Seven

The Ienca-Andorno framework gives us four neurorights: Mental Privacy, Cognitive Liberty, Mental Integrity, and Psychological Continuity. After mapping 102 attack techniques, we initially proposed three additional rights (CA, DI, IDA). After cross-validating against six established frameworks (Ienca & Andorno 2017, Yuste/NRF 2017, Chile 2021, UNESCO 2025, Farahany 2023, Bublitz 2022), we restructured:

- **Dynamical Integrity (DI)** is an engineering specification of **Mental Integrity** — folded in.
- **Informational Disassociation (IDA)** is the data-lifecycle extension of **Mental Privacy** — folded in.
- **Cognitive Authenticity (CA)** was initially kept as a QIF original, but on further review, Ienca & Andorno's **Mental Integrity** already covers protection from unauthorized modification of neural function. The read/write distinction we described (MP = reading, CA = writing) maps directly to their existing MP and MI. We were renaming, not discovering. CA is now folded into MI.

This is the academically honest conclusion. Ienca & Andorno got the top-level rights right. QIF's contribution is engineering-level depth on two existing rights, the CIA-triad mapping, and concrete demonstration via the LSL CVE.

### The Read/Write Distinction: MP vs MI

Ienca & Andorno (2017) already drew this line:

- **Mental Privacy (MP)** = don't **read** my neural data without consent (confidentiality, exfiltration, re-identification)
- **Mental Integrity (MI)** = don't **write** into or alter my neural signals without consent (integrity, injection, agency confusion)

QIF's contribution is mapping this to the CIA triad: MP = Confidentiality, MI = Integrity. The LSL CVE demonstrates both in a single exploit chain: Phase 2 (exfiltrate neural data) = MP violation, Phase 3 (inject false signals) = MI violation.

### What QIF Adds to Mental Integrity

Some attacks don't break your brain. They *retune* it.

Gradual drift (T0062) shifts neural parameters slowly enough that your brain's homeostatic mechanisms adapt to the new baseline. Neurofeedback falsification (T0022) trains your brain to reinforce pathological patterns it thinks are healthy. Baseline adaptation poisoning (T0071) exploits re-enrollment windows to shift what "normal" looks like.

These are violations of Mental Integrity, but the original formulation doesn't capture the engineering specifics. QIF extends MI with signal dynamics protections: detecting oscillatory disruption, timing attacks, and homeostatic retuning. 81 of 102 techniques now map to MI (up from 71 when we tracked dynamics separately).

### What QIF Adds to Mental Privacy

T0096 is a multi-modal biometric fusion attack. It correlates your neural data with your gait, your voice, your face, your typing rhythm. Each stream alone is a privacy concern. Fused, they create an identity signature that can't be anonymized.

QIF extends MP with data-lifecycle protections: you can consent to sharing your EEG without consenting to having it correlated with your keystroke dynamics. Cross-modal re-linking without explicit per-modality consent is a privacy violation — and falls naturally under Mental Privacy's scope.

## The Consent Complexity Index

Mapping rights is step one. The harder question: **is the consent process adequate for the rights being violated?**

We built the Consent Complexity Index (CCI):

```
CCI = (consent_weight x rights_count x severity_factor) / 10
```

- `consent_weight`: prohibited=4, IRB=3, enhanced=2, standard=1
- `rights_count`: how many neurorights are affected
- `severity_factor`: critical=1.5, high=1.2, medium=1.0, low=0.8

CCI ranges from 0.1 (minimal complexity — low severity, one right, standard consent) to 4.0 (maximum — critical severity, multiple rights, prohibited tier).

Across 102 techniques: **mean CCI = 1.01, 11 techniques exceed 2.0**.

But the CCI's real value isn't the number itself. It's what happens when the number doesn't match the consent tier.

## Three Anomalies the Numbers Surfaced

### 1. The PINS Inversion

Four silicon-only attacks — T0016 (Professor X backdoor), T0017 (transfer learning backdoor), T0024 (training data poisoning), T0046 (OTA firmware weaponization) — have something in common:

- **Dual-use classification:** silicon_only (no biological analog)
- **Consent tier:** standard (lowest)
- **NISS score:** 6.4–7.1 (medium-high neural impact)
- **CCI:** 0.4–0.6 (low)

The consent system treats them as low-complexity because they're "just software." The NISS score says their neural impact is comparable to techniques requiring enhanced or IRB consent. T0046 (OTA firmware weaponization) has a NISS of 7.1 — meaning a firmware update to your BCI could alter neural function at a level that would require IRB review if done through a biological mechanism, but because it arrives via WiFi, it gets a checkbox on page 47 of the terms of service.

The CCI deliberately surfaces this mismatch. A low CCI with a high NISS is a signal that the consent infrastructure has a blind spot.

### 2. The Persistent Personality Problem

Four techniques in the persistent_personality DSM-5 cluster — T0022 (neurofeedback falsification), T0059 (pattern lock), T0062 (gradual drift), T0071 (baseline adaptation poisoning) — all have:

- **Consent tier:** enhanced (second tier, not IRB)
- **NISS score:** 7.4–8.1 (high neural impact)
- **DSM-5 cluster:** persistent_personality
- **Affected neurorights:** 4–5 per technique

These techniques can cause **permanent personality changes**. T0022, neurofeedback falsification, has a NISS of 8.1 and maps to 4 neurorights — yet it requires only "enhanced" consent, not IRB review.

Enhanced consent means a more detailed form and a verbal explanation. IRB consent means an ethics board reviews the risk to human subjects. The difference between them is the difference between a warning label and a review board. For techniques that can permanently alter personality, the gap is indefensible.

### 3. The "Indirect" Fiction

T0055 (BCI cognitive warfare) and T0065 (algorithmic psychosis induction) are classified as risk_class="indirect" in the DSM-5 mapping. The label suggests they don't directly cause psychiatric harm.

Their NISS scores are both 8.1. That's higher than any "direct" risk technique except T0022.

The word "indirect" in a regulatory context implies a lower standard of scrutiny. But there is nothing indirect about algorithmic psychosis induction at NISS 8.1. The label was applied because the *mechanism* is indirect (via recommendation algorithms, not electrode stimulation). The *impact* is direct and severe.

This is not a classification bug — it's a category error. Risk classification systems that assess mechanism rather than impact will systematically under-regulate the most dangerous emerging threats, because emerging threats tend to operate through novel (i.e., indirect) mechanisms.

## The Neurorights Hourglass

Mapping all 102 techniques produces a striking pattern when visualized against the QIF hourglass:

| Band | Mental Privacy | Cognitive Liberty | Mental Integrity | Psychological Continuity |
|------|:---:|:---:|:---:|:---:|
| S3 (ambient) | ++ | | | |
| S2 (wearable) | ++ | | + | |
| S1 (proximity) | ++ | | + | |
| I0 (interface) | + | + | ++ | |
| N1 (spinal) | | + | ++ | |
| N2 (brainstem) | | + | ++ | + |
| N3 (cerebellum) | | + | ++ | + |
| N4 (thalamus) | | ++ | ++ | + |
| N5 (basal ganglia) | | ++ | ++ | ++ |
| N6 (limbic) | | ++ | ++ | ++ |
| N7 (neocortex) | | ++ | ++ | ++ |

The pattern inverts. **Mental Privacy dominates the outer bands (S-domain). Mental Integrity spans the entire neural column, from interface through neocortex (absorbing both the dynamics previously tracked as DI and the write-protection previously tracked as CA). Psychological Continuity dominates the inner bands (N5-N7).**

This isn't a coincidence. It's the hourglass architecture expressing itself through neurorights. The outer bands are about data (privacy). The inner bands are about identity (continuity). Mental Integrity bridges both, protecting the signal pathway from interface to cortex.

## What This Means

Three implications:

**For regulators:** Consent tier classifications need a mechanism-vs-impact audit. The CCI can flag mismatches automatically. Every technique where CCI < 1.0 but NISS > 6.0 deserves a second look.

**For the neurorights literature:** Ienca & Andorno's four rights are well-chosen but need engineering-level depth. MI must account for dynamical retuning and signal injection (the "write" side of the CIA triad). MP must account for data-lifecycle threats. QIF provides that engineering depth and maps the neurorights onto the CIA triad, with concrete demonstration via the LSL CVE.

**For BCI developers:** Your consent forms are calibrated to mechanism, not impact. The PINS inversion shows that "silicon-only" is not a proxy for "low risk." If your firmware update pipeline can deliver NISS 7.1 impacts, your consent process should reflect that — regardless of whether the attack vector is biological or digital.

---

## Data & Methods

All 102 technique mappings are in the [TARA registry](https://qinnovate.com/TARA) with full neurorights and CCI data. The enrichment script is at `scripts/enrich-neurorights.py`. The mapping was cross-validated with Gemini 2.5 Pro, which independently confirmed the gap analysis. The full validation session is logged in `governance/TRANSPARENCY.md`.

**Neurorights taxonomy:** Ienca & Andorno (2017) — MP, CL, MI, PC. QIF Framework — MI (extended with signal dynamics + write-protection, mapped to CIA Integrity), MP (extended with data lifecycle, mapped to CIA Confidentiality).

**NISS:** Neural Impact Scoring System v1.0. Vector format: `NISS:1.0/BI:_/CG:_/CV:_/RV:_/NP:_`. See the [whitepaper](https://doi.org/10.5281/zenodo.18640105) for methodology.

*Cross-AI validated: Claude Opus 4.6 (analysis, implementation) + Gemini 2.5 Pro (validation, additional correlations). Human decision: Kevin Qi.*
