# Data gap analysis and consistency audit, October 2026

Audit date: 2026-10-06. Scope: the datasets behind qinnovate.com in this worktree, read-only.
Companion file: `consistency-findings.json` (63 verified findings). Sources fetched: `sources-data-gap-analysis.json`.

**Baselines.** "Committed" means `datalake/bci-landscape.json` in this worktree (67 companies, 70 devices, last_verified 2026-04-29). "Uncommitted" means the sibling checkout's `../neurosecurity/datalake/bci-landscape.json` (70 companies, 74 devices, last_verified 2026-08-13), read but not copied.

**Method.** Every count below was recomputed from the JSON with a script, and every inconsistency was confirmed by reading the rendering code and the data. Where the generated artifact exists (`src/site/data/kql-tables.json`, built today), builder bugs were confirmed against its output. Nothing in a tracked file was changed.

**Headline results**

- 63 inconsistencies: 15 high, 34 medium, 14 low. 43 are hardcoded values; 20 are values computed differently from the data.
- The homepage film cites "62 of 70", a ratio that exists only in the uncommitted file. The published dataset gives 59 of 67.
- The claim behind that ratio is wider than the field. `none_published` is recorded as "no BCI-specific published security posture", and no company record carries an evidence URL. Two companies coded `none_published` publish product-security pages (verified today).
- Three builder bugs blank or distort the most distinctive fields in the KQL layer: dual-use is empty for all 165 techniques, the device security score table has zero rows, and the company risk index scores every non-`none_published` company 4/4.
- The three device datasets (70 landscape devices, 24 hardware specs, 22 scored devices) share no key. Only 5 of 24 and 2 of 22 device names match the landscape.

---

## 1. Inventory

Completeness is the share of records where the field is absent, null, empty, or a placeholder ("unknown", "N/A"). Only fields with gaps are listed. "Consumers" are files under `src/lib`, `src/pages`, and `src/components` that import the file; every `datalake/*.json` marked † is also flattened by `src/lib/kql-tables.ts` and `src/scripts/generate-parquet.py`.

### 1.1 Product datasets

| File | Purpose | Records | Dated | Consumers | Gaps in key fields |
|---|---|---|---|---|---|
| `datalake/qtara-registrar.json` † | TARA technique catalog, source of truth | 165 techniques, 17 tactics, 8 locus domains, 2 deprecated | `generated` 2026-02-09 (stale); last commit 2026-07-31; newest changelog entry 2026-03-15 | `threat-data.ts`, `qif-stats.ts`, `qif-constants.ts`, `clinical-data.ts`, `neurogovernance-data.ts`, `index.astro`, `about/index.astro`, `atlas/tara/[id].astro`, `research/api.astro` | niss 15.8% (26 unscored); neurorights 18.2%; regulatory 18.2%; origin 18.2%; sources 18.8%; cvss 37.6%; therapeutic analog 21.2%; physics_feasibility 2.4%; coupling 83.6%; access 86.7%; use_context_tags 100%; no per-technique date |
| `datalake/bci-landscape.json` † | Companies, devices, funding, market, policy | 67 companies, 70 devices, 44 funding rounds, 25 market estimates, 25 industry events, 26 policy events, 9 publication-trend rows | last_verified 2026-04-29 | `bci-directory-data.ts`, `qif-stats.ts`, `research/landscape.astro`, `research/data-lake.astro`, five chart scripts | Companies: funding_total_usd 41.8%; employees 67.2%; valuation 91.0%; modality 35.8%; tara_attack_surface 50.7%; funding_rounds 97.0%; founded 7.5%. Devices: cves_known 98.6%; price 75.7%; first_human 57.1%; channels 42.9%; units_deployed 32.9% |
| `datalake/neurosecurity-scores.json` † | Device-level Neurosecurity Score with per-neuroright subscores | 22 devices | none; last commit 2026-03-15 | `bci-data.ts` | Complete, but keyed by a device name that matches 2 of 70 landscape devices |
| `datalake/neurosecurity-crb-pilot.json`, `-montecarlo.json`, `-sensitivity.json` | Population sensitivity of device scores | 5, 10, and 3 test blocks | none; 2026-03-15 | **None** | Complete; unused |
| `datalake/cve-technique-mapping.json` † | CVE to technique mapping | 55 CVEs, 20 distinct techniques | generated 2026-02-21 | KQL only | cwe 5.5%; header counts stale |
| `datalake/impact-chains.json` † | Precomputed technique to band to region to pathway to DSM chains | 4,428 rows covering 73 techniques | none; 2026-03-15 | KQL only | 92 of 165 techniques have no chain |
| `datalake/tara-chains.json` | Multi-step attack chains | 1 chain | none; 2026-03-15 | `components/atlas/load-tara-chains.ts` | Complete; n = 1 |
| `datalake/eeg-samples.json` † | Tagged EEG dataset registry | 26 samples (17 redistributable) | updated 2026-03-18 | `qif-stats.ts`, `data-studio/eeg.astro` | dataDoi 88.5%; channelNames 80.8%; paperDoi 65.4%; taraId 61.5%; dsm5Code 42.3%; subjects 30.8%; samplingRateHz 26.9%; sourceUrl 19.2%; two taraId values are comma-joined strings |
| `datalake/validation-registry.json` † | What was tested and what was not | 9 entries, 6 not-tested, 7 tiers | last_updated 2026-02-21 | `validation-data.ts`, `research/validation.astro` | related_tara_ids 77.8% |
| `datalake/research-registry.json` † | Researchers, institutions, standards, legislation | 73 explorer, 26 researchers, 27 institutions, 14 standards, 12 legislation | lastUpdated 2026-03-11 | `governance/ai-security-ethics.astro`, `research/neuroethics-landscape.astro` | standards url 21.4%; legislation has no url or effective date; explorer status 83.6% |
| `src/site/bci-hardware-inventory.json` (outside the stated scope, included because pages depend on it) | Hardware specs with per-value confidence and source | 24 devices | created 2026-02-18 | `bci-data.ts`, `atlas-data.ts`, `kql-tables.ts` | wireless_protocol 25% (6 of 24); power 75%; weight 54%; no firmware-update field |

