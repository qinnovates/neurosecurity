"""Build stage: for every asset in the plan, structures -> size class -> mesh or marker -> GLB bytes."""
from __future__ import annotations

import pathlib
from collections.abc import Iterator
from dataclasses import dataclass, field
from typing import Any

import nibabel as nib
import numpy as np
from scipy import ndimage

from . import registration, structures
from .errors import CheckError
from .fetch import sha256_of, source_file
from .glb import GlbNode, write_glb
from .headers import header_facts, load_canonical
from .meshing import Mesh, mesh_from_field, mesh_sanity
from .sources import Registry
from .volumes import UNRESOLVED_MAX_VOXELS, mask_facts, size_class

MESHLESS_CLASSES = frozenset({"unresolved", "not_drawn"})


@dataclass
class BuiltAsset:
    plan: dict[str, Any]
    glb: bytes
    nodes: list[dict[str, Any]]
    labels: list[structures.LabelName]
    report: list[dict[str, Any]]
    header_records: list[dict[str, Any]]
    meshes: dict[str, Mesh] = field(default_factory=dict)
    masks: dict[str, tuple[np.ndarray, np.ndarray]] = field(default_factory=dict)


@dataclass
class TemplateBox:
    low: np.ndarray
    high: np.ndarray


def template_box(cache_dir: pathlib.Path, registry: Registry) -> TemplateBox:
    template = registry.inputs["template"]
    image = nib.load(str(source_file(cache_dir, template["source"], template["mask"])))
    corners = np.array([[-0.5, -0.5, -0.5], np.array(image.shape[:3]) - 0.5]) @ image.affine[:3, :3].T + image.affine[:3, 3]
    return TemplateBox(corners.min(axis=0), corners.max(axis=0))


def warped_allen_volume(cache_dir: pathlib.Path, registry: Registry, plan: dict[str, Any]) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
    """The Allen annotation as compact ids on the declared 0.5 mm grid, through the archived transform."""
    transform_row = {"id": plan["transform"], **registry.inputs["transforms"][plan["transform"]]}
    forward = registration.verify_archive(cache_dir, transform_row)
    annotation_path = source_file(cache_dir, plan["source"], plan["file"])
    work = cache_dir / "work"
    work.mkdir(parents=True, exist_ok=True)
    key = (sha256_of(annotation_path)[:12] + "-" + "-".join(row["sha256"][:12] for row in transform_row["archive"]))
    annotation, affine = load_canonical(annotation_path, dtype=np.int64)
    compact, ids = structures.compact_allen_ids(annotation)
    warped_path = work / f"allen-declared-{key}.nii.gz"
    if not warped_path.is_file():
        template = registry.inputs["template"]
        template_image = nib.load(str(source_file(cache_dir, template["source"], template["t1"])))
        shape, grid_affine = registration.declared_grid(template_image.shape, template_image.affine)
        compact_path, reference_path = work / f"allen-compact-{key}.nii.gz", work / "declared-grid.nii.gz"
        registration.write_volume(compact_path, compact, affine)
        registration.write_volume(reference_path, np.zeros(shape, dtype=np.uint8), grid_affine)
        registration.apply_to_volume(compact_path, reference_path, forward, "nearestNeighbor", warped_path)
    warped, warped_affine = load_canonical(warped_path)
    return np.rint(warped).astype(np.uint8), warped_affine, ids


