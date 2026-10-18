> Archived copy of `<staging>/2026-10-atlas-geometry/hodos-licence-validity-audit.md`, versioned with the data it justifies. Unchanged except that local paths read `<staging>` or `<scratchpad>`. Index: `docs/atlas/INDEX.md`.

# Hodos audit: licence fitness and scientific validity (commit c37b1c3)

Evidence tags: **[V]** verified (primary source read this session), **[E]** established consensus (not re-read), **[I]** inferred. Paper checks were at abstract level unless stated; no full texts were read. I am not a lawyer; the licence analysis is a reading of the texts.

## Headline findings

1. **The geometry layers are real, correctly cited and mostly reusable; re-derive them from upstream.** All seven atlas citations resolve and say what Hodos says [V]. All 29 manifest hashes match the files in the clone [V].
2. **The pinned upstream for the prepared assets is gone.** `github.com/amyleesterling/human-brain` returns 404 from the GitHub API today, while five other repos resolved in the same call [V]. The MIT text Hodos reproduces for it ("Copyright (c) 2026 Amy Sterling") cannot be checked. The live credits page states no code licence [V].
3. **Nothing blocks commercial use except the Rhoton photographs.** The HCP terms are silent on commercial use, neither granting nor prohibiting it [V]. CC BY-SA permits it but needs care (item 5).
4. **The knowledge graph is one surgeon's teaching notes, not a literature-derived dataset.** Core claims mostly hold, but edge semantics are unreliable. Adjacency is coded as CONNECTS, list sentences are exploded into false edges, and the PMIDs are slide-level, not claim-level. Only 3 of the 9 PMID-bearing lesion claims cite a paper that is on point.
5. **CC BY-SA and HCP terms are mixed inside one binary.** `surface-labels.bin` concatenates HCP-terms, FreeSurfer-licence and CC BY-SA blocks. The arterial block is BY-SA material sampled on HCP geometry, so two "same terms" obligations stack [I]. Ship separate files.
6. **`surface.json` contradicts the site's own disclaimer.** It says the surface is in "MNI, same as the tractography" [V]. It is not: at least four different MNI templates are in play (section 2).
7. **The subcortex layer lacks the structures a neurosecurity site most needs.** There is no STN, GPi/GPe split, substantia nigra, red nucleus, hypothalamus, brainstem nuclei or thalamic nuclei [V].

## 1. Licence audit

| Asset | Terms | Redistribute publicly | Modify | Commercial | Required wording / conditions |
|---|---|---|---|---|---|
| HCP S1200 cortex + HCP-MMP1 labels | WU-Minn HCP Open Access Data Use Terms, 26 Apr 2013 [V: repo text, HCP page, BALSA study RVVG] | Yes, only "under these same Data Use Terms" (cl. 4) | Yes (derived data covered) | Silent [V]; use not barred [I] | Verbatim acknowledgement below; cite Van Essen 2013 and Glasser 2016; no re-identification |
| HCP1065 tracts (`tracts.bin`, `tracts.json`) | CC BY-SA 4.0 plus HCP acknowledgement [V: labsolver page] | Yes | Yes; the result stays BY-SA and changes must be indicated | Yes [V: legal code has no NC limit] | Yeh citation and DOI, licence link, change notice; no DRM or extra terms on these files |
| Arterial territories (block 4 of `surface-labels.bin`) | CC BY-SA 4.0 on GitHub [V]; NITRC lists the same project as CC "Attribution", version unstated [V] | Yes | Yes, share-alike | Yes | Cite Liu 2023; state the resampling |
| Melbourne Subcortex S1 | Custom permissive licence [V] | Yes | Yes | Not excluded ("without restriction"); "sell" is not listed [I] | "Any publication that uses the atlas in any way" must reference Tian et al. 2020, doi:10.1038/s41593-020-00711-6. Built from HCP data, so the HCP acknowledgement arguably applies too [I] |
| Yeo-7/17 labels | FreeSurfer Software License Agreement v1.0 [V: repo copy] | Yes, with all of Part B attached | Yes; modified versions must be marked | Yes: may be incorporated into proprietary programs, "commercialization ... at the sole risk" [V] | Prefaced wording below; no MGH endorsement; research only, clinical use "neither recommended nor advised"; indemnity |
| MNI152NLin2009a T1 + 2009c mask remainder | MNI/McGill permission notice [V: repo copy, MNI page] | Yes | Yes | Yes ("for any purpose and without fee") | Keep "Copyright (C) 1993–2004 Louis Collins, McConnell Brain Imaging Centre, Montreal Neurological Institute, McGill University"; cite Fonov 2011 and 2009 |
| Rhoton photographs (5 plates) | AANS/NREF page terms; not a CC licence [V] | Educational or media use only | No: watermarks may not be removed | No: commercial advertising or other purposes go to NREF (info@nref.org) | "Courtesy of the Rhoton Collection, American Association of Neurological Surgeons (AANS)/Neurosurgical Research and Education Foundation (NREF)." |
| human-brain prepared assets and picking technique | MIT per Hodos; unverifiable (repo 404) | Unknown | Unknown | Unknown | — |
| Hodos code | MIT, Copyright (c) 2026 Erion de Andrade [V] | Yes | Yes | Yes | Keep the copyright and permission notice |
| Knowledge-graph text and quotes | Covered by the Hodos MIT grant as "documentation" [I]; author's own prose | Yes [I] | Yes [I] | Yes [I] | MIT notice; the source deck is not public |

