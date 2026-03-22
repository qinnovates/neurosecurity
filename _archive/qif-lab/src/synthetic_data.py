"""
Synthetic Data Generators for QIF Equation Testing.

Two generators:
1. Custom synthetic — controlled variance values for unit testing equations
2. BrainFlow synthetic board — realistic EEG-like data for integration testing
"""

import numpy as np
from dataclasses import dataclass
from typing import Optional


# ──────────────────────────────────────────────
# Custom Synthetic Generator
# ──────────────────────────────────────────────

@dataclass
class SyntheticScenario:
    """A controlled test scenario with known properties."""
    name: str
    description: str
    # Signal properties
    n_channels: int = 8
    n_samples: int = 1000
    sampling_rate: float = 250.0  # Hz
    # Controlled variance parameters
    phase_jitter: float = 0.1     # radians — low = coherent
    transport_reliability: float = 0.9  # probability — high = reliable
    amplitude_stability: float = 0.05   # coefficient of variation — low = stable
    # Frequency content
    dominant_freq: float = 10.0   # Hz (alpha band default)
    noise_level: float = 0.1      # relative to signal
    # Attack simulation
    is_attack: bool = False
    attack_type: Optional[str] = None


def generate_custom_signals(scenario: SyntheticScenario, seed: int = 42) -> dict:
    """Generate synthetic neural signals with precisely controlled properties.

    Returns dict with:
        - 'phases': phase values per channel
        - 'amplitudes': amplitude values per channel
        - 'transport_probs': transmission probabilities per channel
        - 'raw_signals': time-domain signals (n_channels x n_samples)
        - 'scenario': the input scenario for reference
    """
    rng = np.random.default_rng(seed)
    t = np.arange(scenario.n_samples) / scenario.sampling_rate

    # Generate base oscillation at dominant frequency
    base_phase = 2 * np.pi * scenario.dominant_freq * t

    signals = []
    phases = []
    amplitudes = []

    for ch in range(scenario.n_channels):
        # Phase: base + controlled jitter
        ch_phase_offset = rng.normal(0, scenario.phase_jitter)
        phase = base_phase + ch_phase_offset
        phases.append(ch_phase_offset)

        # Amplitude: base (1.0) + controlled variation
        ch_amplitude = 1.0 + rng.normal(0, scenario.amplitude_stability)
        amplitudes.append(abs(ch_amplitude))

        # Signal: amplitude * sin(phase) + noise
        signal = ch_amplitude * np.sin(phase)
        signal += rng.normal(0, scenario.noise_level, scenario.n_samples)

        # Attack injection
        if scenario.is_attack:
            if scenario.attack_type == "signal_injection":
                # Inject high-frequency artifact
                attack_signal = 0.5 * np.sin(2 * np.pi * 120 * t)
                signal += attack_signal
            elif scenario.attack_type == "phase_disruption":
                # Random phase jumps
                jump_points = rng.choice(scenario.n_samples, size=10, replace=False)
                for jp in jump_points:
                    signal[jp:] += rng.normal(0, 0.3)
            elif scenario.attack_type == "amplitude_spike":
                # Sudden amplitude changes
                spike_points = rng.choice(scenario.n_samples, size=5, replace=False)
                for sp in spike_points:
                    signal[sp:sp+10] *= 3.0

        signals.append(signal)

    # Transport probabilities: controlled reliability with per-channel variation
    transport_probs = np.clip(
        rng.normal(scenario.transport_reliability, 0.05, scenario.n_channels),
        0.01, 1.0
    )

    return {
        'phases': np.array(phases),
        'amplitudes': np.array(amplitudes),
        'transport_probs': transport_probs,
        'raw_signals': np.array(signals),
        'time': t,
        'scenario': scenario,
    }


# Predefined scenarios for testing
SCENARIOS = {
    "healthy_baseline": SyntheticScenario(
        name="Healthy Baseline",
        description="Normal brain signals, high coherence, no attack",
        phase_jitter=0.05,
        transport_reliability=0.95,
        amplitude_stability=0.02,
        noise_level=0.05,
    ),
    "noisy_but_safe": SyntheticScenario(
        name="Noisy but Safe",
        description="Moderate noise, medium coherence, no attack",
        phase_jitter=0.3,
        transport_reliability=0.7,
        amplitude_stability=0.15,
        noise_level=0.2,
    ),
    "degraded_signal": SyntheticScenario(
        name="Degraded Signal",
        description="Poor signal quality, low coherence, no attack",
        phase_jitter=0.8,
        transport_reliability=0.4,
        amplitude_stability=0.4,
        noise_level=0.5,
    ),
    "signal_injection_attack": SyntheticScenario(
        name="Signal Injection Attack",
        description="Attacker injecting 120 Hz artifact into neural signals",
        phase_jitter=0.1,
        transport_reliability=0.9,
        amplitude_stability=0.05,
        noise_level=0.1,
        is_attack=True,
        attack_type="signal_injection",
    ),
    "phase_disruption_attack": SyntheticScenario(
        name="Phase Disruption Attack",
        description="Attacker disrupting phase synchronization",
        phase_jitter=0.6,
        transport_reliability=0.85,
        amplitude_stability=0.1,
        noise_level=0.15,
        is_attack=True,
        attack_type="phase_disruption",
    ),
    "amplitude_spike_attack": SyntheticScenario(
        name="Amplitude Spike Attack",
        description="Attacker injecting amplitude spikes",
        phase_jitter=0.1,
        transport_reliability=0.9,
        amplitude_stability=0.3,
        noise_level=0.1,
        is_attack=True,
        attack_type="amplitude_spike",
    ),
    "quantum_regime_short": SyntheticScenario(
        name="Quantum Regime (microsecond)",
        description="Signals at quantum-relevant timescale, t << tau_D",
        phase_jitter=0.05,
        transport_reliability=0.95,
        amplitude_stability=0.02,
        sampling_rate=20000.0,  # 20 kHz like Neuralink
        noise_level=0.03,
    ),
    "decoherence_boundary": SyntheticScenario(
        name="Decoherence Boundary",
        description="Signals at t ≈ tau_D, hybrid quantum-classical regime",
        phase_jitter=0.15,
        transport_reliability=0.8,
        amplitude_stability=0.08,
        noise_level=0.1,
    ),
}


