"""
ONI Neurosecurity Module

Implements neurosecurity principles inspired by foundational BCI security research:

- Kohno et al. (2009): CIA triad for neural devices, threat taxonomy
- Bonaci et al. (2015): Privacy filtering concepts for BCIs

References:
    Denning, T., Matsuoka, Y., & Kohno, T. (2009). Neurosecurity: Security
    and privacy for neural devices. Neurosurgical Focus, 27(1), E7.

    Bonaci, T., Calo, R., & Chizeck, H. J. (2015). App stores for the brain:
    Privacy and security in brain-computer interfaces. IEEE Technology and
    Society Magazine, 34(2), 32-39.
"""

from .threats import ThreatType, SecurityDecision, KohnoThreatModel
from .firewall import NeurosecurityFirewall, NeurosecurityConfig
from .anonymizer import BCIAnonymizer, AnonymizerConfig, ERPType, PrivacySensitivity
from .privacy_score import PrivacyScoreCalculator, PrivacyScoreResult
from .consent import (
    ConsentState,
    PediatricConsentState,
    ConsentScope,
    ConsentRecord,
    ConsentValidationResult,
    ConsentManager,
    ConsentValidator,
)

__all__ = [
    # Threats
    "ThreatType",
    "SecurityDecision",
    "KohnoThreatModel",
    # Firewall
    "NeurosecurityFirewall",
    "NeurosecurityConfig",
    # Anonymizer
    "BCIAnonymizer",
    "AnonymizerConfig",
    "ERPType",
    "PrivacySensitivity",
    # Privacy
    "PrivacyScoreCalculator",
    "PrivacyScoreResult",
    # Consent (Lázaro-Muñoz framework)
    "ConsentState",
    "PediatricConsentState",
    "ConsentScope",
    "ConsentRecord",
    "ConsentValidationResult",
    "ConsentManager",
    "ConsentValidator",
]
