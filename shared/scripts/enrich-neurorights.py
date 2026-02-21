#!/usr/bin/env python3
"""
Enrich qtara-registrar.json with neurorights mappings.

Maps each of the 102 TARA techniques to affected neurorights based on:
- UI category (primary signal)
- DSM-5 cluster (overlay)
- NISS vector components (refinement)
- Consent tier (severity weighting)
- Dual-use classification

Neurorights taxonomy (Ienca-Andorno 2017 + QIF extensions):
  MP  = Mental Privacy (QIF extends with data-lifecycle protections, maps to CIA Confidentiality)
  CL  = Cognitive Liberty
  MI  = Mental Integrity (QIF extends with signal dynamics, maps to CIA Integrity)
  PC  = Psychological Continuity
  DI  = Dynamical Integrity (QIF-proposed, folded into MI)
  IDA = Informational Disassociation (QIF-proposed, folded into MP)
"""

import json
import sys
from pathlib import Path

REGISTRAR = Path(__file__).parent.parent / "shared" / "qtara-registrar.json"

# --- Mapping Rules ---

# Primary mapping: UI category → default neurorights
UI_CATEGORY_MAP = {
    "SI": ["MI", "CL"],        # Signal Injection: violates mental integrity + cognitive liberty
    "DS": ["MP"],              # Data Surveillance: violates mental privacy
    "SE": ["MP"],              # Side-channel Exploitation: extracts neural data
    "DM": ["MI", "CL"],       # Direct Manipulation: manipulates neural activity
    "PS": ["MI"],              # Protocol Subversion: compromises integrity
    "EX": ["MP"],              # Exfiltration: steals neural data
    "PE": ["MI", "MP"],        # Persona/Biometric: integrity + privacy
    "CI": [],                  # Chain/Indirect: determined per-technique below
}

# DSM-5 cluster overlays: add neurorights based on diagnostic cluster
DSM_CLUSTER_OVERLAY = {
    "persistent_personality": ["PC"],           # Personality changes → psychological continuity
    "mood_trauma": ["PC"],                      # Mood/trauma → psychological continuity
    "motor_neurocognitive": ["MI"],             # Motor/cognitive damage → mental integrity
    "cognitive_psychotic": ["MI", "CL"],        # Psychotic symptoms → integrity + liberty
    "non_diagnostic": [],                       # No additional overlay
}

# NISS vector component overlays
def niss_overlays(niss_vector: str) -> list:
    """Extract neurorights implications from NISS vector string."""
    rights = []
    if not niss_vector:
        return rights
    parts = niss_vector.split("/")
    for p in parts:
        if p.startswith("BI:") and p.split(":")[1] in ("H", "C"):
            rights.append("MI")  # High/Critical brain impact → mental integrity
        if p.startswith("CG:") and p.split(":")[1] in ("H", "C"):
            rights.append("CL")  # High/Critical cognitive → cognitive liberty
            rights.append("MI")  # Also mental integrity
        if p.startswith("NP:") and p.split(":")[1] == "T":
            rights.append("DI")  # Therapeutic potential → dynamical integrity (dual-use)
    return rights

# Techniques with multi-modal data fusion → Informational Disassociation
FUSION_TECHNIQUES = {
    "QIF-T0096", "QIF-T0097", "QIF-T0099",  # Gemini-identified
    "QIF-T0101",  # Multi-modal sensor fusion keystroke inference
    "QIF-T0102",  # Display-as-illuminator photometry (cross-modal)
}

# Techniques affecting neural homeodynamics → Dynamical Integrity
HOMEODYNAMIC_TECHNIQUES = {
    "QIF-T0066", "QIF-T0062", "QIF-T0070",  # Gemini-identified
    "QIF-T0001", "QIF-T0002", "QIF-T0003",  # Signal injection family (tDCS/tACS/TMS)
    "QIF-T0004", "QIF-T0005",               # Neural manipulation
    "QIF-T0006",                              # Ultrasonic neuromodulation
}

# Consent tier → severity weight for CCI computation
CONSENT_WEIGHT = {
    "prohibited": 4,
    "IRB": 3,
    "enhanced": 2,
    "standard": 1,
}


def compute_neurorights(tech: dict) -> list:
    """Compute the list of affected neurorights for a technique."""
    rights = set()

    # 1. UI category primary mapping
    ui_cat = tech.get("ui_category", "")
    if ui_cat == "CI":
        # Chain attacks: derive from band_ids
        band_ids = tech.get("band_ids", [])
        # If touches neural bands (N1-N7), add MI
        if any(b.startswith("N") for b in band_ids):
            rights.add("MI")
        # If touches sensor bands (S1-S3), add MP
        if any(b.startswith("S") for b in band_ids):
            rights.add("MP")
        # If touches interface (I0), add MI + MP
        if "I0" in band_ids:
            rights.update(["MI", "MP"])
    else:
        rights.update(UI_CATEGORY_MAP.get(ui_cat, []))

    # 2. DSM-5 cluster overlay
    tara = tech.get("tara") or {}
    dsm5 = tara.get("dsm5") or {}
    cluster = dsm5.get("cluster", "non_diagnostic")
    rights.update(DSM_CLUSTER_OVERLAY.get(cluster, []))

    # 3. NISS vector overlay
    niss = tech.get("niss") or {}
    vector = niss.get("vector", "")
    rights.update(niss_overlays(vector))

    # 4. Fusion techniques → Informational Disassociation
    tech_id = tech.get("id", "")
    if tech_id in FUSION_TECHNIQUES:
        rights.add("IDA")

    # 5. Homeodynamic techniques → Dynamical Integrity
    if tech_id in HOMEODYNAMIC_TECHNIQUES:
        rights.add("DI")

    # 6. High-severity techniques with dual_use=confirmed always get DI
    dual_use = tara.get("dual_use", "")
    if dual_use == "confirmed" and tech.get("severity") in ("critical", "high"):
        rights.add("DI")

    # 7. Any technique with risk_class="direct" gets MI if not already
    risk_class = dsm5.get("risk_class", "none")
    if risk_class == "direct":
        rights.add("MI")

    # Sort for consistency
    order = ["MP", "CL", "MI", "PC", "DI", "IDA"]
    return [r for r in order if r in rights]