### 1.2 Reference and framework datasets

| File | Purpose | Records | Dated | Consumers | Gaps |
|---|---|---|---|---|---|
| `qif-brain-bci-atlas.json` † | Regions, bands, device-region map | 38 regions, 11 bands, 24 device mappings | created 2026-02-18 | `atlas-data.ts`, `bci-data.ts`, `clinical-data.ts`, `api/qif.json.ts` | allen_atlas_id 100%; brodmann_areas 65.8% |
| `qif-dsm-mappings.json` † | DSM clusters by band | 8 clusters, 40 conditions | version only | `atlas-data.ts`, `clinical-data.ts` | none |
| `qif-neurological-mappings.json` † | ICD-10 neurological conditions | 50 conditions, 7 categories | version only | KQL only | pathway_ids 6% |
| `qif-ethics-controls.json` † | Neurorights, consent tiers, frameworks | 4 neurorights, 4 tiers, 7 frameworks | version only | `atlas-data.ts` | none |
| `qif-security-controls.json` † | Controls by band, NSP layers | 11 bands, 5 layers | version only | `atlas-data.ts` | none |
| `qif-guardrails.json` † | Neuroethics guardrails | 8 guardrails, 4 bounds | 2026-03-05 | KQL only | none |
| `qif-neural-pathways.json` † | Pathways | 46 | 2026-03-11 | `clinical-data.ts` | therapeutic_applications 13% |
| `qif-neurotransmitters.json` † | Neurotransmitters, cofactors | 18, 12 | 2026-03-11 | `clinical-data.ts`, `atlas/clinical.astro` | transporter 55.6%; cofactor_dependencies 44.4% |
| `qif-receptors.json` † | Receptor families | 20 | 2026-03-11 | KQL only | ion_selectivity 50%; many single-record fields |
| `qif-cranial-nerves.json`, `qif-glial-cells.json`, `qif-neuroendocrine.json`, `qif-neurovascular.json` † | Anatomy references | 12, 6, 7, and one nested object | 2026-03-11 | KQL only | sparse optional fields |
| `qif-neurosim.json` | Simulation parameters | 13 small arrays | version only | `NeuroSIM.tsx`, `atlas/neurosim.astro` | n/a |
| `derivation-timeline.json` † | Curated derivation milestones | 31 | 2026-03-05 | KQL; copied by prebuild | entry 3.2% |

### 1.3 `src/data`

