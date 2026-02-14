"""
Coherence Metric Module

Implements the Cₛ (Coherence Score) calculation for neural signal validation.

===============================================================================
IMPORTANT: FOR NON-TECHNICAL COLLABORATORS
===============================================================================
This module calculates a "trust score" (0 to 1) for neural signals.

- Score near 1.0 = Signal is consistent and trustworthy
- Score near 0.0 = Signal is inconsistent and should be rejected

HOW IT WORKS:
The score is based on three types of "variance" (inconsistency):
1. Phase variance    — Are pulses arriving at expected times?
2. Transport variance — How reliable is the signal pathway?
3. Gain variance     — Is the signal strength consistent?

WHAT'S SAMPLE DATA VS REAL MEASUREMENT:
- arrival_times and amplitudes: YOU provide these (from a BCI device)
- transport_factors: DEFAULT values from neuroscience literature (can override)
- reference_freq: YOU choose this based on which brain waves you're analyzing

This module does NOT connect to any hardware. It's a calculator that processes
data you give it.
===============================================================================

Formula: Cₛ = e^(−(σ²φ + σ²τ + σ²γ))

Where:
- σ²φ = phase variance (timing jitter relative to reference oscillations)
- σ²τ = transport variance (pathway integrity)
- σ²γ = gain variance (amplitude stability)

Reference: TechDoc-Coherence_Metric_Detailed.md
"""

import math
from dataclasses import dataclass
from typing import List, Optional, Tuple
import warnings


@dataclass
class VarianceComponents:
    """Container for the three variance components of coherence."""
    phase: float      # σ²φ - timing jitter
    transport: float  # σ²τ - pathway integrity
    gain: float       # σ²γ - amplitude stability

    @property
    def total(self) -> float:
        """Total variance (H_total in information-theoretic terms)."""
        return self.phase + self.transport + self.gain