def structures_for(cache_dir: pathlib.Path, registry: Registry, plan: dict[str, Any],
                   allen_cache: dict[str, Any]) -> tuple[Iterator[structures.Structure], list[structures.LabelName]]:
    """The structures of one planned asset and the label names its table will list."""
    source_id, kind = plan["source"], plan["kind"]
    if kind == "template_mask":
        label = plan["label"]
        path = source_file(cache_dir, source_id, registry.inputs["template"]["mask"])
        return structures.template_mask_structure(source_id, path, label), [structures.LabelName(label["id"], label["name"], "both")]
    if kind == "probability_maps":
        names = [structures.LabelName(row["id"], row["name"], "both") for row in plan["labels"]]
        return structures.probability_structures(source_id, source_file(cache_dir, source_id, plan["file"]), plan["labels"], plan["threshold"], int(plan.get("mesh_upsample", 1))), names
    if kind == "discrete_lateralised":
        table = structures.read_neudorfer_names(source_file(cache_dir, source_id, plan["names_file"]))
        return (structures.lateralised_structures(source_id, source_file(cache_dir, source_id, plan["file"]), table, plan["label_ids"]),
                [table[label_id] for label_id in plan["label_ids"]])
    if kind == "discrete_mirrored":
        if "volume" not in allen_cache:
            allen_cache["volume"] = warped_allen_volume(cache_dir, registry, plan)
        compact, affine, ids = allen_cache["volume"]
        csv_path = source_file(cache_dir, source_id, plan["names_file"])
        rows = structures.select_allen_rows(structures.read_allen_table(csv_path), csv_path, plan["select"])
        return structures.mirrored_structures(source_id, compact, affine, ids, rows), [structures.LabelName(row["id"], row["name"], "both") for row in rows]
    raise CheckError(f"asset {plan['id']}: unknown kind {kind!r} in the build plan; fix pipeline-inputs.json")


def _size_rule_scale(structure: structures.Structure, size_rule_voxel_mm: float | None) -> float:
    """Ratio of the mesh grid's voxel to the voxel the size rule counts in (the coarser of grid and acquisition)."""
    grid = float(abs(structure.affine[0, 0]))
    return grid / max(grid, size_rule_voxel_mm or 0.0)


def drop_fragments(field: np.ndarray, threshold: float, scale: float) -> tuple[np.ndarray, int]:
    """Remove connected pieces that would be 'unresolved' on their own, keeping the largest piece always.

    A label volume often carries specks beside the main body. They are below what the size rule calls
    drawable, and smoothing erases them anyway, which would move the mesh centroid off the mask's.
    Returns the cleaned field and how many grid voxels were dropped.
    """
    mask = field >= threshold
    labelled, count = ndimage.label(mask)
    if count <= 1:
        return field, 0
    sizes = ndimage.sum_labels(mask, labelled, index=np.arange(1, count + 1))
    keep = sizes * scale ** 3 >= UNRESOLVED_MAX_VOXELS
    keep[int(np.argmax(sizes))] = True
    kept_mask = np.concatenate([[False], keep])[labelled]
    return np.where(kept_mask | ~mask, field, 0).astype(field.dtype), int(sizes[~keep].sum())


