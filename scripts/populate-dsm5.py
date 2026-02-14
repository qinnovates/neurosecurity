#!/usr/bin/env python3
"""
Populate DSM-5-TR diagnostic mapping for all 99 TARA techniques.

Neural Impact Chain (NIC): Technique → Band → Structure → Function → NISS + DSM
NISS-DSM Bridge: NISS metrics predict diagnostic clusters.

Usage:
    python3 scripts/populate-dsm5.py
    python3 scripts/populate-dsm5.py --dry-run
"""

import json
import sys
import re
from pathlib import Path
from collections import defaultdict

REGISTRY_PATH = Path(__file__).parent.parent / "shared" / "qtara-registrar.json"

# ═══════════════════════════════════════════════════════════════
# Band-to-DSM Lookup Table (Gemini-reviewed, literature-validated)
# ═══════════════════════════════════════════════════════════════

BAND_DSM_PROFILES = {
    "N7": {
        "structures": ["PFC", "M1", "V1", "Broca", "Wernicke"],
        "functions": ["executive function", "language", "movement", "perception"],
        "primary_diagnoses": [
            {"code": "F20", "name": "Schizophrenia Spectrum", "confidence": "established"},
            {"code": "F32", "name": "Major Depressive Disorder", "confidence": "established"},
            {"code": "F90", "name": "ADHD", "confidence": "established"},
            {"code": "F42", "name": "OCD", "confidence": "established"},
        ],
        "secondary_diagnoses": [
            {"code": "F30", "name": "Bipolar Disorder", "confidence": "established"},
            {"code": "F43", "name": "PTSD / Trauma", "confidence": "established"},
            {"code": "F80", "name": "Communication Disorders", "confidence": "established"},
            {"code": "F60", "name": "Personality Disorders", "confidence": "probable"},
            {"code": "F63", "name": "Impulse-Control Disorders", "confidence": "probable"},
            {"code": "F01", "name": "Neurocognitive Disorders", "confidence": "established"},
            {"code": "F98.4", "name": "Motor Disorders", "confidence": "established"},
        ],
    },
    "N6": {
        "structures": ["hippocampus", "amygdala", "insula"],
        "functions": ["emotion regulation", "memory consolidation", "interoception"],
        "primary_diagnoses": [
            {"code": "F32", "name": "Major Depressive Disorder", "confidence": "established"},
            {"code": "F41.1", "name": "Generalized Anxiety Disorder", "confidence": "established"},
            {"code": "F43.10", "name": "PTSD", "confidence": "established"},
            {"code": "F44", "name": "Dissociative Disorders", "confidence": "established"},
        ],
        "secondary_diagnoses": [
            {"code": "F30", "name": "Bipolar Disorder", "confidence": "established"},
            {"code": "F42", "name": "OCD", "confidence": "probable"},
            {"code": "F50", "name": "Eating Disorders", "confidence": "probable"},
            {"code": "F10", "name": "Substance Use Disorders", "confidence": "established"},
            {"code": "F60", "name": "Personality Disorders", "confidence": "established"},
            {"code": "F45", "name": "Somatic Symptom Disorders", "confidence": "probable"},
            {"code": "F63", "name": "Impulse-Control Disorders", "confidence": "probable"},
            {"code": "F01", "name": "Neurocognitive Disorders", "confidence": "established"},
        ],
    },
    "N5": {
        "structures": ["striatum", "STN", "substantia nigra"],
        "functions": ["motor selection", "reward processing", "habit formation"],
        "primary_diagnoses": [
            {"code": "F90", "name": "ADHD", "confidence": "established"},
            {"code": "F10", "name": "Substance Use Disorders", "confidence": "established"},
            {"code": "F42", "name": "OCD", "confidence": "established"},
            {"code": "F95", "name": "Tic Disorders", "confidence": "established"},
        ],
        "secondary_diagnoses": [
            {"code": "F20", "name": "Schizophrenia Spectrum", "confidence": "probable"},
            {"code": "F50", "name": "Eating Disorders", "confidence": "probable"},
            {"code": "G20", "name": "Movement Disorders", "confidence": "established"},
        ],
    },
    "N4": {
        "structures": ["thalamus", "hypothalamus"],
        "functions": ["sensory gating", "consciousness", "homeostasis"],
        "primary_diagnoses": [
            {"code": "F20", "name": "Schizophrenia Spectrum", "confidence": "established"},
            {"code": "G47", "name": "Sleep-Wake Disorders", "confidence": "established"},
            {"code": "F44", "name": "Dissociative Disorders", "confidence": "probable"},
        ],
        "secondary_diagnoses": [
            {"code": "F32", "name": "Major Depressive Disorder", "confidence": "probable"},
            {"code": "F50", "name": "Eating Disorders", "confidence": "established"},
            {"code": "F52", "name": "Sexual Dysfunctions", "confidence": "probable"},
        ],
    },
    "N3": {
        "structures": ["cerebellar cortex", "deep cerebellar nuclei"],
        "functions": ["motor coordination", "timing", "cognitive integration"],
        "primary_diagnoses": [
            {"code": "F82", "name": "Motor Coordination Disorder", "confidence": "established"},
            {"code": "F84", "name": "Autism Spectrum Disorder", "confidence": "established"},
        ],
        "secondary_diagnoses": [
            {"code": "F20", "name": "Schizophrenia Spectrum", "confidence": "established"},
            {"code": "F90", "name": "ADHD", "confidence": "probable"},
            {"code": "F30", "name": "Bipolar Disorder", "confidence": "probable"},
            {"code": "F32", "name": "Major Depressive Disorder", "confidence": "probable"},
            {"code": "F41.1", "name": "Generalized Anxiety Disorder", "confidence": "probable"},
            {"code": "F01", "name": "Neurocognitive Disorders", "confidence": "established"},
        ],
    },
    "N2": {
        "structures": ["medulla", "pons", "midbrain"],
        "functions": ["vital functions", "arousal", "neurotransmitter production"],
        "primary_diagnoses": [
            {"code": "G47", "name": "Sleep-Wake Disorders", "confidence": "established"},
        ],
        "secondary_diagnoses": [
            {"code": "F32", "name": "Major Depressive Disorder", "confidence": "probable"},
            {"code": "F41.0", "name": "Panic Disorder", "confidence": "probable"},
            {"code": "F10", "name": "Substance Use Disorders", "confidence": "established"},
            {"code": "F01", "name": "Neurocognitive Disorders", "confidence": "established"},
        ],
    },
    "N1": {
        "structures": ["spinal cord"],
        "functions": ["reflexes", "peripheral relay", "pain processing"],
        "primary_diagnoses": [
            {"code": "F45", "name": "Somatic Symptom / Pain Disorders", "confidence": "established"},
            {"code": "F44.4", "name": "Conversion Disorder", "confidence": "established"},
        ],
        "secondary_diagnoses": [
            {"code": "F82", "name": "Motor Coordination Disorder", "confidence": "probable"},
        ],
    },
    "I0": {
        "structures": ["electrode-tissue boundary"],
        "functions": ["measurement", "signal transduction"],
        "primary_diagnoses": [
            {"code": "F43.2", "name": "Adjustment Disorder", "confidence": "established"},
        ],
        "secondary_diagnoses": [],
    },
    "S1": {"structures": ["ASIC/analog front-end"], "functions": ["hardware processing"],
           "primary_diagnoses": [], "secondary_diagnoses": []},
    "S2": {"structures": ["firmware/DSP"], "functions": ["signal processing"],
           "primary_diagnoses": [], "secondary_diagnoses": []},
    "S3": {"structures": ["network/cloud"], "functions": ["data pipeline"],
           "primary_diagnoses": [], "secondary_diagnoses": []},
}