# ──────────────────────────────────────────────
# BrainFlow Synthetic Board
# ──────────────────────────────────────────────

def generate_brainflow_signals(
    duration_sec: float = 5.0,
    n_channels: int = 8,
) -> dict:
    """Generate realistic EEG data using BrainFlow's synthetic board.

    BrainFlow's synthetic board produces multi-channel EEG-like data with
    realistic spectral content, noise patterns, and temporal dynamics.

    Args:
        duration_sec: Duration of recording in seconds
        n_channels: Number of EEG channels to use

    Returns:
        Dict with raw signals, extracted phases, amplitudes, and metadata.
    """
    try:
        from brainflow.board_shim import BoardShim, BrainFlowInputParams, BoardIds
        from brainflow.data_filter import DataFilter, FilterTypes
    except ImportError:
        raise ImportError(
            "BrainFlow not installed. Install with: pip install brainflow"
        )

    # Configure synthetic board
    params = BrainFlowInputParams()
    board_id = BoardIds.SYNTHETIC_BOARD.value
    board = BoardShim(board_id, params)

    # Get board info
    sampling_rate = BoardShim.get_sampling_rate(board_id)
    eeg_channels = BoardShim.get_eeg_channels(board_id)[:n_channels]

    # Start streaming
    board.prepare_session()
    board.start_stream()

    # Collect data
    import time
    time.sleep(duration_sec)

    # Get data and stop
    data = board.get_board_data()
    board.stop_stream()
    board.release_session()

    # Extract EEG channels
    raw_signals = data[eeg_channels, :]
    n_samples = raw_signals.shape[1]
    t = np.arange(n_samples) / sampling_rate

    # Extract phase information via Hilbert transform
    from scipy.signal import hilbert
    phases = []
    amplitudes = []
    for ch_idx in range(min(n_channels, raw_signals.shape[0])):
        analytic = hilbert(raw_signals[ch_idx])
        phases.append(np.angle(analytic))
        amplitudes.append(np.abs(analytic))

    phases = np.array(phases)
    amplitudes = np.array(amplitudes)

    # Estimate transport probabilities from signal quality
    # (Using SNR-based heuristic: higher SNR → higher transport reliability)
    transport_probs = np.zeros(min(n_channels, raw_signals.shape[0]))
    for ch_idx in range(len(transport_probs)):
        signal_power = np.var(raw_signals[ch_idx])
        # Estimate noise from high-frequency content (>100 Hz)
        high_freq = raw_signals[ch_idx].copy()
        DataFilter.perform_highpass(
            high_freq, sampling_rate, 100.0, 4,
            FilterTypes.BUTTERWORTH.value, 0
        )
        noise_power = np.var(high_freq) + 1e-10
        snr = signal_power / noise_power
        # Map SNR to probability (sigmoid-like)
        transport_probs[ch_idx] = 1.0 / (1.0 + np.exp(-0.5 * (snr - 5)))

    return {
        'raw_signals': raw_signals,
        'phases': phases,  # (n_channels, n_samples)
        'amplitudes': amplitudes,  # (n_channels, n_samples)
        'transport_probs': transport_probs,
        'time': t,
        'sampling_rate': sampling_rate,
        'n_channels': min(n_channels, raw_signals.shape[0]),
        'n_samples': n_samples,
        'source': 'brainflow_synthetic',
    }


def brainflow_to_qi_inputs(bf_data: dict) -> dict:
    """Convert BrainFlow output to QI equation inputs.

    Extracts instantaneous phase, mean amplitude, and transport probs
    suitable for the full_qi_assessment pipeline.
    """
    # Use instantaneous phases at a single time point (midpoint)
    mid = bf_data['phases'].shape[1] // 2
    inst_phases = bf_data['phases'][:, mid]

    # Mean amplitudes per channel
    mean_amps = np.mean(bf_data['amplitudes'], axis=1)

    return {
        'phases': inst_phases,
        'amplitudes': mean_amps,
        'transport_probs': bf_data['transport_probs'],
    }
