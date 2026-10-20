#!/usr/bin/env python3
"""
Registrar migration, 2026-10-07 (variants layer).

Applies _staging/2026-10-refresh/variants-plan.json to
datalake/qtara-registrar.json, then syncs the SDK copy:

  1. A top-level `variants` array beside `techniques`. A variant has the same
     signal-level mechanism, tactic and harm as exactly one parent technique
     and differs in one differs_in dimension. Variants are never counted as
     techniques.
  2. Each planned variant gets an id (parent id + -V + two-digit sequence) and
     an alias (parent alias + - + dimension code + one-digit sequence), both
     computed from registrar state, a derived peer_review_status and a niss
     object. scoring_state never inherits.
  3. Interim variant notes removed from the parents named in the plan.
  4. TARA aliases assigned to the techniques the plan lists as having none.
  5. statistics.total_variants, version, changelog and schema_extensions.

The script stops without writing if the technique count changes, if a parent
or related id does not exist, if a variant that is not peer-reviewed would hold
a status above THEORETICAL or inherit a score, or if a variant would inherit
across a dimension that changes impact.

Usage (from the repository root):
    python3 datalake/scripts/migrate-variants.py --dry-run
    python3 datalake/scripts/migrate-variants.py
"""

import argparse
import importlib.util
import json
import re
import sys
from pathlib import Path
from typing import Any, Dict, List

SCRIPTS_DIR = Path(__file__).resolve().parent
DATALAKE_DIR = SCRIPTS_DIR.parent
STAGING_DIR = DATALAKE_DIR.parent / "_staging" / "2026-10-refresh"
REGISTRAR_PATH = DATALAKE_DIR / "qtara-registrar.json"
SDK_REGISTRAR_PATH = DATALAKE_DIR / "qtara" / "src" / "qtara" / "data" / "qtara-registrar.json"
PLAN_PATH = STAGING_DIR / "variants-plan.json"

VARIANT_FIELDS = ["id", "alias", "name", "parent", "differs_in", "inherits_niss", "description", "conditions",
                  "sources", "defensive_sources", "peer_review_status", "status", "niss", "related_ids", "notes"]
VARIANT_ID_PATTERN = re.compile(r"^(QIF-T\d{4})-V(\d{2})$")
MAX_VARIANTS_PER_PARENT = 99
MAX_VARIANTS_PER_DIMENSION = 9
SCORED, UNSCORED = "scored", "unscored"
IMPACT_DIMENSION_DIFFERS = "impact_dimension_differs"


def load_module(file_name: str, module_name: str) -> Any:
    spec = importlib.util.spec_from_file_location(module_name, SCRIPTS_DIR / file_name)
    if spec is None or spec.loader is None:
        raise RuntimeError(f"cannot load {file_name}")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


THREE_STATE = load_module("migrate-three-state-niss.py", "migrate_three_state_niss")
PEER_REVIEW_RULES = THREE_STATE.PEER_REVIEW_RULES
FIXES = THREE_STATE.FIXES
MigrationError = THREE_STATE.MigrationError


def derive_peer_review_status(sources: List[str], notes: str) -> str:
    """The technique rule over `sources`; with no sources, 'preprint' when notes carry a preprint identifier."""
    if sources:
        return PEER_REVIEW_RULES.classify_sources(sources)[0]
    preprint_ids, _ = PEER_REVIEW_RULES.find_identifiers(notes)
    return PEER_REVIEW_RULES.PREPRINT if preprint_ids else PEER_REVIEW_RULES.NO_SOURCES


