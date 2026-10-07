#!/usr/bin/env python3
"""Make `physics_feasibility.tier` agree with `tier_label`, and fill the 13 gaps.

Defect 1 -- tier/label disagreement
-----------------------------------
`tier: 0` means `feasible_now` for 99 techniques, and the 18 techniques with no
physics gate use the sentinel `tier: "X"` with `timeline: "none"`. Five
techniques analysed on 2026-03-14 instead carry `tier: 0` *with*
`tier_label: "no_physics_gate"` and `timeline: "now"`:

  QIF-T0104 Neural spoofing            QIF-T0107 Neural nonce replay
  QIF-T0105 Neural sybil               QIF-T0109 Data alignment exploitation
  QIF-T0106 Neural sinkhole

Their own `gate_reason` says "physics does not constrain", so the label is the
intended reading and the numeric tier is the error. Left as `0`, a reader or
query filtering `tier == 0` counts them as "physics permits this today" --
a stronger claim than "physics has no say here". They move to the `X` sentinel.

Defect 2 -- missing blocks
--------------------------
13 techniques have no `physics_feasibility` block at all (QIF-T0162 to T0165 and
the nine 2026-10 refresh entries QIF-T0166 to T0174), so they are absent from
every tier rollup. Twelve are software, protocol, kernel or ML-pipeline attacks
and take the `X` sentinel on the same grounds as the existing 18.

QIF-T0168 is the exception and is NOT `no_physics_gate`: capturing pupil-linked
micro-vibration through a VR headset's inertial sensors is a physical side
channel whose feasibility rests on real IMU sensitivity, and it is already
DEMONSTRATED on commodity hardware. It takes `tier: 0` / `feasible_now`.

Nothing here changes a technique's status, severity or NISS score.

Usage: python3 src/scripts/migrate-physics-tier-integrity.py [--dry-run]
"""

from __future__ import annotations

import json
import sys
from collections import Counter
from pathlib import Path

REPO = Path(__file__).resolve().parents[2]
REGISTRAR = REPO / "datalake" / "qtara-registrar.json"
SDK_COPY = REPO / "datalake" / "qtara" / "src" / "qtara" / "data" / "qtara-registrar.json"

CONSTRAINT_REF = "QIF Derivation Log Entry 60"
ANALYSIS_DATE = "2026-10-07"

NO_GATE_SENTINEL = "X"
NO_GATE_LABEL = "no_physics_gate"
NO_GATE_TIMELINE = "none"

# Techniques whose tier contradicts their own label. Value is the tier we expect
# to find, so a changed registrar aborts the migration instead of silently
# rewriting something else.
TIER_CORRECTIONS = {
    "QIF-T0104": 0,
    "QIF-T0105": 0,
    "QIF-T0106": 0,
    "QIF-T0107": 0,
    "QIF-T0109": 0,
}

# Techniques with no block, and the gate_reason each one gets.
MISSING_NO_GATE = {
    "QIF-T0162": "Scheduler and synchronization abuse; software-only",
    "QIF-T0163": "Kernel/driver memory-safety exploitation; software-only",
    "QIF-T0164": "Kernel/driver memory-safety exploitation; software-only",
    "QIF-T0165": "Firmware update-process attack; physics does not constrain",
    "QIF-T0166": "Inferential re-analysis of retained recordings; no acquisition step to gate",
    "QIF-T0167": "Agent action-routing manipulation; software-only",
    "QIF-T0169": "Signal-processing evasion against a decoder; software-only",
    "QIF-T0170": "Query-based model extraction; software-only",
    "QIF-T0171": "ML pipeline and registry compromise; software-only",
    "QIF-T0172": "Adversarial transfer computed offline against a public encoder; software-only",
    "QIF-T0173": "Attribute inference from released embeddings; software-only",
    "QIF-T0174": "Federated update manipulation; software-only",
}

# The one physical side channel among the 13.
MISSING_PHYSICAL = {
    "QIF-T0168": {
        "tier": 0,
        "tier_label": "feasible_now",
        "timeline": "now",
        "gate_reason": (
            "Inertial sensors in commodity VR headsets are sensitive enough to capture "
            "pupil-linked micro-vibration; demonstrated on shipping hardware (Ni et al. 2026)"
        ),
    },
}


