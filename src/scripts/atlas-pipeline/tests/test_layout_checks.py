"""The electrode layout checker, and the committed layout against the shipped head mesh. Standard library only.

These run in the pull-request workflow. The checker measures arcs on the mesh with code that shares
nothing with the placement, so a layout built another way, or edited by hand, does not pass.
"""
import copy
import json
import math

import pytest
from solids import ellipsoid_mesh, landmarks

from atlas_pipeline import arc_checks, glb_triangles, layout_checks, sources
from atlas_pipeline.layout_1020 import ARCS, ELECTRODE_ORDER, FIDUCIAL_IDS, MIRROR_PAIRS
from atlas_pipeline.placement_digest import placement_digest

ASSET_DIR = sources.REPO_ROOT / "src" / "site" / "atlas-assets"
MANIFEST = json.loads((ASSET_DIR / "manifest.json").read_text(encoding="utf-8"))
GEOMETRY = json.loads((sources.REPO_ROOT / "datalake" / "qif-anatomy-device-geometry.json").read_text(encoding="utf-8"))
PLACEMENT = json.loads((sources.PIPELINE_DIR / "evidence" / "device-placement.json").read_text(encoding="utf-8"))
SCALP = next(asset for asset in MANIFEST["assets"] if asset["layer"] == "devices")
HEAD = glb_triangles.read_glb_triangles((ASSET_DIR / SCALP["path"]).read_bytes())["head_surface:both"]
LAYOUT = GEOMETRY["electrode_layouts"][0]
FIDUCIALS = {row["id"]: tuple(row["position_mm"]) for row in GEOMETRY["fiducials"]}
ELECTRODES = {row["id"]: tuple(row["position_mm"]) for row in LAYOUT["electrodes"]}
LONG_HEAD = (75.0, 100.0, 90.0)


def placed_by(triangles: list, fiducials: dict, point_on_arc) -> dict:
    """A full layout on a mesh, each position chosen on its arc by `point_on_arc(polyline, share)`."""
    points = dict(fiducials)
    for _, start, end, through, shares in ARCS:
        toward = layout_checks.top_of_midline(points) if through == "top" else points[through]
        polyline = arc_checks.section_polyline(triangles, points[start], points[end], toward)
        for name, share in shares.items():
            points[name] = point_on_arc(polyline, share)
    return {name: points[name] for name in ELECTRODE_ORDER}


def at_length_share(polyline: list, share: float) -> tuple:
    lengths = [0.0]
    for first, second in zip(polyline, polyline[1:]):
        lengths.append(lengths[-1] + math.dist(first, second))
    target = share * lengths[-1]
    index = max(i for i, length in enumerate(lengths[:-1]) if length <= target)
    along = (target - lengths[index]) / max(lengths[index + 1] - lengths[index], 1e-12)
    return arc_checks.add_scaled(polyline[index], arc_checks.sub(polyline[index + 1], polyline[index]), along)


def test_committed_layout_passes_on_the_shipped_head_mesh() -> None:
    assert layout_checks.layout_problems(HEAD, FIDUCIALS, ELECTRODES) == []
    assert len(ELECTRODES) == 21 and len(HEAD) > 1000


def test_cz_is_at_the_middle_of_both_arcs_and_every_position_at_its_share() -> None:
    measured = {row["id"]: row for row in layout_checks.measure_arcs(HEAD, {**FIDUCIALS, **ELECTRODES})}
    assert abs(measured["midline"]["shares"]["Cz"] - 0.5) <= layout_checks.SHARE_TOLERANCE
    assert abs(measured["ear_to_ear"]["crossing"]["share"] - 0.5) <= layout_checks.SHARE_TOLERANCE
    wanted = {arc_id: shares for arc_id, _, _, _, shares in ARCS}
    worst = max(abs(share - wanted[arc_id][name]) for arc_id, row in measured.items() for name, share in row["shares"].items())
    assert worst <= layout_checks.SHARE_TOLERANCE
    assert sum(len(row["shares"]) for row in measured.values()) == 21


