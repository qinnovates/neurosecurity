"""
QIF Configuration — Single source of truth for all constants, thresholds, and metadata.

As-Code Principle: Every value used in the whitepaper, equations, or visualizations
is defined HERE. Nothing is hardcoded in documents.
"""

# ──────────────────────────────────────────────
# Framework Identity
# ──────────────────────────────────────────────

FRAMEWORK = {
    "name": "QIF — Quantum Indeterministic Framework for Neural Security",
    "pronunciation": "CHIEF",
    "predecessor": "ONI (Organic Neural Interface)",
    "layer_model_version": "v3.1 (Hourglass, 7-band)",
    "layer_model_date": "2026-02-02",
    "github": "qinnovates/qinnovate",
    "authors": "Kevin Qi, with Claude (Anthropic)",
    "collaboration": "Qinnovate",
    "ai_transparency": {
        "statement": "This framework was developed collaboratively between Kevin Qi (human researcher) and AI assistants. All AI involvement is assistive — Kevin retains authorship and all decision-making authority.",
        "ai_systems": [
            {"name": "Claude (Opus 4.5)", "role": "Co-derivation, implementation, research agent orchestration", "provider": "Anthropic"},
            {"name": "Gemini 2.5", "role": "Independent peer review (cross-AI validation)", "provider": "Google"},
        ],
        "audit_trail": "QIF-DERIVATION-LOG.md",
        "audit_trail_description": "Complete chronological record of every derivation, decision, AI contribution, and validation result — with timestamps, reasoning chains, and source attribution.",
        "research_sources": "QIF-RESEARCH-SOURCES.md",
    },
}

# ──────────────────────────────────────────────
# Layer Architecture — v3.0 Hourglass Model
# ──────────────────────────────────────────────
# 3 Zones, 7 Bands (3-1-3 symmetric). No OSI heritage.
# Numbers increase AWAY from the interface in both directions.
# Width = state space / possibility space (hourglass geometry).
# v3.0 → v3.1: Dropped N4 (Identity/Consciousness merged into N3).
#   Validated 2026-02-02 by quantum physics, neuroscience, and cybersecurity agents.

ZONES = {
    "neural": {
        "name": "Neural Domain",
        "description": "Biological processing from subcortical relay to integrative association cortex",
        "color": "#3fb950",  # green
        "bands": ["N1", "N2", "N3"],
    },
    "interface": {
        "name": "Interface Zone",
        "description": "Quasi-quantum bottleneck: electrode-tissue boundary, measurement/collapse",
        "color": "#f85149",  # red
        "bands": ["I0"],
    },
    "silicon": {
        "name": "Silicon Domain",
        "description": "Classical: analog front-end through digital processing to application software",
        "color": "#58a6ff",  # blue
        "bands": ["S1", "S2", "S3"],
    },
}

BANDS = [
    {
        "id": "N3", "name": "Integrative Association", "zone": "neural",
        "description": "Executive function, language, memory, emotion, identity — PFC + association cortex",
        "determinacy": "Quantum Uncertain",
        "qi_range": (0.3, 0.5),
        "brain_regions": ["PFC", "ACC", "Broca", "Wernicke", "HIPP", "BLA", "insula"],
        "hourglass_width": 1.0,  # widest in neural domain
    },
    {
        "id": "N2", "name": "Sensorimotor Processing", "zone": "neural",
        "description": "Primary motor/sensory cortices, movement planning, cerebellar-cortical loops",
        "determinacy": "Chaotic → Stochastic",
        "qi_range": (0.15, 0.3),
        "brain_regions": ["M1", "S1_cortex", "V1", "A1", "PMC", "SMA", "PPC", "cerebellum"],
        "hourglass_width": 0.55,
    },
    {
        "id": "N1", "name": "Subcortical Relay", "zone": "neural",
        "description": "Sensory gating, motor selection, coordination, arousal, autonomic reflexes",
        "determinacy": "Stochastic",
        "qi_range": (0.05, 0.15),
        "brain_regions": ["thalamus", "basal ganglia", "cerebellum", "brainstem", "CeA"],
        "hourglass_width": 0.35,
    },
    {
        "id": "I0", "name": "Neural Interface", "zone": "interface",
        "description": "Electrode-tissue boundary, measurement/collapse, quasi-quantum zone",
        "determinacy": "Quasi-quantum (ΓD ∈ (0,1))",
        "qi_range": (0.01, 0.1),
        "brain_regions": [],
        "hourglass_width": 0.2,  # narrowest — bottleneck
    },
    {
        "id": "S1", "name": "Analog Front-End", "zone": "silicon",
        "description": "Amplification, filtering, ADC/DAC conversion",
        "determinacy": "Stochastic (analog noise)",
        "qi_range": (0.001, 0.01),
        "brain_regions": [],
        "hourglass_width": 0.35,
    },
    {
        "id": "S2", "name": "Digital Processing", "zone": "silicon",
        "description": "Decoding algorithms, classification, feature extraction",
        "determinacy": "Deterministic",
        "qi_range": (0.0, 0.0),
        "brain_regions": [],
        "hourglass_width": 0.7,
    },
    {
        "id": "S3", "name": "Application", "zone": "silicon",
        "description": "Clinical software, user interface, data storage, networking",
        "determinacy": "Deterministic",
        "qi_range": (0.0, 0.0),
        "brain_regions": [],
        "hourglass_width": 1.0,  # widest in silicon domain
    },
]

