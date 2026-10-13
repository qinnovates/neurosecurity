"""The 10-20 electrode layout, placed by shares of measured arc length over the template scalp.

Order of construction, as the system defines it: the midline arc from nasion to inion; the arc from
ear to ear through the vertex; the two half-circumferences through the temporal positions; and the
frontal and parietal arcs between them.
"""
from __future__ import annotations

from typing import Any

import numpy as np

from .layout_1020 import ARCS, CROSSINGS, ELECTRODE_ORDER
from .scalp_arcs import Scalp, arc_length, fraction_of, point_at_fraction, trace_arc


def _top_of_midline(points: dict[str, np.ndarray]) -> np.ndarray:
    """A point far above the head in the plane that holds nasion and inion and stands square to the ear-to-ear line."""
    forward = points["nasion"] - points["inion"]
    across = points["right_preauricular"] - points["left_preauricular"]
    across = across - forward * float(across @ forward) / float(forward @ forward)
    upward = np.cross(across, forward)
    return (points["nasion"] + points["inion"]) / 2.0 + upward / float(np.linalg.norm(upward)) * 1000.0


def place_layout(scalp: Scalp, fiducials: dict[str, np.ndarray]) -> tuple[dict[str, np.ndarray], list[dict[str, Any]]]:
    """Electrode positions in millimetres, and for each arc its measured length and where each position falls on it."""
    points = dict(fiducials)
    records: list[dict[str, Any]] = []
    for arc_id, start, end, through, shares in ARCS:
        toward = _top_of_midline(points) if through == "top" else points[through]
        polyline = trace_arc(scalp, points[start], points[end], toward)
        for name, share in shares.items():
            points[name] = point_at_fraction(polyline, share)
        record: dict[str, Any] = {"id": arc_id, "from": start, "to": end, "through": through, "length_mm": round(arc_length(polyline), 1),
                                  "shares": dict(shares)}
        if arc_id in CROSSINGS:
            record["measured_crossing"] = {"electrode": CROSSINGS[arc_id], "share": round(fraction_of(polyline, points[CROSSINGS[arc_id]]), 4)}
        records.append(record)
    return {name: points[name] for name in ELECTRODE_ORDER}, records
