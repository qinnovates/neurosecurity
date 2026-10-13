"""Device stage: the four landmarks and the 10-20 layout on the template head, checked against the shipped mesh.

Writes the placement record (what each rule measured) and the fiducial and electrode rows of the
device geometry data file. Lead rows and sourced facts in that file are written by hand and kept.
"""
from __future__ import annotations

import json
import pathlib
from typing import Any

import numpy as np

from . import arc_checks, fiducials as fiducial_rules, glb_triangles, head_surface, layout_checks, scalp_arcs
from .electrodes import place_layout
from .errors import CheckError
from .fetch import source_file
from .fiducials import BACK, Head, find_fiducials
from .head_surface import head_mask
from .headers import load_canonical
from .layout_1020 import ARCS, ELECTRODE_ORDER, FIDUCIAL_IDS, LAYOUT_ID, OLDER_NAMES
from .placement_digest import placement_digest
from .scalp_arcs import Scalp, surface_points
from .sources import Registry

SCALP_MESH_KEY = "head_surface:both"
FIDUCIAL_SET_ID = "template_rules_1"
INION_SHIFT_MM = 5.0
SET_METHOD = ("Placed by written rules on the average template head, by code and not by a person feeling a skull. "
              "The average blurs skin landmarks and the skin does not show the inion, so these are estimates for a person to review.")
LAYOUT_NAME = "International 10-20 system: 19 scalp positions, Fpz and Oz"
LAYOUT_CONSTRUCTION = "Each position sits at a share of the measured length of an arc over the scalp between landmarks, in the order the system defines."
PARAMETER_MODULES = {"head_surface": head_surface, "fiducials": fiducial_rules, "scalp_arcs": scalp_arcs}
# What each landmark's rule can and cannot be trusted for, in plain words. Figures are filled from the run.
CONFIDENCE_NOTES = {
    "nasion": ("Moderate. The hollow between brow and nose is {hollow_depth_mm} mm deep on this head, so the rule has something to find. "
               "It is the hollow in the skin, not the bone suture the definition names."),
    "inion": ("Weak. The skin does not show the inion. This is where the tissue over the skull thickens in the average image, which is near "
              "where the neck muscles attach but is not the bone bump itself. Putting it {inion_shift_mm} mm higher or lower moves the nearest "
              "electrode by up to {inion_effect_mm} mm."),
    "left_preauricular": ("Weak. The rule finds a hollow {hollow_depth_mm} mm deep in front of the ear's ridge. That may be the notch beside the "
                          "outer ear and not the point in front of the tragus that the definition names. The average image blurs the ear."),
}
CONFIDENCE_NOTES["right_preauricular"] = CONFIDENCE_NOTES["left_preauricular"]
HEAD_QUOTE = "It is the skin of an average head, not of a person."


def _evidence(scalp_asset_id: str, rationale: str) -> dict[str, Any]:
    """The evidence block of a placement row: it rests on the shipped head surface, whose note it quotes, and on nothing measured in a person."""
    return {"claim_basis": "analyst_inference", "check_status": "unchecked", "rationale": rationale,
            "source_ref": {"file": "src/site/atlas-assets/manifest.json", "pointer": f"/assets/{scalp_asset_id}/modification_note", "quote": HEAD_QUOTE}}


ARC_OF = {name: arc_id for arc_id, _, _, _, shares in ARCS for name in shares}
SHARE_OF = {name: share for _, _, _, _, shares in ARCS for name, share in shares.items()}


def method_parameters() -> dict[str, Any]:
    """Every tunable number of the head mask, the landmark rules and the arc tracing, by module and name."""
    return {module_name: {name: value for name, value in sorted(vars(module).items()) if name.isupper() and isinstance(value, (int, float, tuple))}
            for module_name, module in PARAMETER_MODULES.items()}


def confidence_note(name: str, document: dict[str, Any]) -> str:
    sensitivity = document["inion_sensitivity"]
    return CONFIDENCE_NOTES[name].format(hollow_depth_mm=document["fiducials"][name].get("hollow_depth_mm"), inion_shift_mm=sensitivity["inion_shift_mm"],
                                         inion_effect_mm=max(sensitivity["higher"], sensitivity["lower"]))


def _rounded(point: Any) -> list[float]:
    return [round(float(value), 1) for value in point]


def load_head(cache_dir: pathlib.Path, registry: Registry) -> tuple[Head, tuple[str, ...]]:
    template = registry.inputs["template"]
    t1, affine = load_canonical(source_file(cache_dir, template["source"], template["t1"]))
    found = head_mask(t1)
    return Head(Scalp.from_mask(found.mask, affine), t1, found.mask), found.cut_faces


def _equal_angle_offsets(triangles: list[arc_checks.Triangle], fiducials: dict[str, arc_checks.Vec], electrodes: dict[str, arc_checks.Vec]) -> dict[str, float]:
    """How far each position would move if it were set at equal angles about each arc's centre, which is what projecting a sphere layout outward does on its great arcs."""
    points = dict(fiducials)
    for _, start, end, through, shares in ARCS:
        toward = layout_checks.top_of_midline(points) if through == "top" else points[through]
        polyline = arc_checks.section_polyline(triangles, points[start], points[end], toward)
        for name, share in shares.items():
            points[name] = arc_checks.point_at_angle_share(polyline, share)
    return {name: round(arc_checks.distance(points[name], electrodes[name]), 1) for name in ELECTRODE_ORDER}


