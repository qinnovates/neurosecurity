#!/usr/bin/env python3
"""
Registrar migration, 2026-10-06 (citation gate applied, staged scholar updates).

Applies the reviewed plan in _staging/2026-10-refresh/registrar-fix-plan.json to
datalake/qtara-registrar.json, then syncs the SDK copy:

  1. Plan operations: citations appended to `sources` or `defensive_sources`,
     note text appended, wording corrected, two taxonomy fields set.
  2. `peer_review_status` recomputed for every technique with the rule in
     migrate-peer-review-status.py.
  3. Cap rule enforced on the entries the plan lists as unsourced: the `niss`
     key is removed (the same representation QIF-T0136 to QIF-T0161 use) and a
     status above THEORETICAL is lowered. Every removed value is written to
     _staging/2026-10-refresh/registrar-cap-applied.json so it can be restored.
  4. `statistics` counts that depend on status or NISS recomputed; `version`
     bumped; one `changelog` entry added.
  5. Pointer entries appended to datalake/qif-hazards.json.

No technique is added, removed or renumbered. The script stops without writing
if any entry is not in the state the plan expects, or if a technique that is not
peer-reviewed would still hold a score or a status above THEORETICAL.

Both JSON files are rewritten only if a load/dump round trip of the untouched
file is byte-identical, so the diff holds the intended lines and nothing else.

Usage (from the repository root):
    python3 datalake/scripts/migrate-registrar-fixes.py --dry-run
    python3 datalake/scripts/migrate-registrar-fixes.py --dry-run --verify-dois
    python3 datalake/scripts/migrate-registrar-fixes.py
"""

import argparse
import importlib.util
import json
import re
import sys
import time
import unicodedata
import urllib.error
import urllib.parse
import urllib.request
from collections import Counter
from pathlib import Path
from typing import Any, Dict, List, Tuple

SCRIPTS_DIR = Path(__file__).resolve().parent
DATALAKE_DIR = SCRIPTS_DIR.parent
REPO_ROOT = DATALAKE_DIR.parent
STAGING_DIR = REPO_ROOT / "_staging" / "2026-10-refresh"
REGISTRAR_PATH = DATALAKE_DIR / "qtara-registrar.json"
SDK_REGISTRAR_PATH = DATALAKE_DIR / "qtara" / "src" / "qtara" / "data" / "qtara-registrar.json"
HAZARDS_PATH = DATALAKE_DIR / "qif-hazards.json"
PLAN_PATH = STAGING_DIR / "registrar-fix-plan.json"
CAP_RECORD_PATH = STAGING_DIR / "registrar-cap-applied.json"
PEER_REVIEW_MODULE_PATH = SCRIPTS_DIR / "migrate-peer-review-status.py"

CAPPED_STATUS = "THEORETICAL"
CROSSREF_WORKS_URL = "https://api.crossref.org/works/"
CROSSREF_TIMEOUT_SECONDS = 30
CROSSREF_PAUSE_SECONDS = 1.0
CROSSREF_MAX_ATTEMPTS = 4
HTTP_TOO_MANY_REQUESTS = 429
NISS_SEVERITY_ORDER = ["critical", "high", "medium", "low", "none"]


class MigrationError(Exception):
    """The registrar, the plan or a citation is not in the state this migration expects."""


def load_peer_review_rules() -> Any:
    """Import the earlier migration so its classification and serialisation are reused, not copied."""
    spec = importlib.util.spec_from_file_location("migrate_peer_review_status", PEER_REVIEW_MODULE_PATH)
    if spec is None or spec.loader is None:
        raise MigrationError(f"cannot load {PEER_REVIEW_MODULE_PATH.name}")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def read_round_trip_json(path: Path, serialise: Any) -> Tuple[str, Dict[str, Any]]:
    original_text = path.read_text(encoding="utf-8")
    document = json.loads(original_text)
    if serialise(document) != original_text:
        raise MigrationError(f"{path.name} does not survive a load/dump round trip; writing it would reformat the file")
    return original_text, document


def resolve_parent(technique: Dict[str, Any], path: List[Any]) -> Tuple[Any, Any]:
    """Walk to the container that holds the last path element."""
    container: Any = technique
    for step in path[:-1]:
        try:
            container = container[step]
        except (KeyError, IndexError, TypeError) as error:
            raise MigrationError(f"{technique['id']}: path {path} does not exist") from error
    return container, path[-1]


def apply_append_list(technique: Dict[str, Any], operation: Dict[str, Any]) -> List[str]:
    container, key = resolve_parent(technique, operation["path"])
    existing = container[key]
    added = [value for value in operation["values"] if value not in existing]
    existing.extend(added)
    return [f"{technique['id']} {key} += {value}" for value in added]