class CoherenceMetric:
    """
    Calculator for neural signal coherence scores.

    The coherence metric quantifies trustworthiness of signals at the
    bio-digital interface by measuring variance across three dimensions:
    timing, pathway integrity, and amplitude stability.

    Example:
        >>> metric = CoherenceMetric(reference_freq=40.0)  # 40 Hz gamma
        >>> signal_times = [0.0, 0.025, 0.050, 0.075, 0.100]  # 25ms intervals
        >>> signal_amplitudes = [100, 98, 102, 99, 101]  # μV
        >>> cs = metric.calculate(signal_times, signal_amplitudes)
        >>> print(f"Coherence: {cs:.3f}")
    """

    # Neural oscillation bands (Hz)
    BANDS = {
        'delta': (0.5, 4),
        'theta': (4, 8),
        'alpha': (8, 12),
        'beta': (13, 30),
        'gamma': (30, 100),
    }

    # Default transport reliability factors
    # =========================================================================
    # THESE ARE THEORETICAL DEFAULTS, NOT MEASUREMENTS FROM YOUR DEVICE!
    #
    # These values come from neuroscience literature estimates. In a real BCI
    # system, you would measure actual reliability from your hardware/tissue
    # interface and pass custom values to override these defaults.
    #
    # Example: If your electrode has 95% signal fidelity, you might use:
    #   metric = CoherenceMetric(transport_factors={'electrode': 0.95})
    # =========================================================================
    DEFAULT_TRANSPORT_FACTORS = {
        'myelinated_axon': 0.999,        # Insulated nerve fibers (very reliable)
        'unmyelinated_axon': 0.97,       # Uninsulated fibers (slightly less reliable)
        'synaptic_transmission': 0.85,   # Synapses sometimes fail to fire
        'dendritic_integration': 0.90,   # Some signal loss in dendrite branches
    }

    def __init__(
        self,
        reference_freq: float = 40.0,
        transport_factors: Optional[dict] = None,
        expected_amplitude: Optional[float] = None,
    ):
        """
        Initialize the coherence metric calculator.

        Args:
            reference_freq: Reference oscillation frequency in Hz (default: 40 Hz gamma)
            transport_factors: Dict of pathway component reliabilities (0-1)
            expected_amplitude: Expected baseline signal amplitude
        """
        self.reference_freq = reference_freq
        self.transport_factors = transport_factors or self.DEFAULT_TRANSPORT_FACTORS
        self.expected_amplitude = expected_amplitude

    def calculate(
        self,
        arrival_times: List[float],
        amplitudes: List[float],
        transport_factors: Optional[dict] = None,
    ) -> float:
        """
        Calculate the coherence score Cₛ for a signal.

        Args:
            arrival_times: List of signal arrival times in seconds
            amplitudes: List of signal amplitudes (same units as expected_amplitude)
            transport_factors: Optional override for pathway reliabilities

        Returns:
            Coherence score Cₛ in range [0, 1]
        """
        variances = self.calculate_variances(arrival_times, amplitudes, transport_factors)
        return calculate_cs(variances)

    def calculate_variances(
        self,
        arrival_times: List[float],
        amplitudes: List[float],
        transport_factors: Optional[dict] = None,
    ) -> VarianceComponents:
        """
        Calculate individual variance components.

        Args:
            arrival_times: List of signal arrival times in seconds
            amplitudes: List of signal amplitudes
            transport_factors: Optional override for pathway reliabilities

        Returns:
            VarianceComponents with phase, transport, and gain variances
        """
        phase_var = self._calculate_phase_variance(arrival_times)
        transport_var = self._calculate_transport_variance(transport_factors)
        gain_var = self._calculate_gain_variance(amplitudes)

        return VarianceComponents(
            phase=phase_var,
            transport=transport_var,
            gain=gain_var,
        )

    def _calculate_phase_variance(self, arrival_times: List[float]) -> float:
        """
        Calculate phase variance σ²φ.

        Maps arrival times to phase angles relative to reference oscillation,
        then computes circular variance.

        Formula: σ²φ = (1/n) Σᵢ (φᵢ − φ̄)²
        Where: φᵢ = 2π · f_ref · tᵢ (mod 2π)
        """
        if len(arrival_times) < 2:
            return 0.0

        # Convert times to phase angles
        phases = [
            (2 * math.pi * self.reference_freq * t) % (2 * math.pi)
            for t in arrival_times
        ]

        # Use circular mean for phase data
        sin_sum = sum(math.sin(p) for p in phases)
        cos_sum = sum(math.cos(p) for p in phases)
        n = len(phases)

        # Circular mean direction
        mean_phase = math.atan2(sin_sum / n, cos_sum / n)

        # Circular variance (using angular deviation)
        # For circular data, variance = 1 - R, where R is mean resultant length
        R = math.sqrt((sin_sum / n) ** 2 + (cos_sum / n) ** 2)
        circular_variance = 1 - R

        # Scale to comparable range with other variance components
        # Multiply by 2π² to convert to squared radians
        return circular_variance * (math.pi ** 2)

    def _calculate_transport_variance(
        self,
        transport_factors: Optional[dict] = None
    ) -> float:
        """
        Calculate transport variance σ²τ.

        Formula: σ²τ = −Σᵢ ln(pᵢ)

        Where pᵢ is the reliability probability of each pathway component.
        """
        factors = transport_factors or self.transport_factors

        if not factors:
            return 0.0

        total = 0.0
        for name, reliability in factors.items():
            if reliability <= 0 or reliability > 1:
                raise ValueError(
                    f"Transport factor '{name}' must be in (0, 1], got {reliability}"
                )
            total += -math.log(reliability)

        return total

    def _calculate_gain_variance(self, amplitudes: List[float]) -> float:
        """
        Calculate gain variance σ²γ.

        Formula: σ²γ = (1/n) Σᵢ ((Aᵢ − Ā) / Ā)²

        Normalized variance relative to expected amplitude.
        """
        if len(amplitudes) < 2:
            return 0.0

        # Use expected amplitude if set, otherwise use mean
        baseline = self.expected_amplitude or (sum(amplitudes) / len(amplitudes))

        if baseline == 0:
            warnings.warn("Zero baseline amplitude, returning infinite gain variance")
            return float('inf')

        # Normalized squared deviations
        squared_devs = [((a - baseline) / baseline) ** 2 for a in amplitudes]
        return sum(squared_devs) / len(squared_devs)

    def get_band(self) -> Optional[str]:
        """Return the neural oscillation band for the reference frequency."""
        for band, (low, high) in self.BANDS.items():
            if low <= self.reference_freq <= high:
                return band
        return None

    def interpret(self, cs: float) -> Tuple[str, str]:
        """
        Interpret a coherence score.

        Args:
            cs: Coherence score in [0, 1]

        Returns:
            Tuple of (level, description)
        """
        if cs > 0.6:
            return ("HIGH", "Signal is coherent and trustworthy")
        elif cs > 0.3:
            return ("MEDIUM", "Signal shows moderate variance, verify context")
        else:
            return ("LOW", "Signal is incoherent, reject or investigate")


def calculate_cs(variances: VarianceComponents) -> float:
    """
    Calculate coherence score from variance components.

    Formula: Cₛ = e^(−(σ²φ + σ²τ + σ²γ))

    Args:
        variances: VarianceComponents object with phase, transport, gain

    Returns:
        Coherence score Cₛ in range [0, 1]
    """
    total_variance = variances.total

    # Handle edge cases
    if total_variance < 0:
        raise ValueError(f"Total variance cannot be negative: {total_variance}")
    if total_variance == float('inf'):
        return 0.0

    return math.exp(-total_variance)


def quick_coherence(
    arrival_times: List[float],
    amplitudes: List[float],
    reference_freq: float = 40.0,
) -> float:
    """
    Quick coherence calculation with default parameters.

    Convenience function for simple use cases.

    Args:
        arrival_times: Signal arrival times in seconds
        amplitudes: Signal amplitudes
        reference_freq: Reference oscillation frequency (default: 40 Hz)

    Returns:
        Coherence score Cₛ

    Example:
        >>> cs = quick_coherence([0, 0.025, 0.05], [100, 102, 98])
        >>> print(f"Cs = {cs:.3f}")
    """
    metric = CoherenceMetric(reference_freq=reference_freq)
    return metric.calculate(arrival_times, amplitudes)
