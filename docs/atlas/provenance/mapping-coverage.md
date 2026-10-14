> Archived copy of `<staging>/2026-10-atlas-geometry/evidence/mapping-coverage/coverage.md`, versioned with the data it justifies. Unchanged except that local paths read `<staging>` or `<scratchpad>`. Index: `docs/atlas/INDEX.md`.

# Mapping coverage per region, TARA Brain Atlas explorer

Computed by a script from the built site (`dist/atlas/anatomy-index.json`, `dist/atlas/anatomy-chains.json`, the island props of `dist/atlas/clinical/index.html`)
and from the datalake (`datalake/qtara-registrar.json`, `datalake/qif-brain-bci-atlas.json`, `datalake/impact-chains.json`, `datalake/qif-dsm-mappings.json`, `datalake/tara-chains.json`).
Raw values: `coverage.json` beside this file. DSM-5-TR entries are diagnostic category references used for threat modelling, not diagnostic claims.
Technique-to-region links are AI-drafted and unreviewed. QIF, TARA and NISS are proposed and unvalidated.

## What each column counts

- **Lit / Named**: techniques whose AI-drafted link resolves to this region and counts (lit), or names it but is not counted. Both are in the explorer index.
- **Band listed / unlisted**: techniques that share the region's band only. Listed = scope `band_level`, shown under "Tagged with this band only". Unlisted = techniques of the band whose links name other structures; they appear nowhere under this region.
- **DSM tag**: distinct DSM cluster tags on the lit techniques, in the explorer.
- **DSM expl tech / path**: distinct DSM-5-TR codes the explorer now holds for the region through lit techniques / through pathways that list it (added by this work; before it, both were 0).
- **DSM band-R / band-M**: DSM-5-TR codes for the region's band in the registrar's `dsm5_spec.band_profiles` / in `qif-dsm-mappings.json` conditions. Datalake only.
- **DSM impact**: distinct DSM-5-TR codes on `impact-chains.json` rows for the region (technique, band, region, pathway, code). Datalake; **clin** is the count the built clinical page holds for the same region.
- **DSM tech**: distinct DSM-5-TR codes in the registrar fields (`tara.dsm5`) of the lit techniques. Datalake only.
- **NISS**: level at which the explorer holds NISS for the region: `technique` (a severity step per lit technique, highest shown) or `absent`. In brackets, how many lit techniques have a numeric score in the registrar. No band-level or region-level NISS exists in the data.
- **Chains lit / named / band**: curated threat models with a step whose technique lights the region / names it uncounted / only shares its band.
- **Impact rows**: `impact-chains.json` rows for the region. The rows themselves do not reach the explorer; their region-to-code pairs do, through the pathway column.
- **Devices**: device records whose `target_regions` list the region (explorer = datalake for every region).

