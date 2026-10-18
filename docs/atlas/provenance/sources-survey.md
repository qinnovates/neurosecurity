> Archived copy of `<staging>/2026-10-atlas-geometry/sources-survey.md`, versioned with the data it justifies. Unchanged except that local paths read `<staging>` or `<scratchpad>`. Index: `docs/atlas/INDEX.md`.

# Open human brain data sources for the TARA Lab brain map: survey

No files were written or changed (no scratch notes either). Web research only.

**Evidence tags.** V = I read the primary page this session. S = reported by a search summary of the primary page, which I did not open myself. E = established from general knowledge, not checked this session. I = inferred. DOIs marked (E) are from memory and should be resolved before citing.

**Headline findings**
- Most of the best gap-filling atlases are non-commercial or unlicensed. The ones that are both useful and clearly reusable are Neudorfer hypothalamus, the Diedrichsen cerebellar atlases, Allen Human Reference Atlas 3D, Harvard AAN, H01, NeuroMorpho, Human Protein Atlas and (probably) CIT168.
- "Meta's brain model" is TRIBE v2, an fMRI response predictor on the cortical surface. It contains no synapses, neurons or wiring, and it is CC BY-NC.
- The only human synapse-level dataset is H01: one cubic millimetre of temporal cortex from one person. MICrONS is mouse and FlyWire is fruit fly.
- Four gaps have no clean open source: cranial nerves, a commercially usable VIM / thalamic nuclei atlas, commercially usable cortical layers, and a redistributable full brainstem nuclei set.

## 1. Summary table

| Source | Fills | Species / space | Licence | Public commercial site? |
|---|---|---|---|---|
| Neudorfer 2020 hypothalamus atlas | Hypothalamus (13 nuclei) plus 12 nearby structures | Human, MNI152 2009b, 0.25 and 0.5 mm | CC BY 4.0 (V) | Yes |
| CIT168 / Pauli 2018 | SNc, SNr, VTA, STN, red nucleus, pallidum, striatum | Human, MNI152 2009c | CC BY 4.0 on OSF (S; the OSF page did not render for me) | Probably yes; confirm on OSF |
| Harvard AAN atlas v2.0 | Brainstem arousal nuclei: LC, DR, MnR, PAG, PBC, PnO, PTg, LDTg, mRt, VTA | Human, MNI152 1 mm | Dryad page names no licence (V); Dryad publishes under CC0 (E) | Probably yes; confirm |
| Diedrichsen cerebellar atlases | 28 lobules, 6 deep-nuclei labels, functional parcellations | Human, SUIT / MNI152NLin6Asym / MNI2009cSym | CC BY "if not otherwise noted in the contributing paper" (V) | Yes |
| Allen Human Reference Atlas 3D, 2020 | 141 whole-brain structures including diencephalon and brainstem divisions | Human, ICBM 2009b symmetric, 0.5 mm | CC BY 4.0 since 1 Sept 2022 (V, Allen community post) | Yes |
| MNI ICBM152 2009 templates | Base template | Human | Permissive "any purpose, without fee" notice (V) | Yes |
| H01 (Google / Harvard) | Human synapse-level example | Human, native EM, about 1 mm³ | CC BY 4.0 (V) | Yes, with scope caveats |
| MICrONS mm³ | Synapse-level example | Mouse visual cortex | CC BY 4.0 (V) | Yes, labelled as mouse |
| FlyWire | Whole-brain connectome | Fruit fly | CC BY-NC 4.0 for community edits; dataset licence not stated (V) | No |
| NeuroMorpho.Org | Neuron morphologies for "neuron chains" | Many species including human | CC BY 4.0 (V) | Yes |
| Human Protein Atlas, brain | Receptor / molecule regional expression | Human, pig, mouse; region tables | CC BY 4.0, commercial use encouraged (V) | Yes |
| eeg_positions / MNE montages | EEG 10-20, 10-10, 10-05 positions | Idealised sphere, fsaverage, Colin27 | MIT (V); MNE BSD-3 (E) | Yes |
| Neurosynth | Function-to-region maps | Human, MNI | ODbL 1.0 (V) | Yes, with share-alike on the database |
| NeuroQuery | Function-to-region maps | Human, MNI | Code BSD-3 (V); data licence not stated (V) | Unclear |
| neuromaps / Hansen 2022 PET | Receptor and transporter density | Human, MNI152 and fsaverage | Hansen repo CC BY-NC-SA 4.0 (V); a few maps CC0 or CC BY (V) | Only the CC0 / CC BY maps |
| PAM50 / Spinal Cord Toolbox | Spinal cord levels, grey/white matter, tracts | Human, PAM50 space | Not found on any page read | Unverified |
| NextBrain (2025) | 333 histological regions | Human, 5 hemispheres | Not verified (data page returned 403) | Unverified |
| THOMAS thalamic nuclei | VIM, AV and other thalamic nuclei | Human, MNI 2009b, 0.5 mm | Files restricted, access by request; no licence shown (V) | No, without permission |
| DISTAL (Lead-DBS) | STN and GPi functional zones, thalamic nuclei | Human, MNI 2009b asymmetric | No licence stated (V) | No, without permission |
| Brainstem Navigator | 31 brainstem and 3 diencephalic nuclei | Human, MNI / IIT | Non-commercial research only; no redistribution of files or derived information (V) | No |
| Julich-Brain 3.1 | 227 cytoarchitectonic areas, thalamic subnuclei | Human, MNI152 / Colin27 / fsaverage | CC BY-NC-SA 4.0 (S, third-party registry) | No |
| BigBrain and cortical layers | 20 µm histology, six-layer segmentation | Human, one brain | "Research purposes only, no commercial use without written consent" (V, FTP notice) | No |
| MNI PD25 | STN, SN, RN, GPi, GPe | Human Parkinson's cohort, ICBM152 | CC BY-NC-SA 3.0 (V) | No |
| Brainnetome | 246 regions | Human, MNI | Non-commercial, share-alike (S, via TemplateFlow metadata) | No |
| AAL3 | Thalamic nuclei, SN, VTA, LC, raphe, red nucleus | Human, MNI | GPL (S; direct fetch failed on a certificate error) | Caveat: copyleft |
| Harvard-Oxford | 48 cortical, 21 subcortical | Human, MNI152 | CC BY-SA 4.0 (V, FSL licence page) | Yes with share-alike; fills no gap |
| Allen Human Brain Atlas, cell types | Gene expression, cell types | Human | Non-commercial; commercial redistribution needs written permission (V) | No, without permission |
| Meta TRIBE v2 | Predicted fMRI responses | Human, fsaverage5 | CC BY-NC 4.0 (V) | No |
| BrainGlobe | Atlas API | One human atlas at 500 µm; rest animal (V) | Not stated on the page | Not useful here |

