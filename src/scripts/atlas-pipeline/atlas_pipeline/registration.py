"""The computed registration (symmetric template to the declared asymmetric template) and its use.

The transform is archived outside git and pinned by hash in the registry; a build reuses it and never
silently recomputes it. Transforms are applied to volumes only, in image direction. Volumes cross
into and out of ANTs as NIfTI files, so no axis convention is restated in this code.
"""
from __future__ import annotations

import pathlib
from typing import Any

import nibabel as nib
import numpy as np

from .errors import TransformError
from .fetch import sha256_of, source_file

DECLARED_GRID_VOXEL_MM = 0.5
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


def declared_grid(template_shape: tuple[int, ...], template_affine: np.ndarray) -> tuple[tuple[int, int, int], np.ndarray]:
    """A 0.5 mm grid covering the declared template's own grid."""
    factor = float(template_affine[0, 0]) / DECLARED_GRID_VOXEL_MM
    shape = tuple(int(round(n * factor)) for n in template_shape[:3])
    affine = np.diag([DECLARED_GRID_VOXEL_MM] * 3 + [1.0])
    affine[:3, 3] = template_affine[:3, 3] - (float(template_affine[0, 0]) - DECLARED_GRID_VOXEL_MM) / 2.0
    return shape, affine  # type: ignore[return-value]


def transform_dir(cache_dir: pathlib.Path, transform_id: str, setting: str | None = None) -> pathlib.Path:
    base = cache_dir / "transforms" / transform_id
    return base if setting is None else base / "settings" / setting


def verify_archive(cache_dir: pathlib.Path, transform_row: dict[str, Any]) -> list[str]:
    """Paths of the pinned forward transform files, after checking each against its pin."""
    directory = transform_dir(cache_dir, transform_row["id"])
    paths = []
    for pinned in transform_row["archive"]:
        path = directory / pinned["name"]
        if not path.is_file():
            raise TransformError(f"archived transform file {pinned['name']} is missing from the cache; restore the archive or "
                                 "recompute with the 'register' command and review the new pins")
        actual = sha256_of(path)
        if actual != pinned["sha256"]:
            raise TransformError(f"archived transform file {pinned['name']} has sha256 {actual}, pin is {pinned['sha256']}; "
                                 "do not build from it")
        paths.append(str(path))
    order = {name: position for position, name in enumerate(FORWARD_FILES)}
    return sorted(paths, key=lambda p: order[pathlib.Path(p).name])


def compute(cache_dir: pathlib.Path, transform_row: dict[str, Any], setting: str, out_dir: pathlib.Path) -> dict[str, Any]:
    """Run ANTs under one named setting and write the transform files into `out_dir`."""
    import ants  # imported here so the rest of the pipeline and its tests do not need ANTs loaded

    out_dir.mkdir(parents=True, exist_ok=True)
    fixed = ants.image_read(str(source_file(cache_dir, transform_row["fixed_source"], transform_row["fixed_file"])))
    moving = ants.image_read(str(source_file(cache_dir, transform_row["moving_source"], transform_row["moving_file"])))
    ants.registration(fixed=fixed, moving=moving, outprefix=str(out_dir / "xfm_"),
                      random_seed=int(transform_row["random_seed"]), **SETTINGS[setting])
    return {"setting": setting, "tool": f"antspyx {ants.__version__}", "random_seed": int(transform_row["random_seed"]),
            "files": {name: sha256_of(out_dir / name) for name in sorted({*FORWARD_FILES, *INVERSE_FILES}) if (out_dir / name).is_file()}}


def write_volume(path: pathlib.Path, data: np.ndarray, affine: np.ndarray) -> None:
    image = nib.Nifti1Image(data, affine)
    image.set_sform(affine, code=4)
    image.set_qform(affine, code=4)
    nib.save(image, str(path))


def apply_to_volume(moving_path: pathlib.Path, reference_path: pathlib.Path, transforms: list[str], interpolator: str,
                    out_path: pathlib.Path, invert_flags: list[bool] | None = None) -> None:
    """Resample a volume through transforms onto the reference grid ('nearestNeighbor' for label ids)."""
    import ants

    reference = ants.image_read(str(reference_path))
    moving = ants.image_read(str(moving_path))
    if transforms:
        kwargs = {"whichtoinvert": invert_flags} if invert_flags is not None else {}
        result = ants.apply_transforms(reference, moving, transforms, interpolator=interpolator, **kwargs)
    else:
        result = ants.resample_image_to_target(moving, reference, interp_type=interpolator)
    ants.image_write(result, str(out_path))


def displacement_stats(reference_mask_path: pathlib.Path, transforms: list[str], sample: int = 20000) -> dict[str, float]:
    """K4, in part: size of the displacement inside the brain mask, from a seeded sample of voxels."""
    import ants
    import pandas as pd

    mask = ants.image_read(str(reference_mask_path))
    indices = np.argwhere(mask.numpy() > 0.5)
    chosen = indices[np.random.default_rng(20261009).choice(len(indices), size=min(sample, len(indices)), replace=False)]
    physical = (chosen * np.array(mask.spacing)) @ np.array(mask.direction).T + np.array(mask.origin)
    mapped = ants.apply_transforms_to_points(3, pd.DataFrame(physical, columns=["x", "y", "z"]), transforms)
    magnitude = np.linalg.norm(mapped[["x", "y", "z"]].to_numpy() - physical, axis=1)
    return {"median_mm": round(float(np.median(magnitude)), 3), "p95_mm": round(float(np.percentile(magnitude, 95)), 3),
            "max_mm": round(float(magnitude.max()), 3), "points": int(len(magnitude))}
