#!/usr/bin/env python3
"""
Neurosecurity Score v2.1b — External Validation & Uncertainty Quantification
1. FDA Class Correlation (Spearman ρ) — External criterion validation
2. Monte Carlo Uncertainty Quantification (10K samples, Beta distributions, 95% CI)
3. Sobol-like Sensitivity Indices (first-order variance decomposition)
"""

import math
import random
import sys
import importlib.util
from pathlib import Path

# Import device data from score calculator
spec = importlib.util.spec_from_file_location("ns", Path(__file__).parent / "neurosecurity-score.py")
ns_mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(ns_mod)

DEVICES = ns_mod.DEVICES
compute_device_score = ns_mod.compute_device_score

# ============================================================================
# FDA CLASS DATA (researched Feb 2026)
# Class I=1, Class II=2, Class III=3
# Sources: FDA 510(k), PMA databases, manufacturer regulatory filings
# ============================================================================

FDA_CLASS = {
    # Names match DEVICES list in neurosecurity-score.py exactly
    "Neuralink N1":           3,  # IDE (PRIME study NCT06429735)
    "Neuralink Blindsight":   3,  # Breakthrough Device Designation Sep 2024
    "INBRAIN Graphene Probe": 3,  # Breakthrough Device Designation Sep 2023
    "Synchron Stentrode":     3,  # IDE (COMMAND trial NCT05035823)
    "Blackrock NeuroPort":    2,  # 510(k) K110010 (array only; MoveAgain BDD pending)
    "Blackrock MoveAgain":    2,  # Same array hardware as NeuroPort; MoveAgain BDD pending PMA
    "Precision Layer 7":      3,  # Investigational implantable BCI (IDE pathway)
    "Paradromics Connexus":   3,  # Breakthrough Device Designation 2023 (implantable)
    "BrainGate System":       3,  # IDE (investigational implantable BCI, Blackrock-based)
    "Natus Xltek":            2,  # 510(k) K200878, product code GWQ
    "g.tec g.Nautilus":       2,  # g.tec FDA cleared (K060803 for g.USBamp family); GWL
    "BrainCo Focus 1":        1,  # Not cleared (consumer education device)
    "Emotiv EPOC X":          1,  # Not cleared (consumer/research)
    "NeuroSky MindWave":      1,  # Not cleared (consumer/toy)
    "Muse 2":                 1,  # Not cleared (wellness, general wellness guidance)
    "OpenBCI Cyton":          1,  # Not cleared (open-source research)
    "Kernel Flow":            1,  # Not cleared (research, laser Class 2 only)
    "Meta Neural Interface":  1,  # Not cleared (research prototype, consumer target)
    "Neurosity Crown":        1,  # Not cleared (consumer/developer focus device)
    "Nihon Kohden Neurofax":  2,  # 510(k) cleared clinical EEG system
    "Cognixion ONE":          2,  # 510(k) cleared (AR+EEG assistive device)
    "Cortera Surface Array":  3,  # Investigational implantable (IDE pathway)
}


def spearman_rank_correlation(x, y):
    """Compute Spearman's rank correlation coefficient."""
    n = len(x)
    if n < 3:
        return 0.0, 1.0

    # Rank with average ties
    def rank(vals):
        indexed = sorted(enumerate(vals), key=lambda p: p[1])
        ranks = [0.0] * n
        i = 0
        while i < n:
            j = i
            while j < n - 1 and indexed[j + 1][1] == indexed[j][1]:
                j += 1
            avg_rank = (i + j) / 2.0 + 1.0
            for k in range(i, j + 1):
                ranks[indexed[k][0]] = avg_rank
            i = j + 1
        return ranks

    rx = rank(x)
    ry = rank(y)

    # Pearson on ranks
    mean_rx = sum(rx) / n
    mean_ry = sum(ry) / n
    num = sum((a - mean_rx) * (b - mean_ry) for a, b in zip(rx, ry))
    den_x = math.sqrt(sum((a - mean_rx) ** 2 for a in rx))
    den_y = math.sqrt(sum((b - mean_ry) ** 2 for b in ry))
    if den_x * den_y == 0:
        return 0.0, 1.0

    rho = num / (den_x * den_y)

    # t-test for significance
    if abs(rho) >= 1.0:
        p = 0.0
    else:
        t_stat = rho * math.sqrt((n - 2) / (1 - rho ** 2))
        # Two-tailed p-value approximation (Student's t, n-2 df)
        df = n - 2
        p = 2 * t_distribution_sf(abs(t_stat), df)

    return rho, p


