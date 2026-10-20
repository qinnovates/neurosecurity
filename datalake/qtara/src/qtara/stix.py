"""STIX 2.1 export of TARA techniques and their variants.

Identifiers are UUIDv5 so the same technique gets the same STIX id on every
export, and so this SDK and the website agree (src/lib/stix-ids.ts derives the
same values; both are pinned to tests/fixtures/stix_ids.json).
"""

import uuid
from typing import Any, Dict, List, Optional

from .models import ThreatTechnique, Variant

STIX_SPEC_VERSION = "2.1"
KILL_CHAIN_NAME = "qif-tara-tactics"
STIX_CREATED = "2026-01-01T00:00:00.000Z"
IDENTITY_SEED = "qinnovate.com"
TECHNIQUE_SEED_PREFIX = "qif.tara."
# A variant points at its parent with the standard STIX 2.1 common relationship `related-to`.
# `derived-from` is the other standard candidate, but the specification defines it for an object whose
# information was derived from another object (provenance between versions or producers), which is not
# what a variant is. ATT&CK's `subtechnique-of` is a custom type and is deliberately not used. The
# specific meaning travels in the description and in x_qif_relationship.
VARIANT_RELATIONSHIP_TYPE = "related-to"
VARIANT_RELATIONSHIP_LABEL = "variant-of"

IDENTITY_ID = f"identity--{uuid.uuid5(uuid.NAMESPACE_DNS, IDENTITY_SEED)}"


def attack_pattern_id(entry_id: str) -> str:
    """Deterministic STIX id for a technique or variant id."""
    return f"attack-pattern--{uuid.uuid5(uuid.NAMESPACE_DNS, f'{TECHNIQUE_SEED_PREFIX}{entry_id}')}"


def variant_relationship_id(variant_id: str, parent_id: str) -> str:
    """Deterministic STIX id for the variant-to-parent relationship."""
    seed = f"{TECHNIQUE_SEED_PREFIX}{variant_id}.{VARIANT_RELATIONSHIP_LABEL}.{parent_id}"
    return f"relationship--{uuid.uuid5(uuid.NAMESPACE_DNS, seed)}"


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


def _niss_properties(t: ThreatTechnique) -> Dict[str, Any]:
    """NISS properties that follow the scoring state: a score only when scored, a range when provisional."""
    niss = t.niss
    if not niss:
        return {}
    properties: Dict[str, Any] = {
        "x_qif_niss_scoring_state": niss.scoring_state,
        "x_qif_niss_harm_flag": niss.harm_flag,
        "x_qif_niss_cognitive_flag": niss.cognitive_flag,
        "x_qif_niss_np_support": niss.np_support,
    }
    if niss.scoring_state == "scored":
        properties["x_qif_niss_score"] = niss.score
        properties["x_qif_niss_vector"] = niss.vector
    elif niss.scoring_state == "provisional":
        properties["x_qif_niss_score_min"] = niss.score_min
        properties["x_qif_niss_score_max"] = niss.score_max
    elif niss.unscored_reason:
        properties["x_qif_niss_unscored_reason"] = niss.unscored_reason
    return properties


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
    properties.update(_niss_properties(t))
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


def _variant_attack_pattern(variant: Variant, parent: ThreatTechnique, modified: str) -> Dict[str, Any]:
    """A variant as an attack-pattern. Its scoring state is its own; only an inherited vector is read from the parent."""
    pattern: Dict[str, Any] = {
        "type": "attack-pattern",
        "id": attack_pattern_id(variant.id),
        "spec_version": STIX_SPEC_VERSION,
        "created_by_ref": IDENTITY_ID,
        "created": STIX_CREATED,
        "modified": modified,
        "name": variant.name,
        "description": variant.description,
        "kill_chain_phases": [{"kill_chain_name": KILL_CHAIN_NAME, "phase_name": tactic_phase_name(parent.tactic)}],
        "external_references": [
            {
                "source_name": "QIF TARA",
                "external_id": variant.id,
                "url": f"https://qinnovate.com/atlas/tara/{parent.id}/#{variant.id}",
            }
        ],
        "x_qif_variant_of": parent.id,
        "x_qif_alias": variant.alias,
        "x_qif_differs_in": variant.differs_in,
        "x_qif_status": variant.status,
        "x_qif_peer_review_status": variant.peer_review_status,
        "x_qif_niss_scoring_state": variant.niss.scoring_state,
    }
    if variant.inherits_niss and parent.niss and parent.niss.scoring_state == "scored":
        pattern["x_qif_niss_score"] = parent.niss.score
        pattern["x_qif_niss_vector"] = parent.niss.vector
        pattern["x_qif_niss_inherited_from"] = parent.id
    elif variant.niss.unscored_reason:
        pattern["x_qif_niss_unscored_reason"] = variant.niss.unscored_reason
    return pattern


def _variant_relationship(variant: Variant, modified: str) -> Dict[str, Any]:
    """The variant-to-parent link: source is the variant, target is the parent technique."""
    return {
        "type": "relationship",
        "id": variant_relationship_id(variant.id, variant.parent),
        "spec_version": STIX_SPEC_VERSION,
        "created_by_ref": IDENTITY_ID,
        "created": STIX_CREATED,
        "modified": modified,
        "relationship_type": VARIANT_RELATIONSHIP_TYPE,
        "description": f"{variant.id} is a variant of {variant.parent}; it differs in {variant.differs_in}.",
        "source_ref": attack_pattern_id(variant.id),
        "target_ref": attack_pattern_id(variant.parent),
        "x_qif_relationship": VARIANT_RELATIONSHIP_LABEL,
    }


class StixExporter:
    @staticmethod
    def to_bundle(
        techniques: List[ThreatTechnique],
        include_pending: bool = False,
        modified: Optional[str] = None,
        variants: Optional[List[Variant]] = None,
    ) -> dict:
        """Generate a STIX 2.1 bundle from TARA techniques and, when given, their variants.

        Args:
            techniques: List of ThreatTechnique objects to export.
            include_pending: If False (default), techniques with
                tara_enrichment_pending=True are excluded from the bundle.
            modified: Timestamp for the objects' `modified` property, normally
                the registrar's `generated` value. Defaults to the creation time.
            variants: Variants to export. Each becomes an attack-pattern plus a
                relationship to its parent. A variant whose parent is not in the
                bundle is left out, so no relationship points at a missing object.
        """
        if not include_pending:
            techniques = [t for t in techniques if not t.tara_enrichment_pending]
        stamp = modified or STIX_CREATED
        objects = [_identity(stamp)] + [_attack_pattern(t, stamp) for t in techniques]
        exported_by_id = {t.id: t for t in techniques}
        for variant in variants or []:
            parent = exported_by_id.get(variant.parent)
            if parent is None:
                continue
            objects.append(_variant_attack_pattern(variant, parent, stamp))
            objects.append(_variant_relationship(variant, stamp))
        return {"type": "bundle", "id": f"bundle--{uuid.uuid4()}", "objects": objects}
