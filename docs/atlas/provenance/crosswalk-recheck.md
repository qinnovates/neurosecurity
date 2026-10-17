> Archived copy of `<staging>/2026-10-atlas-geometry/evidence/crosswalk-recheck/recheck.md`, versioned with the data it justifies. Unchanged except that local paths read `<staging>` or `<scratchpad>`. Index: `docs/atlas/INDEX.md`.

# Independent re-check of `datalake/qif-anatomy-crosswalk.json`

- Checked: worktree `nsec-atlas-view`, branch `feat/atlas-region-view-mounts`, head `9983f365`, read-only. 32 rows + 6 `no_geometry` records = 38 regions.
- Checker: an AI agent (second pass). This is not a neuroanatomist's review and does not change any row's "AI-drafted, unreviewed" state.
- Date: 2026-10-13.
- Method: ids resolved against the shipped label tables and against the publishers' own tables downloaded this session; correspondence judged before the row's rationale was read; literature opened through PubMed E-utilities (abstracts) and Europe PMC (open-access full text). Raw abstracts are in `pubmed-abstracts.txt` and `pubmed-abstracts-2.txt` beside this file.

## Publisher label tables opened this session

| Atlas | File opened | Result |
|---|---|---|
| allen_hra_3d_2020 | `voxel_count.csv` (sha256 7348be08…, equals the pin in the sources file) | All 86 shipped ids exist and are `annotated=True`. 81 names identical; 5 carry a pipeline-added "(remainder …)" suffix (12143, 10390, 10392, 12195, 12538). 141 annotated structures in total; 55 not shipped. |
| cit168_rl | `labels.txt` (sha256 5e00265a…, equals the pin) | 16 labels, 0-indexed. Shipped ids 0,1,2,4,5,6,7,8,10,15 = Pu, Ca, NAC, GPe, GPi, SNc, RN, SNr, VTA, STH. Not shipped: 3 EXA, 9 PBP, 11 VeP, 12 HN, 13 HTH, 14 MN. |
| neudorfer_hypothalamus | `Volumes_names-labels.csv` (sha256 31ce37c4…, equals the pin) | All 28 shipped ids match name and side (odd = right, even = left). Not shipped: AC, diagonal band, fornix, mammillothalamic tract, STN, SN, red nucleus, BNST, nucleus basalis, zona incerta, inferior thalamic peduncle. |
| harvard_aan_v2 (not built) | `AAN_Brainstem_v2p0_Color_LUT_FreeSurfer.txt`, `README.md` | 10 nuclei: DR, MnR, PAG, VTA, LC, LDTg, mRt, PBC, PnO, PTg. No medullary nucleus. README states CC0 and file names say "MNI152_1mm"; no template variant is stated. |

Every atlas id in every row exists with the name the row implies. No id is wrong.

## Sources cited (all resolved this session)