def t_distribution_sf(t, df):
    """Survival function for t-distribution (approximate using normal for df>30,
    otherwise use regularized incomplete beta)."""
    # Use the relationship: p = I_x(df/2, 1/2) / 2 where x = df/(df+t^2)
    x = df / (df + t * t)
    return 0.5 * regularized_incomplete_beta(x, df / 2.0, 0.5)


def regularized_incomplete_beta(x, a, b, n_iter=200):
    """Regularized incomplete beta function via continued fraction (Lentz's method)."""
    if x <= 0:
        return 0.0
    if x >= 1:
        return 1.0

    # Use continued fraction
    lbeta = math.lgamma(a) + math.lgamma(b) - math.lgamma(a + b)
    front = math.exp(a * math.log(x) + b * math.log(1 - x) - lbeta) / a

    # Lentz's continued fraction
    f = 1.0
    c = 1.0
    d = 1.0 - (a + b) * x / (a + 1)
    if abs(d) < 1e-30:
        d = 1e-30
    d = 1.0 / d
    f = d

    for m in range(1, n_iter + 1):
        # Even step
        numerator = m * (b - m) * x / ((a + 2 * m - 1) * (a + 2 * m))
        d = 1.0 + numerator * d
        if abs(d) < 1e-30:
            d = 1e-30
        d = 1.0 / d
        c = 1.0 + numerator / c
        if abs(c) < 1e-30:
            c = 1e-30
        f *= d * c

        # Odd step
        numerator = -(a + m) * (a + b + m) * x / ((a + 2 * m) * (a + 2 * m + 1))
        d = 1.0 + numerator * d
        if abs(d) < 1e-30:
            d = 1e-30
        d = 1.0 / d
        c = 1.0 + numerator / c
        if abs(c) < 1e-30:
            c = 1e-30
        delta = d * c
        f *= delta

        if abs(delta - 1.0) < 1e-10:
            break

    return front * f


def point_biserial(x_binary, y_continuous):
    """Point-biserial correlation for binary x vs continuous y."""
    g0 = [y for xv, y in zip(x_binary, y_continuous) if xv == 0]
    g1 = [y for xv, y in zip(x_binary, y_continuous) if xv == 1]
    n0, n1 = len(g0), len(g1)
    n = n0 + n1
    if n0 == 0 or n1 == 0:
        return 0.0, 1.0
    m0 = sum(g0) / n0
    m1 = sum(g1) / n1
    all_vals = g0 + g1
    mean_all = sum(all_vals) / n
    sd = math.sqrt(sum((v - mean_all) ** 2 for v in all_vals) / n)
    if sd == 0:
        return 0.0, 1.0
    rpb = (m1 - m0) / sd * math.sqrt(n0 * n1 / (n * n))
    # t-test
    if abs(rpb) >= 1.0:
        t_stat = float('inf')
    else:
        t_stat = rpb * math.sqrt((n - 2) / (1 - rpb ** 2))
    p = 2 * t_distribution_sf(abs(t_stat), n - 2)
    return rpb, p


# ============================================================================
# TEST 1: FDA CLASS CORRELATION
# ============================================================================

