"""
Privacy Score (Pₛ) Calculator

Quantifies information leakage risk for neural signals, inspired by
information-criticality concepts from BCI privacy research.

Reference:
    Bonaci, T., Calo, R., & Chizeck, H. J. (2015). App stores for the brain:
    Privacy and security in brain-computer interfaces. IEEE Technology and
    Society Magazine, 34(2), 32-39.
"""

from dataclasses import dataclass, field
from typing import List, Dict, Optional
import math


@dataclass
class PrivacyScoreResult:
    """
    Result of privacy score calculation.

    Attributes:
        score: Overall privacy risk score (0 = no risk, 1 = high risk).
        entropy_ratio: Information content ratio.
        sensitive_features: Count of sensitive features detected.
        category_risks: Per-category risk scores.
        interpretation: Human-readable interpretation.
    """

    score: float
    entropy_ratio: float
    sensitive_features: int
    category_risks: Dict[str, float]
    interpretation: str = ""

    def __post_init__(self):
        """Set interpretation based on score."""
        if self.score < 0.3:
            self.interpretation = "LOW RISK - Safe to transmit"
        elif self.score < 0.5:
            self.interpretation = "MODERATE RISK - Consider filtering"
        elif self.score < 0.7:
            self.interpretation = "HIGH RISK - Filtering recommended"
        else:
            self.interpretation = "CRITICAL RISK - Must filter before transmission"


@dataclass
class PrivacyCategory:
    """Definition of a privacy category."""

    name: str
    """Category name."""

    weight: float
    """Weight in overall score (0-1)."""

    description: str
    """Human-readable description."""

    indicators: List[str]
    """Signal indicators for this category."""