**Wording the terms specify:**
- **HCP** [V]: "Data were provided [in part] by the Human Connectome Project, WU-Minn Consortium (Principal Investigators: David Van Essen and Kamil Ugurbil; 1U54MH091657) funded by the 16 NIH Institutes and Centers that support the NIH Blueprint for Neuroscience Research; and by the McDonnell Center for Systems Neuroscience at Washington University."
- **FreeSurfer** [V]: the Part B terms must be prefaced with "All or portions of this licensed product (such portions are the "Software") have been obtained under license from The General Hospital Corporation "MGH" and are subject to the following terms and conditions:"
- **Yeh** [V]: Yeh, FC. Population-based tract-to-region connectome of the human brain and its hierarchical topology. Nat Commun 13, 4933 (2022). https://doi.org/10.1038/s41467-022-32595-4. The labsolver page adds that the data derive from HCP and "requires additional acknowledgment".

**How far CC BY-SA 4.0 share-alike reaches:**
- It applies only when you share Adapted Material, meaning material derived from the licensed material (§1(a), §3(b)) [V].
- A collection containing BY-SA works does not have to be BY-SA; each work keeps its own licence [V: CC FAQ]. Site code, other atlas files and your own data are not bound.
- Bound [I]: the resampled tract binary and its metadata, any re-sampling you make, and the per-vertex arterial labels.
- Probably bound [I]: `tracts-ranges.json`, which Hodos labels "first-party" but is derived from the tract binary; and rendered images or video of the tracts used in marketing.
- Not bound [I]: facts computed from the geometry, such as which bundles a sphere intersects.
- §4 [V]: in database-right jurisdictions (EU/UK), a database including a substantial portion of the contents becomes Adapted Material as a whole. Keep BY-SA data in its own files.
- §3(b)(3) forbids additional terms on Adapted Material [V]. HCP clause 4 demands its own terms on derived data. The arterial-on-HCP-surface block and the HCP-derived tracts sit under both [I]. Yeh resolves this for the tracts by requiring both; nobody has resolved it for the arterial block.

**HCP terms in practice:** they are an access agreement, not a copyright licence [V]. Hodos received the files third-hand (hcp-utils, then human-brain, then Hodos). Qinnovate should accept the terms itself at ConnectomeDB/BALSA and publish them alongside the data [I]. The group-average surface carries no individual data, so the identification clauses are low risk [I].

**Yeo chain:** the labels were resampled to fs_LR by DiedrichsenLab/fs_LR_32, which has no licence (GitHub API returns `license: null`) [V]. The FreeSurfer Yeo2011 wiki page states no licence, only a citation request [V]. Applying the FreeSurfer licence to the resampled file is Hodos's inference, and mine. A cleaner upstream may be ThomasYeoLab/CBIG: its LICENSE is MIT with no carve-outs [V], but I did not confirm that it ships fs_LR 32k Yeo2011 files or that MIT covers them.

**Not resolved:**
- The human-brain repo licence (404).
- Whether NITRC's "Attribution" or GitHub's BY-SA governs the arterial atlas. Hodos took the GitHub copy, so BY-SA applies to that copy.
- The TemplateFlow LICENSE file for the 2009a template (its description only says "See LICENSE file").
- The human-brain credits page lists the 2009c mask as both CC BY 4.0 and "MNI template license" [V], an upstream inconsistency.

## 2. Scientific validity by layer

