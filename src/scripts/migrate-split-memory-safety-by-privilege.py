#!/usr/bin/env python3
"""Split QIF-T0163 and QIF-T0164 on the privilege boundary (decision T0163-LAYER).

The problem, as recorded in `datalake/cve-coverage-gaps.json`
(`open_framework_decisions[].id == "T0163-LAYER"`):

    Both techniques are specified at the kernel/driver privilege layer, but most
    CVEs mapped to them are memory-safety bugs in userspace code on the signal
    path: EEG acquisition services, DICOM decoders and BLE host stacks. The
    mechanism matches; the stated privilege layer does not.

That decision's own `proposed_split` is implemented here: each technique keeps
the kernel/RTOS privilege domain, and a new sibling covers the unprivileged or
application-privileged parsing boundary, where a compromise yields execution in
that process only.

  QIF-T0163 (execute) -> keeps 11 CVEs; QIF-T0175 takes 11
  QIF-T0164 (read)    -> keeps  1 CVE;  QIF-T0176 takes  1

Classification rule
-------------------
A record is application-layer when the vulnerable code runs as an ordinary
process under an OS that isolates it: the Natus Xltek NeuroWorks clinical EEG
application, the RadiAnt viewer, the Orthanc server, and the vtk-dicom, DCMTK
and SimpleBLE host libraries.

It stays kernel/RTOS when the vulnerable code runs in the kernel or in an RTOS
with no user/kernel separation, so a compromise is total rather than confined:
the Zephyr, FreeRTOS, NimBLE and ThreadX stacks and drivers. ArduinoBLE is
counted here too -- it is a library, but Arduino sketches execute in a single
flat privilege domain, so there is no process for a compromise to be confined
to. That reading is recorded rather than left implicit, because it is the one
judgement call in the set.

NISS vectors are inherited from the parent techniques unchanged. NISS v1.1
scores physical signal disruption, which does not vary with the privilege
domain the faulty parser happens to run in; inventing different vectors for the
siblings would assert a measurement nobody took.

Not changed here: QIF-T0163 and QIF-T0164 both carry `status: THEORETICAL`
while holding verified CVEs, which is its own mislabel. Re-deriving status for
them and for the new siblings' kernel-side evidence is a separate evidence
review, and this script does not touch their status. See the derivation log.

Usage: python3 src/scripts/migrate-split-memory-safety-by-privilege.py [--dry-run]
"""

from __future__ import annotations

import copy
import json
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parents[2]
REGISTRAR = REPO / "datalake" / "qtara-registrar.json"
CVE_MAPPING = REPO / "datalake" / "cve-technique-mapping.json"

EXECUTE_PARENT = "QIF-T0163"
EXECUTE_CHILD = "QIF-T0175"
READ_PARENT = "QIF-T0164"
READ_CHILD = "QIF-T0176"

# Application-layer records to move off QIF-T0163.
EXECUTE_MOVES = [
    "CVE-2017-2853",
    "CVE-2017-2867",
    "CVE-2017-2868",
    "CVE-2017-2869",
    "CVE-2026-17264",
    "CVE-2026-22879",
    "CVE-2026-87020",
    "CVE-2026-5442",
    "CVE-2026-5443",
    "CVE-2026-10528",
    "CVE-2026-44634",
]

# Application-layer records to move off QIF-T0164.
READ_MOVES = ["CVE-2026-97059"]

NEW_TECHNIQUES = {
    EXECUTE_CHILD: {
        "clone_of": EXECUTE_PARENT,
        "attack": (
            "Application-layer memory-safety exploitation on the neural signal path "
            "for arbitrary code execution"
        ),
        # Four Talos-disclosed RCEs in Natus Xltek NeuroWorks, a clinical EEG
        # product, are direct public evidence for this technique as worded.
        "status": "CONFIRMED",
        "notes": (
            "Heap or stack memory-safety violation in an unprivileged or application-privileged "
            "parser on the neural or clinical signal path -- an EEG acquisition or review "
            "application, a DICOM decoder, or a host-side BLE library -- reached by a crafted "
            "recording file, study object or peripheral response, yielding attacker-controlled "
            "execution within that process. Distinguished from QIF-T0163 by privilege domain: "
            "the compromise is confined to the parsing process and its data, and does not by "
            "itself corrupt a closed-loop control routine. Exploitable code execution of this "
            "class is public for Natus Xltek NeuroWorks 8, a clinical EEG product "
            "(CVE-2017-2853, CVE-2017-2867, CVE-2017-2868, CVE-2017-2869)."
        ),
        "mechanism": (
            "Attacker-supplied input crosses an application parsing boundary on the signal path "
            "and triggers a spatial memory-safety violation in code running as an ordinary "
            "isolated process, giving the attacker control of that process rather than of the "
            "privileged domain."
        ),
    },
    READ_CHILD: {
        "clone_of": READ_PARENT,
        "attack": (
            "Application-layer memory-safety exploitation on the neural signal path "
            "for out-of-bounds neural-data read"
        ),
        # Its one application-layer CVE is a DICOM imaging library, not a
        # neural-data product, so the parent's THEORETICAL status is kept.
        "status": "THEORETICAL",
        "notes": (
            "Out-of-bounds read or over-read in an unprivileged or application-privileged parser "
            "on the neural or clinical signal path, disclosing adjacent heap contents that may "
            "include other patients' recordings or study metadata held by the same process. "
            "Distinguished from QIF-T0164 by privilege domain: the read primitive is confined to "
            "the parsing process's address space and does not cross an OS-enforced process "
            "boundary."
        ),
        "mechanism": (
            "A read-primitive memory-safety bug in an application-layer parser discloses memory "
            "adjacent to the attacker-supplied buffer within the same process, defeating "
            "intended separation between records handled by that process rather than between "
            "trust domains."
        ),
    },
}


