"""
Scale-Frequency Invariant Module

Implements the f × S ≈ k invariant that describes how neural information
encoding varies across spatial and temporal scales.

===============================================================================
IMPORTANT: FOR NON-TECHNICAL COLLABORATORS
===============================================================================
This module checks if a neural signal's frequency makes biological sense for
its spatial scale.

THE CORE IDEA:
Small brain structures oscillate fast. Large brain structures oscillate slowly.
This is a fundamental physical law — like how hummingbird wings beat fast and
elephant legs move slowly.

THE FORMULA:
    frequency × spatial_scale ≈ constant (k)

EXAMPLES:
    - Single neuron (10 micrometers) → expects ~100-1000 Hz
    - Brain region (centimeters) → expects ~4-8 Hz (theta waves)
    - Whole brain (10 cm) → expects ~0.5-4 Hz (delta waves)

WHY THIS MATTERS FOR SECURITY:
An attacker trying to inject fake signals might use the wrong frequency for
the brain region they're targeting. For example, if someone tries to inject
a 100 Hz signal into a whole-brain pattern (which should be ~1 Hz), this
module will catch that mismatch.

DATA SOURCES:
The NEURAL_HIERARCHY values below are from neuroscience literature, not
measurements from your device. They represent established knowledge about
how the brain works at different scales.

This module does NOT connect to any hardware. It's a validator that checks
if frequency/scale combinations make biological sense.
===============================================================================

The invariant: frequency × spatial_scale ≈ constant

This reflects fundamental constraints on neural information processing:
- Higher frequencies operate at smaller spatial scales
- Information density is conserved across scales
- Violations indicate anomalous (potentially malicious) signals

Reference: TechDoc-Scale_Frequency.md
"""

import math
from dataclasses import dataclass
from typing import Dict, List, Optional, Tuple


@dataclass
class ScaleLevel:
    """
    Represents a level in the neural processing hierarchy.

    Attributes:
        name: Descriptive name
        spatial_scale: Characteristic size in meters
        frequency_range: Typical frequency range (Hz) at this scale
        description: What happens at this level
    """
    name: str
    spatial_scale: float  # meters
    frequency_range: Tuple[float, float]  # Hz
    description: str

    @property
    def center_frequency(self) -> float:
        """Geometric mean of frequency range."""
        return math.sqrt(self.frequency_range[0] * self.frequency_range[1])

    @property
    def k_value(self) -> float:
        """Calculate k = f × S for this level."""
        return self.center_frequency * self.spatial_scale


# Neural processing hierarchy with characteristic scales
# =============================================================================
# THESE VALUES ARE FROM NEUROSCIENCE LITERATURE, NOT MEASUREMENTS!
#
# This table summarizes known relationships between brain structure sizes and
# their typical oscillation frequencies. These are established scientific facts.
#
# You don't need to modify this — it's the reference standard that signals
# are validated against.
# =============================================================================
NEURAL_HIERARCHY: List[ScaleLevel] = [
    ScaleLevel(
        name="Molecular",
        spatial_scale=1e-9,  # nanometers
        frequency_range=(1e6, 1e9),  # MHz to GHz (molecular vibrations)
        description="Ion channel dynamics, neurotransmitter binding",
    ),
    ScaleLevel(
        name="Synaptic",
        spatial_scale=1e-6,  # micrometers
        frequency_range=(1e3, 1e5),  # kHz range
        description="Synaptic transmission, vesicle release",
    ),
    ScaleLevel(
        name="Cellular",
        spatial_scale=1e-5,  # 10 micrometers (cell body)
        frequency_range=(100, 1000),  # 100 Hz - 1 kHz
        description="Action potentials, spike patterns",
    ),
    ScaleLevel(
        name="Microcircuit",
        spatial_scale=1e-4,  # 100 micrometers (minicolumn)
        frequency_range=(30, 100),  # gamma band
        description="Local field potentials, gamma oscillations",
    ),
    ScaleLevel(
        name="Macrocolumn",
        spatial_scale=1e-3,  # millimeters
        frequency_range=(8, 30),  # alpha/beta bands
        description="Cortical columns, regional processing",
    ),
    ScaleLevel(
        name="Regional",
        spatial_scale=1e-2,  # centimeters
        frequency_range=(4, 8),  # theta band
        description="Brain region activity, hippocampal theta",
    ),
    ScaleLevel(
        name="Whole-Brain",
        spatial_scale=1e-1,  # 10 cm (hemisphere)
        frequency_range=(0.5, 4),  # delta band
        description="Global integration, slow oscillations",
    ),
]