def build_niss(planned: Dict[str, Any], parent: Dict[str, Any], peer_review_status: str,
               dimension: Dict[str, Any], version: str) -> Dict[str, Any]:
    """scoring_state never inherits: it is decided here from the variant's own sources and dimension."""
    is_peer_reviewed = peer_review_status == PEER_REVIEW_RULES.PEER_REVIEWED
    if planned["inherits_niss"]:
        if not is_peer_reviewed:
            raise MigrationError(f"{planned['name']!r} is {peer_review_status}; it may not inherit a NISS vector")
        if dimension["changes_impact"]:
            raise MigrationError(f"{planned['name']!r} differs in {planned['differs_in']}, which changes impact")
        if parent["niss"]["scoring_state"] != SCORED:
            raise MigrationError(f"{planned['name']!r}: parent {parent['id']} is not scored")
        return {"version": version, "scoring_state": SCORED, "inherited_from": parent["id"]}
    if peer_review_status == PEER_REVIEW_RULES.PREPRINT:
        reason = "preprint_only"
    elif peer_review_status == PEER_REVIEW_RULES.NO_SOURCES:
        reason = "no_source"
    else:
        reason = IMPACT_DIMENSION_DIFFERS if dimension["changes_impact"] else "no_metric_supported"
    return {"version": version, "scoring_state": UNSCORED, "unscored_reason": reason}


def next_variant_id(variants: List[Dict[str, Any]], parent_id: str) -> str:
    used = [int(match.group(2)) for match in (VARIANT_ID_PATTERN.match(variant["id"]) for variant in variants)
            if match and match.group(1) == parent_id]
    sequence = max(used, default=0) + 1
    if sequence > MAX_VARIANTS_PER_PARENT:
        raise MigrationError(f"{parent_id} already holds {MAX_VARIANTS_PER_PARENT} variants")
    return f"{parent_id}-V{sequence:02d}"


def next_variant_alias(variants: List[Dict[str, Any]], parent: Dict[str, Any], code: str) -> str:
    prefix = f"{parent['tara_alias']}-{code}"
    sequence = sum(1 for variant in variants if variant["alias"].startswith(prefix)) + 1
    if sequence > MAX_VARIANTS_PER_DIMENSION:
        raise MigrationError(f"{parent['id']} already holds {MAX_VARIANTS_PER_DIMENSION} {code} variants")
    return f"{prefix}{sequence}"


def check_references(planned: Dict[str, Any], by_id: Dict[str, Dict[str, Any]], known_variant_ids: set) -> None:
    name = planned["name"]
    if not isinstance(planned["parent"], str) or planned["parent"] not in by_id:
        raise MigrationError(f"{name!r}: parent must be exactly one existing technique id")
    if not by_id[planned["parent"]].get("tara_alias"):
        raise MigrationError(f"{name!r}: parent {planned['parent']} has no alias to extend")
    if planned["parent"] in planned["related_ids"]:
        raise MigrationError(f"{name!r}: the parent belongs in parent, not in related_ids")
    unknown = [related for related in planned["related_ids"] if related not in by_id and related not in known_variant_ids]
    if unknown:
        raise MigrationError(f"{name!r}: related_ids {unknown} are not in the registrar")


def build_variant(planned: Dict[str, Any], registrar: Dict[str, Any], dimensions: Dict[str, Any]) -> Dict[str, Any]:
    variants = registrar["variants"]
    by_id = {technique["id"]: technique for technique in registrar["techniques"]}
    check_references(planned, by_id, {variant["id"] for variant in variants})
    if planned["differs_in"] not in dimensions:
        raise MigrationError(f"{planned['name']!r}: differs_in {planned['differs_in']!r} is not in the vocabulary")
    parent, dimension = by_id[planned["parent"]], dimensions[planned["differs_in"]]
    peer_review_status = derive_peer_review_status(planned["sources"], planned["notes"])
    is_capped = peer_review_status != PEER_REVIEW_RULES.PEER_REVIEWED
    if is_capped and planned["status"] not in PEER_REVIEW_RULES.STATUSES_NOT_ABOVE_THEORETICAL:
        raise MigrationError(f"{planned['name']!r} is {peer_review_status} but holds status {planned['status']}")
    computed = {
        "id": next_variant_id(variants, parent["id"]),
        "alias": next_variant_alias(variants, parent, dimension["code"]),
        "peer_review_status": peer_review_status,
        "niss": build_niss(planned, parent, peer_review_status, dimension, registrar["niss_spec"]["version"]),
    }
    return {field: computed[field] if field in computed else planned[field] for field in VARIANT_FIELDS}


