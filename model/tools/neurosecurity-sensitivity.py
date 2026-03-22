#!/usr/bin/env python3
"""
NSv2.1b Sensitivity Analysis & Statistical Validation
Addresses ChatGPT reviewer requirements:
1. Mann-Whitney U + Cohen's d on discriminant gap
2. BNS weight sensitivity sweep
3. P_realize sensitivity sweep
4. Theta (DSM ordinal coding) sensitivity sweep
"""

import json
import math
import itertools
from pathlib import Path

# ============================================================
# Import core functions from neurosecurity-score.py (inline)
# ============================================================

EPSILON = 0.01

W_NISS_DEFAULT = 0.40
W_CCI_DEFAULT = 0.20
W_DSM_DEFAULT = 0.40

SEVERITY_THETA_DEFAULT = {"low": 0.25, "medium": 0.50, "high": 0.75, "critical": 1.00}

P_REALIZE_DEFAULT = {0: 0.95, 1: 0.75, 2: 0.40, 3: 0.10, "X": 0.95}

def niss_norm(niss):
    return max(niss / 10.0, EPSILON)

def cci_norm(cci):
    return max(min(cci / 3.0, 1.0), EPSILON)

def dsm_norm(severity, theta_map=None):
    if theta_map is None:
        theta_map = SEVERITY_THETA_DEFAULT
    return theta_map.get(severity, 0.25)

def bns(niss_n, cci_n, dsm_n, w_niss=W_NISS_DEFAULT, w_cci=W_CCI_DEFAULT, w_dsm=W_DSM_DEFAULT):
    return (niss_n ** w_niss) * (cci_n ** w_cci) * (dsm_n ** w_dsm)

def feasibility(physics_tier, p_realize_map=None):
    if p_realize_map is None:
        p_realize_map = P_REALIZE_DEFAULT
    if isinstance(physics_tier, str):
        if physics_tier.upper() == "X":
            return p_realize_map.get("X", 0.95)
        try:
            return p_realize_map.get(int(physics_tier), 0.50)
        except ValueError:
            return 0.50
    return p_realize_map.get(physics_tier, 0.50)

def owa_aggregate(scores, lam=0.5):
    if not scores:
        return 0.0
    sorted_scores = sorted(scores, reverse=True)
    n = len(sorted_scores)
    weights = [lam ** i for i in range(n)]
    w_sum = sum(weights)
    weights = [w / w_sum for w in weights]
    return sum(w * s for w, s in zip(weights, sorted_scores))

EA_PROFILES = {
    "invasive_medical": {"afford": 8.5, "geo": 7.0, "legal": 7.0, "demo": 7.0},
    "invasive_research": {"afford": 8.0, "geo": 8.0, "legal": 6.0, "demo": 7.0},
    "semi_invasive_medical": {"afford": 7.5, "geo": 6.5, "legal": 6.0, "demo": 6.0},
    "non_invasive_clinical": {"afford": 4.0, "geo": 4.0, "legal": 4.5, "demo": 5.0},
    "non_invasive_consumer": {"afford": 1.5, "geo": 1.0, "legal": 2.0, "demo": 2.5},
    "non_invasive_research": {"afford": 3.0, "geo": 3.0, "legal": 3.5, "demo": 4.5},
    "non_invasive_assistive": {"afford": 4.5, "geo": 4.0, "legal": 4.5, "demo": 4.5},
}

def ea_score(profile_key):
    p = EA_PROFILES.get(profile_key, EA_PROFILES["non_invasive_consumer"])
    return (p["afford"] + p["geo"] + p["legal"] + p["demo"]) / 4.0

