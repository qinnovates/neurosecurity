# Proposed TARA attack chains — October 2026 refresh

**Author:** chains agent · **Accessed/verified:** 2026-10-06 · **Status:** review proposals, not integrated.

Six new chains for `datalake/tara-chains.json`, modeled on the single baseline chain `CHAIN-VIS-001`. Each follows the exact schema (`chain_id, chain_name, objective, drift_profile, steps[], clinical_parallel, defenses[]`), cites only existing QIF technique IDs with their real `tara_alias`, and keeps the baseline's defensive, one-sentence-per-step mechanism framing. Realism anchors, per-step evidence and demonstrated-vs-projected labels are in `chains-evidence.json` (kept out of the chain records so they stay schema-exact).

**Validator:** `parseTaraChains` (from `src/components/atlas/load-tara-chains.ts`, run via `npx tsx` against the registrar's technique-ID set) **accepted all 6 chains** — every step names a technique present in `datalake/qtara-registrar.json` and a role present in `ROLE_CONFIG`.

**Neuromodesty:** these are defender-facing threat models. Clinical parallels are diagnostic/therapeutic *categories* for dual-use framing, not diagnoses or causal claims. No chain asserts that a composed attack has occurred; CVEs are cited only for the individual steps they actually evidence.

Overall labels: **0 demonstrated, 4 partly demonstrated, 2 projected**. Of 30 steps: **15 demonstrated, 7 partly demonstrated, 8 projected**.

---

## CHAIN-DBS-001 — Adaptive DBS clinician-programmer parameter corruption
**Device class:** implanted adaptive deep-brain stimulator with a clinician programmer and patient telemetry (adaptive/closed-loop DBS; landscape: Medtronic BrainSense, Abbott Liberta RC). **Drift:** A→C. **Overall: projected.**

An attacker who reaches a weakly authenticated programmer/telemetry link shifts stimulation parameters inside the allowed envelope, lets the closed loop carry the maladaptive setting into motor circuits, and uses slow drift so clinicians attribute decline to disease progression. Initial access is demonstrated against real neurostimulator programmers; the closed-loop objective and persistence are theoretical.

| # | Role | Technique | Alias | Label |
|---|------|-----------|-------|-------|
| 1 | reconnaissance | QIF-T0057 | TARA-SIL-R-006 | demonstrated |
| 2 | initial_access | QIF-T0049 | TARA-SIL-M-012 | demonstrated |
| 3 | pivot | QIF-T0007 | TARA-SIL-M-001 | partly demonstrated |
| 4 | objective | QIF-T0023 | TARA-MOT-D-002 | projected |
| 5 | persistence | QIF-T0062 | TARA-COG-M-009 | projected |

**Evidence:** CVE-2023-25931 (CVSS 6.8, CWE-620 unverified password change) on Medtronic Pelvic Health clinician apps on the Smart Programmer; Conexus telemetry "does not implement authentication or authorization" (CVE-2019-6538, CVSS 9.3, CISA ICSMA-19-080-01); Schröder et al. 2025 (arXiv:2508.12571) for protocol manipulation and closed-loop risk. **Clinical parallel:** adaptive DBS parameter titration.

---

## CHAIN-EEG-001 — Consumer EEG headset decoder backdoor
**Device class:** consumer EEG headset + companion app + cloud/SDK ML decoder (Emotiv, Muse, Neurosity, Arctop SDK). **Drift:** A. **Overall: partly demonstrated.**

A backdoor is embedded in a shared pretrained EEG model via a compromised cloud pipeline, propagates through transfer learning, and makes the deployed decoder emit an attacker-chosen class on an invisible trigger while preserving clean accuracy. Backdoor/transfer steps are demonstrated on offline datasets; end-to-end on a shipping headset is not shown.

| # | Role | Technique | Alias | Label |
|---|------|-----------|-------|-------|
| 1 | reconnaissance | QIF-T0042 | TARA-SIL-R-004 | demonstrated |
| 2 | initial_access | QIF-T0044 | TARA-SIL-M-009 | demonstrated |
| 3 | pivot | QIF-T0017 | TARA-SIL-M-003 | partly demonstrated |
| 4 | objective | QIF-T0016 | TARA-SIL-M-002 | partly demonstrated |
| 5 | exfiltration | QIF-T0052 | TARA-COG-R-006 | demonstrated |

**Evidence:** Professor X (Liu, Song, He, Lu, Zheng, arXiv:2409.20158) — invisible, robust clean-label backdoor arbitrarily manipulating EEG-BCI output across three tasks, bypassing existing defenses; Meng et al. 2024 (arXiv:2412.07231) transfer-learning/adversarial backdoors; KNOB (CVE-2019-9506) for the BLE side channel; Martinovic et al. 2012 (USENIX Security) for ERP harvesting. **Clinical parallel:** transfer learning for cross-subject calibration.

---

## CHAIN-EAR-001 — In-ear EEG earbud supply-chain to cognitive profiling
**Device class:** in-ear EEG earbud + companion app (NAOX Naox Link, FDA 510(k) cleared Jan 2026 — first ear-worn EEG for clinical home use; IDUN Guardian). **Drift:** C. **Overall: projected.**

A supply-chain firmware implant quietly captures in-ear EEG alongside audio, builds longitudinal cognitive inferences off-device, binds them to the wearer via ear-canal acoustic fingerprinting, and normalizes continuous collection as background health monitoring. The firmware-backdoor and fingerprinting steps are demonstrated classes; the EEG-capture and cognitive-inference steps are emerging.

| # | Role | Technique | Alias | Label |
|---|------|-----------|-------|-------|
| 1 | initial_access | QIF-T0043 | TARA-SIL-M-008 | demonstrated |
| 2 | pivot | QIF-T0073 | TARA-COG-R-009 | projected |
| 3 | objective | QIF-T0074 | TARA-COG-R-010 | projected |
| 4 | exfiltration | QIF-T0079 | TARA-IDN-R-003 | demonstrated |
| 5 | persistence | QIF-T0056 | TARA-COG-R-008 | projected |

**Evidence:** NAOX Naox Link FDA 510(k) clearance, CES/Jan 2026 (MassDevice; Clinical Research News); Kaveh et al. 2020 (in-ear EEG, IEEE TBME); Martinovic et al. 2012 (private-info entropy reduced 15–40% vs chance); NEC 2016 / EarEcho (Gao et al. 2019) for ear-canal acoustic ID. **Clinical parallel:** in-ear EEG for seizure detection, sleep staging, cognitive monitoring. The boundary is consent, scope and oversight, not mechanism.

---

## CHAIN-RBCI-001 — Research BCI cloud-pipeline training and inference poisoning
**Device class:** research BCI + cloud ML pipeline with multi-site federated training (OpenBCI Cyton/Galea, g.tec amps → cloud decoder). **Drift:** A. **Overall: partly demonstrated.**

After compromising the shared cloud pipeline, the attacker injects poisoned training samples to bias the decoder, applies a universal perturbation to force misclassification at inference, and recovers participants' neural data from leaked federated gradients. Poisoning and UAP are demonstrated on EEG datasets; deployment against a specific live pipeline is projected.

| # | Role | Technique | Alias | Label |
|---|------|-----------|-------|-------|
| 1 | reconnaissance | QIF-T0057 | TARA-SIL-R-006 | demonstrated |
| 2 | initial_access | QIF-T0044 | TARA-SIL-M-009 | demonstrated |
| 3 | pivot | QIF-T0024 | TARA-SIL-M-006 | partly demonstrated |
| 4 | objective | QIF-T0019 | TARA-SIL-M-005 | partly demonstrated |
| 5 | exfiltration | QIF-T0021 | TARA-SIL-R-003 | projected |

**Evidence:** Meng et al. 2024 (arXiv:2412.07231) EEG poisoning/evasion; Liu et al. 2024 and Moosavi-Dezfooli et al. 2017 for universal adversarial perturbations; Zhu et al. 2019 (deep leakage from gradients, general ML); Schröder et al. 2025 for cloud/network threat framing. **Clinical parallel:** federated learning for multi-site clinical BCI trials.

---

## CHAIN-VIS-002 — Visual BCI sensory-channel selection hijack
**Device class:** consumer/assistive visual BCI with a display and eye tracking (Cognixion ONE; SSVEP/P300 spellers; eye-tracked XR). **Drift:** A. **Overall: partly demonstrated.**

Eye-tracking times the manipulation; a weaponized OTA update delivers malicious display timing; falsified neurofeedback nudges the user; imperceptible high-frequency flicker injects an SSVEP that biases the BCI's selection; probe stimuli then elicit recognition responses. SSVEP injection and P300 interrogation are demonstrated in the lab; OTA weaponization and feedback falsification are emerging.

| # | Role | Technique | Alias | Label |
|---|------|-----------|-------|-------|
| 1 | reconnaissance | QIF-T0085 | TARA-VIS-R-001 | demonstrated |
| 2 | initial_access | QIF-T0046 | TARA-SIL-M-010 | projected |
| 3 | pivot | QIF-T0022 | TARA-COG-M-006 | projected |
| 4 | objective | QIF-T0103 | TARA-VIS-M-002 | demonstrated |
| 5 | exfiltration | QIF-T0035 | TARA-COG-R-003 | demonstrated |

**Evidence:** Ming et al. 2023 (J Neural Eng 20(1):016042) — imperceptible 60 Hz SSVEP modulation driving a BCI at ~52.8 bits/min with no perceptible flicker; Martinovic et al. 2012 and Bonaci et al. 2015 for P300 interrogation; CVE-2020-27252 (unsigned-firmware race, CVSS 8.1) shows OTA weaponization is real on medical devices; Katsini et al. 2020 / Sluganovic et al. 2018 for eye-tracking inference. **Clinical parallel:** SSVEP/P300 BCI communication for locked-in patients.

---

## CHAIN-IMP-001 — Implant telemetry interception to neural-biometric spoofing
**Device class:** implanted neurostimulator/BCI with wireless telemetry and a patient gateway/hub (Medtronic implant telemetry + MyCareLink gateway pattern; applies to neural implants sharing this architecture). **Drift:** A. **Overall: partly demonstrated.**

RF observation finds the telemetry window; the attacker interposes on the cleartext link, bypasses gateway auth to act as a trusted reader, extracts a brainprint, and replays it to spoof the enrolled identity. Interception and auth bypass are demonstrated against real implant ecosystems; brainprint theft and neural-biometric spoofing are emerging, so the spoofing objective is projected.

| # | Role | Technique | Alias | Label |
|---|------|-----------|-------|-------|
| 1 | reconnaissance | QIF-T0042 | TARA-SIL-R-004 | demonstrated |
| 2 | initial_access | QIF-T0004 | TARA-SIL-R-001 | demonstrated |
| 3 | pivot | QIF-T0049 | TARA-SIL-M-012 | demonstrated |
| 4 | exfiltration | QIF-T0038 | TARA-IDN-R-001 | projected |
| 5 | objective | QIF-T0032 | TARA-IDN-M-001 | projected |

**Evidence:** KNOB (CVE-2019-9506, CVSS 8.1) entropy downgrade; CVE-2019-6540 (CVSS 6.5) Conexus cleartext transmission (CISA ICSMA-19-080-01); CVE-2020-25183 (CVSS 8.0) MyCareLink Smart auth bypass (CISA ICSMA-20-345-01); Maiorana et al. 2016 for brain-biometric permanence. **Clinical parallel:** neural biometric authentication for device access.

---

## What I was unsure about / needs a human decision

1. **Evidence placement.** The brief says put evidence in "a separate `evidence` block in your JSON." The loader validates `chains-proposed.json` strictly, and an extra top-level `evidence` key would be ignored but is risky. I put evidence in a **sibling file `chains-evidence.json`** and kept `chains-proposed.json` schema-exact. Reviewer should confirm this is the intended split, or decide where evidence should live at integration.
2. **`drift_profile` vocabulary.** I reused the baseline's `A/C/P` notation (from `tara-domain-taxonomy-proposal.md`). No enum is enforced by the loader, so this is stylistic — confirm the arrow notation is the house style.
3. **Role duplication.** The loader accepts any `ROLE_CONFIG` role in any order; I kept one role per step and a coherent recon→access→pivot→objective→persistence/exfil flow. CHAIN-IMP-001 ends exfiltration→objective (biometric is stolen, then replayed) — deliberate, flag if reviewers prefer objective last always.
4. **Chain ID scheme.** I used `CHAIN-{DEVICE}-NNN`. CHAIN-VIS-002 continues the existing VIS series; the rest open new series. Confirm naming before merge.
5. **Device-class attribution.** CHAIN-IMP-001 generalizes the Medtronic cardiac-implant telemetry CVE pattern to neural implants sharing the same gateway architecture; the CVEs are from cardiac devices. I named the *architecture*, not a neural product, to avoid overclaiming — reviewer should confirm that extrapolation is acceptable for the neuro catalog.
6. **Zhu et al. 2019 / Moosavi-Dezfooli 2017** are general-ML results already cited in the registrar; I did not independently re-verify their DOIs this session (registrar-provided). Marked the dependent step `projected`/`partly demonstrated` accordingly.
