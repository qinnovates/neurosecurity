# What this batch applied, and what it did not

**Batch:** 2026-10-18 · **Task:** T-074 (epic E-OPTOGEN, ask A-046)

Unlike batch 2026-10-17, this batch **is merged**. The items below are recorded in
`datalake/intake/ledger.json` with disposition `accepted`; the findings are recorded `staged` because they
need an owner ruling, not because they are data waiting to land.

## Applied

| Target | Change |
|---|---|
| `datalake/research-registry.json` | 27 verified sources added to `timelines.scholarship` (40 → 67). `rafael-yuste` gained `papers: ["N95"]`. `metadata.lastUpdated` and `totalEntities` recomputed from the collections. |
| `osi-of-mind/QIF-RESEARCH-SOURCES.md` | New section in part 2 with rows N77 to N103, each naming species and preparation and recording the direction of the finding. Header date and the source-statistics table updated. |
| `research/paper/references.bib` | 27 entries, catalogue IDs N77 to N103. Author lists are surname plus initials exactly as the verified manifest records them; no first name was expanded. |
| `datalake/qtara-registrar.json` | `schema_extensions.species_of_evidence` documented; `tara.clinical.species_of_evidence` and `.preparation` written on QIF-T0137, QIF-T0054 and QIF-T0060; QIF-T0137's "Gong 2018" source corrected to Chen et al. 2018; `tara.governance.governance_gap` added on QIF-T0137; DOIs attached to QIF-T0054's clinical sources with the unresolved Ngo 2013 entry marked unverified in place; five verified DOIs added to QIF-T0060; changelog 1.12. Applied by `src/scripts/migrate-species-of-evidence-optogenetics.py`, which also writes the SDK copy. |
| `datalake/qif-hazards.json` | QIF-H0004 gained the two verified sources; the clause saying the QIF-T0137 sources had not been re-verified replaced with what resolution established. Status, peer-review status and band tags unchanged, including the entry's own note that the bands were carried over unreviewed. |
| `osi-of-mind/whitepapers/QIF-WHITEPAPER-V9.md` | Sections 24.10 to 24.13 added; former 24.9 (Limits) renumbered 24.14 and extended; Appendix E block added. No top-level section number moved and the Contents list is unchanged. |
| `research/blog/2026-03-18-engram-brain-memory-ai-context-persistence.md` | New closing section; `fact_check_date` and six `fact_check_notes` set. |

Generators re-run rather than hand-edited: `registrar:niss-derive`, `registrar:stats`, `truth:registry`,
`datalake:inventory`, plus the read-only checks `citations:check`, `anchors:check`,
`draft-technique-regions.mjs --check`, `generated:check` and `health`.

## Not applied, and why

| Not done | Why |
|---|---|
| Any change to `evidence.tier` | The seven tiers grade strength and name no species. Moving one to encode species would change what every other entry's tier means. See `evidence-species-schema-gap.md`. |
| The 2026-10-17 NISS vector for QIF-T0137 | Owner-ruled in that batch (CV:E, 4.7, medium) and it would lower a public severity from high. That proposal names the chain-builder region-alias join as a prerequisite, and the entry's band tags do not reach the structures its own evidence concerns. Carried forward as a blocker, `optogen2-find-003`. |
| A new technique for engram manipulation | No demonstrated mechanism was found without an entry. QIF-T0054 covers reading, QIF-T0060 covers persistent modification, QIF-T0137 covers one optical delivery technique. Inflating the count would have been the only effect. |
| A dentate gyrus or other hippocampal subfield in the atlas | Every mouse engram result here acts on a subfield the atlas does not model. The only available join is a `part_to_whole` alias onto `hippocampus`, which attributes a subfield result to the whole structure — and Redondo et al. 2014 is the direct argument against that, having obtained a valence switch at the dentate gyrus and **not** at the basolateral amygdala. Needs an anatomist, not an AI-drafted alias. Recorded as `optogen2-find-002`. |
| Any row in `datalake/severity-anchors.json` | That file's own `scope_guard` keys rows to recoverability band and device class only, forbids any anatomical or stimulus field, and states that a per-record target-to-effect table "would be a new decision... and is refused". None of this literature fits it. |
| Any condition added to `datalake/qif-neurological-mappings.json` or `qif-dsm-mappings.json` | No source in this batch establishes a condition-level mapping. The existing DSM references on the enriched entries are threat-modelling references requiring clinical validation and were left alone. |
| Any stimulation parameter, delivery method or procedure in the blog or the whitepaper | The preparation detail needed for an evidence assessment is recorded in the data lake. None of it appears in the public prose. |
| Committing `datalake/intake/2026-10-17/` | Another session's staged work, containing items the owner has not ruled on. That the ledger cites 19 files which are untracked in git is recorded as `optogen2-find-004`, not fixed here. |