def compute_device_score(device, w_niss=W_NISS_DEFAULT, w_cci=W_CCI_DEFAULT, w_dsm=W_DSM_DEFAULT,
                         theta_map=None, p_realize_map=None):
    techniques = device["techniques"]
    if isinstance(techniques, str) and techniques.startswith("SAME_AS:"):
        return None  # handled by caller

    rights_risks = {"CL": [], "MI": [], "MP": [], "PC": []}
    for t in techniques:
        nn = niss_norm(t["niss"])
        cn = cci_norm(t["cci"])
        dn = dsm_norm(t["severity"], theta_map)
        b = bns(nn, cn, dn, w_niss, w_cci, w_dsm)
        f = feasibility(t["physics_tier"], p_realize_map)
        risk = b * f
        for r in t["rights"]:
            if r in rights_risks:
                rights_risks[r].append(risk)

    subscores = {}
    for r, risks in rights_risks.items():
        if risks:
            raw = owa_aggregate(risks)
            subscores[r] = min(raw * 10, 10)
        else:
            subscores[r] = EPSILON

    purpose = device.get("purpose", "consumer")
    dtype = device["type"]
    if dtype == "invasive":
        ea_key = f"invasive_{purpose}"
    elif dtype == "semi_invasive":
        ea_key = f"semi_invasive_{purpose}"
    else:
        ea_key = f"non_invasive_{purpose}"
    subscores["EA"] = ea_score(ea_key)

    vals = [subscores.get(r, EPSILON) for r in ["MI", "CL", "MP", "PC", "EA"]]
    vals = [max(v, EPSILON) for v in vals]
    overall = 1.0
    for v in vals:
        overall *= v
    overall = overall ** (1.0 / 5.0)

    return {"device": device["name"], "type": dtype, "overall_score": overall, "subscores": subscores}


# ============================================================
# Load device data from the score script
# ============================================================

def load_devices():
    """Load device data by importing from the score JSON or inlining."""
    scores_path = Path(__file__).parent.parent / "shared" / "neurosecurity-scores.json"
    if scores_path.exists():
        with open(scores_path) as f:
            data = json.load(f)
        # We need raw technique data, not computed scores. Import from the py file.
        pass

    # Import devices directly from the score module
    import importlib.util
    spec = importlib.util.spec_from_file_location("ns", Path(__file__).parent / "neurosecurity-score.py")
    ns = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(ns)

    # Resolve SAME_AS references
    devices = []
    device_map = {}
    for d in ns.DEVICES:
        if isinstance(d["techniques"], str) and d["techniques"].startswith("SAME_AS:"):
            ref_name = d["techniques"].split("SAME_AS:")[1]
            if ref_name in device_map:
                resolved = dict(d)
                resolved["techniques"] = device_map[ref_name]["techniques"]
                devices.append(resolved)
        else:
            devices.append(d)
            device_map[d["name"]] = d
    return devices


def score_all(devices, w_niss=W_NISS_DEFAULT, w_cci=W_CCI_DEFAULT, w_dsm=W_DSM_DEFAULT,
              theta_map=None, p_realize_map=None):
    """Score all devices with given parameters, return list of results."""
    results = []
    for d in devices:
        r = compute_device_score(d, w_niss, w_cci, w_dsm, theta_map, p_realize_map)
        if r:
            results.append(r)
    return results


# ============================================================
# TEST 1: Mann-Whitney U + Cohen's d
# ============================================================

def mann_whitney_u(x, y):
    """Manual Mann-Whitney U test (no scipy dependency)."""
    nx, ny = len(x), len(y)
    # Combine and rank
    combined = [(v, 'x') for v in x] + [(v, 'y') for v in y]
    combined.sort(key=lambda t: t[0])

    # Assign ranks (handle ties with average rank)
    ranks = []
    i = 0
    while i < len(combined):
        j = i
        while j < len(combined) and combined[j][0] == combined[i][0]:
            j += 1
        avg_rank = (i + 1 + j) / 2.0
        for k in range(i, j):
            ranks.append((combined[k][1], avg_rank))
        i = j

    # Sum ranks for group x
    r_x = sum(r for g, r in ranks if g == 'x')

    # U statistic
    u_x = r_x - nx * (nx + 1) / 2
    u_y = nx * ny - u_x
    u = min(u_x, u_y)

    # Normal approximation for p-value (valid for n >= 8)
    mu = nx * ny / 2
    sigma = math.sqrt(nx * ny * (nx + ny + 1) / 12)
    if sigma == 0:
        return u, 1.0, 0.0
    z = (u - mu) / sigma

    # Two-tailed p-value approximation using error function
    p = 2 * (1 - 0.5 * (1 + math.erf(abs(z) / math.sqrt(2))))

    # Effect size: r = Z / sqrt(N)
    r_effect = abs(z) / math.sqrt(nx + ny)

    return u, p, r_effect


