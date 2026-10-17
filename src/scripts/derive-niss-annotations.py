#!/usr/bin/env python3
"""
Derive the technique severity label and two NISS annotations from each
technique's NISS vector, so none of them can drift from the score.

Why this exists (2026-10-16 architecture review, defects D4, D5, D7):
- The hand-entered `severity` label disagreed with the NISS severity on 113
  of 150 scored techniques. `severity` is now copied from `niss.severity` for
  every scored technique. The earlier hand label is kept once, as
  `severity_legacy`, and `severity_source` says which rule produced the label.
  Unscored techniques keep their editorial label (`severity_source: editorial`).
- NISS is a weighted mean, so critical biological impact can average down to
  "low". `niss.harm_flag` is true whenever biological impact (BI) is H or C. It
  is shown beside the score and never changes it.
- NP:S ("structural" neuroplasticity) asserts a lasting mechanism. Where the
  technique's evidence tier is theoretical or speculative, `niss.np_support` is
  set to "unsupported". The score is unchanged.

No NISS score, vector or weight is changed by this script.

Usage:
  python3 src/scripts/derive-niss-annotations.py            # write
  python3 src/scripts/derive-niss-annotations.py --dry-run  # print summary only
  python3 src/scripts/derive-niss-annotations.py --check    # exit 1 if stale

Run `npm run registrar:stats` afterwards; it regenerates the statistics block
and the SDK's bundled copy of the registrar.
"""

from __future__ import annotations

import json
import sys
from collections import Counter
from pathlib import Path
from typing import Any

REGISTRAR_PATH = Path(__file__).resolve().parents[2] / "datalake" / "qtara-registrar.json"

HARM_FLAG_BI_VALUES = frozenset({"H", "C"})
UNSUPPORTED_NP_VALUE = "S"
UNSUPPORTED_EVIDENCE_TIERS = frozenset({"theoretical_proposed", "theoretical_modeled", "speculative"})
NP_UNSUPPORTED_LABEL = "unsupported"
SOURCE_NISS = "niss"
SOURCE_EDITORIAL = "editorial"
MISMATCH_REPORT_LIMIT = 10

ANNOTATION_SPEC: dict[str, Any] = {
    "harm_flag": {
        "rule": "true when BI is H or C",
        "scoring": "none; shown beside the score, never folded into it",
        "reason": "The weighted mean lets critical biological impact average down to a low score.",
        "introduced": "2026-10-16",
    },
    "np_support": {
        "rule": "'unsupported' when NP is S and evidence.tier is theoretical_proposed, theoretical_modeled or speculative",
        "scoring": "none; the NP value and the score are unchanged",
        "reason": "NP:S asserts lasting structural change, which no cited evidence demonstrates for these techniques.",
        "introduced": "2026-10-16",
    },
}

TECHNIQUE_SEVERITY_SPEC: dict[str, Any] = {
    "rule": "For scored techniques, severity = niss.severity. Unscored techniques keep an editorial label.",
    "fields": {
        "severity_source": "'niss' or 'editorial'",
        "severity_legacy": "the hand-entered label that preceded this rule, kept for one release",
    },
    "introduced": "2026-10-16",
}


class RegistrarFormatError(Exception):
    """The registrar does not have the shape this script expects."""


def parse_niss_vector(vector: str, technique_id: str) -> dict[str, str]:
    """Return metric code -> value for a NISS vector such as NISS:1.1/BI:H/..."""
    try:
        return dict(part.split(":", 1) for part in vector.split("/")[1:])
    except ValueError as error:
        raise RegistrarFormatError(f"{technique_id}: malformed NISS vector {vector!r}; fix the vector, then rerun") from error


def is_scored(technique: dict[str, Any]) -> bool:
    """True when the technique carries a NISS vector."""
    niss = technique.get("niss")
    return isinstance(niss, dict) and bool(niss.get("vector"))


def insert_after(record: dict[str, Any], anchor: str, key: str, value: Any) -> dict[str, Any]:
    """Return a copy of record with key placed directly after anchor (or replaced in place)."""
    result: dict[str, Any] = {}
    for existing_key, existing_value in record.items():
        if existing_key == key:
            continue
        result[existing_key] = existing_value
        if existing_key == anchor:
            result[key] = value
    if key not in result:
        result[key] = value
    return result


def derive_niss_block(niss: dict[str, Any], evidence_tier: str | None, technique_id: str) -> dict[str, Any]:
    """Return the NISS block with harm_flag and np_support recomputed from its vector."""
    metrics = parse_niss_vector(niss["vector"], technique_id)
    block = {key: value for key, value in niss.items() if key not in ("harm_flag", "np_support")}
    block["harm_flag"] = metrics.get("BI") in HARM_FLAG_BI_VALUES
    if metrics.get("NP") == UNSUPPORTED_NP_VALUE and evidence_tier in UNSUPPORTED_EVIDENCE_TIERS:
        block["np_support"] = NP_UNSUPPORTED_LABEL
    return block


