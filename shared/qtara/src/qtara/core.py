import json
from pathlib import Path
from typing import List, Optional, Dict, Any, Union
from .models import ThreatTechnique, TaraRegistry

class TaraLoader:
    def __init__(self, data_path: Optional[Path] = None):
        if data_path is None:
            data_path = Path(__file__).parent / "data" / "qtara-registrar.json"

        self.data_path = data_path
        self._registry: Optional[TaraRegistry] = None

    @property
    def registry(self) -> TaraRegistry:
        if not self._registry:
            self.load()
        return self._registry

    def load(self) -> TaraRegistry:
        if not self.data_path.exists():
            raise FileNotFoundError(f"TARA registry file not found at {self.data_path}")

        with open(self.data_path, 'r') as f:
            data = json.load(f)

        self._registry = TaraRegistry(
            version=data.get("version", "unknown"),
            framework=data.get("framework", "unknown"),
            techniques=[ThreatTechnique(**t) for t in data.get("techniques", [])]
        )
        return self._registry

    def get_technique(self, technique_id: str) -> Optional[ThreatTechnique]:
        if not self._registry:
            self.load()
        for t in self._registry.techniques:
            if t.id == technique_id:
                return t
        return None

    def list_techniques(self, band: Optional[str] = None) -> List[ThreatTechnique]:
        if not self._registry:
            self.load()
        if band:
            return [t for t in self._registry.techniques if band in t.band_ids]
        return self._registry.techniques

    def list_by_physics_tier(self, tier: Union[int, str]) -> List[ThreatTechnique]:
        if not self._registry:
            self.load()
        return [
            t for t in self._registry.techniques
            if t.physics_feasibility and t.physics_feasibility.tier == tier
        ]

    def list_by_severity(self, severity: str) -> List[ThreatTechnique]:
        if not self._registry:
            self.load()
        return [
            t for t in self._registry.techniques
            if t.severity.lower() == severity.lower()
        ]

    def get_statistics(self) -> Dict[str, Any]:
        if not self._registry:
            self.load()
        techniques = self._registry.techniques

        by_tier: Dict[str, int] = {}
        for t in techniques:
            if t.physics_feasibility:
                label = t.physics_feasibility.tier_label
            else:
                label = "unclassified"
            by_tier[label] = by_tier.get(label, 0) + 1

        by_severity: Dict[str, int] = {}
        for t in techniques:
            by_severity[t.severity] = by_severity.get(t.severity, 0) + 1

        by_status: Dict[str, int] = {}
        for t in techniques:
            by_status[t.status] = by_status.get(t.status, 0) + 1

        return {
            "total": len(techniques),
            "by_tier": by_tier,
            "by_severity": by_severity,
            "by_status": by_status,
        }


class NissCalculator:
    """Utility to parse and evaluate NISS vectors."""
    @staticmethod
    def parse_vector(vector: str) -> dict:
        # Vector format: NISS:1.0/BI:H/CG:H/CV:E/RV:P/NP:T
        parts = vector.split('/')
        result = {}
        for part in parts:
            if ':' in part:
                key, val = part.split(':')
                result[key] = val
        return result
