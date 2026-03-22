"""
Neural Firewall Module

Implements signal filtering based on coherence scores at the Neural Gateway (L8).
Provides zero-trust security validation for brain-computer interface signals.

===============================================================================
IMPORTANT: FOR NON-TECHNICAL COLLABORATORS
===============================================================================
This module acts like a security guard for neural signals.

WHAT IT DOES:
- Takes a signal (timing data + amplitudes + whether source is verified)
- Calculates a coherence/trust score
- Decides: ACCEPT (let it through), ACCEPT_FLAG (let through but log), or REJECT

REAL-WORLD ANALOGY:
Like a firewall on your computer that blocks suspicious network traffic, this
would block suspicious neural signals before they reach the brain or before
fake brain signals are processed by a computer.

THIS IS A SIMULATION/FRAMEWORK:
- It does NOT connect to any hardware
- The "signals" are data YOU provide (from a real BCI device, if you have one)
- It demonstrates the logic that WOULD be used in a real security system

DECISION MATRIX (how it decides):
┌────────────────┬──────────────┬─────────────────────┐
│ Coherence Score│ Authenticated│ Decision            │
├────────────────┼──────────────┼─────────────────────┤
│ High (>0.6)    │ Yes          │ ACCEPT              │
│ High (>0.6)    │ No           │ REJECT + alert      │
│ Medium (0.3-0.6│ Yes          │ ACCEPT + flag       │
│ Medium         │ No           │ REJECT + alert      │
│ Low (<0.3)     │ Any          │ REJECT + critical   │
└────────────────┴──────────────┴─────────────────────┘
===============================================================================

Reference: TechDoc-Neural_Firewall_Architecture.md
"""

from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum, auto
from typing import List, Optional, Callable, Dict, Any

from .coherence import CoherenceMetric, VarianceComponents


class Decision(Enum):
    """Firewall decision outcomes."""
    ACCEPT = auto()
    ACCEPT_FLAG = auto()
    REJECT = auto()


class AlertLevel(Enum):
    """Alert severity levels."""
    NONE = auto()
    ROUTINE = auto()
    ENHANCED = auto()
    ALERT = auto()
    CRITICAL = auto()


@dataclass
class Signal:
    """
    Represents a signal to be validated by the firewall.

    Attributes:
        arrival_times: Timestamps of signal events (seconds)
        amplitudes: Signal amplitudes at each event
        authenticated: Whether signal has valid authentication
        source_id: Optional identifier for signal source
        metadata: Additional signal metadata
    """
    arrival_times: List[float]
    amplitudes: List[float]
    authenticated: bool = False
    source_id: Optional[str] = None
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class FilterResult:
    """
    Result of firewall signal filtering.

    Attributes:
        decision: Accept, accept with flag, or reject
        coherence: Calculated coherence score
        variances: Individual variance components
        alert_level: Severity of logging/alerting
        reason: Human-readable explanation
        timestamp: When the decision was made
    """
    decision: Decision
    coherence: float
    variances: VarianceComponents
    alert_level: AlertLevel
    reason: str
    timestamp: datetime = field(default_factory=datetime.now)

    @property
    def accepted(self) -> bool:
        """Whether the signal was accepted (with or without flag)."""
        return self.decision in (Decision.ACCEPT, Decision.ACCEPT_FLAG)

    @property
    def rejected(self) -> bool:
        """Whether the signal was rejected."""
        return self.decision == Decision.REJECT

    @property
    def flagged(self) -> bool:
        """Whether the signal was flagged for review."""
        return self.decision == Decision.ACCEPT_FLAG