def apply_append_text(technique: Dict[str, Any], operation: Dict[str, Any]) -> List[str]:
    container, key = resolve_parent(technique, operation["path"])
    current = container.get(key) or ""
    if operation["text"] in current:
        return []
    separator = operation.get("sep", " ") if current else ""
    container[key] = current + separator + operation["text"]
    return [f"{technique['id']} {'.'.join(map(str, operation['path']))}: appended {len(operation['text'])} characters"]


def apply_replace_text(technique: Dict[str, Any], operation: Dict[str, Any]) -> List[str]:
    container, key = resolve_parent(technique, operation["path"])
    current = container[key]
    if operation["replace"] in current:
        return []
    if operation["find"] not in current:
        raise MigrationError(f"{technique['id']}: text to replace not found at {operation['path']}; inspect by hand")
    container[key] = current.replace(operation["find"], operation["replace"])
    return [f"{technique['id']} {'.'.join(map(str, operation['path']))}: '{operation['find']}' -> '{operation['replace']}'"]


def apply_set_value(technique: Dict[str, Any], operation: Dict[str, Any]) -> List[str]:
    container, key = resolve_parent(technique, operation["path"])
    current = container[key]
    if current == operation["value"]:
        return []
    if current != operation["expect"]:
        raise MigrationError(f"{technique['id']}: {key} is {current!r}, expected {operation['expect']!r}; inspect by hand")
    container[key] = operation["value"]
    return [f"{technique['id']} {key}: {operation['expect']!r} -> {operation['value']!r}"]


OPERATION_HANDLERS = {
    "append_list": apply_append_list,
    "append_text": apply_append_text,
    "replace_text": apply_replace_text,
    "set_value": apply_set_value,
}


def apply_operations(by_id: Dict[str, Dict[str, Any]], operations: List[Dict[str, Any]]) -> List[str]:
    log: List[str] = []
    for operation in operations:
        if operation["id"] not in by_id:
            raise MigrationError(f"{operation['id']} is not in the registrar")
        handler = OPERATION_HANDLERS.get(operation["op"])
        if handler is None:
            raise MigrationError(f"unknown operation {operation['op']!r} in the plan")
        log.extend(f"[{operation['ref']}] {line}" for line in handler(by_id[operation["id"]], operation))
    return log


def recompute_peer_review_status(techniques: List[Dict[str, Any]], rules: Any) -> List[str]:
    log: List[str] = []
    for technique in techniques:
        derived, _ = rules.classify_sources(technique.get("sources", []))
        if technique["peer_review_status"] != derived:
            log.append(f"{technique['id']} peer_review_status: {technique['peer_review_status']} -> {derived}")
            technique["peer_review_status"] = derived
    return log


def preceding_key(technique: Dict[str, Any], key: str) -> Any:
    keys = list(technique)
    position = keys.index(key)
    return keys[position - 1] if position > 0 else None


def apply_cap(by_id: Dict[str, Dict[str, Any]], cap_plan: List[Dict[str, str]], rules: Any) -> List[Dict[str, Any]]:
    """Remove the score and lower the status of each listed entry; return what was removed."""
    removed: List[Dict[str, Any]] = []
    for item in cap_plan:
        technique = by_id[item["id"]]
        if technique["peer_review_status"] == rules.PEER_REVIEWED:
            raise MigrationError(f"{item['id']} is peer_reviewed; it must not be capped")
        status_before = technique["status"]
        status_too_high = status_before not in rules.STATUSES_NOT_ABOVE_THEORETICAL
        if not rules.has_niss_score(technique) and not status_too_high:
            continue
        record = {"id": item["id"], "attack": technique["attack"], "peer_review_status": technique["peer_review_status"],
                  "prior_status": status_before, "new_status": CAPPED_STATUS if status_too_high else status_before,
                  "removed_niss": technique.get("niss"), "reason": item["reason"]}
        if rules.has_niss_score(technique):
            record["niss_followed_key"] = preceding_key(technique, "niss")
            del technique["niss"]
        if status_too_high:
            technique["status"] = CAPPED_STATUS
        removed.append(record)
    return removed


def recompute_statistics(registrar: Dict[str, Any]) -> List[str]:
    techniques = registrar["techniques"]
    statistics = registrar["statistics"]
    status_counts = Counter(technique["status"] for technique in techniques)
    severity_counts = Counter((technique.get("niss") or {}).get("severity", "none") for technique in techniques)
    fresh = {
        "by_status": {status: status_counts[status] for status in statistics["by_status"]},
        "by_niss_severity": {severity: severity_counts.get(severity, 0) for severity in NISS_SEVERITY_ORDER},
    }
    if sum(fresh["by_status"].values()) != len(techniques):
        raise MigrationError("a technique holds a status that statistics.by_status does not list")
    log = [f"statistics.{key}: {statistics[key]} -> {value}" for key, value in fresh.items() if statistics[key] != value]
    statistics.update(fresh)
    pins_flagged = sum(1 for technique in techniques if (technique.get("niss") or {}).get("pins"))
    if statistics["niss_cvss_mapping"]["pins_flagged"] != pins_flagged:
        log.append(f"statistics.niss_cvss_mapping.pins_flagged: {statistics['niss_cvss_mapping']['pins_flagged']} -> {pins_flagged}")
        statistics["niss_cvss_mapping"]["pins_flagged"] = pins_flagged
    return log


