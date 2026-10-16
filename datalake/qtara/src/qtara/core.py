import json
from pathlib import Path
from typing import List, Optional, Dict, Any, Union
from .models import ThreatTechnique, TaraRegistry, Variant

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
            techniques=[ThreatTechnique(**t) for t in data.get("techniques", [])],
            variants=[Variant(**v) for v in data.get("variants", [])]
        )
        self._check_variant_parents(self._registry)
        return self._registry

    @staticmethod
    def _check_variant_parents(registry: TaraRegistry) -> None:
        """A variant whose parent is not a technique in the same file is a broken registrar, not a soft miss."""
        technique_ids = {t.id for t in registry.techniques}
        orphans = [v.id for v in registry.variants if v.parent not in technique_ids]
        if orphans:
            raise ValueError(f"TARA registry: variants {orphans} name a parent that is not in techniques")

    def get_variant(self, variant_id: str) -> Optional[Variant]:
        for v in self.registry.variants:
            if v.id == variant_id:
                return v
        return None

    def list_variants(self, parent: Optional[str] = None) -> List[Variant]:
        """All variants, or the variants of one parent technique. Variants are not in list_techniques()."""
        if parent:
            return [v for v in self.registry.variants if v.parent == parent]
        return self.registry.variants

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

    def list_by_domain(self, domain: str) -> List[ThreatTechnique]:
        """Filter techniques by TARA domain (e.g., VIS, AUD, SOM)."""
        if not self._registry:
            self.load()
        domain_upper = domain.upper()
        return [
            t for t in self._registry.techniques
            if t.tara_domain_primary and t.tara_domain_primary.upper() == domain_upper
        ]

    def list_by_mode(self, mode: str) -> List[ThreatTechnique]:
        """Filter techniques by TARA mode (R=Reconnaissance, M=Manipulation, D=Disruption)."""
        if not self._registry:
            self.load()
        mode_upper = mode.upper()
        return [
            t for t in self._registry.techniques
            if t.tara_mode and t.tara_mode.upper() == mode_upper
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
            "total_variants": len(self._registry.variants),
            "by_tier": by_tier,
            "by_severity": by_severity,
            "by_status": by_status,
        }


class NissCalculator:
    """Utility to parse and evaluate NISS vectors."""
    @staticmethod
    def parse_vector(vector: str) -> dict:
        # Vector format: NISS:1.1/BI:H/CR:H/CD:H/CV:E/RV:P/NP:T
        parts = vector.split('/')
        result = {}
        for part in parts:
            if ':' in part:
                key, val = part.split(':')
                result[key] = val
        return result
