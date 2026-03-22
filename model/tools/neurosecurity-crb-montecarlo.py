#!/usr/bin/env python3
"""
NSv2.1b CRB Monte Carlo Uncertainty Quantification
====================================================

Entry 14 used point estimates for V_age, V_dx, V_consent, V_depend.
This script adds uncertainty bands by sampling each factor from a
truncated normal distribution centered on the point estimate.

Uncertainty model:
  Each CRB factor ~ TruncatedNormal(μ=point_estimate, σ=uncertainty, a=0, b=1)

  Uncertainty assignments (justified per-factor):
  - V_age: σ=0.05 (age is objective, low uncertainty)
  - V_dx:  σ=0.10 (diagnosis severity has clinical judgment variance, CGI-S inter-rater κ=0.66)
  - V_consent: σ=0.10 (consent capacity assessment has moderate inter-rater variance)
  - V_depend: σ=0.08 (dependency is relatively clear but has edge cases)

10,000 samples per device-population pair.
Outputs: mean, std, 95% CI, P(tier_change), CV for each pair.
"""

import sys
import json
import math
import random
from pathlib import Path
from statistics import mean, stdev

random.seed(42)  # Reproducibility

EPSILON = 1e-9
N_SAMPLES = 10000

# ═══ Core scoring (same as other CRB scripts) ═══

def niss_norm(niss): return min(max(niss / 10.0, 0.0), 1.0)
def cci_norm(cci): return min(max(cci / 3.0, 0.0), 1.0)
DSM_MAP = {"none": 0.0, "low": 0.2, "medium": 0.5, "high": 0.8, "critical": 1.0}
def dsm_norm(sev): return DSM_MAP.get(sev, 0.0)
def bns(nn, cn, dn): return (max(nn, EPSILON)**0.40) * (max(cn, EPSILON)**0.20) * (max(dn, EPSILON)**0.40)
PHYSICS_MAP = {0: 1.0, 1: 0.75, 2: 0.50, 3: 0.25, "X": 0.10}
def feasibility(tier): return PHYSICS_MAP.get(tier, 0.10)

def owa_aggregate(risks, lam=0.5):
    if not risks: return 0.0
    n = len(risks)
    sorted_r = sorted(risks, reverse=True)
    weights = [lam * (1 - lam)**i for i in range(n)]
    w_sum = sum(weights)
    if w_sum < EPSILON: return sum(sorted_r) / n
    return sum(w/w_sum * r for w, r in zip(weights, sorted_r))

def geometric_mean(values):
    if not values: return 0.0
    product = 1.0
    for v in values: product *= max(v, EPSILON)
    return product ** (1.0 / len(values))

EA_PROFILES = {
    "invasive_medical": 0.7375, "invasive_research": 0.725,
    "semi_invasive_medical": 0.6625, "non_invasive_consumer": 0.175,
    "non_invasive_research": 0.35, "non_invasive_medical": 0.4375,
    "non_invasive_enterprise": 0.275,
}

def compute_base_ns(techniques, device_type, purpose):
    technique_risks = []
    for t in techniques:
        risk = bns(niss_norm(t["niss"]), cci_norm(t["cci"]), dsm_norm(t["severity"])) * feasibility(t["physics_tier"])
        technique_risks.append({"risk": risk, "rights": t.get("rights", [])})
    right_scores = {}
    for r in ["CL", "MI", "MP", "PC"]:
        r_risks = [tr["risk"] for tr in technique_risks if r in tr["rights"]]
        right_scores[r] = owa_aggregate(r_risks, 0.5) * 10
    key = f"{device_type}_{purpose}"
    right_scores["EA"] = EA_PROFILES.get(key, 0.25) * 10
    return geometric_mean([right_scores[r] for r in ["CL", "MI", "MP", "PC", "EA"]])

def severity_label(score):
    if score < 0.1: return "None"
    if score < 3.0: return "Low"
    if score < 5.0: return "Medium"
    if score < 7.0: return "High"
    return "Critical"

def crb_adjust(ns, crb, gamma=0.30):
    return min(ns * (1 + gamma * crb), 10.0)


# ═══ Truncated normal sampling ═══

