"""
ONI Framework Layer Model

Implements the 14-layer Open Neurosecurity Interoperability model that extends
the OSI networking model into biological neural systems.

===============================================================================
IMPORTANT: FOR NON-TECHNICAL COLLABORATORS
===============================================================================
This module defines a conceptual MODEL — think of it as a map or blueprint.

WHAT IT IS:
A way to organize and talk about the different "layers" between a brain and
a computer. Just like a building has floors, the ONI Framework has 14 layers.

WHY 14 LAYERS?
The traditional OSI network model (used in internet/networking) has 7 layers.
ONI extends this with:
- 7 silicon layers (L1-L7): Traditional OSI networking
- 1 bridge layer (L8): Neural Gateway - where electrodes meet neurons
- 6 biological layers (L9-L14): Cognitive processing from signals to identity

THIS IS A REFERENCE MODEL, NOT SIGNAL PROCESSING:
This module doesn't calculate anything about signals. It's a vocabulary tool
that helps researchers and engineers agree on terminology:
- "The attack happened at Layer 8" = the electrode interface
- "We need defenses at Layer 9" = signal processing on the biology side

HOW TO USE IT:
- Explore the model with stack.ascii_diagram()
- Look up attack surfaces for each layer
- Use neuroscience mappings for brain regions, neurotransmitters, functions
- Use as a framework for discussing BCI security

Nothing here connects to hardware. It's purely educational and organizational.
===============================================================================

Layer Model (v3.0):
  Layers 1-7:  Silicon domain (OSI networking layers)
  Layer 8:     Neural Gateway (bio-digital boundary, firewall location)
  Layers 9-14: Biology domain (cognitive processing to identity)

Reference: ONI_LAYERS.md
"""

from dataclasses import dataclass, field
from enum import Enum, auto
from typing import Dict, List, Optional, Any, TYPE_CHECKING

# Avoid circular import - neuromapping imports are deferred
if TYPE_CHECKING:
    from .neuromapping import NeuroscienceAtlas


class Domain(Enum):
    """Domain classification for ONI layers."""
    SILICON = auto()   # L1-L7: Traditional OSI networking
    BRIDGE = auto()    # L8: Neural Gateway
    BIOLOGY = auto()   # L9-L14: Cognitive/Neural processing


@dataclass
class Layer:
    """
    Represents a single layer in the ONI Framework.

    Attributes:
        number: Layer number (1-14)
        name: Layer name
        domain: Domain classification (silicon, bridge, biology)
        zone_label: Short label (e.g., "Physical", "Firewall", "Self")
        function: Primary function description
        osi_parallel: Corresponding OSI layer concept (for biology layers)
        attack_surfaces: Known attack vectors at this layer
        defenses: Recommended security measures
        metadata: Additional layer metadata
    """
    number: int
    name: str
    domain: Domain
    zone_label: str
    function: str
    osi_parallel: Optional[str] = None
    attack_surfaces: List[str] = field(default_factory=list)
    defenses: List[str] = field(default_factory=list)
    metadata: Dict[str, Any] = field(default_factory=dict)

    def __repr__(self) -> str:
        return f"Layer({self.number}, '{self.name}', {self.domain.name})"

    @property
    def is_silicon(self) -> bool:
        """True if this is a silicon/OSI layer (L1-L7)."""
        return self.domain == Domain.SILICON

    @property
    def is_bridge(self) -> bool:
        """True if this is the bridge layer (L8)."""
        return self.domain == Domain.BRIDGE

    @property
    def is_biology(self) -> bool:
        """True if this is a biology/cognitive layer (L9-L14)."""
        return self.domain == Domain.BIOLOGY

    @property
    def is_firewall(self) -> bool:
        """True if this is the firewall/gateway layer."""
        return self.number == 8


