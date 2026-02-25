#!/usr/bin/env python3
"""
Recalculate NISS v1.1 scores for all TARA techniques.

v1.1 changes: Split CG (Cognitive Integrity) into two metrics:
  CR (Cognitive Reconnaissance) — read attacks: thought decoding, neural data inference
  CD (Cognitive Disruption) — write attacks: perception manipulation, identity modification
Formula: (BI + CR + CD + CV + RV + NP) / 6 (equal weights default)

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

REGISTRY_PATH = Path(__file__).parent.parent / "qtara-registrar.json"

# Reconciled numeric mappings (v1.1: CG split into CR + CD)
METRIC_VALUES = {
    "BI": {"N": 0.0, "L": 3.3, "H": 6.7, "C": 10.0},
    "CR": {"N": 0.0, "L": 3.3, "H": 6.7, "C": 10.0},  # Cognitive Reconnaissance (read)
    "CD": {"N": 0.0, "L": 3.3, "H": 6.7, "C": 10.0},  # Cognitive Disruption (write)
    "CV": {"N": 0.0, "P": 3.3, "E": 6.7, "I": 10.0},  # Reordered: Implicit highest
    "RV": {"F": 0.0, "T": 3.3, "P": 6.7, "I": 10.0},  # Added Temporary
    "NP": {"N": 0.0, "T": 5.0, "S": 10.0},
}

METRIC_ORDER = ["BI", "CR", "CD", "CV", "RV", "NP"]

# Legacy v1.0 codes not in the standardized 4-point scale
# M (Medium) existed in early data before N/L/H/C standardization
# D (Direct?) existed in early CV data before N/P/E/I standardization
LEGACY_CODE_MAP = {
    "BI": {"M": "L"},   # Medium → Low (conservative: between L and H, round down for BI)
    "CG": {"M": "L"},   # Same mapping for CG before it splits to CR/CD
    "CR": {"M": "L"},
    "CD": {"M": "L"},
    "CV": {"D": "P"},   # Direct → Presumed
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
    for part in parts[1:]:  # skip NISS:x.x
        code, value = part.split(":")
        metrics[code] = value
    return metrics


def build_vector(metrics: dict[str, str]) -> str:
    """Build NISS v1.1 vector string from metric->value dict."""
    parts = ["NISS:1.1"]
    for code in METRIC_ORDER:
        parts.append(f"{code}:{metrics[code]}")
    return "/".join(parts)


def calculate_score(metrics: dict[str, str]) -> float:
    """Calculate NISS composite score with equal weights and ceiling rounding."""
    total = 0.0
    for code in METRIC_ORDER:
        value = metrics[code]
        if value == "X":
            total += 10.0
        else:
            total += METRIC_VALUES[code][value]
    raw = total / 6.0  # v1.1: 6 metrics
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


def migrate_cg_to_cr_cd(metrics: dict[str, str], technique: dict) -> dict[str, str]:
    """
    Migrate v1.0 CG value to v1.1 CR + CD values.

    Strategy: Use technique metadata to determine read vs write split.
    - If technique has no CG key, it's already v1.1 format
    - Default: assign CG value to both CR and CD (conservative)
    - The per-technique overrides should be applied after initial migration
    """
    if "CG" not in metrics:
        return metrics  # Already v1.1

    cg_value = metrics.pop("CG")

    # If CR and CD already exist (shouldn't happen, but be safe), keep them
    if "CR" in metrics and "CD" in metrics:
        return metrics

    # Default migration: assign CG to both CR and CD
    # This is conservative — both read and write get the same severity
    # Manual review should then lower the one that doesn't apply
    metrics["CR"] = cg_value
    metrics["CD"] = cg_value

    return metrics


def main():
    dry_run = "--dry-run" in sys.argv
    migrate = "--migrate" in sys.argv or True  # Always migrate for now

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

        # Normalize legacy codes (M, D) to standardized codes
        for code in list(metrics.keys()):
            legacy = LEGACY_CODE_MAP.get(code, {})
            if metrics[code] in legacy:
                old_code = metrics[code]
                metrics[code] = legacy[old_code]
                print(f"  {tid}: normalized {code}:{old_code} -> {code}:{metrics[code]}")

        # Migrate CG -> CR + CD if needed
        if "CG" in metrics:
            metrics = migrate_cg_to_cr_cd(metrics, tech)

        # Rebuild vector (ensures canonical order)
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
                "old_vector": old_vector,
                "new_vector": new_vector,
                "old_score": old_score,
                "new_score": new_score,
                "old_severity": old_severity,
                "new_severity": new_severity,
                "old_pins": old_pins,
                "new_pins": new_pins,
                "metrics": metrics,
            })

        if not dry_run:
            # Update in place
            tech["niss"] = {
                "version": "1.1",
                "vector": new_vector,
                "score": new_score,
                "severity": new_severity,
                "pins": new_pins,
            }

    # Update niss_spec object
    if not dry_run:
        registry["niss_spec"] = {
            "version": "1.1",
            "metrics": {
                "BI": {
                    "name": "Biological Impact",
                    "values": {"N": 0.0, "L": 3.3, "H": 6.7, "C": 10.0},
                    "description": "Severity of tissue damage from neural interface attacks",
                },
                "CR": {
                    "name": "Cognitive Reconnaissance",
                    "values": {"N": 0.0, "L": 3.3, "H": 6.7, "C": 10.0},
                    "description": "Degree of unauthorized cognitive read access: thought decoding, neural data inference, intent extraction",
                },
                "CD": {
                    "name": "Cognitive Disruption",
                    "values": {"N": 0.0, "L": 3.3, "H": 6.7, "C": 10.0},
                    "description": "Degree of unauthorized cognitive write access: perception manipulation, identity modification, cognitive coercion",
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
            "formula": "NISS = (BI + CR + CD + CV + RV + NP) / 6",
            "weights": {"default": {"BI": 1.0, "CR": 1.0, "CD": 1.0, "CV": 1.0, "RV": 1.0, "NP": 1.0}},
            "context_profiles": {
                "clinical":  {"BI": 2.0, "CR": 1.0, "CD": 2.0, "CV": 1.0, "RV": 2.0, "NP": 1.0},
                "research":  {"BI": 1.0, "CR": 2.0, "CD": 1.5, "CV": 2.0, "RV": 1.0, "NP": 1.5},
                "consumer":  {"BI": 1.0, "CR": 2.0, "CD": 1.0, "CV": 2.0, "RV": 1.0, "NP": 1.0},
                "military":  {"BI": 2.0, "CR": 2.0, "CD": 2.0, "CV": 0.5, "RV": 1.5, "NP": 1.5},
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
            "vector_format": "NISS:1.1/BI:<v>/CR:<v>/CD:<v>/CV:<v>/RV:<v>/NP:<v>",
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

    if not dry_run:
        registry["statistics"]["by_niss_severity"] = severity_counts
        registry["statistics"]["niss_cvss_mapping"]["pins_flagged"] = pins_count

        # Write updated registry
        with open(REGISTRY_PATH, "w") as f:
            json.dump(registry, f, indent=2)
            f.write("\n")

    # Print summary
    mode = "DRY RUN" if dry_run else "LIVE"
    print(f"\n=== NISS v1.1 Recalculation ({mode}) ===")
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
            migrated = "MIGRATED CG->CR+CD" if "CG:" in c['old_vector'] else ""
            print(f"  {c['id']} ({c['attack'][:40]}): {score_change} [{sev_change}] {pins_change} {migrated}")

    if not dry_run:
        print(f"\nRegistry written to: {REGISTRY_PATH}")
    else:
        print(f"\nDry run complete. No files modified.")
    print(f"\nNOTE: Default migration assigns old CG value to BOTH CR and CD.")
    print(f"Manual review needed to differentiate read vs write per technique.")


if __name__ == "__main__":
    main()
