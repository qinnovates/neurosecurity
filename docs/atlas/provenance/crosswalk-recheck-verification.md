> Archived copy of `<staging>/2026-10-atlas-geometry/evidence/crosswalk-recheck/verify-180.md`, versioned with the data it justifies. Unchanged except that local paths read `<staging>` or `<scratchpad>`. Index: `docs/atlas/INDEX.md`.

# Adversarial verification of PR #180 (crosswalk re-check applied)

- Checked: worktree `nsec-atlas-recheck`, branch `fix/atlas-crosswalk-recheck`, head `70daac26`, diff base `9983f365`. Read-only; nothing in that repo was changed, committed or pushed. Worktree was clean before and after.
- Checker: an AI agent (third pass). Not a neuroanatomist's review; changes no row's "AI-drafted, unreviewed" state.
- Date: 2026-10-13.
- V = verified this session (source or data opened). I = inferred (read from code or reasoned, not observed running).

## Verdict

No critical finding. One high, two medium, the rest low. All eight citations are real, carry the right authors, and say what the rows use them for, in the right direction. Every added atlas id exists with the implied name. The pins and derived files match the source. The high finding is the `contains` side-effect: the declared midbrain and cerebellar containments make the built index and the published structures table state things that are anatomically false, and remove solid lens colour from nine shapes.

## Findings

### High

**H1. `contains` midbrain over substantia_nigra and vta puts false statements on screen and in a published table.** `datalake/qif-anatomy-crosswalk.json`, `contains` entries 3 and 4.

Observed in the built index (`dist/atlas/anatomy-index.json`, whose owner sets equal a port of `build-owner-map.ts` run on the head crosswalk for all 126 structures) (V):

| Shape | Owners now |
|---|---|
| cit168_rl:7 Red Nucleus | midbrain (row), substantia_nigra, vta (both `row_subject_contains_owner`) |
| 12292 superior colliculus, 12305 inferior colliculus, 12181 pretectal region, 12330 cerebral peduncle | midbrain, substantia_nigra, vta |
| 12195 "midbrain tegmentum (remainder, excluding red nucleus and substantia nigra)" | midbrain, reticular_formation, substantia_nigra, vta |
| cit168_rl:6, 8 (nigra), 10 (VTA) | own region plus midbrain (`owner_contains_row_subject`) |

The same lists are in the committed `datalake/parquet/anatomy_structures.parquet`, column `mapped_qif_record_keys`: Red Nucleus reads `region:midbrain, region:substantia_nigra, region:vta` (V).

