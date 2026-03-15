#!/usr/bin/env python3
"""
Classical-Quantum Bridge Validator

Validates threat-matrix.json consistency:
- Every technique has both classical and quantum mappings
- Layer→band translations match V2_TO_V3_MIGRATION in config.py
- All referenced layers (L1-L14) and bands (S1-S3, I0, N1-N3) are valid
- Generates consistency reports and filtered views

Usage:
    python bridge.py --validate          # Check consistency
    python bridge.py --model classical   # Classical-only view
    python bridge.py --model quantum     # Quantum-only view
    python bridge.py --diff              # Show where models diverge
    python bridge.py --stats             # Summary statistics
"""

import argparse
import json
import sys
from pathlib import Path

# Resolve paths relative to this script
SCRIPT_DIR = Path(__file__).parent
MATRIX_PATH = SCRIPT_DIR / "threat-matrix.json"
CONFIG_DIR = SCRIPT_DIR.parent / "qif" / "qif-lab" / "src"

# Valid identifiers
VALID_LAYERS = {f"L{i}" for i in range(1, 15)}
VALID_BANDS = {"S1", "S2", "S3", "I0", "N1", "N2", "N3"}
# Compound bands used for boundary-spanning techniques
VALID_COMPOUND_BANDS = {"I0/N1", "N1/N2"}

# Canonical layer→band migration (mirrors config.py V2_TO_V3_MIGRATION)
V2_TO_V3 = {
    "L1": "S3", "L2": "S3", "L3": "S3", "L4": "S3",
    "L5": "S3", "L6": "S3", "L7": "S3",
    "L8": "I0",
    "L9": "I0/N1",
    "L10": "N1/N2",
    "L11": "N2",
    "L12": "N3",
    "L13": "N3",
    "L14": "N3",
}


def load_matrix() -> dict:
    """Load threat-matrix.json."""
    with open(MATRIX_PATH) as f:
        return json.load(f)


def validate(matrix: dict) -> list[dict]:
    """
    Validate threat-matrix.json for consistency.

    Returns a list of error/warning dicts:
        {"level": "error"|"warning", "technique": "ONI-T001", "message": "..."}
    """
    issues = []

    def add(level, tech_id, msg):
        issues.append({"level": level, "technique": tech_id, "message": msg})

    # Check migration map matches config.py
    meta_migration = matrix.get("_meta", {}).get("migration", {})
    for layer, expected_band in V2_TO_V3.items():
        actual = meta_migration.get(layer)
        if actual != expected_band:
            add("error", "_meta", f"Migration map: {layer} should be {expected_band}, got {actual}")

    # Validate each technique
    for tactic in matrix.get("tactics", []):
        tactic_id = tactic.get("id", "unknown")
        for tech in tactic.get("techniques", []):
            tech_id = tech.get("id", "unknown")

            # Must have both classical and quantum
            if "classical" not in tech:
                add("error", tech_id, "Missing 'classical' mapping")
            if "quantum" not in tech:
                add("error", tech_id, "Missing 'quantum' mapping")

            # Validate classical layers
            classical = tech.get("classical", {})
            for layer in classical.get("target_layers", []):
                if layer not in VALID_LAYERS:
                    add("error", tech_id, f"Invalid classical layer: {layer}")

            # Validate quantum bands
            quantum = tech.get("quantum", {})
            for band in quantum.get("target_bands", []):
                if band not in VALID_BANDS and band not in VALID_COMPOUND_BANDS:
                    add("error", tech_id, f"Invalid quantum band: {band}")

            # Cross-validate: classical layers should map to quantum bands
            target_layers = classical.get("target_layers", [])
            target_bands = quantum.get("target_bands", [])
            if target_layers and target_bands:
                expected_bands = set()
                for layer in target_layers:
                    migrated = V2_TO_V3.get(layer)
                    if migrated:
                        # Handle compound bands
                        for part in migrated.split("/"):
                            expected_bands.add(part)
                        expected_bands.add(migrated)

                actual_band_parts = set()
                for band in target_bands:
                    actual_band_parts.add(band)
                    for part in band.split("/"):
                        actual_band_parts.add(part)

                # Check if there's reasonable overlap
                if not expected_bands.intersection(actual_band_parts):
                    add("warning", tech_id,
                        f"Layer→band mismatch: layers {target_layers} map to "
                        f"{sorted(expected_bands)} but quantum targets {target_bands}")

            # Validate shared fields
            shared = tech.get("shared", {})
            if "cia_impact" not in shared:
                add("warning", tech_id, "Missing CIA impact in shared")
            if "kohno_type" not in shared:
                add("warning", tech_id, "Missing Kohno type in shared")

            # Validate CIA values
            cia = shared.get("cia_impact", {})
            valid_cia = {"High", "Medium", "Low", "None"}
            for prop in ["C", "I", "A"]:
                val = cia.get(prop)
                if val and val not in valid_cia:
                    add("error", tech_id, f"Invalid CIA value for {prop}: {val}")

            # Validate Kohno type
            kohno = shared.get("kohno_type")
            valid_kohno = {"ALTERATION", "BLOCKING", "EAVESDROPPING"}
            if kohno and kohno not in valid_kohno:
                add("error", tech_id, f"Invalid Kohno type: {kohno}")

    # Validate defenses
    for defense in matrix.get("defenses", []):
        def_id = defense.get("id", "unknown")
        if "classical" not in defense:
            add("error", def_id, "Defense missing classical mapping")
        if "quantum" not in defense:
            add("error", def_id, "Defense missing quantum mapping")

    return issues


