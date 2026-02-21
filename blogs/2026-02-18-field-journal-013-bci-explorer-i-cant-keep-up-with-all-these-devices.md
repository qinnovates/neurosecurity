---

title: "Field Journal #013: BCI Explorer — I Can't Keep Up With All These Devices"
subtitle: "From the QIF Field Journal"
date_posted: "2026-02-18"
source: "https://github.com/qinnovates/qinnovate/blob/main/qif-framework/QIF-FIELD-JOURNAL.md#entry-013"
tags: ["#FieldJournal","#QIF","#TARA","#Hourglass","#BCI"]
author: "Kevin Qi"
fact_checked: true
fact_check_date: "2026-02-21"
fact_check_notes: []
---

**Date:** 2026-02-18
**Trigger:** Realizing there's way too many different types of BCIs for me to keep up with by name

I think I need to create a shared BCI layer explorer for people who are curious how different BCIs interact with the brain, and at what layer of the QIF model. This helps explain visually as there's way too many different types of BCIs for me to keep up with by name. Hopefully this will help others learning this space.

The existing hourglass at qinnovate.com/lab/hourglass.html is the starting point. Call it **BCI Explorer**. On top, tell people they can select BCIs and explore all parts of it.

Two views:

**View 1 — Layer Explorer.** For people who want to explore by QIF bands. Incorporate:
- What signals look like at each stage (spikes, LFPs, EEG)
- What can go wrong at each stage (TARA already maps this)
- What's measurable vs what's hidden (Three Floors already captures this)

**View 2 — Brain Visualization.** Using the new 3D brain, where selecting the BCI or clicking on a brain region shows which devices connect there. Needs to clearly show whether we're looking at a "security" or "therapeutic" view (the dual-use toggle).

The layer explorer I created before already compiled all BCIs to date and shows which layer, but I need to make this more intuitive. This will be a good start. I can add to it later when appropriate.

**Connected to:**
- Entry 012 — the I0 depth realization that implant location matters for security
- Entry 54 (derivation log) — TARA dual-use toggle (security vs therapeutic view)
- The hourglass is the QIF model — this just makes it interactive and device-aware

---

*This entry is part of the [QIF Field Journal](https://github.com/qinnovates/qinnovate/blob/main/qif-framework/QIF-FIELD-JOURNAL.md), a living, append-only research journal documenting first-person observations at the intersection of neurosecurity, BCI engineering, and neurorights. The journal exists because neural privacy is a right, not a feature. Tools like [macshield](https://github.com/qinnovates/macshield) protect digital identity on networks; this research works toward protecting cognitive identity at the neural interface.*

[Read this entry in context](https://github.com/qinnovates/qinnovate/blob/main/qif-framework/QIF-FIELD-JOURNAL.md#entry-013)
