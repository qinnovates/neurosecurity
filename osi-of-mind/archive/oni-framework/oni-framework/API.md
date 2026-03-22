# ONI Framework API Reference

> **Version:** 0.2.6
> **Package:** `oni-framework`
> **Install:** `pip install oni-framework`

---

## API Type

This is a **Library API (SDK)** — a Python package you import and use directly in your code. No server setup, API keys, or network requests required.

```python
# Install and use locally
pip install oni-framework

# Import and call directly
from oni import CoherenceMetric, get_atlas
metric = CoherenceMetric()
```

| API Type | This Package | Future |
|----------|--------------|--------|
| **Library API (SDK)** | ✓ Available now | — |
| **REST API** | — | Unplanned |


---

## Table of Contents

- [Quick Import Reference](#quick-import-reference)
- [Signal Trust & Validation](#signal-trust--validation)
  - [CoherenceMetric](#coherencemetric)
  - [NeuralFirewall](#neuralfirewall)
  - [ScaleFrequencyInvariant](#scalefrequencyinvariant)
- [Architecture](#architecture)
  - [ONIStack](#onistack)
  - [Layer](#layer)
- [Neuroscience Mappings](#neuroscience-mappings)
  - [NeuroscienceAtlas](#neuroscienceatlas)
  - [BrainRegion](#brainregion)
  - [NeurotransmitterSystem](#neurotransmittersystem)
  - [CognitiveFunction](#cognitivefunction)
  - [Citation](#citation)
- [Neurosecurity](#neurosecurity)
  - [KohnoThreatModel](#kohnothreatmodel)
  - [NeurosecurityFirewall](#neurosecurityfirewall)
  - [BCIAnonymizer](#bcianonymizer)
  - [PrivacyScoreCalculator](#privacyscorecalculator)
- [Enums & Constants](#enums--constants)

---

## Quick Import Reference

```python
from oni import (
    # Signal Trust
    CoherenceMetric,
    NeuralFirewall,
    ScaleFrequencyInvariant,

    # Architecture
    ONIStack,
    Layer,
    Domain,

    # Neuroscience
    NeuroscienceAtlas,
    get_atlas,

    # Neurosecurity
    KohnoThreatModel,
    NeurosecurityFirewall,
    BCIAnonymizer,
    PrivacyScoreCalculator,
)
```

---

## Signal Trust & Validation

### CoherenceMetric

Calculates the coherence score (Cₛ) — a trust metric from 0 to 1 based on signal consistency.

**Formula:** `Cₛ = e^(−(σ²φ + σ²τ + σ²γ))`

#### Constructor

```python
CoherenceMetric(reference_freq: float = 40.0, transport_factors: dict = None)
```

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `reference_freq` | `float` | `40.0` | Expected oscillation frequency in Hz (40 Hz = gamma) |
| `transport_factors` | `dict` | See below | Reliability factors for neural pathways |

**Default transport factors:**
```python
{
    'myelinated_axon': 0.999,
    'unmyelinated_axon': 0.97,
    'synaptic_transmission': 0.85,
    'dendritic_integration': 0.90,
}
```

#### Methods

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `calculate` | `arrival_times: List[float]`, `amplitudes: List[float]` | `float` | Coherence score (0-1) |
| `calculate_variances` | `arrival_times: List[float]`, `amplitudes: List[float]` | `VarianceComponents` | Individual variance components |
| `interpret` | `cs: float` | `Tuple[str, str]` | (level, description) for human readability |
| `get_band` | `name: str` | `Tuple[float, float]` | Frequency range for named band |

#### Example

```python
from oni import CoherenceMetric

metric = CoherenceMetric(reference_freq=40.0)

# Sample signal data
arrival_times = [0.0, 0.025, 0.050, 0.075, 0.100]  # seconds
amplitudes = [100, 98, 102, 99, 101]  # μV

# Calculate coherence
cs = metric.calculate(arrival_times, amplitudes)
print(f"Coherence Score: {cs:.3f}")  # e.g., 0.847

# Get interpretation
level, description = metric.interpret(cs)
print(f"{level}: {description}")  # "HIGH: Signal is consistent..."

# Get variance components
variances = metric.calculate_variances(arrival_times, amplitudes)
print(f"Phase variance (σ²φ): {variances.phase:.4f}")
print(f"Transport variance (σ²τ): {variances.transport:.4f}")
print(f"Gain variance (σ²γ): {variances.gain:.4f}")
```

#### Interpretation Thresholds

| Score Range | Level | Meaning |
|-------------|-------|---------|
| 0.8 - 1.0 | HIGH | Signal is consistent and trustworthy |
| 0.5 - 0.8 | MEDIUM | Some variance, may need verification |
| 0.0 - 0.5 | LOW | Signal is inconsistent, possibly tampered |

---

### NeuralFirewall

Zero-trust signal filtering with accept/reject/flag decisions based on coherence scores.

#### Constructor

```python
NeuralFirewall(
    threshold_high: float = 0.6,
    threshold_low: float = 0.3,
    amplitude_bounds: Tuple[float, float] = (0, 500),
    reference_freq: float = 40.0
)
```

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `threshold_high` | `float` | `0.6` | Cₛ above this = trusted |
| `threshold_low` | `float` | `0.3` | Cₛ below this = rejected |
| `amplitude_bounds` | `tuple` | `(0, 500)` | Valid amplitude range in μV |
| `reference_freq` | `float` | `40.0` | Reference frequency for coherence |

#### Methods

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `filter` | `signal: Signal` | `FilterResult` | Filter single signal |
| `filter_batch` | `signals: List[Signal]` | `List[FilterResult]` | Filter multiple signals |
| `get_stats` | — | `dict` | Statistics (accept/reject/flag counts) |
| `clear_log` | — | — | Reset statistics |
| `register_callback` | `level: AlertLevel`, `callback: Callable` | — | Register alert handler |

#### Signal Object

```python
from oni.firewall import Signal

signal = Signal(
    arrival_times=[0.0, 0.025, 0.050],
    amplitudes=[100, 98, 102],
    authenticated=True  # Device identity verified
)
```

| Field | Type | Description |
|-------|------|-------------|
| `arrival_times` | `List[float]` | Signal timestamps in seconds |
| `amplitudes` | `List[float]` | Signal amplitudes in μV |
| `authenticated` | `bool` | Whether source is verified |

#### FilterResult Object

| Field | Type | Description |
|-------|------|-------------|
| `decision` | `Decision` | ACCEPT, ACCEPT_FLAG, or REJECT |
| `coherence` | `float` | Calculated Cₛ score |
| `alert_level` | `AlertLevel` | NONE, LOW, MEDIUM, HIGH, CRITICAL |
| `reason` | `str` | Human-readable explanation |
| `accepted` | `bool` | Convenience property |
| `rejected` | `bool` | Convenience property |
| `flagged` | `bool` | Convenience property |

#### Decision Matrix

| Cₛ Score | Authenticated | Decision | Action |
|----------|---------------|----------|--------|
| > 0.6 | Yes | `ACCEPT` | Allow signal |
| > 0.6 | No | `REJECT` | Block (auth required) |
| 0.3–0.6 | Yes | `ACCEPT_FLAG` | Allow + log for review |
| 0.3–0.6 | No | `REJECT` | Block |
| < 0.3 | Any | `REJECT` | Block (anomaly detected) |

#### Example

```python
from oni import NeuralFirewall
from oni.firewall import Signal

firewall = NeuralFirewall(
    threshold_high=0.6,
    threshold_low=0.3,
    amplitude_bounds=(0, 500)
)

signal = Signal(
    arrival_times=[0.0, 0.025, 0.050],
    amplitudes=[100, 98, 102],
    authenticated=True
)

result = firewall.filter(signal)

print(f"Decision: {result.decision.name}")  # ACCEPT
print(f"Coherence: {result.coherence:.3f}")  # 0.892
print(f"Reason: {result.reason}")

# Check stats after processing many signals
stats = firewall.get_stats()
print(f"Accepted: {stats['accepted']}, Rejected: {stats['rejected']}")
```

---

### ScaleFrequencyInvariant

Validates biological plausibility using the scale-frequency relationship: `f × S ≈ k`

#### Constructor

```python
ScaleFrequencyInvariant(k: float = 0.004, tolerance: float = 0.5)
```

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `k` | `float` | `0.004` | Biological constant |
| `tolerance` | `float` | `0.5` | Allowed deviation (50%) |

#### Methods

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `validate` | `frequency: float`, `spatial_scale: float` | `bool` | Is signal biologically plausible? |
| `deviation` | `frequency: float`, `spatial_scale: float` | `float` | Fractional deviation from k |
| `expected_frequency` | `spatial_scale: float` | `float` | Predicted frequency for scale |
| `expected_scale` | `frequency: float` | `float` | Predicted scale for frequency |
| `anomaly_score` | `frequency: float`, `spatial_scale: float` | `float` | 0=normal, 1=impossible |
| `hierarchy_report` | — | `str` | Full scale-frequency hierarchy |

#### Scale-Frequency Hierarchy

| Scale | Size | Expected Frequency | Example |
|-------|------|-------------------|---------|
| Molecular | ~10 nm | ~400 MHz | Ion channels |
| Synaptic | ~1 μm | ~4 kHz | Synaptic cleft |
| Cellular | ~10 μm | ~400 Hz | Single neurons |
| Microcolumn | ~100 μm | ~40 Hz | Neural clusters |
| Macrocolumn | ~1 mm | ~4 Hz | Cortical columns |
| Regional | ~10 mm | ~0.4 Hz | Brain regions |
| Whole-Brain | ~100 mm | ~0.04 Hz | Global states |

#### Example

```python
from oni import ScaleFrequencyInvariant

sfi = ScaleFrequencyInvariant()

# Valid: 40 Hz at 100μm (neural cluster)
valid = sfi.validate(frequency=40, spatial_scale=1e-4)
print(f"Valid: {valid}")  # True

# Invalid: 500 Hz at 10cm (whole brain) — impossible
valid = sfi.validate(frequency=500, spatial_scale=0.1)
print(f"Valid: {valid}")  # False

# Get anomaly score
score = sfi.anomaly_score(frequency=500, spatial_scale=0.1)
print(f"Anomaly score: {score:.2f}")  # ~0.95

# What frequency should we expect at 1mm scale?
expected = sfi.expected_frequency(spatial_scale=1e-3)
print(f"Expected at 1mm: {expected:.1f} Hz")  # ~4 Hz
```

---

## Architecture

### ONIStack

The 14-layer ONI reference model with neuroscience integration.

#### Constructor

```python
ONIStack()
```

#### Properties

| Property | Type | Description |
|----------|------|-------------|
| `VERSION` | `str` | Model version ("3.0") |

#### Methods

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `layer` | `n: int` | `Layer` | Get layer by number (1-14) |
| `__getitem__` | `n: int` | `Layer` | Shorthand: `stack[8]` |
| `__len__` | — | `int` | Always 14 |
| `__iter__` | — | `Iterator[Layer]` | Iterate L1→L14 |
| `silicon_layers` | — | `List[Layer]` | L1-L7 (OSI) |
| `biology_layers` | — | `List[Layer]` | L9-L14 (Cognitive) |
| `bridge_layer` | — | `Layer` | L8 (Neural Gateway) |
| `firewall_layer` | — | `Layer` | Alias for bridge_layer |
| `ascii_diagram` | — | `str` | Visual representation |
| `summary` | — | `str` | Text summary |
| `layer_table` | — | `str` | Formatted table |
| `get_attack_surfaces` | `layer_range: tuple` | `dict` | Attack surfaces by layer |
| `get_defenses` | `layer_range: tuple` | `dict` | Defenses by layer |
| `brain_regions_for_layer` | `n: int` | `List[str]` | Brain regions (L9-L14 only) |
| `neurotransmitters_for_layer` | `n: int` | `List[str]` | Neurotransmitters (L9-L14 only) |
| `functions_for_layer` | `n: int` | `List[str]` | Cognitive functions (L9-L14 only) |
| `security_implications_for_layer` | `n: int` | `List[str]` | Security concerns |
| `layer_neuroscience_report` | `n: int` | `str` | Comprehensive report |

#### Layer Structure

| Layer | Name | Domain | Zone |
|-------|------|--------|------|
| L1 | Physical Carrier | Silicon | Physical |
| L2 | Signal Processing | Silicon | Physical |
| L3 | Protocol | Silicon | Network |
| L4 | Transport | Silicon | Network |
| L5 | Session | Silicon | Session |
| L6 | Presentation | Silicon | Session |
| L7 | Application Interface | Silicon | Application |
| **L8** | **Neural Gateway** | **Bridge** | **Firewall** |
| L9 | Signal Processing | Biology | Filtering |
| L10 | Neural Protocol | Biology | Encoding |
| L11 | Cognitive Transport | Biology | Delivery |
| L12 | Cognitive Session | Biology | Context |
| L13 | Semantic Layer | Biology | Intent |
| L14 | Identity Layer | Biology | Self |

#### Example

```python
from oni import ONIStack

stack = ONIStack()

# Print ASCII diagram
print(stack.ascii_diagram())

# Access specific layer
gateway = stack.layer(8)
print(f"L8: {gateway.name}")  # "Neural Gateway"
print(f"Domain: {gateway.domain.name}")  # "BRIDGE"
print(f"Attacks: {gateway.attack_surfaces}")

# Get neuroscience data for biological layers
regions = stack.brain_regions_for_layer(13)
print(f"L13 regions: {regions}")  # ['VTA', 'NAc', 'PFC', ...]

nts = stack.neurotransmitters_for_layer(13)
print(f"L13 neurotransmitters: {nts}")  # ['dopamine', ...]

# Iterate through all layers
for layer in stack:
    print(f"L{layer.number}: {layer.name} ({layer.domain.name})")
```

---

### Layer

Individual layer in the ONI stack.

#### Properties

| Property | Type | Description |
|----------|------|-------------|
| `number` | `int` | Layer number (1-14) |
| `name` | `str` | Layer name |
| `domain` | `Domain` | SILICON, BRIDGE, or BIOLOGY |
| `zone_label` | `str` | Zone category |
| `function` | `str` | Primary function |
| `attack_surfaces` | `List[str]` | Known attack vectors |
| `defenses` | `List[str]` | Recommended defenses |
| `metadata` | `dict` | Additional data |
| `is_silicon` | `bool` | True for L1-L7 |
| `is_biology` | `bool` | True for L9-L14 |
| `is_bridge` | `bool` | True for L8 |
| `is_firewall` | `bool` | True for L8 |

---

## Neuroscience Mappings

### NeuroscienceAtlas

Unified access to brain regions, neurotransmitters, cognitive functions, and research citations.

#### Constructor

```python
NeuroscienceAtlas()

# Or use singleton
from oni import get_atlas
atlas = get_atlas()
```

#### Properties

| Property | Type | Description |
|----------|------|-------------|
| `regions` | `BrainRegionAtlas` | Brain region database |
| `neurotransmitters` | `NeurotransmitterAtlas` | Neurotransmitter database |
| `time_scales` | `TimeScaleHierarchy` | Time scale hierarchy |
| `functions` | `CognitiveFunctionAtlas` | Cognitive function database |
| `references` | `References` | Citation database |

#### Methods

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `brain_region` | `abbr: str` | `BrainRegion` | Look up by abbreviation |
| `neurotransmitter` | `name: str` | `NeurotransmitterSystem` | Look up NT system |
| `cognitive_function` | `name: str` | `CognitiveFunction` | Look up function |
| `citation` | `id: str` | `Citation` | Get citation by ID |
| `citations_for` | `topic: str` | `List[Citation]` | Citations for topic |
| `layer_mapping` | `n: int` | `dict` | All mappings for layer |
| `function_to_layers` | `name: str` | `List[int]` | Layers for function |
| `bci_capabilities_summary` | — | `dict` | What BCI can/cannot do |
| `security_implications` | `n: int` | `List[str]` | Security concerns |
| `generate_layer_report` | `n: int` | `str` | Comprehensive report |

#### Example

```python
from oni import get_atlas

atlas = get_atlas()

# Look up dopamine system
da = atlas.neurotransmitter("dopamine")
print(f"Abbreviation: {da.abbreviation}")  # "DA"
print(f"Synthesis enzyme: {da.synthesis_enzyme}")  # "Tyrosine Hydroxylase"
print(f"Required cofactors: {da.required_cofactors}")  # ['Fe²⁺', 'BH4', 'O₂']
print(f"BCI can trigger release: {da.bci_can_trigger_release}")  # True
print(f"BCI can synthesize: {da.bci_can_synthesize}")  # False

# Look up brain region
vta = atlas.brain_region("VTA")
print(f"Full name: {vta.full_name}")  # "Ventral Tegmental Area"
print(f"ONI layers: {vta.oni_layers}")  # [12, 13]

# Get BCI capabilities summary
caps = atlas.bci_capabilities_summary()
print(f"Can trigger: {caps['can_trigger_release']}")
print(f"Cannot synthesize: {caps['cannot_synthesize']}")
print(f"Accessible time range: {caps['accessible_time_range']}")
```

---

### BrainRegion

Data class for brain region information.

#### Properties

| Property | Type | Description |
|----------|------|-------------|
| `abbreviation` | `str` | Short name (e.g., "SNc", "VTA") |
| `full_name` | `str` | Full anatomical name |
| `location` | `str` | Anatomical location |
| `primary_neurotransmitters` | `List[str]` | Main NTs in region |
| `primary_functions` | `List[str]` | Main functions |
| `oni_layers` | `List[int]` | Mapped ONI layers |
| `bci_accessibility` | `str` | "high", "medium", "low", "none" |
| `citation_ids` | `List[str]` | Supporting citations |

#### Available Regions

| Abbreviation | Full Name | Primary NT |
|--------------|-----------|------------|
| SNc | Substantia Nigra pars compacta | Dopamine |
| VTA | Ventral Tegmental Area | Dopamine |
| NAc | Nucleus Accumbens | Dopamine/GABA |
| PFC | Prefrontal Cortex | Glutamate/GABA |
| M1 | Primary Motor Cortex | Glutamate |
| V1 | Primary Visual Cortex | Glutamate |
| A1 | Primary Auditory Cortex | Glutamate |
| hippocampus | Hippocampus | Glutamate/ACh |
| amygdala | Amygdala | GABA/Glutamate |
| LC | Locus Coeruleus | Norepinephrine |
| raphe | Raphe Nuclei | Serotonin |
| basal_forebrain | Basal Forebrain | Acetylcholine |
| thalamus | Thalamus | Glutamate/GABA |
| hypothalamus | Hypothalamus | Multiple |
| cerebellum | Cerebellum | GABA/Glutamate |

---

### NeurotransmitterSystem

Data class for neurotransmitter system information.

#### Properties

| Property | Type | Description |
|----------|------|-------------|
| `name` | `str` | Full name (e.g., "dopamine") |
| `abbreviation` | `str` | Short name (e.g., "DA") |
| `category` | `str` | "catecholamine", "indolamine", etc. |
| `synthesis_enzyme` | `str` | Key enzyme for synthesis |
| `required_cofactors` | `List[str]` | Required cofactors |
| `synthesis_regions` | `List[str]` | Brain regions that synthesize |
| `major_pathways` | `List[str]` | Major projection pathways |
| `receptor_types` | `List[str]` | Receptor subtypes |
| `primary_functions` | `List[str]` | Main functions |
| `oni_layers` | `List[int]` | Mapped ONI layers |
| `time_scale` | `str` | Typical action time scale |
| `bci_can_trigger_release` | `bool` | Can BCI trigger release? |
| `bci_can_synthesize` | `bool` | Can BCI synthesize? (always False) |
| `security_implications` | `List[str]` | Security concerns |
| `citation_ids` | `List[str]` | Supporting citations |

#### Available Systems

| Name | Abbr | Category | Key Cofactors |
|------|------|----------|---------------|
| dopamine | DA | catecholamine | Fe²⁺, BH4, O₂ |
| serotonin | 5-HT | indolamine | Fe²⁺, BH4, O₂ |
| norepinephrine | NE | catecholamine | Fe²⁺, BH4, O₂, Cu²⁺ |
| acetylcholine | ACh | cholinergic | Choline, Acetyl-CoA |
| GABA | GABA | amino acid | B6 (PLP), Glutamate |
| glutamate | Glu | amino acid | α-ketoglutarate |
| adenosine | Ado | purine | ATP |
| endocannabinoids | eCB | lipid | Arachidonic acid |

---

### CognitiveFunction

Data class for cognitive function information.

#### Properties

| Property | Type | Description |
|----------|------|-------------|
| `name` | `str` | Function name |
| `description` | `str` | What it does |
| `brain_regions` | `List[str]` | Involved regions |
| `neurotransmitters` | `List[str]` | Involved NTs |
| `oni_layers` | `List[int]` | Mapped ONI layers |
| `time_scale` | `str` | Typical time scale |
| `bci_modulable` | `bool` | Can BCI modulate? |
| `citation_ids` | `List[str]` | Supporting citations |

#### Available Functions

| Function | Brain Regions | ONI Layers |
|----------|---------------|------------|
| motor_control | M1, cerebellum, basal ganglia | 9, 10 |
| sensory_processing | V1, A1, somatosensory | 9 |
| attention | PFC, parietal, thalamus | 10, 11 |
| working_memory | PFC, hippocampus | 11, 12 |
| long_term_memory | hippocampus, cortex | 12 |
| emotion | amygdala, PFC, insula | 12, 13 |
| reward | VTA, NAc, PFC | 12, 13 |
| decision_making | PFC, ACC, OFC | 13 |
| language | Broca's, Wernicke's, arcuate | 13, 14 |
| self_awareness | PFC, insula, TPJ | 14 |

---

### Citation

Data class for research citations.

#### Properties

| Property | Type | Description |
|----------|------|-------------|
| `id` | `str` | Unique identifier |
| `authors` | `str` | Author list |
| `year` | `int` | Publication year |
| `title` | `str` | Paper title |
| `journal` | `str` | Journal name |
| `volume` | `str` | Volume/issue |
| `pages` | `str` | Page range |
| `doi` | `str` | DOI |
| `pmid` | `str` | PubMed ID |
| `key_finding` | `str` | Key finding summary |

#### Methods

| Method | Returns | Description |
|--------|---------|-------------|
| `apa_format()` | `str` | APA-formatted citation |

#### Key Citations

| ID | Topic | Year |
|----|-------|------|
| `bjorklund2007` | Dopamine neuron systems | 2007 |
| `lazarus2011` | Adenosine/caffeine mechanisms | 2011 |
| `shannon1992` | Stimulation safety limits | 1992 |
| `kohno2009` | Neurosecurity threat model | 2009 |
| `bonaci2014` | BCI Anonymizer | 2014 |

---

## Neurosecurity

### KohnoThreatModel

CIA-based threat classification for neural signals (Kohno et al., 2009).

#### Constructor

```python
KohnoThreatModel()
```

#### Methods

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `classify_threat` | `signal_data: dict` | `ThreatType` | Classify threat type |
| `assess_risk` | `signal_data: dict` | `float` | Risk score (0-1) |
| `get_recommendations` | `threat: ThreatType` | `List[str]` | Mitigation recommendations |

#### ThreatType Enum

| Value | Description |
|-------|-------------|
| `CONFIDENTIALITY` | Unauthorized data extraction |
| `INTEGRITY` | Signal manipulation/injection |
| `AVAILABILITY` | Denial of service |
| `NONE` | No threat detected |

---

### NeurosecurityFirewall

Combined firewall integrating coherence scoring, threat detection, and privacy protection.

#### Constructor

```python
NeurosecurityFirewall(config: NeurosecurityConfig = None)
```

#### NeurosecurityConfig

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `coherence_threshold` | `float` | `0.3` | Minimum Cₛ to allow |
| `amplitude_max` | `float` | `500.0` | Maximum amplitude (μV) |
| `enable_dos_protection` | `bool` | `True` | Enable DoS detection |
| `max_signals_per_second` | `float` | `1000.0` | DoS threshold |
| `enable_privacy_protection` | `bool` | `True` | Enable privacy scoring |
| `privacy_threshold` | `float` | `0.7` | Flag signals above this |

#### Methods

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `filter` | `signal: NeuralSignal` | `SecurityDecision` | Filter with full analysis |
| `register_threat_callback` | `callback: Callable` | — | Alert on threats |
| `register_emergency_callback` | `callback: Callable` | — | Alert on emergencies |
| `get_statistics` | — | `dict` | Filtering statistics |
| `get_threat_summary` | — | `dict` | Threat breakdown |

---

### BCIAnonymizer

Privacy-preserving signal processing based on Bonaci et al. (2014).

#### Constructor

```python
BCIAnonymizer(config: AnonymizerConfig = None)
```

#### AnonymizerConfig

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `strip_p300` | `bool` | `True` | Remove P300 components |
| `strip_n170` | `bool` | `True` | Remove N170 (face recognition) |
| `strip_n400` | `bool` | `True` | Remove N400 (semantic) |
| `preserve_motor` | `bool` | `True` | Keep motor signals |

#### Methods

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `anonymize` | `signal: RawSignal` | `AnonymizedSignal` | Strip sensitive components |
| `get_sensitivity` | `erp_type: ERPType` | `PrivacySensitivity` | Get sensitivity level |

#### ERPType Enum

| Value | Description | Sensitivity |
|-------|-------------|-------------|
| `P300` | Attention/recognition | HIGH |
| `N170` | Face processing | HIGH |
| `N400` | Semantic processing | MEDIUM |
| `LRP` | Motor preparation | LOW |
| `MOTOR` | Motor execution | LOW |

---

### PrivacyScoreCalculator

Quantifies information leakage risk in neural signals.

#### Constructor

```python
PrivacyScoreCalculator()
```

#### Methods

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `calculate` | `signal: RawSignal` | `PrivacyScoreResult` | Calculate privacy risk |

#### PrivacyScoreResult

| Property | Type | Description |
|----------|------|-------------|
| `score` | `float` | Overall risk (0-1) |
| `components` | `dict` | Risk by component type |
| `recommendations` | `List[str]` | Privacy recommendations |

---

## Enums & Constants

### Domain

```python
from oni import Domain

Domain.SILICON   # L1-L7
Domain.BRIDGE    # L8
Domain.BIOLOGY   # L9-L14
```

### Decision

```python
from oni.firewall import Decision

Decision.ACCEPT       # Allow signal
Decision.ACCEPT_FLAG  # Allow + log
Decision.REJECT       # Block signal
```

### AlertLevel

```python
from oni.firewall import AlertLevel

AlertLevel.NONE
AlertLevel.LOW
AlertLevel.MEDIUM
AlertLevel.HIGH
AlertLevel.CRITICAL
```

### ThreatType

```python
from oni.neurosecurity import ThreatType

ThreatType.NONE
ThreatType.CONFIDENTIALITY
ThreatType.INTEGRITY
ThreatType.AVAILABILITY
```

### SecurityDecision

```python
from oni.neurosecurity import SecurityDecision

SecurityDecision.ALLOW
SecurityDecision.BLOCK
SecurityDecision.FLAG
SecurityDecision.EMERGENCY_SHUTOFF
```

---

## Version History

| Version | Changes |
|---------|---------|
| 0.2.6 | Added comprehensive API documentation, neuroscience mappings |
| 0.2.1 | Added NeurosecurityFirewall, BCIAnonymizer |
| 0.2.0 | Added Kohno threat model integration |
| 0.1.0 | Initial release (CoherenceMetric, NeuralFirewall, ONIStack) |

---

*Generated for oni-framework v0.2.6*
*License: Apache 2.0*
*https://github.com/qinnovates/mindloft*
