#!/usr/bin/env python3
"""
Recompute the derived counts in `statistics` of datalake/qtara-registrar.json
from the technique records, and report or write the ones that are stale.

Only counts that follow mechanically from the records are touched. Each is
defined the way the script that first wrote it defined it (enrich-skeletons.py,
populate-dsm5.py, enrich-neurorights.py, enrich-regulatory.py). Keys are never
added, removed or reordered, so a block whose records are partly unassigned
(origin, physics_feasibility, cvss) keeps counting only the assigned ones; the
unassigned totals are printed.

Usage (from the repository root):
    python3 datalake/scripts/recompute-registrar-statistics.py --check
    python3 datalake/scripts/recompute-registrar-statistics.py --write
"""

import argparse
import importlib.util
import sys
from collections import Counter
from pathlib import Path
from typing import Any, Dict, List, Tuple

SCRIPTS_DIR = Path(__file__).resolve().parent
DATALAKE_DIR = SCRIPTS_DIR.parent
REGISTRAR_PATH = DATALAKE_DIR / "qtara-registrar.json"
SDK_REGISTRAR_PATH = DATALAKE_DIR / "qtara" / "src" / "qtara" / "data" / "qtara-registrar.json"
NISS_SEVERITY_ORDER = ["critical", "high", "medium", "low", "none"]
CCI_HIGH_THRESHOLD = 2.0
COVERAGE_LOW_THRESHOLD = 0.5
TOP_GAP_LIMIT = 10
UNASSIGNED = "(unassigned)"

Technique = Dict[str, Any]
Counts = Dict[str, Any]


def load_module(file_name: str, module_name: str) -> Any:
    spec = importlib.util.spec_from_file_location(module_name, SCRIPTS_DIR / file_name)
    if spec is None or spec.loader is None:
        raise RuntimeError(f"cannot load {file_name}")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


PEER_REVIEW_RULES = load_module("migrate-peer-review-status.py", "migrate_peer_review_status")
FIXES = load_module("migrate-registrar-fixes.py", "migrate_registrar_fixes")
MigrationError = PEER_REVIEW_RULES.MigrationError


def count_field(techniques: List[Technique], block: str, field: str) -> Counter:
    return Counter(str((technique.get(block) or {}).get(field, UNASSIGNED)) for technique in techniques)


def compute_core(registrar: Dict[str, Any]) -> Counts:
    techniques = registrar["techniques"]
    niss_severity = Counter(technique["niss"].get("severity", "none") for technique in techniques)
    return {
        "total_techniques": len(techniques),
        "total_variants": len(registrar.get("variants", [])),
        "total_tactics": len(registrar["tactics"]),
        "total_domains": len(registrar["domains"]),
        "by_tactic": Counter(technique["tactic"] for technique in techniques),
        "by_status": Counter(technique["status"] for technique in techniques),
        "by_severity": Counter(technique["severity"] for technique in techniques),
        "by_ui_category": Counter(technique["ui_category"] for technique in techniques),
        "by_niss_severity": {severity: niss_severity.get(severity, 0) for severity in NISS_SEVERITY_ORDER},
        "by_scoring_state": Counter(technique["niss"]["scoring_state"] for technique in techniques),
        "by_origin": count_field(techniques, "origin", "category"),
        "niss_cvss_mapping.pins_flagged": sum(1 for technique in techniques if technique["niss"].get("pins")),
        "niss_cvss_mapping.by_gap_group": count_field(techniques, "cvss", "gap_group"),
        "physics_feasibility.by_tier": count_field(techniques, "physics_feasibility", "tier_label"),
    }


def compute_tara(techniques: List[Technique]) -> Counts:
    enrichments = [technique.get("tara") or {} for technique in techniques]
    dsm5_blocks = [enrichment["dsm5"] for enrichment in enrichments if enrichment.get("dsm5")]
    dual_use = Counter(enrichment.get("dual_use", UNASSIGNED) for enrichment in enrichments)
    primary_codes = {entry["code"] for block in dsm5_blocks for entry in block.get("primary", [])}
    return {
        "tara.enriched_techniques": sum(1 for technique in techniques if not technique.get("tara_enrichment_pending", False)),
        "tara.dual_use_breakdown": dual_use,
        "tara.techniques_with_clinical_analog": sum(1 for enrichment in enrichments if enrichment.get("clinical")),
        "tara.techniques_silicon_only": dual_use.get("silicon_only", 0),
        "tara.dsm5.techniques_with_dsm5": len(dsm5_blocks),
        "tara.dsm5.unique_dsm_codes": len(primary_codes),
        "tara.dsm5.cluster_breakdown": Counter(block.get("cluster", "non_diagnostic") for block in dsm5_blocks),
        "tara.dsm5.risk_class_breakdown": Counter(block.get("risk_class", "none") for block in dsm5_blocks),
        "tara.neurorights_mapped": sum(1 for technique in techniques if technique.get("neurorights")),
    }


