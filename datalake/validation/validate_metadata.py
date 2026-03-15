#!/usr/bin/env python3
"""Validate repo-metadata.json against actual repository state.

Checks that all referenced paths exist and metadata is not stale.
Used in CI (qa.yml) and locally before commits.
"""

import json
import sys
from datetime import datetime, timedelta
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent.parent
METADATA_FILE = REPO_ROOT / "repo-metadata.json"
STALE_DAYS = 30


def load_metadata():
    with open(METADATA_FILE) as f:
        return json.load(f)


def check_paths_exist(paths, label):
    errors = []
    for p in paths:
        # Skip cross-branch references
        if "(in drafts branch)" in p:
            continue
        full = REPO_ROOT / p
        if not full.exists():
            errors.append(f"[{label}] Missing: {p}")
    return errors


def validate(metadata):
    errors = []

    # Governance docs
    errors += check_paths_exist(
        metadata["compliance"]["governance_docs"], "governance_docs"
    )

    # Package locations
    for pkg in metadata["packages"]:
        errors += check_paths_exist([pkg["location"]], f"package:{pkg['name']}")

    # NIST CSF component paths
    for func, info in metadata["nist_csf_mapping"].items():
        errors += check_paths_exist(info["components"], f"nist_csf:{func}")

    # Truth sources
    for key, path in metadata["truth_sources"].items():
        errors += check_paths_exist([path], f"truth_source:{key}")

    # Staleness check
    last_updated = datetime.strptime(metadata["_meta"]["last_updated"], "%Y-%m-%d")
    if datetime.now() - last_updated > timedelta(days=STALE_DAYS):
        days = (datetime.now() - last_updated).days
        print(f"WARNING: repo-metadata.json last updated {days} days ago")

    return errors


def main():
    if not METADATA_FILE.exists():
        print("ERROR: repo-metadata.json not found")
        sys.exit(1)

    metadata = load_metadata()
    errors = validate(metadata)

    if errors:
        print(f"FAILED: {len(errors)} error(s) in repo-metadata.json\n")
        for e in errors:
            print(f"  {e}")
        sys.exit(1)

    print("OK: repo-metadata.json validated successfully")
    print(f"  Schema version: {metadata['_meta']['schema_version']}")
    print(f"  Last updated: {metadata['_meta']['last_updated']}")
    print(f"  Governance docs: {len(metadata['compliance']['governance_docs'])}")
    print(f"  Packages: {len(metadata['packages'])}")
    print(f"  NIST CSF functions: {len(metadata['nist_csf_mapping'])}")


if __name__ == "__main__":
    main()