def truncated_normal(mu, sigma, lo=0.0, hi=1.0):
    """Sample from truncated normal using rejection sampling."""
    if sigma <= 0:
        return max(lo, min(hi, mu))
    for _ in range(1000):
        x = random.gauss(mu, sigma)
        if lo <= x <= hi:
            return x
    return max(lo, min(hi, mu))  # Fallback


# ═══ Population profiles with uncertainty ═══

POPULATIONS = {
    "neurotypical_adult": {
        "label": "Neurotypical Adult",
        "V_age": (0.00, 0.00),      # (mean, sigma) — no uncertainty for zero
        "V_dx": (0.00, 0.00),
        "V_consent": (0.00, 0.00),
        "V_depend": (0.00, 0.00),
    },
    "child_adhd_10": {
        "label": "Child+ADHD",
        "V_age": (0.75, 0.05),      # Age is objective: ±0.05
        "V_dx": (0.50, 0.10),       # CGI-S inter-rater κ=0.66 (Busner & Targum 2007): ±0.10
        "V_consent": (0.80, 0.10),  # Gillick threshold fuzzy at edges: ±0.10
        "V_depend": (0.30, 0.08),   # Dependency relatively clear: ±0.08
    },
    "adult_als": {
        "label": "Adult+ALS",
        "V_age": (0.00, 0.00),      # Adult, no age uncertainty
        "V_dx": (0.85, 0.10),       # ALS staging has variance (ALSFRS-R): ±0.10
        "V_consent": (0.40, 0.10),  # Consent paradox severity varies: ±0.10
        "V_depend": (0.90, 0.08),   # High dependency clear but stage-dependent: ±0.08
    },
}


# ═══ Pilot devices (5 representative) ═══

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


def run_monte_carlo(device, pop_id, pop, n_samples=N_SAMPLES):
    """Run Monte Carlo simulation for one device-population pair."""
    base_ns = compute_base_ns(device["techniques"], device["type"], device["purpose"])
    base_sev = severity_label(base_ns)

    samples = []
    tier_changes = 0

    for _ in range(n_samples):
        # Sample each CRB factor from truncated normal
        v_age = truncated_normal(*pop["V_age"])
        v_dx = truncated_normal(*pop["V_dx"])
        v_consent = truncated_normal(*pop["V_consent"])
        v_depend = truncated_normal(*pop["V_depend"])

        crb = (v_age + v_dx + v_consent + v_depend) / 4.0
        adjusted = crb_adjust(base_ns, crb, 0.30)
        samples.append(adjusted)

        if severity_label(adjusted) != base_sev:
            tier_changes += 1

    samples.sort()
    ci_lo = samples[int(0.025 * n_samples)]
    ci_hi = samples[int(0.975 * n_samples)]
    mu = mean(samples)
    sd = stdev(samples) if len(samples) > 1 else 0.0
    cv = (sd / mu * 100) if mu > 0 else 0.0

    return {
        "device": device["name"],
        "population": pop_id,
        "base_ns": round(base_ns, 4),
        "base_severity": base_sev,
        "mc_mean": round(mu, 4),
        "mc_std": round(sd, 4),
        "mc_cv_pct": round(cv, 2),
        "ci_95_lo": round(ci_lo, 4),
        "ci_95_hi": round(ci_hi, 4),
        "ci_width": round(ci_hi - ci_lo, 4),
        "p_tier_change": round(tier_changes / n_samples, 4),
        "mc_severity": severity_label(mu),
    }


