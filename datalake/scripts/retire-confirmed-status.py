#!/usr/bin/env python3
"""Retire the CONFIRMED status value and reclassify its 27 techniques.

Accepted 2026-10-16. The status definitions drafted in
tara_spec.status_definitions_proposed were reviewed and accepted, including
the proposal to retire CONFIRMED.

Why it is retired: the audit in audit-confirmed-evidence.py found the value
spanned four unrelated kinds of evidence, and it read as stronger than
DEMONSTRATED while asserting less -- 11 of its 27 entries showed no attack at
all. Under the accepted definitions, status answers one question only: how far
the technique has been shown AS AN ATTACK.

Each record keeps status_prior and status_change_reason, so the move is
auditable and reversible.

Usage:
    python3 retire-confirmed-status.py --dry-run
    python3 retire-confirmed-status.py
"""

from __future__ import annotations

import argparse
import json
from collections import Counter
from pathlib import Path

REGISTRY = Path(__file__).resolve().parents[2] / "datalake" / "qtara-registrar.json"
ACCEPTED_ON = "2026-10-16"

# From datalake/scripts/audit-confirmed-evidence.py, applied through the
# accepted definitions.
#   demonstrated_attack -> DEMONSTRATED  (an attack was executed and reported)
#   mechanism           -> THEORETICAL   (mechanism established, no attack shown)
#   analysis            -> THEORETICAL   (position/risk paper, no attack shown)
#   regulatory          -> THEORETICAL   (a law or roadmap is not an attack)
#   correlational       -> PLAUSIBLE     (indirect mechanism, attack reasoned only)
RECLASSIFY = {
    "QIF-T0072": ("DEMONSTRATED", "Guri 2017 SPEAKE(a)R and Guri 2018 MOSQUITO execute the attack on real hardware"),
    "QIF-T0082": ("DEMONSTRATED", "Mavroudis 2017 and Arp 2017 demonstrate ultrasonic cross-device tracking"),
    "QIF-T0083": ("DEMONSTRATED", "Zhuang 2009, Compagno 2017 and Harrison 2023 demonstrate acoustic keystroke recovery"),
    "QIF-T0087": ("DEMONSTRATED", "Cai & Chen 2011, Owusu 2012 and Miluzzo 2012 demonstrate accelerometer keystroke inference"),
    "QIF-T0088": ("DEMONSTRATED", "Muaaz & Mayrhofer 2017 and Ngo 2014 demonstrate IMU gait identification"),

    "QIF-T0012": ("THEORETICAL", "Frey 1962 and Lin 1978 establish the microwave auditory effect; no attack on an interface is shown"),
    "QIF-T0136": ("THEORETICAL", "photobiomodulation efficacy studies; mechanism only"),
    "QIF-T0140": ("THEORETICAL", "Cayce 2011 and Pan 2023 establish infrared neural stimulation as a method; mechanism only"),
    "QIF-T0142": ("THEORETICAL", "Kujirai 1993 is a neurophysiology measurement protocol; mechanism only"),
    "QIF-T0143": ("THEORETICAL", "Valls-Sole 1992 and McDonnell 2006 establish LICI as a protocol; mechanism only"),
    "QIF-T0144": ("THEORETICAL", "Huang 2005 and Stagg 2009 establish cTBS and its GABAergic effect; mechanism only"),
    "QIF-T0145": ("THEORETICAL", "Stagg 2009 measures tDCS-induced GABA change; mechanism only"),
    "QIF-T0149": ("THEORETICAL", "Bowles 2022 and Nichols 2011 on VNS cholinergic signalling; mechanism only"),
    "QIF-T0154": ("THEORETICAL", "Dorr & Debonnel 2006 on the VNS serotonin pathway; mechanism only"),
    "QIF-T0156": ("THEORETICAL", "Wu 2017 and Zhao 2019 on electroacupuncture and raphe serotonin; mechanism only"),
    "QIF-T0157": ("THEORETICAL", "Young 2013 and van Donkelaar 2011 on tryptophan depletion as a research method; mechanism only"),

    "QIF-T0001": ("THEORETICAL", "Kohno 2009 is a position paper; Bonaci 2015 demonstrates P300 probing, not signal injection"),
    "QIF-T0003": ("THEORETICAL", "Kohno 2009, Landau 2020 and Schroder 2025 are analysis, not demonstration"),
    "QIF-T0042": ("THEORETICAL", "no BLE/RF side-channel demonstration against a BCI is cited"),
    "QIF-T0043": ("THEORETICAL", "Schroder 2025 is a risk analysis; no firmware backdoor demonstrated"),
    "QIF-T0044": ("THEORETICAL", "Schroder 2025 alone; no demonstration"),
    "QIF-T0049": ("THEORETICAL", "Schroder 2025 alone; no demonstration"),
    "QIF-T0053": ("THEORETICAL", "Landau 2020 alone; analysis"),
    "QIF-T0057": ("THEORETICAL", "Schroder 2025 alone; no demonstration"),

    "QIF-T0045": ("THEORETICAL", "Gidney 2025 is a quantum resource estimate; harvest-now-decrypt-later is a threat model"),
    "QIF-T0051": ("THEORETICAL", "Landau 2020 plus GDPR Article 9; a legal instrument is not evidence of an attack"),

    "QIF-T0065": ("PLAUSIBLE", "social-media population studies are correlational; the mechanism is indirect and no induction is demonstrated"),
}


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    registry = json.loads(REGISTRY.read_text())
    techniques = registry["techniques"]

    confirmed = {t["id"] for t in techniques if t["status"] == "CONFIRMED"}
    if not confirmed:
        print("No CONFIRMED techniques remain; nothing to do.")
        return 0
    if confirmed != set(RECLASSIFY):
        raise SystemExit(
            f"mapping is out of date.\n  unmapped: {sorted(confirmed - set(RECLASSIFY))}"
            f"\n  no longer CONFIRMED: {sorted(set(RECLASSIFY) - confirmed)}"
        )

    for technique in techniques:
        if technique["id"] not in RECLASSIFY:
            continue
        new_status, reason = RECLASSIFY[technique["id"]]
        technique["status_prior"] = technique["status"]
        technique["status"] = new_status
        technique["status_change_reason"] = (
            f"CONFIRMED retired {ACCEPTED_ON}; reclassified under "
            f"tara_spec.status_definitions. {reason}."
        )

    counts = Counter(t["status"] for t in techniques)
    registry["statistics"]["by_status"] = {
        key: counts[key] for key in
        ("CONFIRMED", "EMERGING", "DEMONSTRATED", "THEORETICAL", "PLAUSIBLE", "SPECULATIVE")
        if counts[key]
    }

    spec = registry["tara_spec"]
    proposal = spec.pop("status_definitions_proposed", None)
    if proposal is not None:
        proposal["adoption_status"] = (
            f"ACCEPTED {ACCEPTED_ON}. The 27 CONFIRMED techniques were reclassified by "
            "datalake/scripts/retire-confirmed-status.py; each carries status_prior and "
            "status_change_reason. CONFIRMED is retired and must not be reintroduced."
        )
        proposal.pop("if_accepted", None)
        values = proposal["values"]
        values["CONFIRMED"] = (
            f"RETIRED {ACCEPTED_ON}. Spanned four unrelated kinds of evidence and read as "
            "stronger than DEMONSTRATED while asserting less. Its entries were redistributed "
            "to DEMONSTRATED, THEORETICAL and PLAUSIBLE. Do not reintroduce this value."
        )
        rebuilt = {}
        for key, value in spec.items():
            rebuilt[key] = value
            if key == "evidence_levels":
                rebuilt["status_definitions"] = proposal
        registry["tara_spec"] = rebuilt

    print("by_status after reclassification:")
    for key, value in registry["statistics"]["by_status"].items():
        print(f"  {key:<14} {value}")

    if args.dry_run:
        print("\n[dry run] nothing written")
        return 0

    REGISTRY.write_text(json.dumps(registry, indent=2, ensure_ascii=False) + "\n")
    print(f"\nwrote {REGISTRY.name}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
