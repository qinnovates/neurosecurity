"""Registration and placement evidence, written as data so a reviewer can re-run and compare it.

Measures are independent of what the registration optimises: tissue placement of gyral labels (V1),
surface agreement with publisher-registered shapes (V2), each for the intended transform under three
parameter settings, for the header-only placement, and for seeded faults applied in output space.
Also: shift scans (K5) for sources placed by header, folding (K4), and agreement between sources
that needed no transform from this pipeline.
"""
from __future__ import annotations

import pathlib
from collections.abc import Callable
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
# CIT168 ships nothing and has no build plan, and the fetch step no longer downloads it. These name what the committed
# V2 and cross-source measures read, so re-running them needs these files placed in the cache by hand.
CIT168_SOURCE_ID = "cit168_rl"
CIT168_PROBABILITY_FILE = "CIT168toMNI152-2009c_prob.nii.gz"
CIT168_PROBABILITY_CUT = 0.5


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


NOISE_NOTE = ("The spread is across three registration parameter settings: it measures how sensitive the result is to those settings, "
              "not sampling noise. The grey-matter map is the declared template's own, the same template the registration targets.")
MIRROR_BEFORE_NOTE = ("Not run: the moving image is symmetric and its labels are a mirrored pair with shared ids, so a mirror before the "
                      "transform changes nothing. Laterality rests on the header and on the atlas having no side ids.")
POOLED_NOTE = ("V1 is pooled over all gyral labels per hemisphere. Per label and side it is recorded under v1_per_label; some label-sides "
               "score lower after the registration and are listed under v1_label_sides_worse.")


def _allen_inputs(cache_dir: pathlib.Path, registry: Registry, transform_id: str) -> dict[str, Any]:
    """The Allen annotation as compact ids, which compact id each acronym has, and the gyral labels the cortex asset ships."""
    plans = [plan for plan in registry.inputs["assets"] if plan.get("transform") == transform_id]
    cortex_plan = next(plan for plan in plans if plan["layer"] == "cortical")
    annotation, affine = load_canonical(source_file(cache_dir, cortex_plan["source"], cortex_plan["file"]), dtype=np.int64)
    compact, ids = structures.compact_allen_ids(annotation)
    csv_path = source_file(cache_dir, cortex_plan["source"], cortex_plan["names_file"])
    rows = structures.read_allen_table(csv_path)
    compact_of = {row["acronym"]: int(np.searchsorted(ids, int(row["id"]))) + 1 for row in rows}
    gyri = [row["acronym"] for row in structures.select_allen_rows(rows, csv_path, cortex_plan["select"])]
    return {"compact": compact, "affine": affine, "compact_of": compact_of, "gyri": gyri}


def _measurer(cache_dir: pathlib.Path, registry: Registry, shape: tuple[int, ...], affine: np.ndarray,
              allen: dict[str, Any]) -> Callable[..., dict[str, Any]]:
    """A function that scores one label volume on the declared grid: V1 pooled and per label, V2 per structure and side."""
    template = registry.inputs["template"]
    tissue = {}
    for kind in ("gm", "csf"):
        data, tissue_affine = load_canonical(source_file(cache_dir, template["source"], template[kind]))
        tissue[kind] = resample_like(data, tissue_affine, shape, affine, 1) > checks.TISSUE_PROBABILITY_CUT
    sides = side_selectors(shape, affine)
    box = _box(shape, affine)
    box_sides = side_selectors(tuple(s.stop - s.start for s in box), crop_affine(affine, np.array([s.start for s in box])))
    cit, cit_affine = load_canonical(source_file(cache_dir, CIT168_SOURCE_ID, CIT168_PROBABILITY_FILE))
    cit_masks = {name: sum(resample_like(cit[..., k], cit_affine, shape, affine, 1) for k in indices)[box] >= CIT168_PROBABILITY_CUT
                 for name, (_, indices) in ALLEN_VS_CIT168.items()}
    compact_of, gyri = allen["compact_of"], allen["gyri"]
    gyri_ids = np.array([compact_of[acronym] for acronym in gyri])

    def measure(labels: np.ndarray, per_label: bool = False) -> dict[str, Any]:
        v2 = {}
        for name, (acronyms, _) in ALLEN_VS_CIT168.items():
            allen_mask = np.isin(labels[box], [compact_of[a] for a in acronyms])
            for side in ("left", "right"):
                v2[f"{name}|{side}"] = checks.compare_masks(allen_mask & box_sides[side], cit_masks[name] & box_sides[side], registration.DECLARED_GRID_VOXEL_MM)
        row = {"v1": checks.tissue_share(labels, gyri_ids, tissue, sides), "v2": v2}
        if per_label:
            shares = checks.tissue_share_per_label(labels, gyri_ids, tissue["gm"], sides)
            row["v1_per_label"] = {acronym: shares[compact_of[acronym]] for acronym in gyri}
        return row

    return measure


