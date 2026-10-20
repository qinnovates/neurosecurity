#!/usr/bin/env python3
"""
Registrar migration, 2026-10-07 (eight techniques added, three-state NISS scoring).

Applies _staging/2026-10-refresh/three-state-niss-plan.json to
datalake/qtara-registrar.json, then syncs the SDK copy:

  1. Parent operations: variant and evidence notes on existing entries.
  2. New techniques appended with ids continuing from the highest existing id.
     Each gets a computed peer_review_status, a TARA alias computed from the
     current registrar state, and a consent complexity index from the
     registrar's own formula (enrich-neurorights.py).
  3. niss.scoring_state on every technique:
       scored       existing vector and score kept, never re-derived
       provisional  supported metrics stored, the rest "unknown"; score_min and
                    score_max are the lowest and highest results of the
                    niss_spec formula over the allowed values of the unknown
                    metrics; no score is stored
       unscored     no peer-reviewed source, or no metric supported
  4. statistics, version, changelog and schema_extensions updated.

The script stops without writing if a scored entry's stored score differs from
the formula's result, if a new entry duplicates an existing one, if an existing
entry's peer_review_status would change, or if an entry that is not
peer-reviewed would hold a status above THEORETICAL or any metric value.

Usage (from the repository root):
    python3 datalake/scripts/migrate-three-state-niss.py --dry-run
    python3 datalake/scripts/migrate-three-state-niss.py --dry-run --verify-sources
    python3 datalake/scripts/migrate-three-state-niss.py
"""

import argparse
import importlib.util
import itertools
import json
import math
import re
import sys
import time
import urllib.error
import urllib.request
from collections import Counter
from pathlib import Path
from typing import Any, Dict, List, Tuple

SCRIPTS_DIR = Path(__file__).resolve().parent
DATALAKE_DIR = SCRIPTS_DIR.parent
STAGING_DIR = DATALAKE_DIR.parent / "_staging" / "2026-10-refresh"
REGISTRAR_PATH = DATALAKE_DIR / "qtara-registrar.json"
SDK_REGISTRAR_PATH = DATALAKE_DIR / "qtara" / "src" / "qtara" / "data" / "qtara-registrar.json"
PLAN_PATH = STAGING_DIR / "three-state-niss-plan.json"
CAP_RECORD_PATH = STAGING_DIR / "registrar-cap-applied.json"

METRIC_ORDER = ["BI", "CR", "CD", "CV", "RV", "NP"]
UNKNOWN = "unknown"
SCORED, PROVISIONAL, UNSCORED = "scored", "provisional", "unscored"
UNSCORED_REASONS = {"preprint_only", "no_source", "no_metric_supported"}
CAPPED_STATUS = "THEORETICAL"
NISS_SEVERITY_ORDER = ["critical", "high", "medium", "low", "none"]
ALIAS_PATTERN = re.compile(r"^TARA-([A-Z]+)-([RMD])-(\d{3})$")
ID_PATTERN = re.compile(r"^QIF-T(\d{4})$")
DUPLICATE_NAME_OVERLAP = 0.6
ARXIV_ABS_URL = "https://arxiv.org/abs/"
ARXIV_PAUSE_SECONDS = 4.0
HTTP_TIMEOUT_SECONDS = 30


def load_module(file_name: str, module_name: str) -> Any:
    spec = importlib.util.spec_from_file_location(module_name, SCRIPTS_DIR / file_name)
    if spec is None or spec.loader is None:
        raise RuntimeError(f"cannot load {file_name}")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


PEER_REVIEW_RULES = load_module("migrate-peer-review-status.py", "migrate_peer_review_status")
FIXES = load_module("migrate-registrar-fixes.py", "migrate_registrar_fixes")
NEURORIGHTS = load_module("enrich-neurorights.py", "enrich_neurorights")
MigrationError = FIXES.MigrationError


def compute_niss_score(metric_codes: Dict[str, str], niss_spec: Dict[str, Any]) -> float:
    """niss_spec formula: sum(w_i * M_i) / sum(w_i), default weights, ceil to one decimal."""
    weights = niss_spec["weights"]["default"]
    weighted_sum = sum(weights[metric] * niss_spec["metrics"][metric]["values"][metric_codes[metric]]
                       for metric in METRIC_ORDER)
    raw_score = weighted_sum / sum(weights[metric] for metric in METRIC_ORDER)
    return math.ceil(round(raw_score * 10, 6)) / 10


