# TARA mapping of the October 2026 research delta

Generated 2026-10-06. Machine-readable version: `tara-mapping.json`. Every item is a proposal; no tracked file was edited and nothing outside `_staging/2026-10-refresh/` was written.

**Result:** of the 11 candidate techniques, 7 are proposed as NEW, 3 as VARIANTs of existing entries and 1 as EVIDENCE ONLY. Of the 5 proposed status changes, 2 are supported with conditions and 3 are not. One consequential change follows from the status rubric: moving QIF-T0025 down to THEORETICAL so it matches QIF-T0026. The Bagley review has 32 mapped rows: 5 gaps, 9 partial.

## 1. Status rubric

**What the catalogue does now.** No written definition exists. The closest are a UI label map ("Confirmed in literature", "Demonstrated in lab", "Emerging capability", "Theoretical/projected") and `src/lib/evidence-tiers.ts`. Actual usage across the 165 entries:

- **CONFIRMED** covers replicated physiological phenomena (QIF-T0142 to T0145, T0157) and security techniques replicated by several groups or seen in products (QIF-T0003, T0082, T0087).
- **DEMONSTRATED** covers lab hardware, participants, dataset-level EEG attacks and animal studies. It also includes one simulation-only entry (T0025) and two entries with non-neural sources only (T0024, T0050).
- **EMERGING** covers ML attacks shown only outside neural data (T0020, T0021), capabilities shown without the adversarial use (T0036, T0073), chains of demonstrated steps, and single recent studies.
- **THEORETICAL** covers QIF derivations, taxonomy proposals and, in the four newest entries (T0162 to T0165), attacks documented only on non-neural systems.

**Inconsistencies in current usage:**

- Non-neural evidence alone is graded at three different levels: DEMONSTRATED, EMERGING and THEORETICAL.
- The same simulations support DEMONSTRATED for T0025 and THEORETICAL for T0026.
- `evidence-tiers.ts` places EMERGING below THEORETICAL, but `enrich-regulatory.py` places it above.

**Proposed rubric.** The status records how far the attack has been run against the real thing, not how plausible it is.

- **THEORETICAL:** no attack has been run against real neural data, a real decoder or real interface hardware. This covers analogy from attacks shown only on non-neural systems, review or taxonomy proposals, and simulation-only work. Simulation-only work includes in-silico tissue models and defence papers that assume the attack; label it "modelled".
- **EMERGING:** an attack has been run against real neural data, models or devices, but the evidence falls short of DEMONSTRATED for one of these reasons: it is preprint-only; the results are mixed or weak; or only parts of the path are shown (the coupling shown for a benign purpose, or delivery and effect shown separately).
- **DEMONSTRATED:** at least one peer-reviewed study ran the attack and measured a clear positive result. The study must have a Crossref-resolvable DOI or a PMID, and the entry must state the evidence level. Dataset-level evidence qualifies only when the technique's target is the model or the stored data. A technique that claims a physical or live-system path needs hardware or participant evidence.
- **CONFIRMED:** DEMONSTRATED plus independent peer-reviewed replication by a second group on hardware or participants, or documented occurrence in a shipped product or in the field. Preprints, simulations and dataset-only studies cannot reach it.

The label always describes the attack. A well-replicated clinical phenomenon does not, by itself, make its adversarial use CONFIRMED.

| Evidence type | Highest status under the rubric |
|---|---|
| Review or taxonomy only | THEORETICAL |
| Demonstrated only on non-neural systems | THEORETICAL (matches T0162 to T0165) |
| Simulation only | THEORETICAL, "modelled" (matches `theoretical_modeled` in `evidence-tiers.ts`) |
| Preprint, any evidence type | EMERGING |
| Peer-reviewed dataset-level study, model or data target | DEMONSTRATED (dataset-level) |
| Peer-reviewed dataset-level study, physical-path technique | EMERGING |
| Peer-reviewed hardware or participant study | DEMONSTRATED (hardware) |
| Independent replication on hardware or participants, or seen in the field | CONFIRMED |