def derive_scored(technique: dict[str, Any]) -> dict[str, Any]:
    """Derive severity fields and NISS annotations for a technique with a NISS vector."""
    evidence = technique.get("evidence")
    evidence_tier = evidence.get("tier") if isinstance(evidence, dict) else None
    niss = derive_niss_block(technique["niss"], evidence_tier, technique["id"])
    legacy = technique.get("severity_legacy")
    if technique.get("severity_source") != SOURCE_NISS:
        legacy = technique.get("severity")
    derived = insert_after(technique, "severity", "severity", niss["severity"])
    derived = insert_after(derived, "severity", "severity_source", SOURCE_NISS)
    derived = insert_after(derived, "severity_source", "severity_legacy", legacy)
    derived["niss"] = niss
    return derived


def derive_unscored(technique: dict[str, Any]) -> dict[str, Any]:
    """Mark an unscored technique's label as editorial; nothing else changes."""
    derived = {key: value for key, value in technique.items() if key != "severity_legacy"}
    return insert_after(derived, "severity", "severity_source", SOURCE_EDITORIAL)


def derive_registrar(registrar: dict[str, Any]) -> dict[str, Any]:
    """Return a new registrar with every derived field recomputed."""
    if not isinstance(registrar.get("techniques"), list) or not isinstance(registrar.get("niss_spec"), dict):
        raise RegistrarFormatError("registrar is missing `techniques` or `niss_spec`; check the file path")
    derived = dict(registrar)
    derived["techniques"] = [
        derive_scored(technique) if is_scored(technique) else derive_unscored(technique)
        for technique in registrar["techniques"]
    ]
    niss_spec = dict(registrar["niss_spec"])
    niss_spec["annotations"] = ANNOTATION_SPEC
    niss_spec["technique_severity"] = TECHNIQUE_SEVERITY_SPEC
    derived["niss_spec"] = niss_spec
    return derived


def serialize(registrar: dict[str, Any]) -> str:
    """Serialize exactly as the other registrar generators do."""
    return json.dumps(registrar, indent=2, ensure_ascii=False) + "\n"


def summarize(before: dict[str, Any], after: dict[str, Any]) -> list[str]:
    """Human-readable summary of what the derivation changes."""
    pairs = list(zip(before["techniques"], after["techniques"]))
    relabelled = Counter(
        (old.get("severity"), new["severity"]) for old, new in pairs if old.get("severity") != new["severity"]
    )
    scored = [new for new in after["techniques"] if is_scored(new)]
    lines = [
        f"techniques: {len(pairs)} (scored {len(scored)})",
        f"severity labels changed: {sum(relabelled.values())}",
        *(f"  {old} -> {new}: {count}" for (old, new), count in relabelled.most_common()),
        f"harm_flag true: {sum(1 for t in scored if t['niss']['harm_flag'])}",
        f"np_support unsupported: {sum(1 for t in scored if t['niss'].get('np_support'))}",
    ]
    return lines


def stale_ids(before: dict[str, Any], after: dict[str, Any]) -> list[str]:
    """IDs of techniques whose stored fields differ from the derived ones."""
    return [old["id"] for old, new in zip(before["techniques"], after["techniques"]) if old != new]


def main(argv: list[str]) -> int:
    """Entry point. Returns a process exit code."""
    raw = REGISTRAR_PATH.read_text(encoding="utf-8")
    before = json.loads(raw)
    after = derive_registrar(before)
    next_raw = serialize(after)
    if "--check" in argv:
        if next_raw == raw:
            print("derive-niss-annotations: registrar is current")
            return 0
        ids = stale_ids(before, after)
        print(f"derive-niss-annotations: stale fields in {len(ids)} techniques, e.g. {ids[:MISMATCH_REPORT_LIMIT]}")
        print("Run: python3 src/scripts/derive-niss-annotations.py && npm run registrar:stats")
        return 1
    print("\n".join(summarize(before, after)))
    if "--dry-run" in argv:
        print("dry run: no files written")
        return 0
    REGISTRAR_PATH.write_text(next_raw, encoding="utf-8")
    print(f"written: {REGISTRAR_PATH.relative_to(REGISTRAR_PATH.parents[1])}")
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main(sys.argv[1:]))
    except (RegistrarFormatError, OSError, json.JSONDecodeError) as error:
        print(f"derive-niss-annotations: failed: {error}", file=sys.stderr)
        sys.exit(2)