def compute_neurorights(techniques: List[Technique]) -> Counts:
    blocks = [technique["neurorights"] for technique in techniques if technique.get("neurorights")]
    cci_values = [block["cci"] for block in blocks if block.get("cci") is not None]
    if not cci_values:
        raise MigrationError("no technique carries neurorights.cci; cci_stats cannot be computed")
    return {
        "neurorights.techniques_by_right": Counter(right for block in blocks for right in block.get("affected", [])),
        "neurorights.cci_stats": {
            "mean": round(sum(cci_values) / len(cci_values), 2),
            "max": max(cci_values),
            "min": min(cci_values),
            "techniques_above_2": sum(1 for value in cci_values if value > CCI_HIGH_THRESHOLD),
        },
    }


def compute_regulatory(techniques: List[Technique]) -> Counts:
    blocks = [technique["regulatory"]["fdora_524b"] for technique in techniques
              if (technique.get("regulatory") or {}).get("fdora_524b")]
    if not blocks:
        raise MigrationError("no technique carries regulatory.fdora_524b; regulatory statistics cannot be computed")
    coverage = [block["coverage_score"] for block in blocks]
    failed_prongs = Counter(prong for block in blocks if not block["cyber_device"]
                            for prong, is_met in block["prongs"].items() if not is_met)
    gaps = Counter(gap.split("(")[0].strip() for block in blocks for gap in block["gaps"])
    return {
        "regulatory.cyber_device_techniques": sum(1 for block in blocks if block["cyber_device"]),
        "regulatory.non_cyber_device_techniques": sum(1 for block in blocks if not block["cyber_device"]),
        "regulatory.prong_failure_reasons": failed_prongs,
        "regulatory.techniques_per_requirement": Counter(code for block in blocks for code in block["applicable_requirements"]),
        "regulatory.coverage_stats": {
            "mean": round(sum(coverage) / len(coverage), 2),
            "min": min(coverage),
            "max": max(coverage),
            "below_0.5": sum(1 for score in coverage if score < COVERAGE_LOW_THRESHOLD),
        },
        "regulatory.top_gaps": dict(gaps.most_common(TOP_GAP_LIMIT)),
    }


def compute_all(registrar: Dict[str, Any]) -> Counts:
    techniques = registrar["techniques"]
    computed = compute_core(registrar)
    computed.update(compute_tara(techniques))
    computed.update(compute_neurorights(techniques))
    computed.update(compute_regulatory(techniques))
    return computed


def resolve_stored(statistics: Dict[str, Any], dotted_path: str) -> Tuple[Dict[str, Any], str]:
    """Return the container and key a dotted statistics path names."""
    container = statistics
    *parents, key = dotted_path.split(".", 2) if dotted_path.startswith("tara.dsm5.") else dotted_path.split(".", 1)
    for parent in parents:
        container = container[parent]
    if key not in container:
        raise MigrationError(f"statistics.{dotted_path} is not in the registrar; this script never adds keys")
    return container, key


def reconcile(stored: Any, fresh: Any) -> Tuple[Any, List[str]]:
    """Return the value to store (existing keys and their order kept) and the unassigned or unlisted counts."""
    if not isinstance(stored, dict):
        return fresh, []
    unlisted = [f"{name}: {count}" for name, count in fresh.items() if name not in stored]
    return {name: fresh.get(name, 0) for name in stored}, unlisted


def recompute(registrar: Dict[str, Any]) -> List[str]:
    log: List[str] = []
    statistics = registrar["statistics"]
    for dotted_path, fresh in compute_all(registrar).items():
        container, key = resolve_stored(statistics, dotted_path)
        value, unlisted = reconcile(container[key], dict(fresh) if isinstance(fresh, Counter) else fresh)
        if unlisted:
            log.append(f"NOTE  statistics.{dotted_path}: not listed in the stored block: {'; '.join(unlisted)}")
        if container[key] != value:
            log.append(f"STALE statistics.{dotted_path}: {container[key]} -> {value}")
            container[key] = value
    return log


def run(is_write: bool) -> int:
    registrar_text, registrar = FIXES.read_round_trip_json(REGISTRAR_PATH, PEER_REVIEW_RULES.serialise)
    log = recompute(registrar)
    stale_count = sum(1 for line in log if line.startswith("STALE"))
    for line in log:
        print(line)
    print(f"\n{stale_count} stale statistics block(s) in {REGISTRAR_PATH.name}")
    if not is_write:
        return 1 if stale_count else 0
    migrated_text = PEER_REVIEW_RULES.serialise(registrar)
    if migrated_text != registrar_text:
        REGISTRAR_PATH.write_text(migrated_text, encoding="utf-8")
    SDK_REGISTRAR_PATH.write_text(migrated_text, encoding="utf-8")
    print(f"Wrote {REGISTRAR_PATH.name} and the SDK copy")
    return 0


def main() -> int:
    parser = argparse.ArgumentParser(description="Recompute the derived counts in the registrar's statistics block.")
    mode = parser.add_mutually_exclusive_group(required=True)
    mode.add_argument("--check", action="store_true", help="report stale counts; write nothing; exit 1 if any are stale")
    mode.add_argument("--write", action="store_true", help="write the recomputed counts to the registrar and the SDK copy")
    arguments = parser.parse_args()
    try:
        return run(arguments.write)
    except MigrationError as error:
        print(f"ERROR: {error}. Nothing was changed.", file=sys.stderr)
        return 1


if __name__ == "__main__":
    sys.exit(main())