**Citations resolved [V]:**
- Van Essen 2013, PMID 23684880.
- Glasser 2016, PMID 27437579: 180 areas per hemisphere, 210 subjects, classifier detected 96.6% of areas in new subjects.
- Yeo 2011, PMID 21653723: 1000 subjects.
- Yeh 2022, PMID 35995773: about 85% of tract-to-region entries consistent across individuals, about 15% need individual mapping.
- Tian 2020, PMID 32989295: built from resting-state fMRI connectivity gradients.
- Liu 2023, PMID 36739282: territories from lesion distributions in 1,298 acute stroke patients.
- Fonov 2011, PMID 20656036.

**Limits that matter for threat-model claims:**
- **Group average versus individual.**
  - Every layer is a population template. The S1200 midthickness is an average of coordinates, so it is smoother and shallower than any real cortex [E].
  - Glasser's own abstract reports individuals with atypical parcellations [V]. Yeh reports about 15% of tract-region entries vary by individual [V].
  - Nothing here supports "an electrode at X hits area Y in this person".
- **Parcel boundaries.**
  - MMP1 is defined on the surface after MSMAll areal-feature registration. Using it volumetrically or after folding-based alignment substantially degrades localisation; the traditional approach is "only 35% as good" (Coalson 2018, PMID 29925602) [V].
  - A sphere or mm-distance test against these parcels is illustrative only [I].
- **Tractography.**
  - Tractograms contain "many more invalid than valid bundles", half of them systematic across groups (Maier-Hein 2017, PMID 29116093) [V]. Accuracy "has not dramatically improved" (Schilling 2019, PMID 30317017) [V].
  - Streamlines carry no direction, no synapses, no axon count and no conduction information [E]. Hodos says so on the page [V].
  - Endpoints are the least reliable part: Makris 2005 notes only the stem is precisely defined and terminations are extrapolated [V].
- **Streamline counts.**
  - `streamlines_in_atlas` is a property of atlas construction, not fibre count or strength. Example: left arcuate 34,156 versus right 3,356 [V].
  - The shipped sample is capped at 220 per bundle at 28 points, so density in the viewer means nothing [V].
  - "Fiber count" as a fallacy: Jones 2013, PMID 22846632 [V: title only].
  - The percentages in the graph quotes ("72% of its connections", "96% ... end in 5mv") look like Yeh tract-to-region population probabilities [I]. They are not connection strengths. One quote itself admits values above 100% are a double-counting artefact [V].
- **Yeo networks.**
  - These are clusters of resting-state correlation in 1000 subjects, computed in fsaverage5 and upsampled [V], then resampled again to fs_LR by an undocumented step [V: no README or licence].
  - The names ("default", "salience") are interpretive labels, not demonstrated functions, and individual network topography varies [E].
  - Hodos ships labels only as "7Networks_1..7" [V].
- **Arterial territories.**
  - They are derived from infarct distributions, not angiography, with no variants, collaterals or border zones (Hodos states this) [V].
  - A volumetric atlas was sampled to surface vertices by nearest voxel within 4 mm, with an assumed affine because the NIfTI header has no translation [V]. Level 2 is collapsed to four territories [V].
- **Melbourne subcortex.**
  - Boundaries are fMRI-gradient based, not histological; the source is a 2 mm parcellation, Taubin-smoothed [V].
  - Scale I recapitulates 8 nuclei per side; thalamus was merged to give 14 [V].
  - Hodos's centroid checks pass within 1–3 mm of "expected", but the expected values are the author's own [V].
- **MNI space mismatch.**
  - Cortex: HCP standard space, MNI152NLin6Asym [E; the hcp-utils README names no space].
  - Tracts: ICBM 2009a Nonlinear Asymmetric [V].
  - Subcortex: MNI152NLin6Asym [V: Tian README].
  - Arterial: an FSL-compatible 182×218×182 MNI grid [V].
  - T1 underlay: NLin2009aAsym; inferior context: NLin2009cAsym [V]. 2009a and 2009c share anatomy and differ in sampling and intensity correction [V].
  - NLin6 versus the 2009 templates differ at the millimetre scale [E; not measured here]. Cross-layer distances and "tract ends in parcel" inferences are therefore not valid. Hodos's `coordinate_contract` says exactly this [V].

## 3. Knowledge-graph spot check

Sample: 46 of 287 rows (22 INJURY_CAUSES, 16 CONNECTS, 8 other). The sample was purposive, not random, and checked against abstracts.

