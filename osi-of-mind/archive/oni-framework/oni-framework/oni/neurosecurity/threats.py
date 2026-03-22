"""
Neurosecurity Threat Model

Implements the threat taxonomy from Kohno et al. (2009), which identified
three fundamental attack categories against neural devices:

1. ALTERATION - Modifying neural signals to cause harm
2. BLOCKING - Preventing signal transmission (denial of service)
3. EAVESDROPPING - Intercepting and decoding private neural information

Reference:
    Denning, T., Matsuoka, Y., & Kohno, T. (2009). Neurosecurity: Security
    and privacy for neural devices. Neurosurgical Focus, 27(1), E7.
    https://doi.org/10.3171/2009.4.FOCUS0985
"""

from dataclasses import dataclass, field
from enum import Enum
from typing import List, Dict, Optional


class ThreatType(Enum):
    """
    Kohno's three fundamental attack categories against neural devices.

    These map to the CIA triad:
    - ALTERATION -> Integrity
    - BLOCKING -> Availability
    - EAVESDROPPING -> Confidentiality
    """

    ALTERATION = "alteration"
    """
    Signal modification attacks that alter neural signals to cause harm.

    Examples:
    - Injecting fake motor commands
    - Manipulating stimulation patterns
    - Corrupting calibration data

    Consequence: Involuntary movement, pain, seizure, tissue damage
    """

    BLOCKING = "blocking"
    """
    Denial of service attacks that prevent signal transmission.

    Examples:
    - Signal flooding (DoS)
    - RF jamming
    - Device lockout (ransomware)

    Consequence: Loss of motor control, communication, essential functions
    """

    EAVESDROPPING = "eavesdropping"
    """
    Privacy attacks that intercept and decode neural information.

    Examples:
    - Thought extraction
    - Emotional state inference
    - Memory decoding
    - Biometric theft

    Consequence: Privacy violation, identity theft, coercion
    """


class SecurityDecision(Enum):
    """Firewall decisions based on threat assessment."""

    ALLOW = "allow"
    """Signal passes all security checks."""

    BLOCK = "block"
    """Signal blocked due to detected threat."""

    FLAG = "flag"
    """Signal allowed but flagged for monitoring."""

    EMERGENCY_SHUTOFF = "emergency_shutoff"
    """Critical threat detected - trigger hardware safety cutoff."""


class AttackSeverity(Enum):
    """Severity levels for detected attacks."""

    LOW = 1
    """Minor anomaly, likely benign."""

    MEDIUM = 2
    """Suspicious pattern, requires monitoring."""

    HIGH = 3
    """Confirmed attack pattern."""

    CRITICAL = 4
    """Immediate threat to safety or privacy."""


@dataclass
class ThreatSignature:
    """
    Signature for detecting specific attack patterns.

    Used by the neurosecurity firewall to identify known threats.
    """

    name: str
    """Human-readable name for the threat."""

    threat_type: ThreatType
    """Kohno classification (alteration/blocking/eavesdropping)."""

    severity: AttackSeverity
    """How severe is this threat."""

    description: str
    """Detailed description of the attack."""

    indicators: List[str]
    """Observable indicators of this attack."""

    target_layer: int
    """Primary ONI layer targeted (8-14)."""

    mitre_mapping: Optional[str] = None
    """Mapping to MITRE ATT&CK or similar framework."""

    reference: Optional[str] = None
    """Academic or industry reference."""


@dataclass
class KohnoThreatModel:
    """
    Complete threat model based on Kohno et al. (2009).

    Provides:
    - Threat categorization
    - Attack surface mapping
    - Security property requirements

    Reference:
        "By focusing on neurosecurity issues early, we hope to ensure that
        future neural devices are not only safe, effective, and ethically
        designed, but also robust in the face of adversaries attempting to
        co-opt their operations to perform unintended, unsafe actions."
        - Denning, Matsuoka, & Kohno (2009)
    """

    # CIA triad mapping for neural devices
    security_properties: Dict[ThreatType, str] = field(default_factory=lambda: {
        ThreatType.ALTERATION: "Integrity",
        ThreatType.BLOCKING: "Availability",
        ThreatType.EAVESDROPPING: "Confidentiality",
    })

    # Attack consequences (from Kohno paper)
    consequences: Dict[ThreatType, List[str]] = field(default_factory=lambda: {
        ThreatType.ALTERATION: [
            "Involuntary movement",
            "Unauthorized stimulation",
            "Pain induction",
            "Seizure triggering",
            "Tissue damage",
            "Calibration corruption",
        ],
        ThreatType.BLOCKING: [
            "Loss of motor control",
            "Communication inability",
            "Sensory deprivation",
            "Device lockout",
            "Life-critical function loss",
        ],
        ThreatType.EAVESDROPPING: [
            "Thought extraction",
            "Memory decoding",
            "Emotional profiling",
            "Biometric theft",
            "Cognitive state inference",
            "Deception detection",
        ],
    })

    # Key insight from Kohno
    plasticity_warning: str = (
        "Due to the plasticity of the neural system, changes made by hackers "
        "could have irreversible effects on human performance and cognition."
    )

    def get_defenses(self, threat_type: ThreatType) -> List[str]:
        """
        Get recommended defenses for a threat type.

        Based on Kohno's recommendations plus ONI-specific implementations.
        """
        defenses = {
            ThreatType.ALTERATION: [
                "Coherence Metric (Cₛ) validation",
                "Amplitude bounds enforcement",
                "Timing pattern analysis",
                "Hardware safety limits",
                "Emergency shutoff capability",
            ],
            ThreatType.BLOCKING: [
                "Rate limiting",
                "DoS pattern detection",
                "Redundant communication paths",
                "Offline operation mode",
                "Hardware watchdog timer",
            ],
            ThreatType.EAVESDROPPING: [
                "BCI Anonymizer filtering",
                "Privacy Score (Pₛ) monitoring",
                "ERP component allowlisting",
                "End-to-end encryption",
                "Data minimization",
            ],
        }
        return defenses.get(threat_type, [])


