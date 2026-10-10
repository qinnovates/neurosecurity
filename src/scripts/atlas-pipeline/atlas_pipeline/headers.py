"""Volume headers: every volume is read through its affine, and the facts are recorded (check K0)."""
from __future__ import annotations

import pathlib
from typing import Any

import nibabel as nib
import numpy as np

from .errors import HeaderError


def header_facts(path: pathlib.Path) -> dict[str, Any]:
    """Orientation facts for one NIfTI file. Fails when neither sform nor qform is set."""
    image = nib.load(str(path))
    header = image.header
    sform_code, qform_code = int(header["sform_code"]), int(header["qform_code"])
    if sform_code == 0 and qform_code == 0:
        raise HeaderError(f"{path.name} has neither sform nor qform; its world placement is unknown, so it cannot be used")
    affine = image.affine
    if sform_code > 0 and qform_code > 0 and not np.allclose(header.get_sform(), header.get_qform(), atol=1e-3):
        raise HeaderError(f"{path.name} has sform and qform that disagree; its world placement is ambiguous")
    return {
        "file": path.name,
        "shape": [int(n) for n in image.shape[:3]],
        "voxel_mm": [round(float(z), 4) for z in header.get_zooms()[:3]],
        "axis_codes": "".join(nib.aff2axcodes(affine)),
        "determinant_sign": int(np.sign(np.linalg.det(affine[:3, :3]))),
        "sform_code": sform_code,
        "qform_code": qform_code,
        "placement_from": "sform" if sform_code > 0 else "qform",
    }


def load_canonical(path: pathlib.Path, dtype: type = np.float32) -> tuple[np.ndarray, np.ndarray]:
    """Load a 3D or 4D volume reoriented to RAS axes. Returns (data, affine)."""
    header_facts(path)
    image = nib.as_closest_canonical(nib.load(str(path)))
    affine = np.asarray(image.affine, dtype=np.float64)
    off_axis = affine[:3, :3] - np.diag(np.diag(affine[:3, :3]))
    if np.abs(off_axis).max() > 1e-6 or (np.diag(affine[:3, :3]) <= 0).any():
        raise HeaderError(f"{path.name} is not axis-aligned after reorientation; an oblique volume needs a resample step this pipeline does not have")
    return np.asanyarray(image.dataobj, dtype=dtype), affine