def filter_model(matrix: dict, model: str) -> dict:
    """Return a filtered view for one model (classical or quantum)."""
    filtered = {
        "_meta": {
            "model": model,
            "source": "threat-matrix.json",
            "description": f"{model.title()} model view of the shared threat matrix"
        },
        "tactics": [],
    }

    for tactic in matrix.get("tactics", []):
        filtered_tactic = {
            "id": tactic["id"],
            "name": tactic["name"],
            "description": tactic["description"],
            "techniques": [],
        }
        for tech in tactic.get("techniques", []):
            model_data = tech.get(model, {})
            shared = tech.get("shared", {})
            filtered_tech = {
                "id": tech["id"],
                "name": tech["name"],
                "description": tech["description"],
                **model_data,
                **shared,
            }
            filtered_tactic["techniques"].append(filtered_tech)
        filtered["tactics"].append(filtered_tactic)

    return filtered


def show_diff(matrix: dict):
    """Show where classical and quantum models diverge in detection capability."""
    print("=" * 72)
    print("CLASSICAL vs QUANTUM DETECTION CAPABILITY DIFF")
    print("=" * 72)

    for tactic in matrix.get("tactics", []):
        print(f"\n--- {tactic['id']}: {tactic['name']} ---")
        for tech in tactic.get("techniques", []):
            classical = tech.get("classical", {})
            quantum = tech.get("quantum", {})

            c_detect = classical.get("classical_detection", "Yes" if classical.get("detection") else "Unknown")
            q_detect = quantum.get("detection", "Unknown")

            marker = "  " if c_detect == q_detect else ">>"
            print(f"  {marker} {tech['id']:10s} {tech['name']:35s}  "
                  f"Classical: {str(c_detect):20s}  Quantum: {q_detect}")


def show_stats(matrix: dict):
    """Show summary statistics."""
    tactics = matrix.get("tactics", [])
    techniques = [t for tac in tactics for t in tac.get("techniques", [])]
    defenses = matrix.get("defenses", [])
    neurorights = matrix.get("neurorights", [])

    # Count by Kohno type
    kohno_counts = {}
    for tech in techniques:
        kohno = tech.get("shared", {}).get("kohno_type", "Unknown")
        kohno_counts[kohno] = kohno_counts.get(kohno, 0) + 1

    # Count by severity
    severity_counts = {}
    for tech in techniques:
        sev = tech.get("classical", {}).get("severity", "Unknown")
        severity_counts[sev] = severity_counts.get(sev, 0) + 1

    # Count quantum-only detections
    quantum_only = sum(
        1 for t in techniques
        if t.get("classical", {}).get("classical_detection") == "No"
        or (not t.get("classical", {}).get("detection") and not t.get("classical", {}).get("mitigations"))
    )

    print("=" * 50)
    print("SHARED THREAT MATRIX — STATISTICS")
    print("=" * 50)
    print(f"\nTactics:        {len(tactics)}")
    print(f"Techniques:     {len(techniques)}")
    print(f"Defenses:       {len(defenses)}")
    print(f"Neurorights:    {len(neurorights)}")
    print(f"\nBy Kohno Type:")
    for k, v in sorted(kohno_counts.items()):
        print(f"  {k:20s} {v}")
    print(f"\nBy Severity:")
    for k, v in sorted(severity_counts.items()):
        print(f"  {k:20s} {v}")
    print(f"\nQuantum-only detections: {quantum_only}")
    print(f"Proposed techniques:    {sum(1 for t in techniques if t.get('status') == 'proposed')}")


def main():
    parser = argparse.ArgumentParser(
        description="Classical-Quantum Bridge Validator",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__
    )
    parser.add_argument("--validate", action="store_true",
                        help="Validate threat-matrix.json consistency")
    parser.add_argument("--model", choices=["classical", "quantum"],
                        help="Output filtered view for one model")
    parser.add_argument("--diff", action="store_true",
                        help="Show where models diverge in detection")
    parser.add_argument("--stats", action="store_true",
                        help="Show summary statistics")
    parser.add_argument("--json", action="store_true",
                        help="Output in JSON format (for --model and --validate)")

    args = parser.parse_args()

    if not any([args.validate, args.model, args.diff, args.stats]):
        parser.print_help()
        sys.exit(0)

    matrix = load_matrix()

    if args.validate:
        issues = validate(matrix)
        errors = [i for i in issues if i["level"] == "error"]
        warnings = [i for i in issues if i["level"] == "warning"]

        if args.json:
            print(json.dumps({"errors": len(errors), "warnings": len(warnings), "issues": issues}, indent=2))
        else:
            print("=" * 50)
            print("BRIDGE VALIDATION REPORT")
            print("=" * 50)
            if not issues:
                print("\nAll checks passed. 0 errors, 0 warnings.")
            else:
                for issue in issues:
                    prefix = "ERROR" if issue["level"] == "error" else "WARN "
                    print(f"  [{prefix}] {issue['technique']:12s} {issue['message']}")
                print(f"\nTotal: {len(errors)} errors, {len(warnings)} warnings")

        sys.exit(1 if errors else 0)

    if args.model:
        filtered = filter_model(matrix, args.model)
        print(json.dumps(filtered, indent=2))

    if args.diff:
        show_diff(matrix)

    if args.stats:
        show_stats(matrix)


if __name__ == "__main__":
    main()