| File | Purpose | Records | Dated | Consumers | Gaps |
|---|---|---|---|---|---|
| `bci-intel-feed.json` | Aggregated news items | 970 (item dates 2015-08 to 2026-07) | newest `fetched` 2026-07-26 | `kql-tables.ts`, `tools/intel/index.astro`, `research/api.astro` | companies 90.3% (entity tagging mostly empty); summary 2.7% |
| `intel-sources.json` | Source catalog | 211 (49 flagged as feeds) | none; 2026-03-11 | same | rss_url 78.2% |
| `external-news-cache.json` | News cache | 24 | newest 2026-07-27 | `fetch-feeds.ts` | none |
| `qif-timeline.json` | Project milestones and "current stats" | 57 milestones; 26 carry `stats_snapshot` | as_of 2026-03-15 | `news/roadmap.astro`, `api/qif.json.ts` | stats_snapshot 54.4%; current_stats stale |
| `milestones.json` | Disclosures, standards, specs | 2, 1, 3, 12 timeline | none; 2026-04-04 | `news/roadmap.astro` | `metrics` block unused and stale |
| `automation-registry.json` | Workflow registry | 33 | 2026-10-06 | KQL | last_triggered 60.6% |

### 1.4 Committed versus uncommitted landscape file

| Measure | Committed (2026-04-29) | Uncommitted (2026-08-13) | Change |
|---|---|---|---|
| Companies | 67 | 70 | +3: Gestala Technology, Neurosoft Bioelectronics, StairMed |
| Devices | 70 | 74 | +4: NEO Implantable BCI (Neuracle), SPRY TMS Therapy (Soterix), plus one each for Neurosoft and StairMed |
| `none_published` | 59 of 67 (88.1%) | 62 of 70 (88.6%) | all three new companies coded `none_published` |
| Sum of `funding_total_usd` | $5.959B (39 non-null) | $7.073B (43 non-null) | +$1.114B: Neuralink +$510M, Saluda +$282.65M, Axoft +$55M, NeuroXess +$15.2M, new companies +$251.1M |
| Dated funding rounds | 44 (15 companies) | 49 (19 companies) | +5 rounds |
| Industry timeline | 25 | 33 | +8 events |
| `type` spelling | `non_invasive` 30, `non-invasive` 10 | `non_invasive` 40 | normalised |
| Per-record `date_added`, `last_verified` | absent | present on all 70 | new fields |
| Reclassifications | | | Neuracle: non-invasive to semi-invasive, Beijing to Shanghai; Saluda: active to public (ticker SLD, valuation $775M); Blackrock employees 60 to 190 |
| Unchanged | | | `version` 2.2, `generated` 2026-03-14, market-size estimates, VC aggregate, policy timeline, publication trends |

Two cautions. First, 67 of 67 existing records differ between the files, but 43 differ only by the two new date fields and the spelling fix; 24 changed in substance. A naive diff overstates change. Second, the uncommitted file introduces another one-off `fda_status` value (`CE_marked_EU_investigational_US`) in a field that holds 16 distinct values, including free text, in both files.

### 1.5 Structural problems that affect every later section

| Problem | Evidence |
|---|---|
| No stable keys | Companies and devices are keyed by display name. Hardware inventory uses slugs. Score file uses a third naming. Matches: 5 of 24, 2 of 22. |
| No per-claim provenance in the landscape | No company has a URL in `security_notes` (0 of 67 committed, 0 of 70 uncommitted); 13 and 31 respectively mention a "Verified" date in free text. `major_funding_rounds` has URLs (43 of 44), 16 from aggregators. The hardware inventory, by contrast, stores `confidence` and `source` per value. |
| Uncontrolled vocabularies | `fda_status` 16 values; clinical `fda_status` uses `none`, `N/A`, and `not_applicable`; `type` had two spellings. Code maps assume other vocabularies. |
| Free text where numbers are needed | `units_deployed` ("~20 implanted globally (…Dec 2025)"), `fda_status` with embedded dates. |
| Derived numbers stored beside the data | `registrar.statistics`, `cve-technique-mapping.json` header, `total_funding_tracked_usd`, `qif-timeline.json` current_stats, `milestones.json` metrics. All five are stale. |
| Broken pipeline entry points | `npm run compute:chains` and three `eeg:*` scripts point at `datalake/src/scripts/`, which does not exist (scripts are in `datalake/scripts/`). Parquet is regenerated only if pyarrow is installed; the committed catalog is dated 2026-07-26 and lags the JSON (intel feed 942 versus 970 rows). |
| Reference drift | Company `tara_attack_surface` uses 23 distinct technique IDs, none above QIF-T0100. |

---

## 2. Consistency audit

Full list with file, line, shown value, data value, and fix: `consistency-findings.json`.

### 2.1 Counts

