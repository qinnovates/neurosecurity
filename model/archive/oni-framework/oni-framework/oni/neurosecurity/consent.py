"""
Consent Validation Module

Implements consent state tracking and validation for ONI-compliant neural devices.
Based on informed consent research by Lázaro-Muñoz et al. (2020, 2022) at
Harvard Medical School and Massachusetts General Hospital.

Key Principles:
- Consent is non-negotiable: quality doesn't imply permission
- Continuous consent: neural devices require ongoing authorization
- Revocation rights: users can withdraw consent at any time
- Stakeholder awareness: multiple parties may have legitimate interests

Reference:
    Lázaro-Muñoz, G., et al. (2020). Researcher Perspectives on Ethical
    Considerations in Adaptive Deep Brain Stimulation Trials.
    Frontiers in Human Neuroscience, 14, 578695.
"""

from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum, auto
from typing import Optional, List, Dict, Set, Callable
import hashlib


class ConsentState(Enum):
    """
    Consent states for neural device operation.

    Based on continuous consent model from Lázaro-Muñoz framework.
    """

    NOT_OBTAINED = auto()
    """No consent obtained - device cannot activate."""

    INITIAL_ONLY = auto()
    """Basic consent obtained - limited operations permitted."""

    FULL_CONSENT = auto()
    """Full informed consent - all authorized operations permitted."""

    REVOKED = auto()
    """Consent explicitly revoked - device must cease operations."""

    EXPIRED = auto()
    """Consent period expired - re-consent required."""

    SUSPENDED = auto()
    """Temporarily suspended by user - awaiting resume."""


class PediatricConsentState(Enum):
    """
    Extended consent states for pediatric and incapacity populations.

    Reference: Muñoz, K. A., & Lázaro-Muñoz, G. (2020). Pediatric Deep Brain
    Stimulation for Dystonia. Cambridge Quarterly of Healthcare Ethics.
    """

    NO_CONSENT = auto()
    """No consent obtained."""

    GUARDIAN_ONLY = auto()
    """Young child - guardian consent only (age 0-6)."""

    GUARDIAN_PLUS_ASSENT = auto()
    """Minor with assent - guardian consent plus child assent (age 7-17)."""

    TRANSITIONAL = auto()
    """Increasing autonomy phase (age 16-17)."""

    ADULT_FULL = auto()
    """Full adult consent (age 18+)."""

    SURROGATE = auto()
    """Adult with incapacity - surrogate decision-maker."""

    SUPPORTED = auto()
    """Supported decision-making - partial capacity."""


class ConsentScope(Enum):
    """
    Scope of consent - what operations are authorized.

    Matches consent record requirements from INFORMED_CONSENT_FRAMEWORK.md.
    """

    SIGNAL_READING = auto()
    """Read neural signals (input)."""

    SIGNAL_MODIFICATION = auto()
    """Modify/stimulate neural signals (output)."""

    DATA_STORAGE_LOCAL = auto()
    """Store data on device."""

    DATA_TRANSMISSION = auto()
    """Transmit data externally."""

    ADAPTIVE_BEHAVIOR = auto()
    """Allow autonomous device adjustments."""

    RESEARCH_USE = auto()
    """Use data for research purposes."""


