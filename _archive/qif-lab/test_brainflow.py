"""Test BrainFlow synthetic board integration with QIF equations."""

import sys
import numpy as np
sys.path.insert(0, '.')

from src.synthetic_data import generate_brainflow_signals, brainflow_to_qi_inputs
from src.qif_equations import full_qi_assessment


def test_brainflow_pipeline():
    """End-to-end: BrainFlow synthetic → QI equation assessment."""
    print("Generating BrainFlow synthetic data (2 seconds)...")
    bf_data = generate_brainflow_signals(duration_sec=2.0, n_channels=8)

    print(f"  Channels: {bf_data['n_channels']}")
    print(f"  Samples: {bf_data['n_samples']}")
    print(f"  Sampling rate: {bf_data['sampling_rate']} Hz")
    print(f"  Duration: {bf_data['n_samples']/bf_data['sampling_rate']:.1f} s")

    # Convert to QI inputs
    qi_inputs = brainflow_to_qi_inputs(bf_data)

    print(f"\n  Phase values: {qi_inputs['phases'][:4]}...")
    print(f"  Amplitude values: {qi_inputs['amplitudes'][:4]}...")
    print(f"  Transport probs: {qi_inputs['transport_probs'][:4]}...")

    # Run QI assessment at different decoherence timescales
    print(f"\n  {'τ_D (s)':<14} {'Cₛ':>8} {'QI(C1)':>8} {'QI(C2)':>8} {'Gate':>8} {'Decision'}")
    print("  " + "-" * 70)

    for tau_d in [1e-13, 1e-5, 1e-1, 3600.0]:
        result = full_qi_assessment(
            phases=qi_inputs['phases'],
            transport_probs=qi_inputs['transport_probs'],
            amplitudes=qi_inputs['amplitudes'],
            t=1e-6,
            tau_d=tau_d,
        )
        label = {1e-13: "Tegmark", 1e-5: "Recent", 1e-1: "Extended", 3600.0: "Fisher"}[tau_d]
        print(
            f"  {tau_d:<10.0e} ({label:<8}) "
            f"{result.coherence:>8.4f} "
            f"{result.qi_score_c1:>8.4f} "
            f"{result.qi_score_c2:>8.4f} "
            f"{result.quantum_gate_value:>8.4f} "
            f"{result.decision}"
        )

    print("\n  BrainFlow pipeline PASSED")


if __name__ == "__main__":
    print("=" * 70)
    print("BRAINFLOW INTEGRATION TEST")
    print("=" * 70)
    test_brainflow_pipeline()
    print("=" * 70)
