# Neurosecurity Implementation Guide

**Integrating Foundational BCI Security Research into the ONI Framework**

This document provides a comprehensive implementation strategy for incorporating the seminal neurosecurity research by Kohno et al. (2009) and BCI privacy concepts from Bonaci et al. (2015) into the ONI Framework.

> **Note on Patent Status:** The BCI Anonymizer patent application (US20140228701A1) was **ABANDONED** and never granted. The concepts from the academic research (Bonaci et al., 2015) are freely available for implementation. This implementation is based solely on published academic research.

---

## Table of Contents

- [Research Foundation](#research-foundation)
- [Threat Model Integration](#threat-model-integration)
- [Implementation Architecture](#implementation-architecture)
- [Component Specifications](#component-specifications)
- [ONI Layer Mapping](#oni-layer-mapping)
- [Attack Scenarios & Testing](#attack-scenarios--testing)
- [Integration with Existing ONI Components](#integration-with-existing-oni-components)
- [Implementation Roadmap](#implementation-roadmap)
- [References](#references)

---

## Research Foundation

### Neurosecurity: The Seminal Framework (Kohno, 2009)

The ONI Framework builds upon the foundational neurosecurity principles established by Denning, Matsuoka, and Kohno (2009), who defined **neurosecurity** as:

> "A version of computer science security principles and methods applied to neural engineering."

**Key Insights Adopted:**

| Kohno Principle | ONI Implementation |
|-----------------|-------------------|
| CIA Triad for neural devices | Core security properties at L8-L14 |
| Adversarial robustness | Zero-trust architecture at Neural Gateway (L8) |
| Irreversible neural changes | Rate limiting, amplitude bounds, emergency shutoff |
| Meta-decision difficulty | Automated policy enforcement (no user popups) |
| Attack surface awareness | Per-layer threat mapping in ONI_LAYERS.md |

**Citation:**
> Denning, T., Matsuoka, Y., & Kohno, T. (2009). Neurosecurity: Security and privacy for neural devices. *Neurosurgical Focus*, 27(1), E7. https://doi.org/10.3171/2009.4.FOCUS0985

### BCI Privacy Research (Bonaci et al., 2015)

Privacy filtering concepts developed by researchers at the University of Washington BioRobotics Lab provide mechanisms for protecting sensitive neural information:

> "BCIs could be manipulated to extract private information from users... Privacy-preserving techniques can filter signals to provide only application-required components."

**Key Concepts Adopted:**

| Research Concept | ONI Implementation |
|------------------|-------------------|
| Signal Acquisition | L9 Signal Processing layer |
| Feature Extraction | L10 Neural Protocol layer |
| Privacy Filtering | L13 Semantic / L14 Identity layers |
| Information-criticality | Privacy Score (Pₛ) metric |
| Per-component authorization | Allowlist-based filtering |

**Citation:**
> Bonaci, T., Calo, R., & Chizeck, H. J. (2015). App stores for the brain: Privacy and security in brain-computer interfaces. *IEEE Technology and Society Magazine*, 34(2), 32-39.

---

## Threat Model Integration

### Kohno's Three Attack Vectors

Kohno et al. identified three fundamental attack categories against neural devices:

```
┌─────────────────────────────────────────────────────────────────┐
│                    NEUROSECURITY THREAT MODEL                   │
│                     (Denning et al., 2009)                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   ┌───────────────┐  ┌───────────────┐  ┌───────────────┐      │
│   │   ALTERATION  │  │   BLOCKING    │  │ EAVESDROPPING │      │
│   │               │  │               │  │               │      │
│   │  Modify neural│  │ Prevent signal│  │ Intercept and │      │
│   │  signals to   │  │ transmission  │  │ decode neural │      │
│   │  cause harm   │  │ causing denial│  │ information   │      │
│   └───────┬───────┘  └───────┬───────┘  └───────┬───────┘      │
│           │                  │                  │               │
│           ▼                  ▼                  ▼               │
│   ┌───────────────────────────────────────────────────────┐    │
│   │              ONI FRAMEWORK DEFENSES                   │    │
│   ├───────────────────────────────────────────────────────┤    │
│   │  • Coherence Metric (Cₛ) validates signal integrity   │    │
│   │  • Rate limiting prevents signal flooding             │    │
│   │  • Privacy filtering removes sensitive data           │    │
│   │  • Encryption protects data in transit                │    │
│   │  • Emergency shutoff for detected attacks             │    │
│   └───────────────────────────────────────────────────────┘    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Expanded Threat Taxonomy

Integrating Kohno's model with modern BCI attack research:

| Attack Category | Kohno Classification | ONI Target Layer | Severity | Example |
|-----------------|---------------------|------------------|----------|---------|
| Signal Injection | Alteration | L8, L9 | CRITICAL | Fake motor commands |
| Amplitude Manipulation | Alteration | L9 | HIGH | Overstimulation |
| Timing Attack | Alteration | L9, L10 | HIGH | Phase disruption |
| Neural DoS | Blocking | L8, L9 | CRITICAL | Signal flooding |
| Jamming | Blocking | L8 | HIGH | RF interference |
| Device Lockout | Blocking | L8 | CRITICAL | Ransomware |
| Thought Extraction | Eavesdropping | L13, L14 | CRITICAL | Memory decoding |
| Emotional Profiling | Eavesdropping | L13 | HIGH | Mood inference |
| Biometric Theft | Eavesdropping | L14 | HIGH | Neural fingerprint |

---

## Implementation Architecture

### System Overview

```
┌──────────────────────────────────────────────────────────────────────────┐
│                     ONI NEUROSECURITY ARCHITECTURE                        │
│            (Inspired by Kohno 2009 + BCI Privacy Research)              │
└──────────────────────────────────────────────────────────────────────────┘

                          EXTERNAL WORLD
                               │
                               ▼
┌──────────────────────────────────────────────────────────────────────────┐
│  L1-L7: OSI NETWORKING                                                   │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐         │
│  │ Encryption │──│  TLS/DTLS  │──│   Routing  │──│  Physical  │         │
│  └────────────┘  └────────────┘  └────────────┘  └────────────┘         │
└──────────────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────────────────┐
│  L8: NEURAL GATEWAY (Primary Security Boundary)                          │
│  ┌─────────────────────────────────────────────────────────────────────┐ │
│  │                    NEUROSECURITY FIREWALL                           │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌────────────┐ │ │
│  │  │ Auth Check  │──│ Rate Limit  │──│ Coherence   │──│ Allowlist  │ │ │
│  │  │ (Kohno CIA) │  │ (DoS Def)   │  │ Validation  │  │ Filter     │ │ │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └────────────┘ │ │
│  └─────────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────────────────┐
│  L9: SIGNAL PROCESSING                                                   │
│  ┌─────────────────────────────────────────────────────────────────────┐ │
│  │  Signal Acquisition (from UW BioRobotics research)                    │ │
│  │  • ADC conversion                                                   │ │
│  │  • Bandpass filtering (0.1-300 Hz)                                  │ │
│  │  • Artifact rejection                                               │ │
│  │  • Amplitude bounds enforcement                                      │ │
│  └─────────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────────────────┐
│  L10: NEURAL PROTOCOL                                                    │
│  ┌─────────────────────────────────────────────────────────────────────┐ │
│  │  Feature Extraction (from UW BioRobotics research)                    │ │
│  │  • Event-Related Potential (ERP) detection                          │ │
│  │  • Spike sorting                                                     │ │
│  │  • LFP power extraction                                              │ │
│  │  • Time-frequency decomposition (wavelet/EMD)                        │ │
│  └─────────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────────────────┐
│  L11-L12: COGNITIVE TRANSPORT & SESSION                                  │
│  • Reliable delivery with integrity checks                               │
│  • Context persistence                                                   │
│  • Working memory state tracking                                         │
└──────────────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────────────────┐
│  L13-L14: SEMANTIC & IDENTITY (Privacy Protection)                       │
│  ┌─────────────────────────────────────────────────────────────────────┐ │
│  │  BCI ANONYMIZER (from UW BioRobotics research)                      │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                  │ │
│  │  │ Privacy     │──│ Information │──│ Selective   │                  │ │
│  │  │ Classifier  │  │ Criticality │  │ Filtering   │                  │ │
│  │  │             │  │ Metrics     │  │             │                  │ │
│  │  └─────────────┘  └─────────────┘  └─────────────┘                  │ │
│  │                                                                      │ │
│  │  Privacy-Sensitive Data Filtered:                                    │ │
│  │  • Emotional states          • Biographical information              │ │
│  │  • Financial associations    • Face recognition patterns             │ │
│  │  • Memory content            • Cognitive vulnerabilities             │ │
│  └─────────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────┘

```

---

## Component Specifications

### 1. Neurosecurity Firewall (L8)

Implements Kohno's CIA triad with specific validation checks:

```python
# oni/neurosecurity/firewall.py

from dataclasses import dataclass
from enum import Enum
from typing import Optional, List
import numpy as np

class ThreatType(Enum):
    """Kohno's three attack categories"""
    ALTERATION = "alteration"      # Signal modification
    BLOCKING = "blocking"          # Denial of service
    EAVESDROPPING = "eavesdropping"  # Privacy violation

class SecurityDecision(Enum):
    ALLOW = "allow"
    BLOCK = "block"
    FLAG = "flag"
    EMERGENCY_SHUTOFF = "emergency_shutoff"

@dataclass
class NeurosecurityConfig:
    """Configuration based on Kohno's recommendations"""
    # Integrity (Anti-Alteration)
    coherence_threshold: float = 0.5
    max_amplitude_uv: float = 500.0
    min_amplitude_uv: float = 1.0

    # Availability (Anti-Blocking)
    max_signal_rate_hz: float = 30000.0
    min_signal_rate_hz: float = 100.0
    dos_window_ms: float = 100.0
    dos_threshold_count: int = 10000

    # Confidentiality (Anti-Eavesdropping)
    enable_privacy_filter: bool = True
    privacy_score_threshold: float = 0.7

    # Emergency response
    emergency_shutoff_enabled: bool = True
    shutoff_coherence_threshold: float = 0.1

class NeurosecurityFirewall:
    """
    Layer 8 Neural Gateway implementing Kohno's neurosecurity principles.

    References:
        Denning, T., Matsuoka, Y., & Kohno, T. (2009). Neurosecurity:
        Security and privacy for neural devices. Neurosurgical Focus, 27(1), E7.
    """

    def __init__(self, config: Optional[NeurosecurityConfig] = None):
        self.config = config or NeurosecurityConfig()
        self.signal_history: List[float] = []
        self.threat_log: List[dict] = []

    def validate_signal(self, signal: 'NeuralSignal') -> SecurityDecision:
        """
        Validate incoming signal against all three Kohno threat categories.
        """
        threats_detected = []

        # Check ALTERATION threats (Integrity)
        if not self._check_integrity(signal):
            threats_detected.append(ThreatType.ALTERATION)

        # Check BLOCKING threats (Availability)
        if not self._check_availability(signal):
            threats_detected.append(ThreatType.BLOCKING)

        # Check EAVESDROPPING protection (Confidentiality)
        if not self._check_confidentiality(signal):
            threats_detected.append(ThreatType.EAVESDROPPING)

        # Determine decision
        if ThreatType.ALTERATION in threats_detected:
            if signal.coherence_score < self.config.shutoff_coherence_threshold:
                return SecurityDecision.EMERGENCY_SHUTOFF
            return SecurityDecision.BLOCK

        if ThreatType.BLOCKING in threats_detected:
            return SecurityDecision.BLOCK

        if ThreatType.EAVESDROPPING in threats_detected:
            return SecurityDecision.FLAG  # Log but allow motor commands

        return SecurityDecision.ALLOW

    def _check_integrity(self, signal: 'NeuralSignal') -> bool:
        """Anti-alteration checks (Kohno: signal modification attacks)"""
        # Coherence validation
        if signal.coherence_score < self.config.coherence_threshold:
            self._log_threat(ThreatType.ALTERATION, "Low coherence score")
            return False

        # Amplitude bounds
        if signal.amplitude > self.config.max_amplitude_uv:
            self._log_threat(ThreatType.ALTERATION, "Amplitude exceeds safe bounds")
            return False

        if signal.amplitude < self.config.min_amplitude_uv:
            self._log_threat(ThreatType.ALTERATION, "Amplitude below detection threshold")
            return False

        return True

    def _check_availability(self, signal: 'NeuralSignal') -> bool:
        """Anti-blocking checks (Kohno: denial of service attacks)"""
        # Rate limiting
        self.signal_history.append(signal.timestamp)

        # Clean old entries
        window_start = signal.timestamp - self.config.dos_window_ms
        self.signal_history = [t for t in self.signal_history if t > window_start]

        # Check for DoS pattern
        if len(self.signal_history) > self.config.dos_threshold_count:
            self._log_threat(ThreatType.BLOCKING, "DoS pattern detected")
            return False

        return True

    def _check_confidentiality(self, signal: 'NeuralSignal') -> bool:
        """Anti-eavesdropping checks (Kohno: privacy protection)"""
        if not self.config.enable_privacy_filter:
            return True

        if hasattr(signal, 'privacy_score'):
            if signal.privacy_score < self.config.privacy_score_threshold:
                self._log_threat(ThreatType.EAVESDROPPING, "Privacy-sensitive content detected")
                return False

        return True

    def _log_threat(self, threat_type: ThreatType, message: str):
        """Log detected threats for SIEM/NSAM integration"""
        self.threat_log.append({
            'type': threat_type,
            'message': message,
            'timestamp': np.datetime64('now')
        })
```

### 2. Privacy Filter / BCI Anonymizer (L13-L14)

Implements the UW BioRobotics research architecture:

```python
# oni/neurosecurity/anonymizer.py

from dataclasses import dataclass
from enum import Enum
from typing import List, Dict, Set, Optional
import numpy as np

class ERPType(Enum):
    """Event-Related Potential types (from UW BioRobotics research)"""
    P300 = "p300"              # Attention/recognition
    N170 = "n170"              # Face recognition
    N400 = "n400"              # Semantic processing
    ERN = "error_related"      # Error detection
    LRP = "lateralized_readiness"  # Motor preparation
    CNV = "contingent_negative"    # Anticipation

class PrivacySensitivity(Enum):
    """Information criticality levels (from BCI privacy research)"""
    PUBLIC = 0       # Safe to transmit
    SENSITIVE = 1    # Requires filtering
    PRIVATE = 2      # Must be stripped
    CRITICAL = 3     # Never transmit

@dataclass
class AnonymizerConfig:
    """
    Configuration for BCI Anonymizer based on UW BioRobotics research.

    Reference:
        Chizeck, H. J., & Bonaci, T. (2014). Brain-Computer Interface
        Anonymizer (U.S. Patent Application No. 2014/0228701 A1).
    """
    # Allowlisted ERP components (application-specific)
    allowed_erp_types: Set[ERPType] = None

    # Privacy thresholds
    entropy_reduction_threshold: float = 0.3
    information_criticality_threshold: float = 0.5

    # Filtering parameters
    enable_high_pass_filter: bool = True
    high_pass_cutoff_hz: float = 0.5

    # Time-frequency decomposition
    use_wavelet_decomposition: bool = True
    wavelet_family: str = "db4"

    def __post_init__(self):
        if self.allowed_erp_types is None:
            # Default: only motor-related ERPs
            self.allowed_erp_types = {ERPType.LRP, ERPType.CNV}

@dataclass
class PrivacyMetrics:
    """Information criticality metrics from BCI privacy research"""
    entropy_original: float
    entropy_filtered: float
    entropy_reduction: float
    privacy_score: float
    sensitive_components_removed: List[str]

class BCIAnonymizer:
    """
    Implements the BCI Anonymizer architecture from UW BioRobotics research.

    Purpose: Filter privacy-sensitive neural information while preserving
    application-required signals (e.g., motor commands for prosthetics).

    Location in ONI: Layers 13 (Semantic) and 14 (Identity)

    Reference:
        Chizeck, H. J., & Bonaci, T. (2014). Brain-Computer Interface
        Anonymizer (U.S. Patent Application No. 2014/0228701 A1).
    """

    # Privacy classification for ERP types (from BCI privacy research examples)
    ERP_PRIVACY_MAP: Dict[ERPType, PrivacySensitivity] = {
        ERPType.P300: PrivacySensitivity.SENSITIVE,    # Can reveal recognition
        ERPType.N170: PrivacySensitivity.PRIVATE,      # Face recognition
        ERPType.N400: PrivacySensitivity.SENSITIVE,    # Semantic associations
        ERPType.ERN: PrivacySensitivity.SENSITIVE,     # Error/deception detection
        ERPType.LRP: PrivacySensitivity.PUBLIC,        # Motor commands (safe)
        ERPType.CNV: PrivacySensitivity.PUBLIC,        # Motor anticipation (safe)
    }

    # Privacy-sensitive information categories (from BCI privacy research)
    SENSITIVE_CATEGORIES = [
        "face_recognition",      # Recognizing colleagues/family
        "emotional_state",       # Fear, pleasure, anxiety
        "financial_association", # Response to financial stimuli
        "biographical_memory",   # Personal memories
        "deception_indicator",   # Lie detection signals
        "cognitive_state",       # Mental fatigue, attention
    ]

    def __init__(self, config: Optional[AnonymizerConfig] = None):
        self.config = config or AnonymizerConfig()
        self.calibration_data: Dict[str, float] = {}

    def calibrate(self, calibration_signals: List['NeuralSignal']) -> None:
        """
        Perform user-specific calibration to measure information criticality.

        From patent: "During calibration, the system measures information-
        criticality metrics and relative reduction in entropy to determine
        which ERP components pose privacy risks for specific users."
        """
        for signal in calibration_signals:
            # Measure baseline entropy for each ERP type
            for erp_type in ERPType:
                if self._detect_erp(signal, erp_type):
                    baseline = self._calculate_entropy(signal)
                    self.calibration_data[erp_type.value] = baseline

    def anonymize(self, signal: 'NeuralSignal') -> tuple['NeuralSignal', PrivacyMetrics]:
        """
        Filter privacy-sensitive components from neural signal.

        From patent: "The BCI anonymizer can process brain neural signals
        in real time and provide only signal components required by the
        application, rather than providing the entire brain neural signal."
        """
        original_entropy = self._calculate_entropy(signal)
        removed_components = []

        # Step 1: Extract features
        extracted_features = self._extract_features(signal)

        # Step 2: Classify each feature's privacy sensitivity
        filtered_features = {}
        for feature_name, feature_data in extracted_features.items():
            erp_type = self._classify_erp(feature_name)

            if erp_type is None:
                # Unknown feature - apply conservative filtering
                if self._is_privacy_sensitive(feature_data):
                    removed_components.append(feature_name)
                    continue

            elif erp_type not in self.config.allowed_erp_types:
                # ERP type not in allowlist
                sensitivity = self.ERP_PRIVACY_MAP.get(erp_type, PrivacySensitivity.SENSITIVE)
                if sensitivity.value >= PrivacySensitivity.SENSITIVE.value:
                    removed_components.append(feature_name)
                    continue

            filtered_features[feature_name] = feature_data

        # Step 3: Reconstruct anonymized signal
        anonymized_signal = self._reconstruct_signal(signal, filtered_features)

        # Step 4: Calculate privacy metrics
        filtered_entropy = self._calculate_entropy(anonymized_signal)
        entropy_reduction = (original_entropy - filtered_entropy) / original_entropy

        # Privacy score: higher = more private (more filtered)
        privacy_score = min(1.0, entropy_reduction / self.config.entropy_reduction_threshold)

        metrics = PrivacyMetrics(
            entropy_original=original_entropy,
            entropy_filtered=filtered_entropy,
            entropy_reduction=entropy_reduction,
            privacy_score=privacy_score,
            sensitive_components_removed=removed_components
        )

        return anonymized_signal, metrics

    def _extract_features(self, signal: 'NeuralSignal') -> Dict[str, np.ndarray]:
        """
        Extract ERP features using time-frequency decomposition.

        From patent: "Time-frequency decomposition using wavelets or
        Empirical Mode Decomposition to isolate necessary signal functions."
        """
        features = {}

        if self.config.use_wavelet_decomposition:
            # Wavelet decomposition for time-frequency analysis
            # (Implementation would use pywt or similar)
            pass

        return features

    def _detect_erp(self, signal: 'NeuralSignal', erp_type: ERPType) -> bool:
        """Detect presence of specific ERP component"""
        # ERP detection logic
        return False

    def _classify_erp(self, feature_name: str) -> Optional[ERPType]:
        """Classify feature as specific ERP type"""
        for erp_type in ERPType:
            if erp_type.value in feature_name.lower():
                return erp_type
        return None

    def _is_privacy_sensitive(self, feature_data: np.ndarray) -> bool:
        """Check if unknown feature contains privacy-sensitive information"""
        # Apply information-criticality heuristics
        return False

    def _calculate_entropy(self, signal: 'NeuralSignal') -> float:
        """Calculate signal entropy for privacy metrics"""
        if hasattr(signal, 'data') and len(signal.data) > 0:
            # Shannon entropy calculation
            hist, _ = np.histogram(signal.data, bins=50, density=True)
            hist = hist[hist > 0]  # Remove zeros
            return -np.sum(hist * np.log2(hist))
        return 0.0

    def _reconstruct_signal(self, original: 'NeuralSignal',
                           filtered_features: Dict) -> 'NeuralSignal':
        """Reconstruct signal from filtered features"""
        # Reconstruction logic
        return original  # Placeholder
```

### 3. Privacy Score Metric (Pₛ)

New metric inspired by the BCI Anonymizer's information-criticality approach:

```python
# oni/neurosecurity/privacy_score.py

from dataclasses import dataclass
from typing import List, Dict
import numpy as np

@dataclass
class PrivacyScoreResult:
    """
    Privacy Score (Pₛ) - Quantifies information leakage risk.

    Inspired by:
        Chizeck, H. J., & Bonaci, T. (2014). Brain-Computer Interface
        Anonymizer. Information-criticality metrics.
    """
    score: float              # 0 = no privacy risk, 1 = high risk
    entropy_ratio: float      # Information content ratio
    sensitive_features: int   # Count of sensitive features detected
    category_risks: Dict[str, float]  # Per-category risk scores

class PrivacyScoreCalculator:
    """
    Calculate Privacy Score (Pₛ) for neural signals.

    Pₛ = Σᵢ wᵢ × Rᵢ(fᵢ) × Sᵢ

    Where:
        wᵢ = Weight for privacy category i
        Rᵢ = Risk function for feature fᵢ
        Sᵢ = Sensitivity level for category i

    Interpretation:
        Pₛ < 0.3: Low risk - safe to transmit
        0.3 ≤ Pₛ < 0.7: Medium risk - consider filtering
        Pₛ ≥ 0.7: High risk - must filter before transmission
    """

    # Category weights (sum to 1.0)
    CATEGORY_WEIGHTS = {
        "face_recognition": 0.20,
        "emotional_state": 0.20,
        "memory_content": 0.25,
        "cognitive_state": 0.15,
        "deception": 0.10,
        "biometric": 0.10,
    }

    def calculate(self, signal: 'NeuralSignal',
                  features: Dict[str, np.ndarray]) -> PrivacyScoreResult:
        """
        Calculate privacy score for a signal with extracted features.
        """
        category_risks = {}
        sensitive_count = 0

        for category, weight in self.CATEGORY_WEIGHTS.items():
            risk = self._assess_category_risk(features, category)
            category_risks[category] = risk
            if risk > 0.5:
                sensitive_count += 1

        # Weighted sum
        total_score = sum(
            self.CATEGORY_WEIGHTS[cat] * risk
            for cat, risk in category_risks.items()
        )

        # Entropy ratio (information content)
        entropy_ratio = self._calculate_entropy_ratio(signal)

        return PrivacyScoreResult(
            score=min(1.0, total_score),
            entropy_ratio=entropy_ratio,
            sensitive_features=sensitive_count,
            category_risks=category_risks
        )

    def _assess_category_risk(self, features: Dict, category: str) -> float:
        """Assess privacy risk for specific category"""
        # Category-specific risk assessment
        return 0.0

    def _calculate_entropy_ratio(self, signal: 'NeuralSignal') -> float:
        """Calculate information content ratio"""
        return 0.5
```

---

## ONI Layer Mapping

### Kohno Threat Model → ONI Layers

| Kohno Threat | Security Property | Primary Layer | Secondary Layers | ONI Component |
|--------------|------------------|---------------|------------------|---------------|
| **Alteration** | Integrity | L8 (Gateway) | L9, L10 | Coherence Metric (Cₛ) |
| **Blocking** | Availability | L8 (Gateway) | L9 | Rate Limiter, DoS Detection |
| **Eavesdropping** | Confidentiality | L13, L14 | L11 | BCI Anonymizer, Privacy Score (Pₛ) |

### BCI Anonymizer → ONI Layers

| Patent Component | ONI Layer | Implementation |
|------------------|-----------|----------------|
| Signal Acquisition | L9 (Signal Processing) | `oni.neurosecurity.signal_acquisition` |
| Feature Extraction | L10 (Neural Protocol) | `oni.neurosecurity.feature_extraction` |
| BCI Anonymizer | L13-L14 (Semantic/Identity) | `oni.neurosecurity.anonymizer` |
| Decoding | L13 (Semantic) | `oni.neurosecurity.decoder` |
| Command Generation | L7 (Application) | Application-specific |

---

## Attack Scenarios & Testing

### Scenario 1: Signal Injection Attack (Alteration)

**Reference:** Kohno's alteration threat category

```python
# tests/MAIN/test_signal_injection.py

def test_signal_injection_detection():
    """
    Test: Attacker injects fake motor command signals.

    Attack Vector:
        Attacker compromises Bluetooth connection and injects signals
        designed to trigger involuntary movement.

    Expected Defense:
        Coherence Metric (Cₛ) should detect timing/amplitude anomalies
        and block the injected signals.

    Reference:
        Kohno (2009): "adversarial entities trying to exploit these
        devices to alter... neural signals"
    """
    from oni.neurosecurity import NeurosecurityFirewall, NeuralSignal
    from oni.coherence import CoherenceMetric

    firewall = NeurosecurityFirewall()
    coherence = CoherenceMetric()

    # Legitimate signal (high coherence)
    legitimate = NeuralSignal(
        amplitude=50.0,
        frequency=30.0,
        coherence_score=0.85,
        timestamp=0.0
    )
    assert firewall.validate_signal(legitimate) == SecurityDecision.ALLOW

    # Injected signal (low coherence - timing anomaly)
    injected = NeuralSignal(
        amplitude=50.0,
        frequency=30.0,
        coherence_score=0.15,  # Anomalous timing
        timestamp=1.0
    )
    assert firewall.validate_signal(injected) == SecurityDecision.BLOCK

    # Severely malicious signal (triggers emergency shutoff)
    malicious = NeuralSignal(
        amplitude=500.0,  # Dangerous amplitude
        frequency=30.0,
        coherence_score=0.05,
        timestamp=2.0
    )
    assert firewall.validate_signal(malicious) == SecurityDecision.EMERGENCY_SHUTOFF
```

### Scenario 2: Neural DoS Attack (Blocking)

**Reference:** Kohno's blocking threat category

```python
# tests/MAIN/test_neural_dos.py

def test_neural_dos_detection():
    """
    Test: Attacker floods BCI with signals to cause denial of service.

    Attack Vector:
        High-frequency signal flood designed to overwhelm processing
        and potentially cause seizure or device malfunction.

    Expected Defense:
        Rate limiting should detect and block DoS pattern before
        it affects neural tissue or device operation.

    Reference:
        Kohno (2009): "adversarial entities trying to exploit these
        devices to... block... neural signals"
    """
    from oni.neurosecurity import NeurosecurityFirewall, NeuralSignal

    config = NeurosecurityConfig(
        dos_window_ms=100.0,
        dos_threshold_count=100
    )
    firewall = NeurosecurityFirewall(config)

    # Normal operation - signals should pass
    for i in range(50):
        signal = NeuralSignal(
            amplitude=50.0,
            coherence_score=0.8,
            timestamp=i * 2.0  # 500 Hz - normal
        )
        assert firewall.validate_signal(signal) == SecurityDecision.ALLOW

    # DoS attack - rapid flood
    for i in range(200):
        signal = NeuralSignal(
            amplitude=50.0,
            coherence_score=0.8,
            timestamp=100 + i * 0.1  # 10,000 Hz - attack
        )
        result = firewall.validate_signal(signal)

    # After threshold, signals should be blocked
    assert result == SecurityDecision.BLOCK
```

### Scenario 3: Thought Extraction Attack (Eavesdropping)

**Reference:** BCI Anonymizer patent + Kohno's eavesdropping threat

```python
# tests/MAIN/test_thought_extraction.py

def test_thought_extraction_prevention():
    """
    Test: Attacker attempts to extract private thoughts/memories.

    Attack Vector:
        Attacker gains access to raw neural signals and uses ML
        to decode emotional states, face recognition, or memories.

    Expected Defense:
        BCI Anonymizer should filter privacy-sensitive ERP components
        before any signal leaves the device.

    Reference:
        Chizeck & Bonaci (2014): "Filter privacy-sensitive information
        like emotional states, financial associations, and memories"
    """
    from oni.neurosecurity import BCIAnonymizer, AnonymizerConfig, ERPType

    # Configure for motor BCI (only motor ERPs allowed)
    config = AnonymizerConfig(
        allowed_erp_types={ERPType.LRP, ERPType.CNV}  # Motor only
    )
    anonymizer = BCIAnonymizer(config)

    # Signal containing face recognition response (N170)
    signal_with_face = create_signal_with_erp(ERPType.N170)

    anonymized, metrics = anonymizer.anonymize(signal_with_face)

    # Face recognition component should be removed
    assert "n170" in [c.lower() for c in metrics.sensitive_components_removed]
    assert metrics.privacy_score > 0.5  # Significant filtering occurred

    # Signal containing only motor preparation (LRP)
    motor_signal = create_signal_with_erp(ERPType.LRP)

    anonymized_motor, motor_metrics = anonymizer.anonymize(motor_signal)

    # Motor components should pass through
    assert len(motor_metrics.sensitive_components_removed) == 0
    assert motor_metrics.privacy_score < 0.3
```

### Scenario 4: Neural Ransomware

**Reference:** ONI threat model + Kohno's blocking category

```python
# tests/MAIN/test_neural_ransomware.py

def test_ransomware_defense():
    """
    Test: Attacker deploys ransomware that locks neural patterns.

    Attack Vector:
        Malware gains control of BCI and threatens to:
        1. Block all motor commands until ransom paid
        2. Trigger harmful stimulation patterns
        3. Corrupt calibration data

    Expected Defense:
        Multiple layers should detect and prevent ransomware:
        - L8: Detect anomalous control patterns
        - Hardware: Enforce stimulation limits regardless of software
        - Emergency: Hardware kill switch

    Reference:
        Kohno (2009): "Due to the plasticity of the neural system,
        changes made by hackers could have irreversible effects"
    """
    from oni.neurosecurity import NeurosecurityFirewall
    from oni.attacks import RansomwarePattern

    firewall = NeurosecurityFirewall()

    # Ransomware attempting to lock motor commands
    ransomware = RansomwarePattern(
        type="motor_lockout",
        target_region="M1",
        method="signal_suppression"
    )

    # Detect ransomware signature
    signals = ransomware.generate_attack_signals()

    for signal in signals:
        result = firewall.validate_signal(signal)
        # All ransomware signals should be blocked
        assert result in [SecurityDecision.BLOCK, SecurityDecision.EMERGENCY_SHUTOFF]

    # Verify emergency response triggered
    assert firewall.emergency_triggered
    assert firewall.threat_log[-1]['type'] == ThreatType.BLOCKING
```

### Scenario 5: Side-Channel Privacy Leak

**Reference:** BCI Anonymizer patent

```python
# tests/MAIN/test_side_channel.py

def test_side_channel_leak_prevention():
    """
    Test: Attacker uses timing/power analysis to extract private info.

    Attack Vector:
        Even with anonymization, attacker analyzes:
        - Processing time variations
        - Power consumption patterns
        - Encrypted packet sizes
        to infer private mental states.

    Expected Defense:
        Constant-time processing and padding to prevent side-channel leaks.

    Reference:
        Chizeck & Bonaci (2014): "Information leakage via timing"
    """
    from oni.neurosecurity import BCIAnonymizer
    import time

    anonymizer = BCIAnonymizer()

    # Process signals with different privacy content
    timings = []
    for _ in range(100):
        signal = create_random_signal()
        start = time.perf_counter()
        anonymizer.anonymize(signal)
        end = time.perf_counter()
        timings.append(end - start)

    # Timing variance should be minimal (constant-time processing)
    timing_variance = np.var(timings)
    assert timing_variance < 0.001, "Processing time varies too much - side-channel risk"
```

---

## Integration with Existing ONI Components

### Coherence Metric Integration

The Coherence Metric (Cₛ) serves as the primary integrity validator:

```python
# oni/neurosecurity/integration.py

from oni.coherence import CoherenceMetric
from oni.neurosecurity import NeurosecurityFirewall, BCIAnonymizer

class IntegratedNeurosecurityPipeline:
    """
    Complete neurosecurity pipeline integrating:
    - Kohno's threat model (CIA triad)
    - BCI Anonymizer (privacy filtering)
    - ONI Coherence Metric (signal validation)
    """

    def __init__(self):
        self.coherence = CoherenceMetric()
        self.firewall = NeurosecurityFirewall()
        self.anonymizer = BCIAnonymizer()

    def process_signal(self, raw_signal: 'RawNeuralSignal') -> 'ProcessedSignal':
        """
        Full security pipeline:

        1. L9: Signal acquisition & preprocessing
        2. L8: Neurosecurity firewall (Kohno CIA checks)
        3. L10: Feature extraction
        4. L13-14: Privacy filtering (BCI Anonymizer)
        5. L13: Intent decoding
        """
        # Step 1: Calculate coherence
        cs = self.coherence.calculate(raw_signal)
        raw_signal.coherence_score = cs

        # Step 2: Firewall validation
        decision = self.firewall.validate_signal(raw_signal)

        if decision == SecurityDecision.EMERGENCY_SHUTOFF:
            self._trigger_emergency()
            return None

        if decision == SecurityDecision.BLOCK:
            return None

        # Step 3: Feature extraction
        features = self._extract_features(raw_signal)

        # Step 4: Privacy filtering
        anonymized, privacy_metrics = self.anonymizer.anonymize(raw_signal)

        # Step 5: Generate output
        return ProcessedSignal(
            data=anonymized,
            coherence_score=cs,
            privacy_score=privacy_metrics.score,
            security_decision=decision
        )
```

### TARA Integration

Update TARA's NSAM to include neurosecurity monitoring:

```python
# In tara/nsam/rules.py - add neurosecurity rules

NEUROSECURITY_RULES = {
    "kohno_alteration_detect": {
        "name": "Kohno Alteration Detection",
        "description": "Detect signal alteration attacks (Kohno 2009)",
        "condition": "coherence_score < 0.5 AND amplitude_change > 50%",
        "action": "BLOCK",
        "severity": "CRITICAL",
        "reference": "Denning et al. (2009) Neurosurgical Focus 27(1):E7"
    },
    "kohno_blocking_detect": {
        "name": "Kohno DoS Detection",
        "description": "Detect signal blocking/DoS attacks (Kohno 2009)",
        "condition": "signal_rate > 10000 Hz OR signal_gap > 500ms",
        "action": "BLOCK",
        "severity": "CRITICAL",
        "reference": "Denning et al. (2009) Neurosurgical Focus 27(1):E7"
    },
    "anonymizer_privacy_alert": {
        "name": "Privacy Leak Detection",
        "description": "Detect potential privacy-sensitive content (Chizeck & Bonaci 2014)",
        "condition": "privacy_score > 0.7",
        "action": "FILTER",
        "severity": "HIGH",
        "reference": "Bonaci et al. (2015) IEEE T&S Magazine"
    }
}
```

---

## Implementation Roadmap

### Phase 1: Core Components (Week 1-2)

| Task | Priority | Deliverable |
|------|----------|-------------|
| Implement `NeurosecurityFirewall` class | HIGH | `oni/neurosecurity/firewall.py` |
| Add Kohno threat type enums | HIGH | `oni/neurosecurity/threats.py` |
| Create rate limiter for DoS defense | HIGH | `oni/neurosecurity/rate_limiter.py` |
| Unit tests for firewall | HIGH | `tests/MAIN/test_firewall.py` |

### Phase 2: Privacy Components (Week 3-4)

| Task | Priority | Deliverable |
|------|----------|-------------|
| Implement `BCIAnonymizer` class | HIGH | `oni/neurosecurity/anonymizer.py` |
| Add ERP classification | MEDIUM | `oni/neurosecurity/erp.py` |
| Implement Privacy Score (Pₛ) | HIGH | `oni/neurosecurity/privacy_score.py` |
| Unit tests for anonymizer | HIGH | `tests/MAIN/test_anonymizer.py` |

### Phase 3: Integration (Week 5-6)

| Task | Priority | Deliverable |
|------|----------|-------------|
| Integrate with Coherence Metric | HIGH | `oni/neurosecurity/integration.py` |
| Add TARA NSAM rules | MEDIUM | `tara/nsam/rules.py` update |
| Create attack scenarios | MEDIUM | `tests/MAIN/scenarios/` |
| Update documentation | HIGH | `NEUROSECURITY_IMPLEMENTATION.md` |

### Phase 4: Testing & Validation (Week 7-8)

| Task | Priority | Deliverable |
|------|----------|-------------|
| Full attack scenario testing | HIGH | Test reports |
| Performance benchmarks | MEDIUM | Benchmark results |
| Documentation review | HIGH | Updated docs |
| TARA UI integration | LOW | Dashboard updates |

---

## References

### Primary Sources

1. Denning, T., Matsuoka, Y., & Kohno, T. (2009). Neurosecurity: Security and privacy for neural devices. *Neurosurgical Focus*, 27(1), E7. https://doi.org/10.3171/2009.4.FOCUS0985

2. Bonaci, T., Calo, R., & Chizeck, H. J. (2015). App stores for the brain: Privacy and security in brain-computer interfaces. *IEEE Technology and Society Magazine*, 34(2), 32-39.

3. Bonaci, T., Calo, R., & Chizeck, H. J. (2015). App stores for the brain: Privacy and security in brain-computer interfaces. *IEEE Technology and Society Magazine*, 34(2), 32-39.

### Supporting Research

4. Ienca, M., & Haselager, P. (2016). Hacking the brain: brain–computer interfacing technology and the ethics of neurosecurity. *Ethics and Information Technology*, 18(2), 117-129.

5. Landau, O., Puzis, R., & Nissim, N. (2020). Mind your privacy: Privacy leakage through BCI applications using machine learning. *Knowledge-Based Systems*, 198, 105932.

6. Yuste, R., et al. (2017). Four ethical priorities for neurotechnologies and AI. *Nature*, 551(7679), 159-163.

---

## Acknowledgments

This implementation guide was developed as part of the ONI Framework project, building upon the foundational neurosecurity research established by Tadayoshi Kohno and colleagues at the University of Washington. Privacy filtering concepts are inspired by BCI security research from the UW BioRobotics Lab (Bonaci, Chizeck, et al.).

The ONI Framework extends these concepts with:
- A unified 14-layer architecture mapping to OSI
- The Coherence Metric (Cₛ) for real-time signal validation
- Integration with the TARA security operations platform

---

*Last Updated: 2026-01-23*
*Part of the [ONI Framework](../README.md)*
*See also: [RELATED_WORK.md](../RELATED_WORK.md) | [ONI_LAYERS.md](ONI_LAYERS.md)*
