---
title: "We Found Our Own False Claim, and the Audit That Missed It"
subtitle: "A standards body never endorsed NISS. Our timeline said it did. Here is how that happened, what we fixed, and what is still wrong."
date_posted: "2026-10-16"
source: "https://github.com/qinnovates/neurosecurity/blob/main/osi-of-mind/QIF-DERIVATION-LOG.md#entry-107-endorsement-claim-and-stale-fix-list"
tags: ["#Neurosecurity", "#Transparency", "#ThreatModeling", "#NISS", "#TARA"]
author: "Kevin Qi"
fact_checked: false
---

If you are evaluating this project — as an investor, as someone deciding whether to build a threat model on TARA, or as a reviewer — the most useful thing we can show you is not a feature. It is what happens when we find out we published something untrue.

Today we found a claim on our own public timeline stating that a standards body had accepted NISS, our proposed scoring extension for neural interfaces. That never happened. This post is the full account: the claim, why it was wrong, how long it was live, what else the same investigation turned up, and the three things that are still broken as of this writing.

## The claim

A milestone dated 2026-02-27 in our public timeline data said the CVSS Special Interest Group had "offered inclusion in the official CVSS Resources repository," and called it the **"First external standards body recognition of the framework."** It served from our public API.

What actually happened is narrower and, we think, better. We were invited to contribute NISS to that repository, and we declined — for now. Our own whitepapers have said so in plain terms since v8:

> The author declined — temporarily. NISS is currently a single-author derivation. The mathematical model has not been independently reviewed, replicated, or stress-tested by another researcher. Contributing it to a standards resource repository before that independent validation would be premature and would risk lending unearned authority to unvalidated math.

So the published claim traded a position of restraint for an endorsement we do not have. The milestone now says invited and deferred, and states explicitly that an invitation is not a review, an endorsement, or adoption by any standards body.

Two things made the claim wrong beyond its factual error. It was a **standards claim** and a **priority claim without evidence** — two of the six neuromodesty checks this project holds itself to. Those checks exist precisely to catch this, and they did not, because nobody re-ran them over previously published data.

## How long it was live, and why nobody caught it

This is the part worth your attention.

The error was caught in July 2026. An internal pre-outreach review graded it **BLOCKING** and false, and a commit that same day fixed it in the README, in our MITRE outreach document, and in a changelog post.

It missed two places: the timeline data, and a stale pre-built HTML page still being served for one URL. Those two survived for about eleven weeks.

Worse, the audit document itself became a source of error. It was **added by the same commit that fixed the things it describes**, and never updated afterward. So it has sat in the repository since July describing a set of defects, most of which were fixed minutes later. Today it reported two already-fixed bugs as live and BLOCKING, and we planned work against them before verifying.

That is the real lesson, and it is not about neurotechnology:

> A fix list that is not updated when its items are fixed stops being an audit and becomes a generator of false alarms. The fix and the record of the fix belong in the same commit.

All twelve items in that list have now been reverified line by line against the current code, and each carries its status inline. Any item without a verification note is now explicitly marked as unverified.

## What the reverification found

| Outcome | Count |
|---|---|
| Resolved | 8 |
| Still live | 2 |
| Partially fixed, now self-contradictory | 1 |
| Fixed, but exposed a new defect of the same kind | 1 |

The three that are not clean are below. We would rather you read them from us than find them yourself.

**Our academic paper now states two different numbers for the same statistic.** A figure describing how many TARA techniques need scoring dimensions that CVSS cannot express was corrected in the abstract to 59.4%. The body of the paper was not updated and still says 99.1% in four places, including a table and a figure caption. And the corrected figure is itself out of date: recomputed from the live registry today, it is 59.5% of 173 techniques. Patching one number in an abstract turned a uniformly stale statistic into an internal contradiction, which is worse than leaving it alone.

**Five different technique counts exist across our artifacts.** The registry and README say 173. The paper's abstract says 165 in one paragraph and 109 in another — in the same file. The body says 109. A proof-of-concept repository says 99. The structural problem is that the number is hand-copied rather than derived once, so every artifact drifts independently.

**Most of the registry still carries speculative framing.** 147 of 173 techniques (85%) include a "quantum" characterization. That is a framing decision we have not resolved rather than a bug, but if you are assessing the registry's rigor you should know the proportion.

Until the first two are settled, **no technique count or gap percentage from our paper should be quoted**, including by us.

