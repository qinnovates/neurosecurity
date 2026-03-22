"""
Neurosecurity Firewall

Layer 8 (Neural Gateway) security implementation based on Kohno's CIA triad
for neural devices.

Validates all signals against:
- Integrity (anti-alteration): Coherence validation, amplitude bounds
- Availability (anti-blocking): Rate limiting, DoS detection
- Confidentiality (anti-eavesdropping): Privacy filtering triggers

Reference:
    Denning, T., Matsuoka, Y., & Kohno, T. (2009). Neurosecurity: Security
    and privacy for neural devices. Neurosurgical Focus, 27(1), E7.
"""

from dataclasses import dataclass, field
from typing import Optional, List, Dict, Callable
from datetime import datetime
import time

from .threats import ThreatType, SecurityDecision, AttackSeverity


@dataclass
class NeurosecurityConfig:
    """
    Configuration for the neurosecurity firewall.

    Based on recommendations from Kohno (2009) and practical BCI constraints.
    """

    # Integrity (Anti-Alteration) settings
    coherence_threshold: float = 0.5
    """Minimum coherence score (Cₛ) for signal acceptance."""

    max_amplitude_uv: float = 500.0
    """Maximum safe amplitude in microvolts."""

    min_amplitude_uv: float = 1.0
    """Minimum detectable amplitude in microvolts."""

    max_frequency_hz: float = 300.0
    """Maximum biologically plausible frequency."""

    # Availability (Anti-Blocking) settings
    max_signal_rate_hz: float = 30000.0
    """Maximum signal rate before DoS detection triggers."""

    min_signal_rate_hz: float = 100.0
    """Minimum expected signal rate (gap detection)."""

    dos_window_ms: float = 100.0
    """Time window for DoS detection in milliseconds."""

    dos_threshold_count: int = 5000
    """Number of signals in window to trigger DoS alert."""

    max_gap_ms: float = 500.0
    """Maximum allowed gap between signals."""

    # Confidentiality (Anti-Eavesdropping) settings
    enable_privacy_filter: bool = True
    """Enable privacy filtering at L13-L14."""

    privacy_score_threshold: float = 0.7
    """Privacy score threshold for flagging."""

    # Emergency response settings
    emergency_shutoff_enabled: bool = True
    """Enable hardware emergency shutoff."""

    shutoff_coherence_threshold: float = 0.1
    """Coherence threshold for emergency shutoff."""

    shutoff_amplitude_threshold: float = 1000.0
    """Amplitude threshold for emergency shutoff."""

    # Logging
    log_all_decisions: bool = False
    """Log all decisions (verbose)."""

    log_threats_only: bool = True
    """Log only detected threats."""


@dataclass
class NeuralSignal:
    """
    Represents a neural signal being validated.

    Attributes match what's needed for Kohno CIA validation.
    """

    timestamp: float
    """Signal timestamp in milliseconds."""

    amplitude: float
    """Signal amplitude in microvolts."""

    frequency: float = 0.0
    """Dominant frequency in Hz."""

    coherence_score: float = 1.0
    """Coherence score (Cₛ) from ONI coherence module."""

    privacy_score: float = 0.0
    """Privacy score (Pₛ) from anonymizer."""

    source: str = "unknown"
    """Signal source identifier."""

    authenticated: bool = False
    """Whether signal source is authenticated."""

    channel: int = 0
    """Electrode channel number."""

    data: Optional[List[float]] = None
    """Raw signal data if available."""


@dataclass
class ThreatEvent:
    """Record of a detected threat."""

    timestamp: datetime
    threat_type: ThreatType
    severity: AttackSeverity
    message: str
    signal_info: Dict
    decision: SecurityDecision


