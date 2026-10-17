"""The 10-20 layout as a table of arcs. Standard library only, so the placement and its checker share one definition."""
from __future__ import annotations

LAYOUT_ID = "10-20"
FIDUCIAL_IDS = ("nasion", "inion", "left_preauricular", "right_preauricular")
# Each arc: id, start, end, a point it passes through ("top" for the midline), electrodes at shares of its measured length.
ARCS: tuple[tuple[str, str, str, str, dict[str, float]], ...] = (
    ("midline", "nasion", "inion", "top", {"Fpz": 0.1, "Fz": 0.3, "Cz": 0.5, "Pz": 0.7, "Oz": 0.9}),
    ("ear_to_ear", "left_preauricular", "right_preauricular", "Cz", {"T7": 0.1, "C3": 0.3, "C4": 0.7, "T8": 0.9}),
    ("left_circumference", "Fpz", "Oz", "T7", {"Fp1": 0.1, "F7": 0.3, "P7": 0.7, "O1": 0.9}),
    ("right_circumference", "Fpz", "Oz", "T8", {"Fp2": 0.1, "F8": 0.3, "P8": 0.7, "O2": 0.9}),
    ("frontal", "F7", "F8", "Fz", {"F3": 0.25, "F4": 0.75}),
    ("parietal", "P7", "P8", "Pz", {"P3": 0.25, "P4": 0.75}),
)
# A position an arc passes through that an earlier arc placed: where it falls on this arc is measured, not set.
CROSSINGS = {"ear_to_ear": "Cz", "left_circumference": "T7", "right_circumference": "T8", "frontal": "Fz", "parietal": "Pz"}
ELECTRODE_ORDER = ("Fpz", "Fp1", "Fp2", "F7", "F3", "Fz", "F4", "F8", "T7", "C3", "Cz", "C4", "T8", "P7", "P3", "Pz", "P4", "P8", "O1", "Oz", "O2")
MIRROR_PAIRS = (("Fp1", "Fp2"), ("F7", "F8"), ("F3", "F4"), ("T7", "T8"), ("C3", "C4"), ("P7", "P8"), ("P3", "P4"), ("O1", "O2"))
MIDLINE = ("Fpz", "Fz", "Cz", "Pz", "Oz")
# Names used before the 10-10 revision renamed four positions.
OLDER_NAMES = {"T7": "T3", "T8": "T4", "P7": "T5", "P8": "T6"}
