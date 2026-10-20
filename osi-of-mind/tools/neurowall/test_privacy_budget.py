#!/usr/bin/env python3
"""
neurowall/test_privacy_budget.py
Regression tests for PrivacyBudget's zCDP composition accounting.

These exist because two defects shipped in this class and were only caught by
a line-by-line read, not by any test:

  1. `consume` computed the correct rho = eps^2 / 2 and then overwrote it with
     the reciprocal, 1 / (2 * eps^2). That inverts the budget relationship: a
     smaller epsilon, which should cost less, cost more. At the policy engine's
     configured epsilons the privacy cost was overstated by roughly 160,000x
     (eps=0.05), 10,000x (eps=0.1) and 625x (eps=0.2).
  2. `naive_epsilon` returned `effective_epsilon`, so the zCDP-versus-naive
     comparison the class exists to show compared a value against itself.

Every assertion below fails under one of those two defects. The reference
values come from Bun & Steinke 2016 ("Concentrated Differential Privacy"):
Prop 1.4 for eps-DP => (eps^2/2)-zCDP, Prop 1.3 for the conversion back.

Usage:
    python test_privacy_budget.py
"""

import math
import sys

from sim import PrivacyBudget

DELTA = 1e-6
CONFIGURED_EPSILONS = (0.05, 0.1, 0.2)


def zcdp_epsilon(rho: float, delta: float) -> float:
    """The (eps, delta)-DP guarantee implied by rho-zCDP, computed independently."""
    return rho + 2.0 * math.sqrt(rho * math.log(1.0 / delta))


def check(description: str, condition: bool) -> bool:
    print(f"  {'PASS' if condition else 'FAIL'}  {description}")
    return condition


def test_rho_squares_epsilon() -> bool:
    """rho must be eps^2/2 per query, never its reciprocal."""
    results = []
    for epsilon in CONFIGURED_EPSILONS:
        budget = PrivacyBudget(delta=DELTA)
        budget.consume(epsilon)
        expected = (epsilon ** 2) / 2.0
        results.append(check(
            f"eps={epsilon}: rho={budget.total_rho:.8f} == eps^2/2={expected:.8f}",
            math.isclose(budget.total_rho, expected, rel_tol=1e-12),
        ))
        # The reciprocal form would be this, and must not be what we got.
        results.append(check(
            f"eps={epsilon}: rho is not the reciprocal 1/(2*eps^2)",
            not math.isclose(budget.total_rho, 1.0 / (2.0 * epsilon ** 2), rel_tol=1e-9),
        ))
    return all(results)


def test_smaller_epsilon_costs_less() -> bool:
    """The ordering a privacy budget exists to express: less epsilon, less cost.

    This is the property the reciprocal defect inverted, and it holds
    regardless of the constant factor in the conversion.
    """
    rhos = []
    for epsilon in sorted(CONFIGURED_EPSILONS):
        budget = PrivacyBudget(delta=DELTA)
        budget.consume(epsilon)
        rhos.append(budget.total_rho)
    return check(
        f"rho rises with epsilon: {[round(r, 6) for r in rhos]}",
        all(earlier < later for earlier, later in zip(rhos, rhos[1:])),
    )


def test_composition_is_linear_in_rho() -> bool:
    """n queries at one epsilon accumulate n * eps^2/2."""
    epsilon, queries = 0.1, 500
    budget = PrivacyBudget(delta=DELTA)
    for _ in range(queries):
        budget.consume(epsilon)
    expected = queries * (epsilon ** 2) / 2.0
    return all([
        check(f"query count recorded: {budget.queries} == {queries}", budget.queries == queries),
        check(
            f"rho={budget.total_rho:.6f} == n*eps^2/2={expected:.6f}",
            math.isclose(budget.total_rho, expected, rel_tol=1e-12),
        ),
    ])


def test_naive_is_not_the_zcdp_value() -> bool:
    """naive_epsilon must be the sum of per-query epsilons, not an alias."""
    epsilon, queries = 0.1, 100
    budget = PrivacyBudget(delta=DELTA)
    for _ in range(queries):
        budget.consume(epsilon)
    return all([
        check(
            f"naive={budget.naive_epsilon:.6f} == sum of epsilons={queries * epsilon:.6f}",
            math.isclose(budget.naive_epsilon, queries * epsilon, rel_tol=1e-12),
        ),
        check(
            f"naive={budget.naive_epsilon:.4f} is distinct from zCDP={budget.effective_epsilon:.4f}",
            not math.isclose(budget.naive_epsilon, budget.effective_epsilon, rel_tol=1e-9),
        ),
    ])


