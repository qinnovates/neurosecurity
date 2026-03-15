#!/usr/bin/env python3
"""Migrate qtara-registrar.json to add v2 taxonomy fields.

Adds tara_alias, tara_domain_primary, tara_domain_secondary, tara_mode,
tara_drift, tara_drift_window, tara_direction, use_context_tags,
biological_target, and copies 'attack' to 'technique' (keeping attack
as deprecated alias).

Idempotent: running twice produces the same result.

Usage:
    python3 migrate-taxonomy-v5.py                    # in-place
    python3 migrate-taxonomy-v5.py --dry-run           # preview
    python3 migrate-taxonomy-v5.py --output out.json   # write elsewhere
"""

import argparse
import json
import sys
from pathlib import Path

REGISTRAR_PATH = Path(__file__).resolve().parent.parent / "qtara-registrar.json"

# Silicon-only detection uses tara.dual_use == "silicon_only" as primary
# indicator (25 techniques per statistics), plus band_ids fallback for
# any technique whose bands are entirely in the silicon layer (S1/S2/S3).
# NOTE: ui_category SI/SE are NOT reliable silicon-only indicators —
# SI = Signal Injection (includes biological targets like electrode-tissue),
# SE = Signal Eavesdropping (includes neural signal interception).
SILICON_BANDS = {"S1", "S2", "S3"}

NEW_FIELDS_DEFAULTS = {
    "tara_alias": None,
    "tara_domain_primary": None,
    "tara_domain_secondary": [],
    "tara_mode": None,
    "tara_drift": None,
    "tara_drift_window": None,
    "tara_direction": None,
    "use_context_tags": [],
    "biological_target": True,
}


def is_silicon_only(t: dict) -> bool:
    """Determine if a technique targets silicon only (no biological target).

    Primary: tara.dual_use == "silicon_only" (existing enrichment).
    Fallback: all band_ids are in the silicon layer (S1/S2/S3).
    """
    dual_use = t.get("tara", {}).get("dual_use", "")
    if dual_use == "silicon_only":
        return True

    band_ids = t.get("band_ids", [])
    if band_ids and all(b in SILICON_BANDS for b in band_ids):
        return True

    return False


def migrate_technique(t: dict) -> dict:
    """Add v2 taxonomy fields to a single technique entry. Idempotent."""
    # Copy attack -> technique (only if technique not already set)
    if "technique" not in t and "attack" in t:
        t["technique"] = t["attack"]

    # Add each new field only if not already present
    for field, default in NEW_FIELDS_DEFAULTS.items():
        if field not in t:
            # Deep copy lists to avoid shared references
            t[field] = list(default) if isinstance(default, list) else default

    # Set biological_target based on silicon-only heuristics
    # Always re-evaluate so the flag stays current with the data
    t["biological_target"] = not is_silicon_only(t)

    return t


def migrate(data: dict) -> tuple[dict, int, int]:
    """Migrate the full registrar. Returns (data, total, silicon_count)."""
    techniques = data.get("techniques", [])
    silicon_count = 0

    for t in techniques:
        migrate_technique(t)
        if not t["biological_target"]:
            silicon_count += 1

    # Update statistics block
    stats = data.get("statistics", {})
    stats["tara_taxonomy_version"] = "provisional"

    return data, len(techniques), silicon_count


def validate(data: dict) -> list[str]:
    """Verify every technique has both attack and technique fields."""
    errors = []
    for i, t in enumerate(data.get("techniques", [])):
        tid = t.get("id", f"index-{i}")
        if "attack" not in t:
            errors.append(f"{tid}: missing 'attack' field")
        if "technique" not in t:
            errors.append(f"{tid}: missing 'technique' field")
        for field in NEW_FIELDS_DEFAULTS:
            if field not in t:
                errors.append(f"{tid}: missing '{field}' field")
    return errors


def main():
    parser = argparse.ArgumentParser(description="Migrate TARA registrar to v2 taxonomy")
    parser.add_argument("--dry-run", action="store_true", help="Preview without writing")
    parser.add_argument("--output", type=Path, help="Write to a different file")
    parser.add_argument("--input", type=Path, default=REGISTRAR_PATH, help="Source file")
    args = parser.parse_args()

    src = args.input
    if not src.exists():
        print(f"Error: {src} not found", file=sys.stderr)
        sys.exit(1)

    with open(src, "r", encoding="utf-8") as f:
        data = json.load(f)

    data, total, silicon_count = migrate(data)

    errors = validate(data)
    if errors:
        print("Validation errors:", file=sys.stderr)
        for e in errors:
            print(f"  {e}", file=sys.stderr)
        sys.exit(1)

    bio_count = total - silicon_count
    print(f"Techniques processed: {total}")
    print(f"  biological_target=true:  {bio_count}")
    print(f"  biological_target=false: {silicon_count}")
    print(f"  tara_taxonomy_version:   provisional")

    if args.dry_run:
        print("\n--dry-run: no file written.")
        sample = data["techniques"][0]
        print(f"\nSample (first technique {sample['id']}):")
        for field in ["technique", *NEW_FIELDS_DEFAULTS]:
            print(f"  {field}: {json.dumps(sample.get(field))}")
        return

    dest = args.output or src
    with open(dest, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
        f.write("\n")

    print(f"\nWritten to: {dest}")


if __name__ == "__main__":
    main()
