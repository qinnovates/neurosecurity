"""Head mask, landmark rules and arc placement on synthetic heads whose answers are known."""
import pytest

np = pytest.importorskip("numpy")
pytest.importorskip("scipy")

from solids import ellipsoid_mesh, landmarks  # noqa: E402

import json  # noqa: E402

from atlas_pipeline import arc_checks, devices, fiducials, layout_checks, sources  # noqa: E402
from atlas_pipeline.electrodes import place_layout  # noqa: E402
from atlas_pipeline.head_surface import head_mask  # noqa: E402
from atlas_pipeline.scalp_arcs import Scalp, arc_length, fraction_of, point_at_fraction, snap_to_surface, trace_arc  # noqa: E402

SHAPE, ORIGIN = (201, 251, 201), np.array([-100.0, -140.0, -85.0])
AFFINE = np.diag([1.0, 1.0, 1.0, 1.0])
AFFINE[:3, 3] = ORIGIN
X, Y, Z = (np.indices(SHAPE)[axis] + ORIGIN[axis] for axis in range(3))
HALF_WIDTH, HALF_DEPTH, HEIGHT, DEPTH_CENTRE = 85.0, 105.0, 100.0, -15.0
NOSE, BROW = ((0.0, 90.0, -55.0), 14.0), ((0.0, 88.0, -15.0), 8.0)
PIT, RIDGE = ((86.0, -25.0, -45.0), 9.0), ((88.0, -45.0, -45.0), 7.0)
THIN_SCALP_MM, THICK_NECK_MM, NECK_STARTS_AT = 8.0, 20.0, -30.0


def ball(centre: tuple[float, float, float], radius: float) -> np.ndarray:
    return (X - centre[0]) ** 2 + (Y - centre[1]) ** 2 + (Z - centre[2]) ** 2 <= radius ** 2


def dome() -> np.ndarray:
    """A head on a neck: a half ellipsoid over a column of the same outline."""
    return (X / HALF_WIDTH) ** 2 + ((Y - DEPTH_CENTRE) / HALF_DEPTH) ** 2 + (np.maximum(Z, 0.0) / HEIGHT) ** 2 <= 1.0


def synthetic_head() -> fiducials.Head:
    mask = dome() | ball(*NOSE) | ball(*BROW)
    for sign in (-1.0, 1.0):
        mask |= ball((sign * RIDGE[0][0], *RIDGE[0][1:]), RIDGE[1])
        mask &= ~ball((sign * PIT[0][0], *PIT[0][1:]), PIT[1])
    mask[:, :, :2] = False
    depth = HALF_DEPTH * np.sqrt(np.clip(1.0 - (np.maximum(Z, 0.0) / HEIGHT) ** 2, 0.0, 1.0)) - np.abs(Y - DEPTH_CENTRE)
    bone_at = np.where(Z > NECK_STARTS_AT, THIN_SCALP_MM, THICK_NECK_MM)
    t1 = np.where(mask, 100.0, 0.0)
    t1[mask & (depth >= bone_at) & (depth < bone_at + 6.0)] = 10.0
    return fiducials.Head(Scalp.from_mask(mask, AFFINE), t1.astype(np.float32), mask)


HEAD = synthetic_head()


def test_head_mask_fills_the_inside_and_reports_where_the_image_cuts_it() -> None:
    t1 = np.where(dome(), 60.0, 0.0).astype(np.float32)
    t1[ball((0.0, 0.0, 20.0), 30.0)] = 100.0
    t1[ball((0.0, 0.0, -30.0), 12.0)] = 0.0
    found = head_mask(t1)
    assert found.cut_faces == ("bottom",)
    assert not found.mask[:, :, 0].any() and found.mask[:, :, 1].any()
    inside_the_hole = tuple(int(v) for v in np.array([0.0, 0.0, -30.0]) - ORIGIN)
    assert found.mask[inside_the_hole] and not found.mask[0, 0, 100]
    assert abs(int(found.mask.sum()) - int(dome()[:, :, 1:].sum())) < 0.01 * dome().sum()


def test_arc_over_a_ball_is_half_a_circle_and_shares_are_shares_of_its_length() -> None:
    scalp = Scalp.from_mask(ball((0.0, 0.0, 10.0), 70.0), AFFINE)
    start, end = np.array([0.0, 70.0, 10.0]), np.array([0.0, -70.0, 10.0])
    arc = trace_arc(scalp, start, end, np.array([0.0, 0.0, 500.0]))
    assert arc_length(arc) == pytest.approx(np.pi * 70.0, rel=0.005)
    assert point_at_fraction(arc, 0.5) == pytest.approx([0.0, 0.0, 80.0], abs=0.6)
    assert fraction_of(arc, point_at_fraction(arc, 0.3)) == pytest.approx(0.3, abs=0.001)
    assert trace_arc(scalp, start, end, np.array([500.0, 0.0, 10.0]))[1800] == pytest.approx([70.0, 0.0, 10.0], abs=0.6)
    assert snap_to_surface(scalp, np.array([0.0, 20.0, 10.0]), np.array([0.0, 0.0, 10.0])) == pytest.approx([0.0, 70.0, 10.0], abs=0.6)