class NeuralFirewall:
    """
    Zero-trust neural signal firewall operating at ONI Layer 8.

    Validates signals using coherence metrics and authentication status.
    Implements the defense-in-depth principle with multiple validation layers.

    Example:
        >>> firewall = NeuralFirewall(threshold_high=0.6, threshold_low=0.3)
        >>> signal = Signal(
        ...     arrival_times=[0.0, 0.025, 0.050],
        ...     amplitudes=[100, 98, 102],
        ...     authenticated=True
        ... )
        >>> result = firewall.filter(signal)
        >>> print(f"Decision: {result.decision.name}, Cs={result.coherence:.3f}")
    """

    def __init__(
        self,
        threshold_high: float = 0.6,
        threshold_low: float = 0.3,
        reference_freq: float = 40.0,
        amplitude_bounds: Optional[tuple] = None,
        rate_limit: Optional[int] = None,
    ):
        """
        Initialize the neural firewall.

        Args:
            threshold_high: Coherence threshold for unconditional accept (default: 0.6)
            threshold_low: Coherence threshold below which to reject (default: 0.3)
            reference_freq: Reference oscillation frequency for phase calculation
            amplitude_bounds: Optional (min, max) amplitude bounds for hard limits
            rate_limit: Optional maximum signals per second
        """
        if threshold_low >= threshold_high:
            raise ValueError("threshold_low must be less than threshold_high")
        if not (0 < threshold_low < 1 and 0 < threshold_high < 1):
            raise ValueError("Thresholds must be between 0 and 1")

        self.threshold_high = threshold_high
        self.threshold_low = threshold_low
        self.amplitude_bounds = amplitude_bounds
        self.rate_limit = rate_limit

        self._coherence_metric = CoherenceMetric(reference_freq=reference_freq)
        self._signal_log: List[FilterResult] = []
        self._callbacks: Dict[AlertLevel, List[Callable]] = {
            level: [] for level in AlertLevel
        }

    def filter(self, signal: Signal) -> FilterResult:
        """
        Filter a signal through the firewall.

        Applies coherence validation and authentication checks to determine
        whether to accept, flag, or reject the signal.

        Args:
            signal: Signal to validate

        Returns:
            FilterResult with decision, coherence score, and alert level
        """
        # Check hardware bounds first (fast path rejection)
        if self.amplitude_bounds:
            min_amp, max_amp = self.amplitude_bounds
            if any(a < min_amp or a > max_amp for a in signal.amplitudes):
                result = FilterResult(
                    decision=Decision.REJECT,
                    coherence=0.0,
                    variances=VarianceComponents(phase=0, transport=0, gain=float('inf')),
                    alert_level=AlertLevel.CRITICAL,
                    reason=f"Amplitude outside hardware bounds [{min_amp}, {max_amp}]",
                )
                self._log_and_alert(result)
                return result

        # Calculate coherence
        variances = self._coherence_metric.calculate_variances(
            signal.arrival_times,
            signal.amplitudes,
        )
        coherence = self._coherence_metric.calculate(
            signal.arrival_times,
            signal.amplitudes,
        )

        # Apply decision matrix
        decision, alert_level, reason = self._apply_decision_matrix(
            coherence, signal.authenticated
        )

        result = FilterResult(
            decision=decision,
            coherence=coherence,
            variances=variances,
            alert_level=alert_level,
            reason=reason,
        )

        self._log_and_alert(result)
        return result

    def _apply_decision_matrix(
        self,
        coherence: float,
        authenticated: bool,
    ) -> tuple:
        """
        Apply the firewall decision matrix.

        Returns:
            Tuple of (Decision, AlertLevel, reason_string)
        """
        if coherence > self.threshold_high:
            # High coherence
            if authenticated:
                return (
                    Decision.ACCEPT,
                    AlertLevel.ROUTINE,
                    f"High coherence ({coherence:.3f}) with valid authentication",
                )
            else:
                return (
                    Decision.REJECT,
                    AlertLevel.ALERT,
                    f"High coherence ({coherence:.3f}) but missing authentication",
                )

        elif coherence > self.threshold_low:
            # Medium coherence
            if authenticated:
                return (
                    Decision.ACCEPT_FLAG,
                    AlertLevel.ENHANCED,
                    f"Medium coherence ({coherence:.3f}), flagged for review",
                )
            else:
                return (
                    Decision.REJECT,
                    AlertLevel.ALERT,
                    f"Medium coherence ({coherence:.3f}) without authentication",
                )

        else:
            # Low coherence - reject regardless of authentication
            return (
                Decision.REJECT,
                AlertLevel.CRITICAL,
                f"Low coherence ({coherence:.3f}), signal incoherent",
            )

    def _log_and_alert(self, result: FilterResult):
        """Log the result and trigger any registered callbacks."""
        self._signal_log.append(result)

        # Trigger callbacks for this alert level and above
        for level in AlertLevel:
            if level.value >= result.alert_level.value:
                for callback in self._callbacks.get(level, []):
                    callback(result)

    def register_callback(
        self,
        alert_level: AlertLevel,
        callback: Callable[[FilterResult], None],
    ):
        """
        Register a callback for a specific alert level.

        Callbacks are triggered when a signal generates an alert at or above
        the specified level.

        Args:
            alert_level: Minimum alert level to trigger callback
            callback: Function to call with FilterResult
        """
        self._callbacks[alert_level].append(callback)

    def filter_batch(self, signals: List[Signal]) -> List[FilterResult]:
        """
        Filter multiple signals.

        Args:
            signals: List of signals to validate

        Returns:
            List of FilterResults in same order
        """
        return [self.filter(signal) for signal in signals]

    def get_stats(self) -> Dict[str, Any]:
        """
        Get firewall statistics.

        Returns:
            Dict with accept/reject counts, average coherence, etc.
        """
        if not self._signal_log:
            return {
                "total": 0,
                "accepted": 0,
                "rejected": 0,
                "flagged": 0,
                "avg_coherence": 0.0,
            }

        accepted = sum(1 for r in self._signal_log if r.accepted)
        rejected = sum(1 for r in self._signal_log if r.rejected)
        flagged = sum(1 for r in self._signal_log if r.flagged)
        avg_coherence = sum(r.coherence for r in self._signal_log) / len(self._signal_log)

        return {
            "total": len(self._signal_log),
            "accepted": accepted,
            "rejected": rejected,
            "flagged": flagged,
            "accept_rate": accepted / len(self._signal_log),
            "reject_rate": rejected / len(self._signal_log),
            "avg_coherence": avg_coherence,
            "alerts": {
                level.name: sum(1 for r in self._signal_log if r.alert_level == level)
                for level in AlertLevel
            },
        }

    def clear_log(self):
        """Clear the signal log."""
        self._signal_log.clear()

    @property
    def log(self) -> List[FilterResult]:
        """Access the signal log (read-only copy)."""
        return list(self._signal_log)
