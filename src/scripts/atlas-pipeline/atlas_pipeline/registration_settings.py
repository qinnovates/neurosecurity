"""The named registration settings. Kept apart from the code that runs ANTs so that reading them needs no imaging library."""
from __future__ import annotations

from typing import Any

SETTINGS: dict[str, dict[str, Any]] = {
    "A_syn_mattes_default": {"type_of_transform": "SyN", "syn_metric": "mattes", "syn_sampling": 32,
                             "reg_iterations": (40, 20, 0), "flow_sigma": 3, "grad_step": 0.2},
    "B_syn_cc_fullres": {"type_of_transform": "SyN", "syn_metric": "CC", "syn_sampling": 2,
                         "reg_iterations": (40, 20, 10), "flow_sigma": 3, "grad_step": 0.2},
    "C_synonly_mattes_sharper": {"type_of_transform": "SyNOnly", "initial_transform": "identity", "syn_metric": "mattes",
                                 "syn_sampling": 32, "reg_iterations": (60, 30, 10), "flow_sigma": 2, "grad_step": 0.15},
}
FORWARD_FILES = ("xfm_1Warp.nii.gz", "xfm_0GenericAffine.mat")
INVERSE_FILES = ("xfm_0GenericAffine.mat", "xfm_1InverseWarp.nii.gz")


def flat_parameters(setting: str) -> dict[str, Any]:
    """One setting as text, numbers or booleans; a schedule such as (40, 20, 10) becomes "40x20x10"."""
    return {key: ("x".join(str(item) for item in value) if isinstance(value, tuple) else value) for key, value in SETTINGS[setting].items()}
