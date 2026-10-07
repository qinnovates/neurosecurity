#!/usr/bin/env python3
"""Populate `techniques[].evidence` across the registrar and demote `status` to legacy.

Why
---
`src/lib/evidence-tiers.ts` defines a seven-tier evidence scheme and
`getEvidenceGroup()` already prefers `evidence.tier` over the legacy `status`
field. That field was populated on 0 of 176 techniques, so every display fell
back to `status` -- a single word, assigned when a technique was authored and
never re-derived when evidence arrived. Eight techniques consequently carried a
status weaker than their own mapped CVEs supported, and `status` holds two
values (PLAUSIBLE, SPECULATIVE) that `statusToEvidenceGroup()` has no case for
and silently buckets as speculative.

Derivation is deterministic. No tier here is a judgement call made by this
script; every value follows from data already in the repository, and the
`evidence.basis` field on each technique names what it followed from.

Rubric
------
A technique with at least one NVD-verified CVE mapped from a neural-product
category (Neural/EEG Systems, Implant Telemetry, Implant Gateway/Hub) is
`demonstrated_case`: a documented real-world instance in a shipping
neural-data product is observational evidence, whatever the authoring status
said.

Otherwise the tier follows the legacy status:

    CONFIRMED, DEMONSTRATED -> demonstrated_lab
    EMERGING                -> theoretical_proposed
    THEORETICAL             -> theoretical_modeled when origin.category is
                               'literature' (someone modelled it in a paper),
                               otherwise theoretical_proposed
    PLAUSIBLE, SPECULATIVE  -> speculative

Two deliberate limits:

`validated_rct` and `validated_replication` are never assigned automatically.
Both assert that independent replication happened, which no field in this
repository records. They stay empty rather than inferred.

Adjacent CVE evidence does not promote a tier. Twelve techniques carry
NVD-verified CVEs only in component technology -- Bluetooth stacks, RTOSes,
DICOM libraries -- rather than in a neural-data product. Those records are real
and the mechanism is proven, but not on a BCI, and the seven-tier scheme has no
rung for "demonstrated in adjacent technology". Rather than force them up or
pretend they do not exist, the count is recorded in
`evidence.adjacent_cve_count` and the gap is noted in the derivation log.

What is NOT used
----------------
`tara.clinical.evidence_level` holds values like "RCT". That grades the
*therapeutic analog's* evidence, not the attack's, and reading it as attack
evidence would repeat the cross-metric conflation recorded in Entries 108 and
109. It is deliberately ignored here.

Usage: python3 src/scripts/migrate-populate-evidence-tier.py [--dry-run]
"""

from __future__ import annotations

import json
import sys
from collections import Counter
from pathlib import Path

REPO = Path(__file__).resolve().parents[2]
REGISTRAR = REPO / "datalake" / "qtara-registrar.json"
CVE_MAPPING = REPO / "datalake" / "cve-technique-mapping.json"

DERIVED_ON = "2026-10-07"
DERIVED_BY = "src/scripts/migrate-populate-evidence-tier.py"

NEURAL_PRODUCT_CATEGORIES = {
    "Neural/EEG Systems",
    "Implant Telemetry",
    "Implant Gateway/Hub",
}

# `evidence.population` records what the supporting records are *about*, which
# the seven-tier scheme has no way to express. It is non-ordinal: it never
# raises or lowers `tier`, which stays derived from neural-product evidence
# alone. GRADE treats indirect population as a reported downgrade domain rather
# than a new rung, and that is the shape copied here.
POPULATION_BY_CATEGORY = {
    "Neural/EEG Systems": "neural_product",
    "Implant Telemetry": "neural_product",
    "Implant Gateway/Hub": "neural_product",
    "Medical Data Protocols": "adjacent_clinical",
    "Backend/Data Systems": "adjacent_clinical",
    "Bluetooth Protocol": "adjacent_component",
    "RTOS": "adjacent_component",
    "IoT Mesh": "adjacent_component",
    "RF/SDR": "adjacent_domain",
    "Audio/Acoustic": "adjacent_domain",
    "EM Fault Injection / Crypto": "adjacent_domain",
}