## 2. "Meta's brain model and synapses"

These are two unrelated things.

**TRIBE v2 (Meta FAIR).** 
- It is a model that takes video, audio and text and predicts fMRI responses (V, repo and arXiv:2605.04326).
- Output is about 20k vertices on the fsaverage5 cortical surface for an "average" subject (V).
- The paper says it was trained on over 1,000 hours of fMRI from 720 subjects; press figures differ (V for the abstract).
- Licence is CC BY-NC 4.0; weights are on Hugging Face (V).
- It is not an anatomical model, has no subcortex detail, and says nothing about synapses or wiring. It cannot simulate stimulation, an implant or an attack.
- Other Meta FAIR brain work is non-invasive decoding: Brain2Qwerty (typed text from MEG/EEG) and MEG image decoding (S). Neither is an atlas.

**Synapse-level connectomics.**
- **H01** is human: roughly 1 mm³ of temporal cortex, 1.4 petabytes, viewed in Neuroglancer (V). The landing page gives 183 million annotated synapses and about 100 proofread cells; the data page offers 104 proofread neurons as SWC. Published counts differ slightly (E). It is a surgical sample from one patient (E). Citation: Shapson-Coe et al. 2024, Science, 10.1126/science.adk4858 (E).
- **MICrONS** is mouse visual cortex: about 1.4 × 0.87 × 0.84 mm, over 200,000 cells, over 523 million synapses (V). Citation: 10.1038/s41586-025-08790-w (V).
- **FlyWire** is the adult fruit fly brain. The page I read did not state species or counts (V); about 139,000 neurons is from memory (E). Citation: Dorkenwald et al. 2024, Nature, 10.1038/s41586-024-07558-y (E).
- No whole-human-brain wiring diagram exists. The site can show H01 as "what real human cortical wiring looks like in one cubic millimetre" and nothing broader.

## 3. Per-source notes