- S1 Ding et al. 2016, J Comp Neurol, PMID 27418273, doi:10.1002/cne.24080 (full text searched)
- S2 Pauli et al. 2018, Sci Data, PMID 29664465, doi:10.1038/sdata.2018.63 (full text)
- S3 Neudorfer et al. 2020, Sci Data, PMID 32934244, doi:10.1038/s41597-020-00644-6 (full text)
- S4 Spinazzola-type anatomical study "Morphology and Morphometry of Human Paracentral Lobule", PMID 34268163, PMC8244697 (full text)
- S5 Ruan et al. 2018, Brain Struct Funct, PMID 30187192, doi:10.1007/s00429-018-1738-6 (full text)
- S6 Morosan et al. 2001, Neuroimage, PMID 11305897, doi:10.1006/nimg.2000.0715 (abstract)
- S7 Amunts et al. 1999, J Comp Neurol, PMID 10441759 (abstract)
- S8 Tremblay & Dick 2016, Brain Lang, PMID 27584714, doi:10.1016/j.bandl.2016.08.004 (abstract)
- S9 Binder 2015, Neurology, PMID 26567270, doi:10.1212/WNL.0000000000002219 (abstract)
- S10 Geyer et al. 1999, Neuroimage, PMID 10385582, doi:10.1006/nimg.1999.0440 (abstract)
- S11 Ilinsky et al. 2018, eNeuro, PMID 30023427, doi:10.1523/ENEURO.0060-18.2018 (full text)
- S12 Mai & Majtanik 2019, Front Neuroanat, PMID 30687023, doi:10.3389/fnana.2018.00114 (full text)
- S13 Trutti et al. 2021, "A probabilistic atlas of the human ventral tegmental area (VTA) based on 7 Tesla MRI data", PMID 33580320, PMC8036186 (full text)
- S14 Vogt et al. 2006, Neuroimage, PMID 16140550, doi:10.1016/j.neuroimage.2005.07.048 (abstract)
- S15 Rolls et al. 2023, "The human posterior cingulate, retrosplenial, and medial parietal cortex effective connectome", PMID 36178249, PMC9842927 (full text)
- S16 Palomero-Gallagher et al. 2009, Hum Brain Mapp, PMID 19034899, doi:10.1002/hbm.20667 (abstract)
- S17 Palomero-Gallagher et al. 2019, Cereb Cortex, PMID 29850806, doi:10.1093/cercor/bhy124 (full-text excerpt)
- S18 "The Genetic Architecture of Amygdala Nuclei", Biol Psychiatry 2024, PMID 37391117, doi:10.1016/j.biopsych.2023.06.022 (full-text excerpt)
- S19 Child & Benarroch 2013, Neurology, PMID 24142476, doi:10.1212/01.wnl.0000436078.95856.56 (abstract)
- S20 "A medley of midbrain maladies", Radiol Res Pract 2012, PMID 22693668, doi:10.1155/2012/258524 (full-text excerpt)
- S21 "Human entorhinal cortex electrical stimulation…", Brain Behav 2019, PMID 31361093, doi:10.1002/brb3.1366 (full-text excerpt)
- S22 "Avoiding vascular complications in insular glioma surgery", Front Surg 2022, PMID 35990093, doi:10.3389/fsurg.2022.906466 (full-text excerpt)
- S23 "Editorial: The Functional Anatomy of the Reticular Formation", PMID 31191262, PMC6548970 (full text)
- S24 "A Topographic Atlas of the Human Brainstem in the Ponto-Mesencephalic Junction Plane", Front Neuroanat 2021, PMID 34483849, doi:10.3389/fnana.2021.627656 (full-text excerpt)
- S25 Scheperjans et al. 2008, Cereb Cortex, PMID 18245042, doi:10.1093/cercor/bhm241 (abstract)
- S26 Cavanna & Trimble 2006, Brain, PMID 16399806, doi:10.1093/brain/awl004 (abstract)
- S27 "Histological features of layers and sublayers in cortical visual areas V1 and V2 of chimpanzees", Eye Brain 2014, PMID 25788835, doi:10.2147/eb.s51814 (full-text excerpt; states the human layout only by comparison)
- S28 Picard & Strick 2001, Curr Opin Neurobiol, PMID 11741015 (abstract)

## Table (one line per region)

Stated quality is written `name_match / extent_match (contained_kind)`. V = verified (source opened and it supports the verdict); I = inferred (label tables opened, but no opened source states the specific point).

