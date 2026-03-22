#!/usr/bin/env python3
"""
NSv2.1b CRB Sensitivity Analysis
=================================

Three tests:
1. γ sweep [0.10, 0.50] — does the coupling constant change tier assignments?
2. CRB weight alternatives — equal mean vs consent-heavy vs depend-heavy vs age-heavy
3. All 22 devices × 3 populations — comprehensive CRB scoring

Uses the same base scoring engine as neurosecurity-crb-pilot.py.
"""

import sys
import json
import math
from pathlib import Path
from itertools import product

EPSILON = 1e-9

# ═══ Core scoring functions (replicated from neurosecurity-score.py) ═══

def niss_norm(niss): return min(max(niss / 10.0, 0.0), 1.0)
def cci_norm(cci): return min(max(cci / 3.0, 0.0), 1.0)

DSM_MAP = {"none": 0.0, "low": 0.2, "medium": 0.5, "high": 0.8, "critical": 1.0}
def dsm_norm(sev): return DSM_MAP.get(sev, 0.0)

def bns(nn, cn, dn, w_niss=0.40, w_cci=0.20, w_dsm=0.40):
    return (max(nn, EPSILON) ** w_niss) * (max(cn, EPSILON) ** w_cci) * (max(dn, EPSILON) ** w_dsm)

PHYSICS_MAP = {0: 1.0, 1: 0.75, 2: 0.50, 3: 0.25, "X": 0.10}
def feasibility(tier): return PHYSICS_MAP.get(tier, 0.10)

def owa_aggregate(risks, lam=0.5):
    if not risks: return 0.0
    n = len(risks)
    sorted_r = sorted(risks, reverse=True)
    weights = [lam * (1 - lam) ** i for i in range(n)]
    w_sum = sum(weights)
    if w_sum < EPSILON: return sum(sorted_r) / n
    weights = [w / w_sum for w in weights]
    return sum(w * r for w, r in zip(weights, sorted_r))

def geometric_mean(values):
    if not values: return 0.0
    product = 1.0
    for v in values: product *= max(v, EPSILON)
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
    "software_developer": {"afford": 0.30, "geo": 0.10, "legal": 0.15, "demo": 0.20},
}

def ea_score(device_type, purpose):
    key = f"{device_type}_{purpose}"
    profile = EA_PROFILES.get(key, {"afford": 0.30, "geo": 0.25, "legal": 0.20, "demo": 0.25})
    return sum(profile.values()) / len(profile)

def severity_label(score):
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
        technique_risks.append({"risk": risk, "rights": t.get("rights", [])})

    right_scores = {}
    for r in RIGHTS:
        r_risks = [tr["risk"] for tr in technique_risks if r in tr["rights"]]
        right_scores[r] = owa_aggregate(r_risks, lam) * 10

    right_scores["EA"] = ea_score(device_type, purpose) * 10
    ns = geometric_mean([right_scores[r] for r in ALL_RIGHTS])
    return round(ns, 4)

def crb_adjust(ns, crb, gamma=0.30):
    return min(ns * (1 + gamma * crb), 10.0)


# ═══ Population profiles ═══

POPULATIONS = {
    "neurotypical_adult": {"label": "Adult", "V_age": 0.0, "V_dx": 0.0, "V_consent": 0.0, "V_depend": 0.0},
    "child_adhd_10": {"label": "Child+ADHD", "V_age": 0.75, "V_dx": 0.50, "V_consent": 0.80, "V_depend": 0.30},
    "adult_als": {"label": "ALS", "V_age": 0.0, "V_dx": 0.85, "V_consent": 0.40, "V_depend": 0.90},
}

def compute_crb_equal(pop):
    return (pop["V_age"] + pop["V_dx"] + pop["V_consent"] + pop["V_depend"]) / 4

# Alternative weighting schemes
CRB_WEIGHT_SCHEMES = {
    "equal": {"V_age": 0.25, "V_dx": 0.25, "V_consent": 0.25, "V_depend": 0.25},
    "consent_heavy": {"V_age": 0.15, "V_dx": 0.20, "V_consent": 0.40, "V_depend": 0.25},
    "depend_heavy": {"V_age": 0.15, "V_dx": 0.20, "V_consent": 0.25, "V_depend": 0.40},
    "age_heavy": {"V_age": 0.40, "V_dx": 0.20, "V_consent": 0.25, "V_depend": 0.15},
}

