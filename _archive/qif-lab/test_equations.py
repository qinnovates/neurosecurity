"""
QIF Equation Test Suite

Runs all predefined scenarios through both QI equation candidates.
Verifies:
- Coherence metric produces expected ranges
- Both candidates agree on security classification
- Attack scenarios score lower than baselines
- Decoherence correctly gates quantum terms
- Known inputs produce known outputs (deterministic check)
"""

import sys
import numpy as np
sys.path.insert(0, '.')

from src.qif_equations import (
    phase_variance, transport_variance, gain_variance,
    coherence_metric, coherence_decision, decoherence_factor,
    quantum_gate, tunneling_coefficient, von_neumann_entropy,
    qi_candidate1, qi_candidate2, full_qi_assessment,
    QICandidate1Params, QICandidate2Params,
)
from src.synthetic_data import generate_custom_signals, SCENARIOS


def test_coherence_metric_bounds():
    """Cₛ should always be in [0, 1]."""
    print("Test: Coherence metric bounds...")

    # Perfect signals → Cₛ near 1
    cs_perfect = coherence_metric(0.0, 0.0, 0.0)
    assert cs_perfect == 1.0, f"Perfect coherence should be 1.0, got {cs_perfect}"

    # Terrible signals → Cₛ near 0
    cs_terrible = coherence_metric(5.0, 5.0, 5.0)
    assert cs_terrible < 0.01, f"Terrible coherence should be ~0, got {cs_terrible}"

    # Mid-range
    cs_mid = coherence_metric(0.3, 0.3, 0.3)
    assert 0.3 < cs_mid < 0.5, f"Mid-range coherence unexpected: {cs_mid}"

    print(f"  Perfect: {cs_perfect:.4f}, Mid: {cs_mid:.4f}, Terrible: {cs_terrible:.6f}")
    print("  PASSED")


def test_decoherence_spectrum():
    """Decoherence factor should smoothly transition from 0 to 1."""
    print("Test: Decoherence spectrum...")

    tau_d = 1e-5  # 10 microseconds

    # t << tau_D: fully quantum
    gd_early = decoherence_factor(1e-8, tau_d)
    assert gd_early < 0.01, f"Early decoherence should be ~0, got {gd_early}"

    # t ≈ tau_D: hybrid
    gd_mid = decoherence_factor(tau_d, tau_d)
    expected_mid = 1 - np.exp(-1)  # ≈ 0.632
    assert abs(gd_mid - expected_mid) < 0.001, f"Mid decoherence should be ~0.632, got {gd_mid}"

    # t >> tau_D: fully classical
    gd_late = decoherence_factor(1e-2, tau_d)
    assert gd_late > 0.99, f"Late decoherence should be ~1, got {gd_late}"

    gate_early = quantum_gate(1e-8, tau_d)
    gate_late = quantum_gate(1e-2, tau_d)
    print(f"  Gate at t<<τ_D: {gate_early:.4f}, t≈τ_D: {1-gd_mid:.4f}, t>>τ_D: {gate_late:.6f}")
    print("  PASSED")


def test_tunneling_coefficient():
    """Tunneling should decrease exponentially with barrier width."""
    print("Test: Tunneling coefficient...")

    # Narrow barrier: high tunneling
    t_narrow = tunneling_coefficient(V0=1.0, E=0.5, d=1e-10)

    # Wide barrier: low tunneling
    t_wide = tunneling_coefficient(V0=1.0, E=0.5, d=1e-9)

    assert t_narrow > t_wide, "Narrower barrier should have higher tunneling"
    assert 0 < t_wide < t_narrow < 1, "Tunneling should be between 0 and 1"

    # No barrier: T = 1
    t_no_barrier = tunneling_coefficient(V0=0.5, E=1.0, d=1e-9)
    assert t_no_barrier == 1.0, "No barrier should give T = 1.0"

    print(f"  Narrow (1Å): {t_narrow:.6f}, Wide (1nm): {t_wide:.10f}")
    print("  PASSED")


