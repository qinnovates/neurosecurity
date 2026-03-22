"""
ONI Framework CLI
=================

Command-line interface for the ONI Framework.

Usage:
    oni                 Show help and available commands
    oni ui              Launch interactive learning UI
    oni info            Show framework summary
    oni demo            Run quick demo of core features
    oni version         Show version
"""

import argparse
import sys
from typing import Optional


def main(args: Optional[list] = None):
    """Main CLI entry point."""
    parser = argparse.ArgumentParser(
        prog="oni",
        description="ONI Framework - Neural Security for Brain-Computer Interfaces",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  oni ui              Launch interactive UI (requires: pip install oni-framework[ui])
  oni info            Show what's included in the framework
  oni demo            Run a quick demonstration
  oni version         Show version number

Documentation: https://github.com/qinnovates/mindloft
        """,
    )

    subparsers = parser.add_subparsers(dest="command", help="Available commands")

    # UI command
    ui_parser = subparsers.add_parser("ui", help="Launch interactive learning UI")
    ui_parser.add_argument(
        "--port", type=int, default=8501, help="Port for Streamlit server (default: 8501)"
    )

    # Info command
    subparsers.add_parser("info", help="Show framework summary")

    # Demo command
    subparsers.add_parser("demo", help="Run quick demo of core features")

    # Version command
    subparsers.add_parser("version", help="Show version")

    parsed = parser.parse_args(args)

    if parsed.command is None:
        parser.print_help()
        return 0

    if parsed.command == "ui":
        return run_ui(parsed.port)
    elif parsed.command == "info":
        return run_info()
    elif parsed.command == "demo":
        return run_demo()
    elif parsed.command == "version":
        return run_version()

    return 0


def run_ui(port: int = 8501) -> int:
    """Launch the interactive Streamlit UI."""
    try:
        import streamlit.web.cli as stcli
    except ImportError:
        print("Error: Streamlit not installed.")
        print("Install with: pip install oni-framework[ui]")
        return 1

    import os
    ui_path = os.path.join(os.path.dirname(__file__), "ui", "app.py")

    if not os.path.exists(ui_path):
        print(f"Error: UI module not found at {ui_path}")
        return 1

    sys.argv = ["streamlit", "run", ui_path, "--server.port", str(port)]
    stcli.main()
    return 0


def run_info() -> int:
    """Show framework information."""
    from oni import print_summary
    print_summary()
    return 0


def run_demo() -> int:
    """Run a quick demonstration of core features."""
    from oni import __version__

    print(f"""
ONI Framework v{__version__} - Quick Demo
{'=' * 50}
""")

    # Demo 1: Coherence Metric
    print("1. COHERENCE METRIC (Signal Trust Scoring)")
    print("-" * 40)
    try:
        from oni import CoherenceMetric

        metric = CoherenceMetric(reference_freq=40.0)

        # High coherence signal
        high_cs = metric.calculate(
            arrival_times=[0.0, 0.025, 0.050, 0.075, 0.100],
            amplitudes=[100, 99, 101, 100, 100],
        )
        level, desc = metric.interpret(high_cs)
        print(f"   Consistent signal:   Cₛ = {high_cs:.3f} ({level})")

        # Low coherence signal
        low_cs = metric.calculate(
            arrival_times=[0.0, 0.030, 0.045, 0.090, 0.100],
            amplitudes=[100, 50, 150, 80, 120],
        )
        level, desc = metric.interpret(low_cs)
        print(f"   Inconsistent signal: Cₛ = {low_cs:.3f} ({level})")
        print()
    except Exception as e:
        print(f"   Error: {e}")
        print()

    # Demo 2: Neural Firewall
    print("2. NEURAL FIREWALL (Signal Filtering)")
    print("-" * 40)
    try:
        from oni import NeuralFirewall
        from oni.firewall import Signal

        firewall = NeuralFirewall(threshold_high=0.6, threshold_low=0.3)

        # Good signal
        good_signal = Signal(
            arrival_times=[0.0, 0.025, 0.050],
            amplitudes=[100, 99, 101],
            authenticated=True,
        )
        result = firewall.filter(good_signal)
        print(f"   Good signal:    {result.decision.name} (Cₛ={result.coherence:.2f})")

        # Bad signal
        bad_signal = Signal(
            arrival_times=[0.0, 0.050, 0.060],
            amplitudes=[100, 50, 200],
            authenticated=False,
        )
        result = firewall.filter(bad_signal)
        print(f"   Bad signal:     {result.decision.name} (Cₛ={result.coherence:.2f})")
        print()
    except Exception as e:
        print(f"   Error: {e}")
        print()

    # Demo 3: 14-Layer Model
    print("3. ONI 14-LAYER MODEL")
    print("-" * 40)
    try:
        from oni import ONIStack

        stack = ONIStack()
        print(f"   Total layers: {len(stack)}")
        print(f"   Silicon (L1-L7):  {len(list(stack.silicon_layers()))} layers")
        print(f"   Bridge (L8):      Neural Gateway")
        print(f"   Biology (L9-L14): {len(list(stack.biological_layers()))} layers")
        print()

        gateway = stack.layer(8)
        print(f"   L8 - {gateway.name}")
        print(f"   Function: {gateway.function}")
        print()
    except Exception as e:
        print(f"   Error: {e}")
        print()

    # Demo 4: Privacy Score
    print("4. PRIVACY SCORING")
    print("-" * 40)
    try:
        from oni import PrivacyScoreCalculator

        calculator = PrivacyScoreCalculator()
        # Generate sample signal data
        sample_signal = [0.1 * i for i in range(100)]
        result = calculator.calculate(
            signal_data=sample_signal,
            detected_erps=["P300", "N170"],
        )
        print(f"   Privacy risk score: {result.score:.2f}")
        print(f"   Interpretation: {result.interpretation}")
        print()
    except Exception as e:
        print(f"   Error: {e}")
        print()

    # Demo 5: Threat Classification
    print("5. THREAT CLASSIFICATION (Kohno Model)")
    print("-" * 40)
    try:
        from oni import KohnoThreatModel, ThreatType

        model = KohnoThreatModel()
        for threat_type in ThreatType:
            cia = model.security_properties[threat_type]
            print(f"   {threat_type.name:15} → CIA: {cia}")
        print()
    except Exception as e:
        print(f"   Error: {e}")
        print()

    print("=" * 50)
    print("Demo complete! For interactive exploration:")
    print("  $ pip install oni-framework[ui]")
    print("  $ oni ui")
    print()

    return 0


def run_version() -> int:
    """Show version information."""
    from oni import __version__
    print(f"oni-framework {__version__}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