# Quick lookup: band_id → band dict
BANDS_BY_ID = {b["id"]: b for b in BANDS}

# ──────────────────────────────────────────────
# Brain Region → Band Mapping
# ──────────────────────────────────────────────

BRAIN_REGION_MAP = {
    # N3 — Integrative Association (executive, language, memory, emotion, identity)
    "PFC":                {"band": "N3", "connections": ["Broca", "Wernicke", "HIPP", "BLA", "insula", "M1", "PMC", "SMA", "PPC", "basal ganglia", "thalamus", "ACC"]},
    "ACC":                {"band": "N3", "connections": ["PFC", "BLA", "insula", "brainstem"]},
    "Broca":              {"band": "N3", "connections": ["Wernicke", "PFC"]},
    "Wernicke":           {"band": "N3", "connections": ["A1", "Broca", "PFC"]},
    "HIPP":               {"band": "N3", "connections": ["BLA", "thalamus", "PFC"]},
    "BLA":                {"band": "N3", "connections": ["HIPP", "PFC", "insula", "CeA"],
                           "note": "Basolateral amygdala — cortical-like, associative learning"},
    "insula":             {"band": "N3", "connections": ["ACC", "BLA", "PFC", "S1_cortex"]},
    # N2 — Sensorimotor Processing (cortices + cerebellar-cortical loops)
    "M1":                 {"band": "N2", "connections": ["PFC", "PMC", "SMA", "basal ganglia", "cerebellum"]},
    "S1_cortex":          {"band": "N2", "connections": ["thalamus", "PFC", "insula"],
                           "note": "Primary somatosensory cortex (renamed to avoid collision with S1 band)"},
    "V1":                 {"band": "N2", "connections": ["thalamus", "PPC"]},
    "A1":                 {"band": "N2", "connections": ["thalamus", "Wernicke"]},
    "PMC":                {"band": "N2", "connections": ["PFC", "M1"]},
    "SMA":                {"band": "N2", "connections": ["PFC", "M1"]},
    "PPC":                {"band": "N2", "connections": ["V1", "M1", "PMC", "PFC"]},
    "cerebellum":         {"band": "N1/N2", "connections": ["M1", "thalamus", "PFC", "PMC"],
                           "note": "Spans N1 (relay) and N2 (cerebellar-cortical loops)"},
    # N1 — Subcortical Relay (gating, selection, arousal, autonomic)
    "thalamus":           {"band": "N1", "connections": ["V1", "A1", "S1_cortex", "PFC", "HIPP"]},
    "basal ganglia":      {"band": "N1", "connections": ["M1", "PFC", "thalamus"]},
    "brainstem":          {"band": "N1", "connections": ["thalamus", "cerebellum", "PFC", "CeA", "ACC"]},
    "CeA":                {"band": "N1", "connections": ["BLA", "brainstem", "thalamus"],
                           "note": "Central amygdala — subcortical, autonomic output"},
}

# ──────────────────────────────────────────────
# Determinacy Spectrum (5 levels, mapped to bands)
# ──────────────────────────────────────────────

