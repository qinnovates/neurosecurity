#!/usr/bin/env python3
"""Rewrite 26 imperative technique descriptions and rename 3 techniques.

Basis: the 2026-10 framing decision (items M2 and M3), an AI panel's
recommendation pending Kevin's acceptance.

Descriptions (M2)
-----------------
26 `notes` fields opened with a second-person imperative ("Inject crafted
signals..."), which reads as instructions. Each opening is rewritten
descriptively: "An adversary may..." for CONFIRMED, DEMONSTRATED and EMERGING
entries, "If feasible, an adversary could..." for THEORETICAL, PLAUSIBLE and
SPECULATIVE ones. The rest of each note is kept, apart from the listed
in-sentence fixes. Each note then ends with the technique's own
`tara.engineering.detection` text, or "Mitigation guidance not yet drafted."
when it has none. No detection or mitigation text is invented here.

Renames (M3)
------------
`attack` and `technique` both carry the display name (`technique` is the v2
field, `attack` its deprecated alias), so both change. The previous name is
kept in the new `legacy_names` field so old names still resolve, and
`rename_note` carries a visible note where the decision asks for one.

Usage: python3 src/scripts/migrate-descriptive-notes-and-renames.py [--dry-run]
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parents[2]
REGISTRAR = REPO / "datalake" / "qtara-registrar.json"
SDK_COPY = REPO / "datalake" / "qtara" / "src" / "qtara" / "data" / "qtara-registrar.json"

CHANGE_DATE = "2026-10-14"
CHANGELOG_VERSION = "1.10"
MAY_STATUSES = {"CONFIRMED", "DEMONSTRATED", "EMERGING"}
COULD_STATUSES = {"THEORETICAL", "PLAUSIBLE", "SPECULATIVE"}
NO_GUIDANCE_SENTENCE = "Mitigation guidance not yet drafted."

# id -> list of (exact old text, new text). The first pair rewrites the opening;
# its new text must start with the stem the entry's status requires.
NOTE_REWRITES: dict[str, list[tuple[str, str]]] = {
    "QIF-T0001": [("Inject crafted signals mimicking legitimate brain activity at electrode-tissue boundary.",
                   "An adversary may inject crafted signals that mimic legitimate brain activity at the electrode-tissue boundary.")],
    "QIF-T0004": [("Intercept and modify signals at I0 boundary or BCI telemetry.",
                   "An adversary may intercept and modify signals at the I0 boundary or in BCI telemetry.")],
    "QIF-T0005": [("Exploit ion channel quantum tunneling to inject false synaptic events.",
                   "If feasible, an adversary could exploit ion channel quantum tunneling to inject false synaptic events.")],
    "QIF-T0007": [("Exploit weaknesses in BCI data protocols to inject commands",
                   "An adversary may exploit weaknesses in BCI data protocols to inject commands")],
    "QIF-T0008": [("Intercept and modify motor commands or cognitive instructions in transit through the BCI system.",
                   "If feasible, an adversary could intercept and modify motor commands or cognitive instructions in transit through the BCI system.")],
    "QIF-T0009": [("Inject RF signals calibrated to neural frequencies through BCI's own antenna or nearby transmitter.",
                   "An adversary may inject RF signals calibrated to neural frequencies through the BCI's own antenna or a nearby transmitter.")],
    "QIF-T0018": [("Craft minimal perturbations that pass through BCI analog/digital filters but flip decoder output.",
                   "An adversary may craft minimal perturbations that pass through BCI analog/digital filters but flip decoder output.")],
    "QIF-T0022": [("Manipulate neurofeedback display or stimulation parameters in closed-loop BCIs.",
                   "An adversary may manipulate neurofeedback displays or stimulation parameters in closed-loop BCIs.")],
    "QIF-T0026": [("Flood neural tissue with maximum stimulation across all available electrodes simultaneously.",
                   "If feasible, an adversary could drive maximum stimulation across all available electrodes simultaneously.")],
    "QIF-T0034": [("Inject false information into working memory circuits via targeted hippocampal/PFC stimulation.",
                   "If feasible, an adversary could introduce false information into working memory circuits via targeted hippocampal/PFC stimulation.")],
    "QIF-T0037": [("Manipulate sense of agency -- user believes externally triggered actions are self-initiated, or vice versa.",
                   "If feasible, an adversary could manipulate the sense of agency, so that the user believes externally triggered actions are self-initiated, or vice versa.")],
    "QIF-T0044": [("Compromise cloud services processing neural data",
                   "An adversary may compromise cloud services that process neural data")],
    "QIF-T0045": [("Record encrypted BCI traffic now, decrypt when quantum computers arrive (2030-2035).",
                   "An adversary may record encrypted BCI traffic now and decrypt it if a cryptographically relevant quantum computer becomes available (projected 2030-2035).")],
    "QIF-T0046": [("Compromise OTA firmware update mechanism to push malicious updates to implanted BCIs.",
                   "An adversary may compromise the OTA firmware update mechanism to push malicious updates to implanted BCIs.")],
    "QIF-T0049": [("Exploit weak or absent authentication on BCI wireless interfaces.",
                   "An adversary may exploit weak or absent authentication on BCI wireless interfaces.")],
    # "reveal" overstated what signals show (guardrail G2, reverse inference).
    "QIF-T0053": [("Record patterns that reveal attention, emotion, fatigue, or other cognitive states without user awareness.",
                   "An adversary may record signal patterns associated with attention, emotion, fatigue or other cognitive states without user awareness.")],
    "QIF-T0059": [("Embed recurring attack patterns that survive system resets",
                   "If feasible, an adversary could embed recurring attack patterns that survive system resets")],
    "QIF-T0061": [("Craft malicious signals that maintain legitimate coherence scores (Cs) to bypass QI metric.",
                   "If feasible, an adversary could craft malicious signals that maintain legitimate coherence scores (Cs) to bypass the QI metric.")],
    "QIF-T0064": [("Flood user with BCI-mediated permission requests",
                   "An adversary may flood a user with BCI-mediated permission requests")],
    "QIF-T0066": [("Manipulate BCI parameters along adiabatic paths in neural phase space,",
                   "If feasible, an adversary could manipulate BCI parameters along adiabatic paths in neural phase space,")],
    "QIF-T0067": [("Replay recorded or GAN-synthesized neural signals that reproduce",
                   "An adversary may replay recorded or GAN-synthesized neural signals that reproduce")],
    "QIF-T0071": [
        ("Exploit the re-enrollment or adaptive baseline update window in BCI authentication systems.",
         "An adversary may exploit the re-enrollment or adaptive baseline update window in BCI authentication systems."),
        ("inject adversarial signals during the enrollment period to corrupt the stored baseline.",
         "adversarial signals injected during the enrollment period can corrupt the stored baseline."),
        # QIF's Biological TLS is proposed and unvalidated; it cannot be said to eliminate anything.
        ("the entire attack surface is eliminated.",
         "this attack surface would be removed (proposed, unvalidated)."),
    ],
    "QIF-T0103": [
        ("Exploit the SSVEP pathway by injecting imperceptible display flicker",
         "An adversary may exploit the SSVEP pathway by injecting imperceptible display flicker"),
        ("Proven: Ming et al. 2023 demonstrated", "Ming et al. 2023 demonstrated"),
        ("Attack scenarios: (1) inject false BCI commands by matching SSVEP control frequencies, (2) jam BCI operation with broadband visual noise, (3) exfiltrate neural state via stimulus-response probing, (4) trigger photosensitive seizures at epileptogenic frequencies.",
         "Scenarios: (1) false BCI commands matching SSVEP control frequencies, (2) jamming of BCI operation with broadband visual noise, (3) inference of neural state through stimulus-response probing, (4) photosensitive seizures at epileptogenic frequencies."),
    ],
    "QIF-T0107": [("Replay previously valid neural signal nonces to bypass freshness/replay protections.",
                   "If feasible, an adversary could replay previously valid neural signal nonces to bypass freshness/replay protections.")],
    "QIF-T0109": [("Target the data alignment step used by adversarial defenses (ABAT, A3E).",
                   "If feasible, an adversary could target the data alignment step used by adversarial defenses (ABAT, A3E).")],
    "QIF-T0171": [
        ("Compromise of the infrastructure that stores, retrains, serves or configures a deployed BCI decoder,",
         "If feasible, an adversary could compromise the infrastructure that stores, retrains, serves or configures a deployed BCI decoder,"),
        ("change device behaviour with firmware attestation intact", "change device behavior with firmware attestation intact"),
        ("(poisoning of calibration or re-enrolment data)", "(poisoning of calibration or re-enrollment data)"),
        ("user adaptation to the substituted behaviour", "user adaptation to the substituted behavior"),
    ],
}

DESCRIPTIVE_NOTE = "Renamed 2026-10 for descriptive clarity; no technique removed."

# id -> (exact current name, new name, rename_note). The decided QIF-T0065 rename is
# held: its note asserts what no cited source shows, which is owner check 12, and the
# decided name says "BCI-linked" while the entry's notes say no BCI is required.
RENAMES: dict[str, tuple[str, str, str]] = {
    # Decision text says "stimulation signal"; this entry's own notes describe the
    # BCI's telemetry signal (MICS 402 MHz), so "telemetry" is used. Flagged for Kevin.
    "QIF-T0011": ("Intermodulation (BCI signal weaponized)",
                  "Intermodulation via BCI telemetry signal", DESCRIPTIVE_NOTE),
    "QIF-T0046": ("OTA firmware weaponization",
                  "Malicious over-the-air firmware update", DESCRIPTIVE_NOTE),
    "QIF-T0099": ("Consumer-sensor-to-BCI kill chain escalation (pre-implant reconnaissance and cognitive priming via consumer devices)",
                  "Consumer-sensor-to-BCI escalation path (projected)", DESCRIPTIVE_NOTE),
}

SCHEMA_EXTENSIONS = {
    "legacy_names": {
        "added": CHANGE_DATE,
        "description": "Earlier display names of a technique, kept as aliases after a rename so old names still resolve in search and queries. The canonical QIF-Txxxx id never changes.",
        "format": {"legacy_names": "Array of previous `technique`/`attack` names, oldest first; absent or empty if never renamed"},
    },
    "rename_note": {
        "added": CHANGE_DATE,
        "description": "Short public note explaining why a technique was renamed, shown on the technique page.",
        "format": {"rename_note": "One or two sentences, or absent"},
    },
}


def stem_for(status: str) -> str:
    if status in MAY_STATUSES:
        return "An adversary may "
    if status in COULD_STATUSES:
        return "If feasible, an adversary could "
    raise ValueError(f"unknown status {status!r}")


DETECTION_SPELLING = {"QIF-T0171": [("Model artefact attestation", "Model artifact attestation"),
                                     ("behavioural drift monitoring", "behavioral drift monitoring")]}


def americanize_detection(technique: dict) -> None:
    engineering = (technique.get("tara") or {}).get("engineering") or {}
    for old, new in DETECTION_SPELLING.get(technique["id"], []):
        if engineering.get("detection", "").count(old) != 1:
            raise ValueError(f"{technique['id']}: detection text lacks {old!r}")
        engineering["detection"] = engineering["detection"].replace(old, new)


def closing_sentence(technique: dict) -> str:
    detection = ((technique.get("tara") or {}).get("engineering") or {}).get("detection") or ""
    detection = detection.strip()
    return f"Detection: {detection}." if detection else NO_GUIDANCE_SENTENCE


def rewrite_notes(technique: dict) -> str:
    notes = technique["notes"]
    rewrites = NOTE_REWRITES[technique["id"]]
    opening_new = rewrites[0][1]
    if not opening_new.startswith(stem_for(technique["status"])):
        raise ValueError(f"{technique['id']}: opening does not use the {technique['status']} stem")
    for old, new in rewrites:
        if notes.count(old) != 1:
            raise ValueError(f"{technique['id']}: expected exactly one occurrence of {old[:50]!r}")
        notes = notes.replace(old, new)
    return f"{notes.rstrip()} {closing_sentence(technique)}"


def apply_rename(technique: dict) -> None:
    old_name, new_name, note = RENAMES[technique["id"]]
    for field in ("technique", "attack"):
        if technique.get(field) != old_name:
            raise ValueError(f"{technique['id']}: {field} is {technique.get(field)!r}, expected {old_name!r}")
        technique[field] = new_name
    technique["legacy_names"] = [*technique.get("legacy_names", []), old_name]
    technique["rename_note"] = note


def changelog_entry() -> dict:
    return {
        "version": CHANGELOG_VERSION,
        "date": CHANGE_DATE,
        "title": "Descriptive technique notes and three renames",
        "summary": ("Renamed for descriptive clarity; no technique removed. 26 technique notes that opened as "
                    "instructions now describe the technique ('An adversary may...' or 'If feasible, an adversary "
                    "could...', by evidence status) and end with the entry's detection guidance. Three techniques "
                    "renamed; earlier names kept in the new legacy_names field. Basis: 2026-10 framing decision "
                    "(AI panel recommendation, pending owner acceptance)."),
        "added": [],
        "changed": [
            *(f"{tid} renamed: '{old}' -> '{new}'" for tid, (old, new, _) in RENAMES.items()),
            f"notes rewritten descriptively for {len(NOTE_REWRITES)} techniques: {', '.join(NOTE_REWRITES)}",
            "schema: techniques[].legacy_names and techniques[].rename_note added",
            "QIF-T0171 detection text: US spelling (artifact, behavioral)",
        ],
    }


def main() -> int:
    dry_run = "--dry-run" in sys.argv
    reg = json.loads(REGISTRAR.read_text())
    by_id = {t["id"]: t for t in reg["techniques"]}

    missing = [tid for tid in [*NOTE_REWRITES, *RENAMES] if tid not in by_id]
    if missing:
        print(f"ERROR: ids not in registrar: {missing}", file=sys.stderr)
        return 1
    if any(c.get("version") == CHANGELOG_VERSION for c in reg["changelog"]):
        print(f"ERROR: changelog {CHANGELOG_VERSION} already present; migration already applied?", file=sys.stderr)
        return 1

    try:
        for tid in NOTE_REWRITES:
            americanize_detection(by_id[tid])
            by_id[tid]["notes"] = rewrite_notes(by_id[tid])
            print(f"  notes {tid} [{by_id[tid]['status']}] {by_id[tid]['notes'][:90]}")
        for tid in RENAMES:
            apply_rename(by_id[tid])
            print(f"  rename {tid}: {by_id[tid]['technique']}")
    except ValueError as error:
        print(f"ERROR: {error}", file=sys.stderr)
        return 1

    reg["schema_extensions"].update(SCHEMA_EXTENSIONS)
    reg["changelog"].append(changelog_entry())

    if dry_run:
        print("\n--dry-run: nothing written")
        return 0

    payload = json.dumps(reg, indent=2, ensure_ascii=False) + "\n"
    REGISTRAR.write_text(payload)
    SDK_COPY.write_text(payload)
    print(f"\nwrote {REGISTRAR.relative_to(REPO)}")
    print(f"wrote {SDK_COPY.relative_to(REPO)} (SDK copy, registrar.md step 9)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