# ═══════════════════════════════════════════════════════════════
# Diagnostic Cluster Scoring (NISS-DSM Bridge)
# ═══════════════════════════════════════════════════════════════
# Each band contributes weighted scores toward diagnostic clusters.
# NISS metrics provide additional weighting.

BAND_CLUSTER_WEIGHTS = {
    "N7": {"cognitive_psychotic": 3, "mood_trauma": 2, "motor_neurocognitive": 1, "persistent_personality": 1},
    "N6": {"mood_trauma": 4, "cognitive_psychotic": 1, "motor_neurocognitive": 0, "persistent_personality": 2},
    "N5": {"cognitive_psychotic": 2, "mood_trauma": 1, "motor_neurocognitive": 2, "persistent_personality": 0},
    "N4": {"cognitive_psychotic": 2, "mood_trauma": 2, "motor_neurocognitive": 1, "persistent_personality": 0},
    "N3": {"cognitive_psychotic": 2, "mood_trauma": 1, "motor_neurocognitive": 2, "persistent_personality": 0},
    "N2": {"mood_trauma": 2, "motor_neurocognitive": 2, "cognitive_psychotic": 0, "persistent_personality": 0},
    "N1": {"motor_neurocognitive": 3, "mood_trauma": 1, "cognitive_psychotic": 0, "persistent_personality": 0},
    "I0": {"motor_neurocognitive": 1, "mood_trauma": 1, "cognitive_psychotic": 0, "persistent_personality": 0},
    "S1": {}, "S2": {}, "S3": {},
}