| Severity | Count | Meaning |
|---|---|---|
| High | 15 | A public number or claim contradicts the data, is synthesized, or a bug blanks a product field |
| Medium | 34 | Stale count on a secondary page, competing definitions, or a wrong computed value with limited reach |
| Low | 14 | Hardcoded but currently correct, dated articles, internal pointers |

### 2.2 The film script (`src/site/film/reel.js`)

| Line | Shown | Data | Verdict |
|---|---|---|---|
| 221, 229 | "62 of 70 brain-device companies we track"; "AUGUST 2026" | 59 of 67 committed; 62 of 70 uncommitted only | Cites an unpublished file. High. |
| 211 | "Most say nothing about security." | Field means "no BCI-specific published security posture"; no evidence URLs; Medtronic and Boston Scientific publish product-security pages | Claim wider than the field. High. Needs a human decision. |
| 10, 249 | 165 techniques | 165 | Correct, hardcoded. |
| 239, 250 | "About 3 in 4 have a therapeutic twin"; grid lights exactly 3 of 4 cells | 73.3% to 79.4% depending on definition | Holds. The lit cells are a pattern, not the actual techniques. Low. |
| 13, 361 | $0.66B 2022, $1.4B 2023, $2.3B 2024, $4.8B 2025; "2025 is a partial year" | Values match `vc_aggregate_by_year`. The 2025 row is annotated "cumulative, partial year", but its cited source is dated 2026-01-12 and reports $4.8B across 140 deals for 2025. The 2022 and 2023 rows have no URL. The series is neurotechnology-wide. | Numbers match; the 2025 annotation is unresolved. High. |

### 2.3 Highest-impact findings outside the film

| Where | Shown | Data supports |
|---|---|---|
| `index.astro:62`, `:49`, `:99` | "an $8 billion industry", "median estimate across 9 market research firms" | 9 firms give 2024 estimates with median $2.3B. $8.36B is the 2032 median of 3 firms. |
| `index.astro:292-295` | Signal Injection worked example: 6.0 + 1.5 + 0.7 = "8.2 HIGH" | QIF-T0001 scores 6.1, medium. NISS has six metrics combined as a weighted mean; none is "detectability". |
| `BciLandscape.tsx:139-157` | "Known threat vectors (TARA)" plotted back to 2010 | Synthesized from a constant (135) and a decay factor. The catalog began 2026-01-15. |
| `BciLandscape.tsx:119-150` | Publication forecast | Regression on array index over unevenly spaced years; inputs are round-number approximations. |
| `landscape.astro:48, 78` | Invasive / Non-invasive 20/30 | 20 / 40 / 7 semi-invasive; ten companies dropped by a spelling mismatch. |
| `kql-tables.ts:184-186` | dual_use, physics_tier, consent_tier columns | Empty for 165 of 165 rows; wrong field paths. |
| `kql-tables.ts:380` | Device security score table | Zero rows; reads `.scores`, file has `.devices`. |
| `kql-tables.ts:893-894` | Company risk index | Posture map uses a vocabulary the data does not use. |
| `whitepaper/index.astro:474-499` | Six company funding figures | All six differ from the landscape. |
| `whitepaper/index.astro:709` and `NissGapChart.astro:23` | "CVSS cannot score 61.8%" and "94.4%" on one page | 89 of 165 (53.9%) have gap_group ≥ 2, or 86.4% of the 103 with a CVSS vector. |

### 2.4 One quantity, several values

| Quantity | Values currently rendered or stored | Data |
|---|---|---|
| Companies | 57 (directory, Data Studio, intel), 67 (computed), 70 (film) | 67 committed, 70 uncommitted |
| Devices | 68 (directory, Data Studio, timeline), 70 (computed), 24 (hardware pages), 22 and "20" (scores), "7" (device types) | 70 or 74 landscape; 24 hardware; 22 scored |
| Techniques | 165 (computed), 161 (intel bundle text, timeline, milestones, CVE file), 135 (chart base), 99 (dated analysis articles) | 165 |
| Tactics | 17 (README), 15 (rights page, milestones), 16 (timeline) | 17 |
| "Domains" | 8 (README, glossary), 11 (atlas card), 12 (computed, chain constants) | 8 locus domains; 12 TARA domain codes |
| Neurorights | 4 (rights, TARA pages), 5 (nav, Data Studio, pentagon), 6 (timeline), 7 (homepage) | 4 defined; DI and IDA marked as folded |
| DSM references | 76 (homepage), 68 (timeline), 40 (KQL table), 15 (registrar statistics) | 76 techniques with a primary code; 48 distinct codes |
| Therapeutic share | 121, 130, 131 of 165; "about 75%"; 104 (registrar statistics) | 73.3% to 79.4% by definition |
| Critical severity | 3 (homepage chart), 32 (whitepaper), 0 (NISS) | Legacy scale 32; NISS scale 0 |
| Tracked funding | $3.3B (landscape chart), $4.8B (stored total), $5.93B (intel), $5.96B (directory), "over $4 billion" (whitepaper), $9.16B (KQL cumulative) | Depends on basis; none is labelled |
| Publications | 18 (trust bar), 59 (timeline), 74 (blog collection) | 74 posts |
| Research sources | 309+ (framework), 311 (timeline), 340+ (README) | 342 rows |
| TARA version | 1.6, 1.7, 1.8, 4.0 | no single source |

