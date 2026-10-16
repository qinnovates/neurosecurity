import uuid
from typing import Dict, List, Any, Optional
from .models import ThreatTechnique, Variant

STIX_CREATED = "2026-01-01T00:00:00.000Z"
STIX_MODIFIED = "2026-02-18T00:00:00.000Z"
# A variant points at its parent with the standard STIX 2.1 common relationship `related-to`.
# `derived-from` is the other standard candidate, but the specification defines it for an object whose
# information was derived from another object (provenance between versions or producers), which is not
# what a variant is. ATT&CK's `subtechnique-of` is a custom type and is deliberately not used. The
# specific meaning travels in the description and in x_qif_relationship.
VARIANT_RELATIONSHIP_TYPE = "related-to"
VARIANT_RELATIONSHIP_LABEL = "variant-of"


def attack_pattern_id(entry_id: str) -> str:
    """Deterministic STIX id for a technique or variant id."""
    return f"attack-pattern--{uuid.uuid5(uuid.NAMESPACE_DNS, f'qif.tara.{entry_id}')}"


def variant_attack_pattern(variant: Variant, parent: ThreatTechnique) -> Dict[str, Any]:
    """A variant as an attack-pattern. Its scoring state is its own; only an inherited vector is read from the parent."""
    pattern: Dict[str, Any] = {
        "type": "attack-pattern",
        "id": attack_pattern_id(variant.id),
        "spec_version": "2.1",
        "created": STIX_CREATED,
        "modified": STIX_MODIFIED,
        "name": variant.name,
        "description": variant.description,
        "external_references": [
            {
                "source_name": "QIF TARA",
                "external_id": variant.id,
                "url": f"https://qinnovate.com/atlas/tara/{parent.id}/#{variant.id}"
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


def variant_relationship(variant: Variant) -> Dict[str, Any]:
    """The variant-to-parent link: source is the variant, target is the parent technique."""
    return {
        "type": "relationship",
        "id": f"relationship--{uuid.uuid5(uuid.NAMESPACE_DNS, f'qif.tara.{variant.id}.variant-of.{variant.parent}')}",
        "spec_version": "2.1",
        "created": STIX_CREATED,
        "modified": STIX_MODIFIED,
        "relationship_type": VARIANT_RELATIONSHIP_TYPE,
        "description": f"{variant.id} is a variant of {variant.parent}; it differs in {variant.differs_in}.",
        "source_ref": attack_pattern_id(variant.id),
        "target_ref": attack_pattern_id(variant.parent),
        "x_qif_relationship": VARIANT_RELATIONSHIP_LABEL,
    }


class StixExporter:
    @staticmethod
    def to_bundle(techniques: List[ThreatTechnique], include_pending: bool = False,
                  variants: Optional[List[Variant]] = None) -> dict:
        """Generate a STIX 2.1 bundle from TARA techniques and, when given, their variants.

        Args:
            techniques: List of ThreatTechnique objects to export.
            include_pending: If False (default), techniques with
                tara_enrichment_pending=True are excluded from the bundle.
            variants: Variants to export. Each becomes an attack-pattern plus a
                relationship to its parent. A variant whose parent is not in the
                bundle is left out, so no relationship points at a missing object.
        """
        # Filter out skeleton/unenriched techniques unless explicitly included
        if not include_pending:
            techniques = [t for t in techniques if not t.tara_enrichment_pending]

        stix_objects = []

        # 1. Identity Object (Qinnovate)
        identity_id = "identity--qinnovate-tara"
        stix_objects.append({
            "type": "identity",
            "id": identity_id,
            "spec_version": "2.1",
            "created": "2026-01-01T00:00:00.000Z",
            "modified": "2026-02-18T00:00:00.000Z",
            "name": "Qinnovate Interface Framework (QIF)",
            "identity_class": "organization",
            "sectors": ["technology", "healthcare", "research"],
            "contact_information": "https://qinnovate.com"
        })

        for t in techniques:
            # 2. Attack Pattern Object
            # Deterministic UUID for demo stability
            attack_id = attack_pattern_id(t.id)

            stix_attack = {
                "type": "attack-pattern",
                "id": attack_id,
                "spec_version": "2.1",
                "created": "2026-01-01T00:00:00.000Z",
                "modified": "2026-02-18T00:00:00.000Z",
                "name": t.attack,
                "description": t.notes or t.attack,
                "kill_chain_phases": [
                    {
                        "kill_chain_name": "qif-interaction-chain",
                        "phase_name": "exploitation"
                    }
                ],
                "external_references": [
                    {
                        "source_name": "QIF TARA",
                        "external_id": t.id,
                        "url": f"https://qinnovate.com/TARA/{t.id}"
                    }
                ],
                "x_qif_severity": t.severity,
                "x_qif_bands": t.bands,
                "x_qif_dual_use": t.tara.dual_use if t.tara else "unknown"
            }

            if t.physics_feasibility:
                stix_attack["x_qif_physics_tier"] = t.physics_feasibility.tier
                if t.physics_feasibility.timeline is not None:
                    stix_attack["x_qif_physics_timeline"] = t.physics_feasibility.timeline

            if t.niss:
                stix_attack["x_qif_niss_scoring_state"] = t.niss.scoring_state
                if t.niss.scoring_state == "scored":
                    stix_attack["x_qif_niss_score"] = t.niss.score
                    stix_attack["x_qif_niss_vector"] = t.niss.vector
                elif t.niss.scoring_state == "provisional":
                    stix_attack["x_qif_niss_score_min"] = t.niss.score_min
                    stix_attack["x_qif_niss_score_max"] = t.niss.score_max
                elif t.niss.unscored_reason:
                    stix_attack["x_qif_niss_unscored_reason"] = t.niss.unscored_reason

            stix_objects.append(stix_attack)

        exported_by_id = {t.id: t for t in techniques}
        for variant in variants or []:
            parent = exported_by_id.get(variant.parent)
            if parent is None:
                continue
            stix_objects.append(variant_attack_pattern(variant, parent))
            stix_objects.append(variant_relationship(variant))

        return {
            "type": "bundle",
            "id": f"bundle--{uuid.uuid4()}",
            "spec_version": "2.1",
            "objects": stix_objects
        }