def build_technique(parent: dict, spec: dict, new_id: str) -> dict:
    technique = copy.deepcopy(parent)
    technique["id"] = new_id
    technique["attack"] = spec["attack"]
    technique["status"] = spec["status"]
    technique["notes"] = spec["notes"]
    technique["tara"] = {**technique.get("tara", {}), "mechanism": spec["mechanism"]}
    technique["sources"] = list(parent.get("sources", []))
    technique["legacy_ids"] = []
    technique.pop("legacy_technique_id", None)
    technique["cross_references"] = {
        **{k: v for k, v in (parent.get("cross_references") or {}).items() if k != "cves"},
        "split_from": parent["id"],
        "split_decision": "T0163-LAYER (datalake/cve-coverage-gaps.json)",
    }
    technique["physics_feasibility"] = {
        "tier": "X",
        "tier_label": "no_physics_gate",
        "timeline": "none",
        "gate_reason": "Application-layer memory-safety exploitation; software-only",
        "constraint_system_ref": "QIF Derivation Log Entry 60",
        "analysis_date": "2026-10-07",
    }
    return technique


def remap(mappings: list[dict], cve_ids: list[str], old_id: str, new_id: str) -> list[str]:
    by_cve = {record["cve_id"]: record for record in mappings}
    changed = []
    for cve_id in cve_ids:
        record = by_cve.get(cve_id)
        if record is None:
            raise SystemExit(f"{cve_id} is not in the CVE mapping; aborting.")
        techniques = record["tara_techniques"]
        if old_id not in techniques:
            raise SystemExit(f"{cve_id} is not mapped to {old_id}; aborting.")
        record["tara_techniques"] = [new_id if t == old_id else t for t in techniques]
        changed.append(cve_id)
    return changed


def main() -> None:
    is_dry_run = "--dry-run" in sys.argv
    registrar = json.loads(REGISTRAR.read_text())
    mapping = json.loads(CVE_MAPPING.read_text())
    techniques = registrar["techniques"]
    by_id = {t["id"]: t for t in techniques}

    for new_id in NEW_TECHNIQUES:
        if new_id in by_id:
            raise SystemExit(f"{new_id} already exists; aborting.")

    added = []
    for new_id, spec in NEW_TECHNIQUES.items():
        parent = by_id.get(spec["clone_of"])
        if parent is None:
            raise SystemExit(f"{spec['clone_of']} is not in the registrar; aborting.")
        techniques.append(build_technique(parent, spec, new_id))
        added.append(f"{new_id} ({spec['status']}) split from {spec['clone_of']}")

    moved_execute = remap(mapping["mappings"], EXECUTE_MOVES, EXECUTE_PARENT, EXECUTE_CHILD)
    moved_read = remap(mapping["mappings"], READ_MOVES, READ_PARENT, READ_CHILD)

    def count_for(technique_id: str) -> int:
        return sum(1 for r in mapping["mappings"] if technique_id in r["tara_techniques"])

    print("[split-privilege] added:")
    for line in added:
        print(f"  {line}")
    print(f"[split-privilege] moved {len(moved_execute)} record(s) {EXECUTE_PARENT} -> {EXECUTE_CHILD}")
    print(f"[split-privilege] moved {len(moved_read)} record(s) {READ_PARENT} -> {READ_CHILD}")
    for technique_id in (EXECUTE_PARENT, EXECUTE_CHILD, READ_PARENT, READ_CHILD):
        print(f"  {technique_id}: {count_for(technique_id)} CVE(s)")
    print(f"[split-privilege] registrar now holds {len(techniques)} techniques.")

    if is_dry_run:
        print("[split-privilege] --dry-run: nothing written.")
        return

    REGISTRAR.write_text(json.dumps(registrar, indent=2, ensure_ascii=False) + "\n")
    CVE_MAPPING.write_text(json.dumps(mapping, indent=2, ensure_ascii=False) + "\n")
    print("[split-privilege] wrote the registrar and the CVE mapping.")
    print("[split-privilege] now run: npm run registrar:stats && node src/scripts/recompute-cve-coverage.mjs")


if __name__ == "__main__":
    main()
