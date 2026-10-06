# Independent fact-check of the 2026-10 refresh: Quorum review and source verification

Run date: 2026-10-06. Scope: `research-delta`, `market-delta`, `eeg-delta` (.md and .json). Per-item verdicts are in `verification-verdicts.json` (195 records). Nothing outside `_staging/2026-10-refresh/` was written; scratch files are in the session scratchpad.

## Bottom line

- **No fabricated citation found.** All 53 DOIs and 29 arXiv IDs cited as live in `research-delta.json` resolve. Title, first author and year match the proposals. The three DOIs that do not resolve are the ones the artifact itself reports as broken: C57 `10.1109/TNSRE.2024.3392037`, C88 `10.1088/1741-2552/ac0f4e`, and the DataCite arXiv DOI, which Crossref does not hold. I found no finding that reverses the direction of its source.
- **6 BLOCKED items.** All are statements that the artifacts' own files or the baselines contradict. None is a fake source.
- **38 FLAGGED items.** Most are status upgrades or VERIFIED labels that go further than abstract-level evidence, or md summaries that drop caveats the JSON keeps.

## Did the Quorum skill run?

Yes, partly. I invoked the `quorum` skill. It loaded its orchestration instructions, and I ran them as follows:

- **Phase 1 ran.** 12 independent panelists worked in parallel: 4 personas for each of the 3 artifacts (Methodology Reviewer, Fact Checker [adversarial], Devil's Advocate [adversarial], Domain Outsider). Mode was review, rigor high, `--no-web`, read-only.
- **Phase 2 triage and Phase 5 validation ran.** I did both myself. Phase 5 was the web verification described below.
- **Deviations from the skill's default, stated plainly:**
  - Each panel had 4 agents, not 5.
  - There was no Phase 3 debate round between agents.
  - There was no Gemini or Codex panel.
  - The skill's docs/ARCHITECTURE.md and PROMPTS.md are not installed locally, so I wrote the prompts from SKILL.md.
- Every panelist confirmed it used no web access and found no embedded instructions in the reviewed files.

### Panel confidence that each artifact is free of fabricated citations or values

| Artifact | Methodology | Fact Checker | Devil's Advocate | Outsider |
|---|---|---|---|---|
| research-delta | 0.55 | 0.45 | 0.55 | 0.55 |
| market-delta | 0.6 (0.25 that its conclusions stay within the evidence) | 0.6 | 0.55 | 0.55 |
| eeg-delta | 0.6 | 0.5 | 0.55 | 0.55 |

### What the panel blocked, and how web verification adjudicated it

| Panel BLOCK | Panelists | Result after verification |
|---|---|---|
| research R-067: flooding and jamming come from "the same simulations (C107; Neurocomputing 2025)" | 3/4 | **Downgraded to FLAG.** The IEEE Access 2020 paper (C107) covers flooding and scanning only. Neurocomputing 2025 does evaluate flooding and jamming together, so the premise holds in part. |
| research R-036 VERIFIED although "content not read" | 1/4 (1 FLAG) | **FLAG.** The citation is real. The label breaks the file's own convention. |
| research T0009 status ignores the registrar's "CAUTION 2026-07-31" note | 1/4 (2 FLAG) | **FLAG.** Upheld on substance (see R-063). |
| research md: "TARA does not list ... federated poisoning" | 1/4 (3 FLAG) | **BLOCK upheld.** The T0024 notes name federated learning as a poisoning entry point. |
| market M-048: MindMaze CHF 8.0M financing listed as new | 4/4 | **BLOCK upheld.** The baseline already records it (June 2026). |
| market md: 46% spread is "the same spread ... for 2024" | 4/4 | **BLOCK upheld.** The baseline 2024 range is 1.6 to 4.02, a 151% spread. |
| market md: "site's headline statistic 62/70 to 58/70" | 3/4 | **Downgraded to FLAG.** 62/70 is correct against the brief's designated baseline (the sibling copy). The published worktree file is 59/67. I did not check the live site. |
| eeg: NextSense and Earable notes say "Verified 2026-10-06" while the items are UNVERIFIED | 4/4 | **BLOCK upheld.** |
| eeg md: "Proposals leave these null" (Nissan, Hyundai Mobis) | 2/4 (1 FLAG) | **BLOCK upheld.** The JSON sets `none_published` and `established` for both. |

### Panel suspicions that verification closed

- **K261604 (Enobio Dx) decided on a Saturday.** openFDA itself reports 2026-06-13. The artifact copied the record faithfully.
- **Beacon openFDA row dated 2026-08-25.** This matches K261747 "Report Studio", a software clearance. It is not a hidden headband record.
- **arXiv:2609.30037**, with its high sequence number and cs.CV listing: it resolves to the AERIAL paper and its abstract figures match.
- **arXiv:2601.06040 "(2025)".** v1 was submitted 2025-12-15, so 2025 is correct.
- **Menuet 2022 DOI.** It resolves, and the metadata matches.
- **INBRAIN NCT06368310.** The intervention is the "INBRAIN Graphene Cortical Interface", and INBRAIN is a collaborator.
- **The 8-K "report dated 2026-09-07" (Labor Day).** This is the real Date of Report. It updates an initial 8-K filed 2026-08-26.
- **`cves_known: []` on new EEG companies.** NVD keyword searches return 0 for 11 of the 14 vendor and product keywords tried. The Cumulus and FRENZ hits are unrelated products. The NextSense, Enobio and Hyundai Mobis queries hit the rate limit and stay unchecked.

## Direct verification performed

- **Research identifiers.**
  - Every DOI was resolved at api.crossref.org. The two broken ones were also checked at the doi.org handle API; both return "handle not found".
  - Every arXiv ID was resolved at arxiv.org/abs.
  - Abstracts came from Crossref, OpenAlex or Semantic Scholar.
  - I read full text (arXiv HTML) for NERVE, Tapal and Bagley, E-MagDiP, and Bagley and Petritsch v4.
- **The 15 claimed catalogue defects.**
  - Confirmed: C52, C57, C88, C75, C80, C77 and C113, C49, C51, C54, C59, C62, C63, B1.
  - Partly refuted: C58. Its "A3E" title is the arXiv v2 title, abbreviated.
  - Identity assumed, as the artifact says: C56.
- **The two "not found" sources: "Zhang et al. 2024" (T0009) and "Lopez-Moreno et al. 2024" (T0025 to T0028).**
  - I searched Crossref, OpenAlex, Semantic Scholar (bulk endpoint) and arXiv, and found neither.
  - Nearest real works:
    - Hossen, Tu and Hei 2023, physical signal injection on EEG systems, `10.1145/3591197.3591304`.
    - Lopez Madejska et al. 2024, Wireless Networks, `10.1007/s11276-023-03649-2`.
  - Two Semantic Scholar relevance queries returned HTTP 429.
  - These searches support keeping both sources UNVERIFIED. They do not prove the papers do not exist.
- **Bagley PDF.** I read it myself. Pages are in `verification-verdicts.json`.
  - Title confirmed. The printed author is "Bryce Allen Bagley"; arXiv lists "Bryce-Allen Bagley". The ID is arXiv:2607.10451v1. The paper has 25 pages and 175 references.
  - All 22 attributed threat vectors appear on pp. 2 to 13, including the Figure 2 boxes on p. 11.
  - Two section labels differ from the printed headings:
    - The printed heading of 2.3.2 is "Man-in-the-middle Attacks", but its text is about RF signal injection [13].
    - The printed heading of 2.2.1.1 is "Physical Substrate and Information Processing".
  - "Cogits" appears once, on p. 14, marked [23]. [23] is Ienca et al. 2018; Bagley and Petritsch is [16].
- **arXiv:2403.07945 on cogits.** Cogits are "qubit analogues" named after "Cogito ergo sum". The paper calls them a general vector of cognitive state variables and says the term "in no way" implies quantum cognition. Its hypothesis 2 links cogit statistics to how distinguishable individuals are.
- **Market.** I re-fetched every VERIFIED item that changes posture, funding, valuation, regulatory status or CVEs, plus a sample: MedTech Dive, TNW, Paradromics, Medical Economics, Neuralink, Sacra, Boston Scientific, the SEC 8-K, Medtronic, LivaNova, NVD, ClinicalTrials.gov API (18 NCT records), BioSpace, Digital Health News, 36Kr, Substack, Meticulous, Towards Healthcare and HLTH.
- **EEG.** openFDA queries for 15 applicants, the company pages, the NVD keyword searches, and both B2V papers (Crossref and OpenAlex).

## Counts by verdict

| Artifact | CONFIRMED | FLAGGED | BLOCKED |
|---|---|---|---|
| research-delta (items and md claims) | 78 | 19 | 1 |
| research-delta (Bagley paper checks) | 29 | 0 | 0 |
| market-delta | 34 | 13 | 2 |
| eeg-delta | 10 | 6 | 3 |
| **Total** | **151** | **38** | **6** |

## BLOCKED (6)

1. **research-delta.md, "What changed" item 3.** "TARA does not list ... federated poisoning" is contradicted by the QIF-T0024 notes ("Federated learning and crowd-sourced calibration data are vulnerable entry points"). The claim holds only for model stealing and registry substitution.
2. **market M-048 (MindMaze).** The stated current value "no mention" is wrong: the baseline already records the CHF 8.0M Neuro.io financing (June 2026).
3. **market-delta.md, market section.** "46% ... the same spread the dataset already shows for 2024" is wrong; the baseline 2024 spread is 151% (1.6 to 4.02).
4. **eeg-delta.md, schema gap 2.** "Proposals leave these null" is contradicted by the JSON, which sets `security_posture: none_published` and `company_category: established` for Nissan and Hyundai Mobis.
5. **eeg items[9] (NextSense).** `security_notes` says "Verified 2026-10-06 via SoundGuys" in an item marked UNVERIFIED.
6. **eeg items[10] (Earable FRENZ).** `security_notes` says "Verified 2026-10-06 via frenzband.com" in an item marked UNVERIFIED. The fetch returned 429 and the text came from a summary.

## FLAGGED (38)

### Research (19)

- **R-002:** says the paper "states both hypotheses are unvalidated extensions". The paper calls them "rather tame ... derived from established results".
- **NERVE md, delta 2:** "MitM on three consumer headsets". MitM was shown on the NeuroSky and Muse apps; passive sniffing covered all three devices. In R-004 the 61.0% figure is the better of two subjects ("up to").
- **R-036:** marked VERIFIED although the survey was not read. Crossref gives the first author's surname as "Sayah Ben Aissa".
- **R-057 (C56):** the replacement is an assumed identity but is filed as "verified".
- **R-058 (C58):** "A3E" is the arXiv v2 title, so the title defect is overstated. The first-author defect stands.
- **md delta 1:** "Sixteen rows". C113 is correct, so 15 rows are defective.
- **R-063 (T0009 to DEMONSTRATED):** supported only for analog-front-end RF injection. The proposal ignores the registrar's caution that T0009 should be split. E-MagDiP is benign noise coupling.
- **R-075:** the replacement sources omit C78 (jamming) and cover nothing for T0028 (selective forwarding).
- **R-067:** C107 covers flooding and scanning, not jamming. The proposed status value is not in the enum.
- **R-065 (T0020) and R-066 (T0032):** DEMONSTRATED on abstracts that give no rates. The JSON says bare "DEMONSTRATED" where the md says "(dataset level)" or "or keep".
- **R-068:** the value "EMERGING (simulation only)" is not in the enum.
- **R-072:** the source substitution is an inference but is labelled VERIFIED.
- **R-080:** a new card at DEMONSTRATED resting on an abstract, with no chance level, class count or N.
- **R-086:** overlaps T0024.
- **R-091:** category "academia" conflicts with the artifact's own note that Cerberus is neither academia nor industry.
- **md (c):** says no status definitions were found. `datalake/README.md` "Status Levels" defines them.
- **md (a):** five technique mappings (T0029, T0030, T0122, T0037, T0040) exist only in the md, not in the JSON.
- **md (b), Gao row:** drops the JSON's "not identification" limit.

### Market (13)

- **M-002:** valuation 1,000,000,000 against a source that says "just over $1bn" via the NYT. The item is UNVERIFIED and should not populate the field.
- **md finding 3 (Paradromics):** drops the condition "once an agreed-upon deployment and testing process" is complete.
- **M-010 and M-011 (Neuralink):** the VDP page body renders client-side. Only the title and meta description ("our services") are readable, so "no bug bounty found" and the scope are unsupported. The trial facts are confirmed.
- **M-015:** the registry facts are confirmed. Calling the IDE note something that "conflicts with the registry" overreaches.
- **M-019:** the first_human value is the study start date, not a documented first implant.
- **M-022:** `fda_status: clinical_trial` rests on a Netherlands study (UMC Utrecht).
- **M-039:** the CVE list is incomplete. **CVE-2023-47800** (Natus NeuroWorks/SleepWorks before 8.4 GMA3, default `sa` password, RCE) is missing.
- **M-045 and M-047 (Neuracle):** 36Kr labels the company "BrainCo" throughout. The identification rests on the NEO product and the named founders.
- **M-056:** the 15.8% CAGR does not fit 2025 to 2035 (implies 17.5%).
- **md finding 1:** 62/70 against the sibling baseline versus 59/67 in the published file.
- **M-058:** "no BCI company with an audit or bug bounty" generalises from about 20 of 70 companies checked.

### EEG (6)

- **items[0] (Nissan):** posture and category set on the automaker, and `first_human` 2018-01 conflicts with the 2015 studies. The paper figures and the Gheorghe co-authorship are confirmed.
- **items[2] (Hyundai):** the 25.3% figure has no N or comparison in the source.
- **items[3] (Zeto):** no openFDA record is named "Zeto ONE"; K233403 is the "Flexset System". `fda_status: cleared` for Zeto ONE is unsupported.
- **items[7] (Cumulus):** marked VERIFIED although only the 510(k) record is verified.
- **items[11] (NAOX WAVE):** "not_applicable" for regulatory status is not on the page.
- **items[17] (Neurable):** 12 channels comes from the Research Kit page. That the consumer MW75 has the same hardware is unconfirmed.

## Not checked in this run

- **Research:**
  - R-046 (Pasternak, NDSS 2025).
  - R-093 (Connecticut SB 1295) and R-094 (ISO/IEC 8663:2025).
  - The C80 "Best Paper" note.
  - C62 "no DOI exists".
  - The effective date of Montana SB 163.
  - The Cerberus sitemap and 404 claims.
  - The findings of R-011 and R-047 (no abstract available).
  - The `verified_but_not_summarised` DOIs: resolved only, not compared.
- **Market:** items the artifact itself marks UNVERIFIED and that I did not re-fetch (M-012, M-024, M-036, M-043, M-044, M-046, M-057, M-062, M-063); the eight `last_verified` date bumps; the CISA ICSMA-18-137-01 page itself.
- **EEG:**
  - items[13] (Muse S Athena), items[18] (IDUN), and items[19], [21] and [22] (Bitbrain Hero and Air CE wording; the nissan-b2v inventory entry).
  - The Bitbrain B2V blog.
  - Ceribell's FedRAMP status on the FedRAMP marketplace.
  - The NVD searches for NextSense, Enobio and Hyundai Mobis, which hit the rate limit.

## Other observations

- **The staged batch is already committed.** Commit `72a7abb1` on branch `data/refresh-2026-10`, "data(intake): record the 2026-10-06 research batch in the data lake", contains byte-identical copies of the three delta JSONs under `datalake/intake/2026-10-06/`, plus a `ledger.json` with an empty `independent_review` field. The BLOCKED items above therefore sit in tracked files. I did not edit them. This verdict file is the natural input for that field.
- **Embedded instructions.** No fetched page, PDF or staged file contained instructions addressed to an AI.
- **Process disclosure.** My first Crossref test request included the user's email as a `mailto` query parameter, which I should not have sent. All later requests omitted it.