@dataclass
class ConsentRecord:
    """
    Immutable record of consent authorization.

    Attributes match minimum information set from INFORMED_CONSENT_FRAMEWORK.md.
    """

    record_id: str
    """Unique identifier for this consent record."""

    device_id: str
    """Device this consent applies to."""

    user_id: str
    """Pseudonymous user identifier."""

    consent_date: datetime
    """When consent was obtained."""

    consent_version: str
    """Version of consent form used."""

    authorized_scopes: Set[ConsentScope]
    """Which operations are authorized."""

    expiration_date: Optional[datetime] = None
    """When consent expires (None = until revoked)."""

    authorized_stakeholders: Dict[str, str] = field(default_factory=dict)
    """Stakeholder ID -> relationship mapping."""

    acknowledgments: Dict[str, bool] = field(default_factory=dict)
    """Acknowledgment flags (therapeutic_misconception, post_trial, etc.)."""

    pediatric_state: Optional[PediatricConsentState] = None
    """Pediatric consent state if applicable."""

    guardian_id: Optional[str] = None
    """Guardian identifier for pediatric cases."""

    assent_documented: bool = False
    """Whether minor's assent was obtained."""

    revocation_date: Optional[datetime] = None
    """When consent was revoked (if applicable)."""

    revocation_reason: Optional[str] = None
    """Reason for revocation (if applicable)."""

    def __post_init__(self):
        """Validate consent record."""
        if not self.authorized_scopes:
            raise ValueError("Consent must authorize at least one scope")

        # Generate record ID if not provided
        if not self.record_id:
            hash_input = f"{self.device_id}:{self.user_id}:{self.consent_date.isoformat()}"
            self.record_id = hashlib.sha256(hash_input.encode()).hexdigest()[:16]

    @property
    def is_valid(self) -> bool:
        """Check if consent is currently valid."""
        if self.revocation_date is not None:
            return False

        if self.expiration_date and datetime.now() > self.expiration_date:
            return False

        return True

    @property
    def state(self) -> ConsentState:
        """Get current consent state."""
        if self.revocation_date is not None:
            return ConsentState.REVOKED

        if self.expiration_date and datetime.now() > self.expiration_date:
            return ConsentState.EXPIRED

        if len(self.authorized_scopes) == len(ConsentScope):
            return ConsentState.FULL_CONSENT

        return ConsentState.INITIAL_ONLY


@dataclass
class ConsentValidationResult:
    """Result of consent validation check."""

    is_valid: bool
    """Whether consent is valid for the requested operation."""

    state: ConsentState
    """Current consent state."""

    reason: str
    """Explanation of validation result."""

    missing_scopes: Set[ConsentScope] = field(default_factory=set)
    """Scopes required but not authorized."""

    requires_reconsent: bool = False
    """Whether re-consent is required to proceed."""