def compute_score_bounds(metric_codes: Dict[str, str], niss_spec: Dict[str, Any]) -> Tuple[float, float]:
    """Lowest and highest formula result when each unknown metric ranges over its allowed values."""
    unknown_metrics = [metric for metric in METRIC_ORDER if metric_codes[metric] == UNKNOWN]
    allowed_values = [list(niss_spec["metrics"][metric]["values"]) for metric in unknown_metrics]
    scores = [compute_niss_score({**metric_codes, **dict(zip(unknown_metrics, combination))}, niss_spec)
              for combination in itertools.product(*allowed_values)]
    return min(scores), max(scores)


def parse_vector(vector: str) -> Dict[str, str]:
    parts = dict(part.split(":") for part in vector.split("/")[1:])
    if sorted(parts) != sorted(METRIC_ORDER):
        raise MigrationError(f"vector {vector!r} does not hold exactly the six NISS metrics")
    return parts


def assert_scored_entries_match_formula(techniques: List[Dict[str, Any]], niss_spec: Dict[str, Any]) -> int:
    checked = 0
    for technique in techniques:
        niss = technique.get("niss") or {}
        if niss.get("score") is None:
            continue
        expected = compute_niss_score(parse_vector(niss["vector"]), niss_spec)
        if expected != niss["score"]:
            raise MigrationError(f"{technique['id']}: stored score {niss['score']} but the formula gives {expected}")
        checked += 1
    return checked


def name_tokens(name: str) -> set:
    return {token for token in FIXES.normalise(name).split() if len(token) > 3}


def check_not_duplicate(entry: Dict[str, Any], existing: List[Dict[str, Any]]) -> None:
    """Refuse a new entry whose name matches, or mostly overlaps, an existing entry's name."""
    new_tokens = name_tokens(entry["attack"])
    for technique in existing:
        old_tokens = name_tokens(technique["attack"])
        union = new_tokens | old_tokens
        overlap = len(new_tokens & old_tokens) / len(union) if union else 0.0
        if overlap >= DUPLICATE_NAME_OVERLAP:
            raise MigrationError(f"new entry {entry['attack']!r} duplicates {technique['id']} ({technique['attack']!r})")


def technique_number(technique_id: str) -> int:
    """Sequence number of a technique id. A variant id (QIF-Tnnnn-Vnn) is refused: variants are not techniques."""
    match = ID_PATTERN.match(technique_id)
    if match is None:
        raise MigrationError(f"{technique_id!r} is not a technique id of the form QIF-Tnnnn")
    return int(match.group(1))


def next_alias(techniques: List[Dict[str, Any]], domain: str, mode: str) -> str:
    """TARA-{DOMAIN}-{MODE}-{NNN}, NNN sequential within the domain-mode pair, from current state."""
    used = [int(match.group(3)) for match in (ALIAS_PATTERN.match(t.get("tara_alias") or "") for t in techniques)
            if match and match.group(1) == domain and match.group(2) == mode]
    return f"TARA-{domain}-{mode}-{max(used, default=0) + 1:03d}"


def build_new_technique(planned: Dict[str, Any], techniques: List[Dict[str, Any]]) -> Dict[str, Any]:
    entry = json.loads(json.dumps(planned["entry"]))
    derived_status, _ = PEER_REVIEW_RULES.classify_sources(entry["sources"])
    alias = next_alias(techniques, entry["tara_domain_primary"], entry["tara_mode"])
    entry["neurorights"]["cci"] = NEURORIGHTS.compute_cci(entry, entry["neurorights"]["affected"])
    built: Dict[str, Any] = {"id": planned["id"]}
    for key, value in entry.items():
        built[key] = value
        if key == "defensive_sources":
            built["peer_review_status"] = derived_status
        if key == "technique":
            built["tara_alias"] = alias
    return built