def no_gate_block(gate_reason: str) -> dict:
    return {
        "tier": NO_GATE_SENTINEL,
        "tier_label": NO_GATE_LABEL,
        "timeline": NO_GATE_TIMELINE,
        "gate_reason": gate_reason,
        "constraint_system_ref": CONSTRAINT_REF,
        "analysis_date": ANALYSIS_DATE,
    }


def apply(techniques: list[dict]) -> list[str]:
    by_id = {technique["id"]: technique for technique in techniques}
    changes: list[str] = []

    for technique_id, expected_tier in TIER_CORRECTIONS.items():
        technique = by_id.get(technique_id)
        if technique is None:
            raise SystemExit(f"{technique_id} is not in the registrar; aborting.")
        physics = technique.get("physics_feasibility")
        if physics is None:
            raise SystemExit(f"{technique_id} has no physics_feasibility block; aborting.")
        if physics["tier"] != expected_tier or physics["tier_label"] != NO_GATE_LABEL:
            raise SystemExit(
                f"{technique_id} is tier={physics['tier']!r} label={physics['tier_label']!r}, "
                f"not the tier={expected_tier!r}/{NO_GATE_LABEL} this migration was written for; aborting."
            )
        physics["tier"] = NO_GATE_SENTINEL
        physics["timeline"] = NO_GATE_TIMELINE
        physics["analysis_date"] = ANALYSIS_DATE
        changes.append(f"{technique_id}: tier {expected_tier} -> {NO_GATE_SENTINEL}, timeline -> {NO_GATE_TIMELINE}")

    for technique_id, gate_reason in MISSING_NO_GATE.items():
        technique = by_id.get(technique_id)
        if technique is None:
            raise SystemExit(f"{technique_id} is not in the registrar; aborting.")
        if technique.get("physics_feasibility") is not None:
            raise SystemExit(f"{technique_id} already has a physics_feasibility block; aborting.")
        technique["physics_feasibility"] = no_gate_block(gate_reason)
        changes.append(f"{technique_id}: added {NO_GATE_LABEL} block")

    for technique_id, block in MISSING_PHYSICAL.items():
        technique = by_id.get(technique_id)
        if technique is None:
            raise SystemExit(f"{technique_id} is not in the registrar; aborting.")
        if technique.get("physics_feasibility") is not None:
            raise SystemExit(f"{technique_id} already has a physics_feasibility block; aborting.")
        technique["physics_feasibility"] = {
            **block,
            "constraint_system_ref": CONSTRAINT_REF,
            "analysis_date": ANALYSIS_DATE,
        }
        changes.append(f"{technique_id}: added {block['tier_label']} block")

    return changes


def assert_consistent(techniques: list[dict]) -> None:
    """Every technique must have a block, and tier and label must agree."""
    missing = [t["id"] for t in techniques if not t.get("physics_feasibility")]
    if missing:
        raise SystemExit(f"{len(missing)} technique(s) still have no physics_feasibility block: {missing}")
    disagreements = [
        t["id"]
        for t in techniques
        if (t["physics_feasibility"]["tier"] == NO_GATE_SENTINEL)
        != (t["physics_feasibility"]["tier_label"] == NO_GATE_LABEL)
    ]
    if disagreements:
        raise SystemExit(f"tier and tier_label still disagree for: {disagreements}")


def main() -> None:
    is_dry_run = "--dry-run" in sys.argv
    registrar = json.loads(REGISTRAR.read_text())
    techniques = registrar["techniques"]

    changes = apply(techniques)
    assert_consistent(techniques)

    print(f"[physics-tier] {len(changes)} change(s):")
    for change in changes:
        print(f"  {change}")
    tiers = Counter(t["physics_feasibility"]["tier_label"] for t in techniques)
    print(f"[physics-tier] resulting tier_label counts: {dict(sorted(tiers.items()))}")

    if is_dry_run:
        print("[physics-tier] --dry-run: nothing written.")
        return

    serialized = json.dumps(registrar, indent=2, ensure_ascii=False) + "\n"
    REGISTRAR.write_text(serialized)
    SDK_COPY.write_text(serialized)
    print(f"[physics-tier] wrote {REGISTRAR.relative_to(REPO)} and the SDK copy.")
    print("[physics-tier] now run: npm run registrar:stats")


if __name__ == "__main__":
    main()