class ConsentManager:
    """
    Manages consent state for ONI-compliant devices.

    Implements continuous consent model with support for:
    - Consent recording and tracking
    - Scope-based authorization
    - Revocation and suspension
    - Expiration monitoring
    - Stakeholder access control

    Example:
        >>> manager = ConsentManager(device_id="oni-001")
        >>> record = manager.record_consent(
        ...     user_id="user-123",
        ...     scopes={ConsentScope.SIGNAL_READING, ConsentScope.DATA_STORAGE_LOCAL}
        ... )
        >>> result = manager.validate(ConsentScope.SIGNAL_READING)
        >>> print(result.is_valid)  # True

    Reference:
        INFORMED_CONSENT_FRAMEWORK.md
    """

    def __init__(self, device_id: str):
        """
        Initialize consent manager.

        Args:
            device_id: Unique identifier for this device.
        """
        self.device_id = device_id
        self._active_consent: Optional[ConsentRecord] = None
        self._consent_history: List[ConsentRecord] = []
        self._callbacks: Dict[str, List[Callable]] = {
            "consent_granted": [],
            "consent_revoked": [],
            "consent_expired": [],
        }

    @property
    def current_state(self) -> ConsentState:
        """Get current consent state."""
        if self._active_consent is None:
            return ConsentState.NOT_OBTAINED

        return self._active_consent.state

    @property
    def active_consent(self) -> Optional[ConsentRecord]:
        """Get active consent record."""
        return self._active_consent

    def record_consent(
        self,
        user_id: str,
        scopes: Set[ConsentScope],
        consent_version: str = "1.0",
        expiration_days: Optional[int] = None,
        stakeholders: Optional[Dict[str, str]] = None,
        acknowledgments: Optional[Dict[str, bool]] = None,
        pediatric_state: Optional[PediatricConsentState] = None,
        guardian_id: Optional[str] = None,
        assent_documented: bool = False,
    ) -> ConsentRecord:
        """
        Record new consent authorization.

        Args:
            user_id: Pseudonymous user identifier.
            scopes: Set of authorized operation scopes.
            consent_version: Version of consent form.
            expiration_days: Days until consent expires (None = no expiration).
            stakeholders: Authorized stakeholder mappings.
            acknowledgments: Acknowledgment flags.
            pediatric_state: Pediatric consent state if applicable.
            guardian_id: Guardian identifier for pediatric cases.
            assent_documented: Whether minor's assent was obtained.

        Returns:
            The created consent record.
        """
        expiration = None
        if expiration_days:
            expiration = datetime.now() + timedelta(days=expiration_days)

        record = ConsentRecord(
            record_id="",  # Auto-generated
            device_id=self.device_id,
            user_id=user_id,
            consent_date=datetime.now(),
            consent_version=consent_version,
            authorized_scopes=scopes,
            expiration_date=expiration,
            authorized_stakeholders=stakeholders or {},
            acknowledgments=acknowledgments or {},
            pediatric_state=pediatric_state,
            guardian_id=guardian_id,
            assent_documented=assent_documented,
        )

        # Archive previous consent
        if self._active_consent:
            self._consent_history.append(self._active_consent)

        self._active_consent = record

        # Notify callbacks
        self._notify("consent_granted", record)

        return record

    def validate(
        self,
        required_scope: ConsentScope,
        stakeholder_id: Optional[str] = None,
    ) -> ConsentValidationResult:
        """
        Validate consent for a specific operation.

        Args:
            required_scope: The operation scope to validate.
            stakeholder_id: If provided, validate stakeholder access.

        Returns:
            Validation result with details.
        """
        if self._active_consent is None:
            return ConsentValidationResult(
                is_valid=False,
                state=ConsentState.NOT_OBTAINED,
                reason="No consent record exists",
                requires_reconsent=True,
            )

        # Check revocation
        if self._active_consent.revocation_date is not None:
            return ConsentValidationResult(
                is_valid=False,
                state=ConsentState.REVOKED,
                reason=f"Consent revoked: {self._active_consent.revocation_reason or 'No reason given'}",
                requires_reconsent=True,
            )

        # Check expiration
        if (
            self._active_consent.expiration_date
            and datetime.now() > self._active_consent.expiration_date
        ):
            self._notify("consent_expired", self._active_consent)
            return ConsentValidationResult(
                is_valid=False,
                state=ConsentState.EXPIRED,
                reason="Consent has expired",
                requires_reconsent=True,
            )

        # Check scope authorization
        if required_scope not in self._active_consent.authorized_scopes:
            return ConsentValidationResult(
                is_valid=False,
                state=self._active_consent.state,
                reason=f"Scope {required_scope.name} not authorized",
                missing_scopes={required_scope},
                requires_reconsent=True,
            )

        # Check stakeholder authorization
        if stakeholder_id:
            if stakeholder_id not in self._active_consent.authorized_stakeholders:
                return ConsentValidationResult(
                    is_valid=False,
                    state=self._active_consent.state,
                    reason=f"Stakeholder {stakeholder_id} not authorized",
                )

        return ConsentValidationResult(
            is_valid=True,
            state=self._active_consent.state,
            reason="Consent valid",
        )

    def validate_multiple(
        self, required_scopes: Set[ConsentScope]
    ) -> ConsentValidationResult:
        """
        Validate consent for multiple operation scopes.

        Args:
            required_scopes: Set of operation scopes to validate.

        Returns:
            Validation result with any missing scopes.
        """
        if self._active_consent is None:
            return ConsentValidationResult(
                is_valid=False,
                state=ConsentState.NOT_OBTAINED,
                reason="No consent record exists",
                missing_scopes=required_scopes,
                requires_reconsent=True,
            )

        missing = required_scopes - self._active_consent.authorized_scopes

        if missing:
            return ConsentValidationResult(
                is_valid=False,
                state=self._active_consent.state,
                reason=f"Missing authorization for: {', '.join(s.name for s in missing)}",
                missing_scopes=missing,
                requires_reconsent=True,
            )

        return ConsentValidationResult(
            is_valid=True,
            state=self._active_consent.state,
            reason="All scopes authorized",
        )

    def revoke(self, reason: Optional[str] = None) -> bool:
        """
        Revoke current consent.

        Per INFORMED_CONSENT_FRAMEWORK.md: Users must retain the ability
        to revoke consent at any time.

        Args:
            reason: Optional reason for revocation.

        Returns:
            True if consent was revoked, False if no active consent.
        """
        if self._active_consent is None:
            return False

        self._active_consent.revocation_date = datetime.now()
        self._active_consent.revocation_reason = reason

        # Notify callbacks
        self._notify("consent_revoked", self._active_consent)

        # Archive revoked consent
        self._consent_history.append(self._active_consent)
        self._active_consent = None

        return True

    def suspend(self) -> bool:
        """
        Temporarily suspend consent (user-initiated pause).

        Returns:
            True if suspended, False if no active consent.
        """
        # For suspension, we don't archive - we just mark state
        # This is implemented via a flag on active consent
        if self._active_consent is None:
            return False

        # Suspension is tracked separately from revocation
        # A suspended consent can be resumed
        self._suspended = True
        return True

    def resume(self) -> bool:
        """
        Resume suspended consent.

        Returns:
            True if resumed, False if not suspended or no consent.
        """
        if self._active_consent is None or not getattr(self, "_suspended", False):
            return False

        self._suspended = False
        return True

    def on_consent_granted(self, callback: Callable[[ConsentRecord], None]) -> None:
        """Register callback for consent granted events."""
        self._callbacks["consent_granted"].append(callback)

    def on_consent_revoked(self, callback: Callable[[ConsentRecord], None]) -> None:
        """Register callback for consent revoked events."""
        self._callbacks["consent_revoked"].append(callback)

    def on_consent_expired(self, callback: Callable[[ConsentRecord], None]) -> None:
        """Register callback for consent expired events."""
        self._callbacks["consent_expired"].append(callback)

    def _notify(self, event: str, record: ConsentRecord) -> None:
        """Notify registered callbacks."""
        for callback in self._callbacks.get(event, []):
            try:
                callback(record)
            except Exception:  # nosec B110
                pass  # Don't let callback errors affect consent management

    def get_history(self) -> List[ConsentRecord]:
        """Get consent history for audit purposes."""
        return self._consent_history.copy()