### 2.5 Root causes

1. **Counts typed into prose.** `qif-stats.ts` and `threat-data.ts` already export the right constants; most of the 43 hardcoded findings bypass them.
2. **Derived statistics stored in data files** and not recomputed when the catalog grew from 135 to 165.
3. **No schema validation in prebuild.** Enum drift and wrong field paths fail silently, because every builder defaults to `''` or `0`.
4. **One file in two states.** The film was written against the uncommitted landscape file.
5. **`npm run health` checks technique counts only.** It does not cover companies, devices, tactics, neurorights, or funding.

---

## 3. Gap analysis

Ranked by value over effort. "Verified" means the source was fetched on 2026-10-06 and responded as described; "UNVERIFIED" means it was not fetched or the attempt did not confirm it. No proposed field has been added to any entry.

| Rank | Addition | Why it is necessary | Public source | Effort | Cadence | Risk |
|---|---|---|---|---|---|---|
| 1 | **Stable IDs, per-record provenance, controlled enums.** `company_id`, `device_id`; `source_url` and `as_of` on each fact; enums for `type`, `fda_status`, `security_posture` | Prerequisite for joins across the three device datasets, for deltas, and for defending any published ratio. Serves every buyer. | Already in hand; the uncommitted file adds `date_added` and `last_verified`. The hardware inventory's `{value, confidence, source}` shape is the template. | Low | Once, then enforced in prebuild | Low. Renames must keep the old name as an alias. |
| 2 | **Dated snapshots** (design in section 4) | The site cannot currently say what changed. Three states already exist (2026-03, 2026-04, 2026-08). | Git history and the two landscape files | Low | Each data refresh | Low. Normalisation edits must be separated from real change. |
| 3 | **Security posture evidence.** Per company: security page URL, vulnerability disclosure policy URL, advisory or bulletin URL, `security.txt` presence, bug bounty URL, `checked` date, and a written rubric for each posture level | This is the headline metric and the main differentiator, and it currently has no evidence trail. Device makers and security teams will check their own row first. | Company product-security pages. Verified examples: Medtronic security bulletins and coordinated disclosure process; Boston Scientific product security. Abbott: the page fetched held only a general commitment, UNVERIFIED for a disclosure process. `security.txt` (RFC 9116): not fetched. | Medium (70 companies, manual first pass) | Quarterly | Accuracy: absence of evidence is not evidence of absence, so record search scope. Legal: a company coded "none" will object if wrong. Access: fetching `security.txt` across 70 sites is light-touch but should be an explicit decision. |
| 4 | **Regulatory submissions and recalls.** 510(k), PMA, De Novo numbers, product codes, decision dates; recall events with reason and date | Replaces a 16-value free-text field with verifiable records. Regulators and investors need submission numbers; security teams need software-related recalls. | openFDA device endpoints. Verified: `device/510k.json` (last updated 2026-09-28), `device/pma.json` (returned P100026, NeuroPace RNS), `device/recall.json` (33 results for Medtronic neurostimulator, last updated 2026-10-05). | Low to medium (API; applicant-name mapping is manual) | Monthly, automatable | Entity resolution: the NeuroPace 510(k) hits are burr hole covers, not the RNS system. US only. IDE and Breakthrough status are not in these endpoints. |
| 5 | **Clinical trial registrations.** NCT ID, sponsor, status, start date, enrollment per device | `first_human` is empty for 57% of devices and `units_deployed` is free text. Trial records give dated, citable human-use evidence and support the demonstrated-versus-projected distinction. | ClinicalTrials.gov API v2. Verified: 263 studies for "brain-computer interface". | Low | Monthly | Low. Matching trials to devices needs review; enrollment is planned, not implanted. |
| 6 | **Funding rounds as dated events for every funded company**, each with a primary source | Only 2 of 67 companies have `funding_rounds`; the separate rounds list covers 15. Totals are not reconcilable ($3.3B to $9.2B on the site today). Investors need events, and events give deltas for free. | Company press releases and wire services (already the cited source for some rounds: businesswire.com 6, paradromics.com 3, globenewswire.com 2). SEC Form D: the EDGAR full-text query tried returned 0 hits, UNVERIFIED as a method; lookup by issuer name was not tested. | Medium | Monthly, or event-driven from the intel feed once its `companies` tagging (90% empty) is fixed | Accuracy: 16 of 44 rounds cite Tracxn or Sacra. Legal: republishing proprietary aggregator data. Currency conversion for non-USD rounds. |
| 7 | **CVEs and advisories per vendor and product**, with affected-product scoping | `cves_known` is populated for 1 of 70 devices. The existing CVE file maps mostly generic component CVEs (Bluetooth, RTOS, mesh) to techniques, which is different from device exposure. | NVD API 2.0: verified live; keyword "neurostimulator" returned 0, so queries must be by vendor or CPE. CISA ICS medical advisories: one page verified (ICSMA-19-080-01). CISA CSAF repository exists; whether it carries ICSMA files was not confirmed. | Medium | Weekly, automatable | False attribution: the Medtronic advisory verified covers cardiac devices, not neuro. Each link needs product-level review. |
| 8 | **Complete the catalog's own coverage.** NISS for 26 techniques, neurorights and regulatory mapping for 30, impact chains for 92, structured citations (DOI or PMID) in place of free-text `sources`, `date_added` and `last_reviewed` per technique | The site says every technique is scored and mapped. Technique deltas are impossible without dates. 31 techniques list no source. | Internal work; Crossref for DOI checks (required by the brief) | Medium | Per catalog release | Scores are proposed and unvalidated; say so wherever coverage is quoted. |
| 9 | **Reproducible publication counts** with the query string stored | Current rows are round-number approximations with no query. One narrow query (`"brain-computer interface"[Title/Abstract] AND 2024[pdat]`) returns 743 against a stored 7,200. | PubMed E-utilities. Verified. | Low | Annual | Low. The count is sensitive to query wording, so publish the query. The 743 is one formulation, not a correction. |
| 10 | **Policy and legislation as sourced records.** URL, enacted and effective dates, jurisdiction code, status | `policy_timeline` (26 rows) has no URL; `legislation` (12 rows) has a year only. Regulators are a stated buyer. | Legislature and agency sites. Not fetched, UNVERIFIED. | Low to medium | Quarterly | Low. Bill status changes. |
| 11 | **Data-handling and privacy-policy facts** for consumer devices. Policy URL, retrieval date, whether neural data is named, retention, third-party sharing, deletion right | Links the neurorights mapping to observable company practice. | Company privacy policies. A Neurorights Foundation review of consumer neurotech policies is believed to exist; not fetched, UNVERIFIED. | Medium to high (about 30 consumer companies, reading required) | Semiannual | Legal interpretation; policies change silently, so store an archive link. No personal data involved. |
| 12 | **Per-device wireless protocol, pairing and authentication, firmware update mechanism, data path** | Needed to map techniques to devices rather than to companies. Wireless protocol exists for 18 of 24 hardware records and 0 of 70 landscape devices; firmware update is recorded nowhere. | FCC equipment authorization filings, Bluetooth qualification listings, FDA summaries, user manuals. None fetched, UNVERIFIED. | High (manual per device) | Semiannual | Accuracy: inference from marketing copy. Dual-use: a per-device attack-surface table for implanted devices needs a disclosure policy first. Human decision. |
| 13 | **Non-US regulatory status** (EU, China, Japan, Australia) | About 28 of 67 tracked companies list a headquarters outside the US, and the uncommitted file already needs a CE-mark value. | EUDAMED and national registries. Not fetched, UNVERIFIED. | High | Semiannual | Coverage and language; registries are incomplete. |