| Region | Band | Lit | Named | Band listed | Band unlisted | DSM tag | DSM expl tech | DSM expl path | DSM band-R | DSM band-M | DSM impact (clin) | DSM tech | NISS | Chains lit | Chains named | Chains band | Impact rows | Devices | Shape |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Prefrontal Cortex (`pfc`) | N7 | 5 | 3 | 40 | 12 | 3 | 22 | 30 | 11 | 27 | 30 (30) | 22 | technique (5) | 0 | 0 | 6 | 3422 | 9 | containing shape |
| Primary Motor Cortex (`m1`) | N7 | 1 | 2 | 40 | 17 | 1 | 2 | 11 | 11 | 27 | 11 (11) | 2 | technique (1) | 0 | 0 | 6 | 754 | 14 | containing shape |
| Primary Visual Cortex (`v1`) | N7 | 2 | 0 | 40 | 16 | 2 | 4 | 8 | 11 | 27 | 8 (8) | 4 | technique (2) | 1 | 0 | 6 | 522 | 4 | containing shape |
| Primary Auditory Cortex (`a1`) | N7 | 0 | 0 | 40 | 18 | 0 | 0 | 9 | 11 | 27 | 9 (9) | 0 | absent | 0 | 0 | 6 | 522 | 5 | containing shape |
| Broca's Area (`broca`) | N7 | 0 | 0 | 40 | 18 | 0 | 0 | 3 | 11 | 27 | 3 (3) | 0 | absent | 0 | 0 | 6 | 174 | 2 | own shape |
| Wernicke's Area (`wernicke`) | N7 | 0 | 0 | 40 | 18 | 0 | 0 | 3 | 11 | 27 | 3 (3) | 0 | absent | 0 | 0 | 6 | 174 | 0 | containing shape |
| Premotor Cortex (`pmc`) | N7 | 0 | 0 | 40 | 18 | 0 | 0 | 7 | 11 | 27 | 7 (7) | 0 | absent | 0 | 0 | 6 | 464 | 0 | containing shape |
| Supplementary Motor Area (`sma`) | N7 | 0 | 1 | 40 | 18 | 0 | 0 | 2 | 11 | 27 | 2 (2) | 0 | absent | 0 | 0 | 6 | 116 | 0 | containing shape |
| Posterior Parietal Cortex (`ppc`) | N7 | 0 | 0 | 40 | 18 | 0 | 0 | 8 | 11 | 27 | 8 (8) | 0 | absent | 0 | 0 | 6 | 580 | 5 | own shape |
| Primary Somatosensory Cortex (`s1_cortex`) | N7 | 0 | 0 | 40 | 18 | 0 | 0 | 16 | 11 | 27 | 16 (16) | 0 | absent | 0 | 0 | 6 | 986 | 2 | containing shape |
| Hippocampus (`hippocampus`) | N6 | 2 | 0 | 27 | 15 | 2 | 3 | 17 | 12 | 23 | 17 (17) | 3 | technique (2) | 0 | 0 | 5 | 1496 | 1 | own shape |
| Basolateral Amygdala (`bla`) | N6 | 0 | 4 | 27 | 13 | 0 | 0 | 18 | 12 | 23 | 18 (18) | 0 | absent | 0 | 0 | 5 | 1452 | 1 | own shape |
| Insular Cortex (`insula`) | N6 | 2 | 0 | 27 | 15 | 2 | 21 | 15 | 12 | 23 | 15 (15) | 21 | technique (2) | 0 | 0 | 5 | 792 | 0 | own shape |
| Anterior Cingulate Cortex (`acc`) | N6 | 1 | 0 | 27 | 16 | 1 | 4 | 14 | 12 | 23 | 14 (14) | 4 | technique (1) | 0 | 0 | 5 | 1012 | 0 | own shape |
| Cingulate Gyrus (Posterior) (`cingulate`) | N6 | 0 | 0 | 27 | 17 | 0 | 0 | 6 | 12 | 23 | 6 (6) | 0 | absent | 0 | 0 | 5 | 308 | 0 | own shape |
| Striatum (Caudate + Putamen) (`striatum`) | N5 | 0 | 2 | 19 | 6 | 0 | 0 | 13 | 7 | 14 | 13 (13) | 0 | absent | 0 | 0 | 3 | 513 | 0 | own shape |
| Globus Pallidus Internus (`gpi`) | N5 | 0 | 0 | 19 | 8 | 0 | 0 | 4 | 7 | 14 | 4 (4) | 0 | absent | 0 | 0 | 3 | 108 | 4 | own shape |
| Globus Pallidus Externus (`gpe`) | N5 | 0 | 0 | 19 | 8 | 0 | 0 | 0 | 7 | 14 | 0 (0) | 0 | absent | 0 | 0 | 3 | 0 | 0 | own shape |
| Subthalamic Nucleus (`stn`) | N5 | 0 | 0 | 19 | 8 | 0 | 0 | 2 | 7 | 14 | 2 (2) | 0 | absent | 0 | 0 | 3 | 54 | 4 | own shape |
| Substantia Nigra (`substantia_nigra`) | N5 | 0 | 0 | 19 | 8 | 0 | 0 | 4 | 7 | 14 | 4 (4) | 0 | absent | 0 | 0 | 3 | 135 | 0 | own shape |
| Ventral Tegmental Area (`vta`) | N5 | 1 | 3 | 19 | 7 | 1 | 3 | 6 | 7 | 14 | 6 (6) | 3 | technique (1) | 0 | 0 | 3 | 297 | 0 | marker only |
| Thalamus (`thalamus`) | N4 | 0 | 1 | 17 | 7 | 0 | 0 | 29 | 6 | 10 | 29 (29) | 0 | absent | 0 | 0 | 1 | 768 | 0 | own shape |
| Hypothalamus (`hypothalamus`) | N4 | 0 | 1 | 17 | 7 | 0 | 0 | 12 | 6 | 10 | 12 (12) | 0 | absent | 0 | 0 | 1 | 408 | 0 | own shape |
| Ventral Intermediate Nucleus (Thalamus) (`vim`) | N4 | 0 | 0 | 17 | 7 | 0 | 0 | 3 | 6 | 10 | 3 (3) | 0 | absent | 0 | 0 | 1 | 72 | 4 | containing shape |
| Anterior Nucleus of Thalamus (`ant`) | N4 | 0 | 0 | 17 | 7 | 0 | 0 | 0 | 6 | 10 | 0 (0) | 0 | absent | 0 | 0 | 1 | 0 | 0 | own shape |
| Cerebellar Cortex (`cerebellum_cortex`) | N3 | 0 | 0 | 16 | 13 | 0 | 0 | 2 | 8 | 8 | 2 (2) | 0 | absent | 0 | 0 | 4 | 58 | 1 | containing shape |
| Deep Cerebellar Nuclei (`cerebellum_nuclei`) | N3 | 0 | 0 | 16 | 13 | 0 | 0 | 5 | 8 | 8 | 5 (5) | 0 | absent | 0 | 0 | 4 | 174 | 0 | own shape |
| Cerebellar Vermis (`vermis`) | N3 | 0 | 0 | 16 | 13 | 0 | 0 | 6 | 8 | 8 | 6 (6) | 0 | absent | 0 | 0 | 4 | 174 | 0 | own shape |
| Medulla Oblongata (`medulla`) | N2 | 0 | 0 | 15 | 15 | 0 | 0 | 21 | 5 | 7 | 21 (21) | 0 | absent | 0 | 0 | 1 | 690 | 0 | own shape |
| Pons (`pons`) | N2 | 0 | 2 | 15 | 13 | 0 | 0 | 34 | 5 | 7 | 34 (34) | 0 | absent | 0 | 0 | 1 | 1290 | 0 | own shape |
| Midbrain (Mesencephalon) (`midbrain`) | N2 | 0 | 1 | 15 | 15 | 0 | 0 | 7 | 5 | 7 | 7 (7) | 0 | absent | 0 | 0 | 1 | 210 | 0 | own shape |
| Reticular Formation (`reticular_formation`) | N2 | 0 | 0 | 15 | 15 | 0 | 0 | 0 | 5 | 7 | 0 (0) | 0 | absent | 0 | 0 | 1 | 0 | 0 | none (no geometry) |
| Cervical Spinal Cord (`cervical_cord`) | N1 | 0 | 0 | 28 | 23 | 0 | 0 | 11 | 3 | 3 | 11 (11) | 0 | absent | 0 | 0 | 2 | 663 | 0 | none (no geometry) |
| Thoracic Spinal Cord (`thoracic_cord`) | N1 | 0 | 0 | 28 | 23 | 0 | 0 | 13 | 3 | 3 | 13 (13) | 0 | absent | 0 | 0 | 2 | 765 | 0 | none (no geometry) |
| Lumbar Spinal Cord (`lumbar_cord`) | N1 | 0 | 0 | 28 | 23 | 0 | 0 | 10 | 3 | 3 | 10 (10) | 0 | absent | 0 | 0 | 2 | 612 | 0 | none (no geometry) |
| Sacral Spinal Cord (`sacral_cord`) | N1 | 0 | 0 | 28 | 23 | 0 | 0 | 5 | 3 | 3 | 5 (5) | 0 | absent | 0 | 0 | 2 | 255 | 0 | none (no geometry) |
| Cauda Equina (`cauda_equina`) | N1 | 0 | 0 | 28 | 23 | 0 | 0 | 0 | 3 | 3 | 0 (0) | 0 | absent | 0 | 0 | 2 | 0 | 0 | none (no geometry) |
| Central Amygdala (`cea`) | N5 | 0 | 0 | 19 | 8 | 0 | 0 | 5 | 7 | 14 | 5 (5) | 0 | absent | 0 | 0 | 3 | 162 | 0 | own shape |

