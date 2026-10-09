"""Checks whose measures do not depend on what a registration optimises.

K5 shift scan, V1 tissue placement of gyral labels, V2 surface agreement between two shapes, and the
overlap rule between shapes drawn from different atlases. Each returns numbers; callers decide.
"""
from __future__ import annotations

from typing import Any

import numpy as np
from scipy import ndimage

from .volumes import resample_like

SHIFT_SCAN_MM = (0.5, 1.0)
TISSUE_PROBABILITY_CUT = 0.5
DUPLICATE_DICE = 0.5


def pearson(a: np.ndarray, b: np.ndarray) -> float:
    a = a - a.mean()
    b = b - b.mean()
    denominator = float(np.sqrt((a * a).sum() * (b * b).sum()))
    return float((a * b).sum() / denominator) if denominator > 0 else 0.0


def shift_scan(fixed: np.ndarray, fixed_affine: np.ndarray, mask: np.ndarray, moving: np.ndarray, moving_affine: np.ndarray) -> dict[str, Any]:
    """K5: correlate a header-only resample with the template, at zero and at small shifts and mirrored.

    Passes when zero shift, unmirrored, scores strictly highest. A symmetric moving image ties with its
    mirror, so the mirror row is only informative for an asymmetric one.
    """
    fixed_values = fixed[mask]
    shifts = [(0.0, 0.0, 0.0)] + [tuple(sign * size if axis == k else 0.0 for k in range(3))
                                  for size in SHIFT_SCAN_MM for axis in range(3) for sign in (1, -1)]
    rows = []
    for mirror in (False, True):
        for shift in shifts:
            world_map = np.eye(4)
            world_map[0, 0] = -1.0 if mirror else 1.0
            world_map[:3, 3] = -np.asarray(shift)
            resampled = resample_like(moving, np.linalg.inv(world_map) @ moving_affine, fixed.shape, fixed_affine, 1)
            rows.append({"mirror_x": mirror, "shift_mm": list(shift), "ncc": round(pearson(fixed_values, resampled[mask]), 5)})
    identity = rows[0]["ncc"]
    best_other = max(row["ncc"] for row in rows[1:])
    return {"identity_ncc": identity, "best_other_ncc": best_other, "margin": round(identity - best_other, 5),
            "mirror_identity_ncc": rows[len(shifts)]["ncc"], "passed": identity > best_other, "rows": rows}


def tissue_share(labels: np.ndarray, label_ids: np.ndarray, tissue: dict[str, np.ndarray], sides: dict[str, np.ndarray]) -> dict[str, Any]:
    """V1: per hemisphere, the share of the given labels' voxels inside each tissue mask."""
    lookup = np.zeros(int(labels.max()) + 1, dtype=bool)
    lookup[label_ids] = True
    selected = lookup[labels]
    out: dict[str, Any] = {}
    for side, selector in sides.items():
        on_side = selected & selector
        total = int(on_side.sum())
        out[side] = {"voxels": total, **{kind: round(float((on_side & mask).sum()) / max(total, 1), 4) for kind, mask in tissue.items()}}
    return out


def surface_voxels(mask: np.ndarray) -> np.ndarray:
    return mask & ~ndimage.binary_erosion(mask)


def compare_masks(mask_a: np.ndarray, mask_b: np.ndarray, voxel_mm: float) -> dict[str, Any]:
    """V2 and cross-source agreement: Dice, centroid distance and symmetric surface distances."""
    count_a, count_b = int(mask_a.sum()), int(mask_b.sum())
    if count_a == 0 or count_b == 0:
        return {"voxels_a": count_a, "voxels_b": count_b, "empty": True}
    box = ndimage.find_objects((mask_a | mask_b).astype(np.int8))[0]
    padded = tuple(slice(max(s.start - 12, 0), s.stop + 12) for s in box)
    crop_a, crop_b = mask_a[padded], mask_b[padded]
    to_a = ndimage.distance_transform_edt(~surface_voxels(crop_a), sampling=voxel_mm)
    to_b = ndimage.distance_transform_edt(~surface_voxels(crop_b), sampling=voxel_mm)
    both = np.concatenate([to_b[surface_voxels(crop_a)], to_a[surface_voxels(crop_b)]])
    centroid_gap = (np.argwhere(mask_a).mean(axis=0) - np.argwhere(mask_b).mean(axis=0)) * voxel_mm
    return {
        "volume_a_mm3": round(count_a * voxel_mm ** 3, 1), "volume_b_mm3": round(count_b * voxel_mm ** 3, 1),
        "dice": round(2.0 * int((mask_a & mask_b).sum()) / (count_a + count_b), 4),
        "centroid_distance_mm": round(float(np.linalg.norm(centroid_gap)), 3),
        "mean_surface_distance_mm": round(float(both.mean()), 3),
        "hd95_mm": round(float(np.percentile(both, 95)), 3),
    }


def overlap_share(mask_a: np.ndarray, mask_b: np.ndarray) -> float:
    """Share of the smaller shape's voxels that also lie in the other shape."""
    smaller = min(int(mask_a.sum()), int(mask_b.sum()))
    return float((mask_a & mask_b).sum()) / smaller if smaller else 0.0


def dice(mask_a: np.ndarray, mask_b: np.ndarray) -> float:
    total = int(mask_a.sum()) + int(mask_b.sum())
    return 2.0 * float((mask_a & mask_b).sum()) / total if total else 0.0


def is_duplicate_shape(mask_a: np.ndarray, mask_b: np.ndarray) -> bool:
    """Two shapes from different atlases count as one structure drawn twice when their Dice exceeds the limit.

    A nucleus lying inside another atlas's larger parent region overlaps it fully but is not a duplicate;
    Dice stays low for that case, and the overlap share is still reported.
    """
    return dice(mask_a, mask_b) > DUPLICATE_DICE


def gain_beyond_noise(intended: list[float], baseline: float, higher_is_better: bool) -> dict[str, Any]:
    """The three-outcome rule: is the registered result better than the header-only one beyond the spread?

    `intended` holds the measure under each parameter setting; `baseline` is the header-only value.
    """
    spread = float(max(intended) - min(intended))
    gains = [(value - baseline) if higher_is_better else (baseline - value) for value in intended]
    if min(gains) > spread:
        outcome = "better"
    elif max(gains) < -spread:
        outcome = "worse"
    else:
        outcome = "not_distinguishable"
    return {"outcome": outcome, "spread": round(spread, 4), "gain_min": round(min(gains), 4), "gain_max": round(max(gains), 4)}