**Evaluated and not recommended**

| Idea | Reason |
|---|---|
| Named security staff or CISO hires | Personal data beyond what companies publish (brief rule 9); high churn; weak signal. |
| Copying aggregator databases (PitchBook, Tracxn, Crunchbase) | Licensing risk; use them to find primary sources only. |
| Employee counts as a tracked metric | 67% missing, no primary source, low value to the security story. |
| Any active probing of company infrastructure | Out of bounds (brief rule 6). |

---

## 4. Delta design

### 4.1 Constraints from the current build

- Source of truth is hand-edited JSON in `datalake/`.
- `npm run prebuild` copies four JSON files, runs `generate-kql-json.mjs` (which executes `kql-tables.ts`), runs `generate-parquet.py` if pyarrow is present, and copies parquet.
- KQL tables are built from static imports, so a new table needs a new import and a builder.
- Git history is thin: `bci-landscape.json` has 2 commits, the registrar 7. CI checkouts are usually shallow, so diffing against git at build time is fragile.

### 4.2 Recommendation: append-only snapshot files plus one generated change table

```
datalake/snapshots/
  index.json                  one row per snapshot: date, label, source file hashes, headline counts
  2026-04-29.json             slim projection of that state
  2026-08-13.json
```

**Snapshot projection** (about 40 to 60 KB each; not a full copy):