# Most-direct wins, so a technique with both neural-product and adjacent
# records is reported on the strongest thing it actually rests on.
POPULATION_PRECEDENCE = [
    "neural_product",
    "adjacent_clinical",
    "adjacent_component",
    "adjacent_domain",
]

STATUS_TIERS = {
    "CONFIRMED": "demonstrated_lab",
    "DEMONSTRATED": "demonstrated_lab",
    "EMERGING": "theoretical_proposed",
    "PLAUSIBLE": "speculative",
    "SPECULATIVE": "speculative",
}

VALID_TIERS = {
    "validated_rct",
    "validated_replication",
    "demonstrated_lab",
    "demonstrated_case",
    "theoretical_modeled",
    "theoretical_proposed",
    "speculative",
}

NEVER_AUTO_ASSIGNED = {"validated_rct", "validated_replication"}

# `timeline` maps 1:1 from `tier_label` across all 150 blocks that have both, so
# backfilling the 26 that lack it is derivation from an established mapping
# rather than invention. QIF-T0136 to T0161 were added with two-field physics
# blocks; the Pydantic model in the SDK requires `timeline`, so until this
# backfill the SDK could not parse its own bundled registrar. The other absent
# fields on those 26 (gate_reason, constraint_system_ref, analysis_date) are not
# derivable from anything and are deliberately left absent.
TIMELINE_BY_TIER_LABEL = {
    "feasible_now": "now",
    "near_term": "2026-2031",
    "mid_term": "2031-2038",
    "far_term": "2038+",
    "no_physics_gate": "none",
}


def backfill_timeline(techniques: list[dict]) -> list[str]:
    filled = []
    for technique in techniques:
        physics = technique.get("physics_feasibility")
        if not physics or physics.get("timeline"):
            continue
        tier_label = physics.get("tier_label")
        timeline = TIMELINE_BY_TIER_LABEL.get(tier_label)
        if timeline is None:
            raise SystemExit(f"{technique['id']}: tier_label {tier_label!r} has no known timeline; aborting.")
        physics["timeline"] = timeline
        filled.append(f"{technique['id']} ({tier_label}) -> timeline {timeline}")
    return filled


def populations_by_technique(mappings: list[dict]) -> dict[str, str]:
    """The most direct population any NVD-verified record for each technique rests on."""
    seen: dict[str, set[str]] = {}
    for record in mappings:
        if not record.get("validation", {}).get("nvd_verified"):
            continue
        category = record.get("category")
        population = POPULATION_BY_CATEGORY.get(category)
        if population is None:
            raise SystemExit(f"CVE category {category!r} has no population mapping; extend the script.")
        for technique_id in record.get("tara_techniques", []):
            seen.setdefault(technique_id, set()).add(population)
    resolved = {}
    for technique_id, populations in seen.items():
        resolved[technique_id] = next(p for p in POPULATION_PRECEDENCE if p in populations)
    return resolved


def count_cves(mappings: list[dict]) -> tuple[Counter, Counter]:
    """Per technique: NVD-verified CVEs in a neural product, and in adjacent technology."""
    neural: Counter = Counter()
    adjacent: Counter = Counter()
    for record in mappings:
        if not record.get("validation", {}).get("nvd_verified"):
            continue
        bucket = neural if record.get("category") in NEURAL_PRODUCT_CATEGORIES else adjacent
        for technique_id in record.get("tara_techniques", []):
            bucket[technique_id] += 1
    return neural, adjacent


