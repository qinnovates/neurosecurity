#!/usr/bin/env python3
"""Flag stale numeric claims in the frozen pages under src/site.

src/site is Astro's publicDir, and 18 complete build artifacts are committed
inside it. No route regenerates them: the governance content collection globs
only DECISION-LOG and TRANSPARENCY, and the whitepaper v2/v3/v5
archives are static by design (whitepaper-archival.md requires every
/research/whitepaper/v*/ URL to keep returning 200).

That makes them permanently frozen copies of a site that keeps changing. Every
one of them advertised "109 BCI attack techniques" in its nav while the
registry held 173, because the snapshot predates the count. Nav.astro derives
the live figure from TARA_TECHNIQUES, so only the frozen copies were wrong.

This catches the next instance. It compares numbers that appear next to a
known subject in the frozen pages against the live registry, so a snapshot
cannot quietly keep asserting an old count.

Usage:
    python3 check_frozen_pages.py           # report, exit 1 on a stale claim
    python3 check_frozen_pages.py --github  # emit CI annotations
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[3]
SITE = REPO_ROOT / "src" / "site"
REGISTRY = REPO_ROOT / "datalake" / "qtara-registrar.json"

# Phrases that pin a count to a subject the registry can answer. The number is
# captured; anything other than the live value is stale.
CLAIMS = (
    (re.compile(r"(\d+)\s+BCI attack techniques"), "techniques"),
    (re.compile(r"(\d+)\s+TARA techniques"), "techniques"),
    (re.compile(r"(\d+)\s+threat techniques"), "techniques"),
    (re.compile(r"TARA[^<]{0,20}?(\d+)\s+techniques"), "techniques"),
)


def live_values() -> dict[str, int]:
    registry = json.loads(REGISTRY.read_text())
    return {"techniques": len(registry["techniques"])}


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--github", action="store_true")
    args = parser.parse_args()

    if not SITE.exists():
        print(f"{SITE} not found; nothing to check")
        return 0

    # The whitepaper version archives are exempt. Their figures are correct for
    # the version each preserves -- /research/whitepaper/v5/ saying "109
    # techniques" is the v5 paper, not a stale copy of the current one.
    # whitepaper-archival.md requires every version to stay as published, so
    # "correcting" them would falsify the record the rule exists to protect.
    def is_archive(path: Path) -> bool:
        return re.search(r"/research/whitepaper/v\d", path.as_posix()) is not None

    live = live_values()
    findings: list[str] = []
    checked = 0

    skipped = 0
    for path in sorted(SITE.rglob("*.html")):
        if is_archive(path):
            skipped += 1
            continue
        text = path.read_text(errors="surrogateescape")
        checked += 1
        for pattern, subject in CLAIMS:
            for match in pattern.finditer(text):
                claimed = int(match.group(1))
                if claimed != live[subject]:
                    rel = path.relative_to(REPO_ROOT)
                    message = (
                        f"{rel}: frozen page claims {claimed} {subject}, registry has "
                        f"{live[subject]}. These pages are never regenerated, so state the "
                        f"subject without a number instead of pinning a count."
                    )
                    findings.append(
                        f"::error file={rel}::{message}" if args.github else f"  ERROR  {message}"
                    )

    print(f"Checked {checked} page(s) under src/site against the live registry "
          f"({skipped} whitepaper archive page(s) exempt).")
    for finding in findings:
        print(finding)
    if findings:
        print(f"\n{len(findings)} stale claim(s) in frozen pages.")
        return 1
    print("No stale numeric claims.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