def test_von_neumann_entropy():
    """Von Neumann entropy: 0 for pure state, ln(d) for maximally mixed."""
    print("Test: Von Neumann entropy...")

    # Pure state: one eigenvalue = 1, rest = 0
    s_pure = von_neumann_entropy(np.array([1.0, 0.0]))
    assert abs(s_pure) < 1e-10, f"Pure state entropy should be 0, got {s_pure}"

    # Maximally mixed 2-state: S = ln(2)
    s_mixed = von_neumann_entropy(np.array([0.5, 0.5]))
    assert abs(s_mixed - np.log(2)) < 1e-10, f"Max mixed entropy should be ln(2), got {s_mixed}"

    # Partially mixed
    s_partial = von_neumann_entropy(np.array([0.7, 0.3]))
    assert 0 < s_partial < np.log(2), f"Partial entropy should be between 0 and ln(2)"

    print(f"  Pure: {s_pure:.6f}, Partial: {s_partial:.4f}, Max mixed: {s_mixed:.4f} (ln2={np.log(2):.4f})")
    print("  PASSED")


def test_candidate_agreement():
    """Both candidates should agree on security classification direction."""
    print("Test: Candidate agreement on direction...")

    # High security scenario
    qi_c1_high = qi_candidate1(
        c_class=0.9, qi_indeterminacy=0.5, q_entangle=0.3, q_tunnel=0.05,
        t=1e-7, params=QICandidate1Params(tau_d=1e-5)
    )
    qi_c2_high = qi_candidate2(
        c_class=0.9, svn=0.1, phi_tunnel=0.05, e_entangle=0.5,
    )

    # Low security scenario
    qi_c1_low = qi_candidate1(
        c_class=0.2, qi_indeterminacy=0.1, q_entangle=0.05, q_tunnel=0.5,
        t=1e-2, params=QICandidate1Params(tau_d=1e-5)
    )
    qi_c2_low = qi_candidate2(
        c_class=0.2, svn=0.8, phi_tunnel=0.5, e_entangle=0.05,
    )

    assert qi_c1_high > qi_c1_low, "C1: High security should score higher"
    assert qi_c2_high > qi_c2_low, "C2: High security should score higher"

    print(f"  C1 — High: {qi_c1_high:.4f}, Low: {qi_c1_low:.4f}")
    print(f"  C2 — High: {qi_c2_high:.4f}, Low: {qi_c2_low:.4f}")
    print("  PASSED")


def test_scenarios():
    """Run all predefined scenarios and verify attack detection."""
    print("\nTest: Predefined scenarios...")
    print(f"{'Scenario':<30} {'Cₛ':>8} {'QI(C1)':>8} {'QI(C2)':>8} {'Decision':<20}")
    print("-" * 80)

    results = {}
    for name, scenario in SCENARIOS.items():
        data = generate_custom_signals(scenario)

        result = full_qi_assessment(
            phases=data['phases'],
            transport_probs=data['transport_probs'],
            amplitudes=data['amplitudes'],
            t=1e-6,
            tau_d=1e-5,
        )

        results[name] = result
        print(
            f"  {scenario.name:<28} "
            f"{result.coherence:>8.4f} "
            f"{result.qi_score_c1:>8.4f} "
            f"{result.qi_score_c2:>8.4f} "
            f"{result.decision:<20}"
        )

    # Verify: healthy > noisy > degraded
    assert results["healthy_baseline"].coherence > results["noisy_but_safe"].coherence
    assert results["noisy_but_safe"].coherence > results["degraded_signal"].coherence

    # Verify: attacks score lower than their non-attack equivalent
    assert results["signal_injection_attack"].coherence < results["healthy_baseline"].coherence
    assert results["phase_disruption_attack"].coherence < results["healthy_baseline"].coherence

    print("  ALL SCENARIO CHECKS PASSED")


