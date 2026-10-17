"""STIX 2.1 export of TARA techniques.

Identifiers are UUIDv5 so the same technique gets the same STIX id on every
export, and so this SDK and the website's /api/stix.json endpoint agree
(src/lib/stix-ids.ts derives the same values).
"""

import uuid
from typing import Any, Dict, List, Optional

from .models import ThreatTechnique

STIX_SPEC_VERSION = "2.1"
KILL_CHAIN_NAME = "qif-tara-tactics"
STIX_CREATED = "2026-01-01T00:00:00.000Z"
IDENTITY_SEED = "qinnovate.com"
TECHNIQUE_SEED_PREFIX = "qif.tara."

IDENTITY_ID = f"identity--{uuid.uuid5(uuid.NAMESPACE_DNS, IDENTITY_SEED)}"


def attack_pattern_id(entry_id: str) -> str:
    """Deterministic STIX id for a technique id (same name and scheme as the data/scholar-papers line)."""
    return f"attack-pattern--{uuid.uuid5(uuid.NAMESPACE_DNS, f'{TECHNIQUE_SEED_PREFIX}{entry_id}')}"


def tactic_phase_name(tactic_id: str) -> str:
    """STIX phase names are lowercase and hyphenated: QIF-N.IJ -> qif-n-ij."""
    return tactic_id.lower().replace(".", "-")


def _identity(modified: str) -> Dict[str, Any]:
    return {
        "type": "identity",
        "id": IDENTITY_ID,
        "spec_version": STIX_SPEC_VERSION,
        "created": STIX_CREATED,
        "modified": modified,
        "name": "Qinnovate Interface Framework (QIF)",
        "identity_class": "organization",
        "sectors": ["technology", "healthcare", "research"],
        "contact_information": "https://qinnovate.com",
    }


def _scoring_properties(t: ThreatTechnique) -> Dict[str, Any]:
    """QIF custom properties for severity provenance, evidence and NISS."""
    properties: Dict[str, Any] = {
        "x_qif_severity": t.severity,
        "x_qif_severity_source": t.severity_source,
        "x_qif_evidence_tier": t.evidence.tier if t.evidence else None,
    }
    if t.physics_feasibility:
        properties["x_qif_physics_tier"] = t.physics_feasibility.tier
        properties["x_qif_physics_timeline"] = t.physics_feasibility.timeline
    if t.niss:
        properties["x_qif_niss_score"] = t.niss.score
        properties["x_qif_niss_vector"] = t.niss.vector
        properties["x_qif_niss_harm_flag"] = t.niss.harm_flag
        properties["x_qif_niss_np_support"] = t.niss.np_support
    return {key: value for key, value in properties.items() if value is not None}


def _attack_pattern(t: ThreatTechnique, modified: str) -> Dict[str, Any]:
    return {
        "type": "attack-pattern",
        "id": attack_pattern_id(t.id),
        "spec_version": STIX_SPEC_VERSION,
        "created_by_ref": IDENTITY_ID,
        "created": STIX_CREATED,
        "modified": modified,
        "name": t.attack,
        "description": t.notes or t.attack,
        "kill_chain_phases": [{"kill_chain_name": KILL_CHAIN_NAME, "phase_name": tactic_phase_name(t.tactic)}],
        "external_references": [
            {"source_name": "QIF TARA", "external_id": t.id, "url": f"https://qinnovate.com/atlas/tara/{t.id}"}
        ],
        "x_qif_bands": t.bands,
        "x_qif_dual_use": t.tara.dual_use if t.tara else "unknown",
        **_scoring_properties(t),
    }


class StixExporter:
    @staticmethod
    def to_bundle(
        techniques: List[ThreatTechnique],
        include_pending: bool = False,
        modified: Optional[str] = None,
    ) -> dict:
        """Generate a STIX 2.1 bundle from TARA techniques.

        Args:
            techniques: List of ThreatTechnique objects to export.
            include_pending: If False (default), techniques with
                tara_enrichment_pending=True are excluded from the bundle.
            modified: Timestamp for the objects' `modified` property, normally
                the registrar's `generated` value. Defaults to the creation time.
        """
        if not include_pending:
            techniques = [t for t in techniques if not t.tara_enrichment_pending]
        stamp = modified or STIX_CREATED
        objects = [_identity(stamp)] + [_attack_pattern(t, stamp) for t in techniques]
        return {"type": "bundle", "id": f"bundle--{uuid.uuid4()}", "objects": objects}