def cz_crossing_problems(triangles: list, fiducials: dict, electrodes: dict) -> list:
    return [problem for problem in layout_checks.layout_problems(triangles, fiducials, electrodes) if "ear_to_ear arc; it should be at its middle" in problem]


def test_arcs_that_cross_at_cz_pass_the_crossing_rule_within_its_tolerance() -> None:
    head, marks = ellipsoid_mesh(LONG_HEAD), landmarks(LONG_HEAD)
    good = placed_by(head, marks, at_length_share)
    assert cz_crossing_problems(head, marks, good) == []
    ear_arc = arc_checks.section_polyline(head, marks["left_preauricular"], marks["right_preauricular"], good["Cz"])
    inside = {**good, "Cz": at_length_share(ear_arc, 0.5 + 0.5 * layout_checks.SHARE_TOLERANCE)}
    assert cz_crossing_problems(head, marks, inside) == []


def test_arcs_that_do_not_cross_at_cz_are_refused() -> None:
    head, marks = ellipsoid_mesh(LONG_HEAD), landmarks(LONG_HEAD)
    good = placed_by(head, marks, at_length_share)
    ear_arc = arc_checks.section_polyline(head, marks["left_preauricular"], marks["right_preauricular"], good["Cz"])
    off_share = 0.5 + 3.0 * layout_checks.SHARE_TOLERANCE
    crossed_elsewhere = {**good, "Cz": at_length_share(ear_arc, off_share)}
    assert cz_crossing_problems(head, marks, crossed_elsewhere) == [f"Cz sits at {off_share:.3f} of the ear_to_ear arc; it should be at its middle"]


def test_equal_angle_layout_on_the_shipped_head_is_refused() -> None:
    wrong = placed_by(HEAD, FIDUCIALS, arc_checks.point_at_angle_share)
    problems = layout_checks.layout_problems(HEAD, FIDUCIALS, wrong)
    assert any("the 10-20 rule puts it at" in problem for problem in problems)
    assert len([problem for problem in problems if "arc" in problem]) >= 3


def test_on_a_sphere_great_arcs_agree_and_on_a_long_head_only_arc_length_passes() -> None:
    sphere, sphere_marks = ellipsoid_mesh((90.0, 90.0, 90.0)), landmarks((90.0, 90.0, 90.0))
    on_sphere = layout_checks.layout_problems(sphere, sphere_marks, placed_by(sphere, sphere_marks, arc_checks.point_at_angle_share))
    assert not [problem for problem in on_sphere if "midline arc" in problem or "ear_to_ear arc" in problem]
    head, marks = ellipsoid_mesh(LONG_HEAD), landmarks(LONG_HEAD)
    assert layout_checks.layout_problems(head, marks, placed_by(head, marks, at_length_share)) == []
    refused = layout_checks.layout_problems(head, marks, placed_by(head, marks, arc_checks.point_at_angle_share))
    assert len([problem for problem in refused if "the 10-20 rule puts it at" in problem]) >= 4


def test_swapped_ear_landmarks_are_refused() -> None:
    swapped = {**FIDUCIALS, "left_preauricular": FIDUCIALS["right_preauricular"], "right_preauricular": FIDUCIALS["left_preauricular"]}
    problems = layout_checks.layout_problems(HEAD, swapped, ELECTRODES)
    assert any(problem.startswith("T7 sits at") for problem in problems)


def test_left_and_right_names_swapped_are_refused() -> None:
    swapped = dict(ELECTRODES)
    for left, right in MIRROR_PAIRS:
        swapped[left], swapped[right] = ELECTRODES[right], ELECTRODES[left]
    problems = layout_checks.layout_problems(HEAD, FIDUCIALS, swapped)
    assert sum("must be on the left" in problem for problem in problems) == len(MIRROR_PAIRS)