# NISS metric abbreviation values (from niss_spec)
NISS_HIGH_VALUES = {
    "BI": {"H", "C"},          # High or Critical
    "CG": {"H", "C"},
    "CV": {"E", "I"},          # Elevated or Involuntary
    "RV": {"P", "I"},          # Partial or Irreversible (poorly reversible)
    "NP": {"S"},               # Structural (lasting change)
}


def parse_niss_vector(vector_str: str) -> dict:
    """Parse 'NISS:1.0/BI:H/CG:H/CV:E/RV:P/NP:T' → {'BI': 'H', 'CG': 'H', ...}"""
    parts = vector_str.split("/")
    result = {}
    for part in parts[1:]:  # skip version prefix
        if ":" in part:
            key, val = part.split(":", 1)
            result[key] = val
    return result


def compute_niss_cluster_bonus(niss_vector: dict) -> dict:
    """Apply NISS-driven bonuses to cluster scores.

    NISS-DSM Bridge:
      BI (Biological Impact)  → motor_neurocognitive  (tissue/structural damage)
      CG (Cognitive Integrity) → cognitive_psychotic   (cognitive disruption)
      CV (Consent Violation)   → mood_trauma           (autonomy violation → trauma/mood)
      RV (Reversibility)       → persistent_personality (poor reversibility → chronicity)
      NP (Neuroplasticity)     → persistent_personality (lasting neural change)
    """
    bonus = defaultdict(int)
    bi = niss_vector.get("BI", "N")
    cg = niss_vector.get("CG", "N")
    cv = niss_vector.get("CV", "N")
    rv = niss_vector.get("RV", "F")
    np_ = niss_vector.get("NP", "N")

    if bi in NISS_HIGH_VALUES["BI"]:
        bonus["motor_neurocognitive"] += 2
    if cg in NISS_HIGH_VALUES["CG"]:
        bonus["cognitive_psychotic"] += 2
    if cv in NISS_HIGH_VALUES["CV"]:
        bonus["mood_trauma"] += 1  # Mild signal (CV is near-universal for attacks)
    if np_ in NISS_HIGH_VALUES["NP"]:
        bonus["persistent_personality"] += 3  # Strong signal: structural change → lasting
    if rv in NISS_HIGH_VALUES["RV"]:
        bonus["persistent_personality"] += 2  # Poor reversibility → chronicity

    return dict(bonus)