def derive(technique: dict, neural_count: int, adjacent_count: int, population: str) -> dict:
    status = (technique.get("status") or "").upper()
    if neural_count:
        tier = "demonstrated_case"
        basis = (
            f"{neural_count} NVD-verified CVE(s) in a neural-data product; "
            f"authoring status was {status or 'unset'}"
        )
    elif status == "THEORETICAL":
        is_from_literature = (technique.get("origin") or {}).get("category") == "literature"
        tier = "theoretical_modeled" if is_from_literature else "theoretical_proposed"
        basis = (
            "status THEORETICAL, modelled in the literature"
            if is_from_literature
            else "status THEORETICAL, proposed within this framework"
        )
    elif status in STATUS_TIERS:
        tier = STATUS_TIERS[status]
        basis = f"status {status}"
    else:
        tier = "speculative"
        basis = f"status {status or 'unset'} is not in the documented vocabulary"

    if tier in NEVER_AUTO_ASSIGNED:
        raise SystemExit(f"{technique['id']}: refusing to auto-assign {tier}; aborting.")

    evidence = {
        "tier": tier,
        "basis": basis,
        "neural_product_cve_count": neural_count,
        "adjacent_cve_count": adjacent_count,
        "population": population,
        "legacy_status": technique.get("status"),
        "derived_by": DERIVED_BY,
        "derived_on": DERIVED_ON,
    }
    return evidence


def main() -> None:
    is_dry_run = "--dry-run" in sys.argv
    registrar = json.loads(REGISTRAR.read_text())
    mapping = json.loads(CVE_MAPPING.read_text())
    techniques = registrar["techniques"]

    filled = backfill_timeline(techniques)
    if filled:
        print(f"[evidence-tier] backfilled physics timeline on {len(filled)} technique(s) ({filled[0].split()[0]} .. {filled[-1].split()[0]})")

    neural, adjacent = count_cves(mapping["mappings"])
    populations = populations_by_technique(mapping["mappings"])

    promoted = []
    for technique in techniques:
        evidence = derive(technique, neural[technique["id"]], adjacent[technique["id"]], populations.get(technique["id"], "none"))
        if evidence["tier"] not in VALID_TIERS:
            raise SystemExit(f"{technique['id']}: derived unknown tier {evidence['tier']!r}; aborting.")
        was_weak = (technique.get("status") or "").upper() in {"THEORETICAL", "EMERGING", "PLAUSIBLE", "SPECULATIVE"}
        if was_weak and evidence["tier"] == "demonstrated_case":
            promoted.append(f"{technique['id']} {technique['status']} -> demonstrated_case ({evidence['neural_product_cve_count']} CVE)")
        technique["evidence"] = evidence

    missing = [t["id"] for t in techniques if not t.get("evidence", {}).get("tier")]
    if missing:
        raise SystemExit(f"{len(missing)} technique(s) ended with no tier: {missing}")

    pops = Counter(t["evidence"]["population"] for t in techniques)
    print(f"[evidence-tier] populations: {dict(sorted(pops.items()))}")
    tiers = Counter(t["evidence"]["tier"] for t in techniques)
    print(f"[evidence-tier] {len(techniques)} techniques tiered: {dict(sorted(tiers.items()))}")
    print(f"[evidence-tier] {len(promoted)} promoted above their authoring status:")
    for line in promoted:
        print(f"  {line}")
    adjacent_only = [
        t["id"] for t in techniques
        if t["evidence"]["adjacent_cve_count"] and not t["evidence"]["neural_product_cve_count"]
    ]
    print(f"[evidence-tier] {len(adjacent_only)} technique(s) hold adjacent-only CVE evidence and were NOT promoted.")

    if is_dry_run:
        print("[evidence-tier] --dry-run: nothing written.")
        return

    REGISTRAR.write_text(json.dumps(registrar, indent=2, ensure_ascii=False) + "\n")
    print("[evidence-tier] wrote the registrar.")
    print("[evidence-tier] now run: npm run registrar:stats")


if __name__ == "__main__":
    main()
