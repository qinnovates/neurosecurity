#!/usr/bin/env python3
"""
Registrar migration, 2026-10-06 (scholar-refresh changes).

Applies four changes to datalake/qtara-registrar.json, then syncs the SDK copy:

  1. QIF-T0066: the notes and cross_references.related_ids point at QIF-T0045
     (harvest-now-decrypt-later) where QIF-T0062 (gradual drift) is meant.
     The same sentence is corrected in datalake/qtara/test_stix.json.
  2. QIF-T0116: add band N2 (the entry names the VTA, which addressing
     version 2 places in N2). N5 and N6 are kept.
  3. New field `peer_review_status` on every technique, derived from `sources`:
       "none"          sources is empty
       "preprint"      at least one source carries an identifier and every
                       identifier carried is an arXiv, bioRxiv or medRxiv id
       "peer_reviewed" otherwise
  4. New field `defensive_sources` on every technique, default []. Nothing is
     moved into it. The citation gate counts only `sources`.

Cap rule (reported, never enforced here): a technique whose peer_review_status
is "preprint" or "none" may not hold a status above THEORETICAL and must not
carry a NISS score. Entries that break the rule are listed for a human
decision. This script does not change any status or score.

The file is rewritten only if a load/dump round trip of the untouched file is
byte-identical, so the diff contains the intended lines and nothing else.

Usage (from the repository root):
    python3 datalake/scripts/migrate-peer-review-status.py --dry-run
    python3 datalake/scripts/migrate-peer-review-status.py
"""

import argparse
import json
import re
import sys
from pathlib import Path
from typing import Any, Dict, List, Tuple

DATALAKE_DIR = Path(__file__).resolve().parent.parent
REGISTRAR_PATH = DATALAKE_DIR / "qtara-registrar.json"
SDK_REGISTRAR_PATH = DATALAKE_DIR / "qtara" / "src" / "qtara" / "data" / "qtara-registrar.json"
STIX_FIXTURE_PATH = DATALAKE_DIR / "qtara" / "test_stix.json"

MIGRATION_DATE = "2026-10-06"

DRIFT_TECHNIQUE_ID = "QIF-T0066"
WRONG_DRIFT_REFERENCE = "QIF-T0045"
RIGHT_DRIFT_REFERENCE = "QIF-T0062"
WRONG_DRIFT_PHRASE = f"Unlike generic gradual drift ({WRONG_DRIFT_REFERENCE})"
RIGHT_DRIFT_PHRASE = f"Unlike generic gradual drift ({RIGHT_DRIFT_REFERENCE})"

BAND_TECHNIQUE_ID = "QIF-T0116"
BAND_IDS_BEFORE = ["N5", "N6"]
BAND_IDS_AFTER = ["N2", "N5", "N6"]
BANDS_BEFORE = "N5-N6"
BANDS_AFTER = "N2,N5-N6"

PEER_REVIEWED = "peer_reviewed"
PREPRINT = "preprint"
NO_SOURCES = "none"

STATUSES_NOT_ABOVE_THEORETICAL = {"THEORETICAL", "SPECULATIVE"}

# Identifier patterns found in the free-text `sources` strings.
PREPRINT_ID_PATTERNS = [
    re.compile(r"arXiv\s*:\s*[\w.\-/]+", re.IGNORECASE),
    re.compile(r"10\.48550/arXiv\.[\w.\-]+", re.IGNORECASE),
    re.compile(r"(?:bio|med)Rxiv\s*:?\s*[\w.\-/]+", re.IGNORECASE),
    # bioRxiv and medRxiv DOIs: 10.1101/2024.01.02.123456 or 10.1101/123456
    re.compile(r"10\.1101/(?:\d{4}\.\d{2}\.\d{2}\.\d+|\d{6})(?!\w)"),
]
DOI_PATTERN = re.compile(r"10\.\d{4,9}/[^\s,;)]+")
REVIEWED_ID_PATTERNS = [
    re.compile(r"PMID\s*:?\s*\d+", re.IGNORECASE),
    re.compile(r"PMC\d+"),
]

