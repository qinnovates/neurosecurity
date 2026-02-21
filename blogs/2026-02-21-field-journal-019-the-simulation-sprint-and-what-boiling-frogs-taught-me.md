---

title: "Field Journal #019: The Simulation Sprint and What Boiling Frogs Taught Me"
subtitle: "From the QIF Field Journal"
date_posted: "2026-02-21"
source: "https://github.com/qinnovates/qinnovate/blob/main/qif-framework/QIF-FIELD-JOURNAL.md#entry-019"
tags: ["#FieldJournal","#QIF","#BCI","#TARA"]
author: "Kevin Qi"
fact_checked: true
fact_check_date: "2026-02-21"
fact_check_notes:
  - "[advisory] Unsourced numerical claim: \"...rks beautifully for most attacks. Flood the signal,...\""
  - "[advisory] Unsourced numerical claim: \"...econds, we catch it 98% of the time now aft...\""
  - "[advisory] Unsourced numerical claim: \"...actually excited me most was the adversarial sce...\""
  - "[advisory] Unsourced numerical claim: \"...mimicry one was the most satisfying, the attacker tried...\""
  - "[advisory] Unsourced numerical claim: \"...cherry on top. FPR=5%, TPR=100% at thresh...\""
  - "[advisory] Unsourced numerical claim: \"...on top. FPR=5%, TPR=100% at threshold=12 ove...\""
  - "[advisory] Unsourced numerical claim: \"...ion charts. And the most important outcome: I now know...\""
---

**Date:** 2026-02-21 ~04:00
**State:** Just finished a 6-hour sprint building neurowall from v0.4 to v0.7. Wired but clear.
**Mood:** Honest satisfaction, humbled

I just built a 3-layer coherence monitor from scratch in a single session and threw 15 attack scenarios at it. Not theoretical attacks. TARA-mapped attacks with real signal generation, real spectral analysis, real detection logic. And I got my face handed to me by a boiling frog.

Here's what happened: the coherence metric (Cs = e^(-energy)) works beautifully for most attacks. Flood the signal, Cs drops to 0.06. Inject an SSVEP, spectral entropy spikes, Cs drops to 0.28. Even the closed-loop cascade that doubles every 1.5 seconds, we catch it 98% of the time now after hardening the growth detector. But the boiling frog, that ultra-slow DC drift, it's invisible. Not because the detector is bad. Because AC coupling mathematically removes the thing you're trying to detect.

That hit me hard. The very operation that makes spectral analysis clean (removing DC offset and 1/f slope) is the same operation that makes adiabatic attacks invisible. It's a thermodynamic trade-off. You can't have both. You need a reference electrode to provide ground truth DC, which means you need hardware, not software, to close this gap.

The phase replay was the other honest zero. A perfect statistical clone of the original signal. Same phase variance, same spectral entropy, same everything. No unsupervised detector can tell the difference because there is no difference. You need challenge-response, biological TLS, to break that symmetry. That's Phase 2 territory.

But the thing that actually excited me most was the adversarial scenarios in v0.7. I gave the attacker full knowledge of the defense architecture. Notch filter frequencies, CUSUM parameters, z-score thresholds, everything. Four out of five adversarial attacks still got caught. The spectral mimicry one was the most satisfying, the attacker tried to match the spectral profile with broadband noise, but increasing total power shifts phase variance in ways you can't avoid. That's a thermodynamic constraint. You can't add energy without leaving a trace.

I also pulled neurosim out as a standalone tool. It generates realistic multi-band EEG (delta, theta, alpha, beta, gamma) with configurable attack injection. Anyone can run it, test their own detectors against the same attack battery. That feels right for open science.

The ROC analysis was the cherry on top. FPR=5%, TPR=100% at threshold=12 over 20 seconds. Time is the ultimate detector. Even the attacks that are statistically indistinguishable in a single window accumulate detectable differences over 20 seconds. That's 7/9 to 9/9 just by being patient. Made me think about how real-time BCI security probably needs a 20-second sliding window minimum for any serious anomaly detection.

10 engineering entries in the neurowall derivation log. 6 visualization charts. And the most important outcome: I now know exactly what I can and can't detect, and why.

**Observation:** The gap between "theoretically detectable" and "practically detectable" is determined by your signal processing choices. AC coupling is a design choice that creates a blind spot. That's not a bug, it's a physics constraint that needs hardware to resolve.

**Attempt to explain:** Every signal processing pipeline makes assumptions about what matters. AC coupling assumes DC drift is noise. When an attacker uses DC drift as the attack vector, the assumption becomes the vulnerability. This is probably a general principle: your signal processing assumptions define your blind spots.

**Connected to:** BCI Limits Equation (Entry 016/017), Entry 018 (building the moat), TARA (QIF-T0026, T0066, T0067), Neurowall Derivation Log Entries 001-010

---

*This entry is part of the [QIF Field Journal](https://github.com/qinnovates/qinnovate/blob/main/qif-framework/QIF-FIELD-JOURNAL.md), a living, append-only research journal documenting first-person observations at the intersection of neurosecurity, BCI engineering, and neurorights. The journal exists because neural privacy is a right, not a feature. Tools like [macshield](https://github.com/qinnovates/macshield) protect digital identity on networks; this research works toward protecting cognitive identity at the neural interface.*

[Read this entry in context](https://github.com/qinnovates/qinnovate/blob/main/qif-framework/QIF-FIELD-JOURNAL.md#entry-019)
