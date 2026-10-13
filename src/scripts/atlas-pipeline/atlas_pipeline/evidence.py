"""Registration and placement evidence, written as data so a reviewer can re-run and compare it.

Measures are independent of what the registration optimises: tissue placement of gyral labels (V1),
surface agreement with publisher-registered shapes (V2), each for the intended transform under three
parameter settings, for the header-only placement, and for seeded faults applied in output space.
Also: shift scans (K5) for sources placed by header, folding (K4), and agreement between sources
that needed no transform from this pipeline.
"""
from __future__ import annotations

import pathlib
from typing import Any

import nibabel as nib
import numpy as np

from . import checks, registration, structures
from .fetch import sha256_of, source_file
from .headers import load_canonical
from .sources import Registry
from .volumes import crop_affine, resample_like, side_selectors

SHIFT_VOXELS = 4  # 2 mm on the 0.5 mm declared grid
DEEP_BOX_MM = ((-45.0, 45.0), (-50.0, 35.0), (-35.0, 30.0))
ALLEN_VS_CIT168 = {"STN": (["STH"], [15]), "RN": (["RN"], [7]), "SN": (["SN"], [6, 8]), "GPe": (["GPe"], [4]), "GPi": (["GPi"], [5]),
                   "Putamen": (["Pu", "PuPV"], [0]), "Caudate": (["CaH", "CaB", "CaT"], [1]), "Accumbens": (["NAC"], [2])}
CIT168_VS_NEUDORFER = {"STN": ([15], {"left": 14, "right": 13}), "SN": ([6, 8], {"left": 16, "right": 15}),
                       "RN": ([7], {"left": 18, "right": 17}), "Mammillary": ([14], {"left": 10, "right": 9})}
GYRI_PARENT_ACRONYM = "CeG"


def _box(shape: tuple[int, ...], affine: np.ndarray) -> tuple[slice, ...]:
    return tuple(slice(max(int(round((low - affine[a, 3]) / affine[a, a])), 0), min(int(round((high - affine[a, 3]) / affine[a, a])), shape[a]))
                 for a, (low, high) in enumerate(DEEP_BOX_MM))


def _setting_files(cache_dir: pathlib.Path, transform_id: str, transform_row: dict[str, Any], setting: str) -> tuple[list[str], list[str] | None]:
    """Forward and inverse transform file lists for one setting, computing the setting if it is not cached."""
    is_archived = setting == transform_row["setting"]
    directory = registration.transform_dir(cache_dir, transform_id, None if is_archived else setting)
    if is_archived:
        forward = registration.verify_archive(cache_dir, {"id": transform_id, **transform_row})
    else:
        if not all((directory / name).is_file() for name in registration.FORWARD_FILES):
            registration.compute(cache_dir, transform_row, setting, directory)
        forward = [str(directory / name) for name in registration.FORWARD_FILES]
    inverse = [str(directory / name) for name in registration.INVERSE_FILES]
    return forward, inverse if all(pathlib.Path(p).is_file() for p in inverse) else None


def _apply_labels(compact_path: pathlib.Path, reference_path: pathlib.Path, transforms: list[str], out_path: pathlib.Path,
                  invert_flags: list[bool] | None = None) -> np.ndarray:
    registration.apply_to_volume(compact_path, reference_path, transforms, "nearestNeighbor", out_path, invert_flags)
    data, _ = load_canonical(out_path)
    return np.rint(data).astype(np.uint8)


def _faults(intended: np.ndarray) -> dict[str, np.ndarray]:
    """Seeded faults applied in output space to the intended result."""
    faults = {f"shift_2mm_{axis_name}": np.roll(intended, SHIFT_VOXELS, axis=axis) for axis, axis_name in enumerate("xyz")}
    faults["mirror_after"] = intended[::-1, :, :]
    return faults