SCHEMA_EXTENSIONS = {
    "peer_review_status": {
        "added": MIGRATION_DATE,
        "description": (
            "Derived from sources. A preprint identifier verifies that the source exists "
            "but does not satisfy the peer-review requirement. A technique whose value is "
            "'preprint' or 'none' may not hold a status above THEORETICAL and must not carry "
            "a NISS score."
        ),
        "format": {
            "none": "sources is empty",
            "preprint": (
                "At least one source carries an identifier and every identifier carried is "
                "an arXiv, bioRxiv or medRxiv id"
            ),
            "peer_reviewed": (
                "Otherwise. Includes entries whose sources carry no identifier at all; "
                "those are not verified by this field"
            ),
        },
    },
    "defensive_sources": {
        "added": MIGRATION_DATE,
        "description": (
            "Defence-side sources (controls, mitigations, benchmarks) kept apart from the "
            "evidence in sources. The citation gate counts only sources."
        ),
        "format": "Array of citation strings; default empty",
    },
}


class MigrationError(Exception):
    """The registrar is not in the state this migration expects."""


def serialise(document: Dict[str, Any]) -> str:
    """Serialise in the registrar's existing on-disk format."""
    return json.dumps(document, indent=2, ensure_ascii=False) + "\n"


def find_identifiers(source: str) -> Tuple[List[str], List[str]]:
    """Return (preprint identifiers, peer-reviewed identifiers) found in one source string."""
    preprint_ids: List[str] = []
    for pattern in PREPRINT_ID_PATTERNS:
        preprint_ids.extend(pattern.findall(source))
    reviewed_ids = [
        doi for doi in DOI_PATTERN.findall(source)
        if not any(pattern.search(doi) for pattern in PREPRINT_ID_PATTERNS)
    ]
    for pattern in REVIEWED_ID_PATTERNS:
        reviewed_ids.extend(pattern.findall(source))
    return preprint_ids, reviewed_ids


def classify_sources(sources: List[str]) -> Tuple[str, bool]:
    """Return (peer_review_status, has_any_identifier) for one technique's sources."""
    if not sources:
        return NO_SOURCES, False
    preprint_count = 0
    reviewed_count = 0
    for source in sources:
        preprint_ids, reviewed_ids = find_identifiers(source)
        preprint_count += len(preprint_ids)
        reviewed_count += len(reviewed_ids)
    if preprint_count > 0 and reviewed_count == 0:
        return PREPRINT, True
    return PEER_REVIEWED, (preprint_count + reviewed_count) > 0


def insert_after(entry: Dict[str, Any], anchor_key: str, additions: Dict[str, Any]) -> Dict[str, Any]:
    """Rebuild `entry` with `additions` placed directly after `anchor_key`; existing keys keep their place."""
    if anchor_key not in entry:
        raise MigrationError(f"{entry.get('id')}: expected key '{anchor_key}' is missing")
    rebuilt: Dict[str, Any] = {}
    for key, value in entry.items():
        rebuilt[key] = value
        if key == anchor_key:
            for new_key, new_value in additions.items():
                if new_key not in entry:
                    rebuilt[new_key] = new_value
    return rebuilt


def fix_drift_reference(technique: Dict[str, Any], log: List[str]) -> None:
    notes = technique.get("notes") or ""
    if WRONG_DRIFT_PHRASE in notes:
        technique["notes"] = notes.replace(WRONG_DRIFT_PHRASE, RIGHT_DRIFT_PHRASE)
        log.append(f"{DRIFT_TECHNIQUE_ID} notes: {WRONG_DRIFT_REFERENCE} -> {RIGHT_DRIFT_REFERENCE}")
    elif RIGHT_DRIFT_PHRASE not in notes:
        raise MigrationError(f"{DRIFT_TECHNIQUE_ID}: the drift sentence was not found in notes; inspect by hand")
    related_ids = technique.get("cross_references", {}).get("related_ids", [])
    if WRONG_DRIFT_REFERENCE in related_ids:
        technique["cross_references"]["related_ids"] = [
            RIGHT_DRIFT_REFERENCE if related_id == WRONG_DRIFT_REFERENCE else related_id
            for related_id in related_ids
        ]
        log.append(f"{DRIFT_TECHNIQUE_ID} related_ids: {related_ids} -> {technique['cross_references']['related_ids']}")
    elif RIGHT_DRIFT_REFERENCE not in related_ids:
        raise MigrationError(f"{DRIFT_TECHNIQUE_ID}: related_ids is {related_ids}; inspect by hand")


