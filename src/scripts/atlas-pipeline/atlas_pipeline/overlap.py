"""No structure is drawn twice: overlap between shapes drawn from different atlases."""
from __future__ import annotations

from typing import Any

import numpy as np

from .build import BuiltAsset
from .checks import dice, is_duplicate_shape, overlap_share
from .volumes import resample_like, world_coords

COMMON_GRID_MM = 0.5
REPORT_ABOVE_SHARE = 0.01


def _world_box(mask: np.ndarray, affine: np.ndarray) -> tuple[np.ndarray, np.ndarray]:
    corners = world_coords(affine, np.array([[0.0, 0.0, 0.0], np.array(mask.shape, dtype=np.float64) - 1.0]))
    return corners.min(axis=0), corners.max(axis=0)


def _on_common_grid(mask: np.ndarray, affine: np.ndarray, low: np.ndarray, shape: tuple[int, ...]) -> np.ndarray:
    grid = np.diag([COMMON_GRID_MM] * 3 + [1.0])
    grid[:3, 3] = low
    return resample_like(mask.astype(np.float32), affine, shape, grid, 1) >= 0.5


def cross_atlas_overlaps(assets: list[BuiltAsset]) -> list[dict[str, Any]]:
    """Every pair of deep shapes from different atlases whose volumes overlap by more than a trace."""
    shapes = [(built.plan["source"], key, mask, affine, *_world_box(mask, affine))
              for built in assets for key, (mask, affine) in built.masks.items()]
    rows = []
    for index, (atlas_a, key_a, mask_a, affine_a, low_a, high_a) in enumerate(shapes):
        for atlas_b, key_b, mask_b, affine_b, low_b, high_b in shapes[index + 1:]:
            if atlas_a == atlas_b or (high_a < low_b).any() or (high_b < low_a).any():
                continue
            low = np.minimum(low_a, low_b) - 1.0
            shape = tuple(int(n) for n in np.ceil((np.maximum(high_a, high_b) + 1.0 - low) / COMMON_GRID_MM))
            grid_a, grid_b = _on_common_grid(mask_a, affine_a, low, shape), _on_common_grid(mask_b, affine_b, low, shape)
            share = overlap_share(grid_a, grid_b)
            if share > REPORT_ABOVE_SHARE:
                rows.append({"a": f"{atlas_a}:{key_a}", "b": f"{atlas_b}:{key_b}", "share_of_smaller_shape": round(share, 4),
                             "dice": round(dice(grid_a, grid_b), 4), "duplicate": is_duplicate_shape(grid_a, grid_b)})
    return sorted(rows, key=lambda row: -row["share_of_smaller_shape"])