**Neudorfer hypothalamus atlas** (V)
- Built from 990 HCP subjects. Label volumes are 0.3 to 4.4 MB; the isolated-nuclei zips are 80 to 480 kB; the templates are up to 1.2 GB and not needed.
- DOI 10.5281/zenodo.3942115; paper 10.1038/s41597-020-00644-6.
- I did not read the label list. Check `Volumes_names-labels.csv` for which of the 12 extrahypothalamic structures it includes.
- Limits: MRI-derived group average; nuclei this small are approximate.
- Browser: meshes well under 1 MB.

**CIT168 / Pauli**
- Probabilistic atlas from 168 HCP adults; labels were drawn in the left hemisphere and mirrored (S).
- The 16-label list (Pu, Ca, NAC, EXA, GPe, GPi, SNc, SNr, RN, PBP, VTA, VeP, HN, HTH, MN, STH) is from memory (E). Paper 10.1038/sdata.2018.63.
- Limits: no thalamic nuclei; the STN has no functional subzones; the VTA boundary is a convention.
- Browser: small meshes.

**Harvard AAN v2.0** (V)
- 22 node files of 7.2 MB each plus a combined 28.9 MB volume, 188 MB in total. DOI 10.5061/dryad.zw3r228d2.
- The Martinos page also lists thalamic regions (reticular, centromedian/parafascicular, central lateral) that were not in the Dryad file list I read.
- Limits: arousal nuclei only. No cranial nerve nuclei, olive, or the lower-brainstem autonomic nuclei.
- Browser: tiny once meshed.

**Diedrichsen cerebellar atlases** (V)
- Also includes Buckner 7/17 networks, the MDTB 10-region map and Nettekoven 2024 (32/68/128 regions). Formats: NIfTI, GIfTI, TSV.
- Check the per-atlas exception to the CC BY default. The FSL copy of the lobular atlas is CC BY-SA 4.0 (V).
- Citation: Diedrichsen 2009, 10.1016/j.neuroimage.2009.01.045 (E).
- Browser: a few MB as volumes; less as meshes or a flatmap.

**Allen Human Reference Atlas 3D** (V)
- Single-brain-derived parcellation drawn on the MNI template. I did not read the structure list, so its thalamic and brainstem depth is unknown; I expect it to be coarser than DISTAL or THOMAS (I).
- This CC BY grant is specific to this atlas. The general Allen terms remain non-commercial (V).

**Human Protein Atlas** (V for licence)
- Regional RNA and protein expression tables; no 3D voxel maps (E).
- Feeds the receptor and molecule end of the chain. Expression of a gene is not receptor density or function. Third-party items carry their own terms (V).
- Browser: JSON lookups.

**neuromaps / Hansen 2022**
- Hansen covers 19 receptors and transporters across 9 systems from over 1,200 people (S). DOI 10.1038/s41593-022-01186-3 (I, from the URL).
- Individually reusable maps: malen2022 D2 and kim2020 COX-1 are CC0; lukow2022 GABA-A α5 is CC BY 4.0 (V). The Beliveau serotonin and Nørgaard GABA-A maps are CC BY-NC-SA (V). Most others show no licence on the page I read, and I read only the first 100k characters of it.
- Limits: group-average PET at several-mm resolution (E); cortex-centred; binding is tracer-specific.
- Browser: parcel-level values are kilobytes.
- Alternative: Zilles and Palomero-Gallagher 2017 autoradiography, 15 receptors across 44 areas by layer stratum (S). I did not verify its licence.

**Neurosynth and NeuroQuery**
- Neurosynth data v0.7 dates from July 2018 and the repo is archived; it points to NeuroStore (V). Citation 10.1038/nmeth.1635 (E).
- NeuroQuery paper: eLife 53385 (V link).
- Limits: these are literature co-activation statistics. They support "studies mentioning X report activation here", not "this region does X".

**PAM50** (V for contents)
- 30 spinal levels C1 to S5, grey and white matter probability maps, 15 white-matter tracts and 3 grey regions per side. Straightened template.
- Citation: De Leener 2018, NeuroImage 165:170-179.
- Limits: a straightened cord needs artistic placement in a head-and-body model.

**NextBrain** (S)
- About 10,000 sections from five hemispheres; 333 regions; has its own online viewer. DOI 10.1038/s41586-025-09708-2.
- This is the strongest candidate for the remaining gaps, so its licence is worth chasing. The article is CC BY-NC-ND, which does not settle the data licence.

