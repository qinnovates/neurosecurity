#!/usr/bin/env python3
"""Backfill v2 taxonomy fields (tara_domain_primary, tara_mode, tara_drift)
on the 103 enriched techniques in qtara-registrar.json.

Usage:
    python3 backfill-taxonomy.py --dry-run   # preview changes
    python3 backfill-taxonomy.py             # write in-place
"""

import argparse
import json
import sys
from collections import Counter
from pathlib import Path

REGISTRAR_PATH = Path(__file__).resolve().parent.parent / "qtara-registrar.json"
SILICON_BANDS = {"S1", "S2", "S3"}


def classify_domain(t: dict) -> str:
    bands = set(t.get("band_ids", []))
    tactic = t.get("tactic", "")
    if bands and bands <= SILICON_BANDS:
        return "SIL"
    for prefix, domain in [
        ("N.IJ", "SOM"), ("N.MD", "SOM"), ("D.HV", "COG"), ("S.HV", "COG"),
        ("P.DS", "MOT"), ("C.EX", "COG"), ("E.RD", "COG"), ("M.SV", "SIL"),
        ("B.IN", "SIL"), ("B.EV", "SIL"), ("C.IM", "COG"), ("S.CH", "SIL"),
        ("S.FP", "SIL"), ("S.RP", "SIL"), ("S.SC", "SIL"), ("N.SC", "COG"),
    ]:
        if prefix in tactic:
            return domain
    return "COG"


def classify_mode(t: dict) -> str:
    tactic = t.get("tactic", "")
    if any(k in tactic for k in ("HV", "SC", "FP")):
        return "R"
    if "DS" in tactic:
        return "D"
    return "M"


def recompute_stats(techniques: list) -> dict:
    by_status = Counter(t.get("status", "UNKNOWN") for t in techniques)
    by_severity = Counter(t.get("severity", "unknown") for t in techniques)
    by_tactic = Counter(t.get("tactic", "UNKNOWN") for t in techniques)
    by_ui = Counter(t.get("ui_category", "UNKNOWN") for t in techniques)
    return {
        "by_status": dict(by_status),
        "by_severity": dict(by_severity),
        "by_tactic": dict(by_tactic),
        "by_ui_category": dict(by_ui),
    }


def main():
    parser = argparse.ArgumentParser(description="Backfill v2 taxonomy fields")
    parser.add_argument("--dry-run", action="store_true", help="Preview without writing")
    args = parser.parse_args()

    data = json.loads(REGISTRAR_PATH.read_text())
    techniques = data["techniques"]
    updated = 0

    for t in techniques:
        if t.get("tara_enrichment_pending"):
            continue
        changed = False
        domain = classify_domain(t)
        if t.get("tara_domain_primary") is None:
            t["tara_domain_primary"] = domain
            changed = True
        mode = classify_mode(t)
        if t.get("tara_mode") is None:
            t["tara_mode"] = mode
            changed = True
        if "tara_drift" in t and t["tara_drift"] is None:
            pass  # leave null — requires clinical judgment
        if t.get("tara_enrichment_pending") is not False:
            t["tara_enrichment_pending"] = False
            changed = True
        if changed:
            updated += 1

    # Recompute core statistics from actual data
    fresh = recompute_stats(techniques)
    stats = data["statistics"]
    stats["total_techniques"] = len(techniques)
    for key in ("by_status", "by_severity", "by_tactic", "by_ui_category"):
        stats[key] = fresh[key]

    print(f"Updated {updated} techniques (of {len(techniques)} total)")
    print(f"  by_status:  {fresh['by_status']}")
    print(f"  by_severity: {fresh['by_severity']}")
    print(f"  by_tactic:  {len(fresh['by_tactic'])} tactics")

    domain_counts = Counter(
        t.get("tara_domain_primary") for t in techniques if not t.get("tara_enrichment_pending")
    )
    print(f"  domains:    {dict(domain_counts)}")

    mode_counts = Counter(
        t.get("tara_mode") for t in techniques if not t.get("tara_enrichment_pending")
    )
    print(f"  modes:      {dict(mode_counts)}")

    if args.dry_run:
        print("\n--dry-run: no file written")
        return

    REGISTRAR_PATH.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n")
    print(f"\nWrote {REGISTRAR_PATH}")


if __name__ == "__main__":
    main()