If the rubric were applied to the whole catalogue (not proposed here), it would also re-grade the following:

- QIF-T0025 down to THEORETICAL.
- QIF-T0024 and T0050 down to THEORETICAL on their current sources.
- QIF-T0021 down to THEORETICAL.
- QIF-T0004 down to EMERGING. Its sole source is a side-channel study, and the first on-device man-in-the-middle source is a preprint.
- The CONFIRMED entries that cite a phenomenon rather than an attack. The owner's cross-reference review already lists these.

## 2. The five status changes under the rubric

| Technique | Now | Delta proposal | Rubric result | Decision |
|---|---|---|---|---|
| T0009 RF false brainwave injection | EMERGING | DEMONSTRATED | DEMONSTRATED (hardware), for front-end RF injection only | Change only after the entry is split. Its NISS 7.4, clinical and CVSS fields describe TMS-grade neuromodulation, which has no attack demonstration. Agrees with the owner's Quorum 5.5. |
| T0020 Membership inference | EMERGING | DEMONSTRATED | DEMONSTRATED (dataset-level) | Change once someone reads the attack success figures in Cobilean et al. 2025 (abstract only so far). Note that the 2026 preprint found membership inference weak on foundation-model embeddings. |
| T0032 Neural biometric spoofing | EMERGING | DEMONSTRATED or keep | EMERGING | Keep. The entry claims presenting a replicated signature to a live system. The evidence is digital perturbation on datasets, and the 2026 preprint result is mixed (no effect on motor imagery). |
| T0026 Neuronal flooding | THEORETICAL | Align with T0025 | THEORETICAL (modelled) | Keep, and align by moving **T0025 down** from DEMONSTRATED. Both rest on the same in-silico studies of a mouse visual-cortex model. |
| T0023 Closed-loop perturbation cascade | THEORETICAL | EMERGING (optional) | THEORETICAL (modelled) | Keep and add both papers as sources. In one the attack is assumed; in the other the loop is simulated. |

Crossref resolved all seven DOIs behind these rows in this session, with matching titles. Authors also matched, with one exception: for 10.4108/eetss.v9i1.9502 Crossref lists both family names as "R", so the delta's "Dhaya & Kanthavel" could not be confirmed.

## 3. Candidate techniques

The provisional IDs are the next free ones: the registrar runs from QIF-T0001 to T0165 with no gaps, and neither checkout references T0166 or above. Per `registrar.md`, the migration script assigns IDs and aliases, so `tara_alias` is null in every proposed entry. Variants reserve no ID.

The project's own scorer computed every NISS value. The script imports `parseNiss` and `scoreNiss` from `src/lib/niss-parser.ts` and runs them with tsx using default weights. Before use, the same script re-scored all 139 stored registrar vectors with no mismatches.