## Gap list (a): in the datalake, not surfaced in the explorer (before this work)

| Mapping | Datalake source | Extent | Decision |
|---|---|---|---|
| DSM-5-TR references filed with techniques | `datalake/qtara-registrar.json` (`tara.dsm5.primary` / `secondary`) | 882 references on 78 of the 111 techniques with a brain band; the explorer carried only the cluster tag. Through lit links they reach 7 regions (59 region-code pairs). Example: `pfc` F32, F90. | WIRING, fixed: served in `anatomy-catalog.json`, shown in the inspector with the AI-drafted mark of the link. |
| DSM-5-TR references filed with pathways | `datalake/qif-neural-pathways.json` (`dsm_conditions`, `origin`, `targets`) | 46 pathways, 178 region-pathway pairs, 359 region-code pairs over 34 regions. Identical to the region-code pairs of `datalake/impact-chains.json` and to what the clinical page holds. Every endpoint is a region id or a synonym alias (no broader or narrower alias is used). Example: `hippocampus`, `vta`. | WIRING, fixed: served in `anatomy-catalog.json`, shown in the inspector as filed with the pathway, not the region. |
| Impact chain rows (technique, band, region, pathway, code) | `datalake/impact-chains.json` | 20,182 rows, 34 regions, 111 techniques. | JUDGEMENT, not wired: a row puts a technique on a region because the technique is tagged with the region's band. The explorer treats a band tag as not a region link. Showing rows per region would reverse that. |
| DSM-5-TR references per band (band table) | `datalake/qtara-registrar.json` (`dsm5_spec.band_profiles`) and `datalake/qif-dsm-mappings.json` (`conditions[].bands`) | 302 and 590 region-code pairs by band, all 38 regions. The two tables share 2 codes across the seven neural bands. | MISSING DATA / JUDGEMENT: two band tables disagree; one has to be chosen or reconciled first. |
| NISS numeric score and vector | `datalake/qtara-registrar.json` (`niss.score`, `niss.vector`) | 85 of 111 techniques with a brain band carry a score; the explorer shows the registrar's own step word (low, medium, high) for the same 85. | JUDGEMENT, not wired: whether to print a decimal for an unvalidated scale is a presentation decision. The registrar's `severity` and `niss.severity` differ for 54 of those techniques. |
| Technique link words the atlas file does not classify | `datalake/qif-anatomy-technique-regions.json` | 89 of 123 drafted links resolve to no region (examples: "cortical", "cochlea"). Known. | MISSING DATA: needs aliases or new regions. Not to be fixed here. |
| Techniques of a region's band that name another structure | registrar band tags | 540 region-technique pairs appear under no region's "Tagged with this band only" list (that list holds the 63 band-level techniques only). They are reachable through the technique lens. | JUDGEMENT: listing them under a region they do not name. |
| Curated chain steps on a region | `datalake/tara-chains.json` | 35 steps, 14 on techniques with a brain band, 1 lights a region (`v1`, CHAIN-VIS-002). Known. | MISSING DATA: follows the technique links. |
| Curated chain fields | `datalake/tara-chains.json` (`objective`, `defenses`, `clinical_parallel`, `detection_window`) | 7 chains; not served to the explorer. Not region mappings. | Follow-up, wording review first: `objective` and `clinical_parallel` are causal in tone. |
| Regions with no pathway and no lit technique | | `gpe`, `ant`, `reticular_formation`, `cauda_equina` have no DSM-5-TR reference by any region-level path. | MISSING DATA. |