DETERMINACY_SPECTRUM = [
    {"level": 1, "name": "Deterministic",         "bands": ["S2", "S3"],  "description": "f(state,t) → next_state, no randomness"},
    {"level": 2, "name": "Stochastic",            "bands": ["S1", "N1"],  "description": "Known probability distributions, epistemic randomness"},
    {"level": 3, "name": "Chaotic",               "bands": ["N2"],        "description": "Deterministic but sensitive to initial conditions (λ_L > 0)"},
    {"level": 4, "name": "Quantum Uncertain",     "bands": ["N3"],        "description": "Heisenberg-bounded, security-relevant indeterminacy"},
]
# Note: Level 5 "Quantum Indeterminate" (former N4) removed in v3.1.
# N3 tops out at "Quantum Uncertain" — defensible without claiming quantum dominance.

# ──────────────────────────────────────────────
# v2.0 → v3.0 Migration Map
# ──────────────────────────────────────────────

V2_TO_V3_MIGRATION = {
    "L1":  "S3",   # Physical medium → Application (classical networking)
    "L2":  "S3",   # Data Link → Application
    "L3":  "S3",   # Network → Application
    "L4":  "S3",   # Transport → Application
    "L5":  "S3",   # Session → Application
    "L6":  "S3",   # Presentation → Application
    "L7":  "S3",   # Application → Application
    "L8":  "I0",   # Neural Gateway → Neural Interface
    "L9":  "I0/N1",  # Signal Processing → Interface / Subcortical
    "L10": "N1/N2",  # Neural Protocol → Subcortical / Sensorimotor
    "L11": "N2",   # Cognitive Transport → Sensorimotor Processing
    "L12": "N3",   # Cognitive Session → Cognitive Integration
    "L13": "N3",   # Semantic Layer → Cognitive Integration
    "L14": "N3",   # Cognitive Sovereignty → Integrative Association (merged)
}

# DEPRECATED v2.0 — kept for migration reference only. Do NOT use in new code.
LAYERS_V2_DEPRECATED = [
    {"layer": 1,  "name": "Physical",           "domain": "OSI",    "description": "Physical medium, cabling"},
    {"layer": 2,  "name": "Data Link",           "domain": "OSI",    "description": "MAC addressing, framing"},
    {"layer": 3,  "name": "Network",             "domain": "OSI",    "description": "IP routing, addressing"},
    {"layer": 4,  "name": "Transport",           "domain": "OSI",    "description": "TCP/UDP, flow control"},
    {"layer": 5,  "name": "Session",             "domain": "OSI",    "description": "Connection management"},
    {"layer": 6,  "name": "Presentation",        "domain": "OSI",    "description": "Encryption, formatting"},
    {"layer": 7,  "name": "Application",         "domain": "OSI",    "description": "User-facing protocols"},
    {"layer": 8,  "name": "Neural Gateway",      "domain": "Neural", "description": "Firewall, trust boundary between silicon and biology"},
    {"layer": 9,  "name": "Signal Processing",   "domain": "Neural", "description": "Raw signal conditioning, phase coherence checking"},
    {"layer": 10, "name": "Neural Protocol",      "domain": "Neural", "description": "Oscillatory encoding, synchronization"},
    {"layer": 11, "name": "Cognitive Transport",   "domain": "Neural", "description": "Reliable neural data delivery"},
    {"layer": 12, "name": "Cognitive Session",     "domain": "Neural", "description": "Context, working memory"},
    {"layer": 13, "name": "Semantic Layer",        "domain": "Neural", "description": "Intent, goals, meaning"},
    {"layer": 14, "name": "Identity Layer",        "domain": "Neural", "description": "Agency, sense of self"},
]

# ──────────────────────────────────────────────
# Coherence Metric Thresholds
# ──────────────────────────────────────────────

COHERENCE_THRESHOLDS = {
    "high": 0.6,
    "low": 0.3,
}

DECISION_MATRIX = [
    {"coherence": "High (Cₛ > 0.6)",          "auth": "Valid",   "action": "ACCEPT"},
    {"coherence": "High (Cₛ > 0.6)",          "auth": "Invalid", "action": "REJECT + ALERT"},
    {"coherence": "Medium (0.3 < Cₛ < 0.6)",  "auth": "Valid",   "action": "ACCEPT + FLAG"},
    {"coherence": "Medium (0.3 < Cₛ < 0.6)",  "auth": "Invalid", "action": "REJECT + ALERT"},
    {"coherence": "Low (Cₛ < 0.3)",           "auth": "Any",     "action": "REJECT + CRITICAL"},
]