def registration_evidence(cache_dir: pathlib.Path, registry: Registry) -> dict[str, Any]:
    transform_id = next(plan["transform"] for plan in registry.inputs["assets"] if "transform" in plan)
    transform_row = registry.inputs["transforms"][transform_id]
    template = registry.inputs["template"]
    t1_path = source_file(cache_dir, template["source"], template["t1"])
    template_image = nib.load(str(t1_path))
    shape, affine = registration.declared_grid(template_image.shape, template_image.affine)
    work = cache_dir / "work"
    work.mkdir(parents=True, exist_ok=True)
    reference_path, compact_path, scratch_path = work / "declared-grid.nii.gz", work / "allen-compact-evidence.nii.gz", work / "evidence-scratch.nii.gz"
    registration.write_volume(reference_path, np.zeros(shape, dtype=np.uint8), affine)

    allen_plan = next(plan for plan in registry.inputs["assets"] if plan.get("transform") == transform_id)
    annotation, annotation_affine = load_canonical(source_file(cache_dir, allen_plan["source"], allen_plan["file"]), dtype=np.int64)
    compact, ids = structures.compact_allen_ids(annotation)
    registration.write_volume(compact_path, compact, annotation_affine)
    csv_path = source_file(cache_dir, allen_plan["source"], allen_plan["names_file"])
    rows = structures.read_allen_table(csv_path)
    compact_of = {row["acronym"]: int(np.searchsorted(ids, int(row["id"]))) + 1 for row in rows}
    gyri = structures.select_allen_rows(rows, csv_path, {"descendants_of_acronym": GYRI_PARENT_ACRONYM})
    gyri_ids = np.array([compact_of[row["acronym"]] for row in gyri])

    tissue = {}
    for kind in ("gm", "csf"):
        data, tissue_affine = load_canonical(source_file(cache_dir, template["source"], template[kind]))
        tissue[kind] = resample_like(data, tissue_affine, shape, affine, 1) > checks.TISSUE_PROBABILITY_CUT
    sides = side_selectors(shape, affine)
    box = _box(shape, affine)
    box_sides = side_selectors(tuple(s.stop - s.start for s in box), crop_affine(affine, np.array([s.start for s in box])))
    cit_plan = next(plan for plan in registry.inputs["assets"] if plan["source"] == "cit168_rl")
    cit, cit_affine = load_canonical(source_file(cache_dir, "cit168_rl", cit_plan["file"]))
    cit_full = {name: sum(resample_like(cit[..., k], cit_affine, shape, affine, 1) for k in indices)[box] >= cit_plan["threshold"]
                for name, (_, indices) in ALLEN_VS_CIT168.items()}

    def measure(labels: np.ndarray) -> dict[str, Any]:
        v2 = {}
        for name, (acronyms, _) in ALLEN_VS_CIT168.items():
            allen_mask = np.isin(labels[box], [compact_of[a] for a in acronyms])
            for side in ("left", "right"):
                v2[f"{name}|{side}"] = checks.compare_masks(allen_mask & box_sides[side], cit_full[name] & box_sides[side], registration.DECLARED_GRID_VOXEL_MM)
        return {"v1": checks.tissue_share(labels, gyri_ids, tissue, sides), "v2": v2}

    variants: dict[str, dict[str, Any]] = {"identity": measure(_apply_labels(compact_path, reference_path, [], scratch_path))}
    settings: dict[str, Any] = {}
    for setting in registration.SETTINGS:
        forward, inverse = _setting_files(cache_dir, transform_id, transform_row, setting)
        intended = _apply_labels(compact_path, reference_path, forward, scratch_path)
        row = {"intended": measure(intended)}
        row.update({name: measure(volume) for name, volume in _faults(intended).items()})
        if inverse is not None:
            flags = [pathlib.Path(p).suffix == ".mat" for p in inverse]
            row["inverse_wrong_way"] = measure(_apply_labels(compact_path, reference_path, inverse, scratch_path, flags))
        settings[setting] = {"files": {pathlib.Path(p).name: sha256_of(pathlib.Path(p)) for p in forward}, "variants": row,
                             "displacement_in_brain_mask": registration.displacement_stats(source_file(cache_dir, template["source"], template["mask"]), forward)}
    scratch_path.unlink(missing_ok=True)
    return {"transform_id": transform_id, "shipping_setting": transform_row["setting"], "tool": f"{transform_row['tool']} {transform_row['tool_version']}",
            "random_seed": transform_row["random_seed"], "identity": variants["identity"], "settings": settings,
            "outcomes": outcomes(variants["identity"], settings),
            "mirror_before_note": "Not run: the moving image is symmetric and its labels are a mirrored pair with shared ids, so a mirror before the transform changes nothing. Laterality rests on the header and on the atlas having no side ids."}


