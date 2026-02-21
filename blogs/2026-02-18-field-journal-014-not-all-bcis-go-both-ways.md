---

title: "Field Journal #014: Not All BCIs Go Both Ways"
subtitle: "From the QIF Field Journal"
date_posted: "2026-02-18"
source: "https://github.com/qinnovates/qinnovate/blob/main/qif-framework/QIF-FIELD-JOURNAL.md#entry-014"
tags: ["#FieldJournal","#QIF","#BCI"]
author: "Kevin Qi"
fact_checked: true
fact_check_date: "2026-02-21"
fact_check_notes:
  - "[advisory] Unsourced numerical claim: \"...(Part 1)  I assumed most BCIs were unidirectional...\""
  - "[advisory] Unsourced numerical claim: \"...le property. A read-only device has a fundamentally...\""
  - "[advisory] Unsourced numerical claim: \"...rough a device that only records.  **Connected to:**...\""
  - "[advisory] Unsourced numerical claim: \"...pth; a shallow read-only device may be less risky t...\""
---

**Date:** 2026-02-18
**Source:** Conversation with Claude about BCI directionality
**Derivation details:** [Entry 60 — BCI Limits Equation Synthesis](QIF-DERIVATION-LOG.md#entry-60-bci-limits-equation-synthesis) (Part 1)

I assumed most BCIs were unidirectional — either read or write. Turns out that's mostly true, but the exceptions matter a lot for security.

**Read-only (recording):**
- BrainGate (Utah array) — motor cortex decoding
- Emotiv, OpenBCI, Muse — consumer EEG
- Stentrode (Synchron) — endovascular recording

**Write-only (stimulation):**
- Cochlear implants — auditory nerve stimulation
- Traditional DBS leads (older Medtronic models) — stimulate only

**Bidirectional (read + write):**
- Medtronic Percept RC — DBS stimulation + BrainSense LFP recording
- NeuroPace RNS — detects seizure onset, then delivers responsive stimulation (closed-loop)
- Neuralink N1 — designed for both recording and stimulation, current trials focus on recording

The bidirectional ones are the scariest from a security perspective because they have the full attack surface — an adversary could potentially read AND write. NeuroPace is especially interesting because it's already running a closed-loop algorithm autonomously inside the patient's skull: detect pattern, inject signal. That's the exact pipeline QIF's threat model covers.

This matters for the BCI Explorer (Entry 013) — directionality should be a visible property. A read-only device has a fundamentally different threat profile than a bidirectional one. You can't inject signals through a device that only records.

**Connected to:**
- Entry 013 — BCI Explorer needs to show directionality per device
- I0 Depth (QIF-TRUTH.md) — directionality is orthogonal to depth; a shallow read-only device may be less risky than a deep bidirectional one

---

*This entry is part of the [QIF Field Journal](https://github.com/qinnovates/qinnovate/blob/main/qif-framework/QIF-FIELD-JOURNAL.md), a living, append-only research journal documenting first-person observations at the intersection of neurosecurity, BCI engineering, and neurorights. The journal exists because neural privacy is a right, not a feature. Tools like [macshield](https://github.com/qinnovates/macshield) protect digital identity on networks; this research works toward protecting cognitive identity at the neural interface.*

[Read this entry in context](https://github.com/qinnovates/qinnovate/blob/main/qif-framework/QIF-FIELD-JOURNAL.md#entry-014)