class ConsentValidator:
    """
    Stateless consent validation for integration with NeurosecurityFirewall.

    Provides consent checks that can be integrated into firewall decision logic.

    Example:
        >>> validator = ConsentValidator(manager)
        >>> if validator.requires_consent(signal):
        ...     if not validator.is_consented(signal, ConsentScope.SIGNAL_READING):
        ...         return SecurityDecision.BLOCK
    """

    def __init__(self, manager: ConsentManager):
        """
        Initialize validator.

        Args:
            manager: ConsentManager instance to validate against.
        """
        self.manager = manager

    def requires_consent(self, signal) -> bool:
        """
        Check if a signal operation requires consent.

        Currently, all signal operations require consent per
        NEUROETHICS_ALIGNMENT.md principle: "Consent is non-negotiable."

        Args:
            signal: NeuralSignal to check.

        Returns:
            True (consent always required for neural signals).
        """
        return True

    def is_consented(
        self, signal, scope: ConsentScope, stakeholder_id: Optional[str] = None
    ) -> bool:
        """
        Check if consent exists for an operation.

        Args:
            signal: NeuralSignal being processed.
            scope: Required operation scope.
            stakeholder_id: Optional stakeholder to validate.

        Returns:
            True if consent is valid for the operation.
        """
        result = self.manager.validate(scope, stakeholder_id)
        return result.is_valid

    def get_blocked_reason(self, scope: ConsentScope) -> str:
        """
        Get reason for consent block.

        Args:
            scope: The scope that was blocked.

        Returns:
            Human-readable reason string.
        """
        result = self.manager.validate(scope)
        return result.reason