| Entity | Fields kept |
|---|---|
| companies | id, name, type, status, company_category, security_posture, funding_total_usd, valuation_usd, device_ids, last_verified |
| devices | id, company_id, name, type, fda_status, units_deployed, cve_count |
| techniques | id, status, severity, niss_score, niss_severity, dual_use, has_neurorights, has_cvss |
| funding_rounds | company_id, date, series, amount_usd |

**Two scripts**

| Script | When | Does |
|---|---|---|
| `src/scripts/snapshot.mjs` (`npm run snapshot`) | Manually, when `last_verified` or the registrar changes | Writes `datalake/snapshots/<date>.json` and appends to `index.json`. Refuses to overwrite an existing date. |
| `src/scripts/compute-deltas.mjs` | In prebuild, before `generate-kql-json.mjs` | Diffs each consecutive pair and writes `datalake/snapshots/changes.json`. Fails the build if the live `last_verified` is newer than the latest snapshot. |

**Two new tables** (KQL and parquet, same pattern as existing builders)

| Table | Shape | Answers |
|---|---|---|
| `snapshot_metrics` | long format: `date, metric, value` | Trend lines: companies, devices, `none_published`, tracked funding, techniques, scored techniques |
| `changes` | `date_from, date_to, entity_type, entity_id, field, old, new, change_type, change_class` | "What changed since last time" lists and badges |

`change_type` is add, remove, or update. `change_class` is `data` or `normalisation`; the second keeps spelling fixes and new housekeeping fields out of the public change list. Without it, the April-to-August diff would report 67 changed companies when 24 changed in substance.

### 4.3 Why this and not something else

| Alternative | Why not |
|---|---|
| Diff against git at build time | Shallow clones; two commits of history; uncommitted states are invisible. |
| Full copies of each JSON per snapshot | 160 KB plus 1 MB per snapshot, and diffs include prose edits. |
| `valid_from` / `valid_to` on every record | Correct in the long run, but it changes the schema every consumer reads. Revisit if snapshots exceed a few dozen. |
| A database | Not justified at 70 companies and 165 techniques. |

### 4.4 Backfill available now

| Snapshot | Source | Caveat |
|---|---|---|
| 2026-03-14 | First commit of `bci-landscape.json` | Verify the commit date matches `generated` |
| 2026-04-29 | Current committed file | None |
| 2026-08-13 | Uncommitted file | Must be committed first |
| Technique counts 60 to 161 | `stats_snapshot` on 26 milestones in `qif-timeline.json`; registrar changelog | Reported values, not recomputed; mark them `reported` in `index.json` |

### 4.5 Prerequisites

1. Stable `company_id` and `device_id` (gap 1). A name-keyed diff reads a rename as a removal plus an addition.
2. One definition of "tracked funding". Funding deltas come directly from dated rounds and need no snapshot once gap 6 is done.
3. Per-technique `date_added` so technique history does not depend on snapshots.

---

## 5. Differentiation

Wording follows the brief: "distinctive within this dataset" means the repository shows no equivalent elsewhere in its own sources. No market-uniqueness claim is made or was verified.

