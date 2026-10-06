# Research delta, October 2026

Generated 2026-10-06. Machine-readable version: `research-delta.json` (94 items). Sources: `sources-research.json`.
Nothing outside `_staging/2026-10-refresh/` was written. Every mapping and status change below is a proposal for review.

## What changed since the baseline

The catalogue (`osi-of-mind/QIF-RESEARCH-SOURCES.md`) and the registrar (165 techniques) had no entry for the Cerberus Neurosecurity Research Institute, its two 2026 preprints, or most 2025 and 2026 attack research on EEG foundation models, consumer headset links and VR side channels.

| Proposal type | Count | Unverified |
|---|---|---|
| New source rows | 47 | 3 |
| Corrections to existing source rows | 15 | 0 |
| Registrar proposals (5 status, 10 source fixes) | 15 | 2 |
| Candidate technique cards (no IDs) | 11 | 1 |
| `research-registry.json` adds | 6 | 2 |
| **Total** | **94** (64 adds, 30 updates) | **8** |

The three biggest deltas:

1. **Sixteen existing catalogue rows need citation corrections (15 proposals).** Three DOIs fail or resolve to a different paper (C52, C57, C88); the rest have wrong titles, authors or venues, or are duplicates. Details in section (e).
2. **2026 added device-level and top-venue evidence**: unencrypted EEG links and a man-in-the-middle position on three consumer headsets (NERVE, preprint), and a motion-sensor side channel in VR headsets (IEEE S&P 2026).
3. **The Cerberus review names threat vectors TARA does not list**, chiefly inferential harvest-now-decode-later and attacks on the model lifecycle (model stealing, federated poisoning, registry substitution).

## (a) The Bagley / Cerberus paper

| Field | As given by the document |
|---|---|
| Title | Threat Vectors and the State of the Art in Defense Methods for Security in Neurotechnology |
| Authors (title page) | Bryce Allen Bagley, Nathaniel Rose, Quintus Kilbourn, Matthew Canham |
| Affiliations | Cerberus Neurosecurity Research Institute (Bagley, Rose, Canham); Cognitive Security Institute (Bagley, Canham); Dura Labs (Rose); Flashbots (Kilbourn) |
| Date | Title page: July 14, 2026. arXiv stamp and API: v1 submitted 11 July 2026 |
| Identifier | arXiv:2607.10451v1 [cs.CR], https://arxiv.org/abs/2607.10451 |
| Status | Preprint. No journal reference, DOI or venue note in arXiv metadata, so treated as not peer reviewed |
| Length and type | 25 pages, 175 references. Review; no new experiments |

**Author name.** The request called the author "Dr Bryace Allen". The document prints "Bryce Allen Bagley"; the PDF metadata and arXiv listing give "Bryce-Allen Bagley". "Bryace" is a misspelling, "Allen" is part of the given name, the surname is Bagley, and the document prints no "Dr".

**Summary.** The paper unrolls the BCI cycle into a line (brain, readout or stimulation device, linked devices, applications and servers) and treats each element and link as an attack surface. Section 2 surveys threats; section 3 lists defences from other fields that can be applied now. It states its own limits: the authors know of no published reconstruction attack on neural data (they call such attacks inevitable, which is a projection), no fNIRS spoofing attack has been demonstrated, and BCI-specific defence frameworks are research prototypes.

**Cogits.** The word appears once, in section 3.1.3 on differential privacy. It is shorthand for "specific interpretable intents, thoughts, etc.", credited to Bagley and Petritsch. The argument is that BCI hardware records at a scale where signals cannot be cleanly segmented into individual cogits or into specific physiological operations, so decoding relies on machine learning, and deep models are open to reconstruction attacks; therefore differential privacy is needed. This paper does not define cogits formally and proposes no protocol that uses them. It says only that "Bagley and colleagues are working on protocols for cognition" (a 2025 workshop talk).

The definition is in Bagley and Petritsch, arXiv:2403.07945v4. There, cogits are qubit-analogue cognitive state variables (the name comes from "Cogito ergo sum"): a general way to place any number of beliefs, preferences or other cognitive state variables in one high-dimensional vector, analysed with projective probability and hyperdimensional computing. The authors say this is a statistical formalism, not a claim about quantum physics in the brain. They hypothesise, without an empirical test, that the statistics of such vectors correspond to how distinguishable individuals are, and they use the formalism to state the attacker's and defender's problems for cognitive privacy and autonomy.

One citation problem in the PDF: the in-text marker for cogits is [23], which in the reference list is Ienca, Haselager and Emanuel 2018. The Bagley and Petritsch paper is [16].

**Threat vectors described** (section numbers from the paper):