@pytest.mark.parametrize(("name", "shift", "expected"), [
    ("C3", (0.0, 9.0, 0.0), ("C3 mirrored is", "from C4")),
    ("Cz", (0.0, 0.0, 6.0), ("Cz is ", "mm from the head surface")),
    ("Pz", (5.0, 0.0, 0.0), ("Pz is ", "mm off the midline")),
])
def test_one_moved_electrode_is_refused(name: str, shift: tuple, expected: tuple) -> None:
    moved = {**ELECTRODES, name: tuple(value + step for value, step in zip(ELECTRODES[name], shift))}
    assert any(problem.startswith(expected[0]) and expected[1] in problem for problem in layout_checks.layout_problems(HEAD, FIDUCIALS, moved))


def test_a_missing_or_added_position_is_refused() -> None:
    assert "missing ['Oz']" in layout_checks.layout_problems(HEAD, FIDUCIALS, {name: point for name, point in ELECTRODES.items() if name != "Oz"})[0]
    assert "not part of it ['AF7']" in layout_checks.layout_problems(HEAD, FIDUCIALS, {**ELECTRODES, "AF7": ELECTRODES["F7"]})[0]


def test_mirror_tolerance_is_measured_from_this_head_and_small() -> None:
    measured = layout_checks.measure_arcs(HEAD, {**FIDUCIALS, **ELECTRODES})
    tolerance = layout_checks.mirror_tolerance_mm(measured, {**FIDUCIALS, **ELECTRODES})
    assert layout_checks.MIRROR_SLACK_MM < tolerance < 6.0
    assert round(tolerance, 1) == PLACEMENT["on_shipped_mesh"]["mirror_tolerance_mm"]


def test_data_file_rows_are_the_placement_record_and_name_the_shipped_head() -> None:
    assert GEOMETRY["fiducial_space"] == MANIFEST["template_space"] == PLACEMENT["space"]
    assert [row["id"] for row in GEOMETRY["fiducials"]] == list(FIDUCIAL_IDS)
    for row in GEOMETRY["fiducials"]:
        assert row["position_mm"] == PLACEMENT["fiducials"][row["id"]]["position_mm"] and row["method"] == PLACEMENT["fiducials"][row["id"]]["rule"]
    assert {name: list(point) for name, point in ELECTRODES.items()} == PLACEMENT["electrodes"]
    assert LAYOUT["scalp_asset_id"] == GEOMETRY["fiducial_set"]["scalp_asset_id"] == SCALP["id"]
    assert LAYOUT["fiducial_set_id"] == GEOMETRY["fiducial_set"]["id"]
    assert all(row["drafted_by"] == "ai" for row in (GEOMETRY["fiducial_set"], LAYOUT, *GEOMETRY["leads"], *GEOMETRY["facts"]))


def recomputed_digest(geometry: dict, scalp_sha256: str, parameters: dict) -> str:
    return placement_digest(scalp_sha256, parameters, geometry["fiducials"], geometry["electrode_layouts"][0]["electrodes"])


def test_committed_coordinates_are_the_ones_a_pipeline_run_bound_to_this_head_surface() -> None:
    record = GEOMETRY["fiducial_set"]
    assert record["scalp_asset_sha256"] == SCALP["sha256"] == PLACEMENT["scalp_asset_sha256"]
    assert recomputed_digest(GEOMETRY, SCALP["sha256"], PLACEMENT["method_parameters"]) == record["placement_digest"]
    assert len(PLACEMENT["method_parameters"]["fiducials"]) >= 10 and "ANGLE_STEPS" in PLACEMENT["method_parameters"]["scalp_arcs"]


@pytest.mark.parametrize("edit", ["landmark", "electrode", "share", "head_surface", "parameter"])
def test_any_hand_edit_breaks_the_recorded_digest(edit: str) -> None:
    geometry, parameters, scalp_sha256 = copy.deepcopy(GEOMETRY), copy.deepcopy(PLACEMENT["method_parameters"]), SCALP["sha256"]
    if edit == "landmark":
        geometry["fiducials"][1]["position_mm"][2] += 0.1
    elif edit == "electrode":
        geometry["electrode_layouts"][0]["electrodes"][10]["position_mm"][0] += 0.1
    elif edit == "share":
        geometry["electrode_layouts"][0]["electrodes"][0]["share"] = 0.11
    elif edit == "head_surface":
        scalp_sha256 = "0" * 64
    else:
        parameters["fiducials"]["THICKENING_FACTOR"] = 2.0
    assert recomputed_digest(geometry, scalp_sha256, parameters) != GEOMETRY["fiducial_set"]["placement_digest"]


