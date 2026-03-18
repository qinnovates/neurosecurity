# Changelog

All notable changes to this project are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/).
Auto-maintained by `scripts/changelog-update.mjs`.

<!-- changelog-marker: 54db16ab46441fcde28a6dee75b7659b4cc58c55 -->

## 2026-03-17

### Added
- BCI Security Plugin blog post and website page ([9249666](https://github.com/qinnovates/qinnovate/commit/9249666))
- Agentic AI scaffold: decompose monolithic CLAUDE.md into 3-layer hierarchy + per-directory READMEs ([dd89772](https://github.com/qinnovates/qinnovate/commit/dd89772))

### Updated
- ADHD vs ASD differential diagnosis, research gaps, face ERP dissociation ([e30f0d5](https://github.com/qinnovates/qinnovate/commit/e30f0d5))

### Other
- resolve news cache conflict (accept remote) ([1b90a48](https://github.com/qinnovates/qinnovate/commit/1b90a48))
- update news feed cache [skip ci-deploy] ([054710f](https://github.com/qinnovates/qinnovate/commit/054710f))


## 2026-03-18

### Research
- 12-agent Quorum swarm: dopamine wavelength research — mapped complete 10-step DA synthesis pathway, cofactor dependencies (Fe2+, BH4, B6), and wavelength-to-mechanism table (632.8nm to 2120nm) with 90+ DOI-verified citations
- 4-receptor expansion: GABA (7), ACh (5), Serotonin (4), Glutamate (4) — 20 additional techniques from pathway-specific Quorum agents
- Fact-check swarm caught 1 hallucinated citation (fabricated author + inverted finding on real DOI)

### Added
- 26 new TARA techniques (QIF-T0136–T0161): dopamine photobiomodulation, UCNP optogenetics, HUP photovoltaic NPs, photothermal Au NPs, INS, magnetothermal, SICI-TMS, LICI-TMS, cTBS, anodal tDCS GABA depletion, gamma-tACS, FUS thalamic GABA, GENUS 40Hz sensory entrainment, implanted VNS cholinergic, tVNS, TMS-mAChR, AChE inhibition BCI corruption (nerve agents), cholinergic medication inference, VNS serotonin, tFUS DRN serotonin, electroacupuncture 5-HT, acute tryptophan depletion, E/I ratio manipulation, LIFU astrocytic gliotransmission, FUS-BBB excitotoxic priming, cortical spreading depression
- New tactic: QIF-N.NM (Nanoparticle-Mediated Neuromodulation)
- Hybrid naming convention (Option C): `QIF-Txxxx` canonical + `TARA-{DOMAIN}-{MODE}-{NNN}` alias for all 161 techniques
- Wavelength classification decision tree for future technique discovery (Entry 101)
- Migration scripts with built-in delta validation: `migrate-tara-aliases.py`, `migrate-receptor-techniques.py`, `propagate-technique-count.py`
- Derivation Log Entries 100 (dopamine research), 101 (naming convention + receptor expansion)
- Field Journal Entry 027 (Quorum at scale — Socrates/Plato agent architecture)

### Updated
- TARA registrar: 135 → 161 techniques, `tara_alias` populated for all, `tara_taxonomy_version` 1.0
- Taxonomy proposal status: PROPOSED → ADOPTED
- Whitepaper v8 draft: technique counts updated (109 → 161)
- 29 files propagated with updated technique counts (58 replacements)
- QIF-TRUTH.md: total techniques, domain distribution updated
- README.md: technique count badges and references
- T0136 enriched: serotonin + ACh added to `tara_domain_secondary` (same CCO mechanism)
- T0009 enriched: indirect corticothalamic-raphe serotonin pathway documented
- Governance docs auto-regenerated from derivation log
- SDK registrar copy synced
- Pipeline validated: prebuild → health (12/12) → build (296 pages, 0 errors)

## 2026-03-16

### Fixed
- update FUNDING.yml to personal GitHub account (qikevinl) ([b784339](https://github.com/qinnovates/qinnovate/commit/b784339))



## 2026-03-15

### Added
- BCI use cases page, hero text update, DeviantArt archive ([b0be928](https://github.com/qinnovates/qinnovate/commit/b0be928))

### Fixed
- QIF_VERSION 7.0→8.0 + whitepaper section numbering ([3d4c316](https://github.com/qinnovates/qinnovate/commit/3d4c316))


## Both

### Updated
- Lens redesign: 3-state (Security ([d3dc47b](https://github.com/qinnovates/qinnovate/commit/d3dc47b))


## 2026-03-14

### Added
- Add Tools section to README — link Conductor, NeuroSIM, macshield ([ee7c67f](https://github.com/qinnovates/qinnovate/commit/ee7c67f))
- TARA domain taxonomy, dual lens system, UI component library, and site overhaul ([d988ead](https://github.com/qinnovates/qinnovate/commit/d988ead))


## 2026-03-13

### Fixed
- Scope BCI Vision dark mode to homepage and /vision/ only ([144621a](https://github.com/qinnovates/qinnovate/commit/144621a))


## 2026-03-12

### Added
- AI Security Ethics v0.1 — ethical AI conduct proposal for neural security ([a6b849d](https://github.com/qinnovates/qinnovate/commit/a6b849d))

### Updated
- Unify all timelines through KQL, fix Kinect claims, add AI ethics sidebar ([6be7f48](https://github.com/qinnovates/qinnovate/commit/6be7f48))
- Remove glossary page from website, keep in whitepaper only ([8d3cf35](https://github.com/qinnovates/qinnovate/commit/8d3cf35))
- NISS v1.1 in whitepaper, The Gap section, BCI Vision toggle persistent ([8b47778](https://github.com/qinnovates/qinnovate/commit/8b47778))
- Whitepaper: add consent-based vision restoration and legislative engagement section ([9f2b47e](https://github.com/qinnovates/qinnovate/commit/9f2b47e))

### Fixed
- BCI Vision toggle: CTF triple-click now works, AI Security Ethics tagline ([832a9b7](https://github.com/qinnovates/qinnovate/commit/832a9b7))

### Docs
- add Spotify link to Principles of Ethics ([34fd47d](https://github.com/qinnovates/qinnovate/commit/34fd47d))

### Other
- deps(npm): Bump devalue from 5.6.3 to 5.6.4 (#29) ([a8b56e4](https://github.com/qinnovates/qinnovate/commit/a8b56e4))
- update news feed cache [skip ci-deploy] ([3d98638](https://github.com/qinnovates/qinnovate/commit/3d98638))


<!-- changelog-marker: 888a6e1 -->

## 2026-03-11

### Added
- **Brain Map SIEM dashboard** — new default tab on Clinical View with 3-panel SOC-style layout ([888a6e1](https://github.com/qinnovates/qinnovate/commit/888a6e1))
  - HourglassSpine: compact vertical 11-band display with threat counts
  - BrainSvg: medial brain view with 38 clickable region hotspots, animated connection lines
  - CascadePanelStack: drill-down panels (Pathways, Neurotransmitters, Molecules, DSM Outcomes)
  - HeatmapMatrix: Technique x Band and Technique x DSM correlation grids with cross-highlighting
  - BreadcrumbBar: selection path navigation (Band > Region > Pathway > NT > DSM)
- **KQL query engine on all atlas pages** — index, clinical, scoring, TARA, therapeutics ([888a6e1](https://github.com/qinnovates/qinnovate/commit/888a6e1))
- Neuroscience data expansion: receptors (83KB), glial cells, cranial nerves, neurovascular, neuroendocrine — 6 new JSON sources ([4addb6f](https://github.com/qinnovates/qinnovate/commit/4addb6f))
- KQL table support for clinical dashboard ([6890a99](https://github.com/qinnovates/qinnovate/commit/6890a99))
- NISS Neurological Extension documentation: 42 conditions across 7 categories, impact chains, KQL examples

### Updated
- KQL engine v2: hash indexes, joins, array-aware operators, security limits (4KB/12ops/50K rows/2s) ([03e0c2e](https://github.com/qinnovates/qinnovate/commit/03e0c2e))
- KQL security limits, table extraction, clinical techniques zoom, pathway DSM mappings ([2049e9e](https://github.com/qinnovates/qinnovate/commit/2049e9e))
- Brain atlas: detailed mechanics for all 38 regions with click-to-expand UI ([10e6c85](https://github.com/qinnovates/qinnovate/commit/10e6c85))
- Whitepaper v8 Section 19, Runemate neural OS vision, vision page UX ([1257d1c](https://github.com/qinnovates/qinnovate/commit/1257d1c))
- Data lake dashboard: funding rounds, investor intel, neurotransmitter systems ([fd4cc29](https://github.com/qinnovates/qinnovate/commit/fd4cc29))
- NP metric expanded to 4 levels: N(0), T(3.3), P(6.7), S(10.0)
- All 109 TARA techniques recalculated — 26 scores changed, 2 severity shifts
- KQL techniques table: 8 new NISS columns

### Fixed
- Data lake integrity: region aliases, TARA IDs, DSM expansion ([ed87b1a](https://github.com/qinnovates/qinnovate/commit/ed87b1a))
- BCI funding chart: logarithmic visualization, iframe 404 ([1f47c30](https://github.com/qinnovates/qinnovate/commit/1f47c30))
- GitHub Pages actions: stable tags replacing broken SHAs ([0337d3b](https://github.com/qinnovates/qinnovate/commit/0337d3b))

### Research
- QIF Whitepaper v8.0 working draft ([6dbe537](https://github.com/qinnovates/qinnovate/commit/6dbe537))
- Whitepaper v8: Appendix C (Version History v7.0 → v8.0)

## 2026-03-10

### Added
- Autodidactive: auditory learning module with Deep Encode generator ([2e93b52](https://github.com/qinnovates/qinnovate/commit/2e93b52))
- Disclaimer, BCI testing ethics, and liability terms ([bf6d44e](https://github.com/qinnovates/qinnovate/commit/bf6d44e))
- Ethics timeline wall + Principles of Ethics artist statement ([d4f3e77](https://github.com/qinnovates/qinnovate/commit/d4f3e77))
- Max Hodak blog post, citation sync, autodidactive updates, brain viz ([0cbdd29](https://github.com/qinnovates/qinnovate/commit/0cbdd29))
- Site restructure: intel feed page, TARA sub-pages, pipeline alerting ([b737f33](https://github.com/qinnovates/qinnovate/commit/b737f33))

### Updated
- Consolidate APIs, Feeds & SDKs into /research/api/ ([8b25850](https://github.com/qinnovates/qinnovate/commit/8b25850))
- About page: security engineer and BCI researcher identity ([2c96b14](https://github.com/qinnovates/qinnovate/commit/2c96b14))
- About: AGFX was Photoshop/digital art community in Web 1.0 ([166316b](https://github.com/qinnovates/qinnovate/commit/166316b))
- Intel feed: expand from 50 to 74 sources with scholarly + financial feeds ([562335b](https://github.com/qinnovates/qinnovate/commit/562335b))
- Nav: nested group structure with mobile sub-accordions ([5c80ba6](https://github.com/qinnovates/qinnovate/commit/5c80ba6))
- Atlas page redesign + commit brain.glb model ([682b786](https://github.com/qinnovates/qinnovate/commit/682b786))
- Connect phosphene browser to Runemate concept ([3068ba8](https://github.com/qinnovates/qinnovate/commit/3068ba8))
- Blog: rewrite in Kevin's voice, weave in TARA clinical dual-lens ([3897286](https://github.com/qinnovates/qinnovate/commit/3897286))
- Blog: rewrite title and intro to lead with ADHD scenario + TARA mappings ([c12d959](https://github.com/qinnovates/qinnovate/commit/c12d959))
- Reframe blog as case study: How Ethical Hackers Can Cure Blindness ([92f09ea](https://github.com/qinnovates/qinnovate/commit/92f09ea))
- Autodidactive: integrate all QIF content + redesign Notes with local AI mind mapping ([809ce8f](https://github.com/qinnovates/qinnovate/commit/809ce8f))
- Consolidate nav to 3 items, add Vision consent gate ([4495698](https://github.com/qinnovates/qinnovate/commit/4495698))

### Fixed
- Security hardening from red team audit — 8 fixes across 13 files ([9667f9c](https://github.com/qinnovates/qinnovate/commit/9667f9c))
- Rename Defense Stack to Neurosecurity Stack + security hardening ([4b1e2cf](https://github.com/qinnovates/qinnovate/commit/4b1e2cf))
- Harden feed scripts: XXE protection, URL defanging, input sanitization ([8cd95a4](https://github.com/qinnovates/qinnovate/commit/8cd95a4))
- Harden CI workflows, secrets, and .gitignore from security scan ([7379240](https://github.com/qinnovates/qinnovate/commit/7379240))
- Nav group "Governance" to "Neuroethics" — neurorights stem from neuroethics ([e70846c](https://github.com/qinnovates/qinnovate/commit/e70846c))
- Nav label "Team & Founder" to "About Me" ([7f5c0e8](https://github.com/qinnovates/qinnovate/commit/7f5c0e8))

## 2026-03-07

### Updated
- BCI Vision hero: ONI concentric spheres from original site ([63fa824](https://github.com/qinnovates/qinnovate/commit/63fa824))


## 2026-03-06

### Updated
- Site consolidation: 5-pillar architecture, audit fixes, broken link repair ([d3cad74](https://github.com/qinnovates/qinnovate/commit/d3cad74))


## 2026-03-05

### Updated
- Add BrainFlow data source disclaimer to validation page ([7861307](https://github.com/qinnovates/qinnovate/commit/7861307))


## 2026-03-04

### Research
- Neurogovernance: add ethical foundations lineage and 8 new citations ([0dc1877](https://github.com/qinnovates/qinnovate/commit/0dc1877))

### Other
- update news feed cache [skip ci-deploy] ([dd1a9c1](https://github.com/qinnovates/qinnovate/commit/dd1a9c1))

## 2026-03-03

### Other
- update news feed cache [skip ci-deploy] ([50cedb7](https://github.com/qinnovates/qinnovate/commit/50cedb7))

## 2026-03-02

### Other
- update news feed cache [skip ci-deploy] ([a699446](https://github.com/qinnovates/qinnovate/commit/a699446))




## 2026-03-01

### Updated
- About page: update closing line ([0235313](https://github.com/qinnovates/qinnovate/commit/0235313))
- About: AGFX origin story, web 1.0 to 5.0 closing line ([ceaa0de](https://github.com/qinnovates/qinnovate/commit/ceaa0de))

### Fixed
- remove detailed AGFX paragraphs from About page ([89a7942](https://github.com/qinnovates/qinnovate/commit/89a7942))
- remove detailed AGFX platform paragraph from About ([24fb8ee](https://github.com/qinnovates/qinnovate/commit/24fb8ee))
- remove co-founder name from public About page ([a419328](https://github.com/qinnovates/qinnovate/commit/a419328))

## 2026-02-28

### Research
- Endogenous neural attack chain case study + heart-brain coherence derivation ([1a4ac37](https://github.com/qinnovates/qinnovate/commit/1a4ac37))

### Updated
- Rights-first site architecture + CA/MI resolution ([770546c](https://github.com/qinnovates/qinnovate/commit/770546c))
- TARA detail: inline Governance + Neural Impact in 2-column layout ([ce07f4b](https://github.com/qinnovates/qinnovate/commit/ce07f4b))
- Add plain-English summary and WebGL banner to case study ([cb374dd](https://github.com/qinnovates/qinnovate/commit/cb374dd))
- Restructure site navigation and homepage for narrative arc ([7d79292](https://github.com/qinnovates/qinnovate/commit/7d79292))
- Upgrade case study visualizations to animated/interactive ([ecd40dc](https://github.com/qinnovates/qinnovate/commit/ecd40dc))
- Add 3D brain visualization to all TARA technique pages ([5b2ccf8](https://github.com/qinnovates/qinnovate/commit/5b2ccf8))

### Fixed
- remove PII and private correspondence from public repo ([d1f62de](https://github.com/qinnovates/qinnovate/commit/d1f62de))

### Docs
- reframe case study disclaimer to acknowledge neuroethical work ([23ae05a](https://github.com/qinnovates/qinnovate/commit/23ae05a))
- add brief PTSD origin context to homepage narrative ([df067ee](https://github.com/qinnovates/qinnovate/commit/df067ee))

### Other
- update news cache, add auditory learning docs, gitignore SOPs ([0112bb8](https://github.com/qinnovates/qinnovate/commit/0112bb8))

## 2026-02-27

### Research
- MITRE ATT&CK contribution strategy for BCI threat techniques ([ddd0763](https://github.com/qinnovates/qinnovate/commit/ddd0763))

### Added
- Research outreach tracker with tiered engagement plan ([c73ccfb](https://github.com/qinnovates/qinnovate/commit/c73ccfb))

### Updated
- Add Sovereignty Attacks section to Neurowall docs and tools page ([d781996](https://github.com/qinnovates/qinnovate/commit/d781996))
- README: fix 3 broken links, sync stale content, add CVSS SIG ([10c8d46](https://github.com/qinnovates/qinnovate/commit/10c8d46))
- NISS page: add Source & Derivation section with repo links ([652a995](https://github.com/qinnovates/qinnovate/commit/652a995))
- Timeline: NISS v1.1, preprint v1.5, CVSS SIG milestones ([0762890](https://github.com/qinnovates/qinnovate/commit/0762890))
- Nav tools dropdown, tools page, news cache refresh ([6d5de1f](https://github.com/qinnovates/qinnovate/commit/6d5de1f))

### Fixed
- Add frontmatter to governance docs for content collection schema ([7742939](https://github.com/qinnovates/qinnovate/commit/7742939))

### Docs
- add ATLAS case studies for P300 side-channel and calibration poisoning ([9bac5fc](https://github.com/qinnovates/qinnovate/commit/9bac5fc))
- add MITRE ATLAS pre-flight email and SSVEP case study draft ([04d2db9](https://github.com/qinnovates/qinnovate/commit/04d2db9))
- Remove Sawdust reference from README ([46a62d6](https://github.com/qinnovates/qinnovate/commit/46a62d6))

## 2026-02-26

### Research
- NISS v1.1: CR/CD weight normalization (Phase 16 cross-AI validated) ([c3fb93f](https://github.com/qinnovates/qinnovate/commit/c3fb93f))
- Preprint v1.5: 109 techniques, NISS v1.1 (6 metrics), cross-AI validated ([f9e88ed](https://github.com/qinnovates/qinnovate/commit/f9e88ed))

### Updated
- Sync all docs, site, and data to NISS v1.1 / preprint v1.5 ([a3150dd](https://github.com/qinnovates/qinnovate/commit/a3150dd))

### Docs
- Recompile preprint v1.5 with weight normalization in version note ([0f1649b](https://github.com/qinnovates/qinnovate/commit/0f1649b))

## 2026-02-25

### Research
- NISS v1.1: Split CG (Cognitive Integrity) into CR + CD ([78dfb77](https://github.com/qinnovates/qinnovate/commit/78dfb77))

### Updated
- Wiki index, email obfuscation, derivation log cleanup, CRB tools ([566ebd2](https://github.com/qinnovates/qinnovate/commit/566ebd2))





## 2026-02-20

### Other
- UI enhancements and initial Atlas architecture implementation ([0837b73](https://github.com/qinnovates/qinnovate/commit/0837b73))
- Bump devalue from 5.6.2 to 5.6.3 ([cf6302c](https://github.com/qinnovates/qinnovate/commit/cf6302c))
- update news feed cache [skip ci-deploy] ([ae20446](https://github.com/qinnovates/qinnovate/commit/ae20446))

## 2026-02-19

### Other
- update news feed cache [skip ci-deploy] ([a8e74e5](https://github.com/qinnovates/qinnovate/commit/a8e74e5))

## 2026-02-18

### Research
- N1 validation + glossary sync + research sources sync ([5366de1](https://github.com/qinnovates/qinnovate/commit/5366de1))
- Add QIF-T0103 SSVEP frequency hijack, neural steganography blog, research infrastructure ([9f3bdd7](https://github.com/qinnovates/qinnovate/commit/9f3bdd7))

### Added
- Add Entry 68: Full raw research session (guardrails, SSVEP, thalamic gate) ([c44d076](https://github.com/qinnovates/qinnovate/commit/c44d076))
- Add research disclaimer to README, update TARA count to 103 ([0a21ba0](https://github.com/qinnovates/qinnovate/commit/0a21ba0))
- Add detection methods section to T0103 blog + ethics code intent statement ([d6185dd](https://github.com/qinnovates/qinnovate/commit/d6185dd))
- Add physics feasibility tier to TARA API and data layer ([f2dffd8](https://github.com/qinnovates/qinnovate/commit/f2dffd8))
- Add BCI limits blog post + physics feasibility tiering of 102 TARA techniques ([ca6ee60](https://github.com/qinnovates/qinnovate/commit/ca6ee60))
- Add claudeq mode, reverse derivation log order, remove stale file ([57e81ad](https://github.com/qinnovates/qinnovate/commit/57e81ad))
- Add unified Brain-BCI Atlas (v1.2.0), derivation entries 56-61, RAW mode policy ([8358362](https://github.com/qinnovates/qinnovate/commit/8358362))
- Add medical/accessibility considerations to Code of Conduct ([4b31d0c](https://github.com/qinnovates/qinnovate/commit/4b31d0c))
- Add governance wiki page and dynamic Code of Ethics ([6ebf1e8](https://github.com/qinnovates/qinnovate/commit/6ebf1e8))
- Add heebie-jeebies and familiarity line to brain rendering paragraph ([1684fe9](https://github.com/qinnovates/qinnovate/commit/1684fe9))
- Add Ethical Neurosecurity Code of Ethics to security page ([009d472](https://github.com/qinnovates/qinnovate/commit/009d472))
- Add AI use and preprint status disclaimer to Section 9.7 ([2db9fd6](https://github.com/qinnovates/qinnovate/commit/2db9fd6))
- Add security pipeline overview: TARA → NISS → NSP → Runemate ([999af36](https://github.com/qinnovates/qinnovate/commit/999af36))
- Add brain visualization to security page with security view as default ([acd4bd6](https://github.com/qinnovates/qinnovate/commit/acd4bd6))
- Add ellipsis before continue reading link on About page ([73c05bc](https://github.com/qinnovates/qinnovate/commit/73c05bc))
- Add vibecheck link to About banner, italicize byline ([beb7688](https://github.com/qinnovates/qinnovate/commit/beb7688))
- Add SoundCloud link to ABOUT.md ([cdbf5c2](https://github.com/qinnovates/qinnovate/commit/cdbf5c2))
- Add heart portrait to ABOUT.md with transparent background ([cc82ed7](https://github.com/qinnovates/qinnovate/commit/cc82ed7))

### Other
- Update qtara PyPI package to v0.2.0 with full enrichment data ([16de4e0](https://github.com/qinnovates/qinnovate/commit/16de4e0))
- Remove ASCII art vibecheck banner from About page ([1c32823](https://github.com/qinnovates/qinnovate/commit/1c32823))
- Remove Standards We're Inspired By section from README ([36e468d](https://github.com/qinnovates/qinnovate/commit/36e468d))
- Reframe website About page: concise, governance-focused ([60475e0](https://github.com/qinnovates/qinnovate/commit/60475e0))
- Reframe About page: governance and neuroethics focus ([aff1300](https://github.com/qinnovates/qinnovate/commit/aff1300))
- Trim ABOUT.md from 157 to 67 lines ([04c7a27](https://github.com/qinnovates/qinnovate/commit/04c7a27))
- Genericize tested techniques in README disclaimer ([b115b13](https://github.com/qinnovates/qinnovate/commit/b115b13))
- Mark BCI limits equation as needs-verification ([806f690](https://github.com/qinnovates/qinnovate/commit/806f690))
- Move BCI limits equation from blog to research doc ([e90b5aa](https://github.com/qinnovates/qinnovate/commit/e90b5aa))
- Wrap session: derivation Entry 67, SAIL Lab research doc, ethics wording fix ([149eab5](https://github.com/qinnovates/qinnovate/commit/149eab5))
- Update Project Timeline with missing entries 58-62 ([3a53fbe](https://github.com/qinnovates/qinnovate/commit/3a53fbe))
- Reverse QIF-FIELD-JOURNAL.md to newest-first order ([db1a0b3](https://github.com/qinnovates/qinnovate/commit/db1a0b3))
- Resolve news cache merge conflict (accept remote) ([adc5dcf](https://github.com/qinnovates/qinnovate/commit/adc5dcf))
- update news feed cache [skip ci-deploy] ([1219fa0](https://github.com/qinnovates/qinnovate/commit/1219fa0))
- Retroactive research sources sync + mandatory sync protocol ([449de0a](https://github.com/qinnovates/qinnovate/commit/449de0a))
- Update wording: intersection of my self-actualization checklist ([ceec24a](https://github.com/qinnovates/qinnovate/commit/ceec24a))
- Rewrite doctor/blood paragraph in about page ([ca2cf2c](https://github.com/qinnovates/qinnovate/commit/ca2cf2c))
- Update trash pickup detail in about page ([281d2ab](https://github.com/qinnovates/qinnovate/commit/281d2ab))
- Remove em dashes from life compass paragraph ([e1126b4](https://github.com/qinnovates/qinnovate/commit/e1126b4))
- Update life compass: "make a change for the better" ([b3b897d](https://github.com/qinnovates/qinnovate/commit/b3b897d))
- Reframe My Life Compass section with service and volunteering story ([fab2bb8](https://github.com/qinnovates/qinnovate/commit/fab2bb8))
- Move Signal Authentication and Scale-Frequency sections to bottom of security page ([014a64f](https://github.com/qinnovates/qinnovate/commit/014a64f))
- Remove em dashes from AI disclaimer ([5d6bb43](https://github.com/qinnovates/qinnovate/commit/5d6bb43))
- Rewrite preprint AI disclaimer in first-person voice ([cf94b1f](https://github.com/qinnovates/qinnovate/commit/cf94b1f))
- Fix hotspot color thresholds so Neocortex (highest count) is red ([86cb8cf](https://github.com/qinnovates/qinnovate/commit/86cb8cf))
- Update bio to ethical neurosecurity researcher, add ethical hacker CTA ([2e4869b](https://github.com/qinnovates/qinnovate/commit/2e4869b))
- Fix wording: aspiring (not aspirational) neurosecurity researcher ([fe615c0](https://github.com/qinnovates/qinnovate/commit/fe615c0))
- Update bio: aspirational neurosecurity researcher ([86f7463](https://github.com/qinnovates/qinnovate/commit/86f7463))
- Update ethics wording: engrained with these principles at its heart ([f8f5f8b](https://github.com/qinnovates/qinnovate/commit/f8f5f8b))
- Shorten Questions Ahead section on About page ([9aa1b7c](https://github.com/qinnovates/qinnovate/commit/9aa1b7c))
- Tighten About page: trim What I Found, shorten Path Here ([87ddae6](https://github.com/qinnovates/qinnovate/commit/87ddae6))
- Consistent hotspot colors across all views: red (highest), orange, yellow (lowest) ([9631390](https://github.com/qinnovates/qinnovate/commit/9631390))
- Rewrite Apple blog: EEG AirPods, subvocalization, seizure detection ([8bb60e5](https://github.com/qinnovates/qinnovate/commit/8bb60e5))
- Per-view brain wireframe colors: blue (security), green (clinical), purple (governance) ([8014620](https://github.com/qinnovates/qinnovate/commit/8014620))
- Use red-orange-yellow for clinical brain view hotspots ([75d7d0f](https://github.com/qinnovates/qinnovate/commit/75d7d0f))
- Update Path Here section: trim HP paragraph, add continue reading link ([7d91f38](https://github.com/qinnovates/qinnovate/commit/7d91f38))
- Use green tones for clinical brain view hotspots ([2fbdb2a](https://github.com/qinnovates/qinnovate/commit/2fbdb2a))
- Adjust SoundCloud start time to 8s ([b2c1f32](https://github.com/qinnovates/qinnovate/commit/b2c1f32))
- Adjust SoundCloud start time to 9s ([f92d650](https://github.com/qinnovates/qinnovate/commit/f92d650))
- Revert Connect links to Markdown (GitHub strips target) ([3c5e0bc](https://github.com/qinnovates/qinnovate/commit/3c5e0bc))
- Open Connect links in new tab ([60bb5a4](https://github.com/qinnovates/qinnovate/commit/60bb5a4))
- Center top Connect links, add footer Connect links ([cc04004](https://github.com/qinnovates/qinnovate/commit/cc04004))
- Move Connect links to top of ABOUT.md ([7e847a9](https://github.com/qinnovates/qinnovate/commit/7e847a9))
- Rename SoundCloud link to Vibe Check ([14dc9ec](https://github.com/qinnovates/qinnovate/commit/14dc9ec))
- Use red for high severity hotspots instead of purple ([2fd74d9](https://github.com/qinnovates/qinnovate/commit/2fd74d9))
- Update About copy: months, My Life Compass, large companies ([7c3e872](https://github.com/qinnovates/qinnovate/commit/7c3e872))
- Change brain wireframe color from blue to purple ([c45b076](https://github.com/qinnovates/qinnovate/commit/c45b076))
- Sync ABOUT.md with website: add all sections up to Milestones ([1d10e79](https://github.com/qinnovates/qinnovate/commit/1d10e79))
- Restructure About page and ABOUT.md: move personal stories to GitHub, sync content ([9903c38](https://github.com/qinnovates/qinnovate/commit/9903c38))
- Update About page copy: natural voice, fix payment count ([2c5c3ff](https://github.com/qinnovates/qinnovate/commit/2c5c3ff))
- Revert README banner to original SVG divider ([d6f0769](https://github.com/qinnovates/qinnovate/commit/d6f0769))
- Update README ASCII banner to calvin_s font ([1e4d9cf](https://github.com/qinnovates/qinnovate/commit/1e4d9cf))
- Clean up README.md by removing decorations ([68e65cc](https://github.com/qinnovates/qinnovate/commit/68e65cc))

## 2026-02-14

### Other
- ci: bump actions/checkout from 4 to 6 ([7770824](https://github.com/qinnovates/qinnovate/commit/7770824))


## 2026-02-24

### Added
- Add learning pages, BCI economic analysis, and CLAUDE.md cleanup ([4161a98](https://github.com/qinnovates/qinnovate/commit/4161a98))

### Updated
- Autodidactive v2.1: web search fallback, Tier 3 LLM providers, settings UI ([17ed23f](https://github.com/qinnovates/qinnovate/commit/17ed23f))

### Other
- update news feed cache [skip ci-deploy] ([a551ca8](https://github.com/qinnovates/qinnovate/commit/a551ca8))


## 2026-02-23

### Other
- update news feed cache [skip ci-deploy] ([e3103af](https://github.com/qinnovates/qinnovate/commit/e3103af))



## 2026-02-22

### Docs
- update README tables with current versions and new components ([d6e2ba4](https://github.com/qinnovates/qinnovate/commit/d6e2ba4))


## 2026-02-21

### Added
- Living validation system: dashboard, TARA badges, README overhaul ([8922fe1](https://github.com/qinnovates/qinnovate/commit/8922fe1))
- BCI Research hub, unified QIF API, project timeline ([971278a](https://github.com/qinnovates/qinnovate/commit/971278a))
- Project status table with implementation tracking ([49d4087](https://github.com/qinnovates/qinnovate/commit/49d4087))
- BrainFlow EEG validation: 5/5 attacks detected, 0% FPR ([9976932](https://github.com/qinnovates/qinnovate/commit/9976932))
- neurosim/qif-attack-simulator: standalone attack generation toolkit ([0ed0dcd](https://github.com/qinnovates/qinnovate/commit/0ed0dcd))
- Neurowall v0.6: spectral peak detection, CUSUM, ROC, multi-band EEG ([9ddae32](https://github.com/qinnovates/qinnovate/commit/9ddae32))
- Table of contents and timestamps to Neurowall derivation log ([445be26](https://github.com/qinnovates/qinnovate/commit/445be26))

### Updated
- Derivation log, NSP spec, Neurowall blog, site updates ([753bbfc](https://github.com/qinnovates/qinnovate/commit/753bbfc))

### Fixed
- Add validation-registry.json (deploy fix) ([26dcb35](https://github.com/qinnovates/qinnovate/commit/26dcb35))
- Add untracked components and pages (deploy fix) ([7bd93b4](https://github.com/qinnovates/qinnovate/commit/7bd93b4))
- Add missing bci-data.ts to git (deploy fix) ([e76d664](https://github.com/qinnovates/qinnovate/commit/e76d664))
- Sort field journal entries newest-first on news page ([066d008](https://github.com/qinnovates/qinnovate/commit/066d008))
- Correct TARA registry stats (102 -> 103 sum) ([9d60fd7](https://github.com/qinnovates/qinnovate/commit/9d60fd7))
- Downgrade bot-blocked 403s to warnings in citation verification ([c9f61dd](https://github.com/qinnovates/qinnovate/commit/c9f61dd))
- Exclude READMEs from content collections, add missing frontmatter ([bc1c76e](https://github.com/qinnovates/qinnovate/commit/bc1c76e))

### Docs
- Add on-device guardrail motivation to BrainFlow validation ([ad2fe53](https://github.com/qinnovates/qinnovate/commit/ad2fe53))
- Add BrainFlow validation results (Entry 011) to README and derivation log ([0879ed6](https://github.com/qinnovates/qinnovate/commit/0879ed6))
- Add Project Firefly to neurorights map ([5a762c1](https://github.com/qinnovates/qinnovate/commit/5a762c1))
- Add neurorights map to root README ([651eec2](https://github.com/qinnovates/qinnovate/commit/651eec2))
- Add all five neurorights to macshield pointer ([0477be8](https://github.com/qinnovates/qinnovate/commit/0477be8))
- Add Fair Access to Mental Augmentation neuroright context ([d84d868](https://github.com/qinnovates/qinnovate/commit/d84d868))
- Expand macshield pointer with audience disclaimer and overview ([f453de5](https://github.com/qinnovates/qinnovate/commit/f453de5))
- Add TOCs and READMEs across 11 directories ([2ac65fa](https://github.com/qinnovates/qinnovate/commit/2ac65fa))
- Add enterprise disclaimer, TOC, student VPN guide, QIF mapping ([729ae56](https://github.com/qinnovates/qinnovate/commit/729ae56))

### Other
- Governance merges + archive cleanup + autodidactive removal ([787a337](https://github.com/qinnovates/qinnovate/commit/787a337))
- Consolidate repo structure: 17+ top-level dirs down to 8 ([5c3ac1c](https://github.com/qinnovates/qinnovate/commit/5c3ac1c))
- Reorder derivation log entries chronologically (001-009) ([01e3fca](https://github.com/qinnovates/qinnovate/commit/01e3fca))