def bump_version(registrar: Dict[str, Any], plan: Dict[str, Any]) -> List[str]:
    target = plan["version"]["to"]
    log: List[str] = []
    if registrar["version"] == plan["version"]["from"]:
        registrar["version"] = target
        log.append(f"version: {plan['version']['from']} -> {target}")
    elif registrar["version"] != target:
        raise MigrationError(f"registrar version is {registrar['version']!r}; the plan expects {plan['version']['from']!r}")
    if not any(entry.get("version") == target for entry in registrar["changelog"]):
        registrar["changelog"].insert(0, plan["changelog_entry"])
        log.append(f"changelog: entry {target} added")
    return log


def add_hazards(hazards_document: Dict[str, Any], planned: List[Dict[str, Any]]) -> List[str]:
    existing = hazards_document["hazards"]
    known_ids = {hazard["id"] for hazard in existing}
    already_linked = {technique_id for hazard in existing for technique_id in hazard["related_techniques"]
                      if len(hazard["related_techniques"]) == 1}
    log: List[str] = []
    for hazard in planned:
        if hazard["id"] in known_ids:
            continue
        if hazard["related_techniques"][0] in already_linked:
            raise MigrationError(f"{hazard['related_techniques'][0]} already has a pointer hazard; {hazard['id']} would duplicate it")
        existing.append(hazard)
        log.append(f"hazard {hazard['id']} -> {hazard['related_techniques'][0]}")
    return log


def normalise(text: str) -> str:
    folded = unicodedata.normalize("NFKD", re.sub(r"<[^>]+>", " ", text)).encode("ascii", "ignore").decode("ascii")
    return re.sub(r"[^a-z0-9]+", " ", folded.lower()).strip()


def fetch_crossref_record(doi: str) -> Dict[str, Any]:
    """Fetch one Crossref work record, backing off when the API rate-limits."""
    url = CROSSREF_WORKS_URL + urllib.parse.quote(doi, safe="/")
    request = urllib.request.Request(url, headers={"User-Agent": "qtara-registrar-migration/1.0"})
    for attempt in range(1, CROSSREF_MAX_ATTEMPTS + 1):
        try:
            with urllib.request.urlopen(request, timeout=CROSSREF_TIMEOUT_SECONDS) as response:
                return json.loads(response.read().decode("utf-8"))["message"]
        except urllib.error.HTTPError as error:
            if error.code != HTTP_TOO_MANY_REQUESTS or attempt == CROSSREF_MAX_ATTEMPTS:
                raise MigrationError(f"DOI {doi} did not resolve at Crossref: HTTP {error.code}") from error
            time.sleep(CROSSREF_PAUSE_SECONDS * 5 * attempt)
        except (urllib.error.URLError, TimeoutError, ValueError) as error:
            raise MigrationError(f"DOI {doi} could not be checked at Crossref: {error}") from error
    raise MigrationError(f"DOI {doi} could not be checked at Crossref")


def verify_dois(citations: Dict[str, Dict[str, Any]]) -> None:
    """Resolve every DOI in the plan at Crossref and compare title and author family names."""
    for key, citation in citations.items():
        message = fetch_crossref_record(citation["doi"])
        title = normalise(" ".join(message.get("title", [])))
        authors = [author.get("family") or author.get("name") for author in message.get("author", [])]
        if title != normalise(citation["title"]) or authors != citation["authors"]:
            raise MigrationError(f"DOI {citation['doi']} ({key}): Crossref title or authors differ from the plan")
        print(f"  verified {citation['doi']}  {authors[0]}  {message.get('type')}")
        time.sleep(CROSSREF_PAUSE_SECONDS)


