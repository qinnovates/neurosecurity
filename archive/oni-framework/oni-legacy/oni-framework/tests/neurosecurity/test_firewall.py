"""
Tests for Neurosecurity Firewall

Tests the implementation of Kohno's neurosecurity principles:
- Integrity (anti-alteration)
- Availability (anti-blocking)
- Confidentiality (anti-eavesdropping)

Reference:
    Denning, T., Matsuoka, Y., & Kohno, T. (2009). Neurosecurity:
    Security and privacy for neural devices. Neurosurgical Focus, 27(1), E7.
"""

import pytest
from oni.neurosecurity import (
    NeurosecurityFirewall,
    NeurosecurityConfig,
    ThreatType,
    SecurityDecision,
)
from oni.neurosecurity.firewall import NeuralSignal


class TestNeurosecurityFirewall:
    """Test suite for NeurosecurityFirewall."""

    def test_allow_valid_signal(self):
        """Valid signals should be allowed."""
        firewall = NeurosecurityFirewall()
        signal = NeuralSignal(
            timestamp=0.0,
            amplitude=50.0,
            frequency=30.0,
            coherence_score=0.85,
        )
        decision = firewall.validate(signal)
        assert decision == SecurityDecision.ALLOW

    def test_block_low_coherence(self):
        """
        Test: Signal with low coherence (alteration indicator) should be blocked.

        Reference: Kohno (2009) - alteration attacks modify signal integrity.
        """
        firewall = NeurosecurityFirewall()
        signal = NeuralSignal(
            timestamp=0.0,
            amplitude=50.0,
            coherence_score=0.2,  # Below threshold
        )
        decision = firewall.validate(signal)
        assert decision == SecurityDecision.BLOCK

    def test_block_high_amplitude(self):
        """
        Test: Signal with dangerous amplitude should be blocked.

        Reference: Kohno (2009) - alteration attacks could cause tissue damage.
        """
        config = NeurosecurityConfig(max_amplitude_uv=500.0)
        firewall = NeurosecurityFirewall(config)
        signal = NeuralSignal(
            timestamp=0.0,
            amplitude=600.0,  # Exceeds safe limit
            coherence_score=0.9,
        )
        decision = firewall.validate(signal)
        assert decision == SecurityDecision.BLOCK

    def test_emergency_shutoff_critical_coherence(self):
        """
        Test: Critically low coherence triggers emergency shutoff.

        Reference: Kohno (2009) - irreversible effects require immediate action.
        """
        config = NeurosecurityConfig(
            shutoff_coherence_threshold=0.1,
            emergency_shutoff_enabled=True,
        )
        firewall = NeurosecurityFirewall(config)
        signal = NeuralSignal(
            timestamp=0.0,
            amplitude=50.0,
            coherence_score=0.05,  # Critical
        )
        decision = firewall.validate(signal)
        assert decision == SecurityDecision.EMERGENCY_SHUTOFF
        assert firewall.emergency_triggered

    def test_emergency_shutoff_dangerous_amplitude(self):
        """
        Test: Dangerous amplitude triggers emergency shutoff.
        """
        config = NeurosecurityConfig(
            shutoff_amplitude_threshold=1000.0,
            emergency_shutoff_enabled=True,
        )
        firewall = NeurosecurityFirewall(config)
        signal = NeuralSignal(
            timestamp=0.0,
            amplitude=1200.0,  # Dangerous
            coherence_score=0.9,
        )
        decision = firewall.validate(signal)
        assert decision == SecurityDecision.EMERGENCY_SHUTOFF


class TestDoSDetection:
    """
    Test DoS detection (Kohno blocking attacks).

    Reference: Kohno (2009) - blocking attacks prevent signal transmission.
    """

    def test_normal_rate_allowed(self):
        """Normal signal rate should be allowed."""
        config = NeurosecurityConfig(
            dos_window_ms=100.0,
            dos_threshold_count=100,
        )
        firewall = NeurosecurityFirewall(config)

        # Send signals at normal rate (50 in 100ms window)
        for i in range(50):
            signal = NeuralSignal(
                timestamp=i * 2.0,  # 500 Hz
                amplitude=50.0,
                coherence_score=0.8,
            )
            decision = firewall.validate(signal)
            assert decision == SecurityDecision.ALLOW

    def test_dos_flood_blocked(self):
        """
        Test: DoS flood pattern should be blocked.

        Attack: Attacker floods BCI with high-frequency signals.
        Defense: Rate limiting detects and blocks flood.
        """
        config = NeurosecurityConfig(
            dos_window_ms=100.0,
            dos_threshold_count=100,
        )
        firewall = NeurosecurityFirewall(config)

        # Send flood of signals (200 in 100ms)
        blocked_count = 0
        for i in range(200):
            signal = NeuralSignal(
                timestamp=i * 0.5,  # 2000 Hz - attack
                amplitude=50.0,
                coherence_score=0.8,
            )
            decision = firewall.validate(signal)
            if decision == SecurityDecision.BLOCK:
                blocked_count += 1

        # Should have blocked many signals
        assert blocked_count > 50


