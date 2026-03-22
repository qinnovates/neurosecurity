"""
BCI Anonymizer

Privacy filtering for neural signals inspired by BCI privacy research
from the University of Washington BioRobotics Lab.

Filters privacy-sensitive information while preserving application-required
signals (e.g., motor commands for prosthetics).

Reference:
    Bonaci, T., Calo, R., & Chizeck, H. J. (2015). App stores for the brain:
    Privacy and security in brain-computer interfaces. IEEE Technology and
    Society Magazine, 34(2), 32-39.
"""

from dataclasses import dataclass, field
from enum import Enum
from typing import Optional, List, Dict, Set, Tuple
import math


class ERPType(Enum):
    """
    Event-Related Potential types.

    From BCI Anonymizer patent: Different ERP components carry different
    types of information and have different privacy implications.
    """

    P300 = "p300"
    """Attention/recognition response. Privacy: SENSITIVE (reveals what you recognize)."""

    N170 = "n170"
    """Face recognition response. Privacy: PRIVATE (reveals who you recognize)."""

    N400 = "n400"
    """Semantic processing. Privacy: SENSITIVE (reveals semantic associations)."""

    ERN = "error_related_negativity"
    """Error detection response. Privacy: SENSITIVE (deception detection possible)."""

    LRP = "lateralized_readiness_potential"
    """Motor preparation. Privacy: PUBLIC (needed for BCI control)."""

    CNV = "contingent_negative_variation"
    """Motor anticipation. Privacy: PUBLIC (needed for BCI control)."""

    MMN = "mismatch_negativity"
    """Auditory deviance detection. Privacy: LOW (not typically sensitive)."""

    VEP = "visual_evoked_potential"
    """Visual processing. Privacy: MEDIUM (reveals visual attention)."""


class PrivacySensitivity(Enum):
    """
    Information criticality levels.

    From patent: "Information-criticality metrics quantifying privacy risk levels."
    """

    PUBLIC = 0
    """Safe to transmit without filtering."""

    LOW = 1
    """Minor privacy implications, can usually transmit."""

    MEDIUM = 2
    """Moderate privacy implications, consider filtering."""

    SENSITIVE = 3
    """Significant privacy implications, should filter."""

    PRIVATE = 4
    """High privacy implications, must filter."""

    CRITICAL = 5
    """Never transmit - contains identifying or deeply private information."""


@dataclass
class AnonymizerConfig:
    """
    Configuration for the BCI Anonymizer.

    Reference:
        Bonaci, T., Calo, R., & Chizeck, H. J. (2015). App stores for the brain:
        Privacy and security in brain-computer interfaces. IEEE Technology and
        Society Magazine, 34(2), 32-39.
    """

    # Allowlisted ERP components (application-specific)
    allowed_erp_types: Set[ERPType] = field(default_factory=lambda: {ERPType.LRP, ERPType.CNV})
    """ERP types allowed to pass through (default: motor-related only)."""

    # Privacy thresholds
    min_sensitivity_to_filter: PrivacySensitivity = PrivacySensitivity.SENSITIVE
    """Minimum sensitivity level that triggers filtering."""

    entropy_reduction_threshold: float = 0.3
    """Target entropy reduction ratio for anonymization."""

    information_criticality_threshold: float = 0.5
    """Threshold for information criticality metric."""

    # Filtering parameters
    enable_high_pass_filter: bool = True
    """Enable high-pass filtering to remove slow drifts."""

    high_pass_cutoff_hz: float = 0.5
    """High-pass filter cutoff frequency."""

    # Time-frequency decomposition
    use_wavelet_decomposition: bool = True
    """Use wavelet decomposition for feature extraction."""

    wavelet_family: str = "db4"
    """Wavelet family for decomposition."""

    # Calibration
    calibration_required: bool = True
    """Whether user-specific calibration is required."""


@dataclass
class PrivacyMetrics:
    """
    Privacy metrics for a processed signal.

    Based on information-criticality concepts from BCI privacy research.
    """

    entropy_original: float
    """Shannon entropy of original signal."""

    entropy_filtered: float
    """Shannon entropy after filtering."""

    entropy_reduction: float
    """Ratio of entropy reduced (0-1)."""

    privacy_score: float
    """Overall privacy score (0 = no risk, 1 = high risk)."""

    sensitive_components_removed: List[str]
    """List of removed component names."""

    components_allowed: List[str]
    """List of components that passed through."""


@dataclass
class AnonymizedSignal:
    """Result of anonymization process."""

    data: List[float]
    """Anonymized signal data."""

    timestamp: float
    """Original timestamp."""

    channel: int
    """Electrode channel."""

    metrics: PrivacyMetrics
    """Privacy metrics for this signal."""


