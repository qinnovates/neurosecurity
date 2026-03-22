"""Attack registry - maps QIF-T IDs to generators with TARA metadata.

Central registry for all attack generators. Each entry maps a QIF-T technique
ID to its signal generator function and TARA metadata. Generators are organized
in attack module files by category (signal_injection, evasion, feedback) but
accessed through this unified registry.

Usage:
    from registry import REGISTRY, get_generator, list_attacks

    # Get a specific attack
    gen, meta = get_generator("QIF-T0023")
    signal = gen(duration_s=15.0)

    # List all available attacks
    for qif_t, meta in list_attacks():
        print(f"{qif_t}: {meta.name}")

    # Filter by NIC band
    for qif_t, meta in list_attacks(band="N7"):
        print(f"{qif_t}: {meta.name} (reaches cortex)")

    # Filter by tactic
    for qif_t, meta in list_attacks(tactic="QIF-B.EV"):
        print(f"{qif_t}: {meta.name} (evasion)")
"""

from typing import Callable, Dict, List, Optional, Tuple
import numpy as np

from attacks.base import AttackMetadata
from attacks.signal_injection import (
    generate_ssvep_15hz, SSVEP_15HZ_META,
    generate_ssvep_novel, SSVEP_NOVEL_META,
    generate_impedance_spike, IMPEDANCE_SPIKE_META,
    generate_flood, FLOODING_META,
    generate_phase_replay, PHASE_REPLAY_META,
)
from attacks.evasion import (
    generate_dc_drift, DC_DRIFT_META,
    generate_boiling_frog, BOILING_FROG_META,
    generate_envelope_modulation, ENVELOPE_MOD_META,
)
from attacks.feedback import (
    generate_closed_loop_cascade, CASCADE_META,
)
from attacks.adversarial import (
    generate_notch_aware_ssvep, NOTCH_AWARE_META,
    generate_threshold_aware_ramp, THRESHOLD_AWARE_META,
    generate_spectral_mimicry, SPECTRAL_MIMICRY_META,
    generate_freq_hopping_ssvep, FREQ_HOPPING_META,
    generate_cusum_aware_intermittent, CUSUM_AWARE_META,
)
from attacks.base import generate_clean_eeg, AttackMetadata


# Type alias for a generator function
GeneratorFn = Callable[..., np.ndarray]

# Registry: QIF-T ID -> (generator_fn, metadata)
REGISTRY: Dict[str, Tuple[GeneratorFn, AttackMetadata]] = {
    # Signal injection attacks
    SSVEP_15HZ_META.qif_t: (generate_ssvep_15hz, SSVEP_15HZ_META),
    SSVEP_NOVEL_META.qif_t: (generate_ssvep_novel, SSVEP_NOVEL_META),
    IMPEDANCE_SPIKE_META.qif_t: (generate_impedance_spike, IMPEDANCE_SPIKE_META),
    FLOODING_META.qif_t: (generate_flood, FLOODING_META),
    PHASE_REPLAY_META.qif_t: (generate_phase_replay, PHASE_REPLAY_META),

    # Evasion attacks
    DC_DRIFT_META.qif_t: (generate_dc_drift, DC_DRIFT_META),
    BOILING_FROG_META.qif_t: (generate_boiling_frog, BOILING_FROG_META),
    ENVELOPE_MOD_META.qif_t: (generate_envelope_modulation, ENVELOPE_MOD_META),

    # Feedback attacks
    CASCADE_META.qif_t: (generate_closed_loop_cascade, CASCADE_META),

    # Adversarial-aware attacks
    NOTCH_AWARE_META.qif_t: (generate_notch_aware_ssvep, NOTCH_AWARE_META),
    THRESHOLD_AWARE_META.qif_t: (generate_threshold_aware_ramp, THRESHOLD_AWARE_META),
    SPECTRAL_MIMICRY_META.qif_t: (generate_spectral_mimicry, SPECTRAL_MIMICRY_META),
    FREQ_HOPPING_META.qif_t: (generate_freq_hopping_ssvep, FREQ_HOPPING_META),
    CUSUM_AWARE_META.qif_t: (generate_cusum_aware_intermittent, CUSUM_AWARE_META),
}


def get_generator(qif_t: str) -> Tuple[GeneratorFn, AttackMetadata]:
    """Get a generator function and its metadata by QIF-T ID.

    Raises KeyError if the technique ID is not registered.
    """
    if qif_t not in REGISTRY:
        available = ", ".join(sorted(REGISTRY.keys()))
        raise KeyError(
            f"Unknown technique ID: {qif_t}. Available: {available}"
        )
    return REGISTRY[qif_t]


def list_attacks(
    tactic: Optional[str] = None,
    band: Optional[str] = None,
    severity: Optional[str] = None,
) -> List[Tuple[str, AttackMetadata]]:
    """List registered attacks, optionally filtered.

    Args:
        tactic: Filter by QIF tactic code (e.g. "QIF-B.EV").
        band: Filter by NIC band ID (e.g. "N7" for cortical attacks).
        severity: Filter by severity level (e.g. "CRITICAL").

    Returns: List of (qif_t, metadata) tuples.
    """
    results = []
    for qif_t, (gen_fn, meta) in sorted(REGISTRY.items()):
        if tactic and meta.tactic != tactic:
            continue
        if band and band not in meta.band_ids:
            continue
        if severity and meta.severity.upper() != severity.upper():
            continue
        results.append((qif_t, meta))
    return results


def list_by_nic() -> Dict[str, List[Tuple[str, AttackMetadata]]]:
    """Group attacks by NIC chain entry point.

    Returns a dict mapping the first band_id (entry point) to
    the list of attacks that enter through that band.
    """
    groups: Dict[str, List[Tuple[str, AttackMetadata]]] = {}
    for qif_t, (gen_fn, meta) in sorted(REGISTRY.items()):
        entry = meta.band_ids[0] if meta.band_ids else "unknown"
        groups.setdefault(entry, []).append((qif_t, meta))
    return groups


def list_by_severity() -> Dict[str, List[Tuple[str, AttackMetadata]]]:
    """Group attacks by severity level."""
    groups: Dict[str, List[Tuple[str, AttackMetadata]]] = {}
    for qif_t, (gen_fn, meta) in sorted(REGISTRY.items()):
        groups.setdefault(meta.severity, []).append((qif_t, meta))
    return groups