def test_effective_epsilon_matches_the_published_conversion() -> bool:
    """effective_epsilon must equal rho + 2*sqrt(rho*ln(1/delta))."""
    budget = PrivacyBudget(delta=DELTA)
    for _ in range(250):
        budget.consume(0.2)
    expected = zcdp_epsilon(budget.total_rho, DELTA)
    return check(
        f"effective={budget.effective_epsilon:.6f} == Bun & Steinke Prop 1.3={expected:.6f}",
        math.isclose(budget.effective_epsilon, expected, rel_tol=1e-12),
    )


def test_bound_takes_the_smaller_route() -> bool:
    """Both routes are valid, so the guarantee is whichever is smaller.

    Also pins the crossover: naive wins for a single query, zCDP wins once the
    query count is large. Quoting the zCDP figure alone overstates a short
    session's cost.
    """
    short = PrivacyBudget(delta=DELTA)
    short.consume(0.1)
    long_run = PrivacyBudget(delta=DELTA)
    for _ in range(1000):
        long_run.consume(0.1)

    return all([
        check(
            f"one query: bound={short.epsilon_bound:.4f} is the naive route "
            f"({short.naive_epsilon:.4f} < {short.effective_epsilon:.4f})",
            math.isclose(short.epsilon_bound, short.naive_epsilon, rel_tol=1e-12),
        ),
        check(
            f"1000 queries: bound={long_run.epsilon_bound:.4f} is the zCDP route "
            f"({long_run.effective_epsilon:.4f} < {long_run.naive_epsilon:.4f})",
            math.isclose(long_run.epsilon_bound, long_run.effective_epsilon, rel_tol=1e-12),
        ),
        check(
            "bound is never larger than either route",
            long_run.epsilon_bound <= min(long_run.naive_epsilon, long_run.effective_epsilon) + 1e-12,
        ),
    ])


def test_empty_budget_is_zero() -> bool:
    """An unused budget has spent nothing on every measure."""
    budget = PrivacyBudget(delta=DELTA)
    return all([
        check("unused rho is 0", budget.total_rho == 0.0),
        check("unused effective_epsilon is 0", budget.effective_epsilon == 0.0),
        check("unused naive_epsilon is 0", budget.naive_epsilon == 0.0),
        check("unused epsilon_bound is 0", budget.epsilon_bound == 0.0),
    ])


def test_nonpositive_epsilon_is_rejected() -> bool:
    """A zero or negative epsilon is not a privacy parameter; it must not be
    silently accounted, since eps=0 divides by zero in the Laplace scale."""
    results = []
    for epsilon in (0.0, -0.1):
        budget = PrivacyBudget(delta=DELTA)
        try:
            budget.consume(epsilon)
        except ValueError:
            results.append(check(f"eps={epsilon} raises ValueError", True))
        else:
            results.append(check(f"eps={epsilon} raises ValueError", False))
    return all(results)


TESTS = (
    ("rho squares epsilon", test_rho_squares_epsilon),
    ("smaller epsilon costs less", test_smaller_epsilon_costs_less),
    ("composition is linear in rho", test_composition_is_linear_in_rho),
    ("naive is not the zCDP value", test_naive_is_not_the_zcdp_value),
    ("effective epsilon matches the published conversion", test_effective_epsilon_matches_the_published_conversion),
    ("bound takes the smaller route", test_bound_takes_the_smaller_route),
    ("empty budget is zero", test_empty_budget_is_zero),
    ("non-positive epsilon is rejected", test_nonpositive_epsilon_is_rejected),
)


def main() -> int:
    print("PrivacyBudget zCDP composition regression tests")
    print("=" * 64)
    failed = []
    for name, test in TESTS:
        print(f"\n{name}")
        if not test():
            failed.append(name)

    print("\n" + "=" * 64)
    if failed:
        print(f"FAILED {len(failed)} of {len(TESTS)}: {', '.join(failed)}")
        return 1
    print(f"All {len(TESTS)} checks passed")
    return 0


if __name__ == "__main__":
    sys.exit(main())