**Totals:** supported 21, established without re-reading 7, partly supported 14, contested 1, unsupported 2, uncheckable 1.

**INJURY_CAUSES**

| Row | Claim | Verdict | Source |
|---|---|---|---|
| 22 | Meyer's loop → contralateral superior quadrantanopia, "one third or more" of ATLs | Supported | Yogarajah 2009, PMID 19460796: 9 of 21 [V] |
| 147 | Bilateral fornix → durable anterograde amnesia, "tolerance is zero" | Partly: n=3 of 12, recognition less impaired; "zero" overstated | Aggleton 2000, PMID 10734011 [V] |
| 80 | SMA → mutism + contralateral akinesia, resolves over weeks | Supported: 89% deficits, resolved in 3–42 days | Zentner 1996, PMID 8814153 [V] |
| 118 | Bilateral proximal DRTT → cerebellar mutism | Supported (association, n=26) | Morris 2009, PMID 19805491 [V] |
| 258 | Right SLF II → lasting neglect | Supported: best predictor among parieto-frontal pathways; "better than any cortical site" not in abstract | Thiebaut de Schotten 2014, PMID 23162045 [V] |
| 190 | IFOF → allocentric neglect | Partly: both neglect types share white-matter damage (SLF, IFOF, ILF); the allocentric/egocentric split is cortical | Chechlacz 2010, PMID 21058077 [V] |
| 267 | Arcuate → conduction aphasia | Contested: cortical parietal dysfunction, not the tract; arcuate "not required for repetition" | Fridriksson 2010, PMID 20720112; Bernal & Ardila 2009, PMID 19690094 [V] |
| 272 | IFOF → semantic paraphasia | Supported: stimulation, n=17; authors hedge "might partly correspond" to IFOF | Duffau 2005, PMID 15705610 [V] |
| 278 | Left ILF → pure alexia | Supported by a single case | Epelbaum 2008, PMID 18586235 [V] |
| 279 | VOF → pure alexia | Partly: anatomy fits, no lesion evidence found | Yeatman 2014, PMID 25404310 [V anatomy; I for the deficit] |
| 281 | Uncinate → proper-name anomia | Supported | Papagno 2011, PMID 20959310 [V] |
| 244 | FAT → phonological fluency deficit | Supported | Ng 2024, PMID 38657204; Kinoshita 2015, PMID 25086832 [V] |
| 95 | Right FAT → negative motor responses / SMA syndrome / Foix-Chavany-Marie | Partly: one case, FAT and arcuate both damaged, lasted 8 days. Hodos's cited PMID 30159951 is a paediatric executive-function study and irrelevant | Martino 2012, PMID 22957529 [V] |
| 107 | Anterior thalamic peduncle → apathy/abulia | Partly: cited Serra 2021 abstract does not mention it; plausible from thalamic and capsular lesion literature | PMID 33007756 [V abstract]; [E] |
| 71 | Cingulum → apathy / blunted pain affect (cingulotomy) | Partly: cingulotomy is established; cited PMIDs 37829343 and 16854598 concern the fornix and callosal topography | [E]; PMIDs [V] |
| 84 | Area 44 → transient, not permanent, aphasia | Supported | Mohr 1978, PMID 565019 [V] |
| 218 | DMN lesion → abulia, mutism | Partly: true of medial frontal/cingulate lesions; attributing it to the DMN is interpretive | [E]; not verified |
| 202 | 7Am → optic ataxia | Partly: overlap is at the occipito-parietal junction and precuneus, explicitly not the SPL convexity; no parcel-level support | Karnath & Perenin 2005, PMID 15716470 [V] |
| 222 | Salience network → failed DMN/CEN switching | Partly: tract damage predicts failed DMN deactivation in TBI; vegetative-state claim unchecked | Bonnelle 2012, PMID 22393019 [V] |
| 132 | Area 4 → permanent paresis | Established | [E] |
| 117 | Right dentate → ipsilateral deficit | Established | [E] |
| 138 | Area 43, bilateral injury → Foix-Chavany-Marie | Established for bilateral; "or dominant" unilateral is weak | [E] |

**CONNECTS**