| # | Region | Atlas: ids | My verdict | Stated | Agree? | Source | V/I |
|---|---|---|---|---|---|---|---|
| 1 | pfc | allen: 12115, 12116, 146034888, 146034884, 146034876, 12121-12125 | Correct but too broad (the two frontal gyri also hold premotor, SMA, eye-field cortex). No Allen 3D label exists for the orbital part of the inferior frontal gyrus, so nothing is missing there. | none / contained (named_stand_in) | Yes | Allen table; S28 | I |
| 2 | m1 | allen: 12114 | Too broad and too narrow. Omits 12126 (rostral paracentral lobule), where the leg area of area 4 lies; QIF lists the leg area. | none / contained (named_stand_in) | No: "contained" is false for the leg area | S4, S5 | V |
| 3 | v1 | allen: 12150, 12151, 12149 | Correct but too broad | none / contained (no_boundary) | Yes | S27 (human layout by comparison only) | I |
| 4 | a1 | allen: 12144 | Correct but too broad for area 41. Too narrow for QIF's own definition (areas 41 and 42, belt, parabelt); 12145 planum temporale is shipped and unused. | none / contained (named_stand_in) | Yes for area 41; row should say it leaves out area 42/belt | S6 (area 41 on Heschl's gyrus); belt location not opened | V for 41, I for 42 |
| 5 | broca | allen: 12119, 12118 | Correct, approximate. Areas 44/45 do not follow gyral borders. | synonym / approximate, contested | Yes. "synonym" is generous but `contested` is set. Right-side copy is disclosed. | S7, S8 | V |
| 6 | wernicke | allen: 12140, 12135, 12136 | Correct but too broad (whole superior temporal gyrus) | none / contained (named_stand_in), contested | Yes on quality. Two omissions: right-side mirror copy not disclosed (broca's row discloses it); shares 12135 and 12136 with ppc and neither row says so. | S9, S8 | V |
| 7 | pmc | allen: 12114, 12115, 12116 | Correct but too broad | none / contained (no_boundary) | Yes | S5 (area 6 on lateral superior frontal gyrus) | V for 12115, I for the rest |
| 8 | sma | allen: 12115, 12126 | 12115 correct, too broad. 12126 doubtful: SMA's caudal border is area 4, and the anterior two-thirds of the paracentral lobule is area 4. Where Allen draws the line between 12115 and 12126 I could not establish. | none / contained (no_boundary) | Quality yes; 12126 not supported | S5, S4 | V (12115), cannot judge (12126) |
| 9 | ppc | allen: 12133, 12135, 12136 | Correct for the lateral surface; too narrow (medial area 7 is precuneus, 12137, shipped and unowned) | none / approximate | Mostly. Against QIF's own sub-structure list (SPL, IPL, intraparietal) it holds; against its Brodmann list (5, 7) it omits medial 7. | S25, S26 | I |
| 10 | s1_cortex | allen: 12132 | Too narrow: omits 12138 (caudal paracentral lobule), which holds areas 3, 1, 2 for leg and foot; shipped and unowned. | none / contained (named_stand_in) | No: not fully contained | S4, S10 | V |
| 11 | hippocampus | allen: 12171, 12173, 12174 | Correct; omits entorhinal cortex, which QIF lists (it is in 12163, anterior parahippocampal gyrus) | same / atlas_covers_part | Yes | S21; Allen table | V |
| 12 | bla | allen: 10367, 10368, 10369 | Correct | synonym / approximate | Yes | S18 | V |
| 13 | insula | allen: 12178, 12177, 12179 | Correct but too narrow: publisher's table has two agranular insular labels (10329, 10330) that are left out, as the row itself says | same / approximate | No, mildly overstated: by the file's own usage (hippocampus, acc) a row that omits named parts is `atlas_covers_part`. Name is the sum of parts, not "same". | S22; Allen table | V |
| 14 | acc | allen: 12157 | Correct but too narrow: omits 12160 subcallosal gyrus (area 25, which QIF lists) and 146034872 paracingulate gyrus (area 32); both shipped, both unowned. Possibly too broad as well (midcingulate); Allen's split point not established. | synonym / atlas_covers_part | Yes on quality; row should add 12160 | S16, S17 | V (25 and 32 belong to ACC), I (which Allen label holds them) |
| 15 | cingulate | allen: 12158 | Correct but too narrow: QIF lists precuneus (12137, shipped, unowned). Retrosplenial cortex wraps the splenium; whether Allen puts it in 12158 or 12159 (isthmus) I could not establish, so the row's "retrosplenial cortex is unlabelled" is unconfirmed. | synonym / atlas_covers_part | Yes on quality | S14, S15 | V (anatomy), cannot judge (Allen's placement of areas 29/30) |
| 16 | striatum | cit168: 0, 1, 2 | Correct | same / approximate | Yes | S2; labels.txt | V |
| 17 | gpi | cit168: 5 | Correct | same / approximate | Yes | S2 | V |
| 18 | gpe | cit168: 4 | Correct | same / approximate | Yes | S2 | V |
| 19 | stn | cit168: 15 | Correct | same / approximate | Yes | S2 | V |
| 20 | substantia_nigra | cit168: 6, 8 | Correct | same / approximate | Yes | S2 | V |
| 21 | vta | cit168: 10 | Too narrow. CIT168 splits the parabrachial pigmented nucleus (label 9) from its VTA label; the usual VTA includes it. Label 9 is in the publisher's file and not shipped. | same / approximate | No, overstated | S13, S2 | V |
| 22 | thalamus | allen: 10390, 10396, 10398, 10403, 10408, 10409, 10417, 10424, 10425, 10430, 10434, 10449, 10450, 13045 | Correct. With ant and vim (declared in `contains`) it is every annotated dorsal-thalamic label; habenula, pineal and zona incerta are rightly excluded. Reticular nucleus (QIF lists it) has no label. | same / approximate | Yes | Allen table; S12 | V (labels), I (reticular nucleus sits in the remainder) |
| 23 | hypothalamus | neudorfer: 9, 10, 19-32, 37, 38, 45-54 | Correct; sides correct. Row takes 14 structures; the paper counts 13 as hypothalamic, so one (I could not tell which) is counted extrahypothalamic by the publisher. | none / approximate | Yes | S3; publisher CSV | V |
| 24 | vim | allen: 10420 | Correct but too broad | none / contained (no_boundary) | Yes | S11, S12 | V |
| 25 | ant | allen: 10392 | Correct | synonym / approximate | Yes | S19; Allen table | V (three subnuclei), I (their names) |
| 26 | cerebellum_cortex | allen: 12390, 12384 | Too narrow, and the rationale is wrong on a fact. The publisher's ontology puts both labels, and the vermis (10658), under "cerebellar cortex" (10657); the atlas paper calls vermis, paravermis and lateral hemisphere "three cerebellar cortical zones". | none / contained (named_stand_in) | No. These are the atlas's cortex labels, not a stand-in; the row covers cortex minus vermis. | S1; Allen table | V |
| 27 | cerebellum_nuclei | allen: 10660 | Correct | same / approximate | Yes | Allen table | I |
| 28 | vermis | allen: 10658 | Correct | same / approximate | Yes | S1 | V |
| 29 | medulla | allen: 12535, 12538, 12600 | Correct; white matter and inferior cerebellar peduncle are separate labels | none / atlas_covers_part | Yes | Allen table | I |
| 30 | pons | allen: 12405, 12416 | Correct; middle cerebellar peduncle (12768) and hindbrain white matter are separate labels, exactly as for medulla | none / approximate | No, inconsistent: same situation as medulla, which is `atlas_covers_part` | Allen table; S24 | I |
| 31 | midbrain | allen: 12195, 12181, 12292, 12305, 12330 | Correct but too narrow. QIF lists the red nucleus; CIT168 label 7 (red nucleus) is shipped and owned by no row, although the rationale says it is "drawn from another atlas". | none / atlas_covers_part | Yes on quality; red nucleus is orphaned | S20; Allen table; labels.txt | V |
| 32 | cea | allen: 10363 | Correct | synonym / approximate | Yes | Allen table; S18 | V (label), I (extent) |
| 33 | cervical_cord | none | No cleared source's label table carries spinal cord | no_geometry | Yes | four label tables above | V for Allen, CIT168, Neudorfer, AAN; I for nextbrain, ahead, massp (not opened) |
| 34 | thoracic_cord | none | same | no_geometry | Yes | same | same |
| 35 | lumbar_cord | none | same | no_geometry | Yes | same | same |
| 36 | sacral_cord | none | same | no_geometry | Yes | same | same |
| 37 | cauda_equina | none | same | no_geometry | Yes | same | same |
| 38 | reticular_formation | none | The stated facts about the Harvard atlas are right. The conclusion is inconsistent: shipped Allen labels 12195, 12416 and 12538 (midbrain, pontine and medullary tegmentum) contain it. | no_geometry | No | AAN LUT and README; S23; S24 | V (AAN facts), I (reticular formation lies in the tegmentum: no opened source says so in one sentence) |

