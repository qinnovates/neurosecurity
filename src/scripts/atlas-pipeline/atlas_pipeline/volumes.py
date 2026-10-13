"""Voxel-grid helpers: world coordinates, header-only resampling, sides, size class."""
from __future__ import annotations

from typing import Any

import numpy as np
from scipy import ndimage

RESOLVED_MIN_EXTENT, RESOLVED_MIN_VOXELS = 4.0, 100
UNRESOLVED_MAX_EXTENT, UNRESOLVED_MAX_VOXELS = 2.0, 20


def world_coords(affine: np.ndarray, voxel_ijk: np.ndarray) -> np.ndarray:
    return voxel_ijk @ affine[:3, :3].T + affine[:3, 3]


def voxel_volume_mm3(affine: np.ndarray) -> float:
    return abs(float(np.linalg.det(affine[:3, :3])))


def crop_affine(affine: np.ndarray, start: np.ndarray) -> np.ndarray:
    out = affine.copy()
    out[:3, 3] = affine[:3, :3] @ np.asarray(start, dtype=np.float64) + affine[:3, 3]
    return out


def resample_like(data: np.ndarray, affine: np.ndarray, ref_shape: tuple[int, ...], ref_affine: np.ndarray, order: int) -> np.ndarray:
    """Header-only resample onto a reference grid: order 0 for label ids, 1 for continuous fields."""
    voxel_map = np.linalg.inv(affine) @ ref_affine
    return ndimage.affine_transform(data, voxel_map[:3, :3], offset=voxel_map[:3, 3], output_shape=tuple(ref_shape),
                                    order=order, mode="constant", cval=0)


def sample_at_world(data: np.ndarray, affine: np.ndarray, world_xyz: np.ndarray, order: int = 1) -> np.ndarray:
    voxel = (world_xyz - affine[:3, 3]) @ np.linalg.inv(affine[:3, :3]).T
    return ndimage.map_coordinates(data, voxel.T, order=order, mode="constant", cval=0.0)


def side_selectors(shape: tuple[int, ...], affine: np.ndarray) -> dict[str, np.ndarray]:
    """Boolean selectors along the first axis for world x < 0 (left) and x > 0 (right), RAS grids only."""
    x_world = affine[0, 3] + affine[0, 0] * np.arange(shape[0])
    return {"left": (x_world < 0)[:, None, None], "right": (x_world > 0)[:, None, None]}


def shortest_extent_voxels(voxel_ijk: np.ndarray) -> float:
    """Extent (max - min + 1) along the smallest principal axis, in voxels."""
    if len(voxel_ijk) < 4:
        return float(min(np.ptp(voxel_ijk, axis=0) + 1)) if len(voxel_ijk) else 0.0
    centred = voxel_ijk - voxel_ijk.mean(axis=0)
    _, _, axes = np.linalg.svd(centred, full_matrices=False)
    return float(np.ptp(centred @ axes[-1]) + 1.0)


def size_class(voxels: int, shortest_extent: float) -> str:
    """Engineering rule, not a literature value: see the runbook."""
    if shortest_extent >= RESOLVED_MIN_EXTENT and voxels >= RESOLVED_MIN_VOXELS:
        return "resolved"
    if shortest_extent < UNRESOLVED_MAX_EXTENT or voxels < UNRESOLVED_MAX_VOXELS:
        return "unresolved"
    return "coarse"


def mask_facts(mask: np.ndarray, affine: np.ndarray) -> dict[str, Any]:
    """Voxel count, extent of the largest connected piece, centroid and bounds of one mask."""
    voxels = np.argwhere(mask)
    if len(voxels) == 0:
        return {"voxels": 0, "size_class": "not_drawn"}
    labelled, count = ndimage.label(mask)
    sizes = ndimage.sum_labels(mask, labelled, index=np.arange(1, count + 1))
    largest = np.argwhere(labelled == int(np.argmax(sizes)) + 1)
    extent = shortest_extent_voxels(largest.astype(np.float64))
    world = world_coords(affine, voxels.astype(np.float64))
    return {
        "voxels": int(len(voxels)),
        "connected_pieces": int(count),
        "largest_piece_voxels": int(len(largest)),
        "shortest_extent_voxels": round(extent, 2),
        "size_class": size_class(int(len(largest)), extent),
        "volume_mm3": round(len(voxels) * voxel_volume_mm3(affine), 2),
        "centroid_mm": [round(float(v), 2) for v in world.mean(axis=0)],
        "bbox_mm": [[round(float(v), 2) for v in world.min(axis=0)], [round(float(v), 2) for v in world.max(axis=0)]],
    }