def main():
    print("=" * 130)
    print(f"NSv2.1b CRB MONTE CARLO UNCERTAINTY QUANTIFICATION (N={N_SAMPLES}, seed=42)")
    print("=" * 130)

    # Only run MC for the two vulnerable populations (adult = zero uncertainty)
    mc_populations = {k: v for k, v in POPULATIONS.items() if k != "neurotypical_adult"}

    all_results = []

    for pop_id, pop in mc_populations.items():
        print(f"\n─── {pop['label']} ───")
        print(f"  Factor uncertainties: V_age σ={pop['V_age'][1]:.2f}, V_dx σ={pop['V_dx'][1]:.2f}, "
              f"V_consent σ={pop['V_consent'][1]:.2f}, V_depend σ={pop['V_depend'][1]:.2f}")

        print(f"\n  {'Device':<25} {'Base':>5} {'Sev':<6} │ {'MC Mean':>7} {'±σ':>6} {'CV%':>5} │ "
              f"{'95% CI':>15} {'Width':>6} │ {'P(tier)':>7} {'MC Sev':<6}")
        print("  " + "─" * 110)

        for d in PILOT_DEVICES:
            result = run_monte_carlo(d, pop_id, pop)
            all_results.append(result)

            ci_str = f"[{result['ci_95_lo']:.2f}, {result['ci_95_hi']:.2f}]"
            tier_marker = " **" if result["p_tier_change"] > 0.05 else ""
            print(f"  {result['device']:<25} {result['base_ns']:>5.2f} {result['base_severity']:<6} │ "
                  f"{result['mc_mean']:>7.2f} {result['mc_std']:>5.3f} {result['mc_cv_pct']:>5.1f} │ "
                  f"{ci_str:>15} {result['ci_width']:>6.3f} │ "
                  f"{result['p_tier_change']:>7.3f} {result['mc_severity']:<6}{tier_marker}")

    # Summary statistics
    print("\n\n─── SUMMARY ───")

    cvs = [r["mc_cv_pct"] for r in all_results]
    widths = [r["ci_width"] for r in all_results]
    p_tiers = [r["p_tier_change"] for r in all_results]

    print(f"\n  CV% range: {min(cvs):.2f} – {max(cvs):.2f}  (mean: {mean(cvs):.2f})")
    print(f"  CI width range: {min(widths):.3f} – {max(widths):.3f}  (mean: {mean(widths):.3f})")
    print(f"  P(tier change) range: {min(p_tiers):.3f} – {max(p_tiers):.3f}")

    # Identify cases where CI straddles a tier boundary
    tier_boundaries = [3.0, 5.0, 7.0]
    straddle_cases = []
    for r in all_results:
        for boundary in tier_boundaries:
            if r["ci_95_lo"] < boundary < r["ci_95_hi"]:
                straddle_cases.append((r["device"], r["population"], boundary,
                                       r["ci_95_lo"], r["ci_95_hi"], r["p_tier_change"]))

    if straddle_cases:
        print(f"\n  CI straddles tier boundary ({len(straddle_cases)} cases):")
        for device, pop, boundary, lo, hi, p_tier in straddle_cases:
            label = "Low/Med" if boundary == 3.0 else "Med/High" if boundary == 5.0 else "High/Crit"
            print(f"    {device} + {pop}: CI [{lo:.2f}, {hi:.2f}] straddles {label} ({boundary:.1f}), "
                  f"P(tier change) = {p_tier:.3f}")
    else:
        print(f"\n  No CI straddles a tier boundary — all classifications are stable under uncertainty.")

    # CI separation check: do any device-population CIs overlap between populations?
    print(f"\n  CI separation between populations (same device):")
    for d in PILOT_DEVICES:
        child_r = next(r for r in all_results if r["device"] == d["name"] and r["population"] == "child_adhd_10")
        als_r = next(r for r in all_results if r["device"] == d["name"] and r["population"] == "adult_als")
        overlap = child_r["ci_95_lo"] < als_r["ci_95_hi"] and als_r["ci_95_lo"] < child_r["ci_95_hi"]
        sep = "OVERLAP" if overlap else "SEPARATED"
        print(f"    {d['name']:<25}: Child [{child_r['ci_95_lo']:.2f}, {child_r['ci_95_hi']:.2f}] "
              f"vs ALS [{als_r['ci_95_lo']:.2f}, {als_r['ci_95_hi']:.2f}] → {sep}")

    # JSON output
    output = {
        "version": "NSv2.1b-CRB-montecarlo",
        "n_samples": N_SAMPLES,
        "seed": 42,
        "uncertainty_model": {
            "V_age_sigma": 0.05, "V_dx_sigma": 0.10,
            "V_consent_sigma": 0.10, "V_depend_sigma": 0.08,
            "distribution": "TruncatedNormal(mu, sigma, 0, 1)",
        },
        "results": all_results,
    }

    output_path = Path(__file__).parent.parent / "shared" / "neurosecurity-crb-montecarlo.json"
    with open(output_path, "w") as f:
        json.dump(output, f, indent=2)
    print(f"\n  JSON saved to: {output_path}")


if __name__ == "__main__":
    main()