def build_node(structure: structures.Structure, size_rule_voxel_mm: float | None, box: TemplateBox) -> tuple[dict[str, Any], dict[str, Any], Mesh | None]:
    """One manifest node, its report row, and its mesh (None for a structure too small to outline)."""
    scale = _size_rule_scale(structure, size_rule_voxel_mm)
    field, dropped_voxels = drop_fragments(structure.field, structure.threshold, scale)
    mask = field >= structure.threshold
    facts = mask_facts(mask, structure.affine)
    extras = {"atlas": structure.atlas, "label_id": structure.label_id, "hemisphere": structure.hemisphere}
    if facts["voxels"] == 0:
        node = {"extras": extras, "threshold": structure.threshold, "max_probability": structure.max_probability,
                "volume_mm3_at": structure.volume_mm3_at, "voxels": 0, "shortest_extent_voxels": 0.0, "size_class": "not_drawn",
                "centroid_mm": [0.0, 0.0, 0.0], "bbox_mm": [[0.0, 0.0, 0.0], [0.0, 0.0, 0.0]], "vertex_count": 0, "mesh_to_mask_mm": {"mean": 0.0, "max": 0.0}}
        return node, {**extras, "name": structure.name, "size_class": "not_drawn", "reason": "probability never reaches the threshold on this side"}, None
    rule_voxels = int(round(facts["largest_piece_voxels"] * scale ** 3))
    rule_extent = round(facts["shortest_extent_voxels"] * scale, 2)
    klass = size_class(rule_voxels, rule_extent)
    node = {"extras": extras, "threshold": structure.threshold, "max_probability": structure.max_probability,
            "volume_mm3_at": structure.volume_mm3_at, "voxels": rule_voxels, "shortest_extent_voxels": rule_extent, "size_class": klass,
            "centroid_mm": facts["centroid_mm"], "bbox_mm": facts["bbox_mm"], "vertex_count": 0, "mesh_to_mask_mm": {"mean": 0.0, "max": 0.0}}
    report = {**extras, "name": structure.name, "size_class": klass, "grid_voxels": facts["voxels"], "grid_voxel_mm": round(float(abs(structure.affine[0, 0])), 3),
              "size_rule_voxel_mm": round(float(abs(structure.affine[0, 0])) / scale, 3), "connected_pieces": facts["connected_pieces"],
              "volume_mm3": facts["volume_mm3"], "dropped_fragment_voxels": dropped_voxels}
    if klass in MESHLESS_CLASSES:
        report["marker"] = {"centroid_mm": facts["centroid_mm"], "nominal_radius_mm": round((3.0 * facts["volume_mm3"] / (4.0 * np.pi)) ** (1.0 / 3.0), 2)}
        return node, report, None
    mesh = mesh_from_field(field.astype(np.float32), structure.affine, structure.from_mask, size_rule_voxel_mm)
    problems = mesh_sanity(mesh, box.low, box.high)
    node["vertex_count"] = mesh.facts["vertex_count"]
    node["mesh_to_mask_mm"] = {"mean": mesh.facts["mesh_to_mask_mm"]["mean"], "max": mesh.facts["mesh_to_mask_mm"]["max"]}
    report.update(mesh.facts)
    report["sanity_problems"] = problems
    return node, report, mesh


def build_asset(cache_dir: pathlib.Path, registry: Registry, plan: dict[str, Any], box: TemplateBox, allen_cache: dict[str, Any]) -> BuiltAsset:
    source = registry.sources[plan["source"]]
    verdict = registry.verdicts[plan["source"]]
    found, labels = structures_for(cache_dir, registry, plan, allen_cache)
    nodes, report, glb_nodes, meshes, masks = [], [], [], {}, {}
    for structure in found:
        node, row, mesh = build_node(structure, plan.get("size_rule_voxel_mm"), box)
        nodes.append(node)
        report.append(row)
        if mesh is not None:
            key = f"{structure.label_id}:{structure.hemisphere}"
            meshes[key] = mesh
            if plan["layer"] == "deep":
                masks[key] = (structure.field >= structure.threshold, structure.affine)
            glb_nodes.append(GlbNode(f"{structure.atlas}:{structure.label_id}:{structure.hemisphere}", node["extras"], mesh.vertices_mm, mesh.triangles))
    failing = [row for row in report if row.get("sanity_problems")]
    if failing:
        listed = "; ".join(f"{row['label_id']} {row['hemisphere']}: {', '.join(row['sanity_problems'])}" for row in failing[:5])
        raise CheckError(f"asset {plan['id']}: {len(failing)} mesh(es) failed the sanity check K9 ({listed}); inspect the label volume before shipping")
    copyright_text = (source.get("attribution_text") or source["name"])[:600]
    extras = {"source_id": plan["source"], "license_id": verdict.get("treat_as") or source["license_id"], "template_space": registry.declared_space,
              "units": "mm", "axes": "RAS"}
    used_files = [plan[key] for key in ("file", "names_file") if key in plan] or [registry.inputs["template"]["mask"]]
    headers = [header_facts(source_file(cache_dir, plan["source"], name)) for name in used_files if name.endswith((".nii", ".nii.gz"))]
    return BuiltAsset(plan, write_glb(glb_nodes, copyright_text, extras), nodes, labels, report, headers, meshes, masks)