class TestPrivacyProtection:
    """
    Test privacy protection (Kohno eavesdropping defense).

    Reference: Kohno (2009) - eavesdropping extracts private information.
    """

    def test_flag_high_privacy_risk(self):
        """
        Test: Signal with high privacy score should be flagged.

        Privacy score indicates risk of information leakage.
        """
        config = NeurosecurityConfig(
            enable_privacy_filter=True,
            privacy_score_threshold=0.7,
        )
        firewall = NeurosecurityFirewall(config)
        signal = NeuralSignal(
            timestamp=0.0,
            amplitude=50.0,
            coherence_score=0.9,
            privacy_score=0.8,  # High privacy risk
        )
        decision = firewall.validate(signal)
        assert decision == SecurityDecision.FLAG

    def test_allow_low_privacy_risk(self):
        """Signal with low privacy risk should be allowed."""
        config = NeurosecurityConfig(
            enable_privacy_filter=True,
            privacy_score_threshold=0.7,
        )
        firewall = NeurosecurityFirewall(config)
        signal = NeuralSignal(
            timestamp=0.0,
            amplitude=50.0,
            coherence_score=0.9,
            privacy_score=0.2,  # Low privacy risk
        )
        decision = firewall.validate(signal)
        assert decision == SecurityDecision.ALLOW


class TestThreatLogging:
    """Test threat logging and statistics."""

    def test_threat_logged(self):
        """Detected threats should be logged."""
        firewall = NeurosecurityFirewall()
        signal = NeuralSignal(
            timestamp=0.0,
            amplitude=50.0,
            coherence_score=0.2,  # Will be blocked
        )
        firewall.validate(signal)

        assert len(firewall.threat_log) > 0
        assert firewall.threat_log[0].threat_type == ThreatType.ALTERATION

    def test_statistics_updated(self):
        """Statistics should be updated on each validation."""
        firewall = NeurosecurityFirewall()

        # Valid signal
        signal1 = NeuralSignal(timestamp=0.0, amplitude=50.0, coherence_score=0.9)
        firewall.validate(signal1)

        # Invalid signal
        signal2 = NeuralSignal(timestamp=1.0, amplitude=50.0, coherence_score=0.2)
        firewall.validate(signal2)

        stats = firewall.stats
        assert stats["total_processed"] == 2
        assert stats["allowed"] == 1
        assert stats["blocked"] == 1

    def test_threat_summary(self):
        """Should provide threat summary by type."""
        firewall = NeurosecurityFirewall()

        # Alteration threat
        signal1 = NeuralSignal(timestamp=0.0, amplitude=50.0, coherence_score=0.2)
        firewall.validate(signal1)

        summary = firewall.get_threat_summary()
        assert summary[ThreatType.ALTERATION] > 0


class TestCallbacks:
    """Test callback functionality."""

    def test_threat_callback(self):
        """Callback should be invoked on threat detection."""
        firewall = NeurosecurityFirewall()
        callback_invoked = []

        def on_threat(event):
            callback_invoked.append(event)

        firewall.on_threat(on_threat)

        signal = NeuralSignal(timestamp=0.0, amplitude=50.0, coherence_score=0.2)
        firewall.validate(signal)

        assert len(callback_invoked) > 0

    def test_emergency_callback(self):
        """Callback should be invoked on emergency shutoff."""
        config = NeurosecurityConfig(
            shutoff_coherence_threshold=0.1,
            emergency_shutoff_enabled=True,
        )
        firewall = NeurosecurityFirewall(config)
        emergency_invoked = []

        def on_emergency():
            emergency_invoked.append(True)

        firewall.on_emergency(on_emergency)

        signal = NeuralSignal(timestamp=0.0, amplitude=50.0, coherence_score=0.05)
        firewall.validate(signal)

        assert len(emergency_invoked) > 0