def test_fda_correlation():
    print("=" * 80)
    print("TEST 1: FDA CLASS EXTERNAL CRITERION VALIDATION")
    print("=" * 80)
    print()

    # Compute NS scores
    results = []
    for d in DEVICES:
        name = d["name"]
        techs = d["techniques"]
        if isinstance(techs, str) and techs.startswith("SAME_AS:"):
            ref = techs.split(":")[1]
            for dd in DEVICES:
                if dd["name"] == ref:
                    techs = dd["techniques"]
                    break
        r = compute_device_score(name, techs, d["type"], d["purpose"])
        fda = FDA_CLASS.get(name)
        if fda is not None:
            results.append({
                "name": name,
                "ns": r["overall_score"],
                "fda_class": fda,
                "type": d["type"],
            })

    # Sort by NS score descending
    results.sort(key=lambda x: x["ns"], reverse=True)

    print(f"{'Device':<30} {'NS':>6} {'FDA':>5} {'Type':<15}")
    print("-" * 60)
    for r in results:
        print(f"{r['name']:<30} {r['ns']:>6.2f} {r['fda_class']:>5} {r['type']:<15}")

    # Spearman correlation: NS vs FDA class
    ns_scores = [r["ns"] for r in results]
    fda_classes = [r["fda_class"] for r in results]

    rho, p = spearman_rank_correlation(ns_scores, fda_classes)
    print(f"\n--- Spearman ρ (NS vs FDA Class) ---")
    print(f"ρ = {rho:.4f}")
    print(f"p = {p:.6f}")
    print(f"N = {len(results)}")
    print(f"Interpretation: {'SIGNIFICANT' if p < 0.05 else 'NOT SIGNIFICANT'} (α=0.05)")
    if rho > 0.5:
        print(f"Effect: STRONG positive correlation (higher NS → higher FDA class)")
    elif rho > 0.3:
        print(f"Effect: MODERATE positive correlation")
    elif rho > 0.1:
        print(f"Effect: WEAK positive correlation")
    else:
        print(f"Effect: NEGLIGIBLE correlation")

    # Additional: correlation by invasiveness tier (ordinal: non-inv=0, semi=1, invasive=2)
    inv_map = {"non_invasive": 0, "semi_invasive": 1, "invasive": 2}
    inv_scores = [inv_map.get(r["type"], 0) for r in results]
    rho_inv, p_inv = spearman_rank_correlation(ns_scores, inv_scores)
    print(f"\n--- Spearman ρ (NS vs Invasiveness Ordinal) ---")
    print(f"ρ = {rho_inv:.4f}")
    print(f"p = {p_inv:.6f}")
    print(f"Interpretation: {'SIGNIFICANT' if p_inv < 0.05 else 'NOT SIGNIFICANT'}")

    # FDA class means
    print(f"\n--- Mean NS by FDA Class ---")
    for cls in [1, 2, 3]:
        scores = [r["ns"] for r in results if r["fda_class"] == cls]
        if scores:
            print(f"Class {cls}: mean={sum(scores)/len(scores):.2f}, n={len(scores)}, range=[{min(scores):.2f}, {max(scores):.2f}]")

    # Monotonicity check
    means = {}
    for cls in [1, 2, 3]:
        scores = [r["ns"] for r in results if r["fda_class"] == cls]
        if scores:
            means[cls] = sum(scores) / len(scores)
    if 1 in means and 2 in means and 3 in means:
        monotonic = means[1] < means[2] < means[3]
        print(f"\nMonotonicity (Class I < II < III): {'✓ YES' if monotonic else '✗ NO'}")
        print(f"  Class I mean ({means[1]:.2f}) < Class II mean ({means[2]:.2f}) < Class III mean ({means[3]:.2f})")

    # Kruskal-Wallis H test (non-parametric one-way ANOVA)
    groups = {cls: [r["ns"] for r in results if r["fda_class"] == cls] for cls in [1, 2, 3]}
    H, p_kw = kruskal_wallis(groups)
    print(f"\n--- Kruskal-Wallis H Test (3 FDA classes) ---")
    print(f"H = {H:.4f}")
    print(f"p = {p_kw:.6f}")
    print(f"Interpretation: {'SIGNIFICANT' if p_kw < 0.05 else 'NOT SIGNIFICANT'} group differences")

    return rho, p, rho_inv, p_inv, results


def kruskal_wallis(groups):
    """Kruskal-Wallis H test for k groups."""
    # Pool and rank all values
    all_vals = []
    for key in sorted(groups.keys()):
        for v in groups[key]:
            all_vals.append((v, key))

    n = len(all_vals)
    if n < 3:
        return 0.0, 1.0

    # Rank
    sorted_vals = sorted(range(n), key=lambda i: all_vals[i][0])
    ranks = [0.0] * n
    i = 0
    while i < n:
        j = i
        while j < n - 1 and all_vals[sorted_vals[j + 1]][0] == all_vals[sorted_vals[j]][0]:
            j += 1
        avg_rank = (i + j) / 2.0 + 1.0
        for k in range(i, j + 1):
            ranks[sorted_vals[k]] = avg_rank
        i = j + 1

    # Group rank sums
    group_ranks = {}
    group_ns = {}
    for idx, (val, key) in enumerate(all_vals):
        group_ranks.setdefault(key, []).append(ranks[idx])
        group_ns[key] = group_ns.get(key, 0) + 1

    # H statistic
    mean_rank = (n + 1) / 2.0
    H = 0.0
    for key in group_ranks:
        ni = len(group_ranks[key])
        ri_mean = sum(group_ranks[key]) / ni
        H += ni * (ri_mean - mean_rank) ** 2
    H = 12.0 / (n * (n + 1)) * H

    # Chi-square approximation (df = k-1)
    k = len(groups)
    df = k - 1
    # p-value from chi-square (approximate)
    p = chi2_sf(H, df)

    return H, p