def compute_cluster(band_ids: list, niss: dict) -> str:
    """Determine diagnostic cluster from bands + NISS scores."""
    neural_bands = [b for b in band_ids if b.startswith("N") or b == "I0"]
    silicon_only = len(neural_bands) == 0

    if silicon_only:
        return "non_diagnostic"

    scores = defaultdict(int)

    # Band contribution
    for band in band_ids:
        weights = BAND_CLUSTER_WEIGHTS.get(band, {})
        for cluster, weight in weights.items():
            scores[cluster] += weight

    # NISS bonus
    niss_vector = parse_niss_vector(niss.get("vector", ""))
    for cluster, bonus in compute_niss_cluster_bonus(niss_vector).items():
        scores[cluster] += bonus

    if not scores:
        return "non_diagnostic"

    return max(scores, key=scores.get)


def build_pathway(band_ids: list) -> str:
    """Build human-readable pathway string from band IDs."""
    neural_bands = sorted(
        [b for b in band_ids if b.startswith("N") or b == "I0"],
        key=lambda x: -int(x[1]) if x[0] == "N" else -1 if x == "I0" else 0,
    )
    if not neural_bands:
        return "S-domain only — no neural pathway"

    parts = []
    for band in neural_bands[:2]:  # top 2 neural bands
        profile = BAND_DSM_PROFILES.get(band, {})
        structures = profile.get("structures", [])
        functions = profile.get("functions", [])
        struct_str = "/".join(structures[:2]) if structures else band
        func_str = functions[0] if functions else "unknown"
        parts.append(f"{band} ({struct_str}) → {func_str}")
    return "; ".join(parts)


def build_niss_correlation(cluster: str, niss: dict) -> str:
    """Build human-readable NISS→DSM correlation string."""
    vector = parse_niss_vector(niss.get("vector", ""))
    if not vector:
        return ""

    high_metrics = []
    for metric in ["BI", "CG", "CV", "RV", "NP"]:
        val = vector.get(metric, "N")
        high_vals = NISS_HIGH_VALUES.get(metric, set())
        if val in high_vals:
            high_metrics.append(f"{metric}:{val}")

    cluster_labels = {
        "cognitive_psychotic": "cognitive/psychotic cluster",
        "mood_trauma": "mood/trauma cluster",
        "motor_neurocognitive": "motor/neurocognitive cluster",
        "persistent_personality": "persistent/personality cluster",
        "non_diagnostic": "non-diagnostic",
    }
    label = cluster_labels.get(cluster, cluster)

    if high_metrics:
        return f"{','.join(high_metrics)} → {label}"
    return f"Low neural impact → {label}"


def collect_diagnoses(band_ids: list, primary_or_secondary: str) -> list:
    """Collect and deduplicate diagnoses from all bands."""
    seen_codes = set()
    result = []
    neural_bands = [b for b in band_ids if b.startswith("N") or b == "I0"]

    for band in neural_bands:
        profile = BAND_DSM_PROFILES.get(band, {})
        diagnoses = profile.get(f"{primary_or_secondary}_diagnoses", [])
        for dx in diagnoses:
            if dx["code"] not in seen_codes:
                seen_codes.add(dx["code"])
                result.append(dict(dx))

    return result


def compute_risk_class(band_ids: list, dual_use: str) -> str:
    """Determine risk class based on band membership and dual-use status."""
    neural_bands = [b for b in band_ids if b.startswith("N") or b == "I0"]
    if not neural_bands:
        return "none"
    if dual_use in ("confirmed", "probable"):
        return "direct"
    if dual_use == "possible":
        return "indirect"
    # silicon_only with neural bands (e.g., firmware attack affecting N-bands)
    return "indirect"


