# Gap analysis: "Neurotech in California" newsletter lead list (2026-10-17)

## Trigger

A Substack post ([The Neurotech Newsletter, "Neurotech in California"](https://theneurotechnewsletter.substack.com/p/neurotech-in-california), author Chay Carter / Carter Sciences) named 14 companies in its free (non-paywalled) text and displayed a market-map diagram crediting "Carter Sciences Neurotech Market Map," footer-noted as "120 companies tracked." Kevin asked whether `datalake/bci-landscape.json` already covers the named companies, and to ingest what's missing.

**This session could not independently fetch either the newsletter post or cartersciences.com** — outbound requests to both hosts were rejected by this session's egress policy (`connect_rejected`, confirmed via direct `curl` through the configured proxy, not a transient failure). The 14-name list and the "120 companies" / regional-breakdown figures are therefore carried over from a *different* chat session's report of those pages, not verified firsthand here. Accordingly:
- Every company name was independently re-verified against separate, reachable secondary sources before being staged (see `sources.json`).
- The 120-company aggregate and its regional/technology breakdown are **held, not published** as data (ledger item `market-delta-072`), consistent with `datalake/intake/CONTEXT.md`'s rule that unverified items must not be cited.

## Diff against existing coverage

`datalake/bci-landscape.json` held 67 companies before this batch. Of the 14 names in the newsletter's free text:

| Already covered | Gap (not in dataset) |
|---|---|
| Neuralink, Merge Labs, Science Corporation, Cognixion, Subsense, Pixium Vision | Nudge, Echo Neurotechnologies, Epia Neuro, Kandu/Neurolutions, Coherence Neuro, iota Biosciences, Otherside Health, BRILL Neurotech, Forecast Bio |

9 gaps. Each was independently verified via at least one secondary source unconnected to the newsletter (full citations in `sources.json`).

## What was actually added (7 companies + 1 adjacent_tech entry)

Added to `companies[]`:
- **Nudge** — non-invasive focused-ultrasound BCI, SF. $100M Series A (Jul 2025, Thrive/Greenoaks).
- **Echo Neurotechnologies** — invasive BCI, SF, led by Edward Chang (UCSF). ~$50M Series A (Jan 2025, a16z).
- **Epia Neuro** — invasive skull-implant "read/write" BCI for stroke upper-limb recovery, led by Michel Maharbiz (also iota Biosciences co-founder). HQ disputed between Alameda and SF across sources.
- **Kandu, Inc.** — merger (Apr 2025) of Neurolutions (IpsiHand, FDA De Novo 2021) + Kandu Health (post-stroke support). $30M first close, though CB Insights and a job listing give conflicting/unconfirmed figures — flagged, not reconciled.
- **Coherence Neuro** — invasive closed-loop implant for glioblastoma. $10M seed (Nov 2025); a June 2026 report describes a first-in-human trial of a device called "Cipher" at Royal Melbourne Hospital, whose relationship to the "SOMA-1" name used elsewhere is unresolved.
- **iota Biosciences** — UC Berkeley "neural dust" origin (2017), acquired by Astellas Pharma (announced Oct 2020, ~$304M deal value). Added with `status: acquired` to preserve M&A lineage, per Kevin's earlier instruction to keep acquired/historical entries rather than drop them.
- **BRILL Neurotech** — non-invasive Fast-Optical-Signal brain-imaging headset. **Headquartered in Urbana, Illinois — not California**, despite being named in a "Neurotech in California" post (see Geography flags below).

Added to `adjacent_tech[]`:
- **Forecast Bio** — AI preclinical platform modeling drug effects on brain circuits for mental-health therapeutics. Not a BCI/device company, so it doesn't belong in `companies[]`, but it's relevant to the NeuroAI/software threat surface. SF-based.

## Explicitly excluded

- **Otherside Health** — a New York-based patient-support/community platform, not a neurotechnology device or BCI company, and not California-headquartered. Out of scope for this dataset's schema entirely (see ledger item `market-delta-073`, disposition `rejected`).

## Geography flags

Two of the newsletter's named companies are **not California-headquartered** (BRILL Neurotech: Urbana, IL; Otherside Health: New York, NY), despite appearing in a post titled "Neurotech in California." Possible explanations: the newsletter names them as out-of-state collaborators/mentions rather than map entries, or the Carter Sciences map itself includes non-CA nodes under a different label (the unverified aggregate note mentioned "out-of-state CA sites" as one of its own regional buckets — plausible but not confirmed, since the aggregate breakdown is held per above). This is noted for anyone reviewing this batch, not resolved.

## On the Carter Sciences map's own reliability

A WebSearch pass (not a direct fetch — same egress restriction) on Carter Sciences' own newsletter posts and site turned up:
- The company's total tracked-record counts **differ across the company's own publications and over time** — e.g., a newsletter issue reports "1,800+ company and historical-company records," while the website's dated snapshot (14 September 2026) reports 1,726 companies — different dates, and it's unclear whether historical/provisional entries are counted consistently between the two.
- The author describes the map as **"a working research map I am actively building,"** built by manual multi-language search and tracing companies back to originating universities/labs/hospitals — i.e., self-described manual curation, not a documented, reproducible methodology or a published dataset export.
- No independent, third-party description of the methodology was found.

This reinforces treating the "120 CA companies" figure and its regional/technology breakdown as **held/unverified** (ledger `market-delta-072`) rather than as data to publish or build counts against. If Kevin wants that resolved, the clean path is still what was identified earlier: ask Chay Carter directly, or unlock the post and transcribe the company-level map by screenshot.

## Re-verification pass (2026-10-17, same day)

Kevin asked for a second pass to double-check every source in `sources.json`. Direct fetch of all 16 original URLs was still blocked by this session's egress policy, so this pass used independent WebSearch queries aimed specifically at finding *primary* sources (official press releases, regulatory registries, court/trademark filings) rather than re-confirming the same aggregators. This surfaced real corrections, not just confirmations:

- **BRILL Neurotech headquarters — now DISPUTED, not confirmed.** The original pass cited a University of Illinois Technology Entrepreneur Center article placing the company in Urbana, IL, and built a "not California" geography flag on top of it. This pass found a Foresight Institute bio of co-founder Mehmet Gunal describing the company as San Francisco-based. The two sources disagree and neither was independently fetched (WebSearch synthesis only on both sides) — **the "not California" claim from the first pass should not be treated as established.** `bci-landscape.json` and `company-candidates.json` now carry both claims with the conflict stated explicitly.
- **Coherence Neuro's "SOMA-1 vs. Cipher" naming conflict is resolved, not unresolved.** A ClinicalTrials.gov registry entry (NCT07465796) shows these are two distinct, related devices: CIPHER is a short intraoperative first-in-human *safety* study (Royal Melbourne Hospital, Australia; started 2026-05-22; target N=10; 3 patients dosed as of a 2026-06-23 press report) whose purpose is to inform SOMA-1, the planned second-generation *chronic* implant. The original "unresolved naming conflict" framing has been corrected.
- **Kandu, Inc. merger date corrected.** The official Business Wire release is dated 2025-04-08; MedTech Dive/Healthcare Dive (originally cited) syndicated it on 2025-04-14. Also resolved: Neurolutions founded 2007, Kandu Health founded 2022 (previously flagged as disputed — it wasn't, the original search just hadn't found the official release).
- **Epia Neuro headquarters better-supported as San Francisco**, per the company's own 2026-04-02 Business Wire launch release, rather than the Alameda claim sourced only from a job listing in the first pass.
- **iota Biosciences deal-value figures tightened** against Astellas's own press releases: $304M = ~$127.5M upfront + up to $176.5M in milestones; BioWorld's larger $429M figure is explained as a separate $125M/5-year R&D spending commitment, not part of the acquisition price.
- **Echo Neurotechnologies upgraded to a Bloomberg primary source** (previously only a Techleap Finder aggregator), adding specific investor names (A&E Investments, Andreessen Horowitz, PL Capital) and surfacing an unresolved founding-year conflict (2022 vs. 2023) across other aggregators.
- **Nudge**: added a Goodwin LLP deal-announcement (the law firm that advised Nudge), which dates the raise to 2025-08-04 — conflicting with the July 2025 date most trackers use. Not reconciled.
- **Forecast Bio**: identified the founder (Kira Poskanzer, UCSF neuroscientist) and found a $2.4M SEC Form D SAFE filing that doesn't clearly reconcile with a separately-reported $100K accelerator investment — flagged as possibly two different instruments, not resolved.
- **Otherside Health (excluded entry)**: confirmed this remains single-sourced (StartupHub.ai only); its listed founding date looks like a placeholder. Doesn't change the exclusion (device/BCI-company test fails regardless), but confidence in the specific HQ/founding claims is lower than first stated.

All of the above are reflected directly in `datalake/bci-landscape.json`, `company-candidates.json`, and `sources.json` (10 new source entries, bringing the total to 26). The lesson for future batches: prefer searching for the primary/official release up front rather than settling for the first aggregator that corroborates — several "independent corroborations" in the first pass were actually the same underlying press release laundered through 2-3 aggregator sites.

## Not acted on in this batch

- The ~106 Carter Sciences companies still behind the newsletter's paywall remain unresolved. No placeholder rows were created.
- Academic groups named in the post (UCSF/Chang, Stanford NPTL, UC Davis/Brandman-Stavisky) were not cross-checked against `datalake/research-registry.json` in this pass — worth a follow-up if research-registry coverage matters to Kevin.