| Row | Claim | Verdict | Source |
|---|---|---|---|
| 1 | Uncinate: anterior temporal ↔ inferior frontal via limen | Established | [E]; Kier 2004, PMID 15140705 exists [V] |
| 0 | ILF: occipital ↔ anterior temporal | Established | Catani 2003, PMID 12821517 [title only] |
| 20 | Optic radiation from "the LGN, also labelled pulvinar" | Partly: LGN origin is right; LGN and pulvinar are different nuclei | [E] |
| 76/77 | FAT: SMA ↔ IFG | Supported | Catani 2012, PMID 22209688 [V] |
| 82 | Crossed FAT through the callosum, SMA recovery | Supported as a hypothesis (10 cadavers, 2 cases) | Baker 2018, PMID 29541539 [V] |
| 37 | MdLF-III: temporal pole → occipital via angular gyrus | Supported by one study | Kalyvas 2020, PMID 31773331 [V] |
| 38 | VOF: dorsal ↔ ventral visual | Supported | Yeatman 2014 [V] |
| 73/74 | Cingulum: medial frontal ↔ PCC | Supported | Greicius 2009, PMID 18403396 [V] |
| 256 | SLF II ↔ angular gyrus | Supported | Makris 2005, PMID 15590909 [V] |
| 259 | SLF III ↔ supramarginal gyrus | Supported | Makris 2005 [V] |
| 116 | DRTT: dentate → SCP → VL thalamus → motor cortex | Established | [E] |
| 108 | Anterior peduncle: mediodorsal thalamus ↔ prefrontal via ALIC | Established | [E] |
| 143 | 24dd → spinal cord | Partly: macaque cingulate motor areas; mapping to a human parcel is inference | Dum & Strick 1991, PMID 1705965 [V] |
| 179 | Arcuate ↔ Heschl's gyrus | Partly: arcuate stems from caudal STG | Makris 2005 [V] |
| 161/171 | SLF-2 ↔ STSdp / TE1p (temporal) | Unsupported: SLF II is parieto-frontal; the quote lists "arcuate and SLF-2" and extraction made an edge for each | Makris 2005 [V] |
| 60 | Cingulum CONNECTS corpus callosum | Unsupported as an edge: the quote says it runs superior to the callosum | Quote itself [V] |

**Other relations**

| Row | Claim | Verdict | Source |
|---|---|---|---|
| 286 | Late severe deficit 3.4% with mapping, 8.2% without | Numbers supported; edge malformed (Test MONITORED_BY Deficit) | De Witt Hamer 2012, PMID 22529254 [V] |
| 246 | 400 low-grade gliomas, 18 subtests, 92.4% resection | Supported | Ng 2024 [V] |
| 257 | SLF-2 monitored by line bisection | Supported; the paper called the pathway the superior occipitofrontal fasciculus | Thiebaut de Schotten 2005, PMID 16195465 [V] |
| 99 | FAT monitored by counting | Partly: stimulation inhibits speech; counting not in abstract | Kinoshita 2015 [V] |
| 69 | Cingulum member of DMN | Supported | Greicius 2009 [V] |
| 23 | Meyer's loop: patient-specific tractography | Supported | Yogarajah 2009 [V] |
| 63 | SLF I terminates in 8BM | Partly: SLF I reaches dorsal premotor/prefrontal; no parcel-level support | Makris 2005 [V] |
| 253 | SLF I: "96% ... end in 5mv" | Not checkable: provenance of the number not stated | — |

**The 9 author-flagged contested rows** [V: read from file]:
- Rows 162–165 (CLAIMS): Duffau → IFOF; Mesulam → ILF + uncinate; Catani → uncinate via temporal pole from MTG; Sughrue → SLF/arcuate.
- Rows 166–169 (SUPPORTS "semantic processing"): the same four routes restated as tract → function.
- Row 273: extreme capsule CONNECTS insula ("still disputed whether it is a second cable or the same system counted twice").
- All nine come from two source sections. I checked only the Duffau attribution (consistent with Duffau 2005 [V]); the Mesulam, Catani and Sughrue attributions were not checked.
- The flag under-reports: conduction aphasia (267), IFOF and allocentric neglect (190), DMN lesion claims (218) and the single-study MdLF and VOF anatomy are all unflagged.

**Structural problems visible beyond the sample** [V]:
- CONNECTS is used for spatial adjacency: rows 25, 26, 27, 60, 270, 273 (tract "connects" ventricle, temporal horn, insula, callosum).
- The same edge recurs from different slides (FAT–SMA at 76, 154, 231; VOF–dorsal stream at 38, 40, 223), so there are fewer than 287 unique edges.
- Object nodes are free text ("expected resection loss (named price)"), not a controlled vocabulary.
- 44 of 53 lesion-lab claims have no PMID. Of the 9 that do, 3 are on point at abstract level (Yogarajah, Aggleton, Stasenko for fornix amnesia). `lesion_evidence.js` describes them as "PMIDs those slides list".
- Laterality and "bilateral/dominant" conditions sit in a side table, not in the edges.

