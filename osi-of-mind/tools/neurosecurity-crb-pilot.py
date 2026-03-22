#!/usr/bin/env python3
"""
NSv2.1b CRB Pilot Scoring — Contextual Risk Baseline
=====================================================

Demonstrates vulnerability adjustment across 3 populations × 5 devices.

CRB Formula (from Entry 4, refined in Entry 7):
  NS_adj = min(NS × (1 + γ × CRB), 10.0)   where γ = 0.30

CRB Factors (from NSv2.1b spec):
  V_age     — Age-based vulnerability (0.0 = adult, 1.0 = infant/elderly)
  V_dx      — Clinical diagnosis vulnerability (0.0 = neurotypical, 1.0 = severe)
  V_consent — Consent capacity (0.0 = full capacity, 1.0 = cannot consent)
  V_depend  — Device dependency (0.0 = optional, 1.0 = life-sustaining)

  CRB = mean(V_age, V_dx, V_consent, V_depend)

Evidence basis for each factor:
  V_age: UN CRC Article 3 (best interests of the child), FDA pediatric
         device requirements (21 CFR 814.20), Giedd (1999) brain
         development trajectory showing incomplete PFC myelination until ~25
  V_dx:  DSM-5-TR severity coding (ADHD 314.01 combined presentation,
         ALS G12.21), CGI-S (Guy 1976) severity instrument
  V_consent: Gillick competency (UK), capacity assessment (MCA 2005),
             Beauchamp & Childress (2019) autonomy principle
  V_depend: FDA device classification by life-sustaining function,
            MHRA Essential Performance (IEC 60601-1:2005)
"""

import sys
import json
from pathlib import Path

# Import the base scoring engine
sys.path.insert(0, str(Path(__file__).parent))
from importlib import import_module

# Re-implement core functions to avoid import issues with neurosecurity-score.py
# (filename has hyphens, can't import directly)
import math

EPSILON = 1e-9

def niss_norm(niss: float) -> float:
    return min(max(niss / 10.0, 0.0), 1.0)

def cci_norm(cci: float) -> float:
    return min(max(cci / 3.0, 0.0), 1.0)

DSM_MAP = {"none": 0.0, "low": 0.2, "medium": 0.5, "high": 0.8, "critical": 1.0}
def dsm_norm(sev: str) -> float:
    return DSM_MAP.get(sev, 0.0)

def bns(nn: float, cn: float, dn: float,
        w_niss: float = 0.40, w_cci: float = 0.20, w_dsm: float = 0.40) -> float:
    return (max(nn, EPSILON) ** w_niss) * (max(cn, EPSILON) ** w_cci) * (max(dn, EPSILON) ** w_dsm)

PHYSICS_MAP = {0: 1.0, 1: 0.75, 2: 0.50, 3: 0.25, "X": 0.10}
def feasibility(tier) -> float:
    return PHYSICS_MAP.get(tier, 0.10)

def owa_aggregate(risks: list, lam: float = 0.5) -> float:
    if not risks:
        return 0.0
    n = len(risks)
    sorted_r = sorted(risks, reverse=True)
    weights = []
    for i in range(n):
        w = lam * (1 - lam) ** i
        weights.append(w)
    w_sum = sum(weights)
    if w_sum < EPSILON:
        return sum(sorted_r) / n
    weights = [w / w_sum for w in weights]
    return sum(w * r for w, r in zip(weights, sorted_r))

def geometric_mean(values: list) -> float:
    if not values:
        return 0.0
    product = 1.0
    for v in values:
        product *= max(v, EPSILON)
    return product ** (1.0 / len(values))

RIGHTS = ["CL", "MI", "MP", "PC"]
ALL_RIGHTS = ["CL", "MI", "MP", "PC", "EA"]

EA_PROFILES = {
    "invasive_medical": {"afford": 0.85, "geo": 0.80, "legal": 0.70, "demo": 0.60},
    "invasive_research": {"afford": 0.70, "geo": 0.75, "legal": 0.80, "demo": 0.65},
    "semi_invasive_medical": {"afford": 0.75, "geo": 0.70, "legal": 0.65, "demo": 0.55},
    "non_invasive_consumer": {"afford": 0.20, "geo": 0.15, "legal": 0.10, "demo": 0.25},
    "non_invasive_research": {"afford": 0.40, "geo": 0.35, "legal": 0.30, "demo": 0.35},
    "non_invasive_medical": {"afford": 0.50, "geo": 0.45, "legal": 0.40, "demo": 0.40},
    "non_invasive_enterprise": {"afford": 0.35, "geo": 0.25, "legal": 0.20, "demo": 0.30},
}