def add_variants(registrar: Dict[str, Any], plan: Dict[str, Any]) -> List[str]:
    log: List[str] = []
    for planned in plan["variants"]:
        is_filed = any(variant["parent"] == planned["parent"] and variant["name"] == planned["name"]
                       for variant in registrar["variants"])
        if is_filed:
            continue
        built = build_variant(planned, registrar, plan["dimensions"])
        registrar["variants"].append(built)
        log.append(f"[{planned['ref']}] added {built['id']} [{built['alias']}, {built['peer_review_status']}, "
                   f"{built['status']}, niss {built['niss']['scoring_state']}] {built['name']}")
    return log


def apply_parent_cleanup(by_id: Dict[str, Dict[str, Any]], operations: List[Dict[str, Any]]) -> List[str]:
    """Remove interim variant text and citations from parents. Each removal is skipped once done."""
    log: List[str] = []
    for operation in operations:
        if operation["id"] not in by_id:
            raise MigrationError(f"{operation['id']} is not in the registrar")
        container, key = FIXES.resolve_parent(by_id[operation["id"]], operation["path"])
        if operation["op"] == "remove_text" and operation["text"] in container[key]:
            container[key] = container[key].replace(operation["text"], "")
            log.append(f"[{operation['ref']}] {operation['id']} {key}: removed {len(operation['text'])} characters")
        elif operation["op"] == "remove_list_value" and operation["value"] in container[key]:
            container[key].remove(operation["value"])
            log.append(f"[{operation['ref']}] {operation['id']} {key} -= {operation['value'][:60]}...")
        elif operation["op"] not in ("remove_text", "remove_list_value"):
            raise MigrationError(f"unknown operation {operation['op']!r} in the plan")
    return log


def backfill_aliases(registrar: Dict[str, Any], technique_ids: List[str]) -> List[str]:
    """Assign TARA-{DOMAIN}-{MODE}-{NNN} with the rule used for every other entry (next free NNN in the pair)."""
    techniques = registrar["techniques"]
    log: List[str] = []
    for index, technique in enumerate(techniques):
        if technique["id"] not in technique_ids or technique.get("tara_alias"):
            continue
        alias = THREE_STATE.next_alias(techniques, technique["tara_domain_primary"], technique["tara_mode"])
        techniques[index] = PEER_REVIEW_RULES.insert_after(technique, "tara", {"tara_alias": alias})
        log.append(f"{technique['id']} tara_alias = {alias}")
    return log


def add_containers(registrar: Dict[str, Any]) -> Dict[str, Any]:
    """Place `variants` after `techniques`; existing top-level keys keep their place."""
    return PEER_REVIEW_RULES.insert_after(registrar, "techniques", {"variants": []})


def update_statistics(registrar: Dict[str, Any]) -> List[str]:
    total = len(registrar["variants"])
    if registrar["statistics"].get("total_variants") == total:
        return []
    registrar["statistics"] = PEER_REVIEW_RULES.insert_after(registrar["statistics"], "total_techniques", {"total_variants": total})
    registrar["statistics"]["total_variants"] = total
    return [f"statistics.total_variants = {total}"]


def build_schema_extension(plan: Dict[str, Any]) -> Dict[str, Any]:
    extension = json.loads(json.dumps(plan["schema_extension"]))
    extension["format"]["differs_in"] = plan["dimensions"]
    return extension


