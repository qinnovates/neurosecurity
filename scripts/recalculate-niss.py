#!/usr/bin/env python3
"""
Recalculate NISS v1.0 scores for all 71 TARA techniques.

Reconciled scoring (spec + Gemini review):
- Equal weights (all 1.0), context profiles available separately
- CV reordered: N(0) -> P(3.3) -> E(6.7) -> I(10.0)
- RV expanded: F(0) -> T(3.3) -> P(6.7) -> I(10.0)
- PINS focused: BI >= H OR RV == I
- No X codes (all metrics mandatory)
- Ceiling rounding: ceil(score * 10) / 10
"""

import json
import math
import sys
from pathlib import Path

REGISTRY_PATH = Path(__file__).parent.parent / "shared" / "qtara-registrar.json"

# Reconciled numeric mappings
METRIC_VALUES = {
    "BI": {"N": 0.0, "L": 3.3, "H": 6.7, "C": 10.0},
    "CG": {"N": 0.0, "L": 3.3, "H": 6.7, "C": 10.0},
    "CV": {"N": 0.0, "P": 3.3, "E": 6.7, "I": 10.0},  # Reordered: Implicit highest
    "RV": {"F": 0.0, "T": 3.3, "P": 6.7, "I": 10.0},  # Added Temporary
    "NP": {"N": 0.0, "T": 5.0, "S": 10.0},
}

SEVERITY_THRESHOLDS = [
    (0.0, 0.0, "none"),
    (0.1, 3.9, "low"),
    (4.0, 6.9, "medium"),
    (7.0, 8.9, "high"),
    (9.0, 10.0, "critical"),
]


def parse_vector(vector_str: str) -> dict[str, str]:
    """Parse NISS vector string into metric->value dict."""
    parts = vector_str.split("/")
    metrics = {}
    for part in parts[1:]:  # skip NISS:1.0
        code, value = part.split(":")
        metrics[code] = value
    return metrics


def build_vector(metrics: dict[str, str]) -> str:
    """Build NISS vector string from metric->value dict."""
    parts = ["NISS:1.0"]
    for code in ["BI", "CG", "CV", "RV", "NP"]:
        parts.append(f"{code}:{metrics[code]}")
    return "/".join(parts)


def calculate_score(metrics: dict[str, str]) -> float:
    """Calculate NISS composite score with equal weights and ceiling rounding."""
    total = 0.0
    for code in ["BI", "CG", "CV", "RV", "NP"]:
        value = metrics[code]
        if value == "X":
            # X = worst case (shouldn't happen in reconciled version, but handle gracefully)
            total += 10.0
        else:
            total += METRIC_VALUES[code][value]
    raw = total / 5.0
    return math.ceil(raw * 10) / 10


def calculate_pins(metrics: dict[str, str]) -> bool:
    """Calculate focused PINS flag: BI >= H OR RV == I."""
    bi = metrics.get("BI", "N")
    rv = metrics.get("RV", "F")
    return bi in ("H", "C") or rv == "I"


def get_severity(score: float) -> str:
    """Map score to severity label."""
    if score == 0.0:
        return "none"
    for low, high, label in SEVERITY_THRESHOLDS:
        if low <= score <= high:
            return label
    return "critical"


