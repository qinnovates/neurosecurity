"""Turn each source's volume into a list of structures ready to mesh, one per label and side.

Every structure carries a cropped field (a probability map, or a binary mask) with the affine that
places the crop in the declared space, plus the ids the mesh node will carry.
"""
from __future__ import annotations

import csv
import pathlib
from collections.abc import Iterator
from dataclasses import dataclass
from typing import Any

import numpy as np
from scipy import ndimage

from .errors import RegistryError
from .headers import load_canonical
from .volumes import crop_affine, resample_like, side_selectors, voxel_volume_mm3

PROBABILITY_LEVELS = (0.25, 0.5, 0.75)
CROP_PAD_VOXELS = 2
SIDES = ("left", "right")


@dataclass(frozen=True)
class Structure:
    atlas: str
    label_id: str
    name: str
    hemisphere: str
    field: np.ndarray
    affine: np.ndarray
    from_mask: bool
    threshold: float
    max_probability: float
    volume_mm3_at: dict[str, float]


@dataclass(frozen=True)
class LabelName:
    label_id: str
    name: str
    hemisphere: str


def _crop(field: np.ndarray, affine: np.ndarray, support: np.ndarray) -> tuple[np.ndarray, np.ndarray] | None:
    if not support.any():
        return None
    box = ndimage.find_objects(support.astype(np.int8))[0]
    padded = tuple(slice(max(s.start - CROP_PAD_VOXELS, 0), min(s.stop + CROP_PAD_VOXELS, n)) for s, n in zip(box, field.shape))
    return field[padded], crop_affine(affine, np.array([s.start for s in padded]))


def _mask_structure(atlas: str, label: LabelName, hemisphere: str, mask: np.ndarray, affine: np.ndarray) -> Structure | None:
    cropped = _crop(mask, affine, mask)
    if cropped is None:
        return None
    volume = round(float(mask.sum()) * voxel_volume_mm3(affine), 2)
    return Structure(atlas, label.label_id, label.name, hemisphere, cropped[0], cropped[1], True, 0.5, 1.0,
                     {str(level): volume for level in PROBABILITY_LEVELS})


def template_mask_structure(atlas: str, mask_path: pathlib.Path, label: dict[str, str]) -> Iterator[Structure]:
    data, affine = load_canonical(mask_path)
    structure = _mask_structure(atlas, LabelName(label["id"], label["name"], "both"), "both", data > 0.5, affine)
    if structure is not None:
        yield structure


def upsample_field(field: np.ndarray, affine: np.ndarray, factor: int) -> tuple[np.ndarray, np.ndarray]:
    """Linear resample of a cropped field onto a grid `factor` times finer covering the same extent."""
    if factor == 1:
        return field, affine
    fine = affine.copy()
    fine[:3, :3] = affine[:3, :3] / factor
    fine[:3, 3] = affine[:3, 3] - np.diag(affine[:3, :3]) * (1.0 - 1.0 / factor) / 2.0
    shape = tuple(n * factor for n in field.shape)
    return resample_like(field, affine, shape, fine, 1).astype(np.float32), fine


def probability_structures(atlas: str, volume_path: pathlib.Path, labels: list[dict[str, str]], threshold: float,
                           upsample: int = 1) -> Iterator[Structure]:
    """Bilateral probability maps (one 4D volume): each map is split into sides at world x = 0."""
    data, affine = load_canonical(volume_path)
    sides = side_selectors(data.shape[:3], affine)
    voxel_volume = voxel_volume_mm3(affine)
    for label in labels:
        probability = data[..., int(label["id"])]
        for hemisphere in SIDES:
            on_side = np.where(sides[hemisphere], probability, 0.0).astype(np.float32)
            cropped = _crop(on_side, affine, on_side >= min(PROBABILITY_LEVELS))
            if cropped is None:
                continue
            volumes = {str(level): round(float((on_side >= level).sum()) * voxel_volume, 2) for level in PROBABILITY_LEVELS}
            field, field_affine = upsample_field(cropped[0], cropped[1], upsample)
            yield Structure(atlas, label["id"], label["name"], hemisphere, field, field_affine, False, threshold,
                            round(float(on_side.max()), 4), volumes)