class NeurosecurityFirewall:
    """
    Layer 8 Neural Gateway implementing Kohno's neurosecurity principles.

    Validates all signals crossing the silicon-biology boundary against
    the three threat categories: alteration, blocking, and eavesdropping.

    Example:
        >>> firewall = NeurosecurityFirewall()
        >>> signal = NeuralSignal(timestamp=0, amplitude=50, coherence_score=0.8)
        >>> decision = firewall.validate(signal)
        >>> print(decision)  # SecurityDecision.ALLOW

    Reference:
        Denning, T., Matsuoka, Y., & Kohno, T. (2009). Neurosecurity:
        Security and privacy for neural devices. Neurosurgical Focus, 27(1), E7.
    """

    def __init__(self, config: Optional[NeurosecurityConfig] = None):
        """
        Initialize the firewall.

        Args:
            config: Configuration settings. Defaults to NeurosecurityConfig().
        """
        self.config = config or NeurosecurityConfig()
        self._signal_history: List[float] = []
        self._last_signal_time: float = 0.0
        self._threat_log: List[ThreatEvent] = []
        self._emergency_triggered: bool = False
        self._callbacks: Dict[str, List[Callable]] = {
            "threat_detected": [],
            "emergency_shutoff": [],
        }

        # Statistics
        self._stats = {
            "total_processed": 0,
            "allowed": 0,
            "blocked": 0,
            "flagged": 0,
            "emergency_shutoffs": 0,
        }

    @property
    def threat_log(self) -> List[ThreatEvent]:
        """Get the log of detected threats."""
        return self._threat_log

    @property
    def emergency_triggered(self) -> bool:
        """Check if emergency shutoff has been triggered."""
        return self._emergency_triggered

    @property
    def stats(self) -> Dict[str, int]:
        """Get processing statistics."""
        return self._stats.copy()

    def on_threat(self, callback: Callable[[ThreatEvent], None]) -> None:
        """Register callback for threat detection events."""
        self._callbacks["threat_detected"].append(callback)

    def on_emergency(self, callback: Callable[[], None]) -> None:
        """Register callback for emergency shutoff events."""
        self._callbacks["emergency_shutoff"].append(callback)

    def validate(self, signal: NeuralSignal) -> SecurityDecision:
        """
        Validate a signal against all Kohno threat categories.

        This is the main entry point for signal validation.

        Args:
            signal: The neural signal to validate.

        Returns:
            SecurityDecision indicating whether to allow, block, flag,
            or trigger emergency shutoff.
        """
        self._stats["total_processed"] += 1
        threats_detected: List[ThreatType] = []

        # Check ALTERATION threats (Integrity)
        alteration_result = self._check_integrity(signal)
        if alteration_result:
            threats_detected.append(ThreatType.ALTERATION)

        # Check BLOCKING threats (Availability)
        blocking_result = self._check_availability(signal)
        if blocking_result:
            threats_detected.append(ThreatType.BLOCKING)

        # Check EAVESDROPPING protection (Confidentiality)
        eavesdrop_result = self._check_confidentiality(signal)
        if eavesdrop_result:
            threats_detected.append(ThreatType.EAVESDROPPING)

        # Determine decision
        decision = self._make_decision(signal, threats_detected)

        # Update statistics
        if decision == SecurityDecision.ALLOW:
            self._stats["allowed"] += 1
        elif decision == SecurityDecision.BLOCK:
            self._stats["blocked"] += 1
        elif decision == SecurityDecision.FLAG:
            self._stats["flagged"] += 1
        elif decision == SecurityDecision.EMERGENCY_SHUTOFF:
            self._stats["emergency_shutoffs"] += 1

        # Update last signal time
        self._last_signal_time = signal.timestamp

        return decision

    def _check_integrity(self, signal: NeuralSignal) -> Optional[str]:
        """
        Check for ALTERATION threats (Kohno integrity attacks).

        Returns:
            Error message if threat detected, None otherwise.
        """
        # Coherence validation
        if signal.coherence_score < self.config.coherence_threshold:
            msg = f"Low coherence: {signal.coherence_score:.3f} < {self.config.coherence_threshold}"
            self._log_threat(ThreatType.ALTERATION, AttackSeverity.HIGH, msg, signal)
            return msg

        # Amplitude bounds (upper)
        if signal.amplitude > self.config.max_amplitude_uv:
            msg = f"Amplitude too high: {signal.amplitude} > {self.config.max_amplitude_uv} uV"
            self._log_threat(ThreatType.ALTERATION, AttackSeverity.CRITICAL, msg, signal)
            return msg

        # Amplitude bounds (lower)
        if signal.amplitude < self.config.min_amplitude_uv:
            msg = f"Amplitude too low: {signal.amplitude} < {self.config.min_amplitude_uv} uV"
            self._log_threat(ThreatType.ALTERATION, AttackSeverity.MEDIUM, msg, signal)
            return msg

        # Frequency bounds
        if signal.frequency > self.config.max_frequency_hz:
            msg = f"Frequency too high: {signal.frequency} > {self.config.max_frequency_hz} Hz"
            self._log_threat(ThreatType.ALTERATION, AttackSeverity.HIGH, msg, signal)
            return msg

        return None

    def _check_availability(self, signal: NeuralSignal) -> Optional[str]:
        """
        Check for BLOCKING threats (Kohno availability attacks).

        Returns:
            Error message if threat detected, None otherwise.
        """
        # Add to history
        self._signal_history.append(signal.timestamp)

        # Clean old entries outside window
        window_start = signal.timestamp - self.config.dos_window_ms
        self._signal_history = [t for t in self._signal_history if t > window_start]

        # Check for DoS pattern (signal flooding)
        if len(self._signal_history) > self.config.dos_threshold_count:
            msg = f"DoS pattern: {len(self._signal_history)} signals in {self.config.dos_window_ms}ms"
            self._log_threat(ThreatType.BLOCKING, AttackSeverity.CRITICAL, msg, signal)
            return msg

        # Check for signal gap (blocking)
        if self._last_signal_time > 0:
            gap = signal.timestamp - self._last_signal_time
            if gap > self.config.max_gap_ms:
                msg = f"Signal gap detected: {gap:.1f}ms > {self.config.max_gap_ms}ms"
                self._log_threat(ThreatType.BLOCKING, AttackSeverity.MEDIUM, msg, signal)
                # Don't return - gaps are logged but signal is still processed

        return None

    def _check_confidentiality(self, signal: NeuralSignal) -> Optional[str]:
        """
        Check for EAVESDROPPING threats (Kohno confidentiality attacks).

        Returns:
            Error message if threat detected, None otherwise.
        """
        if not self.config.enable_privacy_filter:
            return None

        # Check privacy score
        if signal.privacy_score > self.config.privacy_score_threshold:
            msg = f"Privacy risk: score {signal.privacy_score:.3f} > {self.config.privacy_score_threshold}"
            self._log_threat(ThreatType.EAVESDROPPING, AttackSeverity.HIGH, msg, signal)
            return msg

        return None

    def _make_decision(
        self, signal: NeuralSignal, threats: List[ThreatType]
    ) -> SecurityDecision:
        """
        Make final security decision based on detected threats.

        Decision priority:
        1. Emergency shutoff for critical integrity violations
        2. Block for integrity or availability threats
        3. Flag for confidentiality threats (allow but monitor)
        4. Allow if no threats
        """
        if not threats:
            return SecurityDecision.ALLOW

        # Check for emergency shutoff conditions
        if self.config.emergency_shutoff_enabled:
            if signal.coherence_score < self.config.shutoff_coherence_threshold:
                self._trigger_emergency("Critically low coherence")
                return SecurityDecision.EMERGENCY_SHUTOFF

            if signal.amplitude > self.config.shutoff_amplitude_threshold:
                self._trigger_emergency("Dangerous amplitude")
                return SecurityDecision.EMERGENCY_SHUTOFF

        # Integrity violations -> BLOCK
        if ThreatType.ALTERATION in threats:
            return SecurityDecision.BLOCK

        # Availability violations -> BLOCK
        if ThreatType.BLOCKING in threats:
            return SecurityDecision.BLOCK

        # Confidentiality violations -> FLAG (allow but monitor)
        if ThreatType.EAVESDROPPING in threats:
            return SecurityDecision.FLAG

        return SecurityDecision.ALLOW

    def _log_threat(
        self,
        threat_type: ThreatType,
        severity: AttackSeverity,
        message: str,
        signal: NeuralSignal,
    ) -> None:
        """Log a detected threat and notify callbacks."""
        event = ThreatEvent(
            timestamp=datetime.now(),
            threat_type=threat_type,
            severity=severity,
            message=message,
            signal_info={
                "timestamp": signal.timestamp,
                "amplitude": signal.amplitude,
                "coherence": signal.coherence_score,
                "channel": signal.channel,
            },
            decision=SecurityDecision.BLOCK,  # Updated later
        )
        self._threat_log.append(event)

        # Notify callbacks
        for callback in self._callbacks["threat_detected"]:
            try:
                callback(event)
            except Exception:  # nosec B110
                pass  # Don't let callback errors affect security

    def _trigger_emergency(self, reason: str) -> None:
        """Trigger emergency shutoff."""
        self._emergency_triggered = True

        # Notify callbacks
        for callback in self._callbacks["emergency_shutoff"]:
            try:
                callback()
            except Exception:  # nosec B110
                pass  # Safety-critical - must complete

    def reset(self) -> None:
        """Reset firewall state (for testing or recovery)."""
        self._signal_history.clear()
        self._last_signal_time = 0.0
        self._emergency_triggered = False

    def reset_stats(self) -> None:
        """Reset statistics counters."""
        for key in self._stats:
            self._stats[key] = 0

    def get_threat_summary(self) -> Dict[ThreatType, int]:
        """Get count of threats by type."""
        summary = {t: 0 for t in ThreatType}
        for event in self._threat_log:
            summary[event.threat_type] += 1
        return summary