| Field or dataset | What it holds | Where it is surfaced | Where the site falls short |
|---|---|---|---|
| Security posture per company (`security_posture`, `security_notes`) | Five-level classification for 67 companies | Landscape page, directory, KQL presets | Not on the homepage except as a hardcoded film line. No evidence URL or check date. Risk index maps it wrongly. The ratio shown publicly comes from an unpublished file. |
| Therapeutic counterpart per technique (`tara.dual_use`, `tara.clinical.*`) | Analog therapy, conditions, FDA status, evidence level, safe parameters; 130 of 165 | Homepage split, clinical atlas, technique pages | KQL `dual_use` column is empty. Three competing counts. "Already used in medicine" overstates: 52 are cleared or approved. |
| Technique to neurorights mapping with consent complexity index (`neurorights.affected`, `cci`) | 135 of 165 | Rights page, technique pages, parquet bridge table | Homepage count (7) disagrees with the rest of the site (4 or 5). CCI is absent from the homepage and catalog list. 30 techniques unmapped. |
| NISS and CVSS vectors side by side with `gap_group` | 139 with NISS, 103 with CVSS | Scoring page, technique pages | `gap_group` is not read by any page; the two gap percentages shown are unsupported. Homepage worked example contradicts the record. |
| Regulatory mapping per technique (`regulatory.fdora_524b`) | Cyber-device test, applicable submission requirements, coverage score, gaps; 135 of 165 | Technique detail page and API only | No aggregate view for device makers or regulators, although `getRegulatoryStats()` exists. |
| Physics feasibility tier per technique | Feasible now through far-term; 161 of 165 | API page, demo atlas | Not on the homepage or catalog, although it is the cleanest expression of demonstrated versus projected. KQL column empty. |
| Company attack surface (`tara_attack_surface`) | Technique IDs per company; 33 of 67 | Directory shows a count | Company-level, not device-level. Frozen at QIF-T0100. Technique pages do not link back to companies. |
| Device Neurosecurity Score and population sensitivity | 22 devices with per-neuroright subscores; Monte Carlo and sensitivity runs | Explorer via `bci-data.ts` | KQL table has zero rows. The three sensitivity files have no consumer. Device names do not join to the landscape. |
| CVE to technique mapping with coverage by band | 55 CVEs, 20 techniques | KQL table; one "81%" line | No page of its own. Header statistics stale. Not linked from devices. |
| Impact chains | Technique to band to region to pathway to neurotransmitter to DSM category; 4,428 rows | KQL, lazy-loaded | Covers 73 of 165 techniques; the regeneration command is broken. |
| EEG registry tagged with technique and DSM codes | 26 datasets, 10 with a technique tag | EEG Data Studio | Page copy says 16. Tags not normalised. |
| Investor intelligence | Cross-portfolio investors, sovereign funds, corporate venture, defense-linked investors | Data-lake and dashboard pages, KQL | Not reachable from the landscape page that investors would land on. |
| Hardware inventory with per-value confidence and source | 24 devices | BCI Explorer | Lives outside `datalake/`; the atlas points to a path that does not exist. Its provenance model is not applied to the landscape. |
| Validation registry including a not-tested list | 9 entries, 6 explicit gaps | Validation page | Homepage heading "Validated, Not Just Claimed" sits beside "Not independently validated"; the not-tested list is the stronger message and is not shown there. |

**Pattern.** The fields that distinguish this dataset are per-technique and per-company judgments. The site's weakest points are exactly where those judgments are summarised: the summary numbers are hardcoded, stale, or computed by a path that does not match the schema.

---

## 6. Decisions needed and limits of this audit

**Needs a human decision**

1. Whether the August landscape file is committed before the film ships, or the film reverts to 59 of 67.
2. The wording and definition of the security-posture claim, and whether established device makers with product-security pages are re-coded.
3. What the 2025 funding figure is: annual or cumulative, full or partial year.
4. The neurorights taxonomy the site counts: 4, or 4 plus Equal Access.
5. One definition of "therapeutic counterpart" and one of "tracked funding".
6. Whether per-device attack-surface data (gap 12) is published at all, and under what disclosure policy.
7. Whether `security.txt` checks across tracked companies are acceptable under the project's access rules.

**Could not verify**

- Abbott's vulnerability disclosure process (the page fetched did not describe one).
- Whether the 2025 funding article states full-year scope; the body is paywalled.
- SEC Form D as a funding source, CISA CSAF coverage of medical advisories, FCC and Bluetooth listings, non-US registries, and the consumer privacy-policy review. All are marked UNVERIFIED above.
- Rendered output in a browser. Findings rest on source and on the generated KQL JSON, not on screenshots.
- Pages outside the grep patterns used. Archived whitepaper versions and blog posts were excluded on purpose.

**Instructions found in content.** None of the fetched pages or repository data files contained instructions directed at an agent.