## Rows I judge wrong or overstated, and what each should say

1. **m1**: add 12126 (paracentral lobule, rostral part). As written, "contained" is untrue for the leg area that QIF lists. (S4: "The anterior two-thirds of the PCL … belong to Brodmann area 4".)
2. **s1_cortex**: add 12138 (paracentral lobule, caudal part). (S4: "The posterior third of the PCL … contains BA3, BA2, and BA1".) 12138 is currently owned by no region.
3. **sma**: 12126 is not supported. SMA's caudal border is area 4 (S5), and 12126 is mostly area 4. Either drop 12126 or say in the rationale that only its front edge may hold SMA. If m1 takes 12126, the overlap must be stated.
4. **vta**: `same / approximate` overstates. CIT168's VTA label excludes the parabrachial pigmented nucleus, which the standard definition includes (S13). Say `atlas_covers_part`, or ship CIT168 label 9 and add it.
5. **cerebellum_cortex**: not a named stand-in. The labels are the atlas's own cerebellar cortical zones (S1, publisher ontology). The row should be `atlas_covers_part` with the vermis named as the missing zone, or `cerebellum_cortex` should be declared to contain `vermis` the way `thalamus` contains `ant` and `vim`. The rationale's "not cortex" should go.
6. **insula**: `atlas_covers_part`, not `approximate` (it omits two insular labels the publisher annotates); name match is not "same".
7. **pons**: `atlas_covers_part` to match medulla, or change medulla. One rule for both.
8. **midbrain**: give the shipped CIT168 red nucleus (label 7) an owner. It is the only shipped CIT168 label no row claims.
9. **acc**: add 12160 (subcallosal gyrus) for the subgenual part QIF lists; consider 146034872 (paracingulate) for area 32. Stated quality is honest as it stands.
10. **cingulate**: QIF lists precuneus as a sub-structure; 12137 is shipped and unowned. Add it or say why not. (It would then be the medial counterpart that ppc lacks, so decide which region owns it.)
11. **a1**: say that the row covers area 41 only and leaves out area 42 and the belt, which QIF lists.