def populate_technique(technique: dict) -> dict:
    """Add dsm5 field to a single technique's tara projection."""
    tara = technique.get("tara")
    if not tara:
        return technique

    band_ids = technique.get("band_ids", [])
    niss = technique.get("niss", {})
    dual_use = tara.get("dual_use", "silicon_only")

    cluster = compute_cluster(band_ids, niss)
    risk_class = compute_risk_class(band_ids, dual_use)

    if cluster == "non_diagnostic":
        tara["dsm5"] = {
            "primary": [],
            "secondary": [],
            "risk_class": "none",
            "cluster": "non_diagnostic",
            "pathway": "S-domain only — no neural pathway",
            "niss_correlation": "Silicon-only technique — no diagnostic mapping",
        }
    else:
        primary = collect_diagnoses(band_ids, "primary")
        secondary = collect_diagnoses(band_ids, "secondary")
        # Remove from secondary anything already in primary
        primary_codes = {d["code"] for d in primary}
        secondary = [d for d in secondary if d["code"] not in primary_codes]

        tara["dsm5"] = {
            "primary": primary,
            "secondary": secondary,
            "risk_class": risk_class,
            "cluster": cluster,
            "pathway": build_pathway(band_ids),
            "niss_correlation": build_niss_correlation(cluster, niss),
        }

    return technique


# ═══════════════════════════════════════════════════════════════
# DSM-5-TR Specification (registry-level)
# ═══════════════════════════════════════════════════════════════

DSM5_SPEC = {
    "version": "1.0",
    "name": "DSM-5-TR Diagnostic Mapping via Neural Impact Chain",
    "description": "Maps BCI techniques to psychiatric diagnoses through the hourglass band model. NISS metrics predict diagnostic clusters. First known formal BCI threat-to-psychiatric-diagnosis taxonomy.",
    "methodology": "Band → Structure → Function → NISS (quantitative) + DSM (qualitative)",
    "positioning": "RDoC-aligned, BCI-specific, with quantitative bridge (NISS) to traditional nosology (DSM-5-TR)",
    "band_profiles": {
        band: {
            "structures": profile["structures"],
            "functions": profile["functions"],
            "primary_codes": [d["code"] for d in profile["primary_diagnoses"]],
            "secondary_codes": [d["code"] for d in profile["secondary_diagnoses"]],
        }
        for band, profile in BAND_DSM_PROFILES.items()
    },
    "niss_dsm_bridge": {
        "BI": {"risk_domain": "Structural/Tissue damage", "primary_clusters": ["motor_neurocognitive"], "dsm_chapters": ["Motor (F82/F95)", "Neurocognitive (F01-G31)"]},
        "CG": {"risk_domain": "Cognitive function disruption", "primary_clusters": ["cognitive_psychotic"], "dsm_chapters": ["Neurodevelopmental (F70-F98)", "Schizophrenia Spectrum (F20-F29)"]},
        "CV": {"risk_domain": "Consent/autonomy violation", "primary_clusters": ["mood_trauma"], "dsm_chapters": ["Depressive (F32-F34)", "Anxiety (F40-F41)", "Trauma/PTSD (F43)", "Dissociative (F44)"]},
        "RV": {"risk_domain": "Chronicity modifier", "primary_clusters": ["persistent_personality"], "dsm_chapters": ["Distinguishes acute (F43.2) vs persistent (F34.1) presentations"]},
        "NP": {"risk_domain": "Lasting neural change", "primary_clusters": ["persistent_personality"], "dsm_chapters": ["Personality (F60-F69)", "Neurodegenerative (G30-G31)"]},
    },
    "diagnostic_clusters": {
        "cognitive_psychotic": {
            "label": "Cognitive/Psychotic",
            "color": "#f59e0b",
            "niss_drivers": ["CG", "BI"],
            "dsm_chapters": ["Schizophrenia Spectrum (F20-F29)", "Neurodevelopmental (F70-F98)", "Neurocognitive (F01-G31)"],
        },
        "mood_trauma": {
            "label": "Mood/Trauma",
            "color": "#eab308",
            "niss_drivers": ["CV", "CG"],
            "dsm_chapters": ["Depressive (F32-F34)", "Anxiety (F40-F41)", "Trauma/PTSD (F43)", "Dissociative (F44)", "OCD (F42)"],
        },
        "motor_neurocognitive": {
            "label": "Motor/Neurocognitive",
            "color": "#ef4444",
            "niss_drivers": ["BI", "NP"],
            "dsm_chapters": ["Motor (F82/F95)", "Neurocognitive (F01-G31)", "Somatic Symptom (F45)"],
        },
        "persistent_personality": {
            "label": "Persistent/Personality",
            "color": "#a855f7",
            "niss_drivers": ["NP", "RV"],
            "dsm_chapters": ["Personality (F60-F69)", "Neurodegenerative (G30-G31)"],
        },
        "non_diagnostic": {
            "label": "Non-Diagnostic",
            "color": "#94a3b8",
            "niss_drivers": [],
            "dsm_chapters": [],
        },
    },
}


