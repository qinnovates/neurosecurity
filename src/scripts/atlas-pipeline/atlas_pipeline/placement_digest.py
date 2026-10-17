"""One digest over a placement: the head surface it was made on, the method's parameters and every coordinate.

Standard library only. The devices command records it; a test recomputes it from the committed files.
A match shows the committed coordinates are the ones a pipeline run wrote for this head surface. It
does not show that the rules find the right anatomy.
"""
from __future__ import annotations

import hashlib
import json
from typing import Any


def placement_digest(scalp_asset_sha256: str, method_parameters: dict[str, Any], fiducials: list[dict[str, Any]], electrodes: list[dict[str, Any]]) -> str:
    """sha256 over the canonical JSON of what was placed, on what, and with which parameters."""
    bound = {
        "scalp_asset_sha256": scalp_asset_sha256,
        "method_parameters": method_parameters,
        "fiducials": [{"id": row["id"], "position_mm": row["position_mm"]} for row in fiducials],
        "electrodes": [{"id": row["id"], "position_mm": row["position_mm"], "arc": row["arc"], "share": row["share"]} for row in electrodes],
    }
    return hashlib.sha256(json.dumps(bound, sort_keys=True, separators=(",", ":")).encode("utf-8")).hexdigest()