Every figure in this section is derived from one public file, [`datalake/qtara-registrar.json`](https://github.com/qinnovates/neurosecurity/blob/main/datalake/qtara-registrar.json), and you can recompute them:

- 173 techniques — length of the `techniques` array.
- 103 with CVSS, and 129 / 10 / 34 scoring states — count of a non-empty `cvss` field, and `statistics.by_scoring_state`.
- 59.5% — `statistics.niss_cvss_mapping.by_gap_group` sums to 103 (14 + 30 + 59), over 173.
- 85% quantum framing — count of a non-empty `quantum` field: 147 of 173.

## What we fixed today

**A differential-privacy accounting error in Neurowall.** Our firewall prototype tracks a cumulative privacy budget. The underlying composition bug was fixed in July, but something narrower remained: there are two valid ways to account for the privacy cost of repeated queries, and neither is always tighter. The zCDP route wins over long sessions; the plain sum wins at low query counts. We were reporting only the zCDP figure, which overstated the privacy cost of a short session by roughly five times.

| At ε = 0.1, δ = 1e-6 | Plain sum | zCDP | Guaranteed |
|---|---|---|---|
| 1 query | **0.10** | 0.53 | 0.10 |
| 1,000 queries | 100.0 | **21.6** | 21.6 |

Both bounds are sound, so the guarantee is whichever is smaller. The code now reports that, and eight regression tests pin the relationship — each of which fails under either of the original bugs. Neither original bug was caught by a test, which is why both survived to a manual line-by-line read. That is now fixed at the cause, not just the symptom.

One caveat we are stating rather than burying: this accounting is correct for sequential composition of independent queries, and our simulator applies the mechanism per sample at 250 Hz. Whether those are genuinely independent releases, or repeated queries against a correlated signal that would need different accounting, is **not yet established**. No epsilon figure from this pipeline should appear in a paper until it is.

**A publishing workflow that could ship on a data edit.** Our Python package published on pushes that touched registry data, with no check on the version. In practice an existing version uploaded nothing, so no bad release occurred — we verified that before changing anything, and corrected our own initial overstatement of the risk. But publishing should be a deliberate release decision, not a side effect of editing a JSON file. It is now gated on the version being absent from the index.

**A citation with real identifiers and wrong metadata.** One entry in our research catalogue carried a title and a single author against a DOI that resolves to a different paper with fourteen authors. A valid DOI grafted onto incorrect metadata passes every superficial check, which is the exact failure our citation protocol was written for after an early preprint shipped three fabricated references. It is corrected, with a note recording what it previously said.

## What we added: naming the standard we fall short of

We also documented something we do not have.

The NIH BRAIN Initiative runs a neuroethics programme whose stated position is that neuroethics should run *alongside* the development of neurotechnology rather than being applied as review afterward. It implements that through four standing activities: an expert Neuroethics Working Group that advises the programme, funded neuroethics research, periodic scanning of the funded portfolio to surface ethical questions, and workshops on topics that steer the programme's direction.

QIF has none of the four. No advisory group, no funding, no portfolio, no workshops. The ethical guardrails this framework operates under are self-imposed, and that is the weakness — not a feature.

That comparison is now in our README, in Section 27.7 of the whitepaper, and in our governance documentation, in each case as a gap statement with an explicit note that the NIH, the BRAIN Initiative and its Neuroethics Working Group have not reviewed, endorsed, funded, or had any connection to this work. Given that this post opens with a false endorsement claim, the point bears repeating: citing someone's published approach is not a relationship with them.

## Why we are publishing this

Two reasons, and neither is modesty.

The first is that these claims are machine-checkable. Our registry, our scoring data and our threat taxonomy are served from public, unauthenticated endpoints: [`/api/stix.json`](https://qinnovate.com/api/stix.json), [`/api/tara.json`](https://qinnovate.com/api/tara.json), [`/api/qif.json`](https://qinnovate.com/api/qif.json). Anyone evaluating us can recompute every number in this post and catch us if we are wrong. A project built that way does not get to choose whether its errors are discoverable — only whether it is the one who reports them.

The second is that this is the behaviour you are actually assessing. Threat modeling is a claim-making discipline. A severity score, a technique classification, a privacy budget — each is an assertion that something is or is not dangerous, and people make decisions on them. A framework that cannot find and retract its own false claims has no business producing claims about anything else, and the only evidence that it can is a track record of doing it in public.

So: this project is **early-stage, unvalidated research**. QIF, TARA, NISS, NSP and Neurowall are proposed frameworks and prototypes. None has been peer reviewed, independently replicated, or adopted by any standards body. No ethicist or review board has examined the scoring method, the rights labels, or the consent levels. The validation numbers we do have are self-refereed on synthetic data, and we say so in the documents that report them.

What we can show is the full derivation trail. Every decision, including this one, including the reversals, is in the [derivation log](https://github.com/qinnovates/neurosecurity/blob/main/osi-of-mind/QIF-DERIVATION-LOG.md) — 113 entries, in public, with the errors left in.

## If you are evaluating the threat taxonomy

What exists today and can be checked right now:

- **[TARA](https://qinnovate.com/atlas/tara/)** — 173 technique pairs. 103 carry CVSS v4.0 base vectors; 129 carry a proposed NISS score, 10 carry a provisional range, and 34 are unscored. Those are the real numbers, and the README states them in that form rather than implying full coverage.
- **[NISS](https://qinnovate.com/atlas/scoring/)** — the proposed six-metric extension, with the method and its limits written out.
- **[The explorer](https://qinnovate.com/atlas/explorer/)** and **[impact chains](https://qinnovate.com/atlas/chains/)** — how techniques connect to anatomy and to clinical category references. Those references are for threat modeling; they are not diagnostic claims.
- **[Governance](https://qinnovate.com/governance/)** — the regulatory gap analysis, the neuroethics alignment, and now the account of what institutional oversight this project lacks.

A 3D brain atlas tied to this data is built but not yet merged, so it is not live. We are not going to link you to something you cannot open.

The honest summary: the taxonomy is the most complete public catalogue of BCI threat techniques we are aware of, and it is also unvalidated, partly unscored, and authored by one person. Both halves of that sentence are load-bearing.

---

*Corrections to this post, or to anything linked from it, are welcome as [issues](https://github.com/qinnovates/neurosecurity/issues). If you recompute one of these numbers and get something different, we want to know.*

*Written with AI assistance (Claude Opus 5). All claims verified by the author. Every figure in this post was recomputed from the live registry during the session it describes; the full account, including the two reversals, is [Entry 107](https://github.com/qinnovates/neurosecurity/blob/main/osi-of-mind/QIF-DERIVATION-LOG.md#entry-107-endorsement-claim-and-stale-fix-list) of the derivation log. Human-originated: the decision to publish, the scope, and the choice to disclose the unresolved items.*