# ──────────────────────────────────────────────
# Scale-Frequency Data
# ──────────────────────────────────────────────

FREQUENCY_BANDS = [
    {"band": "High gamma", "freq_range": "60-100 Hz", "freq_mid": 80,   "spatial_extent": "0.3-5 mm",    "spatial_mid_m": 0.0025,  "fxs": "~0.08-0.4",  "source": "Jia et al. 2011"},
    {"band": "Low gamma",  "freq_range": "30-60 Hz",  "freq_mid": 45,   "spatial_extent": "1-10 mm",     "spatial_mid_m": 0.005,   "fxs": "~0.04-0.4",  "source": "ECoG studies"},
    {"band": "Alpha",      "freq_range": "8-12 Hz",   "freq_mid": 10,   "spatial_extent": "10-20 cm",    "spatial_mid_m": 0.15,    "fxs": "1-2",        "source": "Srinivasan 1999"},
    {"band": "Theta",      "freq_range": "4-8 Hz",    "freq_mid": 6,    "spatial_extent": "4-5 cm",      "spatial_mid_m": 0.045,   "fxs": "0.24-0.40",  "source": "Patel et al. 2012"},
    {"band": "Delta",      "freq_range": "0.5-4 Hz",  "freq_mid": 2,    "spatial_extent": "15-20 cm",    "spatial_mid_m": 0.175,   "fxs": "0.15-0.20",  "source": "Massimini 2004"},
]

CONDUCTION_VELOCITIES = [
    {"fiber_type": "Unmyelinated intracortical", "velocity": "0.1-0.5 m/s"},
    {"fiber_type": "Myelinated corticocortical", "velocity": "5-30 m/s"},
    {"fiber_type": "Nunez canonical model",      "velocity": "~7 m/s"},
]

BRAIN_MAX_DIMENSION_CM = 20  # Human brain max ~15-20 cm
BRAIN_MAX_DIMENSION_M = 0.20  # Same, in meters (for equations)

# ──────────────────────────────────────────────
# Quantum Computing Threats
# ──────────────────────────────────────────────

QUANTUM_THREATS = [
    {"claim": "Shor's breaks RSA-2048",    "value": "~8 hours / 20M noisy qubits",          "source": "Gidney & Ekerå 2019, arXiv:1905.09749"},
    {"claim": "Revised qubit estimate",     "value": "<1M noisy qubits / <1 week",           "source": "Gidney 2025, arXiv:2505.15917"},
    {"claim": "Classical RSA-2048 time",    "value": "Hundreds of trillions of years",        "source": "GNFS complexity"},
    {"claim": "AES-256 quantum resistance", "value": "Theoretically halved; practically safe", "source": "NIST guidance"},
    {"claim": "Grover's optimality",        "value": "O(√N) provably optimal",                "source": "Bennett et al. 1997, Zalka 1999"},
]

# ──────────────────────────────────────────────
# Neuralink N1 Specs
# ──────────────────────────────────────────────

NEURALINK_N1 = {
    "electrodes": 1024,
    "threads": 64,
    "sampling_rate_khz": "19.3-20",
    "wireless": "Bluetooth Low Energy (BLE)",
    "power_mw": 24.7,
    "soc_area_mm": "5×4",
}

# ──────────────────────────────────────────────
# Neuroscience Constants
# ──────────────────────────────────────────────

NEURO_CONSTANTS = [
    {"claim": "Retinal output",             "value": "~10 Mbps",              "source": "Koch et al. 2006"},
    {"claim": "Conscious visual bandwidth",  "value": "~20-50 bits/sec",       "source": "Nørretranders 1998"},
    {"claim": "Compression ratio",           "value": "~200,000:1 to 500,000:1", "source": "Derived"},
    {"claim": "STDP LTP window",             "value": "Pre leads post by 0-20 ms", "source": "Markram 1997, Bi & Poo 1998"},
    {"claim": "Cortical synaptic Pr (in vivo)", "value": "~0.1-0.5",           "source": "Borst 2010"},
    {"claim": "Human brain max dimension",   "value": "~15-20 cm",             "source": "Anatomy"},
]