def compute_cci(tech: dict, neurorights: list) -> float:
    """Compute Consent Complexity Index (CCI).

    CCI = (consent_weight × rights_count × severity_factor) / 10

    Range: 0.1 (trivial) to 4.0 (maximum complexity)
    """
    tara = tech.get("tara") or {}
    governance = tara.get("governance") or {}
    consent_tier = governance.get("consent_tier", "standard")

    consent_w = CONSENT_WEIGHT.get(consent_tier, 1)
    rights_count = len(neurorights) if neurorights else 1

    # Severity factor
    severity = tech.get("severity", "low")
    severity_factors = {"critical": 1.5, "high": 1.2, "medium": 1.0, "low": 0.8}
    sev_f = severity_factors.get(severity, 1.0)

    cci = round((consent_w * rights_count * sev_f) / 10, 2)
    return min(cci, 4.0)  # Cap at 4.0


def main():
    with open(REGISTRAR) as f:
        data = json.load(f)

    techniques = data.get("techniques", [])

    # Compute stats
    rights_counts = {}
    cci_values = []

    for tech in techniques:
        nr = compute_neurorights(tech)
        cci = compute_cci(tech, nr)

        tech["neurorights"] = {
            "affected": nr,
            "cci": cci,
        }

        cci_values.append(cci)
        for r in nr:
            rights_counts[r] = rights_counts.get(r, 0) + 1

    # Add neurorights statistics to top-level stats
    data["statistics"]["neurorights"] = {
        "version": "1.0",
        "taxonomy": {
            "MP": "Mental Privacy",
            "CL": "Cognitive Liberty",
            "MI": "Mental Integrity",
            "PC": "Psychological Continuity",
            "DI": "Dynamical Integrity (folded into MI)",
            "IDA": "Informational Disassociation (folded into MP)",
        },
        "sources": [
            "Ienca & Andorno 2017 (original 4: MP, CL, MI, PC)",
            "QIF Framework (MI extended with signal dynamics, MP extended with data lifecycle)",
        ],
        "techniques_by_right": rights_counts,
        "cci_stats": {
            "mean": round(sum(cci_values) / len(cci_values), 2),
            "max": max(cci_values),
            "min": min(cci_values),
            "techniques_above_2": sum(1 for c in cci_values if c > 2.0),
        }
    }

    with open(REGISTRAR, "w") as f:
        json.dump(data, f, indent=2)
        f.write("\n")

    # Print summary
    print("=== Neurorights Enrichment Complete ===")
    print(f"Techniques enriched: {len(techniques)}")
    print(f"\nTechniques by right:")
    order = ["MP", "CL", "MI", "PC", "DI", "IDA"]
    names = {
        "MP": "Mental Privacy", "CL": "Cognitive Liberty",
        "MI": "Mental Integrity", "PC": "Psychological Continuity",
        "DI": "Dynamical Integrity", "IDA": "Informational Disassociation",
    }
    for r in order:
        count = rights_counts.get(r, 0)
        print(f"  {r} ({names[r]}): {count}")

    print(f"\nCCI stats:")
    print(f"  Mean: {round(sum(cci_values)/len(cci_values), 2)}")
    print(f"  Max:  {max(cci_values)}")
    print(f"  Min:  {min(cci_values)}")
    print(f"  Above 2.0: {sum(1 for c in cci_values if c > 2.0)}")

    # Flag Gemini-identified anomalies
    print("\n=== Gemini-Validated Anomalies ===")
    for tech in techniques:
        tid = tech["id"]
        nr = tech["neurorights"]
        tara = tech.get("tara") or {}
        gov = tara.get("governance") or {}
        consent = gov.get("consent_tier", "?")
        niss_score = (tech.get("niss") or {}).get("score", 0)
        dual_use = tara.get("dual_use", "?")

        # pins inversion: silicon_only with standard consent but high NISS
        if dual_use == "silicon_only" and consent == "standard" and niss_score >= 6.0:
            print(f"  PINS INVERSION: {tid} ({tech['attack']}) — silicon_only, standard consent, NISS {niss_score}")

        # Under-consented persistent_personality
        dsm5 = tara.get("dsm5") or {}
        if dsm5.get("cluster") == "persistent_personality" and consent in ("standard", "enhanced") and niss_score >= 7.0:
            print(f"  UNDER-CONSENTED: {tid} ({tech['attack']}) — persistent_personality, {consent} consent, NISS {niss_score}")

        # "indirect" risk with high NISS
        if dsm5.get("risk_class") == "indirect" and niss_score >= 7.0:
            print(f"  INDIRECT MISNOMER: {tid} ({tech['attack']}) — risk_class=indirect but NISS {niss_score}")


if __name__ == "__main__":
    main()