| Group | Vectors | Closest TARA entries (proposed) |
|---|---|---|
| 2.1 Common | Supply chain (hardware Trojans, firmware, device swapping) | T0043 |
| | Harvest now, decrypt later; plus an inferential variant | T0045; candidate card |
| | Air-gap attacks: covert channels, side channels, fault injection, EM pulses | T0042, T0050; candidate card |
| | Hardware that fails to isolate software (Spectre, Rowhammer class) | T0163, T0164 |
| | Ransomware, including blocked stimulation (projected) | T0002 |
| 2.2 Brain and device | Seizure induction, autonomic and motor interference | T0029, T0030, T0122 |
| | Substrate alteration (drugs that lower seizure threshold) | T0158, T0152 |
| | Signals reachable outside the brain; unintended pickup | T0003 |
| | Neural identity (fMRI, EEG, sEMG as biometrics) | T0038, T0041, T0125 |
| | Cognitive processes (prompted PIN inference; nudging unsafe behaviour) | T0035, T0037, T0040 |
| | Implanted, minimally invasive, non-invasive and connected devices | context |
| 2.3 Transmission | Interception at analog front end, ADC, Bluetooth | T0003, T0042 |
| | RF signal injection | T0009 |
| | Spoofing and replay | T0067, T0104, T0107 |
| | Software, cloud, containers, ingestion APIs, storage | T0044 |
| 2.4 Machine learning | Data poisoning, transfer-learning and clean-label backdoors, adversarial filters | T0024, T0017, T0016, T0018 |
| | Adversarial concept drift hidden in EEG non-stationarity | T0062, T0066, T0071 |
| | Adversarial and universal perturbations | T0019 |
| | Model inversion, membership inference, model stealing | T0020; candidate card |
| | Federated poisoning; pipeline and model-registry attacks | candidate cards |

