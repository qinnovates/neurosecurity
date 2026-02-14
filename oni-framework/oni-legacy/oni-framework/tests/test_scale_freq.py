"""Tests for the scale_freq module."""

import math
import pytest

from oni.scale_freq import (
    ScaleFrequencyInvariant,
    ScaleLevel,
    NEURAL_HIERARCHY,
    validate_signal_scale,
)


class TestScaleLevel:
    """Tests for the ScaleLevel dataclass."""

    def test_center_frequency(self):
        """Should calculate geometric mean of frequency range."""
        level = ScaleLevel(
            name="Test",
            spatial_scale=1e-3,
            frequency_range=(10, 100),
            description="Test",
        )
        # Geometric mean of 10 and 100 is sqrt(10*100) = sqrt(1000) ≈ 31.62
        expected = math.sqrt(10 * 100)
        assert level.center_frequency == pytest.approx(expected)

    def test_k_value(self):
        """Should calculate k = f × S."""
        level = ScaleLevel(
            name="Test",
            spatial_scale=0.001,  # 1mm
            frequency_range=(10, 40),  # center ~20 Hz
            description="Test",
        )
        expected_k = level.center_frequency * level.spatial_scale
        assert level.k_value == pytest.approx(expected_k)


class TestNeuralHierarchy:
    """Tests for the predefined neural hierarchy."""

    def test_hierarchy_has_levels(self):
        """Should have multiple hierarchy levels."""
        assert len(NEURAL_HIERARCHY) > 0

    def test_hierarchy_ordered_by_scale(self):
        """Levels should be ordered by spatial scale."""
        scales = [level.spatial_scale for level in NEURAL_HIERARCHY]
        assert scales == sorted(scales)

    def test_hierarchy_inverse_freq_scale(self):
        """Higher scales should have lower frequencies (generally)."""
        for i in range(len(NEURAL_HIERARCHY) - 1):
            current = NEURAL_HIERARCHY[i]
            next_level = NEURAL_HIERARCHY[i + 1]
            # Larger scale should have lower center frequency
            assert current.spatial_scale < next_level.spatial_scale
            assert current.center_frequency > next_level.center_frequency


class TestScaleFrequencyInvariant:
    """Tests for the ScaleFrequencyInvariant class."""

    def test_k_is_positive(self):
        """Computed k should be positive."""
        sfi = ScaleFrequencyInvariant()
        assert sfi.k > 0

    def test_custom_k(self):
        """Should accept custom k constant."""
        sfi = ScaleFrequencyInvariant(k_constant=0.01)
        assert sfi.k == 0.01

    def test_calculate_k(self):
        """Should calculate k = f × S."""
        sfi = ScaleFrequencyInvariant()
        k = sfi.calculate_k(frequency=40, spatial_scale=0.001)
        assert k == pytest.approx(0.04)

    def test_validate_within_tolerance(self):
        """Should validate signals within tolerance."""
        sfi = ScaleFrequencyInvariant(k_constant=0.04, tolerance=0.5)

        # f × S = 40 × 0.001 = 0.04, exactly k
        assert sfi.validate(frequency=40, spatial_scale=0.001)

        # Within 50% tolerance
        assert sfi.validate(frequency=50, spatial_scale=0.001)  # k=0.05, 25% off

    def test_validate_outside_tolerance(self):
        """Should reject signals outside tolerance."""
        sfi = ScaleFrequencyInvariant(k_constant=0.04, tolerance=0.1)

        # f × S = 100 × 0.001 = 0.1, which is 150% off from k=0.04
        assert not sfi.validate(frequency=100, spatial_scale=0.001)

    def test_deviation(self):
        """Should calculate fractional deviation from k."""
        sfi = ScaleFrequencyInvariant(k_constant=0.04)

        # Exact match
        dev = sfi.deviation(frequency=40, spatial_scale=0.001)
        assert dev == pytest.approx(0.0)

        # 50% higher
        dev = sfi.deviation(frequency=60, spatial_scale=0.001)
        assert dev == pytest.approx(0.5)

    def test_expected_frequency(self):
        """Should predict frequency for given scale."""
        sfi = ScaleFrequencyInvariant(k_constant=0.04)

        # At 1mm scale, f = k/S = 0.04/0.001 = 40 Hz
        f = sfi.expected_frequency(spatial_scale=0.001)
        assert f == pytest.approx(40.0)

    def test_expected_scale(self):
        """Should predict scale for given frequency."""
        sfi = ScaleFrequencyInvariant(k_constant=0.04)

        # At 40 Hz, S = k/f = 0.04/40 = 0.001 m
        s = sfi.expected_scale(frequency=40)
        assert s == pytest.approx(0.001)

    def test_expected_frequency_zero_scale_raises(self):
        """Should raise on zero spatial scale."""
        sfi = ScaleFrequencyInvariant()
        with pytest.raises(ValueError):
            sfi.expected_frequency(spatial_scale=0)

    def test_expected_scale_zero_freq_raises(self):
        """Should raise on zero frequency."""
        sfi = ScaleFrequencyInvariant()
        with pytest.raises(ValueError):
            sfi.expected_scale(frequency=0)

    def test_find_level(self):
        """Should find hierarchy level by frequency."""
        sfi = ScaleFrequencyInvariant()

        level = sfi.find_level(frequency=40)
        assert level is not None
        assert level.name == "Microcircuit"  # Gamma band

    def test_find_level_no_match(self):
        """Should return None for out-of-range frequency."""
        sfi = ScaleFrequencyInvariant()

        level = sfi.find_level(frequency=1e10)  # Way outside range
        assert level is None

    def test_anomaly_score_normal(self):
        """Normal signals should have low anomaly score."""
        sfi = ScaleFrequencyInvariant(k_constant=0.04)

        score = sfi.anomaly_score(frequency=40, spatial_scale=0.001)
        assert score < 0.1

    def test_anomaly_score_anomalous(self):
        """Anomalous signals should have high anomaly score."""
        sfi = ScaleFrequencyInvariant(k_constant=0.04)

        # Very wrong: high frequency at large scale
        score = sfi.anomaly_score(frequency=1000, spatial_scale=0.1)
        assert score > 0.9

    def test_hierarchy_report(self):
        """Should generate hierarchy report."""
        sfi = ScaleFrequencyInvariant()
        report = sfi.hierarchy_report()

        assert "Neural Processing Hierarchy" in report
        assert "Microcircuit" in report
        assert "Computed k:" in report


class TestValidateSignalScale:
    """Tests for the convenience function."""

    def test_returns_tuple(self):
        """Should return (valid, deviation) tuple."""
        result = validate_signal_scale(40, 1e-4)
        assert isinstance(result, tuple)
        assert len(result) == 2
        is_valid, deviation = result
        assert isinstance(is_valid, bool)
        assert isinstance(deviation, float)

    def test_custom_tolerance(self):
        """Should accept custom tolerance."""
        # With tight tolerance, may reject
        valid1, _ = validate_signal_scale(40, 1e-4, tolerance=0.01)

        # With loose tolerance, should accept more
        valid2, _ = validate_signal_scale(40, 1e-4, tolerance=0.99)

        # Loose tolerance should be at least as permissive
        if valid1:
            assert valid2
