#!/usr/bin/env python3
"""
Neurosecurity Score v2.1 Calculator
Computes NSv2.1 for all devices in the QIF BCI landscape.

Formula: CES geometric BNS → ISO 31000 Risk → OWA per-right → Geometric overall
Per OECD/JRC Composite Indicator methodology, Yager (1988) OWA, ISO 31000.
"""

import json
import math
import sys
from pathlib import Path

EPSILON = 0.01

# --- Layer 1: Normalization ---

def niss_norm(niss: float) -> float:
    return max(niss / 10.0, EPSILON)

def cci_norm(cci: float) -> float:
    return max(min(cci / 3.0, 1.0), EPSILON)

# Ordinal coding (Stevens 1946 compliant)
SEVERITY_THETA = {"low": 0.25, "medium": 0.50, "high": 0.75, "critical": 1.00}

def dsm_norm(severity: str) -> float:
    return SEVERITY_THETA.get(severity, 0.25)

# --- Layer 2: Base Neurosecurity Score (Weighted Geometric Mean / CES rho=0) ---
# Weights: NISS 0.40 (threat capability), DSM 0.40 (psychological impact), CCI 0.20 (mechanism depth)
# Justification: Causal endpoints (capability + outcome) weighted over mechanistic mediator.
# Per OECD/JRC Handbook: differential weights acceptable with theoretical rationale.

W_NISS = 0.40
W_CCI = 0.20
W_DSM = 0.40

def bns(niss_n: float, cci_n: float, dsm_n: float) -> float:
    return (niss_n ** W_NISS) * (cci_n ** W_CCI) * (dsm_n ** W_DSM)

# --- Layer 3: Risk = Hazard × Feasibility (ISO 31000) ---

P_REALIZE = {
    0: 0.95,   # feasible_now
    1: 0.75,   # near_term
    2: 0.40,   # mid_term
    3: 0.10,   # far_term
    "X": 0.95, # no_physics_gate
}

def feasibility(physics_tier) -> float:
    if isinstance(physics_tier, str):
        # Handle string tiers like "X" or "0"
        if physics_tier.upper() == "X":
            return P_REALIZE["X"]
        try:
            return P_REALIZE[int(physics_tier)]
        except (ValueError, KeyError):
            return 0.95
    return P_REALIZE.get(physics_tier, 0.95)

# --- Layer 4: OWA Aggregation (Yager 1988) ---

def owa_weights(n: int, lam: float = 0.5) -> list:
    if n == 0:
        return []
    raw = [lam ** i for i in range(n)]
    total = sum(raw)
    return [w / total for w in raw]

def owa_aggregate(values: list, lam: float = 0.5) -> float:
    if not values:
        return 0.0
    sorted_vals = sorted(values, reverse=True)
    weights = owa_weights(len(sorted_vals), lam)
    return sum(w * v for w, v in zip(weights, sorted_vals))

# --- Layer 5: Overall Score (Geometric Mean) ---

def geometric_mean(values: list) -> float:
    if not values:
        return 0.0
    product = 1.0
    for v in values:
        product *= max(v, EPSILON)
    return product ** (1.0 / len(values))

# --- Layer 7: CRB (Multiplicative) ---

def crb_adjust(ns: float, crb: float, gamma: float = 0.30) -> float:
    return min(ns * (1 + gamma * crb), 10.0)

# --- EA Assessment (System-Level) ---

# Default EA assessments by device type/category
EA_PROFILES = {
    "invasive_medical": {"afford": 0.85, "geo": 0.80, "legal": 0.70, "demo": 0.60},
    "invasive_research": {"afford": 0.70, "geo": 0.75, "legal": 0.80, "demo": 0.65},
    "semi_invasive_medical": {"afford": 0.75, "geo": 0.70, "legal": 0.65, "demo": 0.55},
    "non_invasive_consumer": {"afford": 0.20, "geo": 0.15, "legal": 0.10, "demo": 0.25},
    "non_invasive_research": {"afford": 0.40, "geo": 0.35, "legal": 0.30, "demo": 0.35},
    "non_invasive_medical": {"afford": 0.50, "geo": 0.45, "legal": 0.40, "demo": 0.40},
    "non_invasive_enterprise": {"afford": 0.35, "geo": 0.25, "legal": 0.20, "demo": 0.30},
    "software_developer": {"afford": 0.30, "geo": 0.10, "legal": 0.15, "demo": 0.20},
}

def ea_score(device_type: str, purpose: str) -> float:
    key = f"{device_type}_{purpose}"
    profile = EA_PROFILES.get(key, EA_PROFILES.get(f"{device_type}_consumer",
              {"afford": 0.30, "geo": 0.25, "legal": 0.20, "demo": 0.25}))
    return sum(profile.values()) / len(profile)


# --- Main Computation ---

RIGHTS = ["CL", "MI", "MP", "PC"]  # Technical rights (EA is system-level)
ALL_RIGHTS = ["CL", "MI", "MP", "PC", "EA"]

# Severity thresholds (recalibrated for geometric aggregation)
def severity_label(score: float) -> str:
    if score < 0.1: return "None"
    if score < 3.0: return "Low"
    if score < 5.0: return "Medium"
    if score < 7.0: return "High"
    return "Critical"