| Card | Candidate | Decision | Proposed entry | Tactic | Status | Severity | NISS vector | Score |
|---|---|---|---|---|---|---|---|---|
| M-C01 | Inferential harvest-now-decode-later | NEW | **QIF-T0166** | D.HV | THEORETICAL | high | BI:N/CR:H/CD:N/CV:I/RV:F/NP:N | 2.7 low |
| M-C02 | Brain-prompt injection (BCI-to-LLM agent) | NEW | **QIF-T0167** | M.SV | EMERGING | high | BI:N/CR:N/CD:H/CV:P/RV:F/NP:N | 1.4 low |
| M-C03 | VR motion-sensor inference (Ni et al., IEEE S&P 2026) | NEW | **QIF-T0168** | S.HV | DEMONSTRATED | high | BI:N/CR:H/CD:N/CV:I/RV:F/NP:N | 2.7 low |
| M-C04 | Zero-query transfer via public EEG encoder | VARIANT of QIF-T0019 | note and source on T0019 | M.SV | EMERGING (variant) | medium | inherits T0019: BI:L/CR:H/CD:H/CV:I/RV:P/NP:N | 5.4 medium |
| M-C05 | Embedding attribute leakage | EVIDENCE ONLY for QIF-T0041 (qualifies T0020) | source | n/a | n/a | n/a | n/a | n/a |
| M-C06 | Temporal desynchronisation of decoders | NEW | **QIF-T0169** | M.SV | EMERGING | medium | BI:N/CR:N/CD:L/CV:N/RV:F/NP:N | 0.4 low |
| M-C07 | RF interference against sEMG | VARIANT of QIF-T0009 (front-end RF injection), **on hold, UNVERIFIED** | none until confirmed | N.IJ | THEORETICAL | null | BI:N/CR:N/CD:L/CV:N/RV:F/NP:N (not inherited) | 0.4 low |
| M-C08 | Decoder model stealing | NEW | **QIF-T0170** | M.SV | THEORETICAL | medium | BI:N/CR:L/CD:N/CV:P/RV:F/NP:N | 1.0 low |
| M-C09 | Federated poisoning | VARIANT of QIF-T0024 | note and source on T0024 | M.SV | THEORETICAL (variant) | high | inherits T0024: BI:L/CR:H/CD:H/CV:I/RV:P/NP:T | 6.0 medium |
| M-C10 | ML pipeline compromise (registry, retraining, deployment) | NEW | **QIF-T0171** | M.SV | THEORETICAL | high | BI:L/CR:N/CD:H/CV:P/RV:T/NP:N | 2.7 low |
| M-C11 | Air-gap covert channels | NEW (covert half); side channels and fault injection are evidence for QIF-T0042 and T0050 | **QIF-T0172** | D.HV | THEORETICAL | medium | BI:N/CR:L/CD:N/CV:I/RV:F/NP:N | 2.4 low |

No vector sets the PINS flag. Every metric code has a one-line justification in the JSON. Each NEW record also carries a full entry in the registrar schema with these fields:

- `tara` with mechanism, dual_use, governance, engineering and dsm5.
- neurorights, origin and cross-references.
- `null_field_reasons` for each field left empty: classical, quantum, tara_alias, cvss, regulatory, physics_feasibility, cci. On M-C03, `dual_use` is left empty because it would require naming a therapeutic analogue.

**Choices worth checking:**

- **Duplicate corrections to the delta.** M-C09's card missed that QIF-T0024's notes already name federated learning as an entry point. M-C05's paper shows leakage of spectral attributes, not personal traits, so it is evidence rather than a technique.
- **M-C06 is the closest call.** It could instead widen QIF-T0109 (data alignment exploitation). I kept it separate because T0109 is about defence reference matrices, while desynchronisation shifts epoch timing and needs a different control.
- **NISS convention.** Scores use the newer entries' convention: CR and CD are scored separately, and BI and RV only where tissue is affected. On that basis every new technique scores 2.7 or below. With parity to the older M.SV family (CR copied into CD, BI:L and RV:P on digital attacks), M-C02 and M-C06 would score 5.4 and M-C10 6.7. Both scores are in the JSON. Variants inherit their parent's stored vector, so a record is never silently re-scored.
- **Capability scope.** Projected and demonstrated capability stay separate in every record (`capability.demonstrated` and `capability.projected`), and the notes say "PROJECTED" or "NOT shown" wherever that applies.

## 4. Bagley review coverage matrix

Source: Bagley, Rose, Kilbourn and Canham 2026, arXiv:2607.10451v1 (review, preprint). Built from the vector list in `research-delta.json` and the owner's section references. **The PDF itself was not available to this pass.**