What a visitor gets (I, from `src/lib/atlas-explorer/resolve-pick.ts`, `src/components/atlas-scene/ViewportLegend.tsx` lines 63-67 and `limits-copy.ts` line 104; not seen in a browser): picking any of those shapes shows "This shape holds more than one QIF region. Picking it selects the shape, not any one of them." followed by chips for every owner. So:
- Red Nucleus, both colliculi, the pretectal region and the cerebral peduncle are each said to hold Substantia Nigra and Ventral Tegmental Area. False for all five.
- The tegmentum shape whose own name says "excluding ... substantia nigra" is listed as holding Substantia Nigra. This contradicts its label. (For VTA on this one shape the statement is defensible: the publisher's table files `ventral tegmental area` 12261 as an unannotated descendant of 12195.)
- The nigra and VTA shapes are said to "hold" Midbrain; the relation runs the other way. Thalamic nuclei already read this way, so the copy flaw predates the PR, but the PR extends it.

Lens colour (I: `decideOwnershipMark` ported to Python and run on base and head owner sets; the real styler was not executed). In band mode these go from solid to pale "holds records that differ", because midbrain is band N2 and nigra/VTA are N5 (band ids observed in the index): SNc, SNr, the VTA marker, 12195, 12181, 12292, 12305, 12330. Red Nucleus goes from context to pale. In technique mode the one technique that lights vta (QIF-T0116) now marks both colliculi, the pretectal region, the peduncle and the Red Nucleus as "somewhere inside this shape", and the VTA marker itself drops from solid to "one of the records here".

The PR body's follow-up 6 discloses the listing and the pick change. It does not say the listings are false for six of the seven shapes, does not mention the Red Nucleus, and does not mention the colour change.

Should be: remove the two midbrain relations (the PR's own stated fallback), or narrow what a declared child inherits before declaring them. If one relation is kept on evidence, only vta-inside-12195 has a source.

### Medium

**M1. `contains` cerebellum_cortex over vermis makes the hemisphere shapes list the vermis.** `contains` entry 5. Observed (V): 12390 "lateral hemisphere of cerebellum" and 12384 "paravermis of cerebellum" each carry vermis as `row_subject_contains_owner`; the structures parquet says the same. On pick (I) both are said to hold Cerebellar Vermis. By the publisher's own table the three are sibling zones (10658 vermis; 12384 and 12390 under 10659 cerebellar hemisphere), so the statement is false. Band colour is not harmed here (both N3; the two shapes go from pale to solid). The re-check offered regrading or declaring containment as alternatives; both were applied. Should be: keep `atlas_covers_part` with the rationale naming the vermis as the missing zone, and drop the relation.

**M2. cerebellum_cortex is now graded more favourably than what was checked.** Row cerebellum_cortex. It moved from contained to a shape of its own and is the whole of the 22 to 23 headline. The publisher's table does file both labels under `cerebellar cortex` 10657 (V), and Ding 2016 does say "three cerebellar cortical zones (vermis, paravermis, and lateral hemisphere)" (V, full text). But the rationale still ends "Folial white matter unchecked", and the table has no separate cerebellar white-matter label that I could find (searched "cerebellar white", "arbor", "white matter of cerebell": none) (V for the search, I for the conclusion). One hemisphere's cerebellum totals 69.7 cm3 in that table, about the size of a whole half-cerebellum with its white matter (I, from general knowledge, confidence 0.6). `atlas_covers_part` says the shape is part of the region; if the labels include white matter the shape also exceeds it. Should be: either check the volume against the template tissue map before counting it as an own shape, or say in the PR body that the 23rd own shape carries this open question.

### Low

**L1. sma loses 12126 on an inference, not on what the cited paper says.** Row sma. Ruan 2018 states the border ("The caudal border of SMA was with the primary motor cortex (BA4)") (V). Its full text never uses the word "paracentral" (V: zero matches), so it does not say SMA is absent from the rostral paracentral lobule. The rationale is honest ("Whether m1's rostral paracentral lobule holds any is unknown"); the PR table's "Why" column reads as if the quote justified the drop. If SMA proper does reach that label, sma's "contained" in 12115 alone is untrue. Should be: PR body says the drop is a judgement call, or the label stays shared with the uncertainty stated in both rows.

**L2. Patra 2021 supports m1 better than s1_cortex.** Rows m1, s1_cortex. Both quoted sentences are in the paper's introduction and cite Brodmann (V). The same paper reports that "a significant portion of BA4 extends into the PCL in comparison to a very small portion of BA3" with considerable variation between individuals (V). Corroboration found: the publisher files 12126 under the frontal lobe and 12138 under the parietal lobe, and their voxel counts are 37,100 and 22,378, a 62:38 split close to the paper's two-thirds and one-third (V). Both rows stay "contained", which is the right grade. The paper also puts part of area 5 in the posterior third; the row does not need to say so.

**L3. acc + 12160 has better support in the publisher's own table than in the cited abstract.** Row acc. Yucel 2008 does give "subcallosal gyrus (BA25)" in a paper on anterior cingulate volumes (V), and the PR says plainly that this is a volumetry convention. The publisher's table has `subgenual (subcallosal) division of MFC (area 25)` 10281 under `anterior (rostral) cingulate (medial prefrontal) cortex` 10278, with the same colour as gyral label 12160 (V). That is a different branch from the gyral label, so the link is still an inference, but it comes from the atlas publisher. Should be: name it in the PR body beside the abstract.

**L4. a1's "belt ... not located" sits oddly beside the publisher's ontology.** Row a1. The publisher's table names 10239 "secondary auditory cortex (belt, area 42)" (V), and the row maps area 42 to the planum temporale. So by the row's own chain the belt is at least partly located; only the parabelt is not. Ong and Garey's wording is "the planum temporale (part of area 42)" (V), and Morosan's abstract also says the borders of area 41 "do not consistently match macroanatomic landmarks" (V). "Contained" remains acceptable.

**L5. PMID 27418273 describes the 2016 plate atlas; the row calls it "the atlas's" zones.** Row cerebellum_cortex. The drawing atlas is the 3D 2020 product. The ontology is shared and the publisher's table confirms the three zones independently (V), so the claim holds; the attribution is loose. Whether the 3D atlas's README names Ding 2016 as its citation was not opened.

**L6. insula name_match "synonym" is still generous by the file's own usage.** Row insula. Its labels are gyri and the limen; pons, medulla and midbrain, also unions of parts, are "none". The extent regrade to `atlas_covers_part` is right: 10329 and 10330 are annotated (296 and 1,713 voxels) and not shipped (V).

**L7. The midbrain row on CIT168 says "Not drawn from this row", yet the shape takes midbrain's lens state.** Second midbrain row. `draws: false` only satisfies the one-atlas rule; `build-owner-map.ts` and `structure_keys` ignore it, so cit168_rl:7 is in midbrain's `structure_keys` (V). `CONTEXT.md` states this correctly ("it still makes the subject an owner of that shape"); the rationale wording may mislead a reader of the table.

**L8. `CONTEXT.md` rule 5 credits `propagation.md` with a detail it does not hold.** `src/lib/anatomy/CONTEXT.md` line 10. `propagation.md` line 27 says to commit the anatomy parquet files and `catalog.json`; it says nothing about committing only the changed entries or keeping the timestamp (V: no match for "timestamp"). The entry-only practice is CONTEXT.md's own. Effect: the committed catalog's `_meta.generated` (17:43 UTC) predates the two entries it now holds. Totals are right (rows sum to 24,247 over 38 datasets) (V).

**L9. The `contains` bullet in `CONTEXT.md` is true but incomplete.** Line 86. Listing and pick behaviour are as stated (V against `build-owner-map.ts` and `resolve-pick.ts`). It omits that a parent and child in different bands lose solid colour in band mode (H1).

**L10. reticular_formation's new row turns two more shapes pale in band mode.** 12416 pontine tegmentum and 12538 medullary tegmentum go from solid to "holds a record that lies somewhere inside this shape" (I, simulated). This is the designed result of a contained row and is true; it is a visible change the PR body does not list. The removed `no_geometry` reason (the Harvard arousal atlas and its unsettled space) now lives only in the sources file.

**L11. `recheck.md` labels its S4 a "Spinazzola-type anatomical study".** The authors are Patra, Kaur, Chaudhary, Asghar and Singal (V). The PR body has it right. Outside the PR.

## Confirmed correct

Citations (PubMed E-utilities for all eight; Crossref for all eight DOIs; PMC full text for four):

| PMID | Authors confirmed | Claim in row or PR | Where found |
|---|---|---|---|
| 34268163 | Patra et al. 2021 | anterior two-thirds of PCL is BA4 (leg, foot); posterior third holds BA3, 2, 1 (leg and foot) | full text, both quotes exact |
| 30187192 | Ruan ... Amunts 2018 | SMA on the mesial surface, caudal border with BA4 | full text, quote exact |
| 33580320 | Trutti ... Forstmann 2021 | VTA region includes the parabrachial pigmented nucleus; the paper also says Pauli 2018 delineated a "VTA nucleus" apart from PBP | full text, quote exact |
| 27418273 | Ding ... Lein 2016 | three cerebellar cortical zones | full text, quote exact |
| 18368034 | Yucel ... MacQueen 2008 | subcallosal gyrus (BA25), paracingulate gyrus (BA32) | abstract |
| 2346228 | Ong, Garey 1990 | planum temporale (part of area 42) | abstract |
| 11305897 | Morosan ... Zilles 2001 | area 41 on Heschl's gyrus | abstract |
| 12805123 | Parvizi, Damasio 2003 | brainstem tegmentum includes the reticular formation | abstract, first sentence |

No real identifier is attached to a wrong claim. Crossref lists only Parvizi for the last DOI; PubMed lists both authors.

Publisher's table (`voxel_count.csv`, sha256 7348be08..., equal to the pin in the sources file, downloaded this session): 12239, 12480 and 12616 (midbrain, pontine, medullary reticular formation) are unannotated children of 12195, 12416 and 12538; 12741 and 12768 (inferior and middle cerebellar peduncles) and 10668 (hindbrain white matter) are annotated separately; 146034872 is under the frontal lobe, 12137 under the parietal lobe. All as the PR states.

Ids: 12126, 12138, 12160, 12145, 12195, 12416, 12538 are in the shipped Allen label table with the implied names; CIT168 7 is "Red Nucleus", 10 is "Ventral Tegmental Area", and 9 is not shipped.

Grades: vta, insula (extent) and pons are downgrades the evidence supports. medulla, m1, s1_cortex, a1, acc and reticular_formation are defensible as graded.

Consistency: eight labels are shared by two or three regions (12114, 12115, 12116, 12135, 12136, 12195, 12416, 12538); every sharing region names the others in its rationale. No rationale exceeds 200 characters. Region outcome recomputed from the head crosswalk: 23 own, 10 contained, 5 none; every id list equals the pinned constants and both test titles; marker-only is vta; 126 structures. Parquet digests and sizes equal the catalog entries; `anatomy_crosswalk` has 39 rows (34 rows plus 5 records); the rows match the source on subject, labels, grades, `draws` and rationale; against the base file only the rows this PR touches differ. The catalog diff is the two anatomy entries and `total_rows`. Seven files changed, none unrelated.

Map: rationale limit (`evidence.ts`, 200 characters, one line), citeable `source_ref` files (`source-ref.ts`), one drawing atlas and no drawing row beside a `no_geometry` record (`crosswalk-rules.ts`), the seven constants and two titles in `region-outcome.guard.test.ts`, the three fields in `load-anatomy-data.test.ts`, and the catalog digest test (`anatomy-parquet.test.ts`) are all as CONTEXT.md describes.

Hygiene: no usernames, home paths or secrets in the diff or commit messages; every parquet row still reads "AI-drafted, unreviewed" with drafter `ai`; no DSM or disorder wording added.

## Not checked, and what was tried

- The test suite, build and health checks the PR body reports were not run, to keep the worktree untouched (the test runner writes a cache). Pins and digests were recomputed independently instead; "cell for cell" equality of parquet against a fresh build was not.
- Nothing was viewed in a browser. Pick text and lens marks are read from code and simulated.
- Whether `dist/` was built from exactly this head: its owner sets match the head crosswalk for every structure; the last commit after it is documentation only.
- Where the Allen 3D atlas draws 12115 against 12126, and whether its cerebellar labels include white matter. The publisher's table gives parentage and voxel counts only.
- Full text of Yucel 2008, Ong and Garey 1990, Morosan 2001 and Parvizi 2003: abstracts only. The quoted wording is in each abstract.
- The band ids of thalamus, ant and vim, so whether the thalamic precedent already showed the band-colour effect of H1.
- The PR body's statement that `/review full` found nothing critical.