def cohens_d(x, y):
    """Cohen's d effect size."""
    nx, ny = len(x), len(y)
    mean_x = sum(x) / nx
    mean_y = sum(y) / ny
    var_x = sum((v - mean_x) ** 2 for v in x) / (nx - 1) if nx > 1 else 0
    var_y = sum((v - mean_y) ** 2 for v in y) / (ny - 1) if ny > 1 else 0
    pooled_sd = math.sqrt(((nx - 1) * var_x + (ny - 1) * var_y) / (nx + ny - 2))
    if pooled_sd == 0:
        return 0.0
    return (mean_x - mean_y) / pooled_sd


def ci_difference(x, y, confidence=0.95):
    """Bootstrap-free CI for difference of means using t-approximation."""
    nx, ny = len(x), len(y)
    mean_x = sum(x) / nx
    mean_y = sum(y) / ny
    var_x = sum((v - mean_x) ** 2 for v in x) / (nx - 1) if nx > 1 else 0
    var_y = sum((v - mean_y) ** 2 for v in y) / (ny - 1) if ny > 1 else 0
    se = math.sqrt(var_x / nx + var_y / ny)
    # t critical value approximation for 95% CI, df ~ min(nx,ny)-1
    t_crit = 2.228  # approx for df=10, 95% two-tailed
    diff = mean_x - mean_y
    return diff, diff - t_crit * se, diff + t_crit * se


def test_discriminant(results):
    """Test 1: Statistical testing of invasive vs non-invasive gap."""
    print("=" * 80)
    print("TEST 1: DISCRIMINANT VALIDITY — INFERENTIAL STATISTICS")
    print("=" * 80)

    invasive = [r["overall_score"] for r in results if r["type"] in ("invasive", "semi_invasive")]
    non_inv = [r["overall_score"] for r in results if r["type"] == "non_invasive"]

    mean_inv = sum(invasive) / len(invasive)
    mean_non = sum(non_inv) / len(non_inv)

    print(f"\nInvasive/semi-invasive (n={len(invasive)}): mean={mean_inv:.3f}")
    print(f"  Scores: {[round(s,2) for s in sorted(invasive, reverse=True)]}")
    print(f"Non-invasive (n={len(non_inv)}): mean={mean_non:.3f}")
    print(f"  Scores: {[round(s,2) for s in sorted(non_inv, reverse=True)]}")

    # Mann-Whitney U
    u, p, r_eff = mann_whitney_u(invasive, non_inv)
    print(f"\nMann-Whitney U test:")
    print(f"  U = {u:.1f}")
    print(f"  p = {p:.4f} {'(significant at α=0.05)' if p < 0.05 else '(NOT significant at α=0.05)'}")
    print(f"  r (effect size) = {r_eff:.3f} ({classify_r(r_eff)})")

    # Cohen's d
    d = cohens_d(invasive, non_inv)
    print(f"\nCohen's d = {d:.3f} ({classify_d(d)})")

    # CI for difference
    diff, ci_lo, ci_hi = ci_difference(invasive, non_inv)
    print(f"\nDifference of means: {diff:.3f}")
    print(f"95% CI: [{ci_lo:.3f}, {ci_hi:.3f}]")
    print(f"CI excludes zero: {ci_lo > 0}")

    return {"u": u, "p": p, "r": r_eff, "d": d, "diff": diff, "ci": (ci_lo, ci_hi)}


def classify_r(r):
    if r < 0.1: return "negligible"
    if r < 0.3: return "small"
    if r < 0.5: return "medium"
    return "large"

def classify_d(d):
    d = abs(d)
    if d < 0.2: return "negligible"
    if d < 0.5: return "small"
    if d < 0.8: return "medium"
    return "large"


# ============================================================
# TEST 2: BNS Weight Sensitivity Sweep
# ============================================================