def chi2_sf(x, df):
    """Survival function for chi-square distribution."""
    if x <= 0:
        return 1.0
    # Using regularized incomplete gamma
    return 1.0 - regularized_gamma(df / 2.0, x / 2.0)


def regularized_gamma(a, x, n_iter=200):
    """Lower regularized incomplete gamma function P(a, x)."""
    if x < 0:
        return 0.0
    if x == 0:
        return 0.0

    if x < a + 1:
        # Series expansion
        s = 1.0 / a
        term = 1.0 / a
        for n in range(1, n_iter):
            term *= x / (a + n)
            s += term
            if abs(term) < 1e-10 * abs(s):
                break
        return s * math.exp(-x + a * math.log(x) - math.lgamma(a))
    else:
        # Continued fraction
        f = 1.0
        b0 = x + 1 - a
        c = 1e30
        d = 1.0 / b0 if abs(b0) > 1e-30 else 1e30
        f = d
        for n in range(1, n_iter):
            an = -n * (n - a)
            bn = x + 2 * n + 1 - a
            d = bn + an * d
            if abs(d) < 1e-30:
                d = 1e-30
            d = 1.0 / d
            c = bn + an / c
            if abs(c) < 1e-30:
                c = 1e-30
            delta = d * c
            f *= delta
            if abs(delta - 1.0) < 1e-10:
                break
        return 1.0 - f * math.exp(-x + a * math.log(x) - math.lgamma(a))


# ============================================================================
# TEST 2: MONTE CARLO UNCERTAINTY QUANTIFICATION
# ============================================================================

def beta_params_from_point(value, uncertainty=0.15):
    """Generate Beta distribution α, β from a point estimate and uncertainty."""
    # Map value to [0,1] range (assumes input already normalized or we normalize)
    mu = max(0.01, min(0.99, value))
    # variance based on uncertainty level
    var = (uncertainty * mu * (1 - mu)) ** 2
    var = min(var, mu * (1 - mu) - 0.001)  # ensure valid
    if var <= 0:
        var = 0.001

    alpha = mu * (mu * (1 - mu) / var - 1)
    beta = (1 - mu) * (mu * (1 - mu) / var - 1)
    alpha = max(alpha, 0.5)
    beta = max(beta, 0.5)
    return alpha, beta


def beta_sample(alpha, beta_param):
    """Sample from Beta distribution using Jöhnk's algorithm."""
    while True:
        u1 = random.random()
        u2 = random.random()
        x = u1 ** (1.0 / alpha)
        y = u2 ** (1.0 / beta_param)
        if x + y <= 1.0:
            return x / (x + y)


def gamma_sample(shape, scale=1.0):
    """Sample from Gamma distribution (Marsaglia and Tsang's method)."""
    if shape < 1:
        return gamma_sample(shape + 1, scale) * (random.random() ** (1.0 / shape))
    d = shape - 1.0 / 3.0
    c = 1.0 / math.sqrt(9.0 * d)
    while True:
        while True:
            x = random.gauss(0, 1)
            v = (1 + c * x) ** 3
            if v > 0:
                break
        u = random.random()
        if u < 1 - 0.0331 * x ** 4:
            return d * v * scale
        if math.log(u) < 0.5 * x ** 2 + d * (1 - v + math.log(v)):
            return d * v * scale


def beta_sample_proper(alpha, beta_param):
    """Sample from Beta using Gamma samples (more numerically stable)."""
    x = gamma_sample(alpha)
    y = gamma_sample(beta_param)
    if x + y == 0:
        return 0.5
    return x / (x + y)