def compute_device_score(device_name: str, techniques: list, device_type: str,
                          purpose: str, lam: float = 0.5) -> dict:
    """Compute NSv2.1 for a single device."""

    # Step 1-3: Compute Risk(T, R) for each technique and right
    technique_risks = []
    for t in techniques:
        nn = niss_norm(t["niss"])
        cn = cci_norm(t["cci"])
        dn = dsm_norm(t["severity"])
        base = bns(nn, cn, dn)
        phi = feasibility(t["physics_tier"])
        risk = base * phi

        rights = t.get("rights", [])
        technique_risks.append({
            "id": t["id"],
            "bns": base,
            "feasibility": phi,
            "risk": risk,
            "rights": rights,
        })

    # Step 4: OWA per right
    right_scores = {}
    right_details = {}
    for r in RIGHTS:
        r_risks = [tr["risk"] for tr in technique_risks if r in tr["rights"]]
        rs = owa_aggregate(r_risks, lam)
        right_scores[r] = rs * 10
        right_details[r] = {"score": rs * 10, "n_techniques": len(r_risks)}

    # EA (system-level)
    ea = ea_score(device_type, purpose)
    right_scores["EA"] = ea * 10
    right_details["EA"] = {"score": ea * 10, "n_techniques": "system-level"}

    # Step 5: Overall (geometric mean of 5 right scores)
    all_scores = [right_scores[r] for r in ALL_RIGHTS]
    ns = geometric_mean(all_scores)

    # Vector string
    vector_parts = [f"NSv2.1:{ns:.2f}"]
    for r in ALL_RIGHTS:
        vector_parts.append(f"{r}:{right_scores[r]:.2f}")
    vector = "/".join(vector_parts)

    return {
        "device": device_name,
        "type": device_type,
        "purpose": purpose,
        "n_techniques": len(techniques),
        "overall_score": round(ns, 2),
        "severity": severity_label(ns),
        "subscores": {r: round(right_scores[r], 2) for r in ALL_RIGHTS},
        "details": right_details,
        "vector": vector,
    }


# --- Device definitions (from bci-landscape.json extraction) ---