def ea_score(device_type: str, purpose: str) -> float:
    key = f"{device_type}_{purpose}"
    profile = EA_PROFILES.get(key, {"afford": 0.30, "geo": 0.25, "legal": 0.20, "demo": 0.25})
    return sum(profile.values()) / len(profile)

def severity_label(score: float) -> str:
    if score < 0.1: return "None"
    if score < 3.0: return "Low"
    if score < 5.0: return "Medium"
    if score < 7.0: return "High"
    return "Critical"


def compute_device_score(device_name, techniques, device_type, purpose, lam=0.5):
    technique_risks = []
    for t in techniques:
        nn = niss_norm(t["niss"])
        cn = cci_norm(t["cci"])
        dn = dsm_norm(t["severity"])
        base = bns(nn, cn, dn)
        phi = feasibility(t["physics_tier"])
        risk = base * phi
        technique_risks.append({
            "id": t["id"], "bns": base, "feasibility": phi,
            "risk": risk, "rights": t.get("rights", []),
        })

    right_scores = {}
    for r in RIGHTS:
        r_risks = [tr["risk"] for tr in technique_risks if r in tr["rights"]]
        rs = owa_aggregate(r_risks, lam)
        right_scores[r] = rs * 10

    ea = ea_score(device_type, purpose)
    right_scores["EA"] = ea * 10

    all_scores = [right_scores[r] for r in ALL_RIGHTS]
    ns = geometric_mean(all_scores)

    vector_parts = [f"NSv2.1:{ns:.2f}"]
    for r in ALL_RIGHTS:
        vector_parts.append(f"{r}:{right_scores[r]:.2f}")
    vector = "/".join(vector_parts)

    return {
        "device": device_name, "type": device_type, "purpose": purpose,
        "n_techniques": len(techniques),
        "overall_score": round(ns, 2),
        "severity": severity_label(ns),
        "subscores": {r: round(right_scores[r], 2) for r in ALL_RIGHTS},
        "vector": vector,
    }


# ═══════════════════════════════════════════════════════════
# CRB VULNERABILITY PROFILES
# ═══════════════════════════════════════════════════════════

# Each profile defines V_age, V_dx, V_consent, V_depend
# All values on [0.0, 1.0] scale with evidence basis documented

CRB_POPULATIONS = {
    "neurotypical_adult": {
        "label": "Neurotypical Adult (25-64)",
        "description": "Healthy adult with full cognitive capacity, no clinical diagnoses",
        "V_age": 0.0,       # Adult, fully developed PFC (Giedd 1999)
        "V_dx": 0.0,        # No clinical diagnosis (CGI-S = 1, "Normal")
        "V_consent": 0.0,   # Full informed consent capacity (MCA 2005 presumption)
        "V_depend": 0.0,    # No device dependency (device is optional/enhancement)
        "evidence": {
            "V_age": "Adult 25-64, completed PFC myelination (Giedd et al. 1999, PNAS)",
            "V_dx": "CGI-S = 1 (Normal, not at all ill; Guy 1976)",
            "V_consent": "Full capacity presumed (MCA 2005 s.1(2))",
            "V_depend": "Device is optional — can discontinue without clinical consequence",
        },
    },
    "child_adhd_10": {
        "label": "Child (10yr) with ADHD",
        "description": "10-year-old with ADHD combined presentation (DSM-5 314.01/F90.2)",
        "V_age": 0.75,      # Minor, PFC 40% of adult development at 10 (Giedd 1999)
        "V_dx": 0.50,       # Moderate: ADHD combined (CGI-S = 4, "Moderately ill")
                             # Not severe/life-threatening but impairs executive function
        "V_consent": 0.80,  # Cannot provide informed consent (age), assent only
                             # Gillick competency rarely met at 10 for medical devices
        "V_depend": 0.30,   # Low-moderate: educational device not life-sustaining
                             # but may become psychologically relied upon (BrainCo use case)
        "evidence": {
            "V_age": "Age 10: PFC ~40% adult volume (Giedd et al. 1999); UN CRC Article 3 (best interests); FDA 21 CFR 814.20 (pediatric devices)",
            "V_dx": "ADHD combined F90.2: CGI-S typically 3-5; executive function impairment reduces capacity to evaluate risks (Barkley 1997, J Abnormal Child Psych)",
            "V_consent": "Below Gillick threshold at 10; parental consent required; child provides assent only (AAP Policy 1995); ADHD further reduces understanding of long-term consequences",
            "V_depend": "Educational neurofeedback: no physical dependency but psychological reliance documented in attention-training paradigms (Lofthouse et al. 2012, Pediatrics)",
        },
    },
    "adult_als": {
        "label": "Adult with ALS",
        "description": "Adult with amyotrophic lateral sclerosis (ICD-10 G12.21), using BCI for communication",
        "V_age": 0.0,       # Adult, typical onset 55-75
        "V_dx": 0.85,       # Severe: progressive motor neuron disease, CGI-S = 6 ("Severely ill")
                             # Cognitive function initially preserved but bulbar involvement
                             # progressively limits expression
        "V_consent": 0.40,  # Can consent initially, but progressive locked-in state
                             # erodes ability to withdraw consent. Communication-dependent
                             # on the very device being assessed (consent paradox)
        "V_depend": 0.90,   # Near-total: BCI may be ONLY communication channel
                             # FDA classifies as life-sustaining for communication in late-stage
                             # Removal = complete communication loss
        "evidence": {
            "V_age": "Adult onset (median 55-75); no age-based vulnerability adjustment",
            "V_dx": "ALS G12.21: CGI-S 5-7 depending on stage; progressive motor neuron degeneration; cognitive function preserved early (Strong et al. 2009, Amyotroph Lateral Scler) but 10-15% develop FTD (Lomen-Hoerth 2011)",
            "V_consent": "Consent paradox: patient depends on BCI for communication, making withdrawal of consent dependent on the device itself (Nijboer et al. 2011, J Neural Eng; Wolpaw & Wolpaw 2012)",
            "V_depend": "Late-stage ALS: BCI is sole communication channel (Sellers et al. 2010, Clin Neurophysiol); FDA Class II/III for communication aids; removal = locked-in silence",
        },
    },
}