def migrate(registrar: Dict[str, Any], hazards_document: Dict[str, Any], plan: Dict[str, Any], rules: Any) -> Dict[str, Any]:
    by_id = {technique["id"]: technique for technique in registrar["techniques"]}
    change_log = apply_operations(by_id, plan["operations"])
    change_log += recompute_peer_review_status(registrar["techniques"], rules)
    not_sourced = [tid for tid in plan["expected_sourced"] if by_id[tid]["peer_review_status"] != rules.PEER_REVIEWED]
    if not_sourced:
        raise MigrationError(f"expected to be peer_reviewed after the plan, but are not: {not_sourced}")
    removed = apply_cap(by_id, plan["cap"], rules)
    breaches = rules.find_cap_rule_breaches(registrar["techniques"])
    if breaches:
        raise MigrationError(f"cap rule still broken by {[breach['id'] for breach in breaches]}")
    change_log += recompute_statistics(registrar)
    change_log += bump_version(registrar, plan)
    change_log += add_hazards(hazards_document, plan["hazards"])
    scored = sum(1 for technique in registrar["techniques"] if rules.has_niss_score(technique))
    return {"change_log": change_log, "removed": removed, "scored": scored,
            "peer_review_counts": dict(Counter(t["peer_review_status"] for t in registrar["techniques"]))}


def write_cap_record(removed: List[Dict[str, Any]], scored_after: int) -> None:
    record = {
        "_meta": {
            "name": "registrar-cap-applied",
            "applied": "2026-10-06",
            "applied_by": "datalake/scripts/migrate-registrar-fixes.py",
            "rule": "An entry whose peer_review_status is preprint or none may not hold a status above THEORETICAL and must not carry a NISS score.",
            "restore": "For each entry, set status to prior_status and re-insert removed_niss as the key 'niss' directly after the key named in niss_followed_key; then recompute statistics and techniques_niss_scored.",
            "techniques_niss_scored_before": scored_after + sum(1 for item in removed if item["removed_niss"]),
            "techniques_niss_scored_after": scored_after,
        },
        "entries": removed,
    }
    CAP_RECORD_PATH.write_text(json.dumps(record, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def print_report(report: Dict[str, Any], total: int) -> None:
    print(f"Changes ({len(report['change_log'])}):")
    for line in report["change_log"] or ["(none: already applied)"]:
        print(f"  {line}")
    print(f"\nCap applied to {len(report['removed'])} entries:")
    for item in report["removed"]:
        niss = item["removed_niss"] or {}
        print(f"  {item['id']}  [{item['peer_review_status']}]  status {item['prior_status']} -> {item['new_status']}  "
              f"NISS {niss.get('score', '-')} {niss.get('vector', '')}")
    print(f"\npeer_review_status across {total} techniques: {report['peer_review_counts']}")
    print(f"Techniques carrying a NISS score: {report['scored']} of {total}")


def run(is_dry_run: bool, should_verify_dois: bool) -> None:
    rules = load_peer_review_rules()
    registrar_text, registrar = read_round_trip_json(REGISTRAR_PATH, rules.serialise)
    hazards_text, hazards_document = read_round_trip_json(HAZARDS_PATH, rules.serialise)
    plan = json.loads(PLAN_PATH.read_text(encoding="utf-8"))
    if should_verify_dois:
        print(f"Verifying {len(plan['citations'])} DOIs at Crossref:")
        verify_dois(plan["citations"])
    total_before = len(registrar["techniques"])
    report = migrate(registrar, hazards_document, plan, rules)
    if len(registrar["techniques"]) != total_before or total_before != registrar["statistics"]["total_techniques"]:
        raise MigrationError("technique count changed or does not match statistics.total_techniques")
    print(f"{'DRY RUN: ' if is_dry_run else ''}{REGISTRAR_PATH.name}")
    print_report(report, total_before)
    migrated_text = rules.serialise(registrar)
    migrated_hazards = rules.serialise(hazards_document)
    print(f"\nLine count change: registrar {migrated_text.count(chr(10)) - registrar_text.count(chr(10)):+d}, "
          f"hazards {migrated_hazards.count(chr(10)) - hazards_text.count(chr(10)):+d}")
    if is_dry_run:
        print("\nDRY RUN: no file was written.")
        return
    if migrated_text != registrar_text:
        REGISTRAR_PATH.write_text(migrated_text, encoding="utf-8")
    if migrated_hazards != hazards_text:
        HAZARDS_PATH.write_text(migrated_hazards, encoding="utf-8")
    SDK_REGISTRAR_PATH.write_text(migrated_text, encoding="utf-8")
    if report["removed"]:
        write_cap_record(report["removed"], report["scored"])
    print(f"\nWrote {REGISTRAR_PATH.name}, {HAZARDS_PATH.name}, the SDK copy"
          + (f" and {CAP_RECORD_PATH.name}" if report["removed"] else ""))


def main() -> int:
    parser = argparse.ArgumentParser(description="Apply the 2026-10-06 registrar fix plan.")
    parser.add_argument("--dry-run", action="store_true", help="report what would change; write nothing")
    parser.add_argument("--verify-dois", action="store_true", help="resolve every DOI in the plan at Crossref first")
    arguments = parser.parse_args()
    try:
        run(arguments.dry_run, arguments.verify_dois)
    except MigrationError as error:
        print(f"ERROR: {error}. Nothing was changed.", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