## Laterality and duplicates

- Allen and CIT168 labels ship as "both"; Neudorfer's sides are correct. No left/right swap found.
- broca and wernicke are left-dominant in QIF and both are drawn on both sides. broca's row says so; **wernicke's does not**.
- Shared ids: 12115 (pfc, pmc, sma), 12116 (pfc, pmc), 12114 (m1, pmc), 12135 and 12136 (wernicke, ppc). The frontal sharing is acknowledged in prose in the pfc and m1 rationales only. **The wernicke/ppc sharing is stated nowhere.**
- `contains` lists only thalamus over ant and vim. By the same logic midbrain contains substantia_nigra and vta, and cerebellum_cortex contains vermis; none is declared.
- Shipped Allen labels owned by no region: 12127, 12137, 12138, 12141, 12142, 12143, 12145, 12146, 12147, 12152, 12153, 12154, 12159, 12160, 12163, 12164, 12166, 13229, 13230, 146034872, 146034892. Of these 12137, 12138, 12145, 12160, 12163 and 146034872 bear on rows above.

## Regions with no geometry that could have one from a cleared source

- **reticular_formation**: yes, as a `contained / no_boundary` row on shipped Allen labels 12195, 12416, 12538, the same treatment v1, pmc, sma and vim already get. Under the schema "contained" does not count as own geometry, so the count of regions with their own shape does not change; the region would stop being the only brain region with nothing drawn. The Harvard atlas would give real shapes for two of QIF's three sub-structures (PTg is the pedunculopontine nucleus; mRt, PnO) but its route is open, as the record says.
- **Spinal cord regions and cauda equina**: none found. Not checked: the label lists of nextbrain, ahead_structures and massp_2_0 (cleared on licence, not built).

## What I could not check, and what I tried

- Where the Allen 3D atlas draws the boundaries that matter here (12115 against 12126; rostral against caudal cingulate; whether areas 29/30 fall in 12158 or 12159). Tried: the publisher README (says nothing on boundaries) and a full-text search of S1 for "paracentral", "isthmus", "area 4", "area 6", "subcallosal", "paracingulate" (no usable hits). Needs the atlas volume or the 2D plates.
- That the Allen right hemisphere is a mirror of the left. The sources file says so; the README I opened does not. Not re-measured.
- Area 42 and belt on the planum temporale; prefrontal Brodmann areas by gyrus; V1 on the calcarine banks in humans. Two Europe PMC searches each returned no open-access text stating these directly; S6 and S27 support them only in part. Marked inferred.
- StatPearls "Neuroanatomy, Reticular Formation" (PMID 32310562): the NCBI Bookshelf page returned a browser check and was not read.
- Rademacher 2001 (PMID 11673325), Geyer 1996 (PMID 8752272), Sah 2003 (PMID 12843409), Carlén 2017 (PMID 29074767), Nieuwenhuys 2012 (PMID 22230626), Edlow 2024 (PMID 38691619): abstracts only, and the abstracts do not state the points I wanted, so none is cited as support above.
- Which of the 14 Neudorfer structures in the hypothalamus row the publisher counts as extrahypothalamic (paper: 13 hypothalamic, 12 extrahypothalamic).