class PrivacyScoreCalculator:
    """
    Calculate Privacy Score (Pₛ) for neural signals.

    The Privacy Score quantifies the risk of private information leakage
    if a neural signal is transmitted or stored.

    Formula:
        Pₛ = Σᵢ wᵢ × Rᵢ(fᵢ) × Sᵢ

    Where:
        wᵢ = Weight for privacy category i
        Rᵢ = Risk function for feature fᵢ
        Sᵢ = Sensitivity level for category i

    Interpretation:
        Pₛ < 0.3: Low risk - safe to transmit
        0.3 ≤ Pₛ < 0.5: Moderate risk - consider filtering
        0.5 ≤ Pₛ < 0.7: High risk - filtering recommended
        Pₛ ≥ 0.7: Critical risk - must filter before transmission

    Example:
        >>> calculator = PrivacyScoreCalculator()
        >>> result = calculator.calculate(signal_data, features)
        >>> print(f"Privacy Score: {result.score:.2f}")
        >>> print(result.interpretation)

    Reference:
        Inspired by Chizeck & Bonaci (2014) information-criticality metrics.
    """

    # Default privacy categories with weights (sum to 1.0)
    DEFAULT_CATEGORIES: Dict[str, PrivacyCategory] = {
        "face_recognition": PrivacyCategory(
            name="Face Recognition",
            weight=0.20,
            description="Ability to identify recognized faces",
            indicators=["n170", "fusiform", "face_erp"],
        ),
        "emotional_state": PrivacyCategory(
            name="Emotional State",
            weight=0.20,
            description="Current emotional/affective state",
            indicators=["amygdala", "ern", "emotion", "affect"],
        ),
        "memory_content": PrivacyCategory(
            name="Memory Content",
            weight=0.25,
            description="Specific memory or knowledge content",
            indicators=["hippocampus", "memory", "recall", "p300"],
        ),
        "cognitive_state": PrivacyCategory(
            name="Cognitive State",
            weight=0.15,
            description="Mental fatigue, attention, workload",
            indicators=["attention", "fatigue", "workload", "alpha"],
        ),
        "deception": PrivacyCategory(
            name="Deception Indicators",
            weight=0.10,
            description="Signals that could indicate deception",
            indicators=["ern", "error", "conflict", "deception"],
        ),
        "biometric": PrivacyCategory(
            name="Biometric Identity",
            weight=0.10,
            description="Neural patterns unique to individual",
            indicators=["biometric", "identity", "signature"],
        ),
    }

    def __init__(
        self,
        categories: Optional[Dict[str, PrivacyCategory]] = None,
        base_entropy_threshold: float = 2.0,
    ):
        """
        Initialize the calculator.

        Args:
            categories: Custom privacy categories. Uses defaults if None.
            base_entropy_threshold: Entropy threshold for risk assessment.
        """
        self.categories = categories or self.DEFAULT_CATEGORIES
        self.base_entropy_threshold = base_entropy_threshold

        # Validate weights sum to ~1.0
        total_weight = sum(cat.weight for cat in self.categories.values())
        if abs(total_weight - 1.0) > 0.01:
            # Normalize weights
            for cat in self.categories.values():
                cat.weight /= total_weight

    def calculate(
        self,
        signal_data: List[float],
        features: Optional[Dict[str, List[float]]] = None,
        detected_erps: Optional[List[str]] = None,
    ) -> PrivacyScoreResult:
        """
        Calculate privacy score for a signal.

        Args:
            signal_data: Raw neural signal data.
            features: Extracted features (optional).
            detected_erps: List of detected ERP component names (optional).

        Returns:
            PrivacyScoreResult with score and breakdown.
        """
        category_risks: Dict[str, float] = {}
        sensitive_count = 0

        # Calculate risk for each category
        for cat_name, category in self.categories.items():
            risk = self._assess_category_risk(
                signal_data, features, detected_erps, category
            )
            category_risks[cat_name] = risk
            if risk > 0.5:
                sensitive_count += 1

        # Weighted sum for overall score
        total_score = sum(
            self.categories[cat].weight * risk for cat, risk in category_risks.items()
        )

        # Clamp to [0, 1]
        total_score = max(0.0, min(1.0, total_score))

        # Calculate entropy ratio
        entropy_ratio = self._calculate_entropy_ratio(signal_data)

        return PrivacyScoreResult(
            score=total_score,
            entropy_ratio=entropy_ratio,
            sensitive_features=sensitive_count,
            category_risks=category_risks,
        )

    def calculate_from_erp_list(self, detected_erps: List[str]) -> PrivacyScoreResult:
        """
        Quick calculation based only on detected ERP types.

        Useful when full signal analysis isn't needed.

        Args:
            detected_erps: List of detected ERP component names.

        Returns:
            PrivacyScoreResult based on ERP types alone.
        """
        return self.calculate([], None, detected_erps)

    def _assess_category_risk(
        self,
        signal_data: List[float],
        features: Optional[Dict[str, List[float]]],
        detected_erps: Optional[List[str]],
        category: PrivacyCategory,
    ) -> float:
        """
        Assess privacy risk for a specific category.

        Returns risk score 0-1.
        """
        risk = 0.0
        indicators_found = 0

        # Check detected ERPs against category indicators
        if detected_erps:
            for erp in detected_erps:
                erp_lower = erp.lower()
                for indicator in category.indicators:
                    if indicator in erp_lower:
                        indicators_found += 1
                        break

        # Check feature names
        if features:
            for feature_name in features.keys():
                name_lower = feature_name.lower()
                for indicator in category.indicators:
                    if indicator in name_lower:
                        indicators_found += 1
                        break

        # Calculate risk based on indicators found
        if indicators_found > 0:
            # Each indicator adds to risk, diminishing returns
            risk = 1.0 - (0.5 ** indicators_found)

        # Adjust based on signal entropy if data available
        if signal_data:
            entropy = self._calculate_entropy(signal_data)
            if entropy > self.base_entropy_threshold:
                # High entropy signals are more likely to contain information
                risk = min(1.0, risk * 1.2)

        return risk

    def _calculate_entropy(self, data: List[float]) -> float:
        """Calculate Shannon entropy."""
        if not data or len(data) < 2:
            return 0.0

        # Discretize
        n_bins = min(50, len(data) // 2)
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

        total = len(data)
        entropy = 0.0
        for count in bins:
            if count > 0:
                p = count / total
                entropy -= p * math.log2(p)

        return entropy

    def _calculate_entropy_ratio(self, signal_data: List[float]) -> float:
        """Calculate entropy ratio relative to maximum possible."""
        if not signal_data:
            return 0.0

        actual_entropy = self._calculate_entropy(signal_data)
        # Maximum entropy for n_bins
        n_bins = min(50, len(signal_data) // 2)
        if n_bins < 2:
            return 0.0
        max_entropy = math.log2(n_bins)

        if max_entropy == 0:
            return 0.0

        return actual_entropy / max_entropy


def quick_privacy_check(detected_erps: List[str]) -> str:
    """
    Quick utility function to check privacy risk.

    Args:
        detected_erps: List of detected ERP types.

    Returns:
        Risk level string.
    """
    calculator = PrivacyScoreCalculator()
    result = calculator.calculate_from_erp_list(detected_erps)
    return result.interpretation
