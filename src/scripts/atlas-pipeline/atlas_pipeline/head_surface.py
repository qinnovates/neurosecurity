"""The head of the template as a solid mask, from its T1-weighted image.

The template's own brain mask stops at the brain. Devices worn on the head need the skin surface, so
this module thresholds the T1 image, keeps the largest connected piece and fills its inside. Where
the image's field of view cuts the head, the mask ends in a flat face one voxel inside the image.
"""
from __future__ import annotations

from dataclasses import dataclass

import numpy as np
from scipy import ndimage
from skimage.filters import threshold_otsu

# Skin and fat are darker than brain, so the head/air cut sits at this share of Otsu's threshold.
OTSU_SHARE = 0.5
CLOSING_ITERATIONS = 3
CLOSING_PAD_VOXELS = 6
FACE_NAMES = (("left", "right"), ("back", "front"), ("bottom", "top"))


@dataclass(frozen=True)
class HeadMask:
    mask: np.ndarray
    threshold: float
    # Faces of the image the head runs into, such as "bottom": the head is cut flat there.
    cut_faces: tuple[str, ...]


def _largest_piece(mask: np.ndarray) -> np.ndarray:
    labelled, count = ndimage.label(mask)
    if count == 0:
        raise ValueError("the T1 image has no voxel above the head threshold; check the template file")
    sizes = ndimage.sum_labels(mask, labelled, index=np.arange(1, count + 1))
    return labelled == 1 + int(np.argmax(sizes))


def _fill(mask: np.ndarray) -> np.ndarray:
    """Close gaps (sinuses, ear canals) and fill the inside, slice by slice and then as a whole."""
    pad = CLOSING_PAD_VOXELS
    closed = ndimage.binary_closing(np.pad(mask, pad), iterations=CLOSING_ITERATIONS)[pad:-pad, pad:-pad, pad:-pad]
    by_slice = np.stack([ndimage.binary_fill_holes(closed[:, :, k]) for k in range(closed.shape[2])], axis=2)
    return ndimage.binary_fill_holes(by_slice)


def _clear_cut_faces(mask: np.ndarray) -> tuple[str, ...]:
    """Empty the outermost voxel layer wherever the head reaches it, so a mesh of the mask stays inside the image."""
    cut: list[str] = []
    for axis, (low_name, high_name) in enumerate(FACE_NAMES):
        for index, name in ((0, low_name), (-1, high_name)):
            layer = [slice(None)] * 3
            layer[axis] = index
            if mask[tuple(layer)].any():
                cut.append(name)
                mask[tuple(layer)] = False
    return tuple(cut)


def head_mask(t1: np.ndarray) -> HeadMask:
    """`t1` is the template image in RAS orientation (first axis left to right, second back to front, third bottom to top)."""
    threshold = float(threshold_otsu(t1)) * OTSU_SHARE
    mask = _fill(_largest_piece(t1 > threshold))
    cut_faces = _clear_cut_faces(mask)
    return HeadMask(mask, round(threshold, 4), cut_faces)