DEVICES = [
    # Neuralink
    {"name": "Neuralink N1", "type": "invasive", "purpose": "medical", "techniques": [
        {"id": "T0001", "niss": 6.4, "cci": 0.96, "severity": "medium", "rights": ["CL","MI"], "physics_tier": 0},
        {"id": "T0003", "niss": 2.7, "cci": 0.72, "severity": "low", "rights": ["MP","MI"], "physics_tier": 0},
        {"id": "T0005", "niss": 6.4, "cci": 1.44, "severity": "medium", "rights": ["CL","MI"], "physics_tier": 3},
        {"id": "T0008", "niss": 6.4, "cci": 0.96, "severity": "medium", "rights": ["CL","MI"], "physics_tier": 2},
        {"id": "T0010", "niss": 7.4, "cci": 1.2, "severity": "high", "rights": ["CL","MI"], "physics_tier": 0},
        {"id": "T0015", "niss": 5.4, "cci": 1.35, "severity": "medium", "rights": ["MI"], "physics_tier": 0},
        {"id": "T0021", "niss": 2.7, "cci": 0.2, "severity": "low", "rights": ["MP"], "physics_tier": "X"},
        {"id": "T0023", "niss": 7.4, "cci": 2.7, "severity": "high", "rights": ["MP","CL","MI","PC"], "physics_tier": 2},
        {"id": "T0025", "niss": 5.4, "cci": 1.44, "severity": "medium", "rights": ["MP","CL","MI","PC"], "physics_tier": 0},
        {"id": "T0030", "niss": 7.1, "cci": 1.5, "severity": "high", "rights": ["CL","MI","PC"], "physics_tier": 1},
        {"id": "T0041", "niss": 2.7, "cci": 0.96, "severity": "low", "rights": ["MP","MI","PC"], "physics_tier": 0},
        {"id": "T0043", "niss": 4.7, "cci": 0.24, "severity": "medium", "rights": ["MP","MI"], "physics_tier": "X"},
        {"id": "T0045", "niss": 2.7, "cci": 0.3, "severity": "low", "rights": ["MP"], "physics_tier": "X"},
        {"id": "T0048", "niss": 6.4, "cci": 1.2, "severity": "medium", "rights": ["MP","CL","MI"], "physics_tier": 0},
        {"id": "T0061", "niss": 0.7, "cci": 0.48, "severity": "low", "rights": ["CL","MI"], "physics_tier": 2},
        {"id": "T0063", "niss": 1.4, "cci": 0.4, "severity": "low", "rights": ["CL","MI"], "physics_tier": 0},
        {"id": "T0065", "niss": 8.1, "cci": 1.8, "severity": "high", "rights": ["MP","CL","MI"], "physics_tier": "X"},
        {"id": "T0081", "niss": 1.4, "cci": 0.12, "severity": "low", "rights": ["MP"], "physics_tier": 0},
        {"id": "T0085", "niss": 3.4, "cci": 2.25, "severity": "low", "rights": ["MP","CL","MI"], "physics_tier": 0},
        {"id": "T0090", "niss": 2.0, "cci": 0.6, "severity": "low", "rights": ["MP","MI"], "physics_tier": 0},
        {"id": "T0095", "niss": 4.4, "cci": 2.25, "severity": "medium", "rights": ["MP","CL","MI"], "physics_tier": 0},
        {"id": "T0100", "niss": 2.6, "cci": 0.32, "severity": "low", "rights": ["MP","MI"], "physics_tier": 0},
    ]},
    {"name": "Neuralink Blindsight", "type": "invasive", "purpose": "medical", "techniques": "SAME_AS:Neuralink N1"},
    # Synchron
    {"name": "Synchron Stentrode", "type": "semi_invasive", "purpose": "medical", "techniques": [
        {"id": "T0001", "niss": 6.4, "cci": 0.96, "severity": "medium", "rights": ["CL","MI"], "physics_tier": 0},
        {"id": "T0005", "niss": 6.4, "cci": 1.44, "severity": "medium", "rights": ["CL","MI"], "physics_tier": 3},
        {"id": "T0008", "niss": 6.4, "cci": 0.96, "severity": "medium", "rights": ["CL","MI"], "physics_tier": 2},
        {"id": "T0021", "niss": 2.7, "cci": 0.2, "severity": "low", "rights": ["MP"], "physics_tier": "X"},
        {"id": "T0023", "niss": 7.4, "cci": 2.7, "severity": "high", "rights": ["MP","CL","MI","PC"], "physics_tier": 2},
        {"id": "T0025", "niss": 5.4, "cci": 1.44, "severity": "medium", "rights": ["MP","CL","MI","PC"], "physics_tier": 0},
        {"id": "T0041", "niss": 2.7, "cci": 0.96, "severity": "low", "rights": ["MP","MI","PC"], "physics_tier": 0},
        {"id": "T0043", "niss": 4.7, "cci": 0.24, "severity": "medium", "rights": ["MP","MI"], "physics_tier": "X"},
        {"id": "T0061", "niss": 0.7, "cci": 0.48, "severity": "low", "rights": ["CL","MI"], "physics_tier": 2},
        {"id": "T0063", "niss": 1.4, "cci": 0.4, "severity": "low", "rights": ["CL","MI"], "physics_tier": 0},
        {"id": "T0081", "niss": 1.4, "cci": 0.12, "severity": "low", "rights": ["MP"], "physics_tier": 0},
        {"id": "T0085", "niss": 3.4, "cci": 2.25, "severity": "low", "rights": ["MP","CL","MI"], "physics_tier": 0},
    ]},
    # Blackrock
    {"name": "Blackrock NeuroPort", "type": "invasive", "purpose": "research", "techniques": [
        {"id": "T0001", "niss": 6.4, "cci": 0.96, "severity": "medium", "rights": ["CL","MI"], "physics_tier": 0},
        {"id": "T0003", "niss": 2.7, "cci": 0.72, "severity": "low", "rights": ["MP","MI"], "physics_tier": 0},
        {"id": "T0005", "niss": 6.4, "cci": 1.44, "severity": "medium", "rights": ["CL","MI"], "physics_tier": 3},
        {"id": "T0008", "niss": 6.4, "cci": 0.96, "severity": "medium", "rights": ["CL","MI"], "physics_tier": 2},
        {"id": "T0010", "niss": 7.4, "cci": 1.2, "severity": "high", "rights": ["CL","MI"], "physics_tier": 0},
        {"id": "T0021", "niss": 2.7, "cci": 0.2, "severity": "low", "rights": ["MP"], "physics_tier": "X"},
        {"id": "T0023", "niss": 7.4, "cci": 2.7, "severity": "high", "rights": ["MP","CL","MI","PC"], "physics_tier": 2},
        {"id": "T0041", "niss": 2.7, "cci": 0.96, "severity": "low", "rights": ["MP","MI","PC"], "physics_tier": 0},
        {"id": "T0043", "niss": 4.7, "cci": 0.24, "severity": "medium", "rights": ["MP","MI"], "physics_tier": "X"},
        {"id": "T0045", "niss": 2.7, "cci": 0.3, "severity": "low", "rights": ["MP"], "physics_tier": "X"},
        {"id": "T0061", "niss": 0.7, "cci": 0.48, "severity": "low", "rights": ["CL","MI"], "physics_tier": 2},
        {"id": "T0063", "niss": 1.4, "cci": 0.4, "severity": "low", "rights": ["CL","MI"], "physics_tier": 0},
        {"id": "T0081", "niss": 1.4, "cci": 0.12, "severity": "low", "rights": ["MP"], "physics_tier": 0},
    ]},
    {"name": "Blackrock MoveAgain", "type": "invasive", "purpose": "medical", "techniques": "SAME_AS:Blackrock NeuroPort"},
    # Precision Neuroscience
    {"name": "Precision Layer 7", "type": "invasive", "purpose": "medical", "techniques": [
        {"id": "T0001", "niss": 6.4, "cci": 0.96, "severity": "medium", "rights": ["CL","MI"], "physics_tier": 0},
        {"id": "T0005", "niss": 6.4, "cci": 1.44, "severity": "medium", "rights": ["CL","MI"], "physics_tier": 3},
        {"id": "T0008", "niss": 6.4, "cci": 0.96, "severity": "medium", "rights": ["CL","MI"], "physics_tier": 2},
        {"id": "T0021", "niss": 2.7, "cci": 0.2, "severity": "low", "rights": ["MP"], "physics_tier": "X"},
        {"id": "T0023", "niss": 7.4, "cci": 2.7, "severity": "high", "rights": ["MP","CL","MI","PC"], "physics_tier": 2},
        {"id": "T0041", "niss": 2.7, "cci": 0.96, "severity": "low", "rights": ["MP","MI","PC"], "physics_tier": 0},
        {"id": "T0043", "niss": 4.7, "cci": 0.24, "severity": "medium", "rights": ["MP","MI"], "physics_tier": "X"},
        {"id": "T0061", "niss": 0.7, "cci": 0.48, "severity": "low", "rights": ["CL","MI"], "physics_tier": 2},
        {"id": "T0081", "niss": 1.4, "cci": 0.12, "severity": "low", "rights": ["MP"], "physics_tier": 0},
    ]},
    # Paradromics
    {"name": "Paradromics Connexus", "type": "invasive", "purpose": "medical", "techniques": [
        {"id": "T0001", "niss": 6.4, "cci": 0.96, "severity": "medium", "rights": ["CL","MI"], "physics_tier": 0},
        {"id": "T0003", "niss": 2.7, "cci": 0.72, "severity": "low", "rights": ["MP","MI"], "physics_tier": 0},
        {"id": "T0005", "niss": 6.4, "cci": 1.44, "severity": "medium", "rights": ["CL","MI"], "physics_tier": 3},
        {"id": "T0008", "niss": 6.4, "cci": 0.96, "severity": "medium", "rights": ["CL","MI"], "physics_tier": 2},
        {"id": "T0021", "niss": 2.7, "cci": 0.2, "severity": "low", "rights": ["MP"], "physics_tier": "X"},
        {"id": "T0023", "niss": 7.4, "cci": 2.7, "severity": "high", "rights": ["MP","CL","MI","PC"], "physics_tier": 2},
        {"id": "T0041", "niss": 2.7, "cci": 0.96, "severity": "low", "rights": ["MP","MI","PC"], "physics_tier": 0},
        {"id": "T0043", "niss": 4.7, "cci": 0.24, "severity": "medium", "rights": ["MP","MI"], "physics_tier": "X"},
        {"id": "T0061", "niss": 0.7, "cci": 0.48, "severity": "low", "rights": ["CL","MI"], "physics_tier": 2},
        {"id": "T0081", "niss": 1.4, "cci": 0.12, "severity": "low", "rights": ["MP"], "physics_tier": 0},
    ]},
    # BrainGate
    {"name": "BrainGate System", "type": "invasive", "purpose": "research", "techniques": [
        {"id": "T0001", "niss": 6.4, "cci": 0.96, "severity": "medium", "rights": ["CL","MI"], "physics_tier": 0},
        {"id": "T0005", "niss": 6.4, "cci": 1.44, "severity": "medium", "rights": ["CL","MI"], "physics_tier": 3},
        {"id": "T0008", "niss": 6.4, "cci": 0.96, "severity": "medium", "rights": ["CL","MI"], "physics_tier": 2},
        {"id": "T0021", "niss": 2.7, "cci": 0.2, "severity": "low", "rights": ["MP"], "physics_tier": "X"},
        {"id": "T0023", "niss": 7.4, "cci": 2.7, "severity": "high", "rights": ["MP","CL","MI","PC"], "physics_tier": 2},
        {"id": "T0041", "niss": 2.7, "cci": 0.96, "severity": "low", "rights": ["MP","MI","PC"], "physics_tier": 0},
        {"id": "T0061", "niss": 0.7, "cci": 0.48, "severity": "low", "rights": ["CL","MI"], "physics_tier": 2},
        {"id": "T0081", "niss": 1.4, "cci": 0.12, "severity": "low", "rights": ["MP"], "physics_tier": 0},
    ]},
    # Emotiv
    {"name": "Emotiv EPOC X", "type": "non_invasive", "purpose": "consumer", "techniques": [
        {"id": "T0005", "niss": 6.4, "cci": 1.44, "severity": "medium", "rights": ["CL","MI"], "physics_tier": 3},
        {"id": "T0008", "niss": 6.4, "cci": 0.96, "severity": "medium", "rights": ["CL","MI"], "physics_tier": 2},
        {"id": "T0010", "niss": 7.4, "cci": 1.2, "severity": "high", "rights": ["CL","MI"], "physics_tier": 0},
        {"id": "T0021", "niss": 2.7, "cci": 0.2, "severity": "low", "rights": ["MP"], "physics_tier": "X"},
        {"id": "T0023", "niss": 7.4, "cci": 2.7, "severity": "high", "rights": ["MP","CL","MI","PC"], "physics_tier": 2},
        {"id": "T0025", "niss": 5.4, "cci": 1.44, "severity": "medium", "rights": ["MP","CL","MI","PC"], "physics_tier": 0},
        {"id": "T0027", "niss": 3.4, "cci": 0.6, "severity": "low", "rights": ["MP","MI","PC"], "physics_tier": 1},
        {"id": "T0030", "niss": 7.1, "cci": 1.5, "severity": "high", "rights": ["CL","MI","PC"], "physics_tier": 1},
        {"id": "T0041", "niss": 2.7, "cci": 0.96, "severity": "low", "rights": ["MP","MI","PC"], "physics_tier": 0},
        {"id": "T0043", "niss": 4.7, "cci": 0.24, "severity": "medium", "rights": ["MP","MI"], "physics_tier": "X"},
        {"id": "T0081", "niss": 1.4, "cci": 0.12, "severity": "low", "rights": ["MP"], "physics_tier": 0},
        {"id": "T0085", "niss": 3.4, "cci": 2.25, "severity": "low", "rights": ["MP","CL","MI"], "physics_tier": 0},
        {"id": "T0095", "niss": 4.4, "cci": 2.25, "severity": "medium", "rights": ["MP","CL","MI"], "physics_tier": 0},
    ]},
    # NeuroSky
    {"name": "NeuroSky MindWave", "type": "non_invasive", "purpose": "consumer", "techniques": [
        {"id": "T0005", "niss": 6.4, "cci": 1.44, "severity": "medium", "rights": ["CL","MI"], "physics_tier": 3},
        {"id": "T0008", "niss": 6.4, "cci": 0.96, "severity": "medium", "rights": ["CL","MI"], "physics_tier": 2},
        {"id": "T0021", "niss": 2.7, "cci": 0.2, "severity": "low", "rights": ["MP"], "physics_tier": "X"},
        {"id": "T0023", "niss": 7.4, "cci": 2.7, "severity": "high", "rights": ["MP","CL","MI","PC"], "physics_tier": 2},
        {"id": "T0041", "niss": 2.7, "cci": 0.96, "severity": "low", "rights": ["MP","MI","PC"], "physics_tier": 0},
        {"id": "T0081", "niss": 1.4, "cci": 0.12, "severity": "low", "rights": ["MP"], "physics_tier": 0},
        {"id": "T0085", "niss": 3.4, "cci": 2.25, "severity": "low", "rights": ["MP","CL","MI"], "physics_tier": 0},
    ]},
    # InteraXon
    {"name": "Muse 2", "type": "non_invasive", "purpose": "consumer", "techniques": [
        {"id": "T0005", "niss": 6.4, "cci": 1.44, "severity": "medium", "rights": ["CL","MI"], "physics_tier": 3},
        {"id": "T0008", "niss": 6.4, "cci": 0.96, "severity": "medium", "rights": ["CL","MI"], "physics_tier": 2},
        {"id": "T0021", "niss": 2.7, "cci": 0.2, "severity": "low", "rights": ["MP"], "physics_tier": "X"},
        {"id": "T0023", "niss": 7.4, "cci": 2.7, "severity": "high", "rights": ["MP","CL","MI","PC"], "physics_tier": 2},
        {"id": "T0025", "niss": 5.4, "cci": 1.44, "severity": "medium", "rights": ["MP","CL","MI","PC"], "physics_tier": 0},
        {"id": "T0041", "niss": 2.7, "cci": 0.96, "severity": "low", "rights": ["MP","MI","PC"], "physics_tier": 0},
        {"id": "T0043", "niss": 4.7, "cci": 0.24, "severity": "medium", "rights": ["MP","MI"], "physics_tier": "X"},
        {"id": "T0081", "niss": 1.4, "cci": 0.12, "severity": "low", "rights": ["MP"], "physics_tier": 0},
        {"id": "T0085", "niss": 3.4, "cci": 2.25, "severity": "low", "rights": ["MP","CL","MI"], "physics_tier": 0},
    ]},
    # OpenBCI
    {"name": "OpenBCI Cyton", "type": "non_invasive", "purpose": "research", "techniques": [
        {"id": "T0005", "niss": 6.4, "cci": 1.44, "severity": "medium", "rights": ["CL","MI"], "physics_tier": 3},
        {"id": "T0008", "niss": 6.4, "cci": 0.96, "severity": "medium", "rights": ["CL","MI"], "physics_tier": 2},
        {"id": "T0021", "niss": 2.7, "cci": 0.2, "severity": "low", "rights": ["MP"], "physics_tier": "X"},
        {"id": "T0023", "niss": 7.4, "cci": 2.7, "severity": "high", "rights": ["MP","CL","MI","PC"], "physics_tier": 2},
        {"id": "T0041", "niss": 2.7, "cci": 0.96, "severity": "low", "rights": ["MP","MI","PC"], "physics_tier": 0},
        {"id": "T0043", "niss": 4.7, "cci": 0.24, "severity": "medium", "rights": ["MP","MI"], "physics_tier": "X"},
        {"id": "T0048", "niss": 6.4, "cci": 1.2, "severity": "medium", "rights": ["MP","CL","MI"], "physics_tier": 0},
        {"id": "T0081", "niss": 1.4, "cci": 0.12, "severity": "low", "rights": ["MP"], "physics_tier": 0},
        {"id": "T0085", "niss": 3.4, "cci": 2.25, "severity": "low", "rights": ["MP","CL","MI"], "physics_tier": 0},
    ]},
    # Kernel
    {"name": "Kernel Flow", "type": "non_invasive", "purpose": "research", "techniques": [
        {"id": "T0005", "niss": 6.4, "cci": 1.44, "severity": "medium", "rights": ["CL","MI"], "physics_tier": 3},
        {"id": "T0008", "niss": 6.4, "cci": 0.96, "severity": "medium", "rights": ["CL","MI"], "physics_tier": 2},
        {"id": "T0021", "niss": 2.7, "cci": 0.2, "severity": "low", "rights": ["MP"], "physics_tier": "X"},
        {"id": "T0023", "niss": 7.4, "cci": 2.7, "severity": "high", "rights": ["MP","CL","MI","PC"], "physics_tier": 2},
        {"id": "T0041", "niss": 2.7, "cci": 0.96, "severity": "low", "rights": ["MP","MI","PC"], "physics_tier": 0},
        {"id": "T0043", "niss": 4.7, "cci": 0.24, "severity": "medium", "rights": ["MP","MI"], "physics_tier": "X"},
        {"id": "T0081", "niss": 1.4, "cci": 0.12, "severity": "low", "rights": ["MP"], "physics_tier": 0},
    ]},
    # CTRL-Labs/Meta
    {"name": "Meta Neural Interface", "type": "non_invasive", "purpose": "consumer", "techniques": [
        {"id": "T0005", "niss": 6.4, "cci": 1.44, "severity": "medium", "rights": ["CL","MI"], "physics_tier": 3},
        {"id": "T0008", "niss": 6.4, "cci": 0.96, "severity": "medium", "rights": ["CL","MI"], "physics_tier": 2},
        {"id": "T0021", "niss": 2.7, "cci": 0.2, "severity": "low", "rights": ["MP"], "physics_tier": "X"},
        {"id": "T0023", "niss": 7.4, "cci": 2.7, "severity": "high", "rights": ["MP","CL","MI","PC"], "physics_tier": 2},
        {"id": "T0041", "niss": 2.7, "cci": 0.96, "severity": "low", "rights": ["MP","MI","PC"], "physics_tier": 0},
        {"id": "T0081", "niss": 1.4, "cci": 0.12, "severity": "low", "rights": ["MP"], "physics_tier": 0},
        {"id": "T0085", "niss": 3.4, "cci": 2.25, "severity": "low", "rights": ["MP","CL","MI"], "physics_tier": 0},
    ]},
    # Neurosity
    {"name": "Neurosity Crown", "type": "non_invasive", "purpose": "consumer", "techniques": [
        {"id": "T0005", "niss": 6.4, "cci": 1.44, "severity": "medium", "rights": ["CL","MI"], "physics_tier": 3},
        {"id": "T0008", "niss": 6.4, "cci": 0.96, "severity": "medium", "rights": ["CL","MI"], "physics_tier": 2},
        {"id": "T0010", "niss": 7.4, "cci": 1.2, "severity": "high", "rights": ["CL","MI"], "physics_tier": 0},
        {"id": "T0021", "niss": 2.7, "cci": 0.2, "severity": "low", "rights": ["MP"], "physics_tier": "X"},
        {"id": "T0023", "niss": 7.4, "cci": 2.7, "severity": "high", "rights": ["MP","CL","MI","PC"], "physics_tier": 2},
        {"id": "T0025", "niss": 5.4, "cci": 1.44, "severity": "medium", "rights": ["MP","CL","MI","PC"], "physics_tier": 0},
        {"id": "T0041", "niss": 2.7, "cci": 0.96, "severity": "low", "rights": ["MP","MI","PC"], "physics_tier": 0},
        {"id": "T0043", "niss": 4.7, "cci": 0.24, "severity": "medium", "rights": ["MP","MI"], "physics_tier": "X"},
        {"id": "T0081", "niss": 1.4, "cci": 0.12, "severity": "low", "rights": ["MP"], "physics_tier": 0},
        {"id": "T0085", "niss": 3.4, "cci": 2.25, "severity": "low", "rights": ["MP","CL","MI"], "physics_tier": 0},
    ]},
    # BrainCo
    {"name": "BrainCo Focus 1", "type": "non_invasive", "purpose": "enterprise", "techniques": [
        {"id": "T0005", "niss": 6.4, "cci": 1.44, "severity": "medium", "rights": ["CL","MI"], "physics_tier": 3},
        {"id": "T0008", "niss": 6.4, "cci": 0.96, "severity": "medium", "rights": ["CL","MI"], "physics_tier": 2},
        {"id": "T0010", "niss": 7.4, "cci": 1.2, "severity": "high", "rights": ["CL","MI"], "physics_tier": 0},
        {"id": "T0021", "niss": 2.7, "cci": 0.2, "severity": "low", "rights": ["MP"], "physics_tier": "X"},
        {"id": "T0023", "niss": 7.4, "cci": 2.7, "severity": "high", "rights": ["MP","CL","MI","PC"], "physics_tier": 2},
        {"id": "T0025", "niss": 5.4, "cci": 1.44, "severity": "medium", "rights": ["MP","CL","MI","PC"], "physics_tier": 0},
        {"id": "T0030", "niss": 7.1, "cci": 1.5, "severity": "high", "rights": ["CL","MI","PC"], "physics_tier": 1},
        {"id": "T0041", "niss": 2.7, "cci": 0.96, "severity": "low", "rights": ["MP","MI","PC"], "physics_tier": 0},
        {"id": "T0043", "niss": 4.7, "cci": 0.24, "severity": "medium", "rights": ["MP","MI"], "physics_tier": "X"},
        {"id": "T0081", "niss": 1.4, "cci": 0.12, "severity": "low", "rights": ["MP"], "physics_tier": 0},
        {"id": "T0085", "niss": 3.4, "cci": 2.25, "severity": "low", "rights": ["MP","CL","MI"], "physics_tier": 0},
        {"id": "T0095", "niss": 4.4, "cci": 2.25, "severity": "medium", "rights": ["MP","CL","MI"], "physics_tier": 0},
    ]},
    # Natus/Integra
    {"name": "Natus Xltek", "type": "non_invasive", "purpose": "medical", "techniques": [
        {"id": "T0005", "niss": 6.4, "cci": 1.44, "severity": "medium", "rights": ["CL","MI"], "physics_tier": 3},
        {"id": "T0008", "niss": 6.4, "cci": 0.96, "severity": "medium", "rights": ["CL","MI"], "physics_tier": 2},
        {"id": "T0010", "niss": 7.4, "cci": 1.2, "severity": "high", "rights": ["CL","MI"], "physics_tier": 0},
        {"id": "T0021", "niss": 2.7, "cci": 0.2, "severity": "low", "rights": ["MP"], "physics_tier": "X"},
        {"id": "T0023", "niss": 7.4, "cci": 2.7, "severity": "high", "rights": ["MP","CL","MI","PC"], "physics_tier": 2},
        {"id": "T0025", "niss": 5.4, "cci": 1.44, "severity": "medium", "rights": ["MP","CL","MI","PC"], "physics_tier": 0},
        {"id": "T0030", "niss": 7.1, "cci": 1.5, "severity": "high", "rights": ["CL","MI","PC"], "physics_tier": 1},
        {"id": "T0041", "niss": 2.7, "cci": 0.96, "severity": "low", "rights": ["MP","MI","PC"], "physics_tier": 0},
        {"id": "T0043", "niss": 4.7, "cci": 0.24, "severity": "medium", "rights": ["MP","MI"], "physics_tier": "X"},
        {"id": "T0045", "niss": 2.7, "cci": 0.3, "severity": "low", "rights": ["MP"], "physics_tier": "X"},
        {"id": "T0061", "niss": 0.7, "cci": 0.48, "severity": "low", "rights": ["CL","MI"], "physics_tier": 2},
        {"id": "T0063", "niss": 1.4, "cci": 0.4, "severity": "low", "rights": ["CL","MI"], "physics_tier": 0},
        {"id": "T0081", "niss": 1.4, "cci": 0.12, "severity": "low", "rights": ["MP"], "physics_tier": 0},
        {"id": "T0085", "niss": 3.4, "cci": 2.25, "severity": "low", "rights": ["MP","CL","MI"], "physics_tier": 0},
    ]},
    # g.tec
    {"name": "g.tec g.Nautilus", "type": "non_invasive", "purpose": "research", "techniques": [
        {"id": "T0005", "niss": 6.4, "cci": 1.44, "severity": "medium", "rights": ["CL","MI"], "physics_tier": 3},
        {"id": "T0008", "niss": 6.4, "cci": 0.96, "severity": "medium", "rights": ["CL","MI"], "physics_tier": 2},
        {"id": "T0021", "niss": 2.7, "cci": 0.2, "severity": "low", "rights": ["MP"], "physics_tier": "X"},
        {"id": "T0023", "niss": 7.4, "cci": 2.7, "severity": "high", "rights": ["MP","CL","MI","PC"], "physics_tier": 2},
        {"id": "T0025", "niss": 5.4, "cci": 1.44, "severity": "medium", "rights": ["MP","CL","MI","PC"], "physics_tier": 0},
        {"id": "T0041", "niss": 2.7, "cci": 0.96, "severity": "low", "rights": ["MP","MI","PC"], "physics_tier": 0},
        {"id": "T0043", "niss": 4.7, "cci": 0.24, "severity": "medium", "rights": ["MP","MI"], "physics_tier": "X"},
        {"id": "T0045", "niss": 2.7, "cci": 0.3, "severity": "low", "rights": ["MP"], "physics_tier": "X"},
        {"id": "T0061", "niss": 0.7, "cci": 0.48, "severity": "low", "rights": ["CL","MI"], "physics_tier": 2},
        {"id": "T0081", "niss": 1.4, "cci": 0.12, "severity": "low", "rights": ["MP"], "physics_tier": 0},
    ]},
    # INBRAIN
    {"name": "INBRAIN Graphene Probe", "type": "invasive", "purpose": "medical", "techniques": [
        {"id": "T0001", "niss": 6.4, "cci": 0.96, "severity": "medium", "rights": ["CL","MI"], "physics_tier": 0},
        {"id": "T0003", "niss": 2.7, "cci": 0.72, "severity": "low", "rights": ["MP","MI"], "physics_tier": 0},
        {"id": "T0005", "niss": 6.4, "cci": 1.44, "severity": "medium", "rights": ["CL","MI"], "physics_tier": 3},
        {"id": "T0008", "niss": 6.4, "cci": 0.96, "severity": "medium", "rights": ["CL","MI"], "physics_tier": 2},
        {"id": "T0010", "niss": 7.4, "cci": 1.2, "severity": "high", "rights": ["CL","MI"], "physics_tier": 0},
        {"id": "T0015", "niss": 5.4, "cci": 1.35, "severity": "medium", "rights": ["MI"], "physics_tier": 0},
        {"id": "T0021", "niss": 2.7, "cci": 0.2, "severity": "low", "rights": ["MP"], "physics_tier": "X"},
        {"id": "T0023", "niss": 7.4, "cci": 2.7, "severity": "high", "rights": ["MP","CL","MI","PC"], "physics_tier": 2},
        {"id": "T0025", "niss": 5.4, "cci": 1.44, "severity": "medium", "rights": ["MP","CL","MI","PC"], "physics_tier": 0},
    ]},
    # Cortera
    {"name": "Cortera Surface Array", "type": "invasive", "purpose": "research", "techniques": [
        {"id": "T0001", "niss": 6.4, "cci": 0.96, "severity": "medium", "rights": ["CL","MI"], "physics_tier": 0},
        {"id": "T0005", "niss": 6.4, "cci": 1.44, "severity": "medium", "rights": ["CL","MI"], "physics_tier": 3},
        {"id": "T0008", "niss": 6.4, "cci": 0.96, "severity": "medium", "rights": ["CL","MI"], "physics_tier": 2},
        {"id": "T0021", "niss": 2.7, "cci": 0.2, "severity": "low", "rights": ["MP"], "physics_tier": "X"},
        {"id": "T0041", "niss": 2.7, "cci": 0.96, "severity": "low", "rights": ["MP","MI","PC"], "physics_tier": 0},
        {"id": "T0061", "niss": 0.7, "cci": 0.48, "severity": "low", "rights": ["CL","MI"], "physics_tier": 2},
        {"id": "T0081", "niss": 1.4, "cci": 0.12, "severity": "low", "rights": ["MP"], "physics_tier": 0},
    ]},
    # Nihon Kohden
    {"name": "Nihon Kohden Neurofax", "type": "non_invasive", "purpose": "medical", "techniques": [
        {"id": "T0005", "niss": 6.4, "cci": 1.44, "severity": "medium", "rights": ["CL","MI"], "physics_tier": 3},
        {"id": "T0008", "niss": 6.4, "cci": 0.96, "severity": "medium", "rights": ["CL","MI"], "physics_tier": 2},
        {"id": "T0021", "niss": 2.7, "cci": 0.2, "severity": "low", "rights": ["MP"], "physics_tier": "X"},
        {"id": "T0023", "niss": 7.4, "cci": 2.7, "severity": "high", "rights": ["MP","CL","MI","PC"], "physics_tier": 2},
        {"id": "T0025", "niss": 5.4, "cci": 1.44, "severity": "medium", "rights": ["MP","CL","MI","PC"], "physics_tier": 0},
        {"id": "T0041", "niss": 2.7, "cci": 0.96, "severity": "low", "rights": ["MP","MI","PC"], "physics_tier": 0},
        {"id": "T0043", "niss": 4.7, "cci": 0.24, "severity": "medium", "rights": ["MP","MI"], "physics_tier": "X"},
        {"id": "T0045", "niss": 2.7, "cci": 0.3, "severity": "low", "rights": ["MP"], "physics_tier": "X"},
        {"id": "T0061", "niss": 0.7, "cci": 0.48, "severity": "low", "rights": ["CL","MI"], "physics_tier": 2},
        {"id": "T0063", "niss": 1.4, "cci": 0.4, "severity": "low", "rights": ["CL","MI"], "physics_tier": 0},
        {"id": "T0081", "niss": 1.4, "cci": 0.12, "severity": "low", "rights": ["MP"], "physics_tier": 0},
    ]},
    # Cognixion
    {"name": "Cognixion ONE", "type": "non_invasive", "purpose": "medical", "techniques": [
        {"id": "T0005", "niss": 6.4, "cci": 1.44, "severity": "medium", "rights": ["CL","MI"], "physics_tier": 3},
        {"id": "T0008", "niss": 6.4, "cci": 0.96, "severity": "medium", "rights": ["CL","MI"], "physics_tier": 2},
        {"id": "T0021", "niss": 2.7, "cci": 0.2, "severity": "low", "rights": ["MP"], "physics_tier": "X"},
        {"id": "T0023", "niss": 7.4, "cci": 2.7, "severity": "high", "rights": ["MP","CL","MI","PC"], "physics_tier": 2},
        {"id": "T0041", "niss": 2.7, "cci": 0.96, "severity": "low", "rights": ["MP","MI","PC"], "physics_tier": 0},
        {"id": "T0043", "niss": 4.7, "cci": 0.24, "severity": "medium", "rights": ["MP","MI"], "physics_tier": "X"},
        {"id": "T0081", "niss": 1.4, "cci": 0.12, "severity": "low", "rights": ["MP"], "physics_tier": 0},
    ]},
]