def read_neudorfer_names(csv_path: pathlib.Path) -> dict[int, LabelName]:
    """The publisher's table: Label, Name, Hemisphere, Abbreviation."""
    names: dict[int, LabelName] = {}
    with csv_path.open(newline="", encoding="utf-8-sig") as handle:
        for row in csv.DictReader(handle):
            hemisphere = row["Hemisphere"].strip().lower()
            if hemisphere not in SIDES:
                raise RegistryError(f"{csv_path.name}: label {row['Label']} has hemisphere {row['Hemisphere']!r}; expected left or right")
            names[int(row["Label"])] = LabelName(str(int(row["Label"])), row["Name"].strip(), hemisphere)
    return names


def lateralised_structures(atlas: str, volume_path: pathlib.Path, names: dict[int, LabelName], label_ids: list[int]) -> Iterator[Structure]:
    """A discrete volume whose label ids already say which side they are on."""
    data, affine = load_canonical(volume_path)
    labels = np.rint(data).astype(np.int32)
    for label_id in label_ids:
        structure = _mask_structure(atlas, names[label_id], names[label_id].hemisphere, labels == label_id, affine)
        if structure is not None:
            yield structure


def read_allen_table(csv_path: pathlib.Path) -> list[dict[str, str]]:
    """Annotated rows of voxel_count.csv: the structure table in the CC BY download directory."""
    with csv_path.open(newline="", encoding="utf-8") as handle:
        return [row for row in csv.DictReader(handle) if row["annotated"] == "True"]


def select_allen_rows(rows: list[dict[str, str]], all_rows_path: pathlib.Path, select: dict[str, Any]) -> list[dict[str, str]]:
    wanted = set(select.get("acronyms", []))
    chosen = [row for row in rows if row["acronym"] in wanted]
    missing = wanted - {row["acronym"] for row in chosen}
    if missing:
        raise RegistryError(f"Allen acronyms {sorted(missing)} are not annotated structures in voxel_count.csv; fix the build plan")
    parent_acronym = select.get("descendants_of_acronym")
    if parent_acronym:
        with all_rows_path.open(newline="", encoding="utf-8") as handle:
            parent_ids = [row["id"] for row in csv.DictReader(handle) if row["acronym"] == parent_acronym]
        if len(parent_ids) != 1:
            raise RegistryError(f"Allen acronym {parent_acronym!r} does not name exactly one structure; fix the build plan")
        chosen += [row for row in rows if f"/{parent_ids[0]}/" in row["structure_id_path"] and row not in chosen]
    return sorted(chosen, key=lambda row: int(row["id"]))


def compact_allen_ids(annotation: np.ndarray) -> tuple[np.ndarray, np.ndarray]:
    """Allen ids reach 266441657, which a 32-bit float cannot hold exactly. Remap to 1..N before any resampling."""
    ids = np.unique(annotation)
    ids = ids[ids != 0]
    if len(ids) > 254:
        raise RegistryError("more than 254 annotated ids; the compact id volume would overflow uint8")
    compact = (np.searchsorted(ids, annotation) + 1).astype(np.uint8)
    compact[annotation == 0] = 0
    return compact, ids


def mirrored_structures(atlas: str, compact: np.ndarray, affine: np.ndarray, ids: np.ndarray, rows: list[dict[str, str]]) -> Iterator[Structure]:
    """A compact-id volume on the declared grid holding a drawn hemisphere and its mirror; split at x = 0."""
    sides = side_selectors(compact.shape, affine)
    compact_of = {int(allen_id): index + 1 for index, allen_id in enumerate(ids)}
    for hemisphere in SIDES:
        on_side = np.where(sides[hemisphere], compact, 0)
        boxes = ndimage.find_objects(on_side, max_label=len(ids))
        for row in rows:
            compact_id = compact_of[int(row["id"])]
            box = boxes[compact_id - 1]
            if box is None:
                continue
            padded = tuple(slice(max(s.start - CROP_PAD_VOXELS, 0), min(s.stop + CROP_PAD_VOXELS, n)) for s, n in zip(box, compact.shape))
            mask = on_side[padded] == compact_id
            volume = round(float(mask.sum()) * voxel_volume_mm3(affine), 2)
            yield Structure(atlas, row["id"], row["name"], hemisphere, mask, crop_affine(affine, np.array([s.start for s in padded])),
                            True, 0.5, 1.0, {str(level): volume for level in PROBABILITY_LEVELS})
