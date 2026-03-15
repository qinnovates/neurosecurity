#!/usr/bin/env python3
"""
Migrate NISS vectors for techniques QIF-T0110 through QIF-T0135.

Updates:
  - niss.vector (full NISS:1.1/... string)
  - niss.score (weighted average with default weights, ceiling-rounded to 0.1)
  - niss.severity (based on score thresholds)
  - niss.pins (true if BI in {H, C} or RV == I)
  - niss.components → set to null (deprecated)

Scoring matches niss-parser.ts:
  Default weights: bi=1.0, cr=0.5, cd=0.5, cv=1.0, rv=1.0, np=1.0
  Score = ceiling_round(weighted_sum / weight_total, 0.1)
  Severity: 0=none, <=3.9=low, <=6.9=medium, <=8.9=high, >=9.0=critical
"""

import json
import math
import sys
from pathlib import Path

REGISTRAR_PATH = Path(__file__).resolve().parent.parent / "qtara-registrar.json"

# Value maps from niss-parser.ts
VALUES = {
    "BI": {"N": 0.0, "L": 3.3, "H": 6.7, "C": 10.0},
    "CR": {"N": 0.0, "L": 3.3, "H": 6.7, "C": 10.0},
    "CD": {"N": 0.0, "L": 3.3, "H": 6.7, "C": 10.0},
    "CV": {"N": 0.0, "P": 3.3, "E": 6.7, "I": 10.0},
    "RV": {"F": 0.0, "T": 3.3, "P": 6.7, "I": 10.0},
    "NP": {"N": 0.0, "T": 3.3, "P": 6.7, "S": 10.0},
}

DEFAULT_WEIGHTS = {"BI": 1.0, "CR": 0.5, "CD": 0.5, "CV": 1.0, "RV": 1.0, "NP": 1.0}


def ceil_to_tenth(value: float) -> float:
    return math.ceil(value * 10) / 10


def get_severity(score: float) -> str:
    if score == 0.0:
        return "none"
    if score <= 3.9:
        return "low"
    if score <= 6.9:
        return "medium"
    if score <= 8.9:
        return "high"
    return "critical"


def compute_score(codes: dict) -> float:
    weighted_sum = 0.0
    weight_total = 0.0
    for metric, code in codes.items():
        val = VALUES[metric][code]
        w = DEFAULT_WEIGHTS[metric]
        weighted_sum += w * val
        weight_total += w
    raw = weighted_sum / weight_total
    return ceil_to_tenth(raw)


def evaluate_pins(codes: dict) -> bool:
    return codes["BI"] in ("H", "C") or codes["RV"] == "I"


def parse_short_vector(short: str) -> dict:
    """Parse 'BI:N/CR:L/CD:N/CV:E/RV:F/NP:N' into dict."""
    parts = short.split("/")
    result = {}
    for part in parts:
        key, val = part.split(":")
        result[key] = val
    return result


# Corrections table
CORRECTIONS = {
    "QIF-T0110": "BI:N/CR:L/CD:N/CV:E/RV:F/NP:N",
    "QIF-T0111": "BI:L/CR:N/CD:H/CV:E/RV:T/NP:T",
    "QIF-T0112": "BI:L/CR:N/CD:H/CV:E/RV:T/NP:T",
    "QIF-T0113": "BI:L/CR:N/CD:H/CV:E/RV:T/NP:T",
    "QIF-T0114": "BI:H/CR:N/CD:H/CV:E/RV:P/NP:T",
    "QIF-T0115": "BI:H/CR:N/CD:L/CV:E/RV:P/NP:P",
    "QIF-T0116": "BI:L/CR:N/CD:H/CV:E/RV:P/NP:S",
    "QIF-T0117": "BI:L/CR:N/CD:H/CV:E/RV:P/NP:P",
    "QIF-T0118": "BI:L/CR:N/CD:H/CV:E/RV:P/NP:P",
    "QIF-T0119": "BI:L/CR:N/CD:H/CV:E/RV:P/NP:S",
    "QIF-T0120": "BI:H/CR:N/CD:H/CV:E/RV:P/NP:P",
    "QIF-T0121": "BI:L/CR:N/CD:H/CV:E/RV:T/NP:T",
    "QIF-T0122": "BI:C/CR:N/CD:C/CV:E/RV:I/NP:S",
    "QIF-T0123": "BI:L/CR:N/CD:H/CV:E/RV:P/NP:S",
    "QIF-T0124": "BI:L/CR:N/CD:C/CV:E/RV:P/NP:S",
    "QIF-T0125": "BI:N/CR:H/CD:N/CV:I/RV:F/NP:N",
    "QIF-T0126": "BI:N/CR:H/CD:N/CV:E/RV:F/NP:N",
    "QIF-T0127": "BI:L/CR:N/CD:H/CV:E/RV:T/NP:T",
    "QIF-T0128": "BI:L/CR:N/CD:H/CV:E/RV:P/NP:P",
    "QIF-T0129": "BI:L/CR:N/CD:H/CV:E/RV:T/NP:T",
    "QIF-T0130": "BI:L/CR:N/CD:H/CV:E/RV:P/NP:P",
    "QIF-T0131": "BI:L/CR:N/CD:H/CV:E/RV:T/NP:T",
    "QIF-T0132": "BI:L/CR:N/CD:H/CV:E/RV:T/NP:T",
    "QIF-T0133": "BI:H/CR:N/CD:H/CV:E/RV:P/NP:T",
    "QIF-T0134": "BI:H/CR:N/CD:H/CV:E/RV:P/NP:T",
    "QIF-T0135": "BI:L/CR:H/CD:H/CV:E/RV:P/NP:T",
}


def main():
    print(f"Reading registrar: {REGISTRAR_PATH}")
    with open(REGISTRAR_PATH, "r") as f:
        data = json.load(f)

    techniques = data.get("techniques", [])
    updated = 0

    for tech in techniques:
        tid = tech.get("id")
        if tid not in CORRECTIONS:
            continue

        short_vec = CORRECTIONS[tid]
        codes = parse_short_vector(short_vec)
        full_vector = f"NISS:1.1/{short_vec}"
        score = compute_score(codes)
        severity = get_severity(score)
        pins = evaluate_pins(codes)

        old_vec = tech.get("niss", {}).get("vector", "N/A")
        old_score = tech.get("niss", {}).get("score", "N/A")

        tech["niss"] = {
            "version": "1.1",
            "vector": full_vector,
            "score": score,
            "severity": severity,
            "pins": pins,
            "components": None,
        }

        print(
            f"  {tid}: {old_vec} (score={old_score}) -> {full_vector} "
            f"(score={score}, severity={severity}, pins={pins})"
        )
        updated += 1

    if updated != len(CORRECTIONS):
        missing = set(CORRECTIONS.keys()) - {t["id"] for t in techniques}
        print(f"\nWARNING: {len(CORRECTIONS) - updated} techniques not found: {missing}")
        sys.exit(1)

    print(f"\nUpdated {updated} techniques. Writing back...")
    with open(REGISTRAR_PATH, "w") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
        f.write("\n")

    print("Done.")


if __name__ == "__main__":
    main()