class ONIStack:
    """
    The complete 14-layer ONI Framework model.

    Extends OSI's 7-layer network model into biological neural systems,
    creating a unified architecture for brain-computer interface security.

    Layer Model (v3.0):
        L1-L7:  Silicon (OSI networking layers)
        L8:     Neural Gateway (Bridge/Firewall)
        L9-L14: Biology (Cognitive processing)

    Example:
        >>> stack = ONIStack()
        >>> print(stack.layer(8))  # Neural Gateway
        >>> for layer in stack.biology_layers():
        ...     print(f"L{layer.number}: {layer.name}")

    Neuroscience Mappings:
        >>> # Get brain regions relevant to a layer
        >>> regions = stack.brain_regions_for_layer(13)
        >>> # Get neurotransmitters relevant to a layer
        >>> neurotransmitters = stack.neurotransmitters_for_layer(12)
    """

    # Version aligned with ONI_LAYERS.md
    VERSION = "3.0"

    def __init__(self):
        """Initialize the ONI stack with all 14 layers."""
        self._layers: Dict[int, Layer] = {}
        self._atlas = None  # Lazy-loaded neuroscience atlas
        self._build_stack()

    def _build_stack(self):
        """
        Build the complete 14-layer ONI stack.

        Layer definitions match ONI_LAYERS.md v3.0:
        - L1-L7: Silicon (OSI)
        - L8: Neural Gateway (Bridge)
        - L9-L14: Biology (Cognitive)
        """

        # =====================================================================
        # SILICON DOMAIN (L1-L7) - Traditional OSI Networking
        # =====================================================================
        # These layers handle data movement. They do not know or care about brains.

        self._layers[1] = Layer(
            number=1,
            name="Physical Carrier",
            domain=Domain.SILICON,
            zone_label="Physical",
            function="Transmission of raw bits over a medium",
            osi_parallel="OSI Layer 1 (Physical)",
            attack_surfaces=[
                "Physical tampering",
                "Side-channel attacks",
                "RF interference",
                "Power analysis"
            ],
            defenses=[
                "Tamper detection",
                "Shielding",
                "Physical security"
            ],
        )

        self._layers[2] = Layer(
            number=2,
            name="Signal Processing",
            domain=Domain.SILICON,
            zone_label="Data Link",
            function="Framing, MAC addressing, local delivery",
            osi_parallel="OSI Layer 2 (Data Link)",
            attack_surfaces=[
                "MAC spoofing",
                "Frame injection",
                "ARP poisoning"
            ],
            defenses=[
                "MAC filtering",
                "Frame validation",
                "Encryption"
            ],
        )

        self._layers[3] = Layer(
            number=3,
            name="Protocol",
            domain=Domain.SILICON,
            zone_label="Network",
            function="Logical addressing and routing",
            osi_parallel="OSI Layer 3 (Network)",
            attack_surfaces=[
                "IP spoofing",
                "Routing attacks",
                "MITM"
            ],
            defenses=[
                "IPsec",
                "Route validation",
                "Network segmentation"
            ],
        )

        self._layers[4] = Layer(
            number=4,
            name="Transport",
            domain=Domain.SILICON,
            zone_label="Transport",
            function="End-to-end delivery, flow control",
            osi_parallel="OSI Layer 4 (Transport)",
            attack_surfaces=[
                "TCP hijacking",
                "DoS attacks",
                "Port scanning"
            ],
            defenses=[
                "TLS",
                "Rate limiting",
                "Connection monitoring"
            ],
        )

        self._layers[5] = Layer(
            number=5,
            name="Session",
            domain=Domain.SILICON,
            zone_label="Session",
            function="Connection lifecycle management",
            osi_parallel="OSI Layer 5 (Session)",
            attack_surfaces=[
                "Session hijacking",
                "Replay attacks",
                "Session fixation"
            ],
            defenses=[
                "Session tokens",
                "Timeout enforcement",
                "Cryptographic binding"
            ],
        )

        self._layers[6] = Layer(
            number=6,
            name="Presentation",
            domain=Domain.SILICON,
            zone_label="Presentation",
            function="Encoding, encryption, compression",
            osi_parallel="OSI Layer 6 (Presentation)",
            attack_surfaces=[
                "Encoding exploits",
                "Compression bombs",
                "Format string attacks"
            ],
            defenses=[
                "Input validation",
                "Format verification",
                "Size limits"
            ],
        )

        self._layers[7] = Layer(
            number=7,
            name="Application Interface",
            domain=Domain.SILICON,
            zone_label="Application",
            function="User-facing network services",
            osi_parallel="OSI Layer 7 (Application)",
            attack_surfaces=[
                "API exploits",
                "Injection attacks",
                "Authentication bypass"
            ],
            defenses=[
                "Input sanitization",
                "Authentication",
                "Authorization"
            ],
        )

        # =====================================================================
        # BRIDGE LAYER (L8) - Neural Gateway
        # =====================================================================
        # This is the firewall layer - the critical boundary where silicon meets biology.

        self._layers[8] = Layer(
            number=8,
            name="Neural Gateway",
            domain=Domain.BRIDGE,
            zone_label="Firewall",
            function="Physical and logical interface between neural tissue and computation",
            osi_parallel=None,  # No OSI equivalent - this is the ONI innovation
            attack_surfaces=[
                "Signal injection",
                "Electrode tampering",
                "Unauthorized stimulation",
                "RF interference",
                "Firmware exploits",
                "Stimulation flooding",
                "Charge density attacks"
            ],
            defenses=[
                "Coherence validation (Cₛ)",
                "Hardware safety bounds",
                "Signal authentication",
                "Anomaly detection",
                "Rate limiting",
                "Region authorization",
                "Charge density limits (Shannon k=1.5)"
            ],
            metadata={
                "firewall_layer": True,
                "critical": True,
                "bidirectional": True,
                "citations": ["shannon1992", "merrill2005"]
            },
        )

        # =====================================================================
        # BIOLOGY DOMAIN (L9-L14) - Cognitive Processing
        # =====================================================================
        # This is where the brain enters the network.
        # Each layer has a parallel to OSI on the biology side.

        self._layers[9] = Layer(
            number=9,
            name="Signal Processing",
            domain=Domain.BIOLOGY,
            zone_label="Filtering",
            function="Filtering, amplification, denoising, digitization",
            osi_parallel="Parallel to OSI L2 (Data Link)",
            attack_surfaces=[
                "Filter bypass",
                "Noise injection",
                "Signal jamming",
                "ADC manipulation"
            ],
            defenses=[
                "Hardware limits",
                "Calibration verification",
                "SNR monitoring"
            ],
            metadata={
                "time_scale": "milliseconds",
                "primary_functions": ["sensory_processing"],
            },
        )

        self._layers[10] = Layer(
            number=10,
            name="Neural Protocol",
            domain=Domain.BIOLOGY,
            zone_label="Encoding",
            function="Mapping neural signals to machine-readable formats",
            osi_parallel="Parallel to OSI L3 (Network)",
            attack_surfaces=[
                "Protocol manipulation",
                "Encoding exploits",
                "Neural codec attacks"
            ],
            defenses=[
                "Schema validation",
                "Checksums",
                "Format verification"
            ],
            metadata={
                "time_scale": "event-driven",
                "primary_functions": ["motor_control", "sensory_processing"],
            },
        )

        self._layers[11] = Layer(
            number=11,
            name="Cognitive Transport",
            domain=Domain.BIOLOGY,
            zone_label="Delivery",
            function="Reliable transmission of neural/cognitive state",
            osi_parallel="Parallel to OSI L4 (Transport)",
            attack_surfaces=[
                "State corruption",
                "Transport disruption",
                "Cognitive DoS"
            ],
            defenses=[
                "Redundancy checks",
                "Integrity validation",
                "State monitoring"
            ],
            metadata={
                "time_scale": "seconds to minutes",
                "primary_functions": ["attention", "sleep_regulation"],
            },
        )

        self._layers[12] = Layer(
            number=12,
            name="Cognitive Session",
            domain=Domain.BIOLOGY,
            zone_label="Context",
            function="Context persistence, working memory windows",
            osi_parallel="Parallel to OSI L5 (Session)",
            attack_surfaces=[
                "Context manipulation",
                "Working memory disruption",
                "Attention hijacking"
            ],
            defenses=[
                "Context validation",
                "Attention monitoring",
                "State persistence checks"
            ],
            metadata={
                "time_scale": "seconds to minutes",
                "primary_functions": ["working_memory", "attention", "emotion"],
            },
        )

        self._layers[13] = Layer(
            number=13,
            name="Semantic Layer",
            domain=Domain.BIOLOGY,
            zone_label="Intent",
            function="Meaning construction, goal formation, agency",
            osi_parallel="Parallel to OSI L6 (Presentation)",
            attack_surfaces=[
                "Intent manipulation",
                "Semantic injection",
                "Goal distortion",
                "Decision manipulation"
            ],
            defenses=[
                "Intent verification",
                "Semantic consistency checks",
                "Anomaly detection"
            ],
            metadata={
                "time_scale": "minutes to hours",
                "primary_functions": ["reward_processing", "decision_making", "memory_encoding"],
            },
        )

        self._layers[14] = Layer(
            number=14,
            name="Identity Layer",
            domain=Domain.BIOLOGY,
            zone_label="Self",
            function="Self-model, moral reasoning, long-term coherence",
            osi_parallel="Parallel to OSI L7 (Application)",
            attack_surfaces=[
                "Identity attacks",
                "Long-term manipulation",
                "Value distortion",
                "Personality modification"
            ],
            defenses=[
                "Behavioral baselines",
                "Ethics filters",
                "Longitudinal monitoring",
                "Consent verification"
            ],
            metadata={
                "time_scale": "days to lifetime",
                "primary_functions": ["self_awareness"],
                "bci_access": "read-only"
            },
        )

    # =========================================================================
    # Layer Access Methods
    # =========================================================================

    def layer(self, number: int) -> Layer:
        """
        Get a specific layer by number.

        Args:
            number: Layer number (1-14)

        Returns:
            Layer object

        Raises:
            KeyError: If layer number is invalid
        """
        if number not in self._layers:
            raise KeyError(f"Invalid layer number: {number}. Must be 1-14.")
        return self._layers[number]

    def __getitem__(self, number: int) -> Layer:
        """Allow indexing: stack[8] returns Layer 8."""
        return self.layer(number)

    def __iter__(self):
        """Iterate through all layers in order."""
        for i in range(1, 15):
            yield self._layers[i]

    def __len__(self) -> int:
        return 14

    # =========================================================================
    # Domain Grouping Methods
    # =========================================================================

    def silicon_layers(self) -> List[Layer]:
        """Return all silicon/OSI domain layers (L1-L7)."""
        return [self._layers[i] for i in range(1, 8)]

    def biology_layers(self) -> List[Layer]:
        """Return all biology/cognitive domain layers (L9-L14)."""
        return [self._layers[i] for i in range(9, 15)]

    def bridge_layer(self) -> Layer:
        """Return the bridge layer (L8 - Neural Gateway)."""
        return self._layers[8]

    def firewall_layer(self) -> Layer:
        """Return the firewall layer (L8 - Neural Gateway)."""
        return self._layers[8]

    # Backwards compatibility aliases
    def biological_layers(self) -> List[Layer]:
        """Alias for biology_layers() for backwards compatibility."""
        return self.biology_layers()

    # =========================================================================
    # Security Analysis Methods
    # =========================================================================

    def get_attack_surfaces(self, layer_range: Optional[tuple] = None) -> Dict[int, List[str]]:
        """
        Get attack surfaces for specified layers.

        Args:
            layer_range: Optional (start, end) tuple, defaults to all layers

        Returns:
            Dict mapping layer numbers to attack surface lists
        """
        start, end = layer_range or (1, 14)
        return {
            i: self._layers[i].attack_surfaces
            for i in range(start, end + 1)
        }

    def get_defenses(self, layer_range: Optional[tuple] = None) -> Dict[int, List[str]]:
        """
        Get defenses for specified layers.

        Args:
            layer_range: Optional (start, end) tuple, defaults to all layers

        Returns:
            Dict mapping layer numbers to defense lists
        """
        start, end = layer_range or (1, 14)
        return {
            i: self._layers[i].defenses
            for i in range(start, end + 1)
        }

    # =========================================================================
    # Neuroscience Mapping Integration
    # =========================================================================

    def _get_atlas(self):
        """Lazy-load the neuroscience atlas."""
        if self._atlas is None:
            from .neuromapping import NeuroscienceAtlas
            self._atlas = NeuroscienceAtlas()
        return self._atlas

    def brain_regions_for_layer(self, layer_num: int) -> List[str]:
        """
        Get brain regions relevant to a specific ONI layer.

        Uses the NeuroscienceAtlas to map brain regions to layers based on
        their primary functions and neurotransmitter involvement.

        Args:
            layer_num: Layer number (1-14)

        Returns:
            List of brain region abbreviations

        Example:
            >>> stack = ONIStack()
            >>> regions = stack.brain_regions_for_layer(13)
            >>> print(regions)  # ['VTA', 'NAc', 'PFC', 'amygdala', ...]
        """
        atlas = self._get_atlas()
        return [r.abbreviation for r in atlas.regions.by_layer(layer_num)]

    def neurotransmitters_for_layer(self, layer_num: int) -> List[str]:
        """
        Get neurotransmitter systems relevant to a specific ONI layer.

        Uses the NeuroscienceAtlas to map neurotransmitter systems to layers.

        Args:
            layer_num: Layer number (1-14)

        Returns:
            List of neurotransmitter names

        Example:
            >>> stack = ONIStack()
            >>> nts = stack.neurotransmitters_for_layer(12)
            >>> print(nts)  # ['dopamine', 'serotonin', 'acetylcholine', ...]
        """
        atlas = self._get_atlas()
        return [nt.name for nt in atlas.neurotransmitters.by_layer(layer_num)]

    def functions_for_layer(self, layer_num: int) -> List[str]:
        """
        Get cognitive functions relevant to a specific ONI layer.

        Args:
            layer_num: Layer number (1-14)

        Returns:
            List of cognitive function names
        """
        atlas = self._get_atlas()
        return [f.name for f in atlas.functions.by_layer(layer_num)]

    def layer_neuroscience_report(self, layer_num: int) -> str:
        """
        Generate a comprehensive neuroscience report for an ONI layer.

        Includes brain regions, neurotransmitters, functions, and security
        implications based on cited research.

        Args:
            layer_num: Layer number (1-14)

        Returns:
            Formatted report string
        """
        atlas = self._get_atlas()
        return atlas.generate_layer_report(layer_num)

    def security_implications_for_layer(self, layer_num: int) -> List[str]:
        """
        Get security implications for attacks at a specific layer.

        Based on neuroscience research about what systems could be affected.

        Args:
            layer_num: Layer number (1-14)

        Returns:
            List of security implication strings
        """
        atlas = self._get_atlas()
        return atlas.security_implications(layer_num)

    # =========================================================================
    # Visualization Methods
    # =========================================================================

    def ascii_diagram(self) -> str:
        """Generate an ASCII representation of the ONI stack."""
        lines = [
            "┌─────────────────────────────────────────────────────────────┐",
            "│                 ONI FRAMEWORK v3.0 (L1-L14)                 │",
            "├─────────────────────────────────────────────────────────────┤",
            "│  BIOLOGY (L9-L14)                                          │",
        ]

        # Biology layers (top, L14 to L9)
        for i in range(14, 8, -1):
            layer = self._layers[i]
            lines.append(f"│  L{i:2d} │ {layer.zone_label:12} │ {layer.name:24} │")

        # Gateway layer
        lines.extend([
            "├═════════════════════════════════════════════════════════════┤",
            "│  L 8 │ ████ FIREWALL ████ │ NEURAL GATEWAY              │",
            "├═════════════════════════════════════════════════════════════┤",
            "│  SILICON (L1-L7) - OSI Model                               │",
        ])

        # Silicon layers (L7 to L1)
        for i in range(7, 0, -1):
            layer = self._layers[i]
            lines.append(f"│  L{i:2d} │ {layer.zone_label:12} │ {layer.name:24} │")

        lines.append("└─────────────────────────────────────────────────────────────┘")
        return "\n".join(lines)

    def summary(self) -> str:
        """Generate a text summary of the stack."""
        sil_count = len(self.silicon_layers())
        bio_count = len(self.biology_layers())
        total_attacks = sum(len(l.attack_surfaces) for l in self)
        total_defenses = sum(len(l.defenses) for l in self)

        return (
            f"ONI Framework v{self.VERSION} Summary:\n"
            f"  Total Layers: 14\n"
            f"  Silicon (L1-L7): {sil_count} layers (OSI networking)\n"
            f"  Bridge (L8): Neural Gateway (Firewall)\n"
            f"  Biology (L9-L14): {bio_count} layers (Cognitive processing)\n"
            f"  Attack Surfaces: {total_attacks}\n"
            f"  Defenses: {total_defenses}"
        )

    def layer_table(self) -> str:
        """Generate a formatted table of all layers."""
        lines = [
            "| Layer | Name                  | Zone         | Domain  |",
            "|-------|-----------------------|--------------|---------|",
        ]
        for layer in self:
            domain_str = layer.domain.name.capitalize()
            lines.append(
                f"| L{layer.number:02d}   | {layer.name:21} | {layer.zone_label:12} | {domain_str:7} |"
            )
        return "\n".join(lines)


# =============================================================================
# Convenience Functions
# =============================================================================

def get_stack() -> ONIStack:
    """Get a pre-configured ONI stack instance."""
    return ONIStack()


def layer_info(layer_num: int) -> Dict[str, Any]:
    """
    Get comprehensive information about a layer.

    Args:
        layer_num: Layer number (1-14)

    Returns:
        Dict with layer information including neuroscience mappings
    """
    stack = ONIStack()
    layer = stack.layer(layer_num)

    info = {
        "number": layer.number,
        "name": layer.name,
        "domain": layer.domain.name,
        "zone_label": layer.zone_label,
        "function": layer.function,
        "attack_surfaces": layer.attack_surfaces,
        "defenses": layer.defenses,
    }

    # Add neuroscience mappings for biology layers
    if layer.is_biology or layer.is_bridge:
        info["brain_regions"] = stack.brain_regions_for_layer(layer_num)
        info["neurotransmitters"] = stack.neurotransmitters_for_layer(layer_num)
        info["cognitive_functions"] = stack.functions_for_layer(layer_num)
        info["security_implications"] = stack.security_implications_for_layer(layer_num)

    return info