def add_new_techniques(registrar: Dict[str, Any], plan: Dict[str, Any]) -> List[str]:
    techniques = registrar["techniques"]
    known_ids = {technique["id"] for technique in techniques}
    log: List[str] = []
    for planned in plan["new_techniques"]:
        if planned["id"] in known_ids:
            continue
        highest = max(technique_number(technique["id"]) for technique in techniques)
        if planned["id"] != f"QIF-T{highest + 1:04d}":
            raise MigrationError(f"{planned['id']} does not continue from QIF-T{highest:04d}")
        check_not_duplicate(planned["entry"], techniques)
        built = build_new_technique(planned, techniques)
        techniques.append(built)
        log.append(f"added {built['id']} [{built['peer_review_status']}, {built['status']}, {built['tara_alias']}] {built['attack']}")
    return log


def provisional_niss(tid: str, planned: Dict[str, Any], niss_spec: Dict[str, Any]) -> Dict[str, Any]:
    metric_codes = {metric: planned["metrics"].get(metric, UNKNOWN) for metric in METRIC_ORDER}
    supported = [metric for metric in METRIC_ORDER if metric_codes[metric] != UNKNOWN]
    if not supported or len(supported) == len(METRIC_ORDER):
        raise MigrationError(f"{tid}: a provisional entry needs at least one supported and one unknown metric")
    if sorted(planned["metric_evidence"]) != sorted(supported):
        raise MigrationError(f"{tid}: metric_evidence must cover exactly the supported metrics")
    for metric in supported:
        if metric_codes[metric] not in niss_spec["metrics"][metric]["values"]:
            raise MigrationError(f"{tid}: {metric}:{metric_codes[metric]} is not an allowed value")
    score_min, score_max = compute_score_bounds(metric_codes, niss_spec)
    return {"version": niss_spec["version"], "scoring_state": PROVISIONAL, "metrics": metric_codes,
            "score_min": score_min, "score_max": score_max,
            "metric_evidence": {metric: planned["metric_evidence"][metric] for metric in supported}}


def insertion_anchors(plan: Dict[str, Any]) -> Dict[str, str]:
    """Key each removed niss object used to follow, from the cap record written by the earlier migration."""
    cap_record = json.loads(CAP_RECORD_PATH.read_text(encoding="utf-8"))
    return {entry["id"]: entry["niss_followed_key"] for entry in cap_record["entries"] if entry.get("niss_followed_key")}


def place_niss(technique: Dict[str, Any], niss: Dict[str, Any], anchor: Any, defaults: List[str]) -> Dict[str, Any]:
    if "niss" in technique:
        technique["niss"] = niss
        return technique
    anchor_key = next(key for key in [anchor, *defaults] if key and key in technique)
    return PEER_REVIEW_RULES.insert_after(technique, anchor_key, {"niss": niss})


def apply_scoring_states(registrar: Dict[str, Any], plan: Dict[str, Any]) -> List[str]:
    niss_spec = registrar["niss_spec"]
    anchors = insertion_anchors(plan)
    defaults = plan["niss_followed_key_default"]
    log: List[str] = []
    for index, technique in enumerate(registrar["techniques"]):
        tid = technique["id"]
        current = technique.get("niss") or {}
        if current.get("score") is not None:
            if tid in plan["provisional"] or tid in plan["unscored"]:
                raise MigrationError(f"{tid} holds a score; this migration does not re-derive scored entries")
            desired = {**current, "scoring_state": SCORED}
        elif tid in plan["provisional"]:
            desired = provisional_niss(tid, plan["provisional"][tid], niss_spec)
        elif tid in plan["unscored"]:
            if plan["unscored"][tid] not in UNSCORED_REASONS:
                raise MigrationError(f"{tid}: unknown unscored_reason {plan['unscored'][tid]!r}")
            desired = {"version": niss_spec["version"], "scoring_state": UNSCORED, "unscored_reason": plan["unscored"][tid]}
        else:
            raise MigrationError(f"{tid} has no score and the plan gives it no scoring state")
        if current == desired:
            continue
        registrar["techniques"][index] = place_niss(technique, desired, anchors.get(tid), defaults)
        detail = f" {desired['score_min']} to {desired['score_max']}" if desired["scoring_state"] == PROVISIONAL else ""
        if desired["scoring_state"] != SCORED:
            log.append(f"{tid} niss.scoring_state = {desired['scoring_state']}{detail} {desired.get('unscored_reason', '')}".rstrip())
    return log