**How far this generalises:** not to a rate. The sample is 16% of rows, chosen by me to cover well-known and suspicious claims, and checked against abstracts. It supports three statements. Headline lesion-deficit claims are mostly mainstream surgical teaching. Roughly a third of sampled rows overstate specificity (tract-level or parcel-level attribution the cited evidence does not carry). Edge-construction errors exist at a non-trivial rate. It does not support "X% of the graph is correct". A defensible number needs a random sample with full-text review by a domain expert.

## 4. Verdict table

| Asset / technique | Verdict | Reason |
|---|---|---|
| Cortical surface (S1200 midthickness) | Re-derive from upstream | Sound and standard; accept HCP terms yourself; Hodos's upstream is a 404 |
| MMP1 parcels | Re-derive from upstream (BALSA) | Valid on the surface only; do not use for volumetric or mm-distance claims; HCP terms |
| Yeo networks | Re-derive | Resampling step undocumented and unlicensed; present as resting-state clusters, not functions |
| Arterial territories | Re-derive, keep volumetric, or borrow idea only | Infarct-distribution territories, coarse; the Hodos block is BY-SA entangled with HCP geometry; check which licence (NITRC BY or GitHub BY-SA) you rely on |
| Tract bundles (HCP1065) | Re-derive from Yeh's release | Legal to use commercially under BY-SA with attribution; keep in separate files; never present as directional, synaptic or quantitative connectivity |
| Subcortex meshes | Re-derive, and supplement | Licence fine; fMRI-defined, 2 mm, smoothed, only 14 structures; missing the deep-brain targets a neurosecurity site needs |
| T1 slice underlay | Reuse the method; re-bake from TemplateFlow | Permissive MNI notice; bake script is simple and documented; use one template consistently |
| Knowledge-graph rows | Do not use as data | Single-author teaching notes, self-described unreviewed draft; false and adjacency edges; no controlled vocabulary |
| Lesion-deficit claims | Borrow idea only; rebuild from primary literature | 44 of 53 uncited; cited PMIDs often off-point; some claims contested or over-specific |
| Verbatim-quote provenance pattern | Borrow the idea | Every edge carrying its source sentence is what made this audit possible; quote the paper, not your own notes, and attach citations per claim |
| Manifest / hash provenance pattern | Reuse directly (MIT) | Source and output SHA-256, modification log, per-asset terms, client-side re-verification; all 29 hashes verified |
| Registration self-checks | Borrow the idea, strengthen it | The laterality, extent and centroid checks catch flips and gross affine errors only; they do not show cross-template registration. Add a declared template per layer and actual transforms |
| Rhoton photographs | Do not use | Educational/media only, watermark retained, commercial use needs NREF; obtained via a private slide deck with no accession IDs |
| human-brain prepared assets / picking code | Do not use | Upstream repo unreachable; licence unverifiable |

## Could not check
- **human-brain repo and its licence:** GitHub API and web both 404; only the github.io credits page was readable.
- **Full texts:** all paper checks are abstract-level. The Serra 2021 full text may contain the peduncle claims its abstract lacks.
- **Hodos's percentages against Yeh's tract-to-region tables:** not attempted.
- **DiedrichsenLab Yeo resampling method:** no README retrievable.
- **Four of my lookups returned nothing or the wrong paper:** Thiebaut de Schotten 2011 (Nat Neurosci), Von Der Heide 2013, Gordon 2017 and Darby 2018 (abstract not read). I did not rely on them.
- **Repo code:** read as data only; nothing from the clone was executed. I ran my own stdlib scripts in `<scratchpad>/audit-tools/` to parse the rows, verify the hashes and query PubMed.

Clone audited: `<scratchpad>/hodos-src/hodos`. Key files: `THIRD_PARTY_NOTICES.md`, `viewer/atlas/manifest.json`, `viewer/atlas/surface.json`, `viewer/atlas/tracts.json`, `viewer/atlas/subcortex.json`, `viewer/atlas/licenses/`, `viewer/connections_data.js`, `viewer/lesion_evidence.js`, `viewer/lesion_model.js`, `viewer/reference-plates/README.md`.