def update_statistics(registry: dict) -> None:
    """Update registry statistics with DSM-5 data."""
    stats = registry.get("statistics", {})
    tara_stats = stats.get("tara", {})

    clusters = defaultdict(int)
    risk_classes = defaultdict(int)
    dsm_codes = set()
    with_dsm5 = 0

    for t in registry["techniques"]:
        dsm5 = t.get("tara", {}).get("dsm5")
        if not dsm5:
            continue
        with_dsm5 += 1
        clusters[dsm5["cluster"]] += 1
        risk_classes[dsm5["risk_class"]] += 1
        for d in dsm5.get("primary", []):
            dsm_codes.add(d["code"])

    tara_stats["dsm5"] = {
        "version": "1.0",
        "techniques_with_dsm5": with_dsm5,
        "unique_dsm_codes": len(dsm_codes),
        "cluster_breakdown": dict(clusters),
        "risk_class_breakdown": dict(risk_classes),
    }
    stats["tara"] = tara_stats


def main():
    dry_run = "--dry-run" in sys.argv

    print(f"Loading registry from {REGISTRY_PATH}")
    with open(REGISTRY_PATH) as f:
        registry = json.load(f)

    techniques = registry["techniques"]
    print(f"Found {len(techniques)} techniques")

    # Populate DSM-5 for each technique
    for i, t in enumerate(techniques):
        populate_technique(t)

    # Add dsm5_spec at registry level
    registry["dsm5_spec"] = DSM5_SPEC

    # Update statistics
    update_statistics(registry)

    # Summary
    clusters = defaultdict(int)
    risk_classes = defaultdict(int)
    for t in techniques:
        dsm5 = t.get("tara", {}).get("dsm5")
        if dsm5:
            clusters[dsm5["cluster"]] += 1
            risk_classes[dsm5["risk_class"]] += 1

    print("\n=== DSM-5-TR Population Summary ===")
    print(f"Total techniques: {len(techniques)}")
    print(f"\nDiagnostic Clusters:")
    for cluster, count in sorted(clusters.items()):
        print(f"  {cluster}: {count}")
    print(f"\nRisk Classes:")
    for rc, count in sorted(risk_classes.items()):
        print(f"  {rc}: {count}")

    if dry_run:
        print("\n[DRY RUN] No changes written.")
        # Print sample
        for tid in ["QIF-T0001", "QIF-T0010", "QIF-T0007"]:
            for t in techniques:
                if t["id"] == tid:
                    dsm5 = t.get("tara", {}).get("dsm5", {})
                    print(f"\nSample — {tid} ({t['attack']}):")
                    print(f"  Bands: {t['band_ids']}")
                    print(f"  Cluster: {dsm5.get('cluster')}")
                    print(f"  Risk class: {dsm5.get('risk_class')}")
                    print(f"  Primary: {[d['code'] + ' ' + d['name'] for d in dsm5.get('primary', [])]}")
                    print(f"  Pathway: {dsm5.get('pathway')}")
                    print(f"  NISS correlation: {dsm5.get('niss_correlation')}")
                    break
    else:
        print(f"\nWriting updated registry to {REGISTRY_PATH}")
        with open(REGISTRY_PATH, "w") as f:
            json.dump(registry, f, indent=2, ensure_ascii=False)
        print("Done.")


if __name__ == "__main__":
    main()