def test_weight_sensitivity(devices):
    """Test 2: Sweep BNS weights and check rank stability."""
    print("\n" + "=" * 80)
    print("TEST 2: BNS WEIGHT SENSITIVITY SWEEP")
    print("=" * 80)

    # Baseline ranking
    baseline = score_all(devices)
    baseline_ranking = [r["device"] for r in sorted(baseline, key=lambda x: -x["overall_score"])]
    baseline_scores = {r["device"]: r["overall_score"] for r in baseline}

    # Weight configurations to test
    configs = [
        ("Equal (0.33/0.33/0.33)", 0.333, 0.334, 0.333),
        ("NISS-heavy (0.50/0.10/0.40)", 0.50, 0.10, 0.40),
        ("DSM-heavy (0.30/0.20/0.50)", 0.30, 0.20, 0.50),
        ("CCI-heavy (0.30/0.40/0.30)", 0.30, 0.40, 0.30),
        ("Baseline (0.40/0.20/0.40)", 0.40, 0.20, 0.40),
        ("Extreme NISS (0.60/0.10/0.30)", 0.60, 0.10, 0.30),
        ("Extreme DSM (0.30/0.10/0.60)", 0.30, 0.10, 0.60),
        ("CCI=0 (0.50/0.00/0.50)", 0.50, 0.00, 0.50),
    ]

    print(f"\n{'Config':<35} {'Top-1':>12} {'Top-3 same?':>12} {'N1 Score':>10} {'Rank τ':>8}")
    print("-" * 80)

    rank_correlations = []
    score_ranges = {d: [] for d in baseline_scores}

    for label, w_n, w_c, w_d in configs:
        # Clamp w_c to epsilon if 0 to avoid log(0)
        w_c_eff = max(w_c, 0.001)
        # Renormalize
        total = w_n + w_c_eff + w_d
        w_n_norm, w_c_norm, w_d_norm = w_n/total, w_c_eff/total, w_d/total

        results = score_all(devices, w_n_norm, w_c_norm, w_d_norm)
        ranking = [r["device"] for r in sorted(results, key=lambda x: -x["overall_score"])]
        scores_map = {r["device"]: r["overall_score"] for r in results}

        # Track score ranges
        for d, s in scores_map.items():
            score_ranges[d].append(s)

        # Kendall tau approximation (concordance)
        concordant = 0
        discordant = 0
        for i in range(len(baseline_ranking)):
            for j in range(i+1, len(baseline_ranking)):
                bi = baseline_ranking.index(baseline_ranking[i])
                bj = baseline_ranking.index(baseline_ranking[j])
                try:
                    ri = ranking.index(baseline_ranking[i])
                    rj = ranking.index(baseline_ranking[j])
                except ValueError:
                    continue
                if (bi - bj) * (ri - rj) > 0:
                    concordant += 1
                elif (bi - bj) * (ri - rj) < 0:
                    discordant += 1

        n_pairs = concordant + discordant
        tau = (concordant - discordant) / n_pairs if n_pairs > 0 else 1.0
        rank_correlations.append(tau)

        top1 = ranking[0]
        top3_same = set(ranking[:3]) == set(baseline_ranking[:3])
        n1_score = scores_map.get("Neuralink N1", 0)

        print(f"{label:<35} {top1:>12} {'Yes' if top3_same else 'NO':>12} {n1_score:>10.2f} {tau:>8.3f}")

    # Score variance per device
    print(f"\nScore range per device (across all weight configs):")
    print(f"{'Device':<30} {'Min':>8} {'Max':>8} {'Range':>8}")
    print("-" * 56)
    for d in baseline_ranking[:10]:  # Top 10
        vals = score_ranges[d]
        print(f"{d:<30} {min(vals):>8.2f} {max(vals):>8.2f} {max(vals)-min(vals):>8.2f}")

    mean_tau = sum(rank_correlations) / len(rank_correlations)
    print(f"\nMean Kendall τ across configs: {mean_tau:.3f}")
    print(f"Rank stability: {'STABLE (τ>0.90)' if mean_tau > 0.90 else 'MODERATE (0.70<τ<0.90)' if mean_tau > 0.70 else 'UNSTABLE (τ<0.70)'}")

    return {"mean_tau": mean_tau, "score_ranges": {d: (min(v), max(v)) for d, v in score_ranges.items()}}


# ============================================================
# TEST 3: P_realize Sensitivity Sweep
# ============================================================