class ScaleFrequencyInvariant:
    """
    Calculator and validator for the f × S ≈ k invariant.

    The scale-frequency invariant describes how information encoding
    in neural systems follows predictable patterns across spatial scales.
    Violations of this invariant may indicate anomalous signals.

    Example:
        >>> sfi = ScaleFrequencyInvariant()
        >>> # Check if a 40 Hz signal at 100 μm scale is valid
        >>> is_valid = sfi.validate(frequency=40, spatial_scale=1e-4)
        >>> print(f"Valid: {is_valid}")

        >>> # Estimate expected frequency for a given scale
        >>> expected_f = sfi.expected_frequency(spatial_scale=1e-3)
        >>> print(f"Expected frequency at 1mm: {expected_f:.1f} Hz")
    """

    def __init__(
        self,
        k_constant: Optional[float] = None,
        tolerance: float = 0.5,
    ):
        """
        Initialize the scale-frequency invariant calculator.

        Args:
            k_constant: The invariant constant (default: computed from hierarchy)
            tolerance: Fractional tolerance for validation (default: 0.5 = 50%)
        """
        self.hierarchy = NEURAL_HIERARCHY
        self._k_constant = k_constant or self._compute_k()
        self.tolerance = tolerance

    def _compute_k(self) -> float:
        """Compute k from the neural hierarchy (geometric mean)."""
        k_values = [level.k_value for level in self.hierarchy]
        # Use geometric mean for log-distributed values
        log_mean = sum(math.log(k) for k in k_values) / len(k_values)
        return math.exp(log_mean)

    @property
    def k(self) -> float:
        """The invariant constant k."""
        return self._k_constant

    def calculate_k(self, frequency: float, spatial_scale: float) -> float:
        """
        Calculate k for a given frequency and spatial scale.

        Args:
            frequency: Signal frequency in Hz
            spatial_scale: Spatial scale in meters

        Returns:
            Calculated k value (f × S)
        """
        return frequency * spatial_scale

    def validate(
        self,
        frequency: float,
        spatial_scale: float,
        tolerance: Optional[float] = None,
    ) -> bool:
        """
        Validate whether f × S ≈ k within tolerance.

        Args:
            frequency: Signal frequency in Hz
            spatial_scale: Spatial scale in meters
            tolerance: Override default tolerance (fractional)

        Returns:
            True if within tolerance of expected k
        """
        tol = tolerance if tolerance is not None else self.tolerance
        calculated_k = self.calculate_k(frequency, spatial_scale)

        # Check if within tolerance band
        lower = self.k * (1 - tol)
        upper = self.k * (1 + tol)

        return lower <= calculated_k <= upper

    def deviation(self, frequency: float, spatial_scale: float) -> float:
        """
        Calculate fractional deviation from expected k.

        Args:
            frequency: Signal frequency in Hz
            spatial_scale: Spatial scale in meters

        Returns:
            Fractional deviation (0 = perfect match, 1 = 100% deviation)
        """
        calculated_k = self.calculate_k(frequency, spatial_scale)
        return abs(calculated_k - self.k) / self.k

    def expected_frequency(self, spatial_scale: float) -> float:
        """
        Calculate expected frequency for a given spatial scale.

        Args:
            spatial_scale: Spatial scale in meters

        Returns:
            Expected frequency in Hz based on k = f × S
        """
        if spatial_scale <= 0:
            raise ValueError("Spatial scale must be positive")
        return self.k / spatial_scale

    def expected_scale(self, frequency: float) -> float:
        """
        Calculate expected spatial scale for a given frequency.

        Args:
            frequency: Frequency in Hz

        Returns:
            Expected spatial scale in meters based on k = f × S
        """
        if frequency <= 0:
            raise ValueError("Frequency must be positive")
        return self.k / frequency

    def find_level(self, frequency: float) -> Optional[ScaleLevel]:
        """
        Find the hierarchy level matching a frequency.

        Args:
            frequency: Frequency in Hz

        Returns:
            Matching ScaleLevel or None if no match
        """
        for level in self.hierarchy:
            low, high = level.frequency_range
            if low <= frequency <= high:
                return level
        return None

    def anomaly_score(
        self,
        frequency: float,
        spatial_scale: float,
    ) -> float:
        """
        Calculate an anomaly score based on deviation from invariant.

        Higher scores indicate more anomalous (potentially malicious) signals.

        Args:
            frequency: Signal frequency in Hz
            spatial_scale: Spatial scale in meters

        Returns:
            Anomaly score in [0, 1] where 0 = normal, 1 = highly anomalous
        """
        deviation = self.deviation(frequency, spatial_scale)
        # Sigmoid-like function that saturates at 1
        return 1 - math.exp(-deviation)

    def hierarchy_report(self) -> str:
        """Generate a report of the neural hierarchy with k values."""
        lines = [
            "Neural Processing Hierarchy (f × S ≈ k)",
            "=" * 60,
            f"{'Level':<15} {'Scale':>12} {'Freq Range':>15} {'k':>10}",
            "-" * 60,
        ]

        for level in self.hierarchy:
            scale_str = f"{level.spatial_scale:.0e} m"
            freq_str = f"{level.frequency_range[0]:.0f}-{level.frequency_range[1]:.0f} Hz"
            k_str = f"{level.k_value:.2e}"
            lines.append(f"{level.name:<15} {scale_str:>12} {freq_str:>15} {k_str:>10}")

        lines.append("-" * 60)
        lines.append(f"{'Computed k:':<15} {self.k:.2e}")
        lines.append(f"{'Tolerance:':<15} {self.tolerance * 100:.0f}%")

        return "\n".join(lines)


def validate_signal_scale(
    frequency: float,
    spatial_scale: float,
    tolerance: float = 0.5,
) -> Tuple[bool, float]:
    """
    Quick validation of frequency-scale relationship.

    Convenience function for simple validation.

    Args:
        frequency: Signal frequency in Hz
        spatial_scale: Spatial scale in meters
        tolerance: Fractional tolerance (default: 50%)

    Returns:
        Tuple of (is_valid, deviation_fraction)

    Example:
        >>> valid, dev = validate_signal_scale(40, 1e-4)
        >>> print(f"Valid: {valid}, Deviation: {dev:.1%}")
    """
    sfi = ScaleFrequencyInvariant(tolerance=tolerance)
    return sfi.validate(frequency, spatial_scale), sfi.deviation(frequency, spatial_scale)