def monte_carlo_device(device, n_samples=10000, uncertainty=0.15):
    """Run Monte Carlo for one device, perturbing NISS, CCI, DSM, P_realize."""
    techs = device["techniques"]
    if isinstance(techs, str) and techs.startswith("SAME_AS:"):
        ref = techs.split(":")[1]
        for dd in DEVICES:
            if dd["name"] == ref:
                techs = dd["techniques"]
                break

    random.seed(42)  # Reproducible
    samples = []

    for _ in range(n_samples):
        perturbed_techs = []
        for t in techs:
            # Perturb NISS (bounded 0-10)
            niss_mu = t["niss"] / 10.0
            a, b = beta_params_from_point(niss_mu, uncertainty)
            niss_new = beta_sample_proper(a, b) * 10.0

            # Perturb CCI (bounded 0-3)
            cci_mu = min(t["cci"] / 3.0, 0.99)
            a, b = beta_params_from_point(max(cci_mu, 0.01), uncertainty)
            cci_new = beta_sample_proper(a, b) * 3.0

            # Perturb P_realize (within tier bounds)
            tier = t["physics_tier"]
            if isinstance(tier, str) and tier.upper() == "X":
                p_base = 0.95
            else:
                p_base = ns_mod.P_REALIZE.get(int(tier) if isinstance(tier, str) else tier, 0.95)
            a, b = beta_params_from_point(p_base, uncertainty)
            p_new = beta_sample_proper(a, b)

            # DSM severity: sample within adjacent categories
            sev = t["severity"]
            sev_levels = ["low", "medium", "high", "critical"]
            sev_idx = sev_levels.index(sev)
            # 80% same, 10% adjacent each direction
            r = random.random()
            if r < 0.80:
                sev_new = sev
            elif r < 0.90:
                sev_new = sev_levels[max(0, sev_idx - 1)]
            else:
                sev_new = sev_levels[min(3, sev_idx + 1)]

            perturbed_techs.append({
                "id": t["id"],
                "niss": niss_new,
                "cci": cci_new,
                "severity": sev_new,
                "rights": t["rights"],
                "physics_tier": tier,
                "_p_realize_override": p_new,
            })

        # Compute score with perturbed techniques
        # We need to temporarily override P_REALIZE to inject per-technique values
        # Instead, compute manually
        from collections import defaultdict

        RIGHTS = ["CL", "MI", "MP", "PC"]
        right_risks = defaultdict(list)

        for pt in perturbed_techs:
            nn = ns_mod.niss_norm(pt["niss"])
            cn = ns_mod.cci_norm(pt["cci"])
            dn = ns_mod.dsm_norm(pt["severity"])
            base = ns_mod.bns(nn, cn, dn)
            risk = base * pt["_p_realize_override"]

            for right in pt["rights"]:
                if right in RIGHTS:
                    right_risks[right].append(risk)

        right_scores = {}
        for right in RIGHTS:
            risks = right_risks[right]
            rs = ns_mod.owa_aggregate(risks) if risks else 0.0
            right_scores[right] = rs * 10

        ea = ns_mod.ea_score(device["type"], device["purpose"]) * 10
        right_scores["EA"] = ea  # EA not perturbed (system-level constant)

        all_scores = [right_scores[r] for r in ["CL", "MI", "MP", "PC", "EA"]]
        ns_score = ns_mod.geometric_mean(all_scores)
        samples.append(ns_score)

    return samples


