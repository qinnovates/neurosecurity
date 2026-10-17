> Archived copy of `<staging>/2026-10-atlas-geometry/licence-verification.md`, versioned with the data it justifies. Unchanged except that local paths read `<staging>` or `<scratchpad>`. Index: `docs/atlas/INDEX.md`.

# TARA Brain Atlas P2: licence verification of geometry sources

Date read for every source below: **2026-10-09**. Web research only. No account was created, no agreement was accepted, no imaging volume was downloaded. Small text files (licence files, label tables, READMEs) were fetched to a session scratch directory and read.

**Rule applied.** A source is cleared only where I read the primary licence or terms text this session and it permits public redistribution of derived files and commercial use. Everything else is "unverified" or "do not ship". I am not a lawyer; where a verdict rests on my reading of a text, the section says "interpretation".

**Evidence tags.** [V] = I read it at the primary source this session. [V-prev] = verified by `<staging>/sources-survey.md` or `<staging>/hodos-licence-validity-audit.md`, not re-read. [I] = my inference. [U] = unverified.

**DOIs.** Every DOI cited was resolved this session through Crossref, DataCite or the DOI handle API; the title returned is recorded in the item.

## Headline findings

1. **NextBrain data are CC0** on the UCL repository record the Nature paper names as its data source. The earlier survey had this as unverified.
2. **CIT168 (Pauli 2018) is CC BY 4.0** on OSF, confirmed through the OSF API. **Harvard AAN v2 is CC0**, confirmed in the Dryad API, the dataset README and DataCite.
3. **The Diedrichsen cerebellar atlas is not cleanly licensed.** The GitHub README says CC BY, the atlas folder says "See LICENSE file", the only LICENSE file in the repository says CC BY-NC 3.0, and the lab's own download pages say CC BY-NC 3.0. The earlier survey marked this "Yes". I mark it DO-NOT-SHIP until the lab clarifies.
4. **PAM50 has no licence at all.** The repository has no LICENSE file and an open issue (#53, opened 2026-08-04) asking exactly our question has no reply. All spinal cord regions stay without clean geometry.
5. **The Allen Human Reference Atlas 3D alone fills most holes** under CC BY 4.0 with no agreement: anterior thalamic complex, VL, STN, SN, GPi, GPe, amygdala nuclei, hypothalamic regions, cerebellar vermis, cerebellar deep nuclei, pons, medulla and midbrain parts, plus 50-odd cortical gyri. It has no VIM label.
6. **A cortex can ship without the HCP agreement.** Best option: cortical gyri and the cortex surface both derived from the Allen HRA 3D volume (CC BY 4.0). Finer option: Mindboggle-101 DKT31 labels (CC BY 4.0, cortical labels only).
7. **HCP-MMP1 and the S1200 group-average surface cannot be had from their primary publisher without accepting the HCP terms.** BALSA shows "Download (Login required)" and "Login to Agree" on both.
8. **MNE no longer ships `standard_1020.elc` / `standard_1005.elc` under those names.** They are now `colin27_1020.elc` / `colin27_1005.elc`, and MNE's own README says they come from FieldTrip, whose repository is GPL-3.0. Use `eeg_positions` (MIT) instead.

## Verdict table

| # | Source | Fills | Licence | Verified at primary | Redistribution | Commercial | Share-alike | Account or agreement to download | Verdict |
|---|---|---|---|---|---|---|---|---|---|
| 1 | CIT168 Reinforcement Learning atlas v1.1.0 (Pauli 2018) | STN, SNc, SNr, VTA, PBP, GPi, GPe, RN, striatum, hypothalamus | CC BY 4.0 | yes | yes | yes | no | none | **SHIP** |
| 1b | CIT168 Amygdala atlas v1.0.3 (Tyszka 2016) | BLA, CEN and other amygdala nuclei | CC BY-SA 4.0 (LICENSE.txt and wiki); OSF node field says CC BY 4.0 | yes (conflict; stricter reading used) | yes | yes | **yes** | none | **SHIP-SEPARATE-FILE** |
| 2 | Harvard AAN atlas v2.0 | Brainstem arousal nuclei incl. VTA, mRt, PnO | CC0 1.0 | yes | yes | yes | no | none | **SHIP** |
| 3 | PAM50 spinal cord template | Spinal cord levels, tracts | none stated | yes (absence confirmed) | not granted | not granted | n/a | none | **DO-NOT-SHIP** |
| 4 | NextBrain data (UCL RDR 10.5522/04/24243835) | 333 histological regions | CC0 | yes (licence); labels and space not read | yes | yes | no | none | **SHIP** (after reading the in-zip readme) |
| 5a | Yeo 2011 7/17 networks, CBIG repository | Network labels (fsaverage5, fs_LR 32k, FSL MNI152) | MIT | yes | yes | yes | no | none | **SHIP** (interpretation: MIT covers the data files) |
| 5b | Schaefer 2018 parcellation, CBIG repository | Parcels named by Yeo network and component | MIT | yes | yes | yes | no | none | **SHIP** (same interpretation) |
| 6 | Allen Human Reference Atlas 3D, 2020 | 141 structures, whole brain | CC BY 4.0 | yes | yes | yes | no | none | **SHIP** |
| 7a | Cortex surface generated from the Allen HRA 3D cortical labels | Cortical surface with gyral labels | CC BY 4.0 (derived) | yes | yes | yes | no | none | **SHIP** |
| 7b | Cortex surface generated from an MNI ICBM152 2009 template | Cortical surface | MNI permissive notice | yes | yes | yes | no | none | **SHIP** |
| 7c | Mindboggle-101 DKT31 joint-fusion atlas in MNI152 | 31 cortical labels per hemisphere | CC BY 4.0 for cortical labels; subcortical manual labels CC BY-NC-ND 4.0 | yes | cortical: yes | cortical: yes | no | none | **SHIP cortical labels only**; subcortical labels DO-NOT-SHIP |
| 7d | fsaverage, Desikan, Destrieux, FreeSurfer Yeo files | Surface and gyral atlases | FreeSurfer Software License Agreement v1.0 | yes | yes, with all of Part B attached | yes, "at the sole risk" | no | none; acceptance by use, includes obligations | **NEEDS-KEVIN** (licence with acceptance-by-use terms) |
| 7e | CerebrA (Manera 2020) | DKT-style labels on MNI 2009c Sym | not stated on the MNI page; derived from Mindboggle whole-brain labels | no | unverified | unverified | unverified | none | **DO-NOT-SHIP** (unverified) |
| 7f | HCP S1200 group-average surface; HCP-MMP1 | Cortex surface, 180 areas per hemisphere | WU-Minn HCP Open Access Data Use Terms (access agreement) | yes | only "under these same Data Use Terms" | silent | terms-carry-forward | **login and agreement required** | **NEEDS-KEVIN** |
| 8 | HCP1065 tractography atlas (Yeh 2022) | White-matter bundles | CC BY-SA 4.0 plus HCP acknowledgement | yes | yes | yes | **yes** | none | **SHIP-SEPARATE-FILE** |
| 9 | Melbourne Subcortex Atlas (Tian 2020) | Subcortical functional parcels | custom "Melbourne Subcortex Atlas License" | yes | yes | not excluded (interpretation) | no | none | **SHIP** |
| 10 | Diedrichsen cerebellar atlas (Anatom: lobules and deep nuclei) | Cerebellar lobules, vermis, dentate, interposed, fastigial | conflicting: CC BY vs CC BY-NC 3.0 | yes (conflict found) | unclear | **unclear** | no | none on GitHub; registration form on lab site | **DO-NOT-SHIP** (pending clarification) |
| 11 | Neudorfer 2020 hypothalamus atlas | 13 hypothalamic nuclei plus STN, SN, RN, ZI, BNST, NBM and tracts | CC BY 4.0 | yes | yes | yes | no | none | **SHIP** |
| 12a | MNI ICBM152 2009 a/b/c templates, symmetric and asymmetric | Base template | MNI/McGill permission notice | yes | yes | yes | no | none | **SHIP** |
| 12b | TemplateFlow transform files | NLin6Asym to 2009cAsym and back | no licence stated for the transform files themselves | no | unverified | unverified | unverified | none | **Use in pipeline only; do not redistribute** |
| 13a | `eeg_positions` (sappelhoff) | 10-20, 10-10, 10-05 on a sphere | MIT | yes | yes | yes | no | none | **SHIP** |
| 13b | MNE `spherical_10xx.tsv` | Same data as 13a | BSD-3-Clause repo; data from 13a (MIT) | yes | yes | yes | no | none | **SHIP** |
| 13c | MNE `colin27_1020.elc`, `colin27_1005.elc` (formerly `standard_*`) | 10-20 / 10-05 on Colin27 | BSD-3-Clause repo, but files come from FieldTrip (GPL-3.0) | yes (provenance conflict) | unclear | unclear | possibly copyleft | none | **DO-NOT-SHIP** |
| 14 | DBS lead dimensions | Parametric lead meshes | facts from FDA documents and two peer-reviewed papers | yes | n/a (facts) | n/a | no | none | **SHIP** (self-built meshes, cite sources) |
| 15 | H01 (Shapson-Coe 2024) | Human synapse-level example | CC BY 4.0 | yes | yes | yes | no | none | **SHIP** |
| 16a | AHEAD structure maps in MNI 2009b (Alkemade 2020) | STN, SN, RN, GPi, GPe | CC BY 4.0 | yes (licence and readme); archive not opened | yes | yes | no | none | **SHIP** |
| 16b | MASSP 2.0 parcellation priors | 35 subcortical structures incl. VTA, PAG, PPN, raphe | CC BY 4.0 | yes (licence, label list); space not read | yes | yes | no | none | **SHIP** with caveat (priors, not an atlas) |
| 16c | Najdenovska 2018 thalamic atlas | 7 thalamic groups per side incl. Anterior | CC BY-SA 4.0 on the record; README says "All rights reserved" | yes (conflict found) | unclear | unclear | yes | none | **DO-NOT-SHIP** (pending clarification) |
| 16d | THOMAS thalamic atlas in MNI (Saranathan 2021) | VIM, AV and other nuclei | none; Zenodo records are "restricted" | yes | no | no | n/a | access request | **DO-NOT-SHIP** |

## 1. CIT168 (Pauli 2018)

- **Verdict:** SHIP. Licence **CC BY 4.0** (OSF name: "CC-By Attribution 4.0 International").
- **Evidence [V]:** `https://api.osf.io/v2/nodes/jkzwp/` returns title "Reinforcement Learning Atlas", `node_license: {year: "2017"}` and a licence relationship to `https://api.osf.io/v2/licenses/563c1cf88c5e4a3877f9e96a/`, whose record reads name "CC-By Attribution 4.0 International", url `https://creativecommons.org/licenses/by/4.0/legalcode`, text beginning "Creative Commons Attribution 4.0 International Public License". The parent project `r2hvk` ("An In Vivo High Resolution Atlas of the Subcortical Human Brain") carries the same licence.
- **Paper:** 10.1038/sdata.2018.63 resolved (Crossref): "A high-resolution probabilistic in vivo atlas of human subcortical brain nuclei", Scientific Data 2018, Pauli, Nili et al.
- **Attribution:** cite Pauli et al. 2018 with the DOI, name the licence, link `https://osf.io/jkzwp/`, state changes (meshing, thresholding). The atlas is built from HCP data (OSF wiki: "Based on a midspace template derived from Human Connectome Project structural MRI"); the Reinforcement Learning wiki text I read carries no HCP condition, but adding the HCP acknowledgement sentence costs nothing [I].
- **Space and resolution:** native CIT168 space at 700 µm; also provided in "MNI152 2009c nonlin asym 1 mm" and FSL MNI152 [V, wiki and file names].
- **Files (no account, direct):**
  - `CIT168toMNI152-2009c_prob.nii.gz` (857,744 bytes) `https://osf.io/download/w8zq2/`
  - `CIT168toMNI152-2009c_det.nii.gz` (51,026 bytes) `https://osf.io/download/vak6p/`
  - `labels.txt` (123 bytes) `https://osf.io/download/6qrcb/`
  - native-space `prob_atlas_bilateral.nii.gz` `https://osf.io/download/huqyp/`
  - Note: `osf.io/download/...` redirects to `files.osf.io`; curl needed `--http1.1` to complete.
- **Label list [V, `labels.txt`]; ids are zero-based volume indices of the 4D probabilistic atlas:**
  0 Pu, 1 Ca, 2 NAC, 3 EXA, 4 GPe, 5 GPi, 6 SNc, 7 RN, 8 SNr, 9 PBP, 10 VTA, 11 VeP, 12 HN, 13 HTH, 14 MN, 15 STH.
  Names from the OSF wiki: Putamen, Caudate Nucleus, Nucleus Accumbens, Extended Amygdala, Globus Pallidus External, Globus Pallidus Internal, Substantia Nigra Pars Compacta, Red Nucleus, Substantia Nigra Pars Reticulata, Parabrachial Pigmented Nucleus, Ventral Tegmental Area, Ventral Pallidum, Habenular Nuclei, Hypothalamus, Mammillary Nucleus, Subthalamic Nucleus. (The wiki prints "HN" for both Hypothalamus and Habenular Nuclei; `labels.txt` has HN at 12 and HTH at 13.) This corrects the order given from memory in the earlier survey.

### 1b. CIT168 Amygdala atlas (sibling component `hksa6`)

- **Verdict:** SHIP-SEPARATE-FILE, treated as **CC BY-SA 4.0**.
- **Conflict [V]:** the OSF node licence field says CC BY 4.0, but `CIT168_Amygdala_v1.0.3/LICENSE.txt` reads "This work is licensed under a Creative Commons Attribution-ShareAlike 4.0 International License (http://creativecommons.org/licenses/by-sa/4.0/)" and the wiki history says "2016-08-01 1.0.1 Update to Creative Commons BY-SA 4.0 License". I take the stricter one [I].
- The wiki carries the HCP acknowledgement sentence.
- **Labels [V, `CIT168_AmyLabels.txt`]:** 1 AMY_BLN_La, 2 AMY_BLN_BL_BLD+BLI, 3 AMY_BLN_BM, 4 AMY_CEN, 5 AMY_CMN, 6 AMY_BL_BLV, 7 AMY_ATA, 8 AMY_ATA_ASTA, 9 AMY_AAA, 10 AMY.
- **Files:** `CIT168_pBLA_1mm_MNI.nii.gz` `https://osf.io/download/jx23h/`, `CIT168_pCEN_1mm_MNI.nii.gz` `https://osf.io/download/2u4zs/`, `CIT168_pAmyNuc_1mm_MNI.nii.gz` `https://osf.io/download/5ujaf/`, `LICENSE.txt` `https://osf.io/download/wexs6/`.
- Not needed if the Allen atlas (item 6) is used for `bla` and `cea`.

## 2. Harvard Ascending Arousal Network atlas v2.0

- **Verdict:** SHIP. Licence **CC0 1.0**.
- **Evidence [V]:**
  - Dryad API `https://datadryad.org/api/v2/datasets/doi%3A10.5061%2Fdryad.zw3r228d2` returns `"license": "https://spdx.org/licenses/CC0-1.0.html"`, version 5, published 2023-07-18.
  - The dataset README: "Licenses/restrictions placed on the data: CC0 1.0 Universal (CC0 1.0) Public Domain".
  - DataCite for 10.5061/dryad.zw3r228d2 resolved: "Harvard Ascending Arousal Network Atlas – Version 2.0", rights `cc0-1.0`.
- **Attribution (requested, not required under CC0):** "Edlow, BL; Kinney, HC (2023), Harvard Ascending Arousal Network Atlas – Version 2.0, Dryad Digital Repository, https://doi.org/10.5061/dryad.zw3r228d2". Related preprint 10.1101/2023.07.13.548265 resolved: "Sustaining wakefulness: Brainstem connectivity in human consciousness" (Edlow, Olchanyi et al., 2023).
- **Space and resolution:** README: "MNI152 1mm = Montreal Neurological Institute 152 stereotactic space at 1 mm isotropic resolution". It does not name the template variant. Each node file is 7,221,384 bytes uncompressed, which equals a 182 × 218 × 182 one-byte grid plus a 352-byte header, the FSL MNI152 1 mm grid; so MNI152NLin6Asym is my inference, not a stated fact [I].
- **Download:** the Dryad file API needs a bearer token and the Dryad web file link returned 403 to curl. The same deposit is served without login by Zenodo record 8161638 (community "dryad", licence `cc-zero`, same DOI), for example `https://zenodo.org/api/records/8161638/files/AAN_Brainstem_MNI152_1mm_v2p0.nii/content` (28,884,480 bytes), `.../README.md/content`, `.../AAN_Brainstem_v2p0_Color_LUT_FreeSurfer.txt/content`. No click-through.
- **Node list [V, LUT and README]:**

| id | Node | Name | Lateralised ids |
|---|---|---|---|
| 7201 | DR | dorsal raphe | midline |
| 7202 | MnR | median raphe | midline |
| 7203 | PAG | periaqueductal grey | midline |
| 7204 | VTA | ventral tegmental area | midline |
| 7205 | LC | locus coeruleus | 7301 left, 7401 right |
| 7206 | LDTg | laterodorsal tegmental nucleus | 7302, 7402 |
| 7207 | mRt | mesencephalic reticular formation | 7303, 7403 |
| 7208 | PBC | parabrachial complex | 7304, 7404 |
| 7209 | PnO | pontis oralis (pontine reticular formation) | 7305, 7405 |
| 7210 | PTg | pedunculotegmental nucleus | 7306, 7406 |

- Ten brainstem nodes. The thalamic, hypothalamic and basal forebrain nodes mentioned on the Martinos page are not in this deposit.

## 3. PAM50 spinal cord template

- **Verdict:** DO-NOT-SHIP. **No licence is stated for the data.**
- **Evidence [V]:**
  - GitHub API for `spinalcordtoolbox/PAM50` returns `license: null`. The repository tree has no LICENSE, COPYING or NOTICE file; `README.md` and `CHANGES.md` contain no licence wording.
  - The release assets are single zips (`PAM50-r20250730.zip`, `PAM50-r20250422.zip`, `PAM50-r20250109.zip`); I did not open them (imaging data).
  - Open issue `https://github.com/spinalcordtoolbox/PAM50/issues/53`, "Licensing clarification for PAM50 data files in release r20250730", opened 2026-08-04 by a third party asking the same question. It has **no replies**.
  - The Spinal Cord Toolbox code repository is LGPL-3.0 (GitHub API). The SCT documentation page for PAM50 says nothing about a data licence.
  - Interpretation: with no licence, default copyright applies and nothing is granted. An LGPL on the separate code repository does not reach these data files.
- **Paper:** 10.1016/j.neuroimage.2017.10.041 resolved: "PAM50: Unbiased multimodal template of the brainstem and spinal cord aligned with the ICBM152 space", NeuroImage 2018, De Leener, Fonov et al.
- **What it has [V, `info_label.txt` files and `CHANGES.md`]:**
  - `template/`: T1, T2, T2* templates; cord, CSF, white and grey matter masks; `PAM50_levels.nii.gz` (vertebral levels), `PAM50_spinal_levels.nii.gz` (spinal levels, "based on Frostell et al."), disc and body point labels, cervical dorsal rootlets "C2-C8", a "cauda equinea label (60)" in the point label files.
  - `atlas/`: 30 white matter tracts (ids 0–29: left and right fasciculus gracilis, fasciculus cuneatus, lateral corticospinal, ventral spinocerebellar, rubrospinal, lateral reticulospinal, spinal lemniscus, spino-olivary, ventrolateral reticulospinal, lateral vestibulospinal, ventral reticulospinal, ventral corticospinal, tectospinal, medial reticulospinal, medial longitudinal fasciculus), 6 grey matter regions (30–35: left and right ventral horn, intermediate zone, dorsal horn), 36 CSF contour; combined labels 50 spinal cord, 51 white matter, 52 gray matter, 53 dorsal columns, 54 lateral funiculi, 55 ventral funiculi.
  - The exact range of levels (the earlier survey says 30 spinal levels C1 to S5 [V-prev]) I did not re-read.
- **Action that could unlock it:** a written licence statement from the maintainers (NeuroPoly, Polytechnique Montréal). Issue #53 is the place to watch.

## 4. NextBrain (2025 histological atlas)

- **Verdict:** SHIP as far as licence goes. Licence on the data record: **CC0**.
- **Evidence [V]:**
  - The article's Data availability statement (Europe PMC full text, PMC12711564): "The raw data used in this Article (MRI, histology, segmentations and so on) can be downloaded from 10.5522/04/24243835."
  - 10.5522/04/24243835 resolved (DOI handle API) to the UCL Research Data Repository record "Registered histology, MRI, and manual annotations of over 300 brain regions in 5 human hemispheres (data from ERC Starting Grant 677697 "BUNGEE-TOOLS")".
  - figshare API `https://api.figshare.com/v2/articles/24243835`: `license: {name: "CC0", url: "https://creativecommons.org/publicdomain/zero/1.0/"}`, published 2023-10-06, not embargoed.
  - The record description says it includes "(e) A probabilistic atlas built from the hemispheres".
  - Article 10.1038/s41586-025-09708-2 resolved: "A probabilistic histological atlas of the human brain for MRI segmentation", Nature, 2025-11-05, Casamitjana, Mancini et al.; article licence CC BY-NC-ND 4.0 (applies to the article, not the data).
  - Companion OpenNeuro dataset ds005422 ("NextBrain Data Extension") has `"License": "CC0"` in `dataset_description.json`.
- **Files (no account):** `3dAtlas.zip` (397,039,281 bytes) `https://ndownloader.figshare.com/files/42561616` — "nifti files with summary imaging volumes of the probabilistic atlas"; `readme.txt` `https://ndownloader.figshare.com/files/42561607`; `SegmentationCode.zip` (2.5 GB) holds the code and atlas data files.
- **Not read [U]:** the 333-label list, the atlas template space and resolution. They sit inside the zips ("each directory has a readme.txt file explaining its contents") and I did not download imaging archives. The atlas is built from five hemispheres, so expect one hemisphere in its own space, needing registration to MNI by the pipeline [I].
- **Caveat:** the same atlas is also distributed inside FreeSurfer, where the FreeSurfer licence applies; take it from the UCL record, not from FreeSurfer.
- **Attribution (courtesy under CC0):** cite the Nature article and the UCL DOI.

## 5. Yeo 2011 networks and Schaefer 2018, CBIG repository

- **Verdict:** SHIP both. Licence **MIT** (repository-wide).
- **Evidence [V]:**
  - `https://github.com/ThomasYeoLab/CBIG/blob/master/LICENSE.md`: "Copyright (c) 2016 Computational Brain Imaging Group (CBIG)" and "Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software".
  - Root `README.md`: "See our LICENSE file for license rights and limitations (MIT)."
  - I searched the full repository tree (11,353 entries) for licence-like file names. The only other licence files sit under `external_packages/`. There is **no per-folder licence or notice** in `stable_projects/brain_parcellation/Yeo2011_fcMRI_clustering` or `.../Schaefer2018_LocalGlobal`, and the four READMEs there contain no licence, copyright or redistribution wording.
  - Interpretation: MIT speaks of "software and associated documentation files". The authors placed the label files in the repository under that single licence with no carve-out, so I read it as covering them. A court could read "Software" more narrowly; that risk is small but it is not zero.
- **Yeo 2011 is shipped in all three forms [V, tree]**, under `stable_projects/brain_parcellation/Yeo2011_fcMRI_clustering/1000subjects_reference/Yeo_JNeurophysiol11_SplitLabels/`:
  - `fs_LR32k/Yeo2011_7Networks_N1000.dlabel.nii`, `Yeo2011_17Networks_N1000.dlabel.nii` (and `.split_components.dlabel.nii`)
  - `fsaverage5/label/lh.Yeo2011_7Networks_N1000.annot`, `rh....annot`, 17-network equivalents, and split-component `.annot` and `.label` files
  - `MNI152/Yeo2011_7Networks_N1000.split_components.FSL_MNI152_1mm.nii.gz` (also `_2mm`, `_FreeSurferConformed_1mm`), 17-network equivalents, colour tables and centroid CSVs
  - Raw URL pattern: `https://raw.githubusercontent.com/ThomasYeoLab/CBIG/master/<path>`.
- **Schaefer 2018 [V, tree and README]**, under `.../Schaefer2018_LocalGlobal/Parcellations/`: `FreeSurfer5.3/{fsaverage,fsaverage5,fsaverage6}/label/{lh,rh}.Schaefer2018_400Parcels_17Networks_order.annot`, `HCP/fslr32k/cifti/Schaefer2018_400Parcels_17Networks_order.dlabel.nii` with `..._info.txt`, `MNI/Schaefer2018_400Parcels_17Networks_order_FSLMNI152_1mm.nii.gz` with lookup tables and centroid CSVs; 100 to 1000 parcels, 7- and 17-network orderings. README: "each parcel is matched to a corresponding network in the 7 and 17 network parcellation by Yeo et al. 2011".
- **Space:** volumes are in FSL MNI152 (MNI152NLin6Asym) at 1 and 2 mm; surfaces on fsaverage5/6/fsaverage and fs_LR 32k.
- **Papers:** 10.1152/jn.00338.2011 resolved: "The organization of the human cerebral cortex estimated by intrinsic functional connectivity", J Neurophysiol 2011. 10.1093/cercor/bhx179 resolved: "Local-Global Parcellation of the Human Cerebral Cortex from Intrinsic Functional Connectivity MRI", Cerebral Cortex.
- **Attribution:** keep the MIT copyright and permission notice with the files; cite the two papers.
- **Notes:**
  - This replaces the unlicensed `DiedrichsenLab/fs_LR_32` resample and the FreeSurfer-licence copy that Hodos used.
  - The label files carry no surface geometry. An fs_LR or fsaverage mesh to draw them on is a separate licensing question (item 7). The MNI152 volume versions avoid that problem.
  - The repository also contains `data/templates/surface/fs_LR_32k` and `standard_mesh_atlases_*`. I did not open them; they look HCP-pipeline-derived, so do not assume MIT cleans them [U].

## 6. Allen Human Reference Atlas 3D, 2020

- **Verdict:** SHIP. Licence **CC BY 4.0**.
- **Evidence [V]:** `README.pdf` in the primary download directory `https://download.alleninstitute.org/informatics-archive/allen_human_reference_atlas_3d_2020/version_1/`: "These materials are now provided under the Attribution International 4.0 (CC BY 4.0) license as of Sept. 1, 2022".
- **Required attribution (README):** "Song‐Lin Ding, Joshua J. Royall, Susan M. Sunkin, Benjamin A.C. Facer, Phil Lesnar, Amy Bernard, Lydia Ng, Ed S. Lein (2020). "Allen Human Reference Atlas – 3D, 2020," RRID:SCR_017764, version 1.0.0." Copyright notice: "© 2019 Allen Institute for Brain Science". Ontology citation: Ding et al. 2016, 10.1002/cne.24080 (resolved: "Comprehensive cellular‐resolution atlas of the adult human brain", J Comp Neurol). Follow the Allen citation policy; add licence link and a statement of changes.
- **Template space:** README: "drawn on the MRI reference brain volume "ICBM 2009b Nonlinear Symmetric"" = MNI152NLin2009bSym. Resolution 0.5 mm isotropic: the published voxel table gives 6,999,201 voxels = 874,900.125 mm³, i.e. 0.125 mm³ per voxel [V, computed].
- **Files (no account):** `annotation.nii.gz` (1,117,842 bytes), `annotation_full.nii.gz` (1,815,762 bytes), `README.pdf`, `examples/voxel_count/voxel_count.csv` (structure table). The `examples/flip_annotation/` folder suggests `annotation.nii.gz` is one hemisphere and `annotation_full` both; not confirmed [I].
- **Structure list [V]:** `voxel_count.csv` lists the 141 annotated structures with Allen structure ids (structure graph 16). Full list, `id acronym name`:
  - **Cortex, allocortex and insular:** 10329 FI frontal agranular insular cortex; 10330 TI temporal agranular insular cortex; 10307 OB olfactory bulb; 10308 AON anterior olfactory nucleus; 10311 Pir piriform cortex.
  - **Amygdala and extended amygdala:** 10361 AMY amygdaloid complex; 10362 AAA anterior amygdaloid area; 10363 CEN central nuclear group; 10374 CoA anterior cortical nucleus; 10375 CoP posterior cortical nucleus; 10376 Me medial nucleus; 10377 AHA amygdalohippocampal area; 10367 La lateral nucleus; 10368 BL basolateral nucleus (basal nucleus); 10369 BM basomedial nucleus (accessory basal nucleus); 10384 BNST bed nucleus of stria terminalis.
  - **Basal ganglia and basal forebrain:** 10335 CaH head of caudate; 10336 CaB body of caudate; 10337 CaT tail of caudate; 10338 Pu putamen; 146034754 PuPV posteroventral putamen; 10339 NAC nucleus accumbens; 10343 GPe external segment of globus pallidus; 10344 GPi internal segment of globus pallidus; 10346 Cla claustrum; 10349 BF basal forebrain; 10350 SEP septal nuclei.
  - **Thalamus and epithalamus:** 10390 THM thalamus (remainder); 10392 ANC anterior nuclear complex; 10396 LD lateral dorsal nucleus; 10398 MD mediodorsal nucleus; 10403 Re reuniens nucleus; 10408 LP lateral posterior nucleus; 10409 Pul pulvinar; 10417 VA ventral anterior nucleus; 10420 VL ventral lateral nucleus; 10424 VPL ventral posterior lateral nucleus; 10425 VPM ventral posterior medial nucleus; 10430 DLG dorsal lateral geniculate nucleus; 10434 MG medial geniculate nuclei; 10449 CM centromedian nucleus; 10450 Pf parafascicular nucleus; 13045 MiN midline nuclear complex; 10452 HN habenular nuclei; 10460 Pin pineal body; 10463 ZI zona incerta.
  - **Subthalamus and hypothalamus:** 10466 STH subthalamic nucleus; 10467 HTH hypothalamus (remainder); 10468 HTHpo preoptic region; 10473 HTHso supraoptic region; 10483 HTHtub tuberal region; 10495 HTHma mammillary region.
  - **Forebrain white matter and ventricles:** 10557 FWM white matter of forebrain; 10559 ac anterior commissure; 10561 cc corpus callosum; 10576 fx fornix; 10586 mtt mammillothalamic tract; 12073 olt olfactory tract; 266441621 or optic radiation; 10589 ot optic tract; 10597 aLV, 10598 bLV, 266441657 xLV, 10599 pLV, 10600 iLV (anterior horn, body, atrium, posterior horn, inferior horn of lateral ventricle); 10602 3V third ventricle.
  - **Frontal gyri:** 12114 PrCG precentral gyrus; 12115 SFG superior frontal gyrus; 12116 MFG middle frontal gyrus; 12118 IFGtr inferior frontal gyrus, triangular part; 12119 IFGop inferior frontal gyrus, opercular part; 12121 ReG gyrus rectus; 12122 MOrG medial orbital gyrus; 12123 AOrG anterior intermediate orbital gyrus; 12124 POrG posterior intermediate orbital gyrus; 12125 LOrG lateral orbital gyrus; 12126 PCLr paracentral lobule, rostral part; 146034872 PaCG paracingulate gyrus; 12127 FrO frontal operculum; 146034876 RoG rostral gyrus; 13229 LOG lateral olfactory gyrus; 146034884 FMG frontomarginal gyrus; 146034888 FP frontal pole.
  - **Parietal gyri:** 12132 PoCG postcentral gyrus; 12133 SPL supraparietal lobule; 12135 SMG supramarginal gyrus; 12136 AnG angular gyrus; 12137 PrCun precuneus; 12138 PCLc paracentral lobule, caudal part; 13230 PaO parietal operculum.
  - **Temporal gyri:** 12140 STG superior temporal gyrus; 12141 MTG middle temporal gyrus; 12142 ITG inferior temporal gyrus; 12143 FuGt fusiform gyrus, temporal part; 146034892 PRG perirhinal gyrus; 12144 TTG transverse temporal gyrus (Heschl's gyrus); 12145 PLT planum temporale; 12146 TP temporal pole; 12147 PLP planum polare.
  - **Occipital gyri:** 12149 OP occipital pole; 12150 Cun cuneus; 12151 LiG lingual gyrus; 12152 FuGo fusiform gyrus, occipital part; 12153 IOG inferior occipital gyrus; 12154 SOG superior occipital gyrus.
  - **Insula:** 12177 LIG long insular gyri; 12178 SIG short insular gyri; 12179 LI limen insula.
  - **Limbic lobe:** 12157 CgGr cingulate gyrus, rostral (anterior) part; 12158 CgGc cingulate gyrus, caudal (posterior) part; 12159 IsCPH cingulo-parahippocampal isthmus; 12160 SCG subcallosal gyrus; 12163 APH anterior parahippocampal gyrus; 12164 PPH posterior parahippocampal gyrus; 12166 AG ambiens gyrus; 12171 HiH head of hippocampus; 12173 HiB body of hippocampus; 12174 HiT tail of hippocampus.
  - **Midbrain:** 12181 PTR pretectal region; 12195 MTg midbrain tegmentum; 12247 RN red nucleus; 12251 SN substantia nigra; 12292 SC superior colliculus; 12305 IC inferior colliculus; 12330 cpd cerebral peduncle; 12354 scp superior cerebellar peduncle; 12369 Aq cerebral aqueduct.
  - **Cerebellum:** 10658 CBV cerebellar vermis; 12384 CBPV paravermis of cerebellum; 12390 CBL lateral hemisphere of cerebellum; 10660 CbDN cerebellar deep nuclei.
  - **Pons and medulla:** 12405 PnBa basilar part of pons; 12416 PnTg pontine tegmentum; 12535 MoPy pyramidal part of medulla oblongata; 12538 MoTg tegmentum of medulla oblongata; 12600 IO inferior olive.
  - **Hindbrain white matter and ventricle:** 10668 HWM white matter of hindbrain; 12741 icp inferior cerebellar peduncle; 12768 mcp middle cerebellar peduncle; 12805 4V fourth ventricle; 12826 cec central canal of medulla oblongata.
- **What the PM asked about specifically:**
  - Thalamic nuclei: ANC, LD, MD, Re, LP, Pul, VA, VL, VPL, VPM, DLG, MG, CM, Pf, MiN. **No VIM** (the ventral intermediate nucleus is conventionally a part of the posterior VL; a VL mesh is a parent region, not VIM). No separate AV/AD/AM within the anterior complex. No reticular nucleus.
  - Brainstem divisions: midbrain tegmentum, pretectal region, colliculi, red nucleus, substantia nigra (not split into compacta and reticulata), cerebral peduncle; basilar pons and pontine tegmentum; medullary pyramid, medullary tegmentum, inferior olive. No VTA, no locus coeruleus, no raphe, no reticular formation label, no cranial nerve nuclei.
  - Basal ganglia: caudate head, body, tail; putamen and posteroventral putamen; accumbens; GPe; GPi; STN; SN; claustrum.
  - Cerebellum: vermis, paravermis, lateral hemisphere, deep nuclei as one label. No lobules, no dentate/interposed/fastigial split.
  - Cortical gyri: listed above. No area-level labels (no separate V1, M1 versus premotor, or SMA).

## 7. A cortex without a data-use agreement

**(a) Surface mesh candidates**

| Candidate | What it is | Terms | Licence or agreement | Verdict |
|---|---|---|---|---|
| Isosurface of the Allen HRA 3D cortical gyral labels | Mesh the pipeline generates from the 0.5 mm label volume; each face inherits a gyrus label | CC BY 4.0 [V] | Licence | **SHIP: best option** |
| Isosurface from an MNI ICBM152 2009 template (grey matter probability map or brain mask) | Mesh the pipeline generates from the template | MNI notice: "Permission to use, copy, modify, and distribute ... for any purpose and without fee" [V] | Licence | **SHIP** |
| Surfaces "distributed with" the MNI 2009 templates | The MNI page lists T1w/T2w/PDw, tissue probability maps, lobe atlas and masks. It lists **no surface files** [V] | n/a | n/a | Not available; generate instead |
| fsaverage (FreeSurfer) | Average surface of 40 subjects | FreeSurfer Software License Agreement v1.0 [V]: covers "software and/or data"; "downloading, copying, modifying, displaying, distributing or use ... constitutes acceptance"; grants "a royalty-free, non-exclusive license to use, reproduce, make derivative works of, display and distribute"; every copy must carry all of Part B with the prescribed preface; "Any commercialization of the Software is at the sole risk of the party" | A licence, not an access gate, but one that binds by use and carries obligations (attach Part B, mark modifications, research-only statement) | **NEEDS-KEVIN** |
| TemplateFlow `tpl-fsaverage`, `tpl-fsLR` | Re-packaged GIFTI surfaces and atlases | `template_description.json` says "License: See LICENSE file" but **the repositories contain no LICENSE file** [V] | Unstated | Unverified; do not rely on it |
| HCP S1200 group-average surfaces | `S1200.L.midthickness_MSMAll.32k_fs_LR.surf.gii` etc. | WU-Minn HCP Open Access Data Use Terms [V] | **Access agreement** | **NEEDS-KEVIN** |

**(b) Parcellation candidates**

| Candidate | Named regions relevant to the request | Terms | Licence or agreement | Verdict |
|---|---|---|---|---|
| Allen HRA 3D gyral labels (item 6) | primary motor ≈ PrCG; primary somatosensory ≈ PoCG; primary auditory ≈ TTG (Heschl); Broca ≈ IFGop + IFGtr; insula = SIG + LIG (+ LI); anterior cingulate = CgGr; posterior cingulate = CgGc; posterior parietal ≈ SPL + SMG + AnG. **Not separable:** premotor and SMA (inside SFG, MFG, PCLr), primary visual (inside Cun, LiG, OP) | CC BY 4.0 | Licence | **SHIP** |
| Mindboggle-101 DKT31 (Klein and Tourville 2012) | precentral, postcentral, transverse temporal, pars opercularis, pars triangularis, **pericalcarine** (V1 proxy), **caudal middle frontal** (premotor proxy), paracentral, superior parietal, inferior parietal, supramarginal, insula, caudal and rostral anterior cingulate, posterior cingulate, isthmus cingulate. No SMA label | OSF wiki [V]: "All labeled data ... are licensed under a by-attribution Creative Commons License" (link: `creativecommons.org/licenses/by/4.0`). But: "The manually labeled subcortical portions of the "WholeBrain" OASIS-TRT-20 labels are licensed under a similar Creative Commons License" (link: `creativecommons.org/licenses/by-nc-nd/4.0`). OSF node licence for `nhtur` and the atlases component `kgdey`: CC BY 4.0 | Licence | **SHIP cortical labels only** (ids 1002–1035, 2002–2035). Drop the subcortical "CMA" labels in the same file: they derive from the NC-ND material [I] |
| Schaefer 2018 (item 5) | Parcel names carry Yeo components such as `SomMotB_Aud`, `SomMotB_Cent`, `SomMotB_S2`, `VisCent_Striate`, `DorsAttnB_FEF`, `DorsAttnB_PrCv`, `SalVentAttnA_Ins`, `ContC_Cingp`, `DefaultA_pCunPCC`, `DorsAttnA_SPL`. These are functional-network parcels, not anatomical areas | MIT | Licence | **SHIP**, for a network view; do not present as anatomical areas |
| Desikan-Killiany, Destrieux (FreeSurfer) | Gyral atlases | FreeSurfer licence | Licence with acceptance-by-use | **NEEDS-KEVIN** |
| CerebrA (Manera 2020) | Mindboggle labels fitted to MNI 2009c symmetric | The MNI CerebrA page states no licence [V]; the G-Node repository was unreachable; the source labels include the NC-ND subcortical set | Unstated | **DO-NOT-SHIP** (unverified) |
| Brodmann-area label sets | — | I found none with a licence I could read at a primary source. FreeSurfer's BA labels fall under the FreeSurfer licence; Julich-Brain is CC BY-NC-SA [V-prev, second-hand] | — | None cleared |
| HCP-MMP1 | 180 areas per hemisphere | HCP terms | **Access agreement** | **NEEDS-KEVIN** |

**Recommendation.** Use the Allen HRA 3D volume for both the cortical mesh and the gyral labels: one source, CC BY 4.0, no agreement, already in MNI space. If the site needs a V1 proxy and a premotor proxy, add the Mindboggle DKT31 cortical labels. Say on the page that gyri stand in for functional areas (precentral gyrus is not identical to primary motor cortex).

**Mindboggle files [V, OSF API]:** `OASIS-TRT-20_jointfusion_DKT31_CMA_labels_in_MNI152_v2.nii.gz` (342,689 bytes) `https://osf.io/download/c7dax/`; label names `labels.surface.DKT31.fullnames.txt` `https://osf.io/download/kvx22/`. Which MNI152 template "MNI152" means here is not stated on the pages I read [U]. Paper 10.3389/fnins.2012.00171 resolved: "101 Labeled Brain Images and a Consistent Human Cortical Labeling Protocol", Frontiers in Neuroscience 2012.

**HCP-MMP1 and the S1200 group average: can either be obtained from a primary publisher without accepting the HCP terms? No [V].**
- BALSA study RVVG ("A Multi-modal Parcellation of Human Cerebral Cortex", `https://balsa.wustl.edu/study/RVVG`) shows: "You have not yet agreed to all data access terms. Please read through the terms ... and register agreement in order to access data", the full WU-Minn terms, a "Login to Agree" button and "Download (Login required)".
- BALSA reference pkXDZ (the S1200 group-average set, `https://balsa.wustl.edu/reference/pkXDZ`) shows the same terms and "Login to Agree"; its file list includes `S1200.L.midthickness_MSMAll.32k_fs_LR.surf.gii`, `S1200.R.sphere.32k_fs_LR.surf.gii`, `Q1-Q6_RelatedValidation210.CorticalAreas_dil_Final_Final_Areas_Group_Colors.32k_fs_LR.dlabel.nii`, `Human.MedialWall_Conte69.32k_fs_LR.dlabel.nii`, `Gordon333.32k_fs_LR.dlabel.nii`.
- The terms page (`https://www.humanconnectome.org/study/hcp-young-adult/document/wu-minn-hcp-consortium-open-access-data-use-terms`, "Release Date: Apr 26, 2013") opens "I request access to data collected by the ... (WU-Minn HCP), and I agree to the following" and includes "I may redistribute original WU-Minn HCP Open Access data and any derived data as long as the data are redistributed under these same Data Use Terms." It is an access agreement, not a copyright licence. It says nothing for or against commercial use.
- Third-party copies of HCP-MMP1 exist (toolboxes, figshare). They are not the primary publisher and do not remove the terms.

**Steps Kevin would take to accept (he must do this himself):**
1. Register a BALSA account at `https://balsa.wustl.edu` ("Register"). The terms page also says "Create a free account at db.humanconnectome.org"; I did not check whether that portal is still the live one.
2. Log in, open study RVVG, read the "WU-Minn HCP Consortium Open Access Data Use Terms" and press "Login to Agree" / register agreement. Repeat on reference pkXDZ if it asks again.
3. Files then downloadable: from RVVG the HCP-MMP1.0 label and border files (for example `Q1-Q6_RelatedValidation210.L.CorticalAreas_dil_Final_Final_Areas_Group.32k_fs_LR.border`, `...CorticalAreas_dil_210P_Orig.32k_fs_LR.dlabel.nii`); from pkXDZ the S1200 group-average surfaces and the group dlabel listed above.
4. Obligations that follow: redistribute derived files only under the same terms (publish the terms beside the files), carry the acknowledgement sentence ("Data were provided [in part] by the Human Connectome Project, WU-Minn Consortium (Principal Investigators: David Van Essen and Kamil Ugurbil; 1U54MH091657) funded by the 16 NIH Institutes and Centers that support the NIH Blueprint for Neuroscience Research; and by the McDonnell Center for Systems Neuroscience at Washington University."), cite the relevant HCP papers, no re-identification attempts, comply with institutional rules.

## 8. HCP1065 tractography atlas (Yeh 2022)

- **Verdict:** SHIP-SEPARATE-FILE. Licence **CC BY-SA 4.0** plus an HCP acknowledgement.
- **Evidence [V], `https://brain.labsolver.org/hcp_trk_atlas.html`:** under "HCP1065 Population-Averaged Tractography Atlas (Yeh, 2022)": "License: Creative Commons Attribution-ShareAlike 4.0 International License. The data are derived from imaging data of the Human Connectome Project. Using them requires additional acknowledgment." The licence link goes to `creativecommons.org/licenses/by-sa/4.0/`. The word "acknowledgment" links to the **full** WU-Minn HCP Open Access Data Use Terms page.
- **Does obtaining it need an HCP agreement?** No. The files download directly from GitHub release assets with no login or click-through.
- **Does the publisher pass on any HCP obligation beyond acknowledgement?** The page's own words ask only for "additional acknowledgment". The link target, however, is the whole terms document, which also contains the clause that derived data be redistributed "under these same Data Use Terms". The publisher does not say that clause applies to atlas users, and CC BY-SA 4.0 does not allow a licensor's downstream recipients to be bound by extra terms. My reading: the stated obligation is acknowledgement only; the ambiguity is real and should be recorded, not resolved by us [I].
- **Acknowledgement wording (from the linked terms):** the sentence quoted in item 7, step 4.
- **Attribution:** "Yeh, FC. Population-based tract-to-region connectome of the human brain and its hierarchical topology. Nat Commun 13, 4933 (2022). https://doi.org/10.1038/s41467-022-32595-4" (DOI resolved, title matches), licence name and link, statement of changes; derived files stay CC BY-SA 4.0; no extra restrictions or DRM on them.
- **Space:** the page says the atlas is in "ICBM 2009a Nonlinear Asymmetric space" (MNI152NLin2009aAsym).
- **Files [V, release `hcp1065` of `github.com/data-others/atlas`]:**
  - `hcp1065_avg_tracts_trk.zip` (587,869,457 bytes) — TrackVis `.trk` streamlines
  - `hcp1065_avg_tracts_tt.zip` (151,947,374 bytes) — DSI Studio `.tt.gz` streamlines
  - `hcp1065_avg_tracts_nifti.zip` (3,372,106 bytes) — bundle volumes
  - `hcp1065_prob_coverage_nifti.zip` (17,353,305 bytes) — population probability volumes
  - `abbreviation.xlsx`, `abbreviation2.xlsx`, `tract_to_region_connectome_MMP.xlsx`
  - URL pattern: `https://github.com/data-others/atlas/releases/download/hcp1065/<file>`
  - The GitHub repository itself has no licence file (`license: null`); the licence statement lives on the labsolver page.
- **Caution:** `tract_to_region_connectome_MMP.xlsx` is keyed to HCP-MMP parcels. Using the numbers is fine; shipping MMP geometry is item 7f.

## 9. Melbourne Subcortex Atlas (Tian 2020)

- **Verdict:** SHIP. Licence: custom **"Melbourne Subcortex Atlas License"**.
- **Evidence [V], `https://github.com/yetianmed/subcortex/blob/master/license.txt` (full text):** "Permission is hereby granted, free of charge, to any person obtaining a copy of Melbourne Subcortex Atlas and associated documentation files, to use the atlas without restriction, including without limitation the rights to use, copy, modify, merge, publish and distribute, subject to the following condition: Any publication that uses the atlas in any way reference the paper below: Tian, Y., Margulies, D.S., Breakspear, M., Zalesky A. Topographic organization of the human subcortex unveiled with functional connectivity gradients. Nat Neurosci (2020). https://doi.org/10.1038/s41593-020-00711-6"
- **Commercial:** not excluded ("without restriction"); the MIT words "sublicense" and "sell" are absent. I read commercial display as allowed and selling the atlas itself as not expressly granted [I].
- **HCP question:** the licence and README contain no HCP acknowledgement requirement. The atlas is built from HCP fMRI, so the HCP acknowledgement sentence is a prudent courtesy; whether the HCP terms reach it is the authors' responsibility, not stated to users [I].
- **Space and resolution [V, README]:** "delineated in MNI152 Nonlinear 6th generation (MNI152NLin6Asym) space"; "also available in MNI152 Nonlinear 2009cAsym"; 2 mm (3T) and 1.6 mm (7T); scales I–IV with 16, 32, 50, 54 regions (3T).
- **Files:** `https://raw.githubusercontent.com/yetianmed/subcortex/master/Group-Parcellation/3T/Subcortex-Only/Tian_Subcortex_S1_3T_2009cAsym.nii.gz` (8,477 bytes), `..._S2_...` to `..._S4_...`, with `Tian_Subcortex_S1_3T_label.txt` etc. DOI 10.1038/s41593-020-00711-6 resolved, title matches.
- **Avoid:** the combined CIFTI files in the same repository that embed Glasser (HCP-MMP) or Gordon cortex labels.

## 10. Diedrichsen cerebellar atlases

- **Verdict:** DO-NOT-SHIP until the lab clarifies. The primary sources contradict each other on commercial use.
- **Evidence [V]:**
  1. `https://github.com/DiedrichsenLab/cerebellar_atlases` README, "Reference and Licence": "If not otherwise noted in the contributing paper, the atlases are distributed under a Creative Commons CC BY (Attribution) license" (no version number).
  2. `Diedrichsen_2009/atlas_description.json` (the lobular and nuclei atlas): `"License": "See LICENSE file"`. There is no LICENSE file in that folder or at the repository root.
  3. The only LICENSE file in the repository is `tpl-SUIT/LICENSE`: "The SUIT template, associated files and atlases are distributed under a Creative Commons Attribution-NonCommercial 3.0 Unported License, meaning that it can be freely used for non-commercial purposes", followed in the same file by "Permission to use, copy, modify, and distribute this software and its documentation for any purpose and without fee is hereby granted".
  4. The lab's atlas page `https://www.diedrichsenlab.org/imaging/propatlas.htm`: "The SUIT toolbox distributed under the Creative Commons Attribution-NonCommercial 3.0 Unported License"; stand-alone download sits behind a registration form (name, email, institution, country).
  5. The lab's download page `https://www.diedrichsenlab.org/imaging/suit_download.htm`: "All downloadable data sets and toolboxes are distributed under the Creative Commons Attribution-NonCommercial 3.0 Unported License".
  6. GitHub API: repository `license: null`.
- **Which specific atlas is CC BY?** On the README's wording, the default covers every atlas in the collection, including `atl-Anatom`. I could not check the "contributing paper" exception for the 2009 and 2011 papers (both resolve: 10.1016/j.neuroimage.2009.01.045 "A probabilistic MR atlas of the human cerebellum"; 10.1016/j.neuroimage.2010.10.035 "Imaging the deep cerebellar nuclei: A probabilistic atlas and normalization procedure"); they are paywalled Elsevier articles and such papers rarely carry a data licence. The practical exception is items 2 to 5 above.
- **There is no separate deep-nuclei atlas in the repository.** Lobules and nuclei are one map, `atl-Anatom`.
- **Label list [V, `Diedrichsen_2009/atl-Anatom.tsv`]:** 1 Left_I_IV, 2 Right_I_IV, 3 Left_V, 4 Right_V, 5 Left_VI, 6 Vermis_VI, 7 Right_VI, 8 Left_CrusI, 9 Vermis_CrusI, 10 Right_CrusI, 11 Left_CrusII, 12 Vermis_CrusII, 13 Right_CrusII, 14 Left_VIIb, 15 Vermis_VIIb, 16 Right_VIIb, 17 Left_VIIIa, 18 Vermis_VIIIa, 19 Right_VIIIa, 20 Left_VIIIb, 21 Vermis_VIIIb, 22 Right_VIIIb, 23 Left_IX, 24 Vermis_IX, 25 Right_IX, 26 Left_X, 27 Vermis_X, 28 Right_X, 29 Left_Dentate, 30 Right_Dentate, 31 Left_Interposed, 32 Right_Interposed, 33 Left_Fastigial, 34 Right_Fastigial. Description: lobules from 20 participants (ROIs 1–28), nuclei from a different 23 (ROIs 29–34).
- **Spaces and files:** `atl-Anatom_space-MNI_dseg.nii` (MNI152NLin6Asym), `atl-Anatom_space-MNISym_dseg.nii` (MNI152NLin2009cSym), `atl-Anatom_space-SUIT_dseg.nii`, 1 mm; raw URL pattern `https://raw.githubusercontent.com/DiedrichsenLab/cerebellar_atlases/master/Diedrichsen_2009/<file>`.
- **What to do:** ask the lab (an issue on the repository) which licence governs `atl-Anatom` on GitHub. Until then the Allen atlas (vermis, paravermis, hemisphere, deep nuclei) fills the cerebellar regions at coarser grain. The earlier survey reported the FSL copy of the lobular atlas as CC BY-SA 4.0 [V-prev]; I did not re-read that, and it conflicts with the lab's own NC statement, so I would not lean on it.

## 11. Neudorfer 2020 hypothalamus atlas

- **Verdict:** SHIP. Licence **CC BY 4.0**.
- **Evidence [V]:** Zenodo API `https://zenodo.org/api/records/3942115`: `license: {id: "cc-by-4.0"}`, access "open", DOI 10.5281/zenodo.3942115 (DataCite resolved: "NSD_atlas_of_hypothalamic_region", rights `cc-by-4.0`), documented by 10.1038/s41597-020-00644-6 (Crossref resolved: "A high-resolution in vivo magnetic resonance imaging atlas of the human hypothalamic region", Scientific Data 2020, Neudorfer, Germann et al.).
- **Attribution:** authors per README (Clemens Neudorfer, Jürgen Germann, Gavin J.B. Elias, Robert Gramer, Alexandre Boutet, Andres M. Lozano), the Scientific Data paper, the Zenodo DOI, licence link, statement of changes. Built from "990 subjects derived from the HCP1200 data release"; the README sets no HCP condition; add the HCP acknowledgement as a courtesy [I].
- **Space and resolution:** "aligned to the MNI152 2009b template", 0.25 mm and 0.5 mm. The README does not say symmetric or asymmetric [U].
- **Files (no account):** `MNI152b_atlas_labels_0.5mm.nii.gz` (563,185 bytes), `MNI152b_atlas_labels_0.25mm.nii.gz` (4,421,144), `MNI152b_isolated_nuclei_0.5mm_resolution.zip` (82,631), `Volumes_names-labels.csv` (2,068); URL pattern `https://zenodo.org/api/records/3942115/files/<file>/content`.
- **Labels [V, `Volumes_names-labels.csv`]; odd id = right, even id = left:** 1/2 anterior commissure (AC); 3/4 diagonal band of Broca (dB); 5/6 fornix (FX); 7/8 mammillothalamic tract (MT); 9/10 mammillary bodies (MM); 13/14 subthalamic nucleus (STN); 15/16 substantia nigra (SN); 17/18 red nucleus (RN); 19/20 medial preoptic nucleus (MPO); 21/22 paraventricular nucleus (Pa); 23/24 dorsal periventricular hypothalamic nucleus (DPEH); 25/26 lateral hypothalamus (LH); 27/28 ventromedial hypothalamus (VM); 29/30 arcuate hypothalamic nucleus (AN); 31/32 periventricular hypothalamic nucleus (Pe); 33/34 bed nucleus of the stria terminalis (BNST); 35/36 nucleus basalis of Meynert (NBM); 37/38 dorsomedial hypothalamic nucleus (DM); 41/42 zona incerta (ZI); 43/44 inferior thalamic peduncle (ITP); 45/46 supraoptic hypothalamic nucleus (SO); 47/48 suprachiasmatic hypothalamic nucleus (SC); 49/50 tuberomammillary hypothalamic nucleus (TM); 51/52 posterior hypothalamic nucleus (PH; the file spells it "hypotahalamic"); 53/54 anterior hypothalamic area (AHA). Ids 11, 12, 39 and 40 are unused.

## 12. MNI ICBM152 2009 templates and TemplateFlow

- **Verdict:** templates SHIP.
- **Notice [V], `https://nist.mni.mcgill.ca/icbm-152-nonlinear-atlases-2009/`, section "License":** "Copyright (C) 1993–2004 Louis Collins, McConnell Brain Imaging Centre, Montreal Neurological Institute, McGill University. Permission to use, copy, modify, and distribute this software and its documentation for any purpose and without fee is hereby granted, provided that the above copyright notice appear in all copies." One notice sits above the download list for all six templates.
- **Six templates [V]:** 2009a symmetric and asymmetric (1 mm), 2009b symmetric and asymmetric (0.5 mm; T1w, T2w, PDw only), 2009c symmetric and asymmetric (1 mm). The page: "All templates are describing the same anatomy, but sampling and or pre-processing is different".
- **Files (no account):** `https://www.bic.mni.mcgill.ca/~vfonov/icbm/2009/mni_icbm152_nlin_{sym,asym}_09{a,b,c}_nifti.zip`.
- **Attribution:** keep the copyright line in every copy; cite Fonov 2011 (10.1016/j.neuroimage.2010.07.033, resolved: "Unbiased average age-appropriate atlases for pediatric studies") and Fonov 2009.
- **TemplateFlow [V, GitHub repositories of the `templateflow` organisation]:**
  - `tpl-MNI152NLin2009cAsym`, `tpl-MNI152NLin2009aAsym`, `tpl-MNI152NLin2009bSym`, `tpl-MNI152NLin2009bAsym`, `tpl-MNI152NLin2009cSym` each carry a LICENSE file that reproduces the MNI notice.
  - `tpl-MNI152NLin6Asym`, `tpl-fsaverage` and `tpl-fsLR` say "License: See LICENSE file" in `template_description.json` but have **no LICENSE file**.
  - Transforms present: `tpl-MNI152NLin2009cAsym_from-MNI152NLin6Asym_mode-image_xfm.h5`; `tpl-MNI152NLin6Asym_from-MNI152NLin2009cAsym_mode-image_xfm.h5` (and a `.mat`); `tpl-MNI152NLin2009cAsym_from-OASISTRT20_mode-image_xfm.mat`; infant-cohort transforms into NLin6Asym.
  - **Not present** in the repositories I listed: any transform between a symmetric and an asymmetric 2009 template, or between 2009a/2009b and 2009c.
  - No licence is stated for the transform files as such. The pipeline can use them to compute; it has no need to redistribute them. That use is my reading, not a grant I can quote [I].
  - Other transforms found: CIT168 ships its own ANTs warps to 2009cAsym and FSL MNI under CC BY 4.0 (`cit2mni_1Warp.nii.gz`, `cit2mni_0GenericAffine.mat`); the Diedrichsen repository ships SUIT / NLin6Asym / 2009cSym cerebellar transforms (licence tangled, item 10).

## 13. EEG 10-20 positions

- **`eeg_positions` (sappelhoff): SHIP. MIT [V].** `LICENSE`: "Copyright 2018 eeg_positions developers" with the standard MIT grant ("use, copy, modify, merge, publish, distribute, sublicense, and/or sell"). Files: `https://raw.githubusercontent.com/sappelhoff/eeg_positions/main/data/Nz-T10-Iz-T9/standard_1020_3D.tsv` (611 bytes), `standard_1010_3D.tsv`, `standard_1005_3D.tsv`; also `Fpz-T8-Oz-T7/`. Positions are computed on a unit sphere, with NAS, LPA, RPA landmarks. Attribution: keep the MIT notice.
- **MNE-Python: repository BSD-3-Clause [V]** ("Copyright 2011-2025 MNE-Python authors"). Per-file provenance from `mne/channels/data/montages/README.md` [V]:
  - `spherical_1020.tsv`, `spherical_1010.tsv`, `spherical_1005.tsv`: "taken from the eeg-positions package". **SHIP** (same data as above).
  - **`standard_1020.elc` and `standard_1005.elc` no longer exist under those names on `main`** (404). They were renamed `colin27_1020.elc` and `colin27_1005.elc` (commit "Add spherical montages (#13903)", 2026-05-22). The README says the `colin27_*` montages "are available in FieldTrip" and links `fieldtrip/template/electrode/standard_1020.elc` and `standard_1005.elc`. FieldTrip's repository licence is **GPL-3.0** [V, GitHub API and FieldTrip README]. So these files reach MNE from a GPL source and are redistributed inside a BSD repository; which terms govern them is not stated anywhere I could read. **DO-NOT-SHIP.**
  - `fsaverage_1020.tsv`, `fsaverage_1010.tsv`, `fsaverage_1005.tsv`: provenance is not described in that README [U].
- **Practical route:** take the spherical positions from `eeg_positions` and project them onto the site's own head or scalp mesh in the pipeline. State that they are idealised positions.

## 14. DBS lead geometry (facts with citable sources)

| Lead | Contacts | Contact length | Spacing (edge to edge) | Lead diameter | Source |
|---|---|---|---|---|---|
| Medtronic 3387 | 4 | 1.5 mm | 1.5 mm | 1.27 mm | P1 Table 2; FDA-M for the spacing |
| Medtronic 3389 | 4 | 1.5 mm | 0.5 mm | 1.27 mm | P1 Table 2; FDA-M for the spacing |
| Abbott (St. Jude) Infinity directional 6170 / 6172 | 8, arranged 1-3-3-1 | 1.5 mm | 0.5 mm | 1.29 mm | P1 Table 2; P2 for arrangement |
| Abbott (St. Jude) Infinity directional 6171 / 6173 | 8, arranged 1-3-3-1 | 1.5 mm | 1.5 mm | 1.29 mm | P1 Table 2; P2 |
| Boston Scientific Vercise Cartesia directional DB-2202 | 8, arranged 1-3-3-1, distal contact is an active tip | 1.5 mm | 0.5 mm | 1.3 mm | P1 Table 2; P2 |
| Boston Scientific Vercise standard DB-2201 | 8 rings | 1.5 mm | 2.0 mm centre to centre (= 0.5 mm gap) | 1.3 mm | FDA-B Table 2; P1 |
| St. Jude Brio (non-directional) 6142–6149 | 4 | not given in the table | 0.5 and 1.5 mm | 1.4 mm | FDA-S Table 2 |

Sources, all read this session:
- **P1** — Paff M, Loh A, Sarica C, Lozano AM, Fasano A. "Update on Current Technologies for Deep Brain Stimulation in Parkinson's Disease." Journal of Movement Disorders 13(3):185–198, 2020. DOI 10.14802/jmd.20052 (resolved; title and authors match). Open access, PMC7502302. Table 2 "Features of currently available leads" gives lead diameter, contact length, contact spacing, number of contacts, directional yes/no, active tip yes/no. Text: Medtronic 3387/3389/3391 are each "a traditional quadripolar DBS lead of 1.27 mm in diameter"; "Abbott directional leads have a diameter of 1.29 mm and come in lengths of 30 cm (models 6170 and 6171) or 40 cm (models 6172 and 6173). The center contacts, 2 and 3, consist of 3 radial contacts"; Boston Scientific linear and Cartesia leads "both of which have a diameter of 1.3 mm".
- **P2** — Masuda H, Shirozu H, Ito Y, Fukuda M, Fujii Y. "Surgical Strategy for Directional Deep Brain Stimulation." Neurologia medico-chirurgica 62:1–12, 2022. DOI 10.2176/nmc.ra.2021-0214 (resolved). Open access, PMC8754682. "Medtronic 3387: four contacts of 1.5 mm length separated by interspaces of 1.5 mm; Medtronic 3389: same contact lengths, interspaces of 0.5 mm"; Infinity: "two middle contacts that are divided into three smaller, 1.15-mm-wide contacts (1-3-3-1). Each contact has a length of 1.5 mm, and the spacing between contacts is 0.5 mm (C) or 1.5 mm (D)"; Cartesia: "two middle contacts that are divided into three smaller, 1.0-mm-wide contacts (1-3-3-1), and the entire distal end of the lead is covered with metal to the tip"; segments span "120°"; the Infinity has "a non-metallic tip of 1 mm length".
- **FDA-M** — FDA Summary of Safety and Effectiveness Data, PMA supplement P960009/S7, Medtronic Activa Parkinson's Control Therapy, `https://www.accessdata.fda.gov/cdrh_docs/pdf/P960009S007b.pdf`: "Model 3387, in which the 4 electrodes are spaced 1.5 mm apart and Model 3389, in which the electrodes are spaced 0.5 mm apart."
- **FDA-B** — FDA SSED P150031, Boston Scientific Vercise DBS System, `https://www.accessdata.fda.gov/cdrh_docs/pdf15/P150031B.pdf`, Table 2 "DBS Lead Specifications" for model DB-2201: Number of Contacts 8; Contact Length 1.5 mm; Contact Surface Area 6.0 mm²; Contact Spacing (Center-to-Center) 2.0 mm; Contact Span 15.5 mm; Distal Contact to Tip Length <1.3 mm; Diameter 1.3 mm.
- **FDA-S** — FDA SSED P140009, St. Jude Brio Neurostimulation System, `https://www.accessdata.fda.gov/cdrh_docs/pdf14/P140009B.pdf`, Table 2: Lead Diameter 1.4 mm; Number of Electrodes 4; Electrode Spacing (edge-to-edge) 0.5 and 1.5 mm; Array Length 6.5 or 10.5 mm; Electrode Surface Area 2.1 mm².

Gaps: I found no regulator or manufacturer document this session that states the Medtronic 1.27 mm diameter and 1.5 mm contact length, or the directional leads' dimensions; those rest on the two peer-reviewed papers. The Medtronic implant manual was not reachable. The segment widths (1.15 mm, 1.0 mm) come from P2 only.

## 15. H01 (Shapson-Coe et al. 2024)

- **Verdict:** SHIP. Licence **CC BY 4.0**.
- **Evidence [V], `https://h01-release.storage.googleapis.com/data.html`, section "License":** "All released datasets are licensed under a Creative Commons Attribution 4.0 License."
- **DOI:** 10.1126/science.adk4858 resolved (Crossref): "A petavoxel fragment of human cerebral cortex reconstructed at nanoscale resolution", Science 384(6696), published 2024-05-10, first authors Shapson-Coe, Januszewski, Berger.
- **Headline facts, each as its source states it:**

| Fact | Wording | Source |
|---|---|---|
| Sample size | "a cubic millimeter of human temporal cortex" | paper abstract (Crossref) |
| Tissue and origin | "surgically removed to gain access to an underlying epileptic focus" | paper abstract |
| Cells | "about 57,000 cells" | paper abstract |
| Blood vessels | "about 230 millimeters of blood vessels" | paper abstract |
| Synapses (paper) | "about 150 million synapses" | paper abstract |
| Data size | "comprises 1.4 petabytes" | paper abstract; landing page: "a 1.4 petabyte volume" |
| Synapses (release page) | "183 million annotated synapses" | `landing.html` |
| Proofread cells (landing page) | "100 proofread cells" | `landing.html` |
| Proofread cells (data page) | "104 manually traced and proofread cells" | `data.html` |
| Imaging | "Acquired via multi-beam SEM at a resolution of 4nm*4nm*33nm" | `data.html` |
| Other findings | "glia outnumber neurons 2:1"; "rare powerful axonal inputs of up to 50 synapses" | paper abstract |

- The paper and the release page give different synapse counts (about 150 million versus 183 million annotated) and the two release pages give 100 versus 104 proofread cells. Quote one with its source; do not merge them.
- **Donor details (age, sex) are not in the abstract or the two release pages I read [U].** Do not state them from memory.
- **Files:** `gs://h01-release/data/20210601/proofread_104/skeletons/104_proofread_neurons_swc.zip` (SWC), plus Neuroglancer layers listed on `data.html`.
- **Attribution:** cite the Science paper, name CC BY 4.0, link the release page.

## 16. Other sources checked to fill remaining holes

- **AHEAD structure maps (Alkemade et al.) — SHIP.** figshare/UvA record 10.21942/uva.10007840 (DataCite resolved; rights `cc-by-4.0`; figshare API licence "CC BY 4.0") [V]. `Readme.txt`: `Structures_mni09b.tar.gz` "contains probability maps and structure average masks of the subthalamic nucleus (STN), substantia nigra (SN), red nucleus (RN), globus pallidus interna and externa". File `structures_mni09b.tar.gz` (1,556,170 bytes) `https://ndownloader.figshare.com/files/21209229`. Own 7 T data from 105 participants, not HCP. Space "mni09b" (symmetric or asymmetric not stated [U]). Archive not opened.
- **MASSP 2.0 parcellation priors — SHIP with caveat.** Record 10.21942/uva.27291714 (DataCite resolved; CC BY 4.0) [V]. Description: "Computational priors for 35 subcortical structures derived from the AHEAD database ... Note that the included priors are not probabilistic maps that should be used as atlases". Label list [V, `massp_2p0-label-list.txt`], left/right pairs unless noted: 1/2 caudate; 3/4 subthalamic nucleus; 5/6 substantia nigra; 7/8 red nucleus; 9/10 globus pallidus pars interna; 11/12 globus pallidus pars externa; 13/14 thalamus; 15/16 lateral ventricle; 17 third ventricle; 18 fourth ventricle; 19/20 amygdala; 21/22 internal capsule; 23/24 ventral tegmental area; 25 fornix; 26/27 periaqueductal gray; 28/29 pedunculopontine nucleus; 30/31 claustrum; 32/33 inferior colliculus; 34/35 superior colliculus; 36/37 lateral habenula; 38/39 putamen; 40/41 accumbens; 42/43 CA1; 44/45 CA2,3; 46/47 dentate gyrus; 48/49 pre/pro subiculum; 50/51 subiculum; 52/53 uncus; 54 anterior commissure; 55 posterior commissure; 56/57 cholinergic forebrain nuclei; 58 dorsal raphe nucleus; 59 medial raphe nucleus; 60/61 lateral geniculate nucleus; 62/63 medial geniculate nucleus. Template space not read [U]. No thalamic nuclei beyond the geniculates.
- **Najdenovska 2018 thalamic atlas — DO-NOT-SHIP pending clarification.** Zenodo 10.5281/zenodo.1405484: record licence `cc-by-sa-4.0` (API and DataCite) [V]. But the README inside the record says "Copyright (c) - All rights reserved. University of Lausanne. 2018." [V]. The two statements conflict. Space: "ICBM 2009a Nonlinear Symmetric – 1×1x1mm". Labels: 1/8 Pulvinar, 2/9 Anterior, 3/10 Medio_Dorsal, 4/11 Ventral_Latero_Dorsal, 5/12 Central_Lateral-Lateral_Posterior-Medial_Pulvinar, 6/13 Ventral_Anterior, 7/14 Ventral_Latero_Ventral (left/right). No VIM label. Built from HCP subjects; the README carries the HCP acknowledgement. Paper 10.1038/sdata.2018.270 resolved.
- **THOMAS atlas in MNI (Saranathan 2021) — DO-NOT-SHIP.** Zenodo 5045684 and 5499504 both `access_right: restricted`, `license: None` [V]. The descriptions say the set includes "maximum probability maps for the left and right VIM" in "MNI space (152 asymmetric 09b)". This is the only VIM geometry I found and it is not open. Zenodo 5044472 (the nine individual 7 T scans with manual nucleus masks) is open under CC BY 4.0, but it is individual-subject data in native space, not an atlas; building a group VIM from it is a research task, not a download. Paper 10.1038/s41597-021-01062-y resolved.
- **Levinson–Bari limbic brainstem atlas:** a figshare search found only the paper's supplementary figure (10.3389/fnimg.2022.1009399.s001). I did not locate the atlas files or a licence [U].
- **FreeSurfer-derived thalamic and brainstem segmentations:** they fall under the FreeSurfer licence (item 7d). Not checked further.

## QIF regions still without clean geometry

| QIF region | Status | Cleared source(s) |
|---|---|---|
| `vim` | **No clean geometry.** Only the parent VL is available | Allen VL (10420) as a labelled stand-in; THOMAS VIM is restricted |
| `ant` | Filled | Allen ANC (10392) |
| `stn` | Filled | Allen STH; CIT168 STH; Neudorfer STN; AHEAD STN |
| `substantia_nigra` | Filled | Allen SN; CIT168 SNc and SNr; Neudorfer SN; AHEAD SN |
| `vta` | Filled | CIT168 VTA (and PBP); AAN VTA |
| `hypothalamus` | Filled | Neudorfer nuclei; Allen HTH regions; CIT168 HTH |
| `gpi` | Filled | Allen GPi; CIT168 GPi; AHEAD GPi |
| `gpe` | Filled | Allen GPe; CIT168 GPe; AHEAD GPe |
| `bla` | Filled | Allen La + BL + BM; (CIT168 amygdala as a separate BY-SA file) |
| `cea` | Filled | Allen CEN |
| `cerebellum_cortex` | Filled, coarse | Allen CBL + CBPV (+ CBV). No lobules until item 10 is resolved |
| `cerebellum_nuclei` | Filled, coarse | Allen CbDN (one label; no dentate/interposed/fastigial split) |
| `vermis` | Filled | Allen CBV |
| `medulla` | Filled | Allen MoPy + MoTg + IO |
| `pons` | Filled | Allen PnBa + PnTg |
| `midbrain` | Filled | Allen MTg + PTR + SC + IC + RN + SN + cpd |
| `reticular_formation` | **Partial.** Midbrain and rostral pontine parts only | AAN mRt and PnO (CC0). No medullary or caudal pontine reticular formation |
| `cervical_cord` | **No clean geometry** | PAM50 has no licence |
| `thoracic_cord` | **No clean geometry** | same |
| `lumbar_cord` | **No clean geometry** | same |
| `sacral_cord` | **No clean geometry** | same |
| `cauda_equina` | **No clean geometry** | none found |

Still open: `vim`, the four cord levels, `cauda_equina`; `reticular_formation` is partial. For the cord, the honest options are a schematic (clearly labelled as not data-derived) or waiting for a PAM50 licence statement.

## Recommended template space

**MNI152NLin2009cAsym (ICBM 2009c Nonlinear Asymmetric), 1 mm.**

Reasons:
- CIT168 and Tian both publish files already in it, and TemplateFlow has the one cross-template transform we need (from MNI152NLin6Asym).
- The MNI page says of its six 2009 templates: "All templates are describing the same anatomy, but sampling and or pre-processing is different". So 2009a, 2009b and 2009c asymmetric share coordinates and differ in grid; moving between them is a resample, not a registration [I, from that sentence].
- The template itself is permissively licensed.

| Cleared source | Published space | Transform to MNI152NLin2009cAsym |
|---|---|---|
| CIT168 Reinforcement Learning | 2009cAsym, 1 mm (provided) | none |
| Tian subcortex | 2009cAsym (provided) | none |
| HCP1065 tracts | 2009aAsym | none beyond resampling (same anatomy) [I] |
| AAN v2 | "MNI152 1mm", FSL grid [I] | TemplateFlow `tpl-MNI152NLin2009cAsym_from-MNI152NLin6Asym_mode-image_xfm.h5` |
| Yeo / Schaefer volumes (CBIG) | FSL MNI152 (NLin6Asym) | same TemplateFlow transform |
| Mindboggle DKT31 | "MNI152", variant not stated [U] | same TemplateFlow transform if it is the FSL template; confirm from the file header |
| Allen HRA 3D | 2009bSym, 0.5 mm | symmetric to asymmetric nonlinear registration **computed by the pipeline** between the two MNI templates (both permissive). Not available in TemplateFlow |
| Neudorfer hypothalamus | "MNI152 2009b", symmetry not stated [U] | none if asymmetric; the same pipeline-computed transform if symmetric. Check the header and paper first |
| AHEAD structures | "mni09b", symmetry not stated [U] | as Neudorfer |
| NextBrain | atlas-native [U] | registration computed by the pipeline |
| eeg_positions | unit sphere | fit to the scalp mesh in the pipeline |

The alternative, MNI152NLin2009bSym, would make the Allen atlas (the largest single contributor and the proposed cortex) transform-free but would put every other source through a computed asymmetric-to-symmetric warp. On transform count 2009cAsym wins. If the cortex and most structures end up coming from Allen alone, revisit this: fewer voxels would then move under 2009bSym.

Symmetric and asymmetric MNI templates differ by small local shifts. For a display atlas, record in the manifest which transform each mesh went through.

## Could not verify

- **PAM50:** no licence exists to verify; level range not re-read.
- **NextBrain:** label list, atlas space and resolution (inside zips not downloaded). The project website renders by script and showed no text.
- **Diedrichsen:** which of the conflicting statements governs; the "contributing paper" exception (paywalled papers); the FSL copy's licence was not re-read.
- **Najdenovska:** whether CC BY-SA or "All rights reserved" governs.
- **CerebrA:** licence (the MNI page states none; `gin.g-node.org` refused the connection twice).
- **TemplateFlow:** licence of the transform files; LICENSE files for `tpl-MNI152NLin6Asym`, `tpl-fsaverage`, `tpl-fsLR` are missing. I did not find a site-wide TemplateFlow data licence statement.
- **Mindboggle DKT31:** which MNI152 template the "MNI152" files use; whether the authors regard the joint-fusion atlas's subcortical labels as CC BY or CC BY-NC-ND.
- **Neudorfer and AHEAD:** symmetric versus asymmetric 2009b.
- **AAN:** which MNI152 variant (inferred from file size only).
- **Allen:** whether `annotation.nii.gz` is one hemisphere.
- **MNE `fsaverage_10xx.tsv`:** provenance.
- **Brodmann-area label set with a clear licence:** none found.
- **Levinson–Bari limbic brainstem atlas:** files and licence not located.
- **DBS:** no manufacturer manual read; Medtronic diameter and all directional-lead dimensions rest on two peer-reviewed reviews, not on labelling.
- **H01 donor age and sex:** not in the sources read.
- **HCP:** whether ConnectomeDB (`db.humanconnectome.org`) is still the live sign-up portal; I read only the terms page and two BALSA pages.
- **Yeh HCP1065:** whether the author intends the HCP redistribution clause to bind atlas users (the page says "acknowledgment"; the link is to the full terms).
- **CBIG `data/templates/surface/` contents:** not opened.
- GitHub repository licence fields come from the GitHub API; they reflect GitHub's detection of a licence file, which I then read directly where one existed.

## Corrections to the earlier survey

| Earlier statement | Finding now |
|---|---|
| CIT168 "CC BY 4.0 on OSF (S)" | Confirmed at the OSF API. The sibling amygdala atlas is CC BY-SA 4.0 by its own LICENSE.txt |
| CIT168 16-label order from memory | Corrected from `labels.txt` (ids 0–15; SNc 6, RN 7, SNr 8) |
| AAN "Dryad page names no licence" | CC0 1.0, stated in the Dryad API, the README and DataCite |
| Diedrichsen "CC BY ... Yes" | Conflicting primary statements; lab pages say CC BY-NC 3.0. Not cleared |
| PAM50 "Not found on any page read" | Confirmed absent; open unanswered issue #53 |
| NextBrain "Not verified (403)" | CC0 on the UCL record named by the paper |
| MNE montages "BSD-3 (E)" | Repository is BSD-3, but the 10-20/10-05 `.elc` files come from FieldTrip (GPL-3.0) and were renamed `colin27_*` in May 2026 |
| THOMAS "restricted" | Still restricted; it does contain a VIM map |
| H01 "183 million annotated synapses and about 100 proofread cells" | That is the landing page; the paper abstract says about 150 million synapses and about 57,000 cells; the data page says 104 proofread cells |
| "Dimensions: Medtronic 3389 ... (S, OSS-DBS docs)" | Now sourced to two peer-reviewed papers and three FDA documents |
| Audit: CBIG "MIT with no carve-outs, did not confirm fs_LR 32k Yeo files" | Confirmed: fs_LR 32k, fsaverage5 and FSL MNI152 Yeo 2011 files are all in the repository, with no per-folder notice |
