---

title: "Field Journal #020: The Day Everything Became One Page"
subtitle: "From the QIF Field Journal"
date_posted: "2026-02-21"
source: "https://github.com/qinnovates/qinnovate/blob/main/qif-framework/QIF-FIELD-JOURNAL.md#entry-020"
tags: ["#FieldJournal","#QIF","#BCI","#TARA","#Neurorights"]
author: "Kevin Qi"
fact_checked: true
fact_check_date: "2026-02-21"
fact_check_notes:
  - "[advisory] Unsourced numerical claim: \"...built: 103 threats, 24 devices, 38 brain regions,...\""
  - "[advisory] Unsourced numerical claim: \"...c attacks detected, 0% false positive rate...\""
  - "[advisory] Unsourced numerical claim: \"...ve rate. That's the first time Neurowall touched r...\""
  - "[advisory] Unsourced numerical claim: \"...data to work with, 24 devices each with specs, br...\""
  - "[advisory] Unsourced numerical claim: \"...hecked the git log. First commit on this repo was Fe...\""
---

**Date:** 2026-02-21 ~09:30
**State:** End of a marathon day. Started at 3am, still going. Looking at what got built.
**Mood:** Disbelief, honestly

I didn't plan to do all of this today. I sat down to build one page for the BCI Limits Equation and ended up restructuring how the entire project presents itself.

It started with the limits equation page. 13 physics constraints, each one a card with the equation and what it means in plain English. That was the plan. But once it existed, I looked at the BCI Explorer sitting on its own page, the guardrails doc on GitHub, the TARA API on one endpoint, the BCI devices on another, and I thought: why is all of this scattered? It's the same research. It should be one place.

So I built the BCI Research Hub. Four sub-pages under /bci/: the device explorer (moved), the limits equation (new), security guardrails (new, pulls from the GitHub doc at build time), and API documentation (new). It's not all one page yet, but it's coming together. The hub ties it all under one roof and the pieces are starting to talk to each other. Then I combined the TARA API and BCI API into one unified endpoint at /api/qif.json. One GET request, everything we've built: 103 threats, 24 devices, 38 brain regions, 13 physics constraints, all the scoring specs, all cross-referenced by QIF band IDs. 580 KB. No auth. CORS open.

Then I built the project timeline. 31 milestones from January 15 to today. Every major release, discovery, validation, and milestone. It feeds into the API too so anyone pulling the data can see the history.

But that wasn't even the first thing today. Before the BCI hub, I built a validation dashboard that tracks every cross-AI validation session, every citation check, every fact verification. Added status badges to every TARA technique page. Then I realized half my repo had no READMEs or tables of contents, so I wrote 11 of them. Then I mapped every framework, tool, and governance doc to the 5 neurorights (Ienca & Andorno 2017, Yuste et al. 2017) in the root README.

Oh, and the repo consolidation. 17+ top-level directories down to 8. Autodidactive stuff removed, governance merged, archives cleaned up. The structure finally makes sense when someone lands on the GitHub.

The BrainFlow validation was this morning too. Real EEG hardware (OpenBCI Cyton via BrainFlow), 5 out of 5 synthetic attacks detected, 0% false positive rate. That's the first time Neurowall touched real hardware instead of synthetic signals. It worked. The coherence monitor doesn't care whether the signal comes from numpy or an actual electrode.

The Neurowall simulation sprint was earlier, v0.4 through v0.7. Multi-band EEG generator, auto-calibrating coherence weights, CUSUM change detection, spectral peak detector, ROC analysis. Started at 5/9 attacks detected, ended at 7/9 at 15 seconds, 9/9 at 30 seconds. The neurosim attack toolkit came out of that too, 14 standalone attack generators organized by QIF-T ID.

I keep looking at this list and it doesn't feel like one day. But the commits are all timestamped today. I think what happened is each thing unlocked the next thing. The limits equation needed a page, the page needed a hub, the hub needed an API, the API needed documentation, the documentation needed a timeline, and suddenly it's 9:30 at night and I've touched 60+ files across 30+ commits.

The BCI Device Explorer is live but it's going to keep evolving. There's a lot of data to work with, 24 devices each with specs, brain region mappings, threat surfaces, physics constraints, FDA status. I'm still trying to figure out the best way to present all of it without overwhelming people. Right now it's filterable cards, but the cross-references between devices, regions, and threats need a better visualization. That's next.

The thing that surprises me about my own thinking: I didn't plan any of this as a sequence. Each piece just felt like the obvious next step once the previous one existed. It's like the project has its own gravity now, pulling everything toward consolidation. I just checked the git log. First commit on this repo was February 1. That's three weeks ago. THREE WEEKS. I thought it was six. I was wrong by double. Three weeks ago this was a 14-layer OSI knockoff with no data. Now it's a searchable research platform with a unified API, validated physics, and real hardware results. I don't even know what to do with that information.

**Connected to:** Entry 019 (Neurowall sprint), Entry 018 (building the moat), Entry 017 (BCI limits synthesis), Entry 013 (BCI Explorer origin)

---

*This entry is part of the [QIF Field Journal](https://github.com/qinnovates/qinnovate/blob/main/qif-framework/QIF-FIELD-JOURNAL.md), a living, append-only research journal documenting first-person observations at the intersection of neurosecurity, BCI engineering, and neurorights. The journal exists because neural privacy is a right, not a feature. Tools like [macshield](https://github.com/qinnovates/macshield) protect digital identity on networks; this research works toward protecting cognitive identity at the neural interface.*

[Read this entry in context](https://github.com/qinnovates/qinnovate/blob/main/qif-framework/QIF-FIELD-JOURNAL.md#entry-020)
