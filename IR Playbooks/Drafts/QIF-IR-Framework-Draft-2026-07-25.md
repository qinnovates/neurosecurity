# QIF Incident Response Framework — Draft

**Source:** `governance/QIF-GOVERNANCE-QUESTIONS.md`, Parts VI–VII (neurosecurity/QIF project)
**Saved:** 2026-07-25 | **Updated:** 2026-07-26 (TARA merge complete)
**Status:** Draft — proposed, unvalidated, not adopted by any standards body. This is a working copy for offline review; the repo file linked above remains the canonical/living version.

This document captures the Incident Response framework built out across two sessions: the corrected OS-update/fallback/recovery architecture and RACI (Part VI), the Kernel Core Responsibility RACI (Part VII), and the TARA threat-catalog gap analysis (Parts VII.1–VII.2) — which has since gone from "reviewed candidates pending merge" to **four live catalog entries** (QIF-T0162–QIF-T0165) plus a structured cross-reference enrichment, verified end-to-end and confirmed not to have broken anything else in the project. It followed an internal multi-agent adversarial review (Quorum protocol) at each stage — architecture, RACI structure, NIST engagement path, epistemic-integrity/neuromodesty compliance, and TARA technique proposals were each independently stress-tested before being written up or merged.

---

## Part VI: Emergency Response — OS Update, Fallback, and Recovery

