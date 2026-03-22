"""Tests for the coherence module."""

import math
import pytest

from oni.coherence import (
    CoherenceMetric,
    VarianceComponents,
    calculate_cs,
    quick_coherence,
)


class TestVarianceComponents:
    """Tests for VarianceComponents dataclass."""

    def test_total_variance(self):
        """Total should be sum of components."""
        v = VarianceComponents(phase=0.1, transport=0.2, gain=0.3)
        assert v.total == pytest.approx(0.6)

    def test_zero_variance(self):
        """Zero variance components should give zero total."""
        v = VarianceComponents(phase=0, transport=0, gain=0)
        assert v.total == 0


class TestCalculateCs:
    """Tests for the calculate_cs function."""

    def test_zero_variance_gives_one(self):
        """Zero total variance should give Cs = 1."""
        v = VarianceComponents(phase=0, transport=0, gain=0)
        assert calculate_cs(v) == pytest.approx(1.0)

    def test_high_variance_approaches_zero(self):
        """High variance should give Cs approaching 0."""
        v = VarianceComponents(phase=10, transport=10, gain=10)
        assert calculate_cs(v) < 0.001

    def test_one_nat_entropy(self):
        """One nat of total entropy should give Cs = e^-1."""
        v = VarianceComponents(phase=0.5, transport=0.3, gain=0.2)
        assert calculate_cs(v) == pytest.approx(math.exp(-1))

    def test_negative_variance_raises(self):
        """Negative variance should raise ValueError."""
        v = VarianceComponents(phase=-0.1, transport=0, gain=0)
        with pytest.raises(ValueError):
            calculate_cs(v)

    def test_infinite_variance_gives_zero(self):
        """Infinite variance should give Cs = 0."""
        v = VarianceComponents(phase=float('inf'), transport=0, gain=0)
        assert calculate_cs(v) == 0.0


class TestCoherenceMetric:
    """Tests for the CoherenceMetric class."""

    def test_default_reference_freq(self):
        """Default reference frequency should be 40 Hz (gamma)."""
        metric = CoherenceMetric()
        assert metric.reference_freq == 40.0

    def test_custom_reference_freq(self):
        """Should accept custom reference frequency."""
        metric = CoherenceMetric(reference_freq=8.0)
        assert metric.reference_freq == 8.0

    def test_phase_variance_periodic_signal(self):
        """Phase-locked signal should have low phase variance."""
        metric = CoherenceMetric(reference_freq=40.0)
        # Signal at 25ms intervals = 40 Hz, perfectly phase-locked
        times = [0.0, 0.025, 0.050, 0.075, 0.100]
        amplitudes = [100] * 5

        variances = metric.calculate_variances(times, amplitudes)
        # Should have very low phase variance
        assert variances.phase < 0.5

    def test_gain_variance_stable_amplitude(self):
        """Stable amplitude should have low gain variance."""
        metric = CoherenceMetric(expected_amplitude=100)
        times = [0.0, 0.025, 0.050]
        amplitudes = [100, 100, 100]  # Perfect stability

        variances = metric.calculate_variances(times, amplitudes)
        assert variances.gain == pytest.approx(0.0)

    def test_gain_variance_with_jitter(self):
        """Amplitude jitter should increase gain variance."""
        metric = CoherenceMetric(expected_amplitude=100)
        times = [0.0, 0.025, 0.050]
        amplitudes = [100, 80, 120]  # 20% deviations

        variances = metric.calculate_variances(times, amplitudes)
        assert variances.gain > 0

    def test_transport_variance_default_factors(self):
        """Default transport factors should give consistent variance."""
        metric = CoherenceMetric()
        times = [0.0, 0.025]
        amplitudes = [100, 100]

        v1 = metric.calculate_variances(times, amplitudes)
        v2 = metric.calculate_variances(times, amplitudes)

        assert v1.transport == pytest.approx(v2.transport)

    def test_transport_variance_custom_factors(self):
        """Custom transport factors should affect variance."""
        metric = CoherenceMetric(transport_factors={'perfect': 1.0})
        times = [0.0, 0.025]
        amplitudes = [100, 100]

        # Perfect reliability (p=1.0) means -ln(1.0) = 0
        variances = metric.calculate_variances(times, amplitudes)
        # With only one factor at p=1.0, transport variance should be ~0
        # But ln(1.0) = 0, so it should be exactly 0
        assert variances.transport == pytest.approx(0.0, abs=1e-10)

    def test_calculate_returns_valid_range(self):
        """Coherence score should be in [0, 1]."""
        metric = CoherenceMetric()
        times = [0.0, 0.025, 0.050, 0.075, 0.100]
        amplitudes = [100, 98, 102, 99, 101]

        cs = metric.calculate(times, amplitudes)
        assert 0 <= cs <= 1

    def test_interpret_high(self):
        """High coherence should be interpreted correctly."""
        metric = CoherenceMetric()
        level, desc = metric.interpret(0.7)
        assert level == "HIGH"

    def test_interpret_medium(self):
        """Medium coherence should be interpreted correctly."""
        metric = CoherenceMetric()
        level, desc = metric.interpret(0.4)
        assert level == "MEDIUM"

    def test_interpret_low(self):
        """Low coherence should be interpreted correctly."""
        metric = CoherenceMetric()
        level, desc = metric.interpret(0.2)
        assert level == "LOW"

    def test_get_band_gamma(self):
        """40 Hz should be in gamma band."""
        metric = CoherenceMetric(reference_freq=40.0)
        assert metric.get_band() == "gamma"

    def test_get_band_theta(self):
        """6 Hz should be in theta band."""
        metric = CoherenceMetric(reference_freq=6.0)
        assert metric.get_band() == "theta"


class TestQuickCoherence:
    """Tests for the quick_coherence convenience function."""

    def test_returns_valid_score(self):
        """Should return a valid coherence score."""
        cs = quick_coherence(
            arrival_times=[0.0, 0.025, 0.050],
            amplitudes=[100, 102, 98],
        )
        assert 0 <= cs <= 1

    def test_custom_reference_freq(self):
        """Should accept custom reference frequency."""
        cs = quick_coherence(
            arrival_times=[0.0, 0.125, 0.250],  # 8 Hz
            amplitudes=[100, 100, 100],
            reference_freq=8.0,
        )
        assert 0 <= cs <= 1
