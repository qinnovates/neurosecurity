"""
ONI Framework - Neuroscience API for Brain-Computer Interface Security
======================================================================

A Python library providing neuroscience mappings and security primitives for
BCI development and research.

WHAT YOU GET:
    Neuroscience Atlas - Brain regions, neurotransmitters, cognitive functions
    14-Layer Model     - ONI architecture with attack surfaces and defenses
    Coherence Metric   - Signal trust scoring (Cₛ)
    Scale-Frequency    - Biological plausibility validation (f × S ≈ k)
    Privacy Tools      - BCI Anonymizer, privacy risk scoring
    Threat Detection   - Kohno's CIA threat model

QUICK START:
    >>> from oni import ONIStack, get_atlas
    >>>
    >>> # Explore the 14-layer model
    >>> stack = ONIStack()
    >>> print(stack.ascii_diagram())
    >>>
    >>> # Get neuroscience mappings for a layer
    >>> regions = stack.brain_regions_for_layer(13)  # Semantic Layer
    >>> print(regions)  # ['VTA', 'NAc', 'PFC', ...]
    >>>
    >>> # Look up neurotransmitter cofactors
    >>> atlas = get_atlas()
    >>> da = atlas.neurotransmitter("dopamine")
    >>> print(da.required_cofactors)  # ['Fe²⁺', 'BH4', 'O₂']
    >>>
    >>> # Calculate coherence score
    >>> from oni import CoherenceMetric
    >>> metric = CoherenceMetric(reference_freq=40.0)
    >>> cs = metric.calculate([0.0, 0.025, 0.050], [100, 98, 102])

INSTALLATION:
    pip install oni-framework

Built on research from:
    - Björklund & Dunnett (2007): Dopamine pathways
    - Lazarus et al. (2011): Adenosine/caffeine mechanisms
    - Kohno et al. (2009): Neurosecurity threat model
    - Bonaci et al. (2014): BCI Anonymizer architecture

License: Apache 2.0
Author: Kevin L. Qi
"""

__version__ = "0.2.6"
__author__ = "Kevin L. Qi"

# =============================================================================
# BRAND: Project Identity (Single Source of Truth)
# =============================================================================
from .brand import ONI, TARA, ONI_VERSION, TARA_VERSION, get_brand

# =============================================================================
# CORE: Signal Trust & Validation
# =============================================================================
from .coherence import CoherenceMetric, calculate_cs, VarianceComponents
from .scale_freq import ScaleFrequencyInvariant
from .firewall import NeuralFirewall

# =============================================================================
# ARCHITECTURE: 14-Layer Reference Model
# =============================================================================
from .layers import ONIStack, Layer, Domain, get_stack, layer_info

# =============================================================================
# NEUROSCIENCE MAPPINGS: Brain Regions, Neurotransmitters, Functions
# =============================================================================
from .neuromapping import (
    NeuroscienceAtlas,
    BrainRegion,
    BrainRegionAtlas,
    NeurotransmitterSystem,
    NeurotransmitterAtlas,
    CognitiveFunction,
    CognitiveFunctionAtlas,
    TimeScale,
    TimeScaleHierarchy,
    Citation,
    References,
    get_atlas,
)

# =============================================================================
# NEUROSECURITY: Threat Detection (Kohno 2009)
# =============================================================================
from .neurosecurity import (
    # Threat Model
    ThreatType,
    SecurityDecision,
    KohnoThreatModel,
    NeurosecurityFirewall,
    NeurosecurityConfig,
    # Privacy (BCI Anonymizer - Bonaci 2015)
    BCIAnonymizer,
    AnonymizerConfig,
    ERPType,
    PrivacySensitivity,
    # Privacy Scoring
    PrivacyScoreCalculator,
    PrivacyScoreResult,
)

# =============================================================================
# CONSENT: Patient Consent Management
# =============================================================================
try:
    from .neurosecurity.consent import (
        ConsentManager,
        ConsentScope,
        ConsentState,
        PediatricConsentState,
    )
    _CONSENT_AVAILABLE = True
except ImportError:
    _CONSENT_AVAILABLE = False

# =============================================================================
# PUBLIC API
# =============================================================================
__all__ = [
    # Version
    "__version__",
    "__author__",

    # Brand Identity
    "ONI",
    "TARA",
    "ONI_VERSION",
    "TARA_VERSION",
    "get_brand",

    # Signal Trust
    "CoherenceMetric",
    "calculate_cs",
    "VarianceComponents",
    "ScaleFrequencyInvariant",
    "NeuralFirewall",

    # Architecture
    "ONIStack",
    "Layer",
    "Domain",
    "get_stack",
    "layer_info",

    # Neuroscience Mappings
    "NeuroscienceAtlas",
    "BrainRegion",
    "BrainRegionAtlas",
    "NeurotransmitterSystem",
    "NeurotransmitterAtlas",
    "CognitiveFunction",
    "CognitiveFunctionAtlas",
    "TimeScale",
    "TimeScaleHierarchy",
    "Citation",
    "References",
    "get_atlas",

    # Threat Detection (Kohno 2009)
    "ThreatType",
    "SecurityDecision",
    "KohnoThreatModel",
    "NeurosecurityFirewall",
    "NeurosecurityConfig",

    # Privacy (BCI Anonymizer)
    "BCIAnonymizer",
    "AnonymizerConfig",
    "ERPType",
    "PrivacySensitivity",
    "PrivacyScoreCalculator",
    "PrivacyScoreResult",
]

# Add consent exports if available
if _CONSENT_AVAILABLE:
    __all__.extend([
        "ConsentManager",
        "ConsentScope",
        "ConsentState",
        "PediatricConsentState",
    ])


def get_version() -> str:
    """Return the current ONI Framework version."""
    return __version__


def print_summary():
    """Print a summary of available modules and their purposes."""
    print(f"""
{ONI.name} v{__version__} — {ONI.tagline}
{'=' * 50}
{ONI.slogan}

NEUROSCIENCE MAPPINGS (NEW)
  NeuroscienceAtlas    Brain regions, NTs, functions
  BrainRegionAtlas     15+ brain regions with citations
  NeurotransmitterAtlas 8 NT systems with cofactors
  CognitiveFunctionAtlas 10 functions mapped to layers
  TimeScaleHierarchy   Femtoseconds to lifetime
  References           20+ peer-reviewed citations

ARCHITECTURE
  ONIStack             Navigate 14-layer model
  Layer                Individual layer details
  get_stack            Get pre-configured stack
  layer_info           Comprehensive layer info with neuroscience

SIGNAL VALIDATION
  CoherenceMetric      Calculate Cₛ trust scores (0-1)
  ScaleFrequencyInvariant   Validate f × S ≈ k
  NeuralFirewall       Accept/reject/flag decisions

THREAT DETECTION
  KohnoThreatModel     CIA threat classification
  NeurosecurityFirewall Combined coherence + threats

PRIVACY
  BCIAnonymizer        Strip sensitive ERPs (P300, N170)
  PrivacyScoreCalculator   Quantify info leakage risk

QUICK START
  >>> from oni import ONIStack, get_atlas
  >>> stack = ONIStack()
  >>> regions = stack.brain_regions_for_layer(13)
  >>> atlas = get_atlas()
  >>> da = atlas.neurotransmitter("dopamine")
  >>> print(da.required_cofactors)  # ['Fe²⁺', 'BH4', 'O₂']

DOCUMENTATION
  https://github.com/qinnovates/mindloft
""")