def add_midbrain_band(technique: Dict[str, Any], log: List[str]) -> None:
    if technique["band_ids"] == BAND_IDS_AFTER and technique["bands"] == BANDS_AFTER:
        return
    if technique["band_ids"] != BAND_IDS_BEFORE or technique["bands"] != BANDS_BEFORE:
        raise MigrationError(
            f"{BAND_TECHNIQUE_ID}: bands are {technique['bands']!r} / {technique['band_ids']}; inspect by hand"
        )
    technique["band_ids"] = list(BAND_IDS_AFTER)
    technique["bands"] = BANDS_AFTER
    log.append(f"{BAND_TECHNIQUE_ID} band_ids: {BAND_IDS_BEFORE} -> {BAND_IDS_AFTER}; bands: {BANDS_BEFORE!r} -> {BANDS_AFTER!r}")


def has_niss_score(technique: Dict[str, Any]) -> bool:
    niss = technique.get("niss")
    return isinstance(niss, dict) and niss.get("score") is not None


def find_cap_rule_breaches(techniques: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    breaches = []
    for technique in techniques:
        if technique["peer_review_status"] == PEER_REVIEWED:
            continue
        status_too_high = technique["status"] not in STATUSES_NOT_ABOVE_THEORETICAL
        scored = has_niss_score(technique)
        if status_too_high or scored:
            breaches.append({
                "id": technique["id"],
                "peer_review_status": technique["peer_review_status"],
                "status": technique["status"],
                "status_above_theoretical": status_too_high,
                "niss_score": technique["niss"]["score"] if scored else None,
            })
    return breaches


def migrate(registrar: Dict[str, Any]) -> Dict[str, Any]:
    """Apply all changes in memory and return a report. Never touches status or NISS."""
    change_log: List[str] = []
    techniques = registrar["techniques"]
    by_id = {technique["id"]: index for index, technique in enumerate(techniques)}
    for required_id in (DRIFT_TECHNIQUE_ID, RIGHT_DRIFT_REFERENCE, BAND_TECHNIQUE_ID):
        if required_id not in by_id:
            raise MigrationError(f"{required_id} is not in the registrar")

    fix_drift_reference(techniques[by_id[DRIFT_TECHNIQUE_ID]], change_log)
    add_midbrain_band(techniques[by_id[BAND_TECHNIQUE_ID]], change_log)

    fields_added = 0
    without_identifier: List[str] = []
    for index, technique in enumerate(techniques):
        derived_status, has_identifier = classify_sources(technique.get("sources", []))
        if "peer_review_status" in technique and technique["peer_review_status"] != derived_status:
            raise MigrationError(
                f"{technique['id']}: existing peer_review_status {technique['peer_review_status']!r} "
                f"differs from the derived value {derived_status!r}; resolve by hand"
            )
        if derived_status == PEER_REVIEWED and not has_identifier:
            without_identifier.append(technique["id"])
        additions = {"defensive_sources": [], "peer_review_status": derived_status}
        fields_added += sum(1 for key in additions if key not in technique)
        techniques[index] = insert_after(technique, "sources", additions)
    if fields_added:
        change_log.append(f"added {fields_added} field values across {len(techniques)} techniques")

    extensions = registrar.setdefault("schema_extensions", {})
    for name, definition in SCHEMA_EXTENSIONS.items():
        if name not in extensions:
            extensions[name] = definition
            change_log.append(f"schema_extensions.{name} added")

    counts: Dict[str, int] = {PEER_REVIEWED: 0, PREPRINT: 0, NO_SOURCES: 0}
    for technique in techniques:
        counts[technique["peer_review_status"]] += 1

    return {
        "change_log": change_log,
        "counts": counts,
        "preprint": [t for t in techniques if t["peer_review_status"] == PREPRINT],
        "none": [t for t in techniques if t["peer_review_status"] == NO_SOURCES],
        "peer_reviewed_without_identifier": without_identifier,
        "cap_rule_breaches": find_cap_rule_breaches(techniques),
    }


def describe(technique: Dict[str, Any]) -> str:
    score = technique["niss"]["score"] if has_niss_score(technique) else "-"
    return f"  {technique['id']}  {technique['status']:<12}  NISS {score!s:<4}  {technique['attack']}"


def print_report(report: Dict[str, Any], total: int) -> None:
    print("Changes:")
    for line in report["change_log"] or ["  (none: already applied)"]:
        print(f"  {line}" if not line.startswith("  ") else line)
    print(f"\npeer_review_status across {total} techniques: {report['counts']}")
    print(f"\nClassed 'preprint' ({len(report['preprint'])}):")
    for technique in report["preprint"]:
        print(describe(technique))
        for source in technique["sources"]:
            print(f"      source: {source}")
    print(f"\nClassed 'none' ({len(report['none'])}):")
    for technique in report["none"]:
        print(describe(technique))
    unidentified = report["peer_reviewed_without_identifier"]
    print(
        f"\nClassed 'peer_reviewed' with no DOI, PMID, PMC or preprint id in any source "
        f"({len(unidentified)}); the rule puts them here by default, and nothing verifies them:"
    )
    print("  " + ", ".join(unidentified))
    breaches = report["cap_rule_breaches"]
    print(f"\nCap rule breaches, left unchanged for a human decision ({len(breaches)}):")
    for breach in breaches:
        reasons = []
        if breach["status_above_theoretical"]:
            reasons.append(f"status {breach['status']} is above THEORETICAL")
        if breach["niss_score"] is not None:
            reasons.append(f"carries NISS score {breach['niss_score']}")
        print(f"  {breach['id']}  [{breach['peer_review_status']}]  " + "; ".join(reasons))


def migrate_stix_fixture(is_dry_run: bool) -> None:
    if not STIX_FIXTURE_PATH.exists():
        print(f"\n{STIX_FIXTURE_PATH.name}: not found, skipped")
        return
    fixture_text = STIX_FIXTURE_PATH.read_text(encoding="utf-8")
    occurrences = fixture_text.count(WRONG_DRIFT_PHRASE)
    print(f"\n{STIX_FIXTURE_PATH.name}: {occurrences} occurrence(s) of the wrong drift reference")
    if occurrences and not is_dry_run:
        STIX_FIXTURE_PATH.write_text(fixture_text.replace(WRONG_DRIFT_PHRASE, RIGHT_DRIFT_PHRASE), encoding="utf-8")
        print(f"{STIX_FIXTURE_PATH.name}: corrected")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    parser.add_argument("--dry-run", action="store_true", help="report what would change; write nothing")
    arguments = parser.parse_args()

    original_text = REGISTRAR_PATH.read_text(encoding="utf-8")
    registrar = json.loads(original_text)
    if serialise(registrar) != original_text:
        print(
            f"ERROR: {REGISTRAR_PATH.name} does not survive a load/dump round trip byte-for-byte. "
            "Writing it would reformat the file. Nothing was changed; apply the edits in place instead.",
            file=sys.stderr,
        )
        return 1

    total_before = len(registrar["techniques"])
    try:
        report = migrate(registrar)
    except MigrationError as error:
        print(f"ERROR: {error}. Nothing was changed.", file=sys.stderr)
        return 1

    if len(registrar["techniques"]) != total_before or total_before != registrar["statistics"]["total_techniques"]:
        print("ERROR: technique count does not match statistics.total_techniques. Nothing was changed.", file=sys.stderr)
        return 1

    print(f"{'DRY RUN: ' if arguments.dry_run else ''}{REGISTRAR_PATH.name}")
    print_report(report, total_before)

    migrated_text = serialise(registrar)
    added_lines = migrated_text.count("\n") - original_text.count("\n")
    print(f"\nRegistrar line count change: +{added_lines}")
    migrate_stix_fixture(arguments.dry_run)

    if arguments.dry_run:
        print("\nDRY RUN: no file was written.")
        return 0

    if migrated_text != original_text:
        REGISTRAR_PATH.write_text(migrated_text, encoding="utf-8")
        print(f"\nWrote {REGISTRAR_PATH.name}")
    SDK_REGISTRAR_PATH.write_text(migrated_text, encoding="utf-8")
    print(f"Synced SDK copy: {SDK_REGISTRAR_PATH.relative_to(DATALAKE_DIR)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