def compute_crb(population: dict) -> float:
    """Compute CRB composite from 4 vulnerability factors."""
    factors = [population["V_age"], population["V_dx"],
               population["V_consent"], population["V_depend"]]
    return sum(factors) / len(factors)

def crb_adjust(ns: float, crb: float, gamma: float = 0.30) -> float:
    """Apply CRB multiplicative adjustment."""
    return min(ns * (1 + gamma * crb), 10.0)


# ═══════════════════════════════════════════════════════════
# PILOT DEVICES (5 representative devices spanning the range)
# ═══════════════════════════════════════════════════════════

PILOT_DEVICES = [
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
]


def main():
    print("=" * 120)
    print("NSv2.1b CRB PILOT — CONTEXTUAL RISK BASELINE VULNERABILITY ADJUSTMENT")
    print("=" * 120)

    # Phase 1: Show population profiles
    print("\n─── POPULATION PROFILES ───\n")
    for pop_id, pop in CRB_POPULATIONS.items():
        crb = compute_crb(pop)
        print(f"  {pop['label']}")
        print(f"    V_age={pop['V_age']:.2f}  V_dx={pop['V_dx']:.2f}  "
              f"V_consent={pop['V_consent']:.2f}  V_depend={pop['V_depend']:.2f}")
        print(f"    CRB = {crb:.4f}  (γ=0.30 → multiplier = {1 + 0.30 * crb:.4f})")
        print()

    # Phase 2: Compute base scores + CRB-adjusted scores
    print("\n─── BASE SCORES (No CRB) ───\n")
    print(f"{'Device':<25} {'NS':>6} {'Sev':<8} {'MI':>6} {'CL':>6} {'MP':>6} {'PC':>6} {'EA':>6}")
    print("-" * 80)

    base_results = {}
    for d in PILOT_DEVICES:
        result = compute_device_score(d["name"], d["techniques"], d["type"], d["purpose"])
        base_results[d["name"]] = result
        s = result["subscores"]
        print(f"{d['name']:<25} {result['overall_score']:>6.2f} {result['severity']:<8} "
              f"{s['MI']:>6.2f} {s['CL']:>6.2f} {s['MP']:>6.2f} {s['PC']:>6.2f} {s['EA']:>6.2f}")

    # Phase 3: CRB adjustment matrix
    print("\n\n─── CRB ADJUSTMENT MATRIX (5 devices × 3 populations) ───\n")
    print(f"{'Device':<25} {'Base':>6} {'Sev':<8} │ {'Adult':>6} {'Sev':<8} │ "
          f"{'Child+ADHD':>10} {'Sev':<8} │ {'ALS':>6} {'Sev':<8}")
    print("─" * 110)

    all_crb_results = []

    for d in PILOT_DEVICES:
        base = base_results[d["name"]]
        row = {"device": d["name"], "base": base["overall_score"], "base_severity": base["severity"],
               "populations": {}}

        pop_strs = []
        for pop_id, pop in CRB_POPULATIONS.items():
            crb = compute_crb(pop)
            adjusted = crb_adjust(base["overall_score"], crb)
            sev = severity_label(adjusted)
            row["populations"][pop_id] = {
                "crb": round(crb, 4),
                "adjusted_score": round(adjusted, 2),
                "severity": sev,
                "delta": round(adjusted - base["overall_score"], 2),
                "tier_change": sev != base["severity"],
            }

        all_crb_results.append(row)

        pops = row["populations"]
        adult = pops["neurotypical_adult"]
        child = pops["child_adhd_10"]
        als = pops["adult_als"]
        print(f"{d['name']:<25} {base['overall_score']:>6.2f} {base['severity']:<8} │ "
              f"{adult['adjusted_score']:>6.2f} {adult['severity']:<8} │ "
              f"{child['adjusted_score']:>10.2f} {child['severity']:<8} │ "
              f"{als['adjusted_score']:>6.2f} {als['severity']:<8}")

    # Phase 4: Delta analysis
    print("\n\n─── DELTA ANALYSIS (Score increase from base) ───\n")
    print(f"{'Device':<25} {'Δ Adult':>8} {'Δ Child+ADHD':>13} {'Δ ALS':>8} │ {'Tier Changes':>15}")
    print("─" * 80)

    tier_changes = []
    for row in all_crb_results:
        adult_d = row["populations"]["neurotypical_adult"]["delta"]
        child_d = row["populations"]["child_adhd_10"]["delta"]
        als_d = row["populations"]["adult_als"]["delta"]

        changes = []
        for pop_id, pop_name in [("neurotypical_adult", "Adult"), ("child_adhd_10", "Child"), ("adult_als", "ALS")]:
            if row["populations"][pop_id]["tier_change"]:
                old = row["base_severity"]
                new = row["populations"][pop_id]["severity"]
                changes.append(f"{pop_name}: {old}→{new}")
                tier_changes.append((row["device"], pop_name, old, new))

        change_str = ", ".join(changes) if changes else "none"
        print(f"{row['device']:<25} {adult_d:>+8.2f} {child_d:>+13.2f} {als_d:>+8.2f} │ {change_str}")

    # Phase 5: Key findings
    print("\n\n─── KEY FINDINGS ───\n")

    # Find the biggest CRB impact
    max_delta = 0
    max_case = ""
    for row in all_crb_results:
        for pop_id, pop_data in row["populations"].items():
            if pop_data["delta"] > max_delta:
                max_delta = pop_data["delta"]
                max_case = f"{row['device']} + {CRB_POPULATIONS[pop_id]['label']}"

    print(f"  1. Largest CRB impact: {max_case} (Δ = +{max_delta:.2f})")

    # Count tier changes
    print(f"  2. Tier changes: {len(tier_changes)} of {len(PILOT_DEVICES) * 3} device-population pairs")
    for device, pop, old, new in tier_changes:
        print(f"     - {device} ({pop}): {old} → {new}")

    # BrainCo Focus 1 special case (targets children)
    brainco = next(r for r in all_crb_results if r["device"] == "BrainCo Focus 1")
    brainco_child = brainco["populations"]["child_adhd_10"]
    print(f"  3. BrainCo Focus 1 (targets children): base {brainco['base']:.2f} → "
          f"child+ADHD {brainco_child['adjusted_score']:.2f} "
          f"({brainco_child['severity']})")
    print(f"     This device MARKETS to children. CRB correctly escalates the risk.")

    # ALS consent paradox
    n1 = next(r for r in all_crb_results if r["device"] == "Neuralink N1")
    n1_als = n1["populations"]["adult_als"]
    print(f"  4. Consent paradox (N1 + ALS): base {n1['base']:.2f} → "
          f"ALS {n1_als['adjusted_score']:.2f} ({n1_als['severity']})")
    print(f"     V_depend=0.90 drives the adjustment. Patient depends on the device for communication,")
    print(f"     making withdrawal of consent dependent on the very system being assessed.")

    # Neurotypical adult = zero adjustment (sanity check)
    adult_deltas = [r["populations"]["neurotypical_adult"]["delta"] for r in all_crb_results]
    print(f"  5. Sanity check: neurotypical adult Δ = {adult_deltas[0]:.2f} for all devices (CRB=0 → no adjustment)")

    # JSON output
    output = {
        "version": "NSv2.1b-CRB-pilot",
        "gamma": 0.30,
        "populations": {k: {
            "label": v["label"],
            "description": v["description"],
            "V_age": v["V_age"], "V_dx": v["V_dx"],
            "V_consent": v["V_consent"], "V_depend": v["V_depend"],
            "CRB": round(compute_crb(v), 4),
        } for k, v in CRB_POPULATIONS.items()},
        "results": all_crb_results,
    }

    output_path = Path(__file__).parent.parent / "shared" / "neurosecurity-crb-pilot.json"
    with open(output_path, "w") as f:
        json.dump(output, f, indent=2)
    print(f"\n  JSON saved to: {output_path}")


if __name__ == "__main__":
    main()