def test_every_landmark_says_how_far_it_can_be_trusted_with_the_figures_the_run_measured() -> None:
    notes = {row["id"]: row["confidence_note"] for row in GEOMETRY["fiducials"]}
    assert notes["nasion"].startswith("Moderate.") and all(notes[name].startswith("Weak.") for name in FIDUCIAL_IDS[1:])
    for name in ("nasion", "left_preauricular", "right_preauricular"):
        assert f"{PLACEMENT['fiducials'][name]['hollow_depth_mm']} mm deep" in notes[name]
    worst = max(PLACEMENT["inion_sensitivity"]["higher"], PLACEMENT["inion_sensitivity"]["lower"])
    assert f"moves Oz by up to {worst} mm" in notes["inion"]
    assert {PLACEMENT["inion_sensitivity"]["higher_most_moved"], PLACEMENT["inion_sensitivity"]["lower_most_moved"]} == {"Oz"}
    assert all(len(note) <= 400 for note in notes.values()), "the data library reads a confidence note of at most 400 characters"


def test_every_weak_landmark_says_it_may_be_a_centimetre_off_and_carries_the_moves_the_run_measured() -> None:
    notes = {row["id"]: row["confidence_note"] for row in GEOMETRY["fiducials"]}
    weak_sentence = "It may be a centimetre or more off, and is more likely too low than too high."
    assert weak_sentence not in notes["nasion"] and all(weak_sentence in notes[name] for name in FIDUCIAL_IDS[1:])
    moved = PLACEMENT["landmark_sensitivity"]
    inion = moved["inion"]
    assert inion["electrode"] == "Oz" and f", and {inion['shift_mm']} mm by up to {max(inion['higher_mm'], inion['lower_mm'])} mm." in notes["inion"]
    for name, near in (("left_preauricular", "T7"), ("right_preauricular", "T8")):
        row = moved[name]
        assert row["near_electrode"] == near and len(row["near_moved_mm"]) == len(row["vertex_moved_mm"]) == len(row["directions"]) == 4
        assert (f"Moving it {row['shift_mm']} mm forward, back, up or down moves {near} by {min(row['near_moved_mm'])} to {max(row['near_moved_mm'])} mm and Cz by "
                f"{min(row['vertex_moved_mm'])} to {max(row['vertex_moved_mm'])} mm") in notes[name]


def test_the_layout_is_off_by_default_and_keeps_its_unreviewed_marks() -> None:
    assert LAYOUT["shown_by_default"] is False
    assert LAYOUT["drafted_by"] == "ai" and LAYOUT["evidence"]["check_status"] == "unchecked"
    assert "it is not tied to the placement digest" in LAYOUT["evidence"]["rationale"]


def test_head_note_names_the_faces_where_the_image_cuts_the_head() -> None:
    assert PLACEMENT["head"]["cut_faces"] == ["front", "bottom"]
    assert "cut flat at the bottom and at the front" in SCALP["modification_note"]


def test_no_row_names_a_brain_region_or_a_place_for_a_lead() -> None:
    region_ids = {row["id"] for row in json.loads((sources.REPO_ROOT / "datalake" / "qif-brain-bci-atlas.json").read_text(encoding="utf-8")).get("brain_regions", [])}
    for electrode in LAYOUT["electrodes"]:
        assert set(electrode) <= {"id", "position_mm", "arc", "share", "also_called"}
        assert electrode["id"] not in region_ids
    for lead in GEOMETRY["leads"]:
        assert set(lead) == {"id", "name", "contacts", "contact_length_mm", "contact_spacing_mm", "spacing_measure", "diameter_mm", "sources", "drafted_by"}