# Predefined threat signatures based on known attack patterns
KNOWN_THREATS: Dict[str, ThreatSignature] = {
    "signal_injection": ThreatSignature(
        name="Signal Injection Attack",
        threat_type=ThreatType.ALTERATION,
        severity=AttackSeverity.CRITICAL,
        description="Attacker injects fake neural signals to trigger involuntary actions",
        indicators=[
            "Low coherence score (Cₛ < 0.3)",
            "Timing anomalies",
            "Amplitude spikes outside normal range",
            "Unrecognized signal patterns",
        ],
        target_layer=8,
        reference="Kohno (2009): alteration attacks",
    ),
    "amplitude_manipulation": ThreatSignature(
        name="Amplitude Manipulation",
        threat_type=ThreatType.ALTERATION,
        severity=AttackSeverity.HIGH,
        description="Attacker modifies stimulation amplitude to dangerous levels",
        indicators=[
            "Amplitude exceeds safe bounds",
            "Rapid amplitude changes",
            "Sustained high-power stimulation",
        ],
        target_layer=9,
        reference="Kohno (2009): alteration attacks",
    ),
    "neural_dos": ThreatSignature(
        name="Neural Denial of Service",
        threat_type=ThreatType.BLOCKING,
        severity=AttackSeverity.CRITICAL,
        description="Attacker floods BCI with signals to overwhelm processing",
        indicators=[
            "Signal rate > 10,000 Hz",
            "Sustained flood pattern",
            "Processing queue overflow",
        ],
        target_layer=8,
        reference="Kohno (2009): blocking attacks",
    ),
    "rf_jamming": ThreatSignature(
        name="RF Jamming",
        threat_type=ThreatType.BLOCKING,
        severity=AttackSeverity.HIGH,
        description="Attacker uses RF interference to disrupt wireless communication",
        indicators=[
            "Signal dropout",
            "SNR degradation",
            "Bluetooth disconnection",
        ],
        target_layer=8,
        reference="Kohno (2009): blocking attacks",
    ),
    "neural_ransomware": ThreatSignature(
        name="Neural Ransomware",
        threat_type=ThreatType.BLOCKING,
        severity=AttackSeverity.CRITICAL,
        description="Malware locks device functionality until ransom paid",
        indicators=[
            "Unauthorized firmware modification",
            "Calibration data encryption",
            "Motor command suppression",
        ],
        target_layer=8,
        reference="ONI Framework: neural ransomware threat model",
    ),
    "thought_extraction": ThreatSignature(
        name="Thought Extraction",
        threat_type=ThreatType.EAVESDROPPING,
        severity=AttackSeverity.CRITICAL,
        description="Attacker decodes private thoughts from neural signals",
        indicators=[
            "Unauthorized ERP component access",
            "High-entropy signal transmission",
            "Privacy score > 0.7",
        ],
        target_layer=14,
        reference="Chizeck & Bonaci (2014): BCI Anonymizer patent",
    ),
    "emotional_profiling": ThreatSignature(
        name="Emotional State Profiling",
        threat_type=ThreatType.EAVESDROPPING,
        severity=AttackSeverity.HIGH,
        description="Attacker infers emotional states from neural activity",
        indicators=[
            "Amygdala region access",
            "ERN component extraction",
            "Affect-related ERP leakage",
        ],
        target_layer=13,
        reference="Chizeck & Bonaci (2014): privacy-sensitive categories",
    ),
}