def check_gate(techniques: List[Dict[str, Any]], status_before: Dict[str, str]) -> None:
    for technique in techniques:
        tid, niss = technique["id"], technique["niss"]
        derived, _ = PEER_REVIEW_RULES.classify_sources(technique["sources"])
        if technique["peer_review_status"] != derived:
            raise MigrationError(f"{tid}: peer_review_status is {technique['peer_review_status']} but its sources give {derived}")
        if tid in status_before and status_before[tid] != derived:
            raise MigrationError(f"{tid}: this migration would change its peer_review_status")
        if derived == PEER_REVIEW_RULES.PEER_REVIEWED:
            continue
        if technique["status"] not in PEER_REVIEW_RULES.STATUSES_NOT_ABOVE_THEORETICAL:
            raise MigrationError(f"{tid} is {derived} but holds status {technique['status']}")
        if niss["scoring_state"] != UNSCORED:
            raise MigrationError(f"{tid} is {derived} but is not unscored")


def recompute_statistics(registrar: Dict[str, Any]) -> List[str]:
    techniques, statistics = registrar["techniques"], registrar["statistics"]
    fresh: Dict[str, Any] = {"total_techniques": len(techniques)}
    for key, field in [("by_tactic", "tactic"), ("by_status", "status"), ("by_severity", "severity"), ("by_ui_category", "ui_category")]:
        counts = Counter(technique[field] for technique in techniques)
        if set(counts) - set(statistics[key]):
            raise MigrationError(f"statistics.{key} does not list {sorted(set(counts) - set(statistics[key]))}")
        fresh[key] = {name: counts[name] for name in statistics[key]}
    severity_counts = Counter(technique["niss"].get("severity", "none") for technique in techniques)
    fresh["by_niss_severity"] = {severity: severity_counts.get(severity, 0) for severity in NISS_SEVERITY_ORDER}
    state_counts = Counter(technique["niss"]["scoring_state"] for technique in techniques)
    fresh["by_scoring_state"] = {state: state_counts.get(state, 0) for state in (SCORED, PROVISIONAL, UNSCORED)}
    log = [f"statistics.{key}: {statistics.get(key)} -> {value}" for key, value in fresh.items() if statistics.get(key) != value]
    rebuilt: Dict[str, Any] = {}
    for key, value in statistics.items():
        rebuilt[key] = fresh.get(key, value)
        if key == "by_niss_severity":
            rebuilt["by_scoring_state"] = fresh["by_scoring_state"]
    registrar["statistics"] = rebuilt
    return log


def fetch_arxiv_metadata(arxiv_id: str) -> Tuple[str, List[str]]:
    request = urllib.request.Request(ARXIV_ABS_URL + arxiv_id, headers={"User-Agent": "qtara-registrar-migration/1.0"})
    try:
        with urllib.request.urlopen(request, timeout=HTTP_TIMEOUT_SECONDS) as response:
            page = response.read().decode("utf-8")
    except (urllib.error.URLError, TimeoutError) as error:
        raise MigrationError(f"arXiv:{arxiv_id} could not be checked: {error}") from error
    title = re.search(r'citation_title" content="(.*?)"', page)
    authors = re.findall(r'citation_author" content="(.*?)"', page)
    if not title or not authors:
        raise MigrationError(f"arXiv:{arxiv_id}: the abstract page carries no title or author metadata")
    return title.group(1), authors


def verify_sources(plan: Dict[str, Any]) -> None:
    print(f"Verifying {len(plan['citations'])} DOIs at Crossref:")
    FIXES.verify_dois(plan["citations"])
    print(f"Verifying {len(plan['arxiv'])} arXiv ids on their abstract pages:")
    for arxiv_id, expected in plan["arxiv"].items():
        title, authors = fetch_arxiv_metadata(arxiv_id)
        if FIXES.normalise(title) != FIXES.normalise(expected["title"]) or not authors[0].startswith(expected["first_author"]):
            raise MigrationError(f"arXiv:{arxiv_id}: title or first author differs from the plan")
        print(f"  verified arXiv:{arxiv_id}  {authors[0]}")
        time.sleep(ARXIV_PAUSE_SECONDS)