def main():
    with open(REGISTRY_PATH, "r") as f:
        registry = json.load(f)

    changes = []
    techniques = registry["techniques"]

    for tech in techniques:
        tid = tech["id"]
        old_niss = tech.get("niss", {})
        old_vector = old_niss.get("vector", "")
        old_score = old_niss.get("score", 0)
        old_severity = old_niss.get("severity", "")
        old_pins = old_niss.get("pins", False)

        if not old_vector:
            print(f"WARNING: {tid} has no NISS vector, skipping")
            continue

        metrics = parse_vector(old_vector)

        # Remove any X values (shouldn't exist in current data, but be safe)
        for code in ["BI", "CG", "CV", "RV", "NP"]:
            if metrics.get(code) == "X":
                print(f"WARNING: {tid} has X for {code}, keeping as-is")

        # Rebuild vector (ensures canonical order, no X)
        new_vector = build_vector(metrics)
        new_score = calculate_score(metrics)
        new_pins = calculate_pins(metrics)
        new_severity = get_severity(new_score)

        # Track changes
        changed = (
            new_score != old_score
            or new_severity != old_severity
            or new_pins != old_pins
            or new_vector != old_vector
        )

        if changed:
            changes.append({
                "id": tid,
                "attack": tech.get("attack", ""),
                "old_score": old_score,
                "new_score": new_score,
                "old_severity": old_severity,
                "new_severity": new_severity,
                "old_pins": old_pins,
                "new_pins": new_pins,
                "vector": new_vector,
                "metrics": metrics,
            })

        # Update in place
        tech["niss"] = {
            "version": "1.0",
            "vector": new_vector,
            "score": new_score,
            "severity": new_severity,
            "pins": new_pins,
        }

    # Update niss_spec object
    registry["niss_spec"] = {
        "version": "1.0",
        "metrics": {
            "BI": {
                "name": "Biological Impact",
                "values": {"N": 0.0, "L": 3.3, "H": 6.7, "C": 10.0},
                "description": "Severity of tissue damage from neural interface attacks",
            },
            "CG": {
                "name": "Cognitive Integrity",
                "values": {"N": 0.0, "L": 3.3, "H": 6.7, "C": 10.0},
                "description": "Degree of cognitive function alteration or disruption",
            },
            "CV": {
                "name": "Consent Violation",
                "values": {"N": 0.0, "P": 3.3, "E": 6.7, "I": 10.0},
                "description": "Whether the attack violates neural data consent",
            },
            "RV": {
                "name": "Reversibility",
                "values": {"F": 0.0, "T": 3.3, "P": 6.7, "I": 10.0},
                "description": "Whether neural or biological damage can be reversed",
            },
            "NP": {
                "name": "Neuroplasticity",
                "values": {"N": 0.0, "T": 5.0, "S": 10.0},
                "description": "Whether the attack causes lasting neural pathway changes",
            },
        },
        "formula": "NISS = (BI + CG + CV + RV + NP) / 5",
        "weights": {"default": {"BI": 1.0, "CG": 1.0, "CV": 1.0, "RV": 1.0, "NP": 1.0}},
        "context_profiles": {
            "clinical": {"BI": 2.0, "CG": 1.5, "CV": 1.0, "RV": 2.0, "NP": 1.0},
            "research": {"BI": 1.0, "CG": 2.0, "CV": 2.0, "RV": 1.0, "NP": 1.5},
            "consumer": {"BI": 1.0, "CG": 1.5, "CV": 2.0, "RV": 1.0, "NP": 1.0},
            "military": {"BI": 2.0, "CG": 2.0, "CV": 0.5, "RV": 1.5, "NP": 1.5},
        },
        "pins": {
            "description": "Potential Impact to Neural Safety",
            "trigger": "BI >= H OR RV == I",
            "type": "boolean",
        },
        "severity_scale": {
            "none": "0.0",
            "low": "0.1-3.9",
            "medium": "4.0-6.9",
            "high": "7.0-8.9",
            "critical": "9.0-10.0",
        },
        "rounding": "ceil(score * 10) / 10",
        "vector_format": "NISS:1.0/BI:<v>/CG:<v>/CV:<v>/RV:<v>/NP:<v>",
    }

    # Recalculate summary statistics
    severity_counts = {"critical": 0, "high": 0, "medium": 0, "low": 0, "none": 0}
    pins_count = 0
    for tech in techniques:
        niss = tech.get("niss", {})
        sev = niss.get("severity", "none")
        severity_counts[sev] = severity_counts.get(sev, 0) + 1
        if niss.get("pins", False):
            pins_count += 1

    registry["statistics"]["by_niss_severity"] = severity_counts
    registry["statistics"]["niss_cvss_mapping"]["pins_flagged"] = pins_count

    # Write updated registry
    with open(REGISTRY_PATH, "w") as f:
        json.dump(registry, f, indent=2)
        f.write("\n")

    # Print summary
    print(f"\n=== NISS Recalculation Complete ===")
    print(f"Total techniques: {len(techniques)}")
    print(f"Changed: {len(changes)}")
    print(f"PINS flagged: {pins_count}")
    print(f"Severity distribution: {severity_counts}")
    print()

    if changes:
        print("=== Changes ===")
        for c in changes:
            score_change = f"{c['old_score']:.1f} -> {c['new_score']:.1f}"
            sev_change = f"{c['old_severity']} -> {c['new_severity']}" if c['old_severity'] != c['new_severity'] else c['new_severity']
            pins_change = f"PINS: {c['old_pins']} -> {c['new_pins']}" if c['old_pins'] != c['new_pins'] else ""
            print(f"  {c['id']} ({c['attack'][:40]}): {score_change} [{sev_change}] {pins_change}")

    # Verify no X values remain
    x_count = 0
    for tech in techniques:
        vec = tech.get("niss", {}).get("vector", "")
        if ":X" in vec:
            x_count += 1
            print(f"  WARNING: {tech['id']} still has X values: {vec}")

    if x_count == 0:
        print("\nAll vectors clean (no X values).")

    print(f"\nRegistry written to: {REGISTRY_PATH}")


if __name__ == "__main__":
    main()