def test_prealize_sensitivity(devices):
    """Test 3: Sweep P_realize values ±0.15."""
    print("\n" + "=" * 80)
    print("TEST 3: P_REALIZE (FEASIBILITY) SENSITIVITY SWEEP")
    print("=" * 80)

    baseline = score_all(devices)
    baseline_scores = {r["device"]: r["overall_score"] for r in baseline}
    baseline_ranking = [r["device"] for r in sorted(baseline, key=lambda x: -x["overall_score"])]

    # Sweep configs
    configs = [
        ("Baseline", {0: 0.95, 1: 0.75, 2: 0.40, 3: 0.10, "X": 0.95}),
        ("Conservative (-0.15)", {0: 0.80, 1: 0.60, 2: 0.25, 3: 0.05, "X": 0.80}),
        ("Aggressive (+0.15)", {0: 1.00, 1: 0.90, 2: 0.55, 3: 0.25, "X": 1.00}),
        ("Flat high (all 0.80)", {0: 0.80, 1: 0.80, 2: 0.80, 3: 0.80, "X": 0.80}),
        ("Steep gradient", {0: 0.99, 1: 0.60, 2: 0.20, 3: 0.02, "X": 0.99}),
        ("Tier2 pivot +0.20", {0: 0.95, 1: 0.75, 2: 0.60, 3: 0.10, "X": 0.95}),
        ("Tier1 pivot -0.20", {0: 0.95, 1: 0.55, 2: 0.40, 3: 0.10, "X": 0.95}),
    ]

    print(f"\n{'Config':<25} {'T0':>5} {'T1':>5} {'T2':>5} {'T3':>5} {'TX':>5} | {'N1':>6} {'Mean':>6} {'Max Δ':>6}")
    print("-" * 80)

    for label, p_map in configs:
        results = score_all(devices, p_realize_map=p_map)
        scores_map = {r["device"]: r["overall_score"] for r in results}
        all_scores = [r["overall_score"] for r in results]

        n1 = scores_map.get("Neuralink N1", 0)
        mean_s = sum(all_scores) / len(all_scores)
        max_delta = max(abs(scores_map.get(d, 0) - baseline_scores.get(d, 0)) for d in baseline_scores)

        print(f"{label:<25} {p_map[0]:>5.2f} {p_map[1]:>5.2f} {p_map[2]:>5.2f} {p_map[3]:>5.2f} {p_map['X']:>5.2f} | "
              f"{n1:>6.2f} {mean_s:>6.2f} {max_delta:>6.2f}")

    # Compute max score swing
    all_n1_scores = []
    for _, p_map in configs:
        results = score_all(devices, p_realize_map=p_map)
        for r in results:
            if r["device"] == "Neuralink N1":
                all_n1_scores.append(r["overall_score"])

    print(f"\nN1 score range across P_realize configs: {min(all_n1_scores):.2f} - {max(all_n1_scores):.2f} (swing: {max(all_n1_scores)-min(all_n1_scores):.2f})")


# ============================================================
# TEST 4: Theta (DSM Ordinal Coding) Sensitivity Sweep
# ============================================================