def outcomes(identity: dict[str, Any], settings: dict[str, Any]) -> dict[str, Any]:
    """The three-outcome rule per measure: is the intended transform better than header-only beyond the spread?"""
    out: dict[str, Any] = {"v1_grey_matter_share": {}, "v2_hd95_mm": {}}
    for side in ("left", "right"):
        intended = [row["variants"]["intended"]["v1"][side]["gm"] for row in settings.values()]
        out["v1_grey_matter_share"][side] = {"header_only": identity["v1"][side]["gm"], "intended": intended,
                                            **checks.gain_beyond_noise(intended, identity["v1"][side]["gm"], higher_is_better=True)}
    for pair, baseline in identity["v2"].items():
        intended = [row["variants"]["intended"]["v2"][pair]["hd95_mm"] for row in settings.values()]
        out["v2_hd95_mm"][pair] = {"header_only": baseline["hd95_mm"], "intended": intended,
                                   **checks.gain_beyond_noise(intended, baseline["hd95_mm"], higher_is_better=False)}
    return out


def shift_scan_evidence(cache_dir: pathlib.Path, registry: Registry, pairs: dict[str, str]) -> dict[str, Any]:
    """K5 for each source placed by header: `pairs` maps source id to the file name of its own T1 image."""
    template = registry.inputs["template"]
    fixed, fixed_affine = load_canonical(source_file(cache_dir, template["source"], template["t1"]))
    mask, _ = load_canonical(source_file(cache_dir, template["source"], template["mask"]))
    out = {}
    for source_id, file_name in pairs.items():
        moving, moving_affine = load_canonical(source_file(cache_dir, source_id, file_name))
        out[source_id] = {"image": file_name, **checks.shift_scan(fixed, fixed_affine, mask > 0.5, moving, moving_affine)}
    return out


def cross_source_evidence(cache_dir: pathlib.Path, registry: Registry) -> dict[str, Any]:
    """Agreement between CIT168 and the hypothalamus atlas, neither of which this pipeline transforms."""
    neudorfer_plan = next(plan for plan in registry.inputs["assets"] if plan["source"] == "neudorfer_hypothalamus")
    cit_plan = next(plan for plan in registry.inputs["assets"] if plan["source"] == "cit168_rl")
    labels, affine = load_canonical(source_file(cache_dir, "neudorfer_hypothalamus", neudorfer_plan["file"]))
    labels = np.rint(labels).astype(np.int32)
    box = _box(labels.shape, affine)
    cit, cit_affine = load_canonical(source_file(cache_dir, "cit168_rl", cit_plan["file"]))
    cropped_affine = crop_affine(affine, np.array([s.start for s in box]))
    crop_shape = tuple(s.stop - s.start for s in box)
    sides = side_selectors(crop_shape, cropped_affine)
    out = {}
    for name, (cit_indices, neudorfer_ids) in CIT168_VS_NEUDORFER.items():
        probability = sum(resample_like(cit[..., k], cit_affine, crop_shape, cropped_affine, 1) for k in cit_indices)
        for side in ("left", "right"):
            out[f"{name}|{side}"] = checks.compare_masks((probability >= cit_plan["threshold"]) & sides[side], labels[box] == neudorfer_ids[side],
                                                         float(abs(affine[0, 0])))
    return out


def folding_evidence(cache_dir: pathlib.Path, registry: Registry) -> dict[str, Any]:
    """K4: voxels inside the brain mask where the archived warp's Jacobian determinant is not positive."""
    import ants

    transform_id, transform_row = next(iter(registry.inputs["transforms"].items()))
    forward = registration.verify_archive(cache_dir, {"id": transform_id, **transform_row})
    template = registry.inputs["template"]
    fixed = ants.image_read(str(source_file(cache_dir, template["source"], template["t1"])))
    mask = ants.image_read(str(source_file(cache_dir, template["source"], template["mask"]))).numpy() > 0.5
    jacobian = ants.create_jacobian_determinant_image(fixed, forward[0], do_log=False).numpy()
    return {"non_positive_voxels_in_mask": int((jacobian[mask] <= 0).sum()), "min": round(float(jacobian[mask].min()), 4), "max": round(float(jacobian[mask].max()), 4)}
