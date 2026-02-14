import uuid
from typing import List, Any
from .models import ThreatTechnique

class StixExporter:
    @staticmethod
    def to_bundle(techniques: List[ThreatTechnique]) -> dict:
        stix_objects = []
        
        # 1. Identity Object (Qinnovate)
        identity_id = "identity--qinnovate-tara"
        stix_objects.append({
            "type": "identity",
            "id": identity_id,
            "spec_version": "2.1",
            "created": "2026-01-01T00:00:00.000Z",
            "modified": "2026-02-14T00:00:00.000Z",
            "name": "Qinnovate Interface Framework (QIF)",
            "identity_class": "organization",
            "sectors": ["technology", "healthcare", "research"],
            "contact_information": "security@qinnovate.com"
        })

        for t in techniques:
            # 2. Attack Pattern Object
            # Deterministic UUID for demo stability
            attack_id = f"attack-pattern--{uuid.uuid5(uuid.NAMESPACE_DNS, f'qif.tara.{t.id}')}"
            
            stix_attack = {
                "type": "attack-pattern",
                "id": attack_id,
                "spec_version": "2.1",
                "created": "2026-01-01T00:00:00.000Z",
                "modified": "2026-02-14T00:00:00.000Z",
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
            stix_objects.append(stix_attack)

        return {
            "type": "bundle",
            "id": f"bundle--{uuid.uuid4()}",
            "spec_version": "2.1",
            "objects": stix_objects
        }