class BCIAnonymizer:
    """
    BCI Anonymizer for privacy protection.

    Inspired by privacy filtering research from UW BioRobotics Lab.
    Architecture: Signal Acquisition -> Feature Extraction -> Anonymizer -> Decoder

    The anonymizer filters privacy-sensitive ERP components while
    preserving application-required signals.

    Example:
        >>> config = AnonymizerConfig(allowed_erp_types={ERPType.LRP})
        >>> anonymizer = BCIAnonymizer(config)
        >>> result = anonymizer.anonymize(signal)
        >>> print(result.metrics.privacy_score)  # Lower = more private

    Reference:
        Chizeck, H. J., & Bonaci, T. (2014). Brain-Computer Interface
        Anonymizer (U.S. Patent Application No. 2014/0228701 A1).
    """

    # Privacy classification for ERP types (from patent examples)
    ERP_PRIVACY_MAP: Dict[ERPType, PrivacySensitivity] = {
        ERPType.P300: PrivacySensitivity.SENSITIVE,
        ERPType.N170: PrivacySensitivity.PRIVATE,
        ERPType.N400: PrivacySensitivity.SENSITIVE,
        ERPType.ERN: PrivacySensitivity.SENSITIVE,
        ERPType.LRP: PrivacySensitivity.PUBLIC,
        ERPType.CNV: PrivacySensitivity.PUBLIC,
        ERPType.MMN: PrivacySensitivity.LOW,
        ERPType.VEP: PrivacySensitivity.MEDIUM,
    }

    # Privacy-sensitive information categories (from patent)
    SENSITIVE_CATEGORIES: List[str] = [
        "face_recognition",
        "emotional_state",
        "financial_association",
        "biographical_memory",
        "deception_indicator",
        "cognitive_state",
        "personal_preference",
        "medical_condition",
    ]

    def __init__(self, config: Optional[AnonymizerConfig] = None):
        """
        Initialize the BCI Anonymizer.

        Args:
            config: Configuration settings. Uses defaults if not provided.
        """
        self.config = config or AnonymizerConfig()
        self._calibration_data: Dict[str, float] = {}
        self._is_calibrated: bool = False

    @property
    def is_calibrated(self) -> bool:
        """Check if anonymizer has been calibrated."""
        return self._is_calibrated

    def calibrate(self, calibration_signals: List[Dict]) -> None:
        """
        Perform user-specific calibration.

        From patent: "During calibration, the system measures information-
        criticality metrics and relative reduction in entropy to determine
        which ERP components pose privacy risks for specific users."

        Args:
            calibration_signals: List of labeled calibration signals.
        """
        for signal in calibration_signals:
            if "erp_type" in signal and "data" in signal:
                erp_type = signal["erp_type"]
                baseline_entropy = self._calculate_entropy(signal["data"])
                self._calibration_data[erp_type] = baseline_entropy

        self._is_calibrated = True

    def anonymize(
        self, signal_data: List[float], timestamp: float = 0.0, channel: int = 0
    ) -> AnonymizedSignal:
        """
        Anonymize a neural signal by filtering privacy-sensitive components.

        From patent: "The BCI anonymizer can process brain neural signals
        in real time and provide only signal components required by the
        application, rather than providing the entire brain neural signal."

        Args:
            signal_data: Raw neural signal data.
            timestamp: Signal timestamp.
            channel: Electrode channel number.

        Returns:
            AnonymizedSignal with filtered data and privacy metrics.
        """
        original_entropy = self._calculate_entropy(signal_data)
        removed_components: List[str] = []
        allowed_components: List[str] = []

        # Step 1: Extract features (ERP components)
        extracted_features = self._extract_features(signal_data)

        # Step 2: Classify and filter each component
        filtered_features: Dict[str, List[float]] = {}

        for feature_name, feature_data in extracted_features.items():
            erp_type = self._classify_erp(feature_name)

            if erp_type is None:
                # Unknown feature - apply conservative filtering
                if self._is_privacy_sensitive(feature_data):
                    removed_components.append(feature_name)
                    continue
                allowed_components.append(feature_name)
                filtered_features[feature_name] = feature_data

            elif erp_type in self.config.allowed_erp_types:
                # Allowed ERP type - pass through
                allowed_components.append(feature_name)
                filtered_features[feature_name] = feature_data

            else:
                # Check sensitivity level
                sensitivity = self.ERP_PRIVACY_MAP.get(
                    erp_type, PrivacySensitivity.MEDIUM
                )
                if sensitivity.value >= self.config.min_sensitivity_to_filter.value:
                    removed_components.append(feature_name)
                else:
                    allowed_components.append(feature_name)
                    filtered_features[feature_name] = feature_data

        # Step 3: Reconstruct anonymized signal
        anonymized_data = self._reconstruct_signal(signal_data, filtered_features)

        # Step 4: Calculate privacy metrics
        filtered_entropy = self._calculate_entropy(anonymized_data)

        if original_entropy > 0:
            entropy_reduction = (original_entropy - filtered_entropy) / original_entropy
        else:
            entropy_reduction = 0.0

        # Privacy score: lower = better privacy (more filtered)
        # Inverted from entropy reduction - high filtering = low leakage risk
        privacy_score = max(0.0, 1.0 - entropy_reduction)

        metrics = PrivacyMetrics(
            entropy_original=original_entropy,
            entropy_filtered=filtered_entropy,
            entropy_reduction=entropy_reduction,
            privacy_score=privacy_score,
            sensitive_components_removed=removed_components,
            components_allowed=allowed_components,
        )

        return AnonymizedSignal(
            data=anonymized_data,
            timestamp=timestamp,
            channel=channel,
            metrics=metrics,
        )

    def get_allowed_erp_types(self) -> Set[ERPType]:
        """Get the set of allowed ERP types."""
        return self.config.allowed_erp_types.copy()

    def add_allowed_erp_type(self, erp_type: ERPType) -> None:
        """Add an ERP type to the allowlist."""
        self.config.allowed_erp_types.add(erp_type)

    def remove_allowed_erp_type(self, erp_type: ERPType) -> None:
        """Remove an ERP type from the allowlist."""
        self.config.allowed_erp_types.discard(erp_type)

    def _extract_features(self, signal_data: List[float]) -> Dict[str, List[float]]:
        """
        Extract ERP features from signal.

        From patent: "Time-frequency decomposition using wavelets or
        Empirical Mode Decomposition to isolate necessary signal functions."
        """
        features: Dict[str, List[float]] = {}

        # Simple frequency band extraction (placeholder for full implementation)
        # In production, would use wavelet decomposition

        n = len(signal_data)
        if n == 0:
            return features

        # Simulate extraction of different components
        # (In real implementation, would use actual ERP detection)
        features["motor_component"] = signal_data  # Pass-through for demo
        features["baseline"] = [sum(signal_data) / n] * n

        return features

    def _classify_erp(self, feature_name: str) -> Optional[ERPType]:
        """Classify a feature as a specific ERP type."""
        name_lower = feature_name.lower()

        for erp_type in ERPType:
            if erp_type.value.replace("_", "") in name_lower.replace("_", ""):
                return erp_type

        # Map common names to ERP types
        name_mapping = {
            "motor": ERPType.LRP,
            "face": ERPType.N170,
            "attention": ERPType.P300,
            "semantic": ERPType.N400,
            "error": ERPType.ERN,
            "visual": ERPType.VEP,
            "auditory": ERPType.MMN,
        }

        for key, erp_type in name_mapping.items():
            if key in name_lower:
                return erp_type

        return None

    def _is_privacy_sensitive(self, feature_data: List[float]) -> bool:
        """
        Check if unknown feature contains privacy-sensitive information.

        Uses heuristics when feature type is unknown.
        """
        if not feature_data:
            return False

        # High variance might indicate information content
        mean = sum(feature_data) / len(feature_data)
        variance = sum((x - mean) ** 2 for x in feature_data) / len(feature_data)

        # High entropy threshold (heuristic)
        entropy = self._calculate_entropy(feature_data)

        return entropy > self.config.information_criticality_threshold

    def _calculate_entropy(self, data: List[float]) -> float:
        """
        Calculate Shannon entropy of signal.

        Used for information-criticality metrics.
        """
        if not data:
            return 0.0

        # Discretize into bins
        n_bins = min(50, len(data) // 2 + 1)
        if n_bins < 2:
            return 0.0

        min_val = min(data)
        max_val = max(data)
        if max_val == min_val:
            return 0.0

        bin_width = (max_val - min_val) / n_bins
        bins = [0] * n_bins

        for val in data:
            bin_idx = min(int((val - min_val) / bin_width), n_bins - 1)
            bins[bin_idx] += 1

        # Calculate entropy
        total = len(data)
        entropy = 0.0
        for count in bins:
            if count > 0:
                p = count / total
                entropy -= p * math.log2(p)

        return entropy

    def _reconstruct_signal(
        self, original: List[float], filtered_features: Dict[str, List[float]]
    ) -> List[float]:
        """
        Reconstruct signal from filtered features.

        In production, would properly reconstruct from frequency components.
        """
        if not filtered_features:
            # Return zeros if all features filtered
            return [0.0] * len(original)

        # Simple: return first allowed feature (placeholder)
        for feature_data in filtered_features.values():
            if feature_data:
                return feature_data

        return original
