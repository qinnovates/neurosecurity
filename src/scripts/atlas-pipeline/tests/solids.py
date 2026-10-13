"""Triangle meshes of simple solids, built with the standard library, for the layout checker's tests."""
import math

from atlas_pipeline.arc_checks import Triangle, Vec

# Turns the mesh so that no edge lies exactly in a plane through the axes, where a cut would be ambiguous.
SEAM_OFFSET = 0.0137


def ellipsoid_mesh(radii: Vec, rings: int = 48, sectors: int = 96) -> list[Triangle]:
    """A closed latitude-longitude mesh of an ellipsoid centred on the origin."""
    def at(ring: int, sector: int) -> Vec:
        polar, turn = math.pi * ring / rings, 2.0 * math.pi * sector / sectors + SEAM_OFFSET
        return (radii[0] * math.sin(polar) * math.cos(turn), radii[1] * math.sin(polar) * math.sin(turn), radii[2] * math.cos(polar))

    triangles: list[Triangle] = []
    for ring in range(rings):
        for sector in range(sectors):
            a, b, c, d = at(ring, sector), at(ring + 1, sector), at(ring + 1, sector + 1), at(ring, sector + 1)
            if ring > 0:
                triangles.append((a, b, d))
            if ring < rings - 1:
                triangles.append((b, c, d))
    return triangles


def landmarks(radii: Vec) -> dict[str, Vec]:
    """Four landmarks on the ellipsoid's equator: front, back, left and right."""
    return {"nasion": (0.0, radii[1], 0.0), "inion": (0.0, -radii[1], 0.0),
            "left_preauricular": (-radii[0], 0.0, 0.0), "right_preauricular": (radii[0], 0.0, 0.0)}