def test_decoherence_gating():
    """Quantum terms should diminish as decoherence increases."""
    print("\nTest: Decoherence gating over time...")

    tau_d = 1e-5
    times = [1e-8, 1e-6, 1e-5, 1e-4, 1e-2]

    print(f"  {'Time (s)':<12} {'Gate':>8} {'QI(C1)':>8} {'Quantum contrib':>16}")

    c1_scores = []
    for t in times:
        gate = quantum_gate(t, tau_d)
        qi_score = qi_candidate1(
            c_class=0.8, qi_indeterminacy=0.5, q_entangle=0.3, q_tunnel=0.1,
            t=t, params=QICandidate1Params(tau_d=tau_d)
        )
        # Classical-only score for comparison
        qi_classical_only = qi_candidate1(
            c_class=0.8, qi_indeterminacy=0.5, q_entangle=0.3, q_tunnel=0.1,
            t=t, params=QICandidate1Params(tau_d=1e-15)  # Instant decoherence
        )
        quantum_contrib = qi_score - qi_classical_only

        c1_scores.append(qi_score)
        print(f"  {t:<12.1e} {gate:>8.4f} {qi_score:>8.4f} {quantum_contrib:>16.4f}")

    # QI should decrease over time as quantum terms decohere
    for i in range(len(c1_scores) - 1):
        assert c1_scores[i] >= c1_scores[i + 1] - 0.001, \
            f"QI should decrease as decoherence increases"

    print("  PASSED")


def test_deterministic():
    """Same inputs must always produce same outputs (equation is deterministic)."""
    print("\nTest: Deterministic output (same inputs → same outputs)...")

    baseline_coherence = None
    for _ in range(10):
        result = full_qi_assessment(
            phases=np.array([0.01, -0.02, 0.03, 0.01, -0.01, 0.02, -0.03, 0.01]),
            transport_probs=np.array([0.95, 0.92, 0.94, 0.96, 0.93, 0.91, 0.95, 0.94]),
            amplitudes=np.array([1.01, 0.99, 1.02, 0.98, 1.01, 1.0, 0.99, 1.01]),
            t=1e-6,
            tau_d=1e-5,
        )
        if baseline_coherence is None:
            baseline_coherence = result.coherence
        else:
            assert result.coherence == baseline_coherence, \
                f"Coherence not deterministic across runs: {result.coherence} != {baseline_coherence}"

    # Run twice with exact same inputs
    r1 = full_qi_assessment(
        phases=np.array([0.1, -0.1, 0.05, -0.05]),
        transport_probs=np.array([0.9, 0.85, 0.92, 0.88]),
        amplitudes=np.array([1.0, 1.1, 0.9, 1.05]),
        t=1e-6, tau_d=1e-5,
    )
    r2 = full_qi_assessment(
        phases=np.array([0.1, -0.1, 0.05, -0.05]),
        transport_probs=np.array([0.9, 0.85, 0.92, 0.88]),
        amplitudes=np.array([1.0, 1.1, 0.9, 1.05]),
        t=1e-6, tau_d=1e-5,
    )

    assert r1.coherence == r2.coherence, "Coherence not deterministic"
    assert r1.qi_score_c1 == r2.qi_score_c1, "C1 not deterministic"
    assert r1.qi_score_c2 == r2.qi_score_c2, "C2 not deterministic"

    print(f"  Coherence: {r1.coherence:.6f} == {r2.coherence:.6f}")
    print(f"  C1: {r1.qi_score_c1:.6f} == {r2.qi_score_c1:.6f}")
    print(f"  C2: {r1.qi_score_c2:.6f} == {r2.qi_score_c2:.6f}")
    print("  PASSED")


if __name__ == "__main__":
    print("=" * 80)
    print("QIF EQUATION TEST SUITE")
    print("=" * 80)
    print()

    test_coherence_metric_bounds()
    print()
    test_decoherence_spectrum()
    print()
    test_tunneling_coefficient()
    print()
    test_von_neumann_entropy()
    print()
    test_candidate_agreement()
    test_scenarios()
    test_decoherence_gating()
    test_deterministic()

    print()
    print("=" * 80)
    print("ALL TESTS PASSED")
    print("=" * 80)