def compute_crb_weighted(pop, weights):
    return (weights["V_age"] * pop["V_age"] + weights["V_dx"] * pop["V_dx"] +
            weights["V_consent"] * pop["V_consent"] + weights["V_depend"] * pop["V_depend"])


# ═══ All 22 devices (from neurosecurity-score.py) ═══

DEVICES = [
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
    {"name": "NeuroSky MindWave", "type": "non_invasive", "purpose": "consumer", "techniques": [
        {"id": "T0005", "niss": 6.4, "cci": 1.44, "severity": "medium", "rights": ["CL","MI"], "physics_tier": 3},
        {"id": "T0008", "niss": 6.4, "cci": 0.96, "severity": "medium", "rights": ["CL","MI"], "physics_tier": 2},
        {"id": "T0021", "niss": 2.7, "cci": 0.2, "severity": "low", "rights": ["MP"], "physics_tier": "X"},
        {"id": "T0023", "niss": 7.4, "cci": 2.7, "severity": "high", "rights": ["MP","CL","MI","PC"], "physics_tier": 2},
        {"id": "T0041", "niss": 2.7, "cci": 0.96, "severity": "low", "rights": ["MP","MI","PC"], "physics_tier": 0},
        {"id": "T0081", "niss": 1.4, "cci": 0.12, "severity": "low", "rights": ["MP"], "physics_tier": 0},
        {"id": "T0085", "niss": 3.4, "cci": 2.25, "severity": "low", "rights": ["MP","CL","MI"], "physics_tier": 0},
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
    {"name": "Kernel Flow", "type": "non_invasive", "purpose": "research", "techniques": [
        {"id": "T0005", "niss": 6.4, "cci": 1.44, "severity": "medium", "rights": ["CL","MI"], "physics_tier": 3},
        {"id": "T0008", "niss": 6.4, "cci": 0.96, "severity": "medium", "rights": ["CL","MI"], "physics_tier": 2},
        {"id": "T0021", "niss": 2.7, "cci": 0.2, "severity": "low", "rights": ["MP"], "physics_tier": "X"},
        {"id": "T0023", "niss": 7.4, "cci": 2.7, "severity": "high", "rights": ["MP","CL","MI","PC"], "physics_tier": 2},
        {"id": "T0041", "niss": 2.7, "cci": 0.96, "severity": "low", "rights": ["MP","MI","PC"], "physics_tier": 0},
        {"id": "T0043", "niss": 4.7, "cci": 0.24, "severity": "medium", "rights": ["MP","MI"], "physics_tier": "X"},
        {"id": "T0081", "niss": 1.4, "cci": 0.12, "severity": "low", "rights": ["MP"], "physics_tier": 0},
    ]},
    {"name": "Meta Neural Interface", "type": "non_invasive", "purpose": "consumer", "techniques": [
        {"id": "T0005", "niss": 6.4, "cci": 1.44, "severity": "medium", "rights": ["CL","MI"], "physics_tier": 3},
        {"id": "T0008", "niss": 6.4, "cci": 0.96, "severity": "medium", "rights": ["CL","MI"], "physics_tier": 2},
        {"id": "T0021", "niss": 2.7, "cci": 0.2, "severity": "low", "rights": ["MP"], "physics_tier": "X"},
        {"id": "T0023", "niss": 7.4, "cci": 2.7, "severity": "high", "rights": ["MP","CL","MI","PC"], "physics_tier": 2},
        {"id": "T0041", "niss": 2.7, "cci": 0.96, "severity": "low", "rights": ["MP","MI","PC"], "physics_tier": 0},
        {"id": "T0081", "niss": 1.4, "cci": 0.12, "severity": "low", "rights": ["MP"], "physics_tier": 0},
        {"id": "T0085", "niss": 3.4, "cci": 2.25, "severity": "low", "rights": ["MP","CL","MI"], "physics_tier": 0},
    ]},
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
    {"name": "Cortera Surface Array", "type": "invasive", "purpose": "research", "techniques": [
        {"id": "T0001", "niss": 6.4, "cci": 0.96, "severity": "medium", "rights": ["CL","MI"], "physics_tier": 0},
        {"id": "T0005", "niss": 6.4, "cci": 1.44, "severity": "medium", "rights": ["CL","MI"], "physics_tier": 3},
        {"id": "T0008", "niss": 6.4, "cci": 0.96, "severity": "medium", "rights": ["CL","MI"], "physics_tier": 2},
        {"id": "T0021", "niss": 2.7, "cci": 0.2, "severity": "low", "rights": ["MP"], "physics_tier": "X"},
        {"id": "T0041", "niss": 2.7, "cci": 0.96, "severity": "low", "rights": ["MP","MI","PC"], "physics_tier": 0},
        {"id": "T0061", "niss": 0.7, "cci": 0.48, "severity": "low", "rights": ["CL","MI"], "physics_tier": 2},
        {"id": "T0081", "niss": 1.4, "cci": 0.12, "severity": "low", "rights": ["MP"], "physics_tier": 0},
    ]},
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
    name_map = {d["name"]: d for d in devices if isinstance(d.get("techniques"), list)}
    for d in devices:
        if isinstance(d.get("techniques"), str) and d["techniques"].startswith("SAME_AS:"):
            ref = d["techniques"].replace("SAME_AS:", "")
            if ref in name_map:
                d["techniques"] = name_map[ref]["techniques"]
    return devices


def main():
    devices = resolve_references(DEVICES)

    # Compute base scores for all devices
    base_scores = {}
    for d in devices:
        if not isinstance(d.get("techniques"), list):
            continue
        ns = compute_device_score(d["name"], d["techniques"], d["type"], d["purpose"])
        base_scores[d["name"]] = {"ns": ns, "severity": severity_label(ns),
                                   "type": d["type"], "purpose": d["purpose"]}

    # ═══════════════════════════════════════════
    # TEST 1: γ Sensitivity Sweep
    # ═══════════════════════════════════════════
    print("=" * 120)
    print("TEST 1: γ SENSITIVITY SWEEP [0.10, 0.15, 0.20, 0.25, 0.30, 0.35, 0.40, 0.45, 0.50]")
    print("=" * 120)

    gammas = [0.10, 0.15, 0.20, 0.25, 0.30, 0.35, 0.40, 0.45, 0.50]

    # Track tier changes per gamma for child+ADHD (most impactful population)
    pop = POPULATIONS["child_adhd_10"]
    crb = compute_crb_equal(pop)

    print(f"\nPopulation: Child+ADHD (CRB={crb:.4f})")
    print(f"\n{'Device':<30} {'Base':>5} {'Sev':<6}", end="")
    for g in gammas:
        print(f" │ γ={g:.2f}", end="")
    print()
    print("─" * 140)

    gamma_tier_changes = {g: 0 for g in gammas}
    gamma_rankings = {g: [] for g in gammas}

    for name, info in sorted(base_scores.items(), key=lambda x: x[1]["ns"], reverse=True):
        print(f"{name:<30} {info['ns']:>5.2f} {info['severity']:<6}", end="")
        for g in gammas:
            adj = crb_adjust(info["ns"], crb, g)
            sev = severity_label(adj)
            marker = "*" if sev != info["severity"] else " "
            print(f" │ {adj:>5.2f}{marker}", end="")
            if sev != info["severity"]:
                gamma_tier_changes[g] += 1
            gamma_rankings[g].append((name, adj))
        print()

    print("\n─── Tier changes by γ ───")
    print(f"{'γ':>6} {'Tier Changes':>13} {'Max Δ':>8}")
    for g in gammas:
        max_delta = max(crb_adjust(info["ns"], crb, g) - info["ns"]
                       for info in base_scores.values())
        print(f"{g:>6.2f} {gamma_tier_changes[g]:>13} {max_delta:>+8.2f}")

    # Rank stability (Kendall tau vs γ=0.30 baseline)
    baseline_rank = [name for name, _ in sorted(base_scores.items(),
                     key=lambda x: crb_adjust(x[1]["ns"], crb, 0.30), reverse=True)]

    print("\n─── Rank stability (vs γ=0.30 baseline) ───")
    for g in gammas:
        g_rank = [name for name, _ in sorted(gamma_rankings[g], key=lambda x: x[1], reverse=True)]
        # Simple rank correlation: count concordant pairs
        n = len(baseline_rank)
        concordant = 0
        discordant = 0
        for i in range(n):
            for j in range(i + 1, n):
                bi = baseline_rank.index(g_rank[i])
                bj = baseline_rank.index(g_rank[j])
                if bi < bj:
                    concordant += 1
                elif bi > bj:
                    discordant += 1
        tau = (concordant - discordant) / (n * (n - 1) / 2) if n > 1 else 1.0
        top3_match = sum(1 for i in range(3) if g_rank[i] == baseline_rank[i])
        print(f"  γ={g:.2f}: Kendall τ = {tau:.3f}, top-3 match = {top3_match}/3")

    # ═══════════════════════════════════════════
    # TEST 2: CRB Weight Alternatives
    # ═══════════════════════════════════════════
    print("\n\n" + "=" * 120)
    print("TEST 2: CRB WEIGHT ALTERNATIVES (γ=0.30 fixed)")
    print("=" * 120)

    print("\nWeight schemes:")
    for scheme_name, weights in CRB_WEIGHT_SCHEMES.items():
        print(f"  {scheme_name:<15}: V_age={weights['V_age']:.2f}  V_dx={weights['V_dx']:.2f}  "
              f"V_consent={weights['V_consent']:.2f}  V_depend={weights['V_depend']:.2f}")

    for pop_id, pop in [("child_adhd_10", POPULATIONS["child_adhd_10"]),
                         ("adult_als", POPULATIONS["adult_als"])]:
        print(f"\n─── {pop['label']} ───")
        print(f"{'Scheme':<16} {'CRB':>6} {'Mult':>6}", end="")
        # Show 5 representative devices
        rep_devices = ["Neuralink N1", "BrainCo Focus 1", "Synchron Stentrode", "Emotiv EPOC X", "Muse 2"]
        for d in rep_devices:
            print(f" │ {d[:12]:>12}", end="")
        print()
        print("─" * 100)

        scheme_rankings = {}
        for scheme_name, weights in CRB_WEIGHT_SCHEMES.items():
            crb_val = compute_crb_weighted(pop, weights)
            mult = 1 + 0.30 * crb_val
            print(f"{scheme_name:<16} {crb_val:>6.4f} {mult:>6.4f}", end="")

            adjusted = {}
            for d_name in rep_devices:
                if d_name in base_scores:
                    adj = crb_adjust(base_scores[d_name]["ns"], crb_val, 0.30)
                    sev = severity_label(adj)
                    base_sev = base_scores[d_name]["severity"]
                    marker = "*" if sev != base_sev else " "
                    print(f" │ {adj:>5.2f} {sev[:3]}{marker}", end="")
                    adjusted[d_name] = adj
            print()
            scheme_rankings[scheme_name] = adjusted

        # Check if any scheme changes the top-3 ranking
        equal_ranking = sorted(scheme_rankings["equal"].items(), key=lambda x: x[1], reverse=True)
        equal_top3 = [name for name, _ in equal_ranking[:3]]
        print(f"\n  Rank stability across weight schemes:")
        for scheme_name, adjusted in scheme_rankings.items():
            scheme_ranking = sorted(adjusted.items(), key=lambda x: x[1], reverse=True)
            scheme_top3 = [name for name, _ in scheme_ranking[:3]]
            match = sum(1 for i in range(3) if scheme_top3[i] == equal_top3[i])
            print(f"    {scheme_name:<16}: top-3 = {scheme_top3}, match={match}/3")

    # ═══════════════════════════════════════════
    # TEST 3: All 22 Devices × 3 Populations
    # ═══════════════════════════════════════════
    print("\n\n" + "=" * 120)
    print("TEST 3: ALL 22 DEVICES × 3 POPULATIONS (γ=0.30, equal weights)")
    print("=" * 120)

    print(f"\n{'Device':<30} {'Type':<12} {'Base':>5} {'Sev':<6} │ "
          f"{'Adult':>5} {'Sev':<6} │ {'Child':>5} {'Sev':<6} │ {'ALS':>5} {'Sev':<6}")
    print("─" * 120)

    all_results = []
    tier_change_count = 0
    total_pairs = 0

    for name, info in sorted(base_scores.items(), key=lambda x: x[1]["ns"], reverse=True):
        print(f"{name:<30} {info['type']:<12} {info['ns']:>5.2f} {info['severity']:<6}", end="")

        device_result = {"device": name, "type": info["type"], "base": info["ns"],
                        "base_severity": info["severity"], "populations": {}}

        for pop_id, pop in POPULATIONS.items():
            crb_val = compute_crb_equal(pop)
            adj = crb_adjust(info["ns"], crb_val, 0.30)
            sev = severity_label(adj)
            marker = "*" if sev != info["severity"] else " "
            label = pop["label"]
            print(f" │ {adj:>5.2f} {sev:<5}{marker}", end="")

            device_result["populations"][pop_id] = {
                "score": round(adj, 2), "severity": sev,
                "delta": round(adj - info["ns"], 2),
                "tier_change": sev != info["severity"],
            }

            total_pairs += 1
            if sev != info["severity"]:
                tier_change_count += 1

        all_results.append(device_result)
        print()

    print(f"\n─── Summary ───")
    print(f"Total device-population pairs: {total_pairs}")
    print(f"Tier changes: {tier_change_count} ({100*tier_change_count/total_pairs:.1f}%)")

    # Count tier changes by population
    for pop_id, pop in POPULATIONS.items():
        changes = sum(1 for r in all_results if r["populations"][pop_id]["tier_change"])
        print(f"  {pop['label']}: {changes} tier changes")

    # Severity distribution per population
    print(f"\n─── Severity Distribution by Population ───")
    for pop_id, pop in POPULATIONS.items():
        dist = {}
        for r in all_results:
            sev = r["populations"][pop_id]["severity"]
            dist[sev] = dist.get(sev, 0) + 1
        print(f"  {pop['label']:<15}: {dist}")

    # Devices that cross the Critical threshold for any population
    critical_cases = [(r["device"], pop_id, r["populations"][pop_id]["score"])
                      for r in all_results
                      for pop_id in POPULATIONS
                      if r["populations"][pop_id]["severity"] == "Critical"]
    if critical_cases:
        print(f"\n  CRITICAL threshold breaches: {len(critical_cases)}")
        for device, pop_id, score in critical_cases:
            print(f"    {device} + {POPULATIONS[pop_id]['label']}: {score:.2f}")
    else:
        print(f"\n  No CRITICAL threshold breaches (max adjusted = "
              f"{max(r['populations'][pop_id]['score'] for r in all_results for pop_id in POPULATIONS):.2f})")

    # JSON output
    output = {
        "version": "NSv2.1b-CRB-sensitivity",
        "tests": {
            "gamma_sweep": {
                "gammas": gammas,
                "tier_changes_by_gamma": gamma_tier_changes,
                "population": "child_adhd_10",
            },
            "weight_alternatives": {
                "schemes": {k: dict(v) for k, v in CRB_WEIGHT_SCHEMES.items()},
            },
            "all_devices": all_results,
        },
        "summary": {
            "total_pairs": total_pairs,
            "tier_changes": tier_change_count,
            "tier_change_rate": round(tier_change_count / total_pairs, 4),
            "critical_breaches": len(critical_cases),
        },
    }

    output_path = Path(__file__).parent.parent / "shared" / "neurosecurity-crb-sensitivity.json"
    with open(output_path, "w") as f:
        json.dump(output, f, indent=2)
    print(f"\nJSON saved to: {output_path}")


if __name__ == "__main__":
    main()