def build_changelog_entry(plan: Dict[str, Any], registrar: Dict[str, Any]) -> Dict[str, Any]:
    """Built from registrar state, so a rerun produces the same entry. Variants are never listed under `added`."""
    entry = json.loads(json.dumps(plan["changelog_entry"]))
    planned = {(variant["parent"], variant["name"]) for variant in plan["variants"]}
    entry["added_variants"] = [f"{variant['id']} ({variant['alias']}) {variant['name']}"
                               for variant in registrar["variants"] if (variant["parent"], variant["name"]) in planned]
    aliases = [f"{technique['id']} {technique['tara_alias']}" for technique in registrar["techniques"]
               if technique["id"] in plan["alias_backfill"]]
    entry["changed"].append("Aliases assigned by the existing next-free-number rule: " + "; ".join(aliases))
    return entry


def write_changelog(registrar: Dict[str, Any], plan: Dict[str, Any]) -> List[str]:
    entry = build_changelog_entry(plan, registrar)
    log = FIXES.bump_version(registrar, {**plan, "changelog_entry": entry})
    for index, existing in enumerate(registrar["changelog"]):
        if existing.get("version") == entry["version"] and existing != entry:
            registrar["changelog"][index] = entry
            log.append(f"changelog: entry {entry['version']} rewritten from registrar state")
    return log


def migrate(registrar: Dict[str, Any], plan: Dict[str, Any]) -> List[str]:
    total_before = len(registrar["techniques"])
    if total_before != plan["expected_total_techniques"]:
        raise MigrationError(f"registrar holds {total_before} techniques; the plan expects {plan['expected_total_techniques']}")
    by_id = {technique["id"]: technique for technique in registrar["techniques"]}
    alias_lines = backfill_aliases(registrar, plan["alias_backfill"])
    cleanup_lines = apply_parent_cleanup(by_id, plan["parent_cleanup"])
    variant_lines = add_variants(registrar, plan)
    if len(registrar["techniques"]) != total_before:
        raise MigrationError("the technique count changed; variants must never be counted as techniques")
    log = alias_lines + cleanup_lines + variant_lines + update_statistics(registrar)
    log += write_changelog(registrar, plan)
    extension = build_schema_extension(plan)
    if registrar["schema_extensions"].get("variants") != extension:
        registrar["schema_extensions"]["variants"] = extension
        log.append("schema_extensions.variants written")
    return log


def run(is_dry_run: bool) -> None:
    registrar_text, registrar = FIXES.read_round_trip_json(REGISTRAR_PATH, PEER_REVIEW_RULES.serialise)
    plan = json.loads(PLAN_PATH.read_text(encoding="utf-8"))
    registrar = add_containers(registrar)
    change_log = migrate(registrar, plan)
    migrated_text = PEER_REVIEW_RULES.serialise(registrar)
    print(f"{'DRY RUN: ' if is_dry_run else ''}{REGISTRAR_PATH.name}")
    for line in change_log + THREE_STATE.report_matrix(registrar["techniques"]):
        print(f"  {line}")
    for skipped in plan["not_filed"]:
        print(f"  [{skipped['ref']}] not filed: {skipped['decision']}")
    print(f"\nTechniques: {len(registrar['techniques'])}; variants: {len(registrar['variants'])}")
    print(f"Line count change: {migrated_text.count(chr(10)) - registrar_text.count(chr(10)):+d}")
    if is_dry_run:
        print("\nDRY RUN: no file was written.")
        return
    if migrated_text != registrar_text:
        REGISTRAR_PATH.write_text(migrated_text, encoding="utf-8")
    SDK_REGISTRAR_PATH.write_text(migrated_text, encoding="utf-8")
    print(f"\nWrote {REGISTRAR_PATH.name} and the SDK copy")


def main() -> int:
    parser = argparse.ArgumentParser(description="Add the variants layer to the TARA registrar.")
    parser.add_argument("--dry-run", action="store_true", help="report what would change; write nothing")
    arguments = parser.parse_args()
    try:
        run(arguments.dry_run)
    except MigrationError as error:
        print(f"ERROR: {error}. Nothing was changed.", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