def test_a_ray_that_starts_outside_the_head_is_an_error_not_a_point() -> None:
    scalp = Scalp.from_mask(ball((0.0, 0.0, 10.0), 30.0), AFFINE)
    with pytest.raises(ValueError, match="never crosses the head surface"):
        snap_to_surface(scalp, np.array([0.0, 99.0, 99.0]), np.array([0.0, 90.0, 90.0]))


def test_nasion_is_the_hollow_between_brow_and_nose() -> None:
    point, facts = fiducials.find_nasion(HEAD)
    assert abs(point[0]) < 0.01 and BROW[0][2] - BROW[1] > point[2] > NOSE[0][2] + NOSE[1] - 1.0
    assert point[1] == pytest.approx(DEPTH_CENTRE + HALF_DEPTH, abs=1.0) and facts["hollow_depth_mm"] > 4.0


def test_inion_is_where_the_tissue_over_the_skull_thickens() -> None:
    point, facts = fiducials.find_inion(HEAD)
    assert point[2] == pytest.approx(NECK_STARTS_AT, abs=2.0) and point[1] == pytest.approx(DEPTH_CENTRE - HALF_DEPTH, abs=1.0)
    assert facts["scalp_thickness_mm"] == pytest.approx(THIN_SCALP_MM, abs=2.0) and facts["thickness_here_mm"] >= 1.5 * facts["scalp_thickness_mm"]


def test_inion_rule_refuses_a_head_whose_tissue_never_thickens() -> None:
    even = fiducials.Head(HEAD.scalp, np.where(HEAD.mask, 100.0, 0.0).astype(np.float32), HEAD.mask)
    with pytest.raises(ValueError, match="never thickens"):
        fiducials.find_inion(even)


@pytest.mark.parametrize(("side", "sign"), [("left", -1.0), ("right", 1.0)])
def test_preauricular_point_is_the_hollow_in_front_of_the_ridge(side: str, sign: float) -> None:
    nasion, _ = fiducials.find_nasion(HEAD)
    point, facts = fiducials.find_preauricular(HEAD, side, nasion)
    assert point[1] == pytest.approx(PIT[0][1], abs=3.0) and point[2] == pytest.approx(PIT[0][2], abs=3.0)
    assert sign * point[0] == pytest.approx(PIT[0][0] - PIT[1], abs=3.0) and facts["hollow_depth_mm"] > 3.0


def test_layout_placed_on_voxels_passes_the_separate_checker_on_a_mesh_of_the_same_head() -> None:
    radii = (75.0, 100.0, 90.0)
    solid = (X / radii[0]) ** 2 + (Y / radii[1]) ** 2 + (Z / radii[2]) ** 2 <= 1.0
    marks = landmarks(radii)
    placed, arcs = place_layout(Scalp.from_mask(solid, AFFINE), {name: np.array(point) for name, point in marks.items()})
    electrodes = {name: tuple(float(v) for v in point) for name, point in placed.items()}
    assert layout_checks.layout_problems(ellipsoid_mesh(radii), marks, electrodes) == []
    assert placed["Cz"] == pytest.approx([0.0, 0.0, radii[2]], abs=0.8)
    assert {row["id"]: row["measured_crossing"]["share"] for row in arcs if "measured_crossing" in row}["ear_to_ear"] == pytest.approx(0.5, abs=0.005)
    lifted = {**electrodes, "Fz": arc_checks.add_scaled(electrodes["Fz"], (0.0, 0.0, 1.0), 5.0)}
    assert layout_checks.layout_problems(ellipsoid_mesh(radii), marks, lifted) != []


def test_recorded_method_parameters_are_the_ones_in_the_code() -> None:
    recorded = json.loads((sources.PIPELINE_DIR / "evidence" / "device-placement.json").read_text(encoding="utf-8"))["method_parameters"]
    assert recorded == json.loads(json.dumps(devices.method_parameters()))
    assert recorded["fiducials"]["THICKENING_FACTOR"] == fiducials.THICKENING_FACTOR == 1.5
    assert recorded["head_surface"]["OTSU_SHARE"] == 0.5