No gap: devices (56 region-device pairs, 13 regions, explorer equals datalake), band-level techniques (984 pairs, 38 regions), cluster tags, NISS steps, chain steps.

## Gap list (b): shown in the explorer with no datalake source

None found among the mapping kinds. Two things are derived and say so on screen: the "highest NISS step among linked techniques" (a maximum over lit links) and whether a link counts (computed at build time from the alias table, band tags and the quote check). Review marks come from `datalake/qif-anatomy-review-ledger.json`.

## DSM wording audit

Qualifier present before this work: explorer DSM lens and inspector cluster fact (`lens_dsm` in `src/lib/anatomy/limits-copy.ts`), the clinical dashboard's region, impact chain and DSM views, the cascade panel, the clinical page banner. No DSM reference appears in the chain view, `BandViewPanel`, `RegionPicker`, `NetworkRegionList` or `TargetRegionsPanel`.

Qualifier added: the new inspector section (`dsm_references`); the clinical dashboard frame (covers the stat tile, drill-down, pathway and neurotransmitter views); the band detail panel's DSM tab; the heatmap footer of the regions view.

Code-side wording changed: "DSM Outcome(s)" headings (3); in `src/pages/atlas/clinical.astro`: "directly causes the psychiatric outcome", "arises secondary to", "diagnoses linked", "technique-to-diagnosis link/mapping" (2), "Diagnosis Explorer", "techniques that can produce it", "trace a presenting symptom back to a potential technical cause", "DSM-5-TR Diagnosis: The resulting clinical presentation", "The same signal that treats depression can ... induce it", and the three "treats / alleviates / diagnoses" sentences.

