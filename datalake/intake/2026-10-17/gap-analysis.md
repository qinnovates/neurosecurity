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

## Not acted on in this batch

- The ~106 Carter Sciences companies still behind the newsletter's paywall remain unresolved. No placeholder rows were created.
- Academic groups named in the post (UCSF/Chang, Stanford NPTL, UC Davis/Brandman-Stavisky) were not cross-checked against `datalake/research-registry.json` in this pass — worth a follow-up if research-registry coverage matters to Kevin.