# ──────────────────────────────────────────────
# Decoherence Timescales
# ──────────────────────────────────────────────

DECOHERENCE_CAMPS = [
    {"camp": "Tegmark (skeptic)",    "tau_d": 1e-13,  "label": "10⁻¹³ s", "implication": "Quantum effects impossible in biology"},
    {"camp": "Recent experimental",  "tau_d": 1e-5,   "label": "10⁻⁵ s",  "implication": "Possible microsecond quantum window"},
    {"camp": "Fisher (optimist)",    "tau_d": 3600.0,  "label": "Hours",    "implication": "Nuclear spin coherence in Posner molecules"},
]

# ──────────────────────────────────────────────
# Default QI Equation Parameters
# ──────────────────────────────────────────────

DEFAULT_C1_PARAMS = {
    "alpha": 1.0,
    "beta": 1.0,
    "gamma": 0.5,
    "delta": 0.5,
    "tau_d": 1e-5,
}

DEFAULT_C2_PARAMS = {
    "lam": 1.0,
    "mu": 1.0,
}

# ──────────────────────────────────────────────
# Threat Model — loaded from shared/threat-matrix.json
# ──────────────────────────────────────────────
# Single source of truth: MAIN/shared/threat-matrix.json
# This computed view maintains backward compatibility.

import json as _json
from pathlib import Path as _Path


def _load_threat_model():
    """Load THREAT_MODEL from shared threat-matrix.json."""
    matrix_path = _Path(__file__).parent.parent.parent.parent / "shared" / "threat-matrix.json"
    try:
        with open(matrix_path) as f:
            matrix = _json.load(f)
        result = []
        for tactic in matrix.get("tactics", []):
            for tech in tactic.get("techniques", []):
                quantum = tech.get("quantum", {})
                classical = tech.get("classical", {})
                bands = quantum.get("target_bands", [])
                bands_str = ", ".join(bands) if len(bands) <= 2 else f"{bands[0]}–{bands[-1]}"

                # Determine classical detection capability
                c_detect = classical.get("classical_detection")
                if c_detect is None:
                    if classical.get("detection") or classical.get("mitigations"):
                        c_detect = "Yes"
                    else:
                        c_detect = "No"

                result.append({
                    "attack": tech["name"],
                    "bands": bands_str,
                    "classical": c_detect,
                    "quantum": quantum.get("detection", "Unknown"),
                })
        return result
    except (FileNotFoundError, KeyError):
        # Fallback if threat-matrix.json is not available
        return []


THREAT_MODEL = _load_threat_model()

# ──────────────────────────────────────────────
# Limitations & Open Questions (Ch. 14)
# ──────────────────────────────────────────────

UNCALIBRATED_PARAMS = [
    {"param": "α (classical weight)",     "default": 1.0,  "status": "Placeholder", "calibration_method": "Regression on labeled BCI security incidents"},
    {"param": "β (quantum weight)",       "default": 1.0,  "status": "Placeholder", "calibration_method": "Controlled decoherence experiments"},
    {"param": "γ (tunneling weight)",     "default": 0.5,  "status": "Placeholder", "calibration_method": "Ion channel patch-clamp tunneling measurements"},
    {"param": "δ (entanglement weight)",  "default": 0.5,  "status": "Placeholder", "calibration_method": "Bell test experiments on neural tissue"},
]

OPEN_QUESTIONS = [
    {"question": "What is τ_D for neural microtubules in vivo?",               "param": "τ_D",         "range": "10⁻²⁰ to 10³·⁶ s", "resolution": "Ultrafast spectroscopy on living brain tissue"},
    {"question": "Are ion channel tunneling profiles unique per individual?",   "param": "Q_tunnel",    "range": "Unknown",            "resolution": "Single-channel patch clamp + quantum state tomography"},
    {"question": "Does BCI sampling rate affect quantum coherence (Zeno)?",     "param": "Zeno gate",   "range": "Unknown",            "resolution": "Vary sampling rate, measure coherence time"},
    {"question": "Can Davydov solitons trigger false synaptic events?",         "param": "Q_tunnel",    "range": "Unknown",            "resolution": "THz stimulation of SNARE complexes in vitro"},
    {"question": "What is the Hilbert space dimension d for neural qubits?",    "param": "Q̂_i norm",   "range": "2 to ~10⁶",         "resolution": "Quantum state tomography of microtubule states"},
    {"question": "Are Posner molecules present in human cortex?",               "param": "Fisher τ_D",  "range": "Hours if yes",       "resolution": "³¹P NMR spectroscopy of cortical tissue"},
    {"question": "What is the entanglement entropy of neural Bell pairs?",      "param": "Q_entangle",  "range": "0 to ln(d)",         "resolution": "Loophole-free Bell test on neural preparations"},
    {"question": "Does non-Markovian decoherence extend coherence windows?",    "param": "Γ_D(t) form", "range": "Quadratic vs exp",   "resolution": "Time-resolved coherence measurements in warm wet tissue"},
]