**Cerberus Institute** (https://www.cerberus.institute/). The site is one landing page: "A nonprofit research institute advancing open research, standards, and defenses for the neurotechnology era", the tagline "Securing the brain, guarding the mind.", an email sign-up and a link to a Google Form for contributors. There are no team, publication or project pages (the sitemap lists only the root; `/research`, `/publications`, `/about` and `/team` return 404). I did not open or submit either form. Two arXiv preprints carry the affiliation:

- arXiv:2607.10451, the review above.
- arXiv:2609.01856, Tapal and Bagley, "Adversarial Vulnerabilities of Neural Biomarker Identification Systems" (1 September 2026). It prints the institute's location as San Francisco, CA.

## (b) New attack research and proposed mappings

All items below resolved at Crossref or the arXiv API. "Dataset" means public recordings, no device or participant in the attack loop.

| Paper | ID | Finding and conditions | Evidence | Proposed mapping |
|---|---|---|---|---|
| Tarkhani et al. 2026, NERVE Attacks | arXiv:2609.08971 | OpenBCI Cyton, Muse 2 and NeuroSky MindWave Mobile 2 sent raw EEG unencrypted over BLE; MAC spoofing gave man-in-the-middle. On datasets: ten-trigger backdoor averaged 97.8% success on EEGNet but 20.0% on DeepSleepNet; forged signals reached 61.0% same-subject and 44.7 to 52.3% cross-subject against 33.3% chance. No code execution claimed. | Hardware (link layer) and dataset; preprint | T0003, T0004, T0049, T0016, T0067; candidate: temporal desynchronisation |
| Ni et al. 2026, IEEE S&P | 10.1109/SP63933.2026.00117 | VR headset motion sensors used to reconstruct EEG-correlated representations: perceived images inferred at 52.0 to 67.2%; de-anonymisation and keystroke inference above 96.0% (abstract; participant numbers not read). | Device experiment; peer reviewed | Candidate: motion-sensor inference in VR; related T0085, T0087 |
| Tapal and Bagley 2026 | arXiv:2609.01856 | Black-box spoofing of EEG authentication on six datasets. RSVP: false acceptance rose by 0.032 and 0.051 over baselines near 0.10. Motor imagery: no effect. Resting state: unmodified impostor recordings were already accepted at 0.812 to 0.896 and perturbation did not help. | Dataset; preprint | T0032 (mixed), T0038 |
| Cobilean et al. 2025, IEEE JBHI | 10.1109/JBHI.2025.3593443 | A limited-knowledge adversary could infer training-set membership for EEG CNN classifiers; more diverse training data helped most participants but raised risk for under-represented groups (abstract; no rates). | Dataset; peer reviewed | T0020 |
| Tai 2026, Still Leaking | arXiv:2606.09189 | Attribute decoder transferred across BIOT, LaBraM and EEGPT embeddings; membership inference was weak (AUC 0.50 to 0.70); DP-SGD at epsilon 4 and 8 did not remove the leak. No waveform or identity recovery shown. | Dataset; preprint | T0041; qualifies T0020; candidate card |
| Cong, Liu and Wu 2026, SW-ProxyCE | arXiv:2608.16931 | Adversarial inputs built on a public EEG foundation encoder transferred to private downstream models with no queries (abstract; no rates). | Dataset; preprint | T0019; candidate card |
| Tai 2026, Brain-Prompt Injection | arXiv:2606.09315 | On EEGMMI with harmless tool stubs, signal and context attacks changed the action routed by a BCI-to-LLM agent while monitors stayed blind; an independent confirmation channel blocked it. | Dataset; preprint | Candidate card |
| Qian et al. 2025, IEEE SPL | 10.1109/LSP.2025.3563446 | Black-box attack on brainprint recognition improved success with fewer queries and lower distortion on two datasets and four models (abstract; no rates). | Dataset; peer reviewed | T0032, T0019 |
| Jaberi, Bouchard and Falk 2025, IEEE SMC | 10.1109/SMC58881.2025.11343511 | EEG from a VR memory task leaked biological sex, age and identity (abstract; no accuracies). | Participant study; peer reviewed | T0041, T0053 |
| Gomasta et al. 2026, NeuroPriv | 10.1145/3842657.3842784 | On EEGMAT, compact features allowed gender, age and identity inference at 0.858, 0.789 and 0.692 balanced accuracy; a privacy-aware representation cut these to 0.563, 0.467 and 0.206 with task accuracy unchanged. | Dataset; workshop | T0041; defence |
| Bindra 2026 | arXiv:2607.06630 | EEGNet accuracy fell 25.7% under attack while a robustness certificate stayed valid; subject identity recoverable from task embeddings at 48.1% against 6.7% chance. | Dataset; preprint | T0019, T0041 |
| Rehman and Shafique 2026, AERIAL | arXiv:2609.30037 | Pruning and INT8 quantisation did not improve robustness: EEGNet stayed at 22 to 24% accuracy under PGD. | Dataset; preprint | T0019 |
| Lopez Madejska et al. 2025, Neurocomputing | 10.1016/j.neucom.2025.131344 | Neuronal flooding and jamming simulated on a 230,000-neuron model of mouse visual cortex; jamming generally more damaging. | Simulation; peer reviewed | T0025, T0026 (updates row C49) |
| Yu et al. 2025, IEEE Access | 10.1109/ACCESS.2025.3529477 | Defence against false data injected into a DBS tremor-sensor link; the attack is assumed, not demonstrated. | Simulation; peer reviewed | T0023, T0007 |
| Gao et al. 2025; Prakaashana et al. 2025 | 10.1016/j.compbiomed.2025.111112; 10.1016/j.neuroimage.2025.121476 | Diffusion models re-created faces from defaced MRI (484 unseen subjects); open-source face recognition matched photos to MRI faces for up to 59% of 182 participants, commercial tools 92% and 98%. | Dataset and participant data; peer reviewed | T0051 |
| Xie 2025 | arXiv:2507.21387 | Abstract reports 433 MHz interference cutting sEMG gesture accuracy from 97.8% to 58.3% at 1 m. Over-the-air validation unconfirmed. | Unconfirmed; preprint | Candidate card (unverified) |
| Kalupahana et al. 2026, E-MagDiP | arXiv:2607.25968 | Deliberate RF transmission added calibrated noise to EEG on three unmodified commercial headsets, as a privacy measure (epsilon 38.12, a weak guarantee). | Hardware; preprint | Corroborates the coupling path of T0009 |

Defence, survey and governance sources (25 more rows, including a post-quantum BCI link design comparable to NSP, DOI 10.3389/fnsys.2026.1891041) are in the JSON.

## (c) Techniques whose status the evidence might change

No written definition of the status values was found in the registrar or its rule file, so each row states the evidence level.

| Technique | Now | Proposal | Evidence | Caveat |
|---|---|---|---|---|
| T0009 RF false brainwave injection | EMERGING | DEMONSTRATED | Armengol-Urpi et al. 2023 (10.1145/3605758.3623497, hardware, already row C80); E-MagDiP 2026 (hardware, benign use) | Rests mainly on 2023 evidence. Two of the entry's three source strings could not be tied to any paper. |
| T0020 Membership inference | EMERGING | DEMONSTRATED (dataset level) | Cobilean et al. 2025 | A 2026 preprint found it weak on foundation-model embeddings. Current source is a general ML paper. |
| T0032 Neural biometric spoofing | EMERGING | DEMONSTRATED (dataset level), or keep | Qian et al. 2025; Tapal and Bagley 2026 | Mixed results; no physical presentation attack on a live system was found. |
| T0026 Neuronal flooding | THEORETICAL | Align with T0025 | Lopez Madejska et al. 2025; row C107 | Flooding and jamming come from the same simulations, yet T0025 is DEMONSTRATED. Both are simulation only. |
| T0023 Closed-loop perturbation cascade | THEORETICAL | EMERGING (simulation), optional | Yu et al. 2025; Dhaya and Kanthavel 2025 | Weak: simulations on models and public datasets. |
| T0036 Thought decoding | EMERGING | No change; add evidence | Kunz et al. 2025, Cell (10.1016/j.cell.2025.06.015) | Four consenting implant participants with trained decoders; the study also shows how to prevent unintended decoding. Covert decoding is not shown. |

Source-only fixes with no status change: T0003, T0004, T0016, T0017, T0018, T0019, T0041. T0004's only source (Martinovic 2012) is a side-channel study, not man-in-the-middle.

## (d) Not verified

These are listed and not used as support.

- **Findings unreadable.** Li et al. 2025, Spatialspectral-Backdoor (10.1016/j.neucom.2024.128902) and Tiwari et al. 2026 (10.1109/ICHMS69701.2026.11602273): the DOIs resolve, but no abstract was available.
- **Pasternak et al., NDSS 2025** (cochlear implants and audio deepfakes): listed on the NDSS page; no DOI resolved; not read.
- **Xie 2025**: whether the RF results were measured over the air.
- **"Zhang et al. 2024"** (T0009) and **"Lopez-Moreno et al. 2024"** (T0025 to T0028): no matching publication found.
- **Row C80**: the "Best Paper" and "first demonstrated" notes were not checked.
- **ISO/IEC 8663:2025** (BCI vocabulary) and **Connecticut SB 1295**: primary pages could not be fetched; details come from search summaries.
- **Cerberus nonprofit status**: self-described; no register checked.
- **Montana**: SB 163 (2025) was read at the legislature's archive. The registry lists "Montana SB 214" dated 2024, which I did not check. The effective date of SB 163 was not found in the text.

Search limits: Semantic Scholar's relevance endpoint returned HTTP 429, so only its bulk endpoint was used. IEEE Xplore and ACM DL were not fetched directly; their papers were verified through Crossref. The ACM CCS 2025 programme page could not be searched. There was no citation-graph expansion. Full text was opened for five documents only: the Bagley PDF (read in full) and four arXiv papers (read in part); every other finding comes from an abstract. The Quorum validation step in the workspace research protocol was not run.

## (e) Corrections to existing catalogue rows

| Row | Problem found | Fix (verified) |
|---|---|---|
| C52 | DOI 10.1016/j.eswa.2024.125599 resolves to an unrelated paper on knowledge distillation | 10.1016/j.eswa.2024.126362 (Zhong et al. 2025) |
| C57 | DOI returns 404; title expanded as "Adversarial Bayesian Augmented Training" | 10.1109/TNSRE.2024.3391936; "Alignment-Based Adversarial Training", Chen, Wang and Wu |
| C88 | DOI returns 404; wrong authors | 10.1088/1741-2552/ac0f4c; Liu Z, Meng, Zhang, Fang, Wu |
| C75 | Title is that of a cardiac defibrillator paper | DOI resolves to "Securing Wireless Neurostimulators" |
| C80 | Title does not match the DOI | "Brain-Hack: Remotely Injecting False Brain-Waves with RF..." |
| C77, C113 | Same DOI twice; C77 title is not the paper's | Keep C113 |
| C49 | Wrong first author; preprint only | Lopez Madejska et al., Neurocomputing 655:131344 |
| C62 | Tagged "FC 2017 / PEEP" | USENIX Security 2012 |
| C63, C58, C56 | Wrong first-author initial, year or title | See JSON |
| C51, C54, C59, B1 | Missing authors and DOIs; C54 journal name wrong; C59 year is 2026 | See JSON |

## Open questions for a human

1. What do DEMONSTRATED and CONFIRMED require: hardware, a live system, or is a dataset or simulation enough? The answer decides four of the five status proposals.
2. Should candidate cards that overlap existing entries (foundation-encoder transfer with T0019, attribute leakage with T0041, registry substitution with T0043 and T0046) become new techniques or notes?
3. Is the existing "Montana SB 214 (2024)" entry a mislabel of SB 163 (2025)?
4. Several strong 2026 items are preprints (NERVE, both Cerberus papers). Should preprints be allowed to support a status above EMERGING?
