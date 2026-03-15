#!/usr/bin/env python3
"""
Migration script: Split ICD-10 codes from DSM-5 field into separate icd10 field.

DSM-5-TR codes are F-codes only (F01-F99). Non-F codes (G, H, R, etc.) are
ICD-10-CM codes that belong in a separate field.

Usage:
    python3 shared/scripts/migrate-dsm5-icd10.py --dry-run   # Preview changes
    python3 shared/scripts/migrate-dsm5-icd10.py              # Apply changes
"""

import json
import sys
import os

REGISTRAR_PATH = os.path.join(os.path.dirname(__file__), "..", "qtara-registrar.json")

def migrate(dry_run=False):
    with open(REGISTRAR_PATH, "r") as f:
        raw = f.read()

    data = json.loads(raw)
    techniques = data.get("techniques", [])

    affected_count = 0
    codes_moved = 0

    for t in techniques:
        # dsm5 is nested inside tara (technique.tara.dsm5)
        tara = t.get("tara")
        if not tara or not isinstance(tara, dict):
            continue
        dsm5 = tara.get("dsm5")
        if not dsm5:
            continue

        icd10_primary = []
        icd10_secondary = []
        dsm5_primary = []
        dsm5_secondary = []

        has_icd = False

        for entry in dsm5.get("primary", []):
            code = entry.get("code", "")
            if code and not code.startswith("F"):
                icd10_primary.append(entry)
                has_icd = True
                codes_moved += 1
            else:
                dsm5_primary.append(entry)

        for entry in dsm5.get("secondary", []):
            code = entry.get("code", "")
            if code and not code.startswith("F"):
                icd10_secondary.append(entry)
                has_icd = True
                codes_moved += 1
            else:
                dsm5_secondary.append(entry)

        if not has_icd:
            continue

        affected_count += 1

        if dry_run:
            print(f"\n{t['id']} ({t.get('attack', t.get('technique', 'unknown'))}):")
            for e in icd10_primary:
                print(f"  primary -> icd10: {e['code']} ({e.get('name', '')})")
            for e in icd10_secondary:
                print(f"  secondary -> icd10: {e['code']} ({e.get('name', '')})")
            continue

        # Update dsm5 field - keep only F-codes
        dsm5["primary"] = dsm5_primary
        dsm5["secondary"] = dsm5_secondary

        # Create icd10 field with same structure, as sibling of dsm5 inside tara
        icd10 = {}
        if icd10_primary:
            icd10["primary"] = icd10_primary
        if icd10_secondary:
            icd10["secondary"] = icd10_secondary

        # Copy relevant metadata fields
        if "risk_class" in dsm5:
            icd10["risk_class"] = dsm5["risk_class"]
        if "cluster" in dsm5:
            icd10["cluster"] = dsm5["cluster"]

        tara["icd10"] = icd10

    print(f"\nTechniques affected: {affected_count}")
    print(f"ICD-10 codes moved: {codes_moved}")

    if dry_run:
        print("\n[DRY RUN] No changes written.")
        return

    # Write back with same formatting (2-space indent)
    with open(REGISTRAR_PATH, "w") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
        f.write("\n")

    print(f"\nWrote updated registrar to {REGISTRAR_PATH}")


if __name__ == "__main__":
    dry_run = "--dry-run" in sys.argv
    migrate(dry_run=dry_run)