Left and listed (code side, outside the named patterns): the word "outcome" in the clinical page's title and section labels; "Manifest as ..." in the four cluster descriptions; "symptoms that emerge from similar neural disruption mechanisms"; the paper link whose address reads "when-niss-scores-predict-psychiatric-diagnoses".

Data-side wording, listed, not changed:
- `datalake/qtara-registrar.json` `dsm5_spec.description`: "Maps BCI techniques to psychiatric diagnoses ... NISS metrics predict diagnostic clusters. First known formal ..." (not found in the built atlas pages checked).
- `datalake/qtara-registrar.json` technique `notes`: 17 of 176 use "causes", "induces" or similar for a mechanism (example: QIF-T0006).
- `datalake/qif-brain-bci-atlas.json`: `function` of `substantia_nigra` ("Degeneration causes Parkinson's", shown in the explorer inspector under its limit sentence); `clinical_notes` of 6 regions, `how_it_works` of 5, `bci_relevance_detail` of 2.
- `datalake/qif-neural-pathways.json` `bci_relevance`: 3 of 46 (example: "DBS of nucleus accumbens treats depression but could theoretically induce compulsive states").
- `datalake/tara-chains.json`: `objective` and `clinical_parallel` (not served to the explorer).
- One code is filed under several wordings (7 codes; example F44.4 "Conversion Disorder", "Conversion Disorder (speech symptom)"); the explorer shows each wording as written.


## Totals

```json
{
 "regions": 38,
 "index_techniques_with_a_neural_band": 111,
 "registrar_techniques": 176,
 "link_file_links": 123,
 "index_links": 123,
 "index_links_resolving_to_a_region": 34,
 "index_links_lit": 14,
 "techniques_lighting_a_region": 12,
 "curated_chains": 7,
 "curated_chain_steps": 35,
 "datalake_curated_chains": 7,
 "impact_chain_rows": 20182,
 "impact_chain_regions": 34,
 "regions_with": {
  "direct_lit_technique": 7,
  "direct_named_not_counted_technique": 10,
  "any_direct_technique": 14,
  "band_only_technique_listed": 38,
  "dsm_cluster_tag_in_explorer": 7,
  "dsm_code_in_explorer_via_lit_techniques": 7,
  "dsm_code_in_explorer_via_pathways": 34,
  "dsm_code_in_explorer_any": 34,
  "pathway_in_explorer": 34,
  "dsm_band_table_registrar": 38,
  "dsm_band_table_dsm_mappings": 38,
  "dsm_impact_chains": 34,
  "dsm_technique_fields_lit": 7,
  "dsm_on_clinical_page": 34,
  "niss_step_in_explorer": 7,
  "niss_score_in_datalake_lit": 7,
  "curated_chain_lighting": 1,
  "curated_chain_named_not_counted": 0,
  "curated_chain_band_only": 38,
  "impact_chain_datalake": 34,
  "impact_chain_in_explorer": 0,
  "device_in_explorer": 13,
  "device_in_datalake": 13,
  "own_shape": 21,
  "containing_shape": 10,
  "marker_only": 1,
  "no_shape": 6
 },
 "grand_totals": {
  "region_technique_pairs_lit": 14,
  "region_technique_pairs_named_not_counted": 20,
  "region_technique_pairs_band_only_listed": 984,
  "region_technique_pairs_band_only_not_listed": 540,
  "region_cluster_tag_pairs_explorer": 12,
  "region_dsm_pairs_explorer_via_lit_techniques": 59,
  "region_dsm_pairs_explorer_via_pathways": 359,
  "region_pathway_pairs_explorer": 178,
  "region_dsm_pairs_band_table_registrar": 302,
  "region_dsm_pairs_band_table_dsm_mappings": 590,
  "region_dsm_pairs_impact_chains": 359,
  "region_dsm_pairs_technique_fields_lit": 59,
  "region_dsm_pairs_clinical_page": 359,
  "region_niss_scored_lit_pairs": 14,
  "region_curated_chain_pairs_lighting": 1,
  "region_curated_chain_pairs_named_not_counted": 0,
  "region_device_pairs_explorer": 56,
  "region_device_pairs_datalake": 56,
  "impact_chain_rows": 20182
 },
 "mismatches": {
  "devices_explorer_vs_datalake": [],
  "impact_dsm_vs_explorer_pathway_dsm": [],
  "technique_dsm_datalake_vs_explorer": [],
  "impact_dsm_vs_clinical_page_dsm": [],
  "regions_missing_from_clinical_page": []
 }
}
```