def _inion_sensitivity(head: Head, fiducials: dict[str, np.ndarray], electrodes: dict[str, np.ndarray]) -> dict[str, Any]:
    """The largest move of any position when the inion is put 5 mm higher or lower on the back midline."""
    moved: dict[str, float] = {}
    for label, shift in (("higher", INION_SHIFT_MM), ("lower", -INION_SHIFT_MM)):
        origin = np.array([0.0, head.depth_centre(), fiducials["inion"][2] + shift])
        shifted = {**fiducials, "inion": surface_points(head.scalp, origin, BACK[None, :])[0]}
        placed, _ = place_layout(head.scalp, shifted)
        worst = max(ELECTRODE_ORDER, key=lambda name: float(np.linalg.norm(placed[name] - electrodes[name])))
        moved[label] = round(float(np.linalg.norm(placed[worst] - electrodes[worst])), 1)
        moved[f"{label}_most_moved"] = worst
    return {"inion_shift_mm": INION_SHIFT_MM, **moved}


def placement_document(cache_dir: pathlib.Path, registry: Registry, scalp_glb: bytes, scalp_sha256: str) -> dict[str, Any]:
    """Everything the device stage measured. Raises when the layout does not pass its checks on the shipped mesh."""
    head, cut_faces = load_head(cache_dir, registry)
    found = find_fiducials(head)
    fiducials = {name: np.array(found[name]["position_mm"]) for name in FIDUCIAL_IDS}
    placed, arcs = place_layout(head.scalp, fiducials)
    triangles = glb_triangles.read_glb_triangles(scalp_glb)[SCALP_MESH_KEY]
    fiducial_points = {name: tuple(_rounded(point)) for name, point in fiducials.items()}
    electrode_points = {name: tuple(_rounded(point)) for name, point in placed.items()}
    problems = layout_checks.layout_problems(triangles, fiducial_points, electrode_points)
    if problems:
        raise CheckError("the electrode layout fails its checks on the shipped head mesh: " + "; ".join(problems[:5]))
    measured = layout_checks.measure_arcs(triangles, {**fiducial_points, **electrode_points})
    return {
        "note": "Generated by the atlas pipeline's devices command. Positions are placements on an average head, not measurements of a person.",
        "space": registry.declared_space, "head": {"cut_faces": list(cut_faces)},
        "scalp_asset_sha256": scalp_sha256, "method_parameters": json.loads(json.dumps(method_parameters())),
        "fiducials": found, "electrodes": {name: list(point) for name, point in electrode_points.items()}, "arcs": arcs,
        "on_shipped_mesh": {
            "arcs": [{"id": row["id"], "length_mm": round(row["length_mm"], 1), "shares": {name: round(share, 4) for name, share in row["shares"].items()},
                      **({"crossing": {"electrode": row["crossing"]["electrode"], "share": round(row["crossing"]["share"], 4)}} if "crossing" in row else {})}
                     for row in measured],
            "mirror_tolerance_mm": round(layout_checks.mirror_tolerance_mm(measured, {**fiducial_points, **electrode_points}), 1),
            "distance_to_surface_mm": {name: round(arc_checks.distance_to_surface(triangles, point), 2) for name, point in {**fiducial_points, **electrode_points}.items()},
        },
        "equal_angle_construction_offset_mm": _equal_angle_offsets(triangles, fiducial_points, electrode_points),
        "inion_sensitivity": _inion_sensitivity(head, fiducials, placed),
    }


def geometry_rows(document: dict[str, Any], scalp_asset_id: str) -> dict[str, Any]:
    """The fiducial and electrode sections of the device geometry data file, from a placement record."""
    electrodes = []
    for name in ELECTRODE_ORDER:
        row: dict[str, Any] = {"id": name, "position_mm": document["electrodes"][name], "arc": ARC_OF[name], "share": SHARE_OF[name]}
        if name in OLDER_NAMES:
            row["also_called"] = OLDER_NAMES[name]
        electrodes.append(row)
    fiducials = [{"id": name, "position_mm": document["fiducials"][name]["position_mm"], "method": document["fiducials"][name]["rule"],
                  "confidence_note": confidence_note(name, document)} for name in FIDUCIAL_IDS]
    digest = placement_digest(document["scalp_asset_sha256"], document["method_parameters"], fiducials, electrodes)
    return {
        "fiducial_space": document["space"],
        "fiducial_set": {"id": FIDUCIAL_SET_ID, "scalp_asset_id": scalp_asset_id, "scalp_asset_sha256": document["scalp_asset_sha256"],
                         "placement_digest": digest, "method": SET_METHOD, "drafted_by": "ai",
                         "evidence": _evidence(scalp_asset_id, "Landmarks were found by rule on the template head surface; no person located them.")},
        "fiducials": fiducials,
        "electrode_layouts": [{"id": LAYOUT_ID, "name": LAYOUT_NAME, "scalp_asset_id": scalp_asset_id, "fiducial_set_id": FIDUCIAL_SET_ID,
                               "construction": LAYOUT_CONSTRUCTION, "shown_by_default": True, "electrodes": electrodes, "drafted_by": "ai",
                               "evidence": _evidence(scalp_asset_id, "Positions are shares of arcs measured on the template head surface, not on a person.")}],
    }


def merge_into_geometry_file(path: pathlib.Path, rows: dict[str, Any]) -> None:
    """Replace the generated sections of the data file and keep the hand-written ones (leads, facts) as they are."""
    current = json.loads(path.read_text(encoding="utf-8"))
    order = ("schema_version", "status", "fiducial_space", "fiducial_set", "fiducials", "electrode_layouts", "leads", "facts")
    merged = {**current, **rows}
    path.write_text(json.dumps({key: merged[key] for key in order if key in merged}, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