**EEG, fNIRS and device geometry**
- MNE ships 10-20 / 10-10 / 10-05 montages on fsaverage, Colin27 and a sphere, plus two fNIRS montages (V). They are idealised templates, not measured positions.
- Koessler 2009 gives 10-10 cortical projections in Talairach space with SDs of 4.6 to 7.8 mm (S). Use that variability as the honesty caveat for "electrode X sits over region Y".
- DBS leads: Medtronic 3389 is 4 contacts of 1.5 mm with 0.5 mm gaps on a 1.27 mm lead (S, OSS-DBS docs). Building parametric lead meshes from published specs avoids Lead-DBS's GPL code.
- I did not research cortical array geometry.

**Not gap-fillers**
- Brainnetome, AAL3 and Harvard-Oxford mostly re-cover cortex Hodos already has. AAL3's small nuclei are coarse.
- NeuroMorpho: about 300,000 cells (V). SWC files are kilobytes each. They are single-cell shapes, not connectivity. Its terms forbid scraping outside the API (V).

## 4. Ranked shortlist (licence-compatible gap fillers)

1. **Neudorfer hypothalamus**: the cleanest licence and it fills a named gap.
2. **CIT168**: SN, VTA, STN and red nucleus, once CC BY is confirmed on OSF.
3. **Harvard AAN v2**: brainstem nuclei, once the Dryad licence is confirmed.
4. **Diedrichsen cerebellar atlases**: lobules and deep nuclei.
5. **Allen Human Reference Atlas 3D**: whole-brain fallback for thalamus and brainstem divisions.
6. **Human Protein Atlas** plus the CC0 / CC BY neuromaps maps: receptor layer.
7. **eeg_positions / MNE montages** plus self-built lead meshes: device geometry.
8. **H01 proofread neurons and NeuroMorpho human cells**: synapse and "neuron chain" illustration.
9. **Neurosynth (ODbL)**: function-to-region, worded as association.
10. **PAM50** and **NextBrain**: pending licence checks.

## 5. Do not use, or use with a caveat

- **Brainstem Navigator**: do not use. Derived meshes are explicitly barred from redistribution.
- **THOMAS, DISTAL, Morel**: need written permission. This leaves VIM without a clean source.
- **Julich-Brain, BigBrain layers, PD25, Brainnetome, Hansen bundle, TRIBE v2, general Allen data**: non-commercial. Usable only if the site stays strictly non-commercial, and several add share-alike.
- **FSL-bundled JHU, Juelich, striatum and thalamus atlases**: under FSL's non-commercial licence (V).
- **AAL3**: GPL on data would pull derived meshes under copyleft.
- **MICrONS, FlyWire, BrainGlobe atlases**: never present as human.
- **H01**: one patient, one cubic millimetre.
- **Lead-DBS atlas page**: it states no licence for any atlas (V). "Bundled in Lead-DBS" is not permission.

## 6. Viewers worth copying

- **NiiVue** (BSD-2, WebGL2 with WebGPU coming; V): loads voxel, mesh and tractography formats in the browser. Best reference for slice views, clip planes and layered overlays (feature details E).
- **siibra-explorer** (Apache-2.0; V): region hierarchy tree, multi-resolution loading down to 20 µm BigBrain, region-linked data panels. Copy the "select a region, see attached datasets" pattern for devices and techniques.
- **Neuroglancer** (Apache-2.0; E): chunked level-of-detail meshes and shareable URL state. The H01 gallery is the live example.
- **NextBrain's online viewer** (S): worth a look for histology-to-MRI linking.
- **Brainrender** (E): desktop Python, not browser; useful only for visual style.
- **amyleesterling/human-brain**: the GitHub URL returned 404 and search found nothing, so I could not assess it.

## 7. Could not reach or confirm

- OSF page for CIT168 (blank render), AAL GIN site (certificate error), UCL data repository for NextBrain (403), NextBrain project site (empty render).
- EBRAINS dataset pages for Julich-Brain; Brainnetome's own site; the BigBrain licence forum post.
- Licence of the PAM50 data, NeuroQuery model data, and the Xie 2025 cranial nerve tractography atlas (arXiv:2507.23245, nerves II, III, V, VII/VIII from 50 HCP subjects).
- Allen cell-type dataset terms beyond the general Allen terms page.