SCOPE_LIMITATIONS = [
    "QIF targets implanted BCIs only (e.g., Neuralink, BrainGate) — devices with electrodes physically inside the brain. Non-invasive EEG headsets don't need QIF because their electrodes sit on the scalp, separated from neurons by centimeters of skin, bone, and fluid. By the time brain signals reach a scalp electrode, any quantum-scale effects have long since been washed out. There is no direct electrode-tissue boundary to protect. Standard security frameworks are sufficient for non-invasive devices. We focus on implanted BCIs because that is where the security gap is most dangerous: these devices can read and write neural signals directly, the stakes of a breach are highest (think someone hijacking a device inside your brain), and no existing security framework accounts for the physics at that interface.",
    "The quantum adversary timeline depends on fault-tolerant quantum computing, estimated 2030-2040+ (Gidney 2025).",
    "This boundary is not permanent. Quantum sensing technology is advancing rapidly — optically pumped magnetometers (OPMs), nitrogen-vacancy diamond centers, and engineered magnetosensitive proteins (MagLOV) are approaching single-neuron sensitivity without ever touching the brain. If non-invasive sensors eventually resolve quantum-scale neural activity through the skull, QIF's security model becomes relevant to those devices too. The real dividing line is not 'implanted vs non-invasive' — it is whether the sensor can see the physics. Today only implanted electrodes can. That may not be true for long.",
    "QIF is designed to handle next-generation interfaces without redesigning the framework. The hourglass architecture is interface-agnostic: the neural domain (N1-N3) stays the same because brains are brains, and the silicon domain (S1-S3) stays the same because processing is processing. Only the I0 band — the bottleneck where biology meets technology — changes its physics depending on the interface type. For optical interfaces (optogenetics), I0 becomes the photon-tissue boundary. For magnetogenetic interfaces, I0 becomes the magnetic field-ion channel coupling. For quantum sensors, I0 becomes the sensor-neural field interaction. Swapping the I0 physics model is all that's needed — the rest of QIF carries over.",
    "Clinical validation requires IRB approval, neurosurgical collaboration, and access to implanted BCI patients.",
]

# ──────────────────────────────────────────────
# Interface Types — I0 Band Physics by Technology
# ──────────────────────────────────────────────
# QIF's I0 band generalizes across interface types. The hourglass
# architecture is interface-agnostic; only the bottleneck physics changes.

INTERFACE_TYPES = [
    {"type": "Electrode (current)",  "i0_physics": "Electrode-tissue ionic coupling",    "quantum_mechanism": "Ion channel tunneling, charge transfer at metal-tissue boundary",    "examples": "Neuralink N1, BrainGate Utah array, ECoG grids",          "status": "Current focus"},
    {"type": "Optical",              "i0_physics": "Photon-tissue absorption/emission",  "quantum_mechanism": "Photon coherence, stimulated emission, photoelectric effects",      "examples": "Optogenetics, fiber photometry, two-photon imaging",       "status": "Near-term extension"},
    {"type": "Magnetogenetic",       "i0_physics": "Magnetic field-ion channel spin coupling", "quantum_mechanism": "Spin dynamics, magnetic resonance at molecular scale",       "examples": "Magneto-thermal TRPV channels, DREADD variants",          "status": "Emerging"},
    {"type": "Quantum sensor",       "i0_physics": "Quantum sensor-neural field coupling", "quantum_mechanism": "NV-center spin readout, OPM atomic coherence, SQUID flux quantization", "examples": "OPMs, NV-diamond magnetometry, MagLOV proteins", "status": "Future (may enable non-invasive QIF)"},
]