def resolve_references(devices):
    """Resolve SAME_AS references."""
    name_map = {d["name"]: d for d in devices if isinstance(d.get("techniques"), list)}
    for d in devices:
        if isinstance(d.get("techniques"), str) and d["techniques"].startswith("SAME_AS:"):
            ref = d["techniques"].replace("SAME_AS:", "")
            if ref in name_map:
                d["techniques"] = name_map[ref]["techniques"]
    return devices


def main():
    devices = resolve_references(DEVICES)

    results = []
    for d in devices:
        if not isinstance(d.get("techniques"), list):
            print(f"SKIP: {d['name']} (unresolved reference)", file=sys.stderr)
            continue
        result = compute_device_score(
            d["name"], d["techniques"], d["type"], d["purpose"]
        )
        results.append(result)

    # Sort by overall score descending
    results.sort(key=lambda x: x["overall_score"], reverse=True)

    # Print results table
    print("=" * 100)
    print("NEUROSECURITY SCORE v2.1 — ALL DEVICES")
    print("=" * 100)
    print(f"{'Device':<30} {'Type':<15} {'#Tech':>5} {'NS':>6} {'Sev':<8} {'MI':>6} {'CL':>6} {'MP':>6} {'PC':>6} {'EA':>6}")
    print("-" * 100)

    for r in results:
        s = r["subscores"]
        print(f"{r['device']:<30} {r['type']:<15} {r['n_techniques']:>5} "
              f"{r['overall_score']:>6.2f} {r['severity']:<8} "
              f"{s['MI']:>6.2f} {s['CL']:>6.2f} {s['MP']:>6.2f} {s['PC']:>6.2f} {s['EA']:>6.2f}")

    print("-" * 100)

    # Statistics
    scores = [r["overall_score"] for r in results]
    print(f"\nN={len(results)} devices")
    print(f"Score range: {min(scores):.2f} - {max(scores):.2f}")
    print(f"Mean: {sum(scores)/len(scores):.2f}")
    print(f"Median: {sorted(scores)[len(scores)//2]:.2f}")

    # Severity distribution
    sev_counts = {}
    for r in results:
        sev_counts[r["severity"]] = sev_counts.get(r["severity"], 0) + 1
    print(f"Severity distribution: {sev_counts}")

    # Discriminant validity check
    invasive = [r["overall_score"] for r in results if r["type"] in ("invasive", "semi_invasive")]
    non_inv = [r["overall_score"] for r in results if r["type"] == "non_invasive"]
    if invasive and non_inv:
        print(f"\nDiscriminant validity:")
        print(f"  Invasive mean: {sum(invasive)/len(invasive):.2f} (n={len(invasive)})")
        print(f"  Non-invasive mean: {sum(non_inv)/len(non_inv):.2f} (n={len(non_inv)})")
        print(f"  Invasive > Non-invasive: {sum(invasive)/len(invasive) > sum(non_inv)/len(non_inv)}")

    # Print vector strings
    print("\n" + "=" * 100)
    print("VECTOR STRINGS")
    print("=" * 100)
    for r in results:
        print(r["vector"])

    # JSON output
    output_path = Path(__file__).parent.parent / "shared" / "neurosecurity-scores.json"
    with open(output_path, "w") as f:
        json.dump({"version": "NSv2.1", "devices": results}, f, indent=2)
    print(f"\nJSON saved to: {output_path}")


if __name__ == "__main__":
    main()