| § | Threat vector | Existing QIF-T | Coverage | Gap / proposal |
|---|---|---|---|---|
| 2.1.1 | Supply chain: hardware Trojans, firmware, device swapping, key readout | T0043, T0046, T0048, T0050, T0073 | Covered | |
| 2.1.2 | Harvest now, decrypt later (cryptographic) | T0045 | Covered | |
| 2.1.2 | Harvest now, decode later (inferential) | none | **Gap** | M-C01 → T0166 |
| 2.1.3 | Air-gap covert channels | none (adjacent T0072, T0094, T0100) | **Gap** | M-C11 → T0172 |
| 2.1.3 | Side channels (EM, power, timing) | T0042 | Partial | link-scoped; add source |
| 2.1.3 | Fault injection, EM pulses | T0050 | Covered | add source |
| 2.1.4 | Hardware isolation failure (Spectre, Meltdown, Rowhammer) | none (T0163, T0164 related only) | **Gap** | no card; owner's item 6 |
| 2.1.5 | Ransomware incl. blocked stimulation (projected) | T0002, T0029 | Covered | |
| 2.1 | Attacks in combination | T0095 to T0099; one chain in tara-chains.json | Partial | |
| 2.2.1.1 | Seizure induction, autonomic and motor interference | T0026, T0029, T0068, T0122, T0133, T0121, T0030, T0008, T0131 | Covered | mostly THEORETICAL |
| 2.2.1.2 | Substrate alteration | T0158, T0152, T0115, T0160 | Covered | judged from names and mechanism; notes empty |
| 2.2.1.3 | Signals reachable outside the brain; unintended pickup | T0003, T0073, T0042 | Covered | |
| 2.2.1.4 | Neural identity (fMRI, EEG, sEMG biometrics) | T0038, T0125, T0041, T0032, T0051, T0069, T0096 | Partial | sEMG not in any entry |
| 2.2.1.5 | Prompted private-information inference | T0035, T0052, T0040, T0103 | Covered | |
| 2.2.1.5 | Nudging toward unsafe behaviour | T0037, T0040, T0065 | Covered | projected |
| 2.2.1.5 | Cognition and behaviour as an output channel | none | Not assessed | summary too thin |
| 2.2.2 | Implanted, minimally invasive, non-invasive devices | none (framing, not a technique) | Context | |
| 2.2.3 | Connected devices with shorter security support | T0047, T0044, T0162 to T0164 | Partial | companion-device compromise not itemised |
| 2.3.1 | Interception: front end, ADC, BLE sniffing, MITM, MAC spoofing | T0003, T0004, T0042, T0048, T0049 | Covered | NERVE adds evidence |
| 2.3.2 | RF injection at acquisition | T0009, T0001, T0067 | Covered | T0009 needs splitting |
| 2.3.3 | Spoofing and replay | T0067, T0104, T0107, T0032 | Covered | |
| 2.3.4 | App flaws, auth and session, deserialisation, SDK risk | T0049, T0163, T0164, T0007, T0043 | Partial | |
| 2.3.5 | Cloud: breach, containers, ingestion APIs, cross-tenant, noisy neighbour | T0044 | Partial | owner's items 3 and 7 |
| 2.4.1 | Data poisoning, transfer-learning, clean-label and filter backdoors | T0024, T0017, T0016, T0018, T0058 | Covered | |
| 2.4.1 | Adversarial concept drift | T0062, T0066, T0071 | Covered | projected |
| 2.4.1.1 | Federated poisoning (client or aggregator) | T0024 | Partial | M-C09 variant; aggregator under M-C10 |
| 2.4.1 | Weight-manipulation and compiler-level backdoors | T0108 (neuromorphic only) | Partial | sub-type of M-C10 |
| 2.4.2 | Adversarial and universal perturbations; trigger delivery; RF and EM interference | T0019, T0018, T0016, T0009, T0063 | Covered | M-C04 note |
| 2.4.3 | Membership inference | T0020 | Covered | M-S02 |
| 2.4.3 | Model inversion | T0021 (gradients only) | Partial | no card; the review says no published reconstruction attack on neural data |
| 2.4.3 | Model stealing | none | **Gap** | M-C08 → T0170 |
| 2.4.4 | ML pipeline: registry, retraining, monitoring evasion, deployment configuration | none (adjacent T0043, T0046, T0058, T0071) | **Gap** | M-C10 → T0171 |

## 5. Reconciliation with the owner's mapping

The owner's mapping is in `BAGLEY-FUNDAMENTALS-TTP-MAPPING.md` (2026-08-05, with Quorum review). This pass agrees with it on the following:

- HNDL inferential belongs under D.HV next to T0045.
- The T0009 change waits for the split.
- Foundation-model items extend existing entries rather than becoming new techniques.
- Hardware isolation failure is a gap, so the delta's T0163/T0164 mapping is a relation, not coverage.
- The ML pipeline gap is real.
- Air-gap channels are distinct from the consumer-sensor family.
- Records use CR and CD rather than readout and alteration labels.

It disagrees in three places:

1. **Model stealing is a gap that the owner's document does not list.** The Quorum says M.SV covers three of the review's four ML phases. Within the extraction phase, however, model stealing has no entry and output-based model inversion is only partly covered.
2. **The federated aggregator direction.** The Quorum (5.4) proposes a companion entry to T0024. Here it is a sub-type of the pipeline technique, because a malicious aggregator is a compromised model-distribution point.
3. **"Zero representation" for pipeline attacks is slightly too strong.** Retraining hijack overlaps T0058 and T0071.

On air-gap channels, this mapping prefers the owner's "one parameterised technique" option over eight entries, and adds that a chain step in `tara-chains.json` needs a record to reference.

## 6. Open questions for a human

1. **Adopt the rubric?** The choices that carry the weight are: simulation-only means THEORETICAL (which moves T0025 down); preprints cap at EMERGING; dataset-level evidence reaches DEMONSTRATED only for model or data targets; non-neural demonstrations mean THEORETICAL.
2. **Citation gate.** Does an arXiv-verified preprint satisfy `registrar.md`'s "at least one DOI/PMID-verified citation"?
   - Read literally, only M-C03 passes cleanly, and M-C01 passes on an indirect source.
   - M-C02, C06, C08, C10 and C11 rest on arXiv items alone.
   - Precedent cuts the other way: T0108 is DEMONSTRATED on two arXiv IDs.
3. **Add seven techniques now, or hold?** They would take the catalogue to 172 entries. Of the seven, one would be DEMONSTRATED, two EMERGING on single preprints and four THEORETICAL on a review. The owner's Quorum 5.10 recommended one batched migration.
4. **Who scopes the T0009 split?** M-S01 and M-C07 both wait on it, and the split-out record needs its own NISS and CVSS.
5. **Tactic calls.**
   - M-C02: M.SV or N.IJ.
   - M-C10: M.SV or B.IN.
   - M-C06: a new record, or a variant of T0109.
   - M-C11: D.HV, for lack of an exfiltration tactic.
6. **NISS convention.** Re-score the older M.SV family (T0016 to T0019, T0024) on the newer convention, or keep family parity?
7. **Full-text reads before anything is applied:**
   - Ni et al. 2026: participants, class counts and chance levels.
   - Cobilean et al. 2025: success figures.
   - Xie 2025: over-the-air or simulated.
8. **M-C03 fields left to the owner:** `dual_use`, and whether inferred brain-response correlates count as `sensitive_neural` or `PII`.
9. **Gaps with no candidate card:**
   - hardware isolation failures;
   - output-based model inversion;
   - sEMG as an interface modality;
   - companion-device compromise;
   - "cognition and behaviour as an output channel", which was not assessed.
10. **PLAUSIBLE and SPECULATIVE.** Each is used once and neither is in the TypeScript `Status` type. Fold them into THEORETICAL or define them.

## 7. Limits

- Paper findings come from `research-delta.json`. In this session, Crossref re-resolved ten DOIs (metadata only). The arXiv IDs were not re-fetched.
- Duplicate checks were keyword searches over attack, notes, mechanism and sources for all 165 entries, followed by reading the nearest entries. 26 entries (T0136 to T0161) have no notes text and several others have empty notes.
- NISS measures signal-level and physical impact. Low scores for digital attacks are a property of the metric; the catalogue's separate `severity` field carries the broader judgement.
- Neurorights labels follow the registrar's taxonomy for threat-modelling purposes only.
- The workspace's Quorum validation step was not run on this mapping.