def registration_evidence(cache_dir: pathlib.Path, registry: Registry) -> dict[str, Any]:
    transform_id = next(plan["transform"] for plan in registry.inputs["assets"] if "transform" in plan)
    transform_row = registry.inputs["transforms"][transform_id]
    template = registry.inputs["template"]
    template_image = nib.load(str(source_file(cache_dir, template["source"], template["t1"])))
    shape, affine = registration.declared_grid(template_image.shape, template_image.affine)
    work = cache_dir / "work"
    work.mkdir(parents=True, exist_ok=True)
    reference_path, compact_path, scratch_path = work / "declared-grid.nii.gz", work / "allen-compact-evidence.nii.gz", work / "evidence-scratch.nii.gz"
    registration.write_volume(reference_path, np.zeros(shape, dtype=np.uint8), affine)
    allen = _allen_inputs(cache_dir, registry, transform_id)
    registration.write_volume(compact_path, allen["compact"], allen["affine"])
    measure = _measurer(cache_dir, registry, shape, affine, allen)

    identity = measure(_apply_labels(compact_path, reference_path, [], scratch_path), per_label=True)
    settings: dict[str, Any] = {}
    for setting in registration.SETTINGS:
        forward, inverse = _setting_files(cache_dir, transform_id, transform_row, setting)
        intended = _apply_labels(compact_path, reference_path, forward, scratch_path)
        row = {"intended": measure(intended, per_label=True)}
        row.update({name: measure(volume) for name, volume in _faults(intended).items()})
        if inverse is not None:
            flags = [pathlib.Path(p).suffix == ".mat" for p in inverse]
            row["inverse_wrong_way"] = measure(_apply_labels(compact_path, reference_path, inverse, scratch_path, flags))
        settings[setting] = {"files": {pathlib.Path(p).name: sha256_of(pathlib.Path(p)) for p in forward}, "variants": row,
                             "displacement_in_brain_mask": registration.displacement_stats(source_file(cache_dir, template["source"], template["mask"]), forward)}
    scratch_path.unlink(missing_ok=True)
    shipping = transform_row["setting"]
    return {"transform_id": transform_id, "shipping_setting": shipping, "tool": f"{transform_row['tool']} {transform_row['tool_version']}",
            "random_seed": transform_row["random_seed"], "gyral_labels": allen["gyri"], "identity": identity, "settings": settings,
            "outcomes": outcomes(identity, settings),
            "v1_label_sides_worse": label_sides_worse(identity["v1_per_label"], settings[shipping]["variants"]["intended"]["v1_per_label"]),
            "noise_note": NOISE_NOTE, "pooled_note": POOLED_NOTE, "mirror_before_note": MIRROR_BEFORE_NOTE}


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


def label_sides_worse(header_only: dict[str, dict[str, float]], intended: dict[str, dict[str, float]]) -> list[dict[str, Any]]:
    """Gyral label-sides whose grey-matter share is lower after the shipped registration than with no transform."""
    rows = [{"label": acronym, "side": side, "header_only": header_only[acronym][side], "intended": intended[acronym][side]}
            for acronym in header_only for side in ("left", "right") if intended[acronym][side] < header_only[acronym][side]]
    return sorted(rows, key=lambda row: row["intended"] - row["header_only"])


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
    labels, affine = load_canonical(source_file(cache_dir, "neudorfer_hypothalamus", neudorfer_plan["file"]))
    labels = np.rint(labels).astype(np.int32)
    box = _box(labels.shape, affine)
    cit, cit_affine = load_canonical(source_file(cache_dir, CIT168_SOURCE_ID, CIT168_PROBABILITY_FILE))
    cropped_affine = crop_affine(affine, np.array([s.start for s in box]))
    crop_shape = tuple(s.stop - s.start for s in box)
    sides = side_selectors(crop_shape, cropped_affine)
    out = {}
    for name, (cit_indices, neudorfer_ids) in CIT168_VS_NEUDORFER.items():
        probability = sum(resample_like(cit[..., k], cit_affine, crop_shape, cropped_affine, 1) for k in cit_indices)
        for side in ("left", "right"):
            out[f"{name}|{side}"] = checks.compare_masks((probability >= CIT168_PROBABILITY_CUT) & sides[side], labels[box] == neudorfer_ids[side],
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