**Status:** Draft. Added 2026-07-25, following an internal 5-panel adversarial review (safety-critical systems/hardware redundancy, GRC/governance architecture, devil's-advocate, NIST standards-process, and neuromodesty/epistemic-integrity lenses, each working independently). Companion to Part II (RACI Matrix), `NEUROSECURITY_POLICY_PROPOSAL.md` §5.1 (NIST engagement), and the `BCI-Security-Best-Practices` research wiki page.

**Scope note.** This Part covers OS/kernel update safety, runtime fallback, and human emergency override for a life-critical BCI — deliberately narrower than general Incident Response. Active-compromise / cyberattack response is already covered by the "Emergency and Edge Cases" table in Part II (row: "Device under active cyber attack," AI System = Responsible via Neurowall). Where an update-triggered event is later determined to be malicious rather than defective, QIF-IR-11 below hands off to that existing row rather than duplicating it.

**Status qualifier (applies to this entire Part).** Every control, threshold, and architecture pattern below is a proposed, unvalidated design — consistent with QIF's overall status. Numeric parameters (timing windows, thresholds) are illustrative examples requiring per-device and per-patient clinical validation, not established constants. "Accountable" denotes RACI process accountability, not a determination of legal liability, which is governed separately by applicable law, contract, and regulatory status.

### VI.1 Architecture Correction: Floor-Promotion, Not Dual Redundancy

An earlier draft of this scenario proposed continuity during a failed update via full dual-redundant kernel execution (two complete OS instances in hot-standby, with a hardware-timed handoff on failure). Internal review found this unsound for this context: it applies a hardware-fault-tolerance pattern — designed to vote between multiple lanes of *identical, already-certified* code — to a *software-version-cutover* problem, where there is no principled way to arbitrate between two genuinely different kernel versions; it introduces state-synchronization/staleness risk on failover; and for an implanted or wearable form factor it roughly doubles active power and heat load against tissue-heating and battery-life constraints that already dominate implant design.

**Corrected architecture — the Safety Floor pattern.** A minimal, low-power, independently-verifiable microcontroller ("the Floor") runs a bounded, formally-tractable safety-critical control loop continuously and is never itself the target of the general-purpose OS update process. The general-purpose OS (Kernel + systemd) sits *on top of* the Floor as an enhancement layer: when healthy, it extends function beyond the Floor's baseline; when it panics, fails a health check, or is mid-revert, control does not "fail over" to a second full OS — it reverts to the Floor's baseline, which was never interrupted. This mirrors the pattern used in implantable cardiac devices: a minimal, extremely conservative pacing kernel that is not itself the subject of routine over-the-air risk, paired with a separately-updatable diagnostics layer.

This reframes "Basic Mobility Mode" (originally an emergency-only last resort) as the **always-on baseline**, not an emergency measure — see VI.4 for why this floor must be defined per modality rather than as one undifferentiated "safe state."

### VI.2 Governance RACI — Emergency Response Controls

Reuses the six-column schema from Part II (Patient, Clinician, Manufacturer, Regulator (FDA/CE), Open Standard (QIF), AI System) for consistency — this Part does not introduce a second, competing RACI schema. Each row is a control (`QIF-IR-NN`) with an illustrative CSF 2.0 function mapping, intended as the near-term gap-analysis input referenced in `NEUROSECURITY_POLICY_PROPOSAL.md` §5.1 — targeted at NIST's OLIR submission process rather than self-convening a Community Profile working group (see VI.5).

| ID | Control | Patient | Clinician | Manufacturer | Regulator | Open Standard (QIF) | AI System | CSF 2.0 Function |
|----|---------|---------|-----------|---------------|-----------|----------------------|-----------|--------------------|
| QIF-IR-01 | Telemetry continuity during update (Floor stays live; OS layer is what updates) | I | C | R | I | C | — | Protect / Detect |
| QIF-IR-02 | Trigger routine (non-critical) OS/kernel update | C/A | C | R | I | — | — | Protect |
| QIF-IR-03 | Trigger critical security patch (active CVE) | C | R/A | R | A (compressed-timeline authority) | C | I | Protect / Respond |
| QIF-IR-04 | Runtime fallback execution (enhancement-layer panic; Floor unaffected) | I | I | R | I | — | — | Respond |
| QIF-IR-05 | Emergency human override (hardware veto trigger) | A | R | I | I | — | I | Respond |
| QIF-IR-06 | Override recovery and re-certification (return to OS control) | C/A | R/A | C | I | — | C | Recover |
| QIF-IR-07 | Override abuse detection and audit (tamper-evident log, lockout after N triggers) | I | C | R | I | — | R | Detect |
| QIF-IR-08 | Consent bootstrap when the BCI is the patient's primary communication channel | A (advance directive) | R | C | I | C | — | Govern |
| QIF-IR-09 | Power-loss-during-write integrity (atomic partition pointer swap) | I | I | R/A | I | C | — | Protect |
| QIF-IR-10 | Fleet-scale rollout governance and circuit breaker | I | I | R/A | C | C | C (anomaly detection) | Govern / Protect |
| QIF-IR-11 | Post-incident root cause and regulatory notification | I | C | R | A | — | I | Recover |
| QIF-IR-12 | Two-person integrity for non-emergency update authorization | I | R (+ independent reviewer) | C | I | — | — | Govern |

**Notes on new/revised rows** (all identified via the internal review, not present in the original draft):
- **QIF-IR-03** gives Regulator "A" for compressed-timeline authority because an unqualified Patient veto over an actively-exploited CVE patch is a safety gap, not a labeling nit — consent is still required and sought, but cannot indefinitely block a patch to a live vulnerability without an escalation path.
- **QIF-IR-06** — emergency override with no defined path back to normal operation was a life-critical gap in the original draft.
- **QIF-IR-07** — the override sits outside OS visibility for tamper-resistance, which also makes it capable of being tripped repeatedly (accidentally, maliciously, or by a coerced caregiver) undetected. The audit log must be written by hardware independent of the OS (write-once/tamper-evident), consistent with `BCI-Security-Best-Practices` item 15.
- **QIF-IR-08** addresses the consent-bootstrapping paradox: if the BCI is the patient's only expressive channel, the moment a critical patch is needed may be the moment they cannot articulate consent through it. Requires an out-of-band consent path (advance directive, physical control, or caregiver-witnessed dual consent for a pre-classified "cannot wait" tier) that does not depend on the subsystem being patched.
- **QIF-IR-10** — every other row is single-patient scoped; nothing halted a bad signed update across a device population in the original draft. Requires staged percentage rollout and an automatic global halt if aggregate fallback rate exceeds a threshold within a window, fed by anonymized aggregate telemetry distinct from per-patient sensory-motor telemetry (QIF-IR-01).
- **QIF-IR-12** — the Clinician/Medic role held Accountable or Responsible on nearly every row in the original draft with no second check. Added an independent-reviewer requirement for non-emergency triggers; does not apply to QIF-IR-05, which must remain fast and unilateral by design.

### VI.3 Technical Execution / Traceability Table

Deliberately **not** a second RACI. Components execute; they do not hold organizational accountability. This table traces each governance control to the component(s) that implement it. If this table and VI.2 ever disagree, VI.2 is authoritative and this table is corrected to match — not the reverse. This avoids maintaining two independently-updated RACI-shaped documents with different natural change cadences (org/regulatory change vs. firmware/kernel release cycles), which drift.

| ID | Floor (Safety MCU) | General-Purpose Kernel | systemd Suite | Bootloader / Firmware | Fleet Telemetry Aggregator |
|----|----------------------|--------------------------|------------------|--------------------------|--------------------------------|
| QIF-IR-01 | R (always-on baseline) | R (enhancement layer) | R (cgroup isolation) | — | — |
| QIF-IR-02 | — | — | R (staging, signed image) | — | — |
| QIF-IR-03 | — | — | R | — | — |
| QIF-IR-04 | R (unaffected by OS panic) | R (panic source) | R (health check) | — | — |
| QIF-IR-05 | R (drops OS access) | — | — | R (immutable trigger path) | — |
| QIF-IR-06 | — | R (re-admitted after check) | R (integrity re-verify) | R (attestation) | — |
| QIF-IR-07 | R (write-once log) | — | — | R (tamper-evident storage) | — |
| QIF-IR-08 | — | — | — | R (out-of-band consent I/O) | — |
| QIF-IR-09 | — | — | R (atomic pointer swap, post-checksum only) | R (power-loss-safe write) | — |
| QIF-IR-10 | — | — | — | — | R |
| QIF-IR-12 | — | — | R (enforces dual-sign gate) | — | — |

### VI.4 Modality-Specific Fail-Safe Floor Specification

A single undifferentiated "safe state" does not fit every sensory-motor pathway — freezing is a defensible floor for motor control, but a frozen visual frame or complete audio silence are each dangerous in ways specific to that modality. Each floor inherits the hardware-enforced amplitude ceiling already established in this document's governance model (Part I, Q1.1, Q3.3) — physical safety bounds are enforced in hardware and cannot be raised by any software layer, including the enhancement OS.

**Motor.** Floor = the always-on MCU stability/posture controller (VI.1). On enhancement-layer failure, control reverts to this floor rather than a full stop — a hard freeze mid-gait is itself a fall risk, so the floor should implement a bounded, conservative stability-hold behavior rather than a rigid lock, pending clinical validation of what "safe" means for a given patient's mobility profile. *Confidence: theoretical, unvalidated — exact floor behavior needs a rehabilitation/gait specialist's input, not only a systems-engineering judgment.*

**Vision.** Floor = fail-dark (no rendered signal) paired with a mandatory cross-modal alert (haptic or audio orientation cue) — never fail-dark silently. A last-known-good frame may substitute for fail-dark only if explicitly time-bounded and flagged to the user as stale; an unflagged frozen frame during motion (e.g., mid-street-crossing) is more dangerous than an announced blackout. True hot redundancy — the floor-promotion pattern from VI.1, extended to a scoped, always-live decode/render pipeline rather than the whole OS — may be justified for vision specifically if fail-dark-plus-alert proves clinically insufficient; this is a modality-specific decision, not inherited automatically from the motor case. *Confidence: theoretical, unvalidated.*

**Auditory.** *(New — extends this framework to hearing-loss-compensation and tinnitus-suppression BCIs, per the project's Wearable Auditory BCI concept: a non-invasive, bone-conduction, glasses-integrated device with an onboard DSP/AI processing layer. The underlying hardware concept is status: draft, confidence 0.5 in the research record — the floor spec below is correspondingly earlier-stage than the motor/vision cases above, not equally mature.)*

Floor = passive analog passthrough: a hard-wired, minimal circuit relaying the ambient microphone signal directly to the bone-conduction transducer, bypassing the DSP/AI processing layer entirely. **Not silence.** For a device compensating hearing loss, losing all processing is equivalent to losing hearing outright — the user loses access to traffic, alarms, and spoken warnings, which is the auditory-domain analog of vision fail-dark being dangerous, not the auditory-domain analog of a "safe" quiet state. Two failure sub-cases specific to this device class:
- **Hearing-loss compensation failure** → revert to passive passthrough (unprocessed but present, not absent).
- **Tinnitus active-cancellation failure** → the anti-phase canceling signal stops and the patient's phantom tone returns. Not itself a safety hazard, but must be signaled cross-modally (haptic or visual) — the audio channel cannot be trusted to announce its own failure, matching the cross-modal alert pattern used for vision.

Amplitude ceiling: even though bone conduction bypasses the eardrum, sustained cochlear-hair-cell overdrive from a runaway DSP is a plausible failure mode and must be bounded by the same hardware-enforced ceiling used elsewhere in this framework, not left to software. *Confidence: theoretical, unvalidated — the underlying hardware concept has not been prototyped beyond personal bone-conduction testing per the research record; this floor spec is a design proposal to validate alongside the hardware, not a retrofit onto an existing shipped device.*

### VI.5 NIST Engagement Path — Correction

Internal review, cross-checked against NIST's own guidance (NIST CSWP 32, "NIST Cybersecurity Framework 2.0: A Guide to Creating Community Profiles," April 2024), found that Community Profiles are convened by trade associations, sector coordinating councils, or regulators — not by NIST on a contributor's behalf, and not typically by an unaffiliated individual. The near-term step in `NEUROSECURITY_POLICY_PROPOSAL.md` §5.1 ("convene a BCI security working group under NIST's Community Profile program") should be revised: the CSF 2.0 function-mapping columns in VI.2 are better targeted at **NIST's OLIR (Online Informative References) Program** (NISTIR 8278A) — a self-service, NIST-reviewed submission process for exactly this kind of control-to-CSF-function mapping — with a formal Community Profile treated as a possible long-term outcome once an institutional co-sponsor (professional society, university, or manufacturer) is willing to convene it, not a self-executable near-term step. Given this is FDA-regulated hardware, AAMI TIR57, ANSI/AAMI SW96, and IEEE 2621 are plausibly a more directly relevant standards chain than NIST CSF alone, and peer-reviewed publication of the underlying threat catalog and scoring methodology is a credibility prerequisite that should precede any standards-body submission, not run parallel to it. This Part deliberately does not extend SP-800-53-style formatting further than the `QIF-IR-NN` ID scheme already in use, to avoid the document appearing pre-reviewed by NIST before any actual submission exists.

---

## Part VII: Kernel Core Responsibility RACI

**Status:** Draft. Added 2026-07-25.

**Purpose.** The Kernel appears as a single undifferentiated "Responsible" actor throughout Parts II and VI, which understates what "the Kernel" actually does and collapses four functions with different threat surfaces and, in practice, different accountable parties into one label. This Part decomposes the Kernel into its four foundational responsibility domains — the standard operating-systems decomposition (hardware abstraction, resource scheduling, memory management, protection/access control) — and assigns governance accountability to each, reusing the six-column schema from Part II.

| ID | Kernel Function | What It Does | Patient | Clinician | Manufacturer | Regulator | Open Standard (QIF) | AI System | Primary Threat Surface | Mapped TARA Technique(s) |
|----|-------------------|----------------|---------|-----------|---------------|-----------|-----------------------|-----------|---------------------------|-----------------------------|
| QIF-K-01 | Hardware Driver | Directly interfaces with electrode arrays, ADC/DAC, actuators/transducers — the only layer that touches physical signal in or out | I | C | R/A | C | C | C (anomaly detection) | Malicious or buggy driver → direct physical signal manipulation | QIF-T0043 (supply chain firmware backdoor), QIF-T0046 (OTA firmware weaponization), QIF-T0048 (electrode compromise/physical tamper), QIF-T0050 (hardware fault injection — voltage/EM glitching), QIF-T0001 (signal injection at electrode-tissue boundary) |
| QIF-K-02 | Resource Management | Schedules CPU/IO cycles (e.g., PREEMPT_RT) and allocates bandwidth across competing processes/threads | I | C | R | I | C | C | Starvation/DoS of the safety-critical control loop by a lower-priority process | **Filled — QIF-T0162** (control-thread starvation via co-resident process). Previously no direct match; QIF-T0029/T0031 remain the closest pre-existing analogs but model physiological/power-layer DoS, not this scheduler-layer class. |
| QIF-K-03 | Memory Accountant | Allocates, isolates, and tracks memory per process; enforces that one process cannot read or write another's memory | I | I | R/A | I | C | C | Memory-safety bugs → arbitrary code execution or cross-process neural-data exfiltration | **Filled — QIF-T0163** (execution/control-loop corruption) **and QIF-T0164** (cross-process exfiltration). Previously no match; QIF-T0054/T0060/T0034 remain confirmed non-matches (they model neurocognitive memory, not kernel RAM). |
| QIF-K-04 | Permissions / Boundaries | Enforces the capability-tier model (Tier 1-5, Part I Q3.1) and process/trust-domain isolation | C | C | R | I | A | C | Privilege escalation / jailbreak past a tier boundary | QIF-T0049 (wireless authentication bypass), QIF-T0050 (hardware fault injection — "can bypass security checks"), QIF-T0061 (coherence mimicry — evades QIF's own detection boundary directly) |

**Notes:**

- **QIF-K-01 (Hardware Driver).** The function with the most direct path to physical harm — a bad driver doesn't corrupt data, it can miswrite a stimulation waveform. Manufacturer holds both R and A because they write and certify the driver; Regulator and QIF are Consulted on driver-level safety requirements — this is where the amplitude ceiling from Part I Q1.1 is actually enforced in code, not just specified on paper.
- **QIF-K-02 (Resource Management).** This is the general case of what QIF-IR-01 (Part VI, telemetry continuity) governs for the update-fallback scenario specifically. A resource-starvation attack — e.g., a log-flush process stealing cycles from the motor driver — doesn't require compromising the driver at all, only winning the scheduler.
- **QIF-K-03 (Memory Accountant).** "Memory accountant" is doing real work as a name, not just usage tracking — it's the boundary that prevents one process's fault or compromise from reading or corrupting another's state. This is why Part IV's Q-SEC-4 proposes formal verification specifically for this class of kernel property (seL4 precedent): memory-safety bugs are the most common root cause of confidentiality/integrity failures in general-purpose kernels, and in a BCI context, a memory-safety bug here is the most plausible software path to unauthorized read or write of live neural signal.
- **QIF-K-04 (Permissions/Boundaries).** Open Standard (QIF) holds Accountable here, not Manufacturer — the Tier 1-5 capability model itself (which tier permits what) is a QIF governance decision (Part I, Q3.1); the Manufacturer's role is to correctly *implement* QIF's tier definitions, not to define them. This is the one row where a manufacturer implementing the boundary incorrectly is a standard-conformance failure, not only a manufacturer defect — relevant once a conformance/certification program (Part V) exists.

**Relationship to TARA.** Originally mapped against `datalake/qtara-registrar.json` (then 161 techniques). Two real coverage gaps were found — not assumed in advance — and have since been filled:

**Coverage Gap 1 (QIF-K-02) — filled by QIF-T0162.** TARA's DoS-adjacent techniques (QIF-T0029 Neural DoS, QIF-T0031 battery drain) model attacks on the physiological/power layer — flooding the neural pathway or draining the battery. Neither modeled a malicious or merely buggy co-resident process winning the OS scheduler and starving the safety-critical control thread of CPU/IO cycles without touching the neural signal path at all — exactly the failure mode QIF-IR-01 and the Floor-Promotion architecture (VI.1) exist to defend against. Now filed as QIF-T0162.

**Coverage Gap 2 (QIF-K-03) — filled by QIF-T0163 and QIF-T0164.** Checked directly against source text: TARA's three "memory"-named techniques (QIF-T0054, T0060, T0034) all model attacks on *neurocognitive* memory — hippocampal activity, long-term potentiation, working-memory circuits — not kernel process memory. No technique modeled classic memory-safety exploitation (buffer overflow or use-after-free in the kernel/driver → arbitrary code execution or cross-process neural-data exfiltration) — the exact attack class Part IV's Q-SEC-4 (seL4-style formal verification target) is proposed to defend against. Now filed as two entries: QIF-T0163 (execution outcome) and QIF-T0164 (exfiltration outcome), kept separate per real MITRE ATT&CK convention (one vulnerability class serving genuinely different tactics — cf. T1068/T1203/T1211/T1210 — stays split, not merged).

**Part VI cross-references:** QIF-IR-02/QIF-IR-03 (trigger update) → QIF-T0043, QIF-T0046; QIF-IR-05/QIF-IR-07 (override trigger/abuse) → QIF-T0050; QIF-IR-08 (consent bootstrap) → QIF-T0064; QIF-IR-01 (telemetry continuity) → **now QIF-T0162**; QIF-IR-09 (power-loss-during-write integrity) → **now QIF-T0165**; QIF-IR-10 (fleet-scale circuit breaker) → **QIF-T0047** (a real pre-existing entry missed on first pass, plus a new structured `deployment_control_gap` enrichment now live on QIF-T0043 and QIF-T0046, cross-referencing both QIF-IR-10 and QIF-T0047).

### VII.1 Candidate Techniques — Merged Into Live Catalog (QIF-T0162–T0165)

Three independent SMEs each drafted schema-conformant candidate techniques for the gaps above, grounded in the real catalog schema and As-Code vocabulary. An adversarial duplicate/scoping critic and a citation/schema reviewer then independently stress-tested the output — the critic with direct tool access to the live catalog file, not just sampled excerpts. Final disposition, all now live:

| Candidate | Gap | Live ID | Disposition |
|---|---|---|---|
| Control-thread starvation via co-resident process | Gap 1 (K-02) | **QIF-T0162** | **Merged.** Originally proposed as two entries (priority-inversion blocking vs. RT-privilege/IRQ-quota abuse); merged per real ATT&CK precedent (T1499 Endpoint DoS's sub-technique pattern — same tactic + same outcome = one technique, mechanism variants documented within it). Tactic corrected to QIF-P.DS. Status THEORETICAL. Cites the verified 1997 Mars Pathfinder priority-inversion incident and Sha/Rajkumar/Lehoczky 1990 (IEEE Trans. Computers, DOI 10.1109/12.57058) as non-BCI analogs. |
| Kernel/driver memory-safety — code execution / control-loop corruption | Gap 2 (K-03) | **QIF-T0163** | **Merged.** Kept separate from the exfiltration variant per the opposite (and correct) ATT&CK precedent — one vulnerability class serving genuinely different tactics stays split (cf. T1068/T1203/T1211/T1210). Tactic QIF-B.IN confirmed correct (genuinely breaches a boundary). Status THEORETICAL. |
| Kernel/driver memory-safety — cross-process neural-data exfiltration | Gap 2 (K-03) | **QIF-T0164** | **Merged.** Sibling to QIF-T0163, bidirectional cross-reference in place. Tactic QIF-D.HV confirmed correct. Status THEORETICAL, severity medium. |
| OTA firmware write interruption (power-loss partition corruption) | Gap 3 (QIF-IR-09) | **QIF-T0165** | **Merged, revised.** Downgraded from originally-proposed PLAUSIBLE to THEORETICAL — PLAUSIBLE is used exactly once across the whole catalog (QIF-T0100, six peer-reviewed sources), a materially higher bar than this candidate's evidence. Mechanism rewritten to be explicitly attacker-induced (names the vector: malicious charging accessory, PMIC fault injection, forced reset during the verify-then-commit window); the non-adversarial case lives in a separate note. Tactic corrected to QIF-P.DS. Cites NIST SP 800-193, the AOSP A/B update reference design, and Samuel et al. CCS 2010 (TUF). |
| Fleet-scale rollout/blast-radius risk | Gap 4 (QIF-IR-10) | *(enrichment, not a technique)* | **Filed as structured enrichment**, not a new technique — a `deployment_control_gap` field is now live on both QIF-T0043 and QIF-T0046, cross-referenced to QIF-IR-10 and to **QIF-T0047 "Mass BCI compromise (platform attack)"**, a real pre-existing entry that models a related-but-distinct risk (device monoculture vulnerability vs. absent staged rollout) missed on the first keyword-sample pass. Real-world analog: the July 19, 2024 CrowdStrike Falcon outage (~8.5M endpoints, single unstaged global push) — cited as a general-computing illustration, not a BCI-specific claim. |

**Citation integrity:** every sourced claim across all five was independently re-verified — Sha/Rajkumar/Lehoczky 1990, the 1997 Mars Pathfinder incident, NIST SP 800-193, Samuel et al. CCS 2010, the July 2024 CrowdStrike outage, Szekeres et al. "SoK: Eternal War in Memory" 2013, four MITRE CWE entries, MITRE ATT&CK T1495 — all confirmed real and accurately characterized. No fabrication or BCI-incident overclaiming found anywhere in the chain.

**Merge mechanism:** written directly into `datalake/qtara-registrar.json`, not via `populate-tara.py` or `enrich-skeletons.py` — both were found unsafe/superseded for this purpose during the same session (see the standalone incident note below). `dual_use` correctly nested under `tara.dual_use`; no ad-hoc field names carried into the live JSON.

### VII.2 Tactic Check and NISS Vectors — Verified Against Live Merge

**Tactic correction.** Two of the four candidates were initially misclassified — generators were shown only 5 of the catalog's 16 real tactics. QIF-P.DS's actual definition explicitly includes "denying BCI service," a materially better fit than QIF-B.IN's "gaining initial access" framing for techniques that never breach anything, only deny service:
- **Control-thread starvation** and **OTA write interruption** → moved from QIF-B.IN to **QIF-P.DS**, alongside their true siblings QIF-T0029/T0031.
- **Memory-safety — execution** stays QIF-B.IN (genuinely breaches a boundary). **Memory-safety — exfiltration** stays QIF-D.HV (already correct).

**NISS vectors — computed and verified.** Using the real formula (`NISS = Σ(w_i·M_i) / Σw_i`, weights BI=1.0/CR=0.5/CD=0.5/CV=1.0/RV=1.0/NP=1.0) and calibrated against five real entries (T0029, T0031, T0043, T0046, T0047):

| Live ID | Tactic | Vector | Score | NISS Severity | PINS |
|---|---|---|---|---|---|
| QIF-T0162 (starvation) | QIF-P.DS | NISS:1.1/BI:N/CR:N/CD:L/CV:N/RV:F/NP:N | 0.4 | low | false |
| QIF-T0163 (mem-safety exec) | QIF-B.IN | NISS:1.1/BI:H/CR:N/CD:H/CV:N/RV:T/NP:N | 2.7 | low | **true** |
| QIF-T0164 (mem-safety exfil) | QIF-D.HV | NISS:1.1/BI:N/CR:H/CD:N/CV:I/RV:F/NP:N | 2.7 | low | false |
| QIF-T0165 (OTA write interrupt) | QIF-P.DS | NISS:1.1/BI:L/CR:N/CD:H/CV:P/RV:P/NP:N | 3.4 | low | false |

QIF-T0163 is the only one of the four that trips PINS (Potential Impact to Neural Safety), because corrupted control-loop state has a direct path to dangerous physical actuation — the starvation candidate only denies function, it doesn't corrupt it.

**Independent verification:** `recalculate-niss.py` — the canonical, live scoring script — reported **"Changed: 0"** against these hand-computed vectors once merged. That's the by-hand math confirmed correct by the actual implementation, not just self-consistent.

**On niss.severity vs. top-level severity:** all four land on `niss.severity: low` despite higher drafted top-level `severity`. Checked against five real calibration entries and confirmed this is consistent house style (QIF-T0001, T0029, T0043, T0046 all show the same pattern) — top-level severity reflects broader engineering/safety judgment; `niss.score` is deliberately scoped to biological/cognitive impact only. Not an inconsistency to fix.

---

## The `populate-tara.py` Incident (2026-07-26) — Full Account

Worth keeping in this draft as a standing caution, since it's exactly the kind of mistake a future "just run the documented workflow" attempt would repeat.

1. **What happened.** `tara-threat/README.md` documented a workflow — edit `config.py`, run `populate-tara.py`, run `recalculate-niss.py` — that turned out to be stale. `qif-lab/` (where `config.py` lives) is archived under `_archive/`; the real generation scripts don't reference it. `populate-tara.py`'s own `REGISTRY_PATH` was additionally broken (pointed at a `datalake/shared/` directory that doesn't exist).
2. **The fix that wasn't enough.** Fixing the path alone made the script *runnable* but not *safe*. Its internal hardcoded reference dict only covered 71 of the then-161 techniques and predated the richer governance/engineering/dsm5 schema. Running it regressed those 71 techniques' enrichment data — confirmed via `git diff --stat`: **-4,623 / +53 lines** on a run that touched no new content at all.
3. **Immediate recovery.** `git checkout -- datalake/qtara-registrar.json` fully reverted the file (nothing was staged or committed at the time). Spot-checked afterward to confirm the rich multi-field `.tara` blocks were intact, not just the raw byte count.
4. **Root-caused, not just patched.** Traced the real pipeline: `enrich-skeletons.py`, `enrich-regulatory.py`, `enrich-neurorights.py` are the actual current enrichment scripts, all correctly pathed, none touched by the incident. `populate-tara.py` was an obsolete first-generation script that should never have been run against the current catalog state. Its docstring now carries an explicit DEPRECATED / DO NOT RUN warning explaining exactly why, and `tara-threat/README.md`'s workflow section was corrected (original kept in a collapsed `<details>` block for history, not deleted).
5. **Separately found and fixed while auditing "will this break anything":** an unrelated, pre-existing `git stash` conflict in `src/data/external-news-cache.json` (invalid JSON, 12 conflict-marker lines) — a disposable news cache, resolved by keeping the newer/fuller snapshot and discarding the stale stashed side.
6. **The actual safe procedure for adding new techniques**, verified end-to-end and used for the QIF-T0162–T0165 merge above: hand-author the full technique object (there's no template-based shortcut — both deprecated and current scripts turned out to require hand-authored content, just in different files) directly in `datalake/qtara-registrar.json`, then run `recalculate-niss.py` → `backfill-taxonomy.py --dry-run` → `backfill-taxonomy.py` → `npm run health`.

---

## Site / Documentation Propagation (2026-07-26)

Registry grew 161 → 165 techniques. `npm run health` flagged every place the old count was hardcoded; fixed the ones that are clearly current-state, operationally-live references (not historical narrative):

- **Updated:** root `README.md`, `osi-of-mind/README.md`, `osi-of-mind/tara-threat/README.md`, `datalake/QIF-DATA-MAPPING.md`, `src/data/convergence-data.ts`.
- **Deliberately left alone:** `osi-of-mind/whitepapers/QIF-WHITEPAPER.md` and `QIF-WHITEPAPER-V8-DRAFT.md` — these mix current-state and historical-narrative references to "161" in the same document, *and* already carry other pre-existing stale numbers in the same sentences (e.g., "11 tactics across 7 domains" vs. the real 16/8) — a partial count fix would leave them more internally inconsistent, not less. Needs an editorial pass, not a find-replace. Also left alone: one dated changelog row in `QIF-TRUTH.md` correctly describing the registry's state on 2026-03-15 (historical fact, not a stale current-state claim).
- **Site build:** ran `npm run prebuild` to regenerate `src/site/data/*` (including the copied registrar, KQL tables, and parquet catalog) so the published site reflects the new techniques and the resolved staleness warnings from `npm run health`.

**Final verification:** `npm run health` — 10 checks passed, 0 failures, both times (before and after the site prebuild).

---

## Open Items Carried Forward

1. Two whitepaper drafts (`QIF-WHITEPAPER.md`, `QIF-WHITEPAPER-V8-DRAFT.md`) need an editorial pass to reconcile technique/tactic/domain counts throughout — not just the "161" occurrences, but the pre-existing "11 tactics / 7 domains" figures that don't match the real 16/8.
2. Corresponding edit to `NEUROSECURITY_POLICY_PROPOSAL.md` §5.1 to reflect the OLIR-over-Community-Profile correction from VI.5 — not yet made.
3. `tara-threat/README.md`'s corrected As-Code workflow is a documented known-safe state, not a properly designed process — flagged in the doc itself as needing an owner-authored rewrite.
4. Pre-existing, unrelated to this work: four already-staged-but-uncommitted changes in the repo index (`datalake/parquet/catalog.json`, `datalake/parquet/intel_feed.parquet`, `governance/DECISION-LOG.md`, `governance/TRANSPARENCY.md`) and one untracked backup file (`datalake/bci-landscape.json.bak.2026-04-29`) — noted for awareness, not touched.
5. Nothing in this entire body of work has been committed to git. That remains an explicit, separate decision.