def report_matrix(techniques: List[Dict[str, Any]]) -> List[str]:
    """Domain x mode cells with no technique, by alias and by the tara_domain_primary / tara_mode fields."""
    aliases = [match.groups()[:2] for match in (ALIAS_PATTERN.match(t.get("tara_alias") or "") for t in techniques) if match]
    domains = sorted({domain for domain, _ in aliases})
    by_field = {(t.get("tara_domain_primary"), t.get("tara_mode")) for t in techniques}
    cells = [(domain, mode) for domain in domains for mode in "RMD"]
    return [f"domain x mode matrix: {len(domains)} domains x 3 modes = {len(cells)} cells",
            f"  empty by alias: {[cell for cell in cells if cell not in set(aliases)] or 'none'}",
            f"  empty by tara_domain_primary/tara_mode fields: {[cell for cell in cells if cell not in by_field] or 'none'}",
            f"  techniques with no alias: {[t['id'] for t in techniques if not t.get('tara_alias')] or 'none'}"]


def migrate(registrar: Dict[str, Any], plan: Dict[str, Any]) -> List[str]:
    total_before = len(registrar["techniques"])
    is_fresh = registrar["version"] == plan["version"]["from"]
    if is_fresh and total_before != plan["expected_total_before"]:
        raise MigrationError(f"registrar holds {total_before} techniques; the plan expects {plan['expected_total_before']}")
    checked = assert_scored_entries_match_formula(registrar["techniques"], registrar["niss_spec"])
    status_before = {technique["id"]: technique["peer_review_status"] for technique in registrar["techniques"]}
    by_id = {technique["id"]: technique for technique in registrar["techniques"]}
    log = [f"formula check: {checked} stored scores equal the niss_spec formula result"]
    log += FIXES.apply_operations(by_id, plan["parent_operations"])
    log += add_new_techniques(registrar, plan)
    log += apply_scoring_states(registrar, plan)
    check_gate(registrar["techniques"], status_before)
    if assert_scored_entries_match_formula(registrar["techniques"], registrar["niss_spec"]) != checked:
        raise MigrationError("the number of scored entries changed")
    log += recompute_statistics(registrar)
    log += FIXES.bump_version(registrar, plan)
    for key, value in plan["schema_extension"].items():
        if registrar["schema_extensions"].get(key) != value:
            registrar["schema_extensions"][key] = value
            log.append(f"schema_extensions.{key} written")
    return log


def run(is_dry_run: bool, should_verify_sources: bool) -> None:
    registrar_text, registrar = FIXES.read_round_trip_json(REGISTRAR_PATH, PEER_REVIEW_RULES.serialise)
    plan = json.loads(PLAN_PATH.read_text(encoding="utf-8"))
    if should_verify_sources:
        verify_sources(plan)
    change_log = migrate(registrar, plan)
    migrated_text = PEER_REVIEW_RULES.serialise(registrar)
    print(f"{'DRY RUN: ' if is_dry_run else ''}{REGISTRAR_PATH.name}")
    for line in change_log + report_matrix(registrar["techniques"]):
        print(f"  {line}")
    print(f"\nTechniques: {len(registrar['techniques'])}; by_scoring_state: {registrar['statistics']['by_scoring_state']}")
    print(f"Line count change: {migrated_text.count(chr(10)) - registrar_text.count(chr(10)):+d}")
    if is_dry_run:
        print("\nDRY RUN: no file was written.")
        return
    if migrated_text != registrar_text:
        REGISTRAR_PATH.write_text(migrated_text, encoding="utf-8")
    SDK_REGISTRAR_PATH.write_text(migrated_text, encoding="utf-8")
    print(f"\nWrote {REGISTRAR_PATH.name} and the SDK copy")


def main() -> int:
    parser = argparse.ArgumentParser(description="Add the 2026-10 techniques and the three-state NISS model.")
    parser.add_argument("--dry-run", action="store_true", help="report what would change; write nothing")
    parser.add_argument("--verify-sources", action="store_true", help="resolve every DOI at Crossref and every arXiv id first")
    arguments = parser.parse_args()
    try:
        run(arguments.dry_run, arguments.verify_sources)
    except MigrationError as error:
        print(f"ERROR: {error}. Nothing was changed.", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