def test_theta_sensitivity(devices):
    """Test 4: Sweep theta values ±0.10."""
    print("\n" + "=" * 80)
    print("TEST 4: THETA (DSM SEVERITY CODING) SENSITIVITY SWEEP")
    print("=" * 80)

    baseline = score_all(devices)
    baseline_scores = {r["device"]: r["overall_score"] for r in baseline}

    configs = [
        ("Baseline (0.25/0.50/0.75/1.00)", {"low": 0.25, "medium": 0.50, "high": 0.75, "critical": 1.00}),
        ("Compressed low (-0.10)", {"low": 0.15, "medium": 0.40, "high": 0.65, "critical": 0.90}),
        ("Expanded high (+0.10)", {"low": 0.35, "medium": 0.60, "high": 0.85, "critical": 1.00}),
        ("Wide spread", {"low": 0.10, "medium": 0.40, "high": 0.80, "critical": 1.00}),
        ("Narrow spread", {"low": 0.30, "medium": 0.50, "high": 0.70, "critical": 1.00}),
        ("Log-spaced", {"low": 0.10, "medium": 0.32, "high": 0.56, "critical": 1.00}),
        ("Top-heavy", {"low": 0.10, "medium": 0.30, "high": 0.90, "critical": 1.00}),
        ("Binary (low vs high)", {"low": 0.20, "medium": 0.20, "high": 0.80, "critical": 1.00}),
    ]

    print(f"\n{'Config':<35} {'θ_low':>6} {'θ_med':>6} {'θ_hi':>6} {'θ_crit':>6} | {'N1':>6} {'Mean':>6} {'Max Δ':>6}")
    print("-" * 90)

    all_n1 = []
    all_means = []

    for label, theta in configs:
        results = score_all(devices, theta_map=theta)
        scores_map = {r["device"]: r["overall_score"] for r in results}
        all_scores = [r["overall_score"] for r in results]

        n1 = scores_map.get("Neuralink N1", 0)
        mean_s = sum(all_scores) / len(all_scores)
        max_delta = max(abs(scores_map.get(d, 0) - baseline_scores.get(d, 0)) for d in baseline_scores)

        all_n1.append(n1)
        all_means.append(mean_s)

        print(f"{label:<35} {theta['low']:>6.2f} {theta['medium']:>6.2f} {theta['high']:>6.2f} {theta['critical']:>6.2f} | "
              f"{n1:>6.2f} {mean_s:>6.2f} {max_delta:>6.2f}")

    print(f"\nN1 score range across theta configs: {min(all_n1):.2f} - {max(all_n1):.2f} (swing: {max(all_n1)-min(all_n1):.2f})")
    print(f"Mean score range: {min(all_means):.2f} - {max(all_means):.2f} (swing: {max(all_means)-min(all_means):.2f})")

    # Rank stability across theta configs
    baseline_ranking = [r["device"] for r in sorted(baseline, key=lambda x: -x["overall_score"])]
    rank_changes = 0
    for _, theta in configs:
        results = score_all(devices, theta_map=theta)
        ranking = [r["device"] for r in sorted(results, key=lambda x: -x["overall_score"])]
        if ranking[:3] != baseline_ranking[:3]:
            rank_changes += 1

    print(f"\nTop-3 ranking changes across {len(configs)} configs: {rank_changes}")
    print(f"Top-3 stability: {'STABLE' if rank_changes == 0 else 'MODERATE' if rank_changes <= 2 else 'UNSTABLE'}")


# ============================================================
# MAIN
# ============================================================

def main():
    print("NEUROSECURITY SCORE v2.1b — SENSITIVITY ANALYSIS & VALIDATION")
    print("=" * 80)

    devices = load_devices()
    print(f"Loaded {len(devices)} devices\n")

    # Run all 4 tests
    baseline = score_all(devices)

    disc_results = test_discriminant(baseline)
    weight_results = test_weight_sensitivity(devices)
    test_prealize_sensitivity(devices)
    test_theta_sensitivity(devices)

    # Summary
    print("\n" + "=" * 80)
    print("SUMMARY — REVIEWER REQUIREMENTS STATUS")
    print("=" * 80)
    print(f"""
1. DISCRIMINANT VALIDITY (ChatGPT CRITICAL):
   Mann-Whitney U: p={disc_results['p']:.4f} {'✓ SIGNIFICANT' if disc_results['p'] < 0.05 else '✗ NOT SIGNIFICANT'}
   Cohen's d: {disc_results['d']:.3f} ({classify_d(disc_results['d'])})
   95% CI for gap: [{disc_results['ci'][0]:.3f}, {disc_results['ci'][1]:.3f}] {'✓ excludes zero' if disc_results['ci'][0] > 0 else '✗ includes zero'}

2. WEIGHT SENSITIVITY (ChatGPT IMPORTANT):
   Mean Kendall τ: {weight_results['mean_tau']:.3f} {'✓ STABLE' if weight_results['mean_tau'] > 0.85 else '✗ NEEDS ATTENTION'}
   Rankings robust to weight perturbation: {'Yes' if weight_results['mean_tau'] > 0.85 else 'Partially'}

3. P_REALIZE SENSITIVITY: See table above
   Score swing captured — review for acceptable variance

4. THETA SENSITIVITY: See table above
   Score swing captured — review for acceptable variance
""")


if __name__ == "__main__":
    main()