def test_monte_carlo():
    print("\n" + "=" * 80)
    print("TEST 2: MONTE CARLO UNCERTAINTY QUANTIFICATION (10K samples)")
    print("=" * 80)
    print()

    # Select representative devices (top, middle, bottom + BrainCo)
    target_devices = [
        "Neuralink N1", "INBRAIN Graphene BCI", "Synchron Stentrode",
        "Natus Xltek EEG", "BrainCo Focus 1", "Emotiv EPOC X",
        "Muse 2", "NeuroSky MindWave"
    ]

    print(f"{'Device':<28} {'Point':>6} {'MC Mean':>7} {'MC Med':>7} {'95% CI':>16} {'Width':>6} {'CV%':>5}")
    print("-" * 80)

    all_results = {}
    for d in DEVICES:
        if d["name"] not in target_devices:
            continue
        samples = monte_carlo_device(d, n_samples=10000)
        mean_s = sum(samples) / len(samples)
        sorted_s = sorted(samples)
        median_s = sorted_s[len(sorted_s) // 2]
        ci_lo = sorted_s[int(0.025 * len(sorted_s))]
        ci_hi = sorted_s[int(0.975 * len(sorted_s))]
        std_s = math.sqrt(sum((x - mean_s) ** 2 for x in samples) / len(samples))
        cv = (std_s / mean_s * 100) if mean_s > 0 else 0

        # Point estimate
        techs = d["techniques"]
        if isinstance(techs, str) and techs.startswith("SAME_AS:"):
            ref = techs.split(":")[1]
            for dd in DEVICES:
                if dd["name"] == ref:
                    techs = dd["techniques"]
                    break
        point = compute_device_score(d["name"], techs, d["type"], d["purpose"])

        print(f"{d['name']:<28} {point['overall_score']:>6.2f} {mean_s:>7.2f} {median_s:>7.2f} [{ci_lo:>5.2f}, {ci_hi:>5.2f}] {ci_hi-ci_lo:>6.2f} {cv:>5.1f}")

        all_results[d["name"]] = {
            "point": point["overall_score"],
            "mc_mean": round(mean_s, 2),
            "mc_median": round(median_s, 2),
            "ci_95": [round(ci_lo, 2), round(ci_hi, 2)],
            "ci_width": round(ci_hi - ci_lo, 2),
            "cv_pct": round(cv, 1),
            "std": round(std_s, 3),
        }

    # Check: do CIs overlap between severity bands?
    print(f"\n--- Severity Band Discrimination Under Uncertainty ---")
    n1 = all_results.get("Neuralink N1", {})
    muse = all_results.get("Muse 2", {})
    neurosky = all_results.get("NeuroSky MindWave", {})
    if n1 and muse:
        overlap = n1["ci_95"][0] < muse["ci_95"][1] and muse["ci_95"][0] < n1["ci_95"][1]
        print(f"N1 [{n1['ci_95'][0]}, {n1['ci_95'][1]}] vs Muse [{muse['ci_95'][0]}, {muse['ci_95'][1]}]: {'OVERLAP' if overlap else 'SEPARATED'}")
    if n1 and neurosky:
        overlap = n1["ci_95"][0] < neurosky["ci_95"][1] and neurosky["ci_95"][0] < n1["ci_95"][1]
        print(f"N1 [{n1['ci_95'][0]}, {n1['ci_95'][1]}] vs NeuroSky [{neurosky['ci_95'][0]}, {neurosky['ci_95'][1]}]: {'OVERLAP' if overlap else 'SEPARATED'}")

    return all_results


# ============================================================================
# TEST 3: VARIANCE DECOMPOSITION (Sobol-like first-order indices)
# ============================================================================

def test_variance_decomposition():
    """Estimate first-order sensitivity by fixing each parameter and measuring variance reduction."""
    print("\n" + "=" * 80)
    print("TEST 3: VARIANCE DECOMPOSITION (First-Order Sensitivity)")
    print("=" * 80)
    print()

    # Use Neuralink N1 as the reference device
    device = None
    for d in DEVICES:
        if d["name"] == "Neuralink N1":
            device = d
            break

    n_samples = 5000
    random.seed(42)
    uncertainty = 0.15

    techs = device["techniques"]

    # Baseline: all parameters vary
    baseline_samples = monte_carlo_device(device, n_samples=n_samples, uncertainty=uncertainty)
    baseline_var = sum((x - sum(baseline_samples)/len(baseline_samples))**2 for x in baseline_samples) / len(baseline_samples)

    params = ["NISS", "CCI", "DSM", "P_realize"]
    print(f"Baseline variance (all vary): {baseline_var:.6f}")
    print(f"Baseline std: {math.sqrt(baseline_var):.4f}")
    print()

    # For each parameter, fix it at its point value and vary the rest
    print(f"{'Parameter Fixed':<18} {'Residual Var':>12} {'Var Reduction':>13} {'S_i (1st order)':>15}")
    print("-" * 62)

    for fix_param in params:
        random.seed(42)
        fixed_samples = []
        for _ in range(n_samples):
            perturbed_techs = []
            for t in techs:
                niss_new = t["niss"]
                cci_new = t["cci"]
                sev_new = t["severity"]
                tier = t["physics_tier"]
                p_base = ns_mod.P_REALIZE.get("X" if (isinstance(tier, str) and tier.upper() == "X") else (int(tier) if isinstance(tier, str) else tier), 0.95)
                p_new = p_base

                if fix_param != "NISS":
                    niss_mu = t["niss"] / 10.0
                    a, b = beta_params_from_point(niss_mu, uncertainty)
                    niss_new = beta_sample_proper(a, b) * 10.0

                if fix_param != "CCI":
                    cci_mu = min(t["cci"] / 3.0, 0.99)
                    a, b = beta_params_from_point(max(cci_mu, 0.01), uncertainty)
                    cci_new = beta_sample_proper(a, b) * 3.0

                if fix_param != "DSM":
                    sev_levels = ["low", "medium", "high", "critical"]
                    sev_idx = sev_levels.index(t["severity"])
                    r = random.random()
                    if r < 0.80:
                        sev_new = t["severity"]
                    elif r < 0.90:
                        sev_new = sev_levels[max(0, sev_idx - 1)]
                    else:
                        sev_new = sev_levels[min(3, sev_idx + 1)]

                if fix_param != "P_realize":
                    a, b = beta_params_from_point(p_base, uncertainty)
                    p_new = beta_sample_proper(a, b)

                perturbed_techs.append({
                    "id": t["id"], "niss": niss_new, "cci": cci_new,
                    "severity": sev_new, "rights": t["rights"],
                    "physics_tier": tier, "_p_realize_override": p_new,
                })

            from collections import defaultdict
            RIGHTS = ["CL", "MI", "MP", "PC"]
            right_risks = defaultdict(list)
            for pt in perturbed_techs:
                nn = ns_mod.niss_norm(pt["niss"])
                cn = ns_mod.cci_norm(pt["cci"])
                dn = ns_mod.dsm_norm(pt["severity"])
                base = ns_mod.bns(nn, cn, dn)
                risk = base * pt["_p_realize_override"]
                for right in pt["rights"]:
                    if right in RIGHTS:
                        right_risks[right].append(risk)
            right_scores = {}
            for right in RIGHTS:
                risks = right_risks[right]
                rs = ns_mod.owa_aggregate(risks) if risks else 0.0
                right_scores[right] = rs * 10
            ea = ns_mod.ea_score(device["type"], device["purpose"]) * 10
            right_scores["EA"] = ea
            all_s = [right_scores[r] for r in ["CL", "MI", "MP", "PC", "EA"]]
            ns_score = ns_mod.geometric_mean(all_s)
            fixed_samples.append(ns_score)

        fixed_var = sum((x - sum(fixed_samples)/len(fixed_samples))**2 for x in fixed_samples) / len(fixed_samples)
        var_reduction = baseline_var - fixed_var
        si = var_reduction / baseline_var if baseline_var > 0 else 0

        print(f"{fix_param:<18} {fixed_var:>12.6f} {var_reduction:>13.6f} {si:>15.3f}")

    print()
    print("S_i interpretation: proportion of total variance explained by parameter.")
    print("Higher S_i = more influential parameter. Sum may exceed 1 (interactions).")


# ============================================================================
# MAIN
# ============================================================================

if __name__ == "__main__":
    rho, p, rho_inv, p_inv, results = test_fda_correlation()
    mc_results = test_monte_carlo()
    test_variance_decomposition()

    print("\n" + "=" * 80)
    print("SUMMARY — VALIDATION ENHANCEMENT")
    print("=" * 80)
    print(f"\n1. FDA CLASS CORRELATION (External Criterion):")
    print(f"   Spearman ρ = {rho:.4f}, p = {p:.6f} {'✓ SIGNIFICANT' if p < 0.05 else '✗ NOT SIGNIFICANT'}")
    print(f"   Invasiveness ρ = {rho_inv:.4f}, p = {p_inv:.6f} {'✓ SIGNIFICANT' if p_inv < 0.05 else '✗ NOT SIGNIFICANT'}")
    print(f"\n2. MONTE CARLO UNCERTAINTY (10K samples, 15% perturbation):")
    n1_mc = mc_results.get("Neuralink N1", {})
    if n1_mc:
        print(f"   N1: {n1_mc['point']} point → [{n1_mc['ci_95'][0]}, {n1_mc['ci_95'][1]}] 95% CI (width={n1_mc['ci_width']})")
        print(f"   Coefficient of Variation: {n1_mc['cv_pct']}%")
    print(f"\n3. VARIANCE DECOMPOSITION: See table above for first-order Sobol indices.")
